"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar as CalendarIcon, Download, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import {
  evaluateScholarshipDeadline,
  formatInIST,
  type EvaluatedDeadline,
} from "@/modules/deadline-management/deadline.service";
import {
  generateDeadlinesICS,
  downloadICSFile,
  type CalendarEventInput,
} from "@/modules/deadline-management/ics-generator";

export interface ScholarshipDeadlineItem {
  id: string;
  code: string;
  slug: string;
  name: string;
  provider_name: string;
  student_deadline_at: string | null;
  institute_verification_deadline_at: string | null;
  state_nodal_deadline_at: string | null;
  is_deadline_verified: boolean;
  official_application_url: string;
}

interface DeadlineCalendarViewProps {
  scholarships: ScholarshipDeadlineItem[];
}

export function DeadlineCalendarView({
  scholarships,
}: DeadlineCalendarViewProps) {
  const [viewMode, setViewMode] = useState<"agenda" | "month">("agenda");
  const [filterType, setFilterType] = useState<"all" | "student" | "institute">(
    "all"
  );

  // Flatten events for timeline
  const timelineEvents: Array<{
    id: string;
    scholarship: ScholarshipDeadlineItem;
    type: "student" | "institute" | "state_nodal";
    deadlineAt: string;
    evaluation: EvaluatedDeadline;
  }> = [];

  for (const s of scholarships) {
    if (
      s.student_deadline_at &&
      (filterType === "all" || filterType === "student")
    ) {
      timelineEvents.push({
        id: `${s.id}-student`,
        scholarship: s,
        type: "student",
        deadlineAt: s.student_deadline_at,
        evaluation: evaluateScholarshipDeadline(
          s.student_deadline_at,
          s.is_deadline_verified
        ),
      });
    }

    if (
      s.institute_verification_deadline_at &&
      (filterType === "all" || filterType === "institute")
    ) {
      timelineEvents.push({
        id: `${s.id}-institute`,
        scholarship: s,
        type: "institute",
        deadlineAt: s.institute_verification_deadline_at,
        evaluation: evaluateScholarshipDeadline(
          s.institute_verification_deadline_at,
          s.is_deadline_verified
        ),
      });
    }

    if (s.state_nodal_deadline_at && filterType === "all") {
      timelineEvents.push({
        id: `${s.id}-sno`,
        scholarship: s,
        type: "state_nodal",
        deadlineAt: s.state_nodal_deadline_at,
        evaluation: evaluateScholarshipDeadline(
          s.state_nodal_deadline_at,
          s.is_deadline_verified
        ),
      });
    }
  }

  // Sort chronologically by date
  timelineEvents.sort(
    (a, b) =>
      new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime()
  );

  const handleExportICS = () => {
    const events: CalendarEventInput[] = timelineEvents
      .filter(
        (e) =>
          e.scholarship.is_deadline_verified &&
          e.evaluation.urgency !== "EXPIRED"
      )
      .map((e) => ({
        id: e.scholarship.code,
        name: e.scholarship.name,
        provider: e.scholarship.provider_name,
        deadlineIso: e.deadlineAt,
        type: e.type,
        url: e.scholarship.official_application_url,
      }));

    const icsString = generateDeadlinesICS(events);
    downloadICSFile("scholarbridge-deadlines-2026.ics", icsString);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-700" />
            <span>Scholarship Deadline Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track student application, institute nodal verification, and state
            defect correction closing dates in IST (UTC+05:30).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* ICS Export Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportICS}
            className="text-xs h-9 gap-1.5 shadow-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export to Calendar (.ics)</span>
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "agenda"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Agenda
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "month"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Month Grid
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-full font-semibold border transition-all ${
            filterType === "all"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Deadlines ({scholarships.length * 2})
        </button>
        <button
          onClick={() => setFilterType("student")}
          className={`px-3 py-1.5 rounded-full font-semibold border transition-all ${
            filterType === "student"
              ? "bg-blue-700 text-white border-blue-700"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          🎓 Student Deadlines Only
        </button>
        <button
          onClick={() => setFilterType("institute")}
          className={`px-3 py-1.5 rounded-full font-semibold border transition-all ${
            filterType === "institute"
              ? "bg-teal-700 text-white border-teal-700"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          🏛️ Institute Verification (INO)
        </button>
      </div>

      {/* AGENDA TIMELINE VIEW */}
      {viewMode === "agenda" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {timelineEvents.map((evt) => {
              const s = evt.scholarship;
              const isStudent = evt.type === "student";
              const isInstitute = evt.type === "institute";

              return (
                <div
                  key={evt.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isStudent
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : isInstitute
                              ? "bg-teal-50 text-teal-800 border-teal-200"
                              : "bg-purple-50 text-purple-800 border-purple-200"
                        }`}
                      >
                        {isStudent
                          ? "Student Closing Date"
                          : isInstitute
                            ? "Institute (INO) Verification"
                            : "State Nodal (SNO) Verification"}
                      </span>

                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {s.code}
                      </span>
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      <Link
                        href={`/scholarships/${s.slug}`}
                        className="hover:text-blue-700"
                      >
                        {s.name}
                      </Link>
                    </h2>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{s.provider_name}</span>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-slate-900 block tabular-nums">
                        {formatInIST(evt.deadlineAt)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Indian Standard Time
                      </span>
                    </div>

                    <DeadlineBadge deadline={evt.evaluation} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MONTH GRID VIEW */}
      {viewMode === "month" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="text-center pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              November 2026 — Key Application Windows
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Major federal schemes on NSP close for students on November 30,
              2026.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 space-y-2">
              <span className="text-xs font-bold text-red-900 uppercase tracking-wider block">
                November 15, 2026
              </span>
              <p className="text-xs font-bold text-slate-900">
                NMMS School Scholarship (SCH-13)
              </p>
              <p className="text-[11px] text-slate-600">
                Class 8 / 9 National Means-cum-Merit closing date.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                November 30, 2026 (Major Spike)
              </span>
              <p className="text-xs font-bold text-slate-900">
                AICTE Pragati, Saksham, Swanath, Ishan Uday & NSPGS
              </p>
              <p className="text-[11px] text-slate-600">
                Student online application closes at 23:59:59 IST.
              </p>
            </div>

            <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4 space-y-2">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider block">
                December 15, 2026
              </span>
              <p className="text-xs font-bold text-slate-900">
                Institute Nodal Officer (INO) Verification
              </p>
              <p className="text-[11px] text-slate-600">
                AISHE registered college authorities must sign off on submitted
                applications.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
