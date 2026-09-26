# Implementation Plan: El perfil no pierde lo escrito si se corta la conexión o se recarga

**Branch**: `feature/35-perfil-no-pierde-escrito` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/006-perfil-no-pierde-escrito/spec.md` (4 user stories, endurecida en dos rondas
de grader y adversario; lo que quedó abierto está en sus Assumptions)

## Summary

El formulario del perfil (`ProfileForm`) ya conserva lo escrito cuando la acción **contesta** que
no guardó. Lo que rompe es cuando **no contesta**: `await saveProfile(form)` lanza (`TypeError:
Failed to fetch`) dentro de `startTransition`, el error sube al límite de error de la zona y la
pantalla se reemplaza por «Algo se rompió» (o, bajo `/mi-perfil`, por «No pudimos traer tu
perfil», que es el `error.tsx` de ese segmento). El borrador del alta, además, pierde
departamento y localidad al restaurarse.

Cuatro decisiones ordenan el plan:

1. **El guardado se envuelve, no se reescribe.** Un hook nuevo, `useProfileSave`, llama a la misma
   Server Action con un plazo de 30 s y un `try/catch`, y traduce el desenlace con una función pura,
   `classifySaveFailure`, a uno de tres resultados: guardado, dato inválido (sigue como hoy) o
   **aviso**, con tres motivos (sin conexión, el sitio no respondió, sesión cerrada). Cada intento lleva un número;
   una respuesta de un intento viejo se descarta (FR-009). Nada de esto toca la base.
2. **Contar el alta una vez sin guardar nada nuevo.** El formulario manda en qué pantalla está
   (`mode`: `create` o `edit`). La acción decide evento y confirmación con una función pura,
   `profileSaveOutcome`: sin perfil previo → «terminada» y «Perfil guardado»; con perfil previo y
   `create` → **ningún evento** y «Perfil guardado» (FR-012, FR-013); con perfil previo y `edit` →
   «editado» y «Cambios guardados». El guardado ya es idempotente: el perfil es un upsert por id y
   la foto un upsert en un camino fijo por cuenta.
3. **El borrador tiene dueño.** Se guarda como `{ owner, values }`, con `owner` = el id interno de
   la cuenta, que ese navegador ya tiene en su sesión. Un borrador de otro dueño o del formato
   viejo se descarta al leerlo (FR-016). La lectura y la escritura pasan a funciones puras,
   `lib/profile/profile-draft.ts`, testeadas; el hook solo las conecta con `localStorage`.
4. **Los fallos se anotan cuando se puede.** Los fallos quedan en una cola en memoria de la
   pantalla y se mandan con una acción propia, `reportProfileSaveFailures`, cuando vuelve la
   conexión (evento `online`) y antes de cada reintento; el guardado que por fin sale lleva
   `recovered=true` y la acción registra «recuperado» (FR-019, FR-020).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (`strict`), React 19.3, Next.js 16.3.5 (App Router)

**Primary Dependencies**: las de `main`. **Ninguna nueva.** zod 4 para el schema del reporte de
fallos.

**Storage**: ninguno nuevo en la base. `localStorage` del navegador para el borrador (ya existe,
cambia su forma). **Sin migraciones.**

**Testing**: Vitest para las funciones puras y el schema (Stryker al 100 %); Playwright para los
flujos de corte, reintento y recarga contra `next start`.

**Target Platform**: web mobile-first; teléfono a 390 px y escritorio a 1280.

**Project Type**: aplicación web (Next.js).

**Performance Goals**: sin cambio de presupuesto. El hook y el aviso suman < 2 KB al JS de dos
pantallas que ya son cliente (`ProfileForm`).

**Constraints**: las Server Actions de Next se despachan **de a una** desde el cliente (ver
research §R1): un reintento después de un plazo vencido espera a que el intento colgado termine.
Se acepta (Riesgos).

**Scale/Scope**: dos pantallas («Completar perfil», «Editar mi perfil»), una acción cambiada, una
acción nueva, dos eventos nuevos.

## Constitution Check

| Principio | Cumple | Cómo |
|---|---|---|
| I. La historia dice el qué | Sí | La spec no nombra implementación; el cómo vive acá. |
| II. Una feature, un PR | Sí | Cuatro user stories, un PR; US2-US4 se apoyan en el hook de US1. |
| III. Compuertas y revisión | Sí | Qué se testea y por qué: §Qué se testea. Stryker al 100 % sobre lo testeado. |
| IV. Reglas como código | Sí | El schema del reporte es zod; la regla del dueño del borrador es una función pura con test. |
| V. Datos personales mínimos | Sí | Nada nuevo en la base. El borrador guarda lo mismo que hoy más el id de la cuenta, que ese navegador ya tiene. Los eventos no llevan datos de la persona. Sin RLS nueva: no hay tabla ni lectura nueva. |
| VI. Sin deriva | Sí | Nada de «Fuera del MVP». Sin guardado automático ni modo sin conexión (decisión 2026-09-26). KL-024 se borra en este PR. |
| VII. Liviana y linda | Sí | Sin dependencias; el aviso usa tokens existentes; sección «Diseño» abajo. |
| VIII. Autonomía con veto | Sí | Las decisiones del enjambre de la historia van a `docs/03` §1 en esta rama. |

Re-evaluado después del diseño: sin cambios.

## Diseño

### Tokens, sin ninguno nuevo

`--color-accent-soft` (fondo del aviso: «fondo de avisos de error», docs/10 §Color) con texto en
`--color-ink` (el ceibo sobre ese fondo no llega a AA), `--space-4` de relleno, `--dur-base` y
`--ease-out` para la entrada (`fade-in`, la misma de `ErrorText`), `text-base` para el mensaje.
Sin sombra, sin inclinación, sin cinta: el aviso es un renglón del formulario, no algo pegado.

### El único elemento que llama la atención

En la pantalla con el aviso, **el aviso** es lo único con color de fondo. La `tirita` («Guardar» /
«Guardar cambios») sigue siendo la acción principal y no cambia de texto: una sola tirita por
pantalla (docs/10 §Componentes). «Reintentar» es `ghost` dentro del aviso: subrayado, sin relleno,
44 px de alto.

### Completar perfil / Editar mi perfil, con el aviso (390 px)

```
┌──────────────────────────────┐
│ [logo]                       │
│ Completá tu perfil           │  h1 en voz de afiche (sin cambio)
│                              │
│  (foto)  Cambiar   Quitar    │  AvatarField, con la foto elegida intacta
│                              │
│ Tu nombre                    │
│ Ana Pereira_________________ │
│ Departamento                 │
│ Montevideo_______________ v  │
│ Barrio                       │
│ Malvín______________________ │
│ [x] Soy rescatista o refugio │
│                              │
│ ┌──────────────────────────┐ │  SaveFailedNotice: fondo accent-soft,
│ │ No se guardó: no hay     │ │  texto en tinta, role="alert"
│ │ conexión. Lo que         │ │
│ │ escribiste sigue acá.    │ │
│ │ Reintentar               │ │  Button ghost (subrayado)
│ └──────────────────────────┘ │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ █████████ Guardar ██████████ │  Button tirita lg (sin cambio)
└──────────────────────────────┘
```

A 1280 px: el mismo formulario en la hoja de trabajo de `PageShell`, a `--measure`; el aviso
ocupa el ancho del formulario, igual que el botón. No hay columna nueva.

Sesión cerrada: el mismo bloque con «Se cerró tu sesión. Entrá de nuevo para guardar.» y, en
lugar de «Reintentar», un `LinkButton ghost` «Entrar de nuevo» a `/entrar?next=<esta pantalla>`.
Salir por ese enlace pasa por el aviso de cambios sin guardar (FR-008).

### Estados del formulario

- **Quieto / editando**: sin cambio.
- **Guardando**: la tirita en `loading` (spinner sobre el texto, mismo ancho), como hoy; «Reintentar»
  deshabilitado mientras hay un intento en curso.
- **Error de un campo**: `ErrorText` debajo del campo, como hoy (FR-006).
- **Error de la foto**: `ErrorText` de la foto, como hoy.
- **Aviso de no guardado**: el bloque de arriba, con uno de tres textos. Uno solo: un intento
  nuevo lo reemplaza; se vuelve a montar en cada fallo para que el lector de pantalla lo anuncie
  otra vez (`key` = número de intento).
- **Guardado**: navega y la pantalla de llegada muestra `SavedToast`, como hoy.
- Vacío: no aplica (es un formulario). Cargando de la pantalla: los `loading.tsx` existentes.

### Componentes

| Componente | Capa | Nuevo / cambia | Qué |
|---|---|---|---|
| `SaveFailedNotice` | profile | **nuevo** | El aviso: recibe `reason` (`offline` · `no_response` · `session`), los textos traducidos, `onRetry`, `signInHref`, `retryDisabled`. Sin estado propio. Entra en la tabla de docs/10. |
| `ProfileForm` | profile | cambia | Usa `useProfileSave`; el `ErrorText` de guardado queda solo para rechazos de datos que no son de un campo; monta `SaveFailedNotice`; `dirty` incluye «hay un fallo sin resolver» (FR-007). Manda `mode`. |
| `ProfileFields` | profile | cambia | Borrar la localidad solo cuando el departamento **cambia** de verdad (research §R3). |
| `DiscardProfileDraft` | profile | **nuevo** | Hoja cliente que no dibuja nada: al montar en «Mi perfil» borra un borrador que quedó de un alta ya terminada (FR-016). |
| `Button` `LinkButton` `ErrorText` | ui | se reutilizan | Sin cambios. |

## Project Structure

### Documentation (this feature)

```text
specs/006-perfil-no-pierde-escrito/
├── story.md
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── actions.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
src/
  actions/profile.ts                     saveProfile: mode, recovered, sesión, desenlace puro;
                                         reportProfileSaveFailures (nueva, mismo dominio)
  hooks/use-profile-draft.ts             conecta profile-draft.ts con localStorage y el dueño
  hooks/use-profile-save.ts              intento con plazo, número de intento, cola de fallos (nuevo)
  components/profile/profile-form.tsx
  components/profile/profile-fields.tsx
  components/profile/save-failed-notice.tsx        (nuevo)
  components/profile/discard-profile-draft.tsx     (nuevo)
  components/profile/profile-form-types.ts         textos del aviso
  lib/profile/profile-draft.ts           leer/escribir el borrador con dueño (nuevo, puro)
  lib/profile/save-failure.ts            classifySaveFailure (nuevo, puro)
  lib/profile/save-outcome.ts            profileSaveOutcome (nuevo, puro)
  lib/schemas/profile-save-report.ts     zod del reporte de fallos (nuevo)
  lib/analytics/events.ts                profile_save_failed, profile_save_recovered
  lib/analytics/track.ts                 propiedades opcionales, tipadas por evento
  app/[locale]/(auth)/completar-perfil/page.tsx    pasa owner y mode
  app/[locale]/(app)/mi-perfil/editar/page.tsx     pasa mode
  app/[locale]/(app)/mi-perfil/page.tsx            monta DiscardProfileDraft
  app/[locale]/_components/profile-form-texts.ts   textos del aviso
messages/es.json                         profile.save_failed.* y profile.errors.session
tests/e2e/perfil-sin-conexion.spec.ts    (nuevo)
docs/10-design-system.md                 SaveFailedNotice y DiscardProfileDraft en la tabla
docs/known-limitations.md                se borra KL-024
docs/03-mvp-features.md                  las tres decisiones del enjambre (ya en esta rama)
```

## Decisiones técnicas

### 1. `useProfileSave`: un intento con plazo

```
attempt(form):
  id = ++lastAttempt
  if navigator.onLine === false → fallo('offline') sin mandar nada
  race(saveProfile(form), timeout(30 s))
  if id !== lastAttempt → ignorar (FR-009)
  classifySaveFailure({ online, outcome }) → saved | invalid | notice(reason)
```

- `outcome` es uno de: `{ kind: 'result', result }`, `{ kind: 'threw' }`, `{ kind: 'timeout' }`.
- `classifySaveFailure` (pura): `result.ok` → `saved`; `result.error === 'profile.errors.session'` →
  `notice('session')`; `result.error === 'profile.errors.save_failed'` → `notice('no_response')`
  (FR-003: el sitio contestó que no pudo); cualquier otra clave de error → `invalid` (dato o foto,
  como hoy); `threw` con `online === false` → `notice('offline')`; `threw` con conexión →
  `notice('no_response')`; `timeout` → `notice('no_response')`.
- El `useTransition` termina cuando termina la carrera, no la acción: el botón deja de estar
  ocupado a los 30 s aunque el pedido siga colgado (FR-003, SC-003).
- El `FormData` se arma en cada intento desde el estado actual (FR-004): lo que la persona cambió
  después del fallo va.
- «Reintentar» y la tirita llaman a la misma función `submit`: validar, reportar la cola, intentar.

### 2. La acción `saveProfile`

- Sin sesión devuelve `profile.errors.session` en vez de `save_failed` (FR-008). Clave nueva.
- Lee `mode` (`create` | `edit`, default `edit`) y `recovered` (`'true'`).
- `profileSaveOutcome({ existedBefore, mode, recovered })` (pura) devuelve `events: AnalyticsEvent[]`
  y `wasComplete` (la marca de la confirmación): ver data-model.md §Desenlace del guardado.
- `mode` viene del cliente y solo decide la confirmación y la medición: no abre nada que la sesión no
  permita ya. Se valida contra el enum; cualquier otra cosa es `edit`.

### 3. El borrador con dueño

- `lib/profile/profile-draft.ts` (puro): `serializeDraft(owner, values)`,
  `readDraft(raw, owner, initial) → { values, discard }`. Reglas: JSON roto, sin `owner`, u
  `owner` distinto → `discard: true` y `initial`; campos vacíos del borrador no pisan lo que trae la
  pantalla (la regla de hoy, FR-030b de la historia #9); nunca lee ni escribe la foto.
- `useProfileDraft(initial, { enabled, owner })`: si `discard`, borra la clave. Sigue leyendo
  después de montar (hidratación) y sigue sin escribir lo que la pantalla trajo y nadie tocó.
- `completar-perfil/page.tsx` pasa `owner = user.id`. El id no identifica a la persona fuera del
  producto y ya viaja en la sesión de ese navegador (FR-016).
- `DiscardProfileDraft` en «Mi perfil»: a esa pantalla llega quien terminó el alta, también quien
  recargó el alta después de un guardado que llegó sin respuesta (la página del alta redirige ahí).
- `clearProfileDraft` al cerrar sesión y al borrar la cuenta: sin cambio.

### 4. Los eventos

- `track(event, props?)`: `props` tipado por evento (`EventProps<E>`), solo claves y valores de un
  enum: `reason: 'offline' | 'no_response'`, `moment: 'create' | 'edit'`, `first: boolean`. Nunca
  texto libre. Sesión cerrada no es un fallo de conexión y no se anota.
- `reportProfileSaveFailures(payload)`: valida con zod (`lib/schemas/profile-save-report.ts`,
  hasta 20 fallos por llamada; lo que no valida se descarta entero y la acción devuelve `ok` igual:
  la medición nunca frena a la persona) y dispara un `profile_save_failed` por fallo. No pide sesión
  para no perder los fallos de quien se quedó sin ella; no guarda nada.
- Cola en `useProfileSave`: cada fallo `offline`/`no_response` entra con `first` = «es el primero
  de esta visita», calculado por `recordFailure` (pura, en `lib/profile/save-failure.ts`). Se vacía con `reportProfileSaveFailures` al evento `online` y antes de cada
  intento; si el reporte falla, los fallos quedan en la cola. Un `ref` evita reportar dos veces el
  mismo lote.
- `profile_save_recovered`: lo dispara `saveProfile` cuando `recovered === 'true'` y el guardado
  salió; el cliente manda `recovered` si hubo al menos un fallo en esta visita.
- Ningún par se dispara siempre junto (FR-021): «recuperado» solo existe tras un fallo.

### 5. Los textos

En `messages/es.json`, namespace `profile` (docs/10 §Textos: qué pasó y qué hacer, sin disculpas):

| Clave | Texto |
|---|---|
| `profile.save_failed.offline` | «No se guardó: no hay conexión. Lo que escribiste sigue acá; cuando vuelva la señal, reintentá.» |
| `profile.save_failed.no_response` | «No se guardó: el sitio no respondió. Lo que escribiste sigue acá; probá de nuevo.» |
| `profile.save_failed.session` | «Se cerró tu sesión. Entrá de nuevo para guardar.» |
| `profile.save_failed.retry` | «Reintentar» |
| `profile.save_failed.sign_in` | «Entrar de nuevo» |
| `profile.errors.session` | la clave que devuelve la acción; el formulario la mapea a `save_failed.session` |

Llegan a `ProfileForm` por `profileFormTexts` como un objeto `saveFailed`, igual que `leaving`.

### 6. KL-024: departamento y localidad

Ver research §R3. Se escribe primero el e2e que recarga el alta y falla, después se arregla.

### 7. Encontrable

Sin pantallas nuevas. Las dos pantallas siguen `noindex` y con su `metadata`.

## Qué se testea, y por qué

| Qué | Dónde | Por qué vale |
|---|---|---|
| `classifySaveFailure`: los seis desenlaces | Vitest | Si clasifica mal, la persona ve «sin conexión» cuando el dato está mal, o nada cuando no se guardó: engaña. |
| `profileSaveOutcome`: las combinaciones de previo × modo × recuperado | Vitest | Calcula la medición del embudo: contar dos veces el alta o como edición es calcular mal. |
| `readDraft` / `serializeDraft`: dueño igual, distinto, sin dueño, JSON roto, campos vacíos, sin foto | Vitest | Un borrador de otra cuenta expone nombre y zona de una persona a otra. |
| Schema del reporte: motivos y momentos válidos, tope de 20, basura | Vitest | La acción no pide sesión: lo que entra tiene que ser solo enums. |
| `recordFailure(history, reason, moment)`: `first` verdadero solo en el primer fallo de la visita, sesión cerrada no entra | Vitest | Calcula la proporción de visitas recuperadas (SC-006): un `first` mal puesto la calcula mal. |
| Alta sin conexión: guardar → aviso «sin conexión», campos y foto intactos, sin «Algo se rompió»; conexión → Reintentar → «Perfil guardado» y próximo paso | Playwright | El flujo crítico de la historia (US1-AS1, AS2). |
| Editar sin conexión: aviso, sin «No pudimos traer tu perfil» | Playwright | US1-AS3, la otra mitad del bug de aceptación. |
| Guardado que llega con la respuesta perdida (`route.fetch()` + `route.abort()`), reintentar → «Perfil guardado» | Playwright | US2-AS1: la confirmación correcta. |
| Recargar el alta: nombre, departamento, localidad y marca siguen | Playwright | KL-024; es el test que falla primero. |

No se testea: el aspecto del aviso (lo mira `design-reviewer`), `DiscardProfileDraft` (solo llama a
una función ya testeada), `track` (no calcula nada).

## Documentación en este PR

- `docs/03-mvp-features.md` §1: las tres decisiones del enjambre de la historia, textuales (ya en
  esta rama).
- `docs/10-design-system.md`: `SaveFailedNotice` y `DiscardProfileDraft` en la tabla de componentes;
  la fila de `ProfileForm` suma el estado `sin conexión`.
- `docs/known-limitations.md`: se borra KL-024 (decisión 2026-09-26, product-owner).
- Si el e2e no puede simular el sitio sin responder en CI, se anota la limitación con su detección.

## Riesgos

- **Acciones en fila** (research §R1): tras un plazo vencido, el reintento espera al intento
  colgado. En el peor caso la persona ve el aviso otra vez a los 30 s. No pierde nada.
- **`navigator.onLine` optimista**: puede decir `true` sin conexión real (wifi sin salida). Ese caso
  cae en «el sitio no respondió», que es verdad desde la persona y ofrece lo mismo.
- **Causa de KL-024 no confirmada**: la hipótesis de research §R3 se confirma con el e2e antes de
  tocar código; si es otra, se arregla la que el test muestre.
