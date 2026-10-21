## Historia
**Como** persona que visita el sitio **quiero** encontrar al pie de cada pantalla los lugares a los que suelo querer ir **para** llegar sin volver al menú ni adivinar dónde está cada cosa.

## Contexto
Hernán pidió el 2026-10-20 un pie con links de interés. Hoy el pie tiene tres líneas sueltas: «Preguntas y respuestas» (#8), «Opinar» y el WhatsApp de soporte (#71). Sirven para pedir ayuda y no dicen adónde ir. Quien termina de leer una ficha o una página de contenido no tiene un próximo paso a mano, y la verificación, que es lo que diferencia al producto, solo se explica si la persona llega a las páginas que la cuentan.

## Alcance
- Incluye: ordenar el pie en grupos con nombre y sumarle los enlaces que hoy faltan. **Animales**: «Animales en adopción» y «Publicar un animal». **Confianza**: «Qué dice cada nivel» y «Preguntas y respuestas». **Ayuda**: «Opinar» y el WhatsApp de soporte. Al final, la marca con el nombre del sitio. El grupo Confianza queda listo para que la historia de «Nosotros» le sume su enlace.
- No incluye (explícito): enlaces a redes sociales, términos y condiciones, política de privacidad o aviso legal (no existen todavía, y un enlace roto en el pie es peor que ninguno, docs/03 §7) · suscripción a novedades · selector de idioma · mapa del sitio · accesos a la cuenta, que ya están en el menú de arriba · cambiar el menú de arriba · escribir las páginas de «Nosotros» o de la guía del sitio.

## Reglas de negocio
- Los enlaces del pie son los mismos con sesión y sin ella, y ninguno exige haber ingresado para verse.
- Sin número de WhatsApp de soporte, esa línea no aparece (docs/03 §7). Un grupo sin enlaces no muestra su nombre.
- En la pantalla de una cuenta suspendida el pie muestra solo el grupo Ayuda, como hoy muestra solo Opinar y el soporte.
- Cada enlace lleva a una pantalla que existe. Un enlace sin destino no se muestra.
- Los grupos van siempre en el mismo orden: Animales, Confianza, Ayuda.

## Criterios de aceptación
### Camino feliz
- **Dado** que estoy en cualquier pantalla del sitio **cuando** llego al final **entonces** veo los grupos Animales, Confianza y Ayuda con sus enlaces y, debajo, la marca con el nombre del sitio.
- **Dado** que terminé de leer la ficha de un animal **cuando** toco «Animales en adopción» en el pie **entonces** llego al listado.
- **Dado** que vi una chapita y no sé qué significa **cuando** toco «Qué dice cada nivel» en el pie **entonces** llego a esa página.
- **Dado** que tengo el teléfono verificado **cuando** toco «Publicar un animal» en el pie **entonces** empiezo a publicar.

### Casos borde (al menos 3)
- **Dado** que no ingresé **cuando** toco «Publicar un animal» en el pie **entonces** se me pide ingresar y después sigo publicando, sin perder a dónde iba (#9).
- **Dado** que mi teléfono no está verificado **cuando** toco «Publicar un animal» en el pie **entonces** veo el aviso de verificación pendiente (#10), igual que desde el menú.
- **Dado** que el sitio no tiene número de WhatsApp de soporte **cuando** miro el pie **entonces** el grupo Ayuda muestra solo «Opinar».
- **Dado** que miro desde un teléfono de 390 px de ancho **cuando** llego al pie **entonces** los grupos van uno debajo del otro, no hay que desplazarse de costado y cada enlace se toca con comodidad (área de al menos 44 px de alto).
- **Dado** que estoy en una pantalla de error o en una página que no existe **cuando** llego al final **entonces** el pie está igual.

### Errores y rechazos
- **Dado** que mi cuenta está suspendida **cuando** miro el pie **entonces** veo solo el grupo Ayuda, sin enlaces a animales, a publicar ni a las páginas de contenido.
- **Dado** que el destino de un enlace no se puede mostrar **cuando** lo toco **entonces** veo la pantalla de error de ese destino con cómo volver, y el pie sigue entero.

## Pantallas
- **Pie del sitio**, en todas las pantallas: tres grupos con nombre y la marca debajo. Variantes: sin WhatsApp de soporte (Ayuda con una sola línea) y cuenta suspendida (solo Ayuda). Desde 1024 px los grupos van lado a lado. Vacío: no aplica, siempre hay al menos «Opinar».

## Datos personales
- No aplica. El pie no guarda ni muestra datos de ninguna persona.

## Medición
- No aplica. Los enlaces no suman pasos al funnel (docs/03 §7).

## Dependencias
- #8 (Preguntas y respuestas), #12 (Qué dice cada nivel), #53 (publicar), #57 (listado), #71 (Opinar y WhatsApp de soporte), #9 y #10 (ingresar y verificar el teléfono antes de publicar), todas cerradas · docs/10 §Marca.

