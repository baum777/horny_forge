/**
 * LegacyRecordsHandler - Handles backward compatibility for records without matrix_meta
 * 
 * Provides explicit defaults for old records that don't have matrix_meta field.
 */

import type { PromptMatrixMeta } from './types';

/**
 * Default matrix_meta for legacy records (records created before PromptMatrix v2)
 */
export const LEGACY_PROMPT_MATRIX_META: PromptMatrixMeta = {
  schema_version: 'legacy',
  fallback_used: true,
  legacy_record: true,
  intent: 'victory', // Note: 'reaction' is not in new Intent type, will need fix
  energy: 1,
  flavor: 'clean', // Changed from ironic to clean
  pattern: 'A',
  noveltyScore: 0.3,
  riskScore: 0.1,
  coherenceScore: 0.5,
  used_guardrails: ['LEGACY_RECORD_DEFAULT'],
};

/**
 * Normalizes matrix_meta from a record, providing legacy defaults if missing.
 * 
 * @param recordMatrixMeta Raw matrix_meta from database (may be null/undefined)
 * @returns Normalized PromptMatrixMeta object (never null)
 */
export function normalizeMatrixMeta(recordMatrixMeta: unknown): PromptMatrixMeta {
  // If matrix_meta exists and is valid, return it
  if (recordMatrixMeta && typeof recordMatrixMeta === 'object') {
    const meta = recordMatrixMeta as Record<string, unknown>;
    
    // Ensure it has required fields, merge with legacy defaults
    return {
      ...LEGACY_PROMPT_MATRIX_META,
      ...meta,
      // Explicitly set legacy_record flag if schema_version indicates legacy
      legacy_record: meta.schema_version === 'legacy' || !meta.schema_version,
    } as PromptMatrixMeta;
  }

  // No matrix_meta found - return legacy defaults
  return LEGACY_PROMPT_MATRIX_META;
}

/**
 * Checks if a record is a legacy record (no matrix_meta or legacy schema version).
 */
export function isLegacyRecord(matrixMeta: PromptMatrixMeta | null | undefined): boolean {
  if (!matrixMeta) return true;
  return matrixMeta.legacy_record === true || matrixMeta.schema_version === 'legacy';
}
