import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminScholarshipTable } from "@/modules/admin/components/admin-scholarship-table";
import seedScholarships from "../../../supabase/seed/scholarships.json";
import type { Database } from "@/lib/supabase/database.types";

type ScholarshipRow = Database["public"]["Tables"]["scholarships"]["Row"];

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  // Server-side Admin Role Verification (P7-T1)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-8 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            403 Forbidden
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            This area requires verified administrator privileges. Your current
            role is &ldquo;student&rdquo;.
          </p>
          <Link href="/dashboard" className="block pt-2">
            <button className="text-xs font-bold text-blue-700 hover:underline">
              &larr; Return to Student Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch all scholarships
  let scholarships: ScholarshipRow[] = [];
  try {
    const { data: dbData, error } = await supabase
      .from("scholarships")
      .select("*")
      .order("code", { ascending: true });

    if (!error && dbData && dbData.length > 0) {
      scholarships = dbData;
    }
  } catch {
    // Database unpopulated
  }

  if (scholarships.length === 0) {
    scholarships = seedScholarships.map((s) => ({
      id: `seed-${s.code.toLowerCase()}`,
      code: s.code,
      slug: s.slug,
      name: s.name,
      provider_name: s.provider_name,
      provider_type: s.provider_type as ScholarshipRow["provider_type"],
      funding_type: s.funding_type as ScholarshipRow["funding_type"],
      description: s.description,
      benefits_summary: s.benefits_summary,
      max_annual_benefit_inr: s.max_annual_benefit_inr,
      eligibility_summary: s.eligibility_summary,
      application_instructions: s.application_instructions,
      application_open_date: s.application_open_date,
      student_deadline_at: s.student_deadline_at,
      institute_verification_deadline_at: s.institute_verification_deadline_at,
      state_nodal_deadline_at: s.state_nodal_deadline_at,
      is_deadline_verified: s.is_deadline_verified,
      fresh_applications_open: s.fresh_applications_open,
      renewal_applications_open: s.renewal_applications_open,
      official_source_url: s.official_source_url,
      official_application_url: s.official_application_url,
      verification_status:
        s.verification_status as ScholarshipRow["verification_status"],
      last_verified_at: s.last_verified_at,
      is_active: s.is_active,
      created_at: "2026-11-04T00:00:00.000Z",
      updated_at: "2026-11-04T00:00:00.000Z",
      search_vector: null,
    }));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Scholar<span className="text-blue-600">Bridge</span>
            </Link>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              Admin Console
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/scholarships" className="hover:text-blue-700">
              Public Catalog
            </Link>
            <Link href="/dashboard" className="hover:text-blue-700">
              Student View
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6 flex-1 w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-700" />
            <span>Scholarship Verification & Catalog Manager</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Authoritative registry of 16+ verified central, statutory, state,
            and foundation scholarships. All changes are logged to the audit
            ledger.
          </p>
        </div>

        <AdminScholarshipTable scholarships={scholarships} />
      </main>
    </div>
  );
}
