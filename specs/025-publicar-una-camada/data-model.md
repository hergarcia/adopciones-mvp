# Data Model: Publicar una camada (#205)

Una sola migración nueva, `supabase/migrations/<timestamp>_litters.sql`, forward-only. Después,
`pnpm exec supabase db reset` y `pnpm db:types`.

## `public.litters` (nueva)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk | `gen_random_uuid()` |
| `owner_id` | `uuid` not null | FK `auth.users` `on delete cascade` (FR-047) |
| `attempt_id` | `uuid` not null | `unique (owner_id, attempt_id)`: publicar dos veces es una camada (FR-016) |
| `code` | `text` not null unique | del pozo `pet_codes` (R3); un trigger lo asigna y otro impide cambiarlo |
| `name` | `text` not null | 1–120 puntos de código; los 30 grafemas los cuenta el schema, como `pets.name` |
| `species` | `text` not null | `dog` \| `cat` |
| `age_value`, `age_unit`, `age_as_of` | como `pets` | mismos checks |
| `size` | `text` not null | `small` \| `medium` \| `large` |
| `is_neutered`, `has_chip` | `boolean` not null | |
| `vaccines` | `text` not null | `up_to_date` \| `incomplete` \| `none` |
| `good_with_kids`, `good_with_dogs`, `good_with_cats` | `text` not null default `unknown` | `yes` \| `no` \| `unknown` |
| `description` | `text` null | ≤ 8000 puntos de código; 2000 caracteres en el schema |
| `department`, `locality` | como `pets` | mismos checks |
| `is_urgent` | `boolean` not null default false | |
| `required_level` | `smallint` not null default 1 | 1 \| 2, como `pets.required_level` |
| `delivers_from` | `date` null | ≥ `uruguay_today()` al cambiar (en las funciones, R6) |
| `taken_down_at`, `takedown_reason`, `takedown_note` | como `pets` | la baja de #59 |
| `language` | `text` not null default `es` | |
| `published_at`, `updated_at` | `timestamptz` | `touch_updated_at` |

Índices: `(owner_id, published_at desc)` para «Mis animales»; `(published_at desc, code desc)
where taken_down_at is null` para el listado. RLS activada; una sola policy de lectura,
`owner_id = (select auth.uid())`. Ninguna policy de escritura: se escribe por las funciones
`security definer` (como `pets`).

## `public.pets` (cambia)

| Cambio | Regla |
|---|---|
| `litter_id uuid null` | FK `litters` `on delete cascade`. Con valor, la fila es una cría |
| `name_key text generated always as (lower(btrim(name))) stored` | |
| `constraint pets_litter_name_unique unique (litter_id, name_key) deferrable initially deferred` | dos crías no se llaman igual (FR-008); `null` en `litter_id` no choca |
| índice `(litter_id) where litter_id is not null` | leer las crías de una camada |

Una cría tiene lo común copiado de su camada (R1), `status = 'available'`,
`expires_at = 'infinity'` (R2), `required_level` y `taken_down_at` copiados, y su `description`
propia (≤ 300 en el schema). Los triggers de `pets` siguen: código, `applications_close_on_pet_*`.
El de revisión (`pets_review_on_insert`) se salta las crías.

## `public.pet_photos` (cambia)

| Cambio | Regla |
|---|---|
| `litter_id uuid null` | FK `litters` `on delete cascade` |
| check `pet_id is null or litter_id is null` | una foto es de un animal, de una cría o de una camada |
| `pet_photos_attached_has_position` | pasa a `((pet_id is null and litter_id is null) = (position is null))` |
| `pet_photos_released_detached` | pasa a `released_at is null or (pet_id is null and litter_id is null)` |
| `unique (litter_id, position) deferrable initially deferred` | como el de `pet_id` |
| índice `(litter_id) where litter_id is not null` | |

De 1 a 5 fotos por camada y de 0 a 5 por cría: lo controlan `publish_litter` y `save_litter`.

## `public.pet_reviews` (cambia)

`pet_id` pasa a nullable; suma `litter_id uuid null` (FK `on delete cascade`, único); check
`num_nonnulls(pet_id, litter_id) = 1`. Trigger `litters_review_on_insert` crea la revisión `new`.

## Funciones nuevas o recreadas

Todas `security definer`, `set search_path = ''`, con `revoke all` y `grant` explícitos como las
de #57 y #59.

| Función | Quién la llama | Hace |
|---|---|---|
| `private.litter_is_shown(litters)` | otras funciones | sin baja y `pet_is_listed(owner)` |
| `private.litter_available_count(uuid)` | listado, ficha | crías de la camada; #206 lo cambia por las disponibles |
| `public.publish_litter(...)` | `authenticated` vía action | R6; errores `needs_verification`, `photos_invalid`, `young_count`, `young_name_taken`, `delivery_date_past` |
| `public.save_litter(...)` | ídem | R6; además `not_found`, `taken_down`, `changed_elsewhere`; devuelve el código y las fotos que quedaron sueltas (las de la camada que se sacaron y las de las crías quitadas) |
| `public.preview_litter_removal(uuid, uuid[])` | `authenticated`, la dueña por `auth.uid()` | cuántas solicitudes abiertas tienen esas crías; de una camada ajena, cero |
| `public.delete_litter(uuid, uuid)` | `service_role` vía action, como `delete_pet` | borra camada y crías; sus fotos quedan sueltas y la acción las borra enseguida (si falla, la purga) |
| `public.litter_by_code(text)` | `anon`, `authenticated` | R5: `visibility`, `is_owner`, lo común, `photos`, `young`, publicador, `version`, baja para la dueña |
| `public.litter_share_card(text)` | `anon`, `authenticated` | la vista previa: portada, nombre, zona; nada si no está a la vista |
| `public.listed_pets(...)` | `anon`, `authenticated` | R4: se borra y se recrea con `kind`, `young_count`, `available_count` |
| `public.pet_review_queue(integer)`, `public.count_pet_reviews()` | admin | R8: suman camadas |
| `private.waiting_reviews()` | la lista, su cuenta y `admin_queue_rows` | la única definición de «espera revisión» para un animal y una camada; el inicio de Administrar cuenta la camada como una publicación (cambio de la US5) |
| `private.review_photos(uuid, uuid)` | `pet_review_queue` | las fotos de un animal, una cría o una camada, en orden |
| `public.resolve_litter_review(...)` | admin | R8 |
| `public.pet_by_code(text)` | `anon`, `authenticated` | suma `litter_code`: si la fila es una cría, la ficha redirige |
| `private.pet_photo_object_listed`, `private.pet_photo_object_in_review` | policies de storage | R5 |
| `change_pet_status`, `delete_pet`, `save_pet`, renovar, volver a publicar | ya existen | rechazan una cría con `litter_young` (R2) |

«Mis animales» lee `litters` con sus crías y su portada por la RLS de la dueña, como `listMyPets` lee
`pets`: una función `my_litters()` no agregaba nada (cambio de la US1).

Una cría nace con `published_at = clock_timestamp()`: dentro de la transacción de publicar cada
una queda después de la anterior, y ese es el orden en que se muestran.

## Estados que se derivan (sin columna)

- **Camada a la vista**: `litter_is_shown`.
- **Fecha de entrega visible**: `delivers_from >= uruguay_today()` (se calcula en
  `lib/litters/delivery-date.ts` con el día de Uruguay, FR-030).
- **Disponibles**: `litter_available_count` (todas las crías en esta historia).
