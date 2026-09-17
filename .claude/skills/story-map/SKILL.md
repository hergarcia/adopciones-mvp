---
name: story-map
description: "The backlog on GitHub: render the milestone map, and draft, review or refine feature-sized stories that say the what, never the how. Hands a story to the pipeline only when Hernán marks it `lista`."
argument-hint: "map | new <descripción> | review <#> | refine <#>"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

The first word is the **mode**; empty means `map`.

- `map` — render the backlog by milestone. Read-only.
- `new <descripción>` — draft a story, self-review it, show it, create it on go-ahead.
- `review <#>` — grade an existing story. Read-only.
- `refine <#>` — apply review findings (edit, split) with go-ahead; add `lista` only when
  Hernán says the story is ready.

## Language

This file and the code are English. **Issue titles and bodies are Spanish**, in product language.

## The backbone

- **Milestones** are the release slices, from `docs/09-flujo-de-trabajo.md`: `M0 - Base`,
  `M1 - Cuentas y confianza`, `M2 - Publicación y difusión`, `M3 - Solicitud de adopción`,
  `M4 - Cierre, seguimiento y admin`, `M5 - Beta cerrada`. Titles must match exactly; a typo
  silently drops the milestone.
- **Labels**: `historia` (a story), `lista` (Hernán approved it for a batch), `seguimiento`
  (opened by a run from a finding; never `lista` until reviewed), `decision` (a pending human
  decision, not work).
- The product source of truth is `docs/03-mvp-features.md` (features, the "Fuera del MVP"
  table, the build order) with `docs/01-idea.md` for the why. The story standard and the
  Definition of Ready are in `docs/09-flujo-de-trabajo.md` §Historias; read that section before
  drafting or grading.
- Read the data with `gh`: `gh issue list --label historia --state all --json number,title,state,milestone,labels --limit 100`;
  `gh issue view <#> --json number,title,body,state,labels,milestone,comments` (`comments` is a
  `--json` field; the `--comments` flag is ignored next to `--json`).

## The story standard, in short

- **Feature-sized**: something a person does end to end, told in one sentence, one page of
  issue. Split only when it cannot be tested end to end without the other half, when it spans
  two unrelated sections of `docs/03`, or when it would need more than ~5 prioritized user
  stories. The whole MVP is ~16 stories; `docs/09` holds the draft map.
- **The what, never the how.** Product language (exception: `M0 - Base` stories are about the
  tooling, so they name tools; `new-story.sh` skips the word check for that milestone).
  **Forbidden words** (the body is rejected by
  `scripts/new-story.sh`): tabla, columna, RLS, endpoint, trigger, HTTP codes, Server Action,
  componente, hook, zod, Supabase, Postgres, migración, file paths. Privacy rules are product
  rules ("el contacto se muestra solo cuando la solicitud fue aceptada") and belong in the story.
- **Body structure** exactly as in `docs/09` §Estructura: Historia · Contexto · Alcance
  (Incluye / No incluye) · Reglas de negocio · Criterios de aceptación (Camino feliz · Casos
  borde ≥ 3 · Errores y rechazos) · Pantallas (with the empty state of each) · Datos personales ·
  Medición · Dependencias. A section that does not apply says "no aplica".
- **Criteria** are Given/When/Then from the person's point of view, with observable outcomes
  and numbers where a number exists (5 fotos, 3 solicitudes activas, 30 días). Never "rápido".
- **Definition of Ready**: value stated · scope bounded with "No incluye" · criteria observable ·
  ≥ 3 edge cases and error scenarios · screens with empty states · personal data declared ·
  nothing from "Fuera del MVP" · dependencies closed (referenced issues CLOSED) · feature-sized ·
  no forbidden words · milestone set. `lista` is Hernán's call, not the grader's.

## Mode: `map`

1. Fetch stories. Group by milestone in order M0 → M5; inside, sort by number.
2. Per story: `#num título`, state glyph (`✓` closed · `·` open), and `lista` / `seguimiento`
   when present. Per milestone: `open/total`.
3. End with one health line: a milestone with no stories, open stories without milestone, open
   `seguimiento` issues waiting for review, `decision` issues. No edits.

## Mode: `new <descripción>`

1. Infer the milestone from `docs/03-mvp-features.md` §Orden de construcción. If it is genuinely
   ambiguous, ask once; otherwise pick and say so.
2. Ground the draft: read the section of `docs/03` it comes from, the relevant risk in
   `docs/01`, the glossary in `docs/06-i18n.md` (use its Spanish terms), and the current stories
   (do not overlap an existing one). If the description touches the "Fuera del MVP" table,
   **stop** and say which row; it does not become a story.
3. Draft the full body (Spanish, the structure above). Size it as a feature; if it needs more
   than ~5 user stories to build, split it into stories that are each testable end to end and
   draft them all.
4. **Self-review** with the `review` grading below and fix every gap before showing anything.
5. Show the title and body and get a go-ahead. Then create it with
   `scripts/new-story.sh --milestone "<exact title>" --title "<título>" --body-file <file>`
   (never a bare `gh issue create`: the script rejects forbidden words and reads the milestone
   back). Do **not** add `lista`; that is Hernán's checkpoint. If he says "lista" in the
   go-ahead, add it: `gh issue edit <#> --add-label lista`.
6. Report `#num`, milestone, and whether it carries `lista`.

## Mode: `review <#>`

Fetch the issue with its comments (a later comment can narrow or correct the body; the body
wins unless the comment is explicit and later). Grade, in order:

1. **Size and shape** — feature-sized? one capability, testable end to end? If it is really
   several features → `dividir`. If it is a slice too small to be used on its own → note it; it
   may be fine as a follow-up, not as a batch story.
2. **Structure** — every section present; "No incluye" not empty; screens with empty states;
   personal data declared or "no aplica".
3. **Criteria** — Given/When/Then, observable, numbers where a number exists; **fail with no
   edge-case section (≥ 3) or no error scenarios**. Name each vague criterion.
4. **The how** — any forbidden word or any implementation detail → gap, quote it.
5. **Scope** — anything from "Fuera del MVP" → `obsoleta` for that part; anything already
   delivered on `main` (grep the code, read closed stories) → shrink or `obsoleta`.
6. **Backbone** — milestone exact; dependencies referenced and closed; `seguimiento` stories
   also graded against the follow-up bar (`docs/09` §Umbral): below the bar → `aceptar`.

Output a verdict — `ok` (meets the DoR; ready for Hernán to mark `lista`) · `refinar` ·
`dividir` · `obsoleta` · `aceptar` — plus concrete gaps mapped to the list above. No edits.

## Mode: `refine <#>`

1. Run the `review` grading first.
2. Show the proposed new body (or the split) and get a go-ahead, then apply:
   `gh issue edit <#> --body-file <file>`; milestone with `--milestone`; a split creates the
   children through `new` and closes or rewrites the parent so nothing stays half-scoped;
   `obsoleta` is closed only with the go-ahead, citing what delivered it; `aceptar` proposes the
   `KL-NNN` entry for `docs/known-limitations.md` and closes the issue as not planned with a
   comment citing it, with the go-ahead.
3. When the story meets the DoR **and Hernán says it is ready**, add `lista`
   (`gh issue edit <#> --add-label lista`) and remove `seguimiento` if present. Never add
   `lista` on your own judgement.
4. Report what changed.

## Guardrails

- Never create or edit issues in a repo whose `git config --get remote.origin.url` is not this
  project's remote.
- `map` and `review` never mutate. `new` and `refine` mutate only after a go-ahead in the
  session.
- Never touch labels or milestones you were not asked to; `lista` only on Hernán's word.
