# Stage: Review

Fresh-context reviewers grade the branch; the orchestrator triages; a fixer applies what is in
scope; repeat. The people who wrote the code do not grade it, and findings reach the PR, not a
parent session.

## Input

Branch, feature dir, screenshots dir (may be null), the out-of-scope findings the Spec stage
noted.

## The loop, at most 3 rounds

1. **Review.** Spawn in parallel, read-only, with paths only (repo, branch, feature dir,
   screenshots dir):
   - `code-reviewer` (`subagent_type: code-reviewer`) — correctness, privacy, coverage, scope,
     convergence;
   - `design-reviewer` (`subagent_type: design-reviewer`) — componentization, layers,
     client/server, i18n, tokens, states, visual (from the screenshots), weight. Grades
     against `docs/10-design-system.md` and cites the rule it applies;
   - `hernan-proxy` (`subagent_type: hernan-proxy`), asked for `screens` — whether Hernán would
     approve what the screenshots show (`docs/11-criterio.md`): what the rules do not catch. Only
     when there is a screenshots dir; without screens it has nothing to judge.
   All return the findings JSON described in their agent files. In `ship-batch.js` the schema
   is enforced; in a session run, ask for it verbatim.
2. **Triage** (no model judgement; this is a filter):
   - **actionable** = severity `critical`, `high` or `medium` **and** `inScope: true`;
   - `low` in scope → fix only if trivial and in a file already touched, else drop;
   - `inScope: false` → append to `outOfScope` for the Ship stage (the follow-up bar), never
     fix here.
   No actionable findings → **approved**, exit.
3. **Fix.** For each actionable finding, in severity order:
   - `plausible` → verify first (read the path, run the test); not real → `rejected` with the
     reason, no code change;
   - real → fix at the **root cause** (the shared function once, not per caller); when the
     finding is missing coverage, add the test; never weaken a test;
   - re-run `pnpm lint && pnpm typecheck && pnpm test` after the batch of fixes;
     `pnpm build` if the round touched anything under `app/`.
   Commit: `fix(<area>): <what and why>`.
4. Next round: the reviewers run again on the new state; they may find what the fixes broke.

After 3 rounds, any `critical` or `high` still open → status **draft**: the Ship stage opens a
draft PR that lists them. Do not paper over it.

## Output

```json
{
  "status": "approved | draft",
  "rounds": 2,
  "applied": ["C1", "D3"],
  "rejected": [{ "id": "C2", "reason": "the path is unreachable: … " }],
  "open": [{ "id": "C4", "severity": "high", "summary": "…" }],
  "outOfScope": [{ "id": "D5", "summary": "…", "evidence": "…" }],
  "detail": "one sentence"
}
```
