# Research — Preguntar qué frena a quien deja la verificación

Decisiones de diseño de la historia #234. Cada una dice qué se eligió, por qué y qué se descartó.
El código existente que se reusa está nombrado con su ruta.

## R1. Qué se guarda y dónde

**Decisión**: tres tablas nuevas y una de cuentas, todas con RLS encendida, **sin políticas** y con
`revoke all ... from anon, authenticated`, como las de #71 (`20261010120000_surveys_feedback.sql`):
se leen y escriben solo por funciones `security definer`.

- `verification_exit_asks (person_id, level)`: la marca de FR-024. Clave primaria compuesta, FK a
  `auth.users on delete cascade`, **sin día ni estado**.
- `verification_exit_tickets (ticket, level, origin)`: la pregunta hecha y todavía sin resolver, sin
  persona (R3).
- `verification_exit_answers (id, level, option, origin, body, answered_on)`: la respuesta, sin
  persona, con el día de Uruguay (`public.uruguay_today()`).
- `verification_exit_counts (level, origin, asked, skipped)`: las veces preguntadas y seguidas sin
  contestar, que no dependen de las cuentas de personas (FR-023). La migración inserta las seis filas.

**Por qué**: es lo que la historia promete guardar y nada más (constitución §V, Ley 18.331). Las
cuentas de «preguntada» y «seguida sin contestar» viven aparte porque contarlas desde las marcas las
haría bajar al borrar una cuenta (SC-005); las contestadas salen de las respuestas, que nunca se
borran.

**Descartado**: guardar el estado (contestada, seguida sin contestar) en la marca, como
`survey_offers` de #71. La historia dice «de cada persona queda solo que ya se le hizo la pregunta»;
saber si contestó ya es más que eso. Reusar `survey_offers`/`survey_answers` con momentos nuevos:
mezclaría la regla de los 30 días, que esta pregunta no debe tocar (FR-006), y obligaría a cambiar los
`check` de #71.

## R2. Cuándo corresponde la pregunta (FR-001 a FR-005)

**Decisión**: una función `private.verification_exit_eligible(p_person uuid, p_level text)`:

- `phone`: no hay fila en `public.phones` de la persona con `verified_at is not null` **ni** con
  `number_lost_on is not null`. El número perdido (#25) es la única forma de que una cuenta que
  verificó quede sin `verified_at`, y lo marca `number_lost_on`.
- `identity`: no hay fila en `public.identity_verifications` (la aprobación es de la cuenta y no se
  pierde).
- En los dos: no hay marca de ese nivel y la cuenta no está suspendida (`private.is_suspended`).

`public.verification_exit_due(p_level)` la expone a la persona con su sesión, solo para sí misma,
y devuelve un `boolean`. La página la usa para decidir si «Ahora no» es el enlace de siempre o el
botón que pregunta (R4): sin pregunta pendiente, la pantalla queda como hoy (story §Pantallas).

**Por qué**: en la base, así un doble envío o dos pestañas no saltean la regla, y se calcula con lo
que ya está guardado: no nace ninguna columna nueva sobre la persona. «Cancelar el cambio» queda
afuera solo, porque un cambio a medias tiene `verified_at`.

**Descartado**: una columna `phone_ever_verified` en `phones`: es un dato nuevo de la persona que
`verified_at` + `number_lost_on` ya dicen.

## R3. Una sola respuesta por pregunta sin unir la respuesta a nadie (FR-014)

**Decisión**: al hacer la pregunta, `public.ask_verification_exit(p_level, p_origin)` inserta la
marca (`on conflict do nothing`; si ya estaba, devuelve nulo), suma 1 a `asked` de ese nivel y
origen, e inserta un **ticket** aleatorio (`gen_random_uuid()`) con el nivel y el origen, sin persona.
Devuelve el ticket. La acción lo guarda en una cookie `httpOnly`, `sameSite=lax`, `secure` en
producción, de un día, una por nivel (`salida-telefono`, `salida-identidad`).

Contestar (`answer_verification_exit(p_ticket, p_option, p_body)`) borra el ticket y, en la misma
sentencia (`delete ... returning` en un CTE), inserta la respuesta con el nivel y el origen del ticket.
Si el ticket ya no está devuelve `already`: el doble toque, el reintento después de un corte y la
otra pestaña (que comparte la cookie) terminan en una sola respuesta, la primera. Seguir sin contestar
(`skip_verification_exit(p_ticket)`) borra el ticket y suma 1 a `skipped`; si ya no está, `already`.

**Por qué**: el ticket es lo único que une la pestaña con la pregunta, y no dice de quién es. La
cookie evita que el ticket viaje en la dirección (historial, registros del servidor). El origen
viaja en el ticket y no en el formulario, así nadie lo cambia al contestar.

**Descartado**: un `attempt_id` del navegador como en Opinar (#71): cubre el doble toque pero no dos
pestañas. Un estado en la marca: ver R1.

Los tickets de quien se fue sin tocar nada quedan sin resolver; no dicen nada de nadie. La tarea
diaria no los toca: en una beta chica son pocas filas. Si hiciera falta, se borran todos sin
cambiar ninguna cuenta.

## R4. «Ahora no» y «Cancelar la verificación» que preguntan

**Decisión**:

- Con pregunta pendiente (R2), «Ahora no» deja de ser `NotNowLink` y pasa a ser `NotNowButton`: un
  `<form action>` del servidor con `FormSubmit` `ghost`, como `CancelPendingButton`, que funciona sin
  JavaScript. Postea el nivel y la pantalla con su consulta (`self`). La acción
  `leaveVerification` vuelve a leer la puerta de esa consulta (`parseGate`, `validPath`), calcula el
  origen y el destino (R5), llama a `ask_verification_exit` y, con ticket, pone la cookie y redirige
  a la misma pantalla con `?pregunta=1` (más la consulta de la puerta); sin ticket (ya preguntada,
  otra pestaña ganó), redirige al destino.
- `cancelPendingPhone` (`src/actions/phone.ts`): si la cancelación salió bien y el teléfono estaba
  a medias **por primera vez** (lo dice `verification_exit_due('phone')`, que es falso con un cambio
  a medias), hace lo mismo que «Ahora no» y redirige a la pregunta; si no, como hoy
  (`cancelReturnPath`).
- La página del teléfono, la de escribir el código y la del pedido de identidad leen `pregunta=1`:
  con la cookie de su nivel presente, dibujan `ExitQuestion` en lugar del formulario. Sin la cookie
  (vencida, ya contestada en otra pestaña), la pantalla de siempre: la marca ya está y no se
  pregunta de nuevo.

**Por qué**: hacer la pregunta es una escritura (la marca, la cuenta), y una escritura no va en un
enlace, que los navegadores precargan. El formulario del servidor ya es el patrón de cancelar.

**Descartado**: un `Dialog` sobre la pantalla: el diseño reserva `Dialog` para confirmaciones
irreversibles (docs/10), y la historia pide la pregunta «en el lugar de lo que la persona estaba
completando».

## R5. Origen y destino (FR-007, vocabulario)

**Decisión**: dos funciones puras en `src/lib/verification/exit-question.ts`:

- `exitOrigin(level, input)`:
  - teléfono, con la puerta: `publish` → `publish`; `apply` → `apply`; `identity` con `from` en la
    ficha de un animal (`/animales/<código>`) → `apply`; cualquier otra o sin puerta → `self`;
  - identidad: con el animal de vuelta (`?animal=<código>`, `RETURN_FLAG`) → `apply`; sin él → `self`.
- `exitDestination(level, input)`:
  - teléfono: con la puerta, `notNowDestination(gate)` (lo de hoy); sin ella, `/mi-perfil`;
  - identidad: `petPath(código)` con el animal, `/mi-perfil` sin él (el `leavePath` de hoy).

**Por qué**: una sola fuente para la página, la acción y las pruebas; es la regla de negocio que
más fácil se rompe en silencio. Publicar una camada usa la puerta `publish`, así que cuenta como
publicar sin código aparte.

## R6. Las opciones como claves

**Decisión**: niveles `phone` · `identity`; orígenes `publish` · `apply` · `self`; opciones:

- `phone`: `no_number` · `no_code` · `later` · `groups` · `other`
- `identity`: `no_id_photos` · `later` · `too_much` · `groups` · `other`

En `src/lib/verification/exit-question.ts` (`EXIT_LEVELS`, `EXIT_ORIGINS`, `EXIT_OPTIONS`) y en la
función `private.verification_exit_option_valid(level, option)` de la migración, con la misma lista.
Los textos, en `messages/es.json` bajo `verification.exit` (pregunta y opciones por nivel, palabra
por palabra de la historia) y `surveys.exits` (Encuestas).

## R7. El texto de «Otra cosa» (FR-009, FR-011, FR-012)

**Decisión**: `verificationExitAnswerSchema` en `src/lib/schemas/verification-exit.ts`, compartido
entre el cliente y la acción: la opción tiene que ser de su nivel; el texto se recorta y vacío es
nulo; solo con `other`; hasta 300 puntos de código (`char_length`, como `surveyAnswerSchema`); sin
teléfono ni correo con `phoneOrEmailMatch` (`src/lib/contact/contact-match.ts`), con el error
`verification.exit.errors.contact`. La base repite el tope y la regla «solo con `other`» en un
`check`.

**Por qué**: es la misma regla que #71, con el mismo detector; repetirla en el cliente da el aviso
sin ir al servidor y la acción no confía en el cliente.

## R8. Encuestas (FR-016 a FR-023)

**Decisión**: dos funciones para quien administra, vacías para cualquier otra persona
(`private.is_admin()`):

- `admin_verification_exit_summary()` → una fila por nivel, origen y opción: `asked`, `skipped` (de
  `verification_exit_counts`) y `chosen` (las respuestas de ese nivel, origen y opción, cero si no
  hay). La consulta arma las 30 combinaciones con las listas de R6, así una opción sin elegir
  igual aparece.
- `admin_verification_exit_texts(p_level, p_before_on, p_before_id, p_limit)` → `(id, body,
  answered_on)`, solo con texto, del más nuevo al más viejo, con el cursor de `readNewest`
  (`src/lib/supabase/queries/newest-first.ts`), como `admin_survey_answers`.

La página `/revision/encuestas` suma la sección debajo de los tres momentos. «Ver más» de cada nivel
viaja en la consulta (`salida_phone`, `salida_identity`) junto a las de #71: `moreHref` pasa a
conservar todas las cuentas de la página.

## R9. Medición (FR-028)

**Decisión**: tres eventos nuevos en `EVENTS` (`src/lib/analytics/events.ts`), armados en
`src/lib/analytics/verification-exit-events.ts`:

- `verification_exit_asked` `{ level, origin }`: cuando `ask_verification_exit` devolvió un ticket.
- `verification_exit_answered` `{ level, option, origin, wrote }`: cuando la respuesta quedó guardada
  (`answered`); no con `already`.
- `verification_exit_skipped` `{ level, origin }`: cuando el ticket se resolvió sin respuesta.

El origen de los dos últimos lo devuelve la función de la base desde el ticket. Nunca el texto ni un
id (como `survey-events.ts`).

## R10. Qué se prueba y por qué (docs/09 §Qué vale la pena testear)

- **Unitarias + Stryker al 100 %**: `exitOrigin` y `exitDestination` (un origen mal calculado
  engaña la lectura de la hipótesis; un destino mal calculado deja a la persona en otro lado),
  `verificationExitAnswerSchema` (contacto, tope, opción de otro nivel, texto sin «Otra cosa»), las
  listas de opciones por nivel, `exitSummaryBlocks` (arma los bloques de Encuestas desde las filas:
  totales, por origen, vacíos) y los tres eventos.
- **Base (tests/db)**: lo que expone un dato o cuenta mal — un visitante y una persona no leen
  ninguna de las cuatro tablas; la marca se pone una sola vez por nivel también con dos llamadas en
  paralelo; no se pregunta a quien verificó el teléfono, lo perdió (#25) o tiene la identidad
  aprobada, ni a una cuenta suspendida; contestar y seguir sin contestar resuelven el ticket una sola
  vez (`already` después); la opción de otro nivel y el texto sin `other` o de 301 se rechazan;
  borrar la cuenta borra la marca y no cambia cuentas ni respuestas; las funciones de quien
  administra vuelven vacías para quien no administra; las respuestas no tienen ninguna columna que
  apunte a una persona.
- **e2e (Playwright)**: un flujo, el de la US1: desde la ficha de un animal que pide nivel 2,
  «Ahora no» en el pedido de identidad → la pregunta → una opción → la ficha; la segunda vez sale
  directo.
- **Nada** para `ExitQuestion` como dibujo, las páginas ni las queries finas.
