# Data Model: Al marcar un animal dado por fuera, decir por dónde llegó quien lo adoptó

Sin cambios en la base: no hay migración, tabla, columna ni política nueva (research R1).

## FoundVia (código)

| Clave | Opción en pantalla |
|---|---|
| `facebook` | Un grupo o una página de Facebook |
| `instagram` | Instagram |
| `whatsapp` | Un estado o un grupo de WhatsApp |
| `seen_here` | Vio a {nombre} en este sitio y me escribió directo |
| `someone_known` | Alguien que conozco, o me lo recomendaron |
| `other` | Por otro lado |

`FoundViaAnswer` = `FoundVia` | `'unanswered'`.

## Momento `pet_handed_over` (medición)

Lo de hoy (`to`, `days_since_published`, `days_since_accepted`, `accepted_count`, `litter` y el
nivel de quien recibió por el sitio) más:

| Propiedad | Valor | Regla |
|---|---|---|
| `found_via` | `FoundViaAnswer` \| `null` | `to` = `site` → `null`. `to` = `outside` → la opción elegida al confirmar, o `unanswered`. |

Sin el nombre del animal, de quien rescata ni de quien adoptó; sin texto. Se emite una vez por
adopción hecha (`outcome = 'done'`).

## Entrada de marcar adoptado

`handoverSchema` (estricto): `petId`, `applicationId` (uuid o `null`), `attemptId` y `foundVia`
(`FoundVia` o `null`). La acción ignora `foundVia` cuando `applicationId` no es `null`.
