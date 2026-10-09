# Calidad de requisitos — Seguimiento a los 30 días de cada adopción y adopciones con seguimiento en el perfil

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
- [x] CHK003 ¿Están definidos sin ambigüedad el pedido (pedido, respondido, cerrado sin respuesta), el día 30, la adopción con seguimiento y el historial, y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está escrito qué ve cada actor (quien lo dio, la persona que adoptó, otra solicitante del mismo animal, otra persona con sesión, un visitante, quien administra) del pedido, la respuesta y los números en cada pantalla? [Coverage, Spec §FR-030-FR-036, §FR-040-FR-042]
- [x] CHK005 ¿Está escrito qué le pasa al pedido y a la respuesta con cada cambio de la adopción (termina, se deshace), del animal (vuelve a publicarse, se borra, se adopta de nuevo) y de cada persona (bloqueo en las dos direcciones, desbloqueo, suspensión y reactivación de cada lado, cambio de nombre, borrado de cuenta de cada lado), antes y después del día 30 y antes y después de responder? [Completeness, Spec §FR-002, §FR-020-FR-023, §FR-034, §FR-044, §FR-053, §Edge Cases]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla y correo que toca la historia y para cada una dice su vacío, o que no aplica? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando de cada pantalla con datos y el estado ocupado de «Mandar»? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está definido el error de cada pantalla al cargar y de mandar la respuesta, con qué puede hacer la persona y qué conserva? [Completeness, Spec §Pantallas, §FR-014]
- [x] CHK010 ¿Está escrito qué ve cada persona después de que mandar sale bien, y qué ve en un reintento cuando el primer intento sí había llegado? [Completeness, Spec §US2]

## Datos personales: quién ve qué y cuándo

- [x] CHK011 ¿Está escrito qué se guarda del seguimiento y nada más? [Completeness, Spec §FR-050]
- [x] CHK012 ¿Está escrito, para las fotos, el texto y la fecha de la respuesta, quién los ve y por qué caminos no los ve nadie más? [Coverage, Spec §FR-033, §FR-051]
- [x] CHK013 ¿Está definido qué deja de ver cada una después de un bloqueo, desde qué lado, y que el sello y los números quedan? [Clarity, Spec §FR-034]
- [x] CHK014 ¿Está escrito que los números del historial no dicen qué animales ni con quién, y que no aparece un cero? [Clarity, Spec §FR-040-FR-042]
- [x] CHK015 ¿Está escrito qué no llevan los correos (teléfono, correo, texto de la respuesta)? [Completeness, Spec §FR-052]
- [x] CHK016 ¿Está escrito qué pasa con la respuesta y sus fotos al borrar cada cuenta o el animal? [Completeness, Spec §FR-053]

## Casos borde y límites

- [x] CHK017 ¿Están cuantificados los límites de la respuesta (cuántas fotos, formatos y tamaño, largo del texto, texto vacío)? [Clarity, Spec §FR-010, §FR-011, §Edge Cases]
- [x] CHK018 ¿Está definido cómo se cuenta el día 30 (calendario, zona horaria) y qué pasa si ese día no se pudo pedir? [Clarity, Spec §Vocabulario, §FR-003]
- [x] CHK019 ¿Está definido qué pasa con el doble toque, el reintento y dos pestañas, y que sale un solo correo? [Coverage, Spec §FR-013, §SC-004]
- [x] CHK020 ¿Está definido qué pasa al mandar cuando el pedido se cerró mientras la persona tenía la pantalla abierta? [Edge Case, Spec §US4 escenario 5]
- [x] CHK021 ¿Está definido el efecto de la respuesta sobre «Yo no adopté» y sobre el compromiso pendiente? [Consistency, Spec §FR-017]
- [x] CHK022 ¿Están cubiertas las adopciones marcadas antes de esta historia? [Assumption, Spec §Edge Cases]

## Errores y qué puede hacer la persona

- [x] CHK023 ¿Cada rechazo (sin foto, más de 3 fotos, archivo que no es foto, conexión cortada, pedido cerrado, cuenta suspendida, adopción ajena) dice qué ve la persona y qué puede hacer? [Coverage, Spec §US2, §US4, §FR-011, §FR-014, §FR-035, §FR-036]
- [x] CHK024 ¿Está escrito qué pasa cuando un correo no se pudo mandar? [Exception Flow, Spec §Edge Cases, §US1 escenario 9]

## Calidad general

- [x] CHK025 ¿La spec evita nombrar tablas, columnas, políticas, consultas, componentes, rutas, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK026 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK027 ¿El alcance está acotado y lo que queda fuera está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
- [x] CHK028 ¿La medición dice qué se mide sin datos de las personas y alcanza para la parte de los seguimientos respondidos? [Completeness, Spec §FR-060, §FR-061, §SC-007]
- [x] CHK029 ¿Las reglas de esta spec son consistentes con las de #67 (contacto cortado, fin de la adopción, «Yo no adopté») y con las decisiones del enjambre de la historia? [Consistency, Spec §Assumptions, docs/03 §5]

## Notes

- `/speckit-implement` lee el estado de esta checklist pero no cambia sus marcadores.
