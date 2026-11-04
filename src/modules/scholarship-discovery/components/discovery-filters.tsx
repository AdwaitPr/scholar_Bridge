"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EDUCATION_LEVELS = [
  { value: "all", label: "All Education Levels" },
  { value: "school_class_9_10", label: "School (Class 9 - 10)" },
  { value: "school_class_11_12", label: "School (Class 11 - 12)" },
  { value: "diploma_technical", label: "Diploma / Polytechnic" },
  {
    value: "undergraduate_general",
    label: "Undergraduate (General - BA/BSc/BCom)",
  },
  {
    value: "undergraduate_technical",
    label: "Undergraduate (B.Tech / Professional)",
  },
  { value: "postgraduate_general", label: "Postgraduate (MA/MSc/MCom)" },
  {
    value: "postgraduate_technical",
    label: "Postgraduate (M.Tech / Professional)",
  },
  { value: "integrated_five_year", label: "Integrated 5-Year Dual Degree" },
];

const FUNDING_TYPES = [
  { value: "all", label: "All Funding Types" },
  { value: "merit_based", label: "Merit-Based Only" },
  { value: "need_welfare_based", label: "Need / Welfare Based" },
  { value: "merit_cum_means", label: "Merit-cum-Means" },
];

const PROVIDER_TYPES = [
  { value: "all", label: "All Providers" },
  { value: "central_government", label: "Central Government (NSP)" },
  {
    value: "statutory_body_aicte_ugc",
    label: "Statutory Bodies (AICTE / UGC)",
  },
  { value: "state_government", label: "State Government" },
  { value: "private_foundation", label: "Private Foundations" },
];

export function DiscoveryFilters({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") || "";
  const currentEdu = searchParams.get("education_level") || "all";
  const currentFunding = searchParams.get("funding_type") || "all";
  const currentProvider = searchParams.get("provider_type") || "all";
  const currentHideExpired = searchParams.get("hide_expired") === "true";
  const currentSort = searchParams.get("sort") || "deadline_asc";

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    router.push(`/scholarships?${params.toString()}`);
  };

  const handleReset = () => {
    router.push("/scholarships");
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
          <Filter className="h-4 w-4 text-blue-700" />
          <span>Filters</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 text-xs text-slate-500 hover:text-slate-800"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-4 pt-4">
        {/* Search Input */}
        <div className="space-y-1.5">
          <Label
            htmlFor="search-input"
            className="text-xs font-semibold text-slate-700"
          >
            Search Keyword
          </Label>
          <Input
            id="search-input"
            type="search"
            placeholder="e.g. Pragati, UGC, Girls..."
            defaultValue={currentQ}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam("q", (e.target as HTMLInputElement).value);
              }
            }}
            onBlur={(e) => updateParam("q", e.target.value)}
            className="text-xs h-9 bg-white"
          />
        </div>

        {/* Education Level */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Education Level
          </Label>
          <Select
            value={currentEdu}
            onValueChange={(val) => updateParam("education_level", val)}
          >
            <SelectTrigger className="text-xs h-9 bg-white w-full">
              <SelectValue placeholder="All Education Levels" />
            </SelectTrigger>
            <SelectContent>
              {EDUCATION_LEVELS.map((lvl) => (
                <SelectItem
                  key={lvl.value}
                  value={lvl.value}
                  className="text-xs"
                >
                  {lvl.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Funding Classification */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Funding Classification
          </Label>
          <Select
            value={currentFunding}
            onValueChange={(val) => updateParam("funding_type", val)}
          >
            <SelectTrigger className="text-xs h-9 bg-white w-full">
              <SelectValue placeholder="All Funding Types" />
            </SelectTrigger>
            <SelectContent>
              {FUNDING_TYPES.map((ft) => (
                <SelectItem key={ft.value} value={ft.value} className="text-xs">
                  {ft.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Provider Type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Provider Type
          </Label>
          <Select
            value={currentProvider}
            onValueChange={(val) => updateParam("provider_type", val)}
          >
            <SelectTrigger className="text-xs h-9 bg-white w-full">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_TYPES.map((pt) => (
                <SelectItem key={pt.value} value={pt.value} className="text-xs">
                  {pt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Sort By
          </Label>
          <Select
            value={currentSort}
            onValueChange={(val) => updateParam("sort", val)}
          >
            <SelectTrigger className="text-xs h-9 bg-white w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline_asc" className="text-xs">
                Deadline (Soonest First)
              </SelectItem>
              <SelectItem value="amount_desc" className="text-xs">
                Payout (Highest First)
              </SelectItem>
              <SelectItem value="name_asc" className="text-xs">
                Scholarship Name (A-Z)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hide Expired Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
          <div className="space-y-0.5">
            <Label
              htmlFor="hide-expired"
              className="text-xs font-semibold text-slate-800 cursor-pointer"
            >
              Hide Expired
            </Label>
            <p className="text-[11px] text-slate-500">
              Show only active schemes
            </p>
          </div>
          <Switch
            id="hide-expired"
            checked={currentHideExpired}
            onCheckedChange={(checked) =>
              updateParam("hide_expired", checked ? "true" : null)
            }
          />
        </div>
      </div>
    </div>
  );
}
