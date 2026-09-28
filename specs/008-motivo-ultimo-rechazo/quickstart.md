# Quickstart: validar el último rechazo

## Previo

`pnpm exec supabase start`, `pnpm exec supabase db reset`, `pnpm dev` sin `RESEND_API_KEY` (los
correos quedan en `.artifacts/mail/`). Una persona sembrada en nivel 1 y otra designada para
administrar, como en la aceptación de #11 (personas `@example.test` de `supabase/seed.sql`).

## Escenarios

1. **Dos rechazos el mismo día** (US1-AS1): la persona pide; quien administra rechaza por «No se
   lee». La persona pide de nuevo; se rechaza por «No coincide». En «Verificar mi identidad» se ve
   «la selfie no coincide con la cédula», el consejo de «No coincide» y «Te queda 1 intento». El
   correo del segundo rechazo dice lo mismo.
2. **Cola de revisión** (US3-AS1): la persona pide por tercera vez. Quien administra abre el
   pedido: los rechazos salen «No coincide» primero y «No se lee» después, los dos con el mismo
   día.
3. **Sin intentos** (US2-AS2): se rechaza el tercero por «Cédula vencida». La pantalla dice «la
   cédula está vencida», el consejo de ese motivo y la misma fecha para volver a pedir que dice el
   correo.
4. **Resumen de «Mi perfil»** (US1-AS7): muestra el sello del estado con el día, sin motivo, y el
   acceso al pedido.

## Compuertas

- `pnpm test` cubre `newestFirst`, `identityStatus` y el test de base de datos del orden de
  resolución (ver plan §Qué se testea).
- `pnpm mutation` al 100 % sobre `rejections.ts` e `identity-status.ts`.
