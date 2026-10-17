# Research — Un solo tamaño de hoja y el menú quieto al navegar

## R1. De dónde sale el ancho de la hoja

- **Decision**: `PaperFrame` pierde la prop `size`. Su ancho sale de `menu`: con menú,
  `max-w-listing` (1200); sin menú, `max-w-[var(--measure)]` (640). Los cinco layouts de grupo dejan
  de pasar un tamaño.
- **Rationale**: FR-002 dice que ninguna pantalla ni zona elige su ancho. Con la prop, la regla
  depende de que nadie vuelva a escribir `size="working"`; derivado de `menu`, no hay forma de
  escribirla mal. El único caso sin menú (la cuenta suspendida) es justo el flujo de foco.
- **Alternatives considered**: dejar `size` con un solo valor por defecto (la prop sigue invitando a
  elegir); un `focus` booleano aparte de `menu` (dos props que dicen lo mismo y pueden
  contradecirse).

## R2. El menú que se corre por la barra de desplazamiento (FR-004)

- **Decision**: desde 1024, `scrollbar-gutter: stable` en `html` (capa base de `globals.css`) y el
  fondo de `body` en `--color-surface`, para que el lugar reservado de la barra se lea como
  pared y no como una tira de papel.
- **Rationale**: en Windows y en Linux la barra clásica ocupa unos 15 px. Una pantalla corta
  (Opinar) no la tiene y una larga (el listado) sí, así que la hoja centrada se corre la mitad
  —7,5 px— y con ella todo el menú. Reservar el lugar siempre deja el centro quieto. En macOS y en
  el teléfono la barra flota y la propiedad no cambia nada. Solo desde 1024: debajo, reservar el
  lugar angostaría 15 px las pantallas cortas de una computadora chica, y debajo de 1024 nada
  cambia (FR-009).
- **Alternatives considered**: `overflow-y: scroll` en `html` (dibuja una barra vacía en las
  pantallas cortas); alinear la hoja a la izquierda en lugar de centrarla (contradice «arriba de
  1200 la pared crece» con la hoja centrada).

## R3. Cómo se arma una pantalla de una sola tarea (FR-020–026)

- **Decision**: un componente nuevo de la capa de la app, `SingleTaskLayout`
  (`src/app/[locale]/_components/single-task-layout.tsx`), al lado de `PageShell` y `PaperFrame`.
  Recibe `presentation` y `task` ya armados; adentro pone `PageShell width="wide"` y, desde 1024,
  una grilla `lg:grid-cols-2 lg:gap-x-16 lg:items-start`, con la presentación `lg:sticky lg:top-6`
  y el primer hijo de la tarea sin margen de arriba (`lg:[&>:first-child]:mt-0`).
- **Rationale**: son cinco pantallas con la misma forma; a la segunda se extrae (docs/08). Dos
  columnas iguales hacen que la tarea arranque en la mitad derecha: a 1280 la hoja tiene 1148 de
  contenido (1200 − 2 de borde − 2 × 24 de gutter), cada columna 542 y la tarea empieza en 632,
  pasada la mitad (600); a 1024 (1009 con la barra), 446 por columna y la tarea en 536, pasada la
  mitad (504). Una tarea de 640 con la presentación en el resto arrancaría en 516 a 1280, antes de
  la mitad (FR-023). Sacar el margen del primer hijo de la tarea deja que cada pantalla conserve
  sus separaciones del teléfono (FR-009) sin pasarle una prop a `ProfileForm` ni a los demás.
- **Alternatives considered**: reusar `QuestionLayout` (es del dominio `questions`, con el `h1`
  encima de las dos columnas; acá el título es parte de la presentación); una prop `gap` por
  pantalla (cada pantalla ya trae su margen; la prop lo duplicaría).

## R4. `PageShell` desde 1024

- **Decision**: una variante nueva `width="wide"`: `max-w-[var(--measure)] lg:max-w-none`. La usan
  `SingleTaskLayout` y «El enlace no sirve».
- **Rationale**: `full` cambiaría el ancho de la columna entre 640 y 1023 (FR-009); `reading` deja
  la columna en 640 desde 1024 y no hay dónde poner la segunda parte. «El enlace no sirve» va
  centrada (FR-027): en `reading` quedaría centrada en una columna de 640 pegada a la izquierda de
  la hoja de 1200, no en la hoja.

## R5. Cuenta borrada en dos partes sin cambiar el teléfono

- **Decision**: presentación = el `h1` (`text-center lg:text-left`) y `EmptyState` con la frase y
  sin acción, alineado a la izquierda desde 1024 (`lg:items-start lg:px-0 lg:text-left`); tarea =
  «Crear otra cuenta» y «Volver al inicio» en una columna centrada que se alinea a la izquierda
  desde 1024.
- **Rationale**: en el teléfono quedan las mismas piezas en el mismo orden y centradas (h1, cartel
  en blanco, frase, crear, volver). `cn` es `clsx` sin fusión, pero las clases `lg:` no compiten
  con las de base: van en otra capa de variantes.
- **Alternatives considered**: dejar `EmptyState` entero en la tarea (la frase, que es la bajada,
  quedaría del lado de la acción); exportar el dibujo de `EmptyState` (agranda una primitiva por
  una pantalla).

## R6. `--container-page`

- **Decision**: queda en la configuración del tema, sin uso en la hoja.
- **Rationale**: `tests/gates/theme-reset.test.ts` la usa de muestra de una utilidad del sistema, y
  las compuertas no cambian sin `reglas-aprobadas`. docs/10 ya dice que la página ya no es el
  ancho de ninguna hoja.

## R7. Qué se testea

- **Decision**: ningún test nuevo.
- **Rationale**: todo lo que cambia son layouts y páginas, que docs/09 §Qué vale la pena testear
  deja afuera; ninguna regla de negocio, schema ni cálculo cambia. La regla «ninguna pantalla elige
  su ancho» queda en el tipo de `PaperFrame` (R1). Se verifica con las capturas a 390 y 1280 del
  `design-reviewer` y con la medición de `quickstart.md`.
