import { createBrowserClient } from "@supabase/ssr";
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

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail fast with a clear message (these are required for app functionality)
  throw new Error(
    "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

