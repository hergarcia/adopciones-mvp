## Historia
**Como** equipo que quiere saber si la verificación vale su fricción **quiero** hacerle dos preguntas
a cada persona cuando termina una adopción o cuando no fue elegida, recibir las opiniones que
cualquiera quiera mandar desde cualquier pantalla y leer todo eso en el sitio, **para** escuchar de
la boca de rescatistas y adoptantes si prefieren esto al grupo de Facebook; y **como** rescatista o
persona que quiere adoptar **quiero** decir qué me frenó o qué me sirvió en un toque, y escribirle
a alguien por WhatsApp cuando me trabo, **para** no tener que buscar a quién contarle.

## Contexto
La instrumentación es "el objetivo real" del MVP (docs/03 §7): una encuesta de 2 preguntas después
de adoptar y después de un rechazo, un botón de opiniones siempre a la vista y un WhatsApp de soporte
en el pie. Cada historia anterior ya emite sus pasos del funnel (vio ficha, clic adoptar, completó
cuestionario, aceptado, adoptado) en su sección Medición; lo que los números no dicen es **por qué**.
Esta historia lo pregunta.

Para la hipótesis (docs/03 §Hipótesis) es la parte que se escucha en vez de contarse: si quien adoptó
siente que verificarse y completar el cuestionario valió la pena frente a un grupo, si quien no fue
elegido sigue buscando acá o vuelve al grupo (docs/01 §Verificación = fricción), y si un rescatista
va a publicar el próximo animal acá. La última métrica de éxito, "¿algún rescatista dijo, sin que se
le pregunte, 'esto me ahorró trabajo'?" (docs/03 §Métricas de éxito), solo se puede leer si hay un
lugar donde decirlo sin que se le pregunte: la pregunta abierta y las opiniones.

Es la tercera historia de M4: usa el cierre de una adopción (#67) y el rechazo (#65).

## Alcance
- Incluye: la **encuesta** de 2 preguntas en tres momentos: a quien publicó, al marcar adoptado un
  animal; a quien adoptó, cuando se marca su adopción; y a quien solicitó, cuando su solicitud no fue
  aceptada o se cerró porque el animal encontró hogar · responderla o cerrarla con "Ahora no" ·
  **Opinar** desde cualquier pantalla, con o sin sesión · el **WhatsApp de soporte** en el pie de
  todas las pantallas · **Opiniones** y **Encuestas** para quien administra, con lo que llegó.
- No incluye (explícito): un tablero con el funnel o las métricas de éxito (cada historia ya emite
  sus pasos, y se leen con la herramienta de medición que se conecta con el sitio en la nube, en M5:
  docs/07) · grabar o reproducir lo que una persona hace en la pantalla · correos o recordatorios
  para pedir que responda la encuesta · más de una encuesta cada 30 días a la misma persona ·
  encuestas en otros momentos (al registrarse, al verificar, al retirar una solicitud, en el
  seguimiento de #69) · que quien administra conteste una opinión desde el sitio o sepa quién la
  mandó · cambiar las preguntas desde el sitio · un chat de soporte dentro del sitio (se habla por
  WhatsApp, "Fuera del MVP") · elegir o conseguir el número de soporte · el panel de administración
  consolidado (#73) · las preguntas frecuentes y su enlace en el pie (#8) · una encuesta cuando la
  solicitud se retira, o se cierra porque el animal se pausó, venció o se borró, porque quien publicó
  dejó de recibir solicitudes, o por un bloqueo o una suspensión.

## Reglas de negocio
- **La encuesta** tiene siempre dos preguntas. La primera se contesta con una de tres opciones y es
  obligatoria; la segunda, "¿Algo más que quieras contarnos?", es texto libre, opcional, de hasta 500
  caracteres. La primera cambia según el momento:
  - A quien publicó, al marcar adoptado un animal (#67), a una persona del sitio o por fuera:
    "¿El próximo animal que des en adopción lo publicarías acá?" Sí · Tal vez · No.
  - A quien adoptó, cuando quien publicó lo eligió al marcar adoptado (#67): "Verificarte y
    completar el cuestionario, ¿valió la pena comparado con adoptar por un grupo de Facebook o
    WhatsApp?" Sí · Más o menos · No.
  - A quien solicitó, cuando no fue elegida: su solicitud fue rechazada, su aceptación se dejó sin
    efecto (#65), o se cerró porque el animal se marcó adoptado, con otra persona o por fuera del
    sitio (#67): "¿Vas a seguir buscando por acá?" Sí · Tal vez · No, vuelvo a los grupos. Ningún
    otro cierre de una solicitud ofrece encuesta.
- La encuesta aparece en el sitio, en la pantalla donde la persona ve ese desenlace: en Mis animales,
  sobre el animal recién adoptado; en Mi solicitud, debajo de "Adoptaste a <nombre>" y del compromiso,
  o debajo de que la solicitud no fue aceptada o se cerró. Nunca tapa la pantalla ni frena lo que la
  persona vino a hacer, y no llega por correo.
- La encuesta queda en su lugar hasta que la persona la responde o toca "Ahora no". Después de
  cualquiera de las dos no vuelve a aparecer para ese desenlace.
- A cada persona se le ofrece **como mucho una encuesta cada 30 días**, contados desde el día en que
  vio la anterior: si en ese lapso tiene otro desenlace, no se le ofrece otra.
- Si quien adoptó dice "Yo no adopté a <nombre>" (#67) antes de responder, la encuesta desaparece,
  deja de contarse como ofrecida y no cuenta para sus 30 días. Una cuenta suspendida (#13) no ve
  encuestas.
- **Opinar** está a la vista en todas las pantallas, con o sin sesión, sin bajar hasta el final, y
  nunca tapa la acción principal de la pantalla. Abre un texto de hasta 1.000 caracteres, obligatorio,
  y dice que la opinión llega sin el nombre de quien la manda y que, para que te respondan, está el
  WhatsApp de soporte. Se guarda con el día y la pantalla desde la que se mandó.
- Desde un mismo navegador se pueden mandar hasta 5 opiniones por día.
- Ni una opinión ni la respuesta libre de una encuesta pueden llevar un teléfono o un correo, como
  las preguntas de #65: se le dice a la persona que lo saque.
- **Las respuestas y las opiniones no se guardan con la persona**, igual que la medición de #9: quien
  administra ve qué se respondió y cuándo, nunca quién. De cada persona, el sitio guarda solo que se
  le ofreció una encuesta, para qué desenlace y cuándo, para respetar los 30 días.
- **El WhatsApp de soporte** está en el pie de todas las pantallas y abre WhatsApp con el número de
  soporte y un saludo escrito que nombra al sitio, sin ningún dato de la persona. El número lo define
  el equipo, fuera del sitio; mientras no hay ninguno, el enlace no aparece y el pie muestra solo
  Opinar.
- **Opiniones** y **Encuestas** las ven solo quienes administran (#11). Opiniones muestra lo que
  llegó, de la más nueva a la más vieja, con el día y la pantalla, y quien administra puede borrar
  una. Encuestas muestra, para cada momento, cuántas se ofrecieron, cuántas se respondieron y
  cuántas se cerraron con "Ahora no", cuántas veces se eligió cada opción, y las respuestas libres,
  de la más nueva a la más vieja, con el día y la opción que las acompañó. Borrar una cuenta no
  cambia ninguno de esos números.
- Tocar dos veces "Enviar" en la encuesta o en Opinar guarda una sola respuesta.

## Criterios de aceptación
### Camino feliz
- **Dado** que marqué adoptado a Tobi eligiendo a Ana **cuando** vuelvo a Mis animales **entonces**
  sobre Tobi veo "¿El próximo animal que des en adopción lo publicarías acá?", elijo "Sí", escribo
  "me ahorró las entrevistas por WhatsApp", toco "Enviar", veo un agradecimiento y la encuesta no
  vuelve a aparecer.
- **Dado** que Ana fue elegida para Tobi **cuando** abre Mi solicitud **entonces** debajo del
  compromiso ve la pregunta sobre si verificarse valió la pena, elige "Más o menos", toca "Enviar"
  sin escribir nada y ve el agradecimiento.
- **Dado** que la solicitud de Bruno no fue aceptada **cuando** abre Mi solicitud desde el correo del
  rechazo **entonces** ve "¿Vas a seguir buscando por acá?", elige "No, vuelvo a los grupos" y
  envía.
- **Dado** que miro la ficha de Luna sin sesión **cuando** toco "Opinar", escribo "no entiendo por
  qué me piden el teléfono para preguntar" y envío **entonces** veo que llegó, y quien administra la
  ve en Opiniones con el día y la ficha de Luna como pantalla, sin mi nombre.
- **Dado** que el equipo definió el número de soporte **cuando** toco el WhatsApp del pie en
  cualquier pantalla **entonces** se abre WhatsApp con ese número y el saludo escrito.
- **Dado** que administro el sitio **cuando** abro Encuestas **entonces** veo, para cada uno de los
  tres momentos, cuántas se ofrecieron, se respondieron y se cerraron, cuántas veces se eligió cada
  opción y las respuestas libres, sin el nombre de nadie.

### Casos borde (al menos 3)
- **Dado** que vi la encuesta por Tobi hace 10 días **cuando** marco adoptada a Luna **entonces** no
  se me ofrece otra encuesta; si la marco cuando ya pasaron 31 días desde que vi la de Tobi, sí.
- **Dado** que tengo la encuesta de Tobi sin responder **cuando** toco "Ahora no" **entonces**
  desaparece, no vuelve a aparecer por Tobi, y Encuestas la cuenta como cerrada.
- **Dado** que abrí Mi solicitud y no respondí ni cerré la encuesta **cuando** vuelvo al otro día
  **entonces** la encuesta sigue ahí.
- **Dado** que Ana no respondió su encuesta **cuando** toca "Yo no adopté a Tobi" y confirma
  **entonces** la encuesta desaparece.
- **Dado** que di a Luna por fuera del sitio **cuando** la marco adoptada **entonces** se me ofrece la
  misma encuesta que si la hubiera dado a alguien del sitio.
- **Dado** que Ana respondió su encuesta y después borró su cuenta **cuando** quien administra abre
  Encuestas **entonces** las ofrecidas, las respondidas y la opción que eligió siguen contadas igual
  que antes, sin nombre.
- **Dado** que Ana tocó "Yo no adopté a Tobi" sin responder su encuesta **cuando** quien administra
  abre Encuestas **entonces** esa encuesta no figura entre las ofrecidas; y si a los 10 días otra
  solicitud de Ana no es elegida, se le ofrece la encuesta de ese desenlace.
- **Dado** que quien publicó a Luna dejó sin efecto la aceptación de Bruno **cuando** Bruno abre Mi
  solicitud **entonces** ve "¿Vas a seguir buscando por acá?".
- **Dado** que retiré mi solicitud por Luna, o se cerró porque Luna venció **cuando** abro Mi
  solicitud **entonces** no veo ninguna encuesta.
- **Dado** que el equipo todavía no definió el número de soporte **cuando** miro el pie **entonces**
  veo solo Opinar, sin enlace a WhatsApp.
- **Dado** que mandé 5 opiniones hoy desde este navegador **cuando** intento mandar la sexta
  **entonces** se me dice que ya mandé varias hoy y se me ofrece el WhatsApp de soporte, si hay número.

### Errores y rechazos
- **Dado** que escribo mi teléfono en la opinión o en la respuesta libre **cuando** toco "Enviar"
  **entonces** no se manda, se me dice que no puede llevar un teléfono ni un correo y que para que me
  respondan está el WhatsApp de soporte, y lo que escribí sigue ahí.
- **Dado** que no elegí ninguna opción en la encuesta **cuando** toco "Enviar" **entonces** se me dice
  que elija una.
- **Dado** que Opinar está vacío **cuando** toco "Enviar" **entonces** se me pide que escriba algo; si
  paso de 1.000 caracteres veo cuántos sobran y no puedo enviar.
- **Dado** que se corta la conexión **cuando** envío una opinión o una encuesta **entonces** no se
  pierde lo que escribí, se me dice que no se pudo por la conexión y puedo reintentar.
- **Dado** que no administro el sitio **cuando** abro la dirección de Opiniones o de Encuestas
  **entonces** veo que no existe, igual que si no existiera.
- **Dado** que respondí la encuesta en otra pestaña **cuando** envío la misma encuesta desde esta
  **entonces** queda una sola respuesta y veo el agradecimiento.

## Pantallas
- **Pie de todas las pantallas** (nuevo): Opinar y el WhatsApp de soporte. Vacío: sin número de
  soporte, solo Opinar.
- **Opinar** (nuevo, a la vista en todas las pantallas): el texto, lo que se hace con la opinión, el
  WhatsApp de soporte para que te respondan y el agradecimiento al enviar. Vacío: no aplica.
- **La encuesta**, dentro de **Mis animales** (cambia, de #59 y #67) y de **Mi solicitud** (cambia, de
  #63, #65 y #67): la pregunta del momento, sus tres opciones, la pregunta abierta, "Enviar", "Ahora
  no" y el agradecimiento. Vacío: no aplica; sin encuesta, esas pantallas quedan como estaban.
- **Opiniones**, solo para quien administra (nuevo): lo que llegó, con el día, la pantalla y "Borrar".
  Vacío: "Todavía no llegó ninguna opinión."
- **Encuestas**, solo para quien administra (nuevo): los tres momentos con sus cuentas y sus
  respuestas libres. Vacío: cada momento en cero, con "Todavía nadie respondió esta encuesta."

## Datos personales
- De cada persona se guarda solo que se le ofreció una encuesta, para qué desenlace y cuándo; se
  borra al borrar la cuenta. Las respuestas y las opiniones se guardan sin nada que las una a la
  persona: el día, el momento o la pantalla, la opción y el texto libre, que no puede llevar un
  teléfono ni un correo. Las ven solo quienes administran, y pueden borrar una opinión. Como no están
  unidas a nadie, borrar la cuenta no las borra. El WhatsApp de soporte no le pasa a WhatsApp ningún
  dato de la persona; lo que escriba ahí queda en WhatsApp, fuera del sitio.

## Medición
- Encuesta ofrecida, respondida (el momento, la opción elegida y si escribió algo en la abierta,
  nunca el texto) y cerrada con "Ahora no"; opinión enviada (desde qué pantalla); toque en el WhatsApp
  de soporte (desde qué pantalla). Las respuestas por momento son la voz de la hipótesis (docs/03
  §Hipótesis): si la verificación valió la pena para quien adoptó, si quien no fue elegido vuelve a
  los grupos y si quien rescata publicaría el próximo acá; las opiniones y la pregunta abierta son
  donde se puede leer "esto me ahorró trabajo" sin haberlo preguntado (docs/03 §Métricas de éxito).
  Ningún evento lleva datos de las personas.

## Dependencias
- #67 Marcar a quién se entregó cada animal (marcar adoptado, "Adoptaste", "Yo no adopté").
- #65 Responder las solicitudes (rechazada, aceptación sin efecto, el correo del rechazo).
- #63 Solicitar la adopción (Mi solicitud) · #59 Mantener al día cada publicación (Mis animales).
- #11 Verificación de identidad (quién administra) · #13 Suspender · #9 la medición sin la persona.
- docs/03 §7, §Hipótesis y §Métricas de éxito · docs/01 §Verificación = fricción y §Legal / datos ·
  docs/07 (la herramienta de medición llega en M5) · docs/06 · docs/10.

## Decisiones del enjambre
- **Decisión (2026-09-27, product-owner):** la encuesta es una pregunta de tres opciones distinta por
  momento y la misma pregunta abierta opcional para los tres: a quien publicó, si publicaría acá el
  próximo; a quien adoptó, si verificarse y el cuestionario valieron la pena frente a un grupo; a quien
  no fue elegido, si sigue buscando acá. Motivo: cada una lee una parte de la hipótesis de docs/03, y
  a quien rescata no se le pregunta si le ahorró trabajo porque la métrica pide que lo diga sin que se
  le pregunte. Es la primera versión, que se muestra a los 3-4 rescatistas junto con el cuestionario
  antes de la beta. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** "post-rechazo" incluye la solicitud que se cerró porque el
  animal encontró hogar con otra persona, y "post-adopción" incluye al rescatista que lo dio por fuera
  del sitio. Motivo: para quien solicitó, no ser elegido es el mismo desenlace se llame como se llame,
  y quien dio el animal por fuera es justo quien puede decir por qué. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** la encuesta aparece en el sitio, en la pantalla del
  desenlace, sin correos ni recordatorios, y como mucho una cada 30 días por persona; "Ahora no" la
  cierra para siempre. Motivo: un rescatista con diez adopciones no quiere diez encuestas, y perseguir
  con correos es lo que el sitio promete ahorrar (docs/01 §Huevo y gallina); los 30 días dan tres
  lecturas por persona en una beta de 2-3 meses. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** las respuestas y las opiniones no se guardan con la
  persona, como la medición de #9, y no pueden llevar un teléfono ni un correo; de cada persona queda
  solo que se le ofreció una encuesta y cuándo. Motivo: es lo mínimo que alcanza para aprender (docs/01
  §Legal / datos), la gente contesta más sincero si sabe que no se lo van a reprochar, y así no nace
  ningún dato personal nuevo que decidir. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** Opinar está a la vista en todas las pantallas, también sin
  sesión, con hasta 5 opiniones por día desde un mismo navegador, y quien administra las lee y puede
  borrarlas en el sitio. Motivo: quien se va sin registrarse es a quien más hay que escuchar, y un tope
  chico frena el abuso sin frenar a nadie que opina de verdad. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** el número de WhatsApp de soporte lo define el equipo fuera
  del sitio, y mientras no hay ninguno el enlace no aparece. Motivo: conseguir o elegir un número no es
  una decisión de producto, y un enlace roto en el pie es peor que ninguno. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** esta historia no construye un tablero del funnel ni de las
  métricas de éxito: cada historia emite sus pasos y se leen con la herramienta de medición que llega
  con el sitio en la nube, en M5 (docs/07). Motivo: un tablero propio duplicaría esa herramienta, y lo
  que los números no dicen, el porqué, es lo que esta historia agrega. Va en docs/03 §7.
- **Decisión (2026-10-08, product-owner):** "no ser elegido" es una solicitud rechazada, una aceptación
  dejada sin efecto o una solicitud cerrada porque el animal se marcó adoptado; retirarla, o que se
  cierre porque el animal se pausó, venció o se borró, porque quien publicó dejó de recibir, o por un
  bloqueo o una suspensión, no ofrece encuesta. Motivo: la pregunta es sobre no haber sido elegido, y
  en esos otros cierres nadie eligió a otra persona; dejar una aceptación sin efecto es un rechazo
  que llega más tarde. Va en docs/03 §7.
- **Decisión (2026-10-08, product-owner):** la encuesta que desaparece porque quien fue elegida dijo
  "Yo no adopté" no se cuenta como ofrecida ni gasta sus 30 días, y borrar una cuenta no cambia
  ningún número de Encuestas. Motivo: esa persona no vivió el desenlace por el que se le preguntaba,
  y los números de Encuestas son la lectura de la hipótesis (docs/03 §Hipótesis): si bajaran al
  borrarse una cuenta, la proporción de respondidas dejaría de poder compararse. Va en docs/03 §7.


