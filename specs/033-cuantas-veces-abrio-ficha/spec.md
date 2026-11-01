# Feature Specification: Ver cuántas veces se abrió la ficha de cada animal, cuántos quisieron adoptarlo y a cuántos frenó la verificación

**Feature Branch**: `feature/269-cuantas-veces-abrio-ficha`

**Created**: 2026-11-01

**Status**: Draft

**Input**: Historia #269 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (en `main`, no se rehace): la ficha pública de un animal y la de una camada (#57,
#205); «Quiero adoptar» con sus frenos por el teléfono y por la identidad antes del cuestionario
(#63), y la regla de la medición que cuenta cada toque y cada freno una sola vez (#240), que hoy
solo ve el equipo y sin saber de qué animal son; el nivel que pide cada publicación y su edición
(#59); las páginas de cada animal y de cada camada en «Mis animales» (#53, #206); copiar el texto
para el grupo (#248); las solicitudes, que ya están guardadas. Nada en `main` cuenta hoy aperturas,
toques ni frenos por animal. Esta spec agrega esas cuentas por publicación y el bloque que se las
muestra a quien publicó. No cambia lo que ve ni lo que hace quien abre una ficha o toca «Quiero
adoptar», ni agrega momentos a la medición.

**Vocabulario de esta spec**:

- **Publicación**: un animal publicado solo o una camada entera. Una cría no es una publicación:
  todo lo de sus crías suma en su camada.
- **Quien publicó**: la cuenta que publicó el animal o la camada.
- **Apertura**: cada vez que la ficha pública de una publicación termina de cargar para alguien que
  no es quien publicó, sea cual sea su estado. Abrir el enlace de una cría lleva a la ficha de su
  camada y suma una apertura de la camada, una sola.
- **Toque**: cada vez que alguien toca «Quiero adoptar» en la ficha de un animal o de una cría, con
  la regla de #240: una vez por toque, también sin cuenta, y volver a la pantalla de solicitar
  después de entrar, de verificar el teléfono, desde el correo de la identidad aprobada o al
  recargar no suma otro.
- **Freno**: un toque que no dejó seguir a la persona porque le faltaba el teléfono verificado
  (**freno por el teléfono**) o la identidad que pide la publicación (**freno por la identidad**),
  una vez por toque y por motivo, con la regla de #240. El tope de solicitudes activas y un animal
  que no recibe solicitudes no son frenos de esta spec.
- **Solicitudes que llegaron**: las solicitudes mandadas por esa publicación (o por sus crías) que
  el sitio todavía guarda, también las retiradas y las cerradas.
- **Inicio de la cuenta**: el día desde el que se cuenta. Para una publicación nueva, el día en que
  se publicó; para una anterior a esta historia, el día en que llegó la historia. Todo día se cuenta
  y se muestra en hora de Uruguay.
- **El bloque «Cómo le va a…»**: lo que ve quien publicó en la página de la publicación en «Mis
  animales».

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver cómo le va a un animal en «Mis animales» (Priority: P1)

Carla publicó a Tobi y pegó el enlace en el grupo de Facebook. Dos días después abre la página de
Tobi en «Mis animales» y, debajo de las acciones, ve «Cómo le va a Tobi»: cuántas veces se abrió la
ficha, cuántas se tocó «Quiero adoptar», cuántos de esos toques no siguieron por el teléfono y
cuántas solicitudes llegaron, y debajo «Pedís el teléfono verificado». Sabe que el enlace trae gente
y cuánto le cuesta lo que pide.

**Why this priority**: es la historia entera para el caso más común, un animal publicado solo. Con
esto solo quien rescata ya ve que la ficha trabaja y lo que le cuesta el nivel que pide, que es lo
que la hipótesis quiere poner a la vista.

**Independent Test**: con personas sembradas y un animal de cada nivel: abrir la ficha como visitante,
como otra persona, como quien publicó y como la vista previa de WhatsApp; tocar «Quiero
adoptar» sin cuenta, sin teléfono, sin identidad en uno que la pide y con todo; mandar, retirar y
cerrar solicitudes; abrir la página del animal en «Mis animales» y ver cada número; abrir la ficha
pública y el perfil como otra persona y no ver ninguno; hacer fallar la lectura de los números y ver
el aviso con el resto de la página andando.

**Acceptance Scenarios**:

1. **Dado** que Carla publicó a Tobi pidiendo el teléfono verificado, su ficha se abrió 40 veces, se
   tocó 6 veces «Quiero adoptar», 2 de esos toques no siguieron porque faltaba el teléfono y llegaron
   3 solicitudes, **cuando** Carla abre la página de Tobi en «Mis animales», **entonces** ve 40, 6, 2
   frenados por el teléfono y 3 solicitudes, en ese orden, y la línea «Pedís el teléfono verificado»;
   no ve un renglón de frenos por la identidad.
2. **Dado** que Tobi pide la identidad verificada y Bruno, con nivel 1, toca «Quiero adoptar»,
   **cuando** el sitio le dice que necesita verificar su identidad, **entonces** al volver a la
   página de Tobi Carla ve un freno más por la identidad y un toque más, y la línea «Pedís la
   identidad verificada».
3. **Dado** que Bruno no tiene el teléfono ni la identidad y Tobi pide la identidad, **cuando** toca
   «Quiero adoptar», verifica el teléfono y lo frena la identidad, **entonces** Carla ve un toque, un
   freno por el teléfono y uno por la identidad.
4. **Dado** que alguien sin cuenta toca «Quiero adoptar» en Tobi, entra con su cuenta y lo frena el
   teléfono, **cuando** Carla mira los números, **entonces** suman un toque y un freno por el
   teléfono, no dos toques.
5. **Dado** que Bruno recarga dos veces la pantalla que le pide la identidad, **cuando** Carla mira
   los números, **entonces** suman un toque y un freno por la identidad, no tres de cada uno.
6. **Dado** que Carla pega el enlace de Tobi en WhatsApp y se arma la vista previa, **cuando** vuelve
   a la página de Tobi, **entonces** las aperturas no subieron.
7. **Dado** que Carla abre la ficha pública de Tobi para ver cómo quedó, **cuando** vuelve a su
   página, **entonces** las aperturas no subieron.
8. **Dado** que Tobi está adoptado, pausado o vencido y su posteo viejo en el grupo sigue trayendo
   gente, **cuando** alguien abre su ficha, **entonces** la apertura suma.
9. **Dado** que alguien abre la ficha de Tobi tres veces, **cuando** Carla mira los números,
   **entonces** las aperturas suman tres.
10. **Dado** que Ana retiró su solicitud por Tobi y Carla rechazó la de Diego, **cuando** Carla mira
    los números, **entonces** las dos siguen contando entre las que llegaron.
11. **Dado** que Luna se publicó antes del día en que llegó esta historia, **cuando** Carla abre su
    página, **entonces** ve los números con «desde el <día>», con la fecha en que se empezó a contar;
    los de Tobi, publicado después, dicen «desde que lo publicaste».
12. **Dado** que nadie abrió todavía la ficha de Tobi, **cuando** Carla abre su página, **entonces**
    ve «Todavía nadie abrió la ficha de Tobi» con la acción de copiar el texto para el grupo, si hoy
    la publicación la ofrece.
13. **Dado** que la página está trayendo los números, **cuando** Carla la abre, **entonces** ve el
    bloque con su forma y sin números, y las acciones de Tobi ya andan.
14. **Dado** que los números no se pueden traer, **cuando** Carla abre la página de Tobi,
    **entonces** ve en el bloque que no se pudieron cargar y «Probar de nuevo», y puede editar,
    pausar o compartir a Tobi como siempre; «Probar de nuevo» vuelve a pedir solo los números.
15. **Dado** que Diego no publicó a Tobi, **cuando** abre la ficha pública de Tobi, el perfil de
    Carla, la tarjeta del listado o la dirección de la página de Tobi en «Mis animales», **entonces**
    no ve ninguno de estos números.
16. **Dado** que la cuenta no se pudo sumar en un toque de «Quiero adoptar» o en una apertura,
    **cuando** Bruno toca o abre la ficha, **entonces** sigue al cuestionario, a verificarse o a la
    ficha como hoy y no ve ningún aviso.
17. **Dado** que Carla borra a Tobi o borra su cuenta, **cuando** el borrado termina, **entonces** los
    números de Tobi ya no existen en ningún lado.

---

### User Story 2 - Ver cómo le va a una camada, sumando todas sus crías (Priority: P2)

Carla publicó la camada de Kira con 5 crías. En la página de la camada en «Mis animales» ve «Cómo le
va a La camada de Kira» con las aperturas de la ficha de la camada y los toques, los frenos y las
solicitudes de todas sus crías juntos. Ninguna cría tiene números propios.

**Why this priority**: una camada es el momento en que entran más animales de golpe y la primera
métrica ya la cuenta como una sola publicación. Reusa todo lo de la US1 y solo cambia qué se suma.

**Independent Test**: con una camada sembrada de 5 crías que pide la identidad: abrir la ficha de la
camada y el enlace de una cría como otras personas; tocar «Quiero adoptar» en distintas crías con y
sin teléfono e identidad; mandar solicitudes por dos crías; abrir la página de la camada y ver la
suma; abrir la página de una cría y ver que no tiene números.

**Acceptance Scenarios**:

1. **Dado** que Carla publicó la camada de Kira con 5 crías, **cuando** alguien abre la ficha de la
   camada y otra persona la abre y toca «Quiero adoptar» en una cría, **entonces** la página de la
   camada suma 2 aperturas y 1 toque, y ninguna cría tiene números propios.
2. **Dado** que llegaron 2 solicitudes por una cría y 1 por otra, una ya cerrada, **cuando** Carla
   abre la página de la camada, **entonces** ve 3 solicitudes.
3. **Dado** que alguien abre el enlace viejo de una cría, **cuando** lo lleva a la ficha de la
   camada, **entonces** la camada suma una apertura, una sola.
4. **Dado** que la camada pide solo el teléfono, **cuando** Carla mira el bloque, **entonces** dice
   «Pedís el teléfono verificado» y no muestra un renglón de frenos por la identidad.
5. **Dado** que nadie abrió todavía la ficha de la camada, **cuando** Carla abre su página,
   **entonces** ve «Todavía nadie abrió la ficha de La camada de Kira» con la acción de copiar el
   texto para el grupo, si hoy la camada la ofrece; cargando y error se ven como en la US1.
6. **Dado** que una cría de la camada fue adoptada, **cuando** alguien abre la ficha de la camada,
   **entonces** la apertura suma igual.

---

### User Story 3 - Leer si quien rescata mantiene la verificación cuando ve lo que le cuesta (Priority: P3)

Quien lee la beta abre docs/03 §Métricas de éxito y encuentra una lectura nueva, «¿quien rescata
mantiene la verificación cuando ve lo que le cuesta?», que dice con qué momentos que ya existen se
compara el nivel que piden las publicaciones antes y después del día en que llegó esta historia.

**Why this priority**: es la mitad de la historia que contesta la hipótesis con lo que hace quien
rescata. No tiene pantalla; sin las otras dos, no hay nada que comparar.

**Independent Test**: leer docs/03 §Métricas de éxito, «Cómo se leen», y encontrar la lectura con
sus cuatro puntos, nombrando solo momentos que ya llegan a la medición.

**Acceptance Scenarios**:

1. **Dado** que esta historia llegó, **cuando** alguien lee docs/03 §Métricas de éxito, **entonces**
   encuentra la lectura nueva con: qué parte de las publicaciones pide la identidad antes y después
   del día en que llegó, con los momentos de publicar y de editar; cuántas ediciones bajan el nivel
   de 2 a 1 y cuántas lo suben, antes y después; si los rescatistas publican su segundo animal más
   que antes, al lado de las opiniones que nombren la ficha o los números; y que con 3 a 5
   rescatistas es una señal, no una prueba.
2. **Dado** que la lectura nueva existe, **cuando** se busca en la medición un momento nuevo para
   mirar los números, **entonces** no lo hay.

---

### Edge Cases

- **Quien publicó abre su propia ficha sin sesión** (en otra ventana o en otro teléfono): el sitio no
  sabe que es quien publicó, así que la apertura suma.
- **Quien administra abre una ficha**: suma como cualquier persona que no la publicó; quien
  administra no ve los números en ningún lado.
- **Un buscador o la vista previa de otra aplicación** (WhatsApp, Facebook, Telegram, Slack, X,
  Discord, LinkedIn) abre el enlace: no suma.
- **La ficha de una publicación pausada, vencida, adoptada, dada de baja u oculta** se abre por un
  posteo viejo: la apertura suma, aunque la ficha diga que no está disponible.
- **Un enlace de un animal que ya no existe**: no suma a nadie.
- **La persona que quien publicó bloqueó** abre la ficha: suma, como cualquier otra que llegó por el
  enlace.
- **Quien publicó toca «Quiero adoptar» en su propio animal** (por una dirección armada a mano): no
  suma un toque ni un freno.
- **Un toque frenado por el tope de solicitudes activas o por un animal que no recibe**: suma el
  toque, no un freno de esta spec.
- **Quien publicó cambia el nivel de 2 a 1** después de que hubo frenos por la identidad: la línea
  dice «Pedís el teléfono verificado» y el renglón de frenos por la identidad sigue a la vista con lo
  ya contado, porque esconderlo borraría un número que existió. Si nunca hubo uno, no aparece.
- **Quien publicó cambia el nivel de 1 a 2**: desde ese momento aparece el renglón de frenos por la
  identidad, en cero si todavía no frenó a nadie; lo contado antes no cambia.
- **Volver a publicar un animal adoptado o renovar uno vencido**: los números siguen sumando sobre
  los que tenía; el inicio de la cuenta no cambia.
- **Quitar una cría de una camada**: lo que sumaron sus aperturas, toques y frenos queda en la
  camada; sus solicitudes dejan de contarse si el sitio ya no las guarda con la camada.
- **Quien mandó una solicitud borra su cuenta**: el sitio borra su solicitud y deja de contarla; no se
  guarda nada para seguir contándola.
- **Dos personas abren la ficha o tocan «Quiero adoptar» al mismo tiempo**: suman las dos, ninguna
  se pierde.
- **Una apertura o un toque que no se pudo sumar**: se pierde ese uno y la persona no se entera; el
  número puede quedar uno abajo, nunca arriba.
- **Una publicación con todo en cero menos las solicitudes** (por ejemplo, una anterior a la
  historia que ya tenía solicitudes): se muestran los números, no el vacío; el vacío es solo con todos
  los números en cero.
- **El sitio prepara la ficha por adelantado** (al pasar por una tarjeta del listado, antes de que la
  persona la abra): no suma; suma solo la ficha que la persona abre.
- **Una persona con la cuenta suspendida** no llega a ver la ficha, así que no suma.
- **La página del animal en «Mis animales» de una publicación dada de baja**: muestra el bloque con lo
  contado, sin la acción de copiar el texto en el vacío, porque hoy no se ofrece.

## Requirements *(mandatory)*

### Functional Requirements

#### Qué se cuenta

- **FR-001**: Cada apertura de la ficha pública de una publicación DEBE sumar uno a esa publicación,
  en cualquier estado en que esté, cada vez que carga.
- **FR-002**: NO DEBEN sumar aperturas: las de quien publicó con su sesión, las vistas previas que
  arman las aplicaciones al pegar el enlace, ni los buscadores. Se usa la misma lista de aplicaciones
  y buscadores que ya deja afuera la medición.
- **FR-003**: Abrir el enlace de una cría DEBE sumar una sola apertura a su camada.
- **FR-004**: Cada toque de «Quiero adoptar» DEBE sumar uno a su publicación (el animal o la camada
  de la cría), con la regla de #240: una vez por toque, también sin cuenta, y ninguna vuelta a la
  pantalla de solicitar suma otro. El toque de quien publicó NO DEBE sumar.
- **FR-005**: Cada freno DEBE sumar uno a su publicación y a su motivo, teléfono o identidad, una vez
  por toque y por motivo, con la regla de #240. Si en el mismo toque la frenó el teléfono y después
  la identidad, DEBE sumar uno en cada motivo.
- **FR-006**: Los frenos que no son de verificación (el tope de solicitudes activas, un animal que no
  recibe) NO DEBEN contarse como frenos.
- **FR-007**: Las solicitudes que llegaron DEBEN ser todas las mandadas por la publicación o por sus
  crías que el sitio guarda, también las retiradas y las cerradas, sin decir por qué se cerraron.
- **FR-008**: Una camada DEBE contar como una sola publicación: las aperturas de su ficha y los
  toques, los frenos y las solicitudes de todas sus crías suman en la camada, y ninguna cría tiene
  números propios.
- **FR-009**: Que una apertura, un toque o un freno no se pueda sumar NO DEBE cambiar nada de lo que
  ve ni de a dónde va la persona, ni mostrarle un aviso. La ficha y la pantalla siguiente NO DEBEN
  esperar a que la cuenta se sume: llegan igual aunque la cuenta tarde o falle.
- **FR-010**: Dos aperturas, toques o frenos al mismo tiempo DEBEN sumar los dos.

#### Desde cuándo

- **FR-011**: Cada publicación DEBE tener su inicio de la cuenta: el día en que se publicó, o el día
  en que llegó esta historia si se publicó antes.
- **FR-012**: El bloque DEBE decir «desde que lo publicaste» (o «desde que la publicaste» para una
  camada o una hembra) cuando el inicio de la cuenta es el día en que se publicó, y «desde el <día>»
  con esa fecha cuando la publicación es anterior a la historia.
- **FR-013**: Renovar, reanudar, volver a publicar o editar NO DEBEN reiniciar los números ni mover
  el inicio de la cuenta.

#### Qué ve quien publicó

- **FR-014**: La página de cada animal y la de cada camada en «Mis animales» DEBEN mostrar el bloque
  «Cómo le va a <nombre>» con, en este orden: veces que se abrió la ficha, veces que se tocó «Quiero
  adoptar», frenos en la verificación partidos en teléfono e identidad, y solicitudes que llegaron.
- **FR-015**: Debajo de los frenos, el bloque DEBE decir qué pide hoy la publicación: «Pedís el
  teléfono verificado» o «Pedís la identidad verificada», sin sugerir que se cambie ni enlazar a
  cambiarlo.
- **FR-016**: El renglón de frenos por la identidad DEBE aparecer cuando la publicación pide hoy la
  identidad o cuando ya contó al menos un freno por la identidad; si no, NO DEBE aparecer.
- **FR-017**: Si todos los números están en cero (nadie abrió la ficha, nadie tocó «Quiero
  adoptar», nadie se frenó y no llegó ninguna solicitud desde el inicio de la cuenta), el bloque DEBE
  decir «Todavía nadie abrió la ficha de <nombre>» y ofrecer la acción de copiar el texto
  para el grupo que ya existe, solo cuando hoy la publicación la ofrece.
- **FR-018**: Mientras trae los números, el bloque DEBE verse con su forma y sin números, y el resto
  de la página DEBE poder usarse.
- **FR-019**: Si los números no se pueden traer, el bloque DEBE decir que no se pudieron cargar y
  ofrecer «Probar de nuevo», que vuelve a pedir solo los números y, si vuelve a fallar, deja el mismo
  aviso con «Probar de nuevo»; el resto de la página (editar,
  pausar, compartir, las crías, el seguimiento) DEBE funcionar igual.
- **FR-020**: Los números DEBEN ser los contados hasta el momento en que se abre la página; no
  cambian solos mientras la página está abierta.
- **FR-021**: En el teléfono el bloque DEBE ir debajo de las acciones del animal o de la camada; en
  pantalla ancha, al costado de la ficha, sin dejar un costado vacío ni media hoja en blanco
  (docs/11, 2026-09-20).
- **FR-022**: Los números NO DEBEN aparecer en la lista de «Mis animales», en la ficha pública, en el
  perfil público, en la tarjeta del listado ni en ninguna pantalla de quien administra.
- **FR-023**: El bloque NO DEBE decir quién abrió, tocó o se frenó, ni cuándo, ni mostrar números por
  día, gráficos ni comparaciones con otros animales.
- **FR-024**: Todos los textos del bloque DEBEN estar en español rioplatense con voseo, con el
  nombre y el género del animal o de la camada, escritos y revisados con el skill sin-slop.

#### Privacidad

- **FR-025**: Los números de una publicación DEBEN poder verlos solo quien la publicó. Ninguna otra
  persona, con o sin sesión, y tampoco quien administra, DEBE poder leerlos.
- **FR-026**: Por cada publicación DEBEN guardarse solo cuántas aperturas, cuántos toques y cuántos
  frenos de cada motivo hubo, y el inicio de la cuenta. NUNCA quién, cuándo, desde dónde ni con qué
  aplicación. Las solicitudes no se copian: se cuentan.
- **FR-027**: Nadie DEBE poder sumar a los números de una publicación por fuera de abrir su ficha o
  tocar «Quiero adoptar», ni cambiarlos o ponerlos en cero.
- **FR-028**: Borrar el animal, la camada o la cuenta de quien publicó DEBE borrar sus números.
- **FR-029**: La página de «Mis animales» sigue sin indexarse; nada de esta historia DEBE agregar algo
  indexable.

#### Medición

- **FR-030**: Esta historia NO DEBE agregar momentos a la medición ni cambiar los que ya existen.
- **FR-031**: docs/03 §Métricas de éxito, «Cómo se leen», DEBE sumar la lectura «¿quien rescata
  mantiene la verificación cuando ve lo que le cuesta?» con los cuatro puntos de la historia.

### Key Entities

- **Cuentas de una publicación**: por animal publicado solo o por camada, cuántas aperturas, cuántos
  toques, cuántos frenos por el teléfono y cuántos por la identidad, y el inicio de la cuenta. Sin
  ninguna persona. Las ve solo quien publicó y se borran con la publicación o con su cuenta.
- **Solicitudes que llegaron**: no es un dato nuevo; es contar las solicitudes que el sitio ya guarda
  para esa publicación o sus crías.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas, los números del bloque coinciden con las aperturas, los
  toques, los frenos de cada motivo y las solicitudes hechas en la prueba, también con recargas,
  vueltas por entrar o verificar el teléfono y dos personas al mismo tiempo.
- **SC-002**: En el 100 % de las pruebas, las aperturas de quien publicó con su sesión, de la vista
  previa de cada aplicación de la lista y de los buscadores no suman.
- **SC-003**: En el 100 % de las pruebas de visibilidad, un visitante, otra persona y quien
  administra no leen los números de ninguna publicación; solo quien la publicó.
- **SC-004**: En el 100 % de las pruebas, una apertura o un toque cuya cuenta falla deja a la persona
  en la misma pantalla y con el mismo camino que sin esta historia, sin ningún aviso.
- **SC-005**: Con la lectura de los números caída, quien publicó puede editar, pausar y compartir el
  animal desde la misma página en el 100 % de las pruebas.
- **SC-006**: Después de borrar un animal, una camada o la cuenta de quien publicó, no queda ningún
  número de esas publicaciones, en el 100 % de las pruebas.
- **SC-007**: En las capturas a 1280 px el bloque está entero sin desplazar la página del animal ni la
  de la camada, al costado de la ficha; a 390 px está debajo de las acciones.

## Assumptions

- **Qué es una apertura**: cada carga de la ficha pública de una publicación que existe, para quien no
  la publicó, en cualquier estado, también cuando la ficha dice que no está disponible (pausada,
  vencida, dada de baja u oculta) o cuando quien mira fue bloqueado. La historia dice «en cualquier
  estado» y da el motivo: el enlace pegado sigue trayendo gente. Un enlace de algo que ya no existe no
  suma porque no hay a quién.
- **Quien publicó sin sesión** suma como cualquiera: el sitio no tiene cómo reconocerlo sin guardar
  algo de la persona, y la historia pide no guardar nada.
- **Quien administra suma aperturas** como cualquier persona: la historia lo deja afuera de ver los
  números, no de contarse.
- **El renglón de frenos por la identidad** sigue a la vista cuando ya contó alguno y la publicación
  ahora pide solo el teléfono. La historia dice que «si pide solo el teléfono, el freno por identidad
  no aparece», pensando en una publicación que nunca la pidió; esconder un número ya contado borraría
  lo que el bloque quiere mostrar, y la lectura nueva de la historia mira justo a quien baja el nivel.
- **Solicitudes que llegaron** cuenta las que el sitio guarda, como dice la historia («ya están
  guardadas y solo se cuentan»). Si quien solicitó borró su cuenta, su solicitud se borra con ella y
  deja de contarse; guardar una cuenta aparte para no perderla sería guardar algo de esa persona.
- **El vacío** es con todos los números en cero. Una publicación anterior a la historia puede tener
  solicitudes y cero aperturas: decirle «todavía nadie abrió la ficha» al lado de tres solicitudes
  sería falso.
- **La acción de copiar el texto en el vacío** aparece solo cuando hoy la publicación ofrece ese texto
  (#248): una pausada, una adoptada o una dada de baja no lo ofrecen, y el vacío queda con la frase
  sola.
- **«Probar de nuevo»** vuelve a pedir los números sin recargar el resto de la página: la historia
  pide que lo demás siga andando igual.
- **El inicio de la cuenta de una publicación anterior** es el día en que la historia llega al sitio, el
  mismo para todas las anteriores.
- **Renovar o volver a publicar no reinicia nada**: la historia cuenta «desde que se publicó» y no
  pide reiniciar; un adoptado que se vuelve a publicar sigue siendo la misma publicación con el mismo
  enlace.
- **Quitar una cría** deja en la camada lo que ya sumó: las cuentas son de la camada, no de la cría.
- **Los textos «Cómo le va a <nombre>», «Todavía nadie abrió la ficha de <nombre>», «Pedís el
  teléfono verificado» y «Pedís la identidad verificada»** son los de la historia; el resto se escribe
  con sin-slop.
- **Las referencias «docs/03 §Métricas», «docs/03 §Hipótesis», «docs/01 §Huevo y gallina», «docs/11»
  y los números de issue** del cuerpo de la historia son referencias a documentos de producto y a
  otras historias. «18.331» es el número de la ley.
- **Las decisiones del enjambre de la historia** (las seis del 2026-11-01, product-owner) van a
  docs/03 palabra por palabra en esta rama: las cinco marcadas «(docs/03 §2)» al final de §2, y la de
  la medición en §Métricas de éxito.
