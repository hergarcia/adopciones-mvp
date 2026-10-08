# Quickstart — probar la historia #71 en local

1. `pnpm exec supabase start` y `pnpm exec supabase db reset` (migraciones + seed: una persona
   sembrada administra, como hoy).
2. `pnpm dev` con `NEXT_PUBLIC_SUPPORT_WHATSAPP=59899000000` en `.env.local`; después, sin ella.
3. Sin sesión, en la ficha de un animal: «Opinar» arriba, escribir y enviar; probar vacío, 1.001
   caracteres, un teléfono, y una sexta en el día. El pie muestra el WhatsApp (con número) o solo
   Opinar (sin número); tocarlo abre `wa.me` con el saludo.
4. Como quien publica (`node scripts/walk.mjs --user`): marcar adoptado un animal a una persona
   sembrada con solicitud; volver a Mis animales: la encuesta sobre ese animal; responder.
5. Como esa persona: Mi solicitud con la encuesta debajo del compromiso; «Yo no adopté» la saca.
6. Rechazar la solicitud de otra persona sembrada: en su Mi solicitud, «¿Vas a seguir buscando por
   acá?»; «Ahora no» la cierra.
7. Como quien administra: `/revision/opiniones` y `/revision/encuestas` con lo de arriba, sin nombres;
   borrar una opinión. Como otra persona y sin sesión, las dos direcciones no existen.
8. `pnpm test` (incluye `tests/db/`), `pnpm e2e`, `pnpm gates:affected`.
9. Capturas: `node scripts/walk.mjs --story encuesta-opiniones-soporte --user /mis-animales /revision/encuestas`.
