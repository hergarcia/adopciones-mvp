# Feature Specification: Dejar escrita la solicitud mientras revisan mi identidad, y que salga sola al aprobarse

**Feature Branch**: `feature/289-dejar-escrita-solicitud-identidad`

**Created**: 2026-11-02

**Status**: Draft

**Input**: Historia #289 del backlog. El cuerpo verbatim de la historia acompaña a esta spec
(`story.md`). Ya en `main` de esta historia: nada.

**Ya construido** (en `main`, no se rehace): «Quiero adoptar» con su orden de frenos y la pantalla que
dice que un animal o una cría pide identidad verificada, con «Mandaste tu pedido de identidad el …»
cuando el pedido está en revisión (#63, #206); el cuestionario con sus reglas, las respuestas
propuestas de la vez anterior y el reintento que no pierde lo escrito (#63); el límite de 3
solicitudes activas con la pantalla que deja retirar una (#63, #206); «Mis solicitudes» con sus dos
grupos, sus sellos y sus motivos de cierre (#63, #65); la bandeja de quien publicó, el correo de
solicitud nueva con su regla de no repetirse y el tiempo de respuesta (#65); los cierres por animal
adoptado, borrado o dado de baja, por bloqueo y por suspensión (#13, #65, #67); el pedido de
verificación de identidad con su revisión a mano, su vencimiento a los 7 días, su tope de 3
rechazados en 30 días y sus tres correos de resultado (#11); la identidad pedida por quien publicó
(#257); los números de «Mis animales» (#269); la lectura 2 de docs/03 §Métricas de éxito. Revisado en
`main` (c84b2f0): ninguna pantalla, correo ni tarea guarda una solicitud antes de que la persona
tenga la identidad aprobada. Esta spec suma eso y no cambia cómo se revisa la identidad, el
cuestionario ni lo que ve quien publicó de una solicitud que ya le llegó.

**Vocabulario de esta spec**:

- **Pedido en revisión**: el pedido de verificación de identidad que la persona mandó y que todavía
  no se aprobó, no se rechazó, no venció ni se retiró.
- **Solicitud que espera**: la que la persona dejó escrita con el pedido en revisión y todavía no le
  llegó a quien publicó. En «Mis solicitudes» lleva el sello «Espera tu identidad».
- **Salir**: el momento en que una solicitud que espera se convierte en una solicitud como cualquier
  otra y le llega a quien publicó.
- **No salir**: el final de una solicitud que espera sin haber salido. Queda en «Cerradas y
  retiradas» con el sello «No salió» y su motivo.
- **El plazo**: 14 días contados desde el momento en que se dejó escrita. **El último día** es el día
  del calendario uruguayo en que se cumple.
- **Recibe solicitudes**: lo que hoy decide si a un animal o a una cría se le puede mandar una
  solicitud; «en pausa o vencido» incluye cualquier estado que hoy deja a un animal «no disponible
  por ahora» y vuelve solo.
- **Nivel 2**: el teléfono verificado y la identidad aprobada, como hoy.
- En los ejemplos, Bruno quiere adoptar y tiene solo el teléfono verificado; Carla publicó a Tobi, que
  pide identidad verificada; Rita publicó la camada de Luna, que también la pide.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dejar escrita la solicitud mientras revisan la identidad (Priority: P1)

Bruno mandó la cédula y la selfie hace un rato. Abre a Tobi, toca «Quiero adoptar» y ve que Tobi pide
identidad verificada, que su pedido está en revisión desde hoy y, abajo, «Dejar escrita mi
solicitud», con una línea que dice que sale sola cuando aprueben su identidad y que hasta entonces
Carla no la ve. Contesta el cuestionario de siempre, toca «Dejarla lista» y la confirmación le dice
que sale sola. En «Mis solicitudes», Tobi figura entre las activas con el sello «Espera tu
identidad» y cuenta en «1 de 3 solicitudes activas». Carla no ve nada.

**Why this priority**: es lo que saca la vuelta: la persona escribe en el momento, como en el grupo
de Facebook. Sin esto no hay nada que salga solo. Esta parte sola ya guarda lo escrito, lo muestra y
lo esconde de quien publicó.

**Independent Test**: con personas sembradas (una con el teléfono verificado y el pedido en
revisión, otra que publicó un animal y una camada que piden identidad), recorrer la pantalla de
identidad pedida, dejar escrita una solicitud, verla en «Mis solicitudes», retirarla, chocar con el
límite y con una que ya existe, cortar la conexión al confirmar, y entrar como quien publicó para
comprobar que no ve nada en ninguna pantalla ni en sus números.

**Acceptance Scenarios**:

1. **Dado** que Bruno mandó su pedido de identidad y abre a Tobi, que pide identidad verificada,
   **cuando** toca «Dejar escrita mi solicitud», contesta el cuestionario y toca «Dejarla lista»,
   **entonces** ve que sale sola cuando aprueben su identidad, y en «Mis solicitudes» Tobi figura
   entre las activas como «Espera tu identidad», contando en «1 de 3 solicitudes activas».
2. **Dado** que Bruno dejó escrita una solicitud para Tobi, **cuando** Carla abre «Solicitudes
   recibidas», la lista de solicitudes de Tobi o «Mis animales», **entonces** no la ve, no sabe que
   existe y los números de Tobi no cambian.
3. **Dado** que Bruno no tiene un pedido de identidad en revisión (nunca mandó uno, se lo rechazaron,
   venció o lo retiró), **cuando** abre a Tobi y toca «Quiero adoptar», **entonces** no ve «Dejar
   escrita mi solicitud», solo el camino a verificar su identidad, como hoy.
4. **Dado** que Bruno ya tiene 3 solicitudes activas, contando las que esperan, **cuando** quiere
   dejar escrita otra, **entonces** lo frena el límite de siempre, que lista también las que esperan
   y deja retirar cualquiera; al retirar una sigue con el cuestionario.
5. **Dado** que Bruno ya dejó escrita una solicitud para Tobi, **cuando** vuelve a tocar «Quiero
   adoptar» en Tobi, **entonces** en lugar de «Dejar escrita mi solicitud» la pantalla dice que su
   solicitud espera su identidad y lo lleva a «Mis solicitudes», y no se crea una segunda.
6. **Dado** que Bruno ya tiene una solicitud mandada para Tobi, **cuando** toca «Quiero adoptar»,
   **entonces** ve la que tiene, como hoy, y no puede dejar otra escrita.
7. **Dado** que se corta la conexión al tocar «Dejarla lista», **cuando** Bruno reintenta,
   **entonces** queda una sola solicitud esperando y lo escrito no se pierde.
8. **Dado** que la identidad de Bruno se aprueba mientras escribe el cuestionario, **cuando** toca
   «Dejarla lista», **entonces** la solicitud se manda como siempre, le llega a Carla en ese momento
   y Bruno ve la confirmación de una solicitud mandada.
9. **Dado** que Bruno dejó escrita una solicitud para Tobi, **cuando** toca «Retirar» en «Mis
   solicitudes» y confirma, **entonces** deja de estar entre las activas, libera su lugar y figura en
   «Cerradas y retiradas» como «No salió», con el motivo de que la retiró.
10. **Dado** que Bruno dejó escrita una solicitud para Tobi y después quiere otra para una cría de la
    camada de Luna, **cuando** abre la cría y sigue el mismo camino, **entonces** puede dejarla
    escrita también, cada una ocupa su lugar, y el cuestionario le propone las respuestas de la que
    dejó escrita para Tobi, salvo «por qué este animal».

---

### User Story 2 - Que salga sola al aprobarse la identidad (Priority: P2)

Dos días después, quien administra aprueba la identidad de Bruno. Sus solicitudes para Tobi y para la
cría de Luna pasan en ese momento a «Esperando respuesta» con la fecha de ese día. Carla y Rita las
reciben como cualquier otra, con el correo de solicitud nueva cuando corresponde. El correo de
identidad aprobada le dice a Bruno que le llegaron a quien publicó y lo lleva a «Mis solicitudes».

**Why this priority**: es la promesa de la historia: no tener que acordarse de volver. Depende de la
parte 1, que guarda lo escrito.

**Independent Test**: con una persona sembrada con solicitudes que esperan para un animal y para una
cría (y otra para un animal en pausa), aprobar su identidad desde la revisión; mirar «Mis
solicitudes», la bandeja y la solicitud de cada rescatista, el correo de identidad aprobada y el de
solicitud nueva; reanudar el animal en pausa dentro del plazo y ver que sale ese día, y en otro caso
dejar pasar el plazo sin reanudarlo.

**Acceptance Scenarios**:

1. **Dado** que Bruno dejó escritas solicitudes para Tobi y para una cría de la camada de Luna,
   **cuando** aprueban su identidad, **entonces** las dos pasan a «Esperando respuesta» con la fecha
   de ese día, el correo de identidad aprobada dice que le llegaron a quien publicó y lleva a «Mis
   solicitudes», y cada rescatista recibe la solicitud como cualquier otra.
2. **Dado** que la solicitud de Bruno para Tobi salió, **cuando** Carla la abre, **entonces** la ve
   con la fecha en que salió, en la bandeja figura como nueva, y el tiempo de respuesta se cuenta
   desde ese momento.
3. **Dado** que Carla ya tiene solicitudes nuevas sin abrir de Tobi, **cuando** sale la de Bruno,
   **entonces** no le llega otro correo de solicitud nueva, con la regla de siempre; si no tenía,
   le llega.
4. **Dado** que aprueban la identidad de Bruno cuando Tobi está en pausa, **cuando** Carla lo reanuda
   dentro del plazo, **entonces** la solicitud sale ese día; si no lo reanuda, no sale.
5. **Dado** que aprueban la identidad de Bruno cuando Tobi está en pausa, **cuando** Bruno abre «Mis
   solicitudes», **entonces** Tobi sigue entre las activas, con el sello de no disponible por ahora y
   la línea de que sale cuando Tobi vuelva a recibir solicitudes, hasta el último día; el correo de
   identidad aprobada nombra a Tobi y dice hasta qué día espera.
6. **Dado** que la solicitud de Bruno salió, **cuando** Carla la acepta, **entonces** recién ahí se
   revela el contacto de los dos, como en cualquier solicitud.
7. **Dado** que Carla dejó de pedir identidad para Tobi mientras la solicitud de Bruno esperaba,
   **cuando** pasa el tiempo sin que aprueben la identidad, **entonces** la solicitud sigue esperando
   la aprobación: no sale antes.

---

### User Story 3 - Lo que pasa cuando no sale (Priority: P3)

A Bruno le rechazan la cédula por una foto borrosa. El correo del rechazo nombra a Tobi y dice hasta
qué día puede mandar las fotos de nuevo para que su solicitud salga. En «Mis solicitudes», Tobi sigue
como «Espera tu identidad», con el último día a la vista. Si pasan los 14 días sin una identidad
aprobada, o Tobi se adopta, la solicitud figura como «No salió», con el motivo, sin las respuestas, y
deja de ocupar un lugar.

**Why this priority**: sin esto una solicitud podría quedar ocupando un lugar para siempre o guardar
respuestas que ya no sirven. Es menos frecuente que el camino feliz y depende de las partes 1 y 2.

**Independent Test**: con personas sembradas con solicitudes que esperan, rechazar la identidad,
dejar vencer el pedido, llegar al tope de rechazos, adoptar, borrar o dar de baja el animal, bloquear
en los dos sentidos, suspender la cuenta y dejar pasar los 14 días; en cada caso mirar «Mis
solicitudes», el lugar ocupado, que las respuestas ya no estén guardadas y que a quien publicó no le
llegue nada si después se aprueba la identidad.

**Acceptance Scenarios**:

1. **Dado** que rechazaron la identidad de Bruno y su solicitud para Tobi la escribió hace 3 días,
   **cuando** abre «Mis solicitudes», **entonces** sigue como «Espera tu identidad», dice hasta qué
   día puede mandar las fotos de nuevo para que salga, y el correo del rechazo dice lo mismo.
2. **Dado** que el pedido de Bruno venció sin revisarse, **cuando** le llega el correo del
   vencimiento, **entonces** nombra a Tobi y dice hasta qué día espera; si manda un pedido nuevo y se
   aprueba dentro del plazo, la solicitud sale.
3. **Dado** que la solicitud de Bruno para Tobi espera, **cuando** pasan 14 días desde que la
   escribió sin que se apruebe su identidad, **entonces** no sale, figura en «Cerradas y retiradas»
   como «No salió» y ya no ocupa un lugar.
4. **Dado** que la solicitud de Bruno para Tobi espera y Tobi se adopta, **cuando** Bruno abre «Mis
   solicitudes», **entonces** figura como «No salió» con «Tobi encontró hogar.», y si después aprueban
   su identidad no le llega nada a Carla.
5. **Dado** que la solicitud de Bruno espera y Carla lo bloquea, **cuando** Bruno abre «Mis
   solicitudes», **entonces** figura como «No salió» con el motivo de que Tobi ya no recibe
   solicitudes, nunca que lo bloquearon.
6. **Dado** que Bruno llegó al tope de 3 pedidos de identidad rechazados en 30 días, **cuando** abre
   «Mis solicitudes», **entonces** las que esperaban figuran como «No salió» y ya no ocupan lugar, y
   el correo de ese rechazo dice que no van a salir.
7. **Dado** que una solicitud de Bruno no salió, **cuando** la mira en «Cerradas y retiradas»,
   **entonces** ve el animal, el día y el motivo, y sus respuestas ya no están guardadas en ningún
   lado.

---

### User Story 4 - Medir lo que pasa con las solicitudes que esperan (Priority: P4)

Quien lee la medición puede ver, de las veces que se le ofreció a alguien dejar escrita la solicitud,
cuántas se dejaron, cuántas salieron y por qué no salió el resto, y comparar la lectura 2 antes y
después del día en que llega esta historia, con las que salieron solas marcadas aparte.

**Why this priority**: no cambia nada de lo que ve una persona; lo necesita la hipótesis para leer si
la espera de la revisión es la que se lleva a la gente.

**Independent Test**: recorrer las partes 1 a 3 con la medición en modo de prueba y comprobar que
llegan los momentos con sus datos, sin la persona ni el animal, y que la lectura nueva está escrita
en docs/03 §Métricas de éxito.

**Acceptance Scenarios**:

1. **Dado** que a Bruno se le ofrece dejar escrita la solicitud, **cuando** se lee la medición,
   **entonces** el freno por identidad de esa visita dice que se le ofreció.
2. **Dado** que Bruno deja escrita una solicitud, **cuando** se lee la medición, **entonces** llega
   un momento de solicitud que espera la identidad, sin la persona ni el animal.
3. **Dado** que la solicitud sale sola, **cuando** se lee la medición, **entonces** llega el momento
   de que salió sola y la solicitud cuenta como mandada después de la identidad, marcada aparte de
   las que se mandan al volver.
4. **Dado** que una solicitud no sale, **cuando** se lee la medición, **entonces** llega el momento de
   que no salió con su motivo: el plazo, la retiró, el animal dejó de recibir, el tope de rechazos o
   la cuenta suspendida.

---

### Edge Cases

- **El pedido se rechaza mientras escribe**: si Bruno toca «Dejarla lista» cuando ya no tiene un
  pedido en revisión ni la identidad aprobada, no se guarda nada; ve que Tobi pide identidad
  verificada y el camino a verificarla, y sus respuestas siguen en la pantalla.
- **El animal deja de recibir mientras escribe**: si Tobi se pausa, vence, se adopta o se da de baja
  antes de tocar «Dejarla lista», pasa lo mismo que hoy al mandar una solicitud a un animal en ese
  estado; no se guarda nada.
- **Un animal que no recibe por ahora al escribir**: con Tobi en pausa o vencido no se ofrece dejarla
  escrita; la ficha lo explica, como hoy.
- **Un animal en proceso**: se puede dejar escrita, con el aviso de siempre de que quien publicó ya
  avanza con otra persona; al aprobarse sale como cualquier otra.
- **Aprobación sin teléfono**: si la identidad se aprueba mientras Bruno está cambiando de número, no
  tiene nivel 2 y la solicitud sigue esperando; sale cuando confirma el número nuevo, dentro del
  plazo. Mientras tanto figura como «Espera tu identidad».
- **Quien publicó pierde el teléfono verificado**: el animal deja de recibir solicitudes por ahora;
  la solicitud sigue esperando como con una pausa y sale si vuelve a recibir dentro del plazo.
- **Quien solicitó bloquea a quien publicó**: la solicitud no sale y figura como «No salió» con el
  motivo de siempre de un bloqueo propio.
- **Quien publicó es suspendido o borra su cuenta**: la solicitud no sale y figura como «No salió»
  con el motivo de siempre de una publicación que terminó.
- **Quien solicitó borra su cuenta**: sus solicitudes que esperan desaparecen con ella.
- **Una cría que se quita de la camada o se adopta**: igual que un animal borrado o adoptado.
- **El último día**: si la identidad se aprueba antes de que se cumplan los 14 días, sale; un minuto
  después, ya no. La fecha que se muestra es la del calendario uruguayo.
- **Aprobación y retiro al mismo tiempo**: gana uno solo; nunca le llega a quien publicó una
  solicitud que la persona retiró.
- **Aprobación y adopción al mismo tiempo**: gana uno solo; si el animal ya está adoptado, no sale.
- **La regla del correo con varias que salen juntas**: si en una misma aprobación salen dos
  solicitudes para animales distintos de la misma rescatista, cada animal sigue su propia regla de
  correo de solicitud nueva.
- **Un animal ya rechazado**: si Bruno ya tuvo una solicitud no aceptada para Tobi, no puede dejar
  otra escrita, como hoy no puede mandar otra.
- **Una que no salió no frena volver a intentar**: con una solicitud que no salió para Tobi, Bruno
  puede volver a dejar una escrita o mandar una cuando tenga la identidad.
- **Retirar justo cuando sale**: si la solicitud salió entre que Bruno abrió «Mis solicitudes» y
  confirmó el retiro, no se retira a ciegas: ve que ya le llegó a quien publicó y la encuentra como
  una solicitud mandada, que puede retirar como cualquier otra. Si ya no salió, ve que ya estaba
  cerrada. Si se corta la conexión, ve que no se pudo y puede reintentar.
- **La confirmación no carga**: si la solicitud quedó guardada pero la confirmación no se puede
  mostrar, la pantalla dice que quedó guardada y lleva a «Mis solicitudes», como hoy con una
  solicitud mandada.
- **Sin solicitudes**: «Mis solicitudes» muestra el estado vacío de siempre. Cargando y con error,
  «Mis solicitudes» y la pantalla del límite se ven como hoy.
- **Un correo que falla**: si el correo de resultado de la identidad no sale, las solicitudes salen
  igual; la persona lo ve en «Mis solicitudes».
- **No se puede leer el estado de la identidad al dibujar la pantalla**: la pantalla de identidad
  pedida se muestra como hoy sin la opción de dejarla escrita.

## Requirements *(mandatory)*

### Functional Requirements

**Dejarla escrita**

- **FR-001**: La pantalla que dice que un animal o una cría pide identidad verificada MUST ofrecer
  «Dejar escrita mi solicitud», debajo de «Mandaste tu pedido de identidad el …», solo cuando la
  persona tiene el teléfono verificado y un pedido en revisión, con una línea que dice que sale sola
  cuando aprueben la identidad y que hasta entonces quien publicó no la ve.
- **FR-002**: Sin un pedido en revisión, la pantalla MUST verse como hoy, sin la opción.
- **FR-003**: Con una solicitud que espera para ese animal o esa cría, la pantalla MUST decir que
  espera la identidad y llevar a «Mis solicitudes» en lugar de ofrecer la opción.
- **FR-004**: El cuestionario para dejarla escrita MUST tener las mismas preguntas, reglas,
  respuestas propuestas y reintento que el de siempre; el botón MUST decir «Dejarla lista» y arriba
  MUST haber una línea que dice que sale sola cuando aprueben la identidad.
- **FR-005**: Dejarla escrita MUST controlar, en el mismo momento y como al mandar una solicitud, que
  el animal recibe solicitudes, que no hay bloqueo entre las dos personas, que no hay otra solicitud
  activa ni otra que espera para el mismo animal, que no hubo una no aceptada para él, el límite de
  3 y el teléfono verificado; y MUST exigir un pedido en revisión.
- **FR-006**: Si al tocar «Dejarla lista» la persona ya tiene nivel 2, la solicitud MUST mandarse como
  siempre y mostrar la confirmación de una solicitud mandada.
- **FR-007**: Reintentar después de un corte MUST dejar una sola solicitud que espera, y lo escrito
  MUST seguir en la pantalla mientras no se guardó.
- **FR-008**: Al dejarla escrita, la confirmación MUST decir que sale sola cuando aprueben la
  identidad y llevar a «Mis solicitudes».
- **FR-009**: Las respuestas propuestas MUST tomar también las de una solicitud que espera, si es la
  última que la persona escribió, con la misma regla de siempre («por qué este animal» no se
  propone).

**El lugar y «Mis solicitudes»**

- **FR-010**: Una solicitud que espera MUST ocupar uno de los 3 lugares de solicitudes activas desde
  que se deja escrita hasta que sale (desde ahí ocupa el suyo como cualquier otra) o no sale.
- **FR-011**: La pantalla del límite MUST listar también las solicitudes que esperan, con su sello, y
  dejar retirarlas como a las demás.
- **FR-012**: «Mis solicitudes» MUST mostrar cada solicitud que espera entre las activas, con el
  sello «Espera tu identidad», el día en que se escribió y «Retirar», ordenada por ese día junto a
  las demás; MUST sumar en el conteo de activas, ahí y en cada lugar donde hoy se cuentan.
- **FR-013**: Cuando la persona no tiene un pedido en revisión ni la identidad aprobada (se lo
  rechazaron, venció o lo retiró), cada solicitud que espera MUST mostrar el último día y que mandar las fotos de nuevo antes
  de ese día hace que salga, con el camino a verificar la identidad.
- **FR-014**: Cuando la persona ya tiene nivel 2 y la solicitud espera porque el animal no recibe
  solicitudes por ahora, MUST mostrar el sello de no disponible por ahora y que sale cuando el animal
  vuelva a recibir solicitudes, hasta el último día.
- **FR-015**: Retirar una solicitud que espera MUST pedir confirmación, liberar su lugar y dejarla en
  «Cerradas y retiradas» como «No salió», con el motivo de que la retiró.
- **FR-016**: Una solicitud que espera MUST NOT tener una pantalla propia con sus respuestas; quien la
  escribió la ve en «Mis solicitudes» y, si quiere cambiarla, la retira y la escribe de nuevo.

**Quién la ve**

- **FR-017**: Mientras espera, una solicitud MUST ser invisible para quien publicó: no aparece en
  «Solicitudes recibidas», en la lista de solicitudes del animal, en ninguna solicitud, en los
  números de «Mis animales», en ningún correo ni en ningún conteo que le llegue; nada le deja saber
  que existe.
- **FR-018**: Mientras espera, sus respuestas MUST verlas solo quien la escribió; ni quien publicó ni
  quien administra ni nadie más. Quien administra tampoco ve que existe, ni al revisar la identidad
  de esa persona ni en sus números.
- **FR-019**: El contacto MUST seguir revelándose solo cuando una solicitud que ya salió se acepta.

**Salir**

- **FR-020**: Cuando se aprueba la identidad y la persona tiene nivel 2, MUST salir en ese momento
  cada solicitud que espera cuyo animal recibe solicitudes, todas en la misma aprobación.
- **FR-021**: Una solicitud que sale MUST ser desde ahí una solicitud como cualquier otra: llega a
  «Solicitudes recibidas» con la fecha en que salió, figura como nueva, avisa por correo con la regla
  de siempre (no se repite si quien publicó ya tiene nuevas sin abrir de ese animal) y el tiempo de
  respuesta se cuenta desde que salió. Nada le dice a quien publicó que la solicitud esperó.
- **FR-022**: Si al aprobarse la identidad el animal no recibe solicitudes por ahora, la solicitud
  MUST seguir esperando y salir el mismo día en que el animal vuelve a recibir, si es dentro del
  plazo.
- **FR-023**: Si la persona tiene la identidad aprobada pero no nivel 2 (le falta el teléfono), la
  solicitud MUST seguir esperando y salir cuando tenga nivel 2, dentro del plazo.
- **FR-024**: Que quien publicó deje de pedir la identidad MUST NOT hacer salir antes una solicitud
  que espera.
- **FR-025**: Una solicitud MUST salir una sola vez, también si la aprobación coincide con un retiro,
  un cierre o un reintento.

**No salir**

- **FR-026**: Si la identidad se rechaza, el pedido vence o la persona lo retira, la solicitud MUST seguir esperando, y
  salir si un pedido nuevo se aprueba dentro del plazo.
- **FR-027**: Una solicitud que espera MUST NOT salir cuando: se cumple el plazo; la persona la
  retira; el animal o la cría se adopta, se borra o se da de baja; quien publicó la bloquea; quien
  solicitó bloquea a quien publicó; la cuenta de quien solicitó se suspende; quien publicó es
  suspendido o borra su cuenta; o la persona llega al tope de 3 pedidos rechazados en 30 días.
- **FR-028**: Una solicitud que no salió MUST quedar en «Cerradas y retiradas» con el sello «No
  salió», el animal, el día en que se escribió y el motivo, sin pantalla propia, y MUST dejar de
  ocupar su lugar en ese momento.
- **FR-029**: Los motivos MUST decirse con los textos de siempre cuando existen: «… encontró hogar.»,
  la publicación terminó, «… ya no recibe solicitudes.» (también cuando quien publicó bloqueó a la
  persona, decisión del 2026-10-06), el bloqueo propio y la cuenta suspendida. El plazo, el retiro y
  el tope de rechazos llevan su propio texto.
- **FR-030**: Al no salir, las respuestas MUST borrarse ese mismo día; solo queda lo que muestra la
  línea de «Cerradas y retiradas».
- **FR-031**: Una solicitud que no salió MUST NOT frenar dejar escrita o mandar otra para el mismo
  animal.
- **FR-032**: No salir MUST NOT mandar un correo nuevo.

**Correos de resultado de la identidad**

- **FR-033**: Si había solicitudes que esperan, el correo de identidad aprobada MUST nombrar los
  animales, decir cuáles le llegaron a quien publicó y hasta qué día espera cada una de las que
  siguen esperando, y llevar a «Mis solicitudes».
- **FR-034**: Si había solicitudes que esperan, el correo de identidad rechazada y el de pedido
  vencido MUST nombrar los animales y decir hasta qué día esperan; el del rechazo que llega al tope
  MUST decir que no van a salir.
- **FR-035**: Sin solicitudes que esperan, los tres correos MUST quedar como hoy.
- **FR-036**: Ningún correo MUST llevar las respuestas, el teléfono ni nada de la cédula.

**Medición**

- **FR-037**: El freno por identidad de una visita MUST decir si se le ofreció a la persona dejar
  escrita la solicitud.
- **FR-038**: MUST llegar, sin la persona ni el animal, un momento al dejar una solicitud que espera,
  uno al salir sola y uno al no salir con su motivo (plazo, retirada, el animal dejó de recibir, tope
  de rechazos, cuenta suspendida).
- **FR-039**: La que sale sola MUST contar como solicitud mandada después de la identidad, marcada
  aparte de las que se mandan al volver, con los mismos datos que cualquier solicitud mandada.
- **FR-040**: docs/03 §Métricas de éxito MUST sumar la lectura nueva: de las veces que se ofreció
  dejarla escrita, cuántas se dejaron, cuántas salieron y por qué no salió el resto, y cómo se compara
  la lectura 2 antes y después del día en que llega esta historia.

**Textos**

- **FR-041**: Todos los textos nuevos (la opción y su línea, el botón, la confirmación, los sellos,
  los motivos nuevos, las líneas del plazo, los errores del retiro y los párrafos de los correos) MUST
  estar junto a los demás textos del sitio, en español rioplatense con voseo, escritos y revisados con el criterio sin-slop del proyecto.

### Key Entities *(include if feature involves data)*

- **Solicitud que espera**: lo que la persona dejó escrito para un animal o una cría mientras su
  identidad se revisa. Guarda quién la escribió, el animal (y el nombre que tenía, por si se borra),
  quién lo publicó, las respuestas, el momento en que se escribió (de ahí sale el plazo) y su estado:
  espera, salió o no salió con su motivo. Al salir se convierte en una solicitud como cualquier otra;
  al no salir pierde las respuestas y queda la línea con el animal, el día y el motivo. Se borra con
  la cuenta de quien la escribió.
- **Solicitud** (ya existe): la que le llega a quien publicó. Una que salió sola lleva como fecha el
  momento en que salió.
- **Pedido de verificación de identidad** (ya existe): su estado decide si se ofrece dejarla escrita
  y su aprobación hace salir las que esperan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quien tiene el pedido en revisión puede dejar escrita una solicitud en el mismo tiempo
  que hoy le lleva mandar una, sin volver al animal después de la aprobación.
- **SC-002**: El 100 % de las solicitudes que esperan y cumplen las condiciones salen en la misma
  aprobación de la identidad, y las que esperan a que el animal vuelva a recibir salen el mismo día
  en que vuelve.
- **SC-003**: En ninguna pantalla, correo, conteo ni número de quien publicó o de quien administra
  aparece una solicitud que espera ni sus respuestas; las pruebas de privacidad que lo intentan
  fallan todas.
- **SC-004**: Ninguna solicitud sale dos veces, sale después de retirada o cerrada, o queda ocupando
  un lugar más allá de su plazo.
- **SC-005**: Las respuestas de una solicitud que no salió no existen en ningún lado al terminar ese
  día.
- **SC-006**: La medición deja contestar, desde el día en que llega la historia, qué parte de las
  veces que se ofreció dejarla escrita terminó en una solicitud que espera, qué parte de esas salió y
  cuántas no salieron por cada motivo.

## Assumptions

- **Dónde va la opción**: la pantalla es la que hoy se ve al tocar «Quiero adoptar» en un animal o
  una cría que pide identidad verificada, con «Mandaste tu pedido de identidad el …». La ficha del
  animal no cambia; su botón lleva a esa pantalla, que dice si ya hay una que espera.
- **Pedido en revisión**: cuenta el que la persona mandó y sigue sin resolver ni vencer. Con el tope
  de rechazos no hay pedido en revisión y no se ofrece.
- **El pedido se cae mientras escribe**: si al confirmar ya no hay pedido en revisión ni nivel 2, no se
  guarda nada y se muestra el camino a verificar la identidad con lo escrito a la vista. Es la
  lectura más estricta de «la opción aparece solo con el pedido en revisión»: nadie deja escrita una
  solicitud sin haber mandado la cédula.
- **Un animal que no recibe por ahora al escribir** no ofrece dejarla escrita: la regla de siempre
  manda a la ficha antes de la pantalla de identidad pedida. La espera por pausa existe solo para lo
  que ya estaba escrito (decisión del 2026-11-02 sobre los 14 días).
- **El sello cuando la identidad ya se aprobó**: con nivel 2 y el animal en pausa, el sello «Espera tu
  identidad» sería falso; se usa el de no disponible por ahora que ya existe, con la línea de hasta
  cuándo. Sin nivel 2 por el teléfono, sigue «Espera tu identidad», porque el nivel 2 es lo que falta.
- **Bloqueo propio y cierre de quien publicó**: la historia nombra el bloqueo de quien publicó y la
  suspensión de quien solicitó. El bloqueo de quien solicitó a quien publicó y la suspensión o el
  borrado de la cuenta de quien publicó también hacen que no salga, con el motivo que hoy tiene una
  solicitud cerrada por lo mismo, porque una solicitud no puede llegarle a esa persona.
- **Retirar**: queda como «No salió» con el motivo de que la retiró (la historia la nombra entre los
  motivos), no como «Retirada».
- **Respuestas propuestas**: se toman también de una que espera, porque quien deja escritas dos a la
  vez (Tobi y una cría) no debería escribir su casa dos veces (decisión del 2026-09-27 sobre las
  respuestas propuestas). Una que no salió ya no tiene respuestas y no propone nada.
- **Sin pantalla propia**: una solicitud que espera no tiene el detalle de «Mi solicitud»; la
  historia no lo pide y editarla está afuera.
- **El último día** se muestra como fecha del calendario uruguayo; el plazo vence al cumplirse 14
  veces 24 horas desde que se escribió.
- **Medir la oferta**: «las veces que se ofreció» se lee del freno por identidad que ya existe, con
  una marca de si se ofreció dejarla escrita; no es un momento nuevo, así quedan los tres que dice
  la historia.
- **El correo del tope**: la historia pide que los correos digan si salieron o hasta qué día esperan;
  con el tope no esperan más, así que el correo de ese rechazo dice que no van a salir.
- **Dependencias**: #11 (verificación de identidad), #59 (en proceso), #63 (solicitar), #65 (bandeja
  y correos), #206 (crías), #234 (por qué se deja la verificación), docs/03 §1, §4 y §Métricas de
  éxito. Nada nuevo de afuera: los correos ya salen y la medición ya existe.
