## Historia
**Como** rescatista que marca adoptado a un animal que le di a alguien que no vino por el sitio
**quiero** decir con un toque, si quiero, por dónde me encontró esa persona
**para** que el sitio sepa contra qué canal pierde cuando una adopción se cierra por fuera.

## Contexto
El competidor es Facebook más WhatsApp (docs/01), y la hipótesis de docs/03 pregunta justo si la gente
deja el grupo por el sitio. Hoy, cuando quien rescata marca «Se lo di a alguien que no vino por el
sitio», la medición cuenta una adopción por fuera y nada más: no distingue el grupo de Facebook del
vecino que se enteró de boca en boca, ni de quien vio la ficha acá y le escribió directo, que es la
conversación que #250 intenta traer de vuelta al sitio. Esas tres respuestas dicen cosas opuestas
sobre la hipótesis, y con 3 a 5 rescatistas cada adopción por fuera es un dato que no se puede perder.

Le gana a la camada en la guía, la portada y el listado (#223, #224), a los detalles de texto de #206,
al aviso de un animal parecido para quien adopta y al traspaso del chip (docs/05, trámite sin averiguar)
porque es una pregunta opcional en una pantalla que ya existe y contesta de frente si se pierde contra
Facebook. Es la otra mitad de #263, que pregunta por qué se borra un animal que no se adoptó.

## Alcance
- Incluye: en la pantalla de marcar adoptado, una pregunta opcional «¿Por dónde te encontró?» con seis
  opciones fijas y ninguna elegida, cuando quien rescata elige «Se lo di a alguien que no vino por el
  sitio» o cuando ese es el único camino porque no hay solicitudes aceptadas · marcar adoptado igual,
  conteste o no · lo mismo al marcar por fuera cada cría de una camada · la respuesta sumada a la
  medición de esa adopción · la lectura nueva en docs/03 §Métricas de éxito.
- No incluye (explícito): la pregunta cuando se lo dio a alguien cuya solicitud aceptó · un texto libre
  en «Por otro lado» · cualquier dato de quien adoptó por fuera (nombre, teléfono, perfil, enlace) ·
  mostrar la respuesta en la ficha, en «Mis animales», en el perfil, a quien publicó o en Administrar
  (Encuestas incluida) · cambiar la respuesta después de marcar · preguntar por dónde llegó en las
  adopciones que ya se marcaron antes de esta historia · preguntar algo al sacar de la vista un animal
  sin marcarlo adoptado (lo hace #263 al borrar) · cambiar la encuesta de #71 o lo que aparece después
  de marcar · cambiar las opciones desde el sitio.

## Reglas de negocio
- La pregunta aparece en la pantalla de marcar adoptado debajo de «Se lo di a alguien que no vino por
  el sitio» y de su nota, antes del botón de confirmar, solo mientras ese camino está elegido o es el
  único. Si quien rescata elige a una persona con la solicitud aceptada, la pregunta se va.
- La pregunta es «¿Por dónde te encontró?» y las opciones son: «Un grupo o una página de Facebook» ·
  «Instagram» · «Un estado o un grupo de WhatsApp» · «Vio a {nombre} en este sitio y me escribió
  directo» · «Alguien que conozco, o me lo recomendaron» · «Por otro lado». {nombre} es el del animal o
  la cría que se marca.
- Ninguna opción viene elegida. Se puede elegir una, cambiarla o volver a tocarla para dejarla sin
  elegir antes de confirmar. «Marcar adoptado» funciona igual sin contestar: la pregunta nunca agrega
  un toque ni frena marcar.
- Se cuenta lo que estaba elegido al confirmar, una sola vez por adopción aunque se toque dos veces o
  se reintente. Sin opción elegida, la adopción se cuenta como «sin contestar». Si marcar no se hace,
  no se cuenta nada.
- Si quien rescata eligió una opción y después cambió a una persona con la solicitud aceptada, la
  opción no se cuenta: esa adopción vino por el sitio.
- En una camada, cada cría se marca por separado y cada una trae su propia pregunta: cada cría dada
  por fuera es una respuesta.
- Si el animal se vuelve a publicar después y se marca adoptado otra vez por fuera, se pregunta de
  nuevo y se cuenta como otra adopción; lo que se contestó la primera vez queda como estaba.
- La respuesta va solo a la medición de esa adopción, que hoy dice que fue por fuera, los días desde
  que se publicó y si era una cría. No lleva nada de quien rescata ni de quien adoptó, no queda con el
  animal y no la ve nadie en el sitio.

## Criterios de aceptación
### Camino feliz
- **Dado** que Carla publicó a Luna y no tiene solicitudes aceptadas **cuando** abre «Marcar adoptada»
  **entonces** ve «¿Por dónde te encontró?» con las seis opciones y ninguna elegida, debajo de la nota
  y antes de «Marcar adoptada».
- **Dado** que Carla eligió «Un grupo o una página de Facebook» **cuando** toca «Marcar adoptada»
  **entonces** Luna queda adoptada por fuera del sitio como hoy, y la medición cuenta esa adopción con
  Facebook como canal.
- **Dado** que Carla no eligió ninguna opción **cuando** toca «Marcar adoptada» **entonces** Luna queda
  adoptada como hoy y la adopción se cuenta como «sin contestar».
- **Dado** que Carla tiene una solicitud aceptada de Beto **cuando** elige «Se la di a alguien que no
  vino por el sitio» **entonces** aparece la pregunta con ninguna opción elegida.

### Casos borde (al menos 3)
- **Dado** que Carla tiene una solicitud aceptada de Beto **cuando** elige a Beto **entonces** la
  pregunta no aparece; si había elegido «Instagram» en el camino por fuera y vuelve a Beto, la pregunta
  se va y al marcar no se cuenta ningún canal.
- **Dado** que Carla eligió «Instagram» por error **cuando** la vuelve a tocar o elige otra antes de
  confirmar **entonces** queda sin elegir o con la nueva, y se cuenta solo lo que había al confirmar.
- **Dado** que la camada de Mora tiene tres crías y Carla da dos por fuera **cuando** marca adoptada a
  cada una **entonces** ve la pregunta en cada cría y se cuentan dos respuestas, una por cría, cada una
  con lo que eligió en esa.
- **Dado** que Carla marcó a Luna adoptada por fuera con «Instagram», la volvió a publicar y la da
  otra vez por fuera **cuando** abre «Marcar adoptada» **entonces** ve la pregunta sin ninguna opción
  elegida, y al confirmar se cuenta una adopción nueva sin cambiar la anterior.
- **Dado** que Carla eligió «Vio a Luna en este sitio y me escribió directo» **cuando** marca adoptada
  **entonces** esa adopción se cuenta aparte de Facebook, Instagram y WhatsApp.

### Errores y rechazos
- **Dado** que Carla eligió «Instagram» y se corta la conexión **cuando** toca «Marcar adoptada»
  **entonces** Luna sigue como estaba, «Instagram» sigue elegida, ve que no se pudo por la conexión, y
  al tocar de nuevo Luna queda adoptada y se cuenta una sola adopción, con Instagram.
- **Dado** que Carla toca dos veces «Marcar adoptada» **cuando** termina **entonces** queda una sola
  adopción contada, con lo que había elegido.
- **Dado** que Carla marcó a Luna adoptada en otra pestaña **cuando** confirma desde esta con una opción
  elegida **entonces** ve «Luna cambió mientras tanto. Ahora ves cómo quedó.» como hoy, y no se cuenta
  otra adopción ni otra respuesta.
- **Dado** que la sesión de Carla se cerró **cuando** toca «Marcar adoptada» **entonces** se le pide
  entrar de nuevo como hoy, Luna no cambia y no se cuenta nada.

## Pantallas
- **Marcar adoptado, camino por fuera** (390 y 1280 px): la pregunta va debajo de «Se lo di a alguien
  que no vino por el sitio» y de su nota, antes del botón de confirmar, como un grupo de opciones de una
  sola elección con su título; dice que es opcional sin que suene a formulario. En el teléfono las seis
  opciones van una debajo de la otra y el botón sigue a la vista al terminar la lista; a 1280 px van en
  el mismo bloque de la pantalla, sin abrir otra hoja. Con una persona elegida, la pantalla es la de
  hoy. Vacío: no aplica, las opciones son fijas y la pregunta no aparece en el camino de una solicitud
  aceptada.

## Datos personales
- No nace ningún dato personal. La respuesta es una de seis opciones fijas o «sin contestar», sumada a
  la medición de la adopción, que ya va sin la persona, sin el animal y sin textos (docs/03 §7). No
  queda con el animal, no la ve nadie en el sitio y no se puede cambiar.
- De quien adoptó por fuera no se pide ni se guarda nada: no vino por el sitio y no aceptó nada
  (Ley 18.331).

## Medición
- La adopción marcada por fuera, que ya se cuenta, suma el canal elegido o «sin contestar»: Facebook,
  Instagram, WhatsApp, visto en el sitio, alguien conocido u otro lado. Se cuenta una vez por adopción,
  también por cada cría. Las adopciones con una solicitud aceptada no llevan canal.
- docs/03 §Métricas de éxito gana una lectura: de las adopciones por fuera, qué parte llegó por
  Facebook, Instagram o WhatsApp contra las que trajo el sitio aunque la conversación se fue al chat,
  al lado de las adopciones con una solicitud aceptada. Con 3 a 5 rescatistas se lee como señal al
  lado de las encuestas y de #263.

## Dependencias
- #67 marcar a quién se entregó · #59 estados de la publicación · #205 y #206 camadas · #250 la
  respuesta para quien escribe por un animal · #263 la pregunta al borrar · #169 medición en el sitio
  de verdad.
- docs/03 §5, §7 y §Métricas de éxito.

## Decisiones del enjambre
- **Decisión (2026-10-29, product-owner):** la pregunta es opcional, aparece solo en el camino «por
  fuera» y nunca frena marcar adoptado. Motivo: sacar de la vista nunca se traba (#59), y una pregunta
  obligatoria en el momento de cerrar empuja a contestar cualquier cosa, que es peor que no tener el
  dato. (docs/03 §5)
- **Decisión (2026-10-29, product-owner):** seis opciones fijas, sin texto libre, y la respuesta va
  solo a la medición de esa adopción, sin persona, como los otros momentos: no queda con el animal ni la
  ve nadie en el sitio. Motivo: un texto libre puede traer el nombre o el teléfono de quien adoptó, que
  no vino por el sitio y no aceptó nada; entre dos opciones razonables, la que muestra menos y guarda
  menos (Ley 18.331). Una lista fija además se puede sumar entre rescatistas. (docs/03 §7)
- **Decisión (2026-10-29, product-owner):** «Vio a {nombre} en este sitio y me escribió directo» es una
  opción propia y se cuenta aparte de los otros canales. Motivo: esa adopción la trajo el sitio aunque
  la conversación se fue al chat; mezclada con Facebook diría que el sitio no sirvió, y es la lectura
  que #250 abrió. (docs/03 §Métricas de éxito)
- **Decisión (2026-10-29, product-owner):** la lectura nueva de docs/03 §Métricas de éxito compara, en
  las adopciones por fuera, qué parte llegó por Facebook, Instagram o WhatsApp contra las que trajo el
  sitio, al lado de las adopciones con una solicitud aceptada. Motivo: es la pregunta de la hipótesis
  dicha en adopciones cerradas, y con pocos rescatistas se lee como señal al lado de las encuestas.
  (docs/03 §Métricas de éxito)
- **Decisión (2026-11-21, product-owner):** la respuesta no se muestra en Encuestas, a diferencia de
  #263. Motivo: #263 guarda una respuesta aparte porque el borrado no deja nada que medir; acá la
  adopción por fuera ya se cuenta, y el canal va con ella, al lado de las adopciones por el sitio, que
  es justo la comparación de la lectura nueva. Un apartado más en Encuestas sería otra pantalla para
  el mismo número. (docs/03 §7)
- **Decisión (2026-11-21, product-owner):** en una camada se pregunta en cada cría, y una adopción que
  se vuelve a publicar y se da otra vez por fuera se pregunta de nuevo. Motivo: cada cría y cada
  entrega es una adopción distinta que puede haber llegado por otro canal, y la medición ya cuenta una
  adopción por cada una; lo contestado antes no se toca porque no se puede cambiar. (docs/03 §5 y §7)


---
_Generated by [Claude Code](https://claude.ai/code)_
