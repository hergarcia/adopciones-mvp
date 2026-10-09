# Feature Specification: Solicitar la adopción de un animal con el cuestionario

**Feature Branch**: `feature/63-solicitar-adopcion-con-cuestionario`

**Created**: 2026-10-06

**Status**: Draft

**Input**: Historia #63 del backlog, milestone «M3 - Solicitud de adopción». El cuerpo verbatim de
la historia acompaña a esta spec (`story.md`).

**Ya construido**: el ingreso con su vuelta a la pantalla de origen y el borrado de la cuenta
(historia #9); el teléfono verificado, el nivel 1 y el aviso de verificación pendiente con el motivo
«solicitar» ya escrito, que hoy nadie usa porque solicitar no existía (historia #10); el pedido de
identidad, su revisión, el nivel 2 y el correo de identidad aprobada (historia #11); la publicación
de un animal con la regla de que el nombre y la descripción no aceptan teléfonos, correos ni
enlaces, con su explicación (historia #53); el listado, la ficha y la vista previa (historia #57);
los estados de una publicación (disponible, en proceso, pausada, adoptada), el vencimiento, el
borrado y la baja (historia #59); lo escrito y no enviado que sobrevive a una recarga y se borra al
cerrar sesión o borrar la cuenta (historias #35 y #53); el bloqueo y la suspensión, con la pantalla
de animal de alguien que bloqueaste y la pantalla de cuenta suspendida (historia #13). En el sitio
no existen todavía solicitudes ni un nivel exigido por publicación. Esta spec suma eso y lo que cada
cosa anterior le hace a una solicitud; no rehace nada.

**Vocabulario de esta spec**:

- Una **solicitud** es el pedido de adopción que una persona (**quien solicita**) le manda a quien
  publicó un animal (**el publicador**), con sus **respuestas** al **cuestionario**. Tiene a qué
  animal, quién la mandó, cuándo, las respuestas, su estado y cuándo cambió.
- Una solicitud está **activa** desde que se envía hasta que se **retira** (la retira quien
  solicita) o se **cierra** (la cierra algo que le pasó al animal o a una de las dos personas).
  Una solicitud activa es **enviada**; una no activa es **retirada** o **cerrada**, y una cerrada
  tiene su **motivo de cierre**: el animal encontró hogar, el animal ya no está publicado, el animal
  ya no recibe solicitudes, bloqueaste a quien lo publicó, o tu cuenta estuvo suspendida. La
  historia siguiente suma las respuestas del publicador.
- **Mis solicitudes** es la lista de las solicitudes de una persona; **Mi solicitud** es una sola.
- El **nivel exigido** de una publicación es el nivel mínimo que el publicador pide para
  solicitarla: **teléfono verificado** (nivel 1, historia #10) o **identidad verificada** (nivel 2,
  historia #11).
- Un animal **recibe solicitudes** cuando está disponible o en proceso, a la vista (historia #57:
  su publicador tiene hoy el teléfono verificado, no venció, no fue dado de baja y su cuenta no está
  suspendida) y su publicador no bloqueó a quien mira ni fue bloqueado por ella.
- El **borrador** de una solicitud es lo escrito en el cuestionario de un animal y todavía no
  enviado; vive solo en el navegador de esa persona.
- **Publicación**, **ficha**, **enlace**, **listado** («Animales en adopción»), **a la vista**,
  **en proceso**, **pausada**, **vencida**, **adoptada**, **borrada**, **dada de baja**, **bloquear**,
  **cuenta suspendida**, **aviso de verificación pendiente**, **pedido de identidad** (en revisión,
  aprobado, rechazado, retirado, vencido) y **quien administra** significan lo mismo que en las specs
  de las historias #10, #11, #13, #53, #57 y #59.
- Toda fecha que se muestra está en hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Solicitar un animal con el cuestionario y verla en Mis solicitudes (Priority: P1)

Una adoptante con el teléfono verificado ve a Tobi en el listado, abre su ficha y toca «Quiero
adoptar». Contesta una sola vez las preguntas que el rescatista hoy le haría por WhatsApp: dónde
vive, si es alquilada y el dueño permite animales, quiénes viven con ella, cuántas horas quedaría
solo, por qué Tobi. Toca «Enviar solicitud» y ve que le llegó a quien lo publicó. En Mis
solicitudes, Tobi está primero, como enviada, con la fecha y «1 de 3 solicitudes activas». Si se le
corta la señal o recarga a mitad del cuestionario, no pierde nada. Si todavía no ingresó o no
verificó su teléfono, el sitio la lleva a hacerlo y la devuelve a Tobi.

**Why this priority**: es el corazón del producto (docs/03 §4) y el segundo y tercer paso del funnel
(clic adoptar, completó cuestionario); sin esto no hay nada que el publicador pueda responder en la
historia siguiente, ni hipótesis que medir.

**Independent Test**: con una persona sembrada con nivel 1 y un animal disponible de otra persona,
no castrado, que pide teléfono verificado: abrir su ficha sin sesión, tocar «Quiero adoptar»,
ingresar y llegar al cuestionario de ese animal; contestar con vivienda alquilada y ver aparecer la
pregunta del permiso del dueño; escribir un teléfono en «por qué este animal» y ver que no se manda;
recargar y ver todo escrito; enviar y ver la pantalla de solicitud enviada; ver la solicitud en Mis
solicitudes y abrirla con las respuestas; ver que la ficha ahora dice «Ver mi solicitud»; abrir la
ficha de un animal propio y ver «Editar».

**Acceptance Scenarios**:

1. **Dado** que tengo el teléfono verificado y Tobi pide teléfono verificado, **cuando** toco
   «Quiero adoptar», contesto el cuestionario y toco «Enviar solicitud», **entonces** veo que mi
   solicitud le llegó a quien publicó a Tobi, y Tobi aparece primero en Mis solicitudes como
   enviada, con la fecha y «1 de 3 solicitudes activas».
2. **Dado** que no ingresé, **cuando** toco «Quiero adoptar» en la ficha de Luna, **entonces** se
   me pide entrar, y al entrar llego al cuestionario de Luna (o, si me falta algo de lo que se
   controla antes del cuestionario, a la pantalla que lo dice, con la vuelta a Luna).
3. **Dado** que no tengo el teléfono verificado, **cuando** toco «Quiero adoptar», **entonces** veo
   el aviso de verificación pendiente con el camino para verificarlo, y al terminar vuelvo al
   animal.
4. **Dado** que Tobi ya está castrado, **cuando** contesto su cuestionario, **entonces** no aparece
   la pregunta del compromiso de castración.
5. **Dado** que elegí que mi vivienda es alquilada, **cuando** sigo el cuestionario, **entonces**
   aparece la pregunta de si el contrato o el dueño permite animales; si cambio a propia,
   desaparece y su respuesta no se manda.
6. **Dado** que dejé una pregunta sin contestar, **cuando** toco «Enviar solicitud», **entonces** se
   me marca cuál falta y lo demás sigue escrito.
7. **Dado** que escribo mi celular en «por qué este animal», **cuando** toco «Enviar solicitud»,
   **entonces** no se manda, se marca esa respuesta y se me explica que el contacto se da cuando la
   solicitud se acepta.
8. **Dado** que Tobi está en proceso, **cuando** toco «Quiero adoptar», **entonces** se me avisa
   que el publicador ya está avanzando con otra persona y que mi solicitud queda por si no se
   concreta, y puedo mandarla.
9. **Dado** que publiqué a Tobi, **cuando** abro su ficha, **entonces** veo «Editar» y no «Quiero
   adoptar».
10. **Dado** que ya mandé una solicitud por Tobi y sigue activa, **cuando** abro su ficha,
    **entonces** veo «Ver mi solicitud» en lugar de «Quiero adoptar», y me lleva a Mi solicitud con
    lo que contesté.
11. **Dado** que se corta la conexión, **cuando** toco «Enviar solicitud», **entonces** veo que no
    se mandó por la conexión, mis respuestas siguen ahí, y al reintentar se manda una sola.
12. **Dado** que recargo a mitad del cuestionario, **cuando** vuelvo, **entonces** mis respuestas
    siguen ahí.
13. **Dado** que mientras contestaba el publicador marcó adoptado a Tobi, **cuando** toco «Enviar
    solicitud», **entonces** no se manda, se me dice que Tobi ya no recibe solicitudes y el camino a
    Animales en adopción.
14. **Dado** que abro el enlace de una solicitud que no es mía, **cuando** carga, **entonces** veo
    que esa solicitud no existe, igual que si no existiera.
15. **Dado** que todavía no mandé ninguna solicitud, **cuando** abro Mis solicitudes, **entonces**
    veo «Todavía no mandaste ninguna solicitud.» con el camino a Animales en adopción.

---

### User Story 2 - El límite de 3, retirar una solicitud y las respuestas propuestas (Priority: P2)

La adoptante ya mandó por Tobi y por Luna. Cuando abre el cuestionario de Michi, sus respuestas
sobre la casa, la familia y la plata ya están propuestas, y solo escribe por qué Michi. Con tres
solicitudes activas, al tocar «Quiero adoptar» en un cuarto animal ve, antes de cualquier pregunta,
que llegó al máximo y cuáles son las tres; retira la de Tobi ahí mismo y sigue. Desde Mis
solicitudes también puede abrir cualquiera y retirarla.

**Why this priority**: el límite de 3 es la regla de docs/03 §4 que hace que una solicitud
signifique algo, y retirar es la única salida de quien llegó al límite; las respuestas propuestas
son lo que hace soportable solicitar varios animales (decisión 2026-09-27). Se apoya en US1.

**Independent Test**: con una persona sembrada con nivel 1 y cuatro animales de otra persona que
reciben solicitudes: mandar una solicitud; abrir el segundo cuestionario y ver las respuestas
propuestas con «por qué este animal» vacía; mandar dos más; tocar «Quiero adoptar» en el cuarto y
ver la pantalla de límite con las tres; retirar una ahí, confirmar y llegar al cuestionario del
cuarto; abrir una solicitud desde Mis solicitudes, retirarla y ver que la ficha de ese animal vuelve
a mostrar «Quiero adoptar».

**Acceptance Scenarios**:

1. **Dado** que ya mandé una solicitud por Tobi, **cuando** abro el cuestionario de Luna,
   **entonces** mis respuestas anteriores están propuestas, todas editables, y «por qué este
   animal» está vacía.
2. **Dado** que tengo 3 solicitudes activas, **cuando** toco «Quiero adoptar» en otro animal,
   **entonces** antes de cualquier pregunta veo que llegué al máximo de 3, cuáles son, y puedo
   retirar una y seguir.
3. **Dado** que en otra pestaña mandé mi tercera solicitud, **cuando** envío una cuarta que ya había
   contestado, **entonces** no se manda, veo que llegué al máximo y mis respuestas siguen en
   pantalla.
4. **Dado** que tengo una solicitud activa por Tobi, **cuando** la abro desde Mis solicitudes, toco
   «Retirar» y confirmo, **entonces** queda retirada, deja de contar entre mis activas y la ficha de
   Tobi vuelve a mostrar «Quiero adoptar».
5. **Dado** que toqué «Retirar», **cuando** cancelo la confirmación, **entonces** la solicitud sigue
   activa y no cambia nada.
6. **Dado** que retiré mi solicitud por Tobi, **cuando** vuelvo a tocar «Quiero adoptar» en su
   ficha, **entonces** puedo mandar una solicitud nueva; la retirada sigue en Mis solicitudes como
   retirada.

---

### User Story 3 - El publicador exige identidad verificada (Priority: P3)

Una rescatista que tuvo malas experiencias publica a Luna y elige que solo la puedan solicitar
personas con identidad verificada. La ficha de Luna lo dice antes de tocar nada. Un adoptante con
solo el teléfono verificado toca «Quiero adoptar» y, antes de cualquier pregunta, ve que quien
publicó a Luna pide identidad verificada, para qué sirve y «Verificar mi identidad». Cuando lo
aprueban, el correo lo trae de vuelta a Luna y la solicita.

**Why this priority**: es la mitad de la historia del rescatista y la que mide qué parte de los
adoptantes completa el nivel 2 cuando se lo exigen (docs/03 §Métricas de éxito). Se apoya en US1;
sin ella, todos los animales piden teléfono verificado y el sitio funciona igual.

**Independent Test**: con una persona sembrada con nivel 1, otra con nivel 2 y una tercera que
publica: publicar a Luna eligiendo identidad verificada y ver la línea en su ficha; con la de nivel
1, tocar «Quiero adoptar» y ver la pantalla de identidad sin ninguna pregunta; mandar el pedido de
identidad, volver a Luna y ver que el pedido está en revisión; aprobarlo con quien administra y ver
en el correo el camino a Luna; solicitarla. Con la de nivel 2, solicitar directo. Cambiar a Tobi de
teléfono a identidad después de que alguien lo solicitó y ver que esa solicitud sigue activa.

**Acceptance Scenarios**:

1. **Dado** que publico a Luna, **cuando** elijo que pida identidad verificada y publico,
   **entonces** su ficha dice que pide identidad verificada para solicitar.
2. **Dado** que publico un animal, **cuando** no toco «Quién puede solicitar», **entonces** queda
   en teléfono verificado.
3. **Dado** que Luna pide identidad verificada y yo tengo solo el teléfono verificado, **cuando**
   toco «Quiero adoptar», **entonces** veo, antes de cualquier pregunta, que quien la publicó pide
   identidad verificada, para qué sirve y «Verificar mi identidad»; cuando me aprueban, el correo me
   trae de vuelta a Luna y puedo solicitarla.
4. **Dado** que Luna pide identidad verificada y mi pedido de identidad está en revisión, **cuando**
   toco «Quiero adoptar», **entonces** veo que mi pedido está en revisión, desde qué día, y que me
   va a llegar un correo con el resultado.
5. **Dado** que Tobi pedía teléfono verificado cuando lo solicité, **cuando** su publicador cambia a
   identidad verificada, **entonces** mi solicitud sigue activa.
6. **Dado** que publiqué a Luna con teléfono verificado, **cuando** la edito y elijo identidad
   verificada, **entonces** su ficha lo dice y las solicitudes nuevas lo exigen.
7. **Dado** que tengo identidad verificada, **cuando** toco «Quiero adoptar» en Luna, **entonces**
   llego al cuestionario sin ningún paso de más.

---

### User Story 4 - Lo que le pasa a una solicitud cuando cambia el animal o una de las personas (Priority: P4)

La adoptante mandó por Luna. La rescatista la pausa porque se enfermó: en Mis solicitudes la
solicitud sigue activa y dice que Luna no está disponible por ahora. Cuando Luna se recupera y otra
familia la adopta, la rescatista la marca adoptada: la solicitud se cierra, dice que Luna encontró
hogar y libera un lugar. Si la rescatista la bloquea, su solicitud se cierra porque ese animal ya no
recibe solicitudes, sin que nada le diga que la bloquearon.

**Why this priority**: sin esto, Mis solicitudes miente y el límite de 3 se llena con solicitudes
muertas. Se apoya en US1 y en los estados, el bloqueo y la suspensión que ya existen.

**Independent Test**: con una persona sembrada con nivel 1 y solicitudes activas por cuatro animales
de otras dos personas (liberando lugar con retiros): pausar uno y ver la solicitud activa con la
nota; marcar otro adoptado y verla cerrada con «encontró hogar» y fuera de la cuenta de activas;
hacer que una publicadora bloquee a quien solicitó y ver la solicitud cerrada porque el animal ya
no recibe solicitudes; con quien solicitó, bloquear a otro publicador y ver la suya cerrada porque
lo bloqueó; desbloquear y ver que sigue cerrada; suspender a un publicador y ver la solicitud
cerrada porque el animal ya no está publicado; borrar la cuenta de quien solicitó y ver que sus
solicitudes ya no existen.

**Acceptance Scenarios**:

1. **Dado** que mandé una solicitud por Luna, **cuando** su publicador la pausa, **entonces** en
   Mis solicitudes sigue activa y dice que Luna no está disponible por ahora; **cuando** la marca
   adoptada, se cierra, dice que Luna encontró hogar y deja de contar entre mis activas.
2. **Dado** que mandé una solicitud por Tobi, **cuando** su publicación vence o su publicador deja
   de tener el teléfono verificado, **entonces** sigue activa y dice que Tobi no está disponible
   por ahora; cuando vuelve a estar a la vista, la nota desaparece.
3. **Dado** que mandé una solicitud por Tobi, **cuando** su publicador lo borra, quien administra
   lo da de baja, la cuenta del publicador se suspende o se borra, **entonces** se cierra, dice que
   Tobi ya no está publicado y deja de contar entre mis activas.
4. **Dado** que quien publicó a Tobi me bloqueó, **cuando** toco «Quiero adoptar», **entonces** veo
   que Tobi no está recibiendo solicitudes, sin que se me diga que me bloquearon.
5. **Dado** que tenía una solicitud activa por Tobi, **cuando** quien lo publicó me bloquea,
   **entonces** en Mis solicitudes queda cerrada porque Tobi ya no recibe solicitudes, deja de
   contar entre mis activas, y en ningún lado se me dice que me bloquearon.
6. **Dado** que tenía una solicitud activa por Tobi, **cuando** bloqueo a quien lo publicó,
   **entonces** en Mis solicitudes queda cerrada porque bloqueé a quien lo publicó; si después lo
   desbloqueo, sigue cerrada y puedo volver a solicitar.
7. **Dado** que bloqueé a quien publicó a Tobi, **cuando** abro el enlace de Tobi, **entonces** veo
   que bloqueé a quien lo publica, con la opción de desbloquear, y no «Quiero adoptar».
8. **Dado** que mi cuenta está suspendida, **cuando** intento solicitar, **entonces** no puedo, y
   veo lo mismo que la historia #13 le muestra a una cuenta suspendida; mis solicitudes activas se
   cerraron y, si me reactivan, siguen cerradas.
9. **Dado** que marcaron adoptado a Tobi y cerraron mi solicitud, **cuando** su publicador lo
   vuelve a publicar, **entonces** mi solicitud sigue cerrada y puedo mandar una nueva.
10. **Dado** que tengo solicitudes, **cuando** borro mi cuenta, **entonces** mis solicitudes y mis
    respuestas se borran.

---

### Edge Cases

- **Tocar dos veces «Enviar solicitud», o reintentar después de un corte que sí llegó**: se manda
  una sola solicitud; la persona ve la pantalla de solicitud enviada.
- **Dos pestañas mandando por el mismo animal**: queda una sola solicitud activa; la segunda ve que
  ya tiene una solicitud por ese animal, con «Ver mi solicitud», y sus respuestas siguen en pantalla.
- **Dos pestañas mandando por animales distintos con 2 activas**: se manda la primera que llega; la
  otra ve que llegó al máximo, con sus respuestas en pantalla.
- **El nivel exigido sube mientras contesto**: si al enviar el animal pide identidad verificada y no
  la tengo, no se manda, mis respuestas quedan guardadas como borrador y veo la pantalla de
  identidad; al volver, siguen ahí. Lo mismo si pierdo el teléfono verificado mientras contesto: veo
  el aviso de verificación pendiente.
- **El animal deja de estar a la vista mientras contesto** (se pausa, vence, o su publicador pierde
  el teléfono verificado): al enviar no se manda, se me dice que no está disponible por ahora y mis
  respuestas siguen en pantalla y en el borrador.
- **El animal se borra, se da de baja, se adopta, o su publicador es suspendido mientras
  contesto**: no se manda, se me dice que ya no recibe solicitudes, con el camino a Animales en
  adopción; mis respuestas siguen en pantalla.
- **Quien publicó me bloquea mientras contesto**: al enviar, se me dice que ese animal no está
  recibiendo solicitudes, igual que en el caso anterior, sin decir por qué.
- **El animal cambia de castrado mientras contesto**: al enviar se usa el dato de ese momento; si
  ahora hace falta el compromiso de castración, se marca como pregunta que falta; si ya no hace
  falta, esa respuesta no se manda.
- **Ingresar desde «Quiero adoptar» y resultar dueño del animal**: al volver se ve la ficha con
  «Editar», sin cuestionario.
- **Ingresar desde «Quiero adoptar» con una solicitud activa por ese animal**: al volver se ve la
  ficha con «Ver mi solicitud».
- **Ingresar desde «Quiero adoptar» con 3 activas o sin el nivel que pide el animal**: al volver se
  ve la pantalla de límite o la de identidad, no el cuestionario.
- **Borrador y respuestas propuestas a la vez**: si hay borrador de ese animal, el cuestionario
  arranca con el borrador; si no, con las respuestas propuestas.
- **Borradores de varios animales**: cada animal tiene el suyo; empezar el de Luna no borra el de
  Tobi.
- **Respuestas propuestas que no aplican**: si la solicitud anterior no tenía la pregunta del permiso
  del dueño o del compromiso de castración y esta sí, esa pregunta arranca vacía; si la anterior la
  tenía y esta no, no se muestra.
- **La solicitud anterior es retirada o cerrada**: se proponen igual sus respuestas; lo que cuenta
  es que sea la última que mandé.
- **Una respuesta de solo espacios**: cuenta como sin contestar.
- **Texto de 500 caracteres**: se ve cuánto queda; no se puede escribir más allá del límite.
- **Contacto en cualquier respuesta de texto** (teléfono, correo, enlace o red social): no se
  manda, se marca cada respuesta que lo tiene y se explica que el contacto se da cuando la solicitud
  se acepta; lo demás sigue escrito.
- **Retirar dos veces** (dos pestañas): la segunda no hace nada y dice que ya estaba retirada.
- **Retirar una solicitud que se cerró mientras tanto**: no cambia nada y se ve que ya estaba
  cerrada, con su motivo.
- **Retirar desde la pantalla de límite y que falle**: no se retira, se dice que no se pudo y se
  puede reintentar; no se llega al cuestionario hasta que haya lugar.
- **Retirar con el animal pausado o vencido**: se puede, como siempre mientras esté activa.
- **Un animal pausado, vencido o con publicador sin teléfono verificado**: su ficha no está a la
  vista (historia #59), así que no se puede empezar una solicitud nueva; las activas siguen.
- **Bloqueo mutuo**: la solicitud se cierra una vez; quien solicitó la ve cerrada porque bloqueó a
  quien lo publicó, porque eso ya lo sabe.
- **Desbloquear**: no reabre la solicitud; se puede volver a solicitar si el animal recibe
  solicitudes y hay lugar.
- **La cuenta suspendida de quien solicita, reactivada**: sus solicitudes siguen cerradas, con el
  motivo de que su cuenta estuvo suspendida; puede volver a solicitar.
- **La cuenta suspendida de un publicador, reactivada**: las solicitudes que se cerraron siguen
  cerradas; sus animales vuelven a recibir solicitudes nuevas.
- **Quien solicita pierde el teléfono verificado después de mandar** (otra cuenta se quedó con su
  número, historia #25): sus solicitudes enviadas siguen activas; no puede mandar nuevas hasta
  volver a verificar.
- **El publicador borra su cuenta**: sus animales se borran (historia #53) y las solicitudes a ellos
  se cierran con «ya no está publicado»; quien solicitó las sigue viendo.
- **Quien solicita borra su cuenta**: sus solicitudes, con sus respuestas, se borran; también sus
  borradores en ese navegador.
- **Cerrar sesión con un borrador**: el borrador se borra.
- **Un animal adoptado que vuelve a publicarse**: las solicitudes cerradas por la adopción siguen
  cerradas.
- **Una solicitud de un animal que ya no está publicado**: Mis solicitudes y Mi solicitud la
  muestran con el nombre que tenía el animal al cerrarse, sin foto y sin enlace a la ficha.
- **Quien administra solicita**: es una persona más; no ve solicitudes ajenas.
- **Una persona con identidad verificada ve un animal que pide teléfono**: solicita como cualquiera.
- **El enlace del correo de identidad aprobada lleva a un animal que ya no recibe solicitudes**: se
  ve la ficha (o la pantalla que corresponda) como la vería cualquiera, con lo que ya dice.
- **Llegar a la pantalla de identidad desde un segundo animal con el pedido ya en revisión**: el
  pedido sigue siendo el mismo, y el correo de aprobación lleva al animal desde el que se mandó.
- **Abrir el cuestionario de un animal por su dirección, sin pasar por la ficha**: se controlan las
  mismas condiciones que al tocar «Quiero adoptar» y se ve la misma pantalla que correspondería.

## Pantallas

En todas: el **cargando** de una pantalla con datos es un esqueleto con su forma; el **error al
cargar** dice que no se pudo traer y ofrece «Reintentar»; cada **acción** muestra que está
trabajando en su botón, no se puede tocar dos veces y, si falla, dice qué pasó y deja reintentar
sin perder lo elegido ni lo escrito.

- **Ficha de un animal** (cambia, de #57 y #59): «Quiero adoptar» como acción principal, o «Ver mi
  solicitud» si tengo una activa por ese animal, o «Editar» si es mío; la línea que dice que pide
  identidad verificada para solicitar, cuando la pide; el aviso de en proceso al tocar «Quiero
  adoptar» en un animal en proceso. Sin sesión, «Quiero adoptar» se ve y lleva a ingresar. Vacío: no
  aplica. Cargando y error: los de la ficha.
- **Cuestionario de la solicitud**: la foto y el nombre del animal, el aviso de en proceso si
  corresponde, las preguntas en el orden de FR-020 con las dos que dependen de otra respuesta
  apareciendo solo cuando corresponden, cuánto queda en cada texto, la explicación de que el
  contacto se da cuando la solicitud se acepta, y «Enviar solicitud». Vacío: la primera vez arranca
  sin contestar; después, con las respuestas anteriores propuestas y «por qué este animal» vacía.
  Error al enviar: el motivo (conexión, pregunta que falta, contacto en una respuesta, límite
  alcanzado, ya tenés una por este animal, no disponible por ahora, ya no recibe solicitudes) junto
  a lo que corresponde, con todo lo escrito en pantalla.
- **Solicitud enviada**: que le llegó a quien publicó el animal, con el nombre del animal, cuántas
  de 3 activas tengo, el camino a Mis solicitudes y a seguir mirando animales. Vacío: no aplica.
- **Mis solicitudes** (desde el menú de la cuenta y «Mi perfil»): cuántas de 3 activas tengo; las
  activas primero y después las cerradas y retiradas, cada grupo de la más reciente a la más vieja;
  cada una con la foto y el nombre del animal, la fecha de envío y su estado en palabras (enviada;
  enviada con «no está disponible por ahora»; retirada; cerrada con su motivo). Vacío: «Todavía no
  mandaste ninguna solicitud.», con el camino a Animales en adopción.
- **Mi solicitud**: el animal (foto, nombre y enlace a su ficha cuando se puede ver), el estado y
  desde cuándo, la fecha de envío, lo que contesté pregunta por pregunta, y «Retirar» con una
  confirmación si está activa. La de otra persona o una que no existe se ve como una solicitud que
  no existe. Vacío: no aplica.
- **Retirar**: una confirmación que dice que la solicitud deja de estar activa, libera un lugar y no
  se deshace (se puede mandar una nueva), con «Retirar» / «Cancelar». Al salir bien, la solicitud
  queda retirada y se confirma. Vacío: no aplica.
- **Límite alcanzado**: que llegué al máximo de 3 solicitudes activas, mis 3 con foto, nombre y
  fecha, cada una con «Retirar»; al retirar una, el camino al cuestionario del animal desde el que
  llegué. Vacío: no aplica.
- **Hace falta identidad verificada**: el nombre del animal, que quien lo publicó pide identidad
  verificada, para qué sirve y «Verificar mi identidad»; o, si mi pedido está en revisión, que lo
  está, desde qué día y que me va a llegar un correo. Si no puedo pedirla todavía (historia #11), lo
  que esa historia dice. Vacío: no aplica.
- **Aviso de verificación pendiente** (de #10, con el motivo «solicitar»): sin cambios, salvo que
  al terminar vuelve al animal. Vacío: no aplica.
- **Animal que no recibe solicitudes**: para quien fue bloqueada por quien lo publicó, o al enviar
  por un animal que dejó de recibir: que ese animal no está recibiendo solicitudes, sin decir por
  qué, y el camino a Animales en adopción. Vacío: no aplica.
- **Publicar y editar un animal** (cambian, de #53): «Quién puede solicitar», con teléfono
  verificado o identidad verificada y una línea que dice qué significa cada uno; editar dice que el
  cambio vale para las solicitudes nuevas. Vacío: arranca en teléfono verificado.
- **Correo de identidad aprobada** (cambia, de #11): suma el camino al animal desde el que se pidió,
  con su nombre, cuando se pidió desde un animal. Vacío: sin animal, el correo es el de siempre.

## Requirements *(mandatory)*

### Functional Requirements

#### Antes del cuestionario

- **FR-001**: La ficha de un animal disponible o en proceso muestra «Quiero adoptar» a quien no lo
  publicó y no tiene una solicitud activa por él, con o sin sesión; «Ver mi solicitud» a quien tiene
  una activa; «Editar», y nunca «Quiero adoptar», a quien lo publicó. La ficha de un animal adoptado
  no muestra «Quiero adoptar» ni «Ver mi solicitud»: sigue con su sello y el camino al listado
  (historia #59). La persona bloqueada por el publicador ve «Quiero adoptar» como cualquiera, para
  no enterarse del bloqueo, y lo que la frena es FR-003.
- **FR-002**: Sin sesión, «Quiero adoptar» lleva a ingresar y, al terminar, vuelve a ese animal y
  sigue con los controles de FR-003.
- **FR-003**: Al tocar «Quiero adoptar» se controla, en este orden y antes de mostrar cualquier
  pregunta: (a) que la cuenta no esté suspendida (si lo está, la pantalla de cuenta suspendida de
  #13); (b) que el animal reciba solicitudes para esa persona (si no, la pantalla de animal que no
  recibe solicitudes; para quien bloqueó al publicador, la pantalla de animal de alguien que
  bloqueaste de #13); (c) que no tenga ya una solicitud activa por ese animal (si la tiene, Mi
  solicitud); (d) que tenga menos de 3 activas (si no, la pantalla de límite); (e) que tenga el
  teléfono verificado (si no, el aviso de verificación pendiente de #10); (f) que tenga el nivel que
  pide el animal (si no, la pantalla de identidad). Cada pantalla que frena ofrece el camino para
  resolverlo y la vuelta a ese animal.
- **FR-004**: Abrir el cuestionario de un animal por su dirección hace los mismos controles que
  FR-003.
- **FR-005**: Un animal en proceso recibe solicitudes; al tocar «Quiero adoptar» y en el
  cuestionario se avisa que el publicador ya está avanzando con otra persona y que la solicitud
  queda por si eso no se concreta.

#### Nivel exigido

- **FR-010**: Cada publicación tiene un nivel exigido para solicitarla: teléfono verificado o
  identidad verificada. Se elige al publicar y al editar, y arranca en teléfono verificado; las
  publicaciones que ya existen quedan en teléfono verificado.
- **FR-011**: La ficha de un animal que pide identidad verificada lo dice, para cualquiera, antes de
  tocar nada.
- **FR-012**: Quien tiene solo el teléfono verificado y toca «Quiero adoptar» en un animal que pide
  identidad ve la pantalla de identidad con el camino a verificarla (historia #11); si su pedido
  está en revisión, lo dice, con el día. El pedido de identidad que se manda llegando desde un
  animal recuerda ese animal, y el correo de identidad aprobada suma el camino de vuelta a él; si el
  animal se borra antes, el correo es el de siempre. Se borra con el pedido y con la cuenta.
- **FR-013**: Cambiar el nivel exigido vale para las solicitudes nuevas; las ya enviadas siguen como
  estaban.
- **FR-014**: El nivel se controla también al enviar: si el animal pide más de lo que la persona
  tiene en ese momento, no se manda, lo escrito queda como borrador y se ve la pantalla de identidad
  (o el aviso de verificación pendiente, si perdió el teléfono verificado).

#### El cuestionario

- **FR-020**: El cuestionario tiene estas preguntas, en este orden, todas obligatorias:
  1. Vivienda: casa, apartamento u otra.
  2. Si es propia, alquilada u otra situación.
  3. Si el contrato o el dueño permite animales: sí, no, no sé. Solo si es alquilada.
  4. Patio, balcón con red, balcón sin red o ninguno.
  5. Quiénes viven en la casa (texto).
  6. Otros animales en la casa, cuáles y si están castrados (texto; puede ser «ninguno»).
  7. Cuántas horas por día quedaría solo: menos de 4, de 4 a 8, más de 8.
  8. Qué pasa con el animal si se muda o se va de viaje (texto).
  9. Experiencia previa con perros o gatos (texto).
  10. Compromiso de castrarlo: sí o no. Solo si el animal no está castrado.
  11. Si cuenta con plata para vacunas, castración y una urgencia del veterinario: sí, justo, no.
  12. Por qué este animal (texto).
- **FR-021**: Cada respuesta de texto tiene hasta 500 caracteres y se ve cuánto queda; una hecha
  solo de espacios cuenta como sin contestar. Las de opciones se contestan eligiendo una.
- **FR-022**: Las preguntas que dependen de otra respuesta (3 y 10) aparecen solo cuando
  corresponden; si dejan de corresponder, su respuesta no se manda.
- **FR-023**: Ninguna respuesta de texto puede tener un teléfono, un correo, un enlace o una red
  social: no se manda, se marca cada respuesta que lo tiene y se explica, igual que en la ficha
  (#53), que el contacto se da cuando la solicitud se acepta, nunca antes.
- **FR-024**: Si falta una respuesta, al tocar «Enviar solicitud» se marca cuál falta y lo demás
  sigue escrito.
- **FR-025**: Desde la segunda solicitud, el cuestionario propone las respuestas de la última
  solicitud que la persona mandó, cualquiera sea su estado, todas editables, salvo «por qué este
  animal», que arranca vacía. Una pregunta que la anterior no tenía arranca vacía.
- **FR-026**: Cambiar el texto de una pregunta no cambia ni rompe las respuestas ya enviadas
  (docs/06 §Cuestionario).

#### Enviar

- **FR-030**: Al enviar se vuelven a controlar las condiciones de FR-003 y FR-014 y que el animal
  reciba solicitudes; si alguna falla, no se manda, se dice cuál, y todo lo escrito sigue en
  pantalla.
- **FR-031**: Un envío que no llega nunca borra lo escrito: todo sigue en pantalla con el aviso de
  que no se mandó y por qué. Reintentar o tocar dos veces «Enviar solicitud» nunca manda dos.
- **FR-032**: Al enviar bien se ve la pantalla de solicitud enviada; la solicitud queda enviada, con
  la fecha y la hora.
- **FR-033**: Mandar una solicitud no le muestra el teléfono ni el correo de nadie a nadie, en
  ninguna dirección: ni el del publicador a quien solicita, ni el de quien solicita al publicador.
- **FR-034**: Mandar una solicitud avisa solo en pantalla; no sale ningún correo, a nadie.

#### El borrador

- **FR-040**: Lo escrito y no enviado en el cuestionario de un animal se conserva al recargar o al
  volver, en el mismo navegador, por animal.
- **FR-041**: El borrador se borra al enviar bien la solicitud de ese animal, al cerrar sesión y al
  borrar la cuenta. Vive solo en el navegador de la persona.
- **FR-042**: Si hay borrador de un animal, el cuestionario arranca con el borrador en lugar de las
  respuestas propuestas.

#### El límite y retirar

- **FR-050**: Una persona tiene como máximo 3 solicitudes activas, y no más de una activa por el
  mismo animal. Las dos reglas valen también entre pestañas y dispositivos, al enviar.
- **FR-051**: Quien llega al límite ve sus 3 activas y puede retirar una ahí mismo; al hacerlo,
  sigue al cuestionario del animal desde el que llegó.
- **FR-052**: Quien solicita puede retirar una solicitud activa en cualquier momento, con
  confirmación. Retirada, deja de contar entre las activas, la ficha vuelve a mostrar «Quiero
  adoptar» y se puede volver a solicitar ese animal. Una retirada no vuelve a estar activa.

#### Lo que le pasa a una solicitud

- **FR-060**: Cuando el animal se pausa, vence o su publicador deja de tener el teléfono verificado,
  la solicitud sigue activa y Mis solicitudes y Mi solicitud dicen que el animal no está disponible
  por ahora; cuando vuelve a estar a la vista, la nota desaparece.
- **FR-061**: Cuando el animal se marca adoptado, la solicitud se cierra con «encontró hogar».
  Cuando se borra, se da de baja, la cuenta de su publicador se suspende o se borra, se cierra con
  «ya no está publicado». Volver a publicar o reactivar no la reabre.
- **FR-062**: Cuando una de las dos personas bloquea a la otra, las solicitudes activas entre ellas
  (de cualquiera de las dos a animales de la otra) se cierran. Si quien solicitó es la bloqueada, la
  ve cerrada porque ese animal ya no recibe solicitudes; si quien solicitó es quien bloqueó, porque
  bloqueó a quien lo publicó. Nada le dice a la bloqueada que la bloquearon. Desbloquear no reabre
  ninguna.
- **FR-063**: Mientras dure un bloqueo, ninguna de las dos solicita animales de la otra: la
  bloqueada ve que ese animal no está recibiendo solicitudes; quien bloqueó ve la pantalla de animal
  de alguien que bloqueaste de #13, con «Desbloquear».
- **FR-064**: Una cuenta suspendida no solicita, y sus solicitudes activas se cierran con «tu
  cuenta estuvo suspendida». Las solicitudes a los animales de una cuenta suspendida se cierran con
  «ya no está publicado». Reactivar la cuenta no reabre ninguna.
- **FR-065**: Una solicitud activa muestra la foto y el nombre del animal aunque hoy no esté a la
  vista (pausado, vencido, publicador sin teléfono verificado); su enlace lleva a lo que la ficha
  muestre en ese momento. Una solicitud guarda el nombre que tenía el animal; cuando el animal ya
  no está publicado o lo publicó alguien que quien mira bloqueó, se muestra con ese nombre, sin foto
  ni enlace a la ficha.
- **FR-066**: Lo que le pasa a una solicitud no le manda ningún correo a nadie en esta historia.

#### Mis solicitudes

- **FR-070**: Cada persona ve solo sus propias solicitudes. La de otra persona, por cualquier camino,
  se ve como una solicitud que no existe.
- **FR-071**: Mis solicitudes muestra cuántas de 3 activas tengo; las activas primero y después las
  cerradas y retiradas, de la más reciente a la más vieja; cada una con el animal, la fecha de envío
  y su estado.
- **FR-072**: Mi solicitud muestra el animal, el estado y desde cuándo, la fecha de envío y cada
  pregunta con lo que contesté, y «Retirar» si está activa. Una solicitud enviada no se edita.

#### Datos personales

- **FR-080**: De cada solicitud se guarda quién la mandó, a qué animal (y su nombre), cuándo, sus
  respuestas, su estado, su motivo de cierre y cuándo cambió. Nada más.
- **FR-081**: Las respuestas las puede leer quien solicitó y, desde la bandeja de la historia
  siguiente, quien publicó ese animal; nadie más, tampoco quien administra. Hasta que exista la
  bandeja, solo quien solicitó las puede leer.
- **FR-082**: Borrar la cuenta de quien solicitó borra sus solicitudes y sus respuestas. Si se borra
  el animal, quien solicitó sigue viendo su solicitud cerrada.
- **FR-083**: Lo escrito sin enviar vive solo en el navegador de la persona y nunca llega al sitio.
- **FR-084**: Un visitante, otra persona con sesión o quien administra no pueden leer, por ningún
  camino, una solicitud ajena ni sus respuestas.

#### Medición

- **FR-090**: Se mide: tocó «Quiero adoptar» (con o sin sesión, su nivel y el nivel que pide el
  animal); frenado por verificación (qué nivel faltaba) y si después volvió y mandó la solicitud;
  cuestionario empezado; abandonado (la última pregunta contestada cuando la persona deja el
  cuestionario sin enviar); solicitud enviada y cuánto tardó desde que se
  empezó; si usó respuestas propuestas; frenado por el límite de 3; solicitud retirada (días después
  de enviarla); solicitud cerrada por el animal o por una persona (por qué motivo de cierre).
- **FR-091**: Ningún evento lleva las respuestas ni datos de la persona.

### Key Entities *(include if feature involves data)*

- **Solicitud**: quién la mandó, a qué animal y el nombre del animal, cuándo, las respuestas
  (cada una atada a su pregunta y no al texto con que se la preguntó), el estado (enviada, retirada, cerrada),
  el motivo de cierre si está cerrada, y cuándo cambió.
- **Nivel exigido**: un dato de cada publicación: teléfono verificado o identidad verificada.
- **Animal desde el que se pidió la identidad**: el animal desde el que una persona mandó su pedido
  de identidad, para el camino de vuelta del correo de aprobación.
- **Borrador**: las respuestas no enviadas del cuestionario de un animal, solo en el navegador.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona con el nivel que pide el animal llega de la ficha a la pantalla de
  solicitud enviada contestando las 12 preguntas en no más de 8 minutos la primera vez y en no más
  de 3 minutos desde la segunda, con las respuestas propuestas.
- **SC-002**: En el 100 % de los intentos de prueba, nadie más que quien solicitó (un visitante,
  otra persona con sesión, el publicador hasta que exista la bandeja, quien administra) puede leer
  una solicitud o sus respuestas.
- **SC-003**: En el 100 % de los intentos de prueba, un doble toque, un reintento o dos pestañas no
  crean dos solicitudes ni dejan a nadie con más de 3 activas o con dos activas por el mismo animal.
- **SC-004**: En el 100 % de los cortes de conexión o recargas de prueba, ninguna respuesta escrita
  se pierde.
- **SC-005**: Ninguna persona descubre que el animal pide identidad verificada después de haber
  contestado alguna pregunta: el 100 % de los frenos por nivel ocurren antes del cuestionario
  (salvo que el nivel exigido cambie mientras contesta).
- **SC-006**: La medición permite calcular, por semana, cuántas personas tocaron «Quiero adoptar»,
  cuántas completaron el cuestionario, qué parte de las frenadas por identidad verificada después
  mandaron la solicitud, y en qué pregunta se abandona, sin ninguna respuesta ni dato de la persona.
- **SC-007**: En el 100 % de las pruebas, ninguna pantalla ni texto le dice a una persona bloqueada
  que la bloquearon.

## Assumptions

- Ya en main (Ready): la compuerta de teléfono verificado para solicitar, con el motivo «solicitar»
  y sus textos (historia #10), falta conectarla a «Quiero adoptar»; la detección de teléfono,
  correo, enlace o red social en un texto, con sus mensajes (historia #53), se reusa para las
  respuestas; el manejo de borradores que se borran al cerrar sesión o borrar la cuenta existe, y se
  suma el borrador de la solicitud; los estados de bloqueo y suspensión (historia #13) y los de
  publicación (historia #59) existen. No hay solicitudes ni nivel exigido por publicación.
- La historia no tiene comentarios; su cuerpo, con las «Decisiones del enjambre» (la última del
  2026-10-06), es la fuente. Los «500» son el tope de caracteres por respuesta. Las referencias como
  «docs/03 §4» son a documentos del proyecto.
- **Decisiones del enjambre**: las once de la historia se copian palabra por palabra a docs/03 §2,
  §3 y §4 en esta rama.
- **«Le llegó a quien publicó»**: la solicitud queda guardada para el publicador, que la ve cuando
  exista la bandeja (historia siguiente). Antes de la beta no hay publicadores de afuera, así que la
  frase no engaña a nadie; la historia siguiente la hace verdad de punta a punta.
- **Hasta la bandeja, solo quien solicitó lee las respuestas** (decisión de esta spec): es lo mínimo
  que pide la regla de datos (docs/01 §Legal / datos); la historia siguiente habilita al publicador.
- **El nivel también se controla al enviar** (decisión de esta spec): si el publicador sube el nivel
  mientras alguien contesta, no se manda, pero lo escrito queda como borrador y vuelve al aprobarse la
  identidad. Así la regla de no frenar después de contestar se cumple en el camino normal, y el
  nivel exigido no se puede saltear con una pestaña vieja.
- **El borrador es por animal** (decisión de esta spec): quien compara animales empieza varios
  cuestionarios, y empezar uno no tiene que borrar otro.
- **Las respuestas propuestas salen de la última solicitud mandada**, cualquiera sea su estado: lo
  que cambia de una solicitud a otra es el animal, no la casa.
- **Una solicitud cerrada guarda el nombre del animal** (decisión de esta spec): si el animal se
  borra, quien solicitó tiene que poder reconocerla; la foto no se guarda, y no se muestra cuando el
  animal ya no está publicado (puede haberse bajado por fotos robadas) o es de alguien que quien mira
  bloqueó (bloquear es dejar de ver).
- **Motivo de cierre «tu cuenta estuvo suspendida»** (decisión de esta spec): la suspensión es de la
  propia persona y ya la conoce; no revela nada a nadie más.
- **En un bloqueo mutuo**, quien solicitó ve «bloqueaste a quien lo publicó», que ya sabe, y nunca
  el bloqueo de la otra.
- **El orden de los controles antes del cuestionario** (FR-003) va de lo que no se puede resolver
  desde ahí a lo que sí, y deja la verificación para el final: nadie verifica su teléfono o su
  identidad por un animal que no recibe solicitudes, que ya solicitó o para el que no tiene lugar.
- **Quien pierde el teléfono verificado después de mandar** conserva sus solicitudes activas: es lo
  mismo que la historia dice del nivel exigido (lo enviado sigue), y la bandeja de la historia
  siguiente muestra el nivel de cada persona.
- **No hay tope de veces que se puede retirar y volver a solicitar el mismo animal**: la historia no
  lo pide, no sale ningún correo por una solicitud en esta historia, y la bandeja (historia
  siguiente) decide qué ve el publicador.
- **Mis solicitudes no se pagina**: con 3 activas como máximo, las cerradas de una persona en la
  beta se cuentan de a decenas.
- **Mis solicitudes se abre desde el menú de la cuenta y «Mi perfil»**, como Mis animales.
- **El correo de identidad aprobada lleva al animal desde el que se mandó el pedido** (decisión de
  esta spec): un pedido en revisión no se vuelve a mandar, así que un segundo animal no lo cambia; si
  la persona pidió la identidad sin pasar por un animal, el correo es el de siempre.
- **La medición** se registra como el resto del sitio hoy, sin respuestas ni datos de la persona;
  la decisión del 2026-10-04 de docs/03 («esta historia no suma eventos») es de la historia de la
  portada.
- **Fuera de esta historia**, como dice su alcance: la bandeja, aceptar, rechazar, pedir más
  información, revelar el contacto, los correos de una solicitud, cuántos días espera una solicitud,
  editar una solicitud enviada, preguntas propias del rescatista, el aval como nivel exigido, el
  cierre de M4, un tope por animal, chat, avisos por WhatsApp o del teléfono, la encuesta y el paso
  de la portada.
