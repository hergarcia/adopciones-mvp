# Data model — Encuesta, opiniones y WhatsApp de soporte

Una migración: `supabase/migrations/<ts>_surveys_feedback.sql`. Todas las tablas con RLS encendida,
**sin políticas** y con `revoke all ... from anon, authenticated`: se leen y escriben solo por las
funciones de abajo (research R1, R4, R8). Fechas en día de Uruguay (`public.uruguay_today()`).

## Tablas

### `public.survey_offers` — lo único unido a la persona (FR-050)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk | `gen_random_uuid()` |
| `person_id` | `uuid not null` | FK `auth.users(id) on delete cascade` |
| `moment` | `text not null` | `check (moment in ('gave','adopted','not_chosen'))` |
| `subject_id` | `uuid not null` | la adopción (`gave`, `adopted`) o la solicitud (`not_chosen`); sin FK (R1) |
| `offered_on` | `date` | nulo solo con `skipped` |
| `state` | `text not null` | `pending` · `answered` · `dismissed` · `skipped` |

- `unique (person_id, moment, subject_id)`.
- `check ((state = 'skipped') = (offered_on is null))`.
- Índice `(person_id, offered_on desc) where state <> 'skipped'` para la regla de los 30 días.
- Disparador `survey_offers_forward_only`: `pending` → `answered` | `dismissed`; nada más cambia.

### `public.survey_answers` — sin persona (FR-051)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk | `gen_random_uuid()` |
| `moment` | `text not null` | como arriba |
| `option` | `text not null` | `private.survey_option_valid(moment, option)`: `gave` y `not_chosen` → `yes`·`maybe`·`no`/`back_to_groups`; `adopted` → `yes`·`somewhat`·`no` |
| `body` | `text` | nulo o `char_length(body) between 1 and 500` |
| `answered_on` | `date not null` | `uruguay_today()` |

Índice `(moment, answered_on desc, id) where body is not null` para las respuestas libres.

Opciones por momento: `gave` = `yes` · `maybe` · `no`; `adopted` = `yes` · `somewhat` · `no`;
`not_chosen` = `yes` · `maybe` · `back_to_groups`.

### `public.survey_counts` — las cuentas que no dependen de las cuentas de personas (FR-044)

`moment text pk`, `offered integer not null default 0 check (offered >= 0)`, `dismissed integer
not null default 0 check (dismissed >= 0)`. La migración inserta las tres filas.

### `private.survey_settings`

Una fila: `since timestamptz not null` = `now()` de la migración (R6).

### `public.feedback` — sin persona (FR-051)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk | |
| `body` | `text not null` | `char_length(btrim(body)) between 1 and 1000` |
| `screen` | `text not null` | `private.feedback_screen_valid(screen)` (lista de research R9) |
| `subject` | `text` | solo con `screen in ('pet','profile')`; nulo si no |
| `sent_on` | `date not null` | `uruguay_today()` |
| `attempt_id` | `uuid not null unique` | el doble toque y el reintento |

Índice `(sent_on desc, id)`.

### `public.feedback_quota` — el tope del día, aparte (FR-023)

`browser_hash text`, `day date`, `sent smallint not null check (sent between 1 and 5)`, `primary key
(browser_hash, day)`. `send_feedback` borra los días anteriores.

## Funciones (`security definer`, `set search_path = ''`)

| Función | Para | Qué hace |
|---|---|---|
| `survey_for(p_moment text, p_subject uuid)` → `(offer_id uuid, moment text, state text, newly_offered boolean)` | `authenticated` | R2/R3. Nada si el desenlace no es de quien llama, no es uno de R3, es de antes de `since`, o la cuenta está suspendida. |
| `my_pets_survey()` → igual + `pet_id uuid` | `authenticated` | R2 para Mis animales; como mucho una fila `pending` que mostrar. |
| `answer_survey(p_offer uuid, p_option text, p_body text)` → `text` | `authenticated` | R7: `answered` · `already` · `dismissed` · `not_found` · `invalid` · `suspended`. |
| `dismiss_survey(p_offer uuid)` → `text` | `authenticated` | R7: `dismissed` · `already` (respondida) · `not_found` · `suspended`. |
| `send_feedback(p_browser_hash text, p_attempt uuid, p_body text, p_screen text, p_subject text)` → `text` | `anon`, `authenticated` | R8: `sent` · `already` · `limit` · `invalid`. |
| `admin_feedback(p_before_on date, p_before_id uuid, p_limit int)` → `(id, body, screen, subject, pet_name, sent_on)` | `authenticated` | R12; vacío si no administra. |
| `admin_delete_feedback(p_id uuid)` → `text` | `authenticated` | `deleted` · `not_found` (también si no administra). |
| `admin_survey_summary()` → `(moment, offered, answered, dismissed, option, chosen)` | `authenticated` | Una fila por momento y opción; vacío si no administra. |
| `admin_survey_answers(p_moment text, p_before_on date, p_before_id uuid, p_limit int)` → `(id, option, body, answered_on)` | `authenticated` | Solo con texto; vacío si no administra. |

Disparador `adoptions_decline_withdraws_survey` (`after update of declined_at on public.adoptions`):
R5.

## Estados de una oferta

```
(sin fila) --abre la pantalla, fuera de 30 días--> pending --Enviar--> answered
     |                                               |--Ahora no--> dismissed
     |                                               '--«Yo no adopté» (solo adopted)--> (fila borrada, offered − 1)
     '--abre la pantalla, dentro de 30 días--> skipped (para siempre)
```
