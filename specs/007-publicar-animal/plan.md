# Implementation Plan: Publicar un animal con sus fotos y sus datos

**Branch**: `feature/53-publicar-animal-fotos-datos` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/007-publicar-animal/spec.md` (3 user stories, endurecida en tres rondas con
`spec-grader` y `spec-adversary`; lo que quedó abierto está en sus Assumptions). Revisado por
`plan-reviewer` en dos rondas; los hallazgos de la segunda se plegaron sin una tercera.

## Summary

Es la primera historia con animales: no hay tabla, ruta ni componente de mascotas en `main`. Una
persona con nivel 1 publica un perro o un gato con 1 a 5 fotos y los datos de la ficha, lo corrige
cuando cambia algo, y ve lo suyo en «Mis animales». Nadie más lo ve todavía.

Cuatro decisiones ordenan el plan:

1. **Las fotos suben una por una a una zona de espera, y publicar las engancha** (research R1). Cada
   foto se prepara en el navegador al elegirla —tres WebP sin metadatos y su ThumbHash (R3)— y, al
   tocar «Publicar», sube en su propia Server Action con un id que genera el cliente. Publicar manda solo los ids en orden. Eso da el
   progreso «2 de 5», el reintento que sube solo lo que falta, y una publicación que se crea entera
   o no se crea.
2. **Toda escritura es una función de la base, con candado y con el nivel 1 comprobado adentro**
   (R5). Es el patrón de `phones`: `publish_pet` y `save_pet` hacen todo o nada, y el TTL del número
   a medias llega como parámetro desde `lib/verification/rules.ts`, que sigue siendo la única
   fuente.
3. **Un intento publica una vez** (R6). El `attemptId` de la pestaña es único por dueña en la base;
   `publish_pet` lo busca antes que cualquier otra cosa. Dos toques, un reintento o una respuesta
   perdida terminan en la misma publicación.
4. **Las fotos son privadas en esta historia** (R4). Bucket privado con carpeta por dueña y URLs
   firmadas, como la foto de perfil. La historia siguiente decide cómo se ven las de una
   publicación disponible.

## Technical Context

**Language/Version**: TypeScript 7 (`strict`), React 19.3, Next.js 16.3.5 (App Router)

**Primary Dependencies**: las de `main` más **`thumbhash` 0.1.1** (la última, verificada el
2026-09-26; R3). Se instala con `pnpm add thumbhash@latest` y se registra en `docs/07-stack.md`.

**Storage**: Postgres y Storage de Supabase (local). Una migración: `pets`, `pet_photos`, el bucket
privado `pet-photos` con su policy de lectura, y seis funciones. Detalle en [data-model.md](./data-model.md).

**Testing**: Vitest (unidad + base local), Playwright (un flujo crítico y una medición de
rendimiento), Stryker al 100 % sobre lo que tenga test.

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura fijada por F00.

**Performance Goals**: el presupuesto: LCP < 2,5 s, JS inicial < 150 KB, Lighthouse mobile ≥ 90.
«Mis animales» es Server Component; su única hoja cliente es `PetPhoto`, el `<img>` que pasa del
ThumbHash a la foto con su propio `onLoad` (y `ref.complete` al montar, para la que cargó antes
de hidratar), con el data URL del ThumbHash armado en el servidor. No usa `useImageStatus`, que
cargaría una segunda copia de la foto. El formulario es la hoja cliente grande de la historia; `thumbhash` pesa ~2 KB y el
procesado usa el canvas del navegador. Un WebP `card` de 800 px ronda 60-120 KB; la lista carga
`thumb` (400 px) en la grilla de dos columnas y `card` desde 768.

**Constraints**: `experimental.serverActions.bodySizeLimit` a 2 MB (R2). Sin Cron: la purga corre dentro de las
acciones (R13). HEIC sigue sin aceptarse (KL-007).

**Scale/Scope**: 3 rutas, 1 migración, 6 funciones, 5 acciones, ~20 componentes (1 primitiva nueva),
1 dependencia.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas, rutas ni componentes; el cómo está acá. |
| **II. Una feature, un PR** | Tres user stories que se construyen y verifican una por una, en un PR. |
| **III. Compuertas verdes y revisión fresca** | `pnpm verify` completo; qué se testea y por qué, en §Qué se testea. |
| **IV. Reglas como código** | Nivel 1, propiedad, 1–5 fotos, idempotencia del intento y cambio en otra pestaña son funciones de la base con test; la visibilidad es RLS y policies de Storage con test de lectura y escritura fallida; la edad, la regla de contacto, la lista de fotos, el nombre repetido y lo escrito son funciones puras con test. |
| **V. Datos personales mínimos y privados** | Las fotos no salen del navegador con metadatos ni nombre original; bucket privado; nadie más lee `pets` ni `pet_photos`; las fotos en espera viven 24 horas; borrar la cuenta borra objetos y filas; lo escrito vive en el navegador, atado a la cuenta, 30 días. |
| **VI. Sin deriva** | Nada de la tabla «Fuera del MVP»: perro y gato, zona sin mapa, sin chat. No hay estados, expiración, listado público ni ficha pública: son de las historias siguientes. |
| **VII. Liviana y linda, medido** | Server Components por defecto; la hoja cliente es el formulario. Todo contra docs/10; una primitiva nueva (`RadioGroup`) registrada en su tabla, sin tokens nuevos. |
| **VIII. Autonomía con veto** | Se deciden y se avisan en Ship, en un issue `aviso`, las decisiones que cambian lo que `docs/` decía: los usuarios de redes en la regla de contacto (spec), las fotos en un bucket privado en vez del público de docs/07 (R4), publicar en una sola pantalla en vez de un paso por pantalla (R15), `LocalityField` en el dominio en vez de `ui/` y `SavedToast` en la capa `app` (docs/10), y `RadioGroup` como duodécima primitiva, que deja desactualizado el «las once primitivas» de `CLAUDE.md` (que necesita `reglas-aprobadas`). Nada reservado: no hay plata, nombre, stack transversal ni privacidad nueva que abra datos. |

**Sin violaciones**: la tabla de Complexity Tracking queda vacía.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. Cargado
`frontend-design:frontend-design` antes de escribir esta sección.

**La idea que ordena las pantallas.** Publicar es armar el cartel de «se busca hogar»: primero la
foto, que es lo que manda en todo el sistema, y después los datos que el adoptante pregunta siempre.
Por eso el formulario arranca con **las fotos** —vacío, con la invitación grande a la primera— y no
con el nombre. Mientras se arma, las fotos van en 1:1, que es como se ordenan y se comparan
(docs/10: thumbs 1:1); el 4:5 es como las ve el adoptante, en la card. «Mis animales» es la pared de lo que la persona ya pegó: las mismas `PetCard` que va
a tener el listado público, para que lo que ve la rescatista sea lo que va a ver el adoptante.

Los `h1` van en `.afiche` y en oración con mayúscula inicial. **Ningún token nuevo.**

### Tokens

Color: `--color-canvas` de fondo; `--color-ink` en texto, bordes y acciones; `--color-ink-muted` en
ayudas, contadores y la nota de lo recuperado; `--color-surface` en la nota de lo recuperado y en el
fondo de los huecos de foto; `--color-accent` en errores y en `UrgencyTag`, que es texto plano con
un icono, como dice su fila de docs/10 (el único acento de la pared).
Tipografía: `.afiche` en `h1` y en el nombre de cada card (`--text-lg`); `--text-lg` y
`--font-weight-bold` en las leyendas de cada grupo del formulario; `--text-base` en campos;
`--text-sm` en ayudas y contadores. Espacio: `--space-2` entre fotos chicas, `--space-3` entre
cards (docs/10 §Layout), `--space-8` entre grupos. Movimiento: `--dur-fast` al marcar una opción,
`--dur-base` al entrar una foto preparada (del ThumbHash al nítido) y un error. Recursos:
`.cinta-esquinas`, `--tilt` y `.lift` en las fotos de las cards (docs/10, `PetCard`);
`.perforado` en la tirita. Sin sello: «Portada» es un lugar en el orden, no un estado, y va en
texto debajo de la foto.

### Mis animales · `/mis-animales`

```
390 px, con animales                       390 px, vacío
┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│             Mis animales  Mi perfil  │   │             Mis animales  Mi perfil  │
│ Mis animales                    (h1) │   │ Mis animales                    (h1) │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │   │                                      │
│ [ Publicar un animal             ]   │   │        (ilustración, 112 px)         │
│   tirita                             │   │   Todavía no publicaste ningún       │
│ ┌──────────────┐ ┌──────────────┐    │   │   animal. Empezá con una foto.       │
│ │▚ foto 4:5  ▞│ │▚ foto 4:5  ▞│    │   │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ │  (cinta)     │ │              │    │   │  [ Publicar un animal       ]       │
│ └──────────────┘ └──────────────┘    │   │     tirita                           │
│ Luna             Tobi                │   └──────────────────────────────────────┘
│ Pocitos          Malvín              │
│ ▲ Urgente                            │
│ ┌──────────────┐ ┌──────────────┐    │
│ …                                    │
└──────────────────────────────────────┘
```

- **Componentes**: `PageShell width="full"` (es una grilla, como el listado), `MyPetsGrid`
  (nuevo, la grilla de dos columnas, tres desde 768, cuatro desde 1024, docs/10 §Layout), `PetCard`
  (nuevo, fila existente de docs/10: foto 4:5 con ThumbHash, `.cinta-esquinas` y `--tilt`
  alternando el lado, nombre en voz de afiche `--text-lg`, `ZoneLabel` debajo, `UrgencyTag` si es
  urgente; el sello de estado solo si no está disponible, que en esta historia no pasa),
  `ZoneLabel` y `UrgencyTag` (nuevos, filas existentes), `LinkButton variant="tirita"` para
  publicar, `EmptyState` para el vacío (su acción es la tirita: una sola por pantalla), `SavedToast`
  para «Publicado» y «Guardado» (el patrón de `PhoneNotice`: la acción deja `?guardado=publicado`
  o `?guardado=editado` y la pantalla monta el aviso). `SavedToast` se muda de
  `components/profile/` a `app/[locale]/_components/`: lo montan solo las páginas, y ahora de dos
  dominios; su fila de docs/10 cambia de capa.
- **Cada card es un enlace**: `PetCard` es un `<a>` a `/mis-animales/[id]/editar` con `.lift`
  directo, como dice su fila de docs/10, y **no** un `Card`: el borde de tinta del `Card` sobre la
  cinta y la inclinación de la foto serían recursos apilados. `alt` de la foto: «Foto de Luna,
  perra en Pocitos, Montevideo» (docs/10 §Fotos, con la zona de `ZoneLabel`). `ZoneLabel` dice la
  localidad y el departamento, «Pocitos, Montevideo», en `--text-sm` `--color-ink-muted`. Las primeras 4 fotos cargan de entrada; el resto, `lazy`.
- **`UrgencyTag`**: «Urgente» en `--color-accent`, `--text-sm`, `--font-weight-medium`, con un icono
  nuevo de `ui/icons` (`UrgentIcon`, un signo de exclamación en un triángulo, dos trazos), debajo
  de la zona. Sin fondo.
- **Lo único que se lleva la atención**: las portadas. La tirita está arriba porque es la acción
  de la pantalla, pero la pared es la de las fotos.
- **Cargando** (`loading.tsx`): el `h1`, la forma de la tirita, y cuatro `Skeleton` 4:5 con dos
  renglones debajo, en la misma grilla.
- **Vacío**: `EmptyState` con la frase de la muestra y la tirita «Publicar un animal».
- **Error** (`error.tsx` de la ruta): `ErrorScreen` con `pets.my_pets.error` y reintentar, y debajo
  «Publicar un animal» como `LinkButton secondary` —el reintento es la tirita del error, y la acción
  de publicar sigue a la vista (spec §Pantallas)—. El aviso «Publicado»/«Guardado» se monta igual:
  `error.tsx` lee la marca de la URL con `useSearchParams` y monta `SavedToast`.
- **Cabecera**: `AccountMenu` suma «Mis animales» a la izquierda de «Mi perfil», los dos `ghost`,
  solo con sesión (FR-026).

### Publicar un animal · `/mis-animales/publicar`

```
390 px, vacío                              390 px, con 3 fotos
┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│ Publicar un animal              (h1) │   │ Publicar un animal              (h1) │
│ ┌──────────────────────────────────┐ │   │                                      │
│ │                                  │ │   │ ┌──────────────────┐┌──────────────────┐
│ │                                  │ │   │ │                  ││                  │
│ │          Agregá fotos            │ │   │ │   foto 1:1       ││   foto 1:1       │
│ │  Hasta 5. La primera es la       │ │   │ │                  ││                  │
│ │  portada.                        │ │   │ └──────────────────┘└──────────────────┘
│ │                                  │ │   │ Portada              Hacer portada    │
│ └──────────────────────────────────┘ │   │ [‹][›][×]            [‹][›][×]        │
│                                      │   │ ┌──────────────────┐┌──────────────────┐
│ El animal                   (legend) │   │ │   foto 1:1       ││  Agregá fotos    │
│ Nombre ____________________________  │   │ └──────────────────┘└──────────────────┘
│ Especie  [ Perro ][ Gato ]           │   │ Hacer portada                          │
│ Sexo     [ Macho ][ Hembra ]         │   │ [‹][›][×]                              │
│ Edad aproximada ____  [Meses][Años]  │   │ 3 de 5 fotos                           │
│ Tamaño de adulto                     │   │ …                                      │
│ [ Chico ][ Mediano ][ Grande ]       │   └──────────────────────────────────────┘
│                                      │
│ Salud                       (legend) │   ‹ › × son `Button ghost sm` de 44 px con
│ Castrado  [ Sí ][ No ]               │   el icono y su aria-label: «Mover antes»,
│ Vacunas [Al día][Incompletas][Sin v.]│   «Mover después», «Sacar foto»
│ Chip      [ Sí ][ No ]               │
│                                      │
│ Convive con                 (legend) │
│ Niños  [ Sí ][ No ][ No se sabe ]    │
│ Perros [ Sí ][ No ][ No se sabe ]    │
│ Gatos  [ Sí ][ No ][ No se sabe ]    │
│                                      │
│ Dónde está                  (legend) │
│ Departamento [Montevideo       v]    │
│ Barrio ____Pocitos_________________  │
│ Si está en un hogar de tránsito,     │
│ poné dónde está el animal.           │
│                                      │
│ Descripción (opcional)               │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ Sin teléfono, correo, enlaces ni     │
│ dirección: el contacto se da cuando  │
│ aceptás una solicitud.               │
│ [✓] Es urgente                       │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ [ Publicar                        ]  │  tirita
└──────────────────────────────────────┘
```

- **Las fotos** (`PetPhotosField`, hoja cliente): una grilla de fotos 1:1 (docs/10: thumbs 1:1),
  dos columnas a 390 px y tres desde 640, con `--space-3`, en el orden en que van a publicarse.
  Debajo de cada foto, su lugar en texto —«Portada» en `--font-weight-medium` en la primera, o
  «Hacer portada» (`Button ghost sm`) en las demás— y una fila de tres `Button ghost sm` de icono,
  44 px cada uno: «Mover antes» (chevron a la izquierda), «Mover después» (a la derecha) y «Sacar
  foto» (cruz), deshabilitados donde no aplican. **Cada acción es un toque, sin arrastrar y sin abrir
  nada** (FR-006). Sacar no pide confirmación: se deshace eligiendo la foto otra vez, y el `Dialog`
  es para lo irreversible. Nada se apoya sobre la foto (docs/10 §Fotos). Mientras haya lugar, la
  grilla termina en un casillero «Agregá fotos» 1:1 con borde de tinta.
- **Vacío**: la invitación ocupa todo el ancho de la grilla, 1:1: un `label` que envuelve el
  `input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple`, con borde de
  tinta de 2 px sobre `--color-surface`, «Agregá fotos» en voz de afiche y «Hasta 5. La primera es
  la portada.» en `--text-sm`, centrado porque es un estado vacío (docs/10 §Layout).
  **Preparando**: un `Skeleton` 1:1 en el casillero. **Lista**: la foto sobre su ThumbHash, que se
  enfoca con `--dur-base`. **Rechazada**: no ocupa casillero; el motivo va en `ErrorText` debajo de
  la grilla, uno por archivo, con el nombre del archivo solo en ese mensaje: el nombre se muestra
  en el navegador y nunca se manda. «3 de 5 fotos» en `--text-sm` `--color-ink-muted`, en un
  `output`. Los chevrons izquierda y derecha son el `ChevronDownIcon` de `ui/icons` girado con una
  clase; la cruz es `CloseIcon`.
- **Los campos** (`PetFields`, cuatro `fieldset` con `legend` en `--text-lg` bold, nunca en
  mayúsculas): `Input` para el nombre con `CharacterCount` (aparece desde los 25); `RadioGroup` para
  cada opción única (R14); `AgeField` = `Input inputMode="numeric"` + `RadioGroup` de unidad, en una
  fila, con su error debajo de la fila; `ZoneFields` (extraído de `ProfileFields`: departamento y
  `LocalityField` con su etiqueta que cambia) con la ayuda del hogar de tránsito; `Textarea` para la
  descripción con su aviso de contacto **antes** de escribir (atado con `aria-describedby`) y
  `CharacterCount` desde los 1800; `Checkbox` «Es urgente».
- **La tirita** «Publicar» al pie, no fija: fija taparía los campos del formulario más largo del
  producto. Mientras publica, `loading` (spinner sobre el texto, mismo ancho) y debajo, en un
  `output` con `aria-live="polite"`, «Subiendo fotos: 2 de 3» y después «Publicando…».
- **Lo único que se lleva la atención**: vacío, la invitación a la primera foto; con fotos, la
  grilla de fotos, que es lo primero de la pantalla.
- **A 1280**: la hoja `working` y `PageShell` en `--measure` (640 px): la grilla de fotos es de tres
  columnas de unos 200 px, y la invitación vacía ocupa dos de esas tres columnas, cuadrada, así no
  pasa de unos 420 px de alto. Los `RadioGroup` entran en una fila; los campos no se estiran más
  allá de la medida. No hay una segunda columna: se agregan columnas a la grilla, no se rediseña
  (docs/10 §Pantallas anchas).
- **Lo escrito recuperado** (`DraftRestoredNote`): arriba de las fotos, una nota sin borde sobre
  `--color-surface`, en `--text-sm`: «Recuperamos lo que habías escrito. Las fotos hay que elegirlas
  de nuevo.» y «Empezar de cero» en `ghost`. Si el intento ya se había publicado: «Ese animal ya
  está publicado.» con «Ver Mis animales» en `ghost`, y el formulario vacío.
- **Cargando** (`loading.tsx`): el `h1`, el `Skeleton` 1:1 de la invitación, y renglones con la
  forma de los primeros campos.
- **Error al cargar la pantalla** (`publicar/error.tsx`): `ErrorScreen` con
  `pets.form.load_error` («No pudimos abrir el formulario.») y reintentar; no el de la lista.
- **Error**: cada campo con su `ErrorText` debajo (`FieldShell`); al tocar «Publicar» con errores, el
  foco va al primero (FR-016; `useFieldFocus`, que ya existe). La vía de contacto dice qué encontró y
  lo cita: «Encontramos «099 123 456», que parece un teléfono. El contacto se da cuando aceptás una
  solicitud.» El guardado que no llegó va en `ErrorText` anunciado **arriba de la tirita**, y la
  tirita misma es el reintento: «No se publicó porque no hay conexión. Cuando vuelva, tocá Publicar
  de nuevo.» / «No se publicó: el sitio no respondió. Probá de nuevo.»
- **Diálogos** (`Dialog`, para perder lo cargado o elegir entre irse y quedarse):
  - `DuplicateNameDialog`: «Ya tenés una perra llamada Luna» · «Publicar igual» (`primary`) ·
    «Volver a Mis animales» (`secondary`), con la línea «Las fotos se pierden; lo escrito queda.»
    si hay fotos. Cerrar con la cruz deja el formulario como estaba.
  - `SaveBlockedDialog` (`session` | `level`): «Tenés que entrar de nuevo» / «Para publicar,
    verificá tu teléfono», qué se conserva y qué se pierde, «Entrar» / «Verificar» (`primary`) y
    «Quedarme» (`secondary`) (FR-022, FR-023). No se abre otro aviso al elegir irse.
  - Salir con fotos elegidas o con cambios sin guardar: el `Dialog` de `useUnsavedChanges`, con el
    texto de publicar o de editar, como `ProfileForm` («Seguir editando» primero). El botón de
    volver del navegador abre el mismo aviso (research R17).

### Editar un animal · `/mis-animales/[id]/editar`

El mismo `PetForm` con `mode="edit"`: `h1` «Editar a Luna» (el nombre guardado), las fotos
publicadas ya puestas, sin nota de recuperado, sin aviso de nombre repetido, y la tirita
«Guardar». La grilla de fotos es lo que se lleva la atención. El formulario lleva, ocultos, la edad
guardada al abrir y la que se mostró (research R7).

- **Cargando**: el mismo `loading.tsx` que publicar.
- **No existe o no es suyo** (`not-found.tsx` del segmento): `EmptyState` con «Este animal no
  existe.» y «Ir a Mis animales» (`LinkButton tirita`), con su `h1`, como `ErrorScreen`.
- **Error al traerlo**: `error.tsx` con `ErrorScreen` y reintentar.
- **Cambió en otra pestaña**: `ErrorText` arriba de la tirita, «Este animal cambió en otra
  pestaña.», con «Volver a abrirlo» (`ghost`, recarga la ruta).

### Aviso de verificación pendiente

Sin cambios: `VerifyPhoneScreen` con `para=publicar`. La puerta pone `next` en la ruta de publicar o
de editar y `desde` en `/mis-animales`.

### Componentes

| Componente | Capa | Nuevo / reusa | Notas |
|---|---|---|---|
| `RadioGroup` | ui | **nuevo** | Una fila de casillas de papel sobre radios nativos (`appearance: none`): borde de tinta 2 px, 44 px de alto, la elegida llena de tinta con el texto en papel —sin inclinarse ni bajar: no es una tirita arrancada, es una marca—. `fieldset` + `legend`, error con `FieldShell`. Se parte en dos renglones si no entra (tres opciones de vacunas). Entra en docs/10 §Componentes y en `/muestra`, con sus estados (quieto, elegido, foco, error, deshabilitado). |
| `UrgentIcon` | ui (`icons`) | **nuevo** | Exclamación en un triángulo, dos trazos, SVG inline; la etiqueta la pone quien lo usa. |
| `PetCard` | pets | nuevo (fila existente) | Recibe `PetSummary`. Es un `<a>` con `.lift`, no un `Card` (§Mis animales). |
| `PetPhoto` | pets | nuevo, **hoja cliente** | `<img>` con `srcSet` de las URLs firmadas, `sizes`, `width`/`height` para reservar el lugar, `loading` según la posición, y el ThumbHash de fondo (`style` con el data URL armado en el servidor, un valor dinámico real, docs/08 §Estilos) que se va con `--dur-base` en el `onLoad` del propio `<img>` (o al montar si `complete`). Lo usan `PetCard` y `PetPhotosField`. |
| `ZoneLabel` `UrgencyTag` | pets | nuevos (fila existente) | `UrgencyTag` es texto plano con `UrgentIcon`, como dice su fila. |
| `MyPetsGrid` | pets | nuevo | La grilla de cards. |
| `PetForm` | pets | nuevo | La hoja cliente que coordina fotos, campos, borrador y guardado; publicar y editar cambian el verbo, no el formulario (como `ProfileForm`). |
| `PetPhotosField` `PetPhotoTile` | pets | nuevos | La grilla de fotos, y cada foto con su lugar y sus tres acciones de un toque. |
| `PetFields` `AgeField` | pets | nuevos | Qué se pide, separado de qué pasa al guardar. |
| `CharacterCount` | pets | nuevo | «Quedan 4» / «Sobran 12» en `--text-sm`, atado al campo. Se muda a `ui/` con un segundo uso. |
| `DraftRestoredNote` `PublishProgress` | pets | nuevos | |
| `DuplicateNameDialog` `SaveBlockedDialog` | pets | nuevos | Sobre `Dialog`. |
| `PetNotFound` | pets | nuevo | |
| `ZoneFields` | zones | **extraído** de `ProfileFields` | Departamento + `LocalityField`; `ProfileFields` lo usa. Regla de dos. `LocalityField` se muda con él a `components/zones/` y **no** a `ui/` como anticipaba su fila: sabe de departamentos y de localidades de Uruguay, que es dominio; su fila de docs/10 se corrige con ese motivo. |
| `SavedToast` | app | **se muda** de `components/profile/` | Lo montan solo páginas, ahora de dos dominios (§Mis animales). |
| `AccountMenu` | app | cambia | Suma «Mis animales» (`auth.account_menu.my_pets`). |
| `ErrorTextsProvider` | app | cambia | Suma las claves de los `error.tsx` de esta historia (contracts §Rutas). |
| `EmptyState` `Skeleton` `Dialog` `Checkbox` `Input` `Textarea` `Select` `LinkButton` `Button` `ErrorScreen` `PageShell` `FieldShell` `ErrorText` | — | reusa | |

Hooks: `usePetDraft` (R10), `usePetPhotos` (preparar, la lista y su subida), `usePetSave` (subir lo
que falta, mandar, clasificar la falla, tope de 2 minutos; R11), `useUnsavedChanges` y
`useFieldFocus` (existen; `useUnsavedChanges` suma el guardia del volver, R17). Lógica pura en `lib/pets/`: `age.ts`,
`photo-list.ts`, `photo-sizing.ts` (R3), `publish-steps.ts` (R6), `duplicate-name.ts`, `draft.ts`,
`save-failure.ts`, `rules.ts`, y `lib/forms/back-guard.ts` (R17) (los números de la historia: 5 fotos, 30 y 2000 caracteres, rangos
de edad, tamaños, calidades, 1,5 MB, 24 horas, 2 minutos, 30 días, 1 hora de firma, los umbrales
del contador); el pegamento con el canvas en `photo-processing.ts`; `lib/contact/pet-contact.ts`
(R8); `lib/schemas/pet.ts` (un schema, dos usos); `lib/drafts/account-drafts.ts` (R10).

### Textos

Namespace nuevo `pets` en `messages/es.json` (`metadata`, `my_pets`, `form`, `fields`, `options`,
`photos`, `errors`, `dialogs`, `notices`). Las opciones van por clave de la base
(`pets.options.species.dog`). El sexo cambia el texto donde hace falta con ICU `select`
(«perra»/«perro», «castrada»/«castrado» en el alt y en el aviso de nombre repetido). Los textos de
`showcase` que ya existían quedan como están en `/muestra`: esta historia usa los suyos en `pets`.

## Qué se testea (y qué no)

Con la vara de docs/09: lo que, si se rompe, engaña a una persona, expone un dato o calcula mal.

**Unidad (Vitest + Stryker 100 %)**

- `lib/pets/age.ts`: `monthsBetween` (mismo día, 31 → 28/29 de febrero, fin de mes, cambio de
  año, antes del día), `ageOn` (2 meses → 3; 11 meses → 1 año; 23 meses → 1 año; años que avanzan),
  `resolveAgeOnSave` (lo mandado igual a lo mostrado → la base tal cual, aunque haya pasado un
  aniversario entre abrir y guardar y aunque la edad de hoy pase de 25, con `unchanged`; distinto →
  nuevo con hoy; una base con `asOf` posterior a hoy se descarta), `uruguayDay` (una hora UTC que en Montevideo es el día anterior).
- `lib/contact/pet-contact.ts`: cada forma de FR-014 que tiene que frenar (con espacios, puntos,
  guiones, « - », +598, sin el 0, fijo de 8, wa.me, t.me, bit.ly, tinyurl.com, linktr.ee,
  fb.com/x, rescate.org.uy, @usuario, correo) y cada una que tiene que pasar (fechas con los cuatro
  separadores, «Ruta 8 km 25», «castrada.Come», «buena.Como», «2023, 2024»), con el fragmento
  exacto citado; «2023 2024» y un número de chip de 15 dígitos se rechazan como teléfono, citados; y `hasStreetNumber` («Av. Italia 3456» no, «Villa 25 de Agosto» y «Km 16» sí). El
  `contactKind` del perfil no se mueve y conserva sus tests.
- `lib/pets/photo-sizing.ts`: `targetSize` con una apaisada, una vertical, una cuadrada y una más
  chica que el tope (no se agranda); `encodingPlan` elige la primera calidad que entra, baja cuando
  no entra, y rechaza cuando ni la última entra.
- `lib/pets/publish-steps.ts`: el intento publicado gana sobre sin nivel, sobre campos inválidos y
  sobre un nombre repetido (el reintento de una respuesta perdida con el mismo nombre termina en
  `already`, FR-017/FR-018); después nivel, campos, nombre; el animal del propio intento, si ya
  aparece entre los de la especie, no dispara el aviso; `confirmDuplicate` saltea solo el nombre.
- `lib/schemas/pet.ts`: obligatorios, largos (30 y 2000, sobrar no corta), rangos de edad por
  unidad, enteros, opciones fuera de la lista, contacto en los tres campos con su fragmento en
  `values`, número de puerta en la localidad, un error por campo; «26 años» pasa con
  `ageUnchanged` y se rechaza sin él (al publicar, o al editar cambiándola).
- `lib/pets/photo-list.ts`: `acceptPhotoFile` (los cuatro formatos, 10 MB justos pasan y un byte más no, HEIC y GIF «formato no aceptado»); agregar hasta 5 y cuántas quedaron afuera, sacar la portada, sacar la
  última, mover en los bordes, usar de portada sin cambiar el orden de las demás, rechazo de una sin
  tocar las otras, qué ids se mandan y cuáles faltan subir; `submitReadiness` (R19): una
  preparándose → `wait`; una que se rechaza mientras se esperaba → `blocked` y no se manda nada;
  sin fotos → `empty`; todas listas o subidas → `ready`.
- `lib/images/photo-file.ts`: los cuatro formatos, 10 MB justos y un byte más, HEIC; `rejectionFor`
  del perfil conserva sus tests.
- `lib/pets/char-count.ts`: letras, espacios, una bandera y una secuencia con ZWJ cuentan uno.
- `lib/pets/duplicate-name.ts`: mayúsculas, tildes, espacios, ñ ≠ n, misma especie.
- `lib/pets/draft.ts`: vuelve para la misma cuenta, se descarta para otra, vence a los 30 días,
  uno roto no rompe nada; `shouldTrackStart` no dispara «empezada» con lo escrito recuperado.
- `lib/pets/save-failure.ts`: rechazada sin conexión → `offline`; rechazada con conexión → `site`;
  `timedOut` → `site` aunque haya respuesta; cada clave de `ActionResult` → su clase.
- `lib/forms/back-guard.ts` (R17): reconoce el `popstate` de la centinela y el que no lo es; con
  cambios empuja, sin cambios retira solo si la centinela sigue arriba.

**Base (`tests/db/pets.test.ts`, contra Supabase local)** — el arnés de privacidad:

- Sin sesión y con la sesión de otra persona: no se lee ninguna fila de `pets` ni de `pet_photos`,
  y no se baja ningún objeto de `pet-photos`, aunque se sepa la dirección (FR-005, SC-005).
- Escrituras, desde `anon`, desde otra persona y desde la dueña: ninguna puede insertar, actualizar
  ni borrar filas de `pets` ni de `pet_photos`, ni ejecutar las funciones, ni subir, pisar o borrar
  objetos de `pet-photos` —tampoco en la carpeta propia (research R1)—, ni firmar la dirección de
  un objeto ajeno (FR-005).
- `publish_pet`: sin teléfono, con un cambio a medias y con un número perdido → `needs_verification`;
  con nivel 1 publica; el mismo intento dos veces, **en paralelo**, deja una sola publicación y la
  segunda llamada devuelve `already` (SC-004); 0 y 6 fotos, una foto de otra persona o ya enganchada
  → `photos_invalid`; una foto en espera más vieja que `p_staged_ttl` → `photos_invalid`.
- `save_pet`: la de otra persona → `not_found`; sin nivel 1 → `needs_verification` y el animal
  igual; una foto soltada en otra llamada → `changed_elsewhere`; reordenar, sacar y agregar en una
  sola llamada; `published_at` no cambia.
- `stage_pet_photo`: sin nivel 1 → rechazada y sin fila; con el id de una foto de otra persona →
  `photo_taken`; el mismo id dos veces → una fila.
- `has_level_one` con los estados del teléfono y el mismo borde que `phone-status.test.ts`: un
  número a medias de 7 días menos un segundo sigue bajando el nivel; de 7 días justos, ya no.
- Borrar la persona: `deletePetPhotosAsService` (la función real del borrado) deja el prefijo
  `{owner}/` vacío —incluido un objeto subido sin fila—, y después la cascada borra sus
  publicaciones y sus fotos, también las en espera (SC-007).
- La purga devuelve las en espera de más de 24 horas y las soltadas, y no toca las publicadas.

**E2E (`tests/e2e/publicar.spec.ts`, Playwright contra `next start`)** — el flujo crítico, uno:

Ana (nivel 1) elige 3 fotos de un fixture JPEG chico **con GPS, datos de cámara en el EXIF y un
nombre de archivo propio** (`tests/e2e/fixtures/`, armado una vez por un script de
`tests/e2e/support/` que le inserta el segmento EXIF), hace portada la segunda, deja la zona
propuesta y completa los obligatorios —antes de elegir las fotos, recarga y ve lo escrito de
vuelta (SC-006)—. Corta la conexión (`context.setOffline(true)`) y toca
«Publicar»: ve que no hay conexión y **todo sigue en pantalla**, fotos incluidas (FR-021: eso lo
prueba solo un navegador). Vuelve la conexión, hace doble clic en «Publicar», ve «Publicado» y el animal
primero en «Mis animales» con esa portada, y hay una sola publicación (SC-004). Después baja los
objetos guardados con la clave de servicio y comprueba que no tienen EXIF ni el nombre original
(SC-003).

**Medición (`tests/e2e/publicar-rendimiento.spec.ts`, solo Chromium, en `pnpm e2e` local y en
CI)** — SC-001 y SC-002 en lo que la corrida puede medir: con CDP, red de 1,6 Mbps de bajada,
750 kbps de subida y 150 ms (`Network.emulateNetworkConditions`) y CPU 4× más lenta
(`Emulation.setCPUThrottlingRate`). Una foto de 12 megapíxeles (4000 × 3000) se genera en la
página con un canvas —degradés y formas con un ruido leve, comprimible como una foto real y no
como ruido puro, que es el peor caso de WebP: su `full` tiene que quedar entre 300 y 500 KB, y el
test lo comprueba antes de medir— y se entrega al `input` por `DataTransfer`, sin un fixture de
megas en el repo; se mide desde el `change` hasta que la foto está lista (< 5 s, SC-002). Con 3
de esas fotos, se mide desde tocar «Publicar» hasta «Publicado» (< 30 s, SC-001 en la corrida).
Los umbrales son los de la spec, fijos, sin margen: 5 s y 30 s. Si CI no los sostiene, el test no
se afloja ni se saca de CI: es un hallazgo de rendimiento para el Review.

**Presupuesto de las rutas privadas.** `.lighthouserc.json` audita solo `/`, y agregarle rutas con
sesión es cambiar una compuerta (necesita `reglas-aprobadas`). En esta historia el JS de primera
carga de las tres rutas nuevas se lee de la tabla de `pnpm build` y se anota en el PR (< 150 KB);
sumar rutas privadas a Lighthouse cambia una compuerta y va en un issue `decision` de Ship. Además,
el LCP de `/mis-animales` con sesión y con la red y la CPU emuladas se mide con
`tests/e2e/support/web-vitals.ts` y se anota en el PR.

**No se testea**: las páginas, las primitivas de `ui/` (tampoco `RadioGroup`), las queries finas,
`PetCard` y los componentes que solo pintan, el pegamento con el canvas de `photo-processing.ts`
(sus decisiones están en `photo-sizing.ts`, y el e2e lo recorre en un navegador de verdad), la
clasificación en pantalla de cada error (la cubre `save-failure`).

## Docs que cambian en este PR

- `docs/03-mvp-features.md` §2: las decisiones del enjambre de la historia (ya hecho en la etapa de
  spec).
- `docs/07-stack.md`: la línea de `thumbhash` 0.1.1 con fecha; la decisión de fotos privadas en
  esta historia (R4) como **Decisión (2026-09-26, plan)**; `serverActions.bodySizeLimit` a 2 MB
  (R2); sacar `thumbhash` de «No entraron».
- `docs/10-design-system.md` §Componentes: `RadioGroup`, `UrgentIcon` (en la fila de `icons`),
  `PetPhoto`, `MyPetsGrid`, `PetForm`, `PetPhotosField`, `PetPhotoTile`, `PetFields`, `AgeField`,
  `CharacterCount`, `DraftRestoredNote`, `PublishProgress`, `DuplicateNameDialog`,
  `SaveBlockedDialog`, `PetNotFound`, `ZoneFields`; las filas que cambian: `LocalityField` (se queda
  en dominio, con el motivo), `SavedToast` (capa `app`), `ErrorTextsProvider` (ya no son seis
  claves), y `PetCard`, `ZoneLabel` y `UrgencyTag` si el build cambia algo. §Layout: la
  **Decisión (2026-09-26)** de publicar en una sola pantalla (research R15).
- `docs/06-i18n.md` §Glosario: **portada** («cover photo»: la primera foto de un animal).
- `docs/known-limitations.md`: la purga de 24 horas sin Cron (research R13), con detección y
  condición de reapertura.
- `docs/10-design-system.md` §Cómo se aplica: «las once primitivas» pasa a doce (con `RadioGroup`).
  `CLAUDE.md` dice lo mismo y no se toca sin `reglas-aprobadas`: va en el `aviso` de Ship.

## Project Structure

### Documentation (this feature)

```text
specs/007-publicar-animal/
├── story.md
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/actions.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/<timestamp>_pets.sql
src/
  actions/pets.ts · pet-photos.ts (uploadPetPhoto, aparte por tamaño: build)
  app/[locale]/(app)/mis-animales/
    page.tsx · loading.tsx · error.tsx
    publicar/page.tsx · loading.tsx · error.tsx
    [id]/editar/page.tsx · loading.tsx · not-found.tsx · error.tsx
  app/[locale]/_components/account-menu.tsx · error-texts-provider.tsx (cambian)
  app/[locale]/_components/saved-toast.tsx        (se muda de components/profile/)
  app/[locale]/_components/pet-form-texts.ts      (textos del formulario, del servidor)
  app/[locale]/muestra/                            (suma RadioGroup)
  components/pets/     pet-card · pet-photo · zone-label · urgency-tag · my-pets-grid · pet-form ·
                       pet-photos-field · pet-photo-tile · pet-fields · age-field ·
                       character-count · draft-restored-note · publish-progress ·
                       duplicate-name-dialog · save-blocked-dialog · pet-not-found ·
                       pet-form-dialogs · pet-save-footer · pet-form-skeleton (build: partir
                       PetForm, que pasaba de 150 líneas)
  components/forms/    leaving-dialog (build: el aviso de salir, extraído de ProfileForm por la
                       regla de dos)
  components/zones/    zone-fields · locality-field (se muda de profile/)
  components/profile/  profile-fields (usa ZoneFields) · sign-out-form · delete-account-dialog (cambian)
  components/verification/sign-in-other-account-form.tsx (cambia)
  components/ui/radio-group.tsx · icons.tsx (UrgentIcon)
  hooks/               use-pet-draft · use-pet-photos · use-pet-save · use-pet-submit (la espera
                       de las fotos que se preparan) · use-profile-draft (importa la clave de lib/drafts)
  lib/pets/            age · char-count · photo-list · photo-sizing · photo-processing ·
                       publish-steps · duplicate-name · draft · save-failure · rules (+ tests)
  lib/images/photo-file.ts (+ test; `rejectionFor` del perfil lo usa)
  lib/contact/pet-contact.ts (+ test)
  lib/drafts/account-drafts.ts
  lib/forms/back-guard.ts (+ test) · hooks/use-unsaved-changes.ts (suma el guardia del volver)
  lib/schemas/pet.ts (+ test)
  lib/analytics/events.ts · track.ts (cambian)
  lib/supabase/queries/pets.ts (lecturas; listMyPets firma las portadas) · pet-records.ts
                       (publish_pet y save_pet) · pet-photos.ts · pet-errors.ts
  actions/profile.ts (deleteAccount suma las fotos)
messages/es.json (namespace pets)
next.config.ts (bodySizeLimit)
tests/db/pets.test.ts
tests/e2e/publicar.spec.ts · publicar-rendimiento.spec.ts · support/exif-fixture.ts ·
  support/pet-owner.ts (build: el JPEG con GPS se arma en cada corrida en vez de versionar un
  binario, y la rescatista es nueva en cada corrida para no chocar con el aviso de nombre repetido)
docs/03 · docs/06 · docs/07 · docs/10 · docs/known-limitations.md
```

**Structure Decision**: la de F00, sin carpetas nuevas fuera de `components/pets/`,
`components/zones/`, `lib/pets/`, `lib/contact/` y `lib/drafts/`, que son dominios.

## Complexity Tracking

Sin violaciones.
