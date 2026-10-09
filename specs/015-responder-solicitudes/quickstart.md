# Quickstart — probar la historia #65 en local

1. `pnpm exec supabase start` y `pnpm exec supabase db reset` (migraciones + seed).
2. `pnpm dev` **sin** `RESEND_API_KEY`: los correos quedan en `.artifacts/mail/`.
3. Con dos personas sembradas con el teléfono verificado (`node scripts/walk.mjs --user` entra
   como una):
   - La publicadora publica a Tobi. La adoptante lo solicita.
   - En `.artifacts/mail/` aparece «Alguien quiere adoptar a Tobi». Su enlace lleva a
     `/solicitudes`: Tobi con «1 nueva».
   - Abrir la solicitud: perfil, distintivos, «hoy», respuestas. «Pedir más información» con
     una pregunta; la adoptante la contesta desde Mi solicitud.
   - «Aceptar» y confirmar: el contacto de cada lado, «Abrir WhatsApp» (`/api/solicitudes/{id}/whatsapp`
     redirige a `wa.me` con el mensaje), la oferta de «En proceso».
   - «Dejar sin efecto» con «la adopción no se concretó»: el contacto desaparece de las dos.
   - Con una tercera persona: solicitar, rechazar con «otro» y una línea; la ficha le dice «Tu
     solicitud no fue aceptada».
4. Marcar adoptado con una aceptada y una esperando: correos «encontró hogar», contacto a la vista
   en la aceptada.
5. `pnpm test` (incluye `tests/db/` de privacidad), `pnpm e2e`, `pnpm gates:affected`.
6. Capturas: `node scripts/walk.mjs --story responder-solicitudes --user /solicitudes …`.
