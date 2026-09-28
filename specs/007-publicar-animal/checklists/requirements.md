# Calidad de requisitos — Publicar un animal con sus fotos y sus datos

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-09-26
**Feature**: [spec.md](../spec.md)

**Nota**: checklist generada por `/speckit-checklist` con el foco: cobertura de escenarios por user
story; el vacío, el cargando y el error de cada pantalla; quién ve cada dato personal y cuándo;
casos borde y límites; errores y qué puede hacer la persona; nada de implementación.
**Propiedad de la revisión**: es un artefacto del revisor. Un ítem se marca `[x]` solo cuando el
revisor determinó que el criterio de calidad del requisito está satisfecho.
**Semántica del marcador**: `[x]` significa que el requisito está bien escrito. No significa que
esté implementado.

## Cobertura de escenarios por user story

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US3]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original tiene su escenario o requisito equivalente en la spec, y cada desvío o lectura de la historia está explicado en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Está escrito el camino feliz de publicar y de editar, incluido a dónde llega la persona después y qué aviso ve? [Coverage, Spec §US1.1, §US2.1, §FR-015, §FR-019]
- [x] CHK004 ¿Está escrito cómo se elige la portada y el orden, y qué pasa al sacar la portada o la última foto, al publicar y al editar? [Coverage, Spec §US1.3, §US1.5, §US2.3, §FR-006]
- [x] CHK005 ¿Está escrito cómo se propone la zona y que cambiarla no cambia el perfil? [Coverage, Spec §US1.2, §FR-011]
- [x] CHK006 ¿Está escrito qué ve quien no tiene nivel 1 —en cada una de sus formas— y quien no ingresó, al publicar, al editar y en «Mis animales»? [Coverage, Spec §US1.10, §US1.11, §US2.5, §FR-001, §FR-003, §FR-004]
- [x] CHK007 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US3]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK008 ¿La spec enumera cada pantalla de la historia (publicar, editar, «Mis animales», el aviso de nombre repetido, el aviso de verificación pendiente) y para cada una dice su estado vacío, o que no aplica y por qué? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está definido el estado mientras una foto se prepara y mientras se publica o se guarda, de modo que no se pueda mandar dos veces? [Completeness, Spec §Pantallas, §FR-018]
- [x] CHK010 ¿Está definido qué muestra «Mis animales» mientras carga, sin animales, con animales y cuando no pudo traer la lista? [Completeness, Spec §Pantallas, §FR-026]
- [x] CHK011 ¿El estado de error de cada pantalla dice qué pasó y qué puede hacer la persona? [Clarity, Spec §Pantallas, §FR-021]
- [x] CHK012 ¿Está definido qué ve la persona después de publicar y después de guardar? [Completeness, Spec §Pantallas, §FR-015, §FR-019]

## Quién ve cada dato personal y cuándo

- [x] CHK013 ¿La spec dice quién puede ver una publicación y sus fotos en esta historia, y que nadie más puede, ni con una dirección conocida? [Completeness, Spec §FR-005]
- [x] CHK014 ¿Está especificado que las fotos se guardan sin ubicación ni datos de la cámara y que la original no sale del dispositivo? [Completeness, Spec §FR-008, §SC-003]
- [x] CHK015 ¿Está especificado que el nombre y la descripción no aceptan datos de contacto, qué cuenta como contacto, y qué se explica al rechazarlo? [Clarity, Spec §FR-014]
- [x] CHK016 ¿Está definido dónde vive lo escrito sin publicar, qué incluye y cuándo se borra? [Completeness, Spec §FR-024, §Key Entities]
- [x] CHK017 ¿Está definido qué se borra al borrar la cuenta, fotos incluidas? [Completeness, Spec §FR-027, §SC-007]
- [x] CHK018 ¿Está escrito cómo se demuestra cada regla de visibilidad y de escritura con un intento fallido? [Measurability, Spec §FR-005, §SC-005]
- [x] CHK019 ¿Los momentos de medición están definidos sin datos que identifiquen al animal ni a la persona más allá de lo necesario para contar? [Completeness, Spec §FR-028]

## Casos borde y límites

- [x] CHK020 ¿Están cuantificados los topes: fotos (1 a 5), tamaño y formatos de foto, largo del nombre y de la descripción, rango de la edad? [Clarity, Spec §FR-006, §FR-007, §FR-009, §FR-010]
- [x] CHK021 ¿Está definido cómo avanza la edad, cuándo pasa de meses a años, y qué pasa al editarla? [Clarity, Spec §FR-010, §Edge Cases]
- [x] CHK022 ¿Está definido qué pasa al elegir de una vez más fotos que las que entran, o cuando una de varias falla? [Coverage, Spec §Edge Cases]
- [x] CHK023 ¿Está definido el aviso de nombre repetido: contra qué compara, cuándo aparece y qué opciones da? [Clarity, Spec §US3.4, §FR-017, §Edge Cases]
- [x] CHK024 ¿Está definido qué pasa si la persona pierde el nivel 1 o la sesión con el formulario abierto? [Coverage, Spec §FR-022, §FR-023, §Edge Cases]
- [x] CHK025 ¿Está definido qué pasa con dos pestañas, con volver atrás después de publicar, y con muchos animales publicados? [Coverage, Spec §Edge Cases]

## Errores y qué puede hacer la persona

- [x] CHK026 ¿Cada rechazo (dato que falta, fuera de rango, contacto en el texto, foto rechazada, máximo de fotos, sin conexión, sitio que no responde, sesión vencida, sin nivel 1, animal ajeno) tiene su mensaje y su paso siguiente? [Coverage, Spec §US1.4-US1.11, §US2.4, §FR-016, §FR-021-FR-023]
- [x] CHK027 ¿Está especificado que un guardado que falla no pierde nada de lo cargado y que reintentar no duplica, incluida una respuesta perdida? [Clarity, Spec §FR-018, §FR-021, §US3.1, §US3.2]
- [x] CHK028 ¿Está especificado que publicar y guardar se completan enteros o no se hacen, con todas las fotos? [Clarity, Spec §FR-015, §FR-019, §FR-020]

## Nada de implementación

- [x] CHK029 ¿La spec está libre de tablas, columnas, políticas, rutas, componentes, códigos HTTP y librerías? [Constitution §I]
- [x] CHK030 ¿Los criterios de éxito son medibles y se pueden observar sin conocer la implementación? [Measurability, Spec §SC-001-SC-008]
- [x] CHK031 ¿Nada de la spec toca la tabla «Fuera del MVP» ni lo que la historia excluye explícitamente? [Scope, story.md §Alcance, docs/03 §Fuera del MVP]

## Notas

- Endurecida en tres rondas con `spec-grader` y `spec-adversary` en contexto fresco. La tercera
  ronda dejó un FAIL (CHK002, dos desvíos sin motivo en Assumptions) y dos HIGH (dos pestañas que
  comparten un intento; el enlace que se dispara con «buena.Como»), plegados después de la ronda;
  lo que quedó abierto está en las Assumptions de la spec.
