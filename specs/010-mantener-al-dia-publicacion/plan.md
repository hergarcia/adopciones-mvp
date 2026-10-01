# Implementation Plan: Mantener al día cada publicación: en proceso, pausa, adopción, vencimiento y revisión

**Branch**: `feature/59-mantener-al-dia-publicacion` | **Date**: 2026-09-30 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/010-mantener-al-dia-publicacion/spec.md` (4 user stories). Decisiones técnicas en
[research.md](./research.md) (R1–R11); tablas y funciones en [data-model.md](./data-model.md); rutas,
acciones, tarea y correos en [contracts/routes.md](./contracts/routes.md).

## Summary

Hoy toda publicación está «disponible» para siempre. Al terminar, el publicador la marca en proceso,
la pausa, la marca adoptada, la vuelve a publicar o la borra desde Mis animales; cada una vence sola
a los 30 días y avisa 7 días antes con un correo que la renueva a un toque sin ingresar; y quien
administra revisa cada publicación nueva o editada y baja la que no corresponde.

Cinco decisiones ordenan el plan:

1. **Vencida y dada de baja se derivan, no se escriben** (R1). `status` guarda lo que elige el
   publicador; el vencimiento es `expires_at <= now()` y sale del listado en el instante, sin una
   tarea que llegue tarde. Una sola función de la base dice el estado derivado.
2. **Cada acción es una función de la base con candado** (R2), como publicar y guardar en #53: el
   nivel 1, la propiedad y la tabla de transiciones se comprueban adentro; dos pestañas o el
   publicador y quien administra chocan en el candado.
3. **El recordatorio sigue el patrón de la identidad** (R4): `pg_cron` cada 5 minutos despierta a
   la aplicación solo si hay trabajo, y la aplicación marca antes de mandar: uno solo por
   vencimiento.
4. **«Sigue disponible» es un enlace guardado como hash que solo renueva ese animal** (R5): un Route
   Handler renueva y redirige a una página que solo lee; muere con el animal por la cascada.
5. **La revisión es una fila por publicación y una cola que es función de la base** (R8); el motivo
   de la baja vive en la publicación, que su dueña ya lee; quién decidió, en la revisión, que solo
   ve quien administra.

## Technical Context

**Language/Version**: TypeScript 7 (`strict`), React 19, Next.js 16 (App Router).

**Primary Dependencies**: las de `main`. **Ninguna nueva**: `sharp` ya es directa (#57) y pasa la
portada a JPEG para el correo; `pg_cron` y `pg_net` ya están en uso (#11).

**Storage**: Postgres y Storage de Supabase (local). Una migración (data-model.md).

**Testing**: Vitest (unidad y base local), Playwright (un flujo crítico), Stryker al 100 % sobre lo
que tenga test.

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: el presupuesto de docs/07 en el listado y la ficha, que no ganan JS: el sello
es del servidor. Las hojas cliente nuevas viven en Mis animales y en la cola (no son del funnel).

**Constraints**: sin Vercel (todo local); nada se indexa; los correos sin `RESEND_API_KEY` van a
`.artifacts/mail/`.

**Scale/Scope**: 3 páginas nuevas (`/mis-animales/{id}`, `/sigue-disponible/{token}/listo`,
`/revision/publicaciones`), 3 Route Handlers nuevos, 4 pantallas que cambian, 1 migración, 2
archivos de acciones, ~12 componentes nuevos, una variante nueva de `Stamp`.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas ni rutas; el cómo está acá. |
| **II. Una feature, un PR** | Cuatro user stories en un PR, en orden: P1 estados, P2 vencimiento, P3 recordatorio, P4 revisión. |
| **III. Compuertas verdes** | `pnpm verify` completo; qué se testea y por qué, en §Qué se testea. |
| **IV. Reglas como código** | Transiciones, vencimiento, recordatorio único, enlace de renovación, cola y su concurrencia son funciones de la base con tests; el estado derivado, las acciones por estado y la pantalla de cada uno son funciones puras con test y paridad contra la base. |
| **V. Datos personales** | Cada regla de visibilidad vive en la base (funciones `security definer`, RLS de `pet_reviews`, policies de Storage) y tiene su test que intenta leer lo que no debe: pausada, vencida, dada de baja y borrada sin datos ni fotos para nadie más; la revisión y quién decidió solo para quien administra; el enlace del correo sin datos de nadie y guardado como hash. Borrar cascada a fotos, revisión y enlaces. Nada de quien adopta. |
| **VI. Sin deriva** | Nada de «Fuera del MVP»: el correo es el canal (no push ni WhatsApp), sin pagos, sin chat. Lo que la historia deja afuera queda afuera (spec §Assumptions, «Fuera de esta historia»). |
| **VII. Liviana y linda** | Server Components; hojas cliente chicas (las acciones, la decisión de la cola). Todo contra docs/10; una sola variante nueva (`Stamp` `ink`) que docs/10 ya pide para «En proceso». |
| **VIII. Autonomía con veto** | Se decide y se avisa en Ship, en un `aviso`: el estado derivado (R1), el escáner de correos que podría renovar (R5, KL-59-1), volver a publicar como publicada hoy, la foto del correo por token (R7), la cola de quien administra con todo a la vista (spec). Nada reservado. |

**Sin violaciones**: Complexity Tracking vacío.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. Cargado `frontend-design:frontend-design`.

**La idea.** En el poste de verdad, el rescatista vuelve a su cartel y le pega encima un sello:
«RESERVADO», «ADOPTADO». Esta historia es eso: **el sello sobre la foto** es el estado, igual en
Mis animales, en el listado y en la ficha; la fecha de vencimiento es la letra chica al pie del
cartel; y la mesa de quien administra es la pila de carteles nuevos que mira uno por uno antes de
dejarlos en el poste. Nada nuevo en el sistema salvo el sello en tinta.

**Lo único que llama la atención**, por pantalla: en Mis animales, «Renovar» cuando un animal vence
pronto (es lo que la herramienta le pide al rescatista); en la ficha adoptada, el sello «Adoptado»;
en la cola, nada más que las fotos (es una pantalla de trabajo).

### Tokens

Color: `--color-ink` (texto, botones, sello «En proceso»), `--color-ink-muted` (fechas, «Pausado»,
«Vencido», «Dado de baja», etiquetas), `--color-primary` (sello «Adoptado»: salió bien),
`--color-warning` (la fecha próxima y el sello `warning` de los avisos al publicador),
`--color-surface` (fondo de los avisos), `--color-line` (divisores de la cola), `--color-accent`
solo en errores y en `UrgencyTag`. Tipografía: `.afiche` en los `h1` y en el nombre de la ficha;
`--text-sm` en la fecha y las etiquetas; `--text-base` en el motivo de una baja. Espacio:
`--space-2` entre el sello y la foto, `--space-3` entre la línea de vencimiento y las acciones,
`--space-8` entre publicaciones de la cola. Movimiento: el de `Sheet`, `Dialog` y `Toast`; nada
nuevo. Recursos: `.sello` (vía `Stamp`) sobre la foto; ninguna cinta ni perforado nuevo.
**Ningún token nuevo.** Variante nueva: `Stamp` `tone="ink"` (`text-ink`), que la fila de `PetCard`
de docs/10 ya describe («`in_process` en `--color-ink`»).

### Mis animales · `/mis-animales` (cambia)

```
390 px                                   cada card de la pared
┌──────────────────────────────────────┐ ┌─────────────────┐
│ Mis animales                    (h1) │ │▚    foto    ▞   │
│ ┄┄ Publicar un animal ┄┄             │ │  ╔══════════╗   │  ← sello sobre la foto, solo si no
│ ┌───────────────┐┌───────────────┐   │ │  ║EN PROCESO║   │    está disponible (Stamp, inclinado)
│ │▚ foto  ▞      ││▚ foto  ▞      │   │ │  ╚══════════╝   │
│ │ [EN PROCESO]  ││  [PAUSADA]    │   │ └─────────────────┘
│ └───────────────┘└───────────────┘   │  Tobi                (afiche --text-lg)
│  Tobi             Luna               │  2 años, Malvín
│  Vence el 5 oct.  Pausada: no vence  │  Vence el 5 de octubre   (--text-sm, ink-muted;
│  ┄ Renovar ┄      Ver ficha          │                           próxima: bold, --color-warning)
│  Ver ficha        Compartir          │  [Renovar]  (secondary, solo si es próxima)
│  Compartir        Más acciones       │  Ver ficha · Compartir · Más acciones   (ghost)
│  Más acciones                        │
└──────────────────────────────────────┘
```

- `PetCard` gana `status` y dibuja `PetStatusStamp` sobre la foto (ya en su fila de docs/10).
- Debajo, `PetExpiryLine`: «Vence el {día}» (disponible o en proceso), con `soon` en negrita y
  `--color-warning` y el texto «Vence pronto: {día}»; «Venció el {día}» (vencida); nada en pausada,
  adoptada o dada de baja.
- `MyPetActions` (cambia): si vence pronto, `RenewButton` en `secondary` primero; después «Ver
  ficha» y «Compartir» (`ghost`, como hoy) y «Más acciones» (`ghost`), que abre `PetStatusSheet`.
  Dada de baja: en lugar de la línea y las acciones, `TakedownNote` («Dada de baja: {motivo}» en
  `--text-sm`) y «Borrar» en `ghost` (`DeletePetDialog`, `triggerVariant="ghost"`).
- `PetStatusSheet`: `Sheet` con el nombre como título y `PetStatusActions` adentro.
- `PetStatusActions` (hoja cliente): una columna de botones `secondary` con las acciones de
  `actionsFor(state)` en este orden: la que pone a la vista (Reanudar / Volver a publicar /
  Renovar), En proceso o Disponible, Pausar, Marcar adoptado; al final «Borrar» en `ghost-danger`
  (`DeletePetDialog`). Cada botón con su estado ocupado (`loading`), uno a la vez; el error queda
  dentro de la hoja con `SaveFailedStrip` y «Reintentar»; `needs_verification` cierra la hoja y abre
  `SaveBlockedDialog` (nivel), el aviso de verificación pendiente de #53; `changed` cierra la hoja,
  refresca y muestra un `Toast` de error «{nombre} cambió mientras tanto». Al salir bien:
  `router.refresh()` y un `Toast` `success` con el mismo verbo («{nombre} está en proceso»,
  «Renovado hasta el {día}», «{nombre} quedó pausado/a»).
- Vacío, cargando y error de la pantalla: los de #53 (`HeadedEmptyState`, `loading.tsx`, `error.tsx`);
  el `loading.tsx` suma el hueco de la línea de vencimiento.

### Un animal en Mis animales · `/mis-animales/{id}` (nueva)

```
390 px
┌──────────────────────────────────────┐
│ ← Mis animales               (ghost) │
│ Tobi                            (h1) │
│ ┌──────────────────┐                 │
│ │▚  foto 4:5   ▞   │  [ADOPTADO]     │
│ └──────────────────┘                 │
│ Vence el 5 de octubre                │
│ ┄┄ Volver a publicar ┄┄  (tirita)    │  ← la acción que pone a la vista, si la hay
│ [ En proceso ] [ Pausar ]            │
│ [ Marcar adoptado ]                  │
│ Ver ficha   Compartir   Editar       │
│ Borrar                (ghost-danger) │
└──────────────────────────────────────┘
```

`MyPetPanel` (pets) compone `PetCard`, `PetExpiryLine` y `PetStatusActions` con `layout="page"`,
donde la primera acción es la `tirita` de la pantalla. Vacío: no aplica. Cargando: `loading.tsx` con
la forma del panel. Error: `error.tsx` de Mis animales. No suyo o inexistente: `PetNotFound`.

### Ficha · `/animales/{code}` (cambia)

- `PetHeadline` gana un hueco para `PetStatusStamp` al lado del nombre (en proceso y adoptado).
  Adoptada: debajo de las acciones, `LinkButton` `secondary` «Ver los animales en adopción».
  «Compartir» queda.
- Dueña con la publicación oculta: `HiddenFromPublicNotice` con textos por motivo (pausada,
  vencida, dada de baja con el motivo, sin nivel 1) y su acción («Ir a {nombre} en Mis animales» o
  «Confirmar mi teléfono»). Sin componente nuevo.

### Animal no disponible (cambia)

`PetUnavailable` con dos textos más: «Este animal está pausado por ahora» / «Puede volver a estar
a la vista más adelante.» y «Esta publicación venció» / «Quien lo publicó no confirmó que siga
disponible.», los dos con «Ver los animales en adopción». Sin «Entrar». Sin componente nuevo.

### Animales en adopción (cambia)

Las cards en proceso con `PetStatusStamp`. Nada más cambia.

### Resultado de «Sigue disponible» · `/sigue-disponible/{token}/listo` (nueva)

```
390 px
┌──────────────────────────────────────┐
│            [logo]                    │
│                                      │
│     Tobi sigue publicado       (h1)  │  ← HeadedEmptyState, centrado (es una confirmación)
│     hasta el 30 de octubre.          │
│     ┄┄ Ir a Mis animales ┄┄          │
└──────────────────────────────────────┘
```

`RenewalResult` (pets) elige título, cuerpo y acción por `outcome`: renovado / vuelto a publicar
(«Tobi volvió a Animales en adopción hasta el …»), pausado, adoptado, dado de baja, falta el
teléfono («Confirmá tu teléfono…», acción a verificar), el enlace no sirve, y `error` («No pudimos
renovar a Tobi.» con «Reintentar», un enlace al mismo `GET`). Sin nombre si el enlace no sirve. El
botón es un enlace: no hay cargando más allá de la navegación. Vacío: no aplica.

### Publicaciones por revisar · `/revision/publicaciones` (nueva)

```
390 px                                         1280 px: la misma columna, en --measure de lectura
┌──────────────────────────────────────┐
│ Publicaciones por revisar       (h1) │
│ 7 esperan                            │  (--text-sm, ink-muted)
│ ──────────────────────────────────── │
│ Tobi · nueva · hace 3 horas          │  (afiche --text-lg; «editada» igual; estado si no es
│ ┌──────────────────────────────────┐ │   disponible, en Stamp muted)
│ │  PetGallery (todas las fotos)    │ │
│ └──────────────────────────────────┘ │
│ PetFacts (todos los datos)           │
│ Descripción completa                 │
│ [OwnerCard: Ana, Teléfono verif.]    │
│ animales/k3x9p2qa7m        (TextLink)│
│ [ Marcar revisada ] Dar de baja      │  (secondary · ghost-danger)
│ ──────────────────────────────────── │
│ Luna · editada · hace 2 días         │
│ …                                    │
└──────────────────────────────────────┘
```

- `PetReviewQueue` (pets): la lista con divisores de `--color-line`, como `ReviewQueueList`;
  `PetReviewItem` (pets) reutiliza `PetGallery` y `PetFacts` y recibe la nota del publicador como
  hueco (`owner`), que la página llena con `OwnerCard` (verification): `components/pets` no importa
  de `components/verification`, como en la ficha. La propia: «La revisa otra persona que administre», sin acciones.
- `PetReviewDecision` (hoja cliente): «Marcar revisada» (`secondary`, ocupado mientras corre) y
  «Dar de baja» (`ghost-danger`) que abre `TakedownSheet`: `RadioGroup` con los cinco motivos,
  `Textarea` con `CharacterCount` cuando es «otro», la línea «Quien publicó va a leer este motivo.»,
  y «Dar de baja» en `danger`. Al salir bien, el ítem sale de la lista con un `Toast` («Tobi quedó
  revisado», «Tobi quedó dado de baja») y `router.refresh()`. `closed` / `gone`: el ítem se
  reemplaza por una línea «Ya lo resolvió otra persona» / «Ya no existe», sin acciones.
- Vacío: `EmptyState` «No hay publicaciones por revisar.». Cargando: `loading.tsx` con dos ítems de
  `Skeleton` (galería 4:5, tres renglones). Error: `error.tsx` con «Reintentar».

### Mi perfil (cambia)

`IdentitySection` suma, debajo de «Revisar pedidos de identidad (N)», un segundo `ReviewQueueLink`:
«Revisar publicaciones (N)» o «Revisar publicaciones: nada esperando». Si la cuenta falla, el
enlace sin número.

### Vista previa (cambia)

La imagen de la adoptada (`PetShareImage`): la portada y, al lado, el nombre y, en lugar de la zona,
el sello «Adoptado/a» en `--color-primary`. Texto de la tarjeta: «{nombre} fue adoptado/a».

### Correos

La plantilla de siempre (`renderNoticeEmail`) con dos extras opcionales (R7): la foto arriba,
480 px de ancho, sin borde, `alt` con el nombre; y el segundo enlace como texto subrayado debajo del
botón. Sin hexadecimales nuevos.

### Textos (`messages/es.json`)

- `pets.status`: nombres de estado con concordancia (`{sex, select, female {Adoptada} other
  {Adoptado}}`), acciones («Marcar en proceso», «Marcar disponible», «Pausar», «Reanudar», «Marcar
  adoptado/a», «Renovar», «Volver a publicar», «Borrar», «Más acciones»), toasts, errores, el
  vencimiento («Vence el {date}», «Vence pronto: {date}», «Venció el {date}»), el diálogo de borrar
  y la dada de baja con sus cinco motivos.
- `pets.page`: los textos de pausada y vencida, «Ver los animales en adopción», y los avisos a la
  dueña por motivo.
- `pets.renewal`: la pantalla de resultado y sus metadatos.
- `pet_review`: la cola, los motivos, el `Sheet`, los toasts, los errores y `metadata`.
- `review.queue.pets_link`: el acceso de Mi perfil.
- `emails.pet_reminder` y `emails.pet_takedown`.
- `pets.share.adopted_title` y la etiqueta de la imagen.

## Qué se testea (y qué no)

Contra docs/09 §Qué vale la pena testear. Cada archivo con test queda al 100 % de mutación.

**Funciones puras (Vitest, al lado del archivo)**

- `lib/pets/lifecycle.ts` — `lifecycleOf` (cada combinación de `status`, `expires_at` en el
  pasado, en el instante y en el futuro, y `taken_down_at`), `actionsFor` (las acciones exactas de
  cada estado, en orden), `needsLevelOne` (solo `resume` `renew` `republish`), `expiryView` (el día
  de Uruguay en que vence, `soon` en 7 días justos y no en 7 días y un minuto, y `expired`). Regla de
  negocio y cálculo con bordes.
- `lib/pets/pet-page-state.ts` (cambia) — cada `visibility` × dueña/no dueña × sesión da la
  pantalla de la precedencia de Edge Cases.
- `lib/pets/renewal-result.ts` — cada `outcome` da título, cuerpo y acción correctos; sin nombre
  cuando el enlace no sirve. Componente cuya conducta cambia con el estado del dominio, testeado
  como decisión.
- `lib/pets/renewal-token.ts` — el token tiene 43 caracteres base64url, dos llamadas dan tokens
  distintos, el hash es el SHA-256 en hex del token, y `isRenewalToken` rechaza lo que no tiene la
  forma (sin ir a la base con basura).
- `lib/pets/waiting-for.ts` — «hace N horas/días» en los bordes (59 min, 1 h, 23 h, 24 h).
- `lib/schemas/pet-status.ts` y `lib/schemas/pet-review.ts` — cada regla con su caso que pasa y el
  que no (acción desconocida, uuid inválido; «otro» sin texto, con 301 caracteres, con espacios solo;
  un motivo con texto que no es «otro» lo descarta).
- `lib/analytics/pet-events.ts` — arma `pet_status_changed`, `pet_republished`, `pet_renewed` y
  `pet_deleted` con `from`, `to` y los días desde publicada (bordes: mismo día = 0).

**Base (Vitest contra Supabase local, `tests/db/`)**

- `pet-lifecycle.test.ts`: la tabla de transiciones entera contra `actionsFor` (paridad); el nivel 1
  solo en reanudar, renovar y volver a publicar; otra persona → `not_found`; dada de baja →
  `taken_down` salvo borrar; renovar dos veces = 30 días desde la última; volver a publicar pone
  `published_at`; editar no toca `expires_at` y rechaza una dada de baja; paridad de
  `pet_lifetime`/`pet_reminder_lead` con `rules.ts` y de `pet_state` con `lifecycleOf`.
- `pet-visibility.test.ts` (privacidad, lo que **no** debe verse): `listed_pets` sin pausadas,
  vencidas, adoptadas ni dadas de baja; `pet_by_code` como anónimo y como otra persona para cada
  estado no devuelve ningún dato (dada de baja = sin fila); la dueña sí, con el motivo;
  `pet_share_card` nada salvo a la vista y adoptada; firmar una foto de una pausada, vencida o dada de
  baja falla con y sin sesión; la de una adoptada a la vista se firma.
- `pet-reminders.test.ts`: `claim_pet_reminders` devuelve cada publicación una sola vez por
  vencimiento, ninguna pausada, adoptada, vencida ni dada de baja, y vuelve a devolverla después de
  renovar y llegar otra vez a 7 días; `claim_pet_expiries` cuenta cada vencimiento una vez;
  `renew_by_link`: renueva, vuelve a publicar una vencida, no cambia una pausada/adoptada/dada de
  baja, `needs_verification` sin nivel 1, `invalid` con un hash desconocido, vencido o de un animal
  borrado, y nunca toca otro animal; `pet_renewal_links` ilegible para `anon` y `authenticated`.
- `pet-reviews.test.ts`: publicar crea la revisión `new`; editar una revisada la vuelve `edited`;
  editar una pendiente no la duplica; `pet_reviews` ilegible para quien no administra (anónimo y
  persona con sesión); `pet_review_queue` vacía para quien no administra y nunca devuelve zona ni
  contacto; la propia no se resuelve (`own`); dos personas que administran: la segunda recibe
  `closed`; `pending_since` viejo → `closed`; quien deja de administrar → `not_admin`; una baja saca
  la publicación del listado y de su enlace; las fotos de una pendiente se firman para quien
  administra y no después de revisada (si no está a la vista); borrar la publicación borra la
  revisión y los enlaces.

**Flujo crítico (Playwright, `tests/e2e/ciclo-de-vida.spec.ts`)**: Ana marca adoptado un animal →
sale del listado, la ficha sin sesión dice «Adoptado»; lo vuelve a publicar → vuelve; con el
vencimiento movido a 6 días y la tarea llamada, el correo de `.artifacts/mail/` trae «Sigue
disponible», que sin sesión renueva y muestra la fecha. Es el que le ahorra trabajo al rescatista;
la revisión queda en la base, donde se prueba entera.

**No se testea**: las páginas, `PetStatusStamp`, `PetExpiryLine`, `TakedownNote`, `MyPetPanel`,
`PetReviewItem`, `PetReviewQueue` (solo pintan), las queries que envuelven una llamada (las cubren
los tests de la base), las acciones que solo llaman y revalidan, la plantilla de correo, la ruta de
la foto, los textos.

## Docs que cambian en este PR

- `docs/03-mvp-features.md`: las nueve decisiones de la historia, palabra por palabra (hecho en la
  etapa de spec).
- `docs/known-limitations.md`: **KL-53-3 se cierra** (la revisión la baja); nueva **KL-59-1** (un
  escáner de enlaces de un correo corporativo puede abrir «Sigue disponible» y renovar; detección y
  condición de reapertura).
- `docs/10-design-system.md`: `Stamp` `ink`; filas nuevas de `PetStatusStamp`, `PetExpiryLine`,
  `PetStatusActions`, `PetStatusSheet`, `DeletePetDialog`, `RenewButton`, `TakedownNote`,
  `MyPetPanel`, `RenewalResult`, `PetReviewQueue`, `PetReviewItem`, `PetReviewDecision`,
  `TakedownSheet`; cambian `PetCard` (sello hecho), `MyPetActions`, `PetHeadline`, `PetUnavailable`,
  `HiddenFromPublicNotice` (motivos), `ReviewQueueLink` (también publicaciones), `PetShareImage`
  (adoptada).
- `docs/06-i18n.md` §Glosario: «en proceso», «pausada», «adoptada», «vencida», «dada de baja»,
  «renovar», «volver a publicar», con sus claves en inglés.
- `docs/07-stack.md`: decisión R1 (estado derivado) y R5 (enlace de renovación guardado como hash).

## Project Structure

### Documentation (this feature)

```text
specs/010-mantener-al-dia-publicacion/
├── story.md · spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/routes.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/<ts>_pet_lifecycle.sql
src/
  app/api/cron/publicaciones/route.ts                     (nueva)
  app/[locale]/(public)/sigue-disponible/[token]/route.ts (nueva: renueva y redirige)
  app/[locale]/(public)/sigue-disponible/[token]/foto/route.ts
  app/[locale]/(public)/sigue-disponible/[token]/listo/page.tsx
  app/[locale]/(public)/animales/page.tsx · [code]/page.tsx · [code]/imagen/route.tsx   (cambian)
  app/[locale]/(app)/mis-animales/page.tsx · loading.tsx  (cambian)
  app/[locale]/(app)/mis-animales/[id]/page.tsx · loading.tsx   (nuevas)
  app/[locale]/(app)/mis-animales/[id]/editar/page.tsx    (cambia: dada de baja → panel)
  app/[locale]/(app)/revision/publicaciones/page.tsx · loading.tsx · error.tsx
  app/[locale]/(app)/mi-perfil/_components/identity-section.tsx   (cambia)
  actions/pet-status.ts · actions/pet-review.ts
  components/ui/stamp.tsx                                 (cambia: tone ink)
  components/pets/
    pet-card.tsx · my-pet-actions.tsx · my-pets-grid.tsx · pet-headline.tsx · pet-sheet.tsx
    pet-unavailable.tsx · pet-share-image.tsx               (cambian)
    pet-status-stamp.tsx · pet-expiry-line.tsx · pet-status-actions.tsx · pet-status-sheet.tsx
    delete-pet-dialog.tsx · renew-button.tsx · takedown-note.tsx · my-pet-panel.tsx
    renewal-result.tsx
    pet-review-queue.tsx · pet-review-item.tsx · pet-review-decision.tsx · takedown-sheet.tsx
  lib/pets/rules.ts · types.ts · paths.ts · pet-page-state.ts · listed-card-view.ts   (cambian)
  lib/pets/lifecycle.ts · renewal-result.ts · renewal-token.ts
  lib/pets/waiting-for.ts
  lib/schemas/pet-status.ts · pet-review.ts
  lib/analytics/events.ts (cambia) · pet-events.ts
  lib/email/notice-email-template.ts · send-email.ts      (cambian: imagen y segundo enlace)
  lib/email/send-pet-reminder.ts · send-pet-takedown.ts
  lib/supabase/queries/pets.ts · listed-pets.ts · pet-errors.ts   (cambian: estado, vencimiento,
                                                          motivo; `taken_down` como error conocido)
  lib/supabase/queries/pet-status.ts · pet-reviews.ts · pet-renewal.ts
  lib/supabase/types.ts                                   (pnpm db:types)
messages/es.json
tests/db/pet-lifecycle.test.ts · pet-visibility.test.ts · pet-reminders.test.ts · pet-reviews.test.ts · lifecycle-support.ts
tests/e2e/ciclo-de-vida.spec.ts
```

**Structure Decision**: la de F00. Lecturas y llamadas a funciones de la base, solo en
`lib/supabase/queries/`; las mutaciones son Server Actions con `ActionResult`; los componentes de
dominio reciben el objeto y los textos y no piden nada (las hojas cliente llaman a las acciones,
como `PetForm`); la cola vive en `components/pets` porque muestra publicaciones, y la página compone
`OwnerCard` en su hueco.

## Complexity Tracking

Sin violaciones.

## Para Ship

- **Issue `aviso`**: lo listado en Constitution Check, VIII.
- **Hallazgos fuera de alcance**: ninguno abierto en la etapa de spec.
