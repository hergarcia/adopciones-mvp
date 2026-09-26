---
description: "Tareas de la historia #35 — El perfil no pierde lo escrito si se corta la conexión o se recarga"
---

# Tasks: El perfil no pierde lo escrito si se corta la conexión o se recarga

**Input**: `specs/006-perfil-no-pierde-escrito/` — spec.md, plan.md (§Diseño + 7 decisiones),
research.md, data-model.md, contracts/actions.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Base y pulido no llevan etiqueta

---

## Fase 1: Base compartida

**Propósito**: lo que las cuatro user stories necesitan. **Sin dependencias nuevas ni migraciones**
(plan.md §Technical Context).

- [X] T001 [P] `messages/es.json`: `profile.save_failed.{offline,no_response,session,retry,sign_in}` y `profile.errors.session` con los textos de plan.md §5
- [X] T002 [P] `src/components/profile/profile-form-types.ts` y `src/app/[locale]/_components/profile-form-texts.ts`: tipo `SaveFailedTexts` y el objeto `saveFailed` en `ProfileFormTexts`, armado desde `profile.save_failed`
- [X] T003 [P] `src/lib/analytics/events.ts`: `profile_save_failed` y `profile_save_recovered` con el comentario de cuándo se dispara cada uno (data-model.md §Eventos nuevos); `src/lib/analytics/track.ts`: `track(event, props?)` con `props` tipado por evento (`EventProps<E>`, solo enums y booleanos), sin cambiar los puntos de disparo existentes

**Punto de control**: `pnpm lint && pnpm typecheck && pnpm test` en verde, sin cambios visibles.

---

## Fase 2: US1 — Un guardado que no llega no borra nada y se puede reintentar (P1) 🎯 MVP

**Meta**: sin conexión o sin respuesta, el alta y la edición muestran el aviso de no guardado con
todo lo escrito intacto, y «Reintentar» guarda lo que está en pantalla.

**Prueba independiente**: spec.md §US1 Independent Test.

### Tests

- [X] T004 [P] [US1] `src/lib/profile/save-failure.ts` + `save-failure.test.ts`: `classifySaveFailure` con cada fila de data-model.md §Intento de guardado (resultado ok → `saved`; `profile.errors.session` → `notice session`; `profile.errors.save_failed` → `notice no_response`; otra clave → `invalid` con esa clave; lanzó sin red → `offline`; lanzó con red → `no_response`; plazo vencido → `no_response`) y la constante `SAVE_DEADLINE_MS = 30_000`
- [X] T005 [P] [US1] `tests/e2e/perfil-sin-conexion.spec.ts`, alta: persona nueva completa nombre, foto, departamento, localidad y marca; `context.setOffline(true)`; «Guardar» → aviso «sin conexión» visible, los cinco valores intactos, sin «Algo se rompió»; «Reintentar» otra vez sin red → un solo aviso; `setOffline(false)` → «Reintentar» → «Perfil guardado» y el próximo paso del alta
- [X] T006 [P] [US1] mismo archivo, edición: persona con perfil cambia la localidad, sin red, «Guardar cambios» → el mismo aviso, el cambio sigue, sin «No pudimos traer tu perfil»; con red, «Reintentar» → «Cambios guardados»

### Implementación

- [X] T007 [US1] `src/actions/profile.ts`: `saveProfile` devuelve `profile.errors.session` sin sesión (contracts/actions.md)
- [X] T008 [US1] `src/hooks/use-profile-save.ts`: `attempt(form)` con número de intento, sin mandar si `navigator.onLine === false`, carrera contra `SAVE_DEADLINE_MS`, `try/catch`, descarte de respuestas de intentos viejos (FR-009), veredicto con `classifySaveFailure`; expone `notice`, `pending`, `attemptKey` y `hadFailure`
- [X] T009 [P] [US1] `src/components/profile/save-failed-notice.tsx`: `SaveFailedNotice` (plan.md §Diseño): fondo `accent-soft`, texto en tinta, `role="alert"`, `Button ghost` «Reintentar» (deshabilitado mientras hay un intento) o, con `session`, `LinkButton ghost` «Entrar de nuevo» a `/entrar?next=<pantalla>`; sin estado propio
- [X] T010 [US1] `src/components/profile/profile-form.tsx`: usa `useProfileSave`; arma el `FormData` en cada intento desde el estado actual (FR-004); «Reintentar» y la tirita llaman al mismo `submit`; monta `SaveFailedNotice` con `key={attemptKey}` sobre la tirita; el `ErrorText` de guardado queda solo para `invalid` que no es de un campo; `dirty` suma «hay un aviso vigente» (FR-007); limpia el aviso al guardar bien
- [X] T011 [US1] `src/components/profile/profile-form.tsx` recibe `signInHref`; `completar-perfil/page.tsx` y `mi-perfil/editar/page.tsx` pasan la ruta de ingreso con `next` a esa misma pantalla

**Punto de control**: T005 y T006 en verde; `pnpm lint && pnpm typecheck && pnpm test`.

---

## Fase 3: US2 — Reintentar un guardado que sí llegó no duplica nada (P2)

**Meta**: el reintento de un alta que ya quedó guardada confirma «Perfil guardado», sigue al
próximo paso y no cuenta nada dos veces.

**Prueba independiente**: spec.md §US2 Independent Test.

### Tests

- [ ] T012 [P] [US2] `src/lib/profile/save-outcome.ts` + `save-outcome.test.ts`: `profileSaveOutcome` con cada fila de data-model.md §Desenlace del guardado (eventos exactos y `wasComplete`), con y sin `recovered` (suma `profile_save_recovered` con `moment` igual al modo), y un `mode` desconocido tratado como `edit`
- [ ] T013 [P] [US2] `tests/e2e/perfil-sin-conexion.spec.ts`, respuesta perdida: en el alta, la primera llamada al guardar pasa (`route.fetch()`) y su respuesta se corta (`route.abort()`); aparece el aviso; «Reintentar» → «Perfil guardado» y el próximo paso

### Implementación

- [ ] T014 [US2] `src/actions/profile.ts`: `saveProfile` lee `mode` y `recovered`, decide con `profileSaveOutcome` y dispara esos eventos; `ProfileForm` recibe `mode` y lo manda; `completar-perfil/page.tsx` pasa `create`, `mi-perfil/editar/page.tsx` pasa `edit`

**Punto de control**: T012 y T013 en verde.

---

## Fase 4: US3 — Volver a mitad del alta encuentra la zona elegida (P3)

**Meta**: al recargar el alta vuelven nombre, departamento, localidad y marca; ninguna otra cuenta
ve el borrador.

**Prueba independiente**: spec.md §US3 Independent Test.

### Tests

- [ ] T015 [P] [US3] `tests/e2e/perfil-sin-conexion.spec.ts`, recarga: en el alta, nombre, departamento, localidad y marca → recargar → los cuatro siguen. **Se escribe primero y tiene que fallar** antes de T017 (research.md §R3)
- [ ] T016 [P] [US3] `src/lib/profile/profile-draft.ts` + `profile-draft.test.ts`: `serializeDraft` nunca incluye la foto; `readDraft` con dueño igual (valores sobre `initial`, los vacíos no pisan), dueño distinto, sin dueño (forma vieja), JSON roto y `raw` nulo, con `discard` exacto en cada caso (data-model.md §Borrador del alta)

### Implementación

- [ ] T017 [US3] Arreglar la causa que muestre T015; primera hipótesis: `src/components/profile/profile-fields.tsx` borra la localidad solo si el departamento nuevo es distinto del actual (research.md §R3)
- [ ] T018 [US3] `src/hooks/use-profile-draft.ts`: usa `readDraft`/`serializeDraft`, recibe `{ enabled, owner }`, borra la clave cuando `discard`; `completar-perfil/page.tsx` pasa `owner = user.id` a `ProfileForm`
- [ ] T019 [P] [US3] `src/components/profile/discard-profile-draft.tsx`: hoja cliente sin dibujo que llama a `clearProfileDraft` al montar; `mi-perfil/page.tsx` la monta (FR-016)

**Punto de control**: T015 y T016 en verde; el e2e de alta de la historia #9 sigue verde.

---

## Fase 5: US4 — Medir los guardados que fallan y los que se recuperan (P4)

**Meta**: cada fallo llega a la medición con motivo, momento y si es el primero de la visita; el
guardado que se recupera se cuenta una vez.

**Prueba independiente**: spec.md §US4 Independent Test.

### Tests

- [ ] T020 [P] [US4] `src/lib/schemas/profile-save-report.ts` + test: acepta 1 a 20 fallos con `reason` `offline`|`no_response`, `moment` `create`|`edit`, `first` booleano; rechaza vacío, 21, `session`, claves de más y texto libre
- [ ] T021 [P] [US4] `recordFailure(history, reason, moment)` en `src/lib/profile/save-failure.ts` + test: `first` verdadero solo en el primer fallo de la visita; `session` no entra en la cola

### Implementación

- [ ] T022 [US4] `src/actions/profile.ts`: `reportProfileSaveFailures(payload)` valida con el schema y dispara un `profile_save_failed` por fallo; inválido → nada y `{ ok: true, data: null }` (contracts/actions.md)
- [ ] T023 [US4] `src/hooks/use-profile-save.ts`: cola con `recordFailure`; vacía con `reportProfileSaveFailures` al evento `online` y antes de cada intento, sin reportar dos veces un lote; si el reporte falla, los fallos quedan; manda `recovered=true` si hubo un fallo en esta visita

**Punto de control**: quickstart.md paso 1 muestra en la consola del servidor el fallo, la alta y el
recuperado.

---

## Fase 6: Pulido y transversal

- [ ] T024 [P] `docs/10-design-system.md`: `SaveFailedNotice` y `DiscardProfileDraft` en la tabla de componentes; la fila de `ProfileForm` suma el estado «aviso de no guardado»
- [ ] T025 [P] `docs/known-limitations.md`: borrar la entrada KL-024 (decisión 2026-09-26, product-owner)
- [ ] T026 Capturas con `node scripts/walk.mjs --story perfil-no-pierde-escrito --user` de `/completar-perfil` y `/mi-perfil/editar` a 390 y 1280, con el aviso visible, para `design-reviewer`
- [ ] T027 Correr `vercel:react-best-practices` sobre los TSX tocados y `pnpm mutation` sobre lo testeado (100 %)
- [ ] T028 `pnpm verify` en verde; recorrer quickstart.md

---

## Dependencias y orden

- Fase 1 antes que todo. US1 antes que US2 y US4 (usan `useProfileSave`). US3 es independiente de
  US1/US2 y puede ir en paralelo después de la Fase 1.
- Dentro de cada fase: los tests primero y en rojo; T015 tiene que fallar antes de T017.
- T024–T028 al final.
