# Calidad de requisitos — Pie del sitio con los enlaces que más se buscan

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-10-20
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
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores y rechazos) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §US1-US2, §Assumptions]
- [x] CHK003 ¿Están definidos sin ambigüedad el pie, el menú, un grupo, los enlaces del pie con su destino, la marca, la pantalla de la cuenta suspendida, una pantalla de error y «no encontrado», y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está fijado el orden de los grupos y el de los enlaces dentro de cada uno? [Clarity, Spec §FR-001-004]
- [x] CHK005 ¿Están escritos los escenarios para cada actor que ve el pie distinto o llega a otro lado al tocarlo (sin sesión, con sesión y teléfono sin verificar, con el teléfono verificado, con el perfil sin completar, una cuenta suspendida)? [Coverage, Spec §US1, §US2, §Edge Cases]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona, y no del sistema? [Clarity, Spec §US1-US2]

## Estados: vacío, cargando y error

- [x] CHK007 ¿Está definido por qué el pie no tiene estado vacío (Ayuda siempre tiene «Opinar») y qué pasa con un grupo sin enlaces? [Completeness, Spec §FR-007, §Edge Cases]
- [x] CHK008 ¿Está definido el pie mientras la pantalla muestra su esqueleto de carga? [Completeness, Spec §US2 escenario 8, §FR-013]
- [x] CHK009 ¿Está definido el pie en las pantallas de error y de «no encontrado», y qué pasa con una dirección que no existe fuera de ellas? [Completeness, Spec §US2 escenario 7, §FR-013, §Edge Cases, §Assumptions]
- [x] CHK010 ¿Está definido qué ve la persona cuando el destino de un enlace del pie no se puede mostrar, y qué puede hacer? [Coverage, Spec §US2 escenario 11, §FR-012]

## Datos personales: quién ve qué y cuándo

- [x] CHK011 ¿La spec dice explícitamente que el pie no muestra ni guarda datos personales y que es el mismo con sesión y sin ella? [Coverage, Spec §FR-005, §Assumptions]
- [x] CHK012 ¿Está definido que el pie de la cuenta suspendida no ofrece caminos a pantallas que esa cuenta no puede usar? [Coverage, Spec §FR-014, §FR-008, §SC-005]

## Casos borde y límites

- [x] CHK013 ¿Están cuantificados los anchos (390, entre 390 y 1023, 1024, 1280) y cómo van los grupos en cada tramo? [Measurability, Spec §FR-015-016, §US2]
- [x] CHK014 ¿Está cuantificada el área mínima de toque de cada enlace? [Measurability, Spec §FR-017, §SC-003]
- [x] CHK015 ¿Está definido el caso sin número de WhatsApp de soporte, solo y combinado con la cuenta suspendida? [Edge Case, Spec §FR-006, §US2 escenarios 4-6]
- [x] CHK016 ¿Está definido el enlace a la pantalla en la que se está? [Edge Case, Spec §FR-010, §US1 escenario 7]
- [x] CHK017 ¿Está definido qué pasa con la letra agrandada y con una pantalla corta en una ventana alta? [Edge Case, Spec §Edge Cases, §FR-016, §FR-018]
- [x] CHK018 ¿Está definido el orden para el teclado y para el lector de pantalla, y cómo se anuncia cada grupo? [Coverage, Spec §FR-019-020, §US1 escenarios 8-9]

## Errores y qué puede hacer la persona

- [x] CHK019 ¿Las puertas de «Publicar un animal» (entrar, verificar el teléfono) están definidas con su vuelta a publicar, iguales a las del menú? [Coverage, Spec §FR-011, §US2 escenarios 9-10, §SC-007]
- [x] CHK020 ¿Está definido qué pasa cuando una cuenta suspendida toca un enlace del pie desde una pantalla que muestra el pie entero (Opinar)? [Edge Case, Spec §Edge Cases]

## Calidad general

- [x] CHK021 ¿La spec evita nombrar tablas, columnas, políticas, componentes, rutas de archivo, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK022 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK023 ¿El alcance está acotado y lo que queda fuera está listado como en la historia (redes, legales, novedades, idioma, mapa del sitio, cuenta, menú de arriba, «Nosotros»)? [Scope, Spec §Assumptions, story.md §Alcance]
- [x] CHK024 ¿Está escrito que la medición no cambia y por qué las lecturas que miran de qué pantalla se llegó no se distorsionan con el pie? [Consistency, story.md §Medición, Spec §Assumptions]
- [x] CHK025 ¿Está escrito qué decisión de la guía de diseño se registra, qué decisión anterior deja atrás y que esta va a Descartado con su motivo? [Traceability, Spec §FR-021]

## Notas

- Endurecimiento: el entorno de esta corrida no tenía la herramienta para lanzar subagentes, así que
  la calificación del checklist y la pasada adversaria las hizo la misma sesión, contra las
  definiciones de `spec-grader` y `spec-adversary`. Ronda 1: un hallazgo MEDIUM (la cuenta
  suspendida en Opinar ve el pie entero), plegado en §Edge Cases. Ronda 2: nada CRITICAL ni HIGH.
