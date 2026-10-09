# Data model — Contenido que responde las preguntas que frenan una adopción

**Sin base de datos.** La historia no guarda nada de nadie (spec §Key Entities): no hay tablas,
migraciones ni RLS. El «modelo» es el registro tipado del contenido, en código, y las claves de
texto que lo acompañan en `messages/es.json`.

## QuestionPage (`src/lib/questions/pages.ts`)

```ts
type QuestionSlug =
  | 'como-se-verifica'
  | 'antes-de-entregar'
  | 'que-exige-uruguay'
  | 'reconocer-una-estafa'
  | 'compromiso-y-seguimiento'

type QuestionGroup = 'giver' | 'adopter' | 'everyone'        // orden fijo: GROUP_ORDER
type QuestionAction = 'verify_identity' | 'publish_pet' | 'browse_pets'

type QuestionSection = {
  id: string                    // clave: questions.<slug>.sections.<id>
  paragraphs: number            // p1…pN
  sources?: readonly OfficialSource[]   // solo en que-exige-uruguay
}

type OfficialSource = {
  id: string                    // clave de la etiqueta: questions.sources.<id>
  url: string                   // isOfficialSource(url) === true
}

type QuestionPage = {
  slug: QuestionSlug
  group: QuestionGroup
  action: QuestionAction
  related: readonly QuestionSlug[]   // nunca el propio; dos, según la spec
  updatedOn: string                  // 'YYYY-MM-DD', día de Uruguay
  sections: readonly QuestionSection[]
  /** Bloques que no son texto propio: la escalera de niveles y lo de la cédula. */
  shared?: readonly ('levels' | 'identity_images' | 'commitment')[]
}
```

| slug | group | action | related |
|---|---|---|---|
| `como-se-verifica` | `everyone` | `verify_identity` | `antes-de-entregar`, `reconocer-una-estafa` |
| `antes-de-entregar` | `giver` | `publish_pet` | `que-exige-uruguay`, `como-se-verifica` |
| `que-exige-uruguay` | `giver` | `publish_pet` | `antes-de-entregar`, `como-se-verifica` |
| `reconocer-una-estafa` | `adopter` | `browse_pets` | `compromiso-y-seguimiento`, `como-se-verifica` |
| `compromiso-y-seguimiento` | `adopter` | `browse_pets` | `reconocer-una-estafa`, `como-se-verifica` |

- `QUESTION_PAGES: readonly QuestionPage[]` en ese orden; `PUBLISHED: readonly QuestionSlug[]` son
  las cinco (una retirada saldría de acá).
- `GROUP_ORDER = ['giver', 'adopter', 'everyone']`.
- `ACTION_PATH: Record<QuestionAction, string>`: `verify_identity` → `IDENTITY_PATH`,
  `publish_pet` → `PUBLISH_PATH`, `browse_pets` → `LISTING_PATH` (constantes que ya existen).

## Reglas puras (`src/lib/questions/`)

| Función | Archivo | Regla de la spec |
|---|---|---|
| `sentenceCount(text)` | `sentences.ts` | Vocabulario «Una oración»: cierra en `.`, `?`, `!`; no cierran abreviaturas (`art.`, `n.º`, `Dr.`, …), números con punto o coma decimal (`18.471`, `2,5`) ni siglas con puntos. |
| `questionGroups(published)` | `groups.ts` | FR-020/021: grupos en `GROUP_ORDER`, sin grupos vacíos; `[]` si no hay páginas. |
| `relatedFor(slug, published)` | `groups.ts` | Casos borde «Las relacionadas»: las del registro que siguen publicadas, nunca la propia; `[]` → la página muestra el enlace al índice. |
| `isOfficialSource(url)` | `sources.ts` | FR-011 / vocabulario «Una fuente oficial»: HTTPS y host en `OFFICIAL_SOURCE_HOSTS`. |
| `questionBySlug(slug)` | `pages.ts` | FR-015: `null` si no está publicada → `notFound()`. |
| `isQuestionPath(pathname)` / `questionSlugOf(pathname)` | `paths.ts` | Medición R7 y la acción: qué página es un `referer`. |
| `formatUpdatedOn(day, locale)` | `dates.ts` | Casos borde «La fecha de última actualización»: día, mes y año sin depender de la zona del servidor (R13). |

`QUESTION_FACTS` (`facts.ts`) no tiene lógica: junta las constantes reales que los párrafos reciben
como parámetros (R2): `expectedReviewDays`, `reviewTtlDays`, `rejectionCap`, `rejectionWindowDays`,
`followUpDays`, `followUpMaxPhotos`.

## Claves de texto (`messages/es.json`, namespace `questions`)

```
questions.index.title            «Preguntas y respuestas»
questions.index.lead
questions.index.card             ≤ 160 caracteres
questions.index.groups.giver     «Si das en adopción»
questions.index.groups.adopter   «Si adoptás»
questions.index.groups.everyone  «Para todos»
questions.index.empty / empty_action
questions.<slug>.title           la pregunta
questions.<slug>.answer          el primer párrafo, 1–3 oraciones
questions.<slug>.card            ≤ 160 caracteres
questions.<slug>.sections.<id>.title
questions.<slug>.sections.<id>.p1 … pN
questions.sources.<id>           la etiqueta del enlace a la fuente
questions.page.updated           «Actualizada el {date}.»
questions.page.related           «También te puede servir»
questions.page.to_index          «Ver todas las preguntas»
questions.page.example_note      «El ejemplo es inventado.» (donde haya uno)
questions.example.adopter / publisher / pet   los nombres inventados del compromiso de ejemplo
questions.actions.verify_identity / publish_pet / browse_pets
questions.not_found.title / body / action
questions.error.body / exit
questions.levels_title, questions.identity_title   los títulos de los dos bloques compartidos
questions.footer.prompt / action                     el renglón nuevo del pie
verification.levels.more                             el enlace desde /niveles
identity.request.learn_more                          el enlace desde el pedido
metadata (cada página lee title/card de questions.*)
```

Las claves de cada página se arman con plantillas tipadas desde el registro
(`` `questions.${slug}.sections.${id}.p${n}` `` sobre tipos literales), así que una clave que falta
rompe `typecheck` (compuerta `typed-keys`).

## Eventos (`src/lib/analytics/events.ts`)

| Evento | Props | Disparador |
|---|---|---|
| `question_viewed` | `{ page: QuestionSlug; origin: 'index' \| 'levels' \| 'identity_request' \| 'question' \| 'link' }` | Render del servidor de `/preguntas/<slug>`, salvo lector de vista previa. |
| `questions_index_viewed` | `{ origin: 'footer' \| 'link' }` | Render del servidor de `/preguntas`, salvo lector de vista previa. |
| `question_action_used` | `{ page: QuestionSlug }` | En `/mis-animales/publicar`, `/verificar-identidad` y `/animales`, cuando el `referer` es una página de contenido del mismo `host` cuya acción lleva a esa pantalla (`ACTION_PATH[page.action] === destino`); antes de cualquier puerta. |

Ninguno lleva cuenta, nombre ni dirección (FR-053); la marca de visita es la de `track` (#9).
