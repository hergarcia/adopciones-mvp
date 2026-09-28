# Data Model: Ver los animales publicados con filtros y compartir la ficha de cada uno

Una migración, `supabase/migrations/<timestamp>_listed_pets.sql`. Forward-only. No cambia ninguna
policy existente ni ningún grant sobre tablas: lo público sale solo por las funciones de abajo
(research R1).

## Cambios en tablas

### `public.pet_codes` (nueva)

El registro de todos los códigos de enlace que se usaron alguna vez. No tiene FK a `pets`: sobrevive
al borrado del animal para que su código no se reuse (FR-010).

| Columna | Tipo | Regla |
|---|---|---|
| `code` | `text` primary key | `check (code ~ '^[0-9a-hjkmnp-tv-z]{10}$')` |
| `created_at` | `timestamptz not null default now()` | |

RLS habilitado, sin policies, `revoke all` de `anon` y `authenticated`. No guarda nada de nadie.

### `public.pets` (cambia)

| Columna | Tipo | Regla |
|---|---|---|
| `code` | `text not null unique` | Mismo check que `pet_codes.code`, el mismo patrón que `PET_CODE_PATTERN` de `lib/pets/rules.ts` (un test de `tests/db` comprueba que aceptan y rechazan los mismos casos). Lo asigna el trigger `pets_assign_code` (`before insert`), que genera con `private.new_pet_code()` y lo inserta en `pet_codes`, reintentando si el código ya existía. Nunca se actualiza: un trigger `before update` rechaza el cambio de `code`. |

Backfill en la misma migración: cada publicación existente recibe su código (y su fila en
`pet_codes`) antes del `set not null`.

Índice nuevo: `pets_listing_idx on pets (published_at desc, code desc) where status = 'available'`,
el orden del listado y del cursor de «Ver más» (parcial: el listado solo lee disponibles).

## Funciones nuevas

Todas con `set search_path = ''`. Las de `private` no están expuestas por la API.

| Función | Tipo | Qué hace |
|---|---|---|
| `private.pending_ttl()` | `sql immutable` | El TTL del número a medias (`7 days`). Un test lo compara con `DB_RULES.p_pending_ttl` (research R1). |
| `private.new_pet_code()` | `sql volatile` | 10 caracteres del alfabeto de R3 desde `extensions.gen_random_bytes`. |
| `private.pet_is_listed(owner uuid)` | `sql stable` (invoker) | `public.identity_level_one(owner, private.pending_ttl())`. La regla «a la vista» (FR-002), en un solo lugar. Solo la llaman funciones `security definer`. Con `set search_path` Postgres no la inlinea: es una llamada por fila que busca por la clave primaria de `phones` (`user_id`), aceptable para los cientos o pocos miles de animales del MVP; si el listado se vuelve lento, se reemplaza por un `exists` sobre `phones` dentro de `listed_pets`. |
| `private.pet_age_months(value smallint, unit text, as_of date, today date)` | `sql immutable` | La edad en meses del día `today`, igual que `ageOn` (research R5). |
| `private.pet_photo_object_listed(object_name text)` | `sql stable security definer` | Verdadero si el objeto `pet-photos/{dueña}/{foto}/…` es de una foto enganchada a un animal a la vista. |
| `private.avatar_object_listed(object_name text)` | `sql stable security definer` | Verdadero si el objeto es el `avatar_path` de una cuenta con al menos un animal a la vista. |
| `public.listed_pets(...)` | `sql stable security definer` | El listado (abajo). `execute` para `anon`, `authenticated`. |
| `public.pet_by_code(p_code text)` | `plpgsql stable security definer` | Una ficha (abajo). `execute` para `anon`, `authenticated`. |
| `public.pet_share_card(p_code text)` | `sql stable security definer` | Lo de la vista previa (abajo). `execute` para `anon`, `authenticated`. |

Grants: `grant usage on schema private to anon` (hoy solo lo tiene `authenticated`); `execute` a
`anon` y `authenticated` solo sobre `private.pet_photo_object_listed` y
`private.avatar_object_listed`, que usan las policies de Storage (corren con los permisos de quien
lee); `revoke execute ... from public, anon, authenticated` explícito sobre las demás `private.*`
nuevas; y, como en #53, `revoke all ... from public` antes de cada `grant execute` de las tres
`public.*`, porque Supabase concede `execute` a toda función nueva de `public`.

### `listed_pets`

Parámetros (todos opcionales; `null` o vacío = sin filtro): `p_species text[]`, `p_sexes text[]`,
`p_sizes text[]`, `p_age_bands int4range[]`, `p_departments text[]`, `p_neutered_only boolean`,
`p_after_published timestamptz`, `p_after_code text`, `p_limit integer` (se recorta a `[1, 241]`).

Devuelve, de los animales `status = 'available'` con `private.pet_is_listed(owner_id)` que cumplen
todos los filtros (una opción cualquiera dentro de cada uno), y estrictamente más viejos que el
cursor `(published_at, code)` si viene, ordenados `published_at desc, code desc`:
`code, name, species, sex, age_value, age_unit, age_as_of, department, locality, is_urgent,
published_at, cover_id, cover_owner, cover_width, cover_height, cover_thumbhash, total`.
`total` es `count(*) over ()` sin el límite: con cursor es lo que queda, sin cursor es el total.
La edad se filtra con `private.pet_age_months(..., public.uruguay_today()) <@ any(p_age_bands)`.

No devuelve `id`. Devuelve el id de la cuenta de quien publica solo como `cover_owner`, la carpeta
del objeto que hay que firmar (research R2, KL-57-1): no se muestra en ninguna pantalla.

### `pet_by_code`

Devuelve una fila o ninguna (el código no existe, incluido uno borrado con su cuenta):

- `visibility`: `'listed'` o `'hidden'`.
- `is_owner`: `auth.uid() = owner_id`.
- Si `visibility = 'listed'` o `is_owner`: todos los datos de la ficha (los de `listed_pets` más
  `size, is_neutered, vaccines, has_chip, good_with_kids, good_with_dogs, good_with_cats,
  description`), `owner_folder` (la carpeta de las fotos, una vez por fila: KL-57-1), `photos
  jsonb` (id, ancho, alto, thumbhash, en el orden de `position`; sin la carpeta repetida),
  `version` (la de la vista previa, la misma de `pet_share_card`), y del publicador
  `publisher_name`, `publisher_avatar_path`, `publisher_is_rescuer` y `publisher_level`: 1 con
  nivel 1, 2 con nivel 1 y fila en `identity_verifications`, y `null` sin nivel 1 (solo pasa cuando
  la dueña mira su ficha oculta: no se le dice un nivel que no tiene). `pet_id` solo si `is_owner`
  (para «Editar»).
- Si `visibility = 'hidden'` y no `is_owner`: todas las demás columnas en `null`.

### `pet_share_card`

Para la imagen de la vista previa: si el animal está a la vista, `name, department, locality,
cover_id, cover_owner, cover_width, cover_height, version` (un `md5` corto de portada, nombre y
zona); si no, ninguna fila. No mira la sesión: la imagen es igual para todos.

## Policies nuevas (Storage)

```text
pet_photos_objects_select_listed  on storage.objects  for select to anon, authenticated
  using (bucket_id = 'pet-photos' and private.pet_photo_object_listed(name))

avatars_select_listed_publisher   on storage.objects  for select to anon, authenticated
  using (bucket_id = 'avatars' and private.avatar_object_listed(name))
```

Solo `select` (firmar y bajar). Las de la dueña (`pet_photos_objects_select_own`, `avatars_own`)
no cambian.

## Reglas en TypeScript (única fuente)

- `lib/pets/rules.ts`: `LISTING_PAGE_SIZE = 24`, `LISTING_MAX_SHOWN = 240`, `AGE_BANDS` (en meses:
  `puppy [0,12)`, `young [12,36)`, `adult [36,96)`, `senior [96,)`), `PET_CODE_PATTERN`
  (`/^[0-9a-hjkmnp-tv-z]{10}$/`), `STALE_PAGE_MINUTES = 50`, `SHARE_IMAGE_MAX_BYTES = 300 KB`.
- `lib/pets/listing-query.ts`: el tipo `ListingFilters` y `parseListingQuery` / `listingHref`.
- `lib/pets/published-ago.ts`: `publishedAgo(publishedOn, today)` → `{ unit: 'today' | 'yesterday'
  | 'days' | 'weeks' | 'months', count }`.
- `lib/pets/paths.ts`: `LISTING_PATH = '/animales'`, `petPath(code)`, `petShareImagePath(code,
  version)`.

## Tipos de dominio (`lib/pets/types.ts`)

- `ListedPet`: lo de una card del listado (código, nombre, especie, sexo, edad de hoy, zona,
  urgente, portada firmada).
- `PublicPet`: la ficha (todo `Pet` de #53 sin `ageBase`, más `code`, `publishedOn`, `publisher`,
  `visibility`, `isOwner`, `editId: string | null`).
- `Publisher`: `name`, `avatar: string | null` (URL firmada), `initials`, `isRescuer`, `level: 1 | 2 | null` (`null` solo cuando la dueña mira su ficha oculta).
- `ListingPage`: `pets: ListedPet[]`, `total: number`, `cursor: ListingCursor | null`.

## Estados

La publicación no tiene estados nuevos: sigue `available` (#53). «A la vista» no se guarda; lo
calcula `private.pet_is_listed` en cada lectura, así que perder o recuperar el nivel 1 cambia lo
que se ve en el momento (FR-002) y borrar la cuenta lo saca por la cascada de #53 (FR-022).
