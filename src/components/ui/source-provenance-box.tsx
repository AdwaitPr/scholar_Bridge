import React from "react";
import {
  ExternalLink,
  CheckCircle2,
  FileText,
  Calendar,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceProvenanceBoxProps {
  providerName: string;
  officialSourceUrl: string;
  officialApplicationUrl: string;
  lastVerifiedAt: string;
  studentDeadlineFormatted?: string | null;
  instituteVerificationNote?: string | null;
  guidelinesPdfUrl?: string | null;
  className?: string;
}

export function SourceProvenanceBox({
  providerName,
  officialSourceUrl,
  officialApplicationUrl,
  lastVerifiedAt,
  studentDeadlineFormatted,
  instituteVerificationNote,
  guidelinesPdfUrl,
  className,
}: SourceProvenanceBoxProps) {
  const verifiedDateStr = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(lastVerifiedAt));

  return (
    <div
      className={cn(
        "rounded-xl border border-teal-200 bg-teal-50/50 p-5 space-y-4 text-slate-800 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-teal-100 pb-3">
        <div className="flex items-center gap-2 text-teal-900 font-semibold">
          <CheckCircle2 className="h-5 w-5 text-teal-600" />
          <span>Source-Verified Provenance</span>
        </div>
        <span className="text-xs text-teal-700 bg-teal-100/70 px-2.5 py-0.5 rounded-full font-medium">
          Verified on {verifiedDateStr} IST
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> Authoritative Provider
          </span>
          <p className="font-semibold text-slate-900">{providerName}</p>
        </div>

        {studentDeadlineFormatted && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Student Application Deadline
            </span>
            <p className="font-semibold text-slate-900 tabular-nums">
              {studentDeadlineFormatted}
            </p>
          </div>
        )}
      </div>

      {instituteVerificationNote && (
        <div className="rounded-lg bg-teal-100/40 p-2.5 text-xs text-teal-900 font-medium">
          🏛️ <strong>Defective & Institute Verification:</strong>{" "}
          {instituteVerificationNote}
        </div>
      )}

      <div className="pt-2 flex flex-wrap items-center gap-3">
        <a
          href={officialApplicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
        >
          <span>Apply on Official Portal</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <a
          href={officialSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-xs rounded-lg transition-colors"
        >
          <span>View Source Notification</span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </a>

        {guidelinesPdfUrl && (
          <a
            href={guidelinesPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-xs rounded-lg transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-red-600" />
            <span>Scheme Guidelines PDF</span>
          </a>
        )}
      </div>
    </div>
  );
}
