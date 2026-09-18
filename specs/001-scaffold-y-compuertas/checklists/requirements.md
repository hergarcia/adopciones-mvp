# Requirements Quality Checklist: Scaffold y compuertas

**Purpose**: Validate specification completeness and quality before planning
**Created**: 2026-09-17
**Feature**: [spec.md](../spec.md) · story #1 · milestone `M0 - Base`

**Review Ownership**: reviewer-owned requirements-quality artifact. `[x]` means the criterion was
reviewed and is satisfied **for requirements quality** — not that implementation is done.

**Focus of this checklist** (as requested by the Spec stage): scenario coverage per user story;
the empty, loading and error state of every screen; who sees each piece of personal data and when;
edge cases and limits; errors and what the person can do; no implementation details.

**Milestone exception**: story #1 belongs to `M0 - Base`. Per `docs/09-flujo-de-trabajo.md`
§Estructura, naming commands, tools, config files and paths **is the what** for these stories, so
the "no implementation details" items below are graded as: *does the spec decide mechanisms and
code shape that belong in `plan.md`?* — not as *does it name a tool?*

**Merge note**: this file carries both the built-in spec-quality items (`/speckit-specify` step 8a)
and the focused requirements-quality items, because the Spec stage grades a single checklist here.

## Content Quality

- [x] CHK001 No decisions that belong in `plan.md` leak into the spec (mechanism per check, file
      structure, API choices), beyond the `M0 - Base` exception for naming tools and commands
- [x] CHK002 Focused on the value delivered to whoever builds the platform, not on how it is wired
- [x] CHK003 Readable by Hernán without opening the code
- [x] CHK004 Every mandatory section of the template is filled, none left as a placeholder
- [x] CHK005 The spec states which milestone exception it invokes, and why it applies

## Requirement Completeness

- [x] CHK006 No `[NEEDS CLARIFICATION]` marker remains anywhere in the spec
- [x] CHK007 Every functional requirement is testable and unambiguous, with no "rápido", "fácil",
      "simple" or "moderno"
- [x] CHK008 Every success criterion carries a number or an observable outcome
- [x] CHK009 Scope is bounded: the spec says what does **not** enter, matching the story's
      "No incluye", and names the dependencies that stay out
- [x] CHK010 Assumptions are listed, each one contestable, with Hernán's four `ask`-mode decisions
      of 2026-09-18 marked as decided and dated (F00 entera · lefthook · lint con tipos · Stryker
      sin verificador y la regla cerrada)
- [x] CHK011 Nothing from the "Fuera del MVP" table of `docs/03-mvp-features.md` appears

## Scenario Coverage Per User Story

- [x] CHK012 Every user story has a stated priority, a reason for it, and an independent test
- [x] CHK013 Every user story has acceptance scenarios in Given/When/Then from the point of view of
      whoever runs the command
- [x] CHK014 Every acceptance criterion of the story body maps to at least one scenario in the spec;
      none was dropped in translation
- [x] CHK015 The user story order is a real build order: each one only needs what the previous ones
      delivered
- [x] CHK016 Each of the 17 rows of `docs/09` §Compuertas mecánicas is covered by a requirement
- [x] CHK017 Each of the 12 commands of `CLAUDE.md` §Comandos is named in a requirement
- [x] CHK018 Each of the 11 `ui/` primitives of `docs/10` §Componentes is named, with its variants
      and states required

## Screen States

- [x] CHK019 Every screen the story introduces is listed, with what it shows
- [x] CHK020 For every screen, the spec says whether it loads data, and therefore whether loading,
      empty and error states apply — and when they do not, it says why, rather than omitting them
- [x] CHK021 The `Skeleton` and `EmptyState` primitives are required to exist with their states
      even though no screen in this story consumes real data
- [x] CHK022 The behaviour of the dev-only showcase in a production build is specified
- [x] CHK023 Reduced-motion behaviour is specified for every moving element the story introduces

## Personal Data

- [x] CHK024 The spec states that no personal data is stored, and justifies it rather than only
      writing "no aplica"
- [x] CHK025 The privacy harness's synthetic people are required to be deleted after each test
- [x] CHK026 Artifacts that could carry data (captures, reports) are required to stay out of git
- [x] CHK027 The spec requires the local database to end with no product tables of its own

## Edge Cases and Limits

- [x] CHK028 A stage with nothing to verify yet (`pnpm mutation` with no tested files, `pnpm e2e`
      with no critical flows) has a specified outcome, and it is not a silent skip
- [x] CHK029 The non-empty destination directory case is specified, including what happens to files
      the generator adds on its own
- [x] CHK030 The missing-local-database case is specified separately for the machine and for CI
- [x] CHK031 The surviving-mutant and the equivalent-mutant cases are both specified
- [x] CHK032 The "a rule was switched off by a config change" case is specified, and the spec says
      where that is caught
- [x] CHK033 The version-conflict case (a tool that does not support another's latest) is specified,
      including who decides
- [x] CHK034 Cross-platform behaviour (Windows 11 / PowerShell 7 vs the Linux runner) is required,
      not assumed
- [x] CHK035 Numeric limits are stated where one exists: 150 lines, 100 %, 390 × 844, 1280 × 800,
      100–250 ms, 2 px, 44 px, 150 KB, 2 s, 90

## Errors and What the Person Can Do

- [x] CHK036 Every failure mode says what the output names, so the person knows which gate failed
- [x] CHK037 The driver's exit codes are specified and distinguish "stack is not up" from "the page
      had an error"
- [x] CHK038 The missing environment variable case says the message names the variable **and** how
      to obtain it
- [x] CHK039 The blocked-commit case says the person sees what failed
- [x] CHK040 The `--user` flag before login exists says it fails loudly rather than degrading

## Feature Readiness

- [x] CHK041 Every functional requirement traces to at least one success criterion or acceptance
      scenario
- [x] CHK042 The spec makes it decidable whether the feature is done, without reading the plan
- [x] CHK043 What this story records for the next one (docs/07 lines, README versions,
      run-app §Verified, CLAUDE.md §Estado) is required, not left implicit
- [x] CHK044 The manual step that stays with Hernán (installing the Renovate app) is named

## Notes

- Items are ticked by the Spec stage only when the grader's evidence shows they pass.
- An item that cannot be satisfied without deciding a mechanism belongs in `plan.md`, not here.
