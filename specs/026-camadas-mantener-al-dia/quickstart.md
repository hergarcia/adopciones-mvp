# Quickstart: probar la vida de una camada (#206)

## Preparar

```bash
pnpm install
pnpm exec supabase start
pnpm exec supabase db reset     # migraciones + seed: la camada sembrada con solicitudes por cría
pnpm db:types
pnpm dev                        # sin RESEND_API_KEY: los correos quedan en .artifacts/mail/
```

## Recorrido

1. Entrar como la persona sembrada que publicó la camada (`node scripts/walk.mjs --user`). «Mis
   animales» muestra la camada con su recuento, su vencimiento y una fila por cría, cada una con su
   sello y sus solicitudes nuevas.
2. «Solicitudes» muestra la camada como un grupo; adentro, cada cría con las suyas y la que nadie
   pidió con «Todavía nadie pidió a esta cría».
3. Abrir una solicitud de «Cría 2» y aceptarla: las dos personas ven el teléfono de la otra; aceptar
   ofrece marcar «Cría 2» en proceso. Las solicitudes de «Cría 1» siguen como estaban.
4. Marcar «Cría 2» adoptada a esa persona desde su fila: el compromiso dice la cría y la camada;
   `/camadas/{code}` dice «4 crías, 3 disponibles» y «Cría 2» lleva el sello «Adoptada». En
   `.artifacts/mail/` queda el correo de cierre para quien también había pedido «Cría 2».
5. Pausar la camada con una cría en proceso: sale de `/animales` y su enlace dice que está pausada.
   Reanudar: cada cría vuelve como estaba.
6. Llevar la camada a 7 días del vencimiento (`update litters set expires_at = now() + interval '6
   days 23 hours'` en la base local) y llamar a `/api/cron/publicaciones` con el secreto: sale un solo
   correo «¿<camada> sigue disponible?». Abrir «Sigue disponible» en una ventana privada: 30 días más.
7. Quitar una cría con solicitudes desde su fila: la confirmación dice cuántas se cierran; quienes la
   pidieron la ven cerrada en «Mis solicitudes», con el nombre de la camada.
8. Como quien pidió dos crías: «Mis solicitudes» muestra las dos con el nombre de su camada.

## Compuertas

```bash
pnpm gates:affected             # por user story
pnpm test -- tests/db/litter-lifecycle.test.ts tests/db/litter-renewal.test.ts tests/db/litter-lifecycle-privacy.test.ts
pnpm e2e -- tests/e2e/camada-vida.spec.ts
pnpm verify                     # una vez, al cerrar el build
node scripts/walk.mjs --story camadas-mantener-al-dia --user /mis-animales /solicitudes /mis-solicitudes
```
