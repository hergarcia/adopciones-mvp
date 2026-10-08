## Historia
**Como** rescatista **quiero** marcar adoptado a un animal diciendo a cuál de las personas que acepté
se lo di, y que las dos aceptemos un compromiso de adopción que nos quede por correo, **para** tener
registrado a quién entregué cada animal y en qué quedamos sin redactarlo cada vez por WhatsApp; y
**como** persona que adoptó **quiero** ver en el sitio que adopté a ese animal y aceptar el
compromiso, **para** que quien me lo dio sepa que me tomo en serio lo que prometí.

## Contexto
Es el cierre de todo lo anterior (docs/03 §5): marcar "Adoptado" eligiendo a qué solicitante se
entregó, que queda como vínculo histórico, y el **compromiso de adopción**, un texto corto que las dos
personas aceptan (castración, no abandono, devolverlo al rescatista si no puede tenerlo) y que queda
por correo. Es parte del trabajo que el sitio le ahorra al rescatista, que hoy arma su propio
"contrato" o lo acuerda de palabra (docs/01 §Huevo y gallina: "contrato digital"), y del sistema de
confianza por niveles, que termina en un historial de adopciones con seguimiento (docs/01
§"Validación" esconde el problema difícil).

Para la hipótesis (docs/03 §Hipótesis) es el dato que faltaba: "adoptado" es el último paso del
funnel (docs/03 §7), y saber si el animal se entregó a alguien que vino por el sitio o por otro lado
dice si la solicitud verificada terminó en una adopción o si la adopción siguió pasando por Facebook.

Es la primera historia de M4. El seguimiento a los 30 días, que usa este vínculo, es la siguiente.

## Alcance
- Incluye: elegir, al marcar adoptado, a qué persona aceptada se entregó el animal o que se lo dio a
  alguien que no vino por el sitio · el compromiso de adopción que acepta quien publicó al marcar y
  quien adoptó después · el correo con el compromiso para las dos personas · cómo muestran la adopción
  Mis animales, Mi solicitud, Mis solicitudes y la solicitud para el publicador · "Yo no adopté a
  este animal" para quien fue elegido por error · qué le pasa a la adopción cuando el animal se
  vuelve a publicar · el correo a quien adoptó para aceptar el compromiso y el aviso al publicador
  cuando alguien dice que no lo adoptó.
- No incluye (explícito): el seguimiento a los 30 días y el distintivo "adopción con seguimiento"
  (historia siguiente de M4) · el historial de adopciones en el perfil público (llega con el
  seguimiento, #12) · la encuesta después de adoptar (M4) · un compromiso propio de cada rescatista o
  cambiar su texto desde el sitio · firmar con valor legal, adjuntar un documento o imprimirlo desde
  el sitio · recordatorios para aceptar el compromiso · cambiar a quién se entregó después de marcarlo
  · el traspaso del chip en el RENAC (docs/05) · elegir a alguien cuya solicitud no fue aceptada ·
  avisos por WhatsApp o notificaciones del teléfono · el panel de quien administra (M4).

## Reglas de negocio
- **Marcar adoptado** (#59) pide elegir a quién se entregó: una de las personas con la solicitud
  aceptada para ese animal (#65), con su foto, su nombre y sus distintivos, o "Se lo di a alguien que
  no vino por el sitio". Sin elegir no se marca. Si no hay solicitudes aceptadas, se ofrece solo la
  segunda opción, con el camino a Solicitudes para aceptar primero a quien se lo va a dar.
- Al elegir a una persona se muestra el compromiso, y quien publicó lo acepta en el mismo paso con
  "Acepto el compromiso y marco adoptado a <nombre>". Si elige a alguien que no vino por el sitio, no
  hay compromiso ni vínculo con nadie.
- **El compromiso** es el mismo texto para todas las adopciones, con el nombre del animal y el de las
  dos personas. Quien adopta se compromete a cuidarlo y llevarlo al veterinario cuando lo necesite; a
  castrarlo, solo si su ficha dice que no está castrado; a no venderlo, regalarlo ni abandonarlo; y,
  si no puede tenerlo más, a avisarle a quien se lo dio y devolvérselo. Quien lo dio se compromete a
  recibirlo de vuelta en ese caso. Dice que es un acuerdo de palabra entre las dos personas, no un
  contrato.
- Quien fue elegido recibe un correo que lo lleva a Mi solicitud, con ingreso si hace falta, donde ve
  "Adoptaste a <nombre>", el compromiso, "Acepto el compromiso" y "Yo no adopté a <nombre>". La
  adopción cuenta desde que quien publicó la marca, aunque quien adoptó no acepte nunca: el compromiso
  queda pendiente, sin recordatorios.
- Cuando las dos personas aceptaron, cada una recibe un correo con el compromiso completo, el nombre
  y la foto del animal, el nombre de las dos y el día en que aceptó cada una. El correo no lleva el
  teléfono de nadie.
- **"Yo no adopté a <nombre>"** se puede solo mientras el compromiso está pendiente, y pide
  confirmación. Deshace el vínculo: el animal sigue adoptado, en Mis animales dice que esa persona
  dijo que no lo adoptó, y quien publicó recibe un correo. Su solicitud se cierra como que el animal
  encontró hogar, y el teléfono deja de verse para las dos.
- Al marcar adoptado, la solicitud elegida se cierra como adopción y deja de contar entre las 3
  activas de quien adoptó (#63). Las otras del animal se cierran como que encontró hogar (#65), también
  las aceptadas que no se eligieron, que dejan de ver el teléfono: solo las dos personas de la
  adopción siguen viendo el teléfono de la otra (cambia la regla de #65, que lo dejaba a la vista de
  todas las aceptadas).
- **Volver a publicar** un animal adoptado (#59) pide confirmación, que dice que la adopción con esa
  persona termina. Al terminar, el teléfono deja de verse para las dos, y Mi solicitud de quien adoptó
  dice que la adopción de ese animal terminó; el compromiso queda como estaba, con sus fechas.
- Bloquear (#13) entre las dos personas de una adopción, o suspender la cuenta de una de ellas (#13),
  deja de mostrar el teléfono para las dos, y la adopción sigue registrada con su compromiso como
  estaba; desbloquear o reactivar la cuenta no lo vuelve a mostrar. Una cuenta suspendida no acepta
  compromisos ni dice "Yo no adopté".
- Tocar dos veces "Acepto el compromiso", marcar adoptado o "Yo no adopté" hace una sola cosa y manda
  un solo correo.
- Marcar adoptado no exige el teléfono verificado (#59). Cada persona marca solo sus animales y
  acepta solo los compromisos donde es quien adoptó.

## Criterios de aceptación
### Camino feliz
- **Dado** que acepté la solicitud de Ana por Tobi **cuando** marco adoptado a Tobi **entonces** se me
  pregunta a quién se lo di, elijo a Ana, leo el compromiso con los nombres de Tobi, de Ana y el mío,
  toco "Acepto el compromiso y marco adoptado a Ana", y en Mis animales Tobi figura "Adoptado por Ana"
  con el compromiso pendiente de Ana.
- **Dado** que Ana fue elegida **cuando** abre el correo **entonces** llega a Mi solicitud, ve
  "Adoptaste a Tobi" y el compromiso, toca "Acepto el compromiso", y las dos recibimos un correo con el
  texto, los nombres, la foto de Tobi y el día en que aceptó cada una; en Mis animales el compromiso
  figura aceptado, con la fecha.
- **Dado** que di a Luna a una vecina que nunca entró al sitio **cuando** la marco adoptada y elijo
  "Se lo di a alguien que no vino por el sitio" **entonces** Luna figura "Adoptada por fuera del
  sitio", sin compromiso, y sus solicitudes se cierran como que encontró hogar.
- **Dado** que Ana adoptó a Tobi **cuando** abre Mis solicitudes **entonces** ve "Adoptaste a Tobi",
  no cuenta entre sus activas y sigue viendo mi teléfono y "Abrir WhatsApp".

### Casos borde (al menos 3)
- **Dado** que acepté a Ana y a Diego para Tobi **cuando** marco adoptado a Tobi eligiendo a Ana
  **entonces** la solicitud de Diego se cierra como que Tobi encontró hogar y Diego ya no ve mi
  teléfono; Ana sí.
- **Dado** que Tobi no tiene solicitudes aceptadas **cuando** lo marco adoptado **entonces** solo se me
  ofrece "Se lo di a alguien que no vino por el sitio", con el camino a Solicitudes para aceptar
  primero a quien se lo voy a dar.
- **Dado** que Tobi ya está castrado **cuando** leo el compromiso **entonces** no tiene la línea de la
  castración; con Luna, sin castrar, sí.
- **Dado** que elegí a Ana por error **cuando** Ana toca "Yo no adopté a Tobi" y confirma **entonces**
  recibo un correo, Tobi sigue adoptado y en Mis animales dice que Ana dijo que no lo adoptó, y
  ninguna de las dos ve más el teléfono de la otra.
- **Dado** que Ana adoptó a Tobi y me lo devolvió **cuando** toco "Volver a publicar" y confirmo
  **entonces** Tobi vuelve al listado, Ana ve que la adopción de Tobi terminó y ya no ve mi teléfono,
  y el compromiso sigue a la vista de las dos con sus fechas.
- **Dado** que Ana nunca aceptó el compromiso **cuando** pasa un mes **entonces** Tobi sigue
  "Adoptado por Ana", el compromiso figura pendiente y no se le mandó ningún otro correo.
- **Dado** que Ana adoptó a Tobi **cuando** quien administra suspende mi cuenta o la de Ana
  **entonces** ninguna de las dos ve más el teléfono de la otra, Tobi sigue "Adoptado por Ana" y el
  compromiso queda como estaba; si después se reactiva la cuenta, el teléfono sigue sin verse.
- **Dado** que toco dos veces "Acepto el compromiso" **cuando** termina **entonces** queda aceptado una
  vez y cada una recibe un solo correo.

### Errores y rechazos
- **Dado** que Ana retiró su solicitud mientras yo elegía **cuando** confirmo "Acepto el compromiso y
  marco adoptado a Ana" **entonces** Tobi no se marca, se me dice que Ana retiró su solicitud y vuelvo
  a elegir.
- **Dado** que se corta la conexión **cuando** Ana toca "Acepto el compromiso" **entonces** sigue
  pendiente, se le dice que no se pudo por la conexión y puede reintentar.
- **Dado** que Ana ya aceptó el compromiso **cuando** busca "Yo no adopté a Tobi" **entonces** no se le
  ofrece.
- **Dado** que abro el enlace del compromiso de una adopción que no es mía **cuando** carga
  **entonces** veo que no existe, igual que si no existiera.
- **Dado** que la cuenta de Ana está suspendida **cuando** intenta aceptar el compromiso **entonces**
  no puede, y ve lo mismo que #13 le muestra a una cuenta suspendida.

## Pantallas
- **Marcar adoptado** (cambia, de #59): "¿A quién se lo diste?", con las personas aceptadas y "Se lo
  di a alguien que no vino por el sitio"; al elegir a una persona, el compromiso y la confirmación.
  Vacío: sin aceptadas, solo la segunda opción y el camino a Solicitudes.
- **Mis animales** (cambia, de #59 y #65): un adoptado dice a quién se entregó o "por fuera del
  sitio", el compromiso pendiente o aceptado con la fecha, o que la persona dijo que no lo adoptó.
  Vacío: el de #53.
- **Mi solicitud** (cambia, de #63 y #65): "Adoptaste a <nombre>", el compromiso, "Acepto el
  compromiso" y "Yo no adopté a <nombre>", o el día en que se aceptó, o que la adopción terminó.
  Vacío: no aplica.
- **Mis solicitudes** (cambia, de #63): el estado "Adoptaste" y el de compromiso pendiente. Vacío: el
  de #63.
- **Una solicitud, para el publicador** (cambia, de #65): "Se lo diste a <nombre>" y el estado del
  compromiso. Vacío: no aplica.
- **Correos**: aceptá el compromiso (a quien adoptó), el compromiso aceptado (a las dos), y alguien
  dijo que no adoptó (a quien publicó). Vacío: no aplica.

## Datos personales
- Se guarda a qué solicitud y persona se entregó cada animal, cuándo, el día en que cada una aceptó
  el compromiso, si quien fue elegido dijo que no lo adoptó y cuándo terminó una adopción. Lo ven solo
  las dos personas de esa adopción: ni la ficha, ni el perfil público, ni el listado dicen quién
  adoptó. De una entrega por fuera del sitio no se guarda nada de la persona. El teléfono de la otra
  lo siguen viendo solo las dos personas de la adopción, mientras no termine, no se deshaga ni se
  bloqueen. Los correos no llevan el teléfono ni las respuestas. Borrar la cuenta de quien adoptó
  borra su solicitud y el vínculo (#65), y el animal queda adoptado sin a quién; borrar el animal o la
  cuenta de quien publicó lo borra también.

## Medición
- Animal marcado adoptado (a una persona del sitio o por fuera, días desde que se publicó y desde que
  se aceptó la solicitud elegida, cuántas solicitudes aceptadas tenía), compromiso aceptado por quien
  adoptó (horas después), "Yo no adopté" y adopción terminada al volver a publicar (días después).
  "Adoptado" es el quinto paso del funnel de docs/03 §7; la parte de las adopciones que se entregan a
  alguien que vino por el sitio dice si la solicitud verificada reemplazó al grupo (docs/03
  §Hipótesis). Ningún evento lleva datos de las personas.

## Dependencias
- #59 Mantener al día cada publicación (marcar adoptado, volver a publicar, Mis animales).
- #65 Responder las solicitudes (aceptar, el teléfono a la vista, Solicitudes).
- #63 Solicitar la adopción (Mi solicitud, Mis solicitudes, el límite de 3).
- #53 Publicar un animal (si está castrado) · #12 Distintivos · #13 Bloquear y suspender.
- docs/03 §5 y §7 · docs/01 §Huevo y gallina y §"Validación" esconde el problema difícil · docs/06
  (compromiso de adopción, que no es un contrato; correos) · docs/10.

## Decisiones del enjambre
- **Decisión (2026-09-27, product-owner):** marcar adoptado obliga a elegir a quién se entregó, entre
  las personas con la solicitud aceptada o "alguien que no vino por el sitio". Motivo: es el vínculo
  histórico de docs/03 §5 y deja medir si la adopción vino por el sitio sin trabar al rescatista que
  lo dio por otro lado (sacar de la vista nunca se traba, #59); solo las aceptadas, porque nadie
  entrega un animal a quien todavía no le vio el teléfono. Va en docs/03 §5.
- **Decisión (2026-09-27, product-owner):** el compromiso es un texto fijo, igual para todos, con la
  castración solo si el animal no está castrado y el compromiso de quien lo dio de recibirlo de
  vuelta; dice que es un acuerdo de palabra, no un contrato. Es la primera versión, que se muestra a
  los 3-4 rescatistas junto con el cuestionario antes de la beta. Motivo: cubre los tres puntos de
  docs/03 §5, "ambos aceptan" pide algo de cada lado, y docs/06 dice que no es un contrato legal. Va
  en docs/03 §5.
- **Decisión (2026-09-27, product-owner):** quien publicó acepta el compromiso al marcar; quien adoptó,
  después, desde el correo o Mi solicitud; la adopción cuenta aunque no lo acepte nunca, sin
  recordatorios, y cuando lo aceptaron las dos, cada una recibe el texto por correo. Motivo: el animal
  ya se entregó en la mano, y esperar al adoptante para marcarlo dejaría a la vista un animal que ya
  no está (#59); "queda por email" (docs/03 §5) es la copia que cada uno guarda. Va en docs/03 §5.
- **Decisión (2026-09-27, product-owner):** quien fue elegido puede decir "Yo no adopté" mientras el
  compromiso está pendiente, lo que deshace el vínculo y avisa a quien publicó; no hay forma de
  cambiar a quién se entregó. Motivo: el vínculo va a alimentar el historial que llega con el
  seguimiento (#12), y un error del rescatista no puede quedar como historia de otra persona. Va en
  docs/03 §5.
- **Decisión (2026-09-27, product-owner):** al marcar adoptado, solo las dos personas de la adopción
  siguen viendo el teléfono de la otra; las otras aceptadas se cierran y dejan de verlo, y volver a
  publicar, "Yo no adopté" o bloquear lo cortan también. Motivo: es lo mínimo que alcanza (docs/01
  §Legal / datos), y el seguimiento solo necesita a quien adoptó; cambia lo que #65 dejaba a la vista
  de todas las aceptadas. Va en docs/03 §4 y §5.
- **Decisión (2026-09-27, product-owner):** quién adoptó a un animal lo ven solo las dos personas: ni
  la ficha adoptada, ni el perfil público, ni el listado lo muestran. Motivo: la ficha adoptada ya no
  muestra nada de quien adoptó (#59) y el historial en el perfil llega con el seguimiento (#12); nada
  se muestra antes de que haga falta. Va en docs/03 §5.
- **Decisión (2026-10-08, product-owner):** suspender la cuenta de una de las dos personas de una
  adopción deja de mostrar el teléfono para las dos, igual que bloquear, y reactivarla no lo vuelve a
  mostrar; la adopción y el compromiso quedan registrados. Motivo: es lo que #65 ya hace con una
  aceptada cuando se suspende una cuenta (docs/03 §4), y ante la duda se muestra menos (Ley 18.331);
  el vínculo sigue contando para la medición. Va en docs/03 §5.

