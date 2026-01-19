import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { parse as parseYaml } from 'yaml';

const RequirementSchema = z.object({
  type: z.string(),
  op: z.string(),
  value: z.union([z.number(), z.boolean(), z.string(), z.array(z.string())]),
});

const PathSchema = z.object({
  id: z.string(),
  title: z.string(),
  requirements: z.object({
    all: z.array(RequirementSchema),
  }),
});

const TierSchema = z.object({
  tier: z.number(),
  name: z.string(),
  min_level: z.number(),
  slots: z.number(),
  reward_per_claim: z.number(),
  pool_total: z.number(),
  paths: z.array(PathSchema),
});

const QuestConfigSchema = z.object({
  version: z.number(),
  week_id: z.string(),
  timezone: z.string(),
  claim: z.object({
    first_come_first_served: z.boolean(),
    requires_verified: z.boolean(),
    freeze_blocks_claim: z.boolean(),
    user_weekly_cap: z.number(),
    user_weekly_boost_cap: z.number(),
  }),
  tiers: z.array(TierSchema),
  boosts: z.object({
    enabled: z.boolean(),
    voting: z.object({
      description: z.string(),
      bonus_pool_weekly: z.number(),
      user_boost_cap_weekly: z.number(),
      eligibility: z.object({
          min_unique_raters: z.number(),
        min_avg_rating: z.number(),
        window_days: z.number(),
        require_published: z.boolean(),
        require_not_hidden: z.boolean(),
      }),
      scoring: z.object({
        max_counted_unique_voters_per_meme: z.number(),
        max_vote_score_per_meme: z.number(),
        rating_multiplier: z.object({
          below_3_8: z.number(),
          '3_8_to_4_1': z.number(),
          '4_2_to_4_5': z.number(),
          above_4_5: z.number(),
        }),
        velocity_multiplier: z.object({
          below_5: z.number(),
          '5_to_15': z.number(),
          above_15: z.number(),
        }),
      }),
    }),
    x_engagement: z.object({
      description: z.string(),
      bonus_pool_weekly: z.number(),
      user_boost_cap_weekly: z.number(),
      eligibility: z.object({
        require_official_share_flow: z.boolean(),
        require_hashtag: z.string(),
        require_tracked_meme_id: z.boolean(),
        engagement_window_hours: z.number(),
        min_x_score: z.number(),
      }),
      scoring: z.object({
        weights: z.object({
          like: z.number(),
          retweet: z.number(),
          reply: z.number(),
        }),
        max_x_score_per_post: z.number(),
        diminishing_returns: z.object({
          up_to_25: z.number(),
          '26_to_60': z.number(),
          above_60: z.number(),
        }),
        risk_adjustments: z.object({
          new_x_account_factor: z.number(),
          banned_or_flagged_factor: z.number(),
        }),
      }),
    }),
  }),
  moderation: z.object({
    report_autohide_n: z.string(),
    hidden_meme_nullifies_boost: z.boolean(),
    freeze_blocks_claim: z.boolean(),
  }),
  thresholds: z
    .object({
      ace_mvp: z.object({
        avg_rating: z.number(),
        rating_count: z.number(),
        report_count_max: z.number(),
      }),
    })
    .optional(),
  notes: z.array(z.string()).optional(),
});

export type QuestConfig = z.infer<typeof QuestConfigSchema>;

let cachedConfig: QuestConfig | null = null;

export async function loadQuestConfig(): Promise<QuestConfig> {
  if (cachedConfig) return cachedConfig;

  const filePathCandidates = [
    path.resolve(process.cwd(), 'weekly_quests_v1.1.yaml'),
    path.resolve(process.cwd(), '..', 'weekly_quests_v1.1.yaml'),
  ];

  let yamlText: string | null = null;
  let resolvedPath: string | null = null;

  for (const candidate of filePathCandidates) {
    try {
      yamlText = await fs.readFile(candidate, 'utf8');
      resolvedPath = candidate;
      break;
    } catch (error) {
      continue;
    }
  }

  if (!yamlText || !resolvedPath) {
    throw new Error('weekly_quests_v1.1.yaml not found');
  }

  const parsed = parseYaml(yamlText);
  const validated = QuestConfigSchema.parse(parsed);
  cachedConfig = validated;
  return validated;
}

