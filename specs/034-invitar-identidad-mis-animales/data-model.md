# Data model: la invitación a verificar la identidad en «Mis animales»

Historia #281 · una migración forward-only, `supabase/migrations/20261106120000_identity_invite.sql`
(después de `20261105120000_limit_screen_litter.sql`). Después: `pnpm db:types`.

## Tabla nueva: `public.identity_invite_dismissals`

| Columna | Tipo | Regla |
|---|---|---|
| `person_id` | `uuid` | clave primaria; `references auth.users (id) on delete cascade` |
| `dismissed_on` | `date` | `not null`, `default ((now() at time zone 'America/Montevideo')::date)` |

- Una fila por persona, a lo sumo (FR-017): la clave primaria.
- Guarda solo el día de Uruguay (FR-022). Ningún otro dato.
- RLS prendida, sin políticas; `revoke all ... from anon, authenticated`. Nadie la lee directo,
  tampoco quien administra (FR-021).
- Se borra con la cuenta: la cascada desde `auth.users`, que es lo que borra
  `auth.admin.deleteUser` (`src/lib/auth/accounts.ts`, `src/lib/supabase/queries/session.ts`).
- `comment on table`: qué es y quién la lee.

### Funciones

| Función | Devuelve | Quién la ejecuta | Qué hace |
|---|---|---|---|
| `public.dismiss_identity_invite()` | `text`: `dismissed` · `already` · `not_signed_in` | `authenticated` | Inserta la fila de `auth.uid()` con `on conflict (person_id) do nothing`; `found` decide entre `dismissed` y `already`. |
| `public.identity_invite_dismissed()` | `boolean` | `authenticated` | `exists` la fila de `auth.uid()`; con `auth.uid()` nulo, `false`. `stable`. El visitante anónimo no la puede ejecutar. |

Las dos `security definer`, `set search_path = ''`, `revoke all ... from public, anon,
authenticated` y `grant execute ... to authenticated`, como `verification_exit_due` (#234).

## Cambios a lo que ya existe

### `public.identity_requests`

- `identity_requests_origin_valid`: `check (origin in ('profile', 'my_pets'))`. El resto del pedido no
  cambia; el origen se borra con el pedido, con las mismas reglas (FR-012).
- `identity_expirations.notice_origin` no tiene `check` de valores: lleva `my_pets` sin cambios.

### La pregunta de por qué se va (#234, #257)

- `verification_exit_tickets_origin_valid`, `verification_exit_answers_origin_valid`,
  `verification_exit_counts_origin_valid`: `check (origin in ('publish', 'apply', 'self', 'asked',
  'invited'))`.
- `insert into public.verification_exit_counts (level, origin) values ('phone', 'invited'),
  ('identity', 'invited')`.
- `public.ask_verification_exit(text, text)`: redefinida con la lista de cinco orígenes; el resto
  del cuerpo igual al de `20261030120000_identity_asks.sql`.
- `public.admin_verification_exit_summary()`: redefinida con
  `array_position(array['publish', 'apply', 'self', 'asked', 'invited'], c.origin)`; el resto igual.

## Tipos y constantes de TypeScript

| Dónde | Qué |
|---|---|
| `src/lib/verification/identity.ts` | `IDENTITY_ORIGINS = ['profile', 'my_pets'] as const` |
| `src/lib/verification/exit-question.ts` | `EXIT_ORIGINS` suma `'invited'`; `ExitPlace` suma `invited: boolean` |
| `src/lib/verification/paths.ts` | `INVITE_FLAG = 'invitacion'`, `identityFromInvitePath()` |
| `src/lib/verification/identity-invite.ts` | `identityInviteShown(...)`, `inviteSubject(...)`, `DISMISS_OUTCOMES` |
| `src/lib/analytics/events.ts` | `identity_invite_dismissed` en `EVENTS` y `EventProps` (`Origin`) |
| `src/lib/email/send-identity-result.ts` | `IdentityResult` aprobado suma `toMyPets: boolean` |
| `src/lib/email/identity-approved-link.ts` | `approvedSecondary(result, t)` |
| `src/lib/supabase/types.ts` | regenerado |

## Estados de la invitación para una persona

```
            ┌───────────── nunca tocó «Ahora no» ─────────────┐
            │                                                  │
  publica + nivel 1 + canRequest  ──►  SE MUESTRA  ──«Ahora no»──►  CERRADA PARA SIEMPRE
            │                         │       ▲                        (fila con el día)
            │            «Verificar mi identidad» y manda             │
            │                         ▼       │                        │
            │                    EN REVISIÓN ─┤ vence / rechazo        │
            │                         │       │ sin tope / retiro      │
            │                         │       │ / termina el tope      │
            │                    aprobada ── nunca más (no canRequest)  │
            └──────────────────────────────────────────────────────────┘
  Sin publicaciones, sin nivel 1 o sin poder leer el estado: no se muestra, en ningún estado.
```

Guardar «Ahora no» que falla deja a la persona en SE MUESTRA para la próxima apertura (FR-016).
