import { z } from "zod";

export const ProfileFieldKeyEnum = z.enum([
  "display_name",
  "education_level",
  "course_stream",
  "course_year",
  "is_lateral_entry",
  "study_mode",
  "domicile_state",
  "institution_type",
  "has_valid_aishe_code",
  "academic_percentage",
  "class_12_top_20_percentile",
  "gate_score",
  "ug_cgpa",
  "annual_family_income_inr",
  "social_category",
  "gender",
  "age_years",
  "is_first_pg_degree",
  "has_disability_40_percent",
  "is_orphan_or_martyr_ward",
  "girls_in_family_applying",
  "years_gap_after_qualifying_exam",
  "receiving_other_scholarship",
]);

export type ProfileFieldKey = z.infer<typeof ProfileFieldKeyEnum>;

export const ComparisonOperatorEnum = z.enum([
  "eq",
  "neq",
  "lte",
  "gte",
  "lt",
  "gt",
  "in",
  "nin",
]);

export type ComparisonOperator = z.infer<typeof ComparisonOperatorEnum>;

export const ConditionCategoryEnum = z.enum([
  "education",
  "academic",
  "income",
  "geographic",
  "course",
  "other",
]);

export type ConditionCategory = z.infer<typeof ConditionCategoryEnum>;

/**
 * LeafConditionSchema
 * Implements:
 * - Fix D3: Explicit ProfileFieldKeyEnum
 * - Fix D4: externalGateOnly flag for requirements with no self-reported field
 */
export const LeafConditionSchema = z.object({
  type: z.literal("CONDITION"),
  id: z.string(),
  category: ConditionCategoryEnum,
  field: ProfileFieldKeyEnum,
  operator: ComparisonOperatorEnum,
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
  ]),
  requiresOfficialVerification: z.boolean().default(false),
  externalGateOnly: z.boolean().default(false),
  label: z.string(),
  passExplanation: z.string(),
  failExplanation: z.string(),
  missingExplanation: z.string(),
  verificationNote: z.string().optional(),
});

export type LeafCondition = z.infer<typeof LeafConditionSchema>;

export type RuleNode =
  | LeafCondition
  | {
      type: "AND" | "OR";
      id: string;
      label: string;
      children: RuleNode[];
    };

export const RuleNodeSchema: z.ZodType<RuleNode> = z.lazy(() =>
  z.discriminatedUnion("type", [
    LeafConditionSchema,
    z.object({
      type: z.enum(["AND", "OR"]),
      id: z.string(),
      label: z.string(),
      children: z.array(RuleNodeSchema).min(1),
    }),
  ])
);
