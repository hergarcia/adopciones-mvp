# Feature Specification: El estado de la verificación muestra el motivo del último rechazo

**Feature Branch**: `feature/80-motivo-ultimo-rechazo`

**Created**: 2026-09-28

**Status**: Draft

**Input**: Historia #80 del backlog, milestone «M1 - Cuentas y confianza». Seguimiento de la
historia #11 (verificación de identidad), encontrado en su aceptación; cierra KL-11-6 y KL-11-7.
El cuerpo verbatim de la historia acompaña a esta spec (`story.md`).

**Ya construido** (historia #11): el pedido de verificación de identidad, la cola de revisión, los
cuatro motivos de rechazo con su consejo, el correo de cada resultado, el tope de 3 pedidos
rechazados en 30 días con la fecha desde la que se puede volver a pedir, el estado del pedido con
los intentos que quedan y la pantalla de «Sin intentos». Todo eso funciona bien cuando los rechazos
caen en días distintos. **Ya en main de esta historia: nada.** Esta spec no rehace nada de lo de
#11. Lo que falta, y es lo que esta historia arregla:

- con dos o más rechazos el mismo día, el estado del pedido y la pantalla de «Sin intentos» toman
  el motivo y el consejo de un rechazo que no es el último (hoy, el primero del día), mientras el
  correo de ese último rechazo dice el correcto;
- en la cola de revisión, los rechazos anteriores de un mismo día no salen en el orden en que se
  resolvieron.

**Vocabulario de esta spec** (el de #11 sigue valiendo: pedido, resolver, quien administra, cola de
revisión, tope de intentos, día de Uruguay):

- **Rechazo**: un pedido que quien administra resolvió rechazándolo, con un motivo. De cada rechazo
  quedan el día y el motivo durante 30 días.
- **El último rechazo**: de los rechazos de los últimos 30 días de una persona, el que se resolvió
  último, aunque haya otro el mismo día.
- **Consejo**: el texto de qué hacer para que la próxima salga bien, que corresponde a cada motivo
  (#11). El motivo y su consejo son una pareja fija: el consejo sale siempre del motivo.
- **Estado del pedido**: lo que la persona ve de su verificación en la pantalla de verificar la
  identidad, con el motivo, el consejo y los intentos. «Mi perfil» muestra solo un resumen (que fue
  rechazado y qué día, o hasta cuándo no puede pedirlo) con el acceso a esa pantalla; ese resumen
  no muestra motivos ni consejos y no cambia.
- **Pantalla de «Sin intentos»**: el estado del pedido cuando la persona llegó al tope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El estado del pedido dice lo que de verdad falló la última vez (Priority: P1)

Una persona manda su pedido, se lo rechazan porque la foto no se lee, lo vuelve a mandar ese mismo
día y se lo rechazan porque la selfie no coincide con la cédula. Le llega el correo con «no
coincide». Al entrar, el estado de su pedido también dice «no coincide», con el consejo de ese
motivo y que le queda 1 intento. Corrige la selfie, no la luz, y su tercer intento sale bien.

**Why this priority**: es la historia. Hoy la pantalla le da el consejo del rechazo equivocado y la
persona puede quemar su último intento arreglando lo que ya estaba bien: queda 30 días sin poder
llegar al nivel 2, que es la métrica que el producto existe para mover (docs/03 §Métricas de
éxito).

**Independent Test**: con una persona de prueba, rechazar dos pedidos suyos el mismo día, el
primero por «no se lee» y el segundo por «no coincide». En el estado del pedido se ve «no coincide»
con su consejo y «Te queda 1 intento», y es lo mismo que dice el correo del segundo rechazo.

**Acceptance Scenarios**:

1. **Dado** que me rechazaron dos veces el mismo día, primero por «no se lee» y después por «no
   coincide», **cuando** miro el estado de mi pedido, **entonces** veo «no coincide» con su consejo
   y que me queda 1 intento.
2. **Dado** que me rechazaron dos veces el mismo día por el mismo motivo, **cuando** miro el
   estado, **entonces** veo ese motivo una sola vez, con su consejo, y que me queda 1 intento.
3. **Dado** que me rechazaron en días distintos, **cuando** miro el estado, **entonces** veo el
   motivo y el consejo del rechazo del día más reciente, como hasta ahora.
4. **Dado** un rechazo, **cuando** comparo el estado del pedido que veo mientras ese es mi último
   rechazo con el correo que me llegó por él, **entonces** dicen el mismo motivo y el mismo consejo.
5. **Dado** que el correo del último rechazo no me llegó, **cuando** miro el estado de mi pedido,
   **entonces** veo igual el motivo y el consejo de ese último rechazo.
6. **Dado** que después de dos rechazos del día pedí de nuevo, **cuando** miro el estado,
   **entonces** veo que mi pedido está en revisión, sin el motivo de ningún rechazo anterior.
7. **Dado** que me rechazaron dos veces el mismo día, **cuando** miro el resumen de mi
   verificación en «Mi perfil», **entonces** lo veo como hoy (rechazado, con el día del último
   rechazo) y con el acceso al estado de mi pedido, que muestra el motivo del último.

---

### User Story 2 - «Sin intentos» dice por qué fue el último rechazo (Priority: P2)

Una persona llega al tope con su tercer rechazo, y ese tercero cayó el mismo día que otro. La
pantalla de «Sin intentos» le dice el motivo y el consejo del tercero, el mismo que el correo, y
desde qué fecha puede pedirlo de nuevo. Cuando vuelva a intentarlo, sabe qué corregir.

**Why this priority**: es el mismo defecto en el momento más caro: la persona ya no tiene intentos
y el consejo es lo único que la prepara para dentro de 30 días. Va segunda porque la primera cubre
el caso más común (dos rechazos, un intento que queda).

**Independent Test**: con una persona de prueba, rechazar tres pedidos suyos en 30 días, los dos
últimos el mismo día con motivos distintos. La pantalla de «Sin intentos» muestra el motivo y el
consejo del tercero y la misma fecha para volver a pedir que mostraba antes de este arreglo.

**Acceptance Scenarios**:

1. **Dado** que me rechazaron por tercera vez en 30 días y el tercer rechazo fue el mismo día que
   otro, **cuando** veo la pantalla de «Sin intentos», **entonces** veo el motivo y el consejo del
   tercero y la fecha desde la que puedo volver a pedirlo.
2. **Dado** que me rechazaron tres veces el mismo día con tres motivos distintos, **cuando** veo la
   pantalla de «Sin intentos», **entonces** veo el motivo y el consejo del tercero, no de los otros.
3. **Dado** que llegué al tope, **cuando** miro la fecha desde la que puedo volver a pedirlo,
   **entonces** es la misma que el sitio calculaba antes de este arreglo: 30 días después del día
   del más viejo de los tres rechazos.

---

### User Story 3 - Quien revisa ve los rechazos anteriores en el orden en que pasaron (Priority: P3)

Quien administra abre un pedido de una persona que ya fue rechazada dos veces el mismo día. En la
lista de sus rechazos de los últimos 30 días ve primero el más reciente, también dentro del mismo
día, así sabe qué se le dijo la última vez y no rechaza por lo mismo sin mirar.

**Why this priority**: es la misma falla vista desde el otro lado (decisión 2026-09-28,
product-owner); no corta a la persona pero puede hacer que un tercer pedido se rechace mal. Depende
del mismo orden que las dos primeras.

**Independent Test**: con una persona de prueba con dos rechazos el mismo día («no se lee» y
después «no coincide») y un pedido nuevo en revisión, quien administra abre ese pedido y ve primero
«no coincide» y después «no se lee», los dos con el mismo día.

**Acceptance Scenarios**:

1. **Dado** que administro el sitio y una persona que tuvo dos rechazos el mismo día pide de nuevo,
   **cuando** abro su pedido, **entonces** veo sus rechazos del más reciente al más viejo, los del
   mismo día en el orden inverso al que se resolvieron (el último resuelto, primero).
2. **Dado** que la persona tiene rechazos en días distintos y dos en uno de ellos, **cuando** abro
   su pedido, **entonces** los días van del más reciente al más viejo y, dentro del día repetido,
   el último resuelto va primero.
3. **Dado** que la persona no tiene rechazos en los últimos 30 días, **cuando** abro su pedido,
   **entonces** no veo la parte de rechazos, como hoy.

---

### Edge Cases

- **Dos personas administran**: los rechazos de una misma persona nunca se resuelven a la vez,
  porque solo puede tener un pedido abierto; «el último» es el que se resolvió después, sin
  importar quién lo resolvió.
- **Rechazos cerca de medianoche**: el día de cada rechazo es el día de Uruguay en que se
  resolvió; un rechazo resuelto después de otro nunca queda con un día anterior, así que el orden
  por día y el orden de resolución coinciden.
- **Rechazos que salen de la ventana de 30 días**: dejan de contar y de mostrarse, como hoy; el
  último rechazo se busca solo entre los que quedan.
- **El tope se libera en parte**: cuando el más viejo de tres rechazos sale de la ventana, la
  persona vuelve a tener 1 intento y el estado muestra el motivo y el consejo del último de los
  que quedan.
- **Rechazos anteriores a este arreglo**: los que ya estaban guardados antes de que llegue este
  cambio también se muestran con el último resuelto como el último, en el estado y en la cola.
- **Un pedido vencido o retirado después de rechazos**: el estado muestra el vencimiento o deja
  pedir de nuevo como hoy (#11); vencer y retirar no son rechazos y no cambian cuál es el último.
- **Motivo de «sospecha de fraude»**: su consejo incluye el correo de ayuda, como hoy; si es el
  último rechazo, es el que se muestra, aunque otro del mismo día tenga otro motivo.

## Requirements *(mandatory)*

### Functional Requirements

#### El último rechazo

- **FR-001**: El producto DEBE poder decir, entre los rechazos de los últimos 30 días de una
  persona, cuál se resolvió último, también cuando dos o más cayeron el mismo día, y también para
  los rechazos que ya estaban guardados antes de este arreglo.
- **FR-002**: Saber cuál rechazo fue el último NO DEBE agregar ningún dato sobre la persona ni
  sobre su cédula: de cada rechazo siguen quedando el día y el motivo, durante 30 días (#11,
  decisión de Hernán en #37). En particular, no se guarda ni se muestra la hora de un rechazo.

#### Lo que ve la persona

- **FR-003**: Con un último rechazo y sin el tope, el estado del pedido DEBE mostrar el motivo y el
  consejo de ese último rechazo, con los intentos que quedan. El resumen de «Mi perfil» muestra
  el día de ese mismo último rechazo, como hoy.
- **FR-004**: En la pantalla de «Sin intentos», el estado DEBE mostrar el motivo y el consejo del
  último rechazo y la fecha desde la que se puede volver a pedir.
- **FR-005**: El motivo y el consejo que se muestran DEBEN salir siempre del mismo rechazo: nunca
  el motivo de uno con el consejo de otro.
- **FR-006**: El motivo y el consejo que muestra el estado DEBEN ser los mismos que dice el correo
  de ese último rechazo. El correo no cambia.
- **FR-007**: El estado DEBE mostrar un solo rechazo, el último: a la persona no se le muestra la
  lista de sus rechazos anteriores.
- **FR-008**: Lo que muestra el estado NO DEBE depender de que el correo del rechazo haya llegado.

#### Lo que no cambia

- **FR-009**: La cuenta de intentos NO DEBE cambiar: se siguen contando los rechazos de los últimos
  30 días, el tope sigue siendo 3, y la fecha desde la que se puede volver a pedir es la que ya
  calcula #11 (30 días después del día del más viejo de los rechazos que dejan en el tope).
- **FR-010**: La lista de motivos, sus consejos, los textos del estado y los correos NO DEBEN
  cambiar.
- **FR-011**: Un pedido en revisión, aprobado o vencido se sigue mostrando como hoy, sin el motivo
  de ningún rechazo anterior.

#### Lo que ve quien administra

- **FR-012**: Al abrir un pedido en la cola de revisión, quien administra DEBE ver los rechazos de
  los últimos 30 días de esa persona del más reciente al más viejo, y dentro de un mismo día, del
  último resuelto al primero. Cada rechazo sigue mostrando solo su día y su motivo.
- **FR-013**: Sin rechazos en los últimos 30 días, la parte de rechazos no se muestra, como hoy.

#### Privacidad

- **FR-014**: Quién ve los rechazos NO DEBE cambiar: su día y su motivo los ven solo la persona
  dueña del pedido (el último, en su estado) y quien administra (todos, al revisar). Una persona
  que no ingresó o que ingresó con otra cuenta NO DEBE poder ver los rechazos, los motivos ni los
  consejos de otra persona.
- **FR-015**: Quien intenta ver el estado de su pedido sin haber ingresado DEBE ser llevado a
  ingresar y, al hacerlo, volver a su estado, como hoy.

#### Medición

- **FR-016**: Esta historia NO DEBE agregar eventos de medición. Se lee en los que ya registra
  #11: pedidos aprobados después de un rechazo y topes de intentos alcanzados.

### Key Entities

- **Rechazo**: el día y el motivo de un pedido rechazado, durante 30 días, visible para la persona
  dueña y para quien administra. Esta historia suma una sola propiedad a lo que ya se sabe de él:
  su lugar en el orden en que se resolvieron los rechazos de esa persona, sin datos nuevos sobre
  ella.
- **Estado del pedido**: lo que la persona ve de su verificación. En los estados «rechazado» y
  «Sin intentos», toma el motivo y el consejo del último rechazo.

## Pantallas

- **Estado de mi pedido** (de #11, la pantalla de verificar la identidad): el
  último rechazo con su motivo, su consejo y los intentos que quedan. Cargando: como hoy. Vacío: si
  nunca pedí, explica para qué sirve el nivel 2 y ofrece empezar, como hoy. Error: si no se pudo
  traer el estado, lo dice y ofrece probar de nuevo, como hoy. No cambia su aspecto: solo qué
  rechazo muestra.
- **Resumen en «Mi perfil»** (de #11): no cambia; con rechazos el mismo día, el día que muestra es
  el del último rechazo, que es el mismo día.
- **Sin intentos** (de #11): el motivo y el consejo del último rechazo y desde qué fecha se puede
  pedir de nuevo. Cargando y error: los del estado de mi pedido. Vacío: no aplica, solo existe con
  el tope alcanzado.
- **Cola de revisión, un pedido abierto** (de #11): los rechazos anteriores de la persona, del más
  reciente al más viejo, también dentro del mismo día. Cargando y error: como hoy. Vacío: sin
  rechazos en los últimos 30 días, no muestra esa parte, como hoy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de los casos con dos o más rechazos el mismo día, el estado del pedido y
  la pantalla de «Sin intentos» muestran el motivo y el consejo del último rechazo resuelto.
- **SC-002**: En el 100 % de los rechazos, mientras son el último, el motivo y el consejo del
  estado coinciden con los de su correo.
- **SC-003**: 0 casos en los que el estado muestre el motivo de un rechazo con el consejo de otro.
- **SC-004**: La cantidad de intentos que quedan y la fecha para volver a pedir son idénticas a las
  de antes del arreglo en todos los casos.
- **SC-005**: En el 100 % de los pedidos abiertos en la cola de una persona con rechazos el mismo
  día, esos rechazos aparecen con el último resuelto primero.
- **SC-006**: Ningún dato nuevo sobre la persona se guarda ni se muestra: de cada rechazo, en
  cualquier pantalla, se ve solo su día y su motivo.

## Assumptions

- **Alcance reducido por lo ya construido**: ver «Ya construido» arriba. Nada de #80 está en main;
  lo de #11 se conserva y solo se prueba donde su conducta cambia (varios rechazos el mismo día).
- **«Cualquier rechazo» en el criterio del correo** (historia, Camino feliz 3): se lee como «el
  estado que se ve mientras ese rechazo es el último». Un rechazo que ya no es el último no se
  muestra en el estado (FR-007), así que su correo no tiene con qué compararse.
- **El orden de resolución se puede reconstruir para los rechazos ya guardados** (Edge Cases): la
  historia no pide dato nuevo y exige el orden correcto también para el caso que KL-11-6 y KL-11-7
  describen, que ya existe. Cómo se desempata dentro del día sin guardar la hora lo decide el
  plan.
- **El día de un rechazo nunca retrocede**: un rechazo resuelto después de otro cae el mismo día o
  un día posterior (día de Uruguay), así que ordenar por día y, dentro del día, por orden de
  resolución es lo mismo que ordenar por orden de resolución.
- **La decisión del enjambre** de la historia (2026-09-28, product-owner: la cola de revisión
  ordena los rechazos del mismo día del más reciente al más viejo) se copia palabra por palabra a
  `docs/03` §1 en esta rama.
- **KL-11-6 y KL-11-7** se resuelven con esta historia y sus entradas se borran de las limitaciones
  conocidas en el mismo PR, como se hizo con KL-024 en #35.
- **Fuera de esta historia**, como dice la historia: cambiar la cantidad de intentos, el plazo de
  30 días, la lista de motivos o los consejos; cambiar el correo del rechazo; mostrarle a la
  persona la lista de todos sus rechazos anteriores; guardar algo más de cada rechazo que el día y
  el motivo.
