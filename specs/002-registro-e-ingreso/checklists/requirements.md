# Calidad de requisitos — Registro e ingreso sin contraseña con perfil básico

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-09-19
**Feature**: [spec.md](../spec.md)

**Nota**: checklist generada por `/speckit-checklist` a partir del contexto de la feature.
**Propiedad de la revisión**: es un artefacto del revisor. Un ítem se marca `[x]` solo cuando el
revisor determinó que el criterio de calidad del requisito está satisfecho.
**Semántica del marcador**: `[x]` significa que el requisito está bien escrito. No significa que
esté implementado.

## Cobertura de escenarios por user story

- [x] CHK001 ¿Cada user story declara explícitamente cómo se prueba sola, sin depender de las otras? [Completeness, Spec §US1-US5]
- [x] CHK002 ¿Las user stories están priorizadas y la spec justifica por qué cada una tiene esa prioridad? [Completeness, Spec §US1-US5]
- [x] CHK003 ¿Existe un escenario de aceptación escrito para el camino feliz de cada user story? [Coverage, Spec §US1-US5]
- [x] CHK004 ¿Están escritos los escenarios alternativos de ingreso (cuenta nueva vs. cuenta que ya existe) para los dos caminos, correo y Google? [Coverage, Spec §US1.1-US1.2, §US3.1-US3.2]
- [x] CHK005 ¿Está especificado qué pasa cuando la persona abandona a mitad de un flujo y vuelve más tarde? [Recovery, Spec §US2.5]
- [x] CHK006 ¿Están cubiertos los escenarios de excepción de cada user story, y no solo los de la US1? [Coverage, Gap]
- [x] CHK007 ¿Todo criterio de aceptación de la historia original tiene su escenario equivalente en la spec, sin que se haya perdido ninguno? [Traceability, story.md]
- [x] CHK008 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US5]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK009 ¿La spec enumera las pantallas de la historia y para cada una dice cuál es su estado vacío, o que no aplica y por qué? [Completeness, story.md §Pantallas]
- [x] CHK010 ¿Está especificado el estado de espera entre pedir el enlace y recibirlo, incluido qué ve la persona mientras tanto? [Gap, Spec §FR-003]
- [x] CHK011 ¿Está definido el estado mientras se guarda el perfil, para que no se pueda mandar dos veces? [Gap, Spec §FR-022]
- [x] CHK012 ¿Está definido qué se muestra en lugar de la foto cuando no hay ninguna? [Edge Case, Spec §FR-024]
- [x] CHK013 ¿Está definido qué se muestra mientras carga la foto ya subida? [Gap]
- [x] CHK014 ¿Está especificado el estado de error de cada pantalla —qué se dice y qué puede hacer la persona— y no solo que "hay un error"? [Clarity, Spec §FR-005, §FR-010, §FR-025]
- [x] CHK015 ¿Están definidos los estados de la lista de sugerencias de localidad o barrio: mientras filtra, y cuando ninguna sugerencia coincide? [Gap, Spec §FR-019]
- [x] CHK016 ¿Los requisitos de estados son consistentes entre pantallas, o cada una resuelve lo mismo de forma distinta? [Consistency]

## Datos personales: quién ve qué y cuándo

- [x] CHK017 ¿La spec dice, para cada dato que se guarda, quién puede verlo y en qué momento? [Completeness, Spec §FR-026, §Key Entities]
- [x] CHK018 ¿La regla de que el correo nunca es público está escrita como requisito verificable y no solo como intención? [Measurability, Spec §FR-026, §SC-005]
- [x] CHK019 ¿Está explícito que el perfil todavía no es visible para otras personas en esta historia, y dónde pasa a serlo? [Clarity, Spec §Assumptions]
- [x] CHK020 ¿Está escrito el requisito de no guardar ningún dato que la historia no nombre? [Completeness, Spec §FR-030]
- [x] CHK021 ¿Está especificado qué se borra exactamente al borrar la cuenta, y que no queda nada? [Clarity, Spec §FR-028, §SC-007]
- [x] CHK022 ¿Está definido qué pasa con las sesiones abiertas en otros dispositivos cuando se borra la cuenta? [Edge Case, Spec §FR-028]
- [x] CHK023 ¿Están definidos los eventos de medición de forma que no puedan identificar a una persona? [Clarity, Spec §FR-032]
- [x] CHK024 ¿La spec dice si quien administra el sitio ve el correo y bajo qué condición? [Completeness, Spec §FR-026]
- [x] CHK025 ¿Los requisitos de privacidad de esta historia son consistentes con la regla general de que el contacto no es público? [Consistency, docs/01]

## Casos borde y límites

- [x] CHK026 ¿Está cuantificado el vencimiento del enlace con un número, en vez de decir "vence"? [Clarity, Spec §FR-004]
- [x] CHK027 ¿Están cuantificados los límites de pedidos de enlace, por ventana corta y por hora? [Clarity, Spec §FR-006]
- [x] CHK028 ¿La spec distingue los tres motivos por los que un enlace no entra —vencido, ya usado, reemplazado— y dice qué se le comunica a la persona en cada uno? [Completeness, Spec §FR-005]
- [x] CHK029 ¿Está cuantificada la duración de la sesión con un número y con su forma de contarse? [Clarity, Spec §FR-012]
- [x] CHK030 ¿Está cuantificado el límite de tamaño de la foto y qué tipos de archivo se aceptan? [Clarity, Spec §FR-025, §Assumptions]
- [x] CHK031 ¿Está definido qué pasa cuando la misma dirección llega por los dos caminos de ingreso? [Edge Case, Spec §FR-009]
- [x] CHK032 ¿Está definido el comportamiento cuando el destino al que volver después de ingresar no es una pantalla del producto? [Edge Case, Spec §FR-014]
- [x] CHK033 ¿Está definido qué pasa cuando la sesión expira con una pantalla ya abierta? [Edge Case, Spec §Edge Cases]
- [x] CHK034 ¿Está definido el tratamiento de un nombre para mostrar compuesto solo de espacios? [Edge Case, Spec §FR-020]
- [x] CHK035 ¿Está definido qué pasa al registrarse de nuevo con una dirección cuya cuenta fue borrada? [Edge Case, Spec §FR-029]
- [x] CHK036 ¿Está definido qué puede y qué no puede hacer una cuenta recién creada sin teléfono verificado? [Completeness, Spec §FR-031]
- [x] CHK037 ¿Los límites numéricos de la spec tienen su justificación registrada, para que no se cambien por costumbre? [Traceability, Spec §Assumptions]

## Errores y qué puede hacer la persona

- [x] CHK038 ¿Cada requisito de error dice qué acción le queda disponible a la persona, y no solo que se muestra un mensaje? [Completeness, Spec §FR-005, §FR-006, §FR-010, §FR-025]
- [x] CHK039 ¿Está especificado que al pedir un enlace nuevo después de un error no hay que reescribir la dirección? [Clarity, Spec §FR-005]
- [x] CHK040 ¿Está especificado que al llegar al tope de pedidos se comunica cuánto falta, y no un rechazo pelado? [Clarity, Spec §FR-006]
- [x] CHK041 ¿Está definido qué ve la persona cuando el correo simplemente no llega, incluida la mención del correo no deseado? [Coverage, Spec §FR-003]
- [x] CHK042 ¿Está definido el camino de salida cuando el ingreso con Google se cancela o falla? [Exception Flow, Spec §FR-010]
- [x] CHK043 ¿Está definido qué pasa con el formulario de perfil cuando falla el guardado, y si se pierde lo escrito? [Gap, Spec §FR-025]
- [x] CHK044 ¿Está definido el aviso antes de perder cambios sin guardar? [Coverage, Spec §FR-023]
- [x] CHK045 ¿Los mensajes de error están descritos por lo que comunican y no por su texto literal, para que la redacción viva en un solo lugar? [Clarity, Consistency]

## Claridad y ausencia de implementación

- [x] CHK046 ¿La spec está libre de nombres de tablas, políticas, rutas, componentes, códigos de estado y librerías? [Constitution §I]
- [x] CHK047 ¿Cada requisito funcional es verificable sin saber cómo está construido? [Measurability, Spec §FR-001-FR-032]
- [x] CHK048 ¿Los criterios de éxito están expresados en resultados para la persona y no en métricas internas? [Measurability, Spec §SC-001-SC-009]
- [x] CHK049 ¿No queda ningún marcador `[NEEDS CLARIFICATION]` sin resolver? [Completeness]
- [x] CHK050 ¿Cada decisión tomada durante la corrida quedó registrada con su motivo y su fecha? [Traceability, Spec §Assumptions]
- [x] CHK051 ¿El alcance está acotado y dice explícitamente qué queda afuera y en qué historia cae? [Scope, Spec §Assumptions]
- [x] CHK052 ¿Nada de lo que pide la spec toca la tabla "Fuera del MVP"? [Constitution §VI, docs/03]
- [x] CHK053 ¿Están registradas las dependencias con otras historias, y su estado? [Dependency, Spec §Assumptions]
- [x] CHK054 ¿Los presupuestos de performance aplicables a estas pantallas están enunciados? [Non-Functional, Spec §SC-009]

## Notas

- Un ítem se marca `[x]` solo cuando la revisión confirma que el criterio de calidad del requisito
  está satisfecho.
- Los ítems que siguen sin marcar necesitan aclaración, corrección o evaluación del revisor.
- `/speckit-implement` lee el estado de los marcadores como compuerta y no los modifica.
