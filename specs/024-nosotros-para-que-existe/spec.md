# Feature Specification: «Nosotros»: para qué existe el sitio, en qué se diferencia y qué quiere decir su marca

**Feature Branch**: `feature/201-nosotros-para-que-existe`

**Created**: 2026-10-20

**Status**: Draft

**Input**: Historia #201 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido**: el pie del sitio tiene el grupo **Confianza** con «Qué dice cada nivel» y
«Preguntas y respuestas» (historia #200); a esta historia le toca sumarle «Nosotros». El dibujo de
la marca, la pata con la huella digital en la almohadilla, existe en sus tres versiones dibujadas
(principal, compacta y mínima) y se usa en la cabecera y en el pie: esta página lo muestra, no lo
crea ni lo cambia. La página «Qué dice cada nivel» existe (historia #12) y se enlaza tal cual. Lo
que queda: escribir la página «Nosotros» con sus cuatro partes, su fecha y su acción final, y
enlazarla desde el pie.

**Vocabulario de esta spec**:

- **La ventana** es el área del navegador donde se ve el sitio. Los anchos (390, 768, 1024, 1280)
  son anchos de ventana en píxeles CSS.
- **La página** es «Nosotros», una pantalla pública del sitio.
- **Las cuatro partes**, en este orden: **Para qué existe**, **En qué se diferencia**, **Lo que no
  promete** y **La marca**. Cada una tiene un título visible.
- **El cierre** es lo que va después de las cuatro partes: la fecha de última actualización y una
  sola acción, «Ver los animales en adopción», que lleva al listado.
- **La marca** es el dibujo de la pata con la huella digital en la almohadilla. **El dibujo
  grande** es su versión principal, la de 32 px de alto o más, que conserva las cuatro crestas de la
  huella. **La firma** es la marca con el nombre del sitio al lado, la de la cabecera y el pie.
- **La chapita** es el sello que muestra el nivel de verificación de una persona.
- **El nombre del sitio** es el nombre provisorio que hoy figura en la cabecera, escrito en un solo
  lugar del sitio.
- **La tarjeta** es la vista previa que arma un chat (WhatsApp, por ejemplo) cuando alguien pega
  el enlace de una página.
- **La pantalla de la cuenta suspendida** es la que ve una persona con la sesión abierta cuando su
  cuenta está suspendida, en lugar de la portada, el listado o la ficha de un animal.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Leer para qué existe el sitio y en qué se diferencia (Priority: P1)

Una persona llega al sitio por un enlace de WhatsApp, mira un animal y no sabe si confiar. Baja al
pie, toca «Nosotros» y lee, sin ingresar, qué pasa hoy cuando alguien da o adopta un animal, qué
hace distinto este sitio, qué no promete, y al final cuándo se escribió eso por última vez. Si le
convence, toca «Ver los animales en adopción» y sigue mirando. Si le pasa el enlace a otra persona,
a esa le llega una tarjeta con el título de la página.

**Why this priority**: es lo que pidió Hernán el 2026-10-20 y el núcleo de la historia. Sola, ya
cuenta entera la idea del sitio a quien llega sin contexto, que hoy no tiene dónde leerla.

**Independent Test**: sin sesión, en una ventana de 390 y en una de 1280, abrir cualquier pantalla,
tocar «Nosotros» en el pie, leer las tres primeras partes en orden, ver la fecha y tocar la acción
final hasta llegar al listado; pegar el enlace de la página en un chat y ver la tarjeta.

**Acceptance Scenarios**:

1. **Given** cualquier pantalla con el pie, salvo la de una cuenta suspendida, con sesión o sin
   ella, **When** la persona mira el grupo Confianza, **Then** ve «Nosotros» como último enlace del
   grupo, después de «Qué dice cada nivel» y «Preguntas y respuestas».
2. **Given** que la persona toca «Nosotros» en el pie, **When** carga la página, **Then** lee las
   cuatro partes en el orden del vocabulario, cada una con su título, y después el cierre.
3. **Given** la parte **Para qué existe**, **When** la persona la lee, **Then** encuentra lo que
   pasa hoy al dar o adoptar un animal por grupos y mensajes: las estafas del tipo «pagá el flete y
   te lo mando», la gente que adopta para revender o criar, y quienes rescatan entrevistando por
   WhatsApp a cada interesado, uno por uno.
4. **Given** la parte **En qué se diferencia**, **When** la persona la lee, **Then** encuentra las
   cinco diferencias de FR-005, cada una dicha como algo que el sitio hace hoy.
5. **Given** la parte **Lo que no promete**, **When** la persona la lee, **Then** entiende que una
   persona verificada no garantiza que vaya a cuidar bien a un animal, porque la verificación dice
   quién es la persona, y que decidir a quién dar un animal sigue siendo de quien lo publicó.
6. **Given** que la persona llega al final, **When** mira el cierre, **Then** ve «Actualizada el»
   seguido del día, el mes y el año en palabras, y una sola acción, «Ver los animales en adopción»,
   que la lleva al listado de animales en adopción.
7. **Given** que la persona copia el enlace de la página y lo pega en un chat, **When** el chat arma
   la vista previa, **Then** la tarjeta muestra el título de la página y una línea que dice de qué
   se trata, igual que la de la ficha de un animal (historia #57), y no la dirección pelada.
8. **Given** que la persona no ingresó, **When** lee la página entera, **Then** nada le pide
   registrarse ni ingresar, y ninguna parte queda tapada ni recortada.

---

### User Story 2 - Entender qué quiere decir la marca (Priority: P2)

La persona vio la pata con la huella en la cabecera y se pregunta qué es. En la última parte de
«Nosotros» la ve grande, lee que es la pata de un animal con una huella digital en la almohadilla
(el animal y la persona que el sitio sabe quién es) y entiende que no es lo mismo que la chapita:
la marca firma al sitio y la chapita certifica a una persona. Si quiere saber qué certifica cada
chapita, sigue el enlace a «Qué dice cada nivel».

**Why this priority**: lo pidió Hernán aparte («un apartado sobre el logo») y depende de la página
que arma la historia 1. Sin ella la página igual explica el sitio; con ella, la marca deja de ser un
dibujo sin explicación y deja de confundirse con un sello de verificación.

**Independent Test**: en una ventana de 390 y en una de 1280, abrir «Nosotros», llegar a la parte
de la marca, comprobar el tamaño y la posición del dibujo, recorrerla con un lector de pantalla y
tocar el enlace a «Qué dice cada nivel».

**Acceptance Scenarios**:

1. **Given** la parte **La marca**, **When** la persona la mira, **Then** ve el dibujo grande de la
   marca, en tinta sobre el papel, sin el nombre del sitio al lado, quieto y derecho.
2. **Given** la parte **La marca**, **When** la persona la lee, **Then** entiende que el dibujo es
   una pata con una huella digital en la almohadilla, que junta al animal y a la persona que el
   sitio sabe quién es, y que la marca es siempre la misma: no cambia con el nivel de nadie.
3. **Given** la parte **La marca**, **When** la persona la lee, **Then** encuentra en qué se
   distingue de la chapita (la marca firma al sitio, la chapita certifica a una persona) y un enlace
   «Qué dice cada nivel» que la lleva a esa página.
4. **Given** una ventana de 1024 o más, **When** la persona llega a la parte de la marca, **Then**
   el dibujo está al lado del texto de esa parte; **Given** una ventana más angosta, **Then** el
   dibujo está arriba del texto. **Decisión (2026-10-25, Hernán):** la marca va en la suma, en el mismo lugar en todos los anchos; el costado no la repite.
5. **Given** que la persona usa un lector de pantalla, **When** llega al dibujo de la marca,
   **Then** escucha una descripción de lo que representa («una pata con una huella digital en la
   almohadilla», o equivalente), no «imagen» ni el nombre de un archivo.

---

### Edge Cases

- **Sin sesión**: la página se ve entera; no tiene partes reservadas a quien ingresó.
- **Cuenta suspendida con la sesión abierta**: abrir «Nosotros», por el enlace o escribiendo la
  dirección, muestra la pantalla de la cuenta suspendida, como en la portada, el listado y la ficha
  de un animal. En el pie de esa pantalla no aparece «Nosotros», como el resto de los enlaces de
  contenido.
- **La página no se puede mostrar**: en su lugar aparece una pantalla de error que dice que no se
  pudo abrir esta página (no habla de un perfil ni de un animal), ofrece intentar de nuevo y un
  enlace a la portada; la cabecera y el pie siguen ahí. Nunca una pantalla en blanco.
- **Conexión lenta en el teléfono**: el texto de las cuatro partes se puede leer apenas llega la
  página, aunque el dibujo de la marca todavía no esté; cuando el dibujo aparece, el texto no salta
  de lugar.
- **Lector de pantalla**: las cuatro partes y el cierre se recorren como títulos y párrafos, en el
  orden del vocabulario; el dibujo de la marca tiene su descripción en texto.
- **El nombre del sitio cambia**: se cambia en el único lugar donde está escrito, y la página, su
  título en la pestaña y su tarjeta muestran el nombre nuevo sin tocar ningún párrafo.
- **Lo que el sitio hace cambia** (por ejemplo, el seguimiento deja de ser a los 30 días): la
  página cambia en el mismo cambio, y la fecha de última actualización pasa a ese día.
- **Ventana de 390**: la página no tiene desplazamiento lateral; la acción final y el enlace a «Qué
  dice cada nivel» miden al menos 44 px de alto.
- **Entre 768 y 1023**: el dibujo de la marca va arriba del texto, como en el teléfono. **Decisión (2026-10-25, Hernán):** la marca va en la suma, en el mismo lugar en todos los anchos; el costado no la repite.
- **Buscadores**: la página no se indexa, como el resto del sitio hasta que exista el dominio
  definitivo; sí arma la tarjeta al compartirla.
- **Volver**: la página no tiene un «Volver» propio; la persona vuelve con el botón de atrás del
  navegador o con la cabecera, como en las páginas de «Preguntas y respuestas».

## Requirements *(mandatory)*

### Functional Requirements

**La página**

- **FR-001**: El sitio MUST tener una página pública «Nosotros», con ese título, que se lee entera
  sin ingresar ni registrarse.
- **FR-002**: La página MUST mostrar sus cuatro partes en este orden, cada una con su título
  visible: Para qué existe, En qué se diferencia, Lo que no promete, La marca; y después el cierre.
  **Decisión (2026-10-24, Hernán, PR #213):** la marca pesa más y va antes de Lo que no promete,
  después de la parte que cuenta cómo se verifica; se titula «Una palabra, dos huellas».
- **FR-003**: La parte **Para qué existe** MUST contar lo que pasa hoy al dar o adoptar un animal
  por grupos de redes sociales y mensajes, nombrando al menos: las estafas del tipo «pagá el flete y
  te lo mando», la gente que adopta para revender o criar, y quienes rescatan entrevistando por
  WhatsApp a cada interesado, uno por uno.
- **FR-004**: La parte **Para qué existe** MUST decir que la falta de confianza entre quien da y
  quien adopta es el problema que el sitio quiere resolver.
- **FR-005**: La parte **En qué se diferencia** MUST decir estas cinco cosas, como hechos del sitio
  de hoy:
  1. verifica a las personas antes de que intercambien datos, de los dos lados: quien da en
     adopción y quien adopta;
  2. el teléfono y el contacto de nadie están a la vista: se dan solo cuando quien publicó acepta
     una solicitud;
  3. cada persona muestra su nivel de verificación con su chapita, a la vista de quien la mira;
  4. a los 30 días de cada adopción hecha por el sitio, el sitio le pide a quien adoptó una foto de
     cómo está el animal, y quien lo dio la ve;
  5. no cobra por nada, ni a quien da ni a quien adopta.
- **FR-006**: La parte **Lo que no promete** MUST decir que una persona verificada no garantiza que
  vaya a cuidar bien a un animal, porque la verificación dice quién es la persona, y que la decisión
  de a quién dar un animal sigue siendo de quien lo publicó.
- **FR-007**: El cierre MUST mostrar la fecha de la última vez que cambió el texto de la página,
  con el formato de las páginas de «Preguntas y respuestas» («Actualizada el» y la fecha en
  palabras), y una sola acción, «Ver los animales en adopción», que lleva al listado.
- **FR-008**: La página MUST NOT tener otras acciones destacadas además de la del cierre; el enlace
  a «Qué dice cada nivel» es un enlace dentro del texto de la parte de la marca.

**La marca**

- **FR-009**: La parte **La marca** MUST mostrar el dibujo grande de la marca, solo (sin el nombre
  del sitio al lado), de al menos 32 px de alto en todos los anchos, en tinta sobre el papel, sin
  inclinar, sin animar y sin cinta.
- **FR-010**: El dibujo de la marca MUST tener una descripción en texto de lo que representa, que
  es lo que anuncia un lector de pantalla. Desde el 2026-10-24 la lleva la marca de la suma.
- **FR-011**: La parte **La marca** MUST decir que el dibujo es una pata con una huella digital en
  la almohadilla, que junta al animal y a la persona que el sitio sabe quién es, y que es siempre el
  mismo dibujo: no cuenta niveles.
- **FR-012**: La parte **La marca** MUST decir en qué se distingue de la chapita (la marca firma al
  sitio; la chapita certifica a una persona) y enlazar a «Qué dice cada nivel».
- **FR-013**: Desde una ventana de 1024, el dibujo de la marca MUST ir al lado del texto de su
  parte; en ventanas más angostas, arriba del texto. **Decisión (2026-10-24, PR #213):** en todos los
  anchos la marca va en la suma (la pata + la huella digital = la marca) dentro de su parte; desde
  1024 sigue además al costado. **Decisión (2026-10-25, Hernán):** la del costado se saca; repetía la de
  la suma a la misma altura.
- **FR-014**: Lo que la página dice de la marca MUST coincidir con la decisión de la marca del
  2026-10-08 del sistema de diseño; si esa decisión cambia, la página cambia con ella.

**Verdad y nombre**

- **FR-015**: Cada afirmación de la página sobre el sitio MUST describir lo que el sitio hace hoy.
  Un cambio en una de esas conductas MUST actualizar la página y su fecha en el mismo cambio.
- **FR-016**: La página MUST NOT mostrar cifras de impacto, cantidad de adopciones, testimonios ni
  ejemplos con personas o animales reales. Si un ejemplo necesita un nombre, es inventado y la
  página dice que lo es.
- **FR-017**: El nombre del sitio, donde aparezca en la página, en su título y en su tarjeta, MUST
  salir del único lugar donde está escrito; ningún párrafo lo repite escrito a mano.

**Llegar, compartir, fallar**

- **FR-018**: El grupo Confianza del pie MUST sumar «Nosotros» como último enlace, en todas las
  pantallas que hoy muestran ese grupo, con sesión y sin ella.
- **FR-019**: En la pantalla de la cuenta suspendida, el pie MUST NOT mostrar «Nosotros».
- **FR-020**: Una persona con la sesión abierta y la cuenta suspendida que abre la página MUST ver
  la pantalla de la cuenta suspendida en su lugar.
- **FR-021**: La página MUST tener un título y una descripción propios para la pestaña y para la
  tarjeta que arma un chat al compartir su enlace.
- **FR-022**: La página MUST quedar fuera de los buscadores, como el resto del sitio, hasta que se
  prenda la indexación (historia #76).
- **FR-023**: Si la página no se puede mostrar, la persona MUST ver una pantalla de error que dice
  que no se pudo abrir esta página, sin nombrar un perfil, un animal ni otro contenido que no es el
  suyo, con una acción para intentar de nuevo y un enlace a la portada.
- **FR-024**: El texto de la página MUST llegar completo con la primera carga, legible antes de
  que aparezca el dibujo de la marca, y el dibujo MUST NOT correr el texto cuando aparece.
- **FR-025**: La página MUST NOT sumar eventos a la medición: no es un paso del funnel.
- **FR-026**: Todo el texto visible de la página y del enlace del pie MUST estar en español
  rioplatense, con voseo, y vivir junto al resto de los textos del sitio.

### Key Entities

- **Página «Nosotros»**: un título, una descripción para la tarjeta, cuatro partes con título y
  texto, la fecha de última actualización y la acción final. No guarda datos de nadie.
- **Enlace «Nosotros» del pie**: un nombre visible y la página como destino, último del grupo
  Confianza.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde 5 pantallas distintas (portada, listado, ficha de un animal, una página de
  «Preguntas y respuestas» y Opinar), con sesión y sin ella, «Nosotros» es el último enlace del
  grupo Confianza y lleva a la página en 1 toque: 10 de 10 combinaciones.
- **SC-002**: Sin sesión, en ventanas de 390 y de 1280, la página muestra las 4 partes en el orden
  fijado y el cierre, sin pedir ingresar: 2 de 2.
- **SC-003**: Las 5 diferencias de FR-005 aparecen en la parte En qué se diferencia, y cada una
  coincide con una conducta que hoy se puede comprobar en el sitio: 5 de 5.
- **SC-004**: En ventanas de 1024 y 1280, el dibujo de la marca está al lado del texto de su parte;
  en 390 y 768, arriba: 4 de 4. En los 4 anchos mide 32 px de alto o más. **Decisión (2026-10-25, Hernán):** la marca va en la suma, en el mismo lugar en todos los anchos; el costado no la repite.
- **SC-005**: Con un lector de pantalla, el dibujo de la marca se anuncia con su descripción, y las
  4 partes y el cierre se recorren como títulos en orden.
- **SC-006**: En una ventana de 390 la página no tiene desplazamiento lateral, y la acción final y
  el enlace a «Qué dice cada nivel» miden al menos 44 px de alto.
- **SC-007**: Pegar el enlace de la página en un chat arma una tarjeta con el título de la página
  en el 100 % de los intentos.
- **SC-008**: Con la sesión de una cuenta suspendida, abrir la dirección de la página termina en la
  pantalla de la cuenta suspendida en el 100 % de los intentos, y su pie no muestra «Nosotros».
- **SC-009**: Cambiar el nombre del sitio en su único lugar cambia el nombre en la página, en su
  título y en su tarjeta sin editar ningún texto de la página: 0 párrafos tocados.
- **SC-010**: Con el perfil de teléfono y red lenta con el que el sitio mide su rendimiento, el
  título y el primer párrafo de la página se pueden leer en menos de 2,5 segundos, y el texto no se
  corre cuando aparece el dibujo de la marca.

## Assumptions

- **El nombre de la sección es «Nosotros»**: la historia lo decide y deja abierto cambiarlo si
  aparece uno mejor. Al escribir la spec no apareció ninguno que diga más con la misma brevedad en
  el pie; queda «Nosotros» (modo auto).
- **El orden del enlace en el pie**: «Nosotros» va último en Confianza, como dejó anotado la
  historia #200 al armar el grupo (modo auto).
- **El seguimiento, como se dice** (FR-005.4): hoy el seguimiento se pide una sola vez, a los 30
  días de marcar adoptado, a quien adoptó, que responde con fotos, y quien publicó lo ve; no se pide
  si la adopción terminó, se deshizo, hubo un bloqueo o una de las cuentas está suspendida ese día,
  y no existe cuando el animal se entregó a alguien que no vino por el sitio. La página dice «a los
  30 días de cada adopción hecha por el sitio» sin enumerar esas excepciones: son casos en los que
  ya no hay a quién pedirle, y listarlas no le dice nada a quien todavía no sabe qué es el sitio
  (modo auto).
- **«Verifica a las personas antes de que intercambien datos»** (FR-005.1): hoy, para publicar o
  solicitar hace falta al menos el teléfono verificado, y la identidad es un nivel más que cada
  persona puede sumar. La página no dice que todas las personas tienen la identidad verificada
  (modo auto).
- **Lo que no promete** suma, además de lo que nombra la historia, que la decisión de a quién dar
  sigue siendo de quien publicó: es la consecuencia directa de «la verificación dice quién es» y es
  lo que el sitio hace hoy (quien publica acepta o rechaza cada solicitud) (modo auto).
- **Sin «Volver» propio**: la historia no lo pide; la página se alcanza desde el pie de cualquier
  pantalla y el botón de atrás del navegador vuelve a ella. Lo mismo hacen las páginas de
  «Preguntas y respuestas» (modo auto).
- **Cargando**: la página no depende de datos de nadie, así que no tiene un estado de carga propio
  con esqueleto; mientras navega, el sitio muestra lo mismo que al pasar a cualquier pantalla
  pública. **Vacío**: no aplica, siempre tiene texto (la historia lo dice).
- **El dibujo sin el nombre**: la parte de la marca muestra la pata sola, porque explica el dibujo;
  la firma con el nombre ya está en la cabecera y en el pie de la misma pantalla (modo auto).
- **La fecha de última actualización** es la del día en que se publica el texto de esta historia, y
  se cambia a mano cuando cambia el texto, como en las páginas de «Preguntas y respuestas».
- **Facebook, Instagram y WhatsApp** se nombran como los lugares donde hoy pasa la adopción, como
  hechos; la página no usa sus logos ni habla en su nombre.
- **El título en la cabecera**: la página no suma «Nosotros» al menú de arriba; la historia la
  enlaza solo desde el pie.
- **Datos personales**: no aplica. La página no muestra ni guarda datos de ninguna persona y es la
  misma con sesión y sin ella.
- **Medición**: no aplica (docs/03 §7). Tocar el enlace a «Qué dice cada nivel» desde la página
  cuenta igual que cualquier otra apertura de esa página, como hoy.
- **Fuera del alcance, como dice la historia**: quién está detrás, fotos de personas o historia de
  fundadores; cifras de impacto, número de adopciones o testimonios; un formulario de contacto;
  cómo ayudar con plata o donaciones (fuera del MVP); alianzas o logos de otras organizaciones;
  descargar la marca o su kit; cambiar el logo o el nombre del sitio; contenido en otro idioma;
  prender la indexación en buscadores (#76).
