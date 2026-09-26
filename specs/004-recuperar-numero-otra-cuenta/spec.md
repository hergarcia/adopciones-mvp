# Feature Specification: Recuperar un número verificado en otra cuenta

**Feature Branch**: `feature/25-recuperar-numero-otra-cuenta`

**Created**: 2026-09-25

**Status**: Draft

**Input**: Historia #25 del backlog, milestone «M1 - Cuentas y confianza». El cuerpo verbatim de la
historia acompaña a esta spec.

**Ya construido** (historia #10): la pantalla «Ese número está en otra cuenta», que aparece al
escribir bien el código de un número verificado en otra cuenta, con un solo camino, «Verificar
otro número», y un texto que explica cómo entrar con la otra cuenta o borrarla. La espera de 60
segundos y el tope de 5 códigos por cuenta en 24 horas. El momento «Número en uso» de la medición,
que es el denominador de esta historia. Esta spec no rehace nada de eso: suma los otros dos
caminos, reemplaza el texto explicativo por esos caminos, y agrega lo que le pasa a la cuenta
anterior.

**Vocabulario de esta spec**: la **cuenta nueva** es la que escribe el código y quiere quedarse con
el número; la **cuenta anterior** es la que lo tiene verificado. **Quedarse con el número** es
el camino «Es mío y no puedo entrar a esa cuenta» terminado con la confirmación. La **prueba** es
haber escrito bien, en la cuenta nueva, el código mandado a ese número: vale hasta que ese código
habría vencido, 10 minutos desde que se mandó, salvo que antes se la deje sin efecto (FR-005). Una
prueba **vigente** es una que todavía vale. El **aviso de número perdido** es lo que la cuenta
anterior ve en «Mi perfil». Todo lo demás (número a medias, nivel 1, la puerta, el aviso de la
puerta, la espera, el tope diario, el techo del sitio, hora de Uruguay) significa lo mismo que en
la spec de la historia #10.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quedarse con un número que figura en otra cuenta (Priority: P1)

Una persona escribe bien el código de su celular y se entera de que ese número está verificado en
otra cuenta, a la que no puede entrar: la compañía le reasignó el número, o perdió el correo de
su cuenta vieja. Elige «Es mío y no puedo entrar a esa cuenta», lee qué le va a pasar a la otra
cuenta y confirma. Su cuenta queda en nivel 1 con ese número y sigue a lo que estaba haciendo.

**Why this priority**: es la historia. Hoy esa persona queda trabada en el primer peldaño de la
verificación y no puede publicar ni solicitar con un número que es suyo. Sin esto, el resto no
tiene sentido.

**Independent Test**: con dos personas de prueba, la primera con un número verificado: la segunda
pide el código para ese mismo número, lo escribe bien, elige quedarse con el número y confirma.
La segunda queda en nivel 1 con ese número; la primera queda sin verificar y sin ese número.

**Acceptance Scenarios**:

1. **Dado** que escribí bien el código y el número figura en otra cuenta, **cuando** miro la
   pantalla, **entonces** veo «Ese número está en otra cuenta» con tres caminos a un toque:
   «Verificar otro número», «Entrar con esa cuenta» y «Es mío y no puedo entrar a esa cuenta».
2. **Dado** que elijo «Es mío y no puedo entrar a esa cuenta», **cuando** se abre la
   confirmación, **entonces** leo que la otra cuenta va a perder el número y quedar sin verificar,
   que se va a enterar por correo sin saber qué cuenta fue, y que si esa cuenta vuelve a demostrar
   que tiene el número puede quedárselo de vuelta; y tengo confirmar y volver.
3. **Dado** que confirmo dentro de los 10 minutos, **cuando** termina, **entonces** mi cuenta queda
   en nivel 1 con ese número y la fecha de hoy, y sigo a la acción que estaba intentando hacer o,
   si no venía de ninguna, a «Mi perfil» con la confirmación de que mi teléfono quedó verificado.
4. **Dado** que en la confirmación elijo volver, **cuando** vuelvo, **entonces** nada cambió, veo
   otra vez los tres caminos, y la otra cuenta no se enteró de nada.
5. **Dado** que pasaron más de 10 minutos desde que se mandó el código, **cuando** confirmo o
   elijo «Es mío y no puedo entrar a esa cuenta», **entonces** no cambia nada en ninguna de las dos
   cuentas, se me dice que para quedarme con el número hace falta un código nuevo, y se me ofrece
   pedirlo a ese número con un toque, sin escribirlo de nuevo.
6. **Dado** que ya pedí 5 códigos en las últimas 24 horas, **cuando** quiero pedir otro para
   quedarme con el número, **entonces** no se manda nada y se me dice qué día y a qué hora voy a
   poder, en hora de Uruguay.
7. **Dado** que escribo mal el código, **cuando** lo confirmo, **entonces** veo el error de siempre
   de la historia #10 y no aparece la opción de quedarme con el número.
8. **Dado** que se corta la conexión al confirmar, **cuando** vuelvo a mirar, **entonces** se me
   dice que no se pudo confirmar y veo el estado real: el número ya es mío, o sigue en la otra
   cuenta y puedo volver a confirmar si todavía estoy dentro de los 10 minutos.
9. **Dado** que tenía verificado otro número y el que escribí figura en otra cuenta, **cuando** me
   quedo con él, **entonces** queda como mi número verificado y el anterior deja de estar asociado
   a mi cuenta, igual que al terminar un cambio de número; la confirmación me lo avisa antes,
   nombrando mi número anterior.

---

### User Story 2 - La cuenta anterior se entera y queda sin el número (Priority: P2)

La cuenta que tenía el número lo pierde del todo: deja de estar asociado a ella y queda sin
verificar, como una cuenta que nunca verificó. Se entera en el momento por correo y, al volver,
lo ve en «Mi perfil» con el día y el camino para verificarse de nuevo, sin ningún dato de quien se
quedó con el número. Si el número seguía siendo suyo, puede quedárselo de vuelta por el mismo
camino.

**Why this priority**: es lo que hace segura la historia. Si la cuenta anterior quedara con el
número, desde M3 se le mostraría a quien acepte una solicitud el contacto de una tercera persona;
y si no se enterara, un chip robado le sacaría la verificación sin que lo sepa. Va segunda porque
se prueba sobre lo que construye la primera.

**Independent Test**: después de que otra cuenta se quedó con el número (US1), la cuenta anterior
tiene un correo nuevo que lo explica, y al entrar ve en «Mi perfil» el teléfono sin verificar,
desde qué día y cómo verificarse; si pide un código para ese mismo número, lo escribe y elige
quedárselo, el número vuelve a ella y la cuenta que lo tenía recibe el mismo correo y el mismo
aviso.

**Acceptance Scenarios**:

1. **Dado** que otra cuenta se quedó con mi número, **cuando** pasa, **entonces** me llega un
   correo que dice que mi teléfono quedó sin verificar porque otra cuenta demostró tenerlo, desde
   qué día, que si el número sigue siendo mío puedo verificarlo de nuevo, y cómo verificar otro
   número, sin decir qué cuenta fue.
2. **Dado** que perdí el número, **cuando** vuelvo a entrar, **entonces** «Mi perfil» muestra que
   el teléfono quedó sin verificar, desde qué día y por qué, con el acceso a verificar otro, sin
   ningún dato de quien se quedó con el número.
3. **Dado** que tenía un cambio de número a medias, **cuando** pierdo el número verificado,
   **entonces** quedo sin verificar, el número nuevo sigue a medias y puedo terminar el cambio
   escribiendo el código o pidiendo otro.
4. **Dado** que perdí el número y el teléfono sigue siendo mío, **cuando** pido un código para ese
   número, lo escribo bien y elijo quedármelo, **entonces** vuelve a mi cuenta en nivel 1, el aviso
   de número perdido desaparece, y la otra cuenta recibe el mismo correo y el mismo aviso en su
   perfil.
5. **Dado** que perdí el número, **cuando** verifico otro, **entonces** el aviso de número perdido
   desaparece y mi perfil muestra el número nuevo verificado, como siempre.
6. **Dado** que elijo «Verificar otro número» o «Entrar con esa cuenta» desde «Ese número está en
   otra cuenta», **cuando** lo hago, **entonces** la otra cuenta no cambia en nada: ni pierde el
   número ni recibe un correo.

---

### User Story 3 - Entrar con la otra cuenta desde «Ese número está en otra cuenta» (Priority: P3)

Quien descubre que su número está en otra cuenta suya puede entrar con esa cuenta con un toque,
en vez de leer cómo hacerlo y salir por su cuenta (KL-028).

**Why this priority**: hoy el camino está escrito y se puede hacer a mano; es el caso más común
del número en uso (dos cuentas de la misma persona), pero no deja a nadie trabado.

**Independent Test**: con dos cuentas de prueba de la misma persona, la segunda escribe el código
de un número verificado en la primera, toca «Entrar con esa cuenta», termina en «Entrar» sin
sesión, entra con la primera y llega a donde iba.

**Acceptance Scenarios**:

1. **Dado** que estoy en «Ese número está en otra cuenta», **cuando** toco «Entrar con esa
   cuenta», **entonces** se cierra la sesión de la cuenta en la que estoy y quedo en «Entrar»,
   sabiendo antes de tocarlo que eso cierra esta sesión.
2. **Dado** que venía del aviso de la puerta, **cuando** entro con la otra cuenta en el mismo
   dispositivo, **entonces** llego a esa acción, como después de cualquier ingreso con destino.
3. **Dado** que toco «Entrar con esa cuenta», **cuando** entro con la otra, **entonces** ninguna de
   las dos cuentas cambió: la otra sigue con su número verificado y la que dejé sigue como estaba.
4. **Dado** que toqué «Entrar con esa cuenta», **cuando** vuelvo a entrar sin querer con la misma
   cuenta que dejé, **entonces** estoy en esa cuenta como la dejé, sin el número, y para quedarme
   con él vuelvo a «Verificar teléfono» y pido un código como siempre: tocar «Entrar con esa
   cuenta» deja la prueba atrás. Si entro con un correo que no tiene cuenta, se crea otra cuenta como en cualquier
   ingreso de la historia #9.

---

### Edge Cases

- **La prueba vence**: la confirmación se acepta hasta que el código escrito habría vencido, 10
  minutos desde que se mandó. Después no se acepta, no cambia nada en ninguna cuenta, y se ofrece
  pedir otro código a ese número (FR-008). Ese pedido es un pedido de código como cualquiera:
  cuenta para la espera y el tope diario de la historia #10, y los frena igual. Al escribir bien el
  código nuevo, la persona va directo a la confirmación de quedarse con el número, que sigue diciendo
  qué le pasa a la otra cuenta: esa decisión ya la había tomado, y «Volver» lleva a los tres caminos.
- **La prueba se deja sin efecto antes de vencer**: pasa en los tres casos de FR-005, y en los tres
  la persona ve lo mismo que con la prueba vencida (FR-008). Uno: la cuenta pide otro código
  después de ver «Ese número está en otra cuenta», a ese número o a otro, y el pedido deja un
  código nuevo (FR-005); vale solamente la
  última prueba, igual que vale solamente el último código. Dos: después de la prueba, el número
  quedó verificado en una cuenta, la que sea —otra persona se quedó con él o lo verificó mientras
  tanto—; la prueba demostraba el número frente a quien lo tenía antes, no frente a quien lo tiene
  ahora. Tres: la persona sale con «Entrar con esa cuenta» y la sesión se cierra. Salir de la
  sesión por cualquier otro camino, o que venza, no la deja sin efecto: la prueba es de la cuenta.
- **La cuenta nueva se borra con una prueba vigente**: la prueba se borra con la cuenta, como todo
  lo demás de la historia #10.
- **La otra cuenta ya no tiene el número al confirmar** (lo cambió por otro, o borró la cuenta en el
  medio) y ninguna otra cuenta lo verificó después: la confirmación verifica el número en la cuenta
  nueva como una verificación común; no se manda ningún correo ni se deja ningún aviso, porque
  nadie perdió nada. La persona ve exactamente lo mismo que si se lo hubiera quedado (FR-009).
- **Dos cuentas confirman quedarse con el mismo número a la vez**: exactamente una se lo queda. A la
  otra la prueba se le deja sin efecto (el número quedó verificado después de su prueba) y ve lo
  mismo que con la prueba vencida: para quedarse con el número hace falta un código nuevo. En
  ningún momento el número está verificado en dos cuentas.
- **La cuenta anterior está haciendo algo con su teléfono en el mismo momento** (cancelando un
  cambio, confirmando un código): las dos cosas se hacen una después de la otra, nunca mezcladas.
  Si la anterior termina un cambio a otro número antes, la cuenta nueva verifica el número como
  en el caso anterior; si no, la anterior pierde el número y sigue con lo suyo.
- **Ida y vuelta**: si la cuenta anterior recupera el número y la nueva vuelve a demostrar que lo
  tiene, puede quedárselo otra vez; cada vez la que pierde recibe el correo y el aviso. No hay
  tope propio: cada vuelta exige un código escrito bien, y los códigos tienen sus topes.
- **Cambio de número a medias en la cuenta anterior**: al perder el verificado, el número a medias
  sigue a medias con sus 7 días, y cancelarlo deja a la cuenta sin teléfono (con el aviso de
  número perdido todavía a la vista).
- **Número a medias en la cuenta nueva**: después de «Ese número está en otra cuenta» la cuenta
  nueva ya no tiene ese número a medias (historia #10); quedarse con el número no revive nada a
  medias. Si la cuenta nueva estaba en medio de un cambio, volvió a su número verificado anterior;
  quedarse con el nuevo termina ese cambio.
- **Dos toques seguidos en confirmar**: se procesa uno solo; la acción queda ocupada mientras tanto.
- **Sesión que vence en la confirmación**: al confirmar se pide ingresar. Al volver con la misma
  cuenta, si todavía está dentro de los 10 minutos, la persona vuelve a la confirmación; si no,
  rige FR-009d: «Mi perfil» si tiene un teléfono verificado, o que hace falta un código nuevo, con
  el número a escribir en «Verificar teléfono» porque el producto ya no lo conserva.
- **La hora límite pasa con la pantalla abierta**: «Ese número está en otra cuenta» y la
  confirmación dejan de mostrar la hora límite y pasan, sin que haga falta tocar nada, a mostrar
  que hace falta un código nuevo, con el pedido a un toque (FR-005a, FR-008).
- **La confirmación abierta sin una prueba** (se entró escribiendo la dirección, se volvió atrás
  después de confirmar, la prueba se reemplazó en otra pestaña): no se muestra la confirmación y
  rige FR-009d. Nunca se dice que el teléfono quedó verificado sin saber que fue así.
- **La cuenta anterior borra su cuenta después de perder el número**: el día en que lo perdió se
  borra con todo lo demás.
- **El correo no sale** (falla del servicio de correo): la cuenta nueva se queda con el número
  igual; no se deshace nada. La cuenta anterior se entera por «Mi perfil» al volver a entrar.
- **Una cuenta pierde el número dos veces** (lo recupera y otra se lo vuelve a sacar): el aviso
  muestra el día de la última vez.
- **La cuenta nueva entra con la otra cuenta desde un dispositivo sin la sesión del correo**: si el
  ingreso de la otra cuenta se termina en otro dispositivo, rige lo que la historia #9 ya decidió
  para el destino: se pierde y la persona queda en «Mi perfil».
- **La cuenta anterior tiene una sesión abierta en otro dispositivo** cuando pierde el número: una
  pantalla ya abierta no cambia sola; la próxima vez que carga cualquier pantalla ve el estado real
  (sin el número, con el aviso), y la puerta de publicar y solicitar la frena desde ese momento.
- **«Es mío y no puedo entrar a esa cuenta» tocado con la prueba ya vencida** (la pantalla quedó
  abierta más de 10 minutos): no se abre la confirmación; se ve directamente que hace falta un
  código nuevo, con el pedido a un toque (FR-008).

## Pantallas

Cada pantalla, con su estado vacío, su estado mientras carga o guarda, y su estado de error, con
los mismos criterios que las historias #9 y #10.

- **Ese número está en otra cuenta**.
  - *Vacío*: no aplica. Siempre muestra el título del problema y tres caminos: «Verificar otro
    número», «Entrar con esa cuenta» (con la aclaración de que cierra esta sesión) y «Es mío y no
    puedo entrar a esa cuenta». Si era un cambio y se llegó desde el aviso de la puerta, además
    ofrece seguir a esa acción (historia #10) como camino principal, y los tres quedan debajo.
  - *Cargando*: no trae datos. Mientras se cierra la sesión para entrar con la otra cuenta, ese
    camino queda ocupado; mientras se comprueba si la prueba sigue valiendo al tocar «Es mío y no
    puedo entrar a esa cuenta», ese camino queda ocupado y no admite un segundo toque.
  - *Error*: si cerrar la sesión falla, se dice que no se pudo y se deja reintentar. Si al tocar
    «Es mío y no puedo entrar a esa cuenta» la prueba ya no vale, se ve lo mismo que en el error
    de la confirmación: hace falta un código nuevo, con el pedido a un toque.
- **Quedarme con este número** (la confirmación).
  - *Vacío*: no aplica; sin una prueba vigente no se muestra (ver Edge Cases). Siempre dice el
    número del que se trata, qué le pasa a la otra cuenta (pierde el número, queda sin verificar,
    se entera por correo sin saber qué cuenta fue, puede recuperarlo si lo demuestra), qué pasa con
    el número verificado anterior de esta cuenta si tenía uno, y dos acciones: confirmar y volver.
  - *Cargando*: mientras se confirma, confirmar queda ocupado y no admite un segundo toque.
  - *Error*: la prueba ya no vale —venció o se dejó sin efecto—, con el pedido de un código nuevo
    a un toque, que respeta la espera y el tope y, si no se puede pedir ahora, dice cuándo, en hora
    de Uruguay (FR-008); no se pudo
    confirmar por la conexión o el sitio (con el estado real, FR-011); la sesión venció (pide
    ingresar). Ninguno deja a la persona sin un paso siguiente.
  - *Después de confirmar*: la persona ya no está en esta pantalla: sigue a su acción o a «Mi
    perfil» con la confirmación (FR-007). Lo que ve es igual se haya quedado con el número o lo
    haya encontrado libre (FR-009).
- **Mi perfil** de la cuenta que perdió el número (sección del teléfono).
  - *Vacío*: sin el aviso de número perdido, es el paso pendiente de siempre de la historia #10.
    Con el aviso: el teléfono sin verificar, desde qué día y por qué ("otra cuenta demostró tener
    tu número"), que si el número sigue siendo suyo puede verificarlo de nuevo, y el acceso a
    verificar ese número u otro. Si además tiene un número a medias, se ve ese
    número con terminar, corregir y cancelar, y el aviso de número perdido encima.
  - *Cargando*: como el resto del perfil, con la forma de la sección.
  - *Error*: como el resto del perfil: se dice que no se pudo traer y se ofrece reintentar.
- **Correo a la cuenta anterior**.
  - *Vacío*: no aplica. Siempre dice qué pasó, desde qué día, que no se sabe ni se dice qué cuenta
    fue, que si el número sigue siendo suyo puede verificarlo de nuevo, y el enlace para entrar a
    verificar. No sirve para entrar sin más: es un enlace común al sitio, no un enlace de ingreso.
  - *Cargando* y *Error*: no aplica para quien lo recibe; si el correo no sale, rige FR-010.

## Requirements *(mandatory)*

### Functional Requirements

#### Los caminos de «Ese número está en otra cuenta»

- **FR-001**: Cuando una cuenta escribe bien el código de un número verificado en otra cuenta, el
  producto DEBE mostrar «Ese número está en otra cuenta» con tres caminos a un toque, en este
  orden: **verificar otro número** (el que ya existe), **entrar con esa cuenta**, y **«Es mío y no
  puedo entrar a esa cuenta»**. El texto que hoy explica cómo entrar a la otra cuenta o borrarla
  DEBE reemplazarse por esos caminos (KL-028). La pantalla NO DEBE mostrar nada de la otra
  cuenta: ni su nombre, ni su correo, ni fechas. Si era un cambio y se llegó desde el aviso de una
  acción, sigue ofreciendo, además y primero, seguir a esa acción (historia #10, su FR-008c).
- **FR-002**: Escribir mal el código, o que venza, NO DEBE mostrar la opción de quedarse con el
  número: esa opción solo existe después de escribir bien un código.
- **FR-003**: **Entrar con esa cuenta** DEBE cerrar la sesión de la cuenta actual y llevar a
  «Entrar», conservando el destino si se venía del aviso de la puerta, con las mismas reglas de
  destino de la historia #9. Junto al camino DEBE decirse que cierra esta sesión. NO DEBE sugerir
  qué cuenta era ni con qué correo entrar. Salir deja atrás la prueba: si la persona vuelve a
  entrar con la misma cuenta, está como la dejó y, para quedarse con el número, pide un código
  como siempre (FR-005). La prueba queda sin efecto solo si la sesión efectivamente se cerró; si
  cerrar la sesión falla, la persona sigue en la pantalla con la prueba como estaba. Entrar con un
  correo que no tiene cuenta crea otra, como en cualquier ingreso de la historia #9.
- **FR-004**: Verificar otro número o entrar con esa cuenta NO DEBEN cambiar nada en la otra
  cuenta.

#### Quedarse con el número

- **FR-005**: Quedarse con un número DEBE exigir una **prueba vigente**: haber escrito bien, en
  esta cuenta, un código mandado a ese número, y confirmarlo **antes de que ese código habría
  vencido** (10 minutos desde que se mandó). Es el mismo código que se acaba de escribir: no se
  manda otro (Decisión 2026-09-25 de la historia). La prueba es de la cuenta, no de la sesión: si
  la sesión vence sola, sigue valiendo (FR-009c). DEBE quedar sin efecto antes de vencer en tres
  casos: si la cuenta pide otro código después y ese pedido deja un código nuevo —sale, o lo
  frena en silencio el tope por número de la historia #10—, a ese número o a otro (vale solamente
  la última prueba, como vale solamente el último código); un pedido que la espera, el tope diario
  o el techo del sitio no dejan hacer, o que falla al salir, no cambia nada; si después de la prueba el número quedó verificado en alguna
  cuenta (otra persona se quedó con él o lo verificó), porque la prueba demostraba el número
  frente a quien lo tenía antes, no frente a quien lo tiene ahora; y si la persona toca «Entrar
  con esa cuenta», que es elegir no quedarse con él (FR-003).
- **FR-005a**: «Ese número está en otra cuenta» y la confirmación DEBEN decir hasta qué hora, en
  hora de Uruguay, se puede confirmar ("Podés confirmarlo hasta las 14:32"), para que nadie lea
  la confirmación sin saber que el tiempo se termina. Cuando esa hora pasa con la pantalla
  abierta, la pantalla DEBE pasar sola a lo de FR-008, sin mostrar una hora ya pasada.
- **FR-006**: Quedarse con un número NUNCA DEBE pasar solo: la persona elige «Es mío y no puedo
  entrar a esa cuenta», lee la confirmación y confirma. La confirmación DEBE decir, antes de
  confirmar: el número del que se trata; que la otra cuenta va a perder ese número y quedar sin
  verificar; que se va a enterar por correo en ese momento y en su perfil, sin saber qué cuenta
  fue; que si vuelve a demostrar que tiene el número puede quedárselo de vuelta; y, si esta cuenta
  tenía otro número verificado, que ese deja de estar asociado a ella. DEBE ofrecer **confirmar**
  y **volver**. Volver NO DEBE cambiar nada y DEBE dejar a la persona otra vez en los tres caminos,
  con la prueba intacta.
- **FR-007**: Al confirmar con una prueba vigente, en un solo paso que se completa entero o no se
  hace:
  1. la cuenta nueva DEBE quedar con ese número verificado, con la fecha de hoy, y en nivel 1;
  2. si la cuenta nueva tenía otro número verificado, ese DEBE dejar de estar asociado a ella y
     quedar libre, como al terminar un cambio de número;
  3. la cuenta anterior DEBE perder el número del todo: deja de estar asociado a ella, se borra
     también su fecha de verificación, y su teléfono queda sin verificar como el de una cuenta que
     nunca verificó; guarda solamente **el día** en que lo perdió. Nada más de la cuenta cambia: ni
     su perfil, ni lo que las historias de identidad (#11) y aval (#12) le agreguen, que deciden
     esas historias;
  4. si la cuenta anterior tenía un cambio de número a medias, DEBE conservarlo, con su código
     vivo y sus 7 días, para terminarlo o cancelarlo como siempre.
  Después, la persona DEBE seguir a la acción que estaba intentando hacer si venía del aviso de una
  acción, o a «Mi perfil» con la confirmación visible de que el teléfono quedó verificado.
- **FR-008**: Si al confirmar, o al tocar «Es mío y no puedo entrar a esa cuenta», la prueba ya no
  vale —venció o quedó sin efecto—, el producto NO DEBE cambiar nada en ninguna de las dos cuentas.
  DEBE decir, con un solo mensaje para todos esos casos, que para quedarse con el número hace
  falta un código nuevo, y ofrecer, con un toque y sin reescribir el número, **pedir un código
  nuevo a ese número**, el de la prueba. Si la persona ya no está en la pantalla donde vio el
  número (volvió a entrar, abrió otra pestaña), escribe el número en «Verificar teléfono», porque
  el producto no lo conserva después de que la prueba deja de valer (FR-013e). Ese pedido es un
  pedido de código común de la historia #10: cuenta para la espera de 60 segundos y el tope de 5 en 24
  horas, y si no se puede pedir ahora, la pantalla dice cuándo, con el día y la hora en hora de
  Uruguay, y habilita el pedido recién entonces. Esta historia NO DEBE agregar topes nuevos.
- **FR-009**: Si al confirmar el número ya no está verificado en ninguna otra cuenta (la anterior
  lo cambió o se borró) y la prueba sigue vigente, confirmar DEBE verificarlo en la cuenta nueva
  como una verificación común, sin mandar ningún correo ni dejar ningún aviso. La persona DEBE ver
  exactamente lo mismo que en FR-007: que el número estuviera libre no le dice nada de la otra
  cuenta.
- **FR-009a**: Si dos cuentas confirman quedarse con el mismo número a la vez, exactamente una
  DEBE quedárselo; a la otra la prueba le queda sin efecto (el número quedó verificado después de
  su prueba) y DEBE ver lo de FR-008. Un número verificado sigue perteneciendo a una sola cuenta
  en todo momento (historia #10, su FR-008).
- **FR-009b**: Mientras se confirma, la acción DEBE quedar ocupada y no admitir un segundo toque.
- **FR-009c**: Si la sesión vence en la confirmación, al confirmar DEBE pedirse ingresar; al
  volver con la misma cuenta, si la prueba sigue vigente, la persona DEBE volver a la
  confirmación, y si no, rige FR-009d.
- **FR-009d**: Sin una prueba vigente de esta cuenta (venció, se usó, o se abrió la dirección
  directo), «Ese número está en otra cuenta» y la confirmación NO DEBEN mostrarse, y el producto
  NUNCA DEBE decir que el teléfono quedó verificado: no sabe de qué prueba se trataba. Si la cuenta
  tiene un teléfono verificado, la persona va a «Mi perfil», donde ve su estado real; si no, ve lo
  de FR-008, y como el producto ya no conserva el número, el pedido del código nuevo es el acceso
  a «Verificar teléfono» para escribirlo (FR-013e).

#### La cuenta anterior

- **FR-010**: En el momento en que pierde el número, el producto DEBE mandarle un correo a la
  dirección de la cuenta anterior que diga: que su teléfono quedó sin verificar porque otra cuenta
  demostró tenerlo; desde qué día; que no se sabe ni se dice qué cuenta fue; que si el número
  sigue siendo suyo, puede verificarlo de nuevo y volver a quedárselo; y cómo verificar otro
  número, con un enlace común al sitio que lleva a «Mi perfil» (sin sesión, pide ingresar y, en el
  mismo dispositivo, vuelve a «Mi perfil», con las reglas de destino de la historia #9). El correo
  DEBE salir al confirmar, sin esperar a ningún proceso posterior, y DEBE darse por fallido si el
  servicio de correo no lo acepta en un minuto. Lo que la cuenta nueva ve al confirmar, y cuándo lo
  ve, NO DEBE depender del correo: ni de si se manda, ni de cuánto tarda, ni de si falla; si
  dependiera, la demora le diría si la otra cuenta todavía tenía el número (FR-009). El correo NO DEBE incluir el número, ni nada de la cuenta nueva, ni un enlace
  que haga entrar sin ingresar. Su texto DEBE ser traducible como cualquier otro texto del
  producto. Si el correo no sale, quedarse con el número NO DEBE deshacerse: la cuenta anterior se
  entera por «Mi perfil» (FR-011a).
- **FR-011**: Si confirmar falla por algo que no es la prueba —se cortó la conexión, el sitio no
  respondió—, el producto DEBE decir que no se pudo confirmar y DEBE mostrar el estado real al
  volver a mirar, comparando el número de la pantalla con el de la cuenta: si ese número quedó en
  esta cuenta, la persona sigue como en FR-007, con la confirmación; si no, sigue en la
  confirmación y puede reintentar mientras la prueba siga vigente, o pedir un código nuevo a ese
  número con un toque si ya no.
- **FR-011a**: «Mi perfil» de la cuenta anterior DEBE mostrar, mientras guarde el día en que perdió
  el número, el **aviso de número perdido**: que el teléfono quedó sin verificar, desde qué día
  —una fecha, no "hace 3 días"—, que fue porque otra cuenta demostró tener ese número, que si el
  número sigue siendo suyo puede verificarlo de nuevo y quedárselo, y el acceso a «Verificar
  teléfono», que sirve para el mismo número o para otro. El día es el día calendario de Uruguay en
  que perdió el número, y es el mismo en el correo y en el perfil. NO DEBE mostrar ningún dato de quien se quedó con el
  número. Si la cuenta tiene un número a medias, el perfil DEBE mostrar las dos cosas: el número a
  medias con terminar, corregir y cancelar, y el aviso de número perdido.
- **FR-011b**: El aviso de número perdido DEBE desaparecer cuando la cuenta vuelve a tener un
  número verificado, sea el mismo u otro. Si la cuenta pierde un número otra vez, el
  aviso DEBE mostrar el día de la última vez.
- **FR-011c**: Si la cuenta anterior vuelve a demostrar que tiene el número, DEBE poder
  quedárselo de vuelta por el mismo camino (FR-001 a FR-009), y la cuenta que lo pierde DEBE
  recibir el mismo correo y el mismo aviso. No hay un camino especial ni un tope propio.
- **FR-011d**: Perder el número saca a la cuenta anterior de nivel 1 (su correo sigue confirmado;
  lo que le falta es el teléfono): la puerta de publicar y
  solicitar de la historia #10 la frena como a cualquier cuenta sin verificar. Qué pasa con
  publicaciones o solicitudes en curso lo decide la historia que las construya, con la misma
  regla que para una cuenta que cambió de número.

#### Privacidad

- **FR-012**: Nada de una cuenta DEBE mostrársele a la otra en ningún momento: ni nombre, ni
  correo, ni fechas, ni si la otra está en nivel 1. La confirmación, el correo y el aviso de
  número perdido dicen que "otra cuenta" demostró tener el número, nunca cuál.
- **FR-013**: El producto NO DEBE guardar nada que una las dos cuentas: ni quién se quedó con el
  número de quién, ni cuándo con más precisión que el día en la cuenta anterior. Ni las cuentas ni
  quien administra el sitio DEBEN poder ver, desde el producto, quién se quedó con el número de
  quién. Para eso, lo que el producto guarda de forma duradera sobre este momento NO DEBE tener más
  precisión que el día, en ninguna de las dos cuentas: la cuenta nueva guarda desde qué día está
  verificada (lo mismo que ya muestra su perfil) y la anterior, el día en que perdió el número.
  Los registros pasajeros de la historia #10 (los pedidos de código, que duran 24 horas) siguen
  existiendo con su hora; pasadas esas 24 horas, nada de lo que guarda el producto permite unir a
  las dos cuentas con más precisión que el día. Los momentos de medición no llevan nada que
  identifique a ninguna de las dos cuentas (FR-014).
- **FR-013f**: "Lo que se guarda de forma duradera" incluye todo lo que el producto guarda de cada
  cuenta más allá de 24 horas, también las marcas de cuándo cambió por última vez el teléfono de
  una cuenta: en las dos cuentas, el momento de quedarse con el número NO DEBE quedar guardado con
  más precisión que el día. En particular, la fecha de verificación de la cuenta nueva, cuando se
  queda con un número de otra, se guarda como un día, igual que el día en que la anterior lo
  perdió; la persona sigue viendo lo mismo en su perfil ("Nivel 1 desde el …", que ya es una
  fecha).
- **FR-013e**: La prueba conoce el número solo mientras vale (como un número a medias) y lo DEBE
  soltar al confirmar, al quedar sin efecto y al vencer. Una prueba vencida NO DEBE poder usarse
  aunque el producto todavía no la haya limpiado, y DEBE limpiarse a más tardar con los registros
  de pedidos de la historia #10 (24 horas). La prueba NO DEBE verla nadie: ni la cuenta anterior,
  ni otras cuentas, ni quien administra desde el producto; la cuenta que la tiene solo la usa, al
  confirmar. Cada regla DEBE demostrarse con un intento fallido de leerla o de escribirla.
- **FR-013a**: La cuenta anterior DEBE guardar solamente el día en que perdió el número, y solo
  hasta que verifique otro (o el mismo) o borre la cuenta. Borrar la cuenta DEBE borrarlo con todo
  lo demás, con las reglas de borrado de la historia #9.
- **FR-013b**: El día en que una cuenta perdió su número lo DEBE ver solamente esa cuenta, igual
  que su teléfono (historia #10, su FR-019); y nadie DEBE poder escribirlo, cambiarlo ni borrarlo
  desde el producto por otro camino que quedarse con un número, verificar uno o borrar la cuenta,
  tampoco su dueña (historia #10, su FR-019d). Cada regla DEBE demostrarse con un intento fallido:
  alguien sin sesión y alguien con la sesión de otra persona intentan leerlo y no pueden, y la
  dueña intenta escribirlo o borrarlo y no puede.
- **FR-013c**: Quedarse con un número NO DEBE poder hacerse sin una prueba vigente por ningún
  camino del producto, tampoco reintentando, abriendo la confirmación directo, o desde otra cuenta
  que no escribió el código. Cada caso DEBE demostrarse con un intento fallido.
- **FR-013d**: Que un número esté verificado en otra cuenta sigue sin poder averiguarse sin tener
  ese número en la mano (historia #10, su FR-019b): esta historia no agrega ningún camino que lo
  diga antes de escribir bien el código.

#### Medición

- **FR-014**: El producto DEBE registrar, sin datos que identifiquen a la persona, al número ni a
  la otra cuenta, y con la misma marca de visita de la historia #9, estos momentos nuevos:

  - **Quedarse con el número elegido**: se toca «Es mío y no puedo entrar a esa cuenta», se abra la
    confirmación o se vea que la prueba ya no vale.
  - **Quedarse con el número confirmado**: la persona confirma y su cuenta queda con el número,
    sea porque se lo quedó de otra cuenta (FR-007) o porque lo encontró libre (FR-009).
  - **Número perdido**: una cuenta pierde su número porque otra se lo quedó (FR-007). **No** en el
    caso de FR-009, donde nadie pierde nada; por eso no se dispara siempre junto con el anterior.
  - **Verificado después de perder el número**: una cuenta con el aviso de número perdido queda
    verificada, con el mismo número o con otro.

  El abandono en la confirmación DEBE poder calcularse con esos momentos, sin uno propio: las
  visitas con "quedarse con el número elegido" y sin "quedarse con el número confirmado". Es una
  aproximación, y la spec la acepta como la historia #10 aceptó la suya: cuenta como abandono a
  quien tocó con la prueba ya vencida y a quien confirmó en otra visita después de volver a
  ingresar, porque los momentos no llevan nada que una dos visitas de la misma persona.
  Quedarse con el número también DEBE registrar los momentos de la historia #10 que correspondan:
  "código confirmado", que en la historia #10 se registra solo cuando la cuenta queda verificada
  (no al descubrir el número en uso), así que no se cuenta dos veces; y "teléfono cambiado" si la
  cuenta nueva tenía otro número verificado. Ninguno de los momentos nuevos se dispara siempre
  junto con otro: cada uno también ocurre solo. El denominador es el momento «Número en uso» de la
  historia #10, que ya existe.
- **FR-014a**: Cada momento DEBE poder observarse al recorrer el flujo. Si uno no se dispara, es un
  defecto.

### Key Entities

- **Prueba de número**: que esta cuenta escribió bien el código de un número que está verificado
  en otra. Pertenece a la cuenta que escribió el código, vale hasta que ese código habría vencido,
  la deja sin efecto cualquier código nuevo de la cuenta o que el número quede verificado en otra
  cuenta después, y se consume al confirmar. Mientras vale, conoce el número; después, no. No la
  ve nadie (FR-013e).
- **Día en que se perdió el número**: una fecha, sin hora, en la cuenta anterior: el día
  calendario de Uruguay en que lo perdió. No nombra el
  número ni la cuenta que se lo quedó. Dura hasta que la cuenta verifica un número o se borra. Lo
  ve solo su dueña.
- **Teléfono verificado**, **número a medias**, **código**, **nivel de verificación**: los de la
  historia #10, sin cambios.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde «Ese número está en otra cuenta», una persona con una prueba vigente llega a
  nivel 1 con ese número con **dos toques**: «Es mío y no puedo entrar a esa cuenta» y confirmar,
  sin pedir ni escribir otro código.
- **SC-002**: **0 números verificados en más de una cuenta**, también cuando dos cuentas confirman
  quedarse con el mismo número a la vez, o cuando la cuenta anterior hace algo con su teléfono en
  el mismo momento.
- **SC-003**: **0 veces** que una cuenta se queda con un número sin una prueba vigente: los
  intentos pasados los 10 minutos, después de pedir otro código, sin haber escrito el código, o
  desde otra cuenta, fallan todos y no cambian nada en ninguna cuenta.
- **SC-004**: En el 100 % de las veces que una cuenta pierde el número, la cuenta anterior queda
  sin ese número, sin verificar, con el día guardado, y con un correo entregado al servicio de
  correo dentro del minuto siguiente a la confirmación (o, si el servicio de correo falló, con el
  aviso en su perfil igual).
- **SC-005**: **0 datos de una cuenta a la vista de la otra**: ni en la confirmación, ni en el
  correo, ni en el aviso del perfil aparece el nombre, el correo ni ninguna fecha de la otra
  cuenta; y el día en que se perdió el número no lo lee nadie más que su dueña (los intentos sin
  sesión y con la sesión de otra persona fallan).
- **SC-006**: El 100 % de los caminos que no terminan en quedarse con el número —volver, prueba
  vencida, tope diario, falla al confirmar, sesión vencida, otra cuenta que se lo quedó antes—
  termina en una pantalla que dice qué pasó y ofrece el paso siguiente. Nunca un "error" a secas.
- **SC-007**: Quien se queda con el número desde el aviso de la puerta, en el mismo dispositivo,
  llega a la acción que traía el aviso el 100 % de las veces. Como publicar y solicitar todavía no
  existen, se verifica recorriendo el flujo de punta a punta con el aviso abierto como lo van a
  abrir esas historias, con la acción y el destino, igual que en la historia #10.
- **SC-008**: La confirmación muestra su contenido completo y el botón de confirmar se puede tocar en
  menos de 2,5 segundos desde que se abre en un teléfono con datos móviles, con el mismo perfil de
  red con el que se mide todo el producto y sin que el contenido salte de lugar (el mismo umbral de
  corrimiento del presupuesto de performance del producto). Se mide con una persona de prueba que tiene una prueba vigente, como la historia #10
  midió la pantalla del código con una persona que tenía un número a medias.

## Assumptions

- **La prueba vale lo que el código** (asunción 2026-09-25, tomada en la corrida): "en los últimos
  10 minutos" de la historia se lee como "antes de que el código escrito habría vencido", que es
  10 minutos desde que se mandó. Así la regla es una sola para verificar y para quedarse con el
  número, como pide la historia ("el mismo que verificarlo").
- **La prueba queda sin efecto con cualquier código nuevo, si el número cambia de manos, o al salir
  con «Entrar con esa cuenta»**
  (asunción 2026-09-25, tomada en la corrida): la historia #10 dice que vale solamente el último
  código; esta spec aplica lo mismo a la prueba, para que una pestaña vieja no confirme algo que la
  persona ya dejó atrás. Y si el número quedó verificado en alguna cuenta después de la prueba, la
  prueba ya no dice nada de quien lo tiene ahora: sin esta regla, la que pierde una carrera se lo
  sacaría a la ganadora con la misma prueba, sin código nuevo, y una tercera cuenta perdería el
  número sin haber estado en la confirmación.
- **Qué pedido deja sin efecto la prueba** (asunción 2026-09-25, tomada en la corrida): el que
  deja un código nuevo vivo —el que sale, o el que el tope por número frena en silencio—; no el
  que la espera, el tope o el techo frenan antes, ni el que falla al salir, ni escribir el número
  que ya está verificado. Es la misma línea de la historia #10: un pedido que no salió no cambia
  nada.
- **Hoy, al descubrir el número en uso, el código escrito ya no sirve para verificar** (historia
  #10, dicho en la etapa Ready): esta spec no cambia lo que la persona ve de eso; la prueba es un
  hecho aparte que dura esos 10 minutos.
- **El número de la prueba no se conserva después de que deja de valer** (asunción 2026-09-25):
  conservarlo uniría a la cuenta nueva con el número de la anterior, que la historia prohíbe. El
  pedido a un toque de FR-008 usa el número que la persona tiene a la vista en esa pantalla; si ya
  no lo tiene, lo escribe de nuevo en «Verificar teléfono». Hasta que exista un proceso diario
  (M5), la limpieza de lo vencido depende del uso del sitio, como los registros de la historia
  #10: por eso FR-013e exige que una prueba vencida no pueda usarse aunque siga guardada.
- **La otra cuenta ya no lo tiene** (asunción 2026-09-25): si al confirmar el número está libre,
  confirmar lo verifica sin correo (FR-009). Obligar a pedir otro código sería fricción sin prueba
  nueva: la persona ya lo demostró.
- **El correo no nombra el número** (asunción 2026-09-25, tomada en la corrida): el correo pasa
  por un servicio de terceros y el número ya no está en la cuenta; decir "tu teléfono" alcanza
  para que la persona entienda, y es el mínimo de datos (constitución §V).
- **Un solo intento de correo** (asunción 2026-09-25, tomada en la corrida): si el servicio de
  correo falla, no se reintenta solo: todavía no existe un proceso diario (llega en M5). El aviso
  de «Mi perfil» es el registro que no se pierde. **A validar por Hernán en el build local.**
- **Mientras no haya dominio** (KL-006): el correo sale de verdad solo a la dirección de la cuenta
  del servicio de correo; en desarrollo y en las pruebas queda en la máquina, como el correo del
  enlace de la historia #9.
- **Lo que queda para quien administra con todas las llaves** (asunción 2026-09-25, tomada en la
  corrida, **a validar por Hernán**): la historia dice que ni quien administra puede ver quién se
  quedó con el número de quién. Esta spec lo lee como: el producto no guarda el vínculo, y lo que
  guarda de forma duradera no tiene más precisión que el día (FR-013), que es la precisión que la
  historia misma decidió guardar en la cuenta anterior (FR-013f). Queda, a propósito: durante 24
  horas, los registros de pedidos de código de la historia #10 tienen la hora del pedido de la
  cuenta nueva; y el servicio de correo, que es de afuera, guarda a quién mandó cada correo y a qué
  hora. Con los dos juntos, dentro de esas 24 horas, quien administra con todas las llaves podría
  suponer qué cuentas se cruzaron. Cerrarlo del todo pediría demorar el correo, contra la decisión
  de la historia de avisar en el momento para el caso del chip robado. Es una lectura de una regla
  que la historia ya trae, no una regla nueva; igual se avisa en el PR para que Hernán la vete si
  la lee distinto.
- **Si la prueba no se puede borrar al salir** (asunción 2026-09-25, tomada en la corrida): «Entrar
  con esa cuenta» cierra la sesión y después deja sin efecto la prueba, con un reintento. Si las
  dos veces falla, la prueba sigue hasta su vencimiento (menos de 10 minutos), y solo la puede usar
  esa misma cuenta, que es la que demostró tener el número. Se acepta ese resto en lugar de dejar
  a la persona sin salir.
- **«Entrar con esa cuenta» cierra la sesión** (asunción 2026-09-25): no hay manera de entrar a otra
  cuenta sin salir de la actual en este producto (una sesión por dispositivo). Por eso se avisa
  junto al camino.
- **Los niveles 2 y 3** (asunción 2026-09-25): todavía no existen (historias #11 y #12). Perder
  el número solo toca el teléfono; cómo se combina con la identidad y el aval lo deciden esas
  historias.
- **Número perdido en la puerta** (asunción 2026-09-25): el aviso de la puerta de publicar y
  solicitar no dice que el número se perdió; alcanza con «Mi perfil» y el correo, que es lo que
  pide la historia. El aviso de la puerta sigue siendo el de cualquier cuenta sin verificar.
- **Ya construido** (de la etapa Ready): la pantalla «Ese número está en otra cuenta» con «Verificar
  otro número», la espera y el tope de la historia #10, y el momento «Número en uso». Esta spec
  los reutiliza sin rehacerlos.
- **Decisiones del enjambre de la historia** (2026-09-25, product-owner): quedarse con el número
  con el código que se acaba de escribir; la cuenta anterior pierde el número del todo y se entera
  por correo y en su perfil; no se vuelve a confirmar cada tanto un número verificado; no se guarda
  nada que una las dos cuentas. Se registran en la documentación de producto, junto con esta spec.
- **Fuera de esta historia** (de la historia): recuperar la cuenta vieja entera; volver a confirmar
  cada tanto un número verificado (lo decide la historia de M3 que revela el contacto); qué pasa
  con publicaciones o solicitudes en curso de la cuenta anterior (la historia que las construya);
  verificación de identidad con documento (historia #11); atención manual caso por caso; decirle a
  alguien qué cuenta tenía el número o quién se lo quedó.
- **Idioma y hora**: español rioplatense con voseo; toda fecha y hora que se muestra, en hora de
  Uruguay.
- **Dependencias**: las historias #9 (sesión, destino de vuelta, borrado, marca de visita) y #10
  (código, topes, puerta, «Ese número está en otra cuenta»), las dos cerradas.
