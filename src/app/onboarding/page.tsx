import React from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/modules/student-profile/components/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup?next=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Scholar<span className="text-blue-600">Bridge</span>
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Student Onboarding
          </span>
        </div>
      </header>

      <main>
        <OnboardingWizard initialProfile={profile} />
      </main>
    </div>
  );
}
