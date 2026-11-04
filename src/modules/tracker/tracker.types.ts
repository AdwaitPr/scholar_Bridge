import type { ApplicationStatus } from "@/lib/schemas/application.schema";

export interface ChecklistItemRecord {
  id: string;
  item_title: string;
  item_category: "document" | "registration" | "verification" | "test";
  guidance_notes: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface ApplicationTrackerRecord {
  id: string;
  user_id: string;
  scholarship_id: string;
  status: ApplicationStatus;
  application_reference_id: string | null;
  private_notes: string | null;
  submitted_at: string | null;
  target_submission_date: string | null;
  created_at: string;
  updated_at: string;
  scholarship?: {
    code: string;
    slug: string;
    name: string;
    provider_name: string;
    funding_type: string;
    student_deadline_at: string | null;
    is_deadline_verified: boolean;
    official_application_url: string;
  };
  checklist?: {
    id: string;
    items: ChecklistItemRecord[];
  };
}

export function calculateChecklistProgress(
  items: Array<{ is_completed: boolean; item_category?: string }>
): {
  total: number;
  completed: number;
  percentage: number;
  readinessState: "Not started" | "In progress" | "Ready to submit";
} {
  if (!items || items.length === 0) {
    return {
      total: 0,
      completed: 0,
      percentage: 0,
      readinessState: "Not started",
    };
  }

  const total = items.length;
  const completed = items.filter((i) => i.is_completed).length;
  const percentage = Math.round((completed / total) * 100);

  let readinessState: "Not started" | "In progress" | "Ready to submit" =
    "In progress";
  if (completed === 0) {
    readinessState = "Not started";
  } else if (completed === total) {
    readinessState = "Ready to submit";
  }

  return { total, completed, percentage, readinessState };
}
