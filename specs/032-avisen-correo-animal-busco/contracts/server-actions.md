# Contracts — Server Actions, rutas, queries y correo

Las acciones devuelven `ActionResult<T>` y no lanzan; el `error` es una clave de i18n de
`alerts.errors.*`.

## `createPetAlert(input: unknown): Promise<ActionResult<CreateAlertOutcome>>` — `src/actions/pet-alerts.ts` (nueva)

- Input (`petAlertSchema`, `src/lib/schemas/pet-alert.ts`):
  `z.strictObject({ filters: <los seis filtros en claves de dominio>, fromEmpty: z.boolean() })`.
  El schema normaliza con la regla del listado: sin repetidos, en el orden del vocabulario, todas
  las opciones de un filtro = ninguna, un solo departamento. Un valor desconocido es
  `alerts.errors.failed`.
- Sin sesión: `alerts.errors.session` (la hoja muestra el enlace a entrar con la vuelta de R8).
- Llama `createPetAlertRecord(filters)` → `'created' | 'duplicate' | 'limit'`.
  - `created`: `track('pet_alert_created', { filters: n, from_empty })` y `revalidatePath('/mis-avisos')`.
  - `duplicate` y `limit`: `ok` con ese valor, sin momento. La hoja dice «ya lo tenés» o el máximo.
- Falla de la base: `alerts.errors.failed`.

## `deletePetAlert(alertId: string): Promise<ActionResult<null>>` — `src/actions/pet-alerts.ts` (nueva)

- `z.uuid()`; borra con la sesión (la política deja borrar solo lo propio). Ya no existía: `ok`
  (como si se hubiera borrado). Borró una fila: `track('pet_alert_deleted', { origin: 'profile' })`
  y `revalidatePath('/mis-avisos')`.
- Sin sesión: `alerts.errors.session`. Falla: `alerts.errors.failed`.

## `unsubscribePetAlerts(token: string): Promise<ActionResult<null>>` — `src/actions/pet-alerts.ts` (nueva)

- `isLinkToken(token)` falso → `alerts.errors.unknown_link`, sin ir a la base.
- `unsubscribeByToken(hashLinkToken(token))` con el cliente de servicio, que nunca mira la sesión:
  - `done` con `deleted`: `trackAll` de `deleted` veces `pet_alert_deleted` `{ origin: 'mail' }`
    con `visit: false`. `ok`.
  - `unknown`: `alerts.errors.unknown_link`.
- Falla de la base: `alerts.errors.failed` (la pantalla ofrece probar de nuevo; nada confirmado).

## Rutas

| Ruta | Grupo | Qué |
|---|---|---|
| `/animales?…&avisar=1` | `(public)` | el listado; `avisar=1` con sesión monta `AlertOffer` en «crear al montar» (R8) |
| `/mis-avisos` | `(app)` | «Mis avisos»; `requireProfile`, `noindex` |
| `/dejar-de-recibir/[token]` | `(open)` | la pantalla de R7; `noindex`, sin `follow` |
| `POST /api/avisos/dejar?t=<token>` | `app/api` | el «darse de baja» del programa de correo (`List-Unsubscribe-Post`): llama lo mismo que la acción; `200` sin cuerpo siempre, también con un token desconocido, para no decir si existía |
| `POST /api/cron/resumen` | `app/api` (cambia) | después de los resúmenes, `sendPetAlertMails(now)` con su propio `catch` |

## Queries — `src/lib/supabase/queries/pet-alerts.ts` (nueva, la única puerta a las tres tablas)

- `createPetAlertRecord(filters: AlertFilters): Promise<CreateAlertOutcome>` — `rpc('create_pet_alert')` con la sesión.
- `listMyPetAlerts(): Promise<PetAlert[]>` — `from('pet_alerts').select(...)` con la sesión, por `created_at, id`.
- `deletePetAlertRecord(alertId): Promise<boolean>` — con la sesión; `true` si borró una fila.
- `claimPetAlertMail(): Promise<AlertMailClaim[]>` — servicio; agrupa las filas por persona y aviso.
- `markPetAlertsMailed(userId, runAt): Promise<void>` — servicio.
- `createUnsubscribeLink(userId, tokenHash): Promise<void>` — servicio.
- `unsubscribeLinkExists(tokenHash): Promise<boolean>` — servicio.
- `unsubscribeByToken(tokenHash): Promise<{ outcome: 'done'; deleted: number } | { outcome: 'unknown' }>` — servicio.

## Correo — `src/lib/email/send-pet-alert-mail.ts` (nuevo)

`sendPetAlertMail(claim: AlertMailClaim, parts: AlertMailPart[], locale): Promise<boolean>`:

1. `getAccountEmail(userId)`; sin dirección, `false`.
2. Token nuevo (`newLinkToken`), `createUnsubscribeLink(userId, hash)`.
3. `sendEmail` con:
   - `subject`/`heading`/`body`: `emails.pet_alerts.*` con la cantidad.
   - `url`: el listado sin filtros (`LISTING_PATH`); `button`: `emails.pet_alerts.button`.
   - `extras.groups`: por parte, `title` = `alertName(filters)`, `items` (foto de compartir, nombre,
     «Perro, 2 años» o «Camada de 5 crías», zona, ficha con `desde=aviso`) y `more` = `listingHref(filters)`.
   - `extras.secondary`: «Dejar de recibir» → `/dejar-de-recibir/<token>`.
   - `headers`: `List-Unsubscribe: <APP_URL/api/avisos/dejar?t=<token>>`,
     `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
4. Aceptado → `markPetAlertsMailed(userId, runAt)`, `pet_alert_mail_sent { items, parts }`, `true`.
   No aceptado → `reportEmailFailure('avisos: no se pudo mandar')`, `false`; `covered_until` queda.

`sendPetAlertMails(now)` en el mismo archivo: `claimPetAlertMail()`, `alertMailParts` por persona, y
de a uno, espaciados 600 ms.

## Plantilla — `src/lib/email/notice-email-template.ts` (cambia)

`NoticeEmailExtras` suma `groups?: { title: string; items: { href: string; image: { src: string;
alt: string }; name: string; detail: string; zone: string }[]; more: { label: string; url: string }
}[]`, dibujado como tablas de una celda con estilos en línea, debajo del cuerpo y antes del botón; y
en `renderNoticeText` como renglones. `sendEmail` suma `headers?: Record<string, string>`, que pasa a
Resend y se anota en el archivo de `.artifacts/mail/`.
