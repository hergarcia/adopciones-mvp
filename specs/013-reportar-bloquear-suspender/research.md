# Research: Reportar, bloquear y suspender

Cada decisión con su motivo y lo que se descartó. Los números de FR, US y SC son los de `spec.md`.

## R1. La suspensión es una fila con fecha de levantada, y una sola función dice si está vigente

**Decisión**: `public.account_suspensions` guarda cada suspensión (`user_id`, `reason`,
`suspended_by`, `suspended_at`, `lifted_by`, `lifted_at`), con un índice único parcial que permite
una sola vigente por cuenta (`where lifted_at is null`). `private.is_suspended(p_user uuid)` es la
única pregunta («hay una fila sin `lifted_at`») y la usan todas las funciones de abajo. Las
anteriores quedan como historial (FR-008) hasta que se borra la cuenta (`on delete cascade` sobre
`user_id`; `suspended_by` y `lifted_by` con `on delete set null`, que la pantalla muestra como «una
cuenta borrada», FR-033).

**Por qué**: el historial de suspensiones es parte de lo que la historia pide mostrar, y una
columna `suspended_at` en el perfil lo perdería al reactivar. Una sola función evita que el listado,
el perfil y los avales pregunten distinto.

**Descartado**: un `boolean` en `profiles` (sin historial, y `profiles` lo lee su dueña: la
suspensión quedaría escrita en una tabla que el cliente lee); el `ban` de Supabase Auth
(`banned_until`): corta el ingreso, y la spec pide que la persona pueda entrar, ver el motivo y
borrar su cuenta (FR-019), y no cambia lo que ven los demás.

## R2. «Una cuenta suspendida se ve como una que no existe» vive en cinco funciones que ya existen

**Decisión**: la regla de fondo de la spec se agrega en el punto único de cada lectura, sin tocar
las páginas:

- `private.has_level_two(p_user, ttl)` suma `and not private.is_suspended(p_user)`. Como todo lo de
  los avales pregunta por ahí (`public_profile`, `publisher_level`, `my_vouches`, `give_vouch`), un
  aval dado o recibido por una suspendida deja de contar en el mismo instante y vuelve al reactivar
  sin escribir nada (FR-020, FR-023).
- `private.pet_is_listed(p_owner)` suma lo mismo: el listado, la portada, la vista previa, las
  fotos firmadas (policies de Storage vía `pet_is_shown`) y la foto de perfil del publicador dejan
  de verse juntas.
- `public.public_profile(...)` filtra `where not private.is_suspended(p.id)`: cero filas, igual que
  un perfil que no existe (la página ya responde 404 con `ProfileNotFound`).
- `public.my_vouches(...)` y la lista de quienes avalan en `public_profile` filtran las filas cuya
  otra parte está suspendida («dejan de verse», FR-020), en lugar de mostrarlas «en pausa», que
  diría que algo le falta a esa persona.
- `public.pet_by_code(...)`: para quien no es la dueña, si la dueña está suspendida, cero filas,
  como una dada de baja: la ficha dice «no está publicado» y no «no disponible por ahora», que es el
  texto de un publicador sin teléfono (FR-020, US2.7).

Además: `pet_review_queue` y `count_pet_reviews` saltean las de una cuenta suspendida;
`claim_pet_reminders` y `claim_pet_expiries` también (no sale el correo, no se mide un vencimiento
que el R3 deshace); `renew_by_link` devuelve `invalid`, y `renewal_link_view` —la única lectura de la página de
resultado y de la portada `/sigue-disponible/{token}/foto`— devuelve cero filas, si la dueña está
suspendida (la página
de resultado ya dice «el enlace no sirve» sin nombre ni foto, Edge Cases); y `private.is_admin()` suma `and
not private.is_suspended(auth.uid())`, así una persona que administra y está suspendida no abre ni
resuelve nada aunque llame a la base con su token.

**Por qué**: es la misma técnica de #57 con el nivel 1 (una función, todas las lecturas); probar la
regla es probar cinco funciones, no veinte pantallas.

**Descartado**: ocultar en cada página (se olvida una y se filtra el dato, constitución §V); una
vista materializada de «cuentas visibles» (una tarea más que puede llegar tarde).

## R3. El tiempo suspendido no corre: al reactivar se corre `expires_at`

**Decisión**: `reactivate_account` mueve el vencimiento de las publicaciones de la cuenta que
estaban disponibles o en proceso y no habían vencido al suspender: `expires_at = expires_at +
(lifted_at - suspended_at)` para las que tenían `expires_at > suspended_at` y siguen sin dar de
baja. Las pausadas y adoptadas no tienen `expires_at` (#59) y no cambian; una que ya estaba vencida
al suspender sigue vencida. `reminder_sent_at` no se toca: si el correo ya había salido no se repite;
si no, la tarea de #59 lo manda en su próximo ciclo cuando entre en sus últimos 7 días (Edge Cases).
Decisión registrada en docs/03 §2 (2026-10-05, enjambre).

**Por qué**: es una sola escritura, en el momento en que se conoce la duración. Mientras dura la
suspensión el reloj sigue en la base, pero nadie lo ve (R2) y la tarea saltea la cuenta.

**Descartado**: congelar escribiendo `expires_at = null` al suspender (pierde cuánto quedaba);
derivar el vencimiento restando suspensiones en cada lectura (la cuenta del listado se vuelve cara
y `pet_state` dejaría de ser una función simple con paridad).

## R4. La puerta de la cuenta suspendida: en cada página y en `getSessionUser`, cerrada ante la duda

**Decisión**: `getAccountStanding()` (`lib/supabase/queries/moderation.ts`, envuelta en `cache`:
una ida por pedido) llama a `my_account_standing()` —`security definer` para `authenticated`, lee
`auth.uid()`— y devuelve `active`, `suspended` o `unknown` (la consulta falló). Una función pura,
`standingGate(standing)` (`lib/moderation/standing-gate.ts`), decide: `active` → seguir;
`suspended` y `unknown` → ir a `/cuenta-suspendida`. Hay dos lecturas de la sesión, separadas:

- **Con puerta** — `getSessionUser()` (`lib/supabase/queries/session.ts`): con sesión, pregunta la
  situación y aplica `standingGate` con `redirect`. La usan todas las Server Actions, los Route
  Handlers con sesión y `requireProfile` (todas las páginas de `(app)`). En una Server Action
  `redirect()` es la forma de Next de navegar desde el servidor; es la excepción anotada a «las
  acciones no lanzan» (docs/08), igual que el `redirect` que ya hace `deleteAccount`.
- **Sin puerta** — `lookupSession()` (la de hoy): solo la usan `AccountMenu` (el menú nunca
  redirige: si lo hiciera, el redirect podría llegar con el HTML ya en streaming), `deleteAccount` y
  salir (`actions/profile.ts`), `actions/vouches.ts` (distingue sesión vencida de falla y llama
  después a `standingGate`) y la pantalla de suspendida.

Cada `page.tsx` de `(public)` y `(auth)`, y el Route Handler de `/sigue-disponible/{token}`, llaman
al principio a `redirectIfSuspended()` (que sin
sesión no consulta nada: la sesión ya está cacheada por el menú); las de `(app)` lo hacen a través de
`requireProfile`. Va **en la página y no en el layout**: un layout compartido no se vuelve a pintar
al navegar entre páginas de su grupo, y una sesión abierta antes de la suspensión seguiría
navegando (FR-019, US2.6). La página sí se pide al servidor en cada navegación, y el `redirect` sale
antes de cualquier `Suspense` de esa página.

La pantalla `/cuenta-suspendida` vive en un grupo `(suspended)` con su propio layout (`PaperFrame`
con `menu={false}`, «sin menú del sitio») y hace lo inverso: `active` → `/mi-perfil`; `unknown` →
`error.tsx` con «Reintentar»; sin sesión → `/entrar`. Por eso cerrar ante la duda no deja a nadie
trabado: un fallo pasajero lleva a una pantalla que vuelve a preguntar.

`src/lib/auth/session-gate.test.ts` fija dos cosas (no va en `tests/gates/`, que cambia solo con
`reglas-aprobadas`; Ship propone moverlo): la lista cerrada de archivos que importan
`lookupSession` (la de arriba) y que cada `page.tsx` de `(public)`, `(app)` y `(auth)` llama a
`redirectIfSuspended(` o `requireProfile(`.

**Costo**: una consulta más por pedido, solo con sesión; es una lectura por clave primaria parcial.
La etapa Build la mide con `tests/e2e/perfil-rendimiento.spec.ts` y `animales-rendimiento.spec.ts`,
que ya existen, con sesión.

**Escrituras que no pasan por el servidor**: la policy `avatars_own` de Storage y
`profiles_update_own` suman `and not private.is_suspended((select auth.uid()))` en su `with check`,
así una suspendida tampoco escribe con su token directo; las demás escrituras de la persona son
`service_role` y las llama solo el servidor, después de `getSessionUser`; las de quien administra
caen con `is_admin()` (R2).

**Descartado**: el chequeo en `proxy.ts` (una ida a la base en cada pedido, y una redirección a
un POST de Server Action no navega en el cliente); la puerta en los layouts (no corre al navegar
dentro del grupo); `redirect` dentro de `AccountMenu` (puede llegar con el HTML ya enviado); un
claim en el JWT (dura una hora); abrir ante la duda (una suspendida podría reportar o bloquear
durante una caída).

## R5. Reportes: una tabla cerrada y funciones con candado; la cola es una función de quien administra

**Decisión**: `public.reports` (`id`, `reporter_id` con `on delete set null`, `reported_id` con
`on delete cascade`, `reason` con `check` en las seis claves en inglés —`scam`,
`animal_abuse`, `sells_animals`, `impersonation`, `harassment`, `other`—, `details` hasta 1000,
`created_at`, `resolved_at`, `resolved_by` con `set null`, `resolution` en `dismissed` /
`suspended`, `suspension_id`). Índice único parcial `(reporter_id, reported_id, reason) where
resolved_at is null` (FR-004): el duplicado choca en la base, no en la aplicación. Check: `details`
no vacío con `other`.

Funciones (todas `security definer`, `set search_path = ''`):

- `create_report(p_reporter, p_reported_public_id, p_reason, p_details)` — `service_role`.
  Devuelve `created` · `duplicate` · `self` · `not_found` (no existe, o suspendida y quien reporta
  no la bloqueó, FR-002).
- `report_queue()` — `authenticated`, adentro `is_admin()`. Los sin resolver del más viejo al más
  nuevo, cada uno con quien reportó (nombre o null), la persona reportada (nombre, `public_id`, si
  está suspendida), si quien reportó está suspendida (`reporter_suspended`, la marca de Edge
  Cases) y su historial en `jsonb` (reportes cerrados con motivo, texto, fecha y cómo;
  suspensiones con motivo, fechas, quién). Los reportes sobre quien mira salen como un contador
  aparte, sin ninguna columna (FR-010).
- `close_report(p_report)` — `authenticated`, `is_admin()`. Solo cierra sin medidas. Con el candado
  de la fila (`for update`): `done`, `closed` (ya cerrado, con cómo y por quién), `own`, `gone` (se
  borró la cuenta, FR-032), `not_admin`. Cerrar suspendiendo es `suspend_account` con el reporte
  (R6): un solo camino, así lo que corre después (correo, medición) tiene un solo dueño.
- `count_open_reports()` — el número de «Mi perfil», sin los propios.

La tabla tiene RLS, `revoke all` y `grant select` a `authenticated` con una sola policy `select to
authenticated using ((select private.is_admin()) and reported_id <> (select auth.uid()))`: quien
administra no lee, ni por la base directo, los reportes sobre sí (FR-010); es el patrón de
`identity_request_images`. `report_queue` tampoco incluye lo propio en ningún historial;
nadie la escribe desde el cliente. Los tests de privacidad prueban las dos caras: quien administra
la lee, y la reportada, otra persona con sesión y `anon` no leen nada.

**Por qué**: el mismo patrón de `pet_reviews` y `resolve_pet_review` (#59): la base vuelve a
preguntar quién administra al leer y al resolver, y dos personas que administran chocan en el
candado de la fila (FR-011).

**Descartado**: un enum de Postgres (el proyecto usa `text` con `check`, docs/06); guardar el
reporte sin `reporter_id` desde el principio (quien administra lo tiene que ver, FR-008).

## R6. Suspender y reactivar

**Decisión**: `suspend_account(p_target_public_id, p_reason, p_report)` y
`reactivate_account(p_suspension)`, `authenticated` con `is_admin()`, candado por cuenta
(`lock_identity_account(target)`, el mismo que usa el pedido de identidad, para que retirar el
pedido no choque con su revisión). Suspender: inserta la fila (el índice único hace que la segunda
vea `already`, con quién y cuándo), cierra con `suspended` todos los reportes sin resolver de la
cuenta (FR-012), y retira el pedido de identidad abierto con `withdraw_identity_request`: las imágenes
viven en la base (`identity_request_images`, #11) y se borran por cascada en la misma transacción,
sin ningún paso en Storage. Devuelve también si había pedido retirado y los reportes que cerró con su `created_at`, para que
la acción mida un `report_closed` (`resolution: suspended`) por cada uno: sin eso la mediana de
SC-006 vería solo los cerrados sin medidas. `self` si es la propia (FR-010). Reactivar: pone `lifted_at`/`lifted_by`, corre el R3, y
devuelve `already` si ya estaba levantada, `gone` si la cuenta se borró.

**Por qué**: una transacción por decisión; lo que no puede fallar a medias (la fila, los reportes,
el pedido) va junto, y el correo sale después con `withDeadline` (FR-031).

## R7. Bloqueos: tabla de una dirección; el bloqueo borra avales con el candado de los avales

**Decisión**: `public.blocks (blocker_id, blocked_id, created_at)`, clave `(blocker_id,
blocked_id)`, las dos con `on delete cascade` (FR-041), check de distintos. RLS, `grant select` a `authenticated` y una policy `select to authenticated
using (blocker_id = (select auth.uid()) or (select private.is_admin()))`: quien bloqueó lee los
suyos y quien administra los lee todos (FR-040, sin pantalla en esta historia). Los tests prueban
las dos caras: esas dos personas leen, la bloqueada y terceros no. Funciones
`service_role`:

- `block_person(p_blocker, p_public_id)` — con `private.lock_vouch` en las dos direcciones (el
  candado que ya usan dar, retirar y quitar), borra los avales vigentes de las dos direcciones e
  inserta el bloqueo; idempotente. `self` · `not_found` (no existe o suspendida y sin bloqueo
  previo).
- `unblock_person(p_blocker, p_public_id)` — `unblocked` · `absent`. No toca `vouch_blocks`: una
  quita de #12 sigue valiendo (FR-016).
- `my_blocks(p_user)` — nombre, `public_id`, si tiene foto y desde cuándo; incluye a una bloqueada
  suspendida (FR-017a).
- `vouch_standing` cambia su tipo de retorno (se borra y se recrea con sus permisos) y suma
  `viewer_blocked_target` y `target_blocked_viewer`; `give_vouch` devuelve `unavailable` si hay
  bloqueo en cualquier dirección (la pantalla dice «No se pudo avalar», sin motivo, FR-017).
- `public_profile` no cambia por un bloqueo: la página decide la pantalla con `vouch_standing`
  (bloqueado gana para quien bloqueó, FR-017a). Para eso el perfil de una suspendida tiene que
  devolver una fila **solo** a quien la bloqueó, con el nombre y nada más: una función nueva
  `blocked_profile(p_viewer, p_public_id)` que devuelve el nombre si existe el bloqueo, esté o no
  suspendida.
- `listed_pets` suma `not exists (select 1 from public.blocks b where b.blocker_id = (select
  auth.uid()) and b.blocked_id = p.owner_id)`: la cantidad (`count(*) over ()`) y las páginas de 24
  salen sin huecos (FR-015a). La portada usa el mismo listado.
- `pet_by_code`: para quien no es la dueña y la bloqueó, `visibility = 'blocked'` sin ningún dato
  del animal (§Pantallas).

**Por qué**: el bloqueo es lo único de esta historia que depende de quién mira, y `auth.uid()` ya
llega a `listed_pets` y `pet_by_code` porque las llama el cliente de servidor con la cookie de la
persona.

**Descartado**: filtrar en la aplicación después de traer la página (la cantidad y las páginas
de 24 mentirían); una policy de lectura para la bloqueada (le contaría el bloqueo).

## R8. El número de una cuenta suspendida, y el retenido después de borrarla

**Decisión**:

- `check_phone_code` (se borra y se recrea: cambia su retorno) suma `withheld boolean`. Si el
  código es correcto y el número es el verificado de una cuenta suspendida, o está en
  `withheld_numbers` vigente, el código queda usado, la cuenta vuelve a como estaba antes de
  pedirlo (igual que `in_use`) y **no** se guarda la prueba de `phone_claims`: `withheld = true`.
  La acción redirige a `/verificar-telefono/no-se-puede-usar`.
- `claim_phone_number` devuelve `withheld` si en el medio la cuenta dueña fue suspendida (una prueba
  vigente de antes de la suspensión no sirve, FR-026).
- `public.withheld_numbers (number_hash text primary key, until timestamptz)` con el HMAC-SHA-256
  en hex del número normalizado (`+5989…`) con una clave que vive solo en Vault
  (`withheld_number_key`, que la migración crea con `gen_random_bytes(32)` si no existe). Un SHA-256
  sin clave no alcanza: los números uruguayos son unos 10 millones y se recorren en segundos; con
  la clave, la tabla sola no dice ningún número (FR-028). RLS sin ninguna policy y `revoke all`:
  nadie lo lee, tampoco quien administra. Un test comprueba que el hash guardado no es el SHA-256
  desnudo del número.
- Un trigger `before delete` sobre `auth.users` (`private.retain_suspended_number`) inserta el
  hash del número verificado con `until = now() + 12 months` si la cuenta tiene una suspensión
  vigente. **Nunca impide el borrado**: todo el cuerpo va en un bloque `exception when others`
  que deja un `warning` y sigue, porque borrar la cuenta es un derecho (Ley 18.331) y pesa más que
  la retención. La migración crea el secreto con `vault.create_secret(encode(gen_random_bytes(32),
  'hex'), 'withheld_number_key')` si no existe, así en la práctica no falta; un test borra una
  suspendida con el secreto quitado y comprueba que la cuenta se borra igual. Va sobre `auth.users` y no sobre `phones` porque el orden de los `on delete cascade` no
  está garantizado: en `phones` la suspensión podría haberse borrado antes.
- `pg_cron` diario `purge_withheld_numbers()` borra los vencidos (FR-027). Mientras no se borra, la
  comprobación usa `until > now()`, así un día de atraso de la tarea no traba a nadie.
- Las constantes viven en `lib/moderation/rules.ts` (`WITHHELD_MONTHS = 12`) con paridad contra
  `private.withheld_lifetime()`.

**Por qué**: el código por SMS sale igual (Assumptions de la spec), y el rechazo llega donde hoy
llega «en otra cuenta»: solo quien tiene el teléfono lo ve.

**Descartado**: guardar el número en claro (más dato del necesario, Ley 18.331); SHA-256 sin clave
(se invierte recorriendo los números posibles); `hashtext` como `phone_number_sends` (32 bits: dos números distintos pueden chocar y trabar a alguien que no tiene
nada que ver).

## R9. Correos de suspensión y reactivación

**Decisión**: `lib/email/send-suspension-notice.ts` con `renderNoticeEmail` y `sendEmail`, como los
de #11 y #59, con `withDeadline`; sin dominio propio los recibe solo la cuenta del servicio
(KL-006), y sin `RESEND_API_KEY` quedan en `.artifacts/mail/`. El de suspensión lleva el motivo
escapado tal cual, el correo de ayuda (`SUPPORT_EMAIL`) y que puede borrar su cuenta; el de
reactivación, el enlace al sitio. Si falla, se anota y se sigue (FR-031): `deliverNotice(send)` envuelve el envío, nunca lanza y
devuelve `sent`; las acciones no miran ese valor para decidir su resultado. El test es de esa
función.

## R10. Medición

**Decisión**: seis eventos nuevos en `lib/analytics/events.ts`: `person_reported` (`reason`),
`person_blocked`, `person_unblocked`, `account_suspended` (`from`: `report` · `profile`),
`account_reactivated`, `report_closed` (`resolution`, `hours` redondeadas desde el reporte; uno por reporte, también por cada uno que
cierra una suspensión). Sin
ids, sin nombres, sin texto (FR-050). Los arma `lib/analytics/moderation-events.ts`, con test. La
mediana semanal de SC-006 sale de `report_closed.hours` en PostHog.

## R11. Componentes y capas

**Decisión**: un dominio nuevo, `components/moderation/`, para lo que nombra la historia (reporte,
bloqueo, suspensión). `CharacterCount` pasa de `components/pets/` a `components/forms/`: ahora lo
usan dos dominios (regla de dos, docs/08). La pantalla «Ese número no se puede usar» es de
`components/verification/` porque es un desenlace de verificar el teléfono.

## R12. Glosario y claves

**Decisión**: docs/06 §Glosario suma reporte (`report`), reportar (`report`), motivo del reporte
(`report reason`), bloquear (`block`, distinto de quitar un aval: `remove`), bloqueo (`block`),
suspender (`suspend`), cuenta suspendida (`suspended account`, distinto de la publicación dada de
baja: `taken_down`), reactivar (`reactivate`), número retenido (`withheld number`). Textos nuevos
en `messages/es.json` bajo `moderation.*`, `emails.account_suspended`,
`emails.account_reactivated`, `verification.withheld` y `metadata.*`.

## Skills

Los skills `frontend-design:frontend-design`, `supabase:supabase-postgres-best-practices` y
`supabase:supabase` no están instalados en la sesión que escribió este plan. Se siguió
`docs/10-design-system.md` y las migraciones existentes como patrón; la etapa Build los carga antes
de escribir JSX, SQL y la puerta de sesión.
