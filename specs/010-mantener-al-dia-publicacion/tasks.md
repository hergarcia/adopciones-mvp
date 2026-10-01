---
description: "Tareas de la historia #59 — Mantener al día cada publicación: en proceso, pausa, adopción, vencimiento y revisión"
---

# Tasks: Mantener al día cada publicación: en proceso, pausa, adopción, vencimiento y revisión

**Input**: `specs/010-mantener-al-dia-publicacion/` — spec.md, plan.md (§Diseño, §Qué se testea),
research.md (R1–R11), data-model.md, contracts/routes.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí. Todo lo
que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola. Antes de escribir JSX o CSS se carga `frontend-design:frontend-design` y se abre
`docs/10-design-system.md`; antes de la migración y de sus tests,
`supabase:supabase-postgres-best-practices`; después de varios TSX, `vercel:react-best-practices`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Preparación, base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: las constantes y los tipos que todo lo demás lee.

- [X] T001 [P] Sumar a `src/lib/pets/rules.ts` `PET_LIFETIME_DAYS = 30`, `PET_REMINDER_DAYS = 7`, `RENEWAL_LINK_DAYS = 30`, `TAKEDOWN_NOTE_MAX = 300` y `PET_REVIEW_PAGE = 20` (data-model.md §Reglas)
- [X] T002 [P] Sumar a `src/lib/pets/types.ts` `PetState` (`'available' | 'in_process' | 'paused' | 'adopted' | 'expired' | 'taken_down'`), `PetStatus`, `PetStatusAction` (`mark_in_process` `mark_available` `pause` `resume` `mark_adopted` `renew` `republish`), `TakedownReason` (`photos_not_the_animal` `sale_or_money` `not_dog_or_cat` `contact_or_address` `other`) y los campos nuevos de `PetSummary`, `PublicPet`, `PublicPetResult` y `ListedCardView` (data-model.md §Tipos)

---

## Fase 2: Base compartida

**Propósito**: la migración y lo que todas las user stories leen. Bloquea las fases 3 a 6.

- [X] T003 Escribir `supabase/migrations/<ts>_pet_lifecycle.sql` (timestamp de hoy, después de `20260930230244`) con lo de data-model.md: el check de `pets.status` en `('available','in_process','paused','adopted')`; `status_changed_at timestamptz not null default now()`; `expires_at` con el constraint `pets_expiry_matches_status` («no nulo si y solo si `status in ('available','in_process')`») y el backfill `now() + 30 días`; `reminder_sent_at`, `expiry_counted_at`, `taken_down_at`; `takedown_reason` («no nulo si y solo si `taken_down_at` no es nulo», con los cinco valores) y `takedown_note` («1–300 caracteres (`btrim`), no nulo si y solo si `takedown_reason = 'other'`»); los tres índices; `private.pet_lifetime()`, `private.pet_reminder_lead()`, `private.pet_state(...)`, `private.pet_is_shown(...)` y `private.publisher_level(owner)` (la escalera que hoy está dentro de `pet_by_code`, que pasa a llamarla); `publish_pet` con `expires_at = now() + pet_lifetime()`. Con sus `revoke`/`grant` explícitos, como las migraciones de #53 y #57
- [X] T004 En la misma migración, reemplazar `listed_pets` (estado derivado en `available`/`in_process`, devuelve `status`), `pet_by_code` (`visibility` en `listed` `adopted` `paused` `expired` `hidden`; dada de baja sin fila para quien no es dueña; la dueña recibe `state`, `takedown_reason`, `takedown_note`), `pet_share_card` (también adoptada, con `status`), `private.pet_photo_object_listed` y `private.avatar_object_listed` (con `pet_is_shown`), y recrear `pets_listing_idx` con `where status in ('available','in_process') and taken_down_at is null` (research R9)
- [X] T005 `pnpm exec supabase db reset` y `pnpm db:types` → `src/lib/supabase/types.ts` (nunca a mano)
- [X] T006 [P] Test de `src/lib/pets/lifecycle.ts` en `src/lib/pets/lifecycle.test.ts`: `lifecycleOf` (cada `status` con `expires_at` en el pasado, en el instante exacto y en el futuro, y con `taken_down_at`), `actionsFor` (las acciones exactas y en orden de la tabla de data-model.md §Transiciones), `needsLevelOne` (solo `resume`, `renew`, `republish`) y `expiryView` (el día de Uruguay, `soon` con 7 días justos y no con 7 días y un minuto, `expired`)
- [X] T007 Implementar `src/lib/pets/lifecycle.ts` hasta que T006 pase
- [X] T008 Cambiar `src/lib/supabase/queries/pets.ts` (`listMyPets`, `getMyPet`: `state` con `lifecycleOf`, `expiresAt`, `takedown`) y `src/lib/supabase/queries/listed-pets.ts` (`status` en las cards, las visibilidades nuevas de `getPublicPet`, `status` en `getShareCard`); `src/lib/pets/listed-card-view.ts` pasa `status`
- [X] T009 [P] `Stamp` gana `tone="ink"` (`text-ink`) en `src/components/ui/stamp.tsx`; crear `src/components/pets/pet-status-stamp.tsx` (el sello por estado: `in_process` `ink`, `adopted` `primary`, `paused`/`expired`/`taken_down` `muted`; nada en `available`) y dibujarlo sobre la foto en `src/components/pets/pet-card.tsx`
- [X] T010 [P] Textos de `pets.status` en `messages/es.json` (estados con concordancia por sexo, acciones, toasts, errores, vencimiento, borrar, motivos de baja) — plan.md §Textos

**Checkpoint**: la base sabe los estados y todo lo público los respeta; `pnpm test` verde.

---

## Fase 3: User Story 1 — Marcar un animal en proceso, pausarlo, marcarlo adoptado o borrarlo (P1) 🎯 MVP

**Objetivo**: el publicador cambia el estado desde Mis animales y el listado, la ficha y la vista
previa lo reflejan.

**Prueba independiente**: spec.md §US1, «Independent Test».

### Tests de US1

- [X] T011 [P] [US1] `tests/db/lifecycle-support.ts` (personas con y sin nivel 1, publicar, mover `expires_at` con servicio) y `tests/db/pet-lifecycle.test.ts`: la tabla de transiciones entera contra `actionsFor` (paridad estado × acción); nivel 1 solo en reanudar, renovar y volver a publicar; otra persona → `not_found`; dada de baja → `taken_down` salvo borrar; volver a publicar pone `published_at`; `delete_pet` borra la fila, sus fotos, la revisión y los enlaces y el código no se reusa; paridad de `pet_lifetime`/`pet_reminder_lead` con `rules.ts` y de `pet_state` con `lifecycleOf`
- [X] T012 [P] [US1] `tests/db/pet-visibility.test.ts` (lo que **no** debe verse): `listed_pets` sin pausadas, vencidas, adoptadas ni dadas de baja y con `status` en proceso; `pet_by_code` como anónimo y como otra persona en cada estado no devuelve dato alguno (dada de baja = sin fila), la dueña sí, con el motivo; precedencia de Edge Cases (pausada con publicador sin nivel 1 → `paused`); `pet_share_card` solo a la vista y adoptada; firmar una foto o el avatar de una pausada, vencida o dada de baja falla con y sin sesión, y de una adoptada a la vista no
- [X] T013 [P] [US1] Test de `src/lib/pets/pet-page-state.ts` en `src/lib/pets/pet-page-state.test.ts`: cada `visibility` × dueña/no dueña × sesión da la pantalla de la precedencia (contracts §Estados de la ficha)
- [X] T014 [P] [US1] Test de `src/lib/schemas/pet-status.ts` en `src/lib/schemas/pet-status.test.ts` (acción desconocida, uuid inválido, lo válido)
- [X] T015 [P] [US1] Test de `src/lib/analytics/pet-events.ts` en `src/lib/analytics/pet-events.test.ts`: `pet_status_changed`, `pet_renewed`, `pet_republished` y `pet_deleted` con `from`, `to`, `via` y días desde publicada (mismo día = 0)

### Implementación de US1

- [X] T016 [US1] En la migración: `change_pet_status` y `delete_pet` + `pet_photo_ids` (research R2, data-model.md §Transiciones), con candado de cuenta y `for update` sobre la fila; `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T017 [P] [US1] `src/lib/schemas/pet-status.ts` hasta que T014 pase; `src/lib/pets/pet-page-state.ts` hasta que T013 pase; `src/lib/analytics/pet-events.ts` y los eventos de research R11 en `src/lib/analytics/events.ts` hasta que T015 pase
- [X] T018 [US1] `src/lib/supabase/queries/pet-status.ts` (llama a `change_pet_status`, `pet_photo_ids`, `delete_pet` con servicio) y `src/actions/pet-status.ts` (`changePetStatus`, `deletePet` según contracts §Server Actions: `ActionResult<PetStatusView, PetStatusView>`, borra los objetos de Storage antes de la fila, revalida `/mis-animales`, `/animales` y la ficha, mide)
- [X] T019 [P] [US1] `src/components/pets/delete-pet-dialog.tsx` (sobre `DestructiveConfirmDialog`), `src/components/pets/pet-status-actions.tsx` (hoja cliente: botones de `actionsFor`, ocupado, `SaveFailedStrip`, `needs_verification` → `SaveBlockedDialog` nivel, `changed` → `Toast` y refresh) y `src/components/pets/pet-status-sheet.tsx` (plan.md §Diseño, Mis animales)
- [X] T020 [US1] `src/components/pets/my-pet-actions.tsx` y `src/components/pets/my-pets-grid.tsx`: «Más acciones» con la hoja, `TakedownNote` + borrar para la dada de baja (`src/components/pets/takedown-note.tsx`); `src/app/[locale]/(app)/mis-animales/page.tsx` y `loading.tsx`
- [X] T021 [US1] `src/components/pets/my-pet-panel.tsx` y la página `src/app/[locale]/(app)/mis-animales/[id]/page.tsx` + `loading.tsx` (`requireProfile` con `next`, `getMyPet`, `PetNotFound` si no es suyo; `noindex`); `src/lib/pets/paths.ts` suma `myPetPath(id)`; `src/app/[locale]/(app)/mis-animales/[id]/editar/page.tsx` redirige una dada de baja al panel
- [X] T022 [US1] Ficha: `src/app/[locale]/(public)/animales/[code]/page.tsx` con los estados nuevos de `petPageState`; `PetHeadline` con el sello; adoptada con «Ver los animales en adopción»; `PetUnavailable` con los textos de pausada y vencida; `HiddenFromPublicNotice` de la dueña por motivo; `generateMetadata` de la adoptada («{nombre} fue adoptado/a») y de las ocultas (la de #57)
- [X] T023 [US1] Vista previa de la adoptada en `src/app/[locale]/(public)/animales/[code]/imagen/route.tsx` y `src/components/pets/pet-share-image.tsx` (el sello «Adoptado/a» en lugar de la zona)
- [X] T024 [US1] Textos de `pets.page` (pausada, vencida, avisos de la dueña, «Ver los animales en adopción») y `pets.share.adopted_title` en `messages/es.json`

**Checkpoint**: US1 se recorre entera (quickstart pasos 2, 3 y 7).

---

## Fase 4: User Story 2 — Que cada publicación venza sola a los 30 días y se renueve con un toque (P2)

**Objetivo**: vence sola, se ve en Mis animales y se renueva o vuelve a publicar.

**Prueba independiente**: spec.md §US2, «Independent Test».

### Tests de US2

- [X] T025 [P] [US2] Sumar a `tests/db/pet-lifecycle.test.ts`: renovar dos veces = 30 días desde la última; renovar no cambia `published_at` ni el estado; editar (`save_pet`) no toca `expires_at`; una vencida sale de `listed_pets` en el instante en que `expires_at <= now()` y su enlace es `expired`; reanudar y volver a publicar ponen `reminder_sent_at` y `expiry_counted_at` en `null`

### Implementación de US2

- [X] T026 [P] [US2] `src/components/pets/pet-expiry-line.tsx` («Vence el {día}», «Vence pronto: {día}» en negrita y `--color-warning`, «Venció el {día}», nada en pausada/adoptada/dada de baja) y `src/components/pets/renew-button.tsx` (`secondary`, con la misma acción y sus errores que `PetStatusActions`)
- [X] T027 [US2] `MyPetActions` muestra `PetExpiryLine` y, si vence pronto, `RenewButton` primero; `MyPetPanel` igual
- [X] T028 [US2] `save_pet` en la migración: rechaza una dada de baja con `taken_down` (y `src/lib/supabase/queries/pet-errors.ts` la suma a los errores conocidos, con su texto en `pets.errors`)

**Checkpoint**: US2 se recorre entera (quickstart paso 1).

---

## Fase 5: User Story 3 — El correo «¿sigue disponible?» renueva a un toque sin ingresar (P3)

**Objetivo**: un recordatorio por vencimiento y su enlace que renueva solo ese animal.

**Prueba independiente**: spec.md §US3, «Independent Test».

### Tests de US3

- [X] T029 [P] [US3] `tests/db/pet-reminders.test.ts`: `claim_pet_reminders` una sola vez por vencimiento, ninguna pausada/adoptada/vencida/dada de baja, y de nuevo después de renovar y llegar a 7 días; `claim_pet_expiries` una vez por vencimiento; `renew_by_link` renueva, vuelve a publicar una vencida, no cambia pausada/adoptada/dada de baja, `needs_verification` sin nivel 1, `invalid` con un hash desconocido, vencido (más de 30 días) o de un animal borrado, y nunca toca otro animal; `pet_renewal_links` ilegible para `anon` y `authenticated`
- [X] T030 [P] [US3] Test de `src/lib/pets/renewal-token.ts` en `src/lib/pets/renewal-token.test.ts` (43 caracteres base64url, dos tokens distintos, hash = SHA-256 hex, `isRenewalToken` rechaza lo que no tiene la forma)
- [X] T031 [P] [US3] Test de `src/lib/pets/renewal-result.ts` en `src/lib/pets/renewal-result.test.ts` (cada `outcome` → título, cuerpo y acción; sin nombre si el enlace no sirve; `error` con reintentar)

### Implementación de US3

- [X] T032 [US3] En la migración: `pet_renewal_links` («`token_hash` SHA-256 hex de 64 caracteres», `expires_at = created_at + 30 días`, RLS sin policies, `revoke all`), `claim_pet_reminders`, `claim_pet_expiries`, `create_pet_renewal_link`, `renew_by_link`, `renewal_link_view`, `pet_lifecycle_tick` (Vault `app_url` + `cron_secret`, `net.http_post` a `/api/cron/publicaciones`) y los dos `cron.schedule` (`pet-lifecycle` cada 5 minutos, `pet-renewal-links-purge` diario); `db reset` y `db:types`
- [X] T033 [P] [US3] `src/lib/pets/renewal-token.ts` y `src/lib/pets/renewal-result.ts` hasta que T030 y T031 pasen
- [X] T034 [US3] `src/lib/supabase/queries/pet-renewal.ts` (servicio: reclamar recordatorios y vencidas, crear enlace, renovar, leer la vista y la portada); `src/lib/email/notice-email-template.ts` y `send-email.ts` con la imagen y el segundo enlace opcionales (research R7); `src/lib/email/send-pet-reminder.ts`
- [X] T035 [US3] `src/app/api/cron/publicaciones/route.ts` (secreto como `/api/cron/identidad`; hasta 100 recordatorios y 500 vencidas por vuelta; `pet_reminder_sent` y `pet_expired` con `visit: false`)
- [X] T036 [US3] `src/app/[locale]/(public)/sigue-disponible/[token]/route.ts` (GET: `isRenewalToken`, `isLinkPreview` no renueva, renueva, 303 a `listo?r=`; falla → `r=error`; mide `pet_renewed`/`pet_republished` con `via: 'email'`), `.../[token]/foto/route.ts` (JPEG con `sharp`, 404 sin cuerpo si no sirve) y `.../[token]/listo/page.tsx` con `src/components/pets/renewal-result.tsx` (`noindex`, `referrer: no-referrer`)
- [X] T037 [US3] Textos de `pets.renewal` y `emails.pet_reminder` en `messages/es.json`

**Checkpoint**: US3 se recorre entera (quickstart paso 4).

---

## Fase 6: User Story 4 — Quien administra revisa cada publicación nueva y baja la que no corresponde (P4)

**Objetivo**: la cola, revisar, dar de baja con motivo, el correo y el acceso en Mi perfil.

**Prueba independiente**: spec.md §US4, «Independent Test».

### Tests de US4

- [X] T038 [P] [US4] `tests/db/pet-reviews.test.ts`: publicar crea la revisión `new`; editar una revisada la vuelve `edited`; editar una pendiente no la duplica; `pet_reviews` ilegible para anónimo y para quien no administra; `pet_review_queue` vacía para quien no administra y nunca con zona ni contacto; propia → `own`; dos que administran → la segunda `closed`; `pending_since` viejo → `closed`; quien deja de administrar → `not_admin`; una baja saca del listado y del enlace y borra los enlaces de renovación; las fotos de una pendiente se firman para quien administra y no después de revisada si no está a la vista; borrar la publicación borra la revisión; `count_pet_reviews` no cuenta las propias
- [X] T039 [P] [US4] Test de `src/lib/schemas/pet-review.ts` en `src/lib/schemas/pet-review.test.ts` («otro» sin texto, con 301 caracteres, con solo espacios; un texto con otro motivo se descarta; lo válido)
- [X] T040 [P] [US4] Test de `src/lib/pets/waiting-for.ts` en `src/lib/pets/waiting-for.test.ts` (59 min, 1 h, 23 h, 24 h, días)

### Implementación de US4

- [X] T041 [US4] En la migración: `pet_reviews` (data-model.md: `pending_kind` en `('new','edited')`, «nulo si y solo si», `resolved_by on delete set null`, `outcome` en `('reviewed','taken_down')`), `pets_review_on_insert`, la policy `pet_reviews_select_admin`, `save_pet` que la vuelve `edited`, `pet_review_queue`, `count_pet_reviews`, `resolve_pet_review` y la policy de Storage `pet_photos_objects_select_review` (con el avatar del publicador); `db reset` y `db:types`
- [X] T042 [P] [US4] `src/lib/schemas/pet-review.ts` y `src/lib/pets/waiting-for.ts` hasta que T039 y T040 pasen
- [X] T043 [US4] `src/lib/supabase/queries/pet-reviews.ts` (cola con fotos firmadas, cuenta, resolver) y `src/actions/pet-review.ts` (`resolvePetReview` según contracts; la baja manda `src/lib/email/send-pet-takedown.ts` con `after()`; mide `pet_reviewed`/`pet_taken_down` con `visit: false`)
- [X] T044 [P] [US4] `src/components/pets/pet-review-queue.tsx`, `pet-review-item.tsx` (con hueco `owner`), `pet-review-decision.tsx` (hoja cliente) y `takedown-sheet.tsx` (`RadioGroup`, `Textarea` + `CharacterCount`, «Quien publicó va a leer este motivo.»)
- [X] T045 [US4] `src/app/[locale]/(app)/revision/publicaciones/page.tsx`, `loading.tsx`, `error.tsx` (`notFound()` sin administrar; `OwnerCard` en el hueco; `noindex`)
- [X] T046 [US4] Mi perfil: `src/app/[locale]/(app)/mi-perfil/_components/identity-section.tsx` suma el segundo `ReviewQueueLink` con `count_pet_reviews` («Revisar publicaciones (N)» / «nada esperando»; sin número si falla)
- [X] T047 [US4] Textos de `pet_review`, `review.queue.pets_link` y `emails.pet_takedown` en `messages/es.json`

**Checkpoint**: US4 se recorre entera (quickstart pasos 5 y 6).

---

## Fase 7: Pulido y transversal

- [ ] T048 `tests/e2e/ciclo-de-vida.spec.ts`: Ana marca adoptado → fuera del listado, ficha sin sesión con «Adoptado»; vuelve a publicar → vuelve; vencimiento movido a 6 días, la ruta de la tarea llamada con el secreto, el correo en `.artifacts/mail/`, «Sigue disponible» sin sesión renueva y muestra la fecha (plan.md §Qué se testea)
- [ ] T049 [P] Docs: `docs/known-limitations.md` (cerrar KL-53-3; KL-59-1), `docs/10-design-system.md` (filas de plan.md §Docs), `docs/06-i18n.md` §Glosario, `docs/07-stack.md` (decisiones R1 y R5)
- [ ] T050 Cargar `vercel:react-best-practices` y revisar los TSX nuevos; `pnpm mutation` al 100 % sobre lo que tiene test; `pnpm verify`
- [ ] T051 Capturas: `node scripts/walk.mjs --story mantener-al-dia /mis-animales /revision/publicaciones` y una ficha adoptada, a 390 y 1280 px, sobre el HEAD que se entrega

---

## Dependencias y orden

- Fase 1 → Fase 2 → Fases 3–6 → Fase 7.
- US1 (Fase 3) es la base de las demás en pantalla (`PetStatusActions`, el panel); US2 depende de
  US1 (la línea de vencimiento va en las mismas acciones); US3 depende de US2 (el vencimiento) y de
  US1 (`change_pet_status` y la vuelta a publicar); US4 solo depende de la Fase 2 y se puede
  construir en paralelo a US2/US3.
- Dentro de cada fase: tests primero, después la base, las queries y acciones, los componentes y
  las páginas.

## Ejemplos de paralelo

- Fase 2: T006, T009 y T010 juntos.
- US1: T011–T015 juntos; después T017 y T019 juntos.
- US3: T029–T031 juntos.
- US4: T038–T040 juntos; T044 en paralelo a T043.

## Estrategia

MVP: Fases 1–3 (los estados). Después US2 y US3 (lo que le ahorra trabajo al rescatista) y US4 (la
confianza), cada una verificable sola con su «Independent Test». `pnpm lint && pnpm typecheck &&
pnpm test` antes de cada commit; `pnpm verify` al final.
