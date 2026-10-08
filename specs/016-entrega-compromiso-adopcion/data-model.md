# Data model — La entrega y el compromiso de adopción

Una migración nueva, forward-only: `supabase/migrations/<timestamp>_adoptions.sql`. Después,
`pnpm db:types`. Todo en `public` salvo los helpers en `private`, como #63 y #65.

## Nueva: `public.adoptions` (R1)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `pet_id` | `uuid` not null | FK `pets(id) on delete cascade` (FR-063: borrar el animal la borra) |
| `publisher_id` | `uuid` not null | FK `auth.users(id) on delete cascade` |
| `kind` | `text` not null | check `kind in ('site', 'outside')` |
| `application_id` | `uuid` | FK `applications(id) on delete set null`; null con `outside` |
| `adopter_id` | `uuid` | FK `auth.users(id) on delete set null`; null con `outside` |
| `includes_neuter` | `boolean` | not null con `site` (= `not pets.is_neutered` al marcar, FR-011); null con `outside` |
| `attempt_id` | `uuid` not null | único con `pet_id` (doble toque, R3) |
| `marked_at` | `timestamptz` not null | `now()`; el día en que aceptó quien lo dio |
| `adopter_accepted_at` | `timestamptz` | null hasta aceptar |
| `declined_at` | `timestamptz` | «Yo no adopté» |
| `contact_cut_at` | `timestamptz` | bloqueo o suspensión (R4); nunca vuelve a null |
| `ended_at` | `timestamptz` | volver a publicar (R6) |

Checks:

- `kind = 'outside'` ⇒ `application_id`, `adopter_id`, `includes_neuter`, `adopter_accepted_at`,
  `declined_at`, `contact_cut_at` son null (FR-061: nada de la persona).
- `kind = 'site'` ⇒ `includes_neuter is not null`. `application_id` y `adopter_id` pueden quedar
  null solo por el borrado de la cuenta de quien adoptó (FR-063).
- `adopter_accepted_at is null or declined_at is null` (no las dos).

Índices: `adoptions_current_idx unique (pet_id) where ended_at is null` (una vigente por animal);
`adoptions_application_idx (application_id)`; `adoptions_adopter_idx (adopter_id) where adopter_id
is not null`; `adoptions_publisher_idx (publisher_id)`; único `(pet_id, attempt_id)`.

RLS encendida, sin políticas, `revoke all on public.adoptions from anon, authenticated` (R2).

Un disparador `adoptions_forward_only` (`before update`): `marked_at`, `kind`, `pet_id`,
`publisher_id`, `includes_neuter` no cambian; cada fecha pasa de null a un valor y no vuelve
(`adopter_id`/`application_id` solo pueden pasar a null por el `set null` del borrado).

## Cambia: `public.applications`

- `applications_close_reason_valid`: suma `handed_over` (la elegida, FR-006).
- `applications_forward_only`: suma la excepción `handed_over → adopted` con `status = 'closed'`
  («Yo no adopté», R5).

## Cambia: `public.application_notices`

- `application_notices_kind_valid`: suma `adoption_marked`, `commitment_accepted`,
  `adoption_declined` (R7).

Todas las funciones nuevas o recreadas: `set search_path = ''`, nombres calificados con su esquema,
`revoke all on function … from public` antes del `grant`, como #65.

## Funciones nuevas — lectura (`security definer`, `auth.uid()` adentro, `grant` a `authenticated`)

- `handover_candidates(p_pet uuid)` → cero filas si el animal no es de quien mira o no se puede
  marcar adoptado. Una fila por solicitud `accepted` del animal, la más vieja primero:
  `application_id, applicant_public_id, applicant_name, applicant_has_photo, applicant_level,
  accepted_at`. Y una función hermana `handover_pet(p_pet)` → `pet_id, name, sex, code, state,
  is_neutered, publisher_name` (lo que el compromiso necesita).
- `my_pet_adoptions()` → para cada animal propio con una adopción vigente: `pet_id, kind,
  adopter_name` (null si borró la cuenta), `declined boolean`, `adopter_accepted_at`,
  `marked_at`, `ends_person boolean` (la confirmación de R6: `site` con persona y sin `declined`).
  Nada más (FR-040).
- `adoption_of(p_application uuid)` → una fila si quien mira es quien lo dio, o quien adoptó y no
  dijo «Yo no adopté»: `side ('publisher' | 'adopter'), pet_name, pet_sex, includes_neuter,
  publisher_name, adopter_name` (de hoy), `marked_at, adopter_accepted_at, declined_at, ended_at,
  contact_cut boolean, adopter_suspended boolean`. La adopción más reciente de esa solicitud.
- `my_applications()` y `my_application(p_id)` se recrean: suman `adoption text` — `pending`,
  `accepted`, `ended` o null — solo con `close_reason = 'handed_over'` y sin `declined_at`.
- `publisher_application(p_id)` se recrea: `publisher_close` suma `handed_over`.
- `application_contact(p_id)` se recrea con la regla de R4.

## Funciones nuevas — escritura (`security definer`, `grant` solo a `service_role`)

- `mark_pet_adopted(p_owner uuid, p_pet uuid, p_application uuid, p_attempt uuid)` →
  `outcome text, detail text, code text, name text, sex text, from_state text, published_at
  timestamptz, accepted_at timestamptz, accepted_count integer` (R3; lo que las métricas
  necesitan sale de acá).
- `accept_commitment(p_adopter uuid, p_application uuid)` → `outcome text, marked_at
  timestamptz` (R5).
- `decline_adoption(p_adopter uuid, p_application uuid)` → `outcome text, marked_at timestamptz`
  (R5).
- `commitment_for_email(p_application uuid)` → lo de `adoption_of` sin `side`, más la portada
  (`cover_id, cover_owner`) y `recipient` resuelto por la notice (R7).

## Cambian

- `change_pet_status`: `mark_adopted` devuelve `changed` (ya no adopta: R3); `republish` desde
  `adopted` termina la adopción vigente (R6) y devuelve también `days_since_marked` para el evento.
- `applications_close_on_block`: suma `update adoptions set contact_cut_at = now()` de las
  vigentes con `contact_cut_at is null` y `declined_at is null` entre las dos personas, en las dos
  direcciones.
- `applications_close_on_suspension`: idem para las vigentes donde la persona es `publisher_id` o
  `adopter_id`.
- `applications_close_on_pet_change`: sin cambios de contrato; la elegida ya está cerrada con
  `handed_over` cuando el animal pasa a `adopted`, así que no recibe `closed_adopted`.

## Borrado de cuenta

- Quien adoptó: `applications` cae en cascada → `adoptions.application_id` y `adopter_id` quedan
  null (`set null`) y sus `application_notices` caen. El animal queda «Adoptado» sin a quién.
- Quien lo dio: sus animales se borran → `adoptions` cae en cascada (FR-063).
