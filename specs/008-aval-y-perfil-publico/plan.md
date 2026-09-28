# Implementation Plan: Aval entre personas y perfil público con niveles de verificación

**Branch**: `feature/12-aval-y-perfil-publico` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/008-aval-y-perfil-publico/spec.md` (4 user stories, endurecida en dos rondas con
`spec-grader` y `spec-adversary`; lo que quedó abierto está en sus Assumptions). Revisado por
`plan-reviewer` en dos rondas y por `/speckit-analyze` en dos pasadas; lo que quedó se plegó.

## Summary

Es la historia que vuelve visible todo lo anterior: cada persona con el perfil completo tiene un
perfil público, abierto sin ingresar, con la chapita de su nivel; una persona con nivel 2 puede
avalar a otra con nivel 2, que pasa a nivel 3 con el nombre de quien la avala a la vista; y el
nombre y la localidad del perfil adoptan la regla de contacto de la ficha. No hay en `main` perfil
público, avales ni chapita.

Cinco decisiones ordenan el plan:

1. **Lo ajeno sale por una sola función de la base, que recorta** (research R2). Las tablas siguen
   cerradas a su dueña; `public_profile` devuelve exactamente lo de FR-005, con los meses ya
   truncados y los avales en pausa afuera. Su test mira las claves de la fila.
2. **El nivel es una sola escalera, en TypeScript** (R2). La base devuelve hechos (`level_one`, el
   mes de la identidad, los avales que cuentan) y `lib/verification/level.ts`, que ya tiene 0-2,
   suma el 3. «Cuenta» —las dos partes con nivel 2— vive una sola vez, en SQL.
3. **Un aval es una fila por par; la quita, otra** (R3). Vigente es «la fila existe»; cuenta se
   calcula al leer. Perder o recuperar el nivel no escribe nada.
4. **Dar, retirar y quitar son funciones con el candado del par ordenado** (R4): dos personas que
   se avalan a la vez no se suben entre ellas, y el doble toque no duplica.
5. **Una regla de contacto, un archivo** (R5): `lib/contact/contact-match.ts` para la ficha y el
   perfil, con un test de paridad campo por campo.

## Technical Context

**Language/Version**: TypeScript 7.0.2 (`strict`), React 19.3.0, Next.js 16.3.5 (App Router),
next-intl 4.14.5, zod 4.6.5, @supabase/ssr 0.12.7.

**Primary Dependencies**: las de `main`. **Ninguna dependencia nueva.**

**Storage**: Postgres de Supabase (local). Una migración: `profiles.public_id`, `vouches`,
`vouch_blocks`, nueve funciones (siete públicas, `private.has_level_two` y `private.lock_vouch`, los dos candados de un aval escritos una vez para dar, retirar y quitar), y los permisos por columna de `profiles`. Detalle en
[data-model.md](./data-model.md). Storage sin cambios: el bucket `avatars` sigue privado y la foto
del perfil público sale por su propia ruta (R7).

**Testing**: Vitest (unidad + base local), Playwright (un flujo crítico, el perfil sin JavaScript,
la igualdad de los tres «no existe» y el LCP del perfil con 50 avales), Stryker al 100 % sobre lo
que tenga test. `.lighthouserc.json` es un archivo protegido: no se toca (la medición de SC-006 va
por Playwright, como `publicar-rendimiento.spec.ts`).

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura fijada por F00.

**Performance Goals**: el presupuesto de siempre (LCP < 2,5 s, JS inicial < 150 KB, Lighthouse
mobile ≥ 90). El perfil público es un Server Component entero, sin límite de Suspense (R9): una
respuesta con todo el HTML; la chapita es SVG sin JS; su única hoja cliente es el lugar de avalar
**cuando hay algo que confirmar** (`VouchAction`), y sin sesión es un enlace. «Mis avales» es
servidor con una hoja cliente por fila de acción.

**Constraints**: nada se indexa (docs/08 §Encontrable); el perfil y `/niveles` llevan `noindex`.
Sin Cron ni correo nuevos.

**Scale/Scope**: 3 páginas y 1 Route Handler nuevos, 2 páginas que cambian, 1 migración, 8
funciones, 4 acciones, ~16 componentes nuevos, 2 tokens nuevos, 0 dependencias.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas, rutas ni componentes; el cómo está acá. |
| **II. Una feature, un PR** | Cuatro user stories que se construyen y verifican una por una, en un PR. |
| **III. Compuertas verdes y revisión fresca** | `pnpm verify` completo; qué se testea y por qué, en §Qué se testea. |
| **IV. Reglas como código** | Las reglas del aval son funciones de la base con candado y test; la visibilidad, RLS más la proyección de `public_profile`, con tests que intentan leer lo que no deben; el lugar de avalar, la escalera, el mes y año y la regla de contacto son funciones puras con test. |
| **V. Datos personales mínimos y privados** | El perfil público muestra solo FR-005, recortado en la base; correo, teléfono, documento, días exactos y avales en pausa no salen de ella. `vouches` y `vouch_blocks` no se leen desde el cliente. La quita guarda solo el par. Ni el enlace ni la foto exponen el id de la cuenta (R1, R7). Nadie elige ni cambia su `public_id`. Todo se borra en cascada con la cuenta. |
| **VI. Sin deriva** | Nada de la tabla «Fuera del MVP»: sin notificaciones, sin chat, sin calificaciones. Historial, animales del perfil, enlace desde la ficha, reportar y suspender quedan en #69, #57 y #13. |
| **VII. Liviana y linda, medido** | Server Components; la chapita en SVG y CSS; una hoja cliente por acción. Todo contra docs/10; dos tokens nuevos (los grises de metal que docs/10 dejó para esta historia), registrados en el doc y en `globals.css`. El perfil público se mide con Playwright (LCP bajo 2,5 s y JS de la página bajo 150 KB con 50 avales, `perfil-rendimiento.spec.ts`); Lighthouse CI mide solo la portada y sumar la URL toca `.lighthouserc.json`, protegido: va en el `aviso` para `reglas-aprobadas`. |
| **VIII. Autonomía con veto** | Se deciden y se avisan en Ship, en un issue `aviso`: el número de puerta en la localidad del perfil y la cita del fragmento (spec §Assumptions), los grises de metal como tokens (R11), la confirmación de avalar y retirar en `Sheet` y la de quitar en `Dialog` (§Diseño), el motivo `avalar` en la puerta del teléfono (R14) y el conteo de avales en «Mi perfil». Nada reservado: sin plata, nombre, indexación ni stack transversal. |

**Sin violaciones**: la tabla de Complexity Tracking queda vacía.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. Cargado
`frontend-design:frontend-design` antes de escribir esta sección.

**La idea que ordena las pantallas.** El perfil público es **el cartel de una persona**, y la
chapita es la estrella de todo el producto: docs/10 la llama «el único objeto de metal en un mundo
de papel». Es la pantalla donde aparece por primera vez, así que acá se juega. El perfil es corto a
propósito —nombre, zona, chapita, quién responde— y se lee de arriba abajo en el orden de la
pregunta del grupo de WhatsApp: ¿quién es? ¿de dónde? ¿es real? ¿quién la conoce? La lista de
quienes avalan es **texto**, nombres subrayados que llevan a otros carteles: la confianza se
recorre de persona en persona, no se decora.

Los `h1` van en `.afiche` y en oración con mayúscula inicial. Ningún texto supone el género de la
persona («Responden por esta persona», «esta persona»).

### Tokens

**Nuevos (dos):** `--color-metal` `#98A19C` (la argolla y el canto del aro) y
`--color-metal-light` `#D5DAD7` (la cara del aro), los grises de la maqueta de referencia que docs/10
dejó «provisorios hasta que la historia de `VerificationBadge` los defina como tokens». Van en
docs/10 §Color con su uso («solo en la chapita») y en `globals.css`; el test de paridad de tokens
los exige. No llevan texto encima, así que no tienen piso de contraste; el disco lleva el borde de
tinta de 2 px, que es el que separa la chapita del papel.

Color: `--color-primary` en el disco de nivel 2 y 3 y el contorno de nivel 1 (el verde es
confianza); `--color-canvas` en el tilde (6,3:1 sobre yerba) y en el disco de nivel 1;
`--color-ink` en texto, bordes, la tirita «Avalar» y el anillo grabado de nivel 3;
`--color-ink-muted` en zona, fechas y ayudas; `--color-surface` en la nota «todavía no se
verificó» y en los vacíos. Tipografía: `.afiche` `--text-2xl` en el nombre (`h1`) y en los títulos
de «Mis avales» y de la explicación; `--text-lg` bold en los títulos de sección; `--text-sm` en zona,
fechas y «desde…», con `tabular-nums` en los números. Espacio: `--space-4` entre la chapita y su
texto, `--space-8` entre secciones. Movimiento: el brillo de la chapita **solo en la `lg`**, una vez
al montar (`--dur-page`, `--ease-out`, apagado con `prefers-reduced-motion`): una banda recta de
`--color-canvas` al 50 % de opacidad, del ancho de un tercio del disco, recortada al disco por el
propio SVG, cruza en diagonal una sola vez —sin gradiente, es el reflejo plano de un metal—; vive en
la utilidad `.brillo` de `globals.css` y en docs/10 §Recursos del cartel, junto a los tokens de
metal. `--dur-fast` en hover y presión. Recursos: `.cinta` en la foto del perfil (pegada a mano, `--tilt`), como el cartel de «se
busca»; la perforación viene con `Button tirita`, no se agrega aparte. Nada más.

### La chapita · `VerificationBadge`

```
  nivel 1              nivel 2              nivel 3
     ◯                    ◯                    ◯          argolla: --color-metal, 3 px
  ╭─────╮              ╭─────╮              ╭─────╮
 │ ░░░░░ │            │ ▓▓▓▓▓ │            │ ▓╭─╮▓ │       aro: --color-metal-light, 3 px
 │ ░ 1 ░ │            │ ▓ ✓ ▓ │            │ ▓│✓│▓ │       borde exterior: --color-ink, 2 px
 │ ░░░░░ │            │ ▓▓▓▓▓ │            │ ▓╰─╯▓ │       nivel 3: anillo grabado en --color-ink
  ╰─────╯              ╰─────╯              ╰─────╯        adentro del aro («avalado»)
 papel, contorno       yerba + tilde        yerba + tilde + anillo
 yerba 2 px
```

- SVG inline; lo que se dibuja por nivel lo decide `badgeParts(level)` (R11), con test. `size`
  `md` (40 px de disco, «Mi perfil» y `/niveles`), `lg` (56, el perfil público y la
  verificación aprobada; la única que brilla). `cva` para `size`. Envuelta en el enlace a
  `/niveles?nivel=N&desde=<ruta>` con `prefetch={false}` en las tres pantallas —en `/niveles` misma va
  sin enlace (`href` nulo), para no enlazar la página a sí misma ni registrar otra vez la explicación—, con la etiqueta
  «Verificado, nivel N. Qué significa». El disco es lo único redondo de la pantalla.
- El número del nivel 1 se dibuja en `.afiche`; en 2 y 3 lo dicen el tilde y el texto al lado,
  nunca solo el color (docs/10 §Piso de accesibilidad).

### Perfil público · `/perfil/[id]`

Un solo orden de datos en todos los estados: foto, nombre, zona, rescatista, chapita con su texto
(o la nota sin nivel), «En el sitio desde…», quienes responden, el lugar de avalar.

```
390 px, nivel 3, quien mira con nivel 2         390 px, nivel 0, sin sesión
┌──────────────────────────────────────┐        ┌──────────────────────────────────────┐
│ [marca]                      Entrar  │        │ [marca]                      Entrar  │
│   ┌──────────┐                       │        │   ┌──────────┐                       │
│   │ ▚ foto  ▞│  (cinta, --tilt)      │        │   │   AR     │  (iniciales)          │
│   │   1:1    │                       │        │   └──────────┘                       │
│   └──────────┘                       │        │ Ana Rodríguez                   (h1) │
│ Ana Rodríguez                   (h1) │        │ Malvín, Montevideo                   │
│ Malvín, Montevideo                   │        │ ┌──────────────────────────────────┐ │
│ [Rescatista o refugio]               │        │ │ Todavía no se verificó.          │ │
│  ◯                                   │        │ │ Qué son los niveles              │ │
│ (chapita lg)  Nivel 3                │        │ └──────────────────────────────────┘ │
│               Identidad verificada   │        │   (--color-surface, sin borde)       │
│               en agosto de 2026      │        │ En el sitio desde septiembre de 2026 │
│ En el sitio desde septiembre de 2026 │        └──────────────────────────────────────┘
│                                      │
│ Responden por esta persona      (h2) │
│ Carlos Pérez                         │
│ Refugio Patitas                      │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │
│ [ Avalar                         ]   │
│   tirita                             │
│ Tu nombre va a aparecer acá como     │
│ quien responde por esta persona.     │
└──────────────────────────────────────┘

1280, dentro de la hoja «wall» (1200): desde 1024 se agrega una columna, no se rediseña
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ [marca]                                                                    Entrar    │
│──────────────────────────────────────────────────────────────────────────────────────│
│  ┌──────────┐                                 │   ◯                                  │
│  │ ▚ foto  ▞│                                 │  (chapita lg)  Nivel 3               │
│  └──────────┘                                 │                Identidad verificada  │
│  Ana Rodríguez                           (h1) │                en agosto de 2026     │
│  Malvín, Montevideo                           │                                      │
│  [Rescatista o refugio]                       │  Responden por esta persona    (h2)  │
│  En el sitio desde septiembre de 2026         │  Carlos Pérez                        │
│                                               │  Refugio Patitas                     │
│                                               │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│                                               │  [ Avalar                        ]   │
│        columna 1: quién es                    │   columna 2: qué tan verificada está │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- **Desde 1024**, dos columnas dentro de `PageShell width="full"`, **siempre**: a la izquierda quién
  es (foto, nombre, zona, rescatista, «En el sitio desde…»), a la derecha qué tan verificada está
  (`ProfileLevel`: la chapita con su texto o la nota sin nivel) y, si los hay, quienes responden y el
  lugar de avalar. La columna de la derecha nunca queda vacía porque siempre tiene el nivel, así el
  perfil más común de la beta (nivel 0-1, visto sin sesión) usa la hoja sin inventar contenido.
  Debajo de 1024, una columna en el orden de arriba. Es la regla de docs/10 §Pantallas anchas (se
  agregan columnas) y la de docs/11 §Identidad y pantallas: una columna de 640 sobre una hoja de
  1200 deja medio papel vacío. «En el sitio desde…» lo dibuja `PublicProfileHeader`.
- **El único elemento que llama la atención**: la chapita `lg`. La foto va pegada con cinta, pero
  chica (1:1 a 160 px): la foto manda en el animal, no en la persona.
- **El lugar de avalar** (`VouchSlot`, R6): `can_vouch` es la tirita «Avalar» con su frase debajo, la
  **única** tirita de la pantalla y solo cuando avalar es el próximo paso real; `sign_in` es
  «Avalar» en `secondary`, un `LinkButton` a ingresar (casi todas las visitas sin sesión son de
  quien adopta: una tirita a lo ancho le competiría a la chapita e invitaría a avalar a
  desconocidos); `vouching` es «Avalás a esta persona.» y «Retirar mi aval» en `ghost`, sin fecha
  (FR-005), y `vouching_paused` suma la nota de pausa (`VouchPausedNote`); `reciprocal`, `blocked`,
  `cannot_receive` son una frase en `--color-ink-muted`, sin botón; `needs_level_two` es la frase y
  un `LinkButton secondary` al paso que falta (`nextStepToLevelTwo`), o solo la frase si el pedido
  está en revisión. La dueña no ve nada.
- **Confirmar avalar y retirar**: un `Sheet` (docs/10: acciones secundarias y formularios cortos;
  `Dialog` queda para lo irreversible). `VouchSheet` es uno solo para los dos verbos: título en
  afiche («Avalar a Ana Rodríguez», «Retirar mi aval»), el párrafo de la spec, el verbo en `primary`
  con carga y «Cancelar» en `secondary`. El error va adentro con `ErrorText` (sin conexión, sin
  respuesta, R16). Con un motivo de FR-013 el `Sheet` se cierra y la página se vuelve a dibujar con el
  lugar de avalar de hoy, anunciado con `role="status"`. Con éxito, `?aval=dado|retirado` y
  `VouchNotice` monta el aviso. `VouchAction` (perfil) y la fila de «Mis avales» usan el mismo
  `VouchSheet` para retirar (regla de dos).

```
390 px, VouchSheet (avalar), sube desde abajo       RemoveVouchDialog, al centro, con cinta
┌──────────────────────────────────────┐            ┌──────────────────────────────────────┐
│ (velo --color-ink 40 %)              │            │ (velo)                               │
│┌────────────────────────────────────┐│            │   ┌──────────────────────────────┐   │
││ Avalar a Ana Rodríguez  (afiche)  ✕││            │   │ Quitar el aval de   (afiche) │   │
││ Tu nombre va a aparecer en su      ││            │   │ Carlos Pérez                 │   │
││ perfil, a la vista de cualquiera,  ││            │   │ Su nombre deja de aparecer en│   │
││ como quien responde por esta       ││            │   │ tu perfil y no va a poder    │   │
││ persona. Avalá solo a quien        ││            │   │ volver a avalarte. Si era tu │   │
││ conocés.                           ││            │   │ único aval que contaba, bajás│   │
││                                    ││            │   │ a nivel 2.                   │   │
││ [ Avalar          ] primary        ││            │   │ [ Quitar el aval ] danger    │   │
││ [ Cancelar        ] secondary      ││            │   │ [ Cancelar       ] secondary │   │
││ (ErrorText si no llegó)            ││            │   │ (ErrorText si no llegó)      │   │
│└────────────────────────────────────┘│            │   └──────────────────────────────┘   │
└──────────────────────────────────────┘            └──────────────────────────────────────┘
```

  Retirar usa el mismo `VouchSheet` con «Retirar mi aval» de título y de botón, y la frase de si
  baja de nivel. Desde 768 el `Sheet` entra de costado, como dice su fila de docs/10.
- **El aviso y la vista**: `?aval=` se suma a las marcas que `SavedToast` saca de la dirección
  después de mostrarlas (hoy `guardado` y `error`), así el enlace que la persona copie de la barra no
  lleva el aviso; y `VouchNotice` se dibuja solo con sesión. Con un motivo de FR-013 la hoja cliente
  también vuelve con una marca, `?aval=cambio`, que no tiene aviso (el motivo ya está en el lugar de
  avalar). La página no registra `public_profile_viewed` cuando la dirección trae `aval`: es la misma
  persona viendo el resultado de su acción, no alguien abriendo el perfil (FR-028); lo decide
  `shouldTrackView` en `lib/analytics/view-origin.ts`, con test.
- **Componentes**: `PageShell` (`reading` debajo de 1024; `full` con la grilla de dos columnas
  arriba), `PublicProfileLayout` (nuevo: la grilla de una o dos columnas), `PublicProfileHeader`
  (nuevo: foto con cinta desde `/perfil/<id>/foto` o `Avatar lg` con iniciales, nombre `h1`,
  `ZoneLabel`, la etiqueta «Rescatista o refugio» como en `ProfileSummary`), `ProfileLevel` (nuevo),
  `ProfileVouchers` (nuevo; enlaces con `prefetch={false}` por R10), `VouchSlot` (nuevo, servidor),
  `VouchAction` y `VouchSheet` (nuevos, hojas cliente), `VouchPausedNote` (nuevo), `VouchNotice`
  (nuevo, capa app), `ZoneLabel` y `Avatar` (existentes).
- **Estados**: *cargando* sin `loading.tsx` (R9: el perfil se lee sin scripts; la espera es la de la
  navegación); mientras una acción corre, su botón en `loading` y el `Sheet` sin cerrarse; *vacío*
  los de la spec (sin nivel: la nota; sin avales: no hay sección); *error* `(public)/error.tsx`
  nuevo con `ErrorScreen`, «No pudimos traer esta página» e «Intentar de nuevo», sin decir si el
  perfil existe. Sus textos llegan por `PublicErrorCopyProvider`, un contexto con tres cadenas, y no
  por `ErrorTextsProvider`: ese baja el runtime de next-intl al navegador y el perfil con 50 avales
  pasaba el presupuesto de 150 KB de JS (medido en la construcción).

### Este perfil no existe · `not-found.tsx` de `/perfil/[id]`

`ProfileNotFound` sobre `HeadedEmptyState`: `h1` «Este perfil no existe», «Puede que el enlace esté
mal copiado.» y la tirita «Ir al inicio» del ancho de su texto desde 768, como `PetNotFound`. Igual
para los tres casos (R9). Sin datos: no tiene cargando ni error propios. Next 16 dibuja el
`not-found` de una página sin límite de Suspense en el navegador, desde el payload (el HTML es la
cáscara de error con estado 404): los tres casos siguen siendo la misma respuesta, y el e2e compara
el HTML y las filas del payload.

### Los niveles · `/niveles`

```
390 px, ?nivel=2                                 1280, desde 1024: los tres lado a lado
┌──────────────────────────────────────┐        ┌──────────────────────────────────────────────┐
│ Qué dice cada nivel             (h1) │        │ Qué dice cada nivel                     (h1) │
│ Ningún nivel dice cómo va a cuidar   │        │ Ningún nivel dice cómo va a cuidar a un      │
│ a un animal: dice quién es.          │        │ animal: dice quién es.                       │
│                                      │        │ ┌──────────┐ ┏━━━━━━━━━━━━┓ ┌──────────┐     │
│  ◯ (md) Nivel 1                (h2)  │        │ │◯ Nivel 1 │ ┃◯ Nivel 2    ┃ │◯ Nivel 3 │     │
│  Pide: un teléfono uruguayo…         │        │ │ Pide: …  │ ┃ Pide: …     ┃ │ Pide: …  │     │
│  Dice: …                             │        │ │ Dice: …  │ ┃ Dice: …     ┃ │ Dice: …  │     │
│ ┌──────────────────────────────────┐ │        │ └──────────┘ ┗━━━━━━━━━━━━┛ └──────────┘     │
│ │ ◯ (md) Nivel 2             (h2)  │ │        │ Volver                                (ghost) │
│ │ Pide: la cédula, revisada a mano │ │        └──────────────────────────────────────────────┘
│ │ Dice: es una persona real con    │ │
│ │ cédula uruguaya vigente, no que  │ │        El nivel pedido va en una `Card` (borde de
│ │ su nombre sea el de la cédula.   │ │        tinta); los otros dos, sin caja. Se destaca
│ └──────────────────────────────────┘ │        por estar enmarcado, no por color.
│  ◯ (md) Nivel 3                (h2)  │
│  …                                   │
│ Volver                        (ghost)│
└──────────────────────────────────────┘
```

Componentes: `LevelsExplanation` (nuevo), `LevelCard` (nuevo: un nivel, enmarcado o no),
`VerificationBadge` `md` (sin brillo y sin enlace), `Card`, `LinkButton ghost` para volver (a `desde`, o al inicio).
Sin tirita: no hay próximo paso. Ningún elemento llama la atención más que el enmarcado. Texto
fijo: vacío y cargando no aplican; el error es `(public)/error.tsx`.

### Mis avales · `/mis-avales`

```
390 px, con avales                              390 px, sin nivel 2 y sin avales
┌──────────────────────────────────────┐        ┌──────────────────────────────────────┐
│             Mis animales  Mi perfil  │        │             Mis animales  Mi perfil  │
│ Mis avales                      (h1) │        │ Mis avales                      (h1) │
│                                      │        │ Quién me avala                  (h2) │
│ Quién me avala                  (h2) │        │ Nadie te avala todavía. Un aval es   │
│ ┌────┐ Carlos Pérez                  │        │ otra persona verificada que responde │
│ │ CP │ desde el 3 de septiembre      │        │ por vos con su nombre. Para recibir  │
│ └────┘ Quitar                  ghost │        │ uno, antes verificá tu identidad.    │
│ ─────────────────────────────────── │        │ [ Verificar mi identidad ] secondary │
│ ┌────┐ Refugio Patitas               │        │                                      │
│ │ RP │ desde el 1 de septiembre      │        │ A quién avalé                   (h2) │
│ └────┘ Por ahora no cuenta: le falta │        │ No avalaste a nadie todavía. Para    │
│        el nivel 2.                   │        │ avalar hace falta tener nivel 2.     │
│        Quitar                  ghost │        └──────────────────────────────────────┘
│                                      │
│ A quién avalé                   (h2) │        (1280 abajo)
│ No avalaste a nadie todavía…         │        (Quién me avala | A quién avalé), cada una en
└──────────────────────────────────────┘        su columna; debajo de 1024, una sobre otra.
```

```
1280, desde 1024: las dos listas lado a lado dentro de la hoja «working» (1024)
┌────────────────────────────────────────────────────────────────────────┐
│                                              Mis animales  Mi perfil   │
│────────────────────────────────────────────────────────────────────────│
│ Mis avales                                                        (h1) │
│ Quién me avala                (h2)  │ A quién avalé               (h2) │
│ ┌────┐ Carlos Pérez                 │ ┌────┐ Beto Silva                │
│ │ CP │ desde el 3 de septiembre     │ │ BS │ desde el 2 de septiembre  │
│ └────┘ Quitar el aval       (ghost) │ └────┘ Retirar mi aval   (ghost) │
│ ──────────────────────────────────  │                                  │
│ ┌────┐ Refugio Patitas              │                                  │
│ │ RP │ … Por ahora no cuenta …      │                                  │
└────────────────────────────────────────────────────────────────────────┘
```

- Dos listas de texto con divisores de `--color-line`, como `ReviewQueueList`: es una lista de
  gente, no un muro de tarjetas. Cada fila (`MyVouchRow`): `Avatar md` con la foto de
  `/perfil/<id>/foto` o las iniciales, el nombre como enlace al perfil (`prefetch={false}`),
  «desde el …» en `--text-sm` `--color-ink-muted`, `VouchPausedNote` si `pauseMark` dice algo, y la
  acción en `ghost`: «Retirar mi aval» (abre `VouchSheet`) o «Quitar el aval» (abre `RemoveVouchDialog` sobre
  `DestructiveConfirmDialog`, porque no se deshace). **El disparador de «Quitar» va en `ghost`**, no
  en `ghost-danger`: con varias filas el ceibo aparecería varias veces, y docs/10 §Color lo deja una
  vez por pantalla; el ceibo queda adentro del diálogo, en «Quitar el aval» `danger`.
  `DestructiveConfirmDialog` suma la prop `triggerVariant` (`ghost-danger` por defecto), y su fila de
  docs/10 lo dice.
- Sin tirita y **ningún elemento que llame la atención**: es una pantalla de gestión.
- El vacío con nivel 2 de «Quién me avala» suma `CopyProfileLink` en `secondary`; sin nivel 2, el
  paso de `nextStepToLevelTwo` en `secondary` y nada para pedir un aval. Sin nivel 2 y con las dos
  listas vacías, el botón del paso va **una sola vez**, en el primer vacío, y el de «A quién avalé»
  dice que para avalar hace falta el mismo paso, sin repetir el botón (docs/10 §Principios 6: una
  acción aparece una sola vez), como dice la spec en §Pantallas.
- **Orden**: «Quién me avala» primero y «A quién avalé» después: lo primero es lo que se ve en el
  perfil público de la persona, que es lo que viene a controlar.
- **La frase de si baja de nivel** en retirar y quitar es condicional y fija («si era su único
  aval que contaba, baja a nivel 2»; «si era tu único aval que contaba, bajás a nivel 2»): calcularla pediría el número de
  avales que cuentan de la otra persona, que es un dato suyo.
- **Componentes**: `MyVouchesList`, `MyVouchRow`, `MyVouchesEmpty` (recibe la dirección y el paso
  que falta, o nada), `RemoveVouchDialog`, `VouchSheet`, `VouchPausedNote`, `CopyProfileLink`,
  `Avatar`, `LinkButton`, `VouchNotice`.
- **Estados**: *cargando* `loading.tsx` con dos títulos y tres filas en `Skeleton` (el avatar es
  cuadrado); *vacío* el de cada lista; *error* `error.tsx` con `ErrorScreen` «No pudimos traer tus
  avales» y reintentar; una fila que retira o quita queda ocupada.

### Mi perfil · `/mi-perfil` (cambia)

- **La chapita `md` va al lado del nombre**, en `ProfileSummary` —que la recibe como un hueco
  (`badge`, un `ReactNode`) que llena `VerificationSections`, así `components/profile` no importa de
  `components/verification`—, enlazada a `/niveles` con `desde=/mi-perfil`: es la marca de la persona, como en su perfil público, y el único elemento que
  llama la atención de la pantalla. Las cards de «Tu teléfono» y «Tu identidad» no cambian de forma:
  siguen diciendo el estado con su sello y el nivel con su fecha exacta en texto («Nivel 1 desde…»,
  «Estás en nivel 2», y ahora «Estás en nivel 3»); así la chapita no repite un sello en la misma
  card. Sin nivel, no hay chapita y el paso pendiente sigue como hoy.
- Debajo de las dos cards, la sección nueva **«Tu perfil público»** (`PublicProfileLinks`): «Ver mi
  perfil público» en `secondary`, `CopyProfileLink` en `secondary`, y «Mis avales» en `ghost` con el
  número de los que cuentan («Te avalan 2 personas»; «Ningún aval cuenta por ahora» si los hay en
  pausa; «Nadie te avala todavía»). La tirita sigue siendo «Editar mi
  perfil».
- **La página no crece**: el armado de la chapita, las dos cards y la sección nueva se extrae a
  `(app)/mi-perfil/_components/verification-sections.tsx` (`VerificationSections`), que recibe el
  estado y arma sus textos, como hoy `IdentitySection`. Le pasa a `statusCardTexts` `level >= 2` (hoy
  la página pasa `level === 2`, que en nivel 3 haría que la sección del teléfono vuelva a decir el
  nivel). El `loading.tsx` de «Mi perfil» suma la forma de la sección nueva.

```
390 px, «Mi perfil» nivel 2 (lo nuevo marcado con *)
┌──────────────────────────────────────┐
│             Mis animales  Mi perfil  │
│ ┌────┐ Ana Rodríguez  ◯* (chapita md)│
│ │ AR │ Malvín, Montevideo            │
│ └────┘ [Rescatista o refugio]        │
│ Tu correo …                          │
│ Tu teléfono  [Verificado] …          │
│ Tu identidad [Verificada] Estás en   │
│   nivel 2 desde el 14 de agosto…     │
│ * Tu perfil público             (h2) │
│ * [ Ver mi perfil público ] second.  │
│ * [ Copiar el enlace       ] second. │
│ * Mis avales: te avalan 2 personas   │
│                              (ghost) │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │
│ [ Editar mi perfil               ]   │
│ Cerrar sesión                (ghost) │
│ Borrar mi cuenta             (ghost) │
└──────────────────────────────────────┘
```
- **Al completar y al editar**: el aviso de FR-021 es una ayuda de cada campo en `ProfileFields`,
  con una prop nueva, `publicHint`, en el nombre y en la localidad (pasa a `ZoneFields` como
  `localityHint`), atada con `aria-describedby`, antes de escribir. `nameHint` ya existe y dice «Lo
  trajimos de tu cuenta de Google» en el alta: las dos ayudas se dibujan, la de Google primero (habla
  del valor que ya está) y la de lo público después, y los dos ids van en `aria-describedby` en ese
  orden. El texto: «Lo ve cualquiera. Sin teléfono ni redes: el
  contacto se da cuando se acepta una solicitud.» `PersonalDataNotice` no cambia. Los errores de
  contacto citan el fragmento.

### Verificación aprobada · `/verificar-identidad` (cambia)

`IdentityStatusView` aprobado: la chapita `lg` (la que brilla) junto a «Estás en nivel 2» / «Estás
en nivel 3», y el sello «Verificada» baja de `lg` a `md`: dos marcas grandes competirían, y la
chapita es la que dice el logro. Con la identidad aprobada y sin nivel 1, sin chapita y el texto de
hoy. La fila de `IdentityStatusView` en docs/10 cambia con esta decisión. Esto cierra KL-11-5.

### Componentes

| Componente | Capa | Variantes / estados | Notas |
|---|---|---|---|
| `VerificationBadge` | verification | `level` 1/2/3; `size` md/lg; con y sin enlace; brilla solo `lg` | La chapita, envuelta en su enlace (fila existente de docs/10, se completa). |
| `ProfileLevel` | verification | con nivel · sin nivel | Chapita + «Nivel N» + «Identidad verificada en…», o la nota sobre `--color-surface` con el enlace a `/niveles`. |
| `LevelsExplanation` · `LevelCard` | verification | destacado · no | `/niveles`. |
| `PublicProfileLayout` | profile | una columna · dos columnas | La grilla del perfil desde 1024. |
| `PublicProfileHeader` | profile | con foto · sin foto; rescatista | Foto con cinta o iniciales, nombre, zona. |
| `ProfileNotFound` | profile | — | Sobre `HeadedEmptyState`. |
| `CopyProfileLink` | profile | quieto · copiado («Enlace copiado», 4 s, anunciado) · plan B (el enlace en un `Input` de solo lectura, seleccionado) | Hoja cliente (R13). |
| `PublicProfileLinks` | profile | con avales · sin avales | La sección de «Mi perfil». |
| `ProfileVouchers` | vouches | — (no se dibuja sin avales) | «Responden por esta persona». |
| `VouchSlot` | vouches | los estados de `vouchSlot` | Servidor: traduce la función a la pantalla. |
| `VouchAction` | vouches | quieto · confirmando · haciendo · error | Hoja cliente del perfil: el botón y `VouchSheet`. |
| `VouchSheet` | vouches | avalar · retirar; confirmando · haciendo · error (sin conexión, sin respuesta) | El `Sheet` de los dos verbos. |
| `RemoveVouchDialog` | vouches | confirmando · quitando · error | Sobre `DestructiveConfirmDialog`, disparador `ghost`. |
| `VouchPausedNote` | vouches | mía · suya · las dos | «Por ahora no cuenta: …». |
| `MyVouchesList` · `MyVouchRow` · `MyVouchesEmpty` | vouches | con filas · vacío con y sin paso; fila quieta · ocupada | «Mis avales». |
| `VouchNotice` | app | dado · retirado · quitado · ausente | Lee `?aval=` y monta `ScreenToast`. |
| `VerificationSections` | app | — | Extraída de «Mi perfil». |
| `ScreenToast` | app | — | Se muda a `app/[locale]/_components/`. |
| `DestructiveConfirmDialog` | ui | suma `triggerVariant` | `ghost-danger` por defecto. |
| `ProfileSummary` · `ProfileFields` · `ZoneFields` · `IdentityStatusView` · `IdentityStatusCard` | varias | cambian | Chapita, ayudas de campo, sello `md`, nivel 3. |

Cada nuevo entra en la tabla de docs/10 en este PR con estas variantes.

### Textos

Namespaces por dominio, como pide docs/06: `profile.public` (el perfil público, no existe, «Tu
perfil público»), `verification.levels` (la chapita y `/niveles`) y `vouches` (nuevo dominio, que se
suma a la lista de docs/06). Claves snake_case. Nuevas en `profile.errors` (`contact_phone|email|
web|social`, `locality_street_number`) y `profile.form` (`name_hint`, `locality_hint`); se borran
`profile.errors.name_has_*` y `locality_has_*`. `locality_street_number` del perfil recibe `{label}`
(«Barrio» o «Localidad», la etiqueta del campo en ese departamento) y dice «Acá va tu {label}, no una
dirección»; la de la ficha no cambia. También: `metadata.public_profile` (título con `{name}` y el de
no existe), `metadata.levels`, `metadata.my_vouches`; `verification.gate.vouch_*` (el encabezado
«Para avalar, verificá tu teléfono» y su bajada); `vouches.notice.*` (los cuatro avisos);
`vouches.errors.*` (los motivos de FR-013, `offline`, `no_response`, `session`). Las hojas cliente reciben sus textos por props (el
único provider cliente es el de errores). Voseo, sin género para la otra persona, con el verbo del
botón en el aviso.

## Qué se testea (y qué no)

Lo que engaña, expone o calcula mal (docs/09 §Qué vale la pena testear):

- **`tests/db/vouches.test.ts`**, **`vouches-give.test.ts`** y **`vouches-remove.test.ts`** (arnés de privacidad, contra Supabase local; en tres archivos por tamaño: lo que no se ve, dar y retirar, quitar y el nivel):
  - `anon` y `authenticated` no pueden ejecutar ninguna de las nueve funciones, probadas por su nombre, ni leer `vouches` ni
    `vouch_blocks` (tampoco siendo parte del aval), ni el perfil, la identidad ni el teléfono de otra
    persona, ni insertar en `vouches`.
  - `public_profile`: las claves de la fila son exactamente las de data-model (ni `id`, ni
    `created_at`, ni `verified_on`, ni `avatar_path`); `member_since` e `identity_since` son primeros
    de mes en hora de Uruguay (una cuenta creada el 31 de agosto a las 23:30 de Uruguay es de agosto,
    aunque en UTC sea septiembre); sin nivel 1 no hay `identity_since` aunque haya identidad; un
    aval en pausa por quien lo dio, y otro por quien lo recibió, no salen, y vuelven al recuperar el
    nivel sin escribir nada; cero filas para id inventado, cuenta borrada y perfil sin completar.
  - `give_vouch`: cada `outcome` de la tabla; con dos motivos a la vez gana el primero de FR-011
    (A avaló a B, B quitó ese aval y después avaló a A: A intenta avalar a B y recibe `reciprocal`,
    no `blocked`); idempotente (`created` false la segunda
    vez); `reached_level_three` solo en el paso de 2 a 3, y **una sola vez** con dos personas que
    avalan a la misma en paralelo; **cruce simultáneo**: A→B y B→A en paralelo dejan exactamente un
    aval (SC-004).
  - `vouch_standing`: cada bandera en las dos direcciones, y `target_vouches_viewer` verdadero con
    un aval en pausa.
  - `remove_vouch` inserta la quita aunque el aval ya no esté; después `give_vouch` da `blocked`.
    `withdraw_vouch` de algo que no está da `absent`.
  - La quita es de una sola dirección: B quitó el aval de A, y B puede avalar a A (`given`).
  - Retirar y volver a avalar: `given` con `created = true` y un día nuevo.
  - Retirar y quitar un aval en pausa (por cualquiera de las dos partes) dan `withdrawn` y
    `removed`.
  - `avatar_path_for`: la ruta solo para un perfil completo con foto; nada para un id inventado.
  - `my_vouches`: solo las filas de la persona, con las banderas de pausa correctas por cada lado.
  - **SC-005**: una tabla de casos (niveles 0 a 3, pausa por cada lado, retirado, quitado, cuenta
    borrada) exige `publicLevel(public_profile(x))` igual a `verificationLevel(phone, identity,
    countingReceived(my_vouches(x)))`.
  - Borrar la cuenta borra lo dado, lo recibido y las quitas en las dos direcciones, y quien
    dependía de ese aval baja a nivel 2.
- **`tests/db/profiles.test.ts`**: `insert` y `update` con un `public_id` elegido fallan; el mismo
  `upsert` que hace `upsertProfile`, en el alta y en la edición, anda.
- **Funciones puras** (Vitest, Stryker al 100 %):
  - `lib/vouches/vouch-slot.test.ts`: cada estado de FR-011 y cada par que compite (quien ya avala a
    alguien que perdió el nivel 2 ve `vouching_paused`, no `cannot_receive`; quien no tiene nivel 2 y
    es avalado por la mirada ve `reciprocal`, no `needs_level_two`).
  - `lib/vouches/next-step.test.ts`: perfil sin completar, sin teléfono sin identidad, sin teléfono
    con identidad (`restoresLevelTwo`), nivel 1 sin pedido, nivel 1 con pedido en revisión.
  - `lib/vouches/my-vouches.test.ts`: `pauseMark` (ninguna, mía, suya, las dos) y
    `countingReceived` (cuenta solo recibidos sin pausa).
  - `lib/profile/public-paths.test.ts`: `isPublicId` acepta ids con `-` y `_` y rechaza 21 y 23 caracteres
    y cualquier otro símbolo; `levelsPath` pasa `desde` por `safeDestination`.
  - `lib/vouches/vouch-failure.test.ts`: cada salida de `classifyVouchOutcome`.
  - `lib/verification/level.test.ts`: avales sin identidad dan 1, sin nivel 1 dan 0 aunque haya
    identidad y avales, identidad sin avales da 2, con avales da 3; `publicLevel` sobre los mismos
    casos.
  - `lib/verification/badge-parts.test.ts`: por nivel, relleno, tilde, anillo y etiqueta.
  - `lib/verification/gate.test.ts`: el motivo `vouch` ida y vuelta por la URL.
  - `lib/contact/contact-match.test.ts` (el de hoy, movido) y **paridad** en
    `lib/schemas/profile.test.ts`: la tabla de casos de contacto de la ficha, **limitada a los que
    entran en el largo del campo del perfil** (2 a 60 caracteres en el nombre, 1 a 60 en la
    localidad; los de descripción más largos quedan afuera, porque ahí el perfil corta antes por
    largo), da el mismo tipo y el mismo fragmento en el nombre y la localidad del perfil que en la
    ficha (SC-003); los cuatro ejemplos de la historia se rechazan con su tipo
    y su fragmento; «Villa 25 de Agosto» y «Ruta 8 km 25» pasan; en la localidad, «fijo 2401 2345»
    da contacto y no número de puerta.
  - `lib/profile/month-year.test.ts`: `2026-08-01` da «agosto de 2026» sin correrse de mes, en
    cualquier zona horaria del proceso.
  - `lib/analytics/link-preview.test.ts` (cada agente de la lista, y un navegador que no es) y
    `lib/analytics/view-origin.test.ts` (el origen se compara entero: `https://sitio.com.evil` y
    un `Referer` vacío dan `link`; `shouldTrackView` no registra a la dueña, a una vista previa ni
    una dirección con `aval`).
- **`tests/e2e/aval.spec.ts`** (flujo crítico): Dani abre el perfil de Beto y avala; en otro contexto
  sin sesión el perfil de Beto muestra nivel 3 y el nombre de Dani; Dani retira y Beto vuelve a nivel
  2. El perfil de Carla abierto con `javaScriptEnabled: false` muestra nombre, zona, chapita, «En el
  sitio desde…» y quien la avala (FR-010). El `<head>` del perfil de Carla lleva `robots` `noindex,
  nofollow`, un título con su nombre y el del sitio, y ninguna imagen propia de la persona (ni su foto ni una hecha para el perfil) ni texto con su zona o su
  nivel (FR-009); `robots` va fijo en la página y no depende de ningún interruptor de indexación del
  sitio. Los tres «no existe» y un id mal formado (que no pasa `isPublicId`) dan el mismo estado (404) y el mismo HTML una vez quitados los nonces, los ids de build y el propio id pedido (SC-002).
- **`tests/e2e/perfil-rendimiento.spec.ts`**: el LCP del perfil de Eva (50 avales) a 390 px con
  `support/web-vitals.ts`, bajo 2,5 s, y el JavaScript que baja la página bajo 150 KB medido con Resource Timing (SC-006, presupuesto de VII), como `publicar-rendimiento.spec.ts`.

**No se testea**: las páginas, `ui/`, los componentes que solo pintan (su lógica está en las
funciones puras de arriba), las queries finas, el Route Handler de la foto (lo cubre el test de
`avatar_path_for` en la base) y `CopyProfileLink` (una llamada del navegador con su plan B a la vista).

## Docs que cambian en este PR

- `docs/03` §1 y §3: las decisiones de la historia (ya copiadas en la etapa de spec).
- `docs/10`: los dos tokens de metal (§Color), la fila de `VerificationBadge` completa, las filas
  nuevas de §Componentes, `triggerVariant` en `DestructiveConfirmDialog`, `ScreenToast` en la capa
  app compartida, `PublicErrorCopyProvider` en `(public)` (no `ErrorTextsProvider`: bajaba el
  runtime de next-intl y el perfil con 50 avales pasaba los 150 KB de JS), el sello `md` de la verificación
  aprobada, y las decisiones de `Sheet` para avalar y retirar y de las dos columnas del perfil desde
  1024.
- `docs/06` §Glosario: «nivel 1» (el teléfono; la chapita ya existe), «nivel 3», «aval en pausa»,
  «retirar un aval», «quitar un aval», «perfil público»; y `vouches` en la lista de namespaces.
- `docs/known-limitations.md`: se borran KL-11-5 y KL-53-5, que esta historia cierra.
- `messages/es.json`, `supabase/seed.sql`. **No** `.lighthouserc.json` (protegido).

## Project Structure

### Documentation (this feature)

```text
specs/008-aval-y-perfil-publico/
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
supabase/migrations/<timestamp>_vouches.sql
supabase/seed.sql                                  (R17: public_id fijos, Carla, Beto, Dani, Eva y 50)
src/
  actions/vouches.ts                               (giveVouch, withdrawVouch, removeVouch)
  actions/profile.ts                               (saveProfile con FieldError; trackProfileMoment)
  app/[locale]/(public)/layout.tsx                 (cambia: monta ErrorTextsProvider)
  app/[locale]/(public)/error.tsx                  (nuevo: ErrorScreen de la zona pública)
  app/[locale]/(public)/perfil/[id]/
    page.tsx · not-found.tsx                       (sin loading.tsx: R9)
    foto/route.ts                                  (R7)
  app/[locale]/(public)/niveles/page.tsx
  app/[locale]/(app)/mis-avales/
    page.tsx · loading.tsx · error.tsx
  app/[locale]/(app)/mi-perfil/page.tsx · loading.tsx (cambian)
  app/[locale]/(app)/mi-perfil/_components/verification-sections.tsx (nuevo) · identity-section.tsx
  app/[locale]/(app)/verificar-identidad/page.tsx  (cambia: chapita y nivel 3)
  app/[locale]/_components/error-texts-provider.tsx (cambia: los límites nuevos)
  app/[locale]/_components/screen-toast.tsx        (se muda desde (app)/_components/)
  app/[locale]/_components/vouch-notice.tsx        (nuevo)
  components/verification/  verification-badge · profile-level · levels-explanation · level-card
                            (nuevos); identity-status-card · identity-status-view (cambian)
  components/profile/       public-profile-layout · public-profile-header · profile-not-found ·
                            copy-profile-link · public-profile-links (nuevos);
                            profile-summary · profile-fields · profile-form (cambian)
  components/zones/zone-fields.tsx                 (cambia: localityHint)
  components/vouches/       profile-vouchers · vouch-slot · vouch-action · vouch-sheet ·
                            vouch-paused-note · remove-vouch-dialog · my-vouches-list ·
                            my-vouch-row · my-vouches-empty
  components/ui/destructive-confirm-dialog.tsx     (cambia: triggerVariant)
  lib/vouches/              vouch-slot · next-step · my-vouches · paths · vouch-failure (+ tests) · types
  lib/verification/level.ts · badge-parts.ts · gate.ts (+ tests)
  lib/contact/contact-match.ts (+ test; reemplaza pet-contact.ts)
  lib/schemas/profile.ts (+ test, cambia) · pet.ts (importa contact-match)
  lib/profile/month-year.ts (+ test)
  lib/analytics/events.ts (cambia) · link-preview.ts · view-origin.ts (+ tests)
  lib/supabase/queries/vouches.ts (nuevo) · profiles.ts · avatars.ts (cambian)
  lib/supabase/types.ts                            (pnpm db:types)
  styles/globals.css                               (--color-metal, --color-metal-light, el brillo)
messages/es.json
tests/db/vouches.test.ts · tests/db/profiles.test.ts (public_id no se elige ni se cambia)
tests/e2e/aval.spec.ts · perfil-rendimiento.spec.ts
docs/03 · docs/06 · docs/10 · docs/known-limitations.md
```

**Structure Decision**: la de F00, con un dominio nuevo, `vouches`, en `components/` y `lib/`.

## Complexity Tracking

Vacía: no hay violaciones de la constitución que justificar.

## Assumptions del plan

- **Navegar dentro del sitio a un perfil no muestra un cargando** (R9, R10): sin `loading.tsx` y con
  `prefetch={false}`, al tocar el nombre de quien avala, «Ver mi perfil público» o una fila de «Mis
  avales» la pantalla anterior queda quieta hasta que llega el perfil. Es una consulta y una
  respuesta; se acepta y va en el `aviso`. Si en la recorrida se nota, la salida es una hoja cliente
  con `useLinkStatus` en esos enlaces, no volver al streaming.

- **Sin cargando dibujado en el perfil público** (R9): con streaming, FR-010 (leer sin scripts) no
  se cumple; la spec ya lo dice así en §Pantallas (ajustada en el análisis). La espera es la de la
  navegación, corta porque la página es una consulta. Se registra en el `aviso`.
- **La foto con cinco minutos de caché** (R7): cambiar o quitar la foto puede tardar hasta cinco
  minutos en verse en un perfil ya abierto por otra persona.

## Para Ship

- **`aviso`** (un issue) con las decisiones que `docs/` no cubría: el número de puerta en la
  localidad del perfil y la cita del fragmento; los tokens de metal; `Sheet` para avalar y retirar;
  el motivo `avalar` en la puerta del teléfono; «te avalan N personas» en «Mi perfil»; el id público
  de 22 caracteres (enlaces largos para WhatsApp, a cambio de no poder recorrerse); el perfil sin
  cargando dibujado; «Quién me avala» antes que «A quién avalé»; la foto por su propia ruta con
  cinco minutos de caché, y sin la foto en la página cuando la pide una vista previa; la quita que se guarda
  aunque el aval ya no estuviera; y sumar `/perfil/<id>` a Lighthouse CI, que necesita
  `reglas-aprobadas`.
- **Fuera de alcance** (spec §Assumptions): lo que pasa con los avales de una cuenta suspendida
  (#13); el enlace desde la ficha (#57); el historial (#69).
