---
description: "Tareas de la historia #9 — Registro e ingreso sin contraseña con perfil básico"
---

# Tasks: Registro e ingreso sin contraseña con perfil básico

**Input**: `specs/002-registro-e-ingreso/` — spec.md (69 FR), plan.md (15 decisiones + §Diseño),
data-model.md, contracts/actions.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US5). Base y pulido no llevan etiqueta

---

## Fase 1: Base compartida

**Propósito**: lo que todas las user stories necesitan. Ninguna puede empezar antes.

- [X] T001 Instalar las cinco dependencias con `@latest`, fijadas exactas como las de F00: `@supabase/ssr` 0.12.7, `react-hook-form` 7.88.0, `zod` 4.6.5, `@hookform/resolvers` 5.9.1, `resend` 6.28.1. **Sin React Email**: está deprecado y su sucesor infla el runtime (decisión 2026-09-19)
- [X] T002 [P] Agregar el bloque «2026-09-19, F01» a `docs/07-stack.md` con una línea por dependencia y por qué, más lo que no entró (ya redactado; verificar que coincida con lo instalado)
- [X] T003 Crear la migración de `public.profiles` con `pnpm exec supabase migration new profiles`: columnas de data-model.md, `id uuid` PK con `references auth.users on delete cascade`, `display_name text` (check de 2 a 60 y de no vacío tras recortar espacios), `department text` (check contra los 19 códigos ISO 3166-2:UY), `locality text` (check hasta 60 y no vacío), `is_rescuer boolean not null default false`, `avatar_path text` nulo, `created_at`/`updated_at timestamptz not null default now()`
- [X] T004 En la misma migración, `alter table public.profiles enable row level security` y las cuatro policies de data-model.md, todas `to authenticated`, con `(select auth.uid())` envuelto, y `update` con `using` **y** `with check`
- [X] T005 [P] Crear la migración de `public.login_links`: columnas de data-model.md, incluido `expires_at = issued_at + 60 min` (FR-004), índice `(email, issued_at desc)`, `enable row level security` y **ninguna policy**
- [X] T006 [P] Crear la migración del bucket `avatars` con `public = false`, `allowed_mime_types = ['image/webp']`, `file_size_limit = 262144`, y la policy `avatars_own` sobre `storage.objects` comparando `(storage.foldername(name))[1]` con `(select auth.uid())::text`
- [X] T007 Correr `pnpm exec supabase db reset` y después `pnpm db:types` para regenerar `src/lib/supabase/types.ts` con las tablas nuevas
- [X] T008 Sumar `RESEND_API_KEY`, `SUPABASE_AUTH_GOOGLE_CLIENT_ID` y `SUPABASE_AUTH_GOOGLE_SECRET` al mapa `READERS` de `src/lib/env.ts` como opcionales (no `requireEnv`), y documentarlas en `.env.example` con dónde se saca cada una
- [X] T009 Editar `supabase/config.toml` según plan.md §Decisiones 10: `[auth.external.google]` leyendo las variables, `/auth/callback` en `additional_redirect_urls`, y dejar `[auth.rate_limit] email_sent` en un valor que no contradiga FR-006 con un comentario de que la regla real vive en el código
- [X] T010 Crear `src/lib/supabase/server.ts` y `src/lib/supabase/middleware.ts` con `@supabase/ssr` (cookies `getAll`/`setAll`), y `src/lib/supabase/service.ts` con la clave de servicio. Ninguno se importa fuera de `src/lib/supabase/`
- [X] T011 Reescribir `src/proxy.ts` para componer next-intl con el refresco de sesión, y **sacar `auth` del matcher** (plan.md §Decisiones 6). La cookie de sesión se emite con 30 días y se renueva en cada visita (FR-012, KL-005)
- [X] T012 [P] Crear `src/lib/zones/departments.ts` con los 19 departamentos y su código ISO, y `src/lib/zones/localities/` partido por fuente —`montevideo.ts` (capa de la Intendencia) e `interior.ts` (listado de OSE)—, cada archivo con su fuente y su fecha
- [X] T013 [P] Crear `src/components/ui/checkbox.tsx` sobre el `input` nativo con `appearance: none`, caja de 2 px en `--color-ink`, el tilde de `icons`, foco visible y 44 px de objetivo táctil; agregar su fila a `docs/10-design-system.md` §Componentes y su bloque a `/muestra`
- [X] T014 [P] Crear `src/lib/analytics/track.ts` con los siete eventos de FR-032, la marca de visita en cookie de sesión de navegador (FR-030c) y, por ahora, salida al registro del servidor
- [X] T015 [P] Agregar los namespaces `auth`, `profile`, `emails` y las entradas `metadata.*` de las siete rutas a `messages/es.json`

**Punto de control**: `pnpm lint && pnpm typecheck && pnpm test` en verde, con la base nueva y sin producto todavía.

---

## Fase 2: US1 — Entrar con un enlace que llega al correo (P1)

**Meta**: una persona sin cuenta escribe su correo, abre el enlace y queda adentro.

**Prueba independiente**: pedir un enlace con una dirección nueva y abrirlo: queda adentro y hay
una cuenta que antes no estaba. No necesita perfil, ni Google, ni ninguna otra user story.

### Lógica con test

- [X] T016 [P] [US1] `src/lib/schemas/auth.ts`: el schema del correo, con su test al lado (FR-002)
- [X] T017 [P] [US1] `src/lib/auth/link-status.ts` + test: decide `reemplazado | usado | vencido | desconocido` con la precedencia de FR-005a y el plazo de FR-030a
- [X] T018 [P] [US1] `src/lib/auth/request-window.ts` + test: la ventana móvil por navegador, 1 cada 60 s y 5 por hora, con los bordes de tiempo (FR-006 punto 1, FR-006b)
- [X] T019 [P] [US1] `src/lib/auth/link-request-policy.ts` + test: si se manda el correo y **qué se responde**. El test afirma que la respuesta es idéntica exista o no la cuenta y se haya pasado o no el tope mudo de 10/hora (FR-006 punto 2, FR-006a, SC-004). El tope por dirección nunca invalida un enlace ya emitido ni bloquea a la dueña (FR-006c)
- [X] T020 [P] [US1] `src/lib/auth/next-destination.ts` + test: valida el destino de vuelta y descarta lo que no sea de este sitio (FR-014); sin destino pendiente y con perfil completo, el aterrizaje es `/mi-perfil` (FR-014a). Es un redirect abierto si se hace mal
- [X] T021 [P] [US1] `src/lib/auth/stale-accounts.ts` + test: qué persona sin confirmar se puede borrar. El test afirma que una confirmada, y una sin confirmar de menos de 7 días, no se borran (plan.md §Decisiones 8)

### Base de datos y correo

- [X] T022 [US1] `src/lib/supabase/queries/login-links.ts`: `getLoginLink`, `recordLoginLink`, `supersedeLinks`, `countRecentLinks`, `purgeExpired`. Nadie hace `.from(...)` fuera de acá
- [X] T023 [US1] `tests/db/login-links.test.ts`: sin sesión y con sesión, leer la tabla devuelve cero filas; y la limpieza no toca a quien no debe (FR-030a)
- [X] T024 [US1] `src/lib/email/login-link-template.ts`: el HTML del correo con estilos en línea, sin librería. De qué sitio viene, un solo uso, vence en 60 minutos, no se comparte, y qué hacer si no lo pidió. Los textos salen de `messages/es.json` (FR-007a)
- [X] T025 [US1] `src/lib/email/resend.ts` y `src/lib/email/send-login-link.ts`: con `RESEND_API_KEY` manda de verdad; sin ella escribe el mismo mensaje en `.artifacts/mail/` (KL-006). Un envío que falla se reporta como tal y **no** consume cupo (FR-003a). Agregar `.artifacts/` a `.gitignore` si no está

### Acciones y rutas

- [X] T026 [US1] `src/actions/auth.ts` → `requestLoginLink` con los seis pasos de contracts/actions.md: manda el enlace y deja la pantalla de espera (FR-003), invalida el anterior (FR-004), nunca crea una segunda cuenta para la misma dirección (FR-007), deja la cookie `httpOnly` de vida corta con la dirección (plan.md §Decisiones 11), y devuelve `ActionResult` sin lanzar
- [X] T027 [US1] `src/actions/auth.ts` → `resendLinkFor(linkId)`: resuelve la dirección en el servidor a partir del id (FR-005b)
- [X] T028 [US1] `src/app/auth/confirm/route.ts` con los cinco pasos de contracts/actions.md: vale en cualquier navegador y, si el destino se perdió, aterriza en el perfil (FR-004a, FR-014a); el enlace de una cuenta borrada no sirve ni recrea nada (FR-007b); los dos casos de sesión abierta no consumen el enlace (FR-007c); lleva a completar el perfil o al destino validado (SC-008)

### Pantallas

- [X] T029 [US1] `src/app/[locale]/(auth)/layout.tsx` con la compuerta de la tabla de plan.md §Decisiones 9, y `AccountMenu`
- [X] T030 [US1] `src/components/auth/email-link-form.tsx` (`"use client"`, textos por props) y `src/app/[locale]/(auth)/entrar/page.tsx` según el wireframe: `Input` de renglón, la `tirita` como única acción, `metadata` con `robots: { index: false }`. **En ninguna pantalla ni acción de esta historia se pide, guarda ni valida una contraseña** (FR-001, SC-002)
- [X] T031 [US1] `src/components/auth/resend-link-button.tsx` (`"use client"`) y `src/app/[locale]/(auth)/entrar/revisa-tu-correo/page.tsx`: a qué dirección se mandó, el aviso del correo no deseado y cómo pedir otro (FR-003); la dirección leída de la cookie en el servidor, la cuenta regresiva del navegador
- [X] T032 [US1] `src/components/auth/link-problem-notice.tsx` + test (cuatro motivos, cuatro mensajes, cuatro acciones; SC-003) y `src/app/[locale]/(auth)/entrar/enlace/page.tsx`, **sin mostrar la dirección** (FR-005b)
- [X] T033 [US1] `src/app/[locale]/_components/account-menu.tsx` y su uso en los layouts de `(public)`, `(auth)` y `(app)` (FR-015a)

**Punto de control**: se puede crear una cuenta y entrar. `pnpm lint && pnpm typecheck && pnpm test` en verde.

---

## Fase 3: US2 — Completar el perfil para poder usar la cuenta (P1)

**Meta**: la persona carga nombre y zona, opcionalmente foto y la marca de rescatista, y queda lista.

**Prueba independiente**: con una cuenta recién creada, completar nombre y zona termina el alta y
deja ver el perfil con lo cargado.

### Lógica con test

- [X] T034 [P] [US2] `src/lib/schemas/profile.ts` + test: cada regla con su caso que pasa y su caso que no. Nombre de 2 a 60 (FR-020a), localidad hasta 60, espacios recortados y sin repetir, y la detección literal de vía de contacto de FR-020b con sus bordes: «Ruta 8 km 25» y «Villa 25 de Agosto» pasan; nueve dígitos seguidos, una arroba entre palabras y una dirección web no
- [X] T035 [P] [US2] `src/lib/zones/match.ts` + test: filtra sugerencias ignorando acentos y mayúsculas («cordon» encuentra «Cordón»)
- [X] T036 [P] [US2] `src/lib/profile/initials.ts` + test: una palabra, con tilde, con espacios de más
- [X] T037 [P] [US2] `src/lib/profile/avatar.ts` + test: 256 px, WebP, **sin EXIF**, con `imageOrientation: 'from-image'` para no perder la orientación (FR-024a, `docs/08` §Encontrable)

### Base de datos

- [X] T038 [US2] `src/lib/supabase/queries/profiles.ts`: `getMyProfile`, `upsertProfile`, `clearAvatarPath`, `deleteProfile`
- [X] T039 [US2] `src/lib/supabase/queries/avatars.ts`: `uploadAvatar`, `deleteAvatar`, `signAvatarUrl` con firma de 60 segundos
- [X] T040 [US2] `tests/db/profiles.test.ts`: sin sesión y con sesión ajena, leer el perfil de otra persona y su correo falla (FR-026, FR-026a, FR-026d, SC-005)
- [X] T041 [US2] `tests/db/avatars.test.ts`: la foto de otra persona no se abre sin firma ni con sesión ajena (FR-026c)
- [X] T042 [US2] `supabase/seed.sql`: las personas sembradas que F00 dejó anotadas para esta historia, con perfiles completos y una a medias

### Acciones

- [X] T043 [US2] `src/actions/profile.ts` → `saveProfile` recibiendo `FormData` con el archivo ya procesado; valida con el mismo schema, escribe por `upsertProfile`, y devuelve el destino de `next-destination` (FR-016a, FR-022a, FR-022b)

### Pantallas

- [X] T044 [P] [US2] `src/components/profile/avatar.tsx` + test: foto o iniciales según el dominio (FR-024). Cuadrado 1:1 con `--radius-card`, **nunca** `--radius-tag`
- [X] T045 [P] [US2] `src/components/profile/locality-field.tsx` (`"use client"`) con el contrato ARIA de plan.md §Componentes: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, flechas, Enter, Esc, coincidencias anunciadas, y la lista cerrada cuando ninguna coincide (FR-019a)
- [X] T046 [P] [US2] `src/components/profile/zone-fields.tsx`: departamento de lista cerrada y la **etiqueta que cambia** —«Barrio» en Montevideo, «Localidad» en los otros 18— (FR-017a, FR-018)
- [X] T047 [P] [US2] `src/components/profile/personal-data-notice.tsx`: la frase de FR-027a con sus dos mitades, el correo privado y el nombre, foto y zona que serán públicos
- [X] T048 [US2] `src/components/profile/avatar-field.tsx` (`"use client"`): elegir, procesar, previsualizar recién cuando terminó, quitar (FR-024b), y los errores de tipo, tamaño y procesado fallido (FR-025, FR-025a)
- [X] T049 [US2] `src/components/profile/profile-form.tsx` (`"use client"`, textos por props) con los cinco campos, la marca de rescatista como **una sola casilla de sí o no** y no una elección entre dos (FR-017b), el estado ocupado, el `Toast success` con el verbo del botón y el `Toast error` que conserva lo escrito
- [X] T050 [US2] `src/hooks/use-profile-draft.ts`: lo escrito y no enviado sobrevive en ese navegador; desde otro dispositivo arranca vacío (FR-021)
- [X] T051 [US2] `src/hooks/use-unsaved-changes.ts`: el aviso antes de perder cambios (FR-023)
- [X] T052 [US2] `src/app/[locale]/(auth)/completar-perfil/page.tsx` según el wireframe, con las salidas de cerrar sesión y borrar cuenta (FR-016b) y su `metadata` con `noindex`

**Punto de control**: el alta funciona de punta a punta. Es el MVP de la historia.

---

## Fase 4: US3 — Entrar con la cuenta de Google (P2)

**Meta**: entrar en dos toques, a la misma cuenta que el correo.

**Prueba independiente**: entrar con Google desde una dirección nueva y después por correo con esa
misma dirección: es la misma cuenta las dos veces.

- [X] T053 [P] [US3] `src/lib/auth/google.ts` + test: función pura que recibe las identidades y decide si **Google marcó verificada esa dirección en este ingreso** (`email_verified` de `identity_data`). El test cubre verificada, no verificada y sin identidad de Google (FR-009, FR-009a)
- [X] T054 [US3] `src/lib/auth/google.ts`: además, si el ingreso con Google está habilitado en esta instalación (FR-011), distinguiendo eso de una caída momentánea
- [X] T055 [US3] `src/app/auth/callback/route.ts`: canjea el código (FR-008), consulta la función pura con permisos de servicio y, si no está verificada, cierra la sesión en el acto y va a `/entrar` con el mensaje (FR-009a, FR-010). **No guarda nada que venga de Google salvo la dirección verificada**; el nombre solo se sugiere en el formulario y se guarda si la persona lo confirma (FR-030b). *La sugerencia del nombre no se llegó a construir; entró recién con la Fase 8 (2026-09-23).*
- [X] T056 [US3] `src/components/auth/google-button.tsx` y su uso en `/entrar`: `Button secondary`, visible solo si está habilitado

**Punto de control**: las dos puertas llevan a la misma cuenta; sin credenciales, la opción no aparece y el correo funciona igual.

---

## Fase 5: US4 — Ver, editar y cerrar sesión (P2)

**Meta**: encontrar el perfil, cambiarlo y cerrar sesión.

**Prueba independiente**: con una cuenta completa, cambiar nombre y zona, ver el cambio, cerrar
sesión y confirmar que las pantallas privadas dejan de estar disponibles.

- [X] T057 [US4] `src/app/[locale]/(app)/layout.tsx` con la compuerta de FR-013 y FR-016
- [X] T058 [P] [US4] `src/components/profile/profile-summary.tsx`: lo cargado en modo lectura, con el sello de rescatista en `--color-primary` y el bloque del correo con «Solo vos lo ves». **El correo se muestra y no se puede editar**: no hay acción de cambiarlo en ninguna pantalla (FR-022c)
- [X] T059 [US4] `src/app/[locale]/(app)/mi-perfil/page.tsx` con su `loading.tsx` y su `error.tsx`, según el wireframe (FR-022, FR-026b)
- [X] T060 [US4] `src/app/[locale]/(app)/mi-perfil/editar/page.tsx` reusando `ProfileForm` en modo edición: título, verbo del botón y «Quitar foto». Sin duplicar el formulario
- [X] T061 [US4] `src/actions/auth.ts` → `signOut`, y `src/actions/profile.ts` → `removeAvatar` (FR-015, FR-024b)

**Punto de control**: la cuenta se puede usar y abandonar.

---

## Fase 6: US5 — Borrar mi cuenta (P3)

**Meta**: irse y no dejar nada.

**Prueba independiente**: borrar la cuenta, confirmar que la sesión se cerró y que entrar de nuevo
con el mismo correo da una cuenta vacía.

- [X] T062 [US5] `src/actions/profile.ts` → `deleteAccount` en el orden de contracts/actions.md, con cada paso tolerando estar ya hecho, y sin confirmar hasta terminar el último (FR-028a, FR-028b). Borra también las sesiones de otros dispositivos (FR-028) y deja la dirección libre para un alta nueva y vacía (FR-029, SC-007)
- [X] T063 [US5] `src/components/profile/delete-account-dialog.tsx` (`"use client"`): `Dialog` con lo que se borra, que no se puede deshacer, el estado ocupado y la cancelación que vuelve intacta (FR-027)
- [X] T064 [US5] `src/app/[locale]/(auth)/cuenta-borrada/page.tsx`: `EmptyState` con «Listo, no queda nada tuyo» y «Crear otra cuenta», más el `Button ghost` «Volver al inicio» fuera de la primitiva (FR-028c)

**Punto de control**: la historia está completa.

---

## Fase 7: Pulido y cierre

- [X] T065 `tests/e2e/alta.spec.ts`: pedir enlace → leer el enlace de `.artifacts/mail/` → abrirlo → completar perfil → verlo → cerrar sesión. Afirma los cuatro eventos de medición que atraviesa (FR-032a), que el alta entra en cuatro pasos (SC-001), y demuestra que `/auth/confirm` responde fuera del segmento de idioma
- [X] T066 `scripts/walk.mjs`: agregar `--user` para capturar las pantallas con sesión
- [X] T067 Correr `node scripts/walk.mjs --story 002-registro-e-ingreso` con y sin `--user` y revisar las capturas a 390 px contra `docs/10`
- [X] T068 `pnpm mutation` sobre lo tocado: 100 %, con los mutantes equivalentes o no compilables anotados en su línea con el motivo
- [X] T069 Medir el bundle inicial contra los 150 KB. El presupuesto lo verifica `pnpm lighthouse` (`resource-summary:script:size`, 153600 bytes) contra el build de producción; en Windows esa etapa no termina por KL-001, así que el número lo da CI. La lista de localidades entera son ~520 cadenas y viaja con la pantalla, como decidió §Decisiones 12
- [X] T070 [P] Verificar que `docs/07-stack.md`, `docs/known-limitations.md` (KL-005, KL-006, KL-007), `docs/06-i18n.md` y `docs/03-mvp-features.md` quedaron con lo decidido en esta corrida
- [X] T071 Revisar el diff completo contra FR-031: **que no haya aparecido** ningún sistema de permisos, de roles ni compuerta de teléfono verificado. Es un requisito de no construir, así que solo se verifica mirando lo construido
- [X] T072 Recorrer con sesión viva y sin sesión que desde cualquier pantalla se llega a entrar o a «Mi perfil» (FR-015a), y que volver dentro de los 30 días no pide ingresar de nuevo (SC-006)
- [X] T073 `pnpm verify` completo antes de abrir el PR: lint, typecheck, test, mutation, build y e2e en verde; lighthouse corta en Windows por KL-001 y se verifica en CI

---

## Fase 8: Datos de Google en el alta (2026-09-23, PR #27)

**Objetivo**: quien entra con Google encuentra su nombre escrito y su foto de Google ofrecida, nunca puesta (FR-030b reescrito, US3-AS6, decisión «Datos de Google en el alta»).

- [X] T074 [US3] `src/lib/auth/google.ts` + test: `profileSuggestionFrom`, función pura que lee `identity_data` de la identidad de Google —no `user_metadata`—, sugiere el nombre solo si el schema del formulario lo acepta, y pide la foto a 256 px. Stryker al 100 % (US3-AS6, FR-030b)
- [X] T075 [US3] `/completar-perfil`: lee el perfil y las identidades en paralelo, llega con el nombre escrito y con la ayuda «Lo trajimos de tu cuenta de Google» mientras siga siendo ese (FR-030b)
- [X] T076 [US3] `PhotoSuggestion` en `AvatarField`: la foto se baja en el navegador **sin referrer** (Google responde 429 con él) y pasa por el mismo procesado que una del teléfono; `Skeleton` mientras carga la foto chica, sin propuesta si no carga, foco a «Cambiar foto» o de vuelta a «Usar esta foto» (FR-030b, FR-024a)
- [X] T077 `use-profile-draft`: un formulario sin tocar no es borrador, un campo vacío del borrador no pisa lo que trae la pantalla, y cerrar sesión o borrar la cuenta lo borran (`SignOutForm`) (FR-021, FR-028c)
- [X] T078 `ui/select.tsx`: ignora el valor vacío que avisa el select oculto de Radix cuando el valor llega antes que las opciones; restaurar un borrador perdía el departamento y la localidad (FR-021)
- [X] T079 [P] FR-030b, US3-AS6 y la decisión en `spec.md`; `PhotoSuggestion` y `AccountActions` en `docs/10`; KL-022 y KL-023 en `docs/known-limitations.md`; `docs/03`
- [X] T080 `pnpm verify` en local (lighthouse por KL-001 en CI), `code-reviewer` y `design-reviewer`, y el recorrido de los estados a 390 y 1280

---

## Dependencias

- **Fase 1 bloquea todo.** Nada de producto antes de que la base, los tipos y el proxy estén.
- **US1 antes que US2**: no hay perfil que completar sin una sesión.
- **US3, US4 y US5 dependen de US1 + US2**, y entre ellas son independientes.
- Dentro de cada fase, lo marcado `[P]` toca archivos distintos y puede ir junto.

## Estrategia

El MVP de la historia son **US1 + US2**: con eso una persona ya tiene cuenta y perfil, que es lo
que desbloquea todo M1. US3 acorta el embudo, US4 lo hace usable en el tiempo y US5 es la
obligación con la persona y con la ley. Si algo hubiera que dejar para un seguimiento, el orden de
sacrificio es el inverso al de las fases; pero las cinco entran en esta historia.
