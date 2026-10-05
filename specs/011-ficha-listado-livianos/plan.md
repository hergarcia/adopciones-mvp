# Implementation Plan: Que la ficha y el listado de animales abran livianos en el teléfono

**Branch**: `feature/95-ficha-listado-livianos` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/011-ficha-listado-livianos/spec.md` (3 user stories). Decisiones técnicas y la
medición de partida en [research.md](./research.md) (R0–R7). Sin data-model ni contratos: la historia
no toca la base, ni rutas, ni acciones.

## Summary

Hoy la ficha baja 188 KB de JavaScript para abrir y el listado 167, contra los 150 de docs/07. Al
terminar, las dos (y las pantallas de animal no disponible) abren con 150 KB o menos, lo que solo
hace falta después de un toque llega solo apenas la pantalla abrió, y la prueba de rendimiento
falla si cualquiera vuelve a pasarse.

Cuatro decisiones ordenan el plan:

1. **Se mide primero, y se mide igual que se va a frenar** (R1, R6, R7): el freno nuevo corre sobre
   `main` antes de tocar nada; sus valores de partida son los topes del peso total. Peso de apertura =
   scripts pedidos antes de `loadEventEnd`.
2. **Los textos de error de `animales/` viajan en el HTML** (R2), con el contexto de tres strings que
   ya usa el perfil público, y next-intl deja de bajar al navegador en la ficha y el listado.
3. **Una sola forma de «después de abrir»** (R3): `afterOpen()` + `useAfterOpen(load)`, y hojas
   cliente partidas en cáscara (el mismo HTML de hoy, inerte) y parte viva (`import()` dinámico).
   «Compartir» con su aviso, copiar a mano y su medición es la primera y la que más pesa.
4. **Palancas en orden, medidas de a una** (R4, R5): el motor del listado, las hojas chicas de la
   ficha y las pantallas de error públicas se difieren solo si hace falta para entrar con 2 KB de
   aire.

## Technical Context

**Language/Version**: TypeScript 7 (`strict`), React 19.3, Next.js 16.3 (App Router, Turbopack).

**Primary Dependencies**: las de `main`. **Ninguna nueva y ninguna se saca**: `next-intl` y
`@radix-ui/react-toast` siguen; solo dejan de estar en la apertura de estas pantallas.

**Storage**: no aplica.

**Testing**: Playwright contra `next start` (el freno y los flujos de «Compartir» sin señal). Vitest
solo para `afterOpen` si su lógica pasa de un `if` (ver §Qué se testea).

**Target Platform**: web, mobile-first a 390 px, con la red y la CPU de `throttleLikeAPhone`.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: peso de apertura ≤ 150 KB en ficha, no disponible y listado; peso total ≤ el
de partida; portada ≤ la de partida; LCP < 2,5 s y CLS < 0,05 como hoy; «Compartir» a la vista ≤ 1,5
s después de `load`.

**Constraints**: nada visible cambia; sin JavaScript todo funciona como hoy (FR-010); Lighthouse no
se toca (KL-57-3); sin Vercel.

**Scale/Scope**: 0 pantallas nuevas, 1 layout nuevo (`animales/[code]/layout.tsx`), 1 hook y 1
función nuevos, 1 componente partido en dos (`ShareButton`), hasta 4 más según R6, 2 pruebas e2e.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra chunks ni componentes; el cómo está acá y en research.md. |
| **II. Una feature, un PR** | Tres user stories en un PR: P1 ficha, P2 listado, P3 freno. El freno se escribe primero (T001) porque mide todo lo demás, y se cierra en US3. |
| **III. Compuertas verdes** | `pnpm verify` completo. El freno es e2e y corre en `pnpm e2e`; no se afloja ningún umbral existente, se suma uno. |
| **IV. Reglas como código** | El presupuesto de 150 KB de la ficha y el listado pasa de prosa (docs/07) y anotación a una afirmación que falla. |
| **V. Datos personales** | No se guarda ni se muestra nada nuevo; la medición de «Compartir» manda lo mismo que hoy. |
| **VI. Sin deriva** | Nada de «Fuera del MVP». Lo que la historia deja afuera (Lighthouse, Mis animales, KL-57-2, KL-57-8, analítica) queda afuera. |
| **VII. Liviana y linda** | Es la historia. `"use client"` sigue en la hoja más chica, y ahora la hoja se parte en lo que hace falta al abrir y lo que no. |
| **VIII. Autonomía con veto** | Se decide y se avisa en Ship, en un `aviso`: la medición hasta `load` con tope del total (R1), el patrón «después de abrir» (R3), «Compartir» que aparece cuando puede avisar. Nada reservado. |

**Sin violaciones**: Complexity Tracking vacío.

## Diseño

Guía: `docs/10-design-system.md`, identidad «Cartel». **No hay pantalla nueva ni cambio visual**:
la regla de la historia es que todo se ve y se usa igual. El skill `frontend-design:frontend-design`
no está disponible en esta sesión; el criterio visual de esta historia es «igual que `main`», y el
design-reviewer lo verifica comparando capturas de `main` y de la rama.

- **Wireframes**: no aplica; las tres pantallas (ficha, no disponible, listado) quedan como las dejó
  #59. Las capturas de `walk.mjs` a 390 y 1280 antes y después son la referencia.
- **Componentes reusados**: `Button` (la cáscara de «Compartir» es el mismo `Button` invisible de
  hoy), `Toast`/`ToastProvider`, `Sheet` (copiar a mano), `ErrorScreen`, `LinkButton`,
  `GalleryPosition`, `PetWall`, `ListingFilters`, `LoadMoreButton`. **Ninguno nuevo en `ui/`.**
- **Tokens**: ninguno nuevo; los de hoy.
- **Lo que llama la atención**: lo mismo que hoy: la foto de portada de la ficha; en el listado, la
  pared.
- **Tres estados de cada bloque con datos**: los de hoy (spec §Pantallas). Lo único nuevo es un
  instante en que «Compartir» todavía no está, que ya existe hoy entre que la página aparece y que
  hidrata: su lugar está reservado y aparece sin mover nada (FR-012). La pantalla de error de
  `animales/` dice lo mismo que hoy, ahora desde `PublicErrorCopy`.

## Cómo se aliviana cada pantalla

### Ficha · `/animales/{code}` y pantallas de animal no disponible

```
page.tsx (server)
├─ PageShell
│  ├─ StaleImagesRefresh   ← R5.1: cáscara + useAfterOpen, si hace falta
│  └─ PetSheet (server)
│     ├─ PetGallery (server) → PetPhoto (client, se queda) · GalleryPosition ← R5.1
│     └─ actions → ShareButton (client, cáscara) ──after open──► ShareButtonLive
│                                                               ├─ ToastProvider region="own" + Toast
│                                                               ├─ ShareManualSheet (Sheet)
│                                                               └─ trackShare
└─ (sin ToastProvider en la página)
animales/[code]/layout.tsx (nuevo) → PublicErrorCopyProvider { title, body: page.load_error,
                                                               retry, toListing }
animales/[code]/error.tsx → usePublicErrorCopy() → ErrorScreen + LinkButton
```

### Listado · `/animales`

```
page.tsx (server) → ListingController (client: la vista, hidrata como hoy)
                     └─ useListing(…) ── engine === null → hydrated=false: GET + enlace (camino sin JS)
                                     └─ after open ─► listing-engine (reducer, pedidos, snapshot,
                                                       dirección) → hydrated=true          ← R4
animales/layout.tsx → PublicErrorCopyProvider { title, body: listing.load_error, retry }
animales/error.tsx → usePublicErrorCopy() → ErrorScreen
```

### Portada

Sin cambios, salvo que R5.2 la aliviane (las pantallas de error públicas después de abrir).

**Cambios durante la construcción de US1** (2026-10-05):

- `ShareButton` recibe `region="own"` junto con `toast: { label, region }` (las etiquetas de
  `common.toast`), en una unión de props; Mis animales sigue sin pasar nada (`'page'`). La región
  propia se monta con un portal en `document.body`: adentro del renglón de acciones, el `div` de la
  región de Radix sumaba un hueco al aparecer.
- R5.2 se hizo con `PublicErrorScreen` (`_components/public-error-screen.tsx`), que los tres
  `error.tsx` públicos usan; el módulo pide la pantalla después de abrir aunque nada falle, para que
  un error con la señal cortada se vea igual (FR-014). **Descartado en la revisión (2026-10-05):**
  mientras el módulo no llegaba el límite no dibujaba nada —tampoco en el HTML del servidor—, y si
  no llegaba la hoja quedaba en blanco y sin «Reintentar». Los tres `error.tsx` vuelven a dibujar
  `ErrorScreen` desde el primer momento; la ficha abre en 149,6 KB (research §R6, Revisión).
- Volver al listado desde una ficha reponía la posición antes de que React dibujara lo repuesto, y
  el navegador la recortaba a la primera tanda; con la ficha más liviana pasaba casi siempre (el
  flujo 2 de `animales.spec.ts` fallaba a la mitad). `useListing` repone la posición cuando las cards
  repuestas ya están en la página.

**Cambios durante la construcción de US2** (2026-10-05):

- El motor solo no alcanzaba: partido como pedía R4, el listado bajaba 0,3 KB, porque la vista
  seguía importando `listing-query` y `listing-state` (Turbopack los junta en un solo módulo) y
  sumaba `afterOpen`. Lo que pesa es la vista entera (filtros, pared, vacío, «Ver más»). Así que llega
  **todo `ListingController`** después de abrir, sin desmontar nada: `ListingShell`
  (`animales/_components/listing-shell.tsx`) lo envuelve en `<Activity>` con un `lazy` que espera a
  `afterOpen()`. `Activity` es un límite de hidratación: hasta que llega el código, React deja el HTML
  del servidor tal cual (el formulario GET y «Ver más» como enlace) y después lo hidrata en el lugar.
  No es `Suspense`: React manda aparte, oculto hasta que corre JavaScript, el contenido de un
  `Suspense` de más de 12,8 KB, y sin JavaScript el listado no se vería. En el servidor el `import()`
  se pide al cargar el módulo, y el HTML sale entero desde el primer pedido. `useListing` no cambia
  de forma; el motor no se separa (`listing-engine.ts` no existe).
- Un toque en un filtro antes de que llegue marca la casilla en el HTML del servidor; al llegar,
  `useListing` lee el formulario y, si dice otros filtros, los aplica (FR-011). Si no llega (el
  `import()` falla), `ListingShell` marca `data-later-failed` en `<html>` y «Ver resultados», que con
  JavaScript estaba escondido, aparece: el listado queda como sin JavaScript, en lugar de la pantalla
  de error que daría el `lazy` sin `catch`.
- La prueba 3 se parte en dos: con lo de después demorado, el filtro tocado antes se aplica cuando
  llega; con lo de después cortado, se filtra con «Ver resultados» y «Ver más» es el enlace.

## Qué se testea (y qué no)

Según `docs/09` §Qué vale la pena testear: lo que, si se rompe, engaña a una persona o calcula mal.

**Se testea:**

1. **El freno** (`tests/e2e/animales-rendimiento.spec.ts`, R7): peso de apertura ≤ 150 KB en la
   ficha a la vista, la ficha de un código que no existe, el listado sin filtros y con un filtro, y
   la portada, y la ficha y el listado otra vez con sesión (la cabecera con sesión puede sumar);
   los demás estados de la ficha (adoptada, en proceso, oculta para su publicador) cambian solo el
   HTML del servidor y no las hojas cliente, así que la ficha a la vista y la de un código que no
   existe los representan; peso total ≤ partida en ficha y listado; mensajes con la pantalla y los KB de más;
   LCP y CLS como hoy; «Compartir» a la vista ≤ 1,5 s después de `load`. Es la regla de la historia
   hecha código (FR-016 a FR-019).
2. **«Compartir» sin señal después de abrir** (en `tests/e2e/animales.spec.ts`, que ya tiene los
   flujos de compartir): en una computadora, abrir la ficha, esperar «Compartir», cortar la red
   (`context.setOffline(true)`), tocar y ver «Enlace copiado»; con el permiso de copiar negado, ver
   el camino de copiar a mano. Si se rompe, «Compartir» queda mudo para quien más lo usa (decisión
   de la historia, FR-007, SC-007).
3. **El toque antes de que llegue lo de después** (mismo archivo): abrir el listado bloqueando los
   chunks pedidos después de `load` (`page.route` que aborta `/_next/static/chunks/**` una vez que
   la página cargó), elegir un departamento y aplicar: la dirección y los resultados traen el
   filtro. En la ficha, con lo mismo bloqueado, «Compartir» no está a la vista. Si se rompe, un
   toque se pierde (FR-011, FR-012).

**No se testea:** que «tocó Compartir» se siga registrando (FR-020): hoy no tiene test, la
llamada se muda tal cual a `ShareButtonLive` y la revisa code-reviewer; `useAfterOpen` y las cáscaras (se ven en los e2e de arriba; un test unitario de un
`useEffect` que llama a `import()` no prueba nada que el e2e no pruebe), el layout nuevo y los
`error.tsx` (piezas de página; el design-reviewer recorre la pantalla de error), los componentes que
solo pintan. `afterOpen()` lleva un test de Vitest solo si incorpora una decisión (por ejemplo,
qué hacer si `load` ya pasó); si es un `if` sobre `document.readyState`, no. Las pruebas de hoy de la
ficha, el listado y «Compartir» (`animales.spec.ts`, sin JavaScript incluido) se corren sin cambiar
lo que comprueban (SC-006).

**Mutación**: lo que tenga test unitario nuevo, al 100 %. Las e2e no entran en Stryker.

## Docs que cambian en este PR

- `docs/07-stack.md` §Presupuesto de performance: las dos decisiones del 2026-10-04 (ya en la rama)
  y una **Decisión (2026-10-05, enjambre)** con la medición (R1: apertura hasta `loadEventEnd`, total
  con tope, en la prueba de rendimiento mientras Lighthouse no mida estas pantallas) y la regla «lo
  que solo hace falta después de un toque llega después de abrir, con `useAfterOpen`».
- `docs/08-convenciones-codigo.md`: una línea en la sección de componentes cliente: una hoja que
  solo hace falta después de un toque se parte en cáscara + parte viva con `useAfterOpen`; nunca
  `next/dynamic` para eso (precarga).
- `docs/03-mvp-features.md` §Decisiones: la decisión de analítica del 2026-10-04 (ya en la rama).
- `docs/known-limitations.md`: KL-57-4 pasa a «(resuelta)» con la historia #95 y los valores
  finales. Si R5.2 no alcanzó y alguna palanca descartada queda pendiente (tailwind-merge), entra
  como nota de la misma KL, no como una nueva.
- Comentarios que mienten después del cambio: el de `ShareButton` («El `ToastProvider` lo pone la
  página»), el de `animales/layout.tsx`, el de `ErrorTextsProvider` y el de
  `animales-rendimiento.spec.ts`.

## Project Structure

### Documentation (this feature)

```
specs/011-ficha-listado-livianos/
├── story.md
├── spec.md
├── checklists/requirements.md
├── research.md
├── plan.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```
src/
  hooks/use-after-open.ts                                     nuevo: afterOpen() y useAfterOpen(load)
  components/pets/share-button.tsx                            cáscara
  components/pets/share-button-live.tsx                       nuevo: el ShareButton de hoy + región
  components/pets/gallery-position.tsx                        R5.1, si hace falta
  app/[locale]/_components/public-error-copy.tsx              + toListing?
  app/[locale]/_components/error-texts-provider.tsx           − claves de animales
  app/[locale]/_components/stale-images-refresh.tsx           R5.1, si hace falta
  app/[locale]/(public)/error.tsx                             R5.2, si hace falta
  app/[locale]/(public)/animales/layout.tsx                   PublicErrorCopyProvider
  app/[locale]/(public)/animales/error.tsx                    usePublicErrorCopy
  app/[locale]/(public)/animales/[code]/layout.tsx            nuevo
  app/[locale]/(public)/animales/[code]/error.tsx             usePublicErrorCopy
  app/[locale]/(public)/animales/[code]/page.tsx              sin ToastProvider
  app/[locale]/(public)/animales/_components/listing-engine.ts  R4, si hace falta
  hooks/use-listing.ts                                        R4, si hace falta
tests/e2e/
  support/web-vitals.ts                                       + scriptWeight(page)
  animales-rendimiento.spec.ts                                el freno
  animales.spec.ts                                            + sin señal, + toque temprano
```

## Complexity Tracking

Vacío.

## Para Ship

- `aviso` con: R1 (medición hasta `load`, total con tope), R3 (patrón después de abrir), «Compartir»
  que aparece cuando puede avisar, y qué palancas de R6 se aplicaron y cuáles no.
- La tabla de partida y de llegada (apertura y total de cada pantalla, y la portada) en el cuerpo
  del PR.
