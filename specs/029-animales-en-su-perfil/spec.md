# Feature Specification: Los animales en adopción de cada rescatista en su perfil

**Feature Branch**: `feature/238-animales-en-su-perfil`

**Created**: 2026-10-29

**Status**: Draft

**Input**: Historia #238 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (en `main`, no se rehace): el perfil público con la persona, su chapita, sus avales
y los dos números de adopciones con seguimiento (#12, #69); la pantalla de bloqueo y el «no existe»
de una cuenta suspendida (#13); el listado con su tarjeta, su orden, sus reglas de qué se ve y su
«Ver más» (#57, #59), la tarjeta de camada (#205, #206); la ficha con el enlace al perfil de quien
publicó (#57). La visita a un perfil ya se mide con de dónde llegó: navegando el sitio, desde un
enlace de afuera o desde una solicitud (#236). En «Mi perfil» ya están «Copiar el enlace» y «Mandar
el enlace» del perfil, con «Enlace copiado» y el enlace escrito cuando el navegador no deja copiar, y
ya se mide que el enlace se copió o se mandó. Lo que falta: que el perfil muestre los animales, que
«Mis animales» ofrezca el enlace del perfil, que la visita al perfil diga si mostró animales, que la
apertura de una ficha diga que vino de un perfil y que el enlace copiado diga desde qué pantalla.

**Vocabulario de esta spec**:

- **A la vista**: un animal o una camada que hoy aparece en el listado para quien mira, con todas sus
  reglas: disponible o en proceso, sin vencer, sin dar de baja, con quien publicó con el teléfono
  verificado hoy, con la cuenta sin suspender, y sin un bloqueo de quien mira hacia quien publicó.
- **La sección de animales**: el lugar del perfil público donde aparecen las tarjetas, con el título
  «En adopción».
- **El enlace del perfil**: la dirección del perfil público de la persona, la misma de siempre.
- **Un momento** es lo que ya llega a la herramienta de medición cuando pasa algo en el sitio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver en el perfil de quien rescata los animales que tiene en adopción (Priority: P1)

Bruno llegó a la ficha de Tobi desde un grupo de Facebook. Toca el nombre de Carla, ve su chapita,
sus avales y debajo, en «En adopción», las tarjetas de Tobi, Luna y Mora, iguales a las del listado.
Toca la de Luna, llega a su ficha y la puede solicitar como desde el listado.

**Why this priority**: es lo que convierte el perfil en el lugar fijo de los animales de quien
rescata, con la verificación arriba. Sin esto el enlace que se manda desde «Mis animales» lleva a un
perfil sin animales, y no hay nada que medir.

**Independent Test**: con rescatistas sembradas con animales disponibles, en proceso, pausados,
vencidos, adoptados y dados de baja, con una camada, con más de 24 a la vista, una sin teléfono
confirmado, una suspendida, un bloqueo en cada sentido y una persona que nunca publicó: abrir cada
perfil sin sesión, con sesión, como la dueña y como la persona bloqueada o la que bloqueó, y comparar
lo que se ve con lo que muestra el listado para esa misma persona.

**Acceptance Scenarios**:

1. **Dado** que Carla tiene a Tobi y a Luna disponibles y a Mora en proceso, **cuando** alguien sin
   sesión abre su perfil, **entonces** ve, debajo de su chapita y sus avales, las tres tarjetas como
   en el listado, con Mora marcada «En proceso», de la más reciente a la más vieja.
2. **Dado** que Bruno está en el perfil de Carla, **cuando** toca la tarjeta de Luna, **entonces**
   llega a la ficha de Luna y puede solicitarla como desde el listado.
3. **Dado** que Carla publicó una camada de cinco crías, **cuando** alguien abre su perfil,
   **entonces** ve una sola tarjeta de la camada, como en el listado, y desde ella llega a la ficha
   de la camada.
4. **Dado** que Carla tiene 30 animales a la vista, **cuando** alguien abre su perfil, **entonces** ve
   los 24 más recientes y «Ver más» trae los 6 que faltan, sin repetir ninguno.
5. **Dado** que Carla pausa a Luna, **cuando** alguien vuelve a abrir su perfil, **entonces** Luna no
   aparece; cuando la reanuda, vuelve a su lugar por fecha.
6. **Dado** que Tobi fue adoptado, **cuando** alguien abre el perfil de Carla, **entonces** Tobi no
   aparece entre sus animales y el historial sigue mostrando solo los dos números de adopciones con
   seguimiento.
7. **Dado** que Carla cambió de chip y todavía no confirmó el número nuevo, **cuando** alguien abre su
   perfil, **entonces** no ve ningún animal ni un aviso de por qué; cuando Carla lo confirma, sus
   animales vuelven a aparecer.
8. **Dado** que Diego bloqueó a Carla, **cuando** abre el perfil de Carla, **entonces** ve la pantalla
   de bloqueo de siempre, sin sus animales.
9. **Dado** que Carla bloqueó a Diego, **cuando** Diego abre el perfil de Carla, **entonces** ve sus
   animales como cualquiera.
10. **Dado** que Ana nunca publicó un animal, **cuando** alguien abre su perfil, **entonces** se ve
    exactamente como hoy, sin ninguna sección de animales ni un texto que diga que no tiene.
11. **Dado** que Carla mira su propio perfil público, **cuando** carga, **entonces** ve las mismas
    tarjetas que cualquiera; sus animales pausados o sin teléfono confirmado no aparecen.
12. **Dado** que los animales de Carla no se pueden traer en ese momento, **cuando** alguien abre su
    perfil, **entonces** ve el perfil entero y, en el lugar de los animales, un aviso de que no se
    pudieron mostrar y «Probar de nuevo»; nunca una lista vacía que parezca que no tiene ninguno.
13. **Dado** que la cuenta de Carla fue suspendida, **cuando** alguien abre el enlace de su perfil que
    ella había pegado en el grupo, **entonces** no ve ninguno de sus animales y el perfil se ve como
    hoy se ve el de una cuenta suspendida, sin que nada hable de la suspensión.

---

### User Story 2 - Mandar el enlace del perfil desde «Mis animales» (Priority: P2)

Carla entra a «Mis animales» y, arriba de la lista, lee que en el enlace de su perfil se ven todos sus
animales en adopción. Toca «Copiar el enlace», ve «Enlace copiado» y lo pega en la biografía de
Instagram. En el teléfono el mismo botón dice «Mandar el enlace» y abre la hoja de compartir.

**Why this priority**: es lo que hace que el rescatista pegue un solo enlace en vez de uno por
animal. Necesita que el perfil ya muestre los animales (US1) para que el enlace valga la pena.

**Independent Test**: con una rescatista con animales a la vista, una con todos pausados, una sin
teléfono confirmado y una que nunca publicó: entrar a «Mis animales» con cada una en computadora y en
teléfono, tocar el botón con el portapapeles permitido y bloqueado, y comparar con «Mi perfil».

**Acceptance Scenarios**:

1. **Dado** que Carla tiene animales a la vista, **cuando** entra a «Mis animales», **entonces** ve
   arriba de la lista una línea que dice que en el enlace de su perfil se ven todos sus animales en
   adopción, con «Copiar el enlace» o, en el teléfono, «Mandar el enlace».
2. **Dado** que Carla toca «Copiar el enlace», **cuando** el navegador deja copiar, **entonces** ve
   «Enlace copiado» y lo que queda copiado es el enlace de su perfil, el mismo que en «Mi perfil».
3. **Dado** que el navegador no deja copiar, **cuando** Carla toca «Copiar el enlace», **entonces** ve
   el enlace escrito para copiarlo a mano, como en «Mi perfil».
4. **Dado** que Ana nunca publicó un animal, **cuando** entra a «Mis animales», **entonces** no ve el
   enlace del perfil y la pantalla queda como hoy.
5. **Dado** que todos los animales de Carla están pausados, vencidos o adoptados, **cuando** entra a
   «Mis animales», **entonces** no ve el enlace del perfil.
6. **Dado** que Carla no tiene hoy el teléfono confirmado, **cuando** entra a «Mis animales»,
   **entonces** no ve el enlace del perfil, y sí el aviso de que sus animales no se ven, como hoy.
7. **Dado** que Carla cambió su nombre después de pegar el enlace en el grupo, **cuando** alguien abre
   ese enlace viejo, **entonces** llega al mismo perfil, con sus animales.
8. **Dado** que Carla copia o manda el enlace desde «Mis animales», **cuando** termina, **entonces**
   llega un momento de enlace copiado que dice que salió de «Mis animales»; el mismo botón en «Mi
   perfil» y en «Mis avales» sigue mandando el suyo, que dice de cuál de las dos salió.

---

### User Story 3 - Saber si el perfil funciona como vidriera (Priority: P3)

Una visita al perfil de Carla, que muestra animales, llega a la medición con su origen y con que
mostró animales. Bruno abre la ficha de Luna desde ese perfil y la visita a la ficha se cuenta como
llegada desde un perfil, aparte del listado y de un enlace. La lectura queda escrita en docs/03.

**Why this priority**: responde si el rescatista usa el sitio como su vidriera. Agrega datos a
momentos que ya existen y no cambia lo que ve nadie.

**Independent Test**: abrir perfiles con y sin animales a la vista desde un enlace pegado y navegando
el sitio, abrir fichas desde un perfil, desde el listado y desde un enlace, tocar «Solicitar» y mandar
una solicitud después de llegar desde un perfil; leer cada momento en el registro de la medición.
Repetir con los animales imposibles de traer y con la medición caída.

**Acceptance Scenarios**:

1. **Dado** que el perfil de Carla tiene animales a la vista, **cuando** alguien lo abre desde un
   enlace del grupo, **entonces** la visita llega con el origen «desde un enlace» y con que mostró
   animales.
2. **Dado** que Ana no tiene animales a la vista, **cuando** alguien abre su perfil navegando el
   sitio, **entonces** la visita llega con el origen «desde el sitio» y con que no mostró animales.
3. **Dado** que los animales de Carla no se pudieron traer, **cuando** se abre su perfil, **entonces**
   la visita llega con su origen y sin el dato de si mostró animales, nunca con un «no» inventado.
4. **Dado** que Bruno está en el perfil de Carla, **cuando** toca la tarjeta de Luna, **entonces** la
   visita a la ficha de Luna llega con el origen «desde un perfil».
5. **Dado** que Bruno toca «Solicitar» en esa ficha y manda la solicitud, **cuando** se lee la
   medición, **entonces** se puede contar qué parte de las fichas abiertas desde un perfil terminó en
   «Solicitar» y en una solicitud mandada, igual que hoy se cuenta para las que llegan desde el
   listado o desde un enlace.
6. **Dado** que alguien pega en otra pestaña la dirección de una ficha que abrió desde un perfil,
   **cuando** carga, **entonces** la visita no se cuenta como llegada desde un perfil.
7. **Dado** que quien mira es la dueña del perfil o un lector de vista previa, **cuando** carga,
   **entonces** no se mide ninguna visita, como hoy.
8. **Dado** que la herramienta de medición no responde, **cuando** alguien abre un perfil, una ficha
   o copia el enlace, **entonces** ve y hace lo mismo que con la medición andando, sin ningún aviso.

---

### Edge Cases

- **«Ver más» cuando cambió algo en el medio**: si Carla pausa o publica un animal mientras alguien
  tiene abierta la primera tanda, «Ver más» no repite tarjetas ni deja un hueco que se note; sigue la
  misma regla que el «Ver más» del listado.
- **Exactamente 24 animales a la vista**: se ven los 24 y no aparece «Ver más».
- **Una camada con todas las crías adoptadas o pausada**: no aparece, como en el listado.
- **Una camada con algunas crías en proceso y otras disponibles**: aparece una vez, con lo que
  muestra su tarjeta en el listado.
- **Un animal publicado hace un minuto, todavía sin revisar por quien administra**: aparece, porque
  la revisión es después de salir y el listado ya lo muestra.
- **Un animal que vence mientras el perfil está abierto**: deja de aparecer la próxima vez que se
  abre el perfil o se toca «Ver más», como en el listado.
- **La foto de una tarjeta no se puede mostrar**: la tarjeta se comporta como en el listado.
- **La persona del perfil tiene animales a la vista pero quien mira la bloqueó**: ve la pantalla de
  bloqueo, que no tiene sección de animales.
- **El perfil se pide como vista previa de un enlace pegado**: la vista previa sigue igual que hoy,
  sin animales ni fotos de animales.
- **El perfil sin scripts**: la primera tanda de animales se lee en la página que entrega el sitio,
  igual que el resto del perfil.
- **«Probar de nuevo» vuelve a fallar**: queda el mismo aviso, con el resto del perfil a la vista.
  Si esta vez anda, el aviso se va y aparecen las tarjetas, o la sección desaparece si no hay
  ninguna a la vista.
- **«Ver más» falla**: las tarjetas que ya se veían siguen ahí y al pie aparece el mismo aviso de
  que no se pudieron mostrar, con «Probar de nuevo», como en el «Ver más» del listado.
- **«Mis animales» con animales a la vista pero sin poder saber si los hay** (falla al leerlo): la
  pantalla se comporta como cuando una de sus partes falla hoy, sin ofrecer un enlace a una vidriera
  que puede estar vacía.
- **Un rescatista copia el enlace muchas veces**: cada vez cuenta como un momento, como en «Mi
  perfil».

## Requirements *(mandatory)*

### Functional Requirements

#### Los animales en el perfil

- **FR-001**: El perfil público de una persona DEBE mostrar, debajo de la cabecera, la chapita y los
  avales, una sección «En adopción» con sus animales y camadas a la vista, con la misma tarjeta del
  listado.
- **FR-002**: Qué se ve en la sección DEBE seguir exactamente las reglas del listado para quien mira:
  disponibles y en proceso (en proceso con su sello); nunca pausados, vencidos, adoptados ni dados de
  baja; nada de una persona sin el teléfono verificado hoy o con la cuenta suspendida; nada de alguien
  a quien quien mira bloqueó. Un animal que aparece en el listado para quien mira DEBE aparecer en el
  perfil de quien lo publicó, y uno que no aparece en el listado NO DEBE aparecer en el perfil.
- **FR-003**: Las tarjetas DEBEN ir de la más reciente a la más vieja, con el mismo criterio de fecha
  del listado, de a 24, con «Ver más» al pie cuando quedan más; «Ver más» NO DEBE repetir ni saltear
  tarjetas.
- **FR-004**: Una camada DEBE aparecer una sola vez, con su tarjeta de camada; sus crías NO DEBEN
  aparecer como tarjetas sueltas.
- **FR-005**: Tocar una tarjeta DEBE llevar a la ficha del animal o de la camada, desde donde se
  solicita como desde el listado.
- **FR-006**: Si la persona no tiene ningún animal ni camada a la vista, el perfil NO DEBE mostrar la
  sección ni ningún texto sobre animales: se ve como hoy.
- **FR-007**: Quien mira su propio perfil público DEBE ver lo mismo que cualquiera; lo que solo ve
  ella sigue en «Mis animales».
- **FR-008**: La primera tanda DEBE llegar junto con el resto del perfil, en la página que entrega el
  sitio y legible sin scripts, como el resto del perfil hoy. Mientras «Probar de nuevo» trae los
  animales, la sección DEBE mostrar el esqueleto de las tarjetas, con el resto del perfil a la vista;
  mientras «Ver más» trae la tanda siguiente, el botón DEBE mostrar que está cargando, como en el
  listado.
- **FR-009**: Si los animales no se pueden traer, el perfil DEBE mostrarse entero y la sección DEBE
  mostrar un aviso de que no se pudieron mostrar y «Probar de nuevo». NUNCA una sección vacía ni la
  ausencia de sección, que harían creer que no tiene animales.
- **FR-009a**: Si «Ver más» falla, las tarjetas ya mostradas DEBEN quedar y al pie DEBE aparecer el
  aviso con «Probar de nuevo», que trae la tanda que faltaba sin repetir ni saltear tarjetas.
- **FR-010**: La pantalla de bloqueo y el «no existe» de una cuenta suspendida DEBEN quedar como hoy,
  sin sección de animales y sin nada que diga por qué.
- **FR-011**: La sección NO DEBE mostrar cuántos animales publicó la persona en total, los adoptados
  ni a quién se dio un animal, y el historial del perfil DEBE seguir siendo los dos números de hoy.
- **FR-012**: La vista previa del enlace del perfil, el «sin buscadores» del perfil y su dirección
  NO DEBEN cambiar.

#### El enlace del perfil en «Mis animales»

- **FR-013**: «Mis animales» DEBE mostrar, arriba de la lista, una línea que dice que en el enlace de
  su perfil se ven todos sus animales en adopción, con el mismo botón de «Mi perfil»: «Copiar el
  enlace», o «Mandar el enlace» donde el dispositivo ofrece la hoja de compartir.
- **FR-014**: Copiar DEBE dejar en el portapapeles el enlace del perfil de la persona y mostrar
  «Enlace copiado»; si el navegador no deja copiar, DEBE mostrar el enlace escrito para copiarlo a
  mano, como en «Mi perfil».
- **FR-015**: La línea y el botón DEBEN aparecer solo cuando la persona tiene al menos un animal o una
  camada a la vista para cualquiera; sin ninguno (nunca publicó, todos pausados, vencidos, adoptados o
  dados de baja, o sin el teléfono verificado hoy), NO DEBEN aparecer y la pantalla queda como hoy.
- **FR-016**: El enlace del perfil DEBE ser el de siempre, y NO DEBE cambiar aunque cambie el nombre
  de la persona.

#### La medición

- **FR-017**: El momento de la visita a un perfil DEBE llevar, además de su origen, si mostró
  animales: sí cuando la primera tanda tuvo al menos uno, no cuando la persona no tiene ninguno a la
  vista. Si los animales no se pudieron traer, DEBE llegar sin ese dato.
- **FR-018**: La visita a una ficha, de un animal o de una camada, abierta tocando una tarjeta del
  perfil y llegando navegando el sitio, DEBE contarse con el origen «desde un perfil», aparte de
  «desde el listado», «desde la portada», «desde el sitio» y los de afuera. La misma dirección pegada
  en otra pestaña o mandada a otra persona NO DEBE contar como desde un perfil.
- **FR-019**: DEBE poder leerse qué parte de las fichas abiertas desde un perfil termina en tocar
  «Solicitar» y en una solicitud mandada, con la misma lectura con la que hoy se compara eso para las
  fichas que llegan desde el listado o desde un enlace.
- **FR-020**: El momento de enlace copiado DEBE decir desde qué pantalla salió: «Mis animales», «Mi
  perfil» o «Mis avales», las tres que ofrecen el botón, tanto si se copió, se mandó o quedó escrito
  para copiarlo a mano.
- **FR-021**: Ningún momento de esta historia DEBE llevar quién, qué perfil, qué animal, qué camada,
  cuántos animales ni un texto: solo sí o no, de dónde llegó y desde qué pantalla, como el resto de
  la medición (docs/03 §7).
- **FR-022**: Las visitas que hoy no se miden (la dueña mirando lo suyo, una vista previa, quien
  vuelve de su propia acción, el «no existe») NO DEBEN empezar a medirse, y «Ver más» en el perfil NO
  DEBE contar una visita nueva.
- **FR-023**: Medir NUNCA DEBE cambiar lo que la persona ve ni lo que hace: con la medición caída,
  abrir el perfil, tocar una tarjeta, solicitar y copiar el enlace DEBEN funcionar igual y sin aviso.
- **FR-024**: En el sitio NO DEBE guardarse nada nuevo de ninguna persona.

#### Cómo se lee

- **FR-025**: docs/03 §Métricas de éxito, «Cómo se leen», DEBE sumar la lectura «¿El rescatista usa
  el sitio como su vidriera?» con lo que dice la sección Medición de la historia: cuántas veces se
  copia o se manda el enlace del perfil desde «Mis animales»; de las visitas a perfiles con animales,
  qué parte llega desde un enlace de afuera y qué parte navegando el sitio; qué parte de las fichas
  vistas se abre desde un perfil y cuántas de ellas terminan en «Solicitar» y en una solicitud
  mandada, al lado de las que llegan desde el listado o desde un enlace; y que con 3 a 5 rescatistas
  los números se leen como señal al lado de las opiniones y las encuestas, no como prueba.
- **FR-026**: Las tres decisiones del enjambre de la historia (2026-10-28, product-owner) DEBEN
  quedar, palabra por palabra, en docs/03 §3.

### Key Entities

- **Animal o camada a la vista**: lo que hoy aparece en el listado; el perfil lo muestra filtrado por
  quien lo publicó. No es un dato nuevo.
- **«Mostró animales» (sí o no)**: viaja con la visita a un perfil y no se guarda en el sitio.
- **Origen de la visita a una ficha**: suma «desde un perfil» a los que ya existen.
- **Pantalla del enlace copiado**: «Mis animales», «Mi perfil» o «Mis avales»; viaja con el momento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas, los animales y camadas que muestra el perfil de una persona
  son exactamente los suyos que muestra el listado para la misma persona que mira, en el mismo orden.
- **SC-002**: En el 100 % de las pruebas con 30 animales a la vista, la primera tanda tiene 24 y «Ver
  más» trae los 6 que faltan, sin repetidos.
- **SC-003**: En el 100 % de las pruebas, un perfil sin animales a la vista se ve igual que antes de
  esta historia, y un perfil cuyos animales no se pudieron traer muestra el aviso con «Probar de
  nuevo», nunca la ausencia de sección.
- **SC-004**: En el 100 % de las pruebas, el enlace del perfil aparece en «Mis animales» si y solo si
  la persona tiene al menos un animal o una camada a la vista, y lo que copia es el mismo enlace que
  copia «Mi perfil».
- **SC-005**: Desde la ficha de un animal, quien busca adoptar llega a la ficha de otro animal de la
  misma persona en dos toques: el nombre de quien publicó y la tarjeta.
- **SC-006**: En el 100 % de las pruebas, cada visita medida a un perfil lleva si mostró animales, o
  no lo lleva cuando no se pudieron traer; cada ficha abierta desde un perfil cuenta como «desde un
  perfil»; cada enlace copiado dice su pantalla.
- **SC-007**: Revisando cualquier momento de esta historia no se encuentra el nombre, el perfil, el
  animal, la camada ni la cuenta de nadie, ni una cantidad de animales.
- **SC-008**: Con los datos de la beta, alguien del equipo puede contestar en la herramienta de
  medición, sin otra fuente, qué parte de las fichas vistas se abre desde un perfil y cuántas de esas
  terminan en una solicitud mandada, siguiendo lo que dice docs/03 §Métricas de éxito.

## Assumptions

- **«En revisión»**: la historia lo nombra entre lo que no aparece, pero la revisión de quien
  administra es después de salir (docs/03 §6, decisión 2026-09-27) y el listado muestra lo que espera
  revisión. Gana la regla de la historia y de su decisión, «los que hoy se ven en el listado, con sus
  mismas reglas»: lo que el listado muestra aparece en el perfil, y lo que el listado no muestra, no.
  Una publicación dada de baja después de la revisión no aparece.
- **«Copiar el enlace» y «Mandar el enlace»** son el mismo botón de «Mi perfil», que dice uno u otro
  según el dispositivo, con las mismas salidas. La historia pide «como en "Mi perfil"».
- **«A la vista» para el enlace de «Mis animales»** es lo que vería cualquiera en el listado, no lo
  que ve la dueña: por eso sin teléfono confirmado el enlace no aparece aunque tenga animales
  publicados.
- **El origen de la visita al perfil** queda con los tres que ya existen (#236). «Navegando desde una
  ficha» de la historia se lee como «desde el sitio»: el camino habitual al perfil de un rescatista es
  el nombre en la ficha, y separar la ficha de los otros caminos internos no cambia la pregunta
  (enlace de afuera contra navegación).
- **Fichas abiertas desde un perfil que terminan en una solicitud**: se leen como hoy se leen las de
  cada nivel (#236), siguiendo los pasos de una misma visita; «Solicitar» y mandar la solicitud no
  suman datos nuevos.
- **«Cuántos rescatistas copian o mandan el enlace»**: la medición no tiene persona, así que se
  cuentan momentos y visitas, no personas; con 3 a 5 rescatistas alcanza para ver la señal.
- **«Ver más» en el perfil** sigue lo que hace el del listado; no cuenta una visita nueva al perfil.
- **El esqueleto de la historia** («Cargando: el esqueleto de las tarjetas») se muestra mientras
  «Probar de nuevo» trae los animales. La primera tanda llega con el perfil y no tiene un momento
  propio de carga: un perfil que primero se dibuja sin animales y después los suma no se leería sin
  scripts, que el perfil ya garantiza (#12), y el listado hace lo mismo con su primera tanda.
- **«Probar de nuevo»** es el texto que pide la historia para el reintento de la sección, aunque el
  listado diga «Reintentar»: es lo que leen los criterios de aceptación.
- **Una ficha abierta desde la segunda tanda** del perfil también cuenta «desde un perfil».
- **«Mis animales» cuando falla saber si hay animales a la vista**: no se muestra el enlace; la
  historia prefiere no ofrecer un enlace a una vidriera vacía.
- **No hay período de corte**: los datos nuevos empiezan el día que llega esta historia; antes de la
  beta solo usa el sitio el equipo.
- **Las referencias** «docs/03 §3», «§5», «§7», «§Métricas de éxito», «docs/01 §Huevo y gallina» y
  «docs/05» del cuerpo de la historia son documentos de producto; los números (#12, #13, #57, #59,
  #69, #169, #205, #206, #223, #224, #236) son historias, y «Ley 18.331» es la ley de datos personales.
- **Las decisiones del enjambre de la historia** (las tres del 2026-10-28, product-owner) van, palabra
  por palabra, a docs/03 §3 en esta rama, como dice cada una.
