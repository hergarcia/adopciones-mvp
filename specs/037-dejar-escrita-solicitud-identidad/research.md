# Research: Dejar escrita la solicitud mientras revisan mi identidad

Decisiones del cómo para la spec. Cada una con lo elegido, el motivo y lo descartado. Lo leído en
`main` (c84b2f0): `20261006120000_applications.sql` (la tabla, `submit_application`, los cierres por
trigger), `20261030120000_identity_asks.sql` (la última `submit_application`, `resolve_identity_asks`,
`resolve_identity_request`), `20261026120000_litter_lifecycle.sql` (los cierres por animal de hoy),
`20261008120000_adoptions.sql` (bloqueo y suspensión), `20261012120000_tareas_en_la_nube.sql` (las
tareas de `pg_cron` y `pet_lifecycle_tick`), `20261103120000_publication_stats.sql` (los números de
«Mis animales» cuentan de `public.applications`), `src/lib/applications/apply-gate.ts`,
`src/app/[locale]/(app)/solicitar/[code]/page.tsx`, `identity-required-screen.tsx`,
`src/lib/email/send-identity-result.ts`, `src/actions/review.ts`.

## R1 — Dónde vive una solicitud que espera: una tabla propia

**Decisión**: tabla nueva `public.held_applications`, con RLS prendida, sin políticas y sin grants a
`anon` ni `authenticated`. La leen solo funciones `security definer` que filtran por
`applicant_id = auth.uid()`. Al salir, la fila se convierte en una fila de `public.applications`
y se borra de `held_applications` en la misma transacción.

**Motivo**: la regla más fuerte de la historia es que quien publicó no vea nada (FR-017). Quien
publicó lee las solicitudes por `pet_applications`, `publisher_application`, `publisher_inbox`, los
números de «Mis animales» y los correos de la bandeja, todos sobre `public.applications`. Con una
tabla aparte, ninguna de esas funciones cambia y no hay un filtro que se pueda olvidar: la
privacidad sale de la forma, no de la disciplina (constitución §V). Del lado de quien solicitó son
pocos los lectores (`my_applications`, `apply_context`, el límite, las respuestas propuestas) y se
tocan a propósito.

**Descartado**: un estado nuevo `held` en `public.applications`. Obliga a sumar `and status <> 'held'`
en cada función de quien publicó y de quien administra (hoy `pet_applications` devuelve todos los
estados, también las cerradas), y una función nueva que se olvide del filtro filtra respuestas. El
índice `applications_one_active_idx` y los cierres por trigger también cambiarían de sentido.

## R2 — El ciclo de vida de la fila

**Decisión**: `status` en (`waiting`, `lapsed`). Salir no es un estado: la fila se borra y nace la
solicitud. `lapsed` lleva `lapse_reason` en (`expired`, `withdrawn`, `adopted`, `unpublished`,
`not_receiving`, `you_blocked`, `suspended`, `capped`) y `answers` en nulo; un `check` ata
`answers is not null` a `status = 'waiting'` (FR-030: al no salir se borran en la misma sentencia).
El plazo es una columna `expires_at = written_at + private.held_ttl()` (14 días, con paridad en
`lib/applications/rules.ts`, como `max_active_applications`).

**Motivo**: la línea de «Cerradas y retiradas» necesita el animal, el día y el motivo (FR-028), nada
más. Borrar la fila al salir deja un solo lugar donde vive una solicitud que salió, con su
`attempt_id`, que es lo que hace idempotente el reintento (R5).

**Descartado**: guardar `released_at` y conservar la fila: duplicaría la solicitud en «Mis
solicitudes» y no responde ninguna pregunta de la medición que los momentos no respondan (R10).

## R3 — Dejarla escrita: `hold_application`

**Decisión**: función `public.hold_application(p_applicant, p_attempt, p_code, p_answers,
p_pending_ttl)` → `(outcome, held_id, application_id)`, con los candados de la cuenta en el orden
teléfono → identidad (`lock_phone_account`, `lock_identity_account`). Orden de controles: el intento
ya existe (en las dos tablas) → `already`; luego los de `submit_application` en su orden; si la
persona ya tiene nivel 2 → delega en `public.submit_application` y devuelve su resultado (FR-006);
si no hay pedido en revisión (`identity_requests` del usuario con `expires_at > now()`) →
`needs_identity`; respuestas válidas; inserta. `submit_application` se redefine para que una que
espera para el mismo animal devuelva `has_held` y para que el límite cuente las que esperan
(FR-005, FR-010).

**Motivo**: una sola función decide en una transacción, como la de #63 (R2 de esa historia). Los
candados en ese orden no forman ciclo: `submit_application` toma solo el del teléfono y
`resolve_identity_request` solo el de identidad.

**Descartado**: un parámetro `p_hold` en `submit_application`: mezcla dos resultados distintos en
una función que ya es larga y que leen tests de #63, #65 y #257.

## R4 — Salir: `release_held_applications`

**Decisión**: `private.release_held_applications(p_user uuid)` recorre las filas `waiting` del
usuario `for update`, ordenadas por `written_at`, y para cada una con `now() < expires_at`,
`private.has_level_two(p_user, private.pending_ttl())`, `private.pet_receives_applications(pet) =
'yes'` y sin bloqueo en ningún sentido: inserta en `public.applications` con el mismo `attempt_id`,
las respuestas, `publisher_id` de ahora y `sent_at = now()`; escribe el aviso de solicitud nueva con
la regla de siempre; anota el momento (R10); borra la fila. Devuelve lo que pasó con cada fila
(salió, sigue esperando, con el nombre, el último día y lo que la medición necesita). La regla del
correo se extrae a `private.queue_new_application_notice(p_app uuid)`, que usan esta función y la
`submit_application` redefinida, así no hay tres copias.

Las respuestas se normalizan al salir: si el animal pasó a castrado, se saca el compromiso de
castración, que ya no corresponde. El caso inverso (dejó de estar castrado) deja la solicitud sin
esa respuesta; la bandeja muestra las que hay. No se bloquea la salida por eso: sería una solicitud
que no sale sin motivo visible.

**Motivo**: la misma función sirve a la aprobación (FR-020) y a la tarea (R5). `sent_at = now()` es
lo que hace que la fecha, «Nueva» y el tiempo de respuesta cuenten desde que salió (FR-021) sin tocar
la bandeja.

## R5 — Cuándo corre

**Decisión**:

1. **En la aprobación**: `resolve_identity_request` (redefinida) llama a
   `release_held_applications(owner)` después de insertar la verificación y antes de
   `resolve_identity_asks`, dentro del mismo candado de identidad. Devuelve una columna `held jsonb`
   con lo que pasó con cada una, para el correo (R9).
2. **En una tarea**: `public.held_applications_tick()`, en `pg_cron` cada 5 minutos
   (`held-applications`), pura SQL: pone `lapsed`/`expired` las vencidas (con las respuestas en nulo)
   y, para cada usuario con filas `waiting` que puede salir, toma su candado de identidad y llama a
   `release_held_applications`. Cubre el animal que vuelve a recibir (FR-022), el teléfono que se
   confirma (FR-023) y el plazo (FR-030). El aviso de solicitud nueva sale por la bandeja de salida
   que ya drena `pet_lifecycle_tick`.

**Motivo**: «sale ese día» y «se borran ese mismo día» quedan cubiertos con 5 minutos, sin tocar las
funciones que reanudan, renuevan o cambian el teléfono (que viven en cinco migraciones distintas).

**Descartado**: triggers en `pets` para el animal que vuelve: el «vencido» es derivado de
`expires_at` y la «pausa» de una camada vive en otra tabla; un trigger por cada camino es más
superficie que una tarea de 5 minutos. Una tarea diaria: rompe «ese día» para lo que vence de tarde.

## R6 — Lo que hace que no salga en el momento

**Decisión**: triggers nuevos, sin redefinir los de hoy:

- `held_applications_lapse_on_pet_change` (after update en `pets`): `adopted` y `unpublished` (baja).
- `held_applications_lapse_on_pet_delete` (before delete en `pets`): `unpublished`, guardando el
  nombre y la camada. El borrado de la cuenta de quien publicó borra sus animales en cascada y pasa
  por acá.
- `held_applications_lapse_on_block` (after insert en `blocks`): `not_receiving` si bloqueó quien
  publicó, `you_blocked` si bloqueó quien solicitó.
- `held_applications_lapse_on_suspension` (after insert en `account_suspensions`): `suspended` para
  quien solicitó, `unpublished` para lo publicado por la suspendida.
- El tope: la rama de rechazo de `resolve_identity_request`, cuando `identity_retry_on` no es nulo,
  pasa a `capped` todas las que esperan de esa persona.

Retirar es `public.withdraw_held_application(p_user, p_id)` con el candado de identidad →
`withdrawn` · `released` (con el id de la solicitud que ya salió) · `closed` · `not_found`.

**Motivo**: la persona lo ve en el momento en «Mis solicitudes» (US3-AS4). Triggers propios dejan
intactos los de #63, #65, #67 y #205, que tienen sus tests.

## R7 — Lo que lee quien solicitó

**Decisión**:

- `public.my_held_applications()` (nueva, `security definer`, `auth.uid()`): id, estado, motivo,
  `written_at`, `expires_at`, código, nombre (el que tenía si se borró), si está a la vista, la
  portada, la camada y `receiving` del animal hoy. `listMyApplications` la llama junto a
  `my_applications` y arma una sola lista.
- `apply_context` (redefinida) suma `my_held_id`, `identity_in_review` y cuenta las que esperan en
  `active_count`; su lista para el límite trae también las que esperan, con su marca.
- `last_answers` de `apply_context` toma la más reciente entre la última solicitud y la última que
  espera (FR-009).
- La confirmación lee la fila por `public.my_held_application(p_id)`.

## R8 — La puerta y el cuestionario

**Decisión**: `ApplyGate` suma `{ kind: 'has_held' }` después de `has_active`, y `needs_identity`
pasa a `{ kind: 'needs_identity'; canHold: boolean }` con `canHold = identityInReview`. La pantalla de
identidad pedida dibuja la opción con `canHold`, o «Tu solicitud por Tobi espera tu identidad» con
`has_held`. La opción enlaza a `/solicitar/[code]?esperar=1` (`HOLD_FLAG` en `lib/applications/paths.ts`,
también con la marca de la cría); con la marca y `canHold`, la página dibuja `ApplicationForm` con
`mode="hold"`; con la marca y sin `canHold`, la pantalla de identidad de siempre. La acción
`holdApplication` (actions/applications.ts) devuelve `ActionResult` con el mismo mapeo de
resultados que `submitApplication` más `needs_identity` y `has_held`; con `sent` (delegó) redirige a
la confirmación de siempre; con `held`, a `/solicitar/[code]/dejada?id=<held>`.

## R9 — Los correos de resultado

**Decisión**: `IdentityResult` suma `held: HeldMailLine[]` (`{ name, outcome: 'released' | 'waiting'
| 'lapsed', until: string | null }`). Una función pura `heldMailParagraph(held, kind, t, day)` arma el
párrafo que va después del cuerpo de siempre: aprobada, «Le llegaron a quien publicó: Tobi y Pipo.» y
«Pipo sigue esperando hasta el 12 de noviembre: sale cuando vuelva a recibir solicitudes.»; rechazada
y vencida, el nombre y hasta qué día; rechazada con tope, que no van a salir. Con alguna, el enlace
secundario del correo aprobado pasa a «Ver mis solicitudes» y gana sobre el de volver al animal
(`approvedSecondary`). El vencido sale de `claim_identity_expiry_notices`, redefinida para devolver
también `held jsonb`. Sin filas, el correo es el de hoy (FR-035). Ningún dato de las respuestas
viaja (FR-036).

## R10 — La medición

**Decisión**:

- `apply_stopped` con `by = 'identity'` suma `hold_offered: boolean` (FR-037).
- `application_held` `{ litter, proposed_used, seconds }` desde la acción, después de guardar.
- Lo que pasa en la base (salir y no salir) se anota en `public.held_application_moments` (`kind` en
  `released`/`lapsed`, `reason`, `applicant_level`, `publisher_level`, `litter`, `created_at`), sin
  persona ni animal; la ruta `/api/cron/publicaciones` la toma con `claim_held_application_moments` y
  manda `held_application_released` `{ litter }` junto con `application_sent` `{ after: 'identity',
  held: true, litter, applicant_level, publisher_level, seconds: 0, proposed_used: false }`, y
  `held_application_lapsed` `{ reason }`. `pet_lifecycle_tick` suma la condición de que haya momentos
  sin tomar. `application_sent` suma `held` como propiedad opcional, falsa en el resto.
- La lectura 13 va en docs/03 §Métricas de éxito (FR-040).

**Motivo**: la salida pasa en una transacción de la base, a veces en la tarea, donde no hay cliente
de PostHog; la bandeja de momentos es el patrón de `follow_ups.measured_at` y de los vencimientos de
#69. Los motivos que llegan a PostHog son los cinco de la historia: `withdrawn`, `expired`,
`capped`, `suspended` y `not_receiving` (que agrupa `adopted`, `unpublished`, `not_receiving` y
`you_blocked`, «el animal dejó de recibir»).

## R11 — Pantallas y textos

**Decisión**: una vista pura `heldApplicationView(row, identity, now)` en
`lib/applications/held-view.ts` decide el sello (`waiting_identity` · `unavailable` · `not_sent`), la
línea del plazo y el motivo; `MyApplicationCard` la recibe armada. Textos en
`applications.held.*`, `applications.mine.stamps.waiting_identity|not_sent`,
`applications.mine.reasons.expired|withdrawn|capped`, `applications.withdraw.errors.released` y
`emails.identity_*.held_*`, escritos con `sin-slop`.

## R12 — Qué se prueba y por qué (docs/09 §Qué vale la pena testear)

- **`tests/db/held-applications-privacy.test.ts`** (expone un dato): como quien publicó, ninguna de
  `pet_applications`, `publisher_application`, `publisher_inbox`, `my_pets_stats` (o la que arma los
  números de «Mis animales») ni la tabla devuelve nada de una que espera; como quien administra, ni
  la tabla ni la cola de revisión; como visitante y como otra persona, `select` sobre la tabla falla
  y `my_held_applications` no trae nada ajeno.
- **`tests/db/held-applications-rules.test.ts`** (calcula mal o engaña): cada resultado de
  `hold_application` (en revisión, sin pedido, nivel 2 que delega, límite contando las que esperan,
  una por animal, ya rechazada, idempotencia por intento); salir en la aprobación, varias a la vez,
  `sent_at`, la regla del correo con y sin nuevas sin abrir; animal en pausa que sale con la tarea al
  reanudarse y que no sale después del plazo; el plazo con las respuestas en nulo; cada motivo de R6;
  el tope; retirar contra salir; una sola salida; el borrado de la cuenta; la paridad de 14 días.
- **Unitarias con Stryker al 100 %**: `apply-gate` (`has_held`, `canHold`), `held-view`,
  `heldMailParagraph` y `approvedSecondary`, los eventos nuevos y el mapeo de motivos.
- **`tests/e2e/solicitud-en-espera.spec.ts`**: dejarla escrita con el pedido en revisión, aprobar
  desde la revisión y verla en la bandeja de quien publicó con la fecha de ese día.
- Nada para las pantallas, las primitivas ni las queries finas.
