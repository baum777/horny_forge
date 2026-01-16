import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';

export type MatrixEventType =
  | 'matrix_preview_created'
  | 'matrix_release_created'
  | 'matrix_fallback_used'
  | 'matrix_guardrail_applied'
  | 'vote_cast'
  | 'share'
  | 'remix';

export interface MatrixTelemetryEvent {
  event_type: MatrixEventType;
  user_id?: string | null;
  meme_id?: string | null;
  matrix_meta?: Record<string, unknown> | null;
  scores?: Record<string, unknown> | null;
}

export class MatrixTelemetry {
  private supabase;

  constructor() {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase credentials not configured');
    }
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }

  async record(event: MatrixTelemetryEvent): Promise<void> {
    const matrixMeta = event.matrix_meta ?? {};
    const axes = {
      intent: matrixMeta.intent,
      energy: matrixMeta.energy,
      flavor: matrixMeta.flavor,
      pattern: matrixMeta.pattern,
      template_key: matrixMeta.template_key,
    };
    const flags = {
      used_guardrails: matrixMeta.used_guardrails,
      fallback_used: matrixMeta.fallback_used,
      energy_clamped: matrixMeta.energy_clamped,
    };

    const payload = {
      event_type: event.event_type,
      user_id: event.user_id ?? null,
      meme_id: event.meme_id ?? null,
      schema_version: matrixMeta.schema_version ?? null,
      axes,
      scores: event.scores ?? null,
      flags,
    };

    const { error } = await this.supabase.from('matrix_events').insert(payload);
    if (error) {
      throw new Error(`Failed to record telemetry: ${error.message}`);
    }
  }
}
