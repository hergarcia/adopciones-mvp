## Historia
**Como** persona que pidió verificar su identidad y fue rechazada más de una vez el mismo día
**quiero** ver en el estado de mi pedido el motivo y el consejo del último rechazo **para** corregir
lo que de verdad falló en el próximo intento y no gastar el que me queda arreglando otra cosa.

## Contexto
Seguimiento de #11, encontrado en su aceptación. Hoy, con dos o más rechazos el mismo día, el estado
del pedido y la pantalla de «Sin intentos» muestran el motivo y el consejo del **primero**, mientras
el correo dice el correcto. Quien sigue el consejo de la pantalla repite el error que de verdad la
frenó y puede quemar su último intento: queda 30 días sin poder pasar a nivel 2.

Pasa el umbral de seguimiento (docs/09 §Umbral) porque corta un paso de la verificación, y mueve una
métrica de la hipótesis (docs/03 §Métricas de éxito): los adoptantes que completan el nivel 2 cuando
se les pide. Un rescatista que avisa «verificate» y ve a la persona trabada un mes vuelve a WhatsApp.
Las limitaciones KL-11-6 y KL-11-7 quedaron aceptadas a la espera de esta historia.

## Alcance
- Incluye: el estado del pedido muestra siempre el motivo y el consejo del rechazo más reciente,
  aunque haya varios el mismo día · la pantalla de «Sin intentos» muestra el motivo y el consejo del
  último rechazo · lo que dice la pantalla coincide con el correo de ese mismo rechazo · al revisar
  un pedido nuevo, quien administra ve los rechazos anteriores del más reciente al más viejo, también
  dentro de un mismo día.
- No incluye (explícito): cambiar la cantidad de intentos, el plazo de 30 días, la lista de motivos
  o los consejos · cambiar el correo del rechazo · mostrarle a la persona la lista de todos sus
  rechazos anteriores · guardar algo más de cada rechazo que el día y el motivo.

## Reglas de negocio
- «El último rechazo» es el último que resolvió quien administra, aunque haya otro el mismo día.
- El motivo y el consejo que se muestran salen siempre del mismo rechazo: nunca el motivo de uno con
  el consejo de otro.
- La cuenta de intentos no cambia: se siguen contando los rechazos de los últimos 30 días, y la
  fecha hasta la que no se puede pedir de nuevo es la que ya calcula #11.
- De cada rechazo siguen quedando solo el día y el motivo durante 30 días (#11, decisión de Hernán
  en #37). Saber cuál fue el último no agrega ningún dato sobre la persona.

## Criterios de aceptación
### Camino feliz
- **Dado** que me rechazaron dos veces el mismo día, primero por «no se lee» y después por «no
  coincide», **cuando** miro el estado de mi pedido **entonces** veo «no coincide» con su consejo y
  que me queda 1 intento.
- **Dado** que me rechazaron por tercera vez en 30 días y el tercer rechazo fue el mismo día que
  otro **cuando** veo la pantalla de «Sin intentos» **entonces** veo el motivo y el consejo del
  tercero y la fecha desde la que puedo volver a pedirlo.
- **Dado** cualquier rechazo **cuando** comparo la pantalla con el correo que me llegó por ese
  rechazo **entonces** dicen el mismo motivo y el mismo consejo.

### Casos borde (al menos 3)
- **Dado** que me rechazaron dos veces el mismo día por el mismo motivo **cuando** miro el estado
  **entonces** veo ese motivo una sola vez, con su consejo, y que me queda 1 intento.
- **Dado** que me rechazaron tres veces el mismo día con tres motivos distintos **cuando** veo la
  pantalla de «Sin intentos» **entonces** veo el motivo y el consejo del tercero, no de los otros.
- **Dado** que me rechazaron en días distintos **cuando** miro el estado **entonces** veo el motivo
  y el consejo del rechazo del día más reciente, como hasta ahora.
- **Dado** que después de dos rechazos del día pedí de nuevo **cuando** miro el estado **entonces**
  veo que mi pedido está en revisión, sin el motivo de ningún rechazo anterior.
- **Dado** que administro el sitio y una persona que tuvo dos rechazos el mismo día pide de nuevo
  **cuando** abro su pedido **entonces** veo sus rechazos del más reciente al más viejo, el del
  mismo día en el orden en que los resolvimos.

### Errores y rechazos
- **Dado** que el correo del último rechazo no me llegó **cuando** miro el estado de mi pedido
  **entonces** veo igual el motivo y el consejo de ese último rechazo.
- **Dado** que no ingresé **cuando** intento ver el estado de un pedido **entonces** se me pide
  ingresar y al hacerlo vuelvo a mi estado.
- **Dado** que ingresé con otra cuenta **cuando** intento ver el estado del pedido de otra persona
  **entonces** no veo sus rechazos, sus motivos ni sus consejos.

## Pantallas
- **Estado de mi pedido** (de #11): el rechazo más reciente con su motivo, su consejo y los intentos
  que quedan. Vacío: si nunca pedí, explica para qué sirve el nivel 2 y ofrece empezar, como hoy.
- **Sin intentos** (de #11): el motivo y el consejo del último rechazo y desde qué fecha se puede
  pedir de nuevo. Vacío: no aplica.
- **Cola de revisión** (de #11): los rechazos anteriores de la persona, del más reciente al más
  viejo. Vacío: sin rechazos en los últimos 30 días, no muestra esa parte, como hoy.

## Datos personales
- No agrega datos ni cambia quién ve qué: de cada rechazo quedan el día y el motivo durante 30 días,
  que ve solo la persona dueña del pedido y quien administra, como en #11.

## Medición
- No agrega eventos. Se lee en los que ya registra #11: pedidos aprobados después de un rechazo y
  topes de intentos alcanzados, que son los que este arreglo debería mover.

## Dependencias
- #11 Verificación de identidad (cerrada).
- docs/03 §1 y §Métricas de éxito · docs/09 §Umbral de seguimiento · KL-11-6 y KL-11-7 en
  docs/known-limitations.md.

## Decisiones del enjambre
- **Decisión (2026-09-28, product-owner):** la revisión de quien administra también ordena los
  rechazos de un mismo día, del más reciente al más viejo. Motivo: es la misma falla vista del otro
  lado; quien revisa un tercer pedido necesita saber qué se le dijo la última vez para no rechazar
  por lo mismo sin mirar, y no agrega ningún dato. Va a docs/03 §1.

