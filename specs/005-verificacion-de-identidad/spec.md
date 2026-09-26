# Feature Specification: Verificación de identidad con revisión manual

**Feature Branch**: `feature/11-verificacion-identidad-revision-manual`

**Created**: 2026-09-26

**Status**: Draft

**Input**: Historia #11 del backlog, milestone «M1 - Cuentas y confianza». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (historias #9, #10 y #25): el nivel 1 en «Mi perfil» ("Nivel 1 desde el …", en
la sección del teléfono); la regla de quién está en nivel 1 y la puerta de publicar y solicitar,
con su aviso y la vuelta a la acción; el borrado de la cuenta con sus reglas (nunca "listo" a
medias, el reintento termina el trabajo); el envío de correos; el número perdido cuando otra
cuenta se queda con él. Esta spec no rehace nada de eso: suma el pedido de verificación de
identidad, su revisión, el nivel 2 en «Mi perfil», los correos del resultado, y lo que el borrado
de la cuenta tiene que llevarse de esta historia.

**Vocabulario de esta spec**:

- **Pedido**: el pedido de verificación de identidad de una cuenta, con sus dos fotos.
- **Las dos fotos**: la foto del frente de la cédula uruguaya y la selfie sosteniendo la cédula al
  lado de la cara. Son las **imágenes** del pedido.
- **Estados del pedido**: **en revisión** (enviado y sin resolver; es el único estado *abierto*),
  **aprobado**, **rechazado**, **retirado** (lo retiró la persona) y **vencido** (pasaron 7 días
  sin resolverse). Los cuatro últimos son estados *cerrados*.
- **Resolver**: aprobar o rechazar un pedido en revisión.
- **Quien administra**: una persona con cuenta en el sitio a la que el equipo designó, por fuera
  del sitio, para revisar pedidos. Puede haber más de una. Todo lo demás de su cuenta es como el de
  cualquier cuenta.
- **Cola de revisión**: la pantalla donde quien administra ve los pedidos en revisión y los
  resuelve.
- **Identidad verificada**: que una cuenta tuvo un pedido aprobado, con el día en que se aprobó.
- **Nivel 2**: una cuenta en nivel 1 (historia #10) con la identidad verificada.
- **Tope de intentos**: 3 pedidos rechazados en los últimos 30 días.
- **Correo de ayuda**: la dirección a la que la persona puede escribir para pedir ayuda (ver
  Assumptions).
- **Día**: siempre el día calendario de Uruguay; toda fecha que se muestra, en hora de Uruguay.
- Número a medias, sin verificar, nivel 1, la puerta, el aviso de la puerta, número perdido,
  marca de visita: lo mismo que en las historias #9, #10 y #25.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pedir la verificación de identidad (Priority: P1)

Una persona con el teléfono verificado ve en su perfil que está en nivel 1 y que puede pasar a
nivel 2. Entra, lee qué se hace con sus imágenes, lo acepta, sube la foto del frente de su cédula
y una selfie sosteniéndola, y ve que su pedido quedó en revisión y que suele tardar hasta 2 días.
Mientras está en revisión puede retirarlo, y sus imágenes se borran en ese momento.

**Why this priority**: es la puerta de entrada al nivel 2 y el punto donde la hipótesis del MVP se
mide: cuánta gente empieza, acepta el consentimiento y envía. Sin esto no hay nada que revisar.

**Independent Test**: con una persona de prueba en nivel 1, abrir «Mi perfil», ver la oferta de
nivel 2, aceptar el consentimiento, subir dos fotos de prueba y ver el pedido en revisión; después
retirarlo y ver que se puede empezar de nuevo. Con una persona sin teléfono verificado, intentar
pedir y ver que primero va el teléfono.

**Acceptance Scenarios**:

1. **Dado** que tengo el teléfono verificado y nunca pedí la verificación de identidad, **cuando**
   abro «Mi perfil», **entonces** veo que estoy en nivel 1 y la oferta de pasar a nivel 2, con una
   línea sobre para qué sirve y el acceso a empezar.
2. **Dado** que empiezo el pedido, **cuando** llego a la pantalla, **entonces** leo qué se pide, qué
   se hace con mis imágenes (quién las ve, cuándo se borran, qué queda guardado, que puedo retirar
   el pedido) y no puedo elegir ni sacar ninguna foto hasta aceptarlo.
3. **Dado** que acepté, **cuando** agrego las dos fotos, **entonces** veo cada una antes de enviar,
   puedo cambiar cualquiera de las dos, y para la selfie veo un ejemplo de cómo sacarla.
4. **Dado** que tengo las dos fotos, **cuando** envío, **entonces** veo que mi pedido quedó en
   revisión, desde qué día, que la revisión suele tardar hasta 2 días, que me va a llegar un correo
   con el resultado, y la opción de retirarlo.
5. **Dado** que ya tengo un pedido en revisión, **cuando** intento pedir otro, **entonces** se me
   dice que ya hay uno abierto y veo en qué estado está, sin forma de subir otras fotos.
6. **Dado** que tengo un pedido en revisión, **cuando** lo retiro y confirmo, **entonces** las
   imágenes se borran en ese momento, el pedido sale de la cola de revisión, veo la confirmación de
   que se retiró y se borraron, y puedo pedirlo de nuevo sin que cuente como intento.
7. **Dado** que subo algo que no es una foto aceptada o pesa más de 10 MB, **cuando** lo intento,
   **entonces** se me dice qué se acepta, esa foto no queda agregada y la otra, si ya la tenía, sigue
   ahí.
8. **Dado** que no tengo el teléfono verificado, **cuando** intento pedir la verificación de
   identidad, **entonces** se me explica que primero va el teléfono y se me ofrece verificarlo ahí
   mismo; al terminar, vuelvo a la pantalla de pedir la verificación de identidad.
9. **Dado** que la subida se corta a la mitad, **cuando** vuelvo, **entonces** el pedido no quedó a
   medias: o está en revisión con las dos imágenes, o no existe y puedo empezarlo de nuevo.

---

### User Story 2 - Revisar los pedidos y dar el resultado (Priority: P2)

Quien administra abre la cola de revisión, ve los pedidos en revisión del más viejo al más nuevo y
los resuelve uno por uno: aprueba si la cédula se lee, está vigente y la cara de la selfie es la de
la cédula, o rechaza eligiendo un motivo. Las imágenes se borran apenas lo resuelve. La persona
recibe un correo con el resultado y, al entrar, ve que está en nivel 2 y desde qué día, o el motivo
del rechazo y qué hacer para que la próxima salga bien.

**Why this priority**: sin revisión, un pedido nunca se convierte en nivel 2. Va segunda porque
revisa lo que la primera crea.

**Independent Test**: con una persona de prueba que tiene un pedido en revisión y otra designada
para administrar: la segunda abre la cola, ve el pedido con sus datos y sus imágenes, lo aprueba;
la primera recibe el correo y ve en su perfil nivel 2 con la fecha; las imágenes ya no existen.
Repetir rechazando con un motivo y ver el motivo en el estado del pedido y en el correo.

**Acceptance Scenarios**:

1. **Dado** que administro el sitio, **cuando** abro la cola de revisión, **entonces** veo los pedidos
   en revisión, del más viejo al más nuevo, cuántos son, y de cada uno desde qué día espera y qué día
   vence.
2. **Dado** que abro un pedido de la cola, **cuando** lo miro, **entonces** veo el nombre para
   mostrar de la persona, su zona, desde qué día tiene cuenta, sus rechazos de los últimos 30 días
   con el día y el motivo de cada uno, y las dos imágenes; y puedo aprobar, o rechazar eligiendo
   uno de los cuatro motivos.
3. **Dado** que apruebo un pedido, **cuando** termina, **entonces** las imágenes se borran, el pedido
   sale de la cola, y paso al siguiente más viejo que no sea mío o, si no queda ninguno, a la cola
   vacía.
4. **Dado** que mi pedido fue aprobado, **cuando** me llega el correo y entro, **entonces** veo en
   «Mi perfil» que estoy en nivel 2 y desde qué día, y en el estado de mi pedido que fue aprobado y
   que mis imágenes ya se borraron.
5. **Dado** que mi pedido fue rechazado, **cuando** lo miro o me llega el correo, **entonces** veo el
   motivo y qué hacer para que la próxima salga bien, y puedo intentarlo de nuevo (salvo que haya
   llegado al tope de intentos).
6. **Dado** que dos personas administran, **cuando** una resuelve un pedido que la otra tiene
   abierto, **entonces** la segunda ve que ya fue resuelto, deja de ver las imágenes y no puede
   resolverlo de nuevo.
7. **Dado** que estoy mirando un pedido, **cuando** la persona lo retira o borra su cuenta antes de
   que lo resuelva, **entonces** veo que el pedido ya no está, sus imágenes no se muestran más y no
   puedo aprobarlo ni rechazarlo.
8. **Dado** que administro el sitio y tengo un pedido propio en revisión, **cuando** abro la cola,
   **entonces** lo veo marcado como mío, sin sus imágenes y sin poder resolverlo: lo tiene que
   resolver otra persona que administre.
9. **Dado** que no administro el sitio, **cuando** intento abrir la cola de revisión o una imagen de
   otra persona, **entonces** no puedo verla ni sé qué hay adentro.

---

### User Story 3 - Intentos, tope y vencimiento (Priority: P3)

Quien fue rechazado puede volver a intentarlo, pero con un tope: 3 pedidos rechazados en 30 días.
Un pedido que nadie resuelve en 7 días vence solo: sus imágenes se borran y la persona recibe un
correo para pedirlo de nuevo. Retirar o vencer no cuenta como intento.

**Why this priority**: el tope es lo que frena a quien prueba cédulas ajenas, y el vencimiento
garantiza que ninguna imagen quede guardada más de 7 días aunque nadie revise. Se prueban sobre lo
que construyen las dos primeras.

**Independent Test**: con una persona de prueba con 3 pedidos rechazados en los últimos 30 días,
intentar pedir y ver la fecha desde la que va a poder y el correo de ayuda. Con un pedido enviado
hace más de 7 días, ver que no está en la cola, que sus imágenes no existen, que la persona ve
"vencido" y que le llegó el correo.

**Acceptance Scenarios**:

1. **Dado** que tuve 3 pedidos rechazados en los últimos 30 días, **cuando** quiero pedirlo otra vez,
   **entonces** se me dice el día desde el que voy a poder y a qué correo escribir para pedir ayuda,
   y no puedo empezar un pedido.
2. **Dado** que tuve 2 pedidos rechazados en los últimos 30 días, **cuando** veo el estado del último,
   **entonces** además del motivo se me dice que me queda un intento antes del tope.
3. **Dado** que un pedido lleva 7 días sin resolver, **cuando** se cumple el plazo, **entonces** sale
   de la cola, ya no se puede resolver, sus imágenes se borran solas y a la persona le llega un
   correo que la invita a pedirlo de nuevo.
4. **Dado** que mi pedido venció, **cuando** miro su estado, **entonces** veo que venció, que las
   imágenes se borraron, que no cuenta como intento, y el acceso a pedirlo de nuevo.
5. **Dado** que retiré o me vencieron pedidos, **cuando** cuento mis intentos, **entonces** ninguno
   de ellos cuenta para el tope.

---

### User Story 4 - El nivel 2 sigue con la persona (Priority: P4)

La identidad verificada es de la cuenta y no del número: quien cambia de teléfono baja a sin
verificar como dice la historia #10 y, al confirmar el número nuevo, vuelve a nivel 2 sin subir la
cédula otra vez. Borrar la cuenta se lleva todo lo de esta historia.

**Why this priority**: sin esto, un cambio de chip le haría perder a la persona el nivel que le
costó conseguir; es poco frecuente, por eso va última.

**Independent Test**: con una persona de prueba en nivel 2, empezar un cambio de número y ver que
queda sin verificar; confirmar el número nuevo y ver nivel 2 otra vez, sin ningún pedido nuevo.
Con una persona con un pedido en revisión, borrar la cuenta y comprobar que el pedido y las
imágenes no existen.

**Acceptance Scenarios**:

1. **Dado** que estoy en nivel 2 y empiezo un cambio de número, **cuando** miro «Mi perfil»,
   **entonces** veo que estoy sin verificar hasta confirmar el nuevo, y que mi identidad sigue
   verificada, con su día, y vuelve a darme nivel 2 al confirmar el teléfono.
2. **Dado** que estoy en nivel 2 y cambio de teléfono, **cuando** confirmo el número nuevo,
   **entonces** vuelvo a nivel 2 sin subir la cédula otra vez.
3. **Dado** que estoy en nivel 2 y otra cuenta se queda con mi número (historia #25), **cuando**
   verifico un número de nuevo, el mismo u otro, **entonces** vuelvo a nivel 2 sin subir la cédula.
4. **Dado** que borro mi cuenta con un pedido en revisión, **cuando** la borro, **entonces** el
   pedido y sus imágenes desaparecen con ella, y sale de la cola de revisión.
5. **Dado** que borro mi cuenta, **cuando** leo la confirmación del borrado, **entonces** entre lo que
   se borra figura la verificación de identidad y cualquier pedido con sus imágenes.

---

### Edge Cases

- **Dos personas que administran resuelven el mismo pedido a la vez**: exactamente una resolución
  vale; la otra ve que ya fue resuelto y no cambia nada (FR-022).
- **Retira mientras se resuelve**: si la persona retira el pedido en el mismo momento en que quien
  administra lo resuelve, vale lo que ocurra primero; nunca las dos. Si ganó el retiro, quien
  administra ve que el pedido ya no está; si ganó la resolución, la persona ve el resultado y se le
  dice que ya no se podía retirar.
- **Vence mientras quien administra lo mira**: a partir de los 7 días el pedido no se puede
  resolver aunque la pantalla siga abierta; quien administra ve que venció.
- **Vence mientras la persona lo mira**: el estado pasa a vencido al volver a cargarlo; retirar un
  pedido que ya venció no hace nada y muestra el estado vencido.
- **La persona borra la cuenta con un pedido abierto**: el pedido y sus imágenes desaparecen con
  ella; para quien administra es lo mismo que un retiro (FR-023).
- **Quien administra borra su cuenta**: los pedidos que resolvió siguen resueltos y las
  identidades que aprobó siguen verificadas; el registro de quién resolvió pasa a decir "una cuenta
  borrada", sin ningún dato de esa persona.
- **Quien administra deja de estarlo** (lo decide el equipo): desde ese momento no ve la cola ni
  puede resolver, aunque tenga la pantalla abierta; lo que ya resolvió sigue resuelto.
- **Una sola persona administra y tiene un pedido propio**: nadie puede resolverlo y vence a los 7
  días como cualquier otro. Se acepta (ver Assumptions).
- **Cambia de número con un pedido en revisión**: el pedido sigue en revisión; si se aprueba
  mientras el número nuevo está a medias, la identidad queda verificada y la cuenta pasa a nivel 2
  recién al confirmar el número.
- **Otra cuenta se queda con el número de alguien con un pedido en revisión** (historia #25): el
  pedido sigue en revisión; aprobarlo verifica la identidad, y el nivel 2 llega al volver a tener un
  teléfono verificado.
- **Entra a pedir con la identidad ya verificada** (por un enlace viejo o escribiendo la dirección):
  no se ofrece subir nada; ve el estado aprobado, con su día.
- **Entra a pedir sin teléfono verificado y con un pedido en revisión** (cambió de número después de
  enviarlo): ve el estado de su pedido en revisión; lo del teléfono se le dice en «Mi perfil».
- **Tope alcanzado con un pedido vencido o retirado en el medio**: los vencidos y retirados no
  cuentan; el tope mira solo los rechazados de los últimos 30 días.
- **El tercer rechazo**: el estado y el correo del tercer rechazo dicen, además del motivo, el día
  desde el que va a poder volver a pedirlo y el correo de ayuda.
- **El día desde el que puede volver a pedir**: es el día en que el más viejo de los tres rechazos
  que cuentan cumple 30 días; ese día ya puede pedir.
- **Una foto que se procesa mal** (el archivo es de un tipo aceptado pero está dañado): se dice que
  no se pudo usar esa foto y se deja elegir otra; la otra foto sigue ahí.
- **Dos toques seguidos** en enviar, retirar, aprobar o rechazar: se procesa uno solo; la acción
  queda ocupada mientras tanto.
- **La sesión vence en el medio del pedido**: al enviar se pide ingresar; las fotos elegidas no se
  conservan (no quedan guardadas en ningún lado sin un pedido), y al volver se empieza de nuevo por
  el consentimiento.
- **Se cierra la pantalla con las fotos elegidas y sin enviar**: no queda ningún pedido; si alguna
  imagen llegó a subirse, se borra como dice FR-008. Al volver, se empieza de nuevo.
- **El correo del resultado no sale** (falla del servicio de correo): la resolución vale igual; la
  persona lo ve al entrar, en el estado de su pedido y en «Mi perfil».
- **Mientras no haya dominio** (KL-006): los correos salen de verdad solo a la dirección de la cuenta
  del servicio de correo; en desarrollo y en las pruebas quedan en la máquina.
- **Un pedido rechazado cumple 30 días**: su día y su motivo se borran; deja de contar para el tope y
  deja de mostrarse a quien administra y a la persona. Si era el último estado que la persona veía,
  el estado de su pedido pasa a mostrarse como si nunca hubiera pedido.
- **Un pedido vencido deja de mostrarse**: la persona ve "vencido" hasta que empieza un pedido nuevo o
  hasta que pasan 30 días desde que venció; después, el estado se muestra como si nunca hubiera
  pedido.
- **Un pedido retirado**: no queda nada de él; justo al retirarlo se ve la confirmación, y después el
  estado se muestra como si nunca hubiera pedido.

## Pantallas

Cada pantalla, con su estado vacío, su estado mientras carga o guarda, y su estado de error, con los
mismos criterios que las historias #9 y #10.

- **Pedir verificación de identidad**.
  - *Contenido*: qué se pide (las dos fotos), para qué sirve el nivel 2, qué se hace con las
    imágenes (FR-004) y la aceptación; aceptado, las dos fotos, cada una con sacarla en el momento
    o elegirla de las fotos del teléfono, su vista previa y la opción de cambiarla; para la selfie,
    un ejemplo dibujado de cómo sacarla; y enviar, que solo se habilita con las dos fotos.
  - *Vacío*: no aplica; si la persona ya tiene un pedido en revisión, la identidad verificada o el
    tope alcanzado, no ve esta pantalla sino el estado de su pedido (FR-009). Sin teléfono
    verificado, ve lo de FR-002.
  - *Cargando*: mientras se procesa una foto, su lugar muestra que se está preparando y enviar queda
    deshabilitado; mientras se envía, enviar queda ocupado y no admite un segundo toque, y se ve
    que se está enviando.
  - *Error*: foto de un tipo no aceptado o de más de 10 MB (FR-006); foto que no se pudo procesar
    (se elige otra); el envío falló por la conexión o el sitio: se dice que no se envió, que no
    quedó nada guardado, y se deja reintentar con las mismas fotos si la pantalla sigue abierta;
    la sesión venció: pide ingresar. Ninguno deja a la persona sin un paso siguiente.
- **Estado de mi pedido**.
  - *Vacío*: si nunca pidió (o nada de lo anterior sigue guardado, ver Edge Cases), explica para qué
    sirve el nivel 2 y ofrece empezar; sin teléfono verificado, dice que primero va el teléfono y
    ofrece verificarlo.
  - *En revisión*: desde qué día, que suele tardar hasta 2 días, que llega un correo con el
    resultado, que vence a los 7 días si nadie lo revisa (con el día), y retirar, con una
    confirmación que dice que las imágenes se borran en ese momento.
  - *Aprobado*: que está en nivel 2 (o que lo va a estar al confirmar el teléfono, si hoy está sin
    verificar), desde qué día tiene la identidad verificada, y que las imágenes se borraron.
  - *Rechazado*: el motivo, qué hacer para que la próxima salga bien (FR-017), que las imágenes se
    borraron, cuántos intentos le quedan antes del tope, y volver a intentarlo.
  - *Vencido*: que nadie llegó a revisarlo en 7 días, que las imágenes se borraron, que no cuenta
    como intento, y pedirlo de nuevo.
  - *Sin intentos hasta una fecha*: el día desde el que va a poder volver a pedirlo y el correo de
    ayuda.
  - *Recién retirado*: la confirmación de que se retiró y se borraron las imágenes, y pedirlo de
    nuevo.
  - *Cargando*: la forma de la pantalla mientras se trae el estado; mientras se retira, retirar
    queda ocupado y no admite un segundo toque.
  - *Error*: no se pudo traer el estado: se dice y se ofrece reintentar; retirar falló: se dice que
    no se retiró y que las imágenes siguen en el pedido, y se deja reintentar; el pedido ya se había
    resuelto o vencido al retirar: se muestra el estado real.
- **Cola de revisión** (solo para quien administra).
  - *Lista*: los pedidos en revisión, del más viejo al más nuevo, cuántos son, y de cada uno el
    nombre para mostrar, desde qué día espera y qué día vence; el pedido propio, marcado como tal.
    La lista no muestra imágenes.
  - *Un pedido*: el nombre para mostrar, la zona, desde qué día tiene cuenta, sus rechazos de los
    últimos 30 días (día y motivo de cada uno, o que no tiene), las dos imágenes, qué mirar para
    aprobar (FR-015), aprobar, y rechazar eligiendo un motivo de la lista. Después de resolver,
    pasa al siguiente más viejo.
  - *Vacío*: "No hay pedidos esperando".
  - *Cargando*: la forma de la lista o del pedido mientras se trae; las imágenes muestran su lugar
    mientras cargan; mientras se resuelve, aprobar y rechazar quedan ocupados.
  - *Error*: no se pudo traer la cola o el pedido: se dice y se ofrece reintentar; una imagen no
    cargó: se dice en su lugar y se ofrece volver a cargarla, y el pedido no se puede aprobar sin
    ver las dos; el pedido ya no está: se dice qué pasó según FR-021, sin mostrar nada más, y se
    vuelve a la lista; resolver
    falló por la conexión: se dice y se deja reintentar.
  - *Sin permiso*: quien no administra no ve la cola: ve lo mismo que en una pantalla que no existe.
- **Mi perfil** (la sección del nivel).
  - Sin teléfono verificado: el paso pendiente del teléfono, como en la historia #10; el nivel 2 no se
    ofrece como acción. Si la identidad ya está verificada, además dice que al confirmar el
    teléfono vuelve a nivel 2.
  - Nivel 1 sin pedido: la oferta de nivel 2 con una línea sobre para qué sirve y el acceso a
    empezar.
  - Nivel 1 con un pedido en revisión, rechazado, vencido o sin intentos: una línea con ese estado y
    el acceso al estado del pedido.
  - Nivel 2: "Nivel 2" y el día desde el que tiene la identidad verificada. El nivel se dice una sola
    vez: la sección del teléfono deja de decir "Nivel 1" cuando la cuenta está en nivel 2.
  - Quien administra, además, ve el acceso a la cola de revisión con cuántos pedidos esperan.
  - *Cargando* y *Error*: como el resto del perfil.
- **Correos** (aprobado, rechazado, vencido).
  - Siempre dicen qué pasó, desde qué día, que las imágenes se borraron, y el paso siguiente con un
    enlace común al sitio (no un enlace de ingreso): aprobado → «Mi perfil»; rechazado → el motivo,
    qué hacer, y volver a intentarlo (o, en el tercer rechazo, el día desde el que va a poder y el
    correo de ayuda); vencido → pedirlo de nuevo. Nunca llevan imágenes ni datos de la cédula.
  - *Cargando* y *Error*: no aplica para quien lo recibe; si el correo no sale, rige FR-026.

## Requirements *(mandatory)*

### Functional Requirements

#### Pedir

- **FR-001**: «Mi perfil» DEBE ofrecer pasar a nivel 2 a quien está en nivel 1 y no tiene la
  identidad verificada ni un pedido en revisión, con una línea sobre para qué sirve ("Con tu
  identidad verificada, quien da un animal en adopción sabe que detrás de tu cuenta hay una persona
  real") y el acceso a empezar.
- **FR-002**: Pedir la verificación de identidad DEBE exigir nivel 1. Sin él, la pantalla DEBE
  explicar que primero va el teléfono y ofrecer verificarlo ahí mismo, con la puerta y el aviso de
  la historia #10, que para esto nombra la acción «pedir la verificación de identidad» y dice en una
  frase por qué hace falta el teléfono ("El nivel 2 incluye el nivel 1: primero verificá tu
  teléfono"); «Ahora no» lleva a «Mi perfil». Al terminar de verificar el teléfono, la persona DEBE
  volver a la pantalla de pedir la verificación de identidad. La regla vale para cualquier forma de llegar y también al enviar,
  porque la cuenta pudo bajar a sin verificar en el medio.
- **FR-003**: Antes de poder elegir o sacar ninguna foto, la persona DEBE aceptar explícitamente el
  consentimiento, con una acción propia (no un casillero marcado de antemano). Sin aceptar, NO DEBE
  poder agregar fotos ni enviar. El consentimiento vale para ese pedido: cada pedido nuevo lo pide
  otra vez.
- **FR-004**: El texto del consentimiento DEBE decir, antes de subir nada: qué se pide y para qué;
  que las imágenes las ve solamente quien administra el sitio, designado por el equipo, y solamente
  mientras el pedido está en revisión; que se borran apenas el pedido se aprueba, se rechaza, se
  retira o vence a los 7 días; que de un pedido aprobado queda solamente que la identidad está
  verificada y el día; que de un rechazo quedan el día y el motivo durante 30 días; que queda
  registrado quién resolvió el pedido; que nunca se guarda el número ni ningún otro dato de la
  cédula; que puede retirar el pedido mientras está en revisión y las imágenes se borran en ese
  momento; y que nadie más, tampoco quien reciba una solicitud suya, ve nunca su documento.
- **FR-005**: El pedido DEBE llevar exactamente dos fotos: el frente de la cédula uruguaya y una
  selfie sosteniendo la cédula al lado de la cara. Cada una DEBE poder sacarse en el momento con la
  cámara, donde el dispositivo la tiene, o elegirse de las fotos o archivos del dispositivo. Para la selfie, la pantalla DEBE mostrar un
  ejemplo dibujado (no una foto de una persona real) de cómo sacarla, y para las dos, en una línea,
  cómo sacarla para que se lea (buena luz, sin reflejos, la cédula entera).
- **FR-006**: El producto DEBE aceptar como foto únicamente imágenes JPEG, PNG, WebP o AVIF de hasta
  10 MB, los mismos formatos que la foto de perfil de la historia #9. Ante otra cosa DEBE decir qué
  se acepta y NO DEBE agregar esa foto; la otra, si ya estaba, sigue ahí. Si el archivo es de un
  tipo aceptado pero no se puede procesar, DEBE decirlo y dejar elegir otra.
- **FR-007**: Antes de enviar, la persona DEBE ver las dos fotos y poder cambiar cualquiera. Enviar
  DEBE habilitarse solo con las dos.
- **FR-008**: Enviar DEBE ser todo o nada: el pedido queda en revisión con las dos imágenes, o no
  queda nada. Si el envío se corta, la persona DEBE poder empezar de nuevo, y una imagen que llegó
  sin que el pedido quedara completo DEBE borrarse a más tardar una hora después, sin que nadie la
  haya podido ver.
- **FR-008a**: El producto NO DEBE guardar de las fotos nada más que la imagen: ni la ubicación, ni
  la fecha, ni el modelo del dispositivo, ni ningún otro dato que la foto traiga adentro.
- **FR-009**: Una cuenta DEBE tener, como mucho, un pedido en revisión. Con un pedido en revisión,
  la identidad ya verificada o el tope alcanzado, intentar pedir DEBE mostrar el estado del pedido
  (FR-011) y NO DEBE dejar subir fotos. Un pedido aprobado es para siempre en esa cuenta: no se pide
  de nuevo.
- **FR-010**: Al enviar, la persona DEBE ver que su pedido quedó en revisión, desde qué día, que la
  revisión suele tardar hasta 2 días, que le va a llegar un correo con el resultado, y la opción de
  retirarlo.

#### Estado y retiro

- **FR-011**: La persona DEBE poder ver el estado de su pedido en todo momento, con lo que dice
  §Pantallas para cada estado y el paso siguiente de cada uno. NUNCA DEBE volver a ver sus imágenes
  después de enviarlas.
- **FR-012**: Mientras el pedido está en revisión, la persona DEBE poder retirarlo, con una
  confirmación que dice que las imágenes se borran en ese momento. Al retirarlo, en un solo paso:
  las imágenes DEBEN borrarse, el pedido DEBE dejar de poder resolverse y salir de la cola, y NO
  DEBE contar como intento. Después DEBE poder pedirlo de nuevo enseguida.
- **FR-012a**: De un pedido retirado NO DEBE quedar nada guardado.
- **FR-012b**: Un pedido que ya se resolvió o venció NO DEBE poder retirarse; si la persona lo
  intenta, ve el estado real.

#### Revisar

- **FR-013**: Solamente quien administra DEBE poder ver la cola de revisión, abrir un pedido y ver
  sus imágenes. Para cualquier otra cuenta, y sin sesión, la cola, cada pedido y cada imagen DEBEN
  comportarse como algo que no existe: sin revelar si hay pedidos, cuántos, ni de quién.
- **FR-013a**: Quién administra lo designa el equipo por fuera del sitio. El sitio NO DEBE tener
  ninguna forma de designar ni de dejar de designar a quien administra, y nadie DEBE poder
  designarse a sí mismo.
- **FR-014**: La cola DEBE mostrar los pedidos en revisión del más viejo al más nuevo, cuántos son y,
  de cada uno, el nombre para mostrar, desde qué día espera y qué día vence. Al abrir un pedido,
  DEBE mostrar: el nombre para mostrar, la zona, desde qué día tiene cuenta la persona, sus rechazos
  de los últimos 30 días con el día y el motivo de cada uno, y las dos imágenes. NO DEBE mostrar el
  teléfono, el correo, la foto de perfil ni ningún otro dato de la persona.
- **FR-015**: Junto al pedido, la pantalla DEBE recordar la regla: se aprueba solamente si la cédula
  se lee, está vigente y la cara de la selfie es la de la cédula; si no, se rechaza.
- **FR-016**: Rechazar DEBE exigir elegir exactamente un motivo de esta lista: **no se lee**, **no
  coincide**, **cédula vencida**, **sospecha de fraude**. NO DEBE haber texto libre.
- **FR-017**: La persona DEBE ver el motivo del rechazo y qué hacer para que la próxima salga bien:
  - *No se lee*: sacar las fotos con buena luz, sin reflejos, enfocadas y con la cédula entera.
  - *No coincide*: la selfie tiene que ser de la misma persona de la cédula, sosteniéndola al lado
    de la cara.
  - *Cédula vencida*: pedirlo de nuevo con la cédula vigente.
  - *Sospecha de fraude*: pedirlo de nuevo solamente con su propia cédula, y escribir al correo de
    ayuda si cree que es un error.
- **FR-018**: Al resolver un pedido, en un solo paso que se completa entero o no se hace:
  1. las imágenes DEBEN borrarse;
  2. si se aprueba, la cuenta DEBE quedar con la identidad verificada y el día;
  3. si se rechaza, DEBEN quedar el día y el motivo;
  4. DEBE quedar registrado quién lo resolvió;
  5. el pedido DEBE salir de la cola.
  Después, quien administra DEBE pasar al siguiente pedido más viejo que no sea propio, o a la
  lista si no queda ninguno para resolver.
- **FR-019**: Las imágenes de un pedido DEBEN poder verse solamente mientras el pedido está en
  revisión. La dirección de una imagen DEBE servir solamente a quien administra, con su sesión, y
  solamente mientras el pedido está en revisión: abierta después de que el pedido se cierra, por
  otra cuenta o sin sesión, NO DEBE mostrar nada ni decir si la imagen existió. Las imágenes NO DEBEN
  quedar guardadas en el dispositivo de quien administra más allá de la pantalla abierta.
- **FR-020**: Nadie DEBE poder resolver su propio pedido. En la cola, el pedido propio DEBE aparecer
  marcado como propio, sin sus imágenes y sin aprobar ni rechazar; lo resuelve otra persona que
  administre.
- **FR-021**: Mientras quien administra tiene un pedido abierto en pantalla, si el pedido se cierra
  por otro camino —la persona lo retira, borra su cuenta, otra persona que administra lo resuelve, o
  vence—, la pantalla DEBE dejar de mostrar las imágenes y las acciones de resolver a más tardar 30
  segundos después, sin que haga falta tocar nada, y DEBE decir qué pasó: "ya fue resuelto" si lo
  resolvió otra persona que administra, "venció" si pasaron los 7 días, y si no, "ya no está: la
  persona lo retiró o ya no tiene cuenta" (no se distingue entre esos dos porque de un pedido
  retirado no queda nada, FR-012a). Intentar resolverlo en ese lapso NO DEBE cambiar nada y DEBE
  mostrar lo mismo.
- **FR-022**: Si dos personas que administran resuelven el mismo pedido a la vez, exactamente una
  resolución DEBE valer; la otra NO DEBE cambiar nada y DEBE ver que el pedido ya fue resuelto.
- **FR-022a**: Mientras se resuelve, aprobar y rechazar DEBEN quedar ocupados y no admitir un
  segundo toque.
- **FR-022b**: Quien deja de administrar DEBE perder el acceso a la cola y a las imágenes desde ese
  momento, también con la pantalla abierta: resolver ya no cambia nada.

#### Resultado y nivel 2

- **FR-023**: Una cuenta DEBE estar en **nivel 2** cuando está en nivel 1 y tiene la identidad
  verificada. La identidad verificada es de la cuenta, no del número: cambiar de número (historia
  #10) o perder el número porque otra cuenta se quedó con él (historia #25) baja la cuenta a sin
  verificar, y al volver a tener un teléfono verificado, el mismo u otro, DEBE volver a nivel 2 sin
  un pedido nuevo.
- **FR-024**: «Mi perfil» DEBE mostrar el nivel alcanzado una sola vez: en nivel 2, "Nivel 2" y el
  día en que se verificó la identidad —una fecha, no "hace 3 días"—, y la sección del teléfono deja
  de decir "Nivel 1"; en nivel 1, "Nivel 1" como hoy, más lo de FR-001 o una línea con el estado
  del pedido y el acceso a verlo; sin verificar con la identidad verificada, el paso pendiente del
  teléfono y que al confirmarlo vuelve a nivel 2; sin verificar con un pedido en revisión, rechazado,
  vencido o sin intentos, el paso pendiente del teléfono y la línea con el estado del pedido. El
  nivel se dice en texto: el distintivo es de la historia #12.
- **FR-025**: El nivel 2 NO DEBE certificar el nombre para mostrar, que sigue pudiendo cambiarse sin
  afectar el nivel. Ninguna pantalla DEBE decir que el nombre está verificado.
- **FR-026**: Al resolver o vencer un pedido, el producto DEBE mandarle un correo a la dirección de
  la cuenta:
  - *Aprobado*: que está en nivel 2 (o que lo va a estar al confirmar el teléfono, si hoy está sin
    verificar), desde qué día, que las imágenes se borraron, y un enlace a «Mi perfil».
  - *Rechazado*: el motivo, qué hacer para que la próxima salga bien (FR-017), que las imágenes se
    borraron, y un enlace para volver a intentarlo; en el tercer rechazo en 30 días, en lugar del
    enlace, el día desde el que va a poder y el correo de ayuda.
  - *Vencido*: que nadie llegó a revisarlo en 7 días, que las imágenes se borraron, que no cuenta
    como intento, y un enlace para pedirlo de nuevo.
  Los enlaces son comunes al sitio, no enlaces de ingreso (sin sesión, piden ingresar y, en el mismo
  dispositivo, vuelven a su destino con las reglas de la historia #9). Los correos NUNCA DEBEN
  llevar las imágenes, ningún dato de la cédula ni quién resolvió. Un pedido retirado no manda
  correo. Su texto DEBE ser traducible como cualquier otro texto del producto. Si el correo no sale,
  la resolución NO DEBE deshacerse: la persona lo ve al entrar. Se intenta una vez.

#### Intentos y vencimiento

- **FR-027**: Una cuenta con 3 pedidos rechazados en los últimos 30 días NO DEBE poder empezar un
  pedido. Al intentarlo, DEBE ver el día desde el que va a poder —el día en que el más viejo de esos
  tres rechazos cumple 30 días— y el correo de ayuda. Los pedidos retirados y vencidos NUNCA
  cuentan.
- **FR-027a**: El estado de un pedido rechazado DEBE decir cuántos intentos le quedan a la persona
  antes del tope ("Te queda 1 intento en los próximos 30 días") cuando le quedan uno o dos.
- **FR-028**: Un pedido en revisión DEBE vencer a los 7 días exactos de enviado: desde ese momento NO
  DEBE mostrarse en la cola ni poder resolverse, y la persona DEBE ver que venció, aunque sus
  imágenes todavía no se hayan borrado. Sus imágenes DEBEN borrarse y el correo de vencimiento
  DEBE salir a más tardar una hora después de vencer, sin que nadie tenga que hacer nada. El correo
  sale después de que las imágenes se borraron: nunca dice que se borraron si no fue así.
- **FR-028a**: Hasta que se cumplan los 7 días, la persona y quien administra DEBEN ver el día y la
  hora en que el pedido vence, en hora de Uruguay: la misma hora en que se envió, 7 días después.

#### Privacidad

- **FR-029**: Las imágenes de un pedido DEBE verlas solamente quien administra (que no sea su dueña),
  y solamente mientras el pedido está en revisión. Nadie más DEBE poder verlas nunca, tampoco su
  dueña después de enviarlas, ni quien vaya a entregarle un animal, ni una cuenta sin sesión. Cada
  regla DEBE demostrarse con un intento fallido: alguien sin sesión, la persona dueña del pedido y
  otra cuenta que no administra intentan ver la cola, un pedido y cada imagen, y no pueden.
- **FR-030**: El producto NUNCA DEBE guardar el número de la cédula ni ningún otro dato de ella:
  ni el nombre legal, ni la fecha de nacimiento, ni la de vencimiento. Quien administra NO DEBE
  tener dónde anotarlos (FR-016).
- **FR-031**: De cada pedido DEBE quedar, después de cerrarse, solamente:
  - *aprobado*: que la cuenta tiene la identidad verificada y el día, hasta que se borra la cuenta;
  - *rechazado*: el día y el motivo, durante 30 días, y después se borran;
  - *vencido*: que venció y el día, hasta que la persona empieza un pedido nuevo o pasan 30 días;
  - *retirado*: nada;
  - y, de cada pedido resuelto, quién lo resolvió, hasta que se borra la cuenta de la persona.
- **FR-032**: El día y el motivo de los rechazos, y quién resolvió cada pedido, DEBEN verlos
  solamente quien administra; la persona ve el día y el motivo de sus propios rechazos, nunca quién
  los resolvió. La identidad verificada y su día los ve su dueña; que otras personas vean el
  distintivo es de la historia #12.
- **FR-033**: Nada de lo que esta historia guarda DEBE poder escribirse, cambiarse ni borrarse desde
  el producto por otro camino que pedir, retirar, resolver, vencer o borrar la cuenta, **tampoco
  por su dueña**: ni la identidad verificada ni su día, ni los rechazos, ni quién resolvió, ni el
  estado de un pedido, ni ser quien administra. Si la dueña pudiera escribir su identidad
  verificada, el nivel 2 no significaría nada; si pudiera borrar sus rechazos, se saltearía el
  tope. Cada regla DEBE demostrarse con un intento fallido.
- **FR-034**: Borrar la cuenta DEBE borrar el pedido abierto y sus imágenes, la identidad verificada,
  los rechazos, el estado de un pedido vencido y el registro de quién resolvió sus pedidos, con las
  reglas de borrado de la historia #9 (nunca "listo" a medias, el reintento termina el trabajo). La
  confirmación del borrado DEBE nombrar la verificación de identidad entre lo que se borra.
- **FR-034a**: Si la cuenta que se borra es de quien administra, lo que resolvió sigue valiendo, y
  el registro de quién resolvió esos pedidos DEBE dejar de nombrarla: dice "una cuenta borrada".

#### Medición

- **FR-035**: El producto DEBE registrar, sin datos que identifiquen a la persona ni nada de su
  cédula, estos momentos, cada uno con su disparador exacto:
  - **Oferta de nivel 2 vista**: «Mi perfil» muestra la oferta de FR-001.
  - **Pedido empezado**: la persona abre la pantalla de pedir y puede pedir (tiene nivel 1, no tiene
    un pedido abierto ni el tope).
  - **Consentimiento aceptado**: la persona acepta el consentimiento.
  - **Pedido enviado**: el pedido queda en revisión.
  - **Pedido retirado**, **Pedido vencido**, **Pedido aprobado**, **Pedido rechazado** (con el
    motivo): el pedido pasa a ese estado. Aprobado y rechazado llevan cuántas horas pasaron desde
    que se envió.
  - **Tope de intentos alcanzado**: una cuenta con el tope intenta empezar un pedido.
  Cada momento DEBE llevar desde dónde llegó la persona al pedido: por ahora, siempre su perfil;
  más adelante, una publicación que exige nivel 2. El pedido DEBE guardar ese origen mientras está
  abierto, para que los momentos de su cierre lo lleven. Los momentos de la persona llevan la marca
  de visita de la historia #9; los de quien administra y el vencimiento, no.
- **FR-035a**: Cada momento DEBE poder observarse al recorrer el flujo. Si uno no se dispara, es un
  defecto.

### Key Entities

- **Pedido de verificación de identidad**: de una cuenta; su estado (en revisión, aprobado,
  rechazado, retirado, vencido), el día en que se envió, desde dónde llegó la persona, y, mientras
  está en revisión, las dos imágenes. Como mucho uno en revisión por cuenta.
- **Imágenes del pedido**: la foto del frente de la cédula y la selfie. Existen solamente mientras
  el pedido está en revisión; las ve solamente quien administra.
- **Identidad verificada**: que la cuenta tuvo un pedido aprobado, y el día. Dura lo que la cuenta.
- **Rechazo**: el día y el motivo de un pedido rechazado. Dura 30 días.
- **Registro de resolución**: quién resolvió cada pedido. Lo ve solamente quien administra; dura
  hasta que se borra la cuenta de la persona.
- **Quien administra**: una marca en una cuenta, puesta por el equipo por fuera del sitio.
- **Teléfono verificado**, **número a medias**, **nivel 1**, **número perdido**: los de las
  historias #10 y #25, sin cambios.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona en nivel 1 con las dos fotos a mano envía su pedido desde «Mi perfil» en
  menos de 3 minutos y con no más de 6 toques además de sacar o elegir las fotos.
- **SC-002**: **0 imágenes** que existan después de que su pedido se aprobó, se rechazó o se
  retiró; ninguna más de una hora después de que su pedido venció; y ninguna de un envío cortado
  más de una hora después.
- **SC-003**: **0 lecturas** de una imagen, un pedido o la cola por alguien que no administra, por
  su dueña después de enviarla, o sin sesión: todos los intentos fallan.
- **SC-004**: **0 pedidos resueltos** por su propia dueña, resueltos dos veces, o resueltos después
  de retirarse, vencer o borrarse la cuenta.
- **SC-005**: **0 datos de la cédula guardados**: nada de lo que el producto guarda de un pedido
  cerrado contiene más que lo que enumera FR-031.
- **SC-006**: El 100 % de las veces que un pedido se resuelve o vence, la persona recibe un correo
  entregado al servicio de correo dentro del minuto siguiente a la resolución, o de la hora
  siguiente al vencimiento (o, si el servicio de correo falló, ve el resultado al entrar).
- **SC-007**: Una cuenta en nivel 2 que cambia de número vuelve a nivel 2 el 100 % de las veces al
  confirmar el nuevo, sin ningún pedido.
- **SC-008**: El 100 % de los caminos que no terminan en un pedido enviado —sin teléfono, pedido
  abierto, tope, foto no aceptada, envío cortado, sesión vencida— terminan en una pantalla que dice
  qué pasó y ofrece el paso siguiente. Nunca un "error" a secas.
- **SC-009**: Se puede calcular, con los momentos de FR-035, qué parte de quienes vieron la oferta
  empezaron, aceptaron, enviaron y quedaron aprobados, por origen, y cuántas horas tarda la revisión.
- **SC-010**: La pantalla de pedir muestra el consentimiento completo en menos de 2,5 segundos desde
  que se abre en un teléfono con datos móviles, con el perfil de red con el que se mide todo el
  producto y sin que el contenido salte de lugar.

## Assumptions

- **Ya construido** (de la etapa Ready): el nivel 1 en «Mi perfil» y la regla de quién está en nivel
  1 (historia #10); la puerta de publicar y solicitar, que se reutiliza para "primero va el
  teléfono"; el borrado de la cuenta y el envío de correos. La cascada del borrado a lo de esta
  historia y los correos nuevos son de esta spec.
- **Qué queda de un pedido vencido** (asunción 2026-09-26, tomada en la corrida, **a validar por
  Hernán**): la historia pide mostrar el estado "vencido" pero no dice cuánto se guarda. Se guarda
  solo que venció y el día, hasta que la persona empieza otro pedido o pasan 30 días, el mismo
  plazo que un rechazo; no cuenta para el tope. De un pedido retirado no queda nada: la persona ve
  la confirmación en el momento, que es lo que la historia pide.
- **Quién resolvió, para un rechazo de más de 30 días** (asunción 2026-09-26, tomada en la corrida):
  la decisión de Hernán (#37) guarda quién resolvió cada pedido hasta que se borra la cuenta, y el
  día y el motivo del rechazo solo 30 días. Se leen juntas: pasados los 30 días queda que ese
  pedido lo resolvió tal cuenta, sin día ni motivo.
- **El consentimiento no se guarda aparte** (asunción 2026-09-26): la aceptación es parte del pedido
  y se va con él; un pedido aprobado implica que se aceptó. No se agrega un registro de
  consentimientos: sería guardar más de lo que la historia nombra.
- **Correo de ayuda** (asunción 2026-09-26): una sola dirección de ayuda del sitio, configurada en
  un lugar; hasta que exista el dominio (`docs/04-nombre.md`), es la dirección del equipo. No se
  inventa un formulario de soporte.
- **Formatos** (asunción 2026-09-26): "los formatos comunes de foto" de la historia son los de la
  foto de perfil de la historia #9 (JPEG, PNG, WebP, AVIF). HEIC no, por la misma razón (KL-007): el
  teléfono lo convierte al subir desde el navegador.
- **La identidad verificada es de la cuenta** (asunción 2026-09-26, extendida desde la decisión de la
  historia sobre el cambio de teléfono): perder el número porque otra cuenta se quedó con él
  (historia #25) se trata igual que un cambio de número: al volver a verificar un teléfono, vuelve el
  nivel 2. La historia #25 dejó esto para esta historia.
- **El día que muestra el nivel 2** (asunción 2026-09-26): es el día en que se verificó la identidad,
  aunque el nivel se haya interrumpido después por un cambio de número. La sección del teléfono
  sigue mostrando su propio día.
- **"Desde qué día tiene cuenta"** (asunción 2026-09-26): es el día en que la persona completó su
  perfil, que es minutos después de crear la cuenta y la condición para poder pedir. Para quien
  administra, la diferencia no cambia ninguna decisión.
- **La cola, uno por uno** (asunción 2026-09-26): la lista de la cola no muestra imágenes; las
  imágenes se ven solo al abrir un pedido. Así se ven la menor cantidad de veces posible.
- **Qué datos del perfil ve quien administra** (asunción 2026-09-26): exactamente los que nombra la
  historia (nombre para mostrar, zona, desde cuándo tiene cuenta, rechazos). No la foto de perfil ni
  el teléfono: no hacen falta para decidir y la historia no los nombra.
- **La pantalla de quien administra se entera sola** (asunción 2026-09-26, tomada en la corrida): la
  decisión del 2026-09-26 dice "en ese momento"; se cuantifica en 30 segundos sin tocar nada, y en
  el acto si intenta resolver. Es la cota que un revisor humano no nota.
- **Tiempos del borrado automático** (asunción 2026-09-26, tomada en la corrida): el vencimiento es
  exacto para la cola y la persona (FR-028); el borrado de las imágenes y el correo pueden llegar
  hasta una hora después. Hasta que exista el proceso diario en la nube (M5), el sitio corre en
  local y el borrado automático depende de que la máquina esté prendida; el plan dice cómo y lo
  anota si queda un resto, como KL-016.
- **Una sola persona que administra** (asunción 2026-09-26): si es la única y tiene un pedido propio,
  vence a los 7 días. Se acepta: el equipo designa a más de una antes de la beta.
- **Revocar un nivel 2 ya dado** (asunción 2026-09-26): si después se descubre un fraude, sacarle el
  nivel a una cuenta es del panel de administración (`docs/03` §6: reportes, suspender), fuera de
  esta historia.
- **El origen del pedido** (asunción 2026-09-26): hoy el único origen es «Mi perfil»; la historia de
  la publicación que exige nivel 2 suma el suyo sin rehacer los momentos.
- **Medición sin herramienta** (decisión 2026-09-19, Hernán, historia #9): los momentos se disparan y
  se pueden probar, y se conectan a la herramienta en M5.
- **Decisiones del enjambre de la historia** (2026-09-25 y 2026-09-26, product-owner; 2026-09-25,
  Hernán, #37): se registran en `docs/03` §1 y §6 y en `docs/01` §Legal / datos, junto con esta spec.
- **Fuera de esta historia** (de la historia): un proveedor externo de verificación; leer el
  documento automáticamente; comparar la selfie con el documento automáticamente; documentos que no
  sean la cédula uruguaya; comparar el nombre para mostrar con el de la cédula; detectar que la
  misma cédula verificó otra cuenta; volver a verificar cada cierto tiempo; el distintivo en el
  perfil público (#12); el aval (nivel 3); exigir nivel 2 para solicitar (historia de la
  publicación); designar a quien administra desde el sitio; el panel de administración
  consolidado.
- **Idioma y hora**: español rioplatense con voseo; toda fecha, en hora de Uruguay.
- **Dependencias**: las historias #9, #10 y #25, cerradas; la decisión #37, cerrada.
