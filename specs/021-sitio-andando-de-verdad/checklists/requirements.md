# Calidad de requisitos — El sitio andando de verdad en una dirección provisoria

**Propósito**: probar la spec como si fuera código escrito en español. Cada ítem pregunta si el
requisito está bien escrito —completo, claro, consistente, medible—, no si el producto funciona.
**Creado**: 2026-10-10
**Feature**: [spec.md](../spec.md)

**Nota**: checklist generada por `/speckit-checklist` con el foco: cobertura de escenarios por user
story; el vacío, el cargando y el error de cada pantalla; quién ve cada dato personal y cuándo;
casos borde y límites; errores y qué puede hacer la persona; nada de implementación.
**Propiedad de la revisión**: es un artefacto del revisor. Un ítem se marca `[x]` solo cuando el
revisor determinó que el criterio de calidad del requisito está satisfecho.
**Semántica del marcador**: `[x]` significa que el requisito está bien escrito. No significa que
esté implementado.

## Cobertura de escenarios por user story

- [x] CHK001 ¿Cada user story declara cómo se prueba sola y justifica su prioridad? [Completeness, Spec §US1-US6]
- [x] CHK002 ¿Todo criterio de aceptación de la historia original (camino feliz, casos borde, errores) tiene su escenario o requisito equivalente, y cada lectura propia está explicada en Assumptions? [Traceability, story.md, Spec §Assumptions]
- [x] CHK003 ¿Están definidos sin ambigüedad el sitio de verdad, la dirección provisoria, la dirección de prueba, el equipo, buscadores y asistentes frente a lectores de vista previa, las tareas solas, una falla, el aviso de una falla, el origen de una visita y la marca de compartido, y se usan igual en toda la spec? [Clarity, Spec §Vocabulario]
- [x] CHK004 ¿Está escrita cada tarea sola con su frecuencia, y el plazo de cada limpieza? [Completeness, Spec §Vocabulario, §FR-040-041]
- [x] CHK005 ¿Está escrito qué ve cada actor (visitante sin sesión, persona del equipo con sesión, alguien de fuera del equipo, quien administra, un buscador, un lector de vista previa) en la dirección provisoria y en una dirección de prueba? [Coverage, Spec §US1, §FR-002-008]
- [x] CHK006 ¿Los escenarios están escritos desde el punto de vista de la persona o del equipo, y no del sistema? [Clarity, Spec §US1-US6]

## Estados de cada pantalla: vacío, cargando y error

- [x] CHK007 ¿La spec enumera cada pantalla que toca la historia y para cada una dice su vacío, o que no aplica? [Completeness, Spec §Pantallas]
- [x] CHK008 ¿Está definido el estado del listado y de la portada en un sitio de verdad que arranca sin animales? [Completeness, Spec §US1 escenario 2]
- [x] CHK009 ¿Está definido qué ve la persona ante la pantalla de error, también con el registro de errores sin responder? [Completeness, Spec §US4, §FR-034]

## Datos personales: quién ve qué y cuándo

- [x] CHK010 ¿Está escrito qué sale del sitio hacia la herramienta de medición y qué nunca sale (nombre, correo, teléfono, zona, imágenes, lo escrito, la cuenta, la conexión, la ubicación), y que no se unen visitas? [Completeness, Spec §FR-021]
- [x] CHK011 ¿Está escrito qué lleva el aviso de una falla, qué nunca lleva, y qué pasa si un dato personal se cuela en la descripción técnica o en la dirección de la pantalla? [Completeness, Spec §Vocabulario, §FR-033, §Edge Cases]
- [x] CHK012 ¿Está escrito que la marca de compartido no identifica a quien compartió, ni a la cuenta, ni a la visita? [Clarity, Spec §FR-024, §Edge Cases]
- [x] CHK013 ¿Está escrito para qué viaja el teléfono al servicio de mensajes y que no sirve para ingresar? [Completeness, Spec §FR-014]
- [x] CHK014 ¿Está escrito qué pasa con las personas de prueba de las comprobaciones de privacidad, también si la corrida se corta, y que no cuentan en la medición? [Coverage, Spec §FR-052, §Edge Cases]
- [x] CHK015 ¿Está escrito qué datos ve una dirección de prueba y que no toca los del sitio de verdad? [Coverage, Spec §FR-008, §Edge Cases]
- [x] CHK016 ¿Están las reglas de privacidad a comprobar contra el sitio de verdad enumeradas una por una, con KL-017 y KL-11-1? [Completeness, Spec §FR-050]

## Casos borde y límites

- [x] CHK017 ¿Está definida la regla de prioridad entre la marca de compartido y de dónde llegó la visita, y qué es «sin origen conocido»? [Clarity, Spec §Edge Cases, §FR-023]
- [x] CHK018 ¿Está definido qué se reconoce como red social, buscador y asistente, y qué pasa con un sitio que no está en ninguna lista? [Clarity, Spec §Edge Cases]
- [x] CHK019 ¿Está cuantificado cuándo una tarea «no corrió» y cada cuánto se avisa? [Measurability, Spec §Edge Cases, §FR-043]
- [x] CHK020 ¿Está definido qué hace la vuelta siguiente con lo pendiente de cada tarea, sin duplicar envíos, y qué no se recupera? [Edge Case, Spec §Edge Cases, §FR-042]
- [x] CHK021 ¿Está definido el sitio sin visitas durante 8 días, con lo que debe haber pasado en ese tiempo? [Edge Case, Spec §US1 escenario 9, §US5 escenario 2, §FR-007]
- [x] CHK022 ¿Están definidos los topes de los planes gratuitos de la medición y del registro, y qué pasa al alcanzarlos? [Edge Case, Spec §Edge Cases]
- [x] CHK023 ¿Están cuantificados los tiempos: el código en menos de 5 minutos, la medición y los errores visibles en menos de una hora? [Measurability, Spec §FR-010, §FR-020, §FR-030]

## Errores y qué puede hacer la persona

- [x] CHK024 ¿Cada falla o rechazo (correo a otra casilla, servicio de mensajes caído, tope alcanzado, número de otro país, herramienta de medición caída, registro de errores caído, comprobación que falla o no se puede correr) dice qué ve la persona o el equipo y qué puede hacer? [Coverage, Spec §US1-US6, §FR-005, §FR-011, §FR-013, §FR-026, §FR-034, §FR-051]

## Calidad general

- [x] CHK025 ¿La spec evita nombrar proveedores, tablas, columnas, políticas, componentes, rutas, librerías o códigos HTTP? [Constitution §I, Spec §Requirements]
- [x] CHK026 ¿Los criterios de éxito son medibles y no dependen de la tecnología? [Measurability, Spec §Success Criteria]
- [x] CHK027 ¿El alcance está acotado y lo que queda fuera está listado como en la historia, incluidos el nombre, el dominio, la indexación y la invitación (#76)? [Scope, Spec §Assumptions, story.md §Alcance]
- [x] CHK028 ¿La medición no suma momentos nuevos del funnel, y el origen de la visita a una ficha está definido como detalle de uno que ya existe? [Consistency, Spec §FR-020, §FR-023, story.md §Medición]
- [x] CHK029 ¿Las reglas de esta spec son consistentes con #9, #10, #11, #53, #57, #59, #69, #71 y #73 y con las decisiones del enjambre de la historia? [Consistency, Spec §Assumptions, docs/03 §7, docs/07]
- [x] CHK030 ¿Está escrito qué depende de las cuentas de Hernán y cómo sigue la historia sin ellas? [Dependencies, Spec §Assumptions]

## Notes

- Endurecimiento: 3 rondas con los criterios de `spec-grader` y `spec-adversary`, aplicados por la
  etapa Spec misma con sus definiciones (`.claude/agents/`): en esta corrida no había forma de lanzar
  subagentes de contexto fresco. Ronda 1: 2 FAIL (CHK002, ningún dato personal nuevo; CHK008, la
  portada sin animales) y del adversario 1 HIGH (dónde se guardan los datos en la nube, Ley 18.331
  art. 23) y 2 MEDIUM (quién ve la herramienta y el registro; grabar la pantalla). Ronda 2: 2 MEDIUM
  (las pruebas mezcladas con la beta y lo que sale en local; las limpiezas diarias que ya corren en la
  base, fuera de la lista de tareas). Ronda 3: «visita» y «visita a una ficha» con el mismo nombre
  (MEDIUM); sin CRITICAL ni HIGH. Todo plegado a la spec o a Assumptions.
