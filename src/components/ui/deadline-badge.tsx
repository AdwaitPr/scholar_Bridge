import React from "react";
import {
  Clock,
  AlertCircle,
  AlertOctagon,
  HelpCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvaluatedDeadline } from "@/modules/deadline-management/deadline.service";

interface DeadlineBadgeProps {
  deadline: EvaluatedDeadline;
  className?: string;
  showIcon?: boolean;
}

export function DeadlineBadge({
  deadline,
  className,
  showIcon = true,
}: DeadlineBadgeProps) {
  const { urgency, displayText } = deadline;

  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-300";
  let icon = <Clock className="h-3.5 w-3.5 shrink-0" />;

  switch (urgency) {
    case "CRITICAL_72H":
      badgeStyle = "bg-red-100 text-red-800 border-red-300 font-bold";
      icon = <AlertOctagon className="h-3.5 w-3.5 text-red-700 shrink-0" />;
      break;
    case "URGENT_7D":
      badgeStyle = "bg-amber-100 text-amber-800 border-amber-300 font-semibold";
      icon = <AlertCircle className="h-3.5 w-3.5 text-amber-700 shrink-0" />;
      break;
    case "UPCOMING_30D":
      badgeStyle = "bg-blue-50 text-blue-800 border-blue-200";
      icon = <Clock className="h-3.5 w-3.5 text-blue-700 shrink-0" />;
      break;
    case "OPEN_PLENTY_OF_TIME":
      badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
      icon = <CheckCircle className="h-3.5 w-3.5 text-emerald-700 shrink-0" />;
      break;
    case "EXPIRED":
      badgeStyle = "bg-rose-50 text-rose-800 border-rose-200 opacity-90";
      icon = <AlertCircle className="h-3.5 w-3.5 text-rose-700 shrink-0" />;
      break;
    case "UNVERIFIED":
    default:
      badgeStyle = "bg-slate-50 text-slate-600 border-slate-200 border-dashed";
      icon = <HelpCircle className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border tabular-nums",
        badgeStyle,
        className
      )}
    >
      {showIcon && icon}
      <span>{displayText}</span>
    </span>
  );
}
