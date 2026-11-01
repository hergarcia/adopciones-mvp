# Data model: cuentas de cada publicación

Historia #269 · [research.md](./research.md) R1, R2, R3, R6. Una migración forward-only:
`supabase/migrations/<ts>_publication_stats.sql`, con `<ts>` posterior a `20261102120000`.

## `public.publication_stats`

Una fila por animal publicado solo o por camada. Sin ninguna persona, ni hora, ni origen.

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` | `primary key default gen_random_uuid()` |
| `pet_id` | `uuid` | `references public.pets (id) on delete cascade`, `unique`, nulo en una camada |
| `litter_id` | `uuid` | `references public.litters (id) on delete cascade`, `unique`, nulo en un animal |
| `opens` | `integer` | `not null default 0`, `check (opens >= 0)` |
| `taps` | `integer` | `not null default 0`, `check (taps >= 0)` |
| `phone_stops` | `integer` | `not null default 0`, `check (phone_stops >= 0)` |
| `identity_stops` | `integer` | `not null default 0`, `check (identity_stops >= 0)` |
| `counted_since` | `date` | `not null default public.uruguay_today()` |
| `from_publication` | `boolean` | `not null default true`; `false` en las filas que crea la migración |

- `check (num_nonnulls(pet_id, litter_id) = 1)`.
- `alter table … enable row level security;` sin políticas; `revoke all … from anon, authenticated`.
- `comment on table`: qué cuenta, sin quién ni cuándo (historia #269, Ley 18.331).

**Ciclo de vida**

- Nace con la publicación: `after insert on public.pets for each row when (new.litter_id is null)`
  y `after insert on public.litters for each row`, con `insert … on conflict do nothing`.
- La migración crea las filas de lo que ya existe: `insert … select id from public.pets where
  litter_id is null` y `… from public.litters`, con `from_publication = false`.
- Se va con la publicación (cascade); borrar la cuenta ya borra sus publicaciones, así que también
  se va (FR-028).
- Ninguna función la pone en cero ni resta.

## Funciones

Todas `security definer`, `set search_path = ''`, `revoke all … from public`.

| Función | Devuelve | `execute` | Regla |
|---|---|---|---|
| `count_pet_open(p_code text, p_viewer uuid)` | `void` | `service_role` | Suma `opens` del animal con ese código si existe, `litter_id is null` y `owner_id is distinct from p_viewer`. |
| `count_litter_open(p_code text, p_viewer uuid)` | `void` | `service_role` | Ídem para la camada con ese código. |
| `count_apply_tap(p_code text, p_viewer uuid, p_tap boolean, p_stop text)` | `void` | `service_role` | Busca el animal por código; si tiene `litter_id`, la fila de la camada; si `owner_id = p_viewer`, nada. Suma `taps` con `p_tap`, y `phone_stops` o `identity_stops` según `p_stop` (`phone`, `identity` o nulo; cualquier otro valor, `raise`). |
| `my_publication_stats(p_pet uuid, p_litter uuid)` | `table (opens int, taps int, phone_stops int, identity_stops int, applications int, counted_since date, from_publication boolean, required_level smallint)` | `authenticated` | Exactamente uno de los dos argumentos. Una fila solo si `auth.uid()` es el `owner_id` del animal (sin `litter_id`) o de la camada; si no, ninguna. `applications`: `count(*)` de `public.applications` con ese `pet_id`, o con `pet_id` de alguna cría con ese `litter_id`, en cualquier estado. |

Cada suma es un solo `update … set x = x + 1 where …`: el candado de la fila ordena las que llegan
juntas (FR-010).

## Tipos en el código

`src/lib/pet-stats/types.ts`:

```ts
export type PublicationKind = 'pet' | 'litter'

export type PublicationStats = {
  opens: number
  taps: number
  phoneStops: number
  identityStops: number
  applications: number
  countedSince: string // AAAA-MM-DD, día de Uruguay
  fromPublication: boolean
  requiredLevel: 1 | 2
}

export type ApplyCount = { tap: boolean; stop: 'phone' | 'identity' | null }
```

`PetStatsView` (lo que dibuja el bloque, ya traducido) vive en `components/pets/pet-stats-texts.ts`
y la arma `statsView` (`lib/pet-stats/stats-view.ts`, pura) más los textos:

```ts
type StatsShape =
  | { kind: 'empty' }
  | { kind: 'counts'; showIdentity: boolean; since: { kind: 'publication' } | { kind: 'day'; day: string } }
```

`src/lib/supabase/types.ts` se regenera con `pnpm db:types`.
