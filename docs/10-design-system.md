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

1. **La foto manda.** Grande, sin borde, con el nombre y la zona justo debajo, como en un
   cartel: la foto es la foto y el texto es el texto. Nunca una lista con thumbnail chico ni
   una tabla.
2. **Un mundo de papel, y un solo objeto de metal.** La interfaz habla el idioma del cartel de
   "se busca hogar" pegado en el poste: tipografía de afiche, cinta, tiritas para arrancar,
   sello. La chapita de verificación es el único objeto de metal en ese mundo de papel, y por
   eso resalta: es el diferencial hecho visible. Cada recurso del cartel significa algo (la
   tirita es una acción, el sello es un estado, la cinta sostiene algo que alguien pegó);
   ninguno es decoración, y cada elemento lleva un solo gesto.
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
marca, cambia este archivo y `globals.css`, nada más. `globals.css` apaga los valores por defecto
de Tailwind en color, familia, tamaño, peso, tracking, interlínea, radio, sombras (caja, interior,
drop y texto), blur, curvas, animaciones, anchos y breakpoints: `rounded-lg`, `max-w-sm`,
`font-serif` o `text-red-500` no compilan, y `tests/gates/theme-reset.test.ts` compila la hoja
real para probarlo. Lo que no está acá no existe, de verdad.

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
| `--color-ink` | `#1F2D26` | Monte. Texto, iconos, anillo de foco, **y la acción**: los botones son bloques de tinta, como el marcador del cartel. |
| `--color-ink-muted` | `#5B6862` | Texto secundario (contraste 5,8:1 sobre blanco; 5,0:1 sobre `--color-surface`). |
| `--color-primary` | `#2E6B4E` | Yerba. La chapita, lo verificado, el éxito. **No es el color de la acción**: queda reservado para la confianza, así el verde significa algo. Blanco encima: 6,3:1. |
| `--color-primary-hover` | `#255A41` | Hover y active de lo verificado. |
| `--color-primary-soft` | `#E3EFE7` | Fondos de estado verificado y mensajes de éxito. |
| `--color-accent` | `#D23F2C` | Ceibo. Urgencia, el corazón de interés, acciones destructivas, texto de error. Nunca de decoración. 4,7:1 sobre blanco y con blanco encima. Era `#D7432F` hasta el 2026-09-18: daba 4,44:1 y el texto de error a 14 px quedaba bajo AA. |
| `--color-accent-soft` | `#FBE7E3` | Fondo de avisos de error y de "urgente". **El texto encima va en `--color-ink`**: el ceibo sobre este fondo da 3,9:1 y no alcanza. |
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
| `--text-3xl` | 39 / 1.05 | El nombre del animal en la ficha. |
| `--text-4xl` | 61 / 0.95 | Titular de afiche: la portada y la landing, siempre en voz de afiche. Salta un paso de la escala a propósito: un cartel se lee desde la vereda de enfrente. |

La familia es el token `--font-sans`. Pesos: `--font-weight-regular` 400 texto,
`--font-weight-medium` 500 énfasis y labels, `--font-weight-bold` 700 títulos chicos,
`--font-weight-black` 800 afiche. Tracking `--tracking-tight` (`-0.01em`) desde `--text-xl`.

**Voz de afiche** para títulos de pantalla, nombres y botones: la misma familia en su ancho
condensado (`--stretch-afiche`, 75 %), peso `--font-weight-black`, tracking `--tracking-afiche`
(`-0.02em`) e interlínea apretada (0,95, la de `--text-4xl`). Es la voz del cartel escrito con marcador grueso; el texto de
lectura sigue en ancho normal. Vive en la utilidad `.afiche` de `globals.css`.

Medida máxima 65 caracteres. **Nunca** mayúsculas sostenidas, ni una palabra sola resaltada en
un título, ni una etiqueta encima de cada bloque.

### Espacio, radio, elevación

- Espaciado en pasos de 4 px: `--space-1` 4 · `2` 8 · `3` 12 · `4` 16 · `5` 20 · `6` 24 ·
  `8` 32 · `10` 40 · `12` 48 · `16` 64. Gutter de página 16 px en el teléfono, 24 desde 768.
- Radios: el papel no tiene esquinas redondeadas. `--radius-card` 0 px (fotos, cards, sheets)
  · `--radius-control` 0 px (botones, inputs) · `--radius-stamp` 3 px (el sello) ·
  `--radius-tag` 50 % (la chapita, el único objeto redondo). Los dos primeros quedan como
  tokens aunque valgan cero: la decisión vive en un solo lugar.
- Trazo: 2 px en `--color-ink` para todo lo que tiene borde. La línea punteada de 2 px es la
  perforación de las tiritas, y solo eso: toma el color del texto (tinta sobre papel, papel sobre
  un bloque de tinta). Los cortes verticales entre tiritas también son punteados, pero en
  `--color-line`: separan, no se arrancan, y en tinta pesarían más que el contenido. La excepción
  es el corte del talón de `GoogleButton`: ese sí se arranca, así que es perforación y va en tinta.
- Elevación: **por defecto ninguna sombra**; los planos se separan con `--color-line` y
  `--color-surface`. Dos sombras de elevación (la cinta tiene la suya, mínima, en §Recursos del
  cartel): `--shadow-lift`
  (`0 6px 16px -8px rgb(31 45 38 / .25)`) para una card en hover y `--shadow-float`
  (`0 12px 32px -12px rgb(31 45 38 / .35)`) para sheets, menús y toasts. Teñidas con el
  color de tinta, nunca gris negro.
- Anchos: la medida de lectura es `--measure` 640 px. Los demás anchos y los breakpoints no son
  tokens; viven en §Pantallas anchas, con su decisión. El gutter lo aplican `PaperFrame` y
  `PageShell`, no cada página.

### Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--dur-fast` | 120 ms | Color, opacidad, hundir un botón. |
| `--dur-base` | 200 ms | Elevar una card, abrir un chip, entrar un error. |
| `--dur-page` | 320 ms | View Transition entre listado y ficha. |
| `--dur-spin` | 1000 ms | Una vuelta del spinner de un botón cargando. |
| `--dur-shimmer` | 1400 ms | Un ciclo del shimmer del `Skeleton`. Es la única animación que no responde a una acción, y se detiene con `prefers-reduced-motion`. |
| `--ease-out` | `cubic-bezier(.2, .8, .2, 1)` | Todo lo que entra o crece. |
| `--ease-in-out` | `cubic-bezier(.4, 0, .2, 1)` | Lo que cambia de lugar. |

### Recursos del cartel

| Token | Valor | Uso |
|---|---|---|
| `--color-tape` | `rgb(238 222 160 / 0.88)` | La cinta de papel. Solo en el recurso de la cinta, nunca como fondo. |
| `--shadow-tape` | `0 1px 2px rgb(31 45 38 / .14)` | La sombra mínima de un trozo de cinta. Solo ahí. |
| `--tilt` | `0.8deg` | La inclinación de lo pegado a mano: fotos y notas. Lo pegado nunca se inclina más que esto, y jamás lleva texto de lectura adentro. |
| `--tilt-torn` | `2deg` | La tirita arrancada (`Chip` activo). |
| `--tilt-stamp` | `6deg` | El sello, puesto a mano y torcido. |

Los recursos son utilidades de `globals.css`, para que ningún componente los reimplemente:

- **`.afiche`**: la voz de afiche (ver Tipografía).
- **`.cinta`** y **`.cinta-esquinas`**: un trozo de cinta arriba al centro (girado `--tilt-torn`), o
  dos cruzando las esquinas de arriba a 38°, que es geometría y no gesto. Sostiene algo que
  alguien pegó: una foto, una nota, un diálogo. Sus medidas salen de la escala de espacio.
- **`.perforado`**: la línea punteada de arriba de las tiritas. Marca algo que se arranca: un
  filtro, la acción principal. Usa `currentColor`, así la misma utilidad sirve en el `ChipGroup`
  y en el `Button` `tirita`.
- **`.sello`**: borde de 2,5 px, `--radius-stamp`, inclinado. Marca un estado. **El color va en el
  texto** (`text-ink`, `text-primary`…) y el borde lo hereda; el fondo es papel casi opaco, para
  leerse apoyado sobre una foto. No lleva fondo `-soft`. En `--color-accent` solo cuando pide
  atención, y ese uso cuenta para la regla de un acento por pantalla.
- **Cinta y zoom juntos**: la cinta sobresale de su caja y un zoom necesita `overflow-hidden`,
  que la cortaría. La cinta va en el contenedor; la imagen con su `overflow-hidden` va en un div
  interno.

Reglas de uso: **un gesto por elemento**. "Pegado a mano" (la cinta con su inclinación) es un
gesto; el sello es otro elemento, el del estado, y puede ir encima de una foto pegada. Lo que no
va es apilar: un bloque con cinta, perforado y sello a la vez. Mucho blanco alrededor, y la
inclinación jamás sobre párrafos. Si un recurso no dice nada del contenido, no va.

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
│ tiritas: perro gato zona │          │ │   foto 4:5 a sangre  │ │
│ ┌──────────┐┌──────────┐ │          │ │   ● ● ○              │ │
│ │  foto    ││  foto    │ │          │ └──────────────────────┘ │
│ │  4:5     ││  4:5     │ │          │ Tobi                 ⌂   │
│ └──────────┘└──────────┘ │          │ Perro, 2 años, Malvín    │
│  Tobi         Luna       │          │ [castrado][vacunas][chip]│
│  2 años,      6 meses,   │          │ Tobi llegó en marzo…     │
│  Malvín       Cordón     │          │ ┌──────────────────────┐ │
│ ┌──────────┐┌──────────┐ │          │ │ (chapita) Ana, Malvín │ │
│ │  foto    ││  foto    │ │          │ │ rescatista, 12 adop.  │ │
│ …                        │          │ └──────────────────────┘ │
│                          │          │ ┄┄ Quiero adoptar ┄┄     │
└──────────────────────────┘          └──────────────────────────┘
```

- Listado: dos columnas de cards 4:5 con 12 px entre ellas; tres desde 768, cuatro desde 1024.
  Cada foto va pegada con cinta y apenas inclinada, alternando el lado. Los filtros son las
  tiritas (`ChipGroup`) en una fila bajo su línea perforada, nunca un panel.
- Ficha: galería a sangre arriba, después una columna de lectura. El botón de solicitar es la
  `tirita` de la pantalla y queda fijo abajo en el teléfono (`position: sticky`), con la nota del
  publicador y su chapita visibles antes.
- Bandeja: una columna de `ApplicationCard`, cada una con la chapita del solicitante a la
  izquierda y el estado a la derecha; las acciones en un bottom sheet, no en la card.
- Formularios largos (cuestionario): un paso por pantalla, progreso como texto ("3 de 11"), no
  una barra decorativa.

### Pantallas anchas

**Decisión (2026-09-20): en pantallas anchas el papel deja de ser infinito.** Desde 1024 la app
vive dentro de una **hoja** de ancho acotado, con borde de tinta de 2 px, apoyada sobre una pared
de `--color-surface`. Debajo de 1024 la hoja ocupa la ventana entera y pierde el borde: el
teléfono es la hoja, y no habría dónde apoyarla.

El motivo no es estético. Hasta acá cada pantalla era una columna de 640 px pegada al borde
izquierdo: en un monitor de 1280 quedaban 665 px de blanco, y ese blanco se lee como una app rota.
Centrar la columna lo arregla y no dice nada. Un cartel es papel con bordes, y que el papel tenga
tamaño es lo que este sistema ya venía afirmando en todas las demás decisiones.

**El tamaño del papel es una propiedad de la zona, no de cada pantalla.** Lo aplica `PaperFrame`
desde el layout del grupo de ruta; ninguna página elige su ancho:

| Zona | Papel | Ancho | Qué es |
|---|---|---|---|
| `(public)` | `wall` | `--container-listing` 1200 | El afiche de la pared: portada, listado, ficha. |
| `(app)` | `working` | `--container-page` 1024 | La hoja sobre la que se trabaja: perfil, bandeja, panel. |
| `(auth)` | `handbill` | `--measure` 640 | El volante: ingreso, completar perfil, cuenta borrada. |

Dentro de la hoja, el contenido sigue **alineado a la izquierda** y con la medida de lectura:
`PageShell` pone el gutter y `--measure`, y `width="full"` libera esa medida para lo que se
organiza en grilla, que hoy es solo el listado. La cabecera (`AccountMenu`) es la cabecera de la
hoja, separada por el mismo borde de tinta; antes flotaba a 1200 px del contenido al que
pertenece.

- Breakpoints: 390 (diseño base) · 640 · 768 · 1024. **Se agregan columnas, no se rediseña**: no
  hay una segunda región que aparezca solo en escritorio, ni contenido que exista en un ancho y no
  en otro. El principio 3 sigue en pie.
- Anchos: contenido de lectura `--measure` 640 px; página 1024 px; el listado hasta 1200. Estos
  dos últimos, el gutter y los breakpoints no son tokens: viven con nombre en la configuración
  del tema (`--container-page`, `--container-listing`, `--container-sheet` —384 px, el `Sheet` de
  costado—, `--spacing-gutter`, `--spacing-gutter-wide`, `--breakpoint-*`).
- La escala tipográfica **no cambia con el ancho**. Está calibrada a 390 px y el afiche se lee
  igual de cerca en un monitor; si alguna pantalla pide otra cosa, se decide acá primero.
- Lo que sale a sangre —la galería de la ficha— toca **el borde de la hoja**, no el de la ventana.
- Arriba de 1200 no pasa nada más: la pared crece y la hoja no. Un cartel tiene un tamaño físico.

**Cada pantalla se revisa a 390 y a 1280.** `node scripts/walk.mjs` captura los dos anchos por
defecto y `design-reviewer` califica los dos. Mientras 1280 fue opcional (`--desktop`) nadie lo
pidió nunca, y el escritorio llegó a `main` sin que ningún revisor lo hubiera visto: la opción que
hay que acordarse de usar no es una compuerta. `--phone-only` existe para cuando alcanza con una.

#### Descartado

- **Solo centrar la columna (2026-09-20).** Arregla el vacío y no agrega nada: es lo que produce
  cualquier kit, y ya fue rechazado como capa base el 2026-09-18.
- **Dos columnas con un riel fijo, «el poste» (2026-09-20).** A la izquierda la marca, el titular
  en voz de afiche y los filtros, fijos al scrollear; a la derecha el contenido. Es lo que mejor
  usa 1920 y lo más distintivo de las tres, pero es rediseñar y no agregar columnas: contradice el
  principio 3, obliga a decidir qué va en el riel en cada historia que falta, y deja los
  formularios largos corriendo solos al costado. **Se guarda para el listado con filtros**, donde
  las tiritas en vertical tienen sentido; se reabre cuando el listado exista.
- **Una hoja de ancho único para toda la app (2026-09-20).** Con 1200 fijo, «Entrá sin contraseña»
  vuelve a ser una columna perdida, solo que adentro de un borde. El papel mide lo que mide lo que
  tiene encima.

## Componentes

`components/ui/` son primitivas shadcn copiadas y reescritas con estos tokens; no traducen ni
saben del dominio. `components/<dominio>/` reciben el objeto de dominio por props. Cada uno
responde a hover, foco y active con los tokens de movimiento, y los que muestran datos tienen
cargando, vacío y error diseñados.

| Componente | Capa | Variantes / estados | Notas |
|---|---|---|---|
| `Button` | ui | `primary` `secondary` `ghost` `ghost-danger` `danger` `tirita`; `sm` `md` `lg`; `loading` `disabled` | Bloque de tinta en voz de afiche; al hover se invierte (papel con borde de tinta), como un negativo fotocopiado. `secondary` es el inverso. `ghost` es texto subrayado. **`tirita`** es la acción principal de la pantalla, con el borde perforado arriba: una sola por pantalla. Se hunde 2 px al presionar, el grosor de su trazo (`.press`); al cargar, el spinner va encima del texto, que queda invisible ocupando su lugar: el botón no cambia de ancho ni de texto. Esa capa es `BusyLabel`, exportada de `button.tsx` para el único botón que carga igual sin ser un `Button` (`GoogleSubmit`). Altos: `sm` y `md` 44 px, el piso táctil; `lg` 56 px. `ghost` no tiene relleno a los costados, para alinear con el texto que tiene arriba, y al hover engrosa el subrayado en lugar de llenarse. |
| `Input` `Textarea` `Select` | ui | `error` `disabled` | Renglón de formulario de papel: sin caja, línea de tinta de 2 px abajo, que engrosa al foco. `Textarea` sí lleva caja, como el recuadro de un formulario. Las dos formas viven una sola vez en `field` (`shape`: `line` o `box`). El error (`ErrorText`) entra con fade y va debajo, en `--color-accent`, atado al campo con `aria-describedby`, y la línea toma ese color. 16 px mínimo. `FieldShell` arma el vínculo con el error para los tres, con un id propio que no depende de que quien lo usa pase `id`. El foco del renglón es la línea, sin anillo (§Piso de accesibilidad). `Textarea` mide 96 px como mínimo, cuatro renglones. La lista del `Select` nunca es más alta que el espacio que queda en pantalla: se desplaza adentro. Su chevron baja apenas en hover y gira al abrir. |
| `Chip` `ChipGroup` | ui | `active` | Filtros, como las tiritas para arrancar del cartel. `ChipGroup` es la tira con su línea perforada; cada `Chip` es una tirita. La activa se llena de tinta, baja 8 px (`--space-2`) y se inclina: está arrancada. Las que no, bajan 4 px en hover. La tira es una sola fila que se desplaza de costado cuando los filtros no entran; nunca se parte en dos ni empuja la página. Sin barra de scroll a la vista: la tirita cortada en el borde es la señal. El anillo de foco va por dentro de la tirita, porque la tira recortaría uno por fuera. Al presionar baja hasta donde queda la arrancada. |
| `Card` | ui | `taped` `interactive` | Una nota de papel: borde de tinta de 2 px, sin sombra. Con `taped` lleva un trozo de cinta arriba. Solo con `interactive` —cuando la card entera es un link o un botón— se despega en hover (`--shadow-lift` y `--tilt`): una nota estática no se mueve, porque inclinaría su párrafo y prometería un click que no existe. En un teléfono no hay hover: `.lift` solo responde donde hay puntero. |
| `Sheet` | ui | — | Una hoja de papel que sube: borde de tinta, título en voz de afiche. Acciones secundarias y formularios cortos. Entra desde abajo en el teléfono y desde el costado a partir de 768: lo decide el ancho de la pantalla, no una prop. Una acción que además cierra va dentro de `SheetClose`. Máximo 80 % del alto de la pantalla en el teléfono; `--container-sheet` de ancho de costado. Acciones alineadas a la izquierda, como el título. Comparte con `Dialog` el módulo `overlay`: el velo (`--color-ink` al 40 %), la cruz de cerrar y la acción que cierra. |
| `Dialog` | ui | — | Una nota pegada con cinta en el centro de la pantalla. Solo confirmaciones irreversibles, y perder lo escrito cuenta como una. Una acción que además cierra va dentro de `DialogClose`; si tiene que esperar a que termine, el diálogo se controla con `open` y `onOpenChange`. Acciones a la izquierda, bajo el título. A un gutter de cada borde en el teléfono. Usa el mismo `overlay` que `Sheet`. |
| `Toast` | ui | `success` `error` | Una tira de papel con borde de tinta y una banda a la izquierda: yerba si salió bien, ceibo si no. Entra deslizando desde abajo, sale con fade. Mismo verbo que el botón que lo disparó. 4 s en pantalla. Abajo, a un gutter del borde; desde 768 a la izquierda y no más ancho que `--measure`. `ToastProvider` recibe traducido cómo se anuncia el aviso y su región. Orden de apilado: aviso (`z-10`) < velo y capa de `Sheet` o `Dialog` (`z-20`) < lista de un `Select` (`z-30`). Un aviso nunca tapa una capa abierta. |
| `Skeleton` | ui | — | El hueco donde va a ir algo pegado: recuadro punteado con shimmer sobre `--color-surface`, con la forma exacta del contenido. Nunca un spinner de página. |
| `EmptyState` | ui | — | El poste con un cartel en blanco, una frase, una acción. Recibe todo traducido. La ilustración mide 112 px de alto. La frase, a 30ch como máximo. |
| `ErrorScreen` | app | — | El límite de error de una zona: un `h1`, el `EmptyState` con lo que pasó y el botón de reintentar. Uno solo para las dos zonas, porque eran el mismo JSX; el `h1` va acá porque un límite de error reemplaza la página entera y sin él la pantalla se queda sin encabezado. |
| `PaperFrame` | app | `wall` `working` `handbill` | **La hoja.** El papel sobre el que vive una zona entera, con la cabecera adentro: desde 1024 lleva borde de tinta y se apoya sobre `--color-surface`; debajo ocupa la ventana y pierde el borde. Lo pone el layout del grupo de ruta y ninguna página elige su ancho (§Pantallas anchas). |
| `PageShell` | app | `reading` `full` | La columna de contenido dentro de la hoja: alineada a la izquierda, con el gutter de página (16 px, 24 desde 768) y `--measure` de ancho máximo. `full` libera esa medida para lo que se organiza en grilla. Ninguna página escribe su propio padding. |
| `LinkButton` | ui | las variantes y tamaños de `Button` | Una acción que **navega**: comparte las variantes de `Button` y las pinta sobre un enlace. Existe porque un `button` adentro de un `a` es HTML inválido y le da dos controles anidados a un lector de pantalla, y porque sin esto cada enlace redibujaba el botón a mano. |
| `Checkbox` | ui | `checked` `disabled` | Una casilla de papel: cuadrada como todo acá, trazo de tinta de 2 px, y el tilde de `icons` dibujado encima al marcarse, con un fundido de `--dur-fast`. Va sobre el `input` nativo con `appearance: none`, que ya trae foco, teclado, `:checked` y el envío del formulario; una librería no agregaría nada y sí peso. La etiqueta es parte del objetivo táctil: la fila entera mide 44 px. |
| `icons` | ui | — | Los pocos iconos que las primitivas necesitan (cerrar, chevron, tilde), como SVG inline. No hay librería de iconos en el stack: son dos trazos. Sin texto adentro; la etiqueta accesible la pone quien los usa. |
| `AccountMenu` | app | con sesión / sin sesión | La cabecera de la hoja, dentro de `PaperFrame`: «Entrar» sin sesión, «Mi perfil» con sesión, en las tres capas de ruta. El borde de tinta que la separa del contenido aparece con la hoja, en 1024. Pregunta por la **sesión** y no por el perfil: alguien que entró y todavía no lo completó está adentro. |
| `ErrorTextsProvider` | app | — | El único `NextIntlClientProvider` del producto, en los layouts de `(app)` y `(auth)`. Existe porque un `error.tsx` es cliente por definición de Next y recibe solo `error` y `reset`: no hay forma de bajarle los textos por props, y sin contexto el propio límite de error lanza al renderizar. Lleva **seis claves**, no los mensajes enteros: las del título y el reintento, y las del error de «Mi perfil» y de «Verificar teléfono». |
| `EmailLinkForm` | auth | `loading` `error`; `isPrimary` | El correo de la pantalla de ingreso. Valida con el mismo schema que la acción. Su botón es la `tirita` **solo cuando Google no está disponible**, y entonces va a la vista; con Google vive dentro de `EmailFallback` y su botón es `secondary`. Quién es la principal lo decide la pantalla, no el formulario. |
| `EmailFallback` | auth | cerrado / abierto | La puerta de atrás del ingreso cuando hay Google: un `details` nativo, sin JavaScript, cuyo `summary` es un `Button ghost` («Prefiero entrar con mi correo») con el chevron que gira al abrir. Cerrado por defecto; abierto si el intento con Google falló, porque el aviso manda a usar el correo. Si Google no verificó la dirección no aparece: el correo pasa a ser la tirita y Google se va (`lib/auth/sign-in-layout.ts`). |
| `GoogleButton` | auth | `loading` | La acción principal del ingreso: una tirita con **talón**. Un corte punteado vertical la parte en dos; el talón es papel y lleva la G, el bloque es tinta y lleva «Entrar con Google» en voz de afiche: el mismo verbo que el título, el aviso y «Prefiero entrar con mi correo», y no el «Continuar» que sugiere Google. Ancho completo, 56 px, con la perforación arriba como toda tirita. Al hover se invierte solo el bloque, para que la G nunca quede sobre tinta; al cargar, el spinner va sobre el texto del bloque con el mismo `BusyLabel` de `Button`. La hoja cliente es `GoogleSubmit`, que lee el estado del formulario. La G es la oficial de Google (`public/brand/google-g.svg`, sacada de `signin-assets.zip` sin cambiarle forma ni color, a 24 px): a color y sobre blanco, que es lo único que su guía de marca no deja tocar; nunca se redibuja, se pasa a un color ni se apoya sobre tinta. No es un `Button` de ui/ porque ninguna variante tiene dos partes. Se muestra solo si hay credenciales (FR-011). |
| `ResendLinkButton` | auth | `waiting` `loading` | Pedir otro enlace desde «Revisá tu correo», con la cuenta regresiva. La cuenta sale de los pedidos de **este navegador**: de la dirección delataría a su dueña. |
| `LinkProblemScreen` | auth | `problema` `enviando` `enviado` `error` | La pantalla de «El enlace no sirve» entera, incluido su `h1`: pedir otro enlace cambia el título a «Enlace en camino», porque el título en voz de afiche es lo más grande de la pantalla y dejarlo diciendo que el enlace no sirve contradiría lo que la persona acaba de conseguir. Manda el **id** del enlace y no una dirección: el servidor la resuelve y la pantalla nunca la conoce, así que no la puede mostrar. Es la única pantalla de auth donde el cliente dibuja el encabezado, y por eso el `use client` no baja más: el estado cambia el título. |
| `Avatar` | profile | con foto / sin foto; `md` `lg` | Cuadrado con el borde de tinta. Sin foto, las iniciales; nunca un contorno genérico de persona. La decisión vive en `lib/profile/avatar-display.ts`. |
| `AvatarField` | profile | `vacío` `procesando` `con foto` `error` | Elegir, procesar, previsualizar y quitar. La vista previa aparece recién cuando el procesado terminó: hay formatos de teléfono que el navegador no dibuja tal cual. |
| `LocalityField` | profile | `abierto` `sin coincidencias` `error` | El renglón con sugerencias, como combobox de WAI-ARIA 1.2. No es una primitiva: tiene un solo uso, y se muda a `ui/` recién con el segundo. |
| `ProfileFields` | profile | — | Los cuatro campos del perfil, incluido el departamento de lista cerrada y la localidad, cuya **etiqueta cambia**: «Barrio» en Montevideo, «Localidad» en los otros dieciocho. Separado de `ProfileForm` porque una cosa es qué se pide y otra qué pasa al guardar. |
| `SavedToast` | profile | `success` · `error` | El aviso de guardado, montado en la pantalla a la que se llega y no en el formulario que se deja: el formulario se desmonta con la navegación y el aviso se iba con él antes de poder leerse. `error` existe porque cancelar un número a medias también puede fallar, y el aviso lo dice con la banda de ceibo. |
| `ProfileForm` | profile | `editando` `guardando` `saliendo` `error` | Coordina los campos y el guardado, con cada error debajo de su campo y el de guardado arriba del botón. Sirve para completar y para editar; cambia el verbo, no el formulario. Con cambios sin guardar, un clic en un enlace nuestro abre el `Dialog` en vez de navegar: perder lo escrito tampoco se deshace. «Seguir editando» primero, porque es lo que quiere quien llegó ahí sin querer. |
| `ProfileSummary` | profile | con foto / sin foto; rescatista | El perfil en lectura. «Rescatista» es una **etiqueta informativa** con borde de tinta, como `PetAttributes`: no es un sello, porque el sello marca un estado y esto es un atributo que no cambia solo; y no va en yerba, porque el verde y la prominencia son de la chapita. |
| `PersonalDataNotice` | profile | — | Las dos mitades de la verdad antes de guardar: el correo no se muestra nunca, y el nombre, la foto y la zona van a ser públicos. |
| `AccountActions` | profile | — | Las dos salidas de una cuenta —cerrar sesión y borrarla— juntas y en el mismo orden en las dos pantallas donde aparecen. Al pie y en `ghost`: son salidas, no el próximo paso. |
| `DeleteAccountDialog` | profile | `confirmando` `borrando` `error` | La confirmación irreversible, que es para lo que `Dialog` está reservado. Se controla con `open`: cerrar al tocar dejaría a la persona sin saber si se borró. |
| `PetCard` | pets | `available` `in_process` `adopted` `paused`; `urgent` | Una foto pegada al poste: 4:5 con ThumbHash, sin radio, con `.cinta-esquinas` y apenas inclinada (`--tilt`, alternando el lado). Nombre en voz de afiche `--text-lg` y zona debajo. El estado es un sello (`.sello`) sobre la foto, solo si no está disponible: `in_process` en `--color-ink`, `adopted` en `--color-primary` (salió bien), `paused` en `--color-ink-muted`. Ninguno en acento: en un listado habría varios, y el único acento del listado es `UrgencyTag`. En hover se despega (`.lift`) y la foto hace zoom 1.03, con la cinta en el contenedor y la imagen en un div interno. |
| `PetPhotoGallery` | pets | 1–5 fotos | A sangre, snap horizontal, puntos de posición; `view-transition-name` en la portada. |
| `PetAttributes` | pets | — | Etiquetas informativas (castrado, vacunas, chip, convive con): solo las verdaderas. Texto con borde de tinta de 2 px, sin relleno. No son tiritas: no se arrancan, informan. |
| `VerifyPhoneScreen` | verification | sin teléfono · a medias · cambio a medias · verificado; con y sin `para` | La pantalla «Verificar teléfono» entera a partir del estado del teléfono y la puerta. Con `para` es el aviso de verificación pendiente: el encabezado de la acción y «Ahora no» al pie. **Una sola tirita, la del próximo paso real**: «Mandarme el código» si no hay nada a medias, «Escribir el código» si lo hay; corregir el número es el desvío, en `secondary`. |
| `CodeEntryScreen` | verification | con y sin `para` | «Escribir el código»: a qué número se mandó —en `--font-weight-medium`, es lo que la persona necesita confirmar—, corregir, para qué acción es, el formulario y «Ahora no». |
| `VerifyHeading` | verification | con y sin bajada | El `h1` de las pantallas de verificar y su bajada. Por la puerta, los dos nombran la acción que se tocó y por qué hace falta el teléfono. Solo el encabezado: la salida la pone la pantalla. |
| `PhoneStatusCard` | verification | verificado · sin teléfono · a medias · cambio a medias | La sección de teléfono de «Mi perfil», con la etiqueta «Tu teléfono» en los cuatro estados, como «Tu correo» arriba. Sin teléfono es el paso pendiente y no un hueco; no es un `EmptyState`, que centra y lleva ilustración. Todo en `secondary` o `ghost`: la tirita de la pantalla sigue siendo «Editar mi perfil». «Cancelar la verificación» o «Cancelar el cambio», nunca «Cancelar» a secas, que en la misma pantalla es el no hacer nada del diálogo de borrar. |
| `PhoneNumberCard` | verification | verificado · a medias · cambio a medias; con y sin etiqueta | El número en una `Card` con su **sello**: «Verificado» en `--color-primary` y "Nivel 1 desde…" en texto, o «Sin confirmar» en `--color-warning` (le toca actuar a alguien) y "tu cuenta está sin verificar"; en un cambio, "si cancelás, vuelve el…". Es un sello porque es un estado que cambia; la chapita de cada nivel es la de `VerificationBadge` y llega con la historia #12. El número anterior no se muestra como verificado mientras la cuenta no lo está. |
| `PhonePrivacyNotice` | verification | — | Las dos mitades de la verdad junto a cada campo de número: la yerba solo en "no se lo mostramos a nadie", la otra mitad en `--color-ink-muted`, para que "lo va a ver la otra persona" no se lea como garantía. |
| `PhoneNumberForm` | verification | quieto · enviando · esperando · error · no se sabe si salió; `isPrimary` | El renglón del número (`inputMode="tel"`), sus errores bajo el renglón y el pedido. Con una espera o un tope, el botón se deshabilita y `NextCodeHint` dice cuándo: nunca un botón habilitado que después dice "llegaste al tope". |
| `PhoneCodeForm` | verification | quieto · verificando · error por motivo · reenviando · reenviado · esperando · número en uso | Una sola hoja con el reenvío, porque pedir otro vacía el renglón y vuelve a contar la espera y los intentos. Con el número en otra cuenta, el renglón y el reenvío se van: quedan el error y `NumberInUseWays`. |
| `CodeField` | verification | quieto · error · con intentos | **Un solo `input`** con `autocomplete="one-time-code"` a `--text-2xl` con `tabular-nums`, sin espaciado extra: los seis cuadraditos de cualquier kit rompen el pegado y la sugerencia del teléfono. "Te quedan N intentos" va atado al renglón con `aria-describedby`. |
| `ResendCode` | verification | quieto · reenviando · reenviado · esperando · error | La ayuda de "¿no llegó?" en `--color-ink-muted`, sin caja, justo arriba de «Mandarme otro código» en `ghost`. Lo que responde el reenvío va junto al botón, con `<output>` o `ErrorText` anunciado, y no en el renglón del código, que no tiene nada de malo. |
| `NumberInUseWays` | verification | con y sin «Seguir» | Los caminos de quien encuentra su número en otra cuenta, sin nada de esa cuenta. La tirita es el próximo paso real: «Seguir» si la cuenta volvió a nivel 1 y se llegó por una acción, «Verificar otro número» si no. |
| `CancelPendingButton` | verification | quieto · cancelando | El botón `ghost` de un `<form action>`: cancelar funciona sin JavaScript; el cliente solo agrega el estado ocupado. |
| `NotNowLink` | verification | — | «Ahora no», en `ghost`, a la pantalla desde la que se tocó la acción o al inicio. |
| `NextCodeHint` | verification | segundos · día y hora | "Podés pedir otro en 42 segundos" o "…mañana a las 9:15", afuera del botón y sin `aria-live`. Lo usan los dos formularios del teléfono y `ResendLinkButton`. |
| `PhoneNotice` | app | los avisos de «Mi perfil» y «Verificar teléfono» | Lee la marca que dejó la acción anterior (`guardado`, `error`) y monta `SavedToast` con el texto y la variante que decide `screenNotice`. |
| `VerificationBadge` | verification | `level: 1 / 2 / 3`; `size: sm / md / lg` | **La chapita.** Círculo con la argolla arriba. Nivel 1: contorno primario; nivel 2: relleno primario con tilde; nivel 3: relleno más anillo grabado "avalado". Brilla una sola vez al aparecer. Siempre con su etiqueta accesible ("Verificado, nivel 2"). |
| `OwnerCard` | verification | — | Una nota pegada con cinta (`Card taped`): nombre, zona, chapita, cuántas adopciones con seguimiento. Nunca el contacto. |
| `ApplyButton` | applications | `needs_verification` `limit_reached` `ready` | Es el `Button` `tirita`: la acción principal de la ficha. Sticky abajo en el teléfono. El texto dice el próximo paso real. |
| `ApplicationCard` | applications | `pending` `info_requested` `accepted` `rejected` | Chapita del solicitante, tres respuestas clave, estado a la derecha. |
| `ApplicationStatus` | applications | mismos estados | Un sello (`.sello`), con un color por estado: `accepted` en `--color-primary`, `info_requested` en `--color-warning` (le toca actuar a alguien), `pending` en `--color-ink` (en espera, sin urgencia), `rejected` en `--color-ink-muted`. |
| `ContactReveal` | applications | `hidden` `revealed` | Al aceptar, el contacto aparece con un fade y un botón "Abrir WhatsApp" con texto prellenado. Antes, nada, ni un placeholder. |
| `ZoneLabel` `UrgencyTag` | pets | — | Texto plano con icono; `UrgencyTag` es el único uso del acento en el listado. |

Un componente nuevo entra en esta tabla en el mismo PR que lo crea.

## Fotos e ilustraciones

- Cards y galería en 4:5 (vertical, como sale del teléfono); thumbs 1:1. Recorte centrado con
  `object-position` ajustable por foto.
- Tres tamaños WebP + ThumbHash como placeholder (`07-stack.md`); del borroso al nítido con
  fade de `--dur-base`. Sin filtros, sin marcos, sin esquinas distintas al `--radius-card`.
- Nunca texto sobre la foto, ni en la card ni en la ficha: el nombre y la zona van debajo. Lo
  único que se apoya sobre una foto es el sello de estado. Un degradé para poder leer texto
  encima sería un gradiente de decoración.
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

Contraste AA en todo texto · anillo de foco visible con teclado en todo lo interactivo (la única
excepción son los campos de renglón, `Input` y `Select`: su indicador de foco es la línea, que pasa
de 2 a 4 px; un anillo dibujaría una caja alrededor de un campo que no la tiene) ·
objetivos táctiles ≥ 44 px · inputs a 16 px · `prefers-reduced-motion` respetado · HTML
semántico (un `h1` por pantalla, botones que son `button`, links que son `a`) · las fotos con
`alt`, la chapita con etiqueta · el listado y la ficha usables sin JS.

## Antipatrones

No se hace, aunque parezca "lindo": fondo crema con acento terracota · una serif de contraste
alto en los títulos · etiquetas en mayúsculas tracking abierto sobre los títulos · metadatos
unidos con `·` · flechas `→` en botones y links · esquinas redondeadas en papel (lo único
redondo es la chapita) · verde en una acción (el verde es confianza, la acción es tinta) · un
recurso del cartel usado de decoración · recursos apilados en un mismo bloque · la inclinación
sobre texto de lectura · la misma sombra gris
bajo cada tarjeta · gradientes de decoración · secciones que aparecen con fade al hacer scroll ·
numerar cosas que no son una secuencia · un spinner genérico donde va un skeleton · un color
fuera de los tokens · un texto fuera de `messages/`.

## Cómo se aplica

**Si llegás nuevo a este repo, empezá por acá.** Tres cosas muestran cómo se ve este sistema, y
las tres valen más que cualquier descripción:

1. **`/muestra`** con `pnpm dev`: las once primitivas vivas, con cada variante y estado. Lo que
   está ahí se usa; no se reimplementa.
2. **`docs/design/cartel-referencia.html`** (y su `.png`): la maqueta con la que Hernán eligió
   esta identidad. Muestra lo que todavía no existe como código —el listado, una `PetCard` con
   cinta y sello, la nota del publicador con la chapita, la `tirita` de "Quiero adoptar"—. Es una
   referencia, no código: si difiere de los tokens de este doc, ganan los tokens. Trae colores
   que **no son tokens** y no se copian: los de las fotos de mentira (ahí van fotos reales), el
   gris del escritorio de fondo, y los grises de metal de la chapita, que son provisorios hasta
   que la historia de `VerificationBadge` los defina como tokens acá.
3. **Las capturas** de `node scripts/walk.mjs`, a 390 px —como lo va a ver quien lo use— y a
   1280, que es donde trabaja quien rescata.

La regla que más se rompe al llegar: acá **la acción es tinta y el verde es confianza**. Un botón
verde es un error, no un matiz.

1. **Al planificar** (`stages/spec.md`, paso del plan): si la historia toca UI, el agente carga
   `frontend-design:frontend-design`, lee este doc y escribe una sección **«Diseño»** en
   `plan.md`: wireframe en ASCII de cada pantalla nueva, qué componentes de la tabla reutiliza y
   cuáles crea, qué tokens usa, cuál es el único elemento que llama la atención en esa
   pantalla, y los tres estados de cada bloque con datos. `plan-reviewer` la revisa contra
   este doc antes de que exista código.
2. **Al construir** (`stages/build.md`): el skill se carga antes del primer JSX o CSS. Solo se
   usan tokens de `globals.css`; **un token nuevo es una edición a este doc en el mismo PR**,
   nunca un valor suelto. Un componente nuevo entra en la tabla de componentes.
3. **Al revisar** (`stages/review.md`): `design-reviewer` califica el diff y las capturas de los
   **dos anchos** contra este doc, sección por sección, y cita la regla que aplica.
4. **Al validar** (checkpoint humano): Hernán recorre el build local con este doc al lado. Lo
   que no le convence del sistema se cambia acá primero, con fecha, y después en el código.

## Decisiones

- **Decisión (2026-09-22):** el estado del teléfono (historia #10) es un **sello** —«Verificado» en
  yerba, «Sin confirmar» en mate cocido— y el nivel se dice en texto ("Nivel 1 desde…"). La chapita
  de cada nivel (`VerificationBadge`) espera a la historia #12, la del perfil público, porque sus
  grises de metal todavía no son tokens. Descartado: adelantar la chapita en «Mi perfil»; sería
  diseñarla dos veces.
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
- **Decisión (2026-09-20):** en pantallas anchas la app vive dentro de una hoja de papel con
  borde, apoyada sobre una pared; el tamaño del papel lo fija la zona y no la pantalla, y cada
  pantalla se revisa a 390 y a 1280. Detalle, alternativas y descartes en §Pantallas anchas.
- **Decisión (2026-09-22):** en el ingreso, **Google es la acción principal y la única a la
  vista**: una tirita con talón (`GoogleButton`), con la G oficial de Google en el talón de papel
  y el texto en el bloque de tinta. El enlace por correo queda como puerta de atrás, cerrado detrás
  de «Prefiero entrar con mi correo» (`EmailFallback`), y se abre solo cuando Google acaba de
  fallar. Sin credenciales de Google el correo va a la vista y como tirita (FR-011), y lo mismo si
  Google acaba de no verificar la dirección: el aviso dice que por ahí no se entra. El botón habla
  con la voz del cartel y no con el formato de la guía de marca de Google, que pide Google Sans y
  uno de sus tres temas de color: de la guía se respeta la G, a color y sobre blanco, que es lo que
  hace reconocible el botón. El correo no se borra: es el único camino para quien no tiene cuenta
  de Google y para quien llega desde el navegador de Instagram o Facebook, que Google rechaza
  (`disallowed_useragent`) — justo el tráfico que va a traer una plataforma de adopción.
  Descartado: (a) el enlace por correo como tirita y Google como atajo `secondary` debajo de un
  «o» (historia 002, 2026-09-19, lo que había en `main`): la acción principal estaba en el camino
  que usa la minoría; (a′) Google como tirita y el correo a la vista debajo del «o» (2026-09-20,
  nunca llegó a `main`): el correo seguía compitiendo con Google; (b) **solo** Google: deja afuera
  a quien usa iCloud, Outlook o el correo del trabajo, y no ahorra Resend, que igual manda las
  notificaciones de solicitud; (c) el botón con el formato exacto de Google (tema oscuro, Google
  Sans): cumplía la guía al pie de la letra pero era una pieza ajena al cartel y sumaba una segunda
  familia tipográfica; (d) la tirita con la G en un cuadrado blanco y un botón de papel con la G
  directa: se vieron como maquetas y el talón fue el más propio del cartel.
- **Decisión (2026-09-18):** la identidad es **el cartel de "se busca hogar"**. Al ver las
  primitivas de F00, Hernán las encontró genéricas ("hay miles de páginas con ese estilo") y
  pidió identidad propia, que se note el trabajo y el cariño. Eligió entre tres maquetas
  renderizadas (Cartel, Esmalte, Patio). Cambia el principio 2, la acción pasa de yerba a tinta
  y el verde queda reservado para la confianza, los radios van a cero, entra la voz de afiche
  y entran los recursos del cartel. Todo es CSS: el presupuesto de performance no se toca.

## Descartado

- **Capa base "quieta y disciplinada" con la chapita como único elemento audaz (2026-09-18).**
  Con la chapita y las fotos todavía sin existir, lo visible era solo la capa quieta:
  rectángulos redondeados, borde fino, relleno verde. El kit de cualquier SaaS con otro color.
  La identidad tiene que estar también en la capa base.
- **Dirección "Esmalte" (2026-09-18):** todo el sistema con el lenguaje de la chapita (aro de
  metal, esmalte, argollas). Si todo es chapita, la de verificación deja de ser especial, y el
  borde grueso con sombra dura se parece a una moda que va a verse fechada.
- **Dirección "Patio" (2026-09-18):** la baldosa calcárea como firma. El patrón es decoración,
  no información; compite con las fotos, y el resto seguía siendo el kit genérico.

- **Crema + terracota + serif de contraste.** Es el look que hoy produce cualquier generador;
  no distingue y tiñe las fotos.
- **Dos familias tipográficas.** Un archivo menos y la misma personalidad con el eje óptico.
- **Bronce / plata / oro para los niveles.** Gamifica la confianza; los niveles se leen en la
  forma de la chapita, no en el metal.
- **Aparición escalonada de cards al scroll.** Movimiento que nadie pidió; queda solo lo que
  responde a una acción.
