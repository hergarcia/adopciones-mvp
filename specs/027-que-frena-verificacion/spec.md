# Feature Specification: Preguntar qué frena a quien deja la verificación a mitad de camino

**Feature Branch**: `feature/234-preguntar-que-frena-verificacion`

**Created**: 2026-10-28

**Status**: Draft

**Input**: Historia #234 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (en `main`, no se rehace): la verificación del teléfono con su «Ahora no», que
aparece cuando se llegó por la puerta de una acción, y su «Cancelar la verificación» con un número a
medias (#10); «Cancelar el cambio» al cambiar un teléfono ya verificado (#10); el pedido de
verificación de identidad con su «Ahora no», que vuelve al animal si se llegó desde «Quiero
adoptar» o a Mi perfil si no (#11, #63); las pantallas de recuperar un número que tiene otra cuenta
(#25); la encuesta de una cada 30 días y la pantalla Encuestas de quien administra (#71); la regla
que no deja escribir un teléfono ni un correo en las respuestas de la encuesta (#71); la medición
sin la persona (#9, #169). Esta spec agrega la pregunta al dejar la verificación, lo que se guarda
de ella y el apartado nuevo de Encuestas. No cambia los niveles ni la verificación misma.

**Vocabulario de esta spec**:

- **Nivel**: el **teléfono** (nivel 1) o la **identidad** (nivel 2), como en docs/06. La pregunta
  nunca se hace por el aval (nivel 3).
- **Una salida** es tocar uno de estos botones, y solo estos:
  - en la verificación del teléfono, «Ahora no» o «Cancelar la verificación», cuando esa persona
    **nunca terminó** de verificar un teléfono;
  - en el pedido de verificación de identidad, «Ahora no», cuando esa persona nunca tuvo la
    identidad verificada.
  No es una salida: «Cancelar el cambio» de un teléfono ya verificado, el «Ahora no» de las
  pantallas de recuperar un número que tiene otra cuenta (#25) o de «Ese número no se puede usar»,
  la pantalla del tope de pedidos rechazados, retirar un pedido de identidad ya enviado, cerrar la
  pestaña o irse por el menú.
- **La pregunta** es «¿Qué te frena para verificar tu teléfono?» o «¿Qué te frena para verificar tu
  identidad?», con sus cinco opciones y «Seguir sin contestar». Está **hecha** desde que la persona
  la ve en pantalla; **contestada** cuando una opción queda mandada; **seguida sin contestar**
  cuando la persona toca «Seguir sin contestar».
- **El destino** de una salida es a donde la llevaba ese botón antes de esta historia: la ficha del
  animal, la pantalla desde la que tocó Publicar, Mi perfil o la que corresponda (ver FR-007).
- **El origen** es desde dónde llegó la persona a verificarse: **publicar** (quería publicar un
  animal o una camada), **solicitar** (quería solicitar un animal, también cuando el teléfono o la
  identidad se le pidieron en el camino a esa solicitud) o **por su cuenta** (cualquier otro camino:
  Mi perfil, avalar, el enlace de una página de preguntas).
- **Encuestas** es la pantalla de quien administra de #71. **«Por qué no se verificaron»** es su
  apartado nuevo.
- Todo día se cuenta y se muestra en hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Decir qué frena al dejar la verificación de identidad (Priority: P1)

Bruno quiere solicitar a Luna, que pide nivel 2. Abre el pedido de verificación de identidad, lee
que tiene que mandar una foto de su cédula y toca «Ahora no». En el mismo lugar donde estaba el
pedido ve «¿Qué te frena para verificar tu identidad?» con cinco opciones y «Seguir sin contestar».
Toca «No quiero mandar fotos de mi cédula» y vuelve a la ficha de Luna. La próxima vez que deje el
pedido, sale directo.

**Why this priority**: es la mitad de la historia que lee de frente la métrica central de la
hipótesis, qué parte de los adoptantes completa el nivel 2 cuando se lo exigen (docs/03 §Métricas
de éxito, 2). Con esta parte sola ya se sabe por qué se va quien no lo completa.

**Independent Test**: con personas sembradas sin la identidad verificada (una que llega desde la
ficha de un animal que pide nivel 2, otra desde Mi perfil, otra con un pedido rechazado que toca
«Intentar de nuevo»): tocar «Ahora no» y ver la pregunta; elegir cada opción y llegar al destino;
volver a tocar «Ahora no» y salir directo; probar «Otra cosa» vacía, con texto, con un teléfono, con
un correo y con más de 300 caracteres; cortar la conexión; tocar dos veces; contestar desde dos
pestañas.

**Acceptance Scenarios**:

1. **Dado** que Bruno quiere solicitar a Luna, que pide nivel 2, y abrió el pedido de verificación
   de identidad, **cuando** toca «Ahora no», **entonces** ve «¿Qué te frena para verificar tu
   identidad?» con cinco opciones (No quiero mandar fotos de mi cédula · Ahora no puedo, lo hago más
   tarde · Me parece demasiado · Prefiero seguir por el grupo de Facebook o WhatsApp · Otra cosa) y
   «Seguir sin contestar», toca «No quiero mandar fotos de mi cédula» y vuelve a la ficha de Luna; la
   respuesta queda contada en solicitar.
2. **Dado** que Diego abrió el pedido de identidad desde Mi perfil y está en la pregunta, **cuando**
   toca «Otra cosa», escribe «no tengo la cédula, tengo pasaporte» y toca «Enviar», **entonces**
   vuelve a Mi perfil, y quien administra lee ese texto en Encuestas con el día y sin su nombre; la
   respuesta queda contada en por su cuenta.
3. **Dado** que Bruno ya recibió la pregunta de la identidad, la haya contestado o no, **cuando**
   vuelve a tocar «Ahora no» en el pedido de identidad otro día, **entonces** sale directo a su
   destino, sin la pregunta.
4. **Dado** que Bruno recibió la pregunta del teléfono hace una semana, **cuando** toca «Ahora no» en
   el pedido de identidad por primera vez, **entonces** recibe la pregunta de la identidad.
5. **Dado** que la pregunta está en pantalla, **cuando** toco «Seguir sin contestar», **entonces**
   voy a mi destino, no se manda ninguna respuesta y Encuestas la cuenta como seguida sin contestar.
6. **Dado** que Ana tiene pendiente la encuesta de una adopción de #71, **cuando** deja el pedido de
   identidad, **entonces** recibe igual esta pregunta, y la encuesta de la adopción sigue donde
   estaba, sin cambiar sus 30 días.
7. **Dado** que mi pedido de identidad fue rechazado y toco «Intentar de nuevo», **cuando** toco
   «Ahora no» y nunca recibí la pregunta de la identidad, **entonces** la recibo.
8. **Dado** que en «Otra cosa» no escribo nada o solo espacios, **cuando** toco «Enviar»,
   **entonces** se manda como «Otra cosa» sin texto y voy a mi destino.
9. **Dado** que en «Otra cosa» escribo mi teléfono o mi correo, **cuando** toco «Enviar»,
   **entonces** no se manda, se me dice que no puede llevar un teléfono ni un correo y que lo saque,
   lo que escribí sigue ahí y «Seguir sin contestar» sigue funcionando.
10. **Dado** que paso de 300 caracteres en «Otra cosa», **cuando** miro el texto, **entonces** veo
    cuántos sobran y «Enviar» no manda nada hasta que quede en 300 o menos.
11. **Dado** que se corta la conexión, **cuando** toco una opción, **entonces** sigo en la pregunta
    con esa opción marcada, se me dice que no se pudo por la conexión y puedo tocarla de nuevo o
    seguir sin contestar; si el primer intento había llegado, el segundo no guarda otra respuesta.
12. **Dado** que contesté la pregunta en otra pestaña, **cuando** contesto la misma desde esta,
    **entonces** queda una sola respuesta, la primera, y voy a mi destino igual.
13. **Dado** que toco dos veces una opción o «Enviar», **cuando** termina, **entonces** queda una
    sola respuesta.

---

### User Story 2 - Decir qué frena al dejar la verificación del teléfono (Priority: P2)

Carla entró para publicar su primer animal y el sitio le pide verificar el teléfono. Toca «Ahora
no» y, en el lugar del formulario, ve «¿Qué te frena para verificar tu teléfono?». Elige «Prefiero
seguir por el grupo de Facebook o WhatsApp» y vuelve a donde estaba. Ana pidió el código y no le
llegó: toca «Cancelar la verificación», elige «No me llegó el código» y sale.

**Why this priority**: el teléfono es lo que el sitio le pide a quien rescata para publicar; la
respuesta separa a quien no quiere dar el número de quien no recibió el código, que piden arreglos
distintos. Reusa todo lo de la US1 con otras opciones.

**Independent Test**: con personas sembradas que nunca verificaron un teléfono (una que llega por
la puerta de publicar, otra por la de solicitar, otra por la de avalar, otra desde Mi perfil con un
número a medias) y una con el teléfono verificado que lo está cambiando: tocar «Ahora no» y
«Cancelar la verificación», antes y después de pedir el código, y ver la pregunta solo donde
corresponde, con su origen; tocar «Cancelar el cambio» y salir como hoy.

**Acceptance Scenarios**:

1. **Dado** que Carla entró para publicar su primer animal y está en la verificación del teléfono,
   **cuando** toca «Ahora no» y elige «Prefiero seguir por el grupo de Facebook o WhatsApp»,
   **entonces** vuelve a donde la llevaba «Ahora no» y la respuesta queda contada en publicar.
2. **Dado** que Ana pidió el código y no le llegó, **cuando** toca «Cancelar la verificación» y
   elige «No me llegó el código», **entonces** su número a medias se cancela como hoy, sale de la
   verificación a su destino y la respuesta queda contada.
3. **Dado** que estoy escribiendo el código, **cuando** toco «Ahora no», **entonces** veo la
   pregunta del teléfono con sus cinco opciones (No quiero dar mi número · No me llegó el código ·
   Ahora no puedo, lo hago más tarde · Prefiero seguir por el grupo de Facebook o WhatsApp · Otra
   cosa) y «Seguir sin contestar».
4. **Dado** que Ana tiene el teléfono verificado y lo está cambiando, **cuando** toca «Cancelar el
   cambio», **entonces** sale como hoy, sin la pregunta.
5. **Dado** que Ana ya recibió la pregunta del teléfono, **cuando** vuelve a tocar «Ahora no» o
   «Cancelar la verificación» en el teléfono, **entonces** sale como hoy, sin la pregunta.
6. **Dado** que alguien le sacó el número a Ana después de que ella lo verificó, **cuando** toca
   «Ahora no» en la verificación del teléfono, **entonces** sale como hoy, sin la pregunta: ya
   terminó una vez la verificación del teléfono.
7. **Dado** que Bruno llegó a verificar el teléfono para solicitar a Luna, o para pedir la
   identidad en el camino a Luna, **cuando** contesta, **entonces** la respuesta queda contada en
   solicitar.

---

### User Story 3 - Leer en Encuestas por qué no se verificaron (Priority: P3)

Quien administra abre Encuestas y, debajo de lo de #71, ve «Por qué no se verificaron», con un
bloque para el teléfono y otro para la identidad. Cada bloque dice cuántas veces se hizo la
pregunta, cuántas se contestó y cuántas se siguió sin contestar; cuántas veces se eligió cada
opción, en total y separado por publicar, solicitar y por su cuenta; y los textos de «Otra cosa»,
del más nuevo al más viejo, con el día. Nunca quién contestó.

**Why this priority**: es donde lo que se contestó se lee; sin este apartado las respuestas existen
pero nadie del equipo las ve. Se apoya en US1 y US2.

**Independent Test**: con respuestas sembradas en los dos niveles y los tres orígenes (contestadas,
con y sin texto de «Otra cosa», seguidas sin contestar y hechas sin ningún toque), abrir Encuestas
como quien administra y ver los números y textos esperados, sin nombres; borrar la cuenta de una
persona que contestó y ver los mismos números; abrir la dirección sin sesión y como una persona que
no administra y ver que no existe.

**Acceptance Scenarios**:

1. **Dado** que administro el sitio, **cuando** abro Encuestas, **entonces** veo «Por qué no se
   verificaron» con un bloque para el teléfono y otro para la identidad, cada uno con cuántas veces
   se preguntó, se contestó y se siguió sin contestar, y cuántas veces se eligió cada una de sus
   cinco opciones, en total y por publicar, solicitar y por su cuenta.
2. **Dado** que Diego mandó «no tengo la cédula, tengo pasaporte», **cuando** abro Encuestas,
   **entonces** leo ese texto en el bloque de la identidad con el día en que lo mandó, sin su nombre,
   antes de los textos más viejos.
3. **Dado** que Diego contestó la pregunta de la identidad y después borró su cuenta, **cuando**
   quien administra abre Encuestas, **entonces** las veces preguntadas, las contestadas y la opción
   que eligió siguen contadas igual, y su texto sigue ahí.
4. **Dado** que nadie recibió todavía ninguna de las dos preguntas, **cuando** abro Encuestas,
   **entonces** el apartado dice «Todavía nadie contestó por qué no se verificó».
5. **Dado** que un nivel tiene la pregunta hecha pero ninguna respuesta, **cuando** abro Encuestas,
   **entonces** su bloque muestra sus cuentas, con las opciones en cero, y dice que nadie contestó
   todavía; sin textos de «Otra cosa», dice que nadie escribió nada todavía.
6. **Dado** que no administro el sitio, o no tengo sesión, **cuando** abro la dirección de
   Encuestas, **entonces** veo que no existe, igual que hoy.
7. **Dado** que hay más textos de «Otra cosa» de los que entran de una vez, **cuando** pido ver los
   anteriores, **entonces** se suman debajo sin perder los que ya veía, como las respuestas libres de
   #71.

---

### Edge Cases

- **La persona se va sin tocar nada con la pregunta en pantalla** (cierra la pestaña, usa el menú):
  la pregunta cuenta como hecha, no como contestada ni como seguida sin contestar, y no se le vuelve
  a hacer por ese nivel.
- **Abre la verificación del mismo nivel en dos pestañas y toca «Ahora no» en las dos**: la pregunta
  cuenta como hecha una sola vez; si contesta en las dos, queda la primera respuesta.
- **La pregunta del teléfono y la de la identidad son independientes**: recibir una no hace ni
  impide la otra.
- **La encuesta de #71 y esta pregunta no se tocan**: esta no gasta los 30 días de #71, y tener una
  encuesta de #71 pendiente o reciente no impide esta.
- **Llegar a la verificación del teléfono por la puerta de aceptar una solicitud**: quien acepta ya
  publicó, así que ya terminó una vez la verificación del teléfono y no recibe la pregunta.
- **Con un número a medias, «Cancelar la verificación» desde Mi perfil** (sin la puerta de una
  acción): el número se cancela como hoy, la pregunta toma el lugar del formulario y, al contestar o
  seguir sin contestar, la persona va a Mi perfil.
- **«Otra cosa» con texto y la opción marcada en otra pestaña antes**: se guarda una sola respuesta,
  la primera que llegó.
- **Una cuenta suspendida** no llega a la verificación (#13), así que no recibe la pregunta.
- **Borrar la cuenta**: se borra también la marca de que ya se le hizo la pregunta; ninguna cuenta
  ni texto de Encuestas cambia.
- **El texto de «Otra cosa» con solo espacios** se manda como «Otra cosa» sin texto; los espacios
  del principio y del final no cuentan para los 300 caracteres.
- **Mientras una respuesta se manda**, la opción tocada se ve marcada y mandándose, y un segundo
  toque no manda otra.

## Requirements *(mandatory)*

### Functional Requirements

#### Cuándo aparece

- **FR-001**: Una salida DEBE mostrar la pregunta de su nivel en la misma pantalla, en el lugar de lo
  que la persona estaba completando, solo si a esa persona todavía no se le hizo la pregunta de ese
  nivel.
- **FR-002**: La pregunta del teléfono DEBE aparecer solo para quien nunca terminó de verificar un
  teléfono, antes o después de pedir el código, al tocar «Ahora no» o «Cancelar la verificación».
- **FR-003**: La pregunta de la identidad DEBE aparecer solo para quien nunca tuvo la identidad
  verificada, al tocar «Ahora no» en el pedido de verificación de identidad, también en el que se
  abre con «Intentar de nuevo» después de un rechazo o un vencimiento.
- **FR-004**: La pregunta NO DEBE aparecer en ningún otro momento: al tocar «Cancelar el cambio» de
  un teléfono verificado, en las pantallas de recuperar un número que tiene otra cuenta o de «Ese
  número no se puede usar», en la pantalla del tope de pedidos rechazados, al retirar un pedido de
  identidad enviado, ni por el aval.
- **FR-005**: A cada persona se le DEBE hacer la pregunta de cada nivel una sola vez, la conteste o
  no. Después de hecha, la salida de ese nivel DEBE llevar directo al destino, como antes de esta
  historia.
- **FR-006**: Esta pregunta NO DEBE contar para la encuesta de una cada 30 días de #71, y esa
  encuesta NO DEBE impedirla ni cambiar por ella.

#### Contestar y salir

- **FR-007**: El destino DEBE ser el mismo que tenía la salida antes de esta historia: con la puerta
  de una acción, la pantalla desde la que se tocó (la ficha del animal, la de Publicar, la que
  fuera); en el pedido de identidad, el animal si se llegó desde «Quiero adoptar» o Mi perfil si no;
  después de «Cancelar la verificación» sin la puerta de una acción, Mi perfil.
- **FR-008**: Tocar una de las cuatro primeras opciones DEBE mandarla y llevar a la persona al
  destino, sin otro paso.
- **FR-009**: Tocar «Otra cosa» DEBE abrir un texto opcional de hasta 300 caracteres con «Enviar».
  «Enviar» con el texto vacío o con solo espacios DEBE mandar «Otra cosa» sin texto.
- **FR-010**: «Seguir sin contestar» DEBE llevar al destino sin mandar ninguna respuesta, en un solo
  toque. La pregunta NUNCA DEBE agregar más de un toque a quien se quiere ir.
- **FR-011**: El texto de «Otra cosa» NO DEBE poder llevar un teléfono ni un correo, con la misma
  regla que las respuestas de #71: si los lleva, no se manda, se le dice a la persona que lo saque y
  lo que escribió sigue ahí.
- **FR-012**: Con más de 300 caracteres, la persona DEBE ver cuántos sobran, y el texto NO DEBE
  mandarse.
- **FR-013**: Si la respuesta no se pudo mandar por la conexión, la persona DEBE seguir en la
  pregunta con la opción marcada y lo que escribió, ver que no se pudo por la conexión, y poder
  intentarlo de nuevo o seguir sin contestar.
- **FR-014**: Tocar dos veces una opción o «Enviar», reintentar después de un corte o contestar la
  misma pregunta desde dos pestañas DEBE guardar una sola respuesta, la primera que llegó, y llevar
  a la persona al destino.
- **FR-015**: Todos los textos de la pregunta, las opciones, los avisos y el apartado de Encuestas
  DEBEN estar en español rioplatense con voseo, escritos y revisados con el skill sin-slop. Las
  preguntas y las opciones son las de la historia, palabra por palabra.

#### Encuestas

- **FR-016**: Encuestas DEBE sumar el apartado «Por qué no se verificaron», con un bloque para el
  teléfono y otro para la identidad.
- **FR-017**: Cada bloque DEBE mostrar cuántas veces se hizo la pregunta, cuántas se contestó y
  cuántas se siguió sin contestar.
- **FR-018**: Cada bloque DEBE mostrar cuántas veces se eligió cada una de sus cinco opciones, en
  total y separado por publicar, solicitar y por su cuenta.
- **FR-019**: Cada bloque DEBE mostrar los textos de «Otra cosa», del más nuevo al más viejo, cada
  uno con el día, y dejar ver los anteriores sin perder los que ya se ven.
- **FR-020**: El apartado sin ninguna pregunta hecha en ningún nivel DEBE decir «Todavía nadie
  contestó por qué no se verificó». Un bloque sin respuestas DEBE decirlo en el bloque, y un bloque
  sin textos de «Otra cosa» DEBE decir que nadie escribió nada todavía. Mientras carga y si no se
  puede leer, el apartado DEBE comportarse como el resto de Encuestas.
- **FR-021**: Encuestas, con su apartado nuevo, DEBE seguir viéndose solo para quien administra;
  para cualquier otra persona, con o sin sesión, su dirección DEBE verse como algo que no existe.
- **FR-022**: Nada en Encuestas DEBE mostrar quién contestó, ni permitir deducirlo.
- **FR-023**: Borrar una cuenta NO DEBE cambiar ningún número del apartado ni sacar ningún texto.

#### Datos personales

- **FR-024**: De cada persona DEBE guardarse solo que ya se le hizo la pregunta de cada nivel, sin el
  día ni la respuesta. Esa marca DEBE borrarse con su cuenta.
- **FR-025**: Cada respuesta DEBE guardarse sin la persona: el nivel, la opción, el origen, el día y
  el texto opcional de «Otra cosa». NUNCA el animal, la camada, la solicitud ni la hora.
- **FR-026**: Las respuestas y sus textos DEBEN poder leerlos solo quienes administran, y nadie
  DEBE poder leer la marca de otra persona.
- **FR-027**: Ninguna pantalla de esta historia DEBE indexarse: la verificación y Encuestas siguen
  siendo privadas.

#### Medición

- **FR-028**: Cada pregunta hecha, cada respuesta con su nivel, su opción y su origen, y cada
  «Seguir sin contestar» con su nivel y su origen DEBEN medirse sin la persona, como el resto de la
  medición del sitio (docs/03 §7). El texto de «Otra cosa» NO DEBE ir a la medición.

### Key Entities

- **Marca de pregunta hecha**: por persona y por nivel, solo que ya se le hizo. Sin día ni
  respuesta. Se va con la cuenta.
- **Respuesta a «¿Qué te frena?»**: nivel, opción, origen, día y, solo con «Otra cosa», el texto
  opcional. Sin la persona.
- **Cuentas de «Por qué no se verificaron»**: por nivel y origen, cuántas veces se hizo la pregunta
  y cuántas se siguió sin contestar. No dependen de las cuentas de personas, así que borrar una no
  las cambia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quien quiere irse llega a su destino con exactamente un toque más que antes de esta
  historia («Seguir sin contestar» o una de las cuatro primeras opciones), en el 100 % de las pruebas.
- **SC-002**: Ninguna persona recibe la pregunta de un mismo nivel dos veces, en el 100 % de las
  pruebas, también con dos pestañas.
- **SC-003**: Ningún doble toque, reintento ni contestación desde dos pestañas deja más de una
  respuesta, en el 100 % de las pruebas.
- **SC-004**: En el 100 % de las pruebas de visibilidad, un visitante, una persona cualquiera y la
  propia persona que contestó no leen ninguna respuesta ni la marca de otra persona; solo quien
  administra lee las respuestas, y nunca con el nombre de nadie.
- **SC-005**: Después de borrar una cuenta que contestó, los números y los textos de «Por qué no se
  verificaron» son los mismos que antes, en el 100 % de las pruebas.
- **SC-006**: En Encuestas, quien administra puede decir para cada nivel qué opción se eligió más y
  si se frena más quien llega por publicar o por solicitar, sin salir de la pantalla.

## Assumptions

- **«Nunca terminó de verificar un teléfono»** se lee como que la cuenta nunca tuvo un teléfono
  verificado. Quien lo perdió porque otra cuenta recuperó el número ya lo terminó una vez: la
  historia deja afuera recuperar un número (#25) y dice que la pregunta es para «la primera vez».
- **El destino de «Cancelar la verificación»**: con la puerta de una acción es el mismo que el de
  «Ahora no»; sin ella, Mi perfil. Hoy cancelar deja en la misma pantalla con el aviso, pero la
  historia dice que después de contestar la persona «sale de la verificación», y desde Mi perfil se
  llegó.
- **El origen de una puerta que no es publicar ni solicitar**: avalar, el enlace de una página de
  preguntas y Mi perfil cuentan como por su cuenta. Pedir el teléfono o la identidad en el camino a
  solicitar un animal cuenta como solicitar. Aceptar una solicitud nunca hace la pregunta (ver Edge
  Cases). Publicar una camada es publicar.
- **«Hecha» es cuando se muestra**: la historia dice «la conteste o no» y que Encuestas cuenta
  cuántas veces se hizo; quien se va sin tocar nada suma a las hechas y no a las otras dos cuentas.
- **Ya se ve la diferencia entre las hechas y la suma de contestadas y seguidas sin contestar**:
  Encuestas no agrega una cuarta cuenta para quien se fue sin tocar nada; la historia pide tres.
- **El texto de «Otra cosa» cuenta como contestada** aunque esté vacío, y su opción suma como «Otra
  cosa».
- **La pregunta repite el «no se pudo» de la conexión con la misma idea que #71**: la opción queda
  marcada y se puede volver a tocar.
- **Los textos de «Otra cosa» se paginan como las respuestas libres de #71**, primero los más nuevos.
- **Sin un período de corte**: la pregunta empieza a hacerse el día que llega esta historia; nadie
  tiene la marca antes, así que a todos los que dejen la verificación desde ese día se les hace una
  vez. Antes de la beta solo usa el sitio el equipo.
- **Las referencias «docs/03 §Hipótesis», «docs/03 §7», «docs/03 §Métricas de éxito» y «docs/01
  §Verificación = fricción»** del cuerpo de la historia son referencias a documentos de producto.
- **Las decisiones del enjambre de la historia** (las cuatro del 2026-10-28, product-owner) van a
  docs/03 §7 palabra por palabra en esta rama.
