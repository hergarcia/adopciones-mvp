# Feature Specification: Que la vista previa del enlace de mi perfil diga qué tengo verificado

**Feature Branch**: `feature/280-vista-previa-perfil-verificado`

**Created**: 2026-11-21

**Status**: Draft

**Input**: Historia #280 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`). Ya en `main`: nada de esta historia.

**Ya construido** (en `main`, no se rehace): el perfil público con su chapita y su «Este perfil no
existe» para el que no existe, se borró, no terminó el alta o es de una persona suspendida (#12); la
vista previa del enlace de un perfil con el nombre que la persona eligió y el sitio, sin imagen,
zona ni nivel, y la de «Este perfil no existe» con el sitio (#12); copiar o mandar el enlace del
perfil desde «Mi perfil», «Mis avales» y «Mis animales», con la pantalla de donde salió en la
medición (#12, #238); la visita a un perfil en la medición, con su origen (un enlace de afuera, el
sitio o una solicitud) y si tenía animales a la vista (#12, #236, #238); el nivel en palabras en la
vista previa del enlace de un animal y de una camada (#244); el nivel en la medición de la ficha,
de «Solicitar» y de las respuestas (#236). Hoy la vista previa de un perfil no dice ningún nivel, y
ni el enlace copiado o mandado ni la visita a un perfil llevan un nivel en la medición.

**Vocabulario de esta spec**:

- **Nivel**: el de la chapita del perfil público, el mismo que la ficha y la tarjeta del listado
  dicen en palabras: «Teléfono verificado», «Identidad verificada» o «Identidad verificada y
  avalada». Quien no tiene la chapita (no verificó el teléfono, o cambió de chip y no confirmó el
  número nuevo) **no tiene nada verificado**.
- **El nivel de ahora**: el que la persona tiene en el instante en que pasa algo (una app lee el
  enlace, alguien copia el enlace, alguien abre el perfil), el mismo que su perfil público muestra en
  ese instante. Nunca uno anterior ni uno guardado de antes.
- **Vista previa**: lo que WhatsApp, Facebook y otras apps muestran al pegar un enlace: un título, un
  texto debajo del título y, a veces, una imagen. En un chat la imagen puede salir como una
  miniatura chica y cuadrada, recortada al centro.
- **La vista previa de hoy**: la que el perfil ya tiene en `main`. Con la persona: su nombre y el
  sitio, sin imagen y sin texto de nivel. Sin la persona: «Este perfil no existe» y el sitio.
- **Un perfil que no existe**: el de un enlace inventado, de una cuenta borrada, de un alta sin
  terminar o de una persona suspendida, como lo trata hoy el perfil público.
- **Un momento** es lo que ya llega a la herramienta de medición cuando pasa algo en el sitio.
  **Sin nivel** quiere decir que el momento llega igual, pero sin ese dato. El nivel en la medición
  es una de cuatro categorías: nada, teléfono, identidad, identidad y aval.
- **Mandar el enlace** es elegir una app en el menú de compartir del teléfono; cerrar ese menú sin
  elegir no es mandarlo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Que del otro lado vean qué tengo verificado antes de tocar mi enlace (Priority: P1)

Carla tiene la identidad verificada. Se presenta en un grupo de Facebook para adoptar y pega el
enlace de su perfil. La vista previa muestra su nombre y el del sitio, y dice «Identidad verificada»
en una imagen hecha para el perfil y en el texto debajo del título. No muestra su foto, su zona ni
quién la avala. Bruno, que todavía no verificó nada, pega el suyo y la vista previa queda como hoy.

**Why this priority**: es el valor de la historia. Quien adopta no tiene animales para compartir, y
el perfil es lo único que manda cuando se presenta: sin esto, su verificación no sale nunca del
sitio. Con esta parte sola, la verificación ya se ve en el terreno de los grupos (docs/03
§Hipótesis).

**Independent Test**: con personas sembradas de cada nivel y sin nada verificado, una con el aval
retirado, una con un cambio de chip sin confirmar, una suspendida, una borrada y una sin el alta
terminada: pedir cada perfil como lo pide un lector de vista previa y leer el título, el texto
debajo del título y la imagen que ofrece. Repetir con el nivel imposible de leer y con la imagen
imposible de armar.

**Acceptance Scenarios**:

1. **Dado** que Carla tiene la identidad verificada, **cuando** copia el enlace de su perfil desde
   «Mi perfil» y lo pega en un chat de WhatsApp, **entonces** la vista previa muestra su nombre y el
   del sitio, y dice «Identidad verificada» en la imagen y en el texto debajo del título, sin su
   foto, su zona ni nadie que la avale.
2. **Dado** que Marta tiene solo el teléfono verificado y Ana tiene la identidad verificada y un
   aval, **cuando** alguien pega el enlace del perfil de cada una en un grupo de Facebook,
   **entonces** la de Marta dice «Teléfono verificado» y la de Ana «Identidad verificada y avalada»,
   las mismas palabras que muestra su perfil público en ese momento.
3. **Dado** que la vista previa de Carla sale en un chat como una miniatura chica, **cuando** alguien
   la mira sin abrirla, **entonces** el nivel se lee entero dentro de la miniatura, sin quedar
   cortado por el recorte.
4. **Dado** que Bruno todavía no verificó nada, **cuando** alguien pega el enlace de su perfil,
   **entonces** la vista previa es la de hoy, con su nombre y el sitio, sin imagen ni nivel, y sin
   «Todavía no se verificó».
5. **Dado** que a Ana le retiraron el aval y le quedó la identidad verificada, **cuando** alguien
   pega por primera vez el enlace de su perfil, **entonces** la vista previa dice «Identidad
   verificada», aunque antes alguna app haya leído su enlace con «Identidad verificada y avalada».
6. **Dado** que Marta cambió de chip y no confirmó el número nuevo, **cuando** alguien pega el enlace
   de su perfil, **entonces** la vista previa es la de quien no verificó nada, nunca un nivel más
   alto que el que muestra su perfil.
7. **Dado** que Carla pegó su enlace en un grupo cuando tenía el teléfono verificado y después
   verificó la identidad, **cuando** alguien mira esa vista previa vieja en el grupo, **entonces**
   sigue diciendo lo que WhatsApp o Facebook guardaron; al tocarla, su perfil dice «Identidad
   verificada».
8. **Dado** que el enlace es de un perfil que no existe, se borró, no terminó el alta o es de una
   persona suspendida, **cuando** alguien lo pega, **entonces** la vista previa dice «Este perfil no
   existe» y el sitio, sin nombre, sin imagen y sin nivel.
9. **Dado** que en ese momento no se puede saber el nivel de Ana, **cuando** alguien pega el enlace
   de su perfil, **entonces** la vista previa es la de quien no verificó nada, con su nombre y el
   sitio.
10. **Dado** que se sabe el nivel de Ana pero no se puede armar la imagen, **cuando** alguien pega el
    enlace de su perfil, **entonces** el texto debajo del título igual dice su nivel, con su nombre y
    el sitio.

---

### User Story 2 - Saber si quien verificó se presenta con su perfil y si su enlace trae gente (Priority: P2)

Carla, con la identidad verificada, copia el enlace de su perfil desde «Mi perfil»: el momento llega
con la pantalla, como hoy, y con su nivel. Alguien lo toca en el grupo y abre su perfil: la visita
llega con su origen, como hoy, y con el nivel de Carla. Bruno, sin nada verificado, copia el suyo y
el momento llega con el nivel «nada».

**Why this priority**: es lo que contesta la pregunta de la historia: si los que verificaron mandan
su perfil más que los que no, y si su enlace trae más visitas. Suma un dato a dos momentos que ya
existen, sin cambiar nada de lo que ve nadie.

**Independent Test**: con personas sembradas de cada nivel y sin nada verificado: copiar y mandar el
enlace del perfil desde «Mi perfil», «Mis avales» y «Mis animales»; abrir cada perfil desde un enlace
de afuera, navegando el sitio y desde una solicitud; leer en el registro de la medición el nivel de
cada momento. Repetir con el nivel imposible de leer y con la medición caída.

**Acceptance Scenarios**:

1. **Dado** que Carla tiene la identidad verificada, **cuando** copia o manda el enlace de su perfil
   desde «Mi perfil», «Mis avales» o «Mis animales», **entonces** el momento llega con la pantalla,
   como hoy, y con el nivel identidad.
2. **Dado** que Ana tiene la identidad verificada y un aval, **cuando** alguien abre su perfil desde
   un enlace de afuera, **entonces** la visita llega con su origen, como hoy, y con el nivel
   identidad y aval, el de la dueña del perfil, no el de quien visita.
3. **Dado** que Marta tiene solo el teléfono verificado, **cuando** alguien llega a su perfil
   navegando el sitio o desde una solicitud, **entonces** la visita llega con ese origen y con el
   nivel teléfono.
4. **Dado** que Bruno no verificó nada, **cuando** copia el enlace de su perfil, **entonces** el
   momento llega con el nivel nada, no queda afuera; **y cuando** alguien abre su perfil, la visita
   llega con el nivel nada.
5. **Dado** que a Ana le retiraron el aval, **cuando** copia su enlace o alguien abre su perfil,
   **entonces** el momento llega con el nivel identidad, el de ahora.
6. **Dado** que Carla toca «Compartir» y cierra el menú del teléfono sin mandar nada, **cuando**
   vuelve a «Mi perfil», **entonces** no se cuenta ningún enlace mandado, como hoy.
7. **Dado** que no se pudo saber el nivel de Carla, **cuando** copia su enlace o alguien abre su
   perfil, **entonces** el momento se cuenta igual, sin nivel, y Carla no ve ningún error ni demora.
8. **Dado** que la herramienta de medición no responde, **cuando** Carla copia su enlace,
   **entonces** el enlace se copia y Carla ve «Enlace copiado» como hoy, sin ningún aviso ni demora.
9. **Dado** que la dueña mira su propio perfil, o lo pide un lector de vista previa, **cuando**
   carga, **entonces** no se mide ninguna visita, como hoy.

---

### User Story 3 - Saber en «Mi perfil» que mi enlace muestra lo que verifiqué (Priority: P3)

Carla, que tiene algo verificado, abre «Mi perfil». En «Tu perfil público», entre el título y los
botones de copiar y ver, lee una línea que le dice que al pegar el enlace en un chat o en un grupo
se ve qué tiene verificado. Bruno, sin nada verificado, ve la sección como hoy.

**Why this priority**: sin la línea, la vista previa igual dice el nivel; la línea solo le cuenta a
la persona que su enlace ya la presenta. Es lo más chico de la historia y no depende de las otras
dos para probarse.

**Independent Test**: abrir «Mi perfil» con personas sembradas de cada nivel y sin nada verificado, y
mirar «Tu perfil público» en un teléfono y en una computadora.

**Acceptance Scenarios**:

1. **Dado** que Carla tiene el teléfono verificado o más, **cuando** abre «Mi perfil», **entonces**
   debajo de «Tu perfil público», entre el título y los botones de copiar y ver, lee una línea que
   le dice que al pegar el enlace en un chat o en un grupo se ve qué tiene verificado.
2. **Dado** que Bruno no verificó nada, **cuando** abre «Mi perfil», **entonces** la línea nueva no
   aparece y la sección queda como hoy.
3. **Dado** que Marta cambió de chip y no confirmó el número nuevo, **cuando** abre «Mi perfil»,
   **entonces** la línea no aparece, como a quien no verificó nada.
4. **Dado** que Carla abre «Mis avales» o «Mis animales», **cuando** mira el enlace de su perfil,
   **entonces** no hay una línea nueva: esas pantallas quedan como hoy.

---

### Edge Cases

- **El nivel cambia entre una lectura y otra** (se aprueba una identidad, se suma o se retira un
  aval, se pierde el teléfono verificado): la próxima vez que una app lee el enlace, la vista previa
  dice el nivel de ahora, también en la imagen. Una imagen dibujada con el nivel anterior no se le
  vuelve a ofrecer a esa app.
- **Una vista previa ya guardada** en un chat o en un grupo no cambia: el sitio no puede tocar las
  copias de WhatsApp o Facebook. Al tocarla, el perfil dice el nivel de ahora.
- **La persona cambia su nombre**: la vista previa siguiente lleva el nombre nuevo, como hoy.
- **La persona borra su cuenta o la suspenden**: la próxima lectura del enlace da «Este perfil no
  existe»; la imagen del perfil tampoco se ofrece ni se dibuja para esa persona.
- **Alguien pide la imagen del perfil directo**, sin pasar por la vista previa: muestra lo mismo que
  la vista previa, el nivel y el sitio, y nada más; la de una persona sin nada verificado o de un
  perfil que no existe no dice ningún nivel ni ningún nombre.
- **El perfil de quien bloqueó a quien lo pide**: un lector de vista previa no tiene sesión, así que
  ve lo que vería cualquiera sin sesión.
- **«Copiar el enlace» en la computadora y «Mandar el enlace» en el teléfono** cuentan el mismo
  momento, como hoy; los dos llevan el nivel.
- **Copiar dos veces seguidas** cuenta dos momentos, como hoy.
- **Una visita a un perfil que no se mide hoy** (la dueña, una vista previa, quien vuelve de avalar,
  el «no existe», «Ver más» de sus animales) no empieza a medirse.
- **Leer el nivel tarda o falla** al copiar: copiar y «Enlace copiado» no esperan a la medición.

## Requirements *(mandatory)*

### Functional Requirements

#### La vista previa del enlace de un perfil

- **FR-001**: La vista previa del enlace del perfil de una persona con el teléfono verificado o más
  DEBE decir su nivel en palabras, las mismas de la ficha y de la tarjeta del listado: «Teléfono
  verificado», «Identidad verificada» o «Identidad verificada y avalada».
- **FR-002**: El nivel DEBE ir en el texto debajo del título y en una imagen hecha para el perfil.
- **FR-003**: La imagen DEBE llevar el papel del cartel, el nivel en palabras en el verde de lo
  verificado y el nombre del sitio, con el nivel entero dentro del cuadrado central de la imagen (tan
  ancho como alta es la imagen), que es lo que queda en la miniatura cuadrada de un chat. NO DEBE
  llevar la foto de la persona.
- **FR-004**: El título DEBE seguir siendo el de hoy: el nombre que la persona eligió y el sitio.
- **FR-005**: La vista previa DEBE decir el nivel de ahora, el mismo que muestra el perfil público en
  ese momento, NUNCA uno más alto. Cuando el nivel cambia, la próxima lectura del enlace DEBE ofrecer
  una imagen con el nivel nuevo, no una dibujada con el anterior.
- **FR-006**: Sin nada verificado, la vista previa DEBE quedar como la de hoy: el nombre y el sitio,
  sin imagen para el perfil, sin texto de nivel y sin «Todavía no se verificó».
- **FR-007**: Un perfil que no existe DEBE tener la vista previa de hoy para ese caso: «Este perfil no
  existe» y el sitio, sin nombre, sin imagen y sin nivel.
- **FR-008**: Si en ese momento no se puede saber el nivel, la vista previa DEBE ser la de quien no
  verificó nada, con el nombre y el sitio. NUNCA DEBE adivinar un nivel.
- **FR-009**: Si se sabe el nivel pero no se puede armar la imagen, el texto debajo del título DEBE
  decir el nivel igual.
- **FR-010**: La vista previa y la imagen NO DEBEN mostrar nada que el perfil público no muestre a
  cualquiera, y de lo que muestra, solo el nombre y el nivel: ni la foto, ni la zona, ni la fecha de
  alta, ni los animales en adopción, ni quién avala ni cuántos avales tiene.
- **FR-011**: El perfil público, su dirección y que no aparezca en buscadores NO DEBEN cambiar. La
  vista previa de un animal, de una camada, del listado y de la portada tampoco.

#### La línea de «Mi perfil»

- **FR-012**: En «Mi perfil», en «Tu perfil público», entre el título y los botones de copiar y ver,
  DEBE aparecer una línea en la voz del sitio que avisa que al pegar el enlace en un chat o en un
  grupo se ve qué tiene verificado (por ejemplo «Cuando pegás este enlace en un chat o en un grupo,
  se ve qué tenés verificado.»).
- **FR-013**: La línea DEBE aparecer solo con el teléfono verificado o más. Sin nada verificado, la
  sección DEBE quedar como hoy.
- **FR-014**: Los botones de compartir de «Mi perfil», «Mis avales» y «Mis animales» NO DEBEN
  cambiar, y «Mis avales» y «Mis animales» NO DEBEN sumar la línea.

#### La medición

- **FR-015**: El momento del enlace del perfil copiado o mandado, desde «Mi perfil», «Mis avales» o
  «Mis animales», DEBE llevar, además de la pantalla que ya lleva, el nivel de ahora de quien lo
  copia o lo manda.
- **FR-016**: El momento de la visita a un perfil DEBE llevar, además del origen y lo que ya lleva,
  el nivel de ahora de la dueña del perfil, no el de quien visita.
- **FR-017**: El nivel en la medición DEBE ser una de cuatro categorías: nada, teléfono, identidad,
  identidad y aval. Quien no tiene nada verificado DEBE contarse con nada, no quedar afuera.
- **FR-018**: Si el nivel no se pudo saber, el momento DEBE contarse igual, sin nivel, NUNCA con uno
  inventado ni con un valor que parezca un nivel.
- **FR-019**: Medir NUNCA DEBE cambiar lo que la persona hace ni lo que ve: si la medición no está, no
  responde o el nivel no se puede saber, copiar, mandar y abrir un perfil DEBEN funcionar igual, sin
  ningún aviso nuevo y sin esperar a la medición.
- **FR-020**: Ninguno de estos momentos DEBE llevar el nombre, el enlace, el perfil ni nada que
  identifique a la persona o a quien visita, como los momentos de #236.
- **FR-021**: NO DEBE sumarse un momento nuevo a la medición. Los momentos que hoy no se cuentan
  (cerrar el menú de compartir sin mandar, las visitas que no se miden) NO DEBEN empezar a contarse.
- **FR-022**: En el sitio NO DEBE guardarse nada nuevo de ninguna persona: ni quién compartió su
  enlace ni quién lo abrió.

#### Cómo se lee

- **FR-023**: docs/03 §Métricas de éxito, «Cómo se leen», DEBE sumar la lectura de la historia: qué
  parte de los enlaces del perfil mandados es de gente con nada, teléfono, identidad o aval, y qué
  parte de las visitas que llegan desde un enlace de afuera es a perfiles de cada nivel, antes y
  después del día en que llega la historia; un momento sin nivel entra en los totales y no en
  ninguna categoría; y con 3 a 5 rescatistas y pocos adoptantes los números se leen como señal al
  lado de las opiniones y las encuestas.

### Key Entities

- **Nivel de la persona**: nada, teléfono, identidad, o identidad y aval, el del perfil público en
  ese instante. Ya existe; esta historia lo lee, no lo guarda en ningún lado nuevo.
- **Imagen del perfil para la vista previa**: el nivel en palabras y el sitio sobre el papel del
  cartel. Se dibuja cuando una app la pide, para quien tiene algo verificado.
- **Nivel en la medición**: una de las cuatro categorías, o ninguna si no se pudo saber. Viaja con el
  momento y no se guarda en el sitio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas, la vista previa del perfil de cada persona con el teléfono
  verificado o más dice el nivel que muestra su perfil público en ese momento, en el texto y en la
  imagen, con las mismas palabras de la ficha.
- **SC-002**: En el 100 % de las pruebas con personas sin nada verificado, con el nivel imposible de
  leer y con perfiles que no existen, la vista previa es exactamente la de hoy para ese caso, sin
  imagen ni nivel.
- **SC-003**: Recortando la imagen a su cuadrado central, como la recorta la miniatura de un chat, el
  nivel se lee entero en las tres variantes de palabras, también en la más larga, «Identidad
  verificada y avalada».
- **SC-004**: Revisando la vista previa y la imagen de cualquier perfil no se encuentra la foto, la
  zona, la fecha de alta, los animales ni los avales de nadie.
- **SC-005**: En el 100 % de las pruebas, cada enlace del perfil copiado o mandado y cada visita a un
  perfil que hoy se mide llegan a la medición con una de las cuatro categorías de nivel, o sin nivel
  cuando no se pudo saber.
- **SC-006**: En el 100 % de las pruebas con la medición caída o con el nivel imposible de leer,
  copiar el enlace muestra «Enlace copiado» igual que sin la falla y el perfil abre igual.
- **SC-007**: La línea de «Mi perfil» aparece para el 100 % de las personas con el teléfono
  verificado o más y para ninguna sin nada verificado.
- **SC-008**: Con los datos de la beta, alguien del equipo puede contestar en la herramienta de
  medición, sin otra fuente, qué parte de los enlaces del perfil mandados es de cada nivel y qué
  parte de las visitas desde un enlace de afuera llega a perfiles de cada nivel, siguiendo lo que
  dice docs/03 §Métricas de éxito.

## Assumptions

- **La imagen no lleva el nombre de la persona.** La sección Pantallas de la historia la describe
  con el nivel y el nombre del sitio; el nombre ya va en el título, y entre dos opciones va la que
  muestra menos (docs/03 §1). Sin «Quien publica» ni otro sujeto encima del nivel: en el perfil el
  nivel es de la dueña del enlace, que es lo que dice el título.
- **El texto debajo del título** son las palabras de la chapita, tal cual: «Identidad verificada».
  En la ficha de un animal hizo falta una oración que dijera de quién era el nivel («Quien publica
  tiene…», #244) porque el título es el animal; acá el título es el nombre de la persona, y el nivel
  debajo se lee como suyo. Así el texto dice las mismas palabras que el perfil, como piden los
  criterios. Hoy el perfil no tiene ese texto; con nada verificado sigue sin tenerlo.
- **Sin nada verificado** incluye a quien perdió el teléfono verificado porque otra cuenta recuperó
  el número o porque cambió de chip y no confirmó el nuevo: no tiene chapita y su perfil no muestra
  ningún nivel, así que la vista previa tampoco, y la línea de «Mi perfil» no aparece. En la medición
  cuenta como nada, que no es «sin nivel» (eso queda para cuando el nivel no se pudo saber), como en
  #236.
- **El nivel de la vista previa es el mismo que muestra el perfil público** a cualquiera sin sesión
  en ese instante, porque un lector de vista previa no tiene sesión.
- **«Copiar o mandar»** es el momento que ya existe para el enlace del perfil, desde las tres
  pantallas; esta historia no lo separa en dos ni cambia cuándo se cuenta.
- **La visita a un perfil** lleva el nivel en todos los orígenes que ya tiene (un enlace de afuera,
  el sitio, una solicitud); la lectura nueva mira sobre todo las de un enlace de afuera.
- **La línea de «Mi perfil»** usa el nivel que la pantalla ya muestra una sola vez; si ese nivel no
  se pudo saber, la línea no aparece, como para quien no verificó nada.
- **No hay un período de corte**: los momentos empiezan a llevar el nivel el día que llega la
  historia, y lo anterior queda sin él; antes de la beta solo usa el sitio el equipo.
- **Las referencias «docs/03 §Hipótesis», «docs/03 §1», «docs/03 §7», «docs/03 §Métricas de éxito»
  y «docs/09 §Dos carriles»** del cuerpo de la historia son referencias a documentos de producto, y
  los números de tres cifras son números de historias (#236, #238, #244) y la Ley 18.331.
- **Las decisiones del enjambre de la historia** (las tres del 2026-11-02 y las tres del 2026-11-21,
  product-owner) van, palabra por palabra, a docs/03 en esta rama: la primera, la segunda, la tercera,
  la quinta y la sexta a §1, y la cuarta, la de la medición, a §7, como dice cada una en su primera
  referencia. La del 2026-11-02 sobre la medición que la cuarta reemplaza no llegó nunca a docs/03,
  así que no hay nada que pasar a «Descartado».
