# Stage: Ship

Turn an approved branch into a PR with `pnpm verify` and CI green, with every
out-of-scope finding classified. Stops at the PR. **Never merges.**

## Input

Branch, story number, the Review output (`status`, `open`, `applied`, `rejected`,
`outOfScope`), the assumptions collected by every stage.

## Steps

1. **The follow-up bar** (`docs/09-flujo-de-trabajo.md` §Umbral), for each `outOfScope`
   finding, in this order:
   1. **Fold it in** when it is cheap and touches code this branch already changes; do it now
      and re-run the gates.
   2. **Accept it** when it does not clear the bar: add a `KL-NNN` entry to
      `docs/known-limitations.md` in this branch (área, qué, por qué se acepta, detección, se
      reabre cuando, origen), in Spanish.
   3. **Open one follow-up**, the most severe of those that clear the bar, with
      `scripts/new-story.sh --milestone "<exact title>" --label "historia,seguimiento"
      --title "<título en español>" --body-file <file>`: the body in the story structure as
      far as the run knows it, plus a line "Por qué pasa el umbral: …". Never `lista`.
   4. Every other finding above the bar goes to the PR body under **«Sobre el umbral, sin
      abrir»** with its evidence. Hernán decides.
2. **Commit** anything from step 1 (`docs(known-limitations): …`, `fix(…)`).
3. **The full local gate:** `pnpm verify` (lint, typecheck, test, mutation, build, e2e,
   lighthouse against `next start`). Red → fix at the root cause; **at most 2 passes, shared with step 5**; still red
   → the PR opens as draft. Then **push:** `git push -u origin <branch>`.
4. **PR** with `gh pr create --base main --title "<título en español>" --body-file <file>`,
   filling `.github/pull_request_template.md` in Spanish: `Closes #<n>`; qué cambia en dos
   frases; los supuestos tomados; los hallazgos fuera de alcance y adónde fue cada uno
   (plegado / aceptado KL-NNN / seguimiento #m / sobre el umbral, sin abrir); el checklist
   marcado solo con lo que es cierto; capturas: `.artifacts/<slug>/` (sin Vercel hasta el MVP).
   If the Review status is **draft**: `gh pr create --draft` with a section **«Qué falla»**
   listing the open findings and the last failing output, then **stop** and report
   `draft-pr`.
5. **Watch CI:** `gh pr checks <#> --watch` (cap 25 minutes with `timeout`). The required check is
   `ci`, which runs the same `pnpm verify`. Red → read the log (`gh run view <id> --log-failed`),
   fix at the root cause, re-run `pnpm verify`, push. **At most 2 fix passes** (shared with step
   3). Still red → `gh pr ready --undo` (draft) and report `draft-pr` with the failing step.
6. **Stop** on green. Report the PR URL, the check results, the assumptions and where each
   out-of-scope finding went. Do not merge.

## Output

```json
{
  "status": "green-pr | draft-pr | aborted",
  "pr": "https://github.com/…/pull/34",
  "branch": "feature/12-publicar-animal",
  "checks": { "verify": "green", "ci": "green" },
  "assumptions": ["…"],
  "followUps": {
    "folded": ["…"],
    "accepted": ["KL-004"],
    "opened": "#41",
    "aboveBar": ["…"]
  },
  "detail": "what still fails if draft, or one sentence"
}
```
