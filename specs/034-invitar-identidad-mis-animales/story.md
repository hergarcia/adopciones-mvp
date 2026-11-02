## Historia
**Como** rescatista que publica con el teléfono verificado y sin la identidad **quiero** que «Mis
animales» me invite a verificar mi identidad y me diga qué cambia en mis publicaciones **para**
decidir si paso por la cédula y la selfie sabiendo qué gano y sin tener que ir a buscarlo a mi
perfil.

## Contexto
La hipótesis pregunta si quien rescata valora la verificación lo suficiente para pasar por fricción
extra (docs/03 §Hipótesis). Hasta hoy el sitio solo lee lo que quien rescata le pide a otros: el
nivel que exige al publicar y a quién acepta (lecturas 5 y 10). Si quien rescata paga esa fricción
con su propia identidad no se lee en ningún lado: la verificación de identidad se pide desde «Mi
perfil» y se cuenta igual para quien rescata que para quien adopta. Mientras tanto, desde #244, #273 y
#275 el nivel de quien publica sale en la vista previa del enlace, en cada tarjeta del listado y en el
cartel. Una rescatista con nivel 1 ve en todos esos lugares «Teléfono verificado» y nada en «Mis
animales» le cuenta que puede cambiarlo. Además, si los 3 a 5 rescatistas de la beta quedan todos en
nivel 1, la parte de quien adopta de la lectura 5 (fichas vistas, toques y solicitudes por el nivel de
quien publicó) no tiene nada que comparar. docs/01 lo pide desde el principio: «el que da en adopción
también se verifica».

Le gana al filtro por nivel en el listado (cambia el correo de avisos de cada noche y espera a ver qué
pasa con #273), a la señal de camada en la tarjeta y a los detalles de texto de #257 y #264 (no
enseñan nada), a cargar un animal desde uno anterior y al recordatorio de solicitudes (esperan datos
de la beta, docs/03 §4) y al traspaso del chip (trámite sin averiguar): es una invitación en una
pantalla que ya existe hacia un camino que ya existe, y contesta la mitad de la hipótesis que nadie lee.

## Alcance
- Incluye: en «Mis animales», una invitación a verificar la identidad para quien publica sin tenerla
  verificada, que dice en qué lugares va a cambiar «Teléfono verificado» por «Identidad verificada»
  (la ficha, cada tarjeta del listado, la vista previa del enlace y el cartel), que las fotos de la
  cédula se borran después de revisarlas y que la revisión tarda hasta 2 días. «Verificar mi
  identidad» lleva a la verificación de identidad que ya existe, con sus mismos pasos y reglas;
  «Ahora no» cierra la invitación. El correo de identidad aprobada de un pedido que empezó acá suma un
  enlace a «Mis animales». La medición cuenta la invitación y sigue el pedido que empieza desde ella.
- No incluye (explícito): invitar a verificar la identidad al publicar, en la confirmación de un
  animal publicado ni por correo · invitar a quien no publicó nada · cambiar los pasos, los textos o
  las reglas de la verificación de identidad, el tope de pedidos rechazados o la revisión de quien
  administra · exigir la identidad para publicar · cambiar lo que dice la ficha, la tarjeta, la vista
  previa o el cartel · decirle a quien rescata cuántas solicitudes más tendría con la identidad ·
  invitar a pedir un aval · un aviso cuando el pedido está en revisión, que sigue viéndose en «Mi
  perfil» como hoy.

## Reglas de negocio
- La invitación aparece en «Mis animales» solo si la persona tiene al menos un animal o una camada
  ahí, en cualquier estado, tiene el teléfono verificado, no tiene la identidad verificada y hoy puede
  pedirla: sin un pedido en revisión y sin estar en el tope de 3 pedidos rechazados en 30 días
  (docs/03 §1). No aparece en ninguna otra pantalla.
- «Ahora no» la cierra para siempre para esa persona. La verificación sigue disponible desde «Mi
  perfil», como hoy.
- Si la persona toca «Verificar mi identidad» y se va sin mandar el pedido, la invitación sigue
  apareciendo la próxima vez. Si el pedido vence sin resolverse o se rechaza sin llegar al tope, vuelve
  a aparecer mientras no haya tocado «Ahora no». Al terminar el tope, también.
- La invitación no promete más solicitudes ni adopciones: dice qué cambia en lo que ven los demás y
  qué pasa con las fotos de la cédula.
- La ve solo la persona dueña de «Mis animales». Nadie más sabe si se le mostró, si la cerró o si
  pidió la verificación desde ahí, tampoco quien administra.
- Una camada cuenta como cualquier otra publicación para que aparezca la invitación.
- Si en ese momento no se puede saber el estado de la verificación de la persona, la invitación no
  aparece y el resto de «Mis animales» funciona como hoy.

## Criterios de aceptación
### Camino feliz
- **Dado** que Carla tiene el teléfono verificado, no tiene la identidad y publicó a Tobi **cuando**
  abre «Mis animales» en el teléfono **entonces** ve arriba de sus animales la invitación con
  «Verificar mi identidad» y «Ahora no», que dice que Tobi va a decir «Identidad verificada» en su
  ficha, en el listado, en la vista previa del enlace y en el cartel, que las fotos de la cédula se
  borran después de revisarlas y que la revisión tarda hasta 2 días; «Publicar un animal» sigue siendo
  la acción principal de la pantalla.
- **Dado** que Carla toca «Verificar mi identidad» **cuando** manda las dos fotos **entonces** su
  pedido queda en revisión con los mismos pasos que desde «Mi perfil», y al volver a «Mis animales» la
  invitación ya no aparece.
- **Dado** que quien administra aprueba el pedido que Carla empezó desde la invitación **cuando**
  llega el correo de identidad aprobada **entonces** trae, además de lo de hoy, un enlace a «Mis
  animales», donde la tarjeta de Tobi ya dice «Identidad verificada».

### Casos borde (al menos 3)
- **Dado** que Carla tocó «Ahora no» **cuando** vuelve a «Mis animales» al día siguiente o un mes
  después **entonces** no ve la invitación, y en «Mi perfil» sigue pudiendo pedir la verificación.
- **Dado** que Carla tocó «Verificar mi identidad» y se fue sin mandar las fotos **cuando** vuelve a
  «Mis animales» **entonces** ve la invitación de nuevo.
- **Dado** que el pedido de Carla se rechazó por una foto borrosa y no llegó al tope **cuando** vuelve
  a «Mis animales» **entonces** ve la invitación de nuevo; **y dado** que es su tercer rechazo en 30
  días **entonces** no la ve hasta que termina el tope.
- **Dado** que Diego tiene la identidad verificada, o tiene un pedido en revisión, o perdió el
  teléfono verificado al cambiar de chip **cuando** abre «Mis animales» **entonces** no ve la
  invitación y la pantalla queda como hoy.
- **Dado** que Ana tiene el teléfono verificado y no publicó nada **cuando** abre «Mis animales»
  **entonces** ve la pantalla vacía de hoy, que la invita a publicar, sin la invitación a verificar la
  identidad.
- **Dado** que Ana publicó solo la camada de Kira y todas sus crías ya se adoptaron **cuando** abre
  «Mis animales» **entonces** ve la invitación, como con cualquier otra publicación.

### Errores y rechazos
- **Dado** que Carla tiene la invitación a la vista y se cortó la conexión **cuando** toca «Ahora no»
  **entonces** la invitación se va de la pantalla igual, sin ningún aviso de error, y puede volver a
  aparecer la próxima vez que abra «Mis animales», porque no se pudo guardar que la cerró.
- **Dado** que Carla tiene «Mis animales» abierto en dos pestañas y en una mandó el pedido **cuando**
  toca «Verificar mi identidad» en la otra **entonces** llega a la verificación de identidad, que le
  muestra el pedido en revisión como hoy, y no puede mandar un segundo pedido.
- **Dado** que en ese momento no se puede saber el estado de la verificación de Carla **cuando** abre
  «Mis animales» **entonces** no ve la invitación y ve sus animales como siempre, sin ningún aviso.
- **Dado** que Carla tiene la invitación en «Mis animales» **cuando** Diego abre el perfil público de
  Carla, la ficha de Tobi o «Mis animales» con su propia cuenta **entonces** no ve nada de la
  invitación de Carla.

## Pantallas
- **«Mis animales» (390 y 1280 px):** la invitación va arriba de la lista de animales, debajo del
  título y de «Publicar un animal», como un cartel de la casa: una línea que dice que puede verificar
  su identidad, debajo en qué lugares cambia «Teléfono verificado» por «Identidad verificada», una
  línea sobre las fotos de la cédula y los 2 días, y las acciones «Verificar mi identidad»
  (secundaria, para no competir con «Publicar un animal») y «Ahora no» (discreta). A 1280 px no queda
  como una franja angosta con la mitad de la hoja vacía ni separa la lista de su título (docs/11,
  2026-09-20). Cargando: la invitación no aparece hasta saber si corresponde, sin mover la lista
  cuando llega. Vacío: sin animales no hay invitación y queda la pantalla vacía de hoy. Error: no
  aparece y la página se ve como hoy.
- **Correo de identidad aprobada:** el de hoy, con un enlace más a «Mis animales» solo cuando el pedido
  empezó desde la invitación. Vacío: no aplica.

## Datos personales
- Se guarda de cada persona que tocó «Ahora no» solo el día en que lo tocó, para no volver a
  mostrarle la invitación. Lo usa solo el sitio para decidir si la muestra; no lo ve nadie, tampoco
  quien administra. Se borra al borrar la cuenta (Ley 18.331).
- El pedido de identidad guarda desde dónde se empezó, como ya hace hoy, y se borra con las mismas
  reglas que el pedido. No se guarda nada nuevo de la cédula ni de la selfie, que se siguen borrando
  después de revisar.

## Medición
Tres momentos nuevos, sin la persona: la invitación se mostró (una vez cada vez que se abre «Mis
animales» con ella a la vista), se tocó «Ahora no», y el pedido de identidad que empieza desde la
invitación lleva su propio origen en cada paso que ya se cuenta (empezado, aceptado el consentimiento,
mandado, retirado, vencido, aprobado, rechazado) y en la pregunta «¿Qué te frena?» (#234). Se suma a
docs/03 §Métricas de éxito, «Cómo se leen», una lectura nueva: **¿quien rescata pasa por la
verificación de identidad cuando el sitio se la ofrece?**
- Los pedidos mandados y aprobados con el origen de la invitación, sobre las veces que se mostró y al
  lado de los «Ahora no». Son momentos, no personas.
- Por qué se va quien empieza y no termina: «¿Qué te frena?» con el origen de la invitación, al lado
  de los de solicitar, publicar y el pedido de quien publicó.
- Qué parte de quienes publican tiene la identidad verificada, antes y después del día en que llega
  la historia, contado en la base sin nombres.
- La lectura 5 gana con qué comparar: fichas vistas, toques y solicitudes por el nivel de quien
  publicó, cuando hay rescatistas en más de un nivel.
- Con 3 a 5 rescatistas los números son chicos: se leen como señal al lado de las opiniones y las
  encuestas, no como prueba.

## Dependencias
- #11 verificación de identidad · #53 publicar · #80 el motivo del último rechazo · #205 y #206
  camadas · #234 «¿Qué te frena?» · #244, #273 y #275 el nivel en la vista previa, la tarjeta y el
  cartel · #269 y #271 «Mis animales» · docs/03 §Hipótesis, §1 y §Métricas de éxito · docs/01
  §«Validación» esconde el problema difícil.

## Decisiones del enjambre
- **Decisión (2026-11-02, product-owner):** se suma invitar a quien publica a verificar su identidad
  desde «Mis animales», como feature nueva propuesta por Producto al terminarse el mapa. Motivo: es lo
  que más enseña de la hipótesis por el trabajo que pide; hoy nada lee si quien rescata paga la
  fricción de la verificación con su propia identidad, y sin rescatistas en más de un nivel la lectura
  5 no tiene qué comparar. (docs/03 §1 y §Hipótesis)
- **Decisión (2026-11-02, product-owner):** la invitación va solo en «Mis animales», para quien ya
  publicó algo, y no al publicar ni por correo. Motivo: un paso más al publicar le pega a la primera
  métrica (publicar más de un animal por su cuenta), y un correo para pedir la cédula es la
  persecución que el sitio promete ahorrar (docs/01 §Huevo y gallina); «Mis animales» es adonde quien
  rescata vuelve a mirar cómo le va a cada ficha (#269). (docs/03 §1)
- **Decisión (2026-11-02, product-owner):** «Ahora no» la cierra para siempre, y vuelve a aparecer
  después de un pedido vencido o rechazado solo si no se tocó «Ahora no». Motivo: es la regla de la
  encuesta (docs/03 §7, decisión 2026-09-27): quien dijo que no, no quiere que se lo pregunten otra
  vez, y la verificación sigue a mano en «Mi perfil». (docs/03 §1)
- **Decisión (2026-11-02, product-owner):** la invitación dice qué cambia en lo que ven los demás y
  qué pasa con las fotos de la cédula, sin prometer más solicitudes ni adopciones. Motivo: una promesa
  que el sitio no puede medir con 3 a 5 rescatistas empujaría la respuesta que la lectura nueva quiere
  leer; lo que cambia en la tarjeta, la ficha, la vista previa y el cartel es cierto y se ve.
  (docs/03 §1)
- **Decisión (2026-11-02, product-owner):** de «Ahora no» se guarda solo el día, y nadie más sabe si
  se le mostró la invitación o si la cerró. Motivo: alcanza para no volver a mostrarla; entre dos
  opciones razonables va la que guarda y muestra menos (Ley 18.331). (docs/03 §1)
- **Decisión (2026-11-02, product-owner):** se suman tres momentos a la medición (la invitación se
  mostró, «Ahora no» y el origen propio del pedido que empieza desde ella), sin la persona. Motivo: la
  pregunta es nueva y los momentos de hoy no la contestan, porque todos los pedidos de identidad llevan
  el mismo origen; es la misma marca que el aval desde el seguimiento (#261) y no agrega ningún dato
  de nadie. (docs/03 §7 y §Métricas de éxito)
- **Decisión (2026-11-02, product-owner):** el correo de identidad aprobada de un pedido que empezó en
  la invitación suma un enlace a «Mis animales». Motivo: quien rescata ve ahí que sus fichas ya dicen
  «Identidad verificada», como el correo de quien adopta lleva de vuelta al animal (docs/03 §2,
  decisión 2026-09-27). (docs/03 §1)


---
_Generated by [Claude Code](https://claude.ai/code)_
