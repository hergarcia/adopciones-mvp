# Feature Specification: Que la ficha y el listado de animales abran livianos en el teléfono

**Feature Branch**: `feature/95-ficha-listado-livianos`

**Created**: 2026-10-05

**Status**: Draft

**Input**: Historia #95 del backlog, milestone «M2 - Publicación y difusión». El cuerpo verbatim de
la historia acompaña a esta spec (`story.md`).

**Ya construido**: la ficha de un animal, el listado «Animales en adopción», la pantalla «Este
animal no está publicado», «Compartir» con el aviso «Enlace copiado» y el camino de copiar a mano,
los filtros y «Ver más» (historias #57 y #59). La prueba automática de rendimiento ya mide la ficha
y el listado con red y procesador de teléfono: hace fallar la foto principal lenta y los saltos,
pero el peso solo lo anota. El camino de copiar a mano ya se baja solo si hace falta (KL-57-4). Ya
existe, en otra pantalla pública (el perfil), una prueba que falla por encima de 150 KB, que es el
modelo del freno. Esta historia **no cambia nada de lo que la persona ve**: aliviana lo que el
teléfono baja para abrir esas dos pantallas y convierte la anotación del peso en un freno.

**Vocabulario de esta spec**: la **ficha**, el **listado**, «Compartir», «Enlace copiado», **copiar
a mano**, los **filtros** y «Ver más» significan lo mismo que en la spec de la historia #57. Una
**pantalla de animal no disponible** es cualquiera de las que se ven en lugar de la ficha: «Este
animal no está publicado», la de un animal pausado («no está disponible por ahora») y la de una
publicación vencida (historias #57 y #59). El **peso de apertura** de una pantalla es
lo que el teléfono baja, comprimido, para que la pantalla funcione al abrirla, sin contar la
página misma, las fotos ni la tipografía: lo que docs/07 §Presupuesto de performance llama «JS
inicial» y limita a 150 KB. La pantalla **terminó de abrir** cuando el navegador la da por cargada:
la página, su foto principal y todo lo que se pidió para mostrarla. **Lo que llega después** es lo
que la pantalla baja sola apenas terminó de abrir, sin que nadie toque nada. El **peso total** es
el peso de apertura más lo que llega después. **Con red y procesador de teléfono** es la red móvil
lenta y el procesador de gama media con que la prueba de rendimiento ya mide estas pantallas. El
**freno** es esa prueba automática de rendimiento, que corre con las demás antes de que un cambio
entre.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La ficha abre liviana y todo sigue andando igual (Priority: P1)

Alguien ve en el grupo de Facebook el enlace de Luna, lo toca desde la app y la ficha abre en su
teléfono común con señal mala. Ve la foto de Luna enseguida, sin que nada salte, y la pantalla es
la misma de siempre: las fotos, los datos, quién la publicó y «Compartir». El teléfono bajó menos
que antes para abrirla. Si después se le corta la señal, igual puede tocar «Compartir» y ver
«Enlace copiado».

**Why this priority**: la ficha es el primer paso del funnel y lo que se pega en los grupos
(docs/03 §Hipótesis): si pesa, se pierde gente entre el enlace y la ficha, y esa pérdida se confunde
con la fricción de la verificación que se quiere medir. Es la pantalla que más se pasa hoy (188 KB
contra 150).

**Independent Test**: contra el sitio armado para producción, con red y procesador de teléfono:
abrir la ficha de un animal a la vista y la de uno que no existe, y ver que el peso de apertura de
cada una no pasa de 150 KB, que la foto principal aparece en menos de 2,5 s y que nada salta. En
una computadora, después de abrir la ficha, cortar la conexión, tocar «Compartir» y ver «Enlace
copiado»; con el permiso de copiar negado, ver el camino de copiar a mano. Sin que el navegador
ejecute nada, ver todas las fotos y los datos.

**Acceptance Scenarios**:

1. **Dado** que abro el enlace de la ficha de Luna en un teléfono con red lenta, **cuando** carga,
   **entonces** el peso de apertura no pasa de 150 KB y veo su foto de portada en menos de 2,5 s,
   sin que nada salte.
2. **Dado** que abro la ficha de Luna, **cuando** terminó de abrir, **entonces** veo exactamente lo
   mismo que antes de esta historia: las fotos con los puntos de posición, el nombre, la zona, los
   datos, quién la publicó, la descripción, «Compartir» y, si es mía, «Editar».
3. **Dado** que toco «Compartir» en una computadora, **cuando** se copia el enlace, **entonces** veo
   «Enlace copiado», igual que hoy.
4. **Dado** que abrí la ficha y después se me cortó la señal, **cuando** toco «Compartir» en una
   computadora, **entonces** el enlace se copia y veo «Enlace copiado».
5. **Dado** que el navegador no me deja copiar el enlace, **cuando** toco «Compartir»,
   **entonces** aparece el camino de copiar a mano, como hoy, aunque la señal se haya cortado
   después de abrir.
6. **Dado** que toco «Compartir» en el teléfono, **cuando** se abre el menú de compartir del
   teléfono, **entonces** pasa lo mismo que hoy.
7. **Dado** que abro la ficha desde la app de Facebook sin que el navegador ejecute nada,
   **cuando** carga, **entonces** veo todas las fotos y los datos, como hoy.
8. **Dado** que abro el enlace de un animal que ya no está publicado, **cuando** carga,
   **entonces** veo «Este animal no está publicado», como hoy, con un peso de apertura que no pasa
   de 150 KB.
9. **Dado** que algo falla al traer la ficha con la señal cortándose, **cuando** aparece el error,
   **entonces** el mensaje se ve en español, como hoy, con «Reintentar» y el camino al listado.
10. **Dado** que soy el publicador de Luna, la tengo pausada y entro con mi sesión, **cuando** abro
    su ficha, **entonces** veo lo mismo que hoy (el sello, el aviso de que nadie más la ve y el
    camino a Mis animales), con un peso de apertura que no pasa de 150 KB.

---

### User Story 2 - El listado abre liviano y se filtra como hoy (Priority: P2)

Alguien llega a «Animales en adopción» sin un enlace a un animal en particular, desde el teléfono
y con señal mala. El listado abre con su primera tanda de animales, la foto del primero aparece
rápido y nada salta. Filtra por departamento y pide «Ver más» como siempre.

**Why this priority**: el listado es la puerta de quien llega sin un enlace y también se pasa del
presupuesto (167 KB contra 150). Viene después de la ficha porque el enlace pegado en el grupo lleva
a la ficha, no al listado.

**Independent Test**: contra el sitio armado para producción, con red y procesador de teléfono:
abrir el listado sin filtros, con un filtro y con un filtro que no trae animales, y ver que el peso
de apertura de cada uno no pasa de 150 KB, que la foto principal aparece en menos de 2,5 s y que
nada salta. Filtrar por departamento y pedir «Ver más» y ver el mismo resultado que hoy, también si
el filtro se toca apenas abrió la pantalla. Sin que el navegador ejecute nada, filtrar y pedir «Ver
más».

**Acceptance Scenarios**:

1. **Dado** que abro «Animales en adopción» en un teléfono con red lenta, **cuando** carga,
   **entonces** el peso de apertura no pasa de 150 KB, veo la foto del primer animal en menos de
   2,5 s y nada salta.
2. **Dado** que abrí el listado, **cuando** filtro por departamento y pido «Ver más», **entonces**
   veo los mismos animales, en el mismo orden y con los mismos avisos que hoy.
3. **Dado** que abro el listado, **cuando** toco un filtro apenas apareció la pantalla, **entonces**
   el filtro se aplica: el toque no se pierde.
4. **Dado** que abro el listado sin que el navegador ejecute nada, **cuando** elijo un filtro y pido
   «Ver más», **entonces** funcionan como hoy.
5. **Dado** que filtro y no hay animales, **cuando** se muestra el resultado, **entonces** veo el
   mismo vacío de hoy, con la forma de sacar los filtros.
6. **Dado** que algo falla al abrir el listado con la señal cortándose, **cuando** aparece el
   error, **entonces** el mensaje se ve en español, como hoy, con la forma de volver a intentar.
7. **Dado** que falla traer más animales o aplicar un filtro, **cuando** aparece el aviso,
   **entonces** dice lo mismo que hoy y puedo reintentar, como hoy.

---

### User Story 3 - Un freno que falla si la ficha o el listado vuelven a engordar (Priority: P3)

Cuando M3 sume «Quiero adoptar» a la ficha, o cualquier cambio futuro sume peso a la ficha o al
listado, las pruebas que corren antes de que el cambio entre fallan y dicen qué pantalla se pasó y
por cuánto. La portada no queda más pesada por esta historia.

**Why this priority**: sin un freno que falle, la ficha vuelve a engordar sin que nadie lo note
(decisión 2026-10-04 de esta historia en docs/07). Se apoya en la medición que ya existe y en las
pantallas ya alivianadas por US1 y US2.

**Independent Test**: correr la prueba de rendimiento contra el sitio armado para producción y
verla pasar, con el peso de apertura y el peso total de cada pantalla anotados; sumar a propósito
peso de apertura a la ficha, volver a correrla y verla fallar con el nombre de la pantalla y los KB
de más; sacar el agregado. Comparar el peso de apertura de la portada antes y después de esta
historia.

**Acceptance Scenarios**:

1. **Dado** que un cambio hace que la ficha o el listado pasen los 150 KB, **cuando** se corren las
   pruebas antes de que entre, **entonces** la prueba de rendimiento falla y dice qué pantalla se
   pasó y por cuánto.
2. **Dado** que un cambio hace que una pantalla de animal no disponible pase los 150 KB,
   **cuando** se corren las pruebas, **entonces** la prueba falla y lo dice.
3. **Dado** que un cambio hace que el peso total de la ficha o del listado pase el de antes de esta
   historia, **cuando** se corren las pruebas, **entonces** la prueba falla y lo dice: el peso no se
   puede esconder corriéndolo a después de abrir.
4. **Dado** que ninguna de las dos pantallas se pasa, **cuando** se corren las pruebas,
   **entonces** la prueba pasa y deja anotado el peso de apertura, el peso total y el tiempo hasta
   la foto principal de cada pantalla.
5. **Dado** que abro la portada, **cuando** carga, **entonces** su peso de apertura no pasa del que
   tenía antes de esta historia.

---

### Edge Cases

- **Toque antes de que llegue lo de después.** Si la persona toca un filtro o «Ver más» antes de que
  haya llegado lo que llega después, el toque funciona como sin que el navegador ejecute nada: la
  pantalla se vuelve a pedir con el filtro o con más animales. Nunca se pierde.
- **«Compartir» antes de que llegue lo de después.** «Compartir» aparece recién cuando puede copiar
  y avisar; hasta entonces su lugar está reservado y nada salta al aparecer, como hoy. No hay un
  «Compartir» a la vista que no responda.
- **La señal se corta antes de que la pantalla termine de abrir.** Lo que se vio queda a la vista;
  los filtros y «Ver más» funcionan como sin que el navegador ejecute nada en cuanto vuelva la
  señal, y «Compartir» no aparece si no llegó lo que necesita. Es la misma pantalla que hoy en ese
  caso.
- **La señal se corta después de que la pantalla terminó de abrir y llegó lo de después.**
  «Compartir», «Enlace copiado», copiar a mano y los textos de un error funcionan sin red. Lo que
  pide datos nuevos (filtrar, «Ver más», reintentar) falla con el aviso de conexión de hoy.
- **Con sesión y sin sesión.** El peso de apertura no pasa de 150 KB en los dos casos; el
  publicador ve en su ficha «Editar» y los avisos de hoy.
- **Animal adoptado, en proceso, pausado, vencido o dado de baja.** Cada estado que la ficha o una
  pantalla de animal no disponible muestra hoy (historia #59), a quien lo ve hoy, se ve igual, y su
  peso de apertura no pasa de 150 KB.
- **Animal con una sola foto y con varias.** Con varias, los puntos de posición aparecen como hoy;
  con una sola, no hay puntos. En los dos casos nada salta.
- **Listado con filtros en la dirección.** Abrir el listado con filtros ya puestos pesa lo mismo
  que abrirlo sin filtros, y no pasa de 150 KB.
- **Volver a la ficha desde el listado o retomar la pestaña.** Las fotos se siguen viendo igual que
  hoy al volver a una ficha abierta hace rato.
- **«Compartir» en Mis animales.** Es el mismo botón: en Mis animales sigue funcionando y avisando
  como hoy, aunque el peso de esa pantalla no es parte de esta historia.
- **Una medición ruidosa.** El peso es lo que se bajó, no un tiempo: no varía de una corrida a otra
  con el mismo sitio armado. El freno no lleva margen por encima de los 150 KB.

## Requirements *(mandatory)*

### Functional Requirements

**Peso de apertura**

- **FR-001**: El peso de apertura de la ficha de un animal MUST NOT pasar de 150 KB, en cada estado
  que la ficha muestra (a la vista, en proceso, adoptado, y para su publicador pausado, vencido, dado
  de baja o sin el teléfono confirmado), con y sin sesión.
- **FR-002**: El peso de apertura de cada pantalla de animal no disponible MUST NOT pasar de
  150 KB.
- **FR-003**: El peso de apertura de «Animales en adopción» MUST NOT pasar de 150 KB, con y sin
  filtros, con animales y sin animales, con y sin sesión.
- **FR-004**: El peso de apertura MUST medirse igual que en el resto de las pantallas (docs/07):
  comprimido, con red y procesador de teléfono, contra el sitio armado para producción, sumando lo
  que se pidió desde que se abre el enlace hasta que la pantalla terminó de abrir.
- **FR-005**: El peso de apertura de la portada MUST NOT pasar del que tenía antes de esta historia
  (145 KB al cerrar #57), y sigue dentro de los 150 KB.

**Lo que llega después**

- **FR-006**: Lo que llega después MUST ser solo lo que hace falta después de un toque: el aviso de
  «Enlace copiado», el camino de copiar a mano, la medición de «Compartir», lo que hace que filtrar
  y «Ver más» no recarguen la pantalla, y lo que la pantalla ya hacía después de abrir.
- **FR-007**: Lo que llega después MUST empezar a bajar solo, a más tardar 1 s después de que la
  pantalla terminó de abrir, sin esperar un toque. Una vez que llegó, «Compartir», «Enlace copiado» y copiar a mano MUST
  funcionar sin conexión.
- **FR-008**: El peso total de la ficha MUST NOT pasar del de antes de esta historia (188 KB), ni el
  del listado del suyo (167 KB): esta historia saca peso, no lo corre de lugar.

**Lo que la persona ve y hace**

- **FR-009**: La ficha, las pantallas de animal no disponible y el listado MUST verse y usarse igual que
  antes de esta historia —contenido, textos, orden, diseño y avisos—, con y sin sesión.
- **FR-010**: Sin que el navegador ejecute nada, la ficha MUST mostrar todas las fotos y los datos, y
  el listado MUST dejar filtrar y pedir «Ver más», como hoy.
- **FR-011**: Un toque en un filtro o en «Ver más» antes de que llegue lo de después MUST funcionar
  como sin que el navegador ejecute nada; ningún toque se pierde.
- **FR-012**: «Compartir» MUST aparecer solo cuando ya puede copiar el enlace y avisar, y a más
  tardar 1,5 s después de que la pantalla terminó de abrir, con red y procesador de teléfono; su
  lugar MUST estar reservado desde que la pantalla aparece, para que nada salte.
- **FR-013**: «Compartir» MUST copiar y mostrar «Enlace copiado» en una computadora, abrir el menú
  de compartir en el teléfono y, si el navegador no deja copiar, mostrar el camino de copiar a mano,
  como hoy, también en Mis animales.
- **FR-014**: Un error al traer la ficha o el listado MUST mostrarse en español, con «Reintentar» y,
  en la ficha, el camino al listado, como hoy, aunque la señal se haya cortado después de abrir.
- **FR-015**: La foto principal de la ficha y la del primer animal del listado MUST aparecer en menos
  de 2,5 s con red y procesador de teléfono, y lo que salta mientras la pantalla carga MUST quedar
  por debajo de 0,05 (docs/07).

**El freno**

- **FR-016**: La prueba de rendimiento MUST fallar cuando el peso de apertura de la ficha, de una
  pantalla de animal no disponible o del listado pasa de 150 KB, y MUST decir qué pantalla se pasó y por
  cuántos KB.
- **FR-017**: La prueba de rendimiento MUST fallar cuando el peso total de la ficha o del listado
  pasa el de antes de esta historia, y MUST decir qué pantalla y por cuánto.
- **FR-018**: La prueba de rendimiento MUST dejar anotado, en cada corrida, el peso de apertura, el
  peso total y el tiempo hasta la foto principal de cada pantalla que mide, también de la portada.
- **FR-019**: El freno MUST correr con las demás pruebas antes de que un cambio entre, sin margen por
  encima de los 150 KB.

**Medición y datos**

- **FR-020**: Lo que hoy se registra en la analítica al ver el listado, usar un filtro, ver la ficha
  y tocar «Compartir» MUST seguir registrándose igual; esta historia MUST NOT sumar eventos.
- **FR-021**: Esta historia MUST NOT guardar ni mostrar ningún dato nuevo de nadie.

### Key Entities

No aplica: la historia no guarda datos. Lo que mide (el peso de apertura, el peso total y el tiempo
hasta la foto principal de cada pantalla) vive en la prueba de rendimiento, no en el producto.

## Pantallas

- **Ficha de un animal**: la misma pantalla de hoy, más liviana. **Cargando**: el de hoy (cada foto
  borrosa hasta que llega la nítida, y el lugar de «Compartir» reservado). **Vacío**: no
  aplica; si el animal no está, se ve una pantalla de animal no disponible. **Error**: el de hoy, en
  español, con «Reintentar» y el camino al listado. **Después de un toque**: «Enlace copiado» o el
  camino de copiar a mano, como hoy.
- **Pantallas de animal no disponible** («Este animal no está publicado», pausado, vencido): las
  mismas de hoy, dentro de los 150 KB. Son ellas mismas el vacío de la ficha; no cargan datos
  después de abrir, así que no tienen cargando ni error propios más allá del de la ficha.
- **Animales en adopción**: la misma pantalla de hoy, más liviana. **Cargando**: el de hoy (lo de
  antes queda apagado hasta que llega lo nuevo al filtrar; «Ver más» ocupado mientras trae).
  **Vacío**: el de hoy, sin animales y con filtros. **Error**: el de hoy al abrir, al filtrar y al
  traer más, con la forma de reintentar.
- **Portada**: sin cambios visibles; su peso de apertura no sube.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las corridas del freno, el peso de apertura de la ficha, de una
  pantalla de animal no disponible y del listado queda en 150 KB o menos (hoy: 188 y 167 KB).
- **SC-002**: En el 100 % de las corridas, el peso total de la ficha queda en 188 KB o menos y el
  del listado en 167 KB o menos.
- **SC-003**: Con red y procesador de teléfono, la foto principal de la ficha y del listado aparece
  en menos de 2,5 s y el salto acumulado queda por debajo de 0,05, como hoy.
- **SC-004**: El peso de apertura de la portada queda igual o por debajo del de antes de esta
  historia.
- **SC-005**: Sumar a propósito peso a la ficha hasta pasar los 150 KB hace fallar el freno, y el
  mensaje nombra la pantalla y los KB de más (se demuestra una vez durante la construcción).
- **SC-006**: Todas las pruebas de punta a punta que hoy cubren la ficha, el listado y «Compartir»
  pasan sin cambiar lo que comprueban.
- **SC-007**: Con la conexión cortada después de abrir la ficha, «Compartir» copia y muestra
  «Enlace copiado», y con el permiso de copiar negado muestra el camino de copiar a mano, en el
  100 % de las corridas; con red y procesador de teléfono, «Compartir» está a la vista a más tardar
  1,5 s después de que la ficha terminó de abrir.

## Assumptions

- **El peso se mide hasta que la pantalla terminó de abrir.** docs/07 dice «JS inicial»; la historia
  dice «lo que el teléfono baja para abrir» y deja que lo que solo hace falta después de un toque
  llegue después. Se lee como: el peso de apertura suma lo pedido hasta que el navegador da la
  pantalla por cargada; lo que llega después se mide aparte, hasta que la pantalla deja de bajar cosas, y tiene su propio tope (FR-008), para
  que el peso no se pueda esconder corriéndolo a después de abrir.
- **El tope del peso total es el de hoy.** La historia no lo pide; se agrega porque sin él el freno
  de 150 KB se cumpliría corriendo todo a después. Los valores son los medidos al cerrar #57 (188 y
  167 KB). Si la construcción mide otros valores de partida, vale el medido en `main` antes del
  primer cambio, anotado en el PR.
- **Filtrar y «Ver más» son «después de un toque».** La regla de la historia nombra el aviso, copiar
  a mano y los textos de un error como ejemplos; filtrar sin recargar y «Ver más» sin recargar
  también solo hacen falta después de un toque, y sin ellos la pantalla ya funciona como sin que el
  navegador ejecute nada (FR-010, FR-011). Se cuentan dentro de lo que puede llegar después.
- **«Compartir» aparece cuando puede avisar.** Hoy aparece apenas la pantalla responde; con esta
  historia puede aparecer hasta 1,5 s después de que terminó de abrir (FR-012), cuando llegó lo que necesita para copiar y avisar.
  Es lo que pide la decisión de que «Compartir» no quede mudo: un botón a la vista que no avisa es
  peor que uno que aparece un poco más tarde en su lugar reservado.
- **La portada vale 145 KB** como punto de partida (medido al cerrar #57); si `main` mide otro valor
  antes del primer cambio, vale ese.
- **La auditoría de Lighthouse no cambia** (KL-57-3): la sigue esperando la aprobación de Hernán. El
  freno es la prueba de rendimiento que ya mide estas pantallas.
- **Mis animales y las demás pantallas con sesión** quedan fuera del peso de esta historia; como
  «Compartir» es el mismo botón, en Mis animales tiene que seguir funcionando igual (FR-013).
- **Fuera de esta historia**, como dice `story.md`: cambiar qué muestra la ficha o el listado, sus
  textos o su diseño; sacar «Compartir», «Enlace copiado», los filtros o la galería; sumar estas
  pantallas a Lighthouse; el perfil público de quien publica y su chapita en la ficha (KL-57-8); la
  transición animada de la card a la ficha (KL-57-2); eventos nuevos en la analítica (#71); que las
  pantallas aparezcan en buscadores (M5).
- **Cierra KL-57-4** en `docs/known-limitations.md`.
