## Historia
**Como** rescatista **quiero** ver en un solo lugar a quienes pidieron cada uno de mis animales,
con su verificación y sus respuestas, y aceptar, rechazar o preguntarles algo, **para** dejar de
entrevistar a cada interesado por WhatsApp; y **como** persona que quiere adoptar **quiero** que,
cuando me aceptan, el sitio me dé el teléfono de quien publicó y un botón para escribirle por
WhatsApp, **para** seguir la conversación donde ya hablamos todos.

## Contexto
Es la otra mitad del corazón del producto (docs/03 §4): la bandeja de solicitudes del publicador y
la revelación del contacto al aceptar. Es la herramienta que le ahorra trabajo al rescatista, la
"gestión de solicitantes" por la que se muda (docs/01 §Huevo y gallina): el producto real es un
gestor de solicitudes con verificación incluida. Y es el momento en que la verificación paga: el
teléfono de nadie se ve hasta que el rescatista eligió a quién dárselo (docs/03 §1).

De acá sale la tercera métrica de éxito: qué parte de las solicitudes llega a aceptarse y en cuánto
tiempo responde el rescatista (docs/03 §Métricas de éxito), y el paso "aceptado" del funnel (docs/03
§7). La conversación sigue por WhatsApp, que es el canal que la gente ya usa: no se construye un
chat (docs/03 §Fuera del MVP).

Es la segunda historia de M3, después de solicitar la adopción (#63), y cierra KL-63-1: hasta acá
la solicitud le «llega» a quien publicó pero nadie más que quien la mandó puede leerla.

## Alcance
- Incluye: la bandeja **Solicitudes**, con mis animales que recibieron solicitudes y cuántas
  nuevas tiene cada uno · las solicitudes de un animal · ver una solicitud con el perfil, los
  distintivos y las respuestas de quien la mandó · aceptar · rechazar eligiendo un motivo ·
  pedir más información y que quien solicitó conteste · revelar el teléfono de las dos personas al
  aceptar, con "Abrir WhatsApp" y un mensaje ya escrito · dejar sin efecto una aceptación que no se
  concretó · cómo cambian Mis solicitudes, Mi solicitud y la ficha con cada respuesta del
  publicador · los correos por una solicitud nueva, por una respuesta a una pregunta, por una
  aceptación, un rechazo o una pregunta, y por una solicitud que se cierra porque el animal encontró
  hogar o ya no está publicado · en la portada, el paso que cuenta cómo se pide un animal y cuándo
  se da el contacto, y el que le cuenta al rescatista que recibe las solicitudes en un solo lugar.
- No incluye (explícito): elegir a qué solicitante se entregó el animal y el compromiso de
  adopción (M4) · la encuesta después de un rechazo (M4) · un chat entre las dos personas o más de
  3 preguntas por solicitud · mostrar el correo de nadie · decirle a quien solicitó el motivo del
  rechazo · que una solicitud venza sola o recordatorios al publicador por solicitudes sin
  responder · rechazar varias solicitudes de una vez · respuestas guardadas o mensajes propios del
  rescatista · mostrarle al publicador las otras solicitudes de una persona · avisos por WhatsApp o
  notificaciones del teléfono · el panel de quien administra (M4).

## Reglas de negocio
- Solo quien publicó un animal ve sus solicitudes. Cada solicitud muestra el nombre, la foto, la
  zona y los distintivos de quien la mandó (#12), el enlace a su perfil público (desde donde puede
  reportarla o bloquearla, #13), la fecha, cuántos días lleva esperando y sus respuestas.
- Una solicitud enviada está **esperando respuesta** hasta que el publicador la acepta o la
  rechaza. Las solicitudes de un animal se ordenan por llegada, la más vieja primero, con las que
  esperan respuesta arriba. Una solicitud es "nueva" hasta que el publicador la abre.
- **Aceptar** pide confirmación, que dice que las dos personas van a ver el teléfono de la otra.
  Al aceptar, quien solicitó ve el nombre y el teléfono verificado de quien publicó, y quien publicó
  ve el nombre y el teléfono verificado de quien solicitó; cada uno con "Abrir WhatsApp", que abre
  una conversación con un mensaje ya escrito que nombra al animal y dice de dónde viene. Antes de
  aceptar, ninguno ve el teléfono ni el correo del otro. El correo no se muestra nunca.
- Se muestra siempre el teléfono verificado que la persona tiene hoy: si cambia de número y
  confirma el nuevo, se ve el nuevo; si deja de tener un teléfono verificado (cambió de número sin
  confirmarlo, o lo recuperó otra cuenta, #25), su contacto dice que no tiene un teléfono
  verificado ahora, sin mostrar el número viejo.
- Para aceptar, las dos personas tienen que tener hoy el teléfono verificado. Si falta el del
  publicador, ve el aviso de verificación pendiente de #10; si falta el de quien solicitó, la
  solicitud dice que esa persona tiene que volver a verificar su teléfono antes de poder aceptarla.
  En los dos casos se puede rechazar o preguntar.
- Un animal puede tener más de una solicitud aceptada: el rescatista puede hablar con más de una
  familia. Cada persona aceptada ve solo el contacto del publicador, nunca el de otra solicitante.
- Una solicitud aceptada sigue activa (cuenta entre las 3 de quien solicitó, #63). Después de
  aceptar se ofrece marcar el animal "En proceso" (#59) con un toque; no se marca solo.
- **Rechazar** pide un motivo de esta lista: elegí a otra persona · la vivienda no es adecuada para
  este animal · pasaría mucho tiempo solo · no se compromete a castrarlo · no convive bien con los
  animales o las personas de la casa · no contestó lo que le pregunté · otro. "Otro" pide una línea
  de hasta 200 caracteres. El motivo lo ve solo quien publicó; a quien solicitó se le dice que su
  solicitud no fue aceptada, con el camino a Animales en adopción.
- Rechazar cierra la solicitud y libera el lugar entre las 3 activas. Quien fue rechazado no puede
  volver a solicitar ese animal: su ficha le muestra que su solicitud no fue aceptada.
- Una solicitud aceptada que no se concretó se puede **dejar sin efecto**, eligiendo un motivo de
  la misma lista más "la adopción no se concretó". Se cierra como rechazada, y el teléfono deja de
  verse para las dos personas.
- **Pedir más información**: el publicador escribe una pregunta de hasta 500 caracteres y quien
  solicitó la contesta una vez, con hasta 500 caracteres. Hay como máximo 3 preguntas por solicitud,
  y una sola esperando respuesta a la vez. Mientras espera, el publicador puede aceptar o rechazar
  igual. Preguntas y respuestas quedan en la solicitud, a la vista de las dos personas.
- Las preguntas, las respuestas y la línea de "otro" no pueden tener un teléfono, un correo ni un
  enlace, con la misma explicación que el cuestionario (#63).
- Mientras el animal está pausado o vencido, el publicador puede responder sus solicitudes igual.
  Cuando se cierran porque el animal se adoptó, se borró o se dio de baja (#63), ya no se responden;
  una solicitud que estaba aceptada sigue mostrando el contacto de las dos personas, porque la
  adopción está en marcha.
- Retirar una solicitud (#63), bloquear (#13) o suspender una cuenta (#13) cierra la solicitud, y
  si estaba aceptada el teléfono deja de verse para las dos personas.
- Quien publicó ve igual una solicitud que se cerró porque quien la mandó la retiró, lo bloqueó o
  fue suspendida: «Ana ya no sigue con esta solicitud», sin decir por qué. Si quien bloqueó fue el
  publicador, ve que se cerró por su bloqueo, y quien la mandó la ve cerrada porque el animal ya no
  recibe solicitudes (docs/03 §4).
- **La portada** suma, en «Si querés adoptar», que una solicitud se pide con un cuestionario corto
  y que el teléfono de las dos personas se da recién cuando quien publicó la acepta; y en «Si
  rescatás», que las solicitudes de cada animal llegan a un solo lugar, con la verificación y las
  respuestas de cada persona, y que se acepta o se rechaza con un toque. Solo cuenta lo que el sitio
  ya hace (#61).
- **Correos.** Al publicador: cuando le llega una solicitud nueva, salvo que ya tenga solicitudes
  nuevas sin abrir de ese animal (no se le manda otro hasta que abra la bandeja); y cuando le
  contestan una pregunta. A quien solicitó: cuando su solicitud se acepta, se rechaza o se deja sin
  efecto, cuando le preguntan algo, y cuando se cierra porque el animal encontró hogar o ya no está
  publicado. Ningún correo lleva el teléfono, las respuestas ni el motivo del rechazo: lleva a la
  solicitud en el sitio. Retirar, bloquear y suspender no mandan correo.
- Tocar dos veces "Aceptar", "Rechazar" o "Enviar pregunta" hace una sola cosa y manda un solo
  correo.

## Criterios de aceptación
### Camino feliz
- **Dado** que publiqué a Tobi y Ana lo solicitó **cuando** llega su solicitud **entonces** recibo
  un correo que me lleva a Solicitudes, donde Tobi aparece con "1 nueva", y al abrirla veo el
  nombre, la foto, la zona y los distintivos de Ana, cuántos días lleva esperando y todas sus
  respuestas.
- **Dado** que abrí la solicitud de Ana **cuando** toco "Aceptar" y confirmo **entonces** veo su
  nombre, su teléfono y "Abrir WhatsApp", y se me ofrece marcar a Tobi "En proceso"; Ana recibe un
  correo, y en Mi solicitud ve mi nombre, mi teléfono y "Abrir WhatsApp".
- **Dado** que Ana fue aceptada **cuando** toca "Abrir WhatsApp" **entonces** se abre una
  conversación con mi número y un mensaje ya escrito que nombra a Tobi y dice de dónde viene.
- **Dado** que abrí la solicitud de Bruno **cuando** toco "Rechazar", elijo "pasaría mucho tiempo
  solo" y confirmo **entonces** la solicitud queda rechazada con ese motivo a mi vista; Bruno recibe
  un correo y en Mis solicitudes ve que no fue aceptada, sin el motivo, y deja de contar entre sus
  activas.
- **Dado** que abrí la solicitud de Carla **cuando** pido más información con "¿El balcón tiene
  red en todos lados?" **entonces** Carla recibe un correo, en Mi solicitud ve la pregunta y la
  contesta; yo recibo un correo y veo la respuesta debajo de la pregunta.

### Casos borde (al menos 3)
- **Dado** que Tobi tiene 2 solicitudes nuevas sin abrir **cuando** llega una tercera **entonces**
  no recibo otro correo; después de abrir Solicitudes, la próxima nueva me manda uno.
- **Dado** que acepté a Ana y a Diego para Tobi **cuando** Diego abre su solicitud **entonces** ve
  mi teléfono y nunca el de Ana.
- **Dado** que acepté a Ana y la adopción no se concretó **cuando** dejo la aceptación sin efecto
  con "la adopción no se concretó" **entonces** ninguna de las dos ve más el teléfono de la otra, y
  Ana recibe un correo y ve que su solicitud no fue aceptada.
- **Dado** que acepté a Ana **cuando** cambio de número y confirmo el nuevo **entonces** Ana ve mi
  número nuevo; si mi número lo recupera otra cuenta, Ana ve que no tengo un teléfono verificado
  ahora, y no el número viejo.
- **Dado** que acepté a Ana **cuando** marco adoptado a Tobi **entonces** su solicitud se cierra
  como que Tobi encontró hogar y las dos seguimos viendo el teléfono de la otra; las que esperaban
  respuesta se cierran, y cada persona recibe un correo.
- **Dado** que ya le hice 3 preguntas a Carla **cuando** abro su solicitud **entonces** no se me
  ofrece preguntar otra vez; puedo aceptar o rechazar.
- **Dado** que Bruno fue rechazado **cuando** abre la ficha de Tobi **entonces** ve que su
  solicitud no fue aceptada, no "Quiero adoptar".
- **Dado** que Tobi está pausado **cuando** abro la solicitud de Ana **entonces** puedo aceptarla,
  rechazarla o preguntarle algo.
- **Dado** que Ana me bloqueó después de solicitar a Tobi **cuando** abro su solicitud **entonces**
  veo «Ana ya no sigue con esta solicitud», igual que si la hubiera retirado, sin acciones, y no
  recibo ningún correo.
- **Dado** que soy un visitante sin sesión **cuando** abro la portada **entonces** leo, en «Si
  querés adoptar», que se pide con un cuestionario y que el teléfono se da recién al aceptar, y en
  «Si rescatás», que las solicitudes llegan a un solo lugar.

### Errores y rechazos
- **Dado** que Ana retiró su solicitud mientras yo la miraba **cuando** toco "Aceptar" **entonces**
  no se acepta, se me dice que Ana la retiró, y nadie ve el teléfono de nadie.
- **Dado** que cambié de número y todavía no confirmé el nuevo **cuando** toco "Aceptar"
  **entonces** veo el aviso de verificación pendiente con el camino para verificarlo, y puedo
  rechazar o preguntar.
- **Dado** que Ana dejó de tener un teléfono verificado **cuando** abro su solicitud **entonces**
  "Aceptar" dice que Ana tiene que volver a verificar su teléfono antes de poder aceptarla.
- **Dado** que escribo un celular en una pregunta **cuando** toco "Enviar pregunta" **entonces** no
  se manda, se marca y se me explica que el contacto se da cuando la solicitud se acepta.
- **Dado** que elegí "otro" **cuando** rechazo sin escribir la línea **entonces** no se rechaza y
  se me marca que falta.
- **Dado** que no publiqué a Tobi **cuando** abro el enlace de sus solicitudes o de una de ellas
  **entonces** veo que no existe, igual que si no existiera.
- **Dado** que Tobi se borró **cuando** abro una de sus solicitudes desde un correo viejo
  **entonces** veo que la solicitud está cerrada porque Tobi ya no está publicado, sin acciones.

## Pantallas
- **Solicitudes** (nueva): mis animales que recibieron solicitudes, cada uno con su foto, su nombre,
  cuántas esperan respuesta y cuántas son nuevas. Vacío: "Todavía no recibiste solicitudes.", con
  el camino a Mis animales, o a publicar si no tengo ninguno.
- **Solicitudes de un animal** (nueva): las que esperan respuesta primero, después las aceptadas y
  las cerradas; cada una con la foto y el nombre de quien la mandó, sus distintivos, la fecha, los
  días esperando y si es nueva. Vacío: "Nadie solicitó a Tobi todavía.", con el enlace a su ficha
  para compartir.
- **Una solicitud, para el publicador** (nueva): quien la mandó, sus respuestas, las preguntas y
  sus respuestas, "Aceptar", "Rechazar" y "Pedir más información"; aceptada, el teléfono, "Abrir
  WhatsApp" y "Dejar sin efecto". Vacío: sin preguntas, no muestra esa parte.
- **Mis animales** (cambia, de #59): cuántas solicitudes nuevas tiene cada animal y el camino a
  ellas. Vacío: no aplica.
- **Mi solicitud** (cambia, de #63): el estado, la pregunta para contestar, y aceptada, el nombre,
  el teléfono y "Abrir WhatsApp" de quien publicó. Vacío: no aplica.
- **Mis solicitudes** (cambia, de #63): los estados esperando respuesta, te preguntaron algo,
  aceptada y no aceptada. Vacío: el de #63.
- **Portada** (cambia, de #61): un paso más en «Si querés adoptar» y otro en «Si rescatás». Vacío:
  no aplica; los pasos no dependen de que haya animales.
- **Ficha de un animal** (cambia, de #63): "Tu solicitud no fue aceptada" para quien fue
  rechazado. Vacío: no aplica.
- **Correos**: solicitud nueva y respuesta a tu pregunta (al publicador); aceptada, no aceptada,
  te preguntaron algo, y encontró hogar o ya no está publicado (a quien solicitó). Vacío: no aplica.

## Datos personales
- Al aceptar, cada una de las dos personas ve el nombre y el teléfono verificado de la otra,
  mientras la solicitud esté aceptada o cerrada porque el animal se adoptó; nadie más lo ve. Antes
  de aceptar, después de dejarla sin efecto, al retirarla, al bloquear o al suspender, no lo ve
  ninguna. El correo no se muestra nunca. Se guarda el estado de cada solicitud y cuándo cambió, el
  motivo del rechazo (lo ve solo quien publicó), y las preguntas y respuestas (las ven solo las dos
  personas). Ningún correo lleva el teléfono, las respuestas ni el motivo. Borrar la cuenta de
  quien solicitó borra todo eso, como sus respuestas (#63).

## Medición
- Bandeja abierta, solicitud abierta por primera vez (horas desde que llegó), primera respuesta
  del publicador (horas desde que llegó y cuál), aceptada, rechazada (con el motivo, sin el texto de
  "otro"), pregunta enviada y contestada (y en cuánto), aceptación dejada sin efecto (motivo), "Abrir
  WhatsApp" tocado (por quién publicó o quién solicitó) y animal marcado "En proceso" desde la
  oferta. "Aceptado" es el cuarto paso del funnel de docs/03 §7; las aceptadas sobre las enviadas
  y las horas hasta la primera respuesta son la tercera métrica de éxito (docs/03 §Métricas de
  éxito). Ningún evento lleva el teléfono, las respuestas ni datos de la persona.

## Dependencias
- #63 Solicitar la adopción (la solicitud, el cuestionario, Mis solicitudes y el límite de 3).
- #59 Mantener al día cada publicación (Mis animales, en proceso, pausa, adopción, borrado).
- #53 Publicar un animal · #57 La ficha de un animal.
- #12 Perfil público y distintivos (lo que se ve de quien solicitó) · #61 La portada.
- #13 Reportar, bloquear y suspender · #10 Verificación de teléfono · #25 Recuperar un número.
- docs/03 §1, §4, §7 y §Métricas de éxito · docs/01 §Huevo y gallina · docs/06 (motivos de
  rechazo, plantillas de WhatsApp y correos) · docs/10.

## Decisiones del enjambre
- **Decisión (2026-09-27, product-owner):** al aceptar se revela el nombre y el teléfono verificado
  de las dos personas, con "Abrir WhatsApp" y un mensaje ya escrito; el correo no se muestra nunca.
  Motivo: la conversación sigue por WhatsApp, que es el canal de todos (docs/01), y el teléfono es
  el único contacto verificado; mostrar lo mínimo que alcanza es la regla de datos (docs/01 §Legal /
  datos). Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** no se vuelve a confirmar el número antes de revelarlo;
  se muestra el teléfono verificado que la persona tiene hoy, y si no tiene, se dice sin mostrar el
  viejo. Para aceptar, las dos tienen que tenerlo. Motivo: docs/03 §4 dejó la decisión a esta
  historia; desde #25, un número que pasa a otra cuenta deja de estar en la anterior, así que el
  riesgo de revelar un número ajeno ya está cubierto sin cobrarle un código a cada aceptación. Va
  en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** un animal puede tener más de una solicitud aceptada, y
  aceptar ofrece marcarlo "En proceso" sin hacerlo solo. Motivo: el rescatista habla con más de una
  familia antes de decidir, y quien falla después de aceptar necesita una segunda opción; nada se
  elige por la persona (docs/11 §Producto). Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** los motivos de rechazo son elegí a otra persona, la
  vivienda no es adecuada, pasaría mucho tiempo solo, no se compromete a castrarlo, no convive bien
  con los de la casa, no contestó lo que le pregunté, y otro con una línea; más "la adopción no se
  concretó" para dejar sin efecto una aceptación. Es la primera versión, que se muestra a los 3-4
  rescatistas junto con el cuestionario antes de la beta. Motivo: siguen los temas del cuestionario
  (#63) para que el motivo se pueda cruzar con las respuestas, que es el "dato clave" de docs/03 §4.
  Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** el motivo del rechazo lo ve solo quien publicó; a quien
  solicitó se le dice que no fue aceptada, y no puede volver a solicitar ese animal. Motivo: un
  rescatista no quiere tener que justificarse ante cada rechazado, que es la discusión que hoy tiene
  por WhatsApp, y el motivo es más honesto si nadie lo lee del otro lado. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** pedir más información es una pregunta y una respuesta,
  hasta 3 por solicitud y una esperando a la vez, sin teléfonos, correos ni enlaces. Motivo: el chat
  in-app está fuera del MVP (docs/03 §Fuera del MVP); lo que el cuestionario no alcanza se pregunta
  acá y el resto se habla por WhatsApp después de aceptar. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** una aceptación se puede dejar sin efecto, y el teléfono
  deja de verse para las dos; cuando el animal se adopta, una aceptada sigue mostrando el contacto.
  Motivo: si la adopción no se concreta, la persona no debería quedar ocupando uno de sus 3 lugares
  ni con el teléfono del rescatista a la vista; si se concretó, el seguimiento de M4 necesita que se
  sigan encontrando. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** los correos de solicitud nueva no se repiten mientras
  el publicador tenga nuevas sin abrir de ese animal; ningún correo lleva el teléfono, las
  respuestas ni el motivo. Motivo: un rescatista con un animal compartido en un grupo grande recibe
  muchas solicitudes, y un correo por cada una lo empuja a ignorarlos; un correo reenviado no
  debería exponer a nadie. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** una solicitud no vence sola y no hay recordatorios al
  publicador en esta historia; la bandeja muestra los días que lleva esperando y quien solicitó
  puede retirarla. Motivo: el tiempo de respuesta es una de las métricas de éxito, y un vencimiento
  automático la escondería; si la beta muestra solicitudes olvidadas, se decide con ese dato. Va en
  docs/03 §4.
- **Decisión (2026-10-07, product-owner):** la portada suma dos pasos: para quien adopta, que se
  pide con un cuestionario y que el teléfono se da recién al aceptar; para quien rescata, que las
  solicitudes llegan a un solo lugar con la verificación y las respuestas de cada persona. Motivo:
  la decisión del 2026-10-06 dejó el paso de la portada a esta historia, porque recién con aceptar y
  el contacto la promesa está entera; el paso para el rescatista es la «gestión de solicitantes» por
  la que se muda (docs/01 §Huevo y gallina), y la portada es para rescatistas primero. Va en docs/03
  §3.
- **Decisión (2026-10-07, product-owner):** quien publicó ve con el mismo texto una solicitud que se
  cerró porque quien la mandó la retiró, lo bloqueó o fue suspendida, sin decir cuál. Motivo: #13
  decidió que la persona bloqueada no se entera y que una suspensión no se exhibe; distinguir el
  retiro del resto se lo contaría. En privacidad, entre dos opciones se toma la que muestra menos
  (Ley 18.331). Va en docs/03 §4.

