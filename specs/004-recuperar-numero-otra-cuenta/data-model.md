# Data model: Recuperar un número verificado en otra cuenta

Una migración forward-only, `supabase/migrations/<timestamp>_phone_claims.sql`, creada con
`pnpm exec supabase migration new phone_claims`. Después, `pnpm db:types`.

## `public.phone_claims` (nueva)

La prueba de una cuenta: escribió bien el código de un número que estaba verificado en otra.

| Columna | Tipo | Regla |
|---|---|---|
| `user_id` | `uuid` PK, `references auth.users (id) on delete cascade` | Una prueba por cuenta: la última (FR-005). |
| `number` | `text not null`, `check (number ~ '^\+5989[1-9][0-9]{6}$')` | El número en claro, porque al confirmar hay que saber cuál. Vive lo que vive la prueba (FR-013e). |
| `valid_until` | `timestamptz not null` | El `expires_at` del código escrito: 10 minutos desde que se mandó (FR-005). |

- Índice `phone_claims_number_idx (number)`: verificar un número borra las pruebas ajenas con ese
  número (plan §1), y esa búsqueda va por número.
- `alter table … enable row level security`, **sin policies**, y `revoke all … from anon,
  authenticated`: no la lee ni la escribe nadie desde el cliente, tampoco la dueña (FR-013e). Solo
  las funciones de abajo, con la clave de servicio.
- `comment on table` y `comment on column number` con el porqué, como en la #10.

No hay columna de cuándo se creó: `valid_until` alcanza para todo, y un instante más sería otro
dato que no se necesita.

## `public.phones` (cambia)

| Cambio | Detalle |
|---|---|
| `+ number_lost_on date` | El día calendario de Uruguay en que la cuenta perdió su número frente a otra (FR-007.3, FR-013a). Sin hora, a propósito. |
| `+ constraint phones_lost_or_verified check (verified_number is null or number_lost_on is null)` | El aviso y un teléfono verificado no conviven (FR-011b). |
| `- updated_at` y `drop trigger phones_touch_updated_at` | Nadie lo lee, y marcaría el mismo instante en las dos filas (FR-013f). `touch_updated_at()` queda: la usa `profiles`. |

La policy `phones_select_own` y los permisos (`select` para `authenticated`, nada más) no cambian:
el día perdido lo lee solo su dueña y nadie lo escribe desde el cliente (FR-013b).

Una fila puede existir ahora solo por `number_lost_on` (sin verificado ni a medias): es la cuenta
que perdió el número y todavía no verificó otro.

## Funciones nuevas

Todas `security invoker`, `set search_path = ''`, `revoke all … from public, anon, authenticated`
y `grant execute … to service_role`, como en la #10.

### `get_phone_claim(p_user_id uuid) → table (number text, valid_until timestamptz)`

`stable`. La prueba de la cuenta si vale (`valid_until > now()`); ninguna fila si no.

### `claim_phone_number(p_user_id uuid, p_time_zone text) → table (outcome text, was_change boolean, was_lost boolean, previous_user_id uuid, lost_on date)`

`outcome in ('claimed', 'verified_free', 'no_claim')`. Paso a paso en el plan §2:

1. prueba vigente de `p_user_id` o `no_claim`;
2. dueño actual del número; `lock_phone_account` de las dos cuentas en orden de id; después el
   candado del número (`hashtextextended('phone-number:' || número, 0)`); relectura;
3. si hay dueño: `verified_number = null, verified_at = null, number_lost_on = (now() at time zone p_time_zone)::date`, sin tocar `pending_*` ni sus códigos → `claimed`, con ese mismo día en `lost_on` para el correo;
4. si no: `verified_free`;
5. la cuenta: `verified_number = número`, `verified_at = date_trunc('day', now() at time zone p_time_zone) at time zone p_time_zone`, `pending_* = null`, `number_lost_on = null` (upsert); códigos vivos de la cuenta reemplazados; se borran su prueba y las pruebas de otras cuentas con ese número.

Los pasos 3 y 5 van en un mismo bloque `begin … exception when unique_violation`: si salta, se
deshacen los dos y la función devuelve `no_claim`.

### `drop_phone_claim(p_user_id uuid) → void`

Borra la prueba de la cuenta. La usa «Entrar con esa cuenta» después de cerrar la sesión.

## Funciones que cambian

| Función | Cambio |
|---|---|
| `check_phone_code` | Rama `unique_violation`: además de lo de hoy, toma el candado del número y hace upsert en `phone_claims` con el número vivo y `valid_until = v_live.expires_at`. Rama verificada: toma el candado del número (después del de su cuenta) antes de escribir, `number_lost_on = null`, devuelve `was_lost`, y borra las pruebas de **otras** cuentas con ese número. El `delete` de la fila vacía suma `and number_lost_on is null`. Firma de retorno con una columna más (`was_lost`): se hace `drop function` + `create`, porque `create or replace` no cambia el tipo de retorno, y se repiten `revoke all … from public, anon, authenticated` y `grant execute … to service_role` (plan §15). |
| `reserve_phone_code` | En la rama `skip` (frenado en silencio, que deja un código vivo), `delete from phone_claims where user_id = p_user_id` (FR-005). |
| `settle_phone_code` | Con `sent`, donde reemplaza los códigos vivos anteriores, borra también la prueba de la cuenta. Con `failed` o `rejected`, nada (FR-006 de la #10). |
| `cancel_pending_phone` | El `delete` de la fila vacía suma `and number_lost_on is null`. |
| `purge_phone_records` | Borra `phone_claims` con `valid_until < now()`; el `delete` de filas vacías suma `and number_lost_on is null`. |

## Estados

```
Cuenta B (reclama)                         Cuenta A (tiene el número)
─────────────────                          ──────────────────────────
escribe bien el código de X ──► phone_claims(B, X, hasta T)      verificada con X
      │  pide otro código ─────► prueba borrada
      │  «Entrar con esa cuenta» ► prueba borrada
      │  X se verifica en otra cuenta ► prueba borrada
      │  pasa T ────────────────► prueba inservible (y la purga la borra)
      ▼ confirma antes de T
verificada con X, verified_at = día  ◄──   sin verificado, number_lost_on = día,
                                           cambio a medias intacto
```

## Tipos

`pnpm db:types` regenera `src/lib/supabase/types.ts`. `PhoneRow` suma `numberLostOn: string | null`
(el `date` tal cual, `YYYY-MM-DD`, sin convertirlo a `Date`: ver plan §7).
