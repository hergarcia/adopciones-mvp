# Implementation Plan: Publicar una camada: las crías de una madre en una sola publicación

**Branch**: `feature/205-publicar-una-camada` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/025-publicar-una-camada/spec.md` (5 user stories, una pasada adversaria; lo que
quedó abierto está en sus Assumptions). Decisiones técnicas con alternativas en
[research.md](./research.md); tablas y funciones en [data-model.md](./data-model.md); rutas y
acciones en [contracts/routes.md](./contracts/routes.md).

## Summary

Una camada es una fila nueva (`litters`) con lo común y su enlace, y cada cría es un animal de
`pets` que apunta a su camada y lleva lo común copiado (research R1). Así pedir una cría es pedir un
animal: el cuestionario, las solicitudes, sus cierres y lo que #206 construya por cría funcionan
sin tocarlos. Lo nuevo es: publicar y editar la camada en una transacción idempotente (R6), su
ficha en `/camadas/{code}` con su vista previa (R3, R5), el listado que mezcla animales sueltos y
camadas en un solo orden (R4), el grupo en «Mis animales», la entrada en «Publicaciones por
revisar» (R8), la pregunta inicial de «Publicar un animal» con el paso de una cría sola a un animal
(R9), el borrador (R10) y la medición (R11). Las crías no vencen ni cambian de estado hasta #206
(R2).

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router), React 19
**Primary Dependencies**: Supabase (Postgres, Auth, Storage, RLS), next-intl, zod, Radix, Motion,
`next/og`. Sin dependencias nuevas (R12).
**Storage**: Postgres con una migración nueva; fotos en el bucket `pet-photos` de siempre.
**Testing**: Vitest (unit, gates y `tests/db` contra Supabase local), Playwright contra `next start`,
Stryker al 100 % sobre lo que tiene test.
**Target Platform**: web móvil primero (390 px), servidor Node local hasta el MVP.
**Performance Goals**: LCP < 2,5 s en la ficha de la camada (SC-004), JS inicial < 150 KB,
Lighthouse mobile ≥ 90. La ficha y la tarjeta son Server Components; el formulario de la camada es
la única hoja cliente grande, como el de un animal.
**Constraints**: ningún string fuera de `messages/es.json`; ningún valor fuera de los tokens de
`docs/10`; cada regla de visibilidad en la base con su test.
**Scale/Scope**: hasta 10 crías por camada, 5 fotos por camada y 5 por cría (55 fotos como techo).

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | spec sin tablas ni rutas; el cómo vive acá |
| II. Una feature, un PR | 5 user stories que se construyen y verifican una por una |
| III. Compuertas | `pnpm gates:affected` por user story, `pnpm verify` al cerrar; tests de lo que importa (§Qué se testea) |
| IV. Reglas como código | las reglas de nombres repetidos, 2–10 crías, fecha y visibilidad viven en la base y en el schema, con test |
| V. Datos personales | ningún dato personal nuevo (FR-046); visibilidad en funciones `security definer` + RLS de dueña + policy de storage, con `tests/db/litters-privacy.test.ts` |
| VI. Sin deriva | estados por cría, vencimiento, bandeja por camada y avisos de cierre quedan en #206 |
| VII. Liviana y linda | Server Components, componentes del sistema reusados, §Diseño |
| VIII. Autonomía con veto | sin plata, nombre ni indexación en juego |

Sin violaciones: Complexity Tracking queda vacío.

## Diseño

Cargado `frontend-design:frontend-design` y leído `docs/10-design-system.md`. Todo con tokens y
componentes existentes; lo nuevo se suma a la tabla de componentes de `docs/10` en este PR.

### Tokens que se usan

`--color-canvas`, `--color-surface`, `--color-line`, `--color-ink`, `--color-ink-muted`,
`--color-primary` (la chapita del publicador), `--color-accent` (solo «Urgente» y errores),
`--color-warning`/`-soft` (aviso de la dueña sin teléfono confirmado); `--text-sm` a `--text-3xl`,
`.afiche` para el nombre de la camada y los títulos; `--space-*`; `.cinta-esquinas` en la tarjeta,
`.perforado` en la tirita de publicar; `--dur-fast`/`--dur-base` en lo tocable. Nada nuevo en
`globals.css`.

### Lo que llama la atención, uno por pantalla

- Publicar: la tirita «Publicar la camada» al pie (`PetSaveFooter`, como la de un animal).
- Ficha de la camada: la foto de portada con el nombre en voz de afiche. **No hay tirita**: cada
  cría tiene su «Quiero adoptar» y una tirita por pantalla no puede repetirse diez veces; los
  botones de las crías van en `Button` `primary` `md`. Se registra como decisión en `docs/10`
  (fila de `ApplyAction`).
- Listado: igual que hoy; la tarjeta de la camada no grita más que la de un animal.

### «¿Es un animal o una camada?» · `/mis-animales/publicar`

```
┌──────────────────────────────┐
│ Publicar                     │  ← .afiche --text-2xl
│ ¿Es un animal o una camada?  │
│                              │
│ ┌──────────────────────────┐ │  ← LinkButton secondary lg, ancho completo
│ │ Un animal                │ │
│ └──────────────────────────┘ │
│  Uno solo, con sus fotos.    │  ← --text-sm ink-muted
│ ┌──────────────────────────┐ │
│ │ Una camada               │ │
│ └──────────────────────────┘ │
│  Crías de una misma madre,   │
│  de 2 a 10, publicadas juntas│
└──────────────────────────────┘
```

Componente nuevo `PublishKindChoice` (pets): dos enlaces, sin JavaScript. Estados: no tiene datos;
el cargando es el `loading.tsx` de la ruta (`PetFormSkeleton`).

### Publicar o editar una camada

```
┌──────────────────────────────┐
│ Publicar una camada          │  ← .afiche --text-2xl
│ [DraftRestoredNote]          │
│                              │
│ La camada                    │  ← --text-xl
│ [PetPhotosField 1–5]         │  ← invitación «Agregá fotos» con cinta
│ Nombre de la camada  0/30    │  ← PetNameField, ayuda «Por ejemplo: La camada de Luna»
│ [PetTraitsFields]            │  ← especie, edad, tamaño, castrado, vacunas, chip,
│                              │    convivencia, descripción 2000, zona, urgente
│                              │
│ Las crías                    │  ← --text-xl  + «4 de 10» --text-sm ink-muted
│ ┌──────────────────────────┐ │  ← YoungFields, borde --color-line, una por cría
│ │ Nombre      Cría 1  0/30 │ │
│ │ Sexo   ( ) Macho ( ) Hem │ │  ← RadioGroup
│ │ Descripción (opcional)   │ │  ← CountedTextarea 300
│ │ [PetPhotosField 0–5]     │ │  ← compacto, sin invitación grande
│ │ Quitar cría              │ │  ← Button ghost-danger sm
│ └──────────────────────────┘ │
│ ┌ … Cría 2 … ┐               │
│ [Agregar cría]               │  ← Button secondary md; con 10, deshabilitado + «Hasta 10»
│                              │
│ Para pedir                   │  ← --text-xl
│ [RequiredLevelField]         │
│ Desde cuándo se entregan     │  ← DeliveryDateField (input date nativo, opcional)
│                              │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ [ PUBLICAR LA CAMADA ]       │  ← PetSaveFooter tirita
└──────────────────────────────┘
```

- Reusa: `PetPhotosField`, `PetPhotoTile`, `PetNameField`, `AgeField`, `ZoneFields`,
  `RequiredLevelField`, `CountedTextarea`, `RadioGroup`, `DraftRestoredNote`, `PublishProgress`,
  `PetSaveFooter`, `PetFormDialogs`, `DuplicateNameDialog`, `SaveBlockedDialog`,
  `SaveFailedStrip`, `LeavingDialog`, `DestructiveConfirmDialog`.
- **Se extrae** de `PetFields` la parte común a `PetTraitsFields` (especie, edad, tamaño, salud,
  convivencia, descripción, zona, urgente), que usan `PetFields` y `LitterForm`. `PetFields` queda
  como `PetTraitsFields` + nombre + sexo. Extraer a la segunda repetición (CLAUDE.md regla 2).
- Nuevos (litters): `LitterForm`, `YoungFields`, `YoungList`, `AddYoungButton`,
  `DeliveryDateField` (forms), `RemoveYoungDialog` (sobre `DestructiveConfirmDialog`: «Se cierran 2
  solicitudes» o «La camada se borra»), `SingleYoungDialog` (sobre `ChoiceDialog`: «Una camada lleva
  al menos 2» con «Publicarla como un animal» y «Agregar otra cría»).
- Estados: vacío (dos crías en blanco, zona del perfil, invitación de foto); preparando fotos;
  errores por campo con el mismo `field-error` de #53, y el campo que falla de una cría se marca en
  esa cría con su nombre en el resumen; guardando (`PublishProgress`); falla de conexión
  (`SaveFailedStrip`, nada se pierde); éxito → `PetSavedNotice` en «Mis animales».

### Ficha de la camada · `/camadas/{code}`

```
┌──────────────────────────────┐
│ [PetGallery: fotos camada]   │  ← 4:5 a sangre, portada primero (LCP)
│ La camada de Luna            │  ← .afiche --text-3xl
│ 4 crías, 4 disponibles       │  ← LitterCountLine --text-lg
│ Urgente                      │  ← tag acento, si aplica
│ Pocitos, Montevideo          │  ← zona y fecha como PetHeadline
│ Publicada hace 2 días        │
│ Se entregan desde el 3 nov.  │  ← DeliveryDateLine, si no pasó
│ [IdentityRequiredNote]       │  ← la de la ficha de un animal, si pide identidad
│ [PetFacts]                   │  ← sin sexo: lo dice cada cría
│ Descripción…                 │
│ [OwnerCard publicador]       │
│ [Compartir]  [Editar]*       │  ← * solo la dueña
│                              │
│ Las crías                    │  ← --text-xl
│ ┌───────────┐ ┌───────────┐  │  ← PetWall wall: 2 columnas en 390, 3 desde md
│ │ [foto 4:5]│ │ [foto 4:5]│  │  ← YoungCard: PetPhoto (propia o de la camada)
│ │ Cría 1    │ │ Cría 2    │  │  ← --text-lg .afiche
│ │ Hembra    │ │ Macho     │  │  ← --text-sm ink-muted
│ │ Descr. 300│ │           │  │  ← --text-sm
│ │[Quiero    │ │[Quiero    │  │  ← Button primary md; la dueña no lo ve
│ │ adoptar]  │ │ adoptar]  │  │
│ └───────────┘ └───────────┘  │
└──────────────────────────────┘
```

- Reusa: `PetGallery`, `PetPhoto`, `PetFacts`, `PetHeadline` (o su parte de zona y fecha),
  `OwnerCard`, `VerificationBadge`, el aviso de identidad exigida de la ficha de un animal,
  `ApplyAction` (con variante sin tirita, ver arriba), el botón de compartir de la ficha,
  `HiddenFromPublicNotice` para la dueña sin teléfono confirmado, `PetWall`.
- Nuevos (litters): `LitterSheet`, `LitterCountLine`, `DeliveryDateLine`, `YoungCard`.
  Una cría con varias fotos propias muestra su portada en `YoungCard`; tocar la foto no abre nada
  (sin ficha propia, FR-034).
- El botón de cada cría lleva a `/solicitar/{código de la cría}?camada={código de la camada}`: si
  la cría se quitó, el cuestionario dice que esa cría ya no está y ofrece volver a la ficha de la
  camada, sin perder lo respondido (FR-032).
- Estados: la ficha es Server Component; cargando = `loading.tsx` con `Skeleton` de galería y
  título; error = `error.tsx` de la ruta (`ErrorScreen`); no aplica vacío (al menos una cría).
- **No disponible por ahora** y **no publicada**: `PetUnavailable` y `PetNotFound` reciben sus
  textos por props (hoy los leen de `pets.*`); la camada pasa los de `litters.page.*`. Bloqueado:
  la pantalla de bloqueo de la ficha de un animal (`blocked-pet-screen`) con los textos de la
  camada.

### Tarjeta de la camada en el listado y en la portada

`PetCard` tal cual: foto 4:5 con `.cinta-esquinas`, nombre, zona y «Urgente». La línea de resumen
(«Perra, 8 años, grande» en un animal) dice el recuento: «4 crías, 4 disponibles». La arma
`listed-card-view.ts` según `kind`; el `href` va a `/camadas/{code}`. Sin componente nuevo.

### Mis animales (cambia)

```
┌──────────────────────────────┐
│ [PetCard camada]  [PetCard]  │  ← la pared de siempre, por fecha de publicación
│ 4 crías                      │
│ Cría 1, hembra               │  ← LitterYoungSummary: lista en texto, sin miniaturas
│ Cría 2, macho …              │
│ [Ver ficha][Compartir][Editar]│ ← MyLitterActions, mismas formas que MyPetActions
└──────────────────────────────┘
```

- Nuevos (litters): `LitterYoungSummary`, `MyLitterActions`. `MyPetsGrid` recibe animales y
  camadas ya mezclados por fecha. Sin las acciones de estado de un animal (#206).
- La dueña sin teléfono confirmado: el aviso que ya muestra «Mis animales» cubre también las camadas.

### Publicaciones por revisar (cambia)

`PetReviewItem` con `kind`: en una camada, debajo de lo común, una lista de sus crías con nombre,
sexo, descripción y sus fotos en la misma tira de fotos del ítem. `PetReviewDecision` sin cambios
de forma; llama a `resolve_litter_review` cuando el ítem es una camada.

### Vista previa (1200 × 630)

`PetShareImage` con la portada, el nombre de la camada y la zona. Sin cambios de diseño.

### Textos

Namespace nuevo `litters` en `messages/es.json` (`choice`, `form`, `young`, `page`, `card`,
`my`, `review`, `errors`, `meta`), con plurales ICU para «{count, plural, one {# cría} other
{# crías}}». Se escriben y revisan con el skill `sin-slop`. «Camada» y «cría»; nunca «cachorro» ni
«gatito» (FR-051), con un test de gate que lo busca en `litters.*`.

## Qué se testea (y qué no)

Se testea lo que, si se rompe, expone una camada que no debe verse, deja pedir lo que no se puede
o calcula mal un recuento (docs/09 §Qué vale la pena testear).

- `tests/db/litters-privacy.test.ts` (FR-022 a FR-026, SC-003): anónimo, persona cualquiera,
  bloqueada y dueña contra `litter_by_code`, `litter_share_card`, `listed_pets` y las fotos en
  storage, con publicador sin nivel 1, suspendido, dada de baja e inexistente; lectura directa de
  `litters` y de las crías por otra persona: nada.
- `tests/db/litters-rules.test.ts`: publicar idempotente (mismo intento → una camada, misma cría
  con su `key` → una fila, SC-005); 1 y 11 crías rechazadas al publicar; nombres repetidos (también
  con mayúsculas y espacios) rechazados e intercambio de nombres aceptado; fecha pasada rechazada y
  la vieja aceptada si no cambió; editar copia lo común a cada cría; quitar una cría cierra sus
  solicitudes y `preview_litter_removal` da el número; `delete_litter` borra todo; editar una
  revisada la vuelve a la cola; la baja pasa a cada cría y cierra sus solicitudes; las funciones
  del ciclo de vida rechazan una cría; borrar la cuenta borra camadas, crías y fotos.
- `tests/db/listed-pets.test.ts` (se amplía): una fila por camada, `young_count` y
  `available_count`, el total cuenta la camada como una (SC-002), filtro de sexo por cría,
  los demás por la camada, las crías nunca como animal suelto, cursor estable con las dos mezcladas.
- `tests/db/applications-*.test.ts` (se amplía uno): pedir una cría con el nivel de la camada
  funciona; la dueña no puede pedir la suya; una cría de una camada que no está a la vista o dada de
  baja no se puede pedir.
- Unit, con Stryker al 100 %: `lib/schemas/litter.ts` (límites, crías 2–10/1–10, fecha, vías de
  contacto en cada texto); `lib/litters/young-names.ts` (próximo «Cría N» libre, repetidos
  normalizados); `lib/litters/delivery-date.ts` (visible hasta el final del día de Uruguay);
  `lib/litters/single-young-seed.ts` (lo propio primero, lo común de respaldo, sin fecha);
  `lib/pets/listed-card-view.ts` (la línea de recuento y el `href` por `kind`); el conteo de
  `ordinal` que suma camadas una vez.
- E2E `tests/e2e/camada.spec.ts`: el camino feliz de US1 a US3 (publicar 4 crías → grupo en «Mis
  animales» → tarjeta «4 crías, 4 disponibles» → ficha sin sesión con una cría sin fotos que muestra
  las de la camada → «Quiero adoptar» llega al cuestionario de esa cría) y una sola cría ofrece
  pasar a un animal con lo cargado.
- `tests/e2e/animales-rendimiento.spec.ts` (se amplía): la ficha de una camada de 10 crías cumple
  LCP < 2,5 s con la red de un teléfono de gama media y el mismo peso de apertura que la ficha de
  un animal (SC-004). `.lighthouserc.json` mide solo la portada (KL-57-3) y no se toca.
- No se testea: las páginas, los componentes que solo pintan, las consultas finas, la imagen de la
  vista previa (la cubre el test de `litter_share_card`).

## Docs que cambian en este PR

- `docs/03-mvp-features.md`: las decisiones de la historia (hechas en Spec).
- `docs/06-i18n.md`: «camada» y «cría» en el glosario (hecho en Spec).
- `docs/10-design-system.md`: filas nuevas (`PublishKindChoice`, `LitterForm`, `YoungFields`,
  `YoungList`, `AddYoungButton`, `DeliveryDateField`, `RemoveYoungDialog`, `SingleYoungDialog`,
  `LitterSheet`, `LitterCountLine`, `DeliveryDateLine`, `YoungCard`, `LitterYoungSummary`,
  `MyLitterActions`, `PetTraitsFields`), los cambios de `PetCard`, `PetFields`, `PetUnavailable`,
  `PetNotFound`, `PetReviewItem`, `MyPetsGrid`, y la decisión de que la ficha de una camada no
  tiene tirita.
- `docs/07-stack.md`: nada (R12).

## Project Structure

### Documentation (this feature)

```text
specs/025-publicar-una-camada/
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
supabase/migrations/<ts>_litters.sql          tablas, funciones, policies (data-model.md)
supabase/seed.sql                             una camada sembrada de 4 crías para el walk
src/lib/supabase/types.ts                     regenerado con pnpm db:types
src/lib/supabase/queries/litters.ts           nuevo
src/lib/supabase/queries/listed-pets.ts       kind, young_count, available_count
src/lib/supabase/queries/pet-reviews.ts       camadas en la cola
src/lib/supabase/queries/pets.ts              countMyPublications; litter_code en pet_by_code
src/lib/schemas/litter.ts (+ .test.ts)        nuevo
src/lib/litters/                              young-names, delivery-date, single-young-seed,
                                              paths (+ tests), types
src/lib/pets/listed-card-view.ts              la línea de recuento por kind
src/lib/analytics/events.ts                   litter y young en los momentos (R11)
src/hooks/use-litter-draft.ts                 o useFormDraft compartido (R10)
src/actions/litters.ts                        nuevo (contracts/routes.md)
src/actions/pets.ts                           ordinal con camadas
src/actions/pet-review.ts                     resolver una camada
src/components/litters/                       los componentes nuevos de §Diseño
src/components/pets/                          PetTraitsFields, PublishKindChoice, cambios citados
src/app/[locale]/(app)/mis-animales/publicar/ la pregunta y PublishFlow
src/app/[locale]/(app)/mis-animales/camadas/[id]/editar/
src/app/[locale]/(app)/mis-animales/page.tsx  camadas en la pared
src/app/[locale]/(public)/camadas/[code]/     page, layout, loading, error, imagen/route.tsx
src/app/[locale]/(public)/animales/[code]/    redirige una cría a su camada
messages/es.json                              namespace litters
tests/db/litters-privacy.test.ts, litters-rules.test.ts, litter-support.ts
tests/e2e/camada.spec.ts
```

## Complexity Tracking

Vacío: ninguna violación de la constitución.

## Para Ship

- Fuera de alcance que puede aparecer en la revisión: la guía «/preguntas» (#222) no explica cómo
  publicar una camada; los avisos a quienes pidieron una cría que se quitó; la bandeja por camada.
  Todo es de #206 o de una historia de contenido.
