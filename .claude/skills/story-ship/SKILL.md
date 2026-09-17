---
name: story-ship
description: "Runs one feature story through the whole pipeline in this session — ready gate, spec-kit with hardening and plan review, build user story by user story, fresh-context review loop, PR with green CI — and stops at the PR. The batch workflow (.claude/workflows/ship-batch.js) runs the same stages with one fresh agent each and merges in between."
argument-hint: "<#story> [--ask]"
user-invocable: true
disable-model-invocation: true
---

## User Input

```text
$ARGUMENTS
```

- A story number (`12` or `#12`) is required. Without it, ask once and stop.
- `--ask` selects **ask mode**; absent, **auto mode**.

## Contract

- The stages live in `stages/` next to this file, one per stage, and are the **single source
  of truth**: this skill executes them in the session; `ship-batch.js` hands each to a fresh
  agent. Do not restate a stage here; read it and follow it.
- **Auto mode** runs to a PR without stopping to ask. At a *genuine fork* (a real functional
  ambiguity, the shape of the data model with two reasonable options, a new dependency, a
  visual direction) it makes the most reasonable informed guess and records it as an assumption
  for the PR body. **Ask mode** pauses at those forks only, asks one concise question with
  `AskUserQuestion` (recommended option first), and continues. Mechanical choices (naming, file
  layout, reusing a helper) are decided without asking in both modes.
- **Hard stops are not questions**, in both modes: a story without `lista`, a failed Definition
  of Ready, a story whose scope is already on `main`, anything from the "Fuera del MVP" table,
  a cross-cutting stack change. Report and stop.
- **Never merges. Never force-pushes. Never `--no-verify`.** The hook `guard-git.mjs` blocks
  these anyway. It stops at the PR; the batch merges, or Hernán does.
- A denied permission or a hard external failure (GitHub down, Supabase local not starting)
  stops the run with a report; nothing is retried in a loop.
- Code, tests and commits in English (Conventional Commits). Issue and PR text in Spanish.

## Run

Execute, in order, waiting for each to finish:

1. `stages/ready.md` — abort if it says so.
2. `stages/spec.md` — branch, spec hardened by `spec-grader` + `spec-adversary`, plan reviewed
   by `plan-reviewer`, tasks, analyze, commit.
3. `stages/build.md` — user story by user story with local gates, converge, screenshots.
4. `stages/review.md` — spawn `code-reviewer` and `design-reviewer` with the Agent tool
   (`subagent_type`), triage their JSON, fix, repeat up to three rounds.
5. `stages/ship.md` — classify out-of-scope findings with the follow-up bar, `pnpm verify`,
   push, PR, watch CI, fix at most twice, stop.

Then report:

- Story `#N` → PR (URL), branch, mode used.
- Rounds used: hardening, plan review, build attempts, review, CI.
- `pnpm verify` and CI: green, red, or draft with what fails.
- Assumptions taken (auto) or answers given (ask), for Hernán to validate in the local build.
- Out-of-scope findings and where each went: folded, accepted (`KL-NNN`), the one follow-up,
  or listed above the bar without opening.
- Next step: "PR listo para mergear; el batch lo hace solo, o `gh pr merge --squash`".
