## Historia
**Como** quien administra el sitio a mano y a ratos **quiero** entrar a un solo lugar que me diga
qué está esperando, desde cuándo y qué ya se pasó de plazo, recibir un resumen por la mañana cuando
hay algo, y ver todo lo que sé de una persona en una sola ficha **para** que nadie espere de más su
verificación ni una venta quede a la vista, y para decidir un reporte o una suspensión con todos los
antecedentes delante.

## Contexto
docs/03 §6 pide un panel de admin con tres colas: verificaciones de cédula, publicaciones nuevas y
reportes con suspensiones. Cada una ya llegó con su historia (#11, #59, #13), y #71 sumó Opiniones y
Encuestas. Lo que falta es juntarlas: hoy son seis listas sueltas a las que se llega desde seis
accesos al pie de «Tu identidad», en Mi perfil, y cada una vuelve a Mi perfil. No hay un lugar que
diga qué está atrasado ni un aviso cuando algo espera, y los antecedentes de una persona están
repartidos entre esas listas.

La revisión es a mano y part-time (docs/01 §Legal / datos). Si la cola de identidad se atrasa, quien
pidió el nivel 2 abandona en la espera, y la métrica "¿qué % de adoptantes completa nivel 2 cuando se
lo exigen?" (docs/03 §Métricas de éxito) mediría la demora del equipo en vez de la fricción de la
verificación. Si la cola de publicaciones se atrasa, una venta o unas fotos robadas quedan a la
vista, que es justo lo que el sitio promete evitar frente a un grupo de Facebook (docs/01). Esta
historia mantiene las colas al día para que la hipótesis se lea limpia.

Es la última historia de M4 y la que cierra docs/03 §6.

## Alcance
- Incluye: **Administrar**, el inicio de quien administra, con cada cola que espera a una persona
  (Pedidos de identidad, Publicaciones por revisar, Reportes sin resolver), cuántos hay, desde
  cuándo espera el más viejo y si se pasó de plazo, y la entrada a Cuentas suspendidas, Opiniones y
  Encuestas · la entrada a Administrar en el menú, solo para quien administra, con cuántos pendientes
  hay · en Mi perfil, un solo acceso a Administrar en lugar de los seis sueltos, y cada una de las
  seis listas vuelve a Administrar · el **resumen por correo** de cada mañana a cada persona que
  administra, solo si hay algo esperando · la **ficha de una persona para quien administra**, a la
  que se llega desde cada cola, desde Cuentas suspendidas y buscando por nombre, con sus antecedentes
  y la opción de suspender o reactivar · buscar a una persona por nombre.
- No incluye (explícito): las colas en sí, que ya trae cada historia (#11, #13, #59, #71) · un
  tablero del funnel o de las métricas de éxito (#71 lo dejó para la herramienta de medición de M5) ·
  designar a quien administra desde el sitio (lo hace el equipo, fuera del sitio) · buscar a una
  persona por correo o por teléfono · ver el teléfono, el correo, las imágenes de identidad, las
  solicitudes o las respuestas al cuestionario de una persona · ver a quién bloqueó una persona o
  quién la bloqueó · unir a una persona con sus opiniones o sus respuestas a las encuestas, que siguen
  sin nombre (#71) · asignar pendientes a una persona que administra · un registro de lo que hizo
  cada persona que administra · deshacer una baja o editar la publicación de otro · borrar cuentas o
  datos de otra persona desde el sitio · elegir desde el sitio si llega el resumen o a qué hora ·
  avisos por WhatsApp o notificaciones del teléfono (fuera del MVP).

## Reglas de negocio
- Administrar, la ficha de una persona y el resumen existen solo para quien administra (#11). Para
  cualquier otra persona, la dirección de Administrar y la de una ficha se ven como una página que
  no existe, y ni el menú ni Mi perfil muestran la entrada.
- Cada cola tiene un plazo, contado desde que el pendiente entró: **pedidos de identidad, 2 días**
  (la demora que se le anuncia a quien pidió, #11; el pedido vence solo a los 7); **publicaciones por
  revisar, 1 día** (sale en el momento, #59, así que lo que no se revisa está a la vista); **reportes
  sin resolver, 2 días**. Una cola cuyo pendiente más viejo pasó su plazo se muestra atrasada,
  primero y con cuánto se pasó.
- Lo que una persona que administra no puede resolver porque es suyo (su pedido, su publicación, un
  reporte sobre ella; #11, #13, #59) no le cuenta en sus números, en sus plazos ni en su resumen: se
  le muestra aparte como "espera a otra persona que administre", sin el motivo ni el texto de un
  reporte sobre ella (#13).
- La entrada del menú y el acceso de Mi perfil muestran la suma de los pendientes de las tres colas
  que esa persona puede resolver; con cero, se ven sin número.
- Opiniones y Encuestas no tienen plazo: Administrar muestra cuántas llegaron en los últimos 7 días,
  contados por día, que es lo único que de ellas se guarda (#71).
- **El resumen** llega una vez por día, a las 8 de la mañana, hora de Uruguay, a la dirección de la
  cuenta de cada persona que administra, solo si tiene algo que puede resolver esperando. Dice
  cuántos hay en cada cola, desde cuándo espera el más viejo y cuáles se pasaron de plazo, con un
  enlace a Administrar. No lleva nombres, fotos, motivos ni textos de nadie. Si no hay nada, no llega.
- **La ficha de una persona** muestra lo que quien administra ya ve en cada cola, junto: nombre,
  foto, zona, nivel y fecha de alta; su verificación de identidad, con lo que #11 guarda (el día en
  que se verificó, o los rechazos y vencimientos con su motivo mientras se guardan); los reportes
  sobre ella con el motivo, el texto, cuándo y cómo se resolvieron; sus suspensiones y
  reactivaciones con el motivo, quién y cuándo; y sus publicaciones con su estado y las bajas con su
  motivo. Nunca el teléfono, el correo, las imágenes de identidad, sus solicitudes, sus bloqueos ni
  sus opiniones.
- Desde la ficha se suspende con un motivo o se reactiva, con las mismas reglas de #13: nadie se
  suspende a sí mismo y, si otra persona que administra ya lo hizo, se ve y no se repite.
- Buscar encuentra por nombre, con al menos 3 letras, sin importar tildes ni mayúsculas, incluidas
  las cuentas suspendidas, y muestra hasta 20 resultados con foto, nombre y zona para distinguir
  dos personas con el mismo nombre. Una cuenta borrada no aparece.

## Criterios de aceptación
### Camino feliz
- **Dado** que administro el sitio y hay 3 pedidos de identidad, el más viejo de hace 3 días, y 2
  publicaciones por revisar de hoy **cuando** abro Administrar **entonces** veo primero los pedidos
  de identidad, atrasados por 1 día, después las publicaciones, al día, y los reportes en cero, y
  desde cada uno llego a su lista.
- **Dado** que administro el sitio y hay 5 pendientes que puedo resolver **cuando** miro el menú o
  abro Mi perfil **entonces** veo Administrar con un 5, y en Mi perfil ya no están los seis accesos
  sueltos.
- **Dado** que estoy en Reportes **cuando** toco volver **entonces** llego a Administrar, no a Mi
  perfil; lo mismo desde Pedidos de identidad, Publicaciones por revisar, Cuentas suspendidas,
  Opiniones y Encuestas.
- **Dado** que a las 8 de la mañana hay 2 reportes sin resolver **cuando** llega el resumen
  **entonces** dice "2 reportes sin resolver, el más viejo de hace 20 horas", sin nombres ni motivos,
  y su enlace me lleva a Administrar.
- **Dado** que estoy resolviendo un reporte sobre Bruno **cuando** toco su nombre y abro su ficha
  **entonces** veo junto su nivel, su pedido de identidad rechazado hace 10 días con el motivo, un
  reporte anterior cerrado sin medidas y sus dos publicaciones, una dada de baja por venta, y puedo
  suspenderlo con un motivo desde ahí.
- **Dado** que alguien escribió al correo de ayuda diciendo que se llama Marta Suárez **cuando**
  busco "marta suarez" **entonces** la encuentro con su foto y su zona y abro su ficha.

### Casos borde (al menos 3)
- **Dado** que soy la única persona que administra y publiqué a Tobi hace 2 días **cuando** abro
  Administrar **entonces** Tobi no cuenta en mis publicaciones por revisar ni las marca atrasadas, y
  lo veo aparte como "espera a otra persona que administre".
- **Dado** que no hay nada esperando en ninguna cola, o solo lo mío **cuando** llegan las 8 de la
  mañana **entonces** no me llega ningún resumen.
- **Dado** que otra persona que administra resolvió el último pedido atrasado **cuando** vuelvo a
  Administrar **entonces** la cola ya no se ve atrasada y el número del menú bajó.
- **Dado** que la persona de una ficha borró su cuenta **cuando** abro el enlace a su ficha
  **entonces** veo que esa cuenta ya no existe, y su nombre no aparece en la búsqueda.
- **Dado** que Bruno está suspendido **cuando** abro su ficha **entonces** la veo con "Suspendida",
  el motivo, quién y cuándo, y la opción de reactivar, aunque su perfil público no exista.
- **Dado** que dos personas se llaman Ana Pérez **cuando** busco "ana perez" **entonces** veo las dos,
  cada una con su foto y su zona.
- **Dado** que abro mi propia ficha **cuando** la miro **entonces** no tengo la opción de
  suspenderme, y un reporte sobre mí sin resolver se ve como "espera a otra persona que administre",
  sin motivo ni texto.

### Errores y rechazos
- **Dado** que no administro el sitio **cuando** abro la dirección de Administrar o la de una ficha
  **entonces** veo que no existe, igual que una dirección cualquiera, y ni mi menú ni Mi perfil
  tienen la entrada.
- **Dado** que busco con menos de 3 letras **cuando** busco **entonces** se me pide escribir al menos
  3; si no hay nadie con ese nombre, se me dice que no encontré a nadie.
- **Dado** que intento suspender desde una ficha sin motivo **cuando** confirmo **entonces** no se
  suspende y se me pide el motivo.
- **Dado** que otra persona que administra suspendió a Bruno mientras yo miraba su ficha **cuando**
  toco suspender **entonces** veo que ya está suspendido, por quién y cuándo, y no se suspende de nuevo.
- **Dado** que se corta la conexión **cuando** abro Administrar o busco **entonces** se me dice que no
  se pudo por la conexión y puedo reintentar, sin perder lo que escribí en la búsqueda.
- **Dado** que no se pudo contar una cola **cuando** abro Administrar **entonces** esa cola dice que
  no se pudo contar y sigue llevando a su lista, y las demás se ven igual.

## Pantallas
- **Administrar** (nuevo): las tres colas con cuántos, desde cuándo espera el más viejo y si están
  atrasadas, las atrasadas primero; lo que espera a otra persona que administre, aparte; la entrada a
  Cuentas suspendidas, Opiniones (llegadas en 7 días) y Encuestas (respuestas en 7 días); y buscar
  a una persona. Vacío: "No hay nada esperando", con las tres colas en cero y las entradas igual.
- **Menú** (cambia): la entrada Administrar con el número de pendientes, solo para quien administra.
  Vacío: la entrada sin número.
- **Mi perfil** (cambia): al pie de «Tu identidad», un solo acceso a Administrar con el número de
  pendientes, en lugar de los seis accesos sueltos. Vacío: el acceso sin número.
- **Resultados de búsqueda** (nuevo): hasta 20 personas con foto, nombre y zona. Vacío: "No
  encontramos a nadie con ese nombre."
- **Ficha de una persona para quien administra** (nuevo): sus datos del perfil, nivel, pedidos de
  identidad, reportes, suspensiones y publicaciones, con suspender o reactivar. Vacío: cada parte sin
  antecedentes dice "Sin pedidos de identidad", "Sin reportes", "Sin suspensiones", "Sin
  publicaciones".
- **Pedidos de identidad, Publicaciones por revisar, Reportes y Cuentas suspendidas** (cambian, de
  #11, #59 y #13): el nombre de cada persona lleva a su ficha, y volver lleva a Administrar. Vacío:
  los de cada historia, con la vuelta a Administrar.
- **Opiniones y Encuestas** (cambian, de #71): volver lleva a Administrar. Vacío: los de #71, con la
  vuelta a Administrar.
- **Correo del resumen** (nuevo): cada cola con cuántos, desde cuándo y si está atrasada, y el enlace
  a Administrar. Vacío: no aplica; sin pendientes no se manda.

## Datos personales
- Esta historia no guarda ningún dato nuevo de las personas: la ficha junta lo que quien administra
  ya ve en cada cola, y lo ve solo quien administra. No muestra el teléfono, el correo, las imágenes
  de identidad, las solicitudes, los bloqueos ni las opiniones de nadie, y la búsqueda es solo por
  nombre. El resumen va a la dirección de la cuenta de quien administra y no lleva nombres, fotos,
  motivos ni textos (hasta que exista el dominio, el correo real llega solo a la dirección de la
  cuenta del servicio de correo, KL-006). Lo que se borra en cada historia al borrar una cuenta deja
  de verse en la ficha, que para una cuenta borrada no existe.

## Medición
- Administrar abierto (desde el menú, desde Mi perfil o desde el resumen), resumen enviado (cuántos
  por cola, horas del más viejo y cuáles atrasadas), cola atrasada (cuál y cuántas horas), ficha
  abierta (desde qué cola, desde Cuentas suspendidas o desde la búsqueda) y búsqueda hecha (si
  encontró a alguien, nunca el texto). Las horas en cola junto al abandono del nivel 2 dicen si la
  fricción que se mide es la de verificarse o la de esperar (docs/03 §Métricas de éxito). Ningún
  evento lleva datos de las personas.

## Dependencias
- #11 Verificación de identidad (quién administra, Pedidos de identidad, la espera de 2 días).
- #13 Reportar, bloquear y suspender (Reportes, Cuentas suspendidas, suspender y reactivar).
- #59 Mantener al día cada publicación (Publicaciones por revisar y las bajas).
- #71 Encuestas y opiniones (Opiniones y Encuestas) · #12 Perfil público (lo que muestra la ficha).
- docs/03 §6 y §Métricas de éxito · docs/01 §Legal / datos y §Verificación = fricción · docs/07
  (la tarea diaria) · docs/06 · docs/10 · docs/known-limitations.md KL-006.

## Decisiones del enjambre
- **Decisión (2026-09-27, product-owner):** cada cola tiene un plazo a la vista: pedidos de identidad
  2 días, publicaciones por revisar 1 día, reportes sin resolver 2 días; la cola que se pasa se
  muestra atrasada y primero. Motivo: 2 días es lo que #11 le promete a quien pide el nivel 2; una
  publicación sale sin revisar (#59), así que cada día sin revisión es una venta posible a la vista.
  Va en docs/03 §6.
- **Decisión (2026-09-27, product-owner):** quien administra recibe un resumen por correo cada mañana,
  solo si tiene algo que resolver esperando, sin nombres ni textos. Motivo: la revisión es a mano y
  part-time, y sin un aviso depende de acordarse de entrar; el correo es el canal que ya existe
  (notificaciones del teléfono fuera del MVP) y la tarea diaria ya está en docs/07. Va en docs/03 §6.
- **Decisión (2026-09-27, product-owner):** lo que es de quien administra no le cuenta ni lo marca
  atrasado: se le muestra aparte como "espera a otra persona que administre". Motivo: nadie resuelve
  lo suyo (#11, #13, #59); contarlo le daría un pendiente que no puede sacar y, con una sola persona
  administrando, una cola siempre atrasada que tapa las demás. Va en docs/03 §6.
- **Decisión (2026-09-27, product-owner):** la ficha de una persona para quien administra junta solo
  lo que ya se ve en cada cola, nunca el teléfono, el correo, las imágenes de identidad ni las
  solicitudes, y se busca por nombre, no por correo ni teléfono. Motivo: decidir un reporte con los
  antecedentes a la vista es lo que docs/03 §6 pide, y hacerlo sin crear ningún acceso nuevo a
  datos personales evita una regla de privacidad que docs/01 §Legal / datos no trae. Va en docs/03 §6.
- **Decisión (2026-10-09, product-owner):** Administrar reemplaza a los seis accesos sueltos de Mi
  perfil por uno solo, y las seis listas vuelven a Administrar en lugar de a Mi perfil. Motivo: dos
  caminos a lo mismo con números distintos confunden, y quien administra vuelve al lugar que le dice
  qué sigue, no a su propio perfil. Va en docs/03 §6.
- **Decisión (2026-10-09, product-owner):** el resumen sale a las 8 de la mañana, hora de Uruguay.
  Motivo: llega antes de que quien administra a ratos arranque el día, y es una sola corrida diaria,
  la misma que ya permite el plan gratuito (docs/07 §Riesgos conocidos de los tiers gratuitos). Va
  en docs/03 §6.
- **Decisión (2026-10-09, product-owner):** la ficha no muestra los bloqueos de la persona ni la une
  con sus opiniones o sus respuestas a las encuestas. Motivo: bloquear es privado y la persona
  bloqueada no se entera (docs/03 §1), y #71 prometió que una opinión no dice quién la mandó; ante
  dos opciones razonables, la que muestra menos (Ley 18.331). Va en docs/03 §6.


---
_Generated by [Claude Code](https://claude.ai/code)_
