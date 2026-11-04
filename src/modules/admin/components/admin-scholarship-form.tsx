"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Layers,
  FileText,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminRuleBuilder } from "@/modules/admin/components/admin-rule-builder";
import type { AdminScholarshipUpsertInput } from "@/lib/schemas/admin.schema";
import type { RuleNode } from "@/lib/schemas/rule-ast.schema";

interface AdminScholarshipFormProps {
  initialData?: Partial<AdminScholarshipUpsertInput>;
  isEditing?: boolean;
}

export function AdminScholarshipForm({
  initialData,
  isEditing = false,
}: AdminScholarshipFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "general" | "deadlines" | "rules" | "audit"
  >("general");

  const defaultRuleAst: RuleNode = initialData?.rule_ast || {
    type: "AND",
    id: "root",
    label: "All Mandatory Criteria",
    children: [
      {
        type: "CONDITION",
        id: "cond_income",
        category: "income",
        field: "annual_family_income_inr",
        operator: "lte",
        value: 450000,
        requiresOfficialVerification: false,
        externalGateOnly: false,
        label: "Income Limit",
        passExplanation: "Family income is within ₹4,50,000.",
        failExplanation: "Family income exceeds ₹4,50,000.",
        missingExplanation: "Family annual income is required.",
      },
    ],
  };

  const [formData, setFormData] = useState<AdminScholarshipUpsertInput>({
    code: initialData?.code || "",
    slug: initialData?.slug || "",
    name: initialData?.name || "",
    provider_name: initialData?.provider_name || "",
    provider_type: initialData?.provider_type || "central_government",
    funding_type: initialData?.funding_type || "merit_cum_means",
    description: initialData?.description || "",
    benefits_summary: initialData?.benefits_summary || "",
    max_annual_benefit_inr: initialData?.max_annual_benefit_inr ?? 50000,
    eligibility_summary: initialData?.eligibility_summary || "",
    application_instructions: initialData?.application_instructions || "",
    application_open_date: initialData?.application_open_date || "2026-07-01",
    student_deadline_at:
      initialData?.student_deadline_at || "2026-11-30T18:29:59.000Z",
    institute_verification_deadline_at:
      initialData?.institute_verification_deadline_at ||
      "2026-12-15T18:29:59.000Z",
    state_nodal_deadline_at:
      initialData?.state_nodal_deadline_at || "2026-12-31T18:29:59.000Z",
    is_deadline_verified: initialData?.is_deadline_verified ?? true,
    fresh_applications_open: initialData?.fresh_applications_open ?? true,
    renewal_applications_open: initialData?.renewal_applications_open ?? true,
    official_source_url:
      initialData?.official_source_url ||
      "https://scholarships.gov.in/All-Scholarships",
    official_application_url:
      initialData?.official_application_url || "https://scholarships.gov.in",
    verification_status: initialData?.verification_status || "verified",
    verification_note: initialData?.verification_note || "",
    is_active: initialData?.is_active ?? true,

    allowed_education_levels: initialData?.allowed_education_levels || [
      "undergraduate_technical",
      "undergraduate_general",
    ],
    max_income_inr: initialData?.max_income_inr ?? 450000,
    allowed_states: initialData?.allowed_states || null,
    allowed_courses: initialData?.allowed_courses || null,
    rule_ast: defaultRuleAst,
    eligibility_source_citation:
      initialData?.eligibility_source_citation ||
      "Authoritative guidelines on scholarships.gov.in",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (
      !formData.verification_note ||
      formData.verification_note.trim().length < 5
    ) {
      setErrorMessage(
        "Audit verification note is required (minimum 5 characters)."
      );
      setActiveTab("audit");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save scholarship");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error saving scholarship";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Catalog Management</span>
        </Link>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-9 px-4 gap-1.5 font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>
                {isEditing
                  ? "Update Scholarship & Audit"
                  : "Create Scholarship"}
              </span>
            </>
          )}
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "general"
              ? "bg-blue-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>1. General Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("deadlines")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "deadlines"
              ? "bg-blue-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>2. Deadlines & Portals</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "rules"
              ? "bg-blue-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>3. Eligibility Rule AST</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "audit"
              ? "bg-blue-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>4. Audit & Verification</span>
        </button>
      </div>

      {/* TAB 1: General Details */}
      {activeTab === "general" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Scholarship Code (e.g. SCH-01)
              </Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g. SCH-01"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">URL Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="e.g. aicte-pragati-degree"
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Scheme Full Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. AICTE Pragati Scholarship Scheme for Girl Students"
              required
              className="h-9 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Provider Name</Label>
              <Input
                value={formData.provider_name}
                onChange={(e) =>
                  setFormData({ ...formData, provider_name: e.target.value })
                }
                placeholder="e.g. AICTE / Ministry of Education"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Provider Type</Label>
              <select
                value={formData.provider_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    provider_type: e.target
                      .value as AdminScholarshipUpsertInput["provider_type"],
                  })
                }
                className="flex h-9 w-full rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold"
              >
                <option value="central_government">Central Government</option>
                <option value="state_government">State Government</option>
                <option value="statutory_body_aicte_ugc">
                  Statutory Body (AICTE/UGC)
                </option>
                <option value="private_foundation">Private Foundation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Funding Classification
              </Label>
              <select
                value={formData.funding_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    funding_type: e.target
                      .value as AdminScholarshipUpsertInput["funding_type"],
                  })
                }
                className="flex h-9 w-full rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold"
              >
                <option value="merit_based">Merit Based</option>
                <option value="need_welfare_based">Need / Welfare Based</option>
                <option value="merit_cum_means">Merit-cum-Means</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Benefits Summary</Label>
              <Input
                value={formData.benefits_summary}
                onChange={(e) =>
                  setFormData({ ...formData, benefits_summary: e.target.value })
                }
                placeholder="e.g. ₹50,000 per annum for tuition & incidentals"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Max Annual Benefit (INR)
              </Label>
              <Input
                type="number"
                value={formData.max_annual_benefit_inr ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_annual_benefit_inr:
                      parseInt(e.target.value, 10) || null,
                  })
                }
                className="h-9 text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Scheme Description</Label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              required
              className="flex w-full rounded border border-slate-300 p-2.5 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Official Application Instructions
            </Label>
            <textarea
              value={formData.application_instructions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  application_instructions: e.target.value,
                })
              }
              rows={3}
              required
              className="flex w-full rounded border border-slate-300 p-2.5 text-xs"
            />
          </div>
        </div>
      )}

      {/* TAB 2: Deadlines & Portals */}
      {activeTab === "deadlines" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Student Application Deadline (IST)
              </Label>
              <Input
                type="datetime-local"
                value={
                  formData.student_deadline_at
                    ? new Date(formData.student_deadline_at)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    student_deadline_at: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Institute (INO) Verification Deadline
              </Label>
              <Input
                type="datetime-local"
                value={
                  formData.institute_verification_deadline_at
                    ? new Date(formData.institute_verification_deadline_at)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    institute_verification_deadline_at: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                State Nodal Officer (SNO) Deadline
              </Label>
              <Input
                type="datetime-local"
                value={
                  formData.state_nodal_deadline_at
                    ? new Date(formData.state_nodal_deadline_at)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    state_nodal_deadline_at: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_deadline_verified}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_deadline_verified: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span>Deadline Verified by Admin</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={formData.fresh_applications_open}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fresh_applications_open: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span>Fresh Applications Open</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={formData.renewal_applications_open}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    renewal_applications_open: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span>Renewals Open</span>
            </label>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Official Source Provenance URL
              </Label>
              <Input
                value={formData.official_source_url}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    official_source_url: e.target.value,
                  })
                }
                placeholder="https://scholarships.gov.in/All-Scholarships"
                required
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500">
                Must be HTTPS and belong to allowlisted government domain
                (.gov.in, .nic.in, .ac.in).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Official Application Submission URL
              </Label>
              <Input
                value={formData.official_application_url}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    official_application_url: e.target.value,
                  })
                }
                placeholder="https://scholarships.gov.in"
                required
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Rules & Visual Builder */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Max Family Income Cap (INR)
                </Label>
                <Input
                  type="number"
                  value={formData.max_income_inr ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_income_inr: parseInt(e.target.value, 10) || null,
                    })
                  }
                  className="h-9 text-xs tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Eligibility Source Citation
                </Label>
                <Input
                  value={formData.eligibility_source_citation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eligibility_source_citation: e.target.value,
                    })
                  }
                  placeholder="e.g. Clause 4.2 of AICTE Pragati Guidelines 2026-27"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <AdminRuleBuilder
            initialRule={formData.rule_ast}
            onChange={(updated) =>
              setFormData({ ...formData, rule_ast: updated })
            }
          />
        </div>
      )}

      {/* TAB 4: Audit & Verification Note */}
      {activeTab === "audit" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Verification Status</Label>
            <select
              value={formData.verification_status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  verification_status: e.target
                    .value as AdminScholarshipUpsertInput["verification_status"],
                })
              }
              className="flex h-9 w-full rounded border border-slate-300 bg-white px-3 text-xs font-semibold"
            >
              <option value="verified">Verified (Active on portal)</option>
              <option value="verified_renewal_only">
                Verified Renewal Only
              </option>
              <option value="deadline_not_verified">
                Deadline Not Verified
              </option>
              <option value="flagged_for_review">Flagged for Review</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-900">
              Mandatory Admin Verification Audit Note{" "}
              <span className="text-red-500">*</span>
            </Label>
            <textarea
              value={formData.verification_note}
              onChange={(e) =>
                setFormData({ ...formData, verification_note: e.target.value })
              }
              rows={4}
              placeholder="e.g. Verified against official AICTE circular dated 04-Nov-2026 on scholarships.gov.in. Student deadline confirmed as 30-Nov-2026."
              required
              className="flex w-full rounded border border-slate-300 p-2.5 text-xs focus:ring-1 focus:ring-blue-600"
            />
            <p className="text-[11px] text-slate-500">
              This note is permanently recorded in{" "}
              <code>verification_logs</code> and published to students via the
              Source Provenance box.
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
