import { createClient } from "./server";
import type { User } from "@supabase/supabase-js";

export async function getServerSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getServerUser(): Promise<User | null> {
  const session = await getServerSession();
  return session?.user ?? null;
}

function getPreferredHandle(user: User): string {
  const md = user.user_metadata ?? {};
  return (
    md.user_name ||
    md.preferred_username ||
    md.name ||
    md.full_name ||
    user.email?.split("@")[0] ||
    "Anonymous"
  );
}

function getAvatarUrl(user: User): string | null {
  const md = user.user_metadata ?? {};
  return (md.avatar_url || md.picture || null) as string | null;
}

export function getUserProfile(user: User) {
  return {
    id: user.id,
    email: user.email,
    handle: getPreferredHandle(user),
    avatar: getAvatarUrl(user),
  };
}

