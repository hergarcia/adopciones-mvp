---
description: "Tareas de la historia #265 — Que me avisen por correo cuando se publique un animal como el que busco"
---

# Tasks: Que me avisen por correo cuando se publique un animal como el que busco

**Input**: `specs/032-avisen-correo-animal-busco/` — spec.md, plan.md (§Diseño, §Cómo se construye),
research.md (R1–R14), data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: sí, y solo los de research R14; no se agrega ninguno fuera de ahí ni se saca ninguno de
ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se carga
`frontend-design:frontend-design` y se abre `docs/10-design-system.md`; antes de tocar la migración o
sus tests, `supabase:supabase-postgres-best-practices`; para la sesión en la vuelta de entrar,
`supabase:supabase`; todo texto visible, con `sin-slop`; después de varios TSX,
`vercel:react-best-practices`. La migración es un solo archivo; después de cada cambio,
`pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: lo que se guarda, la marca de primera aparición, las funciones de la base y las
reglas puras que usan las tres historias.

- [X] T001 Crear `supabase/migrations/20261102120000_pet_alerts.sql`: `first_listed_at` en `public.pets` y `public.litters` con su backfill (`published_at`) y sus índices parciales; `private.age_band_range(text)`; `private.stamp_first_listed()` con las condiciones de `listed_pets` (animal suelto y camada, con portada, `pet_is_listed`, `litter_is_shown`, `litter_state`); `cron.alter_job` del trabajo `pet-lifecycle` para llamar primero a la marca (data-model.md §Columnas, §Funciones; research R1)
- [X] T002 En la misma migración: las tablas `public.pet_alerts` (con sus `check`, el índice único de filtros y el de dueña), `public.pet_alert_sends` y `public.pet_alert_unsubscribe_links`, con `on delete cascade`; RLS: `pet_alerts_select_own` y `pet_alerts_delete_own`, las otras dos sin políticas; `revoke`/`grant` como dice data-model.md; `comment on table` en las tres (research R2, R6, R13)
- [X] T003 En la misma migración: `public.create_pet_alert(...)` (normaliza, `pg_advisory_xact_lock` por cuenta, marca apariciones, `created`/`duplicate`/`limit`; sin sesión, excepción), `public.claim_pet_alert_mail()` (purga envíos de 7 días y enlaces de 180, marca apariciones, reclama por `pet_alert_sends`, avanza `covered_until` de suspendidas y de quien no tiene nada, devuelve las coincidencias por aviso pasando por `listed_pets` y sacando lo propio y los bloqueos en las dos direcciones), `public.mark_pet_alerts_mailed`, `public.create_pet_alert_unsubscribe_link`, `public.pet_alert_unsubscribe_link_exists`, `public.unsubscribe_pet_alerts`; `security definer`, `set search_path = ''`; `execute` de `create_pet_alert` a `authenticated` y el resto solo a `service_role` (data-model.md §Funciones; research R2, R3, R6, R9)
- [X] T004 `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T005 [P] Extraer `newLinkToken`, `hashLinkToken`, `isLinkToken` a `src/lib/links/link-token.ts` y mover sus pruebas a `src/lib/links/link-token.test.ts`; `src/lib/pets/renewal-token.ts` los reusa sin cambiar su contrato (research R6)
- [X] T006 [P] `src/lib/alerts/types.ts` y `src/lib/alerts/rules.ts` (`ALERTS_MAX`, `ALERT_PART_MAX`, `ALERT_LINK_DAYS`) y `src/lib/alerts/paths.ts` (`MY_ALERTS_PATH`, `unsubscribePath`, `ALERT_PARAM`) (data-model.md §Tipos)
- [X] T007 [P] `src/lib/pets/listing-query.ts`: exportar la regla de juntar «todas» = «ninguna» para reusarla, y una función que separa `avisar` de la consulta antes de comparar con la canónica (research R8, R9)
- [X] T008 [P] `tests/db/pet-alerts-support.ts`: sobre los soportes de `lifecycle-support.ts` y de moderación, sembrar personas, animales sueltos y camadas en cada estado, bloqueos, una suspensión, mover `first_listed_at` y `covered_until` en el tiempo, y correr `claim_pet_alert_mail` con el cliente de servicio

**Checkpoint**: la base guarda, marca y reclama bien sin ninguna pantalla.

---

## Fase 2: User Story 1 — Guardar lo que busco desde el listado y verlo en «Mis avisos» (P1) 🎯 MVP

**Goal**: desde el listado, con o sin sesión, se crea un aviso con los filtros de ese momento (hasta
3, sin repetidos); «Mis avisos» los muestra en palabras, con su enlace y «Borrar».

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T009 [P] [US1] `src/lib/alerts/filters.test.ts`: `normalizeAlertFilters` (orden, repetidos, todas = ninguna, un solo departamento, castrado) y `countFilters` (0 a 6)
- [X] T010 [P] [US1] `src/lib/schemas/pet-alert.test.ts`: filtros válidos, vacío, valores desconocidos, una propiedad de más, `fromEmpty` no booleano
- [X] T011 [P] [US1] `src/lib/alerts/alert-name.test.ts`: sin filtros («Todos los animales en adopción»), una especie, sin especie con sexo, solo hembras en femenino, tamaños y tramos unidos con «o», castrados, departamento, todo junto («Perros chicos o medianos en Montevideo»)
- [X] T012 [P] [US1] `src/lib/analytics/alert-events.test.ts` (creación y borrado desde el perfil): `filters` y `from_empty`, `origin`, sin id, sin filtros elegidos ni día
- [X] T013 [P] [US1] `tests/db/pet-alerts-privacy.test.ts`: un visitante, otra persona y quien administra no leen ni borran avisos ajenos; la dueña lee y borra los suyos y no puede insertar ni actualizar directo; nadie con sesión lee `pet_alert_sends` ni `pet_alert_unsubscribe_links` ni llama a las funciones de servicio; borrar la cuenta borra avisos, envíos y enlaces (SC-004)
- [X] T014 [P] [US1] `tests/db/pet-alerts-rules.test.ts`: crear devuelve `created`; los mismos filtros en otro orden, `duplicate`; el cuarto, `limit`; dos `create_pet_alert` a la vez con 2 avisos dejan 3; dos pedidos iguales a la vez dejan uno; sin sesión, error; `stamp_first_listed` marca exactamente lo que devuelve `listed_pets` sin filtros y no cambia la marca al pausar, reanudar, renovar ni editar; lo que se ve al crear el aviso queda con marca `<= created_at`; `age_band_range` coincide con `AGE_BANDS`; el vocabulario de los `check` coincide con `options.ts` y los departamentos
- [X] T015 [US1] `tests/e2e/avisos.spec.ts` (primera parte): sin sesión, `/animales` filtrado sin resultados → «Avisame cuando haya uno así» → entrar con el enlace de `.artifacts/mail/` → vuelve al mismo listado con la confirmación → otra vez, «ya lo tenés» → «Mis avisos» con el nombre en palabras → «Borrar» → vacío

### Implementación de US1

- [X] T016 [P] [US1] `src/lib/alerts/filters.ts` y `src/lib/schemas/pet-alert.ts` (contracts §createPetAlert)
- [X] T017 [P] [US1] `src/lib/alerts/alert-name.ts` y `src/lib/alerts/alert-name-texts.ts`; las piezas en `messages/es.json` bajo `alerts.name.*`, con la concordancia de género (research R10)
- [X] T018 [P] [US1] Los tres eventos en `src/lib/analytics/events.ts` (con su comentario de disparador) y `src/lib/analytics/alert-events.ts` (research R12)
- [X] T019 [US1] `src/lib/supabase/queries/pet-alerts.ts`: `createPetAlertRecord`, `listMyPetAlerts`, `deletePetAlertRecord` (contracts §Queries)
- [X] T020 [US1] `src/actions/pet-alerts.ts`: `createPetAlert` y `deletePetAlert` con `ActionResult`, sus momentos y `revalidatePath`; claves `alerts.errors.*` en `messages/es.json` (contracts)
- [X] T021 [US1] `src/components/alerts/alert-offer.tsx` y `alert-offer-texts.ts`: los siete estados, `autoCreate` que corre una vez y `avisar` sale con la dirección canónica de `useListing`, el enlace a entrar con la vuelta (plan §Diseño, research R8)
- [X] T022 [US1] El listado: `animales/page.tsx` separa `avisar` antes de la comparación canónica (y lo conserva al redirigir), lee la sesión y pasa el modo del ofrecimiento; `listing-shell.tsx`, `listing-controller.tsx` (junto a `ListingCount`, sin mostrarse si el listado no llegó) y `listing-empty.tsx` (`primary` al lado de «Sacar los filtros»); textos en `listing-texts.ts` (plan §Diseño)
- [X] T023 [P] [US1] `src/components/alerts/my-alerts-list.tsx`, `my-alert-row.tsx` y `delete-alert-button.tsx` (quieto · borrando · no se pudo) (plan §Diseño «Mis avisos»)
- [X] T024 [US1] `src/app/[locale]/(app)/mis-avisos/page.tsx` (con `requireProfile`, `generateMetadata` `noindex` desde `metadata.my_alerts`, el vacío con `HeadedEmptyState`), `loading.tsx` y `error.tsx`
- [X] T025 [US1] «Mis avisos» en `src/components/profile/my-list-links.tsx` y `my-profile-sections.tsx`, con el título del grupo actualizado
- [X] T026 [US1] Textos de US1 en `messages/es.json` (`alerts.offer.*`, `alerts.mine.*`, `metadata.my_alerts`) escritos y revisados con `sin-slop`

**Checkpoint**: US1 se puede probar sola: crear, repetir, el tope, sin sesión, «Mis avisos».

---

## Fase 3: User Story 2 — Recibir un solo correo por día con lo nuevo (P2)

**Goal**: la corrida de las 8 manda a cada persona un solo correo con lo nuevo que coincide y se puede
solicitar, una parte por aviso, hasta 6, sin repetidos; nada si no hay nada.

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T027 [P] [US2] `src/lib/alerts/mail-parts.test.ts`: un animal en dos avisos va solo en el primero; orden por primera aparición descendente con desempate por código; tope de 6; el séptimo del primero no pasa al segundo; partes vacías fuera; sin partes, nada; la camada cuenta como una
- [X] T028 [P] [US2] Casos nuevos en `src/lib/email/notice-email-template.test.ts`: `groups` escapa títulos, nombres y direcciones, dibuja cada renglón con su enlace y su foto, y la versión de texto lleva lo mismo
- [X] T029 [P] [US2] Casos nuevos en `src/lib/analytics/alert-events.test.ts` (`pet_alert_mail_sent` con `items` y `parts`) y en `src/lib/analytics/visit-origin.test.ts` (la marca `aviso` da `alert` venga de donde venga)
- [X] T030 [P] [US2] `tests/db/pet-alerts-mail.test.ts`: lo publicado después del aviso llega; lo visto antes de crearlo no; pausado, adoptado, vencido, dado de baja o borrado antes de la corrida no llega, y reanudado después tampoco; renovado o editado no; lo propio no; bloqueos en las dos direcciones no; una camada viene una vez; cuenta suspendida no se devuelve y su `covered_until` avanza; sin nada nuevo no se devuelve y su `covered_until` avanza; sin `mark_pet_alerts_mailed` (correo que no salió) la corrida del día siguiente trae los dos días; dos corridas el mismo día no reclaman dos veces (SC-002, SC-003)

### Implementación de US2

- [X] T031 [P] [US2] `src/lib/alerts/mail-parts.ts` (research R4)
- [X] T032 [P] [US2] `src/lib/email/notice-email-template.ts` suma `groups`; `src/lib/email/send-email.ts` suma `headers` y los anota en el archivo de `.artifacts/mail/` (contracts §Plantilla, research R11)
- [X] T033 [P] [US2] `LINK_MARKS.alert = 'aviso'` en `src/lib/pets/share-url.ts` y el origen `alert` en `src/lib/analytics/visit-origin.ts` (research R12)
- [X] T034 [US2] `claimPetAlertMail`, `markPetAlertsMailed` y `createUnsubscribeLink` en `src/lib/supabase/queries/pet-alerts.ts`
- [X] T035 [US2] `src/lib/email/send-pet-alert-mail.ts`: `sendPetAlertMail` y `sendPetAlertMails` (dirección de la cuenta, token nuevo, partes con `alertName`, fotos de compartir, fichas con `desde=aviso`, `listingHref` por parte, «Dejar de recibir» al pie, cabeceras `List-Unsubscribe`, marcar solo si salió, el momento, de a uno cada 600 ms) (contracts §Correo)
- [X] T036 [US2] `src/app/api/cron/resumen/route.ts`: después de los resúmenes, `sendPetAlertMails(locale)` con su propio `taskFailed` (research R5)
- [X] T037 [US2] Textos del correo en `messages/es.json` (`emails.pet_alerts.*`: asunto, título y cuerpo con la cantidad, «Camada de N crías», «Ver todos en el listado», botón, «Dejar de recibir», pie) con `sin-slop`

**Checkpoint**: US2 se prueba con la corrida y los correos en `.artifacts/mail/`.

---

## Fase 4: User Story 3 — Dejar de recibir con un toque, sin entrar (P3)

**Goal**: el enlace del correo borra todos los avisos de la persona sin entrar y lo confirma; uno que
no sirve lo dice sin decir de quién era.

**Independent Test**: spec.md US3.

### Tests de US3

- [X] T038 [P] [US3] Casos nuevos en `src/lib/analytics/alert-events.test.ts`: un `pet_alert_deleted` `{ origin: 'mail' }` por cada aviso cortado, ninguno con cero
- [X] T039 [P] [US3] `tests/db/pet-alerts-unsubscribe.test.ts`: un hash válido borra todos los avisos de su cuenta y ninguno de otra; dos veces da `done` con 0; un hash desconocido, `unknown`; el de una cuenta borrada, `unknown`; uno de más de 180 días, purgado por la corrida, `unknown`; `pet_alert_unsubscribe_link_exists` no borra nada (SC-005)
- [X] T040 [US3] `tests/e2e/avisos.spec.ts` (segunda parte): con un aviso y un animal nuevo sembrados, llamar la ruta de las 8, leer el correo de `.artifacts/mail/`, abrir su «Dejar de recibir» sin sesión → confirmación → entrar → «Mis avisos» vacío; un token alterado → «Este enlace no sirve»

### Implementación de US3

- [X] T041 [US3] `unsubscribeLinkExists` y `unsubscribeByToken` en `src/lib/supabase/queries/pet-alerts.ts`; `unsubscribePetAlerts` en `src/actions/pet-alerts.ts` con sus momentos (contracts)
- [X] T042 [US3] `src/components/alerts/unsubscribe-runner.tsx`: cortando · listo · no se pudo · sin JavaScript (formulario con el botón) (plan §Diseño «Dejar de recibir», research R7)
- [X] T043 [US3] `src/app/[locale]/(open)/dejar-de-recibir/[token]/page.tsx`: forma del token y existencia en el servidor, la pantalla de enlace que no sirve o la hoja; `generateMetadata` `noindex, nofollow` desde `metadata.unsubscribe`
- [X] T044 [US3] `src/app/api/avisos/dejar/route.ts`: `POST` de `List-Unsubscribe-Post` que llama lo mismo que la acción y responde `200` sin cuerpo siempre
- [X] T045 [US3] Textos de US3 en `messages/es.json` (`alerts.unsubscribe.*`, `metadata.unsubscribe`) con `sin-slop`

**Checkpoint**: las tres historias andan juntas; el correo de US2 lleva a una pantalla que existe.

---

## Fase 5: Pulido

- [X] T046 [P] `docs/03-mvp-features.md` §Métricas de éxito: la lectura 7 en «Cómo se leen», al lado de las lecturas 2 y 5: `pet_alert_created`, `pet_alert_mail_sent`, las fichas con origen `alert` y lo que sigue hasta `application_sent`, y si quien creó un aviso después pasa por la verificación (FR-042)
- [X] T047 [P] `docs/06-i18n.md`: glosario «aviso» (`pet alert`; no «alerta» ni «suscripción») y «Dejar de recibir» (`unsubscribe`); los namespaces nuevos en la lista
- [X] T048 [P] `docs/10-design-system.md`: filas de `AlertOffer`, `MyAlertsList` `MyAlertRow`, `DeleteAlertButton`, `UnsubscribeRunner`; `MyListLinks` con cinco accesos; la plantilla de correo con grupos
- [ ] T049 `vercel:react-best-practices` sobre los TSX tocados; capturas con `node scripts/walk.mjs --story avisen-correo-animal-busco --user "/animales?especie=perro&tamano=chico&departamento=montevideo" /mis-avisos` a 390 y 1280 px
- [ ] T050 `pnpm gates:affected` en verde (la migración corre la suite entera) y Stryker al 100 % sobre lo que tiene test
- [ ] T051 Recorrer quickstart.md de punta a punta

---

## Dependencias

- Fase 1 bloquea todo. T004 después de T001–T003.
- US1 (Fase 2) primero. US2 depende de T019 (la query) y T017 (el nombre). US3 depende de T034
  (el enlace que escribe el correo).
- El e2e de US3 (T040) extiende el de US1 (T015).
- Pulido al final.

## Paralelo

- T005–T008 entre sí. En US1, T009–T014 entre sí y T016–T018 entre sí. En US2, T027–T030 y
  T031–T033. En US3, T038 y T039.

## Estrategia

MVP = Fase 1 + US1, verificada con su Independent Test. Después US2 y US3, cada una con su
checkpoint. Las tres van en el mismo PR (Constitución II).
