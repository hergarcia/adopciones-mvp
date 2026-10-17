# Feature Specification: Un solo tamaño de hoja y el menú quieto al navegar

**Feature Branch**: `feature/187-un-solo-tamano-hoja`

**Created**: 2026-10-17

**Status**: Draft

**Input**: Historia #187 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido**: la hoja sobre la pared desde 1024 (decisión 2026-09-20), con tres tamaños según
la zona: el del listado en el sitio público, uno más angosto en las pantallas de la cuenta y el
angosto del volante en el ingreso, completar el perfil, la cuenta borrada, Opinar y la cuenta
suspendida. Las páginas de contenido en dos partes (historia #8) y Opinar (historia #71). Ya en
main (Ready): nada del alcance de esta historia. Esta spec deja un solo tamaño de hoja para todo lo
que muestra el menú y arma en dos partes las pantallas de una sola tarea; no cambia nada por debajo
de 1024.

**Vocabulario de esta spec**:

- **La ventana** es el área del navegador donde se ve el sitio. Los anchos de esta spec (390, 1024,
  1200, 1280, 1920) son anchos de ventana en píxeles CSS, salvo cuando se dice que son de la hoja.
- **La hoja** es el papel con borde de tinta en el que vive cada pantalla desde una ventana de
  1024. **La pared** es el fondo que la rodea. Debajo de 1024 no hay pared: la hoja ocupa la
  ventana entera y no tiene borde.
- **El ancho de la hoja** es el del listado de «Animales en adopción»: **1200**, o el de la ventana
  cuando la ventana mide menos que eso (sin contar la barra de desplazamiento, en los sistemas donde
  ocupa lugar). Con una ventana de entre 1024 y 1200 la hoja ocupa todo el
  ancho de la ventana, como hoy ocupa todo el ancho la hoja del listado.
- **El menú** es la cabecera de la hoja: el nombre del sitio a la izquierda y, a la derecha, los
  enlaces («Animales en adopción», «Entrar», «Mis animales», «Solicitudes recibidas», «Mis
  solicitudes», «Administrar», «Mi perfil» y «Opinar», cada uno a quien corresponde hoy). **El
  pie** es el cierre de la hoja, con «Preguntas y respuestas», Opinar y el WhatsApp de soporte.
  **El marco** es la hoja con su menú y su pie.
- **El mismo lugar** de un enlace del menú es su posición en la ventana: misma distancia al borde
  izquierdo de la ventana, mismo renglón y mismo ancho. Que el enlace de la pantalla actual se vea
  marcado (subrayado grueso) no cuenta como moverse.
- **Las pantallas de una sola tarea** son las que hoy viven en la hoja angosta y muestran el menú:
  **Opinar**; **Entrar**, con su paso siguiente, **«Mirá tu correo»**; **Completar el perfil**; y
  **Cuenta borrada**. **«El enlace no sirve»**, la pantalla de un enlace de ingreso vencido o ya
  usado, también vive hoy en la hoja angosta, pero no es una de ellas: es un estado, centrado en la
  hoja como una pantalla de error, y así sigue (ver Assumptions).
- **En dos partes** es como se arma una pantalla de una sola tarea desde 1024, igual que una página
  de contenido (historia #8): de un lado **la presentación**, el título en voz de afiche y la
  bajada; del otro **la tarea**, el formulario o la acción. Los nombres de cada pantalla, sus
  títulos y sus bajadas no cambian.
- **Un flujo de foco** es una pantalla que no muestra el menú. Hoy hay una sola: **la cuenta
  suspendida**. Es la única que conserva la hoja angosta.
- **Una pantalla de error** es la que aparece cuando una pantalla no pudo cargar, y **«no
  encontrado»** la de algo que no existe (un animal, un perfil, una pregunta, una publicación
  propia que ya no está).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La hoja y el menú quietos al navegar (Priority: P1)

Una persona que usa el sitio en una computadora va de una pantalla a otra por el menú: de «Animales
en adopción» a «Mis animales», a «Opinar», a «Mi perfil». Hoy la hoja cambia de ancho según la zona
y todo el menú se corre, y en Opinar se parte en tres renglones. Con esta historia, en toda pantalla
que muestra el menú la hoja mide lo mismo y cada enlace queda donde estaba, así lo que la persona va
a tocar no se le escapa y no siente que entró a otro sitio.

**Why this priority**: es el problema que nombró Hernán («según la pantalla el recuadro es más chico
o más grande») y el que se nota en cada navegación. Sola, ya arregla el menú que salta y el menú
partido de Opinar.

**Independent Test**: con una ventana de 1280, abrir con y sin sesión las pantallas de cada zona
(portada, listado, ficha, Mis animales, Mi perfil, Entrar, Completar el perfil, Cuenta borrada,
Opinar, una pantalla de error y una de «no encontrado») y comprobar que la hoja mide 1200 en todas y
que cada enlace del menú está en el mismo lugar.

**Acceptance Scenarios**:

1. **Given** una persona con sesión en una ventana de 1280, **When** va de «Animales en adopción» a
   «Mis animales» y después a «Opinar», **Then** la hoja mide 1200 en las tres y cada enlace del
   menú está en el mismo lugar.
2. **Given** Opinar en una ventana de 1280, con sesión o sin ella, **When** se abre, **Then** el
   menú entra en el mismo renglón que el nombre del sitio, como en las demás pantallas.
3. **Given** una persona sin sesión en una ventana de 1280, **When** va de la portada a «Entrar»,
   **Then** la hoja y el menú no cambian de tamaño ni de lugar.
4. **Given** una ventana de 1920, **When** se abre cualquier pantalla con menú, **Then** la hoja
   sigue midiendo 1200, centrada, y la pared ocupa el resto.
5. **Given** una ventana de cualquier ancho entre 1024 y 1200, **When** se navega entre pantallas
   con menú, **Then** la hoja mide lo mismo en todas: el ancho de la ventana.
6. **Given** quien administra, con el menú más largo, en una ventana de 1024, **When** navega entre
   pantallas, **Then** el menú se acomoda igual en todas: los mismos enlaces en los mismos renglones
   y en el mismo lugar.
7. **Given** «Mis animales» sin animales en una ventana de 1280, **When** se abre, **Then** el
   estado vacío sigue centrado, ahora en la hoja de 1200.
8. **Given** una pantalla de error o de «no encontrado» de cualquier zona en una ventana de 1280,
   **When** se abre, **Then** usa la misma hoja de 1200, con el menú en el mismo lugar que en el
   resto del sitio.
9. **Given** una cuenta suspendida en una ventana de 1280, **When** se abre su pantalla, **Then**
   conserva la hoja angosta y sin menú, como hoy.
10. **Given** un teléfono de 390, **When** se abre cualquier pantalla, **Then** se ve igual que antes
    de esta historia.

---

### User Story 2 - Las pantallas de una sola tarea en dos partes (Priority: P2)

En la hoja de 1200, una pantalla de una sola tarea armada como una columna angosta dejaría más de
media hoja vacía, y ese blanco se lee como una pantalla rota. Desde 1024, Opinar, Entrar con «Mirá tu
correo», Completar el perfil y Cuenta borrada se arman en dos partes: a la izquierda la presentación,
el título en voz de afiche y la bajada; a la derecha la tarea, el formulario o la acción.

**Why this priority**: sin esto, la User Story 1 cambia el menú que salta por media hoja vacía en
las cinco pantallas de una sola tarea. Depende de la User Story 1, que es la que les da la hoja ancha.

**Independent Test**: con una ventana de 1280, abrir Opinar, Entrar, «Mirá tu correo», Completar el
perfil y Cuenta borrada, y comprobar en cada una que la
presentación está a la izquierda, la tarea a la derecha, y que no queda ninguna mitad de la hoja
vacía en la primera pantalla; después, con 390, que se ven como hoy.

**Acceptance Scenarios**:

1. **Given** Opinar en una ventana de 1280, **When** se abre, **Then** el título y la bajada van a
   la izquierda y el formulario a la derecha, y no queda media hoja vacía.
2. **Given** Entrar en una ventana de 1280, **When** se abre, **Then** el título y la bajada van a
   la izquierda y las formas de entrar (Google, si está, y el enlace por correo) a la derecha.
3. **Given** Entrar al que se llegó con un aviso de por qué hay que volver a entrar (por ejemplo, un
   enlace vencido), **When** se abre a 1280, **Then** el aviso va en la presentación, debajo de la
   bajada, y se ve sin desplazar.
4. **Given** «Mirá tu correo» en una ventana de 1280, **When** se abre, **Then** «Volver», el
   título y la dirección a la que se mandó el enlace van a la izquierda, y lo que hay que hacer (el
   recordatorio del correo no deseado y de que el enlace vale una vez, y «Enviar otro») a la
   derecha.
5. **Given** «El enlace no sirve» en una ventana de 1280, **When** se abre, **Then** el título, lo
   que pasó y su única salida («Enviarme otro enlace» cuando se puede pedir otro, «Escribir mi
   correo» cuando no) siguen centrados, ahora en la hoja de 1200; al pedir otro, la pantalla entera
   pasa a «Enlace en camino», como hoy.
6. **Given** Completar el perfil en una ventana de 1280, **When** se abre, **Then** el título y la
   bajada van a la izquierda y el formulario, con «Cerrar sesión» y «Borrar mi cuenta» al final, a
   la derecha; al desplazar el formulario, el título y la bajada siguen a la vista.
7. **Given** Cuenta borrada en una ventana de 1280, **When** se abre, **Then** el título y lo que
   pasó van a la izquierda y las dos salidas («Crear otra cuenta» y «Volver al inicio») a la derecha.
8. **Given** cualquiera de estas pantallas en una ventana de 1024, **When** se abre, **Then** ya
   está en dos partes, y ninguna de las dos partes desborda la hoja.
9. **Given** cualquiera de estas pantallas en un teléfono de 390, o en cualquier ventana de menos de
   1024, **When** se abre, **Then** se ve como hoy: una columna, primero el título y la bajada,
   después el formulario o la acción.

---

### Edge Cases

- **Una pantalla corta y una larga**: entre una pantalla que entra entera en la ventana (Opinar) y
  una que hay que desplazar (el listado), el menú no se corre, también en un sistema donde la barra
  de desplazamiento ocupa lugar en la ventana.
- **Mientras carga**: mientras una pantalla muestra su esqueleto de carga, la hoja y el menú ya
  tienen su tamaño y su lugar finales; cuando llega el contenido, no se corren.
- **El error dentro de una pantalla en dos partes**: un error del formulario (un correo mal escrito,
  un envío que falló, «Vas a poder pedir otro en N segundos») aparece en la tarea, junto a lo que lo
  causó, como hoy; la presentación no cambia.
- **Después de la acción**: lo que muestra cada pantalla de una sola tarea al terminar («Tu opinión
  llegó. Gracias.» en Opinar, «Te mandamos otro enlace» en «Mirá tu correo») aparece en la tarea; la presentación queda, y la hoja y el
  menú no cambian.
- **La cuenta suspendida en Opinar**: una persona con la cuenta suspendida puede abrir Opinar; ahí
  ve la hoja ancha con el menú, como cualquiera, porque Opinar muestra el menú. Solo la pantalla de
  la cuenta suspendida conserva la hoja angosta.
- **El menú que crece o se achica**: si la persona entra o sale de su cuenta, o publica su primer
  animal y aparece «Solicitudes recibidas», los enlaces que aparecen o desaparecen pueden mover a
  los de su renglón; entre dos pantallas con la misma sesión y el mismo rol, ninguno se mueve.
- **Pantallas de la cuenta que hoy usan el ancho de la hoja**: la pared de «Mis animales», el
  formulario de un animal en dos columnas, Administrar y la ficha de una persona se arman a lo ancho
  de la hoja nueva, como se arman hoy a lo ancho de la de antes, sin perder columnas ni cambiar de
  orden.
- **Pantallas de la cuenta que hoy son una columna de lectura** (Mi perfil, verificar el teléfono,
  verificar la identidad, solicitar, una solicitud): siguen siendo una columna de lectura alineada a
  la izquierda, en la hoja de 1200. No se rearman en esta historia (ver Assumptions).
- **Arriba de 1200**: la pared crece y la hoja no; la tipografía no cambia con el ancho.
- **La muestra de primitivas** (solo en desarrollo): no es una pantalla del sitio y no entra en
  esta historia.

## Requirements *(mandatory)*

### Functional Requirements

**El marco**

- **FR-001**: Desde una ventana de 1024, toda pantalla que muestra el menú MUST vivir en la misma
  hoja, de 1200 de ancho o el de la ventana si es menor: el sitio público, las pantallas de la
  cuenta (también las de quien administra), Entrar con «Mirá tu correo» y «El enlace no sirve», Completar el perfil, Cuenta
  borrada y Opinar, con sesión o sin ella.
- **FR-002**: El ancho de la hoja MUST ser uno solo para todo lo que muestra el menú: ninguna
  pantalla ni zona elige el suyo. El único ancho distinto es el de los flujos de foco, que no
  muestran el menú.
- **FR-003**: Entre dos pantallas cualesquiera vistas con la misma sesión y el mismo rol, en la
  misma ventana, cada enlace del menú MUST quedar en el mismo lugar (§Vocabulario). Solo pueden
  moverse los enlaces que aparecen o desaparecen según la sesión o el rol, y los de su renglón.
- **FR-004**: Lo FR-003 MUST cumplirse también entre una pantalla que entra entera en la ventana y
  una que hay que desplazar, aunque la barra de desplazamiento ocupe lugar en la ventana.
- **FR-005**: En Opinar, con una ventana de 1280, el menú MUST entrar en el renglón del nombre del
  sitio, igual que en «Animales en adopción».
- **FR-006**: Arriba de 1200, la hoja MUST seguir midiendo 1200, centrada, y la pared ocupar el
  resto.
- **FR-007**: Las pantallas de error, las de «no encontrado» y los esqueletos de carga de cada zona
  MUST usar la misma hoja que el resto del sitio, con el menú en el mismo lugar. El cartel de una
  pantalla de error o de «no encontrado», que hoy va centrado en la hoja, MUST seguir centrado en
  la hoja de 1200, con sus mismos textos y su misma salida (reintentar o volver).
- **FR-008**: La pantalla de la cuenta suspendida MUST conservar su hoja angosta y su cabecera sin
  menú, como hoy.
- **FR-009**: Debajo de 1024, ninguna pantalla MUST cambiar: ni el ancho, ni el orden, ni lo que se
  muestra.
- **FR-010**: Lo que hoy se arma a lo ancho de la hoja (la pared de «Mis animales», el formulario de
  un animal en dos columnas, Administrar, la ficha de una persona, el listado, la ficha de un
  animal, el perfil público, las páginas de contenido) MUST seguir armándose igual, a lo ancho de la
  hoja de 1200. Un estado vacío centrado en la hoja MUST seguir centrado.
- **FR-011**: El menú, la cabecera, el pie y la escala tipográfica MUST quedar como están: esta
  historia cambia el ancho de la hoja y el armado de las pantallas de una sola tarea, nada más.

**Las pantallas de una sola tarea**

- **FR-020**: Desde 1024, Opinar, Entrar, «Mirá tu correo», Completar el perfil y Cuenta borrada
  MUST armarse en dos partes: la presentación a la izquierda y
  la tarea a la derecha, del mismo alto de arranque (las dos empiezan en el mismo renglón, debajo
  del menú).
- **FR-021**: La presentación de cada una MUST ser lo que hoy está arriba de la tarea: el título en
  voz de afiche y la bajada; en Entrar, además, el aviso de por qué hay que volver a entrar, cuando
  lo hay; en «Mirá tu correo», además, «Volver» y la dirección a la que se mandó el enlace.
- **FR-022**: La tarea de cada una MUST ser el resto de lo que hoy muestra la pantalla, con los
  mismos textos, en el mismo orden: el formulario de Opinar; las formas de entrar; los dos recordatorios y
  «Enviar otro»; el formulario de Completar el perfil
  con «Cerrar sesión» y «Borrar mi cuenta»; las dos salidas de Cuenta borrada.
- **FR-023**: En la primera pantalla, sin desplazar, a 1024 y a 1280, la presentación MUST estar en
  la mitad izquierda de la hoja y la tarea MUST arrancar en la mitad derecha: ninguna de las dos
  mitades queda sin contenido, y ni la presentación ni la tarea ocupan solas el ancho de la hoja.
- **FR-024**: Cuando la tarea es más larga que la ventana (Completar el perfil, Opinar con el texto
  escrito), la presentación MUST seguir a la vista al desplazar, mientras la tarea se lee.
- **FR-025**: Los errores, los avisos de espera y lo que se muestra después de la acción MUST
  aparecer en la tarea, como hoy, sin mover la presentación.
- **FR-026**: Debajo de 1024, y para quien lee la pantalla con un lector de pantalla en cualquier
  ancho, el orden MUST ser el de hoy: primero la presentación, después la tarea.
- **FR-027**: «El enlace no sirve» MUST seguir siendo un estado centrado, con su título, su
  mensaje, su única salida y su confirmación «Enlace en camino» como hoy, centrado en la hoja de
  1200 como las pantallas de error.

**La decisión**

- **FR-030**: La guía de diseño MUST registrar con fecha la decisión nueva («un solo ancho de hoja
  en todo lo que muestra el menú; lo que se angosta es el contenido; los flujos de foco, sin menú,
  conservan la hoja angosta»), con su motivo (el menú que se corre al navegar, Hernán 2026-10-16), y
  pasar «el tamaño del papel es una propiedad de la zona» a Descartado con el motivo por el que se
  deja. El descarte de 2026-09-20 «Una hoja de ancho único para toda la app» MUST anotar que se
  reabre, y por qué ya no vale su motivo: la columna perdida se resuelve armando en dos partes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una ventana de 1280, en las 11 pantallas de la prueba independiente de la User
  Story 1, la hoja mide 1200 y la posición de cada enlace del menú (borde izquierdo y renglón) es la
  misma, con 0 píxeles de diferencia, con sesión y sin ella.
- **SC-002**: En una ventana de 1920, la hoja mide 1200 en todas esas pantallas.
- **SC-003**: En una ventana de 1100, la hoja mide lo mismo en todas esas pantallas.
- **SC-004**: En Opinar a 1280, el menú ocupa 1 renglón, el mismo del nombre del sitio (hoy, 3).
- **SC-005**: En las cinco pantallas de una sola tarea a 1280, la presentación y la tarea arrancan en
  el mismo renglón, la tarea empieza en la mitad derecha de la hoja, y cada mitad de la hoja tiene
  contenido en la primera pantalla, sin desplazar.
- **SC-006**: En una ventana de 390, cada pantalla muestra, antes y después de esta historia, las
  mismas piezas, con los mismos textos, en el mismo orden, con la misma alineación y el mismo
  tamaño de letra.
- **SC-007**: La pantalla de la cuenta suspendida, a 1280, mide lo mismo que antes de esta historia
  y no muestra el menú.

## Assumptions

- **La hoja de 1200 es la del listado**, el ancho más grande que ya existe: el sitio público no
  cambia, y las pantallas de la cuenta y las de una sola tarea suben a él. Lo dice la historia.
- **«Entrar» incluye «Mirá tu correo».** La historia nombra Opinar, Entrar, Completar el perfil y
  Cuenta borrada como las pantallas de una sola tarea que dejarían media hoja vacía. «Mirá tu
  correo» vive hoy en la misma hoja angosta, es el paso siguiente de Entrar, está alineada a la
  izquierda como Entrar y dejaría el mismo vacío, así que se arma en dos partes igual (lectura
  propia, modo auto).
- **«El enlace no sirve» no se arma en dos partes.** Es un estado y no una tarea: va centrada, como
  las pantallas de error y las confirmaciones (la guía de diseño admite centrar solo ahí), y al
  pedir otro enlace la pantalla entera cambia de título por una decisión ya tomada: dejar «El enlace
  no sirve» arriba contradiría lo que la persona acaba de conseguir. Centrada en la hoja de 1200 no
  deja media hoja vacía, igual que una pantalla de error (lectura propia, modo auto).
- **El lado de cada parte**: la presentación a la izquierda y la tarea a la derecha, porque el
  título se lee primero y así el orden visual coincide con el del teléfono y el del lector de
  pantalla. La historia dice «a un lado» y «al otro»; las páginas de contenido (#8) ponen la lectura
  a la izquierda (modo auto).
- **La presentación queda a la vista al desplazar** (FR-024) como el cierre de una página de
  contenido (#8), para que una tarea larga no deje la presentación sola arriba y media hoja vacía
  debajo (modo auto).
- **Las pantallas de la cuenta que hoy son una columna de lectura** pasan de una hoja de 1024 a una
  de 1200 con la misma columna: les queda más blanco a la derecha. La historia limita el rearmado a
  las cuatro pantallas de una sola tarea y excluye pantallas nuevas y rediseños; rearmar las otras
  queda fuera y va al umbral de seguimiento si la revisión de diseño lo marca.
- **La cuenta suspendida** es el único flujo de foco hoy; si mañana aparece otro sin menú, usa la
  misma hoja angosta.
- **El ancho de la hoja entre 1024 y 1200** es el de la ventana, como ya pasa con el listado: no
  hay márgenes de pared a los costados en ese tramo.
- **La decisión de la guía de diseño** (FR-030) va en esta misma rama, para que llegue a main con
  el código que la sigue. Reabre una decisión del 2026-09-20 con un motivo nuevo, así que el
  enjambre la avisa con un `aviso`.
- **Datos personales**: la historia no agrega ni saca ninguno. El único que aparece en estas
  pantallas, la dirección de correo en «Mirá tu correo», cambia de lado y sigue mostrándose solo a
  quien acaba de pedir el enlace, en ese navegador, como hoy. Tampoco toca la medición.
