# Research: Publicar un animal con sus fotos y sus datos

Cada decisión con su motivo y lo que se descartó. Las que cambian `docs/` se registran ahí en el
mismo PR (plan §Docs que cambian).

## R1 — Cómo viajan las fotos: una por una, a una zona de espera

**Decisión:** cada foto preparada sube sola, en su propia Server Action (`uploadPetPhoto`), a
`pet-photos/{owner}/{photoId}/{thumb|card|full}.webp`, con una fila **en espera** en `pet_photos`
(sin `pet_id`). Publicar y guardar mandan solo los ids de las fotos en el orden de la pantalla, y la
función de la base las engancha a la publicación en la misma transacción que la crea.

**Motivo:** la spec pide ver «cuántas fotos van subidas de cuántas» (FR-018), reintentar sin
perder lo que ya subió (FR-021) y un guardado que se completa entero o no se hace (FR-015). Con
una acción por foto, el progreso es contar respuestas; un reintento vuelve a mandar solo las que
faltan, porque el `photoId` lo genera el cliente y la subida es idempotente (`upsert` del objeto,
`on conflict do nothing` de la fila); y la publicación se crea de una vez, con fotos que ya están
arriba. Las fotos que nunca se engancharon las borra la purga a las 24 horas (FR-020).

**Cuándo suben: al tocar «Publicar» o «Guardar».** Elegir una foto la prepara en el navegador y
nada más; al tocar la acción, `usePetSave` sube las que falten, de a una, y el progreso cuenta esas
subidas («Subiendo fotos: 2 de 3»). Así no quedan fotos en espera de alguien que solo estaba
mirando, el nivel 1 se comprueba en el momento de publicar, y sin conexión la primera falla es la
de la primera subida, que se clasifica `offline` (el e2e espera ese mensaje). Una foto preparada
que ya subió no vuelve a subir en el reintento.

**Si la base dice `photos_invalid`** (una foto en espera se purgó o se soltó en otra pestaña), el
formulario todavía tiene las fotos preparadas en memoria: las vuelve a subir con ids nuevos y
reintenta una vez, sin que la persona haga nada (FR-021). `publish_pet` y `save_pet` rechazan las
fotos en espera más viejas que el mismo TTL de la purga (`p_staged_ttl`, 24 horas): una foto no
puede estar a la vez para engancharse y para purgarse.

**Quién escribe en el almacenamiento: solo el servicio.** `uploadPetPhoto` primero anota la fila
con `stage_pet_photo` (que exige nivel 1) y después sube los tres objetos con la clave de servicio
y `upsert`. El bucket **no** tiene policy de `insert` ni de `update` para `authenticated`: con una
sesión, desde el navegador, no se puede escribir nada en `pet-photos`, ni siquiera en la carpeta
propia (tests/db lo prueba). Así no hay objetos sin fila que la purga y el borrado de la cuenta no
encuentren, ni subidas que se salteen el nivel 1. `authenticated` solo tiene `select` sobre su
carpeta, para firmar las URLs con su sesión. Antes de subir con la clave de servicio, la acción
comprueba también la firma del archivo (`RIFF….WEBP` en los primeros 12 bytes), no solo el tipo
que declara el navegador.

**Descartado:** (a) todo en una sola acción con las quince imágenes: sin progreso posible, y un
cuerpo de 2-3 MB que, cortado a la mitad, se reintenta entero; (b) subir desde el navegador directo
al almacenamiento: `lib/supabase/client.ts` no se usa fuera de `lib/supabase/` y el perfil ya
decidió que el navegador no habla con el almacenamiento (`actions/profile.ts`), así el tipo y el
tamaño se controlan del lado del servidor.

## R2 — El límite de cuerpo de las Server Actions: 2 MB

**Decisión:** `experimental.serverActions.bodySizeLimit: '2mb'` en `next.config.ts` (la clave
que documenta Next 16.3.5 en `node_modules/next/dist/docs`). Del lado del
cliente, una foto preparada (sus tres tamaños juntos) no pasa de 1,5 MB: si pasa, se vuelve a
exportar con menos calidad (0,82 → 0,72 → 0,62) y, si igual pasa, se rechaza con «no pudimos
preparar esta foto». Del lado del servidor, cada archivo ≤ 1 MB y la suma ≤ 1,5 MB, y el bucket
tiene `file_size_limit` de 1 MB.

**Motivo:** el default de Next es 1 MB (`node_modules/next/dist/docs/.../serverActions.md`). Un
WebP de 1600 px al 0,82 pesa entre 200 y 600 KB según la foto; los tres tamaños juntos rondan
300-800 KB. 2 MB deja lugar para el multipart sin abrir la puerta a cargas grandes.

## R3 — Procesado en el cliente: canvas, tres tamaños y ThumbHash

**Decisión:** `lib/pets/photo-processing.ts`, el mismo camino que `lib/profile/avatar-processing.ts`:
`createImageBitmap(file, { imageOrientation: 'from-image' })`, dibujar en un canvas y exportar a
WebP. Tres tamaños por el **lado largo**: `thumb` 400, `card` 800, `full` 1600 (docs/07
§Imágenes); una foto más chica no se agranda. El ThumbHash se calcula de una copia de 100 px del
lado largo con `rgbaToThumbHash` y se guarda en base64. El archivo se llama `{tamaño}.webp`: el
nombre original no sale del navegador (FR-008).

**La parte pura va aparte, con test:** `lib/pets/photo-sizing.ts` (como `squareCrop` en
`lib/profile/avatar.ts` junto a `avatar-processing.ts`): `targetSize(width, height, longSide)` —el
lado largo al tope, la proporción intacta, nunca agrandar—, `THUMBHASH_SIDE` y
`encodingPlan(bytesAt)` —probar 0,82, 0,72 y 0,62 en ese orden y quedarse con la primera calidad
cuyos tres tamaños juntos no pasen 1,5 MB, o rechazar—. `photo-processing.ts` queda como el
pegamento con el canvas, sin decisiones propias.

**La regla del archivo elegido** (formato y 10 MB) se comparte con el perfil por la regla de dos:
`lib/images/photo-file.ts` con `photoFileProblem(file)` → `type | too_big | null` y las listas
`ACCEPTED_PHOTO_TYPES` y `MAX_PHOTO_BYTES`, con test. `rejectionFor` del perfil pasa a traducir
ese problema a sus claves (`profile.errors.*`) sin cambiar lo que devuelve, y `acceptPhotoFile` de
los animales, a las suyas (`pets.errors.*`).

**Cómo se cuentan los caracteres.** «Cada letra, espacio o emoji cuenta como uno» (spec): el
schema y `CharacterCount` cuentan grafemas con `Intl.Segmenter` (`lib/pets/char-count.ts`, con
test, incluidas una bandera y una secuencia con ZWJ). El `check` de la base es un techo más
ancho —120 puntos de código para el nombre y 8000 para la descripción— porque un emoji compuesto
son varios puntos de código: la base frena abusos, el schema dice la regla.

**Motivo:** exportar desde un canvas no copia ningún metadato —ni GPS, ni cámara— y respeta la
orientación con `from-image`. Es lo que docs/08 §Encontrable manda y lo que ya se probó en el
perfil. El lado largo, y no el ancho, porque una foto apaisada de 1600 de ancho quedaría enana
en la vertical 4:5 de la card.

**Dependencia nueva:** `thumbhash` **0.1.1** (`npm view thumbhash version`, 2026-09-26: la última).
Es el paquete del autor del formato (Evan Wallace), sin dependencias, ~2 KB. Docs/07 ya lo anotaba
como «entra con la historia de publicar animales». `browser-image-compression` **no** entra: el
canvas alcanza, como en el perfil.

## R4 — Las fotos, privadas por ahora

**Decisión:** bucket `pet-photos` **privado**, con carpeta por dueña (`{owner}/…`), igual que
`avatars`. Las pantallas de esta historia las muestran con URLs firmadas **de 1 hora**
(`createSignedUrls`, una sola llamada por pantalla) en un `<img>` con `srcSet`, y el ThumbHash como
fondo mientras cargan. Las primeras 4 cards de «Mis animales» y la portada del formulario cargan de
entrada (`loading="eager"`); el resto, `lazy` (docs/07 §Imágenes). Una hora cubre una sesión de
trabajo: una card que entra en pantalla después, o un `srcSet` que elige otro tamaño al girar el
teléfono, todavía tiene su firma viva. El precio: la firma cambia en cada carga de la pantalla y el
navegador no reusa la foto entre visitas; en pantallas que ve solo su dueña, es aceptable. El
avatar mantiene sus 60 s: es una sola imagen, siempre arriba.

**Lo que una firma de una hora deja abierto:** una URL firmada es un enlace al portador. Si la
dueña copia la dirección de una foto y se la pasa a alguien, esa persona la ve durante esa hora.
FR-005 se cumple para quien **adivina o conoce** la dirección del objeto (sin firma no se baja);
compartir a propósito un enlace firmado es otra cosa, y vence solo. Se anota como supuesto.

**Motivo:** FR-005 dice que en esta historia nadie más ve la publicación, «ni siquiera conociendo
la dirección de una foto». Docs/07 §Imágenes dice «bucket público» para cuando las fichas sean
públicas; la historia siguiente decide si las fotos de una publicación **disponible** pasan a leerse
sin sesión (una policy nueva sobre el mismo bucket) o si se sirven firmadas. Empezar público «porque
después va a serlo» es lo que la migración del perfil ya descartó (`profiles_select_own`). Se anota
en docs/07 con fecha.

**`next/image` no:** con URLs firmadas que cambian en cada render, el optimizador guardaría una
copia por firma y no agrega nada a un WebP que ya viene del tamaño justo. Mismo criterio que
`Avatar`.

## R5 — Las escrituras: funciones de la base con permisos de servicio

**Decisión:** las tablas `pets` y `pet_photos` se leen con la sesión de la dueña (RLS `select`
propio) y **no se escriben desde el cliente** (`revoke insert, update, delete`). Toda escritura
pasa por funciones `security definer`, ejecutables solo por `service_role`, que la Server
Action llama con el id de la sesión: `stage_pet_photo`, `publish_pet`, `save_pet`,
`purge_pet_photos` y `delete_pet_photo_rows` (data-model.md). Cada una comprueba adentro, otra vez, el nivel 1 (`identity_level_one`, con el
`p_pending_ttl` de `lib/verification/rules.ts`, que sigue siendo la única fuente) y la propiedad.

**Motivo:** es el patrón de `phones` (historia #10): las reglas con consecuencias viven en la
base y los números llegan como parámetros. Publicar con fotos es varias escrituras que tienen que
ser una (FR-015, FR-019); dos toques y un reintento concurrentes tienen que chocar en la base
(FR-018), no en la aplicación. Una policy de `insert` con el chequeo de nivel 1 no alcanzaría:
necesitaría el TTL del número a medias escrito en SQL, que es una segunda fuente.

## R6 — Un intento publica una vez: `attempt_id` único por dueña

**Decisión:** el cliente genera un `attemptId` (UUID) al abrir publicar, uno por pestaña y por
carga (spec §Vocabulario). `pets` lleva `attempt_id` con `unique (owner_id, attempt_id)`.
`publish_pet` toma primero el candado de la cuenta (`pg_advisory_xact_lock` sobre el id, como
`lock_phone_account`), busca el intento y, si ya existe, devuelve esa publicación con
`already = true` **antes de cualquier otra comprobación** (FR-018). La acción hace lo mismo antes
del aviso de nombre repetido (FR-017).

**Motivo:** dos toques, un reintento o una respuesta perdida reusan el mismo `attemptId`; el
candado serializa los que llegan juntos y el `unique` es la red si algo se escapa. El `attemptId`
viaja en lo escrito guardado solo para reconocer, al recargar, que ese intento ya se publicó
(spec §Edge Cases), con `checkPetAttempt`.

**El orden de las comprobaciones es una regla con test.** `lib/pets/publish-steps.ts` decide, sin
tocar la base, qué responde `publishPet` a partir de lo que ya averiguó: `publishDecision({
attemptId, attemptPublished, isLevelOne, fieldErrors, sameSpeciesPets, name, confirmDuplicate })`
→ `already | needs_verification | invalid | duplicate_name | publish`. El intento publicado gana
sobre todo lo demás, después el nivel, después los campos, después el nombre. Y el nombre se
compara contra los animales de la misma especie **menos el del propio intento**
(`sameSpeciesPets` trae el `attemptId` de cada uno): si un reintento llega mientras la primera
llamada termina de guardar, la publicación de ese intento puede aparecer entre los nombres sin
que la comprobación del intento la haya visto todavía, y el aviso nunca puede ser por ella
(FR-017, FR-018). La acción averigua en ese mismo orden y deja de preguntar en cuanto la decisión
está tomada.

## R7 — La edad que avanza

**Decisión:** se guardan `age_value`, `age_unit` (`months` | `years`) y `age_as_of` (un `date`, el
día de Uruguay en que vale). `lib/pets/age.ts`:

- `monthsBetween(from, to)`: meses cumplidos, contando uno cada vez que se llega al mismo día del
  mes siguiente o, si ese mes no lo tiene, a su último día (FR-010).
- `ageOn(stored, today)`: suma esos meses a la edad guardada; por debajo de 12, meses; desde 12,
  años enteros hacia abajo.
- `resolveAgeOnSave({ base, shown, submitted, today })`: `base` es la edad guardada tal como
  estaba **al abrir** la pantalla (`value`, `unit`, `asOf`) y `shown` la que se mostró entonces,
  las dos llegan con el formulario. Si lo que se manda es igual a `shown`, devuelve `base` tal cual:
  sigue avanzando, no se vuelve a controlar el rango y el animal queda con la edad de esa pantalla,
  siempre que su `asOf` esté entre el día en que se publicó y hoy (si no, se toma la guardada),
  aunque otra pestaña la haya cambiado (FR-020a). Si no, lo nuevo con `asOf = today`, y el rango lo
  controla el schema. Comparar con lo que se mostró al abrir, y no con la edad calculada al
  guardar, es lo que evita que un aniversario entre abrir y guardar parezca un cambio (FR-010).
  Devuelve también `unchanged`. Una `base` con `asOf` fuera de ese intervalo se descarta y se toma
  la guardada en la base.
- Al publicar, `age_as_of` es `uruguayDay(new Date())` calculado en la acción, no el
  `current_date` de la base, que corre en UTC.

**El rango y la edad sin tocar.** El schema es uno para el formulario y la acción, así que el rango
se controla con un parámetro: `validatePet(input, { ageUnchanged })`. Con `ageUnchanged` (editar, y
lo mandado igual a lo mostrado) la edad solo tiene que ser un entero positivo con su unidad; sin él,
rige el rango de 1 a 11 meses o 1 a 25 años. El formulario sabe si la edad cambió porque tiene lo
que mostró; la acción lo sabe por `resolveAgeOnSave`. Los dos llaman a `validatePet` con lo mismo.
- `uruguayDay(now)`: el día calendario en `America/Montevideo`.

**Motivo:** guardar lo que la persona escribió y el día, y calcular al mostrar, es lo único que
avanza solo sin un proceso que actualice filas. Comparar valores y no «si tocó el campo» es lo que
la spec pide (FR-010). Lo que manda el cliente (la base y lo mostrado) es de la propia dueña y
queda acotado a una edad que el animal tuvo desde que se publicó; el rango de la base sigue
valiendo.

## R8 — La regla de contacto de los animales

**Decisión:** `lib/contact/pet-contact.ts` con `petContactMatch(text)` →
`{ kind: 'phone' | 'email' | 'web' | 'social', fragment } | null`, con las reglas de FR-014: 8+
dígitos con separadores (espacio, punto, guion, con espacios alrededor) salvo la forma de una fecha;
arroba entre letras; `http`/`www`; `.com|.uy|.net|.org` seguido de fin de palabra, barra o punto;
la lista cerrada `wa.me, t.me, bit.ly, tinyurl.com, linktr.ee`; arroba al principio de una palabra.
Devuelve el **fragmento** que disparó la regla, porque el error lo cita (FR-014). La localidad del
animal suma `hasStreetNumber` (3+ dígitos seguidos, FR-011).

`contactKind` del perfil (`lib/schemas/profile.ts`) **no cambia ni se mueve** (spec
§Assumptions): moverlo cambiaría qué test lo mata en Stryker. La regla de los animales vive en
`lib/contact/pet-contact.ts`, con su propio test.

**Cómo viaja el fragmento citado.** Un error de campo deja de ser solo una clave:
`FieldError = { key: string; values?: { fragment: string } }` (`lib/schemas/pet.ts`). El schema lo
arma con `ctx.addIssue({ message: key, params: { fragment } })` y `validatePet` lo devuelve por
campo; la acción lo devuelve igual en `detail.fields`; `PetForm` lo traduce con la plantilla cruda
del mensaje (`«{fragment}»`), como `verification-texts.ts` hace con los intentos, y `FieldShell`
recibe el texto ya armado.

## R9 — El aviso de nombre repetido

**Decisión:** `lib/pets/duplicate-name.ts` con `normalizePetName(name)`: minúsculas, sin espacios al
principio ni al final (los de adentro cuentan, como dice FR-017), tildes fuera con `normalize('NFD')` y
quitando solo los diacríticos combinantes **excepto** la tilde de la ñ (U+0303 sobre n), que se
conserva. `publishPet` trae los nombres de la misma especie de la dueña (`listMyPetNames`) y
compara. Con `confirmDuplicate = true` no compara.

**Motivo:** se compara en TypeScript, donde la regla tiene test y mutación; en SQL haría falta la
extensión `unaccent`, que además convierte la ñ en n.

## R10 — Lo escrito sin publicar

**Decisión:** `usePetDraft(accountId)` en `hooks/`, con el patrón de `useProfileDraft` (leer después
de montar, guardar lo que cambió). La clave es `pet-draft` y el valor
`{ v: 1, accountId, attemptId, startedAt, updatedAt, fields }`. La lógica pura —si vuelve, para qué
cuenta, si venció a los 30 días— vive en `lib/pets/draft.ts`, con test. Salir de la cuenta limpia
los dos borradores por una sola función, `clearAccountDrafts()` en `lib/drafts/account-drafts.ts`,
que es también donde pasan a vivir las dos claves (`profile-draft`, `pet-draft`): `hooks/`
importa de `lib/`, nunca al revés. `clearAccountDrafts` reemplaza a `clearProfileDraft` en
`SignOutForm`, `DeleteAccountDialog` y `SignInOtherAccountForm`.

`startedAt` es el del primer dato cargado en un formulario vacío y viaja con lo escrito: el momento
«publicación terminada» mide desde ahí aunque la carga haya cruzado una recarga (FR-028).

## R11 — Qué pasa cuando un guardado no llega

**Decisión:** `lib/pets/save-failure.ts` clasifica en `offline | site | session | level |
changed_elsewhere | not_found | photos_invalid | invalid | duplicate_name` con
`classifySaveOutcome({ rejected, online, timedOut, result })`: rechazada sin conexión → `offline`;
rechazada con conexión → `site`; `timedOut` → `site` aunque después llegue una respuesta (FR-018);
cada clave de `ActionResult` → su clase (`pets.errors.session` → `session`, y así). El hook
`usePetSave` solo mide el tiempo (un temporizador de 2 minutos, `SAVE_TIMEOUT_MS` de `rules.ts`,
que cuenta **la operación entera** —subir las fotos que falten y publicar o guardar—, desde que se
toca la acción) y
le pasa `timedOut` a la función pura: la regla vive donde tiene test. Reintentar vuelve a correr
todo: sube las fotos que falten y vuelve a mandar el formulario con el mismo `attemptId`.

## R12 — La medición

**Decisión:** `track(event, props?)` acepta propiedades planas (`string | number`). Cuatro momentos
nuevos en `lib/analytics/events.ts`: `pet_publish_started`, `pet_published` (`photos`, `seconds`,
`ordinal`: `1` | `2` | `3+`), `pet_edited`, `pet_contact_rejected` (`field`, `kind`). Los que nacen
en el cliente (empezada, y el rechazo que detecta el formulario antes de mandar) los dispara la
acción `trackPetMoment`, que acepta solo esos dos nombres. El rechazo que detecta la acción del
servidor se registra ahí. `pet_publish_started` **no** se dispara cuando el formulario arranca con
lo escrito recuperado: sale solo cuando se carga el primer dato o la primera foto en un formulario
vacío, y lo decide `lib/pets/draft.ts` (`shouldTrackStart`), con test (FR-028).

## R13 — Cuándo se purga

**Decisión:** `purgePetPhotos()` corre dentro de `after()` (de `next/server`, para que no se
corte al terminar la respuesta) en `uploadPetPhoto`, `publishPet` y `savePet`, como
`purgePhoneRecords` en la historia #10: sin Cron hasta la beta (docs/07). Borra las fotos en espera
de más de 24 horas y las soltadas (`released_at`), primero los objetos y después las filas: si
falla borrar los objetos, la fila sigue y la próxima purga lo reintenta.

Las candidatas son las mismas que `publish_pet` y `save_pet` ya no aceptan (research R1: el mismo
`p_staged_ttl`), así que la purga nunca borra una foto que una publicación está enganchando.

**Lo que no garantiza:** si nadie —ninguna persona— vuelve a subir, publicar ni guardar, una foto
en espera puede quedar más de 24 horas; la spec ya lo dice así (FR-020: «en la primera limpieza
después de cumplir 24 horas»). Se acepta en `docs/known-limitations.md` en este PR, con la condición de
reapertura: el Cron diario de la beta (docs/07) llama a la misma purga. Mientras tanto la foto no
la ve nadie más (bucket privado) y se va con la cuenta.

## R14 — Tipos de campo nuevos: `RadioGroup`

**Decisión:** una primitiva nueva de `ui/`, `RadioGroup`, sobre `input type="radio"` nativos con
`appearance: none`, como `Checkbox`. Los diez campos de opción única de la ficha (especie, sexo,
unidad de la edad, tamaño, castrado, vacunas, chip, niños, perros, gatos) no pueden ser once
`Select`: en el teléfono cada uno es un toque para abrir y otro para elegir, y las opciones no se
ven. Se registra en docs/10 §Componentes y entra en `/muestra` con sus estados.

## R15 — Una sola pantalla para publicar, no un paso por pantalla

**Decisión:** publicar y editar son un formulario de una pantalla, con cuatro grupos. Se registra
en docs/10 §Layout como **Decisión (2026-09-26)**: la regla «un paso por pantalla» es para el
cuestionario de la solicitud, que es de quien adopta y se completa una vez.

**Motivo:** la rescatista vuelve a este formulario para corregir un dato suelto (FR-019), y con
pasos tendría que recorrerlos para encontrarlo; las fotos no sobreviven a una recarga, y un paso por
pantalla multiplica las navegaciones que las ponen en riesgo; y el aviso de nombre repetido, los
errores por campo y el foco al primero (FR-016) necesitan todos los campos a la vista para no
mandar a la persona a un paso anterior sin explicación. Son 14 datos, casi todos de un toque.

## R16 — `language` en la publicación

**Decisión:** `pets.language text not null default 'es'`, con `check (language in ('es'))`.
`docs/06-i18n.md` §Qué NO se traduce pide guardar el idioma de lo que escribe una persona; el
`check` se ensancha con el segundo idioma.

## R17 — Volver atrás con el navegador

**Decisión:** `useUnsavedChanges` suma el volver del navegador, que hoy no frena (solo los enlaces
propios y `beforeunload`). Mientras hay cambios, empuja una entrada centinela al historial
(`history.pushState` con una marca en `state`); un `popstate` que saca esa entrada vuelve a
empujarla y abre el mismo `Dialog` de salir. «Salir» quita el guardia y hace `history.go(-2)` —la
centinela y la entrada que la persona quería dejar—; «Seguir editando» deja todo como estaba. Al
quedar sin cambios (publicó, guardó, empezó de cero), la centinela se retira con `history.back()`
solo si sigue arriba. El formulario de perfil gana el mismo guardia sin cambiar nada más.

La parte con decisiones —si un `popstate` es el de la centinela, qué hacer al quedar sin cambios—
va a `lib/forms/back-guard.ts`, pura y con test, junto a `leaving.ts`; el hook es el pegamento con
`window.history`.

## R18 — La edad que avanza, sin animal sembrado

**Decisión:** no se siembra un animal. Sus fotos son objetos del almacenamiento que el SQL del seed
no puede crear (el mismo motivo por el que el seed no tiene avatares), y una publicación sin fotos
viola la regla de 1 a 5. La edad que avanza la prueban `lib/pets/age.test.ts` y el paso de
quickstart.md que corre la fecha de un animal publicado en la recorrida.

## R19 — Publicar espera a las fotos que se están preparando

**Decisión:** `submitReadiness(slots)` en `lib/pets/photo-list.ts` → `wait | blocked | empty |
ready`: alguna `preparing` → `wait` (la acción queda ocupada y vuelve a decidir cuando cambia la
lista); ninguna preparándose pero alguna `rejected` recién rechazada mientras se esperaba →
`blocked` (no se manda nada, la acción se libera y la foto dice su motivo); ninguna lista → `empty`;
todas `ready` o `uploaded` → `ready`. Es la regla de spec §Edge Cases «Fotos todavía
preparándose» y de FR-015, con test.

## R20 — El borrado de la cuenta, sin objetos huérfanos

**Decisión:** `deleteAccount` barre el prefijo `{owner}/` **dos veces**: antes de borrar la persona
y después de la cascada. Una subida que anotó su fila antes del borrado y sube sus objetos en el
medio queda cubierta: si sube antes del segundo barrido, el barrido la borra; si sube después,
`uploadPetPhoto` ve que su fila ya no está y borra lo suyo. Una subida que empieza después falla en
`stage_pet_photo` (la dueña no existe). El test de la base recorre la función real del barrido con
un objeto sin fila.
