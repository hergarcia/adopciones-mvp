# Feature Specification: El perfil no pierde lo escrito si se corta la conexión o se recarga

**Feature Branch**: `feature/35-perfil-no-pierde-escrito`

**Created**: 2026-09-26

**Status**: Draft

**Input**: Historia #35 del backlog, milestone «M1 - Cuentas y confianza». Seguimiento de la
historia #9 (US4-AS4, severidad alta) que suma KL-024. El cuerpo verbatim de la historia acompaña
a esta spec.

**Ya construido** (historia #9): el formulario del perfil valida antes de mandar y marca cada
campo que falta sin mandar nada; mientras guarda, el botón queda ocupado y no admite un segundo
envío; un guardado que el sitio rechaza con una respuesta conserva lo escrito y lo dice arriba del
botón; al salir con cambios sin guardar se avisa antes de perderlos; lo escrito en el alta y no
guardado se conserva en ese navegador, se borra al guardar bien, al cerrar sesión y al borrar la
cuenta, y un navegador que no deja guardar nada localmente arranca con el formulario vacío, sin
error. El alta terminada se cuenta cuando un perfil que no existía queda guardado, y un guardado
sobre un perfil ya completo se cuenta como edición. Esta spec no rehace nada de eso. Lo que falta,
y es lo que esta historia construye:

- cuando el guardado **no llega** (sin conexión, o el sitio no responde), hoy aparece la pantalla
  «Algo se rompió» y se pierde todo, y al editar además «No pudimos traer tu perfil»;
- al recargar a mitad del alta, solo sobrevive el nombre: el departamento y la localidad hay que
  elegirlos de nuevo (KL-024);
- reintentar un guardado que sí llegó tiene que confirmarse como lo que la persona estaba haciendo
  y no contarse dos veces;
- la medición no ve los guardados que fallan ni los que se recuperan.

**Vocabulario de esta spec**: el **alta** es completar el perfil por primera vez; **editar** es
cambiar un perfil que ya estaba completo. Un **guardado que no llega** es uno que termina sin que
el sitio conteste si guardó o no: por **falta de conexión** (el dispositivo no tiene conexión al
tocar guardar o la pierde antes de la respuesta) o porque **el sitio no respondió** (hay conexión,
pero no llega una respuesta en 30 segundos, o llega una falla que no es un rechazo de los datos).
El **aviso de no guardado** es el mensaje que dice que no se guardó, por cuál de esos dos motivos,
y ofrece reintentar; una sesión que se cerró al guardar tiene su propio aviso (FR-008). Lo **escrito** es todo lo que está en pantalla: nombre, foto elegida o
quitada, departamento, localidad y la marca de rescatista o refugio. El **borrador** es la parte
de lo escrito en el alta que se conserva en el navegador: nombre, departamento, localidad y la
marca; nunca la foto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un guardado que no llega no borra nada y se puede reintentar (Priority: P1)

Una rescatista completa su perfil desde el celular con señal que va y viene. Toca guardar, la
conexión se corta, y en vez de una pantalla de error ve, junto al botón, que no se guardó porque
no hay conexión. Todo lo que escribió, foto incluida, sigue en pantalla. Cuando vuelve la señal
toca reintentar, el perfil se guarda con lo que había, se le confirma y sigue al próximo paso del
alta. Lo mismo le pasa a quien edita un perfil ya completo.

**Why this priority**: es la historia. Hoy un corte al guardar tira el alta entera, y el alta es
la puerta de la verificación: quien la pierde con mala señal vuelve a Facebook antes de llegar a
verificarse (docs/03 §Hipótesis).

**Independent Test**: con una persona de prueba sin perfil, completar el alta, cortar la conexión
del navegador y tocar guardar: aparece el aviso de no guardado con el motivo «sin conexión» y
todos los campos y la foto siguen como estaban. Devolver la conexión y reintentar: el perfil queda
guardado con esos datos y se sigue al próximo paso. Repetir editando un perfil completo.

**Acceptance Scenarios**:

1. **Dado** que completo mi perfil en el alta y se corta la conexión, **cuando** toco guardar,
   **entonces** veo, junto al botón de guardar, que no se guardó porque no hay conexión, con la
   acción de reintentar; mi nombre, mi foto, mi departamento, mi localidad y la marca de
   rescatista o refugio siguen en pantalla como los dejé, y no veo «Algo se rompió».
2. **Dado** que vuelve la conexión, **cuando** toco reintentar, **entonces** el perfil se guarda
   con lo que había en pantalla, se me confirma que se guardó y sigo al próximo paso del alta, el
   mismo al que habría ido si el primer guardado hubiera llegado.
3. **Dado** que edito mi perfil y se corta la conexión, **cuando** toco guardar, **entonces** veo
   el mismo aviso en el mismo lugar, lo que cambié sigue ahí, y no veo «Algo se rompió» ni «No
   pudimos traer tu perfil». Cuando vuelve la conexión y reintento, se me confirma que los cambios
   quedaron guardados y llego adonde llega cualquier edición guardada.
4. **Dado** que hay conexión pero el sitio no responde, **cuando** toco guardar, **entonces** a
   lo sumo 30 segundos después el botón deja de estar ocupado y veo que no se pudo guardar porque
   el sitio no respondió y que puedo probar de nuevo, con lo escrito intacto.
5. **Dado** que un guardado falló, **cuando** cambio un campo y reintento, **entonces** se guarda
   lo que está en pantalla, con el cambio.
6. **Dado** que un guardado falló, **cuando** intento salir de la pantalla, **entonces** se me
   avisa que hay cambios sin guardar, como con cualquier cambio sin guardar.
7. **Dado** que reintento y sigue sin conexión, **cuando** toco reintentar otra vez, **entonces**
   veo un solo aviso, no uno por cada intento, y nada se pierde.
8. **Dado** que dejé un campo obligatorio vacío y además no hay conexión, **cuando** toco guardar,
   **entonces** veo primero qué falta completar, debajo de cada campo, sin mandar nada y sin el
   aviso de no guardado.
9. **Dado** que el sitio rechaza un dato (por ejemplo, un nombre con un teléfono adentro),
   **cuando** guardo, **entonces** lo veo como hasta ahora, como un problema de ese dato y no como
   una falla de conexión.

---

### User Story 2 - Reintentar un guardado que sí llegó no duplica nada (Priority: P2)

A veces el guardado llega pero la respuesta se pierde en el camino: la persona ve el aviso de no
guardado aunque su perfil ya quedó guardado. Al reintentar, el sitio le confirma lo que estaba
haciendo, el perfil queda con lo último que mandó y el alta se cuenta una sola vez.

**Why this priority**: sin esto, reintentar después de un corte engaña: el alta aparecería como
edición, o se contaría dos veces, y la medición del embudo que el producto existe para leer
quedaría mal. Solo pega cuando US1 ya existe.

**Independent Test**: con una persona sin perfil, hacer que el primer guardado del alta llegue y
su respuesta se pierda; reintentar. Se confirma que el perfil quedó guardado como en un alta
normal, hay un solo perfil con los datos del reintento, y la medición registra una sola «Creación
de cuenta terminada» y ninguna edición.

**Acceptance Scenarios**:

1. **Dado** que el guardado del alta llegó pero la respuesta se perdió, **cuando** reintento,
   **entonces** se me confirma que el perfil está guardado con la misma confirmación de un alta
   que salió a la primera, sigo al próximo paso del alta, el perfil no queda duplicado y el alta
   terminada se cuenta una vez.
2. **Dado** ese mismo caso, **cuando** reintento, **entonces** ese reintento no se cuenta como una
   edición del perfil.
3. **Dado** que el guardado llegó, la respuesta se perdió y cambié un campo antes de reintentar,
   **cuando** reintento, **entonces** el perfil queda con lo que está en pantalla, con el cambio.
4. **Dado** que al editar un guardado llegó y la respuesta se perdió, **cuando** reintento,
   **entonces** se me confirma que los cambios quedaron guardados y el perfil queda con lo que está
   en pantalla.
5. **Dado** que la respuesta de un guardado llega después de que ya vi el aviso de no guardado,
   **cuando** llega, **entonces** la pantalla no cambia sola ni me saca de donde estoy; lo que
   cambié mientras tanto sigue ahí y reintentar lo resuelve.

---

### User Story 3 - Volver a mitad del alta encuentra la zona elegida (Priority: P3)

Una persona empieza el alta, elige departamento y localidad, y la página se recarga —o cierra la
pestaña y vuelve más tarde en el mismo navegador—. Encuentra su nombre, su departamento, su
localidad y la marca de rescatista o refugio como los dejó. La foto la vuelve a elegir.

**Why this priority**: es KL-024, con la misma raíz: el alta vuelve a pedir lo que la persona ya
escribió y «se siente precaria» (docs/11 §Producto). Menos grave que US1 porque no corta el paso,
pero es la misma promesa.

**Independent Test**: con una persona sin perfil, escribir el nombre, elegir un departamento,
escribir o elegir una localidad y marcar rescatista; recargar. Los cuatro siguen como se dejaron.
Cerrar sesión y entrar con otra persona en ese navegador: su formulario arranca sin nada de lo
anterior.

**Acceptance Scenarios**:

1. **Dado** que elegí departamento y localidad en el alta, **cuando** recargo la página o vuelvo a
   ella en el mismo navegador, **entonces** el nombre, el departamento, la localidad y la marca de
   rescatista o refugio siguen elegidos, y la localidad sigue siendo la misma aunque su lista de
   sugerencias dependa del departamento.
2. **Dado** que había elegido una foto antes de recargar, **cuando** vuelvo, **entonces** la foto
   no está: el lugar de la foto aparece como en un alta sin foto, sin mensaje de error.
3. **Dado** que empecé el alta, recargué y después cerré sesión, **cuando** otra persona entra
   desde ese navegador, **entonces** su formulario arranca sin nada de lo mío.
4. **Dado** que empecé el alta con una cuenta y en ese navegador entra otra cuenta sin que la
   primera haya cerrado sesión (por ejemplo, porque la sesión venció o se eligió entrar con otra
   cuenta), **cuando** esa otra cuenta abre su alta, **entonces** no ve nada de lo que escribió la
   primera.
5. **Dado** que el navegador no deja guardar nada localmente, **cuando** recargo a mitad del alta,
   **entonces** el formulario arranca vacío, sin error, como desde otro dispositivo.
6. **Dado** que entré con Google, mi nombre llegó escrito y vuelvo a mitad del alta con un
   borrador que tiene el nombre vacío, **cuando** se abre el formulario, **entonces** sigue el
   nombre que trajo Google, como hasta ahora; lo que yo sí elegí (departamento, localidad, marca)
   sigue elegido.

---

### User Story 4 - Medir los guardados que fallan y los que se recuperan (Priority: P4)

El producto quiere saber cuánto pega la mala señal en el alta y en la edición: cuántos guardados
del perfil no llegan, por qué motivo, y cuántos se completan después de reintentar.

**Why this priority**: no cambia lo que la persona ve, pero sin esto no se sabe si el problema que
esta historia arregla existía en la práctica ni si el arreglo funciona. Depende de US1.

**Independent Test**: recorrer US1-AS1 y US1-AS2 y ver en la medición un guardado fallido «sin
conexión, alta» y un guardado recuperado «alta»; recorrer US1-AS4 y ver uno fallido «no respondió».
Ningún evento lleva nombre, dirección, zona ni ningún dato de la persona.

**Acceptance Scenarios**:

1. **Dado** que un guardado no llega, **cuando** se registra, **entonces** la medición anota un
   guardado del perfil fallido con su motivo (sin conexión o el sitio no respondió) y si fue en el
   alta o al editar, sin ningún dato de la persona.
2. **Dado** que un guardado falló sin conexión, **cuando** la conexión vuelve con la pantalla
   abierta o el reintento llega, **entonces** ese fallo queda anotado aunque en el momento no
   hubiera cómo mandarlo.
3. **Dado** que reintento varias veces sin conexión, **cuando** se anota, **entonces** cada toque
   de guardar o reintentar que no llegó cuenta como un fallo, con su motivo.
4. **Dado** que después de uno o más fallos el perfil se guarda, **cuando** se anota, **entonces**
   la medición registra un guardado recuperado tras reintentar, en el alta o al editar, una sola
   vez.
5. **Dado** cualquier recorrido de esta historia, **cuando** termina el alta, **entonces**
   «Creación de cuenta terminada» se disparó exactamente una vez para esa cuenta.

---

### Edge Cases

- **La sesión se cerró mientras escribía**: al guardar, el aviso dice que la sesión se cerró y
  ofrece entrar de nuevo; en el alta, lo que está en el borrador sigue ahí al volver a entrar con
  la misma cuenta en ese navegador (FR-008).
- **Se toca reintentar mientras el reintento anterior está en curso**: no pasa nada nuevo; el
  botón está ocupado como en cualquier guardado (FR-022a de la historia #9).
- **La conexión vuelve sola**: no se guarda nada solo; el aviso se queda hasta que la persona toca
  reintentar o guardar (decisión 2026-09-26, product-owner).
- **La foto falla y la conexión no**: un problema de la foto sigue diciéndose como un problema de
  la foto, como hasta ahora, no como una falla de conexión.
- **Guardado fallido y después éxito**: al guardar bien, el aviso de no guardado desaparece, el
  borrador se borra y se confirma el guardado como siempre.
- **Recargar al editar un perfil ya completo**: vuelve a lo guardado, como hoy; lo que se cambió
  y no se guardó se pierde, con el aviso de cambios sin guardar antes de recargar. El borrador es
  solo del alta.
- **Recargar sin conexión**: el sitio no funciona sin conexión (fuera de esta historia); al volver
  a cargar con conexión, en el alta el borrador sigue ahí.
- **Varias pestañas del alta abiertas**: cada una muestra lo que tiene en pantalla; el borrador
  queda con lo último que se escribió en cualquiera de ellas.
- **Guardado que llegó en otra pestaña**: si el alta ya se terminó en otra pestaña y en esta se
  toca guardar, se confirma como un alta ya hecha (US2-AS1), no como un error.
- **Recargar después de un guardado que llegó sin respuesta**: en vez de reintentar, la persona
  recarga el alta; como el alta ya está terminada, llega a «Mi perfil» como hoy, con su perfil
  guardado, y el borrador se descarta (FR-016). El alta ya se contó una vez; no se cuenta de nuevo.
- **Un solo aviso a la vez**: si el motivo cambia entre dos intentos (primero sin conexión,
  después el sitio no respondió), el aviso muestra el motivo del último intento, sin acumular.

## Requirements *(mandatory)*

### Functional Requirements

#### No perder lo escrito cuando el guardado no llega

- **FR-001**: Un guardado del perfil que no llega, en el alta o al editar, NO DEBE llevar a la
  pantalla «Algo se rompió» ni a «No pudimos traer tu perfil», y NO DEBE borrar ni cambiar nada de
  lo escrito: nombre, foto elegida o quitada, departamento, localidad y la marca de rescatista o
  refugio quedan como estaban.
- **FR-002**: El producto DEBE mostrar el aviso de no guardado junto al botón de guardar, en el
  mismo lugar en el alta y al editar, y DEBE distinguir dos motivos con dos textos: **sin
  conexión** y **el sitio no respondió**. Los dos dicen que lo escrito sigue ahí y ofrecen
  reintentar. El aviso DEBE anunciarse a quien usa un lector de pantalla en el momento en que
  aparece, como los errores de guardado de hoy.
- **FR-003**: Un guardado que no recibe respuesta en 30 segundos DEBE tratarse como «el sitio no
  respondió»: el botón deja de estar ocupado y aparece el aviso. Una falla que el sitio contesta
  sin que sea un rechazo de los datos (no pudo guardar) también cuenta como «el sitio no
  respondió».
- **FR-004**: Reintentar DEBE mandar exactamente lo que está en pantalla en el momento de tocarlo,
  incluidos los cambios hechos después del fallo y la foto elegida. Tocar el botón de guardar
  después de un fallo equivale a reintentar.
- **FR-005**: Debe haber un solo aviso de no guardado a la vez: un nuevo intento reemplaza el
  aviso anterior en vez de sumarse, y un guardado que sale bien lo saca.
- **FR-006**: Un campo que falta o un dato inválido DEBE seguir mostrándose debajo de su campo,
  antes de mandar nada, como hasta ahora, aunque no haya conexión; nunca como falla de conexión.
- **FR-007**: Mientras haya un guardado fallido sin resolver, la pantalla tiene cambios sin
  guardar: salir de ella DEBE avisar como con cualquier cambio sin guardar (FR-023 de la historia
  #9).
- **FR-008**: Si la sesión se cerró al guardar, el aviso DEBE decir que hay que volver a entrar,
  no que falló la conexión, y DEBE ofrecer entrar de nuevo con un toque, volviendo después a la
  misma pantalla. En el alta, al volver con la misma cuenta el borrador sigue ahí: una sesión que
  se cierra sola no lo borra, solo cerrar sesión a propósito. Al editar, lo cambiado y no guardado
  no se conserva, y salir a entrar de nuevo avisa antes, como cualquier cambio sin guardar.
- **FR-009**: Una respuesta que llega después de que se mostró el aviso de no guardado NO DEBE
  cambiar la pantalla por su cuenta ni sacar a la persona de ella.
- **FR-010**: El producto NO DEBE reintentar solo cuando vuelve la conexión: reintentar es siempre
  un toque de la persona.

#### Reintentar sin duplicar

- **FR-011**: Guardar el perfil DEBE poder repetirse sin crear nada dos veces: si un guardado ya
  había llegado, el reintento deja el perfil con lo último que se mandó, hay un solo perfil por
  cuenta y una sola foto de perfil.
- **FR-012**: Si un guardado desde la pantalla del alta encuentra que el alta ya estaba terminada
  (por un intento anterior cuya respuesta se perdió, o desde otra pestaña), DEBE guardar lo que
  está en pantalla, confirmarlo como un alta («Perfil guardado») y seguir al mismo próximo paso
  que un alta que sale a la primera.
- **FR-013**: «Creación de cuenta terminada» DEBE dispararse exactamente una vez por cuenta, por
  más reintentos que haya; un guardado desde la pantalla del alta sobre un alta ya terminada (FR-012)
  NO DEBE contarse como «Perfil editado».

#### El borrador del alta

- **FR-014**: En el alta, el borrador DEBE conservar nombre, departamento, localidad y la marca de
  rescatista o refugio, y al recargar o volver a la pantalla en el mismo navegador los cuatro
  DEBEN aparecer como se dejaron, la localidad incluida aunque sus sugerencias dependan del
  departamento.
- **FR-015**: La foto elegida NO DEBE guardarse en el navegador: sobrevive a un guardado que
  falla mientras la pantalla está abierta, y no a una recarga.
- **FR-016**: El borrador DEBE ser de la cuenta que lo escribió: otra cuenta que entre en ese
  navegador, por el camino que sea, NO DEBE verlo nunca, y el borrador de la anterior se descarta en
  cuanto esa otra cuenta abre el alta o «Mi perfil». Se borra también al guardar bien, al cerrar sesión, al borrar la
  cuenta y cuando la pantalla del alta encuentra que el alta ya estaba terminada (por ejemplo, un
  guardado que llegó sin respuesta y una recarga después). Lo que marca a qué cuenta pertenece el
  borrador NO DEBE ser un dato que identifique a la persona, como su correo o su nombre.
- **FR-017**: Si el navegador no deja guardar nada localmente, el alta DEBE funcionar igual, con
  el formulario arrancando vacío al recargar y sin mostrar error.
- **FR-018**: Al editar un perfil ya completo no hay borrador: lo que vale al recargar es lo
  guardado (FR-021 de la historia #9 no cambia).

#### Medición

- **FR-019**: El producto DEBE registrar, sin datos que identifiquen a la persona, dos momentos
  nuevos:
  - **Guardado del perfil fallido**: cada toque de guardar o reintentar que no llega, con su
    motivo (sin conexión, el sitio no respondió), si fue en el alta o al editar, y si es el
    primer fallo de esa visita a la pantalla. Una **visita** va desde que la pantalla se abre
    hasta que se cierra, se recarga o se sale de ella.
  - **Guardado del perfil recuperado**: el perfil se guarda después de uno o más fallos en la
    misma visita, con si fue en el alta o al editar; una vez por visita.
- **FR-020**: Un fallo sin conexión DEBE quedar anotado cuando vuelve la conexión con la pantalla
  abierta o cuando llega el siguiente guardado, aunque en el momento del fallo no hubiera cómo
  mandarlo. Si la persona cierra la pantalla sin volver a tener conexión, ese fallo puede quedar
  sin anotar (Assumptions).
- **FR-021**: Los eventos de FR-019 NO DEBEN dispararse siempre en el mismo instante que otro
  evento existente (FR-032 de la historia #9): «recuperado» y «Creación de cuenta terminada» pueden
  coincidir en un alta recuperada, pero no en un alta que sale a la primera.

#### Privacidad

- **FR-022**: Lo escrito y no guardado vive solo en el navegador de la persona; esta historia NO
  DEBE mandar ni guardar ningún dato personal nuevo en ningún lado. Los eventos de medición no
  llevan nombre, correo, zona ni foto.

### Key Entities

- **Borrador del alta**: lo escrito y no guardado en el alta, en un solo navegador y atado a una
  cuenta: nombre, departamento, localidad, marca de rescatista o refugio. Nace al escribir, se
  borra al guardar bien, al cerrar sesión, al borrar la cuenta, cuando otra cuenta abre el alta o
  «Mi perfil», o al encontrar el alta ya terminada, y no lo ve ninguna otra cuenta (FR-016).
- **Aviso de no guardado**: el estado de la pantalla después de un guardado que no llegó: el
  motivo del último intento y la acción de reintentar. Vive mientras la pantalla está abierta.
- **Guardado del perfil fallido / recuperado**: los dos eventos de medición nuevos, con motivo y
  momento (alta o edición), sin datos de la persona.

## Pantallas

- **Completar perfil (alta)**: suma el aviso de no guardado, con su motivo y la acción de
  reintentar, junto al botón de guardar. Cargando: el botón ocupado mientras guarda, como hoy.
  Vacío: no aplica, es un formulario. Error: el aviso de no guardado (sin conexión, no respondió o
  sesión cerrada), con lo escrito intacto.
- **Mi perfil (editar)**: el mismo aviso, en el mismo lugar, con los mismos estados. Vacío: no
  aplica.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de los guardados del perfil que no llegan, en el alta y al editar, la
  persona sigue en la misma pantalla con todo lo escrito, foto incluida, y ve el aviso con el
  motivo correcto; nunca ve «Algo se rompió» ni «No pudimos traer tu perfil».
- **SC-002**: Una persona puede completar el alta después de un corte con un solo toque de
  reintentar, sin volver a escribir ni elegir nada.
- **SC-003**: Con el sitio sin responder, el aviso aparece a lo sumo 30 segundos después de tocar
  guardar.
- **SC-004**: Al recargar a mitad del alta, 4 de 4 campos del borrador (nombre, departamento,
  localidad, marca) vuelven como se dejaron; 0 de ellos aparecen en otra cuenta que entre en ese
  navegador.
- **SC-005**: Por cada cuenta, «Creación de cuenta terminada» se registra exactamente una vez,
  haya habido o no reintentos, y ningún reintento de un alta ya guardada se registra como edición.
- **SC-006**: La medición permite leer, por motivo y por momento (alta o edición), cuántos
  guardados del perfil fallaron, en cuántas visitas hubo al menos un fallo, y en qué proporción de
  esas visitas el perfil terminó guardado después de reintentar.

## Assumptions

- **Alcance reducido por lo ya construido**: ver «Ya construido» arriba. La validación antes de
  mandar, el botón ocupado, el aviso de cambios sin guardar, la limpieza del borrador al cerrar
  sesión y al borrar la cuenta y el formulario vacío sin almacenamiento ya existen; esta
  historia los conserva y solo los prueba donde su conducta cambia.
- **30 segundos** es el tiempo que se espera una respuesta antes de decir que el sitio no
  respondió. Motivo: la foto ya viaja achicada, y en un celular con señal mala un guardado normal
  tarda pocos segundos; 30 da margen sin dejar a la persona mirando un botón ocupado sin fin.
- **La respuesta tardía no navega** (FR-009): si llegara y moviera a la persona de pantalla, podría
  perder un cambio hecho después del aviso. Reintentar lo resuelve sin riesgo (FR-011, FR-012).
- **El borrador atado a la cuenta** (FR-016) es más estricto que lo que pide la historia (que se
  borre al cerrar sesión o borrar la cuenta): cubre también la sesión que vence y el camino
  «Entrar con esa cuenta» sin cerrar sesión antes. No suma ningún dato nuevo; solo evita que el
  nombre y la zona de una persona le aparezcan a otra en un navegador compartido.
- **Fallos sin anotar**: un fallo sin conexión que nunca vuelve a tener conexión con la pantalla
  abierta puede no contarse (FR-020). Se acepta: el fallo que más importa medir es el que se
  recupera o se repite, y medir más exigiría guardar eventos en el navegador entre visitas.
- **Una edición reintentada puede contarse dos veces** como «Perfil editado» si el primer
  guardado llegó y su respuesta se perdió. La historia pide contar una vez el alta, no la edición;
  distinguir una edición repetida de dos ediciones pediría guardar algo nuevo por cada guardado. El
  evento «Guardado del perfil recuperado» permite descontar ese ruido al leer la medición.
- **Sesión cerrada** (FR-008) usa el mismo sentido que el aviso de sesión de verificar teléfono:
  hay que volver a entrar; esta historia no agrega un camino nuevo para entrar.
- **Fuera de esta historia**, como dice la historia: guardar solo cuando vuelve la conexión, que
  el sitio funcione sin conexión, conservar la foto después de recargar, retomar lo escrito desde
  otro dispositivo, otros formularios del sitio y el foco en el primer campo que falta (KL-026).
- **KL-024** se resuelve con esta historia y su entrada se borra de las limitaciones conocidas en
  el mismo PR (decisión 2026-09-26, product-owner).
