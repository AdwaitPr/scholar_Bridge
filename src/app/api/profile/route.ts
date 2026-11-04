import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StudentProfileSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = StudentProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.format(),
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const profileData = {
      ...parseResult.data,
      id: user.id, // Enforce current user ID
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: updatedProfile });
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

    const confirmHeader = req.headers.get("x-confirm-account-deletion");
    if (confirmHeader !== "true") {
      return NextResponse.json(
        {
          error:
            "Account deletion requires header 'X-Confirm-Account-Deletion: true'",
        },
        { status: 400 }
      );
    }

    // Delete profile from DB (cascades to applications, saved, checklists)
    await supabase.from("profiles").delete().eq("id", user.id);

    // Delete auth user via admin client server-side
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(user.id);
    } catch (err) {
      console.error("Failed to delete auth user:", err);
    }

    // Sign out current session
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Account and profile permanently deleted",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
