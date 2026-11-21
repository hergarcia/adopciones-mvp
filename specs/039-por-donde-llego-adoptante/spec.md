# Feature Specification: Al marcar un animal dado por fuera, decir por dónde llegó quien lo adoptó

**Feature Branch**: `feature/254-por-donde-llego-adoptante`

**Created**: 2026-11-21

**Status**: Draft

**Input**: Historia #254 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (en `main`, no se rehace): la pantalla de marcar adoptado con «¿A quién se lo
diste?», las personas con la solicitud aceptada y «Se lo di a alguien que no vino por el sitio», con
su nota, el caso sin aceptadas en el que «por fuera» es el único camino, los avisos de conexión, de
sesión cerrada y de «{nombre} cambió mientras tanto» (#67); marcar cada cría de una camada por
separado (#205, #206); volver a publicar un animal adoptado (#59); y la medición de cada adopción
marcada, que hoy dice si fue por el sitio o por fuera, los días desde que se publicó y si era una
cría, sin la persona ni el animal (#67, #169, #206). Esta spec agrega la pregunta «¿Por dónde te
encontró?» en el camino por fuera, el canal elegido sumado a esa medición y la lectura nueva de
docs/03 §Métricas de éxito. No cambia cómo se marca adoptado ni lo que pasa después.

**Vocabulario de esta spec**:

- **El camino por fuera** es marcar adoptado con «Se lo di a alguien que no vino por el sitio» (o
  «Se la di…»), elegido entre las opciones o como el único camino porque no hay solicitudes
  aceptadas.
- **La pregunta** es «¿Por dónde te encontró?», con seis opciones fijas, en este orden: «Un grupo o
  una página de Facebook» · «Instagram» · «Un estado o un grupo de WhatsApp» · «Vio a {nombre} en este
  sitio y me escribió directo» · «Alguien que conozco, o me lo recomendaron» · «Por otro lado».
  {nombre} es el nombre con el que la pantalla nombra al animal o a la cría que se marca.
- **El canal** es lo que se cuenta de una adopción por fuera: la opción elegida al confirmar o **sin
  contestar**.
- **La medición de la adopción** es el momento que ya se cuenta al marcar adoptado (#67): por el
  sitio o por fuera, los días desde que se publicó y si era una cría.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Decir por dónde llegó al marcar un animal dado por fuera (Priority: P1)

Carla publicó a Luna y no tiene solicitudes aceptadas. Abre «Marcar adoptada» y, debajo de la nota de
que no queda compromiso, ve «¿Por dónde te encontró?» con seis opciones, ninguna elegida, y una línea
que le deja claro que contestar es opcional. Toca «Un grupo o una página de Facebook» y «Marcar
adoptada». Luna queda adoptada como hoy y la medición de esa adopción cuenta Facebook como canal, sin
el nombre de Carla ni el de Luna.

**Why this priority**: es la parte que junta el dato. La hipótesis de docs/03 pregunta si la gente
deja el grupo por el sitio, y hoy una adopción por fuera no dice contra qué canal se perdió. Con esta
parte sola el dato ya existe y se lee en la medición.

**Independent Test**: con un animal sembrado sin solicitudes aceptadas y otro con una aceptada: abrir
la pantalla de marcar adoptado y ver la pregunta solo en el camino por fuera; marcar con cada opción,
sin opción, después de cambiarla o dejarla sin elegir, y después de pasar a la persona aceptada; cortar
la conexión; tocar dos veces; marcarlo en otra pestaña; cerrar la sesión antes de confirmar; y
comparar lo que cuenta la medición en cada caso.

**Acceptance Scenarios**:

1. **Dado** que Carla publicó a Luna y no tiene solicitudes aceptadas, **cuando** abre «Marcar
   adoptada», **entonces** ve «¿Por dónde te encontró?» con las seis opciones y ninguna elegida,
   debajo de la nota y antes de «Marcar adoptada».
2. **Dado** que Carla eligió «Un grupo o una página de Facebook», **cuando** toca «Marcar adoptada»,
   **entonces** Luna queda adoptada por fuera del sitio como hoy, y la medición cuenta esa adopción
   con Facebook como canal.
3. **Dado** que Carla no eligió ninguna opción, **cuando** toca «Marcar adoptada», **entonces** Luna
   queda adoptada como hoy y la adopción se cuenta como «sin contestar».
4. **Dado** que Carla tiene una solicitud aceptada de Beto, **cuando** elige «Se la di a alguien que
   no vino por el sitio», **entonces** aparece la pregunta con ninguna opción elegida.
5. **Dado** que Carla tiene una solicitud aceptada de Beto, **cuando** elige a Beto, **entonces** la
   pregunta no aparece y la pantalla es la de hoy; si había elegido «Instagram» en el camino por
   fuera y vuelve a Beto, la pregunta se va y al marcar no se cuenta ningún canal.
6. **Dado** que Carla eligió «Instagram» por error, **cuando** la vuelve a tocar o elige otra antes
   de confirmar, **entonces** queda sin elegir o con la nueva, y se cuenta solo lo que había al
   confirmar.
7. **Dado** que Carla eligió «Vio a Luna en este sitio y me escribió directo», **cuando** marca
   adoptada, **entonces** esa adopción se cuenta con un canal propio, aparte de Facebook, Instagram y
   WhatsApp.
8. **Dado** que Carla eligió «Instagram» y se corta la conexión, **cuando** toca «Marcar adoptada»,
   **entonces** Luna sigue como estaba, «Instagram» sigue elegida, ve que no se pudo por la
   conexión, y al tocar de nuevo Luna queda adoptada y se cuenta una sola adopción, con Instagram.
9. **Dado** que Carla toca dos veces «Marcar adoptada», **cuando** termina, **entonces** queda una
   sola adopción contada, con lo que había elegido.
10. **Dado** que Carla marcó a Luna adoptada en otra pestaña, **cuando** confirma desde esta con una
    opción elegida, **entonces** ve «Luna cambió mientras tanto. Ahora ves cómo quedó.» como hoy, y
    no se cuenta otra adopción ni otra respuesta.
11. **Dado** que la sesión de Carla se cerró, **cuando** toca «Marcar adoptada», **entonces** se le
    pide entrar de nuevo como hoy, Luna no cambia y no se cuenta nada.

---

### User Story 2 - Cada cría y cada entrega trae su propia pregunta (Priority: P2)

La camada de Mora tiene tres crías. Carla da dos por fuera: marca adoptada a cada una por separado,
como hoy, y en cada una ve la pregunta con el nombre de esa cría y ninguna opción elegida. Se cuentan
dos respuestas, una por cría. Meses después, Luna vuelve a Carla, que la publica de nuevo y la da otra
vez por fuera: la pregunta aparece de nuevo sin nada elegido y se cuenta como otra adopción, sin tocar
la primera.

**Why this priority**: cada cría y cada entrega es una adopción distinta que pudo llegar por otro
canal, y la medición ya cuenta una adopción por cada una. Reusa todo lo de la US1; lo que cambia es
que la pregunta no recuerda nada de una adopción a otra.

**Independent Test**: con una camada sembrada de tres crías sin aceptadas y un animal que ya fue
adoptado por fuera, se volvió a publicar y está disponible: marcar dos crías por fuera con opciones
distintas y ver dos respuestas, cada una con la suya y marcada como cría; marcar al animal otra vez
por fuera y ver una respuesta nueva, con la primera igual que antes.

**Acceptance Scenarios**:

1. **Dado** que la camada de Mora tiene tres crías y Carla da dos por fuera, **cuando** marca
   adoptada a cada una, **entonces** ve la pregunta en cada cría y se cuentan dos respuestas, una por
   cría, cada una con lo que eligió en esa.
2. **Dado** que Carla abre la pantalla de marcar adoptada a una cría, **cuando** lee la cuarta
   opción, **entonces** dice «Vio a {nombre} en este sitio y me escribió directo» con el nombre con el
   que la pantalla nombra a esa cría.
3. **Dado** que Carla marcó a Luna adoptada por fuera con «Instagram», la volvió a publicar y la da
   otra vez por fuera, **cuando** abre «Marcar adoptada», **entonces** ve la pregunta sin ninguna
   opción elegida, y al confirmar se cuenta una adopción nueva sin cambiar la anterior.
4. **Dado** que Carla da una cría a Beto, que tenía la solicitud aceptada, **cuando** la marca,
   **entonces** la pregunta no aparece y esa adopción no lleva canal.

---

### User Story 3 - Leer contra qué canal se pierde una adopción (Priority: P3)

Quien lee la medición abre docs/03 §Métricas de éxito y encuentra una lectura nueva: de las
adopciones por fuera, qué parte llegó por Facebook, Instagram o WhatsApp, qué parte trajo el sitio
aunque la conversación se fue al chat, qué parte llegó por alguien conocido o por otro lado y cuántas
no se contestaron, al lado de las adopciones con una solicitud aceptada.

**Why this priority**: es donde el dato se vuelve una respuesta a la hipótesis. Sin la lectura el
canal existe pero nadie sabe cómo leerlo; se apoya en US1 y US2.

**Independent Test**: leer la lectura nueva y, con adopciones sembradas por el sitio y por fuera con
cada canal y sin contestar, poder decir con lo que la lectura indica cuántas adopciones fueron por el
sitio, cuántas por fuera y cómo se reparten las de afuera por canal.

**Acceptance Scenarios**:

1. **Dado** que hubo adopciones por el sitio y por fuera con distintos canales, **cuando** alguien
   sigue la lectura nueva de docs/03 §Métricas de éxito, **entonces** obtiene, entre las adopciones
   por fuera, cuántas llegaron por Facebook, Instagram o WhatsApp, cuántas vio en el sitio, cuántas
   por alguien conocido, cuántas por otro lado y cuántas sin contestar, al lado del total de
   adopciones con una solicitud aceptada.
2. **Dado** que una adopción por fuera se marcó antes de que llegara esta historia, **cuando** se
   sigue la lectura, **entonces** esa adopción no tiene canal y la lectura dice que se cuenta desde el
   día en que llegó la historia.

---

### Edge Cases

- **Ida y vuelta entre caminos**: si Carla elige el camino por fuera, toca una opción, pasa a Beto y
  vuelve al camino por fuera, la pregunta aparece otra vez sin ninguna opción elegida, como cuando se
  elige por primera vez (US1-AS4). Así una opción tocada antes de cambiar de idea no se cuenta sin que
  Carla la vea elegida.
- **Mientras se marca**, las opciones no se pueden cambiar: lo que cuenta es lo que estaba elegido al
  tocar «Marcar adoptada».
- **El reintento después de un corte en el que la adopción sí llegó** termina como hoy (la pantalla
  sigue como si hubiera salido bien) y no cuenta una segunda adopción. Lo que vale es lo que estaba
  elegido en el intento que llegó, aunque Carla haya cambiado la opción antes de reintentar.
- **Una solicitud aceptada que deja de estarlo** mientras Carla tiene la pantalla abierta: el aviso
  y el «sin elegir» de hoy no cambian. Si después elige el camino por fuera, la pregunta aparece sin
  nada elegido.
- **Una adopción por el sitio** nunca lleva canal, aunque en algún momento se haya tocado una opción
  en el camino por fuera.
- **Sin solicitudes aceptadas**, la pregunta aparece apenas abre la pantalla, entre la nota (que
  también lleva el camino a las solicitudes) y «Marcar adoptada», sin ningún toque previo.
- **La sesión cerrada**: después de entrar de nuevo, la pantalla abre como siempre, sin ninguna
  opción elegida; lo elegido antes se pierde sin contarse.
- **Cancelar o irse de la pantalla** con una opción elegida no cuenta nada, y al volver la pregunta
  aparece sin nada elegido.
- **Mientras la pantalla carga, o si no se pudieron traer las solicitudes aceptadas**, todo es como
  hoy: no se puede marcar y la pregunta no aparece hasta que la pantalla deja elegir un camino.
- **Las adopciones marcadas antes de esta historia** no se preguntan ni ganan un canal después.
- **Lo que aparece después de marcar** (la encuesta de #71, el resumen de la adopción) no cambia, y
  esta pregunta no cuenta como una encuesta.
- **Una cuenta suspendida** no llega a la pantalla de marcar adoptado (#13), así que no contesta.

## Requirements *(mandatory)*

### Functional Requirements

#### Cuándo aparece

- **FR-001**: La pantalla de marcar adoptado DEBE mostrar la pregunta mientras el camino por fuera
  está elegido, y desde que se abre cuando el camino por fuera es el único porque no hay solicitudes
  aceptadas.
- **FR-002**: La pregunta NO DEBE aparecer mientras está elegida una persona con la solicitud
  aceptada, ni antes de elegir un camino cuando hay aceptadas. En esos casos la pantalla DEBE ser la
  de hoy.
- **FR-003**: La pregunta DEBE aparecer en cada marcado por fuera: en cada animal, en cada cría de una
  camada marcada por separado y en cada vez que un animal vuelto a publicar se marca otra vez por
  fuera, sin recordar lo contestado antes.
- **FR-004**: La pregunta NO DEBE aparecer en ningún otro lugar: ni al sacar de la vista, pausar o
  borrar un animal, ni en la ficha, en «Mis animales», en el perfil o en Administrar.

#### Contestar y marcar

- **FR-005**: La pregunta DEBE ir debajo de «Se lo di a alguien que no vino por el sitio» y de su
  nota (o, sin aceptadas, debajo de la nota única), antes del botón de confirmar y de «Cancelar», como
  un grupo de seis opciones de una sola elección con su título, y DEBE dejar claro que contestar es
  opcional sin sonar a formulario.
- **FR-006**: El título y las opciones DEBEN ser los de la historia, palabra por palabra y en su
  orden, y la cuarta opción DEBE llevar el nombre con el que la pantalla nombra al animal o a la cría.
- **FR-007**: Ninguna opción DEBE venir elegida al aparecer la pregunta. La persona DEBE poder elegir
  una, cambiarla por otra o volver a tocar la elegida para dejarla sin elegir, antes de confirmar.
- **FR-008**: Marcar adoptado por fuera DEBE funcionar igual, con o sin una opción elegida. La
  pregunta NUNCA DEBE agregar un toque ni frenar marcar, y «Cancelar» DEBE seguir yéndose sin marcar
  nada.
- **FR-009**: Al marcarse de verdad una adopción por fuera, su medición DEBE llevar exactamente un
  canal: el que estaba elegido al confirmar, o «sin contestar» si no había nada elegido. La opción
  «Vio a {nombre} en este sitio y me escribió directo» DEBE contarse como un canal propio, distinto de
  Facebook, Instagram y WhatsApp.
- **FR-010**: Una adopción a una persona con la solicitud aceptada NO DEBE llevar canal, aunque antes
  se haya tocado una opción en el camino por fuera.
- **FR-011**: Si marcar no se hace (corte, error del sitio, sesión cerrada, el animal que cambió
  mientras tanto), NO DEBE contarse ninguna adopción ni ningún canal de ese intento. Tocar dos veces o
  reintentar DEBE dejar a lo sumo una adopción contada, con un solo canal.
- **FR-012**: Si marcar no llegó, por la conexión o porque el sitio no respondió, la pantalla DEBE
  seguir con la opción elegida y el aviso de hoy, y volver a tocar el botón DEBE intentar de nuevo con
  esa opción.
- **FR-013**: Al pasar del camino por fuera a una persona aceptada, la pregunta DEBE irse, y al volver
  al camino por fuera DEBE aparecer sin ninguna opción elegida.
- **FR-014**: En el teléfono (390 px), las seis opciones DEBEN ir una debajo de la otra y el botón de
  confirmar DEBE quedar a la vista al terminar la lista. A 1280 px la pregunta DEBE ir en el mismo
  bloque de la pantalla, sin abrir otra hoja.
- **FR-015**: La pregunta DEBE poder contestarse, cambiarse y dejarse sin elegir con el teclado y con
  un lector de pantalla, que DEBE leer el título y la línea de que es opcional junto con el grupo.
- **FR-016**: Todos los textos nuevos DEBEN estar en español rioplatense con voseo, escritos y
  revisados con el skill sin-slop. La pregunta y las opciones son las de la historia, palabra por
  palabra.

#### Datos personales

- **FR-017**: La respuesta DEBE ir solo a la medición de esa adopción, que ya va sin la persona, sin
  el animal y sin textos. NUNCA DEBE llevar el nombre del animal (tampoco el de la cuarta opción), de
  quien rescata ni de quien adoptó.
- **FR-018**: La respuesta NO DEBE quedar guardada con el animal ni con la cuenta, y NO DEBE mostrarse
  en ningún lugar del sitio: ni en la ficha, ni en «Mis animales», ni en el perfil, ni a quien publicó,
  ni en Administrar, Encuestas incluida.
- **FR-019**: De quien adoptó por fuera NO DEBE pedirse ni guardarse nada: ni nombre, ni teléfono, ni
  perfil, ni enlace, ni un texto libre.
- **FR-020**: La respuesta NO DEBE poder cambiarse después de marcar.
- **FR-021**: La pantalla de marcar adoptado DEBE seguir sin indexarse.

#### Medición

- **FR-022**: La medición de cada adopción por fuera DEBE sumar su canal (Facebook, Instagram,
  WhatsApp, visto en el sitio, alguien conocido, otro lado o sin contestar), una vez por adopción y
  también por cada cría, sin agregar un momento nuevo a la medición.
- **FR-023**: docs/03 §Métricas de éxito DEBE sumar una lectura: de las adopciones por fuera, qué
  parte llegó por Facebook, Instagram o WhatsApp contra las que trajo el sitio aunque la conversación
  se fue al chat, con las de alguien conocido, otro lado y sin contestar, al lado de las adopciones
  con una solicitud aceptada; que se cuenta desde el día en que llegó la historia; y que con 3 a 5
  rescatistas se lee como señal al lado de las encuestas y de la lectura de #263.

### Key Entities

- **Canal de una adopción por fuera**: una de las seis opciones o «sin contestar». Vive solo en la
  medición de esa adopción, junto a lo que ya lleva (por fuera, los días desde que se publicó, si era
  una cría). Sin persona, sin animal, sin texto; no se guarda en el sitio ni se cambia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Marcar adoptado por fuera lleva los mismos toques que antes de esta historia, con o sin
  contestar, en el 100 % de las pruebas.
- **SC-002**: Cada adopción por fuera que se marcó lleva exactamente un canal, cada adopción por el
  sitio no lleva ninguno, y un marcado que no se hizo no cuenta nada, en el 100 % de las pruebas,
  también con doble toque, reintento, cambio de camino y cambios en otra pestaña.
- **SC-003**: En el 100 % de las pruebas, la medición de la adopción no trae el nombre del animal, de
  quien rescata ni de quien adoptó, y ninguna pantalla del sitio muestra el canal.
- **SC-004**: Con la lectura nueva y solo con la medición de las adopciones, sin cruzarla con otro
  dato, quien la mira puede decir qué parte de las adopciones por fuera llegó por Facebook, Instagram
  o WhatsApp y qué parte trajo el sitio, al lado del total de adopciones por el sitio.

## Assumptions

- **Ya en main**: la medición de la adopción por fuera ya existe y hoy no lleva canal (#67, #206). La
  pregunta, sus seis opciones y el canal en la medición no están en main. Esta spec suma el canal a ese
  momento; no agrega uno nuevo.
- **«Sin contestar» es un valor del canal**, no la ausencia de canal: así una adopción por fuera
  siempre trae canal y una por el sitio nunca, y las dos cosas se distinguen al leer.
- **Ida y vuelta entre caminos**: volver al camino por fuera después de elegir a una persona arranca
  sin ninguna opción elegida. La historia dice que al elegir el camino por fuera «aparece la pregunta
  con ninguna opción elegida» y que al pasar a la persona «la pregunta se va»; arrancar vacía evita
  contar una opción que Carla ya no ve.
- **El reintento después de un corte que sí llegó** cuenta lo del intento que llegó, aunque se haya
  cambiado la opción antes de reintentar: marcar es una sola vez por apertura de la pantalla (#67) y la
  historia pide una sola adopción contada.
- **Sesión cerrada**: lo elegido no se guarda para después de entrar; la pantalla vuelve a abrir sin
  nada elegido, como abre siempre.
- **{nombre} en la cuarta opción** es el mismo nombre que usa el título de la pantalla: el del animal
  o, para una cría, el que la nombra con su camada. El nombre no llega a la medición.
- **«Dice que es opcional sin sonar a formulario»** se resuelve con una línea corta debajo del título,
  escrita con sin-slop; el texto exacto lo fija el plan. Las seis opciones pesan igual: ninguna se
  destaca.
- **La concordancia** ya la resuelve la pantalla de hoy («Marcar adoptada», «Se la di…»). El título y
  las seis opciones no llevan pronombre que concuerde con el animal.
- **Las referencias «docs/01», «docs/03 §5», «docs/03 §7», «docs/03 §Métricas de éxito» y
  «docs/05»** del cuerpo de la historia son documentos de producto. Los números como 390, 1280 y
  18.331 son anchos de pantalla y una ley.
- **«Vacío: no aplica»** en Pantallas cuenta como el estado vacío de la pregunta: las opciones son
  fijas y no se traen de ningún lado, así que tampoco tiene un cargando ni un error propios; los de la
  pantalla son los de hoy.
- **Las decisiones del enjambre de la historia** (cuatro del 2026-10-29 y dos del 2026-11-21,
  product-owner) van a docs/03 palabra por palabra en esta rama: dos a §5, dos a §7 y dos a §Métricas
  de éxito.
- **Carril feature**: la historia agrega un dato a la medición de la adopción.
