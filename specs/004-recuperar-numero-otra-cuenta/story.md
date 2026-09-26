## Historia
**Como** persona que quiere verificar su celular **quiero** poder quedarme con mi número aunque
figure verificado en otra cuenta a la que no puedo entrar **para** no quedar afuera de publicar y
solicitar por un número que es mío.

## Contexto
Desde la historia #10, un número verificado pertenece a una sola cuenta. Hay dos casos en los que
eso deja afuera a quien de verdad tiene el número: la compañía reasignó el número y la cuenta vieja
es de otra persona, o la persona perdió el acceso al correo de su cuenta vieja. Hoy la pantalla
«Ese número está en otra cuenta» ofrece verificar otro número y explica cómo entrar con la otra
cuenta o borrarla; en esos dos casos no se puede ninguna de las dos.

Además, el dueño anterior de un número reasignado sigue figurando verificado con un número que ya
no es suyo. Desde M3 ese número se le mostraría a quien acepte una solicitud: sería el contacto de
una tercera persona.

Qué enseña sobre la hipótesis (docs/03 §Hipótesis): el teléfono es el primer peldaño de la
verificación, y una rescatista que cambió de chip y queda trabada ahí vuelve al grupo de Facebook
sin haber publicado nada. Pasa el umbral de seguimiento porque corta un paso de la verificación y
porque, desde M3, mostraría el contacto de alguien a quien no le corresponde (docs/09 §Umbral de
seguimiento). La historia #9 dejó «recuperar una cuenta cuyo correo ya no se controla» esperando a
que existiera el teléfono; esta historia no recupera esa cuenta, pero deja seguir con una nueva.

## Alcance
- Incluye: quedarse con un número verificado en otra cuenta, justo después de demostrar que se lo
  tiene en la mano · la confirmación que explica qué le pasa a la otra cuenta · que la cuenta
  anterior pierda el número, reciba un correo en ese momento y lo vea en su perfil al volver ·
  que «Ese número está en otra cuenta» ofrezca también entrar con la otra cuenta, que hoy solo
  explica (KL-028).
- No incluye (explícito): recuperar la cuenta vieja entera, con su nombre, sus datos o lo que
  tenga · volver a confirmar cada tanto un número ya verificado (lo decide la historia de M3 que
  revela el contacto, ver Decisiones) · qué pasa con publicaciones o solicitudes en curso de la
  cuenta anterior, que todavía no existen: la historia que las construya les aplica la misma regla
  que a una cuenta que cambió de número · verificación de identidad con documento · atención
  manual caso por caso · decirle a alguien qué cuenta tenía el número o quién se lo quedó.

## Reglas de negocio
- Quedarse con un número exige haber escrito bien un código mandado a ese número en los últimos
  10 minutos, el mismo que verificarlo. Si pasaron más, hay que pedir otro código.
- Quedarse con un número nunca pasa solo: la persona elige «Es mío y no puedo entrar a esa cuenta»
  y confirma, después de leer que la otra cuenta va a perder el número.
- La cuenta anterior pierde el número del todo: deja de estar asociado a ella y queda sin
  verificar, igual que una cuenta que nunca verificó. Si tenía un cambio de número a medias, lo
  conserva para terminarlo.
- Pedir el código para quedarse con un número cuenta para la espera de 60 segundos y el tope de 5
  códigos en 24 horas de la historia #10. No hay topes nuevos.
- Nada de una cuenta se le muestra a la otra: ni nombre, ni correo, ni fechas. El correo y el
  perfil de la cuenta anterior dicen que otra cuenta demostró tener el número, no cuál.
- Si la cuenta anterior vuelve a demostrar que tiene el número, puede quedárselo de vuelta por el
  mismo camino, y la otra recibe el mismo aviso.

## Criterios de aceptación
### Camino feliz
- **Dado** que escribí bien el código y el número figura en otra cuenta **cuando** elijo «Es mío y
  no puedo entrar a esa cuenta» y confirmo **entonces** mi cuenta queda en nivel 1 con ese número y
  sigo a lo que estaba intentando hacer, o a «Mi perfil» si no venía de ninguna acción.
- **Dado** que otra cuenta se quedó con mi número **cuando** pasa **entonces** me llega un correo
  que dice que mi teléfono quedó sin verificar porque otra cuenta demostró tenerlo, y cómo
  verificar otro número, sin decir qué cuenta fue.
- **Dado** que estoy en «Ese número está en otra cuenta» **cuando** la miro **entonces** tengo tres
  caminos a un toque: verificar otro número, entrar con la otra cuenta y quedarme con este número.

### Casos borde (al menos 3)
- **Dado** que la cuenta anterior perdió el número **cuando** vuelve a entrar **entonces** «Mi
  perfil» muestra que el teléfono quedó sin verificar, desde qué día y cómo verificarse de nuevo,
  sin datos de quien se quedó con el número.
- **Dado** que pasaron más de 10 minutos desde el código **cuando** confirmo que me quedo con el
  número **entonces** se me pide un código nuevo y la otra cuenta no cambia en nada.
- **Dado** que la cuenta anterior tenía un cambio de número a medias **cuando** pierde el número
  **entonces** queda sin verificar y puede terminar el cambio al número nuevo.
- **Dado** que la cuenta anterior vuelve a demostrar que tiene el número **cuando** se lo queda
  **entonces** vuelve a ella, y la otra recibe el correo y el aviso en su perfil.
- **Dado** que elijo verificar otro número o entrar con la otra cuenta **cuando** lo hago
  **entonces** la otra cuenta no cambia en nada.

### Errores y rechazos
- **Dado** que escribo mal el código **cuando** lo confirmo **entonces** veo el error de siempre y
  no aparece la opción de quedarme con el número.
- **Dado** que en la confirmación elijo volver **cuando** vuelvo **entonces** nada cambia y sigo
  viendo los tres caminos.
- **Dado** que ya pedí 5 códigos en las últimas 24 horas **cuando** quiero pedir otro para
  quedarme con el número **entonces** se me dice qué día y a qué hora voy a poder, en hora de
  Uruguay.
- **Dado** que se corta la conexión al confirmar **cuando** vuelvo a mirar **entonces** se me dice
  que no se pudo confirmar y veo el estado real: el número es mío o sigue en la otra cuenta.

## Pantallas
- **Ese número está en otra cuenta**: suma «Entrar con esa cuenta» y «Es mío y no puedo entrar a
  esa cuenta» junto a «Verificar otro número». Vacío: no aplica.
- **Quedarme con este número**: qué le pasa a la otra cuenta, confirmar o volver. Vacío: no aplica.
- **Mi perfil** de la cuenta que perdió el número: el teléfono sin verificar, desde qué día y por
  qué, con el acceso a verificar otro. Vacío: sin ese aviso, el paso pendiente de siempre.
- **Correo a la cuenta anterior**: qué pasó y cómo verificarse de nuevo. Vacío: no aplica.

## Datos personales
- Quien se queda con el número guarda lo mismo que en la historia #10: el teléfono y la fecha en
  que se verificó. La cuenta anterior deja de tener el número y guarda solo el día en que lo
  perdió, hasta que verifique otro o borre la cuenta. No queda ningún registro que una las dos
  cuentas: ni ellas ni quien administra pueden ver quién se quedó con el número de quién.

## Medición
- Cuántas veces se elige «Es mío y no puedo entrar a esa cuenta», cuántas se confirma y cuántas se
  abandona en la confirmación; cuentas que pierden el número y cuántas vuelven a verificar uno. El
  evento «Número en uso» de la historia #10 da el denominador.

## Dependencias
- #10 Verificación de teléfono · #9 Registro e ingreso sin contraseña.
- docs/03 §1 · docs/01 §Verificación = fricción · docs/known-limitations.md KL-028

## Decisiones del enjambre
- **Decisión (2026-09-25, product-owner):** quedarse con el número se ofrece en la misma pantalla
  de «número en uso», con el código que la persona acaba de escribir bien, en vez de mandar otro.
  Motivo: ya demostró tener el número en la mano; un segundo código es fricción y plata sin
  ninguna prueba nueva (docs/01 §Verificación = fricción). Va en docs/03 §1.
- **Decisión (2026-09-25, product-owner):** la cuenta anterior pierde el número del todo, se entera
  por correo en el momento y lo ve en su perfil, sin saber quién lo tiene. Motivo: si solo quedara
  sin verificar con el número guardado, la historia de M3 podría revelar el teléfono de otra
  persona; el correo llega a tiempo cuando el caso es un chip robado. Va en docs/03 §1.
- **Decisión (2026-09-25, product-owner):** no se vuelve a confirmar cada tanto un número
  verificado; la historia de M3 que revela el contacto decide si lo confirma antes de revelarlo.
  Motivo: confirmar cada tanto le cobra fricción a cada rescatista por un caso raro, y el daño
  aparece recién al revelar el contacto. Va en docs/03 §4.
- **Decisión (2026-09-25, product-owner):** no se guarda nada que una las dos cuentas; la anterior
  guarda solo el día en que perdió el número. Motivo: el mínimo de datos que alcanza para
  explicarle qué pasó (docs/01 §Legal / datos). Va en docs/03 §1.

