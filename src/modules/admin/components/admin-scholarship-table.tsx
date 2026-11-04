"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { evaluateScholarshipDeadline } from "@/modules/deadline-management/deadline.service";
import type { Database } from "@/lib/supabase/database.types";

type ScholarshipRow = Database["public"]["Tables"]["scholarships"]["Row"];

interface AdminScholarshipTableProps {
  scholarships: ScholarshipRow[];
}

export function AdminScholarshipTable({
  scholarships,
}: AdminScholarshipTableProps) {
  const [query, setQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = scholarships.filter((s) => {
    if (statusFilter !== "all" && s.verification_status !== statusFilter) {
      return false;
    }
    if (query) {
      const q = query.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.provider_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by code, scheme name, or provider..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700"
          >
            <option value="all">All Verification Statuses</option>
            <option value="flagged_for_review">⚠️ Flagged for Review</option>
            <option value="deadline_not_verified">
              ⏳ Deadline Not Verified
            </option>
            <option value="verified">✓ Verified</option>
            <option value="verified_renewal_only">🔄 Renewal Only</option>
            <option value="expired">✕ Expired</option>
          </select>
        </div>

        <Link href="/admin/scholarships/new">
          <Button
            size="sm"
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-9 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Scholarship</span>
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Code & Name</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Student Deadline</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Verified</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => {
              const deadline = evaluateScholarshipDeadline(
                s.student_deadline_at,
                s.is_deadline_verified
              );

              return (
                <tr
                  key={s.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-3 px-4 max-w-xs font-bold text-slate-900">
                    <span className="text-[11px] font-mono text-blue-700 block">
                      {s.code}
                    </span>
                    <span className="line-clamp-1">{s.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {s.provider_name}
                  </td>
                  <td className="py-3 px-4">
                    <DeadlineBadge deadline={deadline} />
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        s.verification_status === "verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : s.verification_status === "flagged_for_review"
                            ? "bg-amber-100 text-amber-800"
                            : s.verification_status === "expired"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {s.verification_status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 tabular-nums">
                    {new Date(s.last_verified_at).toLocaleDateString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link href={`/admin/scholarships/${s.id}/edit`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit & Rules</span>
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
