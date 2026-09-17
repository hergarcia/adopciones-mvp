# Stage: Build

Implement the feature from `tasks.md`, one user story at a time, with the local gates green
after each. Tests are written alongside the code, never after. Ends with converge finding
nothing left and screenshots of every touched route.

## Input

Branch, feature dir, the ordered user stories, the decision mode.

## Steps

0. **Baseline.** `git checkout <branch>`, `pnpm install --frozen-lockfile`, `supabase start`
   when the plan touches data (`supabase db reset` for a clean database). Run
   `pnpm lint && pnpm typecheck && pnpm test` **before writing anything**: if the baseline is
   red, the defect is not this story's; report `blocked` with the failing gate.
   **Exception, F00 (`M0 - Base`):** there is no baseline; the story creates the gates and ends
   with every command of CLAUDE.md §Comandos existing and `pnpm verify` green.
1. **Per user story, in priority order** (US1, then US2, …):
   1. Implement its tasks from `tasks.md`; mark each `[X]` as it lands. Follow `plan.md`; when
      the code contradicts the plan, the plan changes (edit it and say why in the commit).
   2. Write **only** the tests the plan assigned to this user story (the plan applied the
      worth-it rule of `docs/09` §Qué vale la pena testear): Vitest for business rules, schemas,
      calculations with edge cases and domain components whose behaviour depends on domain
      state; **an RLS test for every privacy rule** (a role that must not see a row tries to read
      it against local Supabase); Playwright only for the flow the spec names as critical. No
      test for pages, `ui/`, thin queries or "renders without crashing". Tests sit next to their
      subject (`foo.ts` + `foo.test.ts`) and cite what they cover (`// Covers: US1-AS2`).
   3. `pnpm lint && pnpm typecheck && pnpm test && pnpm mutation`. Fix until green, **at most 3
      attempts per user story**; then `blocked` with the failing output.
   4. Commit: `feat(<area>): <user story in one line>` (English, Conventional Commits).
2. **Converge.** `/speckit-converge`. If it appends tasks, implement them (same rules) and
   re-run it; **at most 3 rounds**. It must end with "Converged". A task it flags as
   `unrequested` is removed, not kept.
3. **Whole-feature gates.** `pnpm verify` (lint, typecheck, test, mutation, build, e2e and
   lighthouse against `next start`). Red → fix at the root cause, at most 3 attempts, then `blocked`.
4. **Screenshots.** `node scripts/walk.mjs --story <slug> <routes this story touched>` for the
   seeded user and for the empty-state user (`stages/../run-app/SKILL.md` has the contract).
   Output goes to `.artifacts/<slug>/`. If the driver does not exist yet (before F00), say so
   in `screenshotsDir: null`; never fake captures.
5. **Bookkeeping in the branch.** A dependency the plan added is already in `docs/07-stack.md`;
   new keys in `messages/es.json` sit under their namespace; `tasks.md` has every task `[X]`.

## Rules that are not optional

- **Skills before writing.** UI (any JSX or CSS): load `frontend-design:frontend-design` and
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
- Nothing from "Fuera del MVP". Never delete or weaken a test to make code pass; an obsolete
  test is explained in the commit body.
- Do not push. Do not touch `main`.

## Output

```json
{
  "status": "built | blocked",
  "gates": { "lint": true, "typecheck": true, "test": true, "build": true, "e2e": true, "lighthouse": true },
  "userStoriesDone": ["US1", "US2"],
  "screenshotsDir": ".artifacts/publicar-animal",
  "assumptions": ["…"],
  "detail": "what is blocked and the failing output, or one sentence"
}
```
