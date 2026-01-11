"use client";

import { User } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import type { ArchivesUser } from "@/lib/archives/types";

interface UserChipProps {
  profile: ArchivesUser;
}

export function UserChip({ profile }: UserChipProps) {
  const { logout } = useAuth();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
      {profile.avatar ? (
        <img
          src={profile.avatar}
          alt={profile.handle}
          className="w-4 h-4 rounded-full object-cover"
        />
      ) : (
        <User className="w-4 h-4 text-primary" />
      )}
      <span className="text-sm font-medium">@{profile.handle}</span>
      <button
        onClick={() => logout()}
        className="text-xs text-muted-foreground hover:text-foreground ml-2"
      >
        Logout
      </button>
    </div>
  );
}

