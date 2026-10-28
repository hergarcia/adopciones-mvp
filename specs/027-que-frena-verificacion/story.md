## Historia
**Como** equipo que quiere saber si la verificación vale su fricción **quiero** preguntarle qué la
frena a cada persona que deja la verificación del teléfono o de la identidad a mitad de camino
**para** saber por qué se frena, además de cuántas personas se frenan; y **como** rescatista o
persona que quiere adoptar **quiero** decirlo en un toque, sin que me cueste salir **para** que el
sitio sepa qué me hizo dar la vuelta.

## Contexto
La hipótesis (docs/03 §Hipótesis) pregunta si rescatistas y adoptantes aceptan la fricción de
verificarse en vez de quedarse en Facebook, y la métrica que la mide de frente es qué parte de los
adoptantes completa el nivel 2 cuando se lo exigen: menos de 30 % es «fricción mal calibrada»
(docs/03 §Métricas de éxito). Hoy el sitio cuenta cuántas veces una ficha frenó a alguien por la
identidad y cuántos pedidos se mandan (#169), pero no por qué el resto se fue. Un 25 % puede ser
miedo a mandar la cédula (docs/01 §Verificación = fricción), un código que no llegó o gente que
prefiere arreglar por el grupo, y cada una de esas respuestas pide un arreglo distinto: explicar
mejor, arreglar el mensaje o bajar la exigencia. Lo mismo vale para el teléfono de quien rescata,
que es el nivel que le pide el sitio para publicar. La encuesta de #71 pregunta al final de una
adopción y dejó afuera, a propósito, preguntar al verificar; esta historia agrega ese momento.

Le gana a los detalles de camadas de las aceptaciones de #205 y #206 (baratos, no enseñan nada de la
hipótesis), a mostrarle a cada rescatista qué le trajo cada animal (más caro, lee el valor de costado) y
al traspaso del chip (docs/05, depende de un trámite sin averiguar): vuelve corregible la métrica central
y reusa la encuesta y Encuestas de #71.

## Alcance
- Incluye: una pregunta de una sola opción, «¿Qué te frena?», cuando la persona sale de su primera
  verificación del teléfono o de su pedido de verificación de identidad con «Ahora no» o «Cancelar
  la verificación» · contestarla en un toque o seguir sin contestar · lo que se contestó, para
  quien administra, en Encuestas, separado por nivel y por desde dónde llegó la persona.
- No incluye (explícito): preguntar a quien cierra la pestaña o se va sin tocar nada (el sitio no
  sabe que se fue) · preguntar al cambiar de número, al recuperar un número que tiene otra cuenta
  (#25), en la pantalla del tope de pedidos rechazados o al retirar un pedido de identidad ya
  enviado · preguntar por el aval (nivel 3) · correos o recordatorios para que vuelva a verificarse
  o conteste · cambiar las opciones desde el sitio · cambiar los niveles que se exigen o la
  verificación misma · que quien administra sepa quién contestó · un tablero del funnel (lo lee la
  herramienta de medición, #169).

## Reglas de negocio
- La pregunta aparece en la misma pantalla de la verificación, en el lugar de lo que la persona
  estaba completando, cuando toca «Ahora no» o «Cancelar la verificación» en una verificación que
  todavía no terminó nunca: la del teléfono, la primera vez, y el pedido de identidad. No aparece
  al cambiar un teléfono ya verificado.
- Para el teléfono pregunta «¿Qué te frena para verificar tu teléfono?», con estas opciones: No
  quiero dar mi número · No me llegó el código · Ahora no puedo, lo hago más tarde · Prefiero
  seguir por el grupo de Facebook o WhatsApp · Otra cosa.
- Para la identidad pregunta «¿Qué te frena para verificar tu identidad?», con estas opciones: No
  quiero mandar fotos de mi cédula · Ahora no puedo, lo hago más tarde · Me parece demasiado ·
  Prefiero seguir por el grupo de Facebook o WhatsApp · Otra cosa.
- Tocar una opción la manda y lleva a la persona a donde la llevaba «Ahora no» antes de esta
  historia (la ficha del animal, Publicar, Mi perfil). «Otra cosa» abre un texto opcional de hasta
  300 caracteres con «Enviar». «Seguir sin contestar» lleva al mismo lugar sin mandar nada. La
  pregunta nunca agrega más de un toque a quien se quiere ir.
- A cada persona se le hace **una sola vez por nivel**, la conteste o no. La siguiente vez que toca
  «Ahora no» en ese nivel sale directo, como hoy. Quien la recibió por el teléfono puede recibirla
  después por la identidad.
- Esta pregunta no cuenta para la encuesta de una cada 30 días de #71, y esa encuesta no la frena:
  son momentos distintos y una no le quita la lectura a la otra.
- Cada respuesta se guarda con el nivel, el día y desde dónde llegó la persona a verificarse:
  porque quería publicar, porque quería solicitar un animal, o por su cuenta desde Mi perfil. Nunca
  el animal ni la hora.
- El texto de «Otra cosa» no puede llevar un teléfono ni un correo, como las respuestas de #71: se
  le dice a la persona que lo saque.
- **Las respuestas no se guardan con la persona**, como las de #71. De cada persona queda solo que
  ya se le hizo la pregunta de ese nivel, para no repetirla.
- En **Encuestas**, quien administra ve un apartado nuevo, «Por qué no se verificaron», con un
  bloque por nivel: cuántas veces se hizo la pregunta, cuántas se contestaron y cuántas se siguió
  sin contestar; cuántas veces se eligió cada opción, en total y separado por publicar, solicitar o
  por su cuenta; y los textos de «Otra cosa», del más nuevo al más viejo, con el día. Borrar una
  cuenta no cambia ninguno de esos números.
- Tocar dos veces una opción o «Enviar» guarda una sola respuesta.

## Criterios de aceptación
### Camino feliz
- **Dado** que Bruno quiere solicitar a Luna, que pide nivel 2, y abrió el pedido de verificación
  de identidad **cuando** toca «Ahora no» **entonces** ve «¿Qué te frena para verificar tu
  identidad?» con cinco opciones, toca «No quiero mandar fotos de mi cédula» y vuelve a la ficha de
  Luna.
- **Dado** que Carla entró para publicar su primer animal y está en la verificación del teléfono
  **cuando** toca «Ahora no» y elige «Prefiero seguir por el grupo de Facebook o WhatsApp»
  **entonces** vuelve a donde la llevaba «Ahora no» y la respuesta queda contada en publicar.
- **Dado** que Ana pidió el código y no le llegó **cuando** toca «Cancelar la verificación» y elige
  «No me llegó el código» **entonces** sale de la verificación y la respuesta queda contada.
- **Dado** que Diego está en la pregunta de la identidad **cuando** toca «Otra cosa», escribe «no
  tengo la cédula, tengo pasaporte» y toca «Enviar» **entonces** sale y quien administra lee ese
  texto en Encuestas con el día, sin su nombre.
- **Dado** que administro el sitio **cuando** abro Encuestas **entonces** veo «Por qué no se
  verificaron» con un bloque para el teléfono y otro para la identidad, cuántas veces se preguntó,
  se contestó y se siguió sin contestar, y cuántas veces se eligió cada opción, en total y por
  publicar, solicitar o por su cuenta.

### Casos borde (al menos 3)
- **Dado** que Bruno ya recibió la pregunta de la identidad, la haya contestado o no **cuando**
  vuelve a tocar «Ahora no» en el pedido de identidad otro día **entonces** sale directo, sin la
  pregunta.
- **Dado** que Bruno recibió la pregunta del teléfono hace una semana **cuando** toca «Ahora no» en
  el pedido de identidad por primera vez **entonces** recibe la pregunta de la identidad.
- **Dado** que la pregunta está en pantalla **cuando** toco «Seguir sin contestar» **entonces** voy
  a donde me llevaba «Ahora no», no se manda nada y Encuestas la cuenta como no contestada.
- **Dado** que Ana tiene el teléfono verificado y lo está cambiando **cuando** toca «Cancelar el
  cambio» **entonces** sale como hoy, sin la pregunta.
- **Dado** que Ana tiene pendiente la encuesta de una adopción de #71 **cuando** deja la
  verificación de identidad **entonces** recibe igual esta pregunta, y la encuesta de la adopción
  sigue en su lugar.
- **Dado** que Diego contestó la pregunta de la identidad y después borró su cuenta **cuando** quien
  administra abre Encuestas **entonces** las veces preguntadas, las contestadas y la opción que
  eligió siguen contadas igual.
- **Dado** que en «Otra cosa» no escribo nada **cuando** toco «Enviar» **entonces** se manda como
  «Otra cosa» sin texto y salgo.

### Errores y rechazos
- **Dado** que en «Otra cosa» escribo mi teléfono o mi correo **cuando** toco «Enviar»
  **entonces** no se manda, se me dice que no puede llevar un teléfono ni un correo y lo que escribí
  sigue ahí; «Seguir sin contestar» sigue funcionando.
- **Dado** que paso de 300 caracteres en «Otra cosa» **cuando** miro el texto **entonces** veo
  cuántos sobran y no puedo enviar.
- **Dado** que se corta la conexión **cuando** toco una opción **entonces** sigo en la pregunta con
  la opción marcada, se me dice que no se pudo por la conexión y puedo tocarla de nuevo o seguir
  sin contestar.
- **Dado** que contesté la pregunta en otra pestaña **cuando** contesto la misma desde esta
  **entonces** queda una sola respuesta y salgo igual.
- **Dado** que no administro el sitio **cuando** abro la dirección de Encuestas **entonces** veo que
  no existe, igual que hoy.

## Pantallas
- **Verificación del teléfono** (primera vez, antes o después de pedir el código): al tocar «Ahora
  no» o «Cancelar la verificación» la pregunta toma el lugar del formulario, con sus cinco opciones
  y «Seguir sin contestar». Sin pregunta pendiente (ya se hizo), la pantalla es la de hoy.
- **Pedido de verificación de identidad**: igual, con las opciones de la identidad. Sin pregunta
  pendiente, la pantalla es la de hoy.
- **Encuestas** (quien administra): el apartado nuevo «Por qué no se verificaron». Vacío: «Todavía
  nadie contestó por qué no se verificó»; un nivel sin respuestas lo dice en su bloque, y sin textos
  de «Otra cosa» dice que nadie escribió nada todavía.

## Datos personales
- De cada persona se guarda solo que ya se le hizo la pregunta de cada nivel, sin el día ni la
  respuesta; se borra con su cuenta.
- La respuesta se guarda sin la persona: el nivel, la opción, desde dónde llegó (publicar,
  solicitar o por su cuenta), el día y el texto opcional, que no puede llevar un teléfono ni un
  correo. La ven solo quienes administran, nunca quién la mandó. Sin el animal ni la hora, para que
  no se pueda deducir quién contestó (Ley 18.331).

## Medición
- Se cuenta cada vez que se hace la pregunta, cada respuesta con su nivel, su opción y desde dónde
  llegó la persona, y cada «Seguir sin contestar», sin persona, como el resto de la medición del
  sitio (docs/03 §7). Se lee al lado de la métrica del nivel 2 (docs/03 §Métricas de éxito, 2):
  de las veces que una ficha frenó a alguien por la identidad, qué dijeron los que se fueron.

## Dependencias
- #10 verificación del teléfono · #11 verificación de identidad · #71 encuesta, opiniones y
  Encuestas · #169 medición en el sitio de verdad · docs/03 §Hipótesis, §7 y §Métricas de éxito ·
  docs/01 §Verificación = fricción.

## Decisiones del enjambre
- **Decisión (2026-10-28, product-owner):** la pregunta aparece en la misma pantalla de la
  verificación cuando la persona toca «Ahora no» o «Cancelar la verificación» en su primera
  verificación del teléfono o en su pedido de identidad, una sola vez por persona y por nivel, y
  tocar una opción la manda y sale. Motivo: es el único momento en que el sitio sabe que alguien
  deja la verificación y por qué se puede preguntar; una vez por nivel cuenta personas y no toques,
  y salir en un toque evita que la pregunta sume la fricción que quiere medir. (docs/03 §7)
- **Decisión (2026-10-28, product-owner):** esta pregunta no cuenta para la encuesta de una cada
  30 días de #71 ni la frena. Motivo: una pregunta al irse y otra al terminar una adopción leen
  partes distintas de la hipótesis, y en una beta de 2-3 meses perder una por la otra deja una
  métrica sin datos. (docs/03 §7)
- **Decisión (2026-10-28, product-owner):** las opciones son, para el teléfono, no querer dar el
  número, el código que no llegó, hacerlo más tarde, preferir el grupo y otra cosa; para la
  identidad, no querer mandar la cédula, hacerlo más tarde, parecer demasiado, preferir el grupo y
  otra cosa. Motivo: cada una pide un arreglo distinto (explicar mejor, el mensaje que no llega,
  recordar, bajar la exigencia) y «prefiero el grupo» es la hipótesis contestada de frente (docs/01
  §Verificación = fricción). (docs/03 §7)
- **Decisión (2026-10-28, product-owner):** la respuesta se guarda sin la persona, con el nivel, el
  día y si llegó por publicar, por solicitar o por su cuenta, nunca el animal ni la hora; de la
  persona queda solo que ya se le preguntó. Motivo: separar publicar de solicitar dice si se frena
  quien rescata o quien adopta, que es lo que la hipótesis pregunta; el animal o la hora dirían
  quién contestó, y entre dos opciones va la que guarda menos (Ley 18.331), como en #71. (docs/03 §7)


---
_Generated by [Claude Code](https://claude.ai/code)_
