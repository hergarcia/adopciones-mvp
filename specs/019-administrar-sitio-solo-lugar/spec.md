# Feature Specification: Administrar el sitio desde un solo lugar: lo que espera, desde cuándo y los antecedentes de cada persona

**Feature Branch**: `feature/73-administrar-sitio-solo-lugar`

**Created**: 2026-10-09

**Status**: Draft

**Input**: Historia #73 del backlog, milestone «M4 - Cierre, seguimiento y admin». El cuerpo
verbatim de la historia acompaña a esta spec (`story.md`).

**Ya construido**: las seis listas que Administrar junta: Pedidos de identidad (historia #11),
Publicaciones por revisar (historia #59), Reportes y Cuentas suspendidas (historia #13), Opiniones y
Encuestas (historia #71). Hoy se llega a cada una desde su propio acceso al pie de «Tu identidad», en
Mi perfil, y cada una vuelve a Mi perfil. También existen quién administra y la regla de que para
cualquier otra persona esas pantallas no existen (#11); la regla de que nadie resuelve lo propio, que
cada cola ya aplica (#11, #13, #59); suspender y reactivar con sus reglas (sin motivo no, a sí misma
no, no repetir lo que otra persona que administra ya hizo) y sus correos (#13); una tarea diaria que
el sitio corre solo, y los correos que el sitio ya manda. **No existen** Administrar, el resumen de la
mañana, la ficha de una persona ni la búsqueda por nombre. Esta spec los suma, cambia solo la vuelta
de las seis listas y el enlace al nombre de cada persona en cuatro de ellas, y no rehace ninguna cola.

**Vocabulario de esta spec**:

- **Quien administra**, **pedido de identidad** (en revisión, aprobado, rechazado, vencido,
  retirado), **publicación** (disponible, en proceso, pausada, adoptada, vencida, dada de baja),
  **revisada**, **reporte** (sin resolver, cerrado sin medidas, cerrado suspendiendo), **suspender**,
  **reactivar**, **cuenta suspendida**, **una cuenta borrada**, **zona**, **nivel**, **Opiniones** y
  **Encuestas** significan lo mismo que en las specs de las historias #9, #10, #11, #13, #59 y #71.
- **Administrar** es la pantalla nueva de inicio de quien administra.
- **Las tres colas** son **Pedidos de identidad**, **Publicaciones por revisar** y **Reportes sin
  resolver**. Un **pendiente** es un elemento de una de ellas: un pedido de identidad en revisión,
  una publicación por revisar o un reporte sin resolver.
- **Reportes** es la lista de la cola Reportes sin resolver (#13); las demás colas se llaman igual
  que su lista.
- **Las tres entradas** son **Cuentas suspendidas**, **Opiniones** y **Encuestas**: listas sin
  plazo a las que Administrar lleva.
- **Lo mío**: para una persona que administra, los pendientes que no puede resolver porque son
  suyos: su propio pedido de identidad, sus propias publicaciones por revisar y los reportes sobre
  ella. **Lo que puedo resolver** son todos los demás pendientes.
- **Espera** es el tiempo desde que un pendiente entró a su cola hasta ahora. Un pendiente **entra**
  cuando se manda el pedido de identidad, cuando la publicación sale (o vuelve a la lista porque se
  editó después de revisada, #59) y cuando se hace el reporte.
- **El plazo** de cada cola: Pedidos de identidad, 2 días (48 horas); Publicaciones por revisar,
  1 día (24 horas); Reportes sin resolver, 2 días (48 horas). Una cola está **atrasada** cuando el
  pendiente que más espera de lo que puedo resolver pasó su plazo; **cuánto se pasó** es su espera
  menos el plazo. Si no, está **al día**.
- **El número de pendientes** de una persona que administra es la suma de lo que puede resolver en
  las tres colas.
- **El resumen** es el correo de la mañana a cada persona que administra.
- **La ficha de una persona** es la pantalla nueva, solo para quien administra, con los
  antecedentes de una persona. No es la ficha de un animal (docs/06).
- **Buscar** es encontrar a una persona por su nombre para mostrar, desde Administrar. En esta spec,
  **el nombre** de una persona es siempre su nombre para mostrar (#9).
- **El menú** es la navegación de las pantallas con sesión.
- **Cómo se dice una espera**: menos de 1 hora, «menos de 1 hora»; menos de 24 horas, en horas
  enteras («hace 20 horas»); desde 24 horas, en días enteros, redondeando hacia abajo («hace
  3 días»). Cuánto se pasó una cola se dice igual («atrasada por 1 día», «atrasada por 5 horas»).
- Todo día y toda hora se cuentan y se muestran en hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administrar: qué espera, desde cuándo y qué se pasó de plazo (Priority: P1)

Quien administra a ratos entra al sitio y en el menú ve «Administrar» con un 5. Lo toca y ve primero
Pedidos de identidad, «3 · el más viejo de hace 3 días · atrasada por 1 día», después Publicaciones
por revisar, «2 · el más viejo de hace 4 horas», y Reportes sin resolver en cero. Más abajo, aparte,
ve que su propia publicación de Tobi espera a otra persona que administre. Al pie, las entradas a
Cuentas suspendidas, a Opiniones («4 en los últimos 7 días») y a Encuestas («2 respuestas en los
últimos 7 días»). Toca Pedidos de identidad, resuelve uno, toca volver y está de nuevo en
Administrar, que ahora dice 2.

**Why this priority**: es lo que hace que una cola atrasada se vea antes de que alguien abandone su
nivel 2 o una venta quede a la vista (docs/01, docs/03 §Métricas de éxito). El resumen, la ficha y la
búsqueda se apoyan en esta pantalla y en sus cuentas.

**Independent Test**: con pendientes sembrados de distintas esperas en las tres colas, algunos de
quien administra, opiniones y respuestas de los últimos 10 días: entrar como quien administra y ver
el menú, Mi perfil y Administrar con los números, las esperas, las atrasadas primero y lo mío aparte;
recorrer las seis listas y volver de cada una; resolver un pendiente desde otra sesión y volver a
cargar; entrar como una persona que no administra y sin sesión, y abrir la dirección de Administrar.

**Acceptance Scenarios**:

1. **Dado** que administro el sitio y hay 3 pedidos de identidad, el más viejo de hace 3 días, y 2
   publicaciones por revisar de hoy, **cuando** abro Administrar, **entonces** veo primero Pedidos de
   identidad con 3, «el más viejo de hace 3 días» y «atrasada por 1 día»; después Publicaciones por
   revisar con 2, al día; después Reportes sin resolver en 0; y desde cada una llego a su lista.
2. **Dado** que administro el sitio y hay 5 pendientes que puedo resolver, **cuando** miro el menú o
   abro Mi perfil, **entonces** veo Administrar con un 5, y en Mi perfil, al pie de «Tu identidad»,
   hay un solo acceso a Administrar en lugar de los seis accesos sueltos.
3. **Dado** que estoy en Reportes, **cuando** toco volver, **entonces** llego a Administrar, no a Mi
   perfil; lo mismo desde Pedidos de identidad, Publicaciones por revisar, Cuentas suspendidas,
   Opiniones y Encuestas.
4. **Dado** que dos colas están atrasadas, Reportes por 3 horas y Publicaciones por 2 días,
   **cuando** abro Administrar, **entonces** veo primero Publicaciones, después Reportes y después
   Pedidos de identidad.
5. **Dado** que soy la única persona que administra y publiqué a Tobi hace 2 días, **cuando** abro
   Administrar, **entonces** Tobi no cuenta en mis Publicaciones por revisar, no las marca atrasadas
   ni suma en el número del menú, y lo veo aparte, en «Espera a otra persona que administre», como
   «Tu publicación de Tobi, desde hace 2 días».
6. **Dado** que hay un reporte sin resolver sobre mí, **cuando** abro Administrar, **entonces** no
   cuenta en mis Reportes sin resolver y, aparte, veo «Un reporte sobre vos espera a otra persona que
   administre», sin el motivo, el texto ni quién lo hizo.
7. **Dado** que otra persona que administra resolvió el último pedido atrasado, **cuando** vuelvo a
   Administrar o vuelvo a cargar cualquier pantalla, **entonces** Pedidos de identidad ya no se ve
   atrasada y el número del menú bajó.
8. **Dado** que llegaron 4 opiniones y 2 respuestas de encuesta en los últimos 7 días y otras antes,
   **cuando** abro Administrar, **entonces** la entrada a Opiniones dice 4 y la de Encuestas dice 2.
9. **Dado** que no hay nada que yo pueda resolver en ninguna cola, **cuando** abro Administrar,
   **entonces** veo «No hay nada esperando», las tres colas en 0, las tres entradas igual, y el menú y
   Mi perfil muestran Administrar sin número.
10. **Dado** que no se pudo contar una cola, **cuando** abro Administrar, **entonces** esa cola dice
    que no se pudo contar y sigue llevando a su lista, y las demás se ven igual. Si lo que no se pudo
    contar es el número del menú, la entrada se ve sin número (FR-020).
11. **Dado** que no administro el sitio, o no tengo sesión, **cuando** abro la dirección de
    Administrar, **entonces** veo que no existe, igual que una dirección cualquiera, y ni mi menú ni
    Mi perfil tienen la entrada.
12. **Dado** que se corta la conexión, **cuando** abro Administrar, **entonces** se me dice que no se
    pudo por la conexión y puedo reintentar.

---

### User Story 2 - La ficha de una persona, con sus antecedentes y suspender o reactivar (Priority: P2)

Quien administra está resolviendo un reporte sobre Bruno. Toca su nombre y abre su ficha: ve su foto,
su zona, su nivel y desde cuándo tiene cuenta; su pedido de identidad rechazado hace 10 días con el
motivo; un reporte anterior cerrado sin medidas; y sus dos publicaciones, una dada de baja por venta.
Con todo eso delante, lo suspende con un motivo desde ahí mismo.

**Why this priority**: decidir un reporte o una suspensión con los antecedentes a la vista es lo que
docs/03 §6 pide; hoy están repartidos entre las listas. Se apoya en Administrar para llegar.

**Independent Test**: con personas sembradas con antecedentes de cada tipo (identidad verificada,
rechazada, vencida y en revisión; reportes sin resolver y cerrados de las dos formas; suspensiones y
reactivaciones; publicaciones en cada estado y una dada de baja), una sin ningún antecedente, una
suspendida y quien administra con un reporte sobre sí: abrir cada ficha desde cada lista y por su
dirección, y suspender y reactivar desde la ficha, también con otra sesión de quien administra
actuando a la vez; borrar una cuenta y abrir su ficha; abrir una ficha sin administrar.

**Acceptance Scenarios**:

1. **Dado** que estoy resolviendo un reporte sobre Bruno, **cuando** toco su nombre y abro su ficha,
   **entonces** veo junto su foto, su nombre, su zona, su nivel y desde qué día tiene cuenta; su
   pedido de identidad rechazado hace 10 días con el motivo; un reporte anterior cerrado sin medidas,
   con su motivo, su texto, cuándo se hizo y cuándo se cerró; y sus dos publicaciones con su estado,
   una dada de baja con el motivo «venta»; y puedo suspenderlo con un motivo desde ahí.
2. **Dado** que estoy en Pedidos de identidad, Publicaciones por revisar, Reportes o Cuentas
   suspendidas, **cuando** toco el nombre de una persona, **entonces** abro su ficha.
3. **Dado** que suspendo a Bruno desde su ficha con un motivo, **cuando** confirmo, **entonces** pasa
   lo mismo que al suspender desde un reporte (#13): Bruno recibe el correo con el motivo, sus
   reportes sin resolver se cierran con esa suspensión, y la ficha lo muestra «Suspendida» con el
   motivo, quién y cuándo, y la opción de reactivar.
4. **Dado** que Bruno está suspendido, **cuando** abro su ficha, **entonces** la veo con
   «Suspendida», el motivo, quién y cuándo, y la opción de reactivar, aunque su perfil público no
   exista; si lo reactivo, pasa lo mismo que al reactivar desde Cuentas suspendidas (#13).
5. **Dado** que una persona no tiene antecedentes de algún tipo, **cuando** abro su ficha,
   **entonces** cada parte vacía dice «Sin pedidos de identidad», «Sin reportes», «Sin
   suspensiones» o «Sin publicaciones».
6. **Dado** que abro mi propia ficha, **cuando** la miro, **entonces** no tengo la opción de
   suspenderme, y un reporte sin resolver sobre mí se ve como «espera a otra persona que
   administre», sin motivo, texto ni quién lo hizo.
7. **Dado** que intento suspender desde una ficha sin motivo, o solo con espacios, **cuando**
   confirmo, **entonces** no se suspende y se me pide el motivo, sin perder la ficha abierta.
8. **Dado** que otra persona que administra suspendió a Bruno mientras yo miraba su ficha,
   **cuando** toco suspender y confirmo, **entonces** veo que ya está suspendido, por quién y
   cuándo, y no se suspende de nuevo; lo mismo al reactivar una cuenta que otra persona ya reactivó.
9. **Dado** que la persona de una ficha borró su cuenta, **cuando** abro el enlace a su ficha, o
   intento suspenderla o reactivarla con la ficha abierta, **entonces** veo que esa cuenta ya no
   existe, y no se guarda nada.
10. **Dado** que no administro el sitio, o no tengo sesión, **cuando** abro la dirección de una
    ficha, **entonces** veo que no existe, igual que una dirección cualquiera.
11. **Dado** que se corta la conexión, **cuando** abro una ficha o suspendo desde ella, **entonces**
    se me dice que no se pudo por la conexión, puedo reintentar y no pierdo el motivo que escribí.

---

### User Story 3 - El resumen de la mañana, solo si hay algo esperando (Priority: P3)

Son las 8 de la mañana en Uruguay. Quien administra recibe un correo: «2 reportes sin resolver, el
más viejo de hace 20 horas» y un enlace a Administrar. No lleva nombres, fotos, motivos ni textos. Al
otro día no hay nada esperando y no le llega nada.

**Why this priority**: la revisión es a mano y part-time; sin un aviso depende de acordarse de
entrar. Se apoya en las cuentas de US1.

**Independent Test**: con pendientes sembrados con distintas esperas, dos personas que administran
(una con un pendiente suyo), correr la tarea de la mañana y leer el correo de cada una; correrla de
nuevo el mismo día; correrla sin pendientes, con solo lo mío, y con una persona que administra
suspendida.

**Acceptance Scenarios**:

1. **Dado** que a las 8 de la mañana hay 2 reportes sin resolver, el más viejo de hace 20 horas,
   **cuando** llega el resumen, **entonces** dice «2 reportes sin resolver, el más viejo de hace 20
   horas», sin nombres ni motivos, y su enlace me lleva a Administrar (pasando por el ingreso si no
   tengo sesión).
2. **Dado** que a las 8 hay 3 pedidos de identidad, el más viejo de hace 3 días, y 1 publicación de
   hace 5 horas, **cuando** llega el resumen, **entonces** dice primero los pedidos de identidad,
   «atrasada por 1 día», y después la publicación, al día.
3. **Dado** que no hay nada esperando en ninguna cola, o solo lo mío, **cuando** llegan las 8 de la
   mañana, **entonces** no me llega ningún resumen.
4. **Dado** que somos dos personas que administran y hay una publicación de la otra por revisar,
   **cuando** llegan las 8, **entonces** a mí me llega el resumen con esa publicación y a ella no le
   llega nada por esa publicación.
5. **Dado** que ya me llegó el resumen de hoy, **cuando** la tarea de la mañana corre otra vez el
   mismo día, **entonces** no me llega un segundo resumen.
6. **Dado** que mi cuenta de quien administra está suspendida, **cuando** llegan las 8, **entonces**
   no me llega el resumen.

---

### User Story 4 - Buscar a una persona por nombre (Priority: P4)

Alguien escribió al correo de ayuda diciendo que se llama Marta Suárez. Quien administra busca
«marta suarez» desde Administrar, la encuentra con su foto y su zona y abre su ficha.

**Why this priority**: es la puerta a la ficha de quien no está en ninguna cola, como quien escribe
al correo de ayuda; se apoya en la ficha de US2.

**Independent Test**: con personas sembradas con nombres con y sin tildes, dos con el mismo nombre,
una suspendida, una borrada y más de 20 con una parte del nombre en común: buscar con 2 y con 3
letras, con tildes y mayúsculas distintas, un nombre que no existe y uno que da más de 20; cortar la
conexión al buscar.

**Acceptance Scenarios**:

1. **Dado** que una persona se llama Marta Suárez, **cuando** busco «marta suarez», **entonces** la
   encuentro con su foto, su nombre y su zona, y al tocarla abro su ficha.
2. **Dado** que dos personas se llaman Ana Pérez, **cuando** busco «ana perez», **entonces** veo las
   dos, cada una con su foto y su zona.
3. **Dado** que Bruno está suspendido, **cuando** busco «bruno», **entonces** lo encuentro, con la
   marca de cuenta suspendida.
4. **Dado** que una persona borró su cuenta, **cuando** busco su nombre, **entonces** no aparece.
5. **Dado** que busco con menos de 3 letras, **cuando** busco, **entonces** se me pide escribir al
   menos 3 y no se busca.
6. **Dado** que no hay nadie con ese nombre, **cuando** busco, **entonces** veo «No encontramos a
   nadie con ese nombre.» y lo que escribí sigue en la búsqueda.
7. **Dado** que más de 20 personas coinciden, **cuando** busco, **entonces** veo 20 y se me dice que
   hay más y que escriba más del nombre para encontrarla.
8. **Dado** que se corta la conexión, **cuando** busco, **entonces** se me dice que no se pudo por la
   conexión y puedo reintentar, sin perder lo que escribí en la búsqueda.

---

### Edge Cases

- **Empates al ordenar las colas**: las atrasadas van primero, de la que más se pasó a la que menos;
  las que están al día van después, en el orden fijo Pedidos de identidad, Publicaciones por revisar,
  Reportes sin resolver. Dos atrasadas que se pasaron lo mismo siguen ese orden fijo.
- **Justo en el plazo**: una cola cuyo pendiente más viejo espera exactamente su plazo todavía está
  al día; se atrasa al pasarlo.
- **Lo mío nunca atrasa**: un pendiente mío no cuenta en el número, en la espera ni en el atraso de
  su cola, aunque sea el más viejo. Si en una cola solo hay lo mío, esa cola está en 0 y al día.
- **Lo mío, aparte**: cada pendiente mío se ve en «Espera a otra persona que administre» con qué es
  («Tu pedido de identidad», «Tu publicación de <nombre del animal>», «Un reporte sobre vos») y desde
  cuándo espera, sin marca de atraso. De un reporte sobre mí no se ve el motivo, el texto ni quién lo
  hizo (#13). Si no hay nada mío, esa parte no se muestra.
- **Un pedido de identidad que vence a los 7 días** sale de la cola, como dice #11; deja de contar.
- **Una publicación que se pausa, se marca adoptada, vence o se borra** sin revisar: cuenta mientras
  esté en Publicaciones por revisar, con la misma regla de #59 para cuándo sale de esa lista.
- **Una publicación revisada que se edita** vuelve a Publicaciones por revisar (#59): su espera
  empieza de nuevo desde que se editó.
- **Un reporte sobre alguien que borra su cuenta** se borra y sale de la cola (#13); deja de contar.
- **Varias personas que administran** ven las mismas colas, pero cada una con sus propios números:
  lo de una es lo mío para ella y cuenta para las demás.
- **El número del menú** se calcula al abrir o volver a cargar una pantalla; no cambia solo mientras
  la pantalla está abierta. Con más de 99 pendientes dice «99+».
- **Opiniones y Encuestas en 7 días**: son las llegadas hoy y los 6 días anteriores. Una opinión
  borrada deja de contar. Con 0, la entrada dice 0.
- **Quien administra deja de administrar** (lo decide el equipo): desde la siguiente pantalla que
  abre no ve Administrar, la entrada del menú, el acceso de Mi perfil ni ninguna ficha, y deja de
  recibir el resumen.
- **Quien administra está suspendida**: ve solo la pantalla de cuenta suspendida (#13), sin
  Administrar ni resumen; al reactivarla vuelve todo.
- **El resumen** usa las esperas del momento en que se arma, a las 8. Lista solo las colas con algo
  que esa persona puede resolver, las atrasadas primero con la misma regla de orden que Administrar.
  Lo mío no figura en el resumen.
- **El resumen no sale**: si el correo no se pudo mandar, o si a las 8 alguna cola no se pudo contar,
  ese día no sale y no se reintenta más tarde; al otro día sale el de ese día, con las esperas de ese
  momento.
- **Un bloqueo entre quien administra y una persona** (en cualquier dirección) no cambia nada de
  esta historia: la ficha se ve completa, la persona aparece en la búsqueda y sus pendientes
  cuentan, como #13 ya le deja a quien administra la herramienta de suspender.
- **Una cuenta de quien administra sin dirección de correo que reciba**: no hay otro canal; el
  resumen no le llega (hasta que exista el dominio, KL-006).
- **La ficha de una cuenta suspendida** se ve completa para quien administra, aunque para el resto
  del sitio esa cuenta no exista (#13).
- **La ficha de otra persona que administra**: se ve como cualquier otra, con la opción de
  suspenderla (#13 lo permite). No dice que administra.
- **La ficha de quien administra, para sí misma**: sin «Suspender»; de los reportes sobre ella ve
  solo cuántos sin resolver esperan a otra persona que administre, sin motivo, texto ni quién; los
  reportes sobre ella ya cerrados no se le muestran (#13 no se los muestra a nadie reportado). Sus
  suspensiones, sus pedidos de identidad y sus publicaciones sí.
- **Antecedentes que caducan**: un rechazo de identidad se ve con su día y su motivo durante los 30
  días que #11 lo guarda; un vencimiento, con su día, hasta que la persona pide de nuevo o pasan 30
  días; un pedido retirado no deja nada. Lo que #11, #13 o #59 ya borraron no aparece en la ficha.
- **Quién suspendió o quién reactivó** con una cuenta que ya no existe se ve como «una cuenta
  borrada» (#13).
- **La persona borra su cuenta con la ficha abierta**: la siguiente acción o la siguiente carga dice
  que esa cuenta ya no existe y no guarda nada.
- **Una ficha con muchos antecedentes**: cada parte muestra primero lo más nuevo; con más de 20 en
  una parte, muestra los 20 más nuevos y deja ver los anteriores sin perder los que ya se ven.
- **Buscar** ignora mayúsculas, tildes y espacios de más al principio, al final y entre palabras;
  encuentra a quien tiene en su nombre para mostrar lo escrito, en cualquier parte del nombre
  («ana» encuentra a «Ana Pérez» y a «Mariana López»). Para las 3 letras cuenta cualquier carácter
  que no sea un espacio.
- **El orden de la búsqueda**: primero quienes tienen un nombre que empieza con lo escrito; después,
  el resto; dentro de cada grupo, por orden alfabético del nombre y, a igual nombre, la cuenta más
  vieja primero.
- **Una persona sin foto o sin zona** aparece en la búsqueda y en su ficha con la foto por defecto
  del sitio y «Sin zona».
- **Una cuenta que todavía no tiene nombre para mostrar** no aparece en la búsqueda; a su ficha se
  llega desde una cola.
- **Buscar se encuentra a sí misma**: quien administra puede encontrarse y abrir su propia ficha.
- **Buscar por correo o por teléfono** no encuentra a nadie por esos datos: lo escrito se compara
  solo con el nombre para mostrar.

## Pantallas

En todas: el **cargando** de una pantalla o un bloque con datos es un esqueleto con su forma; el
**error al cargar** dice que no se pudo traer y ofrece «Reintentar»; cada **acción** muestra que
está trabajando en su botón, no se puede tocar dos veces y, si falla, dice qué pasó y deja reintentar
sin perder lo escrito. Administrar, la ficha de una persona y los resultados de búsqueda son privados
y no se encuentran en buscadores; para quien no administra no existen.

- **Administrar** (nuevo): las tres colas, cada una con cuántos pendientes puedo resolver, desde
  cuándo espera el más viejo y si está al día o atrasada por cuánto, las atrasadas primero, cada una
  llevando a su lista; «Espera a otra persona que administre», aparte, con lo mío; las tres entradas:
  Cuentas suspendidas, Opiniones (llegadas en los últimos 7 días) y Encuestas (respuestas en los
  últimos 7 días); y buscar a una persona. Vacío: «No hay nada esperando», con las tres colas en 0 y
  las entradas igual. Error de una cola: esa cola dice que no se pudo contar y sigue llevando a su
  lista; lo mismo con las cuentas de Opiniones y Encuestas.
- **Menú** (cambia): la entrada Administrar con el número de pendientes, solo para quien administra.
  Vacío: la entrada sin número. Error al contar: la entrada sin número.
- **Mi perfil** (cambia): al pie de «Tu identidad», un solo acceso a Administrar con el número de
  pendientes, en lugar de los seis accesos sueltos, solo para quien administra. Vacío: el acceso sin
  número. Error al contar: el acceso sin número.
- **Resultados de búsqueda** (nuevo, dentro de Administrar): hasta 20 personas, cada una con foto,
  nombre, zona y la marca de cuenta suspendida si lo está, que llevan a su ficha; si hay más de 20,
  el aviso de que hay más. Menos de 3 letras: el pedido de escribir al menos 3. Vacío: «No
  encontramos a nadie con ese nombre.» Error: que no se pudo por la conexión, con «Reintentar», y lo
  escrito sigue ahí.
- **Ficha de una persona** (nuevo, solo para quien administra): foto, nombre, zona, nivel y desde qué
  día tiene cuenta; si está suspendida, «Suspendida» con el motivo, quién y cuándo; y cuatro partes:
  Pedidos de identidad, Reportes, Suspensiones y Publicaciones; con «Suspender» (con el motivo) o
  «Reactivar», salvo en la propia. Vacío: cada parte sin antecedentes dice «Sin pedidos de
  identidad», «Sin reportes», «Sin suspensiones» o «Sin publicaciones». Cuenta borrada: que esa
  cuenta ya no existe, con el camino de vuelta a Administrar.
- **Pedidos de identidad, Publicaciones por revisar, Reportes y Cuentas suspendidas** (cambian, de
  #11, #59 y #13): el nombre de cada persona lleva a su ficha, y volver lleva a Administrar. Vacío:
  los de cada historia, con la vuelta a Administrar.
- **Opiniones y Encuestas** (cambian, de #71): volver lleva a Administrar. Vacío: los de #71, con la
  vuelta a Administrar.
- **Correo del resumen** (nuevo): cada cola con algo que puedo resolver, con cuántos, desde cuándo
  espera el más viejo y si está atrasada por cuánto, las atrasadas primero, y el enlace a
  Administrar. Vacío: no aplica; sin pendientes no se manda.

## Requirements *(mandatory)*

### Functional Requirements

#### Quién ve qué

- **FR-001**: Administrar, la ficha de una persona, la búsqueda y el resumen existen solo para quien
  administra (#11). Para cualquier otra persona, con o sin sesión, la dirección de Administrar y la de
  una ficha se ven igual que una dirección que no existe, y ni el menú ni Mi perfil muestran la
  entrada.
- **FR-002**: Una persona que administra y está suspendida no ve Administrar, fichas ni búsqueda, ni
  recibe el resumen, mientras dure la suspensión (#13).

#### Administrar

- **FR-010**: Administrar muestra las tres colas, cada una con cuántos pendientes puede resolver
  quien mira, desde cuándo espera el más viejo de ellos y si la cola está al día o atrasada y por
  cuánto, con la forma de decir una espera del vocabulario. Cada cola lleva a su lista.
- **FR-011**: El plazo de Pedidos de identidad es 48 horas, el de Publicaciones por revisar 24 horas y
  el de Reportes sin resolver 48 horas, contados desde que el pendiente entró. Una cola se atrasa
  cuando su pendiente más viejo de lo que puedo resolver espera más que su plazo.
- **FR-012**: Las colas atrasadas van primero, de la que más se pasó a la que menos; después, las que
  están al día, en el orden fijo Pedidos de identidad, Publicaciones por revisar, Reportes sin
  resolver.
- **FR-013**: Lo mío no cuenta en el número, en la espera ni en el atraso de ninguna cola. Se muestra
  aparte, en «Espera a otra persona que administre», cada pendiente con qué es y desde cuándo espera,
  sin marca de atraso; de un reporte sobre mí, sin motivo, texto ni quién lo hizo.
- **FR-014**: Administrar muestra las tres entradas: Cuentas suspendidas; Opiniones, con cuántas
  llegaron en los últimos 7 días; y Encuestas, con cuántas respuestas llegaron en los últimos 7 días,
  contados por día del calendario (hoy y los 6 anteriores). Opiniones y Encuestas no tienen plazo ni
  se atrasan.
- **FR-015**: Sin nada que pueda resolver, Administrar dice «No hay nada esperando», con las tres
  colas en 0 y las tres entradas igual.
- **FR-016**: Si no se pudo contar una cola o una entrada, esa dice que no se pudo contar y sigue
  llevando a su lista; las demás se ven igual.

#### El menú, Mi perfil y las seis listas

- **FR-020**: Para quien administra, el menú lleva la entrada Administrar con el número de
  pendientes; con 0, o si no se pudo contar, se ve sin número; con más de 99, dice «99+». Para nadie
  más aparece.
- **FR-021**: En Mi perfil, al pie de «Tu identidad», quien administra ve un solo acceso a
  Administrar con el mismo número que el menú, en lugar de los seis accesos sueltos a las listas.
- **FR-022**: El número se calcula de nuevo cada vez que se abre o se vuelve a cargar una pantalla.
- **FR-023**: Volver desde Pedidos de identidad, Publicaciones por revisar, Reportes, Cuentas
  suspendidas, Opiniones y Encuestas lleva a Administrar.
- **FR-024**: En Pedidos de identidad, Publicaciones por revisar, Reportes y Cuentas suspendidas, el
  nombre de cada persona lleva a su ficha. Donde una lista no muestra un nombre (un reporte sobre
  quien mira, «una cuenta borrada»), no hay enlace.

#### La ficha de una persona

- **FR-030**: Se llega a la ficha de una persona desde el nombre en cada lista de FR-024, desde los
  resultados de búsqueda y por su dirección.
- **FR-031**: La ficha muestra, de la persona: su foto, su nombre para mostrar, su zona, su nivel y
  desde qué día tiene cuenta; y, si está suspendida, «Suspendida» con el motivo, quién suspendió y
  cuándo.
- **FR-032**: **Pedidos de identidad**: si la identidad está verificada, el día en que se verificó;
  si hay un pedido en revisión, desde cuándo espera, con el camino a ese pedido en Pedidos de
  identidad; los rechazos con su día y su motivo, mientras #11 los guarda (30 días); el último
  vencimiento con su día, mientras #11 lo guarda. Nada de las imágenes ni de quién resolvió.
- **FR-033**: **Reportes**: los reportes sobre la persona, sin resolver y cerrados, cada uno con su
  motivo, su texto, cuándo se hizo y, si se cerró, cuándo y cómo (sin medidas o suspendiendo). No
  muestra quién reportó ni los reportes que la persona hizo sobre otras.
- **FR-034**: **Suspensiones**: cada suspensión de la persona con su motivo, quién suspendió y cuándo,
  y, si se levantó, quién reactivó y cuándo. Una cuenta que ya no existe se ve como «una cuenta
  borrada».
- **FR-035**: **Publicaciones**: cada publicación de la persona con el nombre del animal, su estado,
  si está por revisar, y, si fue dada de baja, el motivo de la baja. Las publicaciones borradas no
  aparecen.
- **FR-036**: Cada parte muestra primero lo más nuevo; con más de 20 elementos, muestra los 20 más
  nuevos y deja ver los anteriores sin perder los que ya se ven. Cada parte vacía dice «Sin pedidos
  de identidad», «Sin reportes», «Sin suspensiones» o «Sin publicaciones».
- **FR-037**: La ficha nunca muestra el teléfono, el correo, las imágenes de identidad, las
  solicitudes, las respuestas al cuestionario, los bloqueos que hizo o que recibió, ni las opiniones
  o respuestas de encuesta de la persona.
- **FR-038**: En la propia ficha, quien administra no tiene «Suspender»; de los reportes sobre sí ve
  solo cuántos sin resolver esperan a otra persona que administre, sin motivo, texto ni quién, y no
  ve los ya cerrados; su propio pedido de identidad en revisión se ve como que espera a otra persona
  que administre, sin el camino a resolverlo.
- **FR-039**: La ficha de una cuenta borrada, o de una que no existe, dice que esa cuenta ya no existe
  y lleva de vuelta a Administrar.

#### Suspender y reactivar desde la ficha

- **FR-040**: Desde la ficha de otra persona no suspendida, quien administra la suspende con un motivo
  escrito, con las mismas reglas y los mismos efectos que suspender en #13: motivo obligatorio (ni
  vacío ni solo espacios), hasta 1.000 caracteres, el correo a la persona y el cierre de sus reportes
  sin resolver con esa suspensión.
- **FR-041**: Desde la ficha de una cuenta suspendida, quien administra la reactiva con las mismas
  reglas y los mismos efectos que reactivar en #13.
- **FR-042**: Si otra persona que administra ya suspendió o reactivó esa cuenta, se ve que ya está
  hecho, por quién y cuándo, y no se repite. Si la cuenta se borró mientras tanto, se dice que ya no
  existe y no se guarda nada. Si quien mira dejó de administrar, la acción no se hace.

#### Buscar

- **FR-050**: Buscar compara lo escrito solo con el nombre para mostrar de las personas, sin
  importar mayúsculas, tildes ni espacios de más, y encuentra a quien tiene lo escrito en cualquier
  parte del nombre.
- **FR-051**: Hace falta escribir al menos 3 letras, sin contar los espacios; con menos, no se busca
  y se pide escribir al menos 3.
- **FR-052**: Los resultados incluyen las cuentas suspendidas, con su marca, y nunca las borradas;
  muestran hasta 20, con foto, nombre y zona, en el orden de los casos borde; si hay más, se dice que
  hay más y que se escriba más del nombre.
- **FR-053**: Sin resultados, se dice «No encontramos a nadie con ese nombre.» y lo escrito sigue en
  la búsqueda. Si no se pudo buscar, se dice que no se pudo por la conexión, se puede reintentar y lo
  escrito sigue ahí.

#### El resumen

- **FR-060**: Una vez por día, a las 8 de la mañana en hora de Uruguay, cada persona que administra y
  no está suspendida recibe el resumen en la dirección de su cuenta, solo si tiene algo que puede
  resolver esperando. Si no, no le llega nada.
- **FR-061**: El resumen dice, por cada cola con algo que puede resolver, cuántos hay, desde cuándo
  espera el más viejo y si está atrasada y por cuánto, en el orden de FR-012, con un enlace a
  Administrar. No figura lo suyo.
- **FR-062**: El resumen no lleva nombres, fotos, motivos, textos ni ningún otro dato de las personas
  de las colas.
- **FR-063**: Nadie recibe más de un resumen el mismo día, aunque la tarea corra dos veces. Un resumen
  que no se pudo mandar, o que no se pudo armar porque una cola no se pudo contar, no se manda más
  tarde.
- **FR-064**: Quien administra no elige desde el sitio si recibe el resumen ni a qué hora.

#### Datos personales

- **FR-070**: Esta historia no guarda ningún dato nuevo de las personas: la ficha junta lo que quien
  administra ya ve en cada cola, y la búsqueda es solo por nombre para mostrar. Lo que cada historia
  borra al borrar una cuenta deja de verse en la ficha y en la búsqueda.
- **FR-071**: La ficha, la búsqueda y las cuentas de Administrar las ve solo quien administra; nadie
  más, por ningún camino, puede leer los antecedentes de otra persona que esta historia junta.
- **FR-072**: El resumen va solo a la dirección de la cuenta de cada persona que administra.

#### Medición

- **FR-080**: Se mide: Administrar abierto (desde el menú, desde Mi perfil o desde el resumen);
  resumen enviado (cuántos por cola, horas del más viejo de cada una y cuáles atrasadas); cola
  atrasada al abrir Administrar (cuál y cuántas horas se pasó); ficha abierta (desde qué lista,
  desde Cuentas suspendidas o desde la búsqueda); y búsqueda hecha (si encontró a alguien, nunca lo
  escrito).
- **FR-081**: Ningún evento lleva el nombre, el correo, el teléfono, lo buscado ni otro dato de las
  personas.

### Key Entities *(include if feature involves data)*

- **Pendiente**: un pedido de identidad en revisión, una publicación por revisar o un reporte sin
  resolver, con cuándo entró y de quién es (para saber si es lo mío). Ya existe en cada historia.
- **Cuenta de una cola**: para una persona que administra, cuántos pendientes puede resolver, la
  espera del más viejo y si está atrasada. Se calcula; no se guarda.
- **Antecedentes de una persona**: lo que #11, #13 y #59 ya guardan de ella (identidad, reportes,
  suspensiones, publicaciones). No se guarda nada nuevo.
- **Envío del resumen**: que a una persona que administra ya se le mandó el resumen de un día, para
  no mandarlo dos veces. No lleva nada de las colas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde cualquier pantalla con sesión, quien administra llega a cualquiera de las seis
  listas en 3 toques como mucho (abrir el menú si está plegado, Administrar y la lista), y vuelve a
  Administrar en 1.
- **SC-002**: En el 100 % de las pruebas con pendientes sembrados, Administrar y el resumen muestran
  el número, la espera y el atraso esperados de cada cola, con lo mío fuera de las cuentas.
- **SC-003**: En el 100 % de los intentos de prueba, una persona que no administra, con o sin sesión,
  no puede abrir Administrar ni una ficha, ni leer los antecedentes de otra persona por ningún
  camino.
- **SC-004**: Ninguna ficha, resultado de búsqueda o resumen de las pruebas contiene un teléfono, un
  correo, una imagen de identidad, una solicitud, un bloqueo ni una opinión de nadie.
- **SC-005**: En el 100 % de las pruebas, sin nada que esa persona pueda resolver no le llega ningún
  resumen, y nunca le llegan dos el mismo día.
- **SC-006**: Encontrar a una persona por su nombre y abrir su ficha lleva como mucho 3 pasos además
  de escribir (Administrar, buscar, tocar el resultado).
- **SC-007**: Con los eventos de la beta, el equipo puede leer, para cada mañana en que salió un
  resumen, cuántas horas esperaba el pendiente más viejo de cada cola, y compararlo con el abandono
  del nivel 2, sin ningún dato de las personas.

## Assumptions

- Ya en main (Ready): las seis listas (#11, #13, #59, #71), quién administra y la puerta que las
  oculta al resto (#11), la regla de lo propio en las colas de identidad y publicaciones, suspender y
  reactivar con sus reglas (#13), una tarea diaria que el sitio corre solo y el envío de correos. No
  existen Administrar, el resumen, la ficha ni la búsqueda.
- La historia no tiene comentarios; su cuerpo, editado por última vez el 2026-10-09, con sus
  «Decisiones del enjambre», es la fuente. Las siete decisiones se copian palabra por palabra a
  docs/03 §6 en esta rama. «KL-006» y «Ley 18.331» son citas de documentos.
- Administrar, el resumen, la ficha y la búsqueda son una sola capacidad, «administrar desde un solo
  lugar», que cierra docs/03 §6.
- **Cómo se dice una espera** (horas debajo de 24, días enteros hacia abajo desde 24, «menos de
  1 hora» debajo de 1) es decisión de esta spec: la historia da los ejemplos «hace 20 horas»,
  «hace 3 días» y «atrasada por 1 día», y esta regla los cumple todos.
- **El orden de las colas** (atrasadas primero, de la que más se pasó; después el orden fijo) es
  decisión de esta spec: la historia pide las atrasadas primero y su ejemplo sigue ese orden fijo.
- **Un reporte cuenta uno**, aunque haya varios sobre la misma persona: la historia cuenta
  «2 reportes sin resolver».
- **El resumen lista solo las colas con algo** (decisión de esta spec): es un aviso, no un tablero, y
  el enlace lleva al resto.
- **Un resumen que no salió no se reintenta ese día** (decisión de esta spec): a las 8 se armó con
  las esperas de ese momento; mandarlo más tarde diría esperas viejas, y al otro día sale el nuevo.
- **La ficha no muestra quién reportó** ni los reportes que la persona hizo (decisión de esta spec):
  la historia lista lo que la ficha muestra de los reportes (motivo, texto, cuándo y cómo se
  resolvieron), que es el historial de #13; ante dos opciones, la que muestra menos (Ley 18.331).
- **La ficha no muestra quién resolvió un pedido de identidad** (decisión de esta spec): la historia
  pide «lo que #11 guarda» del pedido y nombra el día y los motivos, no quién.
- **En la propia ficha no se ven los reportes ya cerrados sobre sí** (decisión de esta spec): #13 no
  le muestra a nadie los reportes sobre sí, y quien administra no es la excepción.
- **El número del menú se calcula al cargar una pantalla**, sin actualizarse solo con la pantalla
  abierta: la historia pide que baje «cuando vuelvo a Administrar».
- **«99+»**: un número de tres cifras no entra en la entrada del menú; con una beta chica no debería
  pasar.
- **La búsqueda encuentra lo escrito en cualquier parte del nombre** y ordena primero a quien empieza
  así (decisión de esta spec): «marta suarez» y «ana perez» de la historia se encuentran, y el orden
  pone arriba lo más probable.
- **Una cuenta sin nombre para mostrar** no aparece en la búsqueda: no hay con qué encontrarla.
- **La ficha de otra persona que administra no dice que administra**: la historia no lo pide y
  designar a quien administra es fuera del sitio.
- **La tarea del resumen** corre como la tarea diaria que ya existe; cuándo corre en la nube (con el
  sitio en la beta) lo decide el plan (docs/07). Hasta que exista el dominio, el correo real llega
  solo a la dirección de la cuenta del servicio de correo (KL-006).
- **Fuera de esta historia**, como dice su alcance: las colas en sí; un tablero del funnel o de las
  métricas de éxito; designar a quien administra desde el sitio; buscar por correo o por teléfono;
  ver el teléfono, el correo, las imágenes de identidad, las solicitudes, las respuestas al
  cuestionario, los bloqueos, o unir a una persona con sus opiniones o respuestas; asignar
  pendientes; un registro de lo que hizo cada persona que administra; deshacer una baja o editar la
  publicación de otro; borrar cuentas o datos de otra persona desde el sitio; elegir desde el sitio si
  llega el resumen o a qué hora; avisos por WhatsApp o notificaciones del teléfono (fuera del MVP).
