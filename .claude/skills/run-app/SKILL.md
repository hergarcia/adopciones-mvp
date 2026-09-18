---
name: run-app
description: Bring the app up locally (Supabase local + Next dev) and drive it with the walk driver to capture screenshots of routes at phone width for the design review. Use when asked to run the app, take screenshots, or verify a screen in the real app.
---

# Run the app and capture screens

**Status: contract.** The driver (`scripts/walk.mjs`) is built by story F00 (M0 - Base). This
file is its specification, so the Build stage and the design reviewer can rely on the same
interface from the first feature on. Update the "Verified" section when it exists.

## The stack

Supabase local (Docker, `supabase start`) → Next.js dev server (`pnpm dev`, port 3000). The
app is useless without both. Every command below runs from the repo root.

## Bring it up

```bash
supabase start                 # first run pulls images; prints the local URL and keys
supabase db reset              # migrations + seed (supabase/seed.sql) on a clean database
pnpm dev                       # background; never exits
```

`.env.local` points at the local instance (`supabase status -o env` prints the values). The
seed creates the synthetic users the driver logs in as; their emails and the shared password
live in `supabase/seed.sql` and are listed here once F00 lands.

## The driver

```bash
node scripts/walk.mjs --story <slug> [routes...] [--user <email>] [--desktop] [--headed]
```

Contract:

- Logs in as the given seed user (default: a verified adopter) through the real login, walks
  the given routes (default: every route the nav exposes to that user), waits for the page to
  settle, and screenshots each one **full page at 390 × 844** (phone; the target device) into
  `.artifacts/<slug>/<route>.png`. `--desktop` adds 1280 × 800 captures next to them.
- Captures the **empty state** by walking the same routes as a freshly seeded user with no
  data (`--user empty@…`), so the design reviewer sees both.
- Hovers and focuses the first interactive element of each screen before a second capture
  (`<route>.hover.png`) so microinteractions are visible.
- Exits non-zero on any console error, page error or failed request that is not in the
  allowlist (`/api/auth` 401 on the login page is an answer, not an error). Exit code 2 means
  the stack is not up: it preflights before launching a browser.
- Prints one line per route with the page's first heading, and the artifact paths at the end.

`.artifacts/` is gitignored. Playwright and its Chromium come from the dev dependencies.

## Tests

```bash
pnpm lint && pnpm typecheck && pnpm test        # oxlint, tsc, Vitest (unit + RLS against local Supabase)
pnpm build && pnpm start                        # production build; what Hernán walks after a batch
pnpm e2e                                        # Playwright critical flows against next start
pnpm lighthouse                                 # Lighthouse CI against next start, budget in .lighthouserc.json
pnpm verify                                     # all of the above in order — the full gate, same as CI
```

RLS tests need `supabase start`; they skip locally without it and **fail in CI** when the
instance is missing (silent skips in CI are forbidden).

## Verified

_Nothing yet. F00 fills this in with the exact commands, ports, seed users and gotchas
observed on Windows 11 / PowerShell 7, the way biotec-sistema's run skill does._
