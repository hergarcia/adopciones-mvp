# Research — El sitio andando de verdad en una dirección provisoria

Decisiones técnicas del plan, cada una con lo que se eligió, por qué y lo que se descartó. Las
fuentes externas se consultaron el 2026-10-10.

## R1. Alojamiento: Vercel Hobby, solo `main`, región `fra1`

**Decisión**: el proyecto de Vercel se conecta al repositorio y despliega a producción cada push a
`main`. Las direcciones de prueba quedan **apagadas** con `vercel.json`:

```json
{ "git": { "deploymentEnabled": { "**": false, "main": true } }, "regions": ["fra1"] }
```

(«si una rama coincide con varias reglas y una es `true`, se despliega»: `main` sí, todo lo demás
no; docs de Vercel, Git configuration). Las funciones corren en `fra1` (Frankfurt), al lado de la
base (R2). La dirección provisoria es la de producción del proyecto, `<proyecto>.vercel.app`
(docs/04 §Cómo construir sin nombre: «Deploy en `*.vercel.app` hasta tener dominio»).

**Por qué**: FR-008 se cumple por construcción: sin direcciones de prueba no hay forma de que un
cambio sin revisar toque los datos de verdad ni mande mensajes. El pipeline ya prueba todo contra
`next start` en local (docs/09 §Sin Vercel hasta el MVP), así que una vista previa no le suma
nada a la corrida. Lo que la spec pide de una dirección de prueba (fuera de buscadores, sus propios
datos, sin mensajes) queda escrito en `quickstart.md` §Si algún día se prenden las direcciones de
prueba, para el día que se prendan: un segundo proyecto gratuito de la base y sin `TWILIO_*`.

**Descartado**: vistas previas contra la base de verdad (un PR sin revisar leería datos
personales); vistas previas con un segundo proyecto de la base (el plan gratuito permite dos, pero
suma otra configuración de Google, de Vault y de secretos para algo que hoy nadie usa).

## R2. La base en la nube: Supabase Cloud gratis, en la Unión Europea

**Decisión**: proyecto de Supabase Cloud en plan gratuito, región **`eu-central-1` (Frankfurt)**.

**Por qué (FR-060)**: la Ley 18.331 (art. 23) prohíbe llevar datos personales a un país sin nivel
adecuado de protección. La lista de la Unidad Reguladora (Res. 23/021, actualizada por Res. 63/023)
incluye a los países de la Unión Europea; Brasil quedó como **no adecuado** en la Res. 23/021, y de
Estados Unidos solo valen las organizaciones del Data Privacy Framework, y no se pudo confirmar que
Supabase lo esté. Frankfurt es la región de la UE que comparten Supabase, Vercel (`fra1`), PostHog
(EU Cloud) y Sentry (región `de`).

**Costo en velocidad**: Montevideo–Frankfurt son ~230 ms de ida y vuelta, contra ~40 ms de São
Paulo. El servidor y la base quedan juntos (R1), así que la distancia se paga una vez por pedido y
no por consulta. La portada, el listado y la ficha se miden en US6 contra el sitio de verdad; si
alguno no entra en el presupuesto por la distancia, gana la ley (spec §Assumptions) y se trabaja el
caché de esas pantallas, no la región.

**Respaldos (KL-11-1)**: el plan gratuito de Supabase no tiene respaldos diarios («We automatically
back up all Pro, Team, and Enterprise Plan projects»), y la recuperación a un punto en el tiempo es
paga. Mientras el proyecto siga en el plan gratuito, ninguna copia guarda una imagen de identidad
borrada. La comprobación (US6) lo anota con la evidencia (el plan del proyecto en el panel) y
KL-11-1 se cierra diciendo que se reabre si el proyecto pasa a un plan pago.

**No se duerme (FR-007)**: el plan gratuito pausa un proyecto sin «actividad de base» en 7 días.
Las tareas de la base escriben cada 5 minutos (R6) y la vigilancia diaria de Vercel (R7) escribe
por la API una vez por día: las dos cuentan como actividad. La segunda es la que docs/07 §Riesgos
conocidos ya preveía.

## R3. Las migraciones llegan solas a la base antes que el código

**Decisión**: `vercel.json` cambia el comando de construcción a `node scripts/deploy/build.mjs`.
El script, solo con `VERCEL_ENV=production`, corre `pnpm exec supabase db push --db-url
"$SUPABASE_DB_URL"` y después `pnpm build`; en cualquier otro entorno, solo `pnpm build`. Sin
`SUPABASE_DB_URL` en producción, falla con el nombre de la variable que falta (como `lib/env.ts`).
`SUPABASE_DB_URL` es la cadena del **pooler en modo sesión** (IPv4: la conexión directa de Supabase
es solo IPv6 y la construcción de Vercel no la alcanza). `db push` nunca corre `seed.sql` (sin
`--include-seed`), así que el sitio de verdad arranca sin los sembrados (FR-006). Lleva `--yes`
(la construcción no tiene terminal para confirmar) y `--skip-vault`: `db push` actualiza Vault desde
`[db.vault]` de `config.toml` (hoy comentado), y en la nube Vault guarda la dirección y el secreto de
verdad, cargados a mano (paso 5); un `[db.vault]` prendido para local los pisaría (Build, US1).

**Por qué**: el enjambre mergea solo; si la migración la tuviera que empujar una persona, el código
nuevo saldría antes que su base. Las migraciones son *forward-only* y aditivas (docs/08), así que
una base un paso adelante del código no rompe nada si después falla la construcción.

**La primera vez** la corre el equipo a mano (`quickstart.md` paso 3), para ver cualquier error de
una migración contra la nube con calma; después, sola en cada despliegue.

**Descartado**: un paso de GitHub Actions (`.github/workflows/` necesita `reglas-aprobadas`); la
integración de GitHub de Supabase (despliega con su propio ritmo, no antes del código); empujar a
mano siempre (el código nuevo saldría antes que su base).

`package.json` no cambia (`scripts` es compuerta): el comando nuevo vive en `vercel.json`.

## R4. La versión de Node en Vercel

**Riesgo**: `package.json` pide `"node": ">=26"`, y la página de versiones de Vercel (actualizada
el 2026-02-27) lista 24.x, 22.x y 20.x. Vercel Sandbox ya ofrece 26, pero no se encontró el anuncio
para construcciones y funciones.

**Decisión**: la primera tarea de US1 lo comprueba en la documentación vigente y en el panel. Si
26.x está, no cambia nada. Si no está, es una bifurcación de verdad: la regla 1 de `CLAUDE.md` dice
buscar otra cosa antes que bajar Node, pero cambiar de alojamiento es un cambio transversal (su
propio PR, docs/07). En modo automático se decide: **se sigue con Vercel y `engines` pasa a
`">=24"`** (CI y local siguen en 26, que es la última; no se fija nada viejo, se baja el piso que se
declara), se registra como **Decisión (fecha, enjambre)** en docs/07 y va al aviso, con «volver a
`>=26` cuando Vercel lo ofrezca» como condición en `docs/known-limitations.md`. El código no usa
nada exclusivo de 26: lo confirma correr `pnpm verify` con Node 24 en la máquina antes del cambio.

**Resultado (Build, US1, 2026-10-10)**: la página de Vercel sigue en 24.x, 22.x y 20.x (la misma
del 2026-02-27) y el esquema de su API de proyectos no tiene `26.x`. Se aplicó la decisión:
`engines.node` a `">=24"`, la decisión en docs/07 y KL-169-1. Con Node 24.21 en la máquina, antes
del cambio, se corrió lo que llega a Vercel: las pruebas unitarias y de compuertas, `pnpm build` y
las e2e contra `next start`, verdes (una e2e de `telefono` falló una vez y pasó al repetirla). Las
de base y la mutación no se repitieron con 24: corren en CI y en la máquina con Node, contra la
base, y no viajan a Vercel.

## R5. La medición: PostHog EU por su API, sin SDK

**Decisión**: los momentos van a **PostHog Cloud EU** (`https://eu.i.posthog.com`), la herramienta
que docs/07 ya eligió, por su API de captura con `fetch`, **sin SDK**, como el mensaje de Twilio
(docs/07, decisión 2026-09-22). `track.ts` sigue siendo el único punto: `record()` arma el pedido con
`posthogEvent()` (función pura, `lib/analytics/posthog.ts`) y lo manda con `deliver()` (R9), que lo
hace después de responder.

Lo que viaja, y nada más (contracts/servicios.md):

- `event`: el nombre del momento, como hoy.
- `distinct_id`: la marca de visita (o `sin-visita`), que muere con el navegador.
- `properties`: las del momento, más `$process_person_profile: false` (sin perfil de persona en
  PostHog: no une visitas), `$geoip_disable: true` (sin ubicación) y `entorno` (`production` o
  `preview`).
- `timestamp`: la hora del momento.

El pedido sale **del servidor**, nunca del navegador: PostHog no ve la dirección de la persona ni le
deja nada guardado (FR-021, spec §Edge Cases «Nada nuevo en el teléfono»), y no se suma ni un byte
de JavaScript (presupuesto de la ficha: 141,6 KB de 150). En el panel de PostHog, además, se apaga
«guardar la IP del cliente» (`quickstart.md`), porque la IP que vería es la del servidor de Vercel.

**Cuándo sale**: solo si corre en Vercel (`VERCEL_ENV` presente) **y** hay `POSTHOG_PROJECT_KEY`. En
local, en CI y en las pruebas nunca sale (spec §Edge Cases «Las pruebas no se mezclan»): el
`console.info('[medición] …')` de hoy sigue igual. Con timeout de 3 s; si falla, se pierde (spec
§Assumptions) y no se reporta al registro de errores (no es una falla que vea una persona).

**Descartado**: `posthog-js` (decenas de KB en el cliente, una cookie propia que une visitas, y
grabación de pantalla, excluida); `posthog-node` (una dependencia para un `fetch`, con su cola y su
`shutdown` que en una función de Vercel hay que esperar a mano); Plausible o Umami (docs/03 §7 los
nombra, pero docs/07 ya decidió PostHog y Hernán no lo reabrió).

## R6. Las tareas solas en la nube

Lo que ya existe sigue igual: `pg_cron` y `pg_net` en la base (docs/07, decisión 2026-09-26), con
`app_url` y `cron_secret` en Vault. En la nube, esos dos secretos los carga el equipo una vez
(`quickstart.md` paso 5), porque el `seed.sql` no corre.

**Nuevo, en una migración** (`supabase/migrations/<ts>_tareas_en_la_nube.sql`):

1. `phone-records-purge`, diaria (`41 4 * * *`): `public.purge_phone_records('24 hours', '7 days')`.
   Los dos plazos son `WINDOW_HOURS` y `PENDING_TTL_DAYS` de `lib/verification/rules.ts`, escritos
   en el SQL como ya hace `identity-expire` («nadie de la aplicación está para pasarlos»), con un
   test de base que los compara (data-model §Pruebas). La llamada desde `requestCode` se queda:
   limpiar de más no daña, y corre igual sin la nube (KL-016 se cierra).
2. `daily-cleanup`, diaria (`53 4 * * *`): `public.daily_cleanup_tick()` hace `net.http_post` a
   `/api/cron/limpieza`, que corre `purgePetPhotos()` (las fotos se borran por la API de Storage, no
   desde SQL) y anota su vuelta (KL-53-1 se cierra). Las tres llamadas desde las acciones se quedan.
3. `cron-history-purge`, diaria (`7 5 * * *`): borra `cron.job_run_details` de más de 7 días, como
   recomienda Supabase para que el historial de `pg_cron` no crezca solo.
4. `task-watch`, cada 15 minutos: `public.task_watch_tick()` hace `net.http_post` a
   `/api/cron/vigilancia` (R7).
5. **La vuelta de cada tarea** (`private.task_runs`, data-model): cada tarea de la base anota su
   vuelta al terminar bien. Las tareas que ya existen se vuelven a agendar con el mismo nombre
   (`cron.schedule` con un nombre que ya existe reemplaza su comando) para sumar
   `select private.task_ran('<tarea>')` después de la llamada, en el mismo comando: si la llamada
   falla, la vuelta no se anota y la vigilancia lo ve. Ningún archivo de migración viejo cambia. Las rutas de la aplicación que corren
   a diario (`/api/cron/limpieza`, `/api/cron/vigilancia` desde Vercel) anotan la suya por RPC.

**Lo pendiente (FR-042)**: cada tarea ya toma lo vencido con `<= now()` (los vencimientos, los
recordatorios, el seguimiento, los avisos de la bandeja de salida), así que la vuelta siguiente hace
lo que quedó. Lo comprueba Build leyendo cada `*_tick` (tarea T0xx); lo que no lo cumpla se arregla en
la misma migración. El resumen que no salió no se manda tarde (KL-73-1) y el correo de vencimiento
de identidad de más de un día se descarta (#11): los dos ya están así.

**Lo que encontró Build (US5, T052)**: todas toman lo vencido con `<= now()`. El correo de
vencimiento de identidad era el único que se marcaba después de mandar; pasa a tomarse y marcarse
antes, con `claim_identity_expiry_notices()` (data-model §Funciones).

**Dos vueltas a la vez**: las tareas ya reclaman lo que procesan con `for update skip locked` o
marcando antes de mandar (#59 `claim_*`, #73 `claim_admin_digests`); nada nuevo.

**Descartado**: Vercel Cron para las tareas (en Hobby corre una vez por día con ±59 minutos; las de
5 minutos no entran); leer `cron.job_run_details` para la vigilancia (no ve las vueltas de la
aplicación y sus mensajes de error pueden traer datos de una fila).

## R7. La vigilancia: cuándo una tarea no corrió y quién avisa

**Decisión**: `/api/cron/vigilancia` (ruta nueva) lee las vueltas (`listTaskRuns()`), calcula con
`staleTasks(runs, now)` (pura, `lib/cron/stale-tasks.ts`) cuáles se pasaron de su plazo y, por cada
una, si `claim_task_alert(tarea)` dice que hoy (día de Uruguay) todavía no se avisó, manda el aviso al
registro de errores (pantalla «ninguna», paso = la tarea, qué falló = «sin vuelta desde <hora>»).

Los plazos (spec §Edge Cases «Una tarea que no corrió»), en `lib/cron/tasks.ts`, una sola fuente:

| Tarea | Frecuencia | Avisa si la última vuelta tiene más de |
|---|---|---|
| `pet-lifecycle`, `identity-expire`, `identity-expiry-mail` | 5 min | 10 min |
| `follow-ups` | 1 h | 2 h |
| `admin-digest`, `phone-records-purge`, `daily-cleanup`, `pet-renewal-links-purge`, `withheld-numbers-purge`, `cron-history-purge` | 1 día | 25 h |
| `vigilancia-diaria` (la de Vercel) | 1 día | 26 h (Vercel corre con ±59 min) |

Una tarea que nunca corrió cuenta desde que la vigilancia la ve por primera vez sin vuelta (la fila
se crea al aplicar la migración con `last_ok_at = now()`), para no avisar de todo el día que se
sube la base.

**Quién la llama**: la base, cada 15 minutos (`task-watch`, R6), y **Vercel Cron una vez por día**
(`vercel.json`, `"crons": [{ "path": "/api/cron/vigilancia", "schedule": "0 10 * * *" }]`, 7 de la
mañana de Uruguay). La de Vercel cubre el caso de que se caiga `pg_cron` (todas las vueltas quedan
viejas) y es la escritura diaria por la API que mantiene despierta la base (R2). Vercel Cron llama con
`GET` y `Authorization: Bearer <CRON_SECRET>`; la base, con `POST` y `x-cron-secret`.
`isCronRequest` acepta las dos formas, con el mismo secreto (test).

**Si la aplicación está caída**, nadie avisa: la vigilancia vive en la aplicación. Se acepta: un sitio
caído lo nota cualquiera que lo abra, y Vercel lo muestra en su panel. Va a
`docs/known-limitations.md`.

## R8. El registro de errores: Sentry EU por su API, sin SDK

**Decisión**: los avisos van a **Sentry** (docs/07: «Errores: Sentry»), proyecto en la región de la
UE (`de.sentry.io`), por su endpoint de *envelope* con `fetch`, **sin SDK**. Un solo módulo,
`lib/errors/`, con:

- `reportFailure({ screen, step, error })` (servidor): arma el aviso con `failureEnvelope()` (pura) y
  lo manda con `deliver()` (R9). Es lo único que habla con Sentry.
- `failureEnvelope()`: el evento lleva **solo** `message` (pantalla · paso), `level: 'error'`,
  `timestamp`, `environment` (`production` / `preview`), `tags: { pantalla, paso }`,
  `fingerprint: [pantalla, paso, nombre del error]` (agrupa repeticiones, spec §Edge Cases) y
  `exception` con el nombre, el mensaje limpio (R10) y los marcos de la pila **sin variables
  locales** (archivo, función, línea). Nada de `user`, `request`, `contexts`, `breadcrumbs`,
  `extra` ni `server_name`.
- En el proyecto de Sentry se prende «Prevent Storing of IP Addresses» y se dejan prendidos los
  «Data Scrubbers» por defecto (`quickstart.md`): una segunda red, no la primera.

**Por qué sin SDK**: `@sentry/nextjs` mete en el cliente entre 20 y 30 KB comprimidos aunque se lo
recorte, y la ficha abre en 141,6 KB de 150; del lado del servidor manda por defecto encabezados,
URL con sus parámetros y migas de pan que habría que ir sacando uno por uno. Con el *envelope* a mano
sale exactamente lo que FR-033 permite, y se prueba (test de `failureEnvelope`).

**Cuándo sale**: igual que la medición (R5): solo en Vercel y con `SENTRY_DSN`. En local, el
`console.error` de hoy.

**Descartado**: el error tracking de PostHog (cambiaría la fila «Errores» de docs/07 sin un motivo
que lo pida; con la API de Sentry cuesta lo mismo); `@sentry/nextjs` del lado del servidor solo
(sigue mandando lo que no queremos y suma OpenTelemetry al arranque de cada función).

## R9. Mandar después de responder: `deliver()`

**Decisión**: `lib/delivery/deliver.ts` con `deliver(task)`: dentro de un pedido usa `after()` de
`next/server` (ya se usa para `purgePetPhotos`), así la persona nunca espera a PostHog ni a Sentry
(FR-026, FR-034); fuera de un pedido (si `after` lanza), `void task()`. Cada envío lleva
`AbortSignal.timeout(3000)` y se traga su error. `shouldDeliver(env)` (pura) decide si corresponde:
`VERCEL_ENV` presente y la clave del servicio presente.

**Ajuste de Build (US1)**: `shouldDeliver` vive en `lib/delivery/should-deliver.ts`, con su test, y
`deliver` en `lib/delivery/deliver.ts`, sin test (plomería, plan §Qué se testea). `VERCEL_ENV`
cuenta solo si es `production` o `preview`: `vercel dev` y `vercel env pull` traen `development` a
la máquina del equipo. `deliver(send)` le pasa a `send` la señal del timeout, para que cada envío la
ponga en su `fetch`.

## R10. Qué falla, en qué pantalla, en qué paso

**Fuentes de un aviso** (FR-030, FR-031):

1. **Al dibujar una pantalla o en una ruta**: `src/instrumentation.ts` exporta `onRequestError(err,
   request, context)` (Next 15+, docs de Next 16.4), que recibe `context.routePath` —la ruta del
   archivo, como `/app/[locale]/(public)/animales/[code]`, **sin** el código de la ficha— y
   `context.routeType` (`render` | `route` | `action` | `proxy`). Pantalla = `screenName(routePath)`;
   paso = `open_screen` (`render`), el nombre de la tarea (`route` bajo `/api/cron/`) o `action`.
   Es la falla que termina en un `error.tsx`. Ahí no se usa `after()`: la documentación de Next pide
   **esperar** lo asíncrono dentro de `onRequestError`, así que manda con `await` y el timeout de
   3 s. Nunca se usa `request.path` (lleva los parámetros) ni `request.headers`.
2. **En una Server Action que devuelve una falla**: las acciones no lanzan (`ActionResult`), así que
   `onRequestError` no las ve. `src/actions/result.ts` suma `failed(key, step, cause?)`, que devuelve
   `{ ok: false, error: key }` y, si `isFaultKey(key)` (pura: las claves `*_failed` y
   `*.errors.unknown`, data-model), reporta con la pantalla del `referer` (`screenName` de su
   ruta) y el paso dado. Build reemplaza los `return { ok: false, error: '…_failed' }` de
   `src/actions/*.ts` por `failed(…)`. Los rechazos por una regla (`invalid`, `cap`, `not_admin`,
   `already`…) no pasan por ahí (FR-032).
3. **En un servicio**: `send-sms.ts` cuando el mensaje no sale (pantalla «verificar teléfono», paso
   «pedir el código»); los `console.error('[correo] …')` de `lib/email/` pasan a
   `reportFailure` con su paso (FR-031; los 21 lugares de hoy ya no llevan datos, R-auditoría
   abajo). Desde una tarea, pantalla «ninguna».
4. **En el navegador, sin pasar por el servidor**: un error que nace en un componente cliente llega
   al `error.tsx` sin `digest`. Los `error.tsx` montan `ReportClientFailure` (hoja cliente sin UI,
   `components/errors/`), que con `useEffect` llama a la acción `reportScreenFailure({ path, name })`
   solo si **no** hay `digest` (con `digest`, el servidor ya lo reportó por la vía 1). La acción saca
   la pantalla de `path` con `screenName` y manda solo el nombre del error, nunca su mensaje (en el
   navegador puede traer lo que la persona escribió). La acción es pública (la puede llamar
   cualquiera), así que valida con `clientFailureSchema` (`lib/schemas/errors.ts`): `path` de hasta
   200 caracteres que empieza con `/`, `name` con solo letras de hasta 40 (`TypeError`); lo demás se
   descarta sin reportar. Así nadie mete texto libre en el registro, y una ráfaga la frena el límite
   de Sentry y el `fingerprint`, que la junta en un solo problema. No cambia nada de lo que se ve. Lo monta
   `ErrorScreen` (`app/[locale]/_components/error-screen.tsx`), que pasa a recibir `error`: 27 de los
   30 `error.tsx` ya la usan y solo le pasan la prop; los otros 3 (`solicitudes/**`) montan
   `ReportClientFailure` directo.
5. **Lo que pasa solo en el navegador y no termina en un `error.tsx`** (una foto que no se pudo
   procesar, la conexión que se corta al guardar) no se reporta: no es una falla del sitio ni de un
   servicio, y la pantalla ya dice qué hacer. Va a `docs/known-limitations.md`.

**`screenName(path)`** (pura, `lib/errors/screen-name.ts`): una tabla de patrones de las rutas que
existen (`/animales/[code]` → `pet_sheet`, `/verificar-telefono` → `phone_verification`…) contra la
ruta normalizada: sin `/app`, sin `/page`, sin grupos `(…)`, sin `[locale]` ni prefijo de idioma.
Acepta las dos formas, la del archivo (de `onRequestError`) y la dirección real (del `referer` o del
navegador); lo que no coincide → `other_screen`. Nunca devuelve un
segmento de la dirección: los nombres son claves en inglés (`pet_sheet`, `phone_verification`) que
viajan como etiqueta, no textos de la interfaz (no van a `messages/es.json`: no los ve nadie del
sitio; docs/06 permite claves en inglés para lo que no es interfaz).

**`scrub(text)`** (pura, `lib/errors/scrub.ts`), sobre el mensaje del error: toma la primera línea,
borra lo que va entre comillas, paréntesis después de `=` (el `Key (email)=(…)` de Postgres),
correos, secuencias de 7 o más dígitos (teléfonos, cédulas), UUID y códigos de ficha, y corta en 200
caracteres. Si después de limpiar no queda nada útil, el aviso sale sin descripción (spec §Edge
Cases «Un aviso con datos adentro»).

**Auditoría de lo que ya se escribe al registro**: los 21 `console.error`/`console.info` de `src/`
(grep del 2026-10-10) no llevan correo, teléfono ni nombre; el de la medición lleva la marca de
visita, que es lo que ya viaja (FR-021). No cambia nada; el registro del alojamiento guarda una hora
en el plan Hobby.

**Ajuste de Build (US4)**:

- **Qué es una falla en una acción**: las acciones usan también `<ns>.errors.failed` (sin prefijo),
  así que `isFaultKey` cuenta el último segmento `failed`, los que terminan en `_failed` y
  `unknown`. `failed()` va donde la base o un servicio no respondieron (un registro `null`, un
  `catch`, un `!ok`); una entrada que no pasa su schema o una sesión que no está siguen como
  rechazos aunque devuelvan la misma clave. Donde el resultado viene de una regla de la base
  (`saved.error`), `failed()` lo recibe igual y avisa solo si la clave es de falla.
- **La pantalla de quien pidió** sale de `lib/errors/request-screen.ts` (`requestScreen()`: el
  `Referer` por `screenName`, `no_screen` sin él o fuera de un pedido). La usan `failed()`, los
  correos y el mensaje de texto: el código se pide desde «verificar teléfono» o desde la pantalla
  del código, así que la pantalla no va fija.
- **Correos**: `reportEmailFailure(qué)` (`lib/email/report-email-failure.ts`) reemplaza a los
  `console.error('[correo] …')`, porque `reportFailure` sin Sentry ya escribe al registro del
  servidor: los dos juntos duplicaban la línea en local. Solo viaja qué correo y qué pasó; la causa
  del servicio puede traer la casilla y no viaja.
- **Tareas**: el paso es el nombre de la tarea de la base que llama a cada ruta
  (`lib/cron/route-tasks.ts`, `ROUTE_TASKS`; US5 suma `limpieza` y `vigilancia`), y
  `onRequestError` lo saca de la ruta del archivo con `routeTask`. Además de los `console.error`,
  los `.catch(() => [])` mudos de las rutas (reclamar recordatorios, vencimientos, seguimientos,
  avisos de identidad) pasan por `taskFailed(tarea, [])`: no poder reclamar es una tarea que no
  terminó (FR-031).
- **Del navegador**: `exception.type` es el paso (`open_screen`) y `value`, el nombre del error;
  sin un `Error` del servidor no hay pila que mandar.
- **Las tres de `solicitudes/**`** reexportan `InboxError`, que ya usa `ErrorScreen`: le pasa
  `error` como las demás, en vez de montar `ReportClientFailure` aparte. El tipo de las props de un
  `error.tsx` es `ErrorBoundaryProps`, de `error-screen.tsx`.
- **El código que salió y no quedó anotado** (`settle_failed`) también llega, con el paso
  `settle_code`: la persona ve que no salió y el equipo se entera de por qué.

## R11. El origen de una visita a una ficha y la marca de compartido

**Decisión**: `shareUrl(code)` (`lib/pets/share-url.ts`) agrega `?desde=compartir`, el mismo valor
fijo para todas las fichas y personas. `desde` ya es el nombre de las marcas de origen del sitio
(`?desde=resumen`, #73). La ficha:

- declara su dirección propia sin la marca (`alternates.canonical: petPath(code)`, ya es así);
- arma la misma tarjeta (los metadatos no leen la marca);
- no redirige para sacarla: quien la copia de la barra y la pasa lleva la marca (spec §Edge Cases).

`petViewOrigin({ marked, referer, host, utmSource })` (pura, `lib/analytics/visit-origin.ts`), en
este orden, la primera que vale:

1. `marked` → `shared`.
2. `referer` del mismo host → `listing` (ruta del listado), `home` (`/`) u `site` (otra).
3. `referer` o `utm_source` de un asistente → `assistant` (antes que buscadores:
   `gemini.google.com` no es Google Búsqueda; ChatGPT suma `utm_source=chatgpt.com` y no manda
   `referer`).
4. de un buscador → `search`; 5. de una red social → `social`.
6. cualquier otra cosa → `unknown`.

Las listas (`lib/analytics/referrer-kinds.ts`) comparan el **host** por sufijo de dominio
(`m.facebook.com` es Facebook; `facebook.com.evil.com` no): redes `facebook.com`, `fb.com`,
`instagram.com`, `t.co`, `x.com`, `twitter.com`, `tiktok.com`, `linkedin.com`, `lnkd.in`,
`threads.net`, `whatsapp.com`; buscadores `google.<tld>` (incluye `google.com.uy`), `bing.com`,
`duckduckgo.com`, `yahoo.com`, `ecosia.org`, `search.brave.com`; asistentes `chatgpt.com`,
`chat.openai.com`, `claude.ai`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`.

`PetViewOrigin` pasa de `listing | home | outside` a los ocho valores, en inglés (enums en inglés,
docs/06). Lo que hoy era `outside` se reparte: no hay datos que migrar (la medición solo se escribía
al registro local).

**Ajuste de Build (US3)**: `google.<tld>` se lee como Google Búsqueda solo sin subdominio o con `www.`
(el correo y los documentos de Google no son un buscador). `SHARE_MARK` vive en
`lib/pets/share-url.ts` para no sumarle las listas al navegador (data-model).

## R12. Fuera de buscadores en toda dirección

Ya está (Ready): `robots.ts` cierra todo salvo a los lectores de vista previa, y las pantallas
emiten `robots` según `INDEXING_ENABLED`. **Se suma** un encabezado `X-Robots-Tag: noindex,
nofollow` en **toda** respuesta mientras `INDEXING_ENABLED` sea `false` (`next.config.ts`,
`headers()`, con la regla en `lib/seo/robots-headers.ts`, pura), para que ninguna dirección —una
pantalla que se olvidó su `robots`, una imagen, una ruta de la API— quede guardable. Los lectores de
vista previa no leen ese encabezado para armar la tarjeta (es de indexación), así que FR-002 se
cumple igual; lo comprueba `quickstart.md` pegando el enlace en WhatsApp.

## R13. El código por mensaje de texto

Nada de código nuevo salvo el aviso de falla (R10) y un tope de espera de 10 s al pedido a Twilio: el
envío ya está (#10), pero sin tope un Twilio que no contesta deja a la persona esperando hasta que
Vercel corta la función, y ve un error en vez de lo de FR-009a de #10 (US2, escenario 6); con el tope,
la espera cortada es una falla del servicio, como la red caída. En Vercel van las tres
`TWILIO_*` solo en producción. En la cuenta de Twilio (Hernán, `quickstart.md`): *Messaging
Geographic Permissions* solo Uruguay y la protección contra el bombeo de mensajes prendida (KL-010,
FR-012). El primer mensaje real cierra KL-010. KL-011 (los rechazos tardíos) sigue: el callback de
estado no es de esta historia.

## R14. Ingreso con Google y el teléfono que no sirve para entrar

En el proyecto de la nube (`quickstart.md`): *Site URL* = la dirección provisoria; *Redirect URLs*
= `https://<dirección provisoria>/**`; el proveedor de Google con su cliente, y en Google Cloud la
URI de redirección `https://<ref>.supabase.co/auth/v1/callback`; el proveedor de **teléfono
apagado** (lo está por defecto). Un test de base nuevo, `tests/db/phone-sign-in.test.ts`, intenta
pedir un código de ingreso por teléfono como visitante y espera el rechazo: corre en local en cada
`pnpm test` y, contra la nube, en la comprobación de privacidad (FR-050, KL-017).

## R15. Las comprobaciones contra el sitio de verdad

**Privacidad** (`scripts/cloud/privacy-check.mjs`): lee `.env.cloud` (ignorado por git; la URL, la
clave anónima y la de servicio del proyecto de la nube) y se niega a correr sin él o si la URL es
local. Antes de empezar borra las personas de prueba que hayan quedado (`prueba+…@example.test`, por
la API de administración). Corre `vitest run --project db <archivos>` con ese entorno (el arnés ya
toma las variables del proceso antes que `.env.local`) y después vuelve a barrer. Imprime una tabla
en Markdown regla por regla (pasó / falló / no corrió) para pegar en la historia.

**Ningún correo a una casilla de prueba**: las pruebas de base dejan avisos en la bandeja de salida
(una solicitud nueva, por ejemplo) que la vuelta de 5 minutos mandaría por Resend a
`prueba+…@example.test`. Resend lo rechazaría y el registro de errores se llenaría de eso. Se suma
`isDeliverable(email)` (pura, `lib/email/deliverable.ts`): `false` para los dominios reservados de la
RFC 2606 (`.test`, `.example`, `.invalid`, `.localhost`). Cuando el correo sale **por Resend**, una
casilla así se saltea en silencio (no es una falla); cuando se escribe a `.artifacts/mail/` (local,
sin clave), se escribe como hoy, porque de ahí leen los e2e.

Los archivos, por regla de FR-050 (Build confirma que ninguno usa `sql()` por `/pg/query`, que la
nube no publica, ni cambia algo global; el que lo haga sale de la lista con el motivo y su regla se
cubre con otro):

| Regla | Archivos |
|---|---|
| El contacto se ve solo con la solicitud aceptada | `applications-privacy`, `application-responses-privacy`, `adoptions-privacy` |
| El teléfono nunca es público | `phones`, `profiles` |
| Las imágenes de identidad las ve solo quien revisa y se borran al resolver | `identity` |
| El teléfono no sirve para ingresar | `phone-sign-in` (nuevo, R14) |
| Sin respaldos donde sobreviva una imagen | manual: el plan del proyecto y la recuperación a un punto apagada, con captura (R2) |

**Velocidad** (`scripts/cloud/speed-check.mjs <dirección> <código de una ficha>`): Lighthouse con
`@lhci/cli` (ya instalado) y los mismos `settings` de `.lighthouserc.json` (teléfono, red simulada),
tres corridas por pantalla, mediana de LCP y nota; y el peso de apertura con Playwright, con la misma
medida que `tests/e2e/animales-rendimiento.spec.ts` (se extrae a `tests/e2e/support/opening-weight.ts`
y la usan los dos). Imprime la tabla para la historia. En Windows, `lhci` sale con error al borrar su
carpeta temporal (KL-001) pero deja los resultados: el script los lee igual.

## R16. Variables de entorno de producción

En Vercel, **solo en Production**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (R3), `NEXT_PUBLIC_APP_URL` (la dirección
provisoria), `CRON_SECRET` (el mismo que en Vault), `RESEND_API_KEY`, `NEXT_PUBLIC_SUPPORT_EMAIL`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`, `POSTHOG_PROJECT_KEY`,
`SENTRY_DSN`; opcional `NEXT_PUBLIC_SUPPORT_WHATSAPP`. Las nuevas (`SUPABASE_DB_URL`,
`POSTHOG_PROJECT_KEY`, `SENTRY_DSN`) entran a `.env.example` con su comentario y a `lib/env.ts` como
opcionales. Ninguna con `NEXT_PUBLIC_` salvo las que ya lo tenían: la clave de PostHog y el DSN de
Sentry solo los usa el servidor.

## R17. Dependencias

**Ninguna nueva.** PostHog y Sentry por `fetch`; `after()` es de Next; `pg_cron` y `pg_net` ya
están. Lo único que cambia de docs/07 son decisiones: R2 (región), R5, R8 (sin SDK), R1 (sin
direcciones de prueba) y, si hace falta, R4.
