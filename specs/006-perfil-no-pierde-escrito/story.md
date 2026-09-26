Seguimiento de #9 (US4-AS4, severidad alta). Suma KL-024, que tiene la misma raíz.

## Historia
**Como** persona que completa o edita su perfil desde el celular **quiero** que lo que escribí no se
pierda si se corta la conexión al guardar o si la página se recarga **para** terminar el alta sin
empezar de nuevo y llegar a verificarme.

## Contexto
La historia #9 prometía que un guardado que falla por la conexión lo dice, conserva lo escrito y
deja reintentar. En la aceptación falló: sin conexión, tanto en el alta como al editar, aparece
«Algo se rompió» y se pierde todo; al editar, además, aparece «No pudimos traer tu perfil». Aparte,
al recargar a mitad del alta solo sobrevive el nombre: el departamento y la localidad hay que
elegirlos de nuevo (KL-024, que pedía reabrirse cuando se arreglara esto).

El alta es la puerta de la verificación: sin perfil no se verifica el teléfono ni la identidad. Los
rescatistas cargan desde el celular, muchas veces con señal que va y viene. Una pantalla de error
que borra lo escrito es fricción que no compra ninguna confianza, y quien la sufre vuelve a
Facebook antes de llegar a la verificación que queremos medir (docs/03 §Hipótesis). Un alta que
vuelve a pedir lo que la persona ya escribió «se siente precaria» (docs/11 §Producto).

## Alcance
- Incluye: el aviso claro de que no se guardó porque no hay conexión, en el alta y al editar el
  perfil · conservar en pantalla todo lo escrito, foto elegida incluida, después de un guardado que
  falla · reintentar con lo mismo, sin volver a cargarlo · conservar nombre, departamento, localidad
  y la marca de rescatista o refugio al recargar o volver a mitad del alta en el mismo navegador ·
  que el alta terminada se cuente una sola vez aunque se haya reintentado.
- No incluye (explícito): guardar solo cuando vuelve la conexión, sin que la persona toque nada ·
  que el sitio funcione sin conexión · conservar la foto elegida después de recargar la página ·
  retomar lo escrito desde otro dispositivo · otros formularios del sitio (verificar teléfono ya
  maneja su propio corte) · el foco en el primer campo que falta (KL-026).

## Reglas de negocio
- Un guardado que no llega nunca borra lo que la persona escribió: la pantalla queda como estaba,
  con un aviso de que no se guardó y por qué.
- El aviso distingue dos casos: no hay conexión, o el sitio no respondió. En los dos se ofrece
  reintentar. Un dato inválido sigue mostrándose en su campo, como hasta ahora, no como falla de
  conexión.
- Reintentar manda exactamente lo que está en pantalla; lo que la persona cambió mientras tanto
  también va.
- Lo escrito y no guardado vive solo en el navegador de la persona, y se borra al guardar bien, al
  cerrar sesión o al borrar la cuenta.
- Si el guardado sí llegó aunque la respuesta se perdió, reintentar no crea nada dos veces: el
  perfil queda con lo último que se mandó y el alta se cuenta una vez.

## Criterios de aceptación
### Camino feliz
- **Dado** que completo mi perfil en el alta y se corta la conexión **cuando** toco guardar
  **entonces** veo que no se guardó porque no hay conexión, y mi nombre, mi foto, mi departamento,
  mi localidad y la marca de rescatista o refugio siguen en pantalla.
- **Dado** que vuelve la conexión **cuando** toco reintentar **entonces** el perfil se guarda con lo
  que había escrito, se me confirma y sigo al próximo paso del alta.
- **Dado** que edito mi perfil y se corta la conexión **cuando** toco guardar **entonces** veo el
  mismo aviso, lo que cambié sigue ahí y no veo «Algo se rompió» ni «No pudimos traer tu perfil».
- **Dado** que elegí departamento y localidad en el alta **cuando** recargo la página o vuelvo a
  ella en el mismo navegador **entonces** el nombre, el departamento, la localidad y la marca de
  rescatista o refugio siguen elegidos.

### Casos borde (al menos 3)
- **Dado** que el guardado llegó pero la respuesta se perdió **cuando** reintento **entonces** se
  me confirma que está guardado, el perfil no queda duplicado y el alta terminada se cuenta una vez.
- **Dado** que un guardado falló **cuando** cambio un campo y reintento **entonces** se guarda lo que
  está en pantalla, con el cambio.
- **Dado** que un guardado falló **cuando** intento salir de la pantalla **entonces** se me avisa que
  hay cambios sin guardar, como con cualquier cambio sin guardar.
- **Dado** que reintento y sigue sin conexión **cuando** toco reintentar otra vez **entonces** veo
  un solo aviso, no uno por cada intento, y nada se pierde.
- **Dado** que empecé el alta, recargué y después cerré sesión **cuando** otra persona entra desde
  ese navegador **entonces** su formulario arranca sin nada de lo mío.

### Errores y rechazos
- **Dado** que hay conexión pero el sitio no responde **cuando** toco guardar **entonces** veo que
  no se pudo guardar y que puedo probar de nuevo, con lo escrito intacto.
- **Dado** que dejé un campo obligatorio vacío y además no hay conexión **cuando** toco guardar
  **entonces** veo primero qué falta completar, sin mandar nada.
- **Dado** que el navegador no deja guardar nada localmente **cuando** recargo a mitad del alta
  **entonces** el formulario arranca vacío, sin error, como desde otro dispositivo.

## Pantallas
- **Completar perfil (alta)**: suma el aviso de que no se guardó, con su motivo y la acción de
  reintentar, junto al botón de guardar. Vacío: no aplica, es un formulario.
- **Mi perfil (editar)**: el mismo aviso, en el mismo lugar. Vacío: no aplica.

## Datos personales
- Lo escrito y no guardado (nombre, departamento, localidad, marca de rescatista o refugio) queda
  solo en el navegador de la persona, hasta que se guarda, cierra sesión o borra la cuenta. La foto
  elegida no se guarda en el navegador: vive mientras la pantalla está abierta. No se manda nada
  nuevo a ningún lado.

## Medición
- Guardados del perfil que fallan, por motivo (sin conexión, el sitio no respondió), en el alta y
  al editar, y cuántos se completan después de reintentar. Sin nombre, dirección ni ningún dato de
  la persona, como los eventos de #9. «Creación de cuenta terminada» se dispara una sola vez por
  cuenta.

## Dependencias
- #9 Registro e ingreso (cerrada).
- docs/03 §1 · docs/03 §Hipótesis · docs/11 §Producto · KL-024 y KL-026 de las limitaciones
  conocidas.

## Decisiones del enjambre
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

