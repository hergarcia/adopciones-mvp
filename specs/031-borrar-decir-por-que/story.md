## Historia
**Como** rescatista que borra un animal que no se adoptó por el sitio **quiero** decir por qué con un
toque, si quiero, en la misma confirmación de borrar **para** que el sitio sepa en qué me falló; y
**como** equipo **quiero** leer esas respuestas **para** saber si una publicación termina sin adopción
por falta de alcance, por solicitudes que no sirven o porque el grupo de Facebook o WhatsApp ganó.

## Contexto
La primera métrica de éxito (docs/03 §Métricas de éxito) cuenta a quien rescata y vuelve a publicar,
y la encuesta de #71 le pregunta a quien publicó solo cuando una adopción termina. A quien borra un
animal que no consiguió hogar acá nadie le pregunta nada, y es quien más tiene para decir sobre la
hipótesis: si no llegaron solicitudes, el sitio pierde por alcance contra el grupo; si llegaron y no
servían, el problema está en quién solicita o en el nivel que se exige; si lo dio por el grupo, el
grupo ganó. #234 hizo esta pregunta del lado de quien deja la verificación y #254 la deja afuera a
propósito («preguntar algo al sacar de la vista un animal sin marcarlo adoptado»). Con 3 a 5
rescatistas, cada animal borrado sin adopción es un dato que hoy se pierde.

Le gana a los detalles de texto de las aceptaciones de #206 y #257 (baratos, no enseñan nada de la
hipótesis), a avisarle a quien adopta cuando entra un animal parecido (más caro: búsquedas guardadas,
correos y una tarea que corre sola), a mostrarle a cada rescatista qué le trajo cada animal (más caro,
lee el valor de costado) y al traspaso del chip (docs/05, trámite sin averiguar): es una pregunta
opcional en una confirmación que ya existe y reusa Encuestas de #71 y #234.

## Alcance
- Incluye: en la confirmación de borrar un animal o una camada que no fue adoptada ni dada de baja,
  una pregunta opcional de una sola opción, con cinco opciones fijas y ninguna elegida · borrar igual,
  conteste o no · lo contestado, para quien administra, en un apartado nuevo de Encuestas · la
  lectura nueva en docs/03 §Métricas de éxito.
- No incluye (explícito): preguntar al pausar, al marcar en proceso, al marcar adoptado, al quitar
  una cría de una camada, al borrar un animal adoptado o dado de baja, ni al borrar la cuenta · un
  texto libre · preguntar por dónde llegó quien adoptó por fuera (lo propone #254) · ofrecer marcarlo
  adoptado en lugar de borrarlo · correos o recordatorios a quien dejó vencer un animal sin renovarlo ·
  mostrar la respuesta en la ficha, en «Mis animales», en el perfil o a quien publicó · que quien
  administra sepa quién contestó o qué animal era · cambiar las opciones desde el sitio · cambiar la
  encuesta de #71 o la pregunta de #234.

## Reglas de negocio
- La pregunta aparece en la confirmación de borrar, debajo del texto que avisa que se borra para
  siempre y antes de «Borrar para siempre», cuando el animal está disponible, en proceso, pausado o
  vencido. En una camada aparece si al menos una cría no fue adoptada, y se contesta una sola vez por
  la camada entera.
- No aparece al borrar un animal adoptado, una camada con todas sus crías adoptadas ni una
  publicación dada de baja: ahí la publicación terminó o la sacó quien administra.
- La pregunta es «¿Por qué {lo | la} borrás?» y las opciones son: No llegaron solicitudes · Las
  solicitudes que llegaron no me convencieron · Lo di en adopción por Facebook, Instagram o WhatsApp
  · Ya no está en adopción · Otra cosa. Las opciones de un animal hembra o de una camada concuerdan
  («La di…»).
- Ninguna opción viene elegida. Se puede elegir una, cambiarla o volver a tocarla para dejarla sin
  elegir antes de confirmar. «Borrar para siempre» funciona igual sin contestar: la pregunta nunca
  agrega un toque ni frena borrar.
- Se pregunta en cada borrado que cumple las condiciones, sin tope por persona: cada animal es otro
  dato. No cuenta para la encuesta de una cada 30 días de #71, y esa encuesta no la frena.
- Se cuenta lo que estaba elegido al confirmar, una sola vez por borrado aunque se toque dos veces o
  se reintente. Si el borrado no se hace, no se cuenta nada.
- Si al confirmar el animal ya estaba adoptado o dado de baja (cambió en otra pestaña), se borra o
  se avisa como hoy, y la respuesta no se cuenta.
- Cada respuesta se guarda sin la persona y sin el animal: la opción o «sin contestar», el día, y si
  era un animal o una camada. Nunca el nombre, la zona, la hora ni las solicitudes.
- En **Encuestas**, quien administra ve un apartado nuevo, «Por qué se borraron animales»: cuántos
  animales y camadas se borraron con la pregunta a la vista, cuántos la contestaron y cuántos no, y
  cuántas veces se eligió cada opción, en total y separado en animales y camadas. Borrar una cuenta no
  cambia ninguno de esos números.

## Criterios de aceptación
### Camino feliz
- **Dado** que Carla publicó a Luna hace 25 días y no le llegó ninguna solicitud **cuando** toca
  «Borrar» en «Mis animales» **entonces** ve «¿Por qué la borrás?» con las cinco opciones y ninguna
  elegida, debajo del aviso y antes de «Borrar para siempre».
- **Dado** que Carla eligió «No llegaron solicitudes» **cuando** toca «Borrar para siempre»
  **entonces** Luna se borra como hoy y la respuesta queda contada con esa opción, el día y que era un
  animal.
- **Dado** que Carla no eligió ninguna opción **cuando** toca «Borrar para siempre» **entonces** Luna se
  borra como hoy y el borrado queda contado como «sin contestar».
- **Dado** que administro el sitio **cuando** abro Encuestas **entonces** veo «Por qué se borraron
  animales» con cuántos se borraron con la pregunta, cuántos la contestaron y cuántas veces se eligió
  cada opción, en total y en animales y camadas, sin el nombre de nadie ni del animal.

### Casos borde (al menos 3)
- **Dado** que Carla marcó a Nube adoptada **cuando** la borra **entonces** la confirmación es la de
  hoy, sin la pregunta, y no se cuenta nada.
- **Dado** que la camada de Luna tiene tres crías y dos fueron adoptadas **cuando** Carla toca «Borrar
  la camada» **entonces** ve la pregunta una sola vez y, al confirmar, se cuenta una respuesta de
  camada.
- **Dado** que Carla quita una cría de una camada o borra su cuenta **cuando** confirma **entonces** no
  aparece ninguna pregunta.
- **Dado** que quien administra dio de baja a Toby **cuando** Carla lo borra **entonces** la
  confirmación es la de hoy, sin la pregunta.
- **Dado** que Carla eligió «Ya no está en adopción» por error **cuando** la vuelve a tocar o elige
  otra antes de confirmar **entonces** queda sin elegir o con la nueva, y se cuenta solo lo que había al
  confirmar.
- **Dado** que Carla contestó al borrar a Luna y después borró su cuenta **cuando** quien administra
  abre Encuestas **entonces** los números siguen iguales.

### Errores y rechazos
- **Dado** que Carla eligió una opción y se corta la conexión **cuando** toca «Borrar para siempre»
  **entonces** Luna sigue publicada, la opción sigue elegida, se le dice que no se pudo por la conexión
  y al tocar de nuevo se borra y se cuenta una sola respuesta.
- **Dado** que Carla toca dos veces «Borrar para siempre» **cuando** el borrado termina **entonces**
  queda una sola respuesta contada.
- **Dado** que Carla marcó a Luna adoptada en otra pestaña **cuando** confirma el borrado desde esta con
  una opción elegida **entonces** pasa lo mismo que hoy y la respuesta no se cuenta.
- **Dado** que no administro el sitio **cuando** abro la dirección de Encuestas **entonces** veo que no
  existe, igual que hoy.

## Pantallas
- **Confirmación de borrar un animal y de borrar una camada** (390 y 1280 px): la pregunta va entre el
  aviso y los botones, como un grupo de opciones de una sola elección con su título, y dice que es
  opcional sin sonar a formulario. En el teléfono las cinco opciones van una debajo de la otra y
  «Borrar para siempre» y «No borrar» siguen a la vista al terminar la lista; a 1280 px van en la misma
  hoja, sin abrir otra. Sin pregunta (adoptado, dado de baja), la confirmación es la de hoy. Vacío: no
  aplica, las opciones son fijas.
- **Encuestas** (quien administra): el apartado nuevo «Por qué se borraron animales». Vacío: «Todavía
  nadie borró un animal sin adopción»; con borrados pero sin respuestas, muestra los números y dice
  que nadie contestó todavía.

## Datos personales
- No nace ningún dato personal. La respuesta se guarda sin la persona y sin el animal: la opción o
  «sin contestar», el día y si era un animal o una camada. Sin la hora, el nombre ni la zona, para que
  no se pueda deducir quién contestó (Ley 18.331). La ven solo quienes administran.
- De la persona no queda nada: como se pregunta en cada borrado, no hace falta recordar a quién se le
  preguntó.

## Medición
- Se cuenta cada borrado con la pregunta a la vista, con su opción o «sin contestar» y si era un
  animal o una camada, sin persona, como el resto de la medición del sitio (docs/03 §7).
- docs/03 §Métricas de éxito gana una lectura al lado de la primera: de las publicaciones que
  terminaron sin una adopción en el sitio, qué parte fue por falta de solicitudes, por solicitudes que
  no convencieron o porque el animal se dio por Facebook, Instagram o WhatsApp. Con 3 a 5
  rescatistas se lee como señal al lado de las opiniones y las encuestas.

## Dependencias
- #53 publicar un animal · #59 estados de la publicación · #205 y #206 camadas · #71 Encuestas · #234 la
  pregunta al dejar la verificación · #169 medición en el sitio de verdad.
- docs/03 §2, §7 y §Métricas de éxito.

## Decisiones del enjambre
- **Decisión (2026-10-29, product-owner):** la pregunta va en la misma confirmación de borrar, es
  opcional, ninguna opción viene elegida y nunca frena borrar. Motivo: sacar de la vista nunca se traba
  (#59), y una pregunta obligatoria al cerrar empuja a contestar cualquier cosa, que es peor que no
  tener el dato; dentro de la confirmación no suma ningún toque. (docs/03 §7)
- **Decisión (2026-10-29, product-owner):** aparece solo al borrar un animal o una camada que no fue
  adoptada ni dada de baja; no al pausar, al quitar una cría ni al borrar la cuenta. Motivo: la
  pregunta es por una publicación que terminó sin adopción acá; pausar es transitorio, quitar una cría
  suele ser corregir la carga, y borrar la cuenta tiene su propia confirmación. (docs/03 §7)
- **Decisión (2026-10-29, product-owner):** cinco opciones fijas, sin texto libre, y la respuesta se
  guarda sin la persona ni el animal, solo con la opción, el día y si era un animal o una camada.
  Motivo: un texto libre puede traer el nombre o el teléfono de quien adoptó por fuera, que no aceptó
  nada; entre dos opciones razonables, la que muestra menos y guarda menos (Ley 18.331), como en #254.
  Cada opción pide un arreglo distinto: más alcance, otra exigencia de nivel o aceptar que el grupo
  gana. (docs/03 §7)
- **Decisión (2026-10-29, product-owner):** se pregunta en cada borrado, sin tope por persona, y no
  cuenta para la encuesta de una cada 30 días de #71. Motivo: cada animal es otro dato y la pregunta no
  agrega toques; en una beta de 2-3 meses, perder una lectura por la otra deja una métrica sin datos,
  como se decidió para #234. (docs/03 §7)
- **Decisión (2026-10-29, product-owner):** lo contestado se lee en Encuestas, además de la medición,
  y suma una lectura al lado de la primera métrica de éxito. Motivo: Encuestas ya junta lo que dice la gente
  (#71, #234) y quien administra lo lee en el sitio; la primera métrica cuenta a quien vuelve
  a publicar, y esta dice por qué una publicación terminó sin adopción. (docs/03 §Métricas de éxito)


---
_Generated by [Claude Code](https://claude.ai/code)_
