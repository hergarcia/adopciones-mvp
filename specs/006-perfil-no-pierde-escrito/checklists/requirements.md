# Calidad de requisitos — El perfil no pierde lo escrito si se corta la conexión o se recarga

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

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US4]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original tiene su escenario o requisito equivalente en la spec, y cada desvío o lectura de la historia está explicado en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Está escrito el camino feliz de reintentar después de un corte, incluido adónde llega la persona en el alta y al editar? [Coverage, Spec §US1.2, §FR-012]
- [x] CHK004 ¿Está escrito el caso del guardado que llegó con la respuesta perdida, en el alta y al editar, y qué confirmación ve la persona en cada uno? [Coverage, Spec §US2.1, §US2.4, §FR-012]
- [x] CHK005 ¿Está escrito qué pasa con la foto elegida o quitada en un guardado fallido y en una recarga? [Coverage, Spec §US3.2, §FR-015]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera las pantallas que toca la historia y para cada una dice su cargando, su vacío (o que no aplica y por qué) y su error? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido cuánto dura el estado ocupado del botón antes de pasar al error, y qué se puede tocar mientras tanto? [Clarity, Spec §FR-003, §Edge Cases]
- [x] CHK009 ¿Está definido que el aviso de no guardado aparece en el mismo lugar en el alta y al editar, y que hay uno solo a la vez? [Consistency, Spec §FR-002, §FR-005]
- [x] CHK010 ¿Está dicho qué pasa con el aviso cuando la conexión vuelve sola, y cuando un guardado posterior sale bien? [Completeness, Spec §FR-005, §FR-010, §Edge Cases]
- [x] CHK011 ¿Está excluido explícitamente que un guardado que no llega lleve a las pantallas de error generales? [Clarity, Spec §FR-001]

## Quién ve cada dato personal y cuándo

- [x] CHK012 ¿La spec lista qué datos del alta se conservan en el navegador y cuáles no? [Completeness, Spec §FR-014, §FR-015, §Key Entities]
- [x] CHK013 ¿Está definido cuándo se borra lo conservado y que ninguna otra cuenta en ese navegador lo ve, por cualquier camino de entrada? [Coverage, Spec §FR-016, §US3.3, §US3.4]
- [x] CHK014 ¿Está dicho que la historia no manda ni guarda datos personales nuevos, y que los eventos de medición no llevan datos de la persona? [Completeness, Spec §FR-022, §FR-019]
- [x] CHK015 ¿Está resuelta la convivencia del borrador con el nombre que trae Google, sin elegir nada por la persona? [Consistency, Spec §US3.6]

## Casos borde y límites

- [x] CHK016 ¿Está cuantificado cuánto se espera una respuesta antes de decir que el sitio no respondió, con su motivo? [Clarity, Spec §FR-003, §Assumptions]
- [x] CHK017 ¿Está definido qué pasa si la respuesta llega después del aviso? [Coverage, Spec §FR-009, §US2.5]
- [x] CHK018 ¿Está definido qué pasa con varios reintentos seguidos sin conexión y con un motivo que cambia entre intentos? [Coverage, Spec §US1.7, §Edge Cases]
- [x] CHK019 ¿Está definido qué pasa con varias pestañas del alta abiertas, o un alta ya terminada en otra pestaña? [Coverage, Spec §Edge Cases]
- [x] CHK020 ¿Está definido qué pasa al recargar editando un perfil ya completo, y que el borrador es solo del alta? [Clarity, Spec §FR-018, §Edge Cases]
- [x] CHK021 ¿Está definido qué pasa si el navegador no deja guardar nada localmente? [Coverage, Spec §FR-017, §US3.5]

## Errores y qué puede hacer la persona

- [x] CHK022 ¿Cada motivo de falla (sin conexión, el sitio no respondió, sesión cerrada, dato inválido, foto) tiene su mensaje distinto y su paso siguiente? [Coverage, Spec §FR-002, §FR-006, §FR-008, §Edge Cases]
- [x] CHK023 ¿Está dicho que reintentar manda lo que está en pantalla, con los cambios posteriores al fallo? [Clarity, Spec §FR-004, §US1.5]
- [x] CHK024 ¿Está dicho que salir con un guardado fallido sin resolver avisa como cualquier cambio sin guardar? [Consistency, Spec §FR-007, §US1.6]
- [x] CHK025 ¿Está definido el orden entre la validación de campos y la falta de conexión? [Clarity, Spec §FR-006, §US1.8]

## Medición

- [x] CHK026 ¿Los eventos nuevos tienen su disparador exacto y sus atributos, y ningún par se dispara siempre en el mismo instante? [Completeness, Spec §FR-019, §FR-021]
- [x] CHK027 ¿Está definido cómo se cuenta un fallo sin conexión y qué fallos pueden quedar sin contarse? [Clarity, Spec §FR-020, §Assumptions]
- [x] CHK028 ¿Está garantizado que «Creación de cuenta terminada» se cuenta una vez por cuenta y que un reintento no se cuenta como edición? [Measurability, Spec §FR-013, §SC-005]

## Nada de implementación

- [x] CHK029 ¿La spec evita nombrar tablas, rutas, componentes, códigos HTTP, librerías o mecanismos de almacenamiento concretos? [Clarity, Constitución §I]
- [x] CHK030 ¿Los criterios de éxito son medibles sin conocer la implementación? [Measurability, Spec §SC-001-SC-006]

## Notes

- `/speckit-implement` lee el estado de esta checklist pero no cambia sus marcadores.
