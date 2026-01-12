# Gamification System - Production Hardening

## Übersicht

Das Gamification-System wurde production-ready gemacht mit:
- **Persistent Storage** (Supabase/Postgres statt In-Memory)
- **Idempotency** mit DB-Transaktionen
- **Event-Ledger** (append-only für Audit)
- **Abuse-Prevention** (Caps, Rate Limits, Validation)
- **Observability** (Logging, Metrics)
- **Payout-Queue** (vorbereitet für Solana)

## Datenbank-Schema

### Migration ausführen

```bash
# Supabase CLI
supabase migration up

# Oder direkt in Supabase Dashboard: SQL Editor
# Datei: supabase/migrations/20260113000000_gamification_tables.sql
```

### Tabellen

1. **user_stats**: Single Source of Truth für User-Gamification-State
2. **gamification_events**: Append-only Event-Ledger für Audit
3. **idempotency_keys**: Verhindert Doppelverarbeitung
4. **payout_jobs**: Off-chain Pending Balance → später On-chain Claim

## API-Endpunkte

### GET `/api/gamification/me`
Lädt aktuelle User-Stats.

**Auth**: Erforderlich (X-Login)

**Response**:
```json
{
  "stats": {
    "userId": "user_123",
    "level": 5,
    "lifetimeHornyEarned": 1500,
    "dailyHornyEarned": 50,
    "weeklyHornyEarned": 200,
    "unlockedBadges": ["HORN_SPARK", "FIRST_PUMP"],
    ...
  }
}
```

### POST `/api/gamification/action`
Führt eine Gamification-Action aus.

**Auth**: Erforderlich (X-Login)

**Headers**:
- `Idempotency-Key`: **ERFORDERLICH** (verhindert Doppelverarbeitung)

**Body**:
```json
{
  "action": "vote",
  "artifactId": "art_123",
  "idempotencyKey": "vote:art_123:uuid"
}
```

**Response**:
```json
{
  "stats": { ... },
  "result": {
    "deltaHorny": 2,
    "newLevel": 5,
    "visibilityBoost": { ... },
    "newlyUnlockedBadges": [],
    "newlyUnlockedFeatures": []
  }
}
```

### GET `/api/gamification/metrics`
Metriken-Endpoint (für Monitoring).

**Auth**: Öffentlich (in Production: Admin-only)

## Idempotency

**KRITISCH**: Jede Action **MUSS** einen eindeutigen `Idempotency-Key` haben.

**Format**: `{action}:{context}:{nonce}`

**Beispiele**:
- `vote:art_123:550e8400-e29b-41d4-a716-446655440000`
- `forge:user_123:2024-01-13T10:00:00Z`

**Verhalten**:
- Erste Request: Action wird verarbeitet, Response wird gecacht
- Identische Request: Gecachte Response wird zurückgegeben (keine Doppelbelohnung)

## Validation & Abuse-Prevention

### Action-Validierung

- **vote**: Erfordert `artifactId`, 30s Cooldown pro Artifact
- **share**: Erfordert `artifactId` (später: OAuth-Proof)
- **votes_received**: **BLOCKIERT** von Client (nur Server-seitig)
- **time_spent**: Erfordert `timeDeltaSeconds`, Max 3600s pro Session
- **artifact_release**: Erfordert `artifactId` (später: Ownership-Proof)
- **quiz_complete**: Weekly Cap (1x pro Woche)

### Caps

- **Global Daily Cap**: 150 $HORNY
- **Global Weekly Cap**: 600 $HORNY
- **Per-Action Caps**: Definiert in `incentives.ts`

### Rate Limiting

- **Per User**: 60 Requests/Minute
- **Per IP**: 100 Requests/Minute

## Event-Ledger

Jede Action wird im `gamification_events` Table geloggt:

- **Status**: `applied` oder `rejected`
- **Payload**: Vollständiger Request-Body
- **Delta**: Tatsächlich ausgezahlte $HORNY
- **Caps**: Angewandte Caps
- **Unlocks**: Neue Badges/Features

**Recovery**: Stats können aus Events rekonstruiert werden.

## Payout-Queue

Wenn `deltaHorny > 0`:
1. Job wird in `payout_jobs` eingereiht
2. Status: `pending` (off-chain)
3. Später: Wallet-Connect → Claim → On-chain Transfer

**Aktuell**: Payouts bleiben `pending` (kein Wallet-Connect implementiert).

## Admin-Endpunkte

### POST `/api/admin/adjust`
Manuelle Anpassungen (Admin-only).

**Body**:
```json
{
  "userId": "user_123",
  "adjustments": {
    "pendingHorny": 100,
    "level": 5,
    "revokeBadge": "BADGE_ID",
    "revokeFeature": "FEATURE_ID"
  }
}
```

### POST `/api/admin/rebuild-stats`
Rekonstruiert Stats aus Events (Recovery).

**Body**:
```json
{
  "userId": "user_123"
}
```

## Logging

Structured Logging für:
- Action-Verarbeitung
- Idempotency-Hits
- Validation-Fehler
- Caps erreicht
- Payout-Enqueue

**Format**: JSON in Production, Pretty-Print in Development

## Metrics

Verfügbare Metriken:
- `gamification_actions_total{action,status}`
- `gamification_horny_distributed_total`
- `gamification_rejects_total{reason}`
- `gamification_idempotency_hits_total`
- `gamification_action_latency_ms{action}`

## Testing

### Idempotency-Test

```bash
# Request 1
curl -X POST http://localhost:3001/api/gamification/action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: test-123" \
  -d '{"action":"vote","artifactId":"art_1"}'

# Request 2 (identisch) → sollte identische Response geben, keine Doppelbelohnung
curl -X POST http://localhost:3001/api/gamification/action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: test-123" \
  -d '{"action":"vote","artifactId":"art_1"}'
```

### Cap-Test

```bash
# Führe Actions aus bis Cap erreicht
# Erwartung: `deltaHorny: 0` oder `rejected` mit Reason
```

## Production Checklist

- [x] DB-Migrationen erstellt
- [x] Idempotency mit Transaktionen
- [x] Event-Ledger implementiert
- [x] Validation & Caps
- [x] Rate Limiting
- [x] Logging
- [x] Metrics
- [x] Payout-Queue-Vorbereitung
- [ ] Wallet-Connect Integration (später)
- [ ] Proof-Validierung für kritische Actions (später)
- [ ] Redis für Rate Limiting (später)
- [ ] Prometheus Metrics Export (später)

## Nächste Schritte

1. **Migration ausführen**: `supabase migration up`
2. **Environment Variables setzen**: `ADMIN_USER_IDS=user1,user2`
3. **Server starten**: `npm run dev`
4. **Testen**: Idempotency, Caps, Rate Limits

