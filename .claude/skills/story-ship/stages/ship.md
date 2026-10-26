# Stage: Ship

Turn an approved branch into a PR with CI green. Stops at the PR. **Never merges.**

## Input

Branch, story number, lane, the Review output (`status`, `open`, `applied`, `rejected`,
`outOfScope`), the assumptions collected by every stage.

## Steps

0. **Up to date with `main`.** `git fetch origin && git merge origin/main` on the branch: a merge,
   never a rebase, so nothing needs a force push. Another story may have merged since this branch
   started, and the gates below must judge the code as it will land. Any conflict: resolve it keeping what both sides meant, and let the gates judge.
   Commit the merge (`chore: merge main into <branch>`).
1. **Out of scope.** Nothing is opened or accepted for what the reviewers found outside the
   story: no follow-up, no known limitation (docs/09, decisión 2026-10-25). The PR lists each one
   under **«Fuera de alcance»** with its evidence, and Producto reads those lists when it looks
   for the next story. A finding that is cheap and touches code this branch already changes may be
   folded in now; re-run the gates after it.
2. **Commit** anything folded in (`fix(…)`).
3. **The local gate:** `pnpm gates:affected` (against `origin/main`: what the branch changes,
   with `main` merged in). A feature already ran `pnpm verify` in its Close, a small change never
   does, and CI runs it on the PR either way, so it does not run here. Red → fix at the root cause
   and check it with `pnpm gates:affected --retry`; **at most 2 passes, shared with step 5**;
   still red → the PR opens as draft. Then **push:** `git push -u origin <branch>`.
4. **PR** with `gh pr create --base main --title "<título en español>" --body-file <file>`,
   filling `.github/pull_request_template.md` in Spanish: `Closes #<n>`; qué cambia en dos
   frases; los supuestos tomados; «Fuera de alcance», con lo que se plegó y lo que queda; el checklist
   marcado solo con lo que es cierto; capturas: `.artifacts/<slug>/` (sin Vercel hasta el MVP).
   If an open PR from this branch already exists (the Director is retaking a draft), do not open
   a second one: rewrite its body with `gh pr edit <#> --body-file <file>`, and `gh pr ready <#>`
   once this run's Review status is approved.
   If the Review status is **draft**: `gh pr create --draft` (or, for an existing PR,
   `gh pr ready <#> --undo`) with a section **«Qué falla»** listing the open findings and the
   last failing output, then **stop** and report `draft-pr`.
5. **Watch CI:** `gh pr checks <#> --watch` (cap 25 minutes with `timeout`). The required check is
   `ci`, which joins the jobs that run the stages of `pnpm verify`. Red → read the log (`gh run
   view <id> --log-failed`; in a cloud session the log is not reachable and it names the failing
   job and step instead), reproduce **that step alone** locally, fix at the root cause, run that
   step again and `pnpm gates:affected --base <HEAD before the fix>`, push. Never the whole
   `pnpm verify`: CI runs it again on the push. **At most 2 fix passes** (shared with step 3). Still red → `gh pr ready --undo` (draft) and report `draft-pr` with the failing step.
6. **Stop** on green. Report the PR URL, the check results, the assumptions and the out-of-scope
   list. Do not merge.

## Output

```json
{
  "status": "green-pr | draft-pr | aborted",
  "pr": "https://github.com/…/pull/34",
  "branch": "feature/12-publicar-animal",
  "checks": { "verify": "green", "ci": "green" },
  "assumptions": ["…"],
  "outOfScope": ["what the PR lists under «Fuera de alcance»"],
  "detail": "what still fails if draft, or one sentence"
}
```
