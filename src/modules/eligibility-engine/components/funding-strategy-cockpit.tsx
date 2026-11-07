"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  Scale,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Calculator,
  Building2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ConcurrenceOptimizer } from "../concurrence-optimizer";
import type {
  OptimizationCandidate,
  SchemeFundingClassification,
  ConcurrenceRelationship,
} from "../concurrence.types";

interface FundingStrategyCockpitProps {
  candidates: OptimizationCandidate[];
  initialCollegeFeesInr?: number;
  className?: string;
}

export function FundingStrategyCockpit({
  candidates,
  initialCollegeFeesInr = 150000,
  className = "",
}: FundingStrategyCockpitProps) {
  const [target, setTarget] = useState<
    "MAX_REALIZABLE_VALUE" | "MAX_EXPECTED_YIELD"
  >("MAX_REALIZABLE_VALUE");
  const [annualCollegeFees, setAnnualCollegeFees] = useState<number>(
    initialCollegeFeesInr
  );
  const [activeCodes, setActiveCodes] = useState<Set<string>>(
    () => new Set(candidates.map((c) => c.code))
  );

  // Sync active candidates if prop length changes
  const activeCandidates = useMemo(() => {
    return candidates.filter((c) => activeCodes.has(c.code));
  }, [candidates, activeCodes]);

  const toggleCandidate = (code: string) => {
    setActiveCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const optimizationResult = useMemo(() => {
    return ConcurrenceOptimizer.solve({
      candidates: activeCandidates,
      annualCollegeFeesInr: annualCollegeFees,
      target,
    });
  }, [activeCandidates, annualCollegeFees, target]);

  if (!candidates || candidates.length === 0) {
    return (
      <Card
        className={`border-dashed border-slate-300 bg-slate-50/50 ${className}`}
      >
        <CardContent className="py-8 text-center">
          <Scale className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">
            No Scholarships Shortlisted for Optimization
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Bookmark scholarships from the catalog to run our deterministic
            Concurrence & Grant Optimizer, resolving NSP duplicate filing rules
            and calculating legal yield.
          </p>
          <div className="mt-4">
            <Link href="/scholarships">
              <Button size="sm" variant="outline" className="text-xs h-8">
                Explore Scholarships Catalog
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    recommendedApplicationBundle,
    maxRealizableDisbursementInr,
    totalExpectedYieldInr,
    conflictsDetected,
    dualApplicationGuidance,
    legalDisclaimer,
  } = optimizationResult;

  const coverageRatio =
    annualCollegeFees > 0
      ? Math.min(
          100,
          Math.round((maxRealizableDisbursementInr / annualCollegeFees) * 100)
        )
      : 100;
  const coverageSurplus = Math.max(
    0,
    maxRealizableDisbursementInr - annualCollegeFees
  );

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  const getClassificationBadge = (
    classification: SchemeFundingClassification
  ) => {
    switch (classification) {
      case "CENTRAL_MERIT":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            Central Merit
          </Badge>
        );
      case "CENTRAL_WELFARE":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Central Welfare
          </Badge>
        );
      case "STATE_POST_MATRIC":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            State Post-Matric
          </Badge>
        );
      case "PHILANTHROPIC_STACKABLE":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            Stackable Foundation
          </Badge>
        );
      default:
        return <Badge variant="secondary">{classification}</Badge>;
    }
  };

  const getRelationshipBadge = (rel: ConcurrenceRelationship) => {
    switch (rel) {
      case "MUTUALLY_EXCLUSIVE":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Strict Mutual Exclusion</span>
          </Badge>
        );
      case "DUAL_APPLY_SINGLE_DISBURSE":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Dual-Apply Allowed / Single Payout</span>
          </Badge>
        );
      case "STACKABLE_GAP_FUNDING":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Stackable Fee Gap</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{rel}</Badge>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-blue-100/60">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Grant Concurrence & Disbursement Optimizer
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 mt-0.5">
                    Deterministic Combinatorial Knapsack Engine & NSP AY 2026–27
                    Dual-Application Resolver
                  </CardDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
                <span>DBT Bharat & GFR 230(1) Compliant</span>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Controls: Target Strategy & Fee Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/80 p-3.5 rounded-xl border border-slate-200">
            {/* Optimization Objective Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-blue-600" />
                <span>Optimization Goal</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={
                    target === "MAX_REALIZABLE_VALUE" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setTarget("MAX_REALIZABLE_VALUE")}
                  className={`text-xs h-9 font-bold ${
                    target === "MAX_REALIZABLE_VALUE"
                      ? "bg-blue-700 text-white hover:bg-blue-800"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Max Legal Yield
                </Button>
                <Button
                  type="button"
                  variant={
                    target === "MAX_EXPECTED_YIELD" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setTarget("MAX_EXPECTED_YIELD")}
                  className={`text-xs h-9 font-bold ${
                    target === "MAX_EXPECTED_YIELD"
                      ? "bg-indigo-700 text-white hover:bg-indigo-800"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Risk-Balanced Yield
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {target === "MAX_REALIZABLE_VALUE"
                  ? "Selects highest non-colliding statutory disbursement cap."
                  : "Balanced Probability Mode: factors in competitive quota odds for highest expected return."}
              </p>
            </div>

            {/* Annual College Cost Input with Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="college-fees-input"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Annual College Cost (Tuition + Hostel)</span>
                </label>
                <span className="text-[11px] font-bold text-blue-700">
                  {formatCurrency(annualCollegeFees)}
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    id="college-fees-input"
                    type="number"
                    min="10000"
                    step="5000"
                    aria-label="Annual College Cost"
                    value={annualCollegeFees}
                    onChange={(e) =>
                      setAnnualCollegeFees(
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnnualCollegeFees(50000)}
                    className="h-8 px-2 text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Govt (50k)
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnnualCollegeFees(150000)}
                    className="h-8 px-2 text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Univ (1.5L)
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnnualCollegeFees(250000)}
                    className="h-8 px-2 text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Inst (2.5L)
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Used to cap stackable CSR gap funding without violating
                institutional cost rules.
              </p>
            </div>
          </div>

          {/* KPI Output Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Realizable Legal Yield */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Max Legal Disbursement
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-900 mt-0.5 tabular-nums">
                {formatCurrency(maxRealizableDisbursementInr)}
                <span className="text-xs font-semibold text-slate-500">
                  {" "}
                  / year
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Zero Double-Dipping Penalty</span>
              </span>
            </div>

            {/* Expected Probability Yield */}
            <div className="p-3.5 rounded-xl border border-indigo-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Probability-Weighted Yield
              </span>
              <div className="text-xl sm:text-2xl font-black text-indigo-900 mt-0.5 tabular-nums">
                {formatCurrency(totalExpectedYieldInr)}
                <span className="text-xs font-semibold text-slate-500">
                  {" "}
                  / year
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Weighted by acceptance quota odds
              </span>
            </div>

            {/* College Expense Coverage */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-white shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>College Cost Covered</span>
                <span className="text-emerald-700 font-black">
                  {coverageRatio}%
                </span>
              </div>
              <div className="mt-2">
                <Progress
                  value={coverageRatio}
                  className="h-2.5 bg-slate-100"
                />
              </div>
              <div className="text-[11px] text-slate-600 mt-1.5 flex items-center justify-between font-medium">
                <span>
                  {coverageSurplus > 0
                    ? `+${formatCurrency(coverageSurplus)} maintenance buffer`
                    : `${formatCurrency(Math.max(0, annualCollegeFees - maxRealizableDisbursementInr))} gap remaining`}
                </span>
              </div>
            </div>
          </div>

          {/* NSP Multi-Application Guidance */}
          {dualApplicationGuidance.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-900">
                <Info className="h-4 w-4 text-blue-700" />
                <span>NSP AY 2026–27 Application Submission Strategy</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                {dualApplicationGuidance.map((guidance, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {guidance}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Optimal Bundle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>
                  Optimal Disbursement Strategy (
                  {recommendedApplicationBundle.length} Schemes)
                </span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Combined non-colliding legal entitlement
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendedApplicationBundle.map((candidate) => (
                <div
                  key={candidate.code}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 hover:border-blue-300 transition-colors shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {getClassificationBadge(candidate.classification)}
                        <h5 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1">
                          {candidate.name}
                        </h5>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {candidate.code}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block tabular-nums">
                          {formatCurrency(candidate.annualBenefitInr)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          annual max
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>Approved for Bundle</span>
                    </span>
                    <Link
                      href={`/scholarships/${candidate.slug}`}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-0.5"
                    >
                      <span>Details</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Collisions & Surrender Advisory */}
          {conflictsDetected.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Regulatory Collisions & Surrender Advisory (
                  {conflictsDetected.length})
                </h4>
              </div>

              <div className="space-y-2">
                {conflictsDetected.map((conflict, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white/90 border border-amber-200/80 text-xs text-slate-800 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="font-bold text-slate-900">
                        {conflict.scholarshipCodeA} ↔{" "}
                        {conflict.scholarshipCodeB}
                      </div>
                      {getRelationshipBadge(conflict.relationship)}
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {conflict.warningMessage}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Candidate Selection Switchers */}
          <div className="pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                Shortlisted Schemes ({candidates.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Toggle to test different shortlists in real time
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {candidates.map((c) => {
                const isActive = activeCodes.has(c.code);
                const isInBundle = recommendedApplicationBundle.some(
                  (b) => b.code === c.code
                );

                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleCandidate(c.code)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isActive
                        ? isInBundle
                          ? "bg-blue-50 border-blue-300 text-blue-900 font-bold"
                          : "bg-slate-100 border-slate-300 text-slate-700 line-through opacity-70"
                        : "bg-white border-dashed border-slate-300 text-slate-400"
                    }`}
                  >
                    <span>{c.code}</span>
                    <span className="text-[10px] opacity-80">
                      {formatCurrency(c.annualBenefitInr)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legal Notice */}
          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 leading-relaxed">
            <span className="font-bold text-slate-500">Statutory Notice: </span>
            {legalDisclaimer}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
