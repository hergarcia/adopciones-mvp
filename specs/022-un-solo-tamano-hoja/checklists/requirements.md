# Calidad de requisitos — Un solo tamaño de hoja y el menú quieto al navegar

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-10-17
**Feature**: [spec.md](../spec.md)

**Nota**: checklist generada por `/speckit-checklist` con el foco: cobertura de escenarios por user
story; el vacío, el cargando y el error de cada pantalla; quién ve cada dato personal y cuándo;
casos borde y límites; errores y qué puede hacer la persona; nada de implementación.
**Propiedad de la revisión**: es un artefacto del revisor. Un ítem se marca `[x]` solo cuando el
revisor determinó que el criterio de calidad del requisito está satisfecho.
**Semántica del marcador**: `[x]` significa que el requisito está bien escrito. No significa que
esté implementado.

## Cobertura de escenarios por user story

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US2]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores y rechazos) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Están definidos sin ambigüedad la ventana, la hoja, la pared, el ancho de la hoja, el menú, el pie, el marco, «el mismo lugar», las pantallas de una sola tarea, «en dos partes», la presentación, la tarea y un flujo de foco, y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está enumerada cada pantalla de una sola tarea, con qué va en la presentación y qué en la tarea para cada una? [Completeness, Spec §US2, §FR-021-022]
- [x] CHK005 ¿Están escritos los escenarios para cada actor que ve el menú distinto (sin sesión, con sesión, quien publicó algún animal, quien administra, una cuenta suspendida)? [Coverage, Spec §US1]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona, y no del sistema? [Clarity, Spec §US1-US2]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿Está definido qué pasa con los estados vacíos centrados en la hoja nueva? [Completeness, Spec §US1 escenario 7, §FR-010]
- [x] CHK008 ¿Está definido que el esqueleto de carga ya usa la hoja y el menú en su lugar final? [Completeness, Spec §Edge Cases, §FR-007]
- [x] CHK009 ¿Está definido qué hoja usan las pantallas de error y de «no encontrado» de cada zona? [Completeness, Spec §US1 escenario 8, §FR-007]
- [x] CHK010 ¿Está definido dónde aparecen, en una pantalla en dos partes, los errores, los avisos de espera y lo que se muestra después de la acción? [Completeness, Spec §Edge Cases, §FR-025]

## Datos personales: quién ve qué y cuándo

- [x] CHK011 ¿La spec dice explícitamente si toca algún dato personal, y el único dato que aparece en estas pantallas (la dirección a la que se mandó el enlace) sigue mostrándose solo a quien lo pidió, como hoy? [Coverage, Spec §Assumptions, §FR-021]

## Casos borde y límites

- [x] CHK012 ¿Están cuantificados los anchos (390, 1024, entre 1024 y 1200, 1280, 1920) y qué pasa en cada tramo? [Measurability, Spec §Vocabulario, §FR-001, §FR-006, §FR-009]
- [x] CHK013 ¿Está definido el caso de una pantalla corta frente a una larga, con la barra de desplazamiento ocupando lugar? [Edge Case, Spec §Edge Cases, §FR-004]
- [x] CHK014 ¿Está definido qué se puede mover en el menú cuando cambia la sesión o el rol, y qué no? [Clarity, Spec §FR-003, §Edge Cases]
- [x] CHK015 ¿Está definido qué pasa con una tarea más larga que la ventana en una pantalla en dos partes? [Edge Case, Spec §FR-024]
- [x] CHK016 ¿Está definido qué pasa con las pantallas que ya se arman a lo ancho de la hoja y con las que son una columna de lectura? [Coverage, Spec §FR-010, §Edge Cases]
- [x] CHK017 ¿Está definido el orden para el teléfono y para un lector de pantalla? [Coverage, Spec §FR-026]

## Errores y qué puede hacer la persona

- [x] CHK018 ¿Cada error que hoy muestra una pantalla de una sola tarea conserva su lugar junto a lo que lo causó y su salida? [Coverage, Spec §Edge Cases, §FR-025]
- [x] CHK019 ¿Está definido qué ve una cuenta suspendida, en su pantalla y en Opinar? [Coverage, Spec §US1 escenario 9, §FR-008, §Edge Cases]

## Calidad general

- [x] CHK020 ¿La spec evita nombrar tablas, columnas, políticas, componentes, rutas de archivo, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK021 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK022 ¿El alcance está acotado y lo que queda fuera está listado como en la historia (debajo de 1024, menú, cabecera, pie, escala tipográfica, cuenta suspendida, pantallas nuevas)? [Scope, Spec §FR-008-011, story.md §Alcance]
- [x] CHK023 ¿Está escrito qué decisión de la guía de diseño se reabre, con qué motivo, y qué pasa a Descartado? [Traceability, Spec §FR-030]
