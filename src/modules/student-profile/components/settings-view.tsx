"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Download,
  Trash2,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { StudentProfileInput } from "@/lib/schemas/profile.schema";

interface SettingsViewProps {
  initialProfile: StudentProfileInput | null;
  userEmail: string;
}

export function SettingsView({ initialProfile, userEmail }: SettingsViewProps) {
  const router = useRouter();

  // Profile Form State
  const [displayName, setDisplayName] = useState(
    initialProfile?.display_name || ""
  );
  const [academicPercentage, setAcademicPercentage] = useState(
    initialProfile?.academic_percentage?.toString() || ""
  );
  const [annualIncome, setAnnualIncome] = useState(
    initialProfile?.annual_family_income_inr?.toString() || ""
  );
  const [courseStream, setCourseStream] = useState(
    initialProfile?.course_stream || ""
  );
  const [courseYear, setCourseYear] = useState(
    initialProfile?.course_year?.toString() || "1"
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Reminder Preferences (ARRAY[30, 14, 7, 3, 1])
  const defaultThresholds = [30, 14, 7, 3, 1];
  const [selectedThresholds, setSelectedThresholds] = useState<number[]>(
    initialProfile?.reminder_days_before || defaultThresholds
  );
  const [isSavingReminders, setIsSavingReminders] = useState(false);

  // Account Deletion State
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const toggleThreshold = (day: number) => {
    if (selectedThresholds.includes(day)) {
      setSelectedThresholds(selectedThresholds.filter((d) => d !== day));
    } else {
      setSelectedThresholds([...selectedThresholds, day].sort((a, b) => b - a));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const payload = {
        ...initialProfile,
        display_name: displayName,
        academic_percentage: academicPercentage
          ? Number(academicPercentage)
          : null,
        annual_family_income_inr: annualIncome ? Number(annualIncome) : null,
        course_stream: courseStream || null,
        course_year: courseYear ? Number(courseYear) : null,
        reminder_days_before: selectedThresholds,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveReminders = async () => {
    setIsSavingReminders(true);
    try {
      const payload = {
        ...initialProfile,
        reminder_days_before: selectedThresholds,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save reminder preferences");
      }

      toast.success("Reminder preferences updated");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error(msg);
    } finally {
      setIsSavingReminders(false);
    }
  };

  const handleExportData = () => {
    const link = document.createElement("a");
    link.href = "/api/profile/export";
    link.setAttribute("download", "scholarbridge-export.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export started. Your data JSON is downloading.");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE MY ACCOUNT") {
      toast.error("Please type DELETE MY ACCOUNT to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: {
          "X-Confirm-Account-Deletion": "true",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }

      toast.success(
        "Your account and all associated data have been permanently deleted."
      );
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deletion failed";
      toast.error(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account & Privacy Settings
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage your student profile, deadline notification thresholds, and
          data privacy rights.
        </p>
      </div>

      {/* Strict Privacy by Minimization Banner */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-emerald-950">
          <p className="font-semibold text-emerald-900">
            Strict Data Minimization Guarantee
          </p>
          <p className="text-emerald-800 leading-relaxed">
            ScholarBridge never collects, requests, or stores your Aadhaar
            Number, PAN card, bank account details, IFSC codes, parent/guardian
            names, or physical home address. We do not accept or store uploaded
            identity documents.
          </p>
        </div>
      </div>

      {/* 1. Academic & Demographics Profile */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="h-4 w-4 text-blue-700" />
          <h2 className="text-base font-bold text-slate-900">
            Academic & Matching Profile
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Display Name
              </Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Aadya Sharma"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Registered Email
              </Label>
              <Input
                value={userEmail}
                disabled
                className="mt-1 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Course Stream / Major
              </Label>
              <Input
                value={courseStream}
                onChange={(e) => setCourseStream(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Current Course Year
              </Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={courseYear}
                onChange={(e) => setCourseYear(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Academic Percentage / Marks (%)
              </Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={academicPercentage}
                onChange={(e) => setAcademicPercentage(e.target.value)}
                placeholder="e.g. 84.5"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Annual Family Income (₹ INR)
              </Label>
              <Input
                type="number"
                min={0}
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                placeholder="e.g. 250000"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSavingProfile}
              className="bg-blue-700 hover:bg-blue-800 text-white font-medium"
            >
              {isSavingProfile ? "Saving..." : "Save Profile Changes"}
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Reminder & Deadline Notification Thresholds */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bell className="h-4 w-4 text-blue-700" />
          <h2 className="text-base font-bold text-slate-900">
            In-App Deadline Notification Thresholds
          </h2>
        </div>

        <p className="text-xs text-slate-600">
          Select when you want in-app reminders to trigger before a scholarship
          deadline closes. Reminders appear in your student dashboard command
          tray.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {[30, 14, 7, 3, 1].map((days) => {
            const isSelected = selectedThresholds.includes(days);
            return (
              <button
                key={days}
                type="button"
                onClick={() => toggleThreshold(days)}
                className={`flex items-center justify-between p-3 rounded-lg border text-xs font-medium transition-all ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/60 text-blue-900 font-semibold shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>
                  {days} {days === 1 ? "day" : "days"} before
                </span>
                {isSelected ? (
                  <CheckCircle2 className="h-4 w-4 text-blue-700" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveReminders}
            disabled={isSavingReminders}
          >
            {isSavingReminders ? "Updating..." : "Update Reminder Thresholds"}
          </Button>
        </div>
      </div>

      {/* 3. Export Data (GDPR / Data Portability - P8-T1) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Download className="h-4 w-4 text-blue-700" />
          <h2 className="text-base font-bold text-slate-900">
            Data Portability & Export
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Download a complete, machine-readable JSON archive of all records
          linked to your account, including your academic profile, saved
          scholarships, application tracker history, and checklist statuses.
        </p>

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportData}
            className="gap-2 text-slate-800"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Download My Data (JSON)</span>
          </Button>
        </div>
      </div>

      {/* 4. Dangerous Area: Permanent Account Deletion */}
      <div className="rounded-xl border border-red-200 bg-red-50/40 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-red-100 pb-3 text-red-900">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <h2 className="text-base font-bold">Delete Account & Erasure</h2>
        </div>

        <p className="text-xs text-red-800/90 leading-relaxed">
          Permanently delete your student account and all stored records. Once
          deleted, all saved scholarships, application preparation tracking
          records, checklists, and deadline reminders will be purged
          irreversibly.
        </p>

        {!showDeleteModal ? (
          <div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete My Account</span>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-red-300 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-900 font-semibold text-xs">
              <Lock className="h-4 w-4 text-red-600" />
              <span>Confirm Account Deletion</span>
            </div>
            <p className="text-xs text-slate-600">
              To proceed, please type{" "}
              <strong className="text-red-700">DELETE MY ACCOUNT</strong> below:
            </p>
            <Input
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Type DELETE MY ACCOUNT"
              className="font-mono text-xs border-red-300 focus-visible:ring-red-500"
            />
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="destructive"
                disabled={
                  deleteConfirmationText !== "DELETE MY ACCOUNT" || isDeleting
                }
                onClick={handleDeleteAccount}
                className="text-xs"
              >
                {isDeleting
                  ? "Deleting Permanently..."
                  : "Confirm Irreversible Deletion"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText("");
                }}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
