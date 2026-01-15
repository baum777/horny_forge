/**
 * TelemetryService - Handles telemetry events with request-scoped deduplication
 * 
 * Prevents telemetry spam from retry storms by tracking emitted events per request.
 */

import { logger } from '../../utils/logger';

interface TelemetryEvent {
  event: string;
  payload: Record<string, unknown>;
  requestId: string;
}

/**
 * Request-scoped event tracking
 * Maps requestId -> Set of emitted event types
 */
const emittedEvents = new Map<string, Set<string>>();

/**
 * Cleanup old entries after 5 minutes
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

setInterval(() => {
  // In production, use a more sophisticated cleanup (e.g., LRU cache)
  // For now, clear all entries periodically
  emittedEvents.clear();
}, CLEANUP_INTERVAL_MS);

/**
 * Emits a telemetry event with request-scoped deduplication.
 * 
 * Only the first event of each type per request will be emitted.
 * 
 * @param event Event name (e.g., 'matrix_preview_created')
 * @param payload Event payload
 * @param requestId Unique request identifier (e.g., preview_request_id or generation_id)
 */
export function emitTelemetryEvent(
  event: string,
  payload: Record<string, unknown>,
  requestId: string
): boolean {
  // Get or create event set for this request
  if (!emittedEvents.has(requestId)) {
    emittedEvents.set(requestId, new Set());
  }

  const eventSet = emittedEvents.get(requestId)!;

  // Check if this event type was already emitted for this request
  const eventKey = event;
  if (eventSet.has(eventKey)) {
    logger.debug('telemetry_event_skipped_duplicate', {
      event,
      requestId,
      reason: 'already_emitted',
    });
    return false;
  }

  // Mark as emitted
  eventSet.add(eventKey);

  // Emit event
  logger.info('telemetry_event', {
    event,
    requestId,
    ...payload,
  });

  // In production, send to external telemetry service (e.g., PostHog, Mixpanel)
  // Example:
  // telemetryClient.track(event, { ...payload, request_id: requestId });
  return true;
}

/**
 * Checks if an event was already emitted for a request.
 */
export function hasEmitted(requestId: string, event: string, payload?: Record<string, unknown>): boolean {
  const eventSet = emittedEvents.get(requestId);
  if (!eventSet) return false;
  return eventSet.has(event);
}

/**
 * Clears tracking for a request (call after request completes).
 */
export function clearRequestTracking(requestId: string): void {
  emittedEvents.delete(requestId);
}
