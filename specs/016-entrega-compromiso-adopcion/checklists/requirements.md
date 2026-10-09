# Calidad de requisitos — Marcar a quién se entregó cada animal y aceptar entre los dos el compromiso de adopción

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-10-08
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
- [x] CHK003 ¿Están definidos sin ambigüedad entrega, adopción, en curso, terminada, deshecha, compromiso pendiente y aceptado, y contacto cortado, y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está escrito qué ve cada actor (quien lo dio, la persona que adoptó, otra aceptada no elegida, otra solicitante, otra persona con sesión, un visitante, quien administra) en cada pantalla de la historia? [Coverage, Spec §FR-030, §FR-043, §FR-062]
- [x] CHK005 ¿Está escrito qué le pasa a la adopción y a su compromiso con cada cambio del animal (volver a publicar, edición, borrado) y de cada persona (bloqueo en las dos direcciones, suspensión y reactivación de cada lado, cambio de nombre, pérdida del teléfono, borrado de cuenta de cada lado)? [Completeness, Spec §FR-031-FR-034, §FR-063, §Edge Cases]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla y correo que toca la historia y para cada una dice su vacío, o que no aplica? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando de cada pantalla con datos y el estado ocupado de cada acción (marcar adoptado, aceptar el compromiso, «Yo no adopté», volver a publicar)? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está definido el error de cada pantalla al cargar y de cada acción, con qué puede hacer la persona? [Completeness, Spec §Pantallas, §FR-004]
- [x] CHK010 ¿Está escrito qué ve cada persona después de que cada acción sale bien? [Completeness, Spec §US1-US4]

## Quién ve cada dato personal y cuándo

- [x] CHK011 ¿Está escrito en qué estados de la adopción se ve el teléfono, para quién, y que las aceptadas no elegidas lo dejan de ver? [Completeness, Spec §FR-006, §FR-030]
- [x] CHK012 ¿Está escrito quién puede leer a quién se entregó un animal y el compromiso, y que ni la ficha, ni el perfil, ni el listado, ni quien administra lo ven? [Completeness, Spec §FR-043, §FR-062]
- [x] CHK013 ¿Está escrito que ninguna pantalla ni correo distingue un bloqueo de una suspensión ni le dice a la bloqueada que la bloquearon? [Completeness, Spec §FR-033]
- [x] CHK014 ¿Está escrito qué no lleva ningún correo ni ningún evento de medición? [Completeness, Spec §FR-054, §FR-071]
- [x] CHK015 ¿Está escrito qué se guarda, qué no se guarda de una entrega por fuera del sitio y qué se borra al borrar la cuenta de cada lado o el animal? [Completeness, Spec §FR-060, §FR-061, §FR-063]

## Casos borde y límites

- [x] CHK016 ¿Está definido el texto del compromiso, cuándo lleva la línea de la castración y qué pasa si la ficha cambia después? [Clarity, Spec §FR-010, §FR-011]
- [x] CHK017 ¿Están cubiertos los cambios simultáneos (doble toque, dos pestañas, retiro o bloqueo mientras se elige, el animal que cambia mientras se elige)? [Coverage, Spec §Edge Cases, §FR-004, §FR-055]
- [x] CHK018 ¿Está definido qué pasa con más de una aceptada, con ninguna, y con una aceptada sin el teléfono verificado? [Clarity, Spec §FR-001, §FR-002, §Edge Cases]
- [x] CHK019 ¿Está definido que el compromiso pendiente no vence ni se recuerda? [Clarity, Spec §FR-012]
- [x] CHK020 ¿Está definido qué pasa al volver a publicar y volver a adoptar el mismo animal? [Clarity, Spec §FR-022, §Edge Cases]

## Errores y qué puede hacer la persona

- [x] CHK021 ¿Está escrito qué ve quien publicó cuando la persona elegida dejó de estar aceptada al confirmar, y cómo sigue? [Coverage, Spec §FR-004]
- [x] CHK022 ¿Está escrito qué ve la persona que adoptó cuando falla la conexión al aceptar, cuando la adopción ya cambió, o con la cuenta suspendida? [Coverage, Spec §US2, §FR-013, §FR-034]
- [x] CHK023 ¿Está escrito qué ve quien abre el enlace de una adopción ajena, el de un correo sin sesión o con otra cuenta? [Coverage, Spec §FR-044, §Edge Cases]
- [x] CHK024 ¿Está escrito qué ve quien quiere volver a publicar sin el teléfono verificado con una adopción en curso? [Coverage, Spec §Edge Cases]

## Nada de implementación

- [x] CHK025 ¿La spec evita nombrar tablas, columnas, políticas, consultas, componentes, rutas, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK026 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK027 ¿El alcance está acotado y lo que queda fuera está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
- [x] CHK028 ¿La medición dice qué se mide sin datos de las personas y alcanza para el paso «adoptado» del funnel y la parte entregada por el sitio? [Completeness, Spec §FR-070, §FR-071, §SC-007]

## Notes

- `/speckit-implement` lee el estado de esta checklist pero no cambia sus marcadores.
