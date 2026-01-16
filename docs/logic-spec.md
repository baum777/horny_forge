# Horny Logic Spec v1

## 0) Globale Begriffe

**User States**
* `UNVERIFIED`: kein X OAuth
* `VERIFIED`: X OAuth vorhanden, Session gültig
* `FROZEN`: rewards/claims gesperrt (reports/abuse), aber Account bleibt nutzbar

**Content States**
* `generated_image`: privates Asset
* `published_meme`: public Kandidat für Voting Gallery
* `hidden`: durch Reports auto-hide (nicht public sichtbar)
* `removed`: admin final entfernt

**Caps / Limits**
* Generator daily limit: Verified base `12`, boosted `15+1`
* Publish: `2 free/day`, danach XP-Kosten
* Voting XP: daily cap (konfigurierbar)
* Weekly Quest user cap: `200k/week`
* Weekly quest: first-come-first-served slots

---

## 1) Global Navigation & Redirect Logic

### `/` Landing
* **UNVERIFIED**: bleibt Landing
* **VERIFIED**: `GET /api/me` → Redirect zu `/dashboard` (Smart Redirect)

### Auth Session
* Frontend auth state source of truth: `GET /api/me`
* All write endpoints require `credentials: include`

### Route Guards
* `/dashboard`, `/forge/*`, `/my-gallery`, `/quests/*`: `VERIFIED` only
* `/gallery/*`: öffentlich lesbar
* `/gallery/:memeId/rate`, `/report`, `/quests/claim`: `VERIFIED` only

---

## 2) Meme Forge Logic Spec

### 2.1 `/forge/create` (Generate)
**Inputs**
* `template` (allowlist of 5)
* `user_prompt`
* `nudges`: `energy` (clamped), `flavor` (optional)
* `caption`: top/bottom (UI overlay only)

**Rules**
* Template entscheidet, ob `base_id` required
* Energy ist level-gated:
  * allowed_energy_max aus Level
* `no text in image`: captions sind UI-rendered

**Events**
* `generate_request`
* `generate_success` → creates `generated_image` + `matrix_meta`
* XP event: `generate_image` (+5) * multiplier (cap 1.5)

**Limits**
* Wenn daily gen limit erreicht:
  * Generate disabled
  * CTA → `/forge/remix`

### 2.2 `/forge/preview` (Review)
**Rules**
* Overlay preview wird clientseitig gerendert
* User kann:
  * speichern (draft)
  * publish
  * regenerate (wenn noch im daily limit)
**No new XP** (außer Regenerate zählt als Generate)

### 2.3 `/forge/publish` (Public Candidate)
**Rules**
* Publish möglich nur für `generated_image` owned by user
* Publish count:
  * first 2/day: free
  * ab 3/day: XP cost curve

**Events**
* `publish_meme` creates `published_meme`
* XP event: +10 (optional multiplier nur wenn publish an matrix gebunden)
* Wenn Meme später `hidden`: XP/Rewards freeze für meme-linked rewards

### 2.4 `/forge/remix` (Post-Limit Gameplay)
**Access**
* Remix immer möglich, aber **Rewards nur wenn Limit reached**
**Features**
* Top/Bottom text edit
* Keyword assist: max 2 suggestions per meme
* Share to X only via official button
**Rewards**
* **0 XP**
* Badge progress möglich (X share badges)
**Publishing**
* Remix wird nie eigenes published_meme
* Remix bleibt Sub-Entity zu `generated_image`

---

## 3) My Gallery Logic Spec (`/my-gallery`)

### 3.1 Tabs
* `drafts`: alle `generated_images` ohne publish
* `published`: eigene published_memes
* `hidden`: eigene hidden/flagged memes

### Ownership Rules
* Nur owner sieht drafts/hidden
* Hidden:
  * sichtbar für owner
  * nicht sichtbar in public feeds

---

## 4) Public Gallery Logic Spec (`/gallery/*`)

### 4.1 `/gallery/voting?sort=hot|new`
**Public readable** (no auth required)

**Eligibility**
* Nur `published_meme.hidden = false` und `removed = false`

**Sort**
* `new`: created_at desc
* `hot`: time-decay 72h
  * show only memes with rating_count >= 3
  * hard age cutoff <= 72h

**Filters**
* Intent filter (v1)
* energy/pattern später optional

### 4.2 Rating Logic
**Action**
* `POST /api/gallery/:memeId/rate { rating 1..5 }`
* `VERIFIED only`

**Rules**
* One rating per user per meme (unique)
* Update window: 15 min
* XP only on first rating (2/4/6/8)

### 4.3 Ace/MVP Gallery (`/gallery/ace`)
**Public readable**
**Eligibility**
* avg_rating >= 4.2
* rating_count >= 25
* report_count < 3
* within last 30 days (config)

### 4.4 Reports & Auto-hide
**Action**
* `POST /api/gallery/:memeId/report`
* `VERIFIED only`

**Rules**
* unique reporter per meme
* if report_count >= N → auto-hide meme
* auto-hide triggers:
  * meme hidden=true
  * rewards freeze for that meme context

---

## 5) Weekly Quests Logic Spec (`/quests/*`)

### 5.1 Definitions
* Weekly quests defined by YAML/JSON
* 4 tiers, multiple paths
* each tier has:
  * min_level gate
  * slots
  * reward_per_claim

### 5.2 Progress Computation
Source data:
* user aggregates (generations/publishes/votes/shares)
* meme stats (best rating_count, avg_rating)
* matrix flags (novelty_high / coherence_high / rare_combo)

Outputs:
* per tier:
  * per path progress
  * eligible flag if any path fulfilled

### 5.3 Claim
**Action**
* `POST /api/quests/claim { tier }`

**Validation**
1. verified required
2. not frozen
3. user_weekly_cap not exceeded (pending included)
4. tier unlocked by min_level
5. eligibility recompute server-side
6. remaining slots > 0 (atomic)

**Effects**
* create weekly_claim
* create token_rewards (pending) with idempotency key

---

## 6) Badges & Overlays Logic Spec

**Badges**
* Status only (no tokens)
* Awarding:
  * Common/Rare live
  * Epic/Legendary batch recompute

**Overlays**
* Max 1 active
* Unlocked by specific epic/legendary badges
* Visible in:
  * profile, feed, dashboard header

---

## 7) XP Freeze Rules

**Triggers**
* Meme auto-hidden via reports
* Abuse anomaly (fingerprint) on claims

**Scope**
* Freeze blocks:
  * token claims/payouts related to flagged content
  * weekly quest claim if `freeze_blocks_claim = true`
* Freeze does **not** block:
  * viewing
  * voting
  * generating (unless desired later)

**Admin**
* unfreeze restores claimability

---

## 8) Key Event Types (Telemetry + XP)
* `auth_x_connected`
* `generate_image`
* `publish_meme`
* `rate_meme_first`
* `rate_meme_update` (no XP)
* `report_meme`
* `remix_share_valid` (no XP)
* `quest_claim_attempt`
* `quest_claim_success`
* `freeze_applied`
* `freeze_removed`

---

## 9) API Endpoints & Validation

### 9.1 Authentication Endpoints

#### `GET /api/me` (or `/api/gamification/me`)
**Auth**: Required (X OAuth)
**Response**: User stats including level, XP, badges, unlocked features

### 9.2 Forge Endpoints

#### `POST /api/forge`
**Auth**: Required
**Body**:
```json
{
  "base_id": "string (optional)",
  "base_image": "string (optional, must match /horny_base/base-*.png pattern)",
  "preset": "HORNY_CORE_SKETCH | HORNY_META_SCENE | HORNY_CHAOS_VARIATION",
  "user_input": "string (1-240 chars)",
  "size": "1024x1024 (optional)",
  "seed": "string (optional)",
  "debug": "boolean (optional)"
}
```
**Validation**:
* Either `base_id` or `base_image` required
* `user_input` max 240 characters
* `base_image` must match horny_base pattern

#### `POST /api/forge/release`
**Auth**: Required
**Body**:
```json
{
  "generation_id": "string (required)",
  "caption": "string (max 140 chars, optional)",
  "tags": ["string"] (1-3 tags required)
}
```

### 9.3 Gamification Endpoints

#### `POST /api/gamification/action`
**Auth**: Required
**Headers**: `Idempotency-Key` (required)
**Body**:
```json
{
  "action": "vote | comment | share | follow | forge | artifact_release | meme_create | votes_received | time_spent | streak_tick | special",
  "artifactId": "string (optional, required for vote/comment/share)",
  "idempotencyKey": "string (optional, can also be in header)",
  "receivedVotesDelta": "number (optional, for votes_received)",
  "timeDeltaSeconds": "number (optional, for time_spent, max 3600)",
  "quizClassId": "string (optional)",
  "quizVector": "array (optional)"
}
```

**Validation Rules**:
* `vote`: Requires `artifactId`, 30s cooldown per artifact
* `comment`: Requires `artifactId`
* `share`: Requires `artifactId` (future: OAuth proof validation)
* `votes_received`: **BLOCKED** from client (server-side only)
* `time_spent`: Requires `timeDeltaSeconds`, max 3600s per session
* `artifact_release`: Requires `artifactId` (future: ownership proof)

**Rate Limiting**:
* Per user: 60 requests/minute
* Per IP: 100 requests/minute

**Response**:
```json
{
  "stats": { ...user stats... },
  "result": {
    "deltaHorny": 0,
    "newLevel": 5,
    "visibilityBoost": { ... },
    "newlyUnlockedBadges": [],
    "newlyUnlockedFeatures": [],
    "tier": "private | semi | public"
  }
}
```

### 9.4 Gallery Endpoints

#### `GET /api/gallery/voting?sort=hot|new`
**Auth**: Optional (public readable)
**Query Params**:
* `sort`: `hot` (time-decay 72h, min 3 ratings) | `new` (created_at desc)

#### `GET /api/gallery/ace`
**Auth**: Optional (public readable)
**Filters**: avg_rating >= 4.2, rating_count >= 25, report_count < 3, within 30 days

#### `POST /api/gallery/:memeId/rate`
**Auth**: Required
**Body**:
```json
{
  "rating": 1-5,
  "fingerprintHash": "string (optional)"
}
```
**Validation**:
* One rating per user per meme (unique constraint)
* Edit window: 15 minutes
* XP only on first rating (2/4/6/8 based on rating)

#### `POST /api/gallery/:memeId/report`
**Auth**: Required
**Body**:
```json
{
  "reason": "string (optional)",
  "fingerprintHash": "string (optional)"
}
```
**Validation**:
* Unique reporter per meme
* Auto-hide when report_count >= threshold

### 9.5 Quest Endpoints

#### `POST /api/quests/claim`
**Auth**: Required
**Body**:
```json
{
  "tier": 1-4
}
```
**Validation**:
* User verified
* Not frozen
* Weekly cap not exceeded (200k/week including pending)
* Tier unlocked by min_level
* Eligibility recomputed server-side
* Remaining slots > 0 (atomic check)

---

## 10) Idempotency Keys

**Format**: `{action}:{context}:{nonce}`

**Examples**:
* `xp:x_linked:{user_id}`
* `xp:gen:{generated_image_id}`
* `xp:publish:{published_meme_id}`
* `xp:rate:{meme_id}:{user_id}`
* `xp:badge:{badge_key}:{user_id}`
* `weekly:{week_id}:tier:{tier}:user:{user_id}`
* `vote:art_123:550e8400-e29b-41d4-a716-446655440000`

**Behavior**:
* First request: Action processed, response cached
* Duplicate request: Cached response returned (no double rewards)

---

## 11) Caps & Limits

### Global Caps
* **Daily Horny Cap**: 150
* **Weekly Horny Cap**: 600

### Per-Action Caps (Daily)
* `vote`: 20
* `comment`: 15
* `share`: 10
* `follow`: 20
* `forge`: 30
* `artifact_release`: 50
* `meme_create`: 30
* `votes_received`: 100
* `time_spent`: 20
* `streak_tick`: 10

### Cooldowns
* **Vote cooldown**: 30 seconds per artifact
* **Rating edit window**: 15 minutes

### Rate Limits
* **Per user**: 60 requests/minute
* **Per IP**: 100 requests/minute

---

## 12) Level Progression

### Level Curve
* Level 1: 0 XP
* Level 2: 100 XP
* Level 3: 300 XP
* Level 4: 700 XP
* Level 5: 1,500 XP
* Level 6: 3,000 XP
* Level 7: 6,000 XP
* Level 8: 12,000 XP
* Level 9: 25,000 XP
* Level 10: 50,000 XP

### Visibility Boosts (per level)
* Level 1: feedWeight 1.0
* Level 2: feedWeight 1.05
* Level 3: feedWeight 1.1, features: ["subtle_glow"]
* Level 4: feedWeight 1.2, features: ["subtle_glow"]
* Level 5: feedWeight 1.3, features: ["glow_effect", "verified_mark"]
* Level 6: feedWeight 1.45, features: ["glow_effect", "verified_mark"]
* Level 7: feedWeight 1.6, features: ["glow_effect", "verified_mark", "highlight_chance"]
* Level 8: feedWeight 1.75, features: ["highlight_chance", "creator_frame"]
* Level 9: feedWeight 1.9, features: ["creator_frame", "viral_slot_chance"]
* Level 10: feedWeight 2.1, features: ["mythic_aura", "viral_slot_chance"]

---

## 13) Gamification Actions & Rewards

### Action Types & Base Rewards
* `vote`: +2 Horny
* `comment`: +2 Horny
* `share`: +5 Horny
* `follow`: +1 Horny
* `forge`: +5 Horny (unlocks: ["forge_preset_pack_1"])
* `artifact_release`: +10 Horny
* `meme_create`: +5 Horny
* `votes_received`: Computed (1 per vote received)
* `time_spent`: Computed (1 per 60 seconds, max 3600s)
* `streak_tick`: +3 Horny
* `special`: +0 Horny (custom events)

### Visibility Tiers
* `private`: Internal only
* `semi`: Visible to connections
* `public`: Fully public

