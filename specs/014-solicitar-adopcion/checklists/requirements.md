# Calidad de requisitos — Solicitar la adopción de un animal con el cuestionario

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-10-06
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
- [x] CHK003 ¿Están definidos sin ambigüedad solicitud, activa, enviada, retirada, cerrada, motivo de cierre, nivel exigido, recibir solicitudes y borrador, y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está escrito qué ve cada actor (visitante sin sesión, persona sin teléfono verificado, con nivel 1, con nivel 2, con pedido de identidad en revisión, el publicador, la bloqueada, quien bloqueó, la suspendida) al abrir la ficha y tocar «Quiero adoptar»? [Coverage, Spec §FR-001-FR-005, §FR-063]
- [x] CHK005 ¿Está escrito qué le pasa a una solicitud activa con cada cambio del animal (en proceso, pausa, vencimiento, publicador sin teléfono, adopción, volver a publicar, borrado, baja) y de cada persona (bloqueo en las dos direcciones, desbloqueo, suspensión y reactivación de cada lado, borrado de cuenta de cada lado)? [Completeness, Spec §FR-060-FR-066, §Edge Cases]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla que toca la historia y para cada una dice su vacío, o que no aplica? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando de cada pantalla con datos y el estado ocupado de cada acción (enviar, retirar)? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está definido el error de cada pantalla al cargar y de cada acción, con qué puede hacer la persona? [Completeness, Spec §Pantallas, §FR-030, §FR-031]
- [x] CHK010 ¿Está escrito qué ve la persona después de que cada acción sale bien (enviar, retirar, retirar desde el límite, elegir el nivel exigido)? [Completeness, Spec §Pantallas, §US1-US3]

## Quién ve cada dato personal y cuándo

- [x] CHK011 ¿Está escrito quién puede leer las respuestas, en esta historia y desde la siguiente, y que quien administra no? [Completeness, Spec §FR-081, §FR-084]
- [x] CHK012 ¿Está escrito que mandar una solicitud no revela el teléfono ni el correo de nadie, en ninguna dirección, y que las respuestas no aceptan contacto? [Completeness, Spec §FR-023, §FR-033]
- [x] CHK013 ¿Está escrito que la bloqueada nunca se entera del bloqueo por una solicitud, en ninguna pantalla? [Completeness, Spec §FR-062, §FR-063, §SC-007]
- [x] CHK014 ¿Está escrito dónde vive el borrador, que nunca llega al sitio y cuándo se borra? [Clarity, Spec §FR-040-FR-042, §FR-083]
- [x] CHK015 ¿Está escrito qué se borra y qué queda al borrar la cuenta de quien solicitó, del publicador, o el animal? [Completeness, Spec §FR-082, §Edge Cases]
- [x] CHK016 ¿Está escrito que cada regla de visibilidad se demuestra con intentos fallidos de leer? [Coverage, Spec §FR-084, §SC-002]

## Casos borde y límites

- [x] CHK017 ¿Están definidos el tope de 500 caracteres, qué cuenta como sin contestar y las dos preguntas que dependen de otra? [Clarity, Spec §FR-020-FR-022]
- [x] CHK018 ¿Están definidos el límite de 3 activas y la regla de una activa por animal, también entre pestañas y dispositivos? [Clarity, Spec §FR-050]
- [x] CHK019 ¿Están cubiertos los cambios simultáneos (doble toque, dos pestañas, el publicador cambia el animal o el nivel mientras se contesta, bloqueo mientras se contesta)? [Coverage, Spec §Edge Cases, §FR-030, §FR-031]
- [x] CHK020 ¿Está definido de dónde salen las respuestas propuestas y cómo conviven con el borrador y con preguntas que la anterior no tenía? [Clarity, Spec §FR-025, §FR-042]
- [x] CHK021 ¿Está definido a qué animal lleva el correo de identidad aprobada cuando se pidió desde varios o desde ninguno? [Clarity, Spec §FR-012, §Edge Cases]

## Errores y qué puede hacer la persona

- [x] CHK022 ¿Está escrito qué ve quien toca «Quiero adoptar» sin sesión, sin teléfono verificado, sin el nivel exigido o con 3 activas, y a dónde vuelve después de resolverlo? [Coverage, Spec §FR-002, §FR-003]
- [x] CHK023 ¿Está escrito qué ve quien envía y falla por cada motivo (conexión, pregunta que falta, contacto, límite, duplicada, no disponible por ahora, ya no recibe solicitudes) y que nada de lo escrito se pierde? [Coverage, Spec §Pantallas, §FR-030, §FR-031]
- [x] CHK024 ¿Está escrito qué ve quien abre una solicitud que no es suya o que no existe? [Coverage, Spec §FR-070]
- [x] CHK025 ¿Está escrito qué pasa al retirar una solicitud que ya estaba retirada o cerrada, y si falla retirar? [Coverage, Spec §Edge Cases]

## Nada de implementación

- [x] CHK026 ¿La spec evita nombrar tablas, columnas, políticas, consultas, componentes, rutas, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK027 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK028 ¿El alcance está acotado y lo que queda fuera está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
- [x] CHK029 ¿La medición dice qué se mide sin las respuestas ni datos de la persona? [Completeness, Spec §FR-090, §FR-091]

## Notes

- `/speckit-implement` lee el estado de esta checklist pero no cambia sus marcadores.
