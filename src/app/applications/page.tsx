import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ApplicationTrackerService,
  type ApplicationTrackerRecord,
} from "@/modules/tracker/tracker.service";
import { ApplicationsTrackerView } from "@/modules/tracker/components/applications-tracker-view";
import { AntiFraudBanner } from "@/components/ui/anti-fraud-banner";
import seedScholarships from "../../../supabase/seed/scholarships.json";

interface ApplicationsPageProps {
  searchParams: Promise<{ scholarship_id?: string }>;
}

export default async function ApplicationsPage({
  searchParams,
}: ApplicationsPageProps) {
  const { scholarship_id } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=/applications${scholarship_id ? `?scholarship_id=${scholarship_id}` : ""}`
    );
  }

  // If user clicked "Track" for a scholarship, initialize the application atomically
  if (scholarship_id) {
    try {
      await ApplicationTrackerService.initializeApplicationWithChecklist(
        user.id,
        scholarship_id
      );
    } catch (err) {
      console.error("Error auto-initializing application:", err);
    }
  }

  let applications: ApplicationTrackerRecord[] = [];

  try {
    const { data: dbApps, error } = await supabase
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
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && dbApps && dbApps.length > 0) {
      const typedRows = dbApps as unknown as Array<{
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
      }>;

      applications = typedRows.map((row) => ({
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
      }));
    }
  } catch {
    // Database unpopulated / fallback
  }

  // Fallback demo item if table is empty
  if (applications.length === 0 && scholarship_id) {
    const seed =
      seedScholarships.find(
        (s) =>
          s.code.toLowerCase() === scholarship_id.toLowerCase() ||
          s.slug === scholarship_id
      ) || seedScholarships[0]!;

    if (seed) {
      applications = [
        {
          id: `demo-${seed.code.toLowerCase()}`,
          user_id: user.id,
          scholarship_id: `seed-${seed.code.toLowerCase()}`,
          status: "Saved",
          application_reference_id: null,
          private_notes: null,
          submitted_at: null,
          target_submission_date: null,
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
            id: `demo-cl-${seed.code.toLowerCase()}`,
            items: [
              {
                id: "demo-item-1",
                item_title: "Verify One Time Registration (OTR) on NSP Portal",
                item_category: "registration",
                guidance_notes:
                  "Obtain 14-digit OTR number via Face-RD or Aadhaar OTP on scholarships.gov.in.",
                is_completed: false,
                completed_at: null,
                sort_order: 1,
              },
              {
                id: "demo-item-2",
                item_title: "Confirm Aadhaar-Seeded DBT Bank Account",
                item_category: "verification",
                guidance_notes: "Ensure active DBT bank status on NPCI mapper.",
                is_completed: false,
                completed_at: null,
                sort_order: 2,
              },
              ...(seed.documents || []).map((doc, idx) => ({
                id: `demo-doc-${idx}`,
                item_title: doc.document_name,
                item_category: "document" as const,
                guidance_notes: doc.specification_notes,
                is_completed: false,
                completed_at: null,
                sort_order: idx + 3,
              })),
            ],
          },
        },
      ];
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Scholar<span className="text-blue-600">Bridge</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <Link
              href="/scholarships"
              className="hover:text-blue-700 transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/saved"
              className="hover:text-blue-700 transition-colors"
            >
              Saved
            </Link>
            <Link
              href="/deadlines"
              className="hover:text-blue-700 transition-colors"
            >
              Deadlines
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6 flex-1 w-full">
        <AntiFraudBanner />
        <ApplicationsTrackerView initialApplications={applications} />
      </main>
    </div>
  );
}
