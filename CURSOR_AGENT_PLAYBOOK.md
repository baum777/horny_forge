# Cursor Agent Playbook — $HORNY (Multi-Model, Step-by-Step)

This playbook defines a predictable workflow for Cursor Composer / Agent Mode using multiple models.

---

## 1) Model Roles (do not mix)

### Planner / Architect (Claude 4.5)
Use for:
- shaping the Task Contract
- risk analysis
- architecture boundary checks
- defining acceptance criteria and verification

Rules:
- no code changes
- no dependency decisions
- no "nice to have" expansion

### Implementer (Codex 5.1 / 5.2)
Use for:
- patch-based edits
- wiring changes
- test fixes
- minimal diffs

Rules:
- follow plan exactly
- no refactors outside the plan
- no new deps unless explicitly required
- always prefer patches; never hide code

### Verifier / Reviewer (GPT-5.2)
Use for:
- reviewing diffs
- predicting CI failures
- checking edge cases
- ensuring the SHOUT rule is satisfied

Rules:
- no new features
- no style drive-bys
- focus on correctness and completeness

### Analyzer / Extractor (Gemini 3)
Use for:
- scanning large docs / logs
- summarizing the current state
- extracting invariants / patterns

Rules:
- analysis only, no edits

---

## 2) Standard Operating Procedure (SOP)

### Step 0 — Initialize the Task Contract
**Owner:** Planner (Claude 4.5)
1. Fill the Task Contract template.
2. List target files and commands.
3. Identify risks and boundary constraints.
4. Freeze the plan.

Deliverable:
- A completed Task Contract with acceptance criteria and verification commands.

---

### Step 1 — Read & Map (no code)
**Owner:** Analyzer (Gemini 3) or Planner (Claude 4.5)
1. Read relevant files.
2. Summarize current behavior in 5–10 bullets.
3. Identify the smallest change that satisfies acceptance criteria.
4. Note any tests that should fail or should be added.

Deliverable:
- "Current behavior" summary + minimal change proposal.

---

### Step 2 — Implement in micro-steps
**Owner:** Implementer (Codex 5.1/5.2)
For each micro-step:
1. Edit 1–2 files only.
2. Prefer patch edits.
3. Keep diffs minimal.
4. Add/adjust tests only as needed.

Deliverable:
- Patch (or full-file) edits per step.

---

### Step 3 — Verify early and often
**Owner:** Implementer (Codex) + Verifier (GPT-5.2)
After each micro-step:
- run the smallest relevant check first (unit test / typecheck)
- then run the broader gates (lint/tests/build) depending on scope

Deliverable:
- command list + results (pass/fail) with actionable next step.

---

### Step 4 — Diff Review & Risk pass
**Owner:** Verifier (GPT-5.2)
1. Confirm acceptance criteria are met.
2. Confirm no scope creep.
3. Confirm boundaries were respected (src vs server).
4. Confirm no placeholders or hidden code.
5. Confirm changes are explainable.

Deliverable:
- Short review: "meets criteria" / "missing items" + exact fixes.

---

### Step 5 — Final response format (mandatory)
**Owner:** Any (but must follow constitution)
Include:
1. **What changed** (files)
2. **CHANGE CALLOUT** (before/after/why/risk)
3. **Verification** (commands run + outcomes)
4. **Notes** (known limitations, intentionally deferred work)

---

## 3) Guardrails for common repo tasks

### A) Prompt / Composer / Guardrails logic
- Treat prompts as code: version them, keep deterministic structure.
- Fallback paths must be explicit and testable.
- Telemetry must be deduped and low-noise.

### B) UI/UX tasks
- UI changes must be tied to acceptance criteria.
- Do not introduce animation or styling changes unless requested.
- Prefer stable selectors; add `data-testid` when needed.

### C) CI and TypeScript hygiene
- Typecheck must cover app code (avoid config drift).
- Avoid `any`; prefer narrow types or `unknown` with parsing.

---

## 4) Escalation rules (when to stop)
Stop and report (do not guess) if:
- requirements conflict
- implementation requires destructive actions
- adding a dependency seems necessary but is not requested
- architecture boundary would be violated

---

## 5) Recommended Cursor workflow (practical)
- Use Composer with the Task Contract pasted at the top.
- Pin model roles per phase.
- Use checkpoints/commits between micro-steps.
- Run verification commands before concluding.
