# Feature Specification: Marcar a quién se entregó cada animal y aceptar entre los dos el compromiso de adopción

**Feature Branch**: `feature/67-entrega-compromiso-adopcion`

**Created**: 2026-10-08

**Status**: Draft

**Input**: Historia #67 del backlog, milestone «M4 - Cierre y seguimiento». El cuerpo verbatim de
la historia acompaña a esta spec (`story.md`).

**Ya construido**: marcar adoptado y volver a publicar desde Mis animales, la ficha adoptada que no
dice nada de quien adoptó (historia #59); la solicitud, Mi solicitud, Mis solicitudes y el límite de
3 activas (historia #63); la bandeja del publicador, aceptar, dejar sin efecto, el teléfono a la
vista de las dos personas de una aceptada con «Abrir WhatsApp» y el cierre de las solicitudes de un
animal adoptado como que encontró hogar, con su correo (historia #65); si el animal está castrado,
en su ficha (historia #53); los distintivos (historia #12); bloquear, suspender y la pantalla de
cuenta suspendida (historia #13); el envío de correos con la plantilla del sitio. En el sitio no
existe nada del vínculo entre un animal y la persona a la que se entregó ni del compromiso de
adopción: hoy marcar adoptado es un toque, sin elegir a nadie, y todas las aceptadas siguen viendo
el teléfono después. Esta spec suma eso y no rehace nada.

**Vocabulario de esta spec**:

- **Solicitud**, **quien solicita**, **el publicador**, **activa**, **aceptada**, **dejar sin
  efecto**, **cerrada**, **motivo de cierre**, **encontró hogar**, **contacto**, **Abrir WhatsApp**,
  **Mis solicitudes**, **Mi solicitud**, **Solicitudes** y **Una solicitud, para el publicador**
  significan lo mismo que en las specs de las historias #63 y #65.
- **Marcar adoptado**, **volver a publicar**, **Mis animales**, **ficha**, **castrado**,
  **bloquear**, **cuenta suspendida**, **reactivar** y **distintivos** significan lo mismo que en
  las specs de las historias #12, #13, #53 y #59.
- **La entrega** es a quién se dio un animal al marcarlo adoptado: **a una persona del sitio**
  (una con la solicitud aceptada para ese animal) o **por fuera del sitio**.
- **La adopción** es el vínculo entre el animal, quien lo publicó y la persona del sitio a la que se
  entregó. Quien adoptó es **la persona que adoptó**; quien publicó, **quien lo dio**.
- Una adopción está **en curso** desde que se marca hasta que **termina** (al volver a publicar el
  animal) o **se deshace** (cuando la persona que adoptó dice «Yo no adopté a <nombre>»).
- **El compromiso de adopción** (docs/06: no es un contrato) es el texto que aceptan las dos
  personas de una adopción. Está **pendiente** desde que quien lo dio lo acepta al marcar hasta que
  la persona que adoptó también lo acepta; entonces queda **aceptado**.
- **El contacto cortado**: una adopción en curso donde, por un bloqueo entre las dos o la
  suspensión de una de las cuentas, el teléfono dejó de verse para siempre.
- Toda fecha se calcula y se muestra en hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marcar adoptado eligiendo a quién se entregó (Priority: P1)

Una rescatista aceptó la solicitud de Ana por Tobi, y también la de Diego. Tobi se va con Ana. En Mis
animales toca «Marcar adoptado» y se le pregunta «¿A quién se lo diste?»: ve a Ana y a Diego, cada
uno con su foto, su nombre y sus distintivos, y «Se lo di a alguien que no vino por el sitio». Elige
a Ana; aparece el compromiso con el nombre de Tobi, el de Ana y el suyo, y el botón «Acepto el
compromiso y marco adoptado a Ana». Lo toca. En Mis animales Tobi figura «Adoptado por Ana», con el
compromiso pendiente de Ana. La solicitud de Diego se cierra como que Tobi encontró hogar y Diego ya
no ve su teléfono; Ana sí. Otro día da a Luna a una vecina que nunca entró al sitio: elige «Se lo di
a alguien que no vino por el sitio» y Luna figura «Adoptada por fuera del sitio», sin compromiso.

**Why this priority**: es el vínculo histórico de docs/03 §5 y el último paso del funnel (docs/03
§7); sin él no se sabe si la solicitud verificada terminó en una adopción. Las otras historias se
apoyan en él.

**Independent Test**: con una publicadora sembrada, un animal suyo con dos solicitudes aceptadas y
una esperando respuesta, y otro animal sin aceptadas: marcar el primero adoptado eligiendo a una de
las aceptadas y leer el compromiso; ver «Adoptado por <nombre>» y el compromiso pendiente en Mis
animales; con la otra aceptada, ver su solicitud cerrada como que encontró hogar y sin el teléfono;
con la elegida, ver el teléfono; marcar el segundo animal y ver que solo se ofrece «por fuera del
sitio», con el camino a Solicitudes.

**Acceptance Scenarios**:

1. **Dado** que acepté la solicitud de Ana por Tobi, **cuando** toco «Marcar adoptado» en Tobi,
   **entonces** se me pregunta «¿A quién se lo diste?» con Ana (su foto, su nombre y sus
   distintivos) y «Se lo di a alguien que no vino por el sitio», sin ninguna elegida.
2. **Dado** que se me pregunta a quién se lo di, **cuando** elijo a Ana, **entonces** leo el
   compromiso con los nombres de Tobi, de Ana y el mío, y el botón «Acepto el compromiso y marco
   adoptado a Ana»; si cancelo o cierro, Tobi no cambia.
3. **Dado** que leí el compromiso, **cuando** toco «Acepto el compromiso y marco adoptado a Ana»,
   **entonces** Tobi queda adoptado, en Mis animales figura «Adoptado por Ana» con «Compromiso
   pendiente de Ana», y Ana recibe un correo para aceptarlo.
4. **Dado** que acepté a Ana y a Diego para Tobi, **cuando** lo marco adoptado eligiendo a Ana,
   **entonces** la solicitud de Diego se cierra como que Tobi encontró hogar, Diego recibe el correo
   de encontró hogar y ya no ve mi teléfono ni yo el suyo; Ana y yo seguimos viendo el de la otra.
5. **Dado** que di a Luna a una vecina que nunca entró al sitio, **cuando** la marco adoptada y
   elijo «Se lo di a alguien que no vino por el sitio», **entonces** se me pide confirmar sin
   compromiso, y al confirmar Luna figura «Adoptada por fuera del sitio», todas sus solicitudes se
   cierran como que encontró hogar, nadie sigue viendo mi teléfono y no se guarda nada de la vecina.
6. **Dado** que Tobi no tiene solicitudes aceptadas, **cuando** toco «Marcar adoptado»,
   **entonces** solo se me ofrece «Se lo di a alguien que no vino por el sitio», con el texto «Si se
   lo vas a dar a alguien que te lo pidió acá, aceptá primero su solicitud» y el camino a las
   solicitudes de Tobi.
7. **Dado** que Tobi ya está castrado, **cuando** leo el compromiso, **entonces** no tiene la línea
   de la castración; con Luna, sin castrar, sí.
8. **Dado** que Ana retiró su solicitud mientras yo elegía, **cuando** confirmo «Acepto el
   compromiso y marco adoptado a Ana», **entonces** Tobi no se marca, veo «Ana ya no sigue con esta
   solicitud» y vuelvo a «¿A quién se lo diste?» con las aceptadas de ahora.
9. **Dado** que se me pregunta a quién se lo di, **cuando** no elijo a nadie, **entonces** no hay
   botón para marcar adoptado.
10. **Dado** que Tobi ya fue marcado adoptado desde otra pestaña, **cuando** confirmo en esta,
    **entonces** no cambia nada y veo cómo quedó Tobi.

---

### User Story 2 - La persona que adoptó acepta el compromiso y las dos lo reciben por correo (Priority: P2)

Ana recibe un correo: «Adoptaste a Tobi». El enlace la lleva a Mi solicitud (si no tiene la sesión
abierta, primero ingresa), donde ve «Adoptaste a Tobi», el compromiso con los tres nombres, «Acepto
el compromiso» y «Yo no adopté a Tobi». Toca «Acepto el compromiso». Las dos reciben un correo con
el texto completo, el nombre y la foto de Tobi, los nombres de las dos y el día en que aceptó cada
una. En Mis animales, la rescatista ve el compromiso aceptado, con la fecha. En Mis solicitudes, Ana
ve «Adoptaste a Tobi», que no cuenta entre sus activas, y sigue viendo el teléfono de la rescatista
con «Abrir WhatsApp».

**Why this priority**: es el «ambos aceptan» y el «queda por email» de docs/03 §5, el trabajo que
el sitio le ahorra al rescatista que hoy redacta su propio acuerdo por WhatsApp. Se apoya en US1.

**Independent Test**: con una adopción recién marcada a una persona sembrada: ver el correo de
«Adoptaste a <nombre>» y seguir su enlace sin sesión y con sesión; ver el compromiso y aceptarlo;
ver los dos correos con el compromiso; ver la fecha en Mis animales, en Una solicitud para el
publicador, en Mi solicitud y en Mis solicitudes; tocar dos veces y ver un solo correo por persona;
dejar otra adopción sin aceptar y comprobar que no sale ningún otro correo.

**Acceptance Scenarios**:

1. **Dado** que Ana fue elegida, **cuando** abre el correo y sigue el enlace, **entonces** llega a
   Mi solicitud (ingresando primero si no tenía sesión) y ve «Adoptaste a Tobi», el compromiso con
   los nombres de Tobi, de Ana y de quien se lo dio, «Acepto el compromiso» y «Yo no adopté a Tobi».
2. **Dado** que Ana ve el compromiso, **cuando** toca «Acepto el compromiso», **entonces** queda
   aceptado con la fecha de hoy, y las dos recibimos un correo con el compromiso completo, el nombre
   y la foto de Tobi, los nombres de las dos y el día en que aceptó cada una, sin el teléfono de
   nadie.
3. **Dado** que Ana aceptó, **cuando** abro Mis animales o la solicitud de Ana, **entonces** veo
   «Adoptado por Ana» y «Compromiso aceptado el <fecha>»; **cuando** Ana abre Mi solicitud, ve el
   compromiso con el día en que aceptó cada una, y ya no ve «Acepto el compromiso» ni «Yo no adopté
   a Tobi».
4. **Dado** que Ana adoptó a Tobi, **cuando** abre Mis solicitudes, **entonces** ve «Adoptaste a
   Tobi» (con «Compromiso pendiente» si no lo aceptó), no cuenta entre sus 3 activas, y en Mi
   solicitud sigue viendo mi nombre, mi teléfono y «Abrir WhatsApp».
5. **Dado** que Ana nunca aceptó el compromiso, **cuando** pasa un mes, **entonces** Tobi sigue
   «Adoptado por Ana», el compromiso figura pendiente y no se le mandó ningún otro correo.
6. **Dado** que toco dos veces «Acepto el compromiso», **cuando** termina, **entonces** queda
   aceptado una vez y cada una recibe un solo correo.
7. **Dado** que se corta la conexión, **cuando** Ana toca «Acepto el compromiso», **entonces**
   sigue pendiente, se le dice que no se pudo por la conexión y puede reintentar; si el primer
   intento sí había llegado, el reintento no cambia nada ni manda otro correo.
8. **Dado** que abro el enlace del compromiso de una adopción que no es mía, **cuando** carga,
   **entonces** veo que no existe, igual que si no existiera.
9. **Dado** que la cuenta de Ana está suspendida, **cuando** intenta aceptar el compromiso,
   **entonces** no puede, y ve lo mismo que #13 le muestra a una cuenta suspendida.

---

### User Story 3 - «Yo no adopté a <nombre>» para quien fue elegido por error (Priority: P3)

La rescatista eligió a Ana por error: a Tobi se lo llevó Diego. Ana abre Mi solicitud, toca «Yo no
adopté a Tobi» y confirma. La rescatista recibe un correo; en Mis animales, Tobi sigue adoptado y
dice que Ana dijo que no lo adoptó. Ninguna de las dos ve más el teléfono de la otra.

**Why this priority**: el vínculo va a alimentar el historial que llega con el seguimiento (#12), y
un error del rescatista no puede quedar como historia de otra persona. Se apoya en US1 y US2.

**Independent Test**: con una adopción con el compromiso pendiente: decir «Yo no adopté», cancelar
una vez y confirmar la segunda; ver el correo a quien lo dio, el texto en Mis animales y en Una
solicitud para el publicador, el estado de Mi solicitud y de Mis solicitudes, y el teléfono oculto
para las dos; con una adopción ya aceptada, comprobar que no se ofrece.

**Acceptance Scenarios**:

1. **Dado** que me eligieron por error y el compromiso está pendiente, **cuando** toco «Yo no adopté
   a Tobi», **entonces** se me pide confirmar con un texto que dice que quien lo publicó se va a
   enterar y que Tobi sigue adoptado; si cancelo, no cambia nada.
2. **Dado** que confirmé, **cuando** termina, **entonces** mi solicitud se cierra como que Tobi
   encontró hogar, no veo más el teléfono de quien lo publicó ni ella el mío, y ya no veo el
   compromiso ni «Acepto el compromiso».
3. **Dado** que Ana dijo que no adoptó a Tobi, **cuando** abro Mis animales, **entonces** Tobi
   sigue adoptado y dice «Ana dijo que no lo adoptó», y recibí un correo que lo dice y me lleva a
   Mis animales.
4. **Dado** que Ana ya aceptó el compromiso, **cuando** busca «Yo no adopté a Tobi», **entonces** no
   se le ofrece.
5. **Dado** que toco dos veces «Yo no adopté» y confirmo, **cuando** termina, **entonces** se deshace
   una sola vez y quien lo publicó recibe un solo correo.
6. **Dado** que la cuenta de Ana está suspendida, **cuando** intenta decir «Yo no adopté»,
   **entonces** no puede, y ve lo mismo que #13 le muestra a una cuenta suspendida.

---

### User Story 4 - Lo que le pasa a la adopción cuando el animal se vuelve a publicar o se corta el contacto (Priority: P4)

Ana adoptó a Tobi y se lo devolvió a la rescatista. La rescatista toca «Volver a publicar» y se le
pide confirmar con un texto que dice que la adopción con Ana termina. Confirma: Tobi vuelve a
Animales en adopción, Ana ve en Mi solicitud que la adopción de Tobi terminó, ninguna ve más el
teléfono de la otra, y el compromiso sigue a la vista de las dos con sus fechas. En otra adopción,
quien administra suspende a la persona que adoptó: el teléfono deja de verse para las dos y la
adopción sigue registrada con su compromiso como estaba, aunque la cuenta se reactive después.

**Why this priority**: sin esto, el teléfono de quien lo dio queda a la vista de alguien con quien
ya no tiene nada, que es lo que docs/01 §Legal / datos no permite. Se apoya en US1.

**Independent Test**: con una adopción en curso: volver a publicar el animal, cancelar una vez y
confirmar la segunda; ver lo que ve cada una; con otra adopción, bloquear entre las dos y ver el
teléfono oculto y la adopción registrada; con otra, suspender la cuenta de una, reactivarla y ver
que el teléfono sigue oculto.

**Acceptance Scenarios**:

1. **Dado** que Tobi está adoptado por Ana, **cuando** toco «Volver a publicar», **entonces** se me
   pide confirmar con «La adopción con Ana termina: ninguna de las dos va a ver más el teléfono de
   la otra»; si cancelo, no cambia nada.
2. **Dado** que confirmé, **cuando** termina, **entonces** Tobi vuelve a Animales en adopción, Ana
   ve en Mi solicitud que la adopción de Tobi terminó y ya no ve mi teléfono, y el compromiso sigue
   a la vista de las dos con sus fechas (o pendiente, si Ana no lo había aceptado), sin que se pueda
   aceptar más.
3. **Dado** que Luna está «Adoptada por fuera del sitio» o su adopción se deshizo, **cuando** toco
   «Volver a publicar», **entonces** vuelve a publicarse como en #59, sin la confirmación de la
   adopción.
4. **Dado** que Ana adoptó a Tobi, **cuando** una de las dos bloquea a la otra, **entonces** ninguna
   ve más el teléfono de la otra, Tobi sigue «Adoptado por Ana» y el compromiso queda como estaba;
   desbloquear no lo vuelve a mostrar.
5. **Dado** que Ana adoptó a Tobi, **cuando** quien administra suspende mi cuenta o la de Ana,
   **entonces** ninguna de las dos ve más el teléfono de la otra, Tobi sigue «Adoptado por Ana» y el
   compromiso queda como estaba; si después se reactiva la cuenta, el teléfono sigue sin verse.
6. **Dado** que el contacto entre Ana y yo se cortó con el compromiso pendiente, **cuando** Ana abre
   Mi solicitud, **entonces** ve «Adoptaste a Tobi» y el compromiso pendiente, sin «Acepto el
   compromiso» ni «Yo no adopté a Tobi», y donde estaba el teléfono, «El contacto ya no está
   disponible»; no sale ningún correo.
7. **Dado** que Tobi está adoptado por Ana, **cuando** Ana borra su cuenta, **entonces** su
   solicitud y la adopción se borran, Tobi sigue adoptado y en Mis animales figura «Adoptado», sin
   decir a quién.

---

### Edge Cases

- **Tocar dos veces «Acepto el compromiso y marco adoptado a <nombre>», «Acepto el compromiso» o
  «Yo no adopté», o reintentar después de un corte que sí llegó**: se hace una sola vez y sale un
  solo correo por persona; la segunda ve el resultado de la primera.
- **Dos pestañas de quien publicó marcan el mismo animal a la vez**, eligiendo a personas distintas
  o una a una persona y otra «por fuera del sitio»: gana la primera que llega; la otra no cambia
  nada y ve cómo quedó el animal.
- **La persona elegida dejó de estar aceptada mientras quien publicó elegía** (la retiró, la dejó sin
  efecto desde otra pestaña, se bloquearon o una de las cuentas se suspendió): no se marca, se ve
  «<nombre> ya no sigue con esta solicitud» (o, si la dejó sin efecto quien publica, que ya no está
  aceptada) y se vuelve a elegir entre las aceptadas de ahora.
- **El animal cambió mientras se elegía** (se borró, se dio de baja o ya está adoptado): no se
  marca y se ve el estado de ahora.
- **Elegir a una aceptada que hoy no tiene el teléfono verificado**: se puede; la adopción se marca
  y el contacto dice que no tiene un teléfono verificado ahora, como en #65.
- **Marcar adoptado con el teléfono sin verificar**: se puede (#59).
- **Marcar adoptado un animal pausado, vencido o en proceso**: se puede, como en #59, con el mismo
  «¿A quién se lo diste?».
- **Cuántas aceptadas se muestran**: todas las de ese animal, la más vieja arriba; en la beta son
  pocas.
- **«Se lo di a alguien que no vino por el sitio» con aceptadas**: se puede; ninguna queda elegida
  y todas se cierran como que encontró hogar, sin teléfono.
- **El animal se edita después de marcarlo** (por ejemplo, pasa a castrado): el compromiso queda
  como se mostró al marcarlo, con o sin la línea de la castración.
- **Una de las dos personas pierde el teléfono verificado durante la adopción** (otra cuenta
  recupera su número, #25): la otra ve que no tiene un teléfono verificado ahora, sin el número
  viejo y sin «Abrir WhatsApp», como en #65; si vuelve a verificar uno, lo ve. La adopción sigue.
- **La persona que dijo «Yo no adopté» borra su cuenta**: el animal queda «Adoptado», sin nombre.
- **Una de las dos personas cambia su nombre después de marcar**: el compromiso, las pantallas y los
  correos muestran el nombre de hoy.
- **La persona que adoptó llega a Mi solicitud desde un correo con otra cuenta abierta**: ve que la
  solicitud no existe, igual que si no existiera.
- **Aceptar el compromiso cuando la adopción ya terminó, se deshizo o se cortó el contacto** (por
  ejemplo, desde una pantalla vieja): no cambia nada, no sale correo y se ve el estado de ahora.
- **«Yo no adopté» después de aceptar el compromiso, después de que terminó o con el contacto
  cortado**: no se ofrece; si llega desde una pantalla vieja, no cambia nada y se ve el estado de
  ahora.
- **Volver a publicar después de que la persona que adoptó aceptó el compromiso**: termina igual;
  el compromiso queda aceptado, con sus fechas.
- **El animal vuelve a publicarse y vuelve a adoptarse**: es una adopción nueva, con su propio
  compromiso; la anterior queda terminada, con el suyo. La persona de la adopción anterior puede
  volver a solicitarlo como cualquiera cuya solicitud se cerró (#63).
- **La persona que adoptó solicita otros animales**: la adopción no cuenta entre sus 3 activas
  (#63) y no le impide solicitar.
- **Volver a publicar exige el teléfono verificado (#59)**: si falta, se ve el aviso de verificación
  pendiente antes de la confirmación de la adopción, y la adopción sigue en curso.
- **Quien publicó borra el animal o su cuenta**: el animal, la adopción y el compromiso se borran;
  la persona que adoptó ve su solicitud como cualquiera de un animal borrado (#63), sin el
  compromiso ni el teléfono.
- **Quien administra da de baja un animal adoptado**: no pasa; un animal adoptado no está a la
  vista (#59).
- **El correo con el compromiso sale y una de las dos ya no tiene cuenta** (la borró en el mismo
  momento): no le llega a esa; a la otra sí.
- **Un correo que no se pudo mandar**: lo que se hizo queda hecho igual; la persona lo ve en el
  sitio. No se reintenta mandar ni se recuerda.
- **Quien administra**: es una persona más; no ve adopciones ni compromisos ajenos.
- **La persona que adoptó con la cuenta suspendida abre Mi solicitud**: ve la pantalla de cuenta
  suspendida de #13.

## Pantallas

En todas: el **cargando** de una pantalla con datos es un esqueleto con su forma; el **error al
cargar** dice que no se pudo traer y ofrece «Reintentar»; cada **acción** muestra que está
trabajando en su botón, no se puede tocar dos veces y, si falla, dice qué pasó y deja reintentar
sin perder lo elegido. Todas las pantallas de esta historia son privadas y no se encuentran en
buscadores.

- **Marcar adoptado** (cambia, de #59; se abre desde «Marcar adoptado» en Mis animales y en la
  pantalla del animal): «¿A quién se lo diste?», con cada persona aceptada (foto, nombre,
  distintivos) y «Se lo di a alguien que no vino por el sitio», para elegir una sola. Al elegir a
  una persona, el compromiso con los tres nombres y «Acepto el compromiso y marco adoptado a
  <nombre>» / «Cancelar». Al elegir «por fuera del sitio», una línea que dice que no queda
  compromiso ni a quién se dio y «Marcar adoptado» / «Cancelar». Cargando: el esqueleto de la
  lista. Error al cargar las aceptadas: que no se pudieron traer, «Reintentar», y no se puede marcar
  hasta que carguen. Vacío (sin aceptadas): solo la segunda opción, con el texto y el camino a las
  solicitudes del animal.
- **Mis animales** y la pantalla de un animal (cambian, de #59 y #65): un adoptado dice «Adoptado
  por <nombre>», «Adoptado por fuera del sitio», «<nombre> dijo que no lo adoptó» o «Adoptado» (si
  la persona borró su cuenta); con una persona, «Compromiso pendiente de <nombre>» o «Compromiso
  aceptado el <fecha>»; con el contacto cortado, lo mismo, sin cambiar. «Volver a publicar» de un
  adoptado por una persona pide la confirmación de la adopción. Vacío: el de #53.
- **Mi solicitud** (cambia, de #63 y #65): «Adoptaste a <nombre>»; el compromiso; mientras está
  pendiente y en curso, «Acepto el compromiso» y «Yo no adopté a <nombre>»; aceptado, el día en que
  aceptó cada una; el contacto de quien lo dio con «Abrir WhatsApp» mientras la adopción siga en
  curso y sin el contacto cortado, o «El contacto ya no está disponible»; terminada, «La adopción de
  <nombre> terminó» con el compromiso como quedó. Después de «Yo no adopté», la solicitud cerrada
  como que el animal encontró hogar, sin compromiso. Vacío: no aplica.
- **Yo no adopté**: una confirmación que dice que quien lo publicó se va a enterar y que el animal
  sigue adoptado, con «Yo no lo adopté» / «Cancelar».
- **Volver a publicar un adoptado** (cambia, de #59): una confirmación con «La adopción con
  <nombre> termina: ninguna de las dos va a ver más el teléfono de la otra», «Volver a publicar» /
  «Cancelar».
- **Mis solicitudes** (cambia, de #63): el estado «Adoptaste» y, si corresponde, «Compromiso
  pendiente»; terminada, «La adopción terminó». No cuenta entre las activas. Vacío: el de #63.
- **Una solicitud, para el publicador** (cambia, de #65): la elegida dice «Se lo diste a <nombre>»
  y el compromiso con su estado (pendiente, o aceptado con el día en que aceptó cada una), también
  después de que la adopción terminó, con «La adopción terminó»; o que <nombre> dijo que no lo
  adoptó, sin el compromiso; el contacto, como en Mi solicitud, o «El contacto ya no está
  disponible». Las otras del animal, cerradas
  como que encontró hogar y sin contacto. Vacío: no aplica.
- **Correos**: «Adoptaste a <nombre>: aceptá el compromiso» (a la persona que adoptó, al marcar),
  lleva a Mi solicitud; «El compromiso por <nombre>» (a las dos, cuando las dos lo aceptaron), con el
  texto completo, la foto y el nombre del animal, los nombres de las dos y el día en que aceptó cada
  una; «<nombre> dijo que no adoptó a <animal>» (a quien lo dio), lleva a Mis animales. A la persona
  elegida no le llega el de «encontró hogar». Vacío: no aplica.

## Requirements *(mandatory)*

### Functional Requirements

#### Marcar adoptado

- **FR-001**: Marcar adoptado (#59) pide elegir a quién se entregó: una de las personas con la
  solicitud aceptada para ese animal (#65), cada una con su foto, su nombre y sus distintivos de
  hoy, o «Se lo di a alguien que no vino por el sitio». Sin elegir, no se marca.
- **FR-002**: Sin solicitudes aceptadas, se ofrece solo «Se lo di a alguien que no vino por el
  sitio», con el texto que dice que primero hay que aceptar la solicitud de a quien se lo va a dar
  y el camino a las solicitudes de ese animal.
- **FR-003**: Al elegir a una persona se muestra el compromiso, y quien publicó lo acepta en el
  mismo paso con «Acepto el compromiso y marco adoptado a <nombre>». Al elegir «por fuera del
  sitio», se confirma con «Marcar adoptado», sin compromiso y sin vínculo con nadie.
- **FR-004**: Solo se puede elegir a una persona cuya solicitud por ese animal está aceptada al
  confirmar. Si dejó de estarlo, no se marca, se dice por qué con los textos de #65 («<nombre> ya
  no sigue con esta solicitud» cuando la retiró, hubo un bloqueo o una suspensión) y se vuelve a
  elegir.
- **FR-005**: Cada persona marca solo sus animales. Marcar adoptado no exige el teléfono
  verificado (#59), y se puede desde los mismos estados que #59.
- **FR-006**: Al marcar adoptado a una persona, su solicitud se cierra como adopción y deja de
  contar entre sus 3 activas (#63). Todas las otras solicitudes del animal, también las aceptadas
  que no se eligieron, se cierran como que encontró hogar (#65) y dejan de ver el teléfono. Al
  marcar por fuera del sitio, se cierran todas así.

#### El compromiso

- **FR-010**: El compromiso es el mismo texto para todas las adopciones, con el nombre del animal y
  el de las dos personas. La persona que adopta se compromete a cuidarlo y llevarlo al veterinario
  cuando lo necesite; a castrarlo, solo si su ficha dice que no está castrado; a no venderlo,
  regalarlo ni abandonarlo; y, si no puede tenerlo más, a avisarle a quien se lo dio y
  devolvérselo. Quien lo dio se compromete a recibirlo de vuelta en ese caso. Dice que es un acuerdo
  de palabra entre las dos personas, no un contrato.
- **FR-011**: Si lleva la línea de la castración se decide al marcar adoptado, y queda así aunque la
  ficha cambie después. Los nombres de las personas son los de hoy.
- **FR-012**: Quien publicó acepta el compromiso al marcar; la persona que adoptó, después, desde el
  correo o Mi solicitud, con «Acepto el compromiso». La adopción cuenta desde que se marca, aunque la
  persona que adoptó no lo acepte nunca: el compromiso queda pendiente, sin recordatorios.
- **FR-013**: Solo la persona que adoptó acepta su compromiso, y solo mientras está pendiente, la
  adopción sigue en curso, el contacto no se cortó y su cuenta no está suspendida.
- **FR-014**: Se guarda el día en que aceptó cada una y se muestra en Mis animales, en Una
  solicitud para el publicador, en Mi solicitud y en el correo del compromiso.

#### «Yo no adopté»

- **FR-020**: La persona elegida puede decir «Yo no adopté a <nombre>» solo mientras el compromiso
  está pendiente, la adopción sigue en curso, el contacto no se cortó y su cuenta no está
  suspendida, y pide confirmación.
- **FR-021**: «Yo no adopté» deshace la adopción: el animal sigue adoptado; en Mis animales y en Una
  solicitud para el publicador dice «<nombre> dijo que no lo adoptó»; quien publicó recibe un
  correo; la solicitud de esa persona se cierra como que el animal encontró hogar; el teléfono deja
  de verse para las dos; el compromiso deja de mostrarse a la persona.
- **FR-022**: Después de marcar no se puede cambiar a quién se entregó. Para marcarlo a otra
  persona, quien publicó lo vuelve a publicar y lo vuelve a marcar.

#### Mientras dura y cuando termina

- **FR-030**: Solo las dos personas de una adopción en curso siguen viendo el teléfono de la otra,
  con «Abrir WhatsApp» como en #65, mientras no termine, no se deshaga y no se corte el contacto.
  Cambia la regla de #65, que lo dejaba a la vista de todas las aceptadas de un animal adoptado.
- **FR-031**: Volver a publicar un animal adoptado a una persona (#59) pide una confirmación que
  dice que la adopción con esa persona termina. Al terminar, el teléfono deja de verse para las dos;
  Mi solicitud de la persona que adoptó dice que la adopción de ese animal terminó; el compromiso
  queda como estaba, con sus fechas, a la vista de las dos, y ya no se acepta ni se dice «Yo no
  adopté».
- **FR-032**: Un bloqueo entre las dos personas (#13) o la suspensión de la cuenta de una (#13)
  corta el contacto: el teléfono deja de verse para las dos y la adopción sigue registrada con su
  compromiso como estaba, sin poder aceptarlo ni decir «Yo no adopté». Desbloquear o reactivar la
  cuenta no lo vuelve a mostrar ni habilita nada.
- **FR-033**: Con el contacto cortado, las dos personas ven «El contacto ya no está disponible»
  donde estaba el teléfono, igual en un bloqueo de cualquiera de las dos o en una suspensión de
  cualquiera de las dos: ninguna pantalla ni correo dice cuál fue (#13).
- **FR-034**: Una cuenta suspendida no acepta compromisos ni dice «Yo no adopté»: ve la pantalla de
  cuenta suspendida de #13.

#### Lo que se ve

- **FR-040**: Mis animales y la pantalla de un animal muestran, en un adoptado, a quién se entregó
  («Adoptado por <nombre>», «Adoptado por fuera del sitio», «<nombre> dijo que no lo adoptó» o
  «Adoptado» si la persona borró su cuenta) y el estado del compromiso (pendiente o aceptado con la
  fecha).
- **FR-041**: Mi solicitud y Mis solicitudes muestran «Adoptaste a <nombre>», el estado del
  compromiso y, al terminar, que la adopción terminó.
- **FR-042**: Una solicitud, para el publicador, muestra en la elegida «Se lo diste a <nombre>» y el
  compromiso con su estado y sus fechas, también después de que la adopción terminó, o que la
  persona dijo que no lo adoptó.
- **FR-043**: Quién adoptó un animal lo ven solo las dos personas de la adopción. La ficha adoptada,
  el perfil público, el listado, otras solicitantes del mismo animal, quien administra y cualquier
  visitante no ven quién lo adoptó, si hay compromiso ni nada de él.
- **FR-044**: El enlace de una adopción o de un compromiso que no es de quien mira se ve como algo
  que no existe.

#### Correos

- **FR-050**: Al marcar adoptado a una persona, ella recibe un correo que la lleva a Mi solicitud
  (con ingreso si hace falta) para aceptar el compromiso, en lugar del de encontró hogar. Las otras
  personas con una solicitud cerrada reciben el de encontró hogar (#65).
- **FR-051**: Cuando las dos aceptaron, cada una recibe un correo con el compromiso completo, el
  nombre y la foto del animal, el nombre de las dos y el día en que aceptó cada una.
- **FR-052**: «Yo no adopté» manda un correo a quien publicó que lo dice y lo lleva a Mis animales.
- **FR-053**: Volver a publicar, bloquear, suspender y reactivar no mandan correo por la adopción.
- **FR-054**: Ningún correo lleva el teléfono, el correo ni las respuestas de nadie.
- **FR-055**: Tocar dos veces «Acepto el compromiso y marco adoptado a <nombre>», «Acepto el
  compromiso» o «Yo no adopté», o reintentar, hace una sola cosa y manda un solo correo por persona.
  Que un correo no salga no deshace lo hecho.

#### Datos personales

- **FR-060**: Se guarda a qué solicitud y persona se entregó cada animal y cuándo, si el compromiso
  lleva la línea de la castración, el día en que cada una aceptó el compromiso, si la persona
  elegida dijo que no lo adoptó y cuándo, y cuándo terminó la adopción. Nada más.
- **FR-061**: De una entrega por fuera del sitio no se guarda nada de la persona: solo que fue por
  fuera del sitio y cuándo.
- **FR-062**: Lo de FR-060 lo pueden leer solo las dos personas de esa adopción. Un visitante, otra
  persona con sesión, otra solicitante del mismo animal o quien administra no pueden leer nada de eso
  por ningún camino.
- **FR-063**: Borrar la cuenta de la persona que adoptó borra su solicitud y la adopción (#65), y el
  animal queda adoptado sin a quién. Borrar el animal o la cuenta de quien publicó borra la adopción
  y el compromiso.

#### Medición

- **FR-070**: Se mide: animal marcado adoptado (a una persona del sitio o por fuera, días desde que
  se publicó, días desde que se aceptó la solicitud elegida y cuántas solicitudes aceptadas tenía);
  compromiso aceptado por la persona que adoptó (horas desde que se marcó); «Yo no adopté» (horas
  desde que se marcó); adopción terminada al volver a publicar (días desde que se marcó).
  «Adoptado» es el quinto paso del funnel de docs/03 §7.
- **FR-071**: Ningún evento lleva el nombre, el teléfono, las respuestas ni otros datos de las
  personas.

### Key Entities *(include if feature involves data)*

- **Entrega**: de un animal, cuándo se marcó adoptado y si fue a una persona del sitio o por fuera.
- **Adopción**: el animal, la solicitud y la persona a la que se entregó, cuándo se marcó, si el
  compromiso lleva la línea de la castración, cuándo aceptó cada una, si la persona dijo que no lo
  adoptó y cuándo, cuándo terminó y si el contacto se cortó.
- **Solicitud** (de #63 y #65, se amplía): un motivo de cierre nuevo, adopción.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un publicador con una aceptada marca adoptado a esa persona en no más de 3 toques,
  contando «Marcar adoptado», y por fuera del sitio en no más de 3.
- **SC-002**: En el 100 % de los intentos de prueba, después de marcar adoptado solo las dos
  personas de la adopción ven el teléfono de la otra, y después de terminar, deshacer, bloquear o
  suspender no lo ve ninguna, tampoco al desbloquear o reactivar.
- **SC-003**: En el 100 % de los intentos de prueba, un visitante, otra persona con sesión, otra
  solicitante o quien administra no pueden leer quién adoptó un animal ni su compromiso.
- **SC-004**: En el 100 % de los intentos de prueba, un doble toque o un reintento no marcan dos
  veces, no aceptan dos veces ni mandan dos correos a la misma persona.
- **SC-005**: Ningún correo de prueba contiene un teléfono, un correo o una respuesta.
- **SC-006**: En el 100 % de las pruebas, el compromiso lleva la línea de la castración si y solo
  si el animal no estaba castrado al marcarlo.
- **SC-007**: La medición permite calcular, por semana, qué parte de los animales adoptados se
  entregó a una persona del sitio, sin ningún dato de las personas.

## Assumptions

- Ya en main (Ready): nada entrega la adopción ni el compromiso; marcar adoptado y volver a
  publicar vienen de #59, y aceptar, el contacto y el cierre como que encontró hogar, de #65. Las
  únicas apariciones de «compromiso» en el código son la pregunta de la castración del cuestionario
  de #63.
- La historia no tiene comentarios; su cuerpo, con las «Decisiones del enjambre» (la última del
  2026-10-08), es la fuente. «18.331» es la Ley 18.331; las referencias como «docs/03 §5» son a
  documentos del proyecto.
- **Decisiones del enjambre**: las siete de la historia se copian palabra por palabra a docs/03 §5
  en esta rama (la del teléfono, que dice «§4 y §5», va en §5, junto a las otras de la adopción, y
  §4 no se duplica).
- **«Se me dice que Ana retiró su solicitud»** (criterio de error de la historia) se resuelve con el
  texto «Ana ya no sigue con esta solicitud» de #65 (decisión 2026-10-07): es lo que el publicador ve
  en un retiro, un bloqueo o una suspensión, para no distinguirlos.
- **El contacto cortado** (decisión de esta spec): un bloqueo o una suspensión deja el compromiso
  congelado, sin aceptar ni «Yo no adopté», y la persona que adoptó ve «El contacto ya no está
  disponible», el mismo texto en los cuatro casos. Motivo: un compromiso aceptado manda un correo a
  quien bloqueó, y un texto distinto por caso le contaría a la bloqueada que la bloquearon (#13).
  Ante la duda, lo que muestra menos (Ley 18.331).
- **La línea de la castración queda como al marcar** y los nombres son los de hoy (decisión de esta
  spec): el compromiso se acepta sobre lo que se leyó, y el nombre de hoy es el que la persona
  reconoce, como el contacto de #65.
- **«Yo no adopté» cierra la solicitud como que el animal encontró hogar**, como dice la historia,
  y el compromiso deja de mostrarse a esa persona: ya no es suyo. Quien lo dio ve el nombre en
  «<nombre> dijo que no lo adoptó», que es lo que pide la historia.
- **Una persona que borró su cuenta**: el animal queda «Adoptado», sin decir a quién; no se dice
  que borró la cuenta.
- **La persona de una adopción terminada puede volver a solicitar** el animal republicado, como
  cualquiera con una solicitud cerrada (#63); la adopción no es un rechazo.
- **«Marcar adoptado» se abre desde donde #59 lo ofrece hoy** (Mis animales y la pantalla del
  animal); no se suma desde la bandeja.
- **El correo de quien fue elegida reemplaza al de encontró hogar**: le llega uno solo.
- **El correo del compromiso no sale si la persona ya no tiene cuenta** en el momento de mandarlo.
- **La foto del animal en el correo** es la de portada al mandarlo.
- **Los animales marcados adoptados antes de esta historia** quedan como «Adoptado», sin a quién,
  y sus aceptadas cerradas dejan de ver el teléfono (FR-030): el sitio todavía no salió (docs/04), y
  esos datos son de prueba.
- **Las aceptadas no se paginan** en «¿A quién se lo diste?»: en la beta, un animal tiene pocas.
- **La medición** se registra como el resto del sitio hoy, sin datos de las personas.
- **Fuera de esta historia**, como dice su alcance: el seguimiento a los 30 días y su distintivo, el
  historial de adopciones en el perfil público, la encuesta después de adoptar, un compromiso propio
  de cada rescatista o editar su texto, firmar con valor legal, adjuntar o imprimir, recordatorios,
  cambiar a quién se entregó, el traspaso del chip, elegir a alguien no aceptado, avisos por
  WhatsApp o del teléfono y el panel de quien administra.
