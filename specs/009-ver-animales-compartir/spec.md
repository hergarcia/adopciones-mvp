# Feature Specification: Ver los animales publicados con filtros y compartir la ficha de cada uno

**Feature Branch**: `feature/57-ver-animales-publicados-filtros`

**Created**: 2026-09-28

**Status**: Draft

**Input**: Historia #57 del backlog, milestone «M2 - Publicación y difusión». El cuerpo verbatim de
la historia acompaña a esta spec (`story.md`).

**Ya construido**: nada de esta historia. En el sitio no existen todavía el listado público, la
ficha pública, la vista previa al compartir ni el botón «Compartir»: hoy una publicación la ve solo
quien la publicó. Esta historia se apoya en lo que dejaron #53 (las publicaciones, sus fotos
preparadas en varios tamaños con su versión borrosa, la edad que avanza sola y «Mis animales») y
#10 (el nivel 1 y el camino para confirmar el teléfono), sin rehacerlo.

**Reanudación (2026-09-30)**: el primer intento de construcción quedó en borrador y, mientras tanto,
entró la historia #12 (aval y perfil público): ya existen el perfil público de cada persona, su
distintivo, el nivel 3 (identidad verificada y avalada) y la forma de compartir el enlace del perfil
(las opciones de compartir del teléfono; en una computadora, copiar y avisar). Esta spec se apoya en
eso sin rehacerlo: la ficha dice los tres niveles con las mismas palabras de siempre, comparte con
la misma regla que el perfil y llama a quien publica igual que su perfil público. Enlazar la ficha
al perfil público y mostrar el distintivo siguen fuera de esta historia, como dice su «No incluye».

**Vocabulario de esta spec**: una **publicación** es un animal publicado, con sus fotos y sus
datos (historia #53). La **ficha** es la página pública de una publicación: la que abre su enlace.
El **listado** es la pantalla «Animales en adopción». Quien publica es el **publicador**; quien mira
sin ser el publicador es un **visitante**, con sesión o sin ella. La **portada** es la primera foto.
La **zona** es departamento más localidad (historia #9), y se muestra «localidad, departamento»
(«Pocitos, Montevideo»), como en Mis animales. **Nivel 1**, **número a medias** y
**número perdido** significan lo mismo que en las specs de las historias #10 y #25. Una publicación
está **a la vista** cuando su publicador tiene hoy nivel 1; si no lo tiene, está **no disponible
por ahora**. «No disponible por ahora» habla de si se muestra, no del estado de la publicación
(historia #53, siempre «disponible» hasta la historia del ciclo de vida): son dos cosas distintas y
esta historia no cambia el estado. Una publicación **no existe** cuando nunca existió o se borró (por ejemplo, con la
cuenta de su publicador). La **vista previa** es la tarjeta que WhatsApp, Facebook y otras apps
arman al pegar un enlace. La **edad de hoy** es la que se muestra en la ficha y avanza sola
(historia #53, su FR-010).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir el enlace de un animal y ver su ficha sin ingresar (Priority: P1)

Alguien ve el posteo de Tobi en un grupo de Facebook, toca el enlace y, sin cuenta y sin que se le
pida nada, ve la ficha completa: todas las fotos con la portada primero, todos los datos, la zona,
hace cuánto se publicó y quién lo publica —su nombre, su foto, si es rescatista o refugio y
«Teléfono verificado»—, sin ningún dato de contacto. Si el animal no existe, o su publicador hoy no
tiene el teléfono confirmado, ve una pantalla que lo dice y el camino a «Animales en adopción».

**Why this priority**: es el mecanismo de crecimiento de la historia: el posteo de siempre tiene
que llevar a una ficha completa con un publicador verificado detrás. Sin la ficha, compartir y
listar no tienen a dónde llevar.

**Independent Test**: con una persona sembrada con nivel 1 y un animal publicado con 3 fotos:
abrir su enlace en un navegador sin sesión y ver la ficha con las 3 fotos (la portada primero),
todos los datos, «Teléfono verificado» y ningún teléfono, correo ni zona del publicador. Abrir un
enlace inventado: ver «no está publicado» con el camino al listado. Dejar al publicador sin nivel 1:
el mismo enlace dice «no disponible por ahora».

**Acceptance Scenarios**:

1. **Dado** que no tengo cuenta, **cuando** abro el enlace de Tobi desde Facebook, **entonces** veo
   su ficha completa sin que se me pida entrar, con el nombre y la foto de quien lo publicó y
   «Teléfono verificado».
2. **Dado** que abro la ficha de un animal, **cuando** carga, **entonces** veo todas sus fotos con
   la portada primero y en el orden que eligió el publicador, y su nombre, especie, sexo, edad de
   hoy, tamaño, castrado, vacunas, chip, convivencia con niños, perros y gatos (sí, no o no se
   sabe), la descripción, la zona, la marca de urgente si la tiene y hace cuánto se publicó.
3. **Dado** que abro la ficha con sesión, siendo otra persona que el publicador, **cuando** carga,
   **entonces** la veo exactamente igual que sin sesión, sin «Editar».
4. **Dado** que ingresé y publiqué a Tobi, **cuando** abro su ficha, **entonces** veo «Editar», que
   me lleva a editarlo.
5. **Dado** que la descripción está vacía, **cuando** abro la ficha, **entonces** la ficha se ve
   completa, sin un hueco en su lugar.
6. **Dado** que una foto de la ficha no carga, **cuando** abro la ficha, **entonces** veo su lugar
   con el color borroso de esa foto y el resto de la ficha funciona.
7. **Dado** que abro un enlace de ficha que no existe o cuyo publicador borró la cuenta, **cuando**
   carga, **entonces** veo que ese animal no está publicado y el camino a «Animales en adopción».
8. **Dado** que el publicador cambió de número y todavía no confirmó el nuevo, **cuando** alguien
   abre el enlace de su animal, **entonces** ve que el animal no está disponible por ahora y el
   camino al listado, y ningún dato del animal ni del publicador.
9. **Dado** que ese publicador confirma su número nuevo, **cuando** alguien vuelve a abrir el mismo
   enlace, **entonces** ve la ficha, sin que el publicador tenga que hacer nada más.
10. **Dado** que abro el enlace de una ficha desde la app de Facebook, en un teléfono de gama media
    con 4G, **cuando** carga, **entonces** la foto de portada y el nombre del animal se ven en menos
    de 2,5 segundos.
11. **Dado** que abro la ficha en un navegador que no ejecuta nada, **cuando** carga, **entonces**
    veo todas las fotos, todos los datos y quién lo publica.

---

### User Story 2 - Compartir el enlace con una vista previa que muestra al animal (Priority: P2)

La rescatista toca «Compartir» en Mis animales o en la ficha, elige WhatsApp en las opciones del
teléfono y lo manda a su grupo. La vista previa muestra la foto de portada de Tobi, su nombre y su
zona. En una computadora, «Compartir» copia el enlace y dice «Enlace copiado». El enlace es corto,
no dice nada de quien lo comparte y no cambia nunca, aunque después le cambie el nombre o las fotos.

**Why this priority**: es lo que le ahorra trabajo al rescatista frente a subir las fotos al grupo;
sin una vista previa que muestre al animal, el enlace no se usa. Depende de que la ficha exista.

**Independent Test**: sobre un animal publicado (US1): tocar «Compartir» en Mis animales en un
teléfono y ver las opciones de compartir del teléfono con el enlace; tocarlo en una computadora y
ver «Enlace copiado». Leer ese enlace como lo lee WhatsApp —sin ejecutar nada ni tener sesión— y
encontrar la foto de portada, el nombre y la zona. Cambiarle el nombre y la portada y ver que el
mismo enlace abre la misma ficha y ofrece la portada nueva.

**Acceptance Scenarios**:

1. **Dado** que publiqué a Tobi, **cuando** toco «Compartir» en Mis animales y pego el enlace en un
   grupo de WhatsApp, **entonces** la vista previa muestra la foto de portada de Tobi, su nombre y
   su zona.
2. **Dado** que abro la ficha en un teléfono, **cuando** toco «Compartir», **entonces** se abren
   las opciones de compartir del teléfono con el enlace de la ficha.
3. **Dado** que abro la ficha en una computadora, **cuando** toco «Compartir», **entonces** el
   enlace queda copiado y veo «Enlace copiado».
4. **Dado** que pegué el enlace de Luna en mi grupo, **cuando** después le cambio el nombre a
   «Lunita», **entonces** el enlace viejo abre la ficha de Lunita.
5. **Dado** que cambio la portada de un animal, **cuando** alguien pega su enlace por primera vez,
   **entonces** lo que el sitio ofrece para armar la vista previa es la portada nueva.
6. **Dado** que el animal no está disponible por ahora o no existe, **cuando** alguien pega su
   enlace en WhatsApp, **entonces** la vista previa muestra el nombre del sitio y «Animales en
   adopción», sin la foto, el nombre ni la zona del animal.
7. **Dado** que tengo animales publicados, **cuando** abro Mis animales, **entonces** cada uno
   tiene «Ver ficha», que abre su ficha, y «Compartir», además del camino a editarlo que ya tenía.
8. **Dado** que se abren las opciones de compartir, **cuando** las cierro sin elegir nada,
   **entonces** no pasa nada más y no veo ningún error.

---

### User Story 3 - Recorrer los animales en adopción con filtros (Priority: P3)

Alguien que quiere adoptar abre «Animales en adopción», sin cuenta, y ve todos los animales a la
vista, del más reciente al más viejo, de a 24. Marca «gato», «cachorro» y «Canelones» y ve cuántos
son; copia el enlace con esos filtros y lo abre en otro teléfono con el mismo resultado. Toca «Ver
más», abre un animal y, al volver atrás, el listado está como lo dejó.

**Why this priority**: es la otra puerta de entrada a las fichas, para quien llega sin un enlace
concreto; se prueba sobre las fichas de US1 y comparte el enlace como en US2.

**Independent Test**: con 30 animales sembrados a la vista y distintos en especie, sexo, tamaño,
edad, departamento y castrado: abrir el listado sin sesión y ver 24, «Ver más» y el total; tocar
«Ver más» y ver los 6 restantes sin repetidos; marcar filtros y ver solo los que cumplen, con el
total; copiar el enlace, abrirlo en otro navegador y ver lo mismo; abrir una ficha y volver atrás.

**Acceptance Scenarios**:

1. **Dado** que abro Animales en adopción, **cuando** marco «gato», «cachorro» y «Canelones»,
   **entonces** veo solo los gatos de menos de 1 año de Canelones, del más reciente al más viejo, y
   arriba cuántos son.
2. **Dado** que hay 30 animales a la vista, **cuando** abro el listado, **entonces** veo 24 y «Ver
   más»; al tocarlo aparecen los 6 que faltan y «Ver más» desaparece.
3. **Dado** que marco «chico» y «mediano» en tamaño y «perro» en especie, **cuando** se actualiza,
   **entonces** veo los perros chicos y los medianos, y ningún gato.
4. **Dado** que un cachorro se publicó con 11 meses, **cuando** pasa un mes, **entonces** sale del
   filtro «cachorro» y entra en «joven».
5. **Dado** que marqué filtros, **cuando** copio el enlace del listado y lo abro en otro teléfono,
   **entonces** veo los mismos filtros y los mismos animales.
6. **Dado** que filtré, toqué «Ver más» y abrí un animal del listado, **cuando** vuelvo atrás,
   **entonces** el listado sigue con los mismos filtros, los animales que ya había cargado y en el
   mismo lugar donde estaba.
7. **Dado** que vi los primeros 24 animales y alguien publica uno nuevo, **cuando** toco «Ver más»,
   **entonces** veo los siguientes sin ninguno repetido y sin que falte ninguno de los que ya
   estaban.
8. **Dado** que abro un enlace de listado con un filtro que no existe (una especie inventada),
   **cuando** carga, **entonces** ese filtro se ignora y veo el listado con el resto.
9. **Dado** que no hay conexión, **cuando** toco «Ver más», **entonces** los animales que ya veía
   siguen ahí, se me dice que no se pudo cargar por la conexión y puedo reintentar.
10. **Dado** que no hay ningún animal a la vista, **cuando** abro el listado, **entonces** veo
    «Todavía no hay animales publicados.».
11. **Dado** que ningún animal cumple los filtros, **cuando** se actualiza, **entonces** veo «No hay
    animales con estos filtros.» con la acción de sacar los filtros, que deja el listado sin
    ninguno.
12. **Dado** que abro el listado en un navegador que no ejecuta nada, **cuando** marco filtros y los
    aplico, y después toco «Ver más», **entonces** veo los animales que cumplen y los siguientes.

---

### User Story 4 - El publicador que perdió el teléfono verificado sabe qué pasa con sus animales (Priority: P4)

Un rescatista cambió de chip y todavía no confirmó el número nuevo. Sus animales salieron del
listado y sus enlaces dicen «no disponible por ahora». En Mis animales ve por qué y el camino para
confirmar su teléfono; al abrir la ficha de uno de sus animales la ve completa, con el aviso de que
nadie más la ve hasta que confirme. Al confirmar, todo vuelve solo.

**Why this priority**: es un caso raro, pero sin esto el rescatista ve su propio animal «no
disponible» y no sabe que el enlace que pegó va a volver. Se construye sobre la regla de US1 y las
pantallas de US2 y US3.

**Independent Test**: con una persona sembrada con un animal publicado y un número a medias: su
animal no está en el listado y su enlace dice «no disponible por ahora» a otra persona; ella ve el
aviso en Mis animales y su ficha con el aviso y el camino a confirmar. Al confirmar el número, el
animal vuelve al listado y el enlace abre la ficha.

**Acceptance Scenarios**:

1. **Dado** que cambié de número y todavía no confirmé el nuevo, **cuando** abro la ficha de mi
   animal desde Mis animales, **entonces** la veo con el aviso de que nadie más la ve hasta que
   confirme, y el camino para confirmarlo.
2. **Dado** que cambié de número y todavía no confirmé el nuevo, **cuando** abro Mis animales,
   **entonces** veo el aviso de que mis animales no se ven mientras el teléfono no esté confirmado,
   con el camino para confirmarlo.
3. **Dado** que perdí el número porque otra cuenta lo verificó, **cuando** abro Mis animales o la
   ficha de mis animales, **entonces** veo el mismo aviso y el mismo camino.
4. **Dado** que el publicador no tiene hoy el teléfono verificado, **cuando** alguien abre el
   listado, **entonces** sus animales no aparecen, ni en el total.
5. **Dado** que el publicador confirma su número, **cuando** alguien abre el listado, **entonces**
   sus animales vuelven a aparecer en el lugar que les toca por fecha de publicación.

---

### Edge Cases

- **Publicaciones con la misma fecha de publicación**: el orden entre ellas es siempre el mismo, así
  que «Ver más» no repite ni saltea ninguna.
- **Un animal que deja de estar a la vista mientras se mira el listado** (su publicador perdió el
  nivel 1 o borró la cuenta): «Ver más» no lo trae si todavía no había aparecido; si ya se veía,
  sigue en pantalla hasta recargar, y al abrirlo la ficha dice que no está disponible o que no
  está publicado. Ninguno de los demás se repite ni falta.
- **Un animal publicado mientras se mira el listado**: no aparece al tocar «Ver más»; aparece al
  recargar o al abrir el listado de nuevo, arriba de todo.
- **«Ver más» con el último grupo exacto**: con 24 animales a la vista, no aparece «Ver más»; con 48,
  aparece una vez y después desaparece.
- **Edad en el borde de un tramo**: la edad que cuenta es la edad de hoy de la ficha. 11 meses es
  cachorro; 12 meses es 1 año y es joven; 2 años es joven; 3 años es adulto; 7 años es adulto; 8
  años es mayor. Un animal cambia de tramo el mismo día en que su ficha muestra la edad nueva.
- **Filtros repetidos o mezclados en el enlace**: una opción repetida cuenta una vez; una opción
  que no existe en un filtro se ignora y las demás de ese filtro valen; un filtro que no existe se
  ignora. Si no queda ninguna opción válida en ningún filtro, es el listado sin filtros. El orden
  en que vengan en el enlace no cambia el resultado.
- **Castrado**: la única opción es «sí». Marcarla deja solo los castrados; sin marcarla, entran los
  castrados y los que no.
- **Marcar todas las opciones de un filtro de varias opciones** (especie, sexo, tamaño, edad,
  departamento): da lo mismo que no marcar ninguna. No vale para castrado, que tiene una sola.
- **Enlace del listado copiado después de «Ver más»**: siempre arranca por el más reciente con los
  filtros puestos; nunca por la mitad. Si al copiarlo se habían cargado más de 24, el enlace lo
  dice y al abrirlo muestra esa misma cantidad desde el principio (48, 72…), hasta 240 como mucho.
  Una cantidad que no es 48, 72… hasta 240 (negativa, con letras, de más, que no es de a 24) se
  ignora y muestra los primeros 24.
- **Volver atrás a un listado cuya página se descartó** (el teléfono liberó memoria): el listado
  vuelve con los mismos filtros y, como mínimo, con los primeros 24; si no puede reponer los que se
  habían cargado con «Ver más», los muestra desde el principio, nunca con repetidos.
- **Enlace de ficha cuyo código fue cambiado** (una letra de más, de menos o distinta): es un
  animal que no existe.
- **Enlace con agregados de otras apps** (la marca de clic que Facebook suma a todo enlace, u otros
  agregados que no son del sitio): la ficha o el listado abren igual, como si no estuvieran, y lo que
  la persona comparte desde el sitio —«Compartir», o la dirección del listado— no los lleva.
- **Foto de portada que no carga en la vista previa**: WhatsApp o Facebook muestran la tarjeta sin
  la foto; la ficha no cambia.
- **Vista previa ya armada**: si el publicador cambia la portada o el nombre, WhatsApp y Facebook
  pueden seguir mostrando la vista previa vieja de un posteo ya hecho; eso lo decide cada app. Lo
  que el sitio ofrece desde el cambio es lo nuevo.
- **Un animal que pasa a no disponible después de compartido**: los posteos ya hechos conservan la
  vista previa que la app ya armó; al abrir el enlace, la ficha dice que no está disponible por
  ahora, y lo que el sitio ofrece para una vista previa nueva es solo el nombre del sitio y
  «Animales en adopción».
- **Compartir sin poder copiar** (el navegador no deja escribir en el portapapeles): se muestra el
  enlace seleccionado para copiarlo a mano, con el texto de que no se pudo copiar solo.
- **Compartir en un navegador que no ejecuta nada**: «Compartir» no aparece; el enlace de la barra
  de direcciones es el mismo que compartiría.
- **Tocar «Compartir» varias veces seguidas**: no abre dos veces las opciones de compartir ni apila
  varios «Enlace copiado».
- **La ficha de un animal propio vista con sesión de otra cuenta en el mismo teléfono**: se ve como
  la ve cualquier visitante, sin «Editar».
- **El publicador sin foto de perfil**: en su lugar va la inicial de su nombre, sin hueco.
- **El publicador que no se marcó como rescatista o refugio**: no se dice nada de eso; nunca «no es
  rescatista».
- **Un animal propio cuyo enlace el publicador abre sin sesión** (por ejemplo, desde el navegador
  de la app de Facebook, que no tiene su sesión) mientras no tiene nivel 1: ve «no disponible por
  ahora» como cualquiera, y esa pantalla ofrece también entrar, para quien sea el publicador; al
  entrar vuelve a la ficha y la ve con su aviso (FR-020).
- **El publicador con la identidad verificada (nivel 2, historia #11)**: su nivel se dice
  «Identidad verificada», que ya incluye el teléfono. Con un aval que cuenta (nivel 3, historia
  #12), «Identidad verificada y avalada»; si el aval deja de contar, vuelve a decir «Identidad
  verificada» la próxima vez que se abre la ficha. Si tiene la identidad verificada pero hoy no
  el teléfono, el animal no está a la vista, igual que cualquier otro.
- **Un animal con una sola foto**: la ficha muestra esa foto y no ofrece pasar a otra.
- **Nombres y descripciones largos** (30 y 2000 caracteres, historia #53): se muestran enteros en la
  ficha; en el listado el nombre se muestra entero, sin cortar, en los renglones que haga falta.
- **Hace cuánto se publicó**: contando días de calendario de Uruguay desde el día en que se
  publicó, «Publicado hoy» el mismo día, «Publicado ayer» al día siguiente, «Publicado hace N días»
  del día 2 al 13, «Publicado hace N semanas» del día 14 al 59 (N son las semanas enteras: los días
  divididos por 7, hacia abajo), y «Publicado hace N meses» desde el día 60 (N son los días
  divididos por 30, hacia abajo; el día 60 es «hace 2 meses»). Editar no cambia la fecha de publicación (historia #53).
- **Un visitante que abre muchas fichas**: no hay tope ni se le pide entrar.
- **El publicador borra la cuenta mientras alguien tiene su ficha abierta**: lo que ya está en
  pantalla queda hasta recargar; recargar dice que el animal no está publicado, y las fotos dejan
  de poder abrirse (FR-018).

## Pantallas

Cada pantalla, con su estado vacío, su estado mientras carga y su estado de error. Ninguna aparece
en buscadores hasta que exista el dominio definitivo (FR-024), pero todas se leen sin ejecutar nada.

- **Animales en adopción** (el listado).
  - *Con animales*: los filtros arriba, cuántos animales hay con los filtros puestos, los animales
    en grilla —cada uno con su portada, su nombre, su edad de hoy, su zona y la marca de urgente si
    la tiene—, y «Ver más» al final si quedan más. Tocar un animal abre su ficha.
  - *Vacío sin filtros*: «Todavía no hay animales publicados.».
  - *Vacío con filtros*: «No hay animales con estos filtros.», con la acción de sacar los filtros.
  - *Cargando*: al abrirlo, la forma de la grilla con el lugar de cada portada, nombre y zona; al
    cambiar un filtro, los animales de antes quedan hasta que llegan los nuevos, con una señal de
    que se está actualizando; al tocar «Ver más», el botón queda ocupado y no admite un segundo
    toque.
  - *Error*: si no se pudo traer el listado al abrirlo, se dice que no se pudo y se ofrece
    reintentar, con los filtros a la vista. Si falla «Ver más» o un cambio de filtro, lo que se veía
    queda en pantalla, se dice por qué —sin conexión o el sitio no respondió— y se ofrece reintentar.
    Si falla un cambio de filtro, las marcas quedan como la persona las dejó, se dice que los
    animales a la vista son de los filtros anteriores, y reintentar pide lo marcado.
  - *Cambios seguidos*: la grilla, el total y el enlace corresponden siempre a lo último que se
    marcó; lo que llega de un cambio anterior se descarta. Cambiar un filtro cancela un «Ver más» en
    curso.
- **Ficha de un animal**.
  - *Con datos*: las fotos (la portada primero), los datos de FR-006, quién lo publica (FR-007) y
    «Compartir»; «Editar» si la ve su publicador con sesión y nivel 1; y, si su publicador hoy no
    tiene nivel 1 y es él quien la mira, en lugar de «Editar», el aviso de que nadie más la ve y el
    camino para confirmar el teléfono.
  - *Vacío*: no aplica: una ficha tiene al menos una foto y los datos obligatorios de #53. La
    descripción vacía no deja hueco.
  - *Cargando*: la portada y el nombre son lo primero que se ve; cada foto ocupa su lugar con su
    versión borrosa mientras carga.
  - *Error*: una foto que no carga queda con su color borroso y el resto funciona. Si la ficha no
    se pudo traer (el sitio no respondió), se dice que no se pudo cargar y se ofrece reintentar y
    el camino al listado; nunca se muestra como «no está publicado» algo que solo falló.
- **Animal no disponible por ahora**: el de un publicador que hoy no tiene nivel 1, visto por
  cualquiera que no sea él. Dice que el animal no está disponible por ahora y ofrece el camino a
  «Animales en adopción»; sin sesión, ofrece además entrar, por si quien mira es el publicador, y
  al entrar vuelve a ese mismo enlace. No muestra foto, nombre, zona ni nada del publicador. Vacío: no aplica,
  porque la pantalla es un mensaje fijo sin datos que puedan faltar. Cargando y error: los de la
  ficha.
- **Animal no publicado**: el de un enlace que no existe o cuyo publicador borró la cuenta. Dice que
  ese animal no está publicado y ofrece el camino a «Animales en adopción». Vacío: no aplica, por
  la misma razón. Cargando y error: los de la ficha.
- **Mis animales** (cambia, de #53). Cada animal suma «Ver ficha» y «Compartir» y conserva el camino
  a editarlo. Si el publicador hoy no tiene nivel 1, arriba de la lista va el aviso de que sus
  animales no se ven mientras el teléfono no esté confirmado, con el camino para confirmarlo.
  Vacío, cargando y error: los de #53.
- **Compartir** (en la ficha y en cada animal de Mis animales). En un teléfono o una tableta abre
  sus opciones de compartir; en una computadora copia el enlace y muestra «Enlace copiado». Vacío: no aplica: es
  una acción sobre un animal que ya existe. Cargando: no aplica, abrir las opciones o copiar es
  inmediato. Error: si no se pudo copiar, muestra el enlace para copiarlo a mano.
- **Vista previa al compartir**: una imagen con la foto de portada entera y, al lado de la foto, el
  nombre y la zona del animal, como en un cartel; y, como texto de la tarjeta, «<nombre> en adopción» y la
  zona. De un animal
  no disponible o que no existe, y del listado: el nombre del sitio y «Animales en adopción».
  Vacío: no aplica: un animal a la vista siempre tiene portada, nombre y zona (historia #53).

## Requirements *(mandatory)*

### Functional Requirements

#### Quién ve qué

- **FR-001**: El listado y las fichas DEBEN verse sin ingresar, y verse igual con sesión o sin ella,
  salvo lo que esta spec le suma solo al publicador de cada animal («Editar» y el aviso de FR-020)
  y el acceso a entrar que ofrece la pantalla «no disponible por ahora» a quien no tiene sesión.
  Mirar nunca DEBE pedir entrar.
- **FR-002**: Una publicación DEBE estar a la vista solo si su publicador tiene hoy nivel 1. Si deja
  de tenerlo (número a medias o número perdido), sus publicaciones DEBEN salir del listado y de su
  total, y su enlace DEBE mostrar «no disponible por ahora», en el mismo momento en que pierde el
  nivel 1. Al recuperarlo, DEBEN volver solas, en el lugar que les toca por su fecha de
  publicación, sin que el publicador haga nada más.
- **FR-003**: Una publicación que no está a la vista NO DEBE poder leerse por ningún camino por
  quien no es su publicador: ni sus datos, ni sus fotos, ni su vista previa, con sesión o sin ella,
  ni conociendo o adivinando la dirección de su ficha o de una foto. La única excepción es la de
  FR-018: una dirección de foto obtenida mientras la publicación estaba a la vista puede seguir
  abriendo hasta que vence, como mucho una hora después. Cada una de estas
  reglas DEBE poder demostrarse con un intento fallido de lectura desde una persona sin sesión y
  desde otra persona con sesión.
- **FR-004**: De quien publica, a cualquiera DEBEN mostrarse solo el nombre y la foto de su perfil,
  si se marcó como rescatista o refugio, y su nivel de verificación en palabras, y solo como parte
  de la ficha de una publicación suya que está a la vista. De una persona que no tiene ninguna
  publicación a la vista (nunca publicó, o hoy no tiene nivel 1, o borró su cuenta) nadie más DEBE
  poder leer nada, como hasta ahora (historia #9): ni su nombre, ni su foto, ni su marca, por
  ningún camino, con sesión o sin ella. La foto de perfil sigue la misma regla que las fotos del
  animal (FR-018): una dirección ya obtenida puede seguir abriendo como mucho una hora. NUNCA DEBEN
  mostrarse —ni en la pantalla, ni en lo que el sitio entrega para armarla o para la vista previa—
  su teléfono, su correo, su zona, su fecha de alta ni ningún otro dato suyo: el contacto se da
  cuando se acepta una solicitud (M3).
- **FR-005**: Nadie DEBE poder cambiar una publicación desde la ficha: «Editar» lleva a la edición
  de #53, con sus reglas (nivel 1, dueño, aviso de verificación pendiente), y solo lo ve el
  publicador con sesión y nivel 1 (FR-008).

#### La ficha

- **FR-006**: La ficha DEBE mostrar todas las fotos, la portada primero y las demás en el orden que
  eligió el publicador; y el nombre, la especie, el sexo, la edad de hoy, el tamaño, castrado,
  vacunas, chip, la convivencia con niños, con perros y con gatos (sí, no o no se sabe), la
  descripción si la tiene, la zona («localidad, departamento»), la marca de urgente si la tiene, y
  hace cuánto se publicó (Edge Cases). Una descripción vacía NO DEBE dejar un hueco. Cada foto
  DEBE ocupar su lugar con su versión borrosa mientras carga o si no carga.
- **FR-007**: La ficha DEBE mostrar quién publica: su nombre, su foto de perfil (o su inicial si no
  tiene), «Rescatista o refugio» si se marcó así en su perfil —la misma etiqueta que su perfil
  público—, y su nivel dicho en palabras: «Teléfono verificado» en nivel 1, «Identidad verificada»
  en nivel 2 e «Identidad verificada y avalada» en nivel 3 (historia #12). Nada de eso DEBE llevar
  a otra pantalla: el enlace al perfil público y el distintivo quedan fuera de esta historia.
- **FR-008**: Si la ve su publicador con sesión y nivel 1, la ficha DEBE mostrar «Editar», que
  lleva a editar ese animal; nadie más DEBE verlo. Sin nivel 1, en su lugar va el aviso de FR-020,
  que ya lleva a confirmar el teléfono (editar lo exige, historia #53).
- **FR-009**: Un enlace de ficha de un animal que no existe, o cuyo publicador borró la cuenta,
  DEBE mostrar que ese animal no está publicado y el camino a «Animales en adopción». Un enlace de
  un animal no disponible por ahora DEBE mostrar que no está disponible por ahora y el mismo
  camino. Ninguna de las dos DEBE mostrar dato alguno del animal ni del publicador. Una falla del
  sitio al traer la ficha NO DEBE mostrarse como ninguna de las dos (Pantallas).

#### El enlace y la vista previa

- **FR-010**: Cada publicación DEBE tener un enlace propio que se crea al publicar —las publicadas
  antes de esta historia lo reciben cuando esta historia llega— y no cambia nunca: editar el nombre, las fotos, la zona o cualquier otro dato NO DEBE cambiarlo. El enlace NO
  DEBE llevar el nombre del animal ni nada de quien lo comparte o de dónde se compartió, y después
  de la dirección del sitio DEBE tener como mucho 20 caracteres. Dos publicaciones NUNCA DEBEN
  tener el mismo enlace, y el enlace de una publicación borrada NO DEBE volver a usarse para otra.
  El enlace NO DEBE poder adivinarse a partir de otro: no sigue un orden ni dice cuántas
  publicaciones hay, así nadie puede recorrer los enlaces para saber qué publicaciones existen.
- **FR-011**: Lo que el sitio ofrece para armar la vista previa del enlace de una ficha a la vista
  DEBE ser una imagen con la foto de portada entera y, al lado de ella, el nombre y la zona del
  animal escritos —nunca texto encima de la foto (docs/10 §Fotos)—, y como texto de la tarjeta «<nombre>
  en adopción», el mismo título que usa «Compartir», y la zona. DEBE poder leerse sin ejecutar nada
  y sin sesión, como lo leen WhatsApp y Facebook. Si el publicador cambia la portada, el nombre o la
  zona, lo ofrecido DEBE ser lo nuevo desde ese momento.
- **FR-012**: Lo que el sitio ofrece para la vista previa del enlace de un animal no disponible por
  ahora o que no existe, y del listado con o sin filtros, DEBE ser solo el nombre del sitio y
  «Animales en adopción», sin foto, nombre, zona ni ningún otro dato de un animal o de una persona.
- **FR-013**: «Compartir» DEBE estar en la ficha y en cada animal de Mis animales, y compartir el
  enlace de la ficha (FR-010), con «<nombre> en adopción» como título. En un teléfono o una
  tableta —un dispositivo que se usa con el dedo— DEBE abrir las opciones de compartir del
  dispositivo; en una computadora —que se usa con un puntero, aunque su pantalla también sea
  táctil— DEBE copiar el enlace y decir «Enlace copiado», aunque su navegador también tenga
  opciones de compartir. En un equipo que tiene las dos cosas, manda la forma principal de usarlo.
  Un teléfono o una tableta sin opciones de compartir, o cuyas opciones fallan por algo que no es
  cerrarlas, copia, como una computadora. Si no puede copiar, DEBE mostrar el enlace para copiarlo
  a mano. Cerrar las opciones sin elegir nada NO DEBE mostrar ningún error. Mientras las opciones
  están abiertas o el aviso «Enlace copiado» está a la vista, tocarlo de nuevo NO DEBE abrir las
  opciones otra vez ni apilar avisos. Lo que se comparte es siempre el enlace de FR-010, sin
  agregados.
- **FR-014**: Mis animales DEBE sumar, en cada animal, «Ver ficha», que abre su ficha, y
  «Compartir», conservando el camino a editarlo de #53.

#### El listado

- **FR-015**: El listado DEBE mostrar las publicaciones a la vista, de la más reciente a la más
  vieja según el momento en que se publicaron, de a 24. Cada una DEBE mostrar su portada, su
  nombre, su edad de hoy, su zona y la marca de urgente si la tiene, y abrir su ficha al tocarla.
  Arriba DEBE decir cuántas hay con los filtros puestos, contadas al abrir el listado o al cambiar
  los filtros; ese total no cambia con «Ver más». «Ver más» DEBE aparecer solo mientras queden
  publicaciones a la vista más viejas que la última cargada; si al tocarlo no llega ninguna (las
  que quedaban dejaron de estar a la vista), desaparece sin error. No se ordena de otra forma.
- **FR-016**: «Ver más» NO DEBE repetir ni saltear publicaciones aunque se publique una nueva o una
  deje de estar a la vista mientras se mira (Edge Cases). Volver al listado desde una ficha DEBE
  dejarlo con los mismos filtros, las publicaciones que ya se habían cargado y el mismo lugar de la
  pantalla; si el navegador descartó la página, rige el mínimo de Edge Cases («Volver atrás a un
  listado cuya página se descartó»). Si «Ver más» falla, lo que se veía DEBE quedar, decir por qué (sin conexión o el sitio
  no respondió) y ofrecer reintentar.
- **FR-017**: Los filtros DEBEN ser: especie (perro, gato), sexo (macho, hembra), tamaño (chico,
  mediano, grande), edad (cachorro: menos de 1 año; joven: 1 a 2 años; adulto: 3 a 7 años; mayor: 8
  años o más, sobre la edad de hoy), departamento (los 19) y castrado (sí). En un mismo filtro se
  DEBE poder marcar más de una opción y entran las que cumplen cualquiera; entre filtros distintos,
  las que cumplen todos. El listado DEBE arrancar sin ningún filtro puesto, y DEBE ofrecer sacar
  todos los filtros de una vez cuando hay alguno.
- **FR-017a**: Los filtros DEBEN viajar en el enlace del listado: abrirlo, recargarlo, volver atrás
  desde una ficha o abrirlo en otro dispositivo DEBE mostrar los mismos filtros y las mismas
  publicaciones. Un enlace del listado, copiado o recibido, DEBE empezar siempre por la publicación
  más reciente que cumple los filtros, nunca por la mitad (Edge Cases). Con el navegador que
  ejecuta, marcar o desmarcar un filtro NO DEBE sumar un paso a «volver atrás»: volver atrás desde
  el listado lleva a la pantalla de antes del listado, no al filtro anterior. Un filtro o una
  opción que no existe DEBE ignorarse sin error (Edge Cases). El enlace del listado NO DEBE llevar
  nada de quien lo comparte.

#### Fotos

- **FR-018**: Las fotos de una publicación a la vista DEBEN poder verse sin sesión. Cuando la
  publicación deja de estar a la vista o se borra, sus fotos NO DEBEN poder abrirse más por quien
  no es su publicador; una dirección de foto que alguien ya tenía puede seguir abriendo como mucho
  una hora, lo mismo que se aceptó para las fotos en la historia #53. Las fotos ya se guardan sin
  la ubicación ni los datos de la cámara (historia #53). Una ficha o un listado que quedaron
  abiertos más de ese margen DEBEN seguir mostrando las fotos cuando la persona vuelve a ellos
  (por ejemplo, vuelve a la pestaña desde WhatsApp o vuelve atrás desde una ficha), sin tener que
  recargar a mano.

#### Sin ejecutar nada

- **FR-019**: El listado y la ficha DEBEN poder usarse aunque el navegador no ejecute nada: la ficha
  muestra todas sus fotos y datos; el listado muestra los animales, aplica los filtros con una
  acción para aplicarlos, y «Ver más» vuelve a mostrar el listado desde el principio con 24 más
  (48, después 72…, hasta 240), sin repetidos, y lleva a la persona al primero de los nuevos. En
  ese caso, a diferencia de con el navegador que ejecuta, el total y la lista se cuentan de nuevo
  al tocar «Ver más», así que puede aparecer arriba un animal publicado mientras se miraba. Solo
  «Compartir» puede faltar en ese caso (Edge Cases).

#### El publicador sin nivel 1

- **FR-020**: Si el publicador hoy no tiene nivel 1, al abrir la ficha de un animal suyo con sesión
  DEBE verla completa, con el aviso de que nadie más la ve hasta que confirme su teléfono y el
  camino para confirmarlo (historias #10 y #25). En Mis animales DEBE ver, arriba de la lista, el
  aviso de que sus animales no se ven mientras el teléfono no esté confirmado, con el mismo camino.
  «Compartir» y «Ver ficha» DEBEN seguir disponibles para él —el enlace no cambia y vuelve a abrir
  la ficha al confirmar—, y los dos avisos DEBEN decir que, hasta que confirme, quien abra el
  enlace va a ver que el animal no está disponible por ahora. Mientras tanto «Compartir» DEBE
  tener menos peso que el camino para confirmar el teléfono, que es lo que se destaca: pegar ese
  enlace en un grupo hoy muestra «no disponible por ahora».

#### Navegación

- **FR-021**: «Animales en adopción» DEBE poder abrirse desde la cabecera de cualquier pantalla,
  con sesión o sin ella.

#### Baja

- **FR-022**: Borrar la cuenta del publicador (historia #9) DEBE sacar sus publicaciones del listado
  y de su total en el momento, y su enlace DEBE mostrar que el animal no está publicado.

#### Medición

- **FR-023**: El producto DEBE registrar los momentos **vio el listado** (cada vez que se abre o se
  recarga, no al tocar «Ver más»), **usó un filtro** (qué filtro y qué opción, cada vez que la
  persona marca una opción; no al desmarcarla ni al abrir un enlace que ya trae filtros), **vio una
  ficha** (cada vez que se abre o se recarga una ficha a la vista, con su origen: «desde el
  listado» si se llegó tocando un animal del listado, y «desde afuera» en cualquier otro caso —un
  enlace pegado en un grupo o un chat, la dirección escrita, una recarga, o sin origen conocido—) y **tocó «Compartir»** (desde la ficha o desde Mis animales). Ninguno DEBE guardar nada que
  identifique a quien mira —ni su cuenta, ni su dirección de red, ni qué animales miró una persona
  a lo largo del tiempo— ni quién compartió el enlace. La única marca que los acompaña es la de la
  visita de la historia #9, que muere al cerrar el navegador y nunca se une a la cuenta; esta
  historia no agrega ninguna otra marca en el navegador. Sin ejecutar nada, «usó un filtro» se
  registra al aplicar, una vez por cada opción que se sumó. Volver atrás al listado desde una ficha
  no registra otro «vio el listado». «Vio una ficha» no registra qué animal se vio: esta historia no
  lo necesita, y el funnel por animal lo decide M3. Las visitas del publicador a sus propias fichas NO DEBEN
  contarse como «vio una ficha». Una ficha no disponible o que no existe no cuenta. Como en las
  historias #10 y #53, los momentos se registran aunque todavía no se manden a ninguna herramienta.

#### Encontrable

- **FR-024**: El listado y las fichas NO DEBEN aparecer en buscadores hasta que exista el dominio
  definitivo (docs/08 §Encontrable). Eso NO DEBE impedir la vista previa al compartir (FR-011). El
  contenido de la ficha y del listado DEBE estar en lo que el sitio entrega, sin necesidad de
  ejecutar nada.

### Key Entities *(include if feature involves data)*

- **Publicación** (de #53): suma su **enlace** —corto, único y fijo— y la condición de estar a la
  vista, que depende del nivel 1 de su publicador hoy y no se guarda aparte.
- **Ficha**: la vista pública de una publicación: sus fotos, sus datos, lo público de su publicador
  y su enlace.
- **Lo público del publicador**: nombre, foto de perfil, la marca de rescatista o refugio y el nivel
  de verificación en palabras, solo mientras tiene al menos una publicación a la vista y solo como
  parte de su ficha. Nada más.
- **Filtros del listado**: las opciones marcadas en cada filtro, que viajan en el enlace del
  listado y no se guardan en ningún otro lado.
- **Momentos de medición**: listado visto, filtro usado, ficha vista con su origen y compartir con
  su origen, sin ningún dato de quien mira.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con un teléfono de gama media emulado (procesador cuatro veces más lento que una
  computadora) y una conexión 4G lenta emulada (1,6 Mbps de bajada, 150 ms de latencia), la foto de
  portada y el nombre del animal se ven en menos de 2,5 segundos al abrir una ficha, y las portadas
  que entran en la primera pantalla del listado a 390 px de ancho, en menos de 2,5 segundos al
  abrirlo.
- **SC-002**: 0 lecturas exitosas de una publicación, una foto o una vista previa de un animal que no
  está a la vista, en las pruebas de privacidad con y sin sesión, fuera de la excepción de FR-018
  (una dirección de foto obtenida antes, que vence en como mucho una hora).
- **SC-003**: 0 apariciones del teléfono, el correo, la zona o la fecha de alta del publicador en lo
  que el sitio entrega para la ficha, el listado y la vista previa, en las pruebas con personas
  sembradas que tienen todos esos datos cargados y cuya zona de perfil es distinta de la zona de
  sus animales (la zona del animal sí se muestra). Y 0 lecturas exitosas del nombre, la foto o la
  marca de rescatista de una persona sin publicaciones a la vista, con y sin sesión.
- **SC-004**: Leída como la leen WhatsApp y Facebook (sin ejecutar nada ni sesión), la ficha de un
  animal a la vista ofrece su foto de portada, su nombre y su zona en el 100 % de los casos de
  prueba; la de un animal no disponible o que no existe, en ninguno.
- **SC-005**: Con el navegador que ejecuta, 50 publicaciones a la vista y una nueva publicada entre
  abrir el listado y el primer «Ver más», y otra entre el primero y el segundo, el listado muestra
  las 50 que había, cada una exactamente una vez.
- **SC-006**: Cada combinación de filtros de los criterios de aceptación, y cada borde de los tramos
  de edad (11 meses, 1, 2, 3, 7 y 8 años), da exactamente las publicaciones que cumplen.
- **SC-007**: Con el navegador sin ejecutar nada, se puede abrir una ficha, abrir el listado,
  aplicar filtros y, con «Ver más», ver los primeros 48 sin repetidos.
- **SC-008**: El enlace de una ficha sigue abriendo la misma ficha después de editar el nombre, las
  fotos y la zona, en el 100 % de las pruebas.
- **SC-009**: En la beta —no en esta corrida—, la proporción de fichas vistas que llegan desde afuera
  del sitio dice si el canal de Facebook y WhatsApp funciona (docs/03 §3), calculada con los
  momentos de FR-023. No tiene umbral: es el dato que se mira en la beta, no una compuerta.
- **SC-010**: En las pruebas de medición, ninguno de los momentos de FR-023 lleva la cuenta, la
  dirección de red ni otra marca que la de la visita, y abrir la ficha propia no registra «vio una
  ficha».

## Assumptions

- **Nada construido todavía** (Ready): el listado, la ficha, el enlace, la vista previa, «Compartir»
  y la regla de visibilidad son nuevos. La edad que avanza, Mis animales, las fotos preparadas y el
  nivel 1 vienen de #53 y #10.
- **Nivel en palabras**: la historia da el ejemplo «Teléfono verificado» (nivel 1). El nivel 2
  (historia #11) certifica la identidad; se dice «Identidad verificada», que ya implica el
  teléfono. El nivel 3 llegó con #12 mientras esta historia estaba en construcción; se dice
  «Identidad verificada y avalada», que es lo que el perfil público certifica en ese nivel, sin la
  fecha ni la cuenta de avales, que son del perfil. El distintivo y el enlace al perfil siguen fuera
  (el «No incluye» de la historia los nombra); sumarlos es un candidato de seguimiento.
- **«Rescatista o refugio»**: es la etiqueta que el perfil público de #12 ya usa para la misma
  marca; «Rescatista» a secas es la de «Mi perfil», que ve la persona misma. Lo público se llama
  igual en la ficha y en el perfil público.
- **«Compartir» con menos peso mientras el animal no se ve**: la historia pide «Compartir» en cada
  animal de Mis animales y no dice nada del caso oculto; sacarlo haría desaparecer un botón que
  vuelve solo, y dejarlo con el mismo peso invita a pegar un enlace que hoy dice «no disponible por
  ahora». Se deja, en segundo plano, detrás del camino para confirmar el teléfono.
- **Dos pantallas distintas para «no disponible por ahora» y «no publicado»**: la historia lo pide así
  para que el enlace de un rescatista que cambió de chip no parezca roto para siempre. Distinguir
  las dos le dice a quien abre el enlace que el publicador existe y hoy no está verificado, sin
  nombrarlo ni mostrar nada de él; se acepta por la decisión del product-owner.
- **Enlace de hasta 20 caracteres**: la historia pide «corto»; 20 caracteres después de la dirección
  del sitio alcanzan para un identificador único y entran en un mensaje sin cortarse.
- **La marca de rescatista o refugio y el nivel son públicos**: docs/03 §1 ya define el nombre, la
  foto y los distintivos como públicos; la marca de rescatista es parte de cómo se presenta quien
  publica. La zona del publicador, que docs/03 §1 también hace pública en el perfil, NO se muestra
  en la ficha: la historia la excluye y la zona que importa es la del animal.
- **Fotos visibles una hora después de dejar de estar a la vista**: es el mismo margen aceptado en
  #53 para una dirección de foto con permiso. Las fotos no llevan datos personales (sin ubicación ni
  cámara) y la ficha deja de mostrarlas en el momento.
- **Compartir sin ejecutar nada no aparece**: quien abre el enlace desde la app de Facebook es un
  visitante que mira; compartir lo hace el rescatista desde su teléfono, que ejecuta. La dirección
  de la ficha es el mismo enlace.
- **Qué se comparte**: el enlace de la ficha y, como título, «<nombre> en adopción». Nada del
  publicador.
- **Compartir según el dispositivo, no según el navegador**: la historia dice «en una computadora,
  copia el enlace». Algunos navegadores de computadora también tienen opciones de compartir, pero
  el rescatista en la computadora pega el enlace en el grupo abierto en otra pestaña; copiar es lo
  que espera.
- **La imagen de la vista previa**: docs/03 §3 pide «imagen con foto + nombre + zona». docs/10
  §Fotos prohíbe texto sobre la foto, así que el nombre y la zona van fuera de la foto, como en el
  cartel. El diseño exacto de esa imagen es del plan. **Decisión (2026-09-28):** al lado y no
  debajo: en 1200 × 630, poner el texto debajo obligaba a recortar la portada a una franja que
  dejaba al animal sin hocico (revisión de diseño, H1); al lado, la portada entra entera.
- **«Rescatista o refugio»**: la marca del perfil es una sola, «soy rescatista o refugio». El
  glosario distingue rescatista de refugio, así que en público se dice lo que la persona marcó,
  «Rescatista o refugio», y no se nombra a un refugio como rescatista. El perfil propio (historia
  #9) dice «Rescatista»; alinearlo es de esa pantalla, no de esta historia.
- **Sin ejecutar nada, «Ver más» recarga**: sin nada que ejecute no hay cómo sumar animales a la
  página; se vuelve a pedir el listado con más, desde el principio, y el tope de 240 (diez
  tandas) evita enlaces que pidan el sitio entero. Con el navegador que ejecuta, «Ver más» sigue
  sin tope y el enlace recuerda hasta 240.
- **El publicador sin sesión cuenta como visitante**: si abre su propio enlace desde la app de
  Facebook sin sesión, su visita cuenta como «vio una ficha, desde afuera». Es un sesgo chico y
  aceptado del dato de SC-009.
- **Después de «Editar» desde la ficha**: guardar lleva a Mis animales con «Guardado», como en la
  historia #53.
- **Lo público del publicador, solo detrás de una ficha**: la historia #9 cerró el nombre, la foto y
  la marca a cualquier otra persona. Esta historia los abre solo lo necesario: como parte de la
  ficha de un animal a la vista. El perfil público completo es de #12.
- **Volver a una pestaña vieja**: las fotos se muestran con un permiso que vence en una hora
  (FR-018); una ficha que quedó abierta en el navegador de WhatsApp tiene que seguir mostrando
  fotos cuando la persona vuelve.
- **Filtros y «volver atrás»**: si cada filtro sumara un paso atrás, volver desde el listado a la
  pantalla anterior pediría deshacer uno por uno; el enlace igual refleja los filtros puestos.
- **El enlace no lleva el nombre**: docs/06 §URLs da como ejemplo un enlace con el nombre del animal.
  Con el nombre adentro, editar el nombre cambiaría el enlace o dejaría un enlace con un nombre
  viejo; la historia pide un enlace fijo, así que lleva solo un código. El ejemplo de docs/06 se
  actualiza con esta historia.
- **«Ver más» y el total**: el total se cuenta una vez, al abrir o al filtrar, para que no suba o
  baje mientras la persona recorre; un animal nuevo aparece al recargar.
- **Entrar desde «no disponible por ahora»**: el rescatista que abre su propio enlace desde la app de
  Facebook no tiene sesión ahí. Ofrecer entrar no dice nada del animal ni del publicador y le deja
  ver por qué. Es la lectura de esta spec de la decisión del product-owner del 2026-09-28 (que
  quien publica vea la ficha de sus animales con el aviso), no una decisión aparte. «Entrar» lleva
  al ingreso de siempre (historia #9) con la vuelta a ese enlace; si el ingreso termina en otro
  navegador (el enlace del correo abre el navegador del teléfono), la vuelta a la ficha pasa ahí,
  con las reglas de destino de la historia #9.
- **Filtros sin ejecutar nada**: con el navegador que ejecuta, los filtros se aplican al tocarlos;
  sin ejecutar, con una acción para aplicarlos. Es la única diferencia visible.
- **Volver atrás sin memoria**: si el navegador descartó el listado, reponer los que se habían
  cargado es lo deseable; lo mínimo es volver con los filtros y los primeros 24, sin repetidos.
- **Medición del publicador**: sus visitas a sus propias fichas no cuentan como «vio una ficha»
  porque el funnel de docs/03 §7 empieza por el adoptante. Sus toques de «Compartir» sí cuentan.
- **Hace cuánto se publicó**: los cortes (hoy, ayer, días, semanas, meses) son los que se usan al
  hablar de un posteo; la fecha exacta no aporta al adoptante.
- **El listado de un publicador sin nivel 1 tampoco muestra sus propios animales** (FR-001: se ve
  igual con o sin sesión); los ve en Mis animales y en su ficha.
- **Fuera de esta historia** (story.md §Alcance, «No incluye»): solicitar adopción y el botón
  «Quiero adoptar» (M3); los estados en proceso, adoptado y pausado, la expiración, borrar una
  publicación y la revisión antes de salir (historia del ciclo de vida, #59); el perfil público de
  quien publica, su distintivo y el enlace a su perfil (#12); ocultar lo que publica una cuenta
  suspendida o bloqueada (#13); buscar por texto o por raza; filtrar por urgencia, por convivencia
  o por vacunas; ordenar de otra forma que la fija; mapa o distancia; favoritos, likes o
  comentarios; publicar solo en Facebook o Instagram desde el sitio; que el listado o las fichas
  aparezcan en buscadores (M5); la portada del sitio (la landing, al final de M2); y detectar el
  contacto escrito de forma disfrazada en la descripción (#59).
- **Cuentas suspendidas o bloqueadas**: ocultar lo que publican es de la historia #13.
- **Contacto disfrazado en la descripción** (KL-53-3): no se detecta en esta historia; lo baja la
  revisión de publicaciones nuevas de #59 antes de la beta. Hasta entonces el sitio corre en local y
  no lo ve nadie de afuera. La limitación se actualiza en este PR.
- **Estados de la publicación**: todas están disponibles (#53); en proceso, adoptado, pausado y la
  expiración son de la historia del ciclo de vida.
- **Sin buscadores**: el listado y las fichas no se indexan hasta el dominio definitivo; la vista
  previa al compartir sí funciona, porque no depende de aparecer en un buscador.
- **Rendimiento**: la medida de 2,5 segundos es la del presupuesto del proyecto (docs/07) y la que
  pide la historia; se comprueba con la medición de rendimiento del proyecto, que emula el teléfono
  y la conexión.
