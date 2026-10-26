# Feature Specification: Camadas: mantener al día, responder, entregar y seguir cada cría

**Feature Branch**: `feature/206-camadas-mantener-al-dia`

**Created**: 2026-10-25

**Status**: Draft

**Input**: Historia #206 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido** (en `main`, no se rehace): #205 (PR #223) publica la camada, deja pedir una cría
con su cuestionario y deja pedir más de una cría de la misma camada, cada una como una solicitud de
un animal; quitar una cría con solicitudes abiertas ya las cierra al confirmar; la ficha pública de
la camada y su tarjeta con «N crías, N disponibles» ya existen, aunque hoy toda cría cuenta como
disponible; «Mis animales» ya muestra la camada como un grupo con sus crías, «Ver ficha» y
«Compartir»; «Mis solicitudes» ya muestra la solicitud de una cría con su nombre y, si no tiene foto,
la portada de la camada; cada cría ya es un animal para el sitio, pero sus acciones de estado de un
animal suelto hoy la rechazan; ver la ficha, tocar «Quiero adoptar», abandonar el cuestionario y
mandar la solicitud ya se miden con la marca de camada. Esta spec agrega lo que falta: los estados
de cada cría y de la camada, el vencimiento y la renovación de la camada, la bandeja agrupada,
responder, entregar, el compromiso y el seguimiento por cría, el aviso a quienes pidieron una cría
que se quita, el nombre de la camada en «Mis solicitudes», los sellos y el recuento al día, y la
medición de aceptar, adoptar y la encuesta por cría.

**Vocabulario de esta spec**: **camada**, **cría**, **lo común**, **animal suelto**, **ficha de la
camada**, **publicador**, **nivel 1**, **a la vista** y **solicitud** significan lo mismo que en la
spec de #205. Los estados, el vencimiento, «Sigue disponible», «Ya no está disponible», «Mis
animales», «Un animal en Mis animales» y la baja son los de #59; «Solicitudes recibidas», aceptar,
rechazar, dejar sin efecto, el contacto y «Abrir WhatsApp» son los de #65; marcar adoptado a una
persona, «Se lo di a alguien que no vino por el sitio», el compromiso y «Yo no adopté» son los de
#67; el pedido de seguimiento y «Adopción con seguimiento» son los de #69; la encuesta y su tope son
los de #71. **Estado de la cría**: disponible, en proceso o adoptada. **Estado de la camada**:
disponible, pausada, vencida, adoptada o dada de baja. Una cría **disponible** es la que está en ese
estado, no la que está en proceso. Quien pidió es **quien solicitó**; la historia dice «pedido», la
interfaz y esta spec dicen «solicitud», como el glosario de docs/06.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Responder las solicitudes de cada cría por separado (Priority: P1)

Una rescatista publicó una camada de 4 crías y le llegaron solicitudes para tres. Abre «Solicitudes
recibidas» y ve la camada como un grupo; adentro, cada cría con las personas que la pidieron, y la
que nadie pidió con «Todavía nadie pidió a esta cría». Abre una solicitud de «Cría 2», la acepta, ve
el teléfono de esa persona y le escribe por WhatsApp; las solicitudes de las otras crías siguen como
estaban.

**Why this priority**: es lo que hoy falta para que pedir una cría sirva de algo. #205 deja mandar
solicitudes que nadie puede responder. Con 8 crías y 10 interesados por cría, una sola fila con 80
solicitudes es el trabajo que el sitio promete ahorrar.

**Independent Test**: con una camada sembrada de 4 crías, solicitudes de tres personas para «Cría
1», de dos para «Cría 2» y ninguna para «Cría 4»: abrir «Solicitudes recibidas» como quien publicó
y ver un grupo de camada con 4 crías, cada una con las suyas y «Cría 4» con su vacío. Aceptar una de
«Cría 2»: las dos personas ven el teléfono de la otra y las solicitudes de «Cría 1» no cambian. Con
la sesión de quien fue aceptado para «Cría 2», no se ve nada de quienes pidieron «Cría 1».

**Acceptance Scenarios**:

1. **Dado** que tengo una camada de 4 crías con solicitudes, **cuando** abro «Solicitudes
   recibidas», **entonces** veo la camada como un grupo y, adentro, cada cría con las personas que la
   pidieron, no una sola fila con todo mezclado.
2. **Dado** que una cría de esa camada no tiene solicitudes, **cuando** miro el grupo, **entonces**
   esa cría dice «Todavía nadie pidió a esta cría».
3. **Dado** que acepto la solicitud de una persona para «Cría 2», **cuando** confirmo, **entonces**
   ve mi contacto y yo el suyo, y las solicitudes de las otras crías siguen como estaban.
4. **Dado** que acepté a una persona para «Cría 2» y «Cría 2» está disponible, **cuando** termina la
   aceptación, **entonces** se me ofrece marcar «Cría 2» en proceso, sin que se haga solo.
5. **Dado** que una persona fue aceptada para «Cría 2», **cuando** mira su solicitud, **entonces** ve
   solo mi contacto y nada de quienes pidieron «Cría 2» ni las otras crías.
6. **Dado** que rechazo una solicitud de «Cría 1» con un motivo, **cuando** confirmo, **entonces** se
   cierra solo esa solicitud, con las reglas de rechazo de #65.
7. **Dado** que pedí dos crías de la misma camada, **cuando** miro «Mis solicitudes», **entonces**
   veo las dos, cada una con el nombre de la cría y el de su camada.
8. **Dado** que ya tengo 3 solicitudes activas, dos de ellas a crías de la misma camada, **cuando**
   intento pedir otra, **entonces** se me dice que llegué al límite, igual que con animales sueltos.
9. **Dado** que me llega el correo de que aceptaron mi solicitud, **cuando** lo leo, **entonces**
   nombra a la cría y a su camada.
10. **Dado** que una cría tiene solicitudes nuevas, **cuando** abro «Mis animales», **entonces** veo
    cuántas son nuevas en la fila de esa cría y el camino a sus solicitudes.

---

### User Story 2 - Marcar cada cría en proceso, disponible o adoptada (Priority: P2)

La rescatista quedó en llevarle «Cría 2» a una familia el sábado y la marca en proceso; la ficha y
la camada lo muestran. El sábado la entrega: la marca adoptada a esa persona, acepta el compromiso
y la camada pasa a decir «3 disponibles». Las solicitudes de «Cría 2» se cierran; las de las otras
crías no se tocan. Cuando entrega la última cría disponible, la camada queda adoptada, sale del
listado y su ficha conserva el sello.

**Why this priority**: sin estados por cría, una camada publicada queda disponible para siempre y
quien llega desde el posteo del grupo escribe por crías que ya se fueron. Depende de US1 para
marcar adoptada a una persona aceptada.

**Independent Test**: con una camada sembrada de 4 crías y una solicitud aceptada para «Cría 2»:
marcar «Cría 2» en proceso y ver el sello en «Mis animales» y en la ficha. Marcarla adoptada a esa
persona: el recuento pasa a «4 crías, 3 disponibles», las demás solicitudes de «Cría 2» quedan
cerradas y las de «Cría 1» abiertas. Marcar adoptadas las otras tres y ver que la camada sale del
listado y su ficha dice «Adoptada».

**Acceptance Scenarios**:

1. **Dado** que tengo una camada a la vista, **cuando** marco «Cría 2» en proceso, **entonces** en
   «Mis animales» y en la ficha «Cría 2» lleva el sello «En proceso», y la camada sigue en el
   listado.
2. **Dado** que «Cría 2» está en proceso, **cuando** la marco disponible, **entonces** vuelve a estar
   disponible y su sello se va.
3. **Dado** que entregué «Cría 2», **cuando** la marco adoptada a esa persona, **entonces** «Cría 2»
   queda adoptada, la camada pasa a decir «3 disponibles» y a los 30 días le pido el seguimiento a
   quien la adoptó.
4. **Dado** que marco adoptada a «Cría 2», **cuando** confirmo, **entonces** se cierran solo las
   solicitudes de «Cría 2», con el mensaje de siempre, y las de las otras crías no se tocan.
5. **Dado** que una persona fue aceptada para una cría y otra persona había pedido esa misma cría,
   **cuando** se marca adoptada, **entonces** la segunda ve su solicitud cerrada con el mensaje de
   siempre, y no se le ofrece otra cría de la camada por su cuenta.
6. **Dado** que marco adoptada a la última cría disponible, **cuando** confirmo, **entonces** la
   camada queda adoptada, sale del listado y su ficha conserva el sello.
7. **Dado** que marco adoptada a una cría, **cuando** elijo a quién, **entonces** se me ofrecen solo
   las personas aceptadas para esa cría, o «Se la di a alguien que no vino por el sitio», y el
   compromiso dice el nombre de la cría y el de la camada.
8. **Dado** que la persona que adoptó una cría abre su solicitud, **cuando** carga, **entonces** ve
   «Adoptaste a <cría>» con la camada, acepta el compromiso y, a los 30 días, le llega un solo
   correo pidiéndole el seguimiento de esa cría.
9. **Dado** que tengo una cría adoptada en una camada todavía a la vista, **cuando** la marco
   disponible, **entonces** se me dice antes que la adopción de esa cría termina, como al volver a
   publicar un animal adoptado, y al confirmar la cría vuelve a estar disponible.
10. **Dado** que una cría está en proceso, **cuando** alguien abre la ficha de la camada, **entonces**
    esa cría lleva el sello «En proceso» y se puede pedir igual, con el aviso de que quien publica ya
    avanza con otra persona.
11. **Dado** que una cría está adoptada, **cuando** alguien abre la ficha de la camada, **entonces**
    esa cría lleva el sello «Adoptada» y no tiene botón para pedirla.
12. **Dado** que marqué adoptadas a 3 crías en una semana, **cuando** abro «Mis animales»,
    **entonces** se me ofrece la encuesta de «dio en adopción» una sola vez, por el tope de una cada
    30 días.
13. **Dado** que cambié el estado de una cría desde otra pestaña, **cuando** toco una acción en la
    primera, **entonces** veo cómo quedó la cría y qué podía hacer, sin pisar el cambio.
14. **Dado** que el sitio no responde al marcar una cría, **cuando** lo hago, **entonces** veo que no
    se pudo, la cría sigue como estaba y puedo reintentar.

---

### User Story 3 - Pausar, renovar, volver a publicar y borrar la camada entera (Priority: P3)

La rescatista tiene que llevar a toda la camada al veterinario por una semana: la pausa entera y la
camada sale del listado, con «Cría 3» que estaba en proceso. Al volver la reanuda: «Cría 3» vuelve
a estar en proceso y las demás como estaban. Siete días antes de que venza le llega un solo correo
por la camada; toca «Sigue disponible» sin ingresar y la camada entera sigue 30 días más.

**Why this priority**: una camada que no vence queda en el listado con crías que ya no están, y 8
correos de «¿sigue disponible?» el mismo día son el ruido que hace dejar el sitio. Se prueba sobre
los estados de US2.

**Independent Test**: con una camada sembrada de 4 crías, una en proceso y una adoptada: pausar y
ver que sale del listado y su enlace dice que está pausada; reanudar y ver cada cría como estaba.
Llevar la camada a 7 días del vencimiento y comprobar que sale un solo correo; abrir «Sigue
disponible» sin sesión y ver 30 días nuevos. Vencerla, volver a publicarla y verla arriba del listado
con los mismos estados por cría. Sin nivel 1, reanudar no cambia nada y muestra el aviso.

**Acceptance Scenarios**:

1. **Dado** que pauso la camada con una cría en proceso, **cuando** la reanudo, **entonces** esa cría
   vuelve a estar en proceso y las demás vuelven como estaban.
2. **Dado** que pausé la camada, **cuando** alguien abre su enlace, **entonces** ve que está pausada
   por ahora y el camino al listado, y la camada no está en el listado.
3. **Dado** que quedan 7 días para que venza la camada, **cuando** llega el correo, **entonces** es
   un solo correo por la camada, y «Sigue disponible» la renueva entera por 30 días.
4. **Dado** que la camada venció con crías en proceso, **cuando** la vuelvo a publicar, **entonces**
   vuelve al listado con 30 días nuevos y cada cría con el estado que tenía.
5. **Dado** que la camada está adoptada, **cuando** la vuelvo a publicar, **entonces** elijo qué
   crías vuelven a estar disponibles, se me dice antes que sus adopciones terminan, y las demás
   siguen adoptadas.
6. **Dado** que toco «Renovar» en la camada, **cuando** confirma, **entonces** la camada entera
   sigue 30 días desde ese momento, sin cambiar el estado de ninguna cría.
7. **Dado** que intento reanudar, renovar o volver a publicar sin el teléfono verificado, **cuando**
   lo hago, **entonces** veo el aviso de verificación pendiente y la camada queda como estaba.
8. **Dado** que abro el enlace «Sigue disponible» de un correo vencido o alterado, **cuando** carga,
   **entonces** veo que ya no sirve y cómo renovar desde «Mis animales».
9. **Dado** que borro la camada entera con solicitudes abiertas, **cuando** confirmo, **entonces** la
   confirmación me dijo antes cuántas se cierran, la camada y sus crías desaparecen y quienes pidieron
   se enteran, como cuando se borra un animal suelto.
10. **Dado** que la camada está pausada o vencida, **cuando** marco adoptada a una cría, **entonces**
    se puede, y esa cría queda adoptada al reanudar o volver a publicar.

---

### User Story 4 - Quitar una cría y avisar a quienes la pidieron (Priority: P4)

Una cría murió. La rescatista toca «Quitar» en su fila de «Mis animales»; la confirmación le dice
que sus 2 solicitudes se cierran. Confirma: la cría desaparece de la camada y las dos personas que
la pidieron ven su solicitud cerrada porque la cría ya no está publicada y les llega el correo de
siempre.

**Why this priority**: #205 ya cierra las solicitudes de una cría quitada, pero sin avisarle a
nadie, y quitar solo se podía desde editar, con el teléfono verificado. Sacar de la vista algo que
ya no está nunca debe trabarse (#59).

**Independent Test**: con una camada sembrada de 4 crías, una con 2 solicitudes esperando respuesta:
quitarla desde su fila sin nivel 1 y ver en la confirmación «se cierran 2 solicitudes». Con la
sesión de cada persona que la pidió, ver la solicitud cerrada porque la cría ya no está publicada y
el correo en el buzón de prueba.

**Acceptance Scenarios**:

1. **Dado** que quito una cría que tenía solicitudes pendientes, **cuando** confirmo, **entonces**
   esas solicitudes se cierran y sus autores se enteran, como cuando se borra un animal suelto.
2. **Dado** que quiero quitar una cría y mi teléfono no está verificado, **cuando** la quito desde su
   fila, **entonces** se puede, porque quitar es borrar.
3. **Dado** que quito la última cría de la camada, **cuando** confirmo, **entonces** se me avisó
   antes que la camada se borra, y al confirmar se borra con sus solicitudes cerradas y avisadas.
4. **Dado** que quito la única cría que seguía disponible y las demás están adoptadas, **cuando**
   confirmo, **entonces** la camada queda adoptada.

---

### Edge Cases

- **Qué acciones tiene cada cría** (en su fila de «Mis animales»), según el estado de su camada:
  - *Camada disponible*: una cría disponible se marca en proceso, se marca adoptada o se quita; una
    en proceso se marca disponible, se marca adoptada o se quita; una adoptada se marca disponible
    (con el aviso de que su adopción termina) o se quita.
  - *Camada pausada o vencida*: una cría disponible o en proceso se marca adoptada o se quita; una
    adoptada se quita.
  - *Camada adoptada*: cada cría se quita; el camino para volver a ofrecer una es volver a publicar
    la camada.
  - *Camada dada de baja*: las crías no tienen acciones; la camada solo se borra.
- **Qué acciones tiene la camada** (arriba del grupo): *disponible*: pausar, renovar, borrar;
  *pausada*: reanudar, borrar; *vencida*: volver a publicar, borrar; *adoptada*: volver a publicar,
  borrar; *dada de baja*: borrar. Editar sigue como en #205 en todos los estados salvo dada de baja.
- **El estado de la camada sale de sus crías y de sus acciones**: está adoptada cuando todas sus
  crías lo están, aunque estuviera pausada o vencida (una adoptada no vence, #59); si no, está pausada
  o vencida entera si así la dejó quien publica o el vencimiento; si no, disponible.
- **Pausar no toca a las crías**: cada una guarda su estado y lo recupera al reanudar. Una cría
  marcada adoptada mientras la camada estaba pausada sigue adoptada al reanudar.
- **Volver a publicar una vencida** deja cada cría como estaba; **volver a publicar una adoptada**
  pide elegir al menos una cría que vuelve a estar disponible. Las dos cuentan como publicadas hoy:
  la camada sube al listado con «Publicado hoy» y el mismo enlace (#59).
- **Una camada con todas sus crías en proceso** sigue en el listado y su tarjeta lleva el sello «En
  proceso», como un animal en proceso. Con al menos una cría disponible, la tarjeta dice el recuento
  y no lleva el sello.
- **El recuento** cuenta como disponibles solo las crías en ese estado: una camada de 4 con una en
  proceso y una adoptada dice «4 crías, 2 disponibles».
- **El filtro de sexo** del listado mira las crías disponibles y en proceso: una camada cuyas
  hembras están todas adoptadas no aparece al filtrar por hembra.
- **Una cría adoptada que se marca disponible** termina su adopción con las reglas de #67 para
  volver a publicar un animal adoptado: el compromiso y el pedido de seguimiento abiertos se cierran,
  y la cría vuelve a recibir solicitudes.
- **Quitar una cría adoptada** borra la cría con su adopción, como borrar un animal adoptado (#59,
  #67).
- **«Sigue disponible» sobre cada estado de la camada**: disponible, la renueva sin cambiar ninguna
  cría; vencida, la vuelve a publicar con cada cría como estaba; pausada, adoptada o dada de baja, no
  cambia nada y dice cuál es su estado y qué puede hacer desde «Mis animales»; borrada, dice que el
  enlace no sirve. Sin nivel 1 del publicador, no cambia nada y dice que primero hay que confirmar el
  teléfono. Abrirlo varias veces da el mismo resultado que una (#59).
- **El correo de renovación** sale uno por vencimiento de la camada y ninguno por cría. Si la camada
  queda pausada, adoptada o dada de baja antes, no sale.
- **Una solicitud de una cría mientras la camada está pausada o vencida** no se cierra (#63), y quien
  publicó la puede responder (#65). Nadie puede mandar una solicitud nueva a una cría de una camada
  que no está a la vista.
- **Marcar adoptada a una cría con aceptadas para otra cría**: la persona aceptada para la otra cría
  sigue aceptada; nada cruza de una cría a otra.
- **Una misma persona aceptada para dos crías**: puede adoptar las dos; cada adopción tiene su
  compromiso y su seguimiento.
- **Dos cambios a la vez sobre la misma cría o la misma camada** (dos pestañas, o el publicador y
  quien administra): gana el primero; el segundo, si ya no corresponde, no se aplica y se ve el
  estado nuevo con el aviso de que cambió mientras tanto. Una baja siempre gana (#59).
- **Tocar dos veces una acción**: el segundo toque no hace un segundo cambio ni manda un segundo
  correo.
- **Cuenta suspendida**: el tiempo suspendida no cuenta para el vencimiento de la camada y mientras
  dure no sale el correo (decisión 2026-10-05 de docs/03 §2); las solicitudes de sus crías se cierran
  como las de un animal suelto (#13).
- **Publicador sin nivel 1**: la camada sale del listado como en #205; sus solicitudes no se cierran
  (#63) y las acciones que sacan de la vista siguen andando.

## Pantallas

- **Mis animales** (cambia, de #205): la camada como un grupo; arriba, su estado, el día en que vence
  (marcado como próximo cuando faltan 7 días o menos) y las acciones de la camada entera; en cada
  fila de cría, su sello, cuántas solicitudes nuevas tiene con el camino a ellas y sus acciones. Sin
  camadas, no aparece el grupo. Al terminar una acción, el sello, la fecha y las acciones cambian en
  el lugar, con un aviso corto («Cría 2 está en proceso»).
- **Un animal en Mis animales** (cambia, de #59): a donde llevan «Ya no está disponible» de una
  camada y su enlace; muestra ese grupo con su estado y sus acciones, igual que en la lista.
- **Elegir a quién se entregó una cría** (cambia, de #67): las personas aceptadas para esa cría o «Se
  la di a alguien que no vino por el sitio», y el compromiso con el nombre de la cría y el de la
  camada.
- **Volver a publicar una camada adoptada**: la lista de sus crías para elegir cuáles vuelven a estar
  disponibles (al menos una), con el aviso de que sus adopciones terminan.
- **Solicitudes recibidas** (cambia, de #65): la camada como un grupo, con cuántas esperan respuesta
  y cuántas son nuevas; adentro, cada cría con las suyas. Vacío de una cría: «Todavía nadie pidió a
  esta cría», como con un animal suelto. Sin solicitudes en ninguna cría, la camada no aparece.
- **Solicitudes de una cría** (cambia, de #65): las de esa cría, con su nombre y el de la camada
  arriba.
- **Mis solicitudes y Mi solicitud** (cambia, de #63, #65, #67 y #69): cada cría con el nombre de su
  camada.
- **Ficha de la camada** (cambia, de #205): el sello de cada cría (en proceso, adoptada) y el
  recuento al día; las crías adoptadas sin «Quiero adoptar». Adoptada entera: el sello «Adoptada»
  junto al nombre de la camada y el camino a «Animales en adopción». Vista por su publicador cuando
  nadie más la ve (pausada, vencida), el aviso de por qué y el camino al grupo en «Mis animales».
- **Camada no disponible** (cambia, de #205): suma «Esta camada está pausada por ahora» y «Esta
  publicación venció», cada uno con el camino al listado.
- **Tarjeta de la camada en el listado** (cambia, de #205): el recuento al día y el sello «En
  proceso» cuando ninguna cría está disponible y alguna está en proceso.
- **Correos**: «¿<camada> sigue disponible?», uno por camada, con su portada, el nombre de la camada,
  el día en que vence, «Sigue disponible» y «Ya no está disponible»; los de solicitud nueva,
  aceptación, rechazo, entrega, compromiso, seguimiento y cierre, con el nombre de la cría y el de la
  camada.
- **Resultado de «Sigue disponible»**: hasta qué día sigue publicada la camada, o por qué no cambió
  nada, con el nombre de la camada y nada de la persona.

Cargando y error: cada pantalla cambiada tiene los mismos que su par de un animal suelto (#59 para
«Mis animales» y las acciones; #65 para las solicitudes; #67 y #69 para la entrega y el seguimiento;
#57 y #205 para la ficha y el listado). Error de una acción: la cría o la camada queda como estaba,
se dice por qué (sin conexión, el sitio no respondió, falta confirmar el teléfono, o cambió mientras
tanto) y se ofrece reintentar o, si falta el teléfono, el aviso de verificación pendiente con su
camino.

## Requirements *(mandatory)*

### Functional Requirements

#### Estados de la cría y de la camada

- **FR-001**: Cada cría DEBE tener su estado: disponible, en proceso o adoptada. Toda cría nace
  disponible; las crías de las camadas ya publicadas DEBEN quedar disponibles, y esas camadas DEBEN
  empezar a contar sus 30 días desde que llega esta historia, no desde que se publicaron.
- **FR-002**: La camada DEBE estar adoptada cuando todas sus crías lo están; si no, pausada o vencida
  entera cuando así quedó; si no, disponible. Dada de baja sigue como en #205 y gana sobre todo.
- **FR-003**: Marcar en proceso, marcar disponible y marcar adoptada DEBEN ser acciones de una cría.
  Pausar, reanudar, renovar, volver a publicar y borrar DEBEN ser de la camada entera. Quitar una
  cría DEBE ser borrarla. Las acciones de cada estado son las de Edge Cases; una acción que no
  corresponde al estado NO DEBE cambiar nada.
- **FR-004**: Reanudar, renovar y volver a publicar DEBEN exigir nivel 1; sin él NO DEBEN cambiar
  nada y DEBEN mostrar el aviso de verificación pendiente de #10. Las demás acciones, quitar una
  cría incluida, NO DEBEN exigirlo.
- **FR-005**: Pausar la camada DEBE sacarla entera de la vista sin cambiar el estado guardado de sus
  crías; reanudarla DEBE devolver cada cría al estado que tenía, con los cambios que se hicieron
  mientras estaba pausada.
- **FR-006**: Volver a publicar una camada vencida DEBE dejar cada cría con el estado que tenía.
  Volver a publicar una camada adoptada DEBE pedir que se elija al menos una cría y dejar disponibles
  solo las elegidas; si alguna fue entregada a una persona, la confirmación DEBE decir antes que esa
  adopción termina, con las reglas de #67.
- **FR-007**: Marcar disponible una cría adoptada DEBE pedir la misma confirmación de #67 para volver
  a publicar un animal adoptado y, al confirmar, terminar su adopción.
- **FR-008**: Solo quien publicó la camada DEBE poder cambiar el estado de la camada o de sus crías.
  Una acción sobre una camada o una cría que no es suya, o que no existe, NO DEBE cambiar nada y DEBE
  verse igual que una que no existe.
- **FR-009**: Un cambio que se corta por la conexión o porque el sitio no respondió NO DEBE dejar la
  cría ni la camada a medias. La persona DEBE ver qué pasó y poder reintentar, y reintentar NO DEBE
  aplicar el cambio dos veces. Si el estado cambió mientras tanto (otra pestaña, una baja), DEBE ver
  el estado nuevo y un aviso, sin que su cambio se aplique.

#### Vencimiento y renovación

- **FR-010**: La camada disponible DEBE vencer a los 30 días de publicada, renovada, reanudada o vuelta
  a publicar por última vez, con las reglas de #59: pausar congela, editar y cambiar el estado de una
  cría no renuevan, y una vencida no se borra sola. Las crías NO DEBEN vencer por separado.
- **FR-011**: Cuando a una camada disponible le quedan 7 días, su publicador DEBE recibir un solo
  correo «¿<camada> sigue disponible?» por ese vencimiento, y ninguno por cada cría.
- **FR-012**: «Sigue disponible» DEBE renovar la camada entera sin ingresar y con un toque, sin cambiar
  el estado de ninguna cría, con las reglas de #59 para cada estado, para el plazo del enlace y para
  lo que muestra (Edge Cases). Un enlace vencido, alterado o de una camada borrada DEBE decir que no
  sirve y ofrecer el camino a «Mis animales», sin cambiar nada.
- **FR-013**: «Ya no está disponible» DEBE llevar a la camada en «Mis animales», pidiendo ingresar si
  hace falta.
- **FR-014**: «Mis animales» DEBE mostrar, en una camada disponible, el día en que vence y «Renovar»;
  renovar DEBE dejar 30 días desde ese momento, sin sumar.

#### Lo que se ve

- **FR-015**: El listado DEBE mostrar una camada mientras está disponible y a la vista (#205); pausada,
  vencida, adoptada o dada de baja NO DEBE aparecer. El total y la portada del sitio DEBEN contar las
  mismas.
- **FR-016**: La tarjeta y la ficha DEBEN decir el recuento al día: cuántas crías tiene y cuántas
  están disponibles. La tarjeta DEBE llevar el sello «En proceso» cuando ninguna cría está disponible
  y al menos una está en proceso.
- **FR-017**: El filtro de sexo del listado DEBE mirar las crías disponibles y en proceso.
- **FR-018**: La ficha DEBE mostrar el sello de cada cría en proceso o adoptada. Una cría adoptada NO
  DEBE tener «Quiero adoptar»; una en proceso sí, con el aviso de #63 de que quien publica ya avanza
  con otra persona. Ningún sello DEBE decir a quién se entregó una cría ni con quién se avanza: eso lo
  ven solo las dos personas de la adopción (#67).
- **FR-019**: El enlace de una camada pausada o vencida DEBE decir, a quien no la publicó, que está
  pausada por ahora o que venció, con el camino al listado, y su vista previa NO DEBE llevar foto,
  nombre ni zona. Nada de una camada pausada o vencida DEBE poder leerse por ningún camino por quien
  no la publicó (#205).
- **FR-020**: La ficha de una camada adoptada DEBE seguir viéndose con el sello «Adoptada», sin
  «Quiero adoptar» en ninguna cría y con el camino a «Animales en adopción»; su vista previa DEBE
  llevar la portada y el nombre y decir que fue adoptada, como la de un animal adoptado.
- **FR-021**: Quien publicó DEBE ver su camada en cualquier estado salvo borrada, con el aviso de por
  qué nadie más la ve cuando corresponde y el camino a su grupo en «Mis animales».
- **FR-022**: Llegar al cuestionario de una cría adoptada, o mandarlo, DEBE decir que esa cría ya
  encontró hogar, sin perder lo respondido en pantalla, y ofrecer el camino a la ficha de la camada.

#### Solicitudes recibidas

- **FR-023**: «Solicitudes recibidas» DEBE mostrar cada camada con al menos una solicitud como un
  grupo, con cuántas esperan respuesta y cuántas son nuevas, y adentro cada cría con las suyas,
  ordenadas como en #65. Una cría sin solicitudes DEBE decir «Todavía nadie pidió a esta cría».
- **FR-024**: Las solicitudes de una cría DEBEN responderse con las reglas de #65: aceptar con su
  confirmación y el contacto de las dos personas, rechazar con motivo, dejar sin efecto, preguntar,
  más de una aceptada por cría y la oferta de marcar la cría en proceso después de aceptar. Responder
  una solicitud NO DEBE tocar las de otra cría.
- **FR-025**: Quien publicó DEBE poder responder las solicitudes de una cría disponible, en proceso,
  o de una camada pausada o vencida, como en #65.
- **FR-026**: «Mis animales» DEBE mostrar, en cada fila de cría, cuántas solicitudes nuevas tiene y el
  camino a ellas.
- **FR-027**: Cada persona aceptada DEBE ver solo el contacto de quien publicó. Nadie, salvo quien
  publicó, DEBE ver quiénes pidieron una cría, y quien fue aceptada para una cría NO DEBE ver nada de
  quienes pidieron las otras.

#### Entregar y seguir cada cría

- **FR-028**: Marcar adoptada una cría DEBE pedir a quién se entregó, entre las personas aceptadas
  para esa cría o «Se la di a alguien que no vino por el sitio», con el compromiso y las reglas de
  #67.
- **FR-029**: Marcar adoptada una cría DEBE cerrar solo las solicitudes de esa cría, como al marcar
  adoptado un animal suelto (#67), con el mensaje y el correo de siempre. Las de las otras crías NO
  DEBEN tocarse, y el sitio NO DEBE ofrecerle a nadie otra cría por su cuenta.
- **FR-030**: Marcar adoptada a la última cría que no lo estaba DEBE dejar la camada adoptada.
- **FR-031**: El compromiso, «Yo no adopté» y el pedido de seguimiento a los 30 días DEBEN ser de cada
  cría y de quien la adoptó, con las reglas de #67 y #69. Una persona que adoptó dos crías DEBE tener
  dos compromisos y dos pedidos.
- **FR-032**: «Mis animales» y la pantalla de la camada DEBEN mostrar, en cada cría adoptada a una
  persona, a quién se entregó, el estado del compromiso y del seguimiento, como en #67 y #69.

#### Quitar y borrar

- **FR-033**: Quitar una cría desde su fila DEBE pedir confirmación diciendo cuántas solicitudes
  abiertas se cierran; al confirmar, se borran la cría y sus fotos y se cierran sus solicitudes.
- **FR-034**: Quienes pidieron una cría que se quita, o una cría de una camada que se borra entera,
  DEBEN enterarse como cuando se borra un animal suelto: su solicitud se ve cerrada porque ya no está
  publicada y les llega el correo de cierre de #65.
- **FR-035**: Quitar la última cría DEBE avisar que la camada se borra antes de confirmarlo (#205).
  Borrar la camada entera DEBE pedir confirmación diciendo cuántas solicitudes abiertas se cierran y
  que es definitivo.

#### Mis solicitudes

- **FR-036**: «Mis solicitudes» y «Mi solicitud» DEBEN mostrar, en la solicitud de una cría, el nombre
  de la cría y el de su camada, en todos sus estados.
- **FR-037**: Una persona DEBE poder pedir más de una cría de la misma camada, y cada solicitud DEBE
  contar como una activa para el límite de 3 (#63).

#### Correos

- **FR-038**: Todo correo sobre la solicitud, la entrega, el compromiso o el seguimiento de una cría
  DEBE decir el nombre de la cría y el de la camada, y seguir las reglas de #65, #67 y #69: no lleva
  teléfono, correo ni respuestas de nadie, y lleva al lugar del sitio donde se responde.
- **FR-039**: Ninguna acción DEBE mandar un correo dos veces por tocarla dos veces o reintentarla.

#### Datos personales

- **FR-040**: Esta historia NO DEBE sumar ningún dato personal nuevo. El contacto se da recién al
  aceptar, solo entre las dos personas de esa solicitud, y el seguimiento lo ven solo las dos personas
  de esa adopción (#65, #67, #69).

#### Medición

- **FR-041**: Aceptar una solicitud de una cría y marcar adoptada una cría DEBEN medirse como los de
  un animal suelto, con la marca de que viene de una camada, igual que ya se miden ver la ficha,
  tocar «Quiero adoptar», abandonar el cuestionario y mandar la solicitud.
- **FR-042**: Cada cambio de estado de una cría o de la camada, la renovación y «Sigue disponible»
  DEBEN medirse como en #59, con la marca de camada.
- **FR-043**: La encuesta de #71 DEBE ofrecerse por cada cría adoptada, a quien publicó, a quien
  adoptó y a quienes pidieron esa cría y no fueron elegidos, con el tope de una cada 30 días por
  persona. Ningún evento DEBE llevar datos de las personas.

#### Encontrable

- **FR-044**: Ninguna pantalla privada nueva o cambiada DEBE indexarse: el resultado de «Sigue
  disponible», elegir a quién se entregó una cría, volver a publicar una camada adoptada y las
  solicitudes de una cría. La ficha de la camada sigue con las reglas de #205.

#### Lenguaje

- **FR-045**: La interfaz DEBE decir «camada» y «cría» y NO DEBE usar «cachorro» ni «gatito» para
  nombrarlas; los sellos de una cría concuerdan en femenino («Adoptada»).

### Key Entities

- **Camada**: suma su estado propio (pausada, vencida o ninguno), su vencimiento, el momento en que se
  pausó y el recordatorio de cada vencimiento con su enlace «Sigue disponible». Su estado visible sale
  de ese estado propio y del de sus crías.
- **Cría**: suma su estado (disponible, en proceso, adoptada) y cuándo cambió por última vez. Sus
  solicitudes, su entrega, su compromiso y su seguimiento son los de un animal suelto.
- **Solicitud de una cría**: la de #63, que ahora se responde, se entrega y se sigue (#65, #67, #69).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una camada de 8 crías recibe un solo correo «¿sigue disponible?» por vencimiento, en el
  100 % de las pruebas.
- **SC-002**: Con 8 crías y 10 solicitudes por cría, quien publicó encuentra las solicitudes de una
  cría en 2 toques o menos desde «Solicitudes recibidas».
- **SC-003**: En el 100 % de las pruebas de visibilidad, quien fue aceptada para una cría, un visitante
  y otra persona cualquiera no leen nada de quienes pidieron otra cría ni el contacto de nadie que no
  le corresponde.
- **SC-004**: Marcar adoptada una cría cierra el 100 % de las solicitudes abiertas de esa cría y el 0
  % de las de las otras.
- **SC-005**: El recuento de la tarjeta y de la ficha coincide con los estados de las crías en el 100 %
  de las pruebas, también después de pausar y reanudar.
- **SC-006**: Ningún reintento ni doble toque aplica un cambio de estado dos veces ni manda un correo
  dos veces, en el 100 % de las pruebas.

## Assumptions

- **Cómo se entiende «disponibles»**: el recuento cuenta solo las crías disponibles; las en proceso no
  suman al número, pero mantienen la camada en el listado. Es lo que dice el criterio «la camada pasa
  a decir 3 disponibles» al adoptar una de 4, y lo que el rescatista hace en el grupo con
  «RESERVADO».
- **El sello «En proceso» de la tarjeta** se pone solo cuando ninguna cría está disponible y alguna
  está en proceso: con una disponible, un sello en la tarjeta engañaría a quien busca.
- **Una cría adoptada se puede volver a ofrecer** con «Marcar disponible» mientras la camada está
  disponible, con el aviso de #67, sin pedir el teléfono: la camada ya está a la vista y la historia
  dice que solo reanudar, renovar y volver a publicar lo exigen. Sin esto, un error al marcar obliga a
  borrar la cría.
- **Volver a publicar una camada adoptada pide elegir las crías**: volver todas a disponibles
  terminaría adopciones en curso por un solo toque, y dejarlas todas adoptadas no volvería a publicar
  nada.
- **Las acciones de cría con la camada pausada o vencida** son marcar adoptada y quitar, las mismas
  que #59 deja en un animal pausado o vencido.
- **Quitar una cría no exige el teléfono** porque la historia dice que quitar es borrar, y borrar no
  lo exige (#59). En #205 se quitaba solo desde editar, que sigue exigiéndolo.
- **El filtro de sexo** mira las crías disponibles y en proceso, porque una camada en proceso sigue en
  el listado como un animal en proceso (#59), que también responde a los filtros.
- **«Un correo ya usado o vencido»** se lee con la regla de #59: el enlace sirve 30 días y abrirlo de
  nuevo da el mismo resultado; lo que «ya no sirve» es el enlace vencido, alterado o de una camada
  borrada.
- **Cómo se nombra a la cría en correos y avisos**: el nombre de la cría y el de la camada juntos; el
  texto exacto se escribe con el skill sin-slop, porque el nombre de la camada es libre y ya puede
  empezar con «La camada de…».
- **Solicitudes recibidas** muestra una camada solo si alguna cría tiene solicitudes, como #65 con los
  animales; adentro muestra todas las crías, las vacías con su texto.
- **La encuesta por cría** usa el tope de #71 tal cual: entregar varias crías en el mismo mes ofrece
  una sola encuesta a cada persona.
- **Las camadas publicadas antes de esta historia** no vencían (#205, Assumptions). Contar sus 30
  días desde su publicación podría vencerlas el mismo día en que llega esta historia sin que nadie
  recibiera el correo de los 7 días; contarlos desde que llega no le cuesta nada a nadie, porque antes
  de la beta nadie de afuera usa el sitio.
- **Las referencias «docs/01 §Situación actual» y «docs/03 §7»** del cuerpo de la historia son
  referencias a documentos de producto.
- **#205 ya está en `main`** (PR #223); la línea de Dependencias de la historia que lo nombra abierto
  quedó vieja.
