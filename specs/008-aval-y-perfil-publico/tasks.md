---
description: "Tareas de la historia #12 — Aval entre personas y perfil público con niveles de verificación"
---

# Tasks: Aval entre personas y perfil público con niveles de verificación

**Input**: `specs/008-aval-y-perfil-publico/` — spec.md, plan.md (§Diseño), research.md (R1–R17),
data-model.md, contracts/actions.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí. Todo lo
que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola. La base de datos entera es una migración de la Fase 2, así que sus tests van en la misma
fase, apenas después de escribirla y antes de cualquier código que la use (constitución §IV). Antes
de escribir JSX o CSS se carga `frontend-design:frontend-design`; antes de la migración,
`supabase:supabase-postgres-best-practices`; después de varios TSX, `vercel:react-best-practices`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: los tokens que la chapita necesita, antes de cualquier CSS.

- [X] T001 `docs/10-design-system.md` §Color: `--color-metal` `#98A19C` y `--color-metal-light` `#D5DAD7`, «solo en la chapita» (plan §Tokens); §Recursos del cartel: la utilidad `.brillo` (la banda recta de `--color-canvas` al 50 %, una pasada, `--dur-page`, `--ease-out`, apagada con `prefers-reduced-motion`); y los mismos dos tokens y `.brillo` en `src/styles/globals.css`. Correr el test de paridad de tokens de `tests/gates/`

---

## Fase 2: Base compartida

**Propósito**: la base con sus tests, el nivel, las rutas y la medición que las cuatro user stories
usan. **Punto de control al final.**

### Base de datos

- [X] T002 Crear la migración con `pnpm exec supabase migration new vouches`: `profiles.public_id` (`text not null unique`, default `translate(rtrim(encode(extensions.gen_random_bytes(16), 'base64'), '='), '+/', '-_')`, `check` de 22 caracteres base64url), y los permisos por columna de data-model.md §Permisos de `profiles` (`revoke insert, update` de tabla; `grant insert (id, …)` y `update (id, …)` sin `public_id`), con el comentario del porqué
- [X] T003 En la misma migración, `public.vouches` y `public.vouch_blocks` de data-model.md: claves primarias del par, `check` de no ser la misma, referencias a `auth.users` con `on delete cascade`, índices (`vouches (vouchee_id, created_at desc)`, `vouch_blocks (vouchee_id)`), RLS activa **sin policies** y `revoke all … from anon, authenticated` en las dos
- [X] T004 En la misma migración, las ocho funciones de data-model.md con `set search_path = ''`: `private.has_level_two`, `public_profile` (meses truncados en hora de Uruguay; `has_photo`; `identity_since` solo con `level_one`; `vouchers` solo los que cuentan, del más reciente al más viejo), `avatar_path_for`, `vouch_standing`, `my_vouches` (`given_on` en día de Uruguay), `give_vouch` (candado del par y después de quien recibe; el orden de `outcome` de la tabla, `reciprocal` antes que `blocked`; `created`, `reached_level_three`), `withdraw_vouch`, `remove_vouch` (inserta la quita siempre); `revoke all … from public, anon, authenticated` en las ocho por nombre y `grant execute … to service_role` en las siete públicas
- [X] T005 `supabase/seed.sql` (research R17): `public_id` fijos para Ana, Lucía y Marta; Carla (nivel 3, avalada por Beto), Beto (nivel 2), Dani (nivel 2, sin avales) y Eva (nivel 3 con 50 avales de `aval-01@example.test` … `aval-50@example.test`, generados con `generate_series`, con perfil, teléfono `+598991000NN` e identidad, sin contraseña ni pedidos en revisión); Carla, Beto y Dani con contraseña para `walk --user`. Actualizar el comentario de cabecera del seed
- [X] T006 Correr `pnpm exec supabase db reset` y `pnpm db:types` para regenerar `src/lib/supabase/types.ts`

### Tests de la base (plan.md §Qué se testea, completo)

- [X] T007 [P] `tests/db/vouches.test.ts` — privacidad: `anon` y `authenticated` no pueden ejecutar ninguna de las ocho funciones, probadas por su nombre; no pueden leer `vouches` ni `vouch_blocks` (tampoco siendo parte del aval), ni el perfil, la identidad ni el teléfono de otra persona, ni insertar en `vouches`. `public_profile`: exactamente las claves de data-model (ni `id`, ni `created_at`, ni `verified_on`, ni `avatar_path`); meses en hora de Uruguay (el 31 de agosto a las 23:30 de Uruguay es agosto); sin `identity_since` sin nivel 1 aunque haya identidad; los avales en pausa por quien lo dio y por quien lo recibió no salen y vuelven al recuperar el nivel sin escribir nada; cero filas para id inventado, cuenta borrada y perfil sin completar. `avatar_path_for`: la ruta solo para un perfil completo con foto
- [X] T008 `tests/db/vouches.test.ts` — dar y retirar: `give_vouch` con cada `outcome`; con dos motivos gana el primero de FR-011 (A avaló a B, B quitó ese aval y avaló a A: A intenta avalar a B y recibe `reciprocal`); idempotente (`created` false la segunda vez); `reached_level_three` solo en el paso de 2 a 3 y una sola vez con dos personas que avalan a la misma en paralelo; cruce simultáneo con exactamente un aval (SC-004); `vouch_standing` por dirección y con `target_vouches_viewer` verdadero en pausa; `withdraw_vouch` de algo que no está da `absent`; retirar y volver a avalar da `created = true` y un día nuevo; retirar en pausa da `withdrawn`
- [X] T009 `tests/db/vouches.test.ts` — quitar, listar, nivel y baja: `remove_vouch` inserta la quita aunque el aval ya no esté y después `give_vouch` da `blocked`; la quita es de una sola dirección (B quitó el aval de A y B puede avalar a A); quitar en pausa da `removed`; `my_vouches` con solo las filas de la persona y las banderas de pausa por cada lado; la tabla de SC-005 (`publicLevel(public_profile(x))` igual a `verificationLevel(…, countingReceived(my_vouches(x)))` para niveles 0 a 3, pausa por cada lado, retirado, quitado y cuenta borrada); borrar la cuenta borra lo dado, lo recibido y las quitas en las dos direcciones y baja a quien dependía de ese aval
- [X] T010 [P] `tests/db/profiles.test.ts`: `insert` y `update` con un `public_id` elegido fallan; el mismo `upsert` que hace `upsertProfile`, en el alta y en la edición, anda

### Reglas y lógica pura

- [X] T011 [P] `src/lib/verification/level.ts` + `level.test.ts`: `VerificationLevel = 0 | 1 | 2 | 3`, `verificationLevel(phone, identity, countingVouches = 0)` y `publicLevel({ levelOne, identitySince, vouchers })` sobre la misma escalera, con los casos de plan.md §Qué se testea
- [X] T012 [P] `src/lib/verification/badge-parts.ts` + test (research R11): `badgeParts(level)` → relleno, tilde, anillo y clave de la etiqueta
- [X] T013 [P] `src/lib/profile/public-paths.ts` + `paths.test.ts`: `isPublicId`, `publicProfilePath(id)`, `publicProfileUrl(id)` (con `APP_URL`), `publicPhotoPath(id)` y `levelsPath(level, desde)` con `safeDestination`
- [X] T014 [P] `src/lib/vouches/my-vouches.ts` + test: `pauseMark` (ninguna, mía, suya, las dos) y `countingReceived` (solo recibidos sin pausa)
- [X] T015 [P] `src/lib/profile/month-year.ts` + test (research R8): «agosto de 2026» desde `YYYY-MM-DD`, sin correrse de mes en ninguna zona horaria del proceso
- [X] T016 [P] `src/lib/vouches/types.ts`: `PublicProfile`, `VouchStanding`, `MyVouch`, `GiveOutcome`, `WithdrawOutcome`, `RemoveOutcome` (data-model.md §Tipos)

### Datos, medición y textos

- [X] T017 `src/lib/supabase/queries/vouches.ts`: `getPublicProfile` (en `cache()`), `getVouchStanding`, `listMyVouches`, con la clave de servicio y solo esas funciones; `src/lib/supabase/queries/profiles.ts`: `public_id` en las columnas de `getMyProfile` y `getMyPublicId`; `src/lib/supabase/queries/avatars.ts`: `getPublicAvatar(publicId)` (contracts §Queries)
- [X] T018 [P] `src/lib/analytics/events.ts`: los ocho momentos de research R15 con sus propiedades tipadas y el comentario de cada disparador; `src/lib/analytics/link-preview.ts` + test y `src/lib/analytics/view-origin.ts` + test (`viewOrigin(referer, siteUrl)` comparando el origen entero; `shouldTrackView({ isOwner, userAgent, hasActionFlag })`) (research R10); `trackProfileMoment` en `src/actions/profile.ts` (`profile_link_copied` y `profile_contact_rejected`, validados contra listas cerradas como `trackPetMoment`)
- [X] T019 [P] `messages/es.json`: los namespaces `profile.public`, `verification.levels`, `vouches` y las claves de plan.md §Textos, en voseo y sin género para la otra persona; `docs/06-i18n.md`: `vouches` en la lista de namespaces
- [X] T020 `src/components/verification/verification-badge.tsx` (después de T001, T012 y T013): la chapita en SVG con `badgeParts`, `size` con `cva`, los tokens de metal, `.brillo` solo en `lg`, envuelta en el enlace de `levelsPath` con `prefetch={false}` y su etiqueta accesible, o sin enlace con `href` nulo (plan §La chapita)

**Punto de control**: `pnpm lint && pnpm typecheck && pnpm test` en verde; los tests de la base pasan contra la migración.

---

## Fase 3: US1 — Mostrar hasta dónde me verifiqué con un enlace (P1) 🎯 MVP

**Objetivo**: el perfil público sin ingresar, la chapita en las tres pantallas, la explicación de los niveles, copiar el enlace, «este perfil no existe».

**Prueba independiente**: la de spec.md §US1, con Carla, Beto, Ana y Marta del seed.

### Pantallas

- [X] T021 [US1] `src/app/[locale]/(public)/perfil/[id]/foto/route.ts`: `GET` con `isPublicId`, `getPublicAvatar`, `image/webp`, `Cache-Control: private, max-age=300`, 404 sin foto o sin perfil (research R7)
- [X] T022 [P] [US1] `src/components/verification/profile-level.tsx` (con nivel · sin nivel, con el enlace a `/niveles`) y `src/components/verification/levels-explanation.tsx` + `level-card.tsx`, con la chapita sin enlace (plan §Los niveles)
- [X] T023 [P] [US1] `src/components/profile/public-profile-header.tsx` (foto con `.cinta` desde `publicPhotoPath` o `Avatar lg`, `h1`, `ZoneLabel`, rescatista, «En el sitio desde…»), `public-profile-layout.tsx` (una columna; dos desde 1024 con el nivel siempre a la derecha) y `profile-not-found.tsx` sobre `HeadedEmptyState`. `ZoneLabel` se muda de `components/pets/` a `components/zones/` (lo usan dos dominios), con su fila de docs/10
- [X] T024 [US1] `src/app/[locale]/(public)/perfil/[id]/page.tsx` y `not-found.tsx`, **sin `loading.tsx`**: `isPublicId` → `notFound()`; `getPublicProfile`; `publicLevel`; `generateMetadata` con `{name}` y el sitio, el mismo título en los tres no existe, `robots` `noindex, nofollow` fijo; `public_profile_viewed` con `viewOrigin` y `shouldTrackView`, donde `isOwner` es `getMyPublicId() === id` si hay sesión (la única forma de saber si mira la dueña, también para el lugar de avalar). Si `isLinkPreview(userAgent)`, la página no dibuja la foto: sin `og:image` en el sitio, algunas vistas previas toman la primera imagen de la página (FR-009). Todavía sin el lugar de avalar ni la lista de avales (US3)
- [X] T025 [US1] `src/app/[locale]/(public)/niveles/page.tsx`: `?nivel` y `?desde`, `levels_explained`, `noindex`, «Volver»
- [X] T026 [US1] `src/app/[locale]/(public)/layout.tsx` monta `ErrorTextsProvider`; `src/app/[locale]/(public)/error.tsx` con `ErrorScreen`; `error-texts-provider.tsx` suma las claves de los límites nuevos
- [X] T027 [P] [US1] `src/components/profile/copy-profile-link.tsx` (quieto · copiado · plan B, research R13, con `trackProfileMoment`) y `public-profile-links.tsx` (sin el acceso a «Mis avales» todavía: llega con T047)
- [X] T028 [US1] «Mi perfil»: `src/app/[locale]/(app)/mi-perfil/_components/verification-sections.tsx` (la chapita `md` al lado del nombre por el hueco `badge` de `ProfileSummary`, las dos cards, «Tu perfil público» con «Ver mi perfil público» y copiar; `statusCardTexts` con `level >= 2`); el nivel con `listMyVouches` + `countingReceived`; `page.tsx` usa la sección; `loading.tsx` suma su forma; `IdentityStatusCard` dice «Estás en nivel 3»
- [X] T029 [US1] `/verificar-identidad` aprobada: `IdentityStatusView` con la chapita `lg` junto a «Estás en nivel 2/3», el sello baja a `md`, sin chapita con la identidad aprobada y sin nivel 1; la página calcula el nivel con `countingReceived` (plan §Verificación aprobada). Cierra KL-11-5

### E2E

- [X] T030 [US1] `tests/e2e/aval.spec.ts` (primera parte): el perfil de Beto (nivel 2) con `javaScriptEnabled: false` muestra nombre, zona, chapita, «Identidad verificada en…» y «En el sitio desde…» (FR-010); pedido con el agente de la vista previa de WhatsApp, su HTML tiene el título con su nombre y el sitio, `noindex, nofollow`, y ninguna imagen de la persona ni `/foto` en ningún lado, ni texto con su zona o su nivel en el `<head>` (FR-009); los tres no existe —un id inventado; el de una cuenta que el test crea con la clave de servicio, completa, guarda su `public_id` y borra; y un id mal formado— con el mismo 404 y el mismo HTML una vez quitados los nonces, los ids de build y el id pedido (SC-002). El perfil sin completar no tiene enlace (spec §Assumptions)
- [X] T031 [P] [US1] `tests/e2e/perfil-rendimiento.spec.ts`: el perfil de Eva a 390 px, LCP bajo 2,5 s con `support/web-vitals.ts` y el JavaScript de la página bajo 150 KB con Resource Timing (SC-006)

**Punto de control**: US1 se prueba sola con el seed.

---

## Fase 4: US2 — Que el perfil no deje el contacto a la vista (P2)

**Objetivo**: el nombre y la localidad del perfil con la regla de contacto de la ficha, citando el fragmento, y el aviso antes de escribir.

**Prueba independiente**: la de spec.md §US2.

### Tests

- [X] T032 [P] [US2] Mover `src/lib/contact/pet-contact.ts` y su test a `contact-match.ts` / `contact-match.test.ts` (`petContactMatch` → `contactMatch`); cambiar la importación en todos sus usos —`src/lib/schemas/pet.ts`, `src/lib/analytics/events.ts`, `src/actions/pets.ts` y `src/actions/profile.ts` (T018)— sin cambiar nada más (research R5)
- [X] T033 [US2] `src/lib/schemas/profile.test.ts`: la paridad limitada al largo del perfil (plan §Qué se testea) sobre las tres tablas de la ficha —la de contacto, la de lo que pasa, y la del número de puerta contra la localidad del perfil, en las dos direcciones—, los cuatro ejemplos de la historia con tipo y fragmento, «Villa 25 de Agosto» y «Ruta 8 km 25», y «fijo 2401 2345» en la localidad como contacto

### Regla y pantallas

- [X] T034 [US2] `src/lib/schemas/profile.ts`: `contactKind` y sus regex se borran; `FieldError` (`{ key, values? }`) por campo; `contactMatch` en nombre y localidad y `hasStreetNumber` en la localidad después del contacto; claves `profile.errors.contact_*` y `locality_street_number` con `{label}`
- [X] T035 [US2] `src/components/profile/profile-form.tsx` y `profile-fields.tsx` leen `FieldError` con sus valores; `publicHint` en el nombre y `localityHint` por `ZoneFields` (`src/components/zones/zone-fields.tsx`), las dos ayudas en `aria-describedby` en el orden del plan; `saveProfile` en `src/actions/profile.ts` registra `profile_contact_rejected` y el formulario lo registra con `trackProfileMoment` (T018) cuando lo detecta él. Se borran `profile.errors.name_has_*` y `locality_has_*`

**Punto de control**: US2 se prueba sola; la ficha de un animal sigue igual (sus tests en verde).

---

## Fase 5: US3 — Avalar a alguien en quien confío, y retirarlo (P3)

**Objetivo**: el lugar de avalar en el perfil público, avalar y retirar con su `Sheet`, el nivel 3 con los nombres, la puerta del teléfono con motivo `avalar`.

**Prueba independiente**: la de spec.md §US3, con Dani y Beto del seed.

### Tests

- [X] T036 [P] [US3] `src/lib/vouches/next-step.ts` + test y `src/lib/vouches/vouch-slot.ts` + test (research R6), con los casos de plan.md §Qué se testea
- [X] T037 [P] [US3] `src/lib/vouches/vouch-failure.ts` + test (research R16)
- [X] T038 [P] [US3] `src/lib/verification/gate.ts` + test: el motivo `vouch` con slug `avalar`; `verifyPath` y `VerifyPhoneScreen` con el encabezado «Para avalar, verificá tu teléfono»

### Acciones y pantallas

- [X] T039 [US3] `src/actions/vouches.ts`: `giveVouch` y `withdrawVouch` (contracts), con `isPublicId`, sesión, `DB_RULES.p_pending_ttl` y los momentos `vouch_given` y `level_three_reached` (los dos solo si `created`) y `vouch_withdrawn`
- [X] T040 [US3] `src/components/vouches/profile-vouchers.tsx` (enlaces con `prefetch={false}`, R10), `vouch-slot.tsx`, `vouch-paused-note.tsx`, `vouch-sheet.tsx` y `vouch-action.tsx` (plan §Perfil público: `can_vouch` tirita, `sign_in` `secondary`, `vouching` sin fecha, los estados sin botón, `needs_level_two` con el paso; la frase fija de si baja de nivel); textos por props
- [X] T041 [US3] `ScreenToast` se muda a `src/app/[locale]/_components/`; `vouch-notice.tsx` ahí (solo con sesión; `dado`, `retirado`, `quitado`, `ausente` con aviso, y `cambio` sin aviso, que igual saca la marca de la dirección); `aval` en las marcas que `SavedToast` saca de la dirección
- [X] T042 [US3] La página del perfil trae `getVouchStanding`, el nivel y el pedido de identidad de quien mira, calcula `vouchSlot()` y le pasa el resultado por props a `VouchSlot` (los componentes de dominio no traen datos); suma `ProfileVouchers` y `VouchNotice`; la columna de la derecha del plan desde 1024

### E2E

- [X] T043 [US3] `tests/e2e/aval.spec.ts` (segunda parte): Dani avala a Beto; sin sesión, Beto en nivel 3 con «Dani …»; Dani retira y Beto vuelve a nivel 2. El perfil de Carla con `javaScriptEnabled: false` muestra a Beto entre quienes responden (FR-005, FR-010). Un `afterEach` retira con la clave de servicio cualquier aval que el test haya dejado, para no cambiar el seed de las próximas corridas ni de las capturas

**Punto de control**: US3 se prueba sola sobre US1.

---

## Fase 6: US4 — Ver mis avales y quitar uno que no quiero (P4)

**Objetivo**: «Mis avales» con las dos listas, retirar y quitar, los vacíos, la quita que no se deshace.

**Prueba independiente**: la de spec.md §US4.

- [X] T044 [US4] `removeVouch` en `src/actions/vouches.ts` con `vouch_removed`
- [ ] T045 [US4] `src/components/ui/destructive-confirm-dialog.tsx`: `triggerVariant` (`ghost-danger` por defecto) y su fila de docs/10; `src/components/vouches/remove-vouch-dialog.tsx` con la frase fija de si baja de nivel
- [ ] T046 [US4] `src/components/vouches/my-vouches-list.tsx`, `my-vouch-row.tsx` (el nombre enlazado con `prefetch={false}`, foto por `publicPhotoPath`, `given_on`, `VouchPausedNote`, «Retirar mi aval» con `VouchSheet` o «Quitar el aval» en `ghost`) y `my-vouches-empty.tsx` (el paso una sola vez sin nivel 2; `CopyProfileLink` con nivel 2)
- [ ] T047 [US4] `src/app/[locale]/(app)/mis-avales/page.tsx`, `loading.tsx`, `error.tsx`: `requireProfile('/mis-avales')`, `listMyVouches`, «Quién me avala» primero, las dos columnas desde 1024, `VouchNotice`, `noindex`; y el acceso a «Mis avales» con N en `PublicProfileLinks` de «Mi perfil» («Ningún aval cuenta por ahora» si todos están en pausa)

**Punto de control**: US4 se prueba sola sobre US3.

---

## Fase 7: Pulido

- [ ] T048 [P] `docs/10-design-system.md`: las filas nuevas y cambiadas de §Componentes con sus variantes (plan §Componentes), `VerificationBadge` completa, la decisión de `Sheet` para avalar y retirar, las dos columnas del perfil y de «Mis avales» desde 1024, el sello `md` en la verificación aprobada, `ScreenToast` en la capa compartida, `ErrorTextsProvider` también en `(public)`
- [ ] T049 [P] `docs/06-i18n.md` §Glosario: «nivel 1» (el teléfono; la chapita ya existe), «nivel 3», «aval en pausa», «retirar un aval», «quitar un aval», «perfil público»
- [ ] T050 [P] `docs/known-limitations.md`: borrar KL-11-5 y KL-53-5
- [ ] T051 Capturas con `node scripts/walk.mjs --story aval-y-perfil-publico` y las rutas de quickstart.md paso 8, a 390 y 1280
- [ ] T052 Cargar `vercel:react-best-practices` y revisar los TSX nuevos; `pnpm verify` completo, con `pnpm mutation` al 100 % sobre lo que tiene test

---

## Dependencias y orden

- Fase 1 antes de cualquier CSS. Fase 2 bloquea todo: la migración (T002–T006), después sus tests
  (T007–T010), después las queries (T017). `trackProfileMoment` (T018) está en la base porque lo usan
  US1 y US2.
- US1 (Fase 3) antes que US3 (el lugar de avalar vive en su página) y que US4 (la fila enlaza al
  perfil y usa su foto). US2 (Fase 4) es independiente de las otras y puede ir en paralelo con US1:
  US2 edita `saveProfile` en `src/actions/profile.ts` (T035) y US1 no toca ese archivo: lo que
  comparten, `trackProfileMoment`, ya está en T018.
- US4 después de US3: reusa `VouchSheet`, `VouchNotice` y `VouchPausedNote`.
- Pulido al final.

## Paralelo, por ejemplo

- T007–T016 y T018–T019 entre sí, después de T006; T020 después de T012 y T013.
- T022, T023 y T027 entre sí.
- Fase 4 entera con Fase 3.
- T036–T038 entre sí.

## Estrategia

MVP = Fases 1–3: el perfil público con la chapita ya reemplaza el «¿alguien la conoce?» con lo que
la persona verificó. Después US2 (antes de que haya perfiles públicos con contacto en la beta), US3
y US4. Cada punto de control corre la compuerta local mínima (`pnpm lint && pnpm typecheck && pnpm
test`); `pnpm verify` entero antes del PR.
