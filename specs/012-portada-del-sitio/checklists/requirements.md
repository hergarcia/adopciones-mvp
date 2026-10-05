# Calidad de requisitos — Portada del sitio que invita a publicar un animal y a ver los que están en adopción

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

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US3]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Están definidos sin ambigüedad «animal a la vista», «los más recientes», «la frase», «lo primero que se ve» y «sin que el navegador ejecute nada», y se usan igual en toda la spec? [Clarity, Spec §Vocabulario, §Assumptions]
- [x] CHK004 ¿Están cubiertos los cuatro puntos de partida de «Publicar un animal» (sin sesión con Google, sin sesión con correo, con sesión y teléfono verificado, con sesión sin teléfono) y el de quien ingresó sin perfil completo? [Coverage, Spec §US1, §FR-009-FR-011, §Edge Cases]
- [x] CHK005 ¿Está escrito qué pasa al tocar un animal, «Ver todos» y «Ver animales en adopción», y adónde lleva cada uno? [Completeness, Spec §FR-003, §FR-013, §FR-014]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona y no del sistema? [Clarity, Spec §US1-US3]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla que toca la historia (portada y vista previa) y para cada una dice su vacío, o que no aplica y por qué? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el cargando del lugar de los animales y qué se ve del resto de la portada mientras tanto? [Completeness, Spec §FR-019, §Pantallas]
- [x] CHK009 ¿Está definido el error del lugar de los animales, que el resto de la portada sigue entera y qué puede hacer la persona? [Completeness, Spec §FR-018]
- [x] CHK010 ¿Está definido el vacío del lugar de los animales con su texto exacto y adónde lleva la invitación a publicar el primero? [Clarity, Spec §FR-017, §Assumptions]
- [x] CHK011 ¿Está definido qué pasa si la imagen de la vista previa no se puede armar? [Edge Case, Spec §Pantallas]

## Quién ve cada dato personal y cuándo

- [x] CHK012 ¿Está escrito que la portada no muestra quién publica cada animal ni ningún dato de una persona, ni siquiera a quien lo publicó? [Completeness, Spec §FR-027, §Edge Cases]
- [x] CHK013 ¿Está escrito que la vista previa nunca muestra un animal ni una persona, aunque haya animales publicados? [Completeness, Spec §FR-025]
- [x] CHK014 ¿Está acotado qué se guarda de quien mira la portada y qué no? [Clarity, Spec §FR-029, §FR-030]
- [x] CHK015 ¿Está escrito que un animal de un publicador sin teléfono verificado no se ve, igual que en el listado? [Consistency, Spec §FR-015, §Vocabulario]

## Casos borde y límites

- [x] CHK016 ¿Están definidos los límites de cantidad: 0, entre 1 y 7, exactamente 8, más de 8? [Edge Case, Spec §FR-013, §FR-016, §FR-017, §Edge Cases]
- [x] CHK017 ¿Está definido qué pasa cuando un animal sale del listado entre una apertura y la siguiente, y mientras alguien mira? [Edge Case, Spec §FR-015, §Edge Cases]
- [x] CHK018 ¿Está definido el orden de los animales y que no se ordenan por urgencia? [Clarity, Spec §FR-013]
- [x] CHK019 ¿Está definido cómo se reparten los animales en el teléfono, en anchos intermedios y en la computadora, de forma que se pueda medir? [Measurability, Spec §FR-023, §SC-007]
- [x] CHK020 ¿Está escrito qué pasa con la portada cuando cambia el nombre del sitio? [Edge Case, Spec §FR-007, §FR-026]
- [x] CHK021 ¿Está definido cómo se lee y se usa la portada sin que el navegador ejecute nada, incluidos los animales y sus enlaces? [Coverage, Spec §FR-022]

## Errores y qué puede hacer la persona

- [x] CHK022 ¿Está definido qué ve quien abandona el ingreso o abre un enlace vencido después de tocar «Publicar un animal», y que no pierde a dónde iba? [Completeness, Spec §FR-012]
- [x] CHK023 ¿Está definido qué ve quien no tiene el teléfono verificado y cómo sigue hasta publicar? [Completeness, Spec §FR-011]
- [x] CHK024 ¿Está definido qué se ve cuando la foto de un animal no carga? [Edge Case, Spec §FR-020]

## Claridad, medición y alcance

- [x] CHK025 ¿«La acción más visible» y «al lado, como segunda» se pueden verificar sin interpretar? [Measurability, Spec §FR-003]
- [x] CHK026 ¿El contenido de los tres pasos y de lo que quiere decir verificado está fijado con los hechos que el sitio cumple hoy (5 fotos, 30 días, 7 días, un toque)? [Clarity, Spec §FR-004, §FR-005]
- [x] CHK027 ¿Cada criterio de éxito se puede medir sin saber cómo está hecho? [Measurability, Spec §SC-001-SC-009]
- [x] CHK028 ¿Lo que la portada registra para medir está enumerado y alcanza para responder la pregunta de la historia (rescatistas que publican; fichas abiertas por esta puerta)? [Completeness, Spec §FR-029, §SC-009]
- [x] CHK029 ¿Está explícito lo que queda afuera (nombre, buscadores, preguntas frecuentes, cifras, filtros, carrusel, portada por persona) y que nada de eso se cuela en los requisitos? [Scope, Spec §FR-006, §FR-028, §Assumptions]
- [x] CHK030 ¿La spec está libre de detalles de implementación (tablas, rutas, componentes, librerías, códigos de respuesta)? [Clarity, Constitución §I]
- [x] CHK031 ¿Las dependencias con #9, #10, #53, #57 y #59 están dichas y lo ya construido está separado de lo nuevo? [Dependencies, Spec §Ya construido, §Assumptions]

## Notes

- `/speckit-implement` lee el estado de esta checklist pero no cambia sus marcadores.
