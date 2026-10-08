# Research — Encuesta, opiniones y WhatsApp de soporte

Cada decisión con su porqué y lo que se descartó. El código de `main` que se cita es el de #9
(medición, `track`), #11 (`admins`, `private.is_admin()`, `/revision`), #13 (suspensión), #65
(rechazo, aceptación sin efecto, `contact-match`), #67 (`adoptions`, «Yo no adopté») y F00
(`PaperFrame`).

## R1 — De la persona, solo la oferta: `survey_offers`

**Decisión**: `public.survey_offers` con `person_id` (FK `auth.users(id) on delete cascade`),
`moment` (`gave` · `adopted` · `not_chosen`), `subject_id` (la adopción para `gave` y `adopted`, la
solicitud para `not_chosen`), `offered_on date` y `state` (`pending` · `answered` · `dismissed` ·
`skipped`). `unique (person_id, moment, subject_id)`. RLS encendida, sin políticas ni permisos.

**Por qué**: es exactamente lo que la spec deja guardar con la persona (FR-050): que se le ofreció,
para qué desenlace, cuándo y en qué quedó. `skipped` es la marca de «la primera vez no
correspondía» (FR-005): sin ella, un desenlace viejo aparecería cuando vencen los 30 días. La
cascada borra todo al borrar la cuenta. `subject_id` no es FK porque apunta a dos tablas; una
adopción o una solicitud borrada deja la oferta huérfana, que se sigue contando como ofrecida y no se
muestra (spec §Edge Cases).

**Descartado**: columnas en `adoptions` y `applications` (tres lugares para una regla de 30 días
que cruza los tres momentos); guardar la hora (FR-051 la prohíbe del lado anónimo, y del lado de la
persona alcanza el día para los 30 días).

## R2 — La oferta se decide al abrir la pantalla, en una función con candado

**Decisión**: `public.survey_for(p_moment text, p_subject uuid)` (`security definer`, volátil),
llamada por Mi solicitud con la solicitud que muestra, y `public.my_pets_survey()`, llamada por Mis
animales. Cada una: comprueba que el desenlace existe, es de quien llama y es de después del
arranque (R6); toma un `pg_advisory_xact_lock` por persona; si ya hay fila, la devuelve; si no,
inserta `pending` con `offered_on = hoy de Uruguay` si ninguna oferta no `skipped` tiene
`offered_on > hoy − 30`, y `skipped` si no. Devuelve `{ offer_id, moment, state, newly_offered }`.
`my_pets_survey` mira las adopciones en curso de quien publica sin fila, de la más nueva a la más
vieja, y como mucho una queda `pending`: las demás quedan `skipped` en la misma llamada. Devuelve solo
ofertas `pending` de adopciones en curso: si el animal se volvió a publicar o se borró, la oferta
queda `pending` (contada como ofrecida) y no se muestra (spec §Edge Cases).

**Por qué**: «desde el día en que vio la anterior» es el render de la pantalla, no el hecho
(spec §Assumptions). El candado por persona hace que dos pestañas que abren dos desenlaces a la vez
no dejen dos `pending`. Volver a llamar no cambia nada: la fila existe.

El prefetch de un `Link` no llega a esta llamada: Mi solicitud y Mis animales son dinámicas, y Next
prefetchea solo hasta su `loading.tsx`. La oferta nace cuando la pantalla se pinta de verdad.

**Descartado**: crear la oferta en el disparador del desenlace (contaría desde el hecho, no desde
que la ve, y la ofrecería a quien nunca abrió la pantalla); un endpoint aparte llamado desde el
cliente (otra hoja cliente por pantalla y un render en dos pasos).

## R3 — Los desenlaces, leídos de lo que ya existe

**Decisión**:
- `gave`: `adoptions` con `publisher_id = auth.uid()` y `ended_at is null`; día del desenlace,
  `marked_at`. Sirve igual para `site` y `outside` (FR-003).
- `adopted`: `adoptions` `site` con `adopter_id = auth.uid()` y `declined_at is null`.
- `not_chosen`: `applications` con `applicant_id = auth.uid()` y `status = 'rejected'` (rechazada o
  aceptación sin efecto, #65; el momento es `application_reviews.rejected_at`) o `status = 'closed'
  and close_reason = 'adopted'` (#67: las no elegidas al marcar adoptado, a otra persona o por
  fuera; el momento es `changed_at`).
Ningún otro `status` ni `close_reason` (`withdrawn`, `unpublished`, `not_receiving`,
`you_blocked`, `suspended`, `handed_over`) ofrece encuesta.

**Por qué**: es la lista cerrada de la decisión 2026-10-08 y ya está escrita en la base; no hace
falta otro registro de «qué pasó».

## R4 — Las respuestas sin persona y las cuentas aparte

**Decisión**: `public.survey_answers (id, moment, option, body text null, answered_on date)` sin
ninguna referencia a la oferta ni a la persona; `public.survey_counts (moment pk, offered int,
dismissed int)` con tres filas sembradas por la migración. Respondidas y por opción se cuentan de
`survey_answers`; ofrecidas y cerradas, de `survey_counts`. `survey_for` y `my_pets_survey` suman
`offered` al insertar `pending`; `dismiss_survey` suma `dismissed`; el disparador de «Yo no
adopté» (R5) resta `offered`. Todo sin políticas ni permisos.

**Por qué**: FR-044 pide que borrar una cuenta no cambie ningún número, y la oferta se borra con la
cuenta (FR-050): las cuentas no pueden salir de las ofertas. Las respuestas no tienen nada con qué
volver a la persona (FR-051): ni FK, ni hora, ni el id de la oferta.

**Riesgo aceptado**: en una beta de pocas personas, el día de una respuesta y el día de una oferta
pasada a `answered` podrían cruzarse a mano en la base. Nadie lee la base salvo el equipo y el sitio
no lo muestra (FR-043); `known-limitations.md` lo anota.

**Descartado**: guardar la respuesta en la oferta y anonimizar al borrar (la respuesta estaría unida
a la persona mientras viva la cuenta); contar ofrecidas desde `survey_offers` (bajaría al borrar
cuentas).

## R5 — «Yo no adopté» retira la oferta pendiente

**Decisión**: un disparador `after update of declined_at on public.adoptions`: si `declined_at`
pasa a no nulo, borra la oferta `adopted` de esa adopción si está `pending` y, si borró una, resta
1 a `survey_counts.offered` de `adopted`. No toca una oferta `answered` (la respuesta queda).

**Por qué**: FR-007 y la decisión 2026-10-08. Borrar la fila hace que no cuente para los 30 días
sin otra regla. No toca `decline_adoption` de #67.

## R6 — Desde cuándo: `survey_settings.since`

**Decisión**: una tabla de una fila, `private.survey_settings (since timestamptz)`, que la
migración llena con `now()`. Un desenlace anterior no ofrece encuesta.

**Por qué**: la spec deja afuera los desenlaces anteriores (datos de prueba). Una constante en la
función tendría la fecha del PR, no la del arranque local de cada clon.

## R7 — Responder y cerrar: una función cada una, con candado

**Decisión**: `public.answer_survey(p_offer uuid, p_option text, p_body text)` y
`public.dismiss_survey(p_offer uuid)`, `security definer`. Toman la oferta `for update`, exigen
`person_id = auth.uid()` y cuenta no suspendida, validan la opción para el momento y el largo
(≤ 500, `btrim` vacío → nulo). `pending` → insertan la respuesta (o suman `dismissed`) y cambian el
estado; `answered` → `already`; `dismissed` → `dismissed` (el envío no guarda nada y la encuesta
desaparece, spec §Edge Cases); otra persona o inexistente → `not_found`.

**Por qué**: el `for update` hace que dos pestañas, un doble toque o un reintento dejen una sola
respuesta (FR-010). El teléfono y el correo los frena el schema zod con `contactMatch` (solo los tipos `phone` y
`email`, la regla de la spec) en la acción; la base frena el largo y la opción.

## R8 — Las opiniones: una tabla anónima y un tope por navegador

**Decisión**: `public.feedback (id, body, screen, subject text null, sent_on date, attempt_id
uuid unique)` y `public.feedback_quota (browser_hash text, day date, sent smallint, pk (browser_hash,
day))`, sin políticas. `public.send_feedback(p_browser_hash, p_attempt, p_body, p_screen,
p_subject)`, `security definer`, con `execute` para `anon` y `authenticated`: si el `attempt_id` ya
existe → `already`; si el navegador ya mandó 5 hoy → `limit`; valida largo (1–1.000 tras `btrim`) y
`screen` contra la lista cerrada; inserta, suma 1 y borra las filas de `feedback_quota` de días
anteriores. El navegador es una cookie `httpOnly` `opinar` con un valor al azar que la acción crea si
falta; a la base llega su SHA-256.

**Por qué**: FR-023 cuenta por navegador y FR-051 prohíbe guardar el navegador con la opinión: el
contador vive aparte, sin decir cuáles mandó, y muere al día siguiente. `attempt_id` (uno por cada
apertura del formulario) es el doble toque y el reintento (FR-025); es al azar y no dice nada de la
persona. Sin sesión no hay `auth.uid()`, así que la función acepta `anon`: un abuso con cookies
nuevas salta el tope, que la spec acepta («un freno, no una garantía»).

**Descartado**: la cookie `visit` de #9 (muere al cerrar el navegador y une la opinión a la visita
medida); contar por IP (dato personal nuevo).

## R9 — La pantalla de una opinión: una función pura

**Decisión**: `feedbackScreen(pathname)` en `lib/feedback/screens.ts` devuelve `{ screen, subject
}`. Públicas con sujeto: `/animales/{code}` → `pet` + el código; `/perfil/{id}` → `profile` + el id
público. Públicas sin sujeto: `home`, `listing`, `levels`. Privadas, solo el nombre: `my_pets`,
`my_application`, `my_applications`, `publisher_applications`, `my_profile`, `verification`,
`review`, `sign_in`, `suspended`, y `other` para cualquier otra. El formulario manda el `pathname`
de `usePathname()` al enviar; la acción lo traduce. Opiniones muestra el nombre de la pantalla y,
para `pet`, el nombre del animal si sigue existiendo (`left join` por código) con su enlace.

**Por qué**: spec §Edge Cases. Mandar el nombre ya traducido desde el cliente dejaría que cualquiera
escriba cualquier cosa en `screen`; la acción decide.

## R10 — Opinar a la vista sin bajar, sin pagar JS en cada pantalla

**Decisión**: `PaperFrame` suma `FeedbackTrigger` en la fila de arriba (al lado de `AccountMenu`, o
de la marca cuando `menu={false}`) y `SiteFooter` al final de la hoja. `FeedbackTrigger` es una hoja
cliente mínima (un `Button` `ghost` «Opinar») que al primer toque importa con `import()` dinámico
`FeedbackSheet` (el `Sheet` con el formulario). Los textos bajan por props desde `PaperFrame`, que
pasa a ser `async` y los lee con `getTranslations`.

**Por qué**: FR-020 pide verlo sin bajar en todas las pantallas; la fila de arriba ya está en todas
y no tapa nada (un botón flotante taparía la tirita de cada pantalla en el teléfono). El `Sheet` y
el formulario no entran al JS inicial de la portada (presupuesto de docs/07).

El 404 global (`app/not-found.tsx`, fuera de los grupos) y `/muestra` (solo en desarrollo) no
llevan `PaperFrame` hoy y no lo suman: el 404 de cada grupo sí lo lleva.

**Descartado**: un botón flotante fijo abajo (tapa la acción principal en 390 px); solo en el pie
(no está a la vista sin bajar).

## R11 — El WhatsApp de soporte: una constante y una ruta que mide

**Decisión**: `SUPPORT_WHATSAPP` en `lib/config.ts`, de `NEXT_PUBLIC_SUPPORT_WHATSAPP` (solo
dígitos, con el código de país), nulo si falta o está vacío. `supportWhatsAppUrl(number, greeting)`
en `lib/support/whatsapp.ts` arma `https://wa.me/{número}?text={saludo}`. El pie enlaza a
`/api/soporte/whatsapp`, que mide `support_whatsapp_opened` con la pantalla de `feedbackScreen` sobre
el `Referer` (`other` si falta) y redirige (303) a WhatsApp; sin número, 404. Opinar, el tope del día
y los errores de teléfono reciben `supportUrl: string | null` y lo nombran solo si no es nulo.

**Por qué**: FR-030/031 y FR-060. El pie es servidor y no sabe la ruta; el `Referer` sí. Es el
mismo patrón que `api/solicitudes/[id]/whatsapp` de #65. El saludo lleva solo `APP_NAME` (FR-053).

## R12 — Opiniones y Encuestas: dos pantallas de `/revision`, funciones con `is_admin`

**Decisión**: `/revision/opiniones` y `/revision/encuestas`, `noindex`. Sin sesión o sin
administrar → `notFound()` (con `getSessionUser` + `isAdmin`, no `requireProfile`, que mandaría a
ingresar: la spec pide «que no existe»). Funciones `security definer` que empiezan con `if not
private.is_admin() then return; end if`: `admin_feedback(p_before_on date, p_before_id uuid,
p_limit int)`, `admin_delete_feedback(p_id uuid)`, `admin_survey_summary()` (por momento: ofrecidas,
respondidas, cerradas y por opción) y `admin_survey_answers(p_moment, p_before_on, p_before_id,
p_limit)` (solo las que tienen texto). Listas de a 50, de la más nueva a la más vieja por día y
luego por id, con «Ver más» (`?antes=`), como las colas de `/revision`. `/revision` suma los dos
caminos.

**Por qué**: FR-040–FR-045. El orden dentro de un día es estable pero no cronológico: no hay hora
(R4, R8).

## R13 — Los eventos

**Decisión**: `survey_offered {moment}` (con `newly_offered`), `survey_answered {moment, option,
wrote}`, `survey_dismissed {moment}`, `feedback_sent {screen}`, `support_whatsapp_opened {screen}`,
en `lib/analytics/survey-events.ts` y `events.ts`. Nunca el texto, el sujeto ni ids.

**Por qué**: FR-060/061. `feedback_sent` lleva solo `screen`, sin `subject`: el código de un animal
junto a la marca de visita diría qué miraba esa visita, y eso ya lo mide #57 por su lado.

## R14 — Dependencias

**Decisión**: ninguna nueva. `Sheet`, `RadioGroup`, `CountedTextarea`, `DestructiveConfirmDialog`,
`Toast`, `contact-match`, `crypto` de Node para el SHA-256.
