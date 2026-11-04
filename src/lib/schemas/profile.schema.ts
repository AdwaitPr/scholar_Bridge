import { z } from "zod";

export const EducationLevelEnum = z.enum([
  "school_class_9_10",
  "school_class_11_12",
  "diploma_technical",
  "undergraduate_general",
  "undergraduate_technical",
  "postgraduate_general",
  "postgraduate_technical",
  "integrated_five_year",
]);

export const StudyModeEnum = z.enum([
  "regular_full_time",
  "distance_correspondence",
  "part_time",
]);

export const InstitutionTypeEnum = z.enum([
  "government_school",
  "private_school",
  "aicte_approved",
  "ugc_recognized",
  "notified_top_class_institute",
  "naac_accredited",
  "other_recognized",
]);

export const SocialCategoryEnum = z.enum([
  "General",
  "OBC",
  "EWS",
  "SC",
  "ST",
  "DNT",
  "Minority",
]);

export const GenderEnum = z.enum([
  "Female",
  "Male",
  "Other",
  "Prefer not to say",
]);

export const UserRoleEnum = z.enum(["student", "admin"]);

/**
 * StudentProfileSchema
 * Uses .strict() to reject unapproved fields (such as Aadhaar, PAN, bank account numbers).
 */
export const StudentProfileSchema = z
  .object({
    id: z.string().uuid().optional(),
    display_name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(80),
    role: UserRoleEnum.optional().default("student"),
    education_level: EducationLevelEnum.nullable().optional(),
    course_stream: z.string().max(120).nullable().optional(),
    course_year: z.number().int().min(1).max(6).nullable().optional(),
    is_lateral_entry: z.boolean().default(false),
    study_mode: StudyModeEnum.nullable().optional(),
    domicile_state: z.string().max(60).nullable().optional(),
    institution_type: InstitutionTypeEnum.nullable().optional(),
    has_valid_aishe_code: z.boolean().nullable().optional(),
    academic_percentage: z.number().min(0).max(100).nullable().optional(),
    class_12_top_20_percentile: z.boolean().nullable().optional(),
    gate_score: z.number().int().min(0).max(1000).nullable().optional(),
    ug_cgpa: z.number().min(0).max(10).nullable().optional(),
    annual_family_income_inr: z
      .number()
      .int()
      .min(0)
      .max(50000000)
      .nullable()
      .optional(),
    social_category: SocialCategoryEnum.nullable().optional(),
    gender: GenderEnum.nullable().optional(),
    age_years: z.number().int().min(10).max(60).nullable().optional(),
    is_first_pg_degree: z.boolean().nullable().optional(),
    has_disability_40_percent: z.boolean().nullable().optional(),
    is_orphan_or_martyr_ward: z.boolean().nullable().optional(),
    girls_in_family_applying: z
      .number()
      .int()
      .min(0)
      .max(10)
      .nullable()
      .optional(),
    years_gap_after_qualifying_exam: z
      .number()
      .int()
      .min(0)
      .max(20)
      .nullable()
      .optional(),
    receiving_other_scholarship: z.boolean().default(false),
    reminder_days_before: z
      .array(z.number().int().min(1).max(90))
      .default([30, 14, 7, 3, 1]),
  })
  .strict();

export type StudentProfileInput = z.infer<typeof StudentProfileSchema>;
