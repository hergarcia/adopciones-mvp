# Quickstart: Pedirle a quien solicitó que verifique su identidad

Cómo comprobar la historia en local. Detalle de lo que se guarda en [data-model.md](./data-model.md)
y de las acciones en [contracts/server-actions.md](./contracts/server-actions.md).

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones + seed (cuatro personas @example.test)
pnpm db:types
pnpm dev                         # sin RESEND_API_KEY: los correos quedan en .artifacts/mail/
```

Hace falta, de las personas sembradas: una que publicó un animal y una camada, una de nivel 1 que
les solicitó, una de nivel 2 que les solicitó y una que administra. Si el seed no tiene la
solicitud de la de nivel 1 a una cría, se crea desde la ficha.

## Recorrido

1. Entrar como quien publicó → «Solicitudes recibidas» → el animal → la solicitud de nivel 1.
   Aparece «Pedirle la identidad». En la de nivel 2, no.
2. Tocarlo: la confirmación dice qué se le pide y que la solicitud sigue esperando. Confirmar.
   La solicitud dice «Le pediste la identidad el <hoy> · Todavía no la verificó»; aceptar, rechazar y
   preguntar siguen ahí. En la lista del animal, la fila lleva la marca.
3. Tocar de nuevo desde otra pestaña abierta antes: sigue un solo pedido; en `.artifacts/mail/` hay
   un solo correo a quien solicitó.
4. Entrar como quien solicitó con el enlace del correo: Mi solicitud dice que quien publicó le pide
   verificar la identidad, con sus chapitas y «Verificar mi identidad». Tocarlo, mandar las dos
   fotos: vuelve a Mi solicitud con «Tu identidad está en revisión».
5. Entrar como quien administra → Administrar → el pedido → Aprobar. Como quien publicó: la
   solicitud figura como nueva, con la chapita de nivel 2 y «Verificó su identidad el <hoy>»; llegó
   un correo (si no había otras nuevas sin abrir de ese animal).
6. Repetir 1–2 con la cría y aceptar la solicitud antes de aprobar: Mi solicitud deja de mostrar el
   pedido y aprobar no manda nada a quien publicó.
7. Con la herramienta de medición: `identity_ask_sent` con `publisher_level` y `litter`;
   `identity_ask_resolved` con `publisher_level`. Ninguno lleva ids.
8. Desde «Verificar mi identidad», tocar «Ahora no» y contestar la pregunta: Encuestas → «Por qué no
   se verificaron» suma la columna «Se la pidió quien publicó».

## Pruebas

```bash
pnpm gates:affected              # lint, tipos, pruebas y mutación de lo cambiado, build y e2e
pnpm test -- tests/db/identity-asks-privacy.test.ts tests/db/identity-asks-rules.test.ts
pnpm e2e -- tests/e2e/identidad-pedida.spec.ts
node scripts/walk.mjs --story pedir-identidad --user /solicitudes /mis-solicitudes
```
