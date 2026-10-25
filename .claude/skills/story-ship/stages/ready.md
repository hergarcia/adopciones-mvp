# Stage: Ready

Decide whether a story can be built unattended. Read-only: this stage never edits the issue,
the tree or the branches. The checkout is on a fresh `main`; do not switch branches or pull.

## Input

The story number. Decision mode (`auto` | `ask`) for how to phrase the report; it changes no
verdict here.

## Steps

1. **Resolve the story.**
   `gh issue view <#> --json number,title,body,state,labels,milestone,comments`
   (`comments` is a `--json` field; the `--comments` flag is ignored next to `--json`).
   Require: state `OPEN`, label `historia`, **label `lista`** (put by `product-owner` once `hernan-proxy`
   approves, or by Hernán; without it, abort with "sin etiqueta lista"), a milestone. Read the comments: a comment later than the
   body's last edit that explicitly corrects it wins; record that as an assumption.
2. **Lane** (`docs/09` §Dos carriles). `feature` when the story changes what the site stores
   (something new is saved, a new state), who can see what (privacy, visibility, contact),
   sign-in or accounts, a task that runs on its own, or adds a flow of several new screens.
   Anything else is `chico`: copy, a visual fix, a bug, one screen reshaped with what the site
   already has. When unsure, grep `main` for what the story needs: no new data, no new rule →
   `chico`.
3. **Definition of Ready** (`docs/09-flujo-de-trabajo.md` §Historias), for its lane. Grade the body:
   - **chico:** Historia, Alcance with "No incluye", and 3 to 5 criteria Given/When/Then with at
     least one edge case. Pantallas when it shows something. The other sections may be absent;
   - **feature:** every section present (Historia, Contexto, Alcance with "No incluye", Reglas de
     negocio, Criterios with Camino feliz / Casos borde ≥ 3 / Errores y rechazos, Pantallas with
     their empty state, Datos personales, Medición, Dependencias);
   - criteria are Given/When/Then from the person's point of view, with numbers where a number
     exists, no "rápido" / "fácil";
   - **no forbidden words**: `tabla`, `columna`, `RLS`, `endpoint`, `trigger`, an HTTP status
     code, `Server Action`, `componente`, `hook`, `zod`, `Supabase`, `Postgres`, `migración`,
     a file path. Quote each one found;
   - **exception, milestone `M0 - Base`:** its stories are about the tooling, so the
     forbidden-word rule does not apply; they still need bounded scope, observable criteria
     ("`pnpm verify` is green on an empty project") and no product feature smuggled in;
   - feature-sized: one capability end to end, not several, not a slice that cannot be used
     alone.
   Any gap → `abort` with the list. Autonomy on a vague story ships the wrong thing.
4. **Against current `main`.** Grep the code and read the closed stories of the same milestone
   (`gh issue list --state closed --label historia --milestone "<title>" --json number,title`)
   for what this story asks. Part already delivered → list it under `alreadyDelivered` (the
   spec stage narrows the scope and records it). The whole scope delivered → `abort` naming the
   story or PR that did it. Never close the issue yourself.
5. **Dependencies.** Every `#n` under Dependencias must be `CLOSED`
   (`gh issue view n --json state`). An open one → `abort`.
6. **Environment.** `git status --short` is empty, `git config --get remote.origin.url` is this
   project's remote, `pnpm install --frozen-lockfile` succeeds. Otherwise `abort` with the
   detail; do not clean anything up.
   **Exception, milestone `M0 - Base`:** the project may not exist yet. With no `package.json`
   at the root, skip the install check and record it in `assumptions`; never run `pnpm install`
   there, because pnpm writes a default `package.json` and leaves the tree dirty.

## Output

Raw JSON, nothing around it:

```json
{
  "status": "ready | abort",
  "lane": "chico | feature",
  "gaps": ["DoR gap, one per line, quoting the story"],
  "alreadyDelivered": ["what exists on main and where"],
  "assumptions": ["a comment that corrected the body, a reading you chose"],
  "detail": "one sentence for the report"
}
```
