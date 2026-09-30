# Feature Specification: Aval entre personas y perfil público con niveles de verificación

**Feature Branch**: `feature/12-aval-y-perfil-publico`

**Created**: 2026-09-28

**Status**: Draft

**Input**: Historia #12 del backlog, milestone «M1 - Cuentas y confianza». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (historias #9, #10, #11, #25 y #53): el cálculo de los niveles 1 y 2 —nivel 1 es
el teléfono verificado; nivel 2, nivel 1 más la identidad verificada; sin nivel 1 la cuenta baja a
0 aunque tenga la identidad, y vuelve a 2 al confirmar un teléfono—; «Mi perfil» y la pantalla de la
verificación de identidad aprobada, que hoy dicen el nivel solo en texto; la regla de contacto del
nombre y la localidad del perfil, que hoy frena teléfonos de 9 o más dígitos, correos y enlaces
web; la regla de contacto de los datos de un animal (historia #53, su FR-014), más estricta; y el
aviso, al completar y al editar el perfil, de que el nombre, la foto y la zona van a ser públicos.
Esta spec no rehace nada de eso: suma el nivel 3 y el aval que lo da, el perfil público, el
distintivo de cada nivel en las tres pantallas, y lleva al perfil la regla de contacto de la ficha.
No existen todavía, en ningún lado del sitio, el perfil público, los avales ni el distintivo.

**Vocabulario de esta spec**: un **aval** es la palabra de una persona que responde por otra; quien
lo da **avala** y quien lo recibe está **avalada**. Un aval está **vigente** desde que se da hasta
que quien lo dio lo **retira**, quien lo recibió lo **quita**, o una de las dos cuentas se borra.
Un aval vigente **cuenta** solo mientras quien lo dio y quien lo recibió tienen, las dos, nivel 2 o
más; un aval vigente que no cuenta está **en pausa**, y vuelve a contar solo, sin que nadie haga
nada, cuando las dos lo vuelven a tener. **Nivel 1**, **nivel 2**, **número a medias** y **número
perdido** significan lo mismo que en las specs de las historias #10, #11 y #25. **Nivel 3** es nivel
2 más al menos un aval que cuenta. El **nivel** de una persona es siempre el más alto que alcanza
hoy; cada nivel incluye los anteriores. Un **distintivo** es la chapita que muestra el nivel. El
**perfil público** es la página de una persona que cualquiera puede abrir con su enlace, sin
ingresar. Un **perfil completo** es el que terminó el alta (historia #9): tiene nombre y zona. La
**zona** es departamento más localidad, como en el perfil. Una **vía de contacto** es un teléfono,
un correo, un enlace o un usuario de una red, con la regla de FR-020. La **dueña** de un perfil es
la persona de esa cuenta; quien lo **mira** es cualquier otra persona, con o sin sesión.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mostrar hasta dónde me verifiqué con un enlace (Priority: P1)

Una rescatista con el perfil completo copia desde «Mi perfil» el enlace a su perfil público y lo
manda por WhatsApp. Quien lo abre, sin ingresar, ve su nombre, su foto, su zona, el distintivo de
su nivel, si es rescatista o refugio y desde qué mes y año está en el sitio; al tocar el
distintivo, ve qué pide ese nivel y qué dice de ella. La dueña ve el mismo distintivo en «Mi
perfil» y en la pantalla de su verificación de identidad aprobada, con el día exacto en que se
verificó.

**Why this priority**: es la pantalla donde todo lo anterior se vuelve visible. Sin perfil
público, verificarse no tiene ninguna consecuencia que el resto pueda ver, y sin él no hay dónde
mostrar un aval. Es también lo que reemplaza el «¿alguien conoce a esta persona?» del grupo.

**Independent Test**: con personas sembradas en nivel 0, 1 y 2: la de nivel 2 abre «Mi perfil»,
ve el distintivo de nivel 2 con el día en que se verificó, copia el enlace; en otro navegador sin
sesión se abre el enlace y se ve su nombre, foto, zona, el distintivo de nivel 2 con el mes y el
año, la marca de rescatista si la tiene y el mes y año de alta, y nada de su correo, su teléfono
ni su documento. Los perfiles de las de nivel 1 y 0 se ven con el distintivo de nivel 1 y sin
distintivos. Un enlace inventado, el de una cuenta borrada y el de una cuenta con el perfil sin
completar muestran la misma pantalla «este perfil no existe».

**Acceptance Scenarios**:

1. **Dado** que tengo el perfil completo, **cuando** copio el enlace a mi perfil público desde «Mi
   perfil» y otra persona lo abre, **entonces** ve mi nombre, foto, zona, distintivo, si soy
   rescatista o refugio y el mes y año en que creé la cuenta, sin que se le pida ingresar.
2. **Dado** que miro un perfil, **cuando** toco su distintivo, **entonces** veo qué pide ese nivel
   y qué dice de la persona, junto a lo que piden los otros niveles.
3. **Dado** que me verificaron la identidad, **cuando** abro «Mi perfil» o la pantalla de mi
   verificación aprobada, **entonces** veo el distintivo de mi nivel, el mismo que ven los demás en
   mi perfil público, con el día en que me verifiqué.
4. **Dado** que me verificaron la identidad el 14 de agosto de 2026, **cuando** otra persona abre mi
   perfil público, **entonces** ve el distintivo de nivel 2 con «agosto de 2026», no el día.
5. **Dado** que una persona tiene solo el teléfono verificado, **cuando** alguien abre su perfil,
   **entonces** ve el distintivo de nivel 1 y ninguno más, no un perfil roto.
6. **Dado** que una persona todavía no tiene ningún nivel, **cuando** alguien abre su perfil,
   **entonces** ve el perfil sin distintivo y que todavía no se verificó.
7. **Dado** que abro un enlace de un perfil que no existe, de una cuenta borrada o de una cuenta con
   el perfil sin completar, **cuando** carga, **entonces** veo «este perfil no existe» y cómo volver
   al inicio, igual en los tres casos.
8. **Dado** que estoy en «Mi perfil», **cuando** toco ver mi perfil público, **entonces** lo veo
   exactamente como lo ven los demás, sin la opción de avalarme.
9. **Dado** que una persona cambió de teléfono y todavía no confirmó el nuevo, **cuando** alguien
   abre su perfil, **entonces** ve el nivel que tiene hoy, sin ningún motivo de por qué.

---

### User Story 2 - Que el perfil no deje el contacto a la vista (Priority: P2)

Con el perfil a la vista de cualquiera, un teléfono en el nombre rompe «teléfono y contacto nunca
públicos». Al completar o al editar el perfil, el nombre y la localidad rechazan lo mismo que el
nombre y la descripción de la ficha de un animal —teléfonos, también fijos de 8 dígitos; correos;
enlaces, también de WhatsApp, Telegram y acortadores; y usuarios de redes—, y se explica por qué.

**Why this priority**: el perfil público (US1) expone lo que la persona escribió en su perfil. La
regla es chica y se prueba sola, pero es la que sostiene la regla de privacidad del producto en la
pantalla nueva; va antes que los avales.

**Independent Test**: con una persona sembrada, editar el perfil y escribir «Juan 099 123 456»,
«fijo 2401 2345», «t.me/juanrescata» o «@juanrescata» en el nombre o en la localidad y guardar: no
se guarda, lo escrito sigue en pantalla, el campo dice qué se encontró y que el contacto se da
recién cuando se acepta una solicitud. «Villa 25 de Agosto» y «Ruta 8 km 25» se guardan.

**Acceptance Scenarios**:

1. **Dado** que edito mi perfil, **cuando** escribo «Juan 099 123 456», «fijo 2401 2345»,
   «t.me/juanrescata» o «@juanrescata» en el nombre o en la localidad y guardo, **entonces** no se
   guarda, lo que escribí sigue en pantalla y se me explica que el contacto se da recién cuando se
   acepta una solicitud.
2. **Dado** que completo el perfil por primera vez, **cuando** escribo un correo en el nombre,
   **entonces** se rechaza igual que al editar.
3. **Dado** que escribo «Villa 25 de Agosto» en la localidad, **cuando** guardo, **entonces** se
   guarda.
4. **Dado** que escribo una dirección con número de puerta en la localidad, **cuando** guardo,
   **entonces** no se guarda y se me dice que ahí va la zona, nunca una dirección.
5. **Dado** que estoy editando mi perfil, **cuando** miro el nombre y la localidad antes de
   escribir, **entonces** se me dice que los ve cualquiera y que no lleven contacto.

---

### User Story 3 - Avalar a alguien en quien confío, y retirarlo (Priority: P3)

Un rescatista conocido, con la identidad verificada, recibe por WhatsApp el enlace al perfil de
alguien que conoce. Lo abre, toca «Avalar», confirma que su nombre va a aparecer en ese perfil como
quien responde por ella, y ella pasa a nivel 3 con su nombre a la vista. Si después se arrepiente,
retira el aval desde el mismo perfil, sin que ella tenga que aceptarlo.

**Why this priority**: es el nivel que más vale y la razón de la historia; pero se muestra en el
perfil público (US1), así que va después.

**Independent Test**: con dos personas sembradas en nivel 2, A y B: A abre el perfil de B, avala y
confirma; el perfil de B, abierto sin sesión, muestra el distintivo de nivel 3 y el nombre de A con
el enlace a su perfil. A retira el aval: el nombre desaparece y B vuelve a nivel 2. B intenta
avalar a A mientras A la avala: no puede y se le dice por qué. Con A en nivel 1, avalar le explica
que hace falta verificar la identidad y le ofrece hacerlo.

**Acceptance Scenarios**:

1. **Dado** que tengo nivel 2, **cuando** abro el perfil de otra persona con nivel 2 y la avalo,
   **entonces** ella pasa a nivel 3 y su perfil muestra mi nombre como quien la avala.
2. **Dado** que ya avalé a una persona, **cuando** abro su perfil, **entonces** veo que ya la avalo
   y la opción de retirar el aval, no la de avalar otra vez.
3. **Dado** que avalé a alguien, **cuando** retiro el aval, **entonces** mi nombre deja de aparecer
   en su perfil y, si era su único aval que contaba, baja a nivel 2.
4. **Dado** que una persona tiene 2 avales que cuentan, **cuando** se retira uno, **entonces** sigue en nivel 3
   y su perfil muestra solo el que queda.
5. **Dado** que no tengo nivel 2, **cuando** intento avalar a alguien, **entonces** se me explica
   que para avalar hace falta verificar la identidad y se me ofrece el paso que me falta.
6. **Dado** que la persona que quiero avalar no tiene nivel 2, **cuando** abro su perfil,
   **entonces** se me dice que todavía no puede recibir avales porque no verificó su identidad.
7. **Dado** que estoy en mi propio perfil público, **cuando** lo miro, **entonces** no tengo la
   opción de avalarme.
8. **Dado** que una persona me avala, **cuando** intento avalarla yo, **entonces** no puedo, y se me
   dice que no se puede avalar a quien te avala.
9. **Dado** que no ingresé, **cuando** toco avalar desde un perfil, **entonces** se me pide ingresar
   y al hacerlo vuelvo a ese perfil, sin que el aval se dé solo.
10. **Dado** que quien me avaló cambió de teléfono y todavía no confirmó el nuevo, **cuando**
    alguien mira mi perfil, **entonces** ese aval no aparece ni cuenta, y cuando lo confirma vuelve a
    aparecer sin que nadie haga nada.
11. **Dado** que una persona borró su cuenta, **cuando** alguien abre el perfil de alguien a quien
    ella avalaba, **entonces** su aval ya no aparece ni cuenta.
12. **Dado** que toco «Avalar» dos veces seguidas o reintento después de una falla, **cuando**
    termina, **entonces** hay un solo aval.

---

### User Story 4 - Ver mis avales y quitar uno que no quiero (Priority: P4)

Desde «Mi perfil», la persona abre «Mis avales»: a quién avaló, con la opción de retirar cada aval,
y quién la avala, con la opción de quitarlo de su perfil. Quitar un aval es para siempre: esa
persona no puede volver a avalarla. Si no tiene avales, se le explica qué es un aval y cómo pedirlo
mandando el enlace a su perfil.

**Why this priority**: completa el control de cada persona sobre su nombre en público —nadie carga
con el nombre de alguien que no eligió—, pero necesita que existan avales (US3).

**Independent Test**: con A que avala a B, las dos en nivel 2: B abre «Mis avales», ve a A entre
quienes la avalan, lo quita y confirma: el nombre de A desaparece del perfil de B, B vuelve a nivel
2, y A, al abrir el perfil de B, ve que ese aval ya no se puede dar. A abre «Mis avales» y ya no ve
a B. Con una persona sin avales, «Mis avales» muestra los dos vacíos con la explicación.

**Acceptance Scenarios**:

1. **Dado** que alguien me avaló, **cuando** quito ese aval desde «Mis avales» y confirmo,
   **entonces** su nombre deja de aparecer en mi perfil y, si era el único que contaba, bajo a
   nivel 2.
2. **Dado** que quité de mi perfil el aval de una persona, **cuando** ella intenta avalarme de nuevo,
   **entonces** no puede, y se le dice que ese aval ya no se puede dar.
3. **Dado** que avalé a varias personas, **cuando** abro «Mis avales», **entonces** veo a cada una
   con la opción de retirar mi aval, y retirar uno desde ahí es lo mismo que hacerlo desde su
   perfil.
4. **Dado** que tengo nivel 2, no avalé a nadie y nadie me avala, **cuando** abro «Mis avales»,
   **entonces** veo «No avalaste a nadie todavía» y «Nadie te avala todavía», con qué significa un
   aval y cómo pedirlo mandando el enlace a mi perfil.
5. **Dado** que no tengo nivel 2 y nadie me avala, **cuando** abro «Mis avales», **entonces** veo
   «Nadie te avala todavía» con qué significa un aval y que para recibirlo antes tengo que verificar
   mi identidad, con el paso que me falta, y no se me invita a pedir un aval.
6. **Dado** que un aval que di o recibí está en pausa, **cuando** abro «Mis avales», **entonces** lo
   veo marcado como que no cuenta por ahora, y puedo retirarlo o quitarlo igual.

---

### Edge Cases

- **Un aval en pausa por quien lo dio**: quien avaló cambió de teléfono y no confirmó el nuevo, o
  perdió el número (historia #25). Su aval deja de contar y de mostrarse en el perfil de la
  avalada; si era el único que contaba, ella baja a nivel 2. Cuando quien avaló vuelve a nivel 2,
  el aval vuelve a contar y a mostrarse, sin que nadie haga nada.
- **Un aval en pausa por quien lo recibió**: la avalada perdió el nivel 2. Sus avales no cuentan
  ni se muestran —su nivel ya es 1 o 0—, y vuelven solos cuando lo recupera.
- **Quien no tiene nivel 2 y tiene avales dados**: puede verlos y retirarlos en «Mis avales»; no
  puede dar uno nuevo.
- **Avalar a quien te avala**: no se puede mientras el aval de la otra esté vigente, aunque esté en
  pausa. Si la otra lo retira, se puede.
- **Volver a avalar después de retirar**: se puede; es un aval nuevo, con su propia fecha.
- **Volver a avalar después de que te quitaron**: nunca, a esa misma persona. Quitar no impide que
  la persona que quitó el aval avale después a quien se lo había dado.
- **El estado cambia con la pantalla abierta** (la otra persona perdió el nivel 2, ya me avaló, me
  quitó un aval, borró su cuenta; yo perdí el nivel 2 en otra pestaña): al confirmar, el aval no se
  da y se dice el motivo de hoy, con los mismos textos que al abrir el perfil; si la otra borró su
  cuenta, la pantalla pasa a «este perfil no existe» (FR-013).
- **Dos personas que se avalan entre ellas al mismo tiempo**: queda a lo sumo uno de los dos
  avales; la otra ve que no se puede avalar a quien te avala. Al retirar o quitar un aval que ya
  no existe, se dice que ese aval ya no estaba y la pantalla se actualiza; no es un error.
- **La sesión vence entre abrir la confirmación y confirmar**: el aval no se da; se pide ingresar y
  se vuelve a ese perfil, como sin sesión (FR-016).
- **Avalar sin conexión o sin respuesta del sitio**: se dice que el aval no se dio y por qué, y se
  ofrece reintentar; reintentar nunca da dos avales.
- **Ingresar para avalar con el perfil sin completar**: el alta pide completarlo primero, como
  siempre (historia #9), y después vuelve al perfil que se estaba mirando.
- **Ingresar para avalar y resultar ser la dueña** del perfil que se miraba: vuelve a su perfil
  público, sin opción de avalarse.
- **Muchos avales**: no hay tope. El perfil muestra a todos los que cuentan, del más reciente al más
  viejo, y con 50 cumple igual el presupuesto de la pantalla (SC-006).
- **Quien avala cambia su nombre o su foto**: el perfil de la avalada muestra el nombre de hoy.
- **La dueña edita su perfil**: el enlace sigue siendo el mismo y muestra lo nuevo.
- **Cuenta borrada**: su perfil pasa a «este perfil no existe», sus avales dados desaparecen de los
  perfiles de los demás —quien baja de nivel por eso, baja—, los recibidos y los quitados se borran
  con ella. El enlace de una cuenta borrada nunca pasa a mostrar a otra persona.
- **Perfil sin foto**: se muestran las iniciales, como en «Mi perfil».
- **Nivel 2 que se pierde y se recupera**: el distintivo de nivel 2 vuelve con el mismo mes y año en
  que se verificó la identidad, no con el de la recuperación.
- **Sin nivel por un número perdido o un cambio a medias**: el perfil dice que la persona todavía no
  se verificó, igual que a quien nunca se verificó; nunca dice por qué.
- **Perfiles guardados antes de la regla de contacto** (FR-020): no se revisan; la regla se aplica
  la próxima vez que la persona guarda su perfil. El sitio todavía no tiene personas reales.
- **Contacto disfrazado** («juan arroba gmail punto com», el número en palabras): no se detecta,
  igual que en la ficha. La regla frena lo común, no a quien quiere esquivarla.
- **Copiar el enlace cuando el navegador no lo permite**: se muestra el enlace para seleccionarlo y
  copiarlo a mano.
- **Fechas en el borde del mes**: el mes y año de alta y de verificación se calculan en hora de
  Uruguay: una cuenta creada el 31 de agosto a las 23:30 de Uruguay es «agosto».

## Pantallas

Cada pantalla, con su estado vacío, su estado mientras carga o guarda, y su estado de error, con
los mismos criterios que las historias #9 a #11.

- **Perfil público**.
  - *Contenido*: nombre, foto o iniciales, zona, el distintivo del nivel de hoy, «Identidad
    verificada en agosto de 2026» si tiene nivel 2 o más, «Rescatista o refugio» si lo marcó, «En el
    sitio desde septiembre de 2026», y, en nivel 3, quién la avala: el nombre de cada persona cuyo
    aval cuenta, con el enlace a su perfil. Debajo, el lugar de avalar (FR-011), que cambia según
    quién mira.
  - *Vacío*: sin nivel, en lugar del distintivo dice que esa persona todavía no se verificó; sin
    avales que cuenten, no muestra la sección de avales.
  - *Cargando*: el perfil llega entero de una vez, porque tiene que leerse aunque el navegador no
    ejecute scripts (FR-010); mientras llega, se ve la espera del navegador y no una forma dibujada.
    Mientras se da o se retira un aval, la acción queda ocupada y no admite un segundo toque.
  - *Error*: si el perfil no se pudo traer, se dice y se ofrece reintentar, sin decir si la persona
    existe. Un aval que no se dio o no se retiró dice por qué y ofrece reintentar (Edge Cases).
- **Confirmar un aval, retirarlo o quitarlo**: un aviso que dice qué va a pasar, sin suponer el
  género de nadie —al avalar, que tu nombre va a aparecer en su perfil, a la vista de cualquiera,
  como quien responde por esa persona, y que avales solo a quien conocés; al retirar, que tu nombre
  deja de aparecer en su perfil y, si era su único aval que contaba, baja a nivel 2; al quitar, que
  su nombre deja de aparecer en tu perfil, que esa persona no va a poder volver a avalarte y, si era
  tu único aval que contaba, que bajás a nivel 2— con confirmar y cancelar. Cancelar no cambia nada.
  Vacío: no aplica, porque siempre se abre sobre un aval que existe. Cargando y error: los de la
  acción.
- **Explicación de los niveles**: los tres niveles, qué pide cada uno y qué dice de la persona, con
  el que se tocó a la vista. Se abre sin ingresar. Vacío y cargando: no aplica, es texto fijo. Error:
  el de cualquier página del sitio.
- **Mis avales** (con sesión).
  - *Contenido*: «A quién avalé», cada persona con su nombre, su foto, desde cuándo la avalo, el
    enlace a su perfil y la opción de retirar; «Quién me avala», cada persona igual, con la opción de
    quitar. Un aval en pausa se marca como que no cuenta por ahora (FR-025). Al retirar o quitar un
    aval, su fila desaparece y un aviso dice «Retiraste tu aval» o «Quitaste el aval».
  - *Vacío*: cada lista tiene el suyo, y se muestra aunque la otra tenga filas. «No avalaste a nadie
    todavía», con qué significa avalar, y, si la persona no tiene nivel 2, que para avalar hace falta
    verificar la identidad y cuál es el paso que le falta. «Nadie te avala todavía», con qué significa
    un aval y: con nivel 2 o más, cómo pedirlo mandando el enlace a tu perfil, con la acción de
    copiarlo; sin nivel 2, que para recibir avales antes hace falta verificar la identidad, con el
    paso que le falta, y no la acción de copiar el enlace para pedirlo. La acción del paso que falta
    aparece una sola vez en la pantalla aunque las dos listas estén vacías: una acción no se repite
    con dos botones.
  - *Cargando*: la forma de las dos listas mientras cargan; retirar o quitar deja ocupada esa fila.
  - *Error*: si las listas no se pudieron traer, se dice y se ofrece reintentar; un retiro o una
    quita que no llegó dice por qué y ofrece reintentar.
- **Mi perfil** (cambia): suma el distintivo del nivel de hoy, con el día exacto de la identidad
  verificada si tiene nivel 2 o más; ver mi perfil público; mandar su enlace (compartirlo o
  copiarlo, FR-022); y el acceso a «Mis avales». Al editar, junto al nombre y la localidad, que los ve cualquiera y no llevan contacto.
  *Vacío*: sin nivel, sigue mostrando el paso pendiente de verificar el teléfono, como hoy. Cargando
  y error: los de hoy.
- **Verificación de identidad aprobada** (cambia): suma el distintivo del nivel de hoy junto a
  «Estás en nivel 2» —«nivel 3» si ya lo tiene—. Vacío: no aplica, porque solo existe con la
  identidad aprobada. Cargando y error: los de hoy.
- **Perfil que no existe**: «este perfil no existe» y cómo volver al inicio, igual para un enlace
  inventado, una cuenta borrada y un perfil sin completar. Vacío, cargando y error: no aplican,
  porque es ella misma el resultado de una carga y no trae datos.

## Requirements *(mandatory)*

### Functional Requirements

#### Los niveles

- **FR-001**: El nivel de una persona DEBE ser: 0 sin el teléfono verificado; 1 con el teléfono
  verificado; 2 con nivel 1 y la identidad verificada; 3 con nivel 2 y al menos un aval que cuenta.
  Un aval cuenta solo mientras está vigente y quien lo dio y quien lo recibió tienen, los dos, nivel
  2 o más. Cada nivel incluye los anteriores.
- **FR-002**: El nivel DEBE calcularse siempre con el estado de hoy de las dos personas: cuando
  alguien pierde o recupera el nivel 2, los avales que dio y recibió dejan de contar o vuelven a
  contar en ese momento, sin que nadie haga nada y sin borrarse.
- **FR-003**: El perfil público, «Mi perfil» y la pantalla de la verificación de identidad aprobada
  DEBEN mostrar el mismo nivel, el más alto alcanzado, con el mismo distintivo.

#### El perfil público

- **FR-004**: Toda persona con el perfil completo DEBE tener un perfil público que cualquiera
  puede abrir con su enlace, sin ingresar.
- **FR-005**: El perfil público DEBE mostrar solamente: el nombre; la foto, o las iniciales si no
  tiene; la zona; el distintivo del nivel de hoy; si tiene nivel 2 o más, el mes y el año en que se
  verificó la identidad; si marcó que es rescatista o refugio; el mes y el año en que creó la
  cuenta; y, si tiene nivel 3, el nombre de cada persona cuyo aval cuenta, del más reciente al más
  viejo, con el enlace a su perfil. NUNCA DEBE mostrar, ni llevar escondido en la página, el correo,
  el teléfono, ningún dato ni imagen del documento, el día exacto de la verificación ni de la
  creación de la cuenta, la fecha de un aval, los avales en pausa, los quitados, ni el motivo por el
  que una persona no tiene un nivel.
- **FR-006**: Sin ningún nivel, el perfil DEBE decir, en lugar del distintivo, que la persona
  todavía no se verificó, con el mismo texto sea cual sea el motivo.
- **FR-007**: Un enlace que no corresponde a ningún perfil, el de una cuenta borrada y el de una
  cuenta con el perfil sin completar DEBEN verse exactamente igual: «este perfil no existe» y cómo
  volver al inicio. Nadie DEBE poder distinguir cuál de los tres casos es, ni por lo que ve ni por
  la respuesta del sitio.
- **FR-008**: El enlace al perfil público NO DEBE llevar el correo, el teléfono ni nada que
  permita adivinar el enlace de otra persona o recorrer los perfiles uno por uno: su parte propia
  es al azar y tan larga que probar enlaces a cualquier ritmo posible no encuentra ninguno. NO DEBE cambiar
  cuando la dueña edita su perfil, y el de una cuenta borrada NUNCA DEBE pasar a mostrar a otra
  persona. Nadie DEBE poder ver una lista de perfiles: a un perfil se llega por su enlace o por el
  nombre de quien avala en otro perfil.
- **FR-009**: El perfil público NO DEBE aparecer en buscadores. Si aparece cuando se prenda la
  indexación (M5) lo decide esa historia para los perfiles en particular: prender la indexación del
  sitio NO DEBE volverlos indexables solos. Al compartir el enlace, la vista previa DEBE llevar el
  nombre de la persona y el del sitio, y nada más de ella: ni su foto, ni su zona, ni su nivel, ni
  una imagen hecha para el perfil; puede llevar la imagen general del sitio, si la hay. La de un perfil
  que no existe es la misma en los tres casos de FR-007.
- **FR-010**: El perfil público DEBE leerse entero —todo lo de FR-005— aunque el navegador no
  ejecute scripts.

#### Avalar

- **FR-011**: El perfil público DEBE mostrar, debajo del perfil, un lugar de avalar que depende de
  quién mira, en este orden:
  1. la dueña: nada, ni la opción de avalarse;
  2. sin sesión: «Avalar» si la persona mirada tiene nivel 2 o más, que pide ingresar y vuelve a ese
     perfil sin dar el aval (FR-016); si no lo tiene, nada;
  3. quien mira ya avala a esa persona con un aval vigente: que ya la avala, con la opción de
     retirarlo, sean cuales sean los niveles de las dos; si el aval está en pausa, dice además que
     no cuenta por ahora;
  4. esa persona avala a quien mira con un aval vigente, aunque esté en pausa: que no se puede
     avalar a quien te avala;
  5. esa persona quitó un aval de quien mira: que ese aval ya no se puede dar;
  6. la persona mirada no tiene nivel 2: que todavía no puede recibir avales, porque para recibirlos
     hace falta tener la identidad verificada —dicho como lo que el nivel pide, nunca como el motivo
     por el que esa persona no lo tiene (FR-006)—;
  7. quien mira no tiene nivel 2: que para avalar hace falta tener nivel 2, con el acceso al paso
     que le falta: completar su perfil si no lo completó; verificar el teléfono si no tiene nivel 1
     —y al terminar vuelve a ese perfil—, aunque ya tenga la identidad aprobada, y entonces se le
     dice que con el teléfono vuelve a nivel 2; pedir la verificación de identidad si tiene nivel 1 y no tiene un pedido en revisión,
     o, si lo tiene, que su pedido está en revisión y va a poder avalar cuando se apruebe;
  8. en cualquier otro caso: «Avalar».
- **FR-012**: Avalar DEBE pedir confirmación, diciendo que el nombre de quien avala va a aparecer en
  ese perfil, a la vista de cualquiera, como quien responde por esa persona. Al confirmar, el aval
  DEBE quedar dado en ese momento, la persona avalada DEBE pasar a nivel 3 si no lo tenía, y la
  pantalla DEBE mostrarlo sin recargar. Cancelar no cambia nada.
- **FR-013**: Las reglas de FR-011 DEBEN comprobarse de nuevo al confirmar, con el estado de ese
  momento, no solo al abrir el perfil: nadie se avala a sí mismo; solo avala quien tiene nivel 2 o
  más y solo se avala a quien tiene nivel 2 o más; no se avala a quien te avala mientras ese aval
  esté vigente; no se vuelve a dar un aval que la persona avalada quitó; y no hay dos avales
  vigentes de la misma persona a la misma persona. Si dos personas confirman avalarse entre ellas
  al mismo tiempo, DEBE quedar a lo sumo uno de los dos avales. Si una regla no se cumple, el aval
  NO DEBE darse y la pantalla DEBE decir el motivo con el texto de FR-011 y pasar a mostrar el lugar
  de avalar que corresponde hoy. Si la persona mirada borró su cuenta con la pantalla abierta, el
  aval no se da y la pantalla pasa a «este perfil no existe». Cada regla DEBE poder demostrarse con
  un intento fallido de dar el aval sin pasar por la pantalla.
- **FR-014**: Dos toques seguidos, un reintento o un reintento después de una respuesta perdida
  NUNCA DEBEN dar dos avales. Si avalar no llega por falta de conexión o porque el sitio no
  respondió, DEBE decirse que el aval no se dio y por qué, con un mensaje para cada motivo, y
  ofrecer reintentar.
- **FR-015**: No DEBE haber tope de avales dados ni recibidos por persona.
- **FR-016**: Sin sesión, tocar «Avalar» DEBE pedir ingresar y, al hacerlo en el mismo
  dispositivo, volver al mismo perfil con las reglas de destino de la historia #9. El aval NO DEBE
  darse solo al volver: quien mira ve el lugar de avalar que le corresponde y decide.

#### Retirar y quitar

- **FR-017**: Quien avaló DEBE poder retirar su aval en cualquier momento, desde el perfil de la
  avalada o desde «Mis avales», con confirmación, sin que la otra persona tenga que aceptarlo. Un
  aval retirado se borra: se puede volver a dar después, como uno nuevo.
- **FR-018**: Quien recibió un aval DEBE poder quitarlo de su perfil en cualquier momento, desde
  «Mis avales», con una confirmación que dice que esa persona no va a poder volver a avalarla y que, si era su
  único aval que contaba, baja a nivel 2.
  Un aval quitado deja de existir como aval, y el sitio DEBE recordar solo que esa persona no puede
  volver a avalar a esta. Quitar no se deshace. Si al quitarlo el aval ya no existía porque quien lo
  dio acababa de retirarlo, el sitio DEBE recordar igual que esa persona no puede volver a avalarla:
  la decisión de quien quita no depende de quién llegó primero.
- **FR-019**: Retirar o quitar un aval DEBE sacar el nombre de quien avaló del perfil de la avalada
  en ese momento y, si era el único aval que contaba, bajarla a nivel 2. Retirar o quitar un aval en
  pausa DEBE poder hacerse igual. Retirar o quitar un aval que ya no existe NO DEBE mostrarse como
  un error: la pantalla dice que ese aval ya no estaba y se actualiza.

#### Sin contacto en el perfil

- **FR-020**: El nombre y la localidad del perfil, al completarlo y al editarlo, NO DEBEN aceptar
  una vía de contacto, con la misma regla que el nombre y la descripción de la ficha de un animal
  (historia #53, su FR-014): un **teléfono**, 8 o más dígitos seguidos, contando como seguidos los
  que separa un espacio, un punto o un guion, sin contar una fecha de día, mes y año; un **correo**,
  una arroba entre letras; un **enlace**, una palabra que empieza con «http» o «www» o que tiene un
  punto seguido de com, uy, net u org al final de la palabra o antes de una barra o de otro punto;
  un enlace de WhatsApp, de Telegram o de los acortadores de la lista de la ficha, aunque no lleve
  el número; y un **usuario de una red**, una arroba al principio de una palabra. La localidad
  tampoco DEBE aceptar un número de 3 o más dígitos seguidos, el número de puerta de una dirección,
  igual que la localidad de la ficha. Al rechazar, el producto DEBE marcar el campo, no guardar
  nada, dejar lo escrito en pantalla, decir qué se encontró —un teléfono, un correo, un enlace o un
  usuario de una red— citando el fragmento que lo disparó, y explicar que el contacto se da recién
  cuando se acepta una solicitud; en la localidad con número de puerta, que ahí va el barrio o la
  localidad —con la etiqueta que el campo tiene en ese departamento—, nunca una dirección. Si la
  localidad dispara las dos reglas («fijo 2401 2345»), gana la de contacto. La regla DEBE
  comprobarse al guardar, no solo en pantalla, y ser la misma que la de la ficha campo por campo: un
  texto que el nombre o la descripción de la ficha rechaza por contacto, el nombre y la localidad
  del perfil también, y al revés; una localidad que la ficha rechaza, la del perfil también, y al
  revés.
- **FR-021**: Al completar y al editar el perfil, junto al nombre y la localidad DEBE decirse, antes
  de escribir, que los ve cualquiera y que no lleven contacto.

#### Mi perfil y la verificación aprobada

- **FR-022**: «Mi perfil» DEBE mostrar el distintivo del nivel de hoy y, con nivel 2 o más, el día
  exacto en que se verificó la identidad. DEBE ofrecer ver el perfil público —el mismo que ven los
  demás, sin opción de avalarse— y mandar su enlace con un toque: en un teléfono que tiene la hoja
  de compartir del sistema, ese toque la abre, con WhatsApp y copiar a la vista, y cerrarla sin
  elegir no hace nada; en otro lado, el toque lo copia confirmando que se copió; si el navegador no
  deja copiar, DEBE mostrar el enlace para copiarlo a mano. DEBE dar acceso a «Mis avales» diciendo cuántas personas la avalan hoy —las
  que cuentan, que son las que se ven en su perfil público—, así un aval nuevo se nota sin entrar; si
  tiene avales y ninguno cuenta, dice que ningún aval cuenta por ahora, no que nadie la avala. Sin nivel, sigue mostrando el paso pendiente de verificar el teléfono, como hoy.
- **FR-023**: La pantalla de la verificación de identidad aprobada DEBE mostrar el distintivo del
  nivel de hoy junto a «Estás en nivel 2», o «Estás en nivel 3» si lo tiene, y el día exacto en que
  se verificó la identidad, como hoy. Con la identidad aprobada y sin nivel 1 (un cambio de número a
  medias o un número perdido), la cuenta está en nivel 0: la pantalla no muestra distintivo y sigue
  diciendo, como hoy, que pasa a nivel 2 cuando confirme su teléfono.

#### Los distintivos

- **FR-024**: Cada nivel DEBE tener su distintivo, distinto del de los otros dos, con un nombre que
  se lee en voz alta («Verificado, nivel 2»). Tocarlo en cualquier pantalla DEBE abrir la
  explicación de los niveles con ese nivel a la vista: qué pide cada uno —el teléfono; la cédula
  revisada a mano; el aval de otra persona con nivel 2— y qué dice de la persona: el nivel 1, que
  tiene un teléfono uruguayo confirmado; el nivel 2, que es una persona real con cédula uruguaya
  vigente, no que su nombre sea el de la cédula; el nivel 3, que alguien con nivel 2 responde por
  ella con su nombre a la vista. DEBE decir también que ningún nivel garantiza cómo va a cuidar a un
  animal. La
  explicación DEBE abrirse sin ingresar. En un perfil sin nivel, el texto de que la persona todavía
  no se verificó DEBE llevar también a la explicación, que entonces se abre sin ningún nivel
  destacado. Desde la explicación DEBE poder volverse a la pantalla desde la que se abrió.

#### Mis avales

- **FR-025**: «Mis avales» DEBE mostrar, a quien ingresó, a quién avaló y quién la avala, cada
  persona con su nombre, su foto, el día en que se dio el aval y el enlace a su perfil, del más
  reciente al más viejo; con la opción de retirar en los dados y de quitar en los recibidos. Un aval
  en pausa DEBE mostrarse con la marca de que no cuenta por ahora y a quién le falta el nivel 2 —a
  quien mira, a la otra persona o a las dos—, sin decir por qué. Cada lista sin avales DEBE mostrar su vacío
  de «Pantallas», que nunca invita a pedir un aval a quien todavía no puede recibirlo. Se abre con
  cualquier nivel; sin sesión, pide ingresar y vuelve.

#### Privacidad y baja

- **FR-026**: Cada regla de visibilidad de esta historia DEBE poder demostrarse con un intento
  fallido: nadie, con o sin sesión, DEBE poder leer el correo, el teléfono ni nada del documento de
  otra persona a través del perfil público; ni la fecha, la pausa o la quita de un aval del que no
  es una de las dos partes —quien lo dio y quien lo recibió ven lo que FR-025 y FR-011 les
  muestran, y nadie más—; ni dar, retirar o quitar un aval en nombre de otra.
- **FR-027**: Borrar la cuenta (historia #9) DEBE borrar el perfil público, los avales dados, los
  recibidos y los quitados en las dos direcciones. Quien baja de nivel por eso, baja en ese momento.

#### Medición

- **FR-028**: El producto DEBE registrar, sin nombres, enlaces ni nada que identifique a las
  personas: **perfil público visto**, cada vez que una persona lo abre, con si se abrió desde un
  enlace que llegó de afuera del sitio o navegando dentro del sitio, sin contar cuando la dueña mira
  el suyo ni la vista previa que arma una aplicación al compartir el enlace, que no es una persona
  mirando; **enlace al perfil
  copiado**; **aval dado**, **aval retirado** y **aval quitado**; **llegó a nivel 3**, cuando un
  aval dado hace pasar a la persona de nivel 2 a nivel 3; **explicación de los niveles abierta**; y
  **perfil rechazado por contacto**, con el campo y el tipo de lo encontrado —un número de puerta
  en la localidad no es contacto y no cuenta—. Un enlace que termina en «este perfil no existe» no
  cuenta como perfil visto. Como en las historias
  anteriores, los momentos se registran aunque todavía no se manden a ninguna herramienta.

### Key Entities *(include if feature involves data)*

- **Aval**: que una persona responde por otra. Tiene quién lo dio, quién lo recibió y desde cuándo.
  Vigente mientras no se retire, no se quite y existan las dos cuentas; cuenta según FR-001. Se
  borra al retirarlo, al quitarlo y con cualquiera de las dos cuentas.
- **Aval quitado**: el recuerdo de que una persona quitó el aval de otra, para que esa otra no
  pueda volver a dárselo; se guarda aunque el aval ya no estuviera en el momento de quitarlo (FR-018). Tiene solo quién lo había dado y quién lo quitó. Se borra con cualquiera
  de las dos cuentas.
- **Perfil público**: no es un dato nuevo: es la vista, para cualquiera, de lo que el perfil, la
  verificación y los avales ya tienen, recortada a FR-005, con un enlace propio que no cambia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 lecturas exitosas, con y sin sesión, del correo, el teléfono, algo del documento o
  el día exacto de verificación o de alta de otra persona, y de la fecha, la pausa o la quita de un
  aval por alguien que no es una de sus dos partes, en las pruebas de privacidad.
- **SC-002**: Los tres casos de «este perfil no existe» son indistinguibles: la misma pantalla y la
  misma respuesta del sitio, byte a byte salvo lo que cambia en cada visita a cualquier página.
- **SC-003**: El 100 % de los ejemplos de la historia («Juan 099 123 456», «fijo 2401 2345»,
  «t.me/juanrescata», «@juanrescata») se rechaza en el nombre y en la localidad, y cada texto de las
  pruebas de la regla de la ficha que entra en el largo del campo del perfil da el mismo resultado
  en el campo que le corresponde (FR-020): el mismo rechazo, del mismo tipo, o el mismo pase.
- **SC-004**: 0 avales que rompen una regla de FR-013 en las pruebas que intentan darlos sin pasar
  por la pantalla; 0 avales duplicados en las de doble toque y reintento; y a lo sumo un aval en
  las de dos personas que se avalan entre ellas al mismo tiempo.
- **SC-005**: En el 100 % de los casos probados —niveles 0 a 3, avales en pausa, retirados,
  quitados y de cuentas borradas—, el perfil público, «Mi perfil» y la verificación aprobada muestran
  el mismo nivel.
- **SC-006**: Desde «Mi perfil», mandar el enlace al perfil público lleva un toque —abrir la hoja
  de compartir en un teléfono que la tiene, copiarlo en otro lado—, y el perfil
  público de una persona con 50 avales, abierto sin sesión en un teléfono de 390 px con la medición
  de rendimiento del proyecto, cumple el presupuesto de las pantallas públicas (contenido principal
  en menos de 2,5 segundos).
- **SC-007**: En la beta —no en esta corrida—, al menos la mitad de las vistas de perfiles públicos,
  contadas con FR-028, llegan desde un enlace compartido: es la señal de que la gente manda el perfil
  en vez de preguntar en el grupo (docs/03 §Hipótesis).

## Assumptions

- **Alcance que ya existe** (Ready): los niveles 0 a 2 ya se calculan y se suma el 3; la regla de
  contacto de la ficha (historia #53) se reusa para el perfil; «Mi perfil» y la verificación
  aprobada existen y ganan el distintivo; el aviso de que el nombre, la foto y la zona van a ser
  públicos ya existe y se completa con que no lleven contacto.
- **Un distintivo, el del nivel más alto**: la historia dice «se muestra el más alto alcanzado» y
  también «el distintivo de cada nivel alcanzado». Se lee como que cada nivel tiene su distintivo y
  se muestra uno, el del nivel de hoy, que incluye a los anteriores; el mes y año de la identidad,
  que la historia pone en el distintivo de nivel 2, se muestra junto al distintivo también en nivel
  3, así no se pierde al subir. Es lo que `docs/10` dibuja: una chapita por nivel.
- **Vigente y en pausa**: la historia usa «vigente» para el aval no retirado ni quitado y dice que
  un aval sin nivel 2 de alguna de las partes «deja de contar». Esta spec separa los dos: la regla
  contra el aval cruzado mira los vigentes, aunque estén en pausa, porque es el caso más barato de
  dos cuentas que se suben solas y una pausa no lo vuelve más caro.
- **Quién ve el motivo de «no puede recibir avales»**: solo quien ingresó; sin sesión el perfil ya
  dice que la persona no se verificó y un aviso sobre avales a quien no puede avalar es ruido.
- **Orden del lugar de avalar** (FR-011): primero lo que ya existe entre las dos personas —un aval
  dado, que siempre se puede retirar; uno recibido; una quita—, después lo que la persona mirada no
  puede recibir, y al final lo que le falta a quien mira. Así nadie pierde el retiro de un aval en
  pausa, y nadie es mandado a verificarse para un aval que igual no podría dar.
- **«Porque no verificó su identidad»**: la historia lo pone como el texto de quien no puede recibir
  avales, pero a quien perdió el número con la identidad aprobada le atribuiría un motivo falso y
  revelaría algo de su teléfono. El texto dice lo que el nivel pide, no por qué esa persona no lo
  tiene (FR-006).
- **La vuelta después de verificarse para avalar**: verificar el teléfono termina en el momento y
  vuelve al perfil; la identidad se revisa a mano en hasta 2 días (docs/03 §1), así que ahí no hay
  vuelta automática: la persona ve el estado de su pedido como hoy, y el perfil le dice que su
  pedido está en revisión.
- **«Quitar de mi perfil»** se lee como quitarlo de lo que se muestra en mi perfil, y se hace desde
  «Mis avales», a la que se llega desde «Mi perfil»: el perfil público propio se ve igual que lo ven
  los demás (US1.8), sin acciones.
- **«Vuelvo a ese perfil» al ingresar** sigue las reglas de destino de la historia #9: si el
  enlace de ingreso se abre en otro dispositivo, se entra ahí sin la vuelta, como en todo el sitio.
- **La mitad de las vistas** como umbral de SC-007: la historia pide saber si la gente comparte el
  perfil en vez de preguntar en el grupo; si la mayoría de las vistas no llega por un enlace
  compartido, el perfil no está reemplazando la pregunta. Es una lectura de la beta, no una
  compuerta de esta corrida.
- **Confirmar antes de avalar, retirar y quitar**: la historia no lo pide, pero avalar pone el nombre
  de quien avala a la vista de cualquiera, retirar puede bajar de nivel a otra persona y quitar no
  se deshace. Un toque de más es barato frente a cualquiera de los tres por error.
- **Avalar sin sesión no se completa solo al volver**: la historia dice «vuelvo a ese perfil»; dar
  el aval sin un segundo toque sería poner el nombre de alguien sin que vea la confirmación.
- **En «Mis avales» se ve la fecha y la pausa, no el motivo**: la fecha es de las dos personas del
  aval; el nivel de la otra ya es público por su distintivo; el motivo (un cambio de número, un
  número perdido) no lo es.
- **La regla de contacto incluye el número de puerta en la localidad**: la historia pide «la misma
  regla que la ficha», y la de la ficha rechaza en la localidad un número de 3 o más dígitos porque
  es una dirección. Con la zona del perfil a la vista de cualquiera, una dirección es más grave que
  en la ficha, y una sola regla no confunde. «Villa 25 de Agosto» y «Ruta 8 km 25» pasan.
- **La regla también al completar el perfil**: la historia dice «el nombre y la localidad del
  perfil»; el alta y la edición son el mismo perfil y el mismo formulario (historia #9).
- **Se cita el fragmento encontrado**, como en la ficha: la historia pide explicar el porqué, y
  decir qué se encontró es lo que evita que la persona adivine.
- **«Llegó a nivel 3» cuenta pasos, no personas únicas**: los avales retirados se borran, así que no
  hay cómo saber si alguien ya había sido nivel 3 sin guardar un dato que la historia no pide. Se
  registra cada paso de nivel 2 a 3 por un aval dado; la vuelta sola de un aval en pausa no se
  registra, porque no la produce ninguna acción.
- **Visto desde afuera o desde el sitio**: «desde el sitio» es llegar navegando dentro del sitio
  (el nombre de quien avala, «ver mi perfil público», «Mis avales»); todo lo demás —un enlace
  pegado, WhatsApp, un favorito— es «desde un enlace». Las visitas de la dueña a su propio perfil no
  se cuentan, porque inflarían justo la señal que se quiere medir.
- **Muchos avales sin paginado**: el perfil y «Mis avales» muestran todos. La beta es de 3 a 5
  rescatistas (docs/03 §Métricas de éxito), así que 50 avales ya es más de lo que va a tener
  cualquier persona; el presupuesto se mide con 50, y un paginado se decide cuando haya personas
  cerca de ese número.
- **Cuántas personas me avalan, en «Mi perfil»**: sin aviso por correo (la historia lo excluye), un
  aval nuevo de alguien que la persona no quiere podría quedar a la vista sin que lo note; el
  número junto al acceso a «Mis avales» se lo muestra la próxima vez que abre su perfil, sin guardar
  qué avales ya vio.
- **La quita se guarda aunque el aval ya no esté** (FR-018): para que la decisión de quien quita no
  dependa de quién llegó primero cuando la otra persona retira al mismo tiempo. El costo es que una
  quita puede quedar guardada sobre un aval que ya se había retirado; esa persona no puede volver a
  avalar a quien la quitó, que es lo que quien quitó eligió.
- **Un perfil sin completar no tiene enlace**: el enlace nace al completar el perfil, así que de los
  tres casos de FR-007 el de un perfil sin completar es, en la práctica, un enlace que no existe; se
  ve igual.
- **Sin notificación del aval ni de la quita**: la historia excluye avisar por correo; quien quita un
  aval no le avisa a quien lo dio, que se entera solo si vuelve a intentar avalar.
- **El «historial» de `docs/03` §1** en el perfil público llega con el seguimiento (#69), como dice
  la historia; los animales publicados y el enlace desde la ficha, con la ficha pública (#57).
- **Suspensión y bloqueo** (#13): qué pasa con los avales y el perfil de una cuenta suspendida es de
  esa historia.
- **Pantallas indexables**: el perfil público y la explicación de los niveles son públicos pero no
  se indexan hasta M5 (docs/08 §Encontrable); «Mis avales» es privada.
- **Medición**: los momentos se registran como en las historias #10 y #53, sin mandarse a una
  herramienta hasta M5.
