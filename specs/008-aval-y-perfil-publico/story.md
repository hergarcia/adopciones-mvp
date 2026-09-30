## Historia
**Como** rescatista conocido **quiero** avalar a alguien en quien confío, y **como** cualquier
persona **quiero** un perfil público que muestre hasta dónde me verifiqué **para** que la confianza
se vea antes de hablar, sin tener que contarla cada vez.

## Contexto
La confianza no es un casillero "verificado": es un sistema por niveles, y el nivel que más vale es
el que da otra persona que ya se ganó su reputación en la comunidad (docs/01 §"Validación" esconde
el problema difícil). En un país chico, que un rescatista conocido responda por alguien pesa más
que cualquier documento.

Es también la pantalla donde todo lo anterior se vuelve visible: sin perfil público, verificarse no
tiene ninguna consecuencia observable para el resto. Hoy un rescatista pregunta en un grupo de
WhatsApp "¿alguien conoce a esta persona?"; el enlace al perfil, con el nombre de quien la avala,
es la respuesta a esa pregunta. Por eso mide una parte de la hipótesis (docs/03 §Hipótesis): si la
gente comparte y mira el perfil verificado en vez de preguntar en el grupo.

Dos pendientes esperan a esta historia: la chapita de cada nivel, que «Mi perfil» y la verificación
aprobada todavía dicen solo en texto (KL-11-5), y la regla que impide dejar un teléfono en el
perfil, que hoy es más floja que la de la ficha de un animal porque el perfil no lo veía nadie
(KL-53-5). Con el perfil a la vista de cualquiera, las dos dejan de ser aceptables.

## Alcance
- Incluye: el perfil público de cada persona con el perfil completo (nombre, foto, zona,
  distintivos, mes y año en que creó la cuenta, si es rescatista o refugio y quién la avala),
  visible sin ingresar · copiar el enlace a mi perfil público desde mi perfil, para mandarlo por
  WhatsApp · el distintivo de cada nivel alcanzado, con su explicación al tocarlo · el mismo
  distintivo en «Mi perfil» y en la pantalla de la verificación de identidad aprobada · avalar
  desde el perfil público a otra persona con identidad verificada y retirar un aval dado · quitar
  de mi perfil un aval que recibí · ver quién me avaló y a quién avalé · el nivel 3 · que el nombre
  y la localidad del perfil no acepten teléfonos, correos, enlaces ni usuarios de redes, con la
  misma regla que la ficha de un animal.
- No incluye (explícito): el contacto ni el teléfono en el perfil · el correo · el documento ni
  ninguna imagen de identidad · el historial de adopciones, que llega con el seguimiento (#69) ·
  los animales que publica la persona · el enlace desde la ficha de un animal al perfil de quien lo
  publica, que llega con la ficha pública (#57) · calificar o puntuar personas · pedirle un aval a
  alguien desde el sitio (se pide como hoy, por WhatsApp, mandando el enlace) · avisar por correo
  que alguien te avaló · avales automáticos por haber concretado una adopción · un tope de avales
  por persona · lo que pasa con los avales de una cuenta suspendida o bloqueada, que es de #13 ·
  reportar o bloquear desde el perfil, que es de #13 · detectar un teléfono escrito en una foto ·
  revisar perfiles guardados antes de la regla de contacto: el sitio todavía no tiene personas
  reales · una imagen especial para cuando se comparte el enlace · que el perfil aparezca en
  buscadores, que se decide cuando se prenda la indexación (M5).

## Reglas de negocio
- Nivel 1 es el teléfono verificado (#10), nivel 2 la identidad verificada (#11) y nivel 3 es tener
  nivel 2 y al menos un aval vigente. Cada nivel incluye los anteriores y se muestra el más alto
  alcanzado, igual en el perfil público, en «Mi perfil» y en la verificación aprobada.
- Solo avala quien tiene nivel 2 o más, y solo se avala a quien tiene nivel 2 o más.
- Nadie se avala a sí mismo. No se puede avalar a quien te avala mientras ese aval esté vigente:
  si no, dos cuentas se suben de nivel entre ellas.
- Un aval se retira en cualquier momento, sin que la otra persona tenga que aceptarlo. Quien lo
  recibió también puede quitarlo de su perfil, y ese aval no se puede volver a dar. Si la persona se
  queda sin avales vigentes, baja a nivel 2.
- Un aval cuenta solo mientras quien lo dio tiene nivel 2. Si lo pierde (por ejemplo, cambió de
  teléfono y todavía no confirmó el nuevo, o perdió su número porque otra cuenta se quedó con él),
  su aval deja de contar y de mostrarse; cuando lo recupera, vuelve a contar sin que nadie haga
  nada. Lo mismo para quien lo recibió: sin nivel 2, sus avales no cuentan hasta que lo recupere.
- El perfil público muestra solo nombre, foto, zona, distintivos (el de nivel 2 con el mes y el año
  en que se verificó), si es rescatista o refugio, el mes y año en que creó la cuenta y quién la
  avala. Nunca el contacto, el correo ni nada del documento. «Mi perfil» sigue mostrándole a su
  dueña el día exacto en que se verificó.
- Quien mira un perfil ve el nombre de quien avala a esa persona, con el enlace a su perfil: el
  nombre de quien responde por ella es la garantía.
- El nombre y la localidad del perfil rechazan lo mismo que el nombre y la descripción de una
  ficha: teléfonos (también fijos de 8 dígitos), correos, enlaces (también de WhatsApp, Telegram y
  acortadores) y usuarios de redes (@usuario), y se explica por qué: el contacto se da recién
  cuando se acepta una solicitud.
- Un perfil que no existe, de una cuenta borrada o de una cuenta con el perfil sin completar se ve
  igual: "este perfil no existe". Nadie puede saber cuál de los tres casos es.

## Criterios de aceptación
### Camino feliz
- **Dado** que tengo el perfil completo **cuando** copio el enlace a mi perfil público y otra persona
  lo abre **entonces** ve mi nombre, foto, zona, distintivos, si soy rescatista o refugio y el mes y
  año en que creé la cuenta, sin que se le pida ingresar.
- **Dado** que tengo nivel 2 **cuando** abro el perfil de otra persona con nivel 2 y la avalo
  **entonces** ella pasa a nivel 3 y su perfil muestra mi nombre como quien la avala.
- **Dado** que avalé a alguien **cuando** retiro el aval **entonces** mi nombre deja de aparecer en
  su perfil y, si era su único aval, baja a nivel 2.
- **Dado** que alguien me avaló **cuando** quito ese aval de mi perfil **entonces** su nombre deja de
  aparecer y, si era el único, bajo a nivel 2.
- **Dado** que miro un perfil **cuando** toco un distintivo **entonces** veo qué pide ese nivel y qué
  dice de la persona.
- **Dado** que me verificaron la identidad **cuando** abro «Mi perfil» o la pantalla de mi
  verificación aprobada **entonces** veo el distintivo de nivel 2, el mismo que ven los demás en mi
  perfil público, con el día en que me verifiqué.

### Casos borde (al menos 3)
- **Dado** que ya avalé a una persona **cuando** abro su perfil **entonces** veo que ya la avalo y la
  opción de retirar el aval, no la de avalar otra vez.
- **Dado** que una persona tiene 2 avales **cuando** se retira uno **entonces** sigue en nivel 3 y
  su perfil muestra solo el que queda.
- **Dado** que quien me avaló cambió de teléfono y todavía no confirmó el nuevo **cuando** alguien
  mira mi perfil **entonces** ese aval no aparece ni cuenta, y cuando lo confirma vuelve a aparecer
  sin que nadie haga nada.
- **Dado** que una persona tiene solo el teléfono verificado **cuando** alguien abre su perfil
  **entonces** ve el distintivo de nivel 1 y ninguno más, no un perfil roto.
- **Dado** que una persona todavía no verificó nada **cuando** alguien abre su perfil **entonces** ve
  el perfil sin distintivos y que todavía no se verificó.
- **Dado** que una persona borró su cuenta **cuando** alguien abre el enlace a su perfil
  **entonces** ve "este perfil no existe", y los avales que había dado desaparecen de los perfiles
  de los demás.
- **Dado** que me verificaron la identidad el 14 de agosto de 2026 **cuando** otra persona abre mi perfil
  público **entonces** ve el distintivo de nivel 2 con "agosto de 2026", no el día.

### Errores y rechazos
- **Dado** que no tengo nivel 2 **cuando** intento avalar a alguien **entonces** se me explica que
  para avalar hace falta verificar la identidad y se me ofrece hacerlo.
- **Dado** que la persona que quiero avalar no tiene nivel 2 **cuando** abro su perfil **entonces**
  se me dice que todavía no puede recibir avales porque no verificó su identidad.
- **Dado** que estoy en mi propio perfil público **cuando** lo miro **entonces** no tengo la opción
  de avalarme.
- **Dado** que una persona me avala **cuando** intento avalarla yo **entonces** no puedo, y se me
  dice que no se puede avalar a quien te avala.
- **Dado** que quité de mi perfil el aval de una persona **cuando** ella intenta avalarme de nuevo
  **entonces** no puede, y se le dice que ese aval ya no se puede dar.
- **Dado** que no ingresé **cuando** intento avalar desde un perfil **entonces** se me pide ingresar
  y al hacerlo vuelvo a ese perfil.
- **Dado** que abro un perfil que no existe **cuando** carga **entonces** veo "este perfil no existe"
  y cómo volver al inicio.
- **Dado** que edito mi perfil **cuando** escribo "Juan 099 123 456", "fijo 2401 2345",
  "t.me/juanrescata" o "@juanrescata" en el nombre o en la localidad y guardo **entonces** no se
  guarda, lo que escribí sigue en pantalla y se me explica que el contacto se da recién cuando se
  acepta una solicitud.

## Pantallas
- **Perfil público**: nombre, foto, zona, distintivos, si es rescatista o refugio, mes y año en que
  creó la cuenta y quién la avala; y, para quien ingresó con nivel 2, avalar o retirar su aval.
  Vacío: sin distintivos, dice que esa persona todavía no se verificó; sin avales, no muestra la
  sección de avales.
- **Mis avales**: a quién avalé, con la opción de retirar cada aval, y quién me avala, con la opción
  de quitarlo. Vacío: "No avalaste a nadie todavía" y "Nadie te avala todavía", con qué significa
  un aval y cómo pedirlo mandando el enlace a tu perfil.
- **Explicación de los niveles**: qué pide cada uno y qué dice de la persona. Vacío: no aplica.
- **Mi perfil** (cambia): suma el distintivo del nivel alcanzado, ver mi perfil público como lo ven
  los demás y copiar su enlace; al editar, el aviso de la regla de contacto. Vacío: sin nivel,
  sigue mostrando el paso pendiente de verificar el teléfono, como hoy.
- **Verificación de identidad aprobada** (cambia): suma el distintivo de nivel 2 junto a "Estás en
  nivel 2". Vacío: no aplica.
- **Perfil que no existe**: "este perfil no existe" y cómo volver al inicio. Vacío: no aplica.

## Datos personales
- El perfil público muestra, a cualquiera y sin ingresar, nombre, foto, zona, distintivos (el de
  nivel 2 con su mes y año), si es rescatista o refugio, mes y año en que creó la cuenta y quién la
  avala. Es lo que el alta ya le anunció a la persona al completar el perfil. No muestra correo,
  teléfono, contacto ni nada del documento. Se guarda quién avala a quién y desde cuándo, y los
  avales quitados por quien los recibió, para que no se vuelvan a dar. Borrar la cuenta borra el
  perfil y los avales dados, recibidos y quitados.

## Medición
- Perfiles públicos vistos, separados en abiertos desde un enlace compartido o desde el sitio;
  enlaces al perfil copiados; avales dados, retirados y quitados; personas que llegan a nivel 3;
  cuántas veces se abre la explicación de los niveles; y cuántas veces se rechaza un perfil por
  llevar contacto. Ningún evento lleva datos de la persona ni lo que escribió.

## Dependencias
- #9 Registro e ingreso (cerrada) · #10 Verificación de teléfono (cerrada) · #25 Recuperar un
  número verificado en otra cuenta (cerrada) · #11 Verificación de identidad (cerrada: el nivel 2
  que el aval necesita) · #53 Publicar un animal (cerrada: la regla de contacto de la ficha).
- docs/03 §1 · docs/01 §"Validación" esconde el problema difícil · docs/06 §Glosario ·
  docs/known-limitations.md KL-11-5 y KL-53-5, que esta historia cierra.

## Decisiones del enjambre
- **Decisión (2026-09-26, product-owner):** el nivel 3 es tener nivel 2 más al menos un aval
  vigente, así que solo se avala a quien ya verificó su identidad. Motivo: docs/03 §1 dice que cada
  nivel incluye los anteriores, y el piso de verificación que exige quien publica (docs/03 §2) y la
  métrica de cuántos completan el nivel 2 (docs/03 §Métricas de éxito) dejan de medir algo si un
  aval salta la cédula. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** quien recibe un aval puede quitarlo de su perfil, y ese
  aval no se puede volver a dar. Motivo: el nombre de quien avala queda a la vista de cualquiera
  junto al de la persona avalada; nadie tiene que cargar en público con el nombre de alguien que
  no eligió, ni recibirlo de nuevo después de sacarlo. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** un aval deja de contar mientras quien lo dio o quien lo
  recibió no tiene nivel 2, y vuelve a contar solo cuando lo recupera. Motivo: cambiar de teléfono
  baja la cuenta hasta confirmar el nuevo (#10, #11); borrar los avales por un cambio de chip
  castigaría a la otra persona por algo que no hizo. Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** no se puede avalar a quien te avala mientras ese aval
  esté vigente, y no hay tope de avales por persona. Motivo: la regla corta el caso más barato de
  dos cuentas que se suben solas; un tope castigaría al rescatista que de verdad conoce a mucha
  gente, y quien avala en masa a desconocidos se frena suspendiéndolo (#13). Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** a un perfil se llega por el enlace que la persona copia
  desde su perfil y manda, y pedir un aval sigue siendo por WhatsApp. Motivo: en este milestone no
  hay otro lugar del sitio donde aparezcan personas, y el enlace es lo que el rescatista ya sabe
  usar: reemplaza el "¿alguien la conoce?" del grupo (docs/01, el competidor es Facebook y
  WhatsApp). Va a docs/03 §1.
- **Decisión (2026-09-26, product-owner):** el perfil muestra el mes y el año de alta, no el día; y
  un perfil inexistente, borrado o sin completar se ve igual. Motivo: "desde cuándo" es la señal de
  confianza y el día exacto no le suma nada; distinguir una cuenta borrada contaría que esa persona
  existió (docs/01 §Legal / datos). Va a docs/03 §1.
- **Decisión (2026-09-28, product-owner):** el perfil público muestra el mes y el año en que se
  verificó la identidad, no el día; el día exacto lo ve solo su dueña en «Mi perfil». Motivo: es el
  mismo criterio que la fecha de alta, y entre dos opciones razonables de privacidad se toma la que
  muestra menos (Ley 18.331). Va a docs/03 §1.
- **Decisión (2026-09-28, product-owner):** el nombre y la localidad del perfil rechazan teléfonos,
  correos, enlaces y usuarios de redes con la misma regla que la ficha de un animal (KL-53-5).
  Motivo: con el perfil público, un número en el nombre rompe "teléfono y contacto nunca públicos"
  y saca la conversación de la plataforma antes de la solicitud, que es donde se mide la hipótesis
  (docs/03 §3); una sola regla para todo lo que escribe la misma persona no confunde. Va a docs/03
  §1.
- **Decisión (2026-09-28, product-owner):** el enlace desde la ficha de un animal al perfil público
  de quien lo publica lo suma la ficha pública (#57), que se construye después. Motivo: la ficha
  pública todavía no existe, y la historia que se construye segunda es la que une las dos
  pantallas; así ninguna de las dos deja la otra a medias. Va a docs/03 §3.

