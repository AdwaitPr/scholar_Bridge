import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminScholarshipUpsertSchema } from "@/lib/schemas/admin.schema";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Server-side Admin Role Verification (P7-T1)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = AdminScholarshipUpsertSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;
    const adminClient = createAdminClient();

    // 1. Check existing scholarship to capture previous verification status
    const { data: existingScholarship } = await adminClient
      .from("scholarships")
      .select("id, verification_status")
      .eq("code", input.code)
      .maybeSingle();

    const previousStatus = existingScholarship?.verification_status || null;

    // 2. Upsert scholarship record
    const { data: scholarship, error: schError } = await adminClient
      .from("scholarships")
      .upsert(
        {
          id: existingScholarship?.id,
          code: input.code,
          slug: input.slug,
          name: input.name,
          provider_name: input.provider_name,
          provider_type: input.provider_type,
          funding_type: input.funding_type,
          description: input.description,
          benefits_summary: input.benefits_summary,
          max_annual_benefit_inr: input.max_annual_benefit_inr,
          eligibility_summary: input.eligibility_summary,
          application_instructions: input.application_instructions,
          application_open_date: input.application_open_date,
          student_deadline_at: input.student_deadline_at,
          institute_verification_deadline_at:
            input.institute_verification_deadline_at,
          state_nodal_deadline_at: input.state_nodal_deadline_at,
          is_deadline_verified: input.is_deadline_verified,
          fresh_applications_open: input.fresh_applications_open,
          renewal_applications_open: input.renewal_applications_open,
          official_source_url: input.official_source_url,
          official_application_url: input.official_application_url,
          verification_status: input.verification_status,
          is_active: input.is_active,
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "code" }
      )
      .select()
      .single();

    if (schError || !scholarship) {
      return NextResponse.json(
        { error: schError?.message || "Failed to upsert scholarship" },
        { status: 500 }
      );
    }

    // 3. Rule Versioning (P7-T6): fetch highest version and increment
    const { data: existingRules } = await adminClient
      .from("scholarship_eligibility_rules")
      .select("version")
      .eq("scholarship_id", scholarship.id)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = (existingRules?.[0]?.version ?? 0) + 1;

    const { error: ruleError } = await adminClient
      .from("scholarship_eligibility_rules")
      .insert({
        scholarship_id: scholarship.id,
        version: nextVersion,
        allowed_education_levels: input.allowed_education_levels,
        max_income_inr: input.max_income_inr,
        allowed_states: input.allowed_states,
        allowed_courses: input.allowed_courses,
        rule_ast: input.rule_ast,
        eligibility_source_citation: input.eligibility_source_citation,
      });

    if (ruleError) {
      return NextResponse.json(
        { error: `Failed to insert rule version: ${ruleError.message}` },
        { status: 500 }
      );
    }

    // 4. Update Document Templates if provided
    if (input.documents && input.documents.length > 0) {
      await adminClient
        .from("scholarship_documents")
        .delete()
        .eq("scholarship_id", scholarship.id);

      const docsToInsert = input.documents.map((d) => ({
        scholarship_id: scholarship.id,
        document_name: d.document_name,
        specification_notes: d.specification_notes,
        is_mandatory: d.is_mandatory,
        issuing_authority: d.issuing_authority,
        sort_order: d.sort_order,
      }));

      await adminClient.from("scholarship_documents").insert(docsToInsert);
    }

    // 5. Update Sources if provided
    if (input.sources && input.sources.length > 0) {
      await adminClient
        .from("scholarship_sources")
        .delete()
        .eq("scholarship_id", scholarship.id);

      const sourcesToInsert = input.sources.map((s) => ({
        scholarship_id: scholarship.id,
        source_title: s.source_title,
        source_url: s.source_url,
        guideline_pdf_url: s.guideline_pdf_url,
        is_primary_government_portal: s.is_primary_government_portal,
        last_checked_at: new Date().toISOString(),
      }));

      await adminClient.from("scholarship_sources").insert(sourcesToInsert);
    }

    // 6. Record Audit Log in verification_logs (P7-T5, P7-T7)
    await adminClient.from("verification_logs").insert({
      scholarship_id: scholarship.id,
      admin_user_id: user.id,
      previous_status: previousStatus,
      new_status: input.verification_status,
      verified_source_url: input.official_source_url,
      change_summary: input.verification_note,
      verified_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      scholarship_id: scholarship.id,
      version: nextVersion,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
