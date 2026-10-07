# Historia #63 — Solicitar la adopción de un animal con el cuestionario

Milestone: M3 - Solicitud de adopción. Cuerpo verbatim del issue al 2026-10-06.

## Historia
**Como** persona que quiere adoptar **quiero** pedir la adopción de un animal desde su ficha,
contestando una sola vez el cuestionario que el rescatista hoy me hace por WhatsApp, **para** que
quien lo publica me tome en serio sin una entrevista de ida y vuelta; y **como** rescatista
**quiero** exigir identidad verificada a quien solicita un animal mío **para** que solo me lleguen
personas reales.

## Contexto
Es el corazón del producto (docs/03 §4): la solicitud pasa por la plataforma, con verificación, en
vez de por un mensaje privado al rescatista (docs/03 §3). Hoy el rescatista hace la misma
entrevista por WhatsApp a cada interesado (docs/01 §Huevo y gallina); el cuestionario estándar es
el trabajo que el sitio le ahorra, y lo que le dice si la persona tiene casa estable, va a castrar y
tiene para el veterinario (docs/01 §"Validación" esconde el problema difícil).

Es también donde se contesta la hipótesis (docs/03 §Hipótesis): acá la verificación deja de ser
abstracta y se le pide a alguien que quiere un animal concreto. Mirar es libre y solicitar exige
verificación (docs/01 §Verificación = fricción). De esta historia salen dos de las métricas de
éxito: qué parte de los adoptantes completa el nivel 2 cuando se lo exigen, y cuántas solicitudes
llegan a aceptarse (docs/03 §Métricas de éxito), que se cierra con la historia siguiente.

Es la primera historia de M3. La bandeja del publicador, aceptar, rechazar, pedir más información y
revelar el contacto son la historia siguiente.

## Alcance
- Incluye: el botón "Quiero adoptar" en la ficha de un animal · el cuestionario de la solicitud y
  su envío · el ingreso y la verificación de teléfono de #10 en el camino, con la vuelta al animal ·
  el nivel mínimo que el publicador exige para solicitar cada animal (teléfono verificado o
  identidad verificada), elegido al publicar o editar · el camino a la verificación de identidad de
  #11 cuando el animal la exige, y la vuelta al animal cuando se aprueba · el límite de 3
  solicitudes activas · la pantalla **Mis solicitudes** con cada solicitud y su estado · ver lo que
  mandé · retirar una solicitud · qué le pasa a una solicitud cuando el animal se pausa, vence, se
  adopta, se borra o se da de baja · qué cambian el bloqueo y la suspensión de #13 al solicitar ·
  que lo escrito no se pierda si se corta la conexión o se recarga.
- No incluye (explícito): la bandeja del publicador, ver las solicitudes de un animal, aceptar,
  rechazar con un motivo, pedir más información y revelar el contacto con el botón de WhatsApp
  (historia siguiente de M3) · los correos por cualquier cambio de una solicitud, al publicador o a
  quien solicita (historia siguiente) · cuántos días puede esperar una solicitud sin respuesta ·
  editar una solicitud ya enviada · preguntas propias de cada rescatista o cambiar el cuestionario
  desde el sitio · exigir el aval (nivel 3) para solicitar · elegir a quién se entregó el animal y
  el compromiso de adopción (M4) · un tope de solicitudes por animal · chat entre las dos personas ·
  avisos por WhatsApp o notificaciones del teléfono · la encuesta después de un rechazo (M4) · el
  paso de la portada que cuenta cómo se pide un animal y cuándo se da el contacto (llega con la
  historia siguiente, cuando aceptar y el contacto existen).

## Reglas de negocio
- Solicita solo quien ingresó y tiene el teléfono verificado (nivel 1, #10). Sin ingresar, "Quiero
  adoptar" pide entrar; sin nivel 1, muestra el aviso de verificación pendiente de #10. En los dos
  casos, al terminar vuelve a ese animal.
- Cada publicación exige un nivel mínimo para solicitar: teléfono verificado (nivel 1) o identidad
  verificada (nivel 2, #11). Se elige al publicar o editar, y arranca en teléfono verificado. La
  ficha dice, antes de tocar nada, cuando un animal pide identidad verificada.
- El nivel se controla antes del cuestionario, nunca después de contestarlo. Quien no tiene el
  nivel 2 que el animal pide ve por qué y el camino para verificar su identidad desde ahí; si su
  pedido está en revisión, lo dice. El correo de identidad aprobada de #11 suma el camino de vuelta
  al animal desde el que se pidió.
- Cambiar el nivel exigido vale para las solicitudes nuevas; las ya enviadas siguen.
- Se puede solicitar un animal disponible o en proceso. En uno en proceso se avisa que el
  publicador ya está avanzando con otra persona y que la solicitud queda por si eso no se concreta.
  Nadie solicita un animal propio: en su ficha ve "Editar", no "Quiero adoptar".
- El cuestionario tiene hasta 12 preguntas sobre los 11 temas de docs/03 §4, con opciones donde la
  respuesta es una categoría y texto donde es una historia. Dos aparecen solo cuando corresponden:
  - Vivienda: casa, apartamento u otra.
  - Si es propia, alquilada u otra situación.
  - Si el contrato o el dueño permite animales (sí, no, no sé), solo si es alquilada.
  - Patio, balcón con red, balcón sin red o ninguno.
  - Quiénes viven en la casa (texto).
  - Otros animales en la casa, cuáles y si están castrados (texto; puede ser "ninguno").
  - Cuántas horas por día quedaría solo: menos de 4, de 4 a 8, más de 8.
  - Qué pasa con el animal si se muda o se va de viaje (texto).
  - Experiencia previa con perros o gatos (texto).
  - Compromiso de castrarlo (sí o no), solo si el animal no está castrado.
  - Si cuenta con plata para vacunas, castración y una urgencia del veterinario: sí, justo, no.
  - Por qué este animal (texto).
- Todas las preguntas son obligatorias. Cada texto tiene hasta 500 caracteres.
- Las respuestas no pueden tener un teléfono, un correo ni un enlace, con la misma explicación que
  la ficha (#53): el contacto se da cuando la solicitud se acepta, nunca antes.
- Desde la segunda solicitud, el cuestionario propone las respuestas de la anterior, todas
  editables, salvo "por qué este animal", que arranca vacía.
- Mandar una solicitud no muestra el teléfono ni el correo de nadie, en ninguna dirección.
- Una persona tiene como máximo 3 solicitudes activas. Una solicitud está activa desde que se envía
  hasta que se retira o se cierra; la historia siguiente suma qué respuestas del publicador la
  cierran. El límite se controla antes del cuestionario, y quien ya tiene 3 ve cuáles son y puede
  retirar una ahí mismo.
- No hay dos solicitudes activas de la misma persona para el mismo animal: si ya tengo una, la ficha
  muestra "Ver mi solicitud". Después de retirarla puedo volver a solicitar.
- Retirar se puede en cualquier momento mientras está activa, pide confirmación y libera el lugar.
- Cuando el animal se **pausa**, **vence** o su publicador deja de tener el teléfono verificado, la
  solicitud sigue activa y Mis solicitudes dice que el animal no está disponible por ahora. Cuando
  se **marca adoptado**, se **borra** o se **da de baja**, la solicitud se cierra y Mis solicitudes
  dice que el animal encontró hogar o que ya no está publicado.
- Entre dos personas donde una bloqueó a la otra (#13) no hay solicitudes: bloquear cierra las
  abiertas entre ellas. La persona bloqueada ve que ese animal no está recibiendo solicitudes, sin
  que se le diga que la bloquearon; quien bloqueó ve que bloqueó a quien lo publica, con la opción
  de desbloquear.
- Una solicitud cerrada por un bloqueo nunca cuenta el bloqueo a la persona bloqueada: si la
  bloqueada es quien solicitó, Mis solicitudes la muestra cerrada porque ese animal ya no recibe
  solicitudes; si quien solicitó es quien bloqueó, la muestra cerrada porque bloqueó a quien lo
  publicó. Desbloquear no la reabre; se puede volver a solicitar.
- Una cuenta suspendida (#13) no solicita, y sus solicitudes activas se cierran. Las solicitudes a
  los animales de una cuenta suspendida se cierran como las de un animal que ya no está publicado.
  Reactivar la cuenta no las reabre.
- Un envío que no llega nunca borra lo escrito: todo sigue en pantalla con el aviso de que no se
  mandó y por qué, y reintentar o tocar dos veces "Enviar solicitud" nunca manda dos. Lo escrito y
  no enviado se conserva al recargar o volver en el mismo navegador; se borra al enviar, al cerrar
  sesión o al borrar la cuenta.
- Cada persona ve solo sus propias solicitudes.

## Criterios de aceptación
### Camino feliz
- **Dado** que tengo el teléfono verificado y Tobi pide teléfono verificado **cuando** toco "Quiero
  adoptar", contesto el cuestionario y toco "Enviar solicitud" **entonces** veo que mi solicitud
  le llegó a quien publicó a Tobi, y Tobi aparece primero en Mis solicitudes como enviada, con la
  fecha y "1 de 3 solicitudes activas".
- **Dado** que no ingresé **cuando** toco "Quiero adoptar" en la ficha de Luna **entonces** se me
  pide entrar, y al entrar llego al cuestionario de Luna.
- **Dado** que publico a Luna **cuando** elijo que pida identidad verificada y publico **entonces**
  su ficha dice que pide identidad verificada para solicitar.
- **Dado** que Luna pide identidad verificada y yo tengo solo el teléfono verificado **cuando** toco
  "Quiero adoptar" **entonces** veo, antes de cualquier pregunta, que quien la publicó pide
  identidad verificada, para qué sirve y "Verificar mi identidad"; cuando me aprueban, el correo me
  trae de vuelta a Luna y puedo solicitarla.
- **Dado** que ya mandé una solicitud por Tobi **cuando** abro el cuestionario de Luna **entonces**
  mis respuestas anteriores están propuestas y "por qué este animal" está vacía.
- **Dado** que tengo una solicitud activa por Tobi **cuando** la abro desde Mis solicitudes y toco
  "Retirar", y confirmo **entonces** queda retirada, deja de contar entre mis activas y la ficha de
  Tobi vuelve a mostrar "Quiero adoptar".

### Casos borde (al menos 3)
- **Dado** que tengo 3 solicitudes activas **cuando** toco "Quiero adoptar" en otro animal
  **entonces** antes de cualquier pregunta veo que llegué al máximo de 3, cuáles son, y puedo
  retirar una y seguir.
- **Dado** que en otra pestaña mandé mi tercera solicitud **cuando** envío una cuarta que ya había
  contestado **entonces** no se manda, veo que llegué al máximo y mis respuestas siguen en pantalla.
- **Dado** que Tobi está en proceso **cuando** toco "Quiero adoptar" **entonces** se me avisa que
  el publicador ya está avanzando con otra persona y que mi solicitud queda por si no se concreta,
  y puedo mandarla.
- **Dado** que Tobi ya está castrado **cuando** contesto su cuestionario **entonces** no aparece la
  pregunta del compromiso de castración.
- **Dado** que mandé una solicitud por Luna **cuando** su publicador la pausa **entonces** en Mis
  solicitudes sigue activa y dice que Luna no está disponible por ahora; **cuando** la marca
  adoptada, se cierra, dice que Luna encontró hogar y deja de contar entre mis activas.
- **Dado** que Tobi pedía teléfono verificado cuando lo solicité **cuando** su publicador cambia a
  identidad verificada **entonces** mi solicitud sigue activa.
- **Dado** que se corta la conexión **cuando** toco "Enviar solicitud" **entonces** veo que no se
  mandó por la conexión, mis respuestas siguen ahí, y al reintentar se manda una sola.
- **Dado** que recargo a mitad del cuestionario **cuando** vuelvo **entonces** mis respuestas siguen
  ahí.
- **Dado** que publiqué a Tobi **cuando** abro su ficha **entonces** veo "Editar" y no "Quiero
  adoptar".

### Errores y rechazos
- **Dado** que no tengo el teléfono verificado **cuando** toco "Quiero adoptar" **entonces** veo el
  aviso de verificación pendiente con el camino para verificarlo, y al terminar vuelvo al animal.
- **Dado** que dejé una pregunta sin contestar **cuando** toco "Enviar solicitud" **entonces** se me
  marca cuál falta y lo demás sigue escrito.
- **Dado** que escribo mi celular en "por qué este animal" **cuando** toco "Enviar solicitud"
  **entonces** no se manda, se marca esa respuesta y se me explica que el contacto se da cuando la
  solicitud se acepta.
- **Dado** que mientras contestaba el publicador marcó adoptado a Tobi **cuando** toco "Enviar
  solicitud" **entonces** no se manda, se me dice que Tobi ya no recibe solicitudes y el camino a
  Animales en adopción.
- **Dado** que quien publicó a Tobi me bloqueó **cuando** toco "Quiero adoptar" **entonces** veo que
  Tobi no está recibiendo solicitudes, sin que se me diga que me bloquearon.
- **Dado** que tenía una solicitud activa por Tobi **cuando** quien lo publicó me bloquea
  **entonces** en Mis solicitudes queda cerrada porque Tobi ya no recibe solicitudes, deja de contar
  entre mis activas, y en ningún lado se me dice que me bloquearon.
- **Dado** que mi cuenta está suspendida **cuando** intento solicitar **entonces** no puedo, y veo
  lo mismo que #13 le muestra a una cuenta suspendida.
- **Dado** que abro el enlace de una solicitud que no es mía **cuando** carga **entonces** veo que
  esa solicitud no existe, igual que si no existiera.

## Pantallas
- **Ficha de un animal** (cambia, de #57 y #59): "Quiero adoptar", o "Ver mi solicitud" si ya tengo
  una activa; la línea que dice que pide identidad verificada; el aviso de en proceso. Vacío: no
  aplica.
- **Cuestionario de la solicitud**: la foto y el nombre del animal, las preguntas y "Enviar
  solicitud". Vacío: la primera vez arranca sin contestar; después, con las respuestas anteriores
  propuestas y "por qué este animal" vacía.
- **Solicitud enviada**: que le llegó a quien publicó el animal, el camino a Mis solicitudes y a
  seguir mirando animales. Vacío: no aplica.
- **Mis solicitudes**: las activas primero, con cuántas de 3 tengo, y después las cerradas y
  retiradas; cada una con la foto y el nombre del animal, la fecha y su estado. Vacío: "Todavía no
  mandaste ninguna solicitud.", con el camino a Animales en adopción.
- **Mi solicitud**: el animal, el estado, lo que contesté y "Retirar" si está activa. Vacío: no
  aplica.
- **Límite alcanzado**: mis 3 solicitudes activas, cada una con "Retirar". Vacío: no aplica.
- **Hace falta identidad verificada**: quién la pide, para qué sirve y "Verificar mi identidad", o
  que mi pedido está en revisión. Vacío: no aplica.
- **Publicar y editar un animal** (cambian, de #53): "Quién puede solicitar", con teléfono
  verificado o identidad verificada. Vacío: arranca en teléfono verificado.
- **Correo de identidad aprobada** (cambia, de #11): suma el camino al animal desde el que se pidió.
  Vacío: no aplica.

## Datos personales
- De cada solicitud se guarda quién la mandó, a qué animal, cuándo, sus respuestas, su estado y
  cuándo cambió. Las respuestas cuentan cómo vive una persona: las ven quien solicitó y quien
  publicó ese animal (desde la bandeja, en la historia siguiente); nadie más, tampoco quien
  administra. Mandar una solicitud no muestra el teléfono ni el correo de ninguna de las dos
  personas. Las respuestas no aceptan teléfonos, correos ni enlaces. Lo escrito sin enviar vive
  solo en el navegador de la persona. Borrar la cuenta borra sus solicitudes y sus respuestas; si
  se borra el animal, quien solicitó sigue viendo su solicitud cerrada.

## Medición
- Tocó "Quiero adoptar" (con o sin sesión, su nivel y el nivel que pide el animal), frenado por
  verificación (qué nivel faltaba) y si después volvió y mandó la solicitud, cuestionario empezado,
  abandonado (en qué pregunta), solicitud enviada y cuánto tardó, respuestas propuestas usadas,
  frenado por el límite de 3, solicitud retirada (días después de enviarla) y solicitud cerrada por
  el animal (por qué). "Clic adoptar" y "completó cuestionario" son el segundo y el tercer paso del
  funnel de docs/03 §7; los frenados por nivel 2 que después mandan la solicitud miden qué parte de
  los adoptantes completa el nivel 2 cuando se lo exigen (docs/03 §Métricas de éxito). Ningún
  evento lleva las respuestas ni datos de la persona.

## Dependencias
- #53 Publicar un animal (la publicación, donde se elige el nivel exigido).
- #57 Ver los animales publicados y la ficha (donde está "Quiero adoptar").
- #59 Mantener al día cada publicación (en proceso, pausa, vencimiento, adopción, borrado y baja).
- #10 Verificación de teléfono (el nivel 1 y el aviso de verificación pendiente).
- #11 Verificación de identidad (el nivel 2 y su correo de aprobación).
- #13 Reportar, bloquear y suspender (el bloqueo y la suspensión).
- docs/03 §4 y §Métricas de éxito · docs/01 §Verificación = fricción y §Huevo y gallina · docs/06
  §Cuestionario (cambiar el texto de una pregunta no rompe respuestas ya enviadas) · docs/10.

## Decisiones del enjambre
- **Decisión (2026-09-27, product-owner):** el cuestionario tiene hasta 12 preguntas sobre los 11 temas de
  docs/03 §4, con opciones donde la respuesta es una categoría y texto de hasta 500 caracteres donde
  es una historia, todas obligatorias; el permiso del dueño aparece solo si la vivienda es alquilada
  y el compromiso de castración solo si el animal no está castrado. Es la primera versión: docs/03 pide diseñarlo con 3-4 rescatistas, y se les muestra
  antes de la beta; cambiar el texto de una pregunta no rompe las respuestas ya enviadas (docs/06
  §Cuestionario). Motivo: son las preguntas que el rescatista hoy hace por WhatsApp; las opciones le
  dejan comparar solicitantes de un vistazo y el texto deja ver a la persona. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** desde la segunda solicitud se proponen las respuestas de
  la anterior, salvo "por qué este animal". Motivo: con el límite de 3 un adoptante solicita varios
  animales, y volver a escribir su casa entera cada vez es la fricción que lo devuelve a Facebook;
  "por qué este animal" es lo que el rescatista lee para saber que no es una solicitud en serie. Va
  en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** el nivel mínimo se elige al publicar o editar, arranca
  en teléfono verificado, se ve en la ficha y se controla antes del cuestionario; el correo de
  identidad aprobada lleva de vuelta al animal. Motivo: quien descubre el requisito después de
  escribir todo el cuestionario abandona por enojo, no por la verificación, y eso ensuciaría la métrica de
  cuántos completan el nivel 2 cuando se lo piden. Va en docs/03 §2.
- **Decisión (2026-09-27, product-owner):** una solicitud está activa desde que se envía hasta que
  se retira o se cierra; una pausa, un vencimiento o un publicador sin verificar no la cierran, y
  un animal adoptado, borrado o dado de baja sí. El límite se controla antes del cuestionario y se
  puede retirar una ahí mismo. Motivo: una pausa suele ser una enfermedad o un tratamiento y el
  adoptante sigue interesado; quien llegó al límite necesita un camino que no sea perder lo
  escrito. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** un animal en proceso recibe solicitudes, con el aviso
  de que el publicador ya avanza con otra persona. Motivo: es el "RESERVADO" del grupo (#59), y el
  rescatista necesita otra opción si la primera no se concreta. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** las respuestas no aceptan teléfonos, correos ni
  enlaces. Motivo: el contacto se revela solo al aceptar (docs/03 §1); un teléfono en la respuesta
  saltea la verificación del publicador y la aceptación que se quiere medir. Es la misma regla que
  la ficha (#53). Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** entre dos personas donde una bloqueó a la otra no hay
  solicitudes, y la bloqueada no se entera; una cuenta suspendida no solicita, y las solicitudes de
  ella o a sus animales se cierran. Motivo: bloquear es la herramienta del rescatista para dejar de
  recibir a alguien, y avisarle al bloqueado lo empuja a insistir por otro lado (#13). Va en docs/03
  §4.
- **Decisión (2026-09-27, product-owner):** las respuestas las ven solo quien solicitó y quien
  publicó el animal, no quien administra, y se borran al borrar la cuenta de quien solicitó.
  Motivo: cuentan cómo vive una persona, y docs/03 §4 las muestra solo en la bandeja del publicador;
  guardar lo mínimo es la regla de datos (docs/01 §Legal / datos). Va en docs/03 §4.
- **Decisión (2026-10-06, product-owner):** quien queda bloqueado ve su solicitud cerrada porque el
  animal ya no recibe solicitudes, nunca porque lo bloquearon; quien bloqueó ve que se cerró por su
  bloqueo; desbloquear no reabre la solicitud. Motivo: #13 ya decidió que la persona bloqueada no se
  entera, y una solicitud que de un día para otro dice "bloqueado" se lo contaría; reabrirla al
  desbloquear le mandaría al rescatista una solicitud que creía cerrada. Va en docs/03 §4.
- **Decisión (2026-10-06, product-owner):** el paso de la portada que cuenta cómo se pide un animal
  y cuándo se da el contacto lo agrega la historia siguiente de M3 (responder las solicitudes), no
  esta. Motivo: la decisión de la portada (2026-09-27, #61) dice que solo cuenta lo que el sitio ya
  hace, y con esta historia sola todavía no hay aceptar ni contacto, que es la promesa entera. Va en
  docs/03 §3.
- **Decisión (2026-09-27, product-owner):** mandar una solicitud avisa solo en pantalla; los correos
  por una solicitud nueva o por su respuesta llegan con la bandeja. Motivo: un correo que avisa una
  solicitud tiene que llevar a donde se responde, y eso es la historia siguiente. Va en docs/03 §4.



