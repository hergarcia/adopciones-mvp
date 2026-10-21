# Feature Specification: Pie del sitio con los enlaces que más se buscan

**Feature Branch**: `feature/200-pie-del-sitio-enlaces`

**Created**: 2026-10-20

**Status**: Draft

**Input**: Historia #200 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido**: el pie existe y está en todas las pantallas, al fondo de la hoja aunque la
pantalla sea corta. Hoy tiene tres renglones sueltos, cada uno con una pregunta y su enlace:
«¿Dudas antes de adoptar o de dar en adopción?» con «Preguntas y respuestas» (historia #8),
«¿Algo para decirnos?» con «Opinar» y «¿Te trabaste?» con «Escribinos por WhatsApp», que no
aparece cuando el sitio no tiene número de soporte (historia #71). La pantalla de una cuenta
suspendida ya muestra solo Opinar y el soporte. Todas las pantallas a las que van los enlaces
nuevos ya existen: el listado «Animales en adopción» (#57), «Qué dice cada nivel» (#12) y publicar
un animal (#53), con su puerta de ingreso y de teléfono verificado (#9, #10). La marca con el
nombre del sitio ya está en la cabecera. Lo que queda: ordenar el pie en tres grupos con nombre,
sumarle «Animales en adopción», «Publicar un animal» y «Qué dice cada nivel», poner la marca
debajo y, desde 1024, los grupos lado a lado.

**Vocabulario de esta spec**:

- **La ventana** es el área del navegador donde se ve el sitio. Los anchos (390, 768, 1024, 1280)
  son anchos de ventana en píxeles CSS.
- **El pie** es el cierre de la hoja, debajo del contenido de cada pantalla, en todas las
  pantallas del sitio. **El menú** es la cabecera de arriba, con el nombre del sitio y los enlaces
  de la sesión.
- **Un grupo** es un conjunto de enlaces del pie con un nombre visible arriba: **Animales**,
  **Confianza** y **Ayuda**.
- **Los enlaces del pie**, por grupo y en este orden:
  - Animales: «Animales en adopción» (el listado) y «Publicar un animal» (empezar a publicar).
  - Confianza: «Qué dice cada nivel» (la página que explica las chapitas) y «Preguntas y
    respuestas» (el índice de las preguntas).
  - Ayuda: «Opinar» (la pantalla para mandar una opinión) y «Escribinos por WhatsApp» (el WhatsApp
    de soporte), este último solo cuando el sitio tiene número.
- **La marca** es la pata con la huella y el nombre del sitio, la misma firma de la cabecera.
- **La pantalla de la cuenta suspendida** es la única que hoy no muestra el menú.
- **Una pantalla de error** es la que aparece cuando una pantalla no pudo cargar, y **«no
  encontrado»** la de algo que no existe dentro del sitio (un animal, un perfil, una pregunta, una
  publicación propia que ya no está).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Llegar desde el pie a donde se suele querer ir (Priority: P1)

Una persona termina de leer una ficha, una página de preguntas o su perfil y llega al final de la
pantalla. Ahí encuentra, ordenados en tres grupos con nombre, los lugares a los que suele querer ir:
ver más animales, publicar uno, entender qué dicen las chapitas, leer las preguntas, opinar o pedir
ayuda. Debajo, la marca con el nombre del sitio. No tiene que volver arriba al menú ni adivinar
dónde está cada cosa, con sesión o sin ella.

**Why this priority**: es lo que pidió Hernán el 2026-10-20 y el núcleo de la historia. Sola, ya da
un próximo paso al final de cada pantalla y lleva a las páginas que cuentan la verificación, que es
lo que diferencia al sitio.

**Independent Test**: con y sin sesión, en una ventana de 390 y en una de 1280, abrir la portada,
una ficha, una página de preguntas, «Mi perfil» y Opinar, bajar hasta el final y comprobar que el
pie muestra los tres grupos en orden con sus enlaces y la marca debajo; tocar cada enlace y llegar a
su pantalla.

**Acceptance Scenarios**:

1. **Given** cualquier pantalla del sitio salvo la de una cuenta suspendida, con sesión o sin ella,
   **When** la persona llega al final, **Then** ve los grupos Animales, Confianza y Ayuda, en ese
   orden, cada uno con su nombre y sus enlaces en el orden del vocabulario, y debajo la marca con el
   nombre del sitio.
2. **Given** que la persona terminó de leer la ficha de un animal, **When** toca «Animales en
   adopción» en el pie, **Then** llega al listado, como si lo hubiera tocado en el menú.
3. **Given** que la persona vio una chapita y no sabe qué significa, **When** toca «Qué dice cada
   nivel» en el pie, **Then** llega a esa página.
4. **Given** una persona con sesión y el teléfono verificado, **When** toca «Publicar un animal»
   en el pie, **Then** empieza a publicar, en la misma pantalla a la que lleva el menú.
5. **Given** cualquier pantalla con el pie, **When** la persona toca «Preguntas y respuestas»,
   **Then** llega al índice de las preguntas, como hoy.
6. **Given** cualquier pantalla con el pie, **When** la persona toca «Opinar», **Then** llega a la
   pantalla de Opinar, como hoy; **When** toca «Escribinos por WhatsApp», **Then** se abre el
   WhatsApp de soporte aparte, sin perder la pantalla en la que estaba, como hoy.
7. **Given** la pantalla de la que sale un enlace del pie (por ejemplo, «Animales en adopción»
   estando en el listado), **When** la persona mira el pie, **Then** ese enlace se ve marcado como
   la pantalla actual, igual que en el menú, y sigue pudiendo tocarse.
8. **Given** quien usa un lector de pantalla, **When** llega al pie, **Then** lo oye como el pie
   del sitio, oye el nombre de cada grupo antes de sus enlaces y cuántos enlaces tiene, y cada
   enlace se anuncia con el mismo nombre que se ve.
9. **Given** quien navega con el teclado, **When** recorre el pie, **Then** pasa por los enlaces
   en el orden de lectura (grupo por grupo, de arriba abajo) y cada uno muestra el foco visible del
   resto del sitio.

---

### User Story 2 - El pie se acomoda al ancho y a cada situación (Priority: P2)

El mismo pie tiene que leerse bien en un teléfono y en una computadora, y mostrar solo lo que
sirve: sin el WhatsApp cuando no hay número, y solo Ayuda a una cuenta suspendida, que no puede ir
a ningún otro lado. Tampoco puede romperse en una pantalla de error, ni ofrecer un enlace que no
lleva a ninguna parte.

**Why this priority**: sin esto el pie de la User Story 1 se ve mal en el teléfono, que es donde
llega casi todo el mundo (docs/10 §Principios, 390 px primero), o le muestra a una cuenta
suspendida enlaces que no puede usar. Depende de la User Story 1, que arma los grupos.

**Independent Test**: en una ventana de 390, comprobar que los grupos van uno debajo del otro, que
no hay desplazamiento lateral y que cada enlace mide al menos 44 px de alto; en una de 1024 y una
de 1280, que los tres grupos van lado a lado; sin número de soporte, que Ayuda tiene solo «Opinar»;
con una cuenta suspendida, que el pie tiene solo Ayuda; en una pantalla de error y en una de «no
encontrado», que el pie está entero.

**Acceptance Scenarios**:

1. **Given** un teléfono de 390 de ancho, **When** la persona llega al pie, **Then** los grupos
   van uno debajo del otro en el orden Animales, Confianza, Ayuda, no hay que desplazarse de
   costado y cada enlace se toca en un área de al menos 44 px de alto.
2. **Given** una ventana de 1024 o más ancha, **When** la persona llega al pie, **Then** los tres
   grupos van lado a lado en un mismo renglón, de izquierda a derecha en el orden Animales,
   Confianza, Ayuda, con sus nombres alineados arriba, y la marca cierra ese renglón a la derecha
   (cambio de la revisión, 2026-10-20: debajo de los tres dejaba la firma sola en su renglón).
3. **Given** una ventana de entre 390 y 1023 de ancho, **When** la persona llega al pie, **Then**
   los grupos siguen uno debajo del otro, como en el teléfono.
4. **Given** que el sitio no tiene número de WhatsApp de soporte, **When** la persona mira el pie,
   **Then** el grupo Ayuda muestra solo «Opinar», sin un renglón vacío en lugar del WhatsApp.
5. **Given** una cuenta suspendida en su pantalla, **When** mira el pie, **Then** ve solo el grupo
   Ayuda («Opinar» y, si hay número, «Escribinos por WhatsApp»), sin los nombres ni los enlaces de
   Animales y Confianza, y la marca debajo.
6. **Given** una cuenta suspendida y un sitio sin número de soporte, **When** mira el pie, **Then**
   ve solo el grupo Ayuda con «Opinar», y la marca debajo.
7. **Given** una pantalla de error o de «no encontrado», en cualquier zona del sitio, **When** la
   persona llega al final, **Then** el pie está igual que en las demás pantallas de esa zona.
8. **Given** una pantalla que todavía está cargando (su esqueleto de carga), **When** la persona
   mira el final, **Then** el pie ya está entero y no cambia cuando llega el contenido.
9. **Given** una persona sin sesión, **When** toca «Publicar un animal» en el pie, **Then** se le
   pide entrar y, después de entrar, sigue publicando, sin perder a dónde iba (#9).
10. **Given** una persona con sesión y el teléfono sin verificar, **When** toca «Publicar un
    animal» en el pie, **Then** ve el aviso de verificación pendiente (#10), igual que desde el menú,
    y al verificar sigue publicando.
11. **Given** que el destino de un enlace del pie no se puede mostrar (por ejemplo, el listado no
    carga), **When** la persona lo toca, **Then** ve la pantalla de error de ese destino, con cómo
    volver o reintentar, y el pie sigue entero debajo.

---

### Edge Cases

- **Con sesión y sin ella**: los enlaces del pie son los mismos; ninguno aparece ni desaparece al
  entrar o salir de la cuenta, y ninguno exige haber entrado para verse. Lo que cambia según la
  sesión es a dónde lleva «Publicar un animal» después de tocarlo (a entrar, al aviso de
  verificación o a publicar), no el pie.
- **Con el perfil sin completar**: quien entró y todavía no completó su perfil y toca «Publicar un
  animal» en el pie pasa por el mismo camino que si lo tocara en el menú.
- **Repetido con el menú**: «Animales en adopción», «Publicar un animal» y «Opinar» también están
  en el menú para quien corresponde. El pie los repite a propósito, con el mismo nombre y el mismo
  destino: es el próximo paso al final de la pantalla, no una acción distinta.
- **Un grupo sin enlaces no muestra su nombre**: hoy eso pasa solo en la pantalla de la cuenta
  suspendida, con Animales y Confianza. Ayuda nunca queda vacío: «Opinar» está siempre.
- **Un enlace sin destino no se muestra**: hoy los seis destinos existen. El WhatsApp de soporte
  sin número es el único enlace que puede faltar, y entonces no aparece.
- **El grupo Confianza crece**: cuando exista la página «Nosotros», su enlace se suma a Confianza
  sin cambiar el orden de los grupos ni el de los enlaces que ya están (la historia de «Nosotros» lo
  decide; esta no lo agrega).
- **«Qué dice cada nivel» desde el pie**: la página abre sin ningún nivel destacado, igual que
  cuando se entra a ella sin venir de una chapita, y su «Volver» lleva a donde lleva hoy en ese
  caso (ver Assumptions).
- **Opinar desde la pantalla de Opinar**: el enlace sigue en el pie, marcado como la pantalla
  actual, como en el menú.
- **Una cuenta suspendida en Opinar**: Opinar no es la pantalla de la cuenta suspendida; muestra el
  menú entero a cualquiera, también a una cuenta suspendida, y su pie también va entero. Si esa
  cuenta toca un enlace de Animales o de Confianza, termina en su pantalla de cuenta suspendida,
  igual que si tocara «Animales en adopción» en el menú hoy.
- **La muestra de primitivas** (solo en desarrollo) no es una pantalla del sitio y no entra en esta
  historia.
- **La marca no es un enlace**: es la firma del cartel; para ir a la portada está la marca de la
  cabecera. Así el pie de la cuenta suspendida tampoco ofrece un camino a otra pantalla.
- **Una dirección que no existe en el sitio** (escrita a mano o vieja, fuera de las pantallas de
  «no encontrado» de cada zona): hoy muestra la página genérica del sistema, sin la hoja, sin el
  menú y sin el pie (limitación aceptada KL-73-6, que se reabre cuando se diseñe esa página para
  todo el sitio). Esta historia no la diseña (ver Assumptions).
- **Letra agrandada**: con el texto del navegador al 200 %, los nombres de los grupos y los enlaces
  no se cortan ni se superponen; en una ventana de 1024 o más, un enlace largo baja de renglón
  dentro de su grupo en vez de invadir el de al lado.
- **Una ventana muy alta y una pantalla corta**: el pie queda al fondo de la ventana, como hoy.

## Requirements *(mandatory)*

### Functional Requirements

**Los grupos y los enlaces**

- **FR-001**: El pie de cada pantalla del sitio MUST mostrar los grupos **Animales**,
  **Confianza** y **Ayuda**, siempre en ese orden, cada uno con su nombre visible arriba de sus
  enlaces.
- **FR-002**: El grupo Animales MUST tener, en este orden, «Animales en adopción», que lleva al
  listado, y «Publicar un animal», que lleva a empezar a publicar, con los mismos destinos que esos
  enlaces tienen en el menú.
- **FR-003**: El grupo Confianza MUST tener, en este orden, «Qué dice cada nivel», que lleva a la
  página que explica los niveles, y «Preguntas y respuestas», que lleva al índice de las preguntas.
- **FR-004**: El grupo Ayuda MUST tener, en este orden, «Opinar», que lleva a la pantalla de
  Opinar, y «Escribinos por WhatsApp», que abre el WhatsApp de soporte aparte, como hoy.
- **FR-005**: Los enlaces del pie MUST ser los mismos con sesión y sin ella, y ninguno MUST exigir
  haber entrado para verse.
- **FR-006**: Sin número de WhatsApp de soporte, «Escribinos por WhatsApp» MUST no aparecer, sin
  dejar un renglón vacío.
- **FR-007**: Un grupo que se queda sin enlaces MUST no mostrar su nombre. Un enlace cuyo destino
  no existe MUST no mostrarse.
- **FR-008**: Debajo de los grupos, el pie MUST mostrar la marca con el nombre del sitio, la misma
  de la cabecera. La marca del pie no es un enlace.
- **FR-009**: Los enlaces del pie MUST decir solo su nombre, sin la pregunta que hoy los acompaña
  («¿Algo para decirnos?», «¿Te trabaste?», «¿Dudas antes de adoptar o de dar en adopción?»): el
  nombre del grupo ya dice para qué sirven.
- **FR-010**: El enlace del pie que lleva a la pantalla en la que se está MUST verse marcado como
  la pantalla actual, igual que en el menú, y seguir pudiendo tocarse.

**Los destinos y sus puertas**

- **FR-011**: «Publicar un animal» desde el pie MUST pasar por las mismas puertas que desde el
  menú: sin sesión, pedir entrar y, después, seguir publicando (#9); con sesión y el teléfono sin
  verificar, el aviso de verificación pendiente, con la vuelta a publicar (#10); con el teléfono
  verificado, empezar a publicar.
- **FR-012**: Si el destino de un enlace no puede mostrarse, la persona MUST ver la pantalla de
  error de ese destino, con cómo volver o reintentar, y el pie entero debajo.

**Dónde aparece**

- **FR-013**: El pie MUST estar en todas las pantallas del sitio que hoy lo muestran: el sitio
  público, las pantallas de la cuenta, las de quien administra, Entrar, Completar el perfil, Cuenta
  borrada, Opinar, las pantallas de error, las de «no encontrado» y mientras una pantalla muestra su
  esqueleto de carga, igual en todas.
- **FR-014**: En la pantalla de una cuenta suspendida, el pie MUST mostrar solo el grupo Ayuda y la
  marca, sin el nombre ni los enlaces de Animales y Confianza.

**Cómo se ve**

- **FR-015**: En una ventana de menos de 1024, los grupos MUST ir uno debajo del otro, en el orden
  de FR-001, sin desplazamiento lateral a 390.
- **FR-016**: En una ventana de 1024 o más, los grupos MUST ir lado a lado en un mismo renglón, de
  izquierda a derecha en el orden de FR-001, con sus nombres alineados arriba, cada grupo del ancho
  de sus enlaces, y la marca al final de ese renglón, a la derecha (cambio de la revisión,
  2026-10-20). Con la letra agrandada, ningún nombre ni enlace MUST cortarse ni encimarse con el de
  al lado: el texto baja de renglón dentro de su grupo.
- **FR-017**: Cada enlace del pie MUST tocarse en un área de al menos 44 px de alto, en cualquier
  ancho.
- **FR-018**: El pie MUST seguir al fondo de la ventana aunque la pantalla sea corta, como hoy.

**Accesibilidad**

- **FR-019**: El pie MUST anunciarse como el pie del sitio; cada grupo MUST anunciar su nombre
  antes de sus enlaces, como una lista; cada enlace MUST anunciarse con el nombre que se ve.
- **FR-020**: El orden del teclado y del lector de pantalla MUST ser el de lectura: grupo por grupo,
  en el orden de FR-001, y dentro de cada grupo el de FR-002 a FR-004, en cualquier ancho.

**La decisión**

- **FR-021**: La guía de diseño MUST registrar con fecha el pie nuevo (tres grupos con nombre en un
  orden fijo, los enlaces sin la pregunta, la marca debajo sin enlace, lado a lado desde 1024, solo
  Ayuda en la cuenta suspendida), con su motivo (Hernán pidió el 2026-10-20 un pie con enlaces de
  interés), y anotar que deja atrás la decisión del 2026-10-09 de la historia #8 sobre el primer
  renglón del pie, que pasa a Descartado con el motivo.

### Key Entities

- **Grupo del pie**: un nombre visible y una lista ordenada de enlaces; se muestra solo si tiene al
  menos un enlace.
- **Enlace del pie**: un nombre visible y una pantalla de destino que existe; el WhatsApp de soporte
  depende de que el sitio tenga número.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En 6 pantallas distintas (portada, listado, ficha, una página de preguntas, «Mi
  perfil» y Opinar), con sesión y sin ella, el pie muestra los 3 grupos en el mismo orden con los 6
  enlaces (5 sin número de soporte) y la marca debajo: 12 de 12 combinaciones iguales.
- **SC-002**: Desde el pie, cada uno de los 6 enlaces lleva a su destino en 1 toque, 6 de 6.
- **SC-003**: En una ventana de 390, el pie no tiene desplazamiento lateral y los 6 enlaces miden
  al menos 44 px de alto cada uno.
- **SC-004**: En ventanas de 1024 y de 1280, los 3 grupos arrancan en el mismo renglón, de
  izquierda a derecha en el orden Animales, Confianza, Ayuda.
- **SC-005**: En la pantalla de una cuenta suspendida, el pie muestra 1 grupo (Ayuda) con 2
  enlaces, o 1 sin número de soporte, y ningún enlace a otra pantalla del sitio fuera de Opinar.
- **SC-006**: En una pantalla de error y en una de «no encontrado», el pie tiene los mismos grupos y
  enlaces que en una pantalla normal de la misma zona.
- **SC-007**: Sin sesión, tocar «Publicar un animal» en el pie y entrar termina en la pantalla de
  publicar en el 100 % de los intentos; con el teléfono sin verificar, termina en el aviso de
  verificación pendiente en el 100 %.

## Assumptions

- **Los enlaces sin la pregunta** (FR-009): hoy cada renglón del pie es una pregunta con su enlace.
  Con tres grupos con nombre, la pregunta repite lo que dice el nombre del grupo y triplica el largo
  del pie en el teléfono; la historia nombra solo los enlaces. Los nombres de los enlaces no cambian
  (modo auto).
- **La marca del pie no es un enlace** (FR-008): la historia pide «la marca con el nombre del
  sitio», sin destino. La de la cabecera ya lleva a la portada, y en la pantalla de una cuenta
  suspendida un enlace más contradiría «solo el grupo Ayuda» (modo auto).
- **La marca va también en el pie de la cuenta suspendida** (FR-014): la historia limita los
  *grupos* a Ayuda, y la marca no es un grupo ni un enlace; esa pantalla ya muestra la marca en su
  cabecera (modo auto).
- **«Qué dice cada nivel» sin origen**: desde una chapita, esa página abre con el nivel destacado y
  su «Volver» lleva de vuelta a la pantalla de la chapita. Desde el pie no hay chapita, así que abre
  sin nivel destacado y su «Volver» lleva a donde lleva hoy cuando se entra sin origen; el botón de
  atrás del navegador vuelve a la pantalla anterior. Hacer que «Volver» recuerde cualquier pantalla
  de origen queda fuera de esta historia (modo auto).
- **Entre 768 y 1023 los grupos van uno debajo del otro**: la historia dice «desde 1024 lado a
  lado» y «en el teléfono uno debajo del otro», y no nombra el tramo del medio; se sigue la regla de
  1024, que es el corte en el que el sitio pasa a la hoja (modo auto).
- **Una dirección que no existe en el sitio** (fuera de las «no encontrado» de cada zona) muestra
  hoy la página genérica del sistema, sin hoja ni pie (KL-73-6). El criterio de la historia «en una
  página que no existe el pie está igual» se cumple en las pantallas de «no encontrado» del sitio;
  diseñar esa página para todo el sitio es otra historia, y la limitación ya está aceptada con su
  condición de reapertura (modo auto).
- **La medición no cambia**: el pie no agrega pasos ni eventos (la historia lo dice). Las lecturas
  que hoy cuentan de qué pantalla del sitio se llegó a otra (desde la portada a publicar o al
  listado, desde una página de preguntas a su acción, al índice de preguntas desde otra pantalla)
  ya cuentan igual los toques del menú, y van a contar igual los del pie: miden desde qué pantalla
  se llegó, no qué enlace se tocó (modo auto).
- **«Nosotros»**: el grupo Confianza queda listo para sumar su enlace, al final del grupo, cuando
  esa historia exista; esta no lo agrega ni escribe la página.
- **Datos personales**: no aplica. El pie no guarda ni muestra datos de ninguna persona, y es el
  mismo con sesión y sin ella.
- **Fuera del alcance, como dice la historia**: redes sociales, términos y condiciones, política de
  privacidad, aviso legal, suscripción a novedades, selector de idioma, mapa del sitio, accesos a la
  cuenta y cambios en el menú de arriba.
