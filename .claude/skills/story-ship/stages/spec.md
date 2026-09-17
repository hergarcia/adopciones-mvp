# Stage: Spec

Turn a ready story into a hardened spec, a reviewed plan and a task list, committed on the
story branch. Nothing is implemented here.

## Input

The story number, the Ready output (`alreadyDelivered`, `assumptions`), the decision mode.

## Steps

1. **Branch.** `git checkout main && git pull --ff-only origin main`. Branch name:
   `feature/<n>-<slug>` where the slug is the story title in ASCII kebab-case, at most four
   words. If the branch already exists locally or on the remote, **resume** it (check it out,
   read what `specs/` already holds) instead of creating a second one.
2. **`/speckit-specify`** with the story body as the feature description, verbatim, plus one
   line: "Already on main: …" from `alreadyDelivered`, so the spec narrows the scope and says
   so in Assumptions. Spec-kit's `[NEEDS CLARIFICATION]` markers: in **auto** mode resolve
   each with the most reasonable informed guess and record it in the spec's Assumptions; in
   **ask** mode ask them together in one `AskUserQuestion`. Never leave a marker.
   The spec is the **what**: no tables, RLS, endpoints, components, HTTP codes, libraries or
   paths (constitution §I). Product-level privacy rules stay.
3. **`/speckit-checklist`** once, with an explicit focus so it does not stop to ask: "scenario
   coverage per user story; the empty, loading and error state of every screen; who sees each
   piece of personal data and when; edge cases and limits; errors and what the person can do;
   no implementation details". It writes `checklists/requirements.md`.
4. **Hardening loop, at most 3 rounds.** Spawn, in parallel, two read-only subagents that
   receive only file paths (story body saved under the feature dir as `story.md`, `spec.md`,
   the checklist, `.specify/memory/constitution.md`, `docs/03-mvp-features.md`,
   `docs/06-i18n.md`, `docs/01-idea.md`) and none of this conversation:
   - `spec-grader` (Agent tool, `subagent_type: spec-grader`) → PASS/FAIL per checklist item;
   - `spec-adversary` (`subagent_type: spec-adversary`) → CRITICAL/HIGH/MEDIUM/LOW findings.
   Triage every FAIL and finding: **fixable** (vague wording, a missing state, an implied edge
   case, a how-leak) → fix `spec.md`; **genuine fork** → decision mode, write the resolution
   into the spec; **outside the story's scope** → the follow-up bar (`docs/09` §Umbral): fold if
   cheap, else note it for the Ship stage under `outOfScope`; **"Fuera del MVP"** → **abort**.
   Tick the checklist items that now pass. Exit when both return nothing CRITICAL or HIGH. At
   the cap, record what is still open as assumptions and continue.
5. **`/speckit-plan`.** Before it: if the story touches UI, load the skill
   `frontend-design:frontend-design` and read `docs/10-design-system.md`; the plan must carry a
   **«Diseño» section** (ASCII wireframe per new screen, components reused and created from the
   design system table, tokens used, the one element allowed to draw attention, the three
   states of every data block). If it touches the database, load
   `supabase:supabase-postgres-best-practices` before designing tables, RLS or their tests; if
   it touches auth or sessions, load `supabase:supabase`. Then spawn `plan-reviewer`
   (`subagent_type: plan-reviewer`) with the feature dir, `spec.md`, `docs/07-stack.md`,
   `docs/08-convenciones-codigo.md`, `docs/10-design-system.md`, `docs/06-i18n.md` and the
   constitution. CRITICAL: a cross-cutting stack change or anything
   "Fuera del MVP" → **abort**; any other CRITICAL and every HIGH → fix the plan and re-run the
   reviewer (at most 2 rounds); MEDIUM → fix or record as assumption. A **new dependency** the
   plan adopts is a fork: auto picks the latest stable version and adds the line to
   `docs/07-stack.md` in this branch with today's date; ask mode asks first.
6. **`/speckit-tasks`.** Check that tasks are grouped **by user story in priority order**, each
   group with its test tasks, plus a final polish phase. If not, ask `/speckit-tasks` to
   regroup (pass that as its argument).
7. **`/speckit-analyze`.** Fix every inconsistency it reports in the offending artifact and
   re-run once. This is the unattended substitute for a human reading the plan.
8. **Commit** the feature dir on the branch: `docs(spec): #<n> <slug>`. Do not push.

**Deliberately not used:** `/speckit-clarify` (interactive, stalls an unattended run; its
taxonomy lives in the adversary), `/speckit-constitution`, `/speckit-taskstoissues`.

## Output

```json
{
  "status": "ready | abort",
  "branch": "feature/12-publicar-animal",
  "featureDir": "specs/003-publicar-animal",
  "userStories": [{ "id": "US1", "title": "…", "priority": "P1" }],
  "assumptions": ["…"],
  "outOfScope": ["findings noted for the Ship stage, with their evidence"],
  "detail": "one sentence"
}
```
