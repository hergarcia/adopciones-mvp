# Feature Specification: Responder las solicitudes de un animal y hablar por WhatsApp al aceptar

**Feature Branch**: `feature/65-responder-solicitudes-whatsapp`

**Created**: 2026-10-07

**Status**: Draft

**Input**: Historia #65 del backlog, milestone «M3 - Solicitud de adopción». El cuerpo verbatim de
la historia acompaña a esta spec (`story.md`).

**Ya construido**: la solicitud con su cuestionario, el límite de 3 activas, retirar, Mis
solicitudes y Mi solicitud, y el cierre de una solicitud cuando el animal se adopta, se borra o se
da de baja, o cuando una de las dos personas retira, bloquea o es suspendida, con su motivo de
cierre (historia #63); la detección de un teléfono, un correo, un enlace o una red social en un
texto libre, con su explicación (historias #53 y #63); el teléfono verificado, el aviso de
verificación pendiente y la pérdida del número cuando lo recupera otra cuenta (historias #10 y #25);
el perfil público con sus distintivos, desde donde se reporta o se bloquea (historias #12 y #13); Mis
animales con en proceso, pausa, adopción y borrado (historia #59); la portada con sus pasos «Si
rescatás» y «Si querés adoptar» (historia #61); el envío de correos con la plantilla del sitio. En
el sitio no existe todavía nada de lo que el publicador hace con una solicitud: la bandeja, aceptar,
rechazar, preguntar, revelar el contacto ni los correos de una solicitud. Hoy una solicitud la lee
solo quien la mandó (KL-63-1). Esta spec suma la otra mitad y no rehace nada.

**Vocabulario de esta spec**:

- **Solicitud**, **quien solicita**, **el publicador**, **respuestas**, **cuestionario**,
  **activa**, **retirada**, **cerrada**, **motivo de cierre**, **Mis solicitudes**, **Mi solicitud**
  y **recibe solicitudes** significan lo mismo que en la spec de la historia #63.
- Una solicitud activa está **esperando respuesta** hasta que el publicador la **acepta** o la
  **rechaza**. Una **aceptada** sigue activa. Una **rechazada** está cerrada con un **motivo de
  rechazo** que ve solo el publicador; a quien solicitó se le dice **no aceptada**.
- **Dejar sin efecto** es lo que hace el publicador con una aceptada que no se concretó: queda
  rechazada.
- La bandeja **Solicitudes** es la lista de los animales del publicador que recibieron solicitudes;
  **Solicitudes de un animal** es la lista de las de uno; **Una solicitud** es la pantalla donde el
  publicador la lee y la responde.
- Una solicitud es **nueva** mientras espera respuesta y el publicador nunca la abrió.
- Una **pregunta** es lo que el publicador escribe al **pedir más información**; quien solicitó la
  **contesta** una vez. Una pregunta sin contestar está **esperando respuesta de quien solicitó**.
- El **contacto** de una persona en una solicitud es su nombre y el teléfono verificado que tiene
  hoy. El correo de una persona no es contacto y no se muestra nunca.
- **Abrir WhatsApp** abre una conversación de WhatsApp con el teléfono del contacto y un mensaje
  ya escrito.
- **Publicación**, **ficha**, **a la vista**, **en proceso**, **pausada**, **vencida**, **adoptada**,
  **borrada**, **dada de baja**, **bloquear**, **cuenta suspendida**, **distintivos**, **perfil
  público** y **aviso de verificación pendiente** significan lo mismo que en las specs de las
  historias #10, #12, #13, #53, #57 y #59.
- Toda fecha y todo conteo de días se calculan en hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver las solicitudes, aceptar una y hablar por WhatsApp (Priority: P1)

Una rescatista publicó a Tobi. Ana lo solicita y a la rescatista le llega un correo que la lleva a
Solicitudes, donde Tobi aparece con «1 nueva». Abre la solicitud y ve a Ana: su nombre, su foto, su
zona, sus distintivos, cuántos días lleva esperando y todo lo que contestó. Toca «Aceptar»; la
confirmación le dice que las dos van a ver el teléfono de la otra. Confirma y ve el nombre y el
teléfono de Ana con «Abrir WhatsApp», y se le ofrece marcar a Tobi «En proceso». Ana recibe un
correo; en Mi solicitud ve el nombre y el teléfono de la rescatista y «Abrir WhatsApp», que abre la
conversación con un mensaje que nombra a Tobi y dice de dónde viene.

**Why this priority**: es el corazón del producto (docs/03 §4): el momento en que la verificación
paga y la herramienta que le ahorra al rescatista entrevistar a cada interesado. Es el paso
«aceptado» del funnel (docs/03 §7) y la tercera métrica de éxito. Cierra KL-63-1. Sin esto, las
demás respuestas no tienen dónde vivir.

**Independent Test**: con una publicadora sembrada con el teléfono verificado, un animal suyo
disponible y una persona con el teléfono verificado que lo solicita: ver el correo de solicitud
nueva y seguir su enlace; ver el animal en Solicitudes con «1 nueva» y en Mis animales con su
conteo; abrir la solicitud y ver el perfil, los distintivos, los días esperando y las respuestas;
aceptar y confirmar; ver el contacto de quien solicitó con «Abrir WhatsApp» y la oferta de «En
proceso»; con quien solicitó, ver el correo de aceptada y el contacto de la publicadora en Mi
solicitud; comprobar el mensaje que arma «Abrir WhatsApp»; con una tercera persona, no ver nada de
eso.

**Acceptance Scenarios**:

1. **Dado** que publiqué a Tobi y Ana lo solicitó, **cuando** llega su solicitud, **entonces**
   recibo un correo que me lleva a Solicitudes, donde Tobi aparece con «1 nueva», y al abrirla veo
   el nombre, la foto, la zona y los distintivos de Ana, el enlace a su perfil público, la fecha,
   cuántos días lleva esperando y todas sus respuestas.
2. **Dado** que abrí la solicitud de Ana, **cuando** toco «Aceptar», **entonces** se me pide
   confirmar con un texto que dice que las dos vamos a ver el teléfono de la otra; si cancelo, no
   cambia nada.
3. **Dado** que confirmé aceptar a Ana, **cuando** termina, **entonces** veo su nombre, su teléfono
   y «Abrir WhatsApp», y se me ofrece marcar a Tobi «En proceso» con un toque; Ana recibe un correo
   y en Mi solicitud ve mi nombre, mi teléfono y «Abrir WhatsApp».
4. **Dado** que Ana fue aceptada, **cuando** toca «Abrir WhatsApp», **entonces** se abre una
   conversación con mi número y un mensaje ya escrito que nombra a Tobi y dice de dónde viene; lo
   mismo al revés cuando lo toco yo.
5. **Dado** que se me ofreció marcar a Tobi «En proceso», **cuando** no lo toco, **entonces** Tobi
   sigue disponible; **cuando** lo toco, queda en proceso como si lo hubiera marcado desde Mis
   animales.
6. **Dado** que acepté a Ana y a Diego para Tobi, **cuando** Diego abre su solicitud,
   **entonces** ve mi teléfono y nunca el de Ana.
7. **Dado** que Ana todavía espera respuesta, **cuando** ella o cualquier otra persona miran su
   solicitud, mi ficha o mi perfil, **entonces** nadie ve mi teléfono ni mi correo, y yo no veo el
   teléfono ni el correo de Ana.
8. **Dado** que tengo animales y ninguno recibió solicitudes, **cuando** abro Solicitudes,
   **entonces** veo «Todavía no recibiste solicitudes.» con el camino a Mis animales (o a publicar,
   si no tengo ninguno).
9. **Dado** que Tobi no recibió solicitudes, **cuando** abro sus solicitudes, **entonces** veo
   «Nadie solicitó a Tobi todavía.» con el enlace a su ficha para compartir.
10. **Dado** que no publiqué a Tobi, **cuando** abro el enlace de sus solicitudes o de una de ellas,
    **entonces** veo que no existe, igual que si no existiera.
11. **Dado** que Ana retiró su solicitud mientras yo la miraba, **cuando** toco «Aceptar»,
    **entonces** no se acepta, veo «Ana ya no sigue con esta solicitud» y nadie ve el teléfono de
    nadie.
12. **Dado** que cambié de número y todavía no confirmé el nuevo, **cuando** toco «Aceptar»,
    **entonces** veo el aviso de verificación pendiente con el camino para verificarlo y la vuelta a
    la solicitud, y puedo rechazar o preguntar.
13. **Dado** que Ana dejó de tener un teléfono verificado, **cuando** abro su solicitud,
    **entonces** «Aceptar» dice que Ana tiene que volver a verificar su teléfono antes de poder
    aceptarla, y puedo rechazar o preguntar.
14. **Dado** que acepté a Ana, **cuando** cambio de número y confirmo el nuevo, **entonces** Ana ve
    mi número nuevo; si mi número lo recupera otra cuenta, Ana ve que no tengo un teléfono
    verificado ahora, y no el número viejo, y no ve «Abrir WhatsApp».
15. **Dado** que Tobi tiene 2 solicitudes nuevas sin abrir, **cuando** llega una tercera,
    **entonces** no recibo otro correo; después de abrir Solicitudes, la próxima nueva de Tobi me
    manda uno.
16. **Dado** que Tobi está pausado o vencido, **cuando** abro la solicitud de Ana, **entonces**
    puedo aceptarla, rechazarla o preguntarle algo.

---

### User Story 2 - Rechazar con un motivo y dejar sin efecto una aceptación (Priority: P2)

La rescatista abre la solicitud de Bruno, que trabaja diez horas por día. Toca «Rechazar», elige
«pasaría mucho tiempo solo» y confirma. La solicitud queda rechazada y ella ve el motivo. Bruno
recibe un correo; en Mis solicitudes ve que no fue aceptada, sin el motivo, con el camino a Animales
en adopción, y le queda un lugar libre. En la ficha de Tobi ya no ve «Quiero adoptar». Días después,
la adopción con Ana no se concreta: la rescatista deja la aceptación sin efecto con «la adopción no
se concretó», y ninguna de las dos ve más el teléfono de la otra.

**Why this priority**: el motivo del rechazo es el «dato clave» de docs/03 §4, y rechazar es lo que
libera el lugar de quien solicitó; dejar sin efecto es la salida de una aceptación que falló. Se
apoya en US1.

**Independent Test**: con una publicadora y tres solicitudes de personas sembradas a un mismo
animal: rechazar una con un motivo de la lista y otra con «otro» y su línea; ver el motivo del lado
de la publicadora y no del otro; ver los correos de no aceptada; ver que las rechazadas liberan un
lugar y que la ficha les dice «Tu solicitud no fue aceptada»; aceptar la tercera y dejarla sin
efecto; ver que el contacto desaparece de las dos pantallas.

**Acceptance Scenarios**:

1. **Dado** que abrí la solicitud de Bruno, **cuando** toco «Rechazar», elijo «pasaría mucho tiempo
   solo» y confirmo, **entonces** la solicitud queda rechazada con ese motivo a mi vista; Bruno
   recibe un correo y en Mis solicitudes ve que no fue aceptada, sin el motivo, con el camino a
   Animales en adopción, y deja de contar entre sus activas.
2. **Dado** que elegí «otro», **cuando** rechazo sin escribir la línea, **entonces** no se rechaza
   y se me marca que falta; con la línea escrita, se rechaza y la línea la veo solo yo.
3. **Dado** que escribí un teléfono, un correo o un enlace en la línea de «otro», **cuando** confirmo,
   **entonces** no se rechaza, se marca la línea y se me explica que el contacto se da cuando la
   solicitud se acepta.
4. **Dado** que Bruno fue rechazado, **cuando** abre la ficha de Tobi, **entonces** ve «Tu
   solicitud no fue aceptada», no «Quiero adoptar», y no puede volver a solicitar a Tobi.
5. **Dado** que acepté a Ana y la adopción no se concretó, **cuando** toco «Dejar sin efecto»,
   elijo «la adopción no se concretó» y confirmo, **entonces** ninguna de las dos ve más el
   teléfono de la otra; Ana recibe un correo, ve que su solicitud no fue aceptada y deja de contar
   entre sus activas.
6. **Dado** que toqué «Rechazar» o «Dejar sin efecto», **cuando** cancelo, **entonces** no cambia
   nada.
7. **Dado** que Ana retiró su solicitud mientras yo elegía el motivo, **cuando** confirmo el
   rechazo, **entonces** no se rechaza, veo «Ana ya no sigue con esta solicitud» y no sale ningún
   correo.

---

### User Story 3 - Pedir más información y que quien solicitó conteste (Priority: P3)

La rescatista lee la solicitud de Carla y duda del balcón. Toca «Pedir más información», escribe
«¿El balcón tiene red en todos lados?» y la envía. Carla recibe un correo, ve en Mi solicitud la
pregunta y la contesta. A la rescatista le llega un correo y ve la respuesta debajo de la pregunta.
Puede preguntar hasta tres veces, de a una.

**Why this priority**: es lo que reemplaza la entrevista por WhatsApp antes de dar el teléfono, sin
construir un chat (docs/03 §Fuera del MVP). Se apoya en US1; sin ella se puede aceptar o rechazar
igual.

**Independent Test**: con una publicadora y una solicitud esperando respuesta: enviar una pregunta;
con quien solicitó, ver el correo, la pregunta en Mi solicitud y el estado «te preguntaron algo» en
Mis solicitudes; contestarla; ver el correo y la respuesta del lado de la publicadora; hacer tres
preguntas y ver que no se ofrece una cuarta; intentar mandar un celular en una pregunta y en una
respuesta.

**Acceptance Scenarios**:

1. **Dado** que abrí la solicitud de Carla, **cuando** pido más información con «¿El balcón tiene
   red en todos lados?», **entonces** Carla recibe un correo, en Mis solicitudes la ve como «te
   preguntaron algo» y en Mi solicitud ve la pregunta y la contesta; yo recibo un correo y veo la
   respuesta debajo de la pregunta.
2. **Dado** que mi pregunta espera respuesta, **cuando** abro la solicitud de Carla, **entonces** no
   se me ofrece otra pregunta hasta que conteste, y puedo aceptar o rechazar igual.
3. **Dado** que ya le hice 3 preguntas a Carla, **cuando** abro su solicitud, **entonces** no se me
   ofrece preguntar otra vez; puedo aceptar o rechazar.
4. **Dado** que escribo un celular en una pregunta, **cuando** toco «Enviar pregunta», **entonces**
   no se manda, se marca y se me explica que el contacto se da cuando la solicitud se acepta.
5. **Dado** que Carla escribe un correo en su respuesta, **cuando** la envía, **entonces** no se
   manda, se marca y se le explica lo mismo; lo escrito sigue en pantalla.
6. **Dado** que Carla contestó, **cuando** vuelve a Mi solicitud, **entonces** ve la pregunta con
   su respuesta y no puede cambiarla.
7. **Dado** que Carla no tiene preguntas, **cuando** abre Mi solicitud, **entonces** no ve esa
   parte.

---

### User Story 4 - Lo que les pasa a las solicitudes cuando cambia el animal o una de las personas (Priority: P4)

La rescatista aceptó a Ana y Tobi se va con ella: lo marca adoptado. La solicitud de Ana se cierra
como que Tobi encontró hogar y las dos siguen viendo el teléfono de la otra, porque la adopción
está en marcha. Las que esperaban respuesta se cierran, y cada persona recibe un correo. Otra
adoptante, que había solicitado, bloquea a la rescatista: la rescatista ve «Ana ya no sigue con esta
solicitud», igual que si la hubiera retirado, sin acciones y sin correo.

**Why this priority**: sin esto, la bandeja muestra solicitudes muertas, el contacto queda a la
vista cuando ya no debe y quien solicitó no se entera de que el animal se fue. Se apoya en US1 y en
los cierres de #63.

**Independent Test**: con una publicadora, un animal y solicitudes esperando respuesta y aceptadas:
marcarlo adoptado y ver que la aceptada se cierra con el contacto a la vista y las demás se cierran
sin él, con un correo para cada una; borrar otro animal y ver los correos de «ya no está publicado»,
la solicitud cerrada sin contacto y el enlace de un correo viejo; hacer que quien solicitó retire,
bloquee o sea suspendida y ver el mismo texto del lado de la publicadora, sin correo y sin contacto;
hacer que la publicadora bloquee y ver «se cerró por tu bloqueo».

**Acceptance Scenarios**:

1. **Dado** que acepté a Ana, **cuando** marco adoptado a Tobi, **entonces** su solicitud se cierra
   como que Tobi encontró hogar y las dos seguimos viendo el teléfono de la otra; las que esperaban
   respuesta se cierran sin mostrar contacto, y cada persona con una solicitud cerrada recibe un
   correo.
2. **Dado** que Tobi se borró, **cuando** abro una de sus solicitudes desde un correo viejo,
   **entonces** veo que la solicitud está cerrada porque Tobi ya no está publicado, sin acciones.
3. **Dado** que Ana me bloqueó después de solicitar a Tobi, **cuando** abro su solicitud,
   **entonces** veo «Ana ya no sigue con esta solicitud», igual que si la hubiera retirado, sin
   acciones, y no recibo ningún correo.
4. **Dado** que bloqueé a Ana, **cuando** abro su solicitud, **entonces** veo que se cerró por mi
   bloqueo, y Ana la ve cerrada porque Tobi ya no recibe solicitudes; no sale ningún correo.
5. **Dado** que acepté a Ana, **cuando** ella retira la solicitud, me bloquea, la bloqueo o una de
   las dos cuentas se suspende, **entonces** ninguna ve más el teléfono de la otra.
6. **Dado** que la solicitud de Ana se cerró porque Tobi encontró hogar, **cuando** abro su
   solicitud, **entonces** no hay acciones: no se acepta, no se rechaza ni se pregunta.

---

### User Story 5 - La portada cuenta cómo se pide y cuándo se da el contacto (Priority: P5)

Un visitante entra a la portada. En «Si querés adoptar» lee que un animal se pide con un
cuestionario corto y que el teléfono de las dos personas se da recién cuando quien publicó acepta.
En «Si rescatás» lee que las solicitudes de cada animal llegan a un solo lugar, con la verificación
y las respuestas de cada persona, y que se acepta o se rechaza con un toque.

**Why this priority**: es la promesa entera que la portada no podía hacer hasta esta historia
(decisión 2026-10-06); no cambia nada de lo que se puede hacer. Se apoya en US1 y US2, que la hacen
verdad.

**Independent Test**: abrir la portada sin sesión y con sesión y leer los dos pasos nuevos.

**Acceptance Scenarios**:

1. **Dado** que soy un visitante sin sesión, **cuando** abro la portada, **entonces** leo, en «Si
   querés adoptar», que se pide con un cuestionario y que el teléfono se da recién al aceptar, y en
   «Si rescatás», que las solicitudes llegan a un solo lugar.

---

### Edge Cases

- **Tocar dos veces «Aceptar», «Rechazar», «Dejar sin efecto», «Enviar pregunta» o «Enviar
  respuesta», o reintentar después de un corte que sí llegó**: se hace una sola vez y sale un solo
  correo; la segunda ve el resultado de la primera.
- **Dos pestañas del publicador responden la misma solicitud a la vez** (una acepta y otra
  rechaza): gana la primera que llega; la otra ve el estado en que quedó, sin cambiarlo.
- **Aceptar una solicitud que ya está aceptada o rechazada** (pantalla vieja): no cambia nada y se
  ve el estado actual.
- **Rechazar mientras hay una pregunta esperando respuesta**: se puede; la pregunta queda sin
  contestar y quien solicitó ya no puede contestarla.
- **Aceptar mientras hay una pregunta esperando respuesta**: se puede; quien solicitó todavía puede
  contestarla mientras la solicitud siga aceptada.
- **Preguntar después de aceptar**: no se ofrece; lo que falta se habla por WhatsApp.
- **Contestar una pregunta de una solicitud que se cerró o se rechazó mientras escribía**: no se
  manda, se ve el estado nuevo y lo escrito sigue en pantalla.
- **Una pregunta o una respuesta de solo espacios**: cuenta como vacía y no se manda.
- **Texto de 500 caracteres en una pregunta o una respuesta, o de 200 en la línea de «otro»**: se ve
  cuánto queda; no se puede escribir más allá del límite.
- **Elegir «otro», escribir la línea y después elegir otro motivo**: la línea no se guarda.
- **El publicador pierde el teléfono verificado después de aceptar** (otra cuenta recupera su
  número): quien fue aceptada ve que no tiene un teléfono verificado ahora, sin el número viejo y sin
  «Abrir WhatsApp»; si vuelve a verificar uno, lo ve. La solicitud sigue aceptada.
- **Quien fue aceptada pierde el teléfono verificado**: lo mismo, del lado del publicador.
- **El publicador cambia su nombre después de aceptar**: el contacto muestra el nombre de hoy.
- **Un animal con más de una aceptada**: cada aceptada ve solo el contacto del publicador; el
  publicador ve el de cada una en su solicitud.
- **Ofrecer «En proceso» con el animal pausado, vencido, ya en proceso o adoptado**: no se ofrece;
  se ofrece solo cuando el animal está disponible.
- **Tocar «En proceso» cuando el animal cambió mientras tanto**: no cambia nada y se ve el estado del
  animal.
- **El animal pausado o vencido con solicitudes**: siguen en la bandeja y se responden igual; quien
  solicitó ve la nota de «no está disponible por ahora» de #63.
- **Quien solicitó retira una solicitud nueva sin abrir**: deja de contar como nueva y como esperando
  respuesta; el publicador la ve con «Ana ya no sigue con esta solicitud».
- **El animal recibe una solicitud nueva cuando el publicador no abrió Solicitudes desde la última
  nueva de ese animal**: no sale correo; abrir Solicitudes o las solicitudes de ese animal vuelve a
  habilitar el correo de la próxima nueva de ese animal. Las nuevas de otro animal sí mandan correo.
- **Quien solicitó que fue rechazada (o dejada sin efecto) quiere volver a solicitar ese animal**:
  no puede, aunque el animal se vuelva a publicar; puede solicitar otros.
- **Quien solicitó retira una aceptada**: se cierra como retirada (#63), el contacto deja de verse
  para las dos y no sale correo.
- **Desbloquear después de un bloqueo que cerró una aceptada**: no la reabre ni vuelve a mostrar el
  contacto.
- **Reactivar una cuenta suspendida**: las solicitudes que se cerraron siguen cerradas y sin
  contacto.
- **El animal adoptado vuelve a publicarse**: las solicitudes cerradas por la adopción siguen
  cerradas; las que estaban aceptadas siguen mostrando el contacto.
- **El publicador borra su cuenta**: sus animales se borran y sus solicitudes se cierran con «ya no
  está publicado» (#63), cada una con su correo; el contacto deja de verse.
- **Quien solicitó borra su cuenta**: sus solicitudes, sus respuestas, las preguntas que le hicieron
  y sus contestaciones, y el motivo del rechazo se borran; desaparecen de la bandeja del publicador
  y de los conteos.
- **Una solicitud de un animal borrado o dado de baja, del lado del publicador**: se ve cerrada
  porque el animal ya no está publicado, con el nombre que tenía, sin el perfil, las respuestas ni el
  contacto de quien la mandó, y sin acciones; el animal ya no aparece en Solicitudes.
- **Un correo que no se pudo mandar**: la respuesta del publicador queda hecha igual; la persona la
  ve en el sitio.
- **El enlace de un correo abierto sin sesión**: lleva a ingresar y vuelve a esa solicitud.
- **El enlace de un correo abierto con otra cuenta**: se ve como una solicitud que no existe.
- **Quien administra**: es una persona más; no ve solicitudes ajenas, ni sus motivos ni sus
  preguntas.
- **El publicador bloqueado por quien solicitó** abre el perfil público de esa persona desde una
  solicitud vieja: ve lo que #13 ya muestra en ese caso.
- **El publicador con la cuenta suspendida**: ve la pantalla de cuenta suspendida de #13, no la
  bandeja; las solicitudes a sus animales ya se cerraron con «ya no está publicado» (#63).
- **«Abrir WhatsApp» en un dispositivo sin WhatsApp**: abre la versión web de WhatsApp con el
  mismo número y mensaje; el teléfono queda escrito en pantalla para copiarlo.
- **El publicador es la persona que solicita**: no puede pasar; no se solicita un animal propio
  (#63).

## Pantallas

En todas: el **cargando** de una pantalla con datos es un esqueleto con su forma; el **error al
cargar** dice que no se pudo traer y ofrece «Reintentar»; cada **acción** muestra que está
trabajando en su botón, no se puede tocar dos veces y, si falla, dice qué pasó y deja reintentar
sin perder lo elegido ni lo escrito. Todas las pantallas del publicador y de quien solicitó son
privadas y no se encuentran en buscadores.

- **Solicitudes** (nueva, desde el menú de la cuenta, «Mi perfil» y Mis animales): mis animales que
  recibieron solicitudes, cada uno con su foto, su nombre, cuántas esperan respuesta y cuántas son
  nuevas; primero los que tienen nuevas, después los que tienen alguna esperando respuesta, y
  después los demás, cada grupo por la solicitud más reciente. Vacío: «Todavía no recibiste
  solicitudes.», con el camino a Mis animales, o a publicar si no tengo ninguno.
- **Solicitudes de un animal** (nueva): el nombre y la foto del animal y el enlace a su ficha; las
  que esperan respuesta primero, la más vieja arriba, después las aceptadas y después las cerradas;
  cada una con la foto y el nombre de quien la mandó, sus distintivos, la fecha, los días esperando
  (si espera respuesta), si es nueva, su estado en palabras y, para comparar de un vistazo,
  sus respuestas de vivienda, patio o balcón y horas solo. Vacío: «Nadie solicitó a Tobi
  todavía.», con el enlace a su ficha para compartir.
- **Una solicitud, para el publicador** (nueva): quien la mandó (nombre, foto, zona, distintivos,
  enlace a su perfil público), la fecha y los días esperando, sus respuestas pregunta por pregunta,
  las preguntas con sus respuestas, y según el estado: esperando respuesta, «Aceptar», «Rechazar» y
  «Pedir más información» (este último solo si corresponde); aceptada, el contacto con «Abrir
  WhatsApp» y «Dejar sin efecto»; rechazada, el motivo; cerrada, por qué en palabras («Ana ya no
  sigue con esta solicitud», «se cerró por tu bloqueo», «Tobi encontró hogar», «Tobi ya no está
  publicado») y el contacto solo si estaba aceptada y Tobi encontró hogar. Vacío: sin preguntas, no
  muestra esa parte.
- **Aceptar**: una confirmación que dice que las dos personas van a ver el teléfono de la otra, con
  «Aceptar» / «Cancelar»; al salir bien, el contacto y la oferta de marcar el animal «En proceso».
- **Rechazar** y **Dejar sin efecto**: la lista de motivos para elegir uno, con la línea de «otro»
  cuando corresponde, que dice que el motivo lo ve solo quien publicó, con «Rechazar» (o «Dejar sin
  efecto») / «Cancelar».
- **Pedir más información**: el texto de la pregunta con cuánto queda y la explicación de que el
  contacto se da al aceptar, con «Enviar pregunta» / «Cancelar».
- **Mis animales** (cambia, de #59): cuántas solicitudes nuevas tiene cada animal y el camino a sus
  solicitudes. Vacío: no aplica.
- **Mi solicitud** (cambia, de #63): el estado en palabras (esperando respuesta, te preguntaron
  algo, aceptada, no aceptada, retirada, cerrada con su motivo); la pregunta para contestar, con su
  texto y «Enviar respuesta»; las preguntas anteriores con sus respuestas; aceptada, el nombre, el
  teléfono y «Abrir WhatsApp» de quien publicó; no aceptada, el camino a Animales en adopción.
  Vacío: no aplica.
- **Mis solicitudes** (cambia, de #63): los estados esperando respuesta, te preguntaron algo,
  aceptada y no aceptada, además de los de #63. Vacío: el de #63.
- **Ficha de un animal** (cambia, de #63): «Tu solicitud no fue aceptada» para quien fue
  rechazado, en lugar de «Quiero adoptar», con el camino a Animales en adopción. Vacío: no aplica.
- **Portada** (cambia, de #61): un paso más en «Si querés adoptar» y otro en «Si rescatás». Vacío:
  no aplica; los pasos no dependen de que haya animales.
- **Correos**: al publicador, solicitud nueva y respuesta a tu pregunta; a quien solicitó, aceptada,
  no aceptada, te preguntaron algo, encontró hogar y ya no está publicado. Cada uno nombra al animal
  y lleva a la solicitud en el sitio. Vacío: no aplica.

## Requirements *(mandatory)*

### Functional Requirements

#### La bandeja

- **FR-001**: Solo quien publicó un animal ve sus solicitudes. Para cualquier otra persona, quien
  administra incluida, la bandeja de ese animal y cada una de sus solicitudes se ven como algo que
  no existe.
- **FR-002**: Solicitudes muestra los animales del publicador que recibieron al menos una solicitud
  y que no se borraron ni se dieron de baja, con cuántas esperan respuesta y cuántas son nuevas, en
  el orden de la pantalla.
- **FR-003**: Solicitudes de un animal muestra las que esperan respuesta primero, de la más vieja a
  la más nueva; después las aceptadas y después las cerradas, cada grupo de la más vieja a la más
  nueva.
- **FR-004**: Cada solicitud muestra el nombre, la foto, la zona y los distintivos de hoy de quien
  la mandó (#12), el enlace a su perfil público (desde donde se reporta o se bloquea, #13), la
  fecha, cuántos días lleva esperando mientras espera respuesta (días de calendario desde que se
  mandó; «hoy» el mismo día, «1 día» al siguiente), y sus respuestas.
- **FR-005**: Una solicitud es nueva mientras espera respuesta y el publicador no la abrió nunca;
  abrirla la deja de marcar como nueva para siempre.
- **FR-006**: Mis animales muestra, en cada animal, cuántas solicitudes nuevas tiene y el camino a
  sus solicitudes.
- **FR-007**: El publicador puede responder las solicitudes de un animal disponible, en proceso,
  pausado o vencido. Una solicitud retirada o cerrada no se responde.

#### Aceptar y el contacto

- **FR-010**: Aceptar pide una confirmación que dice que las dos personas van a ver el teléfono de
  la otra.
- **FR-011**: Para aceptar, las dos personas tienen que tener hoy el teléfono verificado. Si falta
  el del publicador, ve el aviso de verificación pendiente de #10 con la vuelta a la solicitud; si
  falta el de quien solicitó, «Aceptar» dice que esa persona tiene que volver a verificar su
  teléfono antes de poder aceptarla. En los dos casos se puede rechazar y preguntar.
- **FR-012**: Al aceptar, quien solicitó ve el contacto de quien publicó y quien publicó ve el de
  quien solicitó, cada uno con «Abrir WhatsApp». Antes de aceptar, ninguno ve el teléfono ni el
  correo del otro. El correo de nadie se muestra nunca, en ninguna pantalla ni correo.
- **FR-013**: El contacto muestra siempre el teléfono verificado que la persona tiene hoy. Si hoy
  no tiene uno, dice que no tiene un teléfono verificado ahora, sin el número anterior y sin «Abrir
  WhatsApp».
- **FR-014**: «Abrir WhatsApp» abre una conversación con el teléfono del contacto y un mensaje ya
  escrito en el idioma del sitio que nombra al animal y dice que viene de una solicitud en el
  sitio; el de quien solicitó dice que su solicitud fue aceptada, y el del publicador que acepta su
  solicitud. Ningún mensaje lleva respuestas, motivos ni datos que no sean el nombre del animal y el
  de quien escribe.
- **FR-015**: Un animal puede tener más de una solicitud aceptada. Cada persona aceptada ve solo el
  contacto del publicador, nunca el de otra solicitante.
- **FR-016**: Una solicitud aceptada sigue activa y cuenta entre las 3 de quien solicitó (#63).
- **FR-017**: Después de aceptar, si el animal está disponible, se ofrece marcarlo «En proceso»
  (#59) con un toque; no se marca solo.
- **FR-018**: El contacto se ve mientras la solicitud está aceptada, o cerrada porque el animal se
  marcó adoptado estando aceptada. En cualquier otro estado no lo ve ninguna de las dos.

#### Rechazar y dejar sin efecto

- **FR-020**: Rechazar pide elegir un motivo de esta lista: elegí a otra persona · la vivienda no
  es adecuada para este animal · pasaría mucho tiempo solo · no se compromete a castrarlo · no
  convive bien con los animales o las personas de la casa · no contestó lo que le pregunté · otro.
  «Otro» pide una línea obligatoria de hasta 200 caracteres.
- **FR-021**: El motivo y la línea de «otro» los ve solo quien publicó. A quien solicitó se le dice
  que su solicitud no fue aceptada, con el camino a Animales en adopción.
- **FR-022**: Rechazar cierra la solicitud y libera su lugar entre las 3 activas de quien solicitó.
- **FR-023**: Quien fue rechazado no puede volver a solicitar ese animal, aunque se vuelva a
  publicar; su ficha le muestra «Tu solicitud no fue aceptada» en lugar de «Quiero adoptar».
- **FR-024**: Una solicitud aceptada se puede dejar sin efecto eligiendo un motivo de la lista de
  FR-020 más «la adopción no se concretó». Queda rechazada, con FR-021 a FR-023, y el contacto deja
  de verse para las dos.

#### Pedir más información

- **FR-030**: Mientras una solicitud espera respuesta, el publicador puede escribir una pregunta de
  hasta 500 caracteres, y quien solicitó la contesta una sola vez, con hasta 500 caracteres. Una
  respuesta enviada no se cambia.
- **FR-031**: Hay como máximo 3 preguntas por solicitud, y una sola esperando respuesta de quien
  solicitó a la vez. Cuando no se puede preguntar, «Pedir más información» no se ofrece.
- **FR-032**: Mientras una pregunta espera respuesta, el publicador puede aceptar o rechazar igual.
  Quien solicitó puede contestar mientras la solicitud esté activa; si se cierra, la pregunta queda
  sin contestar.
- **FR-033**: Las preguntas y sus respuestas quedan en la solicitud, a la vista solo de las dos
  personas, en el orden en que se hicieron.
- **FR-034**: Las preguntas, las respuestas y la línea de «otro» no pueden tener un teléfono, un
  correo, un enlace ni una red social: no se mandan, se marca el texto y se explica, igual que en el
  cuestionario (#63), que el contacto se da cuando la solicitud se acepta. Un texto de solo espacios
  cuenta como vacío.

#### Lo que cambia con el animal y con las personas

- **FR-040**: Cuando las solicitudes se cierran porque el animal se adoptó, se borró o se dio de
  baja (#63), ya no se responden. Una que estaba aceptada cuando el animal se marcó adoptado sigue
  mostrando el contacto de las dos personas.
- **FR-041**: Retirar una solicitud (#63), bloquear (#13) o suspender una cuenta (#13) la cierra, y
  si estaba aceptada el contacto deja de verse para las dos.
- **FR-042**: Quien publicó ve con el mismo texto, «<nombre> ya no sigue con esta solicitud», una
  solicitud que se cerró porque quien la mandó la retiró, lo bloqueó o fue suspendida, sin decir
  cuál. Si quien bloqueó fue el publicador, ve que se cerró por su bloqueo, y quien la mandó la ve
  cerrada porque el animal ya no recibe solicitudes (#63).
- **FR-043**: Una solicitud de un animal borrado o dado de baja se ve, para el publicador, cerrada
  porque el animal ya no está publicado, con el nombre que tenía, sin el perfil, las respuestas ni
  el contacto de quien la mandó, y sin acciones.
- **FR-044**: Cualquier respuesta del publicador que llega cuando la solicitud ya cambió de estado
  (retirada, cerrada, ya aceptada o ya rechazada) no cambia nada, no manda correo y muestra el
  estado actual; si la solicitud se cerró por retiro, bloqueo o suspensión de quien la mandó, con el
  texto de FR-042.

#### Mi solicitud, Mis solicitudes y la ficha

- **FR-050**: Mis solicitudes y Mi solicitud muestran, además de los estados de #63: esperando
  respuesta, te preguntaron algo (cuando hay una pregunta sin contestar), aceptada y no aceptada.
- **FR-051**: Mi solicitud muestra la pregunta para contestar, las preguntas anteriores con sus
  respuestas, y, aceptada (o cerrada porque el animal encontró hogar estando aceptada), el contacto
  de quien publicó con «Abrir WhatsApp».
- **FR-052**: Una solicitud aceptada se puede retirar como cualquier activa (#63).

#### Correos

- **FR-060**: Al publicador le llega un correo cuando recibe una solicitud nueva, salvo que ese
  animal ya tenga otra solicitud nueva que llegó después de la última vez que el publicador abrió
  Solicitudes o las solicitudes de ese animal; y cuando le contestan una pregunta.
- **FR-061**: A quien solicitó le llega un correo cuando su solicitud se acepta, se rechaza o se
  deja sin efecto (el de no aceptada), cuando le preguntan algo, y cuando se cierra porque el
  animal encontró hogar o ya no está publicado.
- **FR-062**: Retirar, bloquear y suspender no mandan correo a nadie, tampoco a las personas cuyas
  solicitudes se cierran por eso.
- **FR-063**: Ningún correo lleva el teléfono, las respuestas, las preguntas, el motivo del rechazo
  ni el correo de nadie: nombra al animal y lleva a la solicitud en el sitio.
- **FR-064**: Tocar dos veces «Aceptar», «Rechazar», «Dejar sin efecto», «Enviar pregunta» o
  «Enviar respuesta» hace una sola cosa y manda un solo correo. Que un correo no salga no deshace la
  respuesta.

#### La portada

- **FR-070**: La portada suma, en «Si querés adoptar», que una solicitud se pide con un
  cuestionario corto y que el teléfono de las dos personas se da recién cuando quien publicó la
  acepta; y en «Si rescatás», que las solicitudes de cada animal llegan a un solo lugar, con la
  verificación y las respuestas de cada persona, y que se acepta o se rechaza con un toque.

#### Datos personales

- **FR-080**: Se guarda el estado de cada solicitud y cuándo cambió, si el publicador la abrió, el
  motivo del rechazo y su línea, y las preguntas y respuestas. Nada más.
- **FR-081**: El motivo del rechazo lo puede leer solo quien publicó; las preguntas y respuestas,
  solo las dos personas; el contacto, solo la otra persona de una solicitud en FR-018. Un
  visitante, otra persona con sesión, otra solicitante del mismo animal o quien administra no
  pueden leer nada de eso por ningún camino.
- **FR-082**: Borrar la cuenta de quien solicitó borra sus solicitudes con todo lo de FR-080 (#63).
- **FR-083**: El teléfono de una persona nunca se guarda copiado en una solicitud: se lee del
  teléfono verificado de hoy cada vez que se muestra.

#### Medición

- **FR-090**: Se mide: bandeja abierta; solicitud abierta por primera vez (horas desde que llegó);
  primera respuesta del publicador (horas desde que llegó y cuál fue: aceptar, rechazar o
  preguntar); aceptada; rechazada (con el motivo, sin la línea de «otro»); pregunta enviada;
  pregunta contestada (horas desde que se hizo); aceptación dejada sin efecto (con el motivo);
  «Abrir WhatsApp» tocado (por quien publicó o por quien solicitó); animal marcado «En proceso»
  desde la oferta.
- **FR-091**: Ningún evento lleva el teléfono, las respuestas, las preguntas, la línea de «otro» ni
  datos de la persona.

### Key Entities *(include if feature involves data)*

- **Solicitud** (de #63, se amplía): suma los estados aceptada y rechazada, cuándo la abrió el
  publicador por primera vez, el motivo del rechazo y su línea, y cuándo cambió.
- **Pregunta**: a qué solicitud pertenece, su texto, cuándo se hizo, su respuesta y cuándo se
  contestó.
- **Última vez que el publicador abrió Solicitudes**: por animal, para decidir si sale el correo de
  solicitud nueva.
- **Motivo de rechazo**: uno de la lista de FR-020 y FR-024, con la línea de «otro».

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un publicador llega del correo de solicitud nueva a ver el contacto de la persona
  aceptada en no más de 4 toques después de ingresar, y en no más de 1 minuto si ya leyó las
  respuestas.
- **SC-002**: En el 100 % de los intentos de prueba, nadie ve el teléfono de una persona antes de
  aceptar, después de dejar sin efecto, retirar, bloquear o suspender; una solicitante aceptada
  nunca ve el contacto de otra; y nadie ve el correo de nadie.
- **SC-003**: En el 100 % de los intentos de prueba, quien solicitó no puede leer el motivo de su
  rechazo, y un visitante, otra persona o quien administra no pueden leer respuestas, preguntas ni
  motivos ajenos.
- **SC-004**: En el 100 % de las pruebas, un número que la persona ya no tiene verificado no se
  muestra nunca.
- **SC-005**: En el 100 % de los intentos de prueba, un doble toque o un reintento no cambian dos
  veces una solicitud ni mandan dos correos.
- **SC-006**: Ningún correo de prueba contiene un teléfono, una respuesta, una pregunta o un motivo.
- **SC-007**: La medición permite calcular, por semana, qué parte de las solicitudes enviadas llega
  a aceptarse y la mediana de horas hasta la primera respuesta del publicador, sin ningún dato de
  la persona.
- **SC-008**: En el 100 % de las pruebas, ninguna pantalla ni correo le dice al publicador si quien
  solicitó retiró, lo bloqueó o fue suspendida, ni le dice a quien solicitó que la bloquearon.

## Assumptions

- Ya en main (Ready): los cierres de una solicitud por adopción, borrado, baja, retiro, bloqueo y
  suspensión existen (#63); esta historia suma los correos de cierre y la regla de que una aceptada
  sigue mostrando el contacto después de la adopción. La detección de contacto en texto libre
  existe y se reusa para preguntas, respuestas y la línea de «otro». Mi solicitud y Mis solicitudes
  existen; se amplían. Nada de aceptar, rechazar, preguntar, revelar el contacto ni la bandeja del
  publicador existe.
- La historia no tiene comentarios; su cuerpo, con las «Decisiones del enjambre» (la última del
  2026-10-07), es la fuente. Los «200» y «500» son topes de caracteres; «331» es la Ley 18.331. Las
  referencias como «docs/03 §4» son a documentos del proyecto.
- **Decisiones del enjambre**: las once de la historia se copian palabra por palabra a docs/03 §3
  (la de la portada) y §4 (las demás) en esta rama.
- **«Se me dice que Ana la retiró»** (criterio de error de la historia) se resuelve con el texto
  «Ana ya no sigue con esta solicitud» de la decisión 2026-10-07: es lo que el publicador ve en los
  tres casos, para no distinguir el retiro de un bloqueo o una suspensión. Ante la duda, la que
  muestra menos (Ley 18.331).
- **El contacto después de cerrar** (decisión de esta spec): se sigue viendo solo cuando la
  solicitud estaba aceptada y el animal se marcó adoptado, como dicen la sección «Datos personales»
  y la decisión 2026-09-27 de la historia. Si el animal se borra o se da de baja, el contacto deja
  de verse: la regla de negocio que menciona «se borró o se dio de baja» junto a la adopción se lee
  como la lista de cierres de #63, y entre las dos lecturas se toma la que muestra menos.
- **Una solicitud de un animal borrado o dado de baja, para el publicador** (decisión de esta
  spec): se ve cerrada con el nombre del animal y sin el perfil, las respuestas ni el contacto de
  quien la mandó; el animal sale de Solicitudes. El criterio de la historia pide solo que se vea
  cerrada y sin acciones, y lo demás ya no sirve para nada.
- **Correo de solicitud nueva** (decisión de esta spec): el «no se le manda otro hasta que abra la
  bandeja» se cuenta por animal: abrir Solicitudes o las solicitudes de ese animal vuelve a
  habilitarlo. Las nuevas de otro animal mandan su propio correo.
- **«Nueva»** cuenta solo solicitudes que esperan respuesta y que el publicador nunca abrió.
- **Preguntar solo mientras espera respuesta** (decisión de esta spec): después de aceptar, la
  conversación sigue por WhatsApp; una pregunta pendiente al aceptar todavía se puede contestar
  mientras la solicitud siga activa.
- **Dejar sin efecto también impide volver a solicitar ese animal**, porque «se cierra como
  rechazada» y el rechazo lo impide.
- **La suspensión del publicador no manda correo** a las personas cuyas solicitudes se cierran con
  «ya no está publicado» por ella: la regla «suspender no manda correo» es explícita. Borrar la
  cuenta del publicador sí manda el de «ya no está publicado», porque sus animales se borran.
- **El orden de Solicitudes** (los que tienen nuevas primero) es decisión de esta spec: la historia
  pide los conteos pero no el orden, y lo que el rescatista busca al abrirla es lo que no vio.
- **«Abrir WhatsApp» con el mensaje ya escrito** usa el nombre del sitio de la configuración, que
  hoy es provisorio (docs/04): el mensaje cambia solo cuando cambie el nombre.
- **La oferta de «En proceso»** aparece solo con el animal disponible; con el animal en otro estado
  no tiene sentido o no se puede (#59).
- **Mis solicitudes, Solicitudes y Solicitudes de un animal no se paginan**: en la beta, 3-5
  rescatistas con pocos animales cada uno reciben solicitudes de a decenas.
- **La medición** se registra como el resto del sitio hoy, sin datos de la persona.
- **Fuera de esta historia**, como dice su alcance: elegir a quién se entregó el animal y el
  compromiso (M4), la encuesta después de un rechazo, un chat o más de 3 preguntas, mostrar el
  correo, decir el motivo del rechazo a quien solicitó, vencimientos o recordatorios, rechazar
  varias a la vez, respuestas guardadas, mostrar al publicador las otras solicitudes de una persona,
  avisos por WhatsApp o del teléfono y el panel de quien administra.
