# Feature Specification: Pedirle a quien solicitó que verifique su identidad antes de decidir

**Feature Branch**: `feature/257-pedir-identidad-quien-solicito`

**Created**: 2026-10-29

**Status**: Draft

**Input**: Historia #257 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (en `main`, no se rehace): la verificación de identidad entera, con su
consentimiento, la revisión a mano, la espera de hasta 2 días, el vencimiento a los 7, el tope de 3
rechazos en 30 días, retirar el pedido de verificación y los correos de aprobado, rechazado y vencido (#11); la
vuelta de la verificación al animal cuando se llega desde «Quiero adoptar» (#63), que hoy solo
existe para quien todavía no solicitó; responder una solicitud (aceptar, rechazar, preguntar, dejar
sin efecto) con su bandeja, sus marcas de nueva y el correo de solicitud nueva que no se repite
mientras haya nuevas sin abrir de ese animal (#65); las solicitudes de una cría (#206); la pregunta
de por qué se deja la verificación, con su origen (#234); el nivel de quien solicitó en los
momentos de responder (#236). Nada de eso pide la identidad desde una solicitud ya mandada: esta
spec suma ese pedido y lo que cambia alrededor, sin tocar cómo se verifica.

**Vocabulario de esta spec**:

- **El pedido de quien publicó** (o **el pedido**, a secas, en esta spec): lo que hace quien
  publicó al tocar «Pedirle la identidad» en una solicitud. Hay a lo sumo uno por solicitud y guarda
  el día en que se hizo. En el glosario de docs/06 es la **identidad pedida**.
- **El pedido de verificación**: la cédula y la selfie que la persona manda para verificar su
  identidad, con su estado de siempre (en revisión, aprobado, rechazado, vencido, retirado), como lo
  nombra docs/06. Es de la persona, no de la solicitud. Esta spec nunca lo llama «el pedido» a
  secas.
- **Pedido abierto**: un pedido cuya solicitud sigue esperando respuesta y cuya persona todavía no
  tiene la identidad aprobada.
- **Pedido resuelto**: un pedido abierto que se cerró porque se aprobó la identidad de la persona
  mientras la solicitud esperaba respuesta. Guarda el día de la aprobación.
- **Esperando respuesta**: la solicitud que se mandó y todavía no se aceptó, no se rechazó, no se
  retiró y no se cerró. Una pregunta esperando respuesta no cambia eso.
- **Tener nivel 2**: tener la identidad aprobada hoy, con o sin aval. Es lo que dice la chapita de
  nivel 2 o 3.
- **Quien publicó** es quien publicó el animal o la camada; **quien solicitó** es la persona de la
  solicitud. En los ejemplos, Carla publicó a Tobi y Ana le solicitó.
- **Un momento** es lo que ya llega a la herramienta de medición cuando pasa algo en el sitio.
- **El día** se muestra como día y mes («29/10»), en la hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pedirle la identidad a quien solicitó (Priority: P1)

Carla abre la solicitud de Ana, que solo tiene el teléfono verificado. Junto a aceptar, rechazar y
preguntar ve «Pedirle la identidad». Lo toca, lee qué se le va a pedir a Ana (el frente de la
cédula y una selfie con ella, revisadas a mano, hasta 2 días) y que la solicitud sigue esperando, y
confirma. La solicitud dice «Le pediste la identidad el 29/10 · Todavía no la verificó» y Carla
sigue pudiendo aceptar, rechazar o preguntar. En la lista de solicitudes de Tobi, la fila de Ana
lleva la marca de identidad pedida. Ana recibe un solo correo que le dice que quien publicó a Tobi
le pide verificar su identidad y la lleva a su solicitud.

**Why this priority**: es la decisión de quien rescata que la historia quiere medir. Sin el pedido
no hay nada que completar del otro lado. Con esta parte sola ya se lee cuántos rescatistas piden la
identidad cuando les cuesta perder a alguien.

**Independent Test**: con personas sembradas de nivel 1, 2 y 3 que solicitaron a un animal y a una
cría de una camada: pedir la identidad a la de nivel 1, ver la línea, la marca en la fila y el único
correo; comprobar que a las de nivel 2 y 3 no se les ofrece, que aceptar, rechazar y preguntar
siguen andando y que tocar dos veces o desde dos pestañas deja un solo pedido y un solo correo.

**Acceptance Scenarios**:

1. **Dado** que publiqué a Tobi y Ana me solicitó con solo el teléfono verificado, **cuando** abro
   su solicitud, toco «Pedirle la identidad» y confirmo, **entonces** la solicitud dice «Le pediste
   la identidad el 29/10 · Todavía no la verificó», sigue esperando respuesta y puedo aceptar,
   rechazar o preguntar.
2. **Dado** que toqué «Pedirle la identidad», **cuando** veo la confirmación, **entonces** dice que
   a Ana se le va a pedir el frente de la cédula y una selfie con ella, que las revisa una persona,
   que puede tardar hasta 2 días y que la solicitud sigue esperando; si cancelo, no se pide nada.
3. **Dado** que le pedí la identidad a Ana, **cuando** abro las solicitudes de Tobi, **entonces** la
   fila de Ana lleva la marca de identidad pedida y las demás filas se ven como hoy.
4. **Dado** que le pedí la identidad a Ana, **cuando** la pregunta que le hice sigue sin respuesta o
   le hago una nueva, **entonces** el pedido no cuenta como pregunta, no la reemplaza ni la frena.
5. **Dado** que quien me solicitó ya tiene nivel 2 o 3, **cuando** abro su solicitud, **entonces**
   no aparece «Pedirle la identidad» y la solicitud se ve como hoy.
6. **Dado** que ya le pedí la identidad a Ana en esta solicitud, **cuando** la vuelvo a abrir, toco
   dos veces, la tengo abierta en dos pestañas o toco «Reintentar» después de un corte,
   **entonces** queda un solo pedido con su día y Ana recibe un solo correo.
7. **Dado** que Ana verificó su identidad mientras yo tenía su solicitud abierta, **cuando** toco
   «Pedirle la identidad», **entonces** veo que ya la verificó, no se pide ni se manda nada y la
   solicitud muestra su chapita nueva.
8. **Dado** que la solicitud dejó de esperar respuesta (Ana la retiró, se cerró, o la acepté o la
   rechacé en otra pestaña), **cuando** toco «Pedirle la identidad», **entonces** veo en palabras
   que ya no se puede pedir y por qué, con el mismo texto que ya dice por qué se cerró, y no se
   manda nada.
9. **Dado** que no publiqué el animal, **cuando** intento pedirle la identidad a quien lo solicitó,
   **entonces** no puedo y no veo esa solicitud.
10. **Dado** que Ana solicitó una cría de la camada de Luna, **cuando** le pido la identidad,
    **entonces** todo funciona igual que con un animal solo, y el correo nombra a la cría con su
    camada como los otros correos de una cría.
11. **Dado** que no tengo nivel 2, **cuando** abro la solicitud de Ana, **entonces** puedo pedirle
    la identidad igual.

---

### User Story 2 - Ver el pedido en mi solicitud y verificarme desde ahí (Priority: P2)

Ana abre su solicitud de Tobi y ve que quien lo publicó le pide verificar su identidad antes de
decidir, con las chapitas de Carla y «Verificar mi identidad». Lo toca, manda la cédula y la selfie
por el camino de siempre y, al terminar, vuelve a su solicitud, que dice que su identidad está en
revisión.

**Why this priority**: es la otra mitad de la prueba: si quien adopta completa la verificación
porque se la pidió quien tiene el animal que quiere. Necesita el pedido de la parte 1.

**Independent Test**: con un pedido sembrado sobre una persona de nivel 1: abrir su solicitud, ver
el aviso con las chapitas de quien publicó, ir a verificar, mandar las fotos y volver a la
solicitud; repetir con la persona con un pedido de verificación en revisión, con uno rechazado, con uno vencido, con
el tope alcanzado y con la solicitud aceptada o cerrada; tocar «Ahora no» en la verificación y ver
que vuelve a la solicitud y que la pregunta de por qué se va lleva el origen nuevo.

**Acceptance Scenarios**:

1. **Dado** que quien publicó a Tobi me pidió la identidad, **cuando** abro mi solicitud,
   **entonces** veo que me la pide antes de decidir, con sus chapitas y «Verificar mi identidad», y
   en mi correo tengo un solo aviso que lleva a esa solicitud.
2. **Dado** que toqué «Verificar mi identidad» desde mi solicitud, **cuando** termino de mandar la
   cédula y la selfie, **entonces** vuelvo a mi solicitud, que dice que mi identidad está en
   revisión.
3. **Dado** que toqué «Verificar mi identidad» desde mi solicitud, **cuando** toco «Ahora no» o
   «Cancelar la verificación», **entonces** vuelvo a mi solicitud, y si se me hace la pregunta de
   por qué la dejo, mi respuesta cuenta con el origen «se la pidió quien publicó».
4. **Dado** que ya había mandado mi cédula por mi cuenta y está en revisión, **cuando** quien
   publicó me pide la identidad, **entonces** mi solicitud dice que ya está en revisión, sin un
   camino para mandarla otra vez.
5. **Dado** que mi pedido de verificación fue rechazado o venció, **cuando** abro mi solicitud con el pedido,
   **entonces** veo el camino para intentarlo de nuevo, que termina en el formulario de siempre.
6. **Dado** que llegué al tope de rechazos, **cuando** abro mi solicitud con el pedido, **entonces**
   veo desde qué día puedo volver a intentarlo, sin un camino que me lleve a un formulario que no
   puedo mandar.
7. **Dado** que perdí el teléfono verificado después de solicitar, **cuando** toco «Verificar mi
   identidad», **entonces** el camino de siempre me pide primero el teléfono y después sigue a la
   identidad, y al terminar vuelvo a mi solicitud.
8. **Dado** que me aprobaron la identidad con la solicitud esperando, **cuando** abro mi solicitud,
   **entonces** dice que verifiqué mi identidad y que quien publicó ya lo ve, sin el camino.
9. **Dado** que mi solicitud se aceptó, se rechazó, la retiré o se cerró, **cuando** la abro,
   **entonces** no veo el pedido y se ve como hoy; la verificación que empecé sigue siendo mía y
   sigue su curso.
10. **Dado** que nadie me pidió la identidad, **cuando** abro mi solicitud, **entonces** se ve como
    hoy.
11. **Dado** que llego a verificar mi identidad sin venir de una solicitud, **cuando** termino,
    **entonces** todo es como hoy.

---

### User Story 3 - Enterarse cuando la identidad se aprueba (Priority: P3)

La identidad de Ana se aprueba dos días después. Su solicitud vuelve a figurar como nueva en
«Solicitudes recibidas» de Carla, con la chapita de nivel 2 y «Verificó su identidad el 31/10», y a
Carla le llega un correo, salvo que ya tenga solicitudes nuevas sin abrir de Tobi.

**Why this priority**: cierra la vuelta. Sin esto quien rescata tendría que volver sola a mirar, y
el tiempo de respuesta es una de las métricas de éxito. Necesita las partes 1 y 2.

**Independent Test**: con pedidos sembrados en solicitudes de uno y de dos rescatistas, aprobar la
identidad de la persona desde la revisión y ver cada solicitud marcada como nueva, la línea con el
día y el correo con la regla de las nuevas; repetir con la solicitud aceptada, rechazada o cerrada
antes de aprobar, y con quien publicó con nuevas sin abrir de ese animal.

**Acceptance Scenarios**:

1. **Dado** que le pedí la identidad a Ana, **cuando** se aprueba, **entonces** su solicitud figura
   como nueva en «Solicitudes recibidas», muestra su chapita de nivel 2 y «Verificó su identidad el
   31/10», y me llega un correo que lleva a esa solicitud, salvo que ya tenga solicitudes nuevas sin
   abrir de Tobi.
2. **Dado** que su solicitud volvió a figurar como nueva, **cuando** la abro, **entonces** deja de
   figurar como nueva, como cualquier otra.
3. **Dado** que le pedí la identidad a Ana, **cuando** su pedido de verificación es rechazado, vence o lo retira,
   **entonces** yo sigo viendo «Todavía no la verificó», sin saber qué pasó, y no me llega nada.
4. **Dado** que le pedí la identidad a Ana, **cuando** acepto o rechazo su solicitud, o se cierra,
   antes de que se apruebe, **entonces** su solicitud deja de mostrar el pedido del lado de ella y,
   si después se aprueba, no me llega ningún aviso por esa solicitud ni vuelve a figurar como nueva.
5. **Dado** que dos rescatistas le pidieron la identidad a Ana en dos solicitudes, **cuando** se
   aprueba, **entonces** las dos solicitudes dicen que verificó su identidad y a cada rescatista le
   llega su aviso con la regla de las solicitudes nuevas.
6. **Dado** que Ana solicitó una cría de la camada de Luna y le pedí la identidad, **cuando** se
   aprueba, **entonces** pasa lo mismo que con un animal solo, con la regla de las nuevas de esa
   cría como ya la usa el correo de solicitud nueva.

---

### User Story 4 - Medir los pedidos aparte de lo exigido (Priority: P4)

Cuando Carla pide la identidad llega un momento con su propio nivel. Cuando la identidad de Ana se
aprueba, llega un momento por cada pedido abierto que resuelve, con el nivel de quien lo pidió.
docs/03 §Métricas de éxito explica cómo se leen, aparte de «nivel 2 cuando se lo exigen».

**Why this priority**: es lo que convierte la feature en una respuesta a la hipótesis. Agrega
momentos sin cambiar lo que ve nadie, y no lo necesitan las otras partes para andar.

**Independent Test**: pedir la identidad con rescatistas de nivel 1 y 2, aprobar identidades con
uno y dos pedidos abiertos y con pedidos ya cerrados; leer en el registro de la medición los
momentos, su nivel y que no llevan quién, qué animal ni qué solicitud. Repetir con la medición
caída.

**Acceptance Scenarios**:

1. **Dado** que Carla tiene nivel 1, **cuando** le pide la identidad a Ana, **entonces** llega un
   momento de pedido con nivel 1, y uno solo aunque toque dos veces.
2. **Dado** que dos rescatistas, de nivel 1 y 2, le pidieron la identidad a Ana, **cuando** se
   aprueba, **entonces** llegan dos momentos de pedido resuelto, uno con nivel 1 y otro con nivel
   2, el de cada una en ese instante.
3. **Dado** que el pedido de Carla ya no estaba abierto porque la solicitud se cerró, **cuando** se
   aprueba la identidad de Ana, **entonces** no llega ningún momento de pedido resuelto por ese
   pedido.
4. **Dado** que la herramienta de medición no responde, **cuando** Carla pide la identidad o la
   identidad se aprueba, **entonces** el pedido o la aprobación se guardan, los correos salen y
   nadie ve ningún aviso nuevo.
5. **Dado** que se lee cualquier momento de esta historia, **cuando** se revisa lo que lleva,
   **entonces** no tiene quién, qué animal, qué camada ni qué solicitud, como el resto de la
   medición.
6. **Dado** que alguien lee docs/03 §Métricas de éxito, **cuando** busca los pedidos, **entonces**
   encuentra cómo se leen, aparte de la lectura 2.

---

### Edge Cases

- **La persona tiene la identidad aprobada pero perdió el teléfono** (otra cuenta se quedó con el
  número, o está cambiando de número): no tiene chapita, pero ya tiene la identidad; no se le
  ofrece el pedido, porque pedirle algo que ya hizo no le sirve a nadie.
- **La persona retiró su pedido de verificación** después del pedido: para ella la solicitud vuelve a ofrecer el
  camino; quien publicó sigue viendo «Todavía no la verificó».
- **Se aprueba la identidad y la persona no tiene teléfono verificado en ese momento**: el pedido
  se resuelve igual y la línea dice el día; la chapita muestra lo que muestra hoy para esa persona.
- **Una aceptación que se deja sin efecto** deja la solicitud fuera de «esperando respuesta», así
  que no se ofrece el pedido; un pedido que estaba abierto deja de estarlo.
- **Bloquear o suspender** cierra la solicitud como hoy, y el pedido deja de estar abierto.
- **La persona borra su cuenta, o la borra quien publicó**: la solicitud y su pedido se borran con
  ella, como hoy.
- **Una misma aprobación con varios pedidos abiertos**, de uno o de varios rescatistas, los resuelve
  todos a la vez, cada uno con su aviso y su momento.
- **La aprobación llega después de que la solicitud se cerró**: el pedido queda como estaba, sin
  día de aprobación; quien publicó ve solo «Le pediste la identidad el <día>», sin la línea de
  estado, porque «Todavía no la verificó» ya no sería cierto y la solicitud ya no espera nada.
- **Pedir la identidad no cuenta como primera respuesta**: los días que lleva esperando la
  solicitud y el tiempo de respuesta siguen contando hasta que quien publicó acepte, rechace o
  pregunte.
- **El correo a quien solicitó no sale** (el servicio de correo falla): el pedido queda hecho y se
  ve en la solicitud; el correo no se reintenta, como los otros avisos de una solicitud.
- **La aprobación y una respuesta a la vez** (quien revisa aprueba en el mismo momento en que quien
  publicó acepta, rechaza o la solicitud se cierra): el pedido se resuelve solo si la solicitud
  seguía esperando respuesta en el instante de la aprobación; nunca quedan las dos cosas a medias.
- **La persona toca «Verificar mi identidad» y la solicitud se cierra mientras manda las fotos**: el
  pedido de verificación sigue su curso, y al terminar vuelve a su solicitud, que se ve como hoy.
- **El estado de su pedido de verificación no se puede leer** al abrir la solicitud: quien solicitó
  ve el pedido con «Verificar mi identidad», y la pantalla de verificar le muestra su estado real.
- **«Mis solicitudes»**, la lista de quien solicitó, no cambia: el pedido se ve al abrir la
  solicitud y llega por correo.
- **La revisión de quien administra** no muestra el pedido ni si un pedido de verificación vino de un pedido de quien publicó.

## Requirements *(mandatory)*

### Functional Requirements

#### Pedir

- **FR-001**: Quien publicó el animal o la camada DEBE poder pedirle la identidad a quien solicitó,
  desde esa solicitud, solo mientras la solicitud espera respuesta y solo si quien la mandó no
  tiene nivel 2. Cuando no se cumple alguna de las tres cosas, «Pedirle la identidad» NO DEBE
  aparecer.
- **FR-002**: Pedir DEBE pasar por una confirmación que diga qué se le va a pedir (el frente de la
  cédula y una selfie con ella, revisadas por una persona, hasta 2 días) y que la solicitud sigue
  esperando. Cancelar NO DEBE pedir nada.
- **FR-003**: DEBE haber a lo sumo un pedido por solicitud. Tocar dos veces, pedir desde dos
  pestañas o reintentar después de un corte DEBEN dejar un solo pedido con su día y mandar un solo
  correo.
- **FR-004**: Si pedir falla (se corta la conexión o el sitio no lo puede guardar), quien publicó
  DEBE ver que no se pidió, con «Reintentar», y la solicitud DEBE quedar como estaba: sin pedido a
  medias y sin correo.
- **FR-005**: Pedir NO DEBE trabar aceptar, rechazar ni preguntar, NO DEBE contar como pregunta ni
  ocupar la que espera, NO DEBE contar como primera respuesta y NO DEBE cambiar los días que lleva
  esperando la solicitud.
- **FR-006**: Si al confirmar la persona ya tiene nivel 2, quien publicó DEBE ver que ya verificó
  su identidad, con su chapita nueva, y NO DEBE quedar ningún pedido ni salir ningún correo.
- **FR-007**: Si al confirmar la solicitud ya no espera respuesta, quien publicó DEBE ver en
  palabras que ya no se puede pedir y por qué, usando el mismo texto con el que hoy se le dice por
  qué se cerró (sin distinguir retiro, bloqueo o suspensión), y NO DEBE quedar ningún pedido ni
  salir ningún correo.
- **FR-008**: Nadie más que quien publicó DEBE poder pedirlo, y quien no publicó el animal NO DEBE
  ver la solicitud, como hoy.
- **FR-009**: Pedir NO DEBE exigirle nivel 2 a quien publicó; le exige lo mismo que hoy le exige
  preguntar algo en una solicitud.
- **FR-010**: Pedirlo NO DEBE cambiar el nivel mínimo que exige la publicación ni la regla con la
  que se solicita.

#### Lo que ve quien publicó

- **FR-011**: Con un pedido hecho, la solicitud DEBE decir «Le pediste la identidad el <día>» y,
  mientras el pedido esté abierto, «Todavía no la verificó». Con el pedido resuelto DEBE decir
  «Verificó su identidad el <día>», con el día de la aprobación.
- **FR-012**: Quien publicó NUNCA DEBE ver si el pedido de verificación de la otra persona está en revisión, fue
  rechazado, venció o se retiró, ni el motivo de un rechazo ni nada de la cédula. Ve solo la
  chapita que ya ve hoy y el día de la aprobación de un pedido resuelto.
- **FR-013**: Si la solicitud deja de esperar respuesta con el pedido abierto, quien publicó DEBE
  ver solo «Le pediste la identidad el <día>», sin línea de estado.
- **FR-014**: En la lista de solicitudes de un animal o de una cría, la fila de una solicitud con
  pedido abierto DEBE llevar la marca de identidad pedida. Sin pedidos, la lista DEBE verse como
  hoy.

#### Lo que ve quien solicitó

- **FR-015**: Con un pedido abierto, la solicitud de quien solicitó DEBE decir que quien publicó le
  pide verificar la identidad antes de decidir, con las chapitas de quien publicó, y además:
  - sin pedido de verificación, o con uno retirado, rechazado o vencido: «Verificar mi identidad», que lleva al
    camino de siempre;
  - con un pedido de verificación en revisión: «Tu identidad está en revisión», sin camino para mandarla otra vez;
  - con el tope de rechazos alcanzado: desde qué día puede volver a intentarlo, sin camino.
- **FR-016**: Con el pedido resuelto y la solicitud esperando respuesta, la solicitud de quien
  solicitó DEBE decir que verificó su identidad y que quien publicó ya lo ve, sin camino.
- **FR-017**: Si la solicitud se acepta, se rechaza, se retira o se cierra, la solicitud de quien
  solicitó NO DEBE mostrar el pedido, y la verificación que haya empezado DEBE seguir su curso como
  cualquier otra.
- **FR-018**: Sin pedido, la solicitud de quien solicitó DEBE verse como hoy.
- **FR-019**: Al pedirse la identidad, quien solicitó DEBE recibir un solo correo que diga que
  quien publicó el animal le pide verificar su identidad antes de decidir y lleve a su solicitud.
  NO DEBE llevar el teléfono, las respuestas, el nombre de nadie ni nada de la cédula, y NO DEBE
  haber recordatorios.

#### El camino a verificar y la vuelta

- **FR-020**: «Verificar mi identidad» desde la solicitud DEBE llevar a la verificación de
  identidad que ya existe, sin cambiar sus pasos, su consentimiento, su revisión ni sus topes; si
  la persona no tiene el teléfono verificado, DEBE pasar primero por la verificación del teléfono
  de siempre y seguir a la identidad.
- **FR-021**: Al terminar de mandar la cédula y la selfie desde ese camino, la persona DEBE volver
  a su solicitud, que dice que su identidad está en revisión. «Ahora no» y «Cancelar la
  verificación» DEBEN volver también a la solicitud.
- **FR-022**: Llegar a verificar la identidad sin venir de una solicitud DEBE comportarse como hoy.
- **FR-023**: El camino NO DEBE dejar ver la solicitud a nadie más que a quien la mandó: una
  dirección con la solicitud de otra persona DEBE comportarse como si no viniera de ninguna.

#### Cuando la identidad se aprueba

- **FR-024**: Al aprobarse la identidad de una persona, cada pedido abierto a ella, de uno o de
  varios rescatistas, DEBE quedar resuelto con el día de la aprobación.
- **FR-025**: Cada solicitud con un pedido que se resuelve DEBE volver a figurar como nueva en
  «Solicitudes recibidas» de quien publicó, hasta que la abra, como una solicitud nueva.
- **FR-026**: Por cada pedido resuelto, quien publicó DEBE recibir un correo que lleva a esa
  solicitud, con la misma regla que el correo de solicitud nueva: NO DEBE salir si ya tenía nuevas
  sin abrir de ese animal o de esa cría. NO DEBE llevar el teléfono, las respuestas ni nada de la
  cédula.
- **FR-027**: Un pedido que ya no estaba abierto al aprobarse NO DEBE resolverse, NO DEBE volver a
  marcar la solicitud como nueva y NO DEBE mandar ningún correo.
- **FR-028**: Un rechazo, un vencimiento o un retiro del pedido de verificación NO DEBEN cambiar lo que ve quien
  publicó ni mandarle nada.
- **FR-029**: Aprobar una identidad DEBE funcionar igual que hoy para quien revisa, haya pedidos o
  no, y un correo que no sale NO DEBE deshacer ni frenar la aprobación.

#### Datos personales

- **FR-030**: El pedido y sus días DEBEN guardarse con la solicitud y verlos solo quien publicó y
  quien solicitó; quien administra NO DEBE verlos. Se DEBEN borrar con la solicitud, también al
  borrarse la cuenta de cualquiera de los dos.
- **FR-031**: Del pedido de verificación de la otra persona, el sitio NO DEBE guardar con el pedido nada más que el
  día de la aprobación de un pedido resuelto. La cédula y la selfie siguen las reglas de siempre:
  se revisan y se borran (Ley 18.331).
- **FR-032**: Todas las pantallas que cambian son privadas y NO DEBEN aparecer en buscadores.

#### Medición

- **FR-033**: Al quedar hecho un pedido DEBE llegar un momento con el nivel de ahora de quien
  publicó, uno solo por pedido.
- **FR-034**: Por cada pedido abierto que resuelve una identidad aprobada DEBE llegar un momento
  con el nivel de ahora de quien lo pidió.
- **FR-035**: La pregunta de por qué se deja la verificación (#234) DEBE contar con el origen «se la
  pidió quien publicó» cuando la persona llegó a la verificación desde una solicitud con pedido,
  aparte de publicar, solicitar y por su cuenta.
- **FR-036**: Ningún momento de esta historia DEBE llevar quién, qué animal, qué camada ni qué
  solicitud, y medir NUNCA DEBE cambiar lo que la persona hace ni lo que ve: si la medición no
  responde, pedir y aprobar terminan igual y sin avisos nuevos.
- **FR-037**: docs/03 §Métricas de éxito DEBE sumar cómo se leen los pedidos, aparte de «nivel 2
  cuando se lo exigen» (lectura 2): qué parte de los pedidos termina en una identidad aprobada, por
  el nivel de quien pidió, y qué parte de esas solicitudes se acepta, con la advertencia de que con
  3 a 5 rescatistas los números son una señal y no una prueba.

### Key Entities

- **Pedido de identidad de una solicitud**: pertenece a una solicitud; guarda el día en que quien
  publicó lo hizo y, si se resolvió, el día en que se aprobó la identidad. A lo sumo uno por
  solicitud. Lo ven solo las dos personas de la solicitud.
- **Pedido de verificación** (ya existe): la cédula y la selfie de una persona, con su estado. Esta
  historia no lo cambia; solo lee si está en revisión, rechazado, vencido o con el tope, para lo que
  ve la persona misma.
- **Aviso por correo** (ya existe): suma dos tipos, el pedido a quien solicitó y la aprobación a
  quien publicó.
- **Origen de la pregunta de por qué se va** (ya existe): suma «se la pidió quien publicó».

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas, «Pedirle la identidad» aparece solo en solicitudes que
  esperan respuesta de personas sin nivel 2, y solo para quien publicó.
- **SC-002**: En el 100 % de las pruebas con doble toque, dos pestañas o reintento, queda un solo
  pedido y sale un solo correo a quien solicitó.
- **SC-003**: Quien solicitó va de su solicitud al formulario de verificación en un toque y, al
  mandar las fotos, vuelve a su solicitud en el 100 % de las pruebas.
- **SC-004**: En el 100 % de las pruebas, una aprobación con la solicitud esperando la vuelve a
  marcar como nueva y manda el correo según la regla de las nuevas; una aprobación con la solicitud
  ya cerrada no marca ni manda nada.
- **SC-005**: Revisando lo que ve quien publicó en cualquier estado del pedido de verificación de la otra persona,
  nunca aparece «en revisión», «rechazado», «vencido», un motivo ni un dato de la cédula.
- **SC-006**: En el 100 % de las pruebas, aceptar, rechazar y preguntar funcionan igual con un
  pedido abierto que sin él.
- **SC-007**: Con los datos de la beta, alguien del equipo puede contestar en la herramienta de
  medición, sin otra fuente, qué parte de los pedidos termina en identidad verificada, siguiendo lo
  que dice docs/03 §Métricas de éxito.

## Assumptions

- **«Tener nivel 2» es tener la identidad aprobada**, aunque la chapita no lo muestre por un
  teléfono perdido. La historia dice que a quien ya tiene identidad o aval no se le ofrece, y el aval
  exige la identidad (docs/03 §1, decisión 2026-09-26).
- **Esperando respuesta** sigue la definición de la bandeja (#65): la solicitud mandada que no se
  aceptó, rechazó, retiró ni cerró. Una aceptación dejada sin efecto ya no espera respuesta.
- **Pedir no es responder**: no cuenta como primera respuesta, no cambia los días esperando y no
  ocupa ninguna de las 3 preguntas. La historia dice que no traba nada ni ocupa la pregunta que
  espera, y el tiempo de respuesta mide decisiones de quien rescata.
- **Lo que exige pedir a quien publicó** es lo mismo que hoy le exige preguntar algo (#65): ser
  quien publicó el animal. Pedir no revela ningún contacto, como preguntar, y la historia solo
  descarta que se le exija nivel 2.
- **El tope de rechazos** se muestra en la solicitud como el día desde el que se puede volver a
  intentar, sin el camino: un botón que termina en un formulario cerrado es la frustración que la
  historia quiere evitar, y la pantalla de verificar identidad ya dice ese día.
- **Con el pedido resuelto**, quien solicitó ve que verificó su identidad y que quien publicó ya lo
  ve. La historia no lo nombra; cerrar la vuelta en la misma solicitud le dice a la persona que lo
  que hizo sirvió, sin otro correo.
- **Un pedido que deja de estar abierto sin resolverse** queda solo con su día. «Todavía no la
  verificó» deja de mostrarse, porque podría dejar de ser cierto mientras la chapita ya diría otra
  cosa, y la solicitud ya no espera nada.
- **Los correos** nombran al animal (o a la cría con su camada) como los otros avisos de una
  solicitud y no nombran a ninguna persona. El de quien publicó lleva a la solicitud, como el de una
  solicitud nueva.
- **La solicitud que vuelve a figurar como nueva** se ordena en «Solicitudes recibidas» con la regla
  que ya tienen las nuevas, y sus días esperando siguen contando desde que se mandó.
- **El origen «se la pidió quien publicó»** solo se suma a la pregunta de por qué se deja la
  verificación, como pide la historia. Los momentos de la verificación que ya llegan con su origen
  propio no cambian.
- **El nivel de los momentos** es el de la chapita de quien pidió en ese instante (1, 2 o 3, y 0
  sin teléfono), como los momentos de #236; si no se puede leer, el momento llega sin nivel.
- **Las referencias «docs/03 §Hipótesis», «docs/03 §4», «docs/03 §7», «docs/03 §Métricas de éxito»,
  «docs/01 §Verificación = fricción», «docs/01 §Huevo y gallina» y «docs/05»** del cuerpo de la
  historia son referencias a documentos de producto.
- **Las decisiones del enjambre de la historia** (las seis del 2026-10-29, product-owner) van,
  palabra por palabra, a docs/03 en esta rama: las cinco primeras a §4 y la sexta a §Métricas de
  éxito.
