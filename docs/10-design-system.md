# 10 — Design System

**Decisión (2026-09-17):** hay una guía de diseño desde el minuto cero y se sigue cada vez que se
toca algo de UI. Este documento es esa guía. Los tokens viven en `src/styles/globals.css` y son
la traducción literal de la sección "Tokens" de acá: **un valor que no está en este doc no
existe**. Toda tarea de UI carga el skill `frontend-design:frontend-design` antes de escribir
JSX o CSS y trabaja con este doc abierto. Donde este doc difiera de las notas visuales de
`07-stack.md`, gana este.

## Brief

- **Qué es:** perros y gatos en adopción en Uruguay, con las personas verificadas antes de
  intercambiar contacto.
- **Para quién:** rescatistas (voluntarias, saturadas, viven en WhatsApp y Facebook) y
  adoptantes que llegan desde un link compartido, en el teléfono, con datos móviles.
- **El trabajo principal de la interfaz:** que el animal dé ganas, y que la otra persona
  inspire confianza en tres segundos. Todo lo demás es secundario.
- **Vernáculo del que salen las decisiones:** el patio, la chapita del collar, el cartel a
  mano de "se busca hogar", la yerba, el ceibo. Cálido y cercano, sin ser infantil.

## Principios

1. **La foto manda.** Grande, casi sin borde, con el nombre y la zona apoyados en ella o justo
   debajo. Nunca una lista con thumbnail chico ni una tabla.
2. **La chapita es el elemento audaz.** El badge de verificación tiene forma de chapita de
   collar: es el diferencial hecho visible y el único lugar donde el diseño se permite llamar
   la atención. Todo lo demás es quieto y disciplinado.
3. **390 px primero.** Se diseña en un teléfono y se expande. Una sola columna de lectura;
   el listado es la única grilla.
4. **El movimiento responde a la persona.** Hover, foco, presión, confirmación: todo lo
   tocable contesta en 100–250 ms. Nada se mueve solo, salvo un único momento orquestado: el
   brillo de la chapita la primera vez que aparece. **Sin aparición escalonada al scroll**, sin
   fade-in por sección: es el default genérico.
5. **La estructura es información.** Un borde, una línea, un número, una etiqueta existen
   solo si dicen algo del contenido. Sin etiquetas en mayúsculas sobre cada título, sin
   separadores `·`, sin flechas `→` en los botones, sin tarjetas idénticas para todo.
6. **Los textos son diseño.** Voseo, oración con mayúscula inicial, verbos activos, el mismo
   nombre para la misma acción en todo el flujo. Un error dice qué pasó y qué hacer; un
   vacío invita a actuar.
7. **Liviana por diseño.** Una familia tipográfica, un archivo. Sombras casi nunca. CSS antes
   que JS. El presupuesto de `07-stack.md` es parte del diseño, no una restricción externa.

## Tokens

Los nombres son los de `globals.css`. Los valores son la v1: cuando exista el nombre y la
marca, cambia este archivo y `globals.css`, nada más.

### Color

Paleta con cinco colores con nombre y sus derivados. Verde yerba como color de marca (calma,
confianza) y ceibo como acento escaso (urgencia, interés). **Fondo blanco**: las fotos se ven
mejor sobre blanco que sobre crema, y el crema con acento terracota es el look genérico que
se evita a propósito.

| Token | Valor | Uso |
|---|---|---|
| `--color-canvas` | `#FFFFFF` | Fondo de página. Las fotos viven acá. |
| `--color-surface` | `#F1EEE8` | Piedra. Secciones secundarias, base de skeletons, chips inactivos. |
| `--color-line` | `#DDD8CF` | Bordes y divisores. |
| `--color-ink` | `#1F2D26` | Monte. Texto principal, iconos, anillo de foco. |
| `--color-ink-muted` | `#5B6862` | Texto secundario (contraste 5,5:1 sobre blanco). |
| `--color-primary` | `#2E6B4E` | Yerba. Acción principal, links, la chapita. Blanco encima: 6,4:1. |
| `--color-primary-hover` | `#255A41` | Hover y active de lo primario. |
| `--color-primary-soft` | `#E3EFE7` | Fondos de estado verificado, chips activos, mensajes de éxito. |
| `--color-accent` | `#D7432F` | Ceibo. Urgencia, el corazón de interés, acciones destructivas. Nunca de decoración. |
| `--color-accent-soft` | `#FBE7E3` | Fondo de avisos de error y de "urgente". |
| `--color-warning` | `#A8650A` | Mate cocido. Avisos: expira pronto, pendiente de revisión. |
| `--color-warning-soft` | `#FBF0DC` | Fondo de esos avisos. |
| `--color-focus` | `#1F2D26` | Anillo de foco por teclado, 2 px con 2 px de separación. |

Reglas: texto siempre ≥ 4,5:1 sobre su fondo. El acento aparece como máximo una vez por
pantalla fuera de los estados de error. Ningún gradiente decorativo. Modo oscuro: no en el MVP,
pero cada token tiene un solo lugar donde cambiar.

### Tipografía

Una sola familia, variable, con eje óptico: **Bricolage Grotesque** (`next/font/google`,
self-hosted, `display: swap`, subset `latin`). Con `opsz` alto tiene carácter en los títulos;
con `opsz` bajo es neutra en el texto. Un archivo, sin flash. Si al ver la primera pantalla
el texto de lectura resulta demasiado particular, el cuerpo pasa a **Figtree** y se registra
acá; no se cambia sobre la marcha.

Escala mayor tercera sobre 16 px, pensada para 390 px:

| Token | Tamaño / interlínea | Uso |
|---|---|---|
| `--text-xs` | 13 / 1.4 | Metadatos: fecha de alta, "hace 3 días". |
| `--text-sm` | 14 / 1.45 | Texto secundario, chips, ayudas de formulario. |
| `--text-base` | 16 / 1.5 | Texto de lectura. Mínimo en inputs (evita el zoom de iOS). |
| `--text-lg` | 20 / 1.35 | Subtítulos, nombre del animal en la card. |
| `--text-xl` | 25 / 1.2 | Título de sección. |
| `--text-2xl` | 31 / 1.1 | Título de pantalla. |
| `--text-3xl` | 39 / 1.05 | Solo el nombre del animal en la ficha y el titular de la landing. |

Pesos: 400 texto, 500 énfasis y labels, 700 títulos. Tracking `-0.01em` desde `--text-xl`.
Medida máxima 65 caracteres. **Nunca** mayúsculas sostenidas, ni una palabra sola resaltada en
un título, ni una etiqueta encima de cada bloque.

### Espacio, radio, elevación

- Espaciado en pasos de 4 px: `--space-1` 4 · `2` 8 · `3` 12 · `4` 16 · `5` 20 · `6` 24 ·
  `8` 32 · `10` 40 · `12` 48 · `16` 64. Gutter de página 16 px en el teléfono, 24 desde 768.
- Radios con jerarquía, nunca el mismo en todo: `--radius-card` 16 px (fotos, cards, sheets)
  · `--radius-control` 10 px (botones, inputs) · `--radius-pill` 999 px (chips, badges) ·
  `--radius-tag` 50 % (la chapita).
- Elevación: **por defecto ninguna sombra**; los planos se separan con `--color-line` y
  `--color-surface`. Dos sombras en total: `--shadow-lift`
  (`0 6px 16px -8px rgb(31 45 38 / .25)`) para una card en hover y `--shadow-float`
  (`0 12px 32px -12px rgb(31 45 38 / .35)`) para sheets, menús y toasts. Teñidas con el
  color de tinta, nunca gris negro.
- Anchos: contenido de lectura `--measure` 640 px; página 1024 px; el listado hasta 1200.
- Breakpoints: 390 (diseño base) · 640 · 768 · 1024. Se agregan columnas, no se rediseña.

### Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--dur-fast` | 120 ms | Color, opacidad, hundir un botón. |
| `--dur-base` | 200 ms | Elevar una card, abrir un chip, entrar un error. |
| `--dur-page` | 320 ms | View Transition entre listado y ficha. |
| `--ease-out` | `cubic-bezier(.2, .8, .2, 1)` | Todo lo que entra o crece. |
| `--ease-in-out` | `cubic-bezier(.4, 0, .2, 1)` | Lo que cambia de lugar. |

`prefers-reduced-motion: reduce` deja todas las duraciones en 0 y quita el shimmer y el brillo
de la chapita. Motion (`m` + `LazyMotion`) solo donde CSS no llega: reordenar el listado al
filtrar, el pop del corazón, el tween de un contador.

## Layout

Alineación a la izquierda siempre; centrado solo en estados vacíos y confirmaciones.

```
Listado (390 px)                      Ficha (390 px)
┌──────────────────────────┐          ┌──────────────────────────┐
│ [logo]          [entrar] │          │ ┌──────────────────────┐ │
│ Perros y gatos en Montev.│          │ │                      │ │
│ (chips) perro gato ▾zona │          │ │   foto 4:5 a sangre  │ │
│ ┌──────────┐┌──────────┐ │          │ │   ● ● ○              │ │
│ │  foto    ││  foto    │ │          │ └──────────────────────┘ │
│ │  4:5     ││  4:5     │ │          │ Tobi                 ⌂   │
│ │Tobi · 2a ││Luna · 6m │ │          │ Perro · 2 años · Malvín  │
│ │Malvín    ││Cordón    │ │          │ [castrado][vacunas][chip]│
│ └──────────┘└──────────┘ │          │ Tobi llegó en marzo…     │
│ ┌──────────┐┌──────────┐ │          │ ┌──────────────────────┐ │
│ │  foto    ││  foto    │ │          │ │ (chapita) Ana · Malvín│ │
│ …                        │          │ │ rescatista · 12 adop. │ │
│                          │          │ └──────────────────────┘ │
│                          │          │ ██ Quiero adoptar ██     │
└──────────────────────────┘          └──────────────────────────┘
```

- Listado: dos columnas de cards 4:5 con 12 px entre ellas; tres desde 768, cuatro desde 1024.
  Los filtros son chips en una fila con scroll horizontal, nunca un panel.
- Ficha: galería a sangre arriba, después una columna de lectura. El botón de solicitar queda
  fijo abajo en el teléfono (`position: sticky`), con la chapita del publicador visible antes.
- Bandeja: una columna de `ApplicationCard`, cada una con la chapita del solicitante a la
  izquierda y el estado a la derecha; las acciones en un bottom sheet, no en la card.
- Formularios largos (cuestionario): un paso por pantalla, progreso como texto ("3 de 11"), no
  una barra decorativa.

## Componentes

`components/ui/` son primitivas shadcn copiadas y reescritas con estos tokens; no traducen ni
saben del dominio. `components/<dominio>/` reciben el objeto de dominio por props. Cada uno
responde a hover, foco y active con los tokens de movimiento, y los que muestran datos tienen
cargando, vacío y error diseñados.

| Componente | Capa | Variantes / estados | Notas |
|---|---|---|---|
| `Button` | ui | `primary` `secondary` `ghost` `danger`; `sm` `md` `lg`; `loading` `disabled` | Se hunde 1 px al presionar; spinner interno al cargar; el texto no cambia de largo. |
| `Input` `Textarea` `Select` | ui | `error` `disabled` | Borde toma `--color-primary` al foco; el error entra con fade y va debajo, en `--color-accent`. 16 px mínimo. |
| `Chip` | ui | `active` | Filtros. Cambia a `--color-primary-soft` con borde primario al activarse. |
| `Card` | ui | — | Contenedor con `--radius-card`, sin sombra en reposo, `--shadow-lift` en hover. |
| `Sheet` | ui | bottom (teléfono) / side (desde 768) | Acciones secundarias y formularios cortos. |
| `Dialog` | ui | — | Solo confirmaciones irreversibles. |
| `Toast` | ui | `success` `error` | Entra deslizando desde abajo, sale con fade. Mismo verbo que el botón que lo disparó. |
| `Skeleton` | ui | — | Shimmer sobre `--color-surface`, con la forma exacta del contenido. Nunca un spinner de página. |
| `EmptyState` | ui | — | Ilustración chica, una frase, una acción. Recibe todo traducido. |
| `PetCard` | pets | `available` `in_process` `adopted` `paused`; `urgent` | Foto 4:5 con ThumbHash; nombre `--text-lg` y zona debajo; estado como cinta discreta sobre la foto solo si no está disponible; se eleva 2 px y la foto hace zoom 1.03 en hover. |
| `PetPhotoGallery` | pets | 1–5 fotos | A sangre, snap horizontal, puntos de posición; `view-transition-name` en la portada. |
| `PetAttributes` | pets | — | Chips informativos (castrado, vacunas, chip, convive con): solo los verdaderos. |
| `VerificationBadge` | verification | `level: 1 / 2 / 3`; `size: sm / md / lg` | **La chapita.** Círculo con la argolla arriba. Nivel 1: contorno primario; nivel 2: relleno primario con tilde; nivel 3: relleno más anillo grabado "avalado". Brilla una sola vez al aparecer. Siempre con su etiqueta accesible ("Verificado, nivel 2"). |
| `OwnerCard` | verification | — | Nombre, zona, chapita, cuántas adopciones con seguimiento. Nunca el contacto. |
| `ApplyButton` | applications | `needs_verification` `limit_reached` `ready` | Sticky abajo en el teléfono. El texto dice el próximo paso real. |
| `ApplicationCard` | applications | `pending` `info_requested` `accepted` `rejected` | Chapita del solicitante, tres respuestas clave, estado a la derecha. |
| `ApplicationStatus` | applications | mismos estados | Pill con `--color-primary-soft` (aceptada), `--color-warning-soft` (pendiente), `--color-surface` (rechazada). |
| `ContactReveal` | applications | `hidden` `revealed` | Al aceptar, el contacto aparece con un fade y un botón "Abrir WhatsApp" con texto prellenado. Antes, nada, ni un placeholder. |
| `ZoneLabel` `UrgencyTag` | pets | — | Texto plano con icono; `UrgencyTag` es el único uso del acento en el listado. |

Un componente nuevo entra en esta tabla en el mismo PR que lo crea.

## Fotos e ilustraciones

- Cards y galería en 4:5 (vertical, como sale del teléfono); thumbs 1:1. Recorte centrado con
  `object-position` ajustable por foto.
- Tres tamaños WebP + ThumbHash como placeholder (`07-stack.md`); del borroso al nítido con
  fade de `--dur-base`. Sin filtros, sin marcos, sin esquinas distintas al `--radius-card`.
- Texto sobre foto solo con un degradé de tinta al 60 % en el borde inferior, y solo en la
  card; en la ficha el texto va debajo.
- Ilustraciones de estados vacíos: trazo simple en `--color-ink` con un toque de
  `--color-primary`, mismo estilo en todas; máximo 200 px de alto; SVG inline.
- `alt` de cada foto: "Foto de <nombre>, <especie> en <zona>".

## Textos

- Voseo rioplatense, oración con mayúscula inicial, sin signos de exclamación por defecto.
- El botón dice lo que pasa: "Publicar" → toast "Publicado". "Enviar solicitud" → "Solicitud
  enviada". Nunca "Aceptar" ni "OK" como confirmación de algo con nombre.
- Error: qué pasó y qué hacer, sin disculpas ni vaguedades. "No pudimos subir la foto. Probá
  con una más liviana." Vacío: una invitación. "Todavía no publicaste ningún animal. Empezá
  con una foto."
- Verificación: se explica por su valor, no por el mecanismo. "Verificamos tu teléfono para que
  los rescatistas sepan que sos una persona real."
- Claves en `messages/es.json` por namespace; ningún literal en un componente (`06-i18n.md`).

## Piso de accesibilidad

Contraste AA en todo texto · anillo de foco visible con teclado en todo lo interactivo ·
objetivos táctiles ≥ 44 px · inputs a 16 px · `prefers-reduced-motion` respetado · HTML
semántico (un `h1` por pantalla, botones que son `button`, links que son `a`) · las fotos con
`alt`, la chapita con etiqueta · el listado y la ficha usables sin JS.

## Antipatrones

No se hace, aunque parezca "lindo": fondo crema con acento terracota · una serif de contraste
alto en los títulos · etiquetas en mayúsculas tracking abierto sobre los títulos · metadatos
unidos con `·` · flechas `→` en botones y links · el mismo radio en todo · la misma sombra gris
bajo cada tarjeta · gradientes de decoración · secciones que aparecen con fade al hacer scroll ·
numerar cosas que no son una secuencia · un spinner genérico donde va un skeleton · un color
fuera de los tokens · un texto fuera de `messages/`.

## Cómo se aplica

1. **Al planificar** (`stages/spec.md`, paso del plan): si la historia toca UI, el agente carga
   `frontend-design:frontend-design`, lee este doc y escribe una sección **«Diseño»** en
   `plan.md`: wireframe en ASCII de cada pantalla nueva, qué componentes de la tabla reutiliza y
   cuáles crea, qué tokens usa, cuál es el único elemento que llama la atención en esa
   pantalla, y los tres estados de cada bloque con datos. `plan-reviewer` la revisa contra
   este doc antes de que exista código.
2. **Al construir** (`stages/build.md`): el skill se carga antes del primer JSX o CSS. Solo se
   usan tokens de `globals.css`; **un token nuevo es una edición a este doc en el mismo PR**,
   nunca un valor suelto. Un componente nuevo entra en la tabla de componentes.
3. **Al revisar** (`stages/review.md`): `design-reviewer` califica el diff y las capturas a
   390 px contra este doc, sección por sección, y cita la regla que aplica.
4. **Al validar** (checkpoint humano): Hernán recorre el build local con este doc al lado. Lo
   que no le convence del sistema se cambia acá primero, con fecha, y después en el código.

## Decisiones

- **Decisión (2026-09-17):** guía de diseño desde el minuto cero; este doc es la fuente única
  de tokens, componentes y reglas visuales. Gana sobre las notas de `07-stack.md`.
- **Decisión (2026-09-17):** fondo blanco, verde yerba como marca, ceibo como acento escaso;
  sin crema ni terracota.
- **Decisión (2026-09-17):** una sola familia tipográfica variable (Bricolage Grotesque);
  Figtree como cuerpo alternativo si la lectura no convence al ver la primera pantalla.
- **Decisión (2026-09-17):** la chapita de collar es la forma del badge de verificación y el
  único elemento audaz; sin aparición escalonada al scroll.
- **Decisión (2026-09-17):** toda tarea de UI carga `frontend-design:frontend-design` antes
  de escribir; `design-reviewer` califica contra este doc.

## Descartado

- **Crema + terracota + serif de contraste.** Es el look que hoy produce cualquier generador;
  no distingue y tiñe las fotos.
- **Dos familias tipográficas.** Un archivo menos y la misma personalidad con el eje óptico.
- **Bronce / plata / oro para los niveles.** Gamifica la confianza; los niveles se leen en la
  forma de la chapita, no en el metal.
- **Aparición escalonada de cards al scroll.** Movimiento que nadie pidió; queda solo lo que
  responde a una acción.
