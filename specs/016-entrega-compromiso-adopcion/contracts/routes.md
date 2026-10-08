# Contratos — rutas, acciones, correos y eventos

## Rutas (todas bajo `[locale]`, `es` sin prefijo)

| Ruta | Zona | Indexa | Qué es |
|---|---|---|---|
| `/mis-animales/{id}/adoptado` | `(app)` | `noindex` | Nueva (R8). «¿A quién se lo diste?» (`handover_pet`, `handover_candidates`) y el compromiso. Animal ajeno o inexistente → `notFound()`. Animal en un estado que no se marca (adoptado, dado de baja) → `redirect` a `/mis-animales/{id}`. `?volver=` acepta solo `/mis-animales` o `/mis-animales/{id}`. `loading.tsx` (esqueleto de la lista) y `error.tsx` (`ErrorScreen` con «Reintentar»). |
| `/mis-animales` (cambia) | `(app)` | `noindex` | Cada adoptado suma `HandoverLine` (`my_pet_adoptions`). «Marcar adoptado» es un enlace a la ruta nueva. «Volver a publicar» de un adoptado a una persona pide `EndAdoptionDialog`. |
| `/mis-animales/{id}` (cambia) | `(app)` | `noindex` | Igual que la anterior, en la pantalla del animal. |
| `/mis-solicitudes/{id}` (cambia) | `(app)` | `noindex` | Con `close_reason = handed_over`: `AdoptionPanel` (`adoption_of`) y `ContactReveal`. |
| `/mis-solicitudes` (cambia) | `(app)` | `noindex` | `MyApplicationCard` con los sellos «Adoptaste» / «Adopción terminada» y la línea «Compromiso pendiente». |
| `/solicitudes/{id}` (cambia) | `(app)` | `noindex` | Con `publisher_close = handed_over`: `HandoverSummary` (`adoption_of`) y `ContactReveal`. |

Las rutas que ya existían mantienen `requireProfile` (sin sesión → ingresar con `next`, que vuelve:
el enlace del correo), sus `metadata` con `noindex`, sus `loading` y `error`. La nueva igual, con
textos de `metadata.handover.*`.

## Server Actions (`src/actions/adoptions.ts`) → `ActionResult<T>`

| Acción | Entrada | Salida |
|---|---|---|
| `markPetAdopted(input)` | `{ petId, applicationId: uuid \| null, attemptId }` (`handoverSchema`) | `ok: { notice, returnTo }` · `adoptions.handover.errors.{gone,you_blocked,revoked,changed,not_found,session,failed}`; `gone`/`you_blocked`/`revoked` llevan en `detail` el nombre para «Ana ya no sigue con esta solicitud» y la pantalla vuelve a cargar las aceptadas. `already` cuenta como `ok`. |
| `acceptCommitment(input)` | `{ applicationId }` (`commitmentActionSchema`) | `ok: null` · `adoptions.commitment.errors.{closed,not_found,session,failed}`; `already` → `ok`. `suspended` no llega: `getSessionUser()` ya lleva a la pantalla de suspendida (#13). |
| `declineAdoption(input)` | `{ applicationId }` | igual. |

En `src/actions/pet-status.ts`: `changePetStatus` con `republish` desde `adopted` registra
`adoption_ended` cuando terminó una adopción a una persona.

Cada acción: `getSessionUser()`, la función de la base (`lib/supabase/queries/adoptions.ts`), los
eventos (R10), `drainApplicationNotices()` y `revalidatePath` de las pantallas de las dos puntas
(`/mis-animales`, `/mis-animales/{id}`, `/solicitudes/{id}`, `/mis-solicitudes`,
`/mis-solicitudes/{id}`, la ficha y el listado).

## Correos (bandeja de salida de #65)

| `kind` | A quién | Asunto (es) | Botón → |
|---|---|---|---|
| `adoption_marked` | quien adoptó | «Adoptaste a {name}: aceptá el compromiso» | `/mis-solicitudes/{id}` |
| `commitment_accepted` | cada una de las dos | «El compromiso por {name}» | quien adoptó: `/mis-solicitudes/{id}`; quien lo dio: `/solicitudes/{id}` |
| `adoption_declined` | quien lo dio | «{person} dijo que no adoptó a {name}» | `/mis-animales` |

`commitment_accepted` lleva la foto de portada (extra `image`), el texto del compromiso
(`commitmentClauses` + `adoptions.commitment.*`, extra `lines`), los nombres de hoy de las dos y
«{publisher} lo aceptó el {date}» / «{adopter} lo aceptó el {date}». Ningún correo lleva teléfono,
correo ni respuestas.

## Eventos (`src/lib/analytics/events.ts`)

| Nombre | Props |
|---|---|
| `pet_handed_over` | `to: 'site' \| 'outside'`, `days_since_published`, `days_since_accepted: number \| null`, `accepted_count` |
| `commitment_accepted` | `hours_since_marked` |
| `adoption_declined` | `hours_since_marked` |
| `adoption_ended` | `days_since_marked` |
