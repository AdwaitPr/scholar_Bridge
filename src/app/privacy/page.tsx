import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Lock,
  Trash2,
  Download,
  CheckCircle,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
  title: "Privacy & Data Minimization Policy | ScholarBridge",
  description:
    "Strict privacy by minimization: what ScholarBridge never collects or stores.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-800 hover:text-slate-900 font-medium text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <span className="text-sm font-bold text-slate-900">
            Privacy & Data Minimization
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <Shield className="h-4 w-4 text-emerald-700" />
            <span>Privacy By Architectural Minimization</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy & Data Principles
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            ScholarBridge was built on the premise that student privacy is
            non-negotiable. To calculate scholarship eligibility and track
            deadlines, we only require coarse demographic and academic brackets.
            We enforce strict data minimization at the architectural and
            database schema level.
          </p>
        </div>

        {/* What We Never Store */}
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-900 font-bold text-base">
            <Lock className="h-5 w-5 text-red-700 shrink-0" />
            <span>Data ScholarBridge NEVER Collects or Stores</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-red-950 font-medium">
            <div className="p-3 bg-white rounded border border-red-200 flex items-center gap-2">
              <span className="text-red-600 font-bold">✕</span>
              <span>Aadhaar Number or Enrollment ID (EID)</span>
            </div>
            <div className="p-3 bg-white rounded border border-red-200 flex items-center gap-2">
              <span className="text-red-600 font-bold">✕</span>
              <span>PAN Card Number or Tax Identifiers</span>
            </div>
            <div className="p-3 bg-white rounded border border-red-200 flex items-center gap-2">
              <span className="text-red-600 font-bold">✕</span>
              <span>Bank Account Number, IFSC code, or Passbooks</span>
            </div>
            <div className="p-3 bg-white rounded border border-red-200 flex items-center gap-2">
              <span className="text-red-600 font-bold">✕</span>
              <span>Uploaded Identity, Caste, or Income Certificate PDFs</span>
            </div>
            <div className="p-3 bg-white rounded border border-red-200 flex items-center gap-2">
              <span className="text-red-600 font-bold">✕</span>
              <span>Parents&apos; / Guardians&apos; Names</span>
            </div>
            <div className="p-3 bg-white rounded border border-red-200 flex items-center gap-2">
              <span className="text-red-600 font-bold">✕</span>
              <span>Physical Residential Address or Pin Code</span>
            </div>
          </div>
        </div>

        {/* What We Do Store */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            What We Do Store & Why
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            We store only the bare minimum self-reported fields necessary to
            evaluate eligibility rules:
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Email & Display Name:</strong> For student
                authentication and session persistence.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Academic Details:</strong> Coarse education level,
                stream, current year, and aggregate score.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Demographic Brackets:</strong> Domicile state, social
                category, and annual family income in INR.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Application Tracker State:</strong> User-curated saved
                scholarships and checklist readiness toggles.
              </span>
            </li>
          </ul>
        </div>

        {/* Student Rights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Download className="h-4 w-4 text-blue-700" />
              <span>Complete Data Portability</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              At any time, you can export your entire profile, saved
              scholarships, and application checklist records as a
              machine-readable JSON file directly from your Account Settings.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Trash2 className="h-4 w-4 text-red-600" />
              <span>Right to Complete Erasure</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have the right to permanently erase your account at any time.
              Clicking Delete Account purges your profile, applications, saved
              schemes, and reminders instantly and irreversibly.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
