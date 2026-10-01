# Contratos: rutas, acciones, tarea y correos

## Rutas

| Ruta | Tipo | Quién | Qué |
|---|---|---|---|
| `/mis-animales` | página (cambia) | dueña con perfil | Sellos, vencimiento, «Renovar» directo si vence pronto, «Más acciones» → `PetStatusSheet`. `noindex`. |
| `/mis-animales/{id}` | página (nueva) | dueña con perfil (`requireProfile` con `next`) | Un animal con sus acciones a la vista. No suyo o inexistente → `PetNotFound`. `noindex`. |
| `/mis-animales/{id}/editar` | página (cambia) | dueña | Una dada de baja redirige a `/mis-animales/{id}`. |
| `/animales` | página (cambia) | cualquiera | Disponibles y en proceso, con sello. |
| `/animales/{code}` | página (cambia) | cualquiera | `petPageState` con los estados nuevos (abajo). |
| `/animales/{code}/imagen` | Route Handler (cambia) | cualquiera | También la adoptada: portada, nombre y «Adoptado/a» en lugar de la zona. |
| `/sigue-disponible/{token}` | Route Handler GET (nuevo) | cualquiera con el enlace | Renueva (R5) y redirige 303 a `…/listo?r={outcome}`. Lector de vista previa → redirige sin renovar, con `r=preview`. Falla de la base → `r=error`. `HEAD` responde 204 sin renovar (los lectores de correo que prueban enlaces). |
| `/sigue-disponible/{token}/listo` | página (nueva) | cualquiera con el enlace | Lee `renewal_link_view` y muestra el resultado (`RenewalResult`). Sin sesión. `noindex`, `referrer: no-referrer`. |
| `/sigue-disponible/{token}/foto` | Route Handler GET (nuevo) | cualquiera con el enlace | La portada `card` en JPEG (`sharp`), `Cache-Control: private, max-age=86400`. Enlace que no sirve → 404 sin cuerpo. |
| `/revision/publicaciones` | página (nueva) | quien administra | La cola (R8). Sin administrar → `notFound()`. `noindex`. |
| `/api/cron/publicaciones` | Route Handler POST (nuevo) | la base, con `x-cron-secret` | Recordatorios y medición de vencidas (R4). Sin secreto → 401 sin cuerpo. |

### Estados de la ficha (`petPageState`)

`missing` (no existe, borrada, o dada de baja para quien no es dueña) · `paused` · `expired` ·
`unavailable` (publicador sin nivel 1, el de #57) · `listed` (con `status` `available`,
`in_process` o `adopted`) · `own_listed` · `own_hidden` (con el motivo: `no_level`, `paused`,
`expired`, `taken_down`). Precedencia: la de Edge Cases de la spec.

## Server Actions

`src/actions/pet-status.ts`:

- `changePetStatus(input: unknown): Promise<ActionResult<PetStatusView, PetStatusView>>`, con
  `PetStatusView = { state: PetState; expiresAt: string | null }` — `petStatusChangeSchema`
  (`petId` uuid, `action`). Errores (claves i18n):
  `pets.status.errors.needs_verification` (la pantalla abre el aviso de verificación pendiente),
  `pets.status.errors.changed` (con el estado actual en `detail`), `pets.status.errors.taken_down`, `pets.status.errors.not_found`,
  `pets.status.errors.failed`. `already` es `ok`. Revalida `/mis-animales`, `/animales` y la ficha.
- `deletePet(input: unknown): Promise<ActionResult<null>>` — borra los objetos de Storage de sus
  fotos (servicio) y después `delete_pet`. Si Storage falla, no borra la fila y devuelve
  `pets.status.errors.failed` (reintentar). Mide `pet_deleted`.

`src/actions/pet-review.ts`:

- `resolvePetReview(input: unknown): Promise<ActionResult<null>>` — `petReviewResolutionSchema`
  (`petId`, `knownSince` ISO, `outcome: 'reviewed'` o `{ outcome: 'taken_down', reason, note? }`).
  Errores: `pet_review.errors.closed`, `.gone`, `.own`, `.not_admin`, `.failed`. Una baja manda el
  correo con `after()`: si falla, la baja queda (FR-027).

Cortes de conexión: los componentes cliente distinguen `offline` / `no_response` con el mismo
`saveFailure` de #35/#53 y muestran `SaveFailedStrip` o el error del `Sheet` con «Reintentar».

## Tarea programada

`pg_cron`: `pet-lifecycle` cada 5 minutos → `select public.pet_lifecycle_tick()`;
`pet-renewal-links-purge` una vez por día. La ruta `/api/cron/publicaciones` procesa como mucho 100
recordatorios y 500 vencidas por vuelta; lo que sobra queda para la siguiente.

## Correos

| Correo | Asunto | Cuerpo | Botón | Segundo enlace | Imagen |
|---|---|---|---|---|---|
| Recordatorio | «¿{nombre} sigue disponible?» | «Vence el {día}. Si no hacés nada, ese día sale de Animales en adopción.» | «Sigue disponible» → `/sigue-disponible/{token}` | «Ya no está disponible» → `/mis-animales/{id}` | `/sigue-disponible/{token}/foto` |
| Baja | «Dimos de baja a {nombre}» | El motivo (o el texto de «otro»), que ya no se ve, que se puede borrar desde Mis animales | «Ir a Mis animales» → `/mis-animales/{id}` | — | — |

Los dos, con la ayuda en el pie (`SUPPORT_EMAIL`). Sin datos de la persona en las direcciones.
Sin `RESEND_API_KEY`, a `.artifacts/mail/` como todos.
