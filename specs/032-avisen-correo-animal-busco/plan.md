# Implementation Plan: Que me avisen por correo cuando se publique un animal como el que busco

**Branch**: `feature/265-avisen-correo-animal-busco` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/032-avisen-correo-animal-busco/spec.md`

## Summary

En el listado, «Avisame cuando haya uno así» guarda los seis filtros como un aviso de la cuenta
(hasta 3, sin repetidos, también desde la vuelta de entrar). «Mis avisos», desde Mi perfil, los
muestra en palabras con su enlace al listado y «Borrar». Cada animal y cada camada suma su **primera
aparición** en el listado, una marca que no cambia al pausar, renovar ni editar (research R1). La
corrida de las 8, la misma del resumen de quien administra, junta por persona lo que apareció por
primera vez después de lo que ya se cubrió, lo pasa por `listed_pets` para quedarse con lo que hoy se
puede solicitar, saca lo propio y los bloqueos en las dos direcciones, y manda un solo correo con una
parte por aviso, hasta 6 cada una, sin repetidos (R2-R5, R11). Cada correo trae un «Dejar de
recibir» de un toque que borra todos los avisos sin entrar (R6, R7). Se mide la creación, el correo,
la ficha abierta desde el correo con origen propio y el borrado, sin la persona ni los filtros (R12).

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Supabase con `@supabase/ssr`, Resend,
Radix en las primitivas). **Ninguna dependencia nueva**: no hay línea nueva en `docs/07-stack.md`.

**Storage**: Supabase Postgres local; una migración forward-only con dos columnas, tres tablas, ocho
funciones y el comando del trabajo `pet-lifecycle` de `pg_cron` (data-model.md)

**Testing**: Vitest (unitarias y `tests/db` contra Supabase local), Stryker al 100 % sobre lo que
tiene test, Playwright (un flujo)

**Target Platform**: web mobile-first, 390 px y 1280 px; el correo en clientes de correo comunes
(tablas y estilos en línea, como los demás)

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: el listado suma una hoja cliente chica (`AlertOffer`, un botón con tres
estados que llama a una acción) dentro de `ListingController`, que ya es cliente: sin librerías
nuevas, unos cientos de bytes. «Mis avisos» es de servidor con una hoja por «Borrar». Presupuesto
de siempre: JS inicial < 150 KB, LCP < 2,5 s, Lighthouse mobile ≥ 90

**Constraints**: Ley 18.331 (los avisos solo los ve su dueña, ni quien administra; el correo sin
datos de nadie; la medición sin la persona ni los filtros); a lo sumo un correo por persona por día;
3.000 correos por mes del plan gratuito de Resend (docs/07); una llamada de Vercel Cron por día en
Hobby (por eso va en la corrida de `pg_cron` que ya existe)

**Scale/Scope**: beta de 3-5 rescatistas y decenas de personas que buscan; una acción en el
listado, una pantalla privada, una pantalla abierta, un correo y una tarea diaria compartida

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra tablas, rutas ni componentes; el cómo vive acá, en research y en data-model. |
| II. Una feature, un PR | Tres user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R14: lógica pura y schema con Stryker al 100 %, privacidad y reglas en `tests/db`, un e2e. |
| IV. Reglas como código | «Qué se ve» es una sola función (`listed_pets`) para el listado, el perfil, los sugeridos y el correo; la marca de primera aparición usa sus mismas condiciones, comparadas por una prueba; los tramos de edad en SQL se comparan con `AGE_BANDS`; el tope de 3 y los repetidos viven en una función con bloqueo y un índice único. |
| V. Datos mínimos y privados | De cada aviso, solo los filtros y dos momentos; RLS de dueña sin política para quien administra; enlaces de baja guardados como hash; pruebas que intentan leer los avisos como visitante, otra persona y quien administra; nada nuevo se le pide a la persona. |
| VI. Sin deriva | No cambian los filtros ni el orden del listado, el resumen de quien administra, ni ningún otro correo. «Fuera de alcance» de la historia respetado: sin WhatsApp, sin elegir hora, sin filtros nuevos, sin avisos desde otras pantallas. |
| VII. Liviana y linda | Server Components en «Mis avisos» y «Dejar de recibir»; hojas cliente mínimas; tokens y componentes de docs/10; tres estados de cada bloque con datos (§Diseño). |
| VIII. Autonomía con veto | Las siete decisiones de la historia ya están en docs/03 en esta rama; ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/032-avisen-correo-animal-busco/
├── story.md             # cuerpo verbatim de la historia #265
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/server-actions.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/20261102120000_pet_alerts.sql        # nuevo: columnas, tablas, funciones, RLS, grants, cron.alter_job
src/lib/supabase/types.ts                                # regenerado con pnpm db:types
src/lib/links/link-token.ts                              # nuevo: newLinkToken, hashLinkToken, isLinkToken (extraídos)
src/lib/links/link-token.test.ts                         # nuevo (las pruebas de renewal-token pasan acá)
src/lib/pets/renewal-token.ts                            # reusa link-token
src/lib/alerts/types.ts                                  # nuevo: AlertFilters, PetAlert, AlertMatch, AlertMailPart, CreateAlertOutcome
src/lib/alerts/rules.ts                                  # nuevo: ALERTS_MAX = 3, ALERT_PART_MAX = 6, ALERT_LINK_DAYS = 180
src/lib/alerts/filters.ts                                # nuevo: normalizeAlertFilters, countFilters
src/lib/alerts/filters.test.ts                           # nuevo
src/lib/alerts/alert-name.ts                             # nuevo: alertName(filters, words)
src/lib/alerts/alert-name.test.ts                        # nuevo
src/lib/alerts/mail-parts.ts                             # nuevo: alertMailParts
src/lib/alerts/mail-parts.test.ts                        # nuevo
src/lib/alerts/paths.ts                                  # nuevo: MY_ALERTS_PATH, unsubscribePath, ALERT_PARAM ('avisar')
src/lib/schemas/pet-alert.ts                             # nuevo: petAlertSchema
src/lib/schemas/pet-alert.test.ts                        # nuevo
src/lib/pets/listing-query.ts                            # exporta la regla de juntar «todas» (chosen) para el schema; separa `avisar`
src/lib/pets/share-url.ts                                # LINK_MARKS suma alert: 'aviso'
src/lib/analytics/events.ts                              # + pet_alert_created, pet_alert_mail_sent, pet_alert_deleted
src/lib/analytics/alert-events.ts                        # nuevo: los tres eventos
src/lib/analytics/alert-events.test.ts                   # nuevo
src/lib/analytics/visit-origin.ts                        # PetViewOrigin suma 'alert'
src/lib/analytics/visit-origin.test.ts                   # caso de la marca del aviso
src/lib/supabase/queries/pet-alerts.ts                   # nuevo: la única puerta a las tres tablas
src/lib/email/notice-email-template.ts                   # extras.groups
src/lib/email/notice-email-template.test.ts              # casos de groups (escapado, texto)
src/lib/email/send-email.ts                              # headers
src/lib/email/send-pet-alert-mail.ts                     # nuevo: sendPetAlertMail, sendPetAlertMails
src/actions/pet-alerts.ts                                # nuevo: createPetAlert, deletePetAlert, unsubscribePetAlerts
src/app/api/cron/resumen/route.ts                        # suma sendPetAlertMails con su catch
src/app/api/avisos/dejar/route.ts                        # nuevo: POST de List-Unsubscribe
src/components/alerts/alert-offer.tsx                    # nuevo: el botón con sus estados (cliente)
src/components/alerts/alert-offer-texts.ts               # nuevo: alertOfferTexts() con getTranslations
src/components/alerts/my-alerts-list.tsx                 # nuevo
src/components/alerts/my-alert-row.tsx                   # nuevo
src/components/alerts/delete-alert-button.tsx            # nuevo (cliente)
src/components/alerts/unsubscribe-runner.tsx             # nuevo (cliente)
src/lib/alerts/alert-name-texts.ts                       # nuevo: las palabras de alertName con getTranslations (en lib: las usa también el correo)
src/components/profile/my-list-links.tsx                 # suma «Mis avisos»
src/app/[locale]/(public)/animales/page.tsx              # separa `avisar`, lee la sesión, pasa offer a ListingShell
src/app/[locale]/(public)/animales/_components/listing-shell.tsx       # pasa offer
src/app/[locale]/(public)/animales/_components/listing-controller.tsx  # AlertOffer junto al total
src/app/[locale]/(public)/animales/_components/listing-empty.tsx       # AlertOffer al lado de «Sacar los filtros»
src/app/[locale]/(public)/animales/_components/listing-texts.ts        # textos del ofrecimiento
src/app/[locale]/(app)/mis-avisos/page.tsx               # nuevo
src/app/[locale]/(app)/mis-avisos/loading.tsx            # nuevo
src/app/[locale]/(app)/mis-avisos/error.tsx              # nuevo
src/app/[locale]/(open)/dejar-de-recibir/[token]/page.tsx  # nuevo
src/app/[locale]/(app)/mi-perfil/_components/my-profile-sections.tsx  # pasa el acceso a MyListLinks
messages/es.json                                         # alerts.*, emails.pet_alerts.*, metadata.my_alerts, metadata.unsubscribe
docs/03-mvp-features.md                                  # las siete decisiones (ya en esta rama) + lectura 7 en §Métricas de éxito
docs/06-i18n.md                                          # glosario: «aviso» (`pet alert`), «Dejar de recibir» (`unsubscribe`)
docs/10-design-system.md                                 # filas de AlertOffer, MyAlertsList/MyAlertRow, DeleteAlertButton, UnsubscribeRunner; MyListLinks con cinco accesos; la plantilla de correo con grupos
tests/db/pet-alerts-support.ts                           # nuevo: personas, animales y camadas en cada estado, correr la corrida
tests/db/pet-alerts-privacy.test.ts                      # nuevo
tests/db/pet-alerts-rules.test.ts                        # nuevo: crear, tope, repetidos, primera aparición
tests/db/pet-alerts-mail.test.ts                         # nuevo: la corrida
tests/db/pet-alerts-unsubscribe.test.ts                  # nuevo
tests/e2e/avisos.spec.ts                                 # nuevo
```

**Structure Decision**: la de F00 (CLAUDE.md §Estructura). Dominio nuevo `alerts` en `lib/`,
`components/` y `actions/`, porque un aviso tiene nombre propio en el dominio y no es de un animal
ni de un perfil. La query es `pet-alerts.ts`, la única puerta a sus tablas.

## Diseño

Cargado antes de escribir: docs/10 (§Principios, §Componentes, §Color, §Textos, §Cómo se aplica) y
las filas de `ListingCount`, `ListingFilters`, `ClearFiltersAction`, `ListingController`,
`EmptyState`, `HeadedEmptyState`, `MyBlocksList`, `MyListLinks`, `Button`, `LinkButton`,
`TextLink`, `ErrorText`, `Skeleton`, `PageShell`. Nada nuevo en tokens. En el build se carga el
skill `frontend-design:frontend-design` antes del JSX.

### El listado con el ofrecimiento — 390 px

Con resultados (el ofrecimiento al lado del total):

```
Animales en adopción                       ← h1 afiche --text-2xl (de hoy)
[Perro][Gato]  [Chico][Mediano]…  →        ← ListingFilters (de hoy)
☐ Solo castrados   [Montevideo ▾]
──────────────────────────────────── line
3 animales          Avisame cuando haya    ← ListingCount + AlertOffer (Button ghost sm)
                    uno así
┌──────┐ ┌──────┐                          ← PetWall (de hoy)
│ foto │ │ foto │
```

Después de crearlo (la línea reemplaza al botón, en el mismo lugar):

```
3 animales
Te vamos a avisar por correo. Mis avisos   ← --text-sm ink; «Mis avisos» TextLink inline
```

Sin resultados (el ofrecimiento en el lugar del vacío, al lado de «Sacar los filtros»):

```
           ┌─ cartel en blanco ─┐            ← EmptyState (de hoy)
           No hay animales con
           estos filtros.
  [Avisame cuando haya uno así]            ← Button primary md (la acción del vacío)
  [Sacar los filtros]                      ← ClearFiltersAction secondary (de hoy)
```

A 1280 px: el total y el ofrecimiento en el mismo renglón, el botón a la derecha del total; en el
vacío, los dos botones uno al lado del otro, centrados.

- **Reutiliza**: `ListingCount`, `EmptyState` (su `action` recibe los dos botones), `ClearFiltersAction`,
  `Button`, `TextLink`, `ErrorText`.
- **Crea**: `AlertOffer` (alerts, cliente) con estados **quieto · creando · creado · ya lo tenés ·
  máximo · no se pudo · entrar**. Quieto: `Button` (`ghost` `sm` junto al total; `primary` `md` en
  el vacío). Creando: el mismo botón con `loading` (spinner de `--dur-spin`), `aria-busy`, sin otro
  toque. Creado: la línea «Te vamos a avisar por correo.» con `TextLink` a «Mis avisos», anunciada
  con `role="status"`. Ya lo tenés: la misma forma, «Ya tenés este aviso.» con el enlace. Máximo:
  «Ya tenés 3 avisos, el máximo.» con `TextLink` «Borrar uno en Mis avisos». No se pudo: el botón
  queda y debajo `ErrorText` «No pudimos crear el aviso. Probá de nuevo.» (texto final con
  sin-slop). Entrar (sin sesión): `LinkButton` con la misma variante a entrar con la vuelta de R8.
  Con `autoCreate`, corre la acción al montar una sola vez y deja que `avisar` salga de la
  dirección con la canónica que `useListing` ya escribe con `history.replaceState`, no con
  `router.replace`: así no vuelve a pedir la página al servidor ni cuenta otra vista del listado.
  Cambiar los filtros remonta la hoja (la `key` de `ListingShell` ya es la dirección), así vuelve a
  quieto.
- **Tokens**: `--color-ink`, `--color-ink-muted`, `--color-accent` (solo el `ErrorText`),
  `--text-sm`, `--space-2`/`--space-3` entre el total y el botón, `--dur-fast` en el botón,
  `--dur-base` al entrar la línea.
- **Lo único que llama la atención**: con resultados, sigue siendo la pared (el ofrecimiento es
  `ghost`); en el vacío, «Avisame cuando haya uno así» en `primary`: es lo que la persona puede hacer
  en lugar de irse, y «Sacar los filtros» baja a `secondary` como hoy.
- **Estados con datos**: el ofrecimiento no carga nada al abrir; cuando el listado no llegó
  (`failed`), no se muestra.

### «Mis avisos» — 390 px

```
┌─ hoja (PaperFrame) ─────────────────┐
│ Mis avisos                           │  ← h1 afiche --text-2xl
│ Te mandamos un correo a las 8 cuando │  ← bajada --text-base ink-muted
│ se publica uno así. Hasta 3.         │
│ ──────────────────────────────────── │  line
│ Perros chicos en Montevideo          │  ← --text-base medium
│ Ver en el listado          [Borrar]  │  ← TextLink · Button ghost-danger sm
│ ──────────────────────────────────── │
│ Gatos en Canelones                   │
│ Ver en el listado          [Borrar]  │
│ ──────────────────────────────────── │
└──────────────────────────────────────┘
```

A 1280 px: la lista en `--measure` dentro de `PageShell` `reading`, como «Mis bloqueos».

- **Reutiliza**: `PageShell`, la lista con divisores de `--color-line` de `MyBlocksList` (misma
  receta), `TextLink`, `Button` `ghost-danger` `sm`, `HeadedEmptyState`, `Skeleton`, `ErrorScreen`
  (el `error.tsx` de la zona), `AnnounceNotices` para anunciar el borrado.
- **Crea**: `MyAlertsList` y `MyAlertRow` (alerts, servidor; reciben los textos y el nombre ya armado)
  y `DeleteAlertButton` (alerts, cliente; **quieto · borrando · no se pudo**: `loading` mientras
  borra; si falla, la fila queda y debajo `ErrorText`).
- **Tokens**: `--color-ink`, `--color-ink-muted`, `--color-line`, `--color-accent` (el `ghost-danger`
  y el error), `--text-2xl`, `--text-base`, `--text-sm`, `--space-4` entre filas.
- **Lo único que llama la atención**: nada a propósito; es una lista de trabajo. «Borrar» en
  `ghost-danger` pesa poco.
- **Estados**:
  - Cargando: `loading.tsx` con el `h1`, la bajada y tres renglones `Skeleton` de dos líneas.
  - Vacío: `HeadedEmptyState` «No tenés avisos» con «Ver animales en adopción» (`LinkButton`
    `secondary`) al listado.
  - Error: el `error.tsx` de `/mis-avisos` con `ErrorScreen` y «Reintentar».

### «Mis avisos» en Mi perfil

`MyListLinks` suma un quinto renglón-enlace «Mis avisos», después de «Mis solicitudes», con la misma
receta (`rowLinkTitle`). El título del grupo pasa a nombrar también los avisos (texto final con
sin-slop).

### «Dejar de recibir» — 390 px

```
┌─ hoja (PaperFrame de (open)) ───────────┐
│        ┌─ cartel en blanco ─┐           │
│   Listo, no te vamos a mandar más       │  ← HeadedEmptyState: h1 afiche
│   avisos.                               │
│   Si cambiás de idea, creá uno nuevo    │  ← --text-base ink-muted
│   desde el listado.                     │
│   [Ver animales en adopción]            │  ← LinkButton secondary
└─────────────────────────────────────────┘
```

Estados de `UnsubscribeRunner`: **cortando** (el mismo cartel con «Cortando tus avisos…» y el
`h1` en esqueleto de una línea, `aria-busy`) → **listo** (lo de arriba) · **no se pudo** («No
pudimos cortar tus avisos» con «Probar de nuevo» `secondary`, sin confirmar nada) · **sin
JavaScript** (el `h1` «¿Dejás de recibir los avisos?» y el botón «Dejar de recibir» `primary` en un
formulario). Enlace que no sirve (lo decide el servidor, sin montar la hoja): `HeadedEmptyState`
«Este enlace no sirve» con «Manejá tus avisos desde Mi perfil» y `LinkButton` a «Mis avisos» (que
pide entrar si hace falta).

- **Reutiliza**: `HeadedEmptyState`, `LinkButton`, `Button`, `Skeleton`.
- **Crea**: `UnsubscribeRunner` (alerts, cliente).
- **Lo único que llama la atención**: el `h1` de la confirmación.

### El correo de avisos

```
┌──────────────────────────────────────┐
│ Hay 2 animales como los que buscás   │  ← heading
│ Se publicaron desde ayer a las 8.    │  ← body (texto final con sin-slop)
│                                      │
│ Perros chicos en Montevideo          │  ← título de la parte, 18 px bold
│ ┌────┐ Tobi                          │  ← foto 96 px de ancho + nombre (enlace a la ficha)
│ │foto│ Perro, 2 años                 │
│ └────┘ Pocitos, Montevideo           │
│ ┌────┐ Camada de Rita                │
│ │foto│ Camada de 5 crías             │
│ └────┘ Cerro, Montevideo             │
│ Ver todos en el listado              │  ← enlace subrayado
│                                      │
│ [ Ver animales en adopción ]         │  ← botón de la plantilla
│ ──────────────────────────────────── │
│ Dejar de recibir                     │  ← secondary al pie
│ <pie de siempre>                     │
└──────────────────────────────────────┘
```

Los colores son los cuatro de la plantilla (`INK`, `INK_MUTED`, `CANVAS`, `LINE`); nada nuevo.

## Cómo se construye, por user story

1. **US1 — crear y «Mis avisos» (P1)**: migración entera (columnas, tablas, funciones, RLS,
   `cron.alter_job`: la corrida y la baja quedan listas en la base), tipos, `link-token`,
   `lib/alerts` (tipos, reglas, filtros, nombre) y el schema con sus pruebas, la query, las acciones
   `createPetAlert` y `deletePetAlert`, el momento `pet_alert_created` y `pet_alert_deleted`
   (perfil), `AlertOffer` en el listado (con resultados, vacío, sin sesión y la vuelta), «Mis
   avisos» y su acceso en Mi perfil, textos, pruebas de base de privacidad y de reglas (crear, tope,
   repetidos, primera aparición).
2. **US2 — el correo (P2)**: `mail-parts` con su prueba, la plantilla con `groups`, `headers` en
   `sendEmail`, `send-pet-alert-mail.ts`, la ruta de las 8, el origen `alert`, el momento del
   correo, pruebas de base de la corrida.
3. **US3 — Dejar de recibir (P3)**: `unsubscribePetAlerts`, la pantalla, `UnsubscribeRunner`, la ruta
   `POST /api/avisos/dejar`, el momento de borrar desde el correo, pruebas de base de la baja; el
   e2e entero; la lectura 7 en docs/03 §Métricas de éxito.

El correo de US2 no sale sin el enlace de baja: la migración de US1 ya trae la tabla y las funciones
de los enlaces, y US2 escribe el enlace y su ruta de destino aunque la pantalla llegue en US3. Las
tres van en el mismo PR. Los textos se escriben con el skill `sin-slop` en cada US.

## Complexity Tracking

Sin violaciones de la constitución.
