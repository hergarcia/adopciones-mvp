# Implementation Plan: Solicitar la adopción de un animal con el cuestionario

**Branch**: `feature/63-solicitar-adopcion-con-cuestionario` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/014-solicitar-adopcion/spec.md` (4 user stories). Decisiones técnicas en
[research.md](./research.md) (R1–R13); tablas, funciones y triggers en
[data-model.md](./data-model.md); rutas, acciones, correos y eventos en
[contracts/routes.md](./contracts/routes.md).

## Summary

Hoy un adoptante ve a Tobi y no tiene otra cosa que hacer que buscar al rescatista en Facebook. Al
terminar, toca «Quiero adoptar» en la ficha, el sitio lo hace ingresar y verificar lo que el
animal pide antes de cualquier pregunta, contesta una sola vez el cuestionario estándar (con las
respuestas de la vez anterior propuestas) y la solicitud queda guardada para el publicador, con el
límite de 3 activas y una por animal. En Mis solicitudes ve cada una con su estado, la retira, y ve
qué le pasó cuando el animal se pausó, se adoptó o desapareció. El publicador elige si el animal
pide teléfono o identidad verificada.

Cinco decisiones ordenan el plan:

1. **La solicitud se escribe solo con funciones de la base, con candado por cuenta** (R1, R2): las
   reglas del límite, la unicidad, el nivel y el bloqueo se controlan juntas en `submit_application`;
   la lectura es por RLS y solo para quien solicitó.
2. **Los cierres son triggers sobre su causa** (R3): adoptar, borrar, dar de baja, bloquear y
   suspender cierran en la misma transacción, por cualquier camino; pausar, vencer o perder el nivel 1
   no escriben nada y la nota se deriva al leer (R6).
3. **Una función pura decide qué pantalla ve quien toca «Quiero adoptar»** (R5): el orden de FR-003 se
   prueba con todas las combinaciones y la base lo repite al enviar.
4. **La ficha pública no gana JS** (R8): «Quiero adoptar» es un enlace a una ruta de `(app)`, con una
   lectura chica aparte; `pet_by_code` no se toca.
5. **El cuestionario vive en una lista única** (R4) que usan el formulario, el schema, la base (por
   paridad), Mi solicitud y la medición.

## Technical Context

**Language/Version**: TypeScript (`strict`), React 19, Next.js 16 (App Router).

**Primary Dependencies**: las de `main`. **Ninguna nueva.**

**Storage**: Postgres de Supabase (local). Una migración (data-model.md).

**Testing**: Vitest (unidad y base local), Playwright (un flujo crítico), Stryker al 100 % sobre lo
que tenga test.

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: el presupuesto de docs/07 (LCP < 2,5 s, JS inicial < 150 KB, Lighthouse mobile
≥ 90). La ficha suma una consulta y ningún JS. El cuestionario es una hoja cliente (`ApplicationForm`)
sin librerías: radios nativos y `Textarea`.

**Constraints**: sin Vercel (todo local); nada se indexa (las rutas nuevas `noindex`); los correos
sin `RESEND_API_KEY` van a `.artifacts/mail/`.

**Scale/Scope**: 4 páginas nuevas (`/solicitar/{code}`, `/solicitar/{code}/enviada`,
`/mis-solicitudes`, `/mis-solicitudes/{id}`), 4 que cambian (ficha, publicar, editar, verificar
identidad), 1 Route Handler, 1 migración, 1 archivo de acciones nuevo y 6 que cambian, ~17
componentes nuevos en `components/applications/` y 1 en `components/pets/`.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas ni rutas; el cómo está acá. |
| **II. Una feature, un PR** | Cuatro user stories en un PR, en orden: P1 solicitar, P2 límite/retirar/propuestas, P3 nivel exigido, P4 cierres. |
| **III. Compuertas verdes** | `pnpm gates:affected` en cada ronda; `pnpm verify` completo al cerrar; qué se testea en §Qué se testea. |
| **IV. Reglas como código** | Límite, unicidad, nivel, bloqueo, validez de las respuestas y cierres son funciones y triggers de la base con tests; el orden de los frenos (`applyGate`), la traducción de cada resultado (`submitOutcome`), el estado visible (`applicationView`), el schema y las respuestas propuestas son funciones puras con test. |
| **V. Datos personales** | Las respuestas las lee solo quien solicitó (RLS) y la prueba intenta leerlas como otra persona, como el publicador, como quien administra y sin sesión (FR-084). Ningún teléfono ni correo viaja en ninguna lectura de esta historia. Borrar la cuenta cascada a las solicitudes; borrar el animal deja la solicitud cerrada con el nombre. El borrador no sale del navegador y se borra al cerrar sesión. Ningún evento lleva ids ni respuestas. |
| **VI. Sin deriva** | Nada de «Fuera del MVP»: sin chat, sin push, sin pagos, sin correos de solicitud. Lo de «No incluye» queda afuera (spec §Assumptions). |
| **VII. Liviana y linda** | Server Components; hojas cliente chicas (el formulario, retirar). Todo contra docs/10, sin tokens nuevos ni variantes nuevas de primitivas. |
| **VIII. Autonomía con veto** | Se avisa en Ship, en un `aviso`: quién lee las respuestas hasta la bandeja, el nivel controlado también al enviar, el borrador por animal, la retención (hasta borrar la cuenta), el beacon de abandono. Nada reservado. |

**Sin violaciones**: Complexity Tracking vacío. Ningún cambio transversal de stack.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. El skill
`frontend-design:frontend-design` no está instalado en la sesión que escribió el plan (research
R13): la etapa Build lo carga antes del primer JSX.

**La idea.** En el poste, debajo del cartel de «se busca hogar», cuelgan las tiritas con el teléfono
para arrancar. Acá la tirita es **«Quiero adoptar»**: la acción principal de la ficha, en `tirita`,
la única de la pantalla. Lo que pasa después no es una vidriera sino **un formulario de papel**: la
hoja de trabajo de `(app)`, una columna, preguntas como renglones de un formulario impreso, el
nombre y la foto del animal arriba para que nadie olvide por quién está escribiendo. Los frenos
(límite, identidad, animal que no recibe) son **un aviso pegado en la puerta**: dicen qué pasa y
ofrecen un solo camino. Mis solicitudes es la carpeta: cada solicitud una fila con su sello.

**Lo único que llama la atención**, por pantalla: en la ficha, «Quiero adoptar» (`tirita`); en el
cuestionario, «Enviar solicitud» (`tirita`); en solicitud enviada, el sello «Enviada»; en Mis
solicitudes, el contador «N de 3»; en Mi solicitud, el sello del estado; en el límite, las tres
solicitudes (cada «Retirar» en `ghost`); en identidad, «Verificar mi identidad» (`tirita`).

**Cambió en la revisión (2026-10-06).** Los bocetos de abajo son los del plan; la revisión de
diseño los corrigió y la fuente es `docs/10-design-system.md`, que registra cada cambio con fecha:
el cuestionario va **una pregunta por paso** («3 de 11», `StepActions`), con la etiqueta en
`--text-lg` `ink`; el cuestionario, Mi solicitud y la puerta de identidad van al lado de la foto
(`ApplicationPetLayout` sobre `PetWorkLayout` `small`); Mis solicitudes y el límite son la pared del
listado con `MyApplicationCard` (el animal pegado, el sello sobre la foto) y no filas con
`ApplicationRow`, que ya no existe.

### Tokens

Color: `--color-ink` (texto, botones, radios elegidos), `--color-ink-muted` (fechas, ayudas,
«Quedan N»), `--color-line` (divisores entre preguntas y entre filas), `--color-surface` (el
recuadro de «el contacto se da cuando la solicitud se acepta», el aviso de en proceso), `--color-primary`
solo en la chapita del nivel de quien publica (ya existe) y en la línea «Pide identidad verificada»
(es confianza), `--color-warning` / `--color-warning-soft` en «no está disponible por ahora» (algo
espera), `--color-accent` solo en `ErrorText` y en el `SaveFailedStrip`. Sellos: `Stamp` `ink`
«Enviada», `muted` «Retirada» y «Cerrada», `warning` «No disponible por ahora». Tipografía: `.afiche`
en los `h1`; `--text-lg` en cada pregunta (`legend`/`label`); `--text-base` en respuestas;
`--text-sm` en ayudas, fechas y el contador; `--text-xs` en «Quedan N». Espacio: `--space-2` dentro
de una pregunta, `--space-6` entre preguntas, `--space-8` entre bloques. Movimiento: el de `Button`,
`RadioGroup`, `Dialog` y `Toast`; la pregunta condicional entra con fade de `--dur-base`
(`--ease-out`) y nada se mueve con `prefers-reduced-motion`. **Ningún token nuevo, ni variante nueva.**

### Ficha · `/animales/{code}` (cambia)

```
390 px
┌──────────────────────────────────────┐
│ [galería]                            │
│ Tobi                     (h1 3xl)    │
│ ...datos de #57...                   │
│ ✓ Pide identidad verificada   (sm)   │ ← RequiredLevelLine, solo con nivel 2
│ [ QUIERO ADOPTAR ]        (tirita lg)│ ← ApplyAction
│ Compartir                 (secondary)│
└──────────────────────────────────────┘
```

- `ApplyAction` (applications, servidor): recibe `{ kind: 'apply' | 'view_mine' | 'none', href }`
  ya decidido por `applyActionKind` (pura, con test: dueña → `none` y sigue «Editar» de #59;
  adoptada → `none`; activa propia → `view_mine`; disponible o en proceso → `apply`). `apply` es
  `LinkButton` `tirita` `lg` a `/solicitar/{code}`, también sin sesión: la página registra
  `apply_tapped` con `signedIn: false` y manda a ingresar con `next` (por `requireProfile`), así el
  toque sin sesión se mide; `view_mine` es `LinkButton` `secondary` «Ver mi solicitud». Va
  primero en el hueco `actions` de `PetSheet`; «Compartir» baja a `secondary` (ya lo es).
- `RequiredLevelLine` (applications): `--text-sm`, la chapita chica de `VerificationBadge` nivel 2 y
  el texto; debajo de los datos, encima de las acciones.
- Cargando y error: los de la ficha.

### Cuestionario · `/solicitar/{code}` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ [foto 64] Solicitar a Tobi     (h1)  │ ← ApplicationHeader
│ Contestás una vez; quien lo publicó  │
│ lo lee antes de responderte.  (sm)   │
│ ┌ Tobi está en proceso: ... ───────┐ │ ← InProcessNote (--color-surface), si aplica
│ └──────────────────────────────────┘ │
│ ┌ Propusimos tus respuestas de la ─┐ │ ← ProposedAnswersNote, si aplica
│ │ vez anterior. Revisalas.         │ │
│ └──────────────────────────────────┘ │
│ ¿Dónde vivís?                 (lg)   │ ← QuestionField (RadioGroup row)
│ [Casa][Apartamento][Otra]            │
│ ──────────────────────────────────── │
│ ¿Es propia o alquilada?              │
│ [Propia][Alquilada][Otra]            │
│ ¿El contrato o el dueño permite      │ ← aparece con fade si «Alquilada»
│ animales? [Sí][No][No sé]            │
│ ...                                  │
│ ¿Quiénes viven en la casa?           │ ← QuestionField (CountedTextarea)
│ ┌──────────────────────────────────┐ │
│ └──────────────────────────────────┘ │
│                         Quedan 500   │
│ ...                                  │
│ ┌ El contacto se da cuando la ─────┐ │ ← ContactLaterNote (--color-surface)
│ │ solicitud se acepta. No pongas   │ │
│ │ teléfono, correo ni enlaces.     │ │
│ └──────────────────────────────────┘ │
│ [ ENVIAR SOLICITUD ]      (tirita lg)│
└──────────────────────────────────────┘
```

- **Cambió en Build:** la pregunta usa la etiqueta de las primitivas (`RadioGroup` y la del texto en
  `--text-sm` `--color-ink-muted`, como en publicar) y no `--text-lg`: el plan prohíbe variantes nuevas
  de primitivas, y una etiqueta distinta en las de texto y en las de opciones partiría el formulario.
  `DraftRestoredNote` de pets lleva a «Mis animales»; el cuestionario usa `RestoredDraftNote`, la misma
  forma con su propio texto. Las pantallas de límite e identidad tienen su versión entera en US2 y US3;
  en US1, `/solicitar/{code}` las dibuja como un `HeadedEmptyState` con su único camino.
- `ApplicationForm` (applications, hoja cliente): recorre `QUESTIONS` de
  `lib/applications/questionnaire.ts` y dibuja cada una con `QuestionField`, que elige
  `RadioGroup` (`row`; `column` para «Patio o balcón», que tiene cuatro opciones largas) o
  `CountedTextarea` (forms, ya existe) según el tipo. Las condicionales se muestran con
  `visibleQuestions(answers, { isNeutered })` (pura, con test). Valida con `applicationSchema` antes
  de enviar: el error de cada pregunta va en su `ErrorText`; con varios, el foco va a la primera
  (`useFieldFocus`, ya existe). Ocupado: `Button` `loading`. Falla de conexión: `SaveFailedStrip`
  con «Reintentar», sin perder nada. `limit`, `has_active`, `unavailable`, `not_receiving`: un
  `SaveFailedStrip` con el texto y el camino (Mis solicitudes / Ver mi solicitud / Animales en
  adopción), las respuestas siguen. `needs_phone` / `needs_identity`: navega a la pantalla, el
  borrador queda.
- `useApplicationDraft` (hooks): R7. `DraftRestoredNote` (pets) se reusa con su texto propio.
- `useApplicationSubmit` (hooks): intento, doble toque, reintento, `checkApplicationAttempt` al
  montar.
- `useAbandonBeacon` (hooks): `pagehide` → `sendBeacon` con la última pregunta contestada (R11).
- `ApplicationHeader`, `InProcessNote`, `ProposedAnswersNote`, `ContactLaterNote` (applications):
  presentacionales.
- Cargando: `loading.tsx` con `Skeleton` del encabezado y cuatro renglones de pregunta. Error al
  cargar: el `error.tsx` de la ruta (`ErrorScreen`). Vacío: la primera vez sin respuestas;
  después, propuestas.

### Solicitud enviada · `/solicitar/{code}/enviada` (nueva)

```
390 px
┌──────────────────────────────────────┐
│           [sello ENVIADA]            │ ← Stamp ink lg (la pantalla cuyo estado es el logro)
│  Tu solicitud por Tobi le llegó      │ (h1, centrado)
│  a Ana.                              │
│  Tenés 1 de 3 solicitudes activas.   │ (sm, muted)
│  [ Ver mis solicitudes ] (secondary) │
│  Seguir mirando animales    (ghost)  │
└──────────────────────────────────────┘
```

- `ApplicationSent` (applications): `HeadedEmptyState` no aplica (no es un vacío): bloque centrado
  propio con `Stamp`, `h1` y dos `LinkButton`. Vacío: no aplica.

### Mis solicitudes · `/mis-solicitudes` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ Mis solicitudes                (h1)  │
│ 2 de 3 solicitudes activas   (sm)    │ ← ActiveCount
│ Activas                        (h2)  │
│ [foto] Tobi        [ENVIADA]         │ ← ApplicationRow (link a Mi solicitud)
│        Enviada el 6 de octubre (xs)  │
│ ──────────────────────────────────── │
│ [foto] Luna  [NO DISPONIBLE POR AHORA]│
│ ──────────────────────────────────── │
│ Cerradas y retiradas           (h2)  │
│ [  —  ] Michi      [CERRADA]         │ ← sin foto si ya no está publicado
│        Ya no está publicado.         │
└──────────────────────────────────────┘
```

- `ApplicationList` (applications) con `ApplicationRow`: foto 56 px (o el hueco de `--color-surface`
  sin foto), nombre, fecha, `Stamp` del estado y, para las cerradas, el motivo en una línea. La fila
  entera es el enlace. Etiquetas y si lleva foto: `applicationView` (pura, R6).
- Vacío: `HeadedEmptyState` «Todavía no mandaste ninguna solicitud.» con `LinkButton` a Animales
  en adopción. Cargando: `loading.tsx` con tres filas de `Skeleton`. Error: `error.tsx`
  (`ErrorScreen`). Llega desde `AccountMenu` (nuevo enlace «Mis solicitudes») y desde «Mi perfil».
- `?retirada=<id>`: `ScreenToast` «Retiraste tu solicitud por <nombre>», con el nombre de esa retirada propia (cambió en Build: con `1` la página no sabe por quién).

### Mi solicitud · `/mis-solicitudes/{id}` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ [foto] Tobi                    (h1)  │ ← enlace a la ficha cuando se puede ver
│ [ENVIADA] desde el 6 de octubre      │
│ ──────────────────────────────────── │
│ ¿Dónde vivís?                 (sm m) │ ← AnswerList: dl, pregunta muted, respuesta base
│ Apartamento                          │
│ ¿Quiénes viven en la casa?           │
│ Mi pareja y yo.                      │
│ ...                                  │
│ Retirar solicitud            (ghost) │ ← WithdrawApplicationDialog, solo activa
└──────────────────────────────────────┘
```

- `AnswerList` (applications): `dl` con las preguntas en el orden de `QUESTIONS`, textos de
  `messages/es.json` (docs/06) y la opción en palabras; las condicionales solo si se contestaron.
- `WithdrawApplicationDialog` (applications, hoja cliente): `DestructiveConfirmDialog` con disparador
  `ghost` (`triggerVariant`), cuerpo de §Pantallas, «Retirar» / «Cancelar». Al salir bien →
  `/mis-solicitudes?retirada=<id>`. `already_withdrawn` y `closed`: el error dentro del diálogo y
  refresca.
- Ajena o inexistente: `notFound()` → `AppNotFound`. Cargando: `loading.tsx`. Error: `error.tsx`.

### Límite alcanzado (rama de `/solicitar/{code}`)

```
390 px
┌──────────────────────────────────────┐
│ Llegaste al máximo de 3        (h1)  │
│ Para solicitar a Nube, retirá una.   │
│ [foto] Tobi   6 oct   Retirar (ghost)│ ← LimitReached: tres filas
│ [foto] Luna   5 oct   Retirar        │
│ [foto] Michi  4 oct   Retirar        │
└──────────────────────────────────────┘
```

- `LimitReached` (applications): filas como `ApplicationRow` compacta, cada una con
  `WithdrawApplicationDialog` sin destino; al salir bien refresca `/solicitar/{code}` y la página
  vuelve a decidir (FR-051). Cambió en Build: la acción no recibe `from`, el diálogo sabe adónde va.

### Hace falta identidad verificada (rama de `/solicitar/{code}`)

```
390 px
┌──────────────────────────────────────┐
│ Luna pide identidad verificada (h1)  │
│ Ana pide que quien solicite haya     │
│ mostrado su cédula. Sirve para que   │
│ sepa que sos una persona real.       │
│ [ VERIFICAR MI IDENTIDAD ]  (tirita) │
│ Volver a Luna               (ghost)  │
└──────────────────────────────────────┘
```

- `IdentityRequired` (applications): con el pedido en revisión, `IdentityStamp` (verification, ya
  existe) «En revisión» con el día y el texto del correo, sin la `tirita`; con el tope de #11, el
  texto de `identityStatusTexts` y el correo de ayuda. «Verificar mi identidad» →
  `/verificar-identidad?pedir=1&animal={code}`.

### Animal que no recibe solicitudes (rama)

- `NotReceiving` (applications): `HeadedEmptyState` «{nombre} no está recibiendo solicitudes» (o
  «no está disponible por ahora» para `unavailable` al enviar) con `LinkButton` a Animales en
  adopción. Sin decir por qué (FR-063).

### Publicar y editar (cambian)

- `RequiredLevelField` (pets): `RadioGroup` `column` «Quién puede solicitar» con dos opciones y una
  línea de ayuda cada una; arranca en teléfono verificado; en editar, una nota `--text-sm` «Vale
  para las solicitudes nuevas». Va en `PetFields`, último grupo antes de `PetSaveFooter`.

### Correo de identidad aprobada (cambia)

- `notice-email-template` sin cambios de forma: un segundo botón «Ver a {nombre}» cuando hay animal.

### Copy y antipatrones

Voseo, frases cortas, el nombre del animal siempre que se pueda. Nunca «postulante», «aplicar» ni
«formulario de adopción»: es una **solicitud** (docs/06). Nunca se dice «bloqueado» a quien solicita
como bloqueada. Nada de signos de exclamación en los frenos. Las opciones se escriben como las diría
alguien: «Menos de 4 horas», «Justo», «No sé».

### Textos (`messages/es.json`)

Namespace nuevo `applications`: `questions.<id>.{label,help?,options.<key>}`, `form.*`,
`errors.*`, `sent.*`, `mine.*` (lista, estados, motivos de cierre, vacío), `detail.*`, `withdraw.*`,
`limit.*`, `identity.*`, `not_receiving.*`, `ficha.{apply,view_mine,required_level}`. `metadata.applications.*`.
`pets.form.required_level.*`. `emails.identity_approved.pet_button`. «Mis solicitudes» del menú va en
`auth.account_menu.my_applications`, junto a los otros enlaces del menú (no existe un namespace `nav`; cambió en Build).

## Qué se testea (y qué no)

Contra docs/09 §Qué vale la pena testear. Cada archivo con test queda al 100 % de mutación.

**Funciones puras (Vitest, al lado del archivo)**

- `lib/schemas/application.ts` — cada pregunta obligatoria; solo espacios cuenta vacío; 500 y 501
  caracteres; opción desconocida; las condicionales: alquilada sin permiso falla, propia con permiso
  descarta el permiso; castrado sin compromiso pasa y con compromiso lo descarta; sin castrar sin
  compromiso falla; contacto en cada respuesta de texto devuelve el campo y el tipo.
- `lib/applications/questionnaire.ts` (`visibleQuestions`) — orden de FR-020 y las dos condicionales.
- `lib/applications/proposed-answers.ts` — de la última solicitud, sin «por qué este animal», sin las
  condicionales que no aplican al animal nuevo; borrador gana sobre propuestas (FR-025, FR-042).
- `lib/applications/apply-gate.ts` — todas las ramas y su orden (FR-003): dueña → `own` en cualquier estado del animal; bloqueada → `not_receiving`
  sin importar nivel; quien bloqueó → `blocked_publisher`; dueña → `own`; activa por el animal antes
  que el límite; límite antes que teléfono; teléfono antes que identidad; nivel 2 con animal que pide
  1; en proceso → `form` con la marca.
- `lib/applications/submit-outcome.ts` — cada resultado de la base a su clave y a si se queda en el
  formulario o navega.
- `lib/applications/application-view.ts` — etiqueta, sello, motivo y foto/enlace para: enviada a la
  vista, enviada con animal pausado/vencido/sin nivel, retirada, cada motivo de cierre, animal
  borrado (sin foto), publicador bloqueado por quien mira (sin foto), bloqueada (con foto).
- `lib/applications/apply-action.ts` (`applyActionKind`) — la tabla de la ficha (FR-001).
- `lib/applications/draft.ts` — leer: otra cuenta, vencido, forma inválida, versión; claves por animal.
- `lib/drafts/account-drafts.ts` (cambia) — borra las claves `application-draft:*` y no otras.
- `lib/analytics/application-events.ts` — cada evento con sus props exactas y sin claves de
  identidad ni respuestas aunque la entrada las traiga (FR-091).
- `lib/pets/draft.ts` (cambia) — un borrador viejo sin `requiredLevel` se lee con 1.

**Base (Vitest contra Supabase local, `tests/db/`)**

- `applications-submit.test.ts`: enviar → `sent`; mismo intento → `already` con el mismo id;
  segunda activa por el mismo animal → `has_active`; cuarta → `limit` (y con dos sesiones a la vez,
  quedan 3: `Promise.all`); `own`; `needs_phone`; `needs_identity` con animal que pide 2 y `sent` con
  nivel 2; `unavailable` pausada, vencida, publicador sin nivel 1; `not_receiving` adoptada, dada
  de baja, publicador suspendido, bloqueada por el publicador; `you_blocked`; `answers_invalid`
  (clave de más, condicional que falta, 501 caracteres, solo espacios); retirar → `withdrawn`,
  dos veces → `already_withdrawn`, ajena → `not_found`, cerrada → `closed`; después de retirar se
  puede volver a enviar.
- `applications-close.test.ts`: pausar y vencer no cambian el estado; adoptar → `adopted`; volver
  a publicar no reabre; borrar el animal → `unpublished` con `pet_id` nulo y `pet_name`; dar de baja →
  `unpublished`; bloquear (publicador a solicitante) → `not_receiving`, (solicitante a publicador) →
  `you_blocked`, desbloquear no reabre; suspender al solicitante → `suspended`, al publicador →
  `unpublished`, reactivar no reabre; borrar la cuenta del publicador → `unpublished`; borrar la del
  solicitante borra sus filas; ningún trigger toca `withdrawn` ni `closed`; el trigger
  forward-only rechaza volver a `sent`.
- `applications-privacy.test.ts` (las dos caras, FR-084): quien solicitó lee la suya con su token
  (`applications` directo, `my_applications`, `my_application`); otra persona con sesión, el
  publicador, quien administra y `anon` no leen ninguna fila ni por la tabla ni por las funciones;
  ninguna columna de ninguna lectura de esta historia trae teléfono ni correo; `apply_context` y
  `submit_application` no se pueden llamar con `anon` ni `authenticated`.
- `applications-level.test.ts`: `publish_pet`/`save_pet` guardan `required_level`, por omisión 1;
  cambiarlo no toca las enviadas; `pet_application_view` para `anon` (nivel, sin `my_active_id`) y con
  sesión (con su activa); `submit_identity_request` con `p_return_code` y `resolve_identity_request`
  devuelve el código; animal borrado → código nulo.
- Paridad: `MAX_ACTIVE_APPLICATIONS`, `ANSWER_MAX_LENGTH` y los ids/opciones de `QUESTIONS` contra
  `application_answers_valid`.

**E2E (Playwright, uno solo: el flujo crítico)**

- `tests/e2e/apply.spec.ts`: sin sesión, ficha de Tobi → «Quiero adoptar» → ingresar → cuestionario;
  alquilada muestra el permiso; un celular en «por qué este animal» no se manda; recargar conserva;
  enviar → enviada; Mis solicitudes con «1 de 3»; la ficha dice «Ver mi solicitud»; retirar →
  la ficha vuelve a «Quiero adoptar».

**Qué no**: las páginas, `ui/`, los componentes que solo pintan (`ApplicationRow`, `AnswerList`,
`ApplicationSent`, las notas), las queries finas, el Route Handler del beacon (solo valida con el
mismo schema de eventos, que sí tiene test).

## Docs que cambian en este PR

- `docs/03-mvp-features.md`: las once decisiones del enjambre de la historia, palabra por palabra
  (§2, §3, §4) — ya en esta rama desde la etapa Spec.
- `docs/06-i18n.md`: §Cuestionario dice que la DB guarda `{ question_id: answer }` (objeto) en lugar
  de `{ question_id, answer }`, con la fecha.
- `docs/10-design-system.md`: los componentes de `applications` en la tabla de §Componentes donde
  componen primitivas (`ApplicationForm`, `WithdrawApplicationDialog` en la lista de
  `DestructiveConfirmDialog`, `RequiredLevelField` en la de `RadioGroup`); `Stamp` lo usa también
  `ApplicationStamp`.
- `docs/10-design-system.md` §Componentes, fila `AccountMenu`: suma «Mis solicitudes» con sesión,
  después de «Mis animales».
- `docs/known-limitations.md`: «le llegó a quien publicó» sin bandeja hasta la historia siguiente
  (se reabre con ella).

## Project Structure

### Documentation (this feature)

```text
specs/014-solicitar-adopcion/
├── story.md
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/routes.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/<ts>_applications.sql         nueva
supabase/seed.sql                                  cuatro animales de Ana (Tobi, Luna, Michi, Nube)
src/lib/supabase/types.ts                          regenerado (pnpm db:types)
src/lib/supabase/queries/applications.ts           nueva: applyContext, submitApplication, withdrawApplication,
                                                   listMyApplications, getMyApplication, getPetApplicationView,
                                                   checkApplicationAttempt, closedApplicationsSince
src/lib/supabase/queries/pets.ts · identity.ts     cambian: required_level, return_code
src/lib/applications/                              questionnaire.ts, rules.ts, apply-gate.ts, apply-action.ts,
                                                   submit-outcome.ts, application-view.ts, proposed-answers.ts,
                                                   draft.ts, paths.ts, types.ts (+ tests)
src/lib/schemas/application.ts (+ test)            nueva
src/lib/schemas/pet.ts                             cambia: requiredLevel
src/lib/drafts/account-drafts.ts                   cambia: claves application-draft:*
src/lib/analytics/application-events.ts (+ test)   nueva · events.ts cambia
src/lib/email/send-identity-result.ts              cambia: botón al animal
src/actions/applications.ts                        nueva
src/actions/pets.ts · pet-status.ts · pet-review.ts · moderation.ts · identity.ts   cambian
src/hooks/use-application-draft.ts · use-application-submit.ts · use-abandon-beacon.ts   nuevos
src/components/applications/                       apply-action.tsx, required-level-line.tsx, application-form.tsx,
                                                   question-field.tsx, application-header.tsx, in-process-note.tsx,
                                                   proposed-answers-note.tsx, contact-later-note.tsx,
                                                   application-sent.tsx, application-list.tsx, my-application-card.tsx,
                                                   answer-list.tsx, withdraw-application-dialog.tsx,
                                                   limit-reached.tsx, identity-required.tsx, not-receiving.tsx,
                                                   application-stamp.tsx
src/components/pets/required-level-field.tsx       nueva · pet-fields.tsx cambia
src/app/[locale]/(public)/animales/[code]/page.tsx cambia
src/app/[locale]/(app)/solicitar/[code]/           page.tsx, loading.tsx, error.tsx, enviada/page.tsx
src/app/[locale]/(app)/mis-solicitudes/            page.tsx, loading.tsx, error.tsx, [id]/page.tsx, [id]/loading.tsx
src/app/[locale]/(app)/verificar-identidad/page.tsx cambia: ?animal=
src/app/[locale]/_components/account-menu.tsx      cambia: «Mis solicitudes»
src/app/api/solicitudes/abandono/route.ts          nueva
messages/es.json                                   applications.*, metadata, pets, emails, nav
tests/db/applications-*.test.ts                    nuevos
tests/e2e/apply.spec.ts                            nuevo
```

## Complexity Tracking

Vacío.

## Para Ship

- `aviso`: hasta la bandeja, solo quien solicitó lee las respuestas; el nivel se controla también
  al enviar; el borrador es por animal; las solicitudes se guardan hasta borrar la cuenta; el beacon
  de abandono (primera vez que el sitio usa `sendBeacon`, sin datos de la persona).
- Limitación conocida: «le llegó a quien publicó» sin bandeja (se reabre con la historia siguiente).
- Las once decisiones del enjambre ya están en docs/03 en esta rama.
