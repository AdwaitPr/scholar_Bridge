import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const LoginRequestSchema = z.union([
  z.object({
    type: z.literal("password").default("password"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
  z.object({
    type: z.literal("magic_link"),
    email: z.string().email("Invalid email address"),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginRequestSchema.safeParse(body);

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

    const supabase = await createServerSupabaseClient();

    if (parsed.data.type === "magic_link") {
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data.email,
        options: {
          emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
        },
      });

      if (error) {
        return NextResponse.json(
          { error: { code: "OTP_FAILED", message: error.message } },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Check your email for the magic sign-in link",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          error: {
            code: "AUTH_FAILED",
            message: error?.message || "Invalid credentials",
          },
        },
        { status: 401 }
      );
    }

    // Check onboarding status
    const { data: profile } = await supabase
      .from("profiles")
      .select("education_level, role")
      .eq("id", data.user.id)
      .single();

    const redirectPath =
      profile?.role === "admin"
        ? "/admin"
        : !profile?.education_level
          ? "/onboarding"
          : "/dashboard";

    return NextResponse.json({
      success: true,
      user: data.user,
      redirectPath,
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
