# Data Model: Pedirle a quien solicitó que verifique su identidad antes de decidir

**Migración**: `supabase/migrations/20261030120000_identity_asks.sql` (forward-only). Después,
`pnpm db:types`. Motivos de cada decisión en [research.md](./research.md).

## Tabla nueva: `public.application_identity_asks`

| Columna | Tipo | Regla |
|---|---|---|
| `application_id` | `uuid` PK | FK `applications(id)` `on delete cascade`. La PK es «a lo sumo uno por solicitud» (FR-003). |
| `asked_at` | `timestamptz not null default now()` | El instante del pedido; el día se muestra en hora de Uruguay. |
| `resolved_at` | `timestamptz` | Nulo mientras no se resolvió. Se escribe una sola vez, al aprobarse la identidad con la solicitud `sent` (FR-024). |

- `check (resolved_at is null or resolved_at >= asked_at)`.
- Índice: ninguno extra; las lecturas entran por la PK o por `applications.applicant_id` (R4 recorre
  las solicitudes de una persona y une por PK).
- RLS habilitada, **sin políticas**; `revoke all … from anon, authenticated`. Solo la leen y la
  escriben las funciones de abajo.
- `comment on table`: lo que es, quién lo ve (las dos personas, por funciones) y que quien
  administra no lo ve.

**Estados** (derivados, no guardados):

```
            ask_identity                 resolve_identity_asks (con la solicitud 'sent')
 (sin fila) ────────────▶ abierto ─────────────────────────────────────────▶ resuelto
                            │
                            │ la solicitud deja 'sent' (aceptar, rechazar, retirar, cerrar)
                            ▼
                        cerrado sin resolver (queda la fila con su día; nunca se resuelve)
```

«Abierto» = fila con `resolved_at` nulo y solicitud `sent`. La fila se borra con la solicitud
(cascade) y con la cuenta de quien publicó (trigger, R11).

## Cambios a lo existente

### `public.application_notices`

`application_notices_kind_valid` se reemplaza sumando `identity_asked` e `identity_verified`.

### `public.verification_exit_tickets` · `verification_exit_answers` · `verification_exit_counts`

Los tres `check` de origen pasan a `('publish', 'apply', 'self', 'asked')`. `verification_exit_counts`
recibe las filas `('phone', 'asked')` e `('identity', 'asked')` en cero.

### `public.applications`

Trigger `application_identity_asks_on_publisher_gone` (función `private.identity_asks_drop_on_publisher_gone()`, `security definer`, `set search_path = ''`) `after update of publisher_id`, `when
(new.publisher_id is null and old.publisher_id is not null)`: borra el pedido de esa solicitud.

## Funciones

| Función | Cambio | Quién la llama |
|---|---|---|
| `public.ask_identity(p_publisher uuid, p_id uuid)` → `(outcome text, asked_at timestamptz, in_litter boolean)` | **nueva**. Candado de la solicitud; resultados en research R2; con `asked` inserta la fila y el aviso `identity_asked` a quien solicitó. | `service_role` |
| `private.resolve_identity_asks(p_user uuid)` → `smallint[]` | **nueva**. Toma `for update` las solicitudes `sent` de la persona con pedido sin resolver; para cada una: `resolved_at`, `opened_at = null`, el aviso `identity_verified` con la regla de R6. Devuelve `private.person_level(publisher_id)` de cada una. | `resolve_identity_request` |
| `public.resolve_identity_request(…)` | **cambia la salida**: suma `asker_levels smallint[]` (vacío si rechaza o no había pedidos). Llama a `resolve_identity_asks` después de insertar la verificación. `drop` + `create`, mismos permisos. | `service_role` |
| `public.open_application(p_publisher, p_id)` | `opened_first` es falso si la solicitud tiene un pedido resuelto (R5). | `service_role` |
| `public.publisher_application(p_id)` | suma `identity_asked_at timestamptz`, `identity_resolved_at timestamptz`, `applicant_identity_verified boolean` (null si `g.shows` es falso, como el resto de quien solicitó). `drop` + `create`. | `authenticated` |
| `public.pet_applications(p_pet)` | suma `identity_asked boolean` (fila sin resolver y `a.status = 'sent'`). `drop` + `create`. | `authenticated` |
| `public.my_application(p_id)` | suma `identity_asked boolean` (sin resolver y `sent`), `identity_resolved_at timestamptz` (solo con `sent`) y `publisher_level smallint` (solo con pedido y `sent`). `drop` + `create` sobre la versión de la #206. | `authenticated` |
| `public.ask_verification_exit(p_level, p_origin)` | acepta `asked`. | `authenticated` |

La regla del aviso `identity_verified` (R6), en SQL:

```sql
not exists (
  select 1
    from public.applications o
    left join public.application_reviews r on r.application_id = o.id
    left join public.application_identity_asks k on k.application_id = o.id
   where o.pet_id = v_app.pet_id
     and o.id <> v_app.id
     and o.status = 'sent'
     and r.opened_at is null
     and greatest(o.sent_at, coalesce(k.resolved_at, '-infinity')) > coalesce(
       (select iv.seen_at from public.inbox_visits iv
         where iv.publisher_id = v_app.publisher_id and iv.pet_id = v_app.pet_id),
       '-infinity'::timestamptz
     )
)
```

Una solicitud sin fila en `application_reviews` (nunca abierta) cuenta como sin abrir, como hoy.

## Tipos en TypeScript

- `NOTICE_KINDS` (`lib/applications/types.ts`) suma `identity_asked`, `identity_verified`.
- `PublisherApplication` suma `identityAsk: { askedAt: string; resolvedAt: string | null } | null`
  y `applicantIdentityVerified: boolean | null`.
- `PetApplicationRow` suma `identityAsked: boolean`.
- `MyApplication` suma `identityAsk: { resolvedAt: string | null; publisherLevel: MeasuredLevel |
  null } | null` (nulo sin pedido abierto ni resuelto con la solicitud `sent`).
- `EXIT_ORIGINS` suma `asked`; `ExitPlace` suma `applicationId: string | null`.
- `IdentityAskOutcome` = los resultados de R2.

## Validación

- El id de la solicitud de la acción: `z.uuid()`, como las demás respuestas.
- La marca `solicitud` de la pantalla de verificar: `z.uuid()` y después `getMyApplication`; una
  mal formada o ajena se descarta.
