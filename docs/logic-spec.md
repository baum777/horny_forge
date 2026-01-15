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

