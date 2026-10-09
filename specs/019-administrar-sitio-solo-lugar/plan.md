# Implementation Plan: Administrar el sitio desde un solo lugar: lo que espera, desde cuándo y los antecedentes de cada persona

**Branch**: `feature/73-administrar-sitio-solo-lugar` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/019-administrar-sitio-solo-lugar/spec.md` (4 user stories). Decisiones técnicas en
[research.md](./research.md) (R1–R13); tabla y funciones en [data-model.md](./data-model.md); rutas,
acción, tarea, correo y eventos en [contracts/routes.md](./contracts/routes.md).

## Summary

Quien administra entra a **Administrar** (`/administrar`) desde el menú o desde Mi perfil, con el
número de pendientes que puede resolver. Ve las tres colas con cuántos, desde cuándo espera el más
viejo y si se pasaron de plazo (las atrasadas primero), lo suyo aparte, las entradas a Cuentas
suspendidas, Opiniones y Encuestas con lo llegado en 7 días, y una búsqueda por nombre. Cada persona
tiene su **ficha** (`/administrar/personas/<id público>`) con sus antecedentes y suspender o
reactivar. A las 8 de Uruguay, cada persona que administra recibe un **resumen** por correo si tiene
algo esperando. Las seis listas vuelven a Administrar y sus nombres llevan a la ficha.

Cinco decisiones ordenan el plan:

1. **Quien administra lee por funciones `admin_*`** que preguntan `is_admin()` adentro; ninguna policy
   de tabla se ensancha (R1). La ficha es un documento de una sola llamada (R4) y la búsqueda pliega
   tildes en la base sin extensión nueva (R6).
2. **Una sola definición de pendiente** en la base (`private.admin_queue_rows`) para Administrar, el
   menú y el resumen; cada cola se cuenta aparte para que una que falla no tumbe las otras (R2).
3. **Plazos, atraso, orden y la forma de decir una espera son funciones puras** de `lib/admin`, con
   mutación al 100 % (R3).
4. **El resumen es la tarea de siempre**: `pg_cron` a las 11:00 UTC, `pg_net` a una ruta con secreto,
   y una fila por persona y día que impide el segundo envío (R8).
5. **Se reusa lo de #13** para suspender y reactivar desde la ficha (R11), y `WorkQueue`,
   `ReviewQueueLink`, `NavLink` y `TextLink` para el resto (R12).

## Technical Context

**Language/Version**: TypeScript (`strict`), React 19, Next.js 16 (App Router).

**Primary Dependencies**: las de `main`. **Ninguna nueva** (R13).

**Storage**: Postgres de Supabase (local). Una migración nueva: una tabla sin datos de personas, nueve
funciones, un `drop`/`create` de `pet_review_queue`, una policy de Storage y un `cron.schedule`.

**Testing**: Vitest (unidad y base local), Playwright (un archivo, dos flujos), Stryker al 100 % sobre
lo que tenga test.

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: el presupuesto de docs/07. En todas las pantallas con sesión, `AccountMenu`
suma una llamada a la base (`admin_pending_total`, que para quien no administra corta en
`is_admin()` y devuelve `null`) y, para quien administra, un `NavLink` más: cero JS nuevo. Sin sesión
no hay llamada, así que Lighthouse (que corre sin sesión) no cambia. La única hoja cliente nueva de
peso (`PersonSearch`) vive solo en `/administrar`; `RecordModeration` solo en la ficha, y las hojas de
#13 se cargan como ya se cargan.

**Constraints**: sin Vercel; nada nuevo se indexa (`noindex` en las dos pantallas nuevas); ningún dato
nuevo de personas; lo de #11, #13 y #59 se lee, no se rehace.

**Scale/Scope**: 2 pantallas nuevas, 8 que cambian (las seis listas, Mi perfil, el menú), 1 migración,
1 archivo de acciones nuevo, 1 ruta de tarea, 1 correo, ~10 componentes nuevos.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas, rutas ni componentes; el cómo está acá. |
| **II. Una feature, un PR** | Cuatro user stories en un PR, en orden: P1 Administrar (con menú, Mi perfil y la vuelta de las listas), P2 la ficha, P3 el resumen, P4 la búsqueda. |
| **III. Compuertas verdes** | `pnpm gates:affected` en cada ronda; `pnpm verify` al cerrar. |
| **IV. Reglas como código** | Qué es un pendiente, lo propio, la ficha (qué muestra y qué nunca), la búsqueda, el envío una vez por día y quién no lo recibe son funciones con tests de base; plazos, atraso, orden, esperas, «99+», el texto del resumen, los orígenes, el schema de búsqueda y los eventos son funciones puras con test. |
| **V. Datos personales** | Ninguna policy de tabla se ensancha; las funciones devuelven solo lo de FR-031 a FR-037 y nada a quien no administra; los tests lo intentan como `anon`, como una persona, como quien administra con lo suyo y como una suspendida que administra. La ficha nunca lleva teléfono, correo, imágenes de identidad, solicitudes, bloqueos ni opiniones. El resumen no lleva nombres ni textos. Ningún evento lleva lo buscado ni datos de nadie. |
| **VI. Sin deriva** | Sin tablero del funnel, sin asignar pendientes, sin registro de quién hizo qué, sin buscar por correo o teléfono, sin preferencias del resumen, sin notificaciones del teléfono ni WhatsApp. |
| **VII. Liviana y linda** | Server Components; dos hojas cliente, solo en las pantallas de quien administra. Todo contra docs/10; ningún token nuevo. |
| **VIII. Autonomía con veto** | `aviso` en Ship: el resumen por `pg_cron` y no reintentado; la búsqueda por nombre plegado sin extensión; la policy de fotos para quien administra; «Opinar» y «Administrar» en par en el teléfono. |

**Sin violaciones**: Complexity Tracking vacío. Ningún cambio transversal de stack.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. El skill
`frontend-design:frontend-design` no está instalado en la sesión que escribió este plan; el plan se
escribió leyendo docs/10 (§Principios, §Tokens, §Componentes, §Pantallas anchas) y Build lo carga antes
del primer JSX si está disponible.

**La idea.** Administrar es **la tabla de avisos del poste vista de cerca**: tres renglones, uno por
cola, que dicen en una frase cuánto espera y desde cuándo; la que se pasó de plazo lleva el sello
«Atrasada», torcido, como alguien que lo marcó a mano. Nada de números grandes con etiqueta chica ni
tarjetas iguales: un renglón por cola, con divisores, como `WorkQueue`. La ficha es **la carpeta de una
persona**: arriba quién es (foto, nombre en voz de afiche, chapita, zona), y debajo cuatro hojas de
antecedentes, cada una una lista corta en texto de lectura.

**Lo único que llama la atención**, por pantalla: en Administrar, el sello `warning` «Atrasada por 1
día» de la primera cola atrasada (si no hay ninguna, nada llama: está todo al día); en la ficha, el
estado de la cuenta («Suspendida», sello `muted`) si lo está; si no, nada; «Suspender» es `secondary`
y el `danger` vive en el botón que confirma dentro de la hoja, como en #13. En el menú, el número va
entre paréntesis en el mismo texto: no es un globo de color.

### Tokens

Color: `--color-ink` (texto, renglones, enlaces), `--color-ink-muted` (esperas, fechas, zonas, «Nada
esperando», lo propio), `--color-line` (divisores entre colas y entre antecedentes),
`--color-warning` (el sello «Atrasada», solo ahí: le toca actuar a alguien, docs/10 `Stamp`),
`--color-surface` (skeletons). Ni `--color-primary` (salvo la chapita de nivel) ni `--color-accent`
(salvo `ErrorText` y el `danger` de la hoja de #13). Tipografía: `.afiche` `--text-2xl` para los
títulos de pantalla y el nombre en la ficha; `--text-lg` en `--font-weight-bold` para el nombre de
cada cola y de cada parte de la ficha (`h2`); `--text-base` para las frases; `--text-sm` para fechas,
zona y metadatos. Espacio: `--space-2` dentro de un renglón, `--space-6` entre renglones (con
divisor), `--space-10` entre bloques; desde 1024 `--space-12` entre columnas. Movimiento: el de
`Button`, `TextLink` (`.press`), `Sheet` y `Toast`; los renglones-enlace se hunden al presionar; nada
entra solo. **Ningún token nuevo.**

### Menú · `AccountMenu` (cambia)

```
390 px, quien administra y publica
┌──────────────────────────────────────┐
│ [marca]                    Mi perfil │
│        Animales en adopción  Mis anim│
│     Solicitudes recibidas  Mis solic.│
│              Opinar  Administrar (5) │  ← par nuevo: Opinar baja con Administrar
└──────────────────────────────────────┘
desde 1024: todos en el renglón de la marca, «Administrar (5)» antes de «Mi perfil»
```

Sin pendientes: «Administrar». Etiqueta accesible: «Administrar, 5 pendientes». Para quien no
administra, el menú queda exactamente como hoy.

### Mi perfil · `IdentitySection` (cambia)

Al pie de «Tu identidad», un solo `ReviewQueueLink` «Administrar (5)» (o «Administrar») en lugar de
los seis. Nada más cambia en Mi perfil.

### Administrar · `/administrar` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ Administrar                          │  afiche 2xl
│ Hay 5 cosas que podés resolver.      │  text-base muted (o «No hay nada esperando»)
│──────────────────────────────────────│
│ Pedidos de identidad    ╱ATRASADA   ╲│  h2 lg bold + Stamp warning (por 1 día)
│ 3 esperando, el más viejo de hace    │  text-base
│ 3 días.                              │
│──────────────────────────────────────│  divisor line; el renglón entero es enlace
│ Publicaciones por revisar            │
│ 2 esperando, el más viejo de hace    │
│ 4 horas.                             │
│──────────────────────────────────────│
│ Reportes sin resolver                │
│ Nada esperando.                      │  muted
│──────────────────────────────────────│
│ Espera a otra persona que administre │  h2 lg bold (solo si hay algo tuyo)
│ Tu publicación de Tobi, desde hace   │  text-base muted, sin sello
│ 2 días.                              │
│                                      │
│ Buscar a una persona                 │  h2 lg bold
│ Nombre ____________________ [Buscar] │  Input line + Button secondary
│ (resultados)                         │
│                                      │
│ Cuentas suspendidas                  │  TextLink block
│ Opiniones: 4 en los últimos 7 días   │  TextLink block
│ Encuestas: 2 respuestas en los       │  TextLink block
│ últimos 7 días                       │
└──────────────────────────────────────┘
desde 1024: dos columnas; a la izquierda las colas y lo tuyo, a la derecha buscar y las entradas
```

`AdminQueueRow` dibuja un renglón: el nombre de la cola, la frase (cuántos y desde cuándo, con
`waitParts`) y, si está atrasada, el `Stamp` `warning` `md` «Atrasada por 1 día». Una cola que no se
pudo contar dice «No se pudo contar.» en `--color-ink-muted` y sigue siendo enlace. Cargando
(`loading.tsx`): `Skeleton` del título, tres renglones de dos líneas y la columna de la derecha.
Error de la pantalla: `ErrorScreen` con «Reintentar».

### Buscar · `PersonSearch` (nuevo, hoja cliente dentro de Administrar)

```
│ Nombre ____________________ [Buscar] │
│ Escribí al menos 3 letras.           │  ErrorText (si hace falta)
│──────────────────────────────────────│
│ (A) Ana Pérez                        │  Avatar md + text-base medium
│     Pocitos, Montevideo              │  text-sm muted
│──────────────────────────────────────│
│ (B) Bruno Díaz        ╱Suspendida╲   │  Stamp muted md
│     Salto                            │
│ Hay más: escribí más del nombre.     │  text-sm muted
```

Estados: quieto · buscando (`Buscar` en `loading`, el campo sigue escribible) · resultados · sin
resultados («No encontramos a nadie con ese nombre.», `text-base`) · menos de 3 (`ErrorText` atado al
campo) · error (`ErrorText` «No se pudo buscar por la conexión.» y el mismo `Buscar` reintenta: una
acción aparece una sola vez, docs/10 §Principios 6). Lo escrito nunca se borra. Cada resultado es un
renglón-enlace (`PersonResult`) a la ficha con `?desde=busqueda`.

### Ficha de una persona · `/administrar/personas/[publicId]` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ Volver a Administrar                 │  AdminBackLink
│ (foto lg)  Bruno Díaz                │  Avatar lg + afiche 2xl
│            [chapita md] Nivel 2,     │  VerificationBadge md sin enlace + text-sm
│            Salto                     │
│ Tiene cuenta desde el 3 de setiembre.│  text-sm muted
│ ╱Suspendida╲ «Vendía cachorros.»     │  Stamp muted + motivo (si está suspendida)
│ La suspendió Lucía el 3 de octubre.  │  text-sm muted
│ [ Suspender ]  o  [ Reactivar ]      │  secondary (no en la propia ficha)
│──────────────────────────────────────│
│ Pedidos de identidad                 │  h2 lg bold
│ Rechazado: la foto no se lee.        │  RecordEntry text-base
│ 29 de setiembre                      │  text-sm muted
│──────────────────────────────────────│
│ Reportes                             │
│ Vende animales, cerrado sin medidas. │
│ «Publicó tres cachorros con precio.» │
│ Llegó el 20 de setiembre, se cerró   │
│ el 21.                               │
│──────────────────────────────────────│
│ Suspensiones                         │
│ Sin suspensiones.                    │  muted
│──────────────────────────────────────│
│ Publicaciones                        │
│ Tobi, dada de baja: venta.           │
│ Luna, disponible.                    │
│ [ Ver más ]                          │  secondary, solo con más de 20
└──────────────────────────────────────┘
desde 1024: dos columnas; la persona y la acción a la izquierda, las cuatro partes a la derecha
```

`PersonRecordHeader` (la persona; la chapita es `VerificationBadge` `md` con `href: null`, y sin
nivel no hay chapita y la línea dice «Sin teléfono verificado, Salto»; el hueco `action` lo llena la
página), `RecordSection` (el `h2`, la lista con divisores, el vacío y «Ver
más» con `ShowMoreLink`) y `RecordEntry` (una línea principal, una de metadatos, un sello opcional —`Stamp` `muted` «Sin
resolver»/«Por revisar»— y un `href` opcional: el pedido de identidad en revisión lleva a ese pedido
en Pedidos de identidad, salvo el propio). Las frases de cada antecedente las arma
`administrar/personas/[publicId]/_components/record-texts.ts` con `messages/` (`admin.record.*`), así
la página solo compone: un solo componente de entrada para las cuatro partes. En la propia ficha, «Reportes» dice solo «1 reporte sobre vos espera a otra persona que
administre.» o «Sin reportes», y el pedido propio en revisión «Espera a otra persona que administre.»
Vacíos: «Sin pedidos de identidad», «Sin reportes», «Sin suspensiones», «Sin publicaciones». Cuenta
borrada: `HeadedEmptyState` «Esta cuenta ya no existe» con `LinkButton` `secondary` «Volver a
Administrar». Cargando: `Skeleton` de la cabecera (disco + dos líneas) y tres partes de dos renglones.
Error: `ErrorScreen`.

### Las seis listas (cambian)

Arriba del título, `AdminBackLink` («Volver a Administrar», `TextLink` `block`), en todos los estados;
el vacío vuelve a Administrar. En Pedidos de identidad, Publicaciones por revisar, Reportes y Cuentas
suspendidas, el nombre de cada persona es un `TextLink` `inline` a su ficha (`SuspendedAccountRow`
deja de decir «sin enlace»: el perfil público sigue sin existir, pero la ficha sí).

### El correo del resumen

La plantilla de siempre (`renderNoticeEmail`): título, una línea por cola con algo (sin colores ni
sellos: un correo no tiene los tokens; la palabra «atrasada» lo dice), y el botón «Abrir
Administrar».

### Componentes

Reusados: `PageShell`, `ErrorScreen`, `HeadedEmptyState`, `Skeleton`, `Stamp`, `Avatar`,
`VerificationBadge`, `TextLink`, `LinkButton`, `Button`, `Input`, `ErrorText`, `ShowMoreLink`,
`WorkQueue`, `ReviewQueueList`, `ReviewQueueLink`, `NavLink`, `SuspendSheet`, `ReactivateSheet`,
`AnnounceNotices`.

Nuevos: `components/admin/admin-queue-row.tsx`, `components/admin/admin-queue-board.tsx` (los tres
renglones, ya ordenados), `components/admin/own-pending-list.tsx`, `components/admin/admin-entries.tsx`,
`components/admin/person-search.tsx` (cliente) con `hooks/use-person-search.ts`,
`components/admin/person-result.tsx`, `components/admin/person-record-header.tsx`,
`components/admin/record-section.tsx`, `components/admin/record-entry.tsx`,
`components/moderation/record-moderation.tsx` (cliente: compone `SuspendSheet` o `ReactivateSheet`,
que son de su mismo dominio), `app/[locale]/(app)/_components/admin-back-link.tsx`.
Los de dominio reciben los textos y los datos por props y nunca hacen fetch; `PersonSearch` recibe la
acción por props.

### Copy y antipatrones

Voseo, oración con mayúscula inicial. «Administrar» es el nombre de la pantalla, del enlace y del
botón del correo. Las esperas, con la regla de la spec («hace 20 horas», «hace 3 días», «menos de 1
hora»). Sin `·`, sin `→`, sin mayúsculas sostenidas, sin números grandes con etiqueta chica. El sello
dice «Atrasada por 1 día» (concuerda con «cola»).

## Qué se testea (y qué no)

**Base (`tests/db/`, contra Supabase local)**:

- `admin-privacy.test.ts`: `admin_queue_count`, `admin_pending_total`, `admin_recent_counts`,
  `admin_person_record` y `admin_search_people` devuelven nada (o `null`) a `anon`, a una persona con
  sesión y a quien administra estando suspendida; `claim_admin_digests` y `admin_digest_tick` no se
  ejecutan con `anon` ni `authenticated`; `admin_digest_sends` no se lee ni escribe con ninguna sesión;
  la ficha nunca trae teléfono, correo, imágenes, solicitudes, bloqueos ni opiniones (las claves del
  documento son exactamente las de data-model) ni `reporter`/`resolved_by`; la propia ficha no trae
  reportes sobre sí, solo `own_open`; la policy de fotos deja firmar un avatar ajeno a quien
  administra y no a una persona.
- `admin-rules.test.ts`: cada cola cuenta lo de otras y deja lo propio en `own` (pedido, publicación con
  su nombre, reporte sin motivo); una publicación de una suspendida no cuenta; un pedido vencido no
  cuenta; `oldest` es el `since` más viejo de lo no propio; `admin_pending_total` es la suma; las
  cuentas de 7 días incluyen hoy y los 6 anteriores y no el séptimo; `cron.job` tiene `admin-digest`
con `0 11 * * *` (las 8 de Uruguay); la búsqueda pliega tildes y
  mayúsculas («marta suarez» → «Marta Suárez»), exige 3 caracteres sin espacios, pone primero a quien
  empieza así, incluye suspendidas, devuelve 21 con más de 20, no encuentra una cuenta borrada; la
  ficha: rechazos dentro de 30 días y no el de 31, el vencimiento en ventana, reportes sobre la persona
  con motivo y cómo se cerraron, suspensiones con «una cuenta borrada», publicaciones con su estado y
  el motivo de baja, nivel 0 sin teléfono; `claim_admin_digests` reclama a quien tiene algo, no a quien
  solo tiene lo suyo ni a una suspendida, y la segunda llamada del día no reclama a nadie; purga lo de
  más de 7 días.

**Unidad (Vitest, con mutación al 100 %)**: `queueStanding` (sin pendientes, justo en el plazo, un
milisegundo después, por cola), `orderQueues` (atrasadas por cuánto, empates, orden fijo), `waitParts`
(59 min, 1 h, 23 h 59, 24 h, 71 h 59, 72 h), `badgeCount` (0, 1, 99, 100), `digestLines` (solo colas
con algo, orden, atrasada, sin datos de personas), `parseAdminOrigin`/`parseRecordOrigin`,
`adminSearchSchema` (2 y 3 caracteres, espacios en el medio no cuentan, 60/61, recorte), los eventos
nuevos (`admin-events.ts`, con `digestSentEvent`: horas enteras, sin texto), `searchOutcome` (cada resultado de la acción a su
clave).

**E2E (Playwright)**: `tests/e2e/administrar.spec.ts` — (1) como quien administra sembrada, con un
reporte y una publicación propia sembrados: el menú dice «Administrar (N)», Administrar muestra la cola
de reportes y la publicación propia aparte; abrir Reportes, volver a Administrar; tocar el nombre de la
reportada, su ficha con el reporte; suspender con motivo y ver «Suspendida». (2) buscar «an» y ver
«Escribí al menos 3 letras» con «an» todavía en el campo; buscar «ana perez», ver las dos Ana
sembradas y abrir una ficha; como una persona que no administra, `/administrar` dice
«Acá no hay nada». El resumen se prueba con la ruta de la tarea y `.artifacts/mail/` en el mismo
archivo: un POST con el secreto deja un correo con «reportes sin resolver» y ningún nombre; un segundo
POST no deja otro.

**Qué no**: las páginas, `ui/`, los componentes que solo pintan (`AdminQueueRow`, `AdminQueueBoard`,
`OwnPendingList`, `AdminEntries`, `PersonResult`, `PersonRecordHeader`, `RecordSection`,
`RecordEntry`, `AdminBackLink`), las queries finas, la ruta de la tarea (su lógica es
`claim_admin_digests` y `digestLines`).

## Docs que cambian en este PR

- `docs/03-mvp-features.md`: las siete decisiones del enjambre, palabra por palabra (§6) — ya en esta
  rama desde la etapa Spec.
- `docs/06-i18n.md`: glosario «Administrar» (`admin home`), «ficha de una persona» (`person record`;
  distinta de la ficha de un animal), «resumen» (`admin digest`), «atrasada» (`overdue`), «pendiente»
  (`pending item`); namespace `admin`.
- `docs/10-design-system.md` §Componentes: los nuevos de arriba; `AccountMenu` con «Administrar» y la
  decisión del par con «Opinar» en el teléfono; `ReviewQueueLink` como el acceso único a Administrar;
  `WorkQueue` y `SuspendedAccountRow` con la vuelta y el nombre que lleva a la ficha.
- `docs/07-stack.md`: decisión fechada: el resumen de la mañana corre por `pg_cron` + `pg_net` (no por
  Vercel Cron, que llega con la beta).
- `docs/known-limitations.md`: un resumen que no salió a las 8 no se reintenta ese día; el plegado de
  la búsqueda cubre las letras del español, no otros alfabetos.

## Project Structure

### Documentation (this feature)

```text
specs/019-administrar-sitio-solo-lugar/
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
supabase/migrations/<ts>_admin_home.sql              nueva
src/lib/supabase/types.ts                            regenerado (pnpm db:types)
src/lib/supabase/queries/admin.ts                    nueva: adminQueueCount, adminPendingTotal, adminRecentCounts,
                                                     personRecord, searchPeopleRows, claimAdminDigests
src/lib/supabase/queries/review-queue.ts             cambia: publicId en cada ítem
src/lib/supabase/queries/pet-reviews.ts              cambia: publisherPublicId
src/lib/admin/paths.ts · types.ts                    nuevas
src/lib/admin/queues.ts · badge.ts · digest.ts · origins.ts · search-outcome.ts (+ tests)   nuevas
src/lib/schemas/admin-search.ts (+ test)             nueva
src/lib/schemas/suspension.ts                        cambia: origin?: 'record'
src/lib/analytics/admin-events.ts (+ test)           nueva · events.ts cambia
src/actions/admin.ts                                 nueva: searchPeople
src/actions/moderation.ts                            cambia: origen record, revalidar Administrar y la ficha
src/lib/email/send-admin-digest.ts                   nueva
src/app/api/cron/resumen/route.ts                    nueva
src/hooks/use-person-search.ts                       nueva
src/components/admin/                                admin-queue-row, admin-queue-board, own-pending-list, admin-entries,
                                                     person-search, person-result, person-record-header, record-section,
                                                     record-entry
src/components/moderation/record-moderation.tsx      nueva (cliente)
src/app/[locale]/_components/account-menu.tsx        cambia: Administrar con el número
src/app/[locale]/(app)/_components/admin-back-link.tsx   nueva
src/app/[locale]/(app)/administrar/                  page.tsx, loading.tsx, error.tsx, _components/*-texts.ts nuevas
src/app/[locale]/(app)/administrar/personas/[publicId]/   page.tsx, loading.tsx, error.tsx, _components/record-texts.ts nuevas
src/app/[locale]/(app)/mi-perfil/_components/identity-section.tsx   cambia: un solo acceso
src/app/[locale]/(app)/revision/page.tsx · [id]/page.tsx · publicaciones/ · reportes/ · suspendidas/ ·
  opiniones/ · encuestas/                            cambian: vuelta a Administrar y nombres a la ficha
src/components/verification/review-queue-list.tsx    cambia: nombre como enlace
src/components/moderation/suspended-account-row.tsx  cambia: nombre como enlace
src/app/[locale]/(app)/revision/publicaciones|reportes/_components   cambian: nombre como enlace
messages/es.json                                     admin.*, emails.admin_digest.*, metadata.admin.*
tests/db/admin-privacy.test.ts · admin-rules.test.ts nuevos
tests/e2e/administrar.spec.ts                        nuevo
```

`components/admin` no importa de `components/moderation`: la página pone `RecordModeration` en el
hueco `action` de `PersonRecordHeader`, como `MyPetsGrid` recibe las encuestas (#71). La capa va hacia
abajo: `app → components/<dominio> → components/ui`.

## Cambios de Build

- **US1, `ReviewDecision` en `/revision/[id]`**: `profileHref` sigue en `/mi-perfil`. Esa prop es a
  dónde va quien **dejó de administrar** al resolver (`review.errors.not_admin`); mandarla a
  Administrar le mostraba «Acá no hay nada». La vuelta de la pantalla del pedido sigue siendo su
  lista, que ahora vuelve a Administrar.
- **US1, `adminPendingTotal()`** devuelve `{ isAdmin: false } | { isAdmin: true; count: number |
  null }` y no `number | null`: si la llamada falla, pregunta aparte si la sesión administra, así la
  entrada se ve sin número (FR-020) en lugar de desaparecer. Reemplaza a `isAdmin()` en Mi perfil.
- **US1, la frase de Administrar** con una cola sin contar dice «No se pudo contar todo lo que
  espera.» (`admin.home.lead_unknown`): «No hay nada esperando» mentiría.
- **US1, `countPendingReviews`, `countPetReviews` y `countOpenReports`** se borran: los usaban solo
  los seis accesos de Mi perfil. Las claves `link`/`back_profile` de las seis listas, también.
- **US1, `pet-reviews.test.ts`**: la última aserción decía que, revisada la publicación, quien
  administra ya no firma la foto de perfil de quien publicó. Con `avatars_select_admin` (R10) la
  firma siempre; la prueba ahora lo afirma y suma que una persona sigue sin poder.

## Complexity Tracking

Vacío.

## Para Ship

- `aviso`: el resumen corre por `pg_cron` a las 11:00 UTC y un día que no salió no se reintenta; la
  búsqueda pliega tildes en la base sin extensión; quien administra puede firmar cualquier foto de
  perfil (policy nueva de Storage); en el teléfono «Opinar» baja a formar par con «Administrar» para
  quien administra.
- Las siete decisiones del enjambre ya están en docs/03 §6 en esta rama.
