import { NextRequest, NextResponse } from "next/server";
import { ScholarshipCatalogRepository } from "@/modules/scholarship-catalog/repository";
import { evaluateScholarshipDeadline } from "@/modules/deadline-management/deadline.service";
import { evaluateScholarshipEligibility } from "@/modules/eligibility-engine/evaluator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const scholarship = await ScholarshipCatalogRepository.getBySlug(slug);

    if (!scholarship) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: `Scholarship with slug "${slug}" not found`,
          },
        },
        { status: 404 }
      );
    }

    // Authenticated user check for live eligibility matching
    let studentProfile = null;
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        studentProfile = profile;
      }
    } catch {
      // Anonymous
    }

    const ruleRecord = scholarship.scholarship_eligibility_rules?.[0];
    const isRenewalOnly =
      scholarship.verification_status === "verified_renewal_only" ||
      !scholarship.fresh_applications_open;

    const deadlineEvaluation = evaluateScholarshipDeadline(
      scholarship.student_deadline_at,
      scholarship.is_deadline_verified,
      scholarship.institute_verification_deadline_at,
      scholarship.state_nodal_deadline_at,
      { isRenewalOnly }
    );

    const eligibilityEvaluation =
      studentProfile && ruleRecord?.rule_ast
        ? evaluateScholarshipEligibility(
            scholarship.id,
            ruleRecord.rule_ast as never,
            studentProfile,
            { freshApplicationsOpen: scholarship.fresh_applications_open }
          )
        : null;

    return NextResponse.json({
      scholarship: {
        ...scholarship,
        deadlineEvaluation,
        eligibilityEvaluation,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "SCHOLARSHIP_FETCH_ERROR",
          message: err instanceof Error ? err.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
