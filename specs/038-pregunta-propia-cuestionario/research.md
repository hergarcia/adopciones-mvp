# Research: Pregunta propia en el cuestionario de un animal

Decisiones del cómo para la spec `specs/038-pregunta-propia-cuestionario/spec.md` (historia #292).
Cada una dice qué se eligió, por qué y qué se descartó.

## R1. Dónde vive la pregunta

**Decisión**: una columna `own_question text` en `public.pets` (solo para un animal sin camada) y otra
en `public.litters`. Una cría no tiene la suya: `private.pet_own_question(p public.pets)` devuelve la de
la camada cuando `p.litter_id` no es nulo, y la del animal si no. Un `check` en `pets` impide guardar
una pregunta en una cría (`litter_id is null or own_question is null`). Se guarda recortada, de 1 a 200
caracteres (`char_length`, puntos de código, como el resto), o nula; sin pregunta es nulo, nunca `''`.

**Por qué**: `pets` y `litters` ya se leen solo con `*_select_own` (la dueña) y todo lo público pasa por
funciones `security definer` con columnas nombradas (`listed_pets`, `pet_by_code`, `litter_by_code`,
`pet_share_card`, el perfil público): una columna nueva no aparece en ninguna sin tocarlas (se revisó
que ninguna devuelve la fila entera con `to_jsonb` ni `setof public.pets`). Leer la de la camada en el
momento evita copiarla a cada cría y mantenerla sincronizada: una cría sumada después la tiene sola
(FR-014) y una cría no puede quedar con una distinta.

**Descartado**: copiarla a cada cría como el nivel exigido (#205, R1): hay que propagar cada cambio y
una cría quitada de la camada podría quedarse con la vieja; una tabla `own_questions` aparte: un join
más en cada lectura para un dato uno a uno.

## R2. Cómo guarda la solicitud lo que se contestó

**Decisión**: dos columnas en `public.applications` y en `public.held_applications`: `own_question
text` (la pregunta tal como estaba al mandarla o dejarla escrita) y `own_answer text`. Las dos nulas o
las dos con texto (`check`); la respuesta de 1 a 500 y no solo espacios, la pregunta de 1 a 200. En
`held_applications`, al no salir quedan nulas junto con `answers` (se extiende
`held_applications_answers_while_waiting`). Al salir, `private.release_held_applications` las copia a
la solicitud con el resto.

**Por qué**: el objeto `answers` tiene como claves las preguntas del sitio, con id estable y validado
contra la lista de `questionnaire.ts` (docs/06 §Cuestionario). La pregunta propia la escribe una persona
y cambia; meterla ahí rompería la paridad y haría que `last_answers` (las respuestas propuestas) se
llevara la respuesta de otro animal. Aparte, la regla de FR-013 sale sola: lo propuesto lee solo
`answers`. Decisión registrada en docs/06 §Cuestionario (2026-11-18).

**Descartado**: una clave `own_question` dentro de `answers` con el texto al lado (rompe la forma que
valida `private.application_answers_shape` y la paridad con `QUESTION_IDS`); guardar solo una versión
o una referencia a la pregunta (cambiar la pregunta cambiaría lo que se lee de una solicitud vieja, que
es lo que FR-018 prohíbe).

## R3. Pregunta cambiada al enviar

**Decisión**: `submit_application` y `hold_application` reciben dos parámetros más,
`p_own_question text` (la que la persona tenía en pantalla, o nulo) y `p_own_answer text`, y devuelven
una columna más, `own_question text`. Después de todos los frenos de hoy y antes de validar `answers`:

- sin pregunta hoy: se ignora lo recibido y la solicitud sale sin ella (spec §Assumptions, la pregunta
  sacada mientras se escribe);
- con pregunta hoy y lo recibido no es el mismo texto (`btrim` de los dos, o nulo): outcome
  `question_changed` con `own_question` = la de hoy, sin guardar nada;
- con la misma: la respuesta tiene que ser de 1 a 500 y no solo espacios (si no, `answers_invalid`) y
  se guarda la pregunta de hoy, que es la misma, con la respuesta.

En `sent` y `held`, `own_question` es la que quedó guardada o nulo: de ahí sale el sí o el no de la
medición sin otra lectura. Las funciones se reemplazan con `drop function` de la firma vieja y
`create function` con la nueva, y se repiten sus `revoke`/`grant`.

La pregunta se compara por texto, no por versión: volver al texto que la persona contestó es la misma
pregunta (spec §Vocabulario). La idempotencia queda como hoy: el mismo intento devuelve `already`
antes de mirar la pregunta.

**Por qué**: es la única comparación que no puede quedar vieja: la hace la base en la misma
transacción que inserta, con el candado de la cuenta que ya toma. Un chequeo previo desde el cliente
dejaría pasar un cambio entre el chequeo y el envío.

**Descartado**: guardar la solicitud con la pregunta nueva y la respuesta vieja (lo que FR-015
prohíbe); un número de versión en el animal (la regla de la historia es por texto y un número más no
cambia nada de lo que ve nadie).

## R4. La pregunta en el cuestionario

**Decisión**: `QUESTION_IDS` y `QUESTIONS` no cambian (son la lista con paridad en la base). Se suma
un paso virtual: `FormQuestionId = QuestionId | 'own_question'`, y `visibleQuestions(answers, pet)`
recibe `pet: { isNeutered: boolean; ownQuestion: string | null }` y, con pregunta, inserta
`{ id: 'own_question', kind: 'own', text }` justo antes de `why_this_pet`. `stepOf` y
`lastAnswered` ubican el paso por esa lista (no por el índice en `QUESTION_IDS`). El estado del
formulario guarda `answers` (las del sitio) y `ownAnswer` aparte. `validateApplication(input, pet)`
valida también `own_question` con la misma regla de texto (obligatoria, 500, sin contacto) y devuelve
`{ answers, ownAnswer }`.

En pantalla es una pregunta de texto más (`QuestionField` con `CountedTextarea` de 500), con la
etiqueta «La pregunta de <nombre>» arriba del texto de la pregunta (el nombre es `publisher_name` de
`apply_context`, que la página ya trae). La acción manda `{ answers, ownQuestion, ownAnswer }`.

Con `question_changed`, la acción devuelve `detail.ownQuestion` (la de hoy). `useApplicationSubmit`
lo pasa al formulario, que: cambia la pregunta en pantalla, mueve lo escrito a `previousOwnAnswer`,
vacía la respuesta, va a ese paso y muestra `ChangedQuestionNote` arriba de la pregunta y lo anterior
debajo del campo (`PreviousAnswer`, texto seleccionable, no un campo). Sin JS no hay cuestionario
(ya es hoja cliente), así que no hace falta otra forma.

Con `own_question` nulo en la respuesta de la base, pero pregunta en pantalla (la sacaron): la
solicitud ya salió; la confirmación es la de siempre.

**Por qué**: la pregunta propia se valida, se cuenta y se marca igual que las abiertas del sitio, sin
tocar la lista que comparte con la base. Ponerla como paso propio respeta «un paso por pantalla»
(docs/10 §Layout) y deja el foco en ella cuando cambia.

**Descartado**: mostrarla en el mismo paso que «¿Por qué <nombre>?» (dos campos largos en un paso);
recargar la página con la pregunta nueva (pierde el estado si el borrador falla).

## R5. El borrador del cuestionario y lo que se recupera del formulario de publicar

**Decisión**: `ApplicationDraft` suma un campo opcional `own?: { question: string; answer: string }`
(sin subir `v`: un borrador viejo sin el campo sigue sirviendo). Al restaurar, la respuesta vuelve solo
si `own.question` es la misma que la de hoy; si no, va a `previousOwnAnswer` y el paso queda vacío,
como al enviar con la pregunta cambiada. El borrador de publicar (`usePetDraft`, `useLitterDraft`)
guarda `ownQuestion` como cualquier otro campo de `PetFormValues` y de los valores de la camada.

**Por qué**: FR-008 y el caso borde del borrador; un campo opcional evita descartar los borradores de
quien ya está escribiendo el día del deploy.

## R6. Leer la pregunta en la solicitud

**Decisión**: `public.publisher_application(p_id)` suma `own_question text`, `own_answer text` y
`asks_now boolean` (si `private.pet_own_question` del animal hoy no es nulo; falso si el animal ya no
existe). `public.my_application(p_id)` suma `own_question` y `own_answer`. Las dos se reemplazan con
`drop` + `create` (cambia el tipo que devuelven) y repiten sus permisos.

`answerWords` (la que arma los renglones de `AnswerList`) recibe `own: { question, answer } | null` y
`ownLabel`: con respuesta, un renglón `{ id: 'own_question', question, answer }` justo antes de
`why_this_pet`; para quien publicó, sin respuesta y con `asks_now`, el renglón
`{ id: 'own_question', question: «Tu pregunta para quien quiera adoptarlo», answer: «Llegó antes de tu
pregunta» }` en el mismo lugar (FR-019). Quien solicitó nunca recibe `asks_now`.

**Por qué**: un solo lugar arma el orden de las respuestas para las dos puntas y el repaso, y el aviso
cae donde iría la respuesta, con un nombre que no se confunde con «Pedir más información».

## R7. Encuestas: «Lo que preguntan quienes publican»

**Decisión**: `public.admin_own_question_summary()` (`security definer`, `where private.is_admin()`,
`grant execute` a `authenticated`, como `admin_deletion_reason_summary`) devuelve una fila:
`published integer`, `with_question integer`, `questions text[]` en orden alfabético
(`order by lower(q), q`). Publicadas hoy: animales sin camada con
`private.pet_state(...) in ('available','in_process','paused','expired')` y camadas con
`private.litter_state(l) in ('available','paused','expired')`, en las dos de una dueña que no está
suspendida (`not private.is_suspended(owner_id)`). Una camada cuenta una vez y su pregunta aparece una
vez. Para cualquier otra persona, cero filas.

La página suma `ownQuestions(summary, shown)` en `revision/encuestas/_components/own-questions.tsx`
debajo de las otras secciones; la query `ownQuestionSummary()` en `queries/own-questions.ts` devuelve
`null` si falla (no lanza), así la sección dice que no se pudo y el resto se ve (FR-023). La lista usa
`SurveyAnswerList` con `meta` optativo (hoy obligatorio: se vuelve optativo) y «Ver más» con una clave
nueva `preguntas` en `shownLists` (`LIST_STEP` de siempre); cada renglón lleva un id por posición
(`pregunta-<n>`), nunca uno del animal.

**Por qué**: es el patrón de las otras secciones; el arreglo alfabético sin fecha ni id no deja unir
una pregunta con nadie (spec §Assumptions).

**Descartado**: contar cada cría (rompe «una camada es una publicación», decisión del 2026-10-20);
ordenar por fecha.

## R8. Escribir la pregunta al publicar y al editar

**Decisión**: `PetFormValues` y los valores de la camada suman `ownQuestion: string`. `petSchema` y
`litterSchema` suman `ownQuestion`: recortada, vacía → `null`, más de 200 → `pets.errors.own_question_too_long`,
contacto → `pets.errors.contact_*` con `addContactIssue` (la regla del nombre y la descripción, FR-005).
`PetField` suma `ownQuestion` (el foco va al campo con error como a los demás, y
`pet_contact_rejected` lo nombra). `publish_pet`, `save_pet`, `publish_litter` y `save_litter` leen
`p_fields ->> 'own_question'` (nulo o texto): la firma no cambia. `getMyPet` y `getLitterForEdit`
leen la columna (la dueña la ve por su política). El reintento de siempre (intento único en publicar,
guardar idempotente en editar) deja una sola versión (FR-007).

El campo es `OwnQuestionField` (`components/pets/own-question-field.tsx`), sobre `CountedTextarea`
sin `maxLength` (pasarse dice cuántos sobran, como la descripción): etiqueta «Tu pregunta para quien
quiera adoptarlo», ayuda «La ve quien te solicita, no la ficha.», el ejemplo como `placeholder`, tres
renglones, el contador de 200. Va en `PetFields` dentro de `end`, después de `RequiredLevelField`, y en
`LitterApplyFields` después de `DeliveryDateField`: las dos secciones que dicen cómo se adopta.

**Por qué**: la regla del contacto ya existe y es la misma; el campo vive donde se decide quién y cómo
puede solicitar, no entre lo que se muestra en la ficha.

## R9. Medición

**Decisión**:

- `pet_published` y `pet_edited` suman `own_question: boolean`, del valor que se guardó.
- `application_sent` suma `own_question: boolean`: en la acción, de `own_question` no nulo en la
  respuesta de `submit_application`; en la que sale sola, de una columna nueva
  `held_application_moments.own_question boolean` que `release_held_applications` llena al salir.
  `claim_held_application_moments` la devuelve (cambia su tipo: `drop` + `create`).
- `application_first_response`, `application_accepted` y `application_rejected` suman
  `own_question?: boolean`. Sale de `application_measure`, que suma `own_question boolean`
  (`a.own_answer is not null`); `ApplicationMeasure` suma `ownQuestion: boolean | null`. Como el nivel,
  si no se pudo leer no sale (nunca un valor por defecto). `question_asked` no lo lleva: la historia
  no lo pide.
- Ningún momento lleva el texto.

**Por qué**: la decisión del 2026-11-18 sobre la medición; reusar `application_measure` evita cambiar
el tipo de `accept_application`, `reject_application` y `ask_question`.

## R10. La lectura nueva en docs/03

**Decisión**: la lectura 14, «¿El cuestionario alcanza para elegir sin chatear?» (#292), al lado de
las lecturas 1 y 3: `pet_published` y `pet_edited` por `own_question`; entre `application_sent` con
`own_question` = `true` y `false`, qué parte tiene `application_first_response` con `kind` = `ask`,
qué parte `application_rejected` con `reason` = `no_answer` y la mediana de `hours` de
`application_first_response`; qué preguntan, en Encuestas; con 3 a 5 rescatistas es una señal. Se
escribe en la US5.

## R11. Qué se prueba y por qué

Se prueba lo que, si se rompe, engaña a quien decide o expone un texto:

- **Privacidad** (`tests/db/own-questions-privacy.test.ts`): sin sesión y con otra persona, ni
  `listed_pets`, `pet_by_code`, `litter_by_code`, `pet_share_card` ni el perfil público traen la
  pregunta; otra persona no la lee de `pets` ni de `litters`; quien administra no lee respuestas
  (ninguna función de administrar devuelve `own_answer`) y `admin_own_question_summary` no devuelve
  nada a quien no administra; quien publicó no lee la respuesta de una solicitud de otro animal ajeno;
  quien solicitó no recibe `asks_now`.
- **Reglas** (`tests/db/own-questions-rules.test.ts`): enviar con la misma, con otra, sin y con una
  sacada; cambiar y sacar no tocan lo guardado; la cría (también una sumada después) contesta la de la
  camada; una cría no puede tener la suya; dejar escrita, salir con la pregunta y no salir sin ella;
  el resumen cuenta lo publicado hoy, sin adoptadas, dadas de baja ni suspendidas, la camada una vez,
  en orden alfabético; los largos (paridad con `OWN_QUESTION_MAX_LENGTH` = 200).
- **Lógica pura con Stryker al 100 %**: los schemas de animal y camada (`ownQuestion`), el de la
  solicitud con la pregunta propia, `visibleQuestions`/`stepOf`/`lastAnswered` con el paso virtual,
  `submitOutcome` y `heldOutcome` con `question_changed`, `readApplicationDraft` con `own`,
  `answerWords` con la pregunta y con «Llegó antes», el armado del resumen de Encuestas, y los
  constructores de los eventos.
- **E2E** (`tests/e2e/pregunta-propia.spec.ts`): publicar con pregunta, solicitar contestándola y
  abrir la solicitud de los dos lados.
- **No se prueba**: que el campo pinte, las páginas, la sección de Encuestas como dibujo.
