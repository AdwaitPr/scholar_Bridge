"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Kanban,
  Table as TableIcon,
  Edit3,
  FileCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  type ApplicationStatus,
  ALLOWED_STATUS_TRANSITIONS,
} from "@/lib/schemas/application.schema";
import { evaluateScholarshipDeadline } from "@/modules/deadline-management/deadline.service";
import type { ApplicationTrackerRecord } from "@/modules/tracker/tracker.service";

interface ApplicationsTrackerViewProps {
  initialApplications: ApplicationTrackerRecord[];
}

export function ApplicationsTrackerView({
  initialApplications,
}: ApplicationsTrackerViewProps) {
  const [applications, setApplications] =
    useState<ApplicationTrackerRecord[]>(initialApplications);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [editingApp, setEditingApp] = useState<ApplicationTrackerRecord | null>(
    null
  );
  const [refIdInput, setRefIdInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const KANBAN_COLUMNS: Array<{ status: ApplicationStatus; label: string }> = [
    { status: "Saved", label: "Saved" },
    { status: "Researching", label: "Researching" },
    { status: "Preparing", label: "Preparing" },
    { status: "Ready to apply", label: "Ready to Apply" },
    { status: "Submitted", label: "Submitted" },
    { status: "Awaiting result", label: "Awaiting Result" },
    { status: "Awarded", label: "Awarded" },
    { status: "Closed", label: "Closed" },
  ];

  const handleStatusChange = async (
    appId: string,
    targetStatus: ApplicationStatus
  ) => {
    setIsUpdating(true);
    setStatusError(null);

    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: targetStatus } : app
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating status";
      setStatusError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotesAndRef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/applications/${editingApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_reference_id: refIdInput.trim() || null,
          private_notes: notesInput.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save changes");

      setApplications((prev) =>
        prev.map((app) =>
          app.id === editingApp.id
            ? {
                ...app,
                application_reference_id: refIdInput.trim() || null,
                private_notes: notesInput.trim() || null,
              }
            : app
        )
      );
      setEditingApp(null);
    } catch {
      setStatusError("Failed to save application notes");
    } finally {
      setIsUpdating(false);
    }
  };

  if (applications.length === 0) {
    return (
      <EmptyState
        title="No Tracked Applications Yet"
        description="Add scholarships from the discovery catalog or your saved bookmarks to begin tracking checklist readiness, submission IDs, and deadlines."
        action={
          <Link href="/scholarships">
            <Button
              size="sm"
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-9"
            >
              Discover Scholarships
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Application Preparation Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your 9-stage scholarship lifecycle, checklist readiness, and
            portal application reference numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {statusError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-center justify-between">
          <span>{statusError}</span>
          <button
            onClick={() => setStatusError(null)}
            className="text-red-900 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
          {KANBAN_COLUMNS.map((col) => {
            const colApps = applications.filter(
              (app) => app.status === col.status
            );
            return (
              <div
                key={col.status}
                className="w-72 shrink-0 rounded-xl border border-slate-200 bg-slate-100/70 p-3 space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full tabular-nums">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[140px]">
                  {colApps.map((app) => {
                    const s = app.scholarship;
                    const items = app.checklist?.items || [];
                    const completed = items.filter(
                      (i) => i.is_completed
                    ).length;
                    const total = items.length;
                    const progressPct =
                      total > 0 ? Math.round((completed / total) * 100) : 0;
                    const deadline = s
                      ? evaluateScholarshipDeadline(
                          s.student_deadline_at,
                          s.is_deadline_verified
                        )
                      : null;

                    const validNext =
                      ALLOWED_STATUS_TRANSITIONS[app.status] || [];

                    return (
                      <div
                        key={app.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-2.5 transition-all hover:border-slate-300"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                            <span>{s?.code || "SCH"}</span>
                            {deadline && <DeadlineBadge deadline={deadline} />}
                          </div>
                          <h2 className="text-xs font-bold text-slate-900 line-clamp-2">
                            {s?.name || "Scholarship Application"}
                          </h2>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {s?.provider_name}
                          </p>
                        </div>

                        {/* Checklist progress bar */}
                        {total > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                              <span>Checklist</span>
                              <span className="tabular-nums">
                                {completed}/{total} ({progressPct}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 transition-all rounded-full"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Reference ID Pill */}
                        {app.application_reference_id && (
                          <div className="text-[10px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-100 font-semibold truncate">
                            Ref: {app.application_reference_id}
                          </div>
                        )}

                        {/* Private notes snippet */}
                        {app.private_notes && (
                          <p className="text-[11px] text-slate-600 italic line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                            &ldquo;{app.private_notes}&rdquo;
                          </p>
                        )}

                        {/* Card Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                          <Link href={`/applications/${app.id}/checklist`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] px-2 gap-1"
                            >
                              <FileCheck className="h-3 w-3 text-blue-700" />
                              <span>Checklist</span>
                            </Button>
                          </Link>

                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingApp(app);
                                setRefIdInput(
                                  app.application_reference_id || ""
                                );
                                setNotesInput(app.private_notes || "");
                              }}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                              title="Edit Ref ID & Private Notes"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>

                            {/* State Transition Selector */}
                            {validNext.length > 0 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleStatusChange(
                                      app.id,
                                      e.target.value as ApplicationStatus
                                    );
                                    e.target.value = "";
                                  }
                                }}
                                disabled={isUpdating}
                                className="h-7 text-[11px] rounded border border-slate-200 bg-white px-1.5 font-semibold text-slate-700 cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Move →
                                </option>
                                {validNext.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Scheme & Provider</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Checklist Readiness</th>
                <th className="py-3 px-4">Application Ref ID</th>
                <th className="py-3 px-4">Student Deadline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => {
                const s = app.scholarship;
                const items = app.checklist?.items || [];
                const completed = items.filter((i) => i.is_completed).length;
                const total = items.length;
                const pct =
                  total > 0 ? Math.round((completed / total) * 100) : 0;
                const deadline = s
                  ? evaluateScholarshipDeadline(
                      s.student_deadline_at,
                      s.is_deadline_verified
                    )
                  : null;
                const validNext = ALLOWED_STATUS_TRANSITIONS[app.status] || [];

                return (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                      <span className="block line-clamp-1">
                        {s?.name || "Application"}
                      </span>
                      <span className="text-[11px] font-normal text-slate-500 block">
                        {s?.provider_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 border border-slate-200">
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                          {completed}/{total}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                      {app.application_reference_id || (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {deadline ? <DeadlineBadge deadline={deadline} /> : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {validNext.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusChange(
                                app.id,
                                e.target.value as ApplicationStatus
                              );
                              e.target.value = "";
                            }
                          }}
                          disabled={isUpdating}
                          className="h-8 text-xs rounded border border-slate-200 bg-white px-2 font-semibold text-slate-700 cursor-pointer"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Move Stage
                          </option>
                          {validNext.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      )}
                      <Link href={`/applications/${app.id}/checklist`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                        >
                          Checklist
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Reference ID & Notes Dialog / Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveNotesAndRef}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Application Notes & Reference ID
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingApp.scholarship?.name}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="ref_id"
                className="text-xs font-semibold text-slate-700"
              >
                Official Application / OTR Reference ID
              </Label>
              <Input
                id="ref_id"
                value={refIdInput}
                onChange={(e) => setRefIdInput(e.target.value)}
                placeholder="e.g. NSP-2026-1234567 or OTR ID"
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500">
                Never enter passwords or OTPs. Only store your public tracking
                number.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="private_notes"
                className="text-xs font-semibold text-slate-700"
              >
                Private Preparation Notes
              </Label>
              <textarea
                id="private_notes"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                rows={4}
                placeholder="e.g. Submitted documents to College Scholarship Cell on Friday; awaiting INO sign-off."
                className="flex w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <p className="text-[11px] text-slate-500">
                Strictly private to your account via Supabase RLS.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingApp(null)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="h-8 text-xs bg-blue-700 hover:bg-blue-800 text-white"
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Save Notes"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
