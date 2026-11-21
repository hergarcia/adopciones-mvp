# Quickstart: pregunta propia

Validación de punta a punta en local. Requiere Docker.

1. `pnpm exec supabase start` y `pnpm exec supabase db reset` (migraciones y las personas sembradas).
2. `pnpm db:types` y `pnpm typecheck`.
3. Pruebas de la base: `pnpm test -- tests/db/own-questions` (privacidad y reglas).
4. Unitarias de lo tocado: `pnpm test -- src/lib/schemas src/lib/applications src/lib/analytics src/lib/surveys`.
5. `pnpm gates:affected` (lint, tipos, pruebas, mutación de lo cambiado, build y los e2e que lo tocan).
6. E2E del flujo: `pnpm e2e -- pregunta-propia` (publicar con pregunta, solicitar contestándola, abrir
   la solicitud de los dos lados, y que la ficha y la pantalla de freno no la muestren).
7. Capturas para el design-reviewer: con `pnpm dev` sin `RESEND_API_KEY`,
   `node scripts/walk.mjs --story pregunta-propia --user` sobre `/mis-animales/publicar`, el
   cuestionario de un animal sembrado con pregunta, una solicitud recibida con y sin respuesta, y
   `/revision/encuestas`.

Resultado esperado: los casos de `spec.md` §User Scenarios pasan en ese orden; ningún momento de la
medición lleva el texto de una pregunta ni de una respuesta.
