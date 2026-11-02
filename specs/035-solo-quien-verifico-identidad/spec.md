# Feature Specification: Ver solo los animales de quien verificó su identidad, en el listado y en mis avisos

**Feature Branch**: `feature/285-solo-quien-verifico-identidad`

**Created**: 2026-11-02

**Status**: Draft

**Input**: Historia #285 del backlog. El cuerpo verbatim de la historia acompaña a esta spec
(`story.md`).

**Ya construido** (en `main`, no se rehace): el listado con sus seis filtros (especie, sexo, tamaño,
edad, departamento y castrado), que viajan en el enlace, se suman entre sí y se sacan con «Sacar los
filtros» (#57); las camadas como una sola tarjeta del listado (#205); los avisos por correo con
«Avisame cuando haya uno así», «Mis avisos», el tope de 3, el correo de las 8 y «Dejar de recibir»
(#265, #267); el nivel de quien publicó en cada tarjeta del listado, con las mismas palabras que la
ficha (#273). De esta historia no hay nada en `main`: nadie puede elegir por el nivel de quien
publica. Esta spec suma ese filtro al listado y a los avisos, sin cambiar cómo se verifica nadie ni
qué dice cada tarjeta.

**Vocabulario de esta spec**:

- **El filtro**: «Solo de quien verificó su identidad», la única opción del grupo «Quien publica» en
  los filtros del listado.
- **Tiene la identidad verificada**: la tarjeta de sus animales dice hoy «Identidad verificada» o
  el nivel que suma un aval encima (docs/03 §1). Quien tiene solo el teléfono verificado no la tiene,
  y tampoco quien tiene un pedido de verificación en revisión, rechazado, vencido o retirado.
- **Un aviso**: los filtros del listado que una persona guardó para que le lleguen por correo los
  animales nuevos, como los define #265.
- **Nuevo**: lo que aparece en el listado por primera vez después de lo que ya miró el correo
  anterior de ese aviso (#265).
- **Un momento** es lo que ya llega a la herramienta de medición cuando pasa algo en el sitio, sin
  la persona.
- En los ejemplos, Carla tiene la identidad verificada y publicó a Tobi; Rita tiene solo el teléfono
  verificado y publicó a Luna; Bruno busca adoptar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filtrar el listado por quien verificó su identidad (Priority: P1)

Bruno llega al listado desde un enlace pegado en un grupo de Facebook. Abre los filtros y, después de
«Castrado», encuentra «Quien publica» con «Solo de quien verificó su identidad». Lo marca junto con
«Perro» y «Montevideo», toca «Ver resultados» y ve solo los perros en Montevideo de quien tiene la
identidad verificada, con el total de lo que quedó. Copia el enlace y lo manda a su pareja, que lo
abre en otro teléfono y ve lo mismo.

**Why this priority**: es la pregunta de la hipótesis hecha de frente a quien adopta: si elige ver
solo a quien verificó su identidad. Con esta parte sola ya se puede filtrar y compartir el enlace.

**Independent Test**: con personas sembradas con solo el teléfono, con la identidad verificada y con
la identidad y un aval, cada una con animales sueltos y alguna con una camada, abrir el listado sin
cuenta, marcar el filtro solo y junto con otros, y ver solo lo de quien tiene la identidad
verificada, con el total correcto; copiar el enlace y abrirlo en otra sesión con los mismos filtros
marcados; abrir un enlace con el valor del filtro alterado y ver el listado sin el filtro y con los
demás; aprobar la identidad de Rita y ver a Luna en el listado filtrado en la siguiente apertura.

**Acceptance Scenarios**:

1. **Dado** que Carla tiene la identidad verificada y publicó a Tobi, y Rita tiene solo el teléfono
   verificado y publicó a Luna, **cuando** Bruno, sin entrar con su cuenta, elige «Solo de quien
   verificó su identidad» y toca «Ver resultados», **entonces** ve a Tobi y no a Luna, y el total
   dice 1 animal.
2. **Dado** que nadie eligió el filtro, **cuando** cualquiera abre el listado, **entonces** ve a
   Tobi y a Luna como hoy, con o sin identidad verificada de quien publicó.
3. **Dado** que Bruno filtró por «Perro», «Montevideo» y «Solo de quien verificó su identidad»,
   **cuando** copia el enlace del listado y lo abre en otro teléfono, **entonces** se ve el mismo
   listado con los tres filtros marcados.
4. **Dado** que Bruno tiene el filtro marcado con otros, **cuando** toca «Sacar los filtros»,
   **entonces** se sacan todos, el filtro también, y vuelve el listado de siempre.
5. **Dado** que Carla tiene la identidad verificada y avalada y publicó una camada, **cuando** Bruno
   filtra, **entonces** la camada aparece como una sola tarjeta, igual que sin el filtro.
6. **Dado** que Carla tenía la identidad verificada y avalada y quitó de su perfil su único aval,
   **cuando** Bruno mira el listado filtrado, **entonces** los animales de Carla siguen ahí, y su
   tarjeta dice que tiene la identidad verificada.
7. **Dado** que a Rita le aprueban hoy la identidad, **cuando** Bruno abre o recarga el listado
   filtrado, **entonces** ya ve a Luna, y su tarjeta dice «Identidad verificada».
8. **Dado** que ninguna persona con la identidad verificada tiene un animal que coincida con los
   filtros de Bruno, **cuando** ve el listado, **entonces** ve que no hay animales con estos
   filtros, con «Sacar los filtros» y «Avisame cuando haya uno así» a mano.
9. **Dado** que se cortó la conexión o el sitio no respondió, **cuando** Bruno elige el filtro,
   **entonces** ve el mensaje de que no se pudo y los animales de los filtros anteriores, sin que la
   pantalla diga que el filtro está puesto.
10. **Dado** que alguien abre un enlace del listado con un valor del filtro alterado, **cuando** se
    carga la pantalla, **entonces** ve el listado sin ese filtro y con los demás que sí se
    entienden.
11. **Dado** que el listado filtrado tiene más animales de los que entran en la primera tanda,
    **cuando** Bruno toca «Ver más», **entonces** los siguientes siguen siendo solo de quien tiene la
    identidad verificada.

---

### User Story 2 - Guardar un aviso con el filtro (Priority: P2)

Bruno no encuentra hoy un perro de quien verificó su identidad en Montevideo. Con los tres filtros
marcados toca «Avisame cuando haya uno así». En «Mis avisos» ve «Perros en Montevideo, de quien
verificó su identidad», al lado de «Perros en Montevideo», el aviso que ya tenía.

**Why this priority**: un aviso con el filtro es alguien que prefiere esperar a una persona verificada
antes que volver al grupo. Necesita el filtro de la parte 1.

**Independent Test**: con una persona sembrada con cuenta, crear un aviso con el filtro y otros, uno
con el filtro solo y otro con los mismos filtros sin él; ver los tres en «Mis avisos» con sus nombres;
intentar un cuarto y ver el tope; empezar sin cuenta, entrar desde «Avisame cuando haya uno así» y ver
el aviso guardado con el filtro.

**Acceptance Scenarios**:

1. **Dado** que Bruno entró con su cuenta y tiene marcados «Perro», «Montevideo» y «Solo de quien
   verificó su identidad», **cuando** toca «Avisame cuando haya uno así», **entonces** en «Mis
   avisos» aparece «Perros en Montevideo, de quien verificó su identidad».
2. **Dado** que Bruno ya tiene «Perros en Montevideo», **cuando** crea un aviso con los mismos
   filtros más «Solo de quien verificó su identidad», **entonces** se crea uno nuevo, y «Mis avisos»
   muestra los dos.
3. **Dado** que Bruno ya tiene «Perros en Montevideo, de quien verificó su identidad», **cuando**
   vuelve a pedir un aviso con esos mismos filtros, **entonces** no se crea otro y ve lo que el sitio
   ya le dice hoy cuando el aviso existe.
4. **Dado** que Bruno tiene 3 avisos, **cuando** intenta crear uno con el filtro, **entonces** ve que
   llegó al máximo de 3 y tiene a mano «Mis avisos» para borrar uno.
5. **Dado** que Bruno no entró con su cuenta y tiene el filtro marcado, **cuando** toca «Avisame
   cuando haya uno así», entra y vuelve al listado, **entonces** el aviso queda guardado con el
   filtro, igual que con los otros.
6. **Dado** que Bruno tiene marcado solo el filtro, sin ningún otro, **cuando** crea el aviso,
   **entonces** «Mis avisos» lo nombra como todos los animales en adopción de quien verificó su
   identidad.
7. **Dado** que Bruno tiene un aviso con el filtro en «Mis avisos», **cuando** toca «Ver en el
   listado», **entonces** el listado abre con el filtro marcado junto con los demás del aviso.
8. **Dado** que Bruno borra el aviso o su cuenta, **cuando** se borra, **entonces** la elección del
   filtro se va con él, como el resto del aviso.

---

### User Story 3 - El correo de las 8 respeta el filtro (Priority: P3)

Ayer después de las 8, Carla publicó un perro en Montevideo y Rita publicó otro. A las 8 de la mañana
a Bruno le llega el correo de siempre: la parte de su aviso con el filtro trae el perro de Carla y no
el de Rita, y su enlace abre el listado con el filtro marcado.

**Why this priority**: un aviso que ignora el filtro le manda a Bruno lo que pidió no ver. Necesita el
aviso con el filtro de la parte 2.

**Independent Test**: con avisos sembrados con y sin el filtro y animales nuevos de personas con y sin
la identidad verificada, correr la tarea de las 8 y leer el correo de cada persona; aprobar después
la identidad de quien quedó afuera y correr la tarea del día siguiente sin que ese animal llegue.

**Acceptance Scenarios**:

1. **Dado** que Bruno tiene «Perros en Montevideo, de quien verificó su identidad» y ayer después de
   las 8 Carla publicó un perro en Montevideo y Rita publicó otro, **cuando** son las 8 de la mañana,
   **entonces** a Bruno le llega un correo con el perro de Carla y sin el de Rita.
2. **Dado** que Rita publicó un perro en Montevideo ayer, no entró en el correo de Bruno, y hoy le
   aprueban la identidad, **cuando** sale el correo de mañana, **entonces** ese perro no llega,
   aunque ya se ve en el listado filtrado.
3. **Dado** que Bruno tiene también «Perros en Montevideo», sin el filtro, **cuando** sale el correo,
   **entonces** esa parte trae los dos perros, como hoy, y la del filtro trae solo el de Carla.
4. **Dado** que el aviso con el filtro tiene algo nuevo, **cuando** Bruno lee el correo,
   **entonces** el nombre de esa parte suma «de quien verificó su identidad» y su enlace abre el
   listado con el filtro marcado; el resto del correo queda como hoy.
5. **Dado** que lo único nuevo para el aviso con el filtro es de quien no tenía la identidad
   verificada a la hora del correo, **cuando** son las 8, **entonces** ese aviso no suma ninguna parte
   y, si no hay nada más para Bruno, no le llega correo.
6. **Dado** que Carla tiene la identidad verificada y publicó una camada en Montevideo, **cuando**
   sale el correo del aviso con el filtro, **entonces** la camada llega como una sola, igual que sin
   el filtro.

---

### User Story 4 - Medir si quien adopta elige ver solo a quien verificó su identidad (Priority: P4)

Elegir el filtro llega en el mismo momento que cualquier otro filtro del listado, con su propia
opción. Crear un aviso con él suma uno a la cantidad de filtros, como hoy. Cuántos avisos guardan el
filtro se cuenta en la base, sin nombres. docs/03 §Métricas de éxito suma cómo se lee, al lado de la
lectura 5.

**Why this priority**: convierte el filtro en una respuesta a la hipótesis. No cambia lo que ve
nadie, y las otras partes andan sin ella.

**Independent Test**: marcar el filtro solo y con otros, crear avisos con y sin él, y leer en el
registro de la medición la opción del filtro y la cantidad de filtros, sin quién; contar en la base
los avisos con el filtro sin traer a quién son; repetir con la medición caída.

**Acceptance Scenarios**:

1. **Dado** que Bruno elige el filtro y toca «Ver resultados», **cuando** se aplica, **entonces**
   llega el momento de filtro elegido de siempre con la opción propia del filtro, aparte de las demás.
2. **Dado** que Bruno crea un aviso con «Perro», «Montevideo» y el filtro, **cuando** se crea,
   **entonces** el momento de aviso creado cuenta 3 filtros.
3. **Dado** que se lee cualquier momento de esta historia, **cuando** se revisa lo que lleva,
   **entonces** no tiene quién, qué aviso ni qué animal.
4. **Dado** que alguien cuenta en la base los avisos que guardan el filtro, **cuando** mira el
   resultado, **entonces** ve una cantidad, sin personas ni otros filtros al lado.
5. **Dado** que la herramienta de medición no responde, **cuando** Bruno filtra o crea un aviso,
   **entonces** todo termina igual y nadie ve ningún mensaje nuevo.
6. **Dado** que alguien lee docs/03 §Métricas de éxito, **cuando** busca el filtro, **entonces**
   encuentra, al lado de la lectura 5, qué parte de las visitas al listado elige ver solo a quien
   verificó su identidad, qué parte de los avisos lo guarda y, siguiendo esas visitas, cuántas
   terminan en «Quiero adoptar» y en una solicitud mandada, con la advertencia de que con 3 a 5
   rescatistas los números son una señal y no una prueba.

---

### Edge Cases

- **El nivel cuenta en el momento de mirar**: el listado usa el mismo nivel que la tarjeta muestra en
  ese momento; nunca deja afuera a alguien cuya tarjeta dice «Identidad verificada», ni deja adentro
  a alguien cuya tarjeta dice «Teléfono verificado».
- **Identidad y aval**: quien tiene la identidad verificada y además un aval entra, igual que quien la
  tiene sin aval. Un aval sin la identidad no existe (docs/03 §1).
- **Pedido en revisión, rechazado, vencido o retirado**: quien publica queda afuera igual que quien
  nunca la pidió; el listado no dice ni deja adivinar cuál de esas es.
- **Quien publica pierde el teléfono verificado**: sus animales ya no están en el listado de siempre,
  así que tampoco en el filtrado, aunque tenga la identidad.
- **Bloqueos y suspensiones**: el filtro no cambia las reglas de quién se ve; lo que hoy no aparece
  sigue sin aparecer.
- **Una camada** sigue el nivel de quien la publicó, como cualquier animal suyo, y aparece como una
  sola tarjeta.
- **El filtro solo**, sin ningún otro, es un listado filtrado: tiene «Sacar los filtros» y, con
  resultados o sin ellos, el ofrecimiento del aviso de siempre.
- **El filtro repetido o con mayúsculas en el enlace** se entiende igual que los demás filtros; un
  valor que no se entiende se ignora sin error.
- **Un enlace viejo del listado**, de antes de esta historia, se abre como siempre, sin el filtro.
- **Un aviso creado antes de esta historia** queda sin el filtro y su correo no cambia.
- **El nivel baja entre que se publica y el correo** (por ejemplo, se le quita a quien publica la
  identidad verificada): lo que cuenta es el nivel a la hora del correo; si no la tiene, ese animal no
  llega y no llega después.
- **Dos avisos con los mismos filtros salvo el filtro** son dos avisos distintos y los dos cuentan
  para el tope de 3.
- **El correo de un día con partes con y sin el filtro**: cada parte sigue su aviso; un animal puede
  estar en una parte y no en la otra.
- **La portada, los animales del perfil público, los sugeridos de Mi solicitud y la ficha** no tienen
  el filtro y no cambian.
- **Cargando**: el listado filtrado se carga como con cualquier otro filtro.

## Requirements *(mandatory)*

### Functional Requirements

#### El filtro en el listado

- **FR-001**: Los filtros del listado DEBEN sumar el grupo «Quien publica», después de «Castrado», con
  una sola opción, «Solo de quien verificó su identidad», en el teléfono y en la computadora.
- **FR-002**: El filtro DEBE estar apagado si nadie lo elige: el listado de siempre DEBE seguir
  mostrando a todos, con identidad verificada o sin ella, en el mismo orden de hoy.
- **FR-003**: Con el filtro puesto, el listado DEBE mostrar solo los animales y las camadas de quien
  tiene la identidad verificada, con aval o sin él, y el total DEBE contar solo eso.
- **FR-004**: El filtro DEBE usar el nivel que quien publica tiene en el momento de mirar, el mismo
  que dice su tarjeta: a quien le aprueban la identidad, sus animales DEBEN aparecer en el listado
  filtrado desde la siguiente vez que se abre o se recarga.
- **FR-005**: Una camada DEBE seguir el nivel de quien la publicó y verse como una sola tarjeta, igual
  que sin el filtro.
- **FR-006**: El filtro DEBE sumarse a los demás («perros chicos en Montevideo de quien verificó su
  identidad») y seguir puesto al pedir más animales con «Ver más».
- **FR-007**: El filtro DEBE viajar en el enlace del listado como los demás filtros: dos personas con
  los mismos filtros comparten el mismo enlace, y abrirlo en otro lado DEBE mostrar el mismo listado
  con los mismos filtros marcados.
- **FR-008**: Un valor del filtro que no se entiende en el enlace DEBE ignorarse sin error, y el
  listado DEBE mostrarse sin él y con los demás filtros que sí se entienden.
- **FR-009**: «Sacar los filtros» DEBE sacar también este filtro.
- **FR-010**: Sin resultados, el listado filtrado DEBE mostrar el vacío de hoy para un listado
  filtrado, con «Sacar los filtros» y «Avisame cuando haya uno así». Cargando y error DEBEN ser los de
  cualquier otro filtro: si elegir el filtro falla, la persona DEBE ver el mensaje de que no se pudo y
  los animales de los filtros anteriores, sin que la pantalla diga que el filtro está puesto.
- **FR-011**: Con el filtro puesto, cada tarjeta DEBE seguir diciendo el nivel de quien publicó como
  desde #273; el filtro no cambia nada de la tarjeta.
- **FR-012**: El filtro NO DEBE ordenar el listado por nivel ni poner primero a quien verificó, y NO
  DEBE aparecer en la portada, en los animales del perfil público, en los sugeridos de Mi solicitud ni
  en la ficha. Tampoco DEBE cambiar lo que pide cada ficha para mandar una solicitud, ni la invitación
  a verificar de «Mis animales», ni decirle a quien publica cuánta gente filtra.

#### El filtro en los avisos

- **FR-013**: «Avisame cuando haya uno así» DEBE guardar el filtro junto con los demás filtros del
  aviso, también cuando la persona entra con su cuenta en el medio y vuelve al listado.
- **FR-014**: Un aviso con el filtro y otro con los mismos filtros pero sin él DEBEN ser dos avisos
  distintos, y los dos DEBEN contar para el tope de 3. Dos avisos con los mismos filtros, el filtro
  incluido, DEBEN seguir siendo el mismo aviso.
- **FR-015**: «Mis avisos» DEBE nombrar en palabras un aviso con el filtro sumándole «de quien verificó
  su identidad» al nombre de hoy («Perros en Montevideo, de quien verificó su identidad»). «Ver en el
  listado» DEBE abrir el listado con el filtro marcado. El vacío, la carga y el error de «Mis avisos»
  NO DEBEN cambiar.
- **FR-016**: Llegar al tope con un aviso con el filtro DEBE verse igual que hoy: que llegó al máximo
  de 3, con «Mis avisos» a mano. Si crear el aviso falla por la conexión o porque el sitio no
  respondió, la persona DEBE ver lo mismo que hoy y el aviso NO DEBE quedar guardado a medias, sin el
  filtro.
- **FR-017**: Los avisos creados antes de esta historia DEBEN quedar sin el filtro y su correo DEBE
  seguir igual.

#### El correo de las 8

- **FR-018**: Un aviso con el filtro DEBE traer en el correo solo los animales y las camadas nuevos de
  quien tenía la identidad verificada a la hora del correo.
- **FR-019**: Un animal que no entró en el correo de un aviso con el filtro porque quien lo publicó no
  tenía la identidad verificada NO DEBE llegar en un correo posterior de ese aviso, aunque quien lo
  publicó la verifique después: ya no es nuevo (#265).
- **FR-020**: En el correo, el nombre de la parte de un aviso con el filtro DEBE sumar «de quien
  verificó su identidad», igual que en «Mis avisos», y su enlace al listado DEBE abrir con el filtro
  marcado. Nada más del correo cambia: ni la hora, ni la cantidad por parte, ni el armado, ni «Dejar
  de recibir».

#### Privacidad

- **FR-021**: El filtro NO DEBE pedir ningún dato nuevo y DEBE usar solo lo que la tarjeta ya muestra a
  cualquiera: si quien publica tiene la identidad verificada.
- **FR-022**: El filtro NUNCA DEBE separar a quien tiene un pedido de verificación en revisión,
  rechazado, vencido o retirado de quien no la pidió: todos quedan afuera por igual.
- **FR-023**: La elección del filtro en un aviso DEBE verla solo la persona dueña del aviso, como el
  resto de sus filtros; quien administra no la ve, y DEBE borrarse con el aviso o con la cuenta (#265,
  Ley 18.331).
- **FR-024**: El listado filtrado DEBE seguir las reglas del listado para buscadores, sin ninguna
  excepción nueva.

#### Medición

- **FR-025**: Elegir el filtro DEBE contarse en el mismo momento que cualquier otro filtro del listado,
  con su opción propia, aparte de las de los demás filtros.
- **FR-026**: Crear un aviso con el filtro DEBE sumar uno a la cantidad de filtros que ya cuenta el
  momento de aviso creado. No DEBE sumarse ningún momento nuevo.
- **FR-027**: Cuántos avisos guardan el filtro DEBE poder contarse en la base sin traer a quién son.
- **FR-028**: Ningún momento de esta historia DEBE llevar quién, qué aviso ni qué animal, y medir NUNCA
  DEBE cambiar lo que la persona hace ni lo que ve: si la medición no responde, el listado y el aviso
  terminan igual y sin mensajes nuevos.
- **FR-029**: docs/03 §Métricas de éxito, «Cómo se leen», DEBE sumar al lado de la lectura 5 cómo se
  lee el filtro: qué parte de las visitas al listado elige ver solo a quien verificó su identidad, qué
  parte de los avisos lo guarda (contado en la base, sin nombres) y, siguiendo esas visitas, cuántas
  terminan en «Quiero adoptar» y en una solicitud mandada; y la advertencia de que con 3 a 5
  rescatistas los números son una señal y no una prueba.

### Key Entities

- **Filtros del listado** (ya existen): suman uno, «Quien publica», con una sola opción. Viajan en el
  enlace como los demás.
- **Aviso** (ya existe): guarda, además de sus filtros de hoy, si tiene el filtro de quien verificó su
  identidad. Esa elección forma parte de lo que hace a dos avisos iguales o distintos. La ve solo su
  dueña y se borra con el aviso o con la cuenta.
- **Nivel de quien publica** (ya existe): el mismo que dice la tarjeta del listado; el filtro lo lee y
  no lo cambia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas con personas sembradas, el listado filtrado muestra todos los
  animales y camadas de quien tiene la identidad verificada que el listado de siempre muestra con los
  mismos otros filtros, y ninguno de quien no la tiene.
- **SC-002**: En el 100 % de las pruebas, el listado sin el filtro muestra lo mismo que antes de esta
  historia, en el mismo orden.
- **SC-003**: Un enlace del listado con el filtro abierto en otra sesión muestra el mismo listado con
  los mismos filtros marcados, y uno con el valor alterado muestra el listado sin el filtro y con los
  demás, sin error.
- **SC-004**: Desde el listado, quien busca pone el filtro con un toque más que cualquier otro filtro
  y guarda un aviso con él con el mismo toque de hoy.
- **SC-005**: En el 100 % de las corridas de prueba de la tarea de las 8, un aviso con el filtro trae
  solo lo nuevo de quien tenía la identidad verificada a esa hora, y nada que haya quedado afuera en
  una corrida anterior.
- **SC-006**: En las capturas a 390 y 1280 px, el grupo «Quien publica» va después de «Castrado» y se
  lee entero, sin scroll horizontal.
- **SC-007**: En el 100 % de los momentos de esta historia leídos en el registro de la medición, el
  filtro aparece con su opción propia y ninguno lleva quién, qué aviso ni qué animal.
- **SC-008**: Después de la beta, docs/03 permite contestar con los números de la herramienta y de la
  base qué parte de quien busca elige ver solo a quien verificó su identidad, leído como señal al
  lado de la lectura 5.

## Assumptions

- **Ya en `main`**: el listado y sus filtros (#57), las camadas (#205), los avisos por correo (#265) y
  el nivel en cada tarjeta (#273). De esta historia no hay nada construido.
- Es una feature y no un cambio chico: el aviso guarda una elección nueva y el correo de las 8 cambia
  qué manda, aunque el filtro del listado use un dato que la tarjeta ya muestra.
- **El nombre de un aviso con el filtro y ningún otro** es el de hoy sin filtros con la misma suma:
  todos los animales en adopción, de quien verificó su identidad. La historia da solo el ejemplo con
  otros filtros, y la misma suma en todos los casos se lee igual en «Mis avisos» y en el correo.
- **El filtro se elige como «Solo castrados»**: una casilla que se marca o no y se aplica como los
  demás filtros, al marcarla o con «Ver resultados» cuando la página anda sin scripts.
- **«Elegir el filtro» se cuenta como cualquier otro filtro**: al aplicarlo, con la opción que se sumó,
  en el momento de filtro elegido que ya existe. No se mide sacarlo, igual que con los demás.
- **A la hora del correo** significa el nivel que quien publicó tiene cuando corre la tarea de las 8,
  el mismo que diría su tarjeta en ese momento. Un animal que queda afuera por eso cuenta como ya
  mirado para ese aviso, por la regla de #265 de que solo es nuevo lo que aparece por primera vez.
- **Los avisos de antes** no tienen el filtro: nadie lo pudo elegir, y no se les agrega.
- **Lo que vale la pena probar**: la regla de qué entra en el listado filtrado y en el correo, que el
  filtro forma parte de lo que hace distintos a dos avisos, la lectura del enlace con valores
  alterados y el nombre del aviso. Son las cosas que, si se rompen, le muestran a Bruno algo que pidió
  no ver.
- Las decisiones del enjambre de la historia van, palabra por palabra, a docs/03 §3 y §Métricas de
  éxito en esta rama.
- Las referencias tipo «docs/03 §Hipótesis» son citas a documentos; los números de tres cifras son
  issues, px o la Ley 18.331.
