import { z } from "zod";
import { EducationLevelEnum } from "./profile.schema";

export const FundingClassificationEnum = z.enum([
  "merit_based",
  "need_welfare_based",
  "merit_cum_means",
]);

export const ProviderTypeEnum = z.enum([
  "central_government",
  "state_government",
  "statutory_body_aicte_ugc",
  "private_foundation",
]);

export const DiscoverySortEnum = z.enum([
  "deadline_asc",
  "amount_desc",
  "name_asc",
]);

export const DiscoveryQuerySchema = z.object({
  q: z.string().max(100).optional(),
  education_level: EducationLevelEnum.optional(),
  state: z.string().max(60).optional(),
  course: z.string().max(80).optional(),
  funding_type: FundingClassificationEnum.optional(),
  provider_type: ProviderTypeEnum.optional(),
  max_income: z.coerce.number().int().positive().optional(),
  hide_expired: z
    .string()
    .optional()
    .transform((val) => val === "true" || val === "1")
    .pipe(z.boolean())
    .default(false),
  deadline_within_days: z.coerce.number().int().positive().max(365).optional(),
  sort: DiscoverySortEnum.default("deadline_asc"),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(50).default(12),
});

export type DiscoveryQueryInput = z.infer<typeof DiscoveryQuerySchema>;
