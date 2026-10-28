# Implementation Plan: Preguntar qué frena a quien deja la verificación a mitad de camino

**Branch**: `feature/234-preguntar-que-frena-verificacion` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/027-que-frena-verificacion/spec.md`

## Summary

Cuando alguien que nunca terminó de verificar el teléfono o la identidad toca «Ahora no» o «Cancelar
la verificación», la misma pantalla cambia el formulario por «¿Qué te frena…?» con cinco opciones:
una opción la manda y sale al destino de siempre; «Seguir sin contestar» sale sin mandar nada. Se le
pregunta una sola vez por nivel. De la persona queda solo la marca de nivel; la respuesta se guarda
sin ella, con el nivel, el origen (publicar, solicitar, por su cuenta) y el día. Encuestas suma «Por
qué no se verificaron». Una sola respuesta por pregunta sin unirla a nadie: un ticket aleatorio, sin
persona, que vive en una cookie y se consume al contestar (research R3).

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Supabase con `@supabase/ssr`). **Ninguna
dependencia nueva.**

**Storage**: Supabase Postgres local; una migración forward-only con cuatro tablas sin políticas y
siete funciones (data-model.md)

**Testing**: Vitest (unitarias y `tests/db` contra Supabase local), Stryker al 100 % sobre lo que
tiene test, Playwright (un flujo)

**Target Platform**: web mobile-first, 390 px y 1280 px

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: sin JS nuevo en las pantallas públicas; la pregunta es una hoja cliente chica
solo en las pantallas de verificación, que ya cargan `IdentityRequestForm` / `PhoneNumberForm`.
Presupuesto de siempre: JS inicial < 150 KB, LCP < 2,5 s, Lighthouse mobile ≥ 90

**Constraints**: Ley 18.331 (la respuesta sin la persona, sin la hora ni el animal); salir nunca se
traba; la pregunta suma como mucho un toque

**Scale/Scope**: beta de 3-5 rescatistas; tres pantallas tocadas (verificar teléfono, escribir el
código, pedido de identidad) y una sección nueva en Encuestas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra tablas, rutas ni componentes; el cómo vive acá y en research. |
| II. Una feature, un PR | Tres user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R10: lógica pura y schema con Stryker al 100 %, privacidad y reglas en `tests/db`, un e2e. |
| IV. Reglas como código | La regla «una vez por nivel», la elegibilidad, «una sola respuesta» y el tope de 300 viven en la base y tienen prueba; el contacto en el schema compartido. |
| V. Datos mínimos y privados | De la persona solo la marca de nivel (sin día); la respuesta y el ticket sin persona; tablas sin políticas, funciones que preguntan quién es; prueba que intenta leer cada tabla como visitante y como persona. |
| VI. Sin deriva | No se toca la encuesta de #71, ni los niveles, ni las pantallas de #25, ni «Cancelar el cambio». |
| VII. Liviana y linda | Server Components; `ExitQuestion` es la única hoja cliente nueva; tokens y componentes de docs/10; tres estados de cada bloque con datos (§Diseño). |
| VIII. Autonomía con veto | Las decisiones de la historia van a docs/03 §7 en esta rama; ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/027-que-frena-verificacion/
├── story.md             # cuerpo verbatim de la historia #234
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/server-actions.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/<ts>_verification_exits.sql        # nuevo: tablas, funciones, grants
src/lib/supabase/types.ts                              # regenerado con pnpm db:types
src/lib/verification/exit-question.ts                  # nuevo: niveles, orígenes, opciones, exitPlaceOf, exitOrigin, exitDestination, exitQuestionPath
src/lib/verification/exit-question.test.ts             # nuevo
src/lib/verification/exit-cookie.ts                    # nuevo: nombre y opciones de la cookie por nivel
src/lib/schemas/verification-exit.ts                   # nuevo: verificationExitAnswerSchema
src/lib/schemas/verification-exit.test.ts              # nuevo
src/lib/surveys/exit-summary.ts                        # nuevo: exitSummaryBlocks
src/lib/surveys/exit-summary.test.ts                   # nuevo
src/lib/analytics/events.ts                            # +3 eventos
src/lib/analytics/verification-exit-events.ts          # nuevo
src/lib/analytics/verification-exit-events.test.ts     # nuevo
src/lib/supabase/queries/verification-exits.ts         # nuevo: la única puerta a las tablas nuevas
src/actions/verification-exit.ts                       # nuevo: leaveVerification, answerVerificationExit, skipVerificationExit
src/actions/phone.ts                                   # cancelPendingPhone pregunta si corresponde
src/lib/verification/exit-ask.ts                       # nuevo: askExitQuestion, la pregunta que comparten «Ahora no» y «Cancelar la verificación»
src/components/verification/not-now-button.tsx         # nuevo: «Ahora no» que pregunta (form del servidor)
src/components/verification/not-now.tsx                # nuevo: NotNowLink o NotNowButton según NotNowTarget (tres pantallas)
src/components/verification/exit-question.tsx          # nuevo: la pregunta (hoja cliente)
src/hooks/use-exit-answer.ts                           # nuevo: mandar, seguir sin contestar y salir (el estado de ExitQuestion)
src/components/verification/verify-heading.tsx         # id y foco por código para el título de la pregunta
src/components/ui/button.tsx                           # variante align: start, las opciones a lo ancho con texto a la izquierda
src/components/verification/verify-phone-screen.tsx    # «Ahora no» por prop: enlace o botón
src/components/verification/code-entry-screen.tsx      # ídem
src/components/verification/identity-request-form.tsx  # ídem
src/components/surveys/exit-origin-table.tsx           # nuevo: la tabla por origen
src/app/[locale]/(app)/verificar-telefono/page.tsx     # lee pregunta=1, due, arma la pregunta
src/app/[locale]/(app)/verificar-telefono/codigo/page.tsx
src/app/[locale]/(app)/verificar-identidad/page.tsx
src/app/[locale]/_components/verification-exit-texts.ts # nuevo: textos de la pregunta por nivel
src/app/[locale]/(app)/_components/exit-question-screen.tsx # nuevo: ExitQuestion con sus textos y acciones, para las tres pantallas
src/app/[locale]/(app)/revision/encuestas/page.tsx     # suma la sección
src/app/[locale]/(app)/revision/encuestas/_components/survey-moments.tsx  # moreHref conserva todo
src/app/[locale]/(app)/revision/encuestas/_components/verification-exits.tsx  # nuevo: arma los dos bloques
src/app/[locale]/(app)/revision/encuestas/loading.tsx  # suma la forma de la sección
messages/es.json                                       # verification.exit.*, surveys.exits.*
docs/10-design-system.md                               # filas de NotNowButton, ExitQuestion, ExitOriginTable
docs/03-mvp-features.md                                # las cuatro decisiones (ya en esta rama)
tests/db/verification-exits-privacy.test.ts            # nuevo
tests/db/verification-exits-rules.test.ts              # nuevo
tests/db/verification-exits-support.ts                 # nuevo
tests/e2e/verificacion-salida.spec.ts                  # nuevo
```

**Structure Decision**: la de F00 (CLAUDE.md §Estructura). Dominio `verification` para la pregunta;
dominio `surveys` para lo que lee quien administra, junto a lo de #71.

## Diseño

Cargado antes de escribir: docs/10 (§Componentes, §Color, §Textos, §Cómo se aplica) y el patrón de
`SurveyCard`, `SurveySummary` y `CancelPendingButton`. La pregunta y el apartado son pantallas de
trabajo: nada nuevo en tokens.

### La pregunta (verificar teléfono, escribir el código, pedido de identidad) — 390 px

```
┌──────────────────────────────────────┐
│ [cabecera de la hoja]                │
│                                      │
│ ¿Qué te frena para verificar         │  ← h1, VerifyHeading (voz de afiche)
│ tu identidad?                        │
│ Lo que contestes llega sin tu nombre.│  ← bajada, --text-sm ink-muted
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ No quiero mandar fotos de mi     │ │  ← Button secondary, a lo ancho,
│ │ cédula                           │ │    44 px mín., texto a la izquierda
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Ahora no puedo, lo hago más tarde│ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Me parece demasiado              │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Prefiero seguir por el grupo de  │ │
│ │ Facebook o WhatsApp              │ │
│ └──────────────────────────────────┘ │
│ ▸ Otra cosa                          │  ← Disclosure (details nativo, ghost)
│   ┌────────────────────────────────┐ │     abierto:
│   │ CountedTextarea, 300, 3 líneas │ │     etiqueta «Contanos qué» (opcional)
│   └────────────────────────────────┘ │
│   Quedan 12            [ Enviar ]    │  ← CharacterCount · Button secondary
│                                      │
│ [SaveFailedStrip si no llegó]        │
│                                      │
│ Seguir sin contestar                 │  ← FormSubmit/Button ghost, donde estaba
│                                      │    «Ahora no» (mt-8, self-start)
└──────────────────────────────────────┘
```

A 1280 px: la misma columna en la medida de lectura (`PageShell` por defecto en teléfono; en
identidad, el bloque dentro de `max-w-[var(--measure)]` como el encabezado de hoy). No se estira.

- **Reutiliza**: `PageShell`, `VerifyHeading`, `Button` (`secondary`, `ghost`, `loading`),
  `Disclosure`, `CountedTextarea` + `CharacterCount`, `ErrorText`, `SaveFailedStrip`,
  `FormSubmit`, `NotNowLink` (sin pregunta pendiente).
- **Crea**: `NotNowButton` (verification, quieto · enviando: `FormSubmit` `ghost` en un `<form
  action>` del servidor, mismo lugar y texto que `NotNowLink`); `ExitQuestion` (verification,
  quieto · mandando una opción · mandando «Otra cosa» · error de texto (contacto, largo) · no llegó ·
  saliendo); `ExitOriginTable` (surveys, con datos · en cero).
- **Tokens**: `--color-ink`, `--color-ink-muted`, `--color-line`, `--color-canvas`, `--color-accent`
  (solo el error de texto y «Sobran N», por `ErrorText` y `CharacterCount`), `--space-3` entre
  opciones, `--space-6`/`--space-8` entre bloques, `--text-base`/`--text-sm`, `--dur-fast` en los
  estados del botón (los de `Button`).
- **Lo único que llama la atención**: la pregunta, en voz de afiche. **No hay tirita**: las cinco
  opciones pesan igual a propósito, porque una opción destacada empuja la respuesta y la medición
  dejaría de decir qué frena. Tampoco verde: no hay nada verificado acá.
- **Opción tocada**: queda marcada como la casilla elegida de `RadioGroup` (llena de tinta, texto en
  papel) con `aria-pressed`, y con `loading` mientras se manda; las demás se deshabilitan hasta que
  vuelva la respuesta. Si no llegó, sigue marcada, `SaveFailedStrip` «No se pudo mandar por la
  conexión. Tocá de nuevo o seguí sin contestar.» (texto final con sin-slop) y todas vuelven a
  tocarse.
- **Accesibilidad**: las opciones son un `ul` con `aria-labelledby` al `h1`; al aparecer la pregunta
  el foco va al `h1` (`useFieldFocus`/`tabIndex=-1`), así un lector de pantalla sabe que la pantalla
  cambió. El error del texto atado con `aria-describedby` (lo hace `FieldShell`).
- **Estados**: es una pantalla sin datos que cargar (la arma el servidor con la cookie): no lleva
  skeleton; el `loading.tsx` de cada ruta ya existe. Vacío no aplica. Error: el del texto y el de
  conexión, arriba.

### «Por qué no se verificaron» en Encuestas — 1280 px

```
──────────────────────────────────────────────────────────────────────── (divisor 2 px line)
Por qué no se verificaron                                    ← h2, --text-xl bold
──────────────────────────────────────────────────────────────────────────
El teléfono                         │  Lo que escribieron
Se preguntó 14 veces, se contestó 9 │  “me da miedo que me llamen”
y se siguió sin contestar 3.        │  3 de noviembre
                                    │  ───────────────
No quiero dar mi número ████░░ 4    │  “uso el celular de mi hermana”
No me llegó el código   ██░░░░ 2    │  28 de octubre
Ahora no puedo…         █░░░░░ 1    │
Prefiero seguir por…    ██░░░░ 2    │  [ Ver más ]
Otra cosa               ░░░░░░ 0    │
                                    │
            Publicar Solicitar Por su cuenta
No quiero…      3        1        0
No me llegó…    1        1        0
…
──────────────────────────────────────────────────────────────────────────
La identidad                        │  …
```

A 390 px: una sola columna en este orden: título del bloque, cuentas, barras, tabla, textos. La tabla
tiene cuatro columnas cortas (la opción y tres números); la etiqueta de la opción se parte en dos
renglones antes de que la tabla pida scroll horizontal.

- **Reutiliza**: `SurveySummary` (`SURVEY_SUMMARY_LAYOUT`) con el título del nivel en lugar de la
  pregunta, `SurveyOptionBars` + `optionBars` para el total, `SurveyAnswerList` para los textos (el
  meta es solo el día: la opción es siempre «Otra cosa»), `Skeleton` en `loading.tsx`.
- **Crea**: `ExitOriginTable`: `<table>` semántica con `caption` solo para lectores («Cuántas veces
  se eligió cada opción, por desde dónde llegó»), encabezados `th scope`, números en `--text-sm`
  `tabular-nums` alineados a la derecha, divisores de 1 px `--color-line` entre renglones, sin fondo
  ni cebra, sin color. No necesita estado propio: con cero en todo, muestra ceros (la frase del vacío
  la dice el bloque).
- **Tokens**: `--color-ink`, `--color-ink-muted`, `--color-line`, `--text-xl`, `--text-lg`,
  `--text-sm`, `--space-4`, `--space-8`.
- **Lo único que llama la atención**: en cada bloque, la barra de la opción más elegida en tinta
  llena (la regla de `SurveyOptionBars`).
- **Estados**:
  - Cargando: `loading.tsx` de Encuestas suma un `h2` hueco y dos bloques con la forma de
    `SurveySummary` (`Skeleton` de las cuentas, cinco renglones de barras y tres de texto).
  - Vacío: sin ninguna pregunta hecha en los dos niveles, en lugar de los bloques, «Todavía nadie
    contestó por qué no se verificó» (`--text-base` `ink-muted`, como el vacío de #71). Un nivel con
    preguntas y sin respuestas: sus cuentas, la frase de que nadie contestó todavía y, debajo, las
    barras y la tabla en cero, porque la spec (US3-AS5) pide ver las opciones en cero. Sin textos:
    `SurveyAnswerList` con su vacío «Nadie escribió nada todavía».
  - Error: el `error.tsx` de `/revision/encuestas`, que ya existe: si la base no contesta, la página
    entera dice que no se pudo, como hoy.

## Cómo se construye, por user story

1. **US1 — identidad (P1)**: migración entera (las tablas y funciones sirven a los dos niveles),
   tipos, lógica pura y schema con sus pruebas, queries, acciones, `NotNowButton`, `ExitQuestion`,
   la página de identidad, eventos, pruebas de base, e2e.
2. **US2 — teléfono (P2)**: las dos páginas del teléfono, `cancelPendingPhone`, la puerta como
   origen; pruebas de base de elegibilidad del teléfono (verificado, perdido, cambio a medias).
3. **US3 — Encuestas (P3)**: `exitSummaryBlocks` con su prueba, las dos queries de quien administra,
   la sección, `ExitOriginTable`, `moreHref`, `loading.tsx`; pruebas de base de las funciones de
   quien administra y de borrar una cuenta.

Los textos se escriben con el skill `sin-slop` en cada US. Las preguntas y opciones van palabra por
palabra de la historia.

## Complexity Tracking

Sin violaciones de la constitución.
