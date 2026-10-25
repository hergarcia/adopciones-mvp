# Stage: Spec

Turn a ready story of the `feature` lane into a hardened spec, a plan and a task list, committed
on the story branch. Nothing is implemented here. The `chico` lane has no Spec stage: its build
works from the story's criteria (`build.md` §Carril chico).

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
   If the story carries a `## Decisiones del enjambre` section, each `**Decisión (fecha,
   agente):**` or `**Decisión (fecha, enjambre):**` in it goes, word for word, into the doc of
   its topic (`docs/03` for scope and product rules, `docs/10` for design, and so on) in this
   branch, so the decision lands in `main` with the code that follows it. One the doc already
   carries is not copied twice.
   The spec is the **what**: no tables, RLS, endpoints, components, HTTP codes, libraries or
   paths (constitution §I). Product-level privacy rules stay. **Exception, milestone
   `M0 - Base`:** those stories are about the tooling itself, so commands, tools, config files
   and paths are their what; the spec still needs bounded scope, observable criteria and no
   product feature smuggled in.
3. **One adversarial pass.** Save the story body under the feature dir as `story.md`, then spawn
   one read-only `spec-adversary` (`subagent_type: spec-adversary`) with only file paths
   (`story.md`, `spec.md`, `.specify/memory/constitution.md`, `docs/03-mvp-features.md`,
   `docs/06-i18n.md`, `docs/01-idea.md`) and the story's milestone title. Fix every CRITICAL and
   HIGH finding in `spec.md` (a genuine fork: decision mode, written into the spec); drop the
   rest unless the fix is one line. Something outside the story's scope goes to the Ship stage
   under `outOfScope`. One pass: the reviewers at the end read the code, which is what ships
   (docs/09, decisión 2026-10-25).
4. **`/speckit-plan`.** Before it: if the story touches UI, load the skill
   `frontend-design:frontend-design` and read `docs/10-design-system.md`; the plan must carry a
   **«Diseño» section** (ASCII wireframe per new screen, components reused and created from the
   design system table, tokens used, the one element allowed to draw attention, the three
   states of every data block). If it touches the database, load
   `supabase:supabase-postgres-best-practices` before designing tables, RLS or their tests; if
   it touches auth or sessions, load `supabase:supabase`. A cross-cutting stack change (CSS
   framework, base component library, auth) → **abort**: it is its own PR. A **new dependency** the
   plan adopts is a fork: auto picks the latest stable version and adds the line to
   `docs/07-stack.md` in this branch with today's date; ask mode asks first.
5. **`/speckit-tasks`.** Check that tasks are grouped **by user story in priority order**, each
   group with its test tasks, plus a final polish phase. If not, ask `/speckit-tasks` to
   regroup (pass that as its argument).
6. **`/speckit-analyze`.** Fix every inconsistency it reports in the offending artifact and
   re-run once. This is the unattended substitute for a human reading the plan.
7. **Commit** the feature dir on the branch: `docs(spec): #<n> <slug>`. Do not push.

**Deliberately not used:** `/speckit-clarify` (interactive, stalls an unattended run; its
taxonomy lives in the adversary), `/speckit-checklist`, `/speckit-constitution`,
`/speckit-taskstoissues`. **Dropped on 2026-10-25:** the checklist with `spec-grader` and the
`plan-reviewer` pass. With up to three hardening rounds and two plan rounds they cost more than
the review of the code at the end, which catches the same gaps in what actually ships.

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
