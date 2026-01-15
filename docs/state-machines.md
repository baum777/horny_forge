# Horny State Machine Spec v1

## 0) Notation

* **State**: `STATE_NAME`
* **Event**: `event_name(payload)`
* **Guard**: `condition`
* **Action**: `do_something()`
* **Side-effects**: DB writes, XP events, token ledger, telemetry
* **Idempotency key**: unique key to prevent duplicates

---

## 1) User Session Machine

### States
* `ANON`
* `VERIFIED_ACTIVE`
* `VERIFIED_FROZEN` (reward/claim freeze only; limited impact)

### Events & Transitions

#### `x_oauth_success(session)`
* From: `ANON`
* To: `VERIFIED_ACTIVE`
* Guards: none
* Actions:
  * `create_or_update_user_session()`
  * `emit_xp_event(type="auth_x_connected", xp=25, idem="xp:x_linked:{user}")`
  * `award_badge("X_LINKED", idem="badge:X_LINKED:{user}")`

#### `freeze_applied(scope)`
* From: `VERIFIED_ACTIVE`
* To: `VERIFIED_FROZEN`
* Guards: `scope in {claims, rewards, meme_context}`
* Actions:
  * `set_user_freeze(scope, true)`
  * `emit_telemetry("freeze_applied")`

#### `freeze_removed(scope)`
* From: `VERIFIED_FROZEN`
* To: `VERIFIED_ACTIVE`
* Guards: `no_remaining_freeze_scopes()`
* Actions:
  * `set_user_freeze(scope, false)`
  * `emit_telemetry("freeze_removed")`

**Route Guards**
* `dashboard/forge/my-gallery/quests`: require `VERIFIED_ACTIVE or VERIFIED_FROZEN` (read-only differences apply)
* `quests/claim`: require `VERIFIED_ACTIVE` only
* `gallery/rate/report`: require `VERIFIED_ACTIVE` only

---

## 2) Generator / Meme Forge Machine

### Per-day counters
* `generations_used_today`
* `publishes_used_today`
* `allowed_generations_today = 12 (base) or 15+1 (boost)`

### States (per user per day)
* `GEN_AVAILABLE`
* `GEN_LIMIT_REACHED`

### Events

#### `generate_request(template, prompt, nudges, caption, base_id?)`
* From: `GEN_AVAILABLE`
* Guards:
  * `user_verified == true`
  * `generations_used_today < allowed_generations_today`
  * `template in allowlist(5)`
  * `energy <= allowed_energy_max(level)`
  * if base required: `base_id exists OR auto_pick_base(template)`
* Actions:
  * `job = create_generation_job()`
  * `emit_telemetry("generate_request")`
* To: `GEN_AVAILABLE` (async job processing)

#### `generate_success(job_id, image_url, matrix_meta)`
* From: `GEN_AVAILABLE`
* Guards:
  * `job.status == pending`
* Actions:
  * `img = insert_generated_image(… + matrix_meta fields + jsonb)`
  * `increment_generations_used_today()`
  * `mult = compute_multiplier(matrix_meta) clamped to 1.5`
  * `emit_xp_event(type="generate_image", xp=5*mult, idem="xp:gen:{img.id}")`
  * `maybe_award_badges_live(img)`
* Transition:
  * if `generations_used_today == allowed_generations_today` → `GEN_LIMIT_REACHED`
  * else stay `GEN_AVAILABLE`

#### `generate_denied_limit()`
* From: `GEN_AVAILABLE`
* Guards: `generations_used_today >= allowed_generations_today`
* Actions:
  * `emit_telemetry("generate_denied_limit")`
* To: `GEN_LIMIT_REACHED`

#### `day_rollover()`
* From: `GEN_LIMIT_REACHED` or `GEN_AVAILABLE`
* To: `GEN_AVAILABLE`
* Actions:
  * `reset_daily_counters()`

---

## 3) Publish Machine (per generated_image)

### States (per image)
* `DRAFT` (generated, not published)
* `PUBLISHED`
* `HIDDEN` (auto-hide by reports)
* `REMOVED` (admin final)

### Events

#### `publish_request(generated_image_id)`
* From: `DRAFT`
* Guards:
  * `owner(user, generated_image_id)`
  * `publishes_used_today < ∞` (but costs apply after 2)
  * if `publishes_used_today >= 2`: `user_xp_balance >= publish_cost(publishes_used_today+1)`
* Actions:
  * if cost: `deduct_xp(publish_cost, idem="xp:publish_cost:{day}:{n}")`
  * `meme = create_published_meme(generated_image_id)`
  * `increment_publishes_used_today()`
  * `emit_xp_event(type="publish_meme", xp=10, idem="xp:publish:{meme.id}")`
  * `emit_telemetry("publish_success")`
* To: `PUBLISHED`

#### `report_threshold_reached(meme_id)`
* From: `PUBLISHED`
* Guards:
  * `report_count(meme_id) >= reports_autohide_n`
* Actions:
  * `set_meme_hidden(meme_id, true)`
  * `apply_freeze(user_id=owner, scope="meme_context", ref=meme_id)`
  * `emit_telemetry("meme_auto_hidden")`
* To: `HIDDEN`

#### `admin_remove(meme_id)`
* From: `PUBLISHED` or `HIDDEN`
* Actions:
  * `set_removed=true`
  * `invalidate_rewards_linked_to_meme(meme_id)` (keep audit trail)
* To: `REMOVED`

#### `admin_unhide(meme_id)`
* From: `HIDDEN`
* Guards:
  * `admin_approved == true`
* Actions:
  * `set_hidden=false`
  * `remove_freeze(scope="meme_context", ref=meme_id)` (if no other freezes)
* To: `PUBLISHED`

---

## 4) Voting Machine (per published_meme per user)

### States
* `NOT_RATED`
* `RATED_EDITABLE` (within 15 min)
* `RATED_LOCKED`

### Events

#### `rate_request(meme_id, rating)`
* From: `NOT_RATED`
* Guards:
  * `user_verified == true`
  * `meme.hidden == false && meme.removed == false`
  * `rating in 1..5`
* Actions:
  * `insert_rating(unique user+meme)`
  * `update_meme_aggregates(avg, count, hot_score)`
  * `emit_xp_event(type="rate_meme_first", xp=rating_xp(rating), idem="xp:rate:{meme}:{user}")`
* To: `RATED_EDITABLE`

#### `rate_update_request(meme_id, rating)`
* From: `RATED_EDITABLE`
* Guards:
  * `now <= rating_created_at + 15min`
* Actions:
  * `update_rating()`
  * `update_meme_aggregates()`
  * `emit_telemetry("rate_update")` (no XP)
* To: `RATED_EDITABLE`

#### `rating_edit_window_expired(meme_id)`
* From: `RATED_EDITABLE`
* Guards: `now > created_at + 15min`
* To: `RATED_LOCKED`

---

## 5) Remix Machine (per generated_image)

### States
* `REMIX_AVAILABLE`
* `REMIX_REWARD_ELIGIBLE` (only when gen limit reached)
* `REMIX_SHARED` (at least once)

### Events

#### `remix_open(generated_image_id)`
* Guards: `owner(user, generated_image_id)`
* State derivation (not stored):
  * if `GEN_LIMIT_REACHED` → treat as `REMIX_REWARD_ELIGIBLE`
  * else `REMIX_AVAILABLE`

#### `keyword_suggest_request(generated_image_id, keyword)`
* Guards:
  * `suggestions_used_for_image < 2`
* Actions:
  * `generate_2_suggestions()`
  * `increment_suggestions_used()`
* XP: none

#### `x_share_valid(generated_image_id, text_top, text_bottom, share_text)`
* Guards:
  * `share_via_official_button == true`
  * `"$HORNY" in share_text`
  * `(text_top or text_bottom) not empty`
  * `dedupe share per image` (optional)
* Actions:
  * `record_remix_event(shared_to_x=true)`
  * if in `REMIX_REWARD_ELIGIBLE`: `advance_badge_progress("SIGNAL_*")`
  * `emit_telemetry("remix_share_valid")`
* To: `REMIX_SHARED`

---

## 6) Weekly Quest Machine (per user per week per tier)

### Entities
* Quest definition: `week_id`
* Tier: 1..4
* Claim slot counters (atomic)
* User cap: 200k/week (pending included)

### States (per tier)
* `LOCKED` (level too low)
* `IN_PROGRESS`
* `ELIGIBLE`
* `CLAIMED`
* `POOL_EMPTY`

### Events

#### `quest_progress_tick()` (computed)
* Derives state per tier:
  * if `level < min_level` → `LOCKED`
  * else if `claimed` → `CLAIMED`
  * else if `slots_remaining == 0` → `POOL_EMPTY`
  * else if `any_path_fulfilled == true` → `ELIGIBLE`
  * else `IN_PROGRESS`

#### `claim_request(tier)`
* From: `ELIGIBLE`
* Guards:
  * `user_verified == true`
  * `user not frozen` (freeze_blocks_claim)
  * `user_weekly_claimed + pending + reward_per_claim <= 200k`
  * `not already claimed (week_id,tier,user)`
  * `recompute eligibility server-side == true`
* Actions (atomic transaction):
  1. `lock tier counter row (SELECT FOR UPDATE)`
  2. `if remaining_slots <= 0: abort`
  3. `decrement remaining_slots`
  4. `insert weekly_quest_claim`
  5. `insert token_rewards(status=pending, amount=reward_per_claim, idem="weekly:{week}:{tier}:{user}")`
  6. `emit_telemetry("quest_claim_success")`
* To: `CLAIMED`

#### `claim_denied(reason)`
* From: any
* Actions:
  * `emit_telemetry("quest_claim_denied", reason)`
* State unchanged

---

## 7) Badge Award Machine (global)

### Award modes
* Live: Common/Rare
* Batch: Epic/Legendary (hourly/nightly)

### States (per badge per user)
* `LOCKED`
* `EARNED`

### Event: `award_badge(badge_key)`
* Guards:
  * `requirements met`
  * `not already earned`
* Actions:
  * `insert user_badges(badge_key)`
  * `emit_xp_event(badge_xp, idem="xp:badge:{badge}:{user}")`
  * if tier Epic/Legendary and reward policy enabled:
    * **(Note: in your final model, badges are status-only)**
    * so token ledger is **NOT** created here.
* To: `EARNED`

---

## 8) Critical Idempotency Keys (v1)

* XP:
  * `xp:x_linked:{user}`
  * `xp:gen:{generated_image_id}`
  * `xp:publish:{published_meme_id}`
  * `xp:rate:{meme_id}:{user_id}`
  * `xp:badge:{badge_key}:{user_id}`
* Claims:
  * `weekly:{week_id}:tier:{tier}:user:{user_id}`
* Token ledger:
  * same as claim idempotency key

---

## 9) Hot / Ace Query State (derived, not stored)

### Hot feed eligibility
* `hidden=false && removed=false`
* `rating_count >= 3`
* `age_hours <= 72`

### Ace/MVP eligibility
* `avg_rating >= 4.2`
* `rating_count >= 25`
* `report_count < 3`
* `created_at within 30d`

