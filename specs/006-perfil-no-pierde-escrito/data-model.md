# Data model — El perfil no pierde lo escrito

Sin cambios en la base. Todo lo de abajo vive en el navegador o en memoria de la pantalla, salvo
los eventos de medición.

## Borrador del alta (navegador)

Clave `profile-draft` en `localStorage`. Forma nueva:

```ts
type ProfileDraft = {
  owner: string            // id interno de la cuenta que lo escribió
  values: {
    displayName: string
    department: string
    locality: string
    isRescuer: boolean
  }
}
```

- Nunca lleva la foto ni su URL (FR-015). La forma vieja (los valores sueltos, sin `owner`) se
  trata como de otro dueño: se descarta.
- Reglas de lectura (`readDraft(raw, owner, initial)`):
  - `raw` nulo → `{ values: initial, discard: false }`.
  - JSON roto, sin `owner`, `owner !== owner actual` → `{ values: initial, discard: true }`.
  - Dueño igual → los valores del borrador sobre `initial`, salvo los vacíos (`''`), que no pisan lo
    que trae la pantalla.
- Ciclo de vida: nace con el primer cambio respecto de lo que trajo la pantalla; se reescribe con
  cada cambio; se borra al guardar bien, al cerrar sesión, al borrar la cuenta, al leerlo otra
  cuenta, y al llegar a «Mi perfil».

## Intento de guardado (memoria de la pantalla)

```ts
type SaveOutcome =
  | { kind: 'result'; result: ActionResult<SavedProfile> }
  | { kind: 'threw' }
  | { kind: 'timeout' }

type SaveVerdict =
  | { kind: 'saved'; data: SavedProfile }
  | { kind: 'invalid'; error: string }            // clave de i18n, como hoy
  | { kind: 'notice'; reason: 'offline' | 'no_response' | 'session' }
```

`classifySaveFailure({ online: boolean, outcome: SaveOutcome }): SaveVerdict`

| outcome | online | veredicto |
|---|---|---|
| result ok | — | saved |
| result `profile.errors.session` | — | notice session |
| result `profile.errors.save_failed` | — | notice no_response |
| result otra clave | — | invalid |
| threw | false | notice offline |
| threw | true | notice no_response |
| timeout | — | notice no_response |
| (no se mandó: `onLine` false) | false | notice offline |

Estado del hook: `lastAttempt` (número), `notice` (el veredicto vigente o null), `failures` (la
cola), `hadFailure` (para `recovered`).

## Desenlace del guardado (servidor)

`profileSaveOutcome({ existedBefore, mode, recovered }) → { events, wasComplete }`

| existedBefore | mode | eventos | wasComplete (confirmación) |
|---|---|---|---|
| no | cualquiera | `account_creation_finished` | false («Perfil guardado») |
| sí | create | — | false («Perfil guardado») |
| sí | edit | `profile_edited` | true («Cambios guardados») |

Con `recovered = true` se suma `profile_save_recovered` con `moment = mode`.

## Eventos nuevos

| Evento | Propiedades | Se dispara cuando |
|---|---|---|
| `profile_save_failed` | `reason`: `offline` \| `no_response`; `moment`: `create` \| `edit`; `first`: boolean | llega el reporte de un toque de guardar o reintentar que no llegó |
| `profile_save_recovered` | `moment`: `create` \| `edit` | un guardado sale después de al menos un fallo en la misma visita |

Ninguno lleva nombre, correo, zona, foto ni id de cuenta; la marca de visita de `track` es la misma
de siempre.
