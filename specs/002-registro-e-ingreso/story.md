## Historia
**Como** persona que llega al sitio **quiero** crear mi cuenta e ingresar sin inventar una
contraseña **para** empezar a usar el producto sin fricción y que después me reconozca.

## Contexto
Cada paso de verificación tira gente: si se pide algo antes de que aporte valor, la persona vuelve
a Facebook (docs/01 §Verificación = fricción). La cuenta es el primer escalón y tiene que costar lo
menos posible: sin contraseñas, porque una contraseña más es una razón más para no volver, y porque
una contraseña robada es un problema que no queremos administrar.

Es también la base de todo lo demás: sin cuenta no hay a quién verificar, a quién mostrarle una
solicitud ni a quién avisarle que su publicación vence.

## Alcance
- Incluye: crear la cuenta e ingresar con un enlace de un solo uso al correo o con la cuenta de
  Google · seguir adentro al volver otro día · cerrar sesión · el perfil básico (nombre para
  mostrar, foto, departamento, barrio y si sos rescatista o refugio), que se completa al crear la
  cuenta y se puede editar después · borrar la cuenta.
- No incluye (explícito): contraseñas · verificación de teléfono o de identidad · el perfil visible
  para otras personas y sus distintivos · publicar animales o solicitar adopciones · recuperar una
  cuenta cuyo correo ya no se controla · ingresar con Facebook o Apple · cambiar el correo de una
  cuenta existente.

## Reglas de negocio
- Una persona, un correo. Si el correo ya tiene cuenta, el enlace la hace ingresar en vez de crear
  otra.
- El enlace del correo sirve una sola vez y vence. Pedir uno nuevo invalida el anterior.
- Entrar con Google y entrar con el enlace del mismo correo es la misma cuenta.
- Nombre y zona (departamento y barrio) son obligatorios para terminar de crear la cuenta; la foto
  es opcional.
- El correo no se le muestra a nadie más, nunca. Acá empieza la regla de que el contacto no es
  público.
- La cuenta recién creada puede mirar el sitio, pero no publicar ni solicitar: eso exige el
  teléfono verificado, que llega en su historia.
- Borrar la cuenta borra los datos de la persona y cierra la sesión.

## Criterios de aceptación
### Camino feliz
- **Dado** que no tengo cuenta **cuando** escribo mi correo y abro el enlace que me llega
  **entonces** entro y se me pide completar nombre y zona.
- **Dado** que completé el perfil **cuando** termino **entonces** veo mi perfil con lo que cargué y
  puedo editarlo.
- **Dado** que ya tengo cuenta creada con mi correo **cuando** ingreso con Google usando ese mismo
  correo **entonces** entro a la misma cuenta, no a una nueva.
- **Dado** que ingresé **cuando** cierro el navegador y vuelvo al día siguiente **entonces** sigo
  adentro.
- **Dado** que estoy adentro **cuando** cierro sesión **entonces** vuelvo al sitio sin sesión y mis
  pantallas privadas dejan de estar disponibles.

### Casos borde (al menos 3)
- **Dado** que pedí el enlace dos veces **cuando** abro el primero **entonces** se me dice que ya no
  sirve y puedo usar el último que me llegó.
- **Dado** que el enlace venció **cuando** lo abro **entonces** se me dice que venció y puedo pedir
  otro sin volver a escribir todo.
- **Dado** que dejé el perfil a medias **cuando** vuelvo a entrar **entonces** se me pide
  completarlo antes de seguir.
- **Dado** que pido varios enlaces seguidos en poco tiempo **cuando** insisto **entonces** se me
  pide esperar antes de pedir otro.
- **Dado** que borré mi cuenta y me registro de nuevo con el mismo correo **cuando** entro
  **entonces** es una cuenta nueva, sin nada de la anterior.

### Errores y rechazos
- **Dado** que escribo un correo mal formado **cuando** pido el enlace **entonces** veo qué está mal
  y no se manda nada.
- **Dado** que el correo no llega **cuando** espero **entonces** veo que puedo pedirlo de nuevo y
  que conviene mirar en el correo no deseado.
- **Dado** que cancelo el ingreso con Google **cuando** vuelvo al sitio **entonces** sigo sin sesión
  y puedo intentar de otra forma, sin una pantalla rota.
- **Dado** que abro una pantalla que exige sesión sin haber ingresado **cuando** carga **entonces**
  se me pide ingresar y, al hacerlo, vuelvo a donde iba.

## Pantallas
- **Ingreso**: el campo de correo, la opción de Google y qué va a pasar después. Vacío: no aplica.
- **Revisá tu correo**: a qué dirección se mandó y cómo pedir otro. Vacío: no aplica.
- **Completar perfil**: nombre, foto, departamento, barrio, si sos rescatista o refugio. Vacío: no
  aplica, es un formulario vacío por definición.
- **Mi perfil**: lo cargado, con editar, cerrar sesión y borrar la cuenta. Vacío: sin foto se
  muestran las iniciales del nombre.

## Datos personales
- Se guarda: correo, nombre para mostrar, foto, departamento, barrio y si la persona es rescatista
  o refugio. El correo lo ve solamente ella y quien administre el sitio; nunca otra persona que use
  el producto. Lo demás es la base del perfil público, que llega en su historia. Borrar la cuenta
  borra todo esto.

## Medición
- Creación de cuenta empezada y terminada, ingreso por enlace y por Google, perfil completado,
  sesión cerrada y cuenta borrada.

## Dependencias
- #1 (cerrada) · docs/03 §1 · docs/01 §Verificación = fricción · docs/06 §Glosario

