# Quickstart: probar la invitación a verificar la identidad

Historia #281 · [spec](./spec.md) · [data model](./data-model.md) · [contrato](./contracts/server-actions.md)

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones + seed
pnpm db:types
pnpm dev                         # sin RESEND_API_KEY, para que el enlace de ingreso quede en .artifacts/mail/
```

Las personas sembradas `@example.test` (supabase/seed.sql). Para cada caso, ajustar el estado de
una con SQL desde `pnpm exec supabase db` o con los ayudantes de `tests/db/identity-support.ts`.

## Casos a mirar

| Persona | Estado | En «Mis animales» |
|---|---|---|
| Nivel 1 con un animal disponible | sin pedido | la invitación nombra al animal |
| Nivel 1 con dos publicaciones | sin pedido | la invitación habla de «lo que publicás» |
| Nivel 1 con solo una camada adoptada | sin pedido | la invitación, sin nombrar a la camada |
| Nivel 1 sin publicaciones | — | el vacío de hoy, sin invitación |
| Nivel 1 | pedido en revisión | sin invitación |
| Nivel 1 | un rechazo, o vencido, o retirado | la invitación |
| Nivel 1 | tres rechazos en 30 días | sin invitación hasta que termina el tope |
| Nivel 2 | aprobada | sin invitación |
| Sin teléfono verificado | — | el aviso de hoy, sin invitación |
| Nivel 1 que tocó «Ahora no» | cualquiera | sin invitación |

## Recorridos

1. Con la de nivel 1 y un animal: abrir `/mis-animales`, ver la invitación, tocar «Ahora no». Se va
   sin recargar. Recargar: no está. En `/mi-perfil` sigue «Pasá a nivel 2».
2. Con otra de nivel 1: tocar «Verificar mi identidad». La dirección trae `invitacion=1`. Tocar
   «Ahora no» en la verificación: vuelve a `/mis-animales` con la invitación (o la pregunta de por
   qué se va, que al contestar vuelve ahí).
3. Mandar las dos fotos desde ahí: la pantalla de estado en revisión de siempre. Volver a
   `/mis-animales`: sin invitación.
4. Como quien administra, aprobar ese pedido: el correo (en `.artifacts/mail/`) trae «Ver Mis
   animales». Aprobar uno pedido desde `/mi-perfil`: el correo de siempre.
5. Con DevTools sin red, tocar «Ahora no»: la nota se va sin aviso; con red, recargar: vuelve.
6. Capturas para el design-reviewer:
   `node scripts/walk.mjs --story invitar-identidad-mis-animales --user /mis-animales` a 390 y 1280.

## Pruebas

```bash
pnpm test -- identity-invite exit-question identity-approved-link
pnpm test -- tests/db/identity-invite
pnpm e2e -- identidad-invitacion
pnpm gates:affected
```

En el registro de la medición (sin `POSTHOG_PROJECT_KEY`, la consola del servidor): `identity_offer_viewed`
y `identity_invite_dismissed` con `origin: my_pets`, y los `identity_request_*` del recorrido 3 con
el mismo origen; ninguno con un id, un nombre o un animal.
