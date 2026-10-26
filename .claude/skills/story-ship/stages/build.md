# Stage: Build

Implement a story with the local gates green. Tests are written alongside the code, never after.
A story of the `chico` lane is built straight from its criteria (§Carril chico). A `feature` is
built from `tasks.md`, one user story at a time, and ends with converge finding nothing left.
Both end with screenshots of every touched route.

## Input

`chico`: the story number. `feature`: branch, feature dir, the ordered user stories. Both: the
decision mode.

## Carril chico

One agent, start to end. No spec, no plan, no `tasks.md`: the story's criteria are the spec.

1. **Branch.** `git checkout main && git pull --ff-only origin main`, then
   `feature/<n>-<slug>` (the story title in ASCII kebab-case, at most four words). If the branch
   exists locally or on the remote, **resume** it. Note `git rev-parse HEAD`: it is the base.
2. **Read** the story with its comments and the code it touches. If it carries
   `## Decisiones del enjambre`, write each decision, word for word, into the doc of its topic
   (`docs/03` for scope and product rules, `docs/10` for design), unless the doc already has it.
3. **Build it.** The rules below apply as in any story. Write a test only where `docs/09` §Qué
   vale la pena testear asks for one; a change of copy or layout usually needs none.
4. **Gates.** `pnpm gates:affected --base <base>`: lint, typecheck, the tests and mutation of what
   changed, and the build with the weight e2e when a screen changed. Fix until green, **at most 3
   attempts**, each one checked with `pnpm gates:affected --base <base> --retry`; then `blocked`
   with the failing output. No `pnpm verify`: CI runs the whole suite on the PR.
5. **Screenshots** of the routes it touched, as in Close step 3.
6. **Commit** in Conventional Commits (English) and report `built` with `branch`.

## Carril feature

Three parts: Baseline, then One user story for each user story in priority order (US1, then
US2, …), then Close. In a session run you do all of them. `ship-batch` gives each user story and
the Close their own fresh agent, so a context does not carry every earlier user story; the
prompt says which part you run.

### Baseline

`git checkout <branch>`, `pnpm install --frozen-lockfile`, `pnpm exec supabase start` when the
plan touches data (`supabase db reset` for a clean database). The baseline is the commit of `main`
the branch starts from, `git merge-base HEAD origin/main`. When CI already judged it,
`gh api "repos/{owner}/{repo}/commits/<that sha>/check-runs?check_name=ci" --jq '[.check_runs[].conclusion] | first'`
prints `success`: the baseline is green and nothing runs again. Otherwise (no run yet, pending,
red, or an error), run `pnpm lint && pnpm typecheck && pnpm test` **before writing anything**: if
the baseline is red, the defect is not this story's; report `blocked` with the failing gate.
**Exception, F00 (`M0 - Base`):** there is no baseline; the story creates the gates and ends
with every command of CLAUDE.md §Comandos existing and `pnpm verify` green.

### One user story

Read `spec.md`, `plan.md` and `tasks.md`, and `git log --oneline main..HEAD`: the user stories
before this one are already committed on the branch; build on them, never redo them. When every
task of this user story is already `[X]` and its commit is on the branch (a resumed run), report
`built` without changing anything. `git checkout <branch>` if you are not on it.

0. Note `git rev-parse HEAD`: it is this user story's base, and its gates judge only what
   changed since it.
1. Implement its tasks from `tasks.md`; mark each `[X]` as it lands. Follow `plan.md`; when
   the code contradicts the plan, the plan changes (edit it and say why in the commit).
2. Write **only** the tests the plan assigned to this user story (the plan applied the
   worth-it rule of `docs/09` §Qué vale la pena testear): Vitest for business rules, schemas,
   calculations with edge cases and domain components whose behaviour depends on domain
   state; **an RLS test for every privacy rule** (a role that must not see a row tries to read
   it against local Supabase); Playwright only for the flow the spec names as critical. No
   test for pages, `ui/`, thin queries or "renders without crashing". Tests sit next to their
   subject (`foo.ts` + `foo.test.ts`) and cite what they cover (`// Covers: US1-AS2`).
3. `pnpm gates:affected --base <this user story's base>`: lint, typecheck, the tests and the
   mutation of what this user story changed, and the build with the e2e it touches (the weight
   budget specs whenever a screen changed). A migration or a config change runs the whole suite on
   its own. Fix until green, **at most 3 attempts per user story**; after each fix,
   `pnpm gates:affected --base <the same base> --retry` runs only what was red, in the scope it
   had, and what the fix changed: a fix to a migration reruns the test that failed, not the whole
   suite again. Then `blocked` with the failing output. The whole suite runs once, in Close;
   running it here is what made one story take 6 h.
4. Commit: `feat(<area>): <user story in one line>` (English, Conventional Commits).

### Close

After the last user story, on the branch with every one of them committed:

1. **Converge.** `/speckit-converge`. If it appends tasks, implement them (same rules) and
   re-run it; **at most 3 rounds**. It must end with "Converged". A task it flags as
   `unrequested` is removed, not kept.
2. **Whole-feature gates.** `pnpm verify` (lint, typecheck, test, mutation, build, e2e and
   lighthouse against `next start`), **once**. Red → fix at the root cause and re-run only the
   stage that failed (`pnpm lighthouse` needs a fresh `pnpm build`; an e2e, `pnpm build` and
   `pnpm e2e <spec>`), then `pnpm gates:affected --base <HEAD before the first fix>` for what the fix
   changed (`--retry` with that base after the next fix); never `pnpm verify` again, CI runs it on
   the PR. At most 3 attempts, then `blocked`.
3. **Screenshots.** `node scripts/walk.mjs --story <slug> <routes this story touched>` for the
   seeded user and for the empty-state user (`stages/../run-app/SKILL.md` has the contract).
   Output goes to `.artifacts/<slug>/`. If the driver does not exist yet (before F00), say so
   in `screenshotsDir: null`; never fake captures.
4. **Bookkeeping in the branch.** A dependency the plan added is already in `docs/07-stack.md`;
   new keys in `messages/es.json` sit under their namespace; `tasks.md` has every task `[X]`.

## Rules that are not optional

- **Skills before writing.** Any text a person reads (a key in `messages/es.json`, an email, a
  page title or description): load `sin-slop` and write it warm, concrete and in voseo, never in
  the voice of a rulebook; a string with one of its patterns is rewritten before the commit. UI
  (any JSX or CSS): load `frontend-design:frontend-design` and
  work with `docs/10-design-system.md` open; `vercel:shadcn` when adding or reshaping a `ui/`
  primitive; `vercel:nextjs` for App Router questions. Database (migrations, RLS, RLS tests):
  load `supabase:supabase-postgres-best-practices`. Auth, sessions, `@supabase/ssr`: load
  `supabase:supabase`. After editing several TSX files, run `vercel:react-best-practices`.
- **A surviving mutant is a missing assertion.** `pnpm mutation` runs Stryker at **100 %** on
  the files this branch touches that have a test. Fix the test so it kills the mutant; never
  lower the threshold; `// Stryker disable next-line <Mutator>: <why>` only for an equivalent
  mutant, with a reason the reviewer can check. A test that passes with the code broken is a
  finding, not coverage.
- **Comments only when necessary.** The code says what; a comment says why, and only when the
  why is not obvious (a non-evident business rule, a workaround with its cause, a decision that
  looks odd). No narrating comments, no restated names, no header blocks telling how the code
  got there; that goes in the commit message. A JSDoc only on a public function whose contract
  the signature does not show.
- **Design tokens only.** Colors, type, spacing, radius, shadows and motion come from
  `globals.css`, which mirrors `docs/10-design-system.md`. A new token is an edit to that doc
  in the same PR, never a loose value; a new component enters its components table.
- Every visible string is a key in `messages/es.json`; `ui/` primitives receive translated
  props. No hexadecimal or raw color in a component; tokens only.
- Every Supabase read lives in `lib/supabase/queries/`; every mutation is a Server Action in
  `actions/` that returns `ActionResult<T>` with an i18n key as error; one zod schema per form
  in `lib/schemas/`, shared by form and action.
- `"use client"` on the smallest leaf. A page composes named components and fetches; it holds
  no visual detail. Extract on the **second use across the whole tree**, not the second use
  in this story.
- Every data component ships loading (skeleton, same shape), empty (`EmptyState` with an
  action) and error.
- **No new dependency** beyond what `plan.md` and `docs/07-stack.md` already record. If one
  turns out to be needed, stop this user story, record the fork (auto: adopt latest stable and
  add the line to `docs/07-stack.md`; ask: ask), then continue.
- Never delete or weaken a test to make code pass; an obsolete test is explained in the commit
  body.
- Do not push. Do not touch `main`.

## Output

```json
{
  "status": "built | blocked",
  "branch": "feature/203-chapitas-colgadas (chico only)",
  "gates": { "lint": true, "typecheck": true, "test": true, "build": true, "e2e": true, "lighthouse": true },
  "userStoriesDone": ["US1", "US2"],
  "screenshotsDir": ".artifacts/publicar-animal",
  "assumptions": ["…"],
  "detail": "what is blocked and the failing output, or one sentence"
}
```
