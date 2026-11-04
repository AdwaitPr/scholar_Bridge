import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
  title: "Terms of Service | ScholarBridge",
  description: "Terms and conditions for utilizing ScholarBridge.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-800 hover:text-slate-900 font-medium text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <span className="text-sm font-bold text-slate-900">
            Terms of Service
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
            <FileText className="h-4 w-4 text-blue-700" />
            <span>Platform Agreement</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Effective Date: November 4, 2026. Please read these terms carefully
            before utilizing ScholarBridge.
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              1. Nature of the Service
            </h2>
            <p>
              ScholarBridge is an independent, non-commercial informational tool
              designed to assist Indian students in discovering educational
              financial aid and tracking deadlines. ScholarBridge is not an
              application processing agent, government intermediary, or
              financial institution.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              2. No Submission on Behalf of Students
            </h2>
            <p>
              ScholarBridge does not submit scholarship applications on your
              behalf. All formal scholarship applications must be submitted
              directly by the student on the authoritative portal (such as
              scholarships.gov.in, state e-district portals, or foundation
              websites) using official registration credentials.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              3. Non-Commercial & Free Access
            </h2>
            <p>
              ScholarBridge is 100% free for students. We will never ask for
              payment, subscription fees, credit card information, or
              commissions from scholarship disbursements.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              4. Student Responsibility & Verification
            </h2>
            <p>
              While ScholarBridge verifies all seeded criteria against
              authoritative circulars, scholarship rules and deadlines may be
              amended by issuing bodies without prior notice. Students are
              responsible for verifying critical cutoffs on the primary
              government portal prior to submission.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
