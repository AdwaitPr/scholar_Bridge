import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { MatchBadge } from "@/components/ui/match-badge";
import { AntiFraudBanner } from "@/components/ui/anti-fraud-banner";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { evaluateScholarshipDeadline } from "@/modules/deadline-management/deadline.service";
import seedScholarships from "../../../supabase/seed/scholarships.json";

export default async function SavedScholarshipsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/saved");
  }

  // Fetch saved scholarships from DB, falling back to empty list
  let savedItems: Array<{
    id: string;
    scholarship_id: string;
    match_status_snapshot: string | null;
    scholarship: (typeof seedScholarships)[0] | null;
  }> = [];

  try {
    const { data, error } = await supabase
      .from("saved_scholarships")
      .select("id, scholarship_id, match_status_snapshot")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      savedItems = data.map((item) => {
        const found = seedScholarships.find(
          (s) =>
            s.code.toLowerCase() === item.scholarship_id ||
            `seed-${s.code.toLowerCase()}` === item.scholarship_id ||
            s.slug === item.scholarship_id
        );
        return {
          id: item.id,
          scholarship_id: item.scholarship_id,
          match_status_snapshot: item.match_status_snapshot,
          scholarship: found || null,
        };
      });
    }
  } catch {
    // Unauthenticated or table unavailable
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Scholar<span className="text-blue-600">Bridge</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <Link
              href="/scholarships"
              className="hover:text-blue-700 transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/applications"
              className="hover:text-blue-700 transition-colors"
            >
              Applications
            </Link>
            <Link
              href="/deadlines"
              className="hover:text-blue-700 transition-colors"
            >
              Deadlines
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6 flex-1 w-full">
        <AntiFraudBanner />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <Bookmark className="h-6 w-6 text-blue-700" />
              <span>Saved Scholarships</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Compare shortlisted opportunities side by side, verify eligibility
              guidelines, and track deadlines.
            </p>
          </div>

          <Link href="/scholarships">
            <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5">
              <span>Explore More Schemes</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* NSP Rule Guidance Callout */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-blue-950">
            <ShieldAlert className="h-4 w-4 text-blue-700" />
            <span>
              NSP AY 2026–27 Multi-Application & Concurrent Receipt Rules
            </span>
          </div>
          <p className="text-blue-900 leading-relaxed">
            Under National Scholarship Portal (NSP) guidelines for Academic Year
            2026–27, students are permitted to apply for{" "}
            <strong>one merit-based scheme</strong> alongside one or more{" "}
            <strong>need/welfare-based schemes</strong>. However, final Direct
            Benefit Transfer (DBT) disbursement rules strictly prohibit holding
            concurrent central or state government scholarships. Private
            foundation awards (e.g. Reliance Foundation) may be held
            concurrently subject to their independent terms.
          </p>
          <div className="pt-1">
            <a
              href="https://scholarships.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-blue-800 underline hover:text-blue-900"
            >
              <span>Read Official NSP FAQs & Guidelines</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Comparison Section */}
        {savedItems.length === 0 ? (
          <EmptyState
            title="No Saved Scholarships Yet"
            description="Explore our source-verified directory of 16+ central, state, and foundation scholarships, and bookmark your top matches."
            action={
              <Link href="/scholarships">
                <Button
                  size="sm"
                  className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-9"
                >
                  Discover Scholarships
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Desktop Comparison Table */}
            <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Scholarship Scheme</th>
                    <th className="py-3 px-4">Funding & Provider</th>
                    <th className="py-3 px-4">Annual Benefit</th>
                    <th className="py-3 px-4">Family Income Cap</th>
                    <th className="py-3 px-4">Application Deadline</th>
                    <th className="py-3 px-4">Match Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {savedItems.map((item) => {
                    const s = item.scholarship;
                    if (!s) return null;
                    const deadline = evaluateScholarshipDeadline(
                      s.student_deadline_at,
                      s.is_deadline_verified
                    );

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-4 px-4 font-bold text-slate-900 max-w-xs">
                          <Link
                            href={`/scholarships/${s.slug}`}
                            className="hover:text-blue-700 transition-colors line-clamp-2"
                          >
                            {s.name}
                          </Link>
                          <span className="text-[11px] font-normal text-slate-500 block mt-0.5">
                            Code: {s.code}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          <span className="font-semibold text-slate-800 block">
                            {s.provider_name}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            {s.funding_type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-black text-slate-900 tabular-nums">
                          {s.max_annual_benefit_inr
                            ? `₹${s.max_annual_benefit_inr.toLocaleString("en-IN")}/yr`
                            : s.benefits_summary}
                        </td>
                        <td className="py-4 px-4 text-slate-700 font-medium tabular-nums">
                          {s.max_income_inr
                            ? `≤ ₹${s.max_income_inr.toLocaleString("en-IN")}`
                            : "No Income Cap"}
                        </td>
                        <td className="py-4 px-4">
                          <DeadlineBadge deadline={deadline} />
                        </td>
                        <td className="py-4 px-4">
                          <MatchBadge
                            outcome={
                              item.match_status_snapshot || "Potential match"
                            }
                          />
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <Link href={`/scholarships/${s.slug}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                            >
                              Details
                            </Button>
                          </Link>
                          <Link href={`/applications?scholarship_id=${s.code}`}>
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-blue-700 hover:bg-blue-800 text-white"
                            >
                              Track
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Card Grid View */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedItems.map((item) => {
                const s = item.scholarship;
                if (!s) return null;
                const deadline = evaluateScholarshipDeadline(
                  s.student_deadline_at,
                  s.is_deadline_verified
                );

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <DeadlineBadge deadline={deadline} />
                      <MatchBadge
                        outcome={
                          item.match_status_snapshot || "Potential match"
                        }
                      />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-slate-900 leading-snug">
                        <Link
                          href={`/scholarships/${s.slug}`}
                          className="hover:text-blue-700"
                        >
                          {s.name}
                        </Link>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {s.provider_name}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Benefit
                        </span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {s.max_annual_benefit_inr
                            ? `₹${s.max_annual_benefit_inr.toLocaleString("en-IN")}`
                            : "Varies"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Income Limit
                        </span>
                        <span className="font-semibold text-slate-700 tabular-nums">
                          {s.max_income_inr
                            ? `≤ ₹${(s.max_income_inr / 100000).toFixed(1)}L`
                            : "None"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Link href={`/scholarships/${s.slug}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-8"
                        >
                          View Rules
                        </Button>
                      </Link>
                      <Link
                        href={`/applications?scholarship_id=${s.code}`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          className="w-full text-xs h-8 bg-blue-700 hover:bg-blue-800 text-white"
                        >
                          Start Tracker
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
