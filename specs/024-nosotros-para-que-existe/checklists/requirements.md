# Calidad de requisitos — «Nosotros»: para qué existe el sitio, en qué se diferencia y qué quiere decir su marca

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-10-20
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
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores y rechazos) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §US1-US2, §Edge Cases, §Assumptions]
- [x] CHK003 ¿Están definidos sin ambigüedad la página, las cuatro partes, el cierre, la marca, el dibujo grande, la firma, la chapita, el nombre del sitio, la tarjeta y la pantalla de la cuenta suspendida, y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está fijado el orden de las cuatro partes, del cierre y del enlace dentro del grupo Confianza? [Clarity, Spec §FR-002, §FR-007, §FR-018]
- [x] CHK005 ¿Está escrito qué tiene que decir cada parte con suficiente detalle para que dos personas escriban textos que cumplen lo mismo? [Clarity, Spec §FR-003-006, §FR-011-012]
- [x] CHK006 ¿Están escritos los escenarios para cada actor que ve la página o el pie distinto (sin sesión, con sesión, cuenta suspendida, lector de pantalla, quien recibe el enlace por un chat)? [Coverage, Spec §US1, §US2, §Edge Cases]
- [x] CHK007 ¿Los escenarios están escritos desde el punto de vista de la persona, y no del sistema? [Clarity, Spec §US1-US2]

## Estados: vacío, cargando y error

- [x] CHK008 ¿Está dicho por qué la página no tiene estado vacío? [Completeness, Spec §Assumptions]
- [x] CHK009 ¿Está definido qué ve la persona mientras la página carga, y qué pasa con el texto cuando el dibujo de la marca llega tarde? [Completeness, Spec §FR-024, §Edge Cases, §Assumptions]
- [x] CHK010 ¿Está definido qué ve la persona cuando la página no se puede mostrar, y qué puede hacer? [Coverage, Spec §FR-023, §Edge Cases]

## Datos personales: quién ve qué y cuándo

- [x] CHK011 ¿La spec dice explícitamente que la página no muestra ni guarda datos personales y que es la misma con sesión y sin ella? [Coverage, Spec §Assumptions, §Key Entities]
- [x] CHK012 ¿Lo que la página afirma sobre cuándo se ve el teléfono y el contacto coincide con la regla de privacidad del producto (solo después de aceptar una solicitud)? [Consistency, Spec §FR-005.2]
- [x] CHK013 ¿Está prohibido mostrar personas, animales reales, testimonios o cifras, y definido qué pasa si un ejemplo necesita un nombre? [Coverage, Spec §FR-016]

## Casos borde y límites

- [x] CHK014 ¿Están cuantificados los anchos (390, 768-1023, 1024, 1280) y dónde va el dibujo de la marca en cada tramo? [Measurability, Spec §FR-013, §SC-004, §Edge Cases]
- [x] CHK015 ¿Está cuantificado el tamaño mínimo del dibujo de la marca y el área mínima de toque de la acción y del enlace? [Measurability, Spec §FR-009, §SC-004, §SC-006]
- [x] CHK016 ¿Está definido qué pasa cuando cambia el nombre del sitio, y cuando cambia una conducta que la página describe? [Edge Case, Spec §FR-015, §FR-017, §Edge Cases]
- [x] CHK017 ¿Está definido cómo se anuncia el dibujo y cómo se recorre la página con un lector de pantalla? [Coverage, Spec §FR-010, §US2 escenario 5, §SC-005]
- [x] CHK018 ¿Está definido el comportamiento ante buscadores y al compartir el enlace? [Coverage, Spec §FR-021-022, §SC-007]

## Errores y qué puede hacer la persona

- [x] CHK019 ¿Está definido qué pasa cuando una cuenta suspendida abre la página por el enlace o escribiendo la dirección, y qué muestra su pie? [Edge Case, Spec §FR-019-020, §SC-008]
- [x] CHK020 ¿Está definido cómo sale la persona de la página (acción final, cabecera, atrás del navegador)? [Coverage, Spec §FR-007, §Edge Cases, §Assumptions]

## Calidad general

- [x] CHK021 ¿La spec evita nombrar tablas, columnas, políticas, componentes, rutas de archivo, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK022 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK023 ¿El alcance está acotado y lo que queda fuera está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
- [x] CHK024 ¿Cada una de las cinco diferencias es verificable contra una conducta del sitio de hoy, y las simplificaciones están explicadas? [Consistency, Spec §FR-005, §FR-015, §SC-003, §Assumptions]
- [x] CHK025 ¿Lo que se dice de la marca es consistente con la decisión de marca del sistema de diseño (cuatro crestas desde 32 px, tinta, no se anima ni se tuerce, no cuenta niveles)? [Consistency, Spec §FR-009, §FR-011, §FR-014]
- [x] CHK026 ¿Está escrito que la medición no cambia? [Consistency, story.md §Medición, Spec §FR-025]

## Notas

- Endurecimiento, vuelta 1. Arreglado en la spec: la pantalla de error decía lo de las páginas
  públicas en general («No pudimos traer tu perfil») y no ofrecía la portada (FR-023, HIGH); la
  verificación de los dos lados, como docs/01 (FR-005.1, MEDIUM); «conexión lenta» sin número
  (SC-010, MEDIUM); «Mi perfil» sin sesión no existe en SC-001 (MEDIUM, pasa a Opinar).
- Vuelta 2: nada CRITICAL ni HIGH. Todos los ítems pasan.
