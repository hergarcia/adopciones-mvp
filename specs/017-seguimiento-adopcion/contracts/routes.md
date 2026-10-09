# Contratos — rutas, acciones, tarea, correos y eventos

## Rutas (todas bajo `[locale]`, `es` sin prefijo). Ninguna nueva.

| Ruta | Zona | Indexa | Qué cambia |
|---|---|---|---|
| `/mis-solicitudes/{id}` | `(app)` | `noindex` | Con una adopción y su seguimiento (`follow_up_of`): `requested` y `can_answer` → `FollowUpForm`; `answered` → `FollowUpAnswer` con el sello; `closed`, sin nada; antes del pedido, nada. `adoptionView` sin «Yo no adopté» con `follow_up_answered`. El enlace del correo llega acá (sin sesión: ingresar con `next`, que vuelve). Ajena → la de «no existe» de #63. Suspendida → la pantalla de #13 (`requireProfile`). |
| `/mis-solicitudes` | `(app)` | `noindex` | `MyApplicationCard` suma «Contá cómo va» (`TextLink` a la de arriba) para las de `my_open_follow_ups`. |
| `/mis-animales` | `(app)` | `noindex` | Debajo de `HandoverLine` de un adoptado, `FollowUpLine` (`my_pet_follow_ups`, solo `adoption_current`). |
| `/mis-animales/{id}` | `(app)` | `noindex` | `FollowUpSummary` del seguimiento más reciente (`my_pet_follow_ups` + `follow_up_of` por su `application_id`), también si el animal se volvió a publicar. Con `answered` y no `hidden`: `mark_follow_up_seen` (en `after`, mide la primera vez). |
| `/solicitudes/{id}` | `(app)` | `noindex` | `ApplicantHeader` suma `FollowUpHistory` `adopted` (`follow_up_history` con el `public_id` de quien la mandó). En la elegida, `FollowUpSummary` (`follow_up_of`) debajo de `HandoverSummary`; con `answered` y no `hidden`, `mark_follow_up_seen`. |
| `/perfil/{id}` | `(public)` | como hoy | `PublicProfileHeader` suma `FollowUpHistory` `both` (`follow_up_history`). |
| `/animales/{code}` | `(public)` | como hoy | `OwnerCard` suma `FollowUpHistory` `given` (`follow_up_history` con `publisher_public_id`). |

Cada `page.tsx` que cambia mantiene su `metadata`/`generateMetadata`, su `loading.tsx` y su
`error.tsx`. Los números se piden en paralelo con lo que la página ya trae.

## Server Actions (`src/actions/follow-ups.ts`, nueva) → `ActionResult<T>`

| Acción | Entrada | Salida |
|---|---|---|
| `uploadFollowUpPhoto(form)` | `FormData`: `applicationId`, `photoId`, `width`, `height`, `thumbhash`, los tres archivos (`followUpPhotoSchema` para los campos; los archivos con las mismas guardas que `uploadPetPhoto`) | `ok: { photoId }` · `follow_ups.errors.{closed,not_found,limit,photo_invalid,photo_upload_failed,session}`. Sube con servicio después de `stage_follow_up_photo`; si la fila ya no está al terminar, borra lo subido. Sin la compuerta del teléfono verificado (FR-012). |
| `answerFollowUp(input)` | `{ applicationId, photoIds: uuid[1..3], text: string ≤ 500 }` (`followUpAnswerSchema`, compartido con el formulario) | `ok: null` (`answered` o `already`) · `follow_ups.errors.{closed,not_found,invalid,session,failed}`. Después: el evento, `drainApplicationNotices()`, `after(purgeFollowUpPhotos)`, `revalidatePath` de `/mis-solicitudes`, `/mis-solicitudes/{id}`, `/mis-animales`, `/mis-animales/{petId}`, `/solicitudes/{id}`, el perfil público de las dos y la ficha. |

`suspended` no llega a la pantalla: `getSessionUser()` ya lleva a la de suspendida (#13).
`deleteAccount` y `deletePet` suman `purgeFollowUpPhotos()` después del borrado.

## Tarea programada

- `pg_cron` `follow-ups` (`10 * * * *`): `private.request_due_follow_ups()` y
  `private.purge_stale_follow_up_photos()`. Para tests y e2e, `public.run_follow_up_tick()`
  (`service_role`) corre las dos.
- `/api/cron/publicaciones` suma: `claimFollowUpEvents` → eventos; `purgeFollowUpPhotos()`. Los
  avisos ya los manda `drainApplicationNotices()`.

## Correos (bandeja de salida de #65)

| `kind` | A quién | Asunto (es) | Imagen | Botón → |
|---|---|---|---|---|
| `follow_up_requested` | quien adoptó | «¿Cómo va {name}?» | portada (ruta pública de compartir, como el compromiso) | «Contar cómo va» → `/mis-solicitudes/{id}` |
| `follow_up_answered` | quien lo dio | «{person} contó cómo va {name}» | primera foto de la respuesta, adentro (R8) | «Ver cómo va» → `/mis-animales` |

Ninguno lleva teléfono, correo ni el texto de la respuesta. `follow_up_answered` no sale si
`follow_up_answered_for_email` no devuelve nada (bloqueo en el medio, cuenta borrada).

## Eventos (`src/lib/analytics/events.ts`)

| Nombre | Props |
|---|---|
| `follow_up_requested` | — |
| `follow_up_skipped` | `reason: 'account_deleted' \| 'ended' \| 'declined' \| 'blocked' \| 'suspended'` |
| `follow_up_answered` | `days_since_requested`, `photo_count: 1 \| 2 \| 3`, `has_text: boolean` |
| `follow_up_viewed` | `days_since_answered` |
