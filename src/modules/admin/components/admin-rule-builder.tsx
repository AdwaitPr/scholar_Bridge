"use client";

import React, { useState } from "react";
import { Plus, Trash2, Play, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type RuleNode,
  type LeafCondition,
  type ComparisonOperator,
  type ProfileFieldKey,
  ProfileFieldKeyEnum,
} from "@/lib/schemas/rule-ast.schema";
import { evaluateScholarshipEligibility } from "@/modules/eligibility-engine/evaluator";
import type { StudentProfileInput } from "@/lib/schemas/profile.schema";

type LogicalNode = Extract<RuleNode, { type: "AND" | "OR" }>;

interface AdminRuleBuilderProps {
  initialRule: RuleNode;
  onChange: (updatedRule: RuleNode) => void;
}

const SYNTHETIC_PROFILES: Array<{
  label: string;
  profile: Partial<StudentProfileInput>;
}> = [
  {
    label: "Aadya (Female, B.Tech 1st Year, Income ₹2.5L, AICTE)",
    profile: {
      display_name: "Aadya Sharma",
      gender: "Female",
      education_level: "undergraduate_technical",
      course_year: 1,
      annual_family_income_inr: 250000,
      institution_type: "aicte_approved",
      academic_percentage: 84.0,
      girls_in_family_applying: 1,
    },
  },
  {
    label: "Rahul (Male, B.Tech 1st Year, Income ₹5L, AICTE)",
    profile: {
      display_name: "Rahul Verma",
      gender: "Male",
      education_level: "undergraduate_technical",
      course_year: 1,
      annual_family_income_inr: 500000,
      institution_type: "aicte_approved",
      academic_percentage: 78.0,
    },
  },
  {
    label: "Vikram (Male, B.Tech 2nd Year, High Income ₹9L)",
    profile: {
      display_name: "Vikram Mehta",
      gender: "Male",
      education_level: "undergraduate_technical",
      course_year: 2,
      annual_family_income_inr: 900000,
      institution_type: "aicte_approved",
      academic_percentage: 65.0,
    },
  },
];

export function AdminRuleBuilder({
  initialRule,
  onChange,
}: AdminRuleBuilderProps) {
  const [rule, setRule] = useState<RuleNode>(initialRule);
  const [selectedProfileIdx, setSelectedProfileIdx] = useState<number>(0);
  const [testResult, setTestResult] = useState<ReturnType<
    typeof evaluateScholarshipEligibility
  > | null>(null);

  const handleUpdate = (newRule: RuleNode) => {
    setRule(newRule);
    onChange(newRule);
    if (testResult) {
      runTestWithProfile(newRule, selectedProfileIdx);
    }
  };

  const runTestWithProfile = (currentRule: RuleNode, profileIdx: number) => {
    const selected = SYNTHETIC_PROFILES[profileIdx]!.profile;
    const res = evaluateScholarshipEligibility(
      "test-preview",
      currentRule,
      selected as StudentProfileInput,
      { freshApplicationsOpen: true }
    );
    setTestResult(res);
  };

  const handleAddCondition = () => {
    if (rule.type === "AND" || rule.type === "OR") {
      const newCond: LeafCondition = {
        type: "CONDITION",
        id: `cond_${Date.now()}`,
        category: "income",
        field: "annual_family_income_inr",
        operator: "lte",
        value: 450000,
        requiresOfficialVerification: false,
        externalGateOnly: false,
        label: "Family Income Limit",
        passExplanation: "Family annual income is within the allowable limit.",
        failExplanation: "Family annual income exceeds the allowable limit.",
        missingExplanation: "Family annual income information is required.",
      };

      const updated: LogicalNode = {
        ...rule,
        children: [...rule.children, newCond],
      };
      handleUpdate(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rule Builder Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Rule Tree: Root Node ({rule.type})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddCondition}
              className="text-xs h-8 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Condition</span>
            </Button>
          </div>
        </div>

        {/* Children Render */}
        <div className="space-y-3 pl-2">
          {rule.type === "AND" || rule.type === "OR" ? (
            rule.children.map((child, idx) => (
              <div
                key={child.id || idx}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs"
              >
                {child.type === "CONDITION" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Criterion #{idx + 1}: {child.label}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const updated = {
                            ...rule,
                            children: rule.children.filter((_, i) => i !== idx),
                          };
                          handleUpdate(updated);
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-500">
                          Profile Field
                        </Label>
                        <select
                          value={child.field}
                          onChange={(e) => {
                            const updatedChildren = [...rule.children];
                            (updatedChildren[idx] as LeafCondition).field = e
                              .target.value as ProfileFieldKey;
                            handleUpdate({
                              ...rule,
                              children: updatedChildren,
                            });
                          }}
                          className="flex h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                        >
                          {ProfileFieldKeyEnum.options.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-[10px] text-slate-500">
                          Operator
                        </Label>
                        <select
                          value={child.operator}
                          onChange={(e) => {
                            const updatedChildren = [...rule.children];
                            (updatedChildren[idx] as LeafCondition).operator = e
                              .target.value as ComparisonOperator;
                            handleUpdate({
                              ...rule,
                              children: updatedChildren,
                            });
                          }}
                          className="flex h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                        >
                          <option value="eq">eq (==)</option>
                          <option value="neq">neq (!=)</option>
                          <option value="lte">lte (&lt;=)</option>
                          <option value="gte">gte (&gt;=)</option>
                          <option value="lt">lt (&lt;)</option>
                          <option value="gt">gt (&gt;)</option>
                          <option value="in">in (list)</option>
                          <option value="nin">nin (not in list)</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-[10px] text-slate-500">
                          Comparison Value
                        </Label>
                        <Input
                          value={
                            Array.isArray(child.value)
                              ? child.value.join(", ")
                              : String(child.value ?? "")
                          }
                          onChange={(e) => {
                            const updatedChildren = [...rule.children];
                            const valStr = e.target.value;
                            const parsed =
                              !isNaN(Number(valStr)) && valStr.trim() !== ""
                                ? Number(valStr)
                                : valStr === "true"
                                  ? true
                                  : valStr === "false"
                                    ? false
                                    : valStr;
                            (updatedChildren[idx] as LeafCondition).value =
                              parsed as never;
                            handleUpdate({
                              ...rule,
                              children: updatedChildren,
                            });
                          }}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="font-semibold text-slate-700">
                    Nested {child.type} Group with {child.children.length}{" "}
                    criteria
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">
              Root node is a single condition.
            </p>
          )}
        </div>
      </div>

      {/* SYNTHETIC TESTING PANEL (P7-T4) */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-blue-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-700" />
            <h3 className="text-sm font-bold text-blue-950">
              Test Rule with Synthetic Student Profiles
            </h3>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => runTestWithProfile(rule, selectedProfileIdx)}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-8 gap-1.5"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Run Evaluator</span>
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-blue-900">
            Select Synthetic Candidate
          </Label>
          <select
            value={selectedProfileIdx}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setSelectedProfileIdx(idx);
              runTestWithProfile(rule, idx);
            }}
            className="flex h-9 w-full rounded-md border border-blue-200 bg-white px-3 text-xs"
          >
            {SYNTHETIC_PROFILES.map((p, idx) => (
              <option key={idx} value={idx}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Live Test Outcome */}
        {testResult && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">
                Evaluator Output:
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  testResult.outcome === "Potential match"
                    ? "bg-emerald-100 text-emerald-800"
                    : testResult.outcome === "Likely ineligible"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                }`}
              >
                {testResult.outcome}
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed font-medium">
              {testResult.summaryExplanation}
            </p>

            <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500 font-medium">
              <span className="text-emerald-700 font-semibold">
                ✓ {testResult.satisfiedConditions.length} Satisfied
              </span>
              <span className="text-red-600 font-semibold">
                ✗ {testResult.unsatisfiedConditions.length} Not Met
              </span>
              <span className="text-amber-700 font-semibold">
                ? {testResult.missingInformationConditions.length} Missing Info
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
