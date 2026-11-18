# Feature Specification: Sumarle al cuestionario de un animal una pregunta mía, la que hoy hago por WhatsApp

**Feature Branch**: `feature/292-sumarle-cuestionario-pregunta-propia`

**Created**: 2026-11-18

**Status**: Draft

**Input**: Historia #292 del backlog. El cuerpo verbatim de la historia acompaña a esta spec
(`story.md`). Ya en `main` de esta historia: nada.

**Ya construido** (en `main`, no se rehace): el cuestionario de siempre con sus preguntas, sus
reglas, sus condicionales, las respuestas propuestas de la solicitud anterior (salvo «¿Por qué
<nombre>?»), el borrador que se recupera y el reintento que no pierde lo escrito (#63); la bandeja de
quien publicó, la solicitud abierta con sus respuestas, «Pedir más información» con su tope de 3, los
motivos de rechazo con «No contestó lo que le pregunté» y el tiempo de respuesta (#65); «Mis
solicitudes» y «Mi solicitud» del lado de quien solicitó (#63, #65); publicar y editar un animal con
la regla de que el nombre y la descripción no aceptan teléfonos, correos ni enlaces (#53); las
camadas, donde lo común se escribe una vez y vale para cada cría, y sus crías como animales que se
solicitan uno por uno (#205, #206); la solicitud que espera la identidad y sale sola al aprobarse
(#289); Administrar → Encuestas con sus secciones sin la persona ni el animal (#71, #73, #234, #263);
los momentos de publicar, editar, mandar una solicitud, la primera respuesta, aceptar y rechazar
(#169). Revisado en `main`: ningún animal ni camada tiene una pregunta propia, ningún
cuestionario la pide y ninguna solicitud la guarda. Esta spec suma eso y no cambia las preguntas de
siempre, sus textos ni su orden.

**Vocabulario de esta spec**:

- **Pregunta propia**: el texto que quien publicó escribe para un animal o para una camada y que
  aparece en el cuestionario de ese animal o de cada cría. Hay una o ninguna. Es distinta de la
  pregunta de «Pedir más información», que quien publicó hace después, solicitud por solicitud
  (glosario de docs/06).
- **La misma pregunta**: dos preguntas propias son la misma si su texto es igual, sin contar los
  espacios del principio y del final.
- **Publicación**: un animal o una camada. Una camada cuenta como una publicación; sus crías se
  solicitan una por una (decisión del 2026-10-20).
- **La pregunta contestada**: el texto de la pregunta propia tal como estaba cuando la persona mandó
  la solicitud (o la dejó escrita esperando la identidad). Queda junto a la respuesta.
- **Publicada hoy**: una publicación disponible, en proceso, en pausa o vencida, de una cuenta que no
  está suspendida; no una adoptada, borrada ni dada de baja por quien administra.
- **Lo que se recupera del formulario**: lo escrito en publicar que vuelve al abrirlo de nuevo, como
  hoy. «Borrador» queda para lo escrito sin mandar en el cuestionario (docs/06).
- En los ejemplos, Carla publicó a Kira y a la camada de Luna; Lucía quiere adoptar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La pregunta de Kira, contestada y leída en la solicitud (Priority: P1)

Carla publica a Kira y, en «Tu pregunta para quien quiera adoptarlo», escribe «Kira toma una pastilla
dos veces por día. ¿Podés dársela en horario?». La ficha de Kira se ve como siempre. Lucía toca
«Quiero adoptar» y, justo antes de «¿Por qué Kira?», encuentra la pregunta con el nombre de Carla y un
campo para contestarla. Manda la solicitud. Carla la abre en «Solicitudes recibidas» y lee la pregunta
y la respuesta en la misma pantalla que el resto del cuestionario; Lucía las ve en su solicitud.

**Why this priority**: es la historia entera en su forma más chica: sin esto quien rescata sigue
preguntando por WhatsApp. Sola ya deja escribir, contestar y leer la pregunta de un animal.

**Independent Test**: con personas sembradas, publicar un animal con pregunta, comprobar que la ficha,
el listado, la vista previa del enlace y el texto para el grupo no la muestran, solicitarlo como otra
persona contestándola, y abrir la solicitud de los dos lados. Probar los rechazos de la pregunta y de
la respuesta (teléfono, correo, enlace, largo, vacía) y el corte de conexión al guardar y al enviar.

**Acceptance Scenarios**:

1. **Dado** que Carla publica a Kira **cuando** escribe en «Tu pregunta para quien quiera adoptarlo»
   «Kira toma una pastilla dos veces por día. ¿Podés dársela en horario?» y publica **entonces** la
   ficha de Kira se ve como siempre, sin la pregunta, y quien toca «Quiero adoptar» la encuentra en el
   cuestionario justo antes de «¿Por qué Kira?», con el nombre de Carla.
2. **Dado** que Lucía contestó la pregunta al solicitar a Kira **cuando** Carla abre su solicitud en
   «Solicitudes recibidas» **entonces** ve la pregunta y la respuesta en la misma pantalla que el
   resto del cuestionario, y Lucía las ve en su solicitud.
3. **Dado** que Carla edita a Kira, que no tenía pregunta, **cuando** escribe una y guarda **entonces**
   las solicitudes que se manden desde ahí la contestan.
4. **Dado** que Carla escribe en la pregunta «Escribime al 099 123 456» **cuando** guarda **entonces**
   no se guarda y ve por qué la pregunta no puede llevar un teléfono, sin perder el resto de lo
   cargado. Lo mismo con un correo o un enlace.
5. **Dado** que la pregunta pasa de 200 caracteres **cuando** Carla escribe **entonces** ve cuántos
   sobran y no puede guardar hasta acortarla.
6. **Dado** que Lucía deja vacía la respuesta a la pregunta propia, o solo espacios, o pone un correo,
   un teléfono o un enlace **cuando** toca «Enviar» **entonces** la solicitud no sale y ve cuál es el
   problema al lado de esa respuesta, como con las otras preguntas abiertas.
7. **Dado** que Lucía escribe en la respuesta **cuando** se acerca a 500 caracteres **entonces** ve el
   contador, como en las otras preguntas abiertas, y el campo no deja pasarse.
8. **Dado** que ya mandé una solicitud por otro animal que tenía pregunta propia **cuando** abro el
   cuestionario de Kira **entonces** las respuestas de siempre vienen propuestas y la de la pregunta de
   Kira está vacía.
9. **Dado** que se corta la conexión al guardar la pregunta o al mandar la solicitud **cuando**
   reintento **entonces** queda una sola versión de la pregunta, o una sola solicitud, y no pierdo lo
   escrito.
10. **Dado** que Kira no tiene pregunta **cuando** alguien abre su cuestionario, su solicitud o la de
    quien la publicó **entonces** todo se ve como hoy.
11. **Dado** que el campo de la pregunta está vacío **cuando** Carla lo mira al publicar o al editar
    **entonces** ve solo un ejemplo y una línea que dice que la ve quien solicita, no la ficha.

---

### User Story 2 - La pregunta de una camada vale para cada cría (Priority: P2)

Carla publica la camada de Luna con la pregunta «¿Te comprometés a traerlo a la vacuna de los 3
meses?». Quien solicita cualquiera de las crías la contesta en el cuestionario de esa cría, y Carla la
lee en cada solicitud.

**Why this priority**: las camadas son una parte grande de lo que se publica en los grupos, y la
pregunta del control del primer mes es típica de un cachorro. Depende de la parte 1, que hace que la
pregunta exista para un animal.

**Independent Test**: con una camada sembrada, ponerle una pregunta al publicarla y otra al editarla,
sumar una cría después, y solicitar dos crías distintas; comprobar que las dos solicitudes la traen y
que ninguna pantalla pública de la camada ni de sus crías la muestra.

**Acceptance Scenarios**:

1. **Dado** que la camada de Luna tiene la pregunta «¿Te comprometés a traerlo a la vacuna de los 3
   meses?» **cuando** alguien solicita cualquiera de sus crías **entonces** la contesta en el
   cuestionario de esa cría, justo antes de «¿Por qué <nombre de la cría>?», con el nombre de Carla.
2. **Dado** que Carla suma una cría a la camada de Luna, que ya tiene pregunta **cuando** alguien
   solicita esa cría **entonces** también la contesta.
3. **Dado** que Carla cambia o saca la pregunta de la camada **cuando** alguien abre el cuestionario
   de cualquiera de sus crías **entonces** ve la nueva, o ninguna; las solicitudes que ya llegaron no
   cambian.
4. **Dado** que Carla edita la camada **cuando** busca dónde poner una pregunta distinta para una sola
   cría **entonces** no la encuentra: la pregunta es una sola, la de la camada.

---

### User Story 3 - Cambiar o sacar la pregunta sin romper lo que llegó (Priority: P3)

Kira ya tenía dos solicitudes cuando Carla le sumó la pregunta. Esas dicen «Llegó antes de tu
pregunta», con «Pedir más información» como siempre. Después Carla cambia el texto: las solicitudes
que la contestaron siguen mostrando la pregunta que vio cada persona. Si la saca, las respuestas
siguen ahí y el cuestionario deja de pedirla. Si alguien estaba escribiendo cuando cambió, al tocar
«Enviar» ve la nueva y la contesta antes de mandar.

**Why this priority**: sin esto quien decide podría leer una respuesta al lado de una pregunta que la
persona nunca vio, o pensar que alguien no contestó lo que nunca se le preguntó. Depende de la
parte 1.

**Independent Test**: con un animal sembrado con solicitudes de antes, sumarle la pregunta, mandar
otra solicitud, cambiar la pregunta, mandar otra, sacarla; abrir cada solicitud de los dos lados.
Cambiar la pregunta mientras otra persona tiene el cuestionario abierto y tocar «Enviar». Dejar
escrita una solicitud esperando la identidad sin pregunta, sumar la pregunta y aprobar la identidad.

**Acceptance Scenarios**:

1. **Dado** que Kira tenía 2 solicitudes cuando Carla le sumó la pregunta **cuando** Carla abre esas
   solicitudes **entonces** dicen «Llegó antes de tu pregunta», con «Pedir más información» como
   siempre, y las que llegan después traen la respuesta.
2. **Dado** que Carla cambió la pregunta de Kira después de 3 solicitudes **cuando** abre una de esas
   3 **entonces** ve la pregunta que contestó esa persona, no la nueva; quien solicitó también ve la
   que contestó.
3. **Dado** que Carla sacó la pregunta de Kira **cuando** abre las solicitudes que la contestaron
   **entonces** siguen mostrando la pregunta y la respuesta, y el cuestionario ya no la pide.
4. **Dado** que Carla sacó la pregunta de Kira **cuando** abre una solicitud que llegó sin pregunta
   **entonces** no ve «Llegó antes de tu pregunta» ni nada nuevo.
5. **Dado** que Lucía está escribiendo el cuestionario de Kira y Carla cambia la pregunta **cuando**
   Lucía toca «Enviar» **entonces** ve la pregunta nueva sin contestar, con un aviso de que Carla
   cambió su pregunta mientras escribía, lo que había escrito para la anterior a la vista para
   copiarlo si le sirve, y lo demás que escribió intacto; la solicitud sale recién cuando la contesta.
6. **Dado** que Lucía está escribiendo el cuestionario de Kira, que no tenía pregunta, y Carla le suma
   una **cuando** Lucía toca «Enviar» **entonces** ve la pregunta nueva sin contestar, con lo demás que
   escribió, y la solicitud sale recién cuando la contesta.
7. **Dado** que Lucía está escribiendo el cuestionario de Kira y Carla saca la pregunta **cuando**
   Lucía toca «Enviar» **entonces** la solicitud sale con las respuestas de siempre, sin la pregunta.
8. **Dado** que Lucía vio el aviso de pregunta cambiada y Carla la vuelve a cambiar antes de que Lucía
   toque «Enviar» otra vez **cuando** lo toca **entonces** pasa lo mismo: ve la de ahora, el aviso y
   lo último que había escrito.
9. **Dado** que Lucía contestó la pregunta A, Carla la cambió a B y después la volvió a A **cuando**
   Lucía toca «Enviar» **entonces** la solicitud sale: contestó la misma pregunta que hoy se hace.
10. **Dado** que Bruno dejó escrita una solicitud para Kira esperando su identidad, cuando Kira todavía
   no tenía pregunta, **cuando** Carla le suma la pregunta y después aprueban la identidad de Bruno
    **entonces** la solicitud sale como se escribió y Carla ve «Llegó antes de tu pregunta».
11. **Dado** que Bruno dejó escrita una solicitud para Kira contestando la pregunta, **cuando** Carla
    la cambia y después la solicitud sale **entonces** Carla ve la pregunta que Bruno contestó.

---

### User Story 4 - Lo que preguntan quienes publican, en Administrar → Encuestas (Priority: P4)

Quien administra abre Encuestas y encuentra «Lo que preguntan quienes publican»: de las publicaciones
que hoy están publicadas, cuántas tienen una pregunta, y la lista de preguntas puestas, sin la persona
ni el animal. Ninguna respuesta.

**Why this priority**: es lo que enseña qué le falta al cuestionario de siempre, en palabras de los
rescatistas. No cambia nada de lo que ve quien publica ni quien adopta.

**Independent Test**: con publicaciones sembradas con y sin pregunta (una adoptada, una dada de baja,
una camada), abrir Encuestas como quien administra y comprobar el conteo, la lista y que no aparece
la persona, el animal ni ninguna respuesta; abrirla sin publicaciones con pregunta; intentar leer las
preguntas con el animal o las respuestas como quien administra y que falle.

**Acceptance Scenarios**:

1. **Dado** que hay 5 publicaciones publicadas hoy y 2 tienen pregunta **cuando** quien administra
   abre Encuestas **entonces** «Lo que preguntan quienes publican» dice cuántas de las publicadas
   tienen una pregunta y lista esas 2 preguntas, sin la persona ni el animal.
2. **Dado** que ninguna publicación publicada hoy tiene pregunta **cuando** quien administra abre la
   sección **entonces** ve «Todavía nadie sumó una pregunta.»
3. **Dado** que Kira se adoptó o la dieron de baja **cuando** quien administra abre la sección
   **entonces** su pregunta no se cuenta ni se lista.
4. **Dado** que la camada de Luna tiene pregunta **cuando** quien administra abre la sección
   **entonces** cuenta como una publicación y su pregunta aparece una vez, no una por cría.
5. **Dado** que quien administra mira la sección o la ficha de una persona **cuando** busca las
   respuestas a una pregunta propia **entonces** no las encuentra en ningún lado.
6. **Dado** que no se pueden traer las preguntas **cuando** quien administra abre Encuestas
   **entonces** la sección dice que no se pudo cargar y el resto de Encuestas se ve igual.

---

### User Story 5 - Medir si la pregunta ahorra la charla (Priority: P5)

Quien lee la medición puede comparar las solicitudes con pregunta y sin ella: qué parte recibe primero
«Pedir más información», qué parte se rechaza con «No contestó lo que le pregunté» y en cuánto
responde quien publicó; y qué parte de las publicaciones lleva una pregunta.

**Why this priority**: no cambia nada de lo que ve una persona; lo necesita la hipótesis para saber
si el cuestionario alcanza para elegir sin chatear.

**Independent Test**: recorrer las partes 1 a 3 con la medición en modo de prueba y comprobar que los
momentos llegan con el sí o el no, nunca con el texto, y que la lectura nueva está escrita en
docs/03 §Métricas de éxito.

**Acceptance Scenarios**:

1. **Dado** que Carla publica o edita un animal o una camada **cuando** se lee la medición
   **entonces** el momento de publicar o de editar dice si la publicación tiene una pregunta propia,
   sí o no, sin el texto.
2. **Dado** que Lucía manda una solicitud, o sale sola una que esperaba la identidad, **cuando** se
   lee la medición **entonces** el momento de mandarla dice si contestó una pregunta propia.
3. **Dado** que Carla responde por primera vez, acepta o rechaza una solicitud **cuando** se lee la
   medición **entonces** cada uno de esos momentos dice si esa solicitud contestó una pregunta propia.
4. **Dado** que llegó la historia **cuando** se abre docs/03 §Métricas de éxito **entonces** está la
   lectura nueva, al lado de las lecturas 1 y 3.

---

### Edge Cases

- **Solo espacios en la pregunta**: cuenta como vacía; guardar así deja la publicación sin pregunta.
  Los espacios al principio y al final no cuentan para los 200.
- **Guardar la misma pregunta sin cambios**: no es un cambio; las solicitudes que llegaron no pasan a
  ser «de antes» ni cambia nada.
- **El largo**: los 200 de la pregunta y los 500 de la respuesta se cuentan en caracteres como los ve
  la persona; un emoji cuenta uno.
- **Una publicación con un problema en otro campo**: si al guardar falla otra cosa, la pregunta
  escrita no se pierde; si falla la pregunta, el resto de lo cargado tampoco.
- **Lo que se recupera del formulario de publicar**: trae también la pregunta que se había escrito.
- **El borrador del cuestionario**: si Lucía vuelve a un cuestionario que había dejado a medias, su
  respuesta a la pregunta propia vuelve solo si la pregunta sigue siendo la misma; si cambió, la ve
  sin contestar, con el resto de lo que había escrito.
- **La respuesta escrita para una pregunta que cambió**: al tocar «Enviar» con la pregunta cambiada,
  lo que Lucía había escrito para la anterior sigue a la vista junto a la nueva, para que lo use si le
  sirve; no se manda como respuesta a la nueva.
- **Una solicitud que espera la identidad**: el cuestionario para dejarla escrita pide la pregunta
  propia igual que el de siempre, y lo que pasa si la pregunta cambia mientras se escribe es lo mismo.
  Mientras espera, la pregunta contestada queda con ella; si no sale, se borra con las respuestas.
- **Quien solicita no ve la pregunta antes del cuestionario**: no está en la ficha ni en ninguna
  pantalla antes de «Quiero adoptar»; la ve recién en el cuestionario, como «¿Por qué <nombre>?».
- **Quien publicó cambió su nombre**: el cuestionario muestra el nombre que tiene hoy.
- **Un animal que deja de recibir solicitudes**: su pregunta se queda guardada; se ve de nuevo en el
  cuestionario si vuelve a recibir.
- **Una publicación republicada o renovada**: conserva la pregunta que tenía; se cambia desde editar.
- **Una cría que se quita de la camada o se adopta**: las solicitudes que ya la contestaron siguen
  mostrando la pregunta y la respuesta.
- **Una solicitud cerrada** (retirada, no aceptada, por adopción, por bloqueo): muestra la pregunta y
  la respuesta como cualquier otra respuesta del cuestionario, a las mismas personas que hoy.
- **Quien publicó borra el animal o su cuenta**: la pregunta se borra; las solicitudes que la
  contestaron siguen las reglas de siempre de una solicitud cuya publicación terminó.
- **Quien solicitó borra su cuenta**: la respuesta y la pregunta contestada se borran con sus
  respuestas.
- **«Pedir más información»**: sigue igual en cualquier solicitud, con pregunta o sin ella, con su
  tope de 3.
- **Cargando y error**: el cuestionario, la solicitud abierta y «Mi solicitud» se ven como hoy al
  cargar y con error. Si la pregunta propia no se puede traer al abrir el cuestionario, el
  cuestionario no se muestra a medias: se ve el error de siempre con su reintento.
- **No se puede comprobar la pregunta al tocar «Enviar»**: la solicitud no sale, Lucía ve el error de
  siempre de un envío que no se pudo hacer, con su reintento, y no pierde nada de lo escrito.
- **Una solicitud que espera la identidad, en «Mis solicitudes»**: no tiene pantalla propia (#289),
  así que no muestra la pregunta ni la respuesta; las muestra cuando sale, como cualquier solicitud.
- **Una cuenta suspendida**: sus publicaciones no cuentan en Encuestas mientras dura la suspensión,
  como no existen para nadie más; si se reactiva, vuelven a contar.
- **Dos ediciones a la vez**: si Carla guarda la pregunta desde dos pantallas, queda la última que se
  guardó, una sola versión.
- **El texto para el grupo y el cartel**: no llevan la pregunta, aunque la publicación la tenga.

## Requirements *(mandatory)*

### Functional Requirements

**Escribir la pregunta**

- **FR-001**: Publicar y editar un animal, y publicar y editar una camada, MUST ofrecer el campo «Tu
  pregunta para quien quiera adoptarlo», opcional, con un ejemplo y el contador de 200.
- **FR-002**: Vacío, el campo MUST mostrar solo el ejemplo y una línea que dice que la ve quien
  solicita, no la ficha.
- **FR-003**: Una publicación MUST tener como mucho una pregunta propia, de hasta 200 caracteres
  contados sin los espacios del principio y del final; solo espacios es no tener pregunta.
- **FR-004**: Pasados los 200, el campo MUST decir cuántos sobran y la publicación MUST NOT poder
  guardarse hasta acortarla.
- **FR-005**: La pregunta MUST NOT aceptar teléfonos, correos ni enlaces, con la misma regla que el
  nombre y la descripción del animal, y MUST decir cuál de los tres encontró, sin perder el resto de
  lo cargado.
- **FR-006**: La pregunta MUST poder cambiarse o sacarse (dejando el campo vacío) en cualquier momento
  desde editar, también con solicitudes en curso.
- **FR-007**: Reintentar después de un corte al guardar MUST dejar una sola versión de la pregunta y
  lo escrito MUST seguir en la pantalla mientras no se guardó.
- **FR-008**: El borrador recuperado del formulario de publicar MUST traer la pregunta escrita.

**Dónde no se ve**

- **FR-009**: La pregunta MUST NOT aparecer en la ficha pública, en el listado, en la vista previa del
  enlace, en el texto para el grupo, en el cartel, en el perfil público ni en ningún contenido que lea
  un buscador o alguien sin sesión.
- **FR-010**: La pregunta MUST verla solo quien la publicó, quien abre el cuestionario de ese animal o
  esa cría habiendo pasado los frenos de siempre, quienes tienen una solicitud que la contestó (la
  versión que contestaron) y quien administra en Encuestas, sin la persona ni el animal.

**Contestarla**

- **FR-011**: Con pregunta propia, el cuestionario del animal, o de cada cría de una camada con
  pregunta, MUST mostrarla justo antes de «¿Por qué <nombre>?», con un campo de texto y el contador de
  500, y con el nombre de quien publicó que hoy ya muestra la ficha del animal; nunca un dato que se
  revela recién al aceptar. Sin pregunta, el cuestionario MUST quedar como hoy.
- **FR-012**: La respuesta MUST ser obligatoria, de hasta 500 caracteres, y MUST NOT aceptar
  teléfonos, correos ni enlaces, con los mismos errores que las otras preguntas abiertas, al lado de
  esa respuesta.
- **FR-013**: La respuesta MUST NOT proponerse desde una solicitud anterior, y una respuesta a la
  pregunta propia de otro animal MUST NOT proponerse en ninguna pregunta.
- **FR-014**: La pregunta de una camada MUST valer para cada una de sus crías, incluidas las que se
  suman después; una cría MUST NOT tener una pregunta distinta de la de su camada.
- **FR-015**: Al tocar «Enviar» (o «Dejarla lista», en una solicitud que espera la identidad), si la
  pregunta propia de hoy no es la misma que la persona contestó (o no tenía y ahora hay una), la
  solicitud MUST NOT salir: el cuestionario MUST llevarla a la pregunta de hoy, sin contestar, con un
  aviso arriba de que quien publicó cambió su pregunta mientras escribía; debajo del campo, lo que
  había escrito para la anterior, como texto que se puede copiar y no se manda; el resto de lo
  escrito, intacto. La solicitud sale recién cuando contesta la de hoy. Si cambia otra vez, MUST pasar
  lo mismo. Si la pregunta se sacó, la solicitud MUST salir con las respuestas de siempre.
- **FR-016**: Reintentar después de un corte al enviar MUST dejar una sola solicitud, con la regla de
  siempre.

**Leerla en la solicitud**

- **FR-017**: Cada solicitud que contestó una pregunta propia MUST guardar el texto de la pregunta tal
  como estaba cuando se mandó (o se dejó escrita) junto a la respuesta, y MUST mostrar los dos en la
  solicitud abierta de quien publicó y en «Mi solicitud» de quien solicitó, junto al resto del
  cuestionario, antes de «¿Por qué <nombre>?». Ahí la pregunta va como las demás, sin el nombre de
  quien publicó.
- **FR-018**: Cambiar o sacar la pregunta, o borrar la cría o el animal, MUST NOT cambiar ni borrar
  la pregunta contestada ni la respuesta de las solicitudes que ya llegaron; las siguientes contestan
  la de ese momento.
- **FR-019**: Una solicitud sin respuesta a una pregunta propia, abierta por quien publicó cuando el
  animal o su camada tiene hoy una pregunta, MUST decir «Llegó antes de tu pregunta» en el lugar de
  las respuestas donde iría la pregunta, debajo de su nombre «Tu pregunta para quien quiera
  adoptarlo», así no se confunde con la de «Pedir más información», que sigue como siempre. Vale
  para cualquier estado de la solicitud. Si el animal no tiene pregunta hoy, MUST NOT mostrar nada
  nuevo. Quien solicitó MUST NOT ver ese aviso.
- **FR-020**: Una solicitud que esperaba la identidad MUST salir como se escribió: con la pregunta
  contestada si la tuvo, o sin respuesta (y con «Llegó antes de tu pregunta» si hoy hay pregunta) si
  no la tuvo.
- **FR-021**: El contacto MUST seguir revelándose solo cuando la solicitud se acepta; la pregunta y la
  respuesta MUST NOT cambiar eso.

**Encuestas**

- **FR-022**: Administrar → Encuestas MUST sumar «Lo que preguntan quienes publican»: de las
  publicaciones publicadas hoy, cuántas tienen una pregunta sobre cuántas son, y la lista de las
  preguntas puestas, una vez por publicación (una camada, una vez), en orden alfabético, sin fecha,
  sin la persona ni el animal y sin nada que lleve a ellos. El texto se muestra como lo escribió quien
  publicó, aunque nombre al animal.
- **FR-023**: Vacía, la sección MUST decir «Todavía nadie sumó una pregunta.»; sin poder cargar, MUST
  decir que no se pudo, sin tapar el resto de Encuestas; mientras carga, MUST verse como el resto de
  Encuestas cargando. Con muchas preguntas, la lista MUST mostrar un tramo y «Ver más», como las
  otras listas de textos de Encuestas.
- **FR-024**: Quien administra MUST NOT poder leer una pregunta junto con la persona o el animal, ni
  ninguna respuesta a una pregunta propia, ni en Encuestas ni en ninguna otra pantalla o lectura.

**Datos personales**

- **FR-025**: La pregunta MUST borrarse al sacarla, al borrar la publicación o al borrar la cuenta de
  quien publicó. La copia que guarda cada solicitud es parte de la respuesta de quien solicitó y MUST
  quedar con ella, como hoy queda el nombre del animal, hasta que se borra la respuesta.
- **FR-026**: La respuesta y la pregunta contestada MUST seguir las reglas de las respuestas del
  cuestionario: las ven solo quien solicitó y quien publicó, se borran al borrar la cuenta de quien
  solicitó, y en una solicitud que espera la identidad y no sale se borran ese día.
- **FR-027**: Cada regla de quién ve la pregunta, la pregunta contestada y la respuesta MUST estar
  probada con un intento de leer lo que no debe verse: alguien sin sesión, otra persona con sesión,
  quien administra, y quien publicó con la respuesta de una solicitud ajena.

**Medición**

- **FR-028**: Los momentos de publicar y de editar un animal o una camada MUST decir si la publicación
  tiene una pregunta propia, sí o no, nunca el texto.
- **FR-029**: Los momentos de mandar una solicitud (también la que sale sola), de la primera
  respuesta, de aceptar y de rechazar MUST decir si la solicitud contestó una pregunta propia, sí o
  no.
- **FR-030**: docs/03 §Métricas de éxito MUST sumar la lectura nueva, al lado de las lecturas 1 y 3:
  qué parte de las publicaciones lleva una pregunta; entre las solicitudes con pregunta y sin ella,
  qué parte recibe primero «Pedir más información», qué parte se rechaza con «No contestó lo que le
  pregunté» y en cuánto responde quien publicó; que qué preguntan se lee en Encuestas; y que con 3 a 5
  rescatistas es una señal.

**Textos**

- **FR-031**: Todos los textos nuevos (el campo, su ejemplo y su línea, los errores, el encabezado de
  la pregunta en el cuestionario, «Llegó antes de tu pregunta», el aviso de pregunta cambiada, la
  sección de Encuestas y su estado vacío) MUST estar junto a los demás textos del sitio, en español
  rioplatense con voseo, escritos y revisados con el criterio sin-slop del proyecto.

### Key Entities *(include if feature involves data)*

- **Pregunta propia**: un texto de hasta 200 caracteres de quien publicó, guardado con su animal o su
  camada; una o ninguna por publicación. La de una camada vale para cada cría. Se borra al sacarla, al
  borrar la publicación o la cuenta.
- **Respuesta a la pregunta propia**: parte de las respuestas de una solicitud (o de una solicitud que
  espera la identidad), con el texto de la pregunta contestada al lado. Se ve y se borra con las
  respuestas del cuestionario.
- **Solicitud** (ya existe): suma la pregunta contestada y su respuesta, o ninguna.
- **Lo que preguntan quienes publican**: una lectura para quien administra con el conteo de
  publicaciones publicadas hoy con pregunta y los textos de las preguntas, sin la persona ni el animal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quien publica puede sumar, cambiar o sacar la pregunta en el mismo formulario de publicar
  o de editar, sin una pantalla ni un paso más.
- **SC-002**: El 100 % de las solicitudes mandadas a un animal con pregunta llegan con la pregunta
  contestada y su respuesta, y ninguna sale con una respuesta a una pregunta que la persona no vio.
- **SC-003**: Después de cambiar o sacar una pregunta, el 100 % de las solicitudes anteriores muestran
  la pregunta que contestó cada persona, sin cambios.
- **SC-004**: Ninguna pantalla pública, vista previa, texto para el grupo ni contenido para buscadores
  muestra una pregunta; las pruebas de privacidad que intentan leer preguntas, preguntas contestadas o
  respuestas sin permiso fallan todas.
- **SC-005**: Quien administra puede leer, en una sola sección, cuántas publicaciones tienen pregunta y
  qué preguntan, sin ver a nadie ni a ningún animal.
- **SC-006**: Desde el día en que llega la historia, la medición deja comparar las solicitudes con
  pregunta y sin ella en «Pedir más información» como primera respuesta, en el rechazo por «No contestó
  lo que le pregunté» y en el tiempo de respuesta.

## Assumptions

- **El nombre de quien publicó** en el cuestionario es el que muestra hoy su perfil, el mismo que ya
  aparece en la ficha. La historia dice «con mi nombre»; el formato exacto lo deciden los textos. En
  la solicitud no va el nombre: la pregunta contestada se lee como las otras preguntas.
- **La misma pregunta, por texto**: si quien publicó vuelve al texto que la persona contestó, la
  respuesta vale, porque contesta exactamente lo que hoy se pregunta.
- **Publicada hoy**, para Encuestas, es disponible, en proceso, en pausa o vencida. Una adoptada, una
  borrada o una dada de baja por quien administra no se cuenta: ya no recibe solicitudes ni vuelve
  sola. Una camada es una sola publicación, como en la lectura 1.
- **La lista de Encuestas** muestra las preguntas de hoy en orden alfabético y sin fecha: un orden por
  fecha, en una beta de 3 a 5 rescatistas, podría decir de quién es cada una. El texto va como se
  escribió; si nombra al animal, quien administra lo lee igual, porque recortarlo cambiaría lo que
  quien rescata quiso preguntar, que es lo que la sección enseña. Las versiones anteriores de una
  pregunta cambiada no se listan; las respuestas, nunca.
- **La revisión de publicaciones** no cambia: guardar una edición sigue haciendo lo que hace hoy, y la
  pregunta no se muestra en «Publicaciones por revisar», porque ahí iría junto al animal y la decisión
  del 2026-11-18 dice que quien administra la lee sin él. **Riesgo aceptado:** un contacto escrito en
  palabras dentro de la pregunta no lo revisa nadie. Es el mismo que ya tienen las respuestas del
  cuestionario y las preguntas de «Pedir más información», que tampoco se revisan; la pregunta la ve
  solo quien pasó los frenos de siempre con el teléfono verificado, nunca alguien sin sesión, y el
  filtro de teléfonos, correos y enlaces corta el caso común. Quien la lee puede reportar a la persona
  como hoy. Si la beta muestra contactos en palabras, se decide con ese dato.
- **Pregunta sacada mientras se escribe**: la solicitud sale con las respuestas de siempre. La historia
  dice que ya no se pide; frenar el envío para avisar que se fue algo que no hace falta contestar sería
  un paso de más.
- **Lo escrito para una pregunta que cambió** queda a la vista, sin mandarse. Es la lectura de «no
  pierde nada de lo que ya escribió» que respeta el criterio de ver «la pregunta nueva sin contestar».
- **Solicitudes que esperan la identidad**: el cuestionario para dejarla escrita es el mismo (#289,
  FR-004 de esa spec), así que pide la pregunta propia y guarda la pregunta contestada; sale como se
  escribió (regla de la historia).
- **«Llegó antes de tu pregunta»** se muestra cuando la solicitud no tiene respuesta propia y el animal
  tiene una pregunta hoy, también si llegó en un rato en que la pregunta estaba sacada: llegó antes de
  la pregunta que hoy hace quien publicó. En una solicitud cerrada también, porque explica por qué
  falta esa respuesta al releerla.
- **«Mi solicitud»** muestra la pregunta contestada y la respuesta en el lugar de la pregunta, antes de
  «¿Por qué <nombre>?», como en el cuestionario.
- **La medición** suma el sí o el no a los momentos que ya existen; no hay momentos nuevos (decisión del
  2026-11-18 sobre la medición). La que sale sola trae el dato en su momento de solicitud mandada.
- **Dependencias**: #53 (la regla del contacto en la ficha), #59 (en proceso), #63 (cuestionario), #65
  (bandeja y respuestas), #71 y #73 (Encuestas), #205 y #206 (camadas y crías), #289 (solicitud que
  espera la identidad), docs/03 §2, §4, §7 y §Métricas de éxito. Nada nuevo de afuera.
