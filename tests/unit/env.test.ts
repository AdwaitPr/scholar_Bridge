import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPublicEnv, getServerEnv } from "@/lib/env";

describe("Environment Variable Security and Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("successfully parses valid public environment variables", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = "https://example.supabase.co";
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "anon-key-12345";
    process.env["NEXT_PUBLIC_APP_URL"] = "http://localhost:3000";

    const env = getPublicEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key-12345");
  });

  it("throws when required public environment variables are missing", () => {
    delete process.env["NEXT_PUBLIC_SUPABASE_URL"];
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "anon-key-12345";

    expect(() => getPublicEnv()).toThrow();
  });

  it("throws when NEXT_PUBLIC_ variable contains service role key pattern", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = "https://example.supabase.co";
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "anon-key-12345";
    process.env["NEXT_PUBLIC_SERVICE_ROLE_LEAK"] = "secret_service_role_key";

    expect(() => getPublicEnv()).toThrow(/SECURITY/);
  });

  it("successfully parses server environment variables with service role key", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = "https://example.supabase.co";
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "anon-key-12345";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "super-secret-service-role-jwt";

    const env = getServerEnv();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("super-secret-service-role-jwt");
  });
});
