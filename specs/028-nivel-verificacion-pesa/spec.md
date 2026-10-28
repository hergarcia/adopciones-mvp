# Feature Specification: Saber si el nivel de verificación pesa cuando se elige y cuando se solicita

**Feature Branch**: `feature/236-saber-nivel-verificacion-pesa`

**Created**: 2026-10-28

**Status**: Draft

**Input**: Historia #236 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (en `main`, no se rehace): la medición sin la persona, con la marca de visita
(#9, #169); los momentos de publicar un animal o una camada y de guardar una edición (#53, #59,
#205, #206); el de mirar una ficha, con de dónde llegó (#57); el de tocar «Solicitar», que ya lleva
el nivel de quien lo toca y el nivel que exige el animal, pero no el de quien publicó (#63); los de
mandar una solicitud, aceptar, rechazar con su motivo, preguntar, la primera respuesta con sus
horas, dejar sin efecto una aceptación con su motivo y entregar el animal, a una persona del sitio
o por fuera (#63, #65, #67); el de mirar un perfil público, que ya dice si se llegó navegando el
sitio o desde un enlace de afuera, sin un origen «desde una solicitud» (#12). La chapita de quien
solicitó en la bandeja y en la solicitud, la de quien publicó en la ficha y las adopciones con
seguimiento en el perfil y en la solicitud ya se ven (#12, #65, #69). Ninguno de esos momentos lleva
hoy un nivel de quien publicó ni de quien solicitó, ni si tiene una adopción con seguimiento. Esta
spec suma esos datos a momentos que ya existen y un origen nuevo a la visita de un perfil. No cambia
ninguna pantalla.

**Vocabulario de esta spec**:

- **Nivel**: el de la chapita, como en docs/06 y en la bandeja: 1 teléfono, 2 identidad, 3 aval.
  Quien hoy no tiene el teléfono verificado no tiene chapita, y su nivel es **0**, como ya lo cuenta
  «Solicitar» para quien no tiene sesión o teléfono.
- **El nivel de ahora**: el que la persona tiene en el instante en que pasa el momento, no el que
  tenía al mandar la solicitud ni al publicar.
- **El nivel exigido**: el que pide la publicación para solicitar, 1 o 2.
- **Adopción con seguimiento**: una adopción en la que esa persona fue quien adoptó y respondió el
  seguimiento de los 30 días, la misma que cuenta su perfil y la cabecera de la solicitud (#69). Se
  mide **si tiene al menos una**, sí o no.
- **Un momento** es lo que ya llega a la herramienta de medición cuando pasa algo en el sitio.
  **Sin nivel** quiere decir que el momento llega igual, pero sin ese dato.
- **Quien rescata** es quien publicó; **quien solicitó** es la persona de la solicitud.
- **Llegar desde una solicitud** es abrir el perfil de quien solicitó tocando «Ver su perfil» en la
  pantalla de esa solicitud, del lado de quien publicó.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber qué nivel tiene a quien quien rescata acepta o descarta (Priority: P1)

Carla abre la solicitud de Bruno, que tiene nivel 2, y la acepta. El momento de aceptar y el de la
primera respuesta llegan a la medición con el nivel 2 y sin adopción con seguimiento. Después
rechaza a Ana, que tiene nivel 3 y una adopción con seguimiento, y el rechazo llega con los dos
datos y el motivo que ya llevaba. Cuando entrega el animal a Bruno desde el sitio, la entrega lleva
también su nivel.

**Why this priority**: es la lectura central de la historia. Si los aceptados tienen el mismo nivel
que los rechazados, la verificación es un trámite; si pesa, es el argumento para dejar el grupo
(docs/01 §Huevo y gallina). Con esta parte sola la beta ya puede decir si quien rescata valora la
verificación.

**Independent Test**: con personas sembradas de niveles 1, 2 y 3, con y sin una adopción con
seguimiento, y solicitudes a un animal y a una cría de camada: aceptar, rechazar, preguntar, dejar
sin efecto una aceptación y entregar a una persona del sitio y por fuera; leer en el registro de la
medición los datos de cada momento. Repetir con la medición caída y con el nivel imposible de leer.

**Acceptance Scenarios**:

1. **Dado** que Bruno tiene nivel 2, ninguna adopción con seguimiento y solicitó a Tobi, **cuando**
   Carla acepta su solicitud, **entonces** el momento de aceptar llega con nivel del solicitante 2 y
   sin adopción con seguimiento, y el de la primera respuesta llega con los mismos dos datos.
2. **Dado** que Ana tiene nivel 3 y una adopción con seguimiento en su perfil, **cuando** Carla
   rechaza su solicitud, **entonces** el momento de rechazar llega con nivel 3, con adopción con
   seguimiento y con el motivo que ya llevaba.
3. **Dado** que Carla le pregunta algo a Diego, que tiene nivel 1, **cuando** la pregunta queda
   hecha, **entonces** el momento de preguntar llega con nivel 1 y sin adopción con seguimiento.
4. **Dado** que Carla había aceptado a Bruno, **cuando** deja sin efecto la aceptación, **entonces**
   el momento llega con el nivel de ahora de Bruno, si tiene adopción con seguimiento y el motivo
   que ya llevaba.
5. **Dado** que Carla aceptó a Bruno, **cuando** marca que le entregó a Tobi a él desde el sitio,
   **entonces** el momento de entregar llega con el nivel de ahora de Bruno y si tiene adopción con
   seguimiento.
6. **Dado** que Bruno mandó su solicitud con nivel 1 y después le aprobaron la identidad, **cuando**
   Carla la acepta, **entonces** el momento llega con nivel 2, el de ahora.
7. **Dado** que a Ana le retiraron el aval y bajó a nivel 2, **cuando** Carla le pregunta algo,
   **entonces** el momento de preguntar llega con nivel 2.
8. **Dado** que Carla publicó una camada y Bruno pidió una cría, **cuando** Carla lo acepta,
   **entonces** el momento lleva el nivel de Bruno igual que con cualquier animal, junto a la marca
   de camada que ya llevaba.
9. **Dado** que Carla marca que entregó a Tobi por fuera del sitio, **cuando** confirma,
   **entonces** el momento de entregar llega sin nivel de solicitante y sin el dato de la adopción
   con seguimiento.
10. **Dado** que la herramienta de medición no responde, **cuando** Carla acepta la solicitud de
    Bruno, **entonces** la aceptación se guarda, Bruno ve el contacto como hoy y Carla no ve ningún
    aviso.
11. **Dado** que el nivel de quien solicitó no se puede leer en ese momento, **cuando** Carla lo
    rechaza, **entonces** el rechazo se guarda igual, Carla ve lo mismo que hoy y el momento llega
    sin nivel y sin el dato de la adopción con seguimiento, nunca con uno inventado.
12. **Dado** que Carla toca dos veces «Aceptar», **cuando** termina, **entonces** llega un solo
    momento de aceptar, como hoy, con el nivel.

---

### User Story 2 - Saber si quien adopta busca a rescatistas verificados (Priority: P2)

Alguien sin sesión abre la ficha de Tobi, que publicó Carla con nivel 2: el momento de ver la ficha
llega con el nivel de Carla. Toca «Solicitar» y ese momento también lleva el nivel de Carla. Diego,
que tiene nivel 1, termina el cuestionario y manda la solicitud: el momento de mandar llega con su
nivel, 1, y el de Carla, 2.

**Why this priority**: es la otra mitad de la hipótesis, la de quien adopta. Agrega un dato a tres
momentos que ya forman el embudo de quien quiere adoptar, sin tocar lo que ve nadie.

**Independent Test**: con rescatistas sembradas de niveles 1, 2 y 3 con un animal y una camada a la
vista: abrir cada ficha sin sesión y con sesión, tocar «Solicitar» y mandar una solicitud con
personas de distintos niveles; leer en el registro de la medición el nivel de quien publicó en cada
momento y el de quien solicita al mandar.

**Acceptance Scenarios**:

1. **Dado** que alguien sin sesión abre la ficha de Tobi, que publicó Carla con nivel 2, **cuando**
   la ficha carga, **entonces** el momento de ver la ficha llega con nivel de quien publicó 2.
2. **Dado** que esa persona toca «Solicitar», **cuando** se abre el camino a la solicitud,
   **entonces** el momento de tocar «Solicitar» llega con nivel de quien publicó 2, además de lo que
   ya llevaba.
3. **Dado** que Diego tiene nivel 1 y Carla tiene nivel 2, **cuando** Diego manda una solicitud por
   un animal de Carla, **entonces** el momento de mandar llega con nivel del solicitante 1 y nivel de
   quien publicó 2.
4. **Dado** que alguien abre la ficha de una camada de Carla, o toca «Solicitar» en una de sus
   crías, **cuando** pasa el momento, **entonces** lleva el nivel de Carla, quien publicó la camada.
5. **Dado** que Carla consiguió el aval entre que Diego abrió la ficha y mandó la solicitud,
   **cuando** la manda, **entonces** el momento lleva nivel de quien publicó 3, el de ahora.
6. **Dado** que el nivel de quien publicó no se puede leer, **cuando** se abre la ficha, se toca
   «Solicitar» o se manda la solicitud, **entonces** la persona ve y hace lo mismo que hoy y el
   momento llega sin ese nivel.
7. **Dado** que quien publicó mira su propia ficha, o la pide un lector de vista previa,
   **cuando** carga, **entonces** no se mide, como hoy.

---

### User Story 3 - Contar las veces que quien rescata abre el perfil de quien solicitó (Priority: P3)

Carla está en la solicitud de Bruno y toca «Ver su perfil» para ver quién responde por él. La
visita al perfil de Bruno se cuenta como llegada desde una solicitud, aparte de llegar navegando o
desde un enlace.

**Why this priority**: es la única señal de que quien rescata fue a mirar quién responde por esa
persona antes de decidir. Suma una lectura a las otras dos, pero no las necesita.

**Independent Test**: con una solicitud sembrada: tocar «Ver su perfil» desde la pantalla de la
solicitud del lado de quien publicó, abrir el mismo perfil navegando el sitio, desde una dirección
pegada y con la dirección que deja «Ver su perfil» pegada en otra pestaña; leer el origen de cada
visita en el registro de la medición.

**Acceptance Scenarios**:

1. **Dado** que Carla está en la solicitud de Bruno, **cuando** toca «Ver su perfil», **entonces**
   la visita al perfil de Bruno se cuenta como llegada desde una solicitud.
2. **Dado** que Carla abre el perfil de Bruno desde un enlace que le mandaron por WhatsApp,
   **cuando** carga, **entonces** la visita se cuenta como llegada desde un enlace, no desde una
   solicitud.
3. **Dado** que Carla llega al perfil de Bruno navegando el sitio por otro camino, **cuando** carga,
   **entonces** la visita se cuenta como llegada desde el sitio, como hoy.
4. **Dado** que alguien pega en otra pestaña la dirección que abrió «Ver su perfil», **cuando**
   carga, **entonces** la visita se cuenta como llegada desde un enlace.
5. **Dado** que Carla llegó al perfil desde la solicitud, **cuando** mira la dirección o lo que
   llega a la medición, **entonces** no encuentra qué solicitud, qué animal ni quién la mandó.
6. **Dado** que Bruno borró su cuenta o lo suspendieron después de mandar la solicitud, **cuando**
   Carla toca «Ver su perfil» y ve que no existe, **entonces** no se mide ninguna visita, como hoy.

---

### User Story 4 - Saber qué parte de las publicaciones pide nivel 2 (Priority: P4)

Carla publica a Tobi pidiendo nivel 2: el momento de publicar llega con nivel exigido 2. Cuando
edita la descripción y guarda, el momento de editar llega con nivel exigido 2, el que sigue
teniendo. Una camada de cinco crías que pide nivel 1 llega una sola vez con nivel exigido 1.

**Why this priority**: es el dato más simple y responde una sola pregunta, cuántos rescatistas
piden identidad. No depende de las otras partes.

**Independent Test**: publicar un animal y una camada pidiendo cada nivel, editar cambiando y sin
cambiar el nivel; leer el nivel exigido en cada momento.

**Acceptance Scenarios**:

1. **Dado** que Carla publica a Tobi pidiendo nivel 2, **cuando** termina de publicar, **entonces**
   el momento de publicar llega con nivel exigido 2.
2. **Dado** que Carla publica una camada de cinco crías pidiendo nivel 1, **cuando** termina,
   **entonces** llega un solo momento de publicar con nivel exigido 1.
3. **Dado** que Carla edita a Tobi y solo cambia la descripción, **cuando** guarda, **entonces** el
   momento de editar llega con nivel exigido 2, el que sigue teniendo.
4. **Dado** que Carla edita a Tobi y pasa de pedir nivel 2 a pedir nivel 1, **cuando** guarda,
   **entonces** el momento de editar llega con nivel exigido 1.
5. **Dado** que Carla edita una camada, **cuando** guarda, **entonces** el momento de editar llega
   con el nivel exigido de la camada después de guardar.

---

### Edge Cases

- **Quien solicitó perdió el teléfono verificado** (otra cuenta recuperó el número, o tiene un
  cambio de número a medias): no tiene chapita, y el momento llega con nivel 0, el mismo que ve
  quien rescata. No es «sin nivel», que queda para cuando el nivel no se pudo leer.
- **Quien solicitó está suspendida o borró su cuenta** entre que mandó la solicitud y la respuesta:
  responder ya se comporta como hoy; si el momento llega, lleva lo que se lea en ese instante, y una
  cuenta suspendida o borrada no muestra adopciones con seguimiento, así que el dato es «no». Si no
  hay persona que leer, el momento llega sin nivel.
- **La adopción con seguimiento de quien solicitó la dio la misma persona que ahora responde**:
  cuenta igual; el dato es lo que muestra el perfil, no de quién vino.
- **Una adopción en la que quien solicitó fue quien dio el animal** no cuenta: el dato es de las
  que adoptó, como la cabecera de la solicitud.
- **Aceptar dos veces, reintentar después de un corte o responder desde dos pestañas**: llega un
  solo momento, como hoy, porque el segundo intento no vuelve a medir.
- **Entregar el animal a una persona que dejó de estar aceptada mientras tanto**: la entrega no se
  hace, como hoy, y no llega ningún momento.
- **Una cría entregada a una persona del sitio** lleva el nivel de esa persona, como un animal.
- **«Solicitar» sin sesión** lleva el nivel de quien publicó igual; el de quien lo toca sigue siendo
  0, como hoy.
- **Una ficha que deja de estar a la vista** (pausada, vencida, dada de baja) no se mide, como hoy.
- **El momento de una edición que no llegó a guardarse** no existe, como hoy.
- **Leer el nivel falla a mitad de una acción**: responder, publicar, entregar, mirar o solicitar
  terminan igual y la persona ve lo mismo que hoy; el momento sale sin ese dato.

## Requirements *(mandatory)*

### Functional Requirements

#### Quien rescata elige

- **FR-001**: Al aceptar una solicitud, el momento de aceptar DEBE llevar el nivel de ahora de quien
  solicitó y si en su perfil figura al menos una adopción con seguimiento.
- **FR-002**: Al rechazar una solicitud, el momento de rechazar DEBE llevar esos dos datos además del
  motivo que ya lleva.
- **FR-003**: Al preguntar algo en una solicitud, el momento de preguntar DEBE llevar esos dos datos.
- **FR-004**: Cuando aceptar, rechazar o preguntar es la primera respuesta a una solicitud, el
  momento de la primera respuesta DEBE llevar los mismos dos datos que el momento de esa respuesta.
- **FR-005**: Al dejar sin efecto una aceptación, el momento DEBE llevar esos dos datos además del
  motivo que ya lleva.
- **FR-006**: Al marcar que el animal o la cría se entregó a una persona del sitio, el momento de
  entregar DEBE llevar el nivel de ahora de esa persona y si tiene al menos una adopción con
  seguimiento. Entregar por fuera del sitio NO DEBE llevar ninguno de los dos.

#### Quien adopta busca

- **FR-007**: El momento de ver una ficha, de un animal o de una camada, DEBE llevar el nivel de
  ahora de quien publicó.
- **FR-008**: El momento de tocar «Solicitar» DEBE llevar el nivel de ahora de quien publicó, con o
  sin sesión, además de lo que ya lleva. En una cría es el de quien publicó la camada.
- **FR-009**: El momento de mandar una solicitud DEBE llevar el nivel de ahora de quien la manda y el
  de quien publicó.

#### El perfil desde la solicitud

- **FR-010**: Abrir el perfil de quien solicitó con «Ver su perfil» desde la pantalla de esa
  solicitud, del lado de quien publicó, DEBE contar la visita como llegada desde una solicitud.
- **FR-011**: Llegar al mismo perfil navegando el sitio por otro camino DEBE seguir contando como
  llegada desde el sitio, y llegar desde afuera, también con la dirección que dejó «Ver su perfil»
  pegada en otra pestaña o mandada a otra persona, DEBE seguir contando como llegada desde un enlace.
- **FR-012**: Lo que marca que se llegó desde una solicitud NO DEBE decir cuál solicitud, qué animal
  ni quién la mandó, ni en la dirección ni en la medición.
- **FR-013**: Las visitas que hoy no se miden (la dueña mirando el suyo, una vista previa, quien
  vuelve de su propia acción, el «no existe») NO DEBEN empezar a medirse.

#### Lo que pide la publicación

- **FR-014**: El momento de publicar un animal o una camada DEBE llevar el nivel exigido, 1 o 2. Una
  camada DEBE llevarlo una sola vez, en el único momento de publicar que ya manda.
- **FR-015**: El momento de guardar una edición, de un animal o de una camada, DEBE llevar el nivel
  exigido después de guardar, haya cambiado o no.

#### Reglas de todos los momentos

- **FR-016**: El nivel medido DEBE ser el de la chapita en el instante del momento: 1, 2 o 3, y 0
  para quien hoy no tiene el teléfono verificado. NUNCA el que tenía antes.
- **FR-017**: El dato de la adopción con seguimiento DEBE ser solo sí o no, según lo que muestra el
  perfil de esa persona en ese instante, NUNCA cuántas.
- **FR-018**: Si el nivel o el dato de la adopción con seguimiento no se pueden leer, el momento
  DEBE llegar sin ese dato, NUNCA con uno inventado ni con un valor por defecto que parezca un nivel.
- **FR-019**: Medir NUNCA DEBE cambiar lo que la persona hace ni lo que ve: si la medición no está,
  no responde o el nivel no se puede leer, publicar, editar, responder, entregar, mirar una ficha,
  tocar «Solicitar», solicitar y abrir un perfil DEBEN funcionar igual y sin ningún aviso nuevo.
- **FR-020**: Ningún momento de esta historia DEBE llevar quién, qué animal, qué camada, qué
  solicitud, un texto, un nombre, un teléfono ni la cuenta de nadie: solo el número del nivel, el sí
  o no y de dónde llegó, como el resto de la medición (docs/03 §7).
- **FR-021**: Los momentos que hoy se mandan una sola vez (un doble toque, un reintento, una camada)
  DEBEN seguir mandándose una sola vez.
- **FR-022**: Ninguna pantalla DEBE cambiar, y en el sitio NO DEBE guardarse nada nuevo de ninguna
  persona.
- **FR-023**: Los momentos de quien administra, el listado y la portada NO DEBEN sumar ningún nivel.

#### Cómo se lee

- **FR-024**: docs/03 §Métricas de éxito, «Cómo se leen», DEBE sumar la lectura «¿pesa la
  verificación cuando se elige?» con lo que dice la sección Medición de la historia: la parte de
  cada nivel en las solicitudes mandadas contra la de las aceptadas y las rechazadas, la parte de
  las publicaciones que pide nivel 2, cuántas solicitudes terminan con el perfil abierto desde la
  solicitud, la parte de las fichas vistas de rescatistas de cada nivel que termina en «Solicitar» y
  en una solicitud mandada, y que con 3 a 5 rescatistas los números se leen como señal y no como
  prueba.

### Key Entities

- **Nivel medido**: un número, 0 a 3 para una persona y 1 o 2 para lo que exige una publicación.
  Viaja con el momento y no se guarda en el sitio.
- **Adopción con seguimiento (sí o no)**: un sí o un no de quien solicitó, leído en el instante del
  momento. Viaja con el momento y no se guarda en el sitio.
- **Origen de la visita a un perfil**: desde el sitio, desde un enlace o, nuevo, desde una
  solicitud.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas, cada momento de aceptar, rechazar, preguntar, primera
  respuesta, dejar sin efecto y entregar a una persona del sitio llega con el nivel de ahora de quien
  solicitó y el sí o no de su adopción con seguimiento, o sin ellos cuando no se pudieron leer.
- **SC-002**: En el 100 % de las pruebas, cada momento de ver una ficha, tocar «Solicitar» y mandar
  una solicitud llega con el nivel de ahora de quien publicó, y el de mandar también con el de quien
  solicita.
- **SC-003**: En el 100 % de las pruebas, cada momento de publicar y de guardar una edición llega con
  el nivel exigido después de guardar, y una camada manda un solo momento de publicar.
- **SC-004**: En el 100 % de las pruebas, la visita al perfil desde «Ver su perfil» de la solicitud
  cuenta como llegada desde una solicitud, y ninguna llegada desde afuera cuenta así.
- **SC-005**: En el 100 % de las pruebas con la medición caída o con el nivel imposible de leer, la
  acción se completa y la persona ve exactamente lo mismo que sin la falla.
- **SC-006**: Revisando cualquier momento de esta historia no se encuentra el nombre, el teléfono,
  el animal, la camada, la solicitud ni la cuenta de nadie, ni una cantidad de adopciones.
- **SC-007**: Con los datos de la beta, alguien del equipo puede contestar en la herramienta de
  medición, sin otra fuente, si las solicitudes aceptadas tienen más nivel 2 y 3 que las mandadas,
  siguiendo lo que dice docs/03 §Métricas de éxito.

## Assumptions

- **Nivel 0**: quien hoy no tiene el teléfono verificado no tiene chapita y se mide con 0, como ya
  lo hace «Solicitar». La historia nombra 1, 2 y 3 porque son los de la chapita; medir «sin nivel»
  para esa persona confundiría a quien no tiene chapita con un nivel que no se pudo leer, que la
  historia separa («nunca con uno inventado»).
- **«Preguntar»** es el momento en que quien publicó le hace una pregunta a quien solicitó. Que quien
  solicitó conteste la pregunta no lleva nivel: lo hace quien adopta y no es una elección de quien
  rescata.
- **La adopción con seguimiento** es una en la que quien solicitó adoptó y respondió el seguimiento,
  la misma cuenta que muestran su perfil y la cabecera de la solicitud (#69). Las que dio como
  rescatista no cuentan. Una cuenta suspendida no muestra ninguna, así que se mide «no».
- **El nivel de quien publicó en la ficha** es el que ya muestra la ficha. En una camada es el de
  quien publicó la camada, que es la misma persona que publica cada cría.
- **Llegar desde una solicitud** pide las dos cosas: haber tocado «Ver su perfil» en la solicitud y
  haber llegado navegando el sitio. La dirección pegada en otra pestaña o mandada por WhatsApp cuenta
  como desde un enlace, aunque la haya abierto «Ver su perfil», como pide el caso borde de WhatsApp.
- **Solo «Ver su perfil» de la pantalla de una solicitud** cuenta como desde una solicitud. Otros
  caminos a ese perfil (la lista de solicitudes de un animal, «¿A quién se lo diste?») siguen
  contando como hoy: la historia nombra solo ese.
- **El nivel exigido de una edición** es el que queda guardado; si la edición no se guarda, no hay
  momento, como hoy.
- **Entregar a una persona del sitio** lleva el nivel de quien recibió el animal, que es una de las
  aceptadas; la historia dice «a una persona del sitio» y la regla del nivel de ahora vale igual.
- **No hay un período de corte**: los momentos empiezan a llevar estos datos el día que llega esta
  historia; lo anterior queda sin ellos, y antes de la beta solo usa el sitio el equipo (docs/03
  §Métricas de éxito: se mira desde que abre la beta).
- **Las referencias «docs/03 §Hipótesis», «docs/03 §7», «docs/03 §Métricas de éxito», «docs/01 §Huevo
  y gallina» y «docs/05»** del cuerpo de la historia son referencias a documentos de producto.
- **Las decisiones del enjambre de la historia** (las cuatro del 2026-10-28, product-owner) van, palabra
  por palabra, a docs/03 en esta rama: la primera y la cuarta a §Métricas de éxito, la segunda y la
  tercera a §7, como dice cada una.
