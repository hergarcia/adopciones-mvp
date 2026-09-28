# Research: El estado de la verificación muestra el motivo del último rechazo

## R1. Por qué hoy sale el primer rechazo del día

- `identityStatus` (`src/lib/verification/identity-status.ts`) ordena los rechazos con
  `toSorted((a, b) => b.rejectedOn.localeCompare(a.rejectedOn))` y toma `recent[0]`. Con dos
  rechazos del mismo día el comparador devuelve 0, el orden estable conserva el de la base, y
  `getMyIdentity` los lee sin `order`: en la práctica, en orden de inserción, así que el primero
  del día queda primero (KL-11-6, KL-11-7).
- `getReviewRequest` (`src/lib/supabase/queries/review-queue.ts`) ordena solo por
  `rejected_on desc`: dentro del día, el orden queda librado a la base (US2-AS5 de #11).
- La base ya desempata bien en un solo lugar: `identity_retry_on` ordena por
  `rejected_on desc, j.id desc`. La fecha del tope no depende del desempate (todos los del día dan
  el mismo `rejected_on + 30`), y no cambia (FR-009).

## R2. Cómo saber cuál se resolvió último sin guardar nada nuevo

- **Decision**: usar el `id` que `identity_rejections` ya tiene (`bigint generated always as
  identity`). Dentro de un mismo día, el rechazo con el `id` mayor es el último resuelto.
- **Rationale**: `resolve_identity_request` toma `lock_identity_account(v_owner)` antes de
  insertar el rechazo, así que dos resoluciones de la misma cuenta nunca corren a la vez; la
  secuencia de identidad da valores crecientes a inserciones serializadas. Funciona para las filas
  que ya existen (spec §Edge Cases, «Rechazos anteriores a este arreglo») sin migración, y no
  agrega ningún dato sobre la persona (FR-002): el `id` es un contador interno, no una hora.
- **Alternatives considered**:
  - Guardar la hora del rechazo (`rejected_at timestamptz`): la historia lo excluye («guardar algo
    más de cada rechazo que el día y el motivo») y es un dato nuevo sobre la persona. Descartado.
  - Una columna `position` por cuenta: una migración y un cálculo para lo que el `id` ya da.
    Descartado.
  - Cruzar con `identity_resolutions` (tiene quién resolvió): suma una lectura que la persona no
    puede hacer (RLS) y no da un orden mejor. Descartado.

## R3. Dónde vive la regla del orden

- **Decision**: una función pura con nombre, `newestFirst`, en
  `src/lib/verification/rejections.ts`, que ordena por día descendente y, dentro del día, por
  `sequence` descendente. La usan `identityStatus` (estado y «Sin intentos») y `getReviewRequest`
  (cola). La consulta de la cola deja de ordenar en la base: una sola regla, en un solo lugar,
  con su test.
- **Rationale**: el orden es una regla de negocio que, si se rompe, engaña a la persona (docs/09
  §Qué vale la pena testear); en SQL de una consulta fina quedaría sin test. Hoy la regla ya está
  repetida (la consulta y `identityStatus` la escriben cada una a su manera), que es justo la
  causa del defecto.
- **Alternatives considered**: `.order('rejected_on').order('id')` en las dos consultas y
  confiar en el orden de llegada en `identityStatus`: dos lugares que tienen que coincidir y
  ninguno con test. Descartado.

## R4. Nada de UI

- No cambia ningún texto, componente ni pantalla: cambia qué rechazo llega a los que ya existen.
  El resumen de «Mi perfil» muestra `status.on`, que pasa a ser el día del último rechazo, que es
  el mismo día. Sin carga de `frontend-design` más allá de confirmar que no hay nada visual que
  diseñar.
