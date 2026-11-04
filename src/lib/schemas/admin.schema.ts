import { z } from "zod";
import { EducationLevelEnum } from "./profile.schema";
import {
  FundingClassificationEnum,
  ProviderTypeEnum,
} from "./discovery.schema";
import { RuleNodeSchema } from "./rule-ast.schema";

const ALLOWED_HOST_REGEX =
  /^https:\/\/([a-zA-Z0-9.-]+\.(gov\.in|nic\.in|ac\.in)|scholarships\.reliancefoundation\.org)(\/.*)?$/;

export const AdminScholarshipUpsertSchema = z.object({
  code: z.string().min(2).max(30),
  slug: z.string().min(2).max(100),
  name: z.string().min(3).max(255),
  provider_name: z.string().min(2).max(255),
  provider_type: ProviderTypeEnum,
  funding_type: FundingClassificationEnum,
  description: z.string().min(10),
  benefits_summary: z.string().min(5),
  max_annual_benefit_inr: z.number().int().positive().nullable().optional(),
  eligibility_summary: z.string().min(5),
  application_instructions: z.string().min(5),
  application_open_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  student_deadline_at: z.string().datetime().nullable().optional(),
  institute_verification_deadline_at: z
    .string()
    .datetime()
    .nullable()
    .optional(),
  state_nodal_deadline_at: z.string().datetime().nullable().optional(),
  is_deadline_verified: z.boolean().default(false),
  fresh_applications_open: z.boolean().default(true),
  renewal_applications_open: z.boolean().default(true),
  official_source_url: z
    .string()
    .url()
    .regex(
      ALLOWED_HOST_REGEX,
      "Official source URL must be https and from .gov.in, .nic.in, .ac.in, or verified foundation domain"
    ),
  official_application_url: z
    .string()
    .url()
    .regex(
      ALLOWED_HOST_REGEX,
      "Official application URL must be https and from .gov.in, .nic.in, .ac.in, or verified foundation domain"
    ),
  verification_status: z.enum([
    "verified",
    "verified_renewal_only",
    "deadline_not_verified",
    "expired",
    "flagged_for_review",
  ]),
  verification_note: z
    .string()
    .min(5, "Verification note is required to audit this update"),
  is_active: z.boolean().default(true),

  // Eligibility Rule version fields
  allowed_education_levels: z.array(EducationLevelEnum).min(1),
  max_income_inr: z.number().int().nonnegative().nullable().optional(),
  allowed_states: z.array(z.string()).nullable().optional(),
  allowed_courses: z.array(z.string()).nullable().optional(),
  rule_ast: RuleNodeSchema,
  eligibility_source_citation: z.string().min(5),

  // Document templates
  documents: z
    .array(
      z.object({
        document_name: z.string().min(2),
        specification_notes: z.string().min(2),
        is_mandatory: z.boolean().default(true),
        issuing_authority: z.string().nullable().optional(),
        sort_order: z.number().int().default(1),
      })
    )
    .optional(),

  // Sources
  sources: z
    .array(
      z.object({
        source_title: z.string().min(2),
        source_url: z.string().url().regex(ALLOWED_HOST_REGEX),
        guideline_pdf_url: z
          .string()
          .url()
          .regex(ALLOWED_HOST_REGEX)
          .nullable()
          .optional(),
        is_primary_government_portal: z.boolean().default(false),
      })
    )
    .optional(),
});

export type AdminScholarshipUpsertInput = z.infer<
  typeof AdminScholarshipUpsertSchema
>;
