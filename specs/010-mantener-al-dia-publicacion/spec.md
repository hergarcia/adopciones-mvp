# Feature Specification: Mantener al día cada publicación: en proceso, pausa, adopción, vencimiento y revisión

**Feature Branch**: `feature/59-mantener-al-dia-publicacion`

**Created**: 2026-09-30

**Status**: Draft

**Input**: Historia #59 del backlog, milestone «M2 - Publicación y difusión». El cuerpo verbatim de
la historia acompaña a esta spec (`story.md`).

**Ya construido**: cada publicación ya tiene un estado que hoy solo puede ser «disponible» y una
fecha de publicación con la que se ordenan el listado y Mis animales (historia #53). Ya existen la
pantalla de animal no disponible, los casos que la muestran (publicador sin teléfono confirmado,
animal que no existe) y la vista previa del enlace de un animal que no se muestra (historia #57).
Borrar la cuenta ya borra las fotos de todas sus publicaciones (historia #53). Ya existen quién
administra el sitio, la lista de pedidos de identidad por revisar con su acceso y su cuenta en Mi
perfil, y la regla de que nadie resuelve lo propio (historia #11). Esta historia **ensancha** el
estado y **suma** el vencimiento, borrar una sola publicación y la revisión de publicaciones; no
rehace nada de lo anterior. Publicaciones por revisar sigue el mismo patrón que la revisión de
identidad.

**Vocabulario de esta spec**: una **publicación** es un animal publicado (historia #53); su
**ficha**, su **enlace**, el **listado** («Animales en adopción»), la **vista previa** y estar **a
la vista** significan lo mismo que en la spec de la historia #57. El **publicador** es quien la
publicó; **quien administra** es una persona que el equipo designó por fuera del sitio (historia
#11). El **estado** de una publicación es uno de cuatro: **disponible**, **en proceso**, **pausada**
o **adoptada**. Además, una publicación puede estar **vencida** (pasaron 30 días sin renovarla) o
**dada de baja** (la bajó quien administra). **Renovar** es darle 30 días nuevos sin cambiar su
estado; **reanudar** es pasar una pausada a disponible; **volver a publicar** es pasar una vencida
o una adoptada a disponible. Las tres tienen el mismo enlace de siempre. El **vencimiento** es el
momento en que una publicación disponible o en proceso pasa a vencida. El **recordatorio** es el
correo «¿<nombre> sigue disponible?». **Nivel 1** es el teléfono verificado de la historia #10.
Las fechas se dicen en el calendario de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marcar un animal en proceso, pausarlo, marcarlo adoptado o borrarlo (Priority: P1)

Una rescatista entra a Mis animales y ve, sobre cada animal, en qué estado está. A Tobi le
apareció una familia: lo marca «En proceso» y sigue en el listado con el sello, como el «RESERVADO»
del grupo. Luna se enfermó: la pausa y su enlace dice que no está disponible por ahora; cuando se
cura, la reanuda y vuelve al listado. Cuando Tobi se va a su casa lo marca adoptado: sale del
listado, pero quien llega desde un posteo viejo ve su ficha con el sello «Adoptado» y el camino al
listado. Si la adopción no funciona, lo vuelve a publicar con el mismo enlace. Un animal que cargó
dos veces por error lo borra, después de confirmar.

**Why this priority**: es lo que hace que el listado muestre animales vivos sin que el rescatista
tenga que acordarse de borrar posteos (docs/01 §Huevo y gallina). El vencimiento, el recordatorio y
la revisión se apoyan en estos estados.

**Independent Test**: con una persona sembrada con nivel 1 y tres animales disponibles: marcar uno
«En proceso» y verlo en el listado y en su ficha con el sello; pausar otro y ver que sale del listado
y que su enlace, sin sesión, dice que no está disponible por ahora; reanudarlo y verlo de vuelta
con su vencimiento a 30 días de hoy; marcar el tercero adoptado, verlo fuera del listado y su ficha
con «Adoptado»; volver a publicarlo; borrar uno y ver que su enlace dice que no está publicado.

**Acceptance Scenarios**:

1. **Dado** que publiqué a Tobi, **cuando** lo marco «En proceso» en Mis animales, **entonces**
   sigue en Animales en adopción y en su ficha con el sello «En proceso».
2. **Dado** que Tobi está en proceso, **cuando** lo vuelvo a marcar disponible, **entonces** sigue
   en el listado sin el sello y su vencimiento no cambia.
3. **Dado** que Tobi está publicado, **cuando** lo marco adoptado, **entonces** sale de Animales en
   adopción, y quien abre su enlace ve su ficha con el sello «Adoptado» y el camino al listado.
4. **Dado** que pauso a Luna, **cuando** alguien abre su enlace, **entonces** ve que no está
   disponible por ahora y el camino al listado, sin su foto, su nombre ni su zona; cuando la
   reanudo, vuelve al listado y vence 30 días después de reanudarla.
5. **Dado** que Luna está pausada desde hace 40 días, **cuando** la miro en Mis animales,
   **entonces** no venció, no muestra fecha de vencimiento y no recibí ningún correo por ella.
6. **Dado** que marqué adoptado a Tobi y la adopción no funcionó, **cuando** toco «Volver a
   publicar», **entonces** vuelve al listado disponible, con el mismo enlace y 30 días nuevos.
7. **Dado** que toco borrar a Tobi, **cuando** se me pide confirmar y confirmo, **entonces**
   desaparece de Mis animales y su enlace dice que el animal no está publicado; si no confirmo,
   nada cambia.
8. **Dado** que cambié de número y todavía no confirmé el nuevo, **cuando** marco adoptado a Tobi,
   **entonces** se marca; y cuando intento reanudar a Luna, veo el aviso de verificación pendiente
   con el camino para confirmar el teléfono, y Luna sigue pausada.
9. **Dado** que marqué adoptado a Tobi, **cuando** alguien pega su enlace en un grupo, **entonces**
   la vista previa muestra su foto y su nombre y dice que fue adoptado; si lo pausé, la vista previa
   no muestra su foto, su nombre ni su zona.
10. **Dado** que se corta la conexión, **cuando** pauso a Luna, **entonces** Luna sigue como estaba,
    se me dice que no se pudo por la conexión y puedo reintentar.
11. **Dado** que abro el enlace para cambiar el estado de un animal que no es mío, **cuando** carga,
    **entonces** veo «este animal no existe», igual que si no existiera.
12. **Dado** que pausé a Luna, **cuando** abro su ficha con mi sesión, **entonces** la veo entera,
    con el sello «Pausado» y el aviso de que nadie más la ve mientras esté pausada, con el camino a
    ese animal en Mis animales.

---

### User Story 2 - Que cada publicación venza sola a los 30 días y se renueve con un toque (Priority: P2)

Tobi se publicó hace 25 días. En Mis animales, la rescatista ve «Vence el 5 de octubre» marcado
como próximo y «Renovar»; lo toca y Tobi vence 30 días después de hoy. Otra publicación que nadie
renovó vence sola: sale del listado, su enlace dice que la publicación venció y lleva al listado, y
en Mis animales figura vencida con «Volver a publicar», que la trae de vuelta con el mismo enlace.

**Why this priority**: es lo que le saca al rescatista el trabajo de borrar posteos: lo que nadie
confirma sale solo del listado (docs/03 §2). Se construye sobre los estados de US1.

**Independent Test**: con animales sembrados publicados hace 10, 25 y 31 días: el de 10 días
muestra su fecha sin marca; el de 25, la fecha marcada como próxima y «Renovar», y al tocarlo vence
30 días después de hoy; el de 31 no está en el listado, su enlace dice que venció, y en Mis animales
figura vencido con «Volver a publicar», que lo devuelve al listado con el mismo enlace.

**Acceptance Scenarios**:

1. **Dado** que Tobi vence en 5 días, **cuando** abro Mis animales, **entonces** veo la fecha en
   que vence marcada como próxima y «Renovar»; al tocarlo, vence 30 días después de hoy.
2. **Dado** que Tobi vence en 20 días, **cuando** abro Mis animales, **entonces** veo la fecha en
   que vence, sin marca, y también puedo renovarlo.
3. **Dado** que publiqué a Tobi hace 30 días y no lo renové, **cuando** alguien lo busca,
   **entonces** no aparece en el listado, su enlace dice que la publicación venció con el camino al
   listado, y en Mis animales figura vencido con «Volver a publicar»; al tocarlo vuelve al listado
   con el mismo enlace y 30 días nuevos.
4. **Dado** que Tobi estaba en proceso cuando venció, **cuando** toco «Volver a publicar»,
   **entonces** vuelve al listado disponible, sin el sello «En proceso».
5. **Dado** que edito la descripción de Tobi, **cuando** guardo, **entonces** su fecha de
   vencimiento no cambia.
6. **Dado** que Tobi venció, **cuando** abro su ficha con mi sesión, **entonces** la veo entera
   con el aviso de que venció y nadie más la ve, y el camino a ese animal en Mis animales.
7. **Dado** que cambié de número y todavía no lo confirmé, **cuando** toco «Renovar» o «Volver a
   publicar», **entonces** veo el aviso de verificación pendiente y nada cambia.
8. **Dado** que se corta la conexión, **cuando** toco «Renovar», **entonces** el vencimiento sigue
   como estaba, se me dice que no se pudo por la conexión y puedo reintentar.

---

### User Story 3 - El correo «¿sigue disponible?» renueva a un toque sin ingresar (Priority: P3)

Siete días antes de que Tobi venza, la rescatista recibe un solo correo: «¿Tobi sigue disponible?»,
con su foto, la fecha en que vence, «Sigue disponible» y «Ya no está disponible». Toca «Sigue
disponible» desde el teléfono, sin ingresar, y ve que Tobi sigue publicado hasta 30 días después de
hoy. Si ya lo había marcado adoptado, el correo no le cambia nada y se lo dice.

**Why this priority**: es lo que hace que el costo de mantener vivo el listado sea un toque por
mes, sin abrir el sitio. Depende del vencimiento de US2.

**Independent Test**: con un animal sembrado publicado hace 23 días: recibir el correo con la foto,
el nombre, la fecha de vencimiento y los dos botones; abrir «Sigue disponible» en un navegador sin
sesión y ver hasta cuándo sigue publicado; abrirlo dos veces y ver que vence 30 días después de hoy,
no 60; marcarlo adoptado y abrirlo de nuevo: ver que sigue adoptado y por qué; abrir un enlace
alterado y ver que no sirve.

**Acceptance Scenarios**:

1. **Dado** que publiqué a Tobi hace 23 días y no lo renové, **cuando** pasa ese día,
   **entonces** recibo el correo «¿Tobi sigue disponible?» con su foto y la fecha en que vence; toco
   «Sigue disponible» sin ingresar y veo que sigue publicado hasta 30 días después de hoy.
2. **Dado** que toco «Sigue disponible» dos veces, **cuando** termina, **entonces** Tobi vence 30
   días después de hoy, no 60.
3. **Dado** que Tobi ya venció, **cuando** toco «Sigue disponible» en el correo, **entonces**
   vuelve al listado disponible con 30 días nuevos y el mismo enlace.
4. **Dado** que recibí el correo de Tobi y después lo marqué adoptado, **cuando** toco «Sigue
   disponible» en el correo, **entonces** Tobi sigue adoptado y se me dice que figura como adoptado
   y que puedo volver a publicarlo desde Mis animales.
5. **Dado** que Tobi está pausado o fue dado de baja, **cuando** toco «Sigue disponible»,
   **entonces** nada cambia y se me dice que está pausado (y que lo puedo reanudar desde Mis
   animales) o que fue dado de baja.
6. **Dado** que toco «Ya no está disponible», **cuando** carga, **entonces** veo a Tobi en Mis
   animales con sus acciones para marcarlo adoptado, pausarlo o borrarlo; si no tengo la sesión
   abierta, primero ingreso y después llego ahí.
7. **Dado** que abro un enlace de «Sigue disponible» alterado o de un animal borrado, **cuando**
   carga, **entonces** veo que el enlace no sirve y el camino a Mis animales, y nada cambia.
8. **Dado** que Tobi está en proceso, **cuando** toco «Sigue disponible», **entonces** sigue en
   proceso y vence 30 días después de hoy.
9. **Dado** que renové a Tobi desde Mis animales antes de que llegue a sus últimos 7 días,
   **cuando** pasan esos días, **entonces** no recibo ningún correo por el vencimiento anterior, y
   recibo uno solo 7 días antes del nuevo.
10. **Dado** que cambié de número y todavía no lo confirmé, **cuando** toco «Sigue disponible»,
    **entonces** nada cambia y se me dice que primero tengo que confirmar mi teléfono, con el camino
    para hacerlo.

---

### User Story 4 - Quien administra revisa cada publicación nueva y baja la que no corresponde (Priority: P4)

Quien administra abre Mi perfil y ve «Publicaciones por revisar» con cuántas esperan. Adentro, las
nuevas y las editadas sin revisar, de la más vieja a la más nueva, con sus fotos, todos sus datos
con la descripción completa, el nombre y el nivel de quien publica y desde cuándo espera cada una.
Marca revisada la que está bien. A Tobi, que tiene «llamame al noventa y nueve, uno dos tres…» en
la descripción, lo da de baja con el motivo «datos de contacto o una dirección»: sale del listado en
el momento, su enlace dice que no está publicado, y el publicador recibe un correo con el motivo y
el correo de ayuda.

**Why this priority**: es la otra mitad de la confianza (docs/03 §6): baja la venta disfrazada, las
fotos robadas y el contacto escrito en palabras que la ficha no detecta sola (KL-53-3). Las
publicaciones salen en el momento, así que el resto de la historia no depende de esta.

**Independent Test**: con dos personas sembradas que administran y tres publicaciones de otras
personas, una de ellas editada después de revisada: la primera ve la lista con las tres, de la más
vieja a la más nueva, la editada marcada como editada, y la cuenta en Mi perfil; marca una revisada
y da de baja otra por venta; la dada de baja sale del listado, su enlace dice que no está publicada,
su publicador recibe el correo y la ve en Mis animales con el motivo. La segunda persona que
administra, con la misma publicación abierta, ve que ya se resolvió. Una persona que no administra
abre la dirección de la lista y ve que no existe.

**Acceptance Scenarios**:

1. **Dado** que administro el sitio, **cuando** abro Publicaciones por revisar, **entonces** veo
   las publicaciones sin revisar de la más vieja a la más nueva, con sus fotos, sus datos y el
   nombre y el nivel de quien publica, y puedo marcar cada una revisada o darla de baja con un
   motivo.
2. **Dado** que Tobi se publicó con «llamame al noventa y nueve, uno dos tres…» en la descripción,
   **cuando** quien administra lo abre en Publicaciones por revisar, **entonces** lee la descripción
   completa y lo da de baja con el motivo de datos de contacto o dirección; Tobi sale del listado en
   el momento.
3. **Dado** que quien administra da de baja a Tobi por venta, **cuando** pasa, **entonces** Tobi
   sale del listado, su enlace dice que no está publicado, recibo un correo con el motivo y el
   correo de ayuda, y en Mis animales lo veo dado de baja con el motivo, sin poder volver a
   publicarlo: solo borrarlo.
4. **Dado** que una publicación revisada se edita, **cuando** quien administra abre Publicaciones
   por revisar, **entonces** la ve de nuevo, marcada como editada, y la ficha siguió a la vista todo
   el tiempo.
5. **Dado** que administro el sitio y publiqué un animal, **cuando** abro Publicaciones por
   revisar, **entonces** veo la mía marcada como propia y no puedo resolverla: la tiene que resolver
   otra persona que administre; y no cuenta entre las que esperan en Mi perfil.
6. **Dado** que dos personas administran, **cuando** una da de baja una publicación que la otra
   tiene abierta, **entonces** la segunda ve que ya se resolvió y no puede resolverla de nuevo.
7. **Dado** que no administro el sitio, **cuando** abro Publicaciones por revisar, **entonces** veo
   que la página no existe.
8. **Dado** que administro el sitio, **cuando** abro Mi perfil, **entonces** junto al acceso a los
   pedidos de identidad veo el de Publicaciones por revisar con cuántas esperan, o «Nada esperando»
   si no espera ninguna.
9. **Dado** que elijo el motivo «otro», **cuando** intento dar de baja sin escribir el motivo,
   **entonces** se me pide escribirlo y nada cambia.
10. **Dado** que no hay ninguna publicación sin revisar, **cuando** abro Publicaciones por revisar,
    **entonces** veo «No hay publicaciones por revisar.».
11. **Dado** que se corta la conexión, **cuando** marco revisada una publicación, **entonces** sigue
    en la lista sin revisar, se me dice que no se pudo por la conexión y puedo reintentar.

---

### Edge Cases

- **Qué acciones tiene cada estado** (Mis animales):
  - *Disponible*: marcar en proceso, pausar, marcar adoptado, renovar, borrar.
  - *En proceso*: marcar disponible, pausar, marcar adoptado, renovar, borrar.
  - *Pausada*: reanudar, marcar adoptado, borrar.
  - *Adoptada*: volver a publicar, borrar.
  - *Vencida*: volver a publicar, marcar adoptado, borrar.
  - *Dada de baja*: solo borrar.
  Editar sigue como en la historia #53 en todos los estados salvo dada de baja, que no se edita.
- **Qué exige el teléfono verificado**: reanudar, renovar y volver a publicar exigen nivel 1 porque
  ponen el animal a la vista; marcar en proceso, marcar disponible desde en proceso, pausar, marcar
  adoptado y borrar no lo exigen. Marcar disponible desde en proceso no lo exige porque el animal ya
  estaba a la vista y su vencimiento no cambia.
- **Cuándo vence**: exactamente 30 días después del momento en que se publicó, se renovó, se
  reanudó o se volvió a publicar por última vez; desde ese momento sale del listado y su enlace dice
  que venció. Mis animales y el correo dicen el día de Uruguay en que cae. **Próxima** quiere decir
  que faltan 7 días o menos.
- **Pausar congela**: una pausada no vence, no muestra fecha de vencimiento y no recibe
  recordatorio. Al reanudarla tiene 30 días nuevos desde ese momento, aunque le faltaran menos al
  pausarla.
- **Adoptada no vence** y no recibe recordatorio. Al volver a publicarla tiene 30 días nuevos.
- **Una vencida no se borra sola** y no recibe más correos. En Mis animales queda en su lugar de
  siempre, con el sello «Vencido», hasta que la persona la vuelva a publicar, la marque adoptada o la
  borre.
- **Renovar varias veces**: cada renovación deja 30 días desde ese momento, nunca suma: dos toques
  seguidos dejan 30 días, no 60.
- **Volver a publicar cuenta como publicada hoy**: una vencida o una adoptada que vuelve a publicarse
  aparece arriba del listado y dice «Publicado hoy», con el mismo enlace. Renovar y reanudar no
  cambian su lugar en el listado ni su «Publicado hace…».
- **El recordatorio sale una sola vez por vencimiento**: entre el momento en que le quedan 7 días y
  como mucho una hora después, si sigue disponible o en proceso. Si se renueva antes, el
  recordatorio de ese vencimiento no sale; el del vencimiento nuevo sale 7 días antes de él. Si
  queda pausada, adoptada o dada de baja antes, no sale.
- **El recordatorio no sale si el correo de la cuenta no existe** (cuenta borrada): no hay a quién
  mandarlo. Si el envío falla, no se reintenta: el vencimiento llega igual y la publicación vencida
  se vuelve a publicar desde Mis animales.
- **«Sigue disponible» de un recordatorio viejo**: sirve para renovar ese animal mientras exista,
  hasta 30 días después de enviado el correo. Después dice que el enlace venció y ofrece el camino
  a Mis animales.
- **«Sigue disponible» sobre cada estado**: disponible o en proceso, renueva sin cambiar el estado;
  vencida, la vuelve a publicar como disponible; pausada, adoptada o dada de baja, no cambia nada y
  dice cuál es su estado y qué puede hacer; borrada, dice que el enlace no sirve. Sin nivel 1, no
  cambia nada y dice que primero hay que confirmar el teléfono.
- **«Sigue disponible» con la sesión de otra persona abierta en el mismo navegador**: renueva igual,
  porque el enlace es del animal; la pantalla de resultado no muestra nada de la persona que tiene la
  sesión ni del publicador más allá del nombre del animal.
- **«Ya no está disponible» con la sesión de otra persona**: ve «este animal no existe», igual que
  cualquier enlace a un animal que no es suyo.
- **Dos cambios a la vez** (dos pestañas, o el publicador y quien administra): gana el que llega
  primero. Si la acción del segundo ya no corresponde al estado nuevo (pausar uno que ya está
  adoptado), no se aplica y ve el estado nuevo con un aviso de que el animal cambió mientras tanto.
  Si ya está como lo pide (pausar uno que ya está pausado), no pasa nada más y ve ese estado. Renovar
  dos veces deja 30 días desde el último toque. Una baja siempre gana: después de dada de baja, ninguna acción del publicador
  salvo borrar hace efecto.
- **Tocar dos veces una acción**: el segundo toque no hace un segundo cambio; mientras se guarda, el
  botón queda ocupado.
- **Borrar una dada de baja**: se puede, y borra su revisión y su motivo con ella.
- **Cuenta borrada**: borra todas sus publicaciones con sus fotos, sus datos y su revisión, como ya
  hacía la historia #53; sus enlaces dicen que no está publicado.
- **Publicación de un publicador que perdió el nivel 1**: sigue en Publicaciones por revisar; quien
  administra la ve con sus fotos aunque no esté a la vista. Su enlace sigue la precedencia de abajo.
- **Qué dice el enlace**, en este orden: no existe, borrada o dada de baja → «no está publicado»;
  pausada → no disponible por ahora (texto de pausada); vencida → la publicación venció; publicador
  sin nivel 1 → no disponible por ahora (el texto de la historia #57); adoptada → ficha con
  «Adoptado»; en proceso → ficha con «En proceso»; disponible → ficha. Ninguno de los textos sin
  ficha muestra foto, nombre, zona ni nada del publicador.
- **Vista previa en cada estado**: disponible y en proceso, la de la historia #57; adoptada, foto de
  portada, nombre y que fue adoptado, sin zona; todos los demás, solo el nombre del sitio y
  «Animales en adopción». Los posteos ya armados conservan la vista previa que la app ya armó (eso
  lo decide cada app), y lo que el sitio ofrece desde el cambio es lo nuevo.
- **El sello concuerda con el animal**: «Adoptado» o «Adoptada» según su sexo; «En proceso» y
  «Pausado» o «Pausada» igual.
- **Desde cuándo espera una publicación por revisar**: desde que se publicó si es nueva, o desde la
  edición que la devolvió a la lista si es editada; el orden de la lista usa esa misma fecha.
- **Revisión de una publicación editada antes de revisarla**: sigue una sola vez en la lista, como
  nueva, sin la marca de editada.
- **Revisión de una publicación pausada, vencida o adoptada**: sigue en la lista; quien administra
  ve su estado y la puede revisar o dar de baja igual.
- **Una publicación que se borra mientras quien administra tiene la lista abierta**: al resolverla
  ve, en su lugar, que ya no existe, y nada cambia.
- **Dar de baja una publicación propia**: no se puede, como marcarla revisada.
- **Quien deja de administrar con la lista abierta**: su próxima acción no hace efecto y ve que la
  página no existe.
- **El texto del motivo «otro»**: obligatorio, de 1 a 300 caracteres, y lo lee el publicador tal
  cual en el correo y en Mis animales; la pantalla se lo dice a quien administra antes de confirmar.
- **Una baja no se deshace desde el sitio**: el publicador escribe al correo de ayuda; si el equipo
  decide revertirla, lo hace por fuera del sitio.

## Pantallas

Cada pantalla, con su estado vacío, su estado mientras carga y su estado de error. Ninguna nueva
aparece en buscadores (FR-031).

- **Mis animales** (cambia, de #53 y #57). Cada animal suma, sobre su card, el sello de su estado
  («En proceso», «Pausado», «Adoptado», «Vencido», «Dado de baja»; disponible no lleva sello), la
  fecha en que vence si está disponible o en proceso —marcada como próxima en los últimos 7 días—
  o el día en que venció si está vencida,
  y debajo las acciones de su estado (Edge Cases). La dada de baja muestra el motivo y solo
  «Borrar». Borrar abre una confirmación que dice que es definitivo y que borra las fotos. Vacío: el
  de #53. Cargando: el de #53. Error al traerla: el de #53. Error de una acción: el animal queda
  como estaba, se dice por qué (sin conexión, el sitio no respondió, falta confirmar el teléfono o el
  animal cambió mientras tanto) y se ofrece reintentar o, si falta el teléfono, el aviso de
  verificación pendiente con su camino. Al terminar una acción, el sello, la fecha y las acciones
  cambian en el lugar, con un aviso corto de lo que pasó («Tobi está en proceso», «Renovado hasta el
  5 de noviembre»).
- **Un animal en Mis animales**: a donde llevan «Ya no está disponible» y el enlace para cambiar el
  estado de un animal; muestra ese animal con su sello, su fecha y sus acciones, igual que en la
  lista, y el camino a la lista entera. Si el animal no existe o no es de quien mira: «este animal no
  existe». Vacío: no aplica. Cargando y error: los de Mis animales.
- **Ficha de un animal** (cambia, de #57): el sello «En proceso» o «Adoptado» junto al nombre. La
  adoptada suma el camino a «Animales en adopción» y conserva «Compartir», cuya vista previa dice que
  fue adoptada. Vista por su publicador cuando nadie más la ve
  (pausada, vencida, dada de baja), suma el aviso de por qué y el camino a ese animal en Mis
  animales; para la dada de baja, también el motivo. Vacío, cargando y error: los de #57.
- **Animal no disponible** (cambia, de #57): suma el texto de publicación pausada («Este animal está
  pausado por ahora») y el de publicación vencida («Esta publicación venció»), cada uno con el camino
  al listado; la dada de baja y la borrada usan el texto de «no está publicado» que ya existe.
  Vacío: no aplica. Cargando y error: los de la ficha.
- **Animales en adopción** (cambia, de #57): solo disponibles y en proceso; las cards en proceso
  llevan el sello «En proceso». Vacío, cargando y error: los de #57.
- **Correo «¿sigue disponible?»**: asunto «¿<nombre> sigue disponible?»; la foto de portada, el
  nombre, la fecha en que vence, «Sigue disponible» y «Ya no está disponible», y una línea que dice
  que si no hace nada, el animal sale del listado ese día. Si la foto no carga, el correo se lee
  igual, con el nombre en su lugar. Vacío: no aplica.
- **Resultado de «Sigue disponible»**: hasta qué día sigue publicado, o por qué no cambió nada
  (Edge Cases), con el camino a Mis animales. Cargando: el botón de la pantalla queda ocupado.
  Error: si el sitio no respondió, lo dice y ofrece reintentar, sin decir que el enlace no sirve.
  Vacío: no aplica.
- **Publicaciones por revisar**, solo para quien administra: las nuevas y las editadas sin revisar,
  de la que más espera a la que menos, arriba cuántas esperan, y de cada una, en la misma lista y
  sin abrir otra pantalla: todas sus fotos, todos sus datos con la descripción completa, su estado
  si no es disponible, su enlace, quién publica (nombre, foto y nivel en palabras, como en la
  ficha), si es nueva o editada y desde cuándo espera («hace 3 horas», «hace 2 días»), con «Marcar
  revisada» y «Dar de baja». Se muestran las 20 que más esperan; las demás aparecen a medida que se
  resuelven las de arriba. La propia va marcada como propia y sin acciones. Dar de baja pide el
  motivo de la lista y, para «otro», el texto, y confirma. Al resolver una, sale de la lista con un
  aviso de lo que se hizo. Si otra persona ya la resolvió o se borró, lo dice en su lugar, sin
  acciones. Vacío: «No hay publicaciones por revisar.». Cargando: la forma de la lista con el lugar
  de las fotos. Error al cargar: no se pudo, con reintentar. Error de una acción: nada cambia, se
  dice por qué (sin conexión, el sitio no respondió) y se ofrece reintentar.
- **Mi perfil** (cambia, de #11), solo para quien administra: junto al acceso a los pedidos de
  identidad, el de Publicaciones por revisar con cuántas esperan (sin contar las propias). Vacío:
  «Nada esperando». Si la cuenta no se pudo traer, el acceso se muestra sin el número.
- **Vista previa del enlace** (cambia, de #57): la del animal adoptado y la del que no se muestra,
  según Edge Cases. Vacío: no aplica.
- **Correo de baja**: asunto con el nombre del animal; el nombre, el motivo (o el texto escrito para
  «otro»), que ya no se ve en el sitio, que lo puede borrar desde Mis animales, y el correo de ayuda.
  Vacío: no aplica.

## Requirements *(mandatory)*

### Functional Requirements

#### Los estados

- **FR-001**: Una publicación DEBE estar en uno de cuatro estados: disponible, en proceso, pausada
  o adoptada; y además PUEDE estar vencida o dada de baja. Toda publicación nueva DEBE nacer
  disponible, con su vencimiento a 30 días.
- **FR-002**: El publicador DEBE poder cambiar el estado de sus publicaciones desde Mis animales con
  las acciones de cada estado (Edge Cases), y solo de las suyas. Una acción sobre una publicación que
  no es suya, o que no existe, NO DEBE cambiar nada y DEBE verse igual que la de un animal que no
  existe.
- **FR-003**: Pausar, marcar en proceso, marcar disponible desde en proceso, marcar adoptado y
  borrar NO DEBEN exigir nivel 1. Reanudar, renovar y volver a publicar DEBEN exigir nivel 1; sin él,
  NO DEBEN cambiar nada y DEBEN mostrar el aviso de verificación pendiente de la historia #10 con el
  camino para confirmar el teléfono.
- **FR-004**: Reanudar DEBE dejar la publicación disponible con 30 días nuevos desde ese momento.
  Volver a publicar una vencida o una adoptada DEBE dejarla disponible con 30 días nuevos, el mismo
  enlace y la fecha de publicación de ese momento.
- **FR-005**: Borrar DEBE pedir confirmación y, al confirmar, DEBE borrar para siempre la
  publicación, sus fotos, sus datos y su revisión. Su enlace NO DEBE volver a usarse para otra
  publicación.
- **FR-006**: Una publicación dada de baja NO DEBE poder cambiarse de estado, renovarse, volver a
  publicarse ni editarse desde el sitio; su publicador solo DEBE poder borrarla.
- **FR-007**: Un cambio que se corta por la conexión o porque el sitio no respondió NO DEBE dejar la
  publicación a medias: queda como estaba o con el cambio entero. La persona DEBE ver qué pasó y
  poder reintentar, y reintentar NO DEBE aplicar el cambio dos veces. Si el estado cambió mientras
  tanto (otra pestaña, una baja), DEBE ver el estado nuevo y un aviso, sin que su cambio se aplique.

#### Lo que se ve en cada estado

- **FR-008**: El listado DEBE mostrar solo publicaciones disponibles y en proceso, no vencidas, de un
  publicador con nivel 1 hoy; las en proceso con el sello «En proceso». El total del listado DEBE
  contar las mismas.
- **FR-009**: El enlace de una publicación DEBE mostrar, a quien no es su publicador, lo que dice la
  precedencia de Edge Cases. Ninguna pantalla sin ficha DEBE mostrar foto, nombre, zona ni dato
  alguno del publicador.
- **FR-010**: La ficha de una adoptada DEBE mostrar lo mismo que antes, con el sello «Adoptado» y el
  camino a «Animales en adopción», y nada de quien adoptó.
- **FR-011**: La vista previa del enlace DEBE seguir a la ficha (Edge Cases): la de una adoptada DEBE
  llevar su portada y su nombre y decir que fue adoptada, no que está en adopción; la de una pausada,
  vencida, dada de baja o borrada NO DEBE llevar foto, nombre ni zona.
- **FR-012**: Lo que no se muestra a cualquiera NO DEBE poder leerse por ningún camino por quien no
  es su publicador (ni quien administra, salvo por FR-024): ni los datos, ni las fotos, ni la vista
  previa de una pausada, vencida, dada de baja o borrada, con sesión o sin ella. Las fotos de una
  adoptada a la vista se leen como las de una disponible. Cada una de estas reglas DEBE poder
  demostrarse con un intento fallido de lectura desde una persona sin sesión y desde otra persona con
  sesión.
- **FR-013**: El publicador DEBE ver la ficha de sus publicaciones en cualquier estado salvo borrada,
  con el aviso de por qué nadie más la ve cuando no se muestra, y el camino a ese animal en Mis
  animales.

#### Vencimiento y renovación

- **FR-014**: Una publicación disponible o en proceso DEBE vencer al cumplir 30 días desde que se
  publicó, se renovó, se reanudó o se volvió a publicar por última vez. Al vencer DEBE salir del
  listado y su enlace DEBE decir que la publicación venció, sin que nadie tenga que hacer nada. Una
  vencida NO DEBE borrarse sola.
- **FR-015**: Mis animales DEBE mostrar, en cada disponible o en proceso, el día en que vence,
  marcado como próximo cuando faltan 7 días o menos, y «Renovar». Renovar DEBE dejar 30 días desde
  ese momento, sin sumar, y sin cambiar el estado ni el lugar en el listado.
- **FR-016**: Editar la ficha NO DEBE cambiar el vencimiento. Pausar DEBE congelarlo: una pausada no
  vence.

#### El recordatorio

- **FR-017**: Cuando a una publicación disponible o en proceso le quedan 7 días para vencer, su
  publicador DEBE recibir, como mucho una hora después, un solo correo «¿<nombre> sigue
  disponible?» en la dirección de su cuenta, con la portada, el nombre, el día en que vence, «Sigue
  disponible» y «Ya no está disponible». NO DEBE recibir más de uno por cada vencimiento; renovar,
  reanudar o volver a publicar abren un vencimiento nuevo con su propio recordatorio.
- **FR-018**: «Sigue disponible» DEBE renovar esa publicación sin ingresar y con un solo toque, y
  mostrar hasta qué día sigue publicada. Sobre una vencida DEBE volver a publicarla. Sobre una
  pausada, adoptada o dada de baja NO DEBE cambiar nada y DEBE decir por qué y qué puede hacer desde
  Mis animales. Sin nivel 1 del publicador NO DEBE cambiar nada y DEBE decir que primero tiene que
  confirmar el teléfono. Abrirlo varias veces DEBE dar el mismo resultado que una.
- **FR-019**: El enlace de «Sigue disponible» DEBE servir solo para renovar ese animal, hasta 30
  días después de enviado el correo. NO DEBE poder adivinarse ni armarse a partir de otro, ni servir
  para ningún otro animal ni acción. Un enlace alterado, vencido o de un animal borrado DEBE decir que
  no sirve, con el camino a Mis animales, sin cambiar nada.
- **FR-020**: El enlace del correo NO DEBE mostrar ningún dato de la persona (ni su correo, ni su
  nombre, ni su cuenta), y la pantalla de resultado NO DEBE mostrar más que el nombre del animal, su
  estado y la fecha.
- **FR-021**: «Ya no está disponible» DEBE llevar a ese animal en Mis animales, pidiendo ingresar si
  hace falta y volviendo ahí después de ingresar.

#### La revisión

- **FR-022**: Toda publicación nueva DEBE salir a la vista en el momento y entrar a Publicaciones
  por revisar. Una revisada que su publicador edita DEBE volver a la lista marcada como editada, y
  seguir a la vista mientras tanto.
- **FR-023**: Publicaciones por revisar DEBE existir solo para quien administra; para cualquier
  otra persona, con sesión o sin ella, DEBE verse como una página que no existe. Quién administra se DEBE preguntar en cada acción: quien deja de administrar pierde
  el acceso en ese momento.
- **FR-024**: Quien administra DEBE ver de cada publicación sin revisar todas sus fotos y todos sus
  datos con la descripción completa, aunque no esté a la vista, el nombre, la foto y el nivel en
  palabras de quien publica, y desde cuándo espera. NO DEBE ver su teléfono, su correo ni su zona.
- **FR-025**: Quien administra DEBE poder marcar una publicación revisada o darla de baja con un
  motivo de la lista: fotos que no son del animal; venta o pedido de plata; no es un perro ni un
  gato; datos de contacto o una dirección en las fotos o en la descripción; u otro, con texto
  obligatorio de 1 a 300 caracteres.
- **FR-026**: Nadie DEBE poder resolver su propia publicación. Una publicación ya resuelta por otra
  persona que administra NO DEBE poder resolverse de nuevo, y quien la tenía abierta DEBE ver que ya
  se resolvió.
- **FR-027**: Dar de baja DEBE sacar la publicación del listado y de su enlace en el momento, y su
  publicador DEBE recibir un correo con el nombre del animal, el motivo y el correo de ayuda. El
  correo sale después de la baja: si falla, la baja no se deshace.
- **FR-028**: Mi perfil DEBE mostrar a quien administra el acceso a Publicaciones por revisar con
  cuántas esperan, sin contar las propias, o «Nada esperando».

#### Datos personales

- **FR-029**: De cada publicación se DEBEN guardar su estado, cuándo cambió por última vez, cuándo
  vence y si se mandó el recordatorio de ese vencimiento. De la revisión, quién la resolvió, cuándo y
  el motivo de una baja; eso lo DEBEN ver solo quienes administran. El publicador DEBE ver el motivo
  de la baja, nunca quién la decidió.
- **FR-030**: Borrar una publicación DEBE borrar sus fotos, sus datos y su revisión; borrar la cuenta
  DEBE borrar todo eso de todas sus publicaciones. No se DEBE guardar nada de quien adoptó.
- **FR-031**: Ninguna pantalla nueva DEBE indexarse: Publicaciones por revisar, el resultado de
  «Sigue disponible» y un animal en Mis animales son privadas; la ficha de una adoptada sigue la
  regla de la historia #57 hasta que exista el dominio definitivo.

#### Medición

- **FR-032**: El sitio DEBE medir, sin datos de la persona: cada cambio de estado (cuál, desde cuál
  y días desde que se publicó); cada renovación y desde dónde (el correo o Mis animales); cada
  publicación que vence sin renovar; cada vuelta a publicar y desde qué estado; cada publicación
  borrada y desde qué estado; cada recordatorio enviado; cada publicación revisada o dada de baja,
  con el motivo y las horas entre publicarse (o editarse) y resolverse.

### Key Entities *(include if feature involves data)*

- **Publicación** (existe, de #53): suma su estado (uno de cuatro), cuándo cambió por última vez,
  cuándo vence (nada mientras está pausada o adoptada), si se mandó el recordatorio de ese
  vencimiento, y si está dada de baja con su motivo.
- **Recordatorio**: el correo de un vencimiento de una publicación; su enlace de «Sigue disponible»
  sirve solo para ese animal y por 30 días. No guarda datos de la persona.
- **Revisión de una publicación**: si está sin revisar (nueva o editada) o resuelta, quién la
  resolvió y cuándo, y el motivo de una baja. La ven solo quienes administran; el motivo, también el
  publicador. Se borra con la publicación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cambiar el estado de un animal desde Mis animales lleva como mucho dos toques (abrir
  sus acciones y elegir; tres para borrar, con la confirmación), renovar uno que vence pronto lleva
  uno, y el cambio se ve en el listado y en su enlace en cuanto se recargan.
- **SC-002**: El 100 % de las publicaciones disponibles o en proceso que cumplen 30 días sin
  renovarse dejan de estar en el listado ese mismo día, sin que nadie haga nada.
- **SC-003**: Cada publicación que llega a sus últimos 7 días recibe exactamente un recordatorio,
  dentro de la hora; ninguna pausada, adoptada, vencida ni dada de baja recibe uno.
- **SC-004**: Renovar desde el correo lleva un toque y ningún ingreso, y deja siempre 30 días desde
  hoy, por más veces que se toque.
- **SC-005**: Una publicación dada de baja deja de verse en el listado, en su enlace y en su vista
  previa nueva en el mismo momento en que se confirma la baja.
- **SC-006**: Ningún intento de leer una publicación pausada, vencida, dada de baja o borrada, o la
  revisión de una publicación, desde una persona sin sesión o desde otra persona con sesión que no
  administra, devuelve dato alguno.
- **SC-007**: Quien administra ve cada publicación nueva en Publicaciones por revisar en cuanto se
  publica, y una publicación resuelta por una persona no puede resolverse por otra.
- **SC-008**: Durante la beta, se puede responder con lo medido qué parte de las publicaciones se
  renueva o vuelve a publicarse (¿el rescatista sigue usando el sitio por su cuenta?) y cuántos días
  pasan desde que se publica hasta que se marca adoptado.

## Assumptions

- Ya en `main` (Ready): el estado de una publicación con un solo valor y su fecha de publicación
  (#53); la pantalla de animal no disponible, sus casos y la vista previa de un animal que no se
  muestra (#57); el borrado de las fotos al borrar la cuenta (#53); quién administra, la revisión de
  identidad con su acceso y su cuenta en Mi perfil, y la regla de no resolver lo propio (#11). Esta
  spec los ensancha, no los rehace.
- La historia no tiene comentarios; su cuerpo editado el 2026-10-01 es la fuente. Las referencias
  como «docs/03 §2» y «KL-53-3» son a documentos del proyecto.
- #13 (reportar) aparece solo en «No incluye»: no bloquea esta historia. Twilio sin cuenta (KL-010)
  no afecta, porque solo se lee el nivel 1 que ya existe. Resend sin dominio propio (KL-006) solo
  entrega a la dirección de la cuenta del servicio: afecta probar los correos, no construirlos.
- **El vencimiento es un momento, no un día** (decisión de esta spec): 30 días exactos desde el
  último publicar, renovar, reanudar o volver a publicar. Mis animales y el correo dicen el día de
  Uruguay en que cae.
- **El recordatorio sale dentro de la hora** en que la publicación entra en sus últimos 7 días: el
  criterio de la historia es «cuando pasa ese día», y una hora llega mucho antes que el vencimiento.
- **El enlace de «Sigue disponible» dura 30 días desde enviado el correo** (decisión de esta spec):
  la historia pide que sirva también ya vencida; 30 días cubren los 7 que faltaban y 23 de vencida, y
  un enlace que no vence nunca sería una llave abierta para siempre sobre el animal.
- **«Sigue disponible» exige el nivel 1 del publicador**, como renovar desde Mis animales (regla de
  la historia: lo que pone un animal a la vista lo exige). El recordatorio sale igual a quien no lo
  tiene, porque le avisa que el animal va a vencer.
- **Volver a publicar cuenta como publicada hoy** (decisión de esta spec): una adopción que no
  funcionó o una vencida que vuelve es tan nueva para quien busca como una recién cargada, y como
  solo puede pasar después de 30 días o de una adopción, no sirve para subir el animal arriba cada
  rato. Renovar y reanudar no lo suben, para que renovar no sea la forma de ganar el primer lugar.
- **Una vencida puede marcarse adoptada directamente** (decisión de esta spec): «Ya no está
  disponible» lleva a marcarla adoptada aunque ya haya vencido, y medir los días hasta adoptado
  necesita esa marca.
- **Una vencida que vuelve a publicarse queda disponible** aunque hubiera vencido en proceso: es lo
  que la historia dice de «Volver a publicar».
- **Marcar disponible desde en proceso no exige nivel 1**: el animal ya estaba a la vista y su
  vencimiento no cambia; la regla de la historia apunta a lo que vuelve a poner un animal a la
  vista.
- **La pausada tiene su propio texto** en la pantalla de animal no disponible («Este animal está
  pausado por ahora»), como pide «Pantallas»; la de un publicador sin nivel 1 conserva el de #57.
  Cuando un animal está pausado y además su publicador no tiene nivel 1, gana el de pausada.
- **Los sellos concuerdan con el sexo del animal** («Adoptado»/«Adoptada»,
  «Pausado»/«Pausada»): es como lo escribe el rescatista; «En proceso» no cambia.
- **La vista previa de una adoptada no lleva la zona**: la historia nombra foto y nombre, y entre dos
  opciones razonables de privacidad se toma la que muestra menos (decisión 2026-09-28).
- **Una baja se decide solo desde Publicaciones por revisar**: la historia la ubica ahí, y una
  publicación revisada vuelve a la lista si se edita. Bajar una revisada que no cambió queda para la
  historia de reportes (#13) o el panel de M4.
- **El texto de «otro» tiene hasta 300 caracteres** y lo lee el publicador tal cual: un motivo
  explica una baja, no es un intercambio.
- **Publicaciones por revisar incluye las de cualquier estado** salvo dadas de baja y borradas: una
  pausada o una de un publicador sin nivel 1 puede volver a la vista sin pasar por otra revisión.
- **Quien administra ve las fotos de una publicación no visible solo mientras está sin revisar**:
  es lo que necesita para revisarla y nada más (Ley 18.331, lo mínimo).
- **El recordatorio que falla no se reintenta**: el vencimiento llega igual, y el animal vencido se
  vuelve a publicar con un toque.
- **El correo del recordatorio y el de baja salen en español**, como los demás correos del sitio.
- **Fuera de esta historia**, como dice su «No incluye»: el nivel mínimo que el publicador exige a
  quien solicita (M3); elegir a quién se entregó al marcar adoptado y el compromiso de adopción (M4);
  qué pasa con las solicitudes de un animal que se pausa, vence, se adopta o se borra (M3); retener
  una publicación hasta revisarla; reportar una publicación (se reporta a la persona, #13); ocultar lo
  de una cuenta suspendida (#13); apelar una baja desde el sitio; designar a quien administra desde el
  sitio; el panel de administración consolidado (M4); más de un recordatorio por vencimiento; avisos
  por WhatsApp o notificaciones del teléfono; una sección pública de animales adoptados; y que las
  fichas aparezcan en buscadores (M5).
- **No se mide el ingreso a «Ya no está disponible»** más allá de los cambios de estado que siguen:
  la historia mide el cambio de estado, no la navegación.
