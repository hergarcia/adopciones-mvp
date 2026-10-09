# Calidad de requisitos — Contenido que responde las preguntas que frenan una adopción

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-10-09
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
- [x] CHK003 ¿Están definidos sin ambigüedad página de contenido, respuesta, detalle, relacionadas, acción, grupo, índice y «antes de elegir las fotos», y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está escrito, para cada una de las cinco páginas, su pregunta, su grupo, su acción y sus relacionadas? [Completeness, Spec §Vocabulario, §Edge Cases, §FR-003]
- [x] CHK005 ¿Está escrito qué ve cada actor (visitante sin sesión, persona con sesión, persona con la identidad verificada o con un pedido en revisión, persona sin teléfono verificado, cuenta suspendida) en las páginas, el índice, el pie y las acciones? [Coverage, Spec §US1, §US2, §US3, §FR-004-007]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US3]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla que toca la historia y para cada una dice su vacío, o que no aplica? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando del índice y de cada página? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está definido el error al cargar el índice y una página, con qué puede hacer la persona? [Completeness, Spec §Pantallas, §US1 escenario 11, §US2 escenario 7]
- [x] CHK010 ¿Está definido qué ve la persona ante una página que no existe y ante una que se retiró? [Coverage, Spec §FR-015, §Edge Cases]

## Datos personales: quién ve qué y cuándo

- [x] CHK011 ¿Está escrito que el contenido no guarda ni muestra datos de ninguna persona y que los ejemplos son inventados y se dicen inventados? [Completeness, Spec §FR-013, §Key Entities]
- [x] CHK012 ¿Está escrito que la medición es por visita, nunca se une a la cuenta y no lleva datos de la persona, también la comparación del pedido de verificación? [Completeness, Spec §FR-050-053]
- [x] CHK013 ¿Lo que «Cómo se verifica» dice sobre qué se muestra de una persona y qué pasa con la cédula está atado a lo que el sitio hace hoy y a «Qué hacemos con ellas», sin prometer más? [Consistency, Spec §FR-008, §FR-009, §Edge Cases]

## Casos borde y límites

- [x] CHK014 ¿Está cuantificado el primer párrafo (cuántas oraciones, dónde va) y cómo se comprueba que responde por sí solo? [Clarity, Spec §FR-002, §SC-001]
- [x] CHK015 ¿Está definido qué es la fecha de última actualización, qué la cambia y qué no? [Clarity, Spec §Edge Cases, §FR-012]
- [x] CHK016 ¿Está definido qué pasa con un dato legal sin fuente oficial y qué cuenta como fuente oficial? [Edge Case, Spec §FR-011, §Edge Cases]
- [x] CHK017 ¿Está definido el ida y vuelta entre el pedido de verificación y «Cómo se verifica», también con la sesión vencida? [Edge Case, Spec §US3, §FR-031, §Edge Cases]
- [x] CHK018 ¿Está definido el pie en la pantalla de cuenta suspendida, el índice con algunas páginas y una dirección mal escrita? [Edge Case, Spec §Edge Cases]
- [x] CHK019 ¿Está definida la lectura con conexión lenta o sin imágenes? [Coverage, Spec §FR-014, §US1 escenario 6]

## Errores y qué puede hacer la persona

- [x] CHK020 ¿Cada rechazo o desvío (acción sin sesión, acción sin teléfono verificado, identidad ya verificada o en revisión, cuenta suspendida, página inexistente, falla al cargar) dice qué ve la persona y qué puede hacer? [Coverage, Spec §US1, §US2, §US3, §FR-004, §FR-005, §FR-007, §FR-015]

## Calidad general

- [x] CHK021 ¿La spec evita nombrar tablas, columnas, políticas, consultas, componentes, rutas, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK022 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK023 ¿El alcance está acotado y lo que queda fuera está listado como en la historia, incluida la indexación (#76)? [Scope, Spec §Assumptions, §FR-041, story.md §Alcance]
- [x] CHK024 ¿La medición dice qué se mide y desde qué orígenes, sin datos de las personas? [Completeness, Spec §FR-050-053]
- [x] CHK025 ¿Las reglas de esta spec son consistentes con #11, #12, #57, #67, #69 y #71 y con las decisiones del enjambre de la historia? [Consistency, Spec §Assumptions, docs/08 §Encontrable, docs/03 §7]
- [x] CHK026 ¿Lo que la tarjeta del enlace compartido muestra está definido y es consistente con que las páginas sigan fuera de los buscadores? [Consistency, Spec §FR-040, §FR-041]

## Notes

- Endurecimiento: 3 rondas de spec-grader y spec-adversary. Ronda 1: 2 HIGH (respaldo legal, «Verificar mi identidad» sin nivel 1); ronda 2: 2 HIGH (el pie y Opinar, la medición que ya existe); ronda 3: sin CRITICAL ni HIGH. Los MEDIUM se plegaron a la spec o quedan en Assumptions.
