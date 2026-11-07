import concurrenceData from "./concurrence-rules.json";
import type {
  OptimizationCandidate,
  OptimizationResult,
  ConcurrenceConflictPair,
  ConcurrenceRelationship,
  SchemeFundingClassification,
  SchemeClassificationMeta,
} from "./concurrence.types";

interface SolveOptions {
  candidates: OptimizationCandidate[];
  annualCollegeFeesInr?: number;
  target?: "MAX_EXPECTED_YIELD" | "MAX_REALIZABLE_VALUE";
}

export class ConcurrenceOptimizer {
  private static readonly DEFAULT_ANNUAL_COLLEGE_FEES_INR = 150000;

  /**
   * Looks up the regulatory classification metadata for a given scholarship code.
   */
  static getClassificationMeta(
    code: string
  ): SchemeClassificationMeta | undefined {
    const classifications = concurrenceData.schemeClassifications as Record<
      string,
      SchemeClassificationMeta
    >;
    return classifications[code];
  }

  /**
   * Converts a database or seeded scholarship entity into an OptimizationCandidate.
   */
  static toCandidate(scheme: {
    code: string;
    slug?: string;
    name: string;
    max_annual_benefit_inr?: number | null;
    funding_type?: string;
  }): OptimizationCandidate {
    const meta = this.getClassificationMeta(scheme.code);
    const classification: SchemeFundingClassification =
      meta?.classification ??
      (scheme.funding_type === "FOUNDATION_CSR"
        ? "PHILANTHROPIC_STACKABLE"
        : scheme.funding_type === "STATE_GOVERNMENT"
          ? "STATE_POST_MATRIC"
          : "CENTRAL_MERIT");

    return {
      code: scheme.code,
      slug: scheme.slug || scheme.code.toLowerCase(),
      name: scheme.name,
      annualBenefitInr:
        scheme.max_annual_benefit_inr || meta?.maxAnnualBenefitInr || 50000,
      classification,
      competitivenessWeight: meta?.competitivenessWeight ?? 0.5,
    };
  }

  /**
   * Solves the Combinatorial Grant Optimization Problem for a given set of candidate scholarships.
   * Runs client-side in <5ms with zero external I/O.
   */
  static solve(options: SolveOptions): OptimizationResult {
    const {
      candidates,
      annualCollegeFeesInr = this.DEFAULT_ANNUAL_COLLEGE_FEES_INR,
      target = "MAX_REALIZABLE_VALUE",
    } = options;

    if (!candidates || candidates.length === 0) {
      return {
        target,
        recommendedApplicationBundle: [],
        totalExpectedYieldInr: 0,
        maxRealizableDisbursementInr: 0,
        conflictsDetected: [],
        dualApplicationGuidance: [],
        isFullyStackable: true,
        legalDisclaimer: this.getLegalDisclaimer(),
      };
    }

    // 1. Detect all pairwise conflicts among candidate schemes
    const conflictsDetected = this.detectConflicts(candidates);

    // 2. Formulate NSP AY 2026-27 Dual-Application Guidance
    const dualApplicationGuidance =
      this.generateDualApplicationGuidance(candidates);

    // 3. Find optimal non-conflicting subset via Branch-and-Bound / Subsets
    const optimalBundle = this.findOptimalBundle(
      candidates,
      conflictsDetected,
      annualCollegeFeesInr,
      target
    );

    // 4. Calculate metrics for the optimal bundle
    const rawTotalBenefit = optimalBundle.reduce(
      (sum, c) => sum + c.annualBenefitInr,
      0
    );

    // Cap at annual college fees if philanthropic/gap funding is involved or fees are explicitly specified
    const maxRealizableDisbursementInr =
      options.annualCollegeFeesInr !== undefined
        ? Math.min(rawTotalBenefit, annualCollegeFeesInr)
        : rawTotalBenefit;

    const totalExpectedYieldInr = Math.round(
      optimalBundle.reduce(
        (sum, c) => sum + c.annualBenefitInr * c.competitivenessWeight,
        0
      )
    );

    const isFullyStackable =
      optimalBundle.length <= 1 ||
      optimalBundle.every(
        (c) =>
          c.classification === "PHILANTHROPIC_STACKABLE" ||
          optimalBundle.filter(
            (o) =>
              o.classification === "CENTRAL_MERIT" ||
              o.classification === "CENTRAL_WELFARE"
          ).length <= 1
      );

    return {
      target,
      recommendedApplicationBundle: optimalBundle,
      totalExpectedYieldInr,
      maxRealizableDisbursementInr,
      conflictsDetected,
      dualApplicationGuidance,
      isFullyStackable,
      legalDisclaimer: this.getLegalDisclaimer(),
    };
  }

  /**
   * Pairwise conflict analyzer across all candidate schemes.
   */
  private static detectConflicts(
    candidates: OptimizationCandidate[]
  ): ConcurrenceConflictPair[] {
    const conflicts: ConcurrenceConflictPair[] = [];

    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i]!;
        const b = candidates[j]!;

        const rel = this.getPairwiseRelationship(
          a.classification,
          b.classification
        );

        if (rel === "MUTUALLY_EXCLUSIVE") {
          let msg = `"${a.name}" and "${b.name}" cannot be concurrently held.`;
          if (
            a.classification === "CENTRAL_MERIT" &&
            b.classification === "CENTRAL_MERIT"
          ) {
            msg = `NSP permits submitting only 1 Central Merit application per academic year. "${a.name}" and "${b.name}" are mutually exclusive.`;
          } else if (
            (a.classification === "CENTRAL_WELFARE" &&
              b.classification === "STATE_POST_MATRIC") ||
            (b.classification === "CENTRAL_WELFARE" &&
              a.classification === "STATE_POST_MATRIC")
          ) {
            msg = `Both "${a.name}" and "${b.name}" provide complete tuition reimbursement. Claiming tuition from both Central and State budgets violates GFR 230(1).`;
          }

          conflicts.push({
            scholarshipCodeA: a.code,
            scholarshipCodeB: b.code,
            relationship: rel,
            warningMessage: msg,
          });
        } else if (rel === "DUAL_APPLY_SINGLE_DISBURSE") {
          conflicts.push({
            scholarshipCodeA: a.code,
            scholarshipCodeB: b.code,
            relationship: rel,
            warningMessage: `NSP AY 2026–27 permits applying to both "${a.name}" (Merit) and "${b.name}" (Welfare) to maximize your chances. However, if awarded both, you must surrender one prior to final disbursement.`,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Determines relationship code between two funding classifications.
   */
  private static getPairwiseRelationship(
    classA: SchemeFundingClassification,
    classB: SchemeFundingClassification
  ): ConcurrenceRelationship {
    if (classA === "CENTRAL_MERIT" && classB === "CENTRAL_MERIT") {
      return "MUTUALLY_EXCLUSIVE";
    }

    if (
      (classA === "CENTRAL_MERIT" && classB === "CENTRAL_WELFARE") ||
      (classA === "CENTRAL_WELFARE" && classB === "CENTRAL_MERIT")
    ) {
      return "DUAL_APPLY_SINGLE_DISBURSE";
    }

    if (
      (classA === "CENTRAL_WELFARE" && classB === "STATE_POST_MATRIC") ||
      (classA === "STATE_POST_MATRIC" && classB === "CENTRAL_WELFARE")
    ) {
      return "MUTUALLY_EXCLUSIVE";
    }

    if (
      classA === "PHILANTHROPIC_STACKABLE" ||
      classB === "PHILANTHROPIC_STACKABLE"
    ) {
      return "STACKABLE_GAP_FUNDING";
    }

    return "MUTUALLY_EXCLUSIVE";
  }

  /**
   * Generates student-friendly dual application advisory for AY 2026-27.
   */
  private static generateDualApplicationGuidance(
    candidates: OptimizationCandidate[]
  ): string[] {
    const hasMerit = candidates.some(
      (c) => c.classification === "CENTRAL_MERIT"
    );
    const hasWelfare = candidates.some(
      (c) => c.classification === "CENTRAL_WELFARE"
    );

    const guidance: string[] = [];

    if (hasMerit && hasWelfare) {
      guidance.push(
        "NSP AY 2026–27 permits applying for both 1 Central Merit and 1 Central Welfare scheme on the portal to maximize your selection odds. However, DBT de-duplication rules require that you surrender one before final disbursement."
      );
    }

    const hasPhilanthropic = candidates.some(
      (c) => c.classification === "PHILANTHROPIC_STACKABLE"
    );
    if (hasPhilanthropic && (hasMerit || hasWelfare)) {
      guidance.push(
        "Private philanthropic foundation grants (e.g. Reliance Foundation) can be stacked with government scholarships as gap funding for living expenses, books, and laptops, provided total aid does not exceed verified institutional fees."
      );
    }

    return guidance;
  }

  /**
   * Knapsack / Independent Set solver evaluating valid non-conflicting bundles.
   */
  private static findOptimalBundle(
    candidates: OptimizationCandidate[],
    conflicts: ConcurrenceConflictPair[],
    collegeFeesCap: number,
    target: "MAX_EXPECTED_YIELD" | "MAX_REALIZABLE_VALUE"
  ): OptimizationCandidate[] {
    const exclusivePairSet = new Set<string>();

    for (const c of conflicts) {
      if (
        c.relationship === "MUTUALLY_EXCLUSIVE" ||
        c.relationship === "DUAL_APPLY_SINGLE_DISBURSE" // Cannot disburse both central schemes
      ) {
        exclusivePairSet.add(`${c.scholarshipCodeA}__${c.scholarshipCodeB}`);
        exclusivePairSet.add(`${c.scholarshipCodeB}__${c.scholarshipCodeA}`);
      }
    }

    const n = candidates.length;
    let bestBundle: OptimizationCandidate[] = [];
    let bestScore = -1;
    let bestSecondaryScore = -1;

    // Power set evaluation (N <= 16)
    const totalCombinations = 1 << n;

    for (let mask = 1; mask < totalCombinations; mask++) {
      const currentSubset: OptimizationCandidate[] = [];
      let isFeasible = true;

      let centralCount = 0;

      for (let i = 0; i < n; i++) {
        if ((mask & (1 << i)) !== 0) {
          const item = candidates[i]!;

          // Central Government disbursement constraint: at most 1 Central award
          if (
            item.classification === "CENTRAL_MERIT" ||
            item.classification === "CENTRAL_WELFARE"
          ) {
            centralCount++;
            if (centralCount > 1) {
              isFeasible = false;
              break;
            }
          }

          // Pairwise mutual exclusion check
          for (const selected of currentSubset) {
            if (exclusivePairSet.has(`${item.code}__${selected.code}`)) {
              isFeasible = false;
              break;
            }
          }

          if (!isFeasible) break;
          currentSubset.push(item);
        }
      }

      if (!isFeasible) continue;

      // Calculate score for feasible subset
      let primaryScore = 0;
      let secondaryScore = 0;

      const rawSum = currentSubset.reduce(
        (sum, c) => sum + c.annualBenefitInr,
        0
      );
      const cappedSum = Math.min(rawSum, collegeFeesCap);

      const expectedYieldSum = Math.round(
        currentSubset.reduce(
          (sum, c) => sum + c.annualBenefitInr * c.competitivenessWeight,
          0
        )
      );

      if (target === "MAX_EXPECTED_YIELD") {
        primaryScore = expectedYieldSum;
        secondaryScore = cappedSum;
      } else {
        primaryScore = cappedSum;
        secondaryScore = expectedYieldSum;
      }

      if (
        primaryScore > bestScore ||
        (primaryScore === bestScore && secondaryScore > bestSecondaryScore)
      ) {
        bestScore = primaryScore;
        bestSecondaryScore = secondaryScore;
        bestBundle = currentSubset;
      }
    }

    return bestBundle;
  }

  private static getLegalDisclaimer(): string {
    return "ScholarBridge grant optimization calculations are deterministic advisory recommendations based on AY 2026–27 published scheme circulars and DBT Bharat directives. Final sanction and disbursement remain subject to institutional scrutiny, nodal officer verification, and statutory de-duplication.";
  }
}
