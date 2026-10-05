# Historia #13 — Reportar, bloquear y suspender

Milestone: M1 - Cuentas y confianza. Cuerpo verbatim del issue al 2026-10-05.

## Historia
**Como** persona que se topó con alguien que no debería estar acá **quiero** reportarlo y
bloquearlo, y **como** quien administra **quiero** suspender esa cuenta **para** que el distintivo
de verificación signifique algo también cuando falla.

## Contexto
Verificar no alcanza: una persona verificada puede ser un pésimo adoptante, y hay vendedores
disfrazados de rescatistas y gente que junta donaciones con fotos robadas (docs/01 §"Validación"
esconde el problema difícil, y §Legal / datos: "pensar qué pasa cuando alguien verificado resulta
ser un abusador"). Si no hay forma de avisar y de sacar a esa persona, el distintivo es una promesa
vacía, y un rescatista vuelve a lo que ya hace en Facebook y WhatsApp: escrachar en el grupo.

Por eso responde una parte de la hipótesis (docs/03 §Hipótesis): un rescatista se queda, y vuelve a
publicar por su cuenta (docs/03 §Métricas de éxito), si la verificación tiene consecuencias. Va en
este milestone y no en el panel de administración del final porque la confianza sin consecuencia no
es confianza, y porque quien prueba la beta tiene que tener dónde avisarnos desde el primer día.

Los animales ya se publican y se ven (#53, #57), y las dos historias dejaron para esta qué pasa con
los animales de una cuenta suspendida o bloqueada: sin eso, un vendedor suspendido sigue ofreciendo
animales en el listado.

## Alcance
- Incluye: reportar a una persona desde su perfil público, eligiendo un motivo y contando lo que
  quiera · bloquear a una persona desde su perfil público · ver y deshacer mis bloqueos · la lista
  de reportes sin resolver para quien administra, con el historial de la persona reportada ·
  cerrar un reporte sin medidas o suspendiendo la cuenta · suspender a una persona desde su perfil
  público, para quien administra · la lista de cuentas suspendidas, con la opción de reactivarlas ·
  lo que ve una persona suspendida cuando entra · el correo que avisa la suspensión y la
  reactivación · que los animales de una cuenta suspendida salgan del listado y de sus fichas
  mientras dure la suspensión · que quien bloquea deje de ver los animales de la persona bloqueada.
- No incluye (explícito): reportar una publicación de un animal: se reporta a quien la publicó
  (#59) · lo que la suspensión y el bloqueo hacen con las solicitudes, que lo dicen #63 y #65 ·
  avisarle a quien reportó cómo terminó su reporte · apelar una suspensión desde el sitio (se
  escribe al correo de ayuda) · suspensiones por tiempo que se levanten solas · avisos automáticos
  por comportamiento sospechoso · designar a quien administra desde el sitio · liberar a mano un
  número retenido · el panel de administración consolidado, que llega en M4 (#73) · denunciar a
  las autoridades.

## Reglas de negocio
- Reportar y bloquear exige haber ingresado. Nadie se reporta ni se bloquea a sí mismo, y no se
  reporta ni se bloquea a una cuenta suspendida.
- Se reporta a una persona con un motivo de esta lista: estafa, maltrato animal, vende animales,
  se hace pasar por otra persona, acoso, otro. El texto es opcional, hasta 1000 caracteres, salvo
  con "otro", donde es obligatorio.
- La persona reportada nunca se entera de que la reportaron ni de quién lo hizo.
- Un mismo motivo se reporta una sola vez por persona mientras ese reporte esté sin resolver.
- Después de reportar se ofrece bloquear, y al bloquear se ofrece reportar: son dos cosas distintas.
- Bloquear sirve para cortar el vínculo con alguien. Quien bloquea deja de ver el perfil de la otra
  persona; la bloqueada no puede avalar a quien la bloqueó y no se entera de que la bloquearon.
  Bloquear retira los avales vigentes entre las dos, en las dos direcciones. Desbloquear no los
  devuelve, pero permite volver a darlos.
- Quien bloquea deja de ver los animales de la persona bloqueada: no aparecen en su listado ni en
  la cantidad que dice arriba, y el enlace de uno de ellos le muestra que lo publicó alguien que
  bloqueó, con desbloquear, no la ficha. Al desbloquear vuelven a aparecer. La persona bloqueada
  sigue viendo los animales de quien la bloqueó, como cualquier visitante.
- Solo quien administra ve los reportes, quién los hizo y las suspensiones. Nadie resuelve un
  reporte sobre sí mismo ni se suspende a sí mismo; si dos personas administran y una ya resolvió
  un reporte, la otra ya no puede.
- Suspender siempre lleva un motivo escrito, y queda registrado quién suspendió y cuándo. Una
  suspensión se levanta solo a mano, reactivando la cuenta.
- Una cuenta suspendida no puede hacer nada en el sitio: al entrar ve solamente que está
  suspendida, el motivo, a qué correo escribir y la opción de borrar su cuenta. Sus avales dados
  dejan de contar, su pedido de verificación de identidad abierto se retira y sus imágenes se
  borran, y su perfil público se ve como un perfil que no existe (#12): una suspensión no se exhibe.
- Los animales de una cuenta suspendida salen del listado, y su enlace se ve como el de un animal
  que no está publicado (#57), también en la vista previa al compartirlo: nada dice que quien lo
  publicó está suspendido.
- Al reactivar, la cuenta vuelve a funcionar como antes: su perfil vuelve a verse, sus avales dados
  vuelven a contar y sus animales vuelven al listado con el mismo enlace.
- El número de teléfono de una cuenta suspendida no se puede verificar en otra cuenta, ni
  quedándoselo como permite #25: quien lo intenta ve que ese número no se puede usar y a qué correo
  escribir. Si la cuenta suspendida se borra, el número sigue sin poder verificarse durante 12
  meses desde el borrado, y después vuelve a poder usarse.

## Criterios de aceptación
### Camino feliz
- **Dado** que ingresé y miro el perfil público de otra persona **cuando** la reporto eligiendo un
  motivo **entonces** se me confirma que el reporte llegó, que es anónimo y que lo vamos a mirar, y
  se me ofrece bloquearla.
- **Dado** que bloqueé a una persona **cuando** abro el enlace a su perfil **entonces** veo que la
  bloqueé y la opción de desbloquearla, no su perfil.
- **Dado** que administro el sitio **cuando** abro la lista de reportes **entonces** veo los que
  están sin resolver, del más viejo al más nuevo, cada uno con el motivo, el texto, la persona
  reportada y sus reportes y suspensiones anteriores.
- **Dado** que administro el sitio **cuando** cierro un reporte suspendiendo la cuenta con un motivo
  **entonces** esa persona recibe un correo con el motivo, al entrar ve solo que está suspendida,
  su perfil público se ve como uno que no existe y sus animales dejan de aparecer en el listado.
- **Dado** que administro el sitio **cuando** reactivo una cuenta desde la lista de suspendidas
  **entonces** esa persona recibe un correo, puede volver a usar el sitio, sus avales dados vuelven
  a contar y sus animales vuelven al listado con el mismo enlace.

### Casos borde (al menos 3)
- **Dado** que ya reporté a una persona por un motivo y sigue sin resolver **cuando** la reporto
  otra vez por el mismo motivo **entonces** se me dice que ya lo hice y no se suma otro reporte.
- **Dado** que la persona que bloqueé me avalaba **cuando** la bloqueo **entonces** su aval deja de
  aparecer en mi perfil y, si era el único, bajo a nivel 2.
- **Dado** que me bloquearon **cuando** abro el perfil de quien me bloqueó **entonces** veo su perfil
  como cualquier visitante, sin la opción de avalarla y sin que se me diga que me bloqueó.
- **Dado** que bloqueé a quien publicó a Tobi **cuando** abro Animales en adopción **entonces** Tobi
  no aparece ni cuenta en la cantidad de arriba, y si abro su enlace veo que lo publicó alguien que
  bloqueé, con la opción de desbloquear.
- **Dado** que una persona suspendida avalaba a alguien **cuando** la suspenden **entonces** ese
  aval deja de contar y, si era el único de esa otra persona, baja a nivel 2.
- **Dado** que alguien pegó en un grupo el enlace de un animal de una cuenta que después fue
  suspendida **cuando** otra persona lo abre **entonces** ve que ese animal no está publicado y el
  camino a Animales en adopción, y la vista previa no muestra foto, nombre ni zona del animal.
- **Dado** que una persona tenía la sesión abierta **cuando** la suspenden **entonces** lo próximo
  que abre o intenta hacer la lleva a la pantalla de cuenta suspendida.
- **Dado** que la cuenta de una persona suspendida tenía su teléfono **cuando** otra cuenta intenta
  verificar ese número **entonces** no puede, y se le dice a qué correo escribir.
- **Dado** que una persona suspendida borró su cuenta hace 3 meses **cuando** abre una cuenta nueva
  e intenta verificar el mismo número **entonces** no puede, y se le dice a qué correo escribir; si
  lo intenta pasados 12 meses del borrado, puede.
- **Dado** que quien reportó borra su cuenta **cuando** quien administra abre el reporte
  **entonces** lo sigue viendo, sin el nombre de quien lo hizo.

### Errores y rechazos
- **Dado** que no ingresé **cuando** intento reportar o bloquear desde un perfil **entonces** se me
  pide ingresar y al hacerlo vuelvo a ese perfil.
- **Dado** que elegí el motivo "otro" **cuando** envío el reporte sin texto **entonces** no se envía
  y se me pide contar qué pasó.
- **Dado** que no administro el sitio **cuando** intento abrir la lista de reportes o la de
  suspendidas, o suspender a alguien **entonces** no puedo y no me entero de qué hay adentro.
- **Dado** que administro el sitio **cuando** intento suspender sin escribir un motivo **entonces**
  no se suspende nada y se me pide el motivo.
- **Dado** que administro el sitio y hay un reporte sobre mí **cuando** abro la lista **entonces**
  no puedo resolverlo: lo tiene que resolver otra persona que administre.
- **Dado** que otra persona que administra ya resolvió un reporte **cuando** intento resolverlo
  **entonces** veo que ya fue resuelto y cómo, y no puedo resolverlo de nuevo.

## Pantallas
- **Perfil público** (de #12): suma reportar y bloquear para quien ingresó, y suspender para quien
  administra. Vacío: no aplica.
- **Reportar a una persona**: los motivos, el texto y el aviso de que es anónimo; al terminar, la
  confirmación con la opción de bloquear. Vacío: no aplica.
- **Perfil bloqueado**: que la bloqueaste, con desbloquear y reportar. Vacío: no aplica.
- **Animal de alguien que bloqueaste**: lo que ve quien bloqueó al abrir el enlace de un animal de
  la persona bloqueada: que lo publicó alguien que bloqueó, con desbloquear. Vacío: no aplica.
- **Animales en adopción** (de #57): para quien bloqueó, sin los animales de quien bloqueó; para
  todos, sin los de las cuentas suspendidas. Vacío: el de #57.
- **Mis bloqueos**: a quiénes bloqueé, con la opción de desbloquear. Vacío: "No bloqueaste a nadie"
  y qué hace un bloqueo.
- **Lista de reportes**: solo para quien administra; los sin resolver con el historial de cada
  persona reportada, y cerrar sin medidas o suspender. Vacío: "No hay reportes sin resolver".
- **Cuentas suspendidas**: solo para quien administra; cada una con el motivo, quién la suspendió y
  cuándo, y reactivar. Vacío: "No hay cuentas suspendidas".
- **Cuenta suspendida**: lo que ve la persona suspendida al entrar: el motivo, a qué correo escribir
  y borrar su cuenta. Vacío: no aplica.

## Datos personales
- Se guarda quién reportó a quién, con qué motivo, qué escribió y cómo se resolvió; quién bloqueó a
  quién; y quién suspendió o reactivó una cuenta, cuándo y por qué. Lo ve solo quien administra,
  salvo los bloqueos, que ve además quien bloqueó. La persona reportada nunca ve los reportes ni
  quién los hizo; una suspensión no se muestra a nadie más que a la persona suspendida.
- Al borrar una cuenta se borran sus bloqueos, los reportes sobre ella y su suspensión; los
  reportes que hizo siguen, sin su nombre.
- Si la cuenta borrada estaba suspendida, queda solo su número de teléfono y hasta cuándo no se
  puede usar: 12 meses desde el borrado. Sin el motivo, sin el nombre y sin nada que lo una a la
  cuenta que se borró, y nadie lo ve en el sitio, tampoco quien administra: sirve solo para rechazar
  ese número al verificar. A los 12 meses se borra.

## Medición
- Reportes por motivo, bloqueos y desbloqueos, suspensiones y reactivaciones, y cuánto tarda un
  reporte en resolverse. Ningún evento lleva datos de la persona reportada, bloqueada ni suspendida.

## Dependencias
- #9 Registro e ingreso (cerrada) · #11 Verificación de identidad (cerrada: define quién administra
  y el pedido que se retira) · #12 Aval y perfil público (cerrada: el perfil donde se reporta y los
  avales que se cortan) · #25 Recuperar un número (cerrada) · #57 Listado y ficha (cerrada: los
  animales que se ocultan).
- docs/03 §1, §3 y §6 · docs/01 §"Validación" esconde el problema difícil y §Legal / datos ·
  docs/06 §Glosario

## Decisiones del enjambre
- **Decisión (2026-09-26, product-owner):** los motivos de reporte son estafa, maltrato animal,
  vende animales, se hace pasar por otra persona, acoso y otro, con texto obligatorio solo en
  "otro". Motivo: son los problemas que nombra docs/01 §"Validación" esconde el problema difícil,
  y una lista corta le deja a quien administra ver patrones sin leer texto libre. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** bloquear corta los avales entre las dos personas y la
  persona bloqueada no se entera. Motivo: un aval a la vista de todos entre dos personas que se
  bloquearon es una garantía falsa, y avisarle a quien acosa que lo bloquearon lo empuja a buscar
  otro camino. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** una suspensión no se exhibe: el perfil de una cuenta
  suspendida se ve como uno que no existe y quien reportó no se entera del resultado. Motivo: una
  suspensión se levanta a mano y puede ser un error; exhibirla sería el escrache del grupo de
  Facebook con sello del sitio (docs/01 §Legal / datos). Va a docs/03 §6.
- **Decisión (2026-09-26, product-owner):** el número de una cuenta suspendida no se puede
  verificar en otra cuenta, tampoco con el camino de #25. Motivo: sin esto, quien fue suspendido
  abre otra cuenta, se queda con su propio número y vuelve verificado en cinco minutos; la
  verificación dejaría de significar nada justo cuando falla. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** la persona suspendida recibe un correo con el motivo y
  otro cuando la reactivan, y desde la pantalla de suspendida puede borrar su cuenta. Motivo: es lo
  mismo que ya hacen #11 y #25 cuando algo cambia en la cuenta, y borrar la cuenta es un derecho
  que la suspensión no quita (Ley 18.331). Va a docs/03 §6.
- **Decisión (2026-09-30, enjambre):** ¿qué queda de una cuenta cuando se borra, si hizo reportes o
  estaba suspendida? Se aceptan dos excepciones a «borrar la cuenta borra todo»: los reportes que
  hizo siguen, sin su nombre; y si la cuenta estaba suspendida, de su número de teléfono queda solo
  el número y la fecha hasta la que no se puede verificar, 12 meses desde el borrado, sin el motivo,
  sin nada que lo una a la cuenta borrada y sin que nadie lo vea en el sitio, tampoco quien
  administra; a los 12 meses se borra. Motivo: es el mismo razonamiento que Hernán aceptó en #37
  (guardar lo mínimo que hace falta para que una consecuencia funcione, con plazo): sin la
  retención, quien fue suspendido borra la cuenta y vuelve verificado con el mismo número, y el
  distintivo deja de tener consecuencias; sin el reporte, quien se va se lleva el antecedente. De
  las formas de retenerlo es la que guarda y muestra menos (Ley 18.331): sin el motivo que proponía
  #52 y con plazo, para que un número reasignado no quede trabado para siempre. Reemplaza la
  pregunta de #52, cerrada sin respuesta. Va a docs/01 §Legal / datos: la propone el PR #97, que
  todavía no entró a la rama principal; si cuando se construye esta historia sigue sin entrar, la
  escribe el PR de esta historia, una sola vez, y #97 se cierra citándolo.
- **Decisión (2026-09-30, product-owner):** los animales de una cuenta suspendida salen del listado
  y su enlace se ve como el de un animal que no está publicado, también en la vista previa; vuelven
  con el mismo enlace al reactivar. Motivo: #57 y #59 dejaron esto para esta historia, un vendedor
  suspendido no puede seguir ofreciendo animales, y decir que el publicador está suspendido sería
  exhibir la suspensión. Va a docs/03 §3.
- **Decisión (2026-09-30, product-owner):** quien bloquea deja de ver los animales de la persona
  bloqueada, en el listado y en su enlace; la bloqueada sigue viendo los de quien la bloqueó.
  Motivo: bloquear es dejar de ver a alguien, y un adoptante que bloqueó a quien le quiso vender un
  animal no tiene que seguir encontrándolo en el listado; ocultarle a la bloqueada lo que es público
  para cualquier visitante no la frena y le avisa que la bloquearon. Que no pueda solicitar lo dice
  #63. Va a docs/03 §3.




---
_Generated by [Claude Code](https://claude.ai/code)_
