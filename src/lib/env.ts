import { z } from 'zod';

/**
 * Environment variable validation using Zod.
 * Fails at build/startup if required vars are missing.
 * CRITICAL: Ensures SUPABASE_SERVICE_ROLE_KEY is never leaked to the client.
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .default('http://localhost:3000'),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
});

// Safety check: if any NEXT_PUBLIC_ variable contains the service role key pattern,
// fail immediately to prevent accidental leakage.
function assertNoServiceKeyLeakage(): void {
  const allPublicVars = Object.entries(process.env).filter(([key]) =>
    key.startsWith('NEXT_PUBLIC_')
  );

  for (const [key, value] of allPublicVars) {
    if (
      value &&
      (value.includes('service_role') ||
        key.toUpperCase().includes('SERVICE_ROLE'))
    ) {
      throw new Error(
        `SECURITY: ${key} appears to contain or reference the service role key. ` +
          'Service role keys must NEVER be exposed via NEXT_PUBLIC_ variables.'
      );
    }
  }
}

export function getPublicEnv() {
  assertNoServiceKeyLeakage();
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  });
}

export function getServerEnv() {
  assertNoServiceKeyLeakage();
  return serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'],
  });
}

export type PublicEnv = ReturnType<typeof getPublicEnv>;
export type ServerEnv = ReturnType<typeof getServerEnv>;
