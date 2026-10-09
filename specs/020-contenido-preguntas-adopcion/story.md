## Historia
**Como** persona que está pensando en adoptar o en dar en adopción **quiero** encontrar respondida
la pregunta que me frena **para** animarme a dar el paso en vez de abandonarlo a medias.

## Contexto
La desconfianza es el problema que este producto resuelve: estafas del tipo "pagá el flete y te lo
mando", gente que adopta para revender, rescatistas haciendo entrevistas por WhatsApp una por una
(docs/01 §Situación actual). Esa desconfianza se expresa como preguntas concretas — "¿cómo sé que
esta persona es real?", "¿qué le pido antes de entregarle el animal?", "¿el chip es obligatorio?" —
y hoy la gente las busca afuera y encuentra respuestas sueltas o interesadas.

Ayuda a responder la pregunta del MVP (docs/03 §Hipótesis) por el lado de la fricción: quien entiende
qué se hace con su cédula y para qué sirve la verificación tiene más motivos para completarla cuando
un rescatista se la exige (docs/03 §Métricas de éxito, el % que completa el nivel 2). Y le da al
rescatista algo que hoy escribe a mano en cada chat: un enlace que puede mandar por WhatsApp con lo
que le va a pedir a quien adopte. Es lo único que acumula reputación con el tiempo y lo que citan los
buscadores y los asistentes (docs/08 §Encontrable). Va en la beta cerrada porque recién ahora existe
todo lo que las páginas explican: los niveles y su chapita (#11, #12), publicar y ver animales
(#53, #57), el compromiso de adopción y el seguimiento a los 30 días (#67, #69).

Ya existen dos explicaciones cortas que esta historia no reemplaza: "Qué dice cada nivel", la página
que abre cada chapita (#12), y "Qué hacemos con ellas", el aviso dentro del pedido de verificación de
identidad (#11). Estas páginas son la versión larga, la que se lee antes de que nadie la pida y la
que se comparte.

## Alcance
- Incluye: cinco páginas estables, cada una con una pregunta por título y la respuesta en el primer
  párrafo — cómo se verifica a las personas y qué se muestra de ellas; qué pedir y qué mirar antes
  de entregar un animal; cómo reconocer una estafa antes de adoptar; qué exige Uruguay (chip,
  RENAC, castración); qué es el compromiso de adopción y qué pasa a los 30 días. Un índice que las
  agrupa por a quién le sirven, el enlace al índice desde el pie del sitio, el enlace a "cómo se
  verifica" desde el pedido de verificación de identidad y desde "Qué dice cada nivel", y en cada
  página la fecha de última actualización, las páginas relacionadas y la acción que corresponde.
- No incluye (explícito): blog con fechas, autores, categorías ni comentarios · escribir o editar
  el contenido desde el sitio · contenido en otro idioma · videos, descargables ni newsletter ·
  una lista de veinte preguntas frecuentes en una sola página · contenido generado por quienes usan
  el producto · cambiar lo que dicen "Qué dice cada nivel" o el aviso "Qué hacemos con ellas" ·
  asesoramiento legal o veterinario más allá de citar la norma · prender la indexación en
  buscadores (es la historia que abre la beta, #76, y la decide Hernán; hasta entonces estas
  páginas quedan fuera de los buscadores como todo el sitio).

## Reglas de negocio
- Cada página responde su pregunta en el primer párrafo, de hasta 3 oraciones. El detalle va
  después, nunca antes.
- Lo que una página afirma sobre el sitio es lo que el sitio efectivamente hace hoy: los niveles de
  verificación, qué se muestra de una persona, qué pasa con la cédula, el compromiso de adopción y el
  seguimiento a los 30 días. Si eso cambia, la página cambia con él.
- "Cómo se verifica" describe cada nivel con las mismas palabras que "Qué dice cada nivel", y las dos
  se enlazan entre sí.
- La página del compromiso dice que el compromiso no es un contrato legal.
- Todo dato sobre la ley uruguaya (chip, RENAC, castración) enlaza a su fuente oficial: el texto de
  la norma o el sitio del organismo, nunca una nota de prensa ni otro sitio que la resuma. Un
  requisito que no se puede respaldar con una fuente oficial no se afirma.
- Cada página muestra cuándo se actualizó por última vez.
- Cada página propone una sola acción: "cómo se verifica" → verificar mi identidad; "qué pedir antes
  de entregar" y "qué exige Uruguay" → publicar un animal; "cómo reconocer una estafa" y "el
  compromiso y los 30 días" → ver animales en adopción.
- El índice agrupa en este orden: quien da en adopción, quien adopta, todos.
- El contenido es público: se lee entero sin ingresar ni registrarse.
- El enlace de una página compartido por WhatsApp muestra su tarjeta con el título y la pregunta,
  aunque la página siga fuera de los buscadores, igual que la ficha de un animal (#57).
- En el pedido de verificación de identidad, el enlace a "cómo se verifica" está junto a "Qué hacemos
  con ellas", antes de elegir las fotos.
- Ninguna página usa datos de una persona real ni de un animal publicado. Si un ejemplo necesita un
  nombre, es inventado y la página lo aclara.

## Criterios de aceptación
### Camino feliz
- **Dado** que abro el enlace a "Cómo reconocer una estafa antes de adoptar" **cuando** carga
  **entonces** el primer párrafo, de hasta 3 oraciones, responde la pregunta del título, y al final
  de la página veo cómo ir a ver animales en adopción.
- **Dado** que estoy en el índice de contenido **cuando** elijo una de las preguntas **entonces**
  llego a la página que la responde, y el índice muestra primero las de quien da en adopción, después
  las de quien adopta y al final las de todos.
- **Dado** que estoy leyendo cualquiera de las cinco páginas **cuando** llego al final **entonces**
  veo la fecha de última actualización, las páginas relacionadas y una sola acción propuesta, la que
  corresponde a esa página según las reglas.
- **Dado** que estoy en cualquier pantalla del sitio **cuando** miro el pie **entonces** encuentro
  el enlace al índice de contenido.
- **Dado** que un rescatista me exige el nivel 2 y estoy en el pedido de verificación de identidad,
  antes de elegir las fotos, **cuando** toco "cómo se verifica y qué se hace con tu cédula"
  **entonces** leo la página y al volver sigo en el mismo paso del pedido.
- **Dado** que abro "Qué dice cada nivel" desde una chapita **cuando** busco más detalle **entonces**
  encuentro el enlace a "cómo se verifica", y lo que esta dice de cada nivel coincide palabra por
  palabra con lo que acabo de leer.

### Casos borde (al menos 3)
- **Dado** que entro sin haber ingresado **cuando** leo una página de contenido **entonces** la veo
  completa y nada me pide registrarme para seguir leyendo.
- **Dado** que abro un enlace a una página de contenido que no existe o se retiró **cuando** carga
  **entonces** veo que esa página no está y el índice para encontrar lo que buscaba.
- **Dado** que comparto el enlace de una página por WhatsApp **cuando** le llega a la otra persona
  **entonces** ve el título y la pregunta que responde, no la dirección pelada.
- **Dado** que una página cita un requisito legal uruguayo **cuando** la leo **entonces** veo la
  fuente oficial y puedo abrirla.
- **Dado** que ya tengo la identidad verificada **cuando** toco "verificar mi identidad" al final de
  "cómo se verifica" **entonces** veo que mi identidad ya está verificada y desde cuándo, sin empezar
  un pedido nuevo.
- **Dado** que leo desde el teléfono con una conexión lenta **cuando** abro cualquiera de las
  páginas **entonces** puedo leer la respuesta aunque las imágenes todavía no hayan cargado.

### Errores y rechazos
- **Dado** que todavía no hay ninguna página publicada **cuando** entro al índice **entonces** veo
  que el contenido está en camino y una forma de ir a ver animales, no una lista vacía.
- **Dado** que una página ofrece una acción que exige haber ingresado (verificar mi identidad,
  publicar un animal) **cuando** la toco sin haber ingresado **entonces** se me pide ingresar y
  después sigo en esa acción.
- **Dado** que mi cuenta está suspendida y tengo la sesión abierta **cuando** abro una página de
  contenido o el índice **entonces** veo la pantalla de cuenta suspendida, como en la portada, el
  listado o la ficha de un animal.
- **Dado** que el contenido no se puede mostrar **cuando** entro **entonces** veo que algo falló y
  cómo volver al índice, sin quedarme en una pantalla en blanco.

## Pantallas
- **Índice de contenido**: las preguntas agrupadas por a quién le sirven (quien da en adopción,
  quien adopta, todos). Vacío: "Estamos escribiendo esto" y un enlace a ver animales en adopción.
- **Página de contenido**: la pregunta como título, la respuesta, el detalle, la fecha de última
  actualización, las relacionadas y una acción. Vacío: no aplica, siempre tiene texto.
- **Pie del sitio**: se le agrega el enlace al índice, junto a Opinar y el WhatsApp de soporte.
  Vacío: no aplica.
- **Pedido de verificación de identidad**: se le agrega el enlace a "cómo se verifica" junto a "Qué
  hacemos con ellas". Vacío: no aplica.
- **Qué dice cada nivel**: se le agrega el enlace a "cómo se verifica". Vacío: no aplica.

## Datos personales
- No aplica. El contenido no guarda ni muestra datos de ninguna persona; los ejemplos son
  inventados y la página lo dice. La medición es la de todo el sitio: por visita, sin unirse nunca a
  la cuenta.

## Medición
- Se registra la apertura de cada página de contenido, de dónde llegó la persona (el índice, el pie,
  "Qué dice cada nivel", el pedido de verificación o un enlace de afuera) y el uso de la acción que
  propone, para saber qué pregunta trae gente y cuál termina en algo.
- De las visitas que abrieron "cómo se verifica" desde el pedido de verificación de identidad,
  cuántas aceptan y envían el pedido en esa misma visita, frente a las que no la abrieron.

## Dependencias
- Todas cerradas: #9 (ingreso y perfil), #11 (verificación de identidad: el pedido que enlaza la
  página), #12 (aval, perfil público y "Qué dice cada nivel": los niveles que la página explica),
  #53 y #57 (publicar y ver animales: las acciones que las páginas proponen y la tarjeta al
  compartir), #67 y #69 (compromiso de adopción y seguimiento a 30 días: lo que explica la quinta
  página), #71 (el pie del sitio).
- docs/01 §Situación actual · docs/03 §1, §5 y §7 · docs/08 §Encontrable · docs/06 §Glosario

## Decisiones del enjambre
- **Decisión (2026-09-27, product-owner):** el primer párrafo de cada página tiene hasta 3
  oraciones y responde la pregunta del título por sí solo. Motivo: "la respuesta en el primer
  párrafo" no se puede comprobar sin un tope, y quien llega desde un enlace de WhatsApp lee en el
  teléfono y decide en ese párrafo si sigue. Va en docs/08 §Encontrable.
- **Decisión (2026-09-27, product-owner):** cada página propone una sola acción fija: verificar mi
  identidad en "cómo se verifica"; publicar un animal en "qué pedir antes de entregar" y "qué exige
  Uruguay"; ver animales en adopción en "cómo reconocer una estafa" y "el compromiso y los 30 días".
  Motivo: la acción es lo que la medición cuenta; si cambia según la página o la persona, no se
  puede saber qué pregunta termina en algo. Va en docs/08 §Encontrable.
- **Decisión (2026-09-27, product-owner):** el índice pone primero lo que le sirve a quien da en
  adopción. Motivo: el producto es para rescatistas primero (docs/01 §Huevo y gallina), y la
  primera métrica de éxito es que publiquen por su cuenta. Va en docs/08 §Encontrable.
- **Decisión (2026-09-27, product-owner):** "cómo se verifica" se enlaza desde el pedido de
  verificación de identidad, y se mide qué pasa con quienes la abren desde ahí. Motivo: el miedo a
  entregar la cédula es la fricción que la hipótesis pregunta si la gente acepta, y ese es el
  momento en que la pregunta aparece (docs/01 §Verificación = fricción, docs/03 §Métricas de
  éxito). Lo que se mide lo corrige la decisión del 2026-10-09 de abajo. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** los datos legales enlazan solo a la fuente oficial (el
  texto de la norma o el sitio del organismo). Motivo: una página que promete desconfiar de
  respuestas sueltas no puede apoyarse en una; y los asistentes citan lo que se puede verificar
  (docs/08 §Encontrable, GEO). Va en docs/08 §Encontrable.
- **Decisión (2026-10-09, product-owner):** lo que se mide de quienes abren "cómo se verifica" desde
  el pedido es si aceptan y envían el pedido en esa misma visita, comparado con quienes no la abren;
  no si completan el nivel 2. Reemplaza esa parte de la decisión del 2026-09-27. Motivo: la medición
  del sitio es por visita y nunca se une a la cuenta (docs/03 §7, como la de #9 y #71), y la
  aprobación llega días después, cuando quien la revisa resuelve, fuera de la visita; unir las dos
  pediría guardar con la persona algo que hoy no se guarda (Ley 18.331: lo que guarda menos). Va en
  docs/03 §7.
- **Decisión (2026-10-09, product-owner):** "cómo se verifica" no reemplaza a "Qué dice cada nivel"
  (#12) ni al aviso "Qué hacemos con ellas" del pedido (#11): describe cada nivel con las mismas
  palabras que "Qué dice cada nivel" y las dos páginas se enlazan; el enlace desde el pedido va junto
  a ese aviso, antes de elegir las fotos. Motivo: dos textos que explican lo mismo con palabras
  distintas terminan contradiciéndose, y una página sobre confianza que contradice la chapita la
  pierde; y antes de elegir las fotos todavía no hay nada que se pueda perder al ir y volver.
  Va en docs/08 §Encontrable.
- **Decisión (2026-10-09, product-owner):** el enlace de una página de contenido compartido por
  WhatsApp arma su tarjeta aunque la página siga fuera de los buscadores, con la misma excepción que
  ya tiene la ficha de un animal (docs/08 §Encontrable, decisión 2026-09-28, #57). Motivo: el uso
  principal de estas páginas antes de la beta abierta es que un rescatista se las mande a quien le
  pide un animal, y un enlace pelado en un chat no se abre. Va en docs/08 §Encontrable.
- **Decisión (2026-10-09, product-owner):** la página del compromiso dice que no es un contrato
  legal, y un requisito legal que no se puede respaldar con una fuente oficial no se afirma.
  Motivo: el glosario ya lo define así (docs/06 §Glosario, "compromiso de adopción"), y una página
  que promete más de lo que el sitio o la ley sostienen es la respuesta interesada que esta historia
  viene a reemplazar. Va en docs/08 §Encontrable.


---
_Generated by [Claude Code](https://claude.ai/code)_
