# Quickstart: ver la verificación de teléfono en local

```sh
pnpm exec supabase start
pnpm exec supabase db reset     # migraciones + seed: Ana verificada, Lucía a medias, Marta sin teléfono
pnpm dev
```

Sin variables de Twilio en `.env.local`, y con la base local, cada mensaje se escribe en
`.artifacts/sms/<fecha>.json` con `to` y `body`. El código está en `body`.

## Qué mirar

1. **Sin teléfono** — entrá como `marta@example.test` (enlace desde `.artifacts/mail/`) y abrí
   «Mi perfil»: la sección de teléfono muestra el paso pendiente. «Verificar mi teléfono» →
   escribí `099 123 457` → el código está en `.artifacts/sms/` → «Verificar». Volvés a «Mi perfil»
   con «Teléfono verificado» y «Nivel 1 desde…».
2. **La puerta** — con una cuenta sin verificar, abrí
   `/verificar-telefono?para=publicar&next=/mi-perfil/editar`: el título dice «Para publicar,
   verificá tu teléfono». Al confirmar el código llegás a `/mi-perfil/editar`, no a «Mi perfil».
   «Ahora no» te deja en el inicio.
3. **Los errores** — escribí `2 900 1234` (fijo), `+54 11 5555 5555` (extranjero), `12345`
   (formato). Pedí un código y escribí uno equivocado cinco veces. Pedí otro antes de los 60
   segundos. Pedí seis en el día.
4. **A medias** — entrá como `lucia@example.test`: «Mi perfil» dice «Sin confirmar» con
   `098 765 432`, terminar y cancelar. Cancelá: la cuenta queda sin teléfono.
5. **Cambio de número** — entrá como `ana@example.test`, «Cambiar el número», pedí un código para
   otro: «Mi perfil» dice «Sin confirmar», que la cuenta está sin verificar y «si cancelás, vuelve el 099 123 456». Cancelá: vuelve el
   anterior con su fecha original.
6. **Número en uso** — con Marta, pedí un código para `099 123 456` (el de Ana) y escribí el
   correcto: «ese número ya está en uso en otra cuenta», y Marta queda como estaba.

## Capturas para la revisión de diseño

```sh
node scripts/walk.mjs --story verificacion-de-telefono --user marta@example.test /mi-perfil /verificar-telefono "/verificar-telefono?para=publicar&next=%2Fmi-perfil"
node scripts/walk.mjs --story verificacion-de-telefono --user ana@example.test /mi-perfil /verificar-telefono
node scripts/walk.mjs --story verificacion-de-telefono --user lucia@example.test /mi-perfil /verificar-telefono /verificar-telefono/codigo
```

## Las compuertas

```sh
pnpm lint && pnpm typecheck && pnpm test     # incluye tests/db/phones.test.ts contra la base local
pnpm mutation                                # los archivos de lib/ con test, al 100 %
pnpm e2e                                     # tests/e2e/telefono.spec.ts contra next start
```
