# Quickstart — probar la historia #69 en local

1. `pnpm exec supabase start` y `pnpm exec supabase db reset` (migraciones + seed: una adopción
   entre dos personas sembradas marcada hace 31 días, en curso, y otra de 10 días).
2. `pnpm dev` **sin** `RESEND_API_KEY`: los correos quedan en `.artifacts/mail/`.
3. Correr la vuelta del seguimiento sin esperar la hora: `select public.run_follow_up_tick();` en
   el SQL local (o esperar al minuto 10). Aparece «¿Cómo va …?» en `.artifacts/mail/` para quien
   adoptó la de 31 días, uno solo aunque se corra dos veces; la de 10 días no recibe nada.
4. Como quien lo dio (`node scripts/walk.mjs --user`): Mis animales dice «Seguimiento pedido el …,
   sin respuesta todavía».
5. Como quien adoptó, desde el enlace del correo: Mi solicitud con «¿Cómo va …?». Probar «Mandar»
   sin foto (el aviso, el texto queda), 4 fotos (las 3 primeras quedan), y mandar 2 con texto: la
   respuesta con la fecha y el sello; «Yo no adopté» ya no está; el compromiso sigue como estaba.
6. En `.artifacts/mail/`: «… contó cómo va …» para quien lo dio, con imagen y sin el texto.
7. Como quien lo dio: Mis animales muestra las fotos, el texto y el sello; su perfil público y la
   ficha de sus animales dicen «1 adopción con seguimiento»; el perfil de quien adoptó, que adoptó
   1; una persona sin ninguna no muestra la línea.
8. Volver a publicar el animal: la respuesta sigue en la pantalla del animal y en Una solicitud.
   Bloquear: quien lo dio ya no ve las fotos ni el texto; el sello y los números quedan.
9. `pnpm test` (incluye `tests/db/` de privacidad y reglas), `pnpm e2e`, `pnpm gates:affected`.
10. Capturas: `node scripts/walk.mjs --story seguimiento-adopcion --user /mis-solicitudes/… /mis-animales/…`.
