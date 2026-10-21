# Implementation Plan: «Nosotros»: para qué existe el sitio, en qué se diferencia y qué quiere decir su marca

**Branch**: `feature/201-nosotros-para-que-existe` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/024-nosotros-para-que-existe/spec.md`, historia #201 (`story.md`).

## Summary

Una página pública nueva, `/nosotros`, con cuatro partes (para qué existe, en qué se diferencia, lo
que no promete, la marca), la fecha de actualización y la tirita «Ver los animales en adopción», y
su enlace al final del grupo Confianza del pie. Se arma con las piezas de la página de contenido de
«Preguntas y respuestas» (`QuestionLayout`, `QuestionArticle`, `QuestionSection`, `QuestionFooter`
con las relacionadas opcionales); lo único nuevo que se dibuja es `BrandMeaning`, la parte de la
marca con `BrandMark` `principal` a 128 px y su descripción para lectores de pantalla. Los textos van
en el namespace `about`, con el nombre del sitio y los 30 días del seguimiento como parámetros.
Sin base de datos, sin dependencias nuevas, sin eventos.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router), React Server Components.

**Primary Dependencies**: next-intl (textos), Tailwind v4 con los tokens de `globals.css`. Ninguna
nueva.

**Storage**: N/A. La página no lee ni guarda datos.

**Testing**: Vitest (reglas puras: el pie, los textos, `robots`), Stryker al 100 % sobre lo que
tiene test. Sin e2e (research R8).

**Target Platform**: web, 390 px primero; revisada a 390 y 1280.

**Project Type**: aplicación web (Next.js), una sola app.

**Performance Goals**: LCP < 2,5 s en el perfil móvil de Lighthouse (SC-010). La página es HTML del
servidor más un SVG inline de menos de 3 KB; no suma JavaScript de cliente.

**Constraints**: sin indexar (`INDEXING_ENABLED`), tarjeta al compartir, texto legible antes del
dibujo, ningún texto fuera de `messages/es.json`.

**Scale/Scope**: 1 ruta nueva (página, layout, error), 1 componente de dominio, 1 módulo de
estructura, ~35 claves de texto, 1 enlace del pie.

## Constitution Check

- **§I La historia dice el qué**: la spec no nombra componentes ni rutas; este plan sí. ✓
- **§III Qué se testea**: la regla del pie (quién ve «Nosotros»), la regla de los textos (sin cifras
  escritas, sin el nombre escrito, cinco diferencias, la fecha válida), que la tarjeta se puede
  armar (`robots`). Sin e2e y nada para componentes que solo pintan (R8). ✓
- **§V Datos personales**: ninguno. La página es la misma con sesión y sin ella; la única lectura
  de sesión es `redirectIfSuspended()`. ✓
- **§VI Sin deriva**: nada de «Fuera del MVP»; donaciones, contacto, fundadores, cifras y el kit de
  marca quedan fuera, como dice la historia. ✓
- **Componentizar**: `BrandMeaning` (tiene nombre en el dominio); el cierre reutiliza
  `QuestionFooter` en vez de repetir fecha + tirita (segunda aparición). Capas app → components →
  ui respetadas: `BrandMeaning` recibe sus textos por props y usa `BrandMark` y `TextLink` de `ui`. ✓
- **Multilingüe**: namespace `about` y `footer.links.about`. ✓
- **Liviana y linda**: todo Server Component; el `error.tsx` es cliente por obligación de Next, como
  los demás. Tokens de docs/10 solamente. ✓
- **Dependencia nueva**: ninguna. ✓
- **Encontrable**: `generateMetadata` con textos de `messages/`, canónica entera, `robots` desde
  `INDEXING_ENABLED`, contenido en el HTML del servidor; `robots.ts` abre `/nosotros` a los
  lectores de vista previa. ✓

## Project Structure

### Documentation (this feature)

```text
specs/024-nosotros-para-que-existe/
├── story.md
├── spec.md
├── checklists/requirements.md
├── research.md
├── plan.md
├── quickstart.md
└── tasks.md
```

Sin `data-model.md` ni `contracts/`: no hay datos ni interfaces externas.

### Source Code

```text
src/
  app/
    robots.ts                                   # + ABOUT_PATH para los lectores de vista previa
    robots.test.ts                              # nuevo
    [locale]/
      (public)/nosotros/
        layout.tsx                              # nuevo: el texto de error y la salida a la portada
        page.tsx                                # nuevo: metadata, redirectIfSuspended, composición
        error.tsx                               # nuevo: ErrorScreen + exit
      _components/
        about-texts.ts                          # nuevo: arma los textos de `about` con sus parámetros
        public-error-copy.tsx                   # + campo opcional `exit`
  components/
    about/brand-meaning.tsx                     # nuevo
    questions/question-footer.tsx               # `related` opcional
  lib/
    about/page.ts                               # nuevo: ABOUT_PATH, ABOUT_UPDATED_ON, ABOUT_FACTS, secciones
    about/page.test.ts                          # nuevo
    footer/groups.ts                            # + 'about' último en trust
    footer/groups.test.ts                       # + los casos de «Nosotros»
messages/es.json                                # + about.*, footer.links.about
docs/10-design-system.md                        # + fila BrandMeaning; QuestionFooter con related opcional
```

**Structure Decision**: la de CLAUDE.md. La página compone; `BrandMeaning` recibe textos por props;
la estructura y las cifras, en `lib/about/`.

## Cómo se construye, por user story

### US1 — Leer para qué existe el sitio y en qué se diferencia (P1)

1. **Estructura** (`lib/about/page.ts`): `ABOUT_PATH = '/nosotros'`; `ABOUT_UPDATED_ON` con el día
   en que se escribe el texto; `ABOUT_SECTIONS`, la forma de las cuatro partes en orden (`why`
   con sus párrafos; `different` con un párrafo y `items: 5`; `promise` con sus párrafos; `brand`
   con sus párrafos), y `ABOUT_FACTS = { followUpDays: FOLLOW_UP_DAYS }`.
2. **Textos** (`messages/es.json`, namespace `about`), en voseo y pasados por `sin-slop`:
   - `title` «Nosotros»; `card`, una oración para la tarjeta; `lead`, hasta tres oraciones que
     responden «¿qué es esto?» por sí solas (docs/08 §Encontrable).
   - `sections.why`: lo que pasa hoy en grupos de Facebook, Instagram y WhatsApp, con «pagá el
     flete y te lo mando», quien adopta para revender o criar, y quien rescata entrevistando por
     WhatsApp de a uno; y que el problema es la confianza (FR-003, FR-004).
   - `sections.different`: un párrafo y los cinco renglones de FR-005, en este orden; el cuarto
     con `{followUpDays}`.
   - `sections.promise`: verificada no es garantía de buen cuidado; la verificación dice quién es;
     decidir a quién dar sigue siendo de quien publicó (FR-006).
   - `sections.brand`: qué dibuja la marca, qué junta, que no cuenta niveles, que firma al sitio y
     la chapita certifica a una persona (FR-011, FR-012); `image` (la descripción para el lector);
     `levels` («Qué dice cada nivel»).
   - `updated` («Actualizada el {date}»), `action` («Ver los animales en adopción»),
     `error.body` y `error.to_home`.
   - `{app}` donde haga falta el nombre del sitio; ningún dígito escrito.
3. **Armado** (`_components/about-texts.ts`): `aboutTexts()` lee `about` con
   `{ app: APP_NAME, ...ABOUT_FACTS }` y devuelve `{ title, lead, sections, brand, footer }` en las
   formas que esperan `QuestionSection`, `BrandMeaning` y `QuestionFooter`; la fecha con
   `formatUpdatedOn(ABOUT_UPDATED_ON, locale)`. `aboutCardTexts()` para la metadata.
4. **`QuestionFooter`**: `related` pasa a opcional; sin él no se pinta `RelatedQuestions`. Las
   preguntas lo siguen pasando.
5. **Página** (`(public)/nosotros/page.tsx`): `setRequestLocale`, `redirectIfSuspended()`,
   `aboutTexts()`; `PageShell width="full"` › `QuestionLayout` con `title`, `article` =
   `QuestionArticle` (`answer` = la bajada; `sections` = why, different —con la `CheckList` como
   hijo de `QuestionSection`—, promise y `BrandMeaning`; `shared` = `null`) y `closing` =
   `QuestionFooter` con la fecha y la acción a `LISTING_PATH`. `generateMetadata` como en R6.
6. **Error** (`layout.tsx`, `error.tsx`, `public-error-copy.tsx`): R7.
7. **Pie** (`lib/footer/groups.ts`, `footer.links.about`): R5.
8. **`robots.ts`**: suma `ABOUT_PATH` a `allow` de los lectores de vista previa.
9. **Tests**: `groups.test.ts` («Nosotros» último en Confianza con `scope: 'site'`; ningún
   `about` con `scope: 'help'`), `page.test.ts` (R8: claves completas, sin dígitos, sin el nombre,
   la fecha válida, los 30 días por parámetro) y `robots.test.ts` (la regla de los lectores de
   vista previa incluye `/nosotros`; la de `*` sigue cerrada sin indexación).

### US2 — Entender qué quiere decir la marca (P2)

1. **`BrandMeaning`** (`components/about/brand-meaning.tsx`), props
   `{ texts: { title, paragraphs, image, levels }, levelsHref }`:
   `section` › `h2` (igual que `QuestionSection`) › `div` con `grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start`:
   - `span role="img" aria-label={image}` con `BrandMark version="principal" className="h-32 w-auto text-ink"`;
   - la columna de texto: los párrafos y `TextLink` (`block`) a `LEVELS_PATH`.
2. **Sin test**: solo pinta (R8). El nombre accesible y la posición a 390 y 1280 se miran en las
   capturas y en la revisión de diseño.
3. **docs/10**: fila de `BrandMeaning` en la tabla de componentes.

## Diseño

Cargado `frontend-design:frontend-design` y leído docs/10 (§Marca, §Pantallas anchas, §Componentes,
§Textos, §Antipatrones). La página es una página de contenido más: hereda su forma de la #8 y
gasta su único gesto en la marca.

### Wireframes

```
Nosotros (390 px)                       Nosotros (1280 px, hoja de 1200)
┌──────────────────────────┐            ┌──────────────────────────────────────────────────────┐
│ [firma]  Animales  [menú]│            │ [firma]   Animales en adopción  Publicar   [menú]    │
│                          │            ├──────────────────────────────────────────────────────┤
│ Nosotros   (afiche 2xl)  │            │ Nosotros   (afiche 2xl)                              │
│ Bajada en text-lg, hasta │            │ ┌──────── lectura 640 ─────────┐   ┌── cierre ────┐ │
│ tres oraciones.          │            │ │ Bajada text-lg               │   │ Actualizada  │ │
│                          │            │ │                              │   │ el 20 de oct.│ │
│ Para qué existe  (h2 xl) │            │ │ Para qué existe              │   │ ┄┄┄┄┄┄┄┄┄┄┄┄ │ │
│ párrafo                  │            │ │ párrafos                     │   │ Ver los anim.│ │
│ párrafo                  │            │ │ En qué se diferencia         │   │ (tirita lg)  │ │
│ En qué se diferencia     │            │ │ párrafo                      │   └──── sticky ──┘ │
│ párrafo                  │            │ │ ✓ verifica a los dos lados   │                    │
│ ✓ verifica…              │            │ │ ✓ el teléfono no está…       │                    │
│ ✓ el teléfono…           │            │ │ ✓ cada persona, su chapita   │                    │
│ ✓ la chapita…            │            │ │ ✓ a los 30 días…             │                    │
│ ✓ a los 30 días…         │            │ │ ✓ no cobra                   │                    │
│ ✓ no cobra…              │            │ │ Lo que no promete            │                    │
│ Lo que no promete        │            │ │ párrafos                     │                    │
│ párrafos                 │            │ │ La marca                     │                    │
│ La marca                 │            │ │ ┌──────┐  párrafo            │                    │
│ ┌──────┐                 │            │ │ │ pata │  párrafo            │                    │
│ │ pata │ 128 px          │            │ │ │128 px│  Qué dice cada nivel│                    │
│ └──────┘                 │            │ │ └──────┘                     │                    │
│ párrafos                 │            │ └──────────────────────────────┘                    │
│ Qué dice cada nivel      │            ├──────────────────────────────────────────────────────┤
│ ──────────────────────── │            │ pie: Animales · Confianza (… Nosotros) · Ayuda       │
│ Actualizada el 20 de oct.│            └──────────────────────────────────────────────────────┘
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ Ver los animales en adop.│
│ pie (… Nosotros)         │
└──────────────────────────┘
```

### Componentes

| Componente | Capa | Reutiliza / crea | Para qué |
|---|---|---|---|
| `PaperFrame`, `PageShell` `full` | app | reutiliza | la hoja y la columna |
| `QuestionLayout` | questions | reutiliza | el `h1` y las dos columnas desde 1024 |
| `QuestionArticle` | questions | reutiliza | la bajada en `--text-lg` y las partes con `--space-10` |
| `QuestionSection` | questions | reutiliza | el `h2` y los párrafos de tres partes; `different` lleva la `CheckList` como hijo |
| `CheckList` | ui | reutiliza | las cinco diferencias con el tilde en yerba |
| `QuestionFooter` | questions | cambia: `related` opcional | la fecha y la tirita, sin relacionadas |
| `LinkButton` `tirita` `lg` | ui | reutiliza (dentro de `QuestionFooter`) | «Ver los animales en adopción» |
| `BrandMeaning` | about | **crea** | la parte de la marca: dibujo, texto, enlace |
| `BrandMark` `principal` | ui | reutiliza | el dibujo a 128 px |
| `TextLink` `block` | ui | reutiliza | «Qué dice cada nivel», 44 px de alto |
| `ErrorScreen`, `TextLink` | app, ui | reutiliza | la falla con la salida a la portada |
| `SiteFooter`, `FooterLink` | app | reutiliza (un enlace más por datos) | «Nosotros» en Confianza |

### Tokens

`--color-ink` (texto, la marca, la tirita), `--color-ink-muted` (la fecha), `--color-primary` (el
tilde de `CheckList`, lo único verde), `--color-line` (el divisor del cierre en el teléfono),
`--text-2xl` + `.afiche` (el `h1`), `--text-xl` bold con `--tracking-tight` (los `h2`),
`--text-lg` (la bajada), `--text-base` (los párrafos), `--text-sm` (la fecha), `--space-10` (entre
partes y entre el dibujo y su texto, ≥ el 28 % de aire de §Marca), `--space-16` (entre la lectura
y el cierre desde 1024), `--measure`. Ningún token nuevo, ningún valor suelto: `h-32` sale de
`--spacing` de 4 px.

### Lo que llama la atención

**El dibujo de la marca a 128 px**, quieto, en tinta, sin cinta, sin inclinar y sin sombra: es la
vez que más grande aparece en el sitio y la razón de su parte. La tirita del cierre es la única
acción, como en toda página de contenido; no compite porque está en el cierre (abajo en el
teléfono, al costado desde 1024). Nada más lleva un recurso del cartel: ni cinta, ni sello, ni
acento ceibo.

### Los tres estados

La página no tiene bloques con datos.

- **Cargando**: sin esqueleto propio (R7); el texto llega entero con el HTML y el dibujo es parte
  de ese HTML, con su caja fija.
- **Vacío**: no aplica; siempre tiene texto.
- **Error**: `ErrorScreen` con «Algo se rompió», «No pudimos abrir esta página. Probá de nuevo.»,
  «Reintentar» y debajo `TextLink` «Ir a la portada»; la cabecera y el pie siguen.

### Piso de accesibilidad

Un `h1` y cuatro `h2` en orden; la lista es `ul`; el dibujo es `role="img"` con nombre y el SVG
`aria-hidden`; la fecha va en `time`; `TextLink` `block` y la tirita miden 44 px; contraste AA en
todo (la fecha en `--color-ink-muted` da 5,8:1). Sin movimiento propio.

## Verificación

- `pnpm gates:affected` en cada user story; `pnpm verify` al cerrar.
- `node scripts/walk.mjs --story nosotros-para-que-existe /nosotros /animales` a 390 y 1280 (el
  segundo, para ver el pie con el enlace nuevo).
- Lectura del texto con el skill `sin-slop` antes de cerrar US1 y US2.
- Cotejar las cinco diferencias con el sitio (SC-003): verificación para publicar y solicitar
  (#9, #10), contacto después de aceptar (#65), chapita en perfil, ficha y solicitud (#12),
  `FOLLOW_UP_DAYS` (#69), sin pagos (docs/03 §Fuera del MVP).

## Revisión del plan

Vuelta 1 (revisión con la lista de `plan-reviewer`, sin hallazgos CRITICAL):
- HIGH, arreglado: el plan tenía un e2e de una página estática que no es flujo crítico, con la
  posición del dibujo como aserción (sobre-testeo, docs/09). Se sacó; lo cuidan las capturas.
- MEDIUM, como supuesto: SC-010 (LCP < 2,5 s) no se mide en CI para esta ruta: `.lighthouserc.json`
  mide solo la portada, y sumarle URLs es tocar una compuerta. La página es HTML del servidor con
  un SVG inline, sin JavaScript propio, más liviana que la portada que sí se mide.
- MEDIUM, arreglado: `page.test.ts` decía qué probaba pero no qué afirmaba; ahora cada aserción está
  en R8.

Vuelta 2: nada CRITICAL ni HIGH.

## Complexity Tracking

Sin violaciones.
