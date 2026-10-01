# Research: Mantener al día cada publicación

Cada decisión con su motivo y lo que se descartó. Los números de FR y US son los de `spec.md`.

## R1. Vencida y dada de baja no son estados guardados: se derivan

**Decisión**: `pets.status` guarda solo lo que elige el publicador (`available`, `in_process`,
`paused`, `adopted`). «Vencida» es `status in ('available','in_process') and expires_at <= now()`;
«dada de baja» es `taken_down_at is not null`. Una sola función de la base, `private.pet_state(...)`,
devuelve el estado derivado (`available` `in_process` `paused` `adopted` `expired` `taken_down`) y
la usan todas las lecturas públicas, la cola de revisión y las escrituras; en TypeScript,
`lifecycleOf` (`lib/pets/lifecycle.ts`) hace la misma cuenta para Mis animales, con un test de
paridad en `tests/db/` que compara los dos sobre las mismas filas.

**Por qué**: el vencimiento ocurre por el paso del tiempo. Si fuera un estado guardado, alguien
tendría que escribirlo a tiempo, y entre que vence y que la tarea corre el listado mostraría un
animal vencido (SC-002 pide «ese mismo día», y FR-014 «sin que nadie haga nada»). Derivado, sale del
listado en el mismo instante. «Dada de baja» al lado del estado conserva lo que el publicador había
elegido sin que importe: una baja no se deshace desde el sitio (FR-006).

**Descartado**: un estado `expired` escrito por pg_cron cada 5 minutos (hasta 5 minutos de animal
vencido a la vista, y dos fuentes de verdad); un enum de Postgres (el proyecto usa `text` con
`check`, docs/06 §enums en inglés).

## R2. Las escrituras: una función por acción, con candado y transición escrita en la base

**Decisión**: `public.change_pet_status(p_owner, p_pet, p_action, p_pending_ttl)` y
`public.delete_pet(p_owner, p_pet)`, `security definer`, solo `service_role`, con el candado de la
cuenta (`lock_phone_account`), como `publish_pet` y `save_pet`. Devuelven un `outcome`: `done`,
`already` (ya estaba como lo pide), `changed` (la acción no corresponde al estado de ahora),
`needs_verification`, `taken_down`, `not_found` (no existe o no es suyo). La tabla de transiciones
(Edge Cases de la spec) vive en la función; `actionsFor(state)` en TypeScript decide qué botones se
muestran, con un test de paridad en la base que recorre cada estado × acción y comprueba que
`done`/`already` coincide con lo que `actionsFor` ofrece.

**Por qué**: el mismo patrón de #53 (la dueña llega como parámetro desde la sesión, el nivel 1 se
comprueba adentro con el candado). Dos pestañas o el publicador y quien administra chocan en el
candado de la fila (`for update`), no en la aplicación (FR-007, Edge Cases «Dos cambios a la vez»).
El `outcome` `changed` es lo que la pantalla traduce a «el animal cambió mientras tanto».

**Descartado**: policies `update` para `authenticated` (se saltearían el nivel 1 y la tabla de
transiciones); una función genérica que reciba el estado destino (deja armar transiciones que la
spec no tiene).

## R3. El vencimiento: `expires_at` y dos constantes con paridad

**Decisión**: `pets.expires_at timestamptz`, no nulo solo en `available` e `in_process`
(constraint). Publicar, renovar, reanudar y volver a publicar lo ponen en `now() + 30 días`;
pausar y marcar adoptado lo ponen en `null` (congela, FR-016); marcar en proceso o disponible no lo
tocan; editar no lo toca. Volver a publicar además pone `published_at = now()` (Assumptions de la
spec). Las constantes son `private.pet_lifetime()` (30 días) y `private.pet_reminder_lead()`
(7 días), fijas en SQL porque las llama también la tarea de la base, con un test de paridad contra
`PET_LIFETIME_DAYS` y `PET_REMINDER_DAYS` de `lib/pets/rules.ts` (el mismo recurso que
`private.pending_ttl()` en #57). Las publicaciones que ya existen reciben `now() + 30 días`: nunca
se les anunció un vencimiento.

## R4. El recordatorio: tarea de la base cada 5 minutos que despierta a la aplicación

**Decisión**: el mismo patrón que el vencimiento de identidad (#11): `pg_cron` corre cada 5 minutos
`public.pet_lifecycle_tick()`, que solo si hay trabajo (un recordatorio debido o un vencimiento sin
medir) llama con `pg_net` a `POST /api/cron/publicaciones` con el secreto de Vault. La ruta:

1. `claim_pet_reminders(p_limit)` marca `reminder_sent_at = now()` y devuelve, en la misma
   sentencia, las publicaciones disponibles o en proceso, no dadas de baja, no vencidas, con
   `expires_at - 7 días <= now()` y sin recordatorio. Marcar antes de mandar es lo que garantiza
   uno solo (FR-017); si el envío falla no se reintenta (Assumptions).
2. Por cada una, crea el enlace de «Sigue disponible» (R5) y manda el correo (R7).
3. `claim_pet_expiries(p_limit)` marca `expiry_counted_at` en las vencidas sin medir y devuelve
   lo que hace falta para el evento `pet_expired` (FR-032).

Renovar, reanudar y volver a publicar ponen `reminder_sent_at` y `expiry_counted_at` en `null`: el
vencimiento nuevo tiene su propio recordatorio. Cinco minutos de período dejan holgado el «como
mucho una hora» de FR-017.

**Descartado**: Vercel Cron (sin Vercel hasta el MVP, docs/07); mandar el correo desde la base
(los textos viven en `messages/es.json` y el envío en `lib/email/`).

## R5. «Sigue disponible»: un enlace por correo, guardado como hash, que solo renueva ese animal

**Decisión**: tabla `pet_renewal_links (token_hash, pet_id → pets on delete cascade, created_at,
expires_at)`, sin acceso para `anon` ni `authenticated`. El token son 32 bytes al azar en base64url
(43 caracteres) generados en el servidor (`lib/pets/renewal-token.ts`); se guarda su SHA-256. Vence
a los 30 días (Assumptions). `renew_by_link(p_token_hash, p_pending_ttl)` toma el candado de la
cuenta del dueño, resuelve el enlace y aplica la renovación (o la vuelta a publicar si está
vencida) con las mismas reglas que `change_pet_status`, y devuelve un `outcome`: `renewed`,
`republished`, `paused`, `adopted`, `taken_down`, `needs_verification`, `invalid` (no existe,
venció o el animal se borró). Abrirlo dos veces deja 30 días desde el último (FR-018).

**Un toque**: el enlace del correo es `GET /sigue-disponible/{token}`, un Route Handler que renueva
y redirige (303) a `/sigue-disponible/{token}/listo?r={outcome}`, una página que solo lee. Así la
escritura corre una vez por toque y la página se puede recargar sin renovar de nuevo. Los lectores
de vista previa (`isLinkPreview`, de #57) no renuevan: si alguien reenvía el correo por WhatsApp,
armar la vista previa no confirma nada. Los escáneres de enlaces de algunos correos corporativos sí
podrían abrirlo: se acepta como **KL-59-1** (la historia pide un toque; renovar se deshace pausando
o marcando adoptado).

**Por qué no un token firmado con un secreto**: borrar el animal tiene que invalidar el enlace sin
una lista de revocados, y la cascada lo hace sola (FR-019).

## R6. «Ya no está disponible» y el animal en Mis animales

**Decisión**: ruta nueva `/mis-animales/{id}` (el id del animal; no es un dato de la persona,
FR-020). La página exige perfil (`requireProfile` con `next`, como Mis animales) y lee con
`getMyPet` (RLS de dueña): si no es suyo o no existe, `PetNotFound` («Este animal no existe»,
FR-002). Muestra el mismo bloque que Mis animales con las acciones a la vista, sin `Sheet`.

## R7. Los correos: la plantilla de aviso, con foto y segundo botón

**Decisión**: `renderNoticeEmail` gana dos extras opcionales: una imagen arriba (ancho 480,
`alt` con el nombre) y un segundo enlace como texto debajo del botón. El recordatorio usa los dos;
el de baja, ninguno. La foto del correo sale de `GET /sigue-disponible/{token}/foto`: la portada en
tamaño `card` pasada a JPEG con `sharp` (Outlook de escritorio no muestra WebP), con el mismo token,
así la dirección no dice nada de nadie y deja de servir cuando el enlace vence o el animal se
borra. Si no carga, el correo se lee igual (Pantallas). Destinatario: el correo de la cuenta
(`auth.users`), leído con permisos de servicio como hace `sendIdentityResult`.

## R8. La revisión: una fila por publicación, y la cola es una función

**Decisión**: tabla `pet_reviews (pet_id pk → pets on delete cascade, pending_kind, pending_since,
resolved_at, resolved_by → auth.users on delete set null, outcome)`. Un disparador `after insert` en
`pets` crea la fila pendiente `new`; `save_pet` la vuelve a poner pendiente `edited` si estaba
resuelta (si ya estaba pendiente, no cambia: Edge Cases). Policy de lectura solo para
`private.is_admin()`; ninguna de escritura. El motivo de una baja vive en `pets`
(`takedown_reason`, `takedown_note`), que su dueña ya lee por su policy: así ve el motivo y nunca
quién decidió (FR-029), que queda en `pet_reviews.resolved_by`.

La cola es `public.pet_review_queue(p_limit)`, `security definer`, que comprueba `is_admin()` y
devuelve las 20 con pendiente más vieja (más el total y si es propia), con todos los datos, las
fotos, el nombre, la foto y el nivel del publicador, su estado derivado y `pending_since`. Nunca su
zona ni su contacto (FR-024). Resolver es `public.resolve_pet_review(p_admin, p_pet,
p_known_since, p_outcome, p_reason, p_note)`, con `for update` sobre la fila y la comparación de
`pending_since` con lo que la pantalla vio: si otra persona ya la resolvió (o se volvió a editar), es
`closed` (FR-026). Propia: `own`; quien ya no administra: `not_admin`; borrada: `gone`.

**Las fotos para quien administra**: una policy de Storage más, `pet_photos_objects_select_review`,
deja firmar las fotos de una publicación con revisión pendiente a quien administra, y la del avatar
de su publicador (FR-024; Assumptions: solo mientras está sin revisar).

## R9. Lo público: las funciones de #57 aprenden los estados

**Decisión**: se reemplazan (`create or replace`) `listed_pets` (filtra `pet_state in
('available','in_process')` y devuelve `status` para el sello), `pet_by_code` (devuelve
`visibility` en `listed`, `adopted`, `paused`, `expired`, `hidden`; una dada de baja, para quien no
es su dueño, no devuelve fila, igual que una que no existe; la dueña recibe todo con `state`,
`takedown_reason` y `takedown_note`), `pet_share_card` (también la adoptada, con `status`) y las dos
funciones de las policies de fotos (`pet_photo_object_listed`, `avatar_object_listed`), que pasan a
«a la vista o adoptada» con `private.pet_is_shown`. La escalera del nivel del publicador se extrae a
`private.publisher_level(owner)` para que la usen la ficha y la cola sin copiarla. El índice parcial
del listado se recrea con el filtro nuevo.

## R10. La pantalla de Mis animales: sello en la foto, vencimiento en texto, acciones en una hoja

**Decisión**: `PetCard` dibuja el sello del estado sobre la foto (ya previsto en docs/10), con
`Stamp` y una variante nueva `ink` para «En proceso» (docs/10 la pide: «`in_process` en
`--color-ink`»). Debajo de la card, una línea de vencimiento (`PetExpiryLine`) y la fila de
acciones: «Ver ficha», «Compartir» y «Más acciones» (`ghost`), que abre `PetStatusSheet` con las
acciones del estado. Cuando el vencimiento es próximo, «Renovar» sale directo en la fila: es la
acción del correo y no puede costar dos toques. Cinco botones por card en una pared de dos columnas
no entran en 175 px; la hoja es la regla de docs/10 §Layout («las acciones en un bottom sheet, no en
la card»).

**Ajuste a la spec**: SC-001 decía «un toque»; con la hoja son dos (abrir y elegir), tres para
borrar, y uno para renovar cuando vence pronto. Se corrige SC-001 en esta etapa.

## R11. Qué se mide

Eventos nuevos en `lib/analytics/events.ts`, sin ids ni textos libres:
`pet_status_changed {from, to, days_since_published}` (las cinco acciones que no son renovar ni
volver a publicar), `pet_renewed {via: 'email'|'my_pets'}`, `pet_republished {from:
'expired'|'adopted', via}`, `pet_expired {from: 'available'|'in_process', days_since_published}`
(desde la ruta de la tarea, `visit: false`), `pet_deleted {from}`, `pet_reminder_sent {}`
(`visit: false`), `pet_reviewed {kind, review_hours}` y `pet_taken_down {kind, reason,
review_hours}` (`visit: false`, como la revisión de identidad). Ningún par se dispara en el mismo
instante. La ficha de una adoptada no dispara `pet_viewed`, que mide el embudo de
quien quiere adoptar (#57): un animal ya entregado no es un paso de ese embudo.
