# Data model: solicitudes que esperan la identidad

Una migración forward-only: `supabase/migrations/20261108120000_held_applications.sql`. Después,
`pnpm db:types`.

## Tabla nueva `public.held_applications`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` pk default `gen_random_uuid()` | |
| `applicant_id` | `uuid` not null → `auth.users` on delete cascade | se borra con la cuenta |
| `pet_id` | `uuid` → `public.pets` on delete set null | nulo: el animal se borró (ya `lapsed`) |
| `publisher_id` | `uuid` → `auth.users` on delete set null | el dueño al escribirla |
| `attempt_id` | `uuid` not null | unique (`applicant_id`, `attempt_id`); al salir pasa a la solicitud |
| `answers` | `jsonb` | `check private.application_answers_shape(answers)` cuando no es nulo |
| `pet_name` | `text` not null | el nombre al escribirla, actualizado al no salir |
| `litter_name` | `text` | la camada de una cría, para la línea si se borra |
| `status` | `text` not null default `'waiting'` | `check in ('waiting', 'lapsed')` |
| `lapse_reason` | `text` | `check in ('expired','withdrawn','adopted','unpublished','not_receiving','you_blocked','suspended','capped')` |
| `written_at` | `timestamptz` not null default `now()` | el día que se muestra |
| `expires_at` | `timestamptz` not null | `written_at + private.held_ttl()` |
| `changed_at` | `timestamptz` not null default `now()` | |

Constraints: `(status = 'lapsed') = (lapse_reason is not null)`; `(status = 'waiting') = (answers is
not null)`. Índices: unique parcial (`applicant_id`, `pet_id`) where `status = 'waiting'`;
(`applicant_id`, `written_at desc`); (`pet_id`) where `status = 'waiting'`; (`expires_at`) where
`status = 'waiting'`.

RLS prendida, sin políticas; `revoke all` a `anon` y `authenticated`. Comentario de tabla con la
regla de FR-017/FR-018.

## Tabla nueva `public.held_application_moments`

Bandeja de momentos para la medición, sin persona ni animal: `id bigint generated always as
identity`, `kind text check in ('released','lapsed')`, `reason text` (nulo con `released`),
`applicant_level smallint`, `publisher_level smallint`, `litter boolean not null`, `created_at
timestamptz default now()`. RLS sin políticas; la toma `claim_held_application_moments(p_limit)`
(`service_role`), que borra lo que devuelve.

## Funciones

| Función | Nueva / redefinida | Quién | Qué |
|---|---|---|---|
| `private.held_ttl()` | nueva | — | `interval '14 days'`, paridad con `HELD_TTL_DAYS` |
| `private.queue_new_application_notice(p_app uuid)` | nueva | — | la regla del correo de solicitud nueva (#65, #257), en un lugar |
| `private.lapse_held_applications(p_ids uuid[], p_reason text)` | nueva | — | pasa a `lapsed` con motivo, `answers = null`, guarda nombre y camada, anota el momento; la usan los triggers, la tarea, el tope y el retiro |
| `public.hold_application(p_applicant, p_attempt, p_code, p_answers, p_pending_ttl)` | nueva | `service_role` | R3 |
| `public.submit_application(...)` | redefinida | `service_role` | `has_held`, el límite cuenta las que esperan, usa `queue_new_application_notice` |
| `private.release_held_applications(p_user uuid)` | nueva | — | R4; devuelve `setof` (id, outcome, pet_name, until, applicant_level, publisher_level, litter) |
| `public.held_applications_tick()` | nueva | `pg_cron` | R5: vence y suelta |
| `public.resolve_identity_request(...)` | redefinida | `service_role` | suelta al aprobar, `capped` al tope, devuelve `held jsonb` |
| `public.claim_identity_expiry_notices()` | redefinida | `service_role` | devuelve también `held jsonb` |
| `public.withdraw_held_application(p_user, p_id)` | nueva | `service_role` | R6 |
| `public.my_held_applications()` | nueva | `authenticated` | R7 |
| `public.my_held_application(p_id)` | nueva | `authenticated` | la confirmación |
| `public.apply_context(...)` | redefinida | `service_role` | `my_held_id`, `identity_in_review`, `active_count` con las que esperan, la lista del límite |
| (en `apply_context`) `last_answers` | redefinida con ella | — | toma también la última que espera |
| `public.claim_held_application_moments(p_limit)` | nueva | `service_role` | R10 |
| `public.pet_lifecycle_tick()` | redefinida | `pg_cron` | suma la condición de momentos sin tomar |

## Triggers nuevos

`held_applications_lapse_on_pet_change` (after update of `status`, `taken_down_at` on `pets`),
`held_applications_lapse_on_pet_delete` (before delete on `pets`),
`held_applications_lapse_on_block` (after insert on `blocks`),
`held_applications_lapse_on_suspension` (after insert on `account_suspensions`).

## `pg_cron`

`select cron.schedule('held-applications', '*/5 * * * *', $job$select public.held_applications_tick();
select private.task_ran('held-applications')$job$);` y su fila en la vigilancia de tareas
(`ROUTE_TASKS` / la lista que lee `task_watch`).

## Transiciones

```
(nada) --hold_application--> waiting
waiting --release (aprobación o tarea)--> [fila borrada] + applications(sent, sent_at = now())
waiting --plazo / retiro / cierre / bloqueo / suspensión / tope--> lapsed(reason, answers = null)
```

`hold_application` con nivel 2 no crea fila: delega y crea la solicitud.
