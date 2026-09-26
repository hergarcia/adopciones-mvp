## Historia
**Como** persona que quiere dar más confianza **quiero** verificar mi identidad con mi cédula
**para** alcanzar el nivel 2 y que quien publica un animal me tome en serio.

## Contexto
El nivel 2 es lo que separa una cuenta real de una cuenta descartable con un teléfono prepago. Es
lo que le permite a quien publica exigir un piso de verificación a quien solicita (docs/03 §2), y
es la fricción que la hipótesis del MVP pone a prueba: qué parte de los adoptantes completa el
nivel 2 cuando se lo exigen (docs/03 §Métricas de éxito; menos de 30 % quiere decir fricción mal
calibrada). Por eso tiene que costar poco y dejar medido dónde abandona la gente.

Guardar documentos de identidad es un riesgo legal serio: la Ley 18.331 obliga a pedir
consentimiento explícito y a no quedarse con lo que no hace falta. Por eso la revisión es a mano
las primeras semanas, las imágenes se borran después de mirarlas y de la cédula no queda nada:
de un pedido aprobado queda "verificado el día X" (docs/01 §Legal / datos). De un rechazo quedan
el día y el motivo durante 30 días, para que el tope de intentos funcione, y queda registrado quién
resolvió cada pedido; esa retención la decidió Hernán en #37.

## Alcance
- Incluye: pedir la verificación subiendo una foto del frente de la cédula y una selfie
  sosteniéndola, con un consentimiento explícito antes de subir nada · ver en qué estado está mi
  pedido · retirar mi pedido mientras está en revisión · la cola donde quien administra revisa los
  pedidos uno por uno y los aprueba o rechaza con un motivo · el aviso por correo del resultado ·
  el borrado de las imágenes apenas se resuelve, se retira o vence el pedido · el nivel 2 visible
  en mi perfil · volver a intentarlo después de un rechazo.
- No incluye (explícito): un proveedor externo de verificación · lectura automática del documento ·
  comparación automática entre la selfie y el documento · documentos que no sean la cédula
  uruguaya (pasaporte, documentos de otros países) · comparar el nombre para mostrar con el de la
  cédula · detectar que la misma cédula ya verificó otra cuenta, porque para eso habría que guardar
  el número · volver a verificar cada cierto tiempo · el distintivo en el perfil público, que es de
  #12 · el aval entre personas, que es el nivel 3 · exigir nivel 2 para solicitar, que es de la
  historia de la publicación · designar a quien administra desde el sitio · el panel de
  administración consolidado.

## Reglas de negocio
- Antes de subir nada, la persona lee qué se va a hacer con las imágenes (quién las ve, cuándo se
  borran, qué queda guardado) y acepta explícitamente. Sin ese consentimiento no se sube nada.
- Se piden dos fotos: el frente de la cédula uruguaya y una selfie con la cédula en la mano, al
  lado de la cara. Cada una puede sacarse en el momento o elegirse de las fotos del teléfono, en
  los formatos comunes de foto y hasta 10 MB.
- Quien administra aprueba solamente si la cédula se lee, está vigente y la cara de la selfie es la
  de la cédula. Si no, rechaza con un motivo de esta lista: no se lee, no coincide, cédula vencida,
  sospecha de fraude. La persona ve el motivo.
- El nivel 2 dice que detrás de la cuenta hay una persona real con cédula uruguaya vigente. No
  certifica el nombre para mostrar, que se puede seguir cambiando.
- Las imágenes se borran apenas el pedido se aprueba, se rechaza, se retira o vence. De un pedido
  aprobado queda únicamente que la persona quedó verificada y el día; de uno rechazado, el día y el
  motivo durante 30 días, lo que dura el tope, y después se borran. Nunca se guardan el número ni ningún otro dato de la cédula.
- Un pedido sin resolver a los 7 días vence: las imágenes se borran y la persona recibe un correo
  que la invita a pedirlo de nuevo. Un pedido vencido o retirado no cuenta como intento.
- La pantalla de espera dice que la revisión suele tardar hasta 2 días.
- Una cuenta puede tener un solo pedido abierto, y como máximo 3 pedidos rechazados en 30 días. Es
  el camino obvio para probar documentos ajenos.
- Solo quien administra ve las imágenes, y solo mientras el pedido está abierto. Nadie resuelve su
  propio pedido. Quién administra lo designa el equipo, fuera del sitio.
- El nivel 2 incluye el nivel 1: sin teléfono verificado no se puede pedir. Si la persona cambia de
  teléfono, baja a sin verificar como dice #10, y al confirmar el nuevo vuelve a nivel 2 sin subir
  la cédula otra vez.
- Nadie ve el documento de otra persona jamás, ni siquiera quien vaya a entregarle un animal. Lo
  que se ve es el distintivo y la fecha.

## Criterios de aceptación
### Camino feliz
- **Dado** que tengo el teléfono verificado **cuando** abro mi perfil **entonces** veo que estoy en
  nivel 1 y se me ofrece pasar a nivel 2, con una línea sobre para qué sirve.
- **Dado** que pido la verificación de identidad **cuando** llego a la pantalla **entonces** leo qué
  se hace con mis imágenes y no puedo subir nada hasta aceptarlo.
- **Dado** que acepté **cuando** subo el frente de la cédula y la selfie sosteniéndola **entonces**
  veo que mi pedido quedó en revisión y que suele tardar hasta 2 días.
- **Dado** que administro el sitio **cuando** abro la cola de pedidos **entonces** veo los que
  están esperando, del más viejo al más nuevo, cada uno con el nombre, la zona, desde cuándo tiene
  cuenta, sus rechazos de los últimos 30 días con el motivo y las dos imágenes, y puedo aprobar o rechazar
  eligiendo un motivo.
- **Dado** que mi pedido fue aprobado **cuando** me llega el correo y entro **entonces** veo que
  estoy en nivel 2 y desde qué día, y que mis imágenes ya se borraron.

### Casos borde (al menos 3)
- **Dado** que ya tengo un pedido en revisión **cuando** intento pedir otro **entonces** se me dice
  que ya hay uno abierto y se me muestra en qué estado está.
- **Dado** que tengo un pedido en revisión **cuando** lo retiro **entonces** las imágenes se borran
  en ese momento, el pedido desaparece de la cola y puedo pedirlo de nuevo sin que cuente como
  intento.
- **Dado** que mi pedido fue rechazado **cuando** lo miro o me llega el correo **entonces** veo el
  motivo y qué hacer para que la próxima salga bien, y puedo intentarlo de nuevo.
- **Dado** que tuve 3 pedidos rechazados en los últimos 30 días **cuando** quiero pedirlo otra vez
  **entonces** se me dice la fecha desde la que voy a poder y a qué correo escribir para pedir
  ayuda.
- **Dado** que un pedido lleva 7 días sin resolver **cuando** se cumple el plazo **entonces** las
  imágenes se borran solas, el pedido sale de la cola y a la persona le llega un correo para que lo
  pida de nuevo.
- **Dado** que dos personas administran **cuando** una resuelve un pedido que la otra tiene abierto
  **entonces** la segunda ve que ya fue resuelto y no puede resolverlo de nuevo.
- **Dado** que administro el sitio y estoy mirando un pedido **cuando** la persona lo retira antes de
  que lo resuelva **entonces** veo que el pedido ya no está, sus imágenes no se muestran más y no
  puedo aprobarlo ni rechazarlo.
- **Dado** que borro mi cuenta con un pedido abierto **cuando** la borro **entonces** el pedido y
  sus imágenes desaparecen con ella.
- **Dado** que estoy en nivel 2 y cambio de teléfono **cuando** confirmo el número nuevo
  **entonces** vuelvo a nivel 2 sin subir la cédula otra vez.

### Errores y rechazos
- **Dado** que subo algo que no es una foto o pesa más de 10 MB **cuando** lo intento **entonces**
  se me dice qué se acepta y no se sube nada.
- **Dado** que no tengo el teléfono verificado **cuando** intento pedir la verificación de identidad
  **entonces** se me explica que primero va el teléfono y se me ofrece hacerlo.
- **Dado** que la subida se corta a la mitad **cuando** vuelvo **entonces** el pedido no quedó a
  medias: o está completo con las dos imágenes o no existe, y puedo empezarlo de nuevo.
- **Dado** que no administro el sitio **cuando** intento abrir la cola de pedidos o una imagen de
  otra persona **entonces** no puedo verla ni sé qué hay adentro.
- **Dado** que administro el sitio y tengo un pedido propio **cuando** abro la cola **entonces** no
  puedo resolverlo: lo tiene que resolver otra persona que administre.

## Pantallas
- **Pedir verificación de identidad**: qué se pide, qué se hace con las imágenes, el consentimiento
  y la subida de las dos fotos, con un ejemplo de cómo sacar la selfie. Vacío: no aplica.
- **Estado de mi pedido**: en revisión (con la demora esperada y la opción de retirarlo), aprobado,
  rechazado con su motivo, vencido, o sin intentos hasta una fecha, y qué puedo hacer en cada caso.
  Vacío: si nunca pedí, explica para qué sirve el nivel 2 y ofrece empezar.
- **Cola de revisión**: solo para quien administra; los pedidos esperando, con los datos del perfil
  de la persona, sus rechazos de los últimos 30 días y sus imágenes mientras el pedido esté abierto. Vacío:
  "No hay pedidos esperando".
- **Mi perfil**: pasa a mostrar el nivel alcanzado y desde cuándo, o la oferta de pasar a nivel 2.
  Vacío: no aplica.
- **Correos**: el resultado (aprobado, rechazado con su motivo) y el vencimiento. Nunca llevan las
  imágenes ni datos de la cédula. Vacío: no aplica.

## Datos personales
- Se suben una foto del frente de la cédula y una selfie sosteniéndola, con consentimiento
  explícito. Las ve solamente quien administra, solamente mientras el pedido está abierto, y se
  borran al aprobar, rechazar, retirar o vencer el pedido. Queda guardado únicamente que la persona
  está verificada y el día, y de cada rechazo el día y el motivo durante 30 días. Nunca se guarda el número ni otro
  dato de la cédula. Queda registrado quién administró cada resolución, y solo lo ve quien
  administra. Borrar la cuenta borra el pedido, las imágenes, los rechazos y ese registro.

## Medición
- Oferta de nivel 2 vista, pedidos empezados, consentimientos aceptados, pedidos enviados,
  retirados, vencidos, aprobados y rechazados por motivo, cuánto tardó cada revisión, y topes de
  intentos alcanzados. Cada pedido registra desde dónde llegó la persona (su perfil, o más adelante
  una publicación que exige nivel 2), para que cuando exista esa exigencia se pueda medir qué parte
  completa el nivel 2 (docs/03 §Métricas de éxito). Ningún evento lleva datos de la persona ni de
  su cédula.

## Dependencias
- #9 Registro e ingreso · #10 Verificación de teléfono.
- #37 Decisión de Hernán sobre qué se guarda de cada pedido (cerrada).
- docs/03 §1 y §6 · docs/01 §Legal / datos · docs/06 §Glosario

## Decisiones del enjambre
- **Decisión (2026-09-25, product-owner):** se pide solo el frente de la cédula y una selfie con la
  cédula en la mano. Motivo: el frente alcanza para ver que es vigente y de quién es la cara, pedir
  el dorso es juntar datos que no hacen falta (Ley 18.331), y sostenerla en la selfie es lo que un
  revisor a mano tiene para distinguir a quien tiene la cédula de quien encontró una foto de ella.
  Va a docs/03 §1.
- **Decisión (2026-09-25, product-owner):** el nivel 2 certifica que hay una persona real con cédula
  uruguaya vigente, no el nombre para mostrar, que sigue siendo libre. Motivo: muchos rescatistas
  se muestran con el nombre de su grupo o refugio, y guardar el nombre legal para compararlo sería
  guardar un dato de la cédula que docs/01 §Legal / datos dice que no se guarda. Va a docs/03 §1.
- **Decisión (2026-09-25, product-owner):** números: fotos de hasta 10 MB, la espera anunciada es de
  hasta 2 días, el pedido vence a los 7 días sin resolver, y el tope es de 3 pedidos rechazados en
  30 días; retirar o vencer no cuenta. Motivo: la revisión es a mano y part-time, una semana sin
  respuesta ya es un pedido que la persona abandonó, y el tope tiene que frenar a quien prueba
  cédulas ajenas sin castigar a quien sacó una foto borrosa. Va a docs/03 §1.
- **Decisión (2026-09-25, product-owner):** la persona puede retirar su pedido en revisión y sus
  imágenes se borran en ese momento. Motivo: el consentimiento que se da se puede retirar (Ley
  18.331), y no tener que esperar a que venza baja el miedo a subir la cédula. Va a docs/01
  §Legal / datos.
- **Decisión (2026-09-25, product-owner):** el resultado y el vencimiento se avisan por correo,
  sin imágenes ni datos de la cédula. Motivo: la persona no va a volver sola al sitio a mirar si ya
  la aprobaron, y sin aviso el nivel 2 se abandona en la espera; las notificaciones push están
  fuera del MVP y el correo es el canal que ya existe. Va a docs/03 §1.
- **Decisión (2026-09-25, product-owner):** de un rechazo quedan el día y el motivo durante 30 días, lo
  que dura el tope, y quien administra los ve al revisar. Motivo: sin eso no hay tope de intentos
  ni forma de ver a alguien que prueba cédulas distintas; no guarda nada de la cédula y no dura más
  que lo que el tope necesita, que es lo más cerca de «guardar solo verificado el día X» (docs/01
  §Legal / datos). Va a docs/03 §1; la regla de retención, a docs/01 §Legal / datos (ver la
  decisión de Hernán abajo).
- **Decisión (2026-09-25, product-owner):** cambiar de teléfono baja la cuenta como dice #10, pero
  al confirmar el nuevo vuelve a nivel 2 sin subir la cédula otra vez. Motivo: la identidad no
  cambió con el número, y volver a pedir la cédula por un cambio de chip es fricción que no compra
  confianza. Va a docs/03 §1.
- **Decisión (2026-09-25, product-owner):** quién administra lo designa el equipo por fuera del
  sitio, y nadie resuelve su propio pedido. Motivo: es la primera pantalla de administración y el
  nivel 2 no vale nada si quien lo da puede dárselo a sí mismo. Va a docs/03 §6.
- **Decisión (2026-09-25, Hernán, #37):** se acepta la retención tal como está: de cada rechazo
  quedan el día y el motivo durante 30 días, y quien administra los ve al revisar el pedido
  siguiente; queda registrado quién resolvió cada pedido hasta que se borra la cuenta; ningún dato
  de la cédula se guarda. Motivo: sin los rechazos no hay tope de intentos ni forma de ver a quien
  prueba cédulas ajenas. Va a docs/01 §Legal / datos.
- **Decisión (2026-09-26, product-owner):** si la persona retira su pedido mientras alguien que
  administra lo está mirando, el pedido deja de poder resolverse y sus imágenes dejan de mostrarse
  en ese momento. Motivo: retirar el consentimiento tiene que valer ya, no cuando el revisor
  termine (Ley 18.331). Va a docs/01 §Legal / datos.

