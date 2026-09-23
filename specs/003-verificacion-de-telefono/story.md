## Historia
**Como** persona con cuenta **quiero** verificar mi teléfono con un código **para** poder publicar
un animal o solicitar una adopción, y que del otro lado sepan que soy alguien alcanzable.

## Contexto
El teléfono verificado es la puerta de entrada al producto: sin él no se publica ni se solicita
(docs/03 §1). Es el filtro más barato contra las cuentas descartables, que son el vehículo de las
estafas del tipo "pagá el flete y te lo mando" (docs/01 §Situación actual).

Aparece donde aporta valor y no antes: mirar animales es libre, verificarse es el precio de
participar (docs/01 §Verificación = fricción).

## Alcance
- Incluye: pedir un código de seis dígitos a un teléfono uruguayo y confirmarlo · reintentar y
  pedir un código nuevo · cambiar el teléfono y volver a verificarlo · el nivel 1 de verificación,
  que queda alcanzado cuando el correo y el teléfono están confirmados · el bloqueo de publicar y
  solicitar mientras no esté verificado, con el motivo a la vista.
- No incluye (explícito): mostrar el teléfono a otra persona · verificación de identidad con
  documento · el aval entre personas · teléfonos de otros países · elegir entre mensaje de texto y
  WhatsApp · llamada de voz como alternativa · verificar más de un teléfono por cuenta.

## Reglas de negocio
- Un teléfono verificado pertenece a una sola cuenta. Si ya está en otra, no se puede verificar.
- El código tiene seis dígitos, vence a los pocos minutos y sirve una sola vez.
- Después de varios intentos fallidos seguidos hay que pedir un código nuevo.
- Hay un tope de códigos por teléfono y por día: cada mensaje cuesta plata y es la vía de abuso más
  obvia.
- El teléfono no se le muestra a nadie más hasta que una solicitud sea aceptada, y eso pasa en otra
  historia. Acá solo se confirma que existe y es de quien dice.
- Cambiar el teléfono baja la cuenta a sin verificar hasta confirmar el nuevo.
- Sin teléfono verificado se puede mirar todo el sitio, pero publicar y solicitar quedan
  bloqueados, y la pantalla dice por qué y qué hacer.

## Criterios de aceptación
### Camino feliz
- **Dado** que tengo cuenta y todavía no verifiqué el teléfono **cuando** escribo mi número y pido
  el código **entonces** me llega un mensaje y veo dónde escribirlo.
- **Dado** que recibí el código **cuando** lo escribo bien **entonces** mi cuenta queda en nivel 1 y
  vuelvo a lo que estaba intentando hacer.
- **Dado** que tengo el teléfono verificado **cuando** miro mi perfil **entonces** veo que está
  verificado y desde cuándo.
- **Dado** que quiero cambiar mi número **cuando** cargo el nuevo y lo confirmo **entonces** el
  anterior deja de estar asociado a mi cuenta.

### Casos borde (al menos 3)
- **Dado** que el código venció **cuando** lo escribo **entonces** se me dice que venció y puedo
  pedir uno nuevo sin volver a cargar el número.
- **Dado** que pedí un código nuevo **cuando** escribo el anterior **entonces** no sirve: vale
  solamente el último.
- **Dado** que ya pedí varios códigos hoy **cuando** pido otro **entonces** se me dice cuándo voy a
  poder pedirlo de nuevo.
- **Dado** que el teléfono que cargo ya está verificado en otra cuenta **cuando** pido el código
  **entonces** se me dice que ese número ya está en uso y cómo seguir.
- **Dado** que empecé a cambiar de número y no confirmé el nuevo **cuando** vuelvo al sitio
  **entonces** sigo sin verificar y veo el número que quedó a medias, para terminar o cancelar.

### Errores y rechazos
- **Dado** que escribo un número que no tiene forma de teléfono uruguayo **cuando** pido el código
  **entonces** se me dice qué está mal y no se manda nada.
- **Dado** que escribo el código equivocado varias veces seguidas **cuando** insisto **entonces** se
  me pide pedir un código nuevo en vez de seguir probando.
- **Dado** que el mensaje no llega **cuando** espero **entonces** veo cuánto falta para poder pedir
  otro y qué revisar.
- **Dado** que intento publicar o solicitar sin el teléfono verificado **cuando** toco la acción
  **entonces** se me explica que hace falta verificar el teléfono y se me ofrece hacerlo ahí mismo.

## Pantallas
- **Verificar teléfono**: el campo del número, con el aviso de que el número no se muestra a nadie.
  Vacío: no aplica.
- **Escribir el código**: los seis dígitos, cuánto falta para poder pedir otro y a qué número se
  mandó. Vacío: no aplica.
- **Mi perfil**: pasa a mostrar el estado de verificación y desde cuándo, con la opción de cambiar
  el número. Vacío: si todavía no verificó, muestra el paso pendiente en vez de un espacio en
  blanco.
- **Aviso de verificación pendiente**: lo que se ve al intentar publicar o solicitar sin estar
  verificado, con el motivo y el camino. Vacío: no aplica.

## Datos personales
- Se guarda el teléfono y la fecha en que se verificó. Lo ve la propia persona y quien administre
  el sitio. No se le muestra a nadie más en esta historia. Borrar la cuenta lo borra.

## Medición
- Código pedido, código confirmado, intentos fallidos, tope diario alcanzado, teléfono cambiado, y
  cuántas personas abandonan entre pedir el código y confirmarlo.

## Dependencias
- #9 Registro e ingreso sin contraseña con perfil básico.
- docs/03 §1 · docs/01 §Verificación = fricción · docs/07 §El stack (el servicio de mensajes)

