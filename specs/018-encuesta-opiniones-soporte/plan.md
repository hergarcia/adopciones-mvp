# Implementation Plan: Encuesta al terminar una adopción o no ser elegido, opiniones desde cualquier pantalla y WhatsApp de soporte

**Branch**: `feature/71-encuesta-opiniones-whatsapp-soporte` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/018-encuesta-opiniones-soporte/spec.md` (4 user stories). Decisiones técnicas en
[research.md](./research.md) (R1–R14); tablas y funciones en [data-model.md](./data-model.md);
rutas, acciones y eventos en [contracts/routes.md](./contracts/routes.md).

## Summary

Al abrir Mis animales después de marcar adoptado, o Mi solicitud después de ser elegida o de no
serlo, la base decide si ofrece la encuesta (una cada 30 días, desde el día en que se vio la
anterior) y la pantalla la muestra en su lugar, con la pregunta del momento, tres opciones, la
pregunta abierta, «Enviar» y «Ahora no». Cualquiera, con o sin sesión, manda una opinión desde
«Opinar», arriba en todas las pantallas. El pie lleva Opinar y el WhatsApp de soporte, si el equipo
definió el número. Quien administra lee todo en dos pantallas nuevas de `/revision`.

Cinco decisiones ordenan el plan:

1. **De la persona, solo la oferta** (`survey_offers`, R1); **las respuestas y las opiniones, sin
   nada que las una a nadie** y con solo el día (R4, R8); **las cuentas aparte** (`survey_counts`),
   para que borrar una cuenta no las cambie (R4).
2. **La oferta se decide al abrir la pantalla**, en una función con candado por persona (R2), sobre
   los desenlaces que ya existen en `adoptions` y `applications` (R3); «Yo no adopté» la retira por
   disparador (R5).
3. **Responder, cerrar y opinar son funciones con candado o `attempt_id`**: un doble toque, un
   reintento o dos pestañas dejan una sola (R7, R8).
4. **Opinar vive en `PaperFrame`**: un botón chico arriba y el pie abajo; el `Sheet` se carga al
   primer toque (R10). El WhatsApp pasa por una ruta que mide y redirige (R11).
5. **Opiniones y Encuestas son de `/revision`**, con funciones que solo responden a quien
   administra y `notFound()` para cualquier otra persona (R12).

## Technical Context

**Language/Version**: TypeScript (`strict`), React 19, Next.js 16 (App Router).

**Primary Dependencies**: las de `main`. **Ninguna nueva** (R14).

**Storage**: Postgres de Supabase (local). Una migración nueva. Una cookie `httpOnly` `opinar`.

**Testing**: Vitest (unidad y base local), Playwright (un archivo, dos flujos), Stryker al 100 %
sobre lo que tenga test.

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: el presupuesto de docs/07. En todas las pantallas se suman `FeedbackTrigger`
(una hoja cliente de un botón, < 2 KB) y `SiteFooter` (servidor). `FeedbackSheet` y el formulario
llegan con `import()` al primer toque. `SurveyCard` es una hoja cliente solo en Mis animales y Mi
solicitud, y solo cuando hay una oferta pendiente.

**Constraints**: sin Vercel; nada nuevo se indexa (las pantallas nuevas son `noindex`); sin número
de soporte, nada de WhatsApp en ningún lado.

**Scale/Scope**: 2 páginas nuevas, 4 que cambian (más `PaperFrame`, en todas), 1 migración, 2
archivos de acciones nuevos, 1 route handler, ~8 componentes nuevos.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas ni rutas; el cómo está acá. |
| **II. Una feature, un PR** | Cuatro user stories en un PR, en orden: P1 la encuesta, P2 Opinar, P3 Opiniones y Encuestas, P4 el WhatsApp del pie. |
| **III. Compuertas verdes** | `pnpm gates:affected` en cada ronda; `pnpm verify` al cerrar. |
| **IV. Reglas como código** | Qué desenlace ofrece, los 30 días, `skipped`, «Yo no adopté», el doble toque, el tope del día, quién lee qué y las cuentas que no cambian son funciones y disparadores con tests de base; la pantalla de una opinión, el enlace de WhatsApp, los schemas y los eventos son funciones puras con test. |
| **V. Datos personales** | Respuestas y opiniones sin FK, sin hora, sin navegador; la oferta se borra con la cuenta; nadie salvo quien administra las lee, y los tests lo intentan como `anon`, como otra persona y como quien respondió. Ningún evento lleva texto ni sujeto; el WhatsApp no lleva datos de la persona. |
| **VI. Sin deriva** | Sin tablero, sin correos de encuesta, sin chat, sin responder opiniones, sin editar preguntas, sin FAQ. |
| **VII. Liviana y linda** | Server Components; dos hojas cliente chicas y una cargada a demanda. Todo contra docs/10; ningún token nuevo. |
| **VIII. Autonomía con veto** | `aviso` en Ship: Opinar arriba en la fila de la marca; la encuesta se decide al abrir la pantalla y un desenlace que cae en los 30 días no la ofrece nunca; desenlaces anteriores sin encuesta; la pantalla de una opinión privada se guarda sin sujeto. |

**Sin violaciones**: Complexity Tracking vacío. Ningún cambio transversal de stack.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. Cargado
`frontend-design:frontend-design` antes de escribir este plan; Build lo vuelve a cargar antes del
primer JSX.

**La idea.** La encuesta es **una tira de preguntas pegada al pie del cartel que ya cerró**: un
recuadro con borde de tinta de 2 px debajo del desenlace, nunca encima, nunca un modal. Las tres
opciones son las casillas de papel de `RadioGroup` (una marca, no una tirita arrancada). Opinar es
**una nota que se deja en el buzón del cartel**: un `Sheet` de papel que sube, con una sola frase de
lo que pasa con la nota. Las pantallas de quien administra son **el buzón abierto**: las notas una
debajo de la otra, en texto de lectura, sin tarjetas idénticas ni números grandes; las cuentas de
la encuesta son renglones con barras de tinta proporcionales, que es lo que dicen.

**Lo único que llama la atención**, por pantalla: en Mis animales y Mi solicitud, nada nuevo le
gana a lo que ya estaba (la tirita de la pantalla sigue siendo la de antes; «Enviar» de la encuesta
es `secondary`); en el `Sheet` de Opinar, «Enviar» `primary`; en Encuestas, la barra de la opción
más elegida de cada momento, en tinta llena (las demás en `--color-line`); en Opiniones, el texto.

### Tokens

Color: `--color-ink` (texto, bordes, barras, «Opinar»), `--color-ink-muted` (días, pantalla, «Lo
que contestes llega sin tu nombre», cuentas secundarias), `--color-line` (barras no elegidas,
divisores entre opiniones), `--color-surface` (fondo del pie y del skeleton), `--color-primary-soft`
y la banda `--color-primary` solo en el agradecimiento (`Toast`/tira de éxito), `--color-accent`
solo en `ErrorText` y en «Borrar» confirmado (`DestructiveConfirmDialog`, disparador `ghost` porque
se repite en la lista). Tipografía: `--text-lg` para la pregunta del momento (`h2`), `--text-base`
para opiniones y respuestas libres, `--text-sm` para días, pantalla y cuentas, `.afiche` solo en
títulos de pantalla y del `Sheet`. Espacio: `--space-2` dentro de un renglón, `--space-4` entre
renglones, `--space-8` entre bloques; el pie con `--space-6` arriba y abajo. Movimiento: el de
`Button`, `Sheet` y `Toast`; la encuesta se va con fade de `--dur-base` al enviar, nada con
`prefers-reduced-motion`. **Ningún token nuevo.**

### Todas las pantallas · `PaperFrame` (cambia)

```
390 px
┌──────────────────────────────────────┐
│ [marca]              Opinar  [menú]  │  ← FeedbackTrigger: Button ghost sm
├──────────────────────────────────────┤
│ … la pantalla …                      │
│                                      │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤  SiteFooter, fondo surface
│ ¿Algo para decirnos?  Opinar         │
│ ¿Te trabaste? Escribinos por WhatsApp│  ← TextLink, solo con número
└──────────────────────────────────────┘
```

Sin número: solo la primera línea del pie. El pie no lleva más enlaces (las preguntas frecuentes
son #8). Desde 1024 el pie va dentro de la hoja, con su borde superior de tinta.

### Opinar · `FeedbackSheet` (nuevo)

```
┌──────────────────────────────────────┐
│ Opinar                           [×] │  título afiche
│ Llega sin tu nombre y la lee el      │  text-sm muted
│ equipo. Si querés que te respondan,  │
│ escribinos por WhatsApp.             │  ← TextLink, solo con número
│ ┌──────────────────────────────────┐ │
│ │                                  │ │  CountedTextarea, 1.000
│ └──────────────────────────────────┘ │
│                          0 / 1.000   │
│ [error]                              │  ErrorText
│ [ Enviar ]                           │  Button primary, loading
└──────────────────────────────────────┘
Enviado: el Sheet se cierra y un Toast success «Tu opinión llegó. Gracias.»
```

Estados: quieto · escribiendo · enviando (botón `loading`, textarea deshabilitada) · error (vacío,
largo, contacto, tope, conexión: el texto queda y el foco vuelve al botón) · enviado. Cerrar con
texto escrito no pregunta (la spec no lo pide; el texto es corto); el texto vive en el estado del
`Sheet` mientras la pantalla no cambie. Vacío: no aplica.

### La encuesta · `SurveyCard` (nuevo), en Mis animales y Mi solicitud

```
┌──────────────────────────────────────┐  borde ink 2px, sin cinta ni sello
│ ¿Vas a seguir buscando por acá?      │  h2 text-lg
│ ┌────┐┌─────────┐┌──────────────────┐│
│ │ Sí ││ Tal vez ││No, vuelvo a los  ││  RadioGroup (vertical en 390
│ └────┘└─────────┘│grupos            ││  si no entra en una fila)
│                  └──────────────────┘│
│ ¿Algo más que quieras contarnos?     │  label
│ ┌──────────────────────────────────┐ │  CountedTextarea, 500
│ └──────────────────────────────────┘ │
│ Lo que contestes llega sin tu nombre.│  text-sm muted
│ [error]                              │
│ [ Enviar ]   Ahora no                │  secondary + ghost
└──────────────────────────────────────┘
Enviada: el recuadro se reemplaza por «Gracias por contarnos.» (text-base, banda primary),
que no vuelve al recargar.
```

En Mis animales va arriba de la tarjeta del animal adoptado, a todo el ancho de la grilla; en Mi
solicitud, debajo de `AdoptionPanel` o de la nota de no aceptada o cerrada. Estados: quieto ·
enviando (los dos botones apagados, «Enviar» en `loading`) · error (sin opción, largo, contacto,
conexión; lo elegido y escrito quedan) · enviada · cerrada (desaparece, sin aviso). Sin oferta
pendiente, nada: las pantallas quedan como estaban.

### Opiniones · `/revision/opiniones` (nueva)

```
Opiniones                                  afiche 2xl
3 opiniones                                text-base muted (como /revision)
─────────────────────────────────────
no entiendo por qué me piden el teléfono   text-base
para preguntar
8 de octubre · Ficha de Luna   Borrar      text-sm muted + DestructiveConfirmDialog (ghost)
─────────────────────────────────────
…
[ Ver más ]                                secondary, solo si hay más
```

Vacío: `EmptyState` «Todavía no llegó ninguna opinión.» Cargando: `Skeleton` de tres renglones de
dos líneas. Error: `ErrorScreen` con «Reintentar». La fecha y la pantalla van en una línea con
coma, no con `·` (docs/10 §Principios 5); el wireframe abrevia.

### Encuestas · `/revision/encuestas` (nueva)

```
Encuestas                                  afiche 2xl
── ¿El próximo animal que des en adopción lo publicarías acá?   h2 text-lg
   Se ofrecieron 12, se respondieron 7, se cerraron 3.          text-sm muted
   Sí        ████████████  5                                   barra ink (la mayor)
   Tal vez   ███           1                                   barra line
   No        ███           1
   Lo que escribieron
   «me ahorró las entrevistas por WhatsApp»                     text-base
   3 de octubre, Sí                                             text-sm muted
   [ Ver más ]
── (los otros dos momentos igual)
```

Vacío por momento: las cuentas en cero, sin barras, y «Todavía nadie respondió esta encuesta.».
Cargando: `Skeleton` con la forma de un momento, tres veces. Error: `ErrorScreen`.

### Componentes

Reusados: `Button`, `LinkButton`, `TextLink`, `Sheet`, `RadioGroup`, `CountedTextarea`,
`CharacterCount`, `ErrorText`, `Toast`/`ToastProvider`, `DestructiveConfirmDialog`, `EmptyState`,
`Skeleton`, `ErrorScreen`, `PageShell`, `PaperFrame`, `MyPetsGrid` (suma `surveys:
ReadonlyMap<string, ReactNode>`, como `followUps`).

Nuevos: `components/feedback/feedback-trigger.tsx` (cliente, carga el sheet),
`components/feedback/feedback-sheet.tsx` (cliente), `components/feedback/feedback-list.tsx`,
`components/surveys/survey-card.tsx` (cliente), `components/surveys/survey-summary.tsx`,
`components/surveys/survey-option-bars.tsx`, `components/surveys/survey-answer-list.tsx`,
`app/[locale]/_components/site-footer.tsx`. Los de dominio reciben los textos y los datos por
props y nunca hacen fetch; `SurveyCard` y `FeedbackSheet` reciben la acción por props.

### Copy y antipatrones

Voseo, oración con mayúscula inicial. «Enviar» se llama igual en la encuesta y en Opinar; su
éxito dice «llegó»/«Gracias». Sin `→`, sin mayúsculas sostenidas, sin `·` en el texto real, sin
números grandes con etiqueta chica en Encuestas. El error de contacto nombra lo que encontró
(«Sacá “099 123 456”: no puede llevar un teléfono ni un correo.»), como #65.

### Textos (`messages/es.json`)

Namespaces nuevos: `feedback.*` (trigger, sheet, errores, toast, pie, pantallas para Opiniones),
`surveys.*` (las tres preguntas y sus opciones por clave, la abierta, botones, gracias, errores,
Encuestas), `support.*` (el saludo de WhatsApp con `{app}`, el texto del enlace), `metadata.review.
feedback` y `metadata.review.surveys`.

## Qué se testea (y qué no)

**Base (`tests/db/`, contra Supabase local)**:

- `surveys-privacy.test.ts`: `survey_offers`, `survey_answers`, `survey_counts`, `feedback` y
  `feedback_quota` no se leen ni escriben con `anon` ni con una sesión; las cuatro `admin_*`
  devuelven nada a `anon`, a una persona y a quien respondió; `survey_for`/`answer_survey`/
  `dismiss_survey` de la oferta de otra → `not_found`; ninguna columna de `survey_answers` ni
  `feedback` referencia a una persona.
- `surveys-rules.test.ts`: cada desenlace de R3 ofrece y ningún otro cierre (`withdrawn`,
  `unpublished`, `not_receiving`, `you_blocked`, `suspended`, `handed_over` como no elegido) ofrece;
  un desenlace anterior a `since` no ofrece; 30 días: a los 29 `skipped` y nunca después, a los 30
  `pending`; dos desenlaces → uno `pending`, el otro `skipped`; `my_pets_survey` con tres adopciones
  → una; volver a llamar no cambia nada; «Yo no adopté» con `pending` borra la fila y resta
  `offered`, con `answered` no; `answer_survey` dos veces → `already` y una respuesta; después de
  `dismiss_survey` → `dismissed` y ninguna respuesta; opción ajena al momento → `invalid`; 501
  caracteres → `invalid`; cuenta suspendida → nada que ofrecer y `suspended`; borrar la cuenta que
  respondió deja `admin_survey_summary` igual.
- `feedback-rules.test.ts`: `send_feedback` con `anon`: `sent`; mismo `attempt_id` → `already` y
  una fila; la sexta del día del mismo navegador → `limit`, otro navegador → `sent`; al otro día
  → `sent` y la cuota de ayer borrada; vacío, solo espacios, 1.001 y `screen` desconocida →
  `invalid`; `admin_delete_feedback` por quien administra borra, por otra persona no.

**Unidad (Vitest, con mutación al 100 %)**: `feedbackScreen` (cada ruta pública con y sin sujeto,
cada privada sin sujeto, el prefijo de idioma, una desconocida → `other`), `supportWhatsAppUrl`
(número nulo → nulo, el saludo codificado, sin datos), `feedbackSchema` y `surveyAnswerSchema`
(vacío, solo espacios, límites 500/501 y 1.000/1.001, teléfono, correo, «500 caracteres» pasa,
opción de otro momento), `surveyQuestion` (pregunta y opciones por momento), los eventos nuevos
(sin texto ni sujeto), `surveyOutcome`/`feedbackOutcome` (cada resultado de la base a su clave;
`already` y `dismissed` son éxito), `optionBars` (proporciones, la mayor marcada, todo en cero).

**E2E (Playwright)**: `tests/e2e/survey-feedback.spec.ts` — (1) sin sesión, en la ficha de un
animal sembrado: Opinar, un teléfono (el aviso, el texto queda), corregir y enviar; como quien
administra, la opinión en Opiniones con «Ficha de <nombre>». (2) quien publica rechaza una solicitud
sembrada; quien la mandó abre Mi solicitud, ve «¿Vas a seguir buscando por acá?», elige y envía;
Encuestas cuenta 1 ofrecida y 1 respondida.

**Qué no**: las páginas, `ui/`, los componentes que solo pintan (`SiteFooter`, `FeedbackList`,
`SurveySummary`, `SurveyAnswerList`), las queries finas, el route handler (su lógica son
`feedbackScreen` y `supportWhatsAppUrl`).

## Docs que cambian en este PR

- `docs/03-mvp-features.md`: las nueve decisiones del enjambre, palabra por palabra (§7) — ya en
  esta rama desde la etapa Spec.
- `docs/06-i18n.md`: glosario «encuesta» (`survey`), «opinión» (`feedback`), «Ahora no»
  (`dismiss`), «WhatsApp de soporte» (`support WhatsApp`).
- `docs/10-design-system.md` §Componentes: `FeedbackTrigger`, `FeedbackSheet`, `FeedbackList`,
  `SiteFooter`, `SurveyCard`, `SurveySummary`, `SurveyOptionBars`, `SurveyAnswerList`; `PaperFrame`
  con Opinar y el pie; `MyPetsGrid` con `surveys`.
- `docs/known-limitations.md`: el tope por navegador se salta borrando cookies; el cruce posible de
  días en una beta chica (R4).
- `.env.example`: `NEXT_PUBLIC_SUPPORT_WHATSAPP=` vacío.

## Project Structure

### Documentation (this feature)

```text
specs/018-encuesta-opiniones-soporte/
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
supabase/migrations/<ts>_surveys_feedback.sql       nueva
src/lib/supabase/types.ts                           regenerado (pnpm db:types)
src/lib/supabase/queries/surveys.ts                 nueva: surveyFor, myPetsSurvey, answerSurvey, dismissSurvey,
                                                    surveySummary, surveyAnswers
src/lib/supabase/queries/feedback.ts                nueva: sendFeedback, listFeedback, deleteFeedback
src/lib/config.ts                                   cambia: SUPPORT_WHATSAPP
src/lib/support/whatsapp.ts (+ test)                nueva
src/lib/feedback/screens.ts (+ test)                nueva
src/lib/feedback/outcomes.ts (+ test)               nueva
src/lib/surveys/questions.ts · outcomes.ts · option-bars.ts · types.ts (+ tests)   nuevas
src/lib/schemas/feedback.ts · survey.ts (+ tests)   nuevas
src/lib/analytics/survey-events.ts (+ test)         nueva · events.ts cambia
src/actions/surveys.ts · feedback.ts                nuevas
src/app/api/soporte/whatsapp/route.ts               nueva
src/components/feedback/                            feedback-trigger.tsx, feedback-sheet.tsx, feedback-list.tsx
src/components/surveys/                             survey-card.tsx, survey-summary.tsx, survey-option-bars.tsx,
                                                    survey-answer-list.tsx
src/components/pets/my-pets-grid.tsx                cambia: surveys por pet.id
src/app/[locale]/_components/paper-frame.tsx        cambia: async, FeedbackTrigger y SiteFooter
src/app/[locale]/_components/site-footer.tsx        nueva
src/app/[locale]/_components/survey-texts.ts · feedback-texts.ts   nuevas
src/app/[locale]/(app)/mis-animales/page.tsx        cambia
src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx   cambia
src/app/[locale]/(app)/revision/page.tsx            cambia: caminos
src/app/[locale]/(app)/revision/opiniones/          page.tsx, loading.tsx, error.tsx nuevas
src/app/[locale]/(app)/revision/encuestas/          page.tsx, loading.tsx, error.tsx nuevas
messages/es.json                                    feedback.*, surveys.*, support.*, metadata.review.*
tests/db/surveys-privacy.test.ts · surveys-rules.test.ts · feedback-rules.test.ts   nuevos
tests/e2e/survey-feedback.spec.ts                   nuevo
```

`MyPetsGrid` recibe la encuesta por un mapa de nodos (`surveys`, por `pet.id`) que llena la página,
como `followUps`: `components/pets` no importa de `components/surveys`.

## Cambios de Build

- US1: `survey_for(p_moment, p_application)` recibe la solicitud también para `adopted` y la base
  resuelve la adopción más reciente que eligió a quien llama: Mi solicitud no conoce el id de la
  adopción. `gave` se ofrece solo por `my_pets_survey`.
- US1: la regla «solo teléfono y correo» es `phoneOrEmailMatch` en `lib/contact/contact-match.ts`,
  que busca solo esas dos vías (con `contactMatch`, un enlace antes de un teléfono lo taparía).
- US1: las etiquetas de las opciones van planas en `surveys.options.*` (Sí, Tal vez, Más o menos,
  No, No, vuelvo a los grupos): la misma palabra en los tres momentos, y las claves quedan tipadas.
- US1: la pregunta del momento es la `legend` `lg` del `RadioGroup` y el nombre de la sección, no un
  `h2` aparte que la repetiría al lector de pantalla.
- US1: `MyPetsGrid` pasa la encuesta a `PetWall` por un `above` nuevo: un renglón a todo el ancho
  antes de la card de ese animal.
- US1: la solicitud propia que «Yo no adopté» cerró como que encontró hogar no ofrece «no fue
  elegida» (research R3).

## Complexity Tracking

Vacío.

## Para Ship

- `aviso`: Opinar en la fila de la marca (no flotante); la oferta se decide al abrir la pantalla y
  un desenlace dentro de los 30 días no la ofrece nunca; los desenlaces anteriores al arranque no
  ofrecen; la pantalla de una opinión privada se guarda sin sujeto; respuestas y opiniones solo con
  el día; el tope por cookie.
- Las nueve decisiones del enjambre ya están en docs/03 §7 en esta rama.
