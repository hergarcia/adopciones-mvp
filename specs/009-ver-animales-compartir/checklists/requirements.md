# Calidad de requisitos — Ver los animales publicados con filtros y compartir la ficha de cada uno

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-09-28
**Feature**: [spec.md](../spec.md)

**Nota**: checklist generada por `/speckit-checklist` con el foco: cobertura de escenarios por user
story; el vacío, el cargando y el error de cada pantalla; quién ve cada dato personal y cuándo;
casos borde y límites; errores y qué puede hacer la persona; nada de implementación.
**Propiedad de la revisión**: es un artefacto del revisor. Un ítem se marca `[x]` solo cuando el
revisor determinó que el criterio de calidad del requisito está satisfecho.
**Semántica del marcador**: `[x]` significa que el requisito está bien escrito. No significa que
esté implementado.

## Cobertura de escenarios por user story

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US4]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Están definidos sin ambigüedad «a la vista», «no disponible por ahora» y «no existe», y se usan igual en el listado, la ficha, la vista previa y Mis animales? [Clarity, Spec §Vocabulario, §FR-002, §FR-009]
- [x] CHK004 ¿Está escrito qué ve el publicador en su propia ficha según tenga o no nivel 1, y en qué se diferencia de lo que ve un visitante con sesión? [Coverage, Spec §US1.3-4, §US4, §FR-008, §FR-020]
- [x] CHK005 ¿Está escrito cómo se llega al listado, a la ficha y a «Compartir» desde el sitio, con sesión y sin ella? [Completeness, Spec §FR-013, §FR-014, §FR-021]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla que toca la historia (listado, ficha, no disponible, no publicado, Mis animales, Compartir, vista previa) y para cada una dice su vacío, o que no aplica y por qué? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando del listado al abrirlo, al cambiar un filtro y al tocar «Ver más», y el de la ficha? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está definido el error del listado al abrirlo, al cambiar un filtro y al tocar «Ver más», con el motivo y qué puede hacer la persona? [Completeness, Spec §Pantallas, §FR-016]
- [x] CHK010 ¿Está separado el error del sitio al traer una ficha de «no está publicado» y de «no disponible por ahora»? [Clarity, Spec §FR-009, §Pantallas]
- [x] CHK011 ¿Están escritos los dos vacíos del listado (sin filtros y con filtros), con sus textos y la acción de sacar los filtros? [Completeness, Spec §US3.10-11, §Pantallas]

## Quién ve cada dato personal y cuándo

- [x] CHK012 ¿Está escrito exactamente qué datos del publicador ve cualquiera y cuáles nunca, incluido lo que el sitio entrega para armar la pantalla y la vista previa? [Completeness, Spec §FR-004, §SC-003]
- [x] CHK013 ¿Está escrito que una publicación que no está a la vista no se puede leer por ningún camino —datos, fotos, vista previa— y que se demuestra con intentos fallidos con y sin sesión? [Completeness, Spec §FR-003, §FR-018, §SC-002]
- [x] CHK014 ¿Está acotado cuánto puede seguir abriéndose una foto después de que la publicación deja de estar a la vista o se borra, y está justificado? [Clarity, Spec §FR-018, §Assumptions]
- [x] CHK015 ¿Está escrito que la vista previa de un animal no disponible, que no existe, o del listado no lleva ningún dato de un animal ni de una persona? [Completeness, Spec §FR-012]
- [x] CHK016 ¿Está escrito que mirar, filtrar y compartir no guardan nada que identifique a quien mira ni a quien compartió, y que el enlace no lleva nada de quien lo comparte? [Completeness, Spec §FR-010, §FR-017a, §FR-023]
- [x] CHK017 ¿Está escrito qué pasa con las fichas y sus enlaces al borrar la cuenta del publicador? [Completeness, Spec §FR-022, §Edge Cases]

## Casos borde y límites

- [x] CHK018 ¿Están definidos los bordes de los tramos de edad sobre la edad de hoy, y el día en que un animal cambia de tramo? [Clarity, Spec §FR-017, §Edge Cases, §SC-006]
- [x] CHK019 ¿Está definido cómo se combinan las opciones dentro de un filtro y entre filtros, qué pasa al marcar todas, y la única opción de castrado? [Clarity, Spec §FR-017, §Edge Cases]
- [x] CHK020 ¿Está definido que «Ver más» no repite ni saltea con publicaciones nuevas, que dejan de estar a la vista o que comparten fecha, y con un último grupo exacto de 24? [Coverage, Spec §FR-016, §Edge Cases, §SC-005]
- [x] CHK021 ¿Está definido qué hace un enlace de listado con filtros inválidos, repetidos o con una continuación manipulada, y un enlace de ficha mal formado? [Edge Case, Spec §FR-017a, §Edge Cases]
- [x] CHK022 ¿Está definido «corto», «limpio» y «no cambia nunca» del enlace de forma que se pueda comprobar? [Measurability, Spec §FR-010, §SC-008]
- [x] CHK023 ¿Está definido qué ofrece el sitio para la vista previa después de cambiar la portada, el nombre o la zona, y qué no depende del sitio? [Clarity, Spec §FR-011, §Edge Cases]
- [x] CHK024 ¿Está definido «hace cuánto se publicó» con cortes concretos? [Clarity, Spec §Edge Cases]
- [x] CHK025 ¿Están cubiertos el publicador sin foto, sin la marca de rescatista, con nivel 2 o 3, una ficha con una sola foto y los textos en su largo máximo? [Coverage, Spec §Edge Cases, §FR-007]
- [x] CHK026 ¿Está definido qué pasa al volver atrás al listado, también si el navegador descartó la página? [Edge Case, Spec §FR-016, §Edge Cases]

## Errores y qué puede hacer la persona

- [x] CHK027 ¿Está escrito qué ve y qué puede hacer quien toca «Ver más» sin conexión? [Coverage, Spec §US3.9, §FR-016]
- [x] CHK028 ¿Está escrito qué pasa si «Compartir» no puede copiar, si se cierran las opciones sin elegir, o si se toca varias veces? [Coverage, Spec §FR-013, §Edge Cases]
- [x] CHK029 ¿Está escrito qué ve quien abre un enlace no disponible o inexistente, y el camino que le queda? [Coverage, Spec §US1.7-8, §FR-009]
- [x] CHK030 ¿Está escrito qué funciona y qué no cuando el navegador no ejecuta nada, en el listado y en la ficha? [Coverage, Spec §FR-019, §SC-007]

## Nada de implementación

- [x] CHK031 ¿La spec evita nombrar tablas, columnas, consultas, componentes, rutas, librerías, etiquetas de metadatos o códigos HTTP, y deja al plan cómo se arma el enlace, la vista previa y la continuación de «Ver más»? [Constitution §I, Spec §Requirements]
- [x] CHK032 ¿Los criterios de éxito son medibles y no dependen de la tecnología, incluido el de rendimiento con el teléfono y la conexión definidos? [Measurability, Spec §Success Criteria]
- [x] CHK033 ¿El alcance está acotado y lo que queda fuera (solicitar, estados y expiración, perfil público, suspendidas, buscar por texto, otros órdenes, mapa, favoritos, buscadores, portada del sitio, contacto disfrazado) está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
