---
description: "Tareas de la historia #10 — Verificación de teléfono para poder publicar y solicitar"
---

# Tasks: Verificación de teléfono para poder publicar y solicitar

**Input**: `specs/003-verificacion-de-telefono/` — spec.md, plan.md (§Diseño + 12 decisiones),
data-model.md, contracts/actions.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base compartida

**Propósito**: lo que las tres user stories necesitan. Ninguna puede empezar antes. **Sin
dependencias nuevas** (plan.md §Technical Context).

- [X] T001 Crear la migración con `pnpm exec supabase migration new phones`: la tabla `public.phones` de data-model.md —`user_id uuid` PK `references auth.users (id) on delete cascade`; `verified_number text unique`, `verified_at timestamptz`, `pending_number text`, `pending_since timestamptz`, `updated_at timestamptz not null default now()` con el trigger `touch_updated_at()` que ya existe—; checks: "`verified_number` y `verified_at` son nulos juntos; `pending_number` y `pending_since` también", los dos números `~ '^\+5989[1-9][0-9]{6}$'`, y `pending_number <> verified_number`. RLS habilitada con **una sola** policy `phones_select_own` (`to authenticated using ((select auth.uid()) = user_id)`); `revoke all` a `anon` y `authenticated` y `grant select` solo a `authenticated`
- [X] T002 En la misma migración, `public.phone_number_sends` —`id bigint generated always as identity` PK, `number_digest integer not null`, `sent_at timestamptz not null default now()`, `skipped boolean not null default false`, **sin columna de cuenta** (FR-021)— con índices `(number_digest, sent_at desc)` y `(sent_at)`; RLS habilitada, **cero policies**, `revoke all` a `anon` y `authenticated`
- [X] T003 En la misma migración, `public.phone_codes` —`id uuid` PK, `user_id uuid not null references auth.users (id) on delete cascade`, `number text` **nulo** con el check E.164, `code_digest text` nulo, `requested_at timestamptz not null default now()`, `expires_at timestamptz not null`, `superseded_at`, `consumed_at`, `failed_attempts smallint not null default 0` con check `>= 0` (el 5 no se repite en la base), `delivery text not null` con el check **nombrado** `phone_codes_delivery_valid` en `sending | sent | failed | rejected | skipped_rate_limit`, `number_send_id bigint references phone_number_sends (id) on delete set null`— con índices `(user_id, requested_at desc)` y `(number_send_id)`; RLS habilitada, **cero policies**, `revoke all` a `anon` y `authenticated`
- [X] T004 En la misma migración, las seis funciones de data-model.md §Funciones —`next_phone_code_at`, `reserve_phone_code`, `settle_phone_code`, `check_phone_code`, `cancel_pending_phone`, `purge_phone_records`—, todas `security invoker`, `set search_path = ''`, con los números de las reglas **como parámetros**; `reserve`, `settle`, `check` y `cancel` con `pg_advisory_xact_lock(hashtextextended('phone-user:' || user_id, 0))`, y `reserve` además con el candado global `'phone-sends'` **después**; `revoke execute ... from public, anon, authenticated` y `grant execute ... to service_role` en cada una. Seguir el orden exacto de chequeos de `reserve` (mismo número → `next_phone_code_at` → tope por número mudo que **genera un código vivo** → envío), `settle` que no revive un número a medias cancelado ni lo iguala al verificado, `check` con `window` y el `unique_violation` atrapado, `cancel` que también reemplaza los pedidos en `sending`, y `number = null` apenas un código deja de estar vivo
- [X] T005 Correr `pnpm exec supabase db reset` y `pnpm db:types` para regenerar `src/lib/supabase/types.ts`
- [X] T006 [P] `src/lib/verification/rules.ts`: los números de la spec como constantes con nombre —10 minutos, 5 intentos, 60 segundos, 5 por cuenta, 10 por número, 200 del sitio, 24 horas de ventana, 7 días del número a medias, la zona `'America/Montevideo'`—, única fuente
- [X] T007 [P] `src/lib/verification/phone-number.ts` + test: `toE164` desde cada forma de FR-001 (con y sin cero; `598`, `+598`, `00598`, `+598 0…`; espacios, puntos, guiones, paréntesis) y `formatPhoneNumber` de E.164 a `099 123 456` (FR-003)
- [X] T008 [P] `src/lib/schemas/phone.ts` + test: `phoneNumberSchema` con los rechazos de FR-002 y su clave (`number_empty`, `number_format`, `number_landline` para 2 y 4, `number_foreign`) y `phoneCodeSchema` que ignora espacios y guiones y exige seis dígitos (FR-007b). El mismo schema en el formulario y en la acción
- [X] T009 [P] `src/lib/verification/code.ts` + test: `generateCode(random = randomInt)` de seis dígitos con ceros adelante; `codeDigest(userId, code)` y `numberGroup(e164)` con claves `HKDF-SHA256(SUPABASE_SERVICE_ROLE_KEY, info)` y etiquetas `phone-code` / `phone-number`; el grupo son **los primeros 15 bits** como entero. El test fija vectores conocidos (clave, cuenta, código → HMAC exacto; número → grupo exacto) y que la etiqueta cambia la clave
- [X] T010 [P] `src/lib/verification/retry-at.ts` + test: de un instante y "ahora" a `RetryDisplay` (`now` · `seconds` por debajo de dos minutos · `at` con `today | tomorrow | weekday`, la hora y `seconds` siempre), con la zona **pasada explícita**; el test cubre la medianoche de Uruguay corriendo en otra zona
- [X] T011 [P] `src/lib/i18n/plural.ts` + test: `inAttempts` con el mismo patrón que `inSeconds` (uno y varios)
- [X] T012 [P] `src/lib/sms/segments.ts` + test: si un texto entra en un solo mensaje (GSM-7 con los extendidos que valen dos, 160; si no, UCS-2 y 70); el test renderiza **el texto real** de `verification.sms.body` de `messages/es.json` con un nombre de sitio de 20 caracteres y un código, y afirma un segmento
- [X] T013 [P] `src/lib/sms/transport.ts` + test: `twilio` solo con las tres variables; con una o dos, nunca `twilio`; sin las tres y con la base en `127.0.0.1` o `localhost`, `outbox`; si no, `none` (FR-009c)
- [X] T014 [P] `src/lib/sms/twilio-outcome.ts` + test: 21211, 21614, 21610, 21612 → `rejected`; **21408** y cualquier otro código, un 5xx o una red caída → `failed`
- [X] T015 `src/lib/sms/send-sms.ts`: según `transport` —`fetch` a `https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json` form-encoded con `To`, `MessagingServiceSid` y `Body`, autenticación básica; `outbox` a `.artifacts/sms/<fecha>.json` con `to` y `body`; `none` como falla— y devuelve `sent | rejected | failed`
- [X] T016 [P] Sumar `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_MESSAGING_SERVICE_SID` a `READERS` de `src/lib/env.ts` como opcionales, y a `.env.example` con dónde se saca cada una y que rotar la clave de servicio invalida los códigos vivos y resetea los conteos
- [X] T017 [P] `scripts/service-key/matchers.mjs` + su test: `TWILIO_AUTH_TOKEN` en `PRIVATE_NAMES`, y `AUTH_TOKEN` en el patrón de nombres que no pueden llevar `NEXT_PUBLIC_`
- [X] T018 [P] `tests/gates/phone-sign-in.test.ts` con `tests/gates/fixtures/phone-sign-in/{good,bad}/config.toml`: falla si `[auth.sms] enable_signup`, algún `[auth.sms.*] enabled` o `[auth.mfa.phone]` se encienden (FR-009d), demostrado con el fixture malo
- [X] T019 [P] `src/actions/result.ts`: `ActionResult<T, D = never>` con `detail?: D`; las acciones de la #9 no cambian
- [X] T020 [P] `src/lib/i18n/request.ts`: `timeZone: 'America/Montevideo'` (plan.md §Decisiones 8)
- [X] T021 [P] `src/lib/analytics/events.ts`: los siete eventos de plan.md §10 (`phone_code_requested`, `phone_code_cap_reached`, `phone_site_cap_reached`, `phone_verified`, `phone_changed`, `phone_code_failed`, `phone_number_in_use`)
- [X] T022 [P] `messages/es.json`: namespace `verification` (pantallas, errores de contracts/actions.md, `verification.code.resent`, avisos, `verification.sms.body` **sin á, í, ó ni ú**) y `metadata.verify_phone` / `metadata.phone_code`; `profile.delete.body` suma el teléfono (FR-020a)
- [X] T023 [P] `src/hooks/use-countdown.ts` y `src/components/auth/resend-link-button.tsx` pasa a usarlo, sin cambiar su conducta
- [X] T024 [P] `src/components/verification/next-code-hint.tsx` (`"use client"`): "Podés pedir otro en N s" o "…mañana a las H" desde un `RetryDisplay`, fuera del botón y sin `aria-live`; `ResendLinkButton` pasa a usarlo
- [X] T025 [P] `supabase/seed.sql`: Marta (perfil completo, sin teléfono), el teléfono verificado de Ana (`+59899123456`, 2026-09-20) y el número a medias de Lucía (`+59898765432`) **sin código**

**Punto de control**: `pnpm lint && pnpm typecheck && pnpm test` en verde.

---

## Fase 2: US1 — Verificar el teléfono con un código (P1) 🎯 MVP

**Meta**: una persona con perfil completo escribe su celular, recibe el código y queda en nivel 1.

**Prueba independiente**: desde «Mi perfil», con Marta, pedir el código, escribir el que está en
`.artifacts/sms/` y ver el teléfono verificado con su fecha.

### Lógica con test

- [X] T026 [P] [US1] `src/lib/verification/phone-status.ts` + test: de la fila de `phones` y "ahora" a `PhoneStatus` (`none` · `pending` · `pending_change` con el anterior · `verified` con su fecha) y `isLevelOne`; a medias de más de 7 días cuenta como descartado (vuelve el anterior); un cambio a medias no es nivel 1
- [X] T027 [P] [US1] `src/lib/verification/request-outcome.ts` + test: de la decisión de `reserve` y el resultado de `settle` al `ActionResult` y a los eventos. **`send` y `skip` dan el mismo resultado** (FR-006a, FR-011); `rejected` → `number_unreachable`; `failed` → `send_failed`; `settle` que falla después del envío → `request_unknown`; `same_number`, `wait`, `daily_cap`, `site_cap` con su `RetryDisplay`; `phone_code_cap_reached` solo si terminó contando (un quinto `failed` no dispara) y `phone_site_cap_reached` solo con `sent` o `skip`
- [X] T028 [P] [US1] `src/lib/verification/code-check.ts` + test: de los hechos de `check` al resultado con la precedencia reemplazado → agotado → vencido → equivocado; `attemptsLeft`; el número del último en "reemplazado"; `no_pending`; "número en uso" con y sin `continueTo`; `clearInput` (sí después de un código que no sirvió, no después de `check_failed`); los eventos, sin `phone_code_failed` en `code_format`, `check_failed`, `no_pending` ni `number_in_use`
- [X] T029 [P] [US1] `src/lib/verification/gate.ts` + test (primera parte): `verifiedDestination(next)` (`next` válido o `/mi-perfil?guardado=telefono`), `cancelReturnPath(from, ok)` con `guardado=cancelado` o `error=cancelar` sobre una ruta que puede tener consulta, `codePath(gate)` y `codeScreen(status, gate)` (sin número a medias → `/verificar-telefono` con los parámetros, o `next` si ya está verificada)
- [X] T030 [P] [US1] `src/lib/verification/notice.ts` + test: `screenNotice(marca, status)` → clave, variante y número: teléfono verificado; cancelado con número que sigue verificado y sin él; error de cancelar con variante `error`; y las dos marcas de la #9 (`guardado=perfil`, `guardado=cambios`)

### Base

- [X] T031 [US1] `src/lib/supabase/queries/phones.ts` (`getMyPhone`, con el cliente de la sesión y RLS) y `src/lib/supabase/queries/phone-codes.ts` (`nextPhoneCodeAt`, `reserve`, `settle`, `check`, `cancel`, `purge`, con permisos de servicio y las reglas de `rules.ts`), que devuelven `null` o un resultado en vez de lanzar
- [X] T032 [US1] `tests/db/phones.test.ts`, en serie y con reglas chicas: lo que **no se ve** (teléfono ajeno sin sesión y con otra; `phone_codes` y `phone_number_sends` ni para la dueña); lo que **no se puede** (FR-019d: insertar, cambiar ni borrar en las tres tablas con sesión; las seis funciones ni con sesión ni sin ella); y las reglas (espera, tope de la cuenta, tope por número entre dos cuentas y mudo, techo que cuenta los `skip`, mismo número, `skip` da "equivocado" al confirmar, veinte pedidos en paralelo dan un envío, cinco intentos en paralelo no dan un sexto, dos cuentas con el mismo número dan una verificada, `settle` después de cancelar no revive, cancelar devuelve el anterior con su fecha, **durante un cambio a medias ninguna otra cuenta puede verificar el número anterior** (FR-017a), **pedir un código para un tercer número reemplaza al que estaba a medias** (FR-017d), en uso descarta el número a medias, borrar la persona borra lo suyo y deja el conteo). Vacía `phone_number_sends` con servicio antes y después de cada prueba de topes, y usa números al azar

### Acciones y pantallas

- [X] T033 [US1] `src/actions/phone.ts`: `requestPhoneCode`, `resendPhoneCode`, `confirmPhoneCode` y `cancelPendingPhone` según contracts/actions.md. Sesión con `getSessionUser()` y **ese** `user.id`; `purge` → `reserve` → mensaje con el texto de `verification.sms.body` → `settle`; lo que devuelven y los eventos que se disparan salen de `request-outcome.ts` y `code-check.ts`; `confirmPhoneCode` **no revalida** con `number_in_use`
- [X] T034 [P] [US1] `app/[locale]/_components/verification-texts.ts`: los objetos `texts` tipados de `PhoneNumberForm`, `PhoneCodeForm` y `NextCodeHint`, con sus plantillas y formas de plural (plan.md §5b)
- [X] T035 [P] [US1] `src/components/verification/phone-privacy-notice.tsx` (las dos mitades de FR-004, yerba solo en la privada), `verified-phone.tsx` (número, sello «Verificado», "Nivel 1 desde…") y `pending-phone-notice.tsx` (número, sello «Sin confirmar», "tu cuenta está sin verificar", y en un cambio "si cancelás, vuelve el…")
- [X] T036 [P] [US1] `src/components/verification/phone-number-form.tsx` (`"use client"`): renglón `inputMode="tel"`, errores de la tabla del contrato bajo el renglón con el foco en el campo, `isPrimary` (tirita o `secondary`), valor inicial, botón deshabilitado con `NextCodeHint` cuando FR-010a lo frena, y el rechazo de la promesa → `request_unknown` + `router.refresh()`
- [X] T037 [P] [US1] `src/components/verification/phone-code-form.tsx` (`"use client"`): un solo `input` `inputMode="numeric"` `autocomplete="one-time-code"` a `--text-2xl` con `tabular-nums`, la tirita «Verificar», la nota «¿No llegó?», el reenvío con `NextCodeHint` que vacía el renglón y muestra `verification.code.resent` (FR-007d), `clearInput` según el resultado, y el rechazo de la promesa → `check_failed` conservando lo escrito
- [X] T038 [P] [US1] `src/components/verification/cancel-pending-button.tsx` (`"use client"`, `useFormStatus`), dentro de un `<form action={cancelPendingPhone}>` con el campo oculto `from`
- [X] T039 [US1] `src/components/verification/verify-phone-screen.tsx` y `code-entry-screen.tsx` (servidor): las pantallas enteras de plan.md §Diseño a partir de `PhoneStatus`, sin la puerta todavía
- [X] T040 [US1] `app/[locale]/(app)/verificar-telefono/page.tsx` con `requireProfile` de su propia URL, `generateMetadata` con `robots: { index: false, follow: false }` y `PhoneNotice` (de T042, que va antes); `loading.tsx` con la forma de la tarjeta y del renglón; `error.tsx` con `ErrorScreen` y las dos claves que suma `ErrorTextsProvider`
- [X] T041 [US1] `app/[locale]/(app)/verificar-telefono/codigo/page.tsx` con `codeScreen` y `CodeEntryScreen`, y su `loading.tsx` con la forma de esa pantalla
- [X] T042 [US1] `app/[locale]/(app)/_components/phone-notice.tsx` con `screenNotice` y `SavedToast`; `src/components/profile/saved-toast.tsx` con variante `error` y que limpia también la marca `error`
- [X] T043 [US1] `src/components/verification/phone-status-card.tsx` y `app/[locale]/(app)/mi-perfil/page.tsx`: la sección entre `ProfileSummary` y la tirita, y `PhoneNotice` en lugar del ternario; `mi-perfil/loading.tsx` suma el recuadro de la sección

**Punto de control**: el paso 1, 3, 4 y 6 de quickstart.md funcionan; `pnpm lint && pnpm typecheck && pnpm test` en verde.

---

## Fase 3: US2 — La puerta de publicar y solicitar (P2)

**Meta**: el aviso de verificación pendiente, la compuerta para M2 y M3, y la vuelta a la acción.

**Prueba independiente**: sin sesión, abrir `/verificar-telefono?para=publicar&next=/mi-perfil/editar`,
ingresar, completar el perfil, verificar y llegar a `/mi-perfil/editar`.

- [X] T044 [P] [US2] `src/lib/verification/gate.ts` + test (segunda parte): `gatePath({ reason, next, from })`, `parseGateReason` (`para` desconocido se ignora), `notNowDestination(desde)` (`desde` válido o `/`), `gateCheck(status, …)` (pasa o manda al aviso) y `gateScreen(status, gate)` (nivel 1 y `para` → `next`, también después de cancelar un cambio; nivel 1, `para` y sin `next` válido → `desde` o `/mi-perfil` sin marca)
- [X] T045 [P] [US2] `src/lib/auth/require-verified-phone.ts`: `requireVerifiedPhone({ path, reason, from })` para páginas y `checkVerifiedPhone({ path, reason, from })` para acciones, las dos sobre `gateCheck`
- [X] T046 [P] [US2] `src/components/verification/gate-notice.tsx` (el `h1` y la frase por acción) y `not-now-link.tsx`
- [X] T047 [US2] `VerifyPhoneScreen` y `CodeEntryScreen` con la puerta: `GateNotice` como encabezado, la frase "es para publicar un animal" en el código, «Ahora no» al pie, y `para`, `next` y `desde` en todos los enlaces y en `from` de cancelar; `/verificar-telefono/page.tsx` ejecuta `gateScreen`
- [X] T048 [P] [US2] `tests/e2e/support/mailbox.ts` (leer correos y mensajes del disco por destinatario; `alta.spec.ts` pasa a usarlo) y `tests/e2e/support/web-vitals.ts` (LCP y CLS con `PerformanceObserver`, red 4G y CPU ×4 por CDP)
- [X] T049 [US2] `tests/e2e/telefono.spec.ts`: el flujo de SC-007 **empezando sin sesión** con un número único de la corrida, y SC-008 medido en `/verificar-telefono` y `/verificar-telefono/codigo` (LCP < 2,5 s, CLS < 0,05); `playwright.config.ts` pone las tres variables de Twilio vacías en el servidor de prueba

**Punto de control**: paso 2 de quickstart.md; `pnpm e2e` en verde.

---

## Fase 4: US3 — Cambiar el número (P3)

**Meta**: cambiar el número verificado, con la cuenta sin verificar mientras tanto y cancelar que
devuelve el anterior.

**Prueba independiente**: con Ana, pedir un código para otro número, ver «Sin confirmar» y "si
cancelás, vuelve el 099 123 456", confirmar el nuevo y ver la fecha nueva; y en otra pasada,
cancelar y ver el anterior con su fecha original.

- [X] T050 [US3] `VerifyPhoneScreen` en la variante verificada: `VerifiedPhone`, «Cambiar el número» con la advertencia de FR-016, `PhoneNumberForm` como tirita y `PhonePrivacyNotice`; `same_number` bajo el renglón (FR-017c)
- [X] T051 [US3] `PhoneStatusCard` y `PendingPhoneNotice` en la variante de cambio a medias: el anterior solo como "si cancelás, vuelve el…", nunca "verificado desde" (FR-018); `screenNotice` con "Cancelaste el cambio: tu número sigue siendo…"
- [ ] T052 [US3] Recorrer los pasos 5 y 6 de quickstart.md con Ana y Marta, y confirmar que `phone_changed` y `phone_number_in_use` salen en el registro del servidor

**Punto de control**: pasos 5 y 6 de quickstart.md.

---

## Fase 5: Pulido

- [X] T053 [P] `docs/07-stack.md`: las tres menciones del OTP pasan a Twilio Messaging con el código del producto, **Decisión (2026-09-22)** con la tabla de plan.md §Decisiones 1; §Estructura: la verificación en `(app)`; §Riesgos: permisos por país y protección contra el bombeo en Twilio, y el check de FR-009d para la nube, para M5
- [X] T054 [P] `docs/10-design-system.md`: los doce componentes de `verification` y `PhoneNotice` en la tabla con sus variantes, `SavedToast` con la variante `error`, `ErrorTextsProvider` con seis claves, y **Decisión (2026-09-22)**: el estado del teléfono es un sello y la chapita espera a la #12
- [X] T055 [P] `docs/06-i18n.md`: `verification.sms` como convención y el glosario (número a medias, nivel 1, distintivo)
- [X] T056 [P] `docs/known-limitations.md`: las entradas de plan.md §Documentación, cada una con su detección y su condición de reapertura; el remedio de FR-011a con `scripts/phone-group.mjs`
- [X] T057 [P] `scripts/phone-group.mjs`: dado un número, imprime su grupo con la clave derivada, para el remedio manual de FR-011a
- [ ] T058 Cargar `vercel:react-best-practices` sobre los TSX nuevos y corregir lo que corresponda
- [ ] T059 Capturas con `node scripts/walk.mjs` para las tres personas sembradas y las rutas de quickstart.md §Capturas, a 390 y 1280
- [ ] T060 `pnpm mutation` al 100 % sobre los archivos con test tocados, con las excepciones anotadas en su línea si aparecen
- [ ] T061 `pnpm verify` completo en verde (Lighthouse queda para CI por KL-001)

---

## Dependencias

- **Fase 1** bloquea todo. Dentro: T001–T004 antes de T005; T005 antes de T031. El resto de la
  fase es paralelo.
- **US1** (Fase 2) es el MVP y no depende de las otras. Dentro: T031 antes de T033; T042 antes de T040 y T043. **US2** usa las pantallas de US1 (T039–T041).
  **US3** usa las pantallas y la base de US1; no depende de US2.
- **Pulido** al final; T059 necesita las tres user stories.

## Paralelo

- Fase 1: T006–T014, T016–T025 en paralelo, una vez escrita la migración.
- US1: T026–T030 juntos (lógica pura); después T034–T038 juntos (hojas y componentes).
- US2: T044–T046 y T048 juntos.
- Pulido: T053–T057 juntos.

## Estrategia

MVP = Fase 1 + US1: con eso una persona se verifica y el nivel 1 existe. US2 deja la puerta lista
para M2 y M3. US3 cierra el cambio de número. Cada fase termina con su punto de control en verde
antes de seguir.
