# Calidad de requisitos — Que el enlace nuevo del correo lleve a publicar, no a Mi perfil

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

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US2]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Están definidos sin ambigüedad «destino», «enlace que no sirvió», «enlace nuevo», «destino válido/inválido» y «sin destino», y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Están cubiertas las dos salidas de «El enlace no sirve» y dicho cuándo aparece cada una? [Coverage, Spec §US1, §US2, §Assumptions]
- [x] CHK005 ¿Está cubierto el paso por completar el perfil (primera vez) y por verificar el teléfono antes de publicar, en las dos salidas? [Coverage, Spec §US1-AS1-2, §US2-AS1-2, §FR-005]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US2]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla que toca la historia y para cada una dice su vacío, o que no aplica? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está dicho que los estados existentes (enviando, enviado, error, tiempo de espera) de «El enlace no sirve» quedan como hoy? [Completeness, Spec §Pantallas, §FR-007, §FR-009]
- [x] CHK009 ¿Está escrito que ninguna pantalla cambia lo que muestra y que el destino nunca se muestra? [Clarity, Spec §FR-009, §SC-004]

## Datos personales: quién ve qué y cuándo

- [x] CHK010 ¿Está dicho qué se recuerda (solo el destino), dónde viaja, cuándo deja de importar y que no se guarda en la cuenta? [Completeness, Spec §FR-008, §Datos personales]
- [x] CHK011 ¿Está dicho que conservar el destino no expone la dirección de correo en «El enlace no sirve»? [Coverage, Spec §FR-010]

## Casos borde y límites

- [x] CHK012 ¿Están definidos el sin destino y el destino inválido, con su resultado (Mi perfil, nunca otro sitio), en las dos salidas y en «Revisá tu correo»? [Edge Case, Spec §FR-006, §US1-AS3, §US1-AS9, §US2-AS4-5, §SC-002]
- [x] CHK013 ¿Están cubiertos los motivos vencido, ya usado y reemplazado, y el pedido repetido? [Edge Case, Spec §US1-AS1, §US1-AS4-6]
- [x] CHK014 ¿Está cubierto abrir el enlace nuevo en otro dispositivo o ventana? [Edge Case, Spec §US1-AS8]
- [x] CHK015 ¿Está dicho qué pasa con el motivo «otra cuenta con sesión», y por qué queda fuera? [Edge Case, Spec §Edge Cases, §Assumptions]
- [x] CHK016 ¿Está dicho qué pasa si el destino es una pantalla que la persona no puede ver al llegar? [Edge Case, Spec §Edge Cases]

## Errores y qué puede hacer la persona

- [x] CHK017 ¿Está definido el tiempo de espera entre pedidos y que el pedido posterior conserva el destino? [Exception Flow, Spec §US1-AS10, §FR-007]
- [x] CHK018 ¿Está definido el correo que no sale y que el reintento conserva el destino? [Exception Flow, Spec §US1-AS11, §FR-007]
- [x] CHK019 ¿Está definida la cuenta suspendida y que gana sobre el destino? [Exception Flow, Spec §US1-AS12]

## Alcance y criterios medibles

- [x] CHK020 ¿El alcance está acotado con lo que no incluye (Google, correo, duración, motivos, verificación de teléfono, recordar entre dispositivos sin la pantalla, quien entra sin destino)? [Scope, Spec §Assumptions, story.md]
- [x] CHK021 ¿Los criterios de éxito son medibles y sin tecnología? [Measurability, Spec §SC-001-SC-005]
- [x] CHK022 ¿La spec está libre de detalles de implementación (tablas, rutas, componentes, códigos HTTP, librerías)? [Constitution §I]
- [x] CHK023 ¿No queda ningún marcador [NEEDS CLARIFICATION]? [Completeness]
- [x] CHK024 ¿Las decisiones del product-owner del 2026-10-07 están reflejadas en los requisitos? [Traceability, Spec §FR-002-FR-004, §FR-008]

## Notes

- `/speckit-implement` lee el estado de los marcadores pero no los cambia.
