# #201 «Nosotros»: para qué existe el sitio, en qué se diferencia y qué quiere decir su marca

## Historia
**Como** persona que llega al sitio y todavía no sabe por qué confiar en él **quiero** leer para qué existe, en qué se diferencia de un grupo de Facebook y qué quiere decir su marca **para** decidir si me sirve antes de registrarme.

## Contexto
Hernán pidió el 2026-10-20 una sección «Nosotros» (o el nombre que quede mejor) que explique el motivo del sitio y en qué quiere diferenciarse, más un apartado sobre el logo. Hoy ninguna pantalla cuenta eso entero: la portada invita a publicar o a mirar (#61) y las páginas de «Preguntas y respuestas» (#8) responden dudas puntuales. La desconfianza es el problema que el producto resuelve (docs/01 §Situación actual), y quien llega por un enlace de WhatsApp no tiene dónde leer cuál es la idea. La marca es una decisión tomada el 2026-10-08 (docs/10 §Marca) y hoy nadie sabe qué significa el dibujo.

Decisión de esta historia: la sección se llama «Nosotros». Si al construirla se ve un nombre mejor, el enjambre lo cambia y lo avisa.

## Alcance
- Incluye: una página pública «Nosotros», enlazada desde el grupo Confianza del pie (#200), con cuatro partes. **Para qué existe**: lo que pasa hoy al dar o adoptar un animal, con las estafas del tipo «pagá el flete», la gente que adopta para revender y los rescatistas que entrevistan por WhatsApp uno por uno. **En qué se diferencia**: verifica a las personas antes de que intercambien datos; el teléfono y el contacto de nadie están a la vista, se dan cuando la solicitud se acepta; cada persona tiene un nivel de verificación a la vista con su chapita; un seguimiento a los 30 días de cada adopción; no cobra por nada. **Lo que no promete**: que una persona verificada vaya a cuidar bien a un animal, porque la verificación dice quién es. **La marca**: el dibujo grande de la pata con la huella digital en la almohadilla, qué quiere decir (el animal y la persona que sabemos quién es), y en qué se distingue de la chapita: la marca firma al sitio y la chapita certifica a una persona, con el enlace a «Qué dice cada nivel». Al final, la fecha de última actualización y una sola acción: ver los animales en adopción.
- No incluye (explícito): quién está detrás, fotos de personas o historia de fundadores · cifras de impacto, número de adopciones o testimonios · un formulario de contacto · cómo ayudar con plata o donaciones (fuera del MVP) · alianzas o logos de otras organizaciones · descargar la marca o su kit · cambiar el logo o el nombre del sitio · contenido en otro idioma · prender la indexación en buscadores (#76; hasta entonces la página queda fuera de los buscadores como todo el sitio).

## Reglas de negocio
- Todo lo que la página afirma del sitio es lo que el sitio hace hoy. Si algo cambia, la página cambia con él (misma regla que #8).
- No se inventan cifras ni ejemplos con personas o animales reales. Si hace falta un nombre, es inventado y la página lo aclara.
- La parte de la marca dice lo mismo que docs/10 §Marca. Si esa decisión cambia, cambia la página.
- La página no depende del nombre provisorio del sitio: si el nombre se redefine, cambia el nombre donde aparece y el resto del texto queda igual.
- El dibujo de la marca se muestra con el diseño de 32 px de alto o más, el que conserva las crestas de la huella, y con una descripción en texto para quien no lo ve.
- La página es pública: se lee entera sin ingresar ni registrarse.
- Muestra cuándo se actualizó por última vez.

## Criterios de aceptación
### Camino feliz
- **Dado** que toco «Nosotros» en el pie **cuando** carga **entonces** leo para qué existe el sitio, en qué se diferencia, lo que no promete y qué quiere decir su marca, en ese orden.
- **Dado** que llego a la parte de la marca **cuando** la leo **entonces** veo el dibujo grande, entiendo que es una pata con una huella digital en la almohadilla, y encuentro el enlace a «Qué dice cada nivel» para saber qué certifica una chapita.
- **Dado** que llego al final **cuando** miro **entonces** veo la fecha de última actualización y la acción de ver los animales en adopción.

### Casos borde (al menos 3)
- **Dado** que entro sin haber ingresado **cuando** leo la página **entonces** la veo completa y nada me pide registrarme.
- **Dado** que comparto el enlace por WhatsApp **cuando** le llega a la otra persona **entonces** ve la tarjeta con el título de la página, no la dirección pelada (igual que la ficha de un animal, #57).
- **Dado** que leo desde el teléfono con una conexión lenta **cuando** abro la página **entonces** puedo leer el texto aunque el dibujo de la marca todavía no haya cargado.
- **Dado** que uso un lector de pantalla **cuando** llego al dibujo de la marca **entonces** escucho qué representa en una descripción, no «imagen».
- **Dado** que se redefine el nombre del sitio **cuando** se cambia en el único lugar donde está escrito **entonces** la página muestra el nombre nuevo sin reescribir ningún párrafo.

### Errores y rechazos
- **Dado** que mi cuenta está suspendida y tengo la sesión abierta **cuando** abro «Nosotros» **entonces** veo la pantalla de cuenta suspendida, como en la portada, el listado y la ficha de un animal.
- **Dado** que la página no se puede mostrar **cuando** entro **entonces** veo que algo falló y cómo volver a la portada, sin una pantalla en blanco.

## Pantallas
- **Nosotros**: las cuatro partes, la fecha de actualización y la acción final. Vacío: no aplica, siempre tiene texto. Desde 1024 px el dibujo de la marca va al lado del texto de su parte; en el teléfono, arriba.
- **Pie del sitio**: se le suma el enlace «Nosotros» en el grupo Confianza. Cuenta suspendida: no aparece, como el resto de los enlaces de contenido.

## Datos personales
- No aplica. La página es pública y no usa datos de ninguna persona.

## Medición
- No aplica. No es un paso del funnel (docs/03 §7).

## Dependencias
- #200 (el pie y su grupo Confianza) · #8 (las páginas que explican lo que «Nosotros» resume) · #12 (Qué dice cada nivel) · #61 (la portada, de la que no se repite el contenido) · docs/10 §Marca, cerrada con el PR de la marca.

