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

Una historia es una capacidad de punta a punta, del tamaño que se cuenta en una frase. Adentro de
la corrida, la spec la parte en user stories priorizadas que se construyen y verifican una por
una. Se divide una historia solo cuando no se puede probar de punta a punta sin la otra mitad.

### III. Nada entra a `main` sin compuertas verdes y revisión de contexto fresco

Lint, tipos, tests, mutation testing, build, e2e y Lighthouse contra el build de producción local
(`pnpm verify`, en la máquina y en CI) son condición de merge, sin excepciones. **No se testea
todo:** se testea lo que, si se rompe, engaña a una persona, expone un dato o calcula mal
(`docs/09` §Qué vale la pena testear); el plan de cada historia dice qué y por qué. **Lo que
tiene test se sostiene al 100 % de mutation score**, con los mutantes equivalentes anotados en
su línea: un test que sigue verde con el código roto a propósito no prueba nada. El
código lo revisan agentes que no participaron en escribirlo, con hallazgos tipados que el
orquestador aplica o descarta. Un loop que no converge en su tope termina en un PR en borrador
que dice qué falla; nunca en un reporte de éxito.

### IV. Reglas como código

Toda regla que se puede verificar sin criterio humano existe como check (ESLint, `tsc`, Vitest,
tests de RLS, Lighthouse CI, Playwright, hook de git, branch protection) antes de que exista el
código al que aplica. Una regla que vive solo en prosa se olvida; una que vive en el lint, no.

### V. Datos personales, mínimos y privados

Teléfono, contacto e identidad nunca son públicos; se revelan solo cuando una solicitud fue
aceptada, y las imágenes de identidad se borran después de revisar (Ley 18.331). Toda regla de
visibilidad se implementa en la base (RLS) y se prueba con un test que intenta leer lo que no
debe verse. Un dato que la historia no necesita no se guarda.

### VI. Sin deriva

La tabla "Fuera del MVP" de `docs/03-mvp-features.md` es lista de aborto: una spec, un plan o un
diff que la toca se detiene. Un hallazgo fuera del alcance de la historia se pliega si es barato,
se acepta en `docs/known-limitations.md` si no pasa el umbral, o abre **como máximo un**
seguimiento por historia si lo pasa. El umbral: corta un paso del funnel o de la verificación,
expone contacto o identidad, o rompe el presupuesto de performance de una pantalla del funnel.

### VII. Liviana y linda, medido

Server Components por defecto, `"use client"` en la hoja más chica, imágenes procesadas al subir,
microinteracciones en CSS. La guía de diseño es `docs/10-design-system.md`: tokens, componentes
y reglas visuales; toda tarea de UI carga `frontend-design:frontend-design` antes de escribir y
`design-reviewer` califica contra la guía. Presupuesto: LCP < 2 s, JS inicial < 150 KB, Lighthouse mobile ≥ 90,
verificado en cada PR contra el build de producción local (`pnpm verify`). Todo componente con
datos tiene cargando, vacío y error diseñados. Ningún string visible ni color fuera de `messages/` y de los tokens.

## Restricciones

- Stack decidido en `docs/07-stack.md`; una dependencia nueva se adopta en su última versión
  estable y se registra ahí con fecha, en el mismo PR. Un cambio transversal de stack es su
  propio PR con decisión previa de Hernán.
- Código en inglés, UI en español rioplatense vía `messages/es.json`, enums de base en inglés.
- Commits en inglés (Conventional Commits). Issues y PRs en español.

## Flujo

Historia con etiqueta `lista` → Ready → Spec (endurecida, plan revisado, tasks, analyze) →
Build (user story por user story, converge) → Review (loop de arreglo con tope) → Ship (`pnpm verify`
y CI verdes) → Merge (squash). Los checkpoints humanos son la etiqueta `lista` antes y el
build local de `main` después. Sin Vercel hasta el MVP (decisión 2026-09-17). Detalle en `docs/09-flujo-de-trabajo.md`.

## Gobernanza

- Esta constitución se enmienda por PR con motivo explícito y fecha; las decisiones de producto
  se registran en el doc del tema con **Decisión (fecha):**.
- Lo descartado no se borra: va a la sección "Descartado" del doc con el motivo.
- Hernán decide qué entra (`lista`) y valida lo que salió (build local). Su rechazo es una historia
  nueva o un comentario en la que sigue, nunca un parche por fuera del flujo.

**Versión**: 1.4.0 | **Ratificada**: 2026-09-16 | **Última enmienda**: 2026-09-17
