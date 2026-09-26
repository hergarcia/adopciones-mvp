# Quickstart: ver la verificación de identidad en local

```sh
pnpm exec supabase start
pnpm exec supabase db reset     # migraciones + seed: Ana en nivel 1, Lucía administra
pnpm dev                        # sin RESEND_API_KEY: los correos quedan en .artifacts/mail/
```

Hacen falta dos fotos cualquiera (JPEG o PNG, menos de 10 MB) para hacer de cédula y de selfie.

## Qué mirar

1. **La oferta** — entrá como `ana@example.test`: «Mi perfil» dice «Tu identidad» con la oferta de
   nivel 2 y «Verificar mi identidad».
2. **El consentimiento** — «Verificar mi identidad»: la pantalla dice qué se hace con las imágenes
   y no deja elegir fotos hasta «Acepto y elijo las fotos».
3. **El envío** — elegí las dos fotos, mirá las vistas previas, «Enviar mi pedido»: el estado dice
   «En revisión», desde hoy, hasta 2 días, y el día y la hora en que vence.
4. **La cola** — cerrá sesión, entrá como `lucia@example.test`: «Mi perfil» tiene «Revisar pedidos
   de identidad (1)». La cola muestra a Ana; abrí el pedido: nombre, zona, desde cuándo tiene
   cuenta, sin rechazos, las dos imágenes.
5. **Aprobar** — «Aprobar»: volvés a la cola vacía, "No hay pedidos esperando". En
   `.artifacts/mail/` hay un correo para Ana: nivel 2, desde hoy, imágenes borradas. Como Ana,
   «Mi perfil» dice «Nivel 2» y el teléfono ya no dice "Nivel 1 desde…".
6. **Rechazar y el tope** — con `marta@example.test` (verificá su teléfono primero), pedí y hacé que
   Lucía rechace tres veces con motivos distintos: al tercero, Marta ve «Sin intentos» con el día
   y el correo de ayuda.
7. **Retirar** — pedí como otra cuenta y retiralo: el diálogo dice que se borran las imágenes; la
   pantalla vuelve a la vista de pedir con el aviso. Si Lucía tenía abierto ese pedido, en 10
   segundos ve que ya no está.
8. **Nadie más** — como Ana, abrí `/revision`: la pantalla de "no existe". Abrí la dirección de una
   imagen copiada de la sesión de Lucía: tampoco.
9. **Vencer** — en `psql`, `update identity_requests set expires_at = now()`; en 5 minutos (o
   `select public.expire_identity_requests()`) el pedido sale de la cola, las imágenes no están y,
   con `pnpm dev` arriba, llega el correo de vencimiento.

Las pruebas: `pnpm test` (incluye `tests/db/identity.test.ts`) y `pnpm e2e`.
