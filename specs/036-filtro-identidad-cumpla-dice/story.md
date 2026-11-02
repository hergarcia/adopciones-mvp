## Historia
**Como** persona que busca adoptar y quiere pedirle un animal solo a quien verificó su identidad
**quiero** que el listado nunca diga que el filtro está puesto cuando no lo está, que el correo de las 8
me traiga lo que pedí con ese filtro y que el sitio me confirme cuando guardé un aviso **para** creerle
al filtro y esperar acá a una persona verificada en vez de volver al grupo.

## Contexto
La aceptación de #285 (2026-11-02) dejó anotadas tres fallas medianas en el filtro «Solo de quien
verificó su identidad» y sus avisos:
- Si falla el pedido al marcar el filtro, la casilla queda marcada, aparece «Sacar los filtros» y el
  enlace lo lleva puesto, pero se siguen viendo los animales de antes, también los de quien tiene solo
  el teléfono. Quien no lee el aviso puede pedir un animal creyendo que la persona está verificada, que
  es justo la confianza que pone a prueba docs/03 §Hipótesis.
- Quien tiene «Perros en Montevideo» y el mismo aviso con el filtro nunca ve en el correo la parte «de
  quien verificó su identidad»: cada animal va en el aviso más viejo y el del filtro queda vacío. Puede
  pensar que no anda y borrarlo, y la lectura 12 de docs/03 §Métricas de éxito pierde justo a quien
  eligió esperar a una persona verificada.
- Con la sesión abierta, al marcar filtros en la página y tocar «Avisame cuando haya uno así», el aviso
  se guarda pero la pantalla no confirma nada y el botón sigue ahí.

Le gana al traspaso del chip (trámite sin averiguar), al recordatorio de solicitudes y a cargar un
animal desde uno anterior (docs/03 §4 espera el dato de la beta) y a la mayúscula de «La camada» en
Borrar (no enseña nada): es poco trabajo y hace que la lectura 12, la respuesta más directa del lado
de quien adopta, mida lo que la gente eligió y no una falla.

## Alcance
- Incluye: el listado, cuando no puede traer los animales de un filtro recién marcado, vuelve a mostrar
  marcados los filtros con los que se ven los animales, con su enlace y su «Sacar los filtros», y el
  aviso de que no se pudo; vale para cualquier filtro del listado, el de identidad incluido · en el
  correo de las 8, un animal o una camada que coincide con un aviso con el filtro y con otro sin él va
  en la parte del aviso con el filtro · después de guardar un aviso con filtros marcados en la página,
  la misma confirmación que ya aparece en los otros casos, «Te vamos a avisar por correo.» con el
  enlace a «Mis avisos», también cuando ya lo tenía o llegó al máximo.
- No incluye (explícito): cambiar qué deja ver el filtro, sus opciones o dónde aparece · cambiar el
  tope de 3 avisos, la hora del correo, cuántos animales lleva cada parte o cómo se escribe el nombre de
  un aviso · avisar dos veces el mismo animal · cambiar qué cuenta como nuevo para un aviso (#265) ·
  que el listado reintente solo un pedido que falló · cambiar «Mis avisos» · el filtro en la portada, el perfil o los
  sugeridos.

## Reglas de negocio
- El listado nunca muestra un filtro marcado, ni lo lleva en su enlace, si los animales a la vista no lo
  cumplen.
- Si el pedido falla, quedan marcados los filtros que tenía el listado que se ve; si no tenía ninguno,
  no aparece «Sacar los filtros».
- Elegir el filtro de identidad se sigue contando cuando la persona lo marca, aunque después el listado
  no cargue, como hoy: lo que la lectura 12 mira es la elección.
- Cada animal o camada sigue yendo una sola vez por correo (#265). Si coincide con varios avisos de la
  persona, va en uno con el filtro de identidad; entre varios con el filtro, o si ninguno lo tiene, en
  el más viejo, como hoy.
- Una parte del correo que se queda sin animales no aparece, como hoy. El asunto y el título cuentan a
  cada animal una vez, como desde #267.
- La confirmación de un aviso guardado es la misma con los filtros que vinieron en el enlace y con los
  que se marcaron en la página. Cambiar los filtros después vuelve a mostrar «Avisame cuando haya uno
  así» para la nueva combinación.

## Criterios de aceptación
### Camino feliz
- **Dado** que Bruno ve todos los animales, entre ellos a Luna de Rita, que tiene solo el teléfono
  verificado, y se corta la conexión **cuando** marca «Solo de quien verificó su identidad» **entonces**
  ve el aviso de que no se pudo, la casilla desmarcada, el enlace del listado sin el filtro, sin «Sacar
  los filtros», y a Luna en el listado.
- **Dado** que Bruno tiene «Perros en Montevideo» y, más nuevo, el mismo aviso con «Solo de quien
  verificó su identidad», y ayer después de las 8 Carla, con la identidad verificada, publicó a Tobi y
  Rita publicó a Rulo, los dos perros en Montevideo **cuando** son las 8 de la mañana **entonces** le
  llega un correo con Tobi en la parte «Perros en Montevideo, de quien verificó su identidad» y Rulo en
  la parte «Perros en Montevideo», y el asunto cuenta 2.
- **Dado** que Bruno entró con su cuenta, abrió el listado sin filtros y marcó «perro» y «Solo de quien
  verificó su identidad» en la página **cuando** toca «Avisame cuando haya uno así» **entonces** en lugar
  del botón ve «Te vamos a avisar por correo.» con el enlace a «Mis avisos», y ahí está el aviso.

### Casos borde
- **Dado** que Bruno ya filtraba por «Montevideo» y se corta la conexión **cuando** marca «perro»
  **entonces** queda marcado solo «Montevideo», con «Sacar los filtros», y se ven los animales de
  Montevideo de antes.
- **Dado** que los dos animales nuevos que coinciden con los dos avisos de Bruno son de quien tiene la
  identidad verificada **cuando** sale el correo **entonces** trae solo la parte con el filtro, con los
  dos, y no una parte vacía de «Perros en Montevideo».
- **Dado** que Bruno tiene «Perros de quien verificó su identidad» y, más nuevo, «Perros en Montevideo,
  de quien verificó su identidad», y Carla publicó un perro en Montevideo **cuando** sale el correo
  **entonces** el perro va una sola vez, en el aviso más viejo.
- **Dado** que Bruno marcó en la página filtros de un aviso que ya tiene **cuando** toca «Avisame cuando
  haya uno así» **entonces** ve «Ya tenés este aviso.» con el enlace a «Mis avisos», y no se crea otro.
- **Dado** que Bruno guardó un aviso y ve la confirmación **cuando** marca otro filtro **entonces** vuelve
  a ver «Avisame cuando haya uno así» para la nueva combinación.

### Errores y rechazos
- **Dado** que se cortó la conexión **cuando** Bruno toca «Avisame cuando haya uno así» después de marcar
  filtros en la página **entonces** ve «No pudimos crear el aviso. Probá de nuevo.» y el botón sigue a
  mano.
- **Dado** que Bruno tiene 3 avisos y marcó filtros en la página **cuando** toca «Avisame cuando haya
  uno así» **entonces** ve que llegó al máximo de 3 con el enlace para borrar uno en «Mis avisos».
- **Dado** que alguien abre un enlace del listado con el filtro y el sitio no responde **cuando** se
  carga la pantalla **entonces** ve el error del listado con «Probar de nuevo», sin animales que digan
  cumplir el filtro.

## Pantallas
- **Listado:** cuando falla el pedido de un filtro, los filtros marcados, el enlace y «Sacar los
  filtros» vuelven a los del listado que se ve, con el aviso de que no se pudo. Después de guardar un
  aviso, la confirmación ocupa el lugar del botón, junto al total o en el vacío, como ya pasa cuando se
  vuelve de entrar. Vacío, cargando y error: los de hoy.
- **Correo de avisos:** la parte con el filtro aparece cuando tiene animales nuevos de quien verificó su
  identidad, aunque otro aviso más viejo también los traiga. Sin animales nuevos en ninguna parte, no
  sale correo, como hoy.

## Datos personales
No aplica: no se pide ni se guarda nada nuevo y nadie ve algo que hoy no ve. El correo sigue llevando
solo lo que el listado ya muestra a cualquiera.

## Medición
No se agrega ningún momento. Elegir el filtro, crear un aviso y mandar el correo de avisos se cuentan
como hoy. Lo que cambia es que la parte con el filtro llega a quien la pidió, así que las fichas
abiertas desde esos correos empiezan a existir para la lectura 12 de docs/03 §Métricas de éxito.

## Dependencias
- #285 el filtro y sus avisos · #265 avisos por correo · #267 el conteo del correo · #57 listado y
  filtros · docs/03 §3 y §Métricas de éxito.

## Decisiones del enjambre
- **Decisión (2026-11-02, product-owner):** se suman las tres fallas que dejó la aceptación de #285
  como historia propuesta por Producto al terminarse el mapa. Motivo: el filtro es la respuesta más
  directa de quien adopta a docs/03 §Hipótesis, y mientras diga que está puesto cuando no lo está, o el
  correo esconda la parte con el filtro, la lectura 12 mide la falla y no la elección. (docs/03 §3)
- **Decisión (2026-11-02, product-owner):** un animal que coincide con un aviso con el filtro de
  identidad y con otro sin él va en la parte del aviso con el filtro; entre avisos con el filtro, en el
  más viejo. Motivo: quien guardó ese aviso pidió expresamente esperar a una persona verificada, y es la
  parte que le dice que el aviso anda; ir dos veces rompería lo que #265 decidió (avisar dos veces lo
  mismo hace que dejen de abrir los correos). (docs/03 §3)
- **Decisión (2026-11-02, product-owner):** cuando falla el pedido, vuelven los filtros anteriores para
  cualquier filtro del listado, no solo el de identidad. Motivo: «perro» marcado con gatos a la vista
  engaña igual, y la regla «el listado nunca dice un filtro que los animales no cumplen» es una sola.
  (docs/03 §3)


---
_Generated by [Claude Code](https://claude.ai/code)_
