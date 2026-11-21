## Historia
**Como** rescatista que publica un animal **quiero** sumarle al cuestionario una pregunta mía, la que
hoy hago por WhatsApp a cada interesado **para** leer la respuesta junto con todo lo demás y decidir
sin entrevistar a nadie por chat.

## Contexto
El cuestionario de #63 es el mismo para todos los animales. Cada animal tiene lo suyo: la perra que
no puede vivir con otra perra, el gato que necesita medicación dos veces por día, el cachorro que hay que
traer a control en Pando el primer mes. Hoy eso se pregunta con «Pedir más información», solicitud
por solicitud, o en el chat después de aceptar, que es el trabajo de entrevistar por WhatsApp que el
sitio promete ahorrar (docs/01 §Huevo y gallina). Si el sitio no reemplaza esa charla, quien rescata
no tiene motivo para dejar el grupo, y la primera métrica de éxito (publicar más de un animal por su
cuenta) no se mueve. #63 la dejó afuera a propósito («preguntas propias de cada rescatista»).
Esta historia dice dos cosas que la beta hoy no puede leer: si el cuestionario alcanza para elegir
sin chatear, y qué le falta, con lo que preguntan los propios rescatistas.

Le gana al recordatorio de solicitudes sin responder (docs/03 §4 lo deja para cuando la beta muestre
solicitudes olvidadas), al traspaso del chip (docs/05: no lee nada de la verificación ni del trabajo
que se ahorra) y a los arreglos visuales que quedaron en «Fuera de alcance» (no enseñan nada de la
hipótesis): es la que más aclara por qué un rescatista se quedaría, por el trabajo que pide.

## Alcance
- Incluye: escribir, cambiar o sacar una pregunta propia al publicar o al editar un animal o una
  camada · que aparezca en el cuestionario de ese animal o de cada cría, para contestar con un texto
  · ver la pregunta y la respuesta en la solicitud, del lado de quien publicó y de quien solicitó ·
  qué pasa con las solicitudes que llegaron antes de la pregunta o antes de un cambio · la lista de
  preguntas en Administrar → Encuestas, sin la persona ni el animal · los momentos que se miden y la
  lectura nueva en docs/03 §Métricas de éxito.
- No incluye (explícito): más de una pregunta por animal o por camada · preguntas con opciones para
  elegir · una pregunta distinta para cada cría de una camada · cambiar las preguntas del
  cuestionario de siempre, sus textos o su orden · mostrar la pregunta en la ficha pública, el
  listado, la vista previa del enlace o el texto para el grupo · proponer la respuesta de una
  solicitud anterior · preguntas guardadas para reusar en otro animal · que una solicitud ya enviada
  conteste una pregunta nueva (para eso sigue «Pedir más información») · cambiar el tope de 3
  preguntas de «Pedir más información» · correos nuevos.

## Reglas de negocio
- Un animal o una camada tiene como mucho una pregunta propia, opcional, de hasta 200 caracteres.
  Se escribe al publicar o al editar, y se puede cambiar o sacar en cualquier momento.
- La pregunta no acepta teléfonos, correos ni enlaces, y se explica por qué, con la misma regla que
  el nombre y la descripción del animal (docs/03 §2).
- La pregunta de una camada vale para cada una de sus crías.
- En el cuestionario, la pregunta propia va justo antes de «¿Por qué <nombre>?», con el nombre de
  quien publicó. Se contesta con un texto de hasta 500 caracteres, obligatorio como las demás, y la
  respuesta tampoco acepta teléfonos, correos ni enlaces (docs/03 §4).
- La respuesta nunca se propone desde una solicitud anterior: es para ese animal, como «¿Por qué
  <nombre>?».
- Cada solicitud muestra la pregunta tal como estaba cuando se contestó. Cambiar o sacar la pregunta
  no cambia ni borra las respuestas que ya llegaron; las solicitudes siguientes contestan la nueva.
- Una solicitud que llegó cuando el animal no tenía pregunta dice «Llegó antes de tu pregunta». Eso
  vale también para la solicitud que espera la identidad (#289) y sale después de que se sumó la
  pregunta: sale como se escribió.
- Si la pregunta cambia mientras alguien escribe el cuestionario, al tocar «Enviar» ve la nueva y la
  contesta antes de mandar; no pierde nada de lo que ya escribió.
- El contacto sigue revelándose solo cuando la solicitud se acepta.

## Criterios de aceptación
### Camino feliz
- **Dado** que publico a Kira **cuando** escribo en «Tu pregunta para quien quiera adoptarlo» «Kira toma una pastilla dos veces por
  día. ¿Podés dársela en horario?» y publico **entonces** la ficha de Kira se ve como siempre, sin
  la pregunta, y quien toca «Quiero adoptar» la encuentra en el cuestionario justo antes de «¿Por qué
  Kira?», con mi nombre.
- **Dado** que Lucía contestó mi pregunta al solicitar a Kira **cuando** abro su solicitud en
  «Solicitudes recibidas» **entonces** veo mi pregunta y su respuesta en la misma pantalla que el resto
  del cuestionario, y Lucía las ve en su solicitud.
- **Dado** que la camada de Luna tiene la pregunta «¿Te comprometés a traerlo a la vacuna de los 3
  meses?» **cuando** alguien solicita cualquiera de sus crías **entonces** la contesta en el
  cuestionario de esa cría.

### Casos borde (al menos 3)
- **Dado** que Kira tenía 2 solicitudes cuando le sumé la pregunta **cuando** abro esas solicitudes
  **entonces** dicen «Llegó antes de tu pregunta», con «Pedir más información» como siempre, y las
  que llegan después traen la respuesta.
- **Dado** que cambié la pregunta de Kira después de 3 solicitudes **cuando** abro una de esas 3
  **entonces** veo la pregunta que contestó esa persona, no la nueva.
- **Dado** que saqué la pregunta de Kira **cuando** abro las solicitudes que la contestaron
  **entonces** siguen mostrando la pregunta y la respuesta, y el cuestionario ya no la pide.
- **Dado** que ya mandé una solicitud por otro animal **cuando** abro el cuestionario de Kira
  **entonces** las respuestas de siempre vienen propuestas y la de la pregunta de Kira está vacía.
- **Dado** que estoy escribiendo el cuestionario de Kira y quien la publicó cambia la pregunta
  **cuando** toco «Enviar» **entonces** veo la pregunta nueva sin contestar, con lo demás que escribí,
  y la solicitud sale recién cuando la contesto.

### Errores y rechazos
- **Dado** que escribo en la pregunta «Escribime al 099 123 456» **cuando** guardo **entonces** no se
  guarda y veo por qué la pregunta no puede llevar un teléfono, sin perder el resto de lo cargado.
- **Dado** que la pregunta pasa de 200 caracteres **cuando** escribo **entonces** veo cuántos sobran y
  no puedo guardar hasta acortarla.
- **Dado** que dejo vacía la respuesta a la pregunta propia o pongo un correo en ella **cuando** toco
  «Enviar» **entonces** la solicitud no sale y veo cuál es el problema al lado de esa respuesta.
- **Dado** que se corta la conexión al guardar la pregunta o al mandar la solicitud **cuando**
  reintento **entonces** queda una sola versión de la pregunta, o una sola solicitud, y no pierdo lo
  escrito.

## Pantallas
- **Publicar y editar un animal o una camada:** el campo «Tu pregunta para quien quiera adoptarlo»,
  opcional, con un ejemplo y el contador de 200. Vacío, muestra solo el ejemplo y una línea que dice
  que la ve quien solicita, no la ficha.
- **Cuestionario:** la pregunta propia antes de «¿Por qué <nombre>?», con el nombre de quien
  publicó y el contador de 500. Sin pregunta, el cuestionario queda como hoy.
- **Una solicitud en «Solicitudes recibidas»:** la pregunta y la respuesta junto al resto del
  cuestionario; «Llegó antes de tu pregunta» cuando no la tuvo. Sin pregunta en el animal, nada nuevo.
- **Mi solicitud (quien solicitó):** su respuesta con la pregunta que contestó.
- **Administrar → Encuestas, «Lo que preguntan quienes publican»:** de los animales y las camadas que
  hoy están publicados, cuántos tienen una pregunta, y las preguntas puestas, sin la persona ni el animal.
  Vacía: «Todavía nadie sumó una pregunta.»

## Datos personales
- La pregunta es un texto de quien publicó, guardado con su animal o su camada. Se borra al sacarla,
  al borrar la publicación o al borrar la cuenta (docs/03 §2).
- La respuesta es parte de las respuestas del cuestionario y sigue sus reglas: la ven solo quien
  solicitó y quien publicó, no quien administra, y se borra al borrar la cuenta de quien solicitó; en
  una solicitud que espera la identidad y no sale, se borra ese día (docs/03 §4, #289).
- Junto a cada respuesta queda la pregunta que se contestó, para que quien publicó la lea aunque
  después la cambie; se borra con la respuesta.
- Quien administra lee las preguntas puestas sin la persona ni el animal, y nunca las respuestas.

## Medición
- Los momentos de publicar y de editar dicen si la publicación tiene una pregunta propia, sí o no,
  nunca el texto.
- Los momentos de mandar una solicitud, de la primera respuesta, de aceptar y de rechazar dicen si la
  solicitud contestó una pregunta propia, sí o no.
- La lectura nueva va en docs/03 §Métricas de éxito, al lado de las lecturas 1 y 3: qué parte de las
  publicaciones lleva una pregunta; entre las solicitudes con pregunta y sin ella, qué parte recibe
  primero «Pedir más información», qué parte se rechaza con «No contestó lo que le pregunté» y en
  cuánto responde quien publicó. Qué preguntan se lee en Administrar → Encuestas. Con 3 a 5
  rescatistas los números son una señal, que se mira al lado de las opiniones y las encuestas.

## Dependencias
- #53 · #59 · #63 · #65 · #71 · #73 · #205 · #206 · #289 · docs/03 §2, §4, §7 y §Métricas de éxito

## Decisiones del enjambre
- **Decisión (2026-11-18, product-owner):** se suma la pregunta propia de quien publica, como feature
  nueva propuesta por Producto al terminarse el mapa. Motivo: dice si el cuestionario alcanza para
  elegir sin entrevistar por WhatsApp, que es el trabajo que tiene que ahorrar para que quien rescata
  deje el grupo (docs/01 §Huevo y gallina), y qué le falta, en palabras de los rescatistas; #63 la
  dejó afuera solo para su primera versión. (docs/03 §4 y §Hipótesis)
- **Decisión (2026-11-18, product-owner):** una sola pregunta por animal o por camada, opcional, de
  hasta 200 caracteres y con respuesta de texto obligatoria de hasta 500. Motivo: cada pregunta más es
  fricción para quien adopta, que es la otra mitad de la hipótesis; una alcanza para lo propio de
  cada animal, y lo demás sigue en «Pedir más información». El largo de la respuesta es el de las otras
  preguntas abiertas (decisión del 2026-09-27). (docs/03 §4)
- **Decisión (2026-11-18, product-owner):** la pregunta no se muestra en la ficha pública. Motivo: es
  parte del cuestionario y no un requisito como el nivel mínimo, que sí se avisa antes; lo que quien
  rescata quiera exigir a la vista va en la descripción, como hoy. (docs/03 §2)
- **Decisión (2026-11-18, product-owner):** cada respuesta queda con la pregunta que se contestó, y
  cambiar o sacar la pregunta no toca lo que ya llegó. Motivo: leer una respuesta al lado de una
  pregunta que la persona nunca vio engaña a quien decide; es la misma idea que «cambiar el texto de
  una pregunta no rompe las respuestas ya enviadas» (docs/06 §Cuestionario). (docs/03 §4)
- **Decisión (2026-11-18, product-owner):** quien administra ve las preguntas puestas sin la persona
  ni el animal, y nunca las respuestas. Motivo: las preguntas son lo que enseña qué le falta al
  cuestionario; la persona y el animal no agregan nada a eso, y entre dos opciones va la que muestra
  menos (Ley 18.331); las respuestas siguen la regla de docs/03 §4. (docs/03 §6 y §7)
- **Decisión (2026-11-18, product-owner):** se mide si hay pregunta, sí o no, en los momentos que ya
  existen, nunca el texto. Motivo: con eso se compara el trabajo de quien rescata con pregunta y sin
  ella; el texto puede nombrar a alguien y no llega a la medición, como el de «Otra cosa» (#234).
  (docs/03 §7 y §Métricas de éxito)


---
_Generated by [Claude Code](https://claude.ai/code)_
