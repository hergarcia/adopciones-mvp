# Constitución — adopciones-mvp

Plataforma de adopción de animales cuyo diferencial es la verificación de las personas antes de
intercambiar datos. Esta constitución gobierna toda spec, plan e implementación, humana o con
agentes. Ante un atajo y un principio, gana el principio. El detalle del proceso está en
`docs/09-flujo-de-trabajo.md`; el producto en `docs/01-idea.md` y `docs/03-mvp-features.md`.

## Principios

### I. La historia dice el qué

Una historia describe lo que una persona puede hacer y lo que ve, en lenguaje de producto. No
nombra tablas, columnas, políticas, rutas de archivo, componentes, códigos HTTP ni librerías. El
cómo se decide en `plan.md` durante la corrida y lo revisa un agente contra
`docs/08-convenciones-codigo.md` y `docs/07-stack.md`. Una spec (`spec.md`) tampoco lleva
implementación: refina el qué con casos borde y criterios medibles.

### II. Una feature, un PR, una corrida

Una historia es una capacidad de punta a punta, del tamaño que se cuenta en una frase. Va por uno
de dos carriles (`docs/09` §Dos carriles): un cambio **chico** (textos, un ajuste visual, un error,
una pantalla rearmada) se construye desde los criterios de la historia, sin spec; una **feature**
(lo que cambia qué se guarda, quién ve qué, las cuentas o una tarea que corre sola) pasa por la spec,
que la parte en user stories priorizadas que se construyen y verifican una por una. Se divide una
historia solo cuando no se puede probar de punta a punta sin la otra mitad.

### III. Nada entra a `main` sin compuertas verdes y revisión de contexto fresco

Lint, tipos, tests, mutation testing, build, e2e y Lighthouse contra el build de producción local
(`pnpm verify`) son condición de merge, sin excepciones: corren en CI en cada PR. En la máquina,
cada ronda corre solo lo que cambió (`pnpm gates:affected`). **No se testea
todo:** se testea lo que, si se rompe, engaña a una persona, expone un dato o calcula mal
(`docs/09` §Qué vale la pena testear); el plan de cada historia dice qué y por qué. **Lo que
tiene test se sostiene al 100 % de mutation score**, con los mutantes equivalentes anotados en
su línea: un test que sigue verde con el código roto a propósito no prueba nada. El
código lo revisan agentes que no participaron en escribirlo, con hallazgos tipados que el
orquestador aplica o descarta; frena el merge solo lo grave. Un loop que no converge en su tope termina en un PR en borrador
que dice qué falla; nunca en un reporte de éxito.

### IV. Reglas como código

Toda regla que se puede verificar sin criterio humano existe como check (oxlint, `tsc`, Vitest,
tests de RLS, Lighthouse CI, Playwright, hook de git, branch protection) antes de que exista el
código al que aplica. Una regla que vive solo en prosa se olvida; una que vive en el lint, no.

### V. Datos personales, mínimos y privados

Teléfono, contacto e identidad nunca son públicos; se revelan solo cuando una solicitud fue
aceptada, y las imágenes de identidad se borran después de revisar (Ley 18.331). Toda regla de
visibilidad se implementa en la base (RLS) y se prueba con un test que intenta leer lo que no
debe verse. Un dato que la historia no necesita no se guarda.

### VI. Sin deriva

La historia acota lo que se construye en su corrida. Un hallazgo fuera de su alcance se pliega si
es barato y toca lo que la rama ya cambia; si no, el PR lo lista bajo «Fuera de alcance» y no se
convierte solo en trabajo. El alcance del producto lo decide Producto contra la hipótesis de
`docs/03`, sin tope por milestone: propone la próxima feature cuando el orden de construcción se
termina, y cada una queda en el reporte de la semana. Lo que necesita plata sigue siendo de Hernán
(principio VIII). (Enmienda 2026-10-25: la tabla «Fuera del MVP» dejó de ser lista de aborto, y el
umbral de seguimiento y el tope de una incorporación por milestone se retiraron.)

### VII. Liviana y linda, medido

Server Components por defecto, `"use client"` en la hoja más chica, imágenes procesadas al subir,
microinteracciones en CSS. La guía de diseño es `docs/10-design-system.md`: tokens, componentes
y reglas visuales; toda tarea de UI carga `frontend-design:frontend-design` antes de escribir y
`design-reviewer` califica contra la guía. Presupuesto: LCP < 2,5 s, JS inicial < 150 KB, Lighthouse mobile ≥ 90,
verificado en cada PR contra el build de producción local (`pnpm verify`). Todo componente con
datos tiene cargando, vacío y error diseñados. Ningún string visible ni color fuera de `messages/` y de los tokens.

### VIII. Autonomía con veto

Un enjambre de agentes elige qué se construye, lo construye y lo acepta; Hernán veta en vez de
aprobar. Un rol es un derecho de decisión con salida tipada, no un personaje, y el orquestador es
código. Los agentes deciden solos lo que un revert deshace y `docs/` ya cubre; deciden y avisan lo
que `docs/` no cubre, también lo que antes esperaba a Hernán (una regla de privacidad nueva, un
cambio transversal de stack), eligiendo lo que él elegiría. A Hernán le queda solo lo que cuesta
plata o no se deshace: plata, nombre y dominio, y prender la indexación, en un único `decision` que
no frena nada antes de la beta; y, con `reglas-aprobadas`, las reglas que juzgan a los agentes.
Lo que decide el enjambre y lo que falla le llegan en un reporte por semana; lo que no sale se
estaciona, y nada espera una respuesta suya. **Ningún agente cambia una regla que lo juzga:** la constitución, el
flujo de trabajo, las compuertas y el pipeline cambian solo con la aprobación de Hernán, y eso lo
sostienen un hook en la sesión del enjambre y un check en CI. Detalle en `docs/09` §El enjambre.

## Restricciones

- Stack decidido en `docs/07-stack.md`; una dependencia nueva se adopta en su última versión
  estable y se registra ahí con fecha, en el mismo PR. Un cambio transversal de stack es su
  propio PR, con la decisión registrada en `docs/07-stack.md` y en el reporte de la semana.
- Código en inglés, UI en español rioplatense vía `messages/es.json`, enums de base en inglés.
- Commits en inglés (Conventional Commits). Issues y PRs en español.

## Flujo

Producto escribe la historia en el orden de `docs/03`, o propone la próxima cuando ese orden se
termina, y le pone `lista` → Ready (dice el carril) → Spec (solo una feature: una pasada del
adversario, plan, tasks, analyze) → Build (un cambio chico de una vez; una feature user story por
user story, converge) → Review (frena lo grave, hasta dos rondas) → Ship (compuertas de lo cambiado
y CI verdes) → Merge (squash) → Aceptación contra la app real, solo de una feature. Hernán veta en
cualquier momento y lee un reporte por semana. Corre en local
con la suscripción de Claude Code. Sin Vercel hasta el MVP (decisión 2026-09-17). Detalle en
`docs/09-flujo-de-trabajo.md`.

## Gobernanza

- Esta constitución se enmienda por PR con motivo explícito, fecha y la aprobación de Hernán
  (etiqueta `reglas-aprobadas`); las decisiones de producto se registran en el doc del tema con
  **Decisión (fecha):**, las que toma un agente, con **Decisión (fecha, agente):**, y las que el
  enjambre toma en lugar de Hernán, con **Decisión (fecha, enjambre):**.
- Lo descartado no se borra: va a la sección "Descartado" del doc con el motivo.
- Hernán decide lo reservado (principio VIII) y veta el resto: lo que entra, sacando `lista`; lo
  que salió, con una historia nueva o un comentario en la que sigue, nunca con un parche por fuera
  del flujo.

**Versión**: 3.0.1 | **Ratificada**: 2026-09-16 | **Última enmienda**: 2026-10-26
