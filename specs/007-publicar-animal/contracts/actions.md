# Contratos: Server Actions y rutas

Todas en `src/actions/pets.ts`, `'use server'`, y devuelven `ActionResult<T, D>` (no lanzan). Los
`error` son claves de `messages/es.json` bajo `pets.errors.*`. Ninguna confía en el cliente: cada
una vuelve a mirar la sesión y, salvo `checkPetAttempt` y `trackPetMoment`, el nivel 1.

## `uploadPetPhoto(form: FormData)`

- **Entra:** `photoId` (uuid), `thumb`, `card`, `full` (`File`, `image/webp`), `width`, `height`,
  `thumbhash`.
- **Hace:** purga en `after()` (R13); sesión → `session`; `checkVerifiedPhone` →
  `needs_verification` con `detail.gatePath`; valida tipo, tamaño (≤ 1 MB cada uno, ≤ 1,5 MB
  juntos), la firma `RIFF….WEBP` de cada archivo, `photoId` y `thumbhash` → `photo_invalid`; `stage_pet_photo`; sube los tres objetos
  **con la clave de servicio** y `upsert` (R1); comprueba que la fila siga y, si no, borra lo que
  subió (data-model §Borrado de la cuenta).
- **Sale:** `{ ok: true, data: { photoId } }` · errores `session`, `needs_verification`,
  `photo_invalid`, `photo_upload_failed`.
- **Idempotente:** el mismo `photoId` otra vez no crea nada nuevo.

## `publishPet(form: FormData)`

- **Entra:** `attemptId`, `startedAt` (cuándo empezó la carga, para la medición: se acota a no ser
  futuro ni de más de 30 días), los campos de `PetFormValues`, `photoIds` (en orden, JSON),
  `confirmDuplicate` (`'true'` | ausente).
- **Orden:** purga en `after()` → sesión (`session`) → **intento ya publicado** (devuelve éxito) →
  nivel 1 (`needs_verification`) → `validatePet` (errores por campo, `FieldError`, en
  `detail.fields`; si alguno es de contacto, `track('pet_contact_rejected')`) → nombre repetido si
  no viene `confirmDuplicate` (`duplicate_name`, con `detail.duplicate: { name, species, sex }`),
  contra los animales de la misma especie **menos el del propio intento** (`listMyPetNames` trae
  el `attempt_id` de cada uno) → `publish_pet` con `age_as_of = uruguayDay(new Date())` y
  `p_staged_ttl` de `rules.ts`. La decisión la toma `publishDecision` (`lib/pets/publish-steps.ts`, research R6),
  que tiene test; la acción solo averigua en ese orden.
- **Sale:** `{ ok: true, data: { petId, already } }`. En éxito nuevo: `track('pet_published',
  { photos, seconds, ordinal })` y `revalidatePath('/mis-animales')`.
- **Errores:** `session`, `needs_verification`, `invalid`, `duplicate_name`, `photos_invalid`,
  `save_failed`.

## `savePet(form: FormData)`

- **Entra:** `petId`, los campos, `photoIds` (en orden), `ageBase` (`value`, `unit`, `asOf` al
  abrir) y `ageShown` (`value`, `unit` que se mostró al abrir).
- **Orden:** purga en `after()` → sesión → la publicación propia (`not_found`) → nivel 1 →
  `resolveAgeOnSave({ base, shown, submitted, today })` (R7) → `validatePet(input, { ageUnchanged })`
  (si alguno es de contacto, `track('pet_contact_rejected')`) → `save_pet` → borra
  ya los objetos y filas de las soltadas (si falla, queda para la purga).
- **Sale:** `{ ok: true, data: { petId } }`, `track('pet_edited')`, `revalidatePath`.
- **Errores:** `session`, `needs_verification`, `not_found`, `invalid`, `changed_elsewhere`,
  `photos_invalid`, `save_failed`.

## `checkPetAttempt(attemptId: string)`

- Solo sesión. `{ ok: true, data: { published: boolean } }`. Lo llama el formulario al recuperar lo
  escrito (spec §Edge Cases «Una respuesta perdida y después una recarga»).

## `trackPetMoment(moment: 'pet_publish_started' | 'pet_contact_rejected', props)`

- Acepta solo esos dos nombres y las propiedades de su lista (`field`, `kind` para el rechazo); lo
  demás se descarta. Devuelve `ActionResult<null>`, como todas.

## Rutas (`src/app/[locale]/(app)/`)

| Ruta | Página | Compuerta | Metadata |
|---|---|---|---|
| `/mis-animales` | `mis-animales/page.tsx` + `loading.tsx` + `error.tsx` | `requireProfile('/mis-animales')` (sin nivel 1, FR-004) | `pets.metadata.my_pets`, `robots: { index: false }` |
| `/mis-animales/publicar` | `mis-animales/publicar/page.tsx` + `loading.tsx` + `error.tsx` | `requireVerifiedPhone({ path: '/mis-animales/publicar', reason: 'publish', from: '/mis-animales' })` | `pets.metadata.publish`, noindex |
| `/mis-animales/[id]/editar` | `mis-animales/[id]/editar/page.tsx` + `loading.tsx` + `not-found.tsx` + `error.tsx` | `requireVerifiedPhone({ path: '/mis-animales/<id>/editar', reason: 'publish', from: '/mis-animales' })`; `getMyPet(id)` nulo → `notFound()` | `pets.metadata.edit`, noindex |

Los tres `error.tsx` son cliente y reciben sus textos por `ErrorTextsProvider` (docs/10): se suman
las claves `pets.my_pets.load_error`, `pets.form.load_error`, `pets.my_pets.publish` y las del
aviso `pets.notices.published` / `pets.notices.edited`, y la fila de `ErrorTextsProvider` en
docs/10 deja de decir «seis claves».

`getMyPet` valida que `id` sea un uuid antes de consultar: un id mal formado es «no existe», no un
error de la base. El `from` de la puerta es `/mis-animales`.

## Queries (`src/lib/supabase/queries/`)

- `pets.ts`: `listMyPets()`, `getMyPet(id)`, `listMyPetNames(species)`, `isAttemptPublished(id)`,
  `countMyPets()`, `publishPetRecord(...)`, `savePetRecord(...)` (las dos últimas con servicio y la
  dueña como parámetro).
- `pet-photos.ts`: `stagePetPhoto(...)`, `uploadPetPhotoFiles(owner, id, files)` (servicio),
  `signPetPhotos(photos)` (una llamada a `createSignedUrls` con la sesión, 1 hora),
  `deletePetPhotos(ids)` (servicio), `deletePetPhotosAsService(owner)` (lista el prefijo),
  `purgePetPhotos()`.
