---
description: "Tareas de la historia #53 — Publicar un animal con sus fotos y sus datos"
---

# Tasks: Publicar un animal con sus fotos y sus datos

**Input**: `specs/007-publicar-animal/` — spec.md, plan.md (§Diseño), research.md (R1–R20),
data-model.md, contracts/actions.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí. Todo lo
que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola. Antes de escribir JSX o CSS se carga `frontend-design:frontend-design`; antes de la
migración, `supabase:supabase-postgres-best-practices`; después de varios TSX,
`vercel:react-best-practices`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: la dependencia nueva y la configuración.

- [X] T001 Instalar `thumbhash` con `pnpm add thumbhash@latest` (0.1.1, verificada el 2026-09-26; su línea con fecha ya se escribió en `docs/07-stack.md` en la etapa de spec) y comprobar que `package.json` y el lockfile quedan con esa versión
- [X] T002 `next.config.ts`: `experimental.serverActions.bodySizeLimit: '2mb'`, con el comentario del porqué (research R2)

---

## Fase 2: Base compartida

**Propósito**: lo que las tres user stories necesitan. **Punto de control al final.**

### Base de datos

- [X] T003 Crear la migración con `pnpm exec supabase migration new pets`: la tabla `public.pets` de data-model.md, columna por columna con sus `check` tal cual —`name` con `char_length(btrim(name)) between 1 and 120` (techo en puntos de código; los 30 los cuenta el schema); `species in ('dog', 'cat')`; `sex in ('male', 'female')`; `age_value smallint` con `age_unit in ('months', 'years')` y el rango por unidad (`months` 1–11, `years` 1–25); `age_as_of date not null`; `size in ('small', 'medium', 'large')`; `vaccines in ('up_to_date', 'incomplete', 'none')`; los tres `good_with_*` `in ('yes', 'no', 'unknown')` con `default 'unknown'`; `description` nula o `char_length(description) <= 8000` (el mismo techo); `department` con los 19 códigos del `check` de `profiles`; `locality` `char_length(btrim(locality)) between 1 and 60`; `is_urgent default false`; `status default 'available'` con `in ('available')`; `language default 'es'` con `in ('es')`; `published_at`, `updated_at` con el trigger `touch_updated_at`—, `unique (owner_id, attempt_id)`, el índice `(owner_id, published_at desc)`, y los `comment on` con el porqué
- [X] T004 En la misma migración, `public.pet_photos` de data-model.md: `id` sin default (lo manda el cliente), `owner_id` y `pet_id` con `on delete cascade`, `position` 0–4 con `unique (pet_id, position) deferrable initially deferred`, `width`, `height`, `thumbhash` (≤ 64), `staged_at`, `released_at`, los dos `check` (`(pet_id is null) = (position is null)`, `released_at is null or pet_id is null`) y los índices de `owner_id` y el parcial de `pet_id`
- [X] T005 En la misma migración, RLS: las dos tablas con RLS activa, `select` para `authenticated` con `(select auth.uid()) = owner_id`, `revoke all … from anon, authenticated` y `grant select … to authenticated`; el bucket `pet-photos` (`public = false`, `file_size_limit = 1048576`, `allowed_mime_types = {image/webp}`) con **una sola** policy de `select` para `authenticated` sobre `(storage.foldername(name))[1]` propio; ninguna de `insert`, `update` ni `delete` (research R1)
- [X] T006 En la misma migración, las funciones de data-model.md, `security definer`, `set search_path = ''`, `revoke all … from public, anon, authenticated` y `grant execute … to service_role`: `has_level_one(p_user, p_pending_ttl)` (con el comentario que apunta a `phoneStatus` + `isLevelOne`, y el mismo en `phone-status.ts` apuntando acá), `stage_pet_photo` (candado de la cuenta, nivel 1, `on conflict (id) do nothing`, `photo_taken` si la fila es de otra dueña), `publish_pet` (candado, intento primero con `already`, nivel, 1–5 fotos en espera de la dueña sin soltar y más nuevas que `p_staged_ttl`, insertar y enganchar en orden), `save_pet` (candado, `not_found`, nivel, `changed_elsewhere`, `photos_invalid` por TTL, actualizar sin tocar `published_at`, enganchar, reordenar, soltar y devolver las soltadas), `purge_pet_photos(p_staged_ttl)` y `delete_pet_photo_rows(p_ids)`; errores con `errcode = 'P0001'` y la clave como mensaje
- [X] T007 Correr `pnpm exec supabase db reset` y `pnpm db:types` para regenerar `src/lib/supabase/types.ts`

### Reglas y lógica pura

- [X] T008 [P] `src/lib/pets/rules.ts`: los números de la historia, única fuente (5 fotos; 30 y 2000 caracteres; umbrales del contador 25 y 1800; rangos de edad; lados 400/800/1600; `THUMBHASH_SIDE` 100; calidades 0,82/0,72/0,62; 1 MB por archivo y 1,5 MB por foto; 24 horas de espera; 2 minutos de tope; 30 días de borrador; 1 hora de firma) y `PET_DB_RULES` con los intervalos para las funciones, como `DB_RULES` de `lib/verification/rules.ts`
- [X] T009 [P] `src/lib/pets/age.ts` + `age.test.ts` (research R7): `uruguayDay`, `monthsBetween`, `ageOn`, `resolveAgeOnSave` con `unchanged`, con los casos de plan.md §Qué se testea (fin de mes, febrero, cambio de año, 11 meses → 1 año, aniversario entre abrir y guardar, 26 años sin tocar, `asOf` futuro descartado)
- [X] T010 [P] `src/lib/contact/pet-contact.ts` + `pet-contact.test.ts` (research R8): `petContactMatch` → `{ kind, fragment } | null` y `hasStreetNumber`, con cada forma que frena y cada una que pasa de plan.md §Qué se testea. `contactKind` del perfil **no se toca**
- [X] T011 [P] `src/lib/pets/char-count.ts` + test (research R3): contar grafemas con `Intl.Segmenter` (una bandera y una secuencia con ZWJ cuentan uno); y `src/lib/schemas/pet.ts` + `pet.test.ts`: `petSchema` con los largos contados con `char-count`, `validatePet(input, { ageUnchanged })` con un `FieldError` (`{ key, values?: { fragment } }`) por campo, las claves `pets.errors.*`, y los casos de plan.md §Qué se testea (incluido «26 años» con y sin `ageUnchanged`)
- [X] T012 [P] `src/lib/pets/duplicate-name.ts` + test (research R9): `normalizePetName` (minúsculas, tildes fuera salvo la de la ñ, sin espacios al principio ni al final)
- [X] T013 [P] `src/lib/pets/publish-steps.ts` + test (research R6): `publishDecision` con el orden intento → nivel → campos → nombre y la exclusión del propio intento
- [X] T014 [P] `src/lib/images/photo-file.ts` + test (research R3): `photoFileProblem`, `ACCEPTED_PHOTO_TYPES`, `MAX_PHOTO_BYTES`; `rejectionFor` de `src/lib/profile/avatar.ts` pasa a usarlo sin cambiar lo que devuelve. `src/lib/pets/photo-list.ts` + test: `acceptPhotoFile` (el problema en claves `pets.errors.*`: «formato no aceptado» o «muy pesada», FR-007), la lista de `PhotoSlot` (agregar hasta 5 y cuántas quedaron afuera, rechazar una, sacar, mover antes y después, hacer portada, qué ids se mandan y cuáles faltan subir) y `submitReadiness` (research R19)
- [X] T015 [P] `src/lib/pets/photo-sizing.ts` + test (research R3): `targetSize` y `encodingPlan`
- [X] T016 [P] `src/lib/pets/save-failure.ts` + test (research R11): `classifySaveOutcome({ rejected, online, timedOut, result })`
- [X] T017 [P] `src/lib/pets/draft.ts` + test (research R10): leer, validar, `accountId`, 30 días, roto, `shouldTrackStart`
- [X] T018 [P] `src/lib/drafts/account-drafts.ts`: las claves `profile-draft` y `pet-draft` y `clearAccountDrafts()`; `src/hooks/use-profile-draft.ts` importa la clave de ahí, y `sign-out-form.tsx`, `delete-account-dialog.tsx` y `sign-in-other-account-form.tsx` pasan de `clearProfileDraft` a `clearAccountDrafts`

### Datos, medición y textos

- [X] T019 [P] `src/lib/supabase/queries/pets.ts` según contracts/actions.md §Queries (`listMyPets`, `getMyPet` con el uuid validado antes de consultar, `listMyPetNames` con el `attempt_id`, `isAttemptPublished`, `countMyPets`, `publishPetRecord`, `savePetRecord`), con los errores de la base traducidos a claves
- [X] T020 [P] `src/lib/supabase/queries/pet-photos.ts` según contracts/actions.md §Queries: `stagePetPhoto`, `uploadPetPhotoFiles` (servicio, `upsert`), `signPetPhotos` (una llamada a `createSignedUrls`, 1 hora, con el data URL del ThumbHash armado con `thumbHashToDataURL`), `deletePetPhotos`, `deletePetPhotosAsService` (lista el prefijo `{owner}/` y comprueba que quedó vacío), `purgePetPhotos`
- [X] T021 [P] `src/lib/analytics/events.ts` y `track.ts`: `track(event, props?)` con propiedades planas, y los cuatro momentos de research R12 con el comentario de cuándo se dispara cada uno
- [X] T022 [P] `messages/es.json`: el namespace `pets` (`metadata`, `my_pets`, `form`, `fields`, `options` por clave de la base, `photos`, `errors` —con las plantillas que citan `{fragment}`—, `dialogs`, `notices`), y `auth.account_menu.my_pets`

### Componentes compartidos

- [X] T023 [P] `src/components/ui/radio-group.tsx`: la primitiva de plan.md §Componentes sobre radios nativos, con `FieldShell`; entra en `/muestra` con sus estados
- [X] T024 [P] `src/components/ui/icons.tsx`: `UrgentIcon`
- [X] T025 [P] `src/components/zones/zone-fields.tsx`: extraer departamento + `LocalityField` de `ProfileFields`, mudar `locality-field.tsx` a `components/zones/`; `ProfileFields` pasa a usar `ZoneFields` sin cambiar lo que muestra
- [X] T026 [P] Mudar `SavedToast` de `src/components/profile/saved-toast.tsx` a `src/app/[locale]/_components/saved-toast.tsx` y actualizar `phone-notice.tsx`

**Punto de control**: `pnpm lint && pnpm typecheck && pnpm test` en verde; `pnpm mutation` al 100 % sobre T009–T017; los tests del perfil y de la verificación siguen pasando sin cambiar sus aserciones.

---

## Fase 3: US1 — Publicar un animal y verlo en Mis animales (P1) 🎯 MVP

**Meta**: con nivel 1, elegir de 1 a 5 fotos, ordenarlas, completar la ficha con la zona propuesta,
publicar una vez, y verlo primero en «Mis animales». Sin nivel 1, el aviso; sin sesión, entrar.

**Prueba independiente**: spec.md §US1 Independent Test.

### Tests

- [X] T027 [P] [US1] `tests/db/pets.test.ts`, parte de US1: lecturas y escrituras fallidas desde `anon`, otra persona y la dueña sobre `pets`, `pet_photos` y `pet-photos` (incluida la subida a la carpeta propia y la firma de un objeto ajeno); `has_level_one` con el borde de 7 días; `stage_pet_photo` (sin nivel, `photo_taken`, mismo id dos veces); `publish_pet` (tres estados sin nivel, publica, el mismo intento en paralelo deja una y devuelve `already`, 0 y 6 fotos, foto ajena, enganchada o vencida)

### Acciones y datos

- [X] T028 [US1] `src/actions/pets.ts`: `uploadPetPhoto` (purga en `after()`, la firma WebP, la subida con servicio y la fila comprobada después), `publishPet` (el orden de contracts/actions.md con `publishDecision`, `startedAt` acotado para `seconds`, `track('pet_contact_rejected')` si el rechazo lo encuentra el servidor, `after()` para la purga, `uruguayDay` para `age_as_of`, `track('pet_published', …)`, `revalidatePath`), `trackPetMoment` (`ActionResult<null>`)
- [X] T029 [US1] `src/lib/pets/photo-processing.ts`: el pegamento con el canvas (`createImageBitmap` con `from-image`, los tres WebP con `photo-sizing`, el ThumbHash con `rgbaToThumbHash`, el archivo llamado `{tamaño}.webp`)

### Pantallas

- [X] T030 [P] [US1] `src/components/pets/pet-photo.tsx` (`"use client"`, `onLoad` + `complete`), `pet-card.tsx` (un `<a>` con `.lift`, no un `Card`), `zone-label.tsx`, `urgency-tag.tsx`, `my-pets-grid.tsx`, según plan.md §Mis animales
- [X] T031 [US1] `src/app/[locale]/(app)/mis-animales/{page,loading,error}.tsx`: `requireProfile('/mis-animales')`, `listMyPets` + `signPetPhotos`, la tirita, el vacío con `EmptyState`, el aviso «Publicado» con la marca de la URL, `generateMetadata` con `noindex`; el `error.tsx` con sus claves en `ErrorTextsProvider` (contracts §Rutas)
- [X] T032 [US1] `src/app/[locale]/_components/account-menu.tsx`: «Mis animales» junto a «Mi perfil», solo con sesión
- [X] T033 [US1] `src/hooks/use-pet-photos.ts` (preparar con `photo-processing`, la lista con `photo-list`) y `src/components/pets/pet-photos-field.tsx` + `pet-photo-tile.tsx`: la grilla 1:1, la invitación vacía, el casillero para agregar, los tres botones de un toque, los rechazos debajo, «3 de 5 fotos»
- [X] T034 [US1] `src/components/pets/pet-fields.tsx`, `age-field.tsx`, `character-count.tsx`: los cuatro grupos de plan.md §Publicar con `RadioGroup`, `ZoneFields` con la ayuda del hogar de tránsito, el aviso de contacto antes de la descripción, `Checkbox` «Es urgente»
- [X] T035 [US1] `src/hooks/use-pet-save.ts` y `src/components/pets/pet-form.tsx` + `publish-progress.tsx` (modo publicar): `submitReadiness`, subir las que faltan al tocar «Publicar» con el progreso, `publishPet` con el `attemptId` de la pestaña, la tirita ocupada, los errores por campo con su fragmento y el foco al primero (`useFieldFocus`), `trackPetMoment` para el rechazo de contacto del cliente; hasta que lleguen los diálogos de US3 (T049), `duplicate_name`, `session` y `needs_verification` se muestran como su texto de error arriba de la tirita; al terminar, a `/mis-animales?guardado=publicado`
- [X] T036 [US1] `src/app/[locale]/_components/pet-form-texts.ts` y `src/app/[locale]/(app)/mis-animales/publicar/{page,loading,error}.tsx`: `requireVerifiedPhone({ path: '/mis-animales/publicar', reason: 'publish', from: '/mis-animales' })`, la zona del perfil propuesta, `generateMetadata` con `noindex`; `pets.form.load_error` en `error-texts-provider.tsx`

### E2E

- [X] T037 [US1] `tests/e2e/support/exif-fixture.ts` y `tests/e2e/fixtures/foto-con-gps.jpg` (un JPEG chico con GPS, cámara y nombre propio), y `tests/e2e/publicar.spec.ts` parte de US1: Ana publica 3 fotos, hace portada la segunda, ve «Publicado» y la portada primera en la pared; los objetos guardados no tienen EXIF ni el nombre original

**Punto de control**: US1 se recorre sola (quickstart.md, filas US1) y `pnpm lint && pnpm typecheck && pnpm test` en verde.

---

## Fase 4: US2 — Corregir lo publicado (P2)

**Meta**: abrir un animal desde «Mis animales», cambiar datos y fotos, guardar; la edad avanza sola.

**Prueba independiente**: spec.md §US2 Independent Test.

### Tests

- [X] T038 [P] [US2] `tests/db/pets.test.ts`, parte de US2: `save_pet` (ajena → `not_found`, sin nivel → `needs_verification` y el animal igual, foto soltada → `changed_elsewhere`, reordenar + sacar + agregar en una llamada, `published_at` igual); borrar la persona con `deletePetPhotosAsService` deja el prefijo vacío —con un objeto sin fila— y la cascada se lleva publicaciones y fotos, también en espera; la purga

### Acciones y pantallas

- [X] T039 [US2] `src/actions/pets.ts`: `savePet` (contracts/actions.md: `resolveAgeOnSave`, `validatePet` con `ageUnchanged`, `save_pet`, borrar ya las soltadas, `after()` para la purga, `track('pet_edited')` y `track('pet_contact_rejected')` si el rechazo lo encuentra el servidor)
- [X] T040 [US2] `src/actions/profile.ts` `deleteAccount`: los dos barridos de `deletePetPhotosAsService` (antes y después de borrar la persona, research R20), cada uno comprobado
- [X] T041 [US2] `src/components/pets/pet-form.tsx` (modo editar): las fotos publicadas puestas, `ageBase` y `ageShown` ocultos, «Guardar», «Este animal cambió en otra pestaña» con «Volver a abrirlo», `trackPetMoment` para el rechazo de contacto del cliente, al terminar a `/mis-animales?guardado=editado`
- [X] T042 [US2] `src/components/pets/pet-not-found.tsx` y `src/app/[locale]/(app)/mis-animales/[id]/editar/{page,loading,not-found,error}.tsx`: la puerta con `path` y `from`, `getMyPet` + `signPetPhotos`, «Editar a {name}», `generateMetadata` con `noindex`; sus claves de error en `error-texts-provider.tsx`

**Punto de control**: US2 se recorre sola (quickstart.md, filas US2 y el paso de la edad) y los tests en verde.

---

## Fase 5: US3 — Cargar desde el celular sin perder nada ni duplicar (P3)

**Meta**: un guardado que no llega no pierde nada y el reintento no duplica; lo escrito sobrevive a
una recarga; el nombre repetido avisa; volver atrás avisa.

**Prueba independiente**: spec.md §US3 Independent Test.

### Tests

- [ ] T043 [P] [US3] `src/lib/forms/back-guard.ts` + test (research R17)
- [ ] T044 [US3] `tests/e2e/publicar.spec.ts`, los pasos de US3 en el mismo flujo: antes de elegir las fotos, recargar y ver lo escrito de vuelta (SC-006); con la conexión cortada, «Publicar» dice que no hay conexión y todo sigue en pantalla; con conexión, un doble clic en «Publicar» y una sola publicación (SC-004)

### Pantallas

- [ ] T045 [US3] `src/hooks/use-pet-save.ts`: el tope de 2 minutos con `classifySaveOutcome`, el reintento que sube solo lo que falta, y ante `photos_invalid` volver a subir las preparadas con ids nuevos y reintentar una vez (research R1)
- [ ] T046 [US3] `src/hooks/use-pet-draft.ts` y `src/components/pets/draft-restored-note.tsx`: guardar lo escrito con `accountId`, `attemptId` y `startedAt`; recuperarlo solo para la misma cuenta y dentro de los 30 días; «Empezar de cero»; `checkPetAttempt` al recuperar y «Ese animal ya está publicado»; `pet_publish_started` solo con `shouldTrackStart`; borrarlo al publicar
- [ ] T047 [US3] `src/actions/pets.ts`: `checkPetAttempt`
- [ ] T048 [P] [US3] `src/components/pets/duplicate-name-dialog.tsx` y `save-blocked-dialog.tsx` según plan.md §Diálogos
- [ ] T049 [US3] `src/components/pets/pet-form.tsx`: usar los dos diálogos (`confirmDuplicate`, «Entrar» / «Verificar» con la puerta, «Quedarme»)
- [ ] T050 [US3] `src/hooks/use-unsaved-changes.ts`: el guardia del volver con `back-guard` (research R17), y `PetForm` que avisa al salir con fotos elegidas o con cambios sin guardar

### Medición

- [ ] T051 [US3] `tests/e2e/publicar-rendimiento.spec.ts` (plan.md §Medición): solo Chromium, red y CPU emuladas con CDP, la foto de 12 MP generada en la página con degradés y formas (su `full` entre 300 y 500 KB, comprobado); < 5 s por foto y < 30 s para publicar 3, sin margen

**Punto de control**: US3 se recorre sola (quickstart.md, filas US3) y los tests en verde.

---

## Fase 6: Pulido

- [ ] T052 [P] `docs/10-design-system.md`: las filas nuevas y las que cambian de plan.md §Docs que cambian, la **Decisión (2026-09-26)** de publicar en una sola pantalla en §Layout, y «doce primitivas» en §Cómo se aplica
- [ ] T053 [P] `docs/known-limitations.md`: la purga de 24 horas sin Cron (research R13), con detección y condición de reapertura
- [ ] T054 [P] `docs/06-i18n.md` §Glosario: **portada**
- [ ] T055 [P] `docs/07-stack.md`: en §Imágenes, la **Decisión (2026-09-26)** del `<img>` con `srcSet` en vez de `next/image` para las fotos firmadas (research R4) y la ruta `pet-photos/{owner}/{photo}/{tamaño}.webp` en vez de `pets/{pet_id}/…` (R1); sacar `thumbhash` del párrafo «No entraron»
- [ ] T056 Cargar `vercel:react-best-practices` y pasar su lista por los TSX nuevos
- [ ] T057 `pnpm verify` completo en local (Lighthouse se verifica en CI, KL-001); en la tabla de rutas de `pnpm build`, el JS de primera carga de `/mis-animales`, `/mis-animales/publicar` y `/mis-animales/[id]/editar` queda debajo de 150 KB y se anota en el PR, junto al LCP de `/mis-animales` con sesión medido con `tests/e2e/support/web-vitals.ts` (Lighthouse audita solo `/`, plan.md §Qué se testea)
- [ ] T058 Dejar para Ship, en la descripción del PR, la lista del issue `aviso` (usuarios de redes en la regla de contacto, bucket privado, una sola pantalla, `LocalityField` en el dominio, `SavedToast` en `app`, `<img>` en vez de `next/image`, «doce primitivas» que `CLAUDE.md` todavía dice «once») y del issue `decision` (sumar rutas con sesión a Lighthouse)
- [ ] T059 Capturas con `node scripts/walk.mjs --story publicar-animal --user /mis-animales /mis-animales/publicar` a 390 y 1280, y la recorrida de quickstart.md

---

## Dependencias y orden

- Fase 1 → Fase 2 → US1 → US2 → US3 → Pulido. US2 y US3 usan el formulario y las acciones de US1.
- Dentro de la Fase 2: T003–T006 son una sola migración, en orden; T007 después. T008–T026 en
  paralelo entre sí, salvo T019–T020, que necesitan T007.
- Dentro de cada user story: los tests marcados [P] se escriben primero y fallan; después las
  acciones, después las pantallas.

## Paralelo, por ejemplo

```text
Fase 2: T009 age · T010 pet-contact · T011 schema · T013 publish-steps · T014 photo-list · T015 photo-sizing
US1:    T027 tests/db mientras T030 las piezas de la pared
US3:    T043 back-guard mientras T048 los diálogos
```

## Estrategia

MVP = Fases 1–3: publicar y ver lo publicado. Cada fase siguiente se suma sin romper la anterior,
con su punto de control en verde.
