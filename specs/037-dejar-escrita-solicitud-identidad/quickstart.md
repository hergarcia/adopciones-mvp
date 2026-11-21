# Quickstart: probar la solicitud que espera

1. `pnpm exec supabase start` · `pnpm exec supabase db reset` · `pnpm dev` (sin `RESEND_API_KEY`
   para leer los correos en `.artifacts/mail/`).
2. Entrar como la persona sembrada con solo el teléfono (`node scripts/walk.mjs --user` o el enlace
   del correo) y mandar un pedido de identidad desde «Mi perfil».
3. Abrir un animal que pide identidad verificada → «Quiero adoptar» → «Dejar escrita mi solicitud»
   → contestar → «Dejarla lista». Ver la confirmación y «Mis solicitudes» («Espera tu identidad»,
   «1 de 3»).
4. Entrar como quien publicó: «Solicitudes recibidas» y «Mis animales» sin cambios.
5. Entrar como quien administra → Revisión → aprobar el pedido. Ver en «Mis solicitudes» la
   solicitud «Esperando respuesta» con la fecha de hoy, el correo de identidad aprobada con «Ver mis
   solicitudes» y, como quien publicó, la solicitud nueva en la bandeja.
6. Casos de la tarea: pausar el animal antes de aprobar, aprobar, reanudarlo y esperar hasta 5
   minutos (o `select public.held_applications_tick();`). Para el plazo, en la base local
   `update public.held_applications set expires_at = now() where …;` y correr la tarea.
7. Pruebas: `pnpm test tests/db/held-applications-*` · `pnpm test src/lib/applications` ·
   `pnpm e2e tests/e2e/solicitud-en-espera.spec.ts` · `pnpm gates:affected`.
