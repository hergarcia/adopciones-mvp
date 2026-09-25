#!/usr/bin/env bash
# Labels and milestones, idempotent. --protect also applies main's branch protection.
set -euo pipefail

echo "== labels"
gh label create historia    --color 1D76DB --description "Feature-sized story: the what, in product language" --force
gh label create lista       --color 0E8A16 --description "Ready to build; Producto adds it, Hernán vetoes by removing it" --force
gh label create seguimiento --color FBCA04 --description "Opened by a run from a finding; review before lista" --force
gh label create decision    --color 5319E7 --description "A pending human decision, not work" --force
gh label create aviso       --color C5DEF5 --description "A decision the swarm already took; close to agree, or revert it" --force
gh label create reglas-aprobadas --color B60205 --description "Hernán approves a change to what judges the agents" --force

echo "== milestones"
for title in \
  "M0 - Base" \
  "M1 - Cuentas y confianza" \
  "M2 - Publicación y difusión" \
  "M3 - Solicitud de adopción" \
  "M4 - Cierre, seguimiento y admin" \
  "M5 - Beta cerrada"; do
  if gh api "repos/:owner/:repo/milestones?state=all&per_page=100" --jq '.[].title' | grep -qxF "$title"; then
    echo "exists   $title"
  else
    gh api -X POST "repos/:owner/:repo/milestones" -f title="$title" >/dev/null
    echo "created  $title"
  fi
done

if [ "${1:-}" = "--protect" ]; then
  echo "== branch protection on main"
  gh api -X PUT "repos/:owner/:repo/branches/main/protection" --input - <<'JSON'
{
  "required_status_checks": { "strict": false, "contexts": ["ci"] },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
  echo "protected main: ci required, linear history, no force push, admins included"
fi
