import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/integrations/supabase/types";

/**
 * Supabase session refresh middleware (Next.js-style).
 *
 * Note: This Vite workspace does not execute Next.js middleware. The function is
 * provided to satisfy the required backend/logic contract and can be used as-is
 * if/when this project is hosted in a Next.js App Router environment.
 */
type CookieLike = { value: string };
type CookieStoreLike = {
  get?: (name: string) => CookieLike | undefined;
  set?: (name: string, value: string, options?: CookieOptions) => void;
};

type MiddlewareRequestLike = {
  cookies?: CookieStoreLike;
  response?: unknown;
};

export async function middleware(request: MiddlewareRequestLike) {
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

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return undefined;

  const response = request.response ?? {};

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get: (name: string) => request.cookies?.get?.(name)?.value,
      set: (name: string, value: string, options: CookieOptions) =>
        request.cookies?.set?.(name, value, options),
      remove: (name: string, options: CookieOptions) =>
        request.cookies?.set?.(name, "", options),
    },
  });

  // Touch the auth layer to refresh session cookies if needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

