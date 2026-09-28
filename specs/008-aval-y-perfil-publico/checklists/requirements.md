# Calidad de requisitos — Aval entre personas y perfil público con niveles de verificación

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-09-28
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
- [x] CHK003 ¿Está escrito el camino feliz de copiar el enlace y abrir el perfil público sin ingresar, con lo que se ve? [Coverage, Spec §US1.1, §FR-004, §FR-005]
- [x] CHK004 ¿Está escrito el camino feliz de avalar, de retirar un aval y de quitar un aval recibido, con el efecto en el nivel y en el perfil? [Coverage, Spec §US3.1, §US3.3, §US4.1, §FR-012, §FR-017-FR-019]
- [x] CHK005 ¿Está escrito qué ve cada tipo de persona que mira un perfil —la dueña, sin sesión, sin nivel 2, quien ya avala, quien es avalada, a quien le quitaron el aval— y en qué orden se resuelve si caben varios? [Coverage, Spec §FR-011]
- [x] CHK006 ¿Está escrito el distintivo en «Mi perfil» y en la verificación aprobada, con el día exacto para la dueña y el mes y año para los demás? [Coverage, Spec §US1.3, §US1.4, §FR-022, §FR-023]
- [x] CHK007 ¿Está escrita la regla de contacto del perfil con los ejemplos de la historia y con lo que tiene que seguir pasando? [Coverage, Spec §US2, §FR-020]
- [x] CHK008 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US4]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK009 ¿La spec enumera cada pantalla de la historia (perfil público, confirmaciones, explicación de los niveles, «Mis avales», «Mi perfil», verificación aprobada, perfil que no existe) y para cada una dice su estado vacío, o que no aplica y por qué? [Completeness, Spec §Pantallas]
- [x] CHK010 ¿Está definido el estado mientras se da, se retira o se quita un aval, de modo que no se pueda mandar dos veces? [Completeness, Spec §Pantallas, §FR-014]
- [x] CHK011 ¿Está definido qué muestra «Mis avales» mientras carga, sin avales, con avales en pausa y cuando no pudo traer las listas? [Completeness, Spec §Pantallas, §FR-025]
- [x] CHK012 ¿El estado de error de cada pantalla dice qué pasó y qué puede hacer la persona, sin revelar si un perfil existe? [Clarity, Spec §Pantallas, §FR-007]
- [x] CHK013 ¿Está definido qué muestra el perfil sin ningún nivel y sin avales? [Completeness, Spec §Pantallas, §FR-006]

## Quién ve cada dato personal y cuándo

- [x] CHK014 ¿La spec lista exactamente qué muestra el perfil público y qué no muestra nunca, ni escondido en la página? [Completeness, Spec §FR-005]
- [x] CHK015 ¿Está especificado que el motivo de no tener un nivel (número perdido, cambio a medias) no se revela? [Clarity, Spec §FR-005, §FR-006, §Edge Cases]
- [x] CHK016 ¿Está especificado que los tres casos de perfil inexistente son indistinguibles, también por la respuesta del sitio? [Clarity, Spec §FR-007, §SC-002]
- [x] CHK017 ¿Está especificado que el enlace no se puede adivinar, no lleva datos de contacto, no cambia y no se reusa? [Completeness, Spec §FR-008]
- [x] CHK018 ¿Está definido qué ve cada parte de un aval en «Mis avales» (fecha, pausa) y qué no (el motivo de la pausa)? [Clarity, Spec §FR-025, §Assumptions]
- [x] CHK019 ¿Está definido qué se guarda de un aval quitado, por qué y cuándo se borra? [Completeness, Spec §FR-018, §Key Entities, §FR-027]
- [x] CHK020 ¿Está definido qué se borra al borrar la cuenta, en las dos direcciones, y el efecto en el nivel de los demás? [Completeness, Spec §FR-027, §Edge Cases]
- [x] CHK021 ¿Cada regla de visibilidad tiene un criterio que intenta leer o escribir lo que no debe? [Measurability, Spec §FR-013, §FR-026, §SC-001, §SC-004]
- [x] CHK022 ¿Está dicho que el perfil no se indexa y qué lleva la vista previa del enlace? [Completeness, Spec §FR-009]

## Casos borde y límites

- [x] CHK023 ¿Está definido «vigente», «cuenta» y «en pausa», y cada regla usa el término correcto? [Consistency, Spec §Vocabulario, §FR-001, §FR-011, §FR-013]
- [x] CHK024 ¿Está definido qué pasa con los avales cuando quien avaló o quien fue avalada pierde y recupera el nivel 2? [Coverage, Spec §FR-002, §Edge Cases]
- [x] CHK025 ¿Está definido si se puede volver a avalar después de retirar y después de que te quitaron, y si quitar bloquea en las dos direcciones? [Clarity, Spec §FR-017, §FR-018, §Edge Cases]
- [x] CHK026 ¿Está definido el aval cruzado cuando el aval de la otra está en pausa? [Edge Case, Spec §FR-011, §Edge Cases]
- [x] CHK027 ¿Está definido qué pasa si el estado cambia con la pantalla abierta, al avalar, retirar o quitar? [Edge Case, Spec §FR-013, §FR-019, §Edge Cases]
- [x] CHK028 ¿Está definido el tope de avales (no hay) y el orden en que se muestran? [Completeness, Spec §FR-015, §FR-005, §FR-025]
- [x] CHK029 ¿Están definidos los meses de alta y de verificación en el borde del mes y después de perder y recuperar el nivel 2? [Edge Case, Spec §Edge Cases]
- [x] CHK030 ¿Está definido qué pasa al ingresar para avalar con el perfil sin completar, o siendo la dueña? [Edge Case, Spec §Edge Cases, §FR-016]
- [x] CHK031 ¿Está definido qué pasa con los perfiles guardados antes de la regla de contacto y con el contacto disfrazado? [Edge Case, Spec §Edge Cases]

## Errores y qué puede hacer la persona

- [x] CHK032 ¿Cada rechazo al avalar dice su motivo y, si lo hay, el paso que falta? [Clarity, Spec §FR-011, §FR-013]
- [x] CHK033 ¿Está definido qué pasa si avalar, retirar o quitar no llega, y que reintentar no duplica? [Completeness, Spec §FR-014, §Pantallas]
- [x] CHK034 ¿El rechazo por contacto dice qué se encontró, cita el fragmento, explica por qué y deja lo escrito? [Clarity, Spec §FR-020]
- [x] CHK035 ¿Está definido qué pasa si el navegador no deja copiar el enlace? [Edge Case, Spec §FR-022]

## Nada de implementación

- [x] CHK036 ¿La spec evita tablas, políticas, rutas de archivo, componentes, códigos de respuesta y librerías? [Constitution §I]
- [x] CHK037 ¿Los criterios de éxito son medibles sin conocer la implementación? [Measurability, Spec §SC-001-SC-007]
- [x] CHK038 ¿La medición dice qué se registra, cuándo, y que ningún momento lleva datos de la persona? [Completeness, Spec §FR-028]
- [x] CHK039 ¿El alcance está acotado y lo que la historia excluye no aparece como requisito? [Scope, story.md §No incluye, Spec §Assumptions]
- [x] CHK040 ¿No quedan marcadores [NEEDS CLARIFICATION]? [Completeness]

## Notes

- `/speckit-implement` lee el estado de esta checklist pero no cambia sus marcas.
