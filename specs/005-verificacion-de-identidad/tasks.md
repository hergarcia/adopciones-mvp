---
description: "Tareas de la historia #11 — Verificación de identidad con revisión manual"
---

# Tasks: Verificación de identidad con revisión manual

**Input**: `specs/005-verificacion-de-identidad/` — spec.md, plan.md (§Diseño + 16 decisiones),
data-model.md, contracts/actions.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí. Cada
archivo con test queda al 100 % de mutation score.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Base y pulido no llevan etiqueta

---

## Fase 1: Base de datos

**Propósito**: el modelo entero de data-model.md, del que dependen las cuatro user stories. Antes
de escribir SQL se carga `supabase:supabase-postgres-best-practices`.

- [X] T001 Crear la migración con `pnpm exec supabase migration new identity_verification`: `create extension if not exists pg_cron` y `pg_net`; el esquema `private` con `private.is_admin()` (`language sql`, `stable`, `security definer`, `set search_path = ''`, `(select auth.uid())` adentro; `revoke execute … from public, anon`; `grant usage on schema private` y `grant execute` a `authenticated`)
- [X] T002 En la misma migración, las tablas de data-model.md con RLS habilitada, `revoke all … from anon, authenticated`, sus `grant select` y sus `comment on`: `admins` (`user_id` PK `on delete cascade`, policy `admins_select_own`); `identity_requests` (`user_id` `unique` `on delete cascade`, `sent_at`, `expires_at not null`, `origin text not null check (origin in ('profile'))`, índices en `expires_at` y `sent_at`, policies `identity_requests_select_own` e `identity_requests_select_admin` con `private.is_admin() and expires_at > now()`); `identity_request_images` (`request_id … on delete cascade`, `kind check (kind in ('front', 'selfie'))`, `data bytea not null check (octet_length(data) <= 460800)`, PK `(request_id, kind)`, policy única `identity_request_images_select_reviewer`: admin, pedido vigente y no propio)
- [X] T003 En la misma migración: `identity_verifications` (`user_id` PK, `verified_on date not null`, policy own); `identity_rejections` (`reason check (reason in ('unreadable', 'mismatch', 'expired_document', 'suspected_fraud'))`, `rejected_on date not null`, índice `(user_id, rejected_on desc)`, policies own y `identity_rejections_select_admin_reviewing`); `identity_expirations` (`user_id` PK, `expired_on date not null`, `notice_pending boolean not null default true`, policy own); `identity_resolutions` (`request_id` PK, `user_id … on delete cascade`, `resolved_by … on delete set null`, índices en las dos FK, policy `identity_resolutions_select_admin`); y la policy `profiles_select_under_review` en `profiles`
- [X] T004 En la misma migración, las funciones de data-model.md §Funciones —`submit_identity_request`, `withdraw_identity_request`, `resolve_identity_request`, `expire_identity_requests`, `identity_expiry_mail_tick`—, `security invoker`, `set search_path = ''`, candado `pg_advisory_xact_lock(hashtextextended('identity-user:' || id, 0))`, "hoy" en `America/Montevideo`, las reglas como parámetros, `revoke` a `public, anon, authenticated` y `grant execute` a `service_role`; y los dos `cron.schedule` cada 5 minutos
- [X] T005 `supabase/seed.sql`: Lucía (`22222222-…`) en `admins`; en `seed.sql`, los secretos de Vault `app_url` (`http://host.docker.internal:3000`) y `cron_secret` (el valor de desarrollo de `.env.example`), dentro de un bloque que no falle si Vault no está
- [X] T006 Correr `pnpm exec supabase db reset` y `pnpm db:types` para regenerar `src/lib/supabase/types.ts`; `pnpm exec supabase db advisors` sin hallazgos nuevos

**Punto de control**: `pnpm test` en verde con los tests de las historias anteriores sin tocar.

---

## Fase 2: Base compartida del código

**Propósito**: reglas, consultas, eventos y textos que usan todas las user stories.

- [X] T007 [P] `src/lib/verification/rules.ts`: `IDENTITY_REVIEW_TTL_DAYS = 7`, `IDENTITY_REJECTION_WINDOW_DAYS = 30`, `IDENTITY_REJECTION_CAP = 3`, `IDENTITY_EXPECTED_REVIEW_DAYS = 2`, `IDENTITY_PHOTO_MAX_BYTES = 10 MB`, `IDENTITY_PHOTO_MAX_SIDE = 1600`, `IDENTITY_PHOTO_FALLBACK_SIDE = 1280`, `IDENTITY_PHOTO_TARGET_BYTES = 450 KB`, `REVIEW_POLL_MS = 10_000`, cada una con su FR
- [X] T008 [P] `src/lib/config.ts`: `SUPPORT_EMAIL` junto a `APP_NAME` (plan.md §16); `src/lib/env.ts` y `.env.example`: `CRON_SECRET`
- [X] T009 [P] `src/lib/supabase/queries/identity.ts`: `getMyIdentity()` (pedido propio, verificación, rechazos en ventana, vencimiento), `isAdmin()`, `countPendingReviews()`, `listReviewQueue()`, `getReviewRequest(id)` (perfil, rechazos en ventana), `getReviewImage(id, kind)` (hex → bytes), `getReviewRequestTrace(id)` (existe, resuelto), y con la clave de servicio `submitIdentityRequest`, `withdrawIdentityRequest`, `resolveIdentityRequest`, `listPendingExpiryNotices`, `markExpiryNoticeSent`. Única puerta a las tablas nuevas
- [X] T010 [P] `src/lib/analytics/events.ts` y `track.ts`: los nueve eventos de plan.md §11 con su comentario de disparo; `track(event, props?, { visit? })` con propiedades tipadas por evento (`origin`, `reason`, `review_hours`), sin ids ni texto libre
- [X] T011 [P] `src/lib/email/with-deadline.ts`: extraer `withDeadline` de `send-number-lost.ts`, que pasa a importarlo sin cambiar lo que hace
- [X] T012 [P] `messages/es.json`: namespaces `identity.*` (oferta, consentimiento, fotos, estados, sellos, motivos con `label` y `advice`, errores), `review.*` (cola, pedido, regla, rechazar, cerrado, errores), `emails.identity_approved`, `emails.identity_rejected`, `emails.identity_expired`, `metadata.identity`, `metadata.review`, `metadata.review_request`, el motivo de la puerta `verification.gate.identity`, y la confirmación de borrar la cuenta nombrando la verificación de identidad (FR-034)
- [X] T013 [P] `src/lib/verification/level.ts` + `level.test.ts`: `verificationLevel(phone, identity)` → `0 | 1 | 2`. Aserciones: sin teléfono o con cambio a medias es 0 con o sin identidad; nivel 1 sin identidad es 1; nivel 1 con identidad es 2
- [X] T014 [P] `src/lib/verification/identity-status.ts` + `identity-status.test.ts`: `identityStatus(input, now)` de plan.md §5. Aserciones: `none`; `in_review` con `expiresAt`; un pedido con `expires_at` igual a `now` ya es `expired`, uno un milisegundo antes no; `approved` con su día; `rejected` con `attemptsLeft` 2 y 1; el tercer rechazo en ventana da `capped` con `retryOn` = el más viejo de los tres + 30; un rechazo de hace exactamente 30 días ya no cuenta, uno de hace 29 sí; `expired` con su día; un vencimiento de más de 30 días es `none`; `approved` gana sobre todo lo demás

**Punto de control**: `pnpm lint && pnpm typecheck && pnpm test`.

---

## Fase 3: User Story 1 — Pedir la verificación de identidad (P1) 🎯 MVP

**Objetivo**: una persona en nivel 1 acepta el consentimiento, sube las dos fotos y ve su pedido en
revisión; puede retirarlo.

**Prueba independiente**: con Ana (nivel 1), oferta en «Mi perfil» → consentimiento → dos fotos →
«En revisión»; retirar → la vista de pedir con el aviso. Con Marta sin teléfono, la puerta.

### Tests de US1

- [X] T015 [P] [US1] `src/lib/schemas/identity.test.ts` + `identity.ts`: `identitySubmissionSchema` — acepta `consent=yes`, `origin=profile` y dos `image/webp` con firma `RIFF….WEBP` de ≤ 450 KB; rechaza sin consentimiento, un origen desconocido, una sola foto, un tipo que no es WebP, un WebP de 450 KB + 1 byte y un archivo con tipo WebP y firma de otro formato
- [X] T016 [P] [US1] `src/lib/profile/identity-photo.test.ts` + `identity-photo.ts`: `nextEncodeStep(width, height, bytes, step)` — la primera salida limita el lado mayor a 1600 sin agrandar una foto chica; pasado el objetivo baja la calidad a 0,75 y después 0,65; después baja a 1280; después se rinde con el error de procesado. `processIdentityPhoto(file)` con canvas (`imageOrientation: 'from-image'`, WebP) sin test, como `processAvatar`
- [X] T017 [P] [US1] `src/lib/verification/gate.test.ts` + `gate.ts`: `GateReason` suma `identity` con slug `identidad`; `parseGate({ para: 'identidad' })` la reconoce; `gateCheck` sin nivel 1 lleva al aviso con `para=identidad`, `next` y `desde`
- [X] T018 [US1] `tests/db/identity.test.ts` (parte de US1): con `tests/db/roles.ts`, `submit_identity_request` deja pedido + dos imágenes; sin nivel 1 devuelve `no_phone` y no guarda nada; con un pedido abierto, `already_open`; cinco envíos en paralelo dejan un solo pedido; con 3 rechazos en ventana, `capped` con `retry_on` correcto, y un vencido o retirado no cuenta; `withdraw_identity_request` borra pedido e imágenes; la dueña **no** lee sus imágenes; anónimo y otra cuenta no leen el pedido ni las imágenes; nadie inserta, actualiza ni borra en ninguna tabla nueva desde el cliente, tampoco la dueña

### Implementación de US1

- [X] T019 [P] [US1] `src/components/verification/identity-consent.tsx`: el texto de FR-004 (quién ve, cuándo se borra, qué queda, retirar, nadie más), plegable con `details` una vez aceptado
- [X] T020 [P] [US1] `src/components/verification/selfie-example.tsx`: SVG inline, trazo de tinta con un toque de yerba, 160 px de alto, con `.cinta`, `aria-hidden` y la descripción en texto al lado
- [X] T021 [P] [US1] `src/components/verification/identity-photo-field.tsx` (cliente): «Sacar foto» con `capture` (`environment` o `user`) y «Elegir foto»; filtro de tipo y 10 MB antes de procesar (FR-006); `Skeleton` mientras procesa; vista previa sin inclinación; «Cambiar foto»; `ErrorText` por foto
- [X] T022 [US1] `src/components/verification/identity-request-form.tsx` (cliente): los dos pasos; «Acepto y elijo las fotos» llama `acceptIdentityConsent`; «Enviar mi pedido» deshabilitada sin las dos fotos y `loading` al enviar; arma el `FormData` con `consent`, `origin` y las dos fotos; maneja los resultados de contracts/actions.md (refresco, puerta, error arriba de la tirita)
- [X] T023 [P] [US1] `src/components/verification/identity-status-view.tsx`: el sello, los textos y la acción de cada estado de `identityStatus` (plan.md §Diseño, Estado de mi pedido), con el día y la hora de vencimiento en hora de Uruguay y `tabular-nums`
- [X] T024 [P] [US1] `src/components/verification/withdraw-request-dialog.tsx` (cliente): `Dialog` controlado con `open`, «Retirar mi pedido» `danger` y «Seguir esperando»; error adentro; al salir bien navega a `/verificar-identidad?guardado=retirado`
- [X] T025 [P] [US1] `src/components/verification/identity-status-card.tsx`: la sección «Tu identidad» de «Mi perfil» en todas las combinaciones de FR-024 (oferta, estado con «Ver mi pedido», sin teléfono, nivel 2 con su día)
- [X] T026 [US1] `src/actions/identity.ts`: `acceptIdentityConsent`, `submitIdentityRequest` y `withdrawIdentityRequest` según contracts/actions.md, con sus eventos y `revalidatePath('/mi-perfil')`
- [X] T027 [US1] `src/app/[locale]/(app)/verificar-identidad/page.tsx`, `loading.tsx` y `error.tsx`: `requireProfile`; sin nivel 1 y sin pedido ni identidad → `redirect` a la puerta (plan.md §6); con estado → `IdentityStatusView`; si puede pedir → `IdentityRequestForm` y `track('identity_request_started', { origin })`; con `?guardado=retirado` → `SavedToast`; `metadata` con `noindex`
- [X] T028 [US1] `src/app/[locale]/(app)/mi-perfil/page.tsx`: leer identidad; `IdentityStatusCard` debajo de `PhoneStatusCard`; `track('identity_offer_viewed', { origin: 'profile' })` cuando se muestra la oferta; `src/components/verification/phone-number-card.tsx` y `phone-status-texts.ts` dejan de decir "Nivel 1 desde…" en nivel 2 (FR-024)
- [X] T029 [US1] `src/app/[locale]/(app)/verificar-telefono/…` (el aviso): el texto del motivo `identity` en `VerifyHeading` y «Ahora no» a «Mi perfil»

**Punto de control**: US1 se recorre entera con los pasos 1–3 y 7 de quickstart.md.

---

## Fase 4: User Story 2 — Revisar los pedidos y dar el resultado (P2)

**Objetivo**: quien administra resuelve los pedidos; la persona recibe el correo y ve el resultado.

**Prueba independiente**: pasos 4–5 de quickstart.md; y como Ana, `/revision` es "no existe".

### Tests de US2

- [X] T030 [P] [US2] `src/lib/verification/review-state.test.ts` + `review-state.ts`: `reviewState` — con fila y vigente `open`; con fila y `expires_at <= now` `expired`; sin fila y con resolución `resolved`; sin fila, sin resolución y con `expires_at` conocido y pasado `expired`; si no, `gone`
- [X] T031 [P] [US2] `src/lib/schemas/identity.test.ts` + `identity.ts`: `identityResolutionSchema` — aprobar sin motivo pasa; aprobar con motivo no; rechazar exige uno de los cuatro motivos; un id que no es uuid no pasa
- [X] T032 [US2] `tests/db/identity.test.ts` (parte de US2): quien administra lee la cola, el perfil de quien tiene un pedido vigente, sus rechazos y las imágenes; **no** lee el perfil ni los rechazos de una cuenta sin pedido vigente, ni las imágenes de su propio pedido ni de uno vencido; anónimo y otra cuenta no leen `admins` ajenos, la cola, las resoluciones ni ninguna imagen; `resolve_identity_request` aprueba (borra pedido e imágenes, deja verificación y resolución) y rechaza (deja rechazo y resolución); resolver sin estar en `admins`, el propio, uno vencido y uno ya resuelto fallan sin cambiar nada; dos resoluciones en paralelo dejan una; un retiro y una resolución en paralelo dejan uno solo; quien sale de `admins` deja de leer la cola en la consulta siguiente; la dueña no lee `identity_resolutions`

### Implementación de US2

- [X] T033 [P] [US2] `src/lib/email/send-identity-result.ts`: `sendIdentityResult` de contracts/actions.md con la plantilla genérica y `withDeadline`; nunca lanza; el log no lleva dirección ni id
- [X] T034 [P] [US2] `src/components/verification/review-queue-list.tsx`: filas con nombre, desde cuándo espera y cuándo vence; la propia marcada y sin enlace; `EmptyState` "No hay pedidos esperando"
- [X] T035 [P] [US2] `src/components/verification/review-request-view.tsx`: datos, rechazos en ventana ("Sin rechazos en 30 días" si no hay), las dos imágenes con `img` nativo desde `/api/revision/[id]/[kind]` y su `alt`, `Skeleton` 4:3 mientras cargan, la regla de FR-015; dos columnas desde 1024
- [X] T036 [P] [US2] `src/components/verification/review-decision.tsx` (cliente): «Aprobar» (tirita, deshabilitada hasta que carguen las dos imágenes), «Rechazar…» con `Sheet` y los cuatro motivos como `Button secondary` (plan.md §Diseño); estados ocupados; navega a `next` al terminar
- [X] T037 [P] [US2] `src/components/verification/review-watcher.tsx` (cliente): cada `REVIEW_POLL_MS` llama `checkReviewRequest`; si no es `open`, desmonta los hijos (imágenes y decisión) y muestra el `EmptyState` de cerrado con el texto de FR-021 y «Volver a la lista»
- [X] T038 [P] [US2] `src/components/verification/review-queue-link.tsx`: el acceso de «Mi perfil» con la cantidad
- [X] T039 [US2] `src/actions/identity.ts`: `resolveIdentityRequest` (con `after(() => sendIdentityResult(…))` y los eventos sin visita) y `checkReviewRequest`
- [X] T040 [US2] `src/app/api/revision/[id]/[kind]/route.ts`: `GET` con `getReviewImage` y la sesión; 404 sin cuerpo si no hay fila o los parámetros no sirven; `Content-Type: image/webp`, `Cache-Control: private, no-store`
- [X] T041 [US2] `src/app/[locale]/(app)/revision/page.tsx`, `loading.tsx`, `error.tsx`, `[id]/page.tsx` y `[id]/loading.tsx`: `notFound()` si `isAdmin()` es falso; `PageShell full` desde 1024; `metadata` con `noindex`
- [X] T042 [US2] `src/app/[locale]/(app)/mi-perfil/page.tsx`: `ReviewQueueLink` si la sesión administra

**Punto de control**: pasos 4, 5 y 8 de quickstart.md.

---

## Fase 5: User Story 3 — Intentos, tope y vencimiento (P3)

**Objetivo**: el tope de 3 rechazos en 30 días y el vencimiento a los 7 días con su correo.

**Prueba independiente**: pasos 6 y 9 de quickstart.md.

### Tests de US3

- [ ] T043 [US3] `tests/db/identity.test.ts` (parte de US3): `expire_identity_requests` borra el pedido vencido y sus imágenes, deja `identity_expirations` con `notice_pending`, no toca un pedido vigente; borra rechazos y vencimientos de más de 30 días; apaga los avisos pendientes de más de 24 horas; un envío nuevo borra el vencimiento de la cuenta; quien administra no lee ni resuelve un pedido vencido aunque la tarea no haya corrido

### Implementación de US3

- [ ] T044 [US3] `src/app/api/cron/identidad/route.ts`: `POST` con `x-cron-secret` contra `CRON_SECRET` (401 sin cuerpo si no); lee los avisos pendientes, manda cada correo de vencimiento (un intento), los marca y dispara `identity_request_expired` sin visita por cada aviso, salga o no el correo; 204
- [ ] T045 [US3] `src/components/verification/identity-status-view.tsx`: los textos de `capped` (día y `SUPPORT_EMAIL` como `mailto:`), de `rejected` con los intentos que quedan (FR-027a) y de `expired`; y en `sendIdentityResult`, el tercer rechazo con el día y el correo de ayuda en lugar del enlace

**Punto de control**: pasos 6 y 9 de quickstart.md.

---

## Fase 6: User Story 4 — El nivel 2 sigue con la persona (P4)

**Objetivo**: cambiar o perder el número no borra la identidad; borrar la cuenta sí.

**Prueba independiente**: con Ana en nivel 2, empezar un cambio de número (sin verificar, "al
confirmar tu teléfono volvés a nivel 2"), confirmarlo (nivel 2); borrar una cuenta con un pedido.

### Tests de US4

- [ ] T046 [US4] `tests/db/identity.test.ts` (parte de US4): borrar la cuenta con un pedido abierto borra pedido, imágenes, verificación, rechazos, vencimiento y resoluciones de sus pedidos; borrar la cuenta de quien administra deja `resolved_by` en nulo y la verificación que aprobó intacta; cambiar o perder el número no toca `identity_verifications`

### Implementación de US4

- [ ] T047 [US4] `src/components/verification/identity-status-card.tsx` y `identity-status-view.tsx`: la variante sin teléfono con identidad verificada ("al confirmar tu teléfono volvés a nivel 2") y la de aprobado sin nivel 1; y en `sendIdentityResult` aprobado, "vas a estar en nivel 2 cuando confirmes tu teléfono" si hoy no tiene nivel 1

**Punto de control**: la prueba independiente de US4.

---

## Fase 7: Pulido y transversales

- [X] T048 `tests/e2e/identidad.spec.ts`: Ana pide (consentimiento, dos fotos de `tests/e2e/support/`), ve «En revisión»; Lucía aprueba desde la cola; Ana ve «Nivel 2» y hay un correo en `.artifacts/mail/`; mide SC-010 (consentimiento visible y tirita tocable en menos de 2,5 s con el perfil de red del producto, sin corrimiento)
- [ ] T049 [P] `docs/10-design-system.md`: los componentes nuevos de plan.md §Componentes en la tabla, con sus variantes y estados
- [ ] T050 [P] `docs/known-limitations.md`: KL de los respaldos con imágenes borradas (se revisa en M5) y KL del correo de vencimiento con la aplicación apagada (plan.md §Riesgos)
- [ ] T051 `node scripts/walk.mjs --story 11-identidad --user /mi-perfil /verificar-identidad /revision` para el design-reviewer, a 390 y 1280
- [ ] T052 `vercel:react-best-practices` sobre los TSX nuevos; `pnpm verify` en verde (Lighthouse en CI, KL-001); `pnpm mutation` al 100 % sobre los archivos con test

---

## Dependencias

- Fase 1 → Fase 2 → US1 → US2 → US3 → US4 → Pulido.
- US2 necesita pedidos de US1 para tener qué revisar; US3 usa la resolución de US2 para rechazar;
  US4 solo toca textos y cascadas sobre lo anterior.
- Dentro de cada fase, los [P] van en paralelo; las acciones (`src/actions/identity.ts`) se escriben
  en orden porque comparten archivo.

## Paralelo, por ejemplo

- Fase 2: T007–T014 son archivos distintos.
- US1: T015, T016, T017 (tests) y T019, T020, T021, T023, T024, T025 (componentes).
- US2: T030, T031 y T033–T038.

## Estrategia

MVP = Fases 1–3 (US1): el pedido existe, se ve y se retira. Después US2 lo convierte en nivel 2,
US3 cierra los límites y US4 las transiciones. `pnpm lint && pnpm typecheck && pnpm test` en cada
punto de control; `pnpm verify` al final.
