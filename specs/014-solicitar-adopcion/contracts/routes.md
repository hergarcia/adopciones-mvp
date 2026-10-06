# Contratos — rutas, acciones, correos y eventos

## Rutas (todas bajo `[locale]`, `es` sin prefijo)

| Ruta | Zona | Indexa | Qué es |
|---|---|---|---|
| `/animales/{code}` (cambia) | `(public)` | según `INDEXING_ENABLED` | Suma `ApplyAction` y `RequiredLevelLine` (R8). |
| `/solicitar/{code}` | `(app)` | `noindex` | Registra `apply_tapped`. Sin sesión → `/entrar?next=/solicitar/{code}` (`requireProfile`). Con sesión: la rama de `applyGate` (R5): cuestionario, límite, identidad, animal que no recibe solicitudes, animal de alguien que bloqueaste (redirige a la ficha, que ya lo dibuja), Mi solicitud (redirige), ficha propia (redirige). Sin nivel 1 → `verifyPath({ reason: 'apply', next: '/solicitar/{code}?tras=telefono', from: '/animales/{code}' })`. |
| `/solicitar/{code}/enviada?solicitud={id}` | `(app)` | `noindex` | Solicitud enviada. Sin una solicitud propia con ese id → Mis solicitudes. |
| `/mis-solicitudes` | `(app)` | `noindex` | Mis solicitudes. `?retirada=<id>` muestra la confirmación con el nombre del animal, solo si esa es una retirada propia (cambió en Build). |
| `/mis-solicitudes/{id}` | `(app)` | `noindex` | Mi solicitud; ajena o inexistente → `notFound()` (el `AppNotFound` de `(app)`). |
| `/verificar-identidad?pedir=1&animal={code}` (cambia) | `(app)` | `noindex` | El formulario de #11 lleva el código en un campo oculto. |
| `POST /api/solicitudes/abandono` | Route Handler | — | Cuerpo `{ lastQuestion }`; valida contra los ids y registra `application_abandoned`; responde 204. Sin sesión requerida. |

`metadata` de cada página con textos de `messages/es.json` (`metadata.applications.*`).

## Server Actions (`src/actions/applications.ts`) → `ActionResult<T>`

| Acción | Entrada | Salida |
|---|---|---|
| `submitApplication(input)` (un objeto validado con zod, no `FormData`: las respuestas viajan como objeto; cambió en Build) | `code`, `attemptId`, `startedAt`, `proposedUsed`, `after`, `answers` | `ok: { id }` · errores: `applications.errors.connection` (lo pone el cliente cuando la acción no llega), `.missing` (con `detail.fields`), `.contact` (con `detail.fields`), `.limit`, `.has_active` (con `detail.id`), `.unavailable`, `.not_receiving`, `.needs_phone` (con `detail.redirect`), `.needs_identity` (con `detail.redirect`), `.failed`. `already` cuenta como `ok`. |
| `withdrawApplication(id: string)` (sin `from`: adónde va lo decide el diálogo; cambió en Build) | id | `ok: null` · `applications.withdraw.errors.{already_withdrawn,closed,not_found,failed}`. |
| `checkApplicationAttempt(attemptId: string)` | intento | `ok: { id \| null }`. |
| `trackApplicationMoment('started', { proposed })` | — | `ok: null`. |

Cada acción con sesión pasa por `getSessionUser()` (la puerta de la suspendida, #13).

Cambian:

- `submitIdentityRequest`: lee `returnCode` opcional y lo pasa a la base.
- `savePet` / `publishPet`: `requiredLevel` en el schema de la publicación.
- `changePetStatus`, `deletePet`, `resolvePetReview` (baja), `blockPerson`, `suspendAccount`:
  registran `application_closed` por cada cierre que provocaron (R11).

## Correos

- **Identidad aprobada** (cambia): con `return_code`, suma «Ver a {nombre}» → `/solicitar/{code}`
  además del enlace de siempre a «Mi perfil». Sin datos de la solicitud.
- Ningún correo nuevo (FR-034, FR-066).

## Eventos (R11)

`apply_tapped`, `apply_stopped`, `application_started`, `application_abandoned`, `application_sent`,
`application_withdrawn`, `application_closed`. Ninguno lleva ids, nombres, respuestas ni el código
del animal.
