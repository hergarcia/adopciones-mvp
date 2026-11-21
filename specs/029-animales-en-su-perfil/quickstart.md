# Quickstart: validar la historia #238

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones (con 20261029120000_profile_pets.sql) + seed
pnpm db:types
pnpm dev                         # sin RESEND_API_KEY, para entrar con walk --user
```

## Pruebas

```bash
pnpm test -- tests/db/profile-pets.test.ts                 # las reglas del perfil contra el listado
pnpm test -- src/lib/pets/profile-pets-state.test.ts src/lib/analytics
pnpm gates:affected
pnpm build && pnpm e2e -- tests/e2e/perfil-animales.spec.ts
```

## A mano (contra `pnpm dev`)

1. Con una persona sembrada que publica, publicar dos animales y una camada; marcar uno en proceso.
2. Abrir su perfil sin sesión: la sección «En adopción» debajo de los avales, tres tarjetas, la camada
   una vez, la de en proceso con su sello, de la más nueva a la más vieja. En la consola de `pnpm dev`:
   `[medición] public_profile_viewed {"origin":"link","with_pets":true}`.
3. Tocar una tarjeta: `[medición] pet_viewed {"origin":"profile",...}`.
4. Pausar un animal y recargar el perfil: no aparece. Reanudar: vuelve a su lugar.
5. Abrir el perfil de una persona sembrada que no publica: igual que antes, sin sección;
   `with_pets:false`.
6. Con la base parada (`pnpm exec supabase stop` después de cargar la página una vez, o cortando la red
   en las herramientas del navegador antes de «Probar de nuevo»): el aviso con «Probar de nuevo».
7. Entrar a «Mis animales» como quien publicó: la línea y «Copiar el enlace»; copiar →
   «Enlace copiado» y `[medición] profile_link_copied {"from":"my_pets"}`. En «Mi perfil», el mismo
   botón manda `{"from":"my_profile"}`.
8. Pausar todos sus animales: la línea desaparece de «Mis animales».
9. Capturas para la revisión de diseño:
   `node scripts/walk.mjs --story 238-animales-en-su-perfil --user /perfil/<publicId> /mis-animales`.
