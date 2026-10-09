# Calidad de requisitos — Administrar el sitio desde un solo lugar

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

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US4]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Están definidos sin ambigüedad pendiente, lo mío, espera, plazo, atrasada, cuánto se pasó y el número de pendientes, y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está escrito qué ve cada actor (quien administra, quien administra con lo suyo en una cola, quien administra suspendida, quien deja de administrar, una persona con sesión que no administra, un visitante) de Administrar, el menú, Mi perfil, la ficha, la búsqueda y el resumen? [Coverage, Spec §FR-001, §FR-002, §Edge Cases]
- [x] CHK005 ¿Están escritos los caminos de entrada a la ficha (cada lista, Cuentas suspendidas, la búsqueda, su dirección) y de vuelta de las seis listas? [Completeness, Spec §FR-023, §FR-024, §FR-030]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla que toca la historia (también el correo) y para cada una dice su vacío, o que no aplica? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando de cada pantalla con datos y el estado ocupado de «Suspender», «Reactivar» y buscar? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está definido el error de una sola cola o entrada sin tumbar el resto de Administrar, y el del número del menú? [Completeness, Spec §FR-016, §FR-020]
- [x] CHK010 ¿Está escrito qué ve la persona después de suspender o reactivar bien desde la ficha? [Completeness, Spec §US2 escenarios 3-4]

## Datos personales: quién ve qué y cuándo

- [x] CHK011 ¿Está escrito, parte por parte, qué muestra la ficha y qué nunca muestra? [Completeness, Spec §FR-031–FR-037]
- [x] CHK012 ¿Está escrito que esta historia no guarda ningún dato nuevo de las personas, y qué se guarda del resumen? [Completeness, Spec §FR-070, §Key Entities]
- [x] CHK013 ¿Está escrito qué no lleva el resumen y a qué dirección va? [Clarity, Spec §FR-062, §FR-072]
- [x] CHK014 ¿Está escrito qué ve quien administra de lo suyo (Administrar, su ficha), sin el motivo ni el texto de un reporte sobre sí? [Completeness, Spec §FR-013, §FR-038]
- [x] CHK015 ¿Está escrito qué pasa en la ficha y en la búsqueda cuando una persona borra su cuenta, y cómo se ven quién suspendió o reactivó con una cuenta borrada? [Completeness, Spec §FR-039, §FR-034, §FR-070]
- [x] CHK016 ¿Está escrito que la medición no lleva lo buscado ni datos de las personas? [Completeness, Spec §FR-081]

## Casos borde y límites

- [x] CHK017 ¿Están cuantificados los plazos, el borde exacto del plazo y desde cuándo cuenta la espera de cada tipo de pendiente? [Clarity, Spec §Vocabulario, §FR-011, §Edge Cases]
- [x] CHK018 ¿Está definido el orden de las colas, incluidos los empates? [Clarity, Spec §FR-012, §Edge Cases]
- [x] CHK019 ¿Está definido cómo se dice una espera en horas y en días, con su redondeo? [Clarity, Spec §Vocabulario]
- [x] CHK020 ¿Están definidos los límites de la búsqueda (3 letras, 20 resultados, más de 20, orden, tildes y mayúsculas, cuentas sin nombre)? [Clarity, Spec §FR-050–FR-053, §Edge Cases]
- [x] CHK021 ¿Está definido qué pasa con muchos antecedentes en una ficha y con un número de pendientes muy grande? [Edge Case, Spec §FR-036, §FR-020]
- [x] CHK022 ¿Está definido cuándo se recalcula el número y qué pasa cuando otra persona que administra resuelve algo mientras tanto? [Edge Case, Spec §FR-022, §US1 escenario 7]
- [x] CHK023 ¿Está escrito qué pasa si el resumen no sale, si la tarea corre dos veces y para quién no se arma? [Edge Case, Spec §FR-063, §US3]
- [x] CHK024 ¿Está definido el «7 días» de Opiniones y Encuestas? [Clarity, Spec §FR-014]

## Errores y qué puede hacer la persona

- [x] CHK025 ¿Cada error (sin motivo, ya suspendida o reactivada por otra, cuenta borrada, dejó de administrar, menos de 3 letras, sin resultados, sin conexión) dice qué ve la persona y qué puede hacer, y qué conserva? [Completeness, Spec §FR-040–FR-042, §FR-051, §FR-053]

## Nada de implementación

- [x] CHK026 ¿La spec evita nombrar tablas, columnas, políticas, rutas, componentes, códigos HTTP, librerías y tecnologías? [Constitution §I]
- [x] CHK027 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK028 ¿Nada de la spec entra en la tabla «Fuera del MVP» ni en el «No incluye» de la historia? [Scope, docs/03 §Fuera del MVP, story.md]
