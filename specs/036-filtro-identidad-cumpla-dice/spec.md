# Feature Specification: Que el filtro «Solo de quien verificó su identidad» y sus avisos cumplan lo que dicen

**Feature Branch**: `feature/287-filtro-identidad-cumpla-dice`

**Created**: 2026-11-02

**Status**: Draft

**Input**: Historia #287 del backlog. El cuerpo verbatim de la historia acompaña a esta spec
(`story.md`).

**Ya construido** (en `main`, no se rehace): el listado con sus siete filtros, que viajan en el
enlace, se suman entre sí y se sacan con «Sacar los filtros» (#57, #285); el mensaje de que no se pudo
cuando falla el pedido de un filtro, con «Reintentar» (#57); los avisos por correo con «Avisame cuando
haya uno así», «Mis avisos», el tope de 3, el correo de las 8 y la regla de que cada animal va una
sola vez (#265); el asunto y el título que cuentan a cada animal una vez (#267); el filtro «Solo de
quien verificó su identidad» en el listado, en los avisos y en el correo (#285); la confirmación «Te
vamos a avisar por correo.» cuando el aviso se pide con los filtros que vinieron en el enlace o al
volver de entrar con la cuenta. **Ya en `main` de esta historia: nada.** Revisado en `main` (29d7f89):
el correo pone cada animal en el aviso más viejo que lo trae, sin mirar el filtro de identidad; el
listado deja marcados los filtros nuevos cuando falla el pedido; y la confirmación no aparece cuando
los filtros se marcaron en la página. Esta spec arregla esas tres cosas y no cambia nada más del
filtro, de los avisos ni del correo.

**Vocabulario de esta spec**:

- **El filtro**: «Solo de quien verificó su identidad», la opción del grupo «Quien publica» en los
  filtros del listado (#285).
- **Un aviso con el filtro**: un aviso que guardó el filtro junto con los demás.
- **El listado que se ve**: los animales que están a la vista, con los filtros con los que se
  pidieron. Mientras llega un filtro nuevo, siguen a la vista los de antes, apagados (#57).
- **El pedido falla**: se cortó la conexión o el sitio no respondió al pedir los animales de un
  filtro recién marcado o sacado.
- **Lo nuevo de un aviso**: lo que el correo de las 8 junta para ese aviso, con la regla de #265.
- **La lectura 12**: la de docs/03 §Métricas de éxito que mira si quien adopta elige ver solo a quien
  verificó su identidad.
- En los ejemplos, Carla tiene la identidad verificada y publicó a Tobi; Rita tiene solo el teléfono
  verificado y publicó a Luna y a Rulo; Bruno busca adoptar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El listado nunca dice un filtro que no cumple (Priority: P1)

Bruno ve todos los animales, entre ellos a Luna, de Rita. Marca «Solo de quien verificó su identidad»
justo cuando se le corta la conexión. Ve el mensaje de que no se pudo, la casilla desmarcada y a Luna
en el listado. Lo que dice la pantalla coincide con lo que ve: no hay nada que le haga creer que Rita
verificó su identidad.

**Why this priority**: es la falla que puede engañar a una persona. Quien no lee el aviso puede
pedirle un animal a Rita creyendo que está verificada, que es justo la confianza que pone a prueba
docs/03 §Hipótesis. Esta parte sola ya arregla eso.

**Independent Test**: con personas sembradas con solo el teléfono y con la identidad verificada,
abrir el listado con y sin filtros, cortar la conexión (o hacer que el sitio no responda) y marcar o
sacar distintos filtros; en cada caso, mirar que las casillas marcadas, el enlace del listado y la
presencia de «Sacar los filtros» correspondan a los animales a la vista, y que aparezca el aviso de
que no se pudo; volver la conexión, tocar «Reintentar» y ver el listado con lo que se había marcado.

**Acceptance Scenarios**:

1. **Dado** que Bruno ve todos los animales, entre ellos a Luna de Rita, que tiene solo el teléfono
   verificado, y se corta la conexión, **cuando** marca «Solo de quien verificó su identidad»,
   **entonces** ve el mensaje de que no se pudo, la casilla desmarcada, el enlace del listado sin el
   filtro, sin «Sacar los filtros», y a Luna en el listado.
2. **Dado** que Bruno ya filtraba por «Montevideo» y se corta la conexión, **cuando** marca «perro»,
   **entonces** queda marcado solo «Montevideo», con «Sacar los filtros», y se ven los animales de
   Montevideo de antes.
3. **Dado** que Bruno tenía marcados «Montevideo» y el filtro y se corta la conexión, **cuando**
   desmarca el filtro, **entonces** el filtro vuelve a quedar marcado, junto con «Montevideo», el
   enlace los lleva a los dos y se siguen viendo los animales de Montevideo de quien verificó su
   identidad.
4. **Dado** que el pedido del filtro falló y Bruno ve el mensaje con los filtros de antes, **cuando**
   vuelve la conexión y toca «Reintentar», **entonces** se piden de nuevo los filtros que había
   marcado y, si llegan, ve esos animales con esos filtros marcados, en el enlace y sin el mensaje.
5. **Dado** que el pedido del filtro falló, **cuando** Bruno vuelve a marcar el filtro con la
   conexión de vuelta, **entonces** el listado se filtra como siempre.
6. **Dado** que alguien abre un enlace del listado con el filtro y el sitio no responde, **cuando** se
   carga la pantalla, **entonces** ve el error del listado de hoy, con su botón para volver a probar,
   sin animales que digan cumplir el filtro.
7. **Dado** que Bruno marca el filtro y el pedido falla, **cuando** se lee la medición, **entonces**
   la elección del filtro se contó como hoy se cuenta cuando la persona lo marca, aunque el listado
   no haya cargado.

---

### User Story 2 - El correo de las 8 trae la parte del aviso con el filtro (Priority: P2)

Bruno tiene «Perros en Montevideo» y, más nuevo, el mismo aviso con «Solo de quien verificó su
identidad». Ayer Carla publicó a Tobi y Rita a Rulo, los dos perros en Montevideo. A las 8 le llega un
correo con Tobi en la parte «Perros en Montevideo, de quien verificó su identidad» y Rulo en la parte
«Perros en Montevideo». Ve que el aviso con el filtro anda.

**Why this priority**: hoy esa parte nunca aparece si la persona tiene también el aviso sin el
filtro, porque el animal ya fue en el aviso más viejo. Puede pensar que el aviso no anda y borrarlo, y
la lectura 12 pierde justo a quien eligió esperar a una persona verificada. No engaña sobre la
verificación de nadie, por eso va después de la parte 1.

**Independent Test**: con una persona sembrada con avisos con y sin el filtro, creados en distinto
orden, y animales y camadas nuevos de personas con y sin la identidad verificada, correr la tarea de
las 8 y leer el correo: en qué parte va cada animal, que ninguno aparezca dos veces, que no haya
partes vacías y que el asunto cuente a cada animal una vez.

**Acceptance Scenarios**:

1. **Dado** que Bruno tiene «Perros en Montevideo» y, más nuevo, el mismo aviso con «Solo de quien
   verificó su identidad», y ayer después de las 8 Carla, con la identidad verificada, publicó a Tobi
   y Rita publicó a Rulo, los dos perros en Montevideo, **cuando** son las 8 de la mañana,
   **entonces** le llega un correo con Tobi en la parte «Perros en Montevideo, de quien verificó su
   identidad» y Rulo en la parte «Perros en Montevideo», y el asunto cuenta 2.
2. **Dado** que los dos animales nuevos que coinciden con los dos avisos de Bruno son de quien tiene
   la identidad verificada, **cuando** sale el correo, **entonces** trae solo la parte con el filtro,
   con los dos, y no una parte vacía de «Perros en Montevideo».
3. **Dado** que Bruno tiene «Perros de quien verificó su identidad» y, más nuevo, «Perros en
   Montevideo, de quien verificó su identidad», y Carla publicó un perro en Montevideo, **cuando**
   sale el correo, **entonces** el perro va una sola vez, en el aviso más viejo.
4. **Dado** que Bruno tiene dos avisos sin el filtro que traen el mismo animal, **cuando** sale el
   correo, **entonces** el animal va en el más viejo, como hoy.
5. **Dado** que Carla publicó una camada de perros en Montevideo y Bruno tiene los dos avisos de la
   escena 1, **cuando** sale el correo, **entonces** la camada va una sola vez, como una sola, en la
   parte del aviso con el filtro.
6. **Dado** que el aviso con el filtro tiene más animales nuevos de los que entran en su parte,
   **cuando** sale el correo, **entonces** los que no entran no pasan a la parte del aviso sin el
   filtro, y el asunto los cuenta igual, como desde #267.

---

### User Story 3 - La confirmación del aviso aparece también con filtros marcados en la página (Priority: P3)

Bruno entró con su cuenta, abrió el listado sin filtros y marcó «perro» y «Solo de quien verificó su
identidad». Toca «Avisame cuando haya uno así» y, en lugar del botón, ve «Te vamos a avisar por
correo.» con el enlace a «Mis avisos». Sabe que quedó guardado y no lo vuelve a tocar.

**Why this priority**: el aviso se guarda igual; lo que falta es que la pantalla lo diga. Molesta y
puede llevar a tocar de nuevo, pero no engaña sobre nadie ni pierde nada. Las otras partes andan sin
esta.

**Independent Test**: con una persona sembrada con cuenta, abrir el listado sin filtros, marcar
filtros en la página y pedir el aviso en cada situación (nuevo, uno que ya tiene, con 3 avisos, con la
conexión cortada); ver en cada caso lo mismo que se ve hoy cuando los filtros vienen en el enlace, y
ver el aviso en «Mis avisos» cuando corresponde; cambiar un filtro después y ver de nuevo el botón.

**Acceptance Scenarios**:

1. **Dado** que Bruno entró con su cuenta, abrió el listado sin filtros y marcó «perro» y «Solo de
   quien verificó su identidad» en la página, **cuando** toca «Avisame cuando haya uno así»,
   **entonces** en lugar del botón ve «Te vamos a avisar por correo.» con el enlace a «Mis avisos», y
   ahí está el aviso.
2. **Dado** que Bruno marcó en la página filtros de un aviso que ya tiene, **cuando** toca «Avisame
   cuando haya uno así», **entonces** ve «Ya tenés este aviso.» con el enlace a «Mis avisos», y no se
   crea otro.
3. **Dado** que Bruno tiene 3 avisos y marcó filtros en la página, **cuando** toca «Avisame cuando
   haya uno así», **entonces** ve que llegó al máximo de 3 con el enlace para borrar uno en «Mis
   avisos».
4. **Dado** que se cortó la conexión, **cuando** Bruno toca «Avisame cuando haya uno así» después de
   marcar filtros en la página, **entonces** ve «No pudimos crear el aviso. Probá de nuevo.» y el
   botón sigue a mano.
5. **Dado** que Bruno guardó un aviso y ve la confirmación, **cuando** marca otro filtro, **entonces**
   vuelve a ver «Avisame cuando haya uno así» para la nueva combinación.
6. **Dado** que los filtros marcados en la página dejan el listado vacío, **cuando** Bruno toca
   «Avisame cuando haya uno así» en el vacío, **entonces** la confirmación ocupa el lugar del botón en
   el vacío, igual que junto al total.

---

### Edge Cases

- **Cargando**: mientras llega un filtro nuevo, la pantalla se ve como hoy (lo marcado y los animales
  de antes, apagados). La regla de que el listado no dice un filtro que no cumple vale para lo que
  queda a la vista cuando el pedido termina, bien o mal.
- **Varios cambios seguidos**: si Bruno marca un filtro y otro antes de que llegue el primero, cuenta
  el último pedido, como hoy; si ese falla, vuelven los filtros del listado que se ve, no los de un
  pedido intermedio.
- **Sacar los filtros falla**: si «Sacar los filtros» no puede traer el listado, vuelven a quedar
  marcados los filtros de antes, con «Sacar los filtros» a mano y el mensaje de que no se pudo.
- **El listado que se ve estaba vacío**: si con «gato» y «Rivera» no había animales y falla el pedido
  al marcar «cachorro», vuelven «gato» y «Rivera», con el vacío de esos filtros, sus acciones y el
  mensaje de que no se pudo.
- **El listado nunca cargó**: si el enlace abrió con el error del listado y Bruno marca otro filtro y
  vuelve a fallar, quedan los filtros con los que se abrió, con el error de hoy.
- **«Ver más» después de una falla**: como los animales a la vista cumplen los filtros marcados,
  «Ver más» sigue esa misma tanda.
- **Volver atrás desde una ficha** después de una falla repone el listado que se veía, con sus
  filtros.
- **«Avisame cuando haya uno así» después de una falla** pide el aviso de los filtros que quedaron
  marcados, que son los del listado que se ve.
- **Una confirmación y un cambio que falla**: si Bruno ve la confirmación, marca otro filtro y el
  pedido falla, vuelven los filtros de antes con «Avisame cuando haya uno así»; tocarlo dice «Ya tenés
  este aviso.», como hoy con un aviso repetido.
- **Sin sesión**, «Avisame cuando haya uno así» con filtros marcados en la página lleva a entrar y, al
  volver, guarda el aviso de esos filtros con la confirmación, como hoy.
- **El correo con un solo aviso**, o sin ningún aviso con el filtro, sale como hoy.
- **Un animal que coincide solo con el aviso sin el filtro** (por ejemplo, de Rita) va en esa parte,
  aunque la persona tenga también el aviso con el filtro.
- **El orden de las partes del correo** sigue siendo el de hoy; lo que cambia es en qué parte va cada
  animal.
- **Sin animales nuevos en ninguna parte** no sale correo, como hoy.
- **La portada, el perfil público y los sugeridos** no tienen el filtro y no cambian.

## Requirements *(mandatory)*

### Functional Requirements

#### El listado cuando falla un filtro

- **FR-001**: Cuando el pedido de un filtro recién marcado o sacado falla, el listado DEBE volver a
  mostrar marcados exactamente los filtros del listado que se ve, para cualquier filtro del listado,
  el de identidad incluido.
- **FR-002**: En ese caso, el enlace del listado DEBE llevar los mismos filtros que quedan marcados, y
  «Sacar los filtros» DEBE aparecer solo si quedó alguno marcado.
- **FR-003**: En ese caso, el listado DEBE mostrar el mensaje de hoy de que no se pudo, que dice que
  son los animales de los filtros anteriores, y DEBE seguir mostrando esos animales con su total.
- **FR-004**: El listado NUNCA DEBE quedar quieto mostrando un filtro marcado, ni llevándolo en su
  enlace, si los animales a la vista no lo cumplen.
- **FR-005**: «Reintentar», después de una falla de un filtro, DEBE volver a pedir los filtros que la
  persona había marcado; si llegan, el listado DEBE mostrarlos marcados con sus animales, y si vuelve
  a fallar, DEBE volver a los del listado que se ve.
- **FR-006**: Elegir el filtro de identidad DEBE seguir contándose cuando la persona lo marca, aunque
  después el listado no cargue, como hoy. Volver a marcarlo después de una falla es otra elección y
  se cuenta; «Reintentar» no suma otra.
- **FR-007**: El listado NO DEBE reintentar solo un pedido que falló.
- **FR-008**: Abrir un enlace del listado cuando el sitio no responde DEBE mostrar el error del
  listado de hoy, con su botón para volver a probar y sin animales.
- **FR-009**: Después de una falla, «Ver más», volver atrás desde una ficha y «Avisame cuando haya uno
  así» DEBEN usar los filtros que quedaron marcados.

#### El correo de las 8

- **FR-010**: Si un animal o una camada nuevo coincide con varios avisos de la persona y alguno tiene
  el filtro, DEBE ir en la parte de un aviso con el filtro: el más viejo de los que lo tienen.
- **FR-011**: Si ninguno de esos avisos tiene el filtro, DEBE ir en la parte del más viejo, como hoy.
- **FR-012**: Cada animal o camada DEBE seguir yendo una sola vez por correo (#265).
- **FR-013**: Una parte que se queda sin animales NO DEBE aparecer, y sin animales en ninguna parte
  NO DEBE salir correo, como hoy.
- **FR-014**: El asunto y el título DEBEN contar a cada animal una vez, también los que no entran en
  su parte, como desde #267.
- **FR-015**: NO DEBEN cambiar la hora del correo, cuántos animales lleva cada parte, cómo se nombra
  cada aviso, el orden de las partes, qué cuenta como nuevo para un aviso (#265) ni «Dejar de
  recibir».

#### La confirmación del aviso

- **FR-016**: Después de pedir un aviso con filtros marcados en la página, la persona DEBE ver la
  misma respuesta que ve hoy cuando los filtros vinieron en el enlace: «Te vamos a avisar por correo.»
  con el enlace a «Mis avisos» si se creó, «Ya tenés este aviso.» con ese enlace si ya lo tenía, y
  que llegó al máximo de 3 con el enlace para borrar uno si tiene 3.
- **FR-017**: La respuesta DEBE ocupar el lugar del botón, junto al total o en el vacío, y quedarse
  ahí mientras los filtros marcados no cambien.
- **FR-018**: Si crear el aviso falla, la persona DEBE ver «No pudimos crear el aviso. Probá de
  nuevo.» con el botón a mano, como hoy.
- **FR-019**: Cambiar los filtros después de la respuesta DEBE volver a mostrar «Avisame cuando haya
  uno así» para la nueva combinación, también si el cambio falla y vuelven los filtros de antes.
- **FR-020**: «Mis avisos» NO DEBE cambiar.

#### Privacidad y alcance

- **FR-021**: Nada de esta historia DEBE pedir ni guardar un dato nuevo, ni mostrarle a nadie algo que
  hoy no ve. El correo DEBE seguir llevando solo lo que el listado ya muestra a cualquiera.
- **FR-022**: NO DEBEN cambiar qué deja ver el filtro, sus opciones, dónde aparece, el tope de 3
  avisos ni la medición: no se suma ningún momento.

### Key Entities

- **Filtros del listado** (ya existen): lo marcado en la pantalla y en el enlace. Con esta historia,
  cuando falla un pedido, vuelven a ser los del listado que se ve.
- **Aviso** (ya existe): sus filtros, el de identidad incluido, y cuándo se creó, que dice cuál es el
  más viejo. No cambia lo que guarda.
- **Parte del correo** (ya existe): un aviso con lo nuevo que le toca. Cambia a qué parte va un animal
  que coincide con varios avisos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas con el pedido de un filtro fallado (cualquier filtro,
  marcado o sacado, con el listado lleno, vacío o sin cargar), los filtros marcados, el enlace y
  «Sacar los filtros» corresponden a los animales a la vista cuando el pedido termina.
- **SC-002**: En el 100 % de las corridas de prueba de la tarea de las 8 con avisos con y sin el
  filtro, un animal que coincide con un aviso con el filtro va en esa parte, ninguno va dos veces,
  ninguna parte sale vacía y el asunto cuenta a cada animal una vez.
- **SC-003**: Con el aviso con el filtro y el mismo sin él, quien recibe animales nuevos de quien
  verificó su identidad ve en el correo la parte con el filtro el 100 % de las veces.
- **SC-004**: En el 100 % de las pruebas, pedir un aviso con filtros marcados en la página muestra la
  misma respuesta que con los filtros del enlace, en el mismo lugar, con un solo toque.
- **SC-005**: En las capturas a 390 y 1280 px, el mensaje de que no se pudo y la confirmación del aviso
  se leen enteros, sin scroll horizontal.
- **SC-006**: La medición sigue contando la elección del filtro y la creación de avisos como antes de
  esta historia; la lectura 12 empieza a recibir fichas abiertas desde la parte con el filtro.

## Assumptions

- **Ya en `main`**: el listado y sus filtros (#57), el filtro de identidad (#285), los avisos y el
  correo de las 8 (#265, #267). De esta historia no hay nada construido: revisado en `main` (29d7f89).
- Es una feature y no un cambio chico: cambia la regla de reparto del correo de las 8, una tarea que
  corre sola, y trae 11 criterios.
- **«Reintentar» pide de nuevo lo que la persona había marcado.** La historia hace volver los filtros
  anteriores, pero no dice qué hace «Reintentar», que ya existe junto al mensaje de que no se pudo. Si
  pidiera los filtros que quedaron marcados, traería lo mismo que se ve y no serviría. Mientras ese
  pedido llega, la pantalla se ve como cualquier carga de hoy.
- **Cargando sigue como hoy.** La historia dice «Vacío, cargando y error: los de hoy». Mientras llega
  un filtro, la casilla marcada con los animales de antes apagados es la carga de hoy y no lo que la
  regla corrige, que es la pantalla quieta después de una falla.
- **Vale también para sacar un filtro y para «Sacar los filtros».** La historia habla de «un filtro
  recién marcado»; la regla de negocio es una sola («el listado nunca muestra un filtro marcado […] si
  los animales a la vista no lo cumplen») y la decisión del enjambre la extiende a cualquier filtro.
  Al sacar uno y fallar, los animales a la vista cumplen el filtro que se sacó, así que vuelve a
  quedar marcado.
- **«Aviso» es solo el que se guarda** con «Avisame cuando haya uno así» (docs/06). Lo que el listado
  muestra cuando falla un pedido se llama en esta spec «el mensaje de que no se pudo», aunque la
  historia le diga aviso.
- **El listado vacío que falla** vuelve a los filtros de ese vacío, con el vacío y el mensaje de que no
  se pudo, por la regla «quedan marcados los filtros que tenía el listado que se ve».
- **La medición no cambia**: el filtro se cuenta cuando se marca (docs/03 lectura 12: «se cuenta cada
  vez que alguien lo marca»). Volver a marcarlo después de una falla es marcarlo otra vez; «Reintentar»
  no lo cuenta de nuevo, como hoy.
- **El orden de las partes del correo no cambia** (del aviso más viejo al más nuevo). La historia dice
  en qué parte va cada animal y no pide reordenar.
- **Un animal que no entra en los de su parte** queda contado en esa parte y no pasa a otra, como hoy
  (#265, #267).
- **La «Probar de nuevo» del criterio de error al abrir** es el botón que el error del listado ya
  tiene hoy; la historia pide «Vacío, cargando y error: los de hoy», así que no se cambia su texto.
- **Lo que vale la pena probar**: la regla del listado ante una falla (qué queda marcado y qué dice el
  enlace), la regla de reparto del correo y que la confirmación se quede con filtros marcados en la
  página. Son las tres cosas que, si se rompen, engañan a Bruno o le hacen creer que el aviso no anda.
- Las decisiones del enjambre de la historia van, palabra por palabra, a docs/03 §3 en esta rama.
- Las referencias tipo «docs/03 §Hipótesis» son citas a documentos; los números de tres cifras son
  issues o px.
