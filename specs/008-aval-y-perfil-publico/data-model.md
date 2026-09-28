# Data model: Aval entre personas y perfil público

Una migración, `supabase/migrations/<timestamp>_vouches.sql`, forward-only. Después,
`pnpm db:types` regenera `src/lib/supabase/types.ts`. Decisiones y alternativas en
[research.md](./research.md).

## `profiles` (cambia)

| Columna | Tipo | Regla |
|---|---|---|
| `public_id` | `text not null unique` | Default: `translate(rtrim(encode(extensions.gen_random_bytes(16), 'base64'), '='), '+/', '-_')`, 22 caracteres base64url de 128 bits al azar (R1). `check (public_id ~ '^[A-Za-z0-9_-]{22}$')`. Nadie la elige ni la cambia (ver Permisos de `profiles`). |

Las filas que ya existen reciben su valor con el default al agregar la columna. `created_at` ya
existe: es la fecha de alta que se muestra como mes y año.

La policy `profiles_select` no cambia: la dueña y quien administra con un pedido abierto. Lo ajeno
sale solo por `public_profile`.

**Permisos de `profiles`.** Hoy `authenticated` tiene `insert` y `update` sobre la tabla entera
(el default de Supabase, que ninguna migración revocó), y revocar una columna no le quita nada a un
permiso de tabla. La migración hace `revoke insert, update on public.profiles from authenticated`
y `grant insert (id, display_name, department, locality, is_rescuer, avatar_path), update (id,
display_name, department, locality, is_rescuer, avatar_path) on public.profiles to
authenticated`. `id` va en el `update` porque `upsertProfile` hace un `upsert` de PostgREST, que
escribe `on conflict (id) do update set id = excluded.id, …`; `profiles_update_own` ya lo ata a
`auth.uid()` con su `with check`. Así nadie puede darse el `public_id` de una cuenta borrada ni cambiar el suyo
(FR-008). `tests/db/profiles.test.ts` intenta el `insert` y el `update` con un `public_id`
elegido y espera que fallen los dos, y corre el mismo `upsert` que hace `upsertProfile` (alta y
edición) y espera que ande.

## `vouches` (nueva)

| Columna | Tipo | Regla |
|---|---|---|
| `voucher_id` | `uuid not null references auth.users (id) on delete cascade` | Quien avala. |
| `vouchee_id` | `uuid not null references auth.users (id) on delete cascade` | Quien recibe. |
| `created_at` | `timestamptz not null default now()` | Desde cuándo (FR-025). |

- `primary key (voucher_id, vouchee_id)`: a lo sumo un aval vigente por par dirigido (FR-013).
- `check (voucher_id <> vouchee_id)`: nadie se avala (FR-013).
- `create index vouches_vouchee_idx on vouches (vouchee_id, created_at desc)`: el perfil lista los
  avales de una persona del más reciente al más viejo.
- RLS habilitada, **sin ninguna policy**, y `revoke all on public.vouches from anon,
  authenticated`: toda lectura pasa por `my_vouches`, `vouch_standing` y `public_profile`, y
  una policy de las dos partes le daría a cada una, por la API, el id de cuenta de la otra, que R1
  dice que no circula. Se escribe solo por las funciones de abajo.

Vigente = la fila existe. **Cuenta** = `private.has_level_two(voucher_id) and
private.has_level_two(vouchee_id)`, calculado al leer, nunca guardado (FR-002).

## `vouch_blocks` (nueva)

| Columna | Tipo | Regla |
|---|---|---|
| `voucher_id` | `uuid not null references auth.users (id) on delete cascade` | Quien había dado el aval. |
| `vouchee_id` | `uuid not null references auth.users (id) on delete cascade` | Quien lo quitó. |

- `primary key (voucher_id, vouchee_id)`, `check (voucher_id <> vouchee_id)`, índice por
  `vouchee_id` (la cascada al borrar a quien quitó). Sin fecha: la spec guarda solo quién y a quién
  (Key Entities).
- RLS habilitada, **sin ninguna policy**, y `revoke all ... from anon, authenticated`: nadie la lee
  desde el cliente. Que existe una quita se lo
  dice a quien la recibió `vouch_standing` (FR-011.5); a quien quitó, nada.

## Funciones

Todas `set search_path = ''`, con los parámetros de reglas llegando desde
`lib/verification/rules.ts` (`p_pending_ttl`, como `DB_RULES`). Las que empiezan con `private.` no
se publican por la API.

### `private.has_level_two(p_user uuid, p_pending_ttl interval) returns boolean`

`stable`, `security definer`. `public.identity_level_one(p_user, p_pending_ttl)` y una fila en
`identity_verifications`. Es la definición de «nivel 2» en SQL y la usan las demás; la
escalera completa (0-3) vive en `lib/verification/level.ts`.

### `public_profile(p_public_id text, p_pending_ttl interval)`

`stable`, `security definer`, solo `service_role`. Devuelve **cero o una fila** (cero para un id
inexistente, una cuenta borrada o un perfil sin completar: los tres son «no hay fila», R9):

| Salida | Qué es |
|---|---|
| `public_id` | El mismo id. |
| `display_name`, `department`, `locality`, `is_rescuer` | Del perfil. |
| `has_photo` | `boolean`: si tiene foto. La foto se sirve por su propia ruta (R7), nunca con la ruta de Storage. |
| `member_since` | `date`: el primer día del mes de `created_at` en hora de Uruguay (R8). |
| `level_one` | `boolean`: nivel 1 hoy. |
| `identity_since` | `date`: el primer día del mes de `verified_on`, **solo si `level_one`**; nulo si no. |
| `vouchers` | `jsonb`: `[{ public_id, display_name }]` de los avales que cuentan, del más reciente al más viejo; `[]` si ninguno cuenta o si la persona no tiene nivel 2. |

Nunca devuelve: el id de la cuenta, el correo, el teléfono, el día exacto de alta ni de
verificación, fechas de avales, avales en pausa, quitas.

### `avatar_path_for(p_public_id text)`

`stable`, `security definer`, solo `service_role`. La ruta de la foto de un perfil completo, o
nada. La usa la ruta de la foto (R7), así el id de la cuenta no aparece en ninguna URL.

### `vouch_standing(p_viewer uuid, p_target_public_id text)`

`stable`, `security definer`, solo `service_role`. La relación entre quien mira y la persona
mirada, para `vouchSlot` (R6). Una fila: `viewer_vouches` (hay aval vigente de quien
mira), `target_vouches_viewer` (hay aval vigente de la mirada a quien mira), `blocked_by_target`
(la mirada le quitó un aval a quien mira). Cero filas si el perfil no existe.

### `my_vouches(p_user uuid, p_pending_ttl interval)`

`stable`, `security definer`, solo `service_role`. Las filas de «Mis avales» (FR-025):
`direction` (`given` | `received`), `other_public_id`, `other_display_name`, `other_has_photo`,
`given_on` (el día de Uruguay del aval, `date`, como `uruguay_today()`), `mine_lacks_level_two`, `other_lacks_level_two`. Ordenadas por `created_at desc`
dentro de cada dirección. Devuelve el día (lo ven las dos partes), nunca el motivo de la pausa.

### `give_vouch(p_voucher uuid, p_vouchee_public_id text, p_pending_ttl interval)`

`volatile`, `security definer`, solo `service_role`. Dos candados, siempre en este orden: el del
par, `pg_advisory_xact_lock(hashtextextended('vouch-pair:' || least(a,b) || ':' || greatest(a,b),
0))`, y el de quien recibe, `'vouchee:' || b`, para que dos personas que avalan a la misma a la vez
no vean las dos «ningún aval contaba» y registren dos veces el paso a nivel 3.
Devuelve `(outcome text, created boolean, reached_level_three boolean)`: `created` dice si el aval se dio en esta llamada (un reintento idempotente devuelve `given` con `created = false` y no se registra dos veces); `outcome`, en este orden (R4):

| `outcome` | Cuándo |
|---|---|
| `not_found` | No hay perfil con ese id. |
| `self` | Es la propia cuenta. |
| `given` | El aval ya existía (idempotente) **o** se acaba de dar. `reached_level_three` solo es `true` si se dio ahora y antes ningún aval de quien recibe contaba. |
| `reciprocal` | Quien recibe avala a quien da (vigente, cuente o no). Va antes que `blocked`, como en FR-011: los dos pueden pasar a la vez (A avaló a B, B le quitó un aval a A y después avaló a A). |
| `blocked` | Quien recibe le quitó un aval a quien da. |
| `vouchee_level` | Quien recibe no tiene nivel 2. |
| `voucher_level` | Quien da no tiene nivel 2. |

### `withdraw_vouch(p_voucher uuid, p_vouchee_public_id text)`

Los mismos dos candados, en el mismo orden. Borra la fila si está. Devuelve `withdrawn` o `absent` (FR-019: no es un error).

### `remove_vouch(p_vouchee uuid, p_voucher_public_id text)`

Los mismos dos candados, en el mismo orden. Borra el aval si está e **inserta la quita siempre** (`on conflict do nothing`),
también si el aval ya no estaba (FR-018). Devuelve `removed` o `absent`. `absent` también si el id
no corresponde a ningún perfil (no inserta nada). Consecuencia aceptada: una llamada con el id de
alguien que nunca la avaló guarda igual la quita —esa persona no podrá avalarla—; es lo que cuesta
no depender de quién llegó primero en la carrera de FR-018, y la llamada solo la hace la acción de
«Mis avales», que lleva ids de avales que la persona vio.

### Permisos

Son nueve: `private.has_level_two`, `private.lock_vouch` (los dos candados, en el orden de arriba, una sola vez para las tres escrituras) y siete públicas —`public_profile`, `avatar_path_for`,
`vouch_standing`, `my_vouches`, `give_vouch`, `withdraw_vouch`, `remove_vouch`—. `revoke all ...
from public, anon, authenticated` en las nueve, cada una por su nombre; `grant execute ... to
service_role` en las siete públicas. Las dos privadas no se otorgan a nadie: la llaman las
funciones `security definer` con los permisos de su dueño. El test de privacidad prueba las nueve
por nombre con `anon` y con `authenticated`.

## Borrado de la cuenta

Nada nuevo en el código: `on delete cascade` desde `auth.users` borra `profiles` (con su
`public_id`), los avales dados y recibidos, y las quitas en las dos direcciones (FR-027). El test de
borrado lo comprueba con una persona que dio, recibió y quitó.

## Tipos en TypeScript

- `lib/vouches/types.ts`: `PublicProfile` (lo de `public_profile`, con `memberSince` e
  `identitySince` como `YYYY-MM-DD` y `vouchers: { publicId, displayName }[]`), `VouchStanding`,
  `MyVouch`, `GiveOutcome`, `WithdrawOutcome`, `RemoveOutcome`.
- `lib/verification/level.ts`: `VerificationLevel = 0 | 1 | 2 | 3`; `verificationLevel(phone,
  identity, countingVouches = 0)`, y `publicLevel({ levelOne, identitySince, vouchers })` para el
  perfil público, las dos sobre la misma escalera.
