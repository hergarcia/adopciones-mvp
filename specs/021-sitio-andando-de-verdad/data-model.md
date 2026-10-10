# Data model — El sitio andando de verdad en una dirección provisoria

Ningún dato personal nuevo (FR-061). Lo nuevo en la base son las vueltas de las tareas y los avisos
ya dados, en el esquema `private` (no lo publica la API). Lo demás son tipos y cargas que salen del
servidor hacia PostHog y Sentry (contracts/servicios.md).

## Base: migración `<ts>_tareas_en_la_nube.sql`

Una sola migración, *forward-only*. `<ts>` es el siguiente a `20261011120000` (Build lo crea con
`pnpm exec supabase migration new tareas_en_la_nube`).

### `private.task_runs`

| Columna | Tipo | Nota |
|---|---|---|
| `task` | `text` primary key | El nombre de la tarea, en inglés: el mismo que su trabajo de `pg_cron` (`pet-lifecycle`…) o el de la ruta (`daily-cleanup`, `vigilancia-diaria`). |
| `last_ok_at` | `timestamptz not null default now()` | La última vuelta que terminó bien. |

- Se siembra en la migración una fila por tarea de `lib/cron/tasks.ts` con `now()`: la vigilancia
  cuenta desde que se aplicó (research R7).
- El esquema `private` no está expuesto y nadie fuera de `postgres` tiene permisos (`revoke all …
  from public, anon, authenticated`). Además, RLS prendida y **sin ninguna política** en las dos
  tablas, como defensa en profundidad: si algún día el esquema se expusiera, no se lee nada. Las
  funciones `security definer` de abajo las leen y escriben como su dueño.

### `private.task_alerts`

| Columna | Tipo | Nota |
|---|---|---|
| `task` | `text not null` | |
| `alerted_on` | `date not null default public.uruguay_today()` | El día de Uruguay del aviso. |
| primary key | `(task, alerted_on)` | Un aviso por tarea y por día (FR-043). |

- Se borra lo de más de 30 días en `cron-history-purge` (no sirve para nada después).

### Funciones

| Función | Seguridad | Quién | Qué hace |
|---|---|---|---|
| `private.task_ran(p_task text)` | `security invoker`, `search_path = ''` | los comandos de `pg_cron` (corren como `postgres`, dueño de la tabla) | `insert … on conflict (task) do update set last_ok_at = now()`. |
| `public.record_task_run(p_task text)` | `security definer`, `search_path = ''` | `service_role` | Lo mismo, para las rutas de la aplicación. `revoke` a `public, anon, authenticated`. |
| `public.list_task_runs()` | `security definer`, `search_path = ''`, `stable` | `service_role` | `returns table (task text, last_ok_at timestamptz)`. |
| `public.claim_task_alert(p_task text)` | `security definer`, `search_path = ''` | `service_role` | `insert … on conflict do nothing returning true`; `false` si ya se avisó hoy. |
| `public.daily_cleanup_tick()` | `security invoker` | `pg_cron` | Como `identity_expiry_mail_tick`: lee `app_url` y `cron_secret` de Vault y hace `net.http_post` a `/api/cron/limpieza`. Sin secretos, no hace nada. |
| `public.task_watch_tick()` | `security invoker` | `pg_cron` | Igual, a `/api/cron/vigilancia`. |

Las funciones `public.*` nuevas siguen el patrón de las que ya existen: `revoke all … from public,
anon, authenticated` y `grant execute … to service_role` (Supabase concede `execute` a `anon` y
`authenticated` sobre toda función nueva de `public`).

### Trabajos de `pg_cron`

| Trabajo | Agenda (UTC) | Comando |
|---|---|---|
| `pet-lifecycle` (se reemplaza) | `*/5 * * * *` | `select public.pet_lifecycle_tick(); select private.task_ran('pet-lifecycle')` |
| `identity-expire` (se reemplaza) | `*/5 * * * *` | `select public.expire_identity_requests(30, 1); select private.task_ran('identity-expire')` |
| `identity-expiry-mail` (se reemplaza) | `*/5 * * * *` | `…identity_expiry_mail_tick(); select private.task_ran('identity-expiry-mail')` |
| `follow-ups` (se reemplaza) | `10 * * * *` | `…run_follow_up_tick(); select private.task_ran('follow-ups')` |
| `admin-digest` (se reemplaza) | `0 11 * * *` | `…admin_digest_tick(); select private.task_ran('admin-digest')` |
| `pet-renewal-links-purge` (se reemplaza) | `17 4 * * *` | el `delete` de hoy `; select private.task_ran('pet-renewal-links-purge')` |
| `withheld-numbers-purge` (se reemplaza) | `29 4 * * *` | `…purge_withheld_numbers(); select private.task_ran('withheld-numbers-purge')` |
| `phone-records-purge` (nuevo) | `41 4 * * *` | `select public.purge_phone_records('24 hours', '7 days'); select private.task_ran('phone-records-purge')` |
| `daily-cleanup` (nuevo) | `53 4 * * *` | `select public.daily_cleanup_tick()` (la vuelta la anota la ruta al terminar) |
| `cron-history-purge` (nuevo) | `7 5 * * *` | borra `cron.job_run_details` de más de 7 días y `private.task_alerts` de más de 30; `select private.task_ran('cron-history-purge')` |
| `task-watch` (nuevo) | `*/15 * * * *` | `select public.task_watch_tick()` |

Los comandos exactos de las tareas que ya existen se copian de su migración (Build los lee; esta
tabla los abrevia). El nombre de cada trabajo es el de `TASKS` en `lib/cron/tasks.ts`: un test de
base compara las dos listas.

### Pruebas de base (`tests/db/task-runs.test.ts`, local)

- Visitante y persona sintética no pueden llamar `record_task_run`, `list_task_runs` ni
  `claim_task_alert` (permiso denegado), ni leer `private.*`.
- `claim_task_alert('x')` da `true` la primera vez del día y `false` la segunda.
- `record_task_run` mueve `last_ok_at` hacia adelante.
- Los trabajos de `cron.job` son exactamente los de `TASKS` menos `vigilancia-diaria` (la llama Vercel), más `task-watch`, y el
  comando de `phone-records-purge` lleva `'24 hours'` y `'7 days'`, que son `WINDOW_HOURS` y
  `PENDING_TTL_DAYS` (si alguien cambia la regla de #10 y no el SQL, falla). Usa `sql()` por
  `/pg/query`, que existe en local.

`tests/db/phone-sign-in.test.ts` (nuevo, local y nube): `anonClient().auth.signInWithOtp({ phone:
'+59899123456' })` devuelve error y no crea ninguna persona.

## Tipos y reglas puras (`src/lib/`)

### `lib/cron/tasks.ts`

```ts
export const TASKS = {
  'pet-lifecycle': { everyMinutes: 5 },
  'identity-expire': { everyMinutes: 5 },
  'identity-expiry-mail': { everyMinutes: 5 },
  'follow-ups': { everyMinutes: 60 },
  'admin-digest': { everyMinutes: 1440 },
  'phone-records-purge': { everyMinutes: 1440 },
  'daily-cleanup': { everyMinutes: 1440 },
  'pet-renewal-links-purge': { everyMinutes: 1440 },
  'withheld-numbers-purge': { everyMinutes: 1440 },
  'cron-history-purge': { everyMinutes: 1440 },
  'vigilancia-diaria': { everyMinutes: 1440, graceMinutes: 120 },
} as const
export type TaskName = keyof typeof TASKS
```

Plazo de aviso (research R7): 5 min → 10; 60 → 120; 1440 → 1500 (25 h); `vigilancia-diaria`
1440 + 120 (Vercel ±59 min).

### `lib/cron/stale-tasks.ts`

`staleTasks(runs: { task: string; lastOkAt: Date }[], now: Date): { task: TaskName; since: Date }[]`
— una tarea de `TASKS` sin fila cuenta como vieja desde `now`; una fila de una tarea que no está en
`TASKS` se ignora; el borde es estricto (justo el plazo no avisa, un segundo más sí).

### `lib/analytics/visit-origin.ts`

```ts
export const PET_VIEW_ORIGINS = [
  'listing', 'home', 'site', 'shared', 'social', 'search', 'assistant', 'unknown',
] as const
export type PetViewOrigin = (typeof PET_VIEW_ORIGINS)[number]
export const SHARE_MARK = { param: 'desde', value: 'compartir' } as const
```

`petViewOrigin({ marked, referer, host, utmSource })` con el orden de research R11.
`pet_viewed: { origin: PetViewOrigin }` en `events.ts` cambia a este tipo (antes
`listing | home | outside`).

### `lib/analytics/referrer-kinds.ts`

`referrerKind(url: URL): 'social' | 'search' | 'assistant' | null` con las tres listas de research
R11 y comparación por sufijo de dominio (`hostMatches(host, domain)`: igual, o termina en
`.<domain>`; `google.<tld>` como regla aparte).

### `lib/errors/`

| Archivo | Exporta |
|---|---|
| `screen-name.ts` | `SCREENS` (patrón de ruta → clave en inglés: `home`, `listing`, `pet_sheet`, `sign_in`, `profile`, `phone_verification`, `identity_request`, `my_pets`, `publish_pet`, `edit_pet`, `apply`, `applications`, `admin`, `questions`, `levels`, `public_profile`…, la lista sale de `src/app/[locale]`), `screenName(path)` → clave, `other_screen` si nada coincide, `no_screen` para una tarea. |
| `scrub.ts` | `scrub(message: string): string` (research R10). |
| `is-fault.ts` | `isFaultKey(key: string): boolean` — `true` para `*_failed` y `*.errors.unknown`. |
| `envelope.ts` | `failureEnvelope({ screen, step, error, environment, now, dsn })` → `{ url, headers, body }` del *envelope* de Sentry (contracts/servicios.md). |
| `report.ts` | `reportFailure({ screen, step, error })` — servidor; `shouldDeliver` + `deliver`. |

`step` es una clave en inglés también (`open_screen`, `request_code`, `save_profile`, `send_email`,
el nombre de la tarea…). Ninguna de estas claves es texto de la interfaz.

### `lib/delivery/should-deliver.ts` y `lib/delivery/deliver.ts`

`shouldDeliver(env: { VERCEL_ENV?: string; key?: string }): boolean` (`VERCEL_ENV` en `production`
o `preview`) y `deliver(send: (signal: AbortSignal) => Promise<unknown>): void`, que le pasa la
señal del timeout de 3 s a `send` para su `fetch` (research R9).

### `lib/analytics/posthog.ts`

`posthogEvent({ event, props, visit, environment, now })` → el cuerpo de la captura
(contracts/servicios.md). `track.ts` la usa; nadie más.

### `lib/seo/robots-headers.ts`

`robotsHeaders(indexing: boolean)` → `[{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value:
'noindex, nofollow' }] }]` sin indexación, `[]` con indexación. Lo usa `next.config.ts`.

### `lib/cron/is-cron-request.ts` (cambia)

Acepta `x-cron-secret: <secreto>` o `authorization: Bearer <secreto>`; un secreto vacío o ausente en
el entorno rechaza todo, como hoy.

## Lo que no cambia

- Ninguna tabla con datos de personas, ninguna política RLS existente, ningún enum de la base.
- `messages/es.json`: ningún texto nuevo (spec: no cambia ningún texto que la persona ve).
