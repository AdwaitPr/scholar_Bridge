import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SignupRequestSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SignupRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { display_name, email, password } = parsed.data;
    const supabase = await createServerSupabaseClient();

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name,
        },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          error: {
            code: "SIGNUP_FAILED",
            message: authError?.message || "Failed to create account",
          },
        },
        { status: 400 }
      );
    }

    // P2-T5: Ensure profile row exists with role=student
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: authData.user.id,
        role: "student",
        display_name,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("Profile upsert warning:", profileError.message);
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          display_name,
        },
        session: authData.session,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
