# Data Model: Camadas: mantener al día, responder, entregar y seguir cada cría

Una migración nueva, `supabase/migrations/<ts>_litter_lifecycle.sql`, forward-only. Sin datos
personales nuevos (FR-040). Decisiones y alternativas en [research.md](./research.md).

## Tablas que cambian

### `litters` (de #205)

| Columna | Tipo | Regla |
|---|---|---|
| `paused_at` | `timestamptz null` | no nulo mientras la camada está pausada (R1) |
| `expires_at` | `timestamptz not null` | 30 días desde publicar, renovar, reanudar o volver a publicar; la migración la pone en `now() + private.pet_lifetime()` a las ya publicadas (R3, FR-001) |
| `reminder_sent_at` | `timestamptz null` | el correo de este vencimiento ya se tomó (R5) |
| `expiry_counted_at` | `timestamptz null` | el vencimiento ya se midió (R5) |

Índice parcial `litters_reminder_due_idx on (expires_at) where reminder_sent_at is null and
taken_down_at is null and paused_at is null`.

Trigger `litters_sync_young_expiry` (`after update of expires_at`): copia `expires_at` a sus crías.
`publish_litter` pone `expires_at = now() + pet_lifetime()` a la camada y a cada cría.

### `pets` (crías)

| Columna | Tipo | Regla |
|---|---|---|
| `resume_status` | `text null` | `available` o `in_process`; solo en una cría pausada con su camada (R2) |

Restricciones: `pets_resume_status_valid check (resume_status in ('available', 'in_process'))`,
`pets_resume_status_young check (resume_status is null or (status = 'paused' and litter_id is not null))`.
Trigger `pets_clear_resume_status` (`before update of status`): si `new.status <> 'paused'`,
`new.resume_status := null`.

Una cría nueva (`save_litter`) nace con el `expires_at` de su camada y, si la camada está pausada,
`status = 'paused'`, `resume_status = 'available'`.

### `pet_renewal_links` (de #59)

`pet_id` pasa a nulo posible y se suma `litter_id uuid references litters(id) on delete cascade`, con
`pet_renewal_links_one_subject check (num_nonnulls(pet_id, litter_id) = 1)` (R5).

### `applications` (de #63)

| Columna | Tipo | Regla |
|---|---|---|
| `litter_name` | `text null` | el nombre de la camada copiado al cerrar la solicitud de una cría que se adoptó, se quitó o se dio de baja, como `pet_name` (R8) |

## Estados

### Cría (`pets.status` de una fila con `litter_id`)

```
            mark_in_process            mark_available (adopción termina)
 available ─────────────────▶ in_process        adopted ───────────────▶ available
     ▲  ◀─────────────────────    │                ▲
     │       mark_available       │ mark_pet_adopted (#67)
     │                            ▼                │
     └──── resume (resume_status) paused ──────────┘
              ▲ pause (camada)
```

- `mark_in_process` y `mark_available` solo con la camada `available`; `mark_pet_adopted` también con
  la camada pausada o vencida (Edge Cases de la spec).
- Quitar (`delete_young`) desde cualquier estado salvo con la camada dada de baja.

### Camada (`private.litter_state(l)`, calculado)

`taken_down` › `adopted` (todas sus crías adoptadas) › `paused` (`paused_at`) › `expired`
(`expires_at <= now()`) › `available`.

| Desde | Acción | Hacia | Nivel 1 |
|---|---|---|---|
| available | pause | paused | no |
| available | renew | available, 30 días nuevos | sí |
| paused | resume | available, 30 días nuevos, cada cría a su `resume_status` | sí |
| expired | republish | available, 30 días nuevos, `published_at = now()`, crías como estaban | sí |
| adopted | republish (`p_young`) | available, 30 días nuevos, `published_at = now()`, las elegidas disponibles y sus adopciones terminadas | sí |
| cualquiera salvo borrada | delete_litter / quitar la última | borrada | no |

## Funciones nuevas

| Función | Quién la llama | Qué hace |
|---|---|---|
| `private.litter_state(l litters) returns text` | las demás | el estado calculado (R1) |
| `public.change_litter_status(p_owner, p_litter, p_action, p_pending_ttl, p_young uuid[] default null)` | `service_role` desde la acción | pausar, reanudar, renovar, volver a publicar (R4); devuelve `outcome, code, name, from_state, state, expires_at, ended_count, ended_marked_at timestamptz[]` |
| `public.change_young_status(p_owner, p_pet, p_action)` | `service_role` | `mark_in_process`, `mark_available` (R4); devuelve `outcome, code (de la camada), litter_id, name, sex, litter_name, from_state, state, litter_state, published_at, ended_marked_at` |
| `public.delete_young(p_owner, p_pet)` | `service_role` | quita una cría o, si es la única, la camada; devuelve `outcome (young_deleted · litter_deleted · not_found · taken_down), litter_code, from_state` |
| `public.create_litter_renewal_link(p_litter, p_token_hash)` | `service_role` (cron) | enlace «Sigue disponible» de la camada |
| `public.claim_litter_reminders(p_limit)` | `service_role` (cron) | toma las camadas a 7 días: `litter_id, owner_id, name, expires_at` (la portada del correo sale de `renewal_link_view` por el token, como la de un animal) |
| `public.claim_litter_expiries(p_limit)` | `service_role` (cron) | toma las camadas vencidas sin medir |

## Funciones que cambian

| Función | Cambio |
|---|---|
| `publish_litter`, `save_litter` | `expires_at` de la camada y de cada cría; cría nueva en camada pausada nace pausada |
| `delete_litter` | borra las crías antes que la camada (R8) |
| `listed_pets`, `private.litter_available_count` | solo camadas `available`; recuento por estado; `status` `in_process` sin disponibles; sexo sobre crías disponibles o en proceso (R6) |
| `litter_by_code` | `state` de la camada, `state` de cada cría; `paused`/`expired` sin datos para quien no la publicó (R6) |
| `litter_share_card` | adoptada con `adopted = true`; pausada o vencida, nada |
| `claim_pet_reminders`, `claim_pet_expiries` | `and p.litter_id is null` |
| `renew_by_link`, `renewal_link_view` | rama de camada (R5) |
| `pet_lifecycle_tick` | despierta al cron también por camadas debidas |
| `reactivate_account` | corre `litters.expires_at` con el tiempo suspendida |
| `publisher_inbox` | `litter_id`, `litter_code`, `litter_name`; filas en cero para las crías sin solicitudes de una camada con alguna (R7) |
| `inbox_pet` | `litter_name`, `litter_code` |
| `applications_close_on_pet_change`, `applications_close_on_pet_delete` | copian `litter_name` |
| `my_applications`, `my_application`, `claim_application_notices`, `commitment_for_email`, `follow_up_answered_for_email`, `handover_pet` | suman `litter_name` (y `litter_id` las dos últimas, para volver al panel). `handover_candidates` no: es una fila por persona y la camada es del animal; `claim_follow_up_events` tampoco: solo mide, y el pedido de seguimiento sale por `claim_application_notices` |
| `accept_application`, `mark_pet_adopted` | suman `in_litter` a la salida (R12); `mark_pet_adopted` también `litter_id` y `litter_code` para volver al panel y revalidar la ficha, y la elegida guarda `litter_name` |
| `my_pets_survey` | sin cambio: ya ofrece por animal; la página la ubica en la fila de la cría |

Todas `security definer`, `set search_path = ''`, `revoke all ... from public, anon, authenticated` y
`grant execute` solo a quien la llama, como las de #59 y #205. `src/lib/supabase/types.ts` se regenera
con `pnpm db:types`.

## Visibilidad (constitución V)

- Una camada pausada o vencida: `litter_by_code`, `litter_share_card`, `listed_pets` y las fotos de
  storage (`private.pet_photo_object_listed`) no devuelven nada a quien no la publicó (FR-019).
- `publisher_inbox`, `inbox_pet` y `pet_applications` siguen filtrando por `auth.uid()` como dueña
  (FR-027).
- Quien fue aceptada para una cría lee por `application_contact` solo el contacto de quien publicó,
  como en #65; nada de las solicitudes de las demás crías.
- Tests en `tests/db/litter-lifecycle-privacy.test.ts` (plan §Qué se testea).
