# Implementation Plan: Seguimiento a los 30 días de cada adopción y adopciones con seguimiento en el perfil

**Branch**: `feature/69-seguimiento-30-dias-adopcion` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/017-seguimiento-adopcion/spec.md` (4 user stories). Decisiones técnicas en
[research.md](./research.md) (R1–R13); tablas y funciones en [data-model.md](./data-model.md);
rutas, acciones, tarea, correos y eventos en [contracts/routes.md](./contracts/routes.md).

## Summary

Treinta días después de marcar adoptado a una persona, la base pide sola el seguimiento: escribe
el pedido y deja en la bandeja de salida de #65 el correo «¿Cómo va Tobi?». Quien adoptó responde
desde Mi solicitud con 1 a 3 fotos y un texto opcional; quien lo dio recibe un correo con la
primera foto y ve la respuesta en Mis animales y en Una solicitud. Cada respuesta suma a dos
números públicos: cuántas adopciones con seguimiento dio y cuántas adoptó cada persona.

Cinco decisiones ordenan el plan:

1. **Una tabla `follow_ups`, una fila por adopción** (R1), con `unique (adoption_id)`: pedido,
   respondido, cerrado o no pedido; la respuesta en la misma fila y sus fotos en
   `follow_up_photos`. Sin políticas; se lee con funciones que miran quién pregunta (R2).
2. **El pedido lo hace la base cada hora** (R3), con «ya llegó el día 30» para recuperar una vuelta
   perdida; el correo, por la bandeja de salida que ya existe.
3. **Un bloqueo queda en la adopción** (`blocked_at`, R4) y **un disparador cierra el pedido** al
   terminar, deshacer o bloquear (R5), sin tocar las funciones de #67.
4. **Las fotos se suben de a una, como las de la ficha**, y «Mandar» es una función con candado
   (R6); lo que se borra pasa por una cola de purga (R7). El correo lleva la primera foto adentro
   (R8).
5. **Los números son una función pública chica** (R9) y **lo que ve cada lado, funciones puras**
   (R10).

## Technical Context

**Language/Version**: TypeScript (`strict`), React 19, Next.js 16 (App Router).

**Primary Dependencies**: las de `main`. **Ninguna nueva** (R13): `sharp`, `resend`, `thumbhash`.

**Storage**: Postgres y Storage de Supabase (local). Una migración nueva; un bucket privado nuevo.

**Testing**: Vitest (unidad y base local), Playwright (un flujo crítico), Stryker al 100 % sobre lo
que tenga test.

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: el presupuesto de docs/07. Mi solicitud suma una hoja cliente
(`FollowUpForm`), que reutiliza la preparación de fotos de #53 (ya en su propio chunk de la
pantalla de publicar); el resto son Server Components. La ficha y el perfil público suman una
llamada chica en paralelo y una línea de texto.

**Constraints**: sin Vercel (todo local); nada se indexa que no se indexara ya; los correos sin
`RESEND_API_KEY` van a `.artifacts/mail/`.

**Scale/Scope**: 0 páginas nuevas, 7 que cambian, 1 migración, 1 archivo de acciones nuevo y 2 que
cambian (`profile.ts`, `pet-status.ts` para la purga), ~6 componentes nuevos en
`components/follow-ups/`, 2 correos.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas ni rutas; el cómo está acá. |
| **II. Una feature, un PR** | Cuatro user stories en un PR, en orden: P1 el pedido, P2 responder y el aviso, P3 el historial, P4 el cierre y el bloqueo. |
| **III. Compuertas verdes** | `pnpm gates:affected` en cada ronda; `pnpm verify` al cerrar; qué se testea en §Qué se testea. |
| **IV. Reglas como código** | Cuándo se pide y cuándo no, una vez por adopción, el cierre, el doble toque, quién ve qué y los números son funciones y disparadores con tests de base; lo que ve cada lado, las líneas, los eventos y los schemas son funciones puras con test. |
| **V. Datos personales** | Las fotos y el texto los leen solo las dos personas (R2), y quien lo dio deja de leerlos tras un bloqueo; los tests lo intentan como otra solicitante, otra persona, quien administra, `anon` y después de un bloqueo en cada dirección y de desbloquear. El bucket no tiene políticas. Borrar cualquier cuenta o el animal se lleva fotos y objetos (cola de purga, test). Ningún correo lleva teléfono, correo ni el texto; ningún evento, nada de las personas. |
| **VI. Sin deriva** | Sin recordatorios, sin segundo seguimiento, sin editar, sin comentar ni puntuar, sin fotos en la ficha ni el perfil, sin panel ni avisos por WhatsApp. |
| **VII. Liviana y linda** | Server Components; una hoja cliente nueva. Todo contra docs/10; ningún token nuevo. |
| **VIII. Autonomía con veto** | `aviso` en Ship: el pedido corre cada hora con recuperación, la suspensión no cierra un pedido abierto, quien adoptó sigue viendo su respuesta tras un bloqueo, la foto va adentro del correo, la pantalla del animal muestra el seguimiento de la adopción terminada. Nada reservado. |

**Sin violaciones**: Complexity Tracking vacío. Ningún cambio transversal de stack.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. Cargado
`frontend-design:frontend-design` antes de escribir este plan; Build lo vuelve a cargar antes del
primer JSX.

**La idea.** El cartel de «se busca hogar» se cerró con la adopción; el seguimiento es **la foto
que vuelve pegada al cartel**: la respuesta se muestra como fotos pegadas en la hoja, con la fecha
escrita debajo, y el sello «Adopción con seguimiento» en yerba (es confianza, docs/10 §Color). El
historial no es una tarjeta de estadísticas ni un número grande con una etiqueta chica: es **una
línea escrita a mano en la nota de la persona**, debajo de «Rescatista», con las mismas palabras
que diría alguien que la conoce: «Dio 2 adopciones con seguimiento».

**Lo único que llama la atención**, por pantalla: en Mi solicitud con el pedido abierto,
«Mandar» (`tirita`); con la respuesta mandada, el sello `primary` «Adopción con seguimiento»; en
Mis animales y Una solicitud, nada nuevo compite con lo que ya estaba (el seguimiento va debajo,
en `--text-sm` salvo las fotos).

### Tokens

Color: `--color-ink` (texto, botones, la línea del historial), `--color-ink-muted` (fechas,
«Seguimiento pedido el …, sin respuesta todavía», «Seguimiento sin respuesta», ayudas),
`--color-line` (el borde de la caja del pedido), `--color-surface` (la invitación a agregar fotos,
de `PetPhotosField`), `--color-primary` / `--color-primary-soft` **solo** en el sello «Adopción con
seguimiento»; `--color-warning` en «Contá cómo va» de Mis solicitudes (le toca actuar, como
«Compromiso pendiente»); `--color-accent` solo en `ErrorText` y `SaveFailedStrip`. Tipografía:
`--text-lg` para «¿Cómo va Tobi?» (`h2`), `--text-base` para el texto de la respuesta con
interlineado de lectura, `--text-sm` para fechas y la línea del historial. Espacio: `--space-2`
dentro de un renglón, `--space-4` entre renglones, `--space-8` entre bloques. Movimiento: el de
`Button`, `PetPhotosField` y `Toast`; la respuesta entra con fade de `--dur-base` al mandarse,
nada con `prefers-reduced-motion`. Las fotos: `.cinta-esquinas` en la primera, como la portada de
la ficha, inclinación `--tilt` ninguna (son pruebas, no adorno). **Ningún token nuevo.**

### Mi solicitud · `/mis-solicitudes/{id}` (cambia)

```
390 px, pedido abierto (debajo de AdoptionPanel de #67)
│ ──────────────────────────────────── │
│ ¿Cómo va Tobi?            (h2 lg)    │ ← FollowUpForm
│ Rocío quiere saber cómo está. Mandale│
│ de 1 a 3 fotos. (sm ink-muted)       │
│ ┌──────────────────────────────────┐ │ ← PetPhotosField `plain`, máx. 3
│ │ [foto 4:5] [foto 4:5] [ + ]      │ │   (sin portada ni mover; sacar sí)
│ └──────────────────────────────────┘ │
│ Contale algo, si querés  (sm muted)  │ ← CountedTextarea 500, opcional
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ [ MANDAR ]           (tirita lg)     │
│ ContactReveal (de #65/#67)           │

respondido
│ ⟦ADOPCIÓN CON SEGUIMIENTO⟧ (Stamp primary md) │ ← FollowUpAnswer
│ Lo contaste el 9 de noviembre. (sm)  │
│ [foto 4:5][foto 4:5][foto 4:5]       │ ← FollowUpPhotos, 3 columnas de la grilla
│ «Duerme en el sillón y ya no le      │
│ tiene miedo a la correa.» (base)     │
```

- `FollowUpForm` (follow-ups, hoja cliente): recibe `applicationId`, el nombre del animal, el de
  quien lo dio y los textos por props. Usa `usePetPhotos` con `max = 3` (el hook suma ese parámetro;
  la ficha pasa el de hoy), `PetPhotosField` en su variante nueva `plain`, `CountedTextarea`
  (`maxLength` 500) y el hook nuevo `useFollowUpSubmit`, que copia la forma de `usePetSave`: sube
  de a una las fotos todavía no subidas con `uploadFollowUpPhoto` (`markUploaded` en cada una, así
  un reintento no repite las que ya llegaron) y después llama a `answerFollowUp`. «Mandar» mira en el
  cliente que haya una foto (sin foto: `ErrorText` «Hace falta al menos una foto.» arriba del botón,
  y el texto queda) y el campo no deja pasar de 500; `followUpAnswerSchema` lo aplica la acción, que
  recibe los ids recién al final (Build, US2). Espera las fotos que se preparan; mientras corre, el
  botón con su carga y el resto apagado; con error de red, `SaveFailedStrip` «No se pudo mandar por
  la conexión. Tus fotos y tu texto siguen acá.» y reintentar; con `closed`, `ErrorText` «Ya no se
  puede contar cómo va Tobi.» y `router.refresh()`. Al salir bien, `ScreenToast` «Le contaste a
  Rocío cómo va Tobi» con la marca `?contado=1` de Mi solicitud, como `?compromiso=1` (la pantalla
  dibuja `FollowUpAnswer`). Los rechazos de
  foto (más de 3, tipo, tamaño) son los de `PetPhotosField`, con el nombre del archivo.
- `PetPhotosField` suma la variante `plain`: sin «Portada»/«Hacer portada», sin mover, con sacar;
  el tope sale de la prop `max`. Es la misma grilla 4:5, el mismo casillero de agregar y los mismos
  rechazos: no se duplica el campo.
- `FollowUpAnswer` (follow-ups): el sello, «Lo contaste el …» o «Ana lo contó el …» según el lado,
  `FollowUpPhotos` y el texto entre comillas tipográficas si hay. Con `hidden` (quien lo dio, tras
  un bloqueo), solo el sello.
- `FollowUpPhotos` (follow-ups): 1 a 3 fotos `card` en la grilla de la pared (2 columnas a 390,
  3 desde 640), 4:5 con `object-fit: cover`, ThumbHash de fondo, la primera con `.cinta-esquinas`;
  cada una es un enlace a su `full` (abre la imagen sola, sin visor propio). `alt`: «Foto de Tobi
  que mandó Ana, 1 de 2».
- Cargando: el esqueleto de Mi solicitud de #63 suma un bloque de 3 rectángulos 4:5, y el de la
  pantalla del animal (`mis-animales/[id]/loading.tsx`) uno igual debajo del panel. Error: el
  `error.tsx` de cada ruta, como hoy. Una falla al traer el seguimiento lanza como el resto de la
  pantalla: no hay un estado a medias.

### Mis animales y la pantalla del animal (cambian)

```
lista, debajo de HandoverLine de un adoptado
│ Adoptado por Ana            (sm ink) │
│ Compromiso aceptado el 9 de oct      │
│ Seguimiento pedido el 8 de nov, sin  │ ← FollowUpLine (sm ink-muted)
│ respuesta todavía                    │
│   ó  ⟦ADOPCIÓN CON SEGUIMIENTO⟧ (md) │
│   ó  Seguimiento sin respuesta       │

pantalla del animal (también si se volvió a publicar)
│ ─────────────────────────────────── │
│ El seguimiento            (h2 lg)    │ ← FollowUpSummary
│ FollowUpAnswer (lado de quien lo dio)│
│   ó  FollowUpLine                    │
```

- `FollowUpLine` (follow-ups): una línea elegida por `followUpLine` (pedido con la fecha, el sello
  o «Seguimiento sin respuesta»); sin seguimiento, nada.
- `FollowUpSummary` (follow-ups): el título y `FollowUpAnswer` o `FollowUpLine` según
  `followUpView`. Lo usan la pantalla del animal y Una solicitud.

### Mis solicitudes (cambia)

`MyApplicationCard` suma, en el grupo «Tus adopciones», «Contá cómo va» como `TextLink` en
`--text-sm` `--color-warning` debajo del nombre, en el lugar de «Compromiso pendiente» (si están
las dos, una debajo de la otra).

### Una solicitud, para el publicador (cambia)

- `ApplicantHeader` suma un hueco `history` debajo del nivel y la zona, que la página llena con
  `FollowUpHistory` `adopted`.
- La elegida: `FollowUpSummary` debajo de `HandoverSummary`, en la columna ancha.

### Perfil público y ficha (cambian)

```
PublicProfileHeader                    OwnerCard (ficha)
│ Rocío                (h1 afiche)  │  │ [avatar] Rocío (bold)        │
│ Cordón, Montevideo   (ZoneLabel)  │  │ Rescatista o refugio (sm)    │
│ Rescatista o refugio (sm muted)   │  │ Dio 2 adopciones con         │ ← FollowUpHistory `given`
│ Dio 2 adopciones con seguimiento  │  │ seguimiento (sm ink)         │
│ Adoptó 1 con seguimiento (sm ink) │  │ ⟦IDENTIDAD VERIFICADA⟧       │
```

- `FollowUpHistory` (follow-ups): `given` · `adopted` · `both`; las líneas de `historyLines`, en
  `--text-sm` `--color-ink`, sin borde ni fondo, como `RescuerTag` pero en tinta: es un hecho, no
  un sello (el sello de la nota sigue siendo el nivel). Ninguna línea con cero; sin ninguna, nada.
  Sin enlace ni lista de animales.
- **Build, US3:** la ficha pide el número con `pet_follow_up_history(p_code)` y no con
  `follow_up_history(publisher_public_id)`: `pet_by_code` solo da el id público de quien publica en
  el caso del bloqueo, y recrearla para eso tocaba una función grande con sus tests. Las dos cuentan
  con la misma `private.follow_up_counts`. La línea de quien adoptó dice «Adoptó 1 animal con
  seguimiento» (plural ICU, «animal»/«animales»): sola, en Una solicitud, «Adoptó 1 con
  seguimiento» no decía qué.

### Correos

La plantilla de `sendEmail`. «¿Cómo va Tobi?» con la portada (extra `image`) y «Contar cómo va»;
«Ana contó cómo va Tobi» con la primera foto adentro (extra nuevo `inlineImage`, R8) y «Ver cómo
va». Nada de teléfono, correo ni el texto de la respuesta.

### Copy y antipatrones

Voseo, verbos que dicen lo que pasa («Mandar», «Contar cómo va», «Contá cómo va»), el mismo verbo
en el aviso («Le contaste a Rocío cómo va Tobi»). «Seguimiento» (docs/06), nunca «reporte» ni
«encuesta». Sin «¡Gracias!» ni confeti: el sello lo cuenta. Sin número grande con etiqueta chica,
sin cero, sin `·` entre datos. Plurales con ICU (`{count, plural, one {…} other {…}}`).

### Textos (`messages/es.json`)

`follow_ups.form.*` (título, ayuda, etiqueta del texto, «Mandar», errores), `follow_ups.answer.*`
(sello, fechas por lado, `alt`), `follow_ups.line.*` (pedido, sin respuesta), `follow_ups.history.*`
(dio, adoptó, con plural), `follow_ups.errors.*`, `follow_ups.toast.*`,
`applications.my.follow_up_cta`, `emails.applications.{follow_up_requested,follow_up_answered}.*`.

## Qué se testea (y qué no)

**Base (`tests/db/`, contra Supabase local)** — lo que expone un dato o engaña:

- `follow-ups-privacy.test.ts`: `follow_up_of` no devuelve nada a otra solicitante del mismo
  animal, a otra persona, a quien administra ni a `anon`; `follow_ups`, `follow_up_photos` y el
  bucket no se leen con ninguna sesión; con `blocked_at`, quien lo dio recibe `hidden` sin texto ni
  fotos y quien adoptó recibe todo, en las dos direcciones del bloqueo y también después de
  desbloquear; `follow_up_history` solo devuelve dos números y `0, 0` para una cuenta suspendida;
  `follow_up_answered_for_email` no devuelve nada a quien adoptó ni con bloqueo; borrar la cuenta de
  quien adoptó, la de quien lo dio o el animal borra el seguimiento y deja sus fotos en la cola de
  purga.
- `follow-ups-rules.test.ts`: `run_follow_up_tick` pide solo las adopciones `site` en curso con el
  día 30 de Uruguay ya llegado (29 días no; 30 sí; una marcada a las 23:50 cuenta por su día);
  escribe un solo aviso y una sola fila aunque corra dos veces; `skipped` con cada motivo (terminada,
  deshecha, bloqueo vigente o desbloqueado, suspensión de cada lado, cuenta de quien adoptó
  borrada) y no se pide después aunque la condición cambie; por fuera del sitio, nada.
  `answer_follow_up`: solo quien adoptó, solo `requested`, de 1 a 3 fotos en espera de ese
  seguimiento, texto ≤ 500; dos veces → `already` y un solo aviso; `closed` tras volver a publicar,
  «Yo no adopté» o bloquear; suspensión de quien adoptó → `suspended` y el pedido sigue abierto;
  suspensión de quien lo dio → responde y sin aviso; responder no cambia el compromiso y
  `decline_adoption` devuelve `answered`; una respuesta no se edita (`follow_ups_forward_only`);
  una adopción terminada después de responder sigue contando en `follow_up_history`.
  `stage_follow_up_photo`: tope de 9, reintento idempotente, `closed` sin pedido abierto.

**Unidad (Vitest, con mutación al 100 %)**: `followUpView` (cada estado por lado, `canAnswer`,
`hidden`), `followUpLine` (pedido, respondido, sin respuesta, nada), `historyLines` (0/0, solo dio,
solo adoptó, los dos), `followUpOutcome` (cada `outcome` a su clave; `already` es éxito),
`followUpAnswerSchema` (0 y 4 fotos, uuid, 500 y 501 caracteres, solo espacios = sin texto),
`adoptionView` con `followUpAnswered` (sin «Yo no adopté»), los eventos nuevos (sin ids ni textos;
días redondeados), `noticeEmail` con los dos `kind` nuevos (destino por lado), `renderNoticeEmail`
con `inlineImage` (el `cid`), `addPhotos` con `max`.

**E2E (Playwright)**: `tests/e2e/follow-up.spec.ts` — con la adopción sembrada de 31 días y
`run_follow_up_tick`: quien adoptó sigue el enlace de `.artifacts/mail/`, sube 2 fotos, escribe y
manda; ve el sello; quien lo dio ve las fotos en Mis animales y «1 adopción con seguimiento» en su
perfil público; el correo de aviso no lleva el texto.

**Qué no**: las páginas, `ui/`, los componentes que solo pintan (`FollowUpAnswer`, `FollowUpPhotos`,
`FollowUpLine`, `FollowUpSummary`, `FollowUpHistory`), las queries finas, la plantilla de cada
correo.

## Docs que cambian en este PR

- `docs/03-mvp-features.md`: las siete decisiones del enjambre de la historia, palabra por palabra
  (§5) — ya en esta rama desde la etapa Spec.
- `docs/06-i18n.md`: suma al glosario «adopción con seguimiento» (`follow-up answered`), «pedido de
  seguimiento» (`follow-up request`); tilda «seguimiento a 30 días» en §Qué se traduce.
- `docs/10-design-system.md` §Componentes: `FollowUpForm`, `FollowUpAnswer`, `FollowUpPhotos`,
  `FollowUpLine`, `FollowUpSummary`, `FollowUpHistory`; `PetPhotosField` con `plain`;
  `MyApplicationCard` con «Contá cómo va»; `OwnerCard`, `PublicProfileHeader` y `ApplicantHeader`
  con el historial; `Stamp` lo usa también «Adopción con seguimiento».

## Project Structure

### Documentation (this feature)

```text
specs/017-seguimiento-adopcion/
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
supabase/migrations/<ts>_follow_ups.sql            nueva
supabase/seed.sql                                  dos adopciones entre personas sembradas (31 y 10 días)
src/lib/supabase/types.ts                          regenerado (pnpm db:types)
src/lib/supabase/queries/follow-ups.ts             nueva: followUpOf, myPetFollowUps, myOpenFollowUps,
                                                   followUpHistory, stageFollowUpPhoto, uploadFollowUpPhotoFiles,
                                                   answerFollowUp, markFollowUpSeen, claimFollowUpEvents,
                                                   purgeFollowUpPhotos, signFollowUpPhotos, followUpAnsweredForEmail
src/lib/supabase/queries/adoptions.ts              cambia: followUpAnswered en adoptionOf
src/lib/follow-ups/                                follow-up-view.ts, history.ts, outcomes.ts, rules.ts, types.ts (+ tests)
src/lib/adoptions/adoption-view.ts (+ test)        cambia: sin «Yo no adopté» con respuesta
src/lib/pets/photo-list.ts (+ test)                cambia: addPhotos con max
src/lib/schemas/follow-up.ts (+ test)              nueva
src/lib/analytics/follow-up-events.ts (+ test)     nueva · events.ts cambia
src/lib/applications/notices.ts (+ test)           cambia: dos kind nuevos
src/lib/email/send-application-notice.ts           cambia: deriva follow_up_answered
src/lib/email/send-follow-up-answered.ts           nueva
src/lib/email/send-email.ts · notice-email-template.ts (+ test)   cambian: extra inlineImage
src/actions/follow-ups.ts                          nueva
src/actions/profile.ts · pet-status.ts             cambian: purgeFollowUpPhotos después del borrado
src/app/api/cron/publicaciones/route.ts            cambia: eventos y purga
src/hooks/use-pet-photos.ts                        cambia: max por parámetro
src/hooks/use-follow-up-submit.ts                  nueva: sube las fotos pendientes y manda
src/components/follow-ups/                         follow-up-form.tsx, follow-up-answer.tsx, follow-up-photos.tsx,
                                                   follow-up-line.tsx, follow-up-summary.tsx, follow-up-history.tsx
src/components/pets/pet-photos-field.tsx           cambia: variante plain
src/components/applications/                       my-application-card.tsx, applicant-header.tsx cambian
src/components/verification/owner-card.tsx         cambia: hueco history
src/components/profile/public-profile-header.tsx   cambia: hueco history
src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx · page.tsx · loading.tsx   cambian
src/app/[locale]/(app)/mis-animales/page.tsx · [id]/page.tsx · [id]/loading.tsx  cambian
src/app/[locale]/(app)/solicitudes/[id]/page.tsx                                cambia
src/app/[locale]/(public)/perfil/[id]/page.tsx · animales/[code]/page.tsx       cambian
messages/es.json                                   follow_ups.*, applications.*, emails.applications.*
tests/db/follow-ups-privacy.test.ts · follow-ups-rules.test.ts                  nuevos
tests/e2e/follow-up.spec.ts                        nuevo
```

`OwnerCard`, `PublicProfileHeader` y `ApplicantHeader` reciben el historial por un hueco (`history: ReactNode`) que
llena la página, como el hueco `badge` de `ProfileSummary`: `components/verification` y
`components/profile` y `components/applications` no importan de `components/follow-ups`.

## Complexity Tracking

Vacío.

## Para Ship

- `aviso`: el pedido corre cada hora y recupera un día perdido; la suspensión no cierra un pedido
  abierto; quien adoptó sigue viendo su respuesta después de un bloqueo; la foto va adentro del
  correo; la pantalla del animal muestra el seguimiento de su última adopción también después de
  volver a publicarlo; las adopciones de prueba anteriores reciben su pedido en la primera vuelta.
- Las siete decisiones del enjambre ya están en docs/03 en esta rama.
