# Research — Marcar a quién se entregó cada animal y el compromiso de adopción

Lo que el plan decide y por qué. Todo sobre lo que ya hay en `main` (#59, #63, #65): sin
dependencias nuevas.

## R1 — La entrega vive en una tabla propia, `adoptions`, una fila por cada vez que se marca

**Decisión**: `public.adoptions`, una fila cada vez que un animal se marca adoptado, a una persona
(`kind = 'site'`) o por fuera (`kind = 'outside'`). Una sola fila **vigente** por animal (`ended_at
is null`, índice único parcial); volver a publicar la termina. Lleva `application_id` y
`adopter_id` solo con `site`, la línea de la castración (`includes_neuter`), y las fechas:
`marked_at` (que es también el día en que aceptó quien lo dio), `adopter_accepted_at`,
`declined_at`, `contact_cut_at`, `ended_at`.

**Por qué**: el vínculo es histórico (docs/03 §5) y el seguimiento de la historia siguiente lo
necesita por separado de la solicitud; un animal puede adoptarse, volver y adoptarse otra vez
(spec §Edge Cases), y cada vez tiene su compromiso. Columnas en `pets` perderían la anterior.

**Descartado**: columnas en `applications` (la entrega por fuera no tiene solicitud y el
compromiso no es de la solicitud); copiar los nombres de las personas (FR-011: los de hoy).

## R2 — Sin políticas ni permisos: se lee con funciones que miran `auth.uid()`

**Decisión**: RLS encendida, `revoke all` de `anon` y `authenticated`, sin políticas. Se lee con
funciones `security definer` que devuelven filas solo a las dos personas (quien lo dio por
`pets.owner_id` y `adoptions.publisher_id`; quien adoptó por `adopter_id`, y solo mientras no dijo
«Yo no adopté»). Se escribe con funciones con `grant` solo a `service_role`, que reciben el id de
la persona desde la sesión, como #65 (R5 de #65).

**Por qué**: es el patrón de `application_reviews`; una política de lectura sobre la tabla dejaría
a quien adoptó leer `declined_at` o el estado de otra fila del mismo animal. FR-062 exige que
nadie más lea nada por ningún camino.

## R3 — Marcar adoptado es una función nueva; `change_pet_status` ya no adopta

**Decisión**: `public.mark_pet_adopted(p_owner, p_pet, p_application uuid, p_attempt uuid)`: toma
el candado de la cuenta (`lock_phone_account`) y el del animal (`for update`), valida el estado
(los de #59: disponible, en proceso, pausado, vencido), y con `p_application` exige que esa
solicitud sea de ese animal, de ese publicador y esté `accepted` en ese momento. Inserta la fila de
`adoptions`, cierra la solicitud elegida con el motivo nuevo `handed_over`, encola el aviso
`adoption_marked` para quien adoptó, y pone el animal `adopted` como hoy lo hace
`change_pet_status`; el disparador de #63/#65 cierra las otras como `adopted` (encontró hogar) y
encola sus `closed_adopted`. `change_pet_status` deja de aceptar `mark_adopted` (`changed`).

Resultados: `done`, `already` (mismo `attempt_id`: doble toque o reintento), `changed` (el animal
ya está adoptado por otro intento, se borró o se dio de baja), `not_accepted` con `publisher_close`
(`gone`, `you_blocked`) o `revoked` (la dejó sin efecto el publicador), `not_found`.

**Por qué**: sin elegir no se marca (FR-001); que la elección y el cambio de estado vayan en una
transacción con el animal bloqueado resuelve las dos pestañas (gana la primera) y la aceptada que
se retira mientras se elige (FR-004). Si `change_pet_status` siguiera adoptando, quedaría un camino
que marca sin elegir.

## R4 — El contacto después de adoptar: solo el par, y un corte que no vuelve

**Decisión**: `application_contact` se recrea. Se ve con la solicitud `accepted` (como hoy) o
`closed` con `handed_over` y su adopción vigente, sin `declined_at`, sin `ended_at` y sin
`contact_cut_at`. Deja de verse con `closed` + `adopted` (las aceptadas no elegidas: cambia #65,
FR-030). Los disparadores de bloqueo y de suspensión de #63 suman un `update adoptions set
contact_cut_at = now()` para las vigentes del par (bloqueo) o de la persona (suspensión, de los
dos lados). Desbloquear o reactivar no lo borra: `contact_cut_at` no vuelve a `null` nunca.

**Por qué**: hoy el contacto de una cerrada por adopción mira el bloqueo **de ahora**; desbloquear
lo volvería a mostrar, y la historia pide que no (FR-032). Una marca que no se borra es lo más
simple que cumple.

## R5 — Aceptar el compromiso y «Yo no adopté» son funciones con candado

**Decisión**: `accept_commitment(p_adopter, p_application)` y `decline_adoption(p_adopter,
p_application)`, `grant` a `service_role`. Toman la fila de `adoptions` vigente de esa solicitud
`for update`, exigen `adopter_id = p_adopter`, `adopter_accepted_at is null`, `declined_at is
null`, `ended_at is null`, `contact_cut_at is null` y que la cuenta no esté suspendida. `accept`
pone `adopter_accepted_at` y encola dos `commitment_accepted` (una por persona). `decline` pone
`declined_at`, pasa la solicitud de `handed_over` a `adopted` (excepción nueva en
`applications_forward_only`) y encola `adoption_declined` al publicador. Resultados: `done`,
`already` (ya aceptado / ya dicho: doble toque), `closed` (terminó, se deshizo o se cortó: la
pantalla se refresca con el estado de ahora), `suspended`, `not_found`.

**Por qué**: el doble toque y el reintento después de un corte que llegó tienen que hacer una sola
cosa y un solo correo (FR-055); el candado sobre la fila y la condición «todavía pendiente» lo
garantizan sin `attempt_id`.

## R6 — Volver a publicar termina la adopción

**Decisión**: `change_pet_status` con `republish` desde `adopted` suma `update adoptions set
ended_at = now() where pet_id = … and ended_at is null` en la misma transacción. La confirmación
(«La adopción con Ana termina…») es de la pantalla: aparece solo si la adopción vigente es a una
persona y no se deshizo; sin ella, «Volver a publicar» se comporta como en #59. Sin correo
(FR-053). Si falta el teléfono verificado, `needs_verification` llega antes de tocar nada (#59).

## R7 — Los correos, por la bandeja de salida de #65

**Decisión**: tres `kind` nuevos en `application_notices`: `adoption_marked` (a quien adoptó, en
lugar de su `closed_adopted`), `commitment_accepted` (dos filas, una por persona) y
`adoption_declined` (al publicador). Los vacía `drainApplicationNotices` como hoy.
`commitment_accepted` lleva el texto completo: `sendApplicationNotice` lo deriva a
`sendCommitmentEmail`, que lee `commitment_for_email(p_application)` (`service_role`: nombres de
hoy, animal, foto de portada, fechas, `includes_neuter`) y arma el cuerpo con `commitmentClauses`
y los textos de `adoptions.commitment.*`. `renderNoticeEmail` suma un extra opcional `lines`
(párrafos debajo del cuerpo). Ningún correo lleva teléfono, correo ni respuestas.

**Por qué**: la bandeja de salida ya resuelve el «una sola vez» (cada aviso se borra al tomarlo) y
que un correo que falla no deshaga lo hecho (FR-055).

## R8 — Marcar adoptado es una pantalla, no una hoja

**Decisión**: «Marcar adoptado» deja de ser un botón que corre la acción: es un `LinkButton` a
`/mis-animales/{id}/adoptado`, una ruta de servidor que trae las aceptadas
(`handover_candidates(p_pet)`) y el animal, con su `loading.tsx` (esqueleto de la lista) y su
`error.tsx` («Reintentar»). Adentro, `HandoverForm` (hoja cliente) tiene dos pasos en el mismo
lugar: elegir y, al elegir a una persona, el compromiso con la confirmación. Al salir bien vuelve a
la pantalla de donde vino con el aviso «Tobi quedó adoptado por Ana».

**Por qué**: la lista de aceptadas es un dato que se trae; en una hoja abierta desde un componente
cliente habría que traerla con una acción, y la spec pide cargando y error propios (§Pantallas).
Una pantalla también da «un paso por pantalla» (docs/10 §Layout) y una dirección para volver.

## R9 — Lo que ve cada uno se decide en funciones puras

**Decisión**: `src/lib/adoptions/`:

- `commitmentClauses({ includesNeuter })` → las claves de las cláusulas en orden.
- `adoptionView(row)` → `{ state: 'pending' | 'accepted' | 'declined' | 'ended', cut: boolean,
  canAccept, contact: 'shown' | 'unavailable' | 'none', showsCommitment }` desde la fila de
  `adoption_of`, que ya dice de qué lado mira (FR-013, FR-030-FR-033); `canDecline` llega con US3.
- `handoverLine(summary)` → qué renglón dibuja Mis animales (FR-040).
- `handoverOutcome(outcome, detail)` y `commitmentOutcome(outcome)` → la clave de i18n de cada
  resultado.
- `adoptionEvents` → los eventos de FR-070, sin datos de personas.

## R10 — Medición

Eventos nuevos en `events.ts`: `pet_handed_over` `{ to: 'site' | 'outside', days_since_published,
days_since_accepted: number | null, accepted_count }`, `commitment_accepted` `{
hours_since_marked }`, `adoption_declined` `{ hours_since_marked }`, `adoption_ended` `{
days_since_marked }`. `pet_status_changed` sigue saliendo al marcar adoptado, como hoy (el funnel
de #71 lo cuenta). Ninguno lleva ids, nombres ni textos.

## R11 — Lo que había antes

Los animales adoptados antes de la migración no tienen fila: se ven «Adoptado», sin a quién; sus
aceptadas cerradas por adopción dejan de ver el teléfono con el `application_contact` nuevo. No hay
datos reales (spec §Assumptions).

## R12 — Sin dependencias nuevas

Todo con lo que ya hay: Postgres, Server Actions, `next-intl`, las primitivas de `ui/`.
