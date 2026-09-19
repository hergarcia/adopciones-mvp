# Implementation Plan: Registro e ingreso sin contraseña con perfil básico

**Branch**: `feature/9-registro-e-ingreso` | **Date**: 2026-09-19 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/002-registro-e-ingreso/spec.md` (69 requisitos, 5 user stories, endurecida en 3 rondas)

## Summary

Primera historia con producto: trae las personas, la sesión y las cuatro pantallas de la cuenta.
El ingreso es sin contraseña, por un enlace de un solo uso que **manda el propio producto** —el
servicio de autenticación genera el enlace pero no lo envía—, o por Google. El perfil básico
(nombre, zona, foto opcional, marca de rescatista) se completa al entrar y se puede editar o
borrar. Ningún dato de una persona es legible por otra: es la primera vez que el arnés de
privacidad de F00 tiene algo real que custodiar.

Tres cosas hacen este plan distinto de "el tutorial de auth":

1. **El enlace lo controlamos nosotros.** `auth.admin.generateLink` devuelve el token sin mandar
   nada, así que el correo sale por Resend con su texto en `messages/es.json` y, sobre todo,
   podemos distinguir los tres motivos por los que un enlace no entra (FR-005), cosa que el
   mensaje genérico del servicio no permite.
2. **Los dos topes son de naturaleza distinta.** El que se le cuenta a la persona vive en su
   navegador; el que protege el buzón ajeno vive en la base y es mudo. Mezclarlos era el oráculo
   que FR-006a prohíbe.
3. **La foto es privada de verdad**, en un bucket sin lectura pública, servida por URL firmada de
   vida corta. Es la primera pieza de identidad que guarda el producto.

## Technical Context

**Language/Version**: TypeScript 7.0.2 (`strict`), React 19.3, Next.js 16.3.5 (App Router)

**Primary Dependencies**: las de `main` más seis, todas ya decididas en `docs/07-stack.md`:

| Paquete | Versión | Para qué | Verificado |
|---|---|---|---|
| `@supabase/ssr` | 0.12.7 | sesión en cookies entre Server Components, Server Actions y proxy | `npm view`, 2026-09-19 |
| `react-hook-form` | 7.88.0 | los dos formularios (ingreso, perfil) | idem |
| `zod` | 4.6.5 | un schema por formulario, compartido cliente/servidor | idem |
| `@hookform/resolvers` | 5.9.1 | une los dos anteriores | idem |
| `resend` | 6.28.1 | el envío del correo del enlace | idem |
| `@react-email/components` | 1.0.12 | la plantilla del correo, con el texto desde `messages/es.json` | idem |

**No** entran, a propósito: `posthog-js` (decisión de Hernán: la medición se dispara pero todavía
no se manda a ninguna herramienta), `thumbhash` y `browser-image-compression` (la foto de perfil
es un cuadrado chico; el marcador de posición son las iniciales, que ya exige FR-024, y el
redimensionado se hace con canvas, que `docs/07` §Imágenes acepta explícitamente). La historia de
publicar animales va a necesitar las dos y las va a adoptar con su caso real.

**Tampoco entra un decodificador de HEIC**, y por eso **HEIC sale de los tipos aceptados**: fuera
de Safari, canvas no lo decodifica, así que prometerlo dejaría a toda foto de iPhone abierta en
Android o en escritorio cayendo siempre en el error de procesado. En la práctica no se pierde
nada: iOS convierte la foto a JPEG al subirla desde el navegador. Un archivo que el navegador no
pueda decodificar cae en FR-025a con un mensaje que dice que se pruebe con otra foto. La spec se
ajustó en FR-025.

Las seis dependencias se registran en `docs/07-stack.md`, una línea con fecha y motivo por cada
una, **en este mismo PR** (regla 7 de `CLAUDE.md`).

**Storage**: Postgres de Supabase (local, CLI en Docker). Dos tablas nuevas y un bucket privado.

**Testing**: Vitest (unidad + RLS contra la base local), Playwright (un flujo), Stryker al 100 %
sobre lo que tenga test.

**Target Platform**: web, mobile-first a 390 px.

**Project Type**: aplicación web Next.js, estructura ya fijada por F00.

**Performance Goals**: los del presupuesto — LCP < 2,5 s, JS inicial < 150 KB, Lighthouse
mobile ≥ 90. Las cuatro pantallas son formularios: el único JS de cliente es el de los formularios
y el de la foto.

**Constraints**: sin dominio propio todavía (`docs/04`), así que el envío real de Resend se
enciende con la variable de entorno; sin ella, el mismo mensaje se escribe en `.artifacts/mail/`
(ignorado por git) y de ahí lo lee la prueba de punta a punta. Las dos salidas comparten plantilla
y texto, así que lo que se prueba es lo que se manda, y `pnpm verify` corre sin red. Sin proyecto
en la nube hasta M5.

**Scale/Scope**: 7 rutas nuevas, ~14 componentes, 2 hooks, 2 tablas, 1 bucket, 6 dependencias.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra una sola tabla ni ruta; todo el cómo está acá. |
| **II. Una feature, un PR** | Cinco user stories que se construyen y verifican una por una, en un PR. |
| **III. Compuertas verdes y revisión fresca** | `pnpm verify` completo; qué se testea y por qué está en §Qué se testea, con su justificación contra `docs/09`. |
| **IV. Reglas como código** | Cada regla de visibilidad es una policy con su test que intenta leer lo que no debe verse; el destino de vuelta (FR-014) es una función pura con test, porque es un redirect abierto si se hace mal. |
| **V. Datos personales mínimos y privados** | RLS en las dos tablas, bucket privado, borrado todo-o-nada, eventos de medición sin identificador de persona. Se guarda exactamente lo que la historia nombra más lo que FR-030a autoriza. |
| **VI. Sin deriva** | Nada de la tabla "Fuera del MVP". No se construye el gate de teléfono verificado (FR-031) ni panel de administración (FR-026b). |
| **VII. Liviana y linda, medido** | Server Components por defecto; `"use client"` en cuatro hojas. Todo contra `docs/10`. |

**Sin violaciones**: la tabla de Complexity Tracking queda vacía.

## Diseño

Guía: `docs/10-design-system.md`. La identidad es **«Cartel»**: la acción es tinta, el verde es
confianza, los radios son cero, los títulos van en voz de afiche. Estas son las primeras pantallas
de formulario del producto, así que fijan cómo se ve un formulario en este sistema.

**La idea que ordena las cuatro pantallas:** el ingreso es *el formulario que alguien rellenó a
mano al pie del cartel*. Por eso los campos son renglones de tinta y no cajas, y por eso hay
exactamente un gesto por pantalla. El sistema ya tiene esa forma en `field.ts` (`shape: 'line'`);
acá se usa por primera vez de verdad.

### Tokens, sin ninguno nuevo

Color: `--color-canvas` de fondo, `--color-ink` para texto y para la acción, `--color-ink-muted`
para las ayudas, `--color-line` en divisores, `--color-accent` solo en errores, `--color-primary`
solo en el aviso de que el correo es privado (es confianza, no acción), `--color-surface` en la
base del skeleton. Tipografía: `.afiche` en el `h1` de cada pantalla, `--text-base` en el cuerpo,
`--text-sm` en las ayudas. Espacio en pasos de 4. Movimiento: `--dur-fast` en botones y foco,
`--dur-base` en la entrada del error. **No se agrega ningún token**, así que `docs/10` §Tokens no
se toca.

### Ingreso · `/entrar`

```
┌──────────────────────────────┐
│ [logo]                       │  ← PageShell, gutter 16
│                              │
│ Entrá sin contraseña         │  .afiche, --text-2xl
│ Te mandamos un enlace al     │  --text-base, --color-ink-muted
│ correo. No hay que inventar  │  medida 65ch
│ ninguna contraseña.          │
│                              │
│ Tu correo                    │  label --text-sm
│ ───────────────────────────  │  Input shape:line, 2px tinta
│                              │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │  .perforado
│ █ Enviarme el enlace       █ │  Button tirita, 56px  ◀ EL ELEMENTO
│                              │
│ ──────── o ────────          │  divisor --color-line
│ ┌──────────────────────────┐ │
│ │  Entrar con Google       │ │  Button secondary (solo si hay credenciales)
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

**El único elemento que llama la atención**: la `tirita` «Enviarme el enlace», con su perforado.
Es la acción principal y es la única de la pantalla. Google queda en `secondary` a propósito: es
un atajo, no el camino.

Tres estados del bloque con datos (el formulario): **cargando** no aplica, no hay datos que
traer; **vacío** es su estado natural; **error** es `ErrorText` bajo el renglón, que toma
`--color-accent`, atado por `aria-describedby`, con el foco puesto en el campo.

### Revisá tu correo · `/entrar/revisa-tu-correo`

```
┌──────────────────────────────┐
│ ← Volver                     │  Button ghost
│                              │
│ Mirá tu correo               │  .afiche --text-2xl
│ Le mandamos un enlace a      │
│ ana@ejemplo.com              │  --font-weight-medium
│                              │
│ ┌──────────────────────────┐ │  Card (nota de papel, borde 2px)
│ │ Si no aparece, fijate en │ │
│ │ el correo no deseado.    │ │
│ │ El enlace vale una sola  │ │
│ │ vez y vence en una hora. │ │
│ └──────────────────────────┘ │
│                              │
│ Enviar otro (45)             │  Button ghost, deshabilitado con cuenta
└──────────────────────────────┘
```

La cuenta regresiva sale del navegador, nunca de la dirección (FR-006a). **El elemento**: el
correo escrito en `--font-weight-medium` — lo que la persona necesita confirmar es a dónde se
mandó. Estados: **cargando** el botón ocupado mientras se pide otro; **vacío** no aplica;
**error** una tira de `Toast error` si el reenvío falla.

### Completar perfil · `/completar-perfil`

```
┌──────────────────────────────┐
│ Contá quién sos              │  .afiche --text-2xl
│ Con esto las personas saben  │
│ con quién están hablando.    │
│                              │
│   ┌────┐                     │  Avatar 96px 1:1, --radius-card (0)
│   │ AG │  Agregar foto       │  iniciales sobre --color-surface
│   └────┘                     │  Button ghost al lado
│                              │
│ Cómo te llamás               │
│ ───────────────────────────  │  Input line
│ Departamento                 │
│ ───────────────────────────▾ │  Select
│ Barrio                       │  ← la etiqueta cambia: "Barrio" en
│ ───────────────────────────  │     Montevideo, "Localidad" en los otros
│  Pocitos · Punta Carretas    │  LocalityField, lista de sugerencias
│                              │
│ ☐ Rescato animales o tengo   │  casilla, una sola marca
│   un refugio                 │
│                              │
│ Guardamos tu nombre, zona y  │  --text-sm --color-ink-muted
│ foto. Tu correo no se lo     │  la frase de FR-027a
│ mostramos a nadie. Tu nombre,│
│ foto y zona van a verse en   │
│ tu perfil público.           │
│                              │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ █ Guardar                  █ │  Button tirita  ◀ EL ELEMENTO
│                              │
│ Cerrar sesión · Borrar cuenta│  ghost, chicos: la salida de FR-016b
└──────────────────────────────┘
```

**El elemento**: la `tirita` «Guardar». El avatar es grande pero está en `--color-surface`, no
compite. La frase de datos va en `--text-sm` y `--color-ink-muted`: tiene que leerse, no gritar.

Estados: **cargando** la foto ocupa su cuadrado de 96 px con `Skeleton` mientras se procesa (la
vista previa recién cuando terminó, FR-024a); **vacío** las iniciales; **error** `ErrorText` por
campo y `Toast error` si falla el guardado, conservando todo lo escrito.

### Mi perfil · `/mi-perfil`

```
┌──────────────────────────────┐
│ ┌────┐                       │
│ │ AG │  Ana García           │  .afiche --text-xl
│ └────┘  Pocitos, Montevideo  │  --color-ink-muted
│         Rescatista           │  .sello --color-primary (es confianza)
│                              │
│ ┌──────────────────────────┐ │  Card
│ │ Tu correo                │ │
│ │ ana@ejemplo.com          │ │
│ │ Solo vos lo ves.         │ │  --color-primary, --text-sm
│ └──────────────────────────┘ │
│                              │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ █ Editar mi perfil         █ │  Button tirita  ◀ EL ELEMENTO
│                              │
│ Cerrar sesión                │  ghost
│ Borrar mi cuenta             │  ghost, --color-accent
└──────────────────────────────┘
```

«Rescatista» es el único uso del sello acá y va en `--color-primary`, porque es una señal de
confianza y no un estado de proceso. «Borrar mi cuenta» es el único acento de la pantalla, y abre
un `Dialog` (confirmación irreversible, exactamente para lo que `docs/10` lo reserva).

Estados: **cargando** `Skeleton` con la forma del bloque, vía `loading.tsx`; **vacío** las
iniciales cuando no hay foto; **error** `error.tsx` con reintento.

### Editar mi perfil · `/mi-perfil/editar`

Es **la misma pantalla que «Completar perfil»**, con los campos ya cargados: el mismo
`ProfileForm`, en modo edición. Cambian tres cosas y nada más: el título dice «Editá tu perfil»,
la `tirita` dice «Guardar cambios», y aparece «Quitar foto» junto al avatar cuando hay una
(FR-024b). No se dibuja un segundo formulario: sería el mismo JSX dos veces, que es exactamente lo
que `docs/08` §Regla de dos prohíbe.

El aviso de cambios sin guardar (FR-023) vive acá y en «Completar perfil», en
`hooks/use-unsaved-changes.ts`.

**Confirmar cada guardado** (FR-022) es un `Toast success` con el mismo verbo del botón, como pide
`docs/10` §Textos: «Guardar cambios» → «Cambios guardados», «Guardar» → «Perfil guardado». El
`Toast error` es el otro lado de la misma acción, no el único.

### El enlace no sirve · `/entrar/enlace`

`EmptyState` centrado (`docs/10` permite centrar en vacíos y confirmaciones), con su frase según
cuál de los cuatro motivos fue y **una sola acción**: «Enviarme otro enlace», que funciona en un
toque porque el producto ya sabe a dónde mandarlo. **No muestra la dirección** (FR-005b).

### Cuenta borrada · `/cuenta-borrada`

```
┌──────────────────────────────┐
│                              │
│        (ilustración)         │  EmptyState, 112px
│                              │
│   Listo, no queda nada tuyo  │  el único title del EmptyState (≤30ch)
│                              │
│   █ Crear otra cuenta      █ │  la acción del EmptyState
│                              │
│      Volver al inicio        │  Button ghost, fuera del EmptyState
└──────────────────────────────┘
```

`EmptyState` recibe **un** `title` de hasta 30 caracteres y **una** acción; FR-028c pide dos
salidas. Se resuelve **componiendo**, no cambiando la primitiva: la frase que entra es «Listo, no
queda nada tuyo», la acción principal es «Crear otra cuenta», y el «Volver al inicio» es un
`Button ghost` de la página, debajo. El detalle de qué se borró ya se lo dijo el diálogo antes de
confirmar, así que no hace falta repetirlo acá.

### Componentes

**Se reutilizan de `ui/`, sin tocarlos**: `Button` (`tirita`, `secondary`, `ghost`), `Input`,
`Select`, `Card`, `Dialog`, `Toast`, `Skeleton`, `EmptyState`, `ErrorText`, `FieldShell`, `icons`.
Y `PageShell` de `app/[locale]/_components/`.

**Se crea una sola primitiva**, y entra en la tabla de `docs/10` y en `/muestra`, con sus estados,
en este mismo PR:

| Componente | Capa | Por qué | Por qué no otra cosa |
|---|---|---|---|
| `Checkbox` | ui | la marca de rescatista o refugio (FR-017b). No existe en `components/ui/` ni en la tabla de `docs/10` | sin primitiva, cada formulario dibujaría su propia casilla. Se hace sobre el `input` nativo con `appearance: none` y la caja y el tilde propios: **sin dependencia nueva**, porque una casilla es un cuadrado de 2 px de tinta y un tilde de `icons`, y Radix no aporta nada que el elemento nativo no traiga ya (foco, teclado, `:checked`, formularios) |

**Componentes de dominio nuevos** (ocho de perfil, cuatro de auth, uno de app) (`components/<dominio>/`, reciben el objeto por props, sin
fetch):

| Componente | Dominio | Qué decide |
|---|---|---|
| `EmailLinkForm` | auth | el formulario de ingreso; `"use client"` |
| `GoogleButton` | auth | se renderiza solo si el ingreso con Google está habilitado |
| `ResendLinkButton` | auth | la cuenta regresiva, que sale del navegador |
| `LinkProblemNotice` | auth | el mensaje según cuál de los cuatro motivos, con su acción |
| `ProfileForm` | profile | los cinco campos, sus errores y el estado ocupado; `"use client"` |
| `AvatarField` | profile | elegir, procesar, previsualizar y quitar la foto; `"use client"` |
| `ZoneFields` | profile | departamento + localidad, y **la etiqueta que cambia** en Montevideo |
| `LocalityField` | profile | el renglón con sugerencias. **No** se crea como primitiva de `ui/`: tiene un solo uso, y `docs/08` §Principio rector prohíbe abstraer por las dudas. Si aparece un segundo uso, se muda a `ui/` con su fila en `docs/10`. Es un combobox de verdad, así que su contrato es explícito: `role="combobox"` con `aria-expanded` y `aria-controls`, la lista en `role="listbox"`, la opción marcada con `aria-activedescendant`, flechas para moverse, Enter para elegir, Esc para cerrar sin perder lo escrito, y la cantidad de coincidencias anunciada en una región viva. Cuando no hay coincidencias la lista se cierra y lo escrito vale igual (FR-019a) |
| `Avatar` | profile | foto o iniciales; la regla de FR-024 en un solo lugar |
| `ProfileSummary` | profile | lo cargado, en modo lectura |
| `PersonalDataNotice` | profile | la frase de FR-027a, en un solo lugar |
| `DeleteAccountDialog` | profile | la confirmación y su estado ocupado; `"use client"` |
| `AccountMenu` | app | el acceso a «Mi perfil» o a «Entrar» desde cualquier pantalla (FR-015a) |

Cuatro `"use client"`, todos en la hoja: `EmailLinkForm`, `ResendLinkButton`, `ProfileForm` (con
`AvatarField` y `LocalityField` adentro) y `DeleteAccountDialog`. Las páginas y los layouts siguen
siendo Server Components.

## Project Structure

### Documentation (this feature)

```text
specs/002-registro-e-ingreso/
├── story.md                  # el cuerpo de la historia, verbatim
├── spec.md                   # el qué, endurecido
├── plan.md                   # este archivo
├── data-model.md             # las dos tablas, el bucket y sus policies
├── contracts/actions.md      # la firma de cada Server Action y de las dos rutas
├── quickstart.md             # cómo correr y ver esto en local, y qué mirar
├── checklists/requirements.md
└── tasks.md                  # lo escribe /speckit-tasks
```

### Source Code

```text
src/
  app/[locale]/(auth)/entrar/page.tsx                  Ingreso
  app/[locale]/(auth)/entrar/revisa-tu-correo/page.tsx Revisá tu correo
  app/[locale]/(auth)/entrar/enlace/page.tsx           El enlace no sirve
  app/[locale]/(auth)/completar-perfil/page.tsx        Completar perfil
  app/[locale]/(auth)/cuenta-borrada/page.tsx          Cuenta borrada
  app/[locale]/(app)/mi-perfil/page.tsx                Mi perfil
  app/[locale]/(app)/mi-perfil/{loading,error}.tsx     sus dos estados
  app/[locale]/(app)/mi-perfil/editar/page.tsx         Editar mi perfil
  app/auth/confirm/route.ts                            abre el enlace: valida y canjea
  app/auth/callback/route.ts                           vuelta de Google
  app/[locale]/_components/account-menu.tsx            FR-015a

  hooks/use-profile-draft.ts     el borrador del perfil en este navegador (FR-021)
  hooks/use-unsaved-changes.ts   el aviso antes de perder cambios (FR-023)

  components/auth/…            los cuatro de auth
  components/profile/…         los siete de perfil
  components/ui/checkbox.tsx   la primitiva nueva

  actions/auth.ts              requestLoginLink · signOut
  actions/profile.ts           saveProfile · removeAvatar · deleteAccount

  lib/auth/link-status.ts      decide vencido | usado | reemplazado | desconocido
  lib/auth/next-destination.ts valida el destino de vuelta (FR-014)
  lib/auth/request-window.ts   la ventana móvil del navegador (FR-006)
  lib/auth/link-request-policy.ts  si se manda y qué se responde, siempre igual (FR-006a)
  lib/auth/stale-accounts.ts   qué persona sin confirmar se puede borrar
  lib/auth/google.ts           si el ingreso con Google está habilitado
  lib/profile/initials.ts      las iniciales de un nombre
  lib/profile/avatar.ts        redimensiona a 256 px WebP con canvas y borra el EXIF
  lib/zones/departments.ts     los 19, con su código ISO
  lib/zones/localities.ts      las sugerencias, con su fuente y su fecha
  lib/zones/match.ts           filtra sugerencias sin acentos ni mayúsculas
  lib/schemas/profile.ts       el schema del perfil
  lib/schemas/auth.ts          el schema del correo
  lib/supabase/{server,middleware}.ts  los clientes de @supabase/ssr
  lib/supabase/service.ts              el cliente con permisos de servicio: generateLink, el tope
                                       mudo y el borrado. Nadie lo importa fuera de lib/supabase/
  lib/supabase/queries/profiles.ts     getMyProfile · upsertProfile · clearAvatarPath ·
                                       deleteProfile
  lib/supabase/queries/login-links.ts  getLoginLink · recordLoginLink · supersedeLinks ·
                                       countRecentLinks · purgeExpired
  lib/supabase/queries/avatars.ts      uploadAvatar · deleteAvatar · signAvatarUrl
  lib/env.ts                           suma RESEND_API_KEY y las credenciales de Google al mapa
                                       READERS, que hoy está cerrado en tres nombres
  lib/email/{resend,send-login-link}.ts  el envío, con su interruptor
  lib/analytics/track.ts       los siete eventos, todavía sin destino
  emails/login-link.tsx        la plantilla, con el texto desde messages/

supabase/migrations/…  profiles · login_links · el bucket y sus policies
supabase/seed.sql      las personas sembradas, que F00 dejó anotadas para esta historia
scripts/walk.mjs       gana `--user`: las capturas con sesión que pide el design-reviewer
tests/db/{profiles,login-links,avatars}.test.ts   lo que NO se ve
tests/e2e/alta.spec.ts                el flujo crítico
messages/es.json      namespaces nuevos: auth, profile, emails, y metadata.* por ruta
.env.example          las variables nuevas, con el comentario de dónde sacar cada una
supabase/config.toml  tres ediciones, ver §Decisiones 10
```

Dos archivos de F00 que esta historia tiene que terminar, porque F00 los dejó anotados a su
nombre: `supabase/seed.sql` (hoy vacío a propósito, con un comentario que dice que las personas
llegan acá) y `scripts/walk.mjs`, que todavía no sabe de sesión. Sin `--user` no hay capturas de
«Completar perfil», «Mi perfil» ni del diálogo de borrado, y el `design-reviewer` no tendría qué
mirar de la mitad de la historia.

**Structure Decision**: la de F00, sin inventar nada. Se estrenan los grupos de ruta `(auth)` y
`(app)` que `CLAUDE.md` deja marcados como pendientes, y `lib/<dominio>/`, `actions/`, `hooks/`
en su lugar previsto.

## Decisiones técnicas

### 1. El enlace: el producto manda el correo

`auth.admin.generateLink({ type: 'magiclink', email })` devuelve el `hashed_token` **sin mandar
nada** y crea la persona si no existía — verificado en la documentación, 2026-09-19. Eso resuelve
tres cosas de una:

- el texto del correo vive en `messages/es.json` (`docs/06`);
- **no hace falta saber de antemano si la dirección tiene cuenta**, que es justo lo que FR-006a
  pide no revelar;
- el enlace apunta a **nuestra** ruta, que mira primero nuestro propio registro y recién después
  canjea el token. Sin ese registro, el servicio contesta "token inválido o vencido" y los tres
  mensajes distintos de FR-005 serían imposibles.

`otp_expiry` ya vale 3600 en `supabase/config.toml`: coincide con los 60 minutos de FR-004 y no
hay que tocarlo.

### 2. Los dos topes, separados a propósito

El de FR-006 punto 1 (1/60 s, 5/hora, **el único que se le muestra**) vive en una cookie del
navegador y lo decide `lib/auth/request-window.ts`, una función pura con test. El de FR-006 punto
2 (10/hora por dirección, **mudo**) vive en `login_links` y se consulta en la Server Action; al
pasarse, la acción devuelve exactamente el mismo `ok` que siempre y no manda el correo.

### 3. Google: la plataforma ayuda, pero el chequeo es nuestro y es preciso

Supabase **no vincula** una identidad de OAuth a un usuario cuyo correo no esté confirmado,
justamente para evitar la toma de cuenta previa. Eso cubre la mitad del riesgo, pero no alcanza
para FR-009a: `email_confirmed_at` es del **usuario** y pudo haberlo puesto nuestro propio enlace
semanas antes. Lo que hay que comprobar es que **Google**, en este ingreso, diga que esa dirección
es de quien entró.

El dato correcto es `email_verified` dentro de `identity_data` de la identidad de proveedor
`google`, que se lee del lado del servidor con permisos de servicio. Es confiable porque lo
escribe el servicio al recibir los claims del proveedor y **la persona no lo puede editar**, a
diferencia de `user_metadata`, que sí es editable por su dueña y por eso no sirve para decidir
nada de autorización.

La decisión se extrae a `lib/auth/google.ts` como **función pura** —recibe las identidades y
devuelve si esta vuelta está verificada— para que tenga test: hoy el camino de Google no tenía
ninguno, y es el que abre la puerta a una cuenta ajena. Si no está verificada, se cierra la sesión
en el acto y se va a `/entrar` con el mensaje de FR-009a.

### 4. La foto, privada

Bucket `avatars`, **no público**, con policies que solo dejan a cada quien escribir y leer bajo
`<su id>/`. Las pantallas la muestran con una URL firmada de vida corta que arma el servidor. Es
lo que hace verdadero a FR-026c, y es lo que el test de `tests/db/avatars.test.ts` intenta violar.

### 5. Borrar: nunca se confirma a medias, y el reintento termina el trabajo

Son cinco operaciones sobre tres sistemas distintos —sesiones, Storage, dos tablas y el servicio
de autenticación— y **no hay transacción que las abarque**. Una promesa literal de "o se borra
todo o no se borra nada" sería mentira: si falla el tercer paso, los dos primeros ya ocurrieron.
Lo que sí se puede garantizar, y es lo que protege a la persona, son estas tres cosas:

1. **Nunca se confirma con datos presentes.** El «listo» aparece solo cuando terminó el último
   paso.
2. **El orden es de menos a más irreversible**, para que un fallo temprano no deje nada raro:
   cerrar las sesiones → borrar el archivo → borrar las filas de `login_links` → borrar la persona
   del servicio de autenticación, que **arrastra la fila de perfil por `on delete cascade`**.
3. **Es idempotente**: cada paso tolera que ya esté hecho, así que reintentar retoma donde quedó y
   siempre converge a "no queda nada".

Cerrar las sesiones va primero porque borrar la persona no invalida por sí solo los tokens ya
emitidos. La spec se ajustó en FR-028a para pedir esta garantía, que es la alcanzable y la que
importa, en lugar de una atomicidad que ningún código podría cumplir.

### 6. El proxy no puede comerse las rutas del enlace

`src/proxy.ts` tiene hoy `matcher: '/((?!api|_next|_vercel|.*\..*).*)'`, y `localePrefix` es
`'as-needed'`: tal cual está, next-intl reescribiría `/auth/confirm` a `/es/auth/confirm`, que no
existe. **El enlace del correo daría 404 y la vuelta de Google también.** Esta historia agrega
`auth` a la exclusión del matcher y, en el mismo archivo, compone el refresco de la sesión de
`@supabase/ssr` con el de next-intl. Que las dos rutas respondan fuera del segmento de idioma se
prueba en `tests/e2e/alta.spec.ts`, que abre el enlace de verdad; sin eso, el bug vuelve en
silencio la próxima vez que alguien toque el matcher.

### 7. Los 30 días de sesión los sostenemos nosotros

`inactivity_timeout` de `[auth.sessions]` **es de plan Pro** (verificado en la documentación,
2026-09-19), y en el gratuito la sesión no vence nunca. Dejarlo así incumpliría FR-012 en
silencio, que es peor que no tenerlo.

Se resuelve donde el problema realmente vive: la cookie de sesión se emite con 30 días de vida y
se renueva en cada visita, así que un navegador que no vuelve en 30 días se queda sin sesión. Eso
es exactamente "30 días desde el último uso" para el caso que a la historia le importa, el
teléfono prestado. Es más débil que un corte del lado del servidor —el token de refresco seguiría
siendo válido para quien lo extrajera del disco—, así que **se anota en
`docs/known-limitations.md` como KL-005**, con su condición de cierre: cuando el proyecto esté en
Pro, se enciende `inactivity_timeout = "720h"` y esta plomería se saca.

### 8. Las personas que nunca abrieron el enlace no se quedan para siempre

`generateLink` crea la persona aunque nadie abra el correo: escribir una dirección cualquiera
dejaría un registro permanente en el servicio de autenticación, mientras `login_links` se limpia a
los 7 días. Eso contradice FR-030a y el principio V. La misma limpieza que borra los pedidos
viejos **borra también las personas sin confirmar de más de 7 días**, que son exactamente las que
nunca abrieron su enlace. Una persona que sí entró queda confirmada y no la toca nadie.

### 9. Dónde se decide quién pasa, y por qué no en el proxy

La compuerta no es una sola: **cada grupo de ruta tiene la suya**, en su layout, que es un Server
Component. No va en el proxy, que corre en cada pedido y pondría una ida a la base delante de cada
imagen y cada navegación.

| Grupo | Qué decide su layout |
|---|---|
| `(app)` — `/mi-perfil`, `/mi-perfil/editar` | Sin sesión → `/entrar` con el destino (FR-013). Con sesión y perfil incompleto → `/completar-perfil` (FR-016). |
| `(auth)` — `/completar-perfil` | **Exige sesión igual**: edita datos personales. Sin sesión → `/entrar`. Con el perfil ya completo → `/mi-perfil`, porque no hay nada que completar. |
| `(auth)` — `/entrar`, `/entrar/revisa-tu-correo` | **Con** sesión → adentro: a `/completar-perfil` si falta el perfil, si no a `/mi-perfil`. Es el caso borde «persona con sesión que abre la pantalla de ingreso» (FR-007c). |
| `(auth)` — `/entrar/enlace`, `/cuenta-borrada` | Sin compuerta: la primera se abre justamente cuando el ingreso no funcionó, y la segunda es el final del camino, ya sin sesión. |

Las dos excepciones de FR-016b son acciones, no pantallas: cerrar sesión y borrar la cuenta se
llaman desde `/completar-perfil` sin pasar por ninguna pantalla de `(app)`, así que ninguna
compuerta las toca.

**`AccountMenu` va en los tres grupos, incluido `(public)`.** FR-015a dice "desde cualquier
pantalla", y el caso que nombra —quien vuelve al día siguiente con la sesión viva y aterriza en el
sitio público— es exactamente la portada: dejarla con un «Entrar» fijo sería construir el bug que
el requisito describe. El costo es que el layout público lee la sesión y la portada deja de
prerenderizarse entera. Se asume y **se mide**: la portada es un título y un párrafo, y SC-009
pide que la pantalla de ingreso responda en 2,5 s, cosa que `pnpm lighthouse` verifica en CI. Si
la medición doliera, la salida es dejar estático el resto de la página y **solo** el hueco del
menú dinámico, que es para lo que existe el render parcial de Next 16; no es dejar la portada
mintiendo sobre si hay sesión.

### 10. Las tres ediciones de `supabase/config.toml`

1. `[auth.external.google]`, que hoy no existe (solo está `apple`, deshabilitado), con sus
   credenciales leídas del entorno. Sin ellas cargadas, el ingreso con Google no está habilitado y
   la opción no se muestra (FR-011).
2. `additional_redirect_urls`, que hoy solo tiene `https://127.0.0.1:3000`, para que acepte
   `/auth/callback`.
3. `[auth.rate_limit] email_sent`, que vale 2 por hora. **No afecta a esta historia**, porque
   `generateLink` no manda correo y el nuestro sale por Resend, pero queda en un valor que no
   contradiga los topes de FR-006 para que nadie lo lea como si fuera la regla del producto. La
   regla del producto vive en `lib/auth/link-request-policy.ts`, con test.

### 11. La dirección no viaja por la URL

`/entrar/revisa-tu-correo` necesita mostrar a qué dirección se mandó. **No va como parámetro**: en
la URL queda en el historial, en los registros del servidor y en el `Referer` de cualquier cosa
que la pantalla cargue. `requestLoginLink` deja una cookie de sesión, `httpOnly` y de vida corta,
que la pantalla lee del lado del servidor y borra al usarse.

La misma idea resuelve FR-005b: pedir otro enlace desde «El enlace no sirve» es la acción
`resendLinkFor(linkId)`, que **resuelve la dirección del lado del servidor** a partir del id del
enlace. El cliente nunca conoce el correo, y por eso la pantalla no puede revelarlo.

### 12. Las localidades viajan enteras, y por eso no tienen estado de carga

FR-019a prohíbe una espera y un error en las sugerencias, así que no puede haber carga por
departamento. Los 19 departamentos con sus localidades y los barrios de Montevideo son unas 520
cadenas: alrededor de 8 KB en crudo y unos 3 KB comprimidos. Entran en el bundle de la pantalla de
perfil y se miden contra los 150 KB antes de cerrar la historia. Si la medición no diera, la
salida **no** es cargarlas aparte —volvería el estado de carga que FR-019a prohíbe— sino recortar
la lista, que es una ayuda y no una restricción.

### 13. Los siete eventos: dónde se disparan y cómo se encadenan

FR-032 nombra siete momentos y FR-030c prohíbe que lleven identificador de persona, pero pide
poder encadenarlos para ver en qué escalón se pierde la gente. Los dos se cumplen con una **marca
de visita**: un valor al azar que nace al abrir el sitio, viaja en una cookie de sesión de
navegador —muere al cerrarlo—, y nunca se guarda junto a la cuenta.

| Evento | Dónde se dispara |
|---|---|
| Creación de cuenta empezada | `/auth/confirm`, al canjear un enlace de una dirección sin cuenta; y `/auth/callback`, al volver de Google con una dirección verificada sin cuenta |
| Creación de cuenta terminada | `saveProfile`, cuando la cuenta pasa a tener perfil completo por primera vez |
| Ingreso por enlace | `/auth/confirm`, cuando la cuenta ya existía |
| Ingreso por Google | `/auth/callback`, cuando la cuenta ya existía |
| Perfil editado | `saveProfile`, sobre un perfil que ya estaba completo |
| Sesión cerrada | `signOut` |
| Cuenta borrada | `deleteAccount`, al terminar el último paso |

Los siete ocurren del lado del servidor, así que `lib/analytics/track.ts` lee la marca de la
cookie y la adjunta. Hoy la función deja los eventos en el registro del servidor y nada más; el
día que exista la herramienta (M5) se cambia esa función y ningún punto de disparo se toca.
FR-032a se observa recorriendo el flujo: la prueba de punta a punta pasa por cuatro de los siete
—empezada, terminada, ingreso por enlace y sesión cerrada— y los afirma.

### 14. Los textos de las cuatro hojas cliente bajan por props

`app/[locale]/layout.tsx` deja fuera `NextIntlClientProvider` **a propósito**, para no mandar
todos los mensajes al navegador sin consumidor. Esta historia estrena cuatro hojas cliente que sí
muestran texto —errores de zod y las claves de `ActionResult`—, y sigue el patrón que F00 ya usa
en la única hoja cliente de `/muestra`: **la página traduce del lado del servidor y baja un objeto
de textos por props**. No entra un provider: sumaría al bundle inicial los mensajes de todos los
namespaces para ahorrar unas líneas de props.

Cada componente recibe un solo objeto `texts` con lo suyo, tipado, así que una clave que no existe
falla en `pnpm typecheck` por la compuerta de claves tipadas que F00 ya dejó puesta.

### 15. Encontrable desde el primer commit

`docs/08` §Encontrable no es una etapa final. Las siete rutas exportan `metadata` con sus textos
en `messages/es.json` —lo exige la regla propia `adopciones/require-route-metadata`, que ya está
en el lint—, y **las siete llevan `robots: { index: false }`**: seis están detrás de sesión o son
pasos de un trámite, y `/entrar` no tiene nada que indexar y sí un formulario que no queremos en
ningún índice. Los textos van en `messages/es.json` bajo `metadata.*`, con una entrada por ruta,
como ya hacen las dos rutas de F00. Ninguna lleva canónica, porque ninguna se indexa. Además nada
se indexa hasta que exista el dominio (`docs/04`).

## Qué se testea, y por qué

Contra `docs/09` §Qué vale la pena testear. Lo que no está acá, no se testea.

| Archivo | Por qué vale la pena | Categoría de docs/09 |
|---|---|---|
| `lib/schemas/profile.ts` | cada regla de FR-020a y FR-020b con su caso que pasa y su caso que no; la detección de vía de contacto es literal y tiene bordes ("Ruta 8 km 25" pasa, nueve dígitos no) | 2 |
| `lib/schemas/auth.ts` | el formato del correo decide si se manda algo o no | 2 |
| `lib/auth/link-status.ts` | decide cuál de los cuatro mensajes ve la persona, con precedencia (FR-005a) y con el plazo de FR-030a | 1 |
| `lib/auth/next-destination.ts` | si se equivoca, es un redirect abierto: manda a la persona fuera del sitio desde un enlace que le llegó por correo | 1 |
| `lib/auth/request-window.ts` | la ventana móvil tiene bordes de tiempo y la cuenta regresiva que se muestra sale de acá | 3 |
| `lib/auth/link-request-policy.ts` | decide, en una función pura, si se manda el correo y **qué se responde**: la respuesta tiene que ser idéntica exista o no la cuenta y se haya pasado o no el tope mudo (FR-006 punto 2, FR-006a). Si esto se rompe, el producto delata quién tiene cuenta | 1 |
| `lib/zones/match.ts` | acentos y mayúsculas: "cordon" tiene que encontrar "Cordón" | 3 |
| `lib/auth/google.ts` | decide si Google verificó esa dirección **en este ingreso**; si se equivoca, se entra a la cuenta de otra persona (FR-009a) | 1 |
| `lib/auth/stale-accounts.ts` | el predicado de la limpieza: **qué persona se puede borrar**. Corre con permisos de servicio en el camino anónimo de pedir un enlace, así que un error acá borra cuentas de gente real. Función pura, más un test en `tests/db/` que afirma que una persona confirmada, y una sin confirmar de menos de 7 días, sobreviven a la limpieza | 1 |
| `lib/profile/initials.ts` | un nombre de una palabra, con tilde, con espacios de más | 3 |
| `lib/profile/avatar.ts` | el procesado: 256 px, WebP, **sin EXIF** y con la orientación respetada (canvas la pierde si no se pide `imageOrientation: 'from-image'`). Borrar el GPS al subir lo manda `docs/08` §Encontrable, y una foto rotada es un defecto visible | 3 |
| `components/profile/avatar.tsx` | su conducta cambia con el dominio: foto o iniciales | 4 |
| `components/auth/link-problem-notice.tsx` | cuatro motivos, cuatro mensajes y cuatro acciones | 4 |
| `tests/db/profiles.test.ts` | **lo que no se ve**: sin sesión y con sesión ajena, leer perfil y correo de otra persona falla | 1 (RLS) |
| `tests/db/login-links.test.ts` | nadie, ni siquiera su dueña, lee la tabla de pedidos desde el cliente; y la limpieza no toca a quien no debe | 1 (RLS) |
| `tests/db/avatars.test.ts` | la foto de otra persona no se abre sin firma ni con sesión ajena | 1 (RLS) |
| `tests/e2e/alta.spec.ts` | el flujo crítico: pedir enlace → **leer el enlace de `.artifacts/mail/`** → abrirlo → completar perfil → verlo. De paso demuestra que `/auth/confirm` responde fuera del segmento de idioma, que es el bug que el matcher del proxy causaría | 5 |

Los dos hooks nuevos (`use-profile-draft`, `use-unsaved-changes`) **no se testean**: `docs/09`
excluye los hooks de UI, y lo que realmente importa de ellos —que lo escrito vuelva— lo demuestra
el flujo de punta a punta.

**No se testea**, y es una decisión, no un olvido: las siete `page.tsx`, `Checkbox` y el resto de
`ui/`, las queries finas de `lib/supabase/queries/` (las cubre el test de RLS), `ProfileSummary` y
`PersonalDataNotice` (solo pintan), la plantilla del correo, y las Server Actions que solo llaman
a una query y revalidan.

Stryker corre sobre los archivos de la tabla que tienen test al lado. Score 100 %, con las
excepciones anotadas en su línea si aparecen.

## Riesgos

| Riesgo | Qué hacemos |
|---|---|
| Resend sin dominio verificado no puede mandar a cualquier dirección | envío real por variable; sin ella el mensaje se escribe en `.artifacts/mail/` y el e2e lo lee de ahí. Aceptado como **KL-006** |
| La sesión no vence del lado del servidor en el plan gratuito | la cookie de 30 días renovada en cada visita. Aceptado como **KL-005** |
| HEIC no se puede procesar en el cliente fuera de Safari | sale de los tipos aceptados; iOS ya convierte a JPEG al subir. Aceptado como **KL-007** |
| `pnpm lighthouse` no termina en Windows (KL-001) | esa etapa se verifica en CI, como ya está aceptado |
| La lista de localidades es larga y viaja al cliente | ~3 KB comprimidos, enteros, porque FR-019a prohíbe el estado de carga; se mide contra los 150 KB antes de cerrar (ver §Decisiones 12) |
| `Checkbox` es la primera primitiva nueva desde F00 | entra en la tabla de `docs/10` en este PR y se suma a `/muestra` con sus estados, como las otras once. Sin dependencia nueva |
