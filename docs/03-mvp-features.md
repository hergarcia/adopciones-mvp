# 03 — MVP: features

## Hipótesis a validar

> ¿Rescatistas y adoptantes valoran la verificación lo suficiente como para pasar por fricción
> extra en vez de quedarse en Facebook?

Todo lo que no ayuda a responder eso, afuera.

## Features

### 1. Cuentas y confianza (el diferencial)
- Registro con Google o con un enlace al email. Sin contraseñas. Google es la acción principal y
  la única a la vista; el enlace queda escondido como alternativa (decisión 2026-09-22, `docs/10`).
  Al entrar por Google el perfil llega con el nombre escrito y la foto de Google ofrecida, nunca
  puesta (decisión 2026-09-22, FR-030b de la historia 002).
- **Teléfono verificado obligatorio** por OTP (SMS o WhatsApp). Sin esto no se publica ni se solicita.
- **Niveles de verificación con badges visibles:**
  - Nivel 1: email + teléfono.
  - Nivel 2: cédula + selfie, **revisado a mano** las primeras semanas. Consentimiento explícito,
    revisar, borrar imágenes, guardar solo "verificado el día X".
  - Nivel 3: "avalado por" otro usuario verificado (típicamente un rescatista conocido).
- Perfil público: nombre, foto, zona (departamento + localidad), badges, fecha de alta, historial.
- **Teléfono y contacto nunca públicos.** Se revelan solo cuando una solicitud es aceptada.
- Reportar y bloquear usuario.
- **Decisión (2026-09-25, product-owner):** quedarse con el número se ofrece en la misma pantalla
  de «número en uso», con el código que la persona acaba de escribir bien, en vez de mandar otro.
  Motivo: ya demostró tener el número en la mano; un segundo código es fricción y plata sin
  ninguna prueba nueva (docs/01 §Verificación = fricción).
- **Decisión (2026-09-25, product-owner):** la cuenta anterior pierde el número del todo, se entera
  por correo en el momento y lo ve en su perfil, sin saber quién lo tiene. Motivo: si solo quedara
  sin verificar con el número guardado, la historia de M3 podría revelar el teléfono de otra
  persona; el correo llega a tiempo cuando el caso es un chip robado.
- **Decisión (2026-09-25, product-owner):** no se guarda nada que una las dos cuentas; la anterior
  guarda solo el día en que perdió el número. Motivo: el mínimo de datos que alcanza para
  explicarle qué pasó (docs/01 §Legal / datos).
- **Decisión (2026-09-25, product-owner):** se pide solo el frente de la cédula y una selfie con la
  cédula en la mano. Motivo: el frente alcanza para ver que es vigente y de quién es la cara, pedir
  el dorso es juntar datos que no hacen falta (Ley 18.331), y sostenerla en la selfie es lo que un
  revisor a mano tiene para distinguir a quien tiene la cédula de quien encontró una foto de ella.
- **Decisión (2026-09-25, product-owner):** el nivel 2 certifica que hay una persona real con cédula
  uruguaya vigente, no el nombre para mostrar, que sigue siendo libre. Motivo: muchos rescatistas
  se muestran con el nombre de su grupo o refugio, y guardar el nombre legal para compararlo sería
  guardar un dato de la cédula que docs/01 §Legal / datos dice que no se guarda.
- **Decisión (2026-09-25, product-owner):** números: fotos de hasta 10 MB, la espera anunciada es de
  hasta 2 días, el pedido vence a los 7 días sin resolver, y el tope es de 3 pedidos rechazados en
  30 días; retirar o vencer no cuenta. Motivo: la revisión es a mano y part-time, una semana sin
  respuesta ya es un pedido que la persona abandonó, y el tope tiene que frenar a quien prueba
  cédulas ajenas sin castigar a quien sacó una foto borrosa.
- **Decisión (2026-09-25, product-owner):** el resultado y el vencimiento se avisan por correo,
  sin imágenes ni datos de la cédula. Motivo: la persona no va a volver sola al sitio a mirar si ya
  la aprobaron, y sin aviso el nivel 2 se abandona en la espera; las notificaciones push están
  fuera del MVP y el correo es el canal que ya existe.
- **Decisión (2026-09-25, product-owner):** de un rechazo quedan el día y el motivo durante 30 días, lo
  que dura el tope, y quien administra los ve al revisar. Motivo: sin eso no hay tope de intentos
  ni forma de ver a alguien que prueba cédulas distintas; no guarda nada de la cédula y no dura más
  que lo que el tope necesita, que es lo más cerca de «guardar solo verificado el día X» (docs/01
  §Legal / datos).
- **Decisión (2026-09-25, product-owner):** cambiar de teléfono baja la cuenta como dice #10, pero
  al confirmar el nuevo vuelve a nivel 2 sin subir la cédula otra vez. Motivo: la identidad no
  cambió con el número, y volver a pedir la cédula por un cambio de chip es fricción que no compra
  confianza.
- **Decisión (2026-09-26, product-owner):** el seguimiento pasa el umbral y suma KL-024. Motivo: el
  alta es el paso previo obligatorio de la verificación, y perder lo escrito ahí corta ese paso para
  quien carga con mala señal, que es el caso común del rescatista en el celular; KL-024 comparte la
  raíz y pedía reabrirse con esto. Va en las limitaciones conocidas: el PR de la historia borra
  KL-024.
- **Decisión (2026-09-26, product-owner):** reintentar es un toque de la persona, no algo que el
  sitio hace solo cuando vuelve la conexión. Motivo: un guardado automático en segundo plano es
  trabajo y superficie de error que no hace falta para no perder lo escrito; un botón visible le
  deja claro qué pasó. Va en docs/03 §1.
- **Decisión (2026-09-26, product-owner):** la foto elegida sobrevive a un guardado que falla pero
  no a una recarga. Motivo: guardar una imagen en el navegador es lo más pesado de conservar y lo
  más fácil de volver a elegir desde la galería; nombre y zona son lo que cuesta reescribir. Va en
  docs/03 §1.
- **Decisión (2026-09-26, product-owner):** el nivel 3 es tener nivel 2 más al menos un aval
  vigente, así que solo se avala a quien ya verificó su identidad. Motivo: docs/03 §1 dice que cada
  nivel incluye los anteriores, y el piso de verificación que exige quien publica (docs/03 §2) y la
  métrica de cuántos completan el nivel 2 (docs/03 §Métricas de éxito) dejan de medir algo si un
  aval salta la cédula. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** quien recibe un aval puede quitarlo de su perfil, y ese
  aval no se puede volver a dar. Motivo: el nombre de quien avala queda a la vista de cualquiera
  junto al de la persona avalada; nadie tiene que cargar en público con el nombre de alguien que
  no eligió, ni recibirlo de nuevo después de sacarlo. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** un aval deja de contar mientras quien lo dio o quien lo
  recibió no tiene nivel 2, y vuelve a contar solo cuando lo recupera. Motivo: cambiar de teléfono
  baja la cuenta hasta confirmar el nuevo (#10, #11); borrar los avales por un cambio de chip
  castigaría a la otra persona por algo que no hizo. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** no se puede avalar a quien te avala mientras ese aval
  esté vigente, y no hay tope de avales por persona. Motivo: la regla corta el caso más barato de
  dos cuentas que se suben solas; un tope castigaría al rescatista que de verdad conoce a mucha
  gente, y quien avala en masa a desconocidos se frena suspendiéndolo (#13). Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** a un perfil se llega por el enlace que la persona copia
  desde su perfil y manda, y pedir un aval sigue siendo por WhatsApp. Motivo: en este milestone no
  hay otro lugar del sitio donde aparezcan personas, y el enlace es lo que el rescatista ya sabe
  usar: reemplaza el "¿alguien la conoce?" del grupo (docs/01, el competidor es Facebook y
  WhatsApp). Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** el perfil muestra el mes y el año de alta, no el día; y
  un perfil inexistente, borrado o sin completar se ve igual. Motivo: "desde cuándo" es la señal de
  confianza y el día exacto no le suma nada; distinguir una cuenta borrada contaría que esa persona
  existió (docs/01 §Legal / datos). Va a docs/03 §1.
- **Decisión (2026-09-28, product-owner):** el perfil público muestra el mes y el año en que se
  verificó la identidad, no el día; el día exacto lo ve solo su dueña en «Mi perfil». Motivo: es el
  mismo criterio que la fecha de alta, y entre dos opciones razonables de privacidad se toma la que
  muestra menos (Ley 18.331). Va a docs/03 §1.
- **Decisión (2026-09-28, product-owner):** el nombre y la localidad del perfil rechazan teléfonos,
  correos, enlaces y usuarios de redes con la misma regla que la ficha de un animal (KL-53-5).
  Motivo: con el perfil público, un número en el nombre rompe "teléfono y contacto nunca públicos"
  y saca la conversación de la plataforma antes de la solicitud, que es donde se mide la hipótesis
  (docs/03 §3); una sola regla para todo lo que escribe la misma persona no confunde. Va a docs/03
  §1.
- **Decisión (2026-09-28, product-owner):** la revisión de quien administra también ordena los
  rechazos de un mismo día, del más reciente al más viejo. Motivo: es la misma falla vista del otro
  lado; quien revisa un tercer pedido necesita saber qué se le dijo la última vez para no rechazar
  por lo mismo sin mirar, y no agrega ningún dato. Va a docs/03 §1.
- **Decisión (2026-09-27, product-owner):** no hay reporte de una publicación: se reporta a quien la
  publicó (#13), y las publicaciones nuevas ya pasan por la revisión. Motivo: docs/03 §1 pide
  reportar personas, y una publicación falsa es de una persona; dos caminos para lo mismo parten los
  antecedentes que mira quien administra. Va en docs/03 §1.
- **Decisión (2026-09-26, product-owner):** los motivos de reporte son estafa, maltrato animal,
  vende animales, se hace pasar por otra persona, acoso y otro, con texto obligatorio solo en
  "otro". Motivo: son los problemas que nombra docs/01 §"Validación" esconde el problema difícil,
  y una lista corta le deja a quien administra ver patrones sin leer texto libre. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** bloquear corta los avales entre las dos personas y la
  persona bloqueada no se entera. Motivo: un aval a la vista de todos entre dos personas que se
  bloquearon es una garantía falsa, y avisarle a quien acosa que lo bloquearon lo empuja a buscar
  otro camino. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** el número de una cuenta suspendida no se puede
  verificar en otra cuenta, tampoco con el camino de #25. Motivo: sin esto, quien fue suspendido
  abre otra cuenta, se queda con su propio número y vuelve verificado en cinco minutos; la
  verificación dejaría de significar nada justo cuando falla. Va a docs/03 §1.
- **Decisión (2026-10-05, enjambre):** quien bloqueó a una persona que después fue suspendida puede
  reportarla desde la pantalla de perfil bloqueado, y el reporte se guarda como cualquier otro.
  Motivo: rechazarlo le contaría la suspensión, y la decisión del 2026-09-26 dice que una suspensión
  no se exhibe; en cualquier otro camino la cuenta suspendida se ve como una que no existe y no se
  reporta (#13). Va a docs/03 §1.
- **Decisión (2026-10-07, product-owner):** el destino se conserva para cualquier pantalla del
  sitio a la que iba la persona, no solo para publicar, y por las dos salidas de «El enlace no
  sirve», también «Escribir mi correo». Motivo: es la misma promesa de #9 («no perdés a dónde
  ibas»); dejarla solo para publicar la rompería en cuanto M3 lleve a solicitar desde la ficha, y
  quien elige escribir su correo de nuevo iba al mismo lugar. Va a docs/03 §1.
- **Decisión (2026-10-07, product-owner):** a dónde iba la persona no se guarda en su cuenta; viaja
  con el pedido del enlace y se descarta al usarlo. Motivo: entre recordarlo en la cuenta y no
  guardarlo, se elige lo que guarda menos (Ley 18.331), y alcanza para el caso. Va a docs/03 §1.

### 2. Publicación de animales
- Ficha: hasta 5 fotos, nombre, especie (**solo perro y gato**), sexo, edad aproximada, tamaño,
  castrado, vacunas, chip, convive con niños / perros / gatos, descripción, zona, urgencia.
- Estado: disponible / en proceso / adoptado / pausado.
- **Expiración automática a los 30-45 días** con recordatorio "¿sigue disponible?".
- El publicador puede exigir nivel mínimo de verificación a los solicitantes (1 o 2).
- Flag "soy rescatista/refugio" en el perfil. Sin roles complejos de organización.
- **Decisión (2026-09-26, product-owner):** una publicación tiene al menos 1 foto y como máximo 5,
  en los mismos formatos y con el mismo tope de 10 MB que la foto del perfil. Motivo: una ficha sin
  foto no compite con un posteo de Facebook, y dos topes distintos para la misma acción de elegir
  una foto confunden.
- **Decisión (2026-09-26, product-owner):** obligatorios son foto, nombre, especie, sexo, edad
  aproximada, tamaño, castrado, vacunas, chip y zona; la descripción es opcional (hasta 2000
  caracteres) y el nombre tiene hasta 30. Convivencia con niños, perros y gatos se contesta con sí,
  no o no se sabe y arranca en no se sabe; vacunas es al día, incompletas o sin vacunar. Motivo: son
  lo que el adoptante pregunta siempre y el rescatista lo sabe; la convivencia muchas veces no se
  sabe, y obligar a inventarla engaña al adoptante.
- **Decisión (2026-09-26, product-owner):** la edad aproximada se carga en meses (1 a 11) o años
  (1 a 25), vale para el día en que se publica y avanza sola. Motivo: así la escribe un rescatista
  ("2 meses", "unos 3 años"), y un cachorro no puede quedar con 2 meses para siempre en una ficha
  que vive semanas.
- **Decisión (2026-09-26, product-owner):** el tamaño es el de adulto (chico, mediano o grande),
  estimado en un cachorro. Motivo: el adoptante decide por el perro que va a tener en su casa, no
  por el que ve en la foto.
- **Decisión (2026-09-26, product-owner):** la urgencia es una marca, sí o no. Motivo: es el
  "URGENTE" del posteo de Facebook, y docs/10 ya la dibuja como una sola etiqueta.
- **Decisión (2026-09-26, product-owner):** la zona del animal se propone desde el perfil y se puede
  cambiar. Motivo: casi siempre es la misma, pero los animales en hogar de tránsito están en otro
  lado.
- **Decisión (2026-09-26, product-owner):** el nombre y la descripción no aceptan teléfonos,
  correos ni enlaces, y se explica por qué. Motivo: si el rescatista deja su WhatsApp en la ficha,
  la solicitud no pasa por la plataforma, la verificación no se usa y la hipótesis no se puede medir
  (docs/03 §3, «la solicitud pasa por la plataforma, con verificación»).
- **Decisión (2026-09-26, product-owner):** no hay tope de animales publicados por persona, y
  publicar otro con el mismo nombre y especie avisa pero no frena. Motivo: un rescatista puede
  tener muchos en tránsito, y la primera métrica de éxito es justamente que publique más de uno; el
  aviso evita el duplicado por error sin trabar al que tiene dos Lunas.
- **Decisión (2026-09-26, product-owner):** un guardado que falla por la conexión conserva todo en
  pantalla y reintentar no duplica; lo escrito, sin las fotos, sobrevive a una recarga en el mismo
  navegador. Motivo: se carga desde el celular con señal que va y viene, y es la misma regla que el
  perfil (#35); perder cinco fotos y doce datos es volver a Facebook.
- **Decisión (2026-09-26, product-owner):** borrar la cuenta borra sus publicaciones y sus fotos.
  Motivo: una ficha sin un publicador verificado detrás contradice el diferencial, y guardar lo
  mínimo es la regla de datos (docs/01 §Legal / datos).
- **Decisión (2026-09-27, product-owner):** una publicación vence a los 30 días de publicada o
  renovada, con un solo correo 7 días antes, y "Sigue disponible" la renueva a un toque sin
  ingresar; una vencida vuelve con el mismo enlace. Motivo: 30 días mantiene vivo el listado, que
  es lo que le gana al grupo de Facebook, y renovar sin ingresar hace que el costo sea un toque
  por mes; el enlace fijo no rompe el posteo que el rescatista ya pegó. Va en docs/03 §2.
- **Decisión (2026-09-27, product-owner):** en proceso sigue en el listado con su sello; pausada y
  vencida salen y su enlace lo explica; adoptada sale del listado, pero su ficha queda con el sello
  "Adoptado" y se puede volver a publicar. Motivo: es lo que el rescatista ya hace en el grupo
  ("RESERVADO", "ADOPTADO"), y quien llega desde un posteo viejo ve que se resolvió y sigue
  mirando en vez de escribir a nadie. Va en docs/03 §2.
- **Decisión (2026-09-27, product-owner):** pausar congela el vencimiento, y reanudar, renovar o
  volver a publicar dan 30 días nuevos; editar no renueva. Motivo: un animal pausado (enfermo, en
  tratamiento) no está a la vista y no tiene nada que confirmar; editar un error de tipeo no dice
  que el animal siga disponible. Va en docs/03 §2.
- **Decisión (2026-09-27, product-owner):** pausar, marcar en proceso, marcar adoptado y borrar no
  exigen el teléfono verificado; lo que vuelve a poner un animal a la vista, sí. Motivo: sacar de la
  vista un animal que ya no está nunca debe trabarse, y lo que se muestra al público sigue teniendo
  a una persona verificada detrás (#57). Va en docs/03 §2.
- **Decisión (2026-09-27, product-owner):** el nivel mínimo que el publicador exige a quien
  solicita se elige y se aplica en la historia de solicitar adopción de M3, no en esta. Motivo:
  sin solicitudes no se puede probar de punta a punta (docs/09 §Tamaño), y la métrica que lo mide,
  qué parte de los adoptantes completa el nivel 2 cuando se lo exigen, ocurre al solicitar. Va en
  docs/03 §2.
- **Decisión (2026-10-05, enjambre):** el tiempo que una cuenta pasa suspendida (#13) no cuenta para
  el vencimiento de sus publicaciones: al reactivarla, a cada una le quedan los días que le quedaban,
  y mientras dure no sale el correo «¿sigue disponible?». Motivo: la historia #13 pide que los
  animales vuelvan al listado con el mismo enlace al reactivar; si el reloj siguiera, una suspensión
  de más de 30 días los dejaría vencidos y la reactivación no los devolvería. Va a docs/03 §2.
- **Decisión (2026-09-27, product-owner):** el nivel mínimo se elige al publicar o editar, arranca
  en teléfono verificado, se ve en la ficha y se controla antes del cuestionario; el correo de
  identidad aprobada lleva de vuelta al animal. Motivo: quien descubre el requisito después de
  escribir todo el cuestionario abandona por enojo, no por la verificación, y eso ensuciaría la métrica de
  cuántos completan el nivel 2 cuando se lo piden. Va en docs/03 §2.

### 3. Búsqueda y difusión
- Listado con filtros: especie, sexo, tamaño, edad, departamento, castrado.
- **Fichas visibles sin registrarse**, link limpio, preview lindo al compartir (imagen OG con
  foto + nombre + zona).
- **Decisión (2026-09-28, product-owner):** el enlace desde la ficha de un animal al perfil público
  de quien lo publica lo suma la ficha pública (#57), que se construye después. Motivo: la ficha
  pública todavía no existe, y la historia que se construye segunda es la que une las dos
  pantallas; así ninguna de las dos deja la otra a medias. Va a docs/03 §3.

> No vamos a reemplazar Facebook, lo vamos a usar de canal. El rescatista sigue posteando en su
> grupo, pero postea nuestro link. La solicitud pasa por la plataforma, con verificación.
> Ese es el mecanismo de crecimiento sin gastar.

- **Decisión (2026-09-27, product-owner):** solo se ven los animales cuyo publicador tiene hoy el
  teléfono verificado; si lo pierde, sus fichas dicen "no disponible por ahora" y vuelven solas al
  confirmar. Motivo: el diferencial es que detrás de cada ficha hay una persona verificada, y el que
  da en adopción también se verifica (docs/01 §"Validación" esconde el problema difícil); el enlace
  no se rompe para siempre, así que al rescatista no le cuesta el posteo. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** el listado va del más reciente al más viejo, de a 24,
  sin ordenar por urgencia. Motivo: si lo urgente fuera primero, todos marcarían urgente y la marca
  dejaría de decir algo; la urgencia se ve en cada animal. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** la edad se filtra en cuatro tramos: cachorro (menos de
  1 año), joven (1 a 2), adulto (3 a 7) y mayor (8 o más), sobre la edad de hoy. Motivo: así se
  busca en los grupos ("cachorro", "adulto"), y la edad cargada en meses o años no se puede filtrar
  de otra forma sin pedir números. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** en un filtro se marcan varias opciones y los filtros se
  suman; los filtros viajan en el enlace del listado. Motivo: "chico o mediano" es la búsqueda de
  quien vive en un apartamento, y un rescatista puede pegar en su grupo "los gatos de Canelones"
  con un solo enlace. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** de quien publica, la ficha muestra solo nombre, foto, si
  es rescatista o refugio y su nivel en palabras; su perfil público y su distintivo llegan con #12.
  Motivo: son datos que docs/03 §1 ya define como públicos, y lo mínimo para que el adoptante vea
  que hay una persona verificada detrás (docs/01 §Legal / datos). Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** el enlace de una ficha no cambia nunca, aunque se edite
  el nombre, y "Compartir" está también en Mis animales. Motivo: el posteo del grupo de Facebook
  vive semanas, y compartir es el trabajo que el rescatista hace por cada animal (docs/03 §3). Va
  en docs/03 §3.
- **Decisión (2026-09-28, product-owner):** quien publica ve la ficha de sus animales aunque hoy no
  se muestre a nadie más, con el aviso de por qué y el camino para confirmar su teléfono. Motivo: el
  rescatista que cambió de chip tiene que ver qué le falta y que su enlace va a volver, no una
  pantalla de "no disponible" sobre su propio animal. Va en docs/03 §3.
- **Decisión (2026-09-28, product-owner):** la vista previa del enlace de un animal que no se
  muestra (publicador sin teléfono confirmado, o animal que no existe) no lleva foto, nombre ni
  zona: solo el nombre del sitio y "Animales en adopción". Motivo: lo que no se ve en la ficha
  tampoco se ve pegado en un grupo; entre dos opciones, la que muestra menos (Ley 18.331). Va en
  docs/03 §3.
- **Decisión (2026-09-28, product-owner):** esta historia no detecta el contacto disfrazado en la
  descripción (KL-53-3); lo baja la revisión de publicaciones nuevas de #59, que llega antes de la
  beta, y hasta la beta el sitio no lo ve nadie de afuera. Motivo: no hay forma confiable de
  separar "vive en Rivera y Soca" de "la rescatamos en Rivera y Soca", y la revisión a mano ya es
  el mecanismo de docs/03 §6. Va en docs/known-limitations.md: el PR de esta historia cambia el «Se
  reabre cuando» de KL-53-3 a la historia #59.
- **Decisión (2026-09-30, product-owner):** la vista previa del enlace sigue a la ficha: la de un
  animal adoptado muestra su foto y su nombre y dice que fue adoptado; la de uno pausado, vencido,
  dado de baja o borrado no muestra foto, nombre ni zona. Motivo: el posteo viejo sigue circulando
  en el grupo, y una vista previa que dice "en adopción" sobre un animal ya entregado es justo el
  mensaje sin respuesta que hace volver a Facebook; lo que no se ve en la ficha no se ve pegado
  (decisión 2026-09-28, la que muestra menos, Ley 18.331). Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** la acción principal de la portada es "Publicar un
  animal", y "Ver animales en adopción" va al lado como segunda. Motivo: el adoptante llega sobre
  todo por el enlace de una ficha (docs/03 §3); quien entra por la dirección del sitio es el
  rescatista al que se lo recomendaron, y el producto es para rescatistas primero (docs/01 §Huevo y
  gallina). Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** la portada solo cuenta lo que el sitio ya hace; la
  historia de M3 que construye la solicitud y el contacto al aceptar agrega su paso a la portada.
  Motivo: prometer lo que todavía no existe es exactamente la desconfianza que el producto viene a
  sacar (docs/01 §Por qué tiene sentido), y un rescatista que publica por una promesa que no se
  cumple no vuelve. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** la portada muestra los 8 animales más recientes del
  listado, con sus mismas reglas y sin orden por urgencia, y sin cifras del sitio ni testimonios.
  Motivo: un animal real convence más que una frase, y es la misma regla que el listado (#57);
  en la beta los números son chicos y una cifra chica se lee como un sitio vacío. Va en docs/03 §3.
- **Decisión (2026-09-27, product-owner):** la portada es la misma con o sin sesión y no manda a
  nadie a otra pantalla. Motivo: una sola pantalla que decir y medir; quien ingresó llega a lo suyo
  desde su menú o desde "Publicar un animal". Va en docs/03 §3.
- **Decisión (2026-09-30, product-owner):** los animales de una cuenta suspendida salen del listado
  y su enlace se ve como el de un animal que no está publicado, también en la vista previa; vuelven
  con el mismo enlace al reactivar. Motivo: #57 y #59 dejaron esto para esta historia, un vendedor
  suspendido no puede seguir ofreciendo animales, y decir que el publicador está suspendido sería
  exhibir la suspensión. Va a docs/03 §3.
- **Decisión (2026-09-30, product-owner):** quien bloquea deja de ver los animales de la persona
  bloqueada, en el listado y en su enlace; la bloqueada sigue viendo los de quien la bloqueó.
  Motivo: bloquear es dejar de ver a alguien, y un adoptante que bloqueó a quien le quiso vender un
  animal no tiene que seguir encontrándolo en el listado; ocultarle a la bloqueada lo que es público
  para cualquier visitante no la frena y le avisa que la bloquearon. Que no pueda solicitar lo dice
  #63. Va a docs/03 §3.
- **Decisión (2026-10-05, enjambre):** la portada de quien bloqueó tampoco muestra los animales de
  la persona bloqueada, y completa sus 8 con los siguientes; es la única diferencia de la portada con
  sesión. Motivo: bloquear es dejar de ver a alguien (#13), y verla en la primera pantalla rompería
  eso; la regla de «la misma con o sin sesión» era para no mandar a nadie a otra pantalla. Va a
  docs/03 §3.
- **Decisión (2026-10-06, product-owner):** el paso de la portada que cuenta cómo se pide un animal
  y cuándo se da el contacto lo agrega la historia siguiente de M3 (responder las solicitudes), no
  esta. Motivo: la decisión de la portada (2026-09-27, #61) dice que solo cuenta lo que el sitio ya
  hace, y con esta historia sola todavía no hay aceptar ni contacto, que es la promesa entera. Va en
  docs/03 §3.
- **Decisión (2026-10-07, product-owner):** la portada suma dos pasos: para quien adopta, que se
  pide con un cuestionario y que el teléfono se da recién al aceptar; para quien rescata, que las
  solicitudes llegan a un solo lugar con la verificación y las respuestas de cada persona. Motivo:
  la decisión del 2026-10-06 dejó el paso de la portada a esta historia, porque recién con aceptar y
  el contacto la promesa está entera; el paso para el rescatista es la «gestión de solicitantes» por
  la que se muda (docs/01 §Huevo y gallina), y la portada es para rescatistas primero. Va en docs/03
  §3.

### 4. Solicitud de adopción (el corazón)
- "Quiero adoptar": exige verificación y abre el **cuestionario estándar** (10-12 preguntas): tipo de
  vivienda, propia/alquilada (¿permite mascotas?), patio o balcón con red, quiénes viven, otras
  mascotas, horas solo por día, qué pasa si te mudás o viajás, experiencia previa, compromiso de
  castración, presupuesto veterinario, por qué este animal.
- **Bandeja de solicitudes** para el publicador: perfil + badges + respuestas; aceptar / rechazar /
  pedir más info.
- **Al aceptar se revela el contacto** de ambos + botón "abrir WhatsApp". Antes, nada.
- Límite de **3 solicitudes activas** por adoptante.
- Al rechazar, el publicador elige un motivo de una lista (dato clave).
- **Decisión (2026-09-25, product-owner):** no se vuelve a confirmar cada tanto un número
  verificado; la historia de M3 que revela el contacto decide si lo confirma antes de revelarlo.
  Motivo: confirmar cada tanto le cobra fricción a cada rescatista por un caso raro, y el daño
  aparece recién al revelar el contacto.
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
- **Decisión (2026-09-27, product-owner):** mandar una solicitud avisa solo en pantalla; los correos
  por una solicitud nueva o por su respuesta llegan con la bandeja. Motivo: un correo que avisa una
  solicitud tiene que llevar a donde se responde, y eso es la historia siguiente. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** al aceptar se revela el nombre y el teléfono verificado
  de las dos personas, con "Abrir WhatsApp" y un mensaje ya escrito; el correo no se muestra nunca.
  Motivo: la conversación sigue por WhatsApp, que es el canal de todos (docs/01), y el teléfono es
  el único contacto verificado; mostrar lo mínimo que alcanza es la regla de datos (docs/01 §Legal /
  datos). Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** no se vuelve a confirmar el número antes de revelarlo;
  se muestra el teléfono verificado que la persona tiene hoy, y si no tiene, se dice sin mostrar el
  viejo. Para aceptar, las dos tienen que tenerlo. Motivo: docs/03 §4 dejó la decisión a esta
  historia; desde #25, un número que pasa a otra cuenta deja de estar en la anterior, así que el
  riesgo de revelar un número ajeno ya está cubierto sin cobrarle un código a cada aceptación. Va
  en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** un animal puede tener más de una solicitud aceptada, y
  aceptar ofrece marcarlo "En proceso" sin hacerlo solo. Motivo: el rescatista habla con más de una
  familia antes de decidir, y quien falla después de aceptar necesita una segunda opción; nada se
  elige por la persona (docs/11 §Producto). Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** los motivos de rechazo son elegí a otra persona, la
  vivienda no es adecuada, pasaría mucho tiempo solo, no se compromete a castrarlo, no convive bien
  con los de la casa, no contestó lo que le pregunté, y otro con una línea; más "la adopción no se
  concretó" para dejar sin efecto una aceptación. Es la primera versión, que se muestra a los 3-4
  rescatistas junto con el cuestionario antes de la beta. Motivo: siguen los temas del cuestionario
  (#63) para que el motivo se pueda cruzar con las respuestas, que es el "dato clave" de docs/03 §4.
  Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** el motivo del rechazo lo ve solo quien publicó; a quien
  solicitó se le dice que no fue aceptada, y no puede volver a solicitar ese animal. Motivo: un
  rescatista no quiere tener que justificarse ante cada rechazado, que es la discusión que hoy tiene
  por WhatsApp, y el motivo es más honesto si nadie lo lee del otro lado. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** pedir más información es una pregunta y una respuesta,
  hasta 3 por solicitud y una esperando a la vez, sin teléfonos, correos ni enlaces. Motivo: el chat
  in-app está fuera del MVP (docs/03 §Fuera del MVP); lo que el cuestionario no alcanza se pregunta
  acá y el resto se habla por WhatsApp después de aceptar. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** una aceptación se puede dejar sin efecto, y el teléfono
  deja de verse para las dos; cuando el animal se adopta, una aceptada sigue mostrando el contacto.
  Motivo: si la adopción no se concreta, la persona no debería quedar ocupando uno de sus 3 lugares
  ni con el teléfono del rescatista a la vista; si se concretó, el seguimiento de M4 necesita que se
  sigan encontrando. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** los correos de solicitud nueva no se repiten mientras
  el publicador tenga nuevas sin abrir de ese animal; ningún correo lleva el teléfono, las
  respuestas ni el motivo. Motivo: un rescatista con un animal compartido en un grupo grande recibe
  muchas solicitudes, y un correo por cada una lo empuja a ignorarlos; un correo reenviado no
  debería exponer a nadie. Va en docs/03 §4.
- **Decisión (2026-09-27, product-owner):** una solicitud no vence sola y no hay recordatorios al
  publicador en esta historia; la bandeja muestra los días que lleva esperando y quien solicitó
  puede retirarla. Motivo: el tiempo de respuesta es una de las métricas de éxito, y un vencimiento
  automático la escondería; si la beta muestra solicitudes olvidadas, se decide con ese dato. Va en
  docs/03 §4.
- **Decisión (2026-10-07, product-owner):** quien publicó ve con el mismo texto una solicitud que se
  cerró porque quien la mandó la retiró, lo bloqueó o fue suspendida, sin decir cuál. Motivo: #13
  decidió que la persona bloqueada no se entera y que una suspensión no se exhibe; distinguir el
  retiro del resto se lo contaría. En privacidad, entre dos opciones se toma la que muestra menos
  (Ley 18.331). Va en docs/03 §4.

> Diseñar el cuestionario **con** 3-4 rescatistas antes de codearlo.

### 5. Cierre y seguimiento
- Marcar "Adoptado" eligiendo a qué solicitante se entregó (vínculo histórico).
- **Compromiso de adopción**: texto corto que ambos aceptan (castración, no abandono, devolver al
  rescatista si no puede tenerlo). Queda por email.
- **Un seguimiento automático a los 30 días**: foto + "¿cómo va?". El rescatista lo ve.
  Si responde, badge "adopción con seguimiento".
- **Decisión (2026-09-27, product-owner):** marcar adoptado obliga a elegir a quién se entregó, entre
  las personas con la solicitud aceptada o "alguien que no vino por el sitio". Motivo: es el vínculo
  histórico de docs/03 §5 y deja medir si la adopción vino por el sitio sin trabar al rescatista que
  lo dio por otro lado (sacar de la vista nunca se traba, #59); solo las aceptadas, porque nadie
  entrega un animal a quien todavía no le vio el teléfono. Va en docs/03 §5.
- **Decisión (2026-09-27, product-owner):** el compromiso es un texto fijo, igual para todos, con la
  castración solo si el animal no está castrado y el compromiso de quien lo dio de recibirlo de
  vuelta; dice que es un acuerdo de palabra, no un contrato. Es la primera versión, que se muestra a
  los 3-4 rescatistas junto con el cuestionario antes de la beta. Motivo: cubre los tres puntos de
  docs/03 §5, "ambos aceptan" pide algo de cada lado, y docs/06 dice que no es un contrato legal. Va
  en docs/03 §5.
- **Decisión (2026-09-27, product-owner):** quien publicó acepta el compromiso al marcar; quien adoptó,
  después, desde el correo o Mi solicitud; la adopción cuenta aunque no lo acepte nunca, sin
  recordatorios, y cuando lo aceptaron las dos, cada una recibe el texto por correo. Motivo: el animal
  ya se entregó en la mano, y esperar al adoptante para marcarlo dejaría a la vista un animal que ya
  no está (#59); "queda por email" (docs/03 §5) es la copia que cada uno guarda. Va en docs/03 §5.
- **Decisión (2026-09-27, product-owner):** quien fue elegido puede decir "Yo no adopté" mientras el
  compromiso está pendiente, lo que deshace el vínculo y avisa a quien publicó; no hay forma de
  cambiar a quién se entregó. Motivo: el vínculo va a alimentar el historial que llega con el
  seguimiento (#12), y un error del rescatista no puede quedar como historia de otra persona. Va en
  docs/03 §5.
- **Decisión (2026-09-27, product-owner):** al marcar adoptado, solo las dos personas de la adopción
  siguen viendo el teléfono de la otra; las otras aceptadas se cierran y dejan de verlo, y volver a
  publicar, "Yo no adopté" o bloquear lo cortan también. Motivo: es lo mínimo que alcanza (docs/01
  §Legal / datos), y el seguimiento solo necesita a quien adoptó; cambia lo que #65 dejaba a la vista
  de todas las aceptadas. Va en docs/03 §4 y §5.
- **Decisión (2026-09-27, product-owner):** quién adoptó a un animal lo ven solo las dos personas: ni
  la ficha adoptada, ni el perfil público, ni el listado lo muestran. Motivo: la ficha adoptada ya no
  muestra nada de quien adoptó (#59) y el historial en el perfil llega con el seguimiento (#12); nada
  se muestra antes de que haga falta. Va en docs/03 §5.
- **Decisión (2026-10-08, product-owner):** suspender la cuenta de una de las dos personas de una
  adopción deja de mostrar el teléfono para las dos, igual que bloquear, y reactivarla no lo vuelve a
  mostrar; la adopción y el compromiso quedan registrados. Motivo: es lo que #65 ya hace con una
  aceptada cuando se suspende una cuenta (docs/03 §4), y ante la duda se muestra menos (Ley 18.331);
  el vínculo sigue contando para la medición. Va en docs/03 §5.
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

### 6. Panel de admin
- Cola de verificaciones de cédula.
- Cola de publicaciones nuevas (revisión manual las primeras semanas).
- Reportes, suspender usuarios.
- **Decisión (2026-09-25, product-owner):** quién administra lo designa el equipo por fuera del
  sitio, y nadie resuelve su propio pedido. Motivo: es la primera pantalla de administración y el
  nivel 2 no vale nada si quien lo da puede dárselo a sí mismo.
- **Decisión (2026-09-27, product-owner):** la revisión de publicaciones nuevas es después de salir:
  se ven en el momento y quien administra las marca revisadas o las da de baja con un motivo; una
  revisada que se edita vuelve a la lista; una baja no se deshace desde el sitio. Motivo: un
  rescatista que tiene que esperar hasta 2 días para pegar el enlace en su grupo vuelve a Facebook,
  y la publicación ya viene de alguien con el teléfono verificado; revisar después alcanza para
  bajar la venta o las fotos robadas en horas. Va en docs/03 §6.
- **Decisión (2026-09-30, product-owner):** el motivo de baja por contacto cubre también una
  dirección y la descripción, y Publicaciones por revisar muestra la descripción completa. Motivo:
  es la revisión que KL-53-3 espera para el contacto disfrazado que la ficha no puede detectar sola;
  si el rescatista deja su WhatsApp en palabras, la solicitud no pasa por la plataforma y la
  hipótesis no se puede medir (docs/03 §2). Va en docs/03 §6.
- **Decisión (2026-09-26, product-owner):** una suspensión no se exhibe: el perfil de una cuenta
  suspendida se ve como uno que no existe y quien reportó no se entera del resultado. Motivo: una
  suspensión se levanta a mano y puede ser un error; exhibirla sería el escrache del grupo de
  Facebook con sello del sitio (docs/01 §Legal / datos). Va a docs/03 §6.
- **Decisión (2026-09-26, product-owner):** la persona suspendida recibe un correo con el motivo y
  otro cuando la reactivan, y desde la pantalla de suspendida puede borrar su cuenta. Motivo: es lo
  mismo que ya hacen #11 y #25 cuando algo cambia en la cuenta, y borrar la cuenta es un derecho
  que la suspensión no quita (Ley 18.331). Va a docs/03 §6.
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

### 7. Instrumentación (el objetivo real)
- Funnel: vio ficha, clic adoptar, completó cuestionario, aceptado, adoptado.
  Plausible / Umami / PostHog.
- Encuesta de 2 preguntas post-adopción y post-rechazo.
- Botón de feedback siempre visible + WhatsApp de soporte en el footer.
- **Decisión (2026-09-27, product-owner):** la encuesta es una pregunta de tres opciones distinta por
  momento y la misma pregunta abierta opcional para los tres: a quien publicó, si publicaría acá el
  próximo; a quien adoptó, si verificarse y el cuestionario valieron la pena frente a un grupo; a quien
  no fue elegido, si sigue buscando acá. Motivo: cada una lee una parte de la hipótesis de docs/03, y
  a quien rescata no se le pregunta si le ahorró trabajo porque la métrica pide que lo diga sin que se
  le pregunte. Es la primera versión, que se muestra a los 3-4 rescatistas junto con el cuestionario
  antes de la beta. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** "post-rechazo" incluye la solicitud que se cerró porque el
  animal encontró hogar con otra persona, y "post-adopción" incluye al rescatista que lo dio por fuera
  del sitio. Motivo: para quien solicitó, no ser elegido es el mismo desenlace se llame como se llame,
  y quien dio el animal por fuera es justo quien puede decir por qué. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** la encuesta aparece en el sitio, en la pantalla del
  desenlace, sin correos ni recordatorios, y como mucho una cada 30 días por persona; "Ahora no" la
  cierra para siempre. Motivo: un rescatista con diez adopciones no quiere diez encuestas, y perseguir
  con correos es lo que el sitio promete ahorrar (docs/01 §Huevo y gallina); los 30 días dan tres
  lecturas por persona en una beta de 2-3 meses. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** las respuestas y las opiniones no se guardan con la
  persona, como la medición de #9, y no pueden llevar un teléfono ni un correo; de cada persona queda
  solo que se le ofreció una encuesta y cuándo. Motivo: es lo mínimo que alcanza para aprender (docs/01
  §Legal / datos), la gente contesta más sincero si sabe que no se lo van a reprochar, y así no nace
  ningún dato personal nuevo que decidir. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** Opinar está a la vista en todas las pantallas, también sin
  sesión, con hasta 5 opiniones por día desde un mismo navegador, y quien administra las lee y puede
  borrarlas en el sitio. Motivo: quien se va sin registrarse es a quien más hay que escuchar, y un tope
  chico frena el abuso sin frenar a nadie que opina de verdad. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** el número de WhatsApp de soporte lo define el equipo fuera
  del sitio, y mientras no hay ninguno el enlace no aparece. Motivo: conseguir o elegir un número no es
  una decisión de producto, y un enlace roto en el pie es peor que ninguno. Va en docs/03 §7.
- **Decisión (2026-09-27, product-owner):** esta historia no construye un tablero del funnel ni de las
  métricas de éxito: cada historia emite sus pasos y se leen con la herramienta de medición que llega
  con el sitio en la nube, en M5 (docs/07). Motivo: un tablero propio duplicaría esa herramienta, y lo
  que los números no dicen, el porqué, es lo que esta historia agrega. Va en docs/03 §7.
- **Decisión (2026-10-08, product-owner):** "no ser elegido" es una solicitud rechazada, una aceptación
  dejada sin efecto o una solicitud cerrada porque el animal se marcó adoptado; retirarla, o que se
  cierre porque el animal se pausó, venció o se borró, porque quien publicó dejó de recibir, o por un
  bloqueo o una suspensión, no ofrece encuesta. Motivo: la pregunta es sobre no haber sido elegido, y
  en esos otros cierres nadie eligió a otra persona; dejar una aceptación sin efecto es un rechazo
  que llega más tarde. Va en docs/03 §7.
- **Decisión (2026-10-08, product-owner):** la encuesta que desaparece porque quien fue elegida dijo
  "Yo no adopté" no se cuenta como ofrecida ni gasta sus 30 días, y borrar una cuenta no cambia
  ningún número de Encuestas. Motivo: esa persona no vivió el desenlace por el que se le preguntaba,
  y los números de Encuestas son la lectura de la hipótesis (docs/03 §Hipótesis): si bajaran al
  borrarse una cuenta, la proporción de respondidas dejaría de poder compararse. Va en docs/03 §7.
- **Decisión (2026-10-09, enjambre):** al construir #71, «Opinar» va entre los enlaces de la
  cabecera, en la fila de la marca, y no como un botón flotante; la encuesta se decide la primera vez
  que la persona abre la pantalla del desenlace y no se revisa después, así que un desenlace que cae
  dentro de los 30 días de la anterior no la ofrece nunca; los desenlaces anteriores a esta historia
  no ofrecen encuesta; de una opinión mandada desde una pantalla privada se guarda solo el nombre de
  la pantalla, sin el animal ni la solicitud; respuestas y opiniones guardan el día y no la hora; y
  el tope de 5 opiniones por día se lleva por navegador, con una cookie. Motivo: un botón flotante
  tapa contenido en el teléfono; revisar la oferta después haría aparecer encuestas de desenlaces
  que ya no se recuerdan; los desenlaces viejos son datos de prueba; la pantalla privada o la hora
  dirían quién mandó algo que se prometió anónimo (Ley 18.331: lo que muestra menos y guarda menos);
  y para una beta chica alcanza con frenar el abuso casual. Detalle en
  `specs/018-encuesta-opiniones-soporte/spec.md` §Assumptions.

### 8. Multilingüe (transversal)
- Se lanza solo en español, pero **ningún texto vive hardcodeado**: todo en `messages/es.json`.
- Enums en DB como claves en inglés, traducidos al mostrar.
- Sin selector de idioma hasta que exista un segundo idioma.
- Detalle y convenciones en `06-i18n.md`.

## Fuera del MVP (a propósito)

| Feature | Por qué no |
|---|---|
| Perdidos/encontrados, donaciones, sitters | Cada una es otro producto. Ver 05-ideas-futuras.md |
| Chat in-app | Se habla por WhatsApp. Caro y la gente lo esquiva. |
| App nativa | PWA mobile-first alcanza. |
| Otras especies | Perros y gatos son el 95%. |
| KYC con proveedor | Manual hasta que el volumen obligue. |
| Mapa / geolocalización | Departamento de lista + localidad en texto. |
| Notificaciones push | Email + WhatsApp manual. |
| Pagos de cualquier tipo | Ni tarifa simbólica. Cero regulación. |
| Matching automático | No hay datos. |
| Favoritos, comentarios, likes | Ruido. |

## Decisiones

- **Decisión (2026-09-19):** la zona de una persona es **departamento + localidad**, no
  "departamento + barrio". El departamento se elige de una lista cerrada de 19; la localidad se
  escribe libre, con sugerencias filtradas por departamento. Motivo: no existe ninguna API de
  barrios de Uruguay confiable, "barrio" es concepto oficial solo en Montevideo y el resto del país
  se organiza por localidades. Para que Montevideo no quede como una sola entrada, sus barrios
  oficiales entran en la misma lista de sugerencias; la pantalla llama "Barrio" al campo en
  Montevideo y "Localidad" en los otros 18 departamentos. Detalle en la spec de la historia #9.
- **Decisión (2026-10-04, product-owner):** esta historia no suma eventos a la analítica. Motivo:
  la instrumentación del funnel es su propia historia (#71, docs/03 §7) y medir aparte las visitas
  que se van antes de ver la ficha adelantaría parte de ella. (docs/03 §7)

## Métricas de éxito (beta 2-3 meses, 3-5 rescatistas)

- ¿Al menos 3 rescatistas publicaron más de un animal **por su cuenta**?
- ¿Qué % de adoptantes completa nivel 2 cuando se lo exigen? (menos de 30% = fricción mal calibrada)
- ¿Qué % de solicitudes llega a aceptación y en cuánto tiempo responde el rescatista?
- ¿Algún rescatista dijo, sin que se le pregunte, "esto me ahorró trabajo"?

## Orden de construcción

1. Auth + perfil + verificación
2. Publicación + listado + link compartible
3. Solicitud + bandeja + aceptación
4. Cierre + seguimiento + admin
5. Beta cerrada

Estimación: 6-8 semanas part-time con Next.js + Supabase.
Costo: dominio + OTP (centavos por SMS) + tiers gratuitos. Menos de US$30/mes.
