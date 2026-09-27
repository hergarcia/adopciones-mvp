# Feature Specification: Publicar un animal con sus fotos y sus datos

**Feature Branch**: `feature/53-publicar-animal-fotos-datos`

**Created**: 2026-09-26

**Status**: Draft

**Input**: Historia #53 del backlog, milestone «M2 - Publicación y difusión». El cuerpo verbatim de
la historia acompaña a esta spec (`story.md`).

**Ya construido** (historias #9 y #10): el **aviso de verificación pendiente** para publicar —la
puerta de la historia #10 con el motivo «publicar», su texto y su camino para verificarse—; el
procesado de la foto de perfil, que la vuelve a guardar sin la ubicación ni los datos de la cámara
y con la orientación correcta, con los formatos y el tope de 10 MB de la historia #9; y lo escrito
en el perfil que sobrevive a una recarga en el mismo navegador y se borra al cerrar sesión o al
borrar la cuenta. Los textos del vacío de «Mis animales» y el aviso «Publicado» existen solo como
muestra del sistema de diseño, no como pantalla. Esta spec no rehace nada de eso: reusa el aviso
tal cual, sigue la misma regla de fotos y la misma regla de lo escrito sin guardar, y construye
todo lo de los animales, que en el sitio no existe todavía.

**Vocabulario de esta spec**: una **publicación** es un animal publicado por una persona, con sus
fotos y sus datos; en la pantalla se le dice «animal» («Mis animales», «Editar un animal»). La
**ficha** es la página pública de un animal, que llega con la historia siguiente: acá se habla de
«los datos de la ficha» solo para nombrar qué se carga. Quien publica es el **publicador**. La
**portada** es la primera foto. **Nivel 1**, **la puerta**, **el aviso de verificación pendiente**,
**número a medias** y **número perdido** significan lo mismo que en las specs de las historias #10
y #25. La **zona** es departamento más localidad, con la etiqueta «Barrio» en Montevideo y
«Localidad» en los otros 18 departamentos, igual que en el perfil (historia #9). Lo **cargado** es
todo lo que la persona puso en el formulario, fotos incluidas; lo **escrito** es lo cargado menos
las fotos. Una **vía de contacto** es el mismo concepto que en el perfil (historia #9, su FR-020b)
—un teléfono, un correo o un enlace—, más los usuarios de redes sociales, con la regla de FR-014.
Un **intento** de
publicar es una carga en una pestaña: empieza cuando se abre publicar y termina al publicar, al
empezar de cero, al cerrar la sesión o al irse de la pantalla. Recargar o abrir publicar en otra
pestaña empieza otro intento, que arranca con lo escrito recuperado (FR-024). Un intento publica
una sola vez (FR-018).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publicar un animal y verlo en Mis animales (Priority: P1)

Una rescatista con el teléfono verificado toca publicar desde el celular, elige de 1 a 5 fotos,
decide cuál es la portada y en qué orden van, completa la ficha —con la zona de su perfil ya
propuesta— y toca «Publicar». Ve «Publicado» y el animal aparece primero en «Mis animales», con la
portada, el nombre, la zona y la marca de urgente si la puso. Quien no tiene el teléfono verificado
ve el aviso de verificación pendiente, y quien no ingresó, que tiene que entrar.

**Why this priority**: es la historia. Publicar es el primer trabajo que el sitio les tiene que
ahorrar a los rescatistas, y sin animales publicados no hay nada que difundir ni solicitar. Sin
esto, las demás no tienen sobre qué actuar.

**Independent Test**: con una persona sembrada con nivel 1: abre publicar, elige 3 fotos, marca la
segunda como portada, completa los obligatorios, deja la zona propuesta y publica. Ve «Publicado»,
el animal está primero en «Mis animales» con la portada elegida, y las fotos guardadas no traen
ubicación ni datos de la cámara. Con una persona sembrada sin nivel 1, publicar muestra el aviso
de verificación pendiente.

**Acceptance Scenarios**:

1. **Dado** que tengo el teléfono verificado, **cuando** toco publicar, elijo 3 fotos desde el
   celular, completo los datos obligatorios y toco «Publicar», **entonces** veo «Publicado» y el
   animal aparece primero en «Mis animales», con la foto de portada, el nombre, la zona y la marca
   de urgente si la puse.
2. **Dado** que estoy cargando un animal, **cuando** llego a la zona, **entonces** ya está
   propuesta la de mi perfil, y si la cambio, el animal queda con la nueva y mi perfil no cambia.
3. **Dado** que cargué varias fotos, **cuando** elijo otra como portada o cambio el orden,
   **entonces** «Mis animales» muestra la portada que elegí, y al abrir el animal las fotos están
   en el orden que dejé.
4. **Dado** que ya tengo 5 fotos cargadas, **cuando** intento agregar otra, **entonces** no se
   agrega y se me dice que el máximo es 5.
5. **Dado** que saco la foto de portada, **cuando** quedan otras, **entonces** la siguiente pasa a
   ser la portada; y si saco la última, no puedo publicar hasta agregar una.
6. **Dado** que falta un dato obligatorio, **cuando** toco «Publicar», **entonces** se me marca
   cada uno de los que faltan, voy al primero, y lo demás sigue cargado.
7. **Dado** que escribo mi celular o un enlace de WhatsApp en la descripción, **cuando** toco
   «Publicar», **entonces** no se publica, se marca la descripción, se me dice qué se encontró
   (un teléfono, un correo, un enlace o un usuario de una red) y se me explica que el contacto se
   da cuando acepto una solicitud.
8. **Dado** que elijo una foto de más de 10 MB o un archivo que no es una foto, **cuando** se
   carga, **entonces** esa foto se rechaza con el motivo y las demás quedan.
9. **Dado** que escribo una edad de 0 meses o de 30 años, **cuando** toco «Publicar»,
   **entonces** se me dice el rango que se acepta: de 1 a 11 meses o de 1 a 25 años.
10. **Dado** que no tengo el teléfono verificado (nunca lo verifiqué, tengo un cambio de número a
    medias o perdí el número), **cuando** toco publicar, **entonces** veo el aviso de verificación
    pendiente, con el motivo y el camino para verificarme ahí mismo, y al terminar de verificarme
    vuelvo a publicar.
11. **Dado** que no ingresé, **cuando** abro publicar o «Mis animales», **entonces** se me pide
    entrar y después vuelvo a donde iba.
12. **Dado** que publico una foto sacada con el celular, **cuando** otra persona la descarga más
    adelante, **entonces** la foto no dice dónde se sacó, con qué cámara ni cómo se llamaba el
    archivo, y se ve derecha, como en el celular.
13. **Dado** que toco «Publicar» dos veces seguidas, **cuando** termina, **entonces** hay una sola
    publicación.
14. **Dado** que no publiqué ningún animal, **cuando** abro «Mis animales», **entonces** veo
    «Todavía no publicaste ningún animal. Empezá con una foto.», con la acción de publicar.

---

### User Story 2 - Corregir lo publicado (Priority: P2)

Algo cambia —la castraron, se sacó una foto mejor, la mudaron de hogar de tránsito— y la
publicadora abre el animal desde «Mis animales», cambia lo que haga falta, fotos incluidas, y toca
«Guardar». La edad que cargó al publicar sigue avanzando sola, así que un cachorro no queda con 2
meses para siempre.

**Why this priority**: una ficha que no se puede corregir envejece mal y obliga a publicar de
nuevo; pero sin la primera, no hay nada que corregir.

**Independent Test**: sobre un animal publicado (US1): abrirlo desde «Mis animales», cambiar la
descripción, sacar una foto, agregar otra, cambiar la portada y guardar. Ver «Guardado» y el
animal con los cambios. Publicar uno con 2 meses de edad, correr un mes atrás el día desde el que
avanza su edad, abrirlo y ver 3 meses.

**Acceptance Scenarios**:

1. **Dado** que publiqué un animal, **cuando** lo abro desde «Mis animales», cambio la
   descripción, saco una foto, agrego otra y guardo, **entonces** veo «Guardado» y el animal queda
   con los cambios, y la foto que saqué deja de existir.
2. **Dado** que publiqué un cachorro con 2 meses, **cuando** lo abro un mes después, **entonces**
   su edad figura como 3 meses.
3. **Dado** que estoy editando, **cuando** saco todas las fotos, **entonces** no puedo guardar
   hasta agregar una, y lo publicado sigue como estaba.
4. **Dado** que abro el enlace de edición de un animal que no es mío, **cuando** carga,
   **entonces** veo «este animal no existe», igual que si no existiera, con el camino a «Mis
   animales».
5. **Dado** que cambié de número y todavía no confirmé el nuevo, **cuando** intento publicar o
   editar, **entonces** veo el aviso de verificación pendiente, y mis animales ya publicados siguen
   en «Mis animales».
6. **Dado** que al editar escribo una vía de contacto en el nombre, la descripción o la localidad, **cuando**
   guardo, **entonces** no se guarda, se marca el campo y se me explica, igual que al publicar.
7. **Dado** que edité un animal, **cuando** vuelvo a «Mis animales», **entonces** sigue en el
   mismo lugar del orden: editar no lo hace más nuevo.

---

### User Story 3 - Cargar desde el celular sin perder nada ni duplicar (Priority: P3)

La señal va y viene. Si un guardado no llega, todo lo cargado sigue en pantalla con el aviso de
que no se guardó y por qué, y reintentar manda lo que está en pantalla, sin crear dos
publicaciones. Si se recarga la página a mitad de la carga, lo escrito sigue ahí y solo hay que
volver a elegir las fotos. Y si ya hay un animal publicado con el mismo nombre y la misma especie,
se avisa antes de publicar otro, sin frenar.

**Why this priority**: se publica desde el celular y perder cinco fotos y doce datos es volver a
Facebook; pero se prueba sobre lo que construyen las dos primeras.

**Independent Test**: cortar la conexión y tocar «Publicar»: se ve que no se publicó por falta de
conexión y todo sigue en pantalla; volver a conectar y reintentar: hay una sola publicación.
Recargar a mitad de la carga: lo escrito sigue y las fotos no. Con una perra «Luna» publicada,
publicar otra perra «Luna»: aparece el aviso y se puede publicar igual.

**Acceptance Scenarios**:

1. **Dado** que se corta la conexión, **cuando** toco «Publicar», **entonces** veo que no se
   publicó porque no hay conexión, las fotos y los datos siguen en pantalla, y al reintentar con
   conexión se publica una sola vez.
2. **Dado** que la publicación llegó pero la respuesta se perdió, **cuando** reintento,
   **entonces** veo «Publicado» y hay una sola publicación.
3. **Dado** que recargo la página a mitad de la carga, **cuando** vuelvo, **entonces** los datos
   que había escrito siguen ahí, se me dice que se recuperó lo escrito, y solo tengo que volver a
   elegir las fotos.
4. **Dado** que ya tengo publicada una perra llamada Luna, **cuando** publico otra perra llamada
   Luna, **entonces** se me avisa que ya tengo una con ese nombre y puedo publicar igual o volver a
   «Mis animales».
5. **Dado** que publiqué, cerré sesión o borré mi cuenta, **cuando** vuelvo a abrir publicar en
   ese navegador, **entonces** el formulario arranca vacío.
6. **Dado** que se corta la conexión, **cuando** toco «Guardar» al editar, **entonces** veo que no
   se guardó y por qué, los cambios siguen en pantalla, y al reintentar se guardan una sola vez.

---

### Edge Cases

- **Varias fotos elegidas de una vez que pasan el tope**: con 3 cargadas y 4 elegidas, entran las
  2 primeras en el orden en que llegaron y se dice que el máximo es 5 y cuántas quedaron afuera.
- **Una foto de varias elegidas falla** (tipo, tamaño o procesado): se rechaza esa sola, con su
  motivo, y las otras entran.
- **La misma foto elegida dos veces**: entra dos veces; la persona saca la que sobra. No se
  compara el contenido de las fotos.
- **Fotos todavía preparándose al tocar «Publicar» o «Guardar»**: la acción queda ocupada hasta
  que terminen y después publica o guarda; nunca publica sin una foto que se ve en pantalla. Si
  alguna de esas fotos se rechaza al terminar de prepararse, no se publica ni se guarda nada: la
  acción se libera, la foto rechazada dice su motivo, y la persona decide.
- **Una foto que se preparó bien pero no se pudo subir**: el guardado entero falla y rige FR-021;
  una publicación nunca aparece con menos fotos que las que la persona vio en pantalla.
- **Formatos**: JPEG, PNG, WebP o AVIF, de hasta 10 MB. HEIC no se acepta, igual que en la foto de
  perfil (historia #9, su FR-025, y su limitación aceptada): el iPhone lo convierte a JPEG al
  elegirlo desde el navegador. Un HEIC, un GIF, un video o un documento se rechazan con el mismo
  motivo, «formato no aceptado», que nombra los cuatro formatos que sí; un archivo de un formato
  aceptado que no se puede abrir se rechaza con «no pudimos preparar esta foto, probá con otra».
- **Foto chica** (menos resolución que el tamaño más grande que se muestra): se acepta y no se
  agranda.
- **Foto muy apaisada o muy vertical**: se guarda entera; donde el sistema de diseño la recorta
  para mostrarla, el recorte es centrado. Recortar dentro del sitio no es de esta historia.
- **Edad en el borde**: 11 meses es el máximo en meses; «12 meses» se rechaza con el rango y la
  sugerencia de cargarlo como 1 año. Una edad con decimales o con letras se rechaza con el rango.
- **Edad que avanza a otra unidad**: un animal publicado con 11 meses figura con 1 año un mes
  después; desde 12 meses la edad se muestra en años enteros, redondeando hacia abajo.
- **Edad que avanza más allá de 25 años**: se muestra la que corresponde; el rango de 1 a 25 limita
  lo que se carga, no lo que se muestra. Guardar una edición sin tocar esa edad no la rechaza.
- **Editar sin tocar la edad**: la edad sigue avanzando desde el día en que se publicó. **Editar la
  edad**: la nueva vale desde el día en que se guarda y avanza desde ahí (FR-010).
- **Nombre con espacios de más**: se ignoran los del principio y el final; un nombre de solo
  espacios es un nombre vacío.
- **Nombre de más de 30 caracteres o descripción de más de 2000**: se ve cuánto queda desde los 25
  caracteres del nombre y desde los 1800 de la descripción. Si se pega o se escribe de más, el
  texto queda entero, el campo dice cuántos caracteres sobran, y no se publica ni se guarda hasta
  recortarlo: nunca se corta solo el final de lo que la persona pegó. Cada letra, espacio o emoji
  cuenta como un carácter.
- **Aviso de nombre repetido**: compara el nombre sin distinguir mayúsculas, tildes ni espacios
  del principio y el final —la ñ no se confunde con la n—, y solo contra los animales de la misma especie publicados por la misma
  persona. «Luna» y «luna » se avisan; «Luna» perra y «Luna» gata no. Aparece solo al publicar uno
  nuevo, no al editar.
- **Vía de contacto en el nombre o en la localidad**: se rechaza igual que en la descripción,
  marcando ese campo.
- **Números que no son teléfonos**: una fecha («12.03.2025»), una ruta y un kilómetro («Ruta 8 km
  25»), un peso o una cantidad de dosis pasan. Un número de 8 o más dígitos —el número del chip,
  o años seguidos separados solo por espacios, «2023 2024»— se trata como teléfono y se rechaza
  diciendo que parece un teléfono; separados con comas («2023, 2024») pasan. Los datos ya dicen si
  tiene chip; el número del chip no le sirve al adoptante antes de la adopción.
- **Contacto disfrazado** (el número en palabras, «juan arroba gmail punto com») o una dirección
  escrita en la descripción: no se detecta. Junto a la descripción se dice que no lleve contacto ni
  dirección. La regla frena lo común, no a quien quiere esquivarla (Assumptions).
- **Perder el nivel 1 con el formulario abierto** (empezó un cambio de número en otra pestaña, otra
  cuenta se quedó con el número): rige FR-023.
- **Una respuesta perdida y después una recarga**: lo escrito guardado es de un intento que ya se
  publicó. Al abrir el formulario, el producto lo reconoce, descarta lo escrito y dice que ese
  animal ya está publicado, con el acceso a «Mis animales». Nunca ofrece como sin publicar algo
  que ya se publicó.
- **La sesión vence con el formulario abierto**: rige FR-022. Al volver con la misma cuenta en el
  mismo navegador, se vuelve al formulario con lo escrito; si entra otra cuenta, lo escrito por la
  anterior se descarta sin mostrarse (FR-024).
- **Salir del formulario con fotos elegidas sin publicar** (tocar otra sección, volver atrás): se
  avisa que las fotos se pierden y lo escrito queda; la persona elige salir o quedarse. Al editar,
  salir con cambios sin guardar avisa que esos cambios se pierden.
- **Volver atrás después de publicar**: el formulario de publicar arranca vacío; nunca vuelve a
  mandar la publicación que ya se hizo.
- **Recargar al editar**: vuelve lo publicado, sin los cambios sin guardar (FR-025).
- **Dos pestañas editando el mismo animal**: vale el último guardado, que deja el animal
  exactamente como estaba en su pantalla, edad incluida. Si en esa pantalla hay una foto que otra
  pestaña ya sacó, no se guarda nada y se dice que el animal cambió en otra pestaña, con la opción
  de volver a abrirlo.
- **Un reintento después de una respuesta perdida** con un nombre repetido: el reintento se
  reconoce primero como el mismo intento y termina en «Publicado»; el aviso de nombre repetido
  nunca aparece por la publicación que ese mismo intento acaba de crear.
- **Fotos de un intento que no terminó** (se abandonó, falló y nunca se reintentó): se borran en la
  primera limpieza después de las 24 horas (FR-020). Una foto existe en el sitio para quedarse solo
  como parte de una publicación.
- **Dos pestañas publicando**: cada pestaña es un intento aparte, aunque la segunda haya arrancado
  con lo escrito recuperado; si la persona publica en las dos, hay dos publicaciones, y el aviso de
  nombre repetido avisa en la segunda. Lo escrito guardado en el navegador es el de la última
  pestaña que escribió.
- **Una respuesta perdida y otra carga**: si la persona recarga o abre otra pestaña y vuelve a
  publicar el mismo animal, es otro intento; el aviso de nombre repetido le muestra que ese animal
  ya está en «Mis animales» y puede volver ahí.
- **Muchos animales publicados**: no hay tope; «Mis animales» los muestra todos, del más nuevo al
  más viejo según el momento exacto en que se publicaron.
- **Perfil sin zona**: la zona del animal arranca vacía y es obligatoria como siempre.
- **La zona del perfil cambia después de publicar**: el animal conserva la suya.
- **Borrar la cuenta con animales publicados**: se borran las publicaciones y todas sus fotos con
  la cuenta, también las de un intento sin terminar, y en ese navegador lo escrito sin publicar. Si
  otra pestaña estaba subiendo una foto en ese momento, esa subida falla: la cuenta ya no existe.
- **Cerrar sesión por cualquier camino** (cerrar sesión, «Entrar con esa cuenta» de la historia
  #25): se borra lo escrito sin publicar en ese navegador.

## Pantallas

Cada pantalla, con su estado vacío, su estado mientras carga o guarda, y su estado de error, con
los mismos criterios que las historias #9 y #10. Ninguna aparece en buscadores: son privadas.

- **Publicar un animal**.
  - *Vacío*: arranca con el lugar para la primera foto como invitación, la zona del perfil
    propuesta, las respuestas de convivencia en «no se sabe», la marca de urgente en «no», y el
    resto sin completar, con la unidad de la edad sin elegir. Si hay algo escrito recuperado
    (FR-024), arranca con eso —su zona incluida, aunque el perfil haya cambiado— y lo dice, con la
    opción de empezar de cero. Si lo escrito era de un intento que ya se publicó, arranca vacío y
    dice que ese animal ya está publicado, con el acceso a «Mis animales».
  - *Cargando*: mientras trae la zona del perfil, se dibuja la forma del formulario con el lugar
    de la primera foto. Mientras una foto se prepara, su lugar se ocupa con la forma y el tamaño
    definitivos, y la vista previa aparece recién cuando terminó (historia #9, su FR-024a).
    Mientras se publica, «Publicar» queda ocupado, no admite un segundo toque, y se ve cuántas
    fotos van subidas de cuántas (FR-018).
  - *Error*: cada foto rechazada dice su motivo (formato, tamaño, no se pudo preparar, máximo 5) y
    se puede elegir otra; cada campo que falta o está mal lo dice en el campo; la vía de contacto
    dice qué se encontró y que el contacto se da al aceptar una solicitud; el guardado que no llegó
    dice por qué —sin conexión o el sitio no respondió— con todo en pantalla y reintentar (FR-021);
    la sesión vencida avisa qué se conserva antes de pedir entrar (FR-022).
  - *Después de publicar*: «Mis animales» con el aviso «Publicado» y el animal primero.
- **Aviso de nombre repetido**.
  - *Vacío*: no aplica. Dice que ya hay un animal de esa especie con ese nombre y ofrece
    «Publicar igual» y volver a «Mis animales»; cerrarlo deja el formulario como estaba. Si hay
    fotos elegidas, dice también que al volver se pierden las fotos y lo escrito queda: elegir
    volver es la confirmación, y no se abre un segundo aviso.
  - *Cargando*: «Publicar igual» queda ocupado mientras publica, igual que «Publicar».
  - *Error*: el de «Publicar».
- **Editar un animal**.
  - *Vacío*: no aplica: siempre muestra lo publicado. Si el animal no existe o no es de quien lo
    abre, la pantalla es «este animal no existe», con el camino a «Mis animales».
  - *Cargando*: mientras trae lo publicado, se dibuja la forma del formulario con el lugar de las
    fotos. Mientras guarda, «Guardar» queda ocupado y no admite un segundo toque.
  - *Error*: los de «Publicar», con «Guardar»; si no se pudo traer lo publicado, se dice y se
    ofrece reintentar.
  - *Después de guardar*: «Mis animales» con el aviso «Guardado» y el animal en su lugar.
- **Mis animales**.
  - *Vacío*: «Todavía no publicaste ningún animal. Empezá con una foto.», con la acción de
    publicar.
  - *Cargando*: se dibuja la forma de la lista —la foto, el nombre y la zona de cada uno— mientras
    trae los animales.
  - *Error*: se dice que no se pudo traer la lista y se ofrece reintentar; la acción de publicar
    sigue a la vista. Si se llegó recién publicado o guardado, el aviso «Publicado» o «Guardado»
    se ve igual: lo que se hizo, se hizo.
  - *Con animales*: cada uno con su portada, su nombre, su zona y la marca de urgente si la tiene,
    del más nuevo al más viejo según el momento en que se publicó; tocar uno lo abre para editar.
    La acción de publicar otro siempre está a la vista.
- **Aviso de verificación pendiente** (historia #10): el mismo, con el motivo «publicar», también
  cuando se intentaba editar (editar lo publicado es parte de publicar). Sus estados son los de la
  historia #10; esta historia no lo cambia.

## Requirements *(mandatory)*

### Functional Requirements

#### Quién publica y quién ve

- **FR-001**: Publicar y editar DEBEN exigir nivel 1 (historia #10). Quien no lo tiene —nunca
  verificó, tiene un cambio de número a medias o perdió el número— DEBE ver, al tocar publicar o al
  abrir un animal para editarlo, el aviso de verificación pendiente con el motivo «publicar» y el
  camino para verificarse, y al terminar DEBE volver a la pantalla que intentaba abrir. La
  exigencia DEBE comprobarse también al publicar o guardar, no solo al abrir la pantalla.
- **FR-002**: Publicar no DEBE exigir la marca de rescatista o refugio del perfil: alcanza con el
  nivel 1.
- **FR-003**: Sin sesión, abrir publicar, editar o «Mis animales» DEBE pedir entrar y, en el mismo
  dispositivo, volver a esa pantalla, con las reglas de destino de la historia #9.
- **FR-004**: «Mis animales» DEBE mostrarse con o sin nivel 1: quien lo perdió sigue viendo lo que
  publicó.
- **FR-005**: Cada persona DEBE ver y editar solo sus propias publicaciones. En esta historia una
  publicación —sus datos y sus fotos— la ve únicamente quien la publicó; ninguna otra persona que
  use el producto, con sesión o sin ella, la puede ver, ni siquiera conociendo o adivinando la
  dirección de una foto o de la pantalla de edición. Quien administra el sitio accede solamente por
  fuera del producto, como en la historia #9 (su FR-026b). Abrir la
  edición de un animal ajeno DEBE verse exactamente igual que abrir uno que no existe: «este animal
  no existe». Cada una de estas reglas DEBE poder demostrarse con un intento fallido de lectura y
  de escritura desde una persona sin sesión y desde otra persona con sesión.

#### Los datos del animal

- **FR-006**: Una publicación DEBE tener entre 1 y 5 fotos. La primera es la portada. El publicador
  DEBE poder, en cada foto, moverla un lugar antes o un lugar después, usarla de portada —pasa a
  ser la primera y las demás corren un lugar sin cambiar su orden— y sacarla; todo con un toque,
  sin tener que arrastrar. Sacar la portada DEBE hacer portada a la siguiente. Sin fotos no se
  puede publicar ni guardar.
- **FR-007**: Las fotos DEBEN aceptarse en JPEG, PNG, WebP o AVIF de hasta 10 MB cada una, y
  rechazarse las demás, cada una con su motivo (Edge Cases, «Formatos»), sin perder las otras ni lo
  escrito. Intentar pasar de 5 DEBE decir que el máximo es 5 y no agregar ninguna de más.
- **FR-008**: Las fotos DEBEN guardarse sin la ubicación donde se sacaron, sin los datos de la
  cámara y sin el nombre del archivo original, y con la orientación con la que se ven en el
  teléfono. La original, con sus metadatos, NUNCA DEBE salir del dispositivo de la persona. Cada
  foto DEBE guardarse en un tamaño chico para la lista y el formulario y en uno grande para cuando
  la ficha se vea (historia siguiente), y mientras carga DEBE ocupar su lugar con una versión
  borrosa de sí misma, no con un hueco.
- **FR-009**: Los datos obligatorios DEBEN ser: al menos una foto; nombre, de hasta 30 caracteres;
  especie, perro o gato; sexo, macho o hembra; edad aproximada; tamaño de adulto, chico, mediano o
  grande —en un cachorro, el que se espera que tenga—; castrado, sí o no; vacunas, al día,
  incompletas o sin vacunar; chip, sí o no; y zona. La descripción DEBE ser opcional, de hasta
  2000 caracteres. Convive con niños, con perros y con gatos DEBEN contestarse cada uno con sí, no
  o no se sabe, y arrancar en no se sabe. La marca de urgente DEBE ser sí o no y arrancar en no. No
  se pide raza.
- **FR-010**: La edad aproximada DEBE cargarse como un número entero y, aparte, la unidad, meses o
  años, que arranca sin elegir; los dos son obligatorios. En meses va de 1 a 11 y en años de 1 a
  25, y fuera de ese rango DEBE rechazarse diciendo el rango. Es la edad del día en
  que se publica y DEBE avanzar sola: se le suma un mes cada vez que se cumple el mismo día del mes
  siguiente —o el último día de ese mes si no tiene ese día—, en hora de Uruguay. Por debajo de 12
  meses se muestra en meses; desde 12, en años enteros redondeando hacia abajo. Al editar se
  muestra la edad de hoy. Si al guardar la edad y la unidad son las mismas que se mostraban al
  abrir —se hayan tocado o no en el medio—, la edad sigue avanzando desde la de antes y no se
  vuelve a controlar su rango; si son otras, la nueva vale desde el día en que se guarda.
- **FR-011**: La zona DEBE ser departamento, de la lista cerrada de 19, y localidad, con las
  sugerencias, la etiqueta según el departamento y el largo iguales que en el perfil (historia #9),
  y con la regla de vías de contacto de FR-014. La localidad NO DEBE aceptar un número de 3 o más
  dígitos seguidos, que es el número de puerta de una dirección, y al rechazarlo DEBE decir que la
  zona es el barrio o la localidad, nunca una dirección. Al publicar
  DEBE proponerse la zona del perfil de quien publica, y DEBE poder cambiarse. Cambiarla NO DEBE
  cambiar el perfil. Nunca se pide una dirección ni una ubicación en un mapa.
- **FR-012**: Una publicación nueva DEBE quedar **disponible** y guardar la fecha en que se publicó y
  quién la publicó. Editar NO DEBE cambiar la fecha de publicación.
- **FR-013**: No DEBE haber tope de animales publicados por persona.

#### Sin contacto en el texto

- **FR-014**: El nombre, la descripción y la localidad NO DEBEN aceptar una **vía de contacto**. La
  regla parte de la del nombre y la localidad del perfil (historia #9, su FR-020b) y la ajusta a
  lo que se escribe en la descripción de un animal:
  - un **teléfono**: 8 o más dígitos seguidos, contando como seguidos los que separan un espacio,
    un punto o un guion, solos o con espacios alrededor —«099 123 456», «99 123 456», «2901 2345»,
    «+598 99.123.456»—. Una fecha escrita como día, mes y año, con cualquiera de esos separadores o
    una barra («12.03.2025», «12 03 2025», «12/03/2025»), no es un teléfono. Menos de 8 dígitos no
    es un teléfono, así pasan una ruta, un kilómetro, un peso o una cantidad;
  - un **correo**: una arroba entre letras;
  - un **enlace**: una palabra que empieza con «http» o «www», o que tiene un punto seguido de
    com, uy, net u org y después el final de la palabra, una barra u otro punto —«instagram.com/luna»,
    «fb.com», «rescate.org.uy»—; «castrada.Come» no es un enlace;
  - un enlace de WhatsApp, de Telegram o de un acortador de esta lista cerrada: wa.me, t.me,
    bit.ly, tinyurl.com y linktr.ee, aunque no lleve los dígitos del número;
  - un **usuario de una red social**: una arroba al principio de una palabra, como «@luna.rescate».
  Al rechazarlo, el producto DEBE marcar el campo, no publicar ni guardar nada, dejar todo lo demás
  cargado, decir qué se encontró (un teléfono, un correo, un enlace o un usuario de una red)
  citando el fragmento exacto que lo disparó, para que la persona lo encuentre en un texto largo, y
  explicar que el contacto se da cuando se acepta una solicitud, nunca antes. Junto a la
  descripción DEBE decirse, antes de escribir, que no lleve contacto ni dirección. La regla DEBE
  aplicarse igual al publicar y al editar, y DEBE comprobarse al publicar o guardar, no solo en
  pantalla. Esta regla vale para los datos del animal; la del perfil no cambia en esta historia.

#### Publicar

- **FR-015**: Al tocar «Publicar» con todo en regla, el producto DEBE crear la publicación con todas
  sus fotos, en un solo paso que se completa entero o no se hace: nunca queda una publicación a
  medias, sin fotos o con menos fotos que las que la persona vio. Después DEBE llevar a «Mis
  animales» con el aviso «Publicado» y el animal primero, y DEBE borrar lo escrito guardado en el
  navegador.
- **FR-016**: Si falta un dato obligatorio o alguno está fuera de rango, el producto DEBE marcar
  cada campo con su problema a la vez, llevar al primero y dejar todo lo demás cargado.
- **FR-017**: Si la persona ya tiene publicado un animal de la misma especie con el mismo nombre
  —sin distinguir mayúsculas, tildes ni espacios del principio y el final—, al tocar «Publicar» el
  producto DEBE avisarlo antes de publicar y ofrecer **publicar igual** o **volver a «Mis
  animales»**; cerrar el aviso deja el formulario como estaba. Volver a «Mis animales» conserva lo
  escrito como cualquier salida (FR-024). El aviso no frena: publicar igual publica. El aviso NUNCA
  DEBE aparecer por la publicación que creó el mismo intento (FR-018).
- **FR-018**: Mientras publica, «Publicar» DEBE quedar ocupado, no admitir un segundo toque y
  mostrar cuántas fotos van subidas de cuántas. Dos toques seguidos, un reintento, o un reintento
  después de una respuesta perdida NUNCA DEBEN crear dos publicaciones del mismo intento: si la
  primera llegó, el reintento DEBE reconocerse antes que cualquier otra comprobación y terminar
  como ella, con «Publicado»: un intento publica una sola vez. Como un intento es de una sola
  pestaña, lo que manda un reintento es siempre lo mismo que se había mandado, salvo lo que la
  persona cambió después de la falla, que vale solo si el intento todavía no se publicó. Si publicar o guardar no terminó en 2 minutos, el producto DEBE
  dejar de esperar y tratarlo como que el sitio no respondió (FR-021).

#### Editar

- **FR-019**: Desde «Mis animales», tocar un animal DEBE abrirlo para editar. Todo lo publicado
  DEBE poder cambiarse, fotos incluidas —agregar, sacar, reordenar, cambiar la portada—, con las
  mismas reglas que al publicar (FR-006 a FR-011, FR-014). Al tocar «Guardar» el producto DEBE
  aplicar todos los cambios en un solo paso que se completa entero o no se hace, llevar a «Mis
  animales» con el aviso «Guardado», y dejar al animal en el mismo lugar del orden.
- **FR-020**: Una foto sacada al editar DEBE dejar de existir al guardar: no queda guardada en
  ningún lado. Si el guardado falla, no cambia nada de lo publicado. Una foto que se preparó o se
  subió para un intento o un guardado que no terminó DEBE borrarse en la primera limpieza después
  de cumplir 24 horas. Hasta que el sitio tenga una tarea diaria, esa limpieza corre cada vez que
  cualquier persona sube una foto, publica o guarda; mientras tanto, la foto no la ve nadie más y
  se va con la cuenta.
- **FR-020a**: Guardar DEBE dejar el animal exactamente como estaba en la pantalla de quien guarda.
  Si esa pantalla tiene una foto que ya no existe porque se sacó desde otra pestaña, el producto NO
  DEBE guardar nada y DEBE decir que el animal cambió en otra pestaña, con la opción de volver a
  abrirlo.

#### No perder lo cargado

- **FR-021**: Si publicar o guardar no llega porque no hay conexión o porque el sitio no respondió,
  el producto DEBE dejar todo lo cargado en pantalla, fotos incluidas, decir que no se publicó o no
  se guardó y por qué, con un mensaje distinto para cada uno de esos dos motivos, y ofrecer
  reintentar ahí mismo. Reintentar DEBE mandar lo que está en pantalla en ese momento. Nada de lo
  cargado DEBE perderse por un guardado que no llegó.
- **FR-022**: Si publicar o guardar no se hace porque la sesión venció, el producto NO DEBE ofrecer
  reintentar en el lugar: DEBE decir que hay que entrar de nuevo, que lo escrito se conserva y que
  las fotos habrá que elegirlas otra vez, con dos opciones: **entrar** —y, en el mismo navegador,
  volver al formulario con lo escrito— o **quedarse**, con todo en pantalla. Quien se queda puede
  entrar en otra pestaña y después tocar «Publicar» o «Guardar» de nuevo, que manda lo que está en
  pantalla. Al editar, al entrar vuelve lo publicado, sin los cambios (FR-025), y así lo dice el
  aviso.
- **FR-023**: Si publicar o guardar no se hace porque la persona perdió el nivel 1, el producto NO
  DEBE publicar ni guardar nada, y DEBE decir que hace falta verificar el teléfono, con dos
  opciones, como en FR-022 —el aviso mismo dice qué se pierde al irse, así que no se abre un
  segundo aviso—: **verificar**, que lleva al aviso de verificación pendiente (FR-001) y
  al terminar vuelve al formulario —con lo escrito de una publicación nueva (FR-024), sin las
  fotos; al editar, con lo publicado—, o **quedarse**, con todo en pantalla, para verificar en otra
  pestaña y volver a tocar «Publicar» o «Guardar».
- **FR-024**: Lo **escrito** y no publicado de una publicación nueva —todo menos las fotos—
  DEBE conservarse en el navegador de la persona y volver al recargar la página o al volver a
  publicar en el mismo navegador, diciendo que se recuperó y ofreciendo empezar de cero. Es de la
  cuenta que lo escribió: DEBE volver solo para esa cuenta, y si en ese navegador entra otra, DEBE
  descartarse sin mostrarse. DEBE borrarse al publicar, al empezar de cero, al cerrar sesión por
  cualquier camino, al borrar la cuenta, a los 30 días de la última vez que se escribió algo, y al
  abrir el formulario si su intento ya está publicado (Edge Cases). Lo escrito vive solo en ese
  navegador: no viaja a otro dispositivo ni se guarda en el sitio.
- **FR-025**: Los cambios sin guardar de una publicación que se está editando NO se conservan al
  recargar: al recargar vuelve lo publicado. Salir de la edición con cambios sin guardar DEBE
  avisar que se pierden y dejar elegir salir o quedarse. Salir de publicar con fotos elegidas DEBE
  avisar que las fotos se pierden y lo escrito queda.

#### Mis animales

- **FR-026**: «Mis animales» DEBE mostrar todas las publicaciones de la persona, de la más nueva a
  la más vieja según el momento en que se publicó, cada una con su portada, su nombre, su zona y la marca de
  urgente si la tiene, y la acción de publicar siempre a la vista. Sin publicaciones, DEBE mostrar
  «Todavía no publicaste ningún animal. Empezá con una foto.» con la acción de publicar. Con
  sesión, se DEBE poder llegar a «Mis animales» desde la cabecera de cualquier pantalla, junto a
  «Mi perfil». Publicar se abre desde «Mis animales»; sin sesión no hay acceso a la vista, y quien
  abre su dirección directo pasa por FR-003.

#### Baja

- **FR-027**: Borrar la cuenta (historia #9) DEBE borrar todas sus publicaciones y todas sus fotos,
  también las de un intento sin terminar —esto gana sobre las 24 horas de FR-020—, y lo escrito sin
  publicar en ese navegador. No DEBE quedar ninguna foto accesible después.

#### Medición

- **FR-028**: El producto DEBE registrar, sin nombres, descripciones, fotos ni zona: **publicación
  empezada** (al cargar el primer dato o la primera foto en un formulario vacío; un intento que
  arranca con lo escrito recuperado no la vuelve a registrar, porque sigue la misma carga),
  **publicación
  terminada** (con cuántas fotos, cuánto tardó desde que empezó el intento, y qué número de
  publicación es para esa persona —la primera, la segunda o una siguiente—, así que contar a
  quienes publican un segundo animal es contar las segundas, sin atar el momento a la persona),
  **publicación editada**, y **rechazo por contacto en
  el texto** (en qué campo y de qué tipo). El abandono entre empezar y publicar, el tiempo entre
  empezar y publicar y cuántas personas publican un segundo animal DEBEN poder calcularse con esos
  momentos. Como en la historia #10, los momentos se registran aunque todavía no se manden a
  ninguna herramienta.

### Key Entities *(include if feature involves data)*

- **Publicación**: un animal publicado. Tiene quién la publicó, la fecha de publicación, el estado
  (en esta historia, siempre disponible), los datos de la ficha de FR-009 a FR-011, la edad con el
  día desde el que avanza, y sus fotos. Pertenece a una sola persona y se borra con ella.
- **Foto de la publicación**: una imagen ya preparada, sin metadatos ni nombre original, con su
  lugar en el orden (la primera es la portada) y sus tamaños. Pertenece a una sola publicación y se
  borra con ella o al sacarla; la de un intento que no terminó se borra a las 24 horas.
- **Lo escrito sin publicar**: la copia en el navegador de lo escrito en una publicación nueva, sin
  las fotos, atada a la cuenta que lo escribió. No sale del navegador.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona que no construyó la pantalla, la primera vez que la usa y sin ayuda,
  con una cuenta sembrada con nivel 1 y 3 fotos ya en la galería de un teléfono de 390 px de
  ancho, con una conexión de 1,6 Mbps de bajada, 750 kbps de subida y 150 ms de latencia, publica
  un animal con los datos obligatorios en menos de 3 minutos, contados desde que toca publicar
  hasta que ve «Publicado». Se mide en la recorrida de Hernán al cerrar el milestone, no con un
  script; en la corrida, lo que se comprueba es que, con esa conexión, lo que el sitio tarda en
  publicar 3 fotos —sin contar el tipeo— es menos de 30 segundos.
- **SC-002**: Cada foto de 12 megapíxeles elegida está lista para publicar en menos de 5 segundos,
  con el teléfono de gama media que emula la medición de rendimiento del proyecto (procesador
  cuatro veces más lento que una computadora).
- **SC-003**: Ninguna foto guardada conserva la ubicación ni los datos de la cámara: 0 de las fotos
  de prueba sacadas con un teléfono con ubicación los traen al descargarlas.
- **SC-004**: 0 publicaciones duplicadas en las pruebas de doble toque, reintento con la conexión
  cortada y reintento después de una respuesta perdida.
- **SC-005**: 0 lecturas exitosas de una publicación o de una foto ajena en las pruebas de
  privacidad, con y sin sesión.
- **SC-006**: Después de recargar a mitad de la carga, el 100 % de lo escrito vuelve.
- **SC-007**: Después de borrar una cuenta con publicaciones, no queda ninguna publicación ni foto de
  esa persona.
- **SC-008**: En la beta —no en esta corrida—, al menos 3 rescatistas publican más de un animal
  (docs/03 §Métricas de éxito), contado con la publicación terminada de FR-028. Que lo hicieran
  «por su cuenta», sin ayuda, no lo dice ningún momento: se pregunta en la beta.

## Assumptions

- **Alcance que ya existe** (Ready): el aviso de verificación pendiente para publicar (historia
  #10) se reusa sin cambios; la regla de fotos (formatos, 10 MB, sin metadatos, orientación) sigue
  la de la foto de perfil (historia #9), con tamaños propios para fotos de animales; lo escrito que
  sobrevive a una recarga sigue el precedente del perfil. Los textos del vacío de «Mis animales» y
  del aviso «Publicado» ya existen como muestra.
- **Precedente #35** (abierto, sin mergear): la regla de conexión y lo escrito está completa en
  esta spec, así que no depende de que #35 entre antes.
- **Quién publica**: cualquier persona con nivel 1, marque o no «soy rescatista o refugio» en el
  perfil (FR-002). La historia dice «rescatista» porque es quien publica, no porque haya un rol.
- **Número perdido o cambio a medias**: la historia #25 dejó a «la historia que construya las
  publicaciones» decidir qué les pasa. En esta historia las publicaciones no las ve nadie más, así
  que siguen como están, visibles para su dueña en «Mis animales», y no se pueden editar ni sumar
  nuevas hasta volver a nivel 1. Qué ve el público de una publicación cuyo publicador perdió el
  nivel 1 lo decide la historia que las hace públicas.
- **La regla de contacto parte de la del perfil y es más estricta**: la del perfil (historia #9)
  pide 9 dígitos para que pase una localidad como «Villa 25 de Agosto»; en la descripción de un
  animal lo que tiene que frenarse incluye los fijos de 8 dígitos y el celular escrito sin el 0,
  así que el piso baja a 8 y las fechas quedan afuera por su forma. Se suman los enlaces de
  WhatsApp, Telegram y los acortadores, los dominios en cualquier lugar de la palabra, y los
  usuarios de redes sociales: la historia nombra teléfono, correo y enlace, y el usuario de una red
  («@luna.rescate») es el mismo contacto por fuera de la plataforma que la decisión quiere frenar.
  El perfil no cambia en esta historia; si conviene alinearlo, es un cambio de su propia historia.
- **Contacto disfrazado y direcciones**: la regla no persigue el número en palabras ni el correo
  con «arroba», y no detecta una dirección escrita en la descripción: no hay forma confiable de
  distinguir «vive en Rivera y Soca» de «la rescatamos en Rivera y Soca». Lo cubren el aviso junto
  a la descripción y la revisión antes de salir (historia del ciclo de vida). En esta historia
  ninguna publicación es visible para otra persona, así que no hay exposición todavía; queda
  anotado para la historia que las hace públicas (Ship, fuera de alcance).
- **Una URL firmada es un permiso por una hora**: «la dirección de una foto» en FR-005 es la
  dirección del archivo guardado, que sin permiso no se abre. Para mostrarle las fotos a su dueña,
  el sitio arma direcciones con un permiso que vence en una hora; si la dueña copia una y se la
  pasa a alguien, esa persona la ve hasta que vence. Es lo mismo que ya se aceptó para la foto de
  perfil (historia #9).
- **Lo escrito puede tener un contacto sin revisar**: la regla corre al publicar, así que lo escrito
  guardado puede tener un teléfono. Vive solo en el navegador de esa persona, atado a su cuenta y
  por 30 días como mucho: no sale del dispositivo ni lo ve otra cuenta.
- **Seguidillas de 8 o más dígitos**: se tratan como teléfono aunque sean otra cosa, como el
  número del chip o años separados solo por espacios. Es preferible un falso positivo que cita lo
  que encontró a dejar pasar un celular escrito con espacios.
- **Usuarios de redes sociales, sumados a la regla**: la decisión del product-owner nombra
  teléfono, correo y enlace; sumar «@usuario» es más estricto y no abre ningún dato. Es una
  decisión que `docs/` no cubría, y se avisa (Ship).
- **Localidad sin números de 3 dígitos**: la historia pide «nunca una dirección», y la localidad es
  texto libre; el número de puerta es lo que distingue una dirección. «Villa 25 de Agosto» y «Km
  16» pasan.
- **Lo escrito expira a los 30 días y es de la cuenta**: la historia dice cuándo se borra (publicar,
  cerrar sesión, borrar la cuenta) pero no cuánto vive si nada de eso pasa; en un navegador
  compartido con la sesión vencida quedaría para siempre. Atarlo a la cuenta evita que otra
  persona que entra en ese navegador vea lo que la anterior escribió, y 30 días alcanzan para
  retomar una carga sin guardar para siempre un texto que todavía no pasó la regla de contacto.
- **Un intento es de una pestaña**: así dos pestañas no se pisan, y una recarga después de una
  respuesta perdida no puede terminar en un «Publicado» que ignora lo que se eligió de nuevo. El
  duplicado que eso permite lo ataja el aviso de nombre repetido, que es para eso.
- **Dos minutos** para dejar de esperar un guardado: cinco fotos preparadas pesan del orden de un
  par de megas, que con señal móvil mala tardan menos de un minuto; el doble deja margen sin dejar
  a la persona mirando un botón ocupado sin final.
- **24 horas** para lo que quedó de un intento sin terminar: alcanza para que un reintento del día
  lo encuentre, y no guarda nada que ninguna publicación use. Sin una tarea diaria hasta la beta,
  la limpieza corre con las acciones de cualquier persona, y lo que quede entre una y otra no lo ve
  nadie más.
- **Lo escrito al editar**: solo lo de una publicación nueva sobrevive a una recarga (FR-024). Los
  cambios sin guardar de una edición se conservan en pantalla ante un guardado que falla (FR-021),
  pero no ante una recarga (FR-025): lo publicado ya está a salvo, y reconstruir fotos sacadas o
  agregadas después de recargar no tiene cómo hacerse sin conservar las fotos, que la historia deja
  afuera.
- **Después de guardar una edición** se vuelve a «Mis animales» con «Guardado», igual que después
  de publicar, para que las dos acciones terminen en el mismo lugar.
- **Portada y recorte**: la foto se guarda entera y se muestra con recorte centrado donde el
  sistema de diseño la recorta. Ajustar el recorte está fuera (la historia excluye recortar o
  retocar).
- **Mis animales sin paginado a la vista**: se muestran todos; cómo se traen muchos es del plan.
- **El estado «disponible»** se guarda, pero en esta historia no se muestra ni se cambia: los
  estados y su ciclo son de la historia del ciclo de vida.
- **Pantallas privadas**: publicar, editar y «Mis animales» no se indexan (docs/08 §Encontrable).
- **Medición**: los momentos se registran como en la historia #10, sin mandarse a una herramienta
  hasta M5.
