# Implementation Plan: Responder las solicitudes de un animal y hablar por WhatsApp al aceptar

**Branch**: `feature/65-responder-solicitudes-whatsapp` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/015-responder-solicitudes/spec.md` (5 user stories). Decisiones técnicas en
[research.md](./research.md) (R1–R13); tablas y funciones en [data-model.md](./data-model.md);
rutas, acciones, correos y eventos en [contracts/routes.md](./contracts/routes.md).

## Summary

Hoy una solicitud le «llega» al publicador pero nadie más que quien la mandó la puede leer
(KL-63-1). Al terminar, el publicador recibe un correo, abre **Solicitudes**, ve por animal quién
pidió, con su verificación y sus respuestas, y acepta, rechaza con un motivo o pregunta algo. Al
aceptar, las dos personas ven el nombre y el teléfono verificado de hoy de la otra, con «Abrir
WhatsApp» y el mensaje ya escrito. Mi solicitud y Mis solicitudes cuentan cada respuesta; la ficha
le dice al rechazado que no fue aceptado; los cierres de #63 mandan su correo; la portada suma los
dos pasos.

Cinco decisiones ordenan el plan:

1. **Un solo estado** (R1): `applications.status` suma `accepted` y `rejected`; activa = `sent` o
   `accepted`, y todo lo de #63 que contaba activas pasa a contar las dos.
2. **Lo que es solo del publicador no está en la fila que lee quien solicitó** (R2): el motivo del
   rechazo, «abierta» y las preguntas viven en tablas sin permisos, leídas por funciones que eligen
   columnas según quién mira.
3. **El contacto se lee, no se copia** (R4): una función devuelve el teléfono verificado de hoy de
   la otra persona solo en los estados de FR-018.
4. **Los correos salen de una bandeja de salida que escribe la base** (R3) en la misma transacción
   que el cambio; cada acción la vacía al terminar y el cron diario barre lo que quede. Retirar,
   bloquear y suspender no escriben ahí.
5. **Responder son funciones con candado** (R5) que devuelven un `outcome` corto, traducido por una
   función pura; las pantallas deciden qué ofrecer con otra (`publisherActions`).

## Technical Context

**Language/Version**: TypeScript (`strict`), React 19, Next.js 16 (App Router).

**Primary Dependencies**: las de `main`. **Ninguna nueva** (R13).

**Storage**: Postgres de Supabase (local). Una migración nueva (data-model.md).

**Testing**: Vitest (unidad y base local), Playwright (un flujo crítico), Stryker al 100 % sobre lo
que tenga test.

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: el presupuesto de docs/07. Las tres pantallas nuevas son Server Components;
las hojas cliente son los diálogos de aceptar, rechazar, dejar sin efecto y preguntar, la respuesta
de quien solicitó y la oferta de «En proceso». La ficha pública no suma JS (la rama `rejected` de
`ApplyAction` es texto y un enlace). La portada suma dos frases.

**Constraints**: sin Vercel (todo local); nada se indexa (rutas nuevas `noindex`); los correos sin
`RESEND_API_KEY` van a `.artifacts/mail/`.

**Scale/Scope**: 3 páginas nuevas, 6 que cambian (Mi solicitud, Mis solicitudes, Mis animales,
ficha, cuestionario, portada), 1 Route Handler nuevo y 1 que cambia, 1 migración, 1 archivo de
acciones nuevo y 5 que cambian, ~14 componentes nuevos en `components/applications/`, 7 correos.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas ni rutas; el cómo está acá. |
| **II. Una feature, un PR** | Cinco user stories en un PR, en orden: P1 bandeja + aceptar + contacto, P2 rechazar y dejar sin efecto, P3 preguntas, P4 cierres y sus correos, P5 portada. |
| **III. Compuertas verdes** | `pnpm gates:affected` en cada ronda; `pnpm verify` al cerrar; qué se testea en §Qué se testea. |
| **IV. Reglas como código** | Transiciones, quién responde, el tope de preguntas, el contacto visible, la bandeja de salida y el «no volver a solicitar» son funciones y triggers con tests de base; qué ofrecer, el estado en palabras, los días, el orden, el mensaje de WhatsApp, la traducción de cada `outcome` y los schemas son funciones puras con test. |
| **V. Datos personales** | El contacto aparece solo en los estados de FR-018 y lo prueban intentos de leerlo como otra solicitante, antes de aceptar, después de dejar sin efecto, retirar, bloquear y suspender, como quien administra y sin sesión. El motivo del rechazo no está en ninguna fila que quien solicitó pueda leer (R2). Ningún correo, mensaje ni evento lleva teléfono, respuestas, preguntas o motivo. Borrar la cuenta de quien solicitó cascada a todo. |
| **VI. Sin deriva** | Sin chat (3 preguntas, una por vez), sin avisos por WhatsApp ni del teléfono, sin vencimiento ni recordatorios, sin panel de admin. Lo de «No incluye» queda afuera. |
| **VII. Liviana y linda** | Server Components; hojas cliente chicas. Todo contra docs/10: los componentes `ApplicationCard`, `ApplicationStatus` y `ContactReveal` que docs/10 ya reserva para esta historia; ningún token nuevo. |
| **VIII. Autonomía con veto** | `aviso` en Ship: la bandeja de salida de correos (primer outbox del sitio), el contacto de un animal borrado deja de verse, la suspensión del publicador no manda correo, el orden de la bandeja. Nada reservado. |

**Sin violaciones**: Complexity Tracking vacío. Ningún cambio transversal de stack.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. Cargado
`frontend-design:frontend-design` antes de escribir este plan; Build lo vuelve a cargar antes del
primer JSX.

**La idea.** Debajo del cartel de «se busca hogar» quedan las tiritas arrancadas: cada solicitud es
alguien que arrancó una. La bandeja es **el poste de la rescatista**: la pared de sus animales, cada
uno con cuántas tiritas le arrancaron. Las solicitudes de un animal son **la carpeta de fichas**,
una persona por renglón, con la chapita al frente —lo que la rescatista mira primero es quién
responde por esa persona—. Una solicitud es **la ficha de la entrevista**: arriba quién es, abajo lo
que contestó como en un formulario impreso, y al pie la decisión. Aceptar es **darle el número**:
el contacto aparece escrito grande, como en la tirita, y el botón que lo usa.

**Lo único que llama la atención**, por pantalla: en Solicitudes, el conteo de nuevas de cada
animal (sello `ink`); en las de un animal, la marca «Nueva»; en una solicitud esperando respuesta,
«Aceptar» (`tirita`); aceptada, «Abrir WhatsApp» (`tirita`); en Mi solicitud aceptada, «Abrir
WhatsApp» (`tirita`); con una pregunta para contestar, «Enviar respuesta» (`tirita`).

### Tokens

Color: `--color-ink` (texto, botones, el sello de espera), `--color-ink-muted` (fechas, días,
ayudas, «Quedan N»), `--color-line` (divisores entre solicitudes y entre preguntas),
`--color-surface` (la nota de «el contacto se da al aceptar» y la del motivo «solo lo ves vos»),
`--color-primary` y `--color-primary-soft` **solo** en lo verificado: la chapita y el fondo de
`ContactReveal` (el número que aparece es el verificado: es confianza, no acción), `--color-warning`
en «te preguntaron algo» y en «tiene que volver a verificar su teléfono» (le toca actuar a alguien),
`--color-accent` solo en `ErrorText`, `SaveFailedStrip` y el disparador de «Dejar sin efecto»
(`ghost-danger`). Sellos (`Stamp`): `ink` «Esperando respuesta» / «Nueva», `warning` «Te preguntaron
algo» / «Esperando que conteste», `primary` «Aceptada», `muted` «No aceptada» / «Rechazada» /
«Retirada» / «Cerrada». Tipografía: `.afiche` en los `h1` y en el nombre de cada animal de la
bandeja; el teléfono del contacto en `--text-2xl` `tabular-nums` `--font-weight-medium` (es lo que
la persona necesita copiar); `--text-base` en respuestas y preguntas; `--text-sm` en fechas, días y
ayudas. Espacio: `--space-2` dentro de un renglón, `--space-4` entre renglones de la carpeta,
`--space-8` entre bloques. Movimiento: el de `Button`, `Dialog`, `Sheet` y `Toast`; `ContactReveal`
entra con fade de `--dur-base` (`--ease-out`) al aceptar, nada con `prefers-reduced-motion`.
**Ningún token nuevo, ni variante nueva de primitiva.**

### Solicitudes · `/solicitudes` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ Solicitudes                (h1 afiche)│
│ ┌───────────┐ ┌───────────┐          │ ← PetWall `wall`
│ │ [foto 4:5]│ │ [foto 4:5]│          │ ← InboxPetCard (PetPastedPhoto
│ │  ⟦2 NUEVAS⟧│ │           │          │    con Stamp `ink` si hay nuevas)
│ └───────────┘ └───────────┘          │
│ Tobi (afiche lg)  Luna               │
│ 3 esperan         1 espera   (sm)    │
└──────────────────────────────────────┘
Vacío: HeadedEmptyState «Todavía no recibiste solicitudes.» + «Ir a Mis animales»
       (o «Publicar un animal» sin animales).
```

- `InboxPetCard` (applications): la foto pegada como en la pared, enlace a
  `/solicitudes/animal/{petId}`; el sello `ink` «N nuevas» sobre la foto solo si hay; debajo el
  nombre y «N esperan respuesta» en `--text-sm`. Sin foto (el animal no tiene), el recuadro de
  `ApplicationPetPhoto` sin foto.
- `InboxWall` (applications): `PetWall` `wall` con las cards en el orden de `inboxOrder`.
- Cargando: `PetWall` de esqueletos 4:5 con su renglón. Error: `ErrorScreen` con «Reintentar» y
  «Ir a Mis animales».

### Solicitudes de un animal · `/solicitudes/animal/{petId}` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ ← Solicitudes                (TextLink)│
│ [foto 112] Solicitudes por Tobi (h1) │ ← ApplicationPetLayout `small`
│            Ver la ficha    (TextLink)│
│ Esperan respuesta            (h2 lg) │
│ ────────────────────────────────────── │
│ [avatar] Ana                ⟦NUEVA⟧  │ ← ApplicationCard (enlace al renglón entero)
│ (chapita md) Nivel 1 · Pocitos       │
│ Apartamento · balcón con red · 4 a 8 │ ← tres respuestas clave, sm ink-muted
│ Llegó el 3 de octubre · 4 días       │
│ ────────────────────────────────────── │
│ [avatar] Bruno     ⟦ESPERANDO QUE    │
│                      CONTESTE⟧       │
│ ...                                  │
│ Aceptadas                    (h2 lg) │
│ ...                                  │
│ Cerradas                     (h2 lg) │
│ ...                                  │
└──────────────────────────────────────┘
Vacío: HeadedEmptyState «Nadie solicitó a Tobi todavía.» +
       «Compartir a Tobi» (ShareButton de #57) y «Ver la ficha».
```

- `ApplicationCard` (applications, de docs/10): `Avatar md`, nombre, `VerificationBadge` `md`
  (40 px) con el nivel, la zona, tres respuestas clave en palabras (`answerWords`, de #63), la
  fecha y `daysWaiting` mientras espera; a la derecha `ApplicationStatus`. Es un `<a>` de renglón
  entero con `.press`; divisores de `--color-line`, sin caja (es una carpeta, no una pared de
  notas).
- `ApplicationStatus` (applications, de docs/10): sobre `Stamp`; recibe el estado ya decidido por
  `publisherApplicationView` o `applicationView`.
- Grupos con su `h2` solo cuando tienen algo. Cargando: tres renglones esqueleto. Error:
  `ErrorScreen`.

### Una solicitud, para el publicador · `/solicitudes/{id}` (nueva)

```
390 px, esperando respuesta
┌──────────────────────────────────────┐
│ ← Solicitudes por Tobi     (TextLink)│
│ [avatar lg] Ana            (h1 afiche)│ ← ApplicantHeader
│ (chapita lg) Nivel 1 · Pocitos       │
│ Ver su perfil              (TextLink)│ ← desde ahí reporta o bloquea (#13)
│ ⟦ESPERANDO RESPUESTA⟧ desde hace 4 d │
│ Llegó el 3 de octubre por Tobi (sm)  │
│ Lo que contestó               (h2)   │
│ AnswerList (de #63)                  │
│ Lo que le preguntaste         (h2)   │ ← QuestionThread, solo si hay
│ ¿El balcón tiene red...?  (base)     │
│   Sí, en todo el balcón.  (base, sangría, ink)│
│ ┌ El contacto se da al aceptar. ───┐ │ ← ContactLaterNote (de #63, texto propio)
│ └──────────────────────────────────┘ │
│ [ ACEPTAR ]              (tirita lg) │ ← ResponseActions
│ [ Pedir más información ] (secondary)│
│ [ Rechazar ]                 (ghost) │
└──────────────────────────────────────┘

aceptada
│ ⟦ACEPTADA⟧ el 7 de octubre           │
│ ┌──────────────────────────────────┐ │ ← ContactReveal (--color-primary-soft)
│ │ Ana                       (lg)   │ │
│ │ 099 123 456     (2xl tabular)    │ │
│ │ [ ABRIR WHATSAPP ] (tirita lg)   │ │
│ └──────────────────────────────────┘ │
│ ┌ ¿Marcar a Tobi «En proceso»? ────┐ │ ← InProcessOffer, solo tras aceptar
│ │ [Marcar en proceso] (secondary)  │ │    y con Tobi disponible
│ └──────────────────────────────────┘ │
│ Dejar sin efecto      (ghost-danger) │
```

- `ApplicantHeader` (applications): `Avatar lg`, nombre en afiche, `VerificationBadge` `lg`,
  `ProfileLevel`-like línea «Nivel N» y la zona, enlace al perfil público.
- `ResponseActions` (applications): recibe lo que decidió `publisherActions`. «Aceptar» abre
  `AcceptDialog`; sin teléfono de quien solicitó, «Aceptar» va `disabled` con la línea
  `--color-warning` «Ana tiene que volver a verificar su teléfono antes de poder aceptarla.»
  debajo; sin teléfono del publicador, «Aceptar» es un `LinkButton` al aviso de verificación
  (`para=aceptar`). «Pedir más información» abre `AskQuestionSheet`; no se dibuja si no se
  puede; con una pendiente, en su lugar «Le preguntaste algo; esperás que conteste.»
  `--text-sm`. «Rechazar» abre `RejectSheet`.
- `AcceptDialog` (applications, hoja cliente): `Dialog` + `ConfirmBody`: «Al aceptar, Ana va a ver
  tu nombre y tu teléfono, y vos el suyo.» con «Aceptar» / «Cancelar». Error adentro. Al salir
  bien navega a `?aceptada=1`.
- `RejectSheet` / `RevokeSheet` (applications, hoja cliente sobre `Sheet`): `RadioGroup` `column`
  con los motivos (`REJECTION_REASONS`; `RevokeSheet` suma «La adopción no se concretó» primero),
  la línea de «otro» con `CountedTextarea` de dos renglones y tope 200 que aparece con fade al
  elegirlo, la nota `--color-surface` «El motivo lo ves solo vos.», y «Rechazar» (`danger`) /
  «Cancelar» (`ghost`). Errores con `ErrorText` bajo el campo; contacto con la explicación de #63.
- `AskQuestionSheet` (applications, hoja cliente sobre `Sheet`): `CountedTextarea` tope 500, «Te
  quedan N preguntas» en `--text-sm`, `ContactLaterNote`, «Enviar pregunta» (`primary`) /
  «Cancelar». `attemptId` por apertura.
- `QuestionThread` (applications): `ol` de preguntas, la respuesta debajo con sangría
  `--space-4` y borde izquierdo de 2 px `--color-line`; sin contestar, «Todavía no contestó.» en
  `--text-sm` `ink-muted`. Lo usan las dos puntas.
- `ContactReveal` (applications, de docs/10): `revealed` — nombre, `NumberSentence`-like número
  formateado para Uruguay (`formatPhoneNumber`, de #10), «Abrir WhatsApp» en `LinkButton` `tirita` `lg`
  a `/api/solicitudes/{id}/whatsapp`; `no_phone` — «Ana no tiene un teléfono verificado ahora.»
  sin número ni botón. `hidden` no se dibuja (docs/10: «Antes, nada, ni un placeholder»).
- `InProcessOffer` (applications, hoja cliente chica): nota `--color-surface` con «Marcar en
  proceso» `secondary`; al salir bien, `ScreenToast` «Marcaste a Tobi en proceso».
- `RevokeSheet` se abre desde «Dejar sin efecto» (`ghost-danger`).
- Cerrada: el sello y una línea: «Ana ya no sigue con esta solicitud.» · «Se cerró porque la
  bloqueaste.» · «Tobi encontró hogar.» (con `ContactReveal` si estaba aceptada) · «Tobi ya no
  está publicado.» (sin perfil ni respuestas, FR-043). Rechazada: «La rechazaste: pasaría mucho
  tiempo solo.» Sin acciones.
- Cargando: la cabecera y los renglones esqueleto. Error: `ErrorScreen`. Ajena: `AppNotFound`.

### Mi solicitud · `/mis-solicitudes/{id}` (cambia)

```
390 px, te preguntaron algo
│ [foto] Tobi ⟦TE PREGUNTARON ALGO⟧    │ ← ApplicationDetailHeader (de #63)
│ Lo que te preguntaron        (h2)    │
│ ¿El balcón tiene red...?             │ ← QuestionThread
│ [textarea]           Quedan 500      │ ← AnswerQuestionForm
│ ┌ El contacto se da al aceptar ────┐ │
│ [ ENVIAR RESPUESTA ]     (tirita lg) │
│ Lo que contestaste           (h2)    │ ← AnswerList (de #63)
│ Retirar                      (ghost) │

aceptada
│ [foto] Tobi ⟦ACEPTADA⟧               │
│ ContactReveal con el publicador      │
│ ...                                   │
```

- `AnswerQuestionForm` (applications, hoja cliente): `CountedTextarea` tope 500, `ContactLaterNote`,
  «Enviar respuesta» `tirita`, `SaveFailedStrip` si no llega; al salir bien, `ScreenToast`
  «Respuesta enviada» y la pantalla refrescada.
- No aceptada: el sello `muted` «No aceptada» y `TextLink` «Ver animales en adopción». Sin motivo.
- `ApplicationStamp` (de #63) suma `accepted` (`primary` «Aceptada»), `rejected` (`muted` «No
  aceptada»), `info_requested` (`warning` «Te preguntaron algo»); «Enviada» pasa a «Esperando
  respuesta».

### Mis solicitudes · Mis animales · ficha · portada (cambian)

- Mis solicitudes: `MyApplicationCard` con los sellos nuevos. Nada más cambia.
- Mis animales: `MyPetActions` suma, cuando hay nuevas, `TextLink` `block` «2 solicitudes nuevas»
  → la bandeja del animal; sin nuevas pero con solicitudes, «Ver solicitudes».
- Ficha: `ApplyAction` suma `rejected`: «Tu solicitud no fue aceptada.» en `--text-base` y
  `TextLink` «Ver animales en adopción»; ni `tirita` ni sello (no es un estado del animal).
- Portada: `AdopterPromise` suma la cuarta frase; `RescuerSteps` suma su paso al final de la lista.
  Mismos estilos que las frases de al lado.
- `AccountMenu`: «Solicitudes» después de «Mis animales» (lleva a la bandeja); «Mi perfil» suma
  el mismo enlace donde están Mis animales y Mis solicitudes.

### Correos

La plantilla de `sendEmail` sin cambios: título, una frase, el botón, el texto de respaldo y el pie.
Nada de teléfono, respuesta, pregunta ni motivo.

### Copy y antipatrones

Voseo, verbos que dicen lo que pasa («Aceptar», «Rechazar», «Dejar sin efecto», «Enviar pregunta»,
«Abrir WhatsApp»), el mismo verbo en el toast. Sin «¡Felicitaciones!», sin mayúsculas sostenidas
salvo las del sello (que son del `.sello`), sin el verde de WhatsApp: el botón es tinta (§Principios:
el verde es confianza).

### Textos (`messages/es.json`)

`inbox.*` (pantallas del publicador, motivos `inbox.reasons.*`, errores `inbox.errors.*`),
`applications.status.*` (los sellos nuevos), `applications.answer.*`, `applications.whatsapp.*`,
`applications.contact.*`, `emails.applications.<kind>.*`, `home.adopter.apply`,
`home.rescuer.steps.inbox`, `metadata.inbox.*`, `nav.inbox`, `verification.gate.accept_*` (el
motivo «aceptar» del aviso de #10), `analytics` no lleva textos.

## Qué se testea (y qué no)

**Base (`tests/db/`, contra Supabase local)** — lo que expone un dato o engaña:

- `application-responses-privacy.test.ts`: el contacto no se lee antes de aceptar (las dos
  puntas), después de dejar sin efecto, retirar, bloquear (las dos direcciones) y suspender (las
  dos); se lee aceptada y cerrada por adopción estando aceptada; no se lee cerrada por borrado o
  baja; otra solicitante aceptada del mismo animal no lee el de la primera; quien administra, otra
  persona y `anon` no leen contacto, preguntas, motivo ni `publisher_application`; quien solicitó
  no lee `application_reviews` ni `application_notices` con su sesión por ningún camino (tabla,
  función); `publisher_application` de otro publicador devuelve nada; con número a medias o
  recuperado por otra cuenta, `phone` es nulo.
- `application-responses-rules.test.ts`: transiciones válidas e inválidas (forward-only); aceptar
  sin teléfono de una o de otra; rechazar con «otro» sin línea; `not_concluded` solo al dejar sin
  efecto; 3 preguntas y una pendiente; contestar dos veces; contestar una cerrada; doble toque de
  aceptar, rechazar y preguntar (una fila, una notice); el rechazado no vuelve a solicitar ese
  animal ni con el animal vuelto a publicar; una aceptada cuenta entre las 3 y bloquea una segunda
  activa al mismo animal; `gone` para retirada, el bloqueo de quien solicitó y su suspensión;
  `you_blocked` del lado del publicador.
- `application-notices.test.ts`: qué escribe cada camino — enviar (con la regla de R6: dos sin abrir,
  la tercera no; después de `visit_inbox`, sí; otro animal, sí), aceptar, rechazar, dejar sin
  efecto, preguntar, contestar, adoptar (aceptada y esperando), borrar, baja, borrar la cuenta del
  publicador; y que retirar, bloquear y suspender **no** escriben; `claim` borra y no devuelve dos
  veces lo mismo; borrar la cuenta de quien solicitó borra sus notices.

**Unidad (Vitest, con mutación al 100 %)**: `publisherActions`, `publisherApplicationView`,
`applicationView` (estados nuevos), `daysWaiting` (cambio de día en Montevideo, mismo día, UTC
pasada la medianoche local), `inboxOrder`, `petApplicationsOrder`, `whatsappMessage`,
`whatsappUrl` (sin `+`, texto codificado), `responseOutcome`, `rejectionSchema` /
`revocationSchema` / `questionSchema` / `answerSchema` (vacío, solo espacios, 200/201, 500/501,
teléfono, correo, enlace), `applyActionKind` y `applyGate` con `rejected`, los eventos nuevos (sin
ids ni textos), `noticeEmail(kind)` (destino y enlace por tipo; ningún campo de contacto).

**E2E (Playwright)**: `tests/e2e/respond.spec.ts` — con una solicitud sembrada: la publicadora
abre Solicitudes («1 nueva»), abre la solicitud, acepta y confirma, ve el contacto y «Abrir
WhatsApp» con `href` a la ruta propia; la adoptante ve el contacto en Mi solicitud; la publicadora
deja sin efecto y el contacto desaparece de las dos.

**Qué no**: las páginas, `ui/`, los componentes que solo pintan (`InboxPetCard`, `ApplicationCard`,
`ApplicantHeader`, `QuestionThread`, `ContactReveal`), las queries finas, la plantilla de cada
correo, el Route Handler de WhatsApp más allá de su función pura y la función de la base que ya
tiene test.

## Docs que cambian en este PR

- `docs/03-mvp-features.md`: las once decisiones del enjambre de la historia, palabra por palabra
  (§3 y §4) — ya en esta rama desde la etapa Spec.
- `docs/06-i18n.md`: tilda «Plantillas de mensaje de WhatsApp» y «Motivos de rechazo» en §Qué se
  traduce; suma al glosario «aceptada», «rechazada / no aceptada», «dejar sin efecto»
  (`revoke acceptance`), «pregunta» (`question`), «motivo de rechazo» (`rejection reason`) y
  «bandeja / Solicitudes» (`inbox`).
- `docs/10-design-system.md` §Componentes: `ApplicationCard`, `ApplicationStatus` y `ContactReveal`
  pasan de reservados a construidos con lo que quedó; suma `InboxPetCard`, `ApplicantHeader`,
  `ResponseActions`, `AcceptDialog`, `RejectSheet` / `RevokeSheet`, `AskQuestionSheet`,
  `QuestionThread`, `AnswerQuestionForm`, `InProcessOffer`; `ApplicationStamp` con sus estados
  nuevos; `AccountMenu` con «Solicitudes».
- `docs/known-limitations.md`: KL-63-1 se cierra (se marca resuelta por #65).

## Project Structure

### Documentation (this feature)

```text
specs/015-responder-solicitudes/
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
supabase/migrations/<ts>_application_responses.sql nueva
supabase/seed.sql                                  una solicitud de una persona sembrada a un animal de otra
src/lib/supabase/types.ts                          regenerado (pnpm db:types)
src/lib/supabase/queries/application-responses.ts  nueva: publisherInbox, publisherNewCounts, petApplications,
                                                   publisherApplication, applicationQuestions, applicationContact,
                                                   openApplication, visitInbox, acceptApplication, rejectApplication,
                                                   revokeAcceptance, askQuestion, answerQuestion, claimApplicationNotices
src/lib/supabase/queries/applications.ts           cambia: estados nuevos, my_rejected
src/lib/applications/                              rejection.ts, publisher-actions.ts, publisher-view.ts,
                                                   days-waiting.ts, inbox-order.ts, whatsapp.ts, response-outcome.ts,
                                                   notices.ts (+ tests); application-view.ts, apply-action.ts,
                                                   apply-gate.ts, types.ts, paths.ts cambian
src/lib/schemas/application-response.ts (+ test)   nueva
src/lib/analytics/application-events.ts (+ test)   cambia · events.ts cambia
src/lib/email/send-application-notice.ts           nueva · drain-application-notices.ts nueva
src/actions/application-responses.ts               nueva
src/actions/applications.ts                        cambia: answerQuestion
src/actions/pet-status.ts · pet-review.ts · profile.ts (borrar cuenta)   cambian: vaciar la bandeja de salida
src/components/applications/                       inbox-pet-card.tsx, inbox-wall.tsx, application-card.tsx,
                                                   application-status.tsx, applicant-header.tsx, response-actions.tsx,
                                                   accept-dialog.tsx, reject-sheet.tsx, revoke-sheet.tsx,
                                                   ask-question-sheet.tsx, question-thread.tsx, contact-reveal.tsx,
                                                   answer-question-form.tsx, in-process-offer.tsx; apply-action.tsx,
                                                   application-stamp.tsx cambian
src/components/pets/my-pet-actions.tsx             cambia: nuevas
src/components/home/                               adopter-promise.tsx, rescuer-steps.tsx cambian
src/app/[locale]/(app)/solicitudes/                page.tsx, loading.tsx, error.tsx,
                                                   animal/[petId]/{page,loading,error}.tsx, [id]/{page,loading,error}.tsx
src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx cambia
src/app/[locale]/(app)/mis-animales/page.tsx       cambia
src/app/[locale]/_components/account-menu.tsx      cambia: «Solicitudes»
src/app/api/solicitudes/[id]/whatsapp/route.ts     nueva
src/app/api/cron/publicaciones/route.ts            cambia
messages/es.json                                   inbox.*, applications.*, emails.applications.*, home, metadata, nav
tests/db/application-responses-*.test.ts · application-notices.test.ts   nuevos
tests/e2e/respond.spec.ts                          nuevo
```

## Complexity Tracking

Vacío.

## Para Ship

- `aviso`: la bandeja de salida de correos escrita por la base (primer outbox del sitio); el
  contacto deja de verse si el animal se borra o se da de baja (solo la adopción lo conserva); la
  suspensión del publicador no manda correo a sus solicitantes; el orden de la bandeja (nuevas
  primero); el mensaje de WhatsApp usa `APP_NAME` provisorio.
- KL-63-1 se cierra.
- Las once decisiones del enjambre ya están en docs/03 en esta rama.

## Ajustes de Build (US1)

- `InboxWall` y `ApplicationStatus` no se crean: la bandeja usa `ApplicationList` (la misma pared
  `wall`) y el sello de las dos puntas es `ApplicationStamp`, que ya hacía eso. Crearlos duplicaba
  componentes; docs/10 se actualiza en Pulido con esos nombres.
- Los textos van donde ya vivían sus vecinos: «Solicitudes» del menú en `auth.account_menu.inbox`
  (no hay `nav.*`) y los sellos nuevos de quien solicitó en `applications.mine.stamps.*`.
- La base suma `inbox_pet(p_pet)`: «Solicitudes por Tobi» necesita el animal aunque no tenga
  ninguna, y `pet_applications` no devuelve filas en ese caso.
- Los siete correos de `emails.applications.*` entran con US1: el vaciado toma todos los avisos de
  la bandeja de salida, y los cierres por adopción o baja ya los escriben desde esta migración.
- Las lecturas del publicador quedan en `queries/application-responses.ts` y las escrituras y la
  bandeja de salida en `queries/application-response-records.ts`.

## Ajustes de Build (US2)

- `RejectSheet` y `RevokeSheet` son un solo componente, `RejectSheet` con `mode: 'reject' | 'revoke'`:
  cambian solo la lista de motivos, el schema, la acción y el peso del disparador. Dos archivos
  repetían la hoja entera.
- La frase de la ficha y la de Mi solicitud para quien no fue aceptada es la misma pieza,
  `NotAcceptedNote` (frase + enlace a Animales en adopción), usada por `ApplyAction` y Mi solicitud.
- La base guarda el rechazo con un `update` y, si no hay fila, un `insert`: un `insert … on conflict`
  valida los checks sobre la fila nueva, que no trae el `accepted_at` que `not_concluded` necesita.
- `submitOutcome` suma `rejected` (la rechazaron mientras contestaba): lleva a la ficha, que dice que
  no fue aceptada. `applyStoppedEvent` no lo cuenta como freno: no es una verificación ni el límite.
- El publicador ve el motivo en una línea bajo el sello («La rechazaste: …» / «La dejaste sin
  efecto: …»), con `inbox.rejected_line`.
