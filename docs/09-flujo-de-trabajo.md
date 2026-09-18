# 09 — Flujo de trabajo

**Decisión (2026-09-16):** el desarrollo lo hace un pipeline casi desatendido, derivado del de
`biotec-sistema`, con dos cambios de fondo: **las historias son features grandes y dicen solo el
qué**, y **las reglas viven en herramientas** (lint, CI, hooks, agentes revisores), no en prosa.
Hernán decide antes (qué historias entran) y valida después (el build local de `main`). Todo lo del
medio corre solo.

## Objetivo

Construir lo que está en `docs/` sin retrabajo:

- **ni por fallas**: nada llega a `main` sin compuertas verdes y revisión de contexto fresco;
- **ni por deriva**: la historia acota el alcance, la tabla "Fuera del MVP" es lista de aborto, y
  los hallazgos fuera de alcance pasan por un umbral antes de convertirse en trabajo.

## Qué se copió de biotec y qué se cambió

| De biotec | Acá |
|---|---|
| Definition of Ready con "Fuera de alcance" explícito | Igual. Es el freno real a irse por las ramas. |
| Historias con mecanismos de BD, códigos HTTP, archivos | **No.** La historia dice el qué. El cómo lo decide el plan y lo revisa un agente. |
| Historias chicas (1 PR / ≤ 1 día, ~130 para un sistema) | **No.** Una historia es una feature completa; el MVP entero son ~16. |
| spec → endurecimiento con dos subagentes → plan → tasks → analyze → implement → converge | Igual, más una **revisión del plan** contra las convenciones antes de implementar. |
| Loops con tope (3 rondas) y PR en borrador si no queda verde | Igual. Nunca se reporta éxito falso. |
| `/code-review` como fork que reporta a la sesión padre (los hallazgos no llegaban al PR) | **Revisores como subagentes tipados dentro del workflow**; el orquestador decide. |
| Umbral de seguimiento (§VI) y `known-limitations.md` | Igual, adaptado al funnel de adopción. Desde el día uno. |
| `premises.mjs` y sellos `main@sha` | **No.** Las historias se refinan justo antes del batch y la etapa Ready las verifica contra `main`. |
| Batch secuencial con etapa de merge | Igual. |
| Checkpoint humano en el PR (Andrés validaba) | **Antes** (etiqueta `lista`) y **después** (el build local de `main`). |
| Repo privado en plan Free, CI fantasma, hook `pre-push` sustituto | Repo público con branch protection. |
| Manual de operador, seed por PR, Caddy, Railway | No aplica. |

## Historias: el qué, a tamaño feature

### Tamaño

Una historia es **algo que una persona puede hacer de punta a punta y contar en una frase**:
"publicar un animal", "solicitar una adopción", "aceptar a un solicitante y hablar por WhatsApp".
Cabe en una página de issue. Una historia = un PR = una corrida del pipeline.

Se divide solo si:
- no se puede probar de punta a punta hasta terminar la otra mitad;
- cruza dos numerales distintos de `03-mvp-features.md` sin que uno dependa del otro;
- la spec le encuentra más de ~5 user stories priorizadas.

Adentro de la corrida, la spec la parte en user stories priorizadas (P1, P2, …) y se construyen
y verifican una por una. Ese es el mecanismo que mantiene sólida una feature grande.

### Estructura

Se escribe en español, en lenguaje de producto. Este es el cuerpo completo; las secciones que no
aplican dicen "no aplica", no se borran.

```
## Historia
**Como** <rol> **quiero** <capacidad> **para** <valor>.

## Contexto
<qué problema resuelve y por qué ahora; cita de docs/01 o docs/03>

## Alcance
- Incluye: <lo que entra>
- No incluye (explícito): <lo que NO entra, aunque parezca obvio>

## Reglas de negocio
- <en lenguaje de producto: "el contacto de ambos se muestra solo cuando la solicitud fue aceptada">

## Criterios de aceptación
### Camino feliz
- **Dado** <situación> **cuando** <acción> **entonces** <lo que la persona ve o puede hacer>
### Casos borde (al menos 3)
- **Dado** <límite, vacío, duplicado, repetición, expiración> **cuando** … **entonces** …
### Errores y rechazos
- **Dado** <entrada inválida, sin permiso, vencido> **cuando** … **entonces** <qué ve y qué puede hacer>

## Pantallas
- <pantallas o secciones nuevas o cambiadas; para cada una, qué muestra cuando no hay nada>

## Datos personales
- <qué se guarda de la persona, quién lo ve, cuándo se borra — o "no aplica">

## Medición
- <eventos del funnel que emite (docs/03 §7) — o "no aplica">

## Dependencias
- #<historia previa> · <doc citado>
```

**Palabras prohibidas en una historia:** tabla, columna, RLS, endpoint, trigger, código HTTP,
Server Action, componente, hook, zod, Supabase, Postgres, migración, ruta de archivo. Si aparecen,
la historia está contando el cómo. `scripts/new-story.sh` rechaza el cuerpo, y la etapa Ready
aborta. El cómo vive en `plan.md`, lo escribe el agente y lo revisa otro agente contra
`08-convenciones-codigo.md` y `07-stack.md`.

**Excepción, milestone `M0 - Base`:** esas historias son sobre las herramientas, así que
nombrarlas es su qué. `scripts/new-story.sh`, la etapa Ready y los agentes de endurecimiento
saltean el chequeo de palabras para ese milestone; el resto de la Definition of Ready se aplica
igual.

### Definition of Ready y la etiqueta `lista`

Una historia está lista cuando: valor enunciado · alcance acotado con "no incluye" · criterios
verificables desde la persona que usa el producto · al menos 3 casos borde y errores · pantallas
con su estado vacío · datos personales declarados · nada de la tabla "Fuera del MVP" · dependencias
cerradas · tamaño feature · **sin palabras prohibidas** · milestone asignado.

`/story-map review <#>` la califica. **Hernán le pone la etiqueta `lista`** (o le dice a
`/story-map` que lo haga). El batch solo toma historias con `lista`. Ese es el primer checkpoint
humano: diez minutos leyendo historias valen más que horas de retrabajo.

### Milestones

Los cinco pasos del "Orden de construcción" de `03-mvp-features.md`:

| Milestone | Contenido |
|---|---|
| `M0 - Base` | Scaffold, tooling, compuertas como código, driver de capturas, CI activo |
| `M1 - Cuentas y confianza` | 03 §1 |
| `M2 - Publicación y difusión` | 03 §2 y §3 |
| `M3 - Solicitud de adopción` | 03 §4 |
| `M4 - Cierre, seguimiento y admin` | 03 §5, §6 y §7 |
| `M5 - Beta cerrada` | Landing, SEO básico, errores, checklist de lanzamiento |

### Mapa inicial (borrador, se confirma con `/story-map`)

- **M0**: F00 Scaffold y compuertas.
- **M1**: F01 Registro e ingreso sin contraseña con perfil básico · F02 Verificación de teléfono
  (nivel 1) · F03 Verificación de identidad con cola de revisión manual (nivel 2) · F04 Aval entre
  usuarios y perfil público con badges (nivel 3) · F05 Reportar, bloquear y suspender.
- **M2**: F06 Publicar un animal con fotos · F07 Listado con filtros y ficha pública compartible ·
  F08 Ciclo de vida de la publicación (estados, expiración, recordatorio, nivel mínimo exigido,
  cola de revisión).
- **M3**: F09 Solicitar adopción con el cuestionario · F10 Bandeja del publicador y revelación
  de contacto.
- **M4**: F11 Cierre con compromiso de adopción · F12 Seguimiento a 30 días · F13
  Instrumentación, encuestas y feedback · F14 Panel de admin consolidado.
- **M5**: F15 Landing, SEO, errores y lanzamiento de la beta.

## El pipeline

`/story-ship <#>` corre una historia en la sesión. `ship-batch` (Workflow) corre varias, una por
vez, con un agente de contexto fresco por etapa. Las etapas son las mismas y están escritas una
sola vez en `.claude/skills/story-ship/stages/`.

| Etapa | Entrada | Salida | Corta si |
|---|---|---|---|
| **Ready** | Issue con `lista` | Veredicto contra la DoR y contra `main` actual | Falla la DoR, hay palabras prohibidas, parte del alcance ya existe, toca "Fuera del MVP" |
| **Spec** | Historia | Rama `feature/<n>-<slug>`, `spec.md` endurecido (grader + adversario, ≤ 3 rondas), `plan.md` (con sección «Diseño» si toca UI) revisado contra convenciones y `10-design-system.md`, `tasks.md`, `analyze` limpio; commit | Dependencia nueva sin registrar, cambio transversal de stack |
| **Build** | Spec, plan, tasks | User story por user story: implementar, tests, compuertas locales; `converge` hasta que no quede nada; capturas de las rutas tocadas a 390 px | Compuertas rojas después de 3 intentos |
| **Review** | Diff y capturas | Hallazgos tipados de dos revisores de contexto fresco (corrección y alcance; convenciones y diseño); loop de arreglo ≤ 3 rondas | Queda un hallazgo crítico → PR en borrador |
| **Ship** | Rama verde | `pnpm verify` verde en local, PR con plantilla, CI verde (≤ 2 pasadas de arreglo), hallazgos fuera de alcance clasificados | CI rojo → PR en borrador con el detalle |
| **Merge** | PR verde | Squash en `main`, rama borrada, `main` local actualizado | Cualquier duda → no mergea y corta la cadena |

Reglas de todas las etapas:

- **Loops con tope.** Endurecimiento 3, arreglo 3, CI 2. Si se agota, PR en borrador que dice qué
  falla. Nunca se reporta éxito que no se verificó.
- **Modo `auto` (default) y `ask`.** Igual pipeline. En una bifurcación real (forma del modelo de
  datos con más de una opción razonable, dependencia nueva, dirección visual), `auto` elige la más
  razonable y la lista como supuesto en el PR; `ask` pregunta una vez y sigue. Lo mecánico
  (nombres, archivos, reutilizar un helper) nunca es bifurcación.
- **Abortos que no se preguntan:** DoR fallida, "Fuera del MVP", cambio transversal de stack
  (framework CSS, librería base de componentes, auth) → su propio PR con decisión previa.
- **Dependencia nueva:** se adopta en su última versión estable, se registra en `07-stack.md` con
  fecha en el mismo PR, y se lista en los supuestos.
- **Nunca:** merge desde el agente de build, force push, `--no-verify`, `--admin`, tocar
  etiquetas o milestones que no se pidieron. El hook `.claude/hooks/guard-git.mjs` lo bloquea
  mecánicamente.

## Compuertas mecánicas

Todo lo que `CLAUDE.md` y `08-convenciones-codigo.md` declaran y se puede verificar sin criterio
humano, lo verifica una herramienta. Un agente no puede "olvidar" una regla que el lint rechaza.

| Regla | Herramienta | Dónde corre |
|---|---|---|
| Ningún string visible hardcodeado | oxlint (`react/jsx-no-literals`; excepciones para `ui/`) | pre-commit, CI |
| Ningún hexadecimal en componentes | Check propio del repo (oxlint no trae `no-restricted-syntax`) | pre-commit, CI |
| Nadie llama `.from()` fuera de `lib/supabase/queries/` | oxlint (`no-restricted-imports` sobre el cliente de la base, por carpeta) | pre-commit, CI |
| Capas `app → dominio → ui`, dependencias hacia abajo | oxlint (`no-restricted-imports` con patrones por carpeta) | pre-commit, CI |
| `"use client"` solo en hojas, nunca en `page.tsx` / `layout.tsx` | Check propio del repo, junto al del hexadecimal | pre-commit, CI |
| Componente > 150 líneas | oxlint `max-lines` (warning; el revisor decide) | CI |
| Diseño según `10-design-system.md` (tokens, componentes, estados, antipatrones) | `design-reviewer` sobre el diff y las capturas a 390 px; `frontend-design` cargado antes de escribir | Review |
| `strict`, cero `any` | `tsc --noEmit` (TypeScript 7), `typescript/no-explicit-any` de oxlint | pre-commit, CI |
| Lógica pura, schemas y componentes con lógica | Vitest | pre-commit, CI |
| Tests sin aserción, deshabilitados o con `expect` condicional | Plugin `vitest` de oxlint | pre-commit, CI |
| Cada test prueba lo que dice probar | Stryker (mutation testing) al **100 %** sobre lo que tiene test: lo tocado en el PR, todo en `main` | local (`pnpm mutation`), CI |
| Privacidad de contacto e identidad | Tests contra Supabase local (RLS): lo que un rol no debe ver, no lo ve | CI |
| `main` siempre deployable | `next build` | CI |
| LCP < 2 s, JS inicial < 150 KB, Lighthouse mobile ≥ 90 | Lighthouse CI contra el build de producción local (`pnpm lighthouse`, `.lighthouserc.json`) | local, CI |
| Los 2-3 flujos críticos funcionan sobre el build de producción | Playwright contra `next start` local (`pnpm e2e`) | local, CI |
| Últimas versiones | Renovate | PRs automáticos |
| No force push, no `--no-verify`, no push directo a `main` | `guard-git.mjs` (hook) + branch protection | sesión, GitHub |

Las reglas concretas de oxlint (plugins y versiones) se eligen en F00, con la regla de últimas
versiones. Lo que importa acá es la decisión: **cada fila de esta tabla existe como check antes de
que empiece M1**.

### Qué vale la pena testear

**Decisión (2026-09-17):** no se testea todo. Se testea lo que, si se rompe, engaña a una
persona, expone un dato o hace un cálculo mal. El plan de cada historia dice qué archivos
reciben test y por qué; `plan-reviewer` lo revisa contra esta lista. Un test de más es
mantenimiento sin valor; un test de menos en esta lista es un hallazgo.

Vale la pena:

1. **Una regla de negocio** con consecuencias: quién ve el contacto y cuándo, el límite de
   solicitudes activas, el nivel mínimo para solicitar, la expiración de una publicación, cómo
   se calcula un nivel de verificación. Se testea la función pura que la decide, y si vive en la
   base, su RLS (lo que **no** debe verse).
2. **La validación de lo que la persona escribe:** los schemas zod (ficha, cuestionario,
   teléfono). Cada regla del schema con su caso que pasa y su caso que no.
3. **Un cálculo o transformación con casos borde:** edad aproximada, fechas de expiración y
   seguimiento, redimensionado y ThumbHash, slugs.
4. **Un componente cuyo comportamiento cambia con el estado del dominio:**
   `VerificationBadge` por nivel, `ApplyButton` según verificación y límite,
   `ApplicationStatus`. Se testea la decisión, no el markup.
5. **Los dos o tres flujos críticos de punta a punta** (publicar, solicitar, aceptar), con
   Playwright contra el build de producción.

No vale la pena, y no se escribe: páginas y layouts, primitivas `ui/`, queries que solo
envuelven una consulta (las cubre el test de RLS), componentes que solo pintan, hooks de UI,
configuración, textos, y las acciones que solo llaman a una query y revalidan. Un test de
"renderiza sin explotar" no cuenta como test.

### Cada test prueba lo que dice probar

**Decisión (2026-09-17):** mutation testing con StrykerJS (v10, runner de Vitest, sin checker de
tipos: el paquete de TypeScript 7 ya no expone la API que ese checker usa) como compuerta, **al 100 % sobre lo que tiene test**. Stryker cambia el código a propósito (un `<` por `<=`, un
`return true` por `return false`, una condición borrada) y corre los tests: si siguen verdes,
ese test no prueba nada. Un test que pasa con el código roto es peor que ningún test, porque da
confianza falsa.

- **Se muta lo que tiene test.** `scripts/mutation.mjs` arma la lista con los archivos que
  tienen un test al lado (`foo.ts` + `foo.test.ts`), dentro del límite de `stryker.config.mjs`
  (`src/**` sin `app/`, `components/ui/`, tipos generados, estilos). Un archivo sin test no es
  un 0 %: es una decisión del plan, revisada contra la lista de arriba.
- **En un PR** se mutan los archivos tocados que tienen test y los sujetos de los tests tocados
  (`pnpm mutation`); **en `main`** se mutan todos los que tienen test (`pnpm mutation:all`).
- **Score 100 %, sin margen.** Ningún sobreviviente sin explicación. Un mutante que sobrevive se
  arregla con una aserción mejor, nunca bajando el umbral. La única excepción es un mutante
  equivalente (el cambio no altera el comportamiento observable), anotado en esa misma línea:
  `// Stryker disable next-line <Mutator>: <por qué es equivalente>`. `code-reviewer` verifica
  cada anotación; una que no describe un equivalente es un hallazgo.
- **Por qué 100 y no 80.** El 80 % es el default de la industria para bases grandes con código
  sin dueño. Acá el alcance es chico y elegido a mano, los tests los escribe un agente, y un
  umbral con margen le permite dejar vivo uno de cada cinco mutantes sin decir nada: la misma
  confianza falsa que se quiere evitar. Con excepciones explícitas el 100 % no significa "todo
  matado", significa "nada vivo sin motivo".
- Complementa, no reemplaza: la trazabilidad (`// Covers: US1-AS2`), las reglas de
  el plugin `vitest` de oxlint (`expect-expect`, `no-disabled-tests`, `no-conditional-expect`) y el
  test de RLS por regla de privacidad, que prueba lo que **no** debe verse.

## Umbral de seguimiento

Tres buscadores encuentran casos borde en cada corrida: el adversario de la spec, los revisores y
`converge`. En biotec, cada hallazgo abría una issue y en diez días había quince. Acá, un hallazgo
**fuera del alcance** de la historia se clasifica en este orden:

1. **Se pliega** si es barato y toca código que la historia ya cambia. Eso es alcance.
2. **Se acepta** si no pasa el umbral: va a `docs/known-limitations.md` en el mismo PR, con
   detección y condición de reapertura.
3. **Abre un seguimiento**, **como máximo uno por historia**, el más grave, si pasa el umbral.
   Los demás se listan en el PR bajo "Sobre el umbral, sin abrir" para que Hernán decida.

**El umbral:** el hallazgo corta un paso del funnel (ver ficha → solicitar → aceptar → adoptar) o
de la verificación, **o** muestra datos de contacto o identidad a quien no debe verlos, **o** rompe
el presupuesto de performance de una pantalla del funnel. Todo lo demás es limitación conocida.

El seguimiento se crea con `scripts/new-story.sh`, **sin** `lista`: pasa por `/story-map review`
y por Hernán antes de entrar a un batch.

## Checkpoints humanos

1. **Antes:** Hernán lee las historias del próximo batch y les pone `lista`. Es el único lugar
   donde se decide qué se construye.
2. **Después:** el batch termina con `main` mergeado. `/run-app` levanta el build local y Hernán
   lo recorre con el reporte del batch al lado (supuestos tomados, limitaciones aceptadas,
   seguimientos abiertos).
   Lo que no le gusta es una historia nueva o un comentario en la que sigue, no un parche a mano.
3. **Bajo demanda:** `--ask` para historias con decisiones de producto que prefiere tomar él.

## Herramientas

```
.claude/
  settings.json                permisos preaprobados y el hook
  hooks/guard-git.mjs          bloquea force push, --no-verify, --admin, push directo a main
  agents/
    spec-grader.md             califica la spec contra su checklist (Sonnet, barato, solo lee)
    spec-adversary.md          busca lo que la checklist no vio (modelo de la sesión, solo lee)
    plan-reviewer.md           revisa plan.md contra 07 y 08 antes de implementar (solo lee)
    code-reviewer.md           corrección y alcance del diff, hallazgos tipados (solo lee)
    design-reviewer.md         convenciones y diseño sobre el diff y las capturas (solo lee)
  skills/
    story-map/                 map | new | review | refine — el backlog en GitHub
    story-ship/                el pipeline de una historia; stages/*.md son la fuente única
    run-app/                   contrato del driver de capturas (se implementa en F00)
    speckit-*/                 spec-kit v1.0.7, gestionado por `specify`; no se edita a mano
  workflows/ship-batch.js      varias historias, un agente fresco por etapa, merge entre medio
.specify/                      templates y scripts de spec-kit; constitution.md es nuestra
scripts/
  new-story.sh                 crea la issue completa, rechaza el cómo, verifica el milestone
  bootstrap-github.sh          etiquetas y milestones, idempotente
.github/
  workflows/ci.yml             pnpm verify: lint, types, tests + RLS, build, e2e y Lighthouse locales
  pull_request_template.md · ISSUE_TEMPLATE/historia.yml
docs/known-limitations.md      lo aceptado bajo el umbral
docs/10-design-system.md       la guía de diseño: tokens, componentes, reglas; gana sobre 07
```

Spec-kit se instaló con
`uvx --from git+https://github.com/github/spec-kit.git@v1.0.7 specify init --here --integration claude --script ps`.
Se actualiza con el mismo comando en el tag nuevo y `--force`; los skills `speckit-*` y
`.specify/templates` son de spec-kit. Lo nuestro es `.specify/memory/constitution.md`.

Plugins de Claude Code en uso: **supabase** (skills `supabase:supabase` y
`supabase:supabase-postgres-best-practices`, obligatorios antes de tocar auth o la base),
**vercel** (skills `vercel:nextjs`, `vercel:shadcn`, `vercel:react-best-practices`; el deploy y
sus MCP quedan para M5) y **frontend-design** (`frontend-design:frontend-design`, obligatorio
antes de tocar UI). Los MCP de Supabase y Vercel no se autentican hasta que exista un proyecto
cloud.

## Sin Vercel hasta el MVP

**Decisión (2026-09-17):** hasta tener el MVP no se conecta Vercel; todo corre en local. Las
validaciones no se recortan: lo que iba a correr contra el preview corre contra el build de
producción local (`next build` + `next start`), con `pnpm verify` en la máquina y el mismo
comando en CI. El checkpoint humano de después es `/run-app` sobre `main`. Vercel se conecta
para la beta cerrada (M5), con los mismos checks apuntando al preview.

## Repo

**Decisión (2026-09-17):** repo público, `github.com/hergarcia/adopciones-mvp`, con el codename
como nombre hasta que exista el nombre real (`04-nombre.md`; GitHub redirige al renombrar).
Público porque da Actions ilimitadas y branch protection gratis, sin CI fantasma; el proyecto no
tiene fin de lucro y el código no contiene datos. `main` protegida: `ci` requerido, historia
lineal, sin force push, sin excepciones para admins. Todo entra por PR, los docs también.

## Descartado

- **Historias con el cómo adentro** (mecanismos de BD, códigos HTTP, archivos). Motivo: mezclan
  la decisión de producto con la técnica, envejecen con el código y no las puede leer nadie que no
  programe. El cómo va en `plan.md`, que se genera y se revisa en cada corrida.
- **Historias chicas.** Motivo: 130 PRs para un sistema es overhead de proceso; cada corrida
  tiene costo fijo. La solidez viene de verificar user story por user story adentro de la feature.
- **`premises.mjs` y sellos `main@sha`.** Motivo: cura un síntoma de escribir historias meses
  antes de construirlas. Refinar justo antes del batch y verificar en Ready lo reemplaza.
- **Stacked PRs.** Motivo: el modo merge de biotec resultó más simple; nunca hizo falta la pila.
- **Roadmap a mano por cadena.** Motivo: ~10 % de los commits de biotec. Acá el orden vive en
  `03-mvp-features.md` y en los milestones.
- **Detección de CI fantasma.** Motivo: se evita con repo público o plan Pro.
