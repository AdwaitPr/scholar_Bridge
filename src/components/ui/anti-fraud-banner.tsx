import React from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AntiFraudBannerProps {
  className?: string;
  compact?: boolean;
}

export function AntiFraudBanner({
  className,
  compact = false,
}: AntiFraudBannerProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md text-xs text-amber-900",
          className
        )}
      >
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
          <span>
            Government scholarship applications on NSP are 100% free. Never pay
            agent fees.
          </span>
        </div>
        <a
          href="https://scholarships.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-blue-700 hover:underline shrink-0 font-semibold"
        >
          Verify on NSP <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-amber-300 bg-amber-50/90 p-4 text-amber-950 shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm">
          <h4 className="font-semibold text-amber-900">
            Anti-Fraud & Zero-Fee Guarantee
          </h4>
          <p className="text-amber-800 leading-relaxed text-xs sm:text-sm">
            All Central and State government scholarships hosted on the{" "}
            <strong>National Scholarship Portal (scholarships.gov.in)</strong>{" "}
            and state portals are completely free. ScholarBridge never asks for
            fees, bank PINs, or uploaded document scans. Always submit
            applications directly on authoritative government portals.
          </p>
          <div className="pt-1">
            <a
              href="https://scholarships.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              Verify official portal notice on scholarships.gov.in
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
