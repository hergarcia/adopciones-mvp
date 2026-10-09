# Quickstart: probar Administrar en local

Prerrequisitos: Docker, `pnpm install`, `.env` con `CRON_SECRET`.

1. `pnpm exec supabase start` y `pnpm exec supabase db reset` (migraciones + seed).
2. `pnpm db:types` y `pnpm dev` **sin** `RESEND_API_KEY` (los correos van a `.artifacts/mail/`).
3. Entrar como la persona sembrada que administra (`node scripts/walk.mjs --user`, o el enlace de
   `.artifacts/mail/`): el menú dice «Administrar (N)» y Mi perfil tiene un solo acceso.
4. Abrir `/administrar`: las tres colas con su número, desde cuándo y si están atrasadas; lo propio
   aparte; las tres entradas; buscar «ana» y abrir una ficha.
5. Desde Reportes, tocar el nombre de la reportada: su ficha; «Suspender» con motivo; la ficha la
   muestra suspendida y «Reactivar».
6. El resumen sin esperar a las 8: `curl -X POST -H "x-cron-secret: $CRON_SECRET"
   http://localhost:3000/api/cron/resumen` y leer el JSON nuevo de `.artifacts/mail/`. Repetirlo:
   no sale un segundo correo ese día.
7. Como una persona que no administra: `/administrar` y una ficha dicen «Acá no hay nada».

Pruebas: `pnpm test` (incluye `tests/db/admin-*.test.ts`), `pnpm e2e -- administrar`,
`pnpm gates:affected`. Capturas para el design-reviewer:
`node scripts/walk.mjs --story 019-administrar-sitio-solo-lugar --user /administrar
/administrar/personas/<public_id> /revision/reportes`.
