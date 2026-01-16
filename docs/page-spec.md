# $HORNY — Page-by-Page Design & Style Specification

## Token System

Every rendered route must declare a `PageSpec` and go through `PageShell`. The shell writes the following `<body>` attributes:

| Data Attribute | Purpose |
| -------------- | ------- |
| `data-page` | Canonical slug for the route (e.g. `home`, `game`). |
| `data-state` | Visual status (`active`, `teaser`, `locked`). |
| `data-flavor` | Flavor variant—controls subtle theme shifts (default, subtle, mixed, etc.). |
| `data-energy` | Motion/energy level (1=static, 2=hover-only, 3=card motion, etc.). |
| `data-tier` | Optional accent-tier identifier (profile overlays, gamification). |

Before any content renders, `PageShell` _requires_ this spec object so no page can skirt the tokens.

---

## Pages

### `/` — Landing
* **Purpose:** Build trust, drive users to either Forge or Game.
* **Tokens:** `page=home`, `state=active`, `flavor=default`, `energy=2`.
* **Accent:** Horny Yellow (#FFE600) used only on CTAs and badges—no additional accents.
* **Motion:** Only fade-on-load and CTA hover glow; KPI band loops calmly.
* **Interactions:** Primary CTAs (`Start Forging`, `Play Cyber Runner`), social icon CTAs (Dex, Discord, X). KPI band uses on-chain numbers (price, MC, holders, liquidity, volume).
* **Forbidden:** pulsing backgrounds, moving headlines, multi-accent palettes.

### `/game` — Game (Teaser)
* **Purpose:** Build anticipation for Cyber Runner; no gameplay.
* **Tokens:** `page=game`, `state=teaser`, `flavor=subtle`, `energy=1`.
* **Accent:** Subtle yellow highlights; main canvas and placeholders remain black/white.
* **Motion:** Minimal; only static blur gradients. No auto-animations beyond fade-in.
* **Interactions:** None (no inputs, buttons, or API calls). The overlay copy is `$Horny Runner` / `$Horny Runner unlocking soon`.
* **Forbidden:** input handling, start buttons, live APIs, additional motion.

### `/forge`
* **Purpose:** Meme generation focus space (currently a teaser placeholder).
* **Tokens:** `page=forge`, `state=teaser`, `flavor=default`, `energy=2`.
* **Accent:** Horny Yellow limited to badges/CTA; rest of canvas is calm, dark tone.
* **Motion:** Hover feedback only; no auto animation.
* **Allowed interactions:** Generate CTA, Remix CTA, prompt helpers (once live).

### `/feed` (Discovery)
* **Purpose:** Showcase memes, inspire remix entry.
* **Tokens:** `page=feed`, `state=active`, `flavor=mixed`, `energy=2`.
* **Accent:** Page-level accent stays neutral; individual cards are allowed their own accents.
* **Motion:** Subtle hover reveals on cards; no page-wide accent swaps.
* **Layout:** Filter bar / card grid / load-more control.

### `/profile`
* **Purpose:** Surface identity, status, badges, and history.
* **Tokens:** `page=profile`, `tier=user-tier`, `flavor=subtle`, `energy=3`.
* **Accent:** Matches the user tier (tiers drive glow, rings, etc.). Only one accent per page.
* **Motion:** Cards have controlled hover/entrance; no marquee or pulses outside the tier glow.
* **Interactions:** Artifact stats, badge lists, vault glimpses; all read-only.

### `/badges` (Locked)
* **Purpose:** Tease the badge grid and maintain curiosity.
* **Tokens:** `page=badges`, `state=locked`, `flavor=desaturated`, `energy=1`.
* **Accent:** Desaturated palette with blurred previews; no bright accents permitted.
* **Motion:** Blur / opacity only; no tooltips or progress indicators.
* **Copy:** `Coming Soon — stay $Horny`. No interactions.

### `/interact`
* **Purpose:** Explore and remix content; optional experiments.
* **Tokens:** `page=interact`, `state=active`, `flavor=subtle`, `energy=2`.
* **Accent:** Neutral; content blocks (cards) may hold localized accent colors.
* **Motion:** Focus on calm content reveals; avoid global accent or status overloading.
* **Interactions:** Modular paths to sample features without pressure.

---

## Global Design Rules (Non-Negotiable)

1. **One accent per page:** Additional colors are restricted to card-level elements only.
2. **No pulsing backgrounds or fake KPIs:** Backgrounds stay stable; KPIs must be real on-chain/aggregated data.
3. **No auto-animations beyond allowed states:** Energy=1 is fade-only; energy=2 allows hover glow; energy≥3 limited to controlled card reveals.
4. **Social CTAs are icons only:** Dex / Discord / X icons stay monochrome white, glow only on hover.
5. **Contract Address is full, monospace, no truncation or pulsing.**
6. **Locked / Teaser states must be blurred, desaturated, and non-interactive.**

This file is the canonical source for the routing tokens and visual limits for every release. Update it whenever a new page is introduced or any of these rules change.

