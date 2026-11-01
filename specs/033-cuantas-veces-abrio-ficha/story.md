## Historia
**Como** rescatista que publicó un animal **quiero** ver cuántas veces se abrió su ficha, cuántas
veces se tocó «Quiero adoptar», cuántos de esos toques no siguieron porque a la persona le faltaba
el teléfono o la identidad verificados y cuántas solicitudes llegaron **para** saber si el enlace que pegué en el
grupo trae gente y cuánto me cuesta el nivel que pido; y **como** equipo **quiero** leer si quien
rescata mantiene la verificación cuando ve lo que le cuesta, **para** responder la hipótesis con lo
que hace y no con lo que dice.

## Contexto
En el grupo de Facebook quien rescata ve enseguida si su posteo se mueve: comentarios, veces
compartido, mensajes. En el sitio no ve nada hasta que llega una solicitud, y una ficha que parece
muda es la razón para volver al grupo (docs/01 §Huevo y gallina: al principio el producto es un CRM
para rescatistas). Además, quien rescata elige al publicar si pide teléfono o identidad (#59), pero
nunca se entera de cuánta gente se quedó en la puerta por eso. La medición ya cuenta esos frenos
(#240, docs/03 §Métricas lectura 2), aunque solo los ve el equipo y sin saber de qué animal son.

La hipótesis pregunta si los rescatistas valoran la verificación lo suficiente para pagar su fricción
(docs/03 §Hipótesis). Hoy la pagan sin verla. Con los frenos a la vista, que mantenga el nivel 2 o lo
baje es la respuesta más directa que la beta puede dar, y la primera métrica (publicar más de un
animal por su cuenta) gana una razón para volver: ver que la ficha trabaja.

Le gana a cargar un animal nuevo a partir de uno anterior, a la marca de camada en la tarjeta del
listado (vista en #223) y a los detalles de texto de las aceptaciones de #206 y #264: esas cosas
facilitan o pulen, pero ninguna enseña nada sobre la verificación. El recordatorio de solicitudes sin
responder espera datos de la beta (decisión 2026-09-27, docs/03 §4).

## Alcance
- Incluye: en la página de cada animal de «Mis animales» y en la de cada camada, lo contado desde
  que se publicó: veces que se abrió la ficha, veces que se tocó «Quiero adoptar», veces que ese
  toque frenó a alguien porque no tenía el teléfono verificado, veces que lo frenó por la identidad
  cuando el animal la pide, y solicitudes que llegaron · el nivel que pide la publicación,
  dicho al lado de los frenos · el estado vacío, el de cargando y el de error · cómo se lee en
  docs/03 §Métricas de éxito.
- No incluye (explícito): mostrar estos números en la ficha pública, en el perfil público, en la
  tarjeta del listado o a quien administra · quién abrió la ficha, quién se frenó o cuándo · contar
  personas en lugar de veces · los frenos que no son de verificación (el tope de solicitudes activas,
  que quien publicó ya no recibe) · sugerirle a quien rescata que cambie el nivel que pide · números
  por día, gráficos o comparaciones entre animales · avisos por correo con los números · los números
  en la lista de «Mis animales» · contar cuántos de los que se frenaron volvieron verificados y
  mandaron la solicitud · un momento nuevo en la medición.

## Reglas de negocio
- Los números los ve solo quien publicó el animal o la camada, en su página de «Mis animales».
  Nadie más, tampoco quien administra.
- Se cuentan veces, nunca personas: si alguien abre la ficha tres veces, suma tres. El sitio no
  guarda quién abrió, quién tocó ni quién se frenó.
- Abrir la ficha suma una vez cada vez que carga, en cualquier estado (disponible, en proceso,
  pausada, vencida o adoptada), porque el enlace pegado en el grupo sigue trayendo gente. No suman:
  las veces que la abre quien la publicó, la vista previa que arman WhatsApp, Facebook u otra
  aplicación al pegar el enlace, ni los buscadores.
- «Quiero adoptar» suma una vez por toque, con la misma regla que ya usa la medición (#240): tocarlo
  sin cuenta también suma.
- Un freno suma cuando el toque no deja seguir a la persona porque le falta el teléfono verificado o
  la identidad que pide la publicación, una vez por toque y por motivo (decisión 2026-10-29, docs/03
  §Métricas). Si en el mismo camino la frenó el teléfono y después la identidad, suma uno en cada
  uno.
- Solicitudes que llegaron cuenta todas las mandadas por ese animal, también las que después se
  retiraron o se cerraron, sin decir por qué se cerraron (decisión 2026-10-07, docs/03 §4).
- Al lado de los frenos se dice qué pide hoy la publicación («Pedís el teléfono verificado» o «Pedís
  la identidad verificada»), sin sugerir que se cambie. Cambiarlo sigue siendo editar el animal, como
  hoy.
- Una camada cuenta como una sola publicación: las aperturas de su ficha y los toques, los frenos y
  las solicitudes de todas sus crías suman en la página de la camada, como ya
  cuenta la primera métrica (decisión 2026-10-20, docs/03 §Métricas).
- Se cuenta desde el día en que llega esta historia. Una publicación anterior dice «desde el
  <día>» con esa fecha en lugar de «desde que lo publicaste».
- Al abrir la página se ven los números contados hasta ese momento. Si no se pueden traer, el resto
  de la página funciona igual.
- Borrar el animal, la camada o la cuenta borra sus números.

## Criterios de aceptación
### Camino feliz
- **Dado** que Carla publicó a Tobi pidiendo el teléfono verificado, su ficha se abrió 40 veces,
  se tocó 6 veces «Quiero adoptar», 2 de esos toques no siguieron porque faltaba el teléfono y
  llegaron 3 solicitudes **cuando** Carla abre la página de Tobi en «Mis animales» **entonces** ve
  40, 6, 2 frenados por el teléfono y 3 solicitudes, y la línea «Pedís el teléfono verificado».
- **Dado** que Tobi pide la identidad verificada y Bruno, con nivel 1, toca «Quiero adoptar»
  **cuando** el sitio le dice que necesita verificar su identidad **entonces** al volver a la página
  de Tobi Carla ve un freno más por la identidad y uno más en «Quiero adoptar».
- **Dado** que Carla publicó la camada de Kira con 5 crías **cuando** alguien abre la ficha de la
  camada y otra persona la abre y toca «Quiero adoptar» en una cría **entonces** la página de la
  camada suma 2 aperturas y 1 toque, y ninguna cría tiene números propios.

### Casos borde (al menos 3)
- **Dado** que Carla pega el enlace de Tobi en WhatsApp y se arma la vista previa **cuando** vuelve
  a la página de Tobi **entonces** las aperturas no subieron.
- **Dado** que Carla abre la ficha pública de Tobi para ver cómo quedó **cuando** vuelve a su página
  **entonces** las aperturas no subieron.
- **Dado** que Bruno no tiene el teléfono ni la identidad y Tobi pide la identidad **cuando** toca
  «Quiero adoptar», verifica el teléfono y lo frena la identidad **entonces** Carla ve un freno por
  el teléfono y uno por la identidad.
- **Dado** que Tobi está adoptado y su posteo viejo en el grupo sigue trayendo gente **cuando**
  alguien abre su ficha **entonces** la apertura suma.
- **Dado** que Luna se publicó antes del día en que llegó esta historia **cuando** Carla abre su
  página **entonces** ve los números con «desde el <día>» y la fecha en que se empezó a contar.
- **Dado** que Ana retiró su solicitud por Tobi **cuando** Carla mira los números **entonces** la
  solicitud de Ana sigue contando entre las que llegaron.

### Errores y rechazos
- **Dado** que los números no se pueden traer **cuando** Carla abre la página de Tobi **entonces**
  ve que no se pudieron cargar y «Probar de nuevo», y puede editar, pausar o compartir a Tobi como
  siempre.
- **Dado** que Diego no publicó a Tobi **cuando** abre la ficha pública de Tobi o el perfil de Carla
  **entonces** no ve ninguno de estos números.
- **Dado** que la cuenta no se pudo sumar en un toque de «Quiero adoptar» **cuando** Bruno lo toca
  **entonces** Bruno sigue al cuestionario o a verificarse como hoy y no ve ningún aviso.

## Pantallas
- **La página de un animal en «Mis animales»:** un bloque «Cómo le va a Tobi» con lo contado
  en el orden en que pasa la gente (abrieron la ficha, tocaron «Quiero adoptar», se frenaron en la
  verificación partido en teléfono e identidad, solicitudes) y debajo la línea del nivel que pide.
  Si la publicación pide solo el teléfono, el freno por identidad no aparece. Vacío: «Todavía nadie
  abrió la ficha de Tobi» con la acción de copiar el texto para el grupo que ya existe (#248).
  Cargando: el bloque con su forma y sin números. Error: el aviso y «Probar de nuevo». En el
  teléfono va debajo de las acciones del animal; en pantalla ancha, al costado de la ficha, sin dejar
  un costado vacío ni una mitad de hoja en blanco (docs/11, 2026-09-20).
- **La página de una camada:** el mismo bloque con el nombre de la camada, sumando todas sus crías.
  Vacío, cargando y error iguales.

## Datos personales
- No se guarda nada de ninguna persona: por cada publicación, solo cuántas aperturas, cuántos toques
  y cuántos frenos de cada motivo hubo, y el día en que se empezó a contar. Ni quién, ni cuándo, ni
  desde dónde. Las solicitudes ya están guardadas y solo se cuentan.
- Los números los ve solo quien publicó; se borran con la publicación o con la cuenta (Ley 18.331).

## Medición
Sin momentos nuevos. Se suma a docs/03 §Métricas de éxito, «Cómo se leen», una lectura nueva:
**¿quien rescata mantiene la verificación cuando ve lo que le cuesta?**
- Qué parte de las publicaciones pide la identidad, antes y después del día en que llega esta
  historia, con los momentos de publicar y de editar, que ya llevan el nivel exigido (#236).
- Cuántas ediciones bajan el nivel de 2 a 1 y cuántas lo suben, antes y después de ese día.
- Si los rescatistas publican su segundo animal más que antes (lectura 1), al lado de las opiniones
  de «Opinar» que nombren la ficha o los números.
- Con 3 a 5 rescatistas los números son chicos: se leen como señal al lado de las opiniones y las
  encuestas, no como prueba.

## Dependencias
- #53 publicar · #57 la ficha · #59 nivel exigido y edición · #63 «Quiero adoptar» y sus frenos ·
  #205 y #206 camadas · #240 cómo se cuenta cada toque y cada freno · #248 copiar el texto para el
  grupo · docs/03 §Hipótesis, §2 y §Métricas de éxito · docs/01 §Huevo y gallina.

## Decisiones del enjambre
- **Decisión (2026-11-01, product-owner):** se suma mostrarle a quien rescata cuántas veces se abrió
  cada ficha, cuántos quisieron adoptar y a cuántos frenó la verificación, como feature nueva
  propuesta por Producto al terminarse el mapa. Motivo: es lo que más enseña de la hipótesis por el
  trabajo que pide; deja ver si quien rescata sigue pidiendo la identidad cuando sabe lo que le
  cuesta, y le da la respuesta que en el grupo le dan los comentarios. (docs/03 §2)
- **Decisión (2026-11-01, product-owner):** se cuentan veces y no personas, y no se guarda quién
  abrió, tocó o se frenó. Motivo: contar personas obliga a reconocer a cada visitante; entre dos
  opciones razonables va la que guarda menos (Ley 18.331). (docs/03 §2)
- **Decisión (2026-11-01, product-owner):** los números los ve solo quien publicó, nunca la ficha
  pública ni quien administra. Motivo: un contador público es el «me gusta» que docs/03 ya había
  llamado ruido, y el equipo lee lo mismo en la medición sin saber de qué animal es. (docs/03 §2)
- **Decisión (2026-11-01, product-owner):** solo se muestran los frenos de verificación, y al lado
  del nivel que pide la publicación no hay sugerencia de cambiarlo. Motivo: la hipótesis pregunta por
  la verificación; un consejo de bajar el nivel contestaría la pregunta por quien rescata y la
  lectura nueva no diría nada. (docs/03 §2 y §Métricas de éxito)
- **Decisión (2026-11-01, product-owner):** no suman las aperturas de quien publicó, las vistas
  previas de las aplicaciones al pegar el enlace ni los buscadores, y sí las de una ficha pausada,
  vencida o adoptada. Motivo: las primeras inflan el número sin que nadie haya mirado al animal; las
  otras son gente real que llegó por un posteo viejo. (docs/03 §2)
- **Decisión (2026-11-01, product-owner):** no se agrega un momento a la medición; la lectura nueva
  compara el nivel exigido antes y después del día en que llega la historia. Motivo: los momentos
  de publicar y de editar ya llevan el nivel exigido (#236), y un momento por mirar los números agregaría datos sin
  agregar una pregunta, como se decidió en #238 y #244. (docs/03 §Métricas de éxito)


---
_Generated by [Claude Code](https://claude.ai/code)_
