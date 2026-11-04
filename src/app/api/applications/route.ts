import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApplicationTrackerService } from "@/modules/tracker/tracker.service";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: apps, error } = await supabase
      .from("applications")
      .select(
        `
        id,
        user_id,
        scholarship_id,
        status,
        application_reference_id,
        private_notes,
        submitted_at,
        target_submission_date,
        created_at,
        updated_at,
        scholarships:scholarship_id (
          id,
          code,
          slug,
          name,
          provider_name,
          provider_type,
          funding_type,
          student_deadline_at,
          is_deadline_verified,
          official_application_url
        ),
        application_checklists (
          id,
          checklist_items (
            id,
            item_title,
            item_category,
            guidance_notes,
            is_completed,
            completed_at,
            sort_order
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ applications: apps });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { scholarship_id?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.scholarship_id) {
      return NextResponse.json(
        { error: "Missing scholarship_id" },
        { status: 400 }
      );
    }

    const result =
      await ApplicationTrackerService.initializeApplicationWithChecklist(
        user.id,
        body.scholarship_id
      );

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
