import { describe, it, expect } from "vitest";
import concurrenceData from "@/modules/eligibility-engine/concurrence-rules.json";
import scholarshipsSeed from "../../supabase/seed/scholarships.json";
import {
  SchemeFundingClassificationEnum,
  ConcurrenceRelationshipEnum,
} from "@/modules/eligibility-engine/concurrence.types";

describe("Regulatory Concurrence Matrix & Scheme Classification Integrity", () => {
  it("every seeded scholarship has an authoritative regulatory classification", () => {
    const classifications = concurrenceData.schemeClassifications as Record<
      string,
      {
        classification: string;
        competitivenessWeight: number;
        maxAnnualBenefitInr: number;
      }
    >;

    for (const sch of scholarshipsSeed) {
      const meta = classifications[sch.code];
      expect(meta, `Missing classification for ${sch.code}`).toBeDefined();
      if (meta) {
        expect(
          SchemeFundingClassificationEnum.safeParse(meta.classification).success
        ).toBe(true);
        expect(meta.competitivenessWeight).toBeGreaterThan(0);
        expect(meta.competitivenessWeight).toBeLessThanOrEqual(1.0);
      }
    }
  });

  it("identifies two CENTRAL_MERIT schemes as MUTUALLY_EXCLUSIVE on NSP", () => {
    // E.g. AICTE Pragati (SCH-01) and PM-USP CSSS (SCH-07)
    const rule = concurrenceData.concurrenceRules.find(
      (r) => r.code === "RULE_CENTRAL_MERIT_MUTUAL_EXCLUSION"
    );
    expect(rule).toBeDefined();
    expect(rule?.relationship).toBe("MUTUALLY_EXCLUSIVE");
    expect(
      ConcurrenceRelationshipEnum.safeParse(rule?.relationship).success
    ).toBe(true);
  });

  it("identifies CENTRAL_MERIT and CENTRAL_WELFARE as DUAL_APPLY_SINGLE_DISBURSE per AY 2026-27 NSP updates", () => {
    // E.g. AICTE Pragati (SCH-01) and Top Class SC (SCH-09)
    const rule = concurrenceData.concurrenceRules.find(
      (r) => r.code === "RULE_CENTRAL_DISBURSEMENT_DUPLICATION"
    );
    expect(rule).toBeDefined();
    expect(rule?.relationship).toBe("DUAL_APPLY_SINGLE_DISBURSE");
    expect(rule?.warningMessage).toContain("surrender one");
  });

  it("identifies Government Aid and Philanthropic Grants as STACKABLE_GAP_FUNDING", () => {
    // E.g. AICTE Pragati (SCH-01) and Reliance Foundation (SCH-15A)
    const rule = concurrenceData.concurrenceRules.find(
      (r) => r.code === "RULE_PHILANTHROPIC_GAP_STACKING"
    );
    expect(rule).toBeDefined();
    expect(rule?.relationship).toBe("STACKABLE_GAP_FUNDING");
    expect(rule?.guidanceMessage).toContain("cost of education");
  });
});
