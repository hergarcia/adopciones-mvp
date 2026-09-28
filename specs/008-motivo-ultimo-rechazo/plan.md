# Implementation Plan: El estado de la verificación muestra el motivo del último rechazo

**Branch**: `feature/80-motivo-ultimo-rechazo` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/008-motivo-ultimo-rechazo/spec.md` (3 user stories). Seguimiento de #11; cierra
KL-11-6 y KL-11-7.

## Summary

El estado del pedido y la cola ordenan los rechazos solo por día; dentro del día, el orden queda
librado a la base y sale el primero (research §R1). La base ya tiene, sin guardar nada nuevo, lo
que hace falta para desempatar: el `id` de cada rechazo crece en el orden en que se resolvieron,
porque las resoluciones de una misma cuenta están serializadas por `lock_identity_account`
(research §R2).

Tres decisiones:

1. **Una regla con nombre**: `newestFirst` en `src/lib/verification/rejections.ts` ordena por día
   descendente y, a igual día, por `sequence` (el `id`) descendente. Es la única definición de
   «el último rechazo».
2. **Dos consumidores, la misma regla**: `identityStatus` la usa para el estado («rechazado» y
   «Sin intentos»); `getReviewRequest` la usa para la cola, y deja de ordenar en la consulta.
3. **Sin migración, sin UI**: se lee una columna que ya existe y es legible por las mismas
   personas; ningún texto, componente ni pantalla cambia de forma.

## Technical Context

**Language/Version**: TypeScript 7.0.2 (`strict`), React 19.3.0, Next.js 16.3.5 (App Router)

**Primary Dependencies**: las de `main`. **Ninguna nueva.**

**Storage**: Supabase Postgres, tabla `identity_rejections` de #11 sin cambios. **Sin
migraciones**; `pnpm db:types` no cambia nada (el `id` ya está en los tipos).

**Testing**: Vitest para `newestFirst` e `identityStatus` (Stryker al 100 %); Vitest contra
Supabase local (`tests/db/identity.test.ts`) para el supuesto del orden de resolución.

**Target Platform**: web mobile-first, 390 px y 1280 px.

**Project Type**: aplicación web (Next.js).

**Performance Goals**: sin cambio. Un orden en memoria sobre a lo sumo un puñado de filas (los
rechazos de 30 días de una cuenta; el tope las frena en 3 por ventana).

**Constraints**: no guardar ningún dato nuevo de un rechazo (historia, «No incluye»; FR-002).

**Scale/Scope**: una función nueva, tres archivos cambiados en `lib/`, un test de base.

## Constitution Check

| Principio | Cumple | Cómo |
|---|---|---|
| I. La historia dice el qué | Sí | La spec no nombra implementación; el cómo vive acá. |
| II. Una feature, un PR | Sí | Tres user stories, un PR; las tres dependen de la misma regla. |
| III. Compuertas y revisión | Sí | §Qué se testea; Stryker al 100 % sobre `rejections.ts` e `identity-status.ts`. |
| IV. Reglas como código | Sí | El orden es una función pura con test; el supuesto sobre la base, un test de base. |
| V. Datos personales mínimos | Sí | Nada nuevo en la base; se lee el `id`, que no identifica a nadie. Sin RLS nueva: la visibilidad de la fila no cambia y ya tiene sus tests (`tests/db/identity.test.ts`, «nadie más lee los rechazos…»). |
| VI. Sin deriva | Sí | Nada de «Fuera del MVP». Ni intentos, ni plazo, ni motivos, ni correo cambian. KL-11-6 y KL-11-7 se borran en este PR. |
| VII. Liviana y linda | Sí | Sin dependencias ni JS de cliente nuevo; sin cambio visual. |
| VIII. Autonomía con veto | Sí | La decisión del enjambre de la historia va a `docs/03` §1 en esta rama (ya está). |

Re-evaluado después del diseño: sin cambios.

## Diseño

**Sin cambio visual.** Ninguna pantalla nueva, ningún componente nuevo o cambiado, ningún token,
ningún texto nuevo en `messages/es.json`. Lo que cambia es qué rechazo llega a las vistas que ya
existen:

| Pantalla (de #11) | Componente que la pinta | Qué cambia |
|---|---|---|
| Estado de mi pedido (`/verificar-identidad`) | `IdentityStatusView` con `identityStatusTexts` | el motivo y el consejo salen del último rechazo |
| Sin intentos (mismo lugar) | ídem | ídem; la fecha para volver a pedir, igual |
| Resumen en «Mi perfil» | `IdentityStatusCard` con `identityCardTexts` | nada visible: el día es el del último, que es el mismo día |
| Un pedido en la cola | `ReviewRequestView` con `reviewRequestTexts` | la lista de rechazos llega ya ordenada |

**El único elemento que llama la atención**: el de cada pantalla en #11, sin cambios.

**Estados**: cargando, vacío y error de las tres pantallas son los de #11 y no se tocan
(`loading.tsx`, `error.tsx` y el vacío «nunca pediste» del estado; «sin rechazos» en la cola).

## Project Structure

### Documentation (this feature)

```text
specs/008-motivo-ultimo-rechazo/
├── story.md             # cuerpo de la historia #80, verbatim
├── spec.md
├── checklists/requirements.md
├── plan.md              # este archivo
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md             # /speckit-tasks
```

Sin `contracts/`: la historia no cambia ninguna interfaz externa (ninguna acción, ruta ni
función de la base).

### Source Code

```text
src/lib/verification/
├── rejections.ts             # NUEVO: tipo Rejection + newestFirst
├── rejections.test.ts        # NUEVO
├── identity-status.ts        # usa Rejection y newestFirst
└── identity-status.test.ts   # casos del mismo día
src/lib/supabase/queries/
├── identity-rows.ts          # toRejections lee id → sequence; importa Rejection del dominio
├── identity.ts               # getMyIdentity selecciona id
└── review-queue.ts           # getReviewRequest selecciona id, ordena con newestFirst
tests/db/
└── identity.test.ts          # el orden de resolución se refleja en el id
docs/
└── known-limitations.md      # se borran KL-11-6 y KL-11-7
```

Capas: `rejections.ts` es `lib/<dominio>` puro; lo importan `identity-status.ts` (mismo dominio)
y las consultas (`lib/supabase/queries/`, que ya importan tipos de `lib/verification`). Nada
hacia arriba.

## Decisiones técnicas

### 1. `Rejection` y `newestFirst` (`src/lib/verification/rejections.ts`)

- `export type Rejection = { rejectedOn: string; reason: RejectionReason; sequence: number }`.
- `export function newestFirst(rejections: readonly Rejection[]): Rejection[]`: copia ordenada con
  `toSorted`, comparando `b.rejectedOn.localeCompare(a.rejectedOn)` y, si da 0,
  `b.sequence - a.sequence`. Sin comentario de encabezado; una línea de por qué: el `id` sigue el
  orden de resolución porque las resoluciones de una cuenta están serializadas.
- `IdentityRecord.rejections` pasa a `readonly Rejection[]` (hoy repite el tipo en línea).
- `identity-rows.ts` deja de declarar `Rejection` y lo importa; `toRejections` recibe
  `{ id: number; rejected_on: string; reason: string }[]` y mapea `id → sequence`.

### 2. `identityStatus`

Reemplaza el `toSorted` por día por `newestFirst(...)` sobre los de la ventana. El resto
(`oldest = recent[CAP − 1]`, `attemptsLeft`, `retryOn`) queda igual. El `?? oldest` de
`const latest = recent[0] ?? oldest` es inalcanzable (si hay índice `CAP − 1` hay índice 0); se
mantiene como hoy o se reescribe sin la rama muerta, lo que deje a Stryker sin mutante
equivalente.

### 3. Las consultas

- `getMyIdentity`: `.select('id, rejected_on, reason')`.
- `getReviewRequest`: `.select('id, rejected_on, reason')`, sin `.order(...)`, y
  `rejections: newestFirst(toRejections(rejections.data))`. El índice
  `identity_rejections_user_idx (user_id, rejected_on desc)` sigue sirviendo al filtro por cuenta.

### 4. Textos, correos, acciones

Sin cambios. `reviewRequestTexts` ya respeta el orden que recibe; `identityStatusTexts` ya toma
motivo y consejo del mismo `status.reason` (FR-005 se cumple por construcción: el consejo es una
función del motivo). El correo del rechazo lo arma la acción con el motivo que eligió quien
administra; no pasa por `identityStatus` (FR-006, sin tocar).

### 5. Encontrable

Sin pantallas nuevas. `/verificar-identidad`, `/mi-perfil` y la cola siguen `noindex` con su
`metadata`.

## Qué se testea, y por qué

| Qué | Dónde | Por qué vale |
|---|---|---|
| `newestFirst`: días distintos en cualquier orden de entrada; mismo día, `sequence` mayor primero; mezcla de días con un día repetido; no muta la entrada | `rejections.test.ts` (Vitest) | Es la regla de «el último rechazo»: si se rompe, la persona recibe el consejo equivocado y quema un intento (KL-11-6), y quien revisa ve el orden al revés (US3). |
| `identityStatus` con dos rechazos del mismo día y motivos distintos, en los dos órdenes de entrada, y con el mismo motivo: `rejected` con el motivo de `sequence` mayor y `attemptsLeft: 1` | `identity-status.test.ts` | US1-AS1, US1-AS2: el defecto de KL-11-7. |
| `identityStatus` con tres rechazos del mismo día y con el tercero el mismo día que el segundo: `capped` con el motivo del último y el mismo `retryOn` que antes | `identity-status.test.ts` | US2-AS1, US2-AS2, FR-009: el motivo cambia, la fecha no. |
| `identityStatus` con días distintos: sigue el del día más reciente aunque tenga `sequence` menor | `identity-status.test.ts` | US1-AS3 y el borde «rechazos anteriores»: el día manda sobre el contador. |
| Dos pedidos de la misma cuenta rechazados el mismo día con `resolve_identity_request`: leídos con la sesión de la dueña, el segundo tiene `id` mayor, y el orden de `newestFirst` sobre lo leído pone primero el segundo motivo | `tests/db/identity.test.ts` | Todo el arreglo descansa en ese supuesto de la base (research §R2); si una migración futura lo rompe, este test lo dice. También prueba que la dueña puede leer el `id`. |

Los fixtures existentes de `identity-status.test.ts` (`rejected(day, reason)`) suman un
`sequence` creciente automático para no reescribir los casos de #11.

No se testea: las consultas (finas), `reviewRequestTexts` (solo pinta en el orden que recibe), las
pantallas. Sin e2e nuevo: el flujo crítico de #11 ya existe y esta historia no cambia su camino;
el caso del mismo día queda probado donde se calcula. La visibilidad de `identity_rejections` no
cambia y ya tiene sus tests de RLS.

## Documentación en este PR

- `docs/03-mvp-features.md` §1: la decisión del enjambre de la historia (2026-09-28,
  product-owner), textual (ya en esta rama).
- `docs/known-limitations.md`: se borran KL-11-6 y KL-11-7.
- Sin cambios en `docs/07` (sin dependencias) ni en `docs/10` (sin UI).

## Riesgos

- **El `id` como orden**: vale mientras las resoluciones de una cuenta sigan serializadas y los
  rechazos se inserten en el momento de resolver. Lo sostiene el test de base; si alguien cambia
  `resolve_identity_request`, falla ahí.
- **Rechazos sembrados a mano** (`tests/db/identity-support.ts#addRejections`, `seed.sql`) se
  insertan en el orden en que se escriben; un test que siembre dos del mismo día en orden
  «inverso» al que quiere tiene que saberlo. No afecta a producción.
