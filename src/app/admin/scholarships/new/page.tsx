import React from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminScholarshipForm } from "@/modules/admin/components/admin-scholarship-form";

export default async function NewScholarshipPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/scholarships/new");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <AdminScholarshipForm isEditing={false} />
    </div>
  );
}
