# Calidad de requisitos — Que la ficha y el listado de animales abran livianos en el teléfono

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-10-05
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
- [x] CHK003 ¿Están definidos sin ambigüedad «peso de apertura», «terminó de abrir», «lo que llega después» y «peso total», y se usan igual en toda la spec? [Clarity, Spec §Vocabulario, §FR-004]
- [x] CHK004 ¿Está escrito, para cada estado que muestra la ficha (a la vista, en proceso, adoptado, pausado o vencido para su publicador, no publicado), que se ve igual y que entra en el presupuesto? [Coverage, Spec §FR-001, §FR-002, §Edge Cases]
- [x] CHK005 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US3]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK006 ¿La spec enumera cada pantalla que toca la historia (ficha, no publicado, listado, portada) y para cada una dice su vacío, o que no aplica y por qué? [Completeness, Spec §Pantallas]
- [x] CHK007 ¿Está definido el cargando de cada pantalla, incluido qué se ve de «Compartir» antes de que pueda avisar? [Completeness, Spec §Pantallas, §FR-012]
- [x] CHK008 ¿Está definido el error de cada pantalla al abrir, al filtrar y al traer más, con qué puede hacer la persona? [Completeness, Spec §Pantallas, §FR-014]

## Quién ve cada dato personal y cuándo

- [x] CHK009 ¿Está escrito que la historia no guarda ni muestra datos nuevos y que lo que ve cada actor (visitante, persona con sesión, publicador) no cambia? [Completeness, Spec §FR-009, §FR-021]
- [x] CHK010 ¿Está escrito que la analítica registra lo mismo que hoy, sin eventos nuevos? [Completeness, Spec §FR-020]

## Casos borde y límites

- [x] CHK011 ¿Está cubierto el toque antes de que llegue lo de después, para filtrar, «Ver más» y «Compartir»? [Coverage, Spec §Edge Cases, §FR-011, §FR-012]
- [x] CHK012 ¿Está cubierta la señal que se corta antes y después de terminar de abrir? [Coverage, Spec §Edge Cases, §FR-007]
- [x] CHK013 ¿Está acotado que el peso no se puede esconder corriéndolo a después de abrir? [Clarity, Spec §FR-008, §FR-017]
- [x] CHK014 ¿Están fijados los valores de partida (188, 167 y 145 KB) y qué pasa si `main` mide otros? [Clarity, Spec §Assumptions]
- [x] CHK015 ¿Está cubierto que «Compartir» sigue igual en Mis animales, que comparte el botón? [Coverage, Spec §FR-013, §Edge Cases]

## Errores y qué puede hacer la persona

- [x] CHK016 ¿Está escrito qué ve quien toca «Compartir» sin conexión y con el permiso de copiar negado? [Coverage, Spec §US1.4-5, §FR-007]
- [x] CHK017 ¿Está escrito qué pasa con filtrar, «Ver más» y reintentar sin conexión? [Coverage, Spec §Edge Cases]
- [x] CHK018 ¿Está escrito qué dice el freno cuando falla (pantalla y KB de más)? [Clarity, Spec §FR-016, §FR-017]

## Nada de implementación

- [x] CHK019 ¿La spec evita nombrar componentes, librerías, rutas, archivos o técnicas de carga, y deja al plan cómo se aliviana cada pantalla? [Constitution §I, Spec §Requirements]
- [x] CHK020 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK021 ¿El alcance está acotado y lo que queda fuera (Lighthouse, Mis animales, perfil del publicador, transición animada, analítica, buscadores) está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
