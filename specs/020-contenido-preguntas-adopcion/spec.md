# Feature Specification: Contenido que responde las preguntas que frenan una adopción

**Feature Branch**: `feature/8-contenido-preguntas-frenan-adopcion`

**Created**: 2026-10-09

**Status**: Draft

**Input**: Historia #8 del backlog, milestone «M5 - Beta cerrada». El cuerpo verbatim de la
historia acompaña a esta spec (`story.md`).

**Ya construido**: el pie del sitio con Opinar y el WhatsApp de soporte (historia #71); «Qué dice
cada nivel», la página que abre cada chapita (historia #12); el pedido de verificación de identidad
con su aviso «Qué hacemos con ellas» (historia #11); publicar un animal (#53), ver animales en
adopción y la tarjeta del enlace compartido de una ficha (#57); el compromiso de adopción (#67) y el
seguimiento a los 30 días (#69); el ingreso que conserva a dónde iba la persona (#9 y su
seguimiento); la pantalla de cuenta suspendida (#13); la medición por visita (#9 y #71). Ya en main
(Ready): ninguna página de contenido, ningún índice y ningún enlace hacia ellos. Esta spec suma las
cinco páginas, el índice y tres enlaces nuevos, y no cambia lo que dicen «Qué dice cada nivel» ni
«Qué hacemos con ellas».

**Vocabulario de esta spec**:

- **Una página de contenido** es una de las cinco páginas que responden una pregunta. Tiene: la
  **pregunta** como título; la **respuesta**, su primer párrafo; el **detalle**, todo lo que sigue;
  la **fecha de última actualización**; las **relacionadas**; y **la acción**, la única que propone.
- **Las cinco páginas**, con su pregunta de trabajo (la redacción final la ajusta el plan con
  docs/06, sin cambiar lo que pregunta), su grupo y su acción:
  1. **Cómo se verifica**: «¿Cómo se verifica a las personas y qué se muestra de ellas?» · todos ·
     verificar mi identidad.
  2. **Antes de entregar**: «¿Qué pedir y qué mirar antes de entregar un animal en adopción?» ·
     quien da en adopción · publicar un animal.
  3. **Qué exige Uruguay**: «¿Qué exige Uruguay sobre el chip, el registro (RENAC) y la
     castración?» · quien da en adopción · publicar un animal. El RENAC es el Registro Nacional de
     Animales de Compañía; la página lo explica, no solo lo nombra (docs/06 §Glosario).
  4. **Reconocer una estafa**: «¿Cómo reconocer una estafa antes de adoptar?» · quien adopta · ver
     animales en adopción.
  5. **El compromiso y los 30 días**: «¿Qué es el compromiso de adopción y qué pasa a los 30 días?» ·
     quien adopta · ver animales en adopción.
- **El índice** es la pantalla que reúne las cinco preguntas, agrupadas por a quién le sirven. Se
  llama **«Preguntas y respuestas»**, el mismo nombre en su título, en el enlace del pie y en la
  tarjeta compartida (texto de trabajo; si el plan lo ajusta con docs/06, cambia en los tres
  lugares a la vez). No es una lista de preguntas frecuentes en una sola página: cada pregunta es
  su propia página.
- **Los grupos**, en este orden: **Si das en adopción**, **Si adoptás**, **Para todos**.
- **El pie**, **Opinar** y **el WhatsApp de soporte** significan lo mismo que en la spec de #71. El
  pie ya tiene dos renglones: «¿Algo para decirnos?» con Opinar (que también está arriba, en la fila
  de la marca) y, si hay número, «¿Te trabaste?» con el WhatsApp de soporte. El enlace al índice es
  un renglón más de ese pie.
- **El pedido de verificación de identidad**, **«Qué hacemos con ellas»** y **«Acepto y elijo las
  fotos»** significan lo mismo que en la spec de #11. **«Antes de elegir las fotos»** es el momento
  del pedido en que la persona todavía no tocó «Acepto y elijo las fotos».
- **«Qué dice cada nivel»** y **las chapitas** significan lo mismo que en la spec de #12.
- **Una visita** es la de la medición del sitio (#9): empieza al abrir el sitio en un navegador y
  dura mientras ese navegador queda abierto; cerrarlo o abrir el sitio en otro navegador empieza
  otra. Nunca se une a la cuenta.
- **Una oración** termina en punto, signo de pregunta o de exclamación; el punto de una abreviatura
  («art.», «n.º», «Dr.»), de un número («Ley 18.471», «2,5») o de una sigla no cierra una oración.
- **La medición que ya existe** (#11): el pedido de verificación de identidad ya registra, por
  visita, que se abrió el pedido, el toque en «Acepto y elijo las fotos» y el envío. Esta historia
  suma la apertura de las páginas y del índice con su origen, y el toque en la acción.
- **Una fuente oficial** es el texto de una ley o un decreto publicado por el Estado uruguayo (la
  base de normas del Centro de Información Oficial, IMPO, o el sitio del Parlamento) o el sitio del
  organismo que la aplica (el Instituto Nacional de Bienestar Animal y el Ministerio de Ganadería,
  Agricultura y Pesca, o una intendencia para una norma departamental). No lo es una nota de prensa,
  otro sitio que la resuma, ni los documentos del propio proyecto (el glosario de docs/06 tampoco).
- **Lo que el sitio hace hoy** es lo que está construido en main cuando la página se escribe o se
  actualiza, no lo que está planeado.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Leer la respuesta a una pregunta, de punta a punta (Priority: P1)

Una rescatista le manda por WhatsApp a quien le pidió un gatito el enlace a «¿Cómo reconocer una
estafa antes de adoptar?». A la otra persona le llega la tarjeta con la pregunta, la abre en el
teléfono sin haber entrado nunca al sitio y en el primer párrafo, de tres oraciones como mucho, lee
la respuesta. Sigue leyendo el detalle, ve al final cuándo se actualizó, dos páginas relacionadas y
«Ver animales en adopción». Lo toca y llega al listado.

**Why this priority**: es lo que la historia promete: la pregunta que frena, respondida y
compartible. Sin las páginas no hay índice ni enlaces que tengan adónde ir.

**Independent Test**: sin sesión, con sesión, con sesión suspendida y con la conexión lenta, abrir
cada una de las cinco páginas por su enlace; contar las oraciones del primer párrafo; mirar el final;
tocar la acción; abrir las fuentes de «Qué exige Uruguay»; abrir un enlace de contenido que no existe;
pegar un enlace en WhatsApp y mirar la tarjeta.

**Acceptance Scenarios**:

1. **Dado** que abro el enlace a «Reconocer una estafa», **cuando** carga, **entonces** el título es
   la pregunta, el primer párrafo, de hasta 3 oraciones, la responde por sí solo, y al final veo
   «Ver animales en adopción».
2. **Dado** que estoy leyendo cualquiera de las cinco páginas, **cuando** llego al final,
   **entonces** veo la fecha de última actualización, sus relacionadas y una sola acción, la de esa
   página según el vocabulario.
3. **Dado** que toco una relacionada, **cuando** carga, **entonces** llego a esa página de contenido.
4. **Dado** que toco «Ver animales en adopción», **cuando** carga, **entonces** llego al listado de
   animales en adopción.
5. **Dado** que entro sin haber ingresado, **cuando** leo una página de contenido, **entonces** la
   veo completa y nada me pide registrarme ni ingresar para seguir leyendo.
6. **Dado** que leo desde el teléfono con una conexión móvil lenta (del tipo 3G lento), **cuando**
   abro cualquiera de las páginas, **entonces** leo la pregunta y la respuesta aunque ninguna imagen
   haya cargado: ninguna parte del texto depende de una imagen.
7. **Dado** que «Qué exige Uruguay» dice algo sobre el chip, el registro o la castración, **cuando**
   lo leo, **entonces** junto a eso veo la fuente oficial (el texto de la norma o el sitio del
   organismo) y puedo abrirla; al abrirla, el sitio queda donde estaba.
8. **Dado** que comparto el enlace de una página de contenido por WhatsApp, **cuando** le llega a la
   otra persona, **entonces** ve una tarjeta con la pregunta de la página, una descripción de hasta
   160 caracteres de lo que responde y el nombre del sitio, no la dirección pelada.
9. **Dado** que abro un enlace a una página de contenido que no existe o que se retiró, **cuando**
   carga, **entonces** veo que esa página no está y un enlace al índice para encontrar lo que
   buscaba; las dos se ven igual.
10. **Dado** que mi cuenta está suspendida y tengo la sesión abierta, **cuando** abro una página de
    contenido, **entonces** veo la pantalla de cuenta suspendida, como en la portada, el listado o la
    ficha de un animal.
11. **Dado** que la página no se puede mostrar por una falla, **cuando** entro, **entonces** veo que
    algo falló, puedo reintentar y tengo cómo ir al índice, sin quedarme en una pantalla en blanco.
12. **Dado** que una página necesita un ejemplo con un nombre de persona o de animal, **cuando** la
    leo, **entonces** el nombre es inventado y la página dice que el ejemplo es inventado.

---

### User Story 2 - El índice y el enlace del pie (Priority: P2)

Alguien que está mirando el listado no sabe si el chip es obligatorio. Baja al pie, ve «Preguntas y
respuestas» junto a Opinar y el WhatsApp de soporte, entra al índice y ve las preguntas en tres
grupos: primero las de quien da en adopción, después las de quien adopta y al final las de todos.
Toca «¿Qué exige Uruguay…?» y llega a la página.

**Why this priority**: es la puerta de entrada desde el sitio a las cinco páginas; sin el índice,
solo se llega a ellas por un enlace compartido. Se apoya en US1.

**Independent Test**: desde una pantalla pública, una privada y la de cuenta suspendida, mirar el
pie; abrir el índice con y sin sesión; tocar cada pregunta; ver el orden de los grupos; ver el índice
sin ninguna página publicada y con una falla.

**Acceptance Scenarios**:

1. **Dado** que estoy en cualquier pantalla del sitio, salvo la de cuenta suspendida, **cuando** miro
   el pie, **entonces** encuentro el enlace al índice en un renglón propio, junto al de Opinar y al
   del WhatsApp de soporte (si hay número).
2. **Dado** que estoy en el índice, **cuando** lo miro, **entonces** veo las cinco preguntas en tres
   grupos, en este orden: «Si das en adopción» (Antes de entregar, Qué exige Uruguay), «Si adoptás»
   (Reconocer una estafa, El compromiso y los 30 días) y «Para todos» (Cómo se verifica).
3. **Dado** que estoy en el índice, **cuando** elijo una pregunta, **entonces** llego a la página que
   la responde.
4. **Dado** que entro al índice sin haber ingresado, **cuando** carga, **entonces** lo veo completo.
5. **Dado** que todavía no hay ninguna página publicada, **cuando** entro al índice, **entonces** veo
   «Estamos escribiendo esto» y un enlace a ver animales en adopción, no una lista vacía; un grupo
   sin páginas no se muestra.
6. **Dado** que mi cuenta está suspendida y tengo la sesión abierta, **cuando** abro el índice,
   **entonces** veo la pantalla de cuenta suspendida.
7. **Dado** que el índice no se puede mostrar por una falla, **cuando** entro, **entonces** veo que
   algo falló, puedo reintentar y tengo cómo ir a ver animales en adopción.
8. **Dado** que comparto el enlace del índice por WhatsApp, **cuando** le llega a la otra persona,
   **entonces** ve una tarjeta con «Preguntas y respuestas», una descripción de hasta 160 caracteres
   y el nombre del sitio.

---

### User Story 3 - «Cómo se verifica», enlazada desde el pedido y desde los niveles (Priority: P3)

Un rescatista le exige nivel 2 a Bruno. Bruno abre el pedido de verificación de identidad y, antes
de elegir las fotos, junto a «Qué hacemos con ellas», ve «Cómo se verifica y qué se hace con tu
cédula». Lo toca, lee la página, vuelve atrás con el navegador y sigue en el mismo paso del pedido, toca «Acepto y
elijo las fotos» y lo envía. Ana abre «Qué dice cada nivel» desde la chapita de un rescatista, toca
el enlace a «Cómo se verifica» y lee, de cada nivel, las mismas palabras que acaba de leer. Al final
de «Cómo se verifica» toca «Verificar mi identidad».

**Why this priority**: es la parte que ataca la fricción de la hipótesis (docs/03 §Hipótesis) en el
momento en que aparece; se apoya en la página de US1.

**Independent Test**: con una persona sin pedido, una con el pedido en revisión, una con la
identidad verificada y sin sesión: abrir el pedido, tocar el enlace, volver atrás y ver el mismo paso;
abrir «Qué dice cada nivel» y comparar el texto de cada nivel con el de «Cómo se verifica»; tocar
«Verificar mi identidad» al final de la página en cada caso.

**Acceptance Scenarios**:

1. **Dado** que estoy en el pedido de verificación de identidad, antes de elegir las fotos,
   **cuando** miro «Qué hacemos con ellas», **entonces** junto a ese aviso, antes de «Acepto y elijo
   las fotos», veo el enlace «Cómo se verifica y qué se hace con tu cédula».
2. **Dado** que toqué ese enlace, **cuando** leo la página y vuelvo atrás con el navegador,
   **entonces** sigo en el pedido, en el mismo paso, antes de elegir las fotos, y nada de lo que vi
   en el pedido cambió.
3. **Dado** que abro «Qué dice cada nivel» desde una chapita, **cuando** busco más detalle,
   **entonces** encuentro el enlace a «Cómo se verifica».
4. **Dado** que estoy en «Cómo se verifica», **cuando** leo lo que dice de cada nivel, **entonces** lo
   que pide y lo que dice cada nivel coincide palabra por palabra con «Qué dice cada nivel», y la
   página enlaza a «Qué dice cada nivel».
5. **Dado** que estoy en «Cómo se verifica», **cuando** leo qué pasa con la cédula, **entonces** leo
   las mismas palabras que «Qué hacemos con ellas», que hoy dicen que se piden el frente de la cédula y una selfie con la
   cédula en la mano; que las ve solamente quien administra el sitio y solo mientras el pedido está
   en revisión; que se borran apenas el pedido se aprueba, se rechaza, se retira o vence a los 7
   días; que de un pedido aprobado queda solo que la identidad está verificada y el día, y de un
   rechazo el día y el motivo durante 30 días; y que nunca se guarda el número ni otro dato de la
   cédula ni lo ve nadie más, tampoco quien reciba una solicitud.
6. **Dado** que ya tengo la identidad verificada, **cuando** toco «Verificar mi identidad» al final
   de «Cómo se verifica», **entonces** veo que mi identidad ya está verificada y desde cuándo, sin
   empezar un pedido nuevo.
7. **Dado** que tengo un pedido en revisión, **cuando** toco «Verificar mi identidad», **entonces**
   veo mi pedido en revisión, como desde mi perfil, sin empezar otro.
8. **Dado** que todavía no verifiqué mi teléfono, **cuando** toco «Verificar mi identidad»,
   **entonces** se me pide verificar el teléfono primero, como desde mi perfil, y al verificarlo
   sigo en el pedido de verificación de identidad.
9. **Dado** que mi último pedido fue rechazado o venció, o llegué al tope de 3 rechazos en 30 días,
   **cuando** toco «Verificar mi identidad», **entonces** veo el estado de mi pedido como desde mi
   perfil: con rechazo o vencimiento, el motivo o el aviso y cómo pedirlo de nuevo; con el tope, el
   día en que voy a poder pedirlo.
10. **Dado** que no ingresé, **cuando** toco «Verificar mi identidad» o, en otra página, «Publicar un
   animal», **entonces** se me pide ingresar y, después de ingresar, sigo en esa acción.
11. **Dado** que toco «Publicar un animal» y todavía no verifiqué mi teléfono, **cuando** carga,
   **entonces** veo lo mismo que al ir a publicar desde cualquier otro lugar del sitio: el pedido de
   verificar mi teléfono antes de publicar.

---

### Edge Cases

- **La respuesta en el primer párrafo**: el primer párrafo de cada página tiene entre 1 y 3
  oraciones y responde la pregunta sin necesitar el detalle; ningún encabezado, aviso, imagen ni
  índice de la página va antes de él. Se comprueba leyendo solo ese párrafo: quien revisa tiene que
  poder decir la respuesta a la pregunta del título sin leer nada más.
- **Qué afirma una página sobre el sitio**: solo lo que el sitio hace hoy. Si una página quiere decir
  algo que el sitio todavía no hace, no lo dice. Cuando lo que el sitio hace cambia, la página cambia
  en la misma entrega y su fecha de última actualización también.
- **La fecha de última actualización** es el día en que cambió por última vez el texto de esa página,
  en día, mes y año, en hora de Uruguay. La pone a mano quien cambia el texto, en la misma entrega,
  y quien revisa la entrega comprueba que una página cuyo texto cambió tiene la fecha nueva.
  Arreglar un error de tipeo también la cambia; cambiar el diseño o los enlaces del pie, no. Una
  entrega que cambia los textos que «Cómo se verifica» toma de «Qué dice cada nivel» o de «Qué
  hacemos con ellas» no se puede completar sin cambiar también su fecha.
- **Lo que dice cada nivel y lo que se hace con la cédula** salen del mismo lugar que «Qué dice cada
  nivel» y que «Qué hacemos con ellas»: si alguno de esos textos cambia, «Cómo se verifica» cambia
  con él sin que nadie lo copie, y su fecha de última actualización se actualiza en esa entrega.
- **Las relacionadas** son siempre otras páginas de contenido, nunca la misma:
  - Cómo se verifica → Antes de entregar y Reconocer una estafa.
  - Antes de entregar → Qué exige Uruguay y Cómo se verifica.
  - Qué exige Uruguay → Antes de entregar y Cómo se verifica.
  - Reconocer una estafa → El compromiso y los 30 días y Cómo se verifica.
  - El compromiso y los 30 días → Reconocer una estafa y Cómo se verifica.
  Una relacionada que se retiró deja de mostrarse; si una página se queda sin relacionadas, en su
  lugar va el enlace al índice.
- **Una fuente oficial que no se puede encontrar o no respalda un requisito**: el requisito no se
  afirma. Si para uno de los tres temas (chip, RENAC, castración) no hay una fuente oficial que
  diga que es obligatorio, la página dice que no encontró una norma nacional que lo exija, no dice
  que sea obligatorio ni que no lo sea, y puede decir lo que el sitio hace sobre ese tema (por
  ejemplo, que el compromiso pide castrar al animal si no lo está), sin presentarlo como ley. Así el
  primer párrafo siempre responde: dice, tema por tema, lo que la fuente oficial respalda.
- **Perros y gatos**: si una norma trata distinto a perros y gatos, la página lo dice en ese tema; el
  primer párrafo dice lo que vale para los dos o, si no hay nada común, que depende de la especie, y
  el detalle lo separa.
- **Cada afirmación legal se comprueba antes de publicarse**: la entrega lleva, para cada dato legal
  de la página, la fuente oficial que lo respalda y la parte del texto que lo dice, para que quien
  revisa la compare; un dato sin esa comprobación no entra.
- **Una fuente oficial que se mueve de lugar**: el enlace va al texto de la norma o al sitio del
  organismo que la publica, nunca a una copia, una nota de prensa ni otro sitio que la resuma.
- **Una cita legal no es asesoramiento**: «Qué exige Uruguay» dice que resume lo que dice la norma y
  que lo que vale es el texto oficial enlazado; no aconseja qué hacer en un caso particular.
- **El compromiso no es un contrato**: «El compromiso y los 30 días» dice que el compromiso es un
  acuerdo de palabra, no un contrato legal, y nombra los mismos compromisos que el texto que aceptan
  las dos personas (#67): de quien adopta, castrar al animal si no lo está, no abandonarlo y
  devolverlo a quien lo dio si no puede tenerlo; de quien lo dio, recibirlo de vuelta. Dice también
  lo que el sitio hace hoy: que lo acepta quien dio el animal al marcarlo adoptado y quien lo adoptó
  después, que cuando lo aceptaron las dos a cada una le llega por correo, y que la adopción cuenta
  aunque quien adoptó no lo acepte.
- **Los 30 días**: la misma página dice que a los 30 días de marcar adoptado se le pide a quien
  adoptó, una sola vez y por correo, sin recordatorios, que cuente cómo va con 1 a 3 fotos y un
  texto si quiere; que lo ven solo las dos personas; y que, con la respuesta, la adopción lleva el
  sello «Adopción con seguimiento» y cuenta en el historial de las dos.
- **Qué aconsejan las páginas**: ninguna aconseja pasar el teléfono o el contacto antes de que una
  solicitud sea aceptada, ni pagar algo antes de conocer al animal y a la persona; lo que aconseja
  hacer en persona (conocerse, ver dónde va a vivir el animal) va después de aceptar. Pueden decir
  que el sitio no cobra nada ni pasa pagos entre personas, que es lo que hace hoy, y que pedir plata
  por adelantado o por el flete de un animal que no se vio es la señal de estafa más común; no
  juzgan el aporte que algunos rescatistas piden por la castración o las vacunas. No dan
  indicaciones veterinarias (edades, vacunas, tratamientos): dicen que eso se consulta con un
  veterinario.
- **Qué responde cada primer párrafo**, para poder comprobarlo:
  - Cómo se verifica: que hay tres niveles (teléfono, cédula revisada a mano, aval) y que el teléfono
    de una persona no lo ve nadie salvo la otra persona de una solicitud aceptada, y el correo,
    nadie.
  - Antes de entregar: qué pedir (el nivel de verificación y el cuestionario de la solicitud) y qué
    mirar (el perfil, los avales y el historial de adopciones con seguimiento).
  - Qué exige Uruguay: tema por tema (chip, RENAC, castración), lo que respalda la fuente oficial.
  - Reconocer una estafa: la señal principal (pedir plata por adelantado o por el flete de un animal
    que no se vio) y que el sitio no cobra nada.
  - El compromiso y los 30 días: que es un acuerdo de palabra entre las dos personas y no un
    contrato, y que a los 30 días se le pide a quien adoptó que cuente cómo va.
- **Qué se muestra de una persona**: «Cómo se verifica» lo dice como el sitio lo hace hoy: lo que ve
  cualquiera en el perfil público y junto a quien publica o solicita, y que el teléfono y el contacto
  nunca son públicos y se ven solo cuando una solicitud fue aceptada.
- **Dónde está el enlace en el pedido**: solo mientras la persona no tocó «Acepto y elijo las
  fotos». Después de aceptar (eligiendo o subiendo las fotos) ya no está, porque ir y volver podría
  perder las fotos; con el pedido en revisión, rechazado, vencido o con la identidad verificada no
  hay pedido que llenar y el enlace tampoco está.
- **Volver desde «Cómo se verifica» al pedido**: el enlace abre la página en la misma pestaña, y
  volver atrás con el navegador devuelve al pedido antes de elegir las fotos; como todavía no se
  eligió nada, no hay nada que perder. La página no suma un botón «Volver». Si la persona abre el
  enlace en otra pestaña, el pedido queda como estaba en la suya.
- **Abrir «Cómo se verifica» desde el pedido con una sesión vencida**: la página se lee igual,
  porque es pública; al volver al pedido, el pedido pide ingresar como lo haría sin la página.
- **«Cómo se verifica» desde «Qué dice cada nivel» con una chapita resaltada**: el enlace lleva a la
  página entera, sin resaltar ningún nivel.
- **El pie en la pantalla de cuenta suspendida** no muestra el enlace al índice: para una cuenta
  suspendida el índice y las páginas muestran esa misma pantalla, y un enlace que vuelve al mismo
  lugar no sirve. Opinar y el WhatsApp de soporte siguen ahí, como dice #71.
- **Una página de contenido retirada** se ve igual que una que nunca existió para la persona: que esa
  página no está y el enlace al índice. En esta historia no se retira ninguna: las cinco son
  estables, así que decirles a los buscadores que una retirada «ya no existe», como una publicación
  que expira, queda para la primera entrega que retire una (limitación aceptada).
- **El enlace compartido de una página que no existe** arma una tarjeta con solo el nombre del sitio,
  como el de un animal que no existe (#57).
- **Una dirección de contenido que no es exactamente la de una página** (otras mayúsculas, una
  palabra cambiada) se ve como una página que no existe, con el enlace al índice; nunca una
  pantalla rota. Una barra de más al final lleva a la misma página.
- **El índice con algunas páginas y no todas** (posible solo en el futuro): muestra solo las
  publicadas, en sus grupos, y un grupo sin páginas no aparece.
- **Ninguna página usa datos de una persona real ni de un animal publicado**: ni un nombre, ni una
  foto, ni una captura de una ficha o un perfil de verdad.
- **Abrir una página desde un buscador**: no aplica todavía; las páginas quedan fuera de los
  buscadores como todo el sitio hasta la historia que prende la indexación (#76).
- **Dos pestañas o un doble toque**: no hay nada que guardar; tocar dos veces una acción lleva una
  sola vez a su destino.
- **De dónde llegó** (medición): una página de contenido cuenta como abierta desde «el índice», «Qué
  dice cada nivel», «el pedido» u «otra página de contenido» solo cuando se llegó por el enlace de
  ese lugar; cualquier otra llegada, también escribir la dirección o abrir un enlace compartido, es
  «un enlace de afuera». El índice cuenta como abierto desde «el pie» cuando se llegó desde una
  pantalla del sitio, y desde «un enlace de afuera» si no. Recargar cuenta como otra apertura, con el
  mismo origen. Las aplicaciones que piden el enlace para armar su tarjeta, las mismas que ya no
  cuentan en la ficha de un animal (#57), no cuentan como una apertura. Del origen se
  guarda solo cuál es, nunca la dirección de la que se vino.

## Pantallas

En todas: el **cargando** de una pantalla es un esqueleto con su forma; el **error al cargar** dice
que algo falló, ofrece «Reintentar» y una salida (al índice desde una página, a ver animales desde el
índice). Las páginas y el índice son públicos, se leen enteros sin ingresar y quedan fuera de los
buscadores hasta #76, pero su enlace compartido arma la tarjeta.

- **Índice de contenido** (nuevo): un título, las preguntas agrupadas en «Si das en adopción», «Si
  adoptás» y «Para todos», en ese orden, cada una con su pregunta como enlace. Vacío: «Estamos
  escribiendo esto» y un enlace a ver animales en adopción. Error: lo de arriba.
- **Página de contenido** (nueva, cinco): la pregunta como título, la respuesta, el detalle (con
  sus fuentes donde cita una norma), y al final la fecha de última actualización, las relacionadas y
  la acción. Vacío: no aplica, siempre tiene texto. Error: lo de arriba.
- **Página de contenido que no está** (nueva): dice que esa página no está y enlaza al índice. Vacío:
  no aplica.
- **Pie del sitio** (cambia, de #71): suma el enlace al índice, junto a Opinar y el WhatsApp de
  soporte, en todas las pantallas salvo la de cuenta suspendida. Vacío: no aplica.
- **Pedido de verificación de identidad** (cambia, de #11): suma, junto a «Qué hacemos con ellas» y
  antes de «Acepto y elijo las fotos», el enlace «Cómo se verifica y qué se hace con tu cédula».
  Vacío: no aplica.
- **Qué dice cada nivel** (cambia, de #12): suma el enlace a «Cómo se verifica». Vacío: no aplica.

## Requirements *(mandatory)*

### Functional Requirements

#### Las páginas

- **FR-001**: El sitio tiene las cinco páginas de contenido del vocabulario, cada una con su
  pregunta como título y una dirección propia que no cambia.
- **FR-002**: El primer párrafo de cada página tiene entre 1 y 3 oraciones, va antes que cualquier
  otra cosa debajo del título y responde la pregunta por sí solo. El detalle va después.
- **FR-003**: Al final de cada página, en el orden de lectura y en el teléfono, están, en este orden,
  la fecha de última actualización, las relacionadas de los casos borde y una sola acción, la de su
  página según el vocabulario; en una pantalla ancha ese cierre puede ir al costado del texto, con
  el mismo orden. Ninguna página propone otra acción.
- **FR-004**: Las acciones llevan a donde lleva el resto del sitio: «Verificar mi identidad» al
  pedido de verificación de identidad, que muestra lo mismo que desde «Mi perfil» para cada estado
  de la persona (con el perfil sin completar, completarlo primero y después el pedido; con la
  identidad verificada pero el teléfono cambiado y sin confirmar, que al confirmarlo vuelve a nivel
  2; sin teléfono verificado, el pedido de verificar el teléfono primero; sin pedido, el
  pedido; en revisión, su pedido; rechazado o vencido, el estado y cómo pedirlo de nuevo; con el
  tope, cuándo puede pedirlo; verificada, que lo está y desde cuándo); «Publicar un animal» a
  publicar, con sus requisitos de siempre; «Ver animales en adopción» al listado.
- **FR-005**: Si una acción exige haber ingresado y la persona no ingresó, se le pide ingresar y,
  después de ingresar, sigue en esa acción.
- **FR-006**: Las páginas y el índice son públicos: se leen enteros sin ingresar, y nada pide
  registrarse para seguir leyendo.
- **FR-007**: Una cuenta suspendida con la sesión abierta ve la pantalla de cuenta suspendida en
  lugar de cualquier página de contenido o del índice.
- **FR-008**: Lo que una página afirma sobre el sitio es lo que el sitio hace hoy: los niveles de
  verificación, qué se muestra de una persona, qué pasa con la cédula, el compromiso de adopción y el
  seguimiento a los 30 días.
- **FR-009**: «Cómo se verifica» describe lo que pide y lo que dice cada nivel con las mismas
  palabras que «Qué dice cada nivel» (hoy: nivel 1 «Pide un celular uruguayo, confirmado con un
  código.» y «Dice que tiene un teléfono uruguayo confirmado.»; nivel 2 «Pide la cédula, revisada a
  mano por una persona.» y «Dice que es una persona real con cédula uruguaya vigente. No dice que su
  nombre sea el de la cédula.»; nivel 3 «Pide el aval de otra persona con nivel 2.» y «Dice que
  alguien con nivel 2 responde por esta persona, con su nombre a la vista.»), y enlaza a «Qué dice
  cada nivel». Lo que dice de las imágenes de la cédula son las mismas palabras que «Qué hacemos con
  ellas» (US3 escenario 5). Puede sumar otros datos del proceso que el sitio cumple hoy: la revisión
  a mano, la espera anunciada de hasta 2 días, el aviso del resultado por correo, el vencimiento a
  los 7 días, el tope de 3 pedidos rechazados en 30 días, y que el perfil público muestra el mes y
  el año en que se verificó la identidad, no el día.
- **FR-010**: «El compromiso y los 30 días» dice que el compromiso no es un contrato legal, nombra
  los mismos compromisos que el texto que aceptan las dos personas y describe el seguimiento a los
  30 días, con lo de los casos borde.
- **FR-011**: Todo dato sobre la ley uruguaya (chip, RENAC, castración) muestra, junto al dato, el
  enlace a su fuente oficial, según el vocabulario. Un requisito que no se puede respaldar con una
  fuente oficial no se afirma, y la página dice qué hace en ese caso según los casos borde.
- **FR-012**: Cada página muestra cuándo se actualizó por última vez, con la regla de los casos borde.
- **FR-013**: Ninguna página usa datos de una persona real ni de un animal publicado; un ejemplo con
  nombre usa uno inventado y la página dice que es inventado.
- **FR-014**: El texto de cada página se lee aunque las imágenes no hayan cargado o no carguen
  nunca.
- **FR-015**: Un enlace a una página de contenido que no existe o que se retiró muestra que esa
  página no está y el enlace al índice, igual en los dos casos.
- **FR-016**: El contenido se escribe y se cambia como el resto del sitio, en una entrega; no hay
  forma de escribirlo ni editarlo desde el sitio.
- **FR-017**: Ninguna página aconseja pasar el contacto antes de una solicitud aceptada, ni pagar o
  cobrar nada, ni da indicaciones veterinarias, según los casos borde.

#### El índice

- **FR-020**: El índice muestra las páginas publicadas agrupadas en «Si das en adopción», «Si
  adoptás» y «Para todos», en ese orden, con la asignación del vocabulario; cada pregunta lleva a su
  página.
- **FR-021**: Sin ninguna página publicada, el índice muestra «Estamos escribiendo esto» y un enlace a
  ver animales en adopción; un grupo sin páginas no aparece.

#### Los enlaces nuevos

- **FR-030**: El pie de todas las pantallas, salvo la de cuenta suspendida, lleva el enlace al
  índice junto a Opinar y al WhatsApp de soporte.
- **FR-031**: El pedido de verificación de identidad lleva, junto a «Qué hacemos con ellas» y antes
  de «Acepto y elijo las fotos», el enlace «Cómo se verifica y qué se hace con tu cédula»; al volver
  de la página, la persona sigue en el mismo paso del pedido.
- **FR-032**: «Qué dice cada nivel» lleva el enlace a «Cómo se verifica».
- **FR-033**: Lo que dicen «Qué dice cada nivel» y «Qué hacemos con ellas» no cambia.

#### Compartir y buscadores

- **FR-040**: El enlace de cada página de contenido, compartido por WhatsApp u otra aplicación que
  arma tarjetas, muestra la pregunta de la página, una descripción de hasta 160 caracteres de lo que
  responde, el nombre del sitio y la misma imagen que la portada; el del índice, «Preguntas y
  respuestas», su descripción, el nombre del sitio y esa imagen.
- **FR-041**: Las páginas y el índice quedan fuera de los buscadores, como todo el sitio, hasta la
  historia que prende la indexación (#76), y aun así arman la tarjeta del enlace compartido, con la
  misma excepción que la ficha de un animal (#57).

#### Medición

- **FR-050**: Se registra cada apertura de una página de contenido, con la página y de dónde llegó la
  persona: el índice, «Qué dice cada nivel», el pedido de verificación de identidad, otra página de
  contenido o un enlace de afuera; y cada apertura del índice, con si llegó desde el pie o de
  afuera. Con la regla de los casos borde.
- **FR-051**: Se registra cada toque en la acción de una página, con la página y la acción. Si otro
  enlace de la misma pantalla lleva al mismo lugar que la acción (la cabecera del sitio), puede
  contarse como la acción; es un límite aceptado de la medición.
- **FR-052**: Se puede saber, por visita, si quien abrió «Cómo se verifica» desde el pedido de
  verificación de identidad tocó «Acepto y elijo las fotos» y envió el pedido en esa misma visita, y
  compararlo con las visitas al pedido que no la abrieron, uniendo por visita la apertura de FR-050
  con lo que el pedido ya registra (vocabulario, «La medición que ya existe»).
- **FR-053**: Ningún registro lleva el nombre, el correo, el teléfono, la cuenta ni otro dato de la
  persona; la medición es por visita y nunca se une a la cuenta, como la de todo el sitio.

### Key Entities *(include if feature involves data)*

- **Página de contenido**: su pregunta, su dirección, su grupo, la respuesta, el detalle, las fuentes
  oficiales que cita, la fecha de última actualización, sus relacionadas y su acción. Es texto fijo
  del sitio, no lo escribe nadie desde el sitio, y no guarda nada de nadie.
- **Grupo**: a quién le sirve una página (quien da en adopción, quien adopta, todos), con su orden en
  el índice.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En las cinco páginas, el primer párrafo tiene como mucho 3 oraciones y contiene lo que
  los casos borde dicen que tiene que responder esa página.
- **SC-002**: En un teléfono de 390 × 844 px, con la cabecera del sitio y el tamaño de letra por
  defecto, la pregunta y el primer párrafo de cada página se ven sin bajar.
- **SC-003**: En el 100 % de las pruebas, el texto de cada nivel en «Cómo se verifica» es idéntico al
  de «Qué dice cada nivel», y el de la cédula, al de «Qué hacemos con ellas».
- **SC-004**: El 100 % de los datos legales de «Qué exige Uruguay» tiene junto un enlace que abre una
  fuente oficial, y la comprobación de la entrega muestra, para cada uno, la parte de la fuente que
  lo dice.
- **SC-005**: Desde cualquier pantalla del sitio con el pie (todas, salvo la de cuenta suspendida), se llega a cualquiera
  de las cinco páginas en como mucho 2 toques (el enlace del pie y la pregunta en el índice).
- **SC-006**: En el 100 % de las pruebas, ir desde el pedido a «Cómo se verifica» y volver deja a la
  persona en el mismo paso del pedido.
- **SC-007**: En el 100 % de las pruebas, cada página y el índice se leen enteros sin sesión, y una
  cuenta suspendida con sesión ve la pantalla de cuenta suspendida.
- **SC-008**: Con la medición de la beta, el equipo puede leer qué página se abre más, de dónde llega
  la gente y qué parte toca la acción, y la proporción de visitas que envían el pedido de
  verificación de identidad con y sin abrir «Cómo se verifica», sin ningún dato de las personas.
- **SC-009**: Las páginas cumplen el presupuesto de performance del sitio en el teléfono, medido como
  el resto del sitio (la respuesta se ve en menos de 2,5 s en la prueba móvil de referencia).

## Assumptions

- **Ya en main** (Ready): el pie (#71), «Qué dice cada nivel» (#12) y el pedido de verificación de
  identidad con «Qué hacemos con ellas» (#11), que esta historia extiende sin reemplazar. Ninguna
  página de contenido, índice ni enlace hacia ellos.
- La historia tiene la etiqueta «lista», no tiene comentarios, y su cuerpo con las «Decisiones del
  enjambre» (las últimas del 2026-10-09) es la fuente. Las referencias como «docs/01 §Situación
  actual» son a documentos del proyecto; «Ley 18.331» es una ley.
- **Decisiones del enjambre**: las nueve de la historia se copian palabra por palabra a su doc en
  esta rama: siete a docs/08 §Encontrable y las dos sobre el enlace desde el pedido y lo que se mide
  a docs/03 §7.
- **La pregunta de cada página** está en el vocabulario como pregunta de trabajo; el plan ajusta la
  redacción final con docs/06 sin cambiar lo que pregunta (decisión de esta spec).
- **El grupo de cada página** sigue a su acción (decisión de esta spec): las dos que proponen
  publicar van con quien da en adopción, las dos que proponen ver animales con quien adopta, y
  «Cómo se verifica», que sirve a los dos lados, con todos.
- **Las relacionadas** son dos por página, con la lista fija de los casos borde (decisión de esta
  spec): la otra del mismo grupo más «Cómo se verifica», y para esta, una de cada grupo que toca la
  verificación. La historia pide «las páginas relacionadas» sin decir cuáles.
- **El pie de la pantalla de cuenta suspendida no lleva el enlace al índice** (decisión de esta
  spec, desvío deliberado del «cualquier pantalla del sitio» de la historia): «cualquier pantalla del sitio» se lee como las pantallas desde las que el índice sirve; para
  una cuenta suspendida, la historia misma manda el índice a la pantalla de cuenta suspendida, y un
  enlace que vuelve al mismo lugar es un callejón sin salida.
- **El nombre del índice** es «Preguntas y respuestas» en el pie, en su título y en la tarjeta
  (decisión de esta spec): «Preguntas frecuentes» chocaba con lo que la historia excluye, una lista
  de preguntas frecuentes en una sola página, y un solo nombre en los tres lugares no confunde.
- **Sin botón «Volver»** en «Cómo se verifica» (decisión de esta spec): la historia pide volver al
  mismo paso, y volver atrás con el navegador lo hace sin sumar un estado más; un «Volver» que solo
  aparece según de dónde se llegó es otra cosa para medir y explicar.
- **Una retirada se ve igual que una que nunca existió** (decisión de esta spec): la historia los
  pone en un mismo caso, y en esta historia no se retira ninguna.
- **«El título y la pregunta» de la tarjeta compartida**: como el título de cada página es su
  pregunta, la tarjeta muestra la pregunta como título, una descripción de lo que responde, el
  nombre del sitio y la imagen de la portada (decisión de esta spec): una imagen por página es
  trabajo y peso sin decir nada que la pregunta no diga.
- **Los orígenes de la medición** (FR-050, decisión de esta spec): la historia nombra cinco (el
  índice, el pie, «Qué dice cada nivel», el pedido y un enlace de afuera). El pie lleva al índice y
  no a una página, así que «el pie» se mide en la apertura del índice. «Otra página de contenido»
  se suma porque las relacionadas son un camino que esta misma historia crea, y contarlo como «de
  afuera» falsearía ese origen.
- **«Aceptan y envían en esa misma visita»** es tocar «Acepto y elijo las fotos» y después enviar el
  pedido, los dos en la misma visita (decisión del 2026-10-09 de la historia).
- **Retirar una página** no ocurre en esta historia: las cinco son estables. El comportamiento de una
  retirada se define para que un enlace compartido viejo no termine en una pantalla rota el día que
  una se retire.
- **El estado vacío del índice** es teórico con cinco páginas fijas, pero la historia lo pide y
  protege el día en que se retire alguna.
- **Qué exige Uruguay**: el contenido legal se investiga contra las fuentes oficiales al escribir la
  página; esta spec no afirma de antemano qué exige la ley sobre cada tema, solo qué cuenta como
  fuente, cómo se respalda y se comprueba lo que se afirma, y qué dice la página cuando no hay
  respaldo. El glosario de docs/06 («Microchip obligatorio») no es una fuente: es una guía de
  traducción. Si lo que respalda la fuente oficial no coincide con esa fila, la misma entrega
  corrige la fila de docs/06 para que diga lo mismo que la página.
- **Fuera de esta historia**, como dice su alcance: blog con fechas, autores, categorías o
  comentarios; escribir o editar el contenido desde el sitio; contenido en otro idioma; videos,
  descargables o newsletter; una lista de veinte preguntas en una sola página; contenido de quienes
  usan el producto; cambiar «Qué dice cada nivel» o «Qué hacemos con ellas»; asesoramiento legal o
  veterinario más allá de citar la norma; y prender la indexación (#76).
