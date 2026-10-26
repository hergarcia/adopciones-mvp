# Implementation Plan: Camadas: mantener al día, responder, entregar y seguir cada cría

**Branch**: `feature/206-camadas-mantener-al-dia` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/026-camadas-mantener-al-dia/spec.md` (4 user stories, una pasada adversaria; lo que
quedó abierto está en sus Assumptions). Decisiones técnicas con alternativas en
[research.md](./research.md); tablas, estados y funciones en [data-model.md](./data-model.md); rutas,
acciones y la tarea programada en [contracts/routes.md](./contracts/routes.md).

## Summary

Cada cría ya es un animal (`pets` con `litter_id`, #205), así que las solicitudes, la entrega, el
compromiso, el seguimiento y la encuesta ya andan por cría. Esta historia les da estado: la cría
guarda el suyo en `pets.status` y la camada suma solo lo propio (`paused_at`, `expires_at`, el
recordatorio) con un estado calculado (R1). Pausar pasa las crías a `paused` guardando a dónde vuelven
(R2); el vencimiento de la camada se copia a sus crías (R3), así las reglas de #63 para un animal
pausado o vencido valen para la cría sin tocarlas. Lo nuevo es: dos funciones de acciones (camada y
cría) y quitar una cría sin nivel 1 (R4); el correo y el enlace «Sigue disponible» por camada (R5); el
listado, la ficha y la vista previa con estados (R6); la bandeja agrupada por camada (R7); el nombre de
la camada en solicitudes, correos, compromiso y seguimiento (R8); «Mis animales» y el panel de la
camada con las acciones (R9, R10); volver a publicar una adoptada eligiendo crías (R11) y la marca de
camada en la medición (R12).

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router), React 19
**Primary Dependencies**: Supabase (Postgres, Auth, Storage, RLS), next-intl, zod, Radix, Motion,
Resend, `next/og`. Sin dependencias nuevas (R13).
**Storage**: Postgres, una migración nueva (`<ts>_litter_lifecycle.sql`) que crece por user story
dentro de la rama.
**Testing**: Vitest (unit, gates y `tests/db` contra Supabase local), Playwright contra `next start`,
Stryker al 100 % sobre lo que tiene test.
**Target Platform**: web móvil primero (390 px), servidor Node local hasta el MVP.
**Performance Goals**: la ficha de la camada sigue con LCP < 2,5 s (sus sellos son texto del
servidor); JS inicial < 150 KB: las hojas cliente nuevas son las listas de acciones, que reusan el
hook de #59.
**Constraints**: ningún string fuera de `messages/es.json`; ningún valor fuera de los tokens de
`docs/10`; cada regla de visibilidad en la base con su test; el cron de cinco minutos de siempre.
**Scale/Scope**: hasta 10 crías por camada; con 10 interesados por cría, 100 solicitudes en una
camada; un correo por camada por vencimiento.

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | la spec no nombra tablas ni rutas; el cómo vive acá |
| II. Una feature, un PR | 4 user stories que se construyen y verifican una por una |
| III. Compuertas | `pnpm gates:affected` por user story, `pnpm verify` al cerrar; tests de lo que importa (§Qué se testea) |
| IV. Reglas como código | las transiciones viven en `change_litter_status` y `change_young_status`, el recuento y el estado en `litter_state`, todo con test |
| V. Datos personales | ningún dato nuevo (FR-040); contacto y bandeja siguen filtrando por dueña; `tests/db/litter-lifecycle-privacy.test.ts` intenta leer lo que no debe |
| VI. Sin deriva | pedir la camada entera, pasar una solicitud de cría, estados nuevos, recordatorios de la madre: fuera |
| VII. Liviana y linda | Server Components, componentes del sistema reusados, §Diseño |
| VIII. Autonomía con veto | sin plata, nombre ni indexación en juego |

Sin violaciones: Complexity Tracking queda vacío. Revisado después del diseño: igual.

## Diseño

Cargado `frontend-design:frontend-design` y leído `docs/10-design-system.md`. Ningún valor nuevo:
todo con tokens y componentes existentes; lo nuevo se suma a la tabla de componentes de `docs/10` en
este PR.

### Tokens que se usan

`--color-canvas`, `--color-surface`, `--color-line`, `--color-ink`, `--color-ink-muted`,
`--color-primary` (lo verificado, el sello «Adoptada» como en un animal), `--color-warning`/`-soft`
(«Vence pronto», el aviso de la dueña), `--color-accent` (solo errores y «Urgente»); `--text-sm` a
`--text-2xl`, `.afiche` para el nombre de la camada y los títulos, `.sello` vía `Stamp`; `--space-*`;
`.cinta-esquinas` de `PetCard`; `--dur-fast`/`--dur-base` en lo tocable. Nada nuevo en `globals.css`.

### Lo que llama la atención, uno por pantalla

- «Mis animales»: como hoy, «Publicar un animal»; en la camada, la acción destacada de `leadActionFor`
  (reanudar, volver a publicar, o «Renovar» si vence pronto), en `secondary` `sm` como en un animal.
- Panel de la camada: esa misma acción como `tirita` (lo que hace `MyPetPanel`).
- Bandeja: nada nuevo; las nuevas siguen siendo el número en `primary`.
- Ficha: sin cambio (sin tirita, decisión de #205); los sellos son `Stamp` `md`.

### Mis animales (cambia) · `/mis-animales`

```
┌──────────────────────────────┐
│ [PetCard camada]  [PetCard]  │  ← la pared de siempre
│  └ sello «Pausada» encima     │  ← PetStatusStamp con el estado de la camada
│ 4 crías, 2 disponibles       │  ← LitterCountLine --text-base
│ Vence pronto: 5 de nov.      │  ← PetExpiryLine
│ [Renovar]                    │  ← LitterStatusActions: la destacada, secondary sm
│ Ver ficha · Compartir · Más  │  ← ghost sm; «Más acciones» abre PetStatusSheet
│ ─────────────────────────    │
│ Cría 1, hembra               │  ← YoungRow: --text-sm ink
│  En proceso · 2 nuevas       │  ← Stamp sm muted/ink + TextLink a sus solicitudes
│  [Acciones]                  │  ← ghost sm → PetStatusSheet de la cría
│ Cría 2, macho  Adoptada      │
│  Adoptada por Ana            │  ← HandoverLine compacta (solo su nombre)
│ …                            │
│ Ver la camada                │  ← TextLink al panel
└──────────────────────────────┘
```

- Reusa: `PetCard`, `PetStatusStamp`, `PetExpiryLine`, `PetStatusSheet`, `ShareButton`, `Stamp`,
  `TextLink`, `HandoverLine`, `OfferedSurvey` (debajo de la fila de la cría recién adoptada),
  `LitterCountLine`.
- Nuevos (litters): `YoungRows`/`YoungRow` (reemplazan a `LitterYoungSummary`, que se borra),
  `LitterStatusActions`, `YoungStatusActions`, `RemoveYoungAction` (sobre `DestructiveConfirmDialog`
  con el texto de `RemoveYoungDialog`: «Se cierran 2 solicitudes» o «La camada se borra»),
  `RepublishLitterDialog` (R11). `MyLitterActions` pasa a componer `LitterStatusActions`.
- Se extrae (pets): `StatusActionList` de `PetStatusActions` (R10), que pasa a componerlo.
- Estados: vacío de la pantalla, el de #53; sin camadas, ningún grupo. Cargando: el `loading.tsx` de
  hoy (la pared en blanco). Error al traer: `error.tsx`. Error de una acción: `PetStatusFailureStrip`
  en el lugar, la cría o la camada como estaban, «Probá de nuevo»; sin teléfono, el aviso de #10;
  cambió mientras tanto, el estado nuevo con el aviso. Éxito: el aviso corto («Cría 2 está en
  proceso», «La camada de Luna está pausada»).

### Panel de la camada (nuevo) · `/mis-animales/camadas/[id]`

```
┌──────────────────────────────┐
│ ← Mis animales               │  ← TextLink
│ La camada de Luna  [Pausada] │  ← .afiche --text-2xl + PetStatusStamp
│ 4 crías, 2 disponibles       │  ← LitterCountLine --text-lg
│ [HiddenFromPublicNotice]     │  ← si nadie más la ve: por qué y el camino
│ [ REANUDAR ]                 │  ← tirita: la acción destacada
│ Renovar · Ver ficha · Compartir · Editar · Borrar la camada │ ← secondary md / ghost-danger
│                              │
│ Las crías                    │  ← --text-xl
│ ┌──────────────────────────┐ │  ← YoungPanelRow: borde --color-line
│ │ [foto 1:1 64px] Cría 1   │ │  ← PetPhoto pequeña; nombre --text-lg
│ │ hembra · En proceso      │ │
│ │ 2 nuevas → solicitudes   │ │
│ │ [Marcar disponible] [Marcar adoptada] [Quitar] │ ← secondary sm / ghost-danger sm
│ └──────────────────────────┘ │
│ ┌ Cría 2 · Adoptada ───────┐ │
│ │ HandoverLine + FollowUpLine│ │
│ │ [Marcar disponible] [Quitar]│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- Reusa: `PetWorkLayout` `small`, `PetStatusStamp`, `LitterCountLine`, `HiddenFromPublicNotice`,
  `TakedownNote` (dada de baja), `HandoverLine`, `FollowUpLine`, `PetPhoto`, `ShareButton`,
  `LinkButton`, `DestructiveConfirmDialog`.
- Nuevos (litters): `MyLitterPanel`, `YoungPanelRow` (las acciones de la cría a la vista, con
  `YoungStatusActions` en `page`).
- Estados: no existe o no es suya → «esta camada no existe» (`PetNotFound` con textos de camada);
  cargando → `loading.tsx` con la forma del panel; error → `error.tsx` con «Probá de nuevo»; dada de
  baja → el motivo y solo «Borrar la camada».

### Volver a publicar una camada adoptada (`RepublishLitterDialog`)

```
┌──────────────────────────────┐
│ ¿Qué crías vuelven a ofrecerse?│ ← título --text-xl
│ [■] Cría 2  Adoptada por Ana │  ← Checkbox; la línea de a quién
│ [ ] Cría 3  Por fuera del sitio│
│ Se termina la adopción de    │  ← --text-sm warning, solo si alguna elegida
│ Cría 2 con Ana.              │    fue a una persona (#67)
│ [Volver a publicar] [Cancelar]│ ← primary md (apagado sin elegir) / secondary
└──────────────────────────────┘
```

Estados: sin elegir (botón apagado y la ayuda «Elegí al menos una»), haciendo, falla (el aviso en
el diálogo, nada cambió), sin teléfono (el aviso de #10).

### Solicitudes recibidas (cambia) · `/solicitudes`

```
┌──────────────────────────────┐
│ Solicitudes                  │
│ [InboxPetCard Tobi]          │  ← animales sueltos como hoy
│                              │
│ La camada de Luna            │  ← InboxLitterGroup: .afiche --text-xl
│ 5 esperan · 2 nuevas         │  ← --text-sm ink-muted; nuevas en primary
│ ┌───────────┐ ┌───────────┐  │  ← ApplicationList wall: InboxPetCard por cría
│ │ Cría 1    │ │ Cría 2    │  │
│ │ 3 esperan │ │ 2 esperan │  │
│ └───────────┘ └───────────┘  │
│ ┌───────────┐                │
│ │ Cría 4    │                │  ← sin solicitudes: «Todavía nadie pidió a esta
│ │ Todavía   │                │    cría» en --text-sm ink-muted, sin enlace
│ └───────────┘                │
└──────────────────────────────┘
```

- Reusa: `InboxPetCard` (suma la variante «sin solicitudes»), `ApplicationList`, `ApplicationPetPhoto`
  (la portada de la camada si la cría no tiene foto, `pet_cover` de #205).
- Nuevos (applications): `InboxLitterGroup`. Función pura `groupInbox` (R7).
- Estados: vacío de la pantalla, el de #65; cargando y error, los de #65.

### Solicitudes de una cría, Mis solicitudes, Mi solicitud, «¿A quién se la diste?»

Sin forma nueva: el nombre de la camada como segunda línea debajo del nombre de la cría
(`--text-sm` `ink-muted`) en `ApplicationPetLayout`, `MyApplicationCard`, `PastedApplicationCard`,
`HandoverForm` y `CommitmentText`. Lo arma una función `youngLabel({ name, litterName })` de
`lib/litters/litter-words.ts`, que también usan los correos.

### Ficha de la camada (cambia) · `/camadas/[code]`

- `LitterCountLine` con el recuento al día. `YoungCard` suma el sello (`Stamp` sobre la foto, como
  `PetPastedPhoto`): «En proceso» `ink`, «Adoptada» `primary`; la adoptada sin «Quiero adoptar». La
  camada adoptada lleva `PetStatusStamp` junto al nombre y el camino a «Animales en adopción», como
  `PetSheet` adoptada.
- Pausada o vencida para quien no la publicó: `PetUnavailable` con «Esta camada está pausada por
  ahora» o «Esta publicación venció» y el camino al listado. Para la dueña, la ficha con
  `HiddenFromPublicNotice` y el camino al panel.

### Tarjeta del listado

`PetCard` con `status` `in_process` cuando la fila de camada lo dice (R6): el sello ya existe.
`listed-card-view.ts` sin cambios de forma.

### Correo «¿<camada> sigue disponible?»

La plantilla de `send-pet-reminder.ts` con el nombre de la camada, su portada y el enlace al panel en
«Ya no está disponible». Se extrae la parte común a `reminder-email.ts` si la segunda plantilla la
repite.

### Textos

Namespace `litters` (de #205) suma `status` (acciones, avisos, fallas, rechazos), `panel`,
`republish`, `remove_young`, `inbox`, `reminder` y `page.paused` / `page.expired`. Plurales ICU para
«{count, plural, one {# disponible} other {# disponibles}}». Sellos de cría en femenino («Adoptada»,
FR-045). Se escriben y revisan con el skill `sin-slop`; el gate de «cachorro»/«gatito» de #205 cubre
los textos nuevos.

## Qué se testea (y qué no)

Se testea lo que, si se rompe, deja pedir una cría que no se puede, cierra solicitudes de otra cría,
expone a quien no debe o calcula mal un recuento (docs/09 §Qué vale la pena testear).

- `tests/db/litter-lifecycle.test.ts`: cada transición de la tabla de data-model con su nivel 1;
  pausar y reanudar devuelven cada cría a su estado (US3-1), también con una adoptada mientras estaba
  pausada; volver a publicar una vencida no toca las crías y una adoptada solo las elegidas, con sus
  adopciones terminadas; `mark_available` de una adoptada termina su adopción; las acciones de cría
  rechazadas con la camada pausada o vencida; la última cría adoptada deja la camada `adopted`; quitar
  la única disponible con las demás adoptadas deja `adopted` (US4-4); `delete_young` sin nivel 1, y de
  la última borra la camada; idempotencia y «cambió mientras tanto» (FR-009, SC-006); las camadas
  viejas quedan con 30 días (FR-001).
- `tests/db/litter-renewal.test.ts`: `claim_litter_reminders` toma una camada una sola vez y ninguna
  cría entra a `claim_pet_reminders` (SC-001, y `tests/db/pet-reminders.test.ts` suma ese caso); pausada, adoptada o de cuenta suspendida no se toma;
  `renew_by_link` de camada en cada estado y sin nivel 1; enlace vencido o de camada borrada no sirve;
  `reactivate_account` corre el vencimiento de la camada.
- `tests/db/litter-lifecycle-privacy.test.ts` (SC-003): `litter_by_code`, `litter_share_card`,
  `listed_pets` y las fotos de una camada pausada o vencida para anónimo, persona cualquiera y dueña;
  quien fue aceptada para una cría no lee por `pet_applications`, `publisher_inbox`,
  `publisher_application` ni `application_contact` nada de quienes pidieron otra cría.
- `tests/db/applications-close.test.ts` (se amplía): adoptar una cría cierra solo las suyas (SC-004)
  con `closed_adopted` y `litter_name`; quitar una cría deja `closed_unpublished` en la cola de
  avisos con `litter_name`; el límite de 3 cuenta dos crías de la misma camada (FR-037); una cría de
  camada pausada o vencida no recibe solicitudes nuevas y las abiertas no se cierran.
- `tests/db/listed-pets.test.ts` (se amplía): pausada, vencida y adoptada fuera del listado y del
  total; recuento por estado (SC-005); `status` `in_process` sin disponibles; filtro de sexo con
  hembras adoptadas.
- `tests/db/application-responses-rules.test.ts` (se amplía, ya prueba `publisher_inbox`): filas en cero
  para las crías sin solicitudes de una camada con alguna, y ninguna para una camada sin solicitudes.
- Unit, con Stryker al 100 %: `lib/litters/lifecycle.ts` (`actionsForLitter`, `actionsForYoung`,
  `leadActionForLitter`, `needsLevelOne`); `lib/applications/inbox-groups.ts` (`groupInbox`: orden,
  sumas, camada con una sola cría pedida, mezcla con animales sueltos); `lib/litters/litter-words.ts`
  (`youngLabel`); `lib/schemas/litter-status.ts` (acciones válidas, `youngIds` solo en `republish`,
  1 a 10).
- E2E `tests/e2e/camada-vida.spec.ts`: el camino de US1 y US2 (bandeja agrupada → aceptar una
  solicitud de «Cría 2» → marcarla en proceso → adoptada a esa persona → la ficha dice «3
  disponibles» y su sello) y pausar y reanudar con una cría en proceso.
- No se testea: las páginas, los componentes que solo pintan, las consultas finas, la plantilla del
  correo (la cubre el test de `claim_litter_reminders` y el de la plantilla de notices que ya existe).

## Docs que cambian en este PR

- `docs/10-design-system.md`: filas nuevas (`YoungRows`, `YoungRow`, `LitterStatusActions`,
  `YoungStatusActions`, `RemoveYoungAction`, `RepublishLitterDialog`, `MyLitterPanel`,
  `YoungPanelRow`, `InboxLitterGroup`, `StatusActionList`), cambios de `MyLitterActions`, `YoungCard`,
  `InboxPetCard`, `LitterSheet`, `PetStatusActions`; se borra la fila de `LitterYoungSummary`.
- `docs/known-limitations.md`: nada nuevo previsto.
- `docs/07-stack.md`: nada (R13). `docs/03`: la historia no trae decisiones del enjambre.

## Project Structure

### Documentation (this feature)

```text
specs/026-camadas-mantener-al-dia/
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
supabase/migrations/<ts>_litter_lifecycle.sql   columnas, triggers, funciones (data-model.md)
supabase/seed.sql                               la camada sembrada con una cría en proceso, una
                                                adoptada y solicitudes para el walk
src/lib/supabase/types.ts                       regenerado con pnpm db:types
src/lib/supabase/queries/litter-status.ts       nuevo
src/lib/supabase/queries/litters.ts             estados, vencimiento, getMyLitter
src/lib/supabase/queries/application-responses.ts, applications.ts, adoptions.ts,
  follow-ups.ts, application-response-records.ts, pet-renewal.ts   litter_name, camadas
src/lib/litters/lifecycle.ts (+ .test.ts)       nuevo
src/lib/litters/litter-words.ts (+ test)        youngLabel
src/lib/litters/paths.ts                        litterPanelPath
src/lib/applications/inbox-groups.ts (+ test)   nuevo
src/lib/schemas/litter-status.ts (+ test)       nuevo
src/lib/analytics/                              la marca litter en los eventos (R12)
src/lib/email/send-litter-reminder.ts           nuevo; send-application-notice, commitment,
                                                follow-up con youngLabel
src/hooks/use-pet-status.ts                     recibe la acción y el sujeto (R10)
src/actions/litter-status.ts                    nuevo
src/actions/litters.ts                          deleteLitter con avisos
src/actions/adoptions.ts, application-responses.ts   vuelta y marca de una cría
src/components/litters/                         los nuevos de §Diseño
src/components/pets/                            StatusActionList, PetStatusActions
src/components/applications/                    InboxLitterGroup, InboxPetCard, nombres de camada
src/app/[locale]/(app)/mis-animales/            page, camadas/[id]/ (nuevo), [id]/adoptado
src/app/[locale]/(app)/solicitudes/             page, animal/[petId]
src/app/[locale]/(app)/mis-solicitudes/         la camada en la lista y en la solicitud
src/app/[locale]/(public)/camadas/[code]/       estados, imagen
src/app/[locale]/(public)/sigue-disponible/     camada
src/app/[locale]/(app)/solicitar/[code]/        cría adoptada
src/app/api/cron/publicaciones/route.ts         recordatorios y vencimientos de camadas
messages/es.json                                litters.*
tests/db/litter-lifecycle.test.ts, litter-renewal.test.ts, litter-lifecycle-privacy.test.ts
tests/e2e/camada-vida.spec.ts
```

## Complexity Tracking

Vacío: ninguna violación de la constitución.

## Para Ship

- Fuera de alcance que puede aparecer en la revisión: la guía «/preguntas» (#222) no cuenta los
  estados de una camada; la portada no tiene un paso propio para camadas. Son de una historia de
  contenido.
