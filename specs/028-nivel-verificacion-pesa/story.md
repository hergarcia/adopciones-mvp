## Historia
**Como** equipo que quiere saber si la verificación vale su fricción **quiero** que cada vez que
quien rescata publica, responde una solicitud o entrega un animal, la medición sepa qué nivel exige
y qué nivel tiene la persona que eligió o descartó **para** saber si el nivel de alguien cambia a
quién eligen los rescatistas; y **quiero** saber qué nivel tiene quien publicó cada vez que alguien
mira una ficha, toca «Solicitar» o manda una solicitud **para** saber si quien adopta busca a
rescatistas verificados.

## Contexto
La hipótesis pregunta si rescatistas y adoptantes **valoran** la verificación (docs/03
§Hipótesis). Hoy el sitio mide si la gente la atraviesa: cuántos publican de nuevo, cuántos
completan el nivel 2 y por qué se van (#169, #234). No mide si sirve para algo después: si un
rescatista acepta más a quien tiene identidad o aval que a quien tiene solo el teléfono, si abre su
perfil antes de contestar, cuántos piden nivel 2 al publicar, o si quien adopta solicita más a un
rescatista verificado. La bandeja ya muestra la chapita de cada solicitante y la ficha la de quien
publicó (#12, #65), pero ningún momento de la medición lleva ese nivel. Si los aceptados tienen el
mismo nivel que los que se rechazan, la verificación es un trámite y la beta lo tiene que poder
decir; si pesa, es el argumento para que un rescatista deje el grupo de WhatsApp (docs/01 §Huevo y
gallina).

Le gana a contar las camadas en la guía y en la portada (vistas en #223 y #224), a los detalles de
texto de las aceptaciones de #205, #206 y #234 y al traspaso del chip (docs/05, depende de un
trámite sin averiguar): ninguno lee la hipótesis, y esto la lee de frente agregando un dato a
momentos que ya se miden, sin pantallas nuevas.

## Alcance
- Incluye: el nivel que exige la publicación (1 o 2) al publicar un animal o una camada y al
  guardar una edición · el nivel de quien solicitó, y si su perfil ya muestra una adopción con
  seguimiento, al aceptar, rechazar, preguntar, dejar sin efecto una aceptación y entregar el animal
  a una persona del sitio · el nivel de quien manda la solicitud y el de quien publicó al mandarla ·
  el nivel de quien publicó al mirar una ficha y al tocar «Solicitar» · contar aparte las veces que
  quien publicó abre el perfil de quien solicitó desde la solicitud · cómo se lee todo esto en
  docs/03 §Métricas de éxito.
- No incluye (explícito): cambiar lo que ve cualquier persona en el sitio · cambiar los niveles,
  cómo se ganan o qué se exige · guardar algo nuevo de una persona en el sitio · que la medición
  sepa quién, qué animal o qué solicitud · un tablero propio (se lee en la herramienta de medición,
  #169) · preguntarle a nadie por la verificación (las encuestas de #71 y la pregunta de #234
  quedan como están) · medir el nivel de quien publicó en el listado o en la portada · los momentos
  de quien administra.

## Reglas de negocio
- El nivel que se mide es el de la chapita, el mismo que muestran la bandeja y la ficha: 1 teléfono,
  2 identidad, 3 aval. Es el que la persona tiene **en ese momento**, no el que tenía al mandar la
  solicitud o al publicar.
- Al publicar un animal o una camada, el momento lleva el nivel que exige la publicación, 1 o 2.
  Una camada lo lleva una sola vez, como ya cuenta una sola publicación. Al guardar una edición
  lleva el nivel que exige después de guardar, haya cambiado o no.
- Al aceptar, rechazar, preguntar, dejar sin efecto una aceptación o marcar que el animal se
  entregó a una persona del sitio, el momento lleva el nivel de quien solicitó y si en su perfil ya
  figura al menos una adopción con seguimiento (sí o no, nunca cuántas). Entregar por fuera del
  sitio no lleva nivel: no hay a quién medir.
- Al mandar una solicitud, el momento lleva el nivel de quien la manda y el de quien publicó.
- Al mirar una ficha y al tocar «Solicitar», el momento lleva el nivel de quien publicó. En una
  camada es el de quien publicó la camada.
- Abrir el perfil de quien solicitó desde «Ver su perfil» de la solicitud cuenta como llegado
  desde una solicitud, aparte de llegar navegando por el sitio o desde un enlace de afuera.
- Ningún momento lleva quién, qué animal, qué solicitud ni un texto: solo el número del nivel, el
  sí o no y de dónde llegó, como el resto de la medición del sitio (docs/03 §7).
- Medir nunca frena lo que la persona hace: si la medición no está o el nivel no se puede leer,
  publicar, responder, entregar o solicitar funcionan igual y la persona no ve ninguna diferencia.

## Criterios de aceptación
### Camino feliz
- **Dado** que Carla publica a Tobi pidiendo nivel 2 **cuando** termina de publicar **entonces**
  el momento de publicar llega a la medición con nivel exigido 2.
- **Dado** que Bruno tiene nivel 2 y solicitó a Tobi **cuando** Carla acepta su solicitud
  **entonces** el momento de aceptar llega con nivel del solicitante 2 y sin adopción con
  seguimiento, y el de la primera respuesta también.
- **Dado** que Ana tiene nivel 3 y una adopción con seguimiento en su perfil **cuando** Carla
  rechaza su solicitud **entonces** el momento de rechazar llega con nivel 3, con adopción con
  seguimiento, y con el motivo que ya llevaba.
- **Dado** que Diego tiene nivel 1 y Carla tiene nivel 2 **cuando** Diego manda una solicitud por
  un animal de Carla **entonces** el momento de mandar llega con nivel del solicitante 1 y nivel de
  quien publicó 2.
- **Dado** que Carla está en la solicitud de Bruno **cuando** toca «Ver su perfil» **entonces** la
  visita al perfil de Bruno se cuenta como llegada desde una solicitud.
- **Dado** que alguien sin sesión abre la ficha de Tobi **cuando** la ficha carga **entonces** el
  momento de ver la ficha llega con el nivel de Carla, y al tocar «Solicitar» también.

### Casos borde (al menos 3)
- **Dado** que Bruno mandó su solicitud con nivel 1 y después le aprobaron la identidad **cuando**
  Carla la acepta **entonces** el momento llega con nivel 2, el de ahora.
- **Dado** que a Ana le retiraron el aval y bajó a nivel 2 **cuando** Carla le pregunta algo
  **entonces** el momento de preguntar llega con nivel 2.
- **Dado** que Carla publica una camada de cinco crías pidiendo nivel 1 **cuando** termina
  **entonces** llega un solo momento de publicar con nivel exigido 1, y aceptar a quien pidió una
  cría lleva el nivel de esa persona como con cualquier animal.
- **Dado** que Carla edita a Tobi y solo cambia la descripción **cuando** guarda **entonces** el
  momento de editar llega con nivel exigido 2, el que sigue teniendo.
- **Dado** que Carla marca que entregó a Tobi por fuera del sitio **cuando** confirma **entonces**
  el momento de entregar llega sin nivel de solicitante.
- **Dado** que Carla abre el perfil de Bruno desde un enlace que le mandaron por WhatsApp
  **cuando** carga **entonces** la visita se cuenta como llegada desde un enlace, no desde una
  solicitud.

### Errores y rechazos
- **Dado** que la herramienta de medición no responde **cuando** Carla acepta la solicitud de
  Bruno **entonces** la aceptación se guarda, Bruno ve el contacto como hoy y Carla no ve ningún
  aviso.
- **Dado** que el nivel de quien solicitó no se puede leer en ese momento **cuando** Carla lo
  rechaza **entonces** el rechazo se guarda igual y el momento llega sin nivel, nunca con uno
  inventado.
- **Dado** que miro lo que llega a la medición en cualquiera de estos momentos **cuando** lo
  reviso **entonces** no encuentro el nombre, el teléfono, el animal, la solicitud ni la cuenta de
  nadie.

## Pantallas
No aplica: ninguna pantalla cambia.

## Datos personales
- En el sitio no se guarda nada nuevo.
- A la herramienta de medición llegan, en momentos que ya se mandan, el número del nivel (1, 2 o
  3), si el perfil ya muestra una adopción con seguimiento (sí o no) y que una visita al perfil
  llegó desde una solicitud. Nunca quién, qué animal, qué solicitud ni cuántas adopciones: el nivel
  ya es público en la chapita y el sí o no muestra menos que la cantidad (Ley 18.331).

## Medición
Se suma a docs/03 §Métricas de éxito, «Cómo se leen», como una lectura nueva: **¿pesa la
verificación cuando se elige?**
- De las solicitudes mandadas, qué parte es de cada nivel, contra qué parte de las aceptadas y de
  las rechazadas es de cada nivel. Si los niveles 2 y 3 se aceptan más que su parte, quien rescata
  valora la verificación.
- Qué parte de las publicaciones pide nivel 2.
- Cuántas solicitudes abiertas terminan con quien publicó abriendo el perfil de quien solicitó
  desde la solicitud.
- De las fichas vistas de rescatistas de cada nivel, qué parte termina en «Solicitar» y en una
  solicitud mandada: si quien adopta solicita más a un rescatista verificado.
- Con 3 a 5 rescatistas los números son chicos: se leen como señal al lado de las opiniones y las
  encuestas, no como prueba.

## Dependencias
- #12 aval y niveles · #53 publicar · #59 nivel exigido y edición · #65 bandeja y respuestas ·
  #67 entrega · #69 adopciones con seguimiento en el perfil · #169 medición en el sitio de verdad ·
  #205 y #206 camadas · docs/03 §Hipótesis, §7 y §Métricas de éxito · docs/01 §Huevo y gallina.

## Decisiones del enjambre
- **Decisión (2026-10-28, product-owner):** se mide el nivel de la chapita que la persona tiene en
  el momento en que quien rescata responde o entrega, no el que tenía al mandar la solicitud.
  Motivo: quien rescata decide mirando la chapita de hoy, que es la que muestra la bandeja; medir
  la de antes leería algo que nadie vio. (docs/03 §Métricas de éxito)
- **Decisión (2026-10-28, product-owner):** del historial de quien solicitó se mide solo si ya
  tiene al menos una adopción con seguimiento, sí o no, y no cuántas. Motivo: docs/01 pone el
  historial con seguimiento como un escalón de confianza aparte de los niveles y la ficha de la
  solicitud lo muestra; entre la cantidad y el sí o no va el que muestra menos (Ley 18.331).
  (docs/03 §7)
- **Decisión (2026-10-28, product-owner):** abrir el perfil de quien solicitó desde la solicitud se
  cuenta aparte de llegar navegando o desde un enlace. Motivo: es la única señal de que quien
  rescata fue a mirar quién responde por esa persona antes de decidir, que es lo que la
  verificación le ofrece frente a un chat. (docs/03 §7)
- **Decisión (2026-10-28, product-owner):** esta historia no agrega preguntas ni pantallas; lee la
  valoración por lo que la gente hace. Motivo: preguntarle a un rescatista si valora la verificación
  le sugiere la respuesta, como ya se evitó con «esto me ahorró trabajo» en #71, y los momentos ya
  existen. (docs/03 §Métricas de éxito)


---
_Generated by [Claude Code](https://claude.ai/code)_
