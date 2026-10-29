## Historia
**Como** rescatista que tiene varios animales en adopción **quiero** que mi perfil público muestre
los que tengo publicados y poder mandar ese enlace desde «Mis animales» **para** pegar un solo
enlace en el grupo, en el estado de WhatsApp o en la biografía de Instagram, en vez de uno por
animal. **Como** persona que busca adoptar **quiero** ver en el perfil de quien rescata los demás
animales que tiene **para** solicitar otro si el que vine a ver no me sirve, sabiendo que detrás
está la misma persona verificada.

## Contexto
docs/03 §3 dice que no se reemplaza a Facebook sino que se lo usa de canal: el rescatista sigue
posteando en su grupo, pero pega nuestro enlace. Hoy ese enlace es siempre el de un animal. Quien
tiene ocho animales pega ocho enlaces, o pega el del grupo y la solicitud nunca pasa por el sitio.
El perfil público ya muestra la persona, su chapita, sus avales y sus adopciones con seguimiento
(#12, #69), y la ficha ya lleva a ese perfil (#57). Lo único que no muestra es lo que esa persona
tiene en adopción hoy. Con esto, el perfil del rescatista pasa a ser el lugar fijo de sus animales,
con la verificación arriba de todo. Eso es lo que un álbum del grupo no puede darle. La primera
métrica de docs/03 pide rescatistas que publiquen más de un animal por su cuenta: un enlace que
muestra todos juntos le da un motivo para tener ahí a todos.

Le gana a las camadas en la guía y la portada (#224), a la señal de camada en el listado (#223), al traspaso del
chip (docs/05, trámite sin averiguar) y al recordatorio de solicitudes (docs/03 §4 espera datos de la beta): pone a prueba el mecanismo de crecimiento de docs/03 §3 con lo que ya existe.

## Alcance
- Incluye: en el perfil público de una persona, sus animales y camadas en adopción, con la misma
  tarjeta del listado · «Copiar el enlace» y «Mandar el enlace» de su perfil en «Mis animales»,
  con una línea que dice que ahí se ven todos sus animales · medir las visitas al perfil, abrir una
  ficha desde el perfil y las solicitudes que empiezan ahí · cómo se lee en docs/03 §Métricas de éxito.
- No incluye (explícito): mostrar en el perfil los animales adoptados, pausados, vencidos o en
  revisión · filtros u orden propios en el perfil · cambiar la vista previa del enlace del perfil
  al pegarlo · cambiar el listado, la ficha o la portada · que el perfil diga cuántos animales
  publicó alguien en total · prender la indexación del perfil (sigue fuera de buscadores) · una
  dirección corta o elegida para el perfil.

## Reglas de negocio
- El perfil muestra los animales y las camadas de esa persona que hoy se ven en el listado, con
  las mismas reglas: disponibles y en proceso (con su sello), del más reciente al más viejo, de a
  24 con «Ver más». Pausados, vencidos, adoptados, en revisión o dados de baja no aparecen.
- Una camada aparece una sola vez, con su tarjeta de camada, como en el listado; las crías se ven
  desde su ficha.
- Si quien publicó no tiene hoy el teléfono verificado, sus animales no se ven en su perfil, igual
  que en el listado, y vuelven solos al confirmarlo.
- Quien bloqueó a alguien no ve los animales de esa persona en su perfil (ya ve la pantalla de
  bloqueo); la persona bloqueada sigue viendo los de quien la bloqueó, como en el listado (#13).
- Los animales de una cuenta suspendida no aparecen en su perfil para nadie, como en el listado, y
  vuelven solos al reactivarla.
- El perfil de alguien sin animales a la vista se ve como hoy: no muestra ninguna sección vacía
  ni dice que no tiene animales. La mayoría de los perfiles son de quien adopta.
- Quien mira su propio perfil público ve lo mismo que ve cualquiera; lo que solo ve ella (animales
  pausados, en revisión o sin teléfono confirmado) sigue en «Mis animales».
- En «Mis animales», el enlace del perfil aparece solo cuando la persona tiene al menos un animal
  o una camada publicados que hoy se ven; sin ninguno, no aparece.
- El enlace del perfil es el mismo de siempre y no cambia aunque cambie el nombre: el posteo viejo
  sigue funcionando.

## Criterios de aceptación
### Camino feliz
- **Dado** que Carla es rescatista y tiene a Tobi y a Luna disponibles y a Mora en proceso **cuando**
  alguien sin sesión abre su perfil **entonces** ve, debajo de su chapita y sus avales, las tres
  tarjetas como en el listado, con Mora marcada «En proceso», de la más reciente a la más vieja.
- **Dado** que Bruno llegó a la ficha de Tobi desde un grupo de Facebook **cuando** toca el nombre
  de Carla y después la tarjeta de Luna **entonces** llega a la ficha de Luna y puede solicitarla
  como desde el listado.
- **Dado** que Carla tiene animales publicados **cuando** entra a «Mis animales» **entonces** ve
  «Copiar el enlace» y «Mandar el enlace» de su perfil, con una línea que dice que en ese enlace se
  ven todos sus animales en adopción; al copiarlo ve «Enlace copiado».
- **Dado** que Carla publicó una camada de cinco crías **cuando** alguien abre su perfil **entonces**
  ve una sola tarjeta de la camada, no cinco.

### Casos borde (al menos 3)
- **Dado** que Carla tiene 30 animales a la vista **cuando** alguien abre su perfil **entonces** ve
  los 24 más recientes y «Ver más» trae los 6 que faltan.
- **Dado** que Carla pausa a Luna **cuando** alguien vuelve a abrir su perfil **entonces** Luna ya
  no aparece; cuando la reanuda, vuelve a su lugar por fecha.
- **Dado** que Tobi fue adoptado **cuando** alguien abre el perfil de Carla **entonces** Tobi no
  aparece entre sus animales y el historial del perfil sigue mostrando solo los dos números de
  adopciones con seguimiento.
- **Dado** que Carla cambió de chip y todavía no confirmó el número nuevo **cuando** alguien abre su
  perfil **entonces** no ve ningún animal ni un aviso de por qué; cuando Carla confirma el número,
  sus animales vuelven a aparecer.
- **Dado** que Diego bloqueó a Carla **cuando** abre el perfil de Carla **entonces** ve la pantalla
  de bloqueo de siempre, sin sus animales; **y dado** que Carla bloqueó a Diego **cuando** Diego abre
  el perfil de Carla **entonces** ve sus animales como cualquiera.
- **Dado** que Ana nunca publicó un animal **cuando** alguien abre su perfil **entonces** se ve
  exactamente como hoy, sin ninguna sección de animales; **y cuando** Ana entra a «Mis animales»
  no ve el enlace del perfil.

### Errores y rechazos
- **Dado** que los animales de Carla no se pueden traer en ese momento **cuando** alguien abre su
  perfil **entonces** ve el perfil entero y, en el lugar de los animales, un aviso de que no se
  pudieron mostrar y «Probar de nuevo», nunca una lista vacía que parezca que no tiene ninguno.
- **Dado** que el navegador no deja copiar **cuando** Carla toca «Copiar el enlace» en «Mis
  animales» **entonces** ve el enlace escrito para copiarlo a mano, como en «Mi perfil».
- **Dado** que la cuenta de Carla fue suspendida **cuando** alguien abre el enlace de su perfil que
  ella había pegado en el grupo **entonces** no ve ninguno de sus animales y el perfil se ve como
  hoy se ve el de una cuenta suspendida, sin que la sección de animales diga nada de la suspensión.

## Pantallas
- **Perfil público:** debajo de la cabecera, la chapita y los avales, una sección «En adopción»
  con las tarjetas del listado y «Ver más» al pie cuando hay más de 24. Cargando: el esqueleto de
  las tarjetas. Vacío: la sección no aparece. Error: el aviso y «Probar de nuevo» en su lugar, con
  el resto del perfil a la vista.
- **Mis animales:** arriba de la lista, una línea que dice que en el enlace de tu perfil se ven
  todos tus animales en adopción, con «Copiar el enlace» y «Mandar el enlace». Vacío (ningún animal
  a la vista): la línea no aparece y la pantalla queda como hoy.

## Datos personales
- En el sitio no se guarda nada nuevo.
- El perfil muestra animales que ya son públicos en el listado y en sus fichas; de la persona no
  se muestra nada que el perfil no muestre hoy. No aparece cuántos animales publicó en total ni los
  adoptados: a quién se dio un animal lo saben solo las dos personas (docs/03 §5).
- A la medición llega que una visita al perfil muestra animales (sí o no), de dónde llegó, que una
  ficha se abrió desde un perfil y que el enlace se copió o se mandó desde «Mis animales». Nunca
  quién, qué animal ni qué perfil, como el resto de la medición (docs/03 §7).

## Medición
Se suma a docs/03 §Métricas de éxito, «Cómo se leen», como una lectura nueva: **¿el rescatista usa
el sitio como su vidriera?**
- Cuántos rescatistas copian o mandan el enlace de su perfil desde «Mis animales».
- De las visitas a perfiles con animales, qué parte llega desde un enlace de afuera (el grupo, la
  biografía) y qué parte navegando desde una ficha.
- Qué parte de las fichas vistas se abren desde un perfil, y cuántas de ellas terminan en
  «Solicitar» y en una solicitud mandada, al lado de las que llegan desde el listado o desde un
  enlace.
- Con 3 a 5 rescatistas los números son chicos: se leen como señal al lado de las opiniones y las
  encuestas, no como prueba.

## Dependencias
- #12 perfil público · #13 bloquear y suspender · #57 listado y ficha · #59 estados de la
  publicación · #69 adopciones con seguimiento en el perfil · #169 medición en el sitio de verdad ·
  #205 y #206 camadas · #236 visitas al perfil según de dónde llegan · docs/03 §3 y §Métricas de éxito ·
  docs/01 §Huevo y gallina.

## Decisiones del enjambre
- **Decisión (2026-10-28, product-owner):** el perfil muestra solo los animales que hoy se ven en
  el listado, con sus mismas reglas y su misma tarjeta; los adoptados no aparecen. Motivo: dos
  reglas para lo mismo confunden a quien publica, y el historial del perfil ya son dos números sin
  animales ni personas (docs/03 §5, decisión 2026-09-27); una lista de adoptados mostraría más de
  lo que hace falta (Ley 18.331). (docs/03 §3)
- **Decisión (2026-10-28, product-owner):** un perfil sin animales a la vista no muestra ninguna
  sección vacía, y en «Mis animales» el enlace del perfil aparece solo con algún animal a la vista.
  Motivo: la mayoría de los perfiles son de quien adopta, y «no tiene animales» en su perfil diría
  algo que nadie preguntó; un enlace a una vidriera vacía es el posteo sin respuesta que hace volver
  al grupo. (docs/03 §3)
- **Decisión (2026-10-28, product-owner):** el enlace del perfil se ofrece en «Mis animales» y no
  se crea uno nuevo. Motivo: es donde el rescatista ya comparte cada animal (#57), y el enlace del
  perfil ya existe y no cambia, así que lo que ya pegó en el grupo sigue sirviendo. (docs/03 §3)


---
_Generated by [Claude Code](https://claude.ai/code)_
