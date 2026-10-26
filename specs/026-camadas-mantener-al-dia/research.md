# Research: Camadas: mantener al día, responder, entregar y seguir cada cría

Decisiones técnicas de la historia #206, con lo que se descartó. Parte de lo que dejó #205
(`specs/025-publicar-una-camada/research.md`): una camada es una fila de `litters` y cada cría es una
fila de `pets` con `litter_id` y lo común copiado (R1 de #205), así que las solicitudes, sus cierres,
la entrega, el compromiso, el seguimiento y la encuesta ya funcionan por animal.

## R1. Dónde vive el estado de la camada y el de cada cría

- **Decision**: el estado propio de cada cría sigue en `pets.status` (`available`, `in_process`,
  `adopted`, y `paused` mientras su camada está pausada). La camada suma en `litters` solo lo que es
  de ella: `paused_at`, `expires_at`, `reminder_sent_at` y `expiry_counted_at`. El estado visible de la
  camada lo calcula `private.litter_state(l)` en este orden: `taken_down` si tiene baja; `adopted` si
  todas sus crías lo están; `paused` si `paused_at` no es nulo; `expired` si `expires_at <= now()`; si
  no, `available` (FR-002, Edge Cases).
- **Rationale**: cada cría es un animal para el resto del sitio, y las funciones de #63, #65, #67 y
  #69 (`pet_receives_applications`, `applications_close_on_pet_change`, `pet_can_hand_over`,
  `mark_pet_adopted`, los estados de «Mis solicitudes») ya miran `pets.status`, `pets.expires_at` y
  `private.pet_state`. Si la cría está pausada o vencida *como animal* cuando su camada lo está, todas
  siguen andando sin tocarlas: una camada pausada no recibe solicitudes ni las cierra (#63), una cría
  pausada o vencida se puede marcar adoptada (#59), y adoptarla cierra solo las suyas (FR-029).
  Adoptada va antes que pausada para que marcar adoptada a la última cría de una camada pausada la
  deje adoptada (FR-030).
- **Alternatives considered**: un estado único en `litters` que las funciones de solicitudes
  consulten además del de la cría: obliga a reescribir cada una de esas funciones y sus tests, con el
  riesgo de olvidar una y dejar pedir una cría de una camada pausada. Guardar el estado de la camada
  como columna (`litters.status`): se desincroniza con el de las crías al adoptar la última o al
  quitar la única disponible (US4-4); calcularlo no tiene esa falla.

## R2. Pausar sin perder el estado de cada cría

- **Decision**: columna `pets.resume_status` (`available` o `in_process`), que se llena solo en una
  cría que se pausa con su camada. Pausar pasa cada cría disponible o en proceso a `paused` guardando
  su estado en `resume_status`; las adoptadas no se tocan. Reanudar devuelve cada cría `paused` a su
  `resume_status`. Un trigger `before update` en `pets` vacía `resume_status` cuando la cría deja de
  estar `paused` por otro camino (marcarla adoptada con la camada pausada, FR-005, US3-10).
  Restricción: `resume_status is null or (status = 'paused' and litter_id is not null)`.
- **Rationale**: «al reanudar, cada cría vuelve al estado que tenía» (historia) exige guardar el
  estado anterior, y un animal suelto reanudado vuelve siempre a disponible (#59), así que es
  propio de la cría. El trigger hace que `mark_pet_adopted` de #67 no tenga que saber de camadas.
- **Alternatives considered**: no tocar a las crías al pausar y calcular «pausada» desde la camada:
  cae en la alternativa descartada de R1.

## R3. El vencimiento de las crías sigue al de su camada

- **Decision**: `litters.expires_at` es el único vencimiento que se escribe. Un trigger
  `after update of expires_at on litters` copia el valor a sus crías, y `save_litter` le pone a una
  cría nueva el `expires_at` de su camada (hoy pone `'infinity'`). La migración pone a cada camada ya
  publicada `expires_at = now() + 30 días` y lo copia a sus crías (FR-001).
- **Rationale**: un solo valor que se escribe y una copia que nadie más toca. Con la copia,
  `private.pet_state` de una cría dice `expired` cuando su camada venció, y las reglas de solicitudes
  de #63 para un animal vencido valen para la cría.
- **Alternatives considered**: dejar `'infinity'` en las crías: una cría de una camada vencida seguiría
  recibiendo solicitudes por el cuestionario abierto. Contar los 30 días de las camadas viejas desde su
  publicación: podría vencerlas el día que llega la migración sin el correo de los 7 días (spec,
  Assumptions).

## R4. Las acciones: dos funciones nuevas, el resto se reusa

- **Decision**:
  - `change_litter_status(p_owner, p_litter, p_action, p_pending_ttl, p_young uuid[])` con
    `pause`, `resume`, `renew` y `republish`, con la misma forma de salida que `change_pet_status`
    (`not_found`, `taken_down`, `already`, `changed`, `needs_verification`, `done`) y el nivel 1 de
    `identity_level_one` para `resume`, `renew` y `republish` (FR-004). `republish` sobre una vencida
    deja cada cría como estaba (solo cambian `expires_at` y `published_at`); sobre una adoptada exige
    `p_young` con al menos una cría adoptada de esa camada, deja disponibles solo esas, cierra sus
    adopciones en curso como `change_pet_status` (`adoptions.ended_at = now()`) y devuelve cuántas
    terminaron (FR-006).
  - `change_young_status(p_owner, p_pet, p_action)` con `mark_in_process` y `mark_available`, solo
    con la camada `available` (Edge Cases). `mark_available` desde `adopted` termina la adopción en
    curso de esa cría como `republish` de un animal suelto y devuelve `ended_marked_at` (FR-007). Ninguna
    de las dos pide nivel 1.
  - Marcar adoptada una cría es el `mark_pet_adopted` de #67 sin cambios: ya acepta los estados
    `available`, `in_process`, `paused` y `expired` y cierra solo las solicitudes de ese animal.
  - `delete_young(p_owner, p_pet)` quita una cría sin nivel 1: si es la única de su camada, borra la
    camada (`litter_deleted`); si no, borra la cría (`young_deleted`). `preview_litter_removal` de
    #205 da el número para la confirmación (FR-033, FR-035).
  - `change_pet_status`, `delete_pet` y `create_pet_renewal_link` siguen rechazando una cría
    (`litter_young`): las crías tienen sus propias funciones.
- **Rationale**: las reglas de cada acción quedan en la base, con `lock_phone_account` y `for update`
  como las de #59 (FR-009); el rechazo por estado cambiado devuelve el estado de ahora para la
  pantalla.
- **Alternatives considered**: que `change_pet_status` acepte crías con ramas por `litter_id`: mezcla
  dos máquinas de estados en una función que ya es larga, y `pause` o `renew` sobre una cría no
  tienen sentido.

## R5. El recordatorio, la renovación y el enlace «Sigue disponible»

- **Decision**: `pet_renewal_links` suma `litter_id` con la regla de un solo sujeto
  (`num_nonnulls(pet_id, litter_id) = 1`), como `pet_reviews` en #205. Funciones nuevas
  `claim_litter_reminders(p_limit)` y `claim_litter_expiries(p_limit)` con las reglas de las de
  animales (cuenta no suspendida, `reminder_sent_at` nulo, faltan 7 días o menos, estado `available`);
  `create_litter_renewal_link(p_litter, p_token_hash)`. `renew_by_link` y `renewal_link_view` miran
  el sujeto del enlace y, si es una camada, llaman a `change_litter_status` (`renew` o, vencida,
  `republish`) y devuelven el nombre de la camada. `claim_pet_reminders` y `claim_pet_expiries` suman
  `litter_id is null`. `pet_lifecycle_tick` despierta a `/api/cron/publicaciones` también cuando hay
  camadas debidas. `reactivate_account` corre `litters.expires_at` como corre el de los animales
  (decisión 2026-10-05).
- **Rationale**: un solo correo por camada (FR-011, SC-001) sale de una sola cola por camada, y las
  crías no entran a la de animales. El enlace sigue siendo de un solo uso por sujeto, con el mismo
  hash y la misma vida (FR-012).
- **Alternatives considered**: una tabla `litter_renewal_links` aparte: duplica la tabla, su purga y
  la pantalla de resultado sin ganar nada.

## R6. El listado, la ficha y la vista previa con estados

- **Decision**: `listed_pets` muestra la fila de una camada solo si `litter_state = 'available'`;
  `litter_available_count` cuenta las crías `available` no vencidas; la columna `status` de la fila de
  camada dice `in_process` cuando no hay disponibles y alguna está en proceso (el sello de la tarjeta,
  FR-016); el filtro de sexo mira las crías `available` o `in_process` (FR-017). `litter_by_code`
  devuelve el estado de la camada y el de cada cría; a quien no la publicó le devuelve `paused` o
  `expired` sin datos (como `pet_by_code`), y la adoptada entera. `litter_share_card` devuelve la
  adoptada con su marca y nada de una pausada o vencida (FR-019, FR-020).
- **Rationale**: es la regla de #59 para un animal, con la camada como unidad, y deja la lectura de lo
  que no está a la vista en la base (constitución V).

## R7. La bandeja agrupada por camada

- **Decision**: `publisher_inbox` devuelve además `litter_id`, `litter_code` y `litter_name` en la fila
  de una cría, y suma una fila con cero solicitudes por cada cría sin ninguna de una camada que tiene
  al menos una (FR-023). La pantalla agrupa en el servidor con una función pura
  `groupInbox(rows)` (`lib/applications/inbox-groups.ts`): un animal suelto queda como hoy; las crías
  de una camada quedan juntas, en el orden de la camada, con la suma de esperando y nuevas. `inbox_pet`
  suma `litter_name` y `litter_code` para el encabezado de «Solicitudes de una cría».
- **Rationale**: agrupar en la base y en la página daría dos lugares con la misma regla; la consulta
  trae las filas y la regla de agrupado, que tiene casos borde (camadas con una sola cría pedida, orden,
  sumas), queda en una función con test.
- **Alternatives considered**: una consulta por camada: N+1 contra la bandeja.

## R8. El nombre de la camada en lo que ya existe

- **Decision**: `applications.litter_name text` se llena, como ya pasa con `pet_name`, cuando una
  solicitud de una cría se cierra porque la cría se adoptó, se quitó o se dio de baja; los triggers
  `applications_close_on_pet_change` y `applications_close_on_pet_delete` lo leen de `litters`.
  `delete_litter` borra primero las crías y después la camada, así el trigger todavía ve el nombre.
  `my_applications`, `my_application`, `claim_application_notices`, `commitment_for_email`,
  `claim_follow_up_events` y `follow_up_answered_for_email` suman `litter_name` (el de la camada viva,
  o el copiado). `handover_candidates`/la pantalla «¿A quién se la diste?» y el compromiso lo reciben
  para el texto (FR-028, FR-036, FR-038).
- **Rationale**: «en todos sus estados» incluye la solicitud de una cría quitada, cuya fila de `pets`
  ya no existe.

## R9. «Mis animales» con la camada como grupo

- **Decision**: la camada sigue siendo una `PetCard` de la pared, con su sello (`PetStatusStamp` por
  estado de camada), su `PetExpiryLine` y `LitterStatusActions` (la acción destacada a la vista y el
  resto en el `PetStatusSheet`, como `MyPetActions`). Debajo, `LitterYoungSummary` pasa a ser
  `YoungRows`: una fila por cría con su nombre y sexo, su sello, sus solicitudes nuevas como enlace y
  «Acciones», que abre un `PetStatusSheet` con las acciones de esa cría. La pantalla
  `/mis-animales/camadas/[id]` (nueva) es el «Un animal en Mis animales» de la camada: todo a la vista,
  con `HandoverLine` y `FollowUpLine` por cría adoptada; ahí llevan «Ya no está disponible» y los
  avisos.
- **Rationale**: una columna de 175 px no lleva diez filas con cinco botones cada una; el sheet es el
  patrón que `PetStatusSheet` ya resolvió para un animal (docs/10).

## R10. Las acciones del cliente: un solo hook

- **Decision**: `usePetStatus` pasa a recibir la acción del servidor que corre (`run`) y el sujeto
  (`subjectId`); `PetStatusActions` se extrae en `StatusActionList`, que pinta una lista de acciones
  con el mismo flujo (ocupado, falla, rechazo, aviso de verificación). `LitterStatusActions` y
  `YoungStatusActions` lo componen con `actionsForLitter(state)` y `actionsForYoung(young, litter)`
  de `lib/litters/lifecycle.ts`.
- **Rationale**: tercera repetición del mismo flujo (CLAUDE.md regla 2), con las mismas reglas de doble
  toque y reintento (FR-009).

## R11. Volver a publicar una camada adoptada

- **Decision**: `RepublishLitterDialog`, sobre `Dialog`, con un `Checkbox` por cría adoptada (al menos
  una), el aviso de #67 si alguna se entregó a una persona («Se termina la adopción de Cría 2») y
  «Volver a publicar». Sin ruta propia.
- **Rationale**: es una confirmación con una elección, del tamaño de `RemoveYoungDialog`; una
  pantalla nueva no agrega nada.

## R12. Medición

- **Decision**: `application_accepted` y `pet_handed_over` suman la propiedad `litter: true` cuando el
  animal es una cría, como ya lo hacen `pet_viewed`, `apply_tapped`, `apply_stopped` y
  `application_sent` (#205). `pet_status_changed` lleva `litter: 'young'` en el cambio de una cría y
  `litter: 'litter'` en el de la camada entera; `pet_reminder_sent`, `pet_renewed`, `pet_republished`,
  `pet_expired` y `pet_deleted` llevan `litter: 'litter'` o `'young'` según el sujeto. Las funciones que
  devuelven esos datos (`accept_application`, `mark_pet_adopted`) suman `in_litter boolean` a su
  salida. Ningún evento nuevo. La encuesta ya
  se ofrece por animal adoptado y ya respeta el tope de 30 días (#71): solo hay que mostrarla debajo de
  la fila de la cría (FR-043).
- **Rationale**: los embudos de docs/03 §7 siguen siendo los mismos, separables por la marca.

## R13. Dependencias

- **Decision**: ninguna dependencia nueva. `docs/07-stack.md` no cambia.
