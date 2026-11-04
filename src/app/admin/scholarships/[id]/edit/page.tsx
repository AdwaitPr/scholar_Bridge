import React from "react";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminScholarshipForm } from "@/modules/admin/components/admin-scholarship-form";
import seedScholarships from "../../../../../../supabase/seed/scholarships.json";
import type { AdminScholarshipUpsertInput } from "@/lib/schemas/admin.schema";
import type { RuleNode } from "@/lib/schemas/rule-ast.schema";

interface EditScholarshipPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditScholarshipPage({
  params,
}: EditScholarshipPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/admin/scholarships/${id}/edit`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  let scholarshipData: Partial<AdminScholarshipUpsertInput> | null = null;

  try {
    const { data: sch } = await supabase
      .from("scholarships")
      .select(
        `
        *,
        scholarship_eligibility_rules (*),
        scholarship_documents (*),
        scholarship_sources (*)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (sch) {
      const rule = sch.scholarship_eligibility_rules?.[0];
      scholarshipData = {
        code: sch.code,
        slug: sch.slug,
        name: sch.name,
        provider_name: sch.provider_name,
        provider_type:
          sch.provider_type as AdminScholarshipUpsertInput["provider_type"],
        funding_type:
          sch.funding_type as AdminScholarshipUpsertInput["funding_type"],
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
        verification_status: sch.verification_status,
        verification_note: "",
        is_active: sch.is_active,
        allowed_education_levels: rule?.allowed_education_levels || [],
        max_income_inr: rule?.max_income_inr,
        allowed_states: rule?.allowed_states,
        allowed_courses: rule?.allowed_courses,
        rule_ast: rule?.rule_ast as unknown as RuleNode,
        eligibility_source_citation: rule?.eligibility_source_citation || "",
      };
    }
  } catch {
    // Database unpopulated
  }

  // Fallback to seed data
  if (!scholarshipData) {
    const seed = seedScholarships.find(
      (s) =>
        `seed-${s.code.toLowerCase()}` === id ||
        s.code.toLowerCase() === id.toLowerCase() ||
        s.slug === id
    );

    if (seed) {
      scholarshipData = {
        code: seed.code,
        slug: seed.slug,
        name: seed.name,
        provider_name: seed.provider_name,
        provider_type:
          seed.provider_type as AdminScholarshipUpsertInput["provider_type"],
        funding_type:
          seed.funding_type as AdminScholarshipUpsertInput["funding_type"],
        description: seed.description,
        benefits_summary: seed.benefits_summary,
        max_annual_benefit_inr: seed.max_annual_benefit_inr,
        eligibility_summary: seed.eligibility_summary,
        application_instructions: seed.application_instructions,
        application_open_date: seed.application_open_date,
        student_deadline_at: seed.student_deadline_at,
        institute_verification_deadline_at:
          seed.institute_verification_deadline_at,
        state_nodal_deadline_at: seed.state_nodal_deadline_at,
        is_deadline_verified: seed.is_deadline_verified,
        fresh_applications_open: seed.fresh_applications_open,
        renewal_applications_open: seed.renewal_applications_open,
        official_source_url: seed.official_source_url,
        official_application_url: seed.official_application_url,
        verification_status:
          seed.verification_status as AdminScholarshipUpsertInput["verification_status"],
        verification_note: "",
        is_active: seed.is_active,
        allowed_education_levels:
          seed.allowed_education_levels as AdminScholarshipUpsertInput["allowed_education_levels"],
        max_income_inr: seed.max_income_inr,
        allowed_states: seed.allowed_states,
        allowed_courses: seed.allowed_courses,
        rule_ast: seed.rule_ast as unknown as RuleNode,
        eligibility_source_citation: seed.eligibility_source_citation,
      };
    }
  }

  if (!scholarshipData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <AdminScholarshipForm initialData={scholarshipData} isEditing={true} />
    </div>
  );
}
