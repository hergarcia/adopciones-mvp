# Quickstart: validar «¿Por dónde te encontró?»

## Antes

```sh
pnpm exec supabase start
pnpm exec supabase db reset
pnpm dev
```

## Pruebas

```sh
pnpm test -- src/lib/adoptions src/lib/schemas/adoption src/lib/analytics/adoption-events
pnpm gates:affected
pnpm e2e -- tests/e2e/handover.spec.ts
```

## A mano (con una persona sembrada, `node scripts/walk.mjs --user`)

1. Un animal sin aceptadas → «Marcar adoptado»: la pregunta está al abrir, debajo de la nota, con
   seis opciones y ninguna elegida. Marcar sin elegir: en la consola de `pnpm dev`,
   `[medición] pet_handed_over {… "to":"outside", … "found_via":"unanswered"}`.
2. Un animal con una aceptada → elegir «por fuera»: aparece la pregunta. Tocar «Instagram», tocarla
   otra vez (queda sin elegir), elegir «Instagram» de nuevo, pasar a la persona (la pregunta se va),
   volver a «por fuera» (sin nada elegido). Elegir «Vio a … en este sitio» y marcar:
   `"found_via":"seen_here"`, sin el nombre.
3. Marcar a una persona aceptada: `"to":"site"` y `"found_via":null`.
4. Una cría de una camada: la cuarta opción lleva el nombre de la cría; marcar con Facebook:
   `"litter":true,"found_via":"facebook"`.
5. Capturas: `node scripts/walk.mjs --story por-donde-llego-adoptante --user <ruta de marcar adoptado>`
   a 390 y 1280 px, con y sin aceptadas.
