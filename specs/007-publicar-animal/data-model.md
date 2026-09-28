# Data model: Publicar un animal

Una migración, `supabase/migrations/<timestamp>_pets.sql`, forward-only. Después, `pnpm db:types`.
Los enums van como `text` con `check` y claves en inglés (docs/06): un `check` dice lo mismo que un
tipo enum sin el costo de migrar un tipo, como `profiles.department`.

## `public.pets`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk, `default gen_random_uuid()` | |
| `owner_id` | `uuid not null` → `auth.users(id) on delete cascade` | índice `(owner_id, published_at desc)`: «Mis animales» y el FK |
| `attempt_id` | `uuid not null` | `unique (owner_id, attempt_id)` (R6) |
| `name` | `text not null` | `char_length(btrim(name)) between 1 and 120`: un techo en puntos de código; los 30 caracteres de la regla los cuenta el schema en grafemas (research R3) |
| `species` | `text not null` | `in ('dog', 'cat')` |
| `sex` | `text not null` | `in ('male', 'female')` |
| `age_value` | `smallint not null` | con `age_unit`: `months` 1–11, `years` 1–25 (vale en `age_as_of`) |
| `age_unit` | `text not null` | `in ('months', 'years')` |
| `age_as_of` | `date not null` | día de Uruguay desde el que avanza (R7) |
| `size` | `text not null` | `in ('small', 'medium', 'large')`, tamaño de adulto |
| `is_neutered` | `boolean not null` | |
| `vaccines` | `text not null` | `in ('up_to_date', 'incomplete', 'none')` |
| `has_chip` | `boolean not null` | |
| `good_with_kids` | `text not null default 'unknown'` | `in ('yes', 'no', 'unknown')` |
| `good_with_dogs` | `text not null default 'unknown'` | ídem |
| `good_with_cats` | `text not null default 'unknown'` | ídem |
| `description` | `text` | nulo o `char_length(description) <= 8000`, el mismo techo; los 2000 los cuenta el schema |
| `department` | `text not null` | los 19 códigos ISO, el mismo `check` que `profiles` |
| `locality` | `text not null` | `char_length(btrim(locality)) between 1 and 60` |
| `is_urgent` | `boolean not null default false` | |
| `status` | `text not null default 'available'` | `in ('available')`: la historia del ciclo de vida ensancha el `check` con los otros estados (FR-012) |
| `language` | `text not null default 'es'` | `in ('es')`: el idioma de lo que escribió la persona (docs/06, research R16) |
| `published_at` | `timestamptz not null default now()` | el orden de «Mis animales»; editar no lo cambia |
| `updated_at` | `timestamptz not null default now()` | trigger `touch_updated_at` |

La regla de contacto y el número de puerta **no** son `check`: viven en el schema zod compartido
(`lib/schemas/pet.ts`), como en el perfil, porque su mensaje cita el fragmento y la base no puede.

## `public.pet_photos`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk | lo genera el cliente (R1); es también la carpeta del objeto |
| `owner_id` | `uuid not null` → `auth.users(id) on delete cascade` | índice; la foto en espera también se va con la cuenta (FR-027) |
| `pet_id` | `uuid` → `pets(id) on delete cascade` | nulo = en espera o soltada; índice parcial `(pet_id) where pet_id is not null` |
| `position` | `smallint` | 0–4; 0 es la portada. `unique (pet_id, position) deferrable initially deferred`, para reordenar en una transacción |
| `width` `height` | `smallint not null` | del tamaño `full`, para reservar el lugar sin salto |
| `thumbhash` | `text not null` | base64, ≤ 64 caracteres |
| `staged_at` | `timestamptz not null default now()` | |
| `released_at` | `timestamptz` | la sacó un guardado; la purga la borra |

`check ((pet_id is null) = (position is null))` y
`check (released_at is null or pet_id is null)`.

Objetos: `pet-photos/{owner_id}/{id}/{thumb|card|full}.webp`.

## Permisos y RLS

- `pets` y `pet_photos`: RLS activa; `select` para `authenticated` con
  `(select auth.uid()) = owner_id`. `revoke all … from anon, authenticated; grant select … to
  authenticated`. Sin policies de escritura: toda escritura es de las funciones.
- Bucket `pet-photos`: `public = false`, `file_size_limit = 1048576`,
  `allowed_mime_types = {image/webp}`. Una sola policy en `storage.objects` para
  `authenticated`: `select` si `bucket_id = 'pet-photos'` y
  `(select auth.uid())::text = (storage.foldername(name))[1]` (para firmar las URLs con su
  sesión). **Sin `insert`, `update` ni `delete`** para `authenticated` ni `anon`: sube y borra solo
  el servicio, después de anotar la fila (research R1).

## Funciones (todas `security definer`, `set search_path = ''`, `revoke all … from public, anon, authenticated`)

- **El nivel 1 es `identity_level_one(p_user_id uuid, p_pending_ttl interval)`**, de la migración
  de la identidad (#11): teléfono verificado y ningún número a medias vivo. Es la misma regla que
  `phoneStatus` + `isLevelOne` (historia #10); el test de la base prueba los tres casos. Esta
  historia la escribió primero como `has_level_one`; al traer `main` quedaron dos funciones iguales
  y se usa la que ya estaba.
- **`stage_pet_photo(p_owner, p_photo_id, p_width, p_height, p_thumbhash, p_pending_ttl)`**: toma
  el candado de la cuenta, exige nivel 1; inserta la fila en espera; `on conflict (id) do nothing`, y si la fila existente es de
  otra dueña, lanza `photo_taken`. Devuelve si quedó.
- **`publish_pet(p_owner, p_attempt, p_pending_ttl, p_staged_ttl, p_fields jsonb, p_photo_ids uuid[])` returns
  `table (pet_id uuid, already boolean)`**: candado de la cuenta; si el intento existe, lo devuelve
  con `already`; si no, exige nivel 1 (`needs_verification`), entre 1 y 5 fotos, todas en espera,
  de esta dueña, sin soltar y más nuevas que `p_staged_ttl` (`photos_invalid`, research R1); inserta la publicación y engancha las fotos en el
  orden del arreglo.
- **`save_pet(p_owner, p_pet, p_pending_ttl, p_staged_ttl, p_fields jsonb, p_photo_ids uuid[])` returns
  `setof uuid`** (las soltadas): candado de la cuenta; la publicación de otra dueña o inexistente
  → `not_found`; sin nivel 1 → `needs_verification`; alguna foto que no está enganchada a esta
  publicación ni en espera de esta dueña **sin soltar** (`released_at is null`) →
  `changed_elsewhere` (FR-020a); una en espera más vieja que `p_staged_ttl` → `photos_invalid`; entre 1 y 5; actualiza
  los campos (sin tocar `published_at`), engancha las nuevas, reordena, y suelta las que no vinieron
  (`pet_id = null, position = null, released_at = now()`).
- **`purge_pet_photos(p_staged_ttl interval) returns table (id uuid, owner_id uuid)`**: las
  candidatas (en espera más viejas que el TTL, o soltadas), para que la aplicación borre los
  objetos; y **`delete_pet_photo_rows(p_ids uuid[])`**, que borra solo filas que siguen sin
  publicación.

Los errores salen como `raise exception using errcode = 'P0001', message = '<clave>'` y la query los
traduce a la clave de i18n, como hacen `phones` y `phone_claims`.

## Borrado de la cuenta

`deleteAccount` suma un barrido antes de borrar la persona y otro después de la cascada (research
R20): `deletePetPhotosAsService(userId)` lista
**los objetos** bajo el prefijo `{userId}/` del bucket (las carpetas de cada foto y sus tres
archivos), los borra, y vuelve a listar para comprobar que no quedó ninguno (FR-027, como
`deleteAvatarAsService`). Así encuentra también un objeto que hubiera quedado sin fila. Las filas se
van con la cascada de `auth.users`. Una subida que llega en el medio falla en `stage_pet_photo` (la
dueña ya no existe); si llegara a subir un objeto después, `uploadPetPhoto` verifica que su fila
siga y, si no, lo borra.

## Tipos de dominio (TypeScript)

- `Pet`: la publicación como la ve su dueña, con `age` ya calculada (`{ value, unit }`), `ageBase`
  (lo guardado), `zone` (`{ department, locality }`), `photos: PetPhotoData[]` en orden.
- `PetPhotoData`: `{ id, width, height, placeholder, urls: { thumb, card, full } }` (firmadas;
  `placeholder` es el data URL del ThumbHash, armado en el servidor). El nombre `PetPhoto` queda
  para el componente.
- `PetSummary`: lo que muestra `PetCard` en «Mis animales»: `id`, `name`, `species`, `sex`, `zone`,
  `isUrgent`, `status`, `cover: PetPhotoData`.
- `PetFormValues`: el formulario, en cadenas y claves (lo que guarda el borrador).
- `AgeBase`: `{ value, unit, asOf }`, la edad guardada al abrir la edición; viaja con el formulario
  junto a la edad que se mostró (research R7).
- `FieldError`: `{ key, values?: { fragment } }` (research R8).
- `PhotoSlot`: una foto en pantalla: `{ key, state: 'preparing' | 'ready' | 'uploading' | 'uploaded'
  | 'rejected', preview?, prepared?, error? }` (`lib/pets/photo-list.ts`).
