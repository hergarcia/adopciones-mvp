#!/usr/bin/env bash
# Leaves a Claude Code cloud container ready for director-cloud: Docker, local Supabase, .env.local
# and an authenticated gh. Idempotent: the Director runs it at the start of every turn.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# The cloud container ships dockerd but does not start it.
if ! docker info >/dev/null 2>&1; then
  (dockerd >/tmp/dockerd.log 2>&1 &)
  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
  docker info >/dev/null 2>&1 || { echo "cloud-up: Docker did not start (see /tmp/dockerd.log)" >&2; exit 1; }
fi

pnpm install --frozen-lockfile >/dev/null

# The container's preinstalled Chromium is older than the one the repo's Playwright expects, and it
# must not download browsers: the expected path points at the preinstalled one.
shell_dir="$(pnpm exec playwright install --dry-run chromium-headless-shell | sed -n 's/^ *Install location: *//p' | head -1)"
if [ -n "$shell_dir" ] && [ ! -e "$shell_dir/chrome-headless-shell-linux64/chrome-headless-shell" ]; then
  have="$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux | head -1)"
  mkdir -p "$shell_dir/chrome-headless-shell-linux64"
  cp -as "$have/." "$shell_dir/chrome-headless-shell-linux64/"
  ln -sf headless_shell "$shell_dir/chrome-headless-shell-linux64/chrome-headless-shell"
fi
# Lighthouse finds `chromium` on PATH; as root, Chrome refuses to start without --no-sandbox.
if ! command -v chromium >/dev/null 2>&1; then
  printf '#!/bin/sh\nexec /opt/pw-browsers/chromium --no-sandbox "$@"\n' >/usr/local/bin/chromium
  chmod +x /usr/local/bin/chromium
fi

pnpm exec supabase status >/dev/null 2>&1 || pnpm exec supabase start >/dev/null

if [ ! -f .env.local ]; then
  eval "$(pnpm exec supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
  grep -v -E '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)=' .env.example >.env.local
  printf 'NEXT_PUBLIC_SUPABASE_URL=%s\nNEXT_PUBLIC_SUPABASE_ANON_KEY=%s\nSUPABASE_SERVICE_ROLE_KEY=%s\n' \
    "$API_URL" "$ANON_KEY" "$SERVICE_ROLE_KEY" >>.env.local
fi

gh auth status >/dev/null 2>&1 || {
  echo "cloud-up: gh is not authenticated; the environment needs a valid GH_TOKEN" >&2
  exit 1
}
echo "cloud-up: ready"
