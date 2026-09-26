# Calidad de requisitos — Recuperar un número verificado en otra cuenta

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-09-25
**Feature**: [spec.md](../spec.md)

**Nota**: checklist generada por `/speckit-checklist` con el foco: cobertura de escenarios por user
story; el vacío, el cargando y el error de cada pantalla; quién ve cada dato personal y cuándo;
casos borde y límites; errores y qué puede hacer la persona; nada de implementación.
**Propiedad de la revisión**: es un artefacto del revisor. Un ítem se marca `[x]` solo cuando el
revisor determinó que el criterio de calidad del requisito está satisfecho.
**Semántica del marcador**: `[x]` significa que el requisito está bien escrito. No significa que
esté implementado.

## Cobertura de escenarios por user story

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US3]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original tiene su escenario o requisito equivalente en la spec, y cada desvío o lectura de la historia está explicado en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Está escrito el camino feliz de cada user story, incluido a dónde llega la persona después (la acción que traía o «Mi perfil»)? [Coverage, Spec §US1.3, §US2.1, §US3.1, §FR-007]
- [x] CHK004 ¿Está escrito el escenario de recuperar el número de vuelta, y es simétrico con el de quedárselo por primera vez? [Coverage, Spec §US2.4, §FR-011c]
- [x] CHK005 ¿Está escrito qué pasa cuando la cuenta nueva ya tenía otro número verificado? [Coverage, Spec §US1.9, §FR-007]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US3]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera las cuatro pantallas de la historia y para cada una dice su estado vacío, o que no aplica y por qué? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el estado mientras se confirma quedarse con el número y mientras se cierra la sesión, de modo que no se pueda mandar dos veces? [Completeness, Spec §Pantallas, §FR-009b]
- [x] CHK009 ¿Está definido qué muestra «Mi perfil» de la cuenta anterior en cada combinación: con aviso y sin número a medias, con aviso y con número a medias, y después de verificar de nuevo? [Completeness, Spec §FR-011a, §FR-011b]
- [x] CHK010 ¿Está definido qué pasa si se abre la confirmación sin una prueba vigente? [Coverage, Spec §FR-009d]
- [x] CHK011 ¿El estado de error de cada pantalla dice qué pasó y qué puede hacer la persona? [Clarity, Spec §Pantallas, §SC-006]

## Quién ve cada dato personal y cuándo

- [x] CHK012 ¿La spec lista cada dato nuevo que se guarda (la prueba, el día en que se perdió el número) y quién puede verlo? [Completeness, Spec §Key Entities, §FR-013, §FR-013b]
- [x] CHK013 ¿Está definido cuánto se conserva cada dato nuevo y cuándo se borra, incluido al borrar la cuenta? [Completeness, Spec §FR-013, §FR-013a]
- [x] CHK014 ¿Está escrito cómo se demuestra cada regla de visibilidad y de escritura con un intento fallido? [Measurability, Spec §FR-013b, §FR-013c, §SC-005]
- [x] CHK015 ¿Está especificado que ninguna pantalla, correo ni aviso muestra datos de la otra cuenta, sin excepciones? [Coverage, Spec §FR-001, §FR-010, §FR-011a, §FR-012]
- [x] CHK016 ¿Está especificado que no queda ningún registro que una las dos cuentas, y está dicho el riesgo residual que se acepta? [Completeness, Spec §FR-013, §Assumptions]
- [x] CHK017 ¿Está especificado qué incluye y qué no incluye el correo a la cuenta anterior (el número, un enlace de ingreso)? [Clarity, Spec §FR-010]
- [x] CHK018 ¿Los momentos de medición están definidos sin datos que identifiquen a las personas, al número ni a la otra cuenta, y sin pares que se disparen siempre juntos? [Completeness, Spec §FR-014]

## Casos borde y límites

- [x] CHK019 ¿Está cuantificado cuánto vale la prueba y desde cuándo se cuenta? [Clarity, Spec §FR-005, §Assumptions]
- [x] CHK020 ¿Está definido qué deja sin efecto la prueba antes de su vencimiento? [Coverage, Spec §FR-005, §Edge Cases]
- [x] CHK021 ¿Está definido qué pasa si dos cuentas confirman a la vez, o si la cuenta anterior actúa sobre su teléfono en el mismo momento? [Coverage, Spec §FR-009a, §Edge Cases]
- [x] CHK022 ¿Está definido qué pasa si la otra cuenta ya no tiene el número al confirmar (lo cambió o borró la cuenta)? [Coverage, Spec §FR-009]
- [x] CHK023 ¿Está definido qué pasa con el cambio de número a medias de la cuenta anterior? [Coverage, Spec §US2.3, §FR-007]
- [x] CHK024 ¿Está dicho que la historia no agrega topes y que el pedido de un código nuevo respeta los de la historia #10? [Consistency, Spec §FR-008]
- [x] CHK025 ¿Está definido qué pasa si el correo a la cuenta anterior no sale? [Coverage, Spec §FR-010, §Edge Cases]

## Errores y qué puede hacer la persona

- [x] CHK026 ¿Cada rechazo (prueba vencida, tope diario, falla al confirmar, sesión vencida, código mal escrito, volver) tiene su mensaje y su paso siguiente? [Coverage, Spec §US1.4-US1.8, §FR-008, §FR-009c, §FR-011]
- [x] CHK027 ¿Está definido el estado real que se muestra después de una falla al confirmar, en sus dos resultados posibles? [Clarity, Spec §FR-011]
- [x] CHK028 ¿Está dicho que «Entrar con esa cuenta» cierra la sesión y que eso se avisa antes de tocarlo? [Clarity, Spec §FR-003, §US3.1]

## Nada de implementación

- [x] CHK029 ¿La spec está libre de tablas, columnas, políticas, rutas, componentes, códigos HTTP y librerías? [Constitution §I]
- [x] CHK030 ¿Los criterios de éxito son medibles y se pueden observar sin conocer la implementación? [Measurability, Spec §SC-001-SC-008]
- [x] CHK031 ¿Nada de la spec toca la tabla «Fuera del MVP» ni lo que la historia excluye explícitamente? [Scope, story.md §Alcance, docs/03 §Fuera del MVP]
