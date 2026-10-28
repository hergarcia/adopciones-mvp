# Research — Saber si el nivel de verificación pesa

Cada decisión con su motivo y lo descartado. Las rutas y nombres son los del repo hoy (`main` en
1a1878c).

## R1. De dónde sale el nivel de ahora de quien solicitó y su adopción con seguimiento

**Decisión**: una función nueva de la base, `public.application_measure(p_application uuid)`,
`security definer`, ejecutable solo por `service_role`, que devuelve una fila con
`applicant_level smallint`, `applicant_follow_up boolean` y `publisher_level smallint`:

- `applicant_level` = `private.person_level(a.applicant_id)`, la misma que pinta la chapita de la
  bandeja y de la solicitud (`pet_applications`, `publisher_application`). 0 sin teléfono verificado
  hoy (spec §Vocabulario, FR-016).
- `applicant_follow_up` = `(private.follow_up_counts(a.applicant_id)).adopted > 0`, el mismo número
  que muestra la cabecera de la solicitud y el perfil (#69). Una cuenta suspendida da `0, 0` en esa
  función, así que da `false` (spec §Assumptions).
- `publisher_level` = `private.person_level(a.publisher_id)`.
- Una cuenta borrada de quien solicitó se lleva sus solicitudes (`on delete cascade`): no hay fila,
  no hay a quién medir y el momento sale sin esos datos (FR-018). Sin solicitud, ninguna fila. Si
  quien publicó borró su cuenta, `publisher_level` es nulo, nunca un 0.

Las acciones la llaman **después** de que la respuesta quedó hecha y solo cuando van a medir (el
mismo `if` que hoy decide `trackAll`), así el nivel es el del instante (FR-016) y un doble toque no
lee nada (FR-021).

**Por qué**: `accept_application`, `reject_application`, `revoke_acceptance`, `ask_question`,
`mark_pet_adopted` y `submit_application` son funciones grandes con sus pruebas; cambiar lo que
devuelven obliga a `drop function` y recrearlas enteras para sumar dos columnas de medición. Una
función chica de lectura no toca ninguna regla de negocio, sirve a los seis momentos (aceptar,
rechazar, preguntar, dejar sin efecto, entregar y mandar) y se prueba sola.

**Descartado**: sumar columnas a cada función de respuesta (seis `drop`/`create` y el riesgo de
romper una regla para medir); leer el nivel con las consultas de la pantalla (`getPublisherApplication`
corre con la sesión y lo que lee lo decide RLS; para medir alcanza un número y una lectura menos
amplia); calcular el nivel en TypeScript (la escalera vive en la base, `private.publisher_level`, y
duplicarla la haría divergir).

## R2. El nivel de quien publicó al tocar «Solicitar»

**Decisión**: otra función, `public.pet_publisher_level(p_code text) returns smallint`, `security
definer`, solo `service_role`: `private.person_level(p.owner_id)` del animal con ese código, o nulo
si no existe. Una cría tiene su propio código en `pets` y su `owner_id` es quien publicó la camada,
así que sirve igual (FR-008).

**Por qué**: la página de «Solicitar» mide antes de decidir la pantalla, con o sin sesión;
`apply_context` y `getPetApplicationView` no traen el nivel de quien publicó y recrearlas para un
número de medición es el mismo costo de R1.

**Descartado**: sumar `publisher_level` a `apply_context` (función grande, con `drop`); darle
permiso a `anon` (el nivel de quien publica ya es público en la ficha, pero la página usa el
servicio y no hace falta abrir otra puerta).

## R3. El nivel de quien publicó al ver una ficha

**Decisión**: usar el que ya trae la ficha. `pet_by_code` devuelve `publisher_level` y la página lo
pasa como `pet.publisher.level` (`pet-sheet-rows.ts`); `litter_by_code` también lo devuelve
(`publisher_level`), y la página de la camada lo recibe en su `publisher`. `petViewEvent` suma
`publisher_level` cuando el nivel es 1, 2 o 3; si viene nulo, el momento sale sin él (FR-018).

**Por qué**: es el nivel que la persona tiene delante (la chapita de la ficha) y no cuesta otra
lectura. La ficha a la vista ya exige nivel 1, así que nunca es 0.

## R4. Mandar una solicitud

**Decisión**: después de `submitApplicationRecord` con `outcome === 'sent'` y un `id`, la acción
llama `application_measure(id)` y pasa `applicant_level` y `publisher_level` a
`applicationSentEvent`. El de quien solicita sale de la misma función y no de `screen.level`, que se
leyó antes de insertar: así los dos niveles son del mismo instante (FR-009, FR-016).

## R5. Publicar y editar

**Decisión**: `pet_published` y `pet_edited` suman `required_level: 1 | 2`, el valor ya validado
por el schema del formulario que la acción guardó (`requiredLevel` en `src/actions/pets.ts` y
`src/actions/litters.ts`). La camada lo lleva en su único `pet_published` (FR-014). Al editar es el
valor que quedó guardado (FR-015), que es el que la acción mandó a la base cuando la edición llegó.

**Por qué**: no hace falta leer nada: el valor es parte de lo que se guardó, y solo se mide cuando
se guardó.

## R6. «Desde una solicitud» en el perfil público

**Decisión**: «Ver su perfil» de la solicitud (`publisherApplicationTexts`, que arma `profileHref`)
pasa a `publicProfilePath(publicId, { from: 'application' })`, que agrega `?desde=solicitud`. La
página del perfil calcula el origen con una función pura nueva, `profileViewOrigin(referer, siteUrl,
fromApplication)` en `src/lib/analytics/view-origin.ts`:

- `application` si la marca está **y** `viewOrigin(referer, siteUrl)` da `site`;
- si no, `viewOrigin(...)` como hoy (`site` o `link`).

`public_profile_viewed.origin` pasa a `ProfileViewOrigin = 'link' | 'site' | 'application'`. La
marca es una palabra fija: no lleva la solicitud, el animal ni la persona (FR-012). `shouldTrackView`
no cambia, así que lo que hoy no se mide sigue sin medirse (FR-013).

**Por qué**: con la marca sola, la dirección pegada en WhatsApp contaría como solicitud (spec US3
escenario 4); con el `Referer` solo, habría que leer la ruta de la solicitud, que lleva su id, y
depender de que el navegador mande la ruta entera. Las dos condiciones juntas piden lo que dice la
spec: tocar el enlace y llegar navegando el sitio. `viewOrigin` ya compara el origen entero.

**Descartado**: sumar `'application'` a `VIEW_ORIGINS` (lo usa también el tipo de otros momentos;
un tipo propio del perfil no cambia nada más); una cookie de un solo uso (más estado para un dato
que la dirección ya lleva).

## R7. Medir nunca frena (FR-018, FR-019)

**Decisión**: las dos consultas nuevas (`getApplicationMeasure`, `getPetPublisherLevel` en
`src/lib/supabase/queries/measured-levels.ts`) nunca lanzan: ante un error de la base o una fila que
falta devuelven `null`. Leer la fila es una función pura aparte, `applicationMeasureOf(row)` y
`measuredLevelOf(value)` en `src/lib/analytics/measured-levels.ts`: un número fuera de 0 a 3, o un
nulo, da `null`, nunca un nivel recortado; así la regla de FR-018 tiene prueba sin probar la
consulta. Los constructores de eventos reciben `null` y
omiten la propiedad, nunca la llenan con un valor por defecto. La lectura corre después de que la
acción ya hizo lo suyo y su resultado no cambia lo que la acción devuelve.

`track` ya no frena: si PostHog no responde, `deliver` lo maneja fuera del pedido (#169).

## R8. Forma de los eventos

Propiedades nuevas, en snake_case como las últimas que se sumaron:

| Evento | Suma |
|---|---|
| `pet_published`, `pet_edited` | `required_level: 1 \| 2` |
| `pet_viewed` | `publisher_level?: 1 \| 2 \| 3` |
| `apply_tapped` | `publisher_level?: 0 \| 1 \| 2 \| 3` |
| `application_sent` | `applicant_level?`, `publisher_level?` (0 a 3) |
| `application_accepted`, `application_rejected`, `question_asked`, `acceptance_revoked`, `application_first_response` | `applicant_level?: 0 \| 1 \| 2 \| 3`, `applicant_follow_up?: boolean` |
| `pet_handed_over` | los mismos dos, solo con `to: 'site'` |
| `public_profile_viewed` | `origin` puede ser `application` |

`question_asked` hoy no tiene propiedades; pasa a tener las dos opcionales. Las opcionales faltan
cuando no se pudieron leer: en PostHog se distinguen de un 0.

Un tipo compartido, `ApplicantMeasure = { level: 0 | 1 | 2 | 3; followUp: boolean }`, y una
función `applicantProps(measure | null)` que devuelve `{}` o las dos propiedades, en
`src/lib/analytics/measured-levels.ts`.

## R9. Qué se prueba y por qué (docs/09 §Qué vale la pena testear)

- **Lógica pura con Stryker al 100 %**: `measuredLevelOf`, `applicationMeasureOf`, `applicantProps`,
  `publisherLevelProps`, los constructores
  cambiados (`applicationAcceptedEvents`, `applicationRejectedEvents`, `questionAskedEvents`,
  `acceptanceRevokedEvent`, `firstResponseEvent`, `applicationSentEvent`, `applyTappedEvent`,
  `handoverEvent`, `petViewEvent`) y `profileViewOrigin`. Si se rompen, la beta lee mal la
  hipótesis: un nivel en el momento equivocado, un «por fuera» con nivel o una visita de WhatsApp
  contada como solicitud. Cada prueba verifica también que no sale ninguna propiedad de más
  (FR-020).
- **Base (`tests/db`)**: las dos funciones nuevas. Privacidad: un visitante y una persona con sesión
  no pueden ejecutarlas (devuelven nivel y el sí o no de cualquiera por id). Reglas: el nivel es el
  de ahora (aprobar la identidad después de mandar sube a 2; retirar el aval baja a 2); la adopción
  con seguimiento cuenta solo las que adoptó y respondió; suspendida da `false`; borrada da nulos; la
  de una cría da el nivel de quien publicó la camada.
- **No se prueba**: las páginas y acciones que solo pasan el dato (cableado), las consultas finas,
  ni un e2e: ningún flujo cambia y la medición no sale en local (queda en el registro).

## R10. Skills

La historia no toca UI ni auth: no aplican `frontend-design` ni `supabase:supabase`. Toca la base
(dos funciones de lectura con grants): el build carga
`supabase:supabase-postgres-best-practices` antes de escribir la migración y sus pruebas, como pide
CLAUDE.md. Ninguna dependencia nueva.
