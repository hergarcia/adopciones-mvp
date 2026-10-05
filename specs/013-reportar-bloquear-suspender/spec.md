# Feature Specification: Reportar, bloquear y suspender

**Feature Branch**: `feature/13-reportar-bloquear-y-suspender`

**Created**: 2026-10-05

**Status**: Draft

**Input**: Historia #13 del backlog, milestone «M1 - Cuentas y confianza». El cuerpo verbatim de
la historia acompaña a esta spec (`story.md`). Ya en main: nada de esta historia.

**Ya construido**: el ingreso con su vuelta a la pantalla de origen y el borrado de la cuenta con
sus reglas (historia #9); el teléfono verificado, el nivel 1 y la pantalla «Ese número está en otra
cuenta» con sus caminos, incluido quedarse con el número (historias #10 y #25); quién administra,
designado por fuera del sitio, el pedido de verificación de identidad con su retiro y el borrado de
sus imágenes, la revisión con la regla de que nadie resuelve lo propio, y el correo de ayuda
(historia #11); el perfil público, el distintivo, el aval, el nivel 3, «Mis avales» y la pantalla
de perfil que no existe (historia #12); las publicaciones, el listado «Animales en adopción» con su
cantidad, la ficha, la vista previa, la pantalla de animal que no está publicado, la portada con
los 8 animales más recientes, los estados, el vencimiento, el correo «¿sigue disponible?» y
Publicaciones por revisar (historias #53, #57, #59 y la portada). En el sitio no existen todavía
reportes, bloqueos ni suspensiones. Esta spec suma eso y lo que cada uno le hace a lo anterior; no
rehace nada.

**Vocabulario de esta spec**:

- **Reportar** es avisarle a quien administra que una persona no debería estar en el sitio. Un
  **reporte** tiene quién reportó, a quién, un **motivo** de la lista (estafa, maltrato animal,
  vende animales, se hace pasar por otra persona, acoso, otro), un **texto** opcional y cuándo se
  hizo. Un reporte está **sin resolver** hasta que quien administra lo **cierra** (**resolver** y
  **cerrar** son lo mismo; un reporte **resuelto** es uno cerrado): **sin medidas** o
  **suspendiendo** la cuenta. Quien reporta es **quien reportó**; la persona reportada, **la
  reportada**.
- **Bloquear** es que una persona (**quien bloquea**) corte el vínculo con otra (**la
  bloqueada**). **Desbloquear** lo deshace. Un bloqueo es de una sola dirección: si las dos se
  bloquean, son dos bloqueos.
- **Suspender** es que quien administra deje sin uso una cuenta, con un motivo escrito. La cuenta
  queda **suspendida** hasta que alguien que administra la **reactiva**. Una suspensión guarda el
  motivo, quién suspendió y cuándo, y, si se levanta, quién reactivó y cuándo. **Regla de fondo**:
  mientras dure, para cualquier otra persona (incluida quien administra, salvo en sus dos listas)
  una cuenta suspendida se ve igual que una que no existe: su perfil, sus avales en las dos
  direcciones y sus animales.
- **El historial** de una persona, para quien administra, son sus reportes anteriores (con motivo,
  texto, fecha y cómo se cerró) y sus suspensiones anteriores (con motivo, fechas y quién).
- **El número retenido** es el número de teléfono de una cuenta suspendida que se borró, que no se
  puede verificar durante 12 meses desde el borrado.
- **Quien administra**, **correo de ayuda**, **pedido de identidad**, **nivel 1/2/3**, **aval**
  (vigente, que cuenta, en pausa, retirado, quitado), **perfil público**, **perfil que no existe**,
  **publicación**, **listado**, **ficha**, **enlace**, **vista previa**, **animal que no está
  publicado**, **publicador** y **portada** significan lo mismo que en las specs de las historias
  #9, #10, #11, #12, #25, #53, #57 y #59.
- Toda fecha que se muestra está en hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reportar a una persona y que quien administra lo vea y lo cierre (Priority: P1)

Un adoptante entra al perfil de alguien que le quiso vender un cachorro "en adopción". Toca
«Reportar», elige «Vende animales» y cuenta en dos líneas qué pasó. Se le dice que el reporte llegó,
que es anónimo y que lo vamos a mirar, y se le ofrece bloquear a esa persona. Quien administra abre
la lista de reportes, ve ese reporte con el historial de la persona reportada, y lo cierra sin
medidas o, si corresponde, suspendiendo (US2).

**Why this priority**: es el lado de la historia que más falta hace: sin un lugar donde avisar, el
rescatista escracha en el grupo de Facebook (docs/01 §"Validación" esconde el problema difícil) y
quien prueba la beta no tiene dónde avisarnos. Cerrar sin medidas va acá para que la lista se
pueda usar sola.

**Independent Test**: con dos personas sembradas y una que administra: la primera reporta a la
segunda por «Vende animales»; ve la confirmación y la oferta de bloquear; intenta el mismo motivo
otra vez y se le dice que ya lo hizo; la segunda no ve nada distinto en su perfil ni en «Mi
perfil»; quien administra ve el reporte en la lista con el motivo, el texto, quién lo hizo y el
historial, y lo cierra sin medidas; el reporte sale de la lista y queda en el historial.

**Acceptance Scenarios**:

1. **Dado** que ingresé y miro el perfil público de otra persona, **cuando** la reporto eligiendo
   un motivo, **entonces** se me confirma que el reporte llegó, que es anónimo y que lo vamos a
   mirar, y se me ofrece bloquearla.
2. **Dado** que ya reporté a una persona por un motivo y sigue sin resolver, **cuando** la reporto
   otra vez por el mismo motivo, **entonces** se me dice que ya lo hice y no se suma otro reporte;
   por otro motivo, sí puedo.
3. **Dado** que elegí «Otro», **cuando** envío el reporte sin texto o solo con espacios,
   **entonces** no se envía, lo que elegí queda como estaba y se me pide contar qué pasó.
4. **Dado** que no ingresé, **cuando** toco «Reportar» en un perfil, **entonces** se me pide
   ingresar y al hacerlo vuelvo a ese perfil, con el formulario de reporte abierto; si al volver
   resulta ser mi propio perfil, o una cuenta que ya no se ve, veo esa pantalla sin el formulario.
5. **Dado** que administro el sitio, **cuando** abro la lista de reportes, **entonces** veo los que
   están sin resolver, del más viejo al más nuevo, cada uno con el motivo, el texto, cuándo se hizo,
   quién lo hizo, la persona reportada y su historial.
6. **Dado** que administro el sitio, **cuando** cierro un reporte sin medidas, **entonces** sale
   de la lista, queda en el historial de la persona reportada como cerrado sin medidas, y nadie más
   se entera.
7. **Dado** que administro el sitio y hay un reporte sobre mí, **cuando** abro la lista,
   **entonces** no puedo resolverlo: veo solo que hay un reporte sobre mí que tiene que resolver
   otra persona que administre, sin quién lo hizo, el motivo, el texto ni el historial.
8. **Dado** que otra persona que administra ya resolvió un reporte, **cuando** intento resolverlo,
   **entonces** veo que ya fue resuelto y cómo, y no puedo resolverlo de nuevo.
9. **Dado** que quien reportó borra su cuenta, **cuando** quien administra abre el reporte,
   **entonces** lo sigue viendo, con «una cuenta borrada» en lugar del nombre de quien lo hizo.
10. **Dado** que no administro el sitio, **cuando** intento abrir la lista de reportes,
    **entonces** veo lo mismo que ve cualquiera en una dirección que no existe, sin saber qué hay
    adentro.
11. **Dado** que me reportaron, **cuando** uso el sitio, **entonces** nada me dice que me
    reportaron ni quién lo hizo.

---

### User Story 2 - Suspender una cuenta y reactivarla (Priority: P2)

Quien administra cierra un reporte de estafa suspendiendo la cuenta, con un motivo escrito. La
persona suspendida recibe un correo con el motivo y, la próxima vez que abre el sitio, ve solo que
su cuenta está suspendida, el motivo, a qué correo escribir y la opción de borrar su cuenta. Su
perfil público se ve como uno que no existe, sus animales salen del listado, los avales que dio
dejan de contar y su pedido de identidad abierto se retira. Si fue un error, quien administra la
reactiva desde la lista de cuentas suspendidas: recibe otro correo y todo vuelve como estaba.

**Why this priority**: es lo que hace que el distintivo signifique algo cuando falla; se apoya en
el reporte de US1, aunque también se suspende desde el perfil público.

**Independent Test**: con una persona sembrada con nivel 3, un aval dado a otra persona cuyo único
aval es ese, dos animales a la vista y un reporte sin resolver sobre ella; y otra persona sembrada
con un pedido de identidad en revisión: quien administra suspende a la primera con motivo desde el
reporte y a la segunda desde su perfil; la primera recibe el correo, al entrar ve solo la pantalla de suspendida, su perfil se
ve como uno que no existe, sus animales no están en el listado ni en la portada y su enlace dice
que no está publicado, la avalada baja a nivel 2, el pedido de identidad se retiró y sus imágenes
no están. Quien administra la reactiva: correo, perfil de vuelta, la avalada vuelve a nivel 3, los
animales vuelven al listado con el mismo enlace.

**Acceptance Scenarios**:

1. **Dado** que administro el sitio, **cuando** cierro un reporte suspendiendo la cuenta con un
   motivo, **entonces** esa persona recibe un correo con el motivo, al entrar ve solo que está
   suspendida, su perfil público se ve como uno que no existe y sus animales dejan de aparecer en el
   listado y en la portada.
2. **Dado** que administro el sitio y miro el perfil público de una persona, **cuando** la suspendo
   con un motivo, **entonces** pasa lo mismo que al suspender desde un reporte, y sus reportes sin
   resolver se cierran con esa suspensión.
3. **Dado** que administro el sitio, **cuando** intento suspender sin escribir un motivo (vacío o
   solo espacios), **entonces** no se suspende nada y se me pide el motivo.
4. **Dado** que una persona suspendida avalaba a alguien, **cuando** la suspenden, **entonces** ese
   aval deja de contar y de verse en el perfil y en «Mis avales» de esa otra persona, y, si era su
   único aval, baja a nivel 2; al reactivar, vuelve a verse y a contar.
5. **Dado** que una persona suspendida tenía un pedido de identidad en revisión, **cuando** la
   suspenden, **entonces** el pedido se retira, sus imágenes se borran y deja de verse en la
   revisión, y lo ya verificado de su identidad se conserva.
6. **Dado** que una persona tenía la sesión abierta, **cuando** la suspenden, **entonces** lo
   próximo que abre o intenta hacer la lleva a la pantalla de cuenta suspendida, y lo que intentó
   hacer no se hace.
7. **Dado** que alguien pegó en un grupo el enlace de un animal de una cuenta que después fue
   suspendida, **cuando** otra persona lo abre, **entonces** ve que ese animal no está publicado y
   el camino a Animales en adopción, y la vista previa no muestra foto, nombre ni zona del animal.
8. **Dado** que estoy suspendida, **cuando** toco «Borrar mi cuenta» y confirmo, **entonces** mi
   cuenta se borra como cualquier borrado, con las excepciones de FR-041.
9. **Dado** que administro el sitio, **cuando** reactivo una cuenta desde la lista de suspendidas,
   **entonces** esa persona recibe un correo, puede volver a usar el sitio, sus avales dados vuelven
   a contar y sus animales vuelven al listado con el mismo enlace.
10. **Dado** que no administro el sitio, **cuando** intento abrir la lista de suspendidas o
    suspender a alguien, **entonces** no puedo y no me entero de qué hay adentro.
11. **Dado** que administro el sitio, **cuando** miro mi propio perfil público, **entonces** no
    tengo la opción de suspenderme.

---

### User Story 3 - Bloquear y desbloquear a una persona (Priority: P3)

Una rescatista bloquea a alguien que la acosa desde los comentarios de Facebook. Deja de ver su
perfil y sus animales; los avales que se habían dado se borran; esa persona no se entera y no puede
avalarla. En «Mis bloqueos» ve a quién bloqueó y puede desbloquear; al hacerlo, los animales de esa
persona vuelven a aparecerle, y los avales no vuelven solos.

**Why this priority**: protege a la persona en el momento, sin esperar a que alguien que
administra resuelva; es independiente de la suspensión.

**Independent Test**: con dos personas sembradas con nivel 3 que se avalan entre sí (cada una
avalada solo por la otra) y animales publicados por la segunda: la primera bloquea a la segunda;
su perfil le muestra la pantalla de perfil bloqueado; la primera baja a nivel 2; el listado y la
portada de la primera no tienen los animales de la segunda ni los cuentan; el enlace de uno le
muestra «lo publicó alguien que bloqueaste»; la segunda ve el perfil de la primera sin «Avalar» y
sin aviso; la primera desbloquea desde «Mis bloqueos» y los animales vuelven, los avales no.

**Acceptance Scenarios**:

1. **Dado** que ingresé y miro el perfil de otra persona, **cuando** la bloqueo y confirmo,
   **entonces** veo la pantalla de perfil bloqueado y se me ofrece reportarla.
2. **Dado** que bloqueé a una persona, **cuando** abro el enlace a su perfil, **entonces** veo que
   la bloqueé y la opción de desbloquearla y de reportarla, no su perfil.
3. **Dado** que la persona que bloqueé me avalaba, **cuando** la bloqueo, **entonces** su aval deja
   de aparecer en mi perfil y, si era el único, bajo a nivel 2; el aval que yo le había dado
   también se borra, sin que se le avise.
4. **Dado** que me bloquearon, **cuando** abro el perfil de quien me bloqueó, **entonces** veo su
   perfil como cualquier visitante, sin la opción de avalarla y sin que se me diga que me bloqueó.
5. **Dado** que bloqueé a quien publicó a Tobi, **cuando** abro Animales en adopción, **entonces**
   Tobi no aparece ni cuenta en la cantidad de arriba, y si abro su enlace veo que lo publicó alguien
   que bloqueé, con la opción de desbloquear.
6. **Dado** que desbloqueo a esa persona, **cuando** vuelvo al listado, **entonces** Tobi vuelve a
   aparecer, y el aval que nos habíamos dado no vuelve, pero cualquiera de las dos puede darlo de
   nuevo.
7. **Dado** que abro «Mis bloqueos», **cuando** no bloqueé a nadie, **entonces** veo «No bloqueaste
   a nadie» y qué hace un bloqueo.
8. **Dado** que no ingresé, **cuando** toco «Bloquear» en un perfil, **entonces** se me pide
   ingresar y al hacerlo vuelvo a ese perfil, con la confirmación de bloquear abierta.
9. **Dado** que me bloquearon, **cuando** abro el listado, **entonces** veo los animales de quien me
   bloqueó como cualquier visitante.

---

### User Story 4 - El número de una cuenta suspendida no vuelve verificado en otra (Priority: P4)

Alguien suspendido abre otra cuenta e intenta verificar su mismo número; no puede, ni quedándose
con el número, y se le dice a qué correo escribir. Si borra la cuenta suspendida, el número sigue
sin poder verificarse 12 meses desde el borrado; después, vuelve a poder usarse.

**Why this priority**: sin esto la suspensión se esquiva en cinco minutos; depende de US2.

**Independent Test**: con una persona sembrada suspendida con teléfono verificado: otra cuenta
pide el código a ese número, lo escribe bien, y ve que ese número no se puede usar y el correo de
ayuda, sin el camino de quedarse con el número; la suspendida borra su cuenta; la otra cuenta lo
intenta de nuevo y sigue sin poder; con la fecha llevada a 12 meses y un día después del borrado,
puede.

**Acceptance Scenarios**:

1. **Dado** que la cuenta de una persona suspendida tenía su teléfono, **cuando** otra cuenta
   intenta verificar ese número, **entonces** no puede, y se le dice que ese número no se puede usar
   y a qué correo escribir.
2. **Dado** lo mismo, **cuando** la otra cuenta intenta quedarse con el número por el camino de
   #25, **entonces** ese camino no se ofrece y ve el mismo aviso.
3. **Dado** que una persona suspendida borró su cuenta hace 3 meses, **cuando** abre una cuenta
   nueva e intenta verificar el mismo número, **entonces** no puede, y se le dice a qué correo
   escribir; si lo intenta pasados 12 meses del borrado, puede.
4. **Dado** que reactivaron la cuenta suspendida, **cuando** otra cuenta intenta verificar su
   número, **entonces** ve «Ese número está en otra cuenta» con sus caminos de siempre (#10, #25).

---

### Edge Cases

- **Reportarse o bloquearse a sí misma**: en el propio perfil no aparecen «Reportar», «Bloquear»
  ni «Suspender»; un intento por otro camino no hace nada y dice que no se puede.
- **Reportar o bloquear a una cuenta suspendida o borrada**: su perfil se ve como uno que no
  existe, así que no hay botones. Si se borra mientras alguien tiene el formulario abierto, al
  enviar se ve que el perfil no existe y no se guarda nada. Si se suspende mientras tanto, también
  se ve que el perfil no existe, como lo vería cualquiera; si quien envía la había bloqueado, el
  reporte se guarda (FR-002).
- **Reportar a alguien que ya bloqueé**: se reporta desde la pantalla de perfil bloqueado; la
  confirmación no ofrece bloquear, porque ya está bloqueada.
- **Bloquear a alguien que ya bloqueé** (dos pestañas, doble toque): queda un solo bloqueo y se ve
  la pantalla de perfil bloqueado. **Desbloquear dos veces**: la segunda no hace nada y dice que ya
  estaba desbloqueada.
- **Bloqueo mutuo**: cada una ve la pantalla de perfil bloqueado de la otra y deja de ver sus
  animales; ninguna se entera de que la otra también la bloqueó.
- **Una bloqueada y un aval que había quitado**: si yo había quitado un aval de esa persona
  (historia #12), desbloquearla no lo habilita: la quita sigue valiendo.
- **Avalar con una pantalla vieja**: si la bloqueada tenía abierto el perfil de quien la bloqueó y
  toca «Avalar», el aval no se da y se le dice que no se pudo avalar, sin decir por qué; lo mismo
  para quien bloqueó con una pantalla vieja de la bloqueada.
- **Quien administra bloquea a alguien**: ve su perfil como perfil bloqueado, que para quien
  administra suma «Suspender»: bloquear no le quita la herramienta.
- **Quien administra reportada por otra que administra**: ve el reporte sobre sí en la lista sin
  poder resolverlo, y tampoco puede suspenderse; la otra sí.
- **Dos personas que administran suspenden a la misma a la vez**: queda una sola suspensión; la
  segunda ve que la cuenta ya estaba suspendida, por quién y cuándo. Lo mismo al reactivar: la
  segunda ve que ya estaba reactivada.
- **Suspender a una cuenta con varios reportes sin resolver**: todos se cierran con la misma
  suspensión y salen de la lista; quedan en el historial.
- **Una cuenta reactivada que vuelve a ser reportada**: el reporte nuevo trae en el historial la
  suspensión anterior, con su motivo y sus fechas.
- **Suspender a otra persona que administra**: se puede; mientras esté suspendida no puede abrir
  ninguna pantalla de administración.
- **Reportes sobre alguien que borra su cuenta**: se borran, salen de la lista y del historial. Si
  quien administra estaba por cerrar uno de ellos, o por suspender o reactivar esa cuenta, se le
  dice que esa cuenta ya no existe, no se guarda nada, y el ítem sale de su lista.
- **Quien administra borra su cuenta**: los reportes que cerró y las suspensiones que hizo o
  levantó siguen, con «una cuenta borrada» en lugar de su nombre.
- **Una persona bloqueada que después suspenden**: para quien la bloqueó sigue valiendo el bloqueo
  (perfil bloqueado, animal de alguien que bloqueaste), así que nada le cambia y no se entera de la
  suspensión; si desbloquea, ve lo que ve cualquiera: un perfil que no existe. En «Mis bloqueos»
  sigue figurando.
- **Quien me bloqueó y después fue suspendida**: veo su perfil como uno que no existe, como
  cualquiera.
- **Quien reportó fue suspendida después**: el reporte sigue en la lista con su nombre; para quien
  administra el nombre lleva la marca de que esa cuenta está suspendida.
- **El vencimiento durante la suspensión**: el tiempo suspendido no cuenta para el vencimiento de
  sus publicaciones (historia #59): al reactivar, a cada una le quedan los días que le quedaban al
  suspender, así que la que estaba a la vista vuelve al listado. Si le quedaban 7 días o menos, el
  correo «¿sigue disponible?» que no había salido sale después de reactivar; mientras dure la
  suspensión no sale ninguno. Una que ya estaba vencida, pausada o adoptada al suspender vuelve
  igual. Un correo que ya había salido antes de suspender no se repite; el que sale después de
  reactivar sale en el mismo ciclo que cualquier otro (historia #59). Un enlace «Sigue disponible» de
  un correo anterior, abierto durante la suspensión, no renueva nada: con la sesión de la persona
  suspendida lleva a la pantalla de cuenta suspendida; sin sesión, o con otra, muestra la pantalla
  de enlace que no sirve de la historia #59, sin motivo ni nada que diga que hay una suspensión.
- **Publicaciones por revisar**: las de una cuenta suspendida salen de la lista mientras dure la
  suspensión y vuelven al reactivar si seguían sin revisar.
- **La suspendida que vuelve a ingresar**: puede ingresar como siempre; entra a la pantalla de
  cuenta suspendida. Puede cerrar sesión y mirar el sitio como cualquier visitante.
- **Un número que la suspendida estaba cambiando** (número a medias, historia #10): se retiene solo
  el número verificado de la cuenta al momento de borrarse; si no tenía ninguno, no queda nada.
- **Un número retenido que alguien verificó antes de la suspensión en otra cuenta**: no aplica; un
  número verificado está en una sola cuenta (historia #10).
- **Falla el correo de suspensión o reactivación**: la suspensión o la reactivación vale igual; el
  correo no se reintenta, y la pantalla de cuenta suspendida dice lo mismo que el correo.
- **Sin conexión o error del sitio** al reportar, bloquear, desbloquear, cerrar un reporte,
  suspender o reactivar: no cambia nada, lo escrito se conserva, se dice que no se pudo y se puede
  reintentar.
- **Texto de 1000 caracteres**: se muestra cuánto queda; no se puede escribir más allá del límite.
  El motivo de suspensión tiene el mismo límite.
- **Lo que nota la bloqueada**: el aval que se borra desaparece de su perfil y de «Mis avales» sin
  aviso, igual que cuando alguien retira un aval o lo quita (historia #12); en el perfil de quien la
  bloqueó, donde estaría «Avalar» no hay nada, sin texto que explique por qué.
- **Suspender a alguien que tenía la sesión abierta en dos dispositivos**: los dos llevan a la
  pantalla de cuenta suspendida en lo próximo que abren.
- **Reportes repetidos después de cerrados**: un reporte cerrado sin medidas no impide reportar de
  nuevo por el mismo motivo; el nuevo trae el anterior en el historial.

## Pantallas

En todas: el **cargando** de una pantalla con datos es un esqueleto con su forma; el **error al
cargar** dice que no se pudo traer y ofrece «Reintentar»; cada **acción** muestra que está
trabajando en su botón, no se puede tocar dos veces y, si falla, dice qué pasó y deja reintentar
sin perder lo elegido ni lo escrito (FR-030).

- **Perfil público** (de #12): para quien ingresó y mira el perfil de otra persona, suma
  «Reportar» y «Bloquear», en un lugar secundario, debajo de lo demás; para quien administra suma
  «Suspender». Sin sesión, «Reportar» y «Bloquear» se muestran y llevan a ingresar. En el perfil de
  quien me bloqueó no hay «Avalar» ni ningún texto en su lugar. Vacío: no aplica. Cargando y error:
  los de #12.
- **Reportar a una persona**: el nombre de la persona, los seis motivos (se elige uno), el texto
  con cuánto queda (obligatorio solo con «Otro»), y el aviso de que es anónimo: la persona no se
  entera de que la reportaron ni de quién fue. Al terminar, la confirmación: llegó, es anónimo, lo
  vamos a mirar y no le vamos a contar el resultado; «Bloquear a <nombre>» (si no estaba bloqueada)
  y «Volver al perfil». Vacío: no aplica.
- **Bloquear**: una confirmación que dice qué hace un bloqueo (dejás de ver su perfil y sus
  animales, se borran los avales entre ustedes, no se entera, lo podés deshacer en «Mis
  bloqueos») y «Bloquear» / «Cancelar». Al salir bien, la pantalla de perfil bloqueado con
  «Reportar». Vacío: no aplica.
- **Perfil bloqueado**: que bloqueaste a esta persona, con su nombre, «Desbloquear» y «Reportar»
  (y «Suspender» para quien administra). Sin foto, nivel ni nada más del perfil. Al desbloquear, se
  ve su perfil. Vacío: no aplica. Cargando y error: los del perfil público.
- **Animal de alguien que bloqueaste**: lo que ve quien bloqueó al abrir el enlace de un animal de
  la persona bloqueada: que lo publicó alguien que bloqueaste, sin foto, nombre ni zona del animal,
  con «Desbloquear» y el camino a Animales en adopción; al desbloquear, se ve la ficha. Vacío: no
  aplica. Cargando y error: los de la ficha.
- **Animales en adopción** (de #57) **y la portada**: para quien bloqueó, sin los animales de quien
  bloqueó, ni en la cantidad; para todos, sin los de las cuentas suspendidas. Vacío, cargando y
  error: los de #57 y la portada.
- **Mis bloqueos** (desde «Mi perfil»): a quiénes bloqueé, del más reciente al más viejo, con
  nombre y foto, desde cuándo, y «Desbloquear» en cada uno. Al desbloquear, sale de la lista y se
  confirma «Desbloqueaste a <nombre>». Vacío: «No bloqueaste a nadie» y qué hace un bloqueo.
- **Lista de reportes** (desde «Mi perfil», solo para quien administra, con cuántos hay sin
  resolver): los sin resolver, del más viejo al más nuevo; cada uno con el motivo, el texto, cuándo,
  quién lo hizo (o «una cuenta borrada»), la persona reportada con el enlace a su perfil y su
  historial; «Cerrar sin medidas» (con una confirmación) y «Suspender». De los reportes sobre quien mira se ve solo una
  línea: cuántos hay y que los tiene que resolver otra persona que administre, sin quién, motivo,
  texto, historial ni acciones. Uno ya cerrado por otra persona dice cómo y
  por quién, sin acciones. Al cerrar, el reporte sale de la lista y se confirma cómo se cerró.
  Vacío: «No hay reportes sin resolver».
- **Suspender** (desde el perfil público, el perfil bloqueado o un reporte): el nombre de la
  persona, el campo del motivo con cuánto queda, el aviso de que la persona va a leer el motivo tal
  cual y que no tiene que nombrar a nadie que haya reportado, qué va a pasar (no va a poder usar el
  sitio, su perfil, sus avales y sus animales dejan de verse, recibe un correo con este motivo) y
  «Suspender» / «Cancelar». Al salir bien desde el perfil, se llega a Cuentas suspendidas con la
  confirmación «Suspendiste a <nombre>»; desde un reporte, el reporte sale de la lista con la misma
  confirmación. Vacío: no aplica.
- **Cuentas suspendidas** (desde «Mi perfil», solo para quien administra): de la suspensión más
  reciente a la más vieja; cada una con nombre, el motivo, quién suspendió y cuándo, y «Reactivar»
  con una confirmación. Al reactivar, sale de la lista y se confirma «<nombre> puede volver a usar
  el sitio». Vacío: «No hay cuentas suspendidas».
- **Cuenta suspendida**: lo único que ve la persona suspendida con sesión, abra lo que abra: que su
  cuenta está suspendida, el motivo, desde cuándo, a qué correo escribir si cree que es un error,
  «Borrar mi cuenta» (con la confirmación y los errores del borrado de siempre) y «Salir». Sin menú
  del sitio. Vacío: no aplica. Cargando y error: los de cualquier pantalla.
- **«Ese número no se puede usar»**: lo que ve quien escribe bien el código de un número de una
  cuenta suspendida o retenido: que ese número no se puede usar en el sitio, a qué correo escribir,
  y «Verificar otro número». Sin decir de quién es ni por qué. Vacío: no aplica. Reemplaza, solo en
  ese caso, a «Ese número está en otra cuenta».
- **Correos**: «Suspendimos tu cuenta» con el motivo, qué significa, que puede borrar su cuenta y
  el correo de ayuda; «Tu cuenta está activa de nuevo» con el enlace al sitio. Ninguno dice quién
  reportó ni quién suspendió. Vacío: no aplica.

## Requirements *(mandatory)*

### Functional Requirements

#### Reportar

- **FR-001**: Solo quien ingresó puede reportar; sin sesión, «Reportar» lleva a ingresar y vuelve
  al mismo perfil con el reporte abierto.
- **FR-002**: Se reporta desde el perfil público de una persona, o desde la pantalla de perfil
  bloqueado. No se puede reportar a una misma, ni a una cuenta borrada. A una cuenta suspendida no
  se llega desde su perfil (se ve como uno que no existe); el único camino es el perfil bloqueado
  de quien la bloqueó (FR-017a), y ese reporte se guarda como cualquier otro, para que quien la
  bloqueó no se entere de la suspensión.
- **FR-003**: El motivo es uno de: estafa, maltrato animal, vende animales, se hace pasar por otra
  persona, acoso, otro. El texto es opcional, hasta 1000 caracteres; con «otro» es obligatorio y
  uno hecho solo de espacios cuenta como vacío.
- **FR-004**: Mientras un reporte de una persona sobre otra por un motivo esté sin resolver, otro
  igual no se suma: se le dice a quien reporta que ya lo hizo. Por otro motivo, sí.
- **FR-005**: Después de reportar se confirma que llegó, que es anónimo, que se va a mirar y que no
  se le va a contar el resultado, y se ofrece bloquear si no estaba bloqueada.
- **FR-006**: La persona reportada nunca se entera de que la reportaron ni de quién lo hizo: nada
  de lo que ve en el sitio ni en un correo cambia por un reporte.

#### La lista de reportes y cerrar

- **FR-007**: Solo quien administra abre la lista de reportes; para cualquier otra persona, con o
  sin sesión, se ve como una dirección que no existe.
- **FR-008**: La lista muestra los reportes sin resolver del más viejo al más nuevo, cada uno con
  el motivo, el texto, cuándo se hizo, quién lo hizo (o «una cuenta borrada»), la persona reportada
  y su historial.
- **FR-009**: Quien administra cierra un reporte sin medidas, o suspendiendo la cuenta con un
  motivo escrito (FR-018). Queda registrado quién lo cerró, cuándo y cómo.
- **FR-010**: Nadie cierra un reporte sobre sí misma ni se suspende a sí misma. Quien administra
  y fue reportada no ve de esos reportes quién los hizo, el motivo, el texto ni su historial: solo
  que existen y que los resuelve otra persona.
- **FR-011**: Un reporte se cierra una sola vez: si ya lo cerró otra persona que administra, se ve
  que ya fue resuelto, cómo y por quién, y no se puede cerrar de nuevo.
- **FR-012**: Al suspender una cuenta, por cualquier camino, todos sus reportes sin resolver se
  cierran con esa suspensión.
- **FR-013**: Quien reportó no se entera de cómo terminó su reporte.

#### Bloquear

- **FR-014**: Solo quien ingresó bloquea, desde el perfil público de otra persona, con
  confirmación; sin sesión lleva a ingresar y vuelve a ese perfil. No se bloquea a una misma ni a
  una cuenta suspendida o borrada.
- **FR-015**: Quien bloquea ve, en el enlace del perfil de la bloqueada, la pantalla de perfil
  bloqueado, y en el enlace de cualquier animal de la bloqueada, la pantalla de animal de alguien
  que bloqueó; los animales de la bloqueada no aparecen en su listado, en la cantidad del listado ni
  en la portada.
- **FR-015a**: El listado y la portada de quien bloqueó se arman con los animales que puede ver:
  las páginas del listado siguen siendo de 24 y la portada muestra hasta 8, sin huecos. Las pantallas
  de administración (Publicaciones por revisar, la lista de reportes) no cambian por un bloqueo de
  quien administra.
- **FR-016**: Bloquear borra los avales vigentes entre las dos, en las dos direcciones, en el
  momento, sin avisarle a nadie; los niveles de las dos se recalculan. Mientras dure el bloqueo, ninguna de las dos puede
  avalar a la otra. Desbloquear no devuelve los avales, pero permite volver a darlos (salvo una
  quita de la historia #12, que sigue valiendo).
- **FR-017**: La persona bloqueada no se entera: ve el perfil y los animales de quien la bloqueó
  como cualquier visitante, salvo que donde estaría «Avalar» no hay nada; un intento de avalar dice
  que no se pudo, sin decir por qué; un aval borrado por el bloqueo desaparece de lo que ve sin
  aviso, como uno retirado o quitado (historia #12).
- **FR-017a**: Para quien bloqueó, el bloqueo gana sobre cualquier otra cosa que le pase a la
  bloqueada (incluida una suspensión): ve el perfil bloqueado y el animal de alguien que bloqueó.
- **FR-017b**: «Mis bloqueos» lista a quién bloqueé y permite desbloquear; al desbloquear, el perfil
  y los animales de esa persona vuelven a verse como antes.

#### Suspender y reactivar

- **FR-018**: Solo quien administra suspende, desde el perfil público (o bloqueado) de la persona o
  desde un reporte, siempre con un motivo escrito de hasta 1000 caracteres (no vacío ni solo espacios).
  Queda registrado quién suspendió y cuándo.
- **FR-019**: Una cuenta suspendida no puede hacer nada en el sitio: con sesión, cualquier pantalla
  o acción la lleva a la pantalla de cuenta suspendida, que muestra el motivo, desde cuándo, el
  correo de ayuda, borrar la cuenta y salir. Vale también para una sesión abierta antes de la
  suspensión, desde lo próximo que abre o intenta hacer. Un enlace «Sigue disponible» de un correo
  anterior no renueva nada (ver Edge Cases: sin la sesión de la suspendida no muestra el motivo).
- **FR-020**: Mientras dure la suspensión: su perfil público se ve como uno que no existe, para
  todos, incluida quien administra (salvo FR-017a); sus avales, dados y recibidos, dejan de contar y
  de verse en el perfil y en «Mis avales» de la otra persona, y los niveles se recalculan; su pedido
  de identidad abierto se retira y sus imágenes se borran; sus publicaciones salen del listado, de
  la portada y de Publicaciones por revisar, y sus enlaces y sus vistas previas se ven como los de
  un animal que no está publicado; el tiempo no cuenta para el vencimiento de sus publicaciones y no
  recibe correos «¿sigue disponible?». Nada de lo que ve otra persona dice que la cuenta está
  suspendida.
- **FR-021**: La persona suspendida recibe un correo con el motivo y el correo de ayuda, en el
  momento de la suspensión.
- **FR-022**: Solo quien administra reactiva, desde la lista de cuentas suspendidas, con
  confirmación. Queda registrado quién y cuándo. La persona recibe un correo.
- **FR-023**: Al reactivar, la cuenta vuelve a funcionar como antes: su perfil vuelve a verse, sus
  avales en las dos direcciones vuelven a verse y a contar (si siguen teniendo el nivel que piden),
  sus publicaciones vuelven con el mismo enlace, en el estado en que quedaron y con los días que les
  quedaban, y su identidad verificada sigue valiendo. El pedido de identidad retirado
  no vuelve.
- **FR-024**: Una suspensión se levanta solo a mano; no hay suspensiones por tiempo.
- **FR-025**: Solo quien administra ve los reportes, quién los hizo, y las suspensiones; la lista de
  cuentas suspendidas, para cualquier otra persona, se ve como una dirección que no existe.

#### El número de una cuenta suspendida

- **FR-026**: El número verificado de una cuenta suspendida no se puede verificar en otra cuenta:
  quien escribe bien el código ve «Ese número no se puede usar» con el correo de ayuda, y no se le
  ofrece quedarse con el número (historia #25).
- **FR-027**: Si una cuenta suspendida se borra, su número verificado queda retenido 12 meses desde
  el borrado: nadie lo puede verificar, con el mismo aviso de FR-026. Pasado ese plazo, el número
  retenido se borra solo y vuelve a poder usarse.
- **FR-028**: Del número retenido se guarda solo el número y hasta cuándo no se puede usar: sin el
  motivo, sin el nombre, sin nada que lo una a la cuenta borrada. Nadie lo ve en el sitio, tampoco
  quien administra; sirve solo para rechazar ese número al verificar.
- **FR-029**: Al reactivar una cuenta, su número vuelve a comportarse como cualquier número
  verificado (historias #10 y #25).

#### Errores

- **FR-030**: Si reportar, bloquear, desbloquear, cerrar un reporte, suspender o reactivar falla
  (conexión o error del sitio), no cambia nada, se conserva lo elegido y lo escrito, se dice que no
  se pudo y se puede reintentar; el doble toque no crea dos.
- **FR-031**: Si falla el envío de un correo de suspensión o reactivación, la suspensión o la
  reactivación vale igual.
- **FR-032**: Si la cuenta sobre la que quien administra actúa (cerrar un reporte, suspender,
  reactivar) se borró mientras tanto, se le dice que esa cuenta ya no existe y no se guarda nada.
  Si quien administra deja de administrar mientras tanto, la acción no se hace.
- **FR-033**: Donde se muestra quién suspendió, quién reactivó, quién cerró o quién reportó, una
  cuenta que ya no existe se muestra como «una cuenta borrada».

#### Datos personales

- **FR-040**: Se guarda quién reportó a quién, con qué motivo, qué escribió, cuándo y cómo se
  cerró; quién bloqueó a quién y desde cuándo; y quién suspendió o reactivó una cuenta, cuándo y
  por qué. Lo puede leer solo quien administra, salvo los bloqueos, que lee además quien bloqueó
  (los suyos). Como dice la historia, quien administra puede leer los bloqueos, aunque ninguna
  pantalla de esta historia se los muestra: quedan para el panel de M4.
- **FR-041**: Al borrar una cuenta se borran sus bloqueos (los que hizo y los que recibió), los
  reportes sobre ella y sus suspensiones; los reportes que hizo siguen, sin su nombre. Si estaba
  suspendida, queda el número retenido (FR-027, FR-028).
- **FR-042**: Nadie puede leer, por ningún camino, lo que no le toca: los reportes, ni la reportada,
  ni quien no administra, ni un visitante; un bloqueo, ni la bloqueada ni nadie más que quien
  bloqueó y quien administra; una suspensión, nadie más que la suspendida y quien administra; un
  número retenido, nadie.

#### Medición

- **FR-050**: Se miden reportes por motivo, bloqueos y desbloqueos, suspensiones y reactivaciones,
  y cuánto tarda un reporte en cerrarse. Ningún evento lleva datos de la persona reportada,
  bloqueada ni suspendida.

### Key Entities *(include if feature involves data)*

- **Reporte**: quién reportó (o nadie, si borró su cuenta), a quién, motivo, texto, cuándo, y al
  cerrarse: cómo (sin medidas o suspendiendo), quién lo cerró y cuándo.
- **Bloqueo**: quién bloqueó, a quién, desde cuándo.
- **Suspensión**: de qué cuenta, motivo, quién suspendió y cuándo; si se levantó, quién reactivó y
  cuándo. Una cuenta tiene a lo sumo una suspensión vigente; las anteriores quedan en su historial.
- **Número retenido**: un número de teléfono y hasta cuándo no se puede verificar. Nada más.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona con sesión reporta a otra desde su perfil en no más de 3 toques más el
  texto (abrir, elegir el motivo, enviar).
- **SC-002**: En el 100 % de los intentos de prueba, la persona reportada, la bloqueada, quien no
  administra y un visitante sin sesión no pueden leer reportes, bloqueos ajenos, suspensiones ni
  números retenidos.
- **SC-003**: En la primera pantalla que se abre después de confirmar una suspensión (sin esperar
  ningún plazo), ninguno de sus animales aparece en el listado ni en la portada, su perfil se ve
  como uno que no existe, y la persona suspendida ve la pantalla de cuenta suspendida.
- **SC-004**: Al reactivar, el 100 % de los enlaces de sus animales que estaban a la vista vuelven a
  mostrar la ficha, sin cambiar.
- **SC-005**: En el 100 % de los intentos, el número de una cuenta suspendida, o retenido dentro de
  sus 12 meses, no se verifica en otra cuenta; pasado el plazo, sí.
- **SC-006**: Quien administra ve en «Mi perfil» cuántos reportes hay sin resolver, y la medición
  permite calcular, por semana, cuántos reportes hubo por motivo y la mediana de horas hasta
  cerrarlos, sin ningún dato de la persona reportada.

## Assumptions

- Ya en main (Ready): nada de esta historia. No hay reportes, bloqueos ni suspensiones; lo que hay
  sobre avales quitados (historia #12) es otra cosa, y sigue valiendo.
- La historia no tiene comentarios; su cuerpo es la fuente. Las referencias como «docs/01
  §"Validación"» y «docs/03 §1» son a documentos del proyecto. «Ley 18.331» es una ley, no un
  código.
- **Decisiones del enjambre**: las ocho de la historia se copian palabra por palabra a docs/03 §1,
  §3 y §6 y a docs/01 §Legal / datos en esta rama. La de docs/01 la proponía el PR #97, que sigue
  abierto: siguiendo la decisión del 2026-09-30, la escribe el PR de esta historia y #97 se cierra
  citándolo.
- **Suspender cierra todos los reportes sin resolver de esa cuenta** (decisión de esta spec): un
  reporte sobre alguien ya suspendido no tiene otra medida posible, y dejarlo en la lista es
  trabajo repetido para quien administra.
- **Un reporte se ve en la lista aunque sea sobre quien mira**, sin acciones: así sabe que existe y
  que otra persona lo tiene que resolver (criterio de la historia).
- **Suspender desde el perfil público, no desde la lista de suspendidas**: la historia ubica ahí y
  en el reporte la acción; reactivar va en la lista de suspendidas.
- **Reactivar no pide motivo**: la historia pide motivo solo al suspender; se registra quién y
  cuándo.
- **El motivo de suspensión tiene hasta 1000 caracteres**, como el texto del reporte, y lo lee la
  persona suspendida tal cual en el correo y en su pantalla.
- **Las publicaciones de una cuenta suspendida conservan su estado**: la suspensión no es un
  estado de la publicación (historia #59) sino de quien publica, como el nivel 1 en la historia #57.
- **Publicaciones por revisar no muestra las de una cuenta suspendida**: nadie las ve mientras
  dure, y vuelven a la lista al reactivar si seguían sin revisar.
- **La pantalla de animal de alguien que bloqueaste no muestra foto, nombre ni zona del animal**:
  quien bloquea dejó de querer ver a esa persona, y entre dos opciones se toma la que muestra menos.
- **La vista previa de un animal de alguien bloqueado no cambia**: la vista previa es la misma para
  todos y no sabe quién la mira.
- **El perfil bloqueado muestra solo el nombre**: alcanza para saber a quién se bloqueó.
- **«Mis bloqueos» muestra nombre y foto de cada persona bloqueada**, incluso si después la
  suspendieron: no revela la suspensión, y una cuenta borrada sale de la lista porque su bloqueo se
  borra.
- **Reportar desde la pantalla de perfil bloqueado** se ofrece como pide «Pantallas»; reportar a
  quien me bloqueó también se puede, porque la bloqueada ve el perfil como cualquiera.
- **Las listas de administración no se paginan**: en la beta se cuentan de a decenas; si crecen,
  el panel consolidado de M4 (#73) lo resuelve.
- **El historial muestra todos los reportes cerrados y las suspensiones anteriores** de la persona
  mientras su cuenta exista; no hay un plazo menor, porque el antecedente es lo que la historia
  quiere que no se pierda.
- **Quien reportó y después fue suspendida** sigue figurando con su nombre en sus reportes, con la
  marca de suspendida solo para quien administra.
- **Quien administra bloqueada por la reportada** no cambia nada en la administración: los reportes
  y la suspensión no dependen de los bloqueos.
- **El aviso «Ese número no se puede usar» se distingue de «Ese número está en otra cuenta»**, como
  pide la historia: lo ve solo quien escribió bien el código, o sea quien tiene el teléfono en la
  mano (la propia persona suspendida o quien heredó el número de la compañía), y no dice de quién es
  ni por qué. No le muestra la suspensión a ningún tercero.
- **Los reportes, bloqueos y suspensiones se guardan hasta que se borra la cuenta**, sin un plazo
  menor: es lo que dice la historia en «Datos personales», y el historial es lo que quien administra
  necesita para ver patrones. Se avisa en Ship como decisión de privacidad.
- **No hay tope de reportes ni de bloqueos por persona**: la historia no lo pide, la beta es cerrada
  y quien administra ve quién reporta. Un mismo motivo no se repite mientras esté sin resolver. Si
  aparece abuso, es un seguimiento.
- **En el historial, la persona reportada figura con su nombre** mientras su cuenta exista; si está
  suspendida, con la marca de suspendida. Su perfil, para quien administra, se ve como uno que no
  existe mientras esté suspendida: se llega a ella desde Cuentas suspendidas.
- **El tiempo suspendido no cuenta para el vencimiento** (decisión de esta spec): la historia pide
  que los animales vuelvan al listado con el mismo enlace al reactivar; si el reloj siguiera, una
  suspensión de más de 30 días los dejaría vencidos y la reactivación no los devolvería.
- **El bloqueo gana sobre la suspensión para quien bloqueó** (decisión de esta spec): si le
  cambiara la pantalla al suspender a la bloqueada, se enteraría de la suspensión.
- **Un reporte sobre una cuenta suspendida** (solo llega desde el perfil bloqueado, FR-002) entra a
  la lista sin resolver con la marca de que la cuenta ya está suspendida, y quien administra lo
  cierra; suma información para decidir si reactivar.
- **La persona reportada que borra su cuenta se lleva sus reportes**: lo dice la historia en «Datos
  personales». Puede volver con el mismo número si no estaba suspendida. Se acepta y se anota como
  limitación conocida en el PR de esta historia.
- **Que se suspendan entre sí todas las personas que administran** deja sin quien resuelva: se
  acepta, porque quién administra lo designa el equipo por fuera del sitio y lo arregla por fuera.
- **Con «Otro» y un reporte sin resolver**, la misma persona no puede sumar un segundo texto: el
  primero ya está en manos de quien administra, y se le dice que ya lo reportó.
- **El motivo de suspensión puede nombrar a quien reportó** solo si quien administra lo escribe: la
  pantalla le avisa que no lo haga; no hay una comprobación automática.
- **Quien administra puede cerrar un reporte que hizo ella misma**: la historia solo prohíbe
  resolver los reportes sobre una misma.
- **La portada de quien bloqueó tampoco muestra los animales de la bloqueada** (decisión de esta
  spec): la historia dice que quien bloquea deja de ver sus animales; es la única diferencia de la
  portada con sesión, y se registra en docs/03 §3.
- **Términos nuevos en el glosario** (docs/06): reporte, reportar, bloquear, bloqueo, suspender,
  cuenta suspendida, reactivar y número retenido, con su clave en inglés distinta de «quitar» un aval
  y de la moderación de publicaciones; lo hace el PR de esta historia.
- **La medición de esta historia** es la de su sección «Medición»: la decisión del 2026-10-04 de
  docs/03 («esta historia no suma eventos») es de la historia de la portada.
- **Un reporte sobre una cuenta que ya está suspendida** muestra solo «Cerrar sin medidas» (cerrar
  sin otra medida, porque ya está tomada) y la marca de suspendida, sin enlace al perfil.
- **Reportar a una cuenta suspendida desde el perfil bloqueado se acepta** (decisión de esta spec):
  la regla de la historia «no se reporta a una cuenta suspendida» se cumple en todo camino donde se
  ve la cuenta; en el perfil bloqueado, rechazarlo le contaría la suspensión a quien bloqueó, que la
  decisión «una suspensión no se exhibe» prohíbe. Se registra en docs/03 §1.
- **Quien desbloquea a una persona suspendida** ve un perfil que no existe y puede deducir que no
  se borró: se acepta, porque es lo mismo que ve cualquiera y la otra salida (mostrarle el perfil)
  exhibiría a alguien que el sitio sacó. Se anota como limitación conocida en el PR.
- **El hueco donde estaría «Avalar» en el perfil de quien me bloqueó** se parece al de otros casos
  sin explicación; puede insinuar el bloqueo. Lo pide la historia («sin la opción de avalarla») y se
  acepta.
- **Ocultar en el listado, la portada, Publicaciones por revisar y el reloj del vencimiento** no son
  cosas sumadas al alcance: son lo que la historia pide («que los animales de una cuenta suspendida
  salgan del listado y de sus fichas», «vuelven con el mismo enlace») aplicado a cada pantalla donde
  aparecen. Se avisan en Ship.
- **Las personas en las pantallas se nombran sin género** («la persona reportada», «la persona que
  bloqueaste»), como pide docs/06; «la reportada» es abreviatura de esta spec.
- **Un código por SMS a un número de una cuenta suspendida o retenido** se manda igual: el rechazo
  llega después de escribirlo bien, como «Ese número está en otra cuenta» hoy (historia #10), para no
  contarle a quien prueba números cuáles están retenidos sin probar que tiene el teléfono.
- **El correo de ayuda** es el mismo de la historia #11.
- **Los correos sin dominio propio** (KL-006) solo llegan a la dirección de la cuenta del servicio:
  afecta probarlos, no construirlos. **Los códigos por SMS sin cuenta** (KL-010): la verificación del
  número se prueba con el código escrito a archivo, como hoy.
- **Fuera de esta historia**, como dice su «No incluye»: reportar una publicación (#59); lo que la
  suspensión y el bloqueo hacen con las solicitudes (#63, #65); avisarle a quien reportó cómo
  terminó; apelar desde el sitio; suspensiones por tiempo; avisos automáticos por comportamiento;
  designar a quien administra desde el sitio; liberar a mano un número retenido; el panel
  consolidado (M4, #73); denunciar a las autoridades.
