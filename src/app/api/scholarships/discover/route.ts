import { NextRequest, NextResponse } from "next/server";
import { DiscoveryQuerySchema } from "@/lib/schemas";
import { ScholarshipCatalogRepository } from "@/modules/scholarship-catalog/repository";
import { evaluateScholarshipDeadline } from "@/modules/deadline-management/deadline.service";
import { evaluateScholarshipEligibility } from "@/modules/eligibility-engine/evaluator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    const parsed = DiscoveryQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PARAMETERS",
            message: "Invalid discovery search parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const filters = parsed.data;

    // 1. Check if an authenticated student profile exists
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
      // Unauthenticated browse is allowed
    }

    // 2. Fetch scholarships from repository
    const result = await ScholarshipCatalogRepository.list(filters);

    // 3. Enrich items with deadlineEvaluation and eligibilityEvaluation
    const enrichedResults = result.items
      .map((sch) => {
        const ruleRecord = sch.scholarship_eligibility_rules?.[0];
        const isRenewalOnly =
          sch.verification_status === "verified_renewal_only" ||
          !sch.fresh_applications_open;

        const deadlineInfo = evaluateScholarshipDeadline(
          sch.student_deadline_at,
          sch.is_deadline_verified,
          sch.institute_verification_deadline_at,
          sch.state_nodal_deadline_at,
          { isRenewalOnly }
        );

        if (filters.hide_expired && deadlineInfo.isExpired) {
          return null;
        }

        if (
          filters.deadline_within_days &&
          deadlineInfo.daysRemaining !== null &&
          deadlineInfo.daysRemaining > filters.deadline_within_days
        ) {
          return null;
        }

        const eligibilityEvaluation =
          studentProfile && ruleRecord?.rule_ast
            ? evaluateScholarshipEligibility(
                sch.id,
                ruleRecord.rule_ast as never,
                studentProfile,
                { freshApplicationsOpen: sch.fresh_applications_open }
              )
            : null;

        return {
          ...sch,
          deadlineEvaluation: deadlineInfo,
          eligibilityEvaluation,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({
      total: result.total,
      count: enrichedResults.length,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      results: enrichedResults,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "DISCOVERY_ERROR",
          message: err instanceof Error ? err.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
