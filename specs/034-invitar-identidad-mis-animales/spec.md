# Feature Specification: Que «Mis animales» invite a verificar la identidad y diga qué cambia en las publicaciones

**Feature Branch**: `feature/281-mis-animales-invite-verificar`

**Created**: 2026-11-02

**Status**: Draft

**Input**: Historia #281 del backlog. El cuerpo verbatim de la historia acompaña a esta spec
(`story.md`).

**Ya construido** (en `main`, no se rehace): la verificación de identidad entera desde «Mi perfil»,
con su consentimiento, la revisión a mano, la espera de hasta 2 días, el vencimiento a los 7, el
tope de 3 rechazos en 30 días, retirar el pedido de verificación y los correos de aprobado,
rechazado y vencido (#11); el pedido de verificación ya guarda desde dónde se empezó, y la pregunta
de por qué se deja la verificación ya cuenta con su origen (publicar, solicitar, por su cuenta y
«se la pidió quien publicó», #234 y #257); el correo de identidad aprobada ya suma un segundo enlace
cuando el pedido empezó en «Quiero adoptar» (#63); «Mis animales» con sus animales y camadas (#53,
#205, #269, #271); el nivel de quien publicó en la ficha, la tarjeta del listado, la vista previa del
enlace y el cartel (#244, #273, #275). Hoy «Mis animales» no tiene ninguna invitación a verificar la
identidad: esta spec suma esa invitación, un origen nuevo para el pedido que empieza desde ella y lo
que se mide alrededor, sin tocar cómo se verifica.

**Vocabulario de esta spec**:

- **La invitación**: el cartel de «Mis animales» que invita a verificar la identidad, con
  «Verificar mi identidad» y «Ahora no».
- **El pedido de verificación**: la cédula y la selfie que la persona manda para verificar su
  identidad, con su estado de siempre (en revisión, aprobado, rechazado, vencido, retirado), como lo
  nombra docs/06. Esta spec nunca lo llama «solicitud», que es la de adopción.
- **Una publicación**: un animal o una camada de «Mis animales», en cualquier estado (disponible,
  en proceso, pausado, vencido, adoptado). Una camada cuenta como una sola publicación.
- **Puede pedirla hoy**: no tiene un pedido de verificación en revisión y no está en el tope de 3
  pedidos rechazados en 30 días (docs/03 §1). Un pedido rechazado sin llegar al tope, vencido o
  retirado no impide pedirla.
- **Un momento** es lo que ya llega a la herramienta de medición cuando pasa algo en el sitio, sin
  la persona.
- En los ejemplos, Carla publicó a Tobi y tiene solo el teléfono verificado; Diego es otra persona
  con su propia cuenta; Ana publicó la camada de Kira.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver la invitación en «Mis animales» y verificarse desde ahí (Priority: P1)

Carla abre «Mis animales» en el teléfono. Debajo del título y de «Publicar un animal», arriba de sus
animales, ve un cartel que le dice que puede verificar su identidad y que, si lo hace, Tobi va a
decir «Identidad verificada» en vez de «Teléfono verificado» en su ficha, en el listado, en la vista
previa del enlace y en el cartel. Una línea le cuenta que las fotos de la cédula se borran después de
revisarlas y que la revisión tarda hasta 2 días. Toca «Verificar mi identidad», hace los mismos pasos
que desde «Mi perfil» y, cuando vuelve a «Mis animales», la invitación ya no está porque su pedido
está en revisión.

**Why this priority**: es la mitad de la hipótesis que nadie lee: si quien rescata paga la fricción
de la verificación con su propia identidad cuando el sitio se la ofrece en el lugar donde mira sus
fichas. Con esta parte sola ya hay rescatistas que pueden pasar a nivel 2 desde «Mis animales».

**Independent Test**: con personas sembradas en cada caso (teléfono verificado con un animal, con
solo una camada adoptada, sin publicaciones, con la identidad aprobada, con un pedido en revisión,
con un pedido rechazado, con tres rechazos en 30 días, sin teléfono verificado), abrir «Mis
animales» con cada una y ver la invitación solo donde corresponde; tocar «Verificar mi identidad»,
mandar las fotos y volver a «Mis animales» sin la invitación; abrir con otra cuenta las pantallas
de Carla y no ver nada de la invitación.

**Acceptance Scenarios**:

1. **Dado** que Carla tiene el teléfono verificado, no tiene la identidad y publicó a Tobi,
   **cuando** abre «Mis animales» en el teléfono, **entonces** ve arriba de sus animales la
   invitación con «Verificar mi identidad» y «Ahora no», que dice que Tobi va a decir «Identidad
   verificada» en su ficha, en el listado, en la vista previa del enlace y en el cartel, que las
   fotos de la cédula se borran después de revisarlas y que la revisión tarda hasta 2 días;
   «Publicar un animal» sigue siendo la acción principal de la pantalla.
2. **Dado** que Carla tocó «Verificar mi identidad», **cuando** manda las dos fotos, **entonces** su
   pedido queda en revisión con los mismos pasos que desde «Mi perfil», y al volver a «Mis animales»
   la invitación ya no aparece.
3. **Dado** que Carla tocó «Verificar mi identidad» y se fue sin mandar las fotos, **cuando** vuelve
   a «Mis animales», **entonces** ve la invitación de nuevo.
4. **Dado** que el pedido de Carla se rechazó por una foto borrosa y no llegó al tope, o venció sin
   resolverse, o lo retiró, **cuando** vuelve a «Mis animales», **entonces** ve la invitación de
   nuevo.
5. **Dado** que es el tercer rechazo de Carla en 30 días, **cuando** abre «Mis animales» mientras
   dura el tope, **entonces** no ve la invitación; **y cuando** el tope termina, **entonces** la
   vuelve a ver, salvo que haya tocado «Ahora no».
6. **Dado** que Diego tiene la identidad verificada, o tiene un pedido en revisión, o perdió el
   teléfono verificado al cambiar de chip, **cuando** abre «Mis animales», **entonces** no ve la
   invitación y la pantalla queda como hoy.
7. **Dado** que Ana tiene el teléfono verificado y no publicó nada, **cuando** abre «Mis animales»,
   **entonces** ve la pantalla vacía de hoy, que la invita a publicar, sin la invitación.
8. **Dado** que Ana publicó solo la camada de Kira y todas sus crías ya se adoptaron, **cuando** abre
   «Mis animales», **entonces** ve la invitación, como con cualquier otra publicación.
9. **Dado** que Carla tiene «Mis animales» abierto en dos pestañas y en una mandó el pedido,
   **cuando** toca «Verificar mi identidad» en la otra, **entonces** llega a la verificación de
   identidad, que le muestra el pedido en revisión como hoy, y no puede mandar un segundo pedido.
10. **Dado** que en ese momento no se puede saber el estado de la verificación de Carla, **cuando**
    abre «Mis animales», **entonces** no ve la invitación y ve sus animales como siempre, sin ningún
    aviso.
11. **Dado** que Carla tiene la invitación en «Mis animales», **cuando** Diego abre el perfil público
    de Carla, la ficha de Tobi o «Mis animales» con su propia cuenta, **entonces** no ve nada de la
    invitación de Carla.
12. **Dado** que Carla tiene la invitación en la lista de «Mis animales», **cuando** abre la página
    de Tobi o la de una camada dentro de «Mis animales», o «Mi perfil», **entonces** no ve la
    invitación ahí: «Mi perfil» sigue ofreciendo la verificación como hoy.

---

### User Story 2 - Cerrar la invitación con «Ahora no» (Priority: P2)

Carla no quiere pasar por la cédula ahora. Toca «Ahora no» y la invitación se va. Al día siguiente, y
un mes después, abre «Mis animales» y no la vuelve a ver, aunque su situación cambie. Si algún día
quiere verificarse, lo hace desde «Mi perfil» como hoy.

**Why this priority**: sin una salida que se respete, la invitación se vuelve la persecución que el
sitio promete ahorrar (docs/01 §Huevo y gallina), y quien dijo que no deja de mirar «Mis animales».
Necesita la invitación de la parte 1.

**Independent Test**: con una persona sembrada que ve la invitación, tocar «Ahora no», recargar y
volver otro día sin verla; simular un pedido rechazado y un tope vencido después de tocarlo y seguir
sin verla; cortar la conexión al tocar «Ahora no» y ver que se va igual y que vuelve a aparecer en la
próxima apertura.

**Acceptance Scenarios**:

1. **Dado** que Carla ve la invitación, **cuando** toca «Ahora no», **entonces** la invitación se va
   de la pantalla en el momento, sin recargarla y sin perder lo que estaba mirando.
2. **Dado** que Carla tocó «Ahora no», **cuando** vuelve a «Mis animales» al día siguiente o un mes
   después, **entonces** no ve la invitación, y en «Mi perfil» sigue pudiendo pedir la verificación.
3. **Dado** que Carla tocó «Ahora no» y después pidió la verificación desde «Mi perfil» y se la
   rechazaron o venció, **cuando** vuelve a «Mis animales», **entonces** no ve la invitación.
4. **Dado** que Carla tiene la invitación a la vista y se cortó la conexión, **cuando** toca «Ahora
   no», **entonces** la invitación se va de la pantalla igual, sin ningún aviso de error, y puede
   volver a aparecer la próxima vez que abra «Mis animales», porque no se pudo guardar que la cerró.
5. **Dado** que Carla toca «Ahora no» dos veces seguidas o en dos pestañas, **cuando** vuelve a «Mis
   animales», **entonces** no ve la invitación y queda guardado un solo día.

---

### User Story 3 - El correo de identidad aprobada lleva a «Mis animales» (Priority: P3)

Quien administra aprueba el pedido que Carla empezó desde la invitación. Le llega el correo de
identidad aprobada de siempre, con un enlace más a «Mis animales», donde la tarjeta de Tobi ya dice
«Identidad verificada».

**Why this priority**: cierra la vuelta: Carla ve en el lugar donde mira sus fichas que lo que la
invitación prometía es cierto. Necesita el pedido con su origen de la parte 1.

**Independent Test**: aprobar desde la revisión un pedido sembrado que empezó en la invitación y
otro que empezó en «Mi perfil»; el primero trae el enlace a «Mis animales» y el segundo es igual al
de hoy.

**Acceptance Scenarios**:

1. **Dado** que quien administra aprueba el pedido que Carla empezó desde la invitación, **cuando**
   llega el correo de identidad aprobada, **entonces** trae, además de lo de hoy, un enlace a «Mis
   animales», donde la tarjeta de Tobi ya dice «Identidad verificada».
2. **Dado** que el pedido empezó en «Mi perfil» o en «Quiero adoptar», **cuando** se aprueba,
   **entonces** el correo es el de hoy, sin el enlace a «Mis animales».
3. **Dado** que el pedido que empezó desde la invitación se rechaza o vence, **cuando** llega el
   correo, **entonces** es el de hoy, sin el enlace a «Mis animales».

---

### User Story 4 - Medir si quien rescata se verifica cuando el sitio se lo ofrece (Priority: P4)

Cada vez que se abre «Mis animales» con la invitación a la vista llega un momento; también cuando se
toca «Ahora no». El pedido que empieza desde la invitación lleva su propio origen en cada paso que ya
se cuenta y en la pregunta «¿Qué te frena?». docs/03 §Métricas de éxito suma cómo se lee: ¿quien
rescata pasa por la verificación de identidad cuando el sitio se la ofrece?

**Why this priority**: es lo que convierte la invitación en una respuesta a la hipótesis. Agrega
momentos sin cambiar lo que ve nadie, y las otras partes andan sin ella.

**Independent Test**: abrir «Mis animales» con la invitación, tocar «Ahora no», empezar un pedido
desde la invitación, aceptar el consentimiento, mandarlo, retirarlo, y aprobar, rechazar y vencer
otros sembrados con ese origen; leer en el registro de la medición cada momento con el origen de la
invitación y sin quién, qué animal ni qué camada. Repetir con la medición caída.

**Acceptance Scenarios**:

1. **Dado** que Carla abre «Mis animales» con la invitación a la vista, **cuando** la pantalla se
   muestra, **entonces** llega un momento de invitación mostrada, uno por apertura.
2. **Dado** que Carla toca «Ahora no», **cuando** se cierra la invitación, **entonces** llega un
   momento de «Ahora no».
3. **Dado** que Carla empezó el pedido desde la invitación, **cuando** lo empieza, acepta el
   consentimiento, lo manda, lo retira, vence, se aprueba o se rechaza, **entonces** cada uno de esos
   momentos llega con el origen de la invitación, aparte del de «Mi perfil».
4. **Dado** que Carla llegó a la verificación desde la invitación y se va sin mandar el pedido,
   **cuando** se le hace la pregunta «¿Qué te frena?», **entonces** lo que conteste, o que no
   conteste, cuenta con el origen de la invitación, aparte de publicar, solicitar, por su cuenta y
   «se la pidió quien publicó».
5. **Dado** que se lee cualquier momento de esta historia, **cuando** se revisa lo que lleva,
   **entonces** no tiene quién, qué animal ni qué camada, como el resto de la medición.
6. **Dado** que la herramienta de medición no responde, **cuando** Carla abre «Mis animales», toca
   «Ahora no» o pide la verificación desde la invitación, **entonces** todo termina igual y nadie ve
   ningún aviso nuevo.
7. **Dado** que alguien lee docs/03 §Métricas de éxito, **cuando** busca la invitación, **entonces**
   encuentra la lectura «¿quien rescata pasa por la verificación de identidad cuando el sitio se la
   ofrece?», con lo que se cuenta y la advertencia de que con 3 a 5 rescatistas los números son una
   señal y no una prueba.

---

### Edge Cases

- **La persona tiene la identidad aprobada y perdió el teléfono**: no tiene el teléfono verificado,
  así que no ve la invitación; ya hizo lo que la invitación le pide.
- **La persona perdió el teléfono verificado** (otra cuenta se quedó con el número): no ve la
  invitación; ve el aviso de hoy de que sus animales no se ven y cómo confirmar el número. Nunca ve
  los dos carteles juntos.
- **Una camada sola cuenta** aunque todas sus crías estén adoptadas, en proceso o pausadas.
- **La persona borra su última publicación**: «Mis animales» queda vacío y sin invitación, como hoy.
  Si publica de nuevo, la invitación vuelve si se cumplen las demás condiciones y no tocó «Ahora no».
- **Con más de una publicación, o con una sola que hoy no está en el listado** (adoptada,
  pausada, vencida, dada de baja, o una camada sin crías que se puedan pedir), la invitación no nombra a ningún
  animal: dice que lo que publica va a decir «Identidad verificada» en esos mismos cuatro lugares.
  Nombrar a un animal que no está en el listado diría algo que no es cierto.
- **Toca «Verificar mi identidad» y en la verificación toca «Ahora no» o cancela**: vuelve a «Mis
  animales», donde la invitación sigue apareciendo; el «Ahora no» de la verificación no es el de la
  invitación y no la cierra.
- **Toca «Verificar mi identidad» y la verificación le pide primero el teléfono** (lo perdió entre
  que abrió «Mis animales» y el toque): el camino de siempre le pide el teléfono y después sigue a la
  identidad.
- **El pedido se aprueba con la persona sin teléfono verificado**: el correo es el de hoy para ese
  caso, con el enlace a «Mis animales» igual.
- **El pedido que empezó desde la invitación se retira desde «Mi perfil» o desde la verificación**:
  el momento de retiro lleva el origen de la invitación, porque el origen es del pedido.
- **La persona llega al tope con un pedido que empezó en la invitación**: el tope se cuenta igual que
  hoy, sin importar desde dónde se pidió.
- **Guardar «Ahora no» falla** después de que la invitación se fue: no hay aviso ni reintento; la
  próxima apertura decide de nuevo con lo que quedó guardado.
- **La persona borra su cuenta**: el día de «Ahora no» se borra con ella (Ley 18.331).
- **Quien administra revisa el pedido**: la revisión se ve como hoy y no dice desde dónde se empezó.
- **Cargando**: la invitación llega con la pantalla o no llega; nunca aparece después empujando la
  lista hacia abajo.

## Requirements *(mandatory)*

### Functional Requirements

#### Cuándo aparece

- **FR-001**: «Mis animales» DEBE mostrar la invitación solo cuando la persona tiene al menos una
  publicación ahí, tiene el teléfono verificado, no tiene la identidad verificada, puede pedirla hoy
  y nunca tocó «Ahora no» en la invitación (o no quedó guardado). Si falta cualquiera de esas cosas,
  NO DEBE aparecer y la pantalla DEBE quedar como hoy.
- **FR-002**: La invitación NO DEBE aparecer en ninguna otra pantalla: ni en la página de un animal o
  de una camada, ni al publicar, ni en la confirmación de una publicación, ni en «Mi perfil», ni por
  correo. Tampoco DEBE aparecer a quien no publicó nada.
- **FR-003**: Una camada DEBE contar como cualquier otra publicación, en cualquier estado de sus
  crías.
- **FR-004**: Si en ese momento no se puede saber el estado de la verificación de la persona o si
  tocó «Ahora no», la invitación NO DEBE aparecer y el resto de «Mis animales» DEBE funcionar como
  hoy, sin ningún aviso.
- **FR-005**: Un pedido de verificación que vence sin resolverse, que se rechaza sin llegar al tope o
  que se retira DEBE volver a dejar ver la invitación, mientras no se haya tocado «Ahora no». Al
  terminar el tope, también.

#### Qué dice

- **FR-006**: La invitación DEBE decir que la persona puede verificar su identidad; en qué lugares va
  a cambiar «Teléfono verificado» por «Identidad verificada» (la ficha, cada tarjeta del listado, la
  vista previa del enlace y el cartel); que las fotos de la cédula se borran después de revisarlas; y
  que la revisión tarda hasta 2 días.
- **FR-007**: Con una sola publicación y que hoy se ve en el listado, la invitación DEBE nombrar a ese
  animal, o a la camada por su nombre; en cualquier otro caso DEBE hablar de lo que la
  persona publica, sin nombrar a ningún animal, para no decir que algo va a cambiar en el listado
  donde ese animal no está.
- **FR-008**: La invitación NO DEBE prometer más solicitudes, más adopciones ni nada que el sitio no
  muestre: dice solo qué cambia en lo que ven los demás y qué pasa con las fotos de la cédula.
- **FR-009**: La invitación DEBE ir arriba de la lista de publicaciones, debajo del título y de
  «Publicar un animal», con «Verificar mi identidad» como acción secundaria y «Ahora no» como acción
  discreta. «Publicar un animal» DEBE seguir siendo la acción principal de la pantalla. Va como un cartel
  de la casa, con la identidad «Cartel» de siempre.
- **FR-009a**: A 1280 px la invitación NO DEBE quedar como una franja angosta con la mitad de la hoja
  vacía ni separar la lista de su título (docs/11, 2026-09-20); a 390 px DEBE leerse entera sin
  scroll horizontal.
- **FR-010**: La invitación DEBE estar en la pantalla desde que se muestra o no estar; NO DEBE
  aparecer después moviendo la lista.

#### «Verificar mi identidad»

- **FR-011**: «Verificar mi identidad» DEBE llevar a la verificación de identidad que ya existe, con
  sus mismos pasos, consentimiento, revisión, topes y textos. Si al llegar la persona ya tiene un
  pedido en revisión, la verificación DEBE mostrárselo como hoy, sin dejar mandar un segundo pedido.
- **FR-012**: El pedido de verificación que se empieza desde la invitación DEBE guardar ese origen,
  aparte de «Mi perfil», y borrarse con las mismas reglas que cualquier pedido de verificación.
- **FR-013**: Las salidas de la verificación sin mandar el pedido («Ahora no» y cancelar) DEBEN volver
  a «Mis animales» cuando se llegó desde la invitación. Al mandar el pedido, la persona DEBE ver lo
  mismo que ve hoy al mandarlo desde «Mi perfil».
- **FR-014**: Llegar a la verificación de identidad sin venir de la invitación DEBE comportarse como
  hoy.

#### «Ahora no»

- **FR-015**: «Ahora no» DEBE sacar la invitación de la pantalla en el momento, sin recargarla, y
  guardar el día en que se tocó para no volver a mostrarla nunca
  a esa persona.
- **FR-016**: Si guardar «Ahora no» falla, la invitación DEBE irse igual, sin aviso de error ni
  reintento, y PUEDE volver a aparecer en la próxima apertura.
- **FR-017**: Tocar «Ahora no» más de una vez, o en dos pestañas, DEBE dejar un solo día guardado.
- **FR-018**: Haber tocado «Ahora no» NO DEBE cambiar nada de la verificación desde «Mi perfil».

#### El correo de identidad aprobada

- **FR-019**: Cuando se aprueba un pedido de verificación que empezó desde la invitación, el correo
  de identidad aprobada DEBE sumar, a lo de hoy, un enlace a «Mis animales».
- **FR-020**: El correo de un pedido que empezó en otro lado, y los de rechazo y vencimiento de
  cualquier origen, DEBEN quedar como hoy.

#### Privacidad

- **FR-021**: Que a una persona se le mostró la invitación, que la cerró o que pidió la verificación
  desde ahí NO DEBE verlo nadie más: ni otras personas, ni el perfil público, ni la ficha, ni quien
  administra en la revisión o en ninguna otra pantalla.
- **FR-022**: De «Ahora no» el sitio DEBE guardar solo el día en que se tocó, usarlo solo para
  decidir si muestra la invitación y borrarlo al borrar la cuenta (Ley 18.331).
- **FR-023**: Esta historia NO DEBE guardar nada nuevo de la cédula ni de la selfie, que se siguen
  borrando después de revisar.
- **FR-024**: «Mis animales» sigue siendo privada y NO DEBE aparecer en buscadores.

#### Medición

- **FR-025**: Cada apertura de «Mis animales» con la invitación a la vista DEBE mandar un momento de
  invitación mostrada; tocar «Ahora no» DEBE mandar un momento propio.
- **FR-026**: Los momentos que ya se cuentan del pedido de verificación (empezado, aceptado el
  consentimiento, mandado, retirado, vencido, aprobado, rechazado, y el tope si se llega a él) DEBEN
  llevar el origen de la invitación cuando el pedido empezó desde ella.
- **FR-027**: La pregunta «¿Qué te frena?» (#234) DEBE contar con un origen propio de la invitación
  cuando la persona llegó a la verificación desde ella, aparte de publicar, solicitar, por su cuenta y
  «se la pidió quien publicó».
- **FR-028**: Ningún momento de esta historia DEBE llevar quién, qué animal ni qué camada, y medir
  NUNCA DEBE cambiar lo que la persona hace ni lo que ve: si la medición no responde, la pantalla, «Ahora
  no» y el pedido terminan igual y sin avisos nuevos.
- **FR-029**: docs/03 §Métricas de éxito, «Cómo se leen», DEBE sumar la lectura «¿quien rescata pasa
  por la verificación de identidad cuando el sitio se la ofrece?»: los pedidos mandados y aprobados con
  el origen de la invitación sobre las veces que se mostró y al lado de los «Ahora no»; por qué se va
  quien empieza y no termina, con ese origen al lado de los de solicitar, publicar y el pedido de quien
  publicó; qué parte de quienes publican tiene la identidad verificada antes y después del día en que
  llega la historia, contado en la base sin nombres; lo que gana la lectura 5 cuando hay rescatistas
  en más de un nivel; y la advertencia de que con 3 a 5 rescatistas los números son una señal y no una
  prueba.

### Key Entities

- **«Ahora no» de la invitación**: uno por persona, a lo sumo; guarda solo el día en que se tocó. Lo
  usa el sitio para no volver a mostrar la invitación. No lo ve nadie, tampoco quien administra. Se
  borra con la cuenta.
- **Pedido de verificación** (ya existe): suma un origen nuevo, la invitación de «Mis animales», al
  lado de «Mi perfil». No cambia nada más.
- **Origen de la pregunta de por qué se va** (ya existe): suma el de la invitación.
- **Correo de identidad aprobada** (ya existe): suma un enlace a «Mis animales» cuando el pedido
  empezó desde la invitación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas con personas sembradas, la invitación aparece solo para
  quien tiene una publicación, el teléfono verificado, no tiene la identidad, puede pedirla hoy y no
  tocó «Ahora no», y en ningún otro caso ni en ninguna otra pantalla.
- **SC-002**: En el 100 % de las pruebas, después de tocar «Ahora no» y de guardarse, la invitación
  no vuelve a aparecer en ninguna apertura posterior, haya pasado lo que haya pasado con la
  verificación.
- **SC-003**: Desde «Mis animales», quien ve la invitación llega a la verificación de identidad en
  un toque y el pedido que manda tiene los mismos pasos que desde «Mi perfil».
- **SC-004**: En el 100 % de las pruebas, ninguna otra cuenta, ninguna pantalla pública y ninguna
  pantalla de quien administra deja ver si a una persona se le mostró la invitación, si la cerró o si
  pidió la verificación desde ahí.
- **SC-005**: En las capturas a 390 y a 1280 px, «Mis animales» con la invitación sigue teniendo
  «Publicar un animal» como la única acción principal, la invitación no deja media hoja vacía a 1280
  px y la lista no se mueve cuando termina de cargar.
- **SC-006**: En el 100 % de los momentos de esta historia leídos en el registro de la medición, el
  origen de la invitación aparece aparte de «Mi perfil» y ninguno lleva quién, qué animal ni qué
  camada.
- **SC-007**: Después de la beta, docs/03 permite contestar con los números de la herramienta y de la
  base si quien rescata pasa por la verificación de identidad cuando el sitio se la ofrece, leído
  como señal al lado de las opiniones y las encuestas.

## Assumptions

- **Ya en `main`**: la verificación de identidad desde «Mi perfil» (#11), con el origen del pedido
  guardado y los orígenes de medición de la pregunta de por qué se va (publicar, solicitar, por su
  cuenta, «se la pidió quien publicó»). Esta historia reusa ese camino y suma un origen nuevo; no hay
  invitación en «Mis animales» todavía.
- La invitación es una feature (guarda algo nuevo, suma un origen y una regla de visibilidad que
  solo ve la persona dueña), no un cambio chico.
- **Con más de una publicación, o con una sola que no está en el listado**, la invitación habla de lo
  que la persona publica sin nombrar a ningún animal: elegir uno sería arbitrario, nombrarlos a todos
  alarga el cartel, y nombrar a uno adoptado o pausado prometería un cambio en el listado donde no
  está. Con una sola disponible, la nombra, como pide el criterio de aceptación con Tobi.
- **Las salidas de la verificación sin mandar** vuelven a «Mis animales» cuando se llegó desde la
  invitación, igual que desde una solicitud vuelven a la solicitud (#257). Al mandar, la persona ve
  el estado en revisión de siempre; la historia pide ver la invitación desaparecer «al volver», no
  una vuelta automática.
- **El «Ahora no» de la verificación** (el que ya existe dentro de la pantalla de verificar) no cierra
  la invitación: la historia dice que si se va sin mandar, la invitación sigue apareciendo.
- **El momento de invitación mostrada** cuenta cada apertura de «Mis animales» con la invitación a la
  vista, también las recargas; son momentos, no personas, como el resto de la medición.
- **El tope alcanzado** se cuenta con el origen de la invitación si se llega a él desde ahí, como los
  demás pasos que ya se cuentan; la historia no lo nombra pero sí pide «cada paso que ya se cuenta».
- La invitación no aparece mientras la persona no tiene nivel 1, así que nunca convive con el aviso
  de «tus animales no se ven».
- Las decisiones del enjambre de la historia van, palabra por palabra, a docs/03 §1 en esta rama.
- Las referencias tipo «docs/03 §Hipótesis» son citas a documentos; los números de tres cifras son
  issues, px o la Ley 18.331.
