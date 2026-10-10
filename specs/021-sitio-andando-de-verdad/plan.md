# Implementation Plan: El sitio andando de verdad en una dirección provisoria

**Branch**: `feature/169-sitio-andando-direccion-provisoria` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/021-sitio-andando-de-verdad/spec.md` (6 user stories). Decisiones técnicas en
[research.md](./research.md) (R1–R17); la base, los tipos y las reglas puras en
[data-model.md](./data-model.md); lo que sale hacia PostHog y Sentry, las rutas de las tareas, el
enlace de Compartir y `vercel.json` en [contracts/servicios.md](./contracts/servicios.md); la puesta
en marcha y la comprobación de cada user story en [quickstart.md](./quickstart.md).

## Summary

Hoy todo corre en local. Al terminar, el sitio corre en Vercel (Hobby, `fra1`) con su base en
Supabase Cloud (gratis, Frankfurt), en `<proyecto>.vercel.app`, sin direcciones de prueba, sin los
sembrados y con cada respuesta marcada para no indexar. El código sale por Twilio de verdad; las
tareas de la base suman las dos limpiezas diarias y anotan cada vuelta, y una vigilancia avisa la
tarea que se atrasó; cada momento de la medición llega a PostHog EU y cada falla a Sentry UE, los dos
desde el servidor, sin SDK y sin un byte más en el navegador; la visita a una ficha dice de cuál de
ocho orígenes llegó, con la marca `?desde=compartir` en el enlace de Compartir. Dos scripts corren
las pruebas de privacidad y la medición de velocidad contra el sitio de verdad y dejan la tabla para
la historia.

Cinco decisiones ordenan el plan:

1. **La Unión Europea por ley** (R2): la base y sus imágenes en Frankfurt (Ley 18.331 art. 23); el
   servidor al lado, para pagar la distancia una vez por pedido.
2. **Sin SDK, desde el servidor** (R5, R8, R9): PostHog y Sentry por `fetch` después de responder,
   como Twilio. Sale exactamente lo que dicen los contratos, se prueba, y la ficha sigue en 141,6 KB.
3. **Las migraciones antes que el código** (R3): la construcción de producción empuja las migraciones
   y después compila; `package.json` no cambia.
4. **Cada tarea anota su vuelta** (R6, R7): una tabla privada de vueltas, una regla pura de plazos y
   un aviso por tarea y por día; la base llama a la vigilancia cada 15 minutos y Vercel una vez por
   día, que además mantiene despierta la base.
5. **Sin direcciones de prueba** (R1): FR-008 por construcción; lo que harían falta para prenderlas
   queda escrito.

## Technical Context

**Language/Version**: TypeScript (`strict`), React 19, Next.js 16 (App Router), las versiones de
`main`. Node 26 en local y CI; en Vercel, research R4.

**Primary Dependencies**: las de `main`. **Ninguna nueva** (R17).

**Storage**: Supabase Cloud (Postgres 17 de la imagen de Supabase), región `eu-central-1`. Una
migración nueva: `private.task_runs`, `private.task_alerts`, seis funciones y la reagenda de los
trabajos de `pg_cron` (data-model).

**Testing**: Vitest para las reglas puras (`visit-origin`, `referrer-kinds`, `share-url`,
`stale-tasks`, `is-cron-request`, `scrub`, `screen-name`, `is-fault`, `envelope`, `posthog`,
`should-deliver`, `robots-headers`) y para la base (`task-runs`, `phone-sign-in`); el e2e de #57 que lee el
enlace copiado se ajusta a la marca. Stryker al 100 % sobre lo que tiene test.

**Target Platform**: web; producción en Vercel Hobby `fra1`.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: LCP < 2,5 s, JS de apertura ≤ 150 KB, Lighthouse mobile ≥ 90 en la portada,
el listado y una ficha, **contra el sitio de verdad** (US6). Cero JS nuevo en el cliente salvo
`ReportClientFailure`, que vive dentro de los `error.tsx` (no está en el camino de apertura de
ninguna pantalla).

**Constraints**: nada se indexa (`INDEXING_ENABLED` sigue en `false`); ningún texto nuevo en
`messages/es.json`; ningún dato personal nuevo; nada sale a PostHog ni a Sentry desde local, CI o
las pruebas; ningún archivo de la lista de `scripts/protected/rules.mjs` cambia (ni `package.json`
`scripts`, ni `.lighthouserc.json`, ni `playwright.config.ts`, ni `.github/`).

**Scale/Scope**: 1 migración; 3 rutas (`/api/cron/limpieza` y `/api/cron/vigilancia` nuevas, las
tres de hoy cambian poco); `src/instrumentation.ts` nuevo; módulos chicos nuevos en `lib/`
(`cron/tasks`, `cron/stale-tasks`, `analytics/visit-origin`, `analytics/referrer-kinds`,
`analytics/posthog`, `errors/*`, `delivery/deliver`, `delivery/should-deliver`, `seo/robots-headers`, `email/deliverable`,
`schemas/errors`); 1 query nueva
(`lib/supabase/queries/task-runs.ts`); 1 acción nueva (`reportScreenFailure` en
`actions/errors.ts`); 1 componente nuevo sin UI (`components/errors/report-client-failure.tsx`); los
`error.tsx` existentes montan ese componente; `actions/*.ts` cambian sus retornos de falla a
`failed()`; `lib/email/*` y `lib/sms/send-sms.ts` suman `reportFailure`; `vercel.json`,
`scripts/deploy/build.mjs`, `scripts/cloud/privacy-check.mjs`, `scripts/cloud/speed-check.mjs`;
`next.config.ts` suma `headers()`; docs.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra proveedores, rutas ni tablas; el cómo está acá. |
| **II. Una feature, un PR** | Seis user stories en un PR, en el orden de la spec. US1–US5 se construyen y se prueban en local; su comprobación en vivo y US6 necesitan las cuentas (§Para Ship). |
| **III. Compuertas verdes** | `pnpm verify` sin red, como hoy: nada sale a servicios desde local o CI. Se testea lo que engaña o expone si se rompe: el origen de la visita, la marca, lo que sale a PostHog y a Sentry, la limpieza de mensajes, qué es falla, los plazos de las tareas, la puerta de las rutas de tareas, los permisos de las funciones nuevas, y que el teléfono no sirva para entrar. |
| **IV. Reglas como código** | Las reglas de privacidad de lo que sale son tests sobre funciones puras (`posthogEvent`, `failureEnvelope`, `scrub`); que la lista de tareas de la base y la de la aplicación coincidan, y que la purga use los plazos de #10, es un test de base. |
| **V. Datos personales** | Ningún dato personal nuevo; `private.*` sin acceso para `anon`/`authenticated` (test); lo que sale a PostHog y Sentry no lleva persona, conexión ni ubicación (tests + ajustes de los paneles); la base en la UE (FR-060); `phone-sign-in` prueba que el teléfono no es una llave, en local y en la nube. |
| **VI. Sin deriva** | Nada de «Fuera del MVP». Lo que la historia excluye (nombre, dominio, indexar, invitar, puerta, pantallas o textos nuevos, tablero propio, grabar la pantalla, WhatsApp, reintentar KL-029, planes pagos) queda afuera. |
| **VII. Liviana y linda** | Cero JS nuevo en la apertura; sin SDK en el cliente; el presupuesto se mide contra el sitio de verdad. Ninguna pantalla cambia (§Diseño). |
| **VIII. Autonomía con veto** | Se decide y se avisa en Ship: la región UE (regla de privacidad nueva), sin direcciones de prueba, sin SDK, las migraciones en la construcción, los plazos de la vigilancia y, si pasa, Node en Vercel (R4). Lo reservado a Hernán (cuentas) no se hace: queda la guía. No se toca ninguna compuerta. |

**Sin violaciones.** Complexity Tracking vacío.

## Diseño

**No aplica: ninguna pantalla cambia** (spec §Pantallas). Lo único que toca un componente es
`ReportClientFailure`, que no dibuja nada (`return null`) y se monta dentro de cada `error.tsx` sin
cambiar su JSX visible; el botón Compartir arma otro enlace con el mismo texto. Sin tokens, sin
textos, sin estados nuevos: la pantalla de error sigue con su título, cuerpo y «Reintentar». No hace
falta el skill `frontend-design:frontend-design` ni capturas para el design-reviewer más allá de
confirmar que la pantalla de error y la ficha se ven iguales.

## Project Structure

### Documentation (this feature)

```text
specs/021-sitio-andando-de-verdad/
├── story.md, spec.md, checklists/requirements.md
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/servicios.md
└── tasks.md          # /speckit-tasks
```

### Source Code

```text
vercel.json                                  nuevo: construcción, región, cron diario, solo main
next.config.ts                               headers(): robotsHeaders(INDEXING_ENABLED)
.env.example                                 SUPABASE_DB_URL, POSTHOG_PROJECT_KEY, SENTRY_DSN
.gitignore                                   .env.cloud
scripts/
  deploy/build.mjs                           db push (solo producción) + pnpm build
  deploy/build.test.mjs                      qué corre según VERCEL_ENV y qué falta
  cloud/privacy-check.mjs                    pruebas de privacidad contra la nube + tabla
  cloud/speed-check.mjs                      Lighthouse + peso de apertura contra la nube + tabla
supabase/migrations/<ts>_tareas_en_la_nube.sql
src/
  instrumentation.ts                         onRequestError → reportFailure
  app/api/cron/limpieza/route.ts             nueva
  app/api/cron/vigilancia/route.ts           nueva (POST de la base, GET de Vercel)
  app/api/cron/{publicaciones,identidad,resumen}/route.ts   reportFailure donde hoy console.error
  app/[locale]/_components/error-screen.tsx  recibe error y monta <ReportClientFailure />
  app/[locale]/**/error.tsx                  le pasan error a ErrorScreen (27); los 3 de
                                             solicitudes/** montan <ReportClientFailure /> directo
  actions/result.ts                          failed(key, step, cause?)
  actions/errors.ts                          reportScreenFailure({ path, name }) → ActionResult<null>
  lib/schemas/errors.ts                      clientFailureSchema (path, name)
  lib/email/deliverable.ts                   isDeliverable(email): sin dominios reservados (RFC 2606)
  actions/*.ts                               return failed(…) en los *_failed y *.errors.unknown
  components/errors/report-client-failure.tsx   hoja cliente sin UI
  lib/cron/tasks.ts · stale-tasks.ts · is-cron-request.ts (cambia)
  lib/analytics/visit-origin.ts · referrer-kinds.ts · posthog.ts · track.ts (cambia)
  lib/analytics/listing-events.ts            petViewEvent usa petViewOrigin (cambia)
  lib/analytics/events.ts                    PetViewOrigin de visit-origin (cambia)
  lib/pets/share-url.ts                      ?desde=compartir (cambia)
  lib/errors/screen-name.ts · scrub.ts · is-fault.ts · envelope.ts · report.ts
  lib/delivery/deliver.ts                    deliver(send): after() y el timeout, sin test hermano
  lib/delivery/should-deliver.ts             shouldDeliver(env), pura y con test
  lib/seo/robots-headers.ts
  lib/sms/send-sms.ts                        tope de espera a Twilio (US2, R13); reportFailure
                                             cuando no sale (cambia)
  lib/email/*.ts                             reportFailure donde hoy console.error; por Resend,
                                             saltean !isDeliverable (cambia)
  lib/supabase/queries/task-runs.ts          listTaskRuns, recordTaskRun, claimTaskAlert
  lib/env.ts                                 las tres opcionales nuevas
  app/[locale]/(public)/animales/[code]/page.tsx   lee searchParams.desde (cambia)
tests/
  db/task-runs.test.ts · db/phone-sign-in.test.ts
  e2e/support/opening-weight.ts              extraída de animales-rendimiento.spec.ts
  e2e/animales.spec.ts                       el enlace copiado lleva la marca (cambia)
docs/
  07-stack.md · 03-mvp-features.md · known-limitations.md · puesta-en-marcha.md · README.md
```

**Capas**: las rutas y la acción componen; `lib/errors`, `lib/analytics`, `lib/cron` son lógica
pura más el envío; la única lectura de la base nueva está en `lib/supabase/queries/task-runs.ts`; el
componente nuevo no hace fetch: llama a una Server Action.

## Qué se testea (y qué no)

| Archivo | Qué afirma | Por qué |
|---|---|---|
| `src/lib/analytics/visit-origin.test.ts` | Tabla: marca + `referer` de Facebook → `shared`; marca + `referer` del listado → `shared`; sin marca: `/animales` del mismo host → `listing`, `/` → `home`, `/p/x` → `site`; `m.facebook.com` → `social`; `facebook.com.evil.com` → `unknown`; `www.google.com.uy` → `search`; `gemini.google.com` → `assistant`; `utm_source=chatgpt.com` sin `referer` → `assistant`; `?desde=otra` → no marca; `referer` vacío, inválido u otro sitio → `unknown`; otro host con la ruta del listado → no `listing`. | FR-023/FR-024: un origen mal contado decide mal si el enlace en los grupos funciona (docs/03 §3). |
| `src/lib/analytics/referrer-kinds.test.ts` | Sufijo de dominio estricto en las tres listas; `google.<tld>`; host en mayúsculas. | Base de lo anterior; los bordes de dominio son los que mienten. |
| `src/lib/pets/share-url.test.ts` | `shareUrl('ABC')` = `<APP_URL>/animales/ABC?desde=compartir`; el mismo sufijo para cualquier código; nada que dependa de la persona. | FR-024: la marca no identifica a nadie. |
| `src/lib/analytics/posthog.test.ts` | El cuerpo tiene exactamente `api_key`, `event`, `distinct_id`, `timestamp`, `properties`; `properties` = las del momento + `$process_person_profile: false`, `$geoip_disable: true`, `entorno`; una propiedad del momento con nombre de fija no la pisa; nunca `$ip`, `$set`, `$current_url`. | FR-021: lo que sale a un tercero es lo que más expone si se rompe. |
| `src/lib/errors/envelope.test.ts` | Las tres líneas; el evento tiene solo las claves de contracts §2; marcos sin `vars`/`context_line`; sin `Error` → `type` = paso y sin pila; `x-sentry-auth` con la clave pública del DSN; la URL de ingesta sale del DSN. | FR-033. |
| `src/lib/errors/scrub.test.ts` | Correo, `099 123 456`, `+598 99123456`, `4.123.456-7`, UUID, `Key (email)=(x@y.uy)`, texto entre comillas → fuera; primera línea; tope de 200; lo que queda vacío → `''`. | FR-033, spec §Edge Cases «Un aviso con datos adentro». |
| `src/lib/errors/screen-name.test.ts` | `/animales/AB12CD` y `/app/[locale]/(public)/animales/[code]` (la forma de `onRequestError`) → `pet_sheet`; con y sin prefijo de idioma; `/administrar/personas/<id>` → `admin_person`; desconocida → `other_screen`; nunca devuelve un segmento de la dirección. | La pantalla del aviso no puede llevar el identificador de una persona. |
| `src/lib/errors/is-fault.test.ts` | `profile.errors.save_failed`, `verification.errors.send_failed`, `verification.claim.errors.unknown` → falla; `pets.errors.invalid`, `moderation.errors.not_admin`, `identity.errors.session`, `verification.errors.code_format` → no. | FR-032: los rechazos no llenan el registro. |
| `src/lib/schemas/errors.test.ts` | `clientFailureSchema`: `{ path: '/animales/AB', name: 'TypeError' }` pasa; `path` sin `/`, de 201 caracteres o con salto de línea, `name` con espacios, dígitos, `<`, o de 41 letras → no pasa. | La acción es pública: el schema es lo único que impide meter texto libre en el registro (FR-033). |
| `src/lib/email/deliverable.test.ts` | `x@example.test`, `x@foo.example`, `x@a.invalid`, `x@localhost`, mayúsculas → `false`; `x@gmail.com`, `x@test.com.uy`, `x@mitest.uy` → `true`. | Sin eso, la comprobación de privacidad contra la nube llena el registro de rechazos de Resend. |
| `src/lib/delivery/should-deliver.test.ts` | `shouldDeliver`: sin `VERCEL_ENV` (o vacío) → no, aunque haya clave; con `development` (`vercel dev`, `vercel env pull`) → no; con `production` o `preview` y sin clave → no; con las dos → sí. | Spec §Edge Cases: en local y en las pruebas no sale nada. |
| `src/lib/cron/stale-tasks.test.ts` | Plazo exacto no avisa, un segundo más sí, para 5 min, 1 h, 1 día y `vigilancia-diaria`; tarea sin fila → vieja; fila de una tarea desconocida → ignorada. | FR-043: avisar de más es ruido, de menos es no enterarse. |
| `src/lib/cron/is-cron-request.test.ts` | `x-cron-secret` correcto, `Bearer` correcto → sí; secreto equivocado, vacío, ausente en el entorno, `Bearer` sin valor → no. | Las rutas de tareas mandan correos: abiertas, cualquiera los dispara. |
| `src/lib/seo/robots-headers.test.ts` | Sin indexación → `X-Robots-Tag: noindex, nofollow` en `/:path*`; con indexación → nada. | FR-002: lo que entra a un índice generativo no se retira. |
| `scripts/deploy/build.test.mjs` | Con `VERCEL_ENV=production`: sin `SUPABASE_DB_URL` falla y la nombra; con ella, primero `db push` (sin `--include-seed`, con `--yes` y `--skip-vault`) y después `pnpm build`; con `preview` o sin `VERCEL_ENV`, solo `pnpm build`. Los comandos se prueban como lista, sin ejecutarlos. | FR-006 y que la base nunca quede detrás del código. |
| `tests/db/task-runs.test.ts` | data-model §Pruebas de base. | Privacidad de lo nuevo y que la purga use los plazos de #10. |
| `tests/db/phone-sign-in.test.ts` | Pedir un código de ingreso con un teléfono da error y no crea persona. | FR-014, KL-017; corre también contra la nube. |
| `tests/e2e/animales.spec.ts` (cambia) | El enlace copiado termina en `/animales/<code>?desde=compartir`; el HTML de la ficha con y sin la marca lleva la misma `canonical`, el mismo `og:url` y la misma `og:image`. | Ya existía con la dirección; se ajusta a la marca. Que la marca no cambie la tarjeta (FR-024) depende del HTML real. |

Mutación: `scripts/mutation.mjs` muta los archivos con test hermano. Los envíos (`report.ts`,
`track.ts`, `deliver`) y las rutas no tienen test hermano: son plomería sobre funciones probadas.
Por eso `shouldDeliver` vive en su propio archivo (Build, US1): con las dos en `deliver.ts`, su test
hermano arrastraba a Stryker la parte de `after()`, que el plan deja sin test. Un equivalente que quede se anota en su línea.

**Nada** para las rutas, `instrumentation.ts`, `ReportClientFailure`, `failed()` (llama a dos
funciones probadas), las queries finas de `task-runs.ts`, ni los scripts de `cloud/` (se usan una
vez, a mano, y su salida la lee una persona).

## Docs que cambian en este PR

- `docs/07-stack.md`: fila «Analytics + feedback» y «Errores» dicen «por su API, sin SDK, región
  UE»; fila «Tareas programadas» dice `pg_cron` + la vigilancia de Vercel Cron; **Decisiones
  (2026-10-10, agente)**: R2 región UE, R1 sin direcciones de prueba, R3 migraciones en la
  construcción, R5/R8 sin SDK, R7 la vigilancia; y R4 si hizo falta. Las siete decisiones de la
  historia ya se copiaron a docs/03, docs/04 y docs/07 en la etapa Spec.
- `docs/03-mvp-features.md` §Métricas de éxito: **Cómo se leen**, una línea por métrica (qué
  momento, qué propiedad, qué cuenta): (1) `pet_published` con `ordinal` 2 o 3+ cuenta personas que
  publicaron más de uno; (2) de los pedidos de identidad con origen «lo exigió una publicación»,
  cuántos terminan `identity_request_approved`, sobre `identity_request_started` con ese origen; (3)
  `application_first_response` (horas) y aceptadas sobre `application_sent`; (4) las opiniones de #71
  en Administrar. Build confirma cada nombre contra `events.ts`.
- `docs/known-limitations.md`: KL-016 y KL-53-1 **resueltas**; KL-11-2 resuelta (la aplicación
  siempre está); KL-017 y KL-11-1 resueltas con la comprobación de US6 (se anota el resultado);
  KL-010 se cierra con el primer mensaje real (aceptación). **Nuevas**: los momentos y avisos de
  cuando PostHog o Sentry no responden se pierden; con la aplicación caída nadie avisa de una tarea
  atrasada; sin direcciones de prueba; y, si pasa, Node 24 en Vercel (R4).
- `docs/puesta-en-marcha.md` (nuevo, de `quickstart.md` §A) y su línea en `docs/README.md`.
- `.env.example`: las tres variables nuevas con su comentario.

## Fuera de este plan

- Llevar las compuertas de CI al sitio de verdad o a las direcciones de prueba (docs/09 §Sin Vercel
  hasta el MVP lo menciona para M5): `.github/` y `.lighthouserc.json` necesitan `reglas-aprobadas`,
  y la historia no lo pide. Para Ship.
- El callback de estado de Twilio (KL-011), reintentar el correo de KL-029, y todo lo de #76.

## Para Ship

- **Las cuentas son de Hernán.** Build construye y prueba todo en local (`pnpm verify` sin red).
  Las tareas marcadas `[CUENTAS]` en `tasks.md` (la puesta en marcha y la comprobación en vivo de cada
  user story, y US6 entera) necesitan las cuentas de `quickstart.md` §A. Si no existen, el PR se abre
  igual con lo construido, la historia queda estacionada (`en-pausa`) y el aviso lista exactamente
  qué crear, en el orden de `quickstart.md`. No se espera una respuesta.
- El aviso de la historia lleva: la región UE (FR-060, regla de privacidad nueva), sin direcciones de
  prueba, sin SDK, las migraciones en la construcción, los plazos de la vigilancia, el origen «otra
  pantalla del sitio» y R4 si pasó.

## Complexity Tracking

Vacío.
