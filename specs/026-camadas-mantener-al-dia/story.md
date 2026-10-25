## Historia
**Como** rescatista que publicó una camada **quiero** manejar el estado de cada cría y de la camada entera, y responder, entregar y seguir cada cría por separado **para** no repetir con cada cría lo que hago con un animal solo ni confundir qué pedido es de cuál.

## Contexto
Es la segunda mitad de las camadas que pidió Hernán el 2026-10-20. La historia #205 publica la camada y deja pedir una cría; esta le da su vida: que venza y se renueve, que cada cría pase a en proceso o adoptada, que las solicitudes lleguen ordenadas por cría y que cada entrega tenga su compromiso y su seguimiento. Sin esto, una camada publicada queda disponible para siempre y quien la publicó no distingue los pedidos de una cría de los de otra. Un rescatista con 8 crías y 10 interesados por cría no puede recibir 80 solicitudes en una fila ni 8 correos de «¿sigue disponible?» el mismo día (docs/01 §Situación actual: el trabajo que el sitio promete ahorrar).

## Alcance
- Incluye: el estado de **cada cría** (disponible, en proceso, adoptada) y el de **la camada** (pausada, vencida, adoptada) con las reglas de #59 · un solo correo «¿sigue disponible?» por camada, y «Sigue disponible» renueva la camada entera · la bandeja de solicitudes recibidas agrupada por camada y, adentro, por cría · aceptar, rechazar, marcar a quién se entregó cada cría, el compromiso de adopción y el seguimiento a los 30 días, por cría, con las mismas reglas que #65, #67 y #69 para un animal solo · pedir más de una cría de la misma camada · «Mis solicitudes» con la camada de cada cría pedida · los sellos de cada cría en la ficha de la camada.
- No incluye (explícito): pedir la camada entera de una vez · pasar la solicitud de una cría a otra · estados distintos de los de #59 · un correo de renovación por cría · cambiar las reglas de visibilidad del contacto · recordatorios o seguimiento de la madre · reportes por camada.

## Reglas de negocio
- Cada cría tiene su estado: disponible, en proceso o adoptada. La camada tiene el suyo: disponible mientras alguna cría lo esté, pausada o vencida entera, y adoptada cuando lo están todas.
- Marcar en proceso, marcar disponible y marcar adoptada son de una cría. Pausar, reanudar, renovar, volver a publicar y borrar son de la camada entera. Quitar una cría es borrarla.
- Reanudar, renovar y volver a publicar exigen el teléfono verificado; las demás acciones no (#59).
- La camada vence a los 30 días de publicada o renovada, con un solo correo 7 días antes. «Sigue disponible» la renueva entera sin ingresar. Pausar congela el vencimiento (#59).
- Pausar la camada pausa a todas sus crías. Al reanudar, cada cría vuelve al estado que tenía.
- En el listado, una camada con crías en proceso sigue con su sello, como un animal en proceso. Sale cuando está pausada o vencida, o cuando todas sus crías están adoptadas. Su ficha queda con el sello de adoptada y se puede volver a publicar (#59).
- Una persona puede pedir más de una cría de la misma camada, y cada pedido cuenta como una solicitud activa para el límite de 3 (#63). Motivo: adoptar a dos hermanos es un caso común, y el límite ya protege a quien publica.
- Marcar adoptada a una cría cierra solo las solicitudes de esa cría, como con un animal solo (#67). Las de las otras crías no se tocan.
- Al aceptar una solicitud se dan los contactos de las dos personas, y solo ahí. Quien fue aceptada para una cría no ve a quienes pidieron las otras (#65).
- El compromiso de adopción y el seguimiento a los 30 días son de cada cría y de quien la adoptó. Los avisos y los correos dicen el nombre de la cría y el de la camada («Cría 3 de la camada de Luna»).

## Criterios de aceptación
### Camino feliz
- **Dado** que tengo una camada de 4 crías con solicitudes **cuando** abro «Solicitudes recibidas» **entonces** veo la camada y, adentro, cada cría con las personas que la pidieron, no una sola fila con todo mezclado.
- **Dado** que acepto la solicitud de una persona para «Cría 2» **cuando** confirmo **entonces** ve mi contacto y yo el suyo, y las solicitudes de las otras crías siguen como estaban.
- **Dado** que entregué «Cría 2» **cuando** la marco adoptada a esa persona **entonces** «Cría 2» queda adoptada, la camada pasa a decir «3 disponibles» y a los 30 días le pido el seguimiento a quien la adoptó.
- **Dado** que quedan 7 días para que venza la camada **cuando** llega el correo **entonces** es un solo correo por la camada, y «Sigue disponible» la renueva entera por 30 días.
- **Dado** que pedí dos crías de la misma camada **cuando** miro «Mis solicitudes» **entonces** veo las dos, cada una con el nombre de su camada.

### Casos borde (al menos 3)
- **Dado** que marco adoptada a la última cría disponible **cuando** confirmo **entonces** la camada queda adoptada, sale del listado y su ficha conserva el sello.
- **Dado** que pauso la camada con una cría en proceso **cuando** la reanudo **entonces** esa cría vuelve a estar en proceso y las demás vuelven como estaban.
- **Dado** que quito una cría que tenía solicitudes pendientes **cuando** confirmo **entonces** esas solicitudes se cierran y sus autores se enteran, como cuando se borra un animal solo (#59).
- **Dado** que ya tengo 3 solicitudes activas, dos de ellas a crías de la misma camada **cuando** intento pedir otra **entonces** se me dice que llegué al límite, igual que con animales solos.
- **Dado** que la camada venció con crías en proceso **cuando** la vuelvo a publicar **entonces** vuelve al listado con 30 días nuevos y cada cría con el estado que tenía.
- **Dado** que una persona fue aceptada para una cría y otra persona había pedido esa misma cría **cuando** se marca adoptada **entonces** la segunda ve su solicitud cerrada con el mensaje de siempre, y no se la ofrece otra cría de la camada por su cuenta.

### Errores y rechazos
- **Dado** que cambié el estado de una cría desde otra pestaña **cuando** toco una acción en la primera **entonces** veo cómo quedó la cría y qué podía hacer, sin pisar el cambio (#59).
- **Dado** que intento reanudar, renovar o volver a publicar sin el teléfono verificado **cuando** lo hago **entonces** veo el aviso de verificación pendiente y la camada queda como estaba.
- **Dado** que abro el enlace «Sigue disponible» de un correo ya usado o vencido **cuando** carga **entonces** veo que ya no sirve y cómo renovar desde «Mis animales» (#59).
- **Dado** que el sitio no responde al marcar una cría **cuando** lo hago **entonces** veo que no se pudo, la cría sigue como estaba y puedo reintentar.

## Pantallas
- **Mis animales**: la camada como grupo, con las acciones de la camada entera arriba y las de cada cría en su fila. Sin camadas, no aparece el grupo.
- **Solicitudes recibidas**: agrupada por camada y por cría. Vacío: «todavía nadie pidió a esta cría», como con un animal solo.
- **Mis solicitudes**: cada cría con el nombre de su camada.
- **Ficha de la camada**: el sello de cada cría (en proceso, adoptada) y el recuento al día.
- **Correos**: el de renovación por camada y los de aceptación, entrega y seguimiento con el nombre de la cría y el de la camada.

## Datos personales
- Lo mismo que #65, #67 y #69: el contacto se da recién al aceptar, solo entre las dos personas, y el seguimiento lo ve quien publicó. No nace ningún dato personal nuevo.

## Medición
- Los pasos del funnel de cada cría (ficha vista, clic en adoptar, cuestionario, aceptado, adoptado) se miden como los de un animal solo, con la marca de que viene de una camada (docs/03 §7). La encuesta de #71 se ofrece por cría adoptada, con el tope de una cada 30 días por persona.

## Dependencias
- #205 (publicar la camada), #59 (estados y vencimiento), #63 (pedir), #65 (responder), #67 (entregar), #69 (seguimiento), #71 (encuesta), todas cerradas salvo #205.

