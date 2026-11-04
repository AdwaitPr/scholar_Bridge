import React from "react";
import Link from "next/link";
import { SlidersHorizontal, ArrowLeft, ArrowRight } from "lucide-react";
import { DiscoveryFilters } from "@/modules/scholarship-discovery/components/discovery-filters";
import { ScholarshipCard } from "@/components/ui/scholarship-card";
import { EmptyState } from "@/components/ui/empty-state";
import { AntiFraudBanner } from "@/components/ui/anti-fraud-banner";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScholarshipCatalogRepository } from "@/modules/scholarship-catalog/repository";
import { evaluateScholarshipDeadline } from "@/modules/deadline-management/deadline.service";
import { evaluateScholarshipEligibility } from "@/modules/eligibility-engine/evaluator";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DiscoveryQuerySchema } from "@/lib/schemas";

interface DiscoveryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DiscoveryPage({
  searchParams,
}: DiscoveryPageProps) {
  const rawParams = await searchParams;
  const flatParams: Record<string, string> = {};
  for (const [key, val] of Object.entries(rawParams)) {
    if (typeof val === "string") {
      flatParams[key] = val;
    } else if (Array.isArray(val) && val[0]) {
      flatParams[key] = val[0];
    }
  }

  const parsed = DiscoveryQuerySchema.safeParse(flatParams);
  const filters = parsed.success ? parsed.data : DiscoveryQuerySchema.parse({});

  // 1. Authenticated user profile for eligibility matching
  let studentProfile = null;
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
    }
  } catch {
    // Unauthenticated browse allowed
  }

  // 2. Fetch scholarships
  const { items, total, totalPages, page } =
    await ScholarshipCatalogRepository.list(filters);

  // 3. Enrich items
  const enrichedItems = items
    .map((sch) => {
      const ruleRecord = sch.scholarship_eligibility_rules?.[0];
      const isRenewalOnly =
        sch.verification_status === "verified_renewal_only" ||
        !sch.fresh_applications_open;

      const deadlineInfo = evaluateScholarshipDeadline(
        sch.student_deadline_at,
        sch.is_deadline_verified,
        sch.institute_verification_deadline_at,
        sch.state_nodal_deadline_at,
        { isRenewalOnly }
      );

      if (filters.hide_expired && deadlineInfo.isExpired) {
        return null;
      }

      const eligibilityEvaluation =
        studentProfile && ruleRecord?.rule_ast
          ? evaluateScholarshipEligibility(
              sch.id,
              ruleRecord.rule_ast as never,
              studentProfile,
              { freshApplicationsOpen: sch.fresh_applications_open }
            )
          : null;

      return {
        ...sch,
        deadlineEvaluation: deadlineInfo,
        eligibilityEvaluation,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Scholar<span className="text-blue-600">Bridge</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-600">
              <Link href="/scholarships" className="text-blue-700">
                Browse Scholarships
              </Link>
              <Link
                href="/dashboard"
                className="hover:text-blue-700 transition-colors"
              >
                Student Dashboard
              </Link>
              <Link
                href="/deadlines"
                className="hover:text-blue-700 transition-colors"
              >
                Deadline Calendar
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {studentProfile ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600 hidden sm:inline">
                  Hi, {studentProfile.display_name}
                </span>
                <Link href="/dashboard">
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
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
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        <AntiFraudBanner compact />

        {/* Header / Stats Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Scholarship Discovery
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Showing{" "}
              <span className="font-semibold text-slate-900 tabular-nums">
                {enrichedItems.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900 tabular-nums">
                {total}
              </span>{" "}
              verified opportunities
            </p>
          </div>

          {/* Mobile Filter Button */}
          <div className="md:hidden flex items-center gap-2">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-xs w-full"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Filter Opportunities</span>
                  </Button>
                }
              />
              <SheetContent
                side="bottom"
                className="h-[80vh] overflow-y-auto rounded-t-2xl"
              >
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-base font-bold">
                    Filter Scholarships
                  </SheetTitle>
                </SheetHeader>
                <DiscoveryFilters />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Content Layout: Sidebar + Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sticky top-24">
            <DiscoveryFilters />
          </aside>

          {/* Cards Grid */}
          <div className="col-span-1 md:col-span-3 space-y-6">
            {enrichedItems.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enrichedItems.map((sch) => (
                  <ScholarshipCard
                    key={sch.id}
                    id={sch.id}
                    slug={sch.slug}
                    name={sch.name}
                    providerName={sch.provider_name}
                    fundingType={sch.funding_type}
                    benefitsSummary={sch.benefits_summary}
                    maxAnnualBenefitInr={sch.max_annual_benefit_inr}
                    eligibilitySummary={sch.eligibility_summary}
                    deadlineEvaluation={sch.deadlineEvaluation}
                    eligibilityEvaluation={sch.eligibilityEvaluation}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <div className="text-xs text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-slate-900">{page}</span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {totalPages}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {page > 1 && (
                    <Link href={`/scholarships?page=${page - 1}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Previous
                      </Button>
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link href={`/scholarships?page=${page + 1}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                      >
                        Next <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
