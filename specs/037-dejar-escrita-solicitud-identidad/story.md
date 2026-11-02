## Historia
**Como** persona que quiere adoptar un animal que pide identidad verificada **quiero** dejar escrita
mi solicitud mientras revisan mi cédula **para** que le llegue sola a quien lo publicó cuando me
aprueben, sin tener que acordarme de volver dos días después.

## Contexto
Hoy, quien toca «Quiero adoptar» en un animal que pide nivel 2 manda la cédula y la selfie, espera
hasta 2 días la revisión a mano y, cuando le llega el correo, tiene que volver al animal y recién
ahí escribir el cuestionario. En el grupo de Facebook, en cambio, escribe en el momento. La lectura 2
de docs/03 §Métricas de éxito («nivel 2 cuando se lo exigen», menos de 30 % es fricción mal
calibrada) hoy cuenta como perdida a la persona que se verificó y no volvió. No distingue a quien no
quiso mostrar la cédula de quien se enfrió esperando. Con la solicitud escrita en el momento, la
espera deja de costar una vuelta y la lectura mide la verificación, no la memoria.

Le gana al recordatorio de solicitudes sin responder (docs/03 §4 lo deja para cuando la beta muestre
solicitudes olvidadas), al traspaso del chip (docs/05: no lee nada de la verificación) y al hogar de
tránsito (es otro producto): es la que más aclara la pregunta de la hipótesis por el trabajo que pide.

## Alcance
- Incluye: ofrecer dejar escrita la solicitud a quien tiene su pedido de identidad en revisión, en
  la pantalla de un animal o una cría que pide identidad verificada · el cuestionario de siempre,
  con otro botón · el estado «Espera tu identidad» en «Mis solicitudes», con retirarla · que salga
  sola al aprobarse la identidad · qué pasa si la identidad se rechaza o el pedido vence, si el animal
  deja de recibir solicitudes o si pasa el plazo · lo que dicen los correos de resultado de la
  identidad que ya existen · los momentos que se miden y cómo se leen en docs/03 §Métricas de éxito.
- No incluye (explícito): cambiar cómo se revisa la identidad, cuánto tarda o sus topes · dejar
  escrita una solicitud a un animal que pide solo el teléfono, o antes de mandar el pedido de
  identidad · dejar escrita una solicitud sin el teléfono verificado · editar una solicitud que
  espera (se retira y se escribe de nuevo) · que salga antes si quien publicó deja de pedir la
  identidad: sigue esperando la aprobación · correos nuevos · que quien publicó vea que hay
  solicitudes esperando · cambiar el cuestionario.

## Reglas de negocio
- La opción aparece solo cuando la persona tiene el teléfono verificado y un pedido de identidad en
  revisión. La persona ya sabe que el animal pide identidad antes de escribir nada (se mantiene la
  decisión del 2026-09-27 sobre el nivel mínimo).
- Una solicitud que espera ocupa uno de los 3 lugares de solicitudes activas desde que se deja
  escrita. No se puede dejar otra para el mismo animal o la misma cría.
- Quien publicó no ve nada de una solicitud que espera: ni la solicitud, ni las respuestas, ni que
  existe. Tampoco suma en los números de «Mis animales».
- Sale sola en el momento en que se aprueba la identidad, si el animal sigue recibiendo solicitudes.
  Desde ahí es una solicitud como cualquier otra: llega a «Solicitudes recibidas» con la fecha en que
  salió, avisa por correo con la regla de siempre (no se repite si quien publicó ya tiene nuevas sin
  abrir de ese animal) y el tiempo de respuesta se cuenta desde que salió.
- Una misma aprobación manda todas las solicitudes que esperaban a esa persona.
- Si la identidad se rechaza o el pedido vence, la solicitud sigue esperando: sale si un pedido nuevo
  se aprueba dentro de los 14 días desde que se escribió.
- Una solicitud que espera no sale si: pasan 14 días desde que se escribió, la persona la retira, el
  animal se adopta o se borra, se cierra su publicación, quien publicó bloquea a la persona, la cuenta
  de la persona se suspende o la persona llega al tope de 3 pedidos de identidad rechazados en 30
  días. Si al aprobarse la identidad el animal está en pausa o vencido, sigue esperando dentro de los
  mismos 14 días y sale si vuelve a recibir solicitudes.
- Una solicitud que no salió queda en «Cerradas y retiradas» como «No salió», con el motivo, sin las
  respuestas. Los motivos se dicen con los textos de siempre: el de una persona bloqueada es que el
  animal ya no recibe solicitudes (decisión del 2026-10-06).
- El contacto sigue revelándose solo cuando la solicitud se acepta.

## Criterios de aceptación
### Camino feliz
- **Dado** que mandé mi pedido de identidad y abro a Tobi, que pide identidad verificada **cuando**
  toco «Dejar escrita mi solicitud», contesto el cuestionario y toco «Dejarla lista» **entonces** veo
  que sale sola cuando aprueben mi identidad, y en «Mis solicitudes» Tobi figura entre las activas
  como «Espera tu identidad», contando en «1 de 3 solicitudes activas».
- **Dado** que dejé escrita una solicitud para Tobi **cuando** quien publicó a Tobi abre «Solicitudes
  recibidas» **entonces** no la ve, y los números de Tobi en «Mis animales» no cambian.
- **Dado** que dejé escritas solicitudes para Tobi y para una cría de la camada de Luna **cuando**
  aprueban mi identidad **entonces** las dos pasan a «Esperando respuesta» con la fecha de ese día, el
  correo de identidad aprobada dice que le llegaron a quien publicó y lleva a «Mis solicitudes», y
  cada rescatista recibe la solicitud como cualquier otra.

### Casos borde (al menos 3)
- **Dado** que ya tengo 3 solicitudes activas, contando las que esperan **cuando** quiero dejar
  escrita otra **entonces** me frena el límite de siempre, con la opción de retirar una.
- **Dado** que rechazaron mi identidad y mi solicitud para Tobi la escribí hace 3 días **cuando** abro
  «Mis solicitudes» **entonces** sigue como «Espera tu identidad», dice hasta qué día puedo mandar las
  fotos de nuevo para que salga, y el correo del rechazo dice lo mismo.
- **Dado** que mi solicitud para Tobi espera **cuando** pasan 14 días desde que la escribí sin que se
  apruebe mi identidad **entonces** no sale, figura en «Cerradas y retiradas» como «No salió» y ya no
  ocupa un lugar.
- **Dado** que mi solicitud para Tobi espera y Tobi se adopta **cuando** abro «Mis solicitudes»
  **entonces** figura como «No salió» con «Tobi encontró hogar.», y si después aprueban mi identidad no
  le llega nada a quien lo publicó.
- **Dado** que aprueban mi identidad cuando Tobi está en pausa **cuando** quien lo publicó lo reanuda
  dentro de los 14 días **entonces** la solicitud sale ese día; si no lo reanuda, no sale.
- **Dado** que la identidad se aprueba mientras estoy escribiendo el cuestionario **cuando** toco el
  botón **entonces** la solicitud se manda como siempre.

### Errores y rechazos
- **Dado** que no tengo un pedido de identidad en revisión **cuando** abro a Tobi **entonces** no veo
  «Dejar escrita mi solicitud», solo el camino a verificar mi identidad.
- **Dado** que ya tengo una solicitud, activa o esperando, para Tobi **cuando** intento dejar otra
  **entonces** veo la que tengo y no se crea una segunda.
- **Dado** que llegué al tope de 3 pedidos de identidad rechazados en 30 días **cuando** abro «Mis
  solicitudes» **entonces** las que esperaban figuran como «No salió» y ya no ocupan lugar.
- **Dado** que se corta la conexión al tocar «Dejarla lista» **cuando** reintento **entonces** queda
  una sola solicitud esperando y lo escrito no se pierde.

## Pantallas
- **Animal o cría que pide identidad, con el pedido en revisión:** debajo de «Mandaste tu pedido de
  identidad el …», «Dejar escrita mi solicitud» y una línea que dice que sale sola cuando aprueben la
  identidad y que hasta entonces quien publicó no la ve. Si ya dejó una para ese animal, en su lugar
  dice que espera y lleva a «Mis solicitudes».
- **Cuestionario:** las mismas preguntas; el botón dice «Dejarla lista» y arriba, una línea con lo
  mismo. Al terminar, la confirmación dice que sale sola y lleva a «Mis solicitudes».
- **Mis solicitudes:** el sello «Espera tu identidad» entre las activas, con «Retirar», y la fecha
  límite cuando la identidad se rechazó o el pedido venció. El sello «No salió» con su motivo entre
  las cerradas. Sin solicitudes, el estado vacío de siempre.
- **Correos de resultado de la identidad (aprobada, rechazada, vencida):** si había solicitudes
  esperando, nombran los animales y dicen si salieron o hasta qué día esperan. Sin solicitudes que
  esperan, quedan como hoy.

## Datos personales
- Las respuestas del cuestionario se guardan desde que la persona deja escrita la solicitud, antes de
  que salga. Mientras espera, solo las ve quien la escribió: ni quien publicó ni quien administra.
- Si no sale, sus respuestas se borran ese mismo día; queda la línea en «Mis solicitudes» con el
  animal, el día y el motivo, como cualquier solicitud cerrada.
- Si sale, sigue las reglas de cualquier solicitud (docs/03 §4: las respuestas las ven quien solicitó y
  quien publicó, y se borran con la cuenta de quien solicitó).

## Medición
- Tres momentos nuevos, sin la persona: se dejó una solicitud esperando la identidad; salió sola al
  aprobarse; no salió, con el motivo (plazo, retirada, el animal dejó de recibir, tope de rechazos,
  cuenta suspendida).
- La que sale sola cuenta en la lectura 2 como solicitud mandada después de la identidad, marcada
  aparte de las que se mandan al volver, para comparar antes y después del día en que llega esta
  historia.
- La lectura nueva va en docs/03 §Métricas de éxito: de las veces que se ofreció dejarla escrita,
  cuántas se dejaron, cuántas salieron y por qué no salió el resto.

## Dependencias
- #11 · #59 · #63 · #65 · #206 · #234 · docs/03 §1, §4 y §Métricas de éxito

## Decisiones del enjambre
- **Decisión (2026-11-02, product-owner):** se suma dejar escrita la solicitud mientras se revisa la
  identidad, como feature nueva propuesta por Producto al terminarse el mapa. Motivo: es lo que más
  enseña de la hipótesis por el trabajo que pide; la lectura 2 hoy no separa a quien no quiso mostrar
  la cédula de quien se verificó y no volvió, y la espera de la revisión a mano es justo la fricción
  que el grupo de Facebook no tiene. (docs/03 §4 y §Hipótesis)
- **Decisión (2026-11-02, product-owner):** la opción aparece solo con el pedido de identidad ya
  mandado, en la pantalla que dice que el animal la pide. Motivo: mantiene la decisión del 2026-09-27
  de que nadie escriba el cuestionario sin saber el requisito, y no se ofrece a quien todavía no
  decidió mostrar la cédula, que es lo que la lectura 2 quiere medir. (docs/03 §4)
- **Decisión (2026-11-02, product-owner):** una solicitud que espera ocupa uno de los 3 lugares desde
  que se escribe. Motivo: si no ocupara lugar, la aprobación podría encontrar el límite lleno y la
  solicitud no saldría sin aviso; el límite sigue cortando la solicitud en serie. (docs/03 §4)
- **Decisión (2026-11-02, product-owner):** espera hasta 14 días desde que se escribe, también si la
  identidad se rechaza, el pedido vence o el animal está en pausa. Motivo: alcanza para un pedido que
  vence a los 7 días, un rechazo por una foto borrosa y un segundo pedido con su espera de hasta 2
  días; más tiempo deja respuestas guardadas de un interés que ya pasó. (docs/03 §1 y §4)
- **Decisión (2026-11-02, product-owner):** quien publicó no ve nada hasta que sale, y la fecha y el
  tiempo de respuesta se cuentan desde que salió. Motivo: quien rescata eligió pedir identidad y
  recibe solo a quien la tiene; contar desde que se escribió le cargaría días que no tuvo la
  solicitud, y la lectura 3 mediría la revisión en lugar de quien rescata. (docs/03 §4 y §Métricas de
  éxito)
- **Decisión (2026-11-02, product-owner):** si no sale, las respuestas se borran ese día y no se avisa
  con un correo nuevo. Motivo: entre dos opciones razonables va la que guarda menos (Ley 18.331), y los
  correos de resultado de la identidad ya dicen lo que pasa con la solicitud. (docs/03 §4)
- **Decisión (2026-11-02, product-owner):** la que sale sola cuenta en la lectura 2 como mandada
  después de la identidad, marcada aparte, y se suman tres momentos sin la persona. Motivo: completó el
  nivel 2 cuando se lo pidieron y su solicitud llegó; marcarla aparte deja comparar antes y después, y
  los motivos de lo que no salió dicen si el plazo o el animal se llevan a quien sí se verificó.
  (docs/03 §7 y §Métricas de éxito)


---
_Generated by [Claude Code](https://claude.ai/code)_
