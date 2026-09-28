# Data model: El estado de la verificación muestra el motivo del último rechazo

**Sin migraciones.** Ninguna tabla, columna, política ni función de la base cambia.

## Rechazo (tabla `identity_rejections`, de #11, sin cambios)

| Campo | Qué es | Cambio |
|---|---|---|
| `id` | contador interno, creciente en el orden de inserción | ahora se lee: es el desempate dentro del día (research §R2) |
| `user_id` | la cuenta | — |
| `rejected_on` | el día de Uruguay en que se resolvió | — |
| `reason` | `unreadable` · `mismatch` · `expired_document` · `suspected_fraud` | — |

Visibilidad (sin cambios, RLS de #11): la dueña lee los suyos; quien administra, los de una cuenta
con un pedido vigente. Leer `id` no amplía nada: es la misma fila, ya legible por las mismas
personas, y el `id` no dice nada de la persona.

## `Rejection` (dominio, TypeScript)

Se muda de `lib/supabase/queries/identity-rows.ts` a `lib/verification/rejections.ts`, para que
`identity-status.ts` y la cola usen el mismo tipo (hoy `IdentityRecord` lo repite en línea):

```ts
type Rejection = { rejectedOn: string; reason: RejectionReason; sequence: number }
```

- `sequence`: el `id` de la fila. Solo sirve para ordenar; no se muestra nunca.
- `toRejections(rows)` pasa a mapear `{ id, rejected_on, reason }` y descarta, como hoy, un motivo
  que no sea de la lista.

## Regla: `newestFirst(rejections)`

Orden total: `rejectedOn` descendente; a igual día, `sequence` descendente. Devuelve una copia
(no muta la entrada). El primero es «el último rechazo» (spec §Vocabulario).

## Estado del pedido (`identityStatus`, sin cambio de forma)

- `rejected`: `on`, `reason` salen del primero de `newestFirst(recent)`; `attemptsLeft` sigue
  siendo `3 − recent.length`.
- `capped`: `on`, `reason` del primero; `retryOn` del tercero (índice `CAP − 1`) + 30 días, como
  hoy. Con el nuevo orden el tercero puede ser otra fila del mismo día, pero su día es el mismo,
  así que la fecha no cambia (FR-009, SC-004).
