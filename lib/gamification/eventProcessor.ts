/**
 * Core event processing logic for XP and badges
 * This is used by the /api/event endpoint
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getXPValue, getDailyCap, DAILY_XP_CAP, type XPEventType } from "./xp";
import { calculateLevel } from "./levels";
import type { BadgeId } from "./badgeRules";

export interface ProcessEventParams {
  userId: string; // User triggering the event (may differ from recipient for vote_received)
  eventType: XPEventType;
  artifactId?: string;
  meta?: Record<string, unknown>;
  recipientUserId?: string; // For vote_received, this is the artifact author
}

export interface ProcessEventResult {
  xpAdded: number;
  newLevel: number;
  newBadges: BadgeId[];
  dailyXPUsed: number;
}

/**
 * Check daily XP caps for a specific event type
 */
async function checkDailyCap(
  supabase: SupabaseClient,
  userId: string,
  eventType: XPEventType,
  xpValue: number
): Promise<{ allowed: boolean; xpToAdd: number; dailyCount: number }> {
  const dailyCap = getDailyCap(eventType);
  if (dailyCap === null) {
    // Unlimited
    return { allowed: true, xpToAdd: xpValue, dailyCount: 0 };
  }

  // Get today's count for this event type
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();

  // We'll track this in a separate table or use a different approach
  // For now, we'll check user_stats and use a simple approach
  // In production, you might want a daily_xp_events table
  
  // Check total daily XP
  const { data: stats } = await supabase
    .from("user_stats")
    .select("xp_total, updated_at")
    .eq("user_id", userId)
    .single();

  if (!stats) {
    return { allowed: true, xpToAdd: xpValue, dailyCount: 0 };
  }

  // Simple check: if updated_at is today, we need to track daily XP separately
  // For MVP, we'll use a simpler approach: check if user has hit daily cap
  // This is a simplified version - in production you'd want proper daily tracking
  
  return { allowed: true, xpToAdd: xpValue, dailyCount: 0 };
}

/**
 * Process an XP event and update user stats
 */
export async function processEvent(
  supabase: SupabaseClient,
  params: ProcessEventParams
): Promise<ProcessEventResult> {
  const { userId, eventType, artifactId, meta, recipientUserId } = params;
  
  // For vote_received, use recipientUserId (artifact author) instead of userId (voter)
  const targetUserId = eventType === "vote_received" && recipientUserId 
    ? recipientUserId 
    : userId;
  
  // Get current stats
  const { data: currentStats, error: statsError } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", targetUserId)
    .single();

  if (statsError || !currentStats) {
    // Create stats if they don't exist
    const { error: insertError } = await supabase
      .from("user_stats")
      .insert({
        user_id: targetUserId,
        xp_total: 0,
        level: 1,
        streak_days: 0,
        last_active_at: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error(`Failed to create user stats: ${insertError.message}`);
    }
  }

  // Get XP value
  const xpValue = getXPValue(eventType);
  
  // Check daily cap (simplified - in production, track per event type)
  const { allowed, xpToAdd } = await checkDailyCap(supabase, targetUserId, eventType, xpValue);
  
  if (!allowed || xpToAdd === 0) {
    return {
      xpAdded: 0,
      newLevel: currentStats?.level ?? 1,
      newBadges: [],
      dailyXPUsed: 0,
    };
  }

  // Calculate new XP and level
  const newXPTotal = (currentStats?.xp_total ?? 0) + xpToAdd;
  const newLevel = calculateLevel(newXPTotal);

  // Handle streak for daily_return
  let newStreakDays = currentStats?.streak_days ?? 0;
  const now = new Date();
  const lastActive = currentStats?.last_active_at 
    ? new Date(currentStats.last_active_at)
    : null;

  if (eventType === "daily_return") {
    if (lastActive) {
      const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        // Consecutive day
        newStreakDays = (currentStats?.streak_days ?? 0) + 1;
      } else if (daysDiff > 1) {
        // Streak broken (more than 48h = reset)
        newStreakDays = 1;
      }
      // If daysDiff === 0, same day, don't increment
    } else {
      newStreakDays = 1;
    }
  } else if (lastActive) {
    // Check if streak should reset (48h inactivity)
    const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 48) {
      newStreakDays = 0;
    }
  }

  // Update user stats
  const { error: updateError } = await supabase
    .from("user_stats")
    .update({
      xp_total: newXPTotal,
      level: newLevel,
      streak_days: newStreakDays,
      last_active_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("user_id", targetUserId);

  if (updateError) {
    throw new Error(`Failed to update user stats: ${updateError.message}`);
  }

  // Check badge unlocks (use targetUserId for vote_received)
  const newBadges = await checkBadgeUnlocks(supabase, targetUserId, eventType, artifactId, meta);

  return {
    xpAdded: xpToAdd,
    newLevel,
    newBadges,
    dailyXPUsed: xpToAdd,
  };
}

/**
 * Check and unlock badges based on event
 */
async function checkBadgeUnlocks(
  supabase: SupabaseClient,
  userId: string,
  eventType: XPEventType,
  artifactId?: string,
  meta?: Record<string, unknown>
): Promise<BadgeId[]> {
  const newBadges: BadgeId[] = [];

  // Get user's existing badges
  const { data: existingBadges } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const existingBadgeIds = new Set(existingBadges?.map((b) => b.badge_id) ?? []);

  // Check first-time badges
  if (eventType === "forge_generate" && !existingBadgeIds.has("SIGIL_FIRST_INFUSION")) {
    const { data: artifacts } = await supabase
      .from("artifacts")
      .select("id")
      .eq("author_id", userId)
      .limit(1);

    if (!artifacts || artifacts.length === 0) {
      // This is their first generation (they haven't released yet, but generated)
      // We'll grant it on first release instead, or track generations separately
      // For now, grant on first release
    }
  }

  if (eventType === "artifact_release") {
    // Check SIGIL_FIRST_RELEASE
    if (!existingBadgeIds.has("SIGIL_FIRST_RELEASE")) {
      const { data: artifacts } = await supabase
        .from("artifacts")
        .select("id")
        .eq("author_id", userId)
        .limit(2);

      if (artifacts && artifacts.length === 1) {
        // First release
        newBadges.push("SIGIL_FIRST_RELEASE");
      }
    }

    // Check tag badges
    if (meta?.tags && Array.isArray(meta.tags)) {
      const tags = meta.tags as string[];
      const tagCounts: Record<string, number> = {};

      // Count tag usage
      const { data: allArtifacts } = await supabase
        .from("artifacts")
        .select("tags")
        .eq("author_id", userId);

      allArtifacts?.forEach((a) => {
        if (Array.isArray(a.tags)) {
          a.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
          });
        }
      });

      // Check tag badges
      if (tagCounts["croishorney"] >= 3 && !existingBadgeIds.has("OBJECT_CROISHORNEY")) {
        newBadges.push("OBJECT_CROISHORNEY");
      }
      if (tagCounts["eichhorny"] >= 3 && !existingBadgeIds.has("OBJECT_EICHHORNEY")) {
        newBadges.push("OBJECT_EICHHORNEY");
      }
      if (tagCounts["brainhorny"] >= 3 && !existingBadgeIds.has("OBJECT_BRAINHORNEY")) {
        newBadges.push("OBJECT_BRAINHORNEY");
      }
    }
  }

  if (eventType === "vote_cast" && !existingBadgeIds.has("SIGIL_FIRST_VOTE")) {
    const { data: votes } = await supabase
      .from("votes")
      .select("artifact_id")
      .eq("user_id", userId)
      .limit(2);

    if (votes && votes.length === 1) {
      // First vote
      newBadges.push("SIGIL_FIRST_VOTE");
    }
  }

  if (eventType === "vote_received" && artifactId) {
    // Check artifact vote count badges
    const { data: artifact } = await supabase
      .from("artifacts")
      .select("votes_count, author_id")
      .eq("id", artifactId)
      .single();

    if (artifact && artifact.author_id === userId) {
      const votes = artifact.votes_count ?? 0;
      if (votes >= 25 && !existingBadgeIds.has("STAMP_FEED_DOMINATOR")) {
        newBadges.push("STAMP_FEED_DOMINATOR");
      } else if (votes >= 10 && !existingBadgeIds.has("STAMP_TREND_SPARK")) {
        newBadges.push("STAMP_TREND_SPARK");
      }
    }
  }

  if (eventType === "daily_return") {
    // Get current streak
    const { data: stats } = await supabase
      .from("user_stats")
      .select("streak_days")
      .eq("user_id", userId)
      .single();

    const streakDays = stats?.streak_days ?? 0;
    if (streakDays >= 7 && !existingBadgeIds.has("FRAGMENT_RETURN_7D")) {
      newBadges.push("FRAGMENT_RETURN_7D");
    } else if (streakDays >= 2 && !existingBadgeIds.has("FRAGMENT_RETURN_2D")) {
      newBadges.push("FRAGMENT_RETURN_2D");
    }
  }

  // Insert new badges
  if (newBadges.length > 0) {
    const badgeInserts = newBadges.map((badgeId) => ({
      user_id: userId,
      badge_id: badgeId,
    }));

    const { error: insertError } = await supabase
      .from("user_badges")
      .insert(badgeInserts);

    if (insertError) {
      console.error("Failed to insert badges:", insertError);
      // Don't throw, just log
    }
  }

  return newBadges;
}

