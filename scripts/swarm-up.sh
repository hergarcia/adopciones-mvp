#!/usr/bin/env bash
# Leaves the machine ready for a turn of the Director, on Hernán's machine or in a Claude Code cloud
# container: Docker, local Supabase, .env.local and a gh that works. Every step checks what is
# missing instead of asking where it runs. Idempotent: the Director runs it at the start of every turn.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# The cloud container ships dockerd but does not start it; on Windows, Docker Desktop has to be on.
if ! docker info >/dev/null 2>&1; then
  command -v dockerd >/dev/null 2>&1 || { echo "swarm-up: Docker is not running; start Docker Desktop" >&2; exit 1; }
  (dockerd >/tmp/dockerd.log 2>&1 &)
  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
  docker info >/dev/null 2>&1 || { echo "swarm-up: Docker did not start (see /tmp/dockerd.log)" >&2; exit 1; }
fi

pnpm install --frozen-lockfile >/dev/null

# The cloud container's preinstalled Chromium is older than the one the repo's Playwright expects,
# and it must not download browsers: the expected path points at the preinstalled one.
if [ -d /opt/pw-browsers ]; then
  shell_dir="$(pnpm exec playwright install --dry-run chromium-headless-shell | sed -n 's/^ *Install location: *//p' | head -1)"
  if [ -n "$shell_dir" ] && [ ! -e "$shell_dir/chrome-headless-shell-linux64/chrome-headless-shell" ]; then
    # Older images ship chrome-linux/headless_shell; newer ones already use Playwright's layout.
    have="$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64 \
      /opt/pw-browsers/chromium_headless_shell-*/chrome-linux 2>/dev/null | head -1 || true)"
    [ -n "$have" ] || { echo "swarm-up: no preinstalled headless shell under /opt/pw-browsers" >&2; exit 1; }
    mkdir -p "$shell_dir/chrome-headless-shell-linux64"
    cp -as "$have/." "$shell_dir/chrome-headless-shell-linux64/"
    [ -e "$shell_dir/chrome-headless-shell-linux64/chrome-headless-shell" ] ||
      ln -sf headless_shell "$shell_dir/chrome-headless-shell-linux64/chrome-headless-shell"
  fi
  # Lighthouse finds `chromium` on PATH; as root, Chrome refuses to start without --no-sandbox.
  if ! command -v chromium >/dev/null 2>&1; then
    printf '#!/bin/sh\nexec /opt/pw-browsers/chromium --no-sandbox "$@"\n' >/usr/local/bin/chromium
    chmod +x /usr/local/bin/chromium
  fi
fi

pnpm exec supabase status >/dev/null 2>&1 || pnpm exec supabase start >/dev/null

if [ ! -f .env.local ]; then
  eval "$(pnpm exec supabase status -o env | grep -E '^(API_URL|PUBLISHABLE_KEY|SECRET_KEY)=')"
  grep -v -E '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|SUPABASE_SECRET_KEY)=' .env.example >.env.local
  printf 'NEXT_PUBLIC_SUPABASE_URL=%s\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=%s\nSUPABASE_SECRET_KEY=%s\n' \
    "$API_URL" "$PUBLISHABLE_KEY" "$SECRET_KEY" >>.env.local
fi

# The cloud session proxy authenticates GitHub's REST API and refuses GraphQL, which `gh issue` and
# `gh pr` use; a gh earlier on PATH serves them over REST (scripts/gh-rest.mjs).
shim="$HOME/.local/bin/gh"
if ! gh api graphql -f query='{viewer{login}}' >/dev/null 2>&1; then
  real="$(which -a gh | grep -vxF "$shim" | head -1)"
  [ -n "$real" ] || { echo "swarm-up: gh is not installed" >&2; exit 1; }
  mkdir -p "$(dirname "$shim")"
  printf '#!/bin/sh\nGH_REAL=%s exec node %s/scripts/gh-rest.mjs "$@"\n' "$real" "$PWD" >"$shim"
  chmod +x "$shim"
  hash -r
  [ "$(command -v gh)" = "$shim" ] || { echo "swarm-up: $shim is not first on PATH" >&2; exit 1; }
fi
gh api user >/dev/null 2>&1 || {
  echo "swarm-up: gh cannot reach the GitHub API; check the session's GitHub access" >&2
  exit 1
}
echo "swarm-up: ready"
