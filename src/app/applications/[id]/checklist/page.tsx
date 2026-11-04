import React from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApplicationChecklistView } from "@/modules/tracker/components/application-checklist-view";
import type { ApplicationTrackerRecord } from "@/modules/tracker/tracker.service";
import seedScholarships from "../../../../../supabase/seed/scholarships.json";

interface ChecklistPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationChecklistPage({
  params,
}: ChecklistPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/applications/${id}/checklist`);
  }

  let application: ApplicationTrackerRecord | null = null;

  try {
    const { data: dbApp, error } = await supabase
      .from("applications")
      .select(
        `
        id,
        user_id,
        scholarship_id,
        status,
        application_reference_id,
        private_notes,
        submitted_at,
        target_submission_date,
        created_at,
        updated_at,
        scholarships:scholarship_id (
          id,
          code,
          slug,
          name,
          provider_name,
          provider_type,
          funding_type,
          student_deadline_at,
          is_deadline_verified,
          official_application_url
        ),
        application_checklists (
          id,
          checklist_items (
            id,
            item_title,
            item_category,
            guidance_notes,
            is_completed,
            completed_at,
            sort_order
          )
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!error && dbApp) {
      const row = dbApp as unknown as {
        id: string;
        user_id: string;
        scholarship_id: string;
        status: ApplicationTrackerRecord["status"];
        application_reference_id: string | null;
        private_notes: string | null;
        submitted_at: string | null;
        target_submission_date: string | null;
        created_at: string;
        updated_at: string;
        scholarships?: ApplicationTrackerRecord["scholarship"];
        application_checklists?: Array<{
          id: string;
          checklist_items?: Array<{
            id: string;
            item_title: string;
            item_category:
              "document" | "registration" | "verification" | "test";
            guidance_notes: string | null;
            is_completed: boolean;
            completed_at: string | null;
            sort_order: number;
          }>;
        }>;
      };

      application = {
        id: row.id,
        user_id: row.user_id,
        scholarship_id: row.scholarship_id,
        status: row.status,
        application_reference_id: row.application_reference_id,
        private_notes: row.private_notes,
        submitted_at: row.submitted_at,
        target_submission_date: row.target_submission_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
        scholarship: row.scholarships,
        checklist: row.application_checklists?.[0]
          ? {
              id: row.application_checklists[0].id,
              items: (row.application_checklists[0].checklist_items || []).map(
                (item) => ({
                  id: item.id,
                  item_title: item.item_title,
                  item_category: item.item_category,
                  guidance_notes: item.guidance_notes,
                  is_completed: item.is_completed,
                  completed_at: item.completed_at,
                  sort_order: item.sort_order,
                })
              ),
            }
          : undefined,
      };
    }
  } catch {
    // Database unpopulated
  }

  // Fallback demo for synthetic application IDs
  if (!application) {
    const seed = seedScholarships[0]!;
    application = {
      id: id,
      user_id: user.id,
      scholarship_id: `seed-${seed.code.toLowerCase()}`,
      status: "Preparing",
      application_reference_id: "NSP-2026-DEMO-001",
      private_notes:
        "Completed domicile verification at local e-District centre.",
      submitted_at: null,
      target_submission_date: "2026-11-20",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scholarship: {
        code: seed.code,
        slug: seed.slug,
        name: seed.name,
        provider_name: seed.provider_name,
        funding_type: seed.funding_type,
        student_deadline_at: seed.student_deadline_at,
        is_deadline_verified: seed.is_deadline_verified,
        official_application_url: seed.official_application_url,
      },
      checklist: {
        id: `cl-${id}`,
        items: [
          {
            id: "cl-item-1",
            item_title: "Verify One Time Registration (OTR) on NSP Portal",
            item_category: "registration",
            guidance_notes:
              "Obtain 14-digit OTR number via Face-RD or Aadhaar OTP on scholarships.gov.in.",
            is_completed: true,
            completed_at: "2026-11-04T10:00:00.000Z",
            sort_order: 1,
          },
          {
            id: "cl-item-2",
            item_title: "Confirm Aadhaar-Seeded DBT Bank Account",
            item_category: "verification",
            guidance_notes: "Ensure active DBT bank status on NPCI mapper.",
            is_completed: true,
            completed_at: "2026-11-04T11:00:00.000Z",
            sort_order: 2,
          },
          ...(seed.documents || []).map((doc, idx) => ({
            id: `cl-doc-${idx}`,
            item_title: doc.document_name,
            item_category: "document" as const,
            guidance_notes: doc.specification_notes,
            is_completed: idx === 0,
            completed_at: idx === 0 ? "2026-11-04T12:00:00.000Z" : null,
            sort_order: idx + 3,
          })),
        ],
      },
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <ApplicationChecklistView application={application} />
      </div>
    </div>
  );
}
