## Historia
**Como** rescatista que llega al sitio porque alguien le dijo "probá esto" **quiero** entender en
un vistazo qué trabajo me ahorra frente al grupo de Facebook y empezar a publicar desde ahí, y
**como** persona que quiere adoptar **quiero** ver enseguida animales reales y saber que detrás de
cada uno hay alguien verificado, **para** que la primera pantalla del sitio lleve a publicar o a
mirar, y no a volver al grupo.

## Contexto
Hoy la dirección del sitio abre una portada provisoria que repite el nombre del sitio dos veces
seguidas y todavía dice «Estamos construyendo esto. Volvé pronto.», aunque publicar, el listado y la
ficha ya existen; su única acción es el enlace de la cabecera (KL-57-6, que se reabre con esta
historia). Los
rescatistas no se mudan por "seguridad" en abstracto: se mudan si la herramienta les ahorra trabajo
(docs/01 §Huevo y gallina), y el producto es para ellos primero (docs/01 §Opinión sincera). El
adoptante suele llegar por el enlace de una ficha pegado en un grupo (docs/03 §3); quien entra por
la dirección del sitio es, sobre todo, el rescatista al que se lo recomendaron y que decide en esa
pantalla si vale la pena publicar acá. Por eso la portada mueve la primera métrica de éxito: al
menos 3 rescatistas que publiquen más de un animal por su cuenta (docs/03 §Métricas de éxito).

Va al final de M2, cuando publicar, el listado, la ficha y el ciclo de vida de la publicación ya
existen, para diseñarla contra animales reales y no contra una maqueta (docs/09, decisión
2026-09-20). No espera al nombre: si todavía no está, lo único pendiente es el texto de marca. Las
historias de las que depende ya están construidas, así que la portada se escribe contra lo que el
sitio hace hoy.

## Alcance
- Incluye: la **portada** del sitio, que reemplaza a la provisoria, con: qué es el sitio en una
  frase · la acción principal "Publicar un animal" y la segunda, "Ver animales en adopción" · cómo
  funciona para quien rescata, en tres pasos que el sitio ya hace · qué quiere decir que quien
  publica esté verificado, para quien quiere adoptar · los animales publicados más recientes, hasta
  8, con "Ver todos" · la vista previa al pegar la dirección del sitio en WhatsApp o Facebook · que
  se vea y se use igual con o sin sesión, en el teléfono y en la computadora.
- No incluye (explícito): elegir el nombre, el dominio, el logo o el eslogan de marca (docs/04) ·
  que la portada aparezca en buscadores (se prende en M5) · las páginas que responden preguntas
  frecuentes y su enlace en el pie (#8) · el botón de opiniones y el contacto de soporte en el pie
  (M4, docs/03 §7) · contar la solicitud, el cuestionario o el contacto al aceptar, que todavía no
  existen (los agrega la historia de M3 que los construye) · cifras del sitio (animales publicados,
  adopciones) y testimonios · filtros o búsqueda en la portada (están en Animales en adopción) ·
  una portada distinta para quien ingresó, para rescatistas o para refugios · videos, animaciones
  de presentación o carrusel · enlaces a redes sociales · suscribirse a novedades.

## Reglas de negocio
- La portada es la misma para todos: con o sin sesión, rescatista o no. Nadie que entra a la
  dirección del sitio es mandado a otra pantalla.
- "Publicar un animal" es la acción principal de la pantalla y la única en su forma más visible;
  "Ver animales en adopción" está al lado, como segunda. Sin sesión, "Publicar un animal" pide
  ingresar y, al terminar (con el perfil completo si es la primera vez), lleva a publicar. Con
  sesión y sin teléfono verificado, muestra el aviso de verificación pendiente de #10.
- La portada solo cuenta lo que el sitio hace el día que se ve. Los tres pasos para quien rescata
  son: publicar desde el celular con hasta 5 fotos y los datos que los adoptantes preguntan siempre
  (#53); pegar el enlace en el grupo y que se vea con la foto, el nombre y la zona (#57); y que el
  sitio le escriba por correo 7 días antes de que la publicación venza, a los 30 días, para
  confirmar con un toque que el animal sigue disponible, así nadie pregunta por uno que ya se fue
  (#59).
- Para quien quiere adoptar, la portada dice que mirar es libre, sin registrarse; que cada animal lo
  publica una persona con el teléfono verificado; y que el teléfono y el contacto de nadie están a
  la vista.
- Los animales de la portada son los primeros del listado de Animales en adopción, con sus mismas
  reglas: los que se ven ahí, del más reciente al más viejo, hasta 8. Cada uno se muestra como en
  el listado (foto de portada, nombre, edad, zona, la marca de urgente y el sello «En proceso»
  cuando lo tiene) y abre su ficha. Un animal que sale del listado (pausado, adoptado, vencido,
  dado de baja o de alguien que hoy no tiene el teléfono verificado) sale también de la portada.
- El nombre que muestra la portada es el provisorio, que sale de un solo lugar; cuando se elija el
  definitivo, cambia ese nombre y la portada no se toca. El nombre aparece una sola vez en lo
  primero que se ve (el de la cabecera alcanza), y la portada no dice en ningún lugar que el sitio
  está en construcción.
- La vista previa al pegar la dirección del sitio muestra el nombre, la frase de la portada y una
  imagen con la identidad del cartel. Nunca un animal ni una persona.
- La portada se lee y se usa entera aunque el navegador no ejecute nada (el que abre la dirección
  desde la app de Facebook o con señal mala).
- En la computadora la portada usa el ancho del cartel: los animales ganan lugares por fila y
  ningún bloque queda como una tira angosta con blanco al costado.

## Criterios de aceptación
### Camino feliz
- **Dado** que soy rescatista y no tengo cuenta **cuando** abro la dirección del sitio **entonces**
  veo qué es en una frase, "Publicar un animal", "Ver animales en adopción", los tres pasos para
  quien rescata y los animales publicados más recientes.
- **Dado** que no tengo cuenta **cuando** toco "Publicar un animal" e ingreso con Google por
  primera vez **entonces** completo mi perfil y llego a publicar un animal, sin volver a la portada.
- **Dado** que ingresé y tengo el teléfono verificado **cuando** toco "Publicar un animal" en la
  portada **entonces** llego directo a publicar.
- **Dado** que hay 12 animales publicados **cuando** abro la portada **entonces** veo los 8 más
  recientes y "Ver todos", que abre Animales en adopción sin filtros.
- **Dado** que veo a Tobi en la portada **cuando** lo toco **entonces** se abre su ficha.
- **Dado** que abro la portada **cuando** la recorro de arriba abajo **entonces** el nombre del
  sitio aparece una sola vez arriba y no hay ninguna nota de que el sitio está en construcción.
- **Dado** que leo los tres pasos para quien rescata **cuando** llego al tercero **entonces** dice
  que el sitio avisa por correo 7 días antes de que la publicación venza a los 30 días y que se
  confirma con un toque.
- **Dado** que pego la dirección del sitio en un grupo de WhatsApp **cuando** se arma la vista
  previa **entonces** muestra el nombre del sitio, la frase de la portada y la imagen del cartel.

### Casos borde (al menos 3)
- **Dado** que todavía no hay ningún animal publicado **cuando** abro la portada **entonces** en el
  lugar de los animales dice "Todavía no hay animales publicados." e invita a publicar el primero,
  y el resto de la portada se ve completo.
- **Dado** que hay 3 animales publicados **cuando** abro la portada **entonces** veo esos 3, sin
  lugares vacíos, y "Ver todos".
- **Dado** que Luna estaba entre los más recientes **cuando** su publicador la pausa, la marca
  adoptada o vence **entonces** deja de aparecer en la portada y su lugar lo ocupa el siguiente del
  listado.
- **Dado** que Simón, entre los más recientes, está marcado en proceso **cuando** abro la portada
  **entonces** lo veo con el sello «En proceso», igual que en el listado.
- **Dado** que ingresé con una cuenta sin teléfono verificado **cuando** toco "Publicar un animal"
  **entonces** veo el aviso de verificación pendiente, con el motivo y el camino para verificarme.
- **Dado** que abro la portada en una computadora de 1280 px **cuando** carga **entonces** los
  animales se reparten en más lugares por fila que en el teléfono y ningún bloque queda angosto con
  blanco al costado.
- **Dado** que abro la dirección desde la app de Facebook con un navegador que no ejecuta nada
  **cuando** carga **entonces** leo toda la portada, veo los animales y los enlaces funcionan.

### Errores y rechazos
- **Dado** que los animales no se pueden cargar **cuando** abro la portada **entonces** el resto de
  la portada se ve completo, en el lugar de los animales dice que no se pudieron cargar y está el
  camino a Animales en adopción.
- **Dado** que toqué "Publicar un animal" sin sesión **cuando** abandono el ingreso o el enlace del
  correo venció **entonces** veo el motivo en la pantalla de ingreso, como en #9, y puedo volver a
  intentarlo sin perder a dónde iba.
- **Dado** que la foto de un animal de la portada no carga **cuando** abro la portada **entonces**
  veo su lugar con el color borroso de la foto y el resto funciona.

## Pantallas
- **Portada** (reemplaza a la provisoria): la frase de qué es el sitio en voz de afiche, "Publicar
  un animal" y "Ver animales en adopción", los tres pasos para quien rescata, lo que quiere decir
  verificado para quien adopta, y los animales más recientes con "Ver todos". Vacío: "Todavía no
  hay animales publicados." con la invitación a publicar el primero.
- **Vista previa al compartir la dirección del sitio**: el nombre, la frase y la imagen del cartel.
  Vacío: no aplica.

## Datos personales
- No aplica. La portada no muestra datos de ninguna persona: de cada animal, lo mismo que el
  listado (foto, nombre, edad, zona y urgente), nunca quién lo publica. Mirar la portada no guarda
  nada que identifique a quien mira.

## Medición
- Vio la portada; tocó "Publicar un animal" desde la portada y si terminó publicando en esa misma
  visita; tocó "Ver animales en adopción" o "Ver todos"; abrió una ficha desde la portada. Dice si
  la portada trae rescatistas que publican (primera métrica de docs/03 §Métricas de éxito) y cuánta
  gente llega a una ficha por esta puerta frente a los enlaces compartidos (docs/03 §3).

## Dependencias
- #53 Publicar un animal (a donde lleva la acción principal).
- #57 Animales en adopción y la ficha (los animales de la portada, su enlace y su vista previa).
- #59 Ciclo de vida de la publicación (qué animales se ven y el tercer paso que cuenta la portada).
- #9 y #10 (el ingreso que pide "Publicar un animal" y el aviso de verificación pendiente).
- Todas cerradas. KL-57-6 (la portada provisoria) se resuelve con esta historia.
- docs/01 §Huevo y gallina · docs/03 §3 y §Métricas de éxito · docs/04 (el nombre provisorio) ·
  docs/08 §Encontrable · docs/09 decisión 2026-09-20 · docs/10 §Layout (la zona pública, la
  acción principal).

## Decisiones del enjambre
- **Decisión (2026-09-27, product-owner):** la acción principal de la portada es "Publicar un
  animal", y "Ver animales en adopción" va al lado como segunda. Motivo: el adoptante llega sobre
  todo por el enlace de una ficha (docs/03 §3); quien entra por la dirección del sitio es el
  rescatista al que se lo recomendaron, y el producto es para rescatistas primero (docs/01 §Huevo y
  gallina). Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** la portada solo cuenta lo que el sitio ya hace; la
  historia de M3 que construye la solicitud y el contacto al aceptar agrega su paso a la portada.
  Motivo: prometer lo que todavía no existe es exactamente la desconfianza que el producto viene a
  sacar (docs/01 §Por qué tiene sentido), y un rescatista que publica por una promesa que no se
  cumple no vuelve. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** la portada muestra los 8 animales más recientes del
  listado, con sus mismas reglas y sin orden por urgencia, y sin cifras del sitio ni testimonios.
  Motivo: un animal real convence más que una frase, y es la misma regla que el listado (#57);
  en la beta los números son chicos y una cifra chica se lee como un sitio vacío. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** la portada es la misma con o sin sesión y no manda a
  nadie a otra pantalla. Motivo: una sola pantalla que decir y medir; quien ingresó llega a lo suyo
  desde su menú o desde "Publicar un animal". Va en docs/03 §3.



---
_Generated by [Claude Code](https://claude.ai/code)_
