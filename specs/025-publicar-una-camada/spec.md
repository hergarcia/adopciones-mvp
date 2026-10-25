# Feature Specification: Publicar una camada: las crías de una madre en una sola publicación

**Feature Branch**: `feature/205-publicar-una-camada`

**Created**: 2026-10-25

**Status**: Draft

**Input**: Historia #205 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido**: nada de esta historia. En el sitio no existe la camada ni la cría. Esta spec se
apoya, sin rehacerlo, en lo que dejaron: #53 (publicar un animal, sus fotos preparadas sin
ubicación, la edad que avanza sola, el aviso de duplicado, lo escrito que sobrevive a una recarga y
«Mis animales»), #57 (el listado con filtros, la ficha pública, el enlace fijo, la vista previa y
«Compartir»), #59 (el ciclo de vida de una publicación y «Publicaciones por revisar»), #63 (pedir un
animal con el cuestionario y el nivel mínimo), #10 (nivel 1 y el aviso de verificación pendiente),
#13 (cuenta suspendida y bloqueo), #12 (perfil público y niveles en palabras) y #71/#169 (la
medición de publicar, ver y pedir).

**Vocabulario de esta spec**: una **camada** es una publicación que agrupa a las crías de una misma
madre, de una sola especie. Una **cría** es cada animal de una camada. Lo **común** es lo que se
carga una vez para toda la camada; lo **propio** es lo de cada cría. Un **animal suelto** es una
publicación de #53, sin camada. La **ficha de la camada** es su página pública, la que abre su
enlace. **Publicador**, **visitante**, **portada**, **zona**, **edad de hoy**, **nivel 1**,
**número a medias**, **a la vista**, **no disponible por ahora**, **no existe**, **vista previa**,
**lo cargado** y **lo escrito** significan lo mismo que en las specs de #53 y #57. Una **solicitud**
es la de #63: el pedido de adopción con el cuestionario. La historia dice «pedido»; la interfaz y
esta spec dicen «solicitud», como el glosario de docs/06. Una cría está **disponible** mientras su camada está a la vista:
en esta historia toda cría lo está, porque los estados de cada cría llegan con #206.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publicar una camada y verla en Mis animales (Priority: P1)

Una rescatista con el teléfono verificado toca «Publicar un animal» y elige «una camada». Carga lo
común una sola vez: el nombre de la camada, la especie, la edad, el tamaño de adulto, castrado,
vacunas, chip, la convivencia, la descripción, la zona (propuesta desde su perfil), urgente y de 1 a
5 fotos. Después completa las crías: arrancan dos, «Cría 1» y «Cría 2», y agrega dos más; a cada una
le pone nombre y sexo, y si quiere, una descripción propia y fotos propias. Elige el nivel mínimo y,
si quiere, desde qué fecha se entregan. Publica y ve la camada en «Mis animales» como un grupo con
sus 4 crías.

**Why this priority**: es la historia. Sin publicar la camada no hay ficha, ni tarjeta, ni solicitudes.
Le ahorra al rescatista cargar cinco fichas iguales, que es el trabajo por el que vuelve a Facebook.

**Independent Test**: con una persona sembrada con nivel 1: abre publicar, elige «una camada»,
carga lo común con 2 fotos, completa 4 crías con nombre y sexo (una con 1 foto propia) y publica.
Ve la camada en «Mis animales» como un grupo con sus 4 crías, la portada de la camada y la zona. Con
una persona sin nivel 1, publicar muestra el aviso de verificación pendiente.

**Acceptance Scenarios**:

1. **Dado** que tengo el teléfono verificado, **cuando** abro «Publicar un animal», **entonces** lo
   primero que veo es la pregunta «¿Es un animal o una camada?», y elegir «un animal» me lleva a
   publicar un animal como hasta hoy.
2. **Dado** que elijo «una camada», **cuando** se abre, **entonces** veo lo común y las crías, con
   dos crías en blanco llamadas «Cría 1» y «Cría 2», «Agregar cría», la zona de mi perfil propuesta,
   la convivencia en «no se sabe», urgente en «no», el nivel mínimo en teléfono verificado y el
   lugar de la primera foto como invitación.
3. **Dado** que cargué lo común y 4 crías con nombre y sexo, **cuando** publico, **entonces** veo
   que se publicó y la camada aparece primera en «Mis animales» como un grupo con sus 4 crías.
4. **Dado** que tengo la camada «Cría 1», «Cría 2» y «Cría 3» y quité «Cría 2», **cuando** toco
   «Agregar cría», **entonces** la nueva se propone como «Cría 2», el primer nombre «Cría N» libre.
5. **Dado** que cargué 10 crías, **cuando** intento agregar otra, **entonces** no me deja y me dice
   que una camada tiene como máximo 10.
6. **Dado** que dejé una sola cría, **cuando** intento publicar, **entonces** me dice que una camada
   lleva al menos 2 y me ofrece publicarla como un animal, con lo que ya cargué.
7. **Dado** que una cría no tiene sexo, **cuando** intento publicar, **entonces** veo marcada cuál
   falta y no se pierde nada de lo cargado.
8. **Dado** que dos crías se llaman igual, **cuando** intento publicar, **entonces** se marca cuál se
   repite y lo demás sigue cargado.
9. **Dado** que ya tengo una camada «La camada de Luna» de gatos, **cuando** publico otra de gatos con
   ese nombre, **entonces** se me avisa antes de publicar y puedo seguir igual.
10. **Dado** que pongo una fecha de entrega de ayer, **cuando** intento publicar, **entonces** se me
    dice que tiene que ser de hoy en adelante.
11. **Dado** que escribo un teléfono, un correo o un enlace en el nombre de la camada, en su
    descripción, en el nombre o en la descripción de una cría, **cuando** intento publicar,
    **entonces** ese texto se rechaza, se explica por qué y lo demás sigue cargado.
12. **Dado** que elijo una foto de más de 10 MB o un archivo que no es una foto, para la camada o
    para una cría, **cuando** se carga, **entonces** esa foto se rechaza con el motivo y las demás
    quedan.
13. **Dado** que el guardado falla por la conexión, **cuando** reintento, **entonces** nada de lo
    cargado se perdió y queda publicada una sola camada; tocar «Publicar» dos veces tampoco crea
    dos.
14. **Dado** que cargué lo común y 3 crías sin publicar, **cuando** recargo la página en el mismo
    navegador, **entonces** vuelve todo lo escrito, crías incluidas, sin las fotos.
15. **Dado** que mi sesión se cerró mientras cargaba, **cuando** intento publicar, **entonces** se me
    pide ingresar y lo escrito sigue en este navegador.
16. **Dado** que mi teléfono no está verificado, **cuando** intento publicar una camada, **entonces**
    veo el aviso de verificación pendiente, con el motivo y el camino para verificarme.
17. **Dado** que no tengo camadas, **cuando** abro «Mis animales», **entonces** no aparece ningún
    grupo de camada y mis animales sueltos se ven como siempre.

---

### User Story 2 - Abrir la ficha de la camada, pedir una cría y compartirla (Priority: P2)

Alguien ve el posteo de la camada en un grupo de Facebook, toca el enlace y, sin cuenta, ve la
ficha: lo común arriba, quién la publica y cada cría con su nombre, su sexo, su foto, su descripción
y un botón para pedirla. Toca el de «Cría 3» y empieza el cuestionario de #63 para esa cría. La
rescatista, desde «Mis animales» o desde la ficha, toca «Compartir»; la vista previa en el grupo
muestra la portada de la camada, su nombre y la zona.

**Why this priority**: es la otra mitad de la historia: el posteo del grupo tiene que llevar a una
ficha con un publicador verificado, y de ahí a una solicitud por la plataforma. Depende de que la camada
esté publicada (US1).

**Independent Test**: con una camada sembrada de 4 crías (una sin fotos propias) de un publicador con
nivel 1: abrir el enlace sin sesión y ver la ficha completa; la cría sin fotos muestra las de la
camada. Con otra persona con nivel 1, tocar el botón de una cría y llegar al cuestionario de esa cría.
Leer el enlace como lo lee WhatsApp, sin sesión y sin ejecutar nada, y encontrar la portada, el
nombre de la camada y la zona.

**Acceptance Scenarios**:

1. **Dado** que no tengo cuenta, **cuando** abro el enlace de una camada desde Facebook,
   **entonces** veo la ficha completa, sin que se me pida entrar.
2. **Dado** que abro la ficha de una camada de 4 crías, **cuando** carga, **entonces** veo arriba lo
   común (las fotos de la camada con la portada primero, el nombre, la especie, la edad de hoy, el
   tamaño, castrado, vacunas, chip, la convivencia, la descripción, la zona, la marca de urgente si
   la tiene y hace cuánto se publicó), quién la publica y las 4 crías, cada una con su nombre, su
   sexo, su foto, su descripción si tiene y un botón para pedirla.
3. **Dado** que una cría no tiene fotos propias, **cuando** abro la ficha, **entonces** esa cría
   muestra las fotos de la camada.
4. **Dado** que toco el botón de una cría, **cuando** sigo, **entonces** empiezo el cuestionario de
   #63 para esa cría, con las mismas reglas que con un animal suelto: si no ingresé, se me pide
   entrar y vuelvo a esa cría; si no tengo el nivel que pide la camada, se me dice antes del
   cuestionario.
5. **Dado** que la camada exige identidad verificada, **cuando** abro su ficha, **entonces** lo dice
   arriba, antes de tocar el botón de una cría.
6. **Dado** que la camada tiene fecha de entrega de dentro de una semana, **cuando** abro la ficha,
   **entonces** veo desde qué fecha se entregan y puedo pedir una cría igual.
7. **Dado** que la fecha de entrega ya pasó, **cuando** abro la ficha, **entonces** la ficha no la
   muestra.
8. **Dado** que abro mi propia camada, **cuando** miro sus crías, **entonces** veo «Editar» y
   ninguna cría tiene el botón para pedirla.
9. **Dado** que publiqué la camada, **cuando** toco «Compartir» y pego el enlace en un grupo,
   **entonces** la vista previa muestra la portada de la camada, su nombre y la zona.
10. **Dado** que pegué el enlace en mi grupo, **cuando** después le cambio el nombre a la camada,
    **entonces** el enlace viejo abre la misma ficha con el nombre nuevo.
11. **Dado** que cambié de número y todavía no confirmé el nuevo, **cuando** alguien abre el enlace
    de mi camada, **entonces** ve que no está disponible por ahora y el camino al listado, y la
    vista previa no lleva foto, nombre ni zona.
12. **Dado** que estoy en ese caso, **cuando** abro mi camada desde «Mis animales», **entonces** la
    veo completa con el aviso de por qué nadie más la ve y el camino para confirmar mi teléfono.
13. **Dado** que abro el enlace de una camada que no existe o cuyo publicador borró la cuenta,
    **cuando** carga, **entonces** veo que esa camada no está publicada y el camino a «Animales en
    adopción».
14. **Dado** que abro la ficha de la camada en un navegador que no ejecuta nada, **cuando** carga,
    **entonces** veo lo común, quién la publica y todas las crías.

---

### User Story 3 - Encontrar la camada en el listado como una sola tarjeta (Priority: P3)

Alguien que quiere adoptar abre «Animales en adopción» y ve la camada como una sola tarjeta, entre
los animales sueltos: la portada, el nombre de la camada, «4 crías, 4 disponibles» y la zona. Marca
«hembra» y la camada aparece porque tiene al menos una hembra disponible.

**Why this priority**: es la puerta para quien llega sin un enlace, y es lo que evita que cinco
tarjetas casi iguales tapen al resto. Se prueba sobre la ficha de US2.

**Independent Test**: con animales sueltos y dos camadas sembradas (una con dos hembras y dos
machos, otra solo con machos): abrir el listado sin sesión y ver cada camada como una tarjeta con su
recuento; el total de arriba cuenta cada camada como una. Filtrar por «hembra» y ver la primera y no
la segunda. Tocar una tarjeta y llegar a la ficha de la camada.

**Acceptance Scenarios**:

1. **Dado** que publiqué una camada de 4 crías, **cuando** abro el listado, **entonces** la veo como
   una sola tarjeta con la portada de la camada, su nombre, «4 crías, 4 disponibles» y la zona.
2. **Dado** que hay 10 animales sueltos y 2 camadas a la vista, **cuando** abro el listado,
   **entonces** el total de arriba dice 12.
3. **Dado** que filtro por «hembra», **cuando** miro, **entonces** aparece la camada que tiene al
   menos una hembra disponible, y no la que solo tiene machos.
4. **Dado** que filtro por especie, edad, tamaño, departamento o castrado, **cuando** miro,
   **entonces** la camada aparece si lo común de la camada cumple, como un animal suelto.
5. **Dado** que corrijo la zona de la camada, **cuando** guardo, **entonces** la tarjeta y la ficha
   muestran la zona nueva, para todas las crías.
6. **Dado** que toco la tarjeta de una camada, **cuando** se abre, **entonces** llego a la ficha de
   la camada.
7. **Dado** que el publicador de una camada cambió de número y no lo confirmó, o su cuenta está
   suspendida, **cuando** abro el listado, **entonces** la camada no aparece.

---

### User Story 4 - Editar la camada: corregir lo común, agregar y quitar crías (Priority: P4)

La rescatista se olvidó de una cría: abre «Editar» en su camada, la agrega y guarda; la camada pasa
a decir «5 crías». Otra vez quita una cría que ya tiene 2 solicitudes: la confirmación le dice antes
que esas 2 solicitudes se cierran.

**Why this priority**: las camadas cambian (una cría muere, otra aparece, se corrige la zona), y sin
editar habría que borrar y volver a publicar, perdiendo el enlace que ya circula. Depende de US1.

**Independent Test**: con una camada sembrada de 4 crías, una con 2 solicitudes: editar, agregar una
quinta y guardar; el listado dice «5 crías». Quitar la cría con solicitudes y ver en la confirmación
que se cierran 2 solicitudes. En una camada de dos, quitar las dos y ver el aviso de que la camada se borra.

**Acceptance Scenarios**:

1. **Dado** que se me olvidó una cría, **cuando** edito la camada, la agrego y guardo, **entonces**
   la camada pasa a decir «5 crías» en «Mis animales», en el listado y en la ficha.
2. **Dado** que quito una cría de una camada de dos, **cuando** guardo, **entonces** la camada queda
   con una.
3. **Dado** que quito la última cría, **cuando** guardo, **entonces** se me avisa que la camada se
   borra antes de confirmarlo, y si confirmo, la camada desaparece de «Mis animales», del listado y
   su enlace dice que no está publicada.
4. **Dado** que quito una cría que tiene 2 solicitudes, **cuando** guardo, **entonces** la
   confirmación me dice antes que esas 2 solicitudes se cierran, y al confirmar se cierran.
5. **Dado** que la camada tiene 10 crías, **cuando** la edito, **entonces** no puedo agregar otra.
6. **Dado** que cambio el nivel mínimo de la camada, **cuando** guardo, **entonces** vale para las
   solicitudes nuevas de cualquiera de sus crías, y las que ya estaban siguen como estaban.
7. **Dado** que mi teléfono no está verificado, **cuando** intento editar la camada, **entonces** veo
   el aviso de verificación pendiente, con el motivo y el camino para verificarme.
8. **Dado** que el guardado de una edición falla por la conexión, **cuando** reintento, **entonces**
   nada se perdió y la cría que agregué queda una sola vez.

---

### User Story 5 - Revisar una camada como una sola publicación (Priority: P5)

Quien administra abre «Publicaciones por revisar» y ve la camada recién publicada como una sola
entrada, con lo común, sus fotos y todas sus crías con las suyas. La marca revisada o la da de baja
entera con un motivo.

**Why this priority**: la revisión después de salir es lo que baja la venta o las fotos robadas en
horas (docs/03 §6); sin esto una camada esquivaría el control que tiene cualquier animal. Es lo
último porque la camada ya se ve sin esperar la revisión.

**Independent Test**: con una persona sembrada que administra y una camada recién publicada: la
camada aparece una sola vez en «Publicaciones por revisar» con todas sus crías y fotos. Marcarla
revisada la saca de la lista; editarla después la vuelve a poner. Darla de baja con un motivo la saca
del listado y el publicador lee el motivo.

**Acceptance Scenarios**:

1. **Dado** que se publicó una camada de 4 crías, **cuando** quien administra abre «Publicaciones
   por revisar», **entonces** la ve como una sola entrada, con lo común, todas las fotos, la
   descripción completa y las 4 crías con su nombre, su sexo, su descripción y sus fotos.
2. **Dado** que quien administra marca la camada revisada, **cuando** el publicador la edita o le
   agrega una cría, **entonces** la camada vuelve a la lista.
3. **Dado** que quien administra da de baja la camada con un motivo, **cuando** confirma,
   **entonces** la camada entera sale del listado, su enlace se ve como el de un animal dado de baja
   y el publicador lee el motivo en «Mis animales».

---

### Edge Cases

- **Una sola cría al publicar**: no se publica como camada; se ofrece publicarla como un animal
  suelto con lo cargado (FR-012).
- **La camada se queda con una cría al editar**: es válido; sigue siendo una camada, con su tarjeta
  «1 cría, 1 disponible» y su ficha.
- **Quitar la última cría**: borra la camada, sus crías y sus fotos, y cierra sus solicitudes, después
  de avisar y confirmar.
- **Una cría con fotos propias y otra sin**: cada una muestra las suyas; la que no tiene, las de la
  camada.
- **Nombre de cría repetido con distinta mayúscula o con espacios de más** («Cría 1» y «cría 1 »):
  se toma como repetido.
- **Nombre de camada repetido**: avisa solo contra mis camadas de la misma especie, no contra mis
  animales sueltos ni contra camadas de otras personas.
- **La fecha de entrega es hoy**: es válida; la ficha la muestra hasta el final de ese día y deja de
  mostrarla al día siguiente.
- **Editar una camada cuya fecha de entrega ya pasó**: la fecha vieja no traba el guardado; se puede
  dejar, cambiar por una de hoy en adelante o borrar.
- **Una persona pide dos crías de la misma camada**: puede, cada una con su cuestionario, como pedir
  dos animales sueltos distintos.
- **Una persona bloqueada por el publicador**: no ve la camada en el listado ni por su enlace y no
  puede pedir ninguna cría, con las mismas reglas de #13 para un animal suelto.
- **Cuenta suspendida**: su camada sale del listado y su enlace se ve como el de una camada que no
  está publicada, también en la vista previa; vuelve con el mismo enlace al reactivar (decisión
  2026-09-30 de docs/03 §3).
- **Borrar la cuenta**: borra la camada, sus crías y todas sus fotos.
- **Una cría que se quita mientras alguien la está pidiendo**: si quien publica la quita mientras
  otra persona mira la ficha o completa el cuestionario, al tocar el botón o al mandar la solicitud
  se ve que esa cría ya no está publicada, con el camino a la ficha de la camada (FR-032).
- **El listado pagina de a 24**: una camada ocupa un solo lugar, ordenada por cuándo se publicó la
  camada; agregar una cría o editar no la sube.
- **La portada del sitio** (#61) muestra los animales más recientes del listado con sus mismas
  reglas: una camada aparece ahí como su tarjeta de una.

## Pantallas

- **Publicar un animal**: arranca con «¿Es un animal o una camada?». Vacío: no aplica.
- **Publicar una camada**: dos partes, lo común y las crías. Vacío: dos crías en blanco con «Cría 1»
  y «Cría 2», «Agregar cría», la zona del perfil propuesta y el lugar de la primera foto como
  invitación. Cada cría puede quitarse.
- **Ficha de la camada**: lo común, quién la publica, la fecha de entrega si hay, el nivel que se pide
  si es identidad, «Compartir», «Editar» si es mía y la lista de crías con su botón de pedir. Vacío:
  no aplica, una camada tiene al menos una cría.
- **Camada no disponible**: la de quien no tiene hoy el teléfono verificado y la que no existe, cada
  una con su texto y el camino al listado. Vacío: no aplica.
- **Tarjeta de la camada en el listado**: una sola tarjeta con la portada, el nombre, el recuento y la
  zona. Vacío: el del listado (#57).
- **Editar la camada**: las dos partes con lo cargado. Vacío: no aplica.
- **Mis animales** (cambia, de #53): la camada como un grupo con sus crías, «Ver ficha», «Compartir» y
  «Editar». Sin camadas, no aparece ningún grupo.
- **Publicaciones por revisar** (cambia, de #59): la camada como una entrada, con sus crías. Vacío:
  el de #59.
- **Vista previa al compartir**: la portada de la camada con su nombre y la zona. Vacío: no aplica.

Cargando y error: cada pantalla nueva o cambiada tiene los mismos que su par de un animal suelto
(#53 para publicar, editar y «Mis animales»; #57 para la ficha y el listado; #59 para la revisión):
mientras carga se ve su forma sin datos, y si no se pudo traer, un aviso con «Probá de nuevo» que no
pierde lo que ya estaba en pantalla. Después de publicar se ve que se publicó, y después de guardar
una edición, que se guardó, como con un animal suelto.

## Requirements *(mandatory)*

### Functional Requirements

#### Publicar y editar

- **FR-001**: «Publicar un animal» DEBE empezar preguntando si es un animal o una camada. «Un animal»
  sigue el camino de #53 sin cambios; «una camada» abre el formulario de la camada.
- **FR-002**: Publicar y editar una camada DEBEN exigir nivel 1, como un animal suelto. Sin nivel 1 se
  ve el aviso de verificación pendiente de #10, con el motivo y el camino para verificarse; sin
  sesión, se pide ingresar.
- **FR-003**: Una camada DEBE ser de una sola especie, perro o gato.
- **FR-004**: Lo común DEBE cargarse una sola vez y valer para todas las crías: nombre de la camada,
  especie, edad aproximada, tamaño de adulto, castrado, vacunas, chip, convive con niños, con perros
  y con gatos, descripción, zona, urgente y de 1 a 5 fotos. Son obligatorios el nombre, la especie,
  la edad, el tamaño, castrado, vacunas, chip, la zona y al menos una foto. Los valores posibles son
  los de #53: la edad en meses (1 a 11) o años (1 a 25), que avanza sola; el tamaño chico, mediano o
  grande; las vacunas al día, incompletas o sin vacunar; la convivencia sí, no o no se sabe,
  arrancando en no se sabe; urgente sí o no, arrancando en no; la zona propuesta desde el perfil y
  cambiable.
- **FR-005**: El nombre de la camada DEBE ser libre, de hasta 30 caracteres, mostrarse tal cual lo
  escribió quien publica, sin palabras antepuestas por el sitio, y ofrecer un ejemplo («La camada de
  Luna»). La descripción de la camada es opcional, de hasta 2000 caracteres.
- **FR-006**: Cada cría DEBE pedir solo lo suyo: nombre (obligatorio, hasta 30 caracteres), sexo
  (obligatorio, macho o hembra), descripción propia (opcional, hasta 300) y de 0 a 5 fotos propias.
- **FR-007**: Al abrir el formulario de una camada nueva DEBEN aparecer dos crías en blanco con los
  nombres «Cría 1» y «Cría 2», cambiables. «Agregar cría» DEBE proponer el primer «Cría N» que no esté
  usado en la camada.
- **FR-008**: Dos crías de la misma camada NO DEBEN tener el mismo nombre, sin distinguir mayúsculas
  ni espacios al principio o al final. Al intentar guardar, se marca cuál se repite y lo demás sigue
  cargado.
- **FR-009**: Una camada DEBE tener de 2 a 10 crías al publicarse. Al editar puede quedar con una; no
  puede pasar de 10. «Agregar cría» con 10 crías NO DEBE agregar otra y DEBE decir que el máximo es
  10.
- **FR-010**: Ningún texto de la camada ni de sus crías (nombres y descripciones) DEBE aceptar
  teléfonos, correos, enlaces ni usuarios de redes sociales; se rechaza ese texto y se explica por
  qué, con la misma regla y el mismo texto que un animal suelto (#53).
- **FR-011**: Las fotos de la camada y de cada cría DEBEN seguir las reglas de #53: formatos comunes,
  hasta 10 MB cada una, guardadas sin la ubicación ni los datos de la cámara. Una foto rechazada se
  rechaza sola, con el motivo, y las demás quedan. En cada grupo de fotos la primera es la portada y
  se puede cambiar el orden. La portada de la camada es la foto de su tarjeta y de su vista previa.
- **FR-012**: Si al publicar queda una sola cría, el sitio NO DEBE publicar la camada; DEBE decir que
  una camada lleva al menos 2 y ofrecer publicarla como un animal suelto. Al aceptar, el formulario
  de un animal se abre con lo común, el nombre y el sexo de la cría, su descripción propia si tiene
  (si no, la de la camada) y sus fotos propias si tiene (si no, las de la camada). La fecha de
  entrega no pasa, porque un animal suelto no la tiene.
- **FR-013**: «Desde cuándo se entregan» DEBE ser opcional y, al publicar o al cambiarla, una fecha de
  hoy en adelante; una fecha pasada se rechaza diciendo que tiene que ser de hoy en adelante. Al
  editar, una fecha guardada que ya pasó no traba el guardado.
- **FR-014**: El nivel mínimo que se exige a quien pide DEBE ser de la camada y valer para todas sus
  crías, con las opciones y las reglas de #63: arranca en teléfono verificado, y cambiarlo vale para
  las solicitudes nuevas.
- **FR-015**: Si quien publica ya tiene una camada con el mismo nombre y la misma especie, el sitio
  DEBE avisarle antes de publicar otra y dejarlo seguir. Se compara solo con sus camadas, con la misma
  forma de comparar nombres que #53.
- **FR-016**: Un guardado que falla por la conexión DEBE conservar todo lo cargado en pantalla, y
  reintentar o tocar dos veces publicar NO DEBE crear dos camadas ni repetir una cría agregada.
- **FR-017**: Lo escrito y no publicado de una camada, crías incluidas y sin las fotos, DEBE
  conservarse al recargar en el mismo navegador, y borrarse al publicar, al empezar de cero, al
  cerrar sesión o al borrar la cuenta, con la misma regla que #53. Lo escrito de una camada y el de un
  animal suelto NO DEBEN pisarse.
- **FR-018**: Editar DEBE mostrar las dos partes con lo cargado y permitir cambiar lo común, cambiar
  lo propio de cada cría, agregar crías hasta 10 y quitar crías. Lo común corregido (por ejemplo, la
  zona) DEBE verse en la ficha, la tarjeta y en todas las crías al guardar.
- **FR-019**: Quitar una cría que tiene solicitudes abiertas DEBE pedir confirmación diciendo cuántas
  se cierran; al confirmar, esas solicitudes se cierran. Qué se les avisa a quienes pidieron es de #206.
- **FR-020**: Quitar la última cría DEBE avisar que la camada se borra, antes de confirmarlo; al
  confirmar se borran la camada, sus crías y sus fotos, y se cierran sus solicitudes.

#### Quién ve qué

- **FR-021**: La ficha de la camada DEBE verse sin ingresar, igual con sesión o sin ella, salvo
  «Editar» y los botones de pedir, que dependen de quién mira (FR-027).
- **FR-022**: Una camada DEBE estar a la vista, en el listado y en su ficha, solo si quien la publica
  tiene hoy nivel 1 y su cuenta no está suspendida, con las mismas reglas que un animal suelto (#57,
  #13). Si deja de tener nivel 1, la camada sale del listado y su enlace dice que no está disponible
  por ahora; vuelve sola al confirmar el teléfono. Si la cuenta está suspendida, su enlace se ve como
  el de una camada que no está publicada.
- **FR-023**: Una camada que no está a la vista NO DEBE poder leerse por ningún camino por quien no
  es su publicador: ni lo común, ni sus crías, ni sus fotos.
- **FR-024**: Quien publica DEBE ver su camada aunque no esté a la vista, en «Mis animales» y en su
  ficha, con el aviso de por qué y el camino para confirmar su teléfono.
- **FR-025**: Quien bloquea a una persona NO DEBE ver sus camadas, en el listado ni por su enlace, y
  la persona bloqueada no puede pedir sus crías, con las reglas de #13 para un animal suelto.
- **FR-026**: De quien publica, la ficha DEBE mostrar lo mismo que la ficha de un animal suelto:
  nombre, foto, si es rescatista o refugio y su nivel en palabras, con el camino a su perfil público.
  Ningún dato de contacto.

#### La ficha de la camada

- **FR-027**: La ficha DEBE mostrar lo común, quién la publica, cuántas crías tiene y la lista de
  crías con su nombre, su sexo, su foto, su descripción propia si tiene y su botón «Quiero adoptar»,
  el mismo de la ficha de un animal suelto. Quien publica ve «Editar» y ninguna cría con «Quiero
  adoptar».
- **FR-028**: Una cría sin fotos propias DEBE mostrar las fotos de la camada.
- **FR-029**: Si la camada exige identidad verificada, la ficha DEBE decirlo arriba, antes de los
  botones de las crías.
- **FR-030**: Si la camada tiene fecha de entrega y no pasó, la ficha DEBE mostrarla; desde el día
  siguiente a esa fecha, NO DEBE mostrarla. La fecha no impide pedir.
- **FR-031**: El botón de una cría DEBE llevar al cuestionario de #63 para esa cría, con las mismas
  reglas que un animal suelto: el nivel mínimo de la camada se controla antes del cuestionario, sin
  sesión se pide ingresar y se vuelve a esa cría, y no se puede pedir una cría de la propia camada.
  Cada solicitud es de una cría, no de la camada.
- **FR-032**: Si una cría ya no está publicada (se quitó), llegar a su cuestionario o mandarlo DEBE
  decir que esa cría ya no está, sin perder lo respondido en pantalla, y ofrecer el camino a la ficha
  de la camada. Nadie DEBE poder pedir una cría de una camada que no está a la vista o que fue dada
  de baja.
- **FR-033**: La ficha DEBE verse completa, con lo común, quién la publica y todas las crías, en un
  navegador que no ejecuta nada.

#### Enlace y compartir

- **FR-034**: Cada camada DEBE tener un enlace fijo que no cambia aunque se edite su nombre, sus
  fotos o sus crías. Las crías no tienen enlace propio.
- **FR-035**: «Compartir» DEBE estar en la ficha de la camada y en su grupo de «Mis animales», con la
  misma conducta que «Compartir» de un animal suelto (las opciones del teléfono; en una computadora,
  copiar y avisar).
- **FR-036**: La vista previa del enlace de una camada a la vista DEBE llevar su portada, su nombre y
  su zona. La de una camada que no está a la vista, no existe o fue dada de baja NO DEBE llevar foto,
  nombre ni zona: solo el nombre del sitio y «Animales en adopción», como un animal suelto.
- **FR-037**: El enlace de una camada que no existe o cuyo publicador borró la cuenta DEBE decir que
  esa camada no está publicada y ofrecer el camino a «Animales en adopción».

#### El listado

- **FR-038**: En el listado, cada camada a la vista DEBE ser una sola tarjeta con su portada, su
  nombre, el recuento de crías y de disponibles («5 crías, 5 disponibles»; con una, «1 cría, 1
  disponible»), la zona y la marca de urgente si la tiene. Tocarla lleva a la ficha de la camada.
- **FR-039**: Los filtros de especie, edad, tamaño, departamento y castrado DEBEN aplicarse a lo
  común de la camada, con los tramos de edad de #57 sobre la edad de hoy. El filtro de sexo DEBE
  aplicarse a las crías disponibles: la camada aparece si alguna lo cumple.
- **FR-040**: El total de arriba del listado DEBE contar cada camada como una. Una camada ocupa un
  solo lugar de cada página, ordenada con los animales sueltos por cuándo se publicó; editarla o
  agregarle crías no la sube.
- **FR-041**: La portada del sitio, que muestra los animales más recientes del listado con sus mismas
  reglas (#61), DEBE mostrar una camada como su tarjeta de una.

#### Mis animales

- **FR-042**: «Mis animales» DEBE mostrar cada camada como un grupo: su portada, su nombre, su zona,
  sus crías (nombre, sexo y foto) y las acciones «Ver ficha», «Compartir» y «Editar», junto con los
  animales sueltos. Sin camadas no aparece ningún grupo.

#### Revisión

- **FR-043**: Una camada recién publicada DEBE verse en el momento y entrar a «Publicaciones por
  revisar» como una sola entrada, con lo común, todas sus fotos, la descripción completa y todas sus
  crías con lo suyo.
- **FR-044**: Quien administra DEBE poder marcar la camada revisada o darla de baja entera con un
  motivo, con las reglas de #59. Una camada dada de baja sale del listado, su enlace se ve como el de
  un animal dado de baja, sus solicitudes abiertas siguen la regla de #59 para un animal dado de baja
  y quien la publicó lee el motivo en «Mis animales». Una baja no se deshace desde el sitio.
- **FR-045**: Si quien publica edita una camada ya revisada (lo común, lo de una cría, agregar o
  quitar crías), la camada DEBE volver a la lista.

#### Datos personales

- **FR-046**: La camada NO DEBE sumar ningún dato personal nuevo. El contacto de quien publica no es
  público, las fotos pierden la ubicación, la zona es departamento y localidad, nunca una dirección, y
  lo escrito sin publicar vive solo en el navegador.
- **FR-047**: Borrar la cuenta DEBE borrar sus camadas, sus crías y todas sus fotos.

#### Medición

- **FR-048**: Publicar una camada DEBE medirse como empezada, terminada, abandonada y editada, como un
  animal suelto (#53), con la marca de que es una camada y cuántas crías lleva.
- **FR-049**: Publicar una camada DEBE contar como una sola publicación para «más de un animal por su
  cuenta»: una camada de 5 no cumple sola la métrica.
- **FR-050**: Abrir la ficha de una camada DEBE contar como una ficha vista, con su origen (#57), y
  cada solicitud de una cría como un clic en adoptar (docs/03 §7). Los momentos de ver y de pedir
  DEBEN decir si el animal viene de una camada.

#### Lenguaje

- **FR-051**: La interfaz DEBE decir «camada» y «cría» y NO DEBE usar «cachorro» ni «gatito» para
  nombrarlas.

### Key Entities

- **Camada**: una publicación de un publicador que agrupa crías de una misma madre. Tiene lo común
  (nombre, especie, edad aproximada con la fecha a la que vale, tamaño, castrado, vacunas, chip,
  convivencia, descripción, zona, urgente), de 1 a 5 fotos ordenadas, el nivel mínimo, la fecha de
  entrega opcional, un enlace fijo, cuándo se publicó y su estado de revisión (por revisar, revisada,
  dada de baja con motivo). Se ve según el nivel 1 y la suspensión de su publicador.
- **Cría**: un animal de una camada. Tiene nombre (único dentro de la camada), sexo, descripción
  opcional y de 0 a 5 fotos ordenadas. Es lo que se pide: cada solicitud de #63 es de una cría.
- **Foto de la camada / foto de la cría**: la imagen preparada en varios tamaños y sin ubicación, con
  su orden; la primera de cada grupo es la portada.
- **Lo escrito de la camada**: la copia sin fotos que vive solo en el navegador hasta publicar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una rescatista publica una camada de 5 crías, con 3 fotos comunes y sin fotos propias,
  en menos de 6 minutos desde el teléfono, frente a cinco publicaciones sueltas.
- **SC-002**: Una camada de N crías ocupa exactamente 1 tarjeta del listado y suma exactamente 1 al
  total, para N de 1 a 10.
- **SC-003**: En el 100 % de las pruebas de visibilidad, un visitante sin sesión, una persona
  bloqueada y una persona cualquiera no leen nada de una camada que no está a la vista (lo común, sus
  crías y sus fotos), y la vista previa no lleva foto, nombre ni zona.
- **SC-004**: La portada y el nombre de la camada se ven en menos de 2,5 segundos al abrir su ficha
  desde la app de Facebook en un teléfono de gama media con 4G.
- **SC-005**: Ningún reintento por falta de conexión ni doble toque crea una segunda camada ni repite
  una cría, en el 100 % de las pruebas.
- **SC-006**: En la beta, la métrica «más de un animal por su cuenta» cuenta una camada como una sola
  publicación: una persona con una sola camada publicada no figura como quien publicó su segundo
  animal.

## Assumptions

- **Estados de cada cría fuera de esta historia**: en #205 toda cría de una camada a la vista cuenta
  como disponible, así que el recuento dice el mismo número dos veces («4 crías, 4 disponibles»).
  Pausar, en proceso, adoptado, vencimiento, renovación y borrar la camada como acción propia llegan
  con #206, y ahí aplica la regla de docs/03 §2 de que sacar algo de la vista no exige el teléfono
  verificado. Hasta entonces una camada no vence. Las dos historias llegan juntas a la beta (#76) y
  antes nadie de afuera ve el sitio.
- **Las solicitudes de una cría quedan guardadas**: dónde los ve y los responde quien publicó, y qué se
  les avisa a quienes pidieron cuando se quita una cría, es de #206. Quien pide ve su solicitud en «Mis
  solicitudes» como cualquier solicitud de #63, con el nombre de la cría.
- **Quitar crías exige nivel 1** en esta historia, porque se hace desde editar (FR-002); borrar la
  camada entera sin editar es de #206.
- **Una persona puede pedir más de una cría** de la misma camada, cada una con su cuestionario: la
  historia excluye pedir la camada entera de una vez, no pedir dos.
- **«Una cría sola» al publicar** pasa al formulario de un animal suelto con lo propio primero y lo
  común como respaldo (FR-012). Es la lectura más simple de «con lo que ya cargué».
- **La fecha de entrega** se muestra hasta el final del día que dice y se deja de mostrar desde el
  día siguiente, en hora de Uruguay.
- **Urgente se ve en la tarjeta y en la ficha** de la camada, como en un animal suelto: es parte de
  lo común, y la historia no la saca de la tarjeta.
- **El orden del listado** usa el momento en que se publicó la camada; editar no la sube, como un
  animal suelto.
- **Cuenta suspendida**: la camada sigue la decisión 2026-09-30 de docs/03 §3 para los animales, y su
  enlace se ve como uno que no está publicado. La historia nombra «no disponible por ahora» solo para
  el caso del teléfono.
- **La portada del sitio** muestra la camada como en el listado, porque su regla es mostrar los más
  recientes del listado con las mismas reglas (#61).
- **Las decisiones de la historia** (2026-10-20, con Hernán) quedan registradas en docs/03 §2, §3 y
  §Métricas de éxito, y «camada» y «cría» en el glosario de docs/06, en esta rama.
