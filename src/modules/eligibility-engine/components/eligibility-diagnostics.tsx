"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Building2,
  ArrowLeft,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MatchBadge } from "@/components/ui/match-badge";
import { AntiFraudBanner } from "@/components/ui/anti-fraud-banner";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants/states";
import {
  evaluateScholarshipEligibility,
  type EligibilityEvaluationResult,
  OFFICIAL_DISCLAIMER,
} from "@/modules/eligibility-engine/evaluator";
import type { RuleNode, StudentProfileInput } from "@/lib/schemas";
import type { ScholarshipRecord } from "@/modules/scholarship-catalog/repository";

interface EligibilityDiagnosticsProps {
  scholarship: ScholarshipRecord;
  initialEvaluation: EligibilityEvaluationResult;
  initialProfile: Partial<StudentProfileInput> | null;
  ruleAst: RuleNode;
}

export function EligibilityDiagnostics({
  scholarship,
  initialEvaluation,
  initialProfile,
  ruleAst,
}: EligibilityDiagnosticsProps) {
  const [profile, setProfile] = useState<Partial<StudentProfileInput>>(
    initialProfile || {}
  );
  const [evaluation, setEvaluation] =
    useState<EligibilityEvaluationResult>(initialEvaluation);
  const [quickFillValues, setQuickFillValues] = useState<
    Record<string, unknown>
  >({});
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  const reEvaluate = (updatedProfile: Partial<StudentProfileInput>) => {
    const newEval = evaluateScholarshipEligibility(
      scholarship.id,
      ruleAst,
      updatedProfile as StudentProfileInput,
      { freshApplicationsOpen: scholarship.fresh_applications_open }
    );
    setEvaluation(newEval);
  };

  const handleQuickFillSubmit = async (
    field: string,
    overrideValue?: unknown
  ) => {
    const val =
      overrideValue !== undefined ? overrideValue : quickFillValues[field];
    if (val === undefined || val === "") return;

    setIsUpdating(true);
    setUpdateFeedback(null);

    const updatedProfile = {
      ...profile,
      [field]: val,
    };

    try {
      // If user is authenticated, save to database
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });

      setProfile(updatedProfile);
      reEvaluate(updatedProfile);
      setUpdateFeedback(
        `Updated ${field.replace(/_/g, " ")} and re-evaluated.`
      );
    } catch {
      // Even if network fails, re-evaluate statelessly in browser
      setProfile(updatedProfile);
      reEvaluate(updatedProfile);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderQuickFillInput = (field?: string) => {
    if (!field) return null;

    if (field === "annual_family_income_inr") {
      return (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Input
            type="number"
            step="10000"
            placeholder="e.g. 250000"
            value={(quickFillValues[field] as number) ?? ""}
            onChange={(e) =>
              setQuickFillValues({
                ...quickFillValues,
                [field]: parseInt(e.target.value, 10) || "",
              })
            }
            className="h-8 w-36 text-xs tabular-nums"
          />
          <Button
            size="sm"
            onClick={() => handleQuickFillSubmit(field)}
            disabled={isUpdating}
            className="h-8 text-xs bg-blue-700 hover:bg-blue-800 text-white"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Save & Re-evaluate"
            )}
          </Button>
        </div>
      );
    }

    if (field === "academic_percentage") {
      return (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Input
            type="number"
            step="0.1"
            placeholder="e.g. 82.5"
            value={(quickFillValues[field] as number) ?? ""}
            onChange={(e) =>
              setQuickFillValues({
                ...quickFillValues,
                [field]: parseFloat(e.target.value) || "",
              })
            }
            className="h-8 w-28 text-xs tabular-nums"
          />
          <Button
            size="sm"
            onClick={() => handleQuickFillSubmit(field)}
            disabled={isUpdating}
            className="h-8 text-xs bg-blue-700 hover:bg-blue-800 text-white"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Save & Re-evaluate"
            )}
          </Button>
        </div>
      );
    }

    if (field === "domicile_state") {
      return (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <select
            value={(quickFillValues[field] as string) ?? ""}
            onChange={(e) =>
              setQuickFillValues({
                ...quickFillValues,
                [field]: e.target.value,
              })
            }
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
          >
            <option value="">Select State</option>
            {INDIAN_STATES_AND_UTS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={() => handleQuickFillSubmit(field)}
            disabled={isUpdating}
            className="h-8 text-xs bg-blue-700 hover:bg-blue-800 text-white"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Save & Re-evaluate"
            )}
          </Button>
        </div>
      );
    }

    if (field === "social_category") {
      return (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <select
            value={(quickFillValues[field] as string) ?? ""}
            onChange={(e) =>
              setQuickFillValues({
                ...quickFillValues,
                [field]: e.target.value,
              })
            }
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
          >
            <option value="">Select Category</option>
            <option value="General">General</option>
            <option value="OBC">OBC</option>
            <option value="EWS">EWS</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="DNT">DNT</option>
            <option value="Minority">Minority</option>
          </select>
          <Button
            size="sm"
            onClick={() => handleQuickFillSubmit(field)}
            disabled={isUpdating}
            className="h-8 text-xs bg-blue-700 hover:bg-blue-800 text-white"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Save & Re-evaluate"
            )}
          </Button>
        </div>
      );
    }

    // Default boolean toggle
    return (
      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickFillSubmit(field, true)}
          disabled={isUpdating}
          className="h-8 text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
        >
          Yes, I satisfy this
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickFillSubmit(field, false)}
          disabled={isUpdating}
          className="h-8 text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-300"
        >
          No
        </Button>
      </div>
    );
  };

  const getOutcomeTheme = (outcome: EligibilityEvaluationResult["outcome"]) => {
    switch (outcome) {
      case "Potential match":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-900",
          accent: "text-emerald-700",
        };
      case "Additional information required":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-900",
          accent: "text-amber-700",
        };
      case "Likely ineligible":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-900",
          accent: "text-red-700",
        };
      case "Eligibility requires official verification":
        return {
          bg: "bg-teal-50",
          border: "border-teal-200",
          text: "text-teal-900",
          accent: "text-teal-700",
        };
    }
  };

  const theme = getOutcomeTheme(evaluation.outcome);

  return (
    <div className="space-y-6">
      {/* Anti-Fraud Banner */}
      <AntiFraudBanner />

      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href={`/scholarships/${scholarship.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {scholarship.name}</span>
        </Link>

        <Link href={`/scholarships/${scholarship.slug}`}>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
            <span>Scholarship Details</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Summary Diagnostic Card */}
      <div
        className={`rounded-2xl border p-6 shadow-sm transition-all ${theme.bg} ${theme.border}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200/60">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              <span>{scholarship.provider_name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Eligibility Diagnostics
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">{scholarship.name}</p>
          </div>

          <div className="shrink-0">
            <MatchBadge outcome={evaluation.outcome} />
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <p className={`text-sm font-semibold leading-relaxed ${theme.text}`}>
            {evaluation.summaryExplanation}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{evaluation.satisfiedConditions.length} Satisfied</span>
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="h-3.5 w-3.5" />
              <span>{evaluation.unsatisfiedConditions.length} Not Met</span>
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>
                {evaluation.missingInformationConditions.length} Missing
              </span>
            </span>
            <span className="flex items-center gap-1 text-teal-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                {evaluation.verificationRequiredConditions.length} Requires
                Verification
              </span>
            </span>
          </div>
        </div>
      </div>

      {updateFeedback && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
          <span>{updateFeedback}</span>
        </div>
      )}

      {/* 4 Diagnostics Accordions */}
      <div className="space-y-4">
        {/* 1. MISSING CRITERIA (Shown prominently if present) */}
        {evaluation.missingInformationConditions.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-white overflow-hidden shadow-xs">
            <div className="bg-amber-50/80 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <HelpCircle className="h-4 w-4 text-amber-600" />
                <span>
                  Missing Information (
                  {evaluation.missingInformationConditions.length})
                </span>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                Quick-fill to match
              </span>
            </div>

            <div className="divide-y divide-slate-100 p-4 space-y-4">
              {evaluation.missingInformationConditions.map((clause) => (
                <div
                  key={clause.conditionId}
                  className="pt-3 first:pt-0 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {clause.label}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {clause.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {clause.explanation}
                  </p>
                  {renderQuickFillInput(clause.field)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. FAILED CRITERIA */}
        {evaluation.unsatisfiedConditions.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-white overflow-hidden shadow-xs">
            <div className="bg-red-50/80 px-4 py-3 border-b border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>
                  Criteria Not Satisfied (
                  {evaluation.unsatisfiedConditions.length})
                </span>
              </div>
              <span className="text-[11px] font-semibold text-red-700 bg-red-100/80 px-2 py-0.5 rounded">
                Does not qualify
              </span>
            </div>

            <div className="divide-y divide-slate-100 p-4 space-y-3">
              {evaluation.unsatisfiedConditions.map((clause) => (
                <div
                  key={clause.conditionId}
                  className="pt-3 first:pt-0 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {clause.label}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                      {clause.category}
                    </span>
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed font-medium">
                    {clause.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SATISFIED CRITERIA */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="bg-emerald-50/80 px-4 py-3 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                Satisfied Criteria ({evaluation.satisfiedConditions.length})
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
              Verified from profile
            </span>
          </div>

          {evaluation.satisfiedConditions.length > 0 ? (
            <div className="divide-y divide-slate-100 p-4 space-y-3">
              {evaluation.satisfiedConditions.map((clause) => (
                <div
                  key={clause.conditionId}
                  className="pt-3 first:pt-0 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {clause.label}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {clause.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {clause.explanation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-4 text-xs text-slate-500">
              No criteria evaluated yet.
            </p>
          )}
        </div>

        {/* 4. REQUIRES OFFICIAL VERIFICATION */}
        {evaluation.verificationRequiredConditions.length > 0 && (
          <div className="rounded-xl border border-teal-200 bg-white overflow-hidden shadow-xs">
            <div className="bg-teal-50/80 px-4 py-3 border-b border-teal-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>
                  Requires Official Verification (
                  {evaluation.verificationRequiredConditions.length})
                </span>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded">
                External / Nodal Gate
              </span>
            </div>

            <div className="divide-y divide-slate-100 p-4 space-y-3">
              {evaluation.verificationRequiredConditions.map((clause) => (
                <div
                  key={clause.conditionId}
                  className="pt-3 first:pt-0 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {clause.label}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {clause.category}
                    </span>
                  </div>
                  <p className="text-xs text-teal-900 leading-relaxed font-medium">
                    {clause.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Official Disclaimer Footer */}
      <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-4 text-xs text-slate-600 leading-relaxed">
        <span className="font-bold text-slate-800 block mb-1">
          Official Disclaimer:
        </span>
        {OFFICIAL_DISCLAIMER}
      </div>
    </div>
  );
}
