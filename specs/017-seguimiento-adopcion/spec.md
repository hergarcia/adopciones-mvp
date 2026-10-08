# Feature Specification: Seguimiento a los 30 días de cada adopción y adopciones con seguimiento en el perfil

**Feature Branch**: `feature/69-seguimiento-30-dias-adopcion`

**Created**: 2026-10-08

**Status**: Draft

**Input**: Historia #69 del backlog, milestone «M4 - Cierre, seguimiento y admin». El cuerpo
verbatim de la historia acompaña a esta spec (`story.md`).

**Ya construido**: la adopción entre un animal, quien lo dio y la persona del sitio a la que se
entregó, con su compromiso, «Yo no adopté», el fin de la adopción al volver a publicar y el contacto
cortado por un bloqueo o una suspensión (historia #67); Mi solicitud y Mis solicitudes (historia
#63); Una solicitud, para el publicador (historia #65); Mis animales y volver a publicar (historia
#59); las fotos de la ficha y sus condiciones (historia #53); la ficha y quien publica en ella
(historia #57); el perfil público y los distintivos (historia #12); bloquear, suspender y la
pantalla de cuenta suspendida (historia #13); el envío de correos con la plantilla del sitio; y
cosas que el sitio ya hace solo una vez por día, sin que nadie las dispare (vencer publicaciones,
#59). Ya en main (Ready): nada del seguimiento. Esta spec suma
el seguimiento y el historial, y no rehace nada.

**Vocabulario de esta spec**:

- **La adopción**, **la persona que adoptó**, **quien lo dio**, **en curso**, **termina** (al volver
  a publicar), **se deshace** («Yo no adopté»), **el compromiso** (pendiente o aceptado) y **el
  contacto cortado** significan lo mismo que en la spec de la historia #67.
- **Mi solicitud**, **Mis solicitudes**, **Mis animales**, **Una solicitud, para el publicador**,
  **la ficha**, **el perfil público**, **distintivos**, **bloquear**, **cuenta suspendida** y
  **foto de portada** significan lo mismo que en las specs de las historias #12, #13, #53, #57, #59,
  #63 y #65.
- **El pedido de seguimiento** es la pregunta «¿Cómo va <nombre>?» que el sitio le hace una sola vez
  a la persona que adoptó. Está **pedido** desde el día en que se hace; **respondido** cuando ella
  manda **la respuesta**; **cerrado sin respuesta** si antes de responder la adopción termina, se
  deshace o hay un bloqueo entre las dos.
- **El día 30** de una adopción es el día del calendario en que se cumplen 30 días desde el día en
  que quien lo dio la marcó (por ejemplo, marcada el 1 de septiembre, el día 30 es el 1 de octubre).
- **Una adopción con seguimiento** es una adopción cuyo pedido fue respondido. Lleva **el sello
  «Adopción con seguimiento»**.
- **El historial** de una persona son dos números: cuántas adopciones con seguimiento **dio** (como
  quien lo dio) y cuántas **adoptó** (como la persona que adoptó).
- Toda fecha se calcula y se muestra en hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El sitio pide el seguimiento a los 30 días (Priority: P1)

Una rescatista marcó adoptado a Tobi eligiendo a Ana. Treinta días después, sin que nadie haga
nada, Ana recibe un solo correo con la foto de portada de Tobi, «¿Cómo va Tobi?» y «Contar cómo
va», que la lleva a Mi solicitud. Ese mismo día, la rescatista ve en Mis animales «Seguimiento
pedido el <fecha>, sin respuesta todavía». Si a Tobi lo había vuelto a publicar antes, o Ana había
dicho «Yo no adopté», o se habían bloqueado, o una de las dos cuentas estaba suspendida ese día, no
se pide nada. Si Tobi se fue con una vecina que no vino por el sitio, tampoco.

**Why this priority**: es el «seguimiento automático a los 30 días» de docs/03 §5 y lo que le
ahorra al rescatista perseguir a nadie por WhatsApp; las otras historias se apoyan en el pedido.

**Independent Test**: con adopciones sembradas a distintas edades y en distintos estados (en curso,
terminada, deshecha, con bloqueo, con una cuenta suspendida, por fuera del sitio): correr el día y
ver que solo la adopción en curso que cumple 30 días recibe un correo, uno solo, y que Mis animales
y Mi solicitud lo muestran; correrlo otra vez el mismo día y otro día después y ver que no sale
ningún otro.

**Acceptance Scenarios**:

1. **Dado** que marqué adoptado a Tobi eligiendo a Ana hace 30 días, **cuando** llega ese día,
   **entonces** Ana recibe un solo correo con la foto de Tobi, «¿Cómo va Tobi?» y «Contar cómo
   va», y en Mis animales veo «Seguimiento pedido el <fecha>, sin respuesta todavía».
2. **Dado** que Ana recibió el pedido, **cuando** sigue «Contar cómo va», **entonces** llega a Mi
   solicitud de Tobi (ingresando primero si no tenía la sesión abierta) y ve «¿Cómo va Tobi?» con
   el lugar para las fotos y el texto; en Mis solicitudes, su adopción dice «Contá cómo va».
3. **Dado** que la adopción de Tobi tiene menos de 30 días, **cuando** Ana abre Mi solicitud o yo
   abro Mis animales, **entonces** no se ve nada del seguimiento.
4. **Dado** que Ana nunca responde, **cuando** pasan 60 días desde la adopción, **entonces** no
   recibió ningún otro correo, en Mis animales sigue «sin respuesta todavía» y todavía puede
   responder desde Mi solicitud.
5. **Dado** que volví a publicar a Tobi a los 20 días porque Ana me lo devolvió, **cuando** se
   cumplen los 30, **entonces** Ana no recibe ningún pedido de seguimiento.
6. **Dado** que Ana dijo «Yo no adopté a Tobi», o una de las dos bloqueó a la otra, o Tobi o una de
   las dos cuentas se borró antes del día 30, **cuando** llega ese día, **entonces** no se pide
   nada.
7. **Dado** que di a Luna a alguien que no vino por el sitio, **cuando** se cumplen 30 días,
   **entonces** no se le pide seguimiento a nadie.
8. **Dado** que mi cuenta o la de Ana está suspendida el día 30, **cuando** llega ese día,
   **entonces** a Ana no se le pide el seguimiento, tampoco después si la cuenta se reactiva.
9. **Dado** que el correo del pedido no se pudo mandar, **cuando** Ana entra al sitio, **entonces**
   el pedido igual está hecho: Mi solicitud le ofrece contar cómo va y Mis animales lo dice.

---

### User Story 2 - La persona que adoptó cuenta cómo va y quien lo dio lo ve (Priority: P2)

Ana sigue el correo, sube 2 fotos de Tobi, escribe «Duerme en el sillón y ya no le tiene miedo a la
correa» y toca «Mandar». En Mi solicitud ve su respuesta con la fecha y el sello «Adopción con
seguimiento». La rescatista recibe un correo «Ana contó cómo va Tobi» con la primera foto y el
camino a Mis animales, donde ve las 2 fotos, el texto, la fecha y el sello. Si el compromiso de Ana
seguía pendiente, ya no se le ofrece «Yo no adopté a Tobi», y el compromiso sigue pendiente.

**Why this priority**: «el rescatista lo ve» y «si responde, badge» de docs/03 §5; es lo que
convierte el pedido en una prueba. Se apoya en US1.

**Independent Test**: con una adopción sembrada con el pedido hecho: responder sin foto, con 4
fotos, con un archivo que no es una foto, con la conexión cortada y bien; tocar dos veces
«Mandar»; ver la respuesta y el sello en Mi solicitud y en Mis animales, el correo a quien lo dio
(uno solo), que «Yo no adopté» ya no se ofrece y que el compromiso no cambió; volver al enlace del
correo y no ver cómo mandar otra.

**Acceptance Scenarios**:

1. **Dado** que Ana abre el correo, **cuando** sube 2 fotos, escribe «Duerme en el sillón y ya no
   le tiene miedo a la correa» y toca «Mandar», **entonces** ve su respuesta con la fecha y el
   sello «Adopción con seguimiento» en Mi solicitud, y yo recibo un correo «Ana contó cómo va Tobi»
   con la primera foto y el camino a Mis animales, sin el texto de la respuesta ni el teléfono de
   nadie.
2. **Dado** que Ana respondió, **cuando** abro Tobi en Mis animales, **entonces** veo las 2 fotos,
   el texto, la fecha y el sello «Adopción con seguimiento»; en Una solicitud, para el publicador,
   la de Ana lleva el mismo sello.
3. **Dado** que Ana sube una foto y no escribe nada, **cuando** toca «Mandar», **entonces** se
   manda: el texto es opcional.
4. **Dado** que el compromiso de Ana seguía pendiente, **cuando** responde el seguimiento,
   **entonces** ya no se le ofrece «Yo no adopté a Tobi» y el compromiso sigue pendiente, con
   «Acepto el compromiso» todavía a la vista.
5. **Dado** que Ana toca dos veces «Mandar», **cuando** termina, **entonces** queda una sola
   respuesta y yo recibo un solo correo.
6. **Dado** que Ana ya respondió, **cuando** vuelve al enlace del correo, **entonces** ve su
   respuesta y no la opción de mandar otra, ni de cambiarla.
7. **Dado** que Ana toca «Mandar» sin ninguna foto, **cuando** lo intenta, **entonces** se le dice
   que hace falta al menos una foto, y lo escrito queda.
8. **Dado** que Ana elige 4 fotos o un archivo que no es una foto, **cuando** lo sube,
   **entonces** se le dice que son hasta 3 fotos y cuál no se pudo usar, y conserva las que sí.
9. **Dado** que se corta la conexión, **cuando** Ana toca «Mandar», **entonces** no se manda nada,
   se le dice que no se pudo por la conexión, conserva las fotos y el texto y puede reintentar; si
   el primer intento sí había llegado, el reintento no manda otra respuesta ni otro correo y ve la
   que llegó.
10. **Dado** que abro el enlace del seguimiento de una adopción que no es mía, **cuando** carga,
    **entonces** veo que no existe, igual que si no existiera.
11. **Dado** que la cuenta de Ana está suspendida, **cuando** intenta responder, **entonces** no
    puede, y ve lo mismo que #13 le muestra a una cuenta suspendida.
12. **Dado** que Ana no tiene hoy el teléfono verificado, **cuando** responde, **entonces** puede.

---

### User Story 3 - El historial de adopciones con seguimiento en el perfil, la ficha y la solicitud (Priority: P3)

La rescatista dio 3 animales por el sitio y 2 tienen el seguimiento respondido. Quien abre su perfil
público o la ficha de uno de sus animales ve «2 adopciones con seguimiento», sin nombres de animales
ni de personas. En el perfil público de Ana se ve que adoptó 1 con seguimiento. Cuando Ana manda
otra solicitud, a otro rescatista, él ve junto a su nombre que adoptó 1 con seguimiento. Quien no
tiene ninguna no muestra ningún número, ni un cero.

**Why this priority**: es el historial de docs/03 §1, la única señal de confianza que no se
consigue con un documento y lo que #12 dejó para esta historia. Se apoya en US2.

**Independent Test**: con personas sembradas con 0, 1 y varias adopciones con seguimiento, como
quien dio y como quien adoptó, y con adopciones sin respuesta, cerradas sin respuesta, terminadas
después de responder y con un bloqueo después de responder: abrir sus perfiles públicos sin sesión,
la ficha de un animal de cada una y una solicitud de cada una para el publicador, y ver los números
correctos, sin animales ni personas, y nada donde son cero.

**Acceptance Scenarios**:

1. **Dado** que di 3 animales por el sitio y 2 tienen el seguimiento respondido, **cuando**
   alguien abre mi perfil público o la ficha de un animal mío, **entonces** ve «2 adopciones con
   seguimiento», sin nombres de animales ni de personas; y en el perfil de Ana ve que adoptó 1 con
   seguimiento.
2. **Dado** que Ana adoptó 1 con seguimiento, **cuando** manda una solicitud por otro animal y el
   publicador la abre, **entonces** ve junto al nombre de Ana que adoptó 1 con seguimiento.
3. **Dado** que una persona no tiene adopciones con seguimiento, **cuando** se abre su perfil
   público, su ficha o su solicitud, **entonces** no aparece ningún número de adopciones, ni un
   cero.
4. **Dado** que una persona dio adopciones con seguimiento y también adoptó, **cuando** se abre su
   perfil público, **entonces** ve los dos números, cada uno con lo que dice («dio» o «adoptó»).
5. **Dado** que Ana respondió y después me devolvió a Tobi, **cuando** lo vuelvo a publicar,
   **entonces** la respuesta sigue a la vista de las dos y las dos seguimos contando esa adopción
   con seguimiento.
6. **Dado** que una adopción tiene el pedido hecho y sin responder, o se cerró sin respuesta,
   **cuando** se abre cualquier perfil, **entonces** no cuenta en ninguno.
7. **Dado** que Ana adoptó con seguimiento y después borra su cuenta, o yo borro a Tobi o mi cuenta,
   **cuando** se abre mi perfil o el de Ana, **entonces** esa adopción ya no cuenta.

---

### User Story 4 - Lo que le pasa al seguimiento cuando la adopción termina, se deshace o hay un bloqueo (Priority: P4)

A Ana se le pidió el seguimiento y no respondió. A los 40 días le devuelve a Tobi a la rescatista,
que lo vuelve a publicar: Mi solicitud de Ana ya no le ofrece contar cómo va, en Mis animales la
rescatista ve «Seguimiento sin respuesta» y esa adopción no cuenta en ningún perfil. En otra
adopción, Diego respondió y después la rescatista lo bloquea: ella ya no ve lo que mandó Diego, y la
adopción sigue contando con seguimiento en los dos perfiles.

**Why this priority**: fotos de un animal que ya no está con esa persona no le dicen nada al
rescatista, y un bloqueo pide mostrar menos (docs/03 §5, decisión 2026-10-08). Se apoya en US1-US3.

**Independent Test**: con un pedido sin respuesta: volver a publicar el animal, decir «Yo no
adopté» en otro y bloquear en un tercero, y ver que no se puede responder, que Mis animales dice
«Seguimiento sin respuesta» y que no cuenta; con una respuesta mandada: bloquear desde cada lado y
ver quién ve qué, el sello y los números.

**Acceptance Scenarios**:

1. **Dado** que a Ana se le pidió el seguimiento y no respondió, **cuando** a los 40 días me
   devuelve a Tobi y lo vuelvo a publicar, **entonces** Mi solicitud de Ana ya no le ofrece contar
   cómo va, en Mis animales veo «Seguimiento sin respuesta» y esa adopción no cuenta en ningún
   perfil.
2. **Dado** que a Ana se le pidió el seguimiento y no respondió, **cuando** dice «Yo no adopté a
   Tobi» o una de las dos bloquea a la otra, **entonces** el pedido se cierra igual, sin respuesta.
3. **Dado** que Ana respondió, **cuando** después la bloqueo, o ella me bloquea, **entonces**
   ninguna de las dos ve más lo que mandó la otra: yo dejo de ver las fotos, el texto y la fecha de
   Ana, y la adopción sigue con el sello y contando con seguimiento en los dos perfiles.
4. **Dado** que el pedido se cerró sin respuesta, **cuando** Ana vuelve al enlace del correo,
   **entonces** ve su solicitud como quedó, sin la opción de responder.
5. **Dado** que Ana tenía Mi solicitud abierta con las fotos elegidas y el pedido se cerró mientras
   tanto, **cuando** toca «Mandar», **entonces** no se manda nada, se le dice que ya no se puede
   contar cómo va y ve su solicitud como quedó.

---

### Edge Cases

- **El día 30 se calcula por calendario en hora de Uruguay**: una adopción marcada a las 23:50 del
  1 de septiembre tiene su día 30 el 1 de octubre, igual que una marcada a las 0:10.
- **Si el día 30 el sitio no pudo hacer el pedido** (por ejemplo, estuvo caído), se hace el primer
  día después en que pueda, una sola vez, y siempre que la adopción siga en las condiciones de pedir
  ese día. Nunca se piden dos.
- **Las adopciones marcadas antes de esta historia** cuentan desde el día en que se marcaron: las
  que ya pasaron su día 30 reciben el pedido la primera vez que corre, si siguen en las condiciones
  de pedir. El sitio todavía no salió (docs/04) y esos datos son de prueba.
- **Una cuenta que se reactiva después del día 30**: el pedido que no se hizo no se hace después.
- **Quien lo dio está suspendido después del pedido**: Ana puede responder igual (la regla de
  cierre es terminar, deshacer o bloquear); el correo de aviso no le llega a una cuenta suspendida, y
  si la reactivan ve la respuesta en Mis animales.
- **La persona que adoptó está suspendida después del pedido**: no puede responder mientras dure;
  si la reactivan, puede responder, si el pedido sigue abierto.
- **El contacto cortado por una suspensión** (#67) no cierra el pedido: lo cierran solo terminar,
  deshacer o bloquear.
- **Responder con el compromiso ya aceptado**: se puede; no cambia el compromiso.
- **Responder después de que la adopción terminó, se deshizo o hubo un bloqueo** (desde una
  pantalla vieja): no se manda nada, no sale correo y se ve el estado de ahora.
- **Desbloquear después de un bloqueo**: no vuelve a abrir un pedido cerrado ni a mostrar lo que
  mandó la otra; el bloqueo deja el seguimiento como quedó, igual que el contacto en #67.
- **El animal vuelve a publicarse y se adopta otra vez**: es una adopción nueva, con su propio
  pedido a los 30 días; la anterior queda como quedó, respondida o no.
- **Una persona adopta dos veces al mismo publicador**: cada adopción tiene su pedido y cuenta por
  separado.
- **Un animal sin foto de portada en el momento de mandar un correo**: no pasa; una publicación
  tiene al menos una foto (#53). La foto es la de portada al mandarlo.
- **Una de las dos cambia su nombre o el animal cambia de nombre**: las pantallas y los correos
  muestran el nombre de hoy.
- **Fotos de la respuesta**: los mismos formatos y el mismo tope de tamaño que las fotos de la ficha
  (#53); una foto que no cumple se rechaza sola, nombrándola, y las otras quedan.
- **El texto de la respuesta**: hasta 500 caracteres, con la cuenta de lo que queda; no se puede
  escribir más. Un texto solo de espacios cuenta como sin texto.
- **Dos pestañas de Ana mandan a la vez**: queda la primera que llega; la otra no manda nada, no
  sale otro correo y ve la respuesta que quedó.
- **Ana llega desde el correo con otra cuenta abierta**: ve que la solicitud no existe, igual que si
  no existiera.
- **Quien administra**: es una persona más; no ve las fotos ni el texto de las respuestas ajenas.
  Lo que esté mal se reporta (#13) como cualquier otra cosa.
- **Un correo que no se pudo mandar**: lo que se hizo queda hecho igual; la persona lo ve en el
  sitio. No se reintenta mandar ni se recuerda.
- **El perfil público de una cuenta suspendida o la ficha de un animal que no está a la vista**: se
  ven como ya dicen #13 y #57; el historial no cambia eso.
- **Una adopción por fuera del sitio** no tiene pedido ni cuenta en ningún número.
- **Una adopción que se deshizo con «Yo no adopté»** nunca cuenta, aunque se hubiera pedido el
  seguimiento: un pedido respondido saca «Yo no adopté», así que no puede tener respuesta.

## Pantallas

En todas: el **cargando** de una pantalla con datos es un esqueleto con su forma; el **error al
cargar** dice que no se pudo traer y ofrece «Reintentar»; cada **acción** muestra que está
trabajando en su botón, no se puede tocar dos veces y, si falla, dice qué pasó y deja reintentar
sin perder lo elegido ni lo escrito. Mi solicitud, Mis solicitudes, Mis animales y Una solicitud,
para el publicador, son privadas y no se encuentran en buscadores; el perfil público y la ficha
siguen como están (sin indexarse hasta el dominio definitivo).

- **Mi solicitud** (cambia, de #63 y #67): con el pedido hecho y abierto, «¿Cómo va <nombre>?» con
  el lugar para elegir de 1 a 3 fotos (cada una con su vista previa y cómo sacarla), el texto
  opcional con la cuenta de los 500 caracteres y «Mandar»; respondido, la respuesta (las fotos, el
  texto si hay y la fecha) con el sello «Adopción con seguimiento», sin forma de mandar otra ni de
  cambiarla; cerrado sin respuesta, nada del seguimiento. Después de un bloqueo, la persona que
  adoptó sigue viendo su propia respuesta. Vacío: antes del día 30, o con la adopción terminada o
  deshecha sin pedido, no muestra nada del seguimiento.
- **Mis animales** y la pantalla de un animal (cambian, de #59 y #67): en un adoptado a una
  persona, «Seguimiento pedido el <fecha>, sin respuesta todavía»; respondido, las fotos, el texto,
  la fecha y el sello «Adopción con seguimiento» (después de un bloqueo, solo el sello); cerrado sin
  respuesta, «Seguimiento sin respuesta». Si el animal se volvió a publicar, la pantalla del animal
  sigue mostrando el seguimiento de su última adopción a una persona (respondido o «Seguimiento sin
  respuesta») hasta que se adopte otra vez; la lista de Mis animales, solo el del animal adoptado.
  Vacío: antes del día 30, en una adopción por fuera del sitio, en una que se deshizo o terminó sin
  pedido, no muestra nada del seguimiento.
- **Mis solicitudes** (cambia, de #63 y #67): «Contá cómo va» en una adopción con el pedido hecho
  y sin responder, que lleva a Mi solicitud. Vacío: el de #63.
- **Una solicitud, para el publicador** (cambia, de #65 y #67): junto al nombre de quien la mandó,
  cuántas adopciones con seguimiento adoptó. En la elegida de una adopción (#67), el seguimiento
  como en Mis animales (pedido, respondido con fotos, texto, fecha y sello, o sin respuesta),
  también después de que la adopción terminó: es donde #67 deja a la vista una adopción terminada.
  Vacío: sin ninguna, no muestra el número; antes del día 30, nada del seguimiento.
- **Perfil público** (cambia, de #12): cuántas adopciones con seguimiento dio y cuántas adoptó, cada
  número solo si es 1 o más, con singular y plural («1 adopción», «2 adopciones»), sin animales ni
  personas. Vacío: sin ninguna, no muestra la línea.
- **Ficha de un animal** (cambia, de #57): junto a quien publica, cuántas adopciones con seguimiento
  dio. Vacío: sin ninguna, no muestra el número.
- **Correos**: «¿Cómo va <nombre>?» (a la persona que adoptó, el día 30), con la foto de portada y
  «Contar cómo va», que lleva a Mi solicitud con ingreso si hace falta; «<nombre de quien adoptó>
  contó cómo va <animal>» (a quien lo dio, al responder), con la primera foto de la respuesta y el
  camino a Mis animales. Ninguno lleva el teléfono de nadie ni el texto de la respuesta. Vacío: no
  aplica.

## Requirements *(mandatory)*

### Functional Requirements

#### El pedido

- **FR-001**: El sitio pide el seguimiento solo, sin que nadie lo dispare, una sola vez por
  adopción, a la persona que adoptó, el día 30 de la adopción.
- **FR-002**: El pedido se hace solo si ese día la adopción sigue en curso (no terminó ni se
  deshizo), el animal y las dos cuentas existen, no hay un bloqueo entre las dos y ninguna de las
  dos cuentas está suspendida. Si no se cumple, no se hace nunca, aunque la condición cambie
  después.
- **FR-003**: Si el pedido no se pudo hacer el día 30, se hace el primer día después en que se
  pueda, con las condiciones de FR-002 de ese día. Nunca hay dos pedidos para una adopción.
- **FR-004**: Las adopciones por fuera del sitio no tienen pedido.
- **FR-005**: Al hacer el pedido, la persona que adoptó recibe un solo correo con la foto de
  portada del animal, «¿Cómo va <nombre>?» y «Contar cómo va», que la lleva a Mi solicitud de esa
  adopción, con ingreso si hace falta. No hay recordatorios ni un segundo pedido.
- **FR-006**: Se guarda el día en que se hizo el pedido, y Mis animales lo muestra a quien lo dio
  («Seguimiento pedido el <fecha>, sin respuesta todavía»).

#### La respuesta

- **FR-010**: La respuesta es de 1 a 3 fotos y, si quiere, un texto de hasta 500 caracteres. Sin
  al menos una foto no se manda.
- **FR-011**: Las fotos cumplen las mismas condiciones de formato y tamaño que las fotos de la ficha
  (#53). Una que no las cumple, o que pasa de 3, se rechaza diciendo cuál y por qué, y las que sí
  cumplen quedan elegidas.
- **FR-012**: Solo la persona que adoptó responde, y solo el pedido de su adopción, mientras el
  pedido esté abierto y su cuenta no esté suspendida. No hace falta tener el teléfono verificado.
- **FR-013**: Se responde una sola vez y la respuesta no se edita, no se borra ni se le suman
  fotos. Tocar dos veces «Mandar», reintentar o mandar desde dos pestañas deja una sola respuesta y
  manda un solo correo.
- **FR-014**: Si no se pudo mandar (la conexión, un error), no queda nada mandado, se dice por qué y
  se conservan las fotos elegidas y el texto para reintentar.
- **FR-015**: Se puede responder cualquier día después del pedido, sin plazo, mientras el pedido
  siga abierto.
- **FR-016**: Al responder, quien lo dio recibe un correo «<nombre de quien adoptó> contó cómo va
  <animal>», con la primera foto de la respuesta y el camino a Mis animales, salvo que su cuenta
  esté suspendida en ese momento.
- **FR-017**: Una respuesta convierte esa adopción en «Adopción con seguimiento» para las dos
  personas y le saca a la persona que adoptó «Yo no adopté» (#67), si el compromiso seguía
  pendiente. No acepta el compromiso por ella: «Acepto el compromiso» sigue ofreciéndose como en
  #67.

#### Cuando el pedido se cierra

- **FR-020**: Un pedido abierto se cierra sin respuesta si la adopción termina (el animal vuelve a
  publicarse), se deshace con «Yo no adopté» o una de las dos bloquea a la otra. Cerrado, ya no se
  puede responder, Mi solicitud deja de ofrecerlo, Mis solicitudes deja de decir «Contá cómo va» y
  Mis animales dice «Seguimiento sin respuesta».
- **FR-021**: Un pedido cerrado no se vuelve a abrir: ni desbloquear, ni reactivar una cuenta, ni
  nada después lo reabre.
- **FR-022**: La suspensión de una de las dos cuentas no cierra el pedido ni cambia quién ve una
  respuesta ya mandada; mientras la cuenta de la persona que adoptó está suspendida, no puede
  responder (FR-012), y quien tiene la cuenta suspendida ve solo la pantalla de #13.
- **FR-023**: Una adopción que termina después de tener respuesta sigue siendo «Adopción con
  seguimiento» y sigue contando; la respuesta sigue a la vista de las dos.

#### Lo que se ve y quién lo ve

- **FR-030**: Mi solicitud muestra el pedido abierto con la forma de responder, o la respuesta
  mandada con sus fotos, su texto, su fecha y el sello; antes del día 30 o sin pedido, nada del
  seguimiento.
- **FR-031**: Mis animales y la pantalla de un animal muestran, en un adoptado a una persona, el
  pedido sin responder con su fecha, la respuesta con sus fotos, su texto, su fecha y el sello, o
  «Seguimiento sin respuesta»; antes del día 30, sin pedido o por fuera del sitio, nada del
  seguimiento. Si el animal se volvió a publicar, la pantalla del animal sigue mostrando el
  seguimiento de su última adopción a una persona hasta que se adopte otra vez. Una solicitud, para
  el publicador, muestra el mismo seguimiento en la elegida de cada adopción, en curso o terminada.
- **FR-032**: Mis solicitudes dice «Contá cómo va» en una adopción con el pedido abierto.
- **FR-033**: Las fotos y el texto de una respuesta los ven solo las dos personas de esa adopción.
  Nunca los ven la ficha, el perfil público, el listado, otra persona con sesión, otras solicitantes
  del mismo animal, quien administra ni un visitante, por ningún camino.
- **FR-034**: Si después de responder una de las dos bloquea a la otra (#13), quien lo dio deja de
  ver las fotos, el texto y la fecha de la respuesta, por cualquier camino; la persona que adoptó
  sigue viendo su propia respuesta. El sello y los números quedan como estaban, y desbloquear no lo
  vuelve a mostrar.
- **FR-035**: El enlace del seguimiento de una adopción que no es de quien mira se ve como algo que
  no existe.
- **FR-036**: Una cuenta suspendida que intenta responder o abrir Mi solicitud ve la pantalla de
  cuenta suspendida de #13.

#### El historial

- **FR-040**: El perfil público (#12) de cada persona muestra cuántas adopciones con seguimiento dio
  y cuántas adoptó, cada número solo si es 1 o más, sin decir qué animales ni con quién.
- **FR-041**: La ficha (#57) muestra, junto a quien publica, cuántas adopciones con seguimiento dio,
  solo si es 1 o más.
- **FR-042**: Una solicitud, para el publicador (#65), muestra junto a quien la mandó cuántas
  adopciones con seguimiento adoptó, solo si es 1 o más.
- **FR-043**: Cuenta como adopción con seguimiento toda adopción con respuesta, sin juzgar lo que
  dice, aunque después haya terminado o haya habido un bloqueo. No cuentan los pedidos sin
  responder, los cerrados sin respuesta ni las adopciones por fuera del sitio.
- **FR-044**: Los números son los de hoy: borrar la cuenta de la persona que adoptó, el animal o la
  cuenta de quien lo dio saca esa adopción de los dos números.

#### Datos personales

- **FR-050**: Se guarda, de cada adopción, el día en que se hizo el pedido, las fotos y el texto de
  la respuesta y cuándo se mandó. Nada más.
- **FR-051**: Lo de FR-050 lo pueden leer solo las dos personas de esa adopción, con la excepción
  de FR-034. Los números del historial son lo único que se ve fuera de ellas.
- **FR-052**: Ningún correo lleva el teléfono, el correo ni el texto de la respuesta de nadie.
- **FR-053**: Borrar la cuenta de la persona que adoptó borra su respuesta, con sus fotos, junto con
  la solicitud y la adopción (#67); borrar el animal o la cuenta de quien lo dio la borra también.

#### Medición

- **FR-060**: Se mide: seguimiento pedido; seguimiento respondido (días desde el pedido, cuántas
  fotos, con texto o sin); respuesta abierta por quien lo dio (la primera vez que la ve en Mis
  animales); y seguimientos que no se pidieron el día 30 porque la adopción terminó, se deshizo, hubo
  un bloqueo, la persona que adoptó borró su cuenta o una cuenta estaba suspendida. Una adopción que
  desapareció con el animal o con la cuenta de quien lo dio no deja nada que medir.
- **FR-061**: Ningún evento lleva el nombre, el teléfono, las fotos, el texto ni otros datos de las
  personas.

### Key Entities *(include if feature involves data)*

- **Seguimiento**: de una adopción (#67), el día en que se pidió y si está abierto, respondido o
  cerrado sin respuesta.
- **Respuesta**: de un seguimiento, sus 1 a 3 fotos (en el orden en que se eligieron), el texto
  opcional y cuándo se mandó.
- **Historial**: de una persona, cuántas adopciones con seguimiento dio y cuántas adoptó; se deriva
  de las adopciones y sus respuestas, no se carga a mano.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas, cada adopción en curso y en condiciones de pedir recibe un
  pedido, uno solo, el día 30 (o el primer día después en que se pueda), y ninguna otra adopción
  recibe ninguno, aunque el día corra más de una vez.
- **SC-002**: La persona que adoptó responde desde el correo en no más de 3 toques además de elegir
  las fotos y escribir: abrir el enlace, elegir las fotos y «Mandar».
- **SC-003**: En el 100 % de los intentos de prueba, un visitante, otra persona con sesión, otra
  solicitante o quien administra no pueden leer las fotos ni el texto de una respuesta ajena, y
  quien lo dio no los lee después de un bloqueo.
- **SC-004**: En el 100 % de los intentos de prueba, un doble toque, un reintento o dos pestañas no
  dejan dos respuestas ni mandan dos correos.
- **SC-005**: Ningún correo de prueba contiene un teléfono, un correo ni el texto de una respuesta.
- **SC-006**: En el 100 % de las pruebas, los números del perfil público, la ficha y la solicitud
  coinciden con las adopciones respondidas de esa persona, y no aparece ningún número cuando es
  cero.
- **SC-007**: La medición permite calcular, por semana, qué parte de los seguimientos pedidos fue
  respondida y en cuántos días, sin ningún dato de las personas.

## Assumptions

- Ya en main (Ready): nada del seguimiento. La adopción, el compromiso, «Yo no adopté», el fin de la
  adopción y el contacto cortado vienen de #67; el sitio ya tiene una tarea diaria que corre sola y
  el envío de correos.
- La historia no tiene comentarios; su cuerpo, con las «Decisiones del enjambre» (la última del
  2026-10-08), es la fuente. «500» es el largo del texto y «18.331» la Ley 18.331; las referencias
  como «docs/03 §5» son a documentos del proyecto.
- **Decisiones del enjambre**: las siete de la historia se copian palabra por palabra a docs/03 §5
  en esta rama. La del historial dice «Va en docs/03 §1 y §5»: va en §5 junto a las otras, como hizo
  #67 con una de «§4 y §5», y §1 no se duplica (su línea de perfil público ya nombra el historial).
- **Si el día 30 no se pudo pedir, se pide el primer día después** (decisión de esta spec): la
  tarea diaria puede no correr un día; perder el pedido para siempre por eso sería peor que hacerlo
  un día tarde, y nunca se hacen dos.
- **Las condiciones de pedir se miran el día en que se hace el pedido** y una que falla ese día no
  se recupera después (decisión de esta spec): es lo que dice la historia para la suspensión («ese
  día») y lo más simple para las demás.
- **La suspensión no cierra un pedido abierto** (decisión de esta spec): la historia nombra solo
  terminar, deshacer y bloquear como cierre; la persona que adoptó suspendida no responde mientras
  dure, y a quien lo dio suspendido no le llega el correo, pero ve la respuesta si lo reactivan.
- **Después de un bloqueo, la persona que adoptó sigue viendo su propia respuesta** y quien lo dio
  deja de verla (decisión de esta spec): la historia dice «cada una deja de ver lo que mandó la
  otra», y quien lo dio no mandó nada en el seguimiento. Desbloquear no la vuelve a mostrar, como el
  contacto en #67 (ante la duda, lo que muestra menos, Ley 18.331).
- **Las fotos de la respuesta siguen las condiciones de las de la ficha** (#53, decisión
  2026-09-26: los mismos formatos y 10 MB) y se procesan igual al subir; no se pide una regla nueva.
- **«Contar cómo va» lleva a Mi solicitud**, como dice la historia; no hay una pantalla aparte del
  seguimiento.
- **El correo de aviso a quien lo dio** lleva la primera foto de la respuesta y no el texto, como
  dicen los datos personales de la historia.
- **Dónde ve quien lo dio el seguimiento de una adopción terminada** (decisión de esta spec): la
  historia pide que la respuesta siga a la vista de las dos después de volver a publicar y que Mis
  animales diga «Seguimiento sin respuesta» en ese caso, pero un animal publicado otra vez ya no es
  un adoptado en Mis animales. La pantalla del animal muestra el seguimiento de su última adopción a
  una persona hasta que se adopte otra vez, y Una solicitud, para el publicador, lo muestra en la
  elegida de cada adopción, que es donde #67 deja a la vista una adopción terminada con su
  compromiso.
- **Los números van con singular y plural** y dicen si son «dio» o «adoptó»; el texto exacto lo
  decide el plan con docs/06 y docs/10.
- **«Respuesta abierta por quien lo dio»** se mide la primera vez que la ve en Mis animales o en la
  pantalla del animal.
- **Las adopciones marcadas antes de esta historia** reciben su pedido la primera vez que corre el
  día, si ya pasaron su día 30 y siguen en condiciones (FR-003): son datos de prueba.
- **Fuera de esta historia**, como dice su alcance: recordatorios, un segundo seguimiento, que el
  rescatista pida o cargue un seguimiento, editar o borrar una respuesta o sumarle fotos, comentar,
  reaccionar o puntuar, mostrar las fotos en la ficha o el perfil público o compartirlas, juzgar la
  respuesta, seguimientos de adopciones por fuera del sitio, la encuesta después de adoptar, el
  panel de quien administra, avisos por WhatsApp o del teléfono y el traspaso del chip.
