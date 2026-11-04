import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { StudentProfileSchema } from "@/lib/schemas";
import { ScholarshipCatalogRepository } from "@/modules/scholarship-catalog/repository";
import { evaluateScholarshipEligibility } from "@/modules/eligibility-engine/evaluator";

const EvaluateRequestSchema = z.object({
  scholarshipId: z.string().min(1, "Scholarship ID or slug is required"),
  profile: StudentProfileSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = EvaluateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid evaluation request payload",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { scholarshipId, profile } = parsed.data;

    // Find scholarship by slug or code
    const scholarship =
      await ScholarshipCatalogRepository.getBySlug(scholarshipId);

    if (!scholarship) {
      return NextResponse.json(
        {
          error: {
            code: "SCHOLARSHIP_NOT_FOUND",
            message: `Scholarship "${scholarshipId}" not found`,
          },
        },
        { status: 404 }
      );
    }

    const ruleRecord = scholarship.scholarship_eligibility_rules?.[0];
    if (!ruleRecord?.rule_ast) {
      return NextResponse.json(
        {
          error: {
            code: "NO_RULES_FOUND",
            message: "Scholarship does not have active eligibility rules",
          },
        },
        { status: 422 }
      );
    }

    // Stateless deterministic evaluation (zero profile persistence)
    const result = evaluateScholarshipEligibility(
      scholarship.id,
      ruleRecord.rule_ast as never,
      profile,
      { freshApplicationsOpen: scholarship.fresh_applications_open }
    );

    return NextResponse.json({
      evaluation: result,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "EVALUATION_ERROR",
          message: err instanceof Error ? err.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
