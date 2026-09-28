# Calidad de requisitos — El estado de la verificación muestra el motivo del último rechazo

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

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US3]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Está definido «el último rechazo» sin ambigüedad cuando hay varios el mismo día, y es el mismo concepto en el estado, en «Sin intentos» y en la cola? [Clarity, Spec §Vocabulario, §FR-001]
- [x] CHK004 ¿Está escrito en qué lugares se muestra el estado del pedido y que todos muestran el mismo rechazo? [Consistency, Spec §Vocabulario, §US1.7, §FR-003]
- [x] CHK005 ¿Está escrito el orden de la cola de revisión dentro de un mismo día y entre días distintos? [Completeness, Spec §US3, §FR-012]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona o de quien administra, y no del sistema? [Clarity, Spec §US1-US3]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla que toca la historia y para cada una dice su vacío, o que no aplica y por qué? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando y el error de cada pantalla, aunque sea «como hoy», con referencia a lo que ya existe? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está escrito qué muestra el estado en cada uno de sus estados (en revisión, aprobado, vencido, rechazado, sin intentos) y en cuáles cambia algo con esta historia? [Coverage, Spec §FR-003, §FR-004, §FR-011]

## Quién ve cada dato personal y cuándo

- [x] CHK010 ¿Está especificado que la historia no guarda ningún dato nuevo de la persona y que la hora de un rechazo no se guarda ni se muestra? [Completeness, Spec §FR-002, §SC-006]
- [x] CHK011 ¿Está escrito quién ve cada rechazo (la persona dueña, el último; quien administra, todos) y que otra cuenta o un visitante no ven nada? [Completeness, Spec §FR-014]
- [x] CHK012 ¿Está escrito que la persona no ve la lista de sus rechazos anteriores? [Clarity, Spec §FR-007]
- [x] CHK013 ¿Está especificado que la historia no agrega eventos de medición? [Completeness, Spec §FR-016]

## Casos borde y límites

- [x] CHK014 ¿Están cubiertos dos rechazos el mismo día con el mismo motivo, y tres el mismo día con motivos distintos? [Coverage, Spec §US1.2, §US2.2]
- [x] CHK015 ¿Está definido qué pasa con los rechazos que ya estaban guardados antes del arreglo? [Edge Case, Spec §Edge Cases, §FR-001]
- [x] CHK016 ¿Está definido qué pasa cuando rechazos salen de la ventana de 30 días y el tope se libera en parte? [Edge Case, Spec §Edge Cases]
- [x] CHK017 ¿Está definido que la cuenta de intentos y la fecha para volver a pedir no cambian, con la regla explícita de esa fecha? [Clarity, Spec §FR-009, §US2.3, §SC-004]
- [x] CHK018 ¿Está definido el orden cuando dos personas administran o cuando los rechazos caen cerca de medianoche? [Edge Case, Spec §Edge Cases]
- [x] CHK019 ¿Está escrito que el motivo y el consejo salen siempre del mismo rechazo, y es medible? [Measurability, Spec §FR-005, §SC-003]

## Errores y qué puede hacer la persona

- [x] CHK020 ¿Está escrito qué ve la persona si el correo del último rechazo no llegó? [Coverage, Spec §US1.5, §FR-008]
- [x] CHK021 ¿Está escrito qué pasa si alguien sin ingresar intenta ver el estado, y adónde vuelve al ingresar? [Coverage, Spec §FR-015]
- [x] CHK022 ¿Está definida la coincidencia entre la pantalla y el correo de un rechazo de forma que se pueda comprobar? [Measurability, Spec §US1.4, §FR-006, §SC-002, §Assumptions]

## Nada de implementación

- [x] CHK023 ¿La spec evita nombrar tablas, columnas, consultas, componentes, rutas, librerías o códigos HTTP, y deja a `plan.md` cómo se desempata dentro del día? [Constitution §I, Spec §Assumptions]
- [x] CHK024 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK025 ¿El alcance está acotado y lo que queda fuera está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
