# 09 — Flujo de trabajo

**Decisión (2026-09-16):** el desarrollo lo hace un pipeline casi desatendido, derivado del de
`biotec-sistema`, con dos cambios de fondo: **las historias son features grandes y dicen solo el
qué**, y **las reglas viven en herramientas** (lint, CI, hooks, agentes revisores), no en prosa.
Hernán decide antes (qué historias entran) y valida después (el build local de `main`). Todo lo del
medio corre solo.

**Decisión (2026-09-25):** ahora también corren solas las puntas. Un enjambre de agentes elige qué
se construye y lo acepta contra la app real; Hernán veta en vez de aprobar (§El enjambre).

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
| Checkpoint humano en el PR (Andrés validaba) | **Veto** en cualquier momento y recorrida de `main` al cerrar cada milestone (§El enjambre). |
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

`/story-map review <#>` la califica. **La etiqueta `lista` la pone Producto** cuando la historia
cumple la DoR y el proxy de Hernán predice que él la aprobaría; Hernán la veta sacándola
(§El enjambre). Nada sin `lista` se construye.

### Milestones

Los cinco pasos del "Orden de construcción" de `03-mvp-features.md`:

| Milestone | Contenido |
|---|---|
| `M0 - Base` | Scaffold, tooling, compuertas como código, driver de capturas, CI activo |
| `M1 - Cuentas y confianza` | 03 §1 |
| `M2 - Publicación y difusión` | 03 §2 y §3, más la landing |
| `M3 - Solicitud de adopción` | 03 §4 |
| `M4 - Cierre, seguimiento y admin` | 03 §5, §6 y §7 |
| `M5 - Beta cerrada` | Prender la indexación (dominio, sitemap, datos estructurados), errores, checklist de lanzamiento |

### Mapa inicial (borrador, se confirma con `/story-map`)

- **M0**: F00 Scaffold y compuertas.
- **M1**: F01 Registro e ingreso sin contraseña con perfil básico · F02 Verificación de teléfono
  (nivel 1) · F03 Verificación de identidad con cola de revisión manual (nivel 2) · F04 Aval entre
  usuarios y perfil público con badges (nivel 3) · F05 Reportar, bloquear y suspender.
- **M2**: F06 Publicar un animal con fotos · F07 Listado con filtros y ficha pública compartible ·
  F08 Ciclo de vida de la publicación (estados, expiración, recordatorio, nivel mínimo exigido,
  cola de revisión) · F09 Landing.
- **M3**: F10 Solicitar adopción con el cuestionario · F11 Bandeja del publicador y revelación
  de contacto.
- **M4**: F12 Cierre con compromiso de adopción · F13 Seguimiento a 30 días · F14
  Instrumentación, encuestas y feedback · F15 Panel de admin consolidado.
- **M5**: F16 Prender la indexación (dominio definitivo, `robots.txt`, sitemap, JSON-LD), errores
  y lanzamiento de la beta. La estructura de cada pantalla ya vino con su historia
  (`08-convenciones-codigo.md` §Encontrable); acá se prende, no se construye.

**Decisión (2026-09-20): la landing y la indexación son dos historias, y la landing no espera a
M5.** Estaban juntas en una sola porque comparten un bloqueo — no hay nombre ni dominio
(`04-nombre.md`) —, no porque sean el mismo trabajo: una es una pantalla que hay que diseñar y
escribir, la otra es un interruptor que se prende una vez. Además dependen de cosas distintas: la
landing, del nombre; la indexación, del dominio. La landing va al final de M2, cuando el listado y
la ficha ya existen: así se diseña contra contenido real y no contra una maqueta, y nace con
`noindex` como todo lo demás hasta M5. Si para entonces el nombre todavía no está, lo único que
queda pendiente es el copy de marca.

## El pipeline

`/story-ship <#>` corre una historia en la sesión. `ship-batch` (Workflow) corre varias, una por
vez, con un agente de contexto fresco por etapa. El Director del enjambre usa las mismas etapas.
Están escritas una sola vez en `.claude/skills/story-ship/stages/`.

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

## El enjambre

**Decisión (2026-09-25):** el pipeline deja de esperar a Hernán en las dos puntas. Un enjambre de
agentes elige qué se construye, lo construye, lo acepta contra la app real y sigue con lo próximo.
Hernán no aprueba: veta. Motivo: lo de adentro ya corría solo, y lo que frenaba estaba afuera:
historias esperando `lista` (#11, #12, #13 y #25), el gusto corregido después del merge (#21, #24
y #27 salieron de la recorrida) y los PRs de Renovate sin dueño.

### Roles

Un rol es un derecho de decisión, no un personaje: tiene una entrada, una salida tipada y un límite.

| Rol | Decide | Qué es |
|---|---|---|
| **Director** | El próximo paso, uno por vuelta y con una sola historia en curso, en este orden: atender un veto, seguir la historia en curso, aceptar la última mergeada, construir la próxima con `lista`, escribir la próxima historia, mantenimiento | Código, no un agente: `.claude/workflows/director.js`, que para construir corre `ship-batch` con una historia. Un orquestador LLM es el primer lugar donde un enjambre se queda dando vueltas |
| **Producto** | Qué historia sigue, en el orden de construcción de `docs/03`; cómo se escribe y se parte; si lleva `lista`; si el alcance suma algo | Agente `product-owner`, sobre `/story-map` |
| **Proxy de Hernán** | Si Hernán aprobaría una historia, una decisión de producto o una pantalla (capturas a 390 y a 1280 px) | Agente `hernan-proxy`, solo lee. Su criterio vive en `docs/11-criterio.md`: las correcciones de Hernán y los «Descartado» de los docs; cada veto le suma una línea |
| **Dev** | El cómo: spec, plan, build, review, ship, merge | El pipeline de arriba. El proxy se suma a la etapa Review como tercer revisor |
| **QA** | Si lo que entró a `main` cumple cada criterio de aceptación de su historia en la app real | Agente `acceptance-qa`: recorre `main` como las personas sembradas, con `walk.mjs` y Playwright. Lo que falla pasa por el umbral de seguimiento |
| **Mantenimiento** | Si un PR de Renovate entra (con `pnpm verify` verde, se mergea); si una limitación de `known-limitations.md` ya cumple su condición de reapertura | Agente `maintainer` |

### Quién decide qué

- **Los agentes, solos:** lo que un revert deshace y `docs/` ya cubre. La redacción y la partición
  de una historia, su `lista`, el modelo de datos, la UX dentro de `docs/10`, una dependencia nueva
  (con su línea en `07-stack.md`), una limitación aceptada, un seguimiento. Queda donde queda hoy:
  en la historia, el plan o el PR.
- **Los agentes, y avisan:** una decisión de producto que `docs/` no cubre, un cambio en `docs/10`
  y una incorporación al alcance. Se escribe como **Decisión (fecha, agente):** en el doc del tema
  y se abre un issue `aviso` que la enlaza. Si Hernán está de acuerdo, cierra el issue; si no, la
  decisión pasa a «Descartado» con su motivo y lo construido se corrige con una historia nueva.
- **Hernán, solo:** plata (cuentas, dominios, planes pagos) · nombre y marca · una regla de
  privacidad que `docs/` no trae (quién ve un dato personal, cuánto se guarda; Ley 18.331) · un
  cambio transversal de stack · la tabla «Fuera del MVP» · prender la indexación · las reglas que
  juzgan a los agentes (§Las reglas no se tocan solas). El enjambre lo pide con un issue
  `decision` y sigue con lo que no depende de eso.

Si el proxy predice que Hernán rechazaría algo de las dos primeras categorías, pasa a la tercera.

### Veto

- **`lista`.** Hernán veta una historia sacándole la etiqueta. El Director la mira antes de cada
  etapa: si ya no está, la corrida se detiene ahí, la rama queda y nada se mergea. El enjambre
  nunca saca `lista` (lo bloquea `guard-git.mjs`), así que si desaparece es un veto.
- **Lo que ya entró** se veta como siempre: una historia nueva o un comentario en la que sigue,
  nunca un parche a mano.
- **Cada veto calibra al proxy.** El Director agrega el motivo a `docs/11-criterio.md`, tomado del
  comentario de Hernán; si no dejó ninguno, lo pide en un issue `decision`.
- **Freno por racha.** Dos vetos en el mismo milestone quieren decir que el proxy está mal
  calibrado: el Director para y abre un `decision` con lo vetado. Retoma cuando Hernán lo cierra.

### El alcance puede crecer, con tope

**Decisión (2026-09-25):** Producto puede sumar a `docs/03` algo que no estaba, y avisa. Como máximo
**una incorporación por milestone**, que pase el umbral de seguimiento (§Umbral de seguimiento).
La tabla «Fuera del MVP» sigue siendo lista de aborto y solo la cambia Hernán. Las ideas que no
entran van a `docs/05-ideas-futuras.md` y al reporte del milestone.

### Las reglas no se tocan solas

Un enjambre que puede editar lo que lo juzga termina aflojándolo: no por malicia, sino porque bajar
un umbral es el arreglo más corto para un test rojo. Esto cambia solo con la aprobación de Hernán:

- la constitución, este doc, `CLAUDE.md`, la tabla «Fuera del MVP» de `docs/03` y
  `docs/11-criterio.md` (a este último el enjambre le agrega líneas; nunca borra ni cambia);
- las compuertas: la configuración de lint, tipos, tests, mutation, e2e y Lighthouse, los checks
  propios, `tests/gates/`, `lefthook.yml`, `.github/workflows/` (sin aprobación solo cambia la
  versión de una action, que es lo que hace Renovate) y el campo `scripts` de `package.json` (las
  dependencias cambian sin aprobación);
- el pipeline: `.claude/` y `.specify/`.

La lista completa, con esas excepciones, es `scripts/protected/rules.mjs`, que está en su propia
lista. La leen tres frenos:

1. **Al escribir, en la sesión del enjambre**, que se abre con `SWARM=1` (en PowerShell,
   `$env:SWARM=1; claude`): `.claude/hooks/guard-rules.mjs` bloquea el Edit o el Write que cambia
   un archivo de la lista, y el comando de Bash que a ojo lo escribiría (`sed -i`, una redirección,
   `--write`). Las sesiones de Hernán no llevan la variable.
2. **Al hacer commit, en la misma sesión**: el mismo hook mira lo que está por entrar al commit.
   Ahí cae lo que el control a ojo dejó pasar.
3. **En CI**: `scripts/check-protected.mjs` rechaza el PR que cambia la lista si no tiene la
   etiqueta `reglas-aprobadas`, y `guard-git.mjs` no deja que el enjambre la ponga.

El enjambre usa la cuenta de GitHub de Hernán, así que GitHub no distingue quién hizo qué y
`CODEOWNERS` no frena nada: nadie aprueba su propio PR. Un agente decidido saltearía los dos frenos
con `gh api`; el riesgo que cubren es otro, el del agente bienintencionado que baja un umbral.

### Dónde corre

**Decisión (2026-09-25):** en local, en la máquina de Hernán y con su suscripción de Claude Code:
una sesión del enjambre corre el Director con `/loop`. Reusa lo que ya existe (Supabase en Docker,
`walk.mjs`, las etapas de `ship-batch`) y no cuesta nada aparte de la suscripción; la máquina tiene
que estar prendida. **Se migra a GitHub Actions cuando el enjambre cierre un milestone sin freno por
racha.** Allá corre por eventos (etiqueta, merge, cron) con la máquina apagada, Linux cierra KL-001,
`github-actions[bot]` le da identidad propia y un token de la suscripción (`claude setup-token`)
evita pagar por uso.

**Cómo se prende.** Una terminal en la raíz del repo, `$env:SWARM=1; claude` (PowerShell), y en
esa sesión `/loop corré el workflow director`. Cada vuelta es un paso; `/loop` se toma su propio
ritmo y espacia las vueltas cuando el Director responde `idle` (todo lo que queda espera a
Hernán). Antes de soltarlo, `corré el workflow director con {dryRun: true}` lee el tablero y dice
qué haría. Para pararlo, se cierra la sesión: lo que quedó a mitad lo retoma la próxima vuelta,
porque la etapa Spec reanuda una rama que ya existe.

El Director anota en GitHub lo que necesita recordar entre vueltas: `vetada` en una historia cuyo
veto ya registró, `aceptada` en una que QA ya recorrió, un issue «Freno por racha en <milestone>»
mientras está frenado y uno «Cierre de <milestone>» cuando el milestone terminó. Lo que el enjambre
cambia en `docs/` fuera de una historia (una línea de `docs/11`, una limitación aceptada) entra
por un PR propio que se mergea solo si CI queda verde.

## Compuertas mecánicas

Todo lo que `CLAUDE.md` y `08-convenciones-codigo.md` declaran y se puede verificar sin criterio
humano, lo verifica una herramienta. Un agente no puede "olvidar" una regla que el lint rechaza.

| Regla | Herramienta | Dónde corre |
|---|---|---|
| Ningún string visible hardcodeado | oxlint (`react/jsx-no-literals`; excepciones para `ui/`) | pre-commit, CI |
| Ningún hexadecimal en componentes | Check propio del repo (oxlint no trae `no-restricted-syntax`) | pre-commit, CI |
| Nadie llama `.from()` fuera de `lib/supabase/queries/` | oxlint (`no-restricted-imports` sobre el cliente de la base, por carpeta) | pre-commit, CI |
| Capas `app → dominio → ui`, dependencias hacia abajo | oxlint (`no-restricted-imports` con patrones por carpeta). Esta regla y la de arriba leen el alias `@/`, así que dentro de `src/` un import con `../` también es un error: las saltearía | pre-commit, CI |
| `"use client"` solo en hojas, nunca en `page.tsx` / `layout.tsx` | Check propio del repo, junto al del hexadecimal | pre-commit, CI |
| Toda `page.tsx` declara su título y su descripción | Check propio del repo (`require-route-metadata`) | pre-commit, CI |
| Título, descripción, canónica, `alt` y anclas rastreables en el HTML servido | Lighthouse CI (auditorías de SEO; `is-crawlable` apagada mientras el sitio esté en `noindex`, se prende en M5) | local, CI |
| Componente > 150 líneas | oxlint `max-lines` (warning; el revisor decide) | CI |
| Diseño según `10-design-system.md` (tokens, componentes, estados, antipatrones) | `design-reviewer` sobre el diff y las capturas a 390 px; `frontend-design` cargado antes de escribir | Review |
| `strict`, cero `any` | `tsc --noEmit` (TypeScript 7), `typescript/no-explicit-any` de oxlint | pre-commit, CI |
| Lógica pura, schemas y componentes con lógica | Vitest | pre-commit, CI |
| Tests sin aserción, deshabilitados o con `expect` condicional | Plugin `vitest` de oxlint | pre-commit, CI |
| Cada test prueba lo que dice probar | Stryker (mutation testing) al **100 %** sobre lo que tiene test: lo tocado en el PR, todo en `main` | local (`pnpm mutation`), CI |
| Privacidad de contacto e identidad | Tests contra Supabase local (RLS): lo que un rol no debe ver, no lo ve | CI |
| Ninguna clave privada llega al cliente ni se versiona —la de servicio saltea RLS, la de Resend manda correo en nombre del dominio— | Check propio del repo (`scripts/check-service-key.mjs`), dentro de `pnpm lint` | pre-commit, CI |
| `main` siempre deployable | `next build` | CI |
| LCP < 2,5 s, JS inicial < 150 KB, Lighthouse mobile ≥ 90 | Lighthouse CI contra el build de producción local (`pnpm lighthouse`, `.lighthouserc.json`) | local, CI |
| Los 2-3 flujos críticos funcionan sobre el build de producción | Playwright contra `next start` local (`pnpm e2e`) | local, CI |
| Últimas versiones | Renovate | PRs automáticos |
| No force push, no `--no-verify`, no push directo a `main` | `guard-git.mjs` (hook) + branch protection | sesión, GitHub |
| Las reglas que juzgan a los agentes cambian solo con `reglas-aprobadas` | `guard-rules.mjs` y `guard-git.mjs` (hooks, con `SWARM=1`) + `check-protected.mjs` | sesión del enjambre, CI |

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
  arregla con una aserción mejor, nunca bajando el umbral. Hay **dos** excepciones, y cada una se
  anota en esa misma línea con su forma propia, para que `code-reviewer` pueda distinguirlas:

  ```
  // Stryker disable next-line <Mutator>: <por qué es equivalente>
  // Stryker disable next-line <Mutator>: no compila — <por qué el mutante no es TypeScript válido>
  ```

  La primera es un **mutante equivalente**: el cambio no altera el comportamiento observable.
  La segunda es un **mutante que no compila**, y existe por una consecuencia de correr sobre
  TypeScript 7 (**decisión 2026-09-18**): el verificador de tipos de Stryker no puede usarse, así
  que Stryker muta y Vitest transpila sin chequear tipos, y un mutante que sería un error de tipos
  se ejecuta igual. Si los tests no lo matan, cuenta como sobreviviente, y el umbral de 100 % se
  pone rojo por un mutante imposible. Con el verificador, esos mutantes quedarían marcados
  `CompileError` y fuera del denominador. Detalle y condición de reapertura en
  `known-limitations.md`.

  `code-reviewer` verifica cada anotación; una que no describe ninguna de las dos cosas es un
  hallazgo.
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

El seguimiento se crea con `scripts/new-story.sh`, **sin** `lista`: pasa por Producto, como
cualquier historia, antes de construirse.

## Checkpoints humanos

**Decisión (2026-09-25):** Hernán veta en vez de aprobar (§El enjambre). Quedan tres momentos:

1. **El veto, en cualquier momento:** sacar `lista`, rechazar un `aviso`, comentar una historia.
   Lo que no le gusta de lo que ya entró es una historia nueva o un comentario en la que sigue, no
   un parche a mano.
2. **Lo reservado:** los issues `decision`. El enjambre no los resuelve ni se queda esperando:
   sigue con lo que no depende de ellos.
3. **Al cerrar un milestone:** el Director avisa con el reporte del milestone (supuestos, avisos,
   incorporaciones, limitaciones aceptadas, seguimientos, los informes de QA y del proxy). Hernán
   recorre `main` con `/run-app`. El enjambre no espera esa recorrida: lo que no le guste es un
   veto como cualquier otro.

`/story-ship <#> --ask` sigue existiendo para la historia que Hernán quiera decidir en persona, en
una sesión con él.

## Herramientas

```
.claude/
  settings.json                permisos preaprobados y el hook
  hooks/guard-git.mjs          bloquea force push, --no-verify, --admin, push directo a main; con
                               SWARM=1, también sacar lista y ponerse reglas-aprobadas
  hooks/guard-rules.mjs        con SWARM=1, bloquea escribir y commitear lo que juzga a los agentes
  agents/
    spec-grader.md             califica la spec contra su checklist (Sonnet, barato, solo lee)
    spec-adversary.md          busca lo que la checklist no vio (modelo de la sesión, solo lee)
    plan-reviewer.md           revisa plan.md contra 07 y 08 antes de implementar (solo lee)
    code-reviewer.md           corrección y alcance del diff, hallazgos tipados (solo lee)
    design-reviewer.md         convenciones y diseño sobre el diff y las capturas (solo lee)
    product-owner.md           escribe la próxima historia y le pone lista si el proxy aprueba
    hernan-proxy.md            predice si Hernán aprobaría una historia, una decisión o pantallas
    acceptance-qa.md           acepta lo mergeado contra la app real, criterio por criterio
    maintainer.md              Renovate y condiciones de reapertura
  skills/
    story-map/                 map | new | review | refine — el backlog en GitHub
    story-ship/                el pipeline de una historia; stages/*.md son la fuente única
    run-app/                   contrato del driver de capturas (se implementa en F00)
    speckit-*/                 spec-kit v1.0.7, gestionado por `specify`; no se edita a mano
  workflows/ship-batch.js      varias historias, un agente fresco por etapa, merge entre medio
  workflows/director.js        el enjambre: un paso por vuelta, con /loop en una sesión SWARM=1
.specify/                      templates y scripts de spec-kit; constitution.md es nuestra
scripts/
  new-story.sh                 crea la issue completa, rechaza el cómo, verifica el milestone
  bootstrap-github.sh          etiquetas y milestones, idempotente
  protected/rules.mjs          la lista de lo que juzga a los agentes, con sus excepciones
  check-protected.mjs          en CI: el PR que la toca necesita reglas-aprobadas
.github/
  workflows/ci.yml             aprobación de reglas en el PR; después pnpm verify: lint, types,
                               tests + RLS, build, e2e y Lighthouse locales
  pull_request_template.md · ISSUE_TEMPLATE/historia.yml
docs/known-limitations.md      lo aceptado bajo el umbral
docs/10-design-system.md       la guía de diseño: tokens, componentes, reglas; gana sobre 07
docs/11-criterio.md            el criterio de Hernán que usa el proxy; solo crece, una línea por veto
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
- **Hernán como firma de `lista`** (decisión 2026-09-16). Motivo: era el cuello de botella del
  pipeline, con historias esperando firma, y lo que cuidaba (que no se construya algo que Hernán no
  quiere) lo cubren el proxy y el veto con menos espera. Reemplazada el 2026-09-25 (§El enjambre).
- **Roles como personajes (un CEO, un DEV que conversan).** Motivo: dos agentes que conversan hasta
  ponerse de acuerdo no se revisan, se dan la razón. Un rol es un derecho de decisión con salida
  tipada, y el orquestador es código.
- **El proxy en modo sombra antes de darle `lista`.** Motivo: Hernán prefirió el veto desde el
  principio; el proxy se calibra con los vetos en vez de con predicciones en paralelo.
- **Alcance fijo hasta el MVP.** Motivo: Hernán prefirió que el enjambre pueda sumar, con tope de
  uno por milestone, el umbral de seguimiento y aviso.
- **Cuenta de GitHub aparte para el enjambre.** Motivo: el enjambre corre con la cuenta y la
  suscripción de Hernán, y el hook más el check cubren el riesgo real (§Las reglas no se tocan
  solas). Se reabre al migrar a GitHub Actions, donde la identidad separada viene sola.
- **GitHub Actions desde el arranque.** Motivo: cambia el entorno de todo el pipeline a la vez que
  se estrena la autonomía. Se migra cuando el enjambre cierre un milestone sin freno por racha.
