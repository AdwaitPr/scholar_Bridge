import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SettingsView } from "@/modules/student-profile/components/settings-view";
import type { StudentProfileInput } from "@/lib/schemas/profile.schema";

export const metadata = {
  title: "Account Settings & Privacy | ScholarBridge",
  description:
    "Manage your profile, deadline notification preferences, and privacy settings.",
};

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/settings");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <SettingsView
        initialProfile={(profile as unknown as StudentProfileInput) || null}
        userEmail={user.email || ""}
      />
    </div>
  );
}
