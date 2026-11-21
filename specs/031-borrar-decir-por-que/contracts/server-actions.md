# Contracts — Server Actions y queries

Todas devuelven `ActionResult<T>` y no lanzan; el `error` es una clave de i18n. Ninguna clave de
error nueva: los rechazos son los de hoy.

## `deletePet(input: unknown): Promise<ActionResult<null>>` — `src/actions/pet-status.ts` (cambia)

- Input (`petDeletionSchema`, `src/lib/schemas/pet-status.ts`):
  `z.strictObject({ petId: z.uuid(), reason: deletionAnswerSchema })`.
  Sin `reason`: la confirmación no mostró la pregunta.
- Llama `deletePetRecord(ownerId, petId, reason ?? null)`. Si vuelve `reasonCounted`, suma
  `deletionReasonEvent('pet', reason)` al `trackAll` que ya manda `deletedEvent(from)`.
- Resultados: los de hoy (`ok`, `pets.status.errors.not_found`, `pets.status.errors.session`,
  `pets.status.errors.failed`). Un `reason` inválido es `failed` por el schema, sin borrar.

## `deleteLitter(litterId: string, reason?: DeletionAnswer): Promise<ActionResult<null, LitterActionDetail>>` — `src/actions/litters.ts` (cambia)

- `reason` se valida con `deletionAnswerSchema` (nuevo, `src/lib/schemas/deletion-reason.ts`:
  `z.enum([...DELETION_REASONS, 'unanswered']).optional()`, el mismo que usa `petDeletionSchema`).
  Inválido →
  el `SAVE_FAILED` que `deleteLitter` ya devuelve hoy, sin borrar.
- Llama `deleteLitterRecord(ownerId, litterId, reason ?? null)`. Si vuelve `reasonCounted`, manda
  `trackAll([deletionReasonEvent('litter', reason)])`.
- Resultados: los de hoy (`not_found` sigue siendo `ok`).

## Queries — `src/lib/supabase/queries/`

- `deletePetRecord(ownerId, petId, reason: DeletionAnswer | null)` en `pet-status.ts`: pasa
  `p_reason` y devuelve `{ outcome: 'done', code, from, reasonCounted } | { outcome: 'not_found' }`.
- `deleteLitterRecord(ownerId, litterId, reason: DeletionAnswer | null)` en `litters.ts`: ídem con
  `released`.
- `deletionReasonSummary(): Promise<DeletionSummaryRow[]>` en `deletion-reasons.ts` (nuevo): llama
  `admin_deletion_reason_summary` con la sesión de quien mira (`createServerSupabase`), valida `kind`
  y `reason` con `oneOf`, y lanza si la base no responde (lo toma el `error.tsx` de Encuestas).

## Hooks — `src/hooks/`

- `usePetDeletion(petId, returnPath)` devuelve `remove(reason?: DeletionAnswer)`; manda `{ petId,
  reason }`. El resto igual.
- `useLitterDeletion(litterId, returnPath)` devuelve `remove(reason?: DeletionAnswer)`.

## Momento de medición — `src/lib/analytics/events.ts`

- `pet_deletion_reason: { kind: DeletionKind; reason: DeletionAnswer }`, armado por
  `deletionReasonEvent(kind, reason)` en `src/lib/analytics/deletion-reason-events.ts`. Sin la
  persona, el animal ni el día.
