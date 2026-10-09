# Feature Specification: Encuesta al terminar una adopción o no ser elegido, opiniones desde cualquier pantalla y WhatsApp de soporte

**Feature Branch**: `feature/71-encuesta-opiniones-whatsapp-soporte`

**Created**: 2026-10-08

**Status**: Draft

**Input**: Historia #71 del backlog, milestone «M4 - Cierre, seguimiento y admin». El cuerpo
verbatim de la historia acompaña a esta spec (`story.md`).

**Ya construido**: marcar adoptado un animal, a una persona del sitio o por fuera, «Adoptaste a
<nombre>», el compromiso y «Yo no adopté» (historia #67); rechazar una solicitud, dejar sin efecto
una aceptación, cerrar las demás como que el animal encontró hogar y el correo del rechazo (historia
#65); Mi solicitud y Mis solicitudes (historia #63); Mis animales (historia #59); quién administra y
sus pantallas de revisión (historia #11); bloquear, suspender y la pantalla de cuenta suspendida
(historia #13); la medición sin la persona (historia #9); y la regla que no deja escribir un
teléfono ni un correo en las preguntas de una solicitud (historia #65). Ya en main (Ready): nada de
la encuesta, de Opinar, del pie con el WhatsApp de soporte ni de Opiniones o Encuestas; el WhatsApp
que existe es el contacto entre quien publicó y quien solicitó (#65), no el de soporte. Esta spec
suma la encuesta, Opinar, el pie y las dos pantallas de quien administra, y no rehace nada.

**Vocabulario de esta spec**:

- **Mis animales**, **Mi solicitud**, **Mis solicitudes**, **marcar adoptado**, **por fuera del
  sitio**, **«Adoptaste a <nombre>»**, **el compromiso**, **«Yo no adopté»**, **rechazar**, **dejar
  sin efecto una aceptación**, **encontró hogar**, **bloquear**, **cuenta suspendida** y **quien
  administra** significan lo mismo que en las specs de las historias #11, #13, #59, #63, #65 y #67.
- **Un desenlace** es uno de estos hechos, para una persona:
  - **Dio en adopción**: quien publicó marca adoptado un animal, a una persona del sitio o por fuera.
  - **Adoptó**: quien publicó la eligió a ella al marcar adoptado.
  - **No fue elegida**: su solicitud fue rechazada, su aceptación se dejó sin efecto, o su solicitud
    se cerró porque el animal se marcó adoptado, con otra persona o por fuera del sitio.
  Ningún otro hecho es un desenlace.
- **Los tres momentos** de la encuesta son esos tres desenlaces.
- **La encuesta** es la pregunta del momento, con tres opciones, más la pregunta abierta «¿Algo más
  que quieras contarnos?». Está **ofrecida** desde que la persona la ve por primera vez;
  **respondida** cuando la manda; **cerrada** cuando toca «Ahora no»; **retirada** si desaparece
  porque quien adoptó dijo «Yo no adopté» antes de responder.
- **Una opinión** es un texto que cualquiera manda desde **Opinar**.
- **El pie** es la franja al final de todas las pantallas.
- **El número de soporte** es el WhatsApp que define el equipo, fuera del sitio.
- **Opiniones** y **Encuestas** son las dos pantallas nuevas de quien administra.
- Todo día se cuenta y se muestra en hora de Uruguay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La encuesta de dos preguntas en los tres desenlaces (Priority: P1)

Una rescatista marca adoptado a Tobi eligiendo a Ana. Cuando vuelve a Mis animales, sobre Tobi ve
«¿El próximo animal que des en adopción lo publicarías acá?» con Sí · Tal vez · No y «¿Algo más que
quieras contarnos?». Elige «Sí», escribe «me ahorró las entrevistas por WhatsApp», toca «Enviar» y
ve un agradecimiento. Ana, al abrir Mi solicitud, ve debajo del compromiso si verificarse valió la
pena; Bruno, cuya solicitud no fue aceptada, ve en Mi solicitud «¿Vas a seguir buscando por acá?».
Cada una puede cerrarla con «Ahora no». A nadie se le ofrece más de una cada 30 días.

**Why this priority**: es la parte de la instrumentación que la medición no da, el porqué (docs/03
§7 y §Hipótesis); las otras partes se apoyan en el mismo cuidado de no guardar quién dijo qué.

**Independent Test**: con desenlaces sembrados para tres personas (una adopción a una persona del
sitio, una por fuera, una solicitud rechazada, una aceptación dejada sin efecto, una cerrada porque
el animal encontró hogar, una retirada, una cerrada porque el animal venció): abrir Mis animales y
Mi solicitud de cada una y ver la encuesta solo donde corresponde, con su pregunta; responderla,
cerrarla con «Ahora no», dejarla sin tocar y volver otro día, tocar dos veces «Enviar», enviarla
desde dos pestañas, decir «Yo no adopté» y repetir con desenlaces a 10 y a 31 días de la anterior.

**Acceptance Scenarios**:

1. **Dado** que marqué adoptado a Tobi eligiendo a Ana, **cuando** vuelvo a Mis animales,
   **entonces** sobre Tobi veo «¿El próximo animal que des en adopción lo publicarías acá?», elijo
   «Sí», escribo «me ahorró las entrevistas por WhatsApp», toco «Enviar», veo un agradecimiento y la
   encuesta no vuelve a aparecer.
2. **Dado** que Ana fue elegida para Tobi, **cuando** abre Mi solicitud, **entonces** debajo de
   «Adoptaste a Tobi» y del compromiso ve «Verificarte y completar el cuestionario, ¿valió la pena
   comparado con adoptar por un grupo de Facebook o WhatsApp?», elige «Más o menos», toca «Enviar»
   sin escribir nada y ve el agradecimiento.
3. **Dado** que la solicitud de Bruno no fue aceptada, **cuando** abre Mi solicitud desde el correo
   del rechazo, **entonces** ve «¿Vas a seguir buscando por acá?», elige «No, vuelvo a los grupos» y
   envía.
4. **Dado** que quien publicó a Luna dejó sin efecto la aceptación de Bruno, **cuando** Bruno abre
   Mi solicitud, **entonces** ve «¿Vas a seguir buscando por acá?».
5. **Dado** que mi solicitud por Tobi se cerró porque Tobi se marcó adoptado con otra persona o por
   fuera del sitio, **cuando** abro Mi solicitud, **entonces** ve «¿Vas a seguir buscando por acá?».
6. **Dado** que di a Luna por fuera del sitio, **cuando** la marco adoptada y vuelvo a Mis animales,
   **entonces** se me ofrece la misma encuesta que si la hubiera dado a alguien del sitio.
7. **Dado** que vi la encuesta por Tobi hace 10 días, **cuando** marco adoptada a Luna, **entonces**
   no se me ofrece otra encuesta; si la marco cuando ya pasaron 31 días desde que vi la de Tobi, sí.
8. **Dado** que tengo la encuesta de Tobi sin responder, **cuando** toco «Ahora no», **entonces**
   desaparece, no vuelve a aparecer por Tobi y Encuestas la cuenta como cerrada.
9. **Dado** que abrí Mi solicitud y no respondí ni cerré la encuesta, **cuando** vuelvo al otro día,
   **entonces** la encuesta sigue ahí.
10. **Dado** que Ana no respondió su encuesta, **cuando** toca «Yo no adopté a Tobi» y confirma,
    **entonces** la encuesta desaparece; Encuestas no la cuenta entre las ofrecidas, y si a los 10
    días otra solicitud de Ana no es elegida, se le ofrece la encuesta de ese desenlace.
11. **Dado** que retiré mi solicitud por Luna, o se cerró porque Luna venció, se pausó o se borró,
    porque quien publicó dejó de recibir solicitudes, o por un bloqueo o una suspensión, **cuando**
    abro Mi solicitud, **entonces** no veo ninguna encuesta.
12. **Dado** que no elegí ninguna opción, **cuando** toco «Enviar», **entonces** se me dice que
    elija una y lo que escribí sigue ahí.
13. **Dado** que escribo mi teléfono o un correo en la respuesta libre, **cuando** toco «Enviar»,
    **entonces** no se manda, se me dice que no puede llevar un teléfono ni un correo y que, para
    que me respondan, está el WhatsApp de soporte (si hay número), y lo que elegí y escribí sigue
    ahí.
14. **Dado** que se corta la conexión, **cuando** envío la encuesta, **entonces** no se pierde lo
    que elegí ni lo que escribí, se me dice que no se pudo por la conexión y puedo reintentar; si el
    primer intento había llegado, el reintento no guarda otra respuesta y veo el agradecimiento.
15. **Dado** que respondí la encuesta en otra pestaña, **cuando** envío la misma encuesta desde
    esta, **entonces** queda una sola respuesta y veo el agradecimiento.
16. **Dado** que toco dos veces «Enviar», **cuando** termina, **entonces** queda una sola respuesta.
17. **Dado** que mi cuenta está suspendida, **cuando** tengo un desenlace o una encuesta pendiente,
    **entonces** no veo ninguna encuesta: veo solo la pantalla de cuenta suspendida (#13).

---

### User Story 2 - Opinar desde cualquier pantalla, con o sin sesión (Priority: P2)

Alguien mira la ficha de Luna sin haber entrado. Sin bajar, ve «Opinar»; lo toca, lee que la opinión
llega sin su nombre y que para que le respondan está el WhatsApp de soporte, escribe «no entiendo
por qué me piden el teléfono para preguntar» y la envía. Ve que llegó.

**Why this priority**: quien se va sin registrarse es a quien más hay que escuchar, y es el único
lugar donde un rescatista puede decir «esto me ahorró trabajo» sin que se le pregunte (docs/03
§Métricas de éxito). No depende de la encuesta.

**Independent Test**: sin sesión y con sesión, en una pantalla pública, una privada y la de cuenta
suspendida: ver Opinar sin bajar, mandar una opinión, mandarla vacía, de más de 1.000 caracteres,
con un teléfono, con la conexión cortada, tocando dos veces «Enviar» y una sexta en el mismo día
desde el mismo navegador.

**Acceptance Scenarios**:

1. **Dado** que miro la ficha de Luna sin sesión, **cuando** toco «Opinar», escribo «no entiendo por
   qué me piden el teléfono para preguntar» y envío, **entonces** veo que llegó, y quien administra
   la ve en Opiniones con el día y la ficha de Luna como pantalla, sin mi nombre.
2. **Dado** que estoy en cualquier pantalla, con o sin sesión, **cuando** carga, **entonces** veo
   Opinar sin bajar, y no tapa la acción principal de la pantalla.
3. **Dado** que abro Opinar, **cuando** lo leo, **entonces** dice que la opinión llega sin el nombre
   de quien la manda y que, para que te respondan, está el WhatsApp de soporte (con el enlace, si
   hay número).
4. **Dado** que Opinar está vacío o solo tiene espacios, **cuando** toco «Enviar», **entonces** se me
   pide que escriba algo.
5. **Dado** que paso de 1.000 caracteres, **cuando** escribo, **entonces** veo cuántos sobran y no
   puedo enviar hasta bajar de 1.000.
6. **Dado** que escribo mi teléfono o un correo, **cuando** toco «Enviar», **entonces** no se manda,
   se me dice que no puede llevar un teléfono ni un correo y que para que me respondan está el
   WhatsApp de soporte, y lo que escribí sigue ahí.
7. **Dado** que mandé 5 opiniones hoy desde este navegador, **cuando** intento mandar la sexta,
   **entonces** no se manda, se me dice que ya mandé varias hoy, lo que escribí sigue ahí y se me
   ofrece el WhatsApp de soporte, si hay número.
8. **Dado** que se corta la conexión, **cuando** envío una opinión, **entonces** no se pierde lo que
   escribí, se me dice que no se pudo por la conexión y puedo reintentar; si el primer intento había
   llegado, el reintento no guarda otra.
9. **Dado** que toco dos veces «Enviar», **cuando** termina, **entonces** queda una sola opinión.
10. **Dado** que tengo sesión, **cuando** mando una opinión, **entonces** llega igual que sin sesión:
    sin mi nombre ni nada que la una a mí.

---

### User Story 3 - Opiniones y Encuestas para quien administra (Priority: P3)

Quien administra abre Opiniones y ve lo que llegó, de la más nueva a la más vieja, con el día y la
pantalla, y borra una que es spam. Abre Encuestas y ve, para cada uno de los tres momentos, cuántas
se ofrecieron, cuántas se respondieron y cuántas se cerraron con «Ahora no», cuántas veces se eligió
cada opción, y las respuestas libres con el día y la opción que las acompañó, sin el nombre de nadie.

**Why this priority**: es donde lo que se escuchó se lee; sin esta pantalla las respuestas existen
pero nadie del equipo las ve. Se apoya en US1 y US2.

**Independent Test**: con opiniones y encuestas sembradas en los tres momentos (respondidas con y
sin texto, cerradas, pendientes y retiradas por «Yo no adopté»): abrir Opiniones y Encuestas como
quien administra y ver los números y textos esperados, sin nombres; borrar una opinión; borrar la
cuenta de una persona que respondió y ver los mismos números; abrir las dos direcciones sin sesión y
como una persona que no administra y ver que no existen.

**Acceptance Scenarios**:

1. **Dado** que administro el sitio, **cuando** abro Opiniones, **entonces** veo cada opinión con su
   texto, el día y la pantalla desde la que se mandó, de la más nueva a la más vieja, sin el nombre
   de nadie.
2. **Dado** que administro el sitio, **cuando** toco «Borrar» en una opinión y confirmo, **entonces**
   desaparece de Opiniones para siempre; si no confirmo, queda.
3. **Dado** que administro el sitio, **cuando** abro Encuestas, **entonces** veo, para cada uno de
   los tres momentos, su pregunta, cuántas se ofrecieron, se respondieron y se cerraron, cuántas veces
   se eligió cada opción y las respuestas libres, de la más nueva a la más vieja, con el día y la
   opción que las acompañó, sin el nombre de nadie.
4. **Dado** que Ana respondió su encuesta y después borró su cuenta, **cuando** quien administra
   abre Encuestas, **entonces** las ofrecidas, las respondidas y la opción que eligió siguen contadas
   igual que antes, sin nombre.
5. **Dado** que Ana tocó «Yo no adopté a Tobi» sin responder su encuesta, **cuando** quien administra
   abre Encuestas, **entonces** esa encuesta no figura entre las ofrecidas.
6. **Dado** que no llegó ninguna opinión, **cuando** abro Opiniones, **entonces** veo «Todavía no
   llegó ninguna opinión.».
7. **Dado** que nadie respondió la encuesta de un momento, **cuando** abro Encuestas, **entonces** ese
   momento muestra sus cuentas en cero y «Todavía nadie respondió esta encuesta.».
8. **Dado** que no administro el sitio, o no tengo sesión, **cuando** abro la dirección de Opiniones
   o de Encuestas, **entonces** veo que no existe, igual que si no existiera.

---

### User Story 4 - El WhatsApp de soporte en el pie de todas las pantallas (Priority: P4)

En el pie de todas las pantallas está el WhatsApp de soporte. Quien se traba lo toca y se le abre
WhatsApp con el número de soporte y un saludo escrito que nombra al sitio. Mientras el equipo no
definió ningún número, el pie muestra solo Opinar.

**Why this priority**: es la salida para quien necesita que le respondan; Opinar ya cubre escuchar.
Es la parte más chica y no depende de las otras.

**Independent Test**: con y sin número de soporte definido, abrir una pantalla pública, una privada
y la de cuenta suspendida, mirar el pie y tocar el WhatsApp.

**Acceptance Scenarios**:

1. **Dado** que el equipo definió el número de soporte, **cuando** toco el WhatsApp del pie en
   cualquier pantalla, **entonces** se abre WhatsApp con ese número y el saludo escrito, que nombra
   al sitio y no lleva ningún dato mío ni de la pantalla.
2. **Dado** que el equipo todavía no definió el número de soporte, **cuando** miro el pie, **entonces**
   veo solo Opinar, sin enlace a WhatsApp; Opinar y los mensajes que nombran el WhatsApp de soporte
   tampoco lo ofrecen.
3. **Dado** que estoy en la pantalla de cuenta suspendida, **cuando** miro el pie, **entonces** veo
   Opinar y el WhatsApp de soporte como en cualquier otra.

---

### Edge Cases

- **Cuándo se ofrece**: la encuesta de un desenlace se ofrece la primera vez que la persona abre la
  pantalla donde ve ese desenlace (Mis animales o Mi solicitud), si en los 30 días anteriores no se
  le ofreció ninguna. Si en esa primera vez no corresponde porque está dentro de los 30 días, ese
  desenlace no ofrece encuesta nunca, aunque la persona vuelva después de que pasen.
- **Los 30 días** se cuentan por día del calendario desde el día en que vio la anterior: vista el 1
  de septiembre, la siguiente puede ofrecerse desde el 1 de octubre.
- **Dos desenlaces el mismo día o casi**: se ofrece la del primero que la persona abre; el otro no.
- **Una encuesta pendiente** (ofrecida, sin responder ni cerrar) sigue en su lugar todo el tiempo
  que haga falta; mientras tanto no se ofrece otra si no pasaron 30 días.
- **Quien publicó marca adoptado y vuelve a publicar el animal antes de abrir Mis animales**: el
  animal ya no está adoptado, así que esa encuesta no se ofrece. Si ya estaba ofrecida y sin
  responder, desaparece con el animal adoptado y cuenta como ofrecida sin responder.
- **Quien publicó borra el animal**: una encuesta ofrecida sobre ese animal deja de verse y cuenta
  como ofrecida sin responder; una respuesta ya mandada se queda.
- **«Yo no adopté» después de responder**: la respuesta queda y sigue contando; no hay forma de
  separarla, porque no está unida a nadie.
- **«Yo no adopté» no es un desenlace**: la solicitud que se cierra así no ofrece la encuesta de no
  ser elegida.
- **Una solicitud rechazada que después se cierra por otra causa**: el desenlace es el rechazo, y su
  encuesta queda como esté.
- **Desenlaces de antes de esta historia** no ofrecen encuesta: el sitio todavía no salió (docs/04)
  y son datos de prueba.
- **«Ahora no» en una pestaña y «Enviar» en otra**: vale lo que llega primero. Si llegó primero
  «Ahora no», el envío no guarda nada y la encuesta desaparece; si llegó primero la respuesta,
  «Ahora no» no cambia nada.
- **Una cuenta suspendida** no ve encuestas; si la reactivan, una encuesta que ya estaba ofrecida
  vuelve a estar en su lugar, y un desenlace que no abrió mientras estuvo suspendida se ofrece la
  primera vez que lo abre, con la regla de los 30 días.
- **Un bloqueo después de un desenlace** no cambia la encuesta: queda donde la persona vea ese
  desenlace.
- **Quien administra** es una persona más para la encuesta: se le ofrece por sus propios desenlaces.
- **La pantalla de una opinión**: de una pantalla pública (la portada, el listado, la ficha de un
  animal, el perfil público de alguien, los niveles) se guarda cuál es, con el animal o el perfil
  que mostraba; de una pantalla privada (Mi solicitud, Mis animales, Mi perfil, las de revisión,
  la de cuenta suspendida, el ingreso) se guarda solo su nombre, nunca qué solicitud, animal o
  persona mostraba, porque eso diría quién la mandó.
- **Una opinión desde la ficha de un animal que después se borra o se da de baja**: la opinión queda,
  con la pantalla como se guardó.
- **El tope de 5 opiniones** se cuenta por día del calendario y por navegador, con o sin sesión; un
  navegador que borró lo que guarda puede mandar otras 5. Es un freno al abuso, no una garantía.
- **El teléfono o el correo en el texto**: se detecta igual que en las preguntas de una solicitud
  (#65), también escrito con espacios, puntos o guiones; un número que no es un teléfono (una edad,
  un año, «500 caracteres») no se rechaza.
- **Texto solo con espacios** cuenta como vacío, en Opinar y en la respuesta libre.
- **Una respuesta libre de más de 500 caracteres**: se ve cuántos sobran y no se puede enviar hasta
  bajar de 500.
- **Opinar abierto y la persona cambia de pantalla**: lo escrito y no enviado se pierde, salvo que
  vuelva atrás antes; la pantalla que se guarda es aquella desde la que se envió.
- **Sin número de soporte**: ningún mensaje ofrece el WhatsApp de soporte; los que lo nombran dicen
  solo lo demás.
- **Varias personas que administran**: ven lo mismo; lo que borra una desaparece para todas.

## Pantallas

En todas: el **cargando** de una pantalla o un bloque con datos es un esqueleto con su forma; el
**error al cargar** dice que no se pudo traer y ofrece «Reintentar»; cada **acción** muestra que
está trabajando en su botón, no se puede tocar dos veces y, si falla, dice qué pasó y deja reintentar
sin perder lo elegido ni lo escrito. Opiniones y Encuestas son privadas y no se encuentran en
buscadores; Mis animales y Mi solicitud siguen privadas.

- **Pie de todas las pantallas** (nuevo): Opinar y el WhatsApp de soporte. Vacío: sin número de
  soporte, solo Opinar.
- **Opinar** (nuevo, a la vista sin bajar en todas las pantallas, con o sin sesión, también en la de
  cuenta suspendida): el texto con la cuenta de los 1.000 caracteres, lo que se hace con la opinión
  (llega sin tu nombre, la lee el equipo), el WhatsApp de soporte para que te respondan si hay
  número, «Enviar» y el agradecimiento al enviar. Errores: vacío, más de 1.000, un teléfono o un
  correo, el tope del día, la conexión. Vacío: no aplica.
- **La encuesta**, dentro de **Mis animales** (cambia, de #59 y #67), sobre el animal recién
  adoptado, y de **Mi solicitud** (cambia, de #63, #65 y #67), debajo de «Adoptaste a <nombre>» y
  del compromiso, o debajo de que la solicitud no fue aceptada o se cerró: la pregunta del momento,
  sus tres opciones, «¿Algo más que quieras contarnos?» con la cuenta de los 500 caracteres,
  «Enviar», «Ahora no» y el agradecimiento. Nunca tapa la pantalla ni frena lo que la persona vino a
  hacer. Errores: sin opción, más de 500, un teléfono o un correo, la conexión. Vacío: no aplica;
  sin encuesta, esas pantallas quedan como estaban.
- **Opiniones**, solo para quien administra (nuevo): cada opinión con el texto, el día, la pantalla
  y «Borrar», con confirmación, de la más nueva a la más vieja. Vacío: «Todavía no llegó ninguna
  opinión.»
- **Encuestas**, solo para quien administra (nuevo): los tres momentos, cada uno con su pregunta,
  cuántas se ofrecieron, se respondieron y se cerraron, cuántas veces se eligió cada opción y las
  respuestas libres, de la más nueva a la más vieja, con el día y la opción. Vacío: cada momento en
  cero, con «Todavía nadie respondió esta encuesta.»
- Las pantallas de revisión de quien administra suman el camino a Opiniones y a Encuestas.

## Requirements *(mandatory)*

### Functional Requirements

#### La encuesta

- **FR-001**: Hay tres momentos, cada uno con su pregunta obligatoria de tres opciones:
  - Dio en adopción: «¿El próximo animal que des en adopción lo publicarías acá?» Sí · Tal vez · No.
  - Adoptó: «Verificarte y completar el cuestionario, ¿valió la pena comparado con adoptar por un
    grupo de Facebook o WhatsApp?» Sí · Más o menos · No.
  - No fue elegida: «¿Vas a seguir buscando por acá?» Sí · Tal vez · No, vuelvo a los grupos.
- **FR-002**: Los tres momentos llevan además «¿Algo más que quieras contarnos?», texto libre,
  opcional, de hasta 500 caracteres.
- **FR-003**: Solo los desenlaces del vocabulario ofrecen encuesta: marcar adoptado (a una persona
  del sitio o por fuera) para quien publicó; ser elegida al marcar adoptado para quien adoptó; y una
  solicitud rechazada, una aceptación dejada sin efecto o una solicitud cerrada porque el animal se
  marcó adoptado para quien solicitó. Retirar una solicitud, o que se cierre porque el animal se
  pausó, venció o se borró, porque quien publicó dejó de recibir solicitudes, o por un bloqueo, una
  suspensión o «Yo no adopté», no ofrece encuesta.
- **FR-004**: La encuesta aparece en el sitio, en la pantalla donde la persona ve el desenlace: en
  la lista de Mis animales, sobre el animal recién adoptado (no en la pantalla de un animal); en Mi
  solicitud, debajo de «Adoptaste a <nombre>»
  y del compromiso, o debajo de que la solicitud no fue aceptada o se cerró. Nunca tapa la pantalla
  ni frena lo que la persona vino a hacer. No se manda por correo ni hay recordatorios.
- **FR-005**: Se ofrece la primera vez que la persona abre esa pantalla después del desenlace, y
  solo si en los 30 días anteriores no se le ofreció ninguna otra (contados por día del calendario
  desde el día en que vio la anterior). Si no corresponde esa primera vez, ese desenlace no la ofrece
  nunca.
- **FR-006**: Ofrecida, queda en su lugar hasta que la persona la responde o toca «Ahora no»;
  después de cualquiera de las dos no vuelve a aparecer para ese desenlace.
- **FR-007**: Si quien adoptó dice «Yo no adopté» antes de responder, la encuesta desaparece, deja
  de contarse como ofrecida y no cuenta para sus 30 días.
- **FR-008**: Una cuenta suspendida no ve encuestas.
- **FR-009**: Sin una opción elegida no se envía. La respuesta libre no puede llevar un teléfono ni un
  correo (la misma regla que las preguntas de #65); si lo lleva, no se envía y se le dice a la
  persona que lo saque y que para que le respondan está el WhatsApp de soporte (si hay número).
- **FR-010**: Una encuesta tiene una sola respuesta o un solo «Ahora no»: tocar dos veces «Enviar»,
  reintentar o enviar desde dos pestañas guarda una sola respuesta, y vale lo primero que llega.
- **FR-011**: Al enviar, la persona ve un agradecimiento y la encuesta no vuelve.

#### Opinar

- **FR-020**: Opinar está a la vista sin bajar en todas las pantallas, con o sin sesión, y nunca tapa
  la acción principal de la pantalla. También está en el pie.
- **FR-021**: Opinar es un texto obligatorio de hasta 1.000 caracteres; dice que la opinión llega sin
  el nombre de quien la manda y que, para que te respondan, está el WhatsApp de soporte (con el
  enlace, si hay número).
- **FR-022**: Una opinión se guarda con el día y la pantalla desde la que se mandó, según la regla de
  pantallas públicas y privadas de los casos borde. Nada más.
- **FR-023**: Desde un mismo navegador se pueden mandar hasta 5 opiniones por día; la sexta no se
  manda, se dice que ya mandó varias hoy y se ofrece el WhatsApp de soporte, si hay número.
- **FR-024**: Una opinión no puede llevar un teléfono ni un correo, con la misma regla y el mismo
  mensaje que FR-009.
- **FR-025**: Tocar dos veces «Enviar» o reintentar después de un envío que llegó guarda una sola
  opinión. Si no se pudo enviar, lo escrito queda y se puede reintentar.

#### El WhatsApp de soporte

- **FR-030**: El pie de todas las pantallas lleva el WhatsApp de soporte, que abre WhatsApp con el
  número de soporte y un saludo escrito que nombra al sitio, sin ningún dato de la persona ni de la
  pantalla.
- **FR-031**: El número lo define el equipo, fuera del sitio. Mientras no hay ninguno, el enlace no
  aparece en ningún lugar y el pie muestra solo Opinar.

#### Opiniones y Encuestas

- **FR-040**: Opiniones y Encuestas las ven solo quienes administran (#11). Para cualquier otra
  persona, con o sin sesión, sus direcciones se ven como algo que no existe.
- **FR-041**: Opiniones muestra cada opinión con su texto, el día y la pantalla, de la más nueva a la
  más vieja, y deja borrar una, con confirmación. Borrar no se deshace.
- **FR-042**: Encuestas muestra, para cada momento, su pregunta, cuántas se ofrecieron, cuántas se
  respondieron, cuántas se cerraron con «Ahora no», cuántas veces se eligió cada opción y las
  respuestas libres, de la más nueva a la más vieja, con el día y la opción que las acompañó.
- **FR-043**: Ni Opiniones ni Encuestas muestran quién mandó qué, y no hay forma de saberlo desde el
  sitio.
- **FR-044**: Borrar una cuenta no cambia ningún número de Encuestas ni saca ninguna respuesta u
  opinión. Una encuesta retirada por «Yo no adopté» no cuenta como ofrecida.
- **FR-045**: Las listas de Opiniones y de respuestas libres muestran primero las más nuevas y
  permiten ver las anteriores sin perder las que ya se ven.

#### Datos personales

- **FR-050**: De cada persona se guarda solo que se le ofreció una encuesta, para qué desenlace, cuándo
  y si ya la respondió o cerró; se borra al borrar la cuenta.
- **FR-051**: Las respuestas y las opiniones se guardan sin nada que las una a la persona: el día, el
  momento o la pantalla, la opción y el texto libre. No se guarda la hora, la cuenta, el navegador ni
  nada que permita volver a la persona. Lo que cuenta las 5 opiniones del día de un navegador se
  guarda aparte de las opiniones, no dice cuáles mandó y no sirve después de ese día.
- **FR-052**: Las respuestas y las opiniones las leen solo quienes administran; nadie más, por ningún
  camino.
- **FR-053**: El WhatsApp de soporte no le pasa a WhatsApp ningún dato de la persona.

#### Medición

- **FR-060**: Se mide: encuesta ofrecida (el momento); respondida (el momento, la opción y si escribió
  algo en la abierta, nunca el texto); cerrada con «Ahora no» (el momento); opinión enviada (desde
  qué pantalla, con la misma regla de FR-022); toque en el WhatsApp de soporte (desde qué pantalla).
- **FR-061**: Ningún evento lleva el nombre, el teléfono, el texto ni otros datos de las personas.

### Key Entities *(include if feature involves data)*

- **Oferta de encuesta**: de una persona, para un desenlace, el día en que la vio y si está
  pendiente, respondida o cerrada. Es lo único unido a la persona.
- **Respuesta de encuesta**: el momento, la opción, el texto libre si hay y el día. Sin persona.
- **Cuentas de Encuestas**: por momento, cuántas se ofrecieron, respondieron y cerraron, y cuántas
  veces se eligió cada opción; no cambian al borrar una cuenta.
- **Opinión**: el texto, el día y la pantalla. Sin persona.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas, cada desenlace de FR-003 ofrece su encuesta con su pregunta
  la primera vez que se abre su pantalla, salvo dentro de los 30 días de otra, y ningún otro cierre
  ofrece ninguna.
- **SC-002**: Responder la encuesta lleva como mucho 2 toques (una opción y «Enviar»), y cerrarla, 1.
- **SC-003**: Mandar una opinión lleva como mucho 3 toques además de escribir (Opinar, escribir,
  «Enviar»), desde cualquier pantalla.
- **SC-004**: En el 100 % de los intentos de prueba, una persona que no administra, con o sin sesión,
  no puede leer ninguna respuesta ni opinión, y quien administra no puede saber quién mandó cuál.
- **SC-005**: En el 100 % de los intentos de prueba, un doble toque, un reintento o dos pestañas no
  dejan dos respuestas ni dos opiniones.
- **SC-006**: Después de borrar una cuenta que respondió, los números de Encuestas son los mismos que
  antes, en el 100 % de las pruebas.
- **SC-007**: Ninguna respuesta libre ni opinión guardada en las pruebas contiene un teléfono o un
  correo.
- **SC-008**: Con las respuestas de la beta, el equipo puede leer por momento qué parte eligió cada
  opción y qué parte respondió de las ofrecidas, sin ningún dato de las personas.

## Assumptions

- Ya en main (Ready): nada de la encuesta, de Opinar, del pie con el WhatsApp de soporte ni de
  Opiniones o Encuestas. El WhatsApp que existe es el contacto entre las personas (#65).
- La historia no tiene comentarios; su cuerpo, con las «Decisiones del enjambre» (la última del
  2026-10-08), es la fuente. «500» y «1.000» son largos de texto; las referencias como «docs/03 §7»
  son a documentos del proyecto.
- **Decisiones del enjambre**: las nueve de la historia se copian palabra por palabra a docs/03 §7 en
  esta rama.
- La encuesta, Opinar, el WhatsApp de soporte y las dos pantallas de quien administra son una sola
  capacidad, la instrumentación de docs/03 §7.
- **«Desde el día en que vio la anterior»**: una encuesta está ofrecida cuando la persona la ve por
  primera vez, y la decisión de ofrecerla se toma esa primera vez y no se revisa (decisión de esta
  spec). Revisarla después haría aparecer encuestas de desenlaces viejos, que ya no se recuerdan.
- **Desenlaces anteriores a esta historia no ofrecen encuesta** (decisión de esta spec): son datos de
  prueba y no hay beta todavía.
- **La pantalla de una opinión** se guarda completa solo si es pública; de una privada, solo su
  nombre (decisión de esta spec): qué solicitud o qué animal propio mostraba diría quién la mandó, y
  la historia promete que no se sabe.
- **Solo el día**, sin la hora, en respuestas y opiniones (decisión de esta spec): la hora, cruzada con
  otros registros, podría decir quién fue.
- **El tope de 5 por navegador** es lo que dice la historia; quien borra lo que el navegador guarda
  puede saltarlo, y eso alcanza para frenar el abuso casual de una beta chica.
- **Opinar y el pie están también en la pantalla de cuenta suspendida**: la historia dice todas las
  pantallas; no llevan datos de nadie, y quien está suspendido es justo quien puede necesitar
  escribir.
- **El saludo de WhatsApp** dice algo como «Hola, te escribo desde <nombre del sitio>»; el texto exacto
  lo decide el plan con docs/06. El nombre es el provisorio de docs/04.
- **Borrar una opinión** pide confirmación y no se deshace; la historia no pide más.
- **Un animal borrado o vuelto a publicar** antes de que se responda su encuesta la deja como ofrecida
  sin responder: la persona la vio, y contarla como retirada es solo para «Yo no adopté», como dice la
  historia.
- **Fuera de esta historia**, como dice su alcance: un tablero del funnel o de las métricas de éxito,
  grabar la pantalla, correos o recordatorios de la encuesta, más de una encuesta cada 30 días,
  encuestas en otros momentos, contestar una opinión desde el sitio o saber quién la mandó, cambiar
  las preguntas desde el sitio, un chat de soporte, elegir o conseguir el número, el panel de
  administración consolidado (#73) y las preguntas frecuentes del pie (#8).
