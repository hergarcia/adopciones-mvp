# Calidad de requisitos — Responder las solicitudes de un animal y hablar por WhatsApp al aceptar

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-10-07
**Feature**: [spec.md](../spec.md)

**Nota**: checklist generada por `/speckit-checklist` con el foco: cobertura de escenarios por user
story; el vacío, el cargando y el error de cada pantalla; quién ve cada dato personal y cuándo;
casos borde y límites; errores y qué puede hacer la persona; nada de implementación.
**Propiedad de la revisión**: es un artefacto del revisor. Un ítem se marca `[x]` solo cuando el
revisor determinó que el criterio de calidad del requisito está satisfecho.
**Semántica del marcador**: `[x]` significa que el requisito está bien escrito. No significa que
esté implementado.

## Cobertura de escenarios por user story

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US5]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Están definidos sin ambigüedad esperando respuesta, aceptada, rechazada, no aceptada, dejar sin efecto, nueva, pregunta, contacto y Abrir WhatsApp, y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está escrito qué ve cada actor (el publicador, quien solicitó en cada estado, otra solicitante del mismo animal, otra persona con sesión, un visitante, quien administra) en cada pantalla de la historia? [Coverage, Spec §FR-001, §FR-012, §FR-015, §FR-081]
- [x] CHK005 ¿Está escrito qué le pasa a una solicitud esperando respuesta y a una aceptada con cada cambio del animal (pausa, vencimiento, en proceso, adopción, volver a publicar, borrado, baja) y de cada persona (retiro, bloqueo en las dos direcciones, suspensión de cada lado, cambio o pérdida del teléfono, borrado de cuenta de cada lado)? [Completeness, Spec §FR-040-FR-044, §Edge Cases]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US5]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla y correo que toca la historia y para cada una dice su vacío, o que no aplica? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando de cada pantalla con datos y el estado ocupado de cada acción (aceptar, rechazar, dejar sin efecto, preguntar, contestar, marcar en proceso)? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está definido el error de cada pantalla al cargar y de cada acción, con qué puede hacer la persona? [Completeness, Spec §Pantallas, §FR-044]
- [x] CHK010 ¿Está escrito qué ve cada persona después de que cada acción sale bien? [Completeness, Spec §Pantallas, §US1-US3]

## Quién ve cada dato personal y cuándo

- [x] CHK011 ¿Está escrito en qué estados se ve el contacto, para quién, y que nunca se ve el correo? [Completeness, Spec §FR-012, §FR-018, §FR-081]
- [x] CHK012 ¿Está escrito que se muestra el teléfono verificado de hoy y qué se ve cuando no hay uno? [Clarity, Spec §FR-013, §FR-083]
- [x] CHK013 ¿Está escrito quién puede leer el motivo del rechazo, las preguntas y las respuestas, y que quien administra no? [Completeness, Spec §FR-021, §FR-033, §FR-081]
- [x] CHK014 ¿Está escrito que el publicador no distingue retiro, bloqueo y suspensión, y que la bloqueada no se entera? [Completeness, Spec §FR-042, §SC-008]
- [x] CHK015 ¿Está escrito qué no lleva ningún correo, ningún mensaje de WhatsApp y ningún evento de medición? [Completeness, Spec §FR-014, §FR-063, §FR-091]
- [x] CHK016 ¿Está escrito qué se guarda y qué se borra al borrar la cuenta de cada lado? [Completeness, Spec §FR-080, §FR-082, §Edge Cases]

## Casos borde y límites

- [x] CHK017 ¿Están definidos los topes de 500 y 200 caracteres, qué cuenta como vacío, y el límite de 3 preguntas con una pendiente? [Clarity, Spec §FR-020, §FR-030, §FR-031, §FR-034]
- [x] CHK018 ¿Está definido cuándo sale y cuándo no el correo de solicitud nueva, sin ambigüedad sobre qué «abre la bandeja»? [Clarity, Spec §FR-060, §Assumptions]
- [x] CHK019 ¿Están cubiertos los cambios simultáneos (doble toque, dos pestañas del publicador, retiro mientras se responde, cierre mientras se contesta una pregunta)? [Coverage, Spec §Edge Cases, §FR-044, §FR-064]
- [x] CHK020 ¿Está definido qué pasa con más de una aceptada en el mismo animal? [Clarity, Spec §FR-015]
- [x] CHK021 ¿Está definido cuándo se ofrece «En proceso» y que no se marca solo? [Clarity, Spec §FR-017]

## Errores y qué puede hacer la persona

- [x] CHK022 ¿Está escrito qué ve el publicador que quiere aceptar sin su teléfono verificado o con el de quien solicitó sin verificar, y qué puede hacer igual? [Coverage, Spec §FR-011]
- [x] CHK023 ¿Está escrito qué ve quien manda contacto en una pregunta, una respuesta o la línea de «otro», y que lo escrito no se pierde? [Coverage, Spec §FR-034]
- [x] CHK024 ¿Está escrito qué ve quien abre una bandeja o una solicitud que no es suya, o el enlace de un correo viejo o con otra cuenta? [Coverage, Spec §FR-001, §Edge Cases]
- [x] CHK025 ¿Está escrito qué ve quien fue rechazado al volver a la ficha del animal? [Coverage, Spec §FR-023]

## Nada de implementación

- [x] CHK026 ¿La spec evita nombrar tablas, columnas, políticas, consultas, componentes, rutas, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK027 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK028 ¿El alcance está acotado y lo que queda fuera está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
- [x] CHK029 ¿La medición dice qué se mide sin datos de la persona y alcanza para la tercera métrica de éxito? [Completeness, Spec §FR-090, §FR-091, §SC-007]

## Notes

- `/speckit-implement` lee el estado de esta checklist pero no cambia sus marcadores.
