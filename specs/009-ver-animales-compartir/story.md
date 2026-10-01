## Historia
**Como** rescatista **quiero** que cada animal que publico tenga una ficha con un enlace para pegar
en mi grupo de Facebook o mandar por WhatsApp, y **como** persona que quiere adoptar **quiero**
recorrer los animales publicados con filtros y ver su ficha sin registrarme, **para** que el
posteo de siempre lleve a una ficha completa con un publicador verificado detrás.

## Contexto
No vamos a reemplazar Facebook: lo usamos de canal. El rescatista sigue posteando en su grupo, pero
postea nuestro enlace, y la solicitud pasa por la plataforma, con verificación (docs/03 §3). Ese es
el mecanismo de crecimiento sin gastar, y solo funciona si el enlace se ve lindo al pegarlo y abre
la ficha sin pedir nada: mirar es libre, solicitar exige verificación (docs/01 §Verificación =
fricción). Si el enlace no le ahorra trabajo al rescatista frente a subir las fotos al grupo, no lo
va a usar, y sin adoptantes que lleguen a una ficha no hay solicitudes con las que medir si la
verificación vale la fricción (docs/03 §Hipótesis).

Es la segunda historia de M2: pone a la vista las fichas que crea #53. Lo que le pasa a una
publicación con el tiempo (estados, expiración, pausa) es la historia siguiente.

## Alcance
- Incluye: la pantalla **Animales en adopción** con todos los animales publicados y sus filtros
  (especie, sexo, tamaño, edad, departamento y castrado, docs/03 §3) · la **ficha** de cada animal
  con todas sus fotos, todos los datos de #53 y quién lo publica · las dos visibles sin ingresar ·
  un enlace fijo y limpio por ficha · la vista previa al pegar ese enlace en WhatsApp o Facebook,
  con la foto de portada, el nombre y la zona · el botón **Compartir** en la ficha y en cada animal
  de Mis animales · el enlace del listado con los filtros puestos, que se puede compartir · ver la
  ficha pública de mis animales desde Mis animales, y editar desde mi propia ficha.
- No incluye (explícito): solicitar adopción y el botón "Quiero adoptar" (M3) · los estados en
  proceso, adoptado y pausado, la expiración, borrar una publicación y la revisión antes de salir
  (historia del ciclo de vida) · el perfil público de quien publica, su distintivo y el enlace a su
  perfil (#12) · ocultar lo que publica una cuenta suspendida o bloqueada (#13) · buscar por texto
  o por raza · filtrar por urgencia, por convivencia o por vacunas · ordenar de otra forma que la
  fija · mapa o distancia · favoritos, likes o comentarios · publicar solo en Facebook o Instagram
  desde el sitio · que el listado o las fichas aparezcan en buscadores (se prende en M5) · la
  portada del sitio (la landing, al final de M2) · detectar el contacto escrito de forma
  disfrazada en la descripción (un número en palabras, un correo con «arroba»): lo baja la revisión
  de publicaciones nuevas de la historia del ciclo de vida (#59).

## Reglas de negocio
- El listado y las fichas se ven sin ingresar, y se ven igual con o sin sesión.
- Se ven solo los animales cuyo publicador tiene hoy el teléfono verificado (nivel 1, #10). Si deja
  de tenerlo (cambió de número y no confirmó el nuevo), sus animales salen del listado y su enlace
  dice que el animal no está disponible por ahora; vuelven solos cuando confirma. En Mis animales
  se le avisa por qué no se ven, y él sí ve la ficha de sus animales, con el aviso de que nadie más
  la ve hasta que confirme su teléfono y el camino para confirmarlo.
- El listado muestra del más reciente al más viejo, de a 24 animales, con "Ver más" para los
  siguientes. Cada animal lleva su foto de portada, nombre, edad, zona y la marca de urgente si la
  tiene. Arriba dice cuántos animales hay con los filtros puestos. "Ver más" no repite ni saltea
  animales aunque se publique uno nuevo mientras se mira, y volver al listado desde una ficha lo
  deja como estaba: los mismos filtros, los animales que ya se habían cargado y el mismo lugar.
- Filtros: especie (perro, gato), sexo (macho, hembra), tamaño (chico, mediano, grande), edad
  (cachorro: menos de 1 año; joven: 1 a 2 años; adulto: 3 a 7 años; mayor: 8 años o más),
  departamento (los 19) y castrado (sí). En un mismo filtro se puede marcar más de una opción y
  entran los que cumplen cualquiera; entre filtros distintos, los que cumplen todos. Arranca sin
  ningún filtro puesto.
- La edad para filtrar es la de hoy, la misma que avanza sola en la ficha (#53).
- Los filtros viajan en el enlace del listado: abrirlo, recargarlo o volver atrás muestra los
  mismos filtros y los mismos animales.
- La ficha muestra todas las fotos con la portada primero, y nombre, especie, sexo, edad, tamaño,
  castrado, vacunas, chip, convivencia con niños, perros y gatos (sí, no o no se sabe), la
  descripción, la zona, la marca de urgente y hace cuánto se publicó.
- De quien publica, la ficha muestra solo el nombre y la foto de su perfil, si se marcó como
  rescatista o refugio, y hasta dónde se verificó, dicho en palabras ("Teléfono verificado"). Nunca su teléfono,
  su correo, su zona ni ningún otro dato: el contacto se da cuando se acepta una solicitud.
- El enlace de una ficha es corto, no lleva nada de quien lo comparte y no cambia nunca: si el
  publicador edita el nombre o las fotos, el enlace que ya pegó sigue abriendo la misma ficha.
- La vista previa al compartir lleva la foto de portada, el nombre y la zona del animal. Si el
  publicador cambia la portada, lo que el sitio ofrece para armar la vista previa es desde ese
  momento la nueva (WhatsApp y Facebook pueden tardar en cambiar una vista previa que ya armaron).
- La vista previa del enlace de un animal que no está disponible o no existe no muestra nada del
  animal: ni foto, ni nombre, ni zona; muestra el nombre del sitio y "Animales en adopción".
- Compartir abre las opciones de compartir del teléfono; en una computadora, copia el enlace y
  dice "Enlace copiado".
- El listado y la ficha se pueden usar aunque el navegador no ejecute nada (el que abre un enlace
  desde la app de Facebook o con señal mala).

## Criterios de aceptación
### Camino feliz
- **Dado** que publiqué a Tobi **cuando** toco "Compartir" en Mis animales y pego el enlace en un
  grupo de WhatsApp **entonces** la vista previa muestra la foto de portada de Tobi, su nombre y su
  zona.
- **Dado** que no tengo cuenta **cuando** abro el enlace de Tobi desde Facebook **entonces** veo su
  ficha completa, sin que se me pida entrar, con el nombre y la foto de quien lo publicó y
  "Teléfono verificado".
- **Dado** que abro Animales en adopción **cuando** marco "gato", "cachorro" y "Canelones"
  **entonces** veo solo los gatos de menos de 1 año de Canelones, del más reciente al más viejo, y
  arriba cuántos son.
- **Dado** que marqué filtros **cuando** copio el enlace del listado y lo abro en otro teléfono
  **entonces** veo los mismos filtros y los mismos animales.
- **Dado** que filtré, toqué "Ver más" y abrí un animal del listado **cuando** vuelvo atrás
  **entonces** el listado sigue con los mismos filtros, los animales que ya había cargado y en el
  mismo lugar donde estaba.
- **Dado** que ingresé y publiqué a Tobi **cuando** abro su ficha **entonces** veo "Editar", que me
  lleva a editarlo; otra persona, con o sin sesión, no lo ve.

### Casos borde (al menos 3)
- **Dado** que hay 30 animales publicados **cuando** abro el listado **entonces** veo 24 y "Ver
  más"; al tocarlo aparecen los 6 que faltan y "Ver más" desaparece.
- **Dado** que marco "chico" y "mediano" en tamaño y "perro" en especie **cuando** se actualiza
  **entonces** veo los perros chicos y los medianos, y ningún gato.
- **Dado** que un cachorro se publicó con 11 meses **cuando** pasa un mes **entonces** sale del
  filtro "cachorro" y entra en "joven".
- **Dado** que pegué el enlace de Luna en mi grupo **cuando** después le cambio el nombre a "Lunita"
  **entonces** el enlace viejo abre la ficha de Lunita.
- **Dado** que el publicador cambió de número y todavía no confirmó el nuevo **cuando** alguien
  abre el enlace de su animal **entonces** ve que el animal no está disponible por ahora y el
  camino al listado; el animal no aparece en el listado, y vuelve cuando el publicador confirma.
- **Dado** que cambié de número y todavía no confirmé el nuevo **cuando** abro la ficha de mi
  animal desde Mis animales **entonces** la veo con el aviso de que nadie más la ve hasta que
  confirme, y el camino para confirmarlo.
- **Dado** que el animal no está disponible por ahora **cuando** alguien pega su enlace en WhatsApp
  **entonces** la vista previa muestra el nombre del sitio y "Animales en adopción", sin la foto, el
  nombre ni la zona del animal.
- **Dado** que vi los primeros 24 animales y alguien publica uno nuevo **cuando** toco "Ver más"
  **entonces** veo los siguientes sin ninguno repetido y sin que falte ninguno de los que ya estaban.
- **Dado** que abro el enlace de una ficha desde la app de Facebook, en un teléfono de gama media con
  4G **cuando** carga **entonces** la foto de portada y el nombre del animal se ven en menos de 2,5
  segundos.
- **Dado** que la descripción está vacía **cuando** abro la ficha **entonces** la ficha se ve
  completa, sin un hueco en su lugar.
- **Dado** que abro la ficha en una computadora **cuando** toco "Compartir" **entonces** el enlace
  queda copiado y veo "Enlace copiado".

### Errores y rechazos
- **Dado** que abro un enlace de ficha que no existe o cuyo publicador borró la cuenta **cuando**
  carga **entonces** veo que ese animal no está publicado y el camino a Animales en adopción.
- **Dado** que abro un enlace de listado con un filtro que no existe (una especie inventada)
  **cuando** carga **entonces** ese filtro se ignora y veo el listado con el resto.
- **Dado** que no hay conexión **cuando** toco "Ver más" **entonces** los animales que ya veía
  siguen ahí, se me dice que no se pudo cargar por la conexión y puedo reintentar.
- **Dado** que una foto de la ficha no carga **cuando** abro la ficha **entonces** veo su lugar con
  el color borroso de la foto y el resto de la ficha funciona.

## Pantallas
- **Animales en adopción**: los filtros arriba, cuántos animales hay y los animales en grilla, con
  "Ver más" al final. Vacío sin filtros: "Todavía no hay animales publicados." Vacío con filtros:
  "No hay animales con estos filtros.", con la acción de sacar los filtros.
- **Ficha de un animal**: las fotos, los datos, quién lo publica y "Compartir"; "Editar" si es mío,
  y el aviso de que nadie más la ve si mi teléfono no está confirmado.
  Vacío: no aplica (una ficha tiene al menos una foto y los datos obligatorios de #53).
- **Animal no disponible**: el de un publicador que no está verificado hoy y el que no existe, cada
  uno con su texto y el camino al listado. Vacío: no aplica.
- **Mis animales** (cambia, de #53): cada animal suma "Ver ficha" y "Compartir", y el aviso de que
  no se ven mientras el teléfono no esté confirmado. Vacío: el de #53.
- **Vista previa al compartir**: la foto de portada con el nombre y la zona. Vacío: no aplica.

## Datos personales
- De quien publica se muestran a cualquiera, sin ingresar, el nombre y la foto de su perfil, si es
  rescatista o refugio y su nivel de verificación. Nunca su teléfono, correo, zona ni fecha de
  alta. Del animal se muestra la zona (departamento y localidad), nunca una dirección, y las fotos
  sin la ubicación donde se sacaron (#53). Filtrar o mirar no guarda nada que identifique a quien
  mira. Borrar la cuenta del publicador saca sus fichas en el momento y su enlace dice que el animal
  no está publicado.

## Medición
- Vio el listado, usó un filtro (cuál), vio una ficha y de dónde llegó (desde el listado o desde
  afuera del sitio, como un enlace pegado en un grupo o un chat, sin saber quién lo compartió),
  tocó "Compartir" y desde dónde (la ficha o Mis animales). "Vio ficha" es el primer
  paso del funnel de docs/03 §7; las fichas abiertas desde un enlace compartido miden si el canal
  de Facebook y WhatsApp funciona (docs/03 §3).

## Dependencias
- #53 Publicar un animal con sus fotos y sus datos (las fichas, Mis animales y la edad que avanza).
- #10 Verificación de teléfono (el nivel 1 que decide si una ficha se ve).
- docs/03 §3 · docs/01 §Verificación = fricción · docs/08 §Encontrable (nada se indexa hasta el
  dominio definitivo; el listado y la ficha sin ejecutar nada) · docs/10 §Layout (listado y ficha).
- Limitaciones que esta historia reabre: KL-53-3 (el contacto disfrazado, que resuelve la decisión
  de abajo) y KL-53-9 (la ficha se juzga con fotos de animales, no con color liso).

## Decisiones del enjambre
- **Decisión (2026-09-27, product-owner):** solo se ven los animales cuyo publicador tiene hoy el
  teléfono verificado; si lo pierde, sus fichas dicen "no disponible por ahora" y vuelven solas al
  confirmar. Motivo: el diferencial es que detrás de cada ficha hay una persona verificada, y el que
  da en adopción también se verifica (docs/01 §"Validación" esconde el problema difícil); el enlace
  no se rompe para siempre, así que al rescatista no le cuesta el posteo. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** el listado va del más reciente al más viejo, de a 24,
  sin ordenar por urgencia. Motivo: si lo urgente fuera primero, todos marcarían urgente y la marca
  dejaría de decir algo; la urgencia se ve en cada animal. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** la edad se filtra en cuatro tramos: cachorro (menos de
  1 año), joven (1 a 2), adulto (3 a 7) y mayor (8 o más), sobre la edad de hoy. Motivo: así se
  busca en los grupos ("cachorro", "adulto"), y la edad cargada en meses o años no se puede filtrar
  de otra forma sin pedir números. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** en un filtro se marcan varias opciones y los filtros se
  suman; los filtros viajan en el enlace del listado. Motivo: "chico o mediano" es la búsqueda de
  quien vive en un apartamento, y un rescatista puede pegar en su grupo "los gatos de Canelones"
  con un solo enlace. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** de quien publica, la ficha muestra solo nombre, foto, si
  es rescatista o refugio y su nivel en palabras; su perfil público y su distintivo llegan con #12.
  Motivo: son datos que docs/03 §1 ya define como públicos, y lo mínimo para que el adoptante vea
  que hay una persona verificada detrás (docs/01 §Legal / datos). Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** el enlace de una ficha no cambia nunca, aunque se edite
  el nombre, y "Compartir" está también en Mis animales. Motivo: el posteo del grupo de Facebook
  vive semanas, y compartir es el trabajo que el rescatista hace por cada animal (docs/03 §3). Va
  en docs/03 §3.
- **Decisión (2026-09-28, product-owner):** quien publica ve la ficha de sus animales aunque hoy no
  se muestre a nadie más, con el aviso de por qué y el camino para confirmar su teléfono. Motivo: el
  rescatista que cambió de chip tiene que ver qué le falta y que su enlace va a volver, no una
  pantalla de "no disponible" sobre su propio animal. Va en docs/03 §3.
- **Decisión (2026-09-28, product-owner):** la vista previa del enlace de un animal que no se
  muestra (publicador sin teléfono confirmado, o animal que no existe) no lleva foto, nombre ni
  zona: solo el nombre del sitio y "Animales en adopción". Motivo: lo que no se ve en la ficha
  tampoco se ve pegado en un grupo; entre dos opciones, la que muestra menos (Ley 18.331). Va en
  docs/03 §3.
- **Decisión (2026-09-28, product-owner):** esta historia no detecta el contacto disfrazado en la
  descripción (KL-53-3); lo baja la revisión de publicaciones nuevas de #59, que llega antes de la
  beta, y hasta la beta el sitio no lo ve nadie de afuera. Motivo: no hay forma confiable de
  separar "vive en Rivera y Soca" de "la rescatamos en Rivera y Soca", y la revisión a mano ya es
  el mecanismo de docs/03 §6. Va en docs/known-limitations.md: el PR de esta historia cambia el «Se
  reabre cuando» de KL-53-3 a la historia #59.

