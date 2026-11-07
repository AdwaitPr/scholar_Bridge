import { describe, it, expect } from "vitest";
import { ConcurrenceOptimizer } from "@/modules/eligibility-engine/concurrence-optimizer";
import type { OptimizationCandidate } from "@/modules/eligibility-engine/concurrence.types";

describe("Phase 1: Combinatorial Concurrence & Grant Optimization Engine", () => {
  const candidatePragati: OptimizationCandidate = {
    code: "SCH-01",
    slug: "aicte-pragati-degree",
    name: "AICTE Pragati Scholarship for Girls (Degree)",
    annualBenefitInr: 50000,
    classification: "CENTRAL_MERIT",
    competitivenessWeight: 0.6,
  };

  const candidateCSSS: OptimizationCandidate = {
    code: "SCH-07",
    slug: "pm-usp-csss",
    name: "PM-USP Central Sector Scheme of Scholarship (CSSS)",
    annualBenefitInr: 20000,
    classification: "CENTRAL_MERIT",
    competitivenessWeight: 0.25,
  };

  const candidateTopClassSC: OptimizationCandidate = {
    code: "SCH-09",
    slug: "top-class-education-sc",
    name: "Central Sector Scholarship of Top Class Education for SC Students",
    annualBenefitInr: 200000,
    classification: "CENTRAL_WELFARE",
    competitivenessWeight: 0.75,
  };

  const candidateRelianceUG: OptimizationCandidate = {
    code: "SCH-15A",
    slug: "reliance-foundation-ug",
    name: "Reliance Foundation Undergraduate Scholarship",
    annualBenefitInr: 50000,
    classification: "PHILANTHROPIC_STACKABLE",
    competitivenessWeight: 0.15,
  };

  const candidateDelhiPostMatric: OptimizationCandidate = {
    code: "SCH-14",
    slug: "delhi-post-matric-sc",
    name: "Post-Matric Scholarship for SC Students (NCT of Delhi)",
    annualBenefitInr: 150000,
    classification: "STATE_POST_MATRIC",
    competitivenessWeight: 0.95,
  };

  describe("Mutual Exclusion Enforcement", () => {
    it("never selects two CENTRAL_MERIT schemes in the same disbursement bundle", () => {
      // Pragati (50k) vs CSSS (20k)
      const result = ConcurrenceOptimizer.solve({
        candidates: [candidatePragati, candidateCSSS],
        target: "MAX_REALIZABLE_VALUE",
      });

      expect(result.recommendedApplicationBundle).toHaveLength(1);
      // Pragati has higher realizable value (50,000 vs 20,000)
      expect(result.recommendedApplicationBundle[0]?.code).toBe("SCH-01");
      expect(result.maxRealizableDisbursementInr).toBe(50000);
      expect(result.conflictsDetected.length).toBeGreaterThan(0);
      expect(result.conflictsDetected[0]?.relationship).toBe(
        "MUTUALLY_EXCLUSIVE"
      );
    });

    it("surrenders State Post-Matric when Central Top Class SC is awarded for full tuition", () => {
      // Top Class SC (200k) vs Delhi Post-Matric (150k)
      const result = ConcurrenceOptimizer.solve({
        candidates: [candidateTopClassSC, candidateDelhiPostMatric],
        target: "MAX_REALIZABLE_VALUE",
      });

      expect(result.recommendedApplicationBundle).toHaveLength(1);
      expect(result.recommendedApplicationBundle[0]?.code).toBe("SCH-09");
      expect(result.maxRealizableDisbursementInr).toBe(200000);
    });
  });

  describe("NSP AY 2026-27 Dual-Application Guidance", () => {
    it("generates dual-application guidance when student has both 1 Merit and 1 Welfare match", () => {
      // Pragati (Merit) + Top Class SC (Welfare)
      const result = ConcurrenceOptimizer.solve({
        candidates: [candidatePragati, candidateTopClassSC],
        target: "MAX_REALIZABLE_VALUE",
      });

      expect(result.dualApplicationGuidance.length).toBeGreaterThan(0);
      expect(result.dualApplicationGuidance[0]).toContain(
        "NSP AY 2026–27 permits applying for both"
      );
      expect(result.dualApplicationGuidance[0]).toContain("surrender");
    });
  });

  describe("Philanthropic Gap-Funding Stacking", () => {
    it("stacks Central Government Merit with Philanthropic Grant up to college fee cap", () => {
      // Pragati (50k) + Reliance Foundation UG (50k) -> Stackable up to 100k
      const result = ConcurrenceOptimizer.solve({
        candidates: [candidatePragati, candidateRelianceUG],
        annualCollegeFeesInr: 150000,
        target: "MAX_REALIZABLE_VALUE",
      });

      expect(result.recommendedApplicationBundle).toHaveLength(2);
      expect(result.isFullyStackable).toBe(true);
      expect(result.maxRealizableDisbursementInr).toBe(100000);
    });

    it("caps philanthropic grant if combined aid exceeds verified college fees", () => {
      // Pragati (50k) + Reliance Foundation (50k), but college fee is only ₹75,000
      const result = ConcurrenceOptimizer.solve({
        candidates: [candidatePragati, candidateRelianceUG],
        annualCollegeFeesInr: 75000,
        target: "MAX_REALIZABLE_VALUE",
      });

      expect(result.recommendedApplicationBundle).toHaveLength(2);
      expect(result.maxRealizableDisbursementInr).toBe(75000);
    });
  });

  describe("Target Strategy Comparison", () => {
    it("optimizes by expected probability yield when MAX_EXPECTED_YIELD is selected", () => {
      // Candidate A: 50,000 INR @ 0.15 prob (Yield = 7,500)
      // Candidate B: 20,000 INR @ 0.80 prob (Yield = 16,000)
      const candidateHighRisk: OptimizationCandidate = {
        code: "SCH-HIGH",
        slug: "high-risk",
        name: "High Value Competitive Award",
        annualBenefitInr: 50000,
        classification: "CENTRAL_MERIT",
        competitivenessWeight: 0.15,
      };

      const candidateHighProb: OptimizationCandidate = {
        code: "SCH-PROB",
        slug: "high-prob",
        name: "Guaranteed Entitlement Award",
        annualBenefitInr: 20000,
        classification: "CENTRAL_MERIT",
        competitivenessWeight: 0.8,
      };

      const result = ConcurrenceOptimizer.solve({
        candidates: [candidateHighRisk, candidateHighProb],
        target: "MAX_EXPECTED_YIELD",
      });

      expect(result.recommendedApplicationBundle[0]?.code).toBe("SCH-PROB");
      expect(result.totalExpectedYieldInr).toBe(16000);
    });
  });
});
