# Data Model: Los animales en adopción de cada rescatista en su perfil

No se guarda nada nuevo (FR-024): ninguna tabla, columna, policy ni fila nueva. Cambia una función
y se suman propiedades a dos momentos de la medición.

## `public.listed_pets` (cambia la firma)

Migración nueva `supabase/migrations/20261029120000_profile_pets.sql`, forward-only.

```text
listed_pets(
  p_species text[], p_sexes text[], p_sizes text[], p_age_bands int4range[],
  p_departments text[], p_neutered_only boolean,
  p_after_published timestamptz, p_after_code text, p_limit integer,
  p_owner_public_id text default null          -- nuevo
) returns table (... las mismas columnas de hoy ...)
```

- Cuerpo: el de `20261026120000_litter_lifecycle.sql`, con una condición más en el `where` final:
  `p_owner_public_id is null or s.owner_id = (select pr.id from public.profiles pr where
  pr.public_id = p_owner_public_id)`. La columna `owner_id` ya está en el CTE `shown`.
- Reglas que no cambian y ahora valen también para el perfil: disponible o en proceso, sin vencer,
  sin dar de baja, `private.pet_is_listed(owner)` (nivel 1 de hoy y cuenta sin suspender), camada con
  `litter_is_shown` y estado `available`, una fila por camada, sin el bloqueo de quien mira hacia la
  dueña, orden `published_at desc, code desc`, cursor `(published_at, code)`.
- `security definer`, `stable`, `search_path = ''`, como hoy. `drop function` de la firma de nueve
  parámetros; `revoke all ... from public`, `grant execute ... to anon, authenticated` sobre la de
  diez.
- `public_id` ya tiene índice único en `profiles`; `count(*) over ()` sigue saliendo y el perfil no
  lo usa.

## Tipos de TypeScript

- `src/lib/supabase/types.ts`: regenerado con `pnpm db:types`.
- `src/lib/analytics/visit-origin.ts`: `PetViewOrigin` suma `'profile'`.
- `src/lib/analytics/events.ts`:
  - `public_profile_viewed: { origin: ProfileViewOrigin; with_pets?: boolean }`.
  - `PROFILE_LINK_ORIGINS = ['my_profile', 'my_vouches', 'my_pets'] as const`,
    `ProfileLinkOrigin`, y `profile_link_copied: { from: ProfileLinkOrigin }`.
- `src/lib/pets/profile-pets-state.ts`: el estado de la sección.

```text
ProfilePetsState = {
  cards: ListedCardView[]
  next: string | null            // cursor de «Ver más», null si no quedan
  pending: 'none' | 'retry' | 'more'
  failure: null | { on: 'open' | 'more'; reason: ListingFailure }
  request: number                // sube en cada falla: vuelve a montar SaveFailedStrip
}
```

Transiciones: `retry_started` (solo desde `failure.on = 'open'`), `more_started` (solo con `next`),
`loaded` (con `retry` reemplaza las tarjetas; con `more` las suma y toma el `next` nuevo), `failed`
(guarda `on` según lo pendiente y sube `request`), `aborted` (vuelve a `pending: 'none'` sin tocar
nada más).
