## Historia
**Como** rescatista con el teléfono verificado **quiero** publicar un animal con sus fotos y sus
datos desde el celular, y corregirlo cuando cambia algo, **para** tener su ficha lista en un par de
minutos en vez de armar un posteo de Facebook cada vez.

## Contexto
Los rescatistas no se mudan por "seguridad" en abstracto: se mudan si la herramienta les ahorra
trabajo (docs/01 §Huevo y gallina). Publicar es el primer trabajo que el sitio les tiene que
ahorrar, y es lo que mide la primera métrica de éxito: al menos 3 rescatistas que publiquen más de
un animal por su cuenta (docs/03 §Métricas de éxito). Si publicar cuesta más que un posteo en el
grupo, no hay animales, y sin animales no hay solicitudes con las que medir si la verificación vale
la fricción (docs/03 §Hipótesis).

La ficha tiene los datos que un adoptante pregunta siempre por WhatsApp (docs/03 §2), para que el
rescatista no los conteste uno por uno. Es el primer paso de M2: la historia siguiente pone estas
fichas a la vista de todos, con el listado y el enlace para compartir (docs/03 §3).

## Alcance
- Incluye: publicar un perro o un gato con entre 1 y 5 fotos y los datos de la ficha de docs/03 §2
  (nombre, especie, sexo, edad aproximada, tamaño, castrado, vacunas, chip, si convive con niños,
  perros y gatos, descripción, zona y la marca de urgente) · elegir la foto de portada y el orden de
  las fotos · editar todo lo publicado, fotos incluidas · la pantalla **Mis animales** con lo que
  publiqué · que un guardado que falla por la conexión no pierda lo cargado · el aviso de
  verificación pendiente de #10 cuando alguien sin teléfono verificado intenta publicar o editar.
- No incluye (explícito): que otras personas vean la publicación, el listado, la ficha pública y la
  imagen para compartir (historia siguiente de M2) · los estados en proceso, adoptado y pausado, la
  expiración, el recordatorio "¿sigue disponible?", borrar una publicación, el nivel mínimo exigido
  a quien solicita y la revisión antes de salir (historia del ciclo de vida de la publicación) ·
  otras especies · raza · videos · recortar o retocar fotos dentro del sitio · detectar un contacto
  escrito dentro de una foto · conservar las fotos elegidas después de recargar la página · retomar
  una publicación a medias desde otro dispositivo · publicar a nombre de un refugio con varias
  personas · mandar la publicación a Facebook o WhatsApp · solicitar adopción.

## Reglas de negocio
- Publica y edita solo quien tiene nivel 1 (teléfono verificado, #10). Sin nivel 1 se ve el aviso
  de verificación pendiente, con el motivo y el camino para verificarse.
- Una publicación tiene al menos 1 foto y como máximo 5. La primera es la portada; el publicador
  cambia el orden y elige la portada. Se aceptan las fotos del celular en los formatos comunes, de
  hasta 10 MB cada una, igual que la foto del perfil.
- Las fotos se publican sin la ubicación donde se sacaron ni los datos de la cámara: la foto de un
  animal en tránsito no puede decir dónde vive el rescatista.
- Son obligatorios: al menos una foto, nombre (hasta 30 caracteres), especie (perro o gato), sexo
  (macho o hembra), edad aproximada, tamaño, castrado (sí o no), vacunas (al día, incompletas o sin
  vacunar), chip (sí o no) y zona. La descripción es opcional, de hasta 2000 caracteres.
- La edad aproximada se carga en meses (de 1 a 11) o en años (de 1 a 25). Es la edad del día en que
  se publica y avanza sola con el tiempo: un cachorro publicado con 2 meses figura con 3 un mes
  después.
- El tamaño es el de adulto (chico, mediano o grande); en un cachorro, el que se espera que tenga.
- Convive con niños, con perros y con gatos se contesta cada uno con sí, no o no se sabe, y arranca
  en no se sabe.
- La marca de urgente es sí o no, y arranca en no.
- La zona es departamento y localidad, como la del perfil. Se propone la zona del perfil de quien
  publica y se puede cambiar, porque el animal puede estar en un hogar de tránsito en otro lugar.
- El nombre y la descripción no pueden tener un número de teléfono, un correo ni un enlace: el
  contacto se da cuando se acepta una solicitud, nunca antes. Se explica eso mismo al rechazarlo.
- Una publicación nueva queda disponible y guarda la fecha en que se publicó.
- No hay tope de animales publicados por persona: un rescatista puede tener muchos en tránsito.
- Si ya tengo publicado un animal con el mismo nombre y la misma especie, se me avisa antes de
  publicar otro, y puedo seguir igual.
- Un guardado que no llega nunca borra lo cargado: todo sigue en pantalla, con el aviso de que no
  se guardó y por qué, y reintentar manda lo que está en pantalla. Reintentar o tocar dos veces
  publicar nunca crea dos publicaciones.
- Lo escrito y no publicado se conserva al recargar o volver en el mismo navegador, sin las fotos;
  se borra al publicar, al cerrar sesión o al borrar la cuenta.
- Cada persona ve y edita solo sus propias publicaciones.
- Borrar la cuenta borra sus publicaciones y sus fotos.

## Criterios de aceptación
### Camino feliz
- **Dado** que tengo el teléfono verificado **cuando** toco publicar, elijo 3 fotos desde el
  celular, completo los datos obligatorios y toco "Publicar" **entonces** veo "Publicado" y el
  animal aparece primero en Mis animales, con la foto de portada, el nombre, la zona y la marca de
  urgente si la puse.
- **Dado** que estoy cargando un animal **cuando** llego a la zona **entonces** ya está propuesta
  la de mi perfil, y si la cambio, el animal queda con la nueva y mi perfil no cambia.
- **Dado** que cargué varias fotos **cuando** elijo otra como portada o cambio el orden **entonces**
  Mis animales muestra la portada que elegí.
- **Dado** que publiqué un animal **cuando** lo abro desde Mis animales, cambio la descripción,
  saco una foto, agrego otra y guardo **entonces** veo "Guardado" y el animal queda con los cambios.
- **Dado** que publiqué un cachorro con 2 meses **cuando** lo abro un mes después **entonces** su
  edad figura como 3 meses.

### Casos borde (al menos 3)
- **Dado** que ya tengo 5 fotos cargadas **cuando** intento agregar otra **entonces** no se agrega
  y se me dice que el máximo es 5.
- **Dado** que saco la foto de portada **cuando** quedan otras **entonces** la siguiente pasa a ser
  la portada; y si saco la última, no puedo guardar hasta agregar una.
- **Dado** que se corta la conexión **cuando** toco "Publicar" **entonces** veo que no se publicó
  porque no hay conexión, las fotos y los datos siguen en pantalla, y al reintentar con conexión se
  publica una sola vez.
- **Dado** que toco "Publicar" dos veces seguidas **cuando** termina **entonces** hay una sola
  publicación.
- **Dado** que recargo la página a mitad de la carga **cuando** vuelvo **entonces** los datos que
  había escrito siguen ahí y solo tengo que volver a elegir las fotos.
- **Dado** que ya tengo publicada una perra llamada Luna **cuando** publico otra perra llamada Luna
  **entonces** se me avisa que ya tengo una con ese nombre y puedo publicar igual o volver a Mis
  animales.
- **Dado** que cambié de número y todavía no confirmé el nuevo **cuando** intento publicar o editar
  **entonces** veo el aviso de verificación pendiente, y mis animales ya publicados siguen en Mis
  animales.
- **Dado** que publico una foto sacada con el celular **cuando** otra persona la descarga más
  adelante **entonces** la foto no dice dónde se sacó.

### Errores y rechazos
- **Dado** que no tengo el teléfono verificado **cuando** toco publicar **entonces** veo que hace
  falta verificarlo, con el camino para hacerlo ahí mismo.
- **Dado** que no ingresé **cuando** abro publicar **entonces** se me pide entrar y después vuelvo a
  publicar.
- **Dado** que falta un dato obligatorio **cuando** toco "Publicar" **entonces** se me marca cuál
  falta y lo demás sigue cargado.
- **Dado** que escribo mi celular o un enlace de WhatsApp en la descripción **cuando** toco
  "Publicar" **entonces** no se publica, se marca la descripción y se me explica que el contacto se
  da cuando acepto una solicitud.
- **Dado** que elijo una foto de más de 10 MB o un archivo que no es una foto **cuando** se carga
  **entonces** esa foto se rechaza con el motivo y las demás quedan.
- **Dado** que escribo una edad de 0 meses o de 30 años **cuando** toco "Publicar" **entonces** se
  me dice el rango que se acepta.
- **Dado** que abro el enlace de edición de un animal que no es mío **cuando** carga **entonces**
  veo "este animal no existe", igual que si no existiera.

## Pantallas
- **Publicar un animal**: las fotos con la portada marcada, los datos de la ficha y el botón
  "Publicar". Vacío: arranca con el lugar para la primera foto como invitación, la zona del perfil
  propuesta y el resto sin completar.
- **Editar un animal**: lo mismo con lo publicado y el botón "Guardar". Vacío: no aplica.
- **Mis animales**: lo que publiqué, del más nuevo al más viejo, cada uno con su foto de portada,
  nombre, zona y la marca de urgente; tocar uno lo abre para editar. Vacío: "Todavía no publicaste
  ningún animal. Empezá con una foto.", con la acción de publicar.
- **Aviso de verificación pendiente** (de #10): el que se ve al intentar publicar sin estar
  verificado. Vacío: no aplica.

## Datos personales
- Se guarda qué persona publicó cada animal y cuándo. Las fotos se guardan sin la ubicación ni los
  datos de la cámara. La zona del animal es departamento y localidad, nunca una dirección. En esta
  historia la publicación la ven solo quien la publicó y quien administra el sitio. El nombre y la
  descripción no aceptan teléfonos, correos ni enlaces. Borrar la cuenta borra sus publicaciones y
  sus fotos; lo escrito sin publicar vive solo en el navegador de la persona.

## Medición
- Publicación empezada, publicación terminada, abandono entre empezar y publicar, tiempo entre
  empezar y publicar, fotos por publicación, publicación editada, rechazo por contacto en el texto,
  y cuántas personas publican un segundo animal (docs/03 §Métricas de éxito: rescatistas que
  publican más de un animal por su cuenta).

## Dependencias
- #9 Registro e ingreso sin contraseña con perfil básico (la zona y la marca de rescatista del
  perfil).
- #10 Verificación de teléfono (el nivel 1 y el aviso de verificación pendiente).
- docs/03 §2 · docs/01 §Huevo y gallina · docs/07 §Imágenes · docs/08 §Encontrable (las fotos sin
  sus metadatos) · docs/10 (la acción "Publicar" y el vacío de Mis animales).

## Decisiones del enjambre
- **Decisión (2026-09-26, product-owner):** una publicación tiene al menos 1 foto y como máximo 5,
  en los mismos formatos y con el mismo tope de 10 MB que la foto del perfil. Motivo: una ficha sin
  foto no compite con un posteo de Facebook, y dos topes distintos para la misma acción de elegir
  una foto confunden. Va en docs/03 §2.
- **Decisión (2026-09-26, product-owner):** obligatorios son foto, nombre, especie, sexo, edad
  aproximada, tamaño, castrado, vacunas, chip y zona; la descripción es opcional (hasta 2000
  caracteres) y el nombre tiene hasta 30. Convivencia con niños, perros y gatos se contesta con sí,
  no o no se sabe y arranca en no se sabe; vacunas es al día, incompletas o sin vacunar. Motivo: son
  lo que el adoptante pregunta siempre y el rescatista lo sabe; la convivencia muchas veces no se
  sabe, y obligar a inventarla engaña al adoptante. Va en docs/03 §2.
- **Decisión (2026-09-26, product-owner):** la edad aproximada se carga en meses (1 a 11) o años
  (1 a 25), vale para el día en que se publica y avanza sola. Motivo: así la escribe un rescatista
  ("2 meses", "unos 3 años"), y un cachorro no puede quedar con 2 meses para siempre en una ficha
  que vive semanas. Va en docs/03 §2.
- **Decisión (2026-09-26, product-owner):** el tamaño es el de adulto (chico, mediano o grande),
  estimado en un cachorro. Motivo: el adoptante decide por el perro que va a tener en su casa, no
  por el que ve en la foto. Va en docs/03 §2.
- **Decisión (2026-09-26, product-owner):** la urgencia es una marca, sí o no. Motivo: es el
  "URGENTE" del posteo de Facebook, y docs/10 ya la dibuja como una sola etiqueta. Va en docs/03 §2.
- **Decisión (2026-09-26, product-owner):** la zona del animal se propone desde el perfil y se puede
  cambiar. Motivo: casi siempre es la misma, pero los animales en hogar de tránsito están en otro
  lado. Va en docs/03 §2.
- **Decisión (2026-09-26, product-owner):** el nombre y la descripción no aceptan teléfonos,
  correos ni enlaces, y se explica por qué. Motivo: si el rescatista deja su WhatsApp en la ficha,
  la solicitud no pasa por la plataforma, la verificación no se usa y la hipótesis no se puede medir
  (docs/03 §3, «la solicitud pasa por la plataforma, con verificación»). Va en docs/03 §2.
- **Decisión (2026-09-26, product-owner):** no hay tope de animales publicados por persona, y
  publicar otro con el mismo nombre y especie avisa pero no frena. Motivo: un rescatista puede
  tener muchos en tránsito, y la primera métrica de éxito es justamente que publique más de uno; el
  aviso evita el duplicado por error sin trabar al que tiene dos Lunas. Va en docs/03 §2.
- **Decisión (2026-09-26, product-owner):** un guardado que falla por la conexión conserva todo en
  pantalla y reintentar no duplica; lo escrito, sin las fotos, sobrevive a una recarga en el mismo
  navegador. Motivo: se carga desde el celular con señal que va y viene, y es la misma regla que el
  perfil (#35); perder cinco fotos y doce datos es volver a Facebook. Va en docs/03 §2.
- **Decisión (2026-09-26, product-owner):** borrar la cuenta borra sus publicaciones y sus fotos.
  Motivo: una ficha sin un publicador verificado detrás contradice el diferencial, y guardar lo
  mínimo es la regla de datos (docs/01 §Legal / datos). Va en docs/03 §2.

