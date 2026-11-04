import React from "react";
import Link from "next/link";
import { ScholarshipCatalogRepository } from "@/modules/scholarship-catalog/repository";
import {
  DeadlineCalendarView,
  type ScholarshipDeadlineItem,
} from "@/modules/deadline-management/components/deadline-calendar-view";
import { AntiFraudBanner } from "@/components/ui/anti-fraud-banner";
import seedScholarships from "../../../supabase/seed/scholarships.json";

export default async function DeadlinesPage() {
  let scholarships: ScholarshipDeadlineItem[] = [];

  try {
    const result = await ScholarshipCatalogRepository.list({
      page: 1,
      page_size: 50,
      sort: "deadline_asc",
    });

    scholarships = result.items.map((s) => ({
      id: s.id,
      code: s.code,
      slug: s.slug,
      name: s.name,
      provider_name: s.provider_name,
      student_deadline_at: s.student_deadline_at,
      institute_verification_deadline_at: s.institute_verification_deadline_at,
      state_nodal_deadline_at: s.state_nodal_deadline_at,
      is_deadline_verified: s.is_deadline_verified,
      official_application_url: s.official_application_url,
    }));
  } catch {
    scholarships = seedScholarships.map((s) => ({
      id: `seed-${s.code.toLowerCase()}`,
      code: s.code,
      slug: s.slug,
      name: s.name,
      provider_name: s.provider_name,
      student_deadline_at: s.student_deadline_at,
      institute_verification_deadline_at: s.institute_verification_deadline_at,
      state_nodal_deadline_at: s.state_nodal_deadline_at,
      is_deadline_verified: s.is_deadline_verified,
      official_application_url: s.official_application_url,
    }));
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
              href="/saved"
              className="hover:text-blue-700 transition-colors"
            >
              Saved
            </Link>
            <Link
              href="/applications"
              className="hover:text-blue-700 transition-colors"
            >
              Applications
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
        <DeadlineCalendarView scholarships={scholarships} />
      </main>
    </div>
  );
}
