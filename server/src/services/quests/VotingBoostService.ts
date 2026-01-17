import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';
import type { QuestConfig } from './QuestConfigLoader';

const MS_PER_DAY = 86_400_000;

type VotingBoostInput = {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  config: QuestConfig;
  artifacts: Array<{
    id: string;
    avg_rating?: number | null;
    rating_count?: number | null;
    created_at?: string | null;
    hidden?: boolean | null;
    author_id?: string | null;
  }>;
};

type VotingBonusInput = {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  config: QuestConfig;
};

type VotingBoostResult = {
  eligible: boolean;
  score: number;
};

type VotingBonusResult = {
  totalBonus: number;
  score: number;
};

export class VotingBoostService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async computeVotingBoost(input: VotingBoostInput): Promise<VotingBoostResult> {
    const { userId, weekStart, weekEnd, config } = input;
    const votingConfig = config.boosts.voting;

    if (!config.boosts.enabled) {
      return { eligible: false, score: 0 };
    }

    const artifacts = input.artifacts.filter((artifact) =>
      votingConfig.eligibility.require_not_hidden ? !artifact.hidden : true,
    );

    if (votingConfig.eligibility.require_published && artifacts.length === 0) {
      return { eligible: false, score: 0 };
    }

    const { uniqueVoters, avgRating, score } = await this.computeUserVotingStats({
      userId,
      weekStart,
      weekEnd,
      votingConfig,
      artifacts,
    });

    const eligible =
      uniqueVoters >= votingConfig.eligibility.min_unique_verified_voters &&
      avgRating >= votingConfig.eligibility.min_avg_rating;

    return {
      eligible,
      score,
    };
  }

  async computeVotingBonus(input: VotingBonusInput): Promise<VotingBonusResult> {
    const { userId, weekStart, weekEnd, config } = input;
    const votingConfig = config.boosts.voting;

    if (!config.boosts.enabled) {
      return { totalBonus: 0, score: 0 };
    }

    const { data: artifacts, error: artifactsError } = await this.supabase
      .from('artifacts')
      .select('id, author_id, avg_rating, rating_count, created_at, hidden')
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString());

    if (artifactsError) {
      throw new Error('Failed to load voting boost artifacts');
    }

    const filteredArtifacts = (artifacts ?? []).filter((artifact) =>
      votingConfig.eligibility.require_not_hidden ? !artifact.hidden : true,
    );

    const statsByAuthor = new Map<string, { score: number; ratingSum: number; ratingCount: number; artifactIds: string[] }>();
    for (const artifact of filteredArtifacts) {
      const authorId = String(artifact.author_id ?? '');
      if (!authorId) continue;
      const memo = statsByAuthor.get(authorId) ?? { score: 0, ratingSum: 0, ratingCount: 0, artifactIds: [] };
      memo.score += this.computeMemeScore(artifact, votingConfig.scoring);
      const ratingCount = artifact.rating_count ?? 0;
      const avgRating = artifact.avg_rating ?? 0;
      memo.ratingSum += ratingCount * avgRating;
      memo.ratingCount += ratingCount;
      memo.artifactIds.push(artifact.id);
      statsByAuthor.set(authorId, memo);
    }

    const artifactIds = filteredArtifacts.map((artifact) => artifact.id);
    const voterSetsByAuthor = await this.fetchUniqueVotersByAuthor(artifactIds, filteredArtifacts, weekStart, weekEnd);

    let totalScore = 0;
    for (const [authorId, stats] of statsByAuthor.entries()) {
      const avgRating = stats.ratingCount > 0 ? stats.ratingSum / stats.ratingCount : 0;
      const uniqueVoters = voterSetsByAuthor.get(authorId)?.size ?? 0;
      const eligible =
        uniqueVoters >= votingConfig.eligibility.min_unique_verified_voters &&
        avgRating >= votingConfig.eligibility.min_avg_rating &&
        (!votingConfig.eligibility.require_published || stats.ratingCount > 0);

      if (eligible) {
        totalScore += stats.score;
      } else {
        stats.score = 0;
      }
    }

    const userStats = statsByAuthor.get(userId);
    const userScore = userStats?.score ?? 0;
    if (!userStats || totalScore <= 0 || userScore <= 0) {
      return { totalBonus: 0, score: 0 };
    }

    const rawBonus = (userScore / totalScore) * votingConfig.bonus_pool_weekly;
    const cappedBonus = Math.min(rawBonus, votingConfig.user_boost_cap_weekly);

    return {
      totalBonus: Math.floor(cappedBonus),
      score: userScore,
    };
  }

  private async computeUserVotingStats(params: {
    userId: string;
    weekStart: Date;
    weekEnd: Date;
    votingConfig: QuestConfig['boosts']['voting'];
    artifacts: VotingBoostInput['artifacts'];
  }) {
    const { userId, weekStart, weekEnd, votingConfig, artifacts } = params;
    const artifactIds = artifacts.map((artifact) => artifact.id);
    const voterSetsByAuthor = await this.fetchUniqueVotersByAuthor(artifactIds, artifacts, weekStart, weekEnd);
    const uniqueVoters = voterSetsByAuthor.get(userId)?.size ?? 0;

    let ratingSum = 0;
    let ratingCount = 0;
    let score = 0;

    for (const artifact of artifacts) {
      score += this.computeMemeScore(artifact, votingConfig.scoring);
      const count = artifact.rating_count ?? 0;
      const avg = artifact.avg_rating ?? 0;
      ratingSum += count * avg;
      ratingCount += count;
    }

    const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

    return {
      uniqueVoters,
      avgRating,
      score,
    };
  }

  private computeMemeScore(
    artifact: { rating_count?: number | null; avg_rating?: number | null; created_at?: string | null },
    scoring: QuestConfig['boosts']['voting']['scoring'],
  ) {
    const ratingCount = Math.min(artifact.rating_count ?? 0, scoring.max_counted_unique_voters_per_meme);
    if (ratingCount <= 0) return 0;

    const avgRating = artifact.avg_rating ?? 0;
    const ratingMultiplier = this.getRatingMultiplier(avgRating, scoring.rating_multiplier);

    const createdAt = artifact.created_at ? new Date(artifact.created_at) : new Date();
    const ageDays = Math.max(1, (Date.now() - createdAt.getTime()) / MS_PER_DAY);
    const velocity = ratingCount / ageDays;
    const velocityMultiplier = this.getVelocityMultiplier(velocity, scoring.velocity_multiplier);

    const score = ratingCount * ratingMultiplier * velocityMultiplier;
    return Math.min(score, scoring.max_vote_score_per_meme);
  }

  private getRatingMultiplier(avgRating: number, config: QuestConfig['boosts']['voting']['scoring']['rating_multiplier']) {
    if (avgRating < 3.8) return config.below_3_8;
    if (avgRating < 4.2) return config['3_8_to_4_1'];
    if (avgRating <= 4.5) return config['4_2_to_4_5'];
    return config.above_4_5;
  }

  private getVelocityMultiplier(velocity: number, config: QuestConfig['boosts']['voting']['scoring']['velocity_multiplier']) {
    if (velocity < 5) return config.below_5;
    if (velocity <= 15) return config['5_to_15'];
    return config.above_15;
  }

  private async fetchUniqueVotersByAuthor(
    artifactIds: string[],
    artifacts: Array<{ id: string; author_id?: string | null }>,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<Map<string, Set<string>>> {
    const voterSetsByAuthor = new Map<string, Set<string>>();
    if (artifactIds.length === 0) return voterSetsByAuthor;

    const { data: ratings, error } = await this.supabase
      .from('meme_ratings')
      .select('artifact_id, user_id')
      .in('artifact_id', artifactIds)
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString());

    if (error) {
      throw new Error('Failed to load voting boost ratings');
    }

    const authorByArtifact = new Map<string, string>();
    for (const artifact of artifacts) {
      if (artifact.author_id) authorByArtifact.set(artifact.id, String(artifact.author_id));
    }

    for (const rating of ratings ?? []) {
      const authorId = authorByArtifact.get(String(rating.artifact_id));
      if (!authorId) continue;
      const set = voterSetsByAuthor.get(authorId) ?? new Set<string>();
      set.add(String(rating.user_id));
      voterSetsByAuthor.set(authorId, set);
    }

    return voterSetsByAuthor;
  }
}

