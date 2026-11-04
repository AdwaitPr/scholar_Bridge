import { z } from "zod";

export const ApplicationStatusEnum = z.enum([
  "Saved",
  "Researching",
  "Preparing",
  "Ready to apply",
  "Submitted",
  "Awaiting result",
  "Awarded",
  "Not selected",
  "Closed",
]);

export type ApplicationStatus = z.infer<typeof ApplicationStatusEnum>;

/**
 * Valid state transitions for the 9-stage scholarship application lifecycle.
 * Closed is reachable from ANY state.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  Saved: ["Researching", "Preparing", "Closed"],
  Researching: ["Preparing", "Saved", "Closed"],
  Preparing: ["Ready to apply", "Researching", "Closed"],
  "Ready to apply": ["Submitted", "Preparing", "Closed"],
  Submitted: ["Awaiting result", "Closed"],
  "Awaiting result": ["Awarded", "Not selected", "Closed"],
  Awarded: ["Closed"],
  "Not selected": ["Closed"],
  Closed: ["Saved", "Researching", "Preparing"],
};

export function isValidStatusTransition(
  current: ApplicationStatus,
  target: ApplicationStatus
): boolean {
  if (current === target) return true;
  if (target === "Closed") return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[current] ?? [];
  return allowed.includes(target);
}

export const CreateApplicationSchema = z.object({
  scholarship_id: z.string().uuid("Invalid scholarship UUID"),
  status: ApplicationStatusEnum.optional().default("Saved"),
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;

export const UpdateApplicationSchema = z.object({
  status: ApplicationStatusEnum.optional(),
  application_reference_id: z.string().max(100).nullable().optional(),
  private_notes: z.string().max(4000).nullable().optional(),
  target_submission_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .nullable()
    .optional(),
});

export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;

export const UpdateChecklistItemSchema = z.object({
  is_completed: z.boolean(),
});

export type UpdateChecklistItemInput = z.infer<
  typeof UpdateChecklistItemSchema
>;
