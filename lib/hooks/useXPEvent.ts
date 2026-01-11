"use client";

import { useCallback } from "react";
import { useAuth } from "./useAuth";
import type { XPEventType } from "@/lib/gamification/xp";

export interface XPEventResult {
  xp_added: number;
  new_level: number;
  new_badges: string[];
  daily_xp_used: number;
}

export function useXPEvent() {
  const { isAuthenticated } = useAuth();

  const triggerEvent = useCallback(
    async (
      eventType: XPEventType,
      options?: {
        artifactId?: string;
        meta?: Record<string, unknown>;
      }
    ): Promise<XPEventResult | null> => {
      if (!isAuthenticated) {
        return null;
      }

      try {
        const response = await fetch("/api/event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: eventType,
            artifact_id: options?.artifactId,
            meta: options?.meta,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("XP event error:", error);
          return null;
        }

        const result = await response.json();
        return result as XPEventResult;
      } catch (error) {
        console.error("Failed to trigger XP event:", error);
        return null;
      }
    },
    [isAuthenticated]
  );

  return { triggerEvent };
}

