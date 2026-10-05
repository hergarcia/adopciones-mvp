## Historia
**Como** persona que abre desde el grupo de Facebook o desde WhatsApp el enlace de un animal en
adopción, con un teléfono común y señal mala, **quiero** que la ficha y el listado abran tan livianos
como el resto del sitio **para** ver el animal sin esperar y no volverme al grupo antes de que cargue.

## Contexto
La historia #57 puso a la vista los animales publicados: el listado «Animales en adopción» y la
ficha de cada animal, que es lo que se pega en los grupos. La ficha es el primer paso del funnel
(ver ficha → solicitar → aceptar → adoptar) y el listado es la puerta de quien llega sin un enlace.

docs/07 §Presupuesto de performance fija lo que el teléfono baja para poder usar una pantalla: no
pasa de 150 KB. Medido contra el sitio armado para producción al cerrar #57, la ficha bajaba 188 KB
y el listado 167 KB; la portada, con la misma cabecera, baja 145 KB. Lo que suman la ficha y el
listado por encima de la portada son los textos de los mensajes de error de la pantalla, el aviso
de «Enlace copiado», la medición del botón «Compartir», la galería de fotos y los filtros. Hoy la
foto principal aparece rápido (menos de 2,5 s con red y procesador de teléfono) y nada salta al
cargar, así que la persona no lo nota todavía; lo va a notar cuando M3 sume «Quiero adoptar» y la
pantalla pese más.

Por qué pasa el umbral: rompe el presupuesto de performance de una pantalla del funnel, la ficha, y
también el del listado (docs/09 §Umbral de seguimiento). Se aceptó durante la construcción como
KL-57-4; esta historia la cierra.

Qué enseña sobre la hipótesis (docs/03 §Hipótesis): el enlace solo le gana al posteo con fotos en el
grupo si abre tan rápido como una foto. Si la ficha pesa, se pierde gente entre el enlace y la
ficha, y esa pérdida se confunde con la fricción de la verificación que queremos medir.

## Alcance
- Incluye: que la ficha de un animal y el listado «Animales en adopción» queden dentro de los
  150 KB de docs/07, sin perder nada de lo que hacen hoy · que la prueba automática de rendimiento
  que ya mide esas dos pantallas con red y procesador de teléfono falle cuando cualquiera de las dos
  pasa los 150 KB, en lugar de solo anotarlo · que la portada no se ponga más pesada por este cambio.
- No incluye (explícito): cambiar qué muestra la ficha o el listado, sus textos o su diseño ·
  sacar el botón «Compartir», el aviso de «Enlace copiado», los filtros o la galería · sumar la ficha
  y el listado a la auditoría de Lighthouse del sitio, que es una compuerta que solo cambia con la
  aprobación de Hernán (KL-57-3) · «Mis animales» y las demás pantallas con sesión · el perfil
  público de quien publica y su chapita en la ficha (KL-57-8) · la transición animada de la card a
  la ficha (KL-57-2) · eventos nuevos en la analítica · que las pantallas aparezcan en buscadores (M5).

## Reglas de negocio
- La ficha y el listado se ven y se usan igual que hoy, con y sin sesión, y también sin que el
  navegador ejecute nada.
- Lo que el teléfono baja para abrir la ficha o el listado no pasa de 150 KB, medido igual que el
  resto de las pantallas (docs/07).
- La foto principal sigue apareciendo en menos de 2,5 s en un teléfono con red móvil lenta, y nada
  salta mientras la pantalla carga.
- Lo que solo hace falta después de un toque (el aviso de «Enlace copiado», el camino de copiar a
  mano, los textos de un error) puede llegar después de que la pantalla abrió, pero llega solo,
  apenas terminó de abrir, sin esperar el toque: si la señal se corta después, igual está.

## Criterios de aceptación
### Camino feliz
- **Dado** que abro el enlace de una ficha en un teléfono con red lenta **cuando** carga **entonces**
  lo que bajó para abrirla no pasa de 150 KB y veo la foto de portada en menos de 2,5 s.
- **Dado** que abro «Animales en adopción» en un teléfono con red lenta **cuando** carga **entonces**
  lo que bajó no pasa de 150 KB y puedo filtrar y pedir «Ver más» como hoy.
- **Dado** que toco «Compartir» en una computadora **cuando** se copia el enlace **entonces** veo
  «Enlace copiado» igual que hoy.

### Casos borde (al menos 3)
- **Dado** que un cambio futuro hace que la ficha o el listado vuelvan a pasar los 150 KB **cuando**
  se corren las pruebas antes de que entre **entonces** la prueba de rendimiento falla y dice qué
  pantalla se pasó y por cuánto.
- **Dado** que abrí la ficha y después se me cortó la señal **cuando** toco «Compartir» en una
  computadora **entonces** el enlace se copia y veo «Enlace copiado», como hoy.
- **Dado** que abro la ficha desde la app de Facebook sin que el navegador ejecute nada **cuando**
  carga **entonces** veo todas las fotos y los datos, como hoy.
- **Dado** que abro la portada **cuando** carga **entonces** lo que baja no pasa de lo que bajaba
  antes de este cambio.

### Errores y rechazos
- **Dado** que algo falla al abrir la ficha o el listado con la señal cortándose **cuando** aparece
  el error **entonces** el mensaje se ve en español, como hoy, con la forma de volver a intentar.
- **Dado** que el navegador no me deja copiar el enlace **cuando** toco «Compartir» **entonces**
  aparece el camino de copiar a mano, como hoy, aunque la señal se haya cortado después de abrir.
- **Dado** que abro el enlace de un animal que ya no está publicado **cuando** carga **entonces**
  veo «Este animal no está publicado», como hoy, dentro de los mismos 150 KB.

## Pantallas
- **Animales en adopción**: la misma pantalla, más liviana. Vacío: el mismo de hoy.
- **Ficha de un animal**: la misma pantalla, más liviana. Vacío: no aplica (si el animal no está,
  la pantalla «Este animal no está publicado» de hoy).

## Datos personales
- No aplica: no guarda ni muestra ningún dato nuevo de nadie.

## Medición
- Lo que baja cada pantalla y el tiempo hasta la foto principal, en la prueba automática de
  rendimiento. No suma eventos a la analítica: el evento «vio ficha» del funnel llega con #71
  (docs/03 §7).

## Decisiones del enjambre
- **Decisión (2026-10-04, product-owner):** el aviso de que la ficha o el listado se pasan del
  presupuesto lo da la prueba automática de rendimiento que ya mide esas dos pantallas con red y
  procesador de teléfono, que pasa de anotar el peso a fallar por encima de 150 KB; sumarlas a la
  auditoría de Lighthouse sigue esperando la aprobación de Hernán (KL-57-3). Motivo: la
  configuración de Lighthouse es una compuerta que el enjambre no toca solo (docs/09 §Las reglas
  no se tocan solas), y sin un freno que falle la ficha vuelve a engordar cuando M3 sume «Quiero
  adoptar». (docs/07 §Presupuesto de performance)
- **Decisión (2026-10-04, product-owner):** lo que se baja después de abrir (el aviso de «Enlace
  copiado», copiar a mano, los textos de error) llega apenas la pantalla terminó de abrir, no
  recién al tocar. Motivo: quien abre el enlace en el teléfono con señal mala puede perderla
  después; si el aviso esperara al toque, «Compartir» quedaría mudo justo para quien más lo usa
  para pasarlo al grupo. (docs/07 §Presupuesto de performance)
- **Decisión (2026-10-04, product-owner):** esta historia no suma eventos a la analítica. Motivo:
  la instrumentación del funnel es su propia historia (#71, docs/03 §7) y medir aparte las visitas
  que se van antes de ver la ficha adelantaría parte de ella. (docs/03 §7)

## Dependencias
- #57 Ver los animales publicados con filtros y compartir la ficha · docs/07 §Presupuesto de
  performance · limitaciones conocidas KL-57-3 y KL-57-4.


---
_Generated by [Claude Code](https://claude.ai/code)_
