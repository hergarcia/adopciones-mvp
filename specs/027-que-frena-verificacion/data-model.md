# Data model — Preguntar qué frena a quien deja la verificación

Una migración: `supabase/migrations/<ts>_verification_exits.sql`. Las cuatro tablas con RLS
encendida, **sin políticas** y con `revoke all ... from anon, authenticated`: se leen y escriben solo
por las funciones de abajo (research R1). Días en hora de Uruguay (`public.uruguay_today()`).

## Reglas cerradas

`private.verification_exit_option_valid(p_level text, p_option text) returns boolean`, `immutable`:

- `phone` → `no_number` · `no_code` · `later` · `groups` · `other`
- `identity` → `no_id_photos` · `later` · `too_much` · `groups` · `other`
- cualquier otro nivel → `false`

Niveles: `phone` · `identity`. Orígenes: `publish` · `apply` · `self`. La misma lista vive en
`src/lib/verification/exit-question.ts`; la prueba de la base compara las dos.

## Tablas

### `public.verification_exit_asks` — lo único unido a la persona (FR-024)

| Columna | Tipo | Regla |
|---|---|---|
| `person_id` | `uuid not null` | FK `auth.users(id) on delete cascade` |
| `level` | `text not null` | `check (level in ('phone','identity'))` |

- `primary key (person_id, level)`. Sin día, sin estado, sin respuesta.

### `public.verification_exit_tickets` — la pregunta hecha y sin resolver, sin persona (R3)

| Columna | Tipo | Regla |
|---|---|---|
| `ticket` | `uuid` pk | `gen_random_uuid()` |
| `level` | `text not null` | como arriba |
| `origin` | `text not null` | `check (origin in ('publish','apply','self'))` |

### `public.verification_exit_answers` — sin persona (FR-025)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk | `gen_random_uuid()` |
| `level` | `text not null` | como arriba |
| `option` | `text not null` | `check (private.verification_exit_option_valid(level, option))` |
| `origin` | `text not null` | como arriba |
| `body` | `text` | `check (body is null or (option = 'other' and char_length(body) between 1 and 300))` |
| `answered_on` | `date not null` | `default public.uruguay_today()` |

- Índice `(level, answered_on desc, id) where body is not null` para los textos de Encuestas.
- Índice `(level, origin, option)` para las cuentas.

### `public.verification_exit_counts` — lo que no depende de las cuentas de personas (FR-023)

| Columna | Tipo | Regla |
|---|---|---|
| `level` | `text not null` | como arriba |
| `origin` | `text not null` | como arriba |
| `asked` | `integer not null default 0` | `check (asked >= 0)` |
| `skipped` | `integer not null default 0` | `check (skipped >= 0 and skipped <= asked)` |

- `primary key (level, origin)`. La migración inserta las seis filas.

## Funciones (`security definer`, `set search_path = ''`)

| Función | Para | Qué hace |
|---|---|---|
| `private.verification_exit_eligible(p_person uuid, p_level text)` → `boolean` | interna | R2: nunca verificó ese nivel (teléfono: sin `verified_at` ni `number_lost_on`; identidad: sin `identity_verifications`), sin marca de ese nivel y sin suspensión. |
| `verification_exit_due(p_level text)` → `boolean` | `authenticated` | R2 para quien llama: si «Ahora no» tiene que preguntar. Falso sin sesión. |
| `ask_verification_exit(p_level text, p_origin text)` → `uuid` | `authenticated` | R3: si es elegible, inserta la marca (`on conflict do nothing`; si no insertó, nulo), suma 1 a `asked` de (nivel, origen), crea el ticket y lo devuelve. Nivel u origen inválidos → nulo. |
| `answer_verification_exit(p_ticket uuid, p_option text, p_body text default null)` → `table (outcome text, level text, origin text)` | `authenticated` | R3: `answered` (borra el ticket e inserta la respuesta con su nivel y origen), `already` (el ticket ya no está), `invalid` (opción de otro nivel, texto que no cumple el `check`; el ticket queda). |
| `skip_verification_exit(p_ticket uuid)` → `table (outcome text, level text, origin text)` | `authenticated` | R3: `skipped` (borra el ticket y suma 1 a `skipped`) o `already`. |
| `admin_verification_exit_summary()` → `table (level text, origin text, asked int, skipped int, option text, chosen int)` | `authenticated` | R8: las 30 combinaciones nivel × origen × opción; vacío si no administra. |
| `admin_verification_exit_texts(p_level text, p_before_on date, p_before_id uuid, p_limit int)` → `table (id uuid, body text, answered_on date)` | `authenticated` | R8: solo con texto, del más nuevo al más viejo; `p_limit` entre 1 y 100; vacío si no administra. |

`execute` revocado a `public` y `anon` en todas; concedido a `authenticated` solo en las públicas.

## Estados de una pregunta, por persona y nivel

```
(sin marca, elegible) --«Ahora no» / «Cancelar la verificación»--> marca + ticket (asked + 1)
                                                                    |
            ticket --una opción / «Enviar»--> respuesta, sin ticket  |
            ticket --«Seguir sin contestar»--> sin ticket (skipped + 1)
            ticket --se va sin tocar nada--> queda el ticket (solo cuenta en asked)
(con marca) --«Ahora no»--> destino, nada nuevo
```

Borrar la cuenta borra la marca (cascade). Tickets, respuestas y cuentas no tienen nada que borrar.

## Tipos en el código

`src/lib/verification/exit-question.ts`:

- `ExitLevel = 'phone' | 'identity'`, `ExitOrigin = 'publish' | 'apply' | 'self'`,
  `ExitOption<L>` por nivel, `EXIT_OPTIONS: Record<ExitLevel, readonly ExitOption[]>`.
- `ExitOutcome = 'answered' | 'skipped' | 'already' | 'invalid'`.

`src/lib/surveys/exit-summary.ts`:

- `ExitSummaryRow` (una fila de la base) y `ExitLevelSummary = { level, asked, answered, skipped,
  options: { option, total, byOrigin: Record<ExitOrigin, number> }[] }`, armado por
  `exitSummaryBlocks(rows)`.

`src/lib/supabase/types.ts` se regenera con `pnpm db:types`.
