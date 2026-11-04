import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  StudentDashboardView,
  type DashboardMatchedScholarship,
  type DashboardReminderItem,
} from "@/modules/student-profile/components/student-dashboard-view";
import { evaluateScholarshipDeadline } from "@/modules/deadline-management/deadline.service";
import { evaluateScholarshipEligibility } from "@/modules/eligibility-engine/evaluator";
import type { ApplicationTrackerRecord } from "@/modules/tracker/tracker.service";
import type { RuleNode, StudentProfileInput } from "@/lib/schemas";
import seedScholarships from "../../../supabase/seed/scholarships.json";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  // 1. Fetch Student Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name || user.email?.split("@")[0] || "Student";
  const profileIncomplete =
    !profile?.education_level || !profile?.annual_family_income_inr;

  // 2. Fetch Active Applications
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
    // Database unpopulated
  }

  // 3. Fetch Due Reminders
  let dueReminders: DashboardReminderItem[] = [];
  try {
    const { data: dbReminders, error } = await supabase
      .from("reminders")
      .select(
        `
        id,
        application_id,
        scholarship_id,
        remind_at,
        reminder_label,
        scholarships:scholarship_id (
          name
        )
      `
      )
      .eq("user_id", user.id)
      .eq("is_dismissed", false)
      .lte("remind_at", new Date().toISOString())
      .order("remind_at", { ascending: false });

    if (!error && dbReminders) {
      dueReminders = dbReminders.map((r) => {
        const row = r as unknown as {
          id: string;
          application_id: string;
          scholarship_id: string;
          remind_at: string;
          reminder_label: string;
          scholarships?: { name: string };
        };
        return {
          id: row.id,
          application_id: row.application_id,
          scholarship_id: row.scholarship_id,
          scholarship_name: row.scholarships?.name || "Tracked Scholarship",
          remind_at: row.remind_at,
          reminder_label: row.reminder_label,
        };
      });
    }
  } catch {
    // Reminders unpopulated
  }

  // 4. Identify Urgent Deadlines (<= 7 days) and Top Matches
  const allScholarships = seedScholarships;
  const urgentScholarships: DashboardMatchedScholarship[] = [];
  const topMatches: DashboardMatchedScholarship[] = [];

  for (const s of allScholarships) {
    const deadline = evaluateScholarshipDeadline(
      s.student_deadline_at,
      s.is_deadline_verified
    );

    let matchOutcome = "Potential match";
    if (profile && s.rule_ast) {
      const evalResult = evaluateScholarshipEligibility(
        s.code,
        s.rule_ast as unknown as RuleNode,
        profile as unknown as StudentProfileInput,
        { freshApplicationsOpen: s.fresh_applications_open }
      );
      matchOutcome = evalResult.outcome;
    }

    const item: DashboardMatchedScholarship = {
      id: `seed-${s.code.toLowerCase()}`,
      code: s.code,
      slug: s.slug,
      name: s.name,
      provider_name: s.provider_name,
      funding_type: s.funding_type,
      max_annual_benefit_inr: s.max_annual_benefit_inr,
      benefits_summary: s.benefits_summary,
      deadlineEvaluation: deadline,
      matchOutcome,
    };

    if (
      deadline.urgency === "CRITICAL_72H" ||
      deadline.urgency === "URGENT_7D"
    ) {
      urgentScholarships.push(item);
    }

    if (
      matchOutcome === "Potential match" ||
      matchOutcome === "Eligibility requires official verification"
    ) {
      topMatches.push(item);
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
              href="/applications"
              className="hover:text-blue-700 transition-colors"
            >
              Applications
            </Link>
            <Link
              href="/deadlines"
              className="hover:text-blue-700 transition-colors"
            >
              Deadlines
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6 flex-1 w-full">
        <StudentDashboardView
          displayName={displayName}
          profileIncomplete={profileIncomplete}
          applications={applications}
          urgentScholarships={urgentScholarships}
          initialReminders={dueReminders}
          topMatches={topMatches}
        />
      </main>
    </div>
  );
}
