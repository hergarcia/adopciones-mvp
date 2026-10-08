# Calidad de requisitos — Encuesta al terminar una adopción o no ser elegido, opiniones desde cualquier pantalla y WhatsApp de soporte

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
- [x] CHK003 ¿Están definidos sin ambigüedad desenlace, los tres momentos, ofrecida, respondida, cerrada y retirada, y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está escrito, para cada cierre posible de una solicitud y para cada forma de marcar adoptado, si ofrece encuesta y cuál? [Completeness, Spec §FR-003, §US1]
- [x] CHK005 ¿Está escrito qué ve cada actor (quien publicó, quien adoptó, quien no fue elegida, un visitante, una persona con sesión, una cuenta suspendida, quien administra) de la encuesta, Opinar, el pie, Opiniones y Encuestas? [Coverage, Spec §FR-004, §FR-008, §FR-020, §FR-040]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla que toca la historia y para cada una dice su vacío, o que no aplica? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando de cada pantalla con datos y el estado ocupado de «Enviar», «Ahora no» y «Borrar»? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está definido el error al cargar y al enviar, con qué puede hacer la persona y qué conserva? [Completeness, Spec §Pantallas, §FR-025, §US1 escenario 14]
- [x] CHK010 ¿Está escrito qué ve la persona después de enviar bien, y en un reintento cuando el primer intento sí había llegado? [Completeness, Spec §FR-011, §US1, §US2]

## Datos personales: quién ve qué y cuándo

- [x] CHK011 ¿Está escrito qué se guarda unido a la persona y qué sin ella, y nada más? [Completeness, Spec §FR-050, §FR-051]
- [x] CHK012 ¿Está escrito quién lee las respuestas y las opiniones y que nadie más lo hace por ningún camino? [Coverage, Spec §FR-052, §SC-004]
- [x] CHK013 ¿Está definido qué se guarda de la pantalla de una opinión sin que diga quién la mandó? [Clarity, Spec §FR-022, §Edge Cases]
- [x] CHK014 ¿Está escrito qué pasa con las ofertas, las respuestas, las opiniones y los números al borrar una cuenta? [Completeness, Spec §FR-044, §FR-050]
- [x] CHK015 ¿Está escrito que el WhatsApp de soporte no pasa datos de la persona? [Completeness, Spec §FR-053]

## Casos borde y límites

- [x] CHK016 ¿Están cuantificados los límites (500 y 1.000 caracteres, 5 opiniones por día, 30 días) y cómo se cuentan (calendario, zona horaria, por navegador)? [Clarity, Spec §FR-002, §FR-005, §FR-021, §FR-023, §Edge Cases]
- [x] CHK017 ¿Está definido qué pasa con dos desenlaces cercanos, una encuesta pendiente y otro desenlace, y un desenlace que no se abrió dentro de los 30 días? [Edge Case, Spec §FR-005, §Edge Cases]
- [x] CHK018 ¿Está definido el doble toque, el reintento y dos pestañas, también «Ahora no» contra «Enviar»? [Coverage, Spec §FR-010, §FR-025, §Edge Cases]
- [x] CHK019 ¿Está definido el efecto de «Yo no adopté», de volver a publicar, de borrar el animal, de un bloqueo y de una suspensión sobre la encuesta? [Consistency, Spec §FR-007, §FR-008, §Edge Cases]
- [x] CHK020 ¿Están cubiertos los desenlaces de antes de esta historia y la falta de número de soporte? [Assumption, Spec §Edge Cases, §FR-031]

## Errores y qué puede hacer la persona

- [x] CHK021 ¿Cada rechazo (sin opción, texto vacío, texto largo, teléfono o correo, tope del día, conexión, dirección de administración sin permiso) dice qué ve la persona y qué puede hacer? [Coverage, Spec §US1, §US2, §US3, §FR-009, §FR-023, §FR-040]

## Calidad general

- [x] CHK022 ¿La spec evita nombrar tablas, columnas, políticas, consultas, componentes, rutas, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK023 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK024 ¿El alcance está acotado y lo que queda fuera está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
- [x] CHK025 ¿La medición dice qué se mide sin datos de las personas? [Completeness, Spec §FR-060, §FR-061]
- [x] CHK026 ¿Las reglas de esta spec son consistentes con #65 y #67 y con las decisiones del enjambre de la historia? [Consistency, Spec §Assumptions, docs/03 §7]

## Notes

- `/speckit-implement` lee el estado de esta checklist pero no cambia sus marcadores.
