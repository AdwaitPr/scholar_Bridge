import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // 2. Fetch Saved Scholarships
    const { data: saved } = await supabase
      .from("saved_scholarships")
      .select("*, scholarships (*)")
      .eq("user_id", user.id);

    // 3. Fetch Applications with Checklists and Checklist Items
    const { data: applications } = await supabase
      .from("applications")
      .select(
        "*, scholarships (*), application_checklists (*, checklist_items (*))"
      )
      .eq("user_id", user.id);

    // 4. Fetch Reminders
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      privacy_notice:
        "ScholarBridge adheres to strict data minimization. No Aadhaar, PAN, bank account numbers, or document uploads are collected or stored.",
      profile: profile || null,
      saved_scholarships: saved || [],
      applications: applications || [],
      reminders: reminders || [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="scholarbridge-export-${user.id.slice(0, 8)}.json"`,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
