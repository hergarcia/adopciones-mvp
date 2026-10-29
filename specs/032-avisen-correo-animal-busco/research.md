# Research: Que me avisen por correo cuando se publique un animal como el que busco

Decisiones de diseño de la historia #265. Cada una dice qué se eligió, por qué y qué se descartó.
Skills previstos en el build: `supabase:supabase-postgres-best-practices` antes de la migración y
sus pruebas, `supabase:supabase` para la sesión en la vuelta de entrar, `frontend-design` con
docs/10 antes del JSX, `sin-slop` para cada texto, `vercel:react-best-practices` al cerrar cada US.
En esta corrida de la etapa Spec no estaban disponibles; el plan se apoyó en docs/10, docs/07 y el
código de `main`.

## R1 — La primera aparición: un dato nuevo de cada animal y cada camada

- **Decisión**: `pets.first_listed_at` y `litters.first_listed_at` (`timestamptz`, nulos hasta que
  se ven). Los pone una sola función, `private.stamp_first_listed()`, que marca con `now()` todo lo
  que hoy se ve en el listado y todavía no tiene marca, con las mismas condiciones que
  `listed_pets` (animal suelto disponible o en proceso, sin baja, sin vencer, con portada, de alguien
  con `private.pet_is_listed`; camada con `private.litter_is_shown` y `private.litter_state =
  'available'`, con portada). Una marca puesta no se toca nunca más. Corre en tres lugares: en el
  trabajo `pet-lifecycle` de `pg_cron`, cada 5 minutos (se cambia su comando con `cron.alter_job`
  para llamar primero a la marca: la lista `TASKS` no cambia); al empezar `create_pet_alert`, antes de
  insertar el aviso; y al empezar la corrida de las 8.
- **Por qué**: `published_at` cambia al renovar (`v_republish`), así que no sirve para «la primera
  vez». Marcar al crear el aviso, en la misma transacción y con el mismo `now()`, hace que todo lo
  que estaba a la vista cuando la persona creó el aviso tenga una marca igual o anterior a su
  creación: con la comparación estricta (`first_listed_at > created_at`) nunca llega como nuevo (el
  caso de Tobi a las 10 y el aviso a las 11). La vuelta de 5 minutos marca lo que se publica,
  vuelve de la revisión o aparece porque quien publicó confirmó el teléfono, antes de que pueda
  pausarse: así un animal publicado de noche y pausado a las 7 ya tiene marca, y al reanudarse la
  semana siguiente no es nuevo.
- **Datos que ya existen**: la migración pone `first_listed_at = published_at` a todos los animales
  sueltos y camadas que ya existen, estén o no a la vista. Ningún aviso existe antes de la migración,
  así que ninguna marca vieja puede ser «nueva» para nadie; y lo pausado hoy que se reanude después
  no aparece como nuevo.
- **Descartado**: un disparador en `pets` y `litters` (no ve los cambios de la cuenta de quien
  publicó: confirmar el teléfono, levantar una suspensión); marcar solo a las 8 (un animal publicado
  de noche y pausado a las 7 quedaría sin marca y llegaría al reanudarse); un trabajo de `pg_cron`
  nuevo (suma una tarea a `TASKS` y a la vigilancia para algo que ya cabe en `pet-lifecycle`).

## R2 — Hasta cuándo está cubierto un aviso

- **Decisión**: `pet_alerts.covered_until` (`timestamptz`, al crear igual a `created_at`). Lo nuevo
  para un aviso en una corrida es lo que tiene `first_listed_at > covered_until` y
  `first_listed_at <= ` el momento de la corrida. La corrida avanza `covered_until` de **todos** los
  avisos de la persona hasta su momento cuando: no había nada para mandar, la cuenta está
  suspendida, o el correo salió (`mark_pet_alerts_mailed`, que llama la ruta después de que Resend lo
  aceptó). Si el correo no salió, no avanza.
- **Por qué**: es la regla que cumple a la vez «si un día no hay nada nuevo, no sale correo», «si un
  correo no salió, el siguiente trae todo desde el último que llegó» y el caso borde de Tobi
  pausado a las 7: si el período solo se cerrara con un correo, un animal nuevo pausado a las 8
  volvería a mirarse al día siguiente y llegaría al reanudarse. Cerrar el período en cada corrida
  que cubre a la persona hace que nada se mire dos veces, y que lo que quedó fuera de los 6 no
  vuelva.
- **Un correo por día**: `pet_alert_sends (user_id, day)`, como `admin_digest_sends`. La corrida
  reclama a la persona con un `insert … on conflict do nothing`; dos corridas el mismo día no mandan
  dos correos. Se guardan 7 días (los borra la misma corrida).
- **Descartado**: guardar solo el día (la creación a las 11 y la marca de las 10 del mismo día
  serían indistinguibles); un `last_mailed_on` que solo avance con un correo (rompe el caso de Tobi).

## R3 — Qué coincide y se puede solicitar: la misma regla que el listado

- **Decisión**: `public.claim_pet_alert_mail()` (solo `service_role`) recorre los avisos de cada
  persona reclamada y, por aviso, llama a `public.listed_pets` con sus filtros y `p_limit => 241`,
  como ya hace `suggested_pets`. A cada fila le suma, uniendo por `code`, la dueña y
  `first_listed_at`, y saca: lo de la persona, lo de alguien con un bloqueo en cualquier dirección
  (`public.blocks` en los dos sentidos) y lo que no está en la ventana de R2. Devuelve, por persona,
  cada aviso con sus coincidencias (sin cortar ni deduplicar) y el momento de la corrida.
- **Por qué**: «lo que se puede solicitar a la hora de mandar» es lo que el listado muestra en ese
  momento; una sola función de visibilidad hace que una regla del listado que cambie mañana cambie
  también en el correo (research R1 de #238). `listed_pets` filtra los bloqueos con `auth.uid()`, que
  en la corrida es nulo: por eso el filtro de bloqueos en las dos direcciones se hace afuera, y
  también el de lo propio.
- **La edad**: el aviso guarda los tramos por nombre (`puppy`, `young`, `adult`, `senior`), como el
  listado en la dirección. `private.age_band_range(text)` da el `int4range` de cada tramo; una prueba
  de base lo compara con `AGE_BANDS` de `lib/pets/rules.ts`.
- **El tope de 241**: es el de `listed_pets` y alcanza para la beta (3-5 rescatistas). Lo nuevo casi
  siempre tiene `published_at` reciente y queda primero; si algún día el listado pasa de 241 por
  aviso, se cambia junto con `suggested_pets`.
- **Descartado**: una consulta propia con las condiciones copiadas (dos reglas de qué se ve);
  filtrar en TypeScript con el cliente de servicio (los bloqueos y lo propio serían otra puerta a la
  base fuera de `queries/`).

## R4 — Repartir en partes: una función pura

- **Decisión**: `alertMailParts(alerts)` en `lib/alerts/mail-parts.ts`: recibe los avisos en
  orden de creación con sus coincidencias, asigna cada animal o camada al primer aviso que lo trae,
  ordena cada parte por `first_listed_at` descendente (y `code` para desempatar), corta en 6 y
  descarta las partes vacías. Si no queda ninguna parte, no hay correo.
- **Por qué**: es la regla con más casos borde (repetidos, tope, orden, partes vacías) y como
  función pura se prueba entera con Stryker al 100 %. Un animal que en su primer aviso queda fuera de
  los 6 no pasa al segundo: pertenece al primero (spec §Edge Cases).

## R5 — Una sola corrida, la del resumen

- **Decisión**: la ruta `/api/cron/resumen`, que ya llama el trabajo `admin-digest` de `pg_cron` a
  las 8 de Uruguay (`0 11 * * *` UTC), manda primero los resúmenes y después los correos de avisos
  (`sendPetAlertMails`). Cada parte va con su propio `catch` (`taskFailed`): si una falla, la otra
  corre igual. Los correos salen de a uno, espaciados 600 ms, como los resúmenes.
- **Por qué**: la historia pide la misma corrida diaria (docs/03 §6), y así no se suma una tarea
  vigilada ni una llamada de Vercel Cron, que en Hobby es una por día (docs/07).
- **Si la ruta se corta** (tiempo máximo de la función) con personas ya reclamadas sin mandar: su
  día queda gastado y su `covered_until` no avanza, así que el correo del día siguiente trae lo de
  los dos días. Con la beta (decenas de personas) no pasa: 100 correos son 60 s.
- **Descartado**: una ruta y un trabajo propios a la misma hora (otra tarea en `TASKS` y en la
  vigilancia para la misma vuelta).

## R6 — «Dejar de recibir»: un enlace por correo, guardado como hash

- **Decisión**: cada correo de avisos lleva un token nuevo de 32 bytes al azar (`base64url`). La
  base guarda solo su SHA-256 en `pet_alert_unsubscribe_links (token_hash, user_id, created_at)`,
  sin políticas: la leen y escriben funciones de `service_role`. `unsubscribe_pet_alerts(hash)` borra
  todos los avisos de esa cuenta y devuelve `done` con cuántos borró, o `unknown` si el hash no
  existe (alterado, de una cuenta borrada —la fila se fue en cascada— o de más de 180 días). Los
  enlaces de más de 180 días los borra la corrida de las 8.
- **Por qué**: es el patrón de «Sigue disponible» (`pet_renewal_links`, research R5 de #59): no se
  puede adivinar ni armar a partir de otro, y una fuga de la base no deja usar los enlaces. Un token
  por correo y no uno por persona porque solo se guarda el hash: no habría cómo volver a escribirlo
  en el correo siguiente. Los helpers de token (`newRenewalToken`, `hashRenewalToken`,
  `isRenewalToken`) pasan a `lib/links/link-token.ts` con nombres genéricos y `renewal-token.ts` los
  reusa (segunda repetición).
- **Descartado**: una firma HMAC con un secreto (pide una variable de entorno nueva en la nube y
  rotarla rompe todos los enlaces); un token por persona en claro (una fuga de la base daría todos
  los enlaces).

## R7 — Un toque sin que un lector de correo lo dispare

- **Decisión**: `/dejar-de-recibir/<token>` es una página del grupo `(open)` (con o sin sesión,
  también suspendida), `noindex`. El servidor solo mira que el token tenga forma y que exista
  (`pet_alert_unsubscribe_link_exists`, sin borrar nada). Si existe, la pantalla monta una hoja
  cliente, `UnsubscribeRunner`, que al montar llama a la acción `unsubscribePetAlerts(token)` y muestra
  «cortando» → confirmación, o el error con «Probar de nuevo». Sin JavaScript, la misma hoja dibuja
  un formulario con el botón «Dejar de recibir» que hace lo mismo. Además, cada correo lleva las
  cabeceras `List-Unsubscribe` (la dirección `POST /api/avisos/dejar?t=<token>`) y
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, así el botón del programa de correo también
  corta los avisos.
- **Por qué**: algunos lectores de correo corporativos abren los enlaces antes que la persona para
  revisarlos; si abrir la página borrara, el aviso se cortaría solo. Esos lectores no ejecutan
  JavaScript. Para una persona sigue siendo un solo toque (el del correo).
- **Lo que la pantalla no dice**: ni el correo, ni el nombre, ni los avisos. Con la sesión de otra
  persona abierta, la acción usa solo el token: nunca toca los avisos de la sesión.
- **Descartado**: borrar al abrir en el servidor (lo dispara un lector); una pantalla con un botón
  para confirmar (un segundo toque, contra la historia).

## R8 — Crear sin sesión: el pedido viaja con la vuelta

- **Decisión**: sin sesión, «Avisame cuando haya uno así» es un enlace a entrar con `next` igual al
  listado con sus filtros más `avisar=1`. Al volver con sesión, el listado ve `avisar=1` y monta
  `AlertOffer` en modo «crear al montar»: llama a la acción una vez, muestra el resultado y saca
  `avisar` de la dirección (la reescribe con la canónica `useListing`, con `history.replaceState`),
  sin sumar un paso atrás ni volver a pedir la página al servidor. El destino ya sobrevive al
  enlace por correo, a Google, a crear la cuenta y a completar el perfil (#9, #14).
- **Por qué**: crear en el servidor al dibujar el listado sería un efecto en un GET, que una vista
  previa o un prefetch podría disparar; en el cliente corre solo cuando la persona de verdad volvió.
  Si al volver ya lo tiene o tiene 3, ve lo mismo que con sesión (spec §Edge Cases).
- **`avisar`** no es un filtro: la página del listado lo separa de la consulta antes de comparar
  con la dirección canónica (hoy `isCanonicalListingQuery` redirige todo lo que no conoce, y se
  llevaría la marca), y si tiene que redirigir lo vuelve a sumar a la dirección canónica. No entra en
  la medición de filtros ni en la dirección que comparte nadie. La página lee la sesión
  (`getSessionUser`) para elegir entre el botón que crea y el enlace a entrar.

## R9 — El tope de 3 y los repetidos, también a la vez

- **Decisión**: `public.create_pet_alert(...)` (`security definer`, toma la cuenta de `auth.uid()`):
  normaliza los arreglos (sin repetidos, ordenados), toma `pg_advisory_xact_lock` por la cuenta,
  marca primeras apariciones (R1), y devuelve `duplicate` si hay un aviso con los mismos filtros,
  `limit` si ya hay 3, o `created`. Un índice único sobre la cuenta y los seis filtros normalizados
  respalda los repetidos. Juntar «todas las opciones» en «ninguna» lo hace el schema zod con la misma
  regla del listado (`chosen` de `listing-query.ts`), antes de llamar.
- **Reintento después de un corte en el que el aviso sí se creó**: devuelve `duplicate` y la persona
  ve que ya lo tiene, que es verdad. No queda un aviso repetido (FR-008).
- **Descartado**: una política de `insert` con el conteo en un `check` (no se puede contar en un
  `check`, y dos inserciones a la vez pasarían las dos).

## R10 — El nombre del aviso

- **Decisión**: `alertName(filters, words)` en `lib/alerts/alert-name.ts`, pura, arma la frase con
  piezas de `messages/es.json` (`alerts.name.*`): el sustantivo (especie en plural, «Animales» sin
  especie, o «Machos»/«Hembras» si hay sexo y no especie), después tamaños unidos con «o», tramos de
  edad unidos con «o», «castrados» y «en <departamento>». Con solo hembras, todo concuerda en
  femenino («Perras chicas o medianas en Montevideo»); con solo machos, como el masculino de siempre.
  Sin filtros: «Todos los animales en adopción». Las mismas palabras en «Mis avisos» y en el correo.
- **Por qué**: el texto lo pide la historia y lo lee la persona; las piezas en el catálogo, con la
  concordancia por género, permiten un segundo idioma sin tocar código.

## R11 — El correo

- **Decisión**: la plantilla única (`notice-email-template.ts`) suma `groups` a sus extras: por
  parte, el nombre del aviso como subtítulo, hasta 6 renglones (foto 96 px de ancho, nombre, «Perro,
  2 años» o «Camada de 5 crías», y la zona) que abren la ficha, y el enlace «Ver todos en el
  listado» con los filtros. La versión de texto lleva lo mismo en renglones. El botón del correo va
  al listado sin filtros; «Dejar de recibir» es el `secondary` al pie. `sendEmail` suma `headers`
  para R7.
- **Las fotos**: la imagen de compartir del animal o la camada (`petShareImagePath`,
  `litterShareImagePath` con la portada como versión), como el correo del compromiso: es pública
  mientras se ve en el listado y no vence como una firma.
- **Las direcciones**: la ficha con la marca `desde=aviso` (`LINK_MARKS.alert`), que da el origen
  propio de R12; el listado con los filtros del aviso por `listingHref(filters)`, la dirección canónica que ya existe.
- **Nada de nadie**: ni el nombre de quien publicó, ni su teléfono, ni su contacto (FR-023). La
  dirección es la de la cuenta (`getAccountEmail`); sin dirección no sale.

## R12 — La medición

- **Decisión**: tres momentos nuevos y un origen:
  - `pet_alert_created` con `filters` (cuántos filtros con alguna opción, 0-6) y `from_empty`
    (si el listado no tenía resultados). Lo dispara la acción al crear, no al repetido ni al tope.
  - `pet_alert_mail_sent` con `items` (cuántos animales y camadas trae, una camada es uno) y
    `parts`. Lo dispara la ruta por cada correo aceptado, con `visit: false` como el resumen.
  - `pet_alert_deleted` con `origin` = `profile` | `mail`. Uno por aviso borrado: «Borrar» es uno;
    «Dejar de recibir» suma uno por cada aviso que cortó. Borrar la cuenta no se cuenta.
  - El origen `alert` de `petViewOrigin`: la marca `desde=aviso` gana como las de compartir, venga
    de donde venga. Lo que sigue en esa visita ya se mide igual que en cualquier otra.
- **Nada de la persona ni de los filtros elegidos** (FR-041): solo cuántos.
- **docs/03 §Métricas de éxito** suma la lectura 7 (FR-042).

## R13 — Privacidad y visibilidad

- **Decisión**: `pet_alerts` con RLS: `select` y `delete` solo para `user_id = auth.uid()`; sin
  políticas de `insert` ni `update` (entra por R9 y cambia solo por la corrida). Quien administra no
  tiene política: no lee avisos. `pet_alert_sends` y `pet_alert_unsubscribe_links` con RLS y sin
  políticas. Las tres con `on delete cascade` a `auth.users`. Las funciones de la corrida y de
  «Dejar de recibir», solo para `service_role`.
- **Pruebas que intentan ver lo que no deben** (`tests/db/pet-alerts-privacy.test.ts`): un
  visitante, otra persona y quien administra no leen ni borran avisos ajenos; nadie con sesión lee
  las otras dos tablas ni llama a las funciones de servicio; borrar la cuenta borra avisos, envíos y
  enlaces.

## R14 — Qué se prueba y por qué (docs/09 §Qué vale la pena testear)

- **Unitarias con Stryker al 100 %**: `alertName` (concordancia, uniones, vacío), `alertMailParts`
  (repetidos, orden, tope, partes vacías), `normalizeAlertFilters` y el schema zod (todas = ninguna,
  repetidos, valores desconocidos, un departamento), los eventos
  (`alert-events.ts`), el origen `alert` en `visit-origin.test.ts`, `link-token`.
- **Base (`tests/db`)**: privacidad (R13); reglas: crear, repetido, tope con dos a la vez, marca de
  primera aparición (igual a la del listado, no cambia al pausar, renovar ni editar), la corrida
  (ventana, pausado antes de las 8, renovado, propio, bloqueos en las dos direcciones, suspendida,
  camada como una, correo que no salió, dos corridas el mismo día), «Dejar de recibir» (borra todo,
  dos veces, token desconocido, de cuenta borrada, vencido), `age_band_range` contra `AGE_BANDS`.
- **E2E (un flujo)**: sin sesión, filtrar, «Avisame…», entrar con el enlace del correo sembrado,
  volver con el aviso creado; verlo en «Mis avisos»; correr la ruta de las 8 con un animal nuevo y
  leer el correo en `.artifacts/mail/`; abrir su «Dejar de recibir» y ver «Mis avisos» vacío.
- **Nada** para las páginas, `ui/`, las queries finas ni los componentes que solo pintan.
