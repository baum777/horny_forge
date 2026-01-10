import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/integrations/supabase/types";

const processEnv = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
  .process?.env;

const SUPABASE_URL =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ??
  processEnv?.NEXT_PUBLIC_SUPABASE_URL ??
  import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  processEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type SupabaseCookieMethods = {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  remove: (name: string, options: CookieOptions) => void;
};

/**
 * SSR-friendly Supabase client (cookie-based).
 *
 * This is designed for Next.js/App Router usage, but is kept framework-agnostic
 * so it can compile in this Vite workspace.
 */
export function createSupabaseServerClient(cookies: SupabaseCookieMethods) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies,
  });
}

