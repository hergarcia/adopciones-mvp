# Data model — Al borrar un animal que no se adoptó, decir por qué

Una migración: `supabase/migrations/<ts>_deletion_reasons.sql`. Días en hora de Uruguay
(`public.uruguay_today()`).

## Reglas cerradas

- Clases (`kind`): `pet` · `litter`.
- Respuestas (`reason`): `no_applications` (No llegaron solicitudes) · `unconvincing_applications`
  (Las solicitudes que llegaron no me convencieron) · `given_elsewhere` (Lo/La di en adopción por
  Facebook, Instagram o WhatsApp) · `not_for_adoption` (Ya no está en adopción) · `other` (Otra
  cosa) · `unanswered` (sin contestar).
- La misma lista vive en `src/lib/pets/deletion-reason.ts`; la prueba de la base compara las dos.

## Tabla

### `public.deletion_reasons` — sin persona ni animal (FR-024, FR-025)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk | `gen_random_uuid()` |
| `kind` | `text not null` | `check (kind in ('pet','litter'))` |
| `reason` | `text not null` | `check (reason in ('no_applications','unconvincing_applications','given_elsewhere','not_for_adoption','other','unanswered'))` |
| `deleted_on` | `date not null` | `default public.uruguay_today()` |

- RLS encendida, sin políticas; `revoke all on table ... from anon, authenticated`.
- Índice `(kind, reason)` para el resumen.
- Sin FK: borrar una cuenta, un animal o una camada no la toca (FR-023).

## Funciones (`security definer`, `set search_path = ''`)

| Función | Para | Qué cambia |
|---|---|---|
| `public.delete_pet(p_owner uuid, p_pet uuid, p_reason text default null)` → `table (outcome text, code text, from_state text, photo_ids uuid[], reason_counted boolean)` | `service_role` (como hoy) | Se reemplaza la de dos parámetros (`drop function public.delete_pet(uuid, uuid)` y `create`). Con `p_reason` no nulo y el estado leído con `for update` en `available`, `in_process`, `paused` o `expired`, después del `delete` inserta `(kind 'pet', reason p_reason)` y devuelve `reason_counted = true`. Con `not_found`, nulo o un estado sin pregunta, no inserta. Un `p_reason` fuera de la lista lo rechaza el `check` y la transacción entera vuelve atrás. |
| `public.delete_litter(p_owner uuid, p_litter uuid, p_reason text default null)` → `table (outcome text, code text, released uuid[], reason_counted boolean)` | `service_role` (como hoy) | Lo mismo con `private.litter_state(v_litter)` distinto de `adopted` y `taken_down`, leído antes de liberar fotos y borrar; inserta `(kind 'litter', reason p_reason)`. |
| `public.admin_deletion_reason_summary()` → `table (kind text, reason text, total int)` | `authenticated` | Las doce combinaciones `kind × reason` con su cuenta (cero incluido), `where private.is_admin()`; vacío si no administra. |

`execute` revocado a `public` y `anon` en todas; `delete_pet` y `delete_litter` siguen solo para
`service_role`; la de resumen, concedida a `authenticated`. Las grants de las firmas viejas se van con
el `drop`.

## Estados de un borrado

```
abrir la confirmación
  ├─ estado sin pregunta (adoptado, dado de baja, camada adoptada) → confirmación de hoy, p_reason nulo
  └─ estado con pregunta → pregunta, ninguna elegida
        elegir / cambiar / tocar otra vez para dejar sin elegir
        «No borrar» o cerrar → nada (se limpia lo elegido)
        «Borrar para siempre» → delete_* con p_reason = elegida ?? 'unanswered'
             ├─ done y estado con pregunta al borrar → fila nueva, reason_counted
             ├─ done y estado sin pregunta al borrar (otra pestaña) → sin fila
             ├─ not_found (doble toque, reintento, otra pestaña) → sin fila
             └─ no llegó → sin fila; la confirmación sigue con lo elegido
```

## Tipos en el código

`src/lib/pets/deletion-reason.ts`:

- `DELETION_REASONS = ['no_applications','unconvincing_applications','given_elsewhere','not_for_adoption','other'] as const`,
  `DeletionReason`, `DeletionAnswer = DeletionReason | 'unanswered'`, `DeletionKind = 'pet' | 'litter'`.
- `petAsksDeletionReason(state: PetState)`, `litterAsksDeletionReason(state: LitterState)`,
  `deletionAnswerOf(selected: string): DeletionAnswer` (vacío o desconocido → `unanswered`).

`src/lib/surveys/deletion-summary.ts`:

- `DeletionSummaryRow = { kind, reason, total }` y `DeletionSummary = { asked, answered, unanswered,
  byKind: Record<DeletionKind, { asked, answered, unanswered }>, options: { option, total, byKind:
  Record<DeletionKind, number> }[] }`, armado por `deletionReasonSummary(rows)`.

`src/lib/supabase/types.ts` se regenera con `pnpm db:types`.
