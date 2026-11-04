import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import scholarshipsData from "../supabase/seed/scholarships.json";
import testUsersData from "../supabase/seed/test-users.json";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  );
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log("Starting ScholarBridge database seed...");

  // 1. Seed or ensure admin user exists for verification_logs foreign key
  const adminUser = testUsersData.find((u) => u.role === "admin");
  if (adminUser) {
    console.log(
      `Seeding admin profile: ${adminUser.display_name} (${adminUser.id})...`
    );
    const { error: adminError } = await supabase.from("profiles").upsert(
      {
        id: adminUser.id,
        role: "admin",
        display_name: adminUser.display_name,
      },
      { onConflict: "id" }
    );
    if (adminError) {
      console.warn(
        "Notice: could not upsert admin profile (auth user may need to be created first in Supabase Auth):",
        adminError.message
      );
    }
  }

  // 2. Seed all 16 scholarships idempotently by code
  console.log(`Seeding ${scholarshipsData.length} scholarships...`);

  for (const sch of scholarshipsData) {
    console.log(`Processing scholarship [${sch.code}] ${sch.name}...`);

    // Upsert core scholarship record
    const { data: scholarshipRow, error: schError } = await supabase
      .from("scholarships")
      .upsert(
        {
          code: sch.code,
          slug: sch.slug,
          name: sch.name,
          provider_name: sch.provider_name,
          provider_type:
            sch.provider_type as Database["public"]["Tables"]["scholarships"]["Row"]["provider_type"],
          funding_type:
            sch.funding_type as Database["public"]["Tables"]["scholarships"]["Row"]["funding_type"],
          description: sch.description,
          benefits_summary: sch.benefits_summary,
          max_annual_benefit_inr: sch.max_annual_benefit_inr,
          eligibility_summary: sch.eligibility_summary,
          application_instructions: sch.application_instructions,
          application_open_date: sch.application_open_date,
          student_deadline_at: sch.student_deadline_at,
          institute_verification_deadline_at:
            sch.institute_verification_deadline_at,
          state_nodal_deadline_at: sch.state_nodal_deadline_at,
          is_deadline_verified: sch.is_deadline_verified,
          fresh_applications_open: sch.fresh_applications_open,
          renewal_applications_open: sch.renewal_applications_open,
          official_source_url: sch.official_source_url,
          official_application_url: sch.official_application_url,
          verification_status:
            sch.verification_status as Database["public"]["Tables"]["scholarships"]["Row"]["verification_status"],
          last_verified_at: sch.last_verified_at,
          is_active: sch.is_active,
        },
        { onConflict: "code" }
      )
      .select("id")
      .single();

    if (schError || !scholarshipRow) {
      console.error(
        `Failed to upsert scholarship [${sch.code}]:`,
        schError?.message
      );
      continue;
    }

    const scholarshipId = scholarshipRow.id;

    // Upsert eligibility rules (version 1)
    const { error: ruleError } = await supabase
      .from("scholarship_eligibility_rules")
      .upsert(
        {
          scholarship_id: scholarshipId,
          version: 1,
          allowed_education_levels:
            sch.allowed_education_levels as Database["public"]["Tables"]["scholarship_eligibility_rules"]["Row"]["allowed_education_levels"],
          max_income_inr: sch.max_income_inr,
          allowed_states: sch.allowed_states,
          allowed_courses: sch.allowed_courses,
          rule_ast: sch.rule_ast,
          eligibility_source_citation: sch.eligibility_source_citation,
        },
        { onConflict: "scholarship_id,version" }
      );

    if (ruleError) {
      console.error(
        `Failed to upsert rules for [${sch.code}]:`,
        ruleError.message
      );
    }

    // Replace documents
    await supabase
      .from("scholarship_documents")
      .delete()
      .eq("scholarship_id", scholarshipId);
    if (sch.documents && sch.documents.length > 0) {
      const docsToInsert = sch.documents.map((doc) => ({
        scholarship_id: scholarshipId,
        document_name: doc.document_name,
        specification_notes: doc.specification_notes,
        is_mandatory: doc.is_mandatory,
        issuing_authority: doc.issuing_authority,
        sort_order: doc.sort_order,
      }));
      const { error: docError } = await supabase
        .from("scholarship_documents")
        .insert(docsToInsert);
      if (docError) {
        console.error(
          `Failed to insert documents for [${sch.code}]:`,
          docError.message
        );
      }
    }

    // Replace sources
    await supabase
      .from("scholarship_sources")
      .delete()
      .eq("scholarship_id", scholarshipId);
    if (sch.sources && sch.sources.length > 0) {
      const sourcesToInsert = sch.sources.map((src) => ({
        scholarship_id: scholarshipId,
        source_title: src.source_title,
        source_url: src.source_url,
        guideline_pdf_url: src.guideline_pdf_url,
        is_primary_government_portal: src.is_primary_government_portal,
      }));
      const { error: srcError } = await supabase
        .from("scholarship_sources")
        .insert(sourcesToInsert);
      if (srcError) {
        console.error(
          `Failed to insert sources for [${sch.code}]:`,
          srcError.message
        );
      }
    }

    // Write initial verification log if admin exists
    if (adminUser) {
      await supabase.from("verification_logs").insert({
        scholarship_id: scholarshipId,
        admin_user_id: adminUser.id,
        previous_status: null,
        new_status:
          sch.verification_status as Database["public"]["Tables"]["verification_logs"]["Row"]["new_status"],
        verified_source_url: sch.official_source_url,
        change_summary:
          "Initial verified seed entry for AY 2026-27 (Reference Date: 2026-11-04)",
      });
    }
  }

  console.log("Seeding complete! 16 scholarships processed.");
}

seed().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
