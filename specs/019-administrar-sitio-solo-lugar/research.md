# Research: Administrar el sitio desde un solo lugar

Decisiones técnicas del plan. Cada una dice qué se eligió, por qué y qué se descartó. Lo que ya
existe en `main` se nombra con su archivo; lo nuevo, con el que se crea.

## R1. Quien administra lee por funciones `admin_*`, no ensanchando las policies

**Decisión**: todo lo que esta historia lee de otra persona pasa por funciones `security definer`
nuevas que preguntan `private.is_admin()` adentro y devuelven cero filas a cualquier otra sesión,
llamadas con la sesión (`createServerSupabase`), como ya hacen `report_queue()` y
`suspended_accounts()` (#13) y `admin_feedback()` (#71). Las policies de `profiles`,
`identity_rejections`, `identity_expirations`, `identity_verifications`, `reports`,
`account_suspensions` y `pets` **no cambian**.

**Por qué**: hoy quien administra lee el perfil y los rechazos de una persona solo mientras tiene un
pedido en revisión (`profiles_select`, `identity_rejections_select`); la ficha necesita leerlos
siempre. Ensanchar esas policies abriría también la lectura directa de tablas desde el navegador con
el token de quien administra, para columnas que la ficha no muestra. Una función devuelve exactamente
lo que FR-031 a FR-037 permiten y nada más, y el test de privacidad prueba esa sola puerta.

**Descartado**: una policy `is_admin()` por tabla (lectura demasiado ancha, difícil de probar columna
por columna); leer con la llave de servicio desde el servidor (saltea la RLS, que es la regla del
repo: CLAUDE.md §6, constitución §V).

## R2. Cada cola se cuenta por separado; el total del menú es una sola llamada

**Decisión**: `admin_queue_count(p_queue text)` devuelve, para `identity`, `pets` o `reports`,
`others` (lo que quien mira puede resolver), `oldest` (cuándo entró el más viejo de esos) y `own`
(jsonb con lo mío: tipo, nombre del animal si es una publicación, desde cuándo). Administrar hace las
tres llamadas en paralelo con `Promise.allSettled`: una que falla deja solo esa cola en «no se pudo
contar» (FR-016). El menú y Mi perfil llaman `admin_pending_total()`, que devuelve el total de
`others` de las tres, o `null` si la sesión no administra: una sola ida a la base en cada pantalla con
sesión, que para quien no administra corta en `is_admin()`.

Qué es un pendiente y cuándo entró, igual que cada lista hoy:

- `identity`: `identity_requests` con `expires_at > now()`; entra en `sent_at`; mío si `user_id`
  es quien mira.
- `pets`: `pet_reviews.pending_since is not null`, `pets.taken_down_at is null` y dueña no suspendida
  (lo mismo que `pet_review_queue`); entra en `pending_since` (que se reinicia al editar una revisada,
  #59); mío si `owner_id` es quien mira.
- `reports`: `reports.resolved_at is null`; entra en `created_at`; mío si `reported_id` es quien mira.
  De lo mío solo sale cuántos y desde cuándo, nunca el motivo ni el texto (FR-013).

**Por qué**: las tres reglas ya existen repartidas (`countPendingReviews`, `count_pet_reviews`,
`count_open_reports`); juntarlas en una función por cola deja una sola definición de «pendiente» para
Administrar, el menú y el resumen. `countPendingReviews` hoy lee toda la cola para contar.

**Descartado**: una función que devuelve las tres colas juntas (una falla tumba las tres, contra
FR-016); calcular el total del menú sumando en la aplicación tres llamadas (tres idas en cada
pantalla con sesión).

## R3. Plazos, atraso, orden y la forma de decir una espera son funciones puras

**Decisión**: `src/lib/admin/queues.ts` con `QUEUE_DEADLINE_HOURS = { identity: 48, pets: 24,
reports: 48 }`, `queueStanding(queue, oldest, now)` → `{ kind: 'clear' } | { kind: 'on_time',
waitedMs } | { kind: 'overdue', waitedMs, overMs }` (atrasada solo si la espera es **mayor** que el
plazo), `orderQueues(standings)` (atrasadas primero por `overMs` descendente; después y en empates el
orden fijo `identity`, `pets`, `reports`) y `waitParts(ms)` → `{ unit: 'under_hour' } | { unit:
'hours', value } | { unit: 'days', value }` (horas enteras debajo de 24, días enteros redondeando hacia
abajo desde 24). La base no conoce los plazos: devuelve instantes y la aplicación decide. Las usan
Administrar y el resumen.

**Por qué**: son reglas que, si se rompen, engañan a quien administra (docs/09 §Qué vale la pena
testear); puras se prueban con mutación al 100 %. La base devuelve `timestamptz` y el cálculo con
`now` del servidor es el mismo en las dos superficies.

**Descartado**: calcular el atraso en SQL (duplica las reglas con el resumen y no se muta).

## R4. La ficha es una función que devuelve un documento; la página corta de a 20

**Decisión**: `admin_person_record(p_public_id text)` devuelve una fila con `jsonb` por parte, o cero
filas si quien mira no administra o la cuenta no existe. Contenido (FR-031 a FR-038):

- `person`: `display_name`, `avatar_path`, `department`, `locality`, `created_at`, `level` (0 sin
  teléfono verificado según `identity_level_one`, si no `publisher_level`), `is_self`, y la
  suspensión vigente (`reason`, nombre de quien suspendió o nulo, `suspended_at`, `suspension_id`).
- `identity`: `verified_on`; el pedido en revisión (`id`, `sent_at`, `is_own`); los rechazos de la
  ventana de 30 días (`rejected_on`, `reason`); el vencimiento guardado (`expired_on`) si cae en la
  ventana. Nada de imágenes ni de `identity_resolutions`.
- `reports`: los reportes **sobre** la persona, de lo más nuevo a lo más viejo, con `reason`,
  `details`, `created_at`, `resolved_at`, `resolution`. Sin `reporter_id` ni `resolved_by`. Si es la
  propia ficha: ningún reporte, solo `own_open` (cuántos sin resolver).
- `suspensions`: todas, con `reason`, `suspended_at`, nombre de quien suspendió, `lifted_at`, nombre
  de quien reactivó (nulo = «una cuenta borrada», FR-034).
- `pets`: `code`, `name`, `state` (`private.pet_state`), `pending_review` (si está en Publicaciones
  por revisar), `takedown_reason`, `published_at`. Las borradas no existen.

Cada parte trae hasta 500 elementos; la página muestra 20 por parte y «Ver más» suma 20 con
`?<parte>=<n>` (`shownCount` de `lib/lists/newest-first`, el mismo de Encuestas), así lo que ya se
veía no se pierde (FR-036).

**Por qué**: una sola ida a la base para una pantalla que junta cinco fuentes; el documento permite
que la regla «la propia ficha no ve sus reportes» viva en la base, que es donde la prueba el test.
500 por parte es más de lo que una persona junta en la beta.

**Descartado**: cinco funciones (cinco puertas que probar y una ficha a medias si una falla); paginar
en la base por parte (cinco cursores para listas que en la beta tienen 0 a 3 elementos).

## R5. La ficha se abre por el id público de la persona

**Decisión**: `/administrar/personas/<public_id>`. Las listas ya conocen el id público
(`report_queue`, `suspended_accounts`); se suma a `listReviewQueue` (lee `profiles.public_id`) y a
`pet_review_queue` (`publisher_public_id`, cambia el tipo de retorno: `drop` y `create`). Una cuenta
borrada ya no tiene fila en `profiles`: la función no devuelve nada y la página, si quien mira
administra, dice que esa cuenta ya no existe (FR-039); si no administra, `notFound()` antes de leer
nada (FR-001).

**Por qué**: el id público ya es el identificador que sale a la pantalla (perfil público, #12); el
id de la cuenta no sale nunca de la base.

## R6. Buscar por nombre: plegado en la base, sin extensión nueva

**Decisión**: `private.fold_name(text)` (`immutable`): `lower`, `translate` de las vocales con tilde
y diéresis y la ñ a su letra sin marca, y espacios colapsados con `regexp_replace`. `admin_search_people
(p_query text, p_limit integer)` exige al menos 3 caracteres que no sean espacio después de plegar,
busca con `strpos(fold_name(display_name), fold_name(p_query)) > 0` (sin comodines que escapar),
ordena por «empieza con lo escrito» primero, después por el nombre plegado y por `created_at`, y
devuelve `p_limit + 1` filas para saber si hay más. Incluye suspendidas (con la marca) y nunca una
cuenta borrada (no tiene perfil). Una cuenta sin perfil completo no tiene nombre y no aparece.

La aplicación valida lo mismo con `adminSearchSchema` (zod, `lib/schemas/admin-search.ts`): recorta,
colapsa espacios, al menos 3 caracteres que no son espacio, hasta 60 (el largo máximo de un nombre).

**Por qué**: `unaccent` es una extensión más que registrar y probar para un caso que `translate`
cubre en español; con decenas de cuentas en la beta no hace falta índice. `strpos` evita escapar `%`
y `_`.

**Descartado**: `unaccent` + `pg_trgm` (dependencia de base nueva, sin necesidad a esta escala);
`ilike` con comodines (hay que escapar lo que la persona escribe).

## R7. La búsqueda es una hoja cliente con una Server Action

**Decisión**: `PersonSearch` (cliente) con `usePersonSearch` (hook) llama a la acción
`searchPeople(input)` de `src/actions/admin.ts`, que devuelve `ActionResult<{ people, more }>`. El
texto vive en el estado de la hoja: un error de la acción o de la red (la promesa que rechaza) muestra
«No se pudo buscar por la conexión» con «Reintentar» y no toca lo escrito (FR-053). Menos de 3
caracteres no llama a la acción: muestra el aviso con el mismo schema. La foto de cada resultado va
firmada con la sesión (R10).

**Por qué**: un formulario GET que navega pierde el control del error de red (el navegador muestra su
propia página); la acción deja decir qué pasó en la misma pantalla y reintentar con lo escrito.
Administrar es solo de quien administra y no está en el funnel: la hoja no pesa en el presupuesto de
las pantallas públicas.

**Descartado**: `next/form` con `?buscar=` (sin control del error de red); buscar mientras se escribe
(más llamadas sin necesidad; la spec habla de «buscar»).

## R8. El resumen: `pg_cron` a las 11:00 UTC, una fila por persona y día

**Decisión**: `cron.schedule('admin-digest', '0 11 * * *', 'select public.admin_digest_tick()')`. Uruguay
está en UTC−3 todo el año (sin horario de verano desde 2015), así que 11:00 UTC son las 8. El tick
llama a `/api/cron/resumen` con `pg_net` y el secreto de Vault, como `identity_expiry_mail_tick` y
`pet_lifecycle_tick`. La ruta llama `claim_admin_digests()` (solo `service_role`), que para cada persona
que administra y no está suspendida, sin envío registrado para `uruguay_today()`, calcula las tres
colas sin lo suyo con la misma regla de R2; si suma más de cero, inserta `(user_id, day)` en
`admin_digest_sends` (`on conflict do nothing`) y devuelve la fila con los tres pares
`count`/`oldest`. Después la ruta arma cada correo con `digestLines` (R3) y lo manda con `sendEmail`
(`extras.lines`). La misma función borra los envíos de más de 7 días.

Consecuencias que la spec pide: si la tarea corre dos veces el mismo día, la segunda no reclama a
nadie (FR-063); si falla el correo, la fila ya está y no se reintenta (FR-063); si una cola no se
puede contar, la función falla entera, no reclama a nadie y ese día no sale (spec §Edge Cases); si la
aplicación está apagada a las 8, el pedido de `pg_net` no llega y ese día no sale.

**Por qué**: es el patrón de tareas que ya existe (docs/07, decisión 2026-09-26) y no depende de
Vercel, que no está hasta el MVP. La fila por día es lo mínimo para no mandar dos veces y no guarda
nada de las colas (spec §Key Entities).

**Descartado**: Vercel Cron (no hay Vercel hasta el MVP; queda para la beta, docs/07); un tick cada 5
minutos que mira la hora (más corridas para una sola por día, y reintentaría en contra de FR-063).

## R9. Medición: cinco eventos sin datos de nadie

**Decisión**: en `src/lib/analytics/admin-events.ts`, con test:

- `admin_opened` `{ from: 'menu' | 'profile' | 'digest' | 'other' }`, del parámetro `?desde=` que
  ponen el menú (`menu`), Mi perfil (`perfil`) y el correo (`resumen`); sin parámetro o desconocido,
  `other` (`parseAdminOrigin`).
- `admin_queue_overdue` `{ queue, hours_over }`, una por cola atrasada al dibujar Administrar.
- `admin_digest_sent` `{ identity_count, identity_hours, pets_count, pets_hours, reports_count,
  reports_hours, overdue: QueueKey[] }`, horas enteras del más viejo (0 sin pendientes).
- `admin_record_opened` `{ from: 'identity' | 'pets' | 'reports' | 'suspended' | 'search' |
  'other' }`, del `?desde=` que pone cada enlace.
- `admin_search_done` `{ found: boolean }`. Nunca lo escrito.

Todos con `visit: false` (son de quien administra, como los de #11 y #13). `accountSuspendedEvents`
suma el origen `record`.

## R10. Las fotos en la ficha y la búsqueda: una policy de Storage para quien administra

**Decisión**: policy `avatars_select_admin` sobre `storage.objects` del bucket `avatars` con
`(select private.is_admin())`; la página firma con la sesión (`signAvatarUrl`), como ya hace con lo
que está en revisión (`avatar_object_in_review`). Sin foto, las iniciales de `Avatar`.

**Por qué**: la foto de perfil es la que la persona eligió mostrar; quien administra ya la ve en las
colas. Firmada con la sesión, la RLS decide y el test de privacidad lo intenta como `anon` y como una
persona.

**Descartado**: una ruta que baja la foto con la llave de servicio (saltea la RLS).

## R11. Suspender y reactivar desde la ficha reusan lo de #13

**Decisión**: `RecordModeration` (cliente) compone `SuspendSheet` (con `reportId: null`) o
`ReactivateSheet` (con `suspensionId`), y al terminar hace `router.refresh()`. `suspendAccount` y
`reactivateAccount` no cambian de regla; `suspensionSchema` suma `origin?: 'record'` para el evento y
las dos acciones suman `revalidatePath` de Administrar y de la ficha. Lo que ya responde la base
(`already`, `gone`, `not_admin`, `self`) se muestra con los textos de `moderation.errors`.

## R12. Menú, Mi perfil y las seis listas

**Decisión**:

- `AccountMenu`: con sesión llama `adminPendingTotal()`; si no es `null`, suma «Administrar» (un
  `NavLink` a `/administrar?desde=menu`, sin precarga) con el número entre paréntesis (`badgeCount`:
  0 sin número, más de 99 «99+»). En el teléfono, para quien administra, «Opinar» deja el renglón del
  nombre y forma par con «Administrar» en el último renglón, así ningún enlace queda solo
  (docs/10 `AccountMenu`). La etiqueta accesible dice el número en palabras («Administrar, 5
  pendientes»).
- `IdentitySection`: un solo `ReviewQueueLink` «Administrar (5)» a `/administrar?desde=perfil` en
  lugar de los seis; sin número si la cuenta falla o es 0.
- Las seis listas: `AdminBackLink` («Volver a Administrar», `TextLink` `block`) arriba del título, en
  todos los estados, y el vacío de `WorkQueue`/`ReviewQueueList` vuelve a Administrar. Lo que en las
  pantallas de revisión llevaba a Mi perfil (`profileHref` de `ReviewDecision`) lleva a Administrar.
- Los nombres en Pedidos de identidad, Publicaciones por revisar, Reportes (de quien reportó y de la
  reportada) y Cuentas suspendidas son `TextLink` a la ficha con `?desde=`. Un reporte sobre quien mira
  o «una cuenta borrada» no lleva enlace.

## R13. Sin dependencias nuevas

Ninguna librería ni extensión de base nueva. `pg_cron` y `pg_net` ya están (docs/07, 2026-09-26).
