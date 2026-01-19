# Task Contract Template — $HORNY (Copy/Paste)

> Use this template verbatim at the top of every Cursor Composer / Agent Mode task.

## TASK
One sentence. Must be testable.

## CONTEXT / INPUTS
- Links / PRs / logs (if any):
- Relevant folders/files (initial guess):
  - 

## SCOPE
### In scope
- 

### Out of scope
- 

## CONSTRAINTS
- No new dependencies unless explicitly required.
- No opportunistic refactors.
- Respect client/server boundary (`src/` vs `server/`).
- No destructive commands or deletes unless explicitly instructed.

## ACCEPTANCE CRITERIA
- [ ] Criterion 1 (binary)
- [ ] Criterion 2 (binary)
- [ ] CI: lint + typecheck + tests + build are green (or explicitly stated otherwise).

## PLAN (<= 8 steps)
1. Read and map relevant files; identify current behavior.
2. Propose minimal change set.
3. Implement Step A (1–2 files).
4. Run verification for Step A.
5. Implement Step B (1–2 files).
6. Run verification for Step B.
7. Final pass: ensure no scope creep; ensure outputs are complete.
8. Produce CHANGE CALLOUT + verification summary.

## VERIFICATION (Commands)
> Replace with repo-accurate commands for the affected area.

- Install:
  - `pnpm install`
- Lint:
  - `pnpm lint`
- Typecheck:
  - `pnpm typecheck`
- Tests:
  - `pnpm test`
- Build:
  - `pnpm build`

## OUTPUT REQUIREMENTS
- Use patches/diffs or full-file outputs. No placeholders.
- Include CHANGE CALLOUT in the final response.
