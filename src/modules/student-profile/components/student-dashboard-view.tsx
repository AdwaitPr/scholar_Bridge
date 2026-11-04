"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { MatchBadge } from "@/components/ui/match-badge";
import { AntiFraudBanner } from "@/components/ui/anti-fraud-banner";
import type { ApplicationTrackerRecord } from "@/modules/tracker/tracker.service";
import type { EvaluatedDeadline } from "@/modules/deadline-management/deadline.service";

export interface DashboardMatchedScholarship {
  id: string;
  code: string;
  slug: string;
  name: string;
  provider_name: string;
  funding_type: string;
  max_annual_benefit_inr: number | null;
  benefits_summary: string;
  deadlineEvaluation: EvaluatedDeadline;
  matchOutcome: string;
}

export interface DashboardReminderItem {
  id: string;
  application_id: string;
  scholarship_id: string;
  scholarship_name: string;
  remind_at: string;
  reminder_label: string;
}

interface StudentDashboardViewProps {
  displayName: string;
  profileIncomplete: boolean;
  applications: ApplicationTrackerRecord[];
  urgentScholarships: DashboardMatchedScholarship[];
  initialReminders: DashboardReminderItem[];
  topMatches: DashboardMatchedScholarship[];
}

export function StudentDashboardView({
  displayName,
  profileIncomplete,
  applications,
  urgentScholarships,
  initialReminders,
  topMatches,
}: StudentDashboardViewProps) {
  const [reminders, setReminders] =
    useState<DashboardReminderItem[]>(initialReminders);

  const handleDismissReminder = async (reminderId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    try {
      await fetch("/api/reminders/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminder_id: reminderId }),
      });
    } catch {
      // Ignored
    }
  };

  return (
    <div className="space-y-6">
      <AntiFraudBanner />

      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {displayName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Student Command Center: Academic Year 2026–27 verified scholarships
            & preparation tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/onboarding">
            <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-700" />
              <span>Update Profile</span>
            </Button>
          </Link>
          <Link href="/scholarships">
            <Button
              size="sm"
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-9 gap-1.5"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Incomplete Callout */}
      {profileIncomplete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">
                Complete Your Profile for 100% Deterministic Matching
              </span>
              <span className="text-amber-800">
                You haven&apos;t completed all 4 onboarding steps yet. Complete
                your academic details to uncover all eligible schemes.
              </span>
            </div>
          </div>
          <Link href="/onboarding" className="shrink-0">
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
            >
              Complete Onboarding
            </Button>
          </Link>
        </div>
      )}

      {/* URGENT DEADLINE BANNER (<= 7 Days) */}
      {urgentScholarships.length > 0 && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50/90 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-900 font-extrabold text-sm sm:text-base">
              <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
              <span>Urgent Application Deadlines (Closing in &le; 7 Days)</span>
            </div>
            <Link
              href="/deadlines"
              className="text-xs font-bold text-red-800 hover:underline"
            >
              View Calendar &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentScholarships.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-red-200 bg-white p-4 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                    {s.provider_name}
                  </span>
                  <Link
                    href={`/scholarships/${s.slug}`}
                    className="text-xs font-bold text-slate-900 hover:text-blue-700 line-clamp-1 block"
                  >
                    {s.name}
                  </Link>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {s.deadlineEvaluation.displayText}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link href={`/applications?scholarship_id=${s.code}`}>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                    >
                      Finish Tracker
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTIFICATION TRAY (Due Reminders) */}
      {reminders.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-blue-950 text-xs sm:text-sm">
              <Bell className="h-4 w-4 text-blue-700" />
              <span>Due Reminders ({reminders.length})</span>
            </div>
          </div>

          <div className="divide-y divide-blue-100 bg-white rounded-lg border border-blue-100">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">
                    {r.scholarship_name}
                  </span>
                  <span className="text-blue-800 font-semibold">
                    {r.reminder_label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/applications/${r.application_id}/checklist`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                    >
                      Open Checklist
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismissReminder(r.id)}
                    className="h-7 text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE APPLICATIONS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-blue-700" />
            <span>Active Tracked Applications ({applications.length})</span>
          </h2>
          <Link
            href="/applications"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            View All in Board &rarr;
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
            <p className="text-xs text-slate-500">
              You haven&apos;t started tracking any scholarship applications
              yet.
            </p>
            <Link href="/scholarships">
              <Button size="sm" variant="outline" className="text-xs h-8">
                Explore Scholarships to Track
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((app) => {
              const s = app.scholarship;
              const items = app.checklist?.items || [];
              const completed = items.filter((i) => i.is_completed).length;
              const total = items.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div
                  key={app.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">
                        {s?.code || "SCH"}
                      </span>
                      <span className="font-bold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {app.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {s?.name || "Application"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {s?.provider_name}
                    </p>

                    {/* Progress */}
                    {total > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                          <span>Checklist Progress</span>
                          <span className="tabular-nums">
                            {completed}/{total} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct === 100 ? "bg-emerald-600" : "bg-blue-600"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                      {app.application_reference_id
                        ? `Ref: ${app.application_reference_id}`
                        : "No Ref ID"}
                    </span>
                    <Link href={`/applications/${app.id}/checklist`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                      >
                        Open Checklist
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TOP MATCHED SCHOLARSHIPS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Top Matched Opportunities for Your Profile</span>
          </h2>
          <Link
            href="/scholarships?matched=true"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            View All Matches &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topMatches.slice(0, 6).map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <MatchBadge outcome={m.matchOutcome} />
                  <DeadlineBadge deadline={m.deadlineEvaluation} />
                </div>

                <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                  <Link
                    href={`/scholarships/${m.slug}`}
                    className="hover:text-blue-700"
                  >
                    {m.name}
                  </Link>
                </h3>
                <p className="text-[11px] text-slate-500">{m.provider_name}</p>

                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Benefit
                  </span>
                  <span className="text-sm font-black text-slate-900 tabular-nums">
                    {m.max_annual_benefit_inr
                      ? `₹${m.max_annual_benefit_inr.toLocaleString("en-IN")}/yr`
                      : m.benefits_summary}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/scholarships/${m.slug}/eligibility`}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-blue-700 p-0"
                  >
                    Diagnostics &rarr;
                  </Button>
                </Link>
                <Link href={`/applications?scholarship_id=${m.code}`}>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    Track
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
