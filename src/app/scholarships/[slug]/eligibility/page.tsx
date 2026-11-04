import React from "react";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ScholarshipCatalogRepository } from "@/modules/scholarship-catalog/repository";
import { evaluateScholarshipEligibility } from "@/modules/eligibility-engine/evaluator";
import { EligibilityDiagnostics } from "@/modules/eligibility-engine/components/eligibility-diagnostics";
import type { RuleNode, StudentProfileInput } from "@/lib/schemas";

interface EligibilityPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ScholarshipEligibilityPage({
  params,
}: EligibilityPageProps) {
  const { slug } = await params;
  const scholarship = await ScholarshipCatalogRepository.getBySlug(slug);

  if (!scholarship) {
    notFound();
  }

  const ruleRecord = scholarship.scholarship_eligibility_rules?.[0];
  if (!ruleRecord) {
    notFound();
  }

  let profile: Partial<StudentProfileInput> | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profileRecord } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = profileRecord as unknown as StudentProfileInput;
    }
  } catch {
    // Unauthenticated
  }

  const evaluation = evaluateScholarshipEligibility(
    scholarship.id,
    ruleRecord.rule_ast as unknown as RuleNode,
    (profile || {}) as StudentProfileInput,
    { freshApplicationsOpen: scholarship.fresh_applications_open }
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <EligibilityDiagnostics
          scholarship={scholarship}
          initialEvaluation={evaluation}
          initialProfile={profile}
          ruleAst={ruleRecord.rule_ast as unknown as RuleNode}
        />
      </div>
    </div>
  );
}
