# Quickstart — probar la historia #67 en local

1. `pnpm exec supabase start` y `pnpm exec supabase db reset` (migraciones + seed).
2. `pnpm dev` **sin** `RESEND_API_KEY`: los correos quedan en `.artifacts/mail/`.
3. Con la publicadora sembrada y la persona con la solicitud aceptada (`node scripts/walk.mjs
   --user` entra como una):
   - En Mis animales, «Marcar adoptado» en el animal: «¿A quién se lo diste?» con la aceptada y
     «por fuera del sitio». Elegirla, leer el compromiso (con o sin castración según la ficha) y
     confirmar: «Adoptado por …», «Compromiso pendiente de …».
   - En `.artifacts/mail/` aparece «Adoptaste a …: aceptá el compromiso». Su enlace lleva a Mi
     solicitud: el compromiso, «Acepto el compromiso» y «Yo no adopté a …».
   - Aceptar: dos correos «El compromiso por …» con el texto, la foto y las dos fechas, sin
     teléfono. Mis animales muestra «Compromiso aceptado el …».
   - «Volver a publicar» el animal: la confirmación de que la adopción termina; Mi solicitud dice
     que terminó y el teléfono ya no se ve.
4. Con otro animal sin aceptadas: solo «por fuera del sitio» y el camino a sus solicitudes.
5. `pnpm test` (incluye `tests/db/` de privacidad), `pnpm e2e`, `pnpm gates:affected`.
6. Capturas: `node scripts/walk.mjs --story entrega-compromiso-adopcion --user /mis-animales …`.
