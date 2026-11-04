import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApplicationTrackerService } from "@/modules/tracker/tracker.service";
import { ApplicationStatusEnum } from "@/lib/schemas/application.schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: app, error } = await supabase
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
          institute_verification_deadline_at,
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
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !app) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ application: app });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      status?: string;
      application_reference_id?: string | null;
      private_notes?: string | null;
      target_submission_date?: string | null;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.status) {
      const parsedStatus = ApplicationStatusEnum.safeParse(body.status);
      if (!parsedStatus.success) {
        return NextResponse.json(
          { error: `Invalid application status: ${body.status}` },
          { status: 400 }
        );
      }

      const result = await ApplicationTrackerService.updateApplicationStatus(
        id,
        user.id,
        parsedStatus.data,
        {
          application_reference_id: body.application_reference_id,
          private_notes: body.private_notes,
          target_submission_date: body.target_submission_date,
        }
      );

      if (!result.success) {
        // Enforce 422 for invalid state machine transitions per spec!
        return NextResponse.json({ error: result.error }, { status: 422 });
      }

      return NextResponse.json({
        success: true,
        application: result.application,
      });
    }

    // Update non-status fields directly
    const { data: updated, error } = await supabase
      .from("applications")
      .update({
        application_reference_id: body.application_reference_id,
        private_notes: body.private_notes,
        target_submission_date: body.target_submission_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
