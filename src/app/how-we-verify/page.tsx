import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
  title: "How We Verify Scholarships | ScholarBridge",
  description:
    "Learn about our strict source verification register, deterministic rules engine, and anti-hallucination standards.",
};

export default function HowWeVerifyPage() {
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
            ScholarBridge Provenance Standard
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
            <span>Zero Hallucination Guarantee</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            How ScholarBridge Verifies Every Scholarship
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            In India, students frequently miss life-changing educational aid
            because unofficial aggregators publish unverified deadlines or
            scrape obsolete circulars. ScholarBridge replaces probabilistic
            assumptions with a deterministic Source Verification Register.
          </p>
        </div>

        {/* 4 Pillars of Verification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Official Government Domains Only
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every scheme must link directly to an authoritative portal
              (`.gov.in`, `.nic.in`, `.ac.in`, or verified philanthropic
              foundations like `scholarships.reliancefoundation.org`). We
              strictly forbid citations from secondary blogs, coaching
              institutes, or lead-generation scrapers.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Multi-Tier Deadline Tracking
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Government portals enforce separate cutoff stages. ScholarBridge
              tracks both the <strong>Student Application Deadline</strong> and
              the subsequent{" "}
              <strong>
                Institute Nodal Officer (INO) Verification Deadline
              </strong>
              , preventing rejections caused by delayed college verification.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Deterministic Boolean AST Engine
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eligibility is evaluated using pure Boolean Abstract Syntax Trees
              (AND/OR trees). There is no generative AI or heuristic scoring in
              our matching engine: every decision provides a clause-level
              explanation with citations from the official guidelines.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Mandatory &quot;Deadline Not Verified&quot; Tag
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an official government circular has not confirmed the current
              cycle&apos;s closing date, we never guess or fabricate dates. The
              scheme is marked as{" "}
              <strong>&quot;Deadline not verified&quot;</strong>, urging the
              applicant to check the official portal directly.
            </p>
          </div>
        </div>

        {/* Audit Log Transparency */}
        <div className="rounded-xl border border-slate-200 bg-white p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Public Verification Audit Logs
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every scholarship record carries a public provenance record.
            Students can see exactly when the scholarship was last reviewed by
            an administrator, the official circular URL inspected, and any
            change notes recorded during the audit.
          </p>

          <div className="pt-2">
            <Link href="/scholarships">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold">
                Explore Verified Scholarships
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
