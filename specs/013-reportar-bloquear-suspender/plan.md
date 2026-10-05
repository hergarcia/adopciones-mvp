# Implementation Plan: Reportar, bloquear y suspender

**Branch**: `feature/13-reportar-bloquear-y-suspender` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/013-reportar-bloquear-suspender/spec.md` (4 user stories). Decisiones técnicas en
[research.md](./research.md) (R1–R12); tablas y funciones en [data-model.md](./data-model.md); rutas,
acciones, correos y eventos en [contracts/routes.md](./contracts/routes.md).

## Summary

Hoy el distintivo no tiene consecuencias: nadie puede avisar de una persona que no debería estar,
ni cortar el vínculo con ella, ni sacarla. Al terminar, quien ingresó reporta y bloquea desde el
perfil público; quien administra ve los reportes con el historial, los cierra sin medidas o
suspendiendo, y reactiva; una cuenta suspendida no hace nada en el sitio y, para todos los demás,
se ve como una que no existe; y su número no vuelve verificado en otra cuenta, ni 12 meses después
de borrarla.

Cinco decisiones ordenan el plan:

1. **«Suspendida = no existe» vive en cinco funciones de la base que ya son el punto único de cada
   lectura** (R2): `has_level_two`, `pet_is_listed`, `public_profile`, `my_vouches`, `pet_by_code`.
   El listado, la portada, la vista previa, las fotos, los avales y los niveles cambian juntos, en el
   instante, y vuelven solos al reactivar.
2. **La puerta de la suspendida está en cada página y en `getSessionUser`** (R4), cerrada ante la
   duda: cada página corta antes de pintar, también al navegar, y cada Server Action y Route Handler
   con sesión redirige a la pantalla de cuenta suspendida, que vuelve a preguntar.
3. **Reportes y suspensiones siguen el patrón de la revisión de #59** (R5, R6): tablas cerradas,
   funciones que vuelven a preguntar `is_admin()` con candado de fila, y `is_admin()` que ya no
   responde para una suspendida.
4. **El bloqueo depende de quién mira y se filtra en la base con `auth.uid()`** (R7): la cantidad y
   las páginas del listado salen exactas.
5. **El número retenido es un hash con fecha, guardado por un trigger antes del borrado** (R8):
   nada que lo una a la cuenta y nadie lo lee.

## Technical Context

**Language/Version**: TypeScript 7 (`strict`), React 19, Next.js 16 (App Router).

**Primary Dependencies**: las de `main`. **Ninguna nueva**. `pgcrypto` (`extensions.digest`) ya
está en Supabase; `pg_cron` ya está en uso (#11, #59).

**Storage**: Postgres y Storage de Supabase (local). Una migración (data-model.md).

**Testing**: Vitest (unidad y base local), Playwright (un flujo crítico), Stryker al 100 % sobre lo
que tenga test.

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: el presupuesto de docs/07 en el listado, la portada, la ficha y el perfil, que no ganan
JS de entrada: los botones de reportar y bloquear son cáscara + parte viva (`useAfterOpen`, docs/08)
y la hoja del reporte llega al tocarlos. La puerta de sesión suma una consulta por pedido solo con
sesión, cacheada por pedido.

**Constraints**: sin Vercel (todo local); nada se indexa (todas las pantallas nuevas `noindex`);
los correos sin `RESEND_API_KEY` van a `.artifacts/mail/`.

**Scale/Scope**: 5 páginas nuevas, 4 que cambian, 1 migración, 1 archivo de acciones nuevo y 2 que
cambian, ~20 componentes nuevos en `components/moderation/` y 1 en `verification/`.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas ni rutas; el cómo está acá. |
| **II. Una feature, un PR** | Cuatro user stories en un PR, en orden: P1 reportar y cerrar, P2 suspender y reactivar, P3 bloquear, P4 número retenido. |
| **III. Compuertas verdes** | `pnpm verify` completo; qué se testea y por qué, en §Qué se testea. |
| **IV. Reglas como código** | Duplicados, quién cierra, una suspensión vigente, el filtro de suspendidas y bloqueos, el corrimiento del vencimiento y el número retenido son funciones de la base con tests; los schemas, la decisión de qué pantalla ve quien mira y la de la puerta (`standingGate`) son funciones puras con test; quién lee la sesión sin puerta es un test que recorre el código. |
| **V. Datos personales** | Cada regla de visibilidad vive en la base y tiene su test que intenta leer lo que no debe (FR-042): reportes para la reportada, para quien no administra y sin sesión; reportes sobre sí para quien administra; bloqueos para la bloqueada; suspensiones; números retenidos para todos, incluida quien administra. El número retenido es un hash. Borrar cascada a bloqueos, reportes sobre la cuenta y suspensiones; deja los reportes hechos sin autor. Ningún evento lleva ids. |
| **VI. Sin deriva** | Nada de «Fuera del MVP»: sin chat, sin push, sin pagos. Lo de «No incluye» queda afuera (spec §Assumptions). Ocultar en la portada, en la revisión y congelar el vencimiento son la regla de la historia aplicada a cada pantalla, no alcance nuevo; quedan registradas en docs/03 y se avisan. |
| **VII. Liviana y linda** | Server Components; hojas cliente chicas (las hojas y diálogos). Todo contra docs/10, sin tokens nuevos ni variantes nuevas de primitivas. |
| **VIII. Autonomía con veto** | Se decide y se avisa en Ship, en un `aviso`: la retención de reportes y suspensiones hasta el borrado, el número retenido como hash, la puerta en `getSessionUser`, congelar el vencimiento, la portada filtrada, reportar a una suspendida desde el perfil bloqueado, las limitaciones aceptadas. Nada reservado. |

**Sin violaciones**: Complexity Tracking vacío. La puerta de la suspendida no es un cambio
transversal de stack (CLAUDE.md regla 7): no cambia la librería ni el proveedor de autenticación ni
cómo se guarda la sesión; agrega una pregunta a la base dentro de la puerta que ya existe
(`getSessionUser`) y una llamada al principio de cada página, igual que `requireProfile` hoy. Se
registra en docs/07 y va en el `aviso`. Ninguna de las lecturas de VI (portada, revisión, reloj,
reportar desde el perfil bloqueado) se cuenta como la incorporación del milestone: son la regla de
la historia aplicada; si Hernán las lee como alcance nuevo, el `aviso` lo pone a la vista.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. El skill
`frontend-design:frontend-design` no está instalado en la sesión que escribió el plan (research
§Skills): la etapa Build lo carga antes del primer JSX.

**La idea.** En el poste, lo que no corresponde se arranca o se tapa; nadie pega un cartel que
diga «a este lo echamos». Esta historia es eso: lo que se saca **desaparece del poste** sin dejar
rastro —el perfil y los animales de una suspendida se ven como si nunca hubieran estado— y las
herramientas para sacarlo son **de trabajo, no de vidriera**: en el perfil público van debajo de
todo, chicas, en `ghost`, porque el perfil existe para mostrar a la persona y no para acusarla. La
mesa de quien administra es la misma de la revisión de identidad y de publicaciones: una columna,
un reporte por vez, divisores de línea. Nada nuevo en el sistema.

**Lo único que llama la atención**, por pantalla: en el perfil público, nada nuevo (el distintivo
sigue siendo lo único); en la hoja del reporte, el botón «Enviar reporte»; en la confirmación,
«Bloquear a <nombre>» en `secondary`; en la lista de reportes, el motivo de cada uno; en la pantalla
de cuenta suspendida, el motivo.

### Tokens

Color: `--color-ink` (texto y botones), `--color-ink-muted` (fechas, historial, la nota de anónimo),
`--color-line` (divisores de las listas y del historial), `--color-surface` (el fondo del bloque del
historial y de la nota de anónimo), `--color-accent` solo en los errores y en el botón que confirma
una suspensión (`danger`, dentro de `SuspendSheet`, una vez por pantalla); en el perfil y en cada
reporte, «Suspender» va en `ghost` (abre la hoja, no suspende), así una lista de reportes no repite
el acento, `Stamp` `muted` «Suspendida» dentro de las listas de
quien administra. Ningún verde: nada de esto es confianza. Tipografía:
`.afiche` en los `h1`; `--text-base` en el motivo y el texto; `--text-sm` en fechas, historial y
notas. Espacio: `--space-2` dentro de un ítem, `--space-4` entre bloques de una hoja, `--space-8`
entre ítems de las listas. Movimiento: el de `Sheet`, `Dialog` y `Toast`. **Ningún token nuevo, ni
variante nueva.**

### Perfil público · `/perfil/{id}` (cambia)

```
390 px
┌──────────────────────────────────────┐
│ [foto] Ana                     (h1)  │
│ ...lo de #12: zona, alta, nivel,     │
│    quiénes avalan, Avalar...         │
│ ──────────────────────────────────── │  (--color-line)
│ Reportar   Bloquear       (ghost sm) │  ← ProfileSafetyActions, al pie
│ Suspender                 (ghost sm) │  ← solo quien administra
└──────────────────────────────────────┘
```

- `ProfileSafetyActions` (moderation): fila de `Button` `ghost` `sm` al pie del
  `PublicProfileLayout` (un hueco nuevo, `safety`), separada por un `--color-line`. «Suspender»
  también en `ghost`: abre `SuspendSheet`, que es donde está el `danger`. Sin sesión:
  `LinkButton` `ghost` a `/entrar?next=/perfil/{id}?reportar=1` (y `…?bloquear=1`). En el perfil
  propio no se dibuja. Cáscara + parte viva: los botones están en el HTML, la hoja se carga al
  tocar.
- La página elige la rama con `profileView` (abajo) y compone una de tres cosas: `ProfileScreen`
  (el perfil de #12 con `ProfileSafetyActions`), `BlockedScreen` (el perfil bloqueado) o
  `notFound()`; las dos primeras viven en `perfil/[id]/_components/` y la página queda en pocas
  líneas de JSX. La ficha hace lo mismo con la rama `blocked` de `petPageState`.
- Para la bloqueada que mira el perfil de quien la bloqueó, `VouchSlot` recibe `ninguno` (no dibuja
  nada), un estado que ya existe.
- Cargando y error: los de #12 (sin `loading.tsx`, el 404 de siempre).

### Reportar · hoja sobre el perfil (nueva)

```
390 px
┌──────────────────────────────────────┐
│ Reportar a Ana                 (h2)  │
│ ¿Qué pasó?                           │
│ ( ) Estafa                           │  ← RadioGroup, una columna
│ ( ) Maltrato animal                  │
│ ( ) Vende animales                   │
│ ( ) Se hace pasar por otra persona   │
│ ( ) Acoso                            │
│ ( ) Otro                             │
│ Contanos qué pasó (opcional)         │  ← «obligatorio» con Otro
│ ┌──────────────────────────────────┐ │
│ │ Textarea                         │ │
│ └──────────────────────────────────┘ │
│                         Quedan 1000  │  ← CharacterCount
│ ┌ Es anónimo: Ana no se entera de ─┐ │  ← --color-surface, --text-sm
│ │ que la reportaste ni de quién fue│ │
│ └──────────────────────────────────┘ │
│ [ Enviar reporte ]  Cancelar         │  (primary · ghost)
└──────────────────────────────────────┘
```

- `ReportSheet` (moderation, hoja cliente): `Sheet` + `RadioGroup` + `Textarea` + `CharacterCount`
  (forms, R11) + `AnonymityNote`. Valida con `reportSchema` antes de enviar; el error de «Otro» sin
  texto queda debajo del campo (`ErrorText`). Ocupado: `Button` `loading`. Falla: `SaveFailedStrip`
  con «Reintentar», sin perder lo elegido. `duplicate`: el mensaje debajo del motivo, sin cerrar.
  `not_found`: cierra y refresca (el perfil pasa a «no existe»).
- `ReportSent` (moderation): dentro de la misma hoja, centrado (es una confirmación):
  un `h2` «Recibimos tu reporte» y `EmptyState` con el cuerpo (anónimo, lo vamos a mirar, no te vamos a
  contar el resultado), `Button` `secondary` «Bloquear a Ana» (si no estaba bloqueada) y `ghost`
  «Volver al perfil».

### Bloquear · diálogo (nuevo) y Perfil bloqueado (nuevo)

- `BlockDialog` (moderation, hoja cliente): `DestructiveConfirmDialog` (confirmando · haciendo ·
  error) con el título «Bloquear a Ana», el cuerpo de §Pantallas y «Bloquear» / «Cancelar». Al salir
  bien, la acción redirige a `/perfil/{id}?bloqueo=hecho`. Bloquear se deshace, pero borra avales
  que no vuelven (FR-016): eso es lo irreversible que justifica la confirmación destructiva.

```
390 px
┌──────────────────────────────────────┐
│ Bloqueaste a Ana               (h1)  │  ← BlockedProfile, alineado a la izquierda
│ No ves su perfil ni sus animales.    │
│ Ella no lo sabe.          (--text-sm)│
│ [ Desbloquear ]           (secondary)│
│ Reportar                      (ghost)│
│ Suspender            (ghost, admin)  │
└──────────────────────────────────────┘
```

- `BlockedProfile` (moderation): solo el nombre, el texto y las acciones; sin foto ni nivel.
  `UnblockButton` (moderation, hoja cliente: quieto · haciendo · error) refresca y muestra el perfil
  con un `ScreenToast` «Desbloqueaste a Ana». Vacío: no aplica.
  Build (T061): en la ficha y el perfil públicos va como `LazyUnblockButton` (`lazy` de React), y
  `lazy-notices` deja `next/dynamic` por `lazy`: el cargador de `next/dynamic` sumaba 1,6 KB y pasaba
  la ficha de los 150 KB (docs/07).

### Animal de alguien que bloqueaste · `/animales/{code}` (cambia)

```
390 px
┌──────────────────────────────────────┐
│ Lo publicó alguien que         (h1)  │  ← PetUnavailable blocked, centrado como las demás
│ bloqueaste                           │
│ Si la desbloqueás, vas a ver este    │
│ animal.                  (--text-sm) │
│ [ Desbloquear ]           (secondary)│  ← UnblockButton en el hueco de la acción
│ Ver los animales en adopción  (ghost)│
└──────────────────────────────────────┘
```

`PetUnavailable` suma la variante `blocked`, sin foto, nombre ni zona. Al desbloquear, la página se
refresca y muestra la ficha. Cargando y error: los de la ficha.

### Animales en adopción y portada (sin cambio de UI)

La base devuelve la lista sin los animales de suspendidas ni de bloqueadas por quien mira; la
cantidad (`ListingCount`) y `RecentPets` ya pintan lo que llega. Vacío, cargando y error: los de #57
y la portada.

### Mis bloqueos · `/mis-bloqueos` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ ← Mi perfil                  (ghost) │
│ Mis bloqueos                   (h1)  │
│ ──────────────────────────────────── │
│ [av] Ana                             │
│      desde el 3 de octubre  [Desbloquear] (secondary sm)
│ ──────────────────────────────────── │
│ [av] Beto                            │
│      desde el 1 de octubre  [Desbloquear]
└──────────────────────────────────────┘
```

- `MyBlocksList` / `MyBlockRow` (moderation): `Avatar` `md`, nombre, «desde el {día}» en
  `--text-sm` `ink-muted`, `UnblockButton` `secondary` `sm`; divisores `--color-line`, como
  `MyVouchesList`. Al desbloquear, la fila sale y `Toast` «Desbloqueaste a Ana».
- Vacío: `MyBlocksEmpty` con `EmptyState` «No bloqueaste a nadie» y qué hace un bloqueo. Cargando:
  `loading.tsx` con tres filas de `Skeleton`. Error: `error.tsx` con «Reintentar».
- Acceso: `PublicProfileLinks` de «Mi perfil» suma `TextLink` «Mis bloqueos» debajo de «Mis avales».

### Reportes · `/revision/reportes` (nueva)

```
390 px                                         1280 px: la misma columna, en --measure
┌──────────────────────────────────────┐
│ Reportes                       (h1)  │
│ 3 sin resolver           (--text-sm) │
│ Hay 1 reporte sobre vos: lo resuelve │  ← OwnReportsLine, solo si hay
│ otra persona que administre.         │
│ ──────────────────────────────────── │
│ Vende animales            (afiche lg)│  ← el motivo es lo que llama la atención
│ Sobre Ana                            │
│ Hace 2 días               (--text-sm)│
│ «Me ofreció un cachorro a 3000...»   │  (--text-base)
│ Lo reportó Marta (o una cuenta borrada)
│ ┌ Antes ─────────────────────────────┐│  ← ReportHistory, --color-surface
│ │ Acoso                              ││
│ │ Cerrado sin medidas el 12 de agosto││
│ │ Suspendida del 2 al 10 de setiembre││
│ │ «Estafa con donaciones»            ││
│ └────────────────────────────────────┘│
│ [ Cerrar sin medidas ]  Suspender     │  (secondary · ghost)
│ ──────────────────────────────────── │
│ ...                                   │
└──────────────────────────────────────┘
```

- La lista es `WorkQueue` (forms), que es `PetReviewQueue` extraída en su segundo uso (la misma
  columna con divisores `--color-line`), y el aviso de lo cerrado, `AnnounceNotices` (forms), que era
  `PetReviewNotices`. Build: el plan pedía un `ReportQueue` idéntico; dos copias violan la regla de
  dos (docs/08).
  `ReportItem` (moderation) recibe el reporte y los textos; el nombre de la persona reportada es un
  `TextLink` a su perfil (sin enlace si está suspendida, con `Stamp` `muted` `md`
  «Suspendida»: informa un estado, no pide una tarea). Quien reportó lleva la misma marca si su cuenta está suspendida
  (`reporter_suspended`, Edge Cases). `ReportHistory` (moderation): `Disclosure` abierto si hay antecedentes, «Sin
  antecedentes» si no.
- `ReportDecision` (moderation, hoja cliente): «Cerrar sin medidas» abre `CloseReportDialog`
  (abajo); «Suspender» abre `SuspendSheet`. Qué acciones y qué línea lleva cada reporte (propio,
  cuenta ya suspendida, cerrado por otra persona, cuenta que ya no existe) lo decide la función
  pura `reportActions` (`lib/moderation/report-actions.ts`), con test; el componente solo pinta. `closed`: el ítem se reemplaza por «Ya lo cerró {nombre}: {cómo}», sin acciones;
  `gone`: «Esa cuenta ya no existe». Al salir bien, el ítem sale con `Toast`.
- Vacío: `EmptyState` «No hay reportes sin resolver». Cargando: `loading.tsx` con dos ítems de
  `Skeleton`. Error: `error.tsx` con «Reintentar».

### Suspender · hoja (nueva)

```
390 px
┌──────────────────────────────────────┐
│ Suspender a Ana                (h2)  │
│ • No va a poder usar el sitio.       │  (--text-sm)
│ • Su perfil, sus avales y sus        │
│   animales dejan de verse.           │
│ • Recibe un correo con este motivo.  │
│ Motivo                               │
│ ┌──────────────────────────────────┐ │
│ │ Textarea                         │ │
│ └──────────────────────────────────┘ │
│                         Quedan 1000  │
│ Ana va a leer este motivo tal cual.  │  (--text-sm, ink-muted)
│ No nombres a quien la reportó.       │
│ [ Suspender ]  Cancelar              │  (danger · ghost) ← el acento de la pantalla
└──────────────────────────────────────┘
```

- `SuspendSheet` (moderation, hoja cliente): `Sheet` con «Suspender a Ana», qué va a pasar (lista de
  tres renglones en `--text-sm`), `Textarea` «Motivo» con `CharacterCount`, la nota «Ana va a leer
  este motivo tal cual. No nombres a quien la reportó.» en `--text-sm` `ink-muted`, y `Button`
  `danger` «Suspender» + `ghost` «Cancelar». Sin motivo: `ErrorText` debajo del campo. `already`:
  «Ya la suspendió {nombre} el {día}». Ocupado y error como `ReportSheet`.

### Cerrar sin medidas (diálogo) y reactivar (hoja), nuevos

```
┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│ ¿Cerrar sin medidas?           (h2)  │   │ ¿Reactivar a Ana?              (h2)  │
│ El reporte sale de la lista y queda  │   │ Va a poder volver a usar el sitio y  │
│ en el historial de Ana.              │   │ le avisamos por correo.              │
│ [ Cerrar sin medidas ]  Cancelar     │   │ [ Reactivar ]  Cancelar              │
└──────────────────────────────────────┘   └──────────────────────────────────────┘
          (secondary · ghost)                        (secondary · ghost)
```

`CloseReportDialog` (moderation, cliente): `Dialog`, porque cerrar un reporte no se deshace (docs/10
reserva `Dialog` para lo irreversible). `ReactivateSheet` (moderation, cliente): `Sheet`, porque
reactivar se deshace suspendiendo de nuevo, como confirma lo reversible `VouchSheet` (#12). Los dos:
quieto · haciendo · error, con el error adentro (`ErrorText`) y «Reintentar» en el mismo botón.

### Cuentas suspendidas · `/revision/suspendidas` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ Cuentas suspendidas            (h1)  │
│ ──────────────────────────────────── │
│ Ana                       (afiche lg)│
│ «Ofrecía cachorros a la venta»       │
│ La suspendió Lucía el 3 de octubre   │  (--text-sm, ink-muted)
│ [ Reactivar ]             (secondary)│
│ ──────────────────────────────────── │
└──────────────────────────────────────┘
```

- La lista es `WorkQueue` (forms) con un `SuspendedAccountRow` (moderation) por cuenta y
  `ReactivateSheet` (arriba); el aviso, `AnnounceNotices`. Build: el plan pedía un
  `SuspendedAccountsList`, que habría sido la tercera copia de `WorkQueue`. Al salir bien, la fila
  sale y `Toast` «Ana puede volver a usar el sitio».
- Vacío: `EmptyState` «No hay cuentas suspendidas». Cargando: `loading.tsx`. Error: `error.tsx`.
- Acceso: `IdentitySection` de «Mi perfil» suma dos `ReviewQueueLink`: «Revisar reportes (N)» o
  «Revisar reportes: nada esperando», y «Cuentas suspendidas».

### Cuenta suspendida · `/cuenta-suspendida` (nueva)

```
390 px  (PaperFrame handbill, sin AccountMenu)
┌──────────────────────────────────────┐
│ [logo]                               │
│ Tu cuenta está suspendida      (h1)  │
│ Desde el 3 de octubre.   (--text-sm) │
│ El motivo:                           │
│ «Ofrecías cachorros a la venta»      │  ← lo que llama la atención, --text-base
│ Si creés que es un error, escribinos │
│ a ayuda@…                (TextLink)  │
│ Borrar mi cuenta     (ghost-danger)  │  ← DeleteAccountDialog de siempre
│ Salir                        (ghost) │  ← SignOutForm
└──────────────────────────────────────┘
```

- `SuspendedScreen` (moderation): recibe la suspensión y los textos; reutiliza `DeleteAccountDialog`
  y `SignOutForm` (profile) en huecos que llena la página. Grupo `(suspended)` con un layout propio:
  `PaperFrame` gana `menu?: boolean` (por defecto `true`). Vacío: no aplica. Cargando:
  `cuenta-suspendida/loading.tsx` con `Skeleton` del título y tres renglones. Error: `error.tsx`
  con «Reintentar» (también cuando no se pudo saber la situación de la cuenta, R4).

### Ese número no se puede usar · `/verificar-telefono/no-se-puede-usar` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ Ese número no se puede usar    (h1)  │  ← VerifyHeading
│ No podemos verificar este número en  │
│ el sitio.                            │
│ Si creés que es un error, escribinos │  ← SupportSentence
│ a ayuda@…                            │
│ ┄┄ Verificar otro número ┄┄          │  ← tirita, la acción de la pantalla
└──────────────────────────────────────┘
```

`NumberWithheldScreen` (verification): con y sin `para`, como `NumberInUseWays`. Vacío, cargando y
error: no aplica (no carga datos; el `loading.tsx` de `/verificar-telefono` cubre la navegación).

### Copy y antipatrones

Revisado contra docs/10 §Textos y §Antipatrones: voseo («Reportaste», «Bloqueaste», «Escribinos»),
oración con mayúscula inicial, el botón dice lo que pasa y el toast lo repite («Bloquear» →
«Bloqueaste a Ana»), sin exclamaciones, sin `·` entre metadatos (las fechas van en su propio
renglón), sin flechas, sin mayúsculas sostenidas, sin verde en ninguna acción. «Enviar reporte» es
`primary` y no `tirita`: la `tirita` es la acción de una pantalla, y el reporte vive en una hoja
sobre el perfil, cuya acción sigue siendo la de #12.

### Correos

La plantilla de siempre (`renderNoticeEmail`), sin extras. El motivo va como párrafo escapado.

### Textos (`messages/es.json`)

- `moderation.report`: título, los seis motivos (`reasons.scam` … `reasons.other`), el campo, la
  nota de anónimo, enviar, la confirmación, «Bloquear a {name}», errores.
- `moderation.block`: el diálogo, el perfil bloqueado, el animal bloqueado, desbloquear, toasts.
- `moderation.my_blocks`: título, fila, vacío, errores.
- `moderation.reports`: la lista, el historial, las resoluciones, el contador de propios, los
  estados `closed`/`gone`, toasts, errores, el acceso de «Mi perfil».
- `moderation.suspend`: la hoja, la nota, errores, toasts.
- `moderation.suspended_list`: la lista, reactivar, vacío.
- `moderation.suspended_screen`: la pantalla de la persona suspendida.
- `moderation.errors`: `duplicate`, `self`, `not_found`, `details_required`, `reason_required`,
  `closed`, `own`, `gone`, `not_admin`, `already`, `failed`.
- `verification.withheld`: la pantalla del número.
- `vouches.errors.unavailable`.
- `emails.account_suspended`, `emails.account_reactivated`.
- `metadata.my_blocks`, `metadata.reports`, `metadata.suspended_list`, `metadata.suspended_screen`,
  `metadata.number_withheld`.

## Qué se testea (y qué no)

Contra docs/09 §Qué vale la pena testear. Cada archivo con test queda al 100 % de mutación.

**Funciones puras (Vitest, al lado del archivo)**

- `lib/schemas/report.ts` — los seis motivos y uno inválido; «otro» sin texto, con espacios solo,
  con 1000 y con 1001 caracteres; un motivo que no es «otro» acepta texto vacío y lo guarda como
  nulo; `publicId` mal formado.
- `lib/schemas/suspension.ts` — motivo vacío, solo espacios, 1000, 1001; `reportId` opcional y
  uuid.
- `lib/moderation/profile-view.ts` — qué ve quien mira un perfil (`profile` · `blocked` ·
  `not_found`) con cada combinación de: es la dueña, bloqueó, la bloquearon, está suspendida, existe.
  Es la decisión que FR-017 y FR-017a ponen en juego (un error le muestra la suspensión a alguien).
- `lib/moderation/safety-actions.ts` — qué botones lleva el perfil (ninguno en el propio; reportar y
  bloquear con o sin sesión; suspender solo para quien administra; en el perfil bloqueado,
  desbloquear, reportar y suspender para quien administra).
- `lib/moderation/report-age.ts` — «hace N horas/días» y las horas redondeadas de `report_closed`
  (bordes: 59 min, 1 h, 23 h, 24 h, mismo minuto = 0).
- `lib/analytics/moderation-events.ts` — cada evento con sus props exactas (también un
  `report_closed` con `resolution: suspended` por cada reporte que cierra una suspensión, FR-012), y que ninguno lleva
  claves de identidad (`id`, `publicId`, `userId`, `name`, `email`) aunque la entrada las traiga:
  es lo que FR-050 promete.
- `lib/moderation/report-actions.ts` — qué acciones y qué línea lleva un reporte: propio (solo la
  línea), cuenta ya suspendida (solo cerrar), cerrado por otra persona (cómo y quién, sin
  acciones), cuenta que ya no existe, y el caso común (cerrar y suspender).
- `lib/moderation/standing-gate.ts` — `active` sigue; `suspended` y `unknown` van a la pantalla de
  suspendida; y el inverso de esa pantalla (`active` → «Mi perfil», `unknown` → error, sin sesión →
  ingresar). Es la regla que decide si una suspendida puede actuar.
- `lib/moderation/rules.ts` — paridad de `WITHHELD_MONTHS` con la base (en `tests/db/`).
- `lib/pets/pet-page-state.ts` (cambia) — `blocked` gana sobre `listed` para quien bloqueó y no para
  la dueña.

**Base (Vitest contra Supabase local, `tests/db/`)**

- `moderation-reports.test.ts`: crear, duplicado sin resolver, de nuevo después de cerrado, otro
  motivo, `self`, `not_found` para una suspendida sin bloqueo y `created` con bloqueo; el check de
  «otro»; `report_queue` ordenada del más viejo al más nuevo, con historial y `reporter_suspended`, y
  los propios solo como contador sin columnas ni en ningún historial; quien administra y fue
  reportada no lee esos reportes ni leyendo `reports` directo con su token; `close_report` `own`, `closed` para la segunda de dos personas que
  administran, `gone` si se borró la cuenta, `not_admin` (también para una que administra y está
  suspendida); borrar a quien reportó deja el reporte con autor nulo; borrar a la reportada borra
  sus reportes. Privacidad, las dos caras: quien administra lee `reports`; la reportada, otra persona con sesión
  y `anon` no leen nada; `report_queue` vacía para quien no administra.
- `moderation-suspension.test.ts`: suspender cierra los reportes sin resolver, retira el pedido de
  identidad abierto y sus filas de imágenes, rechaza la propia y la segunda (`already`); después:
  `public_profile` sin fila; `listed_pets` sin sus animales (con y sin sesión); `pet_by_code` sin
  fila para otra persona; `pet_share_card` sin fila; firmar una foto suya falla; `has_level_two`
  falso y la avalada baja de 3 a 2; `my_vouches` de la otra parte sin la fila; `pet_review_queue`,
  `claim_pet_reminders` y `claim_pet_expiries` la saltean; `renew_by_link` → `invalid` y `renewal_link_view` sin fila; `is_admin`
  falso para una suspendida que administra; `my_account_standing` con el motivo solo para ella.
  Reactivar: todo vuelve, y el vencimiento de una disponible se corre exactamente lo que duró la
  suspensión (una vencida antes de suspender sigue vencida); `already`; `gone`. Privacidad, las dos caras:
  quien administra lee `account_suspensions`; la suspendida, otra persona y `anon` no.
- `moderation-blocks.test.ts`: bloquear borra los avales de las dos direcciones y no escribe
  `vouch_blocks`; `give_vouch` → `unavailable` en las dos direcciones; desbloquear permite volver a
  avalar salvo una quita previa; `listed_pets` para quien bloqueó sin esos animales, con el total correcto y
  con páginas de 24 completas al recorrer con el cursor (FR-015a); para la bloqueada, los de quien la bloqueó sí; `pet_by_code` `blocked` sin datos;
  `blocked_profile` solo para quien bloqueó, también si está suspendida; borrar cualquiera de las dos
  borra el bloqueo. Privacidad, las dos caras: quien bloqueó lee los suyos y quien administra todos;
  la bloqueada y terceros no leen nada.
- `withheld-numbers.test.ts`: `check_phone_code` con el número de una suspendida → `withheld` sin
  prueba en `phone_claims`; `claim_phone_number` con una prueba de antes de la suspensión →
  `withheld`; borrar una suspendida guarda solo el hash y la fecha a 12 meses, y el hash no es el SHA-256
  desnudo del número; con el secreto de Vault quitado, borrar una suspendida igual borra la cuenta (y nada si no estaba
  suspendida, o si no tenía número verificado); con `until` vencido el número se verifica;
  `purge_withheld_numbers` borra los vencidos; reactivar devuelve `in_use` de siempre; paridad de
  `withheld_lifetime()` con `WITHHELD_MONTHS`. Privacidad: `withheld_numbers` ilegible para `anon`,
  `authenticated` y quien administra.

- `lib/email/deliver-notice.ts` — `deliverNotice(send)`, la parte que decide FR-031 (Build: vive
  en su propio archivo y no en `send-suspension-notice.ts`, porque Stryker muta el archivo entero
  y el resto —armar el correo— no tiene test):
  con el envío fallando o pasando el plazo, no lanza y devuelve `sent: false`; con el envío bien,
  `sent: true`. Las acciones lo llaman sin mirar el resultado para decidir el suyo, así la regla vive
  en una función con test y `actions/moderation.ts` sigue sin test (solo llama y revalida).

**Permisos (Vitest contra Supabase local, `tests/db/moderation-grants.test.ts`)**: `anon` y
`authenticated` no pueden ejecutar `create_report`, `block_person`, `unblock_person`, `my_blocks`,
`blocked_profile` ni `purge_withheld_numbers` (reciben el id de la persona como parámetro: si
pudieran, cualquiera reportaría o bloquearía en nombre de otra), ni insertar, actualizar o borrar
en `reports`, `blocks`, `account_suspensions` y `withheld_numbers`; una suspendida no sube un avatar
ni actualiza su perfil con su token.

**Regla de la puerta (un test que recorre el código)**

- `src/lib/auth/session-gate.test.ts` (no en `tests/gates/`: esa carpeta cambia solo con
  `reglas-aprobadas`, y el `aviso` de Ship propone moverlo): solo la lista cerrada de R4 importa `lookupSession` (la sesión sin
  puerta), y cada `page.tsx` de `(public)`, `(app)` y `(auth)` y cada `route.ts` de
  `sigue-disponible` llama a `redirectIfSuspended(` o `requireProfile(`. Es la regla de R4 hecha check.

**Flujo crítico (Playwright, `tests/e2e/suspension.spec.ts`)**: Marta reporta a Ana por «Vende
animales» → Lucía ve el reporte y suspende con un motivo → Ana, con la sesión abierta desde antes y
sin recargar, navega desde `/animales` a la ficha de otro animal y cae en la pantalla de cuenta
suspendida con el motivo → sin sesión, el enlace de un
animal de Ana dice que no está publicado y `/animales` no lo tiene → Lucía reactiva → el enlace
vuelve a mostrar la ficha. Es el que hace que el distintivo tenga consecuencias.

**No se testea**: las páginas, `ReportSheet`, `ReportSent`, `BlockDialog`, `BlockedProfile`,
`MyBlocksList`, `ReportItem`, `ReportHistory`, `SuspendSheet`,
`SuspendedAccountsList`, `SuspendedScreen`, `NumberWithheldScreen`, `CloseReportDialog`,
`ReactivateSheet` (solo pintan o llaman), `lib/moderation/paths.ts` (constantes y una
concatenación sin regla), las
queries que envuelven una llamada (las cubren los tests de la base), las acciones que solo llaman y
revalidan, la plantilla de correo, los textos.

## Docs que cambian en este PR

- `docs/03-mvp-features.md`: las decisiones de la historia, palabra por palabra, y las tres del
  enjambre de esta spec (hecho en la etapa de spec).
- `docs/01-idea.md` §Legal / datos: la decisión del 2026-09-30 (hecho en la etapa de spec); el PR
  cierra #97 citándolo.
- `docs/known-limitations.md`: nuevas **KL-13-1** (la persona reportada que borra su cuenta antes
  de que la suspendan se lleva sus reportes y su número queda libre), **KL-13-2** (quien desbloquea a
  una suspendida ve que su perfil no existe y puede deducirlo), **KL-13-3** (sin tope de reportes por
  persona; quien administra ve quién reporta), cada una con su condición de reapertura.
- `docs/10-design-system.md`: filas nuevas de `ProfileSafetyActions`, `ReportSheet`, `ReportSent`,
  `AnonymityNote`, `BlockDialog`, `BlockedProfile`, `UnblockButton`, `MyBlocksList` `MyBlockRow`
  `MyBlocksEmpty`, `WorkQueue` (forms), `ReportItem`, `ReportHistory`, `ReportDecision`, `OwnReportsLine`,
  `SuspendSheet`, `SuspendedAccountsList` `SuspendedAccountRow`, `ReactivateSheet`,
  `CloseReportDialog`, `SuspendedScreen`, `NumberWithheldScreen`; cambian `PetUnavailable` (`blocked`), `PaperFrame`
  (`menu`), `PublicProfileLayout` (hueco `safety`), `PublicProfileLinks` (Mis bloqueos),
  `IdentitySection` (los dos accesos), `ReviewQueueLink` (también reportes), `CharacterCount` (pasa
  a `forms`).
- `docs/06-i18n.md` §Glosario: los términos de R12.
- `docs/07-stack.md`: decisión de R4 (la puerta de la suspendida en `getSessionUser`) y de R8 (el
  número retenido como hash con fecha).

## Project Structure

### Documentation (this feature)

```text
specs/013-reportar-bloquear-suspender/
├── story.md · spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/routes.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/<ts>_moderation.sql
src/
  app/[locale]/(public)/perfil/[id]/page.tsx · _components/vouch-viewer.ts   (cambian)
  app/[locale]/(public)/animales/[code]/page.tsx                             (cambia)
  app/[locale]/(app)/mis-bloqueos/page.tsx · loading.tsx · error.tsx
  app/[locale]/(app)/revision/reportes/page.tsx · loading.tsx · error.tsx
  app/[locale]/(app)/revision/suspendidas/page.tsx · loading.tsx · error.tsx
  app/[locale]/(app)/verificar-telefono/no-se-puede-usar/page.tsx
  app/[locale]/(app)/mi-perfil/_components/identity-section.tsx · my-profile-sections.tsx (cambian)
  app/[locale]/(suspended)/layout.tsx · cuenta-suspendida/page.tsx · error.tsx
  app/[locale]/_components/paper-frame.tsx                                   (cambia: menu)
  app/[locale]/_components/account-menu.tsx                                  (cambia: lookupSession)
  app/[locale]/(public)/**/page.tsx · (auth)/**/page.tsx                     (cambian: redirectIfSuspended)
  app/[locale]/(public)/perfil/[id]/_components/profile-screen.tsx · blocked-screen.tsx
  app/[locale]/(suspended)/cuenta-suspendida/loading.tsx
  lib/auth/require-profile.ts                                                (usa la puerta)
  actions/moderation.ts
  actions/phone.ts · actions/vouches.ts · actions/profile.ts                 (cambian)
  components/forms/character-count.tsx                                       (movido desde pets)
  components/forms/work-queue.tsx · announce-notices.tsx                     (extraídos de pets)
  components/forms/counted-textarea.tsx            (el texto del reporte y el motivo de suspender)
  components/moderation/
    profile-safety-actions.tsx · report-sheet.tsx · report-sent.tsx · anonymity-note.tsx
    block-dialog.tsx · blocked-profile.tsx · unblock-button.tsx
    my-blocks-list.tsx · my-block-row.tsx · my-blocks-empty.tsx
    report-item.tsx · report-history.tsx · report-decision.tsx
    own-reports-line.tsx · suspend-sheet.tsx
    suspended-account-row.tsx · reactivate-sheet.tsx
    close-report-dialog.tsx
    suspended-screen.tsx
  components/verification/number-withheld-screen.tsx
  components/pets/pet-unavailable.tsx                                        (cambia: blocked)
  components/profile/public-profile-layout.tsx · public-profile-links.tsx    (cambian)
  lib/moderation/rules.ts · types.ts · paths.ts · profile-view.ts · safety-actions.ts · report-age.ts
  lib/moderation/standing-gate.ts · report-actions.ts
  lib/schemas/report.ts · suspension.ts
  lib/pets/pet-page-state.ts                                                 (cambia)
  lib/analytics/events.ts (cambia) · moderation-events.ts
  lib/email/send-suspension-notice.ts · deliver-notice.ts · deliver-notice.test.ts
  lib/moderation/day-label.ts                      (el día de un momento, en la hora de Uruguay)
  hooks/use-suspend.ts · use-reactivate.ts
  lib/supabase/queries/moderation.ts
  lib/supabase/queries/session.ts · vouches.ts · listed-pets.ts · phones.ts  (cambian)
  lib/supabase/types.ts                                                      (pnpm db:types)
messages/es.json
tests/db/moderation-reports.test.ts · moderation-suspension.test.ts · moderation-blocks.test.ts
tests/db/withheld-numbers.test.ts · moderation-support.ts
src/lib/auth/session-gate.test.ts
tests/e2e/suspension.spec.ts
```

**Structure Decision**: la de F00. Lecturas y llamadas a funciones de la base, solo en
`lib/supabase/queries/`; las mutaciones son Server Actions con `ActionResult`; los componentes de
dominio reciben el objeto y los textos y no piden nada (las hojas cliente llaman a las acciones,
como `PetReviewDecision`); `components/moderation` no importa de `pets` ni de `verification`: la
página compone `OwnerCard` o `Avatar` en sus huecos.

## Complexity Tracking

Sin violaciones.

## Para Ship

- **Issue `aviso`**: lo listado en Constitution Check, VIII, y la propuesta de mover
  `session-gate.test.ts` a `tests/gates/` con `reglas-aprobadas`.
- **Hallazgos fuera de alcance**: ninguno que pase el umbral; las limitaciones aceptadas van a
  `docs/known-limitations.md` (KL-13-1 a KL-13-3).
- **PR #97**: se cierra citando este PR, que escribe su decisión en docs/01.
