# Feature Specification: Portada del sitio que invita a publicar un animal y a ver los que están en adopción

**Feature Branch**: `feature/61-portada-del-sitio`

**Created**: 2026-10-05

**Status**: Draft

**Input**: Historia #61 del backlog, milestone «M2 - Publicación y difusión». El cuerpo verbatim de
la historia acompaña a esta spec (`story.md`).

**Ya construido**: la portada provisoria (el nombre del sitio en grande y la nota «Estamos
construyendo esto. Volvé pronto.», KL-57-6), que esta historia reemplaza entera. Publicar un animal
(#53), «Animales en adopción» y la ficha (#57), el ciclo de vida de la publicación con el aviso por
correo antes de vencer (#59), el ingreso sin contraseña y el perfil (#9) y el aviso de verificación
pendiente (#10) ya existen y se usan tal como están: la portada lleva a ellos, no los cambia. La
forma en que el listado muestra cada animal (foto de portada, nombre, edad, zona, «Urgente» y el
sello «En proceso») ya existe y la portada la reutiliza. La vista previa al compartir la dirección
del sitio ya trae el nombre y la descripción del sitio, pero ninguna imagen: la imagen con la
identidad del cartel es nueva.

**Vocabulario de esta spec**: la **portada** es la pantalla que abre la dirección del sitio, sin
nada después. No es la **foto de portada** de un animal (su primera foto, que el glosario de
docs/06 llama «portada»): esta spec dice siempre «foto de portada» para la foto y «portada» a
secas para la pantalla, y el glosario suma la entrada «portada del sitio». **El listado** es «Animales en adopción» (#57) y **la ficha** es la pantalla de un
animal. Un **animal a la vista** es uno que hoy aparece en el listado sin filtros, con sus reglas:
publicado, no pausado, no adoptado, no vencido, no dado de baja y con un publicador que hoy tiene
el teléfono verificado (en proceso sí se ve, con su sello). **Los más recientes** son los primeros
animales a la vista en el orden del listado: del más reciente al más viejo. **La frase** es la
oración que dice qué es el sitio. **El nombre del sitio** es el provisorio, el que hoy muestra la
cabecera, que vive en un solo lugar. **La vista previa** es lo que arman WhatsApp, Facebook y
similares al pegar un enlace. **Sin que el navegador ejecute nada** quiere decir con el navegador
que solo muestra lo que llega del servidor, como el de algunas apps o con señal mala.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La rescatista entiende el sitio y empieza a publicar desde la portada (Priority: P1)

Valeria rescata perros en Canelones. Una compañera del grupo de Facebook le dijo «probá esto» y le
pasó la dirección del sitio. La abre en el celular: arriba lee en una frase qué es el sitio, y ve
«Publicar un animal», la acción más visible de la pantalla, con «Ver animales en adopción» al lado.
Más abajo, en tres pasos, lo que el sitio le ahorra frente al grupo: publicar desde el celular con
hasta 5 fotos y los datos que los adoptantes preguntan siempre; pegar el enlace en el grupo y que se
vea con la foto, el nombre y la zona; y que el sitio le escriba por correo 7 días antes de que la
publicación venza a los 30 días, para confirmar con un toque que el animal sigue disponible. Toca
«Publicar un animal», entra con Google por primera vez, completa su perfil y llega a publicar sin
pasar de nuevo por la portada.

**Why this priority**: quien entra por la dirección del sitio es, sobre todo, el rescatista al que
se lo recomendaron, y decide en esta pantalla si vale la pena publicar acá. Es lo que mueve la
primera métrica de éxito: al menos 3 rescatistas que publiquen más de un animal por su cuenta
(docs/03 §Métricas de éxito). Sin esto la portada sigue siendo un cartel de «en construcción» con
un solo enlace.

**Independent Test**: sin sesión, abrir la dirección del sitio y ver la frase, las dos acciones y
los tres pasos, con el nombre del sitio una sola vez arriba y sin nota de construcción. Tocar
«Publicar un animal», ingresar como persona nueva, completar el perfil y llegar a publicar. Con una
cuenta con el teléfono verificado, tocar «Publicar un animal» y llegar directo a publicar. Con una
cuenta sin teléfono verificado, tocar «Publicar un animal» y ver el aviso de verificación
pendiente.

**Acceptance Scenarios**:

1. **Dado** que soy rescatista y no tengo cuenta, **cuando** abro la dirección del sitio,
   **entonces** veo qué es el sitio en una frase, «Publicar un animal», «Ver animales en adopción»,
   los tres pasos para quien rescata y, más abajo, los animales más recientes.
2. **Dado** que abro la portada, **cuando** miro las acciones, **entonces** «Publicar un animal» es
   la única acción en su forma más visible y «Ver animales en adopción» está al lado, como segunda.
3. **Dado** que no tengo cuenta, **cuando** toco «Publicar un animal» e ingreso con Google por
   primera vez, **entonces** completo mi perfil y llego a publicar un animal, sin volver a la
   portada.
4. **Dado** que no tengo cuenta, **cuando** toco «Publicar un animal» e ingreso con el enlace por
   correo, **entonces** al abrir el enlace (y completar el perfil si es la primera vez) llego a
   publicar un animal.
5. **Dado** que ingresé y tengo el teléfono verificado, **cuando** toco «Publicar un animal» en la
   portada, **entonces** llego directo a publicar.
6. **Dado** que ingresé con una cuenta sin teléfono verificado, **cuando** toco «Publicar un
   animal», **entonces** veo el aviso de verificación pendiente de #10, con el motivo y el camino
   para verificarme, y al verificarme llego a publicar.
7. **Dado** que leo los tres pasos para quien rescata, **cuando** llego al tercero, **entonces**
   dice que el sitio avisa por correo 7 días antes de que la publicación venza a los 30 días y que
   se confirma con un toque.
8. **Dado** que abro la portada, **cuando** la recorro de arriba abajo, **entonces** el nombre del
   sitio aparece una sola vez arriba (en la cabecera) y no hay ninguna nota de que el sitio está
   en construcción.
9. **Dado** que toqué «Publicar un animal» sin sesión, **cuando** abandono el ingreso o el enlace
   del correo venció, **entonces** veo el motivo en la pantalla de ingreso, como en #9, y al volver
   a intentarlo y entrar, llego a publicar: no pierdo a dónde iba.

---

### User Story 2 - Quien quiere adoptar ve animales reales y sabe que detrás hay alguien verificado (Priority: P2)

Martín quiere adoptar un gato. Entra a la dirección del sitio sin cuenta. Debajo de la presentación
lee, en pocas palabras, que mirar es libre y sin registrarse, que cada animal lo publica una persona
con el teléfono verificado y que el teléfono y el contacto de nadie están a la vista. Ve los 8
animales publicados más recientes, como en el listado, con «Ver todos». Toca a Tobi y se abre su
ficha; vuelve y toca «Ver todos», que abre «Animales en adopción» sin filtros.

**Why this priority**: un animal real convence más que una frase, a la rescatista que evalúa si
vale la pena y al adoptante que llegó por la dirección del sitio. Va segundo porque el adoptante
llega sobre todo por el enlace de una ficha (docs/03 §3), no por la portada, y porque los animales
ya se pueden ver en el listado.

**Independent Test**: con 12 animales a la vista, abrir la portada y ver los 8 más recientes en
el orden del listado, cada uno como en el listado, y «Ver todos». Tocar uno y llegar a su ficha;
tocar «Ver todos» y llegar al listado sin filtros. Pausar uno de los 8 y ver que sale y entra el
noveno. Con 3, ver 3 sin huecos. Con 0, ver el vacío. Simular que los animales no se pueden traer
y ver el error en su lugar con el resto de la portada entera.

**Acceptance Scenarios**:

1. **Dado** que abro la portada, **cuando** llego a la parte de quien quiere adoptar, **entonces**
   leo que mirar es libre y sin registrarse, que cada animal lo publica una persona con el teléfono
   verificado y que el teléfono y el contacto de nadie están a la vista.
2. **Dado** que hay 12 animales a la vista, **cuando** abro la portada, **entonces** veo los 8 más
   recientes, del más reciente al más viejo, y «Ver todos», que abre «Animales en adopción» sin
   filtros.
3. **Dado** que veo a Tobi en la portada, **cuando** lo toco, **entonces** se abre su ficha.
4. **Dado** que hay 3 animales a la vista, **cuando** abro la portada, **entonces** veo esos 3, sin
   lugares vacíos, y «Ver todos».
5. **Dado** que Simón, entre los más recientes, está marcado en proceso, **cuando** abro la portada,
   **entonces** lo veo con el sello «En proceso», igual que en el listado; y uno marcado urgente
   lleva su marca de «Urgente», igual que en el listado.
6. **Dado** que Luna estaba entre los más recientes, **cuando** su publicador la pausa, la marca
   adoptada, la da de baja, vence o el publicador pierde el teléfono verificado, **entonces** deja
   de aparecer en la portada la próxima vez que se abre y su lugar lo ocupa el siguiente del
   listado.
7. **Dado** que todavía no hay ningún animal a la vista, **cuando** abro la portada, **entonces**
   en el lugar de los animales dice «Todavía no hay animales publicados.» con la invitación a
   publicar el primero, y el resto de la portada se ve completo.
8. **Dado** que los animales no se pueden traer, **cuando** abro la portada, **entonces** el resto
   de la portada se ve completo y en el lugar de los animales dice que no se pudieron cargar, con
   el camino a «Animales en adopción».
9. **Dado** que la foto de un animal de la portada no carga, **cuando** abro la portada,
   **entonces** veo su lugar con el color borroso de la foto y el resto de la portada funciona.

---

### User Story 3 - La portada se ve bien pegada en un grupo, en la computadora y sin que el navegador ejecute nada (Priority: P3)

Valeria pega la dirección del sitio en el grupo de WhatsApp de rescatistas para recomendarlo: la
vista previa muestra el nombre del sitio, la frase de la portada y una imagen con la identidad del
cartel. Una compañera la abre desde la app de Facebook, que no ejecuta nada, y lee la portada
entera, ve los animales y los enlaces la llevan a donde dicen. Otra la abre en la computadora del
trabajo, a 1280 px: los animales se reparten en más lugares por fila que en el teléfono y ningún
bloque queda como una tira angosta con blanco al costado.

**Why this priority**: es como se recomienda el sitio entre rescatistas, que es su mecanismo de
crecimiento sin gastar (docs/03 §3). Va tercero porque la portada ya sirve en el teléfono con
P1 y P2; esto la hace viajar bien y verse bien en otros lugares.

**Independent Test**: pedir la dirección del sitio como la pide una app de mensajería y ver el
nombre, la frase y la imagen del cartel, sin ningún animal ni persona. Abrir la portada con el
navegador sin ejecutar nada y recorrerla entera, tocando «Publicar un animal», «Ver animales en
adopción», un animal y «Ver todos». Abrirla a 1280 px y a 390 px y comparar cuántos animales hay
por fila.

**Acceptance Scenarios**:

1. **Dado** que pego la dirección del sitio en un grupo de WhatsApp, **cuando** se arma la vista
   previa, **entonces** muestra el nombre del sitio, la frase de la portada y la imagen del cartel.
2. **Dado** que se arma la vista previa de la dirección del sitio, **cuando** la miro, **entonces**
   no muestra ningún animal ni ninguna persona, aunque haya animales publicados.
3. **Dado** que abro la dirección desde la app de Facebook con un navegador que no ejecuta nada,
   **cuando** carga, **entonces** leo toda la portada, veo los animales y todos los enlaces
   funcionan.
4. **Dado** que abro la portada en una computadora de 1280 px, **cuando** carga, **entonces** los
   animales se reparten en más lugares por fila que en el teléfono y ningún bloque queda angosto
   con blanco al costado.
5. **Dado** que abro la portada con sesión y sin sesión, **cuando** la comparo, **entonces** es la
   misma portada, con el mismo contenido y las mismas acciones; nadie es mandado a otra pantalla.

---

### Edge Cases

- **Exactamente 8 animales a la vista**: se ven los 8 y «Ver todos». Con más de 8, se ven 8. Con
  entre 1 y 7, se ven todos, sin huecos, y «Ver todos» igual.
- **Ningún animal a la vista pero sí pausados, vencidos o de publicadores sin teléfono**: la portada
  muestra el vacío, igual que si no hubiera ninguno; nunca muestra un animal que el listado no
  muestra.
- **Un animal deja de estar a la vista mientras alguien mira la portada**: se ve hasta que la
  portada se vuelve a abrir; al tocarlo, su ficha dice lo que dice hoy para ese estado (#57, #59).
- **Quien publicó uno de los animales mira la portada**: lo ve igual que cualquiera, como en el
  listado; la portada no tiene nada distinto para quien publica.
- **Persona que ingresó pero no completó el perfil**: toca «Publicar un animal» y completa el perfil
  antes de publicar, como en #9.
- **Nombre del sitio largo o corto** (el definitivo todavía no existe): la portada no se rompe ni
  repite el nombre; si cambia en su único lugar, la portada no se toca.
- **Foto que no carga**: el lugar del animal muestra el color borroso de su foto, con nombre, edad
  y zona legibles, y sigue abriendo su ficha.
- **Error parcial**: si fallan los animales, la frase, las acciones, los tres pasos y lo que quiere
  decir verificado se ven completos; el error ocupa solo el lugar de los animales.
- **Señal mala**: la portada llega leíble entera con lo que manda el servidor; los animales cargan
  en su lugar sin que nada salte.
- **Ancho intermedio (tablet)**: los animales ganan lugares por fila a medida que crece el ancho,
  como en el listado.
- **Animales con nombres largos o sin zona exacta**: se muestran como en el listado.

## Requirements *(mandatory)*

### Functional Requirements

**Lo que la portada dice y ofrece**

- **FR-001**: La portada MUST reemplazar a la provisoria en la dirección del sitio y MUST NOT decir
  en ningún lugar que el sitio está en construcción.
- **FR-002**: La portada MUST decir qué es el sitio en una frase, en voz de afiche, en lo primero
  que se ve.
- **FR-003**: La portada MUST ofrecer «Publicar un animal» como la acción principal y la única en su
  forma más visible, y «Ver animales en adopción» al lado, como segunda, que abre el listado sin
  filtros.
- **FR-004**: La portada MUST contar, para quien rescata, tres pasos que el sitio hace hoy:
  (1) publicar desde el celular con hasta 5 fotos y los datos que los adoptantes preguntan siempre;
  (2) pegar el enlace en el grupo y que se vea con la foto, el nombre y la zona; (3) que el sitio
  le escriba por correo 7 días antes de que la publicación venza, a los 30 días, para confirmar con
  un toque que el animal sigue disponible.
- **FR-005**: La portada MUST decir, para quien quiere adoptar, que mirar es libre y sin
  registrarse, que cada animal lo publica una persona con el teléfono verificado y que el teléfono
  y el contacto de nadie están a la vista.
- **FR-006**: La portada MUST NOT contar nada que el sitio todavía no hace (la solicitud, el
  cuestionario, el contacto al aceptar), ni mostrar cifras del sitio ni testimonios.
- **FR-007**: El nombre del sitio MUST aparecer una sola vez en lo primero que se ve (el de la
  cabecera alcanza) y MUST salir del único lugar donde vive, de modo que cambiarlo no toque la
  portada.
- **FR-008**: Todo texto de la portada MUST estar en español rioplatense con voseo, en el lugar de
  los textos del sitio.

**Publicar desde la portada**

- **FR-009**: Sin sesión, «Publicar un animal» MUST pedir ingresar y, al terminar (con el perfil
  completo si es la primera vez o si faltaba), MUST llevar a publicar, sin volver a la portada, con
  Google o con el enlace por correo.
- **FR-010**: Con sesión y teléfono verificado, «Publicar un animal» MUST llevar directo a publicar.
- **FR-011**: Con sesión y sin teléfono verificado, «Publicar un animal» MUST mostrar el aviso de
  verificación pendiente de #10, con el motivo y el camino para verificarse, que vuelve a publicar.
- **FR-012**: Si el ingreso iniciado desde «Publicar un animal» se abandona o el enlace del correo
  venció, la pantalla de ingreso MUST mostrar el motivo como en #9 y el siguiente intento MUST
  seguir llevando a publicar.

**Los animales de la portada**

- **FR-013**: La portada MUST mostrar los animales a la vista más recientes, en el orden del
  listado, hasta 8, sin ordenar por urgencia, con «Ver todos», que abre el listado sin filtros.
- **FR-014**: Cada animal MUST mostrarse como en el listado (foto de portada, nombre, edad, zona,
  la marca de «Urgente» y el sello «En proceso» cuando los tiene) y MUST abrir su ficha.
- **FR-015**: Un animal que sale del listado (pausado, adoptado, vencido, dado de baja o de alguien
  que hoy no tiene el teléfono verificado) MUST NOT aparecer en la portada la próxima vez que se
  abre; su lugar lo ocupa el siguiente del listado.
- **FR-016**: Con menos de 8 animales a la vista, la portada MUST mostrar los que hay, sin lugares
  vacíos.
- **FR-017**: Sin ningún animal a la vista, en el lugar de los animales la portada MUST decir
  «Todavía no hay animales publicados.» e invitar a publicar el primero, llevando a donde lleva
  «Publicar un animal»; el resto de la portada MUST verse completo.
- **FR-018**: Si los animales no se pueden traer, en su lugar la portada MUST decir que no se
  pudieron cargar y ofrecer el camino a «Animales en adopción»; el resto de la portada MUST verse
  completo, y «Publicar un animal» y «Ver animales en adopción» MUST seguir funcionando. Al volver
  a abrir la portada se intenta de nuevo.
- **FR-019**: Mientras los animales cargan, su lugar MUST estar reservado con la forma de los
  animales, para que nada salte al llegar.
- **FR-020**: Si la foto de un animal no carga, su lugar MUST mostrar el color borroso de la foto y
  el animal MUST seguir legible y abriendo su ficha.

**La misma portada para todos, en todos lados**

- **FR-021**: La portada MUST ser la misma con o sin sesión, rescatista o no, y MUST NOT mandar a
  nadie a otra pantalla.
- **FR-022**: La portada MUST leerse y usarse entera sin que el navegador ejecute nada: los textos,
  los animales y todos sus enlaces.
- **FR-023**: En la computadora, la portada MUST usar el ancho del cartel: los animales MUST ganar
  lugares por fila respecto del teléfono y ningún bloque MUST quedar como una tira angosta con
  blanco al costado.
- **FR-024**: La portada MUST cumplir el presupuesto de rendimiento del sitio en el teléfono: la
  parte principal visible en menos de 2,5 s y lo que salta mientras carga por debajo de 0,05, con
  red y procesador de teléfono (docs/07).

**La vista previa**

- **FR-025**: La vista previa de la dirección del sitio MUST mostrar el nombre del sitio, la frase
  de la portada y una imagen con la identidad del cartel, y MUST NOT mostrar ningún animal ni
  ninguna persona.
- **FR-026**: La imagen de la vista previa MUST tomar el nombre del sitio de su único lugar, de
  modo que cambiarlo cambie la imagen sin tocarla.

**Privacidad, buscadores y medición**

- **FR-027**: La portada MUST NOT mostrar datos de ninguna persona: de cada animal, lo mismo que el
  listado, nunca quién lo publica.
- **FR-028**: La portada MUST NOT aparecer en buscadores todavía; el sitio entero sigue fuera de los
  buscadores hasta que exista el dominio definitivo (M5).
- **FR-029**: El sitio MUST registrar: que se vio la portada; que se tocó «Publicar un animal» desde
  la portada y si esa visita terminó publicando un animal; que se tocó «Ver animales en adopción» o
  «Ver todos» desde la portada; y que se abrió una ficha desde la portada, distinguible de la ficha
  abierta desde el listado o desde un enlace de afuera.
- **FR-030**: Mirar la portada MUST NOT guardar nada que identifique a quien mira. Para contar la
  visita se usa lo mismo que el sitio ya usa en cualquier pantalla: un número al azar que agrupa
  los pasos de una visita y no dice quién es la persona.

### Key Entities

- **Animal a la vista**: el mismo de «Animales en adopción»; la portada no guarda nada nuevo de él.
  Lo que muestra: foto de portada, nombre, edad, zona, si es urgente y si está en proceso.
- **Vista previa del sitio**: el nombre del sitio, la frase de la portada y la imagen del cartel.
  No depende de ningún dato de la base.

## Pantallas

- **Portada** (reemplaza a la provisoria): la frase de qué es el sitio en voz de afiche; «Publicar
  un animal» y «Ver animales en adopción»; los tres pasos para quien rescata; lo que quiere decir
  verificado para quien adopta; los animales más recientes con «Ver todos». **Cargando**: el lugar
  de los animales reservado con su forma, el resto de la portada ya a la vista. **Vacío**:
  «Todavía no hay animales publicados.» con la invitación a publicar el primero. **Error**: en el
  lugar de los animales, que no se pudieron cargar, con el camino a «Animales en adopción»; el
  resto entero. Las partes de texto no cargan datos, así que no tienen cargando, vacío ni error
  propios.
- **Vista previa al compartir la dirección del sitio**: el nombre, la frase y la imagen del cartel.
  Vacío: no aplica. Error: si la imagen no se puede armar, la vista previa queda con el nombre y la
  frase.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona sin cuenta que abre la dirección del sitio en un teléfono de 390 px ve la
  frase, «Publicar un animal» y «Ver animales en adopción» sin desplazarse.
- **SC-002**: Desde la portada, una persona nueva llega a la pantalla de publicar en un solo
  recorrido (ingresar, completar el perfil, publicar) sin pasar de nuevo por la portada, en el
  100 % de las corridas de la prueba de punta a punta.
- **SC-003**: Los animales de la portada coinciden, uno por uno y en el mismo orden, con los
  primeros 8 del listado sin filtros, en el 100 % de los casos probados (0, 3, 8 y 12 a la vista;
  con uno pausado, adoptado, vencido o de publicador sin teléfono).
- **SC-004**: Con red y procesador de teléfono, la parte principal de la portada aparece en menos
  de 2,5 s, lo que salta queda por debajo de 0,05 y la portada pasa el freno de peso de apertura de
  150 KB.
- **SC-005**: Sin que el navegador ejecute nada, el 100 % de los textos y de los enlaces de la
  portada se ven y llevan a donde dicen.
- **SC-006**: La vista previa de la dirección del sitio muestra el nombre, la frase y la imagen del
  cartel, y ningún animal ni persona.
- **SC-007**: A 1280 px hay más animales por fila que a 390 px, y ningún bloque de la portada
  ocupa menos de la mitad del ancho de la hoja con el resto en blanco.
- **SC-008**: El nombre del sitio aparece una sola vez en la primera pantalla y la palabra
  «construyendo» no aparece en la portada.
- **SC-009**: Se puede contar, por visita, cuántas personas tocaron «Publicar un animal» desde la
  portada y cuántas de esas terminaron publicando en la misma visita, y cuántas fichas se abrieron
  desde la portada frente a las abiertas desde el listado o desde afuera.

## Assumptions

- **Alcance reducido por lo que ya existe**: el listado, la ficha, publicar, el ingreso y el aviso
  de verificación pendiente se usan como están. Esta historia no cambia qué muestran; solo la
  portada y la vista previa del sitio son nuevas. La vista previa de la ficha y del listado no
  cambia.
- **«La forma más visible»** es la de la acción principal del sistema de diseño (docs/10, una por
  pantalla). En la portada la lleva solo «Publicar un animal»: «Ver animales en adopción», «Ver
  todos», la invitación del vacío y el camino del error usan formas de menor peso, para que en
  ningún estado haya dos acciones principales.
- **«Lo primero que se ve»** es la primera pantalla sin desplazarse en un teléfono de 390 × 844.
- **«Ver animales en adopción» y «Ver todos» llevan al mismo lugar** (el listado sin filtros): uno
  es la segunda acción de arriba y el otro cierra los animales.
- **La invitación del vacío lleva a donde lleva «Publicar un animal»**, con las mismas reglas de
  sesión y verificación.
- **Los animales de la portada se actualizan al volver a abrirla**: no se refrescan solos mientras
  alguien la mira. Es lo que hace el listado.
- **Quien publica no se ve en la portada**: la regla del listado; quién publica está en la ficha.
- **El tope de 8** no cambia con el ancho: en la computadora los 8 se reparten en más lugares por
  fila (por ejemplo, 4 por fila en dos filas), en el teléfono en menos.
- **El peso de la portada** queda dentro del freno de 150 KB que ya mide la portada (historia #95).
- **Sin buscadores**: la portada se arma como pantalla encontrable (su título, su descripción y su
  contenido en lo que manda el servidor), pero el sitio sigue sin indexarse hasta M5 (docs/08
  §Encontrable); esta historia no lo prende.
- **El texto de marca** (el nombre definitivo y su eslogan) está fuera; la frase de la portada dice
  qué es el sitio, no es un eslogan, y se puede reescribir cuando llegue el nombre.
- **La medición** se registra como el resto del sitio hoy (a la consola, hasta M5), contando la
  visita con lo que el sitio ya usa en cualquier pantalla; esta historia no suma nada que
  identifique a quien mira.
- **El ingreso abandonado o vencido** (FR-012) es el de #9, que ya conserva a dónde iba la persona;
  la portada solo le pasa «publicar» como destino. Su prueba es la de #9; esta historia prueba el
  recorrido completo que sí sale bien.
- **Cierra KL-57-6** en `docs/known-limitations.md`.
- **Fuera de esta historia**, como dice `story.md`: elegir el nombre, el dominio, el logo o el
  eslogan; que la portada aparezca en buscadores; las preguntas frecuentes y su enlace en el pie
  (#8); el botón de opiniones y el contacto de soporte (M4); contar la solicitud, el cuestionario
  o el contacto al aceptar (los suma la historia de M3 que los construye); cifras y testimonios;
  filtros o búsqueda en la portada; una portada distinta por persona; videos, animaciones de
  presentación o carrusel; redes sociales; suscribirse a novedades.
