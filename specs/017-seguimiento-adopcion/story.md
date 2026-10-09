## Historia
**Como** rescatista **quiero** que a los 30 días de dar un animal el sitio le pregunte a quien lo
adoptó cómo va, con fotos, y que su respuesta me llegue, **para** saber cómo está sin perseguir a
nadie por WhatsApp; y **como** persona que adoptó **quiero** contarlo en un paso y que mi perfil
muestre las adopciones con seguimiento, **para** que la próxima vez que pida un animal se vea que
cumplo.

## Contexto
Es el cierre del cierre (docs/03 §5): "un seguimiento automático a los 30 días: foto + '¿cómo va?'.
El rescatista lo ve. Si responde, badge 'adopción con seguimiento'". Lo que más le importa a un
rescatista de una persona verificada es si "va a mandar fotos" (docs/01 §"Validación" esconde el
problema difícil), y hoy lo averigua escribiendo por WhatsApp semanas después. Los "recordatorios de
seguimiento" están entre las herramientas que le ahorran trabajo y lo mudan del grupo (docs/01
§Huevo y gallina).

Para la hipótesis (docs/03 §Hipótesis) cierra el sistema de confianza por niveles: el historial de
adopciones con seguimiento (docs/01, docs/03 §1 "historial") es la única señal de confianza que no
se consigue con un documento, y es lo que #12 dejó para esta historia. Si quienes adoptan responden,
el rescatista tiene una razón más para recibir las solicitudes por el sitio y no por el grupo.

Usa el vínculo entre el animal y quien lo adoptó que crea #67. Es la segunda historia de M4.

## Alcance
- Incluye: el pedido de seguimiento a quien adoptó, con un solo correo el día en que se cumplen 30
  días desde que se marcó adoptado · responder con fotos y unas líneas desde Mi solicitud · el aviso
  por correo a quien publicó cuando llega la respuesta · ver la respuesta en Mis animales y en Mi
  solicitud · el sello "Adopción con seguimiento" en esa adopción · cuántas adopciones con
  seguimiento dio y adoptó cada persona, en su perfil público, en la ficha junto a quien publica y en
  una solicitud junto a quien la mandó.
- No incluye (explícito): recordatorios si no responde · un segundo seguimiento (a los 6 meses, al
  año) · que el rescatista pida un seguimiento cuando quiera o lo cargue él · editar o borrar una
  respuesta ya mandada, o sumarle fotos · comentar, reaccionar o puntuar una respuesta · mostrar las
  fotos del seguimiento en la ficha o en el perfil público, o compartirlas desde el sitio · juzgar si
  la respuesta es buena o mala · seguimiento de adopciones por fuera del sitio · la encuesta después
  de adoptar (historia de instrumentación de M4) · el panel de quien administra (M4) · avisos por
  WhatsApp o notificaciones del teléfono · el traspaso del chip (docs/05).

## Reglas de negocio
- El seguimiento se pide una sola vez por adopción, a quien adoptó, el día en que se cumplen 30 días
  desde que quien publicó marcó adoptado al animal eligiendo a esa persona (#67). Las adopciones por
  fuera del sitio no tienen seguimiento.
- No se pide si antes de ese día la adopción terminó (el animal volvió a publicarse), se deshizo con
  "Yo no adopté", se borró el animal o una de las dos cuentas, una de las dos bloqueó a la otra (#13)
  o la cuenta de una de las dos está suspendida (#13).
- Quien adoptó recibe un correo con la foto de portada del animal, "¿Cómo va <nombre>?" y "Contar
  cómo va", que lleva a Mi solicitud, con ingreso si hace falta. El correo no lleva el teléfono de
  nadie.
- **La respuesta** es de 1 a 3 fotos y, si quiere, un texto de hasta 500 caracteres. Sin foto no se
  manda. Se manda una sola vez y no se edita. Se puede responder cualquier día después del pedido,
  mientras la adopción siga y la cuenta no esté suspendida; no hace falta tener el teléfono
  verificado.
- **Un pedido sin respuesta se cierra** si después del pedido la adopción termina (el animal vuelve a
  publicarse), se deshace con "Yo no adopté" o una de las dos bloquea a la otra: ya no se puede
  responder, Mi solicitud deja de ofrecerlo y Mis animales dice "Seguimiento sin respuesta". No cuenta
  en ningún perfil.
- Al responder, quien publicó recibe un correo "<nombre de quien adoptó> contó cómo va <animal>", con
  la primera foto y el camino a Mis animales, donde ve las fotos, el texto y la fecha.
- Una respuesta convierte esa adopción en "Adopción con seguimiento" para las dos personas, y le
  saca a quien adoptó la opción "Yo no adopté" (#67) si el compromiso seguía pendiente. No acepta el
  compromiso por esa persona.
- **El perfil público** (#12) de cada persona muestra cuántas adopciones con seguimiento dio y
  cuántas adoptó, cada número solo si es 1 o más, sin decir qué animales ni con quién. La ficha
  (#57) muestra, junto a quien publica, cuántas adopciones con seguimiento dio. Una solicitud, para
  el publicador (#65), muestra cuántas adoptó quien la mandó.
- Una adopción que terminó después de tener seguimiento (el animal volvió al rescatista) sigue
  contando: la persona respondió.
- Las fotos y el texto de la respuesta los ven solo las dos personas de esa adopción. Si después una
  bloquea a la otra (#13), cada una deja de ver lo que escribió o mandó la otra; el sello y los
  números de los perfiles quedan como estaban.
- Tocar dos veces "Mandar" deja una sola respuesta y manda un solo correo. Cada persona responde solo
  los seguimientos de sus adopciones.

## Criterios de aceptación
### Camino feliz
- **Dado** que marqué adoptado a Tobi eligiendo a Ana hace 30 días **cuando** llega ese día
  **entonces** Ana recibe un solo correo con la foto de Tobi, "¿Cómo va Tobi?" y "Contar cómo va", y
  en Mis animales veo "Seguimiento pedido el <fecha>, sin respuesta todavía".
- **Dado** que Ana abre el correo **cuando** sube 2 fotos, escribe "Duerme en el sillón y ya no le
  tiene miedo a la correa" y toca "Mandar" **entonces** ve su respuesta con la fecha y el sello
  "Adopción con seguimiento" en Mi solicitud, y yo recibo un correo "Ana contó cómo va Tobi" con la
  primera foto.
- **Dado** que Ana respondió **cuando** abro Tobi en Mis animales **entonces** veo las 2 fotos, el
  texto, la fecha y el sello "Adopción con seguimiento".
- **Dado** que di 3 animales por el sitio y 2 tienen el seguimiento respondido **cuando** alguien abre
  mi perfil público o la ficha de un animal mío **entonces** ve "2 adopciones con seguimiento", sin
  nombres de animales ni de personas; y en el perfil de Ana ve que adoptó 1 con seguimiento.

### Casos borde (al menos 3)
- **Dado** que Ana nunca responde **cuando** pasan 60 días desde la adopción **entonces** no recibió
  ningún otro correo, en Mis animales sigue "sin respuesta todavía" y todavía puede responder desde
  Mi solicitud.
- **Dado** que volví a publicar a Tobi a los 20 días porque Ana me lo devolvió **cuando** se cumplen
  los 30 **entonces** Ana no recibe ningún pedido de seguimiento.
- **Dado** que di a Luna a alguien que no vino por el sitio **cuando** se cumplen 30 días **entonces**
  no se le pide seguimiento a nadie.
- **Dado** que Ana respondió y después me devolvió a Tobi **cuando** lo vuelvo a publicar **entonces**
  la respuesta sigue a la vista de las dos y las dos seguimos contando esa adopción con seguimiento.
- **Dado** que el compromiso de Ana seguía pendiente **cuando** responde el seguimiento **entonces**
  ya no se le ofrece "Yo no adopté a Tobi" y el compromiso sigue pendiente.
- **Dado** que Ana toca dos veces "Mandar" **cuando** termina **entonces** queda una sola respuesta y
  yo recibo un solo correo.
- **Dado** que una persona no tiene adopciones con seguimiento **cuando** se abre su perfil público
  **entonces** no aparece ningún número de adopciones, ni un cero.
- **Dado** que a Ana se le pidió el seguimiento y no respondió **cuando** a los 40 días me devuelve a
  Tobi y lo vuelvo a publicar **entonces** Mi solicitud de Ana ya no le ofrece contar cómo va, en Mis
  animales veo "Seguimiento sin respuesta" y esa adopción no cuenta en ningún perfil.
- **Dado** que Ana respondió **cuando** después la bloqueo **entonces** ninguna de las dos ve más lo
  que mandó la otra, y la adopción sigue contando con seguimiento en los dos perfiles.
- **Dado** que mi cuenta está suspendida el día en que se cumplen los 30 **cuando** llega ese día
  **entonces** a Ana no se le pide el seguimiento.

### Errores y rechazos
- **Dado** que Ana toca "Mandar" sin ninguna foto **cuando** lo intenta **entonces** se le dice que
  hace falta al menos una foto, y lo escrito queda.
- **Dado** que Ana elige 4 fotos o un archivo que no es una foto **cuando** lo sube **entonces** se le
  dice que son hasta 3 fotos y cuál no se pudo usar, y conserva las que sí.
- **Dado** que se corta la conexión **cuando** Ana toca "Mandar" **entonces** no se manda nada, se le
  dice que no se pudo por la conexión, conserva las fotos y el texto y puede reintentar.
- **Dado** que abro el enlace del seguimiento de una adopción que no es mía **cuando** carga
  **entonces** veo que no existe, igual que si no existiera.
- **Dado** que la cuenta de Ana está suspendida **cuando** intenta responder **entonces** no puede, y
  ve lo mismo que #13 le muestra a una cuenta suspendida.
- **Dado** que Ana ya respondió **cuando** vuelve al enlace del correo **entonces** ve su respuesta y
  no la opción de mandar otra.

## Pantallas
- **Mi solicitud** (cambia, de #63 y #67): el pedido "¿Cómo va <nombre>?" con las fotos y el texto
  para responder, o la respuesta mandada con su fecha y el sello "Adopción con seguimiento". Vacío:
  antes de los 30 días no muestra nada del seguimiento.
- **Mis animales** (cambia, de #59 y #67): en un adoptado, "Seguimiento pedido el <fecha>, sin
  respuesta todavía", o las fotos, el texto, la fecha y el sello. Vacío: antes de los 30 días, o en una
  adopción por fuera del sitio, no muestra nada del seguimiento.
- **Mis solicitudes** (cambia, de #63): "Contá cómo va" en una adopción con el seguimiento pedido y
  sin responder. Vacío: el de #63.
- **Perfil público** (cambia, de #12): cuántas adopciones con seguimiento dio y cuántas adoptó. Vacío:
  sin ninguna, no muestra la línea.
- **Ficha de un animal** (cambia, de #57): junto a quien publica, cuántas adopciones con seguimiento
  dio. Vacío: sin ninguna, no muestra el número.
- **Una solicitud, para el publicador** (cambia, de #65): cuántas adopciones con seguimiento tiene
  quien la mandó. Vacío: sin ninguna, no muestra el número.
- **Correos**: "¿Cómo va <nombre>?" (a quien adoptó) y "<persona> contó cómo va <animal>" (a quien
  publicó). Vacío: no aplica.

## Datos personales
- Se guarda cuándo se pidió el seguimiento de cada adopción, las fotos y el texto de la respuesta y
  cuándo se mandó. Las fotos y el texto los ven solo las dos personas de esa adopción: nunca la ficha,
  el perfil público ni el listado. El perfil público muestra a cualquiera solo cuántas adopciones con
  seguimiento dio y adoptó cada persona, sin animales ni personas. Los correos no llevan el teléfono
  ni el texto de la respuesta. Un bloqueo entre las dos personas le saca a cada una la vista de lo que
  mandó la otra. Borrar la cuenta de quien adoptó borra su respuesta junto con la
  solicitud y el vínculo (#67); borrar el animal o la cuenta de quien publicó la borra también, y esa
  adopción deja de contar en los perfiles.

## Medición
- Seguimiento pedido, respondido (días después del pedido, cuántas fotos, con texto o sin), respuesta
  abierta por quien publicó y seguimientos que no se pidieron porque la adopción terminó, se deshizo
  o hubo un bloqueo. La parte de los seguimientos respondidos dice si quien adoptó por el sitio
  sostiene lo que prometió, y el historial es la señal de confianza que el sitio suma sobre Facebook
  (docs/03 §Hipótesis). Ningún evento lleva datos de las personas.

## Dependencias
- #67 Marcar a quién se entregó cada animal (el vínculo, Mi solicitud y Mis animales de una adopción).
- #12 Perfil público y distintivos · #57 Ficha de un animal · #65 Una solicitud, para el publicador ·
  #63 Mi solicitud y Mis solicitudes · #59 Mis animales y volver a publicar · #53 Fotos de la ficha ·
  #13 Bloquear y suspender.
- docs/03 §1 y §5 · docs/01 §"Validación" esconde el problema difícil y §Huevo y gallina · docs/06
  (seguimiento) · docs/10 (quien publica, con cuántas adopciones con seguimiento).

## Decisiones del enjambre
- **Decisión (2026-09-27, product-owner):** el seguimiento se pide una sola vez, a los 30 días de
  marcar adoptado, con un solo correo y sin recordatorios, y se puede responder cualquier día después.
  Motivo: docs/03 §5 dice "un seguimiento"; insistir por correo es la persecución que el rescatista
  ya hace por WhatsApp, y un plazo solo agregaría un estado sin ayudar a nadie. Va en docs/03 §5.
- **Decisión (2026-09-27, product-owner):** la respuesta es de 1 a 3 fotos, obligatorias, y un texto
  opcional de hasta 500 caracteres, y no se edita. Motivo: la foto es lo que el rescatista quiere ver
  (docs/01: "¿va a mandar fotos?") y lo que docs/03 §5 pide; un texto obligatorio sería fricción sin
  prueba nueva, y una respuesta editable dejaría cambiar lo que el sello certifica. Va en docs/03 §5.
- **Decisión (2026-09-27, product-owner):** quien publicó recibe un correo cuando llega la respuesta y
  la ve en Mis animales. Motivo: "el rescatista lo ve" (docs/03 §5) solo pasa si se entera; sin aviso,
  la respuesta queda esperando a que entre. Va en docs/03 §5.
- **Decisión (2026-09-27, product-owner):** el historial de adopciones del perfil público son dos
  números, cuántas adopciones con seguimiento dio y cuántas adoptó, sin animales ni personas, que se
  ven también junto a quien publica en la ficha y junto a quien manda una solicitud. Motivo: es el
  historial de docs/03 §1 y el conteo que docs/10 le da a quien publica, sin romper que quién adoptó a
  un animal lo saben solo las dos personas (#67); se cuentan solo las que tienen seguimiento porque
  es lo que dice algo (docs/01, "historial de adopciones con seguimiento positivo"). Va en docs/03 §1
  y §5.
- **Decisión (2026-09-27, product-owner):** cualquier respuesta cuenta como seguimiento: el sitio no
  la juzga, y una adopción que terminó después de responder sigue contando. Motivo: juzgar respuestas
  es trabajo manual que nadie tiene en la beta, y devolver el animal es cumplir el compromiso, no
  fallarlo; lo que esté mal se reporta (#13). Va en docs/03 §5.
- **Decisión (2026-09-27, product-owner):** responder el seguimiento saca "Yo no adopté" (#67) sin
  aceptar el compromiso, y las fotos y el texto los ven solo las dos personas. Motivo: quien mandó
  fotos del animal no puede decir después que no lo adoptó; aceptar el compromiso es otro acto que
  #67 le deja a la persona; y las fotos muestran su casa, que no le hace falta ver a nadie más
  (docs/01 §Legal / datos). Va en docs/03 §5.
- **Decisión (2026-10-08, product-owner):** un pedido de seguimiento sin respuesta se cierra si la
  adopción termina, se deshace o hay un bloqueo, y no se pide si cualquiera de las dos cuentas está
  suspendida ese día; después de un bloqueo, cada una deja de ver lo que mandó la otra, y el sello y
  los números quedan. Motivo: fotos de un animal que ya no está con esa persona no dicen nada al
  rescatista; #67 ya corta el contacto en esos casos, y un rescatista suspendido no puede ver la
  respuesta; ante un bloqueo se muestra menos (Ley 18.331), sin borrar un historial que la persona
  ya ganó. Va en docs/03 §5.

