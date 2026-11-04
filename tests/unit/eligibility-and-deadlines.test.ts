import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { evaluateScholarshipEligibility } from "@/modules/eligibility-engine/evaluator";
import { evaluateScholarshipDeadline } from "@/modules/deadline-management/deadline.service";
import {
  AICTE_PRAGATI_DEGREE_RULE_AST,
  UGC_NATIONAL_PG_RULE_AST,
  PM_USP_CSSS_RULE_AST,
  RELIANCE_PG_RULE_AST,
} from "@/modules/scholarship-catalog/seed-rules";
import { StudentProfileInput } from "@/lib/schemas";

describe("ScholarBridge Deterministic Eligibility Rules Engine", () => {
  // Spec Test 1: Self-reported match with verification gates
  it('returns "Eligibility requires official verification" when all self-reported criteria pass for AICTE Pragati', () => {
    const syntheticGirlBTechProfile = {
      display_name: "Ananya Sharma (Synthetic)",
      gender: "Female" as const,
      education_level: "undergraduate_technical" as const,
      course_year: 1,
      is_lateral_entry: false,
      annual_family_income_inr: 420000,
      girls_in_family_applying: 1,
      years_gap_after_qualifying_exam: 0,
      institution_type: "aicte_approved" as const,
      receiving_other_scholarship: false,
    };

    const result = evaluateScholarshipEligibility(
      "SCH-01",
      AICTE_PRAGATI_DEGREE_RULE_AST,
      syntheticGirlBTechProfile
    );

    expect(result.outcome).toBe("Eligibility requires official verification");
    expect(result.unsatisfiedConditions).toHaveLength(0);
    expect(result.missingInformationConditions).toHaveLength(0);
    expect(result.verificationRequiredConditions.length).toBeGreaterThanOrEqual(
      2
    );
    expect(result.disclaimer).toContain(
      "does not constitute an official sanction"
    );
  });

  // Spec Test 2: OR node for Lateral Entry
  it("evaluates OR node correctly for 2nd-year Lateral Entry girl student in AICTE Pragati", () => {
    const lateralEntryProfile = {
      display_name: "Meera Patel (Synthetic)",
      gender: "Female" as const,
      education_level: "undergraduate_technical" as const,
      course_year: 2,
      is_lateral_entry: true,
      annual_family_income_inr: 790000,
      girls_in_family_applying: 2,
      years_gap_after_qualifying_exam: 1,
      institution_type: "aicte_approved" as const,
      receiving_other_scholarship: false,
    };

    const result = evaluateScholarshipEligibility(
      "SCH-01",
      AICTE_PRAGATI_DEGREE_RULE_AST,
      lateralEntryProfile
    );

    expect(result.outcome).toBe("Eligibility requires official verification");
    expect(result.unsatisfiedConditions).toHaveLength(0);
  });

  // Spec Test 3: Hard Income Threshold Fail
  it('returns "Likely ineligible" when family income exceeds ₹8,00,000 threshold', () => {
    const excessIncomeProfile = {
      display_name: "Riya Verma (Synthetic)",
      gender: "Female" as const,
      education_level: "undergraduate_technical" as const,
      course_year: 1,
      annual_family_income_inr: 850000, // Exceeds 8L limit
      girls_in_family_applying: 1,
      years_gap_after_qualifying_exam: 0,
      institution_type: "aicte_approved" as const,
      receiving_other_scholarship: false,
    };

    const result = evaluateScholarshipEligibility(
      "SCH-01",
      AICTE_PRAGATI_DEGREE_RULE_AST,
      excessIncomeProfile
    );

    expect(result.outcome).toBe("Likely ineligible");
    expect(result.unsatisfiedConditions[0]?.conditionId).toBe("pragati-income");
  });

  // Spec Test 4 (Fixed by D4!): Missing income field yields UNKNOWN, NOT VERIFY
  it('returns "Additional information required" when income field is omitted on an otherwise eligible profile', () => {
    const incompleteProfile = {
      display_name: "Kavya Nair (Synthetic)",
      gender: "Female" as const,
      education_level: "undergraduate_technical" as const,
      course_year: 1,
      annual_family_income_inr: null, // Missing field
      girls_in_family_applying: 1,
      years_gap_after_qualifying_exam: 0,
      institution_type: "aicte_approved" as const,
      receiving_other_scholarship: false,
    };

    const result = evaluateScholarshipEligibility(
      "SCH-01",
      AICTE_PRAGATI_DEGREE_RULE_AST,
      incompleteProfile
    );

    expect(result.outcome).toBe("Additional information required");
    expect(result.missingInformationConditions[0]?.conditionId).toBe(
      "pragati-income"
    );
  });

  // Spec Test 5: UGC NSPGS Rejection
  it("rejects distance-mode or age >= 30 applicants for UGC National PG Scholarship", () => {
    const distancePgProfile = {
      display_name: "rohit_synthetic",
      education_level: "postgraduate_general" as const,
      course_year: 1,
      is_first_pg_degree: true,
      study_mode: "distance_correspondence" as const,
      age_years: 31,
      has_valid_aishe_code: true,
    };

    const result = evaluateScholarshipEligibility(
      "SCH-05",
      UGC_NATIONAL_PG_RULE_AST,
      distancePgProfile
    );

    expect(result.outcome).toBe("Likely ineligible");
    expect(result.unsatisfiedConditions).toHaveLength(2);
  });

  // OR-branch test: GATE vs CGPA on Reliance PG
  describe("OR-branch alternative pathways", () => {
    it("satisfies OR branch when GATE score qualifies, even if CGPA is below 7.5", () => {
      const profile = {
        education_level: "postgraduate_technical" as const,
        course_year: 1,
        study_mode: "regular_full_time" as const,
        gate_score: 650, // Qualifies (>=550)
        ug_cgpa: 6.8, // Below 7.5, but alternative branch satisfied
      };

      const result = evaluateScholarshipEligibility(
        "SCH-15B",
        RELIANCE_PG_RULE_AST,
        profile
      );
      expect(result.outcome).toBe("Eligibility requires official verification");
      expect(result.unsatisfiedConditions).toHaveLength(0);
    });

    it("satisfies OR branch when CGPA qualifies, even if GATE is missing or low", () => {
      const profile = {
        education_level: "postgraduate_technical" as const,
        course_year: 1,
        study_mode: "regular_full_time" as const,
        gate_score: null,
        ug_cgpa: 8.2, // Qualifies (>=7.5)
      };

      const result = evaluateScholarshipEligibility(
        "SCH-15B",
        RELIANCE_PG_RULE_AST,
        profile
      );
      expect(result.outcome).toBe("Eligibility requires official verification");
      expect(result.unsatisfiedConditions).toHaveLength(0);
    });

    it("returns 'Likely ineligible' and lists all branch failure reasons when all OR pathways fail", () => {
      const profile = {
        education_level: "postgraduate_technical" as const,
        course_year: 1,
        study_mode: "regular_full_time" as const,
        gate_score: 400, // Failed (<550)
        ug_cgpa: 6.5, // Failed (<7.5)
      };

      const result = evaluateScholarshipEligibility(
        "SCH-15B",
        RELIANCE_PG_RULE_AST,
        profile
      );
      expect(result.outcome).toBe("Likely ineligible");
      expect(result.unsatisfiedConditions[0]?.explanation).toContain(
        "None of the alternative pathways"
      );
      expect(result.unsatisfiedConditions[0]?.explanation).toContain(
        "Profile value: 400"
      );
      expect(result.unsatisfiedConditions[0]?.explanation).toContain(
        "Profile value: 6.5"
      );
    });
  });

  // Fix D5: Renewal-only scheme (PM-USP CSSS)
  describe("Renewal-only Schemes & Window Handling (Fix D5)", () => {
    it("never yields 'Potential match' for fresh applicants when freshApplicationsOpen is false", () => {
      const eligibleStudentProfile = {
        class_12_top_20_percentile: true,
        annual_family_income_inr: 300000,
        study_mode: "regular_full_time" as const,
        receiving_other_scholarship: false,
      };

      const result = evaluateScholarshipEligibility(
        "SCH-07",
        PM_USP_CSSS_RULE_AST,
        eligibleStudentProfile,
        {
          freshApplicationsOpen: false,
        }
      );

      expect(result.outcome).toBe("Eligibility requires official verification");
      expect(result.outcome).not.toBe("Potential match");
      expect(result.summaryExplanation).toContain(
        "fresh applications are currently not open"
      );
    });

    it("preserves 'Likely ineligible' if student fails criteria even on renewal-only schemes", () => {
      const excessIncomeProfile = {
        class_12_top_20_percentile: true,
        annual_family_income_inr: 500000, // Exceeds 4.5L limit
        study_mode: "regular_full_time" as const,
        receiving_other_scholarship: false,
      };

      const result = evaluateScholarshipEligibility(
        "SCH-07",
        PM_USP_CSSS_RULE_AST,
        excessIncomeProfile,
        {
          freshApplicationsOpen: false,
        }
      );

      expect(result.outcome).toBe("Likely ineligible");
    });
  });

  // Exact boundary tests
  describe("Numeric and Age Boundaries", () => {
    it("passes when annual_family_income_inr is exactly at cap (800000)", () => {
      const profile = {
        gender: "Female" as const,
        education_level: "undergraduate_technical" as const,
        course_year: 1,
        annual_family_income_inr: 800000, // Exactly at cap
        girls_in_family_applying: 1,
        years_gap_after_qualifying_exam: 0,
        institution_type: "aicte_approved" as const,
        receiving_other_scholarship: false,
      };

      const result = evaluateScholarshipEligibility(
        "SCH-01",
        AICTE_PRAGATI_DEGREE_RULE_AST,
        profile
      );
      const incomeUnsatisfied = result.unsatisfiedConditions.some(
        (c) => c.conditionId === "pragati-income"
      );
      expect(incomeUnsatisfied).toBe(false);
    });

    it("fails when annual_family_income_inr is cap + 1 (800001)", () => {
      const profile = {
        gender: "Female" as const,
        education_level: "undergraduate_technical" as const,
        course_year: 1,
        annual_family_income_inr: 800001, // Cap + 1
        girls_in_family_applying: 1,
        years_gap_after_qualifying_exam: 0,
        institution_type: "aicte_approved" as const,
        receiving_other_scholarship: false,
      };

      const result = evaluateScholarshipEligibility(
        "SCH-01",
        AICTE_PRAGATI_DEGREE_RULE_AST,
        profile
      );
      const incomeUnsatisfied = result.unsatisfiedConditions.some(
        (c) => c.conditionId === "pragati-income"
      );
      expect(incomeUnsatisfied).toBe(true);
      expect(result.outcome).toBe("Likely ineligible");
    });

    it("age cap boundary: age 29 passes (< 30), age 30 fails for UGC NSPGS", () => {
      const age29Profile = {
        education_level: "postgraduate_general" as const,
        course_year: 1,
        is_first_pg_degree: true,
        study_mode: "regular_full_time" as const,
        age_years: 29,
        has_valid_aishe_code: true,
      };

      const age30Profile = {
        ...age29Profile,
        age_years: 30,
      };

      const res29 = evaluateScholarshipEligibility(
        "SCH-05",
        UGC_NATIONAL_PG_RULE_AST,
        age29Profile
      );
      const res30 = evaluateScholarshipEligibility(
        "SCH-05",
        UGC_NATIONAL_PG_RULE_AST,
        age30Profile
      );

      expect(
        res29.unsatisfiedConditions.some(
          (c) => c.conditionId === "nspgs-age-limit"
        )
      ).toBe(false);
      expect(
        res30.unsatisfiedConditions.some(
          (c) => c.conditionId === "nspgs-age-limit"
        )
      ).toBe(true);
      expect(res30.outcome).toBe("Likely ineligible");
    });
  });

  // Property testing with fast-check: Evaluator never throws on arbitrary partial profiles
  describe("Property Testing (fast-check)", () => {
    it("is completely deterministic and never throws on arbitrary partial student profiles", () => {
      fc.assert(
        fc.property(
          fc.record({
            gender: fc.constantFrom("Female", "Male", "Other", undefined),
            education_level: fc.constantFrom(
              "undergraduate_technical",
              "postgraduate_general",
              undefined
            ),
            course_year: fc.option(fc.integer({ min: 1, max: 6 })),
            annual_family_income_inr: fc.option(
              fc.integer({ min: 0, max: 2000000 })
            ),
            age_years: fc.option(fc.integer({ min: 15, max: 50 })),
            is_lateral_entry: fc.boolean(),
            receiving_other_scholarship: fc.boolean(),
          }),
          (arbitraryProfile) => {
            const res1 = evaluateScholarshipEligibility(
              "SCH-01",
              AICTE_PRAGATI_DEGREE_RULE_AST,
              arbitraryProfile as Partial<StudentProfileInput>
            );
            const res2 = evaluateScholarshipEligibility(
              "SCH-01",
              AICTE_PRAGATI_DEGREE_RULE_AST,
              arbitraryProfile as Partial<StudentProfileInput>
            );

            // Deterministic: returns identical outcome for same input
            expect(res1.outcome).toBe(res2.outcome);
            expect(res1.unsatisfiedConditions.length).toBe(
              res2.unsatisfiedConditions.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe("ScholarBridge IST Time-Zone Deadline Service", () => {
  const referenceNow = new Date("2026-11-04T08:35:00.000Z"); // Nov 4, 2026, 2:05 PM IST

  it("correctly identifies Nov 30, 2026 NSP deadline as UPCOMING_30D with 27 days left", () => {
    const evaluation = evaluateScholarshipDeadline(
      "2026-11-30T18:29:59.000Z", // Nov 30, 2026 23:59:59 IST
      true,
      "2026-12-15T18:29:59.000Z",
      null,
      { referenceNow }
    );

    expect(evaluation.isExpired).toBe(false);
    expect(evaluation.daysRemaining).toBe(27);
    expect(evaluation.urgency).toBe("UPCOMING_30D");
    expect(evaluation.instituteVerificationNote).toContain("15 Dec 2026");
  });

  it("marks Oct 5, 2026 Reliance Foundation deadline as EXPIRED relative to Nov 4, 2026", () => {
    const evaluation = evaluateScholarshipDeadline(
      "2026-10-05T18:29:59.000Z",
      true,
      null,
      null,
      { referenceNow }
    );

    expect(evaluation.isExpired).toBe(true);
    expect(evaluation.urgency).toBe("EXPIRED");
  });

  it('displays "Deadline not verified" when isDeadlineVerified is false', () => {
    const evaluation = evaluateScholarshipDeadline(null, false, null, null, {
      referenceNow,
    });
    expect(evaluation.displayText).toBe("Deadline not verified");
    expect(evaluation.urgency).toBe("UNVERIFIED");
  });

  // Boundary testing: 72 hours, 7 days, 30 days, exact expiry instant
  describe("Deadline Boundary Conditions", () => {
    it("flags CRITICAL_72H when deadline is within 72 hours", () => {
      // 48 hours in the future
      const deadline48h = new Date(
        referenceNow.getTime() + 48 * 60 * 60 * 1000
      ).toISOString();
      const evaluation = evaluateScholarshipDeadline(
        deadline48h,
        true,
        null,
        null,
        { referenceNow }
      );

      expect(evaluation.isExpired).toBe(false);
      expect(evaluation.urgency).toBe("CRITICAL_72H");
    });

    it("flags URGENT_7D when deadline is 5 days away (> 72h and <= 7d)", () => {
      const deadline5d = new Date(
        referenceNow.getTime() + 5 * 24 * 60 * 60 * 1000
      ).toISOString();
      const evaluation = evaluateScholarshipDeadline(
        deadline5d,
        true,
        null,
        null,
        { referenceNow }
      );

      expect(evaluation.isExpired).toBe(false);
      expect(evaluation.urgency).toBe("URGENT_7D");
    });

    it("flags UPCOMING_30D when deadline is 20 days away (> 7d and <= 30d)", () => {
      const deadline20d = new Date(
        referenceNow.getTime() + 20 * 24 * 60 * 60 * 1000
      ).toISOString();
      const evaluation = evaluateScholarshipDeadline(
        deadline20d,
        true,
        null,
        null,
        { referenceNow }
      );

      expect(evaluation.isExpired).toBe(false);
      expect(evaluation.urgency).toBe("UPCOMING_30D");
    });

    it("flags OPEN_PLENTY_OF_TIME when deadline is 45 days away (> 30d)", () => {
      const deadline45d = new Date(
        referenceNow.getTime() + 45 * 24 * 60 * 60 * 1000
      ).toISOString();
      const evaluation = evaluateScholarshipDeadline(
        deadline45d,
        true,
        null,
        null,
        { referenceNow }
      );

      expect(evaluation.isExpired).toBe(false);
      expect(evaluation.urgency).toBe("OPEN_PLENTY_OF_TIME");
    });

    it("marks as EXPIRED at the exact deadline instant (diffMs <= 0)", () => {
      const exactInstantIso = referenceNow.toISOString();
      const evaluation = evaluateScholarshipDeadline(
        exactInstantIso,
        true,
        null,
        null,
        { referenceNow }
      );

      expect(evaluation.isExpired).toBe(true);
      expect(evaluation.urgency).toBe("EXPIRED");
      expect(evaluation.daysRemaining).toBe(0);
      expect(evaluation.hoursRemaining).toBe(0);
    });

    it("formats dates in IST regardless of time zone", () => {
      // 2026-11-30T18:29:59.000Z corresponds to 2026-11-30 23:59:59 IST
      const deadlineIso = "2026-11-30T18:29:59.000Z";
      const evaluation = evaluateScholarshipDeadline(
        deadlineIso,
        true,
        null,
        null,
        { referenceNow }
      );

      expect(evaluation.istFormattedDate).toContain("30 Nov 2026");
      expect(evaluation.istFormattedDate).toContain("11:59 pm IST");
    });
  });
});
