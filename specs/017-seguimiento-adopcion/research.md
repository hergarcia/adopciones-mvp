# Research — Seguimiento a los 30 días y adopciones con seguimiento

Cada decisión con su porqué y lo que se descartó. El código de `main` que se cita es el de #53
(fotos), #59 (ciclo de vida y tarea programada), #65 (bandeja de salida de correos) y #67
(adopciones).

## R1 — El seguimiento vive en su tabla, `follow_ups`, una fila por adopción

**Decisión**: `public.follow_ups`, con `adoption_id` único (FK `adoptions(id) on delete cascade`),
`adopter_id` (FK `auth.users(id) on delete cascade`), el día en que se resolvió el pedido y su
estado: `requested`, `answered`, `closed` (sin respuesta) o `skipped` (no se pidió, con el motivo).
La respuesta (texto y fecha) va en la misma fila; las fotos en `follow_up_photos`.

**Por qué**: el `unique (adoption_id)` es la regla «una sola vez por adopción» escrita en la base, y
la fila `skipped` es la que impide pedirlo después (FR-002) y deja medir por qué no se pidió
(FR-060). `adopter_id` con cascada borra la respuesta cuando la persona que adoptó borra su cuenta,
aunque la adopción quede con `adopter_id` nulo (#67, FR-053); el animal o la cuenta de quien lo
dio borran la adopción, y la cascada se lleva el seguimiento.

**Descartado**: columnas nuevas en `adoptions` (mezcla dos ciclos de vida y deja la respuesta viva
cuando la adopción queda sin persona); una tabla de respuestas aparte (la respuesta es una sola y
no se edita: es un estado del seguimiento, no otra entidad).

## R2 — Sin políticas: se lee con funciones que miran `auth.uid()`

**Decisión**: `follow_ups` y `follow_up_photos` con RLS encendida, sin políticas y sin permisos
para `anon` ni `authenticated`, como `adoptions` (#67 R2). Se leen con funciones `security
definer`: `follow_up_of(p_application)` (las dos personas), `my_pet_follow_ups()` (quien lo dio),
`my_open_follow_ups()` (quien adoptó) y `follow_up_history(p_public_id)` (cualquiera, solo los dos
números).

**Por qué**: quién ve la respuesta depende del lado y de un bloqueo posterior (FR-034): una
política por fila no puede devolver la fila sin el texto ni las fotos. Las funciones devuelven
solo lo que ese lado puede ver, y los tests de privacidad las atacan una por una.

## R3 — El pedido lo hace la base, una vez por hora, sin pasar por la app

**Decisión**: `private.request_due_follow_ups()`, programada con `pg_cron` a los 10 minutos de cada
hora. Toma las adopciones `kind = 'site'` sin fila en `follow_ups` cuyo día de Uruguay de
`marked_at` más 30 días ya llegó, y para cada una escribe, en la misma transacción:

- `requested` + un aviso `follow_up_requested` en `application_notices` para quien adoptó, si la
  adopción sigue en curso (`ended_at`, `declined_at`, `blocked_at` nulos), `adopter_id` y
  `application_id` no son nulos, no hay un bloqueo entre las dos en ninguna dirección y ninguna de
  las dos está suspendida (`private.is_suspended`);
- `skipped` con el primer motivo que falla, en este orden: `account_deleted`, `ended`, `declined`,
  `blocked`, `suspended`.

**Por qué**: cada hora y con «ya llegó» (`<=`) en lugar de «es hoy», un día en que la base no corrió
se recupera en la vuelta siguiente (FR-003) y el `unique` impide un segundo pedido aunque dos
vueltas se pisen (`on conflict do nothing`). Las condiciones se miran en esa vuelta (FR-002). El
correo sale por la bandeja de salida de #65: `pet_lifecycle_tick` ya llama a la ruta de la tarea
cuando hay avisos esperando, y `drainApplicationNotices` los manda una sola vez.

**Descartado**: correr el pedido desde la ruta de la app (necesita que la app esté arriba para algo
que es puro dato); una vez por día a una hora fija (un día perdido se pierde hasta que corra otra
vez, y la hora de Uruguay cambia con nada: una vuelta por hora no cuesta nada con el índice).

## R4 — Un bloqueo queda marcado en la adopción: `adoptions.blocked_at`

**Decisión**: columna nueva `blocked_at timestamptz` en `adoptions`, que escribe un disparador nuevo
`after insert on blocks` para todas las adopciones entre las dos personas, en las dos direcciones,
**también las terminadas** (FR-034 rige después de volver a publicar). `adoptions_forward_only`
suma `blocked_at` a las fechas que pasan de nulo a valor y no vuelven.

**Por qué**: `contact_cut_at` de #67 no distingue un bloqueo de una suspensión, y la historia los
trata distinto: un bloqueo antes del día 30 impide el pedido para siempre y uno después oculta la
respuesta a quien lo dio; una suspensión solo cuenta el día del pedido. Un disparador aparte no
toca el de #67 (`applications_close_on_block`), que sigue igual.

## R5 — El pedido abierto se cierra con un disparador sobre la adopción

**Decisión**: `adoptions_close_follow_up`, `after update of ended_at, declined_at, blocked_at on
adoptions`: si alguna pasó de nula a valor, el seguimiento `requested` de esa adopción pasa a
`closed` con `closed_at = now()` y `close_reason` (`ended`, `declined`, `blocked`). Uno `answered`
no cambia (FR-023).

**Por qué**: los tres caminos que cierran (volver a publicar, «Yo no adopté», bloquear) ya escriben
esas columnas; engancharse ahí cubre los tres sin tocar sus funciones. La suspensión no cierra
(FR-022).

## R6 — Responder: fotos subidas de a una, respuesta en una sola llamada con candado

**Decisión**: igual que las fotos de la ficha (#53 R2): cada foto se prepara en el navegador con
`preparePhoto` (tres WebP + ThumbHash, sin metadatos) al elegirla, y al tocar «Mandar» viaja sola
en la acción `uploadFollowUpPhoto` (como `usePetSave` sube las de la ficha al publicar), que la anota en espera con `stage_follow_up_photo` (comprueba que quien sube
es quien adoptó, que el pedido está `requested` y que su cuenta no está suspendida; tope de 9 en
espera por seguimiento) y sube los tres objetos con permisos de servicio al bucket privado
`follow-up-photos`, en `<follow_up_id>/<photo_id>/<size>.webp`. «Mandar» llama a `answerFollowUp`,
que pasa a `answer_follow_up(p_adopter, p_application, p_photo_ids, p_text)`: con `for update`
sobre el seguimiento, exige `requested`, 1 a 3 fotos en espera de ese seguimiento y un texto de 500
o menos (recortado; vacío es nulo); marca `answered`, guarda el orden de las fotos, borra de la
lista las otras en espera, escribe el aviso `follow_up_answered` para quien lo dio si su cuenta no
está suspendida, y devuelve `answered`. Si ya estaba `answered`, devuelve `already` sin escribir
nada (doble toque, dos pestañas, reintento: FR-013). `closed` y `not_found` no escriben.

**Por qué**: el límite de 2 MB por acción (next.config, #53) no deja mandar tres fotos juntas;
de a una, cada foto que llegó queda marcada y un reintento después de un corte manda solo lo que
falta; el formulario conserva fotos y texto (FR-014). Subir al tocar «Mandar» y no al elegir evita
subir fotos que la persona después saca. El candado y `already` son la idempotencia.

**Descartado**: subir con la sesión a Storage con políticas (abre objetos sin fila); una acción
única con las tres fotos (pasa el límite).

## R7 — Las fotos que se borran: una cola de purga

**Decisión**: `follow_up_photo_purges (follow_up_id, photo_id)`, llenada por un disparador `after
delete on follow_up_photos`. La cascada de cualquier borrado (cuenta de quien adoptó, cuenta de quien
lo dio, el animal) y el descarte de las que quedaron en espera al responder dejan ahí sus objetos.
`purgeFollowUpPhotos()` (servicio) borra los objetos y después las filas de la cola; corre en la ruta
de la tarea, en `deleteAccount` y en `deletePet` después del borrado, y en `answerFollowUp` con
`after`. Las fotos en espera de un seguimiento que se cerró o que nunca se mandó se borran a las 24
horas (`purge_stale_follow_up_photos`, en la misma vuelta horaria de R3).

**Por qué**: las fotos de la ficha se borran porque la acción sabe su carpeta (`ownerId`); acá el
borrado llega por cascada desde tres lugares, y la cola es el único lugar donde la base recuerda
qué objetos quedaron sin fila. Un objeto nunca queda alcanzable: el bucket no tiene políticas y
solo se firma lo que una función de lectura devolvió.

## R8 — El correo de la respuesta lleva la primera foto adentro

**Decisión**: el aviso `follow_up_answered` arma su correo aparte (`sendFollowUpAnsweredEmail`):
baja `card` de la primera foto con el servicio, la pasa a JPEG de 600 px con `sharp` (ya es
dependencia, la usa la imagen de compartir) y la manda como adjunto en línea (`contentId`, que
Resend 6 acepta) con `<img src="cid:…">`. `sendEmail` suma `extras.inlineImage`; sin
`RESEND_API_KEY` el archivo de `.artifacts/mail/` anota que hubo imagen, sin el contenido. El
correo del pedido usa la portada del animal con la ruta pública de la imagen de compartir, como el
del compromiso (`commitment_for_email` ya da el código y la portada a cualquiera de las dos).

**Por qué**: la foto es privada (FR-033): una URL firmada en un correo vence, y una pública la
dejaría a la vista de cualquiera con el enlace. Adentro del correo, la ve solo quien lo recibe, que
es quien ya puede verla.

**Descartado**: sin foto en ese correo (la historia la pide); WebP adentro (Outlook no lo muestra).

## R9 — Los números del historial: una función pública chica

**Decisión**: `follow_up_history(p_public_id text)` → `given integer, adopted integer`, `grant` a
`anon` y `authenticated`. Cuenta seguimientos `answered`: `given` por `adoptions.publisher_id`,
`adopted` por `follow_ups.adopter_id`. Una cuenta suspendida o que no existe devuelve `0, 0`. La
llaman el perfil público, la ficha (con `publisher_public_id`) y Una solicitud para el publicador
(con el `public_id` de quien la mandó), en paralelo con lo que ya traen.

**Por qué**: los números son públicos por decisión (docs/03 §5), no dicen animales ni personas, y
una función aparte evita recrear `public_profile`, `pet_by_code` y `publisher_application`, que son
grandes y ya tienen sus tests. Lo que ya fue de un borrado no cuenta porque la fila ya no está
(FR-044).

## R10 — Lo que ve cada lado, en funciones puras

**Decisión**: `lib/follow-ups/follow-up-view.ts`: `followUpView(row, side)` → `none`, `requested`
(con `canAnswer` del lado de quien adoptó), `answered` (con o sin contenido), `closed`;
`followUpLine(row)` → la línea de Mis animales; `historyLines(counts)` → las líneas que van, ninguna
con cero. `adoptionView` de #67 suma `followUpAnswered` y deja `canDecline` en falso con una
respuesta (FR-017); `decline_adoption` se recrea y devuelve `answered` en ese caso.

## R11 — Medición

**Decisión**: eventos nuevos, sin ids ni textos: `follow_up_requested`, `follow_up_skipped
{ reason }` (los registra la ruta de la tarea con `claim_follow_up_events`, que marca
`measured_at`, como los vencimientos de #59), `follow_up_answered { days_since_requested,
photo_count, has_text }` (la acción), `follow_up_viewed { days_since_answered }` (la primera vez
que quien lo dio ve la respuesta: `mark_follow_up_seen`, que escribe `seen_at` una sola vez y
devuelve si fue la primera). `pet_lifecycle_tick` se recrea para llamar a la ruta también cuando
hay seguimientos sin medir.

## R12 — Lo que había antes

Las adopciones marcadas antes de esta migración tienen `marked_at`: la primera vuelta pide las que
ya pasaron su día 30 y siguen en condiciones (spec, Assumptions). `blocked_at` se rellena en la
migración para las adopciones entre dos personas que hoy tienen un bloqueo.

## R13 — Sin dependencias nuevas

`sharp`, `resend` y `thumbhash` ya están. Ningún paquete nuevo; ningún cambio a docs/07.
