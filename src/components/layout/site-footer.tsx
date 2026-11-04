import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-950 text-base">
                ScholarBridge
              </span>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                Non-Official Student Aid Guide
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-md">
              A deterministic, source-verified discovery and application
              lifecycle platform for Indian students (school to postgraduate).
              Powered by an explainable rules engine with strict data
              minimization.
            </p>
            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-2.5 max-w-md">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
              <p className="text-[11px] font-medium">
                Government scholarship applications on NSP are 100% free. Never
                pay agent or processing fees.
              </p>
            </div>
          </div>

          {/* Verification & Trust */}
          <div className="space-y-2.5">
            <p className="font-bold text-slate-900 tracking-wide uppercase text-[11px]">
              Provenance & Transparency
            </p>
            <ul className="space-y-2 text-slate-600">
              <li>
                <Link
                  href="/how-we-verify"
                  className="hover:text-blue-700 hover:underline"
                >
                  How We Verify Data
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer"
                  className="hover:text-blue-700 hover:underline"
                >
                  Non-Affiliation Disclaimer
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-blue-700 hover:underline"
                >
                  Strict Data Minimization Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-blue-700 hover:underline"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Portals */}
          <div className="space-y-2.5">
            <p className="font-bold text-slate-900 tracking-wide uppercase text-[11px]">
              Authoritative Portals
            </p>
            <ul className="space-y-2 text-slate-600">
              <li>
                <a
                  href="https://scholarships.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-blue-700 hover:underline"
                >
                  <span>National Scholarship Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.myscheme.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-blue-700 hover:underline"
                >
                  <span>myScheme (Govt of India)</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://ugc.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-blue-700 hover:underline"
                >
                  <span>University Grants Commission</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.aicte-india.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-blue-700 hover:underline"
                >
                  <span>AICTE India</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>
            © {new Date().getFullYear()} ScholarBridge. All rights reserved.
          </p>
          <p className="text-center sm:text-right">
            Asia/Kolkata Timezone (IST, UTC+05:30) • Non-commercial educational
            initiative.
          </p>
        </div>
      </div>
    </footer>
  );
}
