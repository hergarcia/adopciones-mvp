# Quickstart: validar que el destino sobrevive a un enlace que no sirvió

## Previo

`pnpm exec supabase start` · `pnpm exec supabase db reset` · `pnpm dev` **sin** `RESEND_API_KEY`
(los correos quedan en `.artifacts/mail/`).

## US1 — «Enviarme otro enlace»

1. Sin sesión, en `/` tocar «Publicar un animal»; pedir el enlace con una dirección nueva.
2. Abrir el enlace dos veces (la segunda ya está usado) → «El enlace no sirve».
3. «Enviarme otro enlace» → abrir el último correo → completar el perfil → «Para publicar,
   verificá tu teléfono» → con el código, «Publicar un animal».

## US2 — «Escribir mi correo»

1. Abrir `/auth/confirm?link=00000000-0000-0000-0000-000000000000&token_hash=x&next=%2Fmis-animales%2Fpublicar`.
2. «Escribir mi correo» lleva a `/entrar?next=%2Fmis-animales%2Fpublicar`.
3. Pedir enlace → en «Revisá tu correo» pedir otro → abrir el último → completar el perfil → llega
   a verificar el teléfono para publicar.
4. Repetir el paso 1 con `next=https%3A%2F%2Fotro.com`: «Escribir mi correo» lleva a `/entrar` a
   secas.

## Automatizado

`pnpm test -- next-destination link-problem` · `pnpm e2e -- enlace-no-sirve`
