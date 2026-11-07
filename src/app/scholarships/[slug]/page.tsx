import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Building2,
  FileText,
  ExternalLink,
  Bookmark,
  ChevronRight,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { MatchBadge } from "@/components/ui/match-badge";
import { AntiFraudBanner } from "@/components/ui/anti-fraud-banner";
import { SourceProvenanceBox } from "@/components/ui/source-provenance-box";
import { SiteFooter } from "@/components/layout/site-footer";
import { ScholarshipCatalogRepository } from "@/modules/scholarship-catalog/repository";
import { evaluateScholarshipDeadline } from "@/modules/deadline-management/deadline.service";
import { evaluateScholarshipEligibility } from "@/modules/eligibility-engine/evaluator";
import { ConcurrenceOptimizer } from "@/modules/eligibility-engine/concurrence-optimizer";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface ScholarshipDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ScholarshipDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = await ScholarshipCatalogRepository.getBySlug(slug);

  if (!scholarship) {
    return {
      title: "Scholarship Not Found | ScholarBridge",
    };
  }

  return {
    title: `${scholarship.name} — Eligibility, Deadline & Verification | ScholarBridge`,
    description: scholarship.eligibility_summary || scholarship.description,
    openGraph: {
      title: `${scholarship.name} | ScholarBridge`,
      description: scholarship.benefits_summary || scholarship.description,
      type: "article",
    },
  };
}

export default async function ScholarshipDetailPage({
  params,
}: ScholarshipDetailPageProps) {
  const { slug } = await params;
  const scholarship = await ScholarshipCatalogRepository.getBySlug(slug);

  if (!scholarship) {
    notFound();
  }

  // 1. Check authenticated user profile
  let studentProfile = null;
  let isSaved = false;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      studentProfile = profile;

      const { data: savedRecord } = await supabase
        .from("saved_scholarships")
        .select("id")
        .eq("user_id", user.id)
        .eq("scholarship_id", scholarship.id)
        .maybeSingle();
      isSaved = !!savedRecord;
    }
  } catch {
    // Unauthenticated
  }

  const ruleRecord = scholarship.scholarship_eligibility_rules?.[0];
  const isRenewalOnly =
    scholarship.verification_status === "verified_renewal_only" ||
    !scholarship.fresh_applications_open;

  const deadlineEvaluation = evaluateScholarshipDeadline(
    scholarship.student_deadline_at,
    scholarship.is_deadline_verified,
    scholarship.institute_verification_deadline_at,
    scholarship.state_nodal_deadline_at,
    { isRenewalOnly }
  );

  const eligibilityEvaluation =
    studentProfile && ruleRecord?.rule_ast
      ? evaluateScholarshipEligibility(
          scholarship.id,
          ruleRecord.rule_ast as never,
          studentProfile,
          { freshApplicationsOpen: scholarship.fresh_applications_open }
        )
      : null;

  const formattedAmount = scholarship.max_annual_benefit_inr
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(scholarship.max_annual_benefit_inr)
    : null;

  const meta = ConcurrenceOptimizer.getClassificationMeta(scholarship.code);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: scholarship.name,
    serviceType: "Scholarship / Educational Aid",
    provider: {
      "@type": "Organization",
      name: scholarship.provider_name,
    },
    description: scholarship.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    ...(scholarship.max_annual_benefit_inr
      ? {
          amount: {
            "@type": "MonetaryAmount",
            currency: "INR",
            value: scholarship.max_annual_benefit_inr,
          },
        }
      : {}),
    url: scholarship.official_source_url,
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/scholarships"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Discovery</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isSaved ? "secondary" : "outline"}
              className="text-xs h-8 gap-1.5"
            >
              <Bookmark
                className={cn(
                  "h-3.5 w-3.5",
                  isSaved && "fill-current text-blue-700"
                )}
              />
              {isSaved ? "Saved" : "Save"}
            </Button>
            <Link href={`/scholarships/${slug}/eligibility`}>
              <Button size="sm" variant="default" className="text-xs h-8">
                Check Eligibility
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Anti-Fraud Banner */}
        <AntiFraudBanner />

        {/* Hero Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <DeadlineBadge deadline={deadlineEvaluation} />
            {eligibilityEvaluation && (
              <MatchBadge outcome={eligibilityEvaluation.outcome} />
            )}
            <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {scholarship.funding_type.replace(/_/g, " ")}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {scholarship.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-600 font-medium">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span>{scholarship.provider_name}</span>
            </div>
          </div>

          {/* Benefit Spotlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Verified Benefit Value
              </span>
              <p className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">
                {formattedAmount
                  ? `${formattedAmount} / year`
                  : scholarship.benefits_summary}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {scholarship.benefits_summary}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Application Status & Window
              </span>
              <p className="text-base font-bold text-slate-800 mt-0.5">
                {scholarship.fresh_applications_open
                  ? "Fresh & Renewal Open"
                  : "Renewal Only"}
              </p>
              <p className="text-xs text-slate-600 mt-1 tabular-nums">
                {deadlineEvaluation.displayText}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={scholarship.official_application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition-colors"
            >
              <span>Apply on Official Portal</span>
              <ExternalLink className="h-4 w-4" />
            </a>

            <Link href={`/scholarships/${slug}/eligibility`}>
              <Button variant="outline" className="text-xs sm:text-sm gap-1.5">
                <span>View Full Eligibility Breakdown</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Source Provenance Box */}
        <SourceProvenanceBox
          providerName={scholarship.provider_name}
          officialSourceUrl={scholarship.official_source_url}
          officialApplicationUrl={scholarship.official_application_url}
          lastVerifiedAt={scholarship.last_verified_at}
          studentDeadlineFormatted={deadlineEvaluation.istFormattedDate}
          instituteVerificationNote={
            deadlineEvaluation.instituteVerificationNote
          }
          guidelinesPdfUrl={
            scholarship.scholarship_sources?.[0]?.guideline_pdf_url
          }
        />

        {/* Description & Eligibility Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Scheme Description & Objectives
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                {scholarship.description}
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900">
                  Eligibility Overview
                </h2>
                <Link
                  href={`/scholarships/${slug}/eligibility`}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Clause-by-clause evaluation →
                </Link>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {scholarship.eligibility_summary}
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Official Application Instructions
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {scholarship.application_instructions}
              </div>
            </section>
          </div>

          {/* Right Column: Concurrence Rules & Required Documents */}
          <div className="space-y-6">
            {/* Regulatory Concurrence & Stacking Guidance Card */}
            <section className="rounded-xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/40 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                  <Scale className="h-4 w-4 text-blue-700" />
                  <h3>Regulatory Stacking Rules</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  AY 2026–27
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">
                    Scheme Type:
                  </span>
                  <span className="font-bold text-slate-800">
                    {meta?.classification === "CENTRAL_MERIT"
                      ? "Central Merit Scheme"
                      : meta?.classification === "CENTRAL_WELFARE"
                        ? "Central Welfare / Need Scheme"
                        : meta?.classification === "STATE_POST_MATRIC"
                          ? "State Post-Matric Scheme"
                          : "Philanthropic / Foundation CSR"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">
                    Application Portal:
                  </span>
                  <span className="font-bold text-slate-800 font-mono">
                    {meta?.portal || "Official Portal"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">
                    Stackability:
                  </span>
                  <span className="font-bold text-emerald-700">
                    {meta?.classification === "PHILANTHROPIC_STACKABLE"
                      ? "Fully Stackable (Gap Funding)"
                      : "Single Central Disbursement"}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50/80 p-3 text-[11px] text-blue-950 leading-relaxed">
                <p className="font-semibold text-blue-900">
                  {meta?.classification === "CENTRAL_MERIT"
                    ? "NSP limits applicants to 1 Central Merit scheme per AY. Cannot be held concurrently with another Central Merit scholarship under GFR 230(1)."
                    : meta?.classification === "CENTRAL_WELFARE"
                      ? "Can be applied for simultaneously with 1 Central Merit scheme on NSP. If both are awarded, one must be surrendered under DBT Bharat rules."
                      : meta?.classification === "STATE_POST_MATRIC"
                        ? "Co-funded with State. Cannot be combined with Central Top Class schemes for the same academic year."
                        : "Stackable alongside Central and State aid up to total verifiable tuition and hostel costs."}
                </p>
              </div>

              <div className="pt-1">
                <Link
                  href="/saved"
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                >
                  <span>Simulate in Grant Optimizer</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                <FileText className="h-4 w-4 text-blue-700" />
                <h3>Required Document Checklist</h3>
              </div>

              {scholarship.scholarship_documents &&
              scholarship.scholarship_documents.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {scholarship.scholarship_documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {doc.document_name}
                        </span>
                        {doc.is_mandatory && (
                          <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600">
                        {doc.specification_notes}
                      </p>
                      {doc.issuing_authority && (
                        <p className="text-[11px] text-slate-500 font-medium pt-1">
                          Authority: {doc.issuing_authority}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Check official portal for document guidelines.
                </p>
              )}
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
