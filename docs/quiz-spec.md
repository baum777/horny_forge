# Entscheidungsvorlage + Empfehlung (als Spec) — Quiz für Horny

Datum: 2026-01-12  
Kontext: Vite/React Frontend + Express Backend. Aktuell existiert nur `quiz_complete` als Gamification-Event (Caps/Validierung), aber keine Quiz-Domain (keine Fragen/Antworten/State/Routes).

---

## 1) Zieldefinition (was Quiz bei Horny leisten soll)

**Primary goal (Retention):** User sollen täglich/wöchentlich wiederkommen.  
**Secondary goal (Narrative):** Quiz vermittelt “Law / Meme-Lore / Community-Wissen”.  
**Tertiary goal (Anti-abuse):** Quiz darf nicht als “free reward button” degenerieren.

---

## 2) Optionen (Quiz-Typen) mit Entscheidungskriterien

### Option A — Quiz als Gamification-Event (Status quo)
**Definition:** `quiz_complete` zählt als Aktion, ohne Fragen/Antworten.  
**Pro:** schnell, minimaler Aufwand.  
**Contra:** low engagement, wirkt fake, keine Lern-/Content-Schleife.

**Choose A wenn:**
- du nur einen “Slot” im Action-Board füllen willst
- du gerade andere Features priorisierst (Generator, Mobile Layout)
- du keinen Content/Question-Pool pflegen willst

**Risiko:** Community merkt schnell, dass es kein echtes Quiz ist → Engagement sinkt.

---

### Option B — Quiz als Action-Quiz (MVP-Quiz)
**Definition:** Quiz ist eine Aktion mit echter Frage + Submit, aber minimalem State (Attempts/Cooldown).  
**Pro:** spürbarer “Moment”, relativ wenig Backend, passt in Action-Board.  
**Contra:** ohne History/Pool wirkt es bald repetitiv.

**Choose B wenn:**
- du “echtes Quizgefühl” willst, aber ohne heavy Domain
- du schnell live willst, ohne großen Storage-Overhead

---

### Option C — Echtes Quiz (Domain)
**Definition:** eigenes Quiz-System (Fragenpool, Attempts, Streaks, Difficulty), Gamification konsumiert Ergebnisse.  
**Pro:** beste Retention + Narrative, skalierbar, credible.  
**Contra:** mehr Aufwand + Content-Pflege.

**Choose C wenn:**
- Quiz soll langfristig ein Haupt-Loop sein
- du Content/Fragen pflegen kannst (initial 30–100 reicht)
- du Anti-abuse ernst nimmst

---

## 3) Empfehlung für Horny (Roadmap-Entscheidung)

### Jetzt (Phase 1): **Option B (Action-Quiz MVP)**
Begründung:
- Ihr habt bereits “Quiz als Aktion” im System (Badges/Types).
- Ihr wollt vor Fertigstellung von Quiz+Generator zuerst Mobile-first UX fixen.
- Option B liefert sofort realen Engagement-Wert, ohne euch in Domain-Komplexität zu verstricken.

### Später (Phase 2): Upgrade auf **Option C** (Domain)
Wenn Generator stabil + UI sauber, wird Quiz zum nachhaltigen Loop (Streaks, Pools, Difficulty).

---

## 4) Phase 1 Spec — Action-Quiz MVP (Recommended)

### 4.1 UX / Pages
- Quiz erscheint als Karte in `/actions`
  - Titel: “Daily Quiz”
  - State: available | cooldown | locked
  - CTA: “Start quiz”
- Quiz läuft als:
  - **Modal** über `/actions` ODER eigene Page `/quiz`
- Flow:
  1) Start → fetch next question
  2) Answer → submit
  3) Result screen (correct/incorrect)
  4) Cooldown / next availability

### 4.2 API (minimal, stable contract)
**GET /api/quiz/next**
Response:
```json
{
  "status": "ok",
  "quiz": {
    "questionId": "q_001",
    "prompt": "What does Horny reward?",
    "choices": [
      {"id":"a","text":"Possession"},
      {"id":"b","text":"Participation"},
      {"id":"c","text":"Silence"},
      {"id":"d","text":"Centralization"}
    ],
    "expiresAt": "2026-01-12T23:59:59.000Z"
  },
  "limits": {
    "attemptsLeft": 1,
    "cooldownEndsAt": null,
    "dailyCapLeft": 1
  }
}
```
