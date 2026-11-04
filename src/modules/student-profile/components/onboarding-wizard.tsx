"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Building2,
  Coins,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants/states";
import type { Database } from "@/lib/supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface OnboardingWizardProps {
  initialProfile: Partial<ProfileRow> | null;
}

export function OnboardingWizard({ initialProfile }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    display_name: initialProfile?.display_name || "",
    education_level:
      initialProfile?.education_level || "undergraduate_technical",
    course_stream: initialProfile?.course_stream || "",
    course_year: initialProfile?.course_year ?? 1,
    study_mode: initialProfile?.study_mode || "regular_full_time",
    is_lateral_entry: initialProfile?.is_lateral_entry ?? false,

    domicile_state: initialProfile?.domicile_state || "Maharashtra",
    institution_type: initialProfile?.institution_type || "aicte_approved",
    has_valid_aishe_code: initialProfile?.has_valid_aishe_code ?? true,

    academic_percentage: initialProfile?.academic_percentage ?? 75.0,
    ug_cgpa: initialProfile?.ug_cgpa ?? null,
    gate_score: initialProfile?.gate_score ?? null,
    class_12_top_20_percentile:
      initialProfile?.class_12_top_20_percentile ?? false,
    annual_family_income_inr:
      initialProfile?.annual_family_income_inr ?? 250000,

    social_category: initialProfile?.social_category || "General",
    gender: initialProfile?.gender || "Female",
    age_years: initialProfile?.age_years ?? 19,
    has_disability_40_percent:
      initialProfile?.has_disability_40_percent ?? false,
    is_orphan_or_martyr_ward: initialProfile?.is_orphan_or_martyr_ward ?? false,
    girls_in_family_applying: initialProfile?.girls_in_family_applying ?? 1,
    is_first_pg_degree: initialProfile?.is_first_pg_degree ?? true,
    years_gap_after_qualifying_exam:
      initialProfile?.years_gap_after_qualifying_exam ?? 0,
    receiving_other_scholarship:
      initialProfile?.receiving_other_scholarship ?? false,
  });

  const STEPS = [
    { number: 1, title: "Education & Stream", icon: GraduationCap },
    { number: 2, title: "Domicile & Institute", icon: Building2 },
    { number: 3, title: "Scores & Income", icon: Coins },
    { number: 4, title: "Special Categories", icon: ShieldCheck },
  ];

  const isPostgraduate =
    formData.education_level === "postgraduate_general" ||
    formData.education_level === "postgraduate_technical";

  // Persists draft to backend server-side
  const saveProgress = async (completedStep: number) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to save draft on step ${completedStep}`
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Network error saving draft";
      setErrorMessage(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1 && !formData.display_name.trim()) {
      setErrorMessage("Please enter your display name.");
      return;
    }

    try {
      await saveProgress(currentStep);
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Step 4 finished! Redirect to scholarships with match filters
        router.push("/scholarships?matched=true");
        router.refresh();
      }
    } catch {
      // Error handled in saveProgress
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setErrorMessage(null);
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Wizard Header & Progress */}
      <div className="mb-8 space-y-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Set Up Your Student Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          We match your academic, domicile, and category details against 16+
          verified central, state, and foundation scholarships.
        </p>

        {/* Step Progress Bar */}
        <div className="pt-4">
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = s.number === currentStep;
              const isPast = s.number < currentStep;
              return (
                <div
                  key={s.number}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center transition-all ${
                    isActive
                      ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs"
                      : isPast
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isPast
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold hidden sm:inline">
                    {s.title}
                  </span>
                  <span className="text-[10px] sm:hidden font-medium">
                    Step {s.number}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strict Privacy Notice Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Strict Data Minimization Guarantee</span>
          <p className="text-amber-800 leading-relaxed">
            Never enter Aadhaar numbers, PAN, or bank account details.
            ScholarBridge does not store, request, or verify identity proofs or
            bank documents.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form
        onSubmit={handleNext}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6"
      >
        {errorMessage && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: Education Level & Stream */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Step 1: Academic Enrollment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your current study level and degree stream.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="display_name"
                className="text-xs font-semibold text-slate-700"
              >
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                placeholder="e.g. Priya Sharma"
                required
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="education_level"
                className="text-xs font-semibold text-slate-700"
              >
                Current Education Level <span className="text-red-500">*</span>
              </Label>
              <select
                id="education_level"
                value={formData.education_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    education_level: e.target.value as NonNullable<
                      ProfileRow["education_level"]
                    >,
                  })
                }
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="school_class_9_10">
                  Class 9 – 10 (Secondary School)
                </option>
                <option value="school_class_11_12">
                  Class 11 – 12 (Higher Secondary)
                </option>
                <option value="diploma_technical">
                  Diploma / Polytechnic (Technical)
                </option>
                <option value="undergraduate_technical">
                  Undergraduate Technical (B.Tech / B.E. / MBBS)
                </option>
                <option value="undergraduate_general">
                  Undergraduate General (BA / B.Sc / B.Com)
                </option>
                <option value="postgraduate_technical">
                  Postgraduate Technical (M.Tech / M.E. / MCA)
                </option>
                <option value="postgraduate_general">
                  Postgraduate General (MA / M.Sc / M.Com)
                </option>
                <option value="integrated_five_year">
                  Integrated 5-Year Dual Degree
                </option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="course_stream"
                  className="text-xs font-semibold text-slate-700"
                >
                  Course / Stream Name
                </Label>
                <Input
                  id="course_stream"
                  value={formData.course_stream}
                  onChange={(e) =>
                    setFormData({ ...formData, course_stream: e.target.value })
                  }
                  placeholder="e.g. Computer Science & Engg"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="course_year"
                  className="text-xs font-semibold text-slate-700"
                >
                  Current Year of Study
                </Label>
                <select
                  id="course_year"
                  value={formData.course_year}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_year: Number(e.target.value),
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value={1}>1st Year (Fresh Admission)</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                  <option value={5}>5th Year</option>
                  <option value={6}>6th Year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label
                  htmlFor="study_mode"
                  className="text-xs font-semibold text-slate-700"
                >
                  Study Mode
                </Label>
                <select
                  id="study_mode"
                  value={formData.study_mode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      study_mode: e.target.value as NonNullable<
                        ProfileRow["study_mode"]
                      >,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="regular_full_time">Regular / Full Time</option>
                  <option value="distance_correspondence">
                    Distance / Open School
                  </option>
                  <option value="part_time">Part Time</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="is_lateral_entry"
                  checked={formData.is_lateral_entry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_lateral_entry: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="is_lateral_entry"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Direct 2nd Year Lateral Entry (Polytechnic to B.Tech)
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Domicile & Institution */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Step 2: Domicile & Institute
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Government welfare schemes depend strictly on your state of
                domicile.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="domicile_state"
                className="text-xs font-semibold text-slate-700"
              >
                State / UT of Domicile <span className="text-red-500">*</span>
              </Label>
              <select
                id="domicile_state"
                value={formData.domicile_state}
                onChange={(e) =>
                  setFormData({ ...formData, domicile_state: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {INDIAN_STATES_AND_UTS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="institution_type"
                className="text-xs font-semibold text-slate-700"
              >
                Institution Recognition Type{" "}
                <span className="text-red-500">*</span>
              </Label>
              <select
                id="institution_type"
                value={formData.institution_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    institution_type: e.target.value as NonNullable<
                      ProfileRow["institution_type"]
                    >,
                  })
                }
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="aicte_approved">
                  AICTE Approved Technical College / University
                </option>
                <option value="ugc_recognized">
                  UGC Recognized University / Affiliated College
                </option>
                <option value="notified_top_class_institute">
                  Notified Top-Class Institute (IIT / NIT / IIM / AIIMS)
                </option>
                <option value="naac_accredited">
                  NAAC Accredited Higher Education Institute
                </option>
                <option value="government_school">
                  Government School (State Board / Kendriya Vidyalaya)
                </option>
                <option value="private_school">
                  Private Recognized School (CBSE / ICSE / State)
                </option>
                <option value="other_recognized">
                  Other Recognized Institution
                </option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="has_valid_aishe_code"
                  checked={formData.has_valid_aishe_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      has_valid_aishe_code: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="has_valid_aishe_code"
                  className="text-xs font-bold text-slate-900 cursor-pointer"
                >
                  My college / university has a valid AISHE Code on NSP
                </Label>
              </div>
              <p className="text-[11px] text-slate-500 pl-7 leading-relaxed">
                National Scholarship Portal (NSP) requires institutes to be
                registered under the All India Survey on Higher Education
                (AISHE) for verification by the Institute Nodal Officer (INO).
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Scores & Income */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Step 3: Academic Scores & Family Income
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Used strictly for merit cutoffs and income ceiling filters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="academic_percentage"
                  className="text-xs font-semibold text-slate-700"
                >
                  Qualifying Exam Percentage (%){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="academic_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.academic_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      academic_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g. 82.5"
                  className="h-10 text-sm font-semibold tabular-nums"
                />
              </div>

              {isPostgraduate ? (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="ug_cgpa"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Undergraduate CGPA (out of 10)
                  </Label>
                  <Input
                    id="ug_cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.ug_cgpa ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ug_cgpa: parseFloat(e.target.value) || null,
                      })
                    }
                    placeholder="e.g. 8.4"
                    className="h-10 text-sm tabular-nums"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="class_12_top_20_percentile"
                    checked={formData.class_12_top_20_percentile}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        class_12_top_20_percentile: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="class_12_top_20_percentile"
                    className="text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Ranked in Top 20th Percentile of Class 12 Board (PM-USP
                    CSSS)
                  </Label>
                </div>
              )}
            </div>

            {formData.education_level === "postgraduate_technical" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="gate_score"
                  className="text-xs font-semibold text-slate-700"
                >
                  GATE Score (0 – 1000)
                </Label>
                <Input
                  id="gate_score"
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.gate_score ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gate_score: parseInt(e.target.value, 10) || null,
                    })
                  }
                  placeholder="e.g. 650"
                  className="h-10 text-sm tabular-nums"
                />
              </div>
            )}

            {/* Income Input + Quick Chips */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="annual_family_income_inr"
                  className="text-xs font-semibold text-slate-700"
                >
                  Annual Family Income (INR){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <span className="text-xs font-bold text-blue-700 tabular-nums">
                  ₹{formData.annual_family_income_inr.toLocaleString("en-IN")}
                </span>
              </div>
              <Input
                id="annual_family_income_inr"
                type="number"
                min="0"
                step="10000"
                value={formData.annual_family_income_inr}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    annual_family_income_inr: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="h-10 text-sm font-semibold tabular-nums"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">
                  Quick Select:
                </span>
                {[150000, 250000, 450000, 600000, 800000].map((inc) => (
                  <button
                    type="button"
                    key={inc}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        annual_family_income_inr: inc,
                      })
                    }
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-all ${
                      formData.annual_family_income_inr === inc
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ₹{(inc / 100000).toFixed(1)} Lakh
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Special Categories */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Step 4: Reservation & Welfare Categories
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Government scholarships feature dedicated quotas for girls,
                SC/ST, and disabled candidates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="social_category"
                  className="text-xs font-semibold text-slate-700"
                >
                  Social Category <span className="text-red-500">*</span>
                </Label>
                <select
                  id="social_category"
                  value={formData.social_category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_category: e.target.value as NonNullable<
                        ProfileRow["social_category"]
                      >,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="General">General / Open</option>
                  <option value="OBC">OBC (Other Backward Classes)</option>
                  <option value="EWS">EWS (Economically Weaker Section)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="DNT">DNT (De-notified Tribes)</option>
                  <option value="Minority">
                    Minority (Muslim, Christian, Sikh, Buddhist, Jain, Parsi)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="gender"
                  className="text-xs font-semibold text-slate-700"
                >
                  Gender <span className="text-red-500">*</span>
                </Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gender: e.target.value as NonNullable<
                        ProfileRow["gender"]
                      >,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="age_years"
                  className="text-xs font-semibold text-slate-700"
                >
                  Age (Years)
                </Label>
                <Input
                  id="age_years"
                  type="number"
                  min="10"
                  max="60"
                  value={formData.age_years}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      age_years: parseInt(e.target.value, 10) || 18,
                    })
                  }
                  className="h-10 text-sm tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="girls_in_family_applying"
                  className="text-xs font-semibold text-slate-700"
                >
                  Girl Children in Family Applying
                </Label>
                <select
                  id="girls_in_family_applying"
                  value={formData.girls_in_family_applying}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      girls_in_family_applying:
                        parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value={1}>1 Girl Child (AICTE Pragati Max: 2)</option>
                  <option value={2}>2 Girl Children</option>
                  <option value={3}>3 or more</option>
                  <option value={0}>Not Applicable</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="has_disability_40_percent"
                  checked={formData.has_disability_40_percent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      has_disability_40_percent: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="has_disability_40_percent"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Person with Benchmark Disability (PwD ≥ 40% with UDID card)
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_orphan_or_martyr_ward"
                  checked={formData.is_orphan_or_martyr_ward}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_orphan_or_martyr_ward: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="is_orphan_or_martyr_ward"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Ward of Martyred Armed Forces / Police Personnel or Orphan
                  (AICTE Swanath / PMSS)
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="receiving_other_scholarship"
                  checked={formData.receiving_other_scholarship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receiving_other_scholarship: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="receiving_other_scholarship"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Currently receiving another Central or State Scholarship
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={isSubmitting}
              className="gap-1.5 text-xs h-9"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-9 px-4 gap-2 shadow-sm font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving draft...</span>
              </>
            ) : currentStep === 4 ? (
              <>
                <span>Complete Profile & Discover</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              </>
            ) : (
              <>
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
