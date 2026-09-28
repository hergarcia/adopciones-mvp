# Calidad de requisitos — Verificación de identidad con revisión manual

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
- [x] CHK003 ¿Está escrito el camino feliz de punta a punta: oferta en el perfil, consentimiento, las dos fotos, en revisión, resolución, correo y nivel 2 en el perfil? [Coverage, Spec §US1, §US2]
- [x] CHK004 ¿Está escrito qué ve quien administra en la cola y en cada pedido, y en qué orden? [Completeness, Spec §US2.1-US2.2, §FR-014]
- [x] CHK005 ¿Está escrito qué pasa con el nivel 2 al cambiar de número y al perder el número por otra cuenta? [Coverage, Spec §US4, §FR-023]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla de la historia (pedir, estado, cola, perfil, correos) y para cada una dice su estado vacío, o que no aplica y por qué? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el estado mientras se procesa una foto, mientras se envía, mientras se retira y mientras se resuelve, de modo que nada se mande dos veces? [Completeness, Spec §Pantallas, §FR-022a]
- [x] CHK009 ¿Está definido qué muestra el estado del pedido en cada uno de sus estados (en revisión, aprobado, rechazado, vencido, sin intentos, recién retirado) con su paso siguiente? [Completeness, Spec §Pantallas, §FR-011]
- [x] CHK010 ¿Está definido qué muestra «Mi perfil» en cada combinación de teléfono e identidad? [Completeness, Spec §Pantallas, §FR-024]
- [x] CHK011 ¿El estado de error de cada pantalla dice qué pasó y qué puede hacer la persona? [Clarity, Spec §Pantallas, §SC-008]

## Quién ve cada dato personal y cuándo

- [x] CHK012 ¿La spec lista cada dato nuevo que se guarda (pedido, imágenes, identidad verificada, rechazos, registro de resolución, marca de quien administra) y quién puede verlo? [Completeness, Spec §Key Entities, §FR-029, §FR-032]
- [x] CHK013 ¿Está definido cuánto se conserva cada dato nuevo y cuándo se borra, incluido al borrar la cuenta de la persona y la de quien administra? [Completeness, Spec §FR-031, §FR-034, §FR-034a]
- [x] CHK014 ¿Está escrito cómo se demuestra cada regla de visibilidad y de escritura con un intento fallido? [Measurability, Spec §FR-029, §FR-033, §SC-003]
- [x] CHK015 ¿Está especificado que ningún dato de la cédula se guarda, tampoco lo que la foto trae adentro, y que quien administra no tiene dónde anotarlo? [Completeness, Spec §FR-008a, §FR-030, §FR-016]
- [x] CHK016 ¿Está especificado qué incluyen y qué no incluyen los correos? [Clarity, Spec §FR-026]
- [x] CHK017 ¿Está especificado qué dice el consentimiento y que sin él no se sube nada? [Completeness, Spec §FR-003, §FR-004]
- [x] CHK018 ¿Los momentos de medición están definidos sin datos que identifiquen a la persona ni a su cédula, con su disparador y su origen? [Completeness, Spec §FR-035]

## Casos borde y límites

- [x] CHK019 ¿Están cuantificados el tamaño de las fotos, la espera anunciada, el vencimiento, el tope y la retención de los rechazos? [Clarity, Spec §FR-006, §FR-010, §FR-027, §FR-028, §FR-031]
- [x] CHK020 ¿Está definido desde qué día se puede volver a pedir después del tope, y qué cuenta y qué no cuenta como intento? [Clarity, Spec §FR-027]
- [x] CHK021 ¿Está definido qué pasa si dos personas que administran resuelven a la vez, o si la persona retira mientras se resuelve? [Coverage, Spec §FR-021, §FR-022, §Edge Cases]
- [x] CHK022 ¿Está definido qué pasa si el pedido se cierra por otro camino con la pantalla de quien administra abierta, y en cuánto tiempo se entera? [Coverage, Spec §FR-021]
- [x] CHK023 ¿Está definido qué pasa con un pedido propio de quien administra, y con una sola persona que administra? [Coverage, Spec §FR-020, §Edge Cases]
- [x] CHK024 ¿Está definido qué pasa si el envío se corta o la sesión vence a mitad del pedido? [Coverage, Spec §FR-008, §Edge Cases]
- [x] CHK025 ¿Está definido qué pasa si el correo no sale? [Coverage, Spec §FR-026, §Edge Cases]

## Errores y qué puede hacer la persona

- [x] CHK026 ¿Cada rechazo de la persona (sin teléfono, pedido abierto, tope, foto no aceptada, foto dañada, envío cortado, sesión vencida) tiene su mensaje y su paso siguiente? [Coverage, Spec §US1.5-US1.9, §FR-002, §FR-006, §FR-027]
- [x] CHK027 ¿Cada motivo de rechazo tiene su explicación y qué hacer para que la próxima salga bien? [Clarity, Spec §FR-017]
- [x] CHK028 ¿Está definido qué ve quien no administra al intentar abrir la cola o una imagen, sin enterarse de qué hay adentro? [Clarity, Spec §FR-013]

## Nada de implementación

- [x] CHK029 ¿La spec evita nombrar tablas, columnas, políticas, rutas, componentes, códigos HTTP y librerías? [Content Quality, Spec completa]
- [x] CHK030 ¿Los criterios de éxito son medibles y dicen un resultado observable, sin tecnología? [Measurability, Spec §SC-001-SC-010]
- [x] CHK031 ¿El alcance respeta el "No incluye" de la historia y la tabla "Fuera del MVP"? [Scope, story.md, docs/03]
