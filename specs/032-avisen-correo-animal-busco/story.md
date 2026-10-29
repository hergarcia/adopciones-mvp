## Historia
**Como** persona que busca adoptar y hoy no encuentra en el listado el animal que quiere **quiero**
que el sitio me mande un correo cuando se publique uno que coincida con lo que busqué **para** no
tener que volver a revisar los grupos todos los días.

## Contexto
En la beta van a publicar entre 3 y 5 rescatistas, así que el listado va a ser corto. Quien busca
«perro chico en Montevideo» y no encuentra ninguno hoy vuelve al grupo de Facebook, que le muestra
animales nuevos sin que tenga que buscarlos. Ahí el sitio pierde a quien adopta antes de que la
verificación llegue a importar. El aviso le da un motivo para esperar acá. También le sirve a quien
rescata: cuando publica, el animal le llega a gente que ya lo estaba esperando, sin que tenga que
volver a postearlo. Así se puede ver si el sitio junta su propia gente que adopta (docs/01 §Huevo y
gallina) y si quien eligió esperar acá después pasa por la verificación para solicitar (docs/03
§Hipótesis, del lado de quien adopta).

Le gana a los detalles de texto de las recorridas de #206, #257 y #264 (baratos, pero no enseñan
nada), a la señal de camada en la tarjeta (#223, cosmética), al recordatorio de solicitudes (docs/03
§4 espera el dato de la beta), a mostrarle a quien rescata qué le trajo cada animal (mira el valor de
costado) y al traspaso del chip (depende de un trámite que nadie averiguó). Es lo único que queda
que puede traer solicitudes nuevas sin depender de los grupos.

## Alcance
- Incluye: en el listado, «Avisame cuando haya uno así», que guarda los filtros elegidos en ese
  momento como un aviso (sin filtros también vale: «todos los animales en adopción»). Pide cuenta, no
  el teléfono verificado. Si la persona no tiene sesión, entra y vuelve al mismo listado con el aviso
  ya creado. Cada persona tiene hasta 3 avisos. Una vez por día, a las 8 de la mañana de Uruguay, le
  llega un solo correo con los animales y las camadas nuevos que coinciden con sus avisos, siempre
  que haya alguno. Cada correo trae «Dejar de recibir», que corta todos sus avisos con un toque y sin
  entrar. En Mi perfil está «Mis avisos», para ver cada uno escrito en palabras, abrir el listado con
  esos filtros y borrarlo.
- No incluye (explícito): avisos por WhatsApp, por mensaje de texto o en el teléfono · elegir la
  hora o cada cuánto llegan · filtros que el listado no tiene (convivencia, urgencia, nivel de quien
  publica) · avisos de animales que vuelven de una pausa, se renuevan o se editan · avisos con solo un
  correo y sin cuenta · cambiar los filtros del listado o su orden · mostrarle a quien publica cuánta
  gente tiene un aviso que coincide · avisos desde la ficha, la portada o «Mi solicitud».

## Reglas de negocio
- Un animal o una camada es nuevo para un aviso la primera vez que aparece en el listado después de
  creado el aviso. Una camada cuenta como uno. Si vuelve de una pausa, se renueva o se edita, no
  cuenta como nuevo.
- El correo trae solo lo que la persona puede solicitar a la hora de mandarlo: lo que se pausó, se
  adoptó, venció o se borró antes de las 8 no va. Tampoco van sus propios animales ni los de alguien
  con quien hay un bloqueo, en cualquier dirección, y no se dice por qué faltan.
- Va un solo correo por persona y por día, con una parte por aviso: hasta 6 por parte, los publicados
  más recientemente primero, más un enlace al listado con los filtros de ese aviso. Un animal que
  coincide con dos avisos aparece solo en el primero.
- Si un día no hay nada nuevo, ese día no sale correo. Si un correo no salió, el siguiente trae todo
  lo nuevo desde el último que sí llegó.
- Dos avisos con los mismos filtros no se guardan: la persona ve que ya lo tiene. Con 3 avisos, el
  cuarto no se crea y la pantalla la lleva a «Mis avisos» para borrar uno.
- Los avisos no vencen. Se borran desde «Mis avisos», todos juntos con «Dejar de recibir», o al
  borrar la cuenta. Mientras una cuenta está suspendida no recibe correos, y lo publicado en esos
  días no se manda después.
- El correo va a la dirección de la cuenta y no lleva el teléfono ni el contacto de nadie.

## Criterios de aceptación
### Camino feliz
- **Dado** que Bruno entró con su cuenta y filtró el listado por «perro», «chico» y «Montevideo», y no
  hay ninguno **cuando** toca «Avisame cuando haya uno así» **entonces** ve que le van a avisar por
  correo, y en «Mis avisos» aparece «Perros chicos en Montevideo».
- **Dado** que Bruno tiene ese aviso y ayer, después de las 8, Carla publicó a Tobi, perro chico en
  Montevideo, y Rita publicó una camada de perros chicos en Montevideo **cuando** son las 8 de la
  mañana **entonces** a Bruno le llega un solo correo con Tobi y la camada, cada uno con su foto, su
  nombre y su zona. Tocar uno abre su ficha, y el enlace de abajo abre el listado con «perro»,
  «chico» y «Montevideo» filtrados.
- **Dado** que Ana no tiene sesión y filtró el listado por «gato» y «Canelones» **cuando** toca «Avisame
  cuando haya uno así» y entra con su cuenta **entonces** vuelve al mismo listado con esos filtros,
  ve que el aviso quedó creado y no tiene que tocarlo de nuevo.
- **Dado** que a Bruno le llegó un correo de avisos **cuando** toca «Dejar de recibir» **entonces** ve una
  pantalla que le confirma que no le van a llegar más avisos, sin tener que entrar, y «Mis avisos»
  queda vacío.

### Casos borde
- **Dado** que Tobi se publicó ayer y Carla lo pausó hoy a las 7 **cuando** sale el correo de las 8
  **entonces** Tobi no está; y si Carla lo reanuda la semana siguiente, tampoco llega en un correo
  posterior.
- **Dado** que Bruno tiene «Perros en Montevideo» y «Perros chicos», y se publica un perro chico en
  Montevideo **cuando** sale el correo **entonces** el perro aparece una sola vez, en la parte del primer
  aviso.
- **Dado** que esa noche se publicaron 9 perros que coinciden con un aviso de Bruno **cuando** sale el
  correo **entonces** muestra los 6 publicados más recientemente y un enlace al listado filtrado donde
  están los 9.
- **Dado** que Rita bloqueó a Bruno, o Bruno la bloqueó a ella, que Bruno publicó un perro chico en
  Montevideo y que Rita publicó otro **cuando** sale el correo **entonces** ninguno de los dos está, y el
  correo no dice que faltan.
- **Dado** que en el día no se publicó nada que coincida con los avisos de Bruno **cuando** son las 8
  **entonces** no le llega ningún correo.
- **Dado** que Bruno ya tiene un aviso con «gato» y «Canelones» **cuando** vuelve a tocar «Avisame
  cuando haya uno así» con esos mismos filtros **entonces** ve que ya tiene ese aviso y no se crea otro.

### Errores y rechazos
- **Dado** que Bruno tiene 3 avisos **cuando** intenta crear un cuarto **entonces** ve que llegó al
  máximo de 3, no se crea y tiene a mano el camino a «Mis avisos» para borrar uno.
- **Dado** que se cortó la conexión o el sitio no respondió **cuando** Bruno toca «Avisame cuando haya
  uno así» **entonces** ve que no se pudo crear y puede volver a intentarlo; no queda un aviso a medias
  ni uno repetido.
- **Dado** que alguien abre un enlace de «Dejar de recibir» alterado, o uno de una cuenta que ya se
  borró **cuando** se carga la pantalla **entonces** ve que el enlace no sirve y cómo manejar los avisos
  desde Mi perfil, sin que la pantalla diga de quién era el enlace.
- **Dado** que la cuenta de Bruno está suspendida **cuando** son las 8 **entonces** no le llega ningún
  correo, y lo publicado en esos días no le llega cuando se levanta la suspensión.

## Pantallas
- **Listado:** «Avisame cuando haya uno así» cerca del total de resultados. Cuando los filtros no dan
  resultados, el ofrecimiento va en el lugar del vacío, al lado de «Sacar los filtros». Después de
  crearlo, una línea que confirma el aviso con un enlace a «Mis avisos». Cargando: el botón ocupado.
  Error: el aviso de que no se pudo, al lado del botón.
- **Mi perfil → «Mis avisos»:** cada aviso escrito en palabras («Perros chicos o medianos en
  Montevideo»), con el enlace al listado filtrado y «Borrar». Vacío: no tenés avisos, con un enlace
  al listado. Cargando: renglones en esqueleto. Error: el aviso y «Reintentar».
- **Correo de avisos:** una parte por aviso con su nombre en palabras, cada animal con foto, nombre,
  especie, edad y zona, el enlace al listado filtrado y «Dejar de recibir» al pie. Una camada va con su
  foto y la cantidad de crías.
- **Dejar de recibir:** la confirmación y un enlace al listado. Si el enlace no sirve, una pantalla
  que lo dice y lleva a Mi perfil.

## Datos personales
De cada aviso se guardan los filtros, el día en que se creó y el día del último correo, unidos a la
cuenta. Solo los ve la persona. Quien administra no los ve, y el resumen diario de Administrar no los
cuenta. Se borran al borrar el aviso o la cuenta. No se pide ningún dato nuevo: el correo es el de la
cuenta. La medición no lleva a la persona.

## Medición
Se mide cuándo se crea un aviso, con cuántos filtros y si se creó desde un listado sin resultados;
cuándo sale un correo, con cuántos animales; la ficha abierta desde el correo, con un origen propio, y
lo que sigue en esa visita como en cualquier otra («Quiero adoptar», los frenos de la verificación y
la solicitud mandada); y cuándo se borra un aviso, desde el correo o desde el perfil. Nada de eso lleva
a la persona ni los filtros que eligió. Se lee al lado de las lecturas 2 y 5 de docs/03 §Métricas de
éxito: qué parte de las solicitudes trae el sitio sin pasar por un grupo, y si quien eligió esperar
acá después acepta verificarse.

## Dependencias
- #9 cuentas · #13 bloqueos y suspensión · #57 listado y filtros · #59 ciclo de vida de la
  publicación · #71 medición · #169 el sitio andando, con sus tareas diarias y sus correos · #205 y
  #206 camadas · docs/03 §3, §7 y §Métricas de éxito.

## Decisiones del enjambre
- **Decisión (2026-10-29, product-owner):** se suma el aviso de animales nuevos a quien busca, una
  feature nueva que propone Producto cuando se terminó el mapa. Motivo: con 3 a 5 rescatistas el
  listado va a ser corto, y quien no encuentra nada hoy vuelve al grupo antes de que la verificación
  llegue a importar; de lo que queda, es lo único que puede traer solicitudes sin pasar por un grupo
  (docs/01 §Huevo y gallina, docs/03 §Hipótesis). (docs/03 §3)
- **Decisión (2026-10-29, product-owner):** el aviso guarda los filtros del listado tal como están,
  también sin filtros, hasta 3 por persona. Pide cuenta pero no el teléfono verificado. Motivo: mirar
  es libre y la verificación aparece al solicitar (docs/01 §Verificación = fricción); con solo un
  correo y sin cuenta se podrían anotar direcciones ajenas; con 3 alcanza para «perros chicos en
  Montevideo» y «gatos en Canelones» sin que el correo se vuelva el listado entero. (docs/03 §3)
- **Decisión (2026-10-29, product-owner):** sale un solo correo por día como mucho, a las 8 de la
  mañana de Uruguay, solo si hay algo nuevo, con una parte por aviso de hasta 6 animales y sin
  recordatorios. Motivo: es la misma corrida diaria que el resumen de quien administra (docs/03 §6) y
  la que permite el plan gratuito (docs/07 §Riesgos conocidos de los tiers gratuitos); un correo por
  persona y por día entra en los 3.000 por mes del plan gratuito del correo para una beta chica (docs/07);
  insistir con correos es lo que el sitio promete ahorrar. (docs/03 §3)
- **Decisión (2026-10-29, product-owner):** cuenta como nuevo solo lo que aparece en el listado por
  primera vez después de creado el aviso. Lo que vuelve de una pausa, se renueva o se edita no cuenta.
  Motivo: eso ya estuvo en el listado y quizás en un correo, y avisar dos veces lo mismo es lo que
  hace que la gente deje de abrir los correos. (docs/03 §3)
- **Decisión (2026-10-29, product-owner):** «Dejar de recibir» corta todos los avisos de la persona
  con un toque y sin entrar; en «Mis avisos» se borran de a uno. Los avisos no vencen. Motivo:
  obligarla a entrar para dejar de recibir lleva a que marque el correo como no deseado; con un corte
  de un toque en cada correo, un vencimiento solo agregaría otro correo para avisar que vence.
  (docs/03 §3)
- **Decisión (2026-10-29, product-owner):** los avisos los ve solo la persona: quien administra no
  los ve. Se borran con la cuenta y una cuenta suspendida no recibe correos. Motivo: qué busca alguien
  no le hace falta a nadie para cuidar el sitio, y entre dos opciones razonables va la que muestra
  menos y guarda menos (Ley 18.331); una suspensión frena lo que la persona hace en el sitio (#13).
  (docs/03 §3)
- **Decisión (2026-10-29, product-owner):** la ficha abierta desde el correo se cuenta con un origen
  propio, y se mide la creación y el borrado de avisos sin la persona ni los filtros. Motivo: es la
  forma de saber si quien eligió esperar acá vuelve y solicita, y qué parte de las solicitudes trae
  el sitio solo; los filtros, junto al día, podrían decir quién es en una beta chica (Ley 18.331), como
  las marcas de #238 y #259. (docs/03 §7)


---
_Generated by [Claude Code](https://claude.ai/code)_
