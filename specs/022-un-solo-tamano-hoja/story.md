## Historia
**Como** persona que usa el sitio en una computadora **quiero** que la hoja y el menú tengan el mismo tamaño y el mismo lugar en todas las pantallas **para** moverme entre ellas sin que lo que voy a tocar se corra y sin sentir que entré a otro sitio.

## Contexto
Desde 1024 px el sitio vive en una hoja apoyada sobre la pared (docs/10 §Pantallas anchas, decisión 2026-09-20). Hoy esa hoja tiene tres anchos según la zona: 1200 en el sitio público, 1024 en las pantallas de la cuenta y 640 en el ingreso y en Opinar. La cabecera es la misma en las tres, así que al pasar de «Animales en adopción» a «Mis animales», que están una al lado de la otra en el menú, todo el menú se corre; y en Opinar el menú no entra y se parte en tres renglones.

Hernán, 2026-10-16: «según la pantalla el recuadro es más chico o más grande».

Lo habitual en la industria es que el marco (cabecera, menú y pie) tenga un solo ancho en todo el sitio, y lo que se angosta es el contenido. Solo los flujos de foco, que no muestran el menú, usan otro marco. Esta historia reabre la decisión «el tamaño del papel es una propiedad de la zona» con ese motivo nuevo.

## Alcance
- Incluye: un solo ancho de hoja, el del listado (1200), en toda pantalla que muestra el menú, con sesión o sin ella: el sitio público, las pantallas de la cuenta, entrar, completar el perfil, la cuenta borrada y Opinar. Las pantallas de una sola tarea que hoy dejarían media hoja vacía (Opinar, entrar, completar el perfil, la cuenta borrada) se arman desde 1024 en dos partes, como las páginas de contenido (decisión 2026-10-09, historia #8): a un lado el título en voz de afiche y la bajada, al otro el formulario o la acción. La decisión nueva queda en docs/10 y «una hoja por zona» pasa a Descartado con su motivo.
- No incluye (explícito): cambiar nada por debajo de 1024, donde la hoja ya ocupa la ventana entera; rediseñar el menú, la cabecera o el pie; cambiar la escala tipográfica; la cuenta suspendida, que no muestra el menú y conserva su hoja angosta como flujo de foco; pantallas nuevas.

## Reglas de negocio
- La hoja tiene un solo ancho en todo lo que muestra el menú; ninguna pantalla elige el suyo.
- Al navegar entre dos pantallas cualesquiera, cada enlace del menú queda en el mismo lugar. Solo cambian los que aparecen o desaparecen según la sesión o el rol.
- Arriba de 1200 la pared crece y la hoja no.
- Debajo de 1024 todo se ve como hoy.
- La cuenta suspendida conserva su hoja angosta: no tiene menú con el cual compararse.

## Criterios de aceptación
### Camino feliz
- **Dado** una persona con sesión en una ventana de 1280 **cuando** va de «Animales en adopción» a «Mis animales» y después a «Opinar» **entonces** la hoja mide lo mismo en las tres y cada enlace del menú está en el mismo lugar.
- **Dado** Opinar en una ventana de 1280 **cuando** se abre **entonces** el menú entra en el mismo renglón que el nombre del sitio, como en las demás pantallas.
- **Dado** Opinar o Entrar en una ventana de 1280 **cuando** se abren **entonces** el título y la bajada van a un lado y el formulario al otro, y no queda media hoja vacía.

### Casos borde (al menos 3)
- **Dado** una persona sin sesión en una ventana de 1280 **cuando** va de la portada a «Entrar» **entonces** la hoja y el menú no cambian de tamaño ni de lugar.
- **Dado** una ventana de 1920 **cuando** se abre cualquier pantalla **entonces** la hoja sigue midiendo 1200 y la pared ocupa el resto.
- **Dado** una ventana entre 1024 y 1200 **cuando** se navega entre pantallas **entonces** la hoja mide lo mismo en todas.
- **Dado** quien administra, con el menú más largo, en una ventana de 1024 **cuando** navega **entonces** el menú se acomoda igual en todas las pantallas.
- **Dado** una pantalla con un estado vacío centrado, como «Mis animales» sin animales **cuando** se abre a 1280 **entonces** el estado vacío sigue centrado en la hoja.
- **Dado** un teléfono de 390 **cuando** se abre cualquier pantalla **entonces** se ve igual que antes de esta historia.

### Errores y rechazos
- **Dado** una pantalla de error o de «no encontrado» **cuando** se abre a 1280 **entonces** usa la misma hoja que el resto del sitio.
- **Dado** una cuenta suspendida **cuando** se abre su pantalla **entonces** conserva la hoja angosta y sin menú.

## Pantallas
- Todas las que muestran el menú, desde 1024: cambia el ancho de la hoja, al de 1200.
- Opinar, Entrar, Completar el perfil y Cuenta borrada: desde 1024, el título a un lado y el formulario o la acción al otro.
- Estados vacíos: los de cada pantalla, sin cambios.

## Datos personales
- No aplica.

## Medición
- No aplica.

## Dependencias
- docs/10 §Pantallas anchas · #8 (páginas de contenido en dos partes) · #71 (Opinar)

