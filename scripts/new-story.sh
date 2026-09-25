#!/usr/bin/env bash
# Creates a story issue and verifies it landed: rejects the how, requires the sections, checks the milestone.
#   scripts/new-story.sh --milestone "M2 - Publicación y difusión" --title "Publicar un animal" \
#                        --body-file /tmp/body.md [--label historia|historia,seguimiento]
set -euo pipefail

usage() {
  echo "usage: $0 --milestone <exact title> --title <t> --body-file <f> [--label <l>]" >&2
  exit 2
}

MILESTONE=""; TITLE=""; BODY_FILE=""; LABEL="historia"
while [ $# -gt 0 ]; do
  case "$1" in
    --milestone) MILESTONE=${2:-}; shift 2 ;;
    --title)     TITLE=${2:-}; shift 2 ;;
    --body-file) BODY_FILE=${2:-}; shift 2 ;;
    --label)     LABEL=${2:-}; shift 2 ;;
    *) usage ;;
  esac
done
[ -n "$MILESTONE" ] && [ -n "$TITLE" ] && [ -n "$BODY_FILE" ] || usage
[ -f "$BODY_FILE" ] || { echo "error: body file not found: $BODY_FILE" >&2; exit 2; }
case ",$LABEL," in
  *,lista,*) echo "error: 'lista' comes after review — product-owner adds it once hernan-proxy approves, or Hernán does" >&2; exit 2 ;;
esac

# docs/09 §Palabras prohibidas
FORBIDDEN='\b(tabla|tablas|columna|columnas|rls|endpoint|endpoints|trigger|triggers|server action|componente|componentes|hook|hooks|zod|supabase|postgres|migraci[oó]n|migraciones)\b|\bhttp ?[1-5][0-9]{2}\b|\b(src|app|lib|components)/[a-z0-9_./-]+'
# M0 stories are about the tooling itself; the how is their what.
if [[ "$MILESTONE" != M0* ]] && hits=$(grep -inoE "$FORBIDDEN" "$BODY_FILE"); then
  echo "error: the story describes the how; that belongs in plan.md. Rephrase in product language:" >&2
  echo "$hits" | sed 's/^/  line /' >&2
  exit 1
fi
for h in "## Historia" "## Alcance" "## Criterios de aceptación" "## Pantallas" "## Datos personales"; do
  grep -qF "$h" "$BODY_FILE" || { echo "error: missing section: $h" >&2; exit 1; }
done
grep -qiE '^\s*-\s*no incluye.*:\s*\S' "$BODY_FILE" \
  || { echo "error: 'No incluye' is missing or empty — the scope is not bounded" >&2; exit 1; }

gh api "repos/:owner/:repo/milestones?state=open&per_page=100" --jq '.[].title' | grep -qxF "$MILESTONE" \
  || { echo "error: milestone not found (exact title required): $MILESTONE" >&2; exit 1; }

URL=$(gh issue create --title "$TITLE" --body-file "$BODY_FILE" --label "$LABEL" --milestone "$MILESTONE")
NUM=${URL##*/}
echo "created  #$NUM  $URL"

got=$(gh issue view "$NUM" --json milestone,labels --jq '[.milestone.title, (.labels[].name)] | join(",")')
case "$got" in
  "$MILESTONE,"*) ;;
  *) echo "ERROR: #$NUM landed without milestone '$MILESTONE' (got: $got)" >&2; exit 1 ;;
esac
echo "verified #$NUM  milestone '$MILESTONE' · labels: ${got#*,}"
