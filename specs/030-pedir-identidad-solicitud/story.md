## Historia
**Como** rescatista que recibió una solicitud de alguien que solo tiene el teléfono verificado
**quiero** pedirle que verifique su identidad antes de decidir **para** saber que del otro lado hay
una persona real antes de darle el animal, sin tener que exigirle la cédula a todos los que piden.

## Contexto
La hipótesis pregunta si rescatistas y adoptantes valoran la verificación lo suficiente como para
pasar por fricción extra (docs/03 §Hipótesis). Hoy quien rescata decide una sola vez, al publicar,
si exige nivel 2, y lo decide a ciegas: si lo exige, pierde a quien no quiere mandar la cédula; si no,
le llegan solicitudes que no puede distinguir de un perfil armado. En el grupo de WhatsApp lo
resuelve entrevistando; acá no tiene cómo pedirle más a una persona en particular. Que pueda pedirlo
en el momento en que la verificación le sirve, frente a una solicitud concreta (docs/01
§Verificación = fricción), es la prueba más directa de las dos mitades: si quien rescata la pide
cuando le cuesta perder a alguien, la valora; si quien adopta la completa porque se la pidió quien
tiene el animal que quiere, también.

Le gana al recordatorio de solicitudes sin responder (docs/03 §4 lo deja para cuando la beta muestre
solicitudes olvidadas), al aviso de animales nuevos a quien busca (lee el listado, no la
verificación), a la señal de camada en la tarjeta del listado (vista en #223, cosmética) y al
traspaso del chip (docs/05, depende de un trámite sin averiguar): es la única que mide la
valoración con una decisión que alguien toma y le cuesta.

## Alcance
- Incluye: pedirle la identidad a quien solicitó, desde la solicitud, cuando espera respuesta y la
  persona no tiene nivel 2 · lo que ve quien solicitó en su solicitud y el correo que recibe · el
  camino de esa solicitud a la verificación de identidad que ya existe y de vuelta · lo que ve quien
  publicó mientras espera y cuando la identidad se aprueba · lo mismo para las solicitudes de una
  cría · los momentos que se miden y cómo se leen en docs/03 §Métricas de éxito.
- No incluye (explícito): cambiar cómo se verifica la identidad, cuánto tarda la revisión o sus
  topes · cambiar el nivel mínimo que se elige al publicar · pedir un aval o el teléfono (quien
  solicita ya lo tiene) · que pedir la identidad frene aceptar o rechazar · cancelar el pedido ·
  recordatorios por correo · mostrarle a quien publicó si el pedido de identidad de la otra persona
  está en revisión, fue rechazado o venció · pedirle la identidad a alguien que no le solicitó nada.

## Reglas de negocio
- Solo quien publicó el animal o la camada puede pedirlo, solo en una solicitud que espera respuesta
  y solo si quien la mandó no tiene nivel 2. A quien ya tiene identidad o aval no se le ofrece.
- Se pide una vez por solicitud. Mientras espera, quien publicó puede aceptar, rechazar o preguntar
  como siempre; pedir la identidad no traba nada ni ocupa la pregunta que espera.
- Es un pedido, no un requisito: quien solicitó puede no hacerlo, y su solicitud sigue esperando
  respuesta como antes. Lo que exige la publicación sigue siendo el nivel mínimo elegido al publicar.
- Quien publicó no necesita tener nivel 2 para pedirlo. Quien solicitó ve las chapitas de quien
  publicó junto al pedido.
- Quien solicitó ve en su solicitud que quien publicó le pide verificar la identidad antes de
  decidir, con el camino a hacerlo, y recibe un solo correo que lo dice y lleva a su solicitud, sin
  el teléfono, las respuestas ni nada de la cédula.
- Al terminar de mandar la cédula y la selfie desde ese camino, quien solicitó vuelve a su solicitud.
  La revisión y su espera son las de siempre (hasta 2 días).
- Quien publicó ve en la solicitud «Le pediste la identidad el <día>» y, mientras no se apruebe,
  «Todavía no la verificó». Nunca ve si el pedido de la otra persona está en revisión, fue rechazado
  o venció.
- Cuando la identidad se aprueba y la solicitud sigue abierta, la solicitud vuelve a figurar como
  nueva en «Solicitudes recibidas», dice «Verificó su identidad el <día>» y su chapita pasa a nivel
  2. Avisa por correo con la misma regla que una solicitud nueva: no se repite si quien publicó ya
  tiene nuevas sin abrir de ese animal.
- Si la solicitud se acepta, se rechaza o se cierra antes de que se apruebe, el pedido deja de verse
  en la solicitud de quien solicitó; la verificación que haya empezado sigue siendo suya y sigue su
  curso.
- Una misma aprobación vale para todos los pedidos abiertos a esa persona, de uno o de varios
  rescatistas.

## Criterios de aceptación
### Camino feliz
- **Dado** que publiqué a Tobi y Ana me solicitó con solo el teléfono verificado **cuando** abro su
  solicitud y toco «Pedirle la identidad» y confirmo **entonces** la solicitud dice «Le pediste la
  identidad el 29/10 · Todavía no la verificó», sigue esperando respuesta y puedo aceptar, rechazar
  o preguntar.
- **Dado** que quien publicó a Tobi me pidió la identidad **cuando** abro mi solicitud **entonces**
  veo que me la pide antes de decidir, con sus chapitas y «Verificar mi identidad», y en mi correo
  tengo un solo aviso que lleva a esa solicitud.
- **Dado** que toqué «Verificar mi identidad» desde mi solicitud **cuando** termino de mandar la
  cédula y la selfie **entonces** vuelvo a mi solicitud, que dice que mi identidad está en revisión.
- **Dado** que le pedí la identidad a Ana **cuando** se aprueba **entonces** su solicitud figura como
  nueva en «Solicitudes recibidas», muestra su chapita de nivel 2 y «Verificó su identidad el 31/10»,
  y me llega un correo, salvo que ya tenga solicitudes nuevas sin abrir de Tobi.

### Casos borde (al menos 3)
- **Dado** que quien me solicitó ya tiene nivel 2 o 3 **cuando** abro su solicitud **entonces** no
  aparece «Pedirle la identidad».
- **Dado** que ya le pedí la identidad a Ana en esta solicitud **cuando** la vuelvo a abrir, o toco
  dos veces, o la tengo abierta en dos pestañas **entonces** queda un solo pedido con su día y Ana
  recibe un solo correo.
- **Dado** que Ana ya había mandado su cédula por su cuenta y está en revisión **cuando** le pido la
  identidad **entonces** yo veo «Todavía no la verificó» y ella ve en su solicitud que ya está en
  revisión, sin un camino para mandarla otra vez.
- **Dado** que le pedí la identidad a Ana **cuando** su pedido es rechazado o vence **entonces** yo
  sigo viendo «Todavía no la verificó», y ella ve en su solicitud el camino para intentarlo de nuevo
  dentro de los topes de siempre.
- **Dado** que le pedí la identidad a Ana **cuando** acepto o rechazo su solicitud antes de que se
  apruebe **entonces** su solicitud deja de mostrar el pedido y, si después se aprueba, no me llega
  ningún aviso por esa solicitud.
- **Dado** que dos rescatistas le pidieron la identidad a Ana en dos solicitudes **cuando** se
  aprueba **entonces** las dos solicitudes dicen que verificó su identidad y a cada rescatista le
  llega su aviso con la regla de las solicitudes nuevas.
- **Dado** que Ana solicitó una cría de la camada de Luna **cuando** le pido la identidad
  **entonces** todo funciona igual que con un animal solo.

### Errores y rechazos
- **Dado** que Ana verificó su identidad mientras yo tenía su solicitud abierta **cuando** toco
  «Pedirle la identidad» **entonces** veo que ya la verificó, no se manda nada y la solicitud muestra
  su chapita nueva.
- **Dado** que la solicitud dejó de esperar respuesta (Ana la retiró, o se cerró) **cuando** toco
  «Pedirle la identidad» **entonces** veo que ya no se puede pedir y por qué en palabras, y no se
  manda nada.
- **Dado** que no publiqué el animal **cuando** intento pedirle la identidad a quien lo solicitó
  **entonces** no puedo, y no veo esa solicitud.
- **Dado** que se corta la conexión al pedirla **cuando** toco «Reintentar» **entonces** queda un
  solo pedido y Ana recibe un solo correo.

## Pantallas
- **Una solicitud, para quien publicó** (cambia): con la solicitud esperando y una persona sin nivel
  2, «Pedirle la identidad» junto a las otras acciones, con una confirmación que dice qué se le va a
  pedir (el frente de la cédula y una selfie con ella, revisadas a mano, hasta 2 días) y que la
  solicitud sigue esperando. Después, la línea «Le pediste la identidad el <día>» con «Todavía no la
  verificó» o «Verificó su identidad el <día>». Sin pedido, se ve como hoy.
- **Solicitudes de un animal** (cambia): la solicitud con identidad pedida lleva esa marca en su
  fila, y vuelve a marcarse nueva al aprobarse. Sin pedidos, se ve como hoy.
- **Mi solicitud, para quien solicitó** (cambia): el aviso de que quien publicó le pide verificar la
  identidad antes de decidir, con sus chapitas y «Verificar mi identidad»; «Tu identidad está en
  revisión» cuando ya la mandó; el camino a intentarlo de nuevo si se rechazó o venció. Sin pedido, o
  con la solicitud aceptada o cerrada, se ve como hoy.
- **Verificar identidad** (cambia): al llegar desde una solicitud, termina volviendo a esa solicitud.
  Sin solicitud de origen, se ve como hoy.
- **Correos**: uno a quien solicitó cuando se le pide; a quien publicó, el aviso al aprobarse con la
  regla de las solicitudes nuevas. Ninguno lleva teléfono, respuestas ni datos de la cédula.
- Todas son privadas y no se encuentran en buscadores.

## Datos personales
- Se guarda en la solicitud que quien publicó pidió la identidad y el día. Lo ven solo quien publicó
  y quien solicitó; quien administra no lo necesita y no lo ve. Se borra con la solicitud, al borrar
  la cuenta de cualquiera de los dos.
- A quien publicó no le llega nada nuevo de la otra persona: solo la chapita que ya ve hoy y el día
  en que se aprobó. Del pedido de identidad de la otra persona no ve el estado, el motivo de un
  rechazo ni nada de la cédula.
- La cédula y la selfie siguen las reglas de siempre: se revisan y se borran (Ley 18.331).

## Medición
- Un momento cuando quien publicó pide la identidad, con su propio nivel. Sin quién, qué animal ni
  qué solicitud, como el resto de la medición (docs/03 §7).
- Un momento por cada pedido abierto que resuelve una identidad aprobada, con el nivel de quien
  lo pidió.
- La pregunta de por qué deja la verificación a mitad de camino (#234) suma el origen «se la pidió
  quien publicó», aparte de publicar, solicitar o por su cuenta.
- Las respuestas a esas solicitudes ya llevan el nivel de quien solicitó (#236), así que se lee qué
  parte de los pedidos termina en identidad verificada y qué parte de esas solicitudes se acepta.
- Cómo se lee, en docs/03 §Métricas de éxito, aparte de «nivel 2 cuando se lo exigen» (lectura 2):
  un pedido no frena a nadie y mezclarlos cambiaría lo que esa lectura mide.

## Dependencias
- #11 (verificación de identidad) · #65 (responder las solicitudes) · #206 (solicitudes de una cría)
  · #234 (por qué deja la verificación) · #236 (el nivel en la medición) · docs/03 §1, §4, §7 y
  §Métricas de éxito · docs/01 §Verificación = fricción.

## Decisiones del enjambre
- **Decisión (2026-10-29, product-owner):** se suma pedirle la identidad a quien solicitó, como
  feature nueva propuesta por Producto al terminarse el mapa. Motivo: es lo que más enseña de la
  hipótesis por el trabajo que pide (docs/03 §Hipótesis); quien rescata elige pedirla cuando le
  cuesta, y quien adopta elige completarla por un animal concreto. (docs/03 §4)
- **Decisión (2026-10-29, product-owner):** el pedido no frena aceptar ni rechazar, no se cancela, se
  hace una vez por solicitud y solo a quien no tiene nivel 2. Motivo: nada se elige por la persona
  (docs/11 §Producto), y un requisito escondido a mitad de camino es el abandono por enojo que la
  decisión de 2026-09-27 sobre el nivel mínimo quiso evitar; una vez alcanza para que la persona se
  entere sin sentirse perseguida. (docs/03 §4)
- **Decisión (2026-10-29, product-owner):** quien publica no necesita nivel 2 para pedirlo, y quien
  solicitó ve sus chapitas junto al pedido. Motivo: exigirlo trabaría a quien rescata, que es el
  primer usuario, y cada persona decide viendo a quién le manda la cédula; la medición lleva el
  nivel de quien pide para leer si eso pesa. (docs/03 §4)
- **Decisión (2026-10-29, product-owner):** quien publicó solo ve «Todavía no la verificó» o
  «Verificó su identidad el <día>», nunca si está en revisión, rechazada o vencida. Motivo: entre dos
  opciones razonables va la que muestra menos (Ley 18.331), y un rechazo de la cédula no es algo que
  quien rescata tenga que saber para decidir. (docs/03 §4)
- **Decisión (2026-10-29, product-owner):** al aprobarse, la solicitud vuelve a figurar como nueva y
  avisa con la regla del correo de solicitud nueva; a quien solicitó, un solo correo al pedírsela y
  sin recordatorios. Motivo: el tiempo de respuesta es una métrica de éxito y quien rescata no va a
  volver sola a mirar; perseguir con correos es lo que el sitio promete ahorrar (docs/01 §Huevo y
  gallina). (docs/03 §4)
- **Decisión (2026-10-29, product-owner):** los pedidos se leen aparte de «nivel 2 cuando se lo
  exigen», y la pregunta de #234 suma el origen «se la pidió quien publicó». Motivo: un pedido no
  frena a nadie, y sumarlo a lo exigido cambiaría lo que mide la lectura 2; separados, dicen si la
  gente verifica más cuando se lo pide una persona que cuando lo pide una regla. (docs/03 §7 y
  §Métricas de éxito)


---
_Generated by [Claude Code](https://claude.ai/code)_
