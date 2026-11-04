import React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AntiFraudBanner } from "@/components/ui/anti-fraud-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { ScholarshipCatalogRepository } from "@/modules/scholarship-catalog/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const { total } = await ScholarshipCatalogRepository.list({
    sort: "deadline_asc",
    page: 1,
    page_size: 6,
    hide_expired: false,
  });

  let studentProfile = null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      studentProfile = profile;
    }
  } catch {
    // Unauthenticated
  }

  const QUICK_LEVELS = [
    { label: "Class 9 - 12 (School)", value: "school_class_11_12" },
    { label: "Diploma / Polytechnic", value: "diploma_technical" },
    { label: "UG (B.Tech / Technical)", value: "undergraduate_technical" },
    { label: "UG (BA / BSc / BCom)", value: "undergraduate_general" },
    { label: "Postgraduate (PG)", value: "postgraduate_general" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Scholar<span className="text-blue-600">Bridge</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link
              href="/scholarships"
              className="hover:text-blue-700 transition-colors"
            >
              Discover Scholarships
            </Link>
            <Link
              href="/deadlines"
              className="hover:text-blue-700 transition-colors"
            >
              Deadline Calendar
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {studentProfile ? (
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="bg-blue-700 hover:bg-blue-800 text-xs h-8"
                >
                  Student Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button size="sm" variant="ghost" className="text-xs h-8">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-xs h-8"
                  >
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-16 space-y-8">
        <AntiFraudBanner />

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>AY 2026–27 Verified Scholarship Portal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Discover Government & Foundation Scholarships You Actually Qualify
            For.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Eliminating guesswork with deterministic, source-verified
            eligibility matching. No AI hallucinations, no hidden fees, and zero
            storage of Aadhaar or sensitive bank documents.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/scholarships">
              <Button
                size="lg"
                className="bg-blue-700 hover:bg-blue-800 text-sm h-11 px-6 shadow-sm gap-2"
              >
                <span>Browse {total} Verified Scholarships</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/onboarding">
              <Button size="lg" variant="outline" className="text-sm h-11 px-6">
                Check My Eligibility Match
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Ecosystem Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Verified Schemes
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {total}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Central, State & Foundations
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Max Payout per Student
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              ₹3,00,000
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              UGC & Top Class Programs
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Deterministic Logic
            </span>
            <p className="text-3xl font-black text-emerald-700 mt-1">100%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Source-Verified Rules Engine
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Data Privacy
            </span>
            <p className="text-3xl font-black text-blue-700 mt-1">Zero PII</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              No Aadhaar / Bank IDs stored
            </p>
          </div>
        </div>

        {/* Quick Search by Education Level */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-blue-700" />
            <span>Quick Filter by Education Level</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_LEVELS.map((level) => (
              <Link
                key={level.value}
                href={`/scholarships?education_level=${level.value}`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                >
                  {level.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* 6-Step Student Journey */}
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              The 6-Step ScholarBridge Journey
            </h2>
            <p className="text-xs text-slate-500">
              From discovering official schemes to submitting your final
              verification on NSP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                <span>01. Profile Onboarding</span>
                <span className="bg-blue-100 px-2 py-0.5 rounded-full">
                  Zero PII
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Enter your education level, state domicile, and income bracket
                in a 90-second form.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                <span>02. Deterministic Matching</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Explainable
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Our Boolean AST rules engine diagnoses exactly which criteria
                pass, fail, or require nodal review.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                <span>03. Saved Opportunities</span>
                <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                  Comparison
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Compare multiple scholarships side-by-side and inspect NSP
                concurrent scholarship rules.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                <span>04. Application Tracker</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  9-Stage Kanban
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Track your application across 9 clear stages from Saved to
                Preparing, Submitted, and Awarded.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                <span>05. Preparation Checklists</span>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  OTR / DBT
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Step-by-step document readiness tasks for OTR IDs, Tehsildar
                certificates, and college INO verification.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                <span>06. Deadline Timeline</span>
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                  IST Aware
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Separates student submission deadlines from institutional
                verification (INO) windows in Asia/Kolkata time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
