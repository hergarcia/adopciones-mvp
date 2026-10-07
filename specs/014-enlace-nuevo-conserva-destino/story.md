## Historia
**Como** rescatista que tocó «Publicar un animal» en la portada y todavía no tenía sesión **quiero**
que, si el enlace del correo ya no sirve y pido otro desde esa misma pantalla, el nuevo me lleve a
publicar **para** no perder a dónde iba ni tener que volver a buscar el botón en mi primera vez.

## Contexto
Seguimiento de #61, encontrado en su aceptación (criterio US1-AS9 de la portada, severidad alta).
La portada promete que quien toca «Publicar un animal» sin sesión llega a publicar aunque el
ingreso se corte o el enlace venza. Hoy no pasa: si el enlace del correo ya no sirve (vencido, que
dura una hora; ya usado; reemplazado por otro más nuevo) y la persona sale de «El enlace no sirve»
con «Enviarme otro enlace» o con «Escribir mi correo», el nuevo enlace la deja en Mi perfil. Si es
su primera vez, completa el perfil y también termina en Mi perfil, sin rastro de lo que había ido a
hacer.

Pasa el umbral de seguimiento (docs/09 §Umbral) porque corta el primer paso de quien llega a
publicar: la persona que abrió el correo tarde es justo la rescatista nueva, que la portada trajo a
publicar y que ahora tiene que adivinar dónde estaba el botón. Mueve la primera métrica de docs/03
§Métricas de éxito (rescatistas que publican por su cuenta): una rescatista que cae en su perfil sin
saber qué sigue vuelve a publicar en Facebook.

## Alcance
- Incluye: las dos salidas de «El enlace no sirve» («Enviarme otro enlace» y «Escribir mi correo»)
  conservan el destino al que iba la persona · el enlace nuevo la lleva a ese destino · si es su
  primera vez, al completar el perfil sigue hacia ese destino · vale para cualquier destino del
  sitio al que la persona iba (publicar es el caso de la portada), con los mismos cuidados que ya
  tiene el ingreso de #9: solo destinos de este sitio.
- No incluye (explícito): cambiar el ingreso con Google, el texto o el diseño del correo, la
  duración del enlace (una hora) ni los motivos de «El enlace no sirve» · cambiar la verificación de
  teléfono que pide publicar (#10), que ya conserva el destino · recordar el destino entre
  dispositivos o días si la persona entra de nuevo desde cero, sin pasar por esa pantalla · cambiar
  a dónde llega quien entra sin un destino (Mi perfil, como hoy).

## Reglas de negocio
- El destino es el mismo que traía el enlace que no sirvió: «El enlace no sirve» no lo cambia ni lo
  inventa.
- Sin destino previo, todo sigue como hoy: la persona llega a Mi perfil.
- Un destino que no es una pantalla de este sitio se descarta y la persona llega a Mi perfil, como
  en #9.
- Publicar sigue exigiendo el teléfono verificado (#10): quien llega a publicar sin nivel 1 pasa
  primero por verificar su teléfono y después sigue a publicar, como hoy.
- No se guarda en la cuenta a dónde iba la persona: viaja con el pedido del enlace y se descarta al
  usarlo.

## Criterios de aceptación
### Camino feliz
- **Dado** que toqué «Publicar un animal» en la portada sin sesión y el enlace del correo venció
  **cuando** pido otro con «Enviarme otro enlace» y lo abro **entonces** llego a publicar un animal
  (o a verificar mi teléfono y después a publicar, si todavía no lo verifiqué).
- **Dado** que además es mi primera vez **cuando** abro el enlace nuevo y completo el perfil
  **entonces** sigo hacia publicar y no a Mi perfil.
- **Dado** que el enlace venció **cuando** elijo «Escribir mi correo», escribo mi dirección y abro
  el enlace que me llega **entonces** llego a publicar.

### Casos borde (al menos 3)
- **Dado** que pedí un enlace sin venir de ningún lado (desde «Entrar» en la cabecera) y venció
  **cuando** pido otro y lo abro **entonces** llego a Mi perfil, como hoy.
- **Dado** que el enlace que abrí ya se había usado **cuando** pido otro desde esa pantalla y lo
  abro **entonces** llego al destino al que iba.
- **Dado** que abro un enlace viejo después de haber pedido uno más nuevo **cuando** veo «El enlace
  no sirve» y abro el último que me llegó **entonces** llego al destino al que iba.
- **Dado** que pido otro enlace dos veces seguidas desde esa pantalla **cuando** abro el último
  **entonces** llego al destino al que iba.
- **Dado** que iba a una ficha de un animal y no a publicar **cuando** el enlace vence y pido otro
  **entonces** el nuevo me lleva a esa ficha.
- **Dado** que abro el enlace nuevo en otro teléfono o en otra ventana **cuando** entro **entonces**
  llego igual al destino al que iba.

### Errores y rechazos
- **Dado** que el destino del enlace no es una pantalla de este sitio **cuando** pido otro y lo
  abro **entonces** llego a Mi perfil y nunca a otro sitio.
- **Dado** que pedí demasiados enlaces seguidos **cuando** intento pedir otro desde esa pantalla
  **entonces** veo cuánto tengo que esperar, como hoy, y al pedirlo pasado ese tiempo el enlace
  conserva el destino.
- **Dado** que el correo no se pudo mandar **cuando** pido otro **entonces** veo el aviso de que no
  salió, como hoy, y al reintentar el destino se conserva.
- **Dado** que mi cuenta está suspendida **cuando** abro el enlace nuevo **entonces** veo la
  pantalla de cuenta suspendida, como hoy, y no llego a publicar.

## Pantallas
- **El enlace no sirve** (de #9): sin cambios visibles; sus dos salidas conservan el destino.
  Vacío: no aplica.
- **Completar el perfil** (de #9): sin cambios visibles; al terminar sigue al destino. Vacío: no
  aplica.
- **Escribir mi correo** y **Revisá tu correo** (de #9): sin cambios visibles. Vacío: no aplica.

## Datos personales
- No agrega datos ni cambia quién ve qué. Solo se recuerda a qué pantalla del sitio iba la persona,
  mientras dura el pedido del enlace; no queda en su cuenta.

## Medición
- No agrega eventos. Se lee en los que ya registran #9 y #61: los ingresos desde «Publicar un
  animal» de la portada que terminan en una publicación, que este arreglo debería mover.

## Dependencias
- #9 Registro e ingreso sin contraseña con perfil básico (cerrada).
- #61 Portada del sitio (cerrada).
- docs/03 §1 y §Métricas de éxito · docs/09 §Umbral de seguimiento.

## Decisiones del enjambre
- **Decisión (2026-10-07, product-owner):** el destino se conserva para cualquier pantalla del
  sitio a la que iba la persona, no solo para publicar, y por las dos salidas de «El enlace no
  sirve», también «Escribir mi correo». Motivo: es la misma promesa de #9 («no perdés a dónde
  ibas»); dejarla solo para publicar la rompería en cuanto M3 lleve a solicitar desde la ficha, y
  quien elige escribir su correo de nuevo iba al mismo lugar. Va a docs/03 §1.
- **Decisión (2026-10-07, product-owner):** a dónde iba la persona no se guarda en su cuenta; viaja
  con el pedido del enlace y se descarta al usarlo. Motivo: entre recordarlo en la cuenta y no
  guardarlo, se elige lo que guarda menos (Ley 18.331), y alcanza para el caso. Va a docs/03 §1.

