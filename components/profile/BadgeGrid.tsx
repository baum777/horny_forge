"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export type Badge = {
  badge_id: string;
  name: string;
  description: string;
  visual_type: string;
  rarity: string;
  unlocked_at?: string;
};

interface BadgeGridProps {
  badges: Badge[];
  className?: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: "border-gray-400",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-yellow-400",
};

export function BadgeGrid({ badges, className }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <p>No badges unlocked yet.</p>
        <p className="text-sm mt-2">Start creating and voting to earn badges!</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", className)}>
      {badges.map((badge) => {
        const badgeImagePath = `/badges/badge_${badge.badge_id}.png`;
        const rarityColor = RARITY_COLORS[badge.rarity] ?? RARITY_COLORS.common;

        return (
          <div
            key={badge.badge_id}
            className={cn(
              "relative group cursor-pointer",
              "border-2 rounded-lg p-3",
              "bg-muted/50 hover:bg-muted transition-all",
              rarityColor
            )}
            title={`${badge.name}: ${badge.description}`}
          >
            <div className="aspect-square relative mb-2">
              <Image
                src={badgeImagePath}
                alt={badge.name}
                fill
                className="object-contain"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center text-2xl">
                        🏆
                      </div>
                    `;
                  }
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold truncate">{badge.name}</p>
              {badge.unlocked_at && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(badge.unlocked_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

