import { NextResponse, type NextRequest } from "next/server";
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

    const { data, error } = await supabase
      .from("saved_scholarships")
      .select(
        `
        id,
        scholarship_id,
        match_status_snapshot,
        created_at,
        scholarships:scholarship_id (
          id,
          code,
          slug,
          name,
          provider_name,
          provider_type,
          funding_type,
          benefits_summary,
          max_annual_benefit_inr,
          student_deadline_at,
          is_deadline_verified,
          fresh_applications_open,
          official_application_url,
          scholarship_eligibility_rules (
            max_income_inr,
            allowed_education_levels
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: data });
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

    let body: { scholarship_id?: string; match_status_snapshot?: string };
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

    const { data, error } = await supabase
      .from("saved_scholarships")
      .upsert({
        user_id: user.id,
        scholarship_id: body.scholarship_id,
        match_status_snapshot: body.match_status_snapshot || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: true, record: data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let scholarshipId: string | null =
      req.nextUrl.searchParams.get("scholarship_id");
    if (!scholarshipId) {
      try {
        const body = await req.json();
        scholarshipId = body.scholarship_id;
      } catch {
        // Ignored
      }
    }

    if (!scholarshipId) {
      return NextResponse.json(
        { error: "Missing scholarship_id" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("saved_scholarships")
      .delete()
      .eq("user_id", user.id)
      .eq("scholarship_id", scholarshipId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: false });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
