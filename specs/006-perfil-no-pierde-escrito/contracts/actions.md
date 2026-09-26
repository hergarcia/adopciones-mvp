# Contratos — Server Actions

## `saveProfile(form: FormData): Promise<ActionResult<{ redirectTo: string; wasComplete: boolean }>>`

Cambia. Campos nuevos del `FormData`:

| Campo | Valores | Default |
|---|---|---|
| `mode` | `create` \| `edit` | `edit` (cualquier otro valor) |
| `recovered` | `'true'` \| ausente | ausente |

Errores (`error`, clave de i18n):

| Clave | Cuándo | El cliente muestra |
|---|---|---|
| `profile.errors.session` (**nueva**) | no hay sesión | aviso «sesión cerrada» |
| `profile.errors.save_failed` | la base no guardó | aviso «el sitio no respondió» |
| `profile.errors.photo_failed` | la foto no subió | `ErrorText` de la foto, como hoy |
| `profile.errors.<campo>_*` | validación | debajo del campo, como hoy |

Éxito: `wasComplete` y eventos según `profileSaveOutcome` (data-model.md). Guardar dos veces lo
mismo deja un solo perfil y una sola foto (upsert por id, foto en un camino fijo por cuenta).

## `reportProfileSaveFailures(payload: unknown): Promise<ActionResult<null>>`

Nueva. No pide sesión. Valida con `profileSaveReportSchema`:

```ts
{ failures: Array<{ reason: 'offline' | 'no_response'; moment: 'create' | 'edit'; first: boolean }> }
// 1..20 elementos
```

- Válido → un `profile_save_failed` por elemento, con esas tres propiedades. Devuelve `{ ok: true }`.
- Inválido → no dispara nada y devuelve `{ ok: true, data: null }` igual: la medición nunca frena ni
  informa nada a la persona.
- No guarda nada.
