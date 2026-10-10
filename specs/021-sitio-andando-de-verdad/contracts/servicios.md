# Contratos — lo que el sitio manda afuera y lo que recibe

Todo lo que sale del sitio hacia un servicio de afuera en esta historia, campo por campo. Lo que no
está en estas listas no sale (FR-021, FR-033). Los tests de `posthogEvent` y `failureEnvelope`
comparan contra estas formas.

## 1. Un momento de la medición → PostHog EU

`POST https://eu.i.posthog.com/i/v0/e/` · `content-type: application/json` · desde el servidor,
después de responder (`deliver`), con timeout de 3 s. Solo si `VERCEL_ENV` existe y hay
`POSTHOG_PROJECT_KEY`.

```json
{
  "api_key": "<POSTHOG_PROJECT_KEY>",
  "event": "pet_viewed",
  "distinct_id": "<marca de visita | sin-visita>",
  "timestamp": "2026-10-10T15:04:05.000Z",
  "properties": {
    "origin": "shared",
    "$process_person_profile": false,
    "$geoip_disable": true,
    "entorno": "production"
  }
}
```

- `properties` = las del momento (las de `EventProps` en `events.ts`, sin cambios salvo `origin` de
  `pet_viewed`) + las tres fijas. Nunca `$ip`, `$current_url`, `$referrer`, `$set`, `$set_once`,
  `$user_id` ni nada que una visitas.
- Si una propiedad del momento tuviera el mismo nombre que una fija, gana la fija (test).
- La respuesta no se lee más que para el timeout; un error se traga.

## 2. El aviso de una falla → Sentry (región UE)

`POST https://<host de ingesta del DSN>/api/<id del proyecto>/envelope/` · `content-type:
application/x-sentry-envelope` · `x-sentry-auth: Sentry sentry_version=7,
sentry_key=<clave pública del DSN>, sentry_client=adopciones/1` · desde el servidor, después de
responder, timeout de 3 s. Solo si `VERCEL_ENV` existe y hay `SENTRY_DSN`.

Cuerpo: tres líneas JSON separadas por `\n`.

```text
{"event_id":"<uuid sin guiones>","sent_at":"<ISO>","dsn":"<SENTRY_DSN>"}
{"type":"event"}
{"event_id":"<igual>","timestamp":"<ISO>","platform":"node","level":"error","environment":"production","message":"pet_sheet · open_screen","tags":{"pantalla":"pet_sheet","paso":"open_screen"},"fingerprint":["pet_sheet","open_screen","TypeError"],"exception":{"values":[{"type":"TypeError","value":"<scrub(message)>","stacktrace":{"frames":[{"filename":"src/…","function":"…","lineno":12}]}}]}}
```

- Los marcos: solo `filename` (relativo a la raíz del proyecto), `function` y `lineno`/`colno`;
  nunca `vars`, `context_line`, `pre_context` ni `post_context`.
- Una falla sin `Error` (un servicio que respondió mal, una tarea sin vuelta): `exception` lleva
  `type` = el paso y `value` = `scrub` de la descripción; sin `stacktrace`.
- Si `scrub` deja el mensaje vacío, `value` es `""`.
- Nunca: `user`, `request`, `contexts`, `breadcrumbs`, `extra`, `server_name`, `modules`, `release`
  con algo que no sea el SHA del commit (`VERCEL_GIT_COMMIT_SHA`, que no dice nada de nadie).

## 3. Las rutas que llaman las tareas

| Ruta | Método | Quién | Autenticación | Hace | Responde |
|---|---|---|---|---|---|
| `/api/cron/limpieza` (nueva) | `POST` | `daily_cleanup_tick` (base) | `x-cron-secret` | `purgePetPhotos()`; si termina, `recordTaskRun('daily-cleanup')`; si lanza o deja fotos sin borrar (`{ ok: false }`), `reportFailure` (pantalla `no_screen`, paso `daily-cleanup`) y la vuelta no se anota | `204`; `401` sin cuerpo sin el secreto |
| `/api/cron/vigilancia` (nueva) | `POST` y `GET` | `task_watch_tick` (base, cada 15 min) y Vercel Cron (diario) | `x-cron-secret` o `Authorization: Bearer` | `listTaskRuns()` → `staleTasks()` → por cada una, `claimTaskAlert()` y, si es la primera del día, `reportFailure` (pantalla `no_screen`, paso = la tarea, descripción «sin vuelta completa hace <minutos> min»). Con `GET` (Vercel), al terminar, además `recordTaskRun('vigilancia-diaria')` | `204`; `401` |

**Ajuste de Build (US5)**: la descripción del aviso dice los minutos y no la fecha en ISO: el aviso
pasa por `scrub`, que se lleva `2026-10-12` como si fuera un teléfono. La hora del aviso, menos esos
minutos, es desde cuándo.
| `/api/cron/publicaciones`, `/identidad`, `/resumen` (existen) | `POST` | la base | `x-cron-secret` | lo de hoy; lo que hoy va a `console.error` pasa además por `reportFailure` | sin cambio |

## 4. El enlace de Compartir

`shareUrl(code)` = `<APP_URL>/animales/<code>?desde=compartir`.

- La ficha con y sin `?desde=compartir`: el mismo HTML salvo el momento de la medición; la misma
  `canonical` (`<APP_URL>/animales/<code>`), el mismo `og:url`, la misma imagen.
- `?desde=` con cualquier otro valor no marca nada (`unknown` o lo que diga el `referer`).

## 5. Encabezado de no indexar

Mientras `INDEXING_ENABLED` sea `false`, toda respuesta del sitio lleva
`X-Robots-Tag: noindex, nofollow`. `robots.txt` sigue como está.

## 6. `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "node scripts/deploy/build.mjs",
  "regions": ["fra1"],
  "git": { "deploymentEnabled": { "**": false, "main": true } },
  "crons": [{ "path": "/api/cron/vigilancia", "schedule": "0 10 * * *" }]
}
```
