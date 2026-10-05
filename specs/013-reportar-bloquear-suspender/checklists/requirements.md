# Calidad de requisitos — Reportar, bloquear y suspender

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

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US4]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Están definidos sin ambigüedad reporte, sin resolver, cerrar sin medidas, bloqueo, suspensión, reactivar, historial y número retenido, y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está escrito qué ve cada actor (visitante sin sesión, persona con sesión, quien bloqueó, la bloqueada, la reportada, la suspendida, quien administra) en el perfil público, el listado, la portada, el enlace de un animal y la vista previa? [Coverage, Spec §Pantallas, §FR-015, §FR-017, §FR-020]
- [x] CHK005 ¿Está escrito qué le pasa a cada cosa existente al suspender y al reactivar (perfil, avales dados y recibidos, pedido de identidad, identidad verificada, publicaciones y su vencimiento, Publicaciones por revisar, correos, sesión abierta, teléfono)? [Completeness, Spec §FR-019-FR-023, §Edge Cases]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla que toca la historia y para cada una dice su vacío, o que no aplica? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando de cada pantalla con datos y el estado ocupado de cada acción (reportar, bloquear, desbloquear, cerrar, suspender, reactivar)? [Completeness, Spec §Pantallas, §FR-030]
- [x] CHK009 ¿Está definido el error de cada pantalla al cargar y de cada acción, con qué puede hacer la persona? [Completeness, Spec §Pantallas, §FR-030]
- [x] CHK010 ¿Está escrito qué ve la persona después de que cada acción sale bien? [Completeness, Spec §Pantallas, §US1-US3]

## Quién ve cada dato personal y cuándo

- [x] CHK011 ¿Está escrito que la reportada nunca se entera, ni por pantalla ni por correo, y que quien reportó no se entera del resultado? [Completeness, Spec §FR-006, §FR-013]
- [x] CHK012 ¿Está escrito que la bloqueada no se entera y qué cambia (y qué no) en lo que ve? [Completeness, Spec §FR-017]
- [x] CHK013 ¿Está escrito que una suspensión no se exhibe a nadie más que a la suspendida, incluida la vista previa y la ficha? [Completeness, Spec §FR-020]
- [x] CHK014 ¿Está acotado qué se guarda del número retenido, cuánto dura y que nadie lo ve? [Clarity, Spec §FR-027, §FR-028]
- [x] CHK015 ¿Está escrito qué se borra y qué queda al borrar una cuenta que reportó, que fue reportada, que bloqueó o que estaba suspendida? [Completeness, Spec §FR-041]
- [x] CHK016 ¿Está escrito que cada regla de visibilidad se demuestra con intentos fallidos de leer? [Coverage, Spec §FR-042, §SC-002]

## Casos borde y límites

- [x] CHK017 ¿Están definidos los límites del texto del reporte y del motivo de suspensión, y qué cuenta como vacío? [Clarity, Spec §FR-003, §FR-018]
- [x] CHK018 ¿Está definida la regla de reporte repetido (mismo motivo, sin resolver) y qué pasa con otro motivo o después de resuelto? [Clarity, Spec §FR-004]
- [x] CHK019 ¿Están cubiertos los cambios simultáneos (dos personas que administran, doble toque, perfil suspendido o borrado mientras se reporta)? [Coverage, Spec §Edge Cases, §FR-011, §FR-030]
- [x] CHK020 ¿Está definido qué pasa con los avales al bloquear y al desbloquear, incluida la quita de la historia #12? [Clarity, Spec §FR-016]
- [x] CHK021 ¿Está definido el plazo del número retenido, desde cuándo cuenta y qué pasa al vencer? [Clarity, Spec §FR-027]
- [x] CHK022 ¿Está definido qué pasa con los reportes sin resolver de una cuenta al suspenderla? [Clarity, Spec §FR-012]

## Errores y qué puede hacer la persona

- [x] CHK023 ¿Está escrito qué ve quien intenta reportar o bloquear sin sesión, y a dónde vuelve? [Coverage, Spec §FR-001, §FR-014]
- [x] CHK024 ¿Está escrito qué ve quien no administra al intentar abrir las listas o suspender? [Coverage, Spec §FR-007, §FR-025]
- [x] CHK025 ¿Está escrito qué ve quien intenta verificar un número de una cuenta suspendida o retenido, y qué puede hacer? [Coverage, Spec §FR-026, §Pantallas]
- [x] CHK026 ¿Está escrito qué pasa si falla el correo de suspensión o reactivación? [Coverage, Spec §FR-031]

## Nada de implementación

- [x] CHK027 ¿La spec evita nombrar tablas, columnas, políticas, consultas, componentes, rutas, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK028 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK029 ¿El alcance está acotado y lo que queda fuera está listado como en la historia? [Scope, Spec §Assumptions, story.md §Alcance]
- [x] CHK030 ¿La medición dice qué se mide sin datos de la persona reportada, bloqueada ni suspendida? [Completeness, Spec §FR-050]

## Notes

- `/speckit-implement` lee el estado de esta checklist pero no cambia sus marcadores.
