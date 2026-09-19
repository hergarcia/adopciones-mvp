# Feature Specification: Registro e ingreso sin contraseña con perfil básico

**Feature Branch**: `feature/9-registro-e-ingreso`

**Created**: 2026-09-19

**Status**: Draft

**Input**: Historia #9 del backlog, milestone `M1 - Cuentas y confianza`. El cuerpo verbatim está en `story.md`, en esta misma carpeta.

**Ya en `main`**: nada del alcance de esta historia. Hoy el producto no tiene cuentas, ni sesión, ni personas: solo la portada provisoria, la muestra de primitivas y las compuertas que dejó la historia #1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar con un enlace que llega al correo (Priority: P1)

Una persona que llega al sitio escribe su dirección de correo, recibe un enlace y al abrirlo queda
adentro. No inventa ninguna contraseña. Si ya tenía cuenta, el mismo enlace la hace ingresar en vez
de crear otra. Al volver otro día sigue adentro, sin repetir el trámite.

**Why this priority**: sin esto no hay nadie a quien verificar, mostrarle una solicitud ni avisarle
que su publicación vence. Es la única user story que no se puede sacar sin que la historia deje de
existir.

**Independent Test**: se prueba sola, de punta a punta, pidiendo un enlace con una dirección nueva
y abriéndolo: la persona queda adentro y hay una cuenta que antes no estaba. No necesita perfil, ni
Google, ni ninguna otra user story.

**Acceptance Scenarios**:

1. **Dado** que no tengo cuenta, **cuando** escribo mi correo y abro el enlace que me llega,
   **entonces** entro y el producto me pide completar nombre y zona.
2. **Dado** que ya tengo cuenta con ese correo, **cuando** pido el enlace y lo abro, **entonces**
   entro a la cuenta que ya tenía, con lo que había cargado, y no se crea otra.
3. **Dado** que ingresé, **cuando** cierro el navegador y vuelvo al día siguiente, **entonces**
   sigo adentro sin volver a pedir nada.
4. **Dado** que pedí el enlace dos veces, **cuando** abro el primero, **entonces** se me dice que
   ese ya no sirve y que use el último que me llegó, sin volver a escribir mi correo.
5. **Dado** que pasaron más de 60 minutos desde que pedí el enlace, **cuando** lo abro,
   **entonces** se me dice que venció y puedo pedir otro con un solo toque, sin reescribir nada.
6. **Dado** que ya entré con ese enlace, **cuando** lo vuelvo a abrir —lo reenvié, volví atrás en
   el navegador—, **entonces** se me dice que ese enlace ya se usó, y si sigo adentro me lleva a
   donde estaba.
7. **Dado** que desde este navegador pedí un enlace hace menos de 60 segundos, **cuando** pido
   otro, **entonces** se me dice cuántos segundos faltan y no se manda un segundo correo.
8. **Dado** que desde este navegador pedí 5 enlaces en la última hora, **cuando** pido el sexto,
   **entonces** se me dice que espere y en cuánto tiempo voy a poder volver a pedir.
9. **Dado** que escribo el correo de otra persona, **cuando** pido el enlace, **entonces** veo
   exactamente la misma pantalla y la misma espera que con cualquier dirección: no me entero de si
   esa dirección tiene cuenta ni de si pidió algo hace poco.
10. **Dado** que escribo una dirección mal formada, **cuando** pido el enlace, **entonces** veo en
   el mismo formulario qué está mal y no se manda ningún correo.
11. **Dado** que pedí el enlace y no llegó, **cuando** miro la pantalla de espera, **entonces** veo
    a qué dirección se mandó, que conviene revisar el correo no deseado y cómo pedir otro.
12. **Dado** que abro una pantalla que exige sesión sin haber ingresado, **cuando** carga,
    **entonces** se me pide ingresar y, al terminar, vuelvo exactamente a donde iba.

---

### User Story 2 - Completar el perfil para poder usar la cuenta (Priority: P1)

Recién entrada, la persona carga lo mínimo que la identifica: cómo se llama y en qué zona está.
Puede sumar una foto y decir si es rescatista o refugio. Hasta que no termine, el producto le
vuelve a pedir que lo complete.

**Why this priority**: una cuenta sin nombre ni zona no sirve para nada de lo que viene después
—ni para que otra persona sepa con quién habla, ni para buscar por cercanía—. Va junto con la P1
porque una cuenta a medias es una cuenta que no se puede usar.

**Independent Test**: se prueba con una cuenta recién creada: completar nombre y zona termina el
alta y deja ver el perfil con lo cargado.

**Acceptance Scenarios**:

1. **Dado** que entré por primera vez, **cuando** llego a completar el perfil, **entonces** se me
   piden nombre para mostrar, departamento y localidad como obligatorios, y foto y "soy
   rescatista o refugio" como opcionales.
2. **Dado** que estoy completando el perfil, **cuando** elijo un departamento, **entonces** al
   escribir la localidad veo sugerencias de ese departamento, y si la mía no está la
   escribo igual y se guarda.
3. **Dado** que completé nombre y zona y no venía de ningún lado, **cuando** termino, **entonces**
   veo mi perfil con lo que cargué; **y dado** que había abierto una pantalla privada antes de
   tener cuenta, **entonces** termino en esa pantalla, no en mi perfil.
4. **Dado** que dejo el nombre o la zona vacíos, **cuando** intento terminar, **entonces** veo cuál
   falta, el foco va a ese campo y no se guarda nada a medias.
5. **Dado** que dejé el perfil a medias y me fui, **cuando** vuelvo a entrar desde el mismo
   navegador, **entonces** se me pide completarlo antes de seguir, con lo que ya había escrito
   todavía cargado; **y dado** que vuelvo desde otro dispositivo, **entonces** se me pide
   completarlo igual, con el formulario en blanco.
6. **Dado** que subo una foto, **cuando** termino, **entonces** la veo en mi perfil; **y dado** que
   no subo ninguna, **entonces** en su lugar veo las iniciales de mi nombre.
7. **Dado** que la foto que elijo no es una imagen o pesa demasiado, **cuando** la subo,
   **entonces** se me dice qué pasó y puedo elegir otra sin perder lo demás del formulario.

---

### User Story 3 - Entrar con la cuenta de Google (Priority: P2)

Quien prefiere no esperar un correo entra con su cuenta de Google en dos toques. Si esa dirección
ya tenía cuenta en el producto, entra a la misma, no a una nueva.

**Why this priority**: acorta el paso que más gente pierde, pero el producto funciona entero sin
esto: quien no tenga Google entra por correo. Por eso va después de las P1.

**Independent Test**: se prueba sola entrando con Google desde una dirección nueva, y después
entrando por correo con esa misma dirección: es la misma cuenta las dos veces.

**Acceptance Scenarios**:

1. **Dado** que no tengo cuenta, **cuando** entro con Google, **entonces** se crea mi cuenta con
   esa dirección y se me pide completar nombre y zona.
2. **Dado** que ya tengo cuenta creada con mi correo, **cuando** entro con Google usando esa misma
   dirección, **entonces** entro a la misma cuenta, con lo que ya había cargado.
3. **Dado** que estoy en la pantalla de Google, **cuando** cancelo, **entonces** vuelvo al ingreso
   sin sesión, veo que no se hizo nada y puedo intentar por correo, sin una pantalla rota.
4. **Dado** que el ingreso con Google no está disponible, **cuando** abro la pantalla de ingreso,
   **entonces** no veo esa opción y el ingreso por correo funciona igual.
5. **Dado** que mi cuenta de Google tiene una dirección que Google no confirma como verificada,
   **cuando** intento entrar con ella, **entonces** no entro a ninguna cuenta, se me explica que
   no se pudo comprobar que esa dirección sea mía, y se me ofrece el enlace por correo.

---

### User Story 4 - Ver, editar y cerrar sesión (Priority: P2)

La persona encuentra su perfil, cambia lo que cargó cuando quiere y cierra sesión cuando termina.

**Why this priority**: sin editar, un nombre mal escrito o una mudanza quedan para siempre; sin
cerrar sesión, un teléfono prestado queda abierto. Igual, la cuenta ya sirve antes de esto.

**Independent Test**: se prueba con una cuenta ya completa: cambiar el nombre y la zona, ver el
cambio reflejado, cerrar sesión y confirmar que las pantallas privadas dejan de estar disponibles.

**Acceptance Scenarios**:

1. **Dado** que estoy adentro, **cuando** abro mi perfil, **entonces** veo nombre, foto,
   departamento, localidad, si soy rescatista o refugio, y mi correo; el correo se
   muestra como dato de la cuenta y no se puede editar.
2. **Dado** que estoy en mi perfil, **cuando** edito el nombre, la foto, el departamento, la
   localidad, o la marca de rescatista o refugio, y guardo, **entonces** veo el cambio
   aplicado y se me confirma que se guardó.
3. **Dado** que edité y no guardé, **cuando** salgo de la pantalla, **entonces** se me avisa que
   hay cambios sin guardar antes de perderlos.
4. **Dado** que guardo un cambio y algo falla —se cae la conexión, el guardado no llega—,
   **cuando** vuelvo a mirar la pantalla, **entonces** se me dice que no se guardó, lo que escribí
   sigue ahí y puedo reintentar sin volver a cargarlo.
5. **Dado** que estoy adentro, **cuando** cierro sesión, **entonces** vuelvo al sitio sin sesión y
   mis pantallas privadas dejan de estar disponibles.
6. **Dado** que cerré sesión, **cuando** vuelvo a abrir el sitio, **entonces** sigo sin sesión.

---

### User Story 5 - Borrar mi cuenta (Priority: P3)

Quien no quiere seguir se va y no queda nada suyo.

**Why this priority**: es una obligación con la persona y con la ley, pero es lo último que alguien
hace. El producto se puede mostrar sin esto; no se puede abrir al público sin esto.

**Independent Test**: se prueba con una cuenta completa: borrarla, confirmar que la sesión se cerró
y que entrar de nuevo con ese mismo correo da una cuenta vacía.

**Acceptance Scenarios**:

1. **Dado** que estoy en mi perfil, **cuando** elijo borrar mi cuenta, **entonces** se me explica
   qué se borra y que no se puede deshacer, y tengo que confirmarlo a propósito.
2. **Dado** que confirmé, **cuando** se borra, **entonces** se cierra mi sesión, se me avisa que
   está hecho y no queda ningún dato mío en el producto.
3. **Dado** que me arrepiento en la confirmación, **cuando** cancelo, **entonces** vuelvo a mi
   perfil con todo intacto.
4. **Dado** que borré mi cuenta y me registro de nuevo con el mismo correo, **cuando** entro,
   **entonces** es una cuenta nueva y vacía, sin nada de la anterior.

---

### Edge Cases

- **Dos pedidos de enlace, se abre el viejo**: el primero deja de servir cuando se pide el segundo.
  La pantalla lo dice y ofrece pedir uno nuevo sin reescribir el correo.
- **Enlace vencido**: pasados 60 minutos el enlace no entra. Se dice que venció, no que es
  inválido, y se ofrece pedir otro.
- **Enlace ya usado**: abrir el mismo enlace dos veces (reenvío, previsualización del cliente de
  correo, volver atrás en el navegador) entra una sola vez; la segunda dice que ya se usó.
- **Insistencia**: 1 pedido cada 60 segundos y 5 por hora para la misma dirección. Pasado el tope
  se dice cuánto falta, no simplemente "error".
- **Correo mal formado**: se detecta antes de mandar nada.
- **Misma dirección por los dos caminos**: correo y Google con la misma dirección son una sola
  cuenta, se haya empezado por donde se haya empezado.
- **Perfil a medias**: quien no terminó el perfil no llega a las pantallas de la app; se lo lleva a
  terminarlo. Lo escrito y no enviado vuelve solo en el mismo navegador; desde otro dispositivo el
  formulario arranca vacío. Un perfil inválido nunca se guarda.
- **Pantalla privada sin sesión**: se pide ingresar y, al terminar, se vuelve al destino original.
- **Destino de vuelta manipulado**: si el destino al que volver no es una pantalla de este
  producto, se ignora y se vuelve al inicio.
- **Sesión que expiró mientras la pantalla estaba abierta**: la acción siguiente pide ingresar de
  nuevo en lugar de fallar en silencio, y lo que la persona había escrito y no guardado sigue ahí
  cuando vuelve, igual que con el perfil a medias (FR-021). Volver a ingresar no es motivo para
  perder lo escrito.
- **Cuenta borrada con una sesión abierta en otro dispositivo**: esa otra sesión deja de servir.
- **La cuenta recién creada no puede publicar ni solicitar**: puede mirar el sitio, pero esas dos
  cosas exigen el teléfono verificado, que llega en otra historia.
- **Enlace pedido en un dispositivo y abierto en otro**: funciona; la sesión queda en el
  dispositivo donde se abrió. El destino al que volver se perdió con el otro dispositivo, así que
  la persona queda en su perfil.
- **Google con una dirección que el proveedor no confirma**: no entra a ninguna cuenta, ni crea
  una. Se explica y se ofrece el enlace por correo, que sí comprueba la dirección.
- **Destino original que sobrevive a completar el perfil**: quien abrió una pantalla privada sin
  cuenta llega a esa pantalla después de ingresar *y* completar el perfil, no a su perfil.
- **Localidad que no está en las sugerencias**: se escribe libre y se guarda tal cual.
- **El correo no se pudo mandar**: no se dice que se mandó. Se dice que no salió, se deja
  reintentar enseguida y ese intento no consume cupo.
- **Enlace que cae en más de un motivo a la vez**: gana el más útil, en el orden reemplazado → ya
  usado → vencido.
- **Persona con sesión que abre la pantalla de ingreso**: entra directo, no ve el formulario.
- **Persona con sesión que abre un enlace de otra dirección**: no se le cambia la cuenta en
  silencio; se le dice con cuál está adentro y que cierre sesión primero.
- **Enlace vivo de una cuenta que después se borró**: no sirve ni recrea nada.
- **Nombre o localidad con un teléfono, un correo o un enlace adentro**: se rechaza diciendo por
  qué; son los campos que la historia #12 vuelve públicos.
- **Nombre para mostrar con espacios de más o vacío en la práctica**: se rechaza como vacío.

## Pantallas

Cada pantalla de la historia, con su estado vacío, su estado mientras carga o guarda, y su estado
de error. Los tres se resuelven igual en todas: lo que falta se dibuja con la forma de lo que va a
venir, el error dice qué pasó y qué hacer, y nada se pierde de lo que la persona ya escribió.

| Pantalla | Vacío | Cargando / guardando | Error |
|---|---|---|---|
| **Ingreso** | No aplica: es un campo de correo y, si está disponible, la opción de Google. | Mientras se pide el enlace, la acción queda ocupada y no se puede pedir dos veces. | El correo mal formado se dice en el campo; el tope de pedidos dice cuánto falta. |
| **Revisá tu correo** | No aplica: siempre muestra a qué dirección se mandó. | La cuenta regresiva hasta poder pedir otro es visible desde que carga. | Si el nuevo pedido falla, se dice y la dirección sigue cargada. |
| **Completar perfil** | No aplica: es un formulario vacío por definición. | Al guardar, la acción queda ocupada y no admite un segundo envío. Mientras la foto se procesa, su lugar se ocupa con la forma y el tamaño definitivos; la vista previa aparece recién cuando el procesado termina, porque hay formatos de teléfono que el navegador no sabe mostrar tal como salen. | Cada campo dice qué le falta; si el guardado falla, se dice y no se pierde nada de lo escrito; si el procesado de la foto falla, se dice y se puede elegir otra. |
| **Mi perfil** | Sin foto se muestran las iniciales del nombre. | Mientras cargan los datos se dibuja la forma del perfil, no un indicador genérico. | Si no se pudieron traer los datos, se dice y se ofrece reintentar. |
| **Sugerencias de localidad** | Cuando ninguna coincide con lo escrito, la lista no se muestra y el texto tal cual se puede guardar. | Filtra mientras se escribe, sin pantalla de espera: las sugerencias ya están ahí. | No tiene error propio: no depende de nadie más. |
| **El enlace no sirve** | No aplica: siempre dice qué pasó con ese enlace. | No aplica: se resuelve al abrirla. | Es, en sí, la pantalla de error del enlace: dice cuál de los motivos fue y ofrece pedir otro en un toque, **sin mostrar la dirección** (ver FR-005b). |
| **Cuenta borrada** | No aplica: es el cierre del camino. | No aplica. | Confirma que se borró todo, sin sesión, y ofrece volver al sitio o crear una cuenta nueva. |
| **Editar mi perfil** | No aplica: siempre llega con lo que la persona tiene cargado. | Al guardar, la acción queda ocupada y no admite un segundo envío. | Cada campo dice qué le falta; si el guardado falla, se dice, se conserva todo lo escrito y se puede reintentar. |
| **Confirmar el borrado** | No aplica: es una confirmación. | Mientras borra, la confirmación queda ocupada y no admite un segundo pedido. | Si el borrado no se pudo completar, se dice que no se borró nada y se ofrece reintentar. Nunca se dice "listo" a medias. |

## Requirements *(mandatory)*

### Functional Requirements

#### Ingreso por correo

- **FR-001**: El producto DEBE permitir crear una cuenta e ingresar escribiendo únicamente una
  dirección de correo, sin ninguna contraseña en ningún momento.
- **FR-002**: El producto DEBE validar el formato de la dirección antes de mandar nada y explicar
  qué está mal cuando no sirve.
- **FR-003**: El producto DEBE mandar un enlace de un solo uso a esa dirección y mostrar una
  pantalla que diga a dónde se mandó, que conviene mirar el correo no deseado y cómo pedir otro.
- **FR-004**: El enlace DEBE vencer a los 60 minutos de emitido y DEBE dejar de servir apenas se
  usa una vez o apenas se pide uno nuevo para la misma dirección.
- **FR-004a**: El enlace DEBE funcionar en cualquier navegador y cualquier dispositivo, no solo en
  el que lo pidió: pedirlo en la computadora y abrirlo en el teléfono es el camino más común, y
  atarlo al navegador de origen lo rompería. Cuando se abre en otro dispositivo, la sesión queda
  abierta ahí, y el destino al que volver (FR-013) se pierde: en ese caso la persona DEBE quedar
  en su perfil, no en una pantalla vacía ni en un error.
- **FR-005**: El producto DEBE distinguir, en el mensaje que le muestra a la persona, los tres
  motivos por los que un enlace no entra —vencido, ya usado, reemplazado por uno más nuevo— y en
  los tres DEBE ofrecer pedir otro sin volver a escribir la dirección.
- **FR-005b**: La pantalla del enlace que no sirve NO DEBE mostrar la dirección a la que se mandó.
  Un enlace se abre por reenvío o desde un buzón compartido, así que quien la mira puede no ser su
  dueña. Pedir otro enlace desde ahí DEBE funcionar igual, en un toque y sin escribir nada: el
  producto ya sabe a qué dirección mandarlo, y no necesita decirlo en voz alta.
- **FR-005a**: Cuando un enlace cae en más de un motivo a la vez, DEBE ganar el más útil para la
  persona, en este orden: **reemplazado** (hay uno nuevo en su buzón, que es lo que tiene que
  hacer), después **ya usado** (puede que ya esté adentro), y por último **vencido**. La
  distinción DEBE conservarse mientras se conserve el registro del pedido (FR-030a); pasado ese
  plazo el producto DEBE decir que el enlace no sirve y ofrecer pedir otro, sin inventar un
  motivo.
- **FR-003a**: Si el correo no se pudo mandar —el servicio de envío falló—, el producto NO DEBE
  decir que se mandó. DEBE decir que no salió, que no es culpa de la persona, y dejar reintentar
  de inmediato: un intento fallido NO DEBE consumir cupo del límite de FR-006.
- **FR-006**: El producto DEBE frenar los pedidos de enlace con **dos topes distintos, que no se
  mezclan**:
  1. **El que se le cuenta a la persona, por dispositivo**: desde este navegador, 1 pedido cada 60
     segundos y 5 por hora (ventana móvil: 5 en los últimos 60 minutos, no 5 por reloj). La cuenta
     regresiva que se muestra sale **solo de los pedidos hechos desde este mismo navegador**, así
     que la información que se le da a la persona es información sobre sus propios actos.
  2. **El que nunca se le cuenta a nadie, por dirección**: como mucho 10 correos por hora a la
     misma dirección, para que nadie le llene el buzón a otro. Al pasarse, el correo simplemente
     no sale y la pantalla es exactamente la misma de siempre.
- **FR-006a**: La respuesta a un pedido de enlace DEBE ser indistinguible entre una dirección que
  ya tiene cuenta y una que no, y entre una dirección que pidió un enlace recién y una que no:
  mismo mensaje, misma pantalla, y la misma cuenta regresiva, que depende del navegador y no de la
  dirección. Escribir el correo de otra persona NO DEBE revelar absolutamente nada sobre ella. El
  producto se entera de cuál de los dos casos es recién cuando alguien abre el enlace, que es
  cuando demostró ser la dueña. **Por eso el tope por dirección de FR-006 es silencioso**: decir
  "faltan 45 segundos" para una dirección ajena sería el oráculo que esta regla prohíbe.
- **FR-006c**: El tope por dirección NO DEBE poder usarse para dejar a alguien afuera. Por eso es
  alto (10 por hora, contra los 5 por dispositivo que una persona real sí puede alcanzar), por eso
  solo frena correos nuevos y nunca invalida un enlace ya emitido, y por eso se suelta solo en una
  hora. El caso residual —alguien gasta el cupo de una dirección ajena y su dueña no recibe el
  correo durante un rato— queda **aceptado a propósito**: el daño es una espera acotada, y la
  alternativa, explicarle a quien pide por qué no salió, es exactamente la filtración que FR-006a
  impide. La dueña no queda bloqueada: su sesión abierta sigue valiendo y su último enlace válido
  también.
- **FR-007**: Si la dirección ya tiene cuenta, el enlace DEBE hacer ingresar a esa cuenta; nunca
  DEBE crear una segunda cuenta para la misma dirección.
- **FR-007a**: El correo con el enlace es el único mensaje que el producto manda, y transporta una
  credencial. DEBE decir de qué sitio viene, que el enlace sirve una sola vez y vence en 60
  minutos, que no se comparte con nadie, y qué hacer si no lo pidió: ignorarlo, porque sin abrirlo
  no pasa nada. Su texto DEBE vivir junto al resto de los textos del producto, traducible desde el
  primer día.
- **FR-007b**: Un enlace emitido para una cuenta que después se borró NO DEBE servir: no DEBE
  recrear la cuenta ni hacer entrar a nadie. DEBE decir que el enlace ya no sirve y ofrecer crear
  una cuenta nueva.
- **FR-007c**: Quien **ya tiene sesión** y abre un enlace de **su misma** dirección DEBE seguir
  adentro, sin cambiar nada; si el enlace es de **otra** dirección, el producto NO DEBE cambiarle
  la cuenta en silencio: DEBE decir con qué cuenta está adentro y pedirle que cierre sesión antes
  de entrar con otra. Ese enlace NO DEBE consumirse: su dueña no tiene por qué perder un enlace que
  nunca usó por culpa de que alguien más lo abrió. Quien ya tiene sesión y abre la pantalla de ingreso DEBE ser llevado adentro,
  no a un formulario que no necesita.

#### Ingreso con Google

- **FR-008**: El producto DEBE permitir crear la cuenta e ingresar con una cuenta de Google.
- **FR-009**: El ingreso con Google y el ingreso por correo para la misma dirección DEBEN resolver
  a la misma cuenta, sin importar cuál se usó primero, **siempre que Google confirme que esa
  dirección está verificada**.
- **FR-009a**: Si Google entrega una dirección que no confirma como verificada, el producto NO
  DEBE hacer ingresar a ninguna cuenta existente con esa dirección ni crear una nueva: DEBE
  explicar que no se pudo comprobar que la dirección sea de quien ingresa y ofrecer el enlace por
  correo, que sí lo comprueba. Sin esta regla, una cuenta de Google con una dirección ajena sin
  confirmar entraría a la cuenta de otra persona y vería su correo y su perfil.
- **FR-010**: Si la persona cancela o falla el ingreso con Google, el producto DEBE devolverla al
  ingreso sin sesión, con un mensaje que lo explique y el camino por correo disponible.
- **FR-011**: Cuando el ingreso con Google **no está configurado** en esa instalación, el producto
  DEBE ocultar esa opción y seguir funcionando entero con el ingreso por correo. Una **caída
  momentánea** de Google es otra cosa: la opción se sigue mostrando y lo que ocurre es lo de
  FR-010, un mensaje que lo explica y el camino por correo a mano. El producto NO DEBE esconder el
  botón por un error pasajero, porque quien ya lo vio una vez creería que desapareció.

#### Sesión

- **FR-012**: La sesión DEBE sobrevivir al cierre del navegador y DEBE durar 30 días desde el
  último uso: un navegador que no vuelve en 30 días DEBE quedarse sin sesión.
- **FR-013**: Toda pantalla que muestre o edite datos de una persona DEBE exigir sesión; sin
  sesión, DEBE pedir ingresar y, al terminar, DEBE volver al destino original.
- **FR-014**: El producto DEBE ignorar un destino de vuelta que no pertenezca a **este sitio** y
  llevar al inicio en ese caso. Acá "de este sitio" quiere decir cualquier pantalla del producto,
  pública o privada; lo que se descarta es un destino que apunte afuera.
- **FR-014a**: Quien ingresa sin ningún destino pendiente y ya tiene el perfil completo DEBE
  aterrizar en su perfil, que hoy es la única pantalla con sesión que existe.
- **FR-015**: El producto DEBE permitir cerrar sesión, y después de cerrarla las pantallas privadas
  DEBEN dejar de estar disponibles.
- **FR-015a**: **Las pantallas tienen que poder alcanzarse.** Desde cualquier pantalla del sitio,
  sin sesión DEBE verse cómo entrar, y con sesión DEBE verse cómo llegar a «Mi perfil», que es de
  donde cuelgan editar, cerrar sesión y borrar la cuenta. Sin esto, quien vuelve al día siguiente
  con la sesión viva aterriza en el sitio público y no tiene ningún camino hacia sus propias
  acciones.

#### Perfil

- **FR-016**: Antes de poder usar las pantallas de la app, la persona DEBE completar nombre para
  mostrar, departamento y localidad.
- **FR-016b**: La pantalla de completar el perfil NO DEBE ser una trampa: desde ahí la persona
  DEBE poder **cerrar sesión** y **borrar su cuenta**, aunque todavía no tenga perfil. Quien se
  arrepiente en el medio del alta ya tiene su dirección guardada y tiene que poder retirarla sin
  pedirle permiso a nadie (Ley 18.331). Son las dos únicas acciones que la compuerta de FR-016
  DEBE dejar pasar.
- **FR-016a**: Completar el perfil NO DEBE hacer perder el destino al que la persona iba. Cuando
  alguien sin cuenta abre una pantalla privada, ingresa y completa el perfil, al terminar DEBE
  llegar a esa pantalla, no a su perfil. Solo cuando no había un destino —entró por la puerta del
  frente— termina en su perfil.
- **FR-017**: El producto DEBE ofrecer foto y "soy rescatista o refugio" como opcionales, y DEBE
  dejar terminar el alta sin ellos.
- **FR-017b**: "Soy rescatista o refugio" DEBE ser **una sola marca de sí o no**, no una elección
  entre rescatista y refugio: `docs/03` §1 decide "sin roles complejos de organización", y la
  diferencia entre una persona que rescata y una organización con lugar físico todavía no cambia
  nada de lo que el producto hace. Quien no la marca es simplemente alguien que quiere adoptar.
- **FR-017a**: **Un solo nombre para cada cosa.** La **zona** de una persona son dos datos: el
  **departamento** y la **localidad**. "Localidad" es el concepto; en Montevideo, donde la ciudad
  es una sola localidad y lo que la gente dice es el barrio, la pantalla DEBE llamar **"Barrio"**
  a ese mismo campo, y **"Localidad"** en los otros 18 departamentos. El producto NO DEBE usar
  "localidad o barrio" como etiqueta ni mezclar los tres términos en la misma pantalla.
- **FR-018**: El departamento DEBE elegirse de una lista cerrada con los 19 departamentos de
  Uruguay; no DEBE poder escribirse libre.
- **FR-019**: La localidad DEBE escribirse libre, y mientras se escribe el producto DEBE
  sugerir las de ese departamento; una localidad que no esté en las sugerencias DEBE poder
  guardarse igual.
- **FR-019a**: Las sugerencias DEBEN viajar con el producto y filtrarse mientras se escribe, sin
  esperar a nadie: no DEBE haber estado de carga ni de error en esa lista. Cuando ninguna
  sugerencia coincide, la lista NO DEBE mostrarse y lo escrito DEBE poder guardarse tal cual.
- **FR-020**: El producto DEBE rechazar un nombre para mostrar vacío o compuesto solo de espacios,
  y DEBE decir cuál campo falta sin perder lo ya escrito.
- **FR-020a**: El nombre para mostrar DEBE tener entre 2 y 60 caracteres, y la localidad hasta 60.
  Los dos DEBEN guardarse sin espacios sobrantes al principio, al final ni repetidos en el medio.
  El límite existe para que un nombre no rompa ninguna pantalla donde después se muestre, y se
  avisa mientras se escribe, no recién al guardar.
- **FR-020b**: Ni el nombre para mostrar ni la localidad DEBEN aceptar una vía de contacto. Son
  los dos campos que la historia #12 vuelve públicos, y el contacto fuera de una solicitud
  aceptada es justamente lo que este producto no hace (constitución §V). Para que el rechazo pueda
  explicarse, "vía de contacto" DEBE estar definido de forma estrecha y literal, y son solo estas
  tres: una **arroba** entre dos palabras; una **dirección web** escrita como tal (`www.`,
  `http://`, `https://`, o algo terminado en `.com`, `.uy`, `.net`, `.org`); y **nueve o más
  dígitos seguidos**, con espacios, puntos o guiones en el medio. Nada más se rechaza: "Villa 25
  de Agosto" y "Ruta 8 km 25" pasan, porque no tienen nueve dígitos seguidos. El mensaje DEBE
  nombrar cuál de las tres encontró.
- **FR-021**: Un perfil incompleto NO DEBE guardarse a medias: lo que queda registrado es que la
  cuenta existe y que su perfil está sin terminar, nada más. Lo que la persona alcanzó a escribir
  y no envió DEBE sobrevivir en ese mismo navegador, para que al volver no tenga que reescribirlo;
  desde otro dispositivo el formulario arranca vacío, y en los dos casos se le vuelve a pedir que
  lo complete. Así no se guarda un perfil inválido y tampoco se castiga a quien se fue a buscar el
  correo y volvió.
- **FR-022**: El producto DEBE permitir ver y editar el nombre para mostrar, la foto, el
  departamento, la localidad y la marca de rescatista o refugio, y DEBE confirmar cada
  guardado.
- **FR-022c**: La dirección de correo NO DEBE poder editarse: se muestra como dato de la cuenta,
  sin acción de cambiarla. Es la credencial de ingreso, y cambiarla sin volver a verificarla
  permitiría apropiarse de la cuenta de otra dirección o perder la propia. Cambiar de dirección
  queda fuera de esta historia (§Assumptions).
- **FR-022a**: Mientras un guardado del perfil está en curso, la acción DEBE quedar ocupada y NO
  DEBE admitir un segundo envío del mismo formulario.
- **FR-022b**: Si un guardado falla por algo que no es la validación —se cortó la conexión, no
  llegó—, el producto DEBE decirlo, DEBE conservar todo lo que la persona escribió y DEBE dejar
  reintentar sin volver a cargarlo.
- **FR-023**: El producto DEBE avisar antes de perder cambios sin guardar del perfil.
- **FR-024**: Sin foto, el producto DEBE mostrar las iniciales del nombre en su lugar.
- **FR-024a**: Mientras la foto se procesa o carga, el producto DEBE ocupar su lugar con la forma
  y el tamaño que va a tener, nunca con un indicador genérico ni con un salto del contenido. La
  vista previa DEBE mostrarse recién cuando el procesado terminó: hay formatos que los teléfonos
  producen y los navegadores no saben dibujar sin convertir, y prometer una vista previa inmediata
  dejaría un hueco permanente justo en esos casos.
- **FR-024b**: El producto DEBE permitir **quitar** la foto, no solo reemplazarla, y al quitarla
  DEBE volver a las iniciales y borrar el archivo. Es un dato personal de la persona y tiene que
  poder retirarlo sin borrar la cuenta entera.
- **FR-025**: El producto DEBE aceptar como foto únicamente imágenes JPEG, PNG, WebP o AVIF de
  hasta 10 MB, y DEBE rechazar lo demás explicando qué pasó, sin perder el resto del formulario.
  HEIC **no** está en la lista: el navegador no lo sabe abrir fuera de Safari, y los teléfonos que
  lo producen lo convierten a JPEG al subir una foto desde el navegador, así que aceptarlo sería
  prometer algo que fallaría en Android y en la computadora.
- **FR-025a**: Si la foto es de un tipo y un tamaño aceptados pero **el procesado falla igual** —el
  archivo está dañado, el navegador no puede con ese formato—, el producto DEBE decirlo con
  claridad, DEBE dejar elegir otra foto, y DEBE permitir terminar el perfil sin foto. Una foto que
  no se pudo procesar NO DEBE bloquear el alta ni dejar un hueco sin explicación.

#### Privacidad y baja

- **FR-026**: La dirección de correo NUNCA DEBE mostrarse a otra persona que use el producto: la ve
  únicamente su dueña dentro del producto.
- **FR-026a**: En esta historia, **ningún** dato del perfil —nombre, foto, departamento, localidad
  o barrio, y la marca de rescatista o refugio— DEBE ser visible para otra persona que use el
  producto. Los ve solamente su dueña. El perfil pasa a ser público, con sus distintivos, en la
  historia que construye el perfil público y los niveles de verificación (#12); hasta entonces no
  existe ninguna pantalla que muestre el perfil de otra persona.
- **FR-026b**: En esta historia **nadie dentro del producto** tiene una vista de los datos de otra
  persona: no se construye ningún panel ni pantalla de administración —eso es `docs/03` §6—. El
  acceso de quien administra el sitio existe solamente por fuera, con permisos de servicio, para
  atender un caso puntual: soporte, abuso o un pedido de la propia persona.
- **FR-026c**: La foto de perfil DEBE seguir exactamente la misma regla que el resto del perfil:
  solo su dueña puede abrirla. NO DEBE quedar accesible con una dirección adivinable ni para quien
  no tenga sesión. La foto es la cara de la persona, es el dato más fácil de filtrar sin darse
  cuenta, y acá todavía no hay ninguna solicitud aceptada que justifique mostrarla.
- **FR-026d**: Cada una de las reglas de FR-026 a FR-026c DEBE poder demostrarse con un intento
  fallido de lectura: alguien sin sesión y alguien con la sesión de otra persona intentan leer el
  perfil ajeno, su correo y su foto, y no lo consiguen.
- **FR-027**: El producto DEBE permitir borrar la cuenta desde el perfil, con una confirmación
  explícita que diga qué se borra y que no se puede deshacer.
- **FR-028**: Borrar la cuenta DEBE eliminar todos los datos personales de esa persona y cerrar sus
  sesiones, incluidas las de otros dispositivos.
- **FR-028a**: El producto NUNCA DEBE decir que la cuenta se borró mientras quede algún dato de
  la persona. Si el borrado se interrumpe a mitad, DEBE decir que no terminó y ofrecer reintentar,
  y **el reintento DEBE retomar donde quedó y llegar hasta el final**: perfil, foto, sesiones y
  todo rastro de sus pedidos de enlace. Lo que se le promete a la persona es que "listo" significa
  que no queda nada, y que insistir siempre termina el trabajo.
- **FR-028b**: Mientras el borrado está en curso, la confirmación DEBE quedar ocupada y NO DEBE
  admitir un segundo pedido.
- **FR-028c**: Terminado el borrado, la persona DEBE quedar en una pantalla sin sesión que le
  confirme que no queda nada suyo y le ofrezca dos caminos: volver al sitio o crear una cuenta
  nueva. NO DEBE quedar en una pantalla privada que ya no le corresponde ni en un error.
- **FR-029**: Después de borrar, registrarse otra vez con la misma dirección DEBE dar una cuenta
  nueva y vacía.
- **FR-027a**: Al completar el perfil, la persona DEBE leer, en la misma pantalla y antes de
  guardar, las dos mitades de la verdad: que **su correo no se le muestra nunca a nadie**, y que
  **el nombre, la foto y la zona van a ser visibles para otras personas** cuando exista el perfil
  público. Decir solo lo primero la haría cargar su cara y su barrio creyendo que son privados.
  DEBE ser una frase visible, no un enlace ni una casilla obligatoria: un consentimiento con tilde
  suma fricción en el paso que más gente pierde, y lo que hace falta acá es que la persona esté
  informada, no que firme.
- **FR-030**: El producto NO DEBE guardar ningún dato de la persona que esta historia no nombra.
- **FR-030a**: Para poder cumplir FR-006 y FR-032, el producto DEBE conservar dos cosas más, y
  solo estas: el registro de los pedidos de enlace de una dirección, que DEBE borrarse a los 7
  días y también al borrarse la cuenta; y los eventos de medición de FR-032.
- **FR-030c**: Los eventos de medición NO DEBEN llevar la dirección, el nombre, ni ningún
  identificador de la persona ni de su cuenta. Para poder ver en qué escalón se pierde la gente
  alcanza con encadenar los eventos de **una misma visita**, con una marca que nace al abrir el
  sitio, muere con el navegador y nunca se guarda junto a la cuenta. Por eso los eventos
  sobreviven al borrado sin contradecir SC-007: no hay forma de volver desde un evento a la
  persona que lo produjo, ni antes ni después de que se borre.
- **FR-030b**: Entrar con Google NO DEBE guardar nada que venga de Google más allá de la dirección
  verificada: ni la foto ni el nombre se importan. El nombre que Google entrega SÍ PUEDE venir
  escrito en el formulario de perfil como sugerencia, y se guarda recién si la persona lo confirma
  al terminar.

#### Permisos

- **FR-031**: Una cuenta recién creada DEBE poder mirar el sitio. Publicar y solicitar no existen
  todavía, así que lo que esta historia tiene que cumplir es **no construirlos ni construir su
  compuerta**: NO DEBE aparecer un sistema de permisos, ni de roles, ni la exigencia de teléfono
  verificado, que son de las historias #10 y siguientes. Lo único que esta historia deja listo es
  que exista una persona a la que esas historias puedan pedirle algo.

#### Medición

- **FR-032**: El producto DEBE registrar, sin datos que identifiquen a la persona, siete momentos,
  cada uno con su disparador exacto, y **ningún par de ellos DEBE dispararse siempre en el mismo
  instante**: dos nombres para un mismo hecho no miden nada.

  | Evento | Se registra cuando |
  |---|---|
  | Creación de cuenta empezada | nace una cuenta que antes no existía: se abre un enlace de una dirección sin cuenta, o se vuelve de Google con una dirección verificada sin cuenta. **No** cuando alguien que ya tiene cuenta vuelve a entrar |
  | Creación de cuenta terminada | esa cuenta guarda su perfil y queda completa. Es el cierre del embudo que abre el evento anterior |
  | Ingreso por enlace | se abre un enlace válido de una cuenta que ya existía |
  | Ingreso por Google | se vuelve de Google con una dirección verificada de una cuenta que ya existía |
  | Perfil editado | se guarda un cambio en un perfil que ya estaba completo. Es otra cosa que "terminada": mide que la gente vuelva, no que se dé de alta |
  | Sesión cerrada | la persona cierra sesión a propósito, no cuando vence |
  | Cuenta borrada | el borrado terminó |

- **FR-032a**: Cada uno de esos siete eventos DEBE poder observarse al recorrer el flujo: si un
  evento no se dispara, es un defecto, no un detalle pendiente. Es la única forma de saber después
  en qué escalón se pierde la gente, que es la pregunta que este producto existe para responder.

### Key Entities

- **Persona con cuenta**: quien usa el producto. La identifica su dirección de correo, que es única
  y privada. Tiene nombre para mostrar, zona (departamento y localidad), foto opcional y
  una marca de si es rescatista o refugio. Su perfil está completo o no lo está, según tenga
  nombre y zona. Se borra entera a
  pedido.
- **Enlace de ingreso**: el permiso de un solo uso que viaja al correo. Pertenece a una dirección,
  nace, vence a los 60 minutos y muere al usarse o al ser reemplazado por uno nuevo.
- **Sesión**: el hecho de que una persona esté adentro en un dispositivo. Dura 30 días desde el
  último uso y termina al cerrar sesión o al borrar la cuenta.
- **Departamento**: uno de los 19 de Uruguay. Lista fija, no la edita nadie desde el producto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde que abre el sitio, una persona sin cuenta llega a tener el perfil completo en
  **4 pasos**: escribir su correo, abrir el enlace, completar nombre y zona, y guardar. Ninguno de
  esos pasos pide un dato que la historia no nombra, y ninguno exige leer nada fuera de la propia
  pantalla. El tiempo total depende de cuánto tarde el correo, que no es del producto; lo que el
  producto controla —y lo que se mide— es que no haya un quinto paso.
- **SC-002**: Crear la cuenta e ingresar no exige inventar, recordar ni escribir ninguna contraseña
  en ningún paso.
- **SC-003**: El 100 % de los intentos de entrar con un enlace que no sirve termina en una
  pantalla que explica qué pasó y ofrece la salida en un toque. Mientras el pedido siga registrado
  (FR-030a) el motivo es exacto —reemplazado, ya usado o vencido—; pasado ese plazo, o si la
  cuenta fue borrada (FR-007b), el mensaje es el general que corresponde a ese caso. Nunca es un
  "enlace inválido" a secas ni una pantalla sin salida.
- **SC-004**: Dos caminos de ingreso (correo y Google) con la misma dirección dan siempre una sola
  cuenta: 0 cuentas duplicadas por dirección. Y 0 ingresos a una cuenta existente con una
  dirección que el proveedor no confirmó como verificada.
- **SC-005**: Ningún dato de una persona —correo, nombre, foto, departamento, localidad,
  la marca de rescatista o refugio— llega a otra persona. Se verifica intentando leer cada uno de
  esos datos, y abrir la foto, desde una cuenta ajena y sin sesión: los dos intentos fallan en los
  seis datos.
- **SC-006**: Quien vuelve dentro de los 30 días llega a sus pantallas privadas sin volver a
  ingresar.
- **SC-007**: Después de borrar la cuenta, no queda ningún dato de esa persona, y registrarse de
  nuevo con la misma dirección da una cuenta vacía.
- **SC-008**: Toda pantalla privada abierta sin sesión lleva a ingresar y devuelve al destino
  original al terminar, en el 100 % de los destinos propios del producto.
- **SC-009**: En un teléfono con datos móviles, la pantalla de ingreso muestra su contenido y
  acepta que se escriba el correo en menos de 2,5 segundos desde que se abre, sin que el contenido
  salte de lugar mientras carga.

## Assumptions

- **Números del enlace** (decisión 2026-09-19, Hernán): vence a los 60 minutos, 1 pedido cada 60
  segundos y 5 por hora para la misma dirección. Se eligió por sobre 15 minutos porque el correo
  que tarda es más común que el buzón comprometido en este producto.
- **Zona** (decisión 2026-09-19, Hernán): departamento de lista cerrada de 19 y un segundo campo,
  la localidad, de texto libre con sugerencias filtradas por departamento. Se llegó acá después de
  comprobar que **no existe ninguna API de barrios de Uruguay confiable** y que el mercado no usa
  ninguna: MercadoLibre mantiene su propia lista con duplicados y acentos rotos, Gallito e
  InfoCasas cada uno la suya, y "barrio" es concepto oficial solo en Montevideo. Las sugerencias
  salen de las localidades oficiales de todo el país y, para Montevideo, de los barrios oficiales,
  porque en la lista nacional Montevideo es una sola localidad y sin los barrios la mitad del
  padrón quedaría sin zona utilizable. Las sugerencias **no se le piden a nadie de afuera mientras
  la persona se está dando de alta**: aparecen al instante, y si un servicio ajeno se cae, el alta
  sigue funcionando. Es el paso del funnel donde más gente se pierde.
- **La lista de localidades, en detalle** (asunción 2026-09-19): se arma una sola vez a partir de
  datos públicos oficiales, queda registrada con su fuente y su fecha, y cambia solo cuando alguien
  la cambia a propósito; no se actualiza sola. Si a un departamento le falta una localidad, no pasa nada: el campo es texto
  libre y lo escrito se guarda igual (FR-019). Las sugerencias son una ayuda para escribir, nunca
  una restricción, así que una lista incompleta o desactualizada no bloquea a nadie.
- **Nombre del término** (asunción 2026-09-19): el concepto es **localidad**, y la pantalla lo
  llama "Barrio" en Montevideo y "Localidad" en el resto (FR-017a). La historia y `docs/03` dicen
  "barrio"; usar un solo término evita tres nombres para lo mismo, y la etiqueta variable evita
  pedirle la "localidad" a alguien de Pocitos. **Pide una entrada nueva en el glosario de
  `docs/06-i18n.md` y un ajuste de una línea en `docs/03` — va en este mismo PR.**
- **Google** (decisión 2026-09-19, Hernán): se construye en esta historia, y la opción se le
  muestra a la persona solo donde el ingreso con Google esté habilitado. Donde no lo esté —por
  ejemplo mientras Hernán todavía no cargó sus credenciales—, la pantalla de ingreso muestra
  únicamente el correo y todo lo demás funciona igual. No es lo mismo que una caída momentánea de
  Google, que se trata como un error y no esconde nada (FR-011).
- **Duración de la sesión** (asunción 2026-09-19, tomada en la corrida, sin preguntar): 30 días
  desde el último uso. La historia pide "vuelvo al día siguiente y sigo adentro" sin dar un número;
  30 días es el equilibrio habitual entre no molestar y no dejar un teléfono prestado abierto para
  siempre. **A validar por Hernán en el build local.**
- **Foto: tipos y tamaño** (asunción 2026-09-19, tomada en la corrida, sin preguntar): se aceptan
  JPEG, PNG, WebP y AVIF de hasta 10 MB antes de procesar. La historia no da número ni formatos, y
  sin tope el formulario se puede colgar. HEIC quedó afuera al revisar el plan: es lo que sale de
  un iPhone, pero el navegador no lo puede abrir salvo en Safari, y el propio teléfono lo convierte
  a JPEG al subirlo desde el navegador, así que en la práctica no se pierde ninguna foto. **A validar por Hernán en el build local.**
- **Cuenta borrada y vuelta a registrar** (asunción 2026-09-19): la dirección queda libre de
  inmediato, sin período de gracia ni posibilidad de recuperar. Es lo que pide textualmente el
  criterio de aceptación de la historia, así que no se consultó.
- **Perfil a medias** (asunción 2026-09-19, tomada en la corrida): la historia pide las dos cosas a
  la vez —"no se guarda nada a medias" y "vuelvo y está lo que escribí"—, que solo conviven si lo
  no enviado vive en el navegador y no en el producto. Se resolvió así: la cuenta queda marcada
  como incompleta, el texto sin enviar sobrevive en ese navegador, y desde otro dispositivo el
  formulario arranca vacío. **A validar por Hernán en el build local.**
- **Aviso de datos** (decisión 2026-09-19, Hernán): una frase visible antes de guardar el perfil,
  sin casilla obligatoria. Dice qué se guarda, que el correo no se muestra nunca y que nombre,
  foto y zona van a ser públicos cuando exista el perfil público (FR-027a). Se eligió por sobre la
  casilla porque la persona queda igual de informada y no se suma un toque en el paso que más
  gente pierde; la política de privacidad escrita es trabajo de M5.
- **El correo del enlace** (decisión 2026-09-19, Hernán): lo manda el producto, no el servicio de
  autenticación, para que su texto viva con el resto de los textos y sea traducible desde el
  primer día, como manda `docs/06`. Sin dominio propio todavía (`docs/04`), en desarrollo y en las
  pruebas el correo se entrega al buzón local de siempre; el envío real se enciende cuando exista
  el dominio. El mismo texto se usa en los dos casos.
- **Medición** (decisión 2026-09-19, Hernán): los siete eventos de FR-032 se disparan desde ahora y
  se pueden probar, pero todavía no se mandan a ninguna herramienta: la herramienta se conecta
  cuando exista el proyecto en la nube (M5), sin tocar ninguna pantalla. Así el presupuesto de
  peso de la primera pantalla no se toca hoy y no hay que volver a recorrer el flujo después.
- **Idioma**: todo en español rioplatense con voseo, como el resto del producto. Sin selector de
  idioma.
- **Presupuesto de performance**: estas pantallas están dentro del presupuesto general del producto
  y no piden nada aparte. Los números y su forma de medirlos viven en la constitución §VII y en
  `docs/07-stack.md`, no acá: SC-009 dice el resultado que la persona percibe, y la compuerta lo
  mide.
- **Fuera de esta historia, por decisión de la historia**, y dónde se retoma cada cosa:

  | Queda afuera | Dónde se retoma |
  |---|---|
  | Verificación de teléfono | Historia #10, «Verificación de teléfono para poder publicar y solicitar» |
  | Verificación de identidad | Historia #11, «Verificación de identidad con revisión manual» |
  | El perfil visible para otras personas y sus distintivos | Historia #12, «Aval entre personas y perfil público con niveles de verificación» |
  | Publicar animales y solicitar adopciones | M2, todavía sin historia escrita |
  | Contraseñas | No se retoma: la historia las descarta a propósito y `docs/03` §1 decide "sin contraseñas" |
  | Ingresar con Facebook o Apple | No planificado. Si alguna vez se quiere, va a `docs/05-ideas-futuras.md` |
  | Recuperar una cuenta cuyo correo ya no se controla | No planificado, y hoy no hay forma: sin otro dato verificado no se puede distinguir a la dueña de alguien que dice serlo. Se puede reabrir cuando exista el teléfono verificado (#10) |
  | Cambiar la dirección de correo de una cuenta existente | No planificado. Por ahora se borra la cuenta y se crea otra |
- **Dependencia**: la historia #1 (scaffold y compuertas) está cerrada; esta historia es la primera
  que trae personas al producto.
