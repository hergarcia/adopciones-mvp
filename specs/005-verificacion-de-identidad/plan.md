# Implementation Plan: Verificación de identidad con revisión manual

**Branch**: `feature/11-verificacion-identidad-revision-manual` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/005-verificacion-de-identidad/spec.md` (4 user stories, endurecida en dos rondas;
lo que quedó abierto está en sus Assumptions)

## Summary

Una persona en nivel 1 pide pasar a nivel 2: acepta el consentimiento, sube el frente de su cédula
y una selfie sosteniéndola, y su pedido queda en revisión. Quien administra lo resuelve desde una
cola; las imágenes se borran en el mismo paso, la persona recibe un correo y, si se aprobó, su
perfil dice «Nivel 2». Un pedido sin resolver vence a los 7 días y sus imágenes se borran solas.

Cuatro decisiones ordenan el plan:

1. **Las imágenes viven en la base, no en Storage.** Cada pedido guarda sus dos fotos como `bytea`
   en una tabla hija con `on delete cascade`. Con eso, enviar es una sola transacción (el pedido
   con sus dos imágenes o nada, FR-008, sin huérfanos que limpiar), resolver y retirar borran las
   imágenes en la misma transacción que cambia el estado (FR-012, FR-018), y el vencimiento puede
   borrarlas desde SQL puro (FR-028): Storage no deja borrar objetos desde SQL, así que un borrado
   programado dependería de que la aplicación esté levantada. Las fotos llegan ya procesadas en el
   navegador (WebP de 1600 px como mucho, menos de 450 KB): son pocas, viven 7 días como máximo y
   no pesan en los 500 MB del plan gratuito.
2. **Toda escritura pasa por funciones de Postgres con candado; toda lectura, por RLS.** Es el
   patrón de la historia #10: `submit_identity_request`, `withdraw_identity_request`,
   `resolve_identity_request` y `expire_identity_requests` se llaman con la clave de servicio,
   después de sacar el id de la sesión, y cada una vuelve a comprobar sus reglas adentro de la
   transacción (tope, un pedido abierto, quién administra, no resolver el propio, no resolver uno
   vencido). Las lecturas —el estado propio, la cola, las imágenes— van con la sesión de la
   persona, y las policies deciden quién ve qué: así cada regla de visibilidad de la spec se prueba
   con un intento fallido en `tests/db/`.
3. **Quien administra es una fila en `admins`, que el equipo escribe por fuera del sitio.** No es
   un claim del token: un claim tarda hasta una hora en caducar, y FR-022b pide que quien deja de
   administrar pierda el acceso en ese momento. Nadie tiene permiso de escribir esa tabla desde el
   cliente (FR-013a, FR-033).
4. **El vencimiento lo hace la base sola, cada 5 minutos, con `pg_cron`.** La función marca los
   vencidos, borra sus imágenes y anota el aviso pendiente; `pg_net` llama después a una ruta de la
   aplicación que manda los correos de vencimiento. Lo que protege la privacidad (el borrado) no
   depende de que la aplicación esté levantada; el correo sí, y sale en la vuelta siguiente en que
   lo esté. Mientras tanto, la cola y la persona ya ven el pedido como vencido a la hora exacta,
   porque cada lectura compara con `expires_at` (FR-028).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (`strict`), React 19.3, Next.js 16.3.5 (App Router)

**Primary Dependencies**: las de `main`, más dos extensiones de Postgres que ya trae la imagen de
Supabase, local y en la nube: **`pg_cron`** (tareas programadas dentro de la base) y **`pg_net`**
(la llamada HTTP a la ruta de los correos de vencimiento). Ningún paquete npm nuevo: el procesado de
las fotos es canvas, como el de la foto de perfil. La decisión va a `docs/07-stack.md` §Decisiones
en este PR (ver §Documentación).

**Storage**: Postgres de Supabase (local). Una migración con siete tablas nuevas, una policy nueva
sobre `profiles`, cuatro funciones de escritura, un esquema `private` con el helper de quien
administra, y dos tareas de `pg_cron`. Detalle en [data-model.md](./data-model.md).

**Testing**: Vitest (unidad + base local), Playwright (un flujo), Stryker al 100 % sobre lo que
tenga test.

**Target Platform**: web, mobile-first a 390 px; la cola de revisión, además, a 1280 (es donde
trabaja quien administra).

**Project Type**: aplicación web Next.js, estructura fijada por F00.

**Performance Goals**: los del presupuesto: LCP < 2,5 s, JS inicial < 150 KB, Lighthouse mobile ≥ 90.
Hojas de cliente nuevas: `IdentityRequestForm` (consentimiento y fotos; el procesado es canvas,
sin librería), `WithdrawRequestDialog`, `ReviewDecision` y `ReviewWatcher` (un temporizador). La
pantalla de pedir se mide en el e2e (SC-010), como las de verificar (KL-018).

**Constraints**: sin dominio: los correos salen de verdad solo a la dirección de la cuenta de Resend
(KL-006); en local y en CI se escriben en `.artifacts/mail/`. Las Server Actions aceptan 1 MB por
pedido por defecto: las dos fotos procesadas entran con margen (plan §3), sin tocar la
configuración de Next. `pg_cron` corre mientras corre la base; `pg_net` necesita la aplicación
levantada para que el correo de vencimiento salga (§Riesgos).

**Scale/Scope**: una pantalla nueva para la persona con dos vistas (pedir y estado), dos para quien
administra (la cola y un pedido), una sección nueva en «Mi perfil», tres correos, una ruta que
sirve imágenes y una ruta para la tarea programada.

## Constitution Check

| Principio | Cómo lo cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra tablas ni rutas; todo el cómo está acá. |
| II. Una feature, un PR | Cuatro user stories, una corrida. US1 se prueba sola (pedido en revisión); US2 sobre US1; US3 y US4 sobre las dos. |
| III. Compuertas verdes | §Qué se testea: funciones puras, schemas y RLS con Stryker al 100 %; un flujo e2e. |
| IV. Reglas como código | Cada regla de visibilidad y de escritura es un test en `tests/db/identity.test.ts` que intenta lo prohibido. El tope, el pedido único y el no resolver el propio viven en funciones de la base, con candado. |
| V. Datos mínimos y privados | Ningún dato de la cédula en columnas ni en eventos; las imágenes sin metadatos (canvas); borradas en la misma transacción que cierra el pedido; lo que queda es lo de FR-031 y nada más. Borrar la cuenta arrastra todo por `on delete cascade`. |
| VI. Sin deriva | Nada de "Fuera del MVP": la revisión es a mano (no KYC con proveedor), los avisos son por correo (no push). El panel de administración consolidado queda afuera (spec §Assumptions). |
| VII. Liviana y linda | Server Components salvo cuatro hojas chicas. Sin token nuevo (§Diseño). |
| VIII. Autonomía con veto | La retención la decidió Hernán (#37); lo que la spec tomó por su cuenta está marcado «a validar por Hernán». `pg_cron`/`pg_net` no son un cambio transversal de stack (no tocan framework, CSS, componentes ni auth): van a `docs/07` como decisión. |

Sin violaciones. Re-evaluado después del diseño: igual.

## Diseño

Cargado `frontend-design:frontend-design`, leído `docs/10-design-system.md`. Todo sale de la tabla
de componentes y de los tokens existentes.

### Tokens, sin ninguno nuevo

- Color: `--color-ink` (texto y la acción), `--color-ink-muted` (bajadas, fechas), `--color-line`
  (divisores), `--color-surface` (el fondo del texto del consentimiento y de los huecos de las
  fotos), `--color-primary` y `--color-primary-soft` (solo lo verificado: el sello «Nivel 2», el
  «Aprobado»), `--color-warning` (el sello «En revisión»: le toca actuar a alguien), `--color-accent`
  (texto de error; el único acento de cada pantalla).
- Tipo: `.afiche` en los `h1` y las tiritas; `--text-base` de lectura; `--text-sm` para ayudas y
  fechas; `tabular-nums` en fechas y horas.
- Espacio: pasos de 4 px; `PageShell reading` en las pantallas de la persona; `PageShell full` en
  la cola desde 1024.
- Recursos del cartel: `.sello` para cada estado del pedido; `.cinta` en el ejemplo de la selfie
  (es algo pegado, sin texto adentro); la tirita, una por pantalla.

### Pedir verificación de identidad · `/verificar-identidad` (sin pedido abierto)

Dos pasos en la misma pantalla, sin navegar: el consentimiento y, aceptado, las fotos. El
consentimiento no desaparece al aceptar: se pliega a una línea («Aceptaste cómo usamos tus
imágenes») con «Leer de nuevo», para que las fotos queden a la vista sin perderlo.

```
Paso 1 (390 px)                          Paso 2 (390 px)
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ [logo]              Mi perfil│         │ [logo]              Mi perfil│
│                              │         │                              │
│ Verificá tu identidad        │ h1      │ Verificá tu identidad        │
│ Con tu cédula pasás a nivel  │         │ ✓ Aceptaste cómo usamos tus  │
│ 2: quien da un animal sabe   │         │   imágenes. Leer de nuevo    │ ghost
│ que sos una persona real.    │         │                              │
│                              │         │ Frente de tu cédula          │
│ Qué te pedimos               │         │ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │ hueco punteado
│ Dos fotos: el frente de tu   │         │ ╎  Sacar foto  Elegir foto  ╎ │ secondary ×2
│ cédula y una selfie con la   │         │ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │
│ cédula al lado de la cara.   │         │ Con buena luz, sin reflejos, │ text-sm muted
│                              │         │ la cédula entera.            │
│ Qué hacemos con ellas        │         │                              │
│ ┌──────────────────────────┐ │         │ Selfie con tu cédula         │
│ │ Las ve solo quien revisa │ │ surface │   ┌────────┐ (ejemplo con    │
│ │ …se borran al resolver…  │ │         │   │ ☺ ▭    │  cinta, SVG)    │
│ │ …queda "verificada el…"  │ │         │   └────────┘                 │
│ │ …podés retirarlo…        │ │         │ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │
│ └──────────────────────────┘ │         │ ╎  Sacar foto  Elegir foto  ╎ │
│                              │         │ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │         │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ [ Acepto y elijo las fotos ] │ tirita  │ [ Enviar mi pedido         ] │ tirita (deshab.
│ Ahora no                     │ ghost   │ Ahora no                     │  sin las dos)
└──────────────────────────────┘         └──────────────────────────────┘
```

- Con una foto elegida, su hueco pasa a la vista previa (sin inclinación, sin cinta: es un
  documento, no algo pegado) con «Cambiar foto» en `ghost` debajo.
- **Lo que llama la atención**: la tirita del paso («Acepto y elijo las fotos», después «Enviar mi
  pedido»). No dice «Aceptar» a secas (docs/10 §Textos): nombra lo que pasa después.
  El ejemplo de la selfie es el único recurso del cartel, y es informativo.
- Tres estados: *procesando* una foto → su hueco es un `Skeleton` del mismo tamaño y la tirita
  queda deshabilitada; *enviando* → la tirita con `loading`; *error* → `ErrorText` bajo el hueco
  de esa foto (tipo, tamaño, no se pudo procesar) o arriba de la tirita (el envío falló: "No se
  envió y no guardamos nada. Probá de nuevo."). La pantalla no trae datos más que el estado
  (Server Component): su «cargando» es el `loading.tsx` con la forma del paso 1.
- Sin teléfono verificado la pantalla no se dibuja: redirige al aviso de «Verificar teléfono» con
  `para=identidad` (plan §6).

### Estado de mi pedido · `/verificar-identidad` (con pedido, identidad verificada o tope)

```
En revisión (390 px)                     Rechazado (390 px)
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ Tu pedido está en revisión   │ h1      │ No pudimos verificar tu      │ h1
│ ┌──────────┐                 │         │ identidad                    │
│ │En revisión│ sello warning  │         │ ┌─────────┐                  │
│ └──────────┘                 │         │ │Rechazado│ sello ink-muted  │
│ Lo mandaste el 26 de sept.   │         │ └─────────┘                  │
│ La revisión suele tardar     │         │ Motivo: la foto no se lee.   │
│ hasta 2 días. Te avisamos    │         │ Sacala con buena luz, sin    │
│ por correo.                  │         │ reflejos y con la cédula     │
│ Si nadie lo revisa, vence el │         │ entera.                      │
│ 3 de octubre a las 14:32.    │         │ Ya borramos tus imágenes.    │
│                              │         │ Te quedan 2 intentos en los  │
│ Retirar mi pedido            │ ghost-  │ próximos 30 días.            │
│                              │ danger  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ Volver a mi perfil           │ ghost   │ [ Intentar de nuevo        ] │ tirita
└──────────────────────────────┘         └──────────────────────────────┘
```

- **Aprobado**: sello «Nivel 2» en `--color-primary`, "Tu identidad está verificada desde el …",
  "Ya borramos tus imágenes", y «Volver a mi perfil» como `LinkButton secondary` (no hay próximo
  paso que empujar). Sin teléfono verificado: "Vas a estar en nivel 2 cuando confirmes tu teléfono"
  y la tirita «Verificar mi teléfono».
- **Vencido**: sello «Vencido» en `--color-ink-muted`, qué pasó, que no cuenta, y la tirita
  «Pedirlo de nuevo».
- **Sin intentos**: sello «Sin intentos» en `--color-ink-muted`, "Vas a poder pedirlo de nuevo el
  …", y el correo de ayuda como enlace `mailto:`. Sin tirita: no hay acción posible.
- **Retirar**: abre un `Dialog` (es irreversible: las imágenes se borran) con «Retirar mi pedido»
  (`danger`) y «Seguir esperando». Al terminar, la misma ruta con `?guardado=retirado`: la vista de
  pedir y un `SavedToast` "Retiraste tu pedido y borramos tus imágenes".
- **Lo que llama la atención**: el sello del estado, y la tirita cuando hay algo que hacer.
- Tres estados: *cargando* → `loading.tsx` con la forma del sello y tres renglones; *vacío* → es la
  vista de pedir (arriba); *error* → `error.tsx` de la ruta con `ErrorScreen` (no se pudo traer el
  estado, reintentar). Retirar que falla → `ErrorText` dentro del diálogo, que queda abierto.

### Mi perfil · la sección del nivel

Debajo de `PhoneStatusCard`, una `Card` con la etiqueta «Tu identidad» (como «Tu teléfono»):

```
Nivel 1, sin pedido                      Nivel 2
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ Tu identidad                 │ sm muted│ Tu identidad                 │
│ Con tu cédula pasás a nivel  │         │ ┌───────┐                    │
│ 2: quien da un animal sabe   │         │ │Nivel 2│ sello primary      │
│ que sos una persona real.    │         │ └───────┘                    │
│ [ Verificar mi identidad   ] │ second. │ Identidad verificada el 26   │
└──────────────────────────────┘         │ de septiembre.               │
                                         └──────────────────────────────┘
```

- Con un pedido (en revisión, rechazado, vencido, sin intentos): el sello del estado y «Ver mi
  pedido» en `ghost`. Sin teléfono: una línea en `--color-ink-muted` ("Primero verificá tu
  teléfono") sin acción, y si la identidad ya está verificada, "Al confirmar tu teléfono volvés a
  nivel 2".
- En nivel 2, `PhoneNumberCard` deja de decir "Nivel 1 desde…": el nivel se dice una sola vez
  (FR-024). Lo decide `verificationLevel` (plan §5) y la tarjeta recibe el texto ya elegido.
- Para quien administra, debajo, `ReviewQueueLink`: «Revisar pedidos de identidad (3)» en `ghost`.
- Todo en `secondary` o `ghost`: la tirita de «Mi perfil» sigue siendo «Editar mi perfil».
- Tres estados: los de «Mi perfil» (su `loading.tsx` suma un `Skeleton` con la forma de la card).

### Cola de revisión · `/revision` y `/revision/[id]`

```
Lista (1280 px, PageShell full)                   Un pedido (390 px)
┌─────────────────────────────────────────────┐   ┌──────────────────────────────┐
│ Pedidos de identidad                  h1    │   │ Ana Pérez                  h1│
│ 3 esperando                                 │   │ Malvín, Montevideo           │
│ ─────────────────────────────────────────── │   │ Tiene cuenta desde el 19/9   │
│ Ana Pérez     espera desde el 24/9  vence   │   │ Sin rechazos en 30 días      │
│               el 1/10 a las 10:05   [Ver]   │   │ ──────────────────────────── │
│ ─────────────────────────────────────────── │   │ Frente de la cédula          │
│ Lucía Gómez   espera desde el 25/9  …       │   │ ┌──────────────────────────┐ │
│ ─────────────────────────────────────────── │   │ │        imagen            │ │
│ Marta Díaz    Es tu pedido: lo revisa otra  │   │ └──────────────────────────┘ │
│               persona                       │   │ Selfie con la cédula         │
└─────────────────────────────────────────────┘   │ ┌──────────────────────────┐ │
                                                  │ │        imagen            │ │
                                                  │ └──────────────────────────┘ │
                                                  │ Aprobá solo si la cédula se  │
                                                  │ lee, está vigente y la cara  │
                                                  │ es la de la cédula.          │
                                                  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
                                                  │ [ Aprobar                  ] │ tirita
                                                  │ Rechazar…                    │ secondary
                                                  └──────────────────────────────┘
```

- La lista es texto con divisores de `--color-line`, sin imágenes y sin cards (no son notas
  pegadas; es una lista de trabajo). Cada fila es un enlace a su pedido; la propia no lo es.
- Desde 1024 el pedido se ordena en dos columnas: las dos imágenes a la izquierda (lo que se mira),
  los datos, la regla y las acciones a la derecha (lo que se decide), para no hacer scroll entre la
  foto y el botón.
- «Rechazar…» abre un `Sheet` («Rechazar el pedido de Ana») con los cuatro motivos como cuatro
  `Button secondary` a lo ancho, cada uno con su nombre («No se lee», «No coincide», «Cédula
  vencida», «Sospecha de fraude»): tocar uno rechaza con ese motivo. El `Sheet` es el paso de
  confirmación; así no hace falta un control de opción que `ui/` no tiene. Sin texto libre (FR-016).
  Mientras se rechaza, el botón tocado queda `loading` y los otros tres deshabilitados.
- Las imágenes se piden a `/api/revision/[id]/[kind]` (plan §4), con `alt` "Frente de la cédula de
  Ana Pérez" y "Selfie de Ana Pérez con su cédula".
- **Lo que llama la atención**: «Aprobar», la tirita. Las imágenes mandan por tamaño, sin recursos.
- `ReviewWatcher` pregunta cada 10 s si el pedido sigue abierto (FR-021). Si no, reemplaza la
  pantalla por un `EmptyState` sin ilustración nueva: qué pasó (resuelto, vencido, ya no está) y
  «Volver a la lista». Las imágenes se desmontan en ese momento.
- Tres estados: *cargando* → `loading.tsx` con la forma de las filas o del pedido; las imágenes con
  un `Skeleton` 4:3 hasta que cargan; *vacío* → `EmptyState` "No hay pedidos esperando"; *error* →
  `ErrorScreen` al traer; una imagen que no carga → `ErrorText` en su lugar con «Cargar de nuevo»,
  y «Aprobar» deshabilitado hasta tener las dos (plan §4); resolver que falla → `ErrorText` arriba
  de la tirita.
- Quien no administra: `notFound()`, la misma pantalla que una ruta que no existe (FR-013).

### Los correos

Los tres usan la plantilla genérica de avisos (`renderNoticeEmail`: título, cuerpo, botón, pie),
como el de número perdido (KL-031 sigue valiendo para todos: la plantilla propia del producto es de
otra historia).

### Componentes

| Componente | Capa | Nuevo / reusa | Notas |
|---|---|---|---|
| `IdentityRequestForm` | verification (cliente) | nuevo | Los dos pasos; recibe los textos traducidos. |
| `IdentityConsent` | verification | nuevo | El texto del consentimiento, plegable. Server-safe; el plegado es un `details`. |
| `IdentityPhotoField` | verification (cliente) | nuevo | Sacar / elegir / procesar / vista previa / cambiar. Reusa el patrón de `AvatarField`, sin recorte cuadrado. |
| `SelfieExample` | verification | nuevo | SVG inline en trazo de tinta con un toque de yerba, 160 px de alto, con `.cinta`. |
| `IdentityStatusView` | verification | nuevo | El sello, los textos y la acción de cada estado. |
| `IdentityStatusCard` | verification | nuevo | La sección «Tu identidad» de «Mi perfil». |
| `WithdrawRequestDialog` | verification (cliente) | nuevo | Sobre `Dialog`, controlado con `open` como `DeleteAccountDialog`. |
| `ReviewQueueList` | verification | nuevo | Las filas de la cola. |
| `ReviewRequestView` | verification | nuevo | Datos, imágenes y regla de un pedido. |
| `ReviewDecision` | verification (cliente) | nuevo | «Aprobar», «Rechazar…» y el `Sheet` de motivos. |
| `ReviewWatcher` | verification (cliente) | nuevo | El sondeo de 10 s y la vista de cerrado. |
| `ReviewQueueLink` | verification | nuevo | El acceso desde «Mi perfil». |
| `Card`, `Button`, `LinkButton`, `Dialog`, `Sheet`, `Skeleton`, `EmptyState`, `ErrorText`, `SavedToast`, `NotNowLink`, `ErrorScreen`, `PageShell` | — | reusa | Sin cambios. |
| `PhoneNumberCard` | verification | cambia | Recibe si decir "Nivel 1 desde…" o no. |

Cada componente nuevo entra en la tabla de `docs/10` en este PR.

## Project Structure

### Documentation (this feature)

```
specs/005-verificacion-de-identidad/
├── story.md             # el cuerpo de la historia #11, verbatim
├── spec.md
├── plan.md              # este archivo
├── data-model.md
├── contracts/
│   └── actions.md       # acciones de servidor y rutas
├── quickstart.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code

```
supabase/migrations/<ts>_identity_verification.sql   tablas, policies, funciones, pg_cron
supabase/seed.sql                                      Lucía administra; los secretos locales de la tarea
src/lib/verification/
  rules.ts                     + las constantes de identidad
  identity-status.ts (+test)   estado del pedido para la persona
  level.ts (+test)             nivel 0/1/2
  review-state.ts (+test)      qué le pasó a un pedido que ya no está
  gate.ts (+test)              + la razón `identity`
src/lib/profile/identity-photo.ts (+test)   tamaño de salida y re-codificación (puro) + canvas
src/lib/schemas/identity.ts (+test)         envío, resolución
src/lib/supabase/queries/identity.ts        única puerta a las tablas nuevas
src/lib/email/with-deadline.ts              el minuto de FR-026, extraído de send-number-lost
src/lib/email/send-identity-result.ts       aprobado, rechazado, vencido
src/lib/analytics/events.ts, track.ts       + nueve eventos, con propiedades
src/actions/identity.ts                     submit, consent, withdraw, resolve, checkReview
src/app/[locale]/(app)/verificar-identidad/ page, loading, error
src/app/[locale]/(app)/revision/            page, loading, error, [id]/page, [id]/loading
src/app/api/revision/[id]/[kind]/route.ts   sirve una imagen
src/app/api/cron/identidad/route.ts         manda los correos de vencimiento
src/components/verification/                los componentes de la tabla
messages/es.json                            namespaces identity.*, review.*, emails.identity_*
tests/db/identity.test.ts                   el arnés de privacidad de esta historia
tests/e2e/identidad.spec.ts                 pedir → aprobar → nivel 2
```

## Decisiones técnicas

### 1. Siete tablas y ninguna columna con datos de la cédula

`identity_requests` (solo pedidos **en revisión**), `identity_request_images` (sus dos fotos),
`identity_verifications` (identidad verificada y el día), `identity_rejections` (día y motivo, 30
días), `identity_expirations` (vencido y el día, más el aviso pendiente), `identity_resolutions`
(quién resolvió qué pedido) y `admins`. Un pedido que se cierra **se borra** de
`identity_requests` y deja, en la tabla que corresponde, exactamente lo que FR-031 enumera: así la
retención es estructural y no depende de acordarse de limpiar columnas. Detalle en
[data-model.md](./data-model.md).

### 2. Las funciones de escritura

Todas `security invoker`, llamadas con la clave de servicio desde `lib/supabase/queries/identity.ts`
(como `reserve_phone_code`), con el candado de la cuenta (`pg_advisory_xact_lock` sobre
`'identity-user:' || id`) y los números de las reglas como parámetros desde `rules.ts`:

- `submit_identity_request(user, origin, front, selfie, ttl, window, cap)`: comprueba nivel 1 en
  `phones` (FR-002, también al enviar), que no haya pedido abierto ni identidad verificada
  (FR-009), y el tope (FR-027); inserta el pedido y las dos imágenes; borra la fila de
  `identity_expirations` de la cuenta (FR-031). Devuelve `sent | no_phone | already_open |
  already_verified | capped (retry_on)`.
- `withdraw_identity_request(user)`: `select … for update` del pedido propio; si está vigente lo
  borra (las imágenes caen por cascada) y devuelve `withdrawn` con `sent_at` y `origin` para el
  evento; si no hay pedido, `not_open`; si venció, lo trata como `expired` (FR-012b).
- `resolve_identity_request(request, admin, outcome, reason, window, cap)`: comprueba que `admin`
  esté en `admins` (FR-022b: se lee en la transacción, no en la sesión), que no sea el dueño
  (FR-020), `select … for update` del pedido (FR-022: la segunda resolución no lo encuentra), que
  no haya vencido (FR-028); borra el pedido; inserta en `identity_verifications` o en
  `identity_rejections`; inserta en `identity_resolutions`. Devuelve `approved | rejected` con
  `user_id`, `sent_at`, `origin`, `verified_on`/`rejected_on` y cuántos rechazos quedan en la
  ventana (para el correo del tercero), o `gone | expired | not_admin | own_request`.
- `expire_identity_requests()`: la llama `pg_cron`. Borra los pedidos con `expires_at <= now()` e
  inserta en `identity_expirations` con `notice_pending`; borra los rechazos y vencimientos de más
  de 30 días; borra los avisos pendientes de más de 24 horas (un correo que nunca pudo salir no
  vale una fila más). Devuelve cuántos venció, para el evento.

El retiro y la resolución toman el mismo candado de fila, así que "retira mientras se resuelve"
(Edge Cases) queda en uno u otro orden, nunca los dos.

### 3. Las fotos: procesadas en el navegador, validadas en el servidor

- `IdentityPhotoField` acepta `image/jpeg, png, webp, avif` hasta 10 MB (FR-006, mismo filtro que
  la foto de perfil), con `accept` y, para «Sacar foto», `capture` (`environment` para la cédula,
  `user` para la selfie); donde no hay cámara el navegador ofrece archivos (FR-005).
- `processIdentityPhoto` dibuja en canvas con `imageOrientation: 'from-image'` y exporta WebP: eso
  **borra los metadatos**, GPS incluido (FR-008a), igual que la foto de perfil. Lado mayor 1600 px;
  si el WebP pasa de 450 KB, re-exporta a calidad 0,75 y después 0,65, y si sigue pasando, a 1280
  px. La decisión de tamaño y calidad es una función pura (`nextEncodeStep`) con test; el canvas no.
- El envío es un `FormData` a la Server Action con las dos fotos: dos de 450 KB entran en el
  límite de 1 MB de Next con margen para el resto del formulario. El schema del servidor exige
  `image/webp`, la firma `RIFF….WEBP` en los primeros bytes y ≤ 450 KB cada una: lo que llega
  sin pasar por el procesado no se guarda (FR-008a).
- Las fotos viajan a la función como base64 y se guardan como `bytea` (`decode(…, 'base64')`).

### 4. Ver las imágenes: una ruta que pregunta cada vez

`GET /api/revision/[id]/[kind]` lee la imagen con la **sesión** de quien pide: la policy de
`identity_request_images` solo deja leerla a quien está en `admins`, si el pedido existe, no venció
y no es propio (FR-019, FR-020, FR-029). Si no hay fila, 404 sin cuerpo, igual para "no existe",
"no es tuyo" y "ya se cerró". Responde con `Cache-Control: private, no-store` y
`Content-Type: image/webp` (FR-019: no queda en el dispositivo). `/api` está fuera del matcher del
proxy, así que la ruta no pasa por next-intl; la sesión se lee con `createServerSupabase`.

La ruta lee con `getReviewImage(id, kind)` de `lib/supabase/queries/identity.ts` (PostgREST
devuelve el `bytea` como texto hexadecimal; la query lo pasa a bytes): nadie hace `.from` fuera
de `queries/`. La ruta del cron usa `listPendingExpiryNotices` y `markExpiryNoticeSent` del mismo
archivo.

`ReviewRequestView` pinta cada imagen con un `img` nativo (no `next/image`: la optimización
cachearía la imagen en el servidor). Si el `img` dispara `onError`, `ReviewDecision` deshabilita
«Aprobar» hasta que las dos carguen (Pantallas).

### 5. Nivel 2 y el estado: funciones puras

- `verificationLevel(phone, identity)`: `0` sin nivel 1; `1` con nivel 1 sin identidad; `2` con
  las dos (FR-023). Lo usan «Mi perfil», el estado del pedido y, más adelante, la chapita (#12).
- `identityStatus({ request, verification, rejections, expiration }, now)` → `none | in_review
  (sentAt, expiresAt) | approved (on) | rejected (on, reason, attemptsLeft) | expired (on) | capped
  (retryOn)`. Un pedido con `expires_at <= now` es `expired` aunque la tarea todavía no haya
  corrido (FR-028). `capped` gana sobre `rejected` cuando hay 3 rechazos en la ventana, y
  `retryOn` es el día del más viejo de esos tres más 30 (FR-027). Solo cuentan los rechazos con
  `rejected_on > hoy − 30` (FR-031).
- `reviewState({ exists, resolved, expiresAt }, now)` → `open | resolved | expired | gone`
  (FR-021).

### 6. Sin teléfono: la puerta de la historia #10

`GateReason` suma `identity` (slug `identidad`). `/verificar-identidad` sin nivel 1 hace
`redirect(gateCheck(status, { path: '/verificar-identidad?desde=perfil', reason: 'identity', from:
'/mi-perfil' }).gatePath)`: el aviso nombra la acción y el motivo (FR-002), «Ahora no» vuelve a «Mi
perfil», y al verificar vuelve a pedir. Excepción: con un pedido en revisión o la identidad ya
verificada, se muestra el estado igual (Edge Cases): lo del teléfono se ve en «Mi perfil».

### 7. Quien administra: `admins` y un helper privado

`admins (user_id pk)` sin permisos para `anon` ni `authenticated` más que `select` de su propia
fila (la aplicación la usa para mostrar el acceso a la cola y para `notFound()`). Las policies que
dependen de administrar usan `private.is_admin()`: `security definer`, `stable`, `search_path = ''`,
en el esquema `private` que la API no expone, con `(select auth.uid())` adentro, y `execute` solo
para `authenticated` (lo necesita la evaluación de las policies). Lo designa el equipo con un
`insert` desde la consola de Supabase (FR-013a); en local, el seed designa a Lucía.

### 8. Lo que ve quien administra de la persona

Una policy nueva en `profiles`, `profiles_select_under_review`: quien administra lee el perfil de
una cuenta **solo si** tiene un pedido vigente (FR-014). "Desde qué día tiene cuenta" es
`profiles.created_at`, que nace al completar el perfil, minutos después de la cuenta: la persona
no puede pedir sin perfil completo, así que siempre existe (spec §Assumptions lo menciona como
lectura). Los rechazos de esa cuenta, con otra policy igual en `identity_rejections`. Ni el correo
ni el teléfono: no hay policy que los abra.

### 9. El correo del resultado sale después de responder

`resolveIdentityRequest` responde a quien administra y manda el correo con `after()` de
`next/server`, como el de número perdido: la resolución no espera al servicio de correo ni se
deshace si falla (FR-026). `withDeadline` pasa a `lib/email/with-deadline.ts` (segunda repetición)
y `send-number-lost.ts` la importa de ahí.

### 10. El vencimiento: `pg_cron` y `pg_net`

- `cron.schedule('identity-expire', '*/5 * * * *', 'select public.expire_identity_requests()')`:
  el borrado de imágenes no depende de la aplicación (FR-028, SC-002).
- `cron.schedule('identity-expiry-mail', '*/5 * * * *', …)`: si hay avisos pendientes, `net.http_post`
  a la URL y con el secreto que están en Vault (`app_url`, `cron_secret`). En local, el seed los crea
  apuntando a `http://host.docker.internal:3000` con el secreto de `.env.example`. Sin secretos en
  Vault, no llama a nada.
- `POST /api/cron/identidad` compara el encabezado con `CRON_SECRET` (`lib/env.ts`), lee los avisos
  pendientes con la clave de servicio, manda cada correo (un intento, con el minuto de
  `withDeadline`), los marca como avisados y dispara `identity_request_expired` por cada uno.
  Responde 401 sin cuerpo si el secreto no coincide.
- La tarea corre cada 5 minutos y el correo sale en la misma vuelta si la aplicación está arriba:
  queda dentro de la hora de FR-028 con margen.

### 11. Los eventos

`EVENTS` suma `identity_offer_viewed`, `identity_request_started`, `identity_consent_accepted`,
`identity_request_sent`, `identity_request_withdrawn`, `identity_request_expired`,
`identity_request_approved`, `identity_request_rejected`, `identity_cap_reached`. `track(event,
props?)` acepta un objeto chico de propiedades tipadas por evento (`origin`, `reason`,
`review_hours`), nunca un id ni un texto libre; los de quien administra y el vencimiento se
disparan sin marca de visita (`{ visit: false }`), porque no son de la visita de la persona
(FR-035). «Oferta vista» se dispara en el render de «Mi perfil» cuando se muestra la oferta;
«Pedido empezado», en el render de la vista de pedir; «Consentimiento aceptado», con una acción
propia al tocar «Acepto y elijo las fotos» (el paso cambia en el cliente). «Pedido vencido» lo
dispara la ruta del cron por cada aviso que procesa, salga o no el correo: con la aplicación apagada
más de 24 horas, ese evento se pierde junto con el correo (va a la misma KL de §Riesgos).

### 12. Borrar la cuenta

Todo lo nuevo cuelga de `auth.users` con `on delete cascade` (el pedido, y con él las imágenes; la
identidad verificada; los rechazos; el vencimiento; las resoluciones de sus pedidos; la fila de
`admins`). `identity_resolutions.resolved_by` es `on delete set null`: la cuenta de quien
administra se borra y lo resuelto queda, sin nombrarla (FR-034a). El texto de la confirmación de
borrar suma la verificación de identidad (FR-034). `deleteAccount` no cambia.

### 13. Encontrable

Todas las rutas nuevas exportan `metadata` desde `messages/es.json` con `robots: { index: false,
follow: false }`: son privadas.

### 14. Los textos de cada motivo

`messages/es.json` → `identity.rejection.<reason>.label` (lo que ven quien administra y la persona)
y `identity.rejection.<reason>.advice` (qué hacer para que la próxima salga bien, FR-017), con las
claves en inglés de la base (`unreadable`, `mismatch`, `expired_document`, `suspected_fraud`). El
correo del rechazo usa los mismos. Un `Record<RejectionReason, …>` asegura con `tsc` que no falte
ninguno.

### 15. Un solo tamaño de imagen

`docs/07` pide tres tamaños WebP + ThumbHash para las fotos de animales, que se muestran en listado,
card y ficha. Las de identidad se ven una sola vez, a un solo tamaño, por una sola persona, y viven
7 días como mucho: un tamaño, sin ThumbHash (el hueco es un `Skeleton`).

### 16. El correo de ayuda

`SUPPORT_EMAIL` en `lib/config.ts`, junto a `APP_NAME` (spec §Assumptions): hoy la dirección del
equipo; cambia con el dominio.

## Qué se testea, y por qué

| Qué | Dónde | Por qué vale |
|---|---|---|
| `identityStatus` | `lib/verification/identity-status.test.ts` | Decide qué ve la persona: un error le dice "vencido" a un pedido en revisión o le calcula mal el día del tope (FR-027, FR-028). |
| `verificationLevel` | `lib/verification/level.test.ts` | Un nivel 2 dado de más engaña a quien entrega un animal. |
| `reviewState` | `lib/verification/review-state.test.ts` | Qué le dice la cola a quien administra de un pedido que se cerró (FR-021). |
| `gate` con `identity` | `lib/verification/gate.test.ts` | La vuelta después de verificar el teléfono (FR-002). |
| `nextEncodeStep` | `lib/profile/identity-photo.test.ts` | Si el tamaño se calcula mal, el envío pasa el límite y la persona no puede mandar el pedido. |
| `identitySubmissionSchema`, `identityResolutionSchema` | `lib/schemas/identity.test.ts` | Lo único que se guarda de una foto es lo que el schema deja pasar; rechazar sin motivo no puede existir. |
| RLS y funciones | `tests/db/identity.test.ts` | Cada regla de FR-029, FR-032 y FR-033 con un intento fallido: anónimo, otra cuenta y la dueña no leen la cola, un pedido ajeno ni ninguna imagen; la dueña no ve sus imágenes ni quién resolvió; quien administra no lee perfiles sin pedido vigente; nadie escribe en ninguna tabla nueva; resolver el propio, resolver dos veces, resolver vencido y resolver sin estar en `admins` fallan; el tope y el pedido único se sostienen con 5 envíos en paralelo; el retiro y la resolución en paralelo dejan uno solo; `expire_identity_requests` borra imágenes y deja el vencimiento; borrar la cuenta borra todo; borrar a quien administra deja `resolved_by` en nulo. |
| El flujo | `tests/e2e/identidad.spec.ts` | Pedir con consentimiento → en revisión → Lucía aprueba → la persona ve «Nivel 2» y el correo está en `.artifacts/mail/`. Mide SC-010 en la pantalla de pedir. |

No se testean: las páginas, los componentes que solo pintan, el canvas, las queries finas, la ruta
de imágenes (su regla es la policy, probada en `tests/db/`), ni los textos de los correos.

## Documentación en este PR

- `docs/07-stack.md` §Decisiones: `pg_cron` y `pg_net` para las tareas que no pueden esperar al
  cron diario y para borrar datos personales desde la base (2026-09-26).
- `docs/10-design-system.md`: los componentes nuevos en la tabla.
- `docs/06-i18n.md` §Glosario: nivel 2, pedido de verificación, quien administra, cola de revisión
  (ya en la rama).
- `docs/03` §1 y §6, `docs/01` §Legal / datos: las decisiones del enjambre (ya en la rama).
- `docs/known-limitations.md`: KL nueva si queda algún resto (el correo de vencimiento con la
  aplicación apagada; ver §Riesgos).
- `.env.example`: `CRON_SECRET`.

## Riesgos

- **Respaldos**: en un plan pago de Supabase, los respaldos diarios guardan la base 7 días; una
  imagen borrada podría seguir en un respaldo hasta entonces. Hoy el sitio corre en local y el plan
  gratuito no tiene respaldos. Se anota como KL para revisarlo en M5, antes de subir la base a la
  nube.
- **La aplicación apagada**: sin `pnpm dev` o `pnpm start`, las imágenes vencidas se borran igual
  (la base corre), pero el correo de vencimiento espera a la próxima vuelta con la aplicación
  arriba, y pasadas 24 horas se descarta. Se anota como KL.
- **`host.docker.internal`** en Linux (CI) necesita el alias de Docker. En CI la llamada de `pg_net`
  puede fallar sin consecuencias: es asíncrona, no toca ninguna tabla nuestra, y las pruebas llaman
  a la función y a la ruta directo.
- **Una sola persona que administra con pedido propio**: vence (spec §Assumptions).
