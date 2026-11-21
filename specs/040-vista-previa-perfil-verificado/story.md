## Historia
**Como** persona que se presenta por WhatsApp o en un comentario de un grupo de Facebook, para dar o
para pedir un animal, **quiero** que la vista previa del enlace de mi perfil diga qué tengo
verificado **para** que del otro lado vean que soy alguien verificado antes de tocar el enlace.

## Contexto
Desde #244 la vista previa del enlace de un animal dice qué tiene verificado quien lo publicó. La del
perfil quedó afuera a propósito y hoy muestra el nombre y el sitio, nada más (#12). Pero el perfil es
lo que alguien manda cuando se presenta en un chat o en un grupo, y quien adopta no tiene animales
para compartir: su verificación hoy no sale nunca del sitio. Si los que verificaron mandan su perfil
más que los que no, y si su enlace trae más visitas, la gente valora la verificación también afuera,
en el terreno de Facebook, que es lo que pregunta docs/03 §Hipótesis.

Se escribió como historia corta y la revisión la mandó a refinar: suma el nivel a dos momentos
de la medición, y eso es carril feature (docs/09 §Dos carriles). Esta versión es la historia completa.

## Alcance
- Incluye: en la vista previa del enlace de un perfil, el nivel de la persona en palabras, las mismas
  de la ficha y de la tarjeta del listado: «Teléfono verificado», «Identidad verificada» o «Identidad
  verificada y avalada». Va en una imagen hecha para el perfil y en el texto que acompaña al título,
  para que se lea también en la miniatura chica de un chat. En «Mi perfil», debajo de «Tu perfil
  público», una línea que avisa que al pegar el enlace se ve qué tiene verificado, solo si tiene algo
  verificado. En la medición, el nivel de la persona cuando copia o manda el enlace de su perfil, y
  el nivel de la dueña del perfil en cada visita a un perfil.
- No incluye (explícito): la foto, la zona, la fecha de alta, los animales en adopción ni quién
  avala o cuántos avales tiene, en la vista previa · decir «Todavía no se verificó» en la vista previa
  de quien no verificó nada · cambiar el perfil público, su dirección o que no aparezca en buscadores
  · cambiar la vista previa de un animal, de una camada, del listado o de la portada · actualizar las
  vistas previas que WhatsApp o Facebook ya guardaron de un enlace pegado antes · un botón nuevo para
  compartir el perfil o cambiar los que ya hay en «Mi perfil», «Mis avales» y «Mis animales» · la
  línea nueva en «Mis avales» o «Mis animales» · sumar un momento nuevo a la medición · guardar en el
  sitio quién compartió su enlace o quién lo abrió.

## Reglas de negocio
- La vista previa dice el nivel que la persona tiene cuando WhatsApp o Facebook la leen, el mismo que
  muestra su perfil público en ese momento. Nunca uno más alto: si le retiraron el aval o cambió de
  chip sin confirmar el número nuevo, dice el que le quedó.
- Sin nada verificado, la vista previa queda como hoy: el nombre y el sitio, sin imagen para el
  perfil y sin «Todavía no se verificó».
- Un perfil que no existe, que se borró, que no terminó el alta o de una persona suspendida tiene la
  vista previa de hoy para un perfil que no existe: «Este perfil no existe» y el sitio, sin nombre, sin
  imagen y sin nivel.
- Si en ese momento no se puede saber el nivel, la vista previa queda como la de quien no verificó
  nada. Nunca se adivina un nivel.
- La vista previa muestra solo el nombre que la persona eligió (como hoy) y su nivel. Nada de lo que
  el perfil público no muestra a cualquiera.
- La línea de «Mi perfil» aparece solo con el teléfono verificado o más.
- La medición lleva el nivel como una de cuatro categorías (nada, teléfono, identidad, identidad y
  aval), sin el nombre, el enlace ni nada que identifique a la persona. Si el nivel no se pudo saber,
  el momento se cuenta igual, sin nivel.

## Criterios de aceptación
### Camino feliz
- **Dado** que Carla tiene la identidad verificada **cuando** copia el enlace de su perfil desde «Mi
  perfil» y lo pega en un chat de WhatsApp **entonces** la vista previa muestra su nombre y el del
  sitio, y dice «Identidad verificada» en la imagen y en el texto debajo del título, sin su foto, su
  zona ni nadie que la avale.
- **Dado** que Marta tiene solo el teléfono verificado y Ana tiene la identidad verificada y un aval
  **cuando** alguien pega el enlace del perfil de cada una en un grupo de Facebook **entonces** la de
  Marta dice «Teléfono verificado» y la de Ana «Identidad verificada y avalada», las mismas palabras
  que muestra su perfil público en ese momento.
- **Dado** que Carla tiene algo verificado **cuando** abre «Mi perfil» **entonces** debajo de «Tu
  perfil público», entre el título y los botones de copiar y ver, lee una línea que le dice que al
  pegar el enlace en un chat o en un grupo se ve qué tiene verificado.
- **Dado** que Carla copia o manda el enlace de su perfil desde «Mi perfil», «Mis avales» o «Mis
  animales» **cuando** la medición lo cuenta **entonces** lleva la pantalla, como hoy, y el nivel de
  Carla en ese momento; **y cuando** alguien abre el perfil de Carla **entonces** la visita lleva su
  origen, como hoy, y el nivel de Carla en ese momento.

### Casos borde
- **Dado** que Bruno todavía no verificó nada **cuando** alguien pega el enlace de su perfil
  **entonces** la vista previa es la de hoy, con su nombre y el sitio, sin imagen ni nivel, y sin
  «Todavía no se verificó»; **y cuando** Bruno abre «Mi perfil» **entonces** la línea nueva no
  aparece y la sección queda como hoy.
- **Dado** que a Ana le retiraron el aval y le quedó la identidad verificada **cuando** alguien pega
  por primera vez el enlace de su perfil **entonces** la vista previa dice «Identidad verificada»;
  **y dado** que Marta cambió de chip y no confirmó el número nuevo **entonces** la vista previa es
  la de quien no verificó nada, nunca un nivel más alto que el que muestra su perfil.
- **Dado** que Carla pegó su enlace en un grupo cuando tenía el teléfono verificado y después
  verificó la identidad **cuando** alguien mira esa vista previa vieja en el grupo **entonces** sigue
  diciendo lo que WhatsApp o Facebook guardaron; al tocarla, su perfil dice «Identidad verificada».
- **Dado** que Bruno no verificó nada **cuando** copia el enlace de su perfil **entonces** la medición
  lo cuenta con el nivel «nada», no lo deja afuera.
- **Dado** que Carla toca «Compartir» y cierra el menú del teléfono sin mandar nada **cuando** vuelve
  a «Mi perfil» **entonces** no se cuenta ningún enlace mandado, como hoy.

### Errores y rechazos
- **Dado** que el enlace es de un perfil que no existe, que se borró, que no terminó el alta o de una
  persona suspendida **cuando** alguien lo pega **entonces** la vista previa dice «Este perfil no
  existe» y el sitio, sin nombre, sin imagen y sin nivel.
- **Dado** que en ese momento no se puede saber el nivel de Ana **cuando** alguien pega el enlace de
  su perfil **entonces** la vista previa es la de quien no verificó nada, con su nombre y el sitio; y
  si se puede saber el nombre pero no armar la imagen, el texto debajo del título igual dice el nivel.
- **Dado** que no se pudo saber el nivel de Carla **cuando** copia su enlace o alguien abre su perfil
  **entonces** el momento se cuenta igual, sin nivel, y Carla no ve ningún error ni demora.

## Pantallas
- **Vista previa del enlace de un perfil** (la imagen que leen WhatsApp y Facebook, y su texto): el
  papel del cartel con el nivel en palabras en el verde de lo verificado y el nombre del sitio, sin
  foto de la persona, con el nivel dentro del centro que muestra la miniatura chica de un chat. El
  texto debajo del título dice el nivel. Vacío (nada verificado, un nivel que no se pudo saber o un
  perfil que no existe): queda como hoy, con el nombre o «Este perfil no existe», y el sitio.
- **«Mi perfil», sección «Tu perfil público»**: la línea nueva entre el título y los botones de
  copiar y ver, en la voz del sitio (por ejemplo «Cuando pegás este enlace en un chat o en un grupo,
  se ve qué tenés verificado.»). Vacío (sin nada verificado): la sección queda como hoy.

## Datos personales
- No se guarda nada nuevo de la persona. La vista previa muestra su nombre, como hoy, y su nivel, que
  ya ve cualquiera que abra su perfil público. No lleva foto, zona, fecha de alta, animales ni avales.
- Una vista previa pegada vive en chats y grupos que el sitio no puede borrar: si la persona borra su
  cuenta, su perfil pasa a «Este perfil no existe», pero lo que WhatsApp o Facebook ya guardaron
  queda en sus copias, como pasa hoy con el nombre.
- La medición lleva el nivel como una de cuatro categorías, sin el nombre, el enlace ni nada que
  identifique a la persona o a quien visita, como los momentos de #236.

## Medición
- No se suma un momento. Dos momentos que ya existen suman el nivel: el enlace del perfil que se
  copia o se manda (desde «Mi perfil», «Mis avales» o «Mis animales») lleva el nivel de quien lo
  manda, y la visita a un perfil lleva el nivel de la dueña del perfil, al lado del origen que ya trae
  (un enlace de afuera, el sitio o una solicitud).
- docs/03 §Métricas de éxito gana una lectura: qué parte de los enlaces mandados es de gente con
  nada, teléfono, identidad o aval, y qué parte de las visitas que llegan desde un enlace de afuera
  es a perfiles de cada nivel, antes y después del día en que llega la historia. Con 3 a 5
  rescatistas y pocos adoptantes los números son chicos: se leen como señal al lado de las
  opiniones y las encuestas.

## Decisiones del enjambre
- **Decisión (2026-11-02, product-owner):** la vista previa del enlace de un perfil lleva el nivel en
  palabras, en una imagen hecha para el perfil y en el texto, y no la foto, la zona, la fecha de alta
  ni quién avala. Cambia lo que #12 dejó en su vista previa (solo el nombre y el sitio, sin imagen
  para el perfil). Motivo: el nivel ya lo ve cualquiera que abra el perfil, así que no cambia quién ve
  qué, y #244 ya lo puso en la vista previa de un animal con el mismo argumento; lo nuevo es que quien
  adopta se presenta con su perfil y no con un animal. El resto queda afuera porque una vista previa
  pegada vive en chats y grupos que el sitio no puede borrar, y entre dos opciones va la que muestra
  menos (Ley 18.331). (docs/03 §1)
- **Decisión (2026-11-02, product-owner):** sin nada verificado, la vista previa queda como hoy y no
  dice «Todavía no se verificó». Motivo: la persona puede pegar su enlace sin saber cómo se ve, y un
  «no verificado» a la vista de un grupo entero la expone más que el perfil, que ya lo dice a quien
  entra; entre dos opciones va la que muestra menos (Ley 18.331). (docs/03 §1)
- **Decisión (2026-11-02, product-owner):** la línea de «Mi perfil» aparece solo con algo verificado.
  Motivo: a quien no verificó nada le prometería una vista previa que no muestra nada, y el camino
  para verificar ya está en la misma pantalla. (docs/03 §1)
- **Decisión (2026-11-21, product-owner):** reemplaza la de la medición del 2026-11-02. No se suma un
  momento; el enlace del perfil que se copia o se manda suma el nivel de quien lo manda, y la visita a
  un perfil suma el nivel de la dueña del perfil. docs/03 §Métricas de éxito gana la lectura de
  arriba. Motivo: con el nivel solo en los enlaces mandados se ve si quien verificó se presenta más
  con su perfil, pero no si su enlace trae a más gente; las visitas ya traen el origen (#12) y, con el
  nivel de la dueña, se comparan las que llegan desde afuera a perfiles verificados contra las que
  llegan a los que no, como ya se hace con la visita a una ficha y el nivel de quien publicó (#236). El nivel es una de
  cuatro categorías y no identifica a nadie. Un momento nuevo agregaría datos sin agregar una
  pregunta, como se decidió en #238 y #244. (docs/03 §7 y §Métricas de éxito)
- **Decisión (2026-11-21, product-owner):** si el nivel no se puede saber, la vista previa queda como
  la de quien no verificó nada, y el momento de la medición se cuenta sin nivel. Motivo: un nivel
  adivinado puede ser más alto que el real, y eso engaña justo a quien decide si confiar; y un
  momento sin nivel se sigue contando en los totales, como en #236. (docs/03 §1 y §7)
- **Decisión (2026-11-21, product-owner):** un perfil de una persona suspendida, borrado o sin alta
  terminada tiene la vista previa de un perfil que no existe, sin nombre. Motivo: es lo que hoy
  muestra el perfil público a quien lo abre, y la vista previa no puede decir más que el perfil.
  (docs/03 §1)

## Dependencias
- #12 perfil público y niveles · #244 el nivel en la vista previa de un animal · #236 el nivel en la
  medición · #238 el enlace del perfil en «Mis animales» y su medición · docs/03 §1, §7 y §Métricas
  de éxito.


---
_Generated by [Claude Code](https://claude.ai/code)_
