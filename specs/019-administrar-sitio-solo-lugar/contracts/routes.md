# Contracts: rutas, acciones, tarea, correo y eventos

## Pantallas

| Ruta | Quién | Sin administrar | Metadata |
|---|---|---|---|
| `/administrar` | quien administra | `notFound()` (lo mismo que una ruta que no existe; sin sesión, `requireProfile` manda a ingresar y vuelve, como las demás de `/revision`) | título de `metadata.admin.home` si administra, `common.not_found` si no; `robots: { index: false, follow: false }` |
| `/administrar/personas/[publicId]` | quien administra | `notFound()` | título de `metadata.admin.record` (sin el nombre de la persona) o `common.not_found`; `noindex` |

Parámetros que leen:

- `/administrar?desde=menu|perfil|resumen` → `admin_opened.from` (`parseAdminOrigin`; otro → `other`).
- `/administrar/personas/[publicId]?desde=identidad|publicaciones|reportes|suspendidas|busqueda` →
  `admin_record_opened.from` (`parseRecordOrigin`). `?identidad=<n>&reportes=<n>&suspensiones=<n>&
  publicaciones=<n>` → cuántos se ven de cada parte (`shownCount`, de a 20).

Cada una con `loading.tsx` (esqueleto con la forma) y `error.tsx` (`ErrorScreen` con «Reintentar»).

Las seis listas no cambian de ruta: `/revision`, `/revision/publicaciones`, `/revision/reportes`,
`/revision/suspendidas`, `/revision/opiniones`, `/revision/encuestas`.

## Acción

### `searchPeople(input: unknown): Promise<ActionResult<{ people: PersonResult[]; more: boolean }>>` — `src/actions/admin.ts`

- `adminSearchSchema.safeParse(input)`; si falla → `{ ok: false, error: 'admin.search.errors.too_short' }`.
- Sin sesión o sin administrar → `{ ok: false, error: 'admin.search.errors.not_admin' }`.
- `admin_search_people(query, 20)`; 21 filas → `more: true` y se devuelven 20. Cada `PersonResult`:
  `{ publicId, name, avatarUrl | null, department, locality, isSuspended }` (la foto firmada con la
  sesión).
- Error de la base → `{ ok: false, error: 'admin.search.errors.failed' }`. Nunca lanza.
- Mide `admin_search_done { found }`.

`suspendAccount` / `reactivateAccount` (`src/actions/moderation.ts`): mismas entradas y salidas;
`suspensionSchema` suma `origin?: 'record'`, y las dos revalidan `/administrar` y la ficha.

## Tarea

### `POST /api/cron/resumen` — `src/app/api/cron/resumen/route.ts`

- Sin `x-cron-secret` válido (`isCronRequest`) → `401` sin cuerpo.
- `claimAdminDigests()`; si la llamada falla → `204` sin mandar nada (el día no sale, spec §Edge Cases).
- Por cada fila reclamada, de a una con 600 ms entre correos (el límite de Resend, como los
  recordatorios): `sendAdminDigest(claim, now)`, que nunca lanza; si sale, `admin_digest_sent`.
- `204`.

La llama `admin_digest_tick()` desde `pg_cron` a las 11:00 UTC.

## Correo

### «Hay cosas esperando en Administrar» — `src/lib/email/send-admin-digest.ts`

Plantilla de siempre (`sendEmail` + `NoticeEmailTexts` + `extras.lines`), textos en
`emails.admin_digest`:

- `subject`: «{count, plural, one {Hay # cosa esperando} other {Hay # cosas esperando}} en {app}».
- `heading`: «{count, plural, one {Hay # cosa esperando} other {Hay # cosas esperando}} en
  Administrar»; `body`: «Buen día. Esto espera a que alguien lo resuelva:». La plantilla pide un
  cuerpo entre el título y las líneas, y el saludo es el que las presenta.
- `lines`: una por cola con algo, en el orden de `orderQueues`, armada por `digestLines`:
  «2 reportes sin resolver, el más viejo de hace 20 horas.» / «3 pedidos de identidad, el más viejo de
  hace 3 días: atrasada por 1 día.».
- `button`: «Abrir Administrar» → `APP_URL + /administrar?desde=resumen`.
- `footer`: que llega porque administra el sitio, sin nombres ni datos de nadie.

Ningún nombre, foto, motivo ni texto (FR-062). La dirección, `getAccountEmail(user_id)`; sin dirección,
no sale.

## Eventos (`src/lib/analytics/events.ts`)

| Evento | Props | Cuándo |
|---|---|---|
| `admin_opened` | `{ from: 'menu' \| 'profile' \| 'digest' \| 'other' }` | al dibujar Administrar |
| `admin_queue_overdue` | `{ queue: QueueKey, hours_over: number }` | al dibujar Administrar, una por cola atrasada |
| `admin_digest_sent` | `{ identity_count, identity_hours, pets_count, pets_hours, reports_count, reports_hours: number; overdue: QueueKey[] }` | al salir cada resumen |
| `admin_record_opened` | `{ from: 'identity' \| 'pets' \| 'reports' \| 'suspended' \| 'search' \| 'other' }` | al dibujar una ficha |
| `admin_search_done` | `{ found: boolean }` | al terminar una búsqueda válida |

Todos con `visit: false`. `account_suspended` suma `from: 'record'`.

## Textos (`messages/es.json`)

Namespace nuevo `admin.*`: `nav` (enlace y su etiqueta accesible), `home` (título, colas, esperas,
atrasada, «No hay nada esperando», «Espera a otra persona que administre» y sus tres tipos, las tres
entradas con sus cuentas, «No se pudo contar»), `search` (etiqueta, botón, «Escribí al menos 3
letras», «No encontramos a nadie con ese nombre.», «Hay más: escribí más del nombre», errores,
«Suspendida»), `record` (las cuatro partes, sus vacíos, estados de publicación, «Ver más», «Esta cuenta
ya no existe», «Suspender», «Reactivar»), `back` («Volver a Administrar»). `emails.admin_digest.*`.
`metadata.admin.home` y `metadata.admin.record`. Las claves `back_profile` de las listas dejan de usarse
y se borran.
