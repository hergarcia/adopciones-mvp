---
description: "Tareas de la historia #281 — Que «Mis animales» invite a verificar la identidad y diga qué cambia en las publicaciones"
---

# Tasks: Que «Mis animales» invite a verificar la identidad y diga qué cambia en las publicaciones

**Input**: `specs/034-invitar-identidad-mis-animales/` — spec.md, plan.md (§Diseño, §Cómo se
construye), research.md (R1–R11), data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: sí, y solo los de research R11; no se agrega ninguno fuera de ahí ni se saca ninguno de
ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se abre
`docs/10-design-system.md` (y se carga `frontend-design:frontend-design` si la corrida lo tiene);
antes de tocar la migración o sus tests, `supabase:supabase-postgres-best-practices` si está; todo
texto visible, con `sin-slop`; después de varios TSX, `vercel:react-best-practices`. La migración es
un solo archivo; después de cada cambio, `pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: lo que se guarda, los orígenes nuevos en la base y las constantes que usan las cuatro
partes.

- [ ] T001 Crear `supabase/migrations/20261106120000_identity_invite.sql`: la tabla `public.identity_invite_dismissals` (`person_id` clave primaria con `on delete cascade` a `auth.users`, `dismissed_on date` con el día de Uruguay por omisión), RLS sin políticas, `revoke all ... from anon, authenticated` y su `comment` (data-model.md, research R1)
- [ ] T002 En la misma migración: `public.dismiss_identity_invite()` (`dismissed` · `already` · `not_signed_in`) y `public.identity_invite_dismissed()` (`stable`), las dos `security definer`, `set search_path = ''`, `revoke all ... from public, anon, authenticated` y `grant execute ... to authenticated` (data-model.md §Funciones)
- [ ] T003 En la misma migración: `identity_requests_origin_valid` a `('profile', 'my_pets')`; los tres `check` de origen de la pregunta de por qué se va con `invited`; las filas `('phone', 'invited')` e `('identity', 'invited')` de `verification_exit_counts`; `ask_verification_exit` redefinida con los cinco orígenes y `admin_verification_exit_summary` con el orden `publish, apply, self, asked, invited` (data-model.md §Cambios, research R4, R6)
- [ ] T004 `pnpm exec supabase db reset` y `pnpm db:types`
- [ ] T005 [P] `src/lib/verification/identity.ts`: `IDENTITY_ORIGINS = ['profile', 'my_pets']` (research R4)
- [ ] T006 [P] `src/lib/verification/paths.ts`: `INVITE_FLAG = 'invitacion'` e `identityFromInvitePath()` → `/verificar-identidad?pedir=1&invitacion=1` (contracts §Direcciones)
- [ ] T007 [P] `tests/db/identity-invite-support.ts`: sobre los soportes de `tests/db` que ya existen (`identity-support.ts`, `verification-exits-support.ts`), sembrar una persona de nivel 1 con un animal, otra persona, quien administra; leer `identity_invite_dismissals` con el cliente de servicio; tocar «Ahora no» como una persona

**Checkpoint**: la base guarda y lee la marca y acepta los orígenes nuevos, sin ninguna pantalla.

---

## Fase 2: User Story 1 — Ver la invitación en «Mis animales» y verificarse desde ahí (P1) 🎯 MVP

**Goal**: «Mis animales» muestra la invitación solo a quien corresponde, con sus textos, y
«Verificar mi identidad» lleva a la verificación de siempre con el origen `my_pets` y las salidas
de vuelta a «Mis animales».

**Independent Test**: spec.md US1.

### Tests de US1

- [ ] T008 [P] [US1] `src/lib/verification/identity-invite.test.ts` (`identityInviteShown`): se muestra con publicaciones, nivel 1, `none`, `rejected` o `expired` y sin «Ahora no»; cada condición sola la apaga (0 publicaciones; teléfono sin verificar, perdido o a medias; `in_review`; `approved`; `capped`; `dismissed`) (FR-001, FR-005, SC-001)
- [ ] T009 [P] [US1] `src/lib/verification/identity-invite.test.ts` (`inviteSubject`): un animal disponible, uno en proceso y una camada disponible devuelven su nombre; dos publicaciones, un animal adoptado, pausado, vencido o dado de baja, y una camada adoptada, pausada, vencida o dada de baja devuelven `null`; sin publicaciones, `null` (FR-007, research R3)
- [ ] T010 [P] [US1] `src/lib/verification/exit-question.test.ts`: `exitPlaceOf` lee `invitacion=1` (y no `invitacion=0` ni sin marca); `exitDestination('identity', …)` con `invited` vuelve a `/mis-animales`, con solicitud o animal además gana la solicitud y después el animal; sin marca, como hoy (FR-013, FR-014, research R5)
- [ ] T011 [P] [US1] `tests/db/identity-invite-privacy.test.ts` (lectura): el visitante anónimo y una persona no leen ni escriben `identity_invite_dismissals` directo; `identity_invite_dismissed()` como visitante da error de permiso; como otra persona y como quien administra devuelve `false` aunque la persona sembrada tenga la marca; la dueña recibe `true` solo con la suya (FR-021, SC-004)
- [ ] T012 [P] [US1] `tests/db/identity-invite-rules.test.ts` (origen): `submit_identity_request` con `my_pets` guarda el pedido con ese origen y `withdraw_identity_request` lo devuelve; un origen desconocido lo rechaza el `check` (FR-012)

### Implementación de US1

- [ ] T013 [P] [US1] `src/lib/verification/identity-invite.ts`: `identityInviteShown` sobre `isLevelOne` y `canRequest`, e `inviteSubject` sobre `PetSummary[]` y `MyLitter[]` (research R2, R3)
- [ ] T014 [P] [US1] `src/lib/verification/exit-question.ts`: `ExitPlace` suma `invited: boolean`; `exitPlaceOf` lo lee de `INVITE_FLAG`; `exitDestination('identity', …)` devuelve `MY_PETS_PATH` con `invited` después de solicitud y antes de animal; los demás armados de `ExitPlace` (`identity-routes.ts`, `verificar-telefono/page.tsx`, `verificar-telefono/codigo/page.tsx`, pruebas) pasan `invited: false` (research R5)
- [ ] T015 [P] [US1] `src/lib/supabase/queries/identity-invite.ts`: `isIdentityInviteDismissed()` con `rpc('identity_invite_dismissed')`, que lanza si la base falla (contracts)
- [ ] T016 [US1] `src/app/[locale]/(app)/_components/identity-routes.ts`: `identityRoutes(applicationId, returnCode, invited)` suma el caso de la invitación (`newPath` = `identityFromInvitePath()`, `leavePath` = `/mis-animales`, `sentPath` `undefined`); precedencia solicitud > animal > invitación (research R4, R5)
- [ ] T017 [US1] `src/app/[locale]/(app)/verificar-identidad/page.tsx`: lee `INVITE_FLAG` de la consulta; `origin` = `my_pets` con la marca y sin solicitud ni animal, si no `profile`; lo usa en `identity_request_started`, `identity_cap_reached` y en el formulario; pasa `invited` a `identityRoutes` (FR-011 a FR-014, research R4)
- [ ] T018 [US1] Textos con `sin-slop` en `messages/es.json` → `identity.invite.*`: título, la frase de qué cambia con y sin nombre, los cuatro lugares (ficha con «su» y «la»), la línea de las fotos y los 2 días, «Verificar mi identidad», «Ahora no», el nombre de la sección, `errors.session` y `errors.failed`; sin prometer solicitudes ni adopciones (FR-006, FR-008)
- [ ] T019 [P] [US1] `src/app/[locale]/_components/identity-invite-texts.ts`: arma los textos de la nota con o sin nombre (`inviteSubject`)
- [ ] T020 [P] [US1] `src/components/verification/identity-invite-frame.tsx` (`"use client"`): recibe la nota armada como `children`, el texto y la acción de «Ahora no»; a la vista o cerrada; por ahora «Ahora no» solo la esconde (la acción llega en US2) (research R10)
- [ ] T021 [US1] `src/components/verification/identity-invite.tsx`: `section` con `aria-labelledby`, `Card taped`, título en afiche `--text-xl`, la frase con «Identidad verificada» en `--color-primary` medium, la `ul` de lugares, la línea de las fotos en `--text-sm` `ink-muted`, `LinkButton` `secondary` a `identityFromInvitePath()` y el «Ahora no» de `IdentityInviteFrame`; una columna hasta 1023 y dos columnas iguales con `--space-16` desde 1024, cada una en `--measure` (plan §Diseño, FR-009, FR-009a)
- [ ] T022 [US1] `src/app/[locale]/(app)/mis-animales/_components/identity-invite-slot.tsx`: recibe `phone`, `pets` y `litters`; lee en paralelo `getMyIdentity()` e `isIdentityInviteDismissed()`; cualquier falla o identidad nula, nada; decide con `myVerification` e `identityInviteShown`, con publicaciones = animales + camadas (una camada cuenta una, FR-003); arma `IdentityInvite` con sus textos (research R9, FR-004)
- [ ] T023 [US1] `src/app/[locale]/(app)/mis-animales/page.tsx`: el slot debajo de la fila de «Publicar un animal» y antes de `ProfileLinkLine`, solo en la rama con publicaciones; el `h1` con `id` y `tabIndex={-1}`; `loading.tsx` sin cambios (FR-002, FR-009, FR-010)
- [ ] T024 [P] [US1] `docs/10-design-system.md`: filas de `IdentityInvite` e `IdentityInviteFrame` en §Componentes y, en la de `ProfileLinkLine`, que va después de la invitación cuando está
- [ ] T025 [P] [US1] `docs/06-i18n.md`: «invitación a verificar la identidad» en el glosario (en código `identity invite`; nunca «recordatorio» ni «aviso»)

**Checkpoint**: US1 se prueba sola con las personas sembradas de quickstart.md.

---

## Fase 3: User Story 2 — Cerrar la invitación con «Ahora no» (P2)

**Goal**: «Ahora no» esconde la nota en el momento, guarda el día una sola vez y no vuelve nunca; si
guardar falla, se va igual y puede volver.

**Independent Test**: spec.md US2.

### Tests de US2

- [ ] T026 [P] [US2] `tests/db/identity-invite-rules.test.ts` (marca): `dismiss_identity_invite()` devuelve `dismissed` y deja una fila con el día de Uruguay; el segundo llamado y dos en paralelo devuelven `already` y dejan una sola fila con el primer día; como visitante anónimo, error de permiso; borrar la cuenta borra la fila (FR-015, FR-017, FR-022)
- [ ] T027 [US2] `tests/e2e/identidad-invitacion.spec.ts`: una persona sembrada de nivel 1 con un animal abre «Mis animales», ve la invitación con el nombre, toca «Ahora no», la nota se va sin recargar y el foco queda en el título; recarga y no está; en «Mi perfil» sigue la oferta de nivel 2. Otra persona toca «Verificar mi identidad», la dirección trae la marca, toca «Ahora no» en la verificación (o contesta la pregunta) y vuelve a «Mis animales» con la invitación (SC-001, SC-002, SC-003)

### Implementación de US2

- [ ] T028 [P] [US2] `src/lib/verification/identity-invite.ts`: `DISMISS_OUTCOMES` (`dismissed` · `already` · `not_signed_in`) y su guarda de tipo
- [ ] T029 [US2] `src/lib/supabase/queries/identity-invite.ts`: `dismissIdentityInviteRecord()` con `rpc('dismiss_identity_invite')`, nulo si la base falla o devuelve algo desconocido
- [ ] T030 [US2] `src/actions/identity-invite.ts`: `dismissIdentityInvite(): Promise<ActionResult<null>>` según contracts (sin sesión, `dismissed`, `already`, falla) con `revalidatePath(MY_PETS_PATH)` cuando guarda
- [ ] T031 [US2] `src/components/verification/identity-invite-frame.tsx`: «Ahora no» en un `form` con `action={dismissIdentityInvite}`; con JavaScript, al enviar esconde la nota en el acto, llama la acción en una transición sin mirar el resultado y pasa el foco al `h1` por id; sin JavaScript, el `form` postea y la página vuelve sin la nota (FR-015, FR-016, research R10)

**Checkpoint**: US1 y US2 andan juntas.

---

## Fase 4: User Story 3 — El correo de identidad aprobada lleva a «Mis animales» (P3)

**Goal**: aprobar un pedido que vino de la invitación manda el correo de siempre con «Ver Mis
animales»; los demás correos quedan como hoy.

**Independent Test**: spec.md US3.

### Tests de US3

- [ ] T032 [P] [US3] `src/lib/email/send-identity-result.test.ts` (`approvedSecondary`): con animal de #63, el animal (aunque venga `toMyPets`); sin animal y con `toMyPets`, «Mis animales» a `/mis-animales`; sin ninguno, nada (FR-019, FR-020)

### Implementación de US3

- [ ] T033 [US3] `src/lib/email/send-identity-result.ts`: `IdentityResult` aprobado suma `toMyPets: boolean`; `approvedSecondary(result, t)` puro y exportado arma el segundo enlace (research R8)
- [ ] T034 [US3] `src/actions/review.ts`: `toMyPets: resolved.origin === 'my_pets'` en el resultado aprobado; y cualquier otro armado de `IdentityResult` aprobado (buscarlo con `rg "kind: 'approved'"`) pasa `toMyPets: false`
- [ ] T035 [US3] Texto con `sin-slop` en `messages/es.json` → `emails.identity_approved.my_pets_button`

**Checkpoint**: US1 a US3 andan juntas.

---

## Fase 5: User Story 4 — Medir si quien rescata se verifica cuando el sitio se lo ofrece (P4)

**Goal**: los dos momentos nuevos, el origen `my_pets` en cada paso del pedido, el origen `invited`
en la pregunta de por qué se va y en Encuestas, y la lectura 11.

**Independent Test**: spec.md US4.

### Tests de US4

- [ ] T036 [P] [US4] `src/lib/verification/exit-question.test.ts`: `exitOrigin('identity', …)` devuelve `asked` con solicitud (también con marca), `invited` con marca sin solicitud (también con animal), `apply` con animal sin marca y `self` sin nada; `EXIT_ORIGINS` termina en `invited` (FR-027)
- [ ] T037 [P] [US4] `tests/db/identity-invite-rules.test.ts` (pregunta): `ask_verification_exit('identity', 'invited')` suma en su fila de `verification_exit_counts` y crea el ticket con ese origen; `admin_verification_exit_summary()` como quien administra devuelve las filas de `invited` después de las de `asked`; un origen desconocido devuelve nulo (FR-027)
- [ ] T038 [P] [US4] `src/lib/surveys/exit-summary.test.ts`: la columna `invited` sale de `EXIT_ORIGINS` con sus números (actualizar las aserciones que listan los orígenes)

### Implementación de US4

- [ ] T039 [P] [US4] `src/lib/verification/exit-question.ts`: `EXIT_ORIGINS` suma `invited`; `exitOrigin('identity', …)` con la precedencia de research R6
- [ ] T040 [P] [US4] `src/lib/analytics/events.ts`: `identity_invite_dismissed` en `EVENTS` (con su comentario: sin persona, uno por «Ahora no» guardado) y en `EventProps` como `Origin` (research R7)
- [ ] T041 [US4] `src/app/[locale]/(app)/mis-animales/_components/identity-invite-slot.tsx`: `track('identity_offer_viewed', { origin: 'my_pets' })` cuando dibuja la invitación (FR-025)
- [ ] T042 [US4] `src/actions/identity-invite.ts`: `track('identity_invite_dismissed', { origin: 'my_pets' })` solo con `dismissed` (FR-025, FR-028)
- [ ] T043 [P] [US4] Texto con `sin-slop` en `messages/es.json` → `surveys.exits.origins.invited`; `ExitOriginTable` y `verification-exits.tsx` toman la columna de `EXIT_ORIGINS` sin otro cambio (verificarlo)
- [ ] T044 [P] [US4] `docs/03-mvp-features.md` §Métricas de éxito, «Cómo se leen»: la lectura 11 «¿Quien rescata pasa por la verificación de identidad cuando el sitio se la ofrece?» con `identity_request_sent` e `identity_request_approved` con `origin` = `my_pets` sobre `identity_offer_viewed` con `origin` = `my_pets` y al lado de `identity_invite_dismissed`; `verification_exit_*` con `origin` = `invited` al lado de `apply`, `publish` y `asked`; qué parte de quienes publican tiene la identidad verificada antes y después del día, contado en la base sin nombres (`identity_verifications` contra quienes tienen una publicación); lo que gana la lectura 5; la advertencia de 3 a 5 rescatistas (FR-029)

**Checkpoint**: las cuatro partes andan juntas.

---

## Fase 6: Pulido

- [ ] T045 `vercel:react-best-practices` sobre los TSX tocados (si la corrida lo tiene)
- [ ] T046 Capturas a 390 y 1280 de «Mis animales» con y sin la invitación (`node scripts/walk.mjs --story invitar-identidad-mis-animales --user /mis-animales`) y revisarlas contra plan §Diseño y FR-009a (SC-005)
- [ ] T047 Recorrer quickstart.md entero, con la medición en la consola del servidor (SC-006)
- [ ] T048 `pnpm gates:affected` verde, con Stryker al 100 % sobre `identity-invite.ts`, `exit-question.ts` y `send-identity-result.ts`

---

## Dependencias

- Fase 1 bloquea todo. T004 después de T001–T003.
- US1 (Fase 2) es el MVP. US2 necesita la nota de US1 (T020, T021). US3 necesita el origen guardado
  (T005, T017). US4 necesita el slot (T022), la acción (T030) y `ExitPlace.invited` (T014).
- Dentro de cada fase, los tests van antes que su implementación y fallan primero.

## Paralelo

- Fase 1: T005, T006 y T007 juntos, después de T004.
- US1: T008–T012 juntos; después T013, T014, T015, T019, T020, T024, T025 juntos; T016 → T017; T021
  → T022 → T023.
- US4: T036–T038 juntos; T039, T040, T043, T044 juntos.

## Estrategia

MVP = Fase 1 + US1: la invitación se ve donde corresponde y lleva a verificarse. Después US2 (sin
«Ahora no» guardado la nota volvería siempre), US3 y US4, cada una con `pnpm gates:affected` verde
antes de pasar a la siguiente.
