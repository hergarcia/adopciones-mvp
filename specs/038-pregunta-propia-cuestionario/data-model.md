# Data Model: Pregunta propia en el cuestionario de un animal

Una migración forward-only: `supabase/migrations/20261118120000_own_questions.sql`. Después,
`pnpm db:types`.

## Constantes

| Nombre | Valor | Dónde | Paridad |
|---|---|---|---|
| `OWN_QUESTION_MAX_LENGTH` | 200 | `src/lib/applications/rules.ts` | `private.own_question_max_length()` (test de paridad en `tests/db/own-questions-rules.test.ts`) |
| `ANSWER_MAX_LENGTH` | 500 | ya existe | `private.answer_max_length()`, ya existe; la respuesta propia usa la misma |

## Columnas nuevas

### `public.pets`

| Columna | Tipo | Regla |
|---|---|---|
| `own_question` | `text null` | `char_length(own_question) between 1 and 200` y `own_question = btrim(own_question)` cuando no es nula; `litter_id is null or own_question is null` (una cría usa la de su camada) |

### `public.litters`

| Columna | Tipo | Regla |
|---|---|---|
| `own_question` | `text null` | las mismas de largo y recorte |

Las dos tablas siguen con su única política de lectura (`*_select_own`). Ninguna función pública
nueva ni existente devuelve la columna, salvo las de la tabla de abajo.

### `public.applications`

| Columna | Tipo | Regla |
|---|---|---|
| `own_question` | `text null` | la pregunta tal como estaba al mandarla; 1 a 200 |
| `own_answer` | `text null` | 1 a 500 y no solo espacios |

`check ((own_question is null) = (own_answer is null))`. Las dos se borran con la fila (la cuenta de
quien solicitó, como `answers`). Ninguna se toca después de insertar.

### `public.held_applications`

Las mismas dos columnas y reglas. `held_applications_answers_while_waiting` pasa a exigir además que,
con `status = 'lapsed'`, `own_question` y `own_answer` sean nulas. `private.lapse_held_applications`
las pone en nulo en la misma sentencia que `answers`.

### `public.held_application_moments`

| Columna | Tipo | Regla |
|---|---|---|
| `own_question` | `boolean null` | se llena en los `released` (si la solicitud que salió tiene respuesta propia); nula en los `lapsed` |

## Funciones

Nuevas:

| Función | Qué hace | Permisos |
|---|---|---|
| `private.own_question_max_length()` | 200 | ninguno afuera |
| `private.pet_own_question(p public.pets)` | la de la camada si `p.litter_id` no es nulo; si no, `p.own_question` | ninguno afuera |
| `public.admin_own_question_summary()` | una fila `(published integer, with_question integer, questions text[])`: lo publicado hoy (R7) y las preguntas en orden alfabético; cero filas si no administra | `authenticated` |

Reemplazadas con `drop` + `create` (cambia la firma o lo que devuelven; se repiten `revoke`/`grant`):

| Función | Cambio |
|---|---|
| `public.submit_application(p_applicant, p_attempt, p_code, p_answers, p_pending_ttl, p_own_question default null, p_own_answer default null)` | dos parámetros al final y nulos por omisión (cambio del Build: así una llamada sin pregunta no los manda y los tipos generados los dejan optativos); devuelve `(outcome, application_id, own_question)`; outcome nuevo `question_changed` (R3) |
| `public.hold_application(p_applicant, p_attempt, p_code, p_answers, p_pending_ttl, p_own_question default null, p_own_answer default null)` | los mismos dos; devuelve `(outcome, held_id, application_id, own_question)`; `question_changed`; si sale como mandada, guarda la pregunta como `submit_application` |
| `public.publisher_application(p_id)` | suma `own_question`, `own_answer`, `asks_now` |
| `public.my_application(p_id)` | suma `own_question`, `own_answer` |
| `public.apply_context(p_applicant, p_code, p_pending_ttl)` | suma `own_question` (la de hoy, de `private.pet_own_question`) |
| `public.application_measure(p_application)` | suma `own_question boolean` (`a.own_answer is not null`) |
| `public.claim_held_application_moments(p_limit)` | suma `own_question` |

Redefinidas con `create or replace` (misma firma):

| Función | Cambio |
|---|---|
| `public.publish_pet`, `public.save_pet` | `own_question = nullif(btrim(p_fields ->> 'own_question'), '')`; en una cría (`save_pet` las rechaza con `reject_litter_young`, sin cambio) |
| `public.publish_litter`, `public.save_litter` | lo mismo en `litters.own_question` |
| `private.release_held_applications(p_user)` | copia `own_question` y `own_answer` a la solicitud; llena `held_application_moments.own_question` |
| `private.lapse_held_applications(p_ids, p_reason)` | pone en nulo `own_question` y `own_answer` |

## Estados y transiciones

- **Pregunta de una publicación**: ninguna ↔ una. Se pone, se cambia o se saca al publicar o al guardar
  la edición. Borrar la publicación la borra (la fila se va). Borrar la cuenta borra la publicación.
- **Solicitud**: al insertarse queda con la pregunta de ese momento y su respuesta, o sin ninguna; no
  cambia nunca más por la pregunta.
- **Solicitud que espera**: igual; al salir la copia tal cual; al no salir la pierde junto con las
  respuestas.

## Lo que ve cada quien

| Quién | Pregunta de la publicación | Pregunta contestada y respuesta |
|---|---|---|
| Sin sesión | nunca | nunca |
| Quien publicó | la suya, en editar | en sus solicitudes recibidas (`publisher_application`) |
| Quien solicita | en el cuestionario, después de los frenos (`apply_context`… R4) | la suya (`my_application`) |
| Otra persona con sesión | nunca | nunca |
| Quien administra | en Encuestas, sin la persona ni el animal | nunca |

`apply_context` corre con la clave de servicio y devuelve la pregunta aunque la persona todavía no haya
pasado los frenos; la página de solicitar la pasa al formulario solo en la rama que dibuja el
cuestionario, así no llega al HTML de una pantalla de freno (FR-010). Lo prueba el e2e de privacidad
del cuestionario: la pantalla de identidad pedida de un animal con pregunta no la contiene.
