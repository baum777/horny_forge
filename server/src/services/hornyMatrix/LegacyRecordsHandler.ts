/**
 * LegacyRecordsHandler - Handles backward compatibility for records without matrix_meta
 * 
 * Provides explicit defaults for old records that don't have matrix_meta field.
 */

import type { MatrixMeta } from './types';

/**
 * Default matrix_meta for legacy records (records created before HornyMatrix v2)
 */
export const LEGACY_MATRIX_META: MatrixMeta = {
  schema_version: 'legacy',
  fallback_used: true,
  legacy_record: true,
  intent: 'reaction',
  energy: 1,
  flavor: 'ironic',
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
 * @returns Normalized MatrixMeta object (never null)
 */
export function normalizeMatrixMeta(recordMatrixMeta: unknown): MatrixMeta {
  // If matrix_meta exists and is valid, return it
  if (recordMatrixMeta && typeof recordMatrixMeta === 'object') {
    const meta = recordMatrixMeta as Record<string, unknown>;
    
    // Ensure it has required fields, merge with legacy defaults
    return {
      ...LEGACY_MATRIX_META,
      ...meta,
      // Explicitly set legacy_record flag if schema_version indicates legacy
      legacy_record: meta.schema_version === 'legacy' || !meta.schema_version,
    };
  }

  // No matrix_meta found - return legacy defaults
  return LEGACY_MATRIX_META;
}

/**
 * Checks if a record is a legacy record (no matrix_meta or legacy schema version).
 */
export function isLegacyRecord(matrixMeta: MatrixMeta | null | undefined): boolean {
  if (!matrixMeta) return true;
  return matrixMeta.legacy_record === true || matrixMeta.schema_version === 'legacy';
}
