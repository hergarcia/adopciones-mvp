# Quickstart — verificar la historia #236

La medición no sale en local: cada momento queda en la consola de `pnpm dev` como
`[medición] <momento> {props} visita=…` (`src/lib/analytics/track.ts`). Eso es lo que se mira.

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset
pnpm db:types
pnpm dev
```

## Pruebas

```bash
pnpm test src/lib/analytics
pnpm test tests/db/measured-levels-privacy.test.ts tests/db/measured-levels-rules.test.ts
pnpm gates:affected
```

## A mano (contra el registro de `pnpm dev`)

1. **US1**: entrar como la rescatista sembrada, abrir una solicitud y aceptar: `application_accepted`
   y `application_first_response` con el mismo `applicant_level` y `applicant_follow_up`. Rechazar
   otra: `application_rejected` con `reason` y los dos datos. Marcar entregado por fuera:
   `pet_handed_over` con `to: "outside"` y sin los dos datos.
2. **US2**: abrir una ficha sin sesión: `pet_viewed` con `publisher_level`. Tocar «Solicitar»:
   `apply_tapped` con `publisher_level`. Mandar una solicitud con otra persona: `application_sent`
   con `applicant_level` y `publisher_level`.
3. **US3**: en la solicitud, tocar «Ver su perfil»: `public_profile_viewed` con `origin:
   "application"`. Pegar esa dirección en otra pestaña: `origin: "link"`.
4. **US4**: publicar pidiendo nivel 2: `pet_published` con `required_level: 2`. Editar solo la
   descripción: `pet_edited` con `required_level: 2`.
5. **Medir no frena**: con la base de la medición rota a propósito (por ejemplo, revocando el
   `execute` de `application_measure` en local), aceptar una solicitud: se acepta igual, la pantalla
   es la de siempre y el momento sale sin `applicant_level`.

Ninguna línea del registro lleva un id, un código, un nombre ni un texto.
