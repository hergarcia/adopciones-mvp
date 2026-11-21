# Feature Specification: Que me avisen por correo cuando se publique un animal como el que busco

**Feature Branch**: `feature/265-avisen-correo-animal-busco`

**Created**: 2026-10-29

**Status**: Draft

**Input**: Historia #265 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (en `main`, no se rehace): el listado con sus seis filtros (especie, sexo, tamaño,
edad, departamento, castrado), que viajan en su dirección, su total de resultados y su vacío con
«Sacar los filtros» (#57); las camadas en el listado, con su ficha y su cantidad de crías (#205,
#206); el ciclo de vida de una publicación (disponible, en proceso, pausada, vencida, adoptada, dada
de baja, borrada) y su renovación (#59); los bloqueos y la suspensión, con lo que cada uno saca del
listado (#13); entrar con Google o con el enlace por correo y volver al lugar de donde se salió (#9,
#14); Mi perfil y sus listas («Mis solicitudes», «Mis avales», «Mis bloqueos»); borrar la cuenta;
la corrida diaria de las 8 de la mañana que manda el resumen de quien administra, y los correos del
sitio con su plantilla (#169, docs/03 §6); la medición sin la persona y el origen de cada visita a
una ficha (#71, #169, #238, #259). Ya en `main`: nada de esta historia (no hay avisos guardados,
«Avisame cuando haya uno así», «Mis avisos» ni «Dejar de recibir»). La historia #259 (otros
animales parecidos cuando no te eligen) es otra capacidad y no cubre este alcance.

**Vocabulario de esta spec**:

- **Un aviso** son los filtros del listado guardados por una persona con cuenta, tal como estaban
  al tocar «Avisame cuando haya uno así». Sin filtros también es un aviso: «Todos los animales en
  adopción».
- **El nombre del aviso** es el aviso escrito en palabras a partir de sus filtros, por ejemplo
  «Perros chicos o medianos en Montevideo».
- **Lo que se ve en el listado** es lo que hoy muestra el listado a cualquier visitante: un animal o
  una camada disponible o en proceso, no vencido ni dado de baja, de alguien con el teléfono
  verificado y sin suspender.
- **La primera aparición** de un animal o una camada es el primer momento en que se vio en el
  listado. Pausarlo y reanudarlo, renovarlo, editarlo, que quien publicó pierda y recupere el
  teléfono o que se levante una suspensión no le dan una primera aparición nueva.
- **Una corrida cubre a una persona** cuando le mandó su correo de avisos, cuando no tenía nada
  nuevo o cuando su cuenta estaba suspendida. No la cubre si su correo tenía que salir y no salió.
- **Nuevo para un aviso** es un animal o una camada cuya primera aparición fue después de creado el
  aviso y después de la última corrida de las 8 que cubrió a la persona.
- **La corrida de las 8** es la vuelta diaria del sitio a las 8 de la mañana de Uruguay, la misma
  del resumen de quien administra.
- **El correo de avisos** es el único correo del día que le llega a una persona con lo nuevo de sus
  avisos.
- **Dejar de recibir** es el enlace al pie de cada correo de avisos que borra todos los avisos de
  la persona sin que tenga que entrar.
- Todo día y toda hora se cuentan en hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guardar lo que busco desde el listado y verlo en «Mis avisos» (Priority: P1)

Bruno entró con su cuenta, filtró el listado por «perro», «chico» y «Montevideo» y no hay ninguno.
En el lugar del vacío, al lado de «Sacar los filtros», ve «Avisame cuando haya uno así». Lo toca y
una línea le confirma que le van a avisar por correo, con un enlace a «Mis avisos». En Mi perfil,
«Mis avisos» muestra «Perros chicos en Montevideo», con el enlace que abre el listado con esos
filtros y «Borrar».

**Why this priority**: es la parte que hace que alguien elija esperar acá en vez de volver al grupo.
Sin avisos guardados no hay nada que mandar, y «Mis avisos» es donde la persona ve qué guardó y
donde la manda la pantalla cuando llega al máximo.

**Independent Test**: con personas sembradas sin avisos, con uno y con tres: crear un aviso desde el
listado con resultados, sin resultados y sin filtros; repetir los mismos filtros en otro orden;
intentar un cuarto; cortar la conexión y tocar dos veces; hacerlo sin sesión y entrar con Google y
con el enlace por correo; abrir «Mis avisos», seguir el enlace de cada aviso y borrar uno.

**Acceptance Scenarios**:

1. **Dado** que Bruno entró con su cuenta y filtró el listado por «perro», «chico» y «Montevideo», y
   no hay ninguno, **cuando** toca «Avisame cuando haya uno así», **entonces** ve que le van a avisar
   por correo, y en «Mis avisos» aparece «Perros chicos en Montevideo».
2. **Dado** que el listado tiene resultados con los filtros de Bruno, **cuando** mira la pantalla,
   **entonces** «Avisame cuando haya uno así» está cerca del total de resultados; si los filtros no
   dan resultados, está en el lugar del vacío, al lado de «Sacar los filtros».
3. **Dado** que Ana no tiene sesión y filtró el listado por «gato» y «Canelones», **cuando** toca
   «Avisame cuando haya uno así» y entra con su cuenta, **entonces** vuelve al mismo listado con esos
   filtros, ve que el aviso quedó creado y no tiene que tocarlo de nuevo.
4. **Dado** que Ana no tiene cuenta, **cuando** toca «Avisame cuando haya uno así», crea su cuenta y
   completa su perfil, **entonces** vuelve al mismo listado con el aviso creado.
5. **Dado** que Bruno no eligió ningún filtro, **cuando** toca «Avisame cuando haya uno así»,
   **entonces** el aviso se crea y en «Mis avisos» se llama «Todos los animales en adopción».
6. **Dado** que Bruno ya tiene un aviso con «gato» y «Canelones», **cuando** vuelve a tocar «Avisame
   cuando haya uno así» con esos mismos filtros, **entonces** ve que ya tiene ese aviso y no se crea
   otro.
7. **Dado** que Bruno tiene 3 avisos, **cuando** intenta crear un cuarto, **entonces** ve que llegó
   al máximo de 3, no se crea y tiene a mano el camino a «Mis avisos» para borrar uno.
8. **Dado** que se cortó la conexión o el sitio no respondió, **cuando** Bruno toca «Avisame cuando
   haya uno así», **entonces** ve al lado del botón que no se pudo crear y puede volver a intentarlo;
   no queda un aviso a medias ni uno repetido.
9. **Dado** que Bruno tiene «Perros chicos o medianos en Montevideo», **cuando** toca su enlace en
   «Mis avisos», **entonces** se abre el listado con «perro», «chico», «mediano» y «Montevideo»
   filtrados.
10. **Dado** que Bruno tiene dos avisos, **cuando** toca «Borrar» en uno, **entonces** ese aviso
    desaparece de «Mis avisos», el otro queda, y desde la próxima corrida de las 8 no le llega nada
    del borrado.
11. **Dado** que Bruno no tiene avisos, **cuando** abre «Mis avisos», **entonces** ve que no tiene
    avisos y un enlace al listado.

---

### User Story 2 - Recibir un solo correo por día con lo nuevo (Priority: P2)

Bruno tiene «Perros chicos en Montevideo». Ayer, después de las 8, Carla publicó a Tobi, perro chico
en Montevideo, y Rita publicó una camada de perros chicos en Montevideo. Hoy a las 8 le llega un
solo correo con una parte para su aviso: Tobi y la camada, cada uno con su foto, su nombre y su zona.
Tocar uno abre su ficha, y el enlace de abajo abre el listado con esos filtros. Al pie está «Dejar de
recibir».

**Why this priority**: es lo que le da a quien busca un motivo para esperar acá, y lo que le lleva a
quien rescata gente que ya estaba esperando su animal. Se apoya en los avisos de la US1.

**Independent Test**: con avisos sembrados y animales y camadas cuya primera aparición cae antes y
después de la creación del aviso y del último correo, correr la corrida de las 8 y leer los correos
que salen: qué personas reciben, cuántos correos, qué partes, qué animales en qué orden, los
enlaces; repetir con pausas, adopciones, vencimientos, borrados, bloqueos en las dos direcciones,
animales propios, cuentas suspendidas y un correo que no salió.

**Acceptance Scenarios**:

1. **Dado** que Bruno tiene «Perros chicos en Montevideo» y ayer, después de las 8, Carla publicó a
   Tobi, perro chico en Montevideo, y Rita publicó una camada de perros chicos en Montevideo,
   **cuando** son las 8 de la mañana, **entonces** a Bruno le llega un solo correo con Tobi y la
   camada, cada uno con su foto, su nombre y su zona. Tocar uno abre su ficha, y el enlace de abajo
   abre el listado con «perro», «chico» y «Montevideo» filtrados.
2. **Dado** que Tobi se publicó ayer y Carla lo pausó hoy a las 7, **cuando** sale el correo de las
   8, **entonces** Tobi no está; y si Carla lo reanuda la semana siguiente, tampoco llega en un
   correo posterior.
3. **Dado** que Bruno tiene «Perros en Montevideo» y «Perros chicos», y se publica un perro chico en
   Montevideo, **cuando** sale el correo, **entonces** el perro aparece una sola vez, en la parte del
   primer aviso.
4. **Dado** que esa noche se publicaron 9 perros que coinciden con un aviso de Bruno, **cuando** sale
   el correo, **entonces** muestra los 6 publicados más recientemente y un enlace al listado filtrado
   donde están los 9.
5. **Dado** que Rita bloqueó a Bruno, o Bruno la bloqueó a ella, que Bruno publicó un perro chico en
   Montevideo y que Rita publicó otro, **cuando** sale el correo, **entonces** ninguno de los dos
   está, y el correo no dice que faltan.
6. **Dado** que en el día no se publicó nada que coincida con los avisos de Bruno, **cuando** son las
   8, **entonces** no le llega ningún correo.
7. **Dado** que la cuenta de Bruno está suspendida, **cuando** son las 8, **entonces** no le llega
   ningún correo, y lo publicado en esos días no le llega cuando se levanta la suspensión.
8. **Dado** que el correo de ayer de Bruno no salió, **cuando** sale el de hoy, **entonces** trae lo
   nuevo desde el último correo que sí le llegó.
9. **Dado** que Carla publicó una camada de cinco cachorros, **cuando** la camada va en el correo,
   **entonces** va como uno solo, con su foto, su nombre, su zona y la cantidad de crías.
10. **Dado** que Carla renovó a Luna, que estaba en el listado desde antes de que Bruno creara su
    aviso, o editó su descripción, **cuando** sale el correo, **entonces** Luna no está.
11. **Dado** que Carla publicó a Tobi a las 10 y Bruno creó su aviso a las 11, **cuando** sale el
    correo del día siguiente, **entonces** Tobi no está: ya estaba en el listado cuando Bruno lo
    miró.

---

### User Story 3 - Dejar de recibir con un toque, sin entrar (Priority: P3)

A Bruno le llegó un correo de avisos y ya no busca. Toca «Dejar de recibir» al pie. Se abre una
pantalla que le confirma que no le van a llegar más avisos, con un enlace al listado, sin pedirle que
entre. Si después entra, «Mis avisos» está vacío.

**Why this priority**: obligar a entrar para dejar de recibir lleva a que el correo se marque como no
deseado, y eso corta los correos del sitio para todos. Va en cada correo de la US2.

**Independent Test**: con correos de avisos generados para personas sembradas, abrir su «Dejar de
recibir» sin sesión, con la sesión de otra persona y dos veces; abrir uno alterado y uno de una
cuenta borrada; mirar «Mis avisos» y la corrida de las 8 después.

**Acceptance Scenarios**:

1. **Dado** que a Bruno le llegó un correo de avisos, **cuando** toca «Dejar de recibir»,
   **entonces** ve una pantalla que le confirma que no le van a llegar más avisos, sin tener que
   entrar, y «Mis avisos» queda vacío.
2. **Dado** que Bruno ya dejó de recibir, **cuando** vuelve a tocar el mismo enlace, **entonces** ve
   la misma confirmación y no pasa nada más.
3. **Dado** que alguien abre un enlace de «Dejar de recibir» alterado, o uno de una cuenta que ya se
   borró, **cuando** se carga la pantalla, **entonces** ve que el enlace no sirve y cómo manejar los
   avisos desde Mi perfil, sin que la pantalla diga de quién era el enlace.
4. **Dado** que Bruno dejó de recibir, **cuando** son las 8 del día siguiente, **entonces** no le
   llega ningún correo de avisos.
5. **Dado** que Ana tiene la sesión abierta en el teléfono y abre el «Dejar de recibir» de un correo
   de Bruno, **cuando** se carga la pantalla, **entonces** se borran los avisos de Bruno, no los de
   Ana, y la pantalla no dice de quién eran.

---

### Edge Cases

- **El primer aviso es el más viejo**: el animal que coincide con dos avisos va en la parte del
  aviso que la persona creó primero.
- **Coincidir se mira a la hora de mandar**: un animal nuevo para el aviso que a las 8 coincide con
  sus filtros va, aunque lo hayan editado después de su primera aparición; uno que dejó de coincidir
  por una edición no va. La edad se cuenta a la hora de mandar, como en el listado.
- **Lo que se puede solicitar a la hora de mandar** es lo que se ve en el listado a esa hora para la
  persona: disponible o en proceso, no vencido, no dado de baja, no borrado, de alguien con el
  teléfono verificado y sin suspender, que no es de la persona y sin un bloqueo en ninguna
  dirección. El nivel que pide quien publicó no lo saca: el correo no sabe si la persona va a
  verificarse.
- **Una camada con el filtro de sexo** coincide si tiene alguna cría disponible o en proceso de ese
  sexo, como en el listado.
- **Una camada en el correo** cuenta como uno de los 6 de su parte y como uno en la medición.
- **Un aviso sin filtros** recibe todo lo nuevo, con el mismo tope de 6 por parte.
- **Filtros que el listado junta**: marcar todas las opciones de un filtro es lo mismo que no
  marcar ninguna, como en el listado; dos avisos que el listado busca igual son el mismo aviso.
- **Un aviso sin nada nuevo** el día que otro aviso de la persona sí tiene no lleva parte en el
  correo.
- **Un día sin nada nuevo** no sale correo, y el próximo correo trae lo nuevo desde el último que sí
  llegó.
- **Lo que no entró en los 6** no vuelve en un correo posterior: ya estuvo a un toque, en el enlace
  al listado.
- **La corrida que llega tarde** igual manda a lo sumo un correo por persona ese día.
- **Una cuenta suspendida** no recibe correo mientras dura la suspensión, y lo que tuvo su primera
  aparición en esos días no le llega después.
- **Borrar la cuenta** borra sus avisos; un «Dejar de recibir» viejo de esa cuenta dice que el
  enlace no sirve.
- **Un «Dejar de recibir» viejo** corta los avisos que la persona tiene al abrirlo, también los que
  creó después de ese correo.
- **La sesión vencida al crear**: si la sesión se cerró entre mirar el listado y tocar el botón, la
  persona entra y vuelve con el aviso creado, como alguien sin sesión.
- **Volver de entrar con un aviso repetido o en el máximo**: si al volver ya tiene ese aviso o ya
  tiene 3, ve lo mismo que si lo hubiera tocado con sesión.
- **Una cuenta suspendida** no llega al listado con sesión ni a «Mis avisos» (#13), así que no crea
  avisos.
- **El correo va a la dirección de la cuenta**: si la persona la cambia, el siguiente va a la nueva.
- **Quien publica no recibe sus propios animales**, aunque coincidan con un aviso suyo.
- **El tope de 6 y los repetidos**: un animal que coincide con dos avisos pertenece al primero; si
  en esa parte queda fuera de los 6, no pasa a la parte del otro aviso.
- **Las crías de una camada** no van por separado: va la camada, como en el listado.
- **Cambiar los filtros después de crear**: la confirmación es de los filtros con los que se creó;
  al cambiarlos, el listado vuelve a ofrecer «Avisame cuando haya uno así» para los nuevos.
- **Quien no termina de entrar**: si toca el botón sin sesión y no termina de entrar, no queda
  ningún aviso creado ni pendiente.
- **Una cuenta borrada entre el comienzo de la corrida y el envío** no recibe el correo.
- **Ninguna pantalla nueva se indexa**: «Mis avisos» y «Dejar de recibir» son privadas.

## Requirements *(mandatory)*

### Functional Requirements

#### Crear un aviso

- **FR-001**: El listado DEBE ofrecer «Avisame cuando haya uno así» cerca del total de resultados.
  Cuando los filtros no dan resultados, el ofrecimiento DEBE ir en el lugar del vacío, al lado de
  «Sacar los filtros».
- **FR-002**: Tocarlo DEBE guardar como un aviso los seis filtros del listado tal como están en ese
  momento, también sin ninguno. El orden en que se marcaron y la tanda que se está mirando no son
  parte del aviso.
- **FR-003**: Crear un aviso DEBE pedir una cuenta con sesión y NO DEBE pedir el teléfono verificado
  ni ningún otro nivel.
- **FR-004**: Quien no tiene sesión DEBE poder tocarlo, entrar (o crear su cuenta y completar su
  perfil) y volver al mismo listado, con los mismos filtros, con el aviso ya creado y la
  confirmación a la vista, sin volver a tocarlo.
- **FR-005**: Después de crearlo, DEBE aparecer una línea que confirma que le van a avisar por
  correo, con un enlace a «Mis avisos». Mientras se crea, el botón DEBE verse ocupado y no aceptar
  otro toque.
- **FR-006**: Si ya tiene un aviso con los mismos filtros, NO DEBE crearse otro, también si lo pide
  dos veces a la vez, y la persona DEBE ver que ya lo tiene.
- **FR-007**: Cada persona DEBE tener como mucho 3 avisos, también si crea dos a la vez desde dos
  pestañas. Con 3, el cuarto NO DEBE crearse, y la persona DEBE ver que llegó al máximo de 3 y un
  camino a «Mis avisos» para borrar uno.
- **FR-008**: Si no se pudo crear (sin conexión, el sitio no respondió), la persona DEBE ver al lado
  del botón un mensaje de que no se pudo y poder volver a intentarlo. Tocar dos veces o reintentar NO DEBE dejar
  un aviso repetido ni uno a medias.

#### «Mis avisos»

- **FR-009**: Mi perfil DEBE llevar a «Mis avisos», junto a las otras listas de la persona.
- **FR-010**: «Mis avisos» DEBE mostrar cada aviso de la persona con su nombre en palabras, el
  enlace que abre el listado con esos filtros y «Borrar», del más viejo al más nuevo.
- **FR-011**: El nombre del aviso DEBE decir todos sus filtros en una frase («Perros chicos o
  medianos en Montevideo»), y un aviso sin filtros DEBE llamarse «Todos los animales en adopción».
  El mismo nombre DEBE usarse en «Mis avisos» y en el correo.
- **FR-012**: «Borrar» DEBE borrar ese aviso solo, sin tocar los otros. Mientras se borra, su
  «Borrar» DEBE verse ocupado y no aceptar otro toque. Si no se pudo, el aviso DEBE seguir en la
  lista con un mensaje de que no se pudo, y la persona DEBE poder volver a intentarlo.
- **FR-013**: Sin avisos, «Mis avisos» DEBE decir que no tiene avisos, con un enlace al listado.
  Mientras carga, DEBE mostrar renglones en esqueleto; si no se pudo leer, un mensaje de error y
  «Reintentar».

#### El correo de avisos

- **FR-014**: En la corrida de las 8, a cada persona con al menos un aviso que tiene algo nuevo DEBE
  llegarle un solo correo, a la dirección de su cuenta. A lo sumo un correo por persona por día.
- **FR-015**: Un animal o una camada DEBE contar como nuevo para un aviso solo si su primera
  aparición en el listado fue después de creado el aviso y después de la última corrida de las 8 que
  cubrió a la persona. Lo que una corrida ya cubrió NO DEBE llegar en un correo posterior, aunque ese
  día no haya ido en el correo porque no se podía solicitar o no coincidía. Volver de una pausa, renovarse, editarse, que quien publicó recupere el
  teléfono o que se levante una suspensión NO DEBEN contar como una aparición nueva.
- **FR-016**: El correo DEBE traer solo lo que, a la hora de mandarlo, se ve en el listado y coincide
  con los filtros del aviso: lo que se pausó, se adoptó, venció, se dio de baja o se borró antes NO
  DEBE ir.
- **FR-017**: El correo NO DEBE traer animales ni camadas de la persona ni de alguien con quien hay un
  bloqueo, en cualquier dirección, y NO DEBE decir que falta algo ni por qué.
- **FR-018**: El correo DEBE tener una parte por aviso con algo nuevo, en el orden en que se crearon,
  cada una con el nombre del aviso, hasta 6 animales o camadas con la primera aparición más reciente
  primero, y un enlace al listado con los filtros de ese aviso.
- **FR-019**: Un animal o una camada que coincide con más de un aviso de la persona DEBE aparecer una
  sola vez, en la parte del primero.
- **FR-020**: Cada animal DEBE ir con su foto, su nombre, su especie, su edad y su zona; cada camada,
  con su foto, su nombre, su zona y la cantidad de crías. Tocar uno DEBE abrir su ficha.
- **FR-021**: Si un día no hay nada nuevo para ninguno de sus avisos, ese día NO DEBE salir correo.
  Si un correo no salió, el siguiente DEBE traer todo lo nuevo desde el último que sí llegó.
- **FR-022**: Cada correo de avisos DEBE traer «Dejar de recibir» al pie.
- **FR-023**: El correo NO DEBE llevar el teléfono, el contacto ni el nombre de quien publicó, ni de
  nadie más.
- **FR-024**: Mientras una cuenta está suspendida NO DEBE recibir correos de avisos, y lo que tuvo su
  primera aparición en esos días NO DEBE mandarse después.
- **FR-025**: La corrida de las 8 DEBE ser la misma del resumen de quien administra; si una persona
  no pudo procesarse, las demás DEBEN recibir el suyo igual.

#### Dejar de recibir

- **FR-026**: Abrir «Dejar de recibir» desde un correo DEBE borrar todos los avisos que la persona
  tiene en ese momento, sin pedirle que entre ni otro toque, y mostrar una pantalla que lo confirma,
  con un enlace al listado.
- **FR-027**: Abrirlo otra vez DEBE mostrar la misma confirmación sin hacer nada más.
- **FR-027a**: Si el sitio no pudo borrar los avisos, la pantalla NO DEBE confirmar nada: DEBE decir
  que no se pudo y ofrecer volver a intentarlo, y los avisos DEBEN quedar como estaban.
- **FR-028**: Un enlace alterado o de una cuenta que ya no existe DEBE mostrar que el enlace no sirve
  y cómo manejar los avisos desde Mi perfil, sin decir de quién era.
- **FR-029**: La pantalla de «Dejar de recibir» NO DEBE mostrar el correo, el nombre ni los avisos de
  nadie, y DEBE funcionar igual con o sin una sesión abierta, sin tocar los avisos de quien tiene la
  sesión si el enlace es de otra persona.
- **FR-030**: Nadie DEBE poder armar un enlace de «Dejar de recibir» de otra persona sin haber
  recibido su correo.

#### Datos personales

- **FR-031**: De cada aviso DEBEN guardarse solo sus filtros, cuándo se creó y hasta cuándo lo
  cubrió la última corrida (el día del último correo, o el último día sin nada nuevo), unidos a la
  cuenta. Del correo NO DEBE guardarse su contenido. No se pide ningún dato nuevo: el correo es el de la cuenta.
- **FR-032**: Los avisos de una persona DEBE poder leerlos, crearlos y borrarlos solo ella. Nadie más,
  tampoco quien administra, DEBE poder leerlos.
- **FR-033**: El resumen diario de quien administra y Administrar NO DEBEN contar ni mostrar avisos.
- **FR-034**: Los avisos DEBEN borrarse al borrarlos, con «Dejar de recibir» o al borrar la cuenta.
  NO DEBEN vencer.
- **FR-035**: Ninguna pantalla de esta historia DEBE indexarse: «Mis avisos» y «Dejar de recibir»
  son privadas.

#### Textos

- **FR-036**: Todos los textos nuevos (el botón, la confirmación, los avisos de repetido, máximo y
  error, «Mis avisos», el correo, «Dejar de recibir» y sus pantallas, los nombres de los avisos)
  DEBEN estar en español rioplatense con voseo, escritos y revisados con el skill sin-slop.

#### Medición

- **FR-037**: DEBE medirse cuándo se crea un aviso, con cuántos filtros y si se creó desde un listado
  sin resultados.
- **FR-038**: DEBE medirse cuándo sale un correo de avisos, con cuántos animales y camadas trae.
- **FR-039**: La ficha de un animal o de una camada abierta desde el correo DEBE contarse con un
  origen propio, y lo que sigue en esa visita («Quiero adoptar», los frenos de la verificación y la
  solicitud mandada) DEBE medirse como en cualquier otra visita.
- **FR-040**: DEBE medirse cuándo se borra un aviso y si fue desde el correo o desde el perfil.
- **FR-041**: Nada de la medición DEBE llevar a la persona ni los filtros que eligió.
- **FR-042**: docs/03 §Métricas de éxito DEBE decir cómo se lee esto al lado de las lecturas 2 y 5:
  qué parte de las solicitudes trae el sitio sin pasar por un grupo (las que empiezan en una ficha
  abierta desde el correo de avisos) y si quien eligió esperar acá después acepta verificarse.

### Key Entities

- **Aviso**: los filtros del listado guardados, cuándo se creó y hasta cuándo lo cubrió la última
  corrida de las 8. Pertenece a una cuenta, que tiene a lo sumo 3, y no se repite.
- **Primera aparición**: el momento en que un animal o una camada se vio por primera vez en el
  listado. No cambia después.
- **Correo de avisos**: uno por persona por día como mucho, con una parte por aviso con algo nuevo y
  «Dejar de recibir» al pie. No se guarda su contenido.
- **Enlace de Dejar de recibir**: identifica a la persona sin mostrar quién es y no se puede adivinar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde un listado filtrado, una persona con sesión crea un aviso con un solo toque, y
  una sin sesión con un toque más la entrada, en el 100 % de las pruebas.
- **SC-002**: En el 100 % de las pruebas de la corrida de las 8, cada persona recibe a lo sumo un
  correo, ese correo trae exactamente lo nuevo que coincide y se puede solicitar, y ningún animal se
  repite dentro del correo ni en un correo posterior.
- **SC-003**: En el 100 % de las pruebas, ningún correo trae un animal propio, de alguien con un
  bloqueo, pausado, adoptado, vencido, dado de baja o borrado, ni sale a una cuenta suspendida.
- **SC-004**: En el 100 % de las pruebas de visibilidad, un visitante, otra persona y quien
  administra no leen ni cambian los avisos de nadie.
- **SC-005**: «Dejar de recibir» corta los avisos con un solo toque desde el correo, sin entrar, en
  el 100 % de las pruebas, y un enlace alterado no corta los de nadie.
- **SC-006**: Con la medición, el equipo puede decir cuántas solicitudes empezaron en una ficha
  abierta desde el correo de avisos, sin saber de quién son.

## Assumptions

- **Carril feature**: la historia guarda algo nuevo (avisos unidos a la cuenta, el día del último
  correo, la primera aparición), suma una tarea diaria que corre sola y una regla de visibilidad
  nueva.
- **La primera aparición** es un dato de cada animal y cada camada que hoy no existe: la fecha de
  publicación cambia al renovar, así que no alcanza. Para lo que ya está en el listado el día que
  llega esta historia, la primera aparición es su fecha de publicación de ese día; como ningún aviso
  existe antes, nada viejo llega como nuevo. No es un dato personal: no dice nada de quien busca.
- **«Lo que la persona puede solicitar»** se lee como lo que el listado le muestra a esa persona a la
  hora de mandar, sin los suyos y sin bloqueos en las dos direcciones. El nivel que exige quien
  publicó no lo saca, porque la persona puede verificarse al solicitar (docs/01 §Verificación =
  fricción); un animal en proceso sí va, porque recibe solicitudes (docs/03 §4).
- **«Publicados más recientemente»** se ordena por la primera aparición, la más reciente primero:
  es la fecha que decide si es nuevo.
- **El primer aviso** es el que la persona creó primero.
- **Lo que una corrida ya miró no vuelve**: la historia guarda «el día del último correo», pero si
  solo avanzara con un correo, un animal nuevo que a las 8 estaba pausado volvería en el correo de la
  semana siguiente al reanudarse, y el caso borde de Tobi pide lo contrario. Por eso cada corrida que
  cubre a la persona (con correo, sin nada nuevo o suspendida) cierra ese período para todos sus
  avisos; la que no pudo mandar el correo no lo cierra, y así el siguiente trae todo lo nuevo desde
  el último que llegó. Un aviso creado después empieza a contar desde su creación.
- **Cuándo se creó y hasta cuándo se cubrió** se guardan con su hora, no solo el día: lo que ya
  estaba en el listado cuando la persona creó el aviso no tiene que llegar como nuevo al día
  siguiente (el caso de Tobi a las 10 y el aviso a las 11). Nadie más que la persona los lee.
- **Un enlace de «Dejar de recibir» de un correo de hace más de seis meses** deja de servir y
  muestra lo mismo que uno alterado, con el camino a Mi perfil. Cada correo nuevo trae uno que
  sirve.
- **Coincidir se mira a la hora de mandar**, con los datos de ese momento y la edad de ese día, como
  el listado: la historia dice que va lo que la persona puede solicitar a esa hora.
- **Lo que no entró en los 6** no vuelve en otro correo: el enlace al listado ya lo muestra, y
  mandarlo después sería avisar dos veces.
- **Dos avisos iguales** son dos avisos que el listado busca igual: el orden de las opciones no
  importa, y marcar todas las opciones de un filtro es no marcar ninguna, como ya hace el listado.
- **«Dejar de recibir» con un toque** se resuelve con abrir el enlace: abrirlo corta los avisos y
  muestra la confirmación, sin otro toque. Un programa que revisa los enlaces del correo antes que la
  persona no los corta. Si el navegador no corre JavaScript, la pantalla pide un toque en «Dejar de
  recibir». El botón para darse de baja que ofrecen algunos programas de correo también corta los
  avisos.
- **Un «Dejar de recibir» viejo** corta los avisos que la persona tiene al abrirlo, también los
  creados después: es un solo enlace por persona y la historia lo describe como «corta todos sus
  avisos».
- **Crear un aviso desde la vuelta de entrar**: el pedido acompaña a la persona hasta que vuelve al
  listado, así que entrar con el enlace por correo abierto en otro dispositivo también crea el aviso
  al llegar.
- **Medir un «Dejar de recibir»** cuenta un borrado desde el correo por cada aviso que cortó. Borrar
  la cuenta no se cuenta como borrado de avisos.
- **La sección «Mis avisos»** va en Mi perfil, junto a «Mis solicitudes», «Mis avales» y «Mis
  bloqueos»; su dirección propia es privada.
- **La corrida que se cae** ese día: si la corrida de las 8 no llega a correr, no sale ningún correo,
  y el de la corrida siguiente trae lo nuevo desde el último que salió, con el mismo tope de 6 por
  parte.
- **Las referencias «docs/01 §Huevo y gallina», «docs/03 §3», «docs/03 §Hipótesis», «docs/03
  §Métricas de éxito»** y los números de historia del cuerpo son referencias a documentos y al
  backlog, no pantallas.
- **Las decisiones del enjambre de la historia** (las siete del 2026-10-29, product-owner) van a
  docs/03 palabra por palabra en esta rama: seis a §3 y una a §7.
