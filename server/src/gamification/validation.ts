import type { ActionType, UserStats } from './types';
import { GLOBAL_DAILY_HORNY_CAP, GLOBAL_WEEKLY_HORNY_CAP } from './incentives';

export type ValidationResult = {
  valid: boolean;
  reason?: string;
};

export type ActionPayload = {
  artifactId?: string;
  receivedVotesDelta?: number;
  timeDeltaSeconds?: number;
  quizClassId?: string;
  quizVector?: { degen: number; horny: number; conviction: number };
  clientNonce?: string;
  idempotencyKey?: string;
};

// Cooldown tracking (in-memory for now, can move to Redis/DB)
const cooldownMap = new Map<string, number>();

export function validateAction(
  action: ActionType,
  payload: ActionPayload,
  userStats: UserStats,
  nowISO: string
): ValidationResult {
  // 1. Basic payload validation
  switch (action) {
    case 'vote':
      if (!payload.artifactId) {
        return { valid: false, reason: 'vote requires artifactId' };
      }
      // Cooldown check (30 seconds per artifact)
      const voteCooldownKey = `${userStats.userId}:vote:${payload.artifactId}`;
      const lastVote = cooldownMap.get(voteCooldownKey) || 0;
      const cooldownMs = 30_000; // 30 seconds
      if (Date.now() - lastVote < cooldownMs) {
        return { valid: false, reason: 'vote cooldown active' };
      }
      cooldownMap.set(voteCooldownKey, Date.now());
      break;

    case 'comment':
      if (!payload.artifactId) {
        return { valid: false, reason: 'comment requires artifactId' };
      }
      break;

    case 'share':
      if (!payload.artifactId) {
        return { valid: false, reason: 'share requires artifactId' };
      }
      // TODO: Add proof validation (OAuth share proof)
      break;

    case 'votes_received':
      // CRITICAL: Do not accept from client in production
      // This should only come from internal vote ledger
      return { valid: false, reason: 'votes_received must come from server-side vote ledger' };

    case 'time_spent':
      // CRITICAL: Do not accept raw client time
      // Should come from server-side session tracking
      if (!payload.timeDeltaSeconds || payload.timeDeltaSeconds <= 0) {
        return { valid: false, reason: 'time_spent requires valid timeDeltaSeconds' };
      }
      // Cap at reasonable session length (e.g., 1 hour = 3600s)
      if (payload.timeDeltaSeconds > 3600) {
        return { valid: false, reason: 'time_spent delta exceeds maximum session length' };
      }
      break;

    case 'artifact_release':
      if (!payload.artifactId) {
        return { valid: false, reason: 'artifact_release requires artifactId' };
      }
      // TODO: Validate ownership/creation proof server-side
      break;

    case 'quiz_complete':
      if (!payload.quizClassId || !payload.quizVector) {
        return { valid: false, reason: 'quiz_complete requires quizClassId and quizVector' };
      }
      // Weekly retake cap check
      const quizCount = userStats.counts['quiz_complete'] || 0;
      if (quizCount >= 1) {
        // Check if last quiz was this week
        const lastQuizISO = userStats.counts['quiz_last_completed'] as string | undefined;
        if (lastQuizISO) {
          const lastQuiz = new Date(lastQuizISO);
          const now = new Date(nowISO);
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
          weekStart.setHours(0, 0, 0, 0);
          if (lastQuiz >= weekStart) {
            return { valid: false, reason: 'quiz_complete weekly cap reached' };
          }
        }
      }
      break;

    case 'forge':
    case 'meme_create':
    case 'follow':
    case 'browse':
    case 'event_attend':
    case 'streak_tick':
    case 'special':
      // These actions don't require special validation beyond idempotency
      break;

    default:
      return { valid: false, reason: `unknown action: ${action}` };
  }

  // 2. Global cap checks
  if (userStats.dailyHornyEarned >= GLOBAL_DAILY_HORNY_CAP) {
    return { valid: false, reason: 'global daily cap reached' };
  }
  if (userStats.weeklyHornyEarned >= GLOBAL_WEEKLY_HORNY_CAP) {
    return { valid: false, reason: 'global weekly cap reached' };
  }

  return { valid: true };
}

export function checkActionCap(
  action: ActionType,
  userStats: UserStats,
  actionCapDaily?: number,
  actionCapWeekly?: number
): { allowed: boolean; reason?: string } {
  if (actionCapDaily !== undefined) {
    const earnedKeyDaily = `horny_daily_${action}`;
    const alreadyDaily = (userStats.counts[earnedKeyDaily] as number) || 0;
    if (alreadyDaily >= actionCapDaily) {
      return { allowed: false, reason: `${action} daily cap reached` };
    }
  }

  if (actionCapWeekly !== undefined) {
    const earnedKeyWeekly = `horny_weekly_${action}`;
    const alreadyWeekly = (userStats.counts[earnedKeyWeekly] as number) || 0;
    if (alreadyWeekly >= actionCapWeekly) {
      return { allowed: false, reason: `${action} weekly cap reached` };
    }
  }

  return { allowed: true };
}

