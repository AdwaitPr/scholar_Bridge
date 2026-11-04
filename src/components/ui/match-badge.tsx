import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EligibilityOutcome } from "@/modules/eligibility-engine/evaluator";

interface MatchBadgeProps {
  outcome: EligibilityOutcome | string | null | undefined;
  className?: string;
  showIcon?: boolean;
}

export function MatchBadge({
  outcome,
  className,
  showIcon = true,
}: MatchBadgeProps) {
  if (!outcome) {
    return null;
  }

  switch (outcome) {
    case "Potential match":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300",
            className
          )}
        >
          {showIcon && (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
          )}
          <span>Potential Match</span>
        </span>
      );

    case "Additional information required":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300",
            className
          )}
        >
          {showIcon && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
          )}
          <span>Additional Info Required</span>
        </span>
      );

    case "Likely ineligible":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300",
            className
          )}
        >
          {showIcon && (
            <XCircle className="h-3.5 w-3.5 text-red-700 shrink-0" />
          )}
          <span>Likely Ineligible</span>
        </span>
      );

    case "Eligibility requires official verification":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-400",
            className
          )}
        >
          {showIcon && (
            <ShieldCheck className="h-3.5 w-3.5 text-teal-700 shrink-0" />
          )}
          <span>Official Verification Required</span>
        </span>
      );
  }
}
