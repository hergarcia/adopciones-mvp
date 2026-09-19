---
name: run-app
description: Bring the app up locally (Supabase local + Next dev) and drive it with the walk driver to capture screenshots of routes at phone width for the design review. Use when asked to run the app, take screenshots, or verify a screen in the real app.
---

# Run the app and capture screens

**Status: partly built.** Story F00 (M0 - Base) built the driver (`scripts/walk.mjs`) for an
**anonymous visitor**. Everything below marked _(pending: login story)_ is still contract, not
behaviour: it arrives with F01 «Registro e ingreso», which brings the app session and the seeded
users. Nothing in this file describes something that silently does not exist.

## The stack

Supabase local (Docker, `pnpm exec supabase start`) → Next.js dev server (`pnpm dev`, port 3000).
Every command below runs from the repo root. The Supabase CLI is a devDependency: always
`pnpm exec supabase`, never a bare `supabase`, which can resolve to a different version installed
on the machine.

## Bring it up

```bash
pnpm exec supabase start       # first run pulls images; prints the local URL and keys
pnpm exec supabase db reset    # migrations + seed (supabase/seed.sql) on a clean database
pnpm dev                       # background; never exits
```

`.env.local` points at the local instance (`pnpm exec supabase status -o env` prints the values;
`.env.example` lists the three the project needs). `supabase/seed.sql` creates **no users yet**.
_(pending: login story)_ The seed will create the synthetic users the driver logs in as; their
emails and the shared password will live in `supabase/seed.sql` and be listed here.

## The driver

```bash
node scripts/walk.mjs --story <slug> [routes...] [--user <email>] [--desktop] [--headed]
```

Contract:

- **Built.** Walks the given routes as an anonymous visitor (default: only `/`), waits for the
  page to settle, and screenshots each one **full page at 390 × 844** (phone; the target device)
  into `.artifacts/<slug>/`. File names derive from the route: `/` is `home.png`, `/muestra` is
  `muestra.png`, inner slashes become dashes. `--desktop` **adds** 1280 × 800 captures next to
  them, with a `.desktop` suffix. `--headed` shows the browser. The folder is cleaned at the start of every run.
- **Built.** Hovers and focuses the first interactive element of each screen before a second
  capture (`<route>.hover.png`) so microinteractions are visible. A route with nothing
  interactive says so on its line and produces no hover capture, without failing.
- **Built.** Runs against **`pnpm dev`**, not `next start`: `/muestra` only exists in development
  and answers 404 in a production build.
- **Built.** Exit codes: **0** clean · **1** a route had a console error, page error or failed
  request · **2** the app is not up (it preflights before launching a browser) · **3** invalid
  invocation: no `--story`, a bad slug, or `--user`. The allowlist of failed requests is **empty**
  and lives in `scripts/walk/noise.mjs`, next to the dev-server noise it ignores (HMR socket,
  source maps, DevTools notices).
- **Built.** Prints one line per route with the page's first heading, and the artifact paths at
  the end.
- _(pending: login story)_ Logs in as the given seed user (default: a verified adopter) through
  the real login; default routes become every route the nav exposes to that user; `--user`
  selects who. Today `--user` exits 3 and says why, rather than walking as anonymous in silence.
- _(pending: login story)_ Captures the **empty state** by walking the same routes as a freshly
  seeded user with no data (`--user empty@…`), so the design reviewer sees both. The
  `/api/auth` 401 on the login page enters the allowlist then.

`.artifacts/` is gitignored. Playwright and its Chromium come from the dev dependencies.

## Tests

```bash
pnpm lint && pnpm typecheck && pnpm test        # oxlint, tsc, Vitest (unit + RLS against local Supabase)
pnpm build && pnpm start                        # production build; what Hernán walks after a batch
pnpm e2e                                        # Playwright critical flows against next start
pnpm lighthouse                                 # Lighthouse CI against next start, budget in .lighthouserc.json
pnpm verify                                     # all of the above in order — the full gate, same as CI
```

RLS tests need `pnpm exec supabase start`; they skip locally without it, with the reason recorded
in `.verify-skips.json` and reported at the end of `pnpm verify`, and **fail in CI** when the
instance is missing (silent skips in CI are forbidden). With the database up but no `.env.local`,
they fail naming the missing variable.

## Verified

Observed on Windows 11 on 2026-09-18, building F00. **Run through Git Bash, not PowerShell 7**:
where the two differ it is said below, and what is PowerShell-only is still Hernán's to confirm.

**Ports.** App 3000 · Supabase API 54321 · Postgres 54322 · Studio 54323 · Mailpit 54324.

**Bring-up that works.**

```bash
pnpm install
pnpm exec playwright install chromium
pnpm exec supabase start
cp .env.example .env.local        # PowerShell: Copy-Item .env.example .env.local
pnpm exec supabase status -o env  # API_URL, ANON_KEY, SERVICE_ROLE_KEY go into .env.local
pnpm dev
node scripts/walk.mjs --story <slug> / /muestra
```

**Gotchas, each one hit for real.**

- **A bare `supabase` is a different program.** The machine had a scoop-installed CLI (2.101.0)
  next to the project's (2.117.0). `pnpm db:types` failed with `'config.config' has invalid keys:
  local_smtp` because the old one does not know a key the new one requires. Scripts invoke the
  CLI by path; people use `pnpm exec supabase`.
- **`supabase start` exits 0 when Docker is down.** It prints "Docker Desktop is a prerequisite"
  and still returns success. Trust `pnpm exec supabase status`, not the exit code. A stopped
  Docker Desktop shows up as `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the
  file specified`.
- **A stale dev server makes you test the wrong build.** With `pnpm dev` still holding port 3000,
  `pnpm start` dies with `EADDRINUSE` in the background and every request keeps hitting dev. That
  is how `/muestra` looked like it answered 200 in production. Check who holds the port
  (`netstat -ano | findstr :3000`) and kill that PID before trusting a production check.
- **`127.0.0.1` is not `localhost` to Next 16.** The dev server refuses its development resources
  to an origin it does not know: the page renders, never hydrates, and every button in the
  capture does nothing. The only trace is a failed `_next/hmr` WebSocket handshake in the console,
  which the driver used to ignore as noise. The driver now targets `http://localhost:3000` and
  reports that failure as a problem. Drive the app through `localhost`, always.
- **Git Bash rewrites route arguments.** `/muestra` becomes `C:/Program Files/Git/muestra` and the
  driver silently walks only `/`. In Git Bash prefix the command with `MSYS_NO_PATHCONV=1`.
  PowerShell does not do this.
- **`pnpm lighthouse` does not finish on Windows** (KL-001). The audit runs, then chrome-launcher
  fails to delete its temp directory (`EPERM`) and the stage exits non-zero with no report. It is
  verified in CI.
- **`renovate-config-validator` prints a stack trace and passes.** "RE2 not usable, falling back
  to RegExp" is the native build this project blocks on purpose in `pnpm-workspace.yaml`. Read the
  last line: "Config validated successfully".
- **The `!` prefix in Claude Code runs Git Bash.** PowerShell cmdlets such as `Start-Process` are
  not found there.
- **`next dev` wants to write into `CLAUDE.md`.** Next 16.3 injects its own agent rules when it
  detects an agent. `agentRules: false` in `next.config.ts` turns it off; if that line ever goes,
  every `pnpm dev` leaves the tree dirty and the Ready stage aborts.

**Seed users.** None yet. They arrive with the login story, and get listed here then.
