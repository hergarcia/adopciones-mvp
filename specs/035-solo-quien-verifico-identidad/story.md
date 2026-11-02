## Historia
**Como** persona que busca adoptar y llega desde un grupo de Facebook donde no sabe quién es quién
**quiero** ver en el listado solo los animales de quien verificó su identidad, y que mis avisos por
correo sigan esa elección **para** pedir un animal a alguien que sé que es una persona real.

## Contexto
Desde #273 cada tarjeta del listado dice qué tiene verificado quien publicó, pero nadie puede
elegir por eso: la lectura 5 de docs/03 §Métricas de éxito adivina si quien adopta valora la
verificación mirando qué fichas abre, y con 3 a 5 rescatistas eso se mezcla con la foto, la zona y el
animal. Un filtro que la persona pone a propósito es la respuesta más directa del lado de quien adopta
a docs/03 §Hipótesis, y un aviso guardado con ese filtro es alguien que prefiere esperar a una persona
verificada antes que volver al grupo. A quien rescata le sirve también: si quien adopta filtra, verificar
la identidad le trae gente, que es lo que «Mis animales» le ofrece desde #281.

Le gana a avalar a quien rescató desde el seguimiento (casi nadie llega a un seguimiento en la beta),
al recordatorio de solicitudes y a cargar un animal desde uno anterior (docs/03 §4 espera el dato de la
beta), al traspaso del chip (trámite sin averiguar) y a la mayúscula de «La camada» en Borrar (#264, no
enseña nada): es un filtro sobre un dato que el listado ya muestra y mide la valoración de frente.

## Alcance
- Incluye: en los filtros del listado, «Quien publica» con una sola opción, «Solo de quien verificó su
  identidad», que deja los animales y las camadas de quien tiene la identidad verificada, avalada o no.
  Viaja en el enlace del listado como los demás filtros. «Avisame cuando haya uno así» lo guarda con el
  resto, «Mis avisos» lo escribe en palabras y el correo de las 8 lo respeta. «Sacar los filtros» lo
  saca también.
- No incluye (explícito): filtrar por el teléfono verificado (todo lo que se ve en el listado ya lo
  tiene) ni por tener un aval · ordenar el listado por nivel o poner primero a quien verificó · el filtro
  en la portada, en los animales del perfil, en los sugeridos de Mi solicitud o en la ficha · cambiar lo
  que pide cada ficha para mandar una solicitud · cambiar la invitación a verificar de «Mis animales» o
  decirle a quien publica cuánta gente filtra · cambiar el tope de 3 avisos, la hora o el armado del
  correo.

## Reglas de negocio
- El filtro está apagado si nadie lo elige: el listado de siempre sigue mostrando a todos, con
  identidad verificada o sin ella.
- Cuenta el nivel que quien publica tiene en el momento de mirar, el mismo que dice su tarjeta: a quien
  le aprueban la identidad hoy, sus animales ya aparecen en el listado filtrado.
- Una camada sigue el nivel de quien la publicó, como cualquier animal suyo.
- El filtro se suma a los otros: «perros chicos en Montevideo de quien verificó su identidad».
- Un aviso con el filtro trae solo los animales nuevos de quien tenía la identidad verificada a la hora
  del correo. Un animal que no entró en el correo porque quien lo publicó no la tenía no llega después,
  aunque la verifique: no es nuevo (#265).
- Un aviso con el filtro y otro con los mismos filtros pero sin él son dos avisos distintos, y los dos
  cuentan para el tope de 3.
- Un valor del filtro que no se entiende en el enlace se ignora y el listado se muestra sin él.

## Criterios de aceptación
### Camino feliz
- **Dado** que Carla tiene la identidad verificada y publicó a Tobi, y Rita tiene solo el teléfono
  verificado y publicó a Luna **cuando** Bruno, sin entrar con su cuenta, elige «Solo de quien verificó
  su identidad» y toca «Ver resultados» **entonces** ve a Tobi y no a Luna, y el total dice 1 animal.
- **Dado** que Bruno filtró por «perro», «Montevideo» y «Solo de quien verificó su identidad» **cuando**
  copia el enlace del listado y lo abre en otro teléfono **entonces** se ve el mismo listado con los
  tres filtros marcados.
- **Dado** que Bruno entró con su cuenta y tiene esos tres filtros **cuando** toca «Avisame cuando haya
  uno así» **entonces** en «Mis avisos» aparece «Perros en Montevideo, de quien verificó su identidad».
- **Dado** que Bruno tiene ese aviso y ayer después de las 8 Carla publicó un perro en Montevideo y Rita
  publicó otro **cuando** son las 8 de la mañana **entonces** a Bruno le llega un correo con el perro de
  Carla y sin el de Rita.

### Casos borde
- **Dado** que ninguna persona con la identidad verificada tiene un animal que coincida con los filtros
  de Bruno **cuando** ve el listado **entonces** ve que no hay animales con estos filtros, con «Sacar los
  filtros» y «Avisame cuando haya uno así» a mano.
- **Dado** que Carla tenía la identidad verificada y avalada y quitó de su perfil su único aval **cuando**
  Bruno mira el listado filtrado **entonces** los animales de Carla siguen ahí, y su tarjeta dice que
  tiene la identidad verificada.
- **Dado** que Rita publicó un perro en Montevideo ayer, no entró en el correo de Bruno, y hoy le aprueban
  la identidad **cuando** sale el correo de mañana **entonces** ese perro no llega, aunque ya se ve en el
  listado filtrado.
- **Dado** que Carla tiene la identidad verificada y avalada y publicó una camada **cuando** Bruno filtra
  **entonces** la camada aparece como una sola tarjeta, igual que sin el filtro.
- **Dado** que Bruno ya tiene «Perros en Montevideo» **cuando** crea un aviso con los mismos filtros más
  «Solo de quien verificó su identidad» **entonces** se crea uno nuevo, y «Mis avisos» muestra los dos.

### Errores y rechazos
- **Dado** que se cortó la conexión o el sitio no respondió **cuando** Bruno elige el filtro **entonces**
  ve el aviso de que no se pudo y los animales de los filtros anteriores, sin que la pantalla diga que
  el filtro está puesto.
- **Dado** que alguien abre un enlace del listado con un valor del filtro alterado **cuando** se carga
  la pantalla **entonces** ve el listado sin ese filtro y con los demás que sí se entienden.
- **Dado** que Bruno tiene 3 avisos **cuando** intenta crear uno con el filtro **entonces** ve que llegó
  al máximo de 3 y tiene a mano «Mis avisos» para borrar uno.

## Pantallas
- **Listado:** el grupo «Quien publica» con su opción va con los demás filtros, después de «Castrado»,
  en el teléfono y en la computadora. Al elegirlo, cada tarjeta sigue diciendo el nivel de quien
  publicó, como desde #273. Vacío: el de un listado filtrado sin resultados, con «Sacar los filtros» y el
  ofrecimiento del aviso. Cargando y error: los de cualquier otro filtro.
- **Mi perfil → «Mis avisos»:** un aviso con el filtro suma «de quien verificó su identidad» a su nombre
  en palabras. El vacío, la carga y el error no cambian.
- **Correo de avisos:** el nombre de la parte en palabras suma lo mismo, y el enlace al listado abre con
  el filtro marcado. Nada más cambia.

## Datos personales
No se pide ningún dato nuevo. El filtro usa solo lo que la tarjeta ya muestra a cualquiera: si quien
publica tiene la identidad verificada. Nunca separa a quien la tiene en revisión, rechazada o vencida
de quien no la pidió. El aviso guarda la elección junto con sus otros filtros, la ve solo la persona y
se borra con el aviso o con la cuenta, como dice #265.

## Medición
Elegir el filtro se cuenta en el mismo momento que cualquier otro filtro del listado, con su opción
propia, y crear un aviso con él suma uno a la cantidad de filtros, como hoy. Ninguno lleva a la persona.
Cuántos avisos guardan el filtro se cuenta en la base, sin nombres. Se lee al lado de la lectura 5 de
docs/03 §Métricas de éxito: qué parte de las visitas al listado elige ver solo a quien verificó su
identidad, qué parte de los avisos lo guarda y, siguiendo esas visitas, cuántas terminan en «Quiero
adoptar» y en una solicitud mandada.

## Dependencias
- #11 identidad verificada · #57 listado y filtros · #205 camadas · #265 avisos por correo · #273 el
  nivel de quien publica en cada tarjeta · docs/03 §3, §7 y §Métricas de éxito.

## Decisiones del enjambre
- **Decisión (2026-11-02, product-owner):** se suma filtrar el listado por quien verificó su identidad,
  como feature nueva que propone Producto cuando se terminó el mapa. Motivo: es la forma más directa de
  saber si quien adopta valora la verificación (docs/03 §Hipótesis) mirando lo que elige, sobre un dato que el listado ya muestra desde #273. (docs/03 §3)
- **Decisión (2026-11-02, product-owner):** el filtro es una sola opción, identidad verificada con o sin
  aval, y está apagado si nadie lo elige; no ordena ni pone primero a nadie. Motivo: el teléfono ya lo
  tiene todo lo que se ve y un aval sin la identidad no existe (docs/03 §1); nada se elige por la persona
  (docs/11 §Producto), y quien rescata con solo el teléfono no pierde lugar en el listado de siempre,
  que es para rescatistas primero (docs/01). (docs/03 §3)
- **Decisión (2026-11-02, product-owner):** los avisos guardan el filtro, y un animal que no entró en un
  correo porque quien lo publicó no tenía la identidad verificada no llega después cuando la verifica.
  Motivo: un aviso que ignora un filtro marcado le manda a la persona lo que pidió no ver; y #265 ya
  decidió que solo es nuevo lo que aparece por primera vez, porque avisar dos veces lo mismo hace que
  dejen de abrir los correos. (docs/03 §3)
- **Decisión (2026-11-02, product-owner):** no se agrega un momento a la medición; el filtro se cuenta
  como cualquier otro del listado, y los avisos con él se cuentan en la base sin nombres. Motivo: los
  filtros del listado ya se miden, y #265 dejó los filtros de un aviso fuera de la medición porque junto
  al día podrían decir quién es en una beta chica (Ley 18.331). (docs/03 §Métricas de éxito)


---
_Generated by [Claude Code](https://claude.ai/code)_
