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

> Diseñar el cuestionario **con** 3-4 rescatistas antes de codearlo.

### 5. Cierre y seguimiento
- Marcar "Adoptado" eligiendo a qué solicitante se entregó (vínculo histórico).
- **Compromiso de adopción**: texto corto que ambos aceptan (castración, no abandono, devolver al
  rescatista si no puede tenerlo). Queda por email.
- **Un seguimiento automático a los 30 días**: foto + "¿cómo va?". El rescatista lo ve.
  Si responde, badge "adopción con seguimiento".

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

### 7. Instrumentación (el objetivo real)
- Funnel: vio ficha, clic adoptar, completó cuestionario, aceptado, adoptado.
  Plausible / Umami / PostHog.
- Encuesta de 2 preguntas post-adopción y post-rechazo.
- Botón de feedback siempre visible + WhatsApp de soporte en el footer.

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
