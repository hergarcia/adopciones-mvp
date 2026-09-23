# Feature Specification: Verificación de teléfono para poder publicar y solicitar

**Feature Branch**: `feature/10-verificacion-de-telefono`

**Created**: 2026-09-22

**Status**: Draft

**Input**: Historia #10 del backlog, milestone `M1 - Cuentas y confianza`. El cuerpo verbatim está en `story.md`, en esta misma carpeta.

**Ya en `main`**: nada del alcance de esta historia. Existen cuentas, sesión y perfil (historia #9):
una persona puede entrar, completar nombre y zona, editar su perfil y borrar su cuenta. No existe
ningún teléfono, ningún nivel de verificación, y todavía no existen publicar un animal ni
solicitar una adopción.

**Vocabulario de esta spec**: el **teléfono** es el dato de la cuenta; el **número** es lo que se
escribe; solo se aceptan **celulares** uruguayos. Un número **a medias** es uno al que se mandó un
código que todavía no se confirmó. Una cuenta **sin verificar** no está en nivel 1, tenga o no un
número a medias. La **puerta** es la regla que frena publicar y solicitar; el **aviso** es la
pantalla «Aviso de verificación pendiente» que muestra esa puerta. La **espera** son los 60
segundos entre códigos; un **tope** es un máximo por cuenta o por número en las últimas 24 horas
(el "tope diario" es esa ventana móvil, no un día de calendario); el **techo** es el máximo del
sitio entero en las últimas 24 horas. El **distintivo** de cada nivel (la chapita, lo que
`docs/03` llama "badges") es de la historia #12.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verificar el teléfono con un código (Priority: P1)

Una persona con cuenta escribe su celular, recibe un mensaje de texto con un código de seis dígitos
y lo escribe. Su cuenta queda en nivel 1 y su perfil dice que el teléfono está verificado y desde
cuándo. Si algo sale mal —el número no sirve, el código está mal, venció, no llegó, pidió
demasiados—, la pantalla dice qué pasó y cuál es el paso siguiente.

**Why this priority**: es la historia. Sin esto no hay nivel 1, y sin nivel 1 nadie va a poder
publicar ni solicitar cuando esas acciones existan. Todo lo demás de la historia se apoya en que
esto funcione.

**Independent Test**: se prueba sola con una cuenta con perfil completo y sin teléfono: desde «Mi
perfil» se pide el código, se escribe el que llegó y el perfil pasa a mostrar el teléfono
verificado con su fecha. No necesita la puerta de publicar ni el cambio de número.

**Acceptance Scenarios**:

1. **Dado** que tengo cuenta y todavía no verifiqué el teléfono, **cuando** escribo mi celular y
   pido el código, **entonces** me llega un mensaje de texto y veo la pantalla donde escribirlo, con
   el número al que se mandó y cuánto falta para poder pedir otro.
2. **Dado** que recibí el código, **cuando** lo escribo bien antes de que venza, **entonces** mi
   cuenta queda en nivel 1 y vuelvo a donde estaba; si no venía de ningún lado, a «Mi perfil»,
   con la confirmación a la vista.
3. **Dado** que tengo el teléfono verificado, **cuando** miro mi perfil, **entonces** veo mi
   número, que está verificado, que mi cuenta está en nivel 1 y la fecha desde la que lo está.
4. **Dado** que todavía no verifiqué el teléfono, **cuando** miro mi perfil, **entonces** en lugar
   de un espacio vacío veo el paso pendiente, para qué sirve y cómo empezarlo.
5. **Dado** que el código venció, **cuando** lo escribo, **entonces** se me dice que venció y puedo
   pedir uno nuevo con un toque, sin volver a escribir el número.
6. **Dado** que pedí un código nuevo, **cuando** escribo el anterior, **entonces** no sirve: vale
   solamente el último, y se me dice que use el último que me llegó.
7. **Dado** que ya pedí 5 códigos en las últimas 24 horas, **cuando** pido otro, **entonces** no se
   manda nada y se me dice qué día y a qué hora voy a poder pedirlo de nuevo.
8. **Dado** que escribo un número que no es un celular uruguayo, **cuando** pido el código,
   **entonces** se me dice en el mismo campo qué está mal —no tiene forma de celular, es un fijo, es
   de otro país— y no se manda nada.
9. **Dado** que escribo el código equivocado 5 veces seguidas, **cuando** intento otra vez,
   **entonces** ese código deja de servir y se me pide pedir uno nuevo en vez de seguir probando.
10. **Dado** que el mensaje no llega, **cuando** espero en la pantalla del código, **entonces** veo
    cuánto falta para poder pedir otro —la espera entre códigos o, si llegué al tope del día, qué
    día y a qué hora—, el número al que se mandó con la opción de corregirlo, y qué revisar
    mientras tanto: que el número esté bien escrito, que el teléfono tenga señal, y que el mensaje
    no haya caído en los mensajes bloqueados o no deseados; y que puede tardar un minuto.
11. **Dado** que el número que escribí ya está verificado en otra cuenta, **cuando** escribo el
    código que me llegó, **entonces** no se verifica, se me dice que ese número ya está en uso en
    otra cuenta y qué puedo hacer, y mi cuenta vuelve a como estaba antes de pedir ese código.
12. **Dado** que el mensaje no se pudo mandar por una falla del servicio de mensajes, **cuando**
    pido el código, **entonces** se me dice que no salió, no se me dice que se mandó, y puedo
    reintentar enseguida sin que ese intento cuente para ningún tope.
13. **Dado** que empecé a verificar un número y no escribí el código, **cuando** vuelvo al sitio,
    **entonces** sigo sin verificar y veo el número que quedó a medias, con la opción de terminar
    —escribir el código o pedir otro— o de cancelar.

---

### User Story 2 - La puerta de publicar y solicitar (Priority: P2)

Mirar el sitio es libre. Publicar un animal y solicitar una adopción exigen nivel 1. Quien toca
una de esas acciones sin el teléfono verificado ve el aviso: por qué no puede y dónde verificarse
ahí mismo. Al terminar, vuelve a la acción que había tocado.

**Why this priority**: es el motivo de la verificación, pero publicar y solicitar llegan en
historias posteriores (M2 y M3). Esta historia deja lista la puerta y el aviso para que esas
historias los usen; hasta entonces, la puerta se prueba abriéndola como la van a abrir ellas.

**Independent Test**: se prueba con una cuenta sin verificar abriendo el aviso como lo abre una
acción de publicar o de solicitar: el aviso explica el motivo de esa acción, deja verificar ahí
mismo y, al confirmar el código, lleva al destino que traía. Con una cuenta ya verificada, la
puerta deja pasar sin mostrar nada.

**Acceptance Scenarios**:

1. **Dado** que no tengo el teléfono verificado, **cuando** toco publicar o solicitar, **entonces**
   veo que hace falta verificar el teléfono, por qué, y el campo para escribir mi número ahí mismo,
   sin ir a otra pantalla a buscarlo.
2. **Dado** que me verifiqué desde ese aviso, **cuando** confirmo el código, **entonces** vuelvo a
   la acción que había tocado, no a mi perfil.
3. **Dado** que ya tengo nivel 1, **cuando** toco publicar o solicitar, **entonces** la puerta no
   me muestra nada y sigo de largo.
4. **Dado** que no tengo sesión, **cuando** toco publicar o solicitar, **entonces** primero se me
   pide ingresar —y completar el perfil si me falta—, después verificar el teléfono, y al final
   llego a la acción, sin perder el destino en ninguno de los pasos.
5. **Dado** que no tengo el teléfono verificado, **cuando** recorro el sitio, **entonces** puedo
   mirar todo lo que se puede mirar sin que se me pida el teléfono.
6. **Dado** que tengo un número a medias, **cuando** llego al aviso, **entonces** veo ese número y
   puedo terminar con él, en lugar de empezar de cero.
7. **Dado** que no quiero verificarme ahora, **cuando** estoy en el aviso, **entonces** tengo una
   salida para seguir mirando el sitio sin verificar nada.

---

### User Story 3 - Cambiar el número (Priority: P3)

Quien cambió de celular carga el nuevo y lo confirma con un código. Hasta que lo confirma, la
cuenta está sin verificar; al confirmarlo, el número anterior deja de estar asociado a la cuenta.
Si se arrepiente en el medio, cancela y vuelve a quedar como estaba.

**Why this priority**: sin esto, quien cambia de número queda con un teléfono verificado que ya no
es suyo, o tiene que borrar la cuenta. Pero es lo que menos gente hace, y el producto funciona sin
esto hasta que alguien cambia de celular.

**Independent Test**: se prueba con una cuenta ya verificada: se carga otro número, la cuenta pasa
a sin verificar, se confirma el código y el perfil muestra el número nuevo con la fecha nueva; el
anterior queda libre para verificarse en otra cuenta.

**Acceptance Scenarios**:

1. **Dado** que tengo el teléfono verificado, **cuando** cargo un número nuevo y confirmo su
   código, **entonces** mi perfil muestra el nuevo, verificado con la fecha de hoy, y el anterior
   deja de estar asociado a mi cuenta.
2. **Dado** que pedí el código para el número nuevo, **cuando** todavía no lo confirmé,
   **entonces** mi cuenta está sin verificar y la puerta de publicar y solicitar me frena.
3. **Dado** que empecé a cambiar de número y no confirmé el nuevo, **cuando** vuelvo al sitio,
   **entonces** sigo sin verificar y veo el número que quedó a medias, para terminar o cancelar.
4. **Dado** que tengo un cambio a medias, **cuando** lo cancelo, **entonces** vuelvo a estar
   verificado con mi número anterior y su fecha original, y se me confirma.
5. **Dado** que tengo el teléfono verificado, **cuando** escribo como número nuevo el mismo que
   ya tengo, **entonces** se me dice que ese ya es mi número verificado, no se manda nada y no
   cambia nada.
6. **Dado** que estoy por cambiar de número, **cuando** miro la pantalla antes de pedir el código,
   **entonces** se me avisa que hasta confirmar el nuevo voy a quedar sin verificar.

---

### Edge Cases

- **Código vencido**: pasados 10 minutos desde que se mandó, el código no sirve. Se dice que venció,
  no que está mal, y se ofrece pedir otro sin reescribir el número.
- **Código reemplazado**: pedir uno nuevo que sale invalida el anterior. Escribir el viejo dice que
  hay uno más nuevo y que use ese. El producto recuerda los códigos anteriores 24 horas; pasado ese
  plazo, un código viejo se trata como equivocado.
- **Motivos superpuestos**: si un código cae en más de un motivo a la vez, gana el más útil, en
  este orden: reemplazado → agotado por intentos → vencido → equivocado.
- **Intentos fallidos seguidos**: al quinto intento equivocado con el mismo código, ese código muere.
  Pedir uno nuevo vuelve a dar 5 intentos.
- **Pedidos que no reemplazan nada**: un pedido que no salió, por una falla del servicio o porque
  el servicio rechazó el número, no cambia nada: el número a medias y su código siguen como
  estaban. Uno que el tope por número frenó en silencio, en cambio, se comporta en todo como uno
  que salió (FR-006a).
- **Sin código vivo** (el último venció hace más de un día, o se canceló en otra pestaña): cualquier
  código escrito se trata como vencido, y se ofrece pedir otro. Si además ya no hay número a medias,
  se dice que ya no hay un número esperando el código y se ofrece ir a «Verificar teléfono».
- **Insistencia**: una espera de 60 segundos entre códigos y un tope de 5 códigos por cuenta en 24
  horas, que se le dicen a la persona; un tope de 10 códigos por número en 24 horas sumando todas
  las cuentas, que no se dice; y un techo de 200 mensajes en 24 horas para todo el sitio (FR-011b).
- **Número con otro formato**: `099 123 456`, `99123456`, `+598 99 123 456`, `598-99-123-456`,
  `00598 99 123 456` y `+598 099 123 456` son el mismo número. Se acepta cualquiera y se muestra
  siempre igual.
- **Fijo o extranjero**: un número fijo uruguayo no recibe mensajes de texto y se rechaza diciendo
  eso; uno de otro país se rechaza diciendo que por ahora solo se aceptan celulares de Uruguay.
- **Número con forma válida que el servicio de mensajes rechaza** (no está asignado, no recibe
  mensajes): se dice que a ese número no le pueden llegar mensajes y que lo revise. Es un error de
  lo que se escribió, no una falla del servicio, así que cuenta como un pedido.
- **Número verificado en otra cuenta**: se descubre al escribir el código correcto, no al pedirlo
  (FR-008). No se verifica, el número a medias se descarta y la cuenta vuelve a como estaba.
- **Dos cuentas confirman el mismo número a la vez**: una sola lo consigue; la otra recibe el
  mensaje de número en uso.
- **Mismo número a medias en dos cuentas**: un número a medias no le pertenece a nadie. El primero
  que lo confirma se lo queda.
- **El número nuevo es el que ya tengo verificado**: no se manda nada ni se inicia un cambio;
  también con un cambio a medias, que sigue a medias hasta terminarlo o cancelarlo.
- **Cambio a medias que se cancela**: vuelve el número anterior, verificado, con su fecha original.
- **Número a medias que se abandona**: pasados 7 días sin confirmar se descarta solo, como si se
  hubiera cancelado.
- **El mensaje no salió**: no se dice que se mandó; se deja reintentar enseguida y ese intento no
  cuenta para ningún tope.
- **Dos toques seguidos en pedir, confirmar o cancelar**: se procesa uno solo; la acción queda
  ocupada mientras tanto.
- **Confirmar falla por algo que no es el código** (se cortó la conexión, el sitio no respondió):
  se dice que no se pudo comprobar, lo escrito sigue ahí, se puede reintentar, y no cuenta como
  intento equivocado.
- **Código pegado o completado por el teléfono**: se acepta igual que tipeado, con o sin espacios en
  el medio.
- **Sesión que vence con la pantalla del código abierta**: al confirmar se pide ingresar y, al
  volver, el número a medias sigue ahí.
- **Pantalla del código sin número a medias** (se canceló en otra pestaña, se descartó a los 7 días,
  se volvió atrás después de verificar): no se muestra; la persona va a «Verificar teléfono», o a su
  destino si ya está verificada.
- **Persona ya verificada que abre la pantalla de verificar**: ve su número, que está verificada, y
  la opción de cambiar el número, no un formulario vacío.
- **Aviso abierto sin acción o con una acción que no existe**: se muestra «Verificar teléfono» a
  secas, sin motivo.
- **Persona sin perfil completo que intenta verificar**: primero completa el perfil (regla de la
  historia #9) y después sigue a verificar, sin perder el destino.
- **Borrar la cuenta**: borra el teléfono, su fecha, el número a medias y el registro de pedidos de
  la cuenta. El número queda libre para otra cuenta.
- **Borrar la cuenta para esquivar el tope**: no resetea el tope por número (FR-021).

## Pantallas

Cada pantalla, con su estado vacío, su estado mientras carga o guarda, y su estado de error. Igual
que en la historia #9: lo que falta se dibuja con la forma de lo que va a venir, el error dice qué
pasó y qué hacer, y lo que la persona escribió no se pierde salvo cuando ya se sabe que no sirve.

| Pantalla | Vacío | Cargando / guardando | Error |
|---|---|---|---|
| **Verificar teléfono** (y el aviso) | No aplica: es el campo del número, con el aviso de FR-004. Si hay un número a medias, muestra ese número con terminar y cancelar, y el campo llega con ese número escrito, para corregirlo. Si la persona ya está verificada, muestra su número y la opción de cambiarlo, con la advertencia de FR-016. | Mientras trae el estado del teléfono, se dibuja la forma del número a medias y del campo. Mientras se pide el código, la acción queda ocupada y no admite un segundo pedido. Mientras se cancela, lo mismo. Si ahora no se puede pedir, el botón está deshabilitado y al lado dice cuándo se va a poder (FR-010a). | El número inválido, fijo, extranjero o que no recibe mensajes se dice en el campo, con lo escrito intacto; la espera dice cuántos segundos faltan; el tope diario y el techo del sitio dicen qué día y a qué hora; si el mensaje no salió, se dice y el número sigue escrito; si no se pudo saber si salió, se dice y se muestra el estado real (FR-009e); si cancelar falla, se dice y todo queda como estaba; si no se pudo traer el estado del teléfono, se dice y se ofrece reintentar. |
| **Escribir el código** | No aplica: sin un número a medias, la pantalla no se muestra (ver Edge Cases). Siempre muestra a qué número se mandó, cuánto falta para poder pedir otro y, si vino del aviso, para qué acción es. | Mientras se confirma, la acción queda ocupada. La cuenta regresiva está visible desde que carga, y «pedir otro» se habilita recién cuando se puede pedir (FR-010a). Al pedir otro, se confirma que salió y el campo se vacía (FR-007d). | Código equivocado (con cuántos intentos quedan), vencido, reemplazado, agotado, número en uso, y la falla al comprobar: cada uno con su mensaje y su salida en un toque. Después de un código que no sirvió, el campo queda vacío y con el foco, listo para el siguiente; después de una falla al comprobar, lo escrito sigue ahí. |
| **Mi perfil** (sección de teléfono) | Sin teléfono muestra el paso pendiente —qué es, para qué sirve y el acceso a hacerlo— en vez de un espacio en blanco. Con un número a medias muestra ese número, que la cuenta está sin verificar, y terminar y cancelar (FR-018). | Se dibuja con la forma de la sección mientras carga el resto del perfil. | Si no se pudieron traer los datos, se dice y se ofrece reintentar, como el resto del perfil. |
| **Aviso de verificación pendiente** | No aplica: siempre dice qué acción se tocó y por qué hace falta el teléfono. Sin acción o con una desconocida, es «Verificar teléfono» a secas. | Igual que «Verificar teléfono», porque la verificación empieza ahí mismo. | Igual que «Verificar teléfono». |

## Requirements *(mandatory)*

### Functional Requirements

#### El número

- **FR-001**: El producto DEBE aceptar únicamente celulares de Uruguay. Un celular uruguayo tiene
  nueve dígitos y empieza con 09 cuando se escribe con el cero, u ocho dígitos que empiezan con 9
  cuando se escribe con el código de país 598. DEBE aceptar el número escrito con o sin el cero,
  con o sin el código de país —escrito `598`, `+598` o `00598`—, también con el código de país y el
  cero a la vez (`+598 099…`), y con espacios, puntos, guiones o paréntesis en el medio. DEBE tratar
  todas esas formas como el mismo número.
- **FR-002**: Ante un número que no sirve, el producto DEBE decir cuál de estos casos es, en el
  mismo campo, sin mandar nada y sin perder lo escrito: **no tiene forma de celular** uruguayo;
  **es un fijo** (empieza con 2 o con 4), que no recibe mensajes de texto; **es de otro país**, y
  por ahora solo se aceptan celulares de Uruguay.
- **FR-002a**: Si el número tiene forma de celular pero el servicio de mensajes dice que no le
  puede llegar un mensaje (no está asignado, no los recibe), el producto DEBE decir que a ese número
  no le llegan mensajes y que lo revise, con lo escrito intacto. Como es un error de lo escrito y no
  una falla del servicio, ese pedido DEBE contar para la espera y el tope de FR-010.
- **FR-003**: El producto DEBE mostrar el número siempre de la misma forma, con el cero y agrupado
  de a tres (`099 123 456`), sin importar cómo se escribió.
- **FR-004**: Junto al campo del número, antes de pedir el código, el producto DEBE decir las dos
  mitades de la verdad, igual que la historia #9 con el perfil: que el número **no se le muestra a
  nadie**, y que **sí se le va a mostrar a la otra persona cuando acepte una solicitud suya o le
  acepten una**, para que puedan hablar. Decir solo la primera haría que la persona lo dé creyendo
  que queda privado para siempre.

#### El código

- **FR-005**: El producto DEBE mandar un código de **seis dígitos** por mensaje de texto al número
  escrito. El único canal es el mensaje de texto: no se elige canal ni hay llamada de voz.
- **FR-006**: El código DEBE vencer a los **10 minutos** de mandado y DEBE servir **una sola
  vez**. Pedir otro código **que sale** DEBE dejar sin efecto el anterior: **vale solamente el
  último**. Un pedido que no salió —por una falla del servicio (FR-009a) o porque el servicio
  rechazó el número (FR-002a)— NO DEBE cambiar nada: el número a medias y su código siguen como
  estaban.
- **FR-006a**: Un pedido que el tope por número frenó en silencio (FR-011) DEBE comportarse, **en
  todo lo que la persona puede observar**, igual que uno que salió: deja sin efecto el código
  anterior, abre un código nuevo con sus 10 minutos y sus 5 intentos, deja el número a medias, y
  cuenta para la espera, el tope y el techo. La única diferencia es que el mensaje no llega; ese
  código no lo recibió nadie, así que cualquier cosa que se escriba es "equivocado". Si se
  comportara distinto —si dejara vivo el código viejo, o respondiera "vencido" en vez de
  "equivocado"—, esa diferencia contaría la actividad de un número ajeno.
- **FR-007**: Después de **5 intentos equivocados seguidos** con un mismo código, ese código DEBE
  dejar de servir aunque no haya vencido, y el producto DEBE pedirle a la persona que pida uno
  nuevo en lugar de dejarla seguir probando. Mientras queden intentos, DEBE decir cuántos quedan.
  Cuenta como intento todo código de seis dígitos que no es el vigente, **también uno anterior que
  fue reemplazado**: para el código vigente, es un intento más de adivinarlo. No cuenta lo que no
  tiene seis dígitos, que se rechaza por la forma sin comparar nada (FR-007b). Cada código tiene
  sus propios 5 intentos: los de uno no pasan al siguiente, y uno nuevo nunca devuelve intentos a
  uno viejo.
- **FR-007a**: El producto DEBE distinguir, en el mensaje que muestra, por qué un código no sirvió
  —**equivocado**, **vencido**, **reemplazado** por uno más nuevo, **agotado** por intentos— y en
  todos los casos salvo "equivocado con intentos restantes" DEBE ofrecer pedir otro, sin volver a
  escribir el número; el pedido está disponible apenas lo permitan la espera y el tope de FR-010, y
  hasta entonces se dice cuánto falta. Cuando cae en más de un motivo, gana el primero de este
  orden: reemplazado, agotado, vencido, equivocado. Los códigos anteriores se recuerdan 24 horas
  (FR-022); después, uno viejo se trata como equivocado. El mensaje de **reemplazado** DEBE nombrar
  el número al que se mandó el último, que puede no ser el que muestra una pestaña vieja.
- **FR-007d**: Después de pedir otro código desde la pantalla del código, el producto DEBE
  confirmar que salió uno nuevo y a qué número, vaciar el campo para que no se mande el anterior,
  y volver a contar la espera y los intentos desde cero.
- **FR-007b**: El campo del código DEBE aceptar el código pegado o sugerido por el propio teléfono,
  con o sin espacios o guiones en el medio, que se ignoran. Cualquier otra cosa —letras, un texto
  entero pegado— se rechaza por la forma y no cuenta como intento.
- **FR-007c**: Si confirmar falla por algo que no es el código —la conexión, el sitio—, el producto
  DEBE decir que no pudo comprobarlo, DEBE conservar lo escrito, DEBE dejar reintentar, y ese
  intento NO DEBE contar como equivocado.
- **FR-008**: **Un número verificado pertenece a una sola cuenta.** Si el número ya está verificado
  en otra cuenta, el producto NO DEBE verificarlo en esta. Lo DEBE decir **recién cuando la persona
  escribe el código correcto**, no al pedirlo: así solo se entera de que el número está en uso quien
  demostró tenerlo en la mano. El mensaje NO DEBE revelar nada de la otra cuenta —ni su correo, ni
  su nombre—, y DEBE ofrecer los caminos, sin ambigüedad: **verificar otro número** en esta
  cuenta; o, si la otra cuenta es suya, **entrar con esa**; y si quiere quedarse con esta, entrar a
  la otra, borrarla —eso libera el número (FR-020)— y volver a verificarlo acá.
- **FR-008c**: El mensaje de "número en uso" DEBE quedar a la vista en «Escribir el código», donde
  la persona escribió el código, aunque el número a medias ya se haya descartado (FR-008b): la
  pantalla no se va sola. Si era un cambio y la cuenta volvió a nivel 1 estando en el aviso, además
  de los caminos de FR-008 DEBE ofrecer seguir a la acción que había tocado.
- **FR-008b**: Después de "número en uso", ese código DEBE quedar usado, el número a medias DEBE
  descartarse, y la cuenta DEBE volver a como estaba antes de pedirlo: sin teléfono si era la
  primera verificación, o verificada con el número anterior y su fecha original si era un cambio.
  Así la persona no queda frenada por la puerta ni da vueltas pidiendo códigos para un número que
  no va a poder verificar.
- **FR-008a**: Si dos cuentas confirman el mismo número al mismo tiempo, exactamente una DEBE
  quedar verificada y la otra DEBE recibir el mensaje de FR-008.
- **FR-009**: El mensaje de texto DEBE decir de qué sitio viene, el código, que vence en 10
  minutos, que no se le pasa a nadie, y que si la persona no lo pidió lo ignore. DEBE caber en **un
  solo mensaje de texto** —cada mensaje de más cuesta plata—, y su texto DEBE vivir junto al resto
  de los textos del producto, traducible desde el primer día. Para que entre, el texto se escribe
  sin las letras que obligan a partir el mensaje (la á, la í, la ó y la ú: "codigo", "pediste"), y
  cuenta con un nombre de sitio de hasta 20 caracteres, que es el máximo que el nombre definitivo
  puede tener sin volver a revisar este texto.
- **FR-009a**: Si el mensaje no se pudo mandar por una falla del servicio de mensajes, el producto
  NO DEBE decir que se mandó: DEBE decir que no salió y que no es culpa de la persona, DEBE dejar
  reintentar enseguida, y ese intento NO DEBE contar para ningún tope de FR-010, FR-011 ni FR-011b.
- **FR-009b**: Un código vigente NO DEBE poder recuperarse a partir de lo que el producto guarda:
  quien consiga una copia de los datos guardados —por un error, una filtración o un respaldo— no
  puede leer ni deducir ningún código. El producto solo puede comprobar si lo que se escribió
  coincide. No protege de quien opera el sitio con todas sus llaves, que igual podría marcar
  cualquier número como verificado; protege de que los datos, fuera del sitio, sirvan para algo.
- **FR-009c**: Donde no hay servicio de mensajes —porque todavía no se configuró—, el producto NO
  DEBE dejar el código en ningún lado donde alguien lo pueda leer: el pedido DEBE terminar como una
  falla de FR-009a. La única excepción es **la copia local del producto**, la que corre en la
  máquina de quien lo desarrolla y en las pruebas automáticas, que solo tiene personas y números de
  mentira: ahí el mensaje queda en la propia máquina, donde lo lee la prueba y también quien valida
  el build local. La excepción depende de dónde corre el producto, no de una opción que alguien
  pueda olvidarse de apagar: en cualquier otro lugar, sin servicio, falla.
- **FR-009e**: Si pedir el código falla por algo que no es el servicio de mensajes —se cortó la
  conexión, el sitio no respondió—, el producto DEBE decir que no pudo confirmar si el código salió
  y DEBE mostrar el estado real al volver a mirar: si salió, el número aparece a medias con su
  cuenta regresiva y se puede ir a escribir el código; si no, el número sigue escrito para
  reintentar.
- **FR-009d**: **El teléfono NO DEBE servir para ingresar a la cuenta.** Las únicas formas de entrar
  siguen siendo las de la historia #9 (`docs/03` §1). Ningún camino del producto fuera de esta
  verificación DEBE mandar un código a un teléfono. Si el teléfono fuera una llave, quien recibe un
  número que la compañía reasignó entraría a la cuenta del dueño anterior, y habría una vía de
  mandar códigos que no pasa por ningún tope.

#### Topes

- **FR-010**: El producto DEBE frenar los pedidos de código de una cuenta con una espera y un tope,
  que se le dicen a la persona porque son sobre sus propios actos. Cuentan todos los pedidos de la
  cuenta, **también los que el tope por número frenó en silencio** (FR-011) —si no contaran, esa
  diferencia delataría que el número es ajeno y otras cuentas lo usan— y los que el servicio
  rechazó por el número (FR-002a). No cuentan los que no salieron por una falla del servicio
  (FR-009a), ni escribir el número que ya está verificado (FR-017c), que no pide nada:
  1. **Espera entre códigos**: 60 segundos desde el último pedido.
  2. **Tope diario**: **5 pedidos por cuenta en las últimas 24 horas** (ventana móvil, no por día de
     calendario), sumando todos los números a los que los pidió. Al pasarse, el producto DEBE decir
     qué día y a qué hora, en hora de Uruguay, va a poder pedir otro ("hoy a las 18:40", "mañana a
     las 9:15").
- **FR-010a**: En toda pantalla desde la que se pide un código —«Verificar teléfono», el aviso y
  «Escribir el código»—, si la persona no puede pedir uno ahora, el producto DEBE mostrar cuándo va
  a poder según **lo que más tarde se libere** de la espera, el tope diario y el techo del sitio, y
  el botón de pedir DEBE habilitarse recién entonces: un botón habilitado que después dice
  "llegaste al tope" es una promesa rota. Si igual llega un pedido que no se puede atender —dos
  pestañas, una hora que se venció mientras miraba—, la respuesta DEBE ser la misma información.
- **FR-011**: El producto DEBE frenar además los códigos **a un mismo número**: como mucho **10 en
  las últimas 24 horas, sumando todas las cuentas**, para que nadie use el producto para llenarle de
  mensajes el teléfono a otra persona. Es el doble del tope de una cuenta, así que **una sola
  cuenta no alcanza para dejar a un número sin códigos**. Este tope NO DEBE decirse a quien pide:
  el mensaje simplemente no sale y la pantalla es la misma que cuando sale. Es **la única excepción**
  a FR-009a y a SC-004, y es deliberada: decir "a ese número ya se le mandaron códigos hoy" le
  contaría a cualquiera la actividad de un número ajeno.
- **FR-011a**: El caso residual de FR-011 —varias cuentas gastaron el cupo de un número y su dueña
  no recibe el código— queda **aceptado a propósito**, igual que en la historia #9 (FR-006c): la
  alternativa es la filtración que FR-011 impide. Y queda dicho entero: hacen falta al menos dos
  cuentas por día, cada una con su correo abierto, pero con cuentas nuevas cada día el bloqueo **se
  puede sostener**, y la dueña recibe hasta 10 mensajes por día que no pidió. Mientras la medición
  no llegue a una herramienta (M5), quien opera el sitio no lo va a ver solo: se entera por la
  persona afectada, y su remedio es liberar el conteo de ese número por fuera del producto. Se
  revisa si pasa una sola vez (ver Assumptions).
- **FR-011b**: El producto DEBE tener un **techo de 200 mensajes en las últimas 24 horas para todo
  el sitio** (ventana móvil, como los topes). Cuentan los mensajes que salieron o están saliendo, y
  también los pedidos que el tope por número frenó en silencio: si esos no contaran, un sitio a un
  mensaje del techo serviría para averiguar si el pedido anterior a un número salió o no (FR-006a).
  Un pedido rechazado, que falló o que frenó la espera o el tope de la cuenta no cuenta. Crear cuentas es
  gratis, así que el tope por cuenta solo no frena a quien crea muchas; el techo pone un límite a
  lo que el sitio puede gastar en un día. Al alcanzarlo, a quien pide un código se le DEBE decir
  que por ahora el sitio no puede mandar más códigos y qué día y a qué hora, en hora de Uruguay,
  va a poder pedir. Es un dato del sitio, no de ninguna persona ni de ningún número, así que
  decirlo no revela nada.

#### Nivel 1 y la puerta

- **FR-012**: Una cuenta DEBE estar en **nivel 1** cuando su correo está confirmado y tiene un
  teléfono verificado sin ningún cambio de número a medias. En este producto el correo queda
  confirmado siempre al entrar (historia #9), así que en la práctica nivel 1 es tener el teléfono
  verificado y ningún número a medias. Sin eso, la cuenta está **sin verificar**.
- **FR-013**: Publicar un animal y solicitar una adopción DEBEN exigir nivel 1. Esta historia DEBE
  dejar la puerta y el aviso listos para que esas acciones, que llegan en historias posteriores, los
  usen sin rehacerlos: la regla de quién pasa, el aviso con el motivo de cada acción, y la vuelta a
  la acción después de verificar. La puerta vale **para cualquier forma de llegar a la acción**:
  tocarla, un enlace directo, volver atrás, y también al enviarla, porque la cuenta pudo bajar a
  sin verificar en el medio (por ejemplo, empezando un cambio de número en otra pestaña). Qué pasa
  con lo que la persona había escrito en esa acción es de la historia que la construye, que no lo
  puede perder.
- **FR-013g**: Esta puerta es **el piso**: nivel 1 para participar. El nivel mínimo que un
  publicador puede exigirle a quien solicita (`docs/03` §2, nivel 1 o 2) es otra regla, que se suma
  encima de esta en las historias que la construyan; no reemplaza a esta ni la rehace.
- **FR-013a**: La puerta DEBE saltar **al tocar la acción**, antes de que la persona empiece a
  escribir nada en ella: publicar y solicitar no se empiezan sin nivel 1, así que no hay nada que
  perder. El aviso DEBE nombrar la acción que se tocó (publicar un animal o solicitar una adopción),
  decir por qué hace falta el teléfono verificado en una frase, y dejar verificar **ahí mismo**: el
  campo del número está en el aviso. El paso del código es la pantalla «Escribir el código» de
  siempre, que sigue diciendo para qué acción es.
- **FR-013b**: Después de verificar desde el aviso, la persona DEBE llegar a la acción que había
  tocado. Si el destino no es una pantalla de este sitio, DEBE ignorarse con la misma validación
  que la historia #9 aplica al destino de vuelta (FR-014). Lo que cambia, a propósito, es a dónde
  cae: la #9 manda al inicio, y acá la persona DEBE quedar en «Mi perfil» con la confirmación de
  FR-018a, porque acaba de verificarse y ahí es donde se ve.
- **FR-013c**: Sin sesión, la puerta DEBE pedir ingresar primero y, si falta, completar el perfil;
  el destino DEBE sobrevivir a los tres pasos (ingresar, completar el perfil, verificar) cuando se
  hacen en el mismo dispositivo. Si el ingreso se termina en otro dispositivo, rige lo que la
  historia #9 ya decidió (su FR-004a): el destino se pierde y la persona queda en «Mi perfil».
- **FR-013d**: Con nivel 1, la puerta NO DEBE mostrar nada ni agregar un paso.
- **FR-013e**: El aviso DEBE ofrecer una salida, «Ahora no», que deja a la persona en la pantalla
  desde la que tocó la acción cuando esa pantalla es de este sitio y la acción la mandó junto con
  el destino, o en el inicio si no. Esa pantalla de origen DEBE sobrevivir a ingresar y completar el
  perfil igual que el destino (FR-013c), y «Ahora no» DEBE estar también en «Escribir el código»
  cuando se llegó desde el aviso. Verificarse es el precio de participar, no de mirar.
- **FR-013f**: Abierto sin acción o con una acción que no existe, el aviso DEBE mostrarse como
  «Verificar teléfono» a secas, sin inventar un motivo. Si trae un destino válido, al verificar se
  va ahí igual.
- **FR-014**: Mirar el sitio NO DEBE exigir el teléfono verificado. Ninguna pantalla que hoy se
  puede mirar sin teléfono DEBE empezar a pedirlo.

#### Número a medias y cambio de número

- **FR-015**: Pedir un código que sale —o que el tope por número frena en silencio— deja ese número
  **a medias** hasta que se confirma, se cancela, o pasan **7 días** desde el último código pedido
  para ese número (cada pedido nuevo vuelve a contar los 7 días). El número a medias DEBE mostrarse
  en «Mi perfil», en «Verificar teléfono» y en el aviso de la puerta, con tres acciones:
  **terminar** (escribir el código o pedir otro), **corregir el número** y **cancelar**. Pasados los
  7 días DEBE descartarse como si se hubiera cancelado.
- **FR-015a**: Mientras se cancela, la acción DEBE quedar ocupada y no admitir un segundo toque. Al
  terminar, la persona DEBE quedar en la pantalla desde la que canceló —«Mi perfil», «Verificar
  teléfono» o el aviso, con su acción y su destino— y el producto DEBE confirmar qué quedó: en un
  cambio, "Cancelaste el cambio: tu número sigue siendo 099 123 456"; en una primera verificación,
  "Cancelaste la verificación de tu número" (el número ya no se muestra: no queda ninguno). Si
  cancelar un cambio devuelve la cuenta a nivel 1 estando en el aviso, la puerta la deja pasar
  directo a su acción (FR-013d), sin quedarse en el aviso para mostrar la confirmación: lo que la
  persona quería era la acción. Si cancelar falla, el
  producto DEBE decirlo y dejar todo como estaba. Desde «Escribir el código» se cancela yendo a
  «Verificar teléfono»: sin número a medias, esa pantalla no existe.
- **FR-016**: Con el teléfono verificado, la persona DEBE poder cambiar el número. Antes de pedir el
  código para el nuevo, el producto DEBE avisarle que hasta confirmarlo va a quedar sin verificar.
- **FR-017**: **Cambiar el número baja la cuenta a sin verificar hasta confirmar el nuevo**: desde
  que el número nuevo queda a medias, la cuenta DEBE estar sin verificar y la puerta DEBE frenarla.
- **FR-017a**: Mientras el cambio está a medias, el número anterior DEBE seguir asociado a la cuenta
  y ninguna otra cuenta DEBE poder verificarlo. Al confirmar el nuevo, el anterior DEBE dejar de
  estar asociado y quedar libre; la fecha de verificación pasa a ser la del número nuevo.
- **FR-017b**: Cancelar un cambio a medias —o que se descarte a los 7 días— DEBE devolver la cuenta
  a nivel 1 con el número anterior y **su fecha original**. Cancelar una primera verificación a
  medias DEBE dejar la cuenta sin teléfono.
- **FR-017c**: Escribir como nuevo el mismo número que ya está verificado en la cuenta NO DEBE
  mandar nada ni iniciar un cambio: DEBE decir que ese ya es su número verificado. Si hay un cambio
  a medias, sigue a medias; para volver al número verificado está cancelar.
- **FR-017d**: Cada cuenta tiene, como mucho, **un número verificado y uno a medias**. Pedir un
  código que sale —o que el tope por número frena en silencio— para otro número mientras hay uno a
  medias DEBE reemplazar al que estaba a medias.
- **FR-017e**: Quitar el teléfono sin borrar la cuenta **no** entra en esta historia: el teléfono es
  la condición para participar, no un dato opcional como la foto de la historia #9. Quien no quiere
  que el producto lo tenga borra la cuenta, que lo borra entero (FR-020), o lo cambia.

#### Mi perfil

- **FR-018**: «Mi perfil» DEBE mostrar el estado del teléfono, y en cada estado una sola lectura:
  - **Verificado**: el número, que está verificado, que la cuenta está en **nivel 1**, la fecha
    desde la que lo está —una fecha, no "hace 3 días"—, y la opción de cambiarlo. El nivel se dice
    **en texto**: el distintivo de cada nivel es de la historia #12.
  - **Sin teléfono**: el paso pendiente, para qué sirve y el acceso a hacerlo.
  - **Con un número a medias**: ese número, que la cuenta está **sin verificar**, y terminar y
    cancelar. Terminar lleva a «Escribir el código»; corregir el número lleva a «Verificar
    teléfono» con el número a medias ya escrito en el campo, para cambiar un dígito sin reescribir
    todo. Si es un cambio, el número anterior se menciona **solo** como el que vuelve si se
    cancela; NO DEBE mostrarse como "verificado desde…" mientras la cuenta está sin verificar.
- **FR-018a**: Después de verificar sin un destino pendiente, la persona DEBE quedar en «Mi perfil»
  con una confirmación visible de que quedó verificada.

#### Privacidad y baja

- **FR-019**: El teléfono, su fecha y el número a medias de una persona NO DEBEN ser visibles para
  ninguna otra persona que use el producto: los ve su dueña. Quien administra el sitio accede
  solamente por fuera del producto, para un caso puntual, igual que en la historia #9 (FR-026b).
  Mostrar el teléfono a otra persona cuando una solicitud es aceptada es de otra historia.
- **FR-019c**: El registro de pedidos de una cuenta y el conteo de códigos por número NO DEBEN ser
  legibles por **nadie** dentro del producto, **tampoco por la propia cuenta**: sirven solo para
  hacer cumplir los topes. Lo único que la persona ve de ellos es cuánto le falta para poder pedir
  otro (FR-010a). Si la cuenta que escribió un número pudiera leer ese conteo, se enteraría de
  cuántos códigos le pidieron otras cuentas, que es la filtración que FR-011 impide.
- **FR-019a**: Cada regla de FR-019 y FR-019c DEBE poder demostrarse con un intento fallido: alguien
  sin sesión y alguien con la sesión de otra persona intentan leer el teléfono, su fecha y el
  número a medias ajenos, y no lo consiguen; y **nadie, tampoco la dueña**, consigue leer el
  registro de pedidos ni el conteo por número.
- **FR-019d**: Nada de lo que esta historia guarda DEBE poder **escribirse, cambiarse ni borrarse**
  desde el producto por otro camino que la verificación misma —pedir, confirmar, cancelar— o que
  borrar la cuenta entera (FR-020), **tampoco por su dueña**: ni el
  teléfono verificado, ni su fecha, ni el número a medias, ni el registro de pedidos, ni los
  intentos equivocados de un código, ni el conteo por número, ni el techo del sitio. Si la dueña
  pudiera borrar su registro, se saltearía la espera y el tope; si pudiera volver a cero los
  intentos, adivinaría el código de un número que no tiene; si pudiera escribir su teléfono o su
  fecha, la verificación no significaría nada. Cada una DEBE demostrarse con un intento fallido.
- **FR-019b**: Que un número esté verificado en alguna cuenta NO DEBE poder averiguarse sin tener
  ese número en la mano (FR-008), ni por el mensaje de pedir el código ni por los topes.
- **FR-020**: Borrar la cuenta DEBE borrar el teléfono, su fecha, el número a medias y el registro
  de pedidos de la cuenta, y DEBE dejar el número libre para verificarse en otra cuenta. El borrado
  DEBE seguir cumpliendo las reglas de la historia #9 (nunca "listo" a medias, el reintento termina
  el trabajo).
- **FR-020a**: La confirmación del borrado de la historia #9 DEBE nombrar el teléfono entre lo que
  se borra.
- **FR-021**: Para que el tope de FR-011 no se esquive borrando la cuenta y creando otra, el conteo
  de códigos mandados a cada número DEBE sobrevivir al borrado de la cuenta **durante sus 24
  horas**, sin vínculo con ninguna cuenta, y DEBE borrarse después. Ese conteo NO DEBE permitir
  saber a qué número se refiere **a nadie, tampoco a quien administra el sitio con todas sus
  llaves**: cada conteo DEBE corresponder a más de cien números posibles, también el que menos.
  El precio aceptado es que el conteo suma juntos a esos números: con cien números distintos
  pidiendo códigos en un día, la probabilidad de que el de una persona comparta conteo con alguno
  de ellos es menor a uno en trescientos, y para frenarla ese conteo compartido tendría que llegar a
  10 en el día. El peor caso es la espera de FR-011a.
- **FR-022**: El registro de pedidos de una cuenta DEBE conservarse solo lo que hace falta para
  hacer cumplir los topes y distinguir un código reemplazado (24 horas), y DEBE borrarse después.
- **FR-023**: El producto NO DEBE guardar ningún dato que esta historia no nombra. En particular, no
  guarda el nombre de la compañía del celular ni nada que devuelva el servicio de mensajes más allá
  de si el mensaje salió y, si no salió, si fue por el número (FR-002a) o por el servicio
  (FR-009a), que es lo que decide si cuenta para los topes.

#### Medición

- **FR-024**: El producto DEBE registrar, sin datos que identifiquen a la persona ni al número y con
  la misma marca de visita que la historia #9 (FR-030c), estos siete momentos. Ningún par DEBE
  dispararse siempre en el mismo instante: que uno implique al otro está bien («teléfono
  cambiado» siempre viene con «código confirmado»), mientras el otro también ocurra solo. Los
  eventos se registran del lado del producto y **nada de ellos llega a quien pide**: la diferencia
  entre un código que salió y uno que el tope por número frenó en silencio no puede filtrarse
  por la medición (FR-011).

  | Evento | Se registra cuando |
  |---|---|
  | Código pedido | un código salió hacia un número. **No** cuando no salió (FR-009a), ni cuando lo frenó un tope, ni cuando el tope por número lo frenó en silencio |
  | Código confirmado | la cuenta queda verificada con ese número. **No** cuando el código era correcto pero el número estaba en uso |
  | Intento fallido | se escribe un código que no sirve, por cualquiera de los motivos de FR-007a. **No** la falla al comprobar de FR-007c |
  | Tope alcanzado | un pedido deja a la cuenta en su tope diario (el quinto que cuenta en 24 horas). **No** la espera de 60 segundos. Se registra al llegar al tope y no al chocar con él, porque FR-010a no deja chocar |
  | Techo del sitio alcanzado | un pedido que cuenta para el techo de FR-011b —uno que sale o uno que el tope por número frenó en silencio— deja al sitio en 200. Es la señal de que alguien pudo haberlo agotado a propósito |
  | Teléfono cambiado | se confirma un número nuevo en una cuenta que ya tenía otro verificado. Se registra además del de código confirmado |
  | Número en uso | el código era correcto y el número estaba verificado en otra cuenta (FR-008). Mide cuántas veces pega la limitación del número reasignado |

- **FR-024a**: El abandono entre pedir el código y confirmarlo DEBE poder calcularse con esos
  eventos, sin un evento propio: son las visitas con al menos un "código pedido" y ningún "código
  confirmado" ni "número en uso". Es una aproximación, y la spec la acepta: quien vuelve otro día a terminar cuenta
  como abandono en la primera visita, porque los eventos no llevan nada que una dos visitas de la
  misma persona, a propósito (historia #9, FR-030c).
- **FR-024b**: Cada evento DEBE poder observarse al recorrer el flujo. Si uno no se dispara, es un
  defecto.

### Key Entities

- **Teléfono verificado**: el celular uruguayo de una persona, confirmado con un código. Pertenece a
  una sola cuenta. Tiene la fecha desde la que está verificado. Lo ve solo su dueña.
- **Número a medias**: el número al que se mandó un código que todavía no se confirmó. Uno por
  cuenta como mucho. Se confirma, se cancela o se descarta a los 7 días. No le pertenece a nadie
  hasta que se confirma.
- **Código**: seis dígitos, de un solo uso, que vencen a los 10 minutos, mueren al pedirse otro que
  sale o después de 5 intentos equivocados. Nadie puede leerlo una vez mandado.
- **Registro de pedidos**: cuándo pidió códigos cada cuenta, lo justo para sus topes y para
  reconocer un código reemplazado. Dura 24 horas. No lo lee nadie, tampoco la cuenta.
- **Conteo por número**: cuántos códigos recibió un número en 24 horas, sumando cuentas. Sin cuenta y
  sin forma de saber de qué número es. Dura 24 horas.
- **Nivel de verificación**: sin verificar o nivel 1 en esta historia. Nivel 2 (identidad) y nivel 3
  (aval) llegan en las historias #11 y #12.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde «Mi perfil», una persona sin verificar llega a nivel 1 con **tres toques y dos
  campos**: tocar el acceso a verificar, escribir el número y pedir el código, escribir el código y
  confirmar. El tiempo total depende de cuánto tarde el mensaje, que no es del producto; lo que se
  mide es que no haya un paso más.
- **SC-002**: **0 números verificados en más de una cuenta**, también cuando dos cuentas confirman
  el mismo número a la vez.
- **SC-003**: Ningún código sirve fuera de su regla: 0 aceptados después de los 10 minutos, 0
  aceptados después de pedir otro que salió, 0 aceptados después del quinto intento equivocado —
  también con intentos en paralelo—, 0 aceptados por segunda vez.
- **SC-004**: Con la única excepción deliberada de FR-011, el 100 % de los intentos que no terminan
  en una verificación —número inválido, fijo, extranjero o que no recibe mensajes; código
  equivocado, vencido, reemplazado o agotado; espera; tope diario; techo del sitio; mensaje que no
  salió; falla al comprobar; número en uso— termina en una pantalla que dice qué pasó y ofrece el
  paso siguiente. Nunca un "error" a secas ni una pantalla sin salida.
- **SC-005**: Ninguna cuenta recibe más de 5 códigos en 24 horas, ningún número recibe más de 10 en
  24 horas sumando todas las cuentas —también si se borran y se crean cuentas en el medio, y
  también con pedidos en paralelo—, y el sitio no manda más de 200 mensajes en 24 horas.
- **SC-006**: El teléfono, su fecha y el número a medias de una persona no llegan a otra: los
  intentos de leerlos desde una cuenta ajena y sin sesión fallan en los tres. El registro de pedidos
  y el conteo por número no los lee nadie desde el producto, tampoco su dueña. Y ningún dato de esta
  historia se puede escribir, cambiar ni borrar desde el producto sin pasar por la verificación:
  los intentos de hacerlo, también los de la dueña, fallan todos (FR-019d).
- **SC-007**: El 100 % de las personas que se verifican desde el aviso, en el mismo dispositivo en
  el que tocaron la acción, vuelve a la acción que había tocado, también cuando antes tuvo que
  ingresar y completar el perfil. Se verifica recorriendo el flujo de punta a punta.
- **SC-008**: En un teléfono con datos móviles —el mismo perfil de red con el que se mide todo el
  producto, y sin corrimiento del contenido por encima de 0,05, el umbral de `docs/07`
  §Presupuesto—, las pantallas de verificar el
  teléfono y de escribir el código muestran su contenido y aceptan que se escriba en menos de 2,5
  segundos desde que se abren, sin que el contenido salte de lugar. Se mide con una persona de
  prueba que tiene un número a medias.

## Assumptions

- **Números del código** (asunción 2026-09-22, tomada en la corrida, sin preguntar): seis dígitos
  (lo dice la historia), vencimiento a los 10 minutos, 5 intentos equivocados seguidos, 60 segundos
  entre códigos, 5 códigos por cuenta y 10 por número en 24 horas móviles, y un techo de 200
  mensajes por día para el sitio. La historia dice "a los pocos minutos", "varios intentos" y "un
  tope por día" sin números; estos son los habituales en la verificación por mensaje de texto y
  alcanzan para equivocarse de número una vez, que no llegue y que venza, sin dejar la puerta
  abierta al abuso. **A validar por Hernán en el build local.**
- **Número en uso, descubierto al confirmar y no al pedir** (asunción 2026-09-22, tomada en la
  corrida): la historia dice que se avisa "cuando pido el código". Se movió al momento de escribir
  el código correcto (FR-008) porque avisar al pedirlo le permite a cualquiera con una cuenta
  averiguar si un número de otra persona está registrado en el sitio, que es exactamente el tipo de
  filtración que la historia #9 prohibió para el correo (FR-006a) y que la constitución §V cuida. El
  costo es un mensaje de texto a un número que igual no se va a verificar, acotado por FR-011. **A
  validar por Hernán en el build local.**
- **La puerta sin acciones detrás** (asunción 2026-09-22, tomada en la corrida): publicar y
  solicitar llegan en M2 y M3. Esta historia construye la regla de quién pasa, el aviso y la vuelta
  al destino (FR-013), y no agrega a la interfaz botones de publicar ni de solicitar que no llevan a
  ningún lado. Hoy el camino visible para verificarse es «Mi perfil»; el aviso se prueba abriéndolo
  como lo van a abrir esas historias, con la acción y el destino. Las historias de publicar y de
  solicitar tienen que usar esta puerta y no otra, y es la que decide que salta al tocar la acción
  (FR-013a).
- **Cancelar un cambio devuelve el número anterior** (asunción 2026-09-22, tomada en la corrida):
  la historia dice que cambiar baja la cuenta a sin verificar "hasta confirmar el nuevo" y que el
  anterior se desasocia "cuando lo confirmo", y deja "cancelar" sin decir a qué vuelve. Se eligió
  que el anterior siga asociado durante el cambio y que cancelar vuelva a nivel 1 con él y con su
  fecha original (FR-017b): la persona ya lo había demostrado, y dejarla sin teléfono por haber
  empezado un cambio que no terminó la castiga sin motivo. **A validar por Hernán en el build
  local.**
- **Número a medias que dura 7 días** (asunción 2026-09-22, tomada en la corrida): la historia pide
  que al volver se vea el número a medias, sin decir hasta cuándo. Siete días cubren "lo termino
  mañana" sin guardar para siempre un número que nadie confirmó, que puede ser de otra persona por
  un error de tipeo.
- **El bloqueo sostenido de un número ajeno queda aceptado, con remedio manual** (asunción
  2026-09-22, tomada en la corrida, abierta al tope de las tres rondas de endurecimiento): con dos
  cuentas nuevas por día se puede sostener el tope mudo sobre un número y el techo del sitio sobre
  todos (FR-011a, FR-011b). Cerrarlo del todo pide saber quién es la dueña de un número antes de
  que lo demuestre, que es lo que la verificación viene a averiguar. Mientras la medición no llegue
  a una herramienta, el remedio es de quien opera: liberar el conteo de un número o el techo por
  fuera del producto. Queda en `docs/known-limitations.md` con esa condición de reapertura: se
  revisa la primera vez que pase. **A validar por Hernán.**
- **Tope por número silencioso y más alto que el de cuenta** (asunción 2026-09-22, tomada en la
  corrida): mismo criterio que el tope por dirección de la historia #9 (FR-006, FR-006c), que es
  mudo y más alto que el de una persona para que un solo actor no deje afuera a otro. La historia
  pide "un tope de códigos por teléfono y por día"; lo que se le cuenta a la persona es su propio
  tope por cuenta (FR-010), que es sobre sus propios pedidos.
- **El código es del producto** (asunción 2026-09-22, tomada en la corrida): FR-006, FR-007a,
  FR-008, FR-009 y FR-009c piden cosas que solo se cumplen si el código lo genera y lo comprueba el
  propio producto, y el servicio de mensajes solo lo lleva: que el último invalide al anterior, que
  un código viejo se distinga de uno equivocado, que el número en uso se diga recién al confirmar,
  y que el texto viva con los demás textos. `docs/07` preveía otra cosa para el teléfono; el plan
  lo registra ahí como decisión con fecha. El ingreso no cambia en nada (FR-009d). **No es un cambio
  transversal de stack** en el sentido de la constitución: no cambia cómo se entra, ni el
  framework, ni la base de componentes; el proveedor de mensajes sigue siendo el mismo. Cambia qué
  pieza de ese proveedor se usa y quién genera el código, igual que la historia #9 decidió mandar
  el correo desde el producto. **A validar por Hernán.**
- **Tope por cuenta y techo del sitio, además del tope por número** (asunción 2026-09-22, tomada en
  la corrida): la historia nombra el tope por teléfono. Sin un tope por cuenta, una sola cuenta
  podría mandar códigos a cientos de números distintos; sin un techo del sitio, alcanzaría con
  crear muchas cuentas, que son gratis. Es la vía de abuso de costo que la historia quiere cerrar
  ("cada mensaje cuesta plata"). El techo tiene un costo, y queda dicho: alguien que cree muchas
  cuentas puede agotarlo y dejar a todos sin poder verificarse hasta el día siguiente. Se prefirió
  un gasto acotado a uno sin techo; si pasa, se ve en el evento "Techo del sitio alcanzado", y se
  revisa. **A validar por Hernán en el build local.**
- **Solo celulares uruguayos** (de la historia): "teléfonos de otros países" está fuera de alcance.
  Los fijos se rechazan porque no reciben mensajes de texto; aceptar uno sería prometer un código
  que no llega.
- **Solo mensaje de texto** (de la historia): elegir WhatsApp y la llamada de voz están fuera de
  alcance. `docs/03` §1 dice "mensaje de texto o WhatsApp"; la historia elige el primero para el
  MVP, y `docs/07` ya decía empezar por mensaje de texto porque WhatsApp pide aprobación previa del
  remitente.
- **Nivel 1 = correo y teléfono** (de `docs/03` §1): en este producto el correo queda confirmado
  siempre, al entrar por enlace o por Google con dirección verificada (historia #9), así que la
  única condición que esta historia agrega es el teléfono.
- **El mensaje sin servicio configurado** (asunción 2026-09-22): mientras no haya cuenta del
  servicio de mensajes ni dominio (`docs/04`), en desarrollo y en las pruebas automáticas el
  mensaje no sale a un teléfono real: queda en la máquina, como el correo del enlace en la historia
  #9. En cualquier otro entorno sin el servicio, el pedido falla (FR-009c). El envío real se enciende
  cuando exista la cuenta, con el mismo texto.
- **Medición** (igual que la historia #9): los eventos se disparan desde ahora y se pueden probar,
  pero todavía no se mandan a ninguna herramienta; eso se conecta en M5.
- **Hora de Uruguay**: toda hora y fecha que se le muestra a la persona (cuándo puede volver a
  pedir, desde cuándo está verificada) está en hora de Uruguay.
- **Idioma**: español rioplatense con voseo, como el resto del producto.
- **Presupuesto de performance**: estas pantallas están dentro del presupuesto general del producto
  (constitución §VII); SC-008 dice lo que la persona percibe.
- **Fuera de esta historia, por decisión de la historia**, y dónde se retoma cada cosa:

  | Queda afuera | Dónde se retoma |
  |---|---|
  | Mostrar el teléfono a otra persona | M3, la historia de la bandeja y la revelación de contacto al aceptar una solicitud |
  | Verificación de identidad con documento (nivel 2) | Historia #11 |
  | Aval entre personas (nivel 3), el perfil público y la chapita de cada nivel | Historia #12 |
  | Teléfonos de otros países | No planificado. Si aparece la necesidad, va a `docs/05-ideas-futuras.md` |
  | Elegir entre mensaje de texto y WhatsApp, o llamada de voz | No planificado para el MVP |
  | Más de un teléfono por cuenta | No planificado |
  | Publicar un animal y solicitar una adopción | M2 y M3; usan la puerta de esta historia |
  | Qué pasa con publicaciones o solicitudes de alguien que baja a sin verificar | Las historias de publicar y de solicitar, que son las que las crean |
  | Recuperar un número verificado en una cuenta a la que ya no se puede entrar (la compañía reasignó el número, o se perdió el correo de la cuenta vieja) | **Un seguimiento**, porque corta un paso de la verificación (constitución §VI): hoy esa persona no puede verificar ese número. La historia #9 dejó "recuperar una cuenta cuyo correo ya no se controla" esperando a que existiera el teléfono. Se mide con el evento "Número en uso" |
  | El dueño anterior de un número reasignado sigue verificado con un número que ya no es suyo, y desde M3 ese número se le mostraría a quien acepte una solicitud | El mismo seguimiento: volver a verificar cada tanto, o soltar el número cuando otra persona demuestra tenerlo, son dos respuestas al mismo problema. **La historia de M3 que revela el contacto tiene que decidir esto antes de revelar un teléfono**, o depender de ese seguimiento: si sale antes, revelaría el número de una tercera persona |
  | Quitar el teléfono sin borrar la cuenta | No planificado (FR-017e) |
- **Dependencia**: la historia #9 (registro e ingreso) está cerrada; esta historia se apoya en su
  sesión, su compuerta de perfil completo, su destino de vuelta, su borrado de cuenta y su marca de
  visita.
