# Feature Specification: Al borrar un animal que no se adoptó, decir por qué con un toque

**Feature Branch**: `feature/263-borrar-decir-por-que`

**Created**: 2026-10-29

**Status**: Draft

**Input**: Historia #263 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (en `main`, no se rehace): borrar un animal y borrar una camada desde «Mis
animales» y desde su panel, con la confirmación «Borrar para siempre» / «No borrar» y el aviso de
que no se pudo por la conexión sin cerrar la confirmación (#53, #59, #205, #206); los estados de una
publicación (disponible, en proceso, pausado, vencido, adoptado, dado de baja) y de una camada (#59,
#206); dar de baja una publicación desde Administrar (#13, #72); la encuesta de una cada 30 días y
la pantalla Encuestas de quien administra, con «Por qué no se verificaron» (#71, #234); la medición
sin la persona (#9, #169). Esta spec agrega la pregunta en la confirmación de borrar, lo que se
guarda de ella y el apartado nuevo de Encuestas. No cambia cómo se borra ni qué se borra.

**Vocabulario de esta spec**:

- **Un borrado con pregunta** es borrar un animal que está disponible, en proceso, pausado o
  vencido, o una camada que no está dada de baja y tiene al menos una cría que no fue adoptada. Es
  lo único que muestra la pregunta.
- **Un borrado sin pregunta** es cualquier otro: un animal adoptado o dado de baja, una camada con
  todas sus crías adoptadas o dada de baja, quitar una cría de una camada, borrar la cuenta.
- **La pregunta** es «¿Por qué lo borrás?» o «¿Por qué la borrás?» (un animal hembra o una camada),
  con cinco opciones fijas: No llegaron solicitudes · Las solicitudes que llegaron no me
  convencieron · Lo di en adopción por Facebook, Instagram o WhatsApp (o «La di…») · Ya no está en
  adopción · Otra cosa.
- **Una respuesta** es lo que queda contado de un borrado con pregunta: la opción elegida al
  confirmar o **sin contestar**, el día y si era un **animal** o una **camada**.
- **Encuestas** es la pantalla de quien administra de #71. **«Por qué se borraron animales»** es su
  apartado nuevo.
- Todo día se cuenta y se muestra en hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Decir por qué al borrar un animal (Priority: P1)

Carla publicó a Luna hace 25 días y no le llegó ninguna solicitud. En «Mis animales» toca «Borrar».
La confirmación de siempre le avisa que Luna se borra para siempre y, debajo, le pregunta «¿Por qué
la borrás?» con cinco opciones, ninguna elegida, y le deja claro que contestar es opcional. Toca «No
llegaron solicitudes» y «Borrar para siempre». Luna se borra como siempre y la respuesta queda
contada sin el nombre de Carla ni el de Luna.

**Why this priority**: es la parte que junta el dato. Quien borra un animal que no consiguió hogar
acá es quien más tiene para decir sobre la hipótesis (docs/03 §Hipótesis), y hoy ese dato se
pierde. Con esta parte sola el dato ya existe y se lee en la medición.

**Independent Test**: con animales sembrados de una persona en cada estado (disponible, en proceso,
pausado, vencido, adoptado, dado de baja), macho y hembra: abrir la confirmación de borrar desde
«Mis animales» y desde el panel del animal y ver la pregunta solo donde corresponde, con el
pronombre que concuerda; borrar con una opción, sin opción y después de cambiarla o dejarla sin
elegir; cortar la conexión; tocar dos veces; marcarlo adoptado en otra pestaña antes de confirmar.

**Acceptance Scenarios**:

1. **Dado** que Carla publicó a Luna hace 25 días y no le llegó ninguna solicitud, **cuando** toca
   «Borrar» en «Mis animales», **entonces** ve «¿Por qué la borrás?» con las cinco opciones y
   ninguna elegida, debajo del aviso de que se borra para siempre y antes de «Borrar para siempre».
2. **Dado** que Carla eligió «No llegaron solicitudes», **cuando** toca «Borrar para siempre»,
   **entonces** Luna se borra como hoy y queda contada una respuesta con esa opción, el día y que era
   un animal.
3. **Dado** que Carla no eligió ninguna opción, **cuando** toca «Borrar para siempre», **entonces**
   Luna se borra como hoy y queda contada una respuesta sin contestar.
4. **Dado** que Carla borra a Toby, un macho en proceso, **cuando** abre la confirmación,
   **entonces** ve «¿Por qué lo borrás?» y la tercera opción dice «Lo di en adopción por Facebook,
   Instagram o WhatsApp»; para Luna dice «La di en adopción por Facebook, Instagram o WhatsApp».
5. **Dado** que Carla eligió «Ya no está en adopción» por error, **cuando** la vuelve a tocar o elige
   otra antes de confirmar, **entonces** queda sin elegir o con la nueva, y al confirmar se cuenta
   solo lo que estaba elegido en ese momento.
6. **Dado** que Carla marcó a Nube adoptada, **cuando** la borra, **entonces** la confirmación es la
   de hoy, sin la pregunta, y no se cuenta nada.
7. **Dado** que quien administra dio de baja a Toby, **cuando** Carla lo borra, **entonces** la
   confirmación es la de hoy, sin la pregunta, y no se cuenta nada.
8. **Dado** que Carla eligió una opción y se corta la conexión, **cuando** toca «Borrar para
   siempre», **entonces** Luna sigue publicada, la confirmación sigue abierta con la opción elegida,
   se le dice que no se pudo por la conexión, y al tocar de nuevo Luna se borra y queda contada una
   sola respuesta.
9. **Dado** que Carla toca dos veces «Borrar para siempre», **cuando** el borrado termina,
   **entonces** queda contada una sola respuesta.
10. **Dado** que Carla marcó a Luna adoptada en otra pestaña, **cuando** confirma el borrado desde
    esta con una opción elegida, **entonces** pasa lo mismo que hoy y la respuesta no se cuenta.
11. **Dado** que Carla toca «No borrar» o cierra la confirmación con una opción elegida, **cuando**
    vuelve a abrirla, **entonces** la pregunta aparece otra vez con ninguna opción elegida y no se
    contó nada.

---

### User Story 2 - Decir por qué al borrar una camada (Priority: P2)

La camada de Luna tiene tres crías y dos ya fueron adoptadas. Carla toca «Borrar la camada». La
confirmación, la de siempre con cuántas solicitudes se cierran, le pregunta una sola vez «¿Por qué
la borrás?» por la camada entera. Elige «La di en adopción por Facebook, Instagram o WhatsApp» y
confirma: se cuenta una respuesta de camada.

**Why this priority**: las camadas son una parte grande de lo que publica quien rescata (#205), y una
camada que se borra con crías sin hogar es el mismo dato que un animal. Reusa todo lo de la US1, con
otra regla de cuándo aparece.

**Independent Test**: con camadas sembradas en cada estado (disponible, pausada, vencida, con todas
sus crías adoptadas, dada de baja, con algunas crías adoptadas y otras no): abrir «Borrar la camada»
desde «Mis animales» y desde su panel y ver la pregunta solo donde corresponde, una sola vez; borrar
y ver una respuesta de camada; quitar una cría y no ver ninguna pregunta.

**Acceptance Scenarios**:

1. **Dado** que la camada de Luna tiene tres crías y dos fueron adoptadas, **cuando** Carla toca
   «Borrar la camada», **entonces** ve la pregunta una sola vez, con «¿Por qué la borrás?» y las
   opciones que concuerdan («La di…»), y al confirmar se cuenta una respuesta de camada.
2. **Dado** que todas las crías de una camada fueron adoptadas, **cuando** Carla la borra,
   **entonces** la confirmación es la de hoy, sin la pregunta, y no se cuenta nada.
3. **Dado** que quien administra dio de baja una camada, **cuando** Carla la borra, **entonces** la
   confirmación es la de hoy, sin la pregunta.
4. **Dado** que Carla quita una cría de una camada, **cuando** confirma, **entonces** no aparece
   ninguna pregunta y no se cuenta nada.
5. **Dado** que Carla borra su cuenta con animales y camadas publicados, **cuando** confirma,
   **entonces** no aparece ninguna pregunta y no se cuenta nada.
6. **Dado** que la última cría sin adoptar de una camada se marcó adoptada en otra pestaña,
   **cuando** Carla confirma desde esta el borrado de la camada con una opción elegida, **entonces**
   pasa lo mismo que hoy y la respuesta no se cuenta.

---

### User Story 3 - Leer en Encuestas por qué se borraron animales (Priority: P3)

Quien administra abre Encuestas y, debajo de lo que ya había, ve «Por qué se borraron animales»:
cuántos animales y cuántas camadas se borraron con la pregunta a la vista, cuántos la contestaron y
cuántos no, y cuántas veces se eligió cada opción, en total y separado en animales y camadas. Nunca
quién contestó ni qué animal era.

**Why this priority**: es donde lo contestado se lee en el sitio, al lado de lo que dice la gente en
#71 y #234. Sin este apartado las respuestas existen pero el equipo las lee solo en la medición. Se
apoya en US1 y US2.

**Independent Test**: con respuestas sembradas de animales y de camadas (con cada opción y sin
contestar), abrir Encuestas como quien administra y ver los números esperados, sin nombres; borrar
la cuenta de una persona que contestó y ver los mismos números; abrir la dirección sin sesión y como
una persona que no administra y ver que no existe.

**Acceptance Scenarios**:

1. **Dado** que administro el sitio, **cuando** abro Encuestas, **entonces** veo «Por qué se
   borraron animales» con cuántos se borraron con la pregunta, cuántos la contestaron y cuántos no,
   y cuántas veces se eligió cada opción, en total y en animales y camadas, sin el nombre de nadie ni
   del animal.
2. **Dado** que Carla contestó al borrar a Luna y después borró su cuenta, **cuando** quien
   administra abre Encuestas, **entonces** los números siguen iguales.
3. **Dado** que nadie borró todavía un animal ni una camada con la pregunta, **cuando** abro
   Encuestas, **entonces** el apartado dice «Todavía nadie borró un animal sin adopción».
4. **Dado** que hubo borrados con la pregunta pero ninguno la contestó, **cuando** abro Encuestas,
   **entonces** el apartado muestra sus números, con las opciones en cero, y dice que nadie contestó
   todavía.
5. **Dado** que no administro el sitio, o no tengo sesión, **cuando** abro la dirección de
   Encuestas, **entonces** veo que no existe, igual que hoy.

---

### Edge Cases

- **Un animal vencido** es un borrado con pregunta: la publicación terminó sin adopción.
- **Una camada pausada o vencida** con alguna cría sin adoptar es un borrado con pregunta.
- **Una cría en proceso** cuenta como no adoptada: la camada que la tiene muestra la pregunta.
- **El estado que vale es el del momento de confirmar**: si entre abrir la confirmación y tocar
  «Borrar para siempre» el animal o la camada pasó a adoptado o a dado de baja, se borra o se avisa
  como hoy y no se cuenta nada; si pasó de un estado con pregunta a otro con pregunta (por ejemplo,
  de disponible a pausado), se cuenta lo elegido.
- **Un borrado que no se hizo no cuenta**: con un corte, un error del sitio, la sesión vencida o el
  animal que ya no existe porque otra pestaña lo borró, no queda ninguna respuesta de ese intento.
- **El reintento después de un corte en el que el borrado sí llegó** termina como hoy (el animal ya
  no existe y se da por borrado) y no cuenta una segunda respuesta.
- **La encuesta de #71 y esta pregunta no se tocan**: esta no gasta los 30 días de #71, y tener una
  encuesta de #71 pendiente o reciente no la oculta. La pregunta de #234 tampoco cambia.
- **Mientras se borra**, las opciones no se pueden cambiar: lo que cuenta es lo que estaba elegido
  al tocar «Borrar para siempre».
- **Borrar la cuenta**: no hace la pregunta por sus animales ni por sus camadas, y no cambia ninguna
  respuesta ya contada.
- **Una cuenta suspendida** no llega a «Mis animales» (#13), así que no borra con pregunta.
- **La pregunta no es una encuesta**: no se llama así en el sitio, no tiene «Ahora no» propio y no
  aparece en ningún otro lugar que la confirmación de borrar.

## Requirements *(mandatory)*

### Functional Requirements

#### Cuándo aparece

- **FR-001**: La confirmación de borrar un animal DEBE mostrar la pregunta cuando el animal está
  disponible, en proceso, pausado o vencido.
- **FR-002**: La confirmación de borrar una camada DEBE mostrar la pregunta cuando la camada no está
  dada de baja y al menos una de sus crías no fue adoptada. Se contesta una sola vez por la camada
  entera.
- **FR-003**: La pregunta NO DEBE aparecer al borrar un animal adoptado o dado de baja, una camada
  con todas sus crías adoptadas o dada de baja, al quitar una cría de una camada, al pausar, al
  marcar en proceso o adoptado, ni al borrar la cuenta. En esos casos la confirmación DEBE ser la
  de hoy.
- **FR-004**: La pregunta DEBE aparecer en cada borrado con pregunta, en todos los lugares desde
  donde hoy se borra un animal o una camada, sin tope por persona y sin recordar a quién se le
  preguntó.
- **FR-005**: Esta pregunta NO DEBE contar para la encuesta de una cada 30 días de #71, y esa
  encuesta NO DEBE ocultarla ni cambiar por ella.

#### Contestar y borrar

- **FR-006**: La pregunta DEBE ir dentro de la misma confirmación, debajo del aviso de que se borra
  para siempre y antes de «Borrar para siempre» y «No borrar», como un grupo de cinco opciones de una
  sola elección con su título, que diga que contestar es opcional.
- **FR-007**: El título y la tercera opción DEBEN concordar con el animal: «¿Por qué lo borrás?» y
  «Lo di en adopción por Facebook, Instagram o WhatsApp» para un macho; «¿Por qué la borrás?» y «La
  di en adopción por Facebook, Instagram o WhatsApp» para una hembra y para una camada.
- **FR-008**: Ninguna opción DEBE venir elegida al abrir la confirmación. La persona DEBE poder
  elegir una, cambiarla por otra o volver a tocar la elegida para dejarla sin elegir, antes de
  confirmar.
- **FR-009**: «Borrar para siempre» DEBE borrar igual, con o sin una opción elegida. La pregunta
  NUNCA DEBE agregar un toque ni frenar el borrado, y «No borrar» DEBE seguir cerrando sin borrar
  nada.
- **FR-010**: Al borrarse de verdad un animal o una camada en un borrado con pregunta, DEBE quedar
  contada exactamente una respuesta con lo que estaba elegido al tocar «Borrar para siempre», o sin
  contestar si no había nada elegido.
- **FR-011**: Si el borrado no se hace (corte, error, sesión vencida, ya no existía), NO DEBE contarse
  ninguna respuesta. Tocar dos veces o reintentar DEBE dejar a lo sumo una respuesta por borrado.
- **FR-012**: Si al confirmar el animal o la camada ya estaba adoptado o dado de baja, el borrado o
  su aviso DEBEN ser los de hoy y la respuesta NO DEBE contarse.
- **FR-013**: Si el borrado no llegó, por la conexión o porque el sitio no respondió, la
  confirmación DEBE seguir abierta con la opción elegida y el aviso de hoy, y volver a tocar «Borrar
  para siempre» DEBE intentar de nuevo con esa opción. Si la sesión se cerró, la persona va a entrar
  como hoy y lo elegido se pierde sin contarse.
- **FR-014**: Cerrar la confirmación sin borrar NO DEBE contar nada, y al volver a abrirla ninguna
  opción DEBE venir elegida.
- **FR-015**: En el teléfono (390 px), las cinco opciones DEBEN ir una debajo de la otra, y «Borrar
  para siempre» y «No borrar» DEBEN poder alcanzarse al terminar la lista, dentro de la misma
  confirmación. A 1280 px todo DEBE ir en la misma confirmación, sin abrir otra.
- **FR-016**: Todos los textos de la pregunta, las opciones y el apartado de Encuestas DEBEN estar
  en español rioplatense con voseo, escritos y revisados con el skill sin-slop. La pregunta y las
  opciones son las de la historia, palabra por palabra.

#### Encuestas

- **FR-017**: Encuestas DEBE sumar el apartado «Por qué se borraron animales».
- **FR-018**: El apartado DEBE mostrar cuántos animales y cuántas camadas se borraron con la
  pregunta a la vista, cuántos la contestaron y cuántos no.
- **FR-019**: El apartado DEBE mostrar cuántas veces se eligió cada una de las cinco opciones, en
  total y separado en animales y camadas, también las que están en cero.
- **FR-020**: Sin ningún borrado con pregunta, el apartado DEBE decir «Todavía nadie borró un animal
  sin adopción». Con borrados y sin ninguna respuesta contestada, DEBE mostrar los números y decir
  que nadie contestó todavía. Mientras carga y si no se puede leer, el apartado DEBE comportarse
  como el resto de Encuestas.
- **FR-021**: Encuestas, con su apartado nuevo, DEBE seguir viéndose solo para quien administra;
  para cualquier otra persona, con o sin sesión, su dirección DEBE verse como algo que no existe.
- **FR-022**: Nada en Encuestas DEBE mostrar quién contestó ni qué animal o camada era, ni permitir
  deducirlo.
- **FR-023**: Borrar una cuenta NO DEBE cambiar ningún número del apartado.

#### Datos personales

- **FR-024**: Cada respuesta DEBE guardarse sin la persona y sin el animal: la opción o sin
  contestar, el día y si era un animal o una camada. NUNCA el nombre, la zona, la hora, la especie,
  el sexo ni las solicitudes.
- **FR-025**: De la persona NO DEBE guardarse nada por esta pregunta.
- **FR-026**: Las respuestas DEBEN poder leerlas solo quienes administran, y solo como cuentas.
  Nadie más, tampoco quien contestó, DEBE poder leerlas.
- **FR-027**: Ninguna pantalla de esta historia DEBE indexarse: «Mis animales», los paneles y
  Encuestas siguen siendo privados.

#### Medición

- **FR-028**: Cada borrado con pregunta que se hizo DEBE medirse sin la persona, con su opción o sin
  contestar y si era un animal o una camada, como el resto de la medición del sitio (docs/03 §7).
- **FR-029**: docs/03 §Métricas de éxito DEBE sumar una lectura al lado de la primera: de las
  publicaciones que terminaron sin una adopción en el sitio, qué parte fue por falta de solicitudes,
  por solicitudes que no convencieron o porque el animal se dio por Facebook, Instagram o WhatsApp,
  leída como señal al lado de las opiniones y las encuestas.

### Key Entities

- **Respuesta a «¿Por qué lo borrás?»**: la opción o sin contestar, el día y si era un animal o una
  camada. Sin la persona ni el animal. No se va con ninguna cuenta.
- **Resumen de «Por qué se borraron animales»**: lo que lee quien administra, armado solo con las
  respuestas: cuántas hay, cuántas contestadas y sin contestar, y cuántas por opción, en total y por
  animal o camada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Borrar un animal o una camada lleva los mismos toques que antes de esta historia, con
  o sin contestar, en el 100 % de las pruebas.
- **SC-002**: Cada borrado con pregunta que se hizo deja exactamente una respuesta, y cada borrado
  sin pregunta o que no se hizo no deja ninguna, en el 100 % de las pruebas, también con doble
  toque, reintento y cambios en otra pestaña.
- **SC-003**: En el 100 % de las pruebas de visibilidad, un visitante, una persona cualquiera y la
  persona que contestó no leen ninguna respuesta; solo quien administra lee las cuentas, y nunca con
  el nombre de nadie ni del animal.
- **SC-004**: Después de borrar una cuenta que contestó, los números de «Por qué se borraron
  animales» son los mismos que antes, en el 100 % de las pruebas.
- **SC-005**: En Encuestas, quien administra puede decir qué opción se eligió más y si cambia entre
  animales y camadas, sin salir de la pantalla.

## Assumptions

- **«Con la pregunta a la vista»** es que la confirmación mostraba la pregunta y el borrado se hizo
  en un estado con pregunta. Un borrado que se hizo sin contestar cuenta como «sin contestar»; abrir
  la confirmación y cerrarla sin borrar no cuenta nada, porque la historia cuenta borrados, no
  aperturas.
- **El estado que decide si se cuenta es el del momento de borrar**, no el de abrir la
  confirmación: la historia dice que si el animal cambió en otra pestaña a adoptado o dado de baja
  la respuesta no se cuenta. Si cambió entre dos estados con pregunta, se cuenta.
- **Una camada pausada o vencida** también muestra la pregunta si tiene una cría sin adoptar: la
  historia la pide para «un animal o una camada que no fue adoptada ni dada de baja», y pausada y
  vencida son estados con pregunta en un animal.
- **Concordancia**: solo el título y la tercera opción cambian con el sexo; las otras cuatro no
  llevan pronombre. Una camada concuerda en femenino, como «la camada».
- **«Dice que es opcional sin sonar a formulario»** se resuelve en el texto del título o de una línea
  corta debajo, escrita con sin-slop; el texto exacto lo fija el plan.
- **Cerrar y volver a abrir la confirmación** empieza sin ninguna opción elegida: lo elegido vive
  mientras la confirmación está abierta, y la historia pide que ninguna venga elegida.
- **Los lugares desde donde se borra** son los de hoy: la tarjeta en «Mis animales» y el panel del
  animal o de la camada. La pregunta va en todos.
- **Las referencias «docs/03 §Métricas de éxito», «docs/03 §2», «docs/03 §7» y «Ley 18.331»** del
  cuerpo de la historia son referencias a documentos de producto y a la ley, no números de pantalla.
- **Sin un período de corte**: se cuenta desde el día que llega esta historia. Antes de la beta solo
  borra el equipo.
- **Las decisiones del enjambre de la historia** (las cinco del 2026-10-29, product-owner) van a
  docs/03 palabra por palabra en esta rama: cuatro a §7 y una a §Métricas de éxito.
