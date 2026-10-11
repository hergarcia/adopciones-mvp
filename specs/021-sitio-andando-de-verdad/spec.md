# Feature Specification: El sitio andando de verdad en una dirección provisoria

**Feature Branch**: `feature/169-sitio-andando-direccion-provisoria`

**Created**: 2026-10-10

**Status**: Draft

**Input**: Historia #169 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`). Es la mitad «#76a» de la partición que decidió Hernán en
#77 el 2026-10-10; la otra mitad, abrir la beta, es #76.

**Ya construido** (Ready, en main): el envío del código por mensaje de texto está escrito con las
reglas de #10 (solo celulares uruguayos, topes por número y por día) y espera solo la cuenta del
servicio de mensajes, que todavía no existe y nunca se probó contra el servicio real (KL-010). Todas
las pantallas ya les dicen a buscadores y asistentes que no las guarden, y el sitio no les ofrece
ninguna, salvo a los lectores de vista previa, que entran a la portada, el listado, las fichas y las
páginas de preguntas para armar la tarjeta del enlace compartido; nada de eso depende de la
dirección en la que corre el sitio. Todo enlace que arma el sitio (fichas, Compartir, correos) sale
de una sola dirección configurable. Las tareas que el sitio hace solo ya corren en su base, cada una
con su frecuencia: vencimientos y recordatorios de las publicaciones, el vencimiento de la
verificación de identidad y su correo, el seguimiento a 30 días y el resumen de la mañana. Faltan
las limpiezas diarias de los datos de verificación del teléfono (KL-016) y de las fotos de
publicaciones sin terminar (KL-53-1), que hoy corren solo cuando alguien usa el sitio, y que el
equipo se entere cuando una tarea no corrió. Cada momento de la medición ya se emite desde un solo
lugar, que hoy lo escribe en el registro del servidor y no lo manda a ninguna herramienta. La visita
a una ficha ya dice si llegó del listado, de la portada o «de afuera»; falta la marca del enlace de
Compartir y partir «de afuera». Las pantallas de error existen; nadie se entera de un error. El
presupuesto de velocidad y las pruebas de privacidad existen y corren solo contra el sitio en local.

Esta spec suma: el sitio en la dirección provisoria, con su base propia y sin los datos sembrados;
el código saliendo de verdad; las dos limpiezas diarias y el aviso de una tarea que no corrió; la
medición llegando a su herramienta con el origen completo de cada visita a una ficha; el aviso de
cada error al equipo; y las comprobaciones de privacidad y de velocidad contra el sitio de verdad.
No suma pantallas ni cambia ningún texto que la persona ve.

**Vocabulario de esta spec**:

- **El sitio de verdad** es el sitio corriendo en el alojamiento, con su propia base, al que llega
  cualquiera que tenga la dirección. Lo opuesto es **en local**: la máquina del equipo, donde corre
  todo hasta hoy.
- **La dirección provisoria** es la única dirección del sitio de verdad hasta #76: la que da el
  alojamiento, sin dominio propio. El sitio se muestra ahí con el **nombre provisorio**, el mismo
  que en local.
- **Una dirección de prueba** es la que el alojamiento arma para ver un cambio antes de que llegue
  al sitio de verdad. Puede no existir ninguna; si existe, sigue las reglas de esta spec.
- **El equipo** es Hernán y las personas que él suma para probar, con sus cuentas propias; ninguna
  es una rescatista ni una adoptante de la beta. **La casilla del equipo** es la única a la que hoy
  le llega el correo del sitio, hasta que exista el dominio (KL-006).
- **Buscadores y asistentes** son los servicios que guardan páginas para mostrarlas o para
  responder con ellas: Google, Bing, ChatGPT, Claude, Perplexity y cualquier otro de ese tipo.
  **Los lectores de vista previa** son las aplicaciones que leen un enlace pegado para armar su
  tarjeta (WhatsApp, Facebook, Telegram, X, Slack, Discord y LinkedIn, los mismos de #57); no son
  buscadores.
- **Las tareas solas** son las que el sitio hace sin que nadie toque nada, con la frecuencia que ya
  tienen: los vencimientos y recordatorios de las publicaciones (#59) y el vencimiento de la
  verificación de identidad con su correo (#11), cada 5 minutos; el seguimiento a 30 días (#69),
  cada hora; el resumen de quien administra (#73), a las 8 de la mañana de Uruguay; y las dos
  **limpiezas**, al menos una vez por día: la de los datos de verificación del teléfono (los pedidos
  de código y su conteo de más de 24 horas y los números a medias de más de 7 días, #10, KL-016) y la
  de las fotos de publicaciones sin terminar de más de 24 horas (#53, KL-53-1). También las limpiezas
  diarias que ya corren en la base: los enlaces de renovar vencidos (#59) y los números retenidos de
  las cuentas suspendidas borradas (#13). **Una vuelta** es cada vez que una tarea corre.
- **La herramienta de medición** es el servicio de afuera al que llegan los momentos que el sitio
  ya mide (#9 a #73) y donde el equipo los lee. **El registro de errores** es el servicio de afuera
  al que llega el aviso de cada falla y que el equipo revisa. Los dos son de plan gratuito y solo
  los ven las personas del equipo.
- **Una falla** es algo del sitio o de un servicio del que depende que no anduvo: termina en la
  pantalla de error del sitio, en un mensaje de que algo no salió («No pudimos mandar el correo»,
  el código que no salió), o en una tarea que no corrió o no terminó. **No es una falla** un rechazo
  por una regla: un número que no es uruguayo, un tope alcanzado, un campo mal escrito, una sesión
  vencida, una página que no existe. En los escenarios, **un error** es una falla que la persona ve.
- **El aviso de una falla** dice **la pantalla** (cuál es, por su nombre en el sitio: «la ficha de
  un animal», «verificar teléfono»; para una tarea, «ninguna»), **el paso** (lo que se estaba
  haciendo: «pedir el código», «guardar el perfil», «abrir la pantalla»; para una tarea, su nombre),
  **la hora**, **qué falló** (la descripción técnica, sin datos de la persona) y **dónde** (el sitio
  de verdad o una dirección de prueba). Nada más.
- **Una visita** es la de la medición del sitio (#9): empieza al abrir el sitio en un navegador y
  dura mientras ese navegador queda abierto; nunca se une a la cuenta ni a otra visita. **Una visita
  a una ficha** es otra cosa: cada vez que una ficha se abre o se recarga a la vista de alguien que no
  es quien la publicó (el momento «vio una ficha», #57); pasa dentro de una visita.
- **El origen de una visita a una ficha** es uno de estos, y solo uno: **el listado**, **la
  portada**, **otra pantalla del sitio** (los tres son «el sitio»), **un enlace compartido desde el
  sitio**, **una red social**, **un buscador**, **un asistente** o **sin origen conocido**.
- **La marca de compartido** es lo que lleva el enlace que arma el botón Compartir de una ficha para
  decir que salió de ese botón. Es la misma en todos los enlaces de todas las fichas, para todas las
  personas.
- **Las comprobaciones de privacidad** son las mismas pruebas que hoy corren contra la base en
  local, que intentan leer lo que no se debe ver, corridas contra el sitio de verdad.
- **El presupuesto de velocidad** es el de docs/07, medido como mide el sitio: en un teléfono y por
  red móvil, el contenido principal se ve en menos de 2,5 s, se bajan menos de 150 KB de código para
  empezar y la medición de velocidad para teléfono da al menos 90.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El sitio de verdad en la dirección provisoria, fuera de los buscadores (Priority: P1)

Hernán abre la dirección provisoria en su teléfono, ve la portada con el nombre provisorio y el
listado sin ningún animal, entra con Google y queda en su perfil, igual que en local. Un buscador
que pasa por la dirección no se lleva nada; WhatsApp sí arma la tarjeta de una ficha. Pasa una
semana sin que nadie entre y el sitio sigue respondiendo.

**Why this priority**: todo lo demás (el código por mensaje, la medición, los errores, las
comprobaciones) pasa sobre el sitio de verdad. Sin él no hay nada que probar.

**Independent Test**: con el sitio publicado en la dirección provisoria: abrir la portada, el
listado y una página de preguntas desde un teléfono sin sesión; entrar con Google; pedir el enlace
por correo con la casilla del equipo y con otra; pedir cada pantalla como lo haría un buscador y
como un lector de vista previa; mirar los enlaces de un correo; abrir una dirección de prueba;
volver después de 8 días sin visitas.

**Acceptance Scenarios**:

1. **Dado** que alguien del equipo abre la dirección provisoria en su teléfono, **cuando** entra
   con Google, **entonces** queda adentro con su perfil, igual que en local.
2. **Dado** que el sitio de verdad acaba de arrancar, **cuando** alguien abre la portada y el
   listado, **entonces** ve el nombre provisorio y ningún animal ni persona sembrados de prueba: la
   portada y el listado muestran lo que ya muestran sin ningún animal publicado (#57, #61), hasta que
   el equipo publique.
3. **Dado** que alguien que no es del equipo llega a la dirección provisoria, **cuando** la usa,
   **entonces** mira, ingresa, se verifica y solicita como en la beta: no hay puerta, contraseña ni
   lista de espera.
4. **Dado** que el sitio manda un correo (el enlace de ingreso, un vencimiento, un aviso),
   **cuando** la casilla del equipo lo abre, **entonces** todo enlace del correo empieza con la
   dirección provisoria.
5. **Dado** que el equipo publicó un animal, **cuando** alguien toca Compartir y pega el enlace en
   un chat de WhatsApp del equipo, **entonces** el enlace empieza con la dirección provisoria y la
   tarjeta muestra la foto, el nombre del animal y la zona.
6. **Dado** que un buscador o un asistente lee cualquier página de la dirección provisoria o de una
   dirección de prueba, **cuando** la lee, **entonces** se le indica que no la guarde y el sitio no
   le ofrece ninguna página.
7. **Dado** que un lector de vista previa lee el enlace de una ficha, de la portada, del listado o
   de una página de preguntas en la dirección provisoria, **cuando** lo lee, **entonces** arma la
   tarjeta como en local.
8. **Dado** que pido el enlace de ingreso por correo con una casilla que no es la del equipo,
   **cuando** el servicio de correo lo rechaza (KL-006), **entonces** veo que no se pudo mandar y, en
   esa misma pantalla, puedo entrar con Google.
9. **Dado** que nadie entró al sitio durante 8 días, **cuando** alguien del equipo lo abre,
   **entonces** la portada abre con su contenido, sin una pantalla de error ni de espera.
10. **Dado** que abro una dirección de prueba, **cuando** la uso, **entonces** no veo ni puedo
    cambiar ninguna persona, animal ni solicitud del sitio de verdad, y no sale ningún mensaje de
    texto.

---

### User Story 2 - El código llega por mensaje de texto (Priority: P2)

Hernán, ya adentro, pide el código para su celular uruguayo. En menos de 5 minutos le llega un
mensaje de texto con el código, lo escribe y queda en nivel 1, con lo que ya puede publicar.

**Why this priority**: sin el código nadie llega al nivel 1, y sin nivel 1 no se publica ni se
solicita: es el primer paso de la verificación, el diferencial del producto.

**Independent Test**: con una cuenta del equipo en el sitio de verdad: pedir el código para un
celular uruguayo y escribirlo; pedirlo para un número de otro país; pedirlo con el tope del día
alcanzado; pedirlo con el servicio de mensajes sin responder.

**Acceptance Scenarios**:

1. **Dado** que ingresé, **cuando** pido el código para mi celular uruguayo, **entonces** me llega
   por mensaje de texto en menos de 5 minutos y, al escribirlo, quedo en nivel 1.
2. **Dado** que el mensaje llegó, **cuando** lo leo, **entonces** dice lo mismo que el mensaje que
   en local queda escrito para las pruebas, con el código.
3. **Dado** que el sitio ya mandó hoy todos los mensajes de su tope diario (#10), **cuando** alguien
   pide un código, **entonces** ve lo que #10 muestra para ese caso, no un error.
4. **Dado** que ya pedí para mi número todos los códigos que #10 permite, **cuando** pido otro,
   **entonces** veo lo que #10 muestra para ese caso y no sale ningún mensaje.
5. **Dado** que pido el código para un celular de otro país, **cuando** lo pido, **entonces** veo lo
   que #10 ya muestra para un número que no es uruguayo, y no sale ningún mensaje.
6. **Dado** que el servicio de mensajes no responde, **cuando** pido el código, **entonces** veo lo
   que #10 muestra cuando el mensaje no sale (el aviso al equipo es de US4).

---

### User Story 3 - La medición llega a su herramienta, con el origen de cada visita a una ficha (Priority: P3)

Una persona del equipo comparte una ficha con Compartir y la pega en el grupo de WhatsApp del
equipo. Otra la abre y toca «Quiero adoptar». Esa misma tarde, el equipo abre la herramienta de
medición y ve los dos pasos, con la visita contada como llegada por un enlace compartido desde el
sitio, sin nombre, correo ni teléfono. Con lo que ya emite cada historia, el equipo puede leer las
cuatro métricas de éxito.

**Why this priority**: sin la medición en su herramienta, ninguna de las cuatro métricas de docs/03
se lee, y la beta no responde la hipótesis. El origen es lo que dice si el enlace pegado en los
grupos es el que trae a quien adopta (docs/03 §3).

**Independent Test**: en el sitio de verdad: abrir una ficha con el enlace de Compartir (desde
WhatsApp, desde Facebook y copiado de la barra), escribiendo la dirección, desde el listado, desde
la portada, desde otra pantalla del sitio, desde un buscador y desde un asistente; tocar «Quiero
adoptar»; mirar la herramienta dentro de la hora; buscar en ella cualquier dato de una persona;
dejar la herramienta sin responder y usar el sitio; pegar el enlace en WhatsApp y comparar la
tarjeta y el destino con y sin la marca.

**Acceptance Scenarios**:

1. **Dado** que otra persona del equipo abrió el enlace de Compartir de una ficha y tocó «Quiero
   adoptar», **cuando** el equipo abre la herramienta de medición ese mismo día, **entonces** ve esos
   dos pasos del funnel, la visita a la ficha contada como llegada por un enlace compartido desde el
   sitio, y nada de nombre, correo ni teléfono.
2. **Dado** que alguien abre una ficha escribiendo la dirección a mano, o desde una aplicación que no
   dice de dónde viene, **cuando** el equipo mira la medición, **entonces** esa visita figura sin
   origen conocido, no como compartida desde el sitio.
3. **Dado** que alguien llega a una ficha desde el listado, desde la portada o desde otra pantalla
   del sitio, **cuando** el equipo mira la medición, **entonces** figura con ese origen.
4. **Dado** que alguien llega a una ficha desde una red social, un buscador o un asistente, sin la
   marca de compartido, **cuando** el equipo mira la medición, **entonces** figura con ese origen.
5. **Dado** que el enlace de Compartir se pegó en un grupo de Facebook, **cuando** alguien lo abre
   desde ahí, **entonces** la visita cuenta como llegada por un enlace compartido desde el sitio.
6. **Dado** que comparo el enlace de Compartir con la dirección de la ficha, **cuando** los abro o los
   pego en WhatsApp, **entonces** los dos llevan a la misma ficha y arman la misma tarjeta; el enlace
   no dice quién lo compartió ni desde qué cuenta.
7. **Dado** que la herramienta de medición no responde, **cuando** uso el sitio, **entonces** todo
   sigue funcionando igual y nada me frena ni me muestra un error.
8. **Dado** que el equipo quiere leer las cuatro métricas de éxito, **cuando** abre la herramienta,
   **entonces** tiene escrito, para cada una, qué mirar y cómo se calcula (la cuarta, en las
   opiniones de #71), y con los momentos de la beta la puede leer.
9. **Dado** que un lector de vista previa lee el enlace de una ficha, **cuando** arma la tarjeta,
   **entonces** no cuenta como una visita, como hoy.

---

### User Story 4 - El equipo se entera de cada error, sin los datos de la persona (Priority: P4)

Una persona está escribiendo una solicitud y algo del sitio falla. Ve la pantalla de error del sitio,
como hoy, con cómo volver. Sin que ella diga nada, en menos de una hora el equipo ve en el registro
de errores qué pantalla era, qué paso estaba dando y a qué hora, sin su nombre ni nada de lo que
escribió.

**Why this priority**: es lo que permite probar el sitio de verdad sin rescatistas mirando y
arreglar lo roto antes de que el primero lo encuentre. Se apoya en US1.

**Independent Test**: en el sitio de verdad, con una persona del equipo: provocar una falla en una
pantalla pública, en una con sesión con un formulario a medio escribir y en una acción; dejar el
servicio de mensajes sin responder y pedir un código; revisar el registro de errores dentro de la
hora; buscar en cada aviso cualquier dato de la persona; dejar el registro de errores sin responder
y provocar otra falla.

**Acceptance Scenarios**:

1. **Dado** que una persona del equipo provoca un error, **cuando** el equipo revisa los errores esa
   misma hora, **entonces** está ese error con la pantalla, el paso y la hora.
2. **Dado** que una persona estaba escribiendo su perfil o una solicitud cuando vio un error,
   **cuando** el equipo lee el aviso, **entonces** no aparece nada de lo que ella escribió ni sus
   datos.
3. **Dado** que una persona ve un error, **cuando** mira la pantalla, **entonces** ve la pantalla de
   error del sitio, igual que hoy, con cómo volver.
4. **Dado** que el registro de errores no responde, **cuando** veo un error, **entonces** igual veo
   la pantalla de error del sitio con cómo volver, en el mismo tiempo que con el registro andando.
5. **Dado** que el servicio de mensajes no responde, **cuando** alguien pide el código, **entonces**
   la persona ve lo que #10 muestra cuando el mensaje no sale y el equipo ve en el registro la falla,
   con la pantalla, el paso y la hora, sin el número.
6. **Dado** que alguien recibe un rechazo por una regla (un número de otro país, un tope, un campo mal
   escrito), **cuando** el equipo revisa los errores, **entonces** ese rechazo no está.
7. **Dado** que una falla pasó en una dirección de prueba, **cuando** el equipo la lee, **entonces**
   el aviso dice que pasó ahí y no en el sitio de verdad.

---

### User Story 5 - Las tareas solas corren aunque nadie use el sitio (Priority: P5)

Una publicación de prueba del equipo llega a su vencimiento un domingo en que nadie entra. El lunes
está vencida y el aviso llegó a la casilla del equipo. Esa semana nadie usa el sitio y, aun así, los
datos de verificación del teléfono y las fotos de publicaciones sin terminar se limpian cada día. Un
día las tareas no corren; al siguiente, la primera vuelta hace lo que quedó pendiente y el equipo ve
que hubo un día sin vueltas.

**Why this priority**: los vencimientos, los recordatorios y el seguimiento son promesas que el sitio
les hace a las personas, y las limpiezas son plazos de privacidad (KL-016, KL-53-1); en local corren
solo con el sitio prendido. Se apoya en US1 y, para el aviso de una tarea que no corrió, en US4.

**Independent Test**: en el sitio de verdad: dejar una publicación de prueba a punto de vencer y no
entrar hasta el día siguiente; dejar datos de verificación y fotos sin terminar de más de 24 horas y
no entrar en 8 días; detener las tareas un día y mirar qué pasa al reanudarse.

**Acceptance Scenarios**:

1. **Dado** que una publicación de prueba llega a su fecha de vencimiento un día en que nadie usa el
   sitio, **cuando** el equipo la mira al día siguiente, **entonces** está vencida y el aviso de
   vencimiento llegó a la casilla del equipo.
2. **Dado** que nadie entró al sitio durante 8 días, **cuando** alguien del equipo lo abre,
   **entonces** responde como siempre, y las limpiezas de esos 8 días corrieron: no queda ningún dato
   de verificación del teléfono ni ninguna foto de una publicación sin terminar más viejos que su
   plazo más un día.
3. **Dado** que un día las tareas no corrieron, **cuando** corren al día siguiente, **entonces** vence
   lo que debía vencer el día anterior, sale el seguimiento que quedó pendiente y el equipo ve en el
   registro de errores qué tarea estuvo sin correr y desde cuándo.
4. **Dado** que una vuelta hace lo que quedó pendiente, **cuando** termina, **entonces** nadie recibe
   dos veces el mismo correo, recordatorio o seguimiento.
5. **Dado** que un pedido de verificación de identidad cumple sus 7 días un día en que nadie usa el
   sitio, **cuando** pasan los 5 minutos de la vuelta siguiente, **entonces** vence, sus imágenes se
   borran y el correo de vencimiento sale.
6. **Dado** que son las 8 de la mañana de Uruguay y quien administra tiene algo esperando, **cuando**
   corre el resumen, **entonces** le llega, como en local.

---

### User Story 6 - Privacidad y velocidad comprobadas contra el sitio de verdad (Priority: P6)

Antes de dar la historia por terminada, el equipo corre contra el sitio de verdad las mismas
comprobaciones de privacidad que corren en local, y anota en la historia el resultado de cada regla.
Después mide la portada, el listado y una ficha en un teléfono por red móvil y anota los números.

**Why this priority**: es la garantía de que lo que se probó en local vale en el sitio al que va a
llegar la gente. Se hace al final porque mide todo lo anterior junto.

**Independent Test**: correr las comprobaciones contra el sitio de verdad, ver el resultado anotado
en la historia y que no quede ninguna persona de prueba; forzar una comprobación que falle; medir
las tres pantallas.

**Acceptance Scenarios**:

1. **Dado** que se corrieron las comprobaciones de privacidad contra el sitio de verdad, **cuando** el
   equipo lee la historia, **entonces** cada regla tiene anotado su resultado, y todas pasan.
2. **Dado** que una comprobación de privacidad falla contra el sitio de verdad, **cuando** el equipo
   la corre, **entonces** queda anotada qué regla falló y la historia no se da por terminada.
3. **Dado** que las comprobaciones crearon personas de prueba, **cuando** terminan, pasen o fallen,
   **entonces** esas personas y todo lo que crearon ya no están en el sitio de verdad.
4. **Dado** que alguien intenta ingresar al sitio de verdad con un número de teléfono, **cuando** lo
   intenta, **entonces** no puede: el teléfono no sirve para ingresar (KL-017).
5. **Dado** que una imagen de identidad se borró al resolver su pedido, **cuando** el equipo revisa
   cómo se guarda el sitio de verdad, **entonces** no hay ningún respaldo donde esa imagen sobreviva
   (KL-11-1).
6. **Dado** que la portada, el listado y una ficha se abren en un teléfono por red móvil, **cuando**
   se mide su velocidad, **entonces** cada una muestra su contenido principal en menos de 2,5 s, baja
   menos de 150 KB de código para empezar y saca al menos 90 en la medición de velocidad para
   teléfono (docs/07), y los números quedan anotados en la historia.

---

### Edge Cases

- **La marca de compartido gana**: una visita que llega con la marca cuenta como «enlace compartido
  desde el sitio» venga de donde venga (WhatsApp, un grupo de Facebook, un correo). Sin la marca, se
  mira de dónde llegó: una pantalla de este mismo sitio da el listado, la portada u otra pantalla del
  sitio; una red social, un buscador o un asistente reconocido da ese origen; cualquier otra cosa
  (nada, una aplicación que no lo dice, un sitio que no está en ninguna lista) es «sin origen
  conocido».
- **Qué se reconoce**: como mínimo, Facebook, Instagram, X, TikTok y LinkedIn son redes sociales;
  Google, Bing, DuckDuckGo y Yahoo, buscadores; ChatGPT, Claude, Perplexity, Gemini y Copilot,
  asistentes. Un sitio de otra dirección que no está en esas listas es «sin origen conocido». Del
  origen se guarda solo cuál es, nunca la dirección de la que se vino.
- **El enlace compartido que se vuelve a compartir**: quien recibió el enlace con la marca y lo copia
  de la barra para pasarlo a otro grupo pasa la marca con él; esa visita también cuenta como
  compartida desde el sitio, porque el enlace salió del botón Compartir. Escribir la dirección a mano
  no lleva la marca.
- **Recargar la ficha** cuenta como otra visita a la ficha, con el mismo origen, como hoy.
- **La marca no identifica a nadie**: es la misma para todas las fichas y todas las personas, no
  cambia con cada toque de Compartir y no lleva cuenta, visita ni fecha.
- **La marca no cambia la ficha**: la ficha que se abre, su tarjeta compartida y la dirección que la
  ficha declara como propia son las mismas con y sin la marca.
- **La medición se pierde, no frena**: si la herramienta no responde, los momentos de ese rato pueden
  perderse; ninguna pantalla ni acción espera a la herramienta ni muestra un error por ella. Lo mismo
  con el registro de errores.
- **El tope del plan gratuito**: si la herramienta o el registro llegan al tope de su plan gratuito,
  el sitio sigue igual; lo que se pase del tope se pierde hasta el período siguiente, y el equipo lo
  ve en el servicio. No se pasa a un plan pago.
- **Las pruebas no se mezclan con la beta**: lo que se mide y lo que falla en una dirección de prueba
  llega marcado como de prueba, o no llega, y nunca se cuenta con el sitio de verdad. Los momentos de
  las pruebas del equipo en el sitio de verdad quedan en la herramienta; las métricas de la beta se
  leen desde el día que abre (#76). En local no sale nada a la herramienta ni al registro, como hoy:
  las pruebas automáticas del sitio corren sin red.
- **Nada nuevo en el teléfono de la persona**: ni la medición ni el registro de errores guardan algo
  en el navegador o el teléfono de la persona además de la marca de visita que ya existe, y ninguno
  recibe la dirección de su conexión ni su ubicación.
- **Un aviso con datos adentro**: si la descripción técnica de una falla trae algo que parece un
  correo, un teléfono, un nombre, una zona, una imagen o un texto que escribió la persona, eso se
  borra antes de salir; si no se puede separar, el aviso sale sin la descripción, solo con la
  pantalla, el paso, la hora y dónde. La dirección de la pantalla no sale con sus identificadores
  (el de una ficha, una persona o una solicitud): sale el nombre de la pantalla.
- **Muchas veces la misma falla**: el registro puede juntar las repeticiones de una misma falla, pero
  cada una cuenta.
- **Una falla en una tarea**: la pantalla es «ninguna», el paso es el nombre de la tarea y no lleva
  datos de las personas que la tarea tocaba.
- **Una tarea que no corrió**: el equipo se entera cuando una tarea pasa más del doble de su
  frecuencia sin una vuelta completa (más de 10 minutos para las de cada 5, más de 2 horas para el
  seguimiento) o cuando un día no tuvo su vuelta (el resumen y las limpiezas). Se avisa una vez por
  tarea y por día, no en cada vuelta.
- **Qué hace la vuelta siguiente**: vence lo que debía vencer, manda los recordatorios, correos y
  seguimientos que quedaron pendientes, y limpia lo que pasó su plazo. El resumen de la mañana que no
  salió no se manda tarde: el del día siguiente ya junta lo que sigue esperando (KL-73-1). El correo
  de vencimiento de la identidad pendiente de más de un día se descarta como hoy (#11); las imágenes
  ya se borraron igual.
- **Dos vueltas a la vez**: si una vuelta todavía no terminó cuando arranca la siguiente, nadie recibe
  dos veces el mismo correo ni el mismo seguimiento.
- **El sitio no se duerme**: ni la base ni el sitio quedan pausados por falta de visitas; las tareas
  solas no dependen de que alguien entre.
- **La dirección de prueba**: si existe, queda fuera de buscadores, usa sus propios datos, que no son
  los del sitio de verdad, no manda mensajes de texto ni gasta el tope del sitio de verdad, y sus
  enlaces no se usan en ningún correo ni tarjeta del sitio de verdad.
- **El correo a una casilla que no es la del equipo** lo rechaza el servicio de correo hasta #76
  (KL-006): la persona ve que no se pudo mandar y tiene Google en la misma pantalla. Es una falla de
  un servicio y llega al registro, sin la casilla.
- **Quien administra en el sitio de verdad** es una persona del equipo con su cuenta propia; sin ella,
  nadie revisaría la identidad ni recibiría el resumen.
- **El tope diario de mensajes** es el del sitio de #10 (200 por día) y el tope por número el mismo;
  el gasto queda acotado por ellos (docs/07, total estimado).
- **Un número de otro país que pasara por error** tampoco recibe el mensaje: el servicio de mensajes
  solo puede mandar a Uruguay.
- **Las comprobaciones de privacidad** usan personas de prueba con casillas que no son de nadie y las
  borran al terminar, también si la corrida se corta a la mitad: la corrida siguiente borra las que
  hayan quedado antes de empezar. Ninguna persona de prueba cuenta en la medición.
- **Una comprobación no se puede correr** (el sitio no responde, falta un permiso): queda anotada como
  no corrida, no como pasada, y la historia no se da por terminada.

## Pantallas

No hay pantallas nuevas ni cambia ninguna.

- **El botón Compartir de la ficha y de «Mis animales»** (ya existe, #57): el enlace que arma lleva la
  marca de compartido; la pantalla, el botón y sus textos no cambian. Vacío: no aplica.
- **La pantalla de error del sitio** (ya existe): igual que hoy, con cómo volver; además, la falla
  llega al registro. Vacío: no aplica.
- **Entrar** (ya existe, #9): con el correo rechazado, «No pudimos mandar el correo» y el ingreso con
  Google en la misma pantalla, como hoy. Vacío: no aplica.
- **Verificar teléfono** (ya existe, #10): igual que hoy en cada caso (código enviado, tope, número de
  otro país, mensaje que no salió). Vacío: no aplica.

## Requirements *(mandatory)*

### Functional Requirements

#### El sitio de verdad

- **FR-001**: El sitio corre en una sola dirección provisoria, la del alojamiento, con el nombre
  provisorio, y todo enlace que arma (fichas, Compartir, correos, la tarjeta, los avisos) empieza con
  esa dirección.
- **FR-002**: Toda dirección del sitio, la provisoria y cada dirección de prueba, les indica a
  buscadores y asistentes en cada página que no la guarden, y no les ofrece ninguna página. Los
  lectores de vista previa siguen armando la tarjeta de la portada, el listado, las fichas y las
  páginas de preguntas, como en local.
- **FR-003**: La dirección provisoria no tiene puerta, contraseña ni lista de espera: quien llega
  mira, ingresa, se verifica y solicita como en la beta.
- **FR-004**: El ingreso con Google anda en la dirección provisoria y deja a la persona en el mismo
  lugar que en local.
- **FR-005**: El enlace de ingreso por correo sale de verdad y llega a la casilla del equipo; a
  cualquier otra, el servicio de correo lo rechaza (KL-006) y la persona ve que no se pudo mandar,
  con el ingreso con Google en la misma pantalla.
- **FR-006**: El sitio de verdad arranca sin las personas ni los animales sembrados de prueba; el
  equipo prueba con cuentas propias. Quien administra es una persona del equipo.
- **FR-007**: El sitio no se duerme: aunque nadie entre durante 8 días, la portada abre con su
  contenido y las tareas solas siguen corriendo.
- **FR-008**: Una dirección de prueba no ve ni cambia las personas, los animales, las solicitudes ni
  ningún otro dato del sitio de verdad, y no manda mensajes de texto.

#### El código por mensaje de texto

- **FR-010**: El código para verificar el teléfono sale por mensaje de texto a celulares uruguayos y
  llega en menos de 5 minutos, con el mismo texto que en local.
- **FR-011**: Valen los topes de #10: por número y del sitio por día. Con un tope alcanzado, o con un
  número de otro país, la persona ve lo que #10 muestra para ese caso y no sale ningún mensaje.
- **FR-012**: El servicio de mensajes solo puede mandar a Uruguay, aunque el sitio dejara pasar otro
  número.
- **FR-013**: Si el servicio de mensajes no responde, la persona ve lo que #10 muestra cuando el
  mensaje no sale, y la falla llega al registro de errores (FR-031).
- **FR-014**: El teléfono viaja al servicio de mensajes solo para mandar el código, como el correo ya
  viaja al servicio de correo (#9, #10). El teléfono no sirve para ingresar al sitio de verdad.

#### La medición

- **FR-020**: Los momentos que cada historia ya emite llegan a la herramienta de medición y el equipo
  los ve a más tardar una hora después; no se suma ningún momento nuevo del funnel.
- **FR-021**: Lo que llega a la herramienta no lleva nombre, correo, teléfono, zona, imágenes, lo que
  la persona escribió, la cuenta, la dirección de su conexión ni su ubicación, y no une dos visitas de
  la misma persona ni una visita con su cuenta (docs/03 §7). La marca de visita es la única que viaja,
  y muere con la visita.
- **FR-022**: Con la herramienta se leen las cuatro métricas de docs/03 §Métricas de éxito: cuántas
  personas publicaron más de un animal; qué porcentaje completa el nivel 2 cuando se lo exigen; qué
  porcentaje de solicitudes llega a aceptación y en cuánto responde quien publicó; y, la cuarta, en
  las opiniones de #71. Para cada una queda escrito qué mirar en la herramienta y cómo se calcula.
  No se construye un tablero propio.
- **FR-023**: Cada visita a una ficha lleva su origen, uno de los del vocabulario, con la regla de los
  casos borde. Del origen se guarda solo cuál es, nunca la dirección de la que se vino.
- **FR-024**: El enlace que arma el botón Compartir de una ficha (en la ficha y en «Mis animales»)
  lleva la marca de compartido. La marca no dice quién compartió ni desde qué cuenta, es la misma
  para todas, y no cambia a qué ficha lleva el enlace ni su tarjeta.
- **FR-025**: Los lectores de vista previa siguen sin contar como visitas, como hoy.
- **FR-026**: Si la herramienta de medición no responde, el sitio funciona igual: ninguna pantalla ni
  acción la espera ni muestra un error por ella.
- **FR-027**: Lo que se mide o falla en una dirección de prueba nunca se cuenta con el sitio de
  verdad, y en local no sale nada a la herramienta ni al registro (casos borde).

#### El aviso de errores

- **FR-030**: Cada falla que ve una persona (la pantalla de error del sitio, o un mensaje de que algo
  no salió) llega al registro de errores con el aviso del vocabulario: la pantalla, el paso, la hora,
  qué falló y dónde. El equipo la ve a más tardar una hora después.
- **FR-031**: También llegan, con el mismo aviso, la falla de un servicio del que depende el sitio
  (el de mensajes, el de correo) y la de una tarea sola, aunque nadie la vea en pantalla.
- **FR-032**: Un rechazo por una regla no llega al registro (vocabulario, «una falla»).
- **FR-033**: El aviso nunca lleva datos de la persona ni lo que escribió: ni nombre, correo,
  teléfono, zona, imágenes, la cuenta, la dirección de su conexión ni su ubicación. Lo que se cuele
  en la descripción técnica se borra antes de salir, según los casos borde.
- **FR-034**: La persona ve la pantalla de error del sitio, con cómo volver, igual que hoy, aunque el
  registro de errores no responda, y sin esperarlo.

#### Las tareas solas

- **FR-040**: Las tareas solas corren en el sitio de verdad con su frecuencia, aunque nadie lo use.
- **FR-041**: Las dos limpiezas corren al menos una vez por día: los datos de verificación del
  teléfono y las fotos de publicaciones sin terminar no sobreviven a su plazo más un día.
- **FR-042**: Si una tarea no corrió, la vuelta siguiente hace lo que quedó pendiente, según los casos
  borde, sin mandar nada dos veces.
- **FR-043**: Si una tarea no corrió en su plazo (casos borde), el equipo se entera por el registro de
  errores, con qué tarea y desde cuándo, una vez por tarea y por día.

#### Las comprobaciones contra el sitio de verdad

- **FR-050**: Las comprobaciones de privacidad de las historias anteriores corren contra el sitio de
  verdad, y el resultado de cada regla queda anotado en la historia: el contacto se ve solo con la
  solicitud aceptada; el teléfono nunca es público; las imágenes de identidad las ve solo quien
  revisa y se borran al resolver; el teléfono no sirve para ingresar (KL-017); y el sitio de verdad
  no guarda respaldos donde una imagen de identidad borrada sobreviva (KL-11-1).
- **FR-051**: Una regla que falla, o que no se pudo comprobar, queda anotada así, y la historia no se
  da por terminada.
- **FR-052**: Las personas de prueba que crean las comprobaciones, y todo lo que crearon, se borran al
  terminar, pasen o fallen.
- **FR-053**: El presupuesto de velocidad se comprueba en el sitio de verdad, en un teléfono y por red
  móvil, sobre la portada, el listado y una ficha, y los números quedan anotados en la historia.

#### Datos personales

- **FR-060**: Los datos de las personas del sitio de verdad (su base y sus imágenes) se guardan en un
  país que la Unidad Reguladora y de Control de Datos Personales considera con nivel adecuado de
  protección (Ley 18.331, art. 23).
- **FR-061**: Esta historia no guarda ningún dato personal nuevo: la medición, el registro de errores
  y la vuelta de una tarea no guardan nada de una persona, y ni la medición ni el registro graban lo
  que la persona hace en la pantalla.
- **FR-062**: La herramienta de medición y el registro de errores los ven solo las personas del
  equipo.

### Key Entities *(include if feature involves data)*

- **Aviso de una falla**: la pantalla, el paso, la hora, qué falló y dónde (vocabulario). No guarda
  nada de una persona.
- **Origen de una visita a una ficha**: uno de los ocho del vocabulario. Se suma al momento «vio una
  ficha» que ya existe.
- **Marca de compartido**: un único valor fijo que lleva el enlace de Compartir.
- **Vuelta de una tarea**: qué tarea, cuándo corrió y si terminó. Sirve para saber si una tarea estuvo
  sin correr; no guarda nada de las personas que tocó.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En la dirección provisoria, desde un teléfono, una persona del equipo entra con Google y
  llega a su perfil; y en 3 correos distintos del sitio y 3 enlaces de Compartir, el 100 % de los
  enlaces empieza con la dirección provisoria.
- **SC-002**: El 100 % de las páginas pedidas como buscador o asistente, en la dirección provisoria y
  en una dirección de prueba, lleva la indicación de no guardarla, y la lista de páginas que el sitio
  les ofrece está vacía; la tarjeta de WhatsApp de una ficha muestra foto, nombre y zona.
- **SC-003**: En 3 pedidos del equipo a celulares uruguayos, cada código llega en menos de 5 minutos;
  en un pedido a un número de otro país y en uno con el tope alcanzado, no sale ningún mensaje.
- **SC-004**: Una visita y un toque en «Quiero adoptar» aparecen en la herramienta de medición en
  menos de una hora, con el origen correcto; en una revisión de todo lo que llegó durante la prueba,
  0 momentos llevan un nombre, un correo, un teléfono, una cuenta o la dirección de una conexión.
- **SC-005**: En una visita por cada origen del vocabulario, el 100 % figura con su origen: la del
  enlace de Compartir como compartida desde el sitio y la de la dirección escrita a mano sin origen
  conocido.
- **SC-006**: Para cada una de las cuatro métricas de éxito existe una forma escrita de leerla en la
  herramienta (la cuarta en las opiniones), y con los momentos de la prueba del equipo da un número.
- **SC-007**: Una falla provocada aparece en el registro de errores en menos de una hora con la
  pantalla, el paso y la hora; en los avisos de toda la prueba, 0 llevan un dato de una persona o algo
  que escribió.
- **SC-008**: Con la herramienta de medición y el registro de errores sin responder, la persona no ve
  ninguna diferencia: las mismas pantallas, sin errores nuevos, dentro del presupuesto de velocidad.
- **SC-009**: Después de 8 días sin visitas, la portada abre con su contenido y cada día tuvo su
  vuelta de cada limpieza; 0 datos de verificación del teléfono y 0 fotos sin terminar más viejos que
  su plazo más un día.
- **SC-010**: Después de un día sin vueltas, la primera vuelta vence lo pendiente y manda el
  seguimiento pendiente una sola vez, y el registro de errores muestra qué tarea estuvo sin correr.
- **SC-011**: El 100 % de las reglas de privacidad de FR-050 tiene su resultado anotado en la
  historia, todas pasan, y al terminar quedan 0 personas de prueba en el sitio de verdad.
- **SC-012**: La portada, el listado y una ficha muestran su contenido principal en menos de 2,5 s,
  bajan menos de 150 KB de código para empezar y sacan al menos 90 en la medición de velocidad para
  teléfono, medidos contra el sitio de verdad, con los números anotados en la historia.

## Assumptions

- **Ya en main** (Ready): el envío del código, las reglas de #10, la indicación a buscadores y la
  excepción de los lectores de vista previa, la dirección única de los enlaces, las tareas en la base
  con su frecuencia, el punto único de la medición, el origen listado / portada / de afuera, las
  pantallas de error, el presupuesto de velocidad y las pruebas de privacidad en local. Esta spec no
  los vuelve a construir: los lleva al sitio de verdad y completa lo que falta.
- La historia tiene la etiqueta «lista», no tiene comentarios, y su cuerpo es la fuente. Las
  referencias como «docs/09 §Sin Vercel hasta el MVP» o «docs/03 §7» son a documentos del proyecto.
- **Las cuentas de los servicios** (alojamiento, base en la nube, mensajes de texto, medición,
  registro de errores) las crea o las vincula Hernán: son plata o cuentas (docs/09 §Quién decide
  qué), y el gasto ya está aprobado (#77, respuesta 4). La entrega deja todo listo para enchufarlas y
  escrito cómo ponerlo en marcha. Los criterios que necesitan el sitio de verdad (US1 a US6 en vivo)
  se comprueban cuando las cuentas existan; mientras tanto la historia queda estacionada, no
  esperando una respuesta.
- **Tamaño**: la historia junta varias piezas, pero es una sola capacidad, «el sitio andando de
  verdad», con el alcance que fijó Hernán en #77. Esta spec la parte en seis user stories, en este
  orden: el sitio (sin él no hay nada que probar), el código (primer paso de la verificación), la
  medición (el objetivo real, docs/03 §7), los errores, las tareas y las comprobaciones finales.
- **El origen «otra pantalla del sitio»** (decisión de esta spec): la historia nombra «el listado o la
  portada del sitio»; llegar a una ficha desde otra pantalla del sitio (el perfil público de quien
  publica, «Mis solicitudes», una página de preguntas) también es «el sitio», y contarla como «sin
  origen conocido» falsearía ese origen. El listado y la portada siguen separados como hoy, para no
  cambiar lo que ya miden #57 y #61.
- **La marca gana a la red social** (decisión de esta spec): el enlace de Compartir pegado en un grupo
  de Facebook cuenta como compartido desde el sitio; es lo que la decisión del 2026-10-10 manda («la
  visita que llega con ella cuenta como enlace compartido») y es justo lo que la beta tiene que medir
  (docs/03 §3).
- **Las listas de redes, buscadores y asistentes** son un mínimo (decisión de esta spec); el plan
  puede sumar otros del mismo tipo. Un sitio que no está en ninguna es «sin origen conocido», como
  pide la historia para una aplicación que no dice de dónde viene.
- **Qué es una falla y qué lleva su aviso** (decisión de esta spec): la historia pide «la pantalla, el
  paso y la hora»; se suma «qué falló», sin datos de la persona, porque sin eso no se puede arreglar,
  y «dónde», para no mezclar las pruebas con el sitio de verdad. Los rechazos por una regla no son
  fallas: llenarían el registro de cosas que el sitio hace bien.
- **El correo rechazado por KL-006 llega al registro** (decisión de esta spec): es la falla de un
  servicio, y además dice si alguien de fuera del equipo encontró la dirección provisoria.
- **Cuándo se avisa que una tarea no corrió** (decisión de esta spec): pasado el doble de su
  frecuencia o un día sin su vuelta diaria, una vez por tarea y por día. La historia dice «el equipo
  se entera» sin plazo; el doble deja pasar una vuelta perdida suelta sin ruido.
- **La dirección de prueba no toca los datos del sitio de verdad ni manda mensajes** (decisión de esta
  spec, regla de privacidad nueva): un cambio sin revisar corriendo contra las personas de verdad
  podría mostrar lo que no debe; entre dos opciones razonables, la que muestra menos (docs/09 §Quién
  decide qué, Ley 18.331). Va al aviso de la historia en Ship.
- **Nada nuevo guardado en el teléfono de la persona** (decisión de esta spec): la medición y el
  registro de errores no suman nada al navegador además de la marca de visita que ya existe; es lo
  que pide «sin unir dos visitas» y lo que guarda menos.
- **Dónde se guardan los datos** (FR-060, decisión de esta spec, regla de privacidad nueva): hasta
  hoy todo vivía en la máquina del equipo; esta historia es la primera que guarda teléfonos, correos e
  imágenes de cédulas en la nube, fuera de Uruguay. La Ley 18.331 (art. 23) solo permite llevarlos a
  un país con nivel adecuado según la Unidad Reguladora (o con un consentimiento que hoy el sitio no
  pide, y cambiar textos queda fuera de la historia). Entre las dos opciones razonables, la que cumple
  sin pedir nada más; el plan elige el lugar y dice con qué respaldo. Si el lugar que cumple la ley
  pone en riesgo el presupuesto de velocidad, gana la ley y el plan busca la velocidad por otro lado.
  Va al aviso de la historia en Ship.
- **Los momentos perdidos con la herramienta caída no se reintentan** (decisión de esta spec): la
  historia pide que nada frene a la persona; un reintento que espere la frenaría, y en una beta chica
  perder unos minutos de momentos no cambia ninguna de las cuatro métricas.
- **El resumen de la mañana que no salió no se manda tarde** (KL-73-1): el del día siguiente ya junta
  lo que sigue esperando, y mandar el de ayer duplicaría el aviso.
- **«Respaldos»** (KL-11-1): se comprueba que el sitio de verdad no guarde copias de la base donde
  sobreviva una imagen de identidad borrada; si el plan del servicio las guardara, la entrega lo dice
  y lo resuelve antes de dar la historia por terminada.
- **Decisiones del enjambre**: las siete de la historia se copian palabra por palabra a su doc en esta
  rama, como pide el aviso #170: la partición (Hernán, 2026-10-10) a docs/04 §Cuándo y cómo elegirlo;
  la dirección sin puerta (2026-10-10) a docs/04 §Cómo construir sin nombre; el gasto aprobado
  (Hernán, 2026-09-28), los avisos de error sin datos (2026-09-27) y el sitio sin los sembrados
  (2026-10-10) a docs/07; el origen de cada visita a una ficha (2026-09-27) y la marca del enlace de
  Compartir (2026-10-10) a docs/03 §7.
- **Fuera de esta historia**, como dice su alcance: el nombre, el dominio, el logo y el eslogan; el
  correo de ingreso a cualquier casilla (KL-006, #76); ofrecer algo a buscadores o asistentes; la lista
  de lanzamiento, invitar a un rescatista o compartir un enlace fuera del equipo (#76); una puerta en
  la dirección provisoria; pantallas nuevas o cambios de texto; un tablero propio; grabar lo que la
  persona hace en la pantalla; el código por WhatsApp; reintentar el correo de «perdiste tu teléfono»
  (KL-029); y cualquier plan pago.
