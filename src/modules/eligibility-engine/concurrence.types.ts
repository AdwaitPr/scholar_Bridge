import { z } from "zod";

export const SchemeFundingClassificationEnum = z.enum([
  "CENTRAL_MERIT",
  "CENTRAL_WELFARE",
  "STATE_POST_MATRIC",
  "PHILANTHROPIC_STACKABLE",
]);

export type SchemeFundingClassification = z.infer<
  typeof SchemeFundingClassificationEnum
>;

export const ConcurrenceRelationshipEnum = z.enum([
  "MUTUALLY_EXCLUSIVE",
  "DUAL_APPLY_SINGLE_DISBURSE",
  "STACKABLE_GAP_FUNDING",
  "INDEPENDENT_CATEGORY",
]);

export type ConcurrenceRelationship = z.infer<
  typeof ConcurrenceRelationshipEnum
>;

export interface SchemeClassificationMeta {
  classification: SchemeFundingClassification;
  competitivenessWeight: number; // Probability weight between 0.05 and 1.0
  maxAnnualBenefitInr: number;
  portal: "NSP" | "STATE_EDISTRICT_OR_NSP" | "EXTERNAL_DIRECT";
}

export interface ConcurrenceConflictPair {
  scholarshipCodeA: string;
  scholarshipCodeB: string;
  relationship: ConcurrenceRelationship;
  warningMessage: string;
}

export interface OptimizationCandidate {
  code: string;
  slug: string;
  name: string;
  annualBenefitInr: number;
  classification: SchemeFundingClassification;
  competitivenessWeight: number;
}

export interface OptimizationResult {
  target: "MAX_EXPECTED_YIELD" | "MAX_REALIZABLE_VALUE";
  recommendedApplicationBundle: OptimizationCandidate[];
  totalExpectedYieldInr: number;
  maxRealizableDisbursementInr: number;
  conflictsDetected: ConcurrenceConflictPair[];
  dualApplicationGuidance: string[];
  isFullyStackable: boolean;
  legalDisclaimer: string;
}
