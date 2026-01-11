import OpenAI from 'openai';
import { config } from '../config';

export type ModerationStatus = 'pass' | 'fail' | 'review';

export interface ModerationResult {
  status: ModerationStatus;
  reasons: {
    flagged: boolean;
    categories: Record<string, boolean>;
    scores: Record<string, number>;
  };
}

const REVIEW_SCORE_THRESHOLD = 0.2;

export class ModerationService {
  private client: OpenAI | null;

  constructor() {
    this.client = config.openai.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : null;
  }

  async moderateText(inputs: string[]): Promise<ModerationResult> {
    if (!this.client) {
      return {
        status: 'review',
        reasons: {
          flagged: false,
          categories: {},
          scores: {},
        },
      };
    }

    try {
      const response = await this.client.moderations.create({
        model: 'omni-moderation-latest',
        input: inputs,
      });

      const categories: Record<string, boolean> = {};
      const scores: Record<string, number> = {};
      let flagged = false;
      let maxScore = 0;

      for (const result of response.results) {
        flagged = flagged || result.flagged;
        for (const [key, value] of Object.entries(result.categories ?? {})) {
          if (value) categories[key] = true;
        }
        for (const [key, value] of Object.entries(result.category_scores ?? {})) {
          const score = typeof value === 'number' ? value : 0;
          scores[key] = Math.max(scores[key] ?? 0, score);
          maxScore = Math.max(maxScore, score);
        }
      }

      if (flagged) {
        return {
          status: 'fail',
          reasons: {
            flagged: true,
            categories,
            scores,
          },
        };
      }

      if (maxScore >= REVIEW_SCORE_THRESHOLD) {
        return {
          status: 'review',
          reasons: {
            flagged: false,
            categories,
            scores,
          },
        };
      }

      return {
        status: 'pass',
        reasons: {
          flagged: false,
          categories,
          scores,
        },
      };
    } catch (error) {
      console.warn('Moderation check failed:', error);
      return {
        status: 'review',
        reasons: {
          flagged: false,
          categories: {},
          scores: {},
        },
      };
    }
  }
}
