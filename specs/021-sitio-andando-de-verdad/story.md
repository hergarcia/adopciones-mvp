# Historia #169 — El sitio andando de verdad en una dirección provisoria: código por mensaje, tareas solas, medición y errores, fuera de buscadores

Milestone: M5 - Beta cerrada. Cuerpo verbatim del issue (2026-10-10).

## Historia
**Como** equipo **quiero** el sitio andando de verdad en una dirección provisoria, fuera de los
buscadores y sin invitar a nadie todavía, con el código llegando por mensaje de texto, las tareas
que el sitio hace solo corriendo, la medición llegando a su herramienta y cada error avisado,
**para** que el día que se abra la beta (la historia hermana, que espera al nombre) solo falte
cambiar la dirección e invitar, y las cuatro métricas de éxito se lean desde el primer rescatista.

## Contexto
Hasta acá todo corre en local (docs/09 §Sin Vercel hasta el MVP): el código se escribe a un archivo
en vez de salir por mensaje (KL-010), las limpiezas de datos de verificación esperan a que alguien
use el sitio (KL-016, KL-53-1), la medición se dispara pero no llega a ninguna herramienta (docs/07),
nadie se entera de un error que ve una persona, y las reglas de privacidad solo se comprobaron
contra la base local (KL-017).

Hernán partió en dos la historia que abre la beta (#77, 2026-10-10): el nombre sigue sin decidirse
y deja de frenar todo. Esta es la primera mitad, la que no necesita nombre ni dominio: el sitio
andando de verdad en la dirección provisoria del alojamiento, fuera de los buscadores, sin que
ningún enlace circule fuera del equipo. La otra mitad, abrir la beta, es #76: nombre y dominio definitivos,
correo desde el dominio, indexación de lo público, lista de lanzamiento e invitar. El gasto de los
mensajes de texto ya está aprobado (#77, respuesta 4); el resto entra en planes gratuitos (docs/07).

Para la hipótesis (docs/03 §Hipótesis) es la que hace respondible la beta antes de abrirla: sin la
medición en su herramienta ninguna de las cuatro métricas de docs/03 §Métricas de éxito se lee, y
sin el código por mensaje nadie llega al nivel 1. Probarlo ahora, sin rescatistas mirando, evita que
el primero que entra encuentre un sitio roto y vuelva a su grupo de Facebook con el enlace.

## Alcance
- Incluye: el sitio andando en una sola dirección provisoria del alojamiento, con el nombre
  provisorio · toda dirección del sitio (la provisoria y las de prueba) fuera de los buscadores ·
  el ingreso con Google andando en esa dirección · el código llegando por mensaje de texto a
  celulares uruguayos · las tareas que el sitio hace solo corriendo en el sitio de verdad, aunque
  nadie lo use · la medición llegando a su herramienta, con las cuatro métricas de éxito legibles y
  el origen de cada visita a una ficha · el aviso al equipo de cada error que ve una persona, sin
  sus datos · las reglas de privacidad comprobadas contra el sitio de verdad · el presupuesto de
  velocidad comprobado en un teléfono contra el sitio de verdad.
- No incluye (explícito): elegir el nombre, el dominio, el logo o el eslogan (docs/04, lo decide
  Hernán) · el correo de ingreso llegando a cualquier casilla, que necesita el dominio propio
  (KL-006): hasta #76 llega solo a la casilla del equipo · ofrecer nada a buscadores ni asistentes
  · la lista de lanzamiento con personas reales, invitar a un rescatista o compartir un enlace
  fuera del equipo (#76) · una puerta de acceso, contraseña o lista de espera en la dirección
  provisoria · pantallas nuevas o cambios de texto en las que existen · un tablero propio de las
  métricas (lo da la herramienta de medición, #71) · grabar lo que una persona hace en la pantalla
  · el código por WhatsApp (se empieza por mensaje de texto, docs/07) · reintentar el correo de
  «perdiste tu teléfono» (KL-029), que se mira aparte · planes pagos de ningún servicio.

## Reglas de negocio
- El sitio tiene una sola dirección provisoria, la del alojamiento, y todo enlace que arma (fichas,
  correos, la tarjeta al compartir, los avisos) usa esa. Se muestra con el nombre provisorio.
- Toda dirección del sitio, la provisoria y cada dirección de prueba, les indica a buscadores y
  asistentes que no la guarden, y ninguna página se les ofrece. La tarjeta del enlace compartido
  por WhatsApp se sigue armando, como en local (docs/08 §Encontrable, decisión 2026-09-28).
- La dirección provisoria no tiene puerta: quien llega mira, ingresa, se verifica y solicita como
  en la beta. Lo que la mantiene cerrada es que el equipo no comparte ningún enlace fuera de él y
  que ningún buscador la guarda.
- El sitio de verdad arranca sin las personas ni los animales sembrados de prueba. El equipo prueba
  con cuentas propias, y las comprobaciones de privacidad que crean personas de prueba las borran al
  terminar.
- El código sale por mensaje de texto solo a celulares uruguayos, con los mismos topes por número y
  por día del sitio de #10 (KL-010).
- Las tareas que el sitio hace solo corren en el sitio de verdad aunque nadie lo use, cada una con
  la frecuencia que ya tiene: vencimientos y recordatorios de las publicaciones (#59), el
  vencimiento de la verificación de identidad y su correo (#11), el seguimiento a 30 días (#69), el
  resumen de la mañana de quien administra (#73), y al menos una vez por día las limpiezas de los
  datos de verificación del teléfono y de las fotos de publicaciones sin terminar (KL-016, KL-53-1).
  Si una no corre, la siguiente hace lo que quedó pendiente y el equipo se entera.
- El sitio no se duerme: aunque nadie entre durante una semana, sigue respondiendo y sus tareas
  siguen corriendo.
- La medición llega a su herramienta sin datos de las personas, como ya se emite (#9, #71): ni
  nombre, ni correo, ni teléfono, ni lo que escriben, y sin unir dos visitas de la misma persona ni
  una visita con su cuenta (docs/03 §7). Con ella se leen las cuatro métricas de docs/03 §Métricas
  de éxito, la cuarta en las opiniones de #71.
- De cada visita a una ficha se sabe de dónde llegó: del listado o la portada del sitio, de un
  enlace compartido con el botón Compartir del sitio, de una red social, de un buscador, de un
  asistente, o sin origen conocido. El enlace del botón Compartir lleva una marca que dice solo que
  fue compartido desde el sitio, nunca quién ni desde qué cuenta, y no cambia a qué ficha lleva ni
  su tarjeta.
- Cuando una persona ve un error, el equipo se entera sin que ella lo cuente: la pantalla, el paso
  y la hora, nunca sus datos ni lo que había escrito. Ella ve la pantalla de error del sitio, como
  hoy.
- Las reglas de privacidad de las historias anteriores se comprueban contra el sitio de verdad con
  las mismas pruebas que en local, y el resultado queda anotado en la historia: el contacto se ve
  solo con la solicitud aceptada, el teléfono nunca es público, las imágenes de identidad las ve
  solo quien revisa y se borran al resolver. Además: el teléfono no sirve para ingresar (KL-017) y
  el sitio de verdad no guarda respaldos donde una imagen de identidad borrada sobreviva (KL-11-1).
- El presupuesto de velocidad de docs/07 se comprueba en el sitio de verdad, en un teléfono y por
  red móvil, sobre la portada, el listado y una ficha.

## Criterios de aceptación
### Camino feliz
- **Dado** que alguien del equipo abre la dirección provisoria en su teléfono **cuando** entra con
  Google **entonces** queda adentro con su perfil, igual que en local.
- **Dado** que esa persona ingresó **cuando** pide el código para su celular uruguayo **entonces**
  le llega por mensaje de texto en menos de 5 minutos y, al escribirlo, queda en nivel 1.
- **Dado** que publicó un animal **cuando** toca Compartir y pega el enlace en un chat de WhatsApp
  del equipo **entonces** el enlace empieza con la dirección provisoria y la tarjeta muestra la
  foto, el nombre del animal y la zona.
- **Dado** que otra persona del equipo abrió ese enlace y tocó "Quiero adoptar" **cuando** el
  equipo abre la herramienta de medición ese mismo día **entonces** ve esos dos pasos del funnel,
  la visita a la ficha contada como llegada por un enlace compartido desde el sitio, y nada de
  nombre, correo ni teléfono.
- **Dado** que una publicación de prueba llega a su fecha de vencimiento un día en que nadie usa
  el sitio **cuando** el equipo la mira al día siguiente **entonces** está vencida y el aviso de
  vencimiento llegó a la casilla del equipo.
- **Dado** que una persona del equipo provoca un error **cuando** el equipo revisa los errores esa
  misma hora **entonces** está ese error con la pantalla, el paso y la hora.
- **Dado** que se corrieron las comprobaciones de privacidad contra el sitio de verdad **cuando**
  el equipo lee la historia **entonces** cada regla tiene anotado su resultado, y todas pasan.
- **Dado** que la portada, el listado y una ficha se abren en un teléfono por red móvil **cuando**
  se mide su velocidad **entonces** cada una muestra su contenido principal en menos de 2,5 s, baja
  menos de 150 KB de código para empezar y saca al menos 90 en la medición de velocidad para teléfono
  (docs/07).

### Casos borde (al menos 3)
- **Dado** que un buscador o un asistente lee cualquier página de la dirección provisoria o de una
  dirección de prueba **cuando** la lee **entonces** se le indica que no la guarde, y el sitio no
  le ofrece ninguna página.
- **Dado** que nadie entró al sitio durante 8 días **cuando** alguien del equipo lo abre
  **entonces** responde como siempre, y las limpiezas de esos días corrieron.
- **Dado** que un día las tareas no corrieron **cuando** corren al día siguiente **entonces** vence
  lo que debía vencer el día anterior, sale el seguimiento que quedó pendiente y el equipo lo ve.
- **Dado** que una persona estaba escribiendo su perfil o una solicitud cuando vio un error
  **cuando** el equipo lee el aviso **entonces** no aparece nada de lo que ella escribió ni sus
  datos.
- **Dado** que alguien abre una ficha escribiendo la dirección a mano, o desde una app que no dice
  de dónde viene **cuando** el equipo mira la medición **entonces** esa visita figura sin origen
  conocido, no como compartida desde el sitio.
- **Dado** que el sitio ya mandó hoy todos los mensajes de su tope diario (#10) **cuando** alguien
  pide un código **entonces** ve lo que #10 muestra para ese caso, no un error.
- **Dado** que alguien pide el código para un celular de otro país **cuando** lo pide **entonces**
  ve lo que #10 ya muestra para un número que no es uruguayo, y no sale ningún mensaje.

### Errores y rechazos
- **Dado** que el servicio de mensajes no responde **cuando** pido el código **entonces** veo lo
  que #10 muestra cuando el mensaje no sale, y el equipo se entera del error.
- **Dado** que pido el enlace de ingreso por correo con una casilla que no es la del equipo
  **cuando** el servicio de correo lo rechaza (KL-006) **entonces** veo que no se pudo mandar y
  puedo entrar con Google.
- **Dado** que la herramienta de medición no responde **cuando** uso el sitio **entonces** todo
  sigue funcionando igual y nada me frena.
- **Dado** que el aviso de errores no responde **cuando** veo un error **entonces** igual veo la
  pantalla de error del sitio con cómo volver.
- **Dado** que una comprobación de privacidad falla contra el sitio de verdad **cuando** el equipo
  la corre **entonces** queda anotada qué regla falló y la historia no se da por terminada.

## Pantallas
- No hay pantallas nuevas ni cambia ninguna. El enlace del botón Compartir lleva la marca de origen;
  la pantalla no cambia. Vacío: no aplica.
- Pantalla de error del sitio (ya existe): igual que hoy. Vacío: no aplica.

## Datos personales
- No se guarda ningún dato personal nuevo.
- Los avisos de error y la medición salen del sitio hacia servicios de afuera sin nombre, correo,
  teléfono, zona, imágenes ni lo que la persona escribió; si un error ocurre con un dato así en la
  pantalla, se descarta antes de salir.
- El teléfono viaja al servicio de mensajes solo para mandar el código, como el correo ya viaja al
  servicio de correo (#9, #10).
- La marca del enlace compartido no dice quién lo compartió.
- Nada del sitio se ofrece a buscadores ni asistentes: lo que entra en un índice generativo no se
  retira (docs/08 §Encontrable).

## Medición
- Sin eventos nuevos del funnel: lo que cada historia ya emite empieza a llegar a su herramienta, y
  se leen las cuatro métricas de docs/03: rescatistas con más de un animal publicado por su cuenta,
  % que completa el nivel 2 cuando se lo exigen, % de solicitudes que llegan a aceptación y en
  cuánto responde el rescatista, y las opiniones (#71).
- La visita a una ficha suma de dónde llegó (el sitio, un enlace compartido desde el sitio, una red
  social, un buscador, un asistente, sin origen), sin nada de la persona, para saber si el enlace
  pegado en los grupos es el que trae a quien adopta (docs/03 §3).

## Dependencias
- #8, #9, #10, #11, #53, #57, #59, #61, #63, #65, #67, #69, #71, #73 (todas cerradas).
- docs/03 §3, §7 y §Métricas de éxito · docs/04 §Cómo construir sin nombre · docs/07 · docs/08
  §Encontrable · docs/09 §Sin Vercel hasta el MVP · KL-006, KL-010, KL-014, KL-016, KL-017, KL-11-1,
  KL-11-2, KL-53-1.

## Decisiones del enjambre
- **Decisión (2026-10-10, Hernán en #77):** la historia que abre la beta se parte en dos: primero
  el sitio andando de verdad en una dirección provisoria, sin indexar y sin invitar a nadie (esta);
  después abrir la beta con el nombre, el dominio, el correo desde el dominio, la indexación de lo
  público, la lista de lanzamiento y la invitación (#76). Motivo: el nombre sigue sin decidirse y
  no tiene por qué frenar lo que no lo necesita. (docs/04 §Cuándo y cómo elegirlo)
- **Decisión (2026-09-28, Hernán en #77):** el gasto de la beta está aprobado: la cuenta de
  mensajes de texto para el código y el dominio; lo demás en planes gratuitos. (docs/07, la línea
  del total estimado)
- **Decisión (2026-09-27, product-owner):** los avisos de error no llevan datos de la persona ni lo
  que escribió, igual que la medición (#9, #71). Motivo: es el mínimo que alcanza para arreglar el
  error (docs/01 §Legal / datos), y así no sale ningún dato personal nuevo del sitio. (docs/07)
- **Decisión (2026-09-27, product-owner):** se mide de dónde llega cada visita a una ficha.
  Motivo: el mecanismo de crecimiento del MVP es el enlace pegado en los grupos (docs/03 §3); sin
  saber de dónde llegan, la beta no dice si funciona. (docs/03 §7)
- **Decisión (2026-10-10, product-owner):** el enlace del botón Compartir lleva una marca que dice
  solo que fue compartido desde el sitio, y la visita que llega con ella cuenta como "enlace
  compartido". Motivo: WhatsApp no dice de dónde viene una visita, así que sin la marca el enlace
  pegado en un grupo de WhatsApp se confunde con una dirección escrita a mano, y es justo el que la
  beta tiene que medir (docs/03 §3); la marca no dice quién compartió, así que no nace ningún dato
  personal (Ley 18.331). (docs/03 §7)
- **Decisión (2026-10-10, product-owner):** la dirección provisoria no tiene puerta de acceso; la
  mantienen cerrada que nadie del equipo comparte un enlace afuera y que ningún buscador la guarda.
  Motivo: una puerta se sacaría en #76, y lo que esta historia comprueba (privacidad, medición,
  velocidad) tiene que comprobarse sobre el sitio como lo va a ver quien llegue desde un grupo, no
  detrás de una contraseña. (docs/04 §Cómo construir sin nombre)
- **Decisión (2026-10-10, product-owner):** el sitio de verdad arranca sin las personas ni los
  animales sembrados de prueba; el equipo prueba con cuentas propias y lo que crea se borra antes
  de invitar (#76). Motivo: un animal de prueba en el listado de la beta es lo primero que vería un
  rescatista, y una persona sintética contaría en las métricas de éxito. (docs/07)

