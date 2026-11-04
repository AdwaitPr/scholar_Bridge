import React from "react";
import Link from "next/link";
import { ArrowUpRight, Bookmark, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { MatchBadge } from "@/components/ui/match-badge";
import type { EvaluatedDeadline } from "@/modules/deadline-management/deadline.service";
import type { EligibilityEvaluationResult } from "@/modules/eligibility-engine/evaluator";

interface ScholarshipCardProps {
  id: string;
  slug: string;
  name: string;
  providerName: string;
  fundingType: string;
  benefitsSummary: string;
  maxAnnualBenefitInr: number | null;
  eligibilitySummary: string;
  deadlineEvaluation: EvaluatedDeadline;
  eligibilityEvaluation?: EligibilityEvaluationResult | null;
  isSaved?: boolean;
  onToggleSave?: (scholarshipId: string) => void;
  className?: string;
}

export function ScholarshipCard({
  id,
  slug,
  name,
  providerName,
  benefitsSummary,
  maxAnnualBenefitInr,
  eligibilitySummary,
  deadlineEvaluation,
  eligibilityEvaluation,
  isSaved = false,
  onToggleSave,
  className,
}: ScholarshipCardProps) {
  const formattedAmount = maxAnnualBenefitInr
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(maxAnnualBenefitInr)
    : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md",
        className
      )}
    >
      <div className="space-y-3">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <DeadlineBadge deadline={deadlineEvaluation} />
            {eligibilityEvaluation && (
              <MatchBadge outcome={eligibilityEvaluation.outcome} />
            )}
          </div>

          {onToggleSave && (
            <button
              onClick={() => onToggleSave(id)}
              aria-label={isSaved ? "Remove from saved" : "Save scholarship"}
              className={cn(
                "rounded-full p-1.5 transition-colors",
                isSaved
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              )}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
            </button>
          )}
        </div>

        {/* Title and Provider */}
        <div>
          <Link
            href={`/scholarships/${slug}`}
            className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2"
          >
            {name}
          </Link>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 font-medium">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{providerName}</span>
          </div>
        </div>

        {/* Financial Benefit Highlight */}
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block">
            Financial Benefit
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            {formattedAmount ? (
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {formattedAmount}
                <span className="text-xs font-normal text-slate-500">
                  {" "}
                  / year
                </span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-800">
                {benefitsSummary}
              </span>
            )}
          </div>
        </div>

        {/* Eligibility Brief */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {eligibilitySummary}
        </p>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <Link
          href={`/scholarships/${slug}/eligibility`}
          className="text-slate-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline"
        >
          Check Eligibility Criteria
        </Link>

        <Link
          href={`/scholarships/${slug}`}
          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800"
        >
          <span>View Details</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
