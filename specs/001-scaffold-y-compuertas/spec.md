# Feature Specification: Scaffold y compuertas

**Feature Branch**: `feature/1-scaffold-y-compuertas`

**Created**: 2026-09-17 · **Revisada**: 2026-09-18 (rondas 1 y 2 de endurecimiento)

**Status**: Draft

**Input**: Historia #1 «Scaffold y compuertas», milestone `M0 - Base`, etiqueta `lista`. Cuerpo
verbatim en `story.md`, más el comentario de Hernán del 2026-09-18 en la issue.

**Excepción de milestone**: esta historia pertenece a `M0 - Base`. Según
`docs/09-flujo-de-trabajo.md` §Estructura y `.claude/skills/story-ship/stages/spec.md` §2, las
historias de ese milestone son **sobre las herramientas**, así que nombrar comandos, herramientas,
archivos de configuración y rutas **es su qué**. Lo que esta spec sigue sin decidir es el cómo:
qué mecanismo implementa cada check, cómo se estructura cada archivo y qué API se usa. Eso vive en
`plan.md`.

**Ya en `main`**: `.github/workflows/ci.yml`, `.lighthouserc.json`, `stryker.config.mjs`,
`scripts/mutation.mjs`, `scripts/new-story.sh`, `.claude/hooks/guard-git.mjs`,
`docs/known-limitations.md`, `docs/` completo, `.claude/`, `.specify/`, `main` protegida. Se usan
y no se rehacen; lo que esta historia sí les cambia está en FR-046 y FR-047. El conflicto de
TypeScript 7 ya está resuelto y registrado en `docs/07-stack.md`: **no se reabre**.

**Vocabulario de esta spec**: **portada provisoria** es la ruta raíz `/` que esta historia crea; no
es la landing (M5) ni el listado (M2), y no es la foto de portada de una ficha, que es lo que
`docs/10` §Componentes llama portada. **Muestra** es la ruta `/muestra`, que existe solo en
desarrollo y exhibe las primitivas.

## User Scenarios & Testing *(mandatory)*

Quien usa esto es **quien construye la plataforma**: Hernán y las etapas del pipeline. El "valor
entregado" de cada user story es una capacidad de construcción que antes no existía y que, desde
que existe, se verifica sola.

### User Story 1 - Un proyecto que arranca y una sola orden que lo valida (Priority: P1)

Hay un proyecto Next.js con TypeScript `strict` en la raíz del repo, con la estructura que
`CLAUDE.md` §Estructura declara, y el nombre de la app vive en un solo lugar. Existen todos los
comandos de `CLAUDE.md` §Comandos con esos nombres exactos, y `pnpm verify` corre las siete etapas
en orden (lint, typecheck, test, mutation, build, e2e, lighthouse), nombrando cada una y cortando
en la primera que falla. La CI corre las mismas siete etapas, sin guarda de arranque y sin que
ninguna se pueda saltear sola.

**Why this priority**: es el piso de todo lo demás. Sin proyecto y sin `pnpm verify` no hay dónde
poner una compuerta, y las etapas Build y Ship del pipeline invocan estos comandos tal cual: si
los nombres no coinciden, ninguna historia posterior corre.

**Independent Test**: en un clon limpio, con el paso de preparación del README hecho,
`pnpm install` y `pnpm verify` terminan en verde nombrando las siete etapas; el PR de esta
historia hace pasar el check `ci` en verde habiendo ejecutado las siete.

**Acceptance Scenarios**:

1. **Given** un clon limpio con la base local levantada y el paso de preparación del README hecho
   (copiar `.env.example` a `.env.local` y completarlo con `supabase status -o env`), **When** se
   corren `pnpm install` y `pnpm verify`, **Then** las siete etapas terminan en verde, la salida
   nombra cada una, y el resumen final dice que no se omitió ningún check.
2. **Given** un clon limpio **sin** base local ni `.env.local`, **When** se corre `pnpm verify`,
   **Then** termina en verde pero su resumen final nombra cada check omitido y por qué, de modo que
   un verde nunca esconda algo sin verificar.
3. **Given** la base local levantada **sin** `.env.local`, **When** se corre `pnpm verify`,
   **Then** falla nombrando la variable que falta y cómo obtenerla, no con un error genérico.
4. **Given** el PR de esta historia, **When** corre CI, **Then** el check `ci` termina en verde
   habiendo **ejecutado** las siete etapas —ninguna omitida, ninguna condicional— y sin el paso que
   detectaba la ausencia de `package.json`.
5. **Given** una etapa que falla, **When** corre `pnpm verify`, **Then** corta ahí, no corre las
   siguientes, y el código de salida es distinto de 0.
6. **Given** que se cambia `APP_NAME` en su único archivo, **When** se recarga la portada
   provisoria, **Then** el nombre nuevo aparece en la pestaña y en la página sin tocar ningún otro
   archivo; **y** `APP_URL` se lee del mismo archivo allí donde la app necesita su URL absoluta.
7. **Given** el scaffold generado en un directorio temporal, **When** se mueve a la raíz,
   **Then** no se pisa ningún archivo que ya existía (`CLAUDE.md`, `README.md`, `.gitignore`,
   `docs/`, `.claude/`, `.github/`, `scripts/`, `stryker.config.mjs`, `.lighthouserc.json`), y lo
   que el generador agrega por defecto queda integrado o descartado con constancia en el PR.
8. **Given** Windows 11 con PowerShell 7, **When** Hernán corre `pnpm verify` **y el driver de
   capturas**, **Then** cada etapa y el driver terminan en verde, igual que en el runner Linux.

---

### User Story 2 - Las reglas del repo son checks, y se los vio fallar (Priority: P2)

Las filas de `docs/09-flujo-de-trabajo.md` §Compuertas mecánicas que se pueden verificar sin
criterio humano existen como checks que corren en `pnpm verify` y en el gancho de pre-commit.
Además, cada regla que esta historia pone tiene una demostración: un ejemplo que la viola y su
versión corregida, y esa demostración corre **dentro de `pnpm verify`**, así que si un cambio de
configuración apaga una regla, la compuerta se pone roja.

**Why this priority**: es el objetivo de la historia (constitución §IV: una regla que vive solo en
prosa se olvida). Va antes que cualquier código de UI para que las reglas existan antes que el
código al que aplican.

**Independent Test**: `pnpm verify` termina en verde sobre el repo con las reglas puestas, y la
demostración hace fallar cada una de las ocho reglas del escenario 1, nombrándola, mientras su
versión corregida pasa.

**Acceptance Scenarios**:

1. **Given** un ejemplo que viola una regla —texto visible literal fuera de `ui/`, hexadecimal en
   un componente, `.from()` fuera de `lib/supabase/queries/`, una primitiva `ui/` que importa de
   un dominio, un componente de dominio que importa el cliente de la base, `"use client"` en
   `page.tsx` o `layout.tsx`, `any` explícito, un test sin aserción, deshabilitado o con `expect`
   condicional—, **When** corre `pnpm verify`, **Then** falla con un mensaje que nombra la regla
   violada, y el ejemplo corregido pasa. Las ocho se demuestran, no solo las dos que el linter no
   trae de fábrica.
2. **Given** el material de demostración versionado en el repo, **When** corre `pnpm verify`
   normalmente, **Then** termina en verde: ese material no lo ve el linter, ni el chequeo de
   tipos, ni el de formato, ni el descubrimiento de pruebas, ni el alcance de mutation.
3. **Given** un componente de más de 150 líneas, **When** corre lint, **Then** aparece una
   advertencia y la compuerta **no** falla.
4. **Given** un archivo con test donde sobrevive un mutante, **When** corre `pnpm mutation`,
   **Then** falla por debajo del 100 % nombrando el mutante; anotado en su línea como equivalente
   o como "no compila", con su motivo, pasa.
5. **Given** que todavía no hay archivos con test para mutar ni flujos críticos, **When** corren
   `pnpm mutation` y `pnpm e2e`, **Then** terminan en verde y dicen que no había nada que
   verificar.
6. **Given** un cambio con una falla de lint, tipos o pruebas, **When** se intenta commitear,
   **Then** el commit no se crea y se ve qué falló.
7. **Given** un archivo mal formateado, **When** se intenta commitear, **Then** el gancho lo
   formatea, lo deja en el commit y el commit se crea; **y dado** ese mismo archivo mal formateado
   llegando a CI —como llega cuando el commit se hizo sin el gancho instalado: un clon recién
   hecho, la interfaz web de GitHub, o un commit de Renovate—, **cuando** corre `pnpm lint`,
   **entonces** falla por formato sin modificarlo.
8. **Given** el repo, **When** se valida la configuración de Renovate con su validador oficial,
   **Then** pasa, y esa validación corre dentro de la etapa `lint`.
9. **Given** código con una promesa sin manejar, **When** corre `pnpm lint`, **Then** falla
   nombrando la regla, porque el lint con tipos está activo.
10. **Given** la clave de servicio de la base, **When** corre `pnpm verify`, **Then** un check
    confirma que no está expuesta al cliente ni versionada, y falla nombrándola si lo está.

---

### User Story 3 - Base local y arnés para probar privacidad (Priority: P3)

La base local existe y se resetea, los tipos se generan desde ella y su deriva se detecta, y hay
un arnés con el que una prueba puede actuar como visitante anónimo, como una persona con sesión, o
con permisos de servicio. Sin base local, lo que depende de ella se omite con un aviso visible en
la máquina; en CI, sin base, falla.

**Why this priority**: toda regla de privacidad del MVP se prueba contra la base (constitución §V).
El arnés tiene que existir antes de la primera tabla, que llega en M1.

**Independent Test**: con `supabase start`, `supabase db reset` y `pnpm db:types` terminan sin
error y la prueba de ejemplo del arnés confirma la identidad de cada rol; sin la base, `pnpm test`
omite lo que la necesita con aviso y el resto corre.

**Acceptance Scenarios**:

1. **Given** `supabase start`, **When** corren `supabase db reset` y `pnpm db:types`, **Then**
   terminan sin error.
2. **Given** los tipos versionados y la base local, **When** corre `pnpm verify`, **Then** un
   check regenera los tipos y falla si difieren de los versionados, nombrando la diferencia.
3. **Given** la base local, **When** corre la prueba de ejemplo del arnés de privacidad, **Then**
   confirma la identidad de cada rol —sin sesión, la persona creada para la prueba, servicio— y
   borra lo que creó. Esa prueba es lo que salda la fila «Privacidad de contacto e identidad» en
   esta historia: las pruebas de RLS por regla llegan con las historias que crean esas reglas.
4. **Given** la máquina sin base local, **When** corre `pnpm test`, **Then** las pruebas de
   privacidad **y el check de deriva de tipos** se omiten con un aviso visible, el resto corre, y
   el resumen final los nombra.
5. **Given** CI sin base local, **When** corre `pnpm test`, **Then** esos mismos checks fallan
   diciendo que falta la base; nunca se saltean en silencio.
6. **Given** la base local levantada y una variable de entorno que falta, **When** arranca la
   prueba o la app que la necesita, **Then** falla con un mensaje que nombra la variable y cómo
   obtenerla (`supabase status -o env`).
7. **Given** la base local recién reseteada, **When** se la inspecciona, **Then** no tiene ninguna
   tabla propia del producto ni ninguna persona sembrada: las que hay son las que crea Supabase.

---

### User Story 4 - El sistema de diseño y el idioma existen como código (Priority: P4)

Todos los tokens que nombra `docs/10-design-system.md` §Tokens viven en la hoja de estilos global
y son la única fuente de color, tipografía, espacio, radio, elevación y movimiento. Bricolage
Grotesque se sirve desde el propio sitio. Los textos visibles viven en `messages/es.json`, con
español como único idioma y sin prefijo en la URL. Las once primitivas `ui/` de la tabla de
`docs/10` existen con sus variantes y estados.

**Why this priority**: es la base visual que consume cualquier pantalla, incluida la portada de
US5, y la que `design-reviewer` califica desde la primera historia de producto.

**Independent Test**: se recorre la muestra y están las once primitivas con cada variante y estado
de la tabla; ningún texto visible ni valor de diseño aparece fuera de `messages/es.json` y de los
tokens, lo que verifican los checks de US2.

**Acceptance Scenarios**:

1. **Given** la muestra, **When** se la recorre con mouse y teclado, **Then** están las once
   primitivas (Button, Input, Textarea, Select, Chip, Card, Sheet, Dialog, Toast, Skeleton,
   EmptyState) con cada variante y estado de la tabla de `docs/10`, y cada elemento interactivo
   responde a hover, foco (anillo de 2 px con 2 px de separación) y presión en 100 a 250 ms.
2. **Given** `prefers-reduced-motion: reduce`, **When** se usa la muestra, **Then** las
   transiciones duran 0 ms y el shimmer del `Skeleton` queda quieto.
3. **Given** la muestra recorrida con teclado, **When** se tabula por sus elementos, **Then** cada
   uno muestra un anillo de foco visible y ninguno queda inalcanzable; los objetivos táctiles miden
   al menos 44 px.
4. **Given** los tokens versionados, **When** se los compara con `docs/10` §Tokens, **Then**
   existe un token por cada uno que ese documento nombra —en sus tablas y en sus listas— con el
   mismo nombre y el mismo valor, y ninguno de más.
5. **Given** un valor de color, tipografía, espacio, radio, sombra o duración usado en la muestra o
   en la portada provisoria, **When** se lo busca en el código, **Then** viene de un token, no de
   un literal.
6. **Given** la portada provisoria y la muestra, **When** se las carga, **Then** el texto se ve en
   Bricolage Grotesque servida desde el propio sitio, sin ningún pedido a un dominio de terceros y
   sin que la tipografía cambie después del primer render.
7. **Given** una clave de texto que no existe en `messages/es.json`, **When** corre la etapa
   `typecheck`, **Then** falla nombrando la clave, porque las claves están tipadas desde ese
   archivo; el problema nunca llega a la pantalla como texto crudo.
8. **Given** las primitivas que necesitan un nombre accesible (`Dialog`, `Sheet`, `Toast`),
   **When** se las usa, **Then** lo reciben ya traducido por props desde quien las llama, y no lo
   resuelven por su cuenta.

---

### User Story 5 - Se puede ver la app y capturarla (Priority: P5)

Hay una portada provisoria en `/` y una muestra en `/muestra` que solo existe en desarrollo, y
existe `scripts/walk.mjs`, el driver de capturas, cumpliendo la parte del contrato de
`.claude/skills/run-app/SKILL.md` que esta historia puede cumplir: visitante anónimo contra el
servidor de desarrollo.

**Why this priority**: sin driver no hay capturas, y sin capturas `design-reviewer` no puede
calificar ninguna historia de UI. Va después de US4 porque captura lo que US4 construye.

**Independent Test**: con la app levantada en desarrollo,
`node scripts/walk.mjs --story scaffold-y-compuertas / /muestra` deja las capturas esperadas en
`.artifacts/scaffold-y-compuertas/`, imprime una línea por ruta y termina con código 0; con la app
caída, termina con código 2 sin abrir un navegador.

**Acceptance Scenarios**:

1. **Given** `pnpm dev`, **When** se abre `/` a 390 px, **Then** se ven el valor de `APP_NAME` y
   una frase de `messages/es.json`, en Bricolage Grotesque y con los colores de los tokens, sin
   errores en la consola.
2. **Given** la app levantada con `pnpm dev`, **When** corre
   `node scripts/walk.mjs --story scaffold-y-compuertas / /muestra`, **Then** quedan en
   `.artifacts/scaffold-y-compuertas/` `home.png` y `muestra.png` a 390 × 844, más
   `muestra.hover.png`, se imprime una línea por ruta con su primer título, se imprimen al final
   las rutas de los archivos, y el driver termina con código 0.
3. **Given** la portada provisoria, que no tiene ningún elemento interactivo, **When** el driver la
   recorre, **Then** lo dice en su línea y no produce `home.hover.png`, sin fallar por eso.
4. **Given** el driver con `--desktop`, **When** corre, **Then** agrega capturas de 1280 × 800 al
   lado de las de 390 px.
5. **Given** el driver con `--headed`, **When** corre, **Then** abre el navegador a la vista.
6. **Given** el driver sin rutas, **When** corre, **Then** recorre solo `/`.
7. **Given** una corrida anterior con capturas en `.artifacts/scaffold-y-compuertas/`, **When**
   corre el driver de nuevo, **Then** limpia esa carpeta antes de empezar, así nadie revisa una
   captura vieja creyéndola nueva.
8. **Given** que la app no está levantada, **When** corre el driver, **Then** termina con código 2
   antes de abrir un navegador y dice qué levantar.
9. **Given** una ruta con un error de consola, un error de página o un pedido fallido que no esté
   en la lista permitida, **When** el driver la recorre, **Then** termina con código 1, nombrando
   la ruta y el error.
10. **Given** el driver sin `--story`, con un slug inválido, o con `--user`, **When** corre,
    **Then** termina con código 3 diciendo qué falta o por qué no se puede: en el caso de `--user`,
    que esa opción llega con la historia de registro e ingreso. Nunca recorre como anónimo en
    silencio.
11. **Given** el build de producción, **When** se pide `/muestra`, **Then** responde "no
    encontrada".
12. **Given** el build de producción, **When** corre `pnpm lighthouse` sobre `/`, **Then** pasa el
    presupuesto mobile: performance y accesibilidad ≥ 90, LCP < 2 s, JS inicial < 150 KB.
13. **Given** un build que supera el presupuesto, **When** corre `pnpm lighthouse`, **Then** falla
    nombrando la métrica que se pasó.

---

### User Story 6 - Queda registrado qué se instaló y cómo se corre (Priority: P6)

Cada dependencia que entra tiene una línea fechada en `docs/07-stack.md`; el README lista las
versiones instaladas con la fecha en que se verificaron y el paso de preparación del entorno; la
sección «Verified» de `.claude/skills/run-app/SKILL.md` deja los comandos, puertos y trampas
realmente observados en Windows 11 / PowerShell 7, y el contrato de ese archivo dice qué parte
cumple F00 y qué parte llega después; y `CLAUDE.md` queda al día.

**Why this priority**: es lo que evita que la próxima corrida —o la próxima persona— tenga que
redescubrir el entorno. Va última porque registra lo que las anteriores decidieron.

**Independent Test**: se leen esos lugares y describen lo que el repo tiene realmente: cada
dependencia del `package.json` aparece en `docs/07-stack.md` con fecha, los comandos de «Verified»
corren tal como están escritos, y cada registro que FR-046 pide existe.

**Acceptance Scenarios**:

1. **Given** el `package.json` final, **When** se compara con `docs/07-stack.md`, **Then** cada
   dependencia nueva tiene su línea con fecha y motivo, y no hay líneas de dependencias que no
   estén instaladas.
2. **Given** el README, **When** se lo lee, **Then** lista cada versión instalada con la fecha en
   que se verificó, y cómo levantar el proyecto de cero, incluido el paso de preparación del
   entorno.
3. **Given** la sección «Verified» de `run-app/SKILL.md`, **When** se corren sus comandos tal cual
   en Windows 11 / PowerShell 7, **Then** funcionan, con los puertos y las trampas que indica.
4. **Given** el contrato del driver en `run-app/SKILL.md`, **When** se lo lee después de esta
   historia, **Then** cada parte que F00 no implementó (ingreso con persona sembrada, rutas
   derivadas de la navegación, estado vacío con `--user`) está marcada como pendiente con la
   historia que la trae, y ninguna describe un comportamiento que no existe.
5. **Given** `docs/09` §Compuertas mecánicas, `docs/07-stack.md` y `docs/known-limitations.md`,
   **When** se los lee después de esta historia, **Then** están la fila de la clave de servicio, la
   segunda categoría de anotación de mutantes, la línea fechada de por qué Stryker corre sin
   verificador de tipos, y la limitación conocida con su detección y su condición de reapertura.
6. **Given** `CLAUDE.md`, **When** se lo lee después de esta historia, **Then** §Estado dice que
   F00 está construido y cuál es el próximo paso, y §Estructura refleja la estructura real,
   sin contradecir el resto del archivo.
7. **Given** que la app de Renovate todavía no está instalada en GitHub, **When** se lee el PR,
   **Then** ese paso manual queda listado para Hernán.

---

### Edge Cases

- **Una herramienta que no soporta la última versión de otra.** La corrida no baja una versión en
  silencio: busca alternativa a la herramienta, y si la salida cambia una pieza de
  `docs/07-stack.md`, le pregunta a Hernán y registra la decisión con fecha. El caso de
  TypeScript 7 ya está resuelto y no se reabre; el de Stryker sin verificador de tipos se resolvió
  en esta corrida (ver Assumptions).
- **El directorio de destino no está vacío.** El generador corre en un directorio temporal y lo
  generado se mueve, verificando que no pise nada.
- **Una etapa sin nada que verificar todavía.** `pnpm mutation` sin archivos con test y `pnpm e2e`
  sin flujos críticos pasan diciendo por qué, no se saltean en silencio.
- **Un check que necesita la base local y no la tiene.** Se omite con aviso en la máquina, falla en
  CI, y el resumen final de `pnpm verify` lo nombra: un verde nunca esconde algo sin verificar.
- **La máquina y CI difieren.** Misma versión mayor de Node y las mismas de pnpm y Supabase CLI en
  los dos lados; los comandos y el driver se comportan igual en Windows 11 / PowerShell 7 y en el
  runner Linux.
- **Un mutante que sobrevive.** Si es equivalente, o si no compila, se anota en su línea con el
  motivo y su categoría; nunca se baja el umbral.
- **Una regla apagada por un cambio de configuración.** La demostración corre dentro de
  `pnpm verify`, así que apagar la regla pone la compuerta roja.
- **El material de demostración es código roto a propósito.** Queda fuera del linter, del chequeo
  de tipos, del de formato, del descubrimiento de pruebas y del alcance de mutation.
- **Una ruta sin elementos interactivos.** El driver lo dice y no produce su captura de hover, sin
  fallar.
- **La muestra en producción.** No existe: responde "no encontrada". Por eso el driver corre contra
  el servidor de desarrollo, y `pnpm e2e` y `pnpm lighthouse` contra `next start`.
- **`prefers-reduced-motion`.** Las duraciones quedan en 0 y el shimmer se detiene.
- **Las páginas de error y de "no encontrada"** siguen siendo las de Next.js hasta M5: esta
  historia no las diseña, y como ninguna ruta carga datos, tampoco crea estados de carga ni de
  error propios.

## Requirements *(mandatory)*

### Functional Requirements

**Proyecto y comandos (US1)**

- **FR-001**: El repo MUST contener un proyecto Next.js con App Router y TypeScript en modo
  `strict`, gestionado con pnpm, con la estructura de `CLAUDE.md` §Estructura. Las rutas MUST
  vivir bajo un segmento de idioma (`src/app/[locale]/`), con español sin prefijo en la URL, que
  es lo que piden juntos `docs/07` §Estructura y `docs/06` §URLs. Los archivos `loading.tsx` y
  `error.tsx` que la estructura nombra MUST no crearse en esta historia: ninguna ruta carga datos.
  Tampoco MUST crearse los grupos de ruta `(public)`, `(auth)` y `(app)` que `docs/07` §Estructura
  declara: llegan con las historias que los necesitan, y su ausencia MUST no tratarse como una
  divergencia que haya que podar del contrato.
- **FR-002**: El nombre y la URL de la app MUST vivir en una sola constante cada uno
  (`APP_NAME`, `APP_URL`) en `src/lib/config.ts`; ningún otro archivo MUST repetir el nombre, y
  todo lo que necesite la URL absoluta MUST leerla de ahí.
- **FR-003**: MUST existir cada comando de `CLAUDE.md` §Comandos con ese nombre exacto: `dev`,
  `lint`, `typecheck`, `test`, `mutation`, `mutation:all`, `build`, `start`, `e2e`, `lighthouse`,
  `verify`, `db:types`.
- **FR-004**: `pnpm verify` MUST correr **siete** etapas con esos nombres, en ese orden —lint,
  typecheck, test, mutation, build, e2e, lighthouse—, nombrar cada una en la salida, y cortar en
  la primera que falla con código distinto de 0. Los checks que esta spec ubica "dentro de
  `pnpm verify`" MUST vivir dentro de una de esas siete, no como etapas nuevas: la validación de
  Renovate (FR-018) y el check de la clave de servicio (FR-023) dentro de `lint`; la demostración
  de las reglas (FR-013) y el check de deriva de tipos (FR-021) dentro de `test`.
- **FR-005**: `pnpm verify` MUST terminar con un resumen que nombre cada check omitido y su
  motivo, o que diga que no se omitió ninguno.
- **FR-006**: La CI MUST correr las mismas siete etapas, en el mismo orden, con los mismos
  umbrales, un paso por etapa, y MUST no tener ningún paso condicional que pueda saltearse. Dos
  diferencias MUST no contar como falta de paridad, porque son la misma compuerta con el dato que
  CI conoce: que CI le pase explícitamente la rama base a `pnpm mutation` (que en la máquina usa
  `main` por defecto), y que en un push a `main` corra `pnpm mutation:all`, que es el alcance que
  `docs/09` asigna a `main`.
- **FR-007**: El scaffold MUST generarse en un directorio temporal y moverse a la raíz sin pisar
  ningún archivo preexistente; lo que el generador agregue por defecto MUST quedar integrado o
  descartado de forma explícita.
- **FR-008**: Los comandos y el driver MUST comportarse igual en Windows 11 / PowerShell 7 y en el
  runner Linux de CI, con la misma versión mayor de Node y las mismas versiones de pnpm y Supabase
  CLI fijadas en los dos lados.
- **FR-009**: MUST existir un `.env.example` versionado que liste cada variable que el proyecto
  necesita, con cómo obtenerla, y el README MUST describir el paso de preparación que la corrida
  completa requiere en un clon limpio.

**Compuertas (US2)**

- **FR-010**: Las **14** filas de `docs/09` §Compuertas mecánicas cuya columna *Dónde corre*
  incluye pre-commit, CI o local MUST existir como checks que corren en `pnpm verify` y en CI, más
  la fila que FR-023 agrega en este mismo PR: **15 al mergear**. Las **3** restantes MUST no
  convertirse en etapas de `pnpm verify`, porque ya corren en otro lado y esta historia no las
  toca: «Diseño según `10-design-system.md`» corre en la etapa Review vía `design-reviewer`;
  «Últimas versiones» corre como PRs automáticos de Renovate; «No force push, no `--no-verify`, no
  push directo a `main`» corre en la sesión y en GitHub vía `.claude/hooks/guard-git.mjs` y la
  protección de rama.
- **FR-011**: El lint MUST cubrir TypeScript, React, Next.js, accesibilidad, imports y Vitest, y
  MUST incluir lint con tipos, de modo que una promesa sin manejar falle la compuerta. El lint con
  tipos entra por decisión de Hernán registrada en Assumptions, con su línea fechada en
  `docs/07-stack.md`; no reemplaza una pieza del stack, agrega una capacidad al linter ya decidido.
- **FR-012**: Las reglas que el linter no trae de fábrica —hexadecimal en un componente y
  `"use client"` en `page.tsx` o `layout.tsx`— MUST existir como reglas propias del repo que
  fallan nombrando la regla. El mecanismo lo elige `plan.md`.
- **FR-013**: MUST existir una demostración de **cada una de las ocho reglas** que enumera el
  escenario 1 de US2 —no solo de las dos propias—, con un ejemplo que la viola y su versión
  corregida, corriendo dentro de la etapa `test`. El material de demostración MUST quedar fuera del
  linter, del chequeo de tipos, del chequeo de formato, del descubrimiento de pruebas y del alcance
  de mutation, de modo que `pnpm verify` en una corrida normal termine en verde. La demostración
  MUST correr **la configuración real** del linter y del chequeo de tipos contra ese material, no
  una copia ni un config propio de los ejemplos: con un config aparte, apagar una regla en la
  configuración real dejaría la compuerta verde, que es exactamente lo que esta demostración
  existe para impedir. La forma de ese material y sus exclusiones las elige `plan.md`.
- **FR-014**: El formato MUST verificarse dentro de `pnpm lint`, sin modificar archivos.
- **FR-015**: MUST existir un gancho antes de cada commit que formatee los archivos preparados y
  los deje en el commit, y que corra lint, tipos y pruebas e impida el commit cuando alguno falla.
  Una falla de formato MUST no bloquear el commit —el gancho la arregla—; lo que falla por formato
  es `pnpm lint`, donde nada arregla nada. El gancho MAY acotar el formato y el lint a los archivos
  preparados, para no pagar el repo entero en cada commit; la compuerta completa sigue siendo
  `pnpm verify`.
- **FR-016**: `pnpm mutation` MUST exigir 100 % de mutation score sobre los archivos con test y
  MUST fallar nombrando el mutante sobreviviente. Un mutante MUST poder anotarse en su línea en
  **dos** categorías distinguibles, con su motivo: equivalente, o que no compila.
- **FR-017**: Una etapa sin nada que verificar —`pnpm mutation` sin archivos con test, `pnpm e2e`
  sin flujos críticos— MUST terminar en verde diciendo por qué, nunca saltearse en silencio, ni en
  la máquina ni en CI.
- **FR-018**: Un componente de más de 150 líneas MUST producir una advertencia de lint, sin hacer
  fallar la compuerta. Renovate MUST quedar configurado y su configuración MUST validar con el
  validador oficial dentro de la etapa `lint`. Instalar la app de Renovate en GitHub queda como
  paso manual listado en el PR; el automerge de actualizaciones queda fuera.

**Base local y privacidad (US3)**

- **FR-019**: El Supabase CLI MUST quedar inicializado en el repo, sin ninguna tabla propia del
  producto, con `supabase db reset` funcionando. `supabase/seed.sql` MUST existir como parte de la
  estructura pero MUST no crear ninguna persona.
- **FR-020**: MUST existir el módulo de cliente de la base que `CLAUDE.md` §Estructura declara,
  porque sin él no hay qué restringir en las reglas de importación de FR-010/FR-013 ni con qué
  actuar en el arnés de FR-022, y porque ahí viven los tipos generados. Lo que MUST no entrar es la
  **sesión de la app** con la base: ingreso, cookies de sesión y personas sembradas llegan con la
  historia de registro e ingreso.
- **FR-021**: `pnpm db:types` MUST regenerar los tipos desde la base local, y un check dentro de
  la etapa `test` MUST fallar cuando los tipos versionados difieren de los que genera. Ese check
  MUST seguir la misma regla que las pruebas de privacidad: sin base local se omite con aviso en la
  máquina y falla en CI.
- **FR-022**: MUST existir un arnés de pruebas de privacidad con el que una prueba pueda actuar
  como visitante anónimo, como una persona sintética con sesión creada para la prueba, o con
  permisos de servicio, y MUST borrar lo que creó al terminar **incluso cuando la prueba falla a
  mitad**, para no dejar una persona sintética sembrada. La identidad de cada rol MUST confirmarse
  preguntándole a la base quién es la sesión actual, que no necesita ninguna tabla propia. El arnés
  MUST no crear ninguna tabla del producto; si necesitara algún objeto de base que no es de
  producto, MUST quedar registrado en el PR, porque M1 lo hereda. Su prueba de ejemplo MUST ser lo
  que salda la fila «Privacidad de contacto e identidad» en esta historia, porque todavía no hay
  reglas de RLS propias que probar.
- **FR-023**: La clave de servicio de la base MUST no llegar nunca al cliente: MUST no vivir bajo
  un nombre expuesto al browser (`NEXT_PUBLIC_*`), MUST no quedar versionada, y un check dentro de
  la etapa `lint` MUST fallar nombrándola si alguna de esas dos cosas pasa. Esta fila MUST
  agregarse a `docs/09` §Compuertas mecánicas en este PR: es la única historia cuyo trabajo es
  crear las reglas antes del código, y M5 hereda el patrón que quede acá.
- **FR-024**: Sin base local, los checks que la necesitan MUST omitirse con un aviso visible y el
  resto de `pnpm test` MUST correr; en CI sin base, MUST fallar diciendo que falta la base.
- **FR-025**: Con la base local presente, una variable de entorno faltante MUST producir un error
  que nombre la variable y diga cómo obtenerla (`supabase status -o env`). La precedencia MUST ser
  esa: falta el entorno entero (sin base, sin `.env.local`) es una omisión con aviso en la máquina
  y una falla en CI; está el entorno pero falta o está mal una variable, es una falla en los dos
  lados.

**Diseño e idioma (US4)**

- **FR-026**: MUST existir en la hoja de estilos global un token por cada uno que `docs/10`
  §Tokens nombra, con el mismo nombre y valor, y ninguno de más. Son **42**: 13 de color, 7 de la
  escala tipográfica y 5 de movimiento (las tres tablas), más los de sus listas: 10 de espacio
  (`--space-1` a `--space-16`), 4 de radio, 2 de sombra y `--measure`. Cada uno de los 7
  tipográficos MUST llevar el tamaño **y la interlínea** que su fila pareja (`13 / 1.4`); cómo se
  codifica ese par —un token con dos valores, o un token de tamaño con su token de interlínea— lo
  elige `plan.md`, y la paridad MUST verificarse sobre los dos valores, no solo el tamaño; la
  interlínea MUST viajar como modificador del mismo token, no como un nombre nuevo, para que el
  conteo siga siendo el de `docs/10`. MUST existir además, con nombre declarado, lo que esa sección
  fija en prosa y FR-027 declara gobernado por tokens: `--font-sans` (la familia),
  `--font-weight-regular` 400, `--font-weight-medium` 500, `--font-weight-bold` 700, y
  `--tracking-tight` para `--text-xl` y mayores. Son **47** nombres en total: el conteo de la
  compuerta MUST ser ese, no "42 más los que haga falta".
  **Enmienda (2026-09-18):** al ver las primitivas, Hernán eligió la identidad «Cartel» y
  `docs/10` cambió primero, como manda su §Cómo se aplica. El doc nombra ahora **57** tokens. Con
  la identidad fueron 53 (sale `--radius-pill`; entran `--radius-stamp`, `--font-weight-black`,
  `--tracking-afiche`, `--stretch-afiche`, `--tilt`, `--color-tape` y `--text-4xl`) y la escala
  tipográfica tiene 8 pasos. La revisión de diseño sumó `--shadow-tape`, `--tilt-torn`,
  `--tilt-stamp` y `--dur-shimmer`, para que las utilidades del cartel no lleven valores sueltos. La regla no cambia: los nombres y valores son exactamente los del doc, y la compuerta
  de paridad lee el doc en lugar de llevar un número fijo.
- **FR-027**: Los tokens MUST ser la única fuente de color, tipografía, espacio, radio, elevación y
  movimiento. Un valor de cualquiera de esas seis familias MUST no aparecer como literal en un
  componente. Los breakpoints (390, 640, 768, 1024), el gutter de página (16 y 24) y los anchos de
  página (1024 y 1200) que `docs/10` nombra sin token MUST vivir como valores con nombre en la
  configuración del tema, no como tokens ni como literales sueltos en componentes; MUST no contar
  como violación de este requisito ni como tokens faltantes de FR-026.
- **FR-028**: Bricolage Grotesque MUST servirse desde el propio sitio, sin ningún pedido a un
  dominio de terceros, y MUST precargarse de modo que el intercambio de tipografía no desplace el
  layout. Lo observable MUST ser eso —cero pedidos a terceros en las capturas del driver, y la
  contribución del intercambio al CLS dentro del presupuesto (< 0,05) medida por
  `pnpm lighthouse`—, y MUST no exigirse "que la tipografía no cambie nunca", que contradiría el
  `display: swap` que `docs/10` §Tipografía fija.
- **FR-029**: Todos los textos visibles MUST vivir en `messages/es.json` bajo claves semánticas
  por namespace; español MUST ser el único idioma y MUST no llevar prefijo en la URL; MUST no
  haber selector de idioma. Las claves MUST estar tipadas desde ese archivo, de modo que una clave
  inexistente falle la etapa `typecheck`. En esta historia el archivo MUST contener solo los textos
  que esta historia muestra —la portada provisoria, las etiquetas de la muestra y el namespace
  `common`—: MUST no entrar copy de producto.
- **FR-030**: MUST existir las once primitivas `ui/` de la tabla de `docs/10` §Componentes
  (Button, Input, Textarea, Select, Chip, Card, Sheet, Dialog, Toast, Skeleton, EmptyState) con
  las variantes y estados que esa tabla declara.
- **FR-031**: Cada primitiva interactiva MUST responder a hover, foco y presión en 100 a 250 ms,
  con anillo de foco de 2 px separado 2 px, objetivos táctiles de al menos 44 px y contraste AA.
  Lo que de esto se puede verificar sobre el código MUST verificarlo el plugin de accesibilidad
  del linter; el resto lo califica `design-reviewer` sobre las capturas, que es lo que `docs/09`
  §Compuertas mecánicas asigna a la conformidad de diseño. La muestra existe, y el driver la
  captura, precisamente para que esa revisión tenga qué mirar.
- **FR-032**: Con `prefers-reduced-motion: reduce`, las duraciones MUST quedar en 0 ms y el
  shimmer del `Skeleton` MUST detenerse.
- **FR-033**: Las primitivas `ui/` MUST no traducir ni conocer el dominio. MUST recibir por props,
  ya traducido, todo texto visible y todo nombre accesible, incluidos los de `Dialog`, `Sheet` y
  `Toast`; quien las llama los toma de `messages/es.json`.

**Pantallas y capturas (US5)**

- **FR-034**: MUST existir una portada provisoria en `/` que muestre el valor de `APP_NAME` y una
  frase desde `messages/es.json`. MUST no cargar datos, así que MUST no tener estados de carga,
  vacío ni error propios.
- **FR-035**: MUST existir una muestra en `/muestra` que exista solo en desarrollo y responda "no
  encontrada" en el build de producción. MUST no cargar datos: el `Skeleton` y el `EmptyState`
  aparecen ahí como ejemplos estáticos de sus propios estados, no como estados de la pantalla.
- **FR-036**: MUST existir `scripts/walk.mjs`, que MUST correr contra el servidor de desarrollo
  (`pnpm dev`), porque la muestra no existe en el build de producción, y MUST cumplir el contrato
  de `.claude/skills/run-app/SKILL.md` para visitante anónimo: captura de página completa a
  390 × 844 por ruta; una captura con hover y foco del primer elemento interactivo por ruta que
  tenga uno, informando y omitiéndola en las rutas que no; `--desktop` agrega 1280 × 800;
  `--headed` abre el navegador a la vista; sin rutas recorre solo `/`; imprime una línea por ruta
  con su primer título y, al final, las rutas de los archivos; limpia `.artifacts/<slug>/` antes de
  empezar.
- **FR-037**: El nombre de archivo de cada captura MUST derivarse de la ruta de una sola forma
  declarada: sin la barra inicial, las barras internas como guiones, y la raíz como `home`; de ahí
  `home.png`, `muestra.png` y sus variantes `.hover.png`, y con `--desktop` las mismas con sufijo
  `.desktop.png` y `.desktop.hover.png`. Quien revisa el diseño consume esos nombres, así que
  ninguno MUST quedar sin declarar.
- **FR-038**: Los códigos de salida del driver MUST distinguir cada caso: **0** todo bien; **1**
  una ruta falló por error de consola, error de página o pedido fallido fuera de la lista
  permitida, nombrando la ruta y el error; **2** la app no está levantada, detectado antes de abrir
  un navegador y diciendo qué levantar; **3** la invocación no es válida para este milestone —sin
  `--story`, slug inválido, o `--user`, que llega con la historia de registro e ingreso—.
- **FR-039**: La lista permitida de pedidos fallidos MUST estar declarada en un solo lugar y MUST
  estar **vacía** en esta historia: no hay ningún pedido de la aplicación que falle legítimamente
  todavía, y el ejemplo que el contrato menciona (el 401 del ingreso) llega con la historia de
  registro e ingreso. Aparte de esa lista, y declarado en el mismo lugar, el driver MUST ignorar el
  tráfico y los avisos propios del servidor de desarrollo contra el que corre —recarga en caliente,
  su websocket, mapas de fuentes, avisos de herramientas de desarrollo—: sin eso, correr contra
  `pnpm dev` daría código 1 por ruido que no es un error de la pantalla.
- **FR-040**: La lógica pura del driver —interpretación de argumentos, de ruta a nombre de archivo
  y coincidencia contra la lista permitida— MUST tener pruebas: son transformaciones con casos
  borde, y un driver roto muestra pantallas equivocadas a quien revisa el diseño. Viven fuera de
  `src/`, así que quedan fuera del alcance de mutation que fija `stryker.config.mjs`.
- **FR-041**: `pnpm lighthouse` MUST medir el build de producción local con el preset mobile que
  fija `.lighthouserc.json`, contra el presupuesto —performance y accesibilidad ≥ 90, LCP < 2 s,
  JS inicial < 150 KB, CLS < 0,05— y fallar nombrando la métrica que se pasó. `.lighthouserc.json`
  hoy no tiene aserción de CLS, así que MUST agregarse en este PR: sin ella, el CLS que FR-028
  declara observable no lo mide nada. Es el único cambio autorizado a ese archivo.

**Datos personales**

- **FR-042**: Esta historia MUST no guardar ningún dato de ninguna persona real. La base local
  queda sin tablas propias y sin personas sembradas; las personas que crea el arnés de privacidad
  MUST ser sintéticas y MUST borrarse al terminar cada prueba.
- **FR-043**: Todo lo que la corrida produce y podría contener datos —capturas en `.artifacts/`,
  reportes de mutation y de Lighthouse, resultados de Playwright— MUST quedar ignorado por git.

**Registro (US6)**

- **FR-044**: Cada dependencia nueva MUST tener una línea fechada en `docs/07-stack.md`, en este
  mismo PR, y MUST no haber líneas de dependencias que no estén instaladas.
- **FR-045**: El README MUST listar las versiones instaladas con la fecha en que se verificaron,
  cómo levantar el proyecto de cero y el paso de preparación del entorno.
- **FR-046**: MUST quedar al día, en este PR: la sección «Verified» de
  `.claude/skills/run-app/SKILL.md` con los comandos, puertos y trampas observados en Windows 11 /
  PowerShell 7; el contrato del driver en ese mismo archivo, marcando qué parte cumple F00 y con
  qué historia llega cada parte pendiente; `CLAUDE.md` §Estado, y §Estructura **solo donde difiera
  de lo que F00 creó realmente**: las entradas de lo que crean historias posteriores
  (`loading.tsx`, `error.tsx`, `actions/`, `lib/schemas/`, los grupos de ruta) MUST quedar en el
  contrato, marcadas como pendientes si hace falta, y MUST no podarse, porque M1 las usa tal cual;
  `docs/09` §Compuertas
  mecánicas con la fila de FR-023 y con la segunda categoría de anotación de FR-016;
  `docs/07-stack.md` con la línea fechada de por qué Stryker corre sin verificador de tipos y qué
  cuesta; y `docs/known-limitations.md` con esa limitación, su detección y su condición de
  reapertura.
- **FR-047**: `.github/workflows/ci.yml` MUST cambiar solo lo que las reglas de esta historia
  piden: sacar la guarda de arranque de `package.json` **y las catorce condiciones que dependen de
  ella** —doce `if: steps.project.outputs.exists == 'true'` y dos combinadas con `always()`—,
  porque dejarlas sin su paso saltearía cada etapa y el check reportaría verde sin verificar nada
  (los dos pasos con `always()` deben conservar su `always()`); correr `pnpm lighthouse` en
  lugar de la acción de Lighthouse, para que CI corra la misma etapa que la máquina; sacar la
  condición `if [ -f playwright.config.ts ]` con su salteo silencioso, que FR-017 prohíbe y que
  deja de hacer falta porque el archivo existe; y fijar la versión del Supabase CLI en lugar de
  `latest`, que es lo que FR-008 pide.

**Transversales**

- **FR-048**: Toda tecnología que entre MUST entrar en su última versión estable verificada el día
  de la construcción. Cuando una versión anotada en Assumptions difiera de la última estable ese
  día, **gana la del día**, y la línea de `docs/07-stack.md` registra la que entró. Si una
  herramienta no soporta la última de otra, MUST buscarse alternativa a la herramienta antes que
  bajar la otra; si la salida cambia una pieza de `docs/07-stack.md`, MUST decidirlo Hernán y
  quedar registrado con fecha.
- **FR-049**: MUST no entrar nada de producto: ni cuentas, ingreso, perfiles, animales,
  solicitudes, tablas propias, personas sembradas, la sesión de la app con la base, componentes de
  dominio, flujos críticos de e2e, páginas de error o de "no encontrada" diseñadas, landing, SEO,
  Vercel, proyecto cloud de Supabase, variables remotas, segundo idioma, selector de idioma ni modo
  oscuro. MUST no entrar ninguna de las dependencias que la historia deja para después —email,
  OTP, analítica, errores, Motion, formularios— ni ninguna otra que esta historia no use.
- **FR-050**: MUST no modificarse el flujo de trabajo (`.claude/` salvo `run-app/SKILL.md` según
  FR-046, `.specify/`, `.claude/hooks/guard-git.mjs`, la protección de `main`) ni
  `stryker.config.mjs` o `scripts/mutation.mjs` más allá de lo que FR-016 pide, ni
  `.lighthouserc.json` más allá de la aserción de CLS que FR-041 pide, ni `ci.yml` más allá de los
  cuatro cambios de FR-047.

### Key Entities

Esta historia no modela datos del producto. Las entidades que crea son de construcción:

- **Etapa de verificación**: una de las siete, con su nombre, su orden dentro de `pnpm verify` y su
  código de salida. Idénticas en la máquina y en CI.
- **Regla del repo**: una fila de `docs/09` §Compuertas mecánicas, con la herramienta que la
  verifica, dónde corre, y su par de ejemplos violado/corregido.
- **Token de diseño**: un nombre y un valor, uno por cada token que `docs/10` §Tokens nombra, con
  un solo lugar donde cambiar.
- **Primitiva `ui/`**: un componente sin dominio ni idioma, con sus variantes y estados declarados
  en la tabla de `docs/10` §Componentes, que recibe todo texto y nombre accesible por props.
- **Rol del arnés de privacidad**: visitante anónimo, persona sintética con sesión creada para la
  prueba, o permisos de servicio.
- **Captura**: un PNG por ruta y tamaño en `.artifacts/<slug>/`, nombrado según FR-037, con su
  variante de hover cuando la ruta tiene un elemento interactivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En un clon limpio con la base local levantada y el paso de preparación del README
  hecho, `pnpm install` seguido de `pnpm verify` termina en verde nombrando las siete etapas y
  diciendo que no omitió ningún check, en Windows 11 / PowerShell 7 y en el runner Linux; y el
  driver corre en verde en los dos lados.
- **SC-002**: En un clon limpio sin base ni `.env.local`, `pnpm verify` termina en verde y su
  resumen nombra cada check omitido con su motivo; con la base levantada y sin `.env.local`, falla
  nombrando la variable que falta y cómo obtenerla.
- **SC-003**: El check `ci` del PR de esta historia termina en verde **habiendo ejecutado las siete
  etapas**: su registro no muestra ningún paso omitido, ninguna condición de existencia de archivo
  y ninguna guarda de arranque.
- **SC-004**: Las 14 filas mecanizables de `docs/09` §Compuertas tienen su check en `pnpm verify`,
  más la que este PR agrega, 15 al mergear; las 3 restantes están nombradas con dónde corren y no
  se convirtieron en etapas. Las ocho reglas del escenario 1 de US2 tienen su par de ejemplos
  violado/corregido corriendo dentro de la etapa `test`, y una corrida normal de `pnpm verify`
  queda en verde con ese material en el repo.
- **SC-005**: Los tokens versionados coinciden uno a uno con los nombres que fija FR-026 (47 al
  planificar, **57** tras la enmienda de identidad del 2026-09-18 y su revisión)
  —los 42 que `docs/10` §Tokens nombra entre tablas y listas, más `--font-sans`, los tres pesos y
  `--tracking-tight`—: mismo nombre y mismo valor, con tamaño **e interlínea** en los siete
  tipográficos, ninguno de más ni de menos; y los breakpoints, el gutter y los anchos de página
  viven con nombre en la configuración del tema.
- **SC-006**: Las once primitivas `ui/` existen con todas las variantes y estados de la tabla de
  `docs/10`, recorribles con mouse y con teclado, y ninguna resuelve por su cuenta un texto o un
  nombre accesible: todos llegan por props ya traducidos.
- **SC-007**: La portada provisoria, medida sobre el build de producción local con el preset
  mobile, cumple el presupuesto: performance ≥ 90, accesibilidad ≥ 90, LCP < 2 s, JS inicial
  < 150 KB.
- **SC-008**: `node scripts/walk.mjs --story scaffold-y-compuertas / /muestra` contra `pnpm dev`
  deja en `.artifacts/scaffold-y-compuertas/` exactamente `home.png`, `muestra.png` y
  `muestra.hover.png` a 390 × 844, imprime una línea por ruta y las rutas de los archivos, y
  termina con código 0; y sus cuatro códigos de salida (0, 1, 2, 3) se observan cada uno en su
  caso.
- **SC-009**: Fuera de `components/ui/`, ningún texto visible aparece como literal y ninguna clave
  inexistente sobrevive a `typecheck`; y en ningún componente, `ui/` incluido, aparece como literal
  un valor de color, tipografía, espacio, radio, sombra o duración. Eso lo verifican compuertas.
  Dentro de `components/ui/`, donde la fila 1 de `docs/09` exime al check de strings porque esas
  primitivas no traducen, lo que rige es FR-033 —todo texto y nombre accesible llega por props— y
  lo califica `design-reviewer`: esta spec MUST no afirmar que ahí lo ve una compuerta.
- **SC-010**: `pnpm db:types` genera tipos idénticos a los versionados y una compuerta lo verifica;
  y sobre una base recién reseteada, la base local no tiene ninguna tabla propia del producto ni
  ninguna persona. Si una prueba del arnés dejó una sintética por haber fallado a mitad,
  `supabase db reset` la borra, y este criterio se evalúa después de ese reset.
- **SC-011**: La clave de servicio no aparece versionada ni bajo un nombre expuesto al browser, y
  una compuerta lo verifica.
- **SC-012**: La lógica pura del driver tiene pruebas que cubren la interpretación de argumentos,
  la correspondencia de ruta a nombre de archivo (incluida la raíz) y la lista permitida.
- **SC-013**: Cada dependencia del `package.json` tiene su línea fechada en `docs/07-stack.md`, el
  README lista cada versión instalada con su fecha, y el contrato del driver en `run-app/SKILL.md`
  no describe ningún comportamiento que no exista.
- **SC-014**: Existen, en este PR, la fila de la clave de servicio en `docs/09`, la segunda
  categoría de anotación de mutantes, la línea fechada de Stryker sin verificador en `docs/07`, la
  entrada de `docs/known-limitations.md` con detección y condición de reapertura, y `CLAUDE.md`
  §Estado y §Estructura al día.
- **SC-015**: Un commit con una falla de lint, tipos o pruebas no se crea y el desarrollador ve qué
  falló; un commit con solo un problema de formato se crea, ya formateado.
- **SC-016**: El diff de esta historia no contiene nada de la lista de FR-049, ni ninguna
  dependencia que el proyecto no use, ni cambios a los archivos que FR-050 protege más allá de lo
  que FR-016 y FR-047 autorizan.
- **SC-017**: No queda en el repo ningún dato de una persona real, y nada de lo que la corrida
  produce —capturas, reportes— entra a git.

## Assumptions

Supuestos de esta corrida. Los cuatro primeros los decidió Hernán en modo `ask` el 2026-09-18; el
resto son lecturas de los docs, registradas para que se puedan desmentir.

- **Decidido por Hernán: F00 se construye entera, en un solo PR**, con las seis user stories de
  arriba, aunque superen las ~5 que `docs/09` §Tamaño pone como señal de división. El mecanismo que
  sostiene una feature grande es construir y verificar user story por user story.
- **Decidido por Hernán: el gancho de pre-commit es lefthook** (2.1.14 al 2026-09-18, a
  reverificar al construir según FR-048): una sola dependencia, jobs en paralelo y filtrado de
  archivos preparados sin necesitar otra herramienta. Es la opción más liviana y actual, el
  criterio que pide `docs/08`.
- **Decidido por Hernán: el lint con tipos entra ahora**, vía `oxlint-tsgolint`, que recupera 59 de
  las 61 reglas que TypeScript 7 dejó sin soporte al romper typescript-eslint. Cumple constitución
  §IV: la regla existe antes que el código al que aplica. No reemplaza ninguna pieza del stack:
  agrega una capacidad al linter ya decidido, con su línea fechada en `docs/07`.
- **Decidido por Hernán (2026-09-18): la identidad visual es «Cartel».** Al ver las primitivas
  construidas las encontró genéricas y pidió identidad propia. Eligió entre tres maquetas
  renderizadas (Cartel, Esmalte, Patio). `docs/10` cambió primero, con fecha y con lo descartado,
  y después el código: la acción pasa de yerba a tinta, el verde queda reservado para la
  confianza, los radios van a cero, entra la voz de afiche y entran los recursos del cartel
  (cinta, tiritas perforadas, sello). `Button` gana la variante `tirita` y `Chip` gana su
  `ChipGroup`. Todo es CSS, así que el presupuesto de performance no se toca.
- **Decidido por Hernán: Stryker sigue sin verificador de tipos y se cierra la regla, no el
  stack.** El verificador de Stryker 10 no puede correr sobre TypeScript 7 (importa el paquete
  `typescript` para utilidades que la 7 ya no expone), lo que `docs/07` ya había decidido. Lo que
  no estaba registrado es la consecuencia: sin verificador, un mutante que no compila se ejecuta
  igual y cuenta como sobreviviente, así que el umbral de 100 % puede ponerse rojo por un mutante
  imposible. Por eso FR-016 pide una segunda categoría de anotación, distinguible de la de mutante
  equivalente, y FR-046 la registra en `docs/09`, en `docs/07` y como limitación conocida con su
  condición de reapertura. F00 no muta nada, así que el costo empieza en M1.
- **El mecanismo de las reglas propias y la forma de su demostración los elige `plan.md`**, como
  pide el comentario de Hernán en la issue. Esta spec solo exige que la regla falle nombrándose
  (FR-012), que la demostración cubra las ocho reglas dentro de la etapa `test` y que su material
  quede fuera de las cinco compuertas que lo verían (FR-013).
- **La demostración del mutante sobreviviente no queda en el repo.** Dejar un mutante vivo
  versionado rompería el umbral de 100 % para siempre. Se demuestra durante la corrida y se reporta
  en el PR; lo permanente es el umbral en 100, las dos categorías de anotación y el comportamiento
  de "no había nada que verificar".
- **F00 no deja ningún archivo con test bajo `src/`.** Nada de lo que crea entra en la lista de
  `docs/09` §Qué vale la pena testear: no hay reglas de negocio, schemas, cálculos de dominio ni
  componentes de dominio, y las primitivas `ui/` están excluidas a propósito. Las pruebas que
  existen —la demostración de las reglas, el ejemplo del arnés, la deriva de tipos y la lógica pura
  del driver— viven fuera de `src/`, así que `pnpm mutation` reporta que no hay nada que mutar, que
  es exactamente el caso borde que la historia pide.
- **`APP_NAME` arranca con un placeholder de texto.** `docs/04` deja el nombre sin definir, con
  todos los candidatos descartados, y manda usar un placeholder. El valor es provisorio por
  definición y se cambia en un solo archivo.
- **El formateador es Prettier**, como dice `docs/07`. No se evalúa cambiarlo: sería cambiar una
  pieza registrada del stack, y eso es decisión previa de Hernán en su propio PR.
- **Actualizar el contrato del driver en `run-app/SKILL.md` es parte de esta historia**, no solo su
  sección «Verified». Ese archivo se declara "contract" y dice que lo construye F00; la historia
  excluye a propósito el ingreso con persona sembrada y `--user`, así que dejar el contrato
  describiendo un driver que no existe engañaría a la etapa Build y al revisor de diseño desde la
  próxima historia. FR-046 lo limita a marcar qué parte cumple F00 y con qué historia llega el
  resto.
- **Los cuatro cambios a `ci.yml` de FR-047 entran por la autorización de la historia**, que
  excluye cambios al flujo de trabajo "salvo la sección «Verified» de run-app y los ajustes a la CI
  que pidan las reglas de esta historia". Sin ellos, FR-006, FR-008 y FR-017 serían falsos contra
  el archivo real, y sacar la guarda sin sacar sus condiciones dejaría un check que reporta verde
  sin correr nada.
- **La ruta de la muestra es `/muestra`**, en español como el resto de las URLs (`docs/06`
  §URLs), aunque sea una herramienta de desarrollo. Nombrarla acá es lo que hace verificable que el
  driver la capture y que el build de producción la rechace.
- **El comentario de Hernán en la issue dice que el PR #2 está sin mergear; ya está mergeado**
  (2026-09-18). Todo lo demás que dice sigue vigente y se toma como autoridad.
- **No se corrió `pnpm install` en la etapa Ready**, porque sin `package.json` pnpm escribe uno por
  defecto y deja el árbol sucio. Es la excepción que `docs/09` prevé para `M0 - Base`.
- **El endurecimiento agotó sus tres rondas.** El grader terminó con 44 de 44; el adversario pasó
  de 7 hallazgos altos en la ronda 1 a 4 en la ronda 3, todos arreglados. Lo que **no** hubo es una
  cuarta ronda que verifique los arreglos de la tercera: es el tope que fija `docs/09` §Reglas de
  todas las etapas. Como las dos rondas anteriores habían introducido referencias cruzadas
  erradas entre requisitos al renumerar, esas referencias se verificaron a mano una por una al
  cerrar, y se corrigieron tres. `plan-reviewer` y los revisores de la etapa Review son la red que
  sigue.
