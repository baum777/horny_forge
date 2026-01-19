## Smoke Test Checklist

Run this checklist before and after theme refactors to confirm core flows remain unchanged.

### Auth (X OAuth)
- Sign in with X, confirm callback completes.
- Verify eligibility checks and errors behave as expected.

### Generator Flow
- Create a new item via generator.
- Preview and release actions complete without errors.
- Output assets render correctly.

### Gallery Flow
- Load gallery list.
- Open a gallery detail page.
- Verify pagination and filters if present.

### Limits & Rate Limits
- Confirm rate limiting triggers after threshold.
- Ensure limits reset per configured window.

### Rewards & Quests
- Trigger a reward event and confirm XP accounting.
- Verify quests load from YAML and update status.

