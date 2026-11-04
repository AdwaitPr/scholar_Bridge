"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Building2,
  Square,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { AntiFraudBanner } from "@/components/ui/anti-fraud-banner";
import { ApplicationTrackerService } from "@/modules/tracker/tracker.service";
import { evaluateScholarshipDeadline } from "@/modules/deadline-management/deadline.service";
import type { ApplicationTrackerRecord } from "@/modules/tracker/tracker.service";

interface ChecklistItem {
  id: string;
  item_title: string;
  item_category: "document" | "registration" | "verification" | "test";
  guidance_notes: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

interface ApplicationChecklistViewProps {
  application: ApplicationTrackerRecord;
}

export function ApplicationChecklistView({
  application: initialApp,
}: ApplicationChecklistViewProps) {
  const [app, setApp] = useState<ApplicationTrackerRecord>(initialApp);
  const [items, setItems] = useState<ChecklistItem[]>(
    initialApp.checklist?.items || []
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [refId, setRefId] = useState<string>(
    initialApp.application_reference_id || ""
  );
  const [notes, setNotes] = useState<string>(initialApp.private_notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const progress = ApplicationTrackerService.calculateChecklistProgress(items);
  const deadline = app.scholarship
    ? evaluateScholarshipDeadline(
        app.scholarship.student_deadline_at,
        app.scholarship.is_deadline_verified
      )
    : null;

  const handleToggleItem = async (item: ChecklistItem) => {
    const targetState = !item.is_completed;
    setTogglingId(item.id);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              is_completed: targetState,
              completed_at: targetState ? new Date().toISOString() : null,
            }
          : i
      )
    );

    try {
      const res = await fetch(`/api/checklists/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: targetState }),
      });

      if (!res.ok) {
        throw new Error("Failed to update item");
      }
    } catch {
      // Revert optimistic update on error
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                is_completed: item.is_completed,
                completed_at: item.completed_at,
              }
            : i
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotes(true);
    setSavedFeedback(null);

    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_reference_id: refId.trim() || null,
          private_notes: notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSavedFeedback("Application reference and private notes saved.");
      setTimeout(() => setSavedFeedback(null), 3500);
    } catch {
      setSavedFeedback("Error saving notes. Please try again.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const CATEGORIES = [
    { key: "registration", label: "1. Portal Registration & OTR" },
    { key: "document", label: "2. Eligibility Documents & Certificates" },
    { key: "verification", label: "3. Institutional & Nodal Verifications" },
    { key: "test", label: "4. Tests & Aptitude Requirements" },
  ] as const;

  return (
    <div className="space-y-6">
      <AntiFraudBanner />

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Applications</span>
        </Link>

        {app.scholarship?.official_application_url && (
          <a
            href={app.scholarship.official_application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5"
          >
            <Button
              size="sm"
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-8 gap-1.5"
            >
              <span>Apply on Official Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        )}
      </div>

      {/* Application Overview Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              <span>{app.scholarship?.provider_name || "Scholarship"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              {app.scholarship?.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {deadline && <DeadlineBadge deadline={deadline} />}
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {app.status}
            </span>
          </div>
        </div>

        {/* Readiness Meter */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Application Readiness Progress
            </span>
            <span className="text-xs font-bold text-blue-700 tabular-nums">
              {progress.completed} of {progress.total} tasks completed (
              {progress.percentage}%)
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progress.percentage === 100 ? "bg-emerald-600" : "bg-blue-600"
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              Status:{" "}
              <strong
                className={
                  progress.percentage === 100
                    ? "text-emerald-700 font-bold"
                    : "text-blue-700"
                }
              >
                {progress.readinessState}
              </strong>
            </span>
            {progress.percentage === 100 && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>All items completed — ready for submission!</span>
              </span>
            )}
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800 leading-relaxed">
            <strong>Preparation Notice:</strong> This checklist tracks your
            personal document readiness and submission tasks. Marking items as
            complete here does <em>not</em> submit your application to the
            government or private scholarship portal.
          </p>
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-6">
        {CATEGORIES.map((cat) => {
          const categoryItems = items.filter(
            (i) => i.item_category === cat.key
          );
          if (categoryItems.length === 0) return null;

          return (
            <div
              key={cat.key}
              className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
            >
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {cat.label}
                </h2>
              </div>

              <div className="divide-y divide-slate-100">
                {categoryItems.map((item) => {
                  const isBusy = togglingId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isBusy && handleToggleItem(item)}
                      className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer select-none ${
                        item.is_completed
                          ? "bg-slate-50/50 hover:bg-slate-50"
                          : "hover:bg-blue-50/30"
                      }`}
                    >
                      <button
                        type="button"
                        disabled={isBusy}
                        className="mt-0.5 shrink-0 text-slate-400 hover:text-blue-600 focus:outline-none"
                      >
                        {isBusy ? (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        ) : item.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-50" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-300" />
                        )}
                      </button>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold ${
                              item.is_completed
                                ? "text-slate-500 line-through"
                                : "text-slate-900"
                            }`}
                          >
                            {item.item_title}
                          </span>
                          {item.completed_at && (
                            <span className="text-[10px] text-emerald-700 font-medium tabular-nums">
                              Completed{" "}
                              {new Date(item.completed_at).toLocaleDateString(
                                "en-IN",
                                { timeZone: "Asia/Kolkata" }
                              )}
                            </span>
                          )}
                        </div>

                        {item.guidance_notes && (
                          <p
                            className={`text-xs leading-relaxed ${
                              item.is_completed
                                ? "text-slate-400"
                                : "text-slate-600"
                            }`}
                          >
                            {item.guidance_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Private Notes & Tracking ID Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Application Identifiers & Personal Notes
        </h2>

        {savedFeedback && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
            {savedFeedback}
          </div>
        )}

        <form onSubmit={handleSaveNotes} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="ref_id"
                className="text-xs font-semibold text-slate-700"
              >
                Application Reference / OTR Tracking ID
              </Label>
              <Input
                id="ref_id"
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                placeholder="e.g. NSP-2026-987654 or RF-UG-2026-1234"
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500">
                Your official reference number from the application portal.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="target_date"
                className="text-xs font-semibold text-slate-700"
              >
                My Target Submission Date
              </Label>
              <Input
                id="target_date"
                type="date"
                defaultValue={app.target_submission_date || ""}
                onChange={(e) => {
                  setApp({
                    ...app,
                    target_submission_date: e.target.value || null,
                  });
                }}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Aim to submit at least 5 days prior to student closing date.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="notes"
              className="text-xs font-semibold text-slate-700"
            >
              Private Preparation Notes
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Income certificate verified by Tehsildar on Oct 28. Requested bonafide from College Dean office."
              className="flex w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSavingNotes}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-9 px-4"
            >
              {isSavingNotes ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Save Identifiers & Notes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
