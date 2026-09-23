# Calidad de requisitos — Verificación de teléfono para poder publicar y solicitar

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-09-22
**Feature**: [spec.md](../spec.md)

**Nota**: checklist generada por `/speckit-checklist` a partir del contexto de la feature.
**Propiedad de la revisión**: es un artefacto del revisor. Un ítem se marca `[x]` solo cuando el
revisor determinó que el criterio de calidad del requisito está satisfecho.
**Semántica del marcador**: `[x]` significa que el requisito está bien escrito. No significa que
esté implementado.

## Cobertura de escenarios por user story

- [x] CHK001 ¿Cada user story declara cómo se prueba sola, sin depender de las otras? [Completeness, Spec §US1-US3]
- [x] CHK002 ¿Las user stories están priorizadas y la spec justifica cada prioridad? [Completeness, Spec §US1-US3]
- [x] CHK003 ¿Todo criterio de aceptación de la historia original tiene su escenario equivalente en la spec, y cada desvío de la historia está explicado en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK004 ¿Hay escenario escrito para el camino feliz de cada user story? [Coverage, Spec §US1.2, §US2.2, §US3.1]
- [x] CHK005 ¿Están escritos los escenarios de abandono y regreso —número a medias en una primera verificación y en un cambio—? [Recovery, Spec §US1.13, §US3.3, §FR-015]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US3]
- [x] CHK007 ¿Está especificado cómo se prueba la puerta de publicar y solicitar mientras esas acciones no existen, sin inventar acciones falsas? [Coverage, Spec §US2, §Assumptions]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK008 ¿La spec enumera las pantallas de la historia y para cada una dice su estado vacío, o que no aplica y por qué? [Completeness, Spec §Pantallas]
- [x] CHK009 ¿Está definido el estado mientras se pide el código y mientras se confirma, de modo que no se pueda mandar dos veces? [Completeness, Spec §Pantallas, §Edge Cases]
- [x] CHK010 ¿Está definido qué ve la persona en «Mi perfil» en cada uno de los tres estados —sin teléfono, a medias, verificado—? [Completeness, Spec §FR-018]
- [x] CHK011 ¿Está definido qué ve una persona ya verificada que abre la pantalla de verificar o el aviso de la puerta? [Coverage, Spec §Edge Cases, §FR-013d]
- [x] CHK012 ¿El estado de error de cada pantalla dice qué pasó y qué puede hacer la persona? [Clarity, Spec §Pantallas]

## Quién ve cada dato personal y cuándo

- [x] CHK013 ¿La spec lista cada dato que se guarda (teléfono, fecha, número a medias, registro de pedidos, conteo por número) y quién puede verlo? [Completeness, Spec §FR-019, §FR-021, §Key Entities]
- [x] CHK014 ¿Está escrito cómo se demuestra cada regla de visibilidad con un intento fallido de lectura? [Measurability, Spec §FR-019a, §SC-006]
- [x] CHK015 ¿Está definido cuánto se conserva cada dato y cuándo se borra, incluido al borrar la cuenta? [Completeness, Spec §FR-015, §FR-020, §FR-021, §FR-022]
- [x] CHK016 ¿La excepción que sobrevive al borrado de la cuenta está justificada y acotada, y no contradice la promesa de borrado de la historia #9? [Consistency, Spec §FR-021]
- [x] CHK017 ¿Está especificado que averiguar si un número está registrado exige tener ese número en la mano, en todos los caminos (pedir, topes, mensajes)? [Coverage, Spec §FR-008, §FR-011, §FR-019b]
- [x] CHK018 ¿Está dicho qué pasa con el teléfono frente a quien administra el sitio, de forma consistente con la historia #9? [Consistency, Spec §FR-019]
- [x] CHK019 ¿Los eventos de medición están definidos sin datos que identifiquen a la persona ni al número? [Completeness, Spec §FR-024]

## Casos borde y límites

- [x] CHK020 ¿Están cuantificados todos los números de la historia —vencimiento, intentos, espera, topes— sin palabras vagas como "pocos" o "varios"? [Clarity, Spec §FR-006, §FR-007, §FR-010, §FR-011]
- [x] CHK021 ¿Está definido si los topes son por ventana móvil o por día de calendario, y en qué hora se le informa a la persona? [Clarity, Spec §FR-010, §Assumptions]
- [x] CHK022 ¿Está definido qué formas de escribir un número se aceptan como el mismo, y cuáles se rechazan con qué motivo? [Clarity, Spec §FR-001, §FR-002]
- [x] CHK023 ¿Está definido el orden cuando un código no sirve por más de un motivo a la vez? [Edge Case, Spec §FR-007a]
- [x] CHK024 ¿Están cubiertos los casos de concurrencia —dos cuentas confirmando el mismo número, dos toques seguidos—? [Edge Case, Spec §FR-008a, §Edge Cases]
- [x] CHK025 ¿Está definido qué pasa al escribir como número nuevo el que ya está verificado, y al pedir un tercer número con uno a medias? [Edge Case, Spec §FR-017c, §FR-017d]
- [x] CHK026 ¿Está definido a qué vuelve la cuenta al cancelar un cambio y al cancelar una primera verificación? [Clarity, Spec §FR-017b]
- [x] CHK027 ¿Está definido si un intento de pedido que no salió o que frenó un tope cuenta para los topes y para la medición? [Consistency, Spec §FR-009a, §FR-024]

## Errores y qué puede hacer la persona

- [x] CHK028 ¿Cada motivo de rechazo del código tiene su mensaje distinto y su salida en un toque? [Completeness, Spec §FR-007a, §SC-004]
- [x] CHK029 ¿Está definido qué ve la persona cuando el mensaje no llega, incluido qué revisar y cómo corregir el número? [Coverage, Spec §US1.10]
- [x] CHK030 ¿Está definido qué ve la persona cuando el mensaje no se pudo mandar por una falla ajena? [Exception Flow, Spec §FR-009a]
- [x] CHK031 ¿Está definido qué caminos se le ofrecen a quien encuentra su número en uso en otra cuenta, sin revelar nada de esa cuenta? [Clarity, Spec §FR-008]
- [x] CHK032 ¿Está definido qué pasa si la sesión vence con la pantalla del código abierta? [Recovery, Spec §Edge Cases]
- [x] CHK033 ¿La vuelta al destino después de verificar está especificada para los tres pasos encadenados (ingresar, completar perfil, verificar) y para un destino ajeno al sitio? [Coverage, Spec §FR-013b, §FR-013c, §SC-007]

## Sin detalles de implementación

- [x] CHK034 ¿La spec evita nombrar tecnologías, servicios, estructuras de datos, rutas de archivo o códigos de respuesta? [Constitución §I]
- [x] CHK035 ¿Los criterios de éxito son medibles y están escritos sin tecnología? [Measurability, Spec §SC-001-SC-008]
- [x] CHK036 ¿Todo lo que queda afuera está listado con dónde se retoma, y nada de lo que entra toca la tabla "Fuera del MVP"? [Scope, Spec §Assumptions, docs/03]

## Notes

- `/speckit-implement` lee el estado de esta checklist pero no cambia sus marcadores.
