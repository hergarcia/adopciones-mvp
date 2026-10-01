# Calidad de requisitos — Mantener al día cada publicación: en proceso, pausa, adopción, vencimiento y revisión

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-09-30
**Feature**: [spec.md](../spec.md)

**Nota**: checklist generada por `/speckit-checklist` con el foco: cobertura de escenarios por user
story; el vacío, el cargando y el error de cada pantalla; quién ve cada dato personal y cuándo;
casos borde y límites; errores y qué puede hacer la persona; nada de implementación.
**Propiedad de la revisión**: es un artefacto del revisor. Un ítem se marca `[x]` solo cuando el
revisor determinó que el criterio de calidad del requisito está satisfecho.
**Semántica del marcador**: `[x]` significa que el requisito está bien escrito. No significa que
esté implementado.

## Cobertura de escenarios por user story

- [ ] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US4]
- [ ] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [ ] CHK003 ¿Están definidos sin ambigüedad los cuatro estados, «vencida», «dada de baja», «renovar», «reanudar» y «volver a publicar», y se usan igual en toda la spec? [Clarity, Spec §Vocabulario, §FR-001]
- [ ] CHK004 ¿Está escrito, para cada estado, qué acciones tiene el publicador y cuáles exigen el teléfono verificado? [Completeness, Spec §Edge Cases, §FR-003]
- [ ] CHK005 ¿Está escrito qué ve cada actor (visitante sin sesión, otra persona con sesión, el publicador, quien administra) en cada estado: listado, enlace, ficha y vista previa? [Coverage, Spec §FR-008-FR-013, §Edge Cases]
- [ ] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [ ] CHK007 ¿La spec enumera cada pantalla que toca la historia (Mis animales, un animal en Mis animales, ficha, no disponible, listado, los dos correos, resultado de «Sigue disponible», Publicaciones por revisar, Mi perfil, vista previa) y para cada una dice su vacío, o que no aplica y por qué? [Completeness, Spec §Pantallas]
- [ ] CHK008 ¿Está definido el cargando de cada pantalla con datos y el estado ocupado de cada acción? [Completeness, Spec §Pantallas, §Edge Cases]
- [ ] CHK009 ¿Está definido el error de cada pantalla al cargar y de cada acción, con el motivo y qué puede hacer la persona? [Completeness, Spec §Pantallas, §FR-007]
- [ ] CHK010 ¿Está separado el error del sitio al abrir «Sigue disponible» de «el enlace no sirve»? [Clarity, Spec §Pantallas]
- [ ] CHK011 ¿Está escrito qué ve la persona después de que cada acción sale bien? [Completeness, Spec §Pantallas]

## Quién ve cada dato personal y cuándo

- [ ] CHK012 ¿Está escrito qué de la revisión ve quien administra y qué ve el publicador (el motivo, nunca quién decidió)? [Completeness, Spec §FR-029]
- [ ] CHK013 ¿Está escrito que una publicación pausada, vencida, dada de baja o borrada no se puede leer por ningún camino, y que se demuestra con intentos fallidos con y sin sesión? [Completeness, Spec §FR-012, §SC-006]
- [ ] CHK014 ¿Está acotado qué ve quien administra de una publicación y de su publicador, y que nunca ve su contacto ni su zona? [Clarity, Spec §FR-024]
- [ ] CHK015 ¿Está escrito qué lleva el enlace del correo y qué muestra la pantalla de resultado, sin datos de la persona? [Completeness, Spec §FR-019, §FR-020]
- [ ] CHK016 ¿Está escrito que una ficha adoptada no muestra nada de quien adoptó y qué muestra su vista previa? [Completeness, Spec §FR-010, §FR-011]
- [ ] CHK017 ¿Está escrito qué se borra al borrar una publicación y al borrar la cuenta, incluida la revisión? [Completeness, Spec §FR-005, §FR-030]

## Casos borde y límites

- [ ] CHK018 ¿Está definido con precisión cuándo vence una publicación, desde qué momento cuenta y qué lo reinicia o lo congela? [Clarity, Spec §FR-014-FR-016, §Edge Cases]
- [ ] CHK019 ¿Está definido cuándo sale el recordatorio, cuántos por vencimiento, y qué pasa si se renueva, pausa o adopta antes? [Clarity, Spec §FR-017, §Edge Cases]
- [ ] CHK020 ¿Está definido qué hace «Sigue disponible» en cada estado, sin nivel 1, varias veces, y cuánto dura su enlace? [Coverage, Spec §FR-018, §FR-019, §Edge Cases]
- [ ] CHK021 ¿Está definida la precedencia de lo que muestra el enlace cuando se combinan estados con un publicador sin nivel 1? [Clarity, Spec §Edge Cases, §FR-009]
- [ ] CHK022 ¿Están cubiertos los cambios simultáneos (dos pestañas, publicador y quien administra, dos personas que administran) y el doble toque? [Coverage, Spec §Edge Cases, §FR-007, §FR-026]
- [ ] CHK023 ¿Está acotado el motivo «otro» (obligatorio, largo, quién lo lee)? [Clarity, Spec §FR-025, §Edge Cases]
- [ ] CHK024 ¿Está definido qué entra en Publicaciones por revisar (nueva, editada, en qué estados), su orden y cuándo sale? [Clarity, Spec §FR-022, §Edge Cases]
- [ ] CHK025 ¿Está definido el lugar en el listado y el «Publicado hace…» después de renovar, reanudar y volver a publicar? [Clarity, Spec §FR-004, §Edge Cases]

## Errores y qué puede hacer la persona

- [ ] CHK026 ¿Está escrito qué ve y qué puede hacer quien cambia un estado o renueva sin conexión? [Coverage, Spec §US1.10, §US2.8, §FR-007]
- [ ] CHK027 ¿Está escrito qué ve quien intenta reanudar, renovar o volver a publicar sin teléfono verificado? [Coverage, Spec §FR-003, §US1.8, §US2.7]
- [ ] CHK028 ¿Está escrito qué ve quien abre un enlace de cambio de estado ajeno, un «Sigue disponible» alterado, vencido o de un animal borrado, o Publicaciones por revisar sin administrar? [Coverage, Spec §FR-002, §FR-019, §FR-023]
- [ ] CHK029 ¿Está escrito qué pasa si falla el envío de un correo (recordatorio o baja)? [Coverage, Spec §FR-027, §Edge Cases]

## Nada de implementación

- [ ] CHK030 ¿La spec evita nombrar tablas, columnas, consultas, componentes, rutas, librerías, tareas programadas o códigos HTTP, y deja al plan cómo se arma el enlace del correo y cómo corre el vencimiento? [Constitution §I, Spec §Requirements]
- [ ] CHK031 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [ ] CHK032 ¿El alcance está acotado y lo que queda fuera (nivel mínimo del solicitante, a quién se entregó, solicitudes, retener hasta revisar, reportar, suspender, apelar, designar administradores, panel de M4, más recordatorios, WhatsApp o notificaciones, sección de adoptados, buscadores) está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
- [ ] CHK033 ¿La medición dice qué se mide sin guardar datos de la persona? [Completeness, Spec §FR-032]
