## Historia
**Como** rescatista con el teléfono verificado que tiene una camada **quiero** publicar todas las crías juntas, con lo que tienen en común y lo propio de cada una, **para** no armar una publicación por cría y para que quien busca vea la camada completa.

## Contexto
Hernán pidió el 2026-10-20 poder publicar camadas: cuando una perra o una gata tiene crías, publicarlas todas en una sola publicación, con sus propias características y condiciones. Hoy habría que cargar cinco fichas casi iguales, con las mismas fotos, las mismas vacunas y la misma zona (#53), y el listado mostraría cinco tarjetas parecidas que tapan al resto de los animales (#57). Una camada es el momento en que entran más animales de golpe, y la primera métrica de éxito pide que los rescatistas publiquen más de un animal por su cuenta (docs/03 §Métricas de éxito).

Esto suma alcance a docs/03 §2. No toca la lista «Fuera del MVP». El enjambre lo registra en docs/03 §2 con la fecha del pedido de Hernán y el motivo, en el mismo PR. La idea que ordena todo: una camada agrupa a las crías de una misma madre; se publica una vez con lo que tienen en común, y cada cría se pide, se acepta y se entrega por separado. Esta historia es publicar y ver la camada; lo que sigue (estados, vencimiento, bandeja, entrega y seguimiento por cría) es la historia #206, que se construye enseguida después. Las dos llegan juntas a la beta (#76): hasta entonces nadie de afuera ve el sitio, y los pedidos de una cría quedan guardados hasta que #206 le dé a quien publicó dónde responderlos.

## Alcance
- Incluye: publicar una camada de perros o de gatos, de 2 a 10 crías · **lo común, que se carga una sola vez**: nombre de la camada, especie, edad aproximada, tamaño de adulto esperado, castrado, vacunas, chip, convive con niños, perros y gatos, descripción, zona, urgente y de 1 a 5 fotos con su portada y su orden · **lo propio de cada cría**: nombre (se propone «Cría 1», «Cría 2»… y se cambia), sexo, una descripción propia opcional y hasta 5 fotos propias · **las condiciones de la camada**: el nivel mínimo que se exige a quien pide (#63) y, opcional, desde qué fecha se entregan las crías · editar la camada y sus crías, agregar crías hasta 10 y quitar crías · que la camada aparezca en el listado como una sola tarjeta con cuántas crías tiene y cuántas están disponibles · la ficha de la camada, visible sin ingresar, con lo común, quién la publica y cada cría con su botón para pedirla, con el mismo cuestionario y las mismas reglas que cualquier animal (#63) · un enlace fijo por camada, con vista previa al pegarlo y el botón «Compartir», como un animal (#57) · que «Mis animales» muestre la camada como un grupo · que «Publicar un animal» empiece preguntando si es un animal o una camada · que la camada entre a «Publicaciones por revisar» como una sola publicación (#59) · que la camada se vea y se oculte según la verificación de quien publica, como un animal (#57, #13).
- No incluye (explícito): estados, pausa, vencimiento y renovación de la camada y de cada cría, la bandeja de solicitudes por camada, la entrega y el seguimiento (historia #206) · un enlace propio por cría · filtrar por urgencia (tampoco existe para los animales, #57) · otras especies · mezclar perros y gatos en una camada · publicar a la madre junto con la camada (se publica aparte, como cualquier animal) · pedir la camada entera a una sola persona · raza, color o árbol genealógico · convertir en camada animales ya publicados · más de 10 crías.

## Reglas de negocio
- Publica y edita quien tiene nivel 1 (#10), como con cualquier animal. Sin nivel 1 se ve el aviso de verificación pendiente.
- Una camada tiene de 2 a 10 crías al publicarse. Después puede quedar con una sola; si se quitan todas, se borra. Motivo del tope: una camada típica no pasa de 10, y un tope evita publicaciones enormes.
- Una camada es de una sola especie, perro o gato.
- Son obligatorios, de la camada: nombre, especie, edad aproximada, tamaño, castrado, vacunas, chip, zona y al menos una foto; y de cada cría: nombre y sexo (macho o hembra). Convive con niños, con perros y con gatos se contesta con sí, no o no se sabe y arranca en no se sabe; urgente es sí o no y arranca en no; la zona se propone desde el perfil y se puede cambiar. Los valores son los de #53.
- Lo común vale para todas las crías y se carga una sola vez. Cada cría pide solo lo suyo: nombre, sexo y, si quiere, descripción y fotos propias. Una cría sin fotos propias muestra las de la camada.
- El nombre de la camada es libre («La camada de Luna», «Los de la plaza») y se muestra tal cual lo escribió quien publica. El nombre de la camada y el de cada cría tienen hasta 30 caracteres. La descripción de la camada, hasta 2000; la de cada cría, hasta 300. Ningún texto acepta teléfonos, correos ni enlaces, y se explica por qué (#53).
- Dos crías de la misma camada no pueden tener el mismo nombre: se marca cuál se repite. Motivo: los avisos y los correos nombran a la cría. Al agregar una cría se propone el primer «Cría N» que no esté usado.
- Las fotos siguen las reglas de #53: formatos comunes, hasta 10 MB cada una y sin la ubicación donde se sacaron. La camada lleva de 1 a 5 y cada cría, de 0 a 5. En cada grupo la primera es la portada y se puede cambiar el orden. La portada de la camada es la foto de su tarjeta y de su vista previa.
- La edad aproximada es la de la camada, se carga en meses o en años y avanza sola, como en #53. El tamaño es el de adulto, uno para toda la camada.
- «Desde cuándo se entregan» es una fecha de hoy en adelante, y es opcional. Se ve en la ficha de la camada. Antes de esa fecha se puede pedir igual: la fecha avisa cuándo se entrega, no cuándo se puede pedir. Pasada la fecha, la ficha deja de mostrarla.
- El nivel mínimo es de la camada y vale para todas sus crías. Arranca en teléfono verificado, la ficha dice antes de tocar nada cuando pide identidad verificada, y cambiarlo vale para los pedidos nuevos (#63).
- Si ya publiqué una camada con el mismo nombre y la misma especie, se me avisa antes de publicar otra y puedo seguir igual. Se compara solo con mis camadas, no con mis animales.
- Un guardado que falla por la conexión conserva todo lo cargado en pantalla, y reintentar o tocar dos veces publicar no crea dos camadas. Lo escrito y no publicado, crías incluidas, se conserva al recargar en el mismo navegador, sin las fotos (#53).
- La camada tiene un enlace fijo que no cambia aunque se edite su nombre o sus fotos. Al pegarlo en un grupo, la vista previa lleva la portada, el nombre de la camada y la zona.
- Nadie pide una cría de su propia camada: en su ficha ve «Editar», no «Quiero adoptar» (#63).
- Quitar una cría que ya tiene pedidos pide confirmación y dice cuántos pedidos se cierran. Qué se les avisa a quienes pidieron es de #206, igual que cuando se borra un animal (#59).
- La camada se ve en el listado y en su ficha, sin ingresar, solo si quien la publica tiene hoy el teléfono verificado y su cuenta no está suspendida. Si deja de cumplirlo, sale del listado y su enlace dice que no está disponible por ahora, con una vista previa sin foto, nombre ni zona. Quien la publicó la sigue viendo, con el aviso de por qué y el camino para confirmar su teléfono (#57, #13).
- La camada sale en el momento y entra a «Publicaciones por revisar» como una sola publicación, con todas sus crías y fotos. Quien administra la marca revisada o la da de baja entera, con un motivo (#59). Si quien la publicó edita una camada ya revisada, vuelve a la lista.
- En el listado la camada es una sola tarjeta: la foto de la camada, su nombre, «5 crías, 3 disponibles» y la zona. Los filtros de especie, edad, tamaño, departamento y castrado se aplican a la camada; el de sexo, a las crías disponibles, y la camada aparece si alguna lo cumple. El recuento de arriba cuenta cada camada como una.
- La interfaz dice «camada» y «cría», palabras que sirven para perros y gatos. No se usa «cachorro» ni «gatito».

## Criterios de aceptación
### Camino feliz
- **Dado** que tengo el teléfono verificado **cuando** elijo «una camada», cargo lo común una vez, completo 4 crías con nombre y sexo y publico **entonces** veo la camada en «Mis animales» y en el listado como una tarjeta que dice «4 crías, 4 disponibles».
- **Dado** que abro la ficha de la camada **cuando** miro **entonces** veo lo común arriba, quién la publica y las 4 crías con su nombre, su sexo, su foto y su descripción, y en cada una un botón para pedirla.
- **Dado** que toco el botón de una cría **cuando** sigo **entonces** empiezo el cuestionario de #63 para esa cría, con las mismas reglas que con un animal solo.
- **Dado** que publiqué la camada **cuando** toco «Compartir» y pego el enlace en un grupo **entonces** la vista previa muestra la foto de portada de la camada, su nombre y la zona.
- **Dado** que no tengo cuenta **cuando** abro el enlace de una camada desde Facebook **entonces** veo la ficha completa, sin que se me pida entrar.
- **Dado** que corrijo la zona de la camada **cuando** guardo **entonces** la ficha y el listado la muestran en todas las crías.
- **Dado** que se me olvidó una cría **cuando** edito la camada **entonces** la agrego y la camada pasa a decir «5 crías».

### Casos borde (al menos 3)
- **Dado** que cargo 10 crías **cuando** intento agregar una más **entonces** no me deja y dice que el máximo es 10.
- **Dado** que cargo una sola cría **cuando** intento publicar **entonces** me dice que una camada lleva al menos 2 y me ofrece publicarla como un animal, con lo que ya cargué.
- **Dado** que una cría no tiene sexo **cuando** intento publicar **entonces** veo marcado cuál falta y no se pierde nada de lo cargado.
- **Dado** que una cría no tiene fotos propias **cuando** abro la ficha **entonces** esa cría muestra las fotos de la camada.
- **Dado** que filtro el listado por «hembra» **cuando** miro **entonces** aparece la camada que tiene al menos una hembra disponible, y no la que solo tiene machos.
- **Dado** que quito una cría de una camada de dos **cuando** guardo **entonces** la camada queda con una, y si quito la última se me avisa que la camada se borra antes de confirmarlo.
- **Dado** que quito una cría que tiene 2 pedidos **cuando** confirmo **entonces** la confirmación me dijo antes que esos 2 pedidos se cierran.
- **Dado** que ya tengo una camada llamada «La camada de Luna» de la misma especie **cuando** publico otra con ese nombre **entonces** se me avisa y puedo seguir.
- **Dado** que pegué el enlace de la camada en mi grupo **cuando** después le cambio el nombre **entonces** el enlace viejo abre la misma ficha con el nombre nuevo.
- **Dado** que cambié de número y todavía no confirmé el nuevo **cuando** alguien abre el enlace de mi camada **entonces** ve que no está disponible por ahora, la camada no aparece en el listado, y yo la veo en «Mis animales» con el aviso y el camino para confirmar.
- **Dado** que la camada exige identidad verificada **cuando** abro su ficha **entonces** lo dice arriba, antes de tocar el botón de una cría.
- **Dado** que la fecha de entrega ya pasó **cuando** abro la ficha **entonces** la ficha no la muestra.
- **Dado** que abro mi propia camada **cuando** miro sus crías **entonces** veo «Editar» y ninguna cría tiene «Quiero adoptar».

### Errores y rechazos
- **Dado** que mi teléfono no está verificado **cuando** intento publicar o editar una camada **entonces** veo el aviso de verificación pendiente, con el motivo y el camino para verificarme (#10).
- **Dado** que el guardado falla por la conexión **cuando** reintento **entonces** nada de lo cargado se perdió y no se publica dos veces.
- **Dado** que escribo un teléfono, un correo o un enlace en cualquier texto **cuando** intento guardar **entonces** se rechaza y se explica por qué.
- **Dado** que mi sesión se cerró mientras cargaba **cuando** intento guardar **entonces** se me pide ingresar, y lo escrito sigue en este navegador (#53).
- **Dado** que dos crías tienen el mismo nombre **cuando** intento publicar **entonces** se marca cuál se repite y lo demás sigue cargado.
- **Dado** que pongo una fecha de entrega de ayer **cuando** intento guardar **entonces** se me dice que tiene que ser de hoy en adelante.
- **Dado** que elijo una foto de más de 10 MB o un archivo que no es una foto **cuando** se carga **entonces** esa foto se rechaza con el motivo y las demás quedan.
- **Dado** que abro el enlace de una camada que no existe o cuyo publicador borró la cuenta **cuando** carga **entonces** veo que esa camada no está publicada y el camino a Animales en adopción.

## Pantallas
- **Publicar un animal**: arranca con la pregunta «¿Es un animal o una camada?». Vacío: no aplica.
- **Publicar una camada**: dos partes, lo común y las crías. Vacío: dos crías en blanco con «Cría 1» y «Cría 2», «Agregar cría», la zona del perfil propuesta y el lugar de la primera foto como invitación. Cada cría puede quitarse.
- **Ficha de la camada**: lo común, quién la publica, la fecha de entrega si hay, el nivel que se pide si es identidad, «Compartir», «Editar» si es mía y la lista de crías con su botón de pedir. Vacío: no aplica, una camada tiene al menos una cría.
- **Camada no disponible**: la de quien no está verificado hoy y la que no existe, cada una con su texto y el camino al listado. Vacío: no aplica.
- **Tarjeta de la camada en el listado**: una sola tarjeta con el recuento. Vacío: el del listado (#57).
- **Editar la camada**: las dos partes con lo cargado. Vacío: no aplica.
- **Mis animales** (cambia, de #53): la camada como un grupo con sus crías, «Ver ficha» y «Compartir». Sin camadas, no aparece ningún grupo.
- **Publicaciones por revisar** (cambia, de #59): la camada como una entrada, con sus crías. Vacío: el de #59.
- **Vista previa al compartir**: la portada de la camada con su nombre y la zona. Vacío: no aplica.

## Datos personales
- Lo mismo que #53 y #57: el contacto de quien publica no es público (de la persona se ven nombre, foto, si es rescatista o refugio y su nivel, en palabras), las fotos pierden la ubicación, la zona es departamento y localidad, nunca una dirección, y si se borra la cuenta, se borran la camada, sus crías y sus fotos. Lo escrito sin publicar vive solo en el navegador. No nace ningún dato personal nuevo.

## Medición
- Publicación empezada, terminada, abandonada y editada, como en #53, con la marca de que es una camada y cuántas crías lleva. Publicar una camada cuenta como una sola publicación para «cuántas personas publican un segundo animal»: una camada de 5 no cumple sola la métrica.
- La ficha de una camada cuenta como ficha vista, con su origen (#57), y cada pedido de una cría, como un clic en adoptar (docs/03 §7). Los eventos dicen si el animal viene de una camada, para comparar cómo avanzan.

## Dependencias
- #53 (publicar), #57 (listado, ficha y compartir), #59 (revisión de publicaciones nuevas), #63 (pedir con el cuestionario), #10 (teléfono verificado), #13 (cuenta suspendida), todas cerradas · #206 (lo que sigue; las dos llegan juntas a la beta, #76) · docs/03 §2 y docs/06 (se suma «camada» y «cría» al glosario).

## Decisiones
- **Decisión (2026-10-20, con Hernán):** el nombre de la camada es un campo libre que se muestra tal cual, con un ejemplo («La camada de Luna»); el sitio no le antepone palabras. Motivo: no todas las madres tienen nombre ni se publican, y una camada sucesiva de la misma madre no tiene por qué llamarse igual. Va en docs/03 §2.
- **Decisión (2026-10-20, con Hernán):** una camada cuenta como una publicación para la métrica «más de un animal por su cuenta». Motivo: si cada cría contara, una sola camada la cumpliría y la métrica dejaría de decir si el rescatista volvió a publicar. Va en docs/03 §Métricas de éxito.
- **Decisión (2026-10-20, con Hernán):** el sexo de cada cría es obligatorio, como en #53. Motivo: las crías se publican con semanas de vida, y el filtro de sexo del listado no puede tener huecos. Va en docs/03 §2.
- **Decisión (2026-10-20, con Hernán):** solo la camada tiene enlace, vista previa y «Compartir»; las crías se ven y se piden desde su ficha. Motivo: una ficha pública más por cría suma una vista previa y unos estados que dependen de #206. Va en docs/03 §3.
- **Decisión (2026-10-20, con Hernán):** #205 y #206 llegan juntas a la beta. Motivo: sin #206 los pedidos de una cría no tienen dónde responderse ni la camada cómo cerrarse. Va en docs/03 §2.

