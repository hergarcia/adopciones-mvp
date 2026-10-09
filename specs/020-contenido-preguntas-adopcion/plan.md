# Implementation Plan: Contenido que responde las preguntas que frenan una adopción

**Branch**: `feature/8-contenido-preguntas-frenan-adopcion` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/020-contenido-preguntas-adopcion/spec.md` (3 user stories). Decisiones técnicas en
[research.md](./research.md) (R1–R13); el registro del contenido, las claves y los eventos en
[data-model.md](./data-model.md); lo que las páginas prometen hacia afuera en
[contracts/preguntas.md](./contracts/preguntas.md). Sin base de datos: la historia no guarda nada.

## Summary

Hoy no hay ninguna página de contenido. Al terminar, `/preguntas` es el índice «Preguntas y
respuestas», con las cinco preguntas en tres grupos (quien da en adopción, quien adopta, todos), y
cada `/preguntas/<slug>` responde su pregunta en el primer párrafo, sigue con el detalle y cierra
con la fecha de última actualización, dos relacionadas y una sola acción. El pie de todas las
pantallas (salvo la de cuenta suspendida) suma el renglón al índice; el pedido de verificación de
identidad, antes de aceptar, y «Qué dice cada nivel» suman el enlace a «Cómo se verifica». Pegado en
WhatsApp, cada enlace arma su tarjeta con la pregunta. Todo sale del servidor y se lee sin
JavaScript.

Cinco decisiones ordenan el plan:

1. **El texto en `messages/es.json`, la estructura en un registro tipado** (R1): las reglas de la
   spec (grupo, relacionadas, una acción, fuentes oficiales, ≤ 3 oraciones, fecha) se prueban sobre
   el registro y las claves, no sobre JSX.
2. **«Cómo se verifica» no copia texto** (R2): usa las mismas claves que «Qué dice cada nivel» y que
   «Qué hacemos con ellas», y un test ata su fecha a esas claves.
3. **La medición por `referer`**, como la portada y la ficha (R7): tres eventos nuevos, ninguno con
   la dirección ni la cuenta; FR-052 sale de unir por visita con los eventos que #11 ya emite.
4. **La tarjeta compartida reusa la imagen de la portada** (R5) y `robots.txt` abre `/preguntas` a
   los lectores de vista previa, como `/animales`.
5. **Lo legal se respalda en Build con `sources.md`** (R11): cada dato con su URL oficial y la cita;
   lo que no se respalda no se escribe.

## Technical Context

**Language/Version**: TypeScript (`strict`), React 19, Next.js 16 (App Router), las versiones de
`main`.

**Primary Dependencies**: las de `main`. **Ninguna nueva** (sin MDX ni librería de contenido: R1).

**Storage**: no aplica. Ninguna migración, tabla ni consulta nueva.

**Testing**: Vitest para las reglas puras del contenido (`lib/questions/`), el registro contra
`messages/es.json` (`tests/questions/`), la medición (`question-events`) y la extracción de
metadatos; Playwright contra `next start` para dos flujos (`preguntas.spec.ts`). Stryker al 100 %
sobre lo que tiene test.

**Target Platform**: web, mobile-first a 390 px; revisión a 390 y 1280.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: LCP < 2,5 s, JS de apertura ≤ 150 KB, Lighthouse mobile ≥ 90 en `/preguntas`
y en una página (se suman a `.lighthouserc.json`). Ninguna hoja cliente nueva: todo lo de
`components/questions/` es Server Component; la única hoja cliente nueva es `preguntas/error.tsx`,
sin next-intl, como el `error.tsx` de la zona. `IdentityConsent` no tiene directiva: corre en el
cliente porque lo importa `IdentityRequestForm`; su cuerpo, extraído como `IdentityConsentBody` sin
directiva ni hooks, renderiza en el servidor desde «Cómo se verifica» y sigue en el bundle del
formulario como hoy (R8). El JS de `/verificar-identidad` solo suma el enlace.

**Constraints**: sin JavaScript todo se lee y cada enlace lleva; nada se indexa (`INDEXING_ENABLED`
sigue en `false`); ningún texto fuera de `messages/es.json`; ningún color fuera de los tokens; el
nombre del sitio solo de `APP_NAME`.

**Scale/Scope**: 2 rutas nuevas (`(public)/preguntas`, `(public)/preguntas/[slug]`) con su layout,
`loading`, `error` y `not-found`; 10 componentes nuevos en `components/questions/`; 1 módulo nuevo en
`lib/questions/` (7 archivos: `pages`, `paths`, `groups`, `sentences`, `sources`, `facts`, `dates`), 1 en `lib/analytics/`, 1 en `lib/og/`; cambios chicos en
`SiteFooter`, `PaperFrame`, `(suspended)/layout`, `IdentityConsent`, `LevelsExplanation`,
`LevelStep`, `identity-texts.ts`, `PublicErrorCopy`, `robots.ts`, la portada (extracción de
metadatos), `/niveles`, `/verificar-identidad`, `/mis-animales/publicar` y `/animales` (un evento);
~5 páginas de texto en `messages/es.json`; 1 e2e nuevo.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra rutas ni componentes; el cómo está acá y en research.md. |
| **II. Una feature, un PR** | Tres user stories en un PR: P1 las páginas, P2 el índice y el pie, P3 los enlaces desde el pedido y los niveles. Cada una se prueba sola. |
| **III. Compuertas verdes** | `pnpm verify`. Se testea lo que engaña a una persona si se rompe: el conteo de oraciones, los grupos y relacionadas, las fuentes oficiales, que «Cómo se verifica» use las mismas claves y su fecha, la medición. Nada para páginas ni `ui/`. |
| **IV. Reglas como código** | Cada regla de contenido verificable sin criterio humano es un test sobre el registro y `messages/es.json` (`src/lib/questions/pages.test.ts`): ≤ 3 oraciones, ≤ 160 caracteres en la tarjeta, una acción, relacionadas válidas, fuentes oficiales, fecha válida y no futura. |
| **V. Datos personales** | No se guarda ni se muestra nada de nadie. Los eventos no llevan cuenta ni dirección; el origen es una de cinco palabras en una página y de dos en el índice. Los ejemplos con nombre son inventados y lo dicen (FR-013). |
| **VI. Sin deriva** | Nada de «Fuera del MVP». Lo que la historia excluye (blog, edición en el sitio, otro idioma, videos, FAQ de veinte, contenido de usuarios, cambiar los dos textos de #11 y #12, asesoramiento, indexar) queda afuera. El 410 de una página retirada queda como KL (R4). |
| **VII. Liviana y linda** | Server Components; cero hojas cliente nuevas; diseño de docs/10 (§Diseño). El skill `frontend-design:frontend-design` no está disponible en esta sesión: el criterio es docs/10, y la revisión del design-reviewer con capturas a 390 y 1280 de las cinco páginas, el índice, la página que no está, `/niveles` y el pedido es obligatoria antes de Ship. |
| **VIII. Autonomía con veto** | Se decide y se avisa en Ship: el nombre «Preguntas y respuestas», el renglón del pie primero, la grilla de dos columnas desde 1024 con el cierre (fecha, relacionadas, acción) a la derecha de la respuesta en vez de al final (FR-003 se cumple en el orden del DOM y en el teléfono), la KL del 410. Nada reservado: no se prende la indexación. |

**Sin violaciones**, con una excepción registrada: si la sesión de Build no tiene
`frontend-design:frontend-design`, la tarea T000 la registra como `aviso` y el control compensatorio
es la revisión obligatoria del design-reviewer a 390 y 1280 (principio VII). Complexity Tracking
vacío.

## Project Structure

### Documentation (this feature)

```text
specs/020-contenido-preguntas-adopcion/
├── story.md, spec.md, checklists/requirements.md
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/preguntas.md
├── sources.md        # Build: una fila por dato legal (URL, cita, fecha de consulta)
└── tasks.md          # /speckit-tasks
```

### Source Code

```text
src/
  app/[locale]/(public)/preguntas/
    layout.tsx               PublicErrorCopyProvider con questions.error.* y la salida al índice
    loading.tsx              QuestionSkeleton
    error.tsx                ErrorScreen + TextLink a la salida (cliente, sin next-intl)
    page.tsx                 el índice: metadata, redirectIfSuspended, evento, QuestionIndex
    [slug]/page.tsx          una página: metadata, notFound, redirectIfSuspended, evento,
                             QuestionLayout con QuestionArticle + QuestionFooter + QuestionJsonLd
    [slug]/not-found.tsx     QuestionNotFound
  app/[locale]/(public)/niveles/page.tsx          + more → /preguntas/como-se-verifica
  app/[locale]/(app)/verificar-identidad/page.tsx + question_action_used antes de requireProfile
  app/[locale]/(app)/mis-animales/publicar/page.tsx + question_action_used (junto al de la portada)
  app/[locale]/(public)/animales/page.tsx         + question_action_used
  app/[locale]/(public)/page.tsx                  usa siteShareMetadata (extracción)
  app/[locale]/(suspended)/layout.tsx             PaperFrame questions={false}
  app/[locale]/_components/paper-frame.tsx        prop questions; el renglón del pie
  app/[locale]/_components/site-footer.tsx        prop questions: Line | null, primero
  app/[locale]/_components/identity-texts.ts      identityConsentTexts() extraída; learnMore
  app/[locale]/_components/public-error-copy.tsx  exits?: { index, listing } (href + label)
  app/[locale]/_components/question-texts.ts      arma los textos de una página y del índice
  app/robots.ts                                    + QUESTIONS_PATH para LINK_PREVIEW_AGENTS
  components/questions/
    question-layout.tsx      la grilla: artículo y cierre (una columna; dos desde 1024)
    question-article.tsx     h1, respuesta, secciones (con SourceLinks) y bloques compartidos
    question-section.tsx     h2 + párrafos + fuentes de una sección
    source-link.tsx          el enlace a una fuente oficial, en otra pestaña
    question-footer.tsx      UpdatedOn, RelatedQuestions y QuestionAction
    related-questions.tsx    «También te puede servir»: lista de enlaces o el enlace al índice
    question-index.tsx       el índice: grupos (h2 + lista) o el vacío
    question-not-found.tsx   HeadedEmptyState + tirita al índice
    question-skeleton.tsx    la forma de la página mientras carga
    question-json-ld.tsx     BreadcrumbList + Article, sin dibujo
  components/verification/identity-consent.tsx    + learnMore, solo sin aceptar
  components/verification/levels-explanation.tsx  + more
  components/verification/level-step.tsx          + headingLevel (2 | 3)
  lib/questions/
    pages.ts                 el registro (data-model), GROUP_ORDER, ACTION_PATH, questionBySlug
    paths.ts                 QUESTIONS_PATH, questionPath(slug), isQuestionPath, questionSlugOf
    groups.ts                questionGroups, relatedFor
    sentences.ts             sentenceCount
    sources.ts               OFFICIAL_SOURCE_HOSTS, isOfficialSource
    facts.ts                 QUESTION_FACTS: las cifras desde las constantes reales (R2)
    dates.ts                 formatUpdatedOn (R13)
  lib/analytics/question-events.ts                questionViewEvent, questionsIndexViewEvent,
                                                  questionActionEvent
  lib/analytics/events.ts                         + los tres eventos y sus props
  lib/og/site-share-metadata.ts                   openGraph + twitter con la imagen de la portada
messages/es.json                                  questions.* + 3 claves en namespaces existentes
docs/08-convenciones-codigo.md, docs/03-mvp-features.md   las nueve decisiones de la historia
                                                  (copiadas en Spec, en esta rama)
docs/06-i18n.md                                   la fila «chip / RENAC», si la fuente oficial no
                                                  dice «obligatorio» (spec, Assumptions)
docs/10-design-system.md                          filas de componentes y la decisión de la grilla
docs/known-limitations.md                         KL nueva: el 410 de una página retirada (R4)
specs/020-…/sources.md                            Build: la comprobación de cada dato legal
src/lib/questions/pages.test.ts                  el registro contra messages/es.json
tests/questions/shared-texts.test.ts              hash de las claves compartidas ↔ updatedOn
tests/e2e/preguntas.spec.ts                       dos flujos críticos
```

**Structure Decision**: la de F00. Las rutas en `(public)` (hoja `wall`, cabecera y pie ya
puestos); el dominio nuevo es `questions` en `components/` y `lib/`. Ninguna consulta ni acción.
Los componentes de dominio reciben el texto ya traducido y el objeto del registro por props; las
rutas arman los textos con `question-texts.ts` (patrón `home-texts.ts`).

## Diseño

Guía: `docs/10-design-system.md`, identidad «Cartel». Zona `(public)`: papel `wall`
(`--container-listing`, 1200), cabecera `AccountMenu`, pie `SiteFooter`. `PageShell` `full`, con la
medida de lectura puesta por `QuestionLayout` en la columna del texto.

### Página de contenido — 390 px

```
┌──────────────────────────────────┐
│ Adopciones          Opinar Entrar│  AccountMenu (sin cambios)
├──────────────────────────────────┤
│ ¿Cómo reconocer una              │  h1 .afiche --text-2xl tinta
│ estafa antes de adoptar?         │
│                                  │
│ La señal más común es que te     │  p --text-lg tinta: la respuesta
│ pidan plata por adelantado o el  │  (1–3 oraciones; arriba del pliegue,
│ flete de un animal que no viste. │   SC-002)
│ Acá nadie cobra nada: …          │
│                                  │
│ Lo que piden las estafas         │  h2 --text-xl bold
│ Texto del detalle…               │  p --text-base, --measure
│ …                                │  (en «Qué exige Uruguay», cada dato
│                                  │   lleva su SourceLink: «Fuente: …»)
│ …                                │
│ ──────────────────────────────── │  divisor 2 px --color-line
│ Actualizada el 9 de octubre de   │  time --text-sm ink-muted
│ 2026.                            │
│ También te puede servir          │  h2 --text-lg bold
│ El compromiso y los 30 días      │  TextLink block (las dos relacionadas)
│ Cómo se verifica                 │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ [ VER ANIMALES EN ADOPCIÓN     ] │  LinkButton tirita lg, ancho completo
├──────────────────────────────────┤
│ ¿Dudas antes de adoptar…?        │  SiteFooter: renglón nuevo, primero
│   Preguntas y respuestas         │
│ ¿Algo para decirnos? Opinar      │
│ ¿Te trabaste? Escribinos…        │
└──────────────────────────────────┘
```

«Cómo se verifica» suma, entre las secciones propias, dos bloques compartidos con su `h2`
(«Los tres niveles» y «Qué pasa con tu cédula»): la escalera de `LevelStep` (con `headingLevel={3}`,
sin resaltar ninguno) y, debajo, `IdentityConsentBody` —el cuerpo de `IdentityConsent` extraído sin directiva ni hooks, la `Card
taped` con las tres promesas y la lista de detalles—, con el `TextLink` «Qué dice cada nivel» a
`/niveles`. `IdentityConsentBody` recibe `headingLevel` (2 | 3, por omisión 2, como `LevelStep`): en
«Cómo se verifica» sus dos títulos («Qué te pedimos» y «Qué hacemos con ellas») van como `h3` debajo
del `h2` «Qué pasa con tu cédula» (`questions.identity_title`), sin repetir ninguno. «El compromiso y
los 30 días» suma un bloque compartido, «Lo que dice el compromiso»: **`CommitmentText` tal cual**
(`clauses`, `note`), con los textos de `commitmentTexts()` (`lib/adoptions/commitment-texts.ts`, la
misma función de Mi solicitud y del correo) sobre los nombres de ejemplo
(`questions.example.*`, con la castración incluida), y debajo la nota «El ejemplo es inventado.» en
`--text-sm` `ink-muted`. Las cifras de los párrafos (2 días,
7 días, 3 rechazos en 30 días, 30 días, 1 a 3 fotos) llegan de `QUESTION_FACTS`.

### Página de contenido — 1280 px (hoja de 1200)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Adopciones                              Animales en adopción  Opinar  Entrar │
├──────────────────────────────────────────────────────────────────────────────┤
│ ¿Cómo reconocer una estafa antes de adoptar?                                 │
│                                                                              │
│ La señal más común es que te pidan …     │ Actualizada el 9 de octubre de    │
│ (--measure, 640)                         │ 2026.                             │
│                                          │ También te puede servir           │
│ Lo que piden las estafas                 │ El compromiso y los 30 días       │
│ …                                        │ Cómo se verifica                  │
│                                          │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄       │
│                                          │ [ VER ANIMALES EN ADOPCIÓN  ]     │
│                                          │  (columna derecha, sticky top)    │
└──────────────────────────────────────────────────────────────────────────────┘
```

`QuestionLayout` recibe tres huecos: `heading` (el `h1`), `article` (la respuesta y el detalle) y
`closing` (`QuestionFooter`). El `h1` va arriba, fuera de la grilla, con `max-w-[var(--measure)]`
(una pregunta larga no se estira a 1200). Desde 1024, debajo, una grilla
`[minmax(0,var(--measure))_minmax(0,1fr)]` con `--space-16` entre columnas: el artículo a la
izquierda y el cierre a la derecha, `sticky` arriba con `--space-6`, sin divisor (lo separa el
aire); así el cierre arranca a la altura de la respuesta, como en el boceto. En el DOM el cierre va después del artículo,
así el lector de pantalla y el teléfono lo leen al final. Es agregar una columna, no rediseñar
(docs/10 §Pantallas anchas): el mismo contenido en todos los anchos; una columna de 640 sola en una
hoja de 1200 es lo que docs/10 descarta. La tirita es la acción de la pantalla y está a la vista en
la primera pantalla a 1280 — es un enlace, no un formulario, así que no necesita estar al final del
texto.

### Índice — 390 px y 1280 px

```
390 px                                   1280 px
┌──────────────────────────────┐         ┌──────────────────────────────────────────────────┐
│ Preguntas y respuestas       │ h1      │ Preguntas y respuestas                           │
│ Lo que conviene saber antes  │ lead    │ Lo que conviene saber antes de dar el paso.      │
│ de dar el paso.              │ ink-mut │                                                  │
│                              │         │ Si das en      │ Si adoptás      │ Para todos     │
│ Si das en adopción           │ h2 xl   │ adopción       │                 │                │
│ ¿Qué pedir y qué mirar antes │ TextLink│ ¿Qué pedir…?   │ ¿Cómo reconocer │ ¿Cómo se       │
│ de entregar un animal…?      │ block   │ ¿Qué exige     │ una estafa…?    │ verifica…?     │
│ ¿Qué exige Uruguay sobre…?   │ medium  │ Uruguay…?      │ ¿Qué es el      │                │
│                              │         │                │ compromiso…?    │                │
│ Si adoptás                   │         │  (3 columnas desde 1024, divisores verticales     │
│ …                            │         │   de 2 px --color-line, como «Mis avales»)        │
│ Para todos                   │         └──────────────────────────────────────────────────┘
│ ¿Cómo se verifica…?          │
└──────────────────────────────┘
```

Cada grupo es una `section` con su `h2` y una lista (`ul`) de `TextLink` `block` `medium` (la
pregunta, `--text-lg`). Sin cards: es una lista de lectura, no una pared. El índice no tiene tirita:
no hay una acción principal, se elige una pregunta. Vacío: `EmptyState` «Estamos escribiendo esto»
con `LinkButton` `secondary` «Ver animales en adopción».

### No está, cargando y error

```
No está (390 px)                 Vacío del índice (390 px)        Cargando (390 px)
┌──────────────────────────┐     ┌──────────────────────────┐     ┌──────────────────────────┐
│ Adopciones  Opinar Entrar│     │ Preguntas y respuestas   │ h1  │ ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐   │ h1: 2 renglones
├──────────────────────────┤     │                          │     │ └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘   │ de --text-2xl
│                          │     │        (poste con        │     │ ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐ │ la respuesta:
│   Esta página no está    │ h1  │      cartel en blanco)   │     │ │                      │ │ 3 renglones de
│ Puede que la dirección   │     │  Estamos escribiendo     │     │ └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘ │ --text-lg
│ esté mal escrita o que   │     │  esto.                   │     │ ┌┄┄┄┄┄┄┄┄┄┄┐             │ un h2
│ la hayamos sacado.       │     │ [Ver animales en adopción]│    │ ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐ │ y dos párrafos
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │     │   LinkButton secondary   │     │ └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘ │ (Skeleton sobre
│ [VER TODAS LAS PREGUNTAS]│     │                          │     │                          │  --color-surface)
│  (centrado, HeadedEmpty) │     │  (centrado, EmptyState)  │     │  (a la izquierda, en la  │
└──────────────────────────┘     └──────────────────────────┘     │   columna de lectura)    │
                                                                  └──────────────────────────┘
```

- **No está** (`QuestionNotFound`): `HeadedEmptyState` «Esta página no está», «Puede que la
  dirección esté mal escrita o que la hayamos sacado.», `LinkButton` `tirita` «Ver todas las
  preguntas» del ancho de su texto desde 768 (como `ProfileNotFound`).
- **Cargando** (`QuestionSkeleton`): `Skeleton` del título (dos renglones de `--text-2xl`), de la
  respuesta (tres renglones de `--text-lg`) y de un `h2` con dos párrafos; en la columna de lectura.
- **Error**: `ErrorScreen` con `questions.error.body` («No pudimos mostrar esta página.»),
  «Reintentar» y, debajo, `TextLink` a la salida: «Ver todas las preguntas» (`/preguntas`) desde
  una página; «Ver animales en adopción» (`/animales`) desde el índice. `preguntas/layout.tsx` pasa
  las dos salidas en `PublicErrorCopy.exits` (`{ index, listing }`, ya traducidas) y
  `preguntas/error.tsx` elige con `usePathname()`: en el índice, el listado; en una página, el
  índice.

### Enlaces nuevos en pantallas que ya existen

- **Pie** (`SiteFooter`): el renglón «¿Dudas antes de adoptar o de dar en adopción?» con el
  `NavLink` «Preguntas y respuestas», con el mismo estilo de los otros dos y primero. Sin número de
  soporte quedan dos renglones. La fila de `SiteFooter` en docs/10 se actualiza con la decisión
  fechada (y deja de decir «Sin otros enlaces (las preguntas frecuentes son #8)»).
- **Pedido de identidad** (`IdentityConsent`, sin aceptar): `TextLink` `block` «Cómo se verifica y
  qué se hace con tu cédula» debajo de la lista de detalles de «Qué hacemos con ellas», antes de la
  tirita «Acepto y elijo las fotos». En tinta, sin verde (el verde es de lo verificado).
- **«Qué dice cada nivel»** (`LevelsExplanation`): `TextLink` `block` «Cómo se verifica y qué se
  muestra de cada persona» entre la escalera y «Volver».

### Componentes

| Componente | Capa | Reusa / nuevo | Qué hace |
|---|---|---|---|
| `PaperFrame` `wall`, `AccountMenu`, `PageShell` `full` | app | reusa | La hoja de la zona pública. |
| `SiteFooter` | app | cambia | Suma `questions: Line \| null`, el primer renglón. |
| `ErrorScreen`, `PublicErrorCopyProvider` | app | reusa / cambia | El error de la zona, con `exits` opcional. |
| `HeadedEmptyState`, `EmptyState`, `Skeleton` | ui | reusa | No está, el vacío del índice, el cargando. |
| `LinkButton` `tirita` `lg` / `secondary` | ui | reusa | La acción de la página; la salida del vacío. |
| `TextLink` `block` `medium` / `inline` | ui | reusa | Las preguntas del índice, las relacionadas, las fuentes, los enlaces nuevos. |
| `NavLink` | app | reusa | El enlace del pie, con `aria-current` en el índice. |
| `Card` `taped` | ui | reusa | Las tres promesas de la cédula, como en el pedido. |
| `LevelStep` | verification | cambia | `headingLevel` 2 \| 3 (por omisión 2): en «Cómo se verifica» va debajo de un `h2`. |
| `LevelsExplanation` | verification | cambia | `more` opcional. |
| `IdentityConsent` → `IdentityConsentBody` | verification | extrae | El cuerpo sin estado, sin directiva ni hooks, usado por el consentimiento (cliente) y por «Cómo se verifica»; `headingLevel` 2 \| 3; `learnMore` solo en el pedido sin aceptar. |
| `CommitmentText` | adoptions | reusa | El compromiso de ejemplo en «El compromiso y los 30 días», sin cambios. |
| `QuestionLayout` | questions | nuevo | Una columna; desde 1024 artículo + cierre `sticky`. |
| `QuestionArticle` | questions | nuevo | `h1`, la respuesta en `--text-lg`, las secciones y los bloques compartidos (recibidos como `ReactNode`). |
| `QuestionSection` | questions | nuevo | `h2` `--text-xl` bold, párrafos `--text-base`, `SourceLink`s. |
| `SourceLink` | questions | nuevo | «Fuente: <etiqueta>» `TextLink` `inline` en otra pestaña con `rel="noopener"`; `--text-sm`. |
| `QuestionFooter` | questions | nuevo | La fecha (`time`), `RelatedQuestions` y la acción (`LinkButton` `tirita` `lg`). |
| `RelatedQuestions` | questions | nuevo | `h2` y la lista, o el enlace al índice si quedó vacía. |
| `QuestionIndex` | questions | nuevo | Los grupos o el vacío. |
| `QuestionNotFound` | questions | nuevo | La página que no está. |
| `QuestionSkeleton` | questions | nuevo | El cargando. |
| `QuestionJsonLd` | questions | nuevo | Datos estructurados, sin dibujo. |

Se suman a la tabla de componentes de docs/10 las filas de los diez nuevos de `questions` y de
`IdentityConsentBody`, y se actualizan las de `SiteFooter`, `LevelsExplanation` y `IdentityConsent`,
con la decisión de la grilla desde 1024 fechada en §Pantallas anchas.

### Tokens

`--color-ink`, `--color-ink-muted`, `--color-line` (divisores del índice y del cierre en el
teléfono), `--color-canvas`, `--color-surface` (`Skeleton`, el vacío), `--color-primary` (solo las
chapitas de la escalera y los tildes de las promesas, que ya lo usan), `--text-2xl` (el `h1`),
`--text-xl` (los `h2`), `--text-lg` (la respuesta, las preguntas del índice), `--text-base`,
`--text-sm` (la fecha, las fuentes), `--space-2/4/6/8/10/16`, `--measure`, `--container-listing`,
`.afiche` (el `h1`), `.perforado` (la tirita), `.cinta` (la `Card taped`). **Sin
`--color-accent`**: ninguna pantalla nueva tiene urgencia ni error salvo el `ErrorScreen`.

### El elemento que se lleva la atención

En una página: **la respuesta**, el primer párrafo en `--text-lg` debajo del `h1`. Es lo que la
historia promete y lo que se lee en el teléfono antes de decidir si seguir; la tirita de la acción
es la segunda y está al final (a la derecha desde 1024). En el índice: **la lista de preguntas**,
sin tirita.

### Los tres estados de cada bloque con datos

| Bloque | Cargando | Vacío | Error |
|---|---|---|---|
| Página | `QuestionSkeleton` | no aplica (siempre tiene texto) | `ErrorScreen` + «Ver todas las preguntas» |
| Índice | `QuestionSkeleton` (misma forma de título + lista) | `EmptyState` «Estamos escribiendo esto» + «Ver animales en adopción» | `ErrorScreen` + «Ver animales en adopción» |
| Relacionadas | — (vienen del registro) | el enlace «Ver todas las preguntas» | — |
| Página que no está | — | `QuestionNotFound` | — |

### Textos

Voseo, oración con mayúscula inicial, verbos activos. Las preguntas son preguntas («¿…?»); los `h2`
del detalle, frases cortas. Ningún «haga clic», ninguna flecha en los botones, ningún separador
`·`. «Preguntas y respuestas» se llama igual en el pie, el `h1` y la tarjeta. Cada ejemplo con
nombre lleva «El ejemplo es inventado.» (FR-013). El contenido de las páginas lo escribe Build
con estas reglas, la spec (qué responde cada primer párrafo, qué aconsejan, el compromiso, los 30
días) y docs/06 (glosario: `application` = solicitud, «compromiso de adopción» no es contrato).

## Tests (solo lo que vale la pena)

| Archivo | Qué afirma | Por qué |
|---|---|---|
| `src/lib/questions/sentences.test.ts` | `sentenceCount`: 1, 2, 3 y 4 oraciones con `.`, `?`, `!`; «art. 5», «n.º 3», «Dr.», «Ley 18.471», «2,5», «R.E.N.A.C.» no cierran; texto vacío = 0; espacios finales. | FR-002: si cuenta mal, una página «pasa» con 4 oraciones o falla con 3. |
| `src/lib/questions/groups.test.ts` | `questionGroups`: el orden `giver → adopter → everyone` venga como venga el registro; un grupo sin publicadas no aparece; sin publicadas `[]`. `relatedFor`: nunca la propia, solo publicadas, en el orden del registro; `[]` cuando las dos se retiraron. | FR-020/021 y las relacionadas: un orden o una lista mal armada engaña a quien busca. |
| `src/lib/questions/sources.test.ts` | `isOfficialSource`: `https://www.impo.com.uy/…` y `https://www.gub.uy/…` sí; `http://`, `https://impo.com.uy.evil.com`, `https://www.elobservador.com.uy`, un texto que no es URL, no. | FR-011: una fuente que no es oficial es justo la respuesta interesada que la historia reemplaza. |
| `src/lib/questions/dates.test.ts` | `formatUpdatedOn('2026-10-09', 'es-UY')` → «9 de octubre de 2026» y `'2026-01-01'` → «1 de enero de 2026», con el reloj fijo (`vi.setSystemTime`) en `2026-10-09T23:30:00-03:00`, que en UTC ya es el 10; un día inválido (`'2026-13-01'`, `'9/10/2026'`) lanza. | La fecha es un cálculo con caso borde: un `new Date()` en UTC mostraría el día anterior. |
| `src/lib/questions/paths.test.ts` | `questionSlugOf`: `/preguntas/como-se-verifica` → el slug; `/preguntas`, `/preguntas/otra`, `/preguntas/como-se-verifica/x`, `/niveles` → `null`. | Base de la medición y de la acción. |
| `src/lib/analytics/question-events.test.ts` | Cada origen de `question_viewed` por `referer` (`/preguntas`, `/niveles`, `/verificar-identidad`, otra página, otro host con la misma ruta, sin `referer`, una URL inválida); `questions_index_viewed` `footer`/`link`; `question_action_used` solo con `referer` de una página publicada del mismo host **cuya acción es el destino**: `antes-de-entregar` → `/mis-animales/publicar` emite, `antes-de-entregar` → `/animales` (la cabecera) `null`, `reconocer-una-estafa` → `/animales` emite (también si vino de la cabecera: límite aceptado, research R7), `como-se-verifica` → `/verificar-identidad` emite; un lector de vista previa → `null`. | FR-050/051/053: una medición que miente sobre de dónde llega la gente decide mal qué escribir. |
| `src/lib/og/site-share-metadata.test.ts` | Lo que puede romperse: la URL de la imagen lleva `?v=` con la versión de `siteShareVersion` y cambia con el nombre; `og:site_name` = `APP_NAME`; la tarjeta de Twitter es `summary_large_image` con la misma URL; título y descripción son los que se pasan. | La tarjeta es la promesa de FR-040 en tres pantallas, y sin la versión las apps de mensajería muestran la imagen vieja (FR-026 de #61). |
| `src/lib/questions/pages.test.ts` | `questionBySlug`: cada uno de los cinco slugs → su página; `'Antes-De-Entregar'`, `'antes-de-entregar '`, `''`, `'antes-de-entrega'`, `'como-se-verifica/x'` → `null` (FR-015). Y el registro: contra una tabla **escrita a mano en el test** (slug → grupo, acción, las dos relacionadas en orden y `shared`: `como-se-verifica` → `['levels','identity_images']`, `compromiso-y-seguimiento` → `['commitment']`, las demás sin), `GROUP_ORDER` = `['giver','adopter','everyone']` literal, `ACTION_PATH` literal (`/verificar-identidad`, `/mis-animales/publicar`, `/animales`) y `OFFICIAL_SOURCE_HOSTS` literal: el registro es igual. Sobre `messages/es.json`: cada `answer` con 1–3 oraciones y ≤ 400 caracteres (el tope que deja la pregunta y la respuesta arriba del pliegue a 390 × 844, SC-002; «Qué exige Uruguay» es la más larga); cada `title` ≤ 80 caracteres y termina en «?»; cada `card` ≤ 160; `updatedOn` es un día válido y no futuro; toda fuente pasa `isOfficialSource` y tiene etiqueta; toda sección tiene sus `p1…pN` y ninguna clave de `questions.<slug>.*` queda sin usar (así un mutante en un `id` o en `paragraphs` rompe el test); ninguna clave `questions.*` repite el texto de `verification.levels.asks_N`/`says_N`, de las siete de `identity.request.use_*`/`what_body` ni de `adoptions.commitment.clauses.*` (una copia en vez de la clave compartida falla, SC-003); toda página con `shared` `commitment` tiene `example_note` (FR-013). | Las reglas de contenido de la spec como código (constitución IV); los topes de largo sostienen SC-002 en las cinco páginas. |
| `tests/questions/shared-texts.test.ts` | Por página, el hash de lo que toma de afuera (R2: claves de niveles, cédula y compromiso, y los valores de `QUESTION_FACTS`) es el anotado junto a su `updatedOn`. | Casos borde: la fecha cambia cuando cambia lo que la página repite. |
| `tests/e2e/preguntas.spec.ts` | (1) Sin sesión, a 390 × 844: el pie lleva al índice y el índice a una página (SC-005, lo único que prueba que los enlaces nuevos existen en el HTML real); en las cinco páginas, el `h1` y el primer párrafo terminan dentro de los 844 px (SC-002, depende del CSS real); el texto de los tres niveles en `/niveles` y en `/preguntas/como-se-verifica` es el mismo (SC-003 en la app real). (2) Con una persona de nivel 1 sin pedido: `/verificar-identidad` → «Cómo se verifica y qué se hace con tu cédula» → volver atrás con el navegador (`page.goBack()`, el «atrás» real, que puede restaurar desde el bfcache) → la vista de pedir sin aceptar; después de «Acepto y elijo las fotos» el enlace no está (SC-006, el «atrás» del navegador no lo prueba nada más). | Los dos flujos críticos. La página que no está la cubre el test de `questionBySlug`. |

Mutación: `scripts/mutation.mjs` muta solo los archivos con test hermano y corre solo ese test, así
que las reglas del registro van en `src/lib/questions/pages.test.ts`, al lado de `pages.ts`, y no en
`tests/`. Las cadenas de los `id` de sección y los `paragraphs` los mata ese test (una clave que no
existe en `messages/es.json` falla). `components/questions/` no tiene test hermano, así que no se
muta. `tests/questions/shared-texts.test.ts` no está atado a un archivo mutado: es una compuerta de
contenido. Un equivalente que quede se anota en su línea.

**Nada** para las páginas, `components/questions/` (solo pintan), `ui/`, `robots.ts` (lo cubre la
vista previa en quickstart y el e2e de #57 ya fija el patrón), ni «renderiza sin explotar».
`SiteFooter`, `LevelsExplanation` e `IdentityConsent` no ganan conducta que dependa del dominio:
un enlace más.

## Fuera de este plan

- El 410 de una página retirada (R4): KL nueva en `docs/known-limitations.md`.
- Prender la indexación y el sitemap (#76). `INDEXING_ENABLED` no se toca.
- Una imagen de vista previa por página (R5).

## Cambios en Build

Donde el código contradijo el plan, cambió el plan (US1, 2026-10-09):

- **`siteShareMetadata({ title, description, phrase })`**: recibe también la frase de la imagen de
  la portada, porque la versión `?v=` y el texto alternativo salen de esa frase y no del título de
  la página; la función queda pura y sin leer traducciones.
- **`relatedFor(page, published)`** recibe la página y no el slug: quien la llama ya la tiene, y
  buscarla de nuevo dejaba una rama que nunca pasa (un mutante que no se puede matar).
- **`IDENTITY_PATH`** pasa a `src/lib/verification/paths.ts`: el registro (`lib/`) no importa de
  `app/`. `identity-texts.ts` lo reexporta, así nada más cambia.
- **El hash de lo compartido** vive en `src/lib/questions/shared-texts.test.ts` y no en
  `tests/questions/`: el proyecto `unit` de Vitest solo incluye `src/**`, y sumar la carpeta era
  tocar `vitest.config.ts`. Sigue sin archivo hermano, así que no se muta.
- **Las claves de una página** se arman desde el registro con una sola conversión de tipo
  (`question-texts.ts`, anotada): TypeScript no cruza cada slug con sus propias secciones. Lo que el
  plan quería de `typecheck` lo da `pages.test.ts`, que falla con cualquier clave que falte o sobre.
- **Extracciones por la regla de dos**: `levelSteps()` (los textos de la escalera, de `/niveles` y
  «Cómo se verifica»), `LevelLadder` (la `ol` de `LevelStep`, de `LevelsExplanation` y «Cómo se
  verifica»), `trackQuestionAction(destino)` (las tres pantallas de destino) y `formatUpdatedOn`
  sobre `lostDayLabel`, que ya formateaba un día sin zona. Los bloques compartidos los arma
  `preguntas/[slug]/_components/shared-blocks.tsx`, para que la página quede en composición.
- **Lo compartido va después de la primera sección propia**, que lo presenta: en «Cómo se
  verifica», «Qué ve cualquiera de vos» → los niveles → la cédula → «Cómo se revisa la cédula»; en
  «El compromiso y los 30 días», «Un acuerdo de palabra» → el compromiso de ejemplo → «Los 30
  días».
- **Una dirección que no es una página responde 200** con «Esta página no está» dibujada en el
  servidor y `noindex`, no 404: el `loading.tsx` del segmento abre el `Suspense` antes de que la
  página llame `notFound()`. Es el mismo caso que la ficha (`animales/[code]/page.tsx`), y nada se
  indexa todavía.
- **La fuente del RENAC** es el Decreto 106/023 (IMPO) en vez de la página del registro en gub.uy:
  es la norma que lo describe. Desde el contenedor IMPO y gub.uy no abren; `sources.md` dice cómo
  se tomaron las citas y que quien revisa las compara abriendo cada enlace.
- **T032 trabada**: `.lighthouserc.json` es una compuerta que la sesión del enjambre no escribe
  (`guard-rules`, docs/09 §Las reglas no se tocan solas). Las dos URLs van al `aviso` de la
  historia.

## Complexity Tracking

Vacío.
