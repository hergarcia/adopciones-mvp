# Research: Aval entre personas y perfil público

Cada decisión con su motivo y lo que se descartó. Las referencias `FR-`, `SC-` y `US` son de
[spec.md](./spec.md).

## R1 · El enlace del perfil: un id público al azar, aparte del id de la cuenta

- **Decisión:** `profiles.public_id`, texto de 22 caracteres base64url sacados de 16 bytes al azar
  (`gen_random_bytes(16)`, 128 bits), único, con default en la base y nunca editable. La ruta es
  `/perfil/<public_id>`.
- **Por qué:** FR-008 pide que no se pueda adivinar ni recorrer, que no cambie al editar, y que el
  de una cuenta borrada no pase nunca a otra persona. 128 bits al azar cumplen las tres cosas: no hay
  orden que recorrer, no depende del nombre, y la fila se va con la cuenta. El id de la cuenta
  (`auth.users.id`) no se expone: es la clave de todo lo privado (carpetas de Storage, filas de
  RLS) y mostrarlo en un enlace público lo volvería un dato que circula.
- **Descartado:** el `uuid` de la cuenta (lo anterior); un slug con el nombre (cambia al editar,
  delata el nombre en la vista previa aunque la cuenta no exista, y habría que desambiguar
  homónimos); un id corto de 6-8 caracteres, más lindo para WhatsApp (a 1000 pedidos por segundo se
  recorre en horas: el adversario de la spec pidió un número y la spec lo fijó como «a cualquier
  ritmo posible»).

## R2 · Quién lee qué: dos funciones de la base como única puerta a lo ajeno

- **Decisión:** `profiles`, `identity_verifications` y `phones` siguen cerradas por RLS a su dueña,
  y las tablas nuevas de avales no se leen desde el cliente (data-model). Lo que cualquiera ve de otra persona
  sale de **una** función, `public_profile(p_public_id, p_pending_ttl)`, `security definer`, que
  devuelve exactamente la lista de FR-005 y nada más: nombre, si tiene foto, departamento,
  localidad, rescatista, mes de alta, `level_one`, mes de la identidad **solo si** `level_one`, y
  la lista de quienes avalan **solo** con los avales que cuentan. Lo que cada parte ve de sus avales
  sale de `my_vouches(p_user, p_pending_ttl)`. Las dos se ejecutan solo con la clave de servicio,
  desde `lib/supabase/queries/`, como `publish_pet` y compañía.
- **Por qué:** la constitución (§V) pide que la visibilidad viva en la base y se pruebe con un
  intento que falla. Abrir `profiles` a `anon` con una policy expondría también `avatar_path`,
  `created_at` con la hora exacta y cualquier columna que se sume después; una vista `security
  invoker` no puede leer lo ajeno, y una `security definer` es una función con otro nombre, sin
  parámetros. La función recorta en la base lo que sale: el día exacto de alta y de verificación no
  salen nunca (se truncan al mes adentro), el motivo de no tener nivel no sale (sin `level_one` no
  sale la identidad), y los avales en pausa no salen. El test de privacidad llama a la función y
  comprueba que esas claves no existen en la fila, además de que `anon` y `authenticated` no pueden
  ejecutarla ni leer las tablas.
- **El nivel lo calcula TypeScript, no la base.** La función devuelve hechos (`level_one`, el mes de
  la identidad, cuántos avales cuentan) y `verificationLevel` —que ya existe y suma el 3— arma el
  nivel. Así «Mi perfil», la verificación aprobada y el perfil público usan la misma escalera
  (FR-003, SC-005), y la regla de «cuenta» (las dos partes con nivel 2) vive una sola vez, en SQL,
  en `private.has_level_two(user, ttl)`.
- **Descartado:** calcular el nivel entero en SQL (dos escaleras que pueden divergir, una en SQL y
  otra en `level.ts`); leer las tablas con la clave de servicio desde la query y recortar en
  TypeScript (el recorte es la regla de privacidad y tiene que vivir en la base, con su test).

## R3 · Un aval: una fila por par, una quita: otra fila por par

- **Decisión:** `vouches (voucher_id, vouchee_id, created_at)`, clave primaria el par, `check
  (voucher_id <> vouchee_id)`, las dos referencias a `auth.users` con `on delete cascade`, índice
  por `vouchee_id` (la clave primaria ya cubre `voucher_id`). `vouch_blocks (voucher_id,
  vouchee_id)`, clave primaria el par, mismas referencias en cascada: es la quita (FR-018), sin
  fecha, porque la spec dice que guarda solo quién y a quién. Retirar borra la fila de `vouches`;
  quitar la borra e inserta en `vouch_blocks`.
- **«Vigente» y «cuenta» no se guardan.** Vigente es «la fila existe». Cuenta se calcula al leer con
  `has_level_two` de las dos partes (FR-002): perder y recuperar el nivel no escribe nada, así que
  no hay nada que sincronizar ni que se pueda quedar atrás.
- **Por qué:** la clave primaria del par hace imposible dos avales vigentes de la misma persona a la
  misma (FR-013) sin código. La cascada cumple FR-027 sin tarea: borrar la cuenta borra lo dado, lo
  recibido y las quitas en las dos direcciones.
- **Descartado:** un estado en la fila (`active`/`withdrawn`/`removed`): guardaría los retirados,
  que la spec dice que se borran (Key Entities), y cada lectura tendría que filtrarlos.

## R4 · Dar, retirar y quitar: funciones con candado del par

- **Decisión:** `give_vouch(p_voucher, p_vouchee_public_id, p_pending_ttl)`,
  `withdraw_vouch(p_voucher, p_vouchee_public_id)` y `remove_vouch(p_vouchee, p_voucher_public_id)`,
  `security definer`, `set search_path = ''`, ejecutables solo con servicio. Cada una toma
  `pg_advisory_xact_lock` sobre el par **ordenado** (`least`/`greatest` de los dos ids), así
  «A avala a B» y «B avala a A» al mismo tiempo se hacen de a una, y la segunda ve la primera y
  sale con `reciprocal` (FR-013, SC-004); después, el candado de quien recibe, para que el paso a
  nivel 3 se registre una vez aunque dos personas la avalen a la vez. Siempre en ese orden: par,
  después persona. `give_vouch` comprueba, en este orden: el perfil existe
  (`not_found`), no es uno mismo (`self`), el aval ya existe (`given`, éxito idempotente: doble toque
  y reintento, FR-014), el otro avala a quien da (`reciprocal`), hay una quita (`blocked`), quien
  recibe tiene nivel 2 (`vouchee_level`), quien da tiene nivel 2 (`voucher_level`); inserta, y
  devuelve además si el que recibe pasó de 2 a 3 (no tenía ningún aval que contara) para el evento
  `level_three_reached` (FR-028). `withdraw_vouch` devuelve `withdrawn` o `absent`.
  `remove_vouch` borra el aval si está e **inserta la quita siempre** (`on conflict do nothing`),
  aunque quien lo dio lo haya retirado un instante antes (FR-018): devuelve `removed` o `absent`.
- **El orden de las comprobaciones de `give_vouch` es el de FR-011**, para que la pantalla que se
  actualiza con el motivo diga lo mismo que habría dicho al abrir el perfil.
- **Por qué:** es el patrón del repo (`phones`, `identity`, `pets`): lo que tiene consecuencias se
  decide en una transacción con candado, porque en la aplicación dos pedidos en paralelo pasan los
  dos el chequeo antes de escribir. El TTL del número a medias llega como parámetro desde
  `lib/verification/rules.ts`, que sigue siendo su única fuente.
- **Descartado:** un `unique` sobre el par desordenado para prohibir el cruce (prohibiría también
  el caso válido de que B avale a A después de que A retiró); un trigger (las reglas de nivel
  necesitan el TTL, que un trigger no recibe).

## R5 · Una regla de contacto para el perfil y la ficha

- **Decisión:** `lib/contact/pet-contact.ts` pasa a `lib/contact/contact-match.ts` con
  `contactMatch` (la función de hoy, renombrada) y `hasStreetNumber`; la ficha y el perfil la
  importan. `contactKind` y sus tres regex de `lib/schemas/profile.ts` se borran. El schema del
  perfil pasa al formato de error de la ficha, `FieldError { key, values?: { fragment } }`, para
  citar el fragmento (FR-020): `profile.errors.contact_<kind>` y `profile.errors.
  locality_street_number`, con textos propios del perfil («Encontramos «…», que parece un
  teléfono. El contacto se da recién cuando se acepta una solicitud.»). En la localidad, la de
  contacto va antes que la del número de puerta, como en la ficha (FR-020).
- **Paridad probada:** un test de tabla recorre los casos de contacto de `pet-contact.test.ts` (que
  pasa a `contact-match.test.ts`) que entran en el largo del campo del perfil, contra
  `validateProfile` y `validatePet`, y exige el mismo tipo y el mismo fragmento campo por campo
  (SC-003).
- **Por qué:** «una sola regla» (decisión 2026-09-28) es literalmente una función. Dos copias
  divergen en la primera corrección.
- **Descartado:** dejar `pet-contact.ts` y hacer que el perfil lo importe (un archivo con nombre de
  mascota que usan los perfiles es una mentira en el árbol).

## R6 · Lo que ve quien mira: una función pura que decide el lugar de avalar

- **Decisión:** `lib/vouches/vouch-slot.ts` con `vouchSlot(input)` que devuelve una de
  `none | sign_in | vouching | vouching_paused | reciprocal | blocked | cannot_receive |
  needs_level_two | can_vouch`, en el orden exacto de FR-011; `needs_level_two` lleva el paso que
  falta, que decide `nextStepToLevelTwo(viewer)` en `lib/vouches/next-step.ts`: `complete_profile`
  | `verify_phone` (con `restoresLevelTwo` si ya tiene la identidad aprobada: «con el teléfono
  volvés a nivel 2») | `verify_identity` | `identity_in_review`. La misma función decide el paso
  del vacío de «Mis avales» (US4.5). En `lib/vouches/my-vouches.ts`, `pauseMark(row)` decide la marca de pausa
  de «Mis avales» (`null` | `mine` | `theirs` | `both`) y `countingReceived(rows)` el número de «te
  avalan N» y el nivel 3 propio. La entrada son hechos: si quien mira es la dueña, si hay sesión, el nivel y el pedido
  de identidad de quien mira, el nivel 2 de la mirada, y la relación entre los dos (que trae la
  query `getVouchStanding`). La pantalla solo traduce el resultado.
- **Por qué:** es la regla de negocio más ramificada de la historia, engaña a una persona si se
  rompe (docs/09 §Qué vale la pena testear) y es pura: se prueba entera sin base, al 100 % de
  mutantes. `give_vouch` repite las comprobaciones de escritura en la base, que es donde valen.

## R7 · La foto del perfil público: una ruta propia, sin el id de la cuenta

- **Decisión:** el bucket `avatars` sigue privado. La foto de un perfil público se sirve en
  `/perfil/<public_id>/foto`, un Route Handler que pide la ruta a `avatar_path_for(public_id)`
  (solo devuelve algo para un perfil completo con foto), la baja con la clave de servicio y la
  devuelve como `image/webp` con `Cache-Control: private, max-age=300`; sin foto o sin perfil, 404.
  La usan el perfil público y las filas de «Mis avales». En la lista de quienes avalan del perfil
  público van solo los nombres (la lista es texto; R11 de diseño).
- **Por qué:** la foto es pública solo en el perfil (FR-005). Firmar la ruta de Storage pondría
  `<uuid de la cuenta>/avatar.webp` en el HTML público, y R1 dice que ese id no circula. Hacer
  público el bucket haría pública también la foto de quien todavía no completó el perfil, en una
  dirección adivinable. Cinco minutos de caché, `private` para que ninguna caché compartida la guarde después de borrar la cuenta (FR-027): al borrar o cambiar la foto, la vieja puede
  seguir en el navegador de quien ya la vio hasta cinco minutos, y el perfil no pide la foto a
  Storage en cada visita.
- **Descartado:** firmar con servicio (lo anterior: expone el uuid); bucket público.

## R8 · El mes y el año, recortados en la base

- **Decisión:** `public_profile` devuelve `member_since` y `identity_since` como el primer día del
  mes (`date_trunc('month', … at time zone 'America/Montevideo')::date`). El formato («agosto de
  2026») lo hace `lib/profile/month-year.ts` con `Intl.DateTimeFormat('es-UY', { month: 'long',
  year: 'numeric', timeZone: 'UTC' })` sobre ese día, que ya es de Uruguay.
- **Por qué:** FR-005 prohíbe el día exacto también «escondido en la página»: si la base devuelve la
  fecha entera y la página la recorta, el día viaja hasta el servidor de la página y a un test que
  mira la respuesta de la base no le alcanza. El borde de mes en hora de Uruguay (Edge Cases) se
  resuelve una vez, en SQL, como `uruguay_today()`.

## R9 · «Este perfil no existe»: un solo `notFound()` para los tres casos, sin streaming

- **Decisión:** `public_profile` devuelve cero filas para un id que no existe, una cuenta borrada o
  un perfil sin completar —los tres son «no hay fila en `profiles`»; un perfil sin completar no
  tiene fila, porque el alta la crea al guardar—. La página llama a `notFound()` y
  `(public)/perfil/[id]/not-found.tsx` dibuja `ProfileNotFound`. Un id que no pasa `isPublicId`
  (`lib/profile/public-paths.ts`: 22 caracteres de `A-Z a-z 0-9 - _`) no llega a la base y cae en el
  mismo `notFound()`. `generateMetadata` usa el mismo título para los tres (FR-009).
- **Sin `loading.tsx` en `/perfil/[id]`.** Con un límite de Suspense, Next manda primero el
  esqueleto y el contenido después, escondido, con un script que lo muestra: sin JavaScript se vería
  el esqueleto para siempre, y FR-010 pide leer el perfil sin scripts. Además, con streaming el
  estado de la respuesta ya salió cuando corre `notFound()`. Sin el límite, la página es una sola
  respuesta del servidor (una consulta, más la relación si hay sesión), con 404 en los tres casos
  de no existe. El cargando es el de la navegación del navegador; se acepta como lectura de la spec
  («Pantallas», perfil público, cargando) y queda en Assumptions del plan.
- **Test:** e2e con los tres casos, el mismo estado y el mismo HTML una vez quitados los nonces y
  los ids de build (SC-002); y el perfil abierto con `javaScriptEnabled: false` mostrando todo lo
  de FR-005 (FR-010).

## R10 · De dónde llega una vista: el `Referer`, y sin contar vistas previas

- **Decisión:** la página del perfil público registra `public_profile_viewed` al dibujarse en el
  servidor, con `origin: 'site'` si el `Referer` es del mismo sitio y `'link'` en cualquier otro
  caso (vacío incluido: WhatsApp y los favoritos no mandan). No registra si quien mira es la dueña,
  ni si el `User-Agent` es de una vista previa (`lib/analytics/link-preview.ts`, lista cerrada:
  WhatsApp, facebookexternalhit, Facebot, TelegramBot, Twitterbot, Slackbot, Discordbot,
  LinkedInBot, Googlebot). Los enlaces a perfiles dentro del sitio llevan `prefetch={false}`, para
  que traer la página por adelantado no cuente como vista.
- **Por qué:** FR-028 no quiere contar a la dueña ni a una aplicación armando la vista previa, y la
  única señal que no agrega JavaScript es la del pedido. Un parámetro en la URL para marcar «desde
  el sitio» ensuciaría el enlace que la persona copia.
- **Descartado:** un beacon de cliente (JS en la pantalla más pública de la historia, para lo mismo).

## R11 · La chapita: SVG en un Server Component, con los grises de metal como tokens

- **Decisión:** `VerificationBadge` (fila existente de docs/10) es un SVG inline sin JavaScript: la
  argolla arriba, el disco con su aro de metal y el borde de tinta. Nivel 1, disco de papel con
  contorno yerba; nivel 2, disco yerba con el tilde; nivel 3, disco yerba con el tilde y un anillo
  grabado adentro del aro. El brillo de la primera aparición es una animación CSS de una pasada,
  apagada con `prefers-reduced-motion`. Los dos grises de metal de la referencia (`#98A19C` la
  argolla, `#D5DAD7` el aro) entran como tokens `--color-metal` y `--color-metal-light` en docs/10 y
  `globals.css` en el mismo PR (docs/10 §Cómo se aplica: los grises esperaban a esta historia), con
  su fila en §Color y el test de paridad de tokens.
- **Qué se dibuja por nivel es una función pura:** `badgeParts(level)` en `lib/verification/
  badge-parts.ts` devuelve el relleno (`paper` | `primary`), si lleva tilde, si lleva el anillo
  grabado y la clave de la etiqueta accesible; el componente solo pinta eso. Tiene test por nivel
  (docs/08 §Calidad y docs/09 nombran «`VerificationBadge` según nivel»).
- **Tocarla abre la explicación, en las tres pantallas** (FR-024): la chapita va envuelta en un
  enlace a `/niveles?nivel=N&desde=<ruta actual>` (`levelsPath` en `lib/profile/public-paths.ts`), con
  `prefetch={false}` —la página registra `levels_explained` al dibujarse— y su etiqueta accesible
  («Verificado, nivel 2. Qué significa»). Sin JavaScript funciona igual.
- **El brillo corre una vez y en una sola chapita**: la `lg`, la del perfil público y la de la
  verificación aprobada. Las `md` no brillan (docs/10 §Principios 4: un único momento).
- **Descartado:** un popover sobre la chapita (JS, y en 390 px tapa el perfil que se está leyendo);
  la explicación como `Sheet` (JS y sin enlace para compartir).

## R12 · La explicación de los niveles es una página pública

- **Decisión:** `(public)/niveles/page.tsx`, Server Component estático salvo el evento. Recibe
  `?nivel=1|2|3` para destacar uno y `?desde=<ruta>` para «Volver» (pasada por `safeDestination`).
  Registra `levels_explained` al dibujarse. `robots: noindex` hasta M5, como el perfil.
- **Por qué:** FR-024 la abre sin ingresar, desde tres pantallas; una página con dirección sirve a
  las tres sin JS, y es el contenido que docs/08 §Encontrable llama «contenido que responde
  preguntas» para cuando se prenda la indexación.

## R13 · Copiar el enlace

- **Decisión:** `CopyProfileLink`, hoja cliente: `navigator.clipboard.writeText` con el enlace
  absoluto (`APP_URL` + `/perfil/<id>`); si falla o no existe, muestra el enlace en un `Input`
  de solo lectura, seleccionado, para copiar a mano (FR-022). Al copiar, llama a la acción
  `trackProfileMoment('profile_link_copied')`. Se usa en «Mi perfil» y en el vacío de «Mis avales».
- **Por qué:** es la única interacción de cliente del perfil propio; el resto es servidor.

## R14 · Volver al perfil después de ingresar o de verificar el teléfono

- **Decisión:** «Avalar» sin sesión es un `LinkButton` a `signInWithNext('/perfil/<id>')`; el flujo
  de la historia #9 ya vuelve a ese destino (y pasa por completar el perfil si hace falta).
  «Verificar mi teléfono» desde el lugar de avalar usa la puerta de la historia #10
  (`lib/verification/gate.ts`) con un motivo nuevo, `vouch` (slug `avalar`), y `next` en el
  perfil: el encabezado de «Verificar teléfono» dice «Para avalar, verificá tu teléfono» y al
  terminar vuelve al perfil. «Verificar mi identidad» es un enlace a `/verificar-identidad` sin
  vuelta (spec §Assumptions: la revisión tarda días).
- **Por qué:** FR-016 y FR-011.7 piden la vuelta, y los dos caminos ya la tienen: se reusan, no se
  reimplementan.

## R15 · Qué se registra y cómo

- **Decisión:** ocho momentos nuevos en `lib/analytics/events.ts`: `public_profile_viewed`
  (`{ origin: 'link' | 'site' }`), `profile_link_copied`, `vouch_given`, `vouch_withdrawn`,
  `vouch_removed`, `level_three_reached`, `levels_explained`, `profile_contact_rejected` (`{ field:
  'displayName' | 'locality', kind }`). Ninguno lleva ids ni texto. `level_three_reached` lo dispara
  `giveVouch` cuando `give_vouch` dice que el que recibe pasó de 2 a 3. El rechazo por contacto del
  perfil se registra como el de la ficha: en la acción y desde el formulario (`trackProfileMoment`).
- **Por qué:** es el patrón de `pet_contact_rejected`, y FR-028 pide exactamente estos momentos.

## R16 · Cuando avalar, retirar o quitar no llega

- **Decisión:** `lib/vouches/vouch-failure.ts`, `classifyVouchOutcome({ rejected, online,
  timedOut, result })` → `ok` | `offline` | `no_response` | `session` | `reason` (un motivo de
  FR-013), con test. El plazo es `SAVE_DEADLINE_MS` (30 s) de `lib/profile/save-failure.ts`, que se
  importa: una acción sin fotos no necesita los 2 minutos de la ficha. Claves
  `vouches.errors.offline` y `vouches.errors.no_response` (FR-014), dentro del `Sheet` o del
  `Dialog` con `ErrorText`; reintentar es tocar de nuevo el mismo botón.
- **El aviso de lo que salió bien** lo monta la página que se vuelve a dibujar: la hoja cliente
  hace `router.replace` con `?aval=dado|retirado|quitado|ausente` y `VouchNotice` (capa app, en
  `app/[locale]/_components/`) lee la marca y monta `ScreenToast` con un texto sin nombres («Ya
  avalás a esta persona», «Retiraste tu aval», «Quitaste el aval», «Ese aval ya no estaba»), como
  `ReviewNotice`. `ScreenToast` se muda de `(app)/_components/` a `app/[locale]/_components/`,
  porque ahora lo monta también la zona pública. `aval` se suma a las marcas que `SavedToast` saca de
  la dirección, y un motivo de FR-013 vuelve con `?aval=cambio`, sin aviso; la página no registra una
  vista cuando la dirección trae `aval` (R10).
- **Descartado:** montar `Toast` desde la hoja cliente (duplicaría el aviso que la pantalla ya sabe
  dar con la marca, y se perdería al refrescar).

## R17 · El seed

- **Decisión:** `public_id` fijos para las personas de hoy (Ana nivel 1, Lucía y Marta nivel 0) y
  cuatro nuevas en `@example.test`: **Carla** (nivel 3, avalada por Beto), **Beto** (nivel 2),
  **Dani** (nivel 2, sin avales dados ni recibidos: la que avala en las capturas y el e2e), y
  **Eva** (nivel 3 con 50 avales, para SC-006). Los 50 que avalan a Eva se generan con
  `generate_series`: `aval-01@example.test` … `aval-50@example.test`, con perfil, teléfono
  verificado (`+598991000NN`) e identidad verificada, sin pedidos en revisión —la cola de revisión
  de Lucía no cambia— y sin contraseña, así `walk --user` no los ofrece.
- **Por qué:** cada estado del perfil público se ve sin fabricarlo, y el e2e y la medición de SC-006
  tienen rutas estables.
