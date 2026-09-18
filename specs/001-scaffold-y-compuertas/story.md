## Historia
**Como** quien construye la plataforma (Hernán y el pipeline) **quiero** un proyecto vacío que arranca en local y se valida entero con una sola orden **para** que cada historia desde M1 se construya sobre reglas que se verifican solas, sin depender de la memoria de nadie.

## Contexto
El repo ya tiene los docs, el flujo de trabajo, la CI definida (`.github/workflows/ci.yml`), la configuración de Stryker (`stryker.config.mjs`, `scripts/mutation.mjs`) y de Lighthouse (`.lighthouserc.json`), el hook `guard-git.mjs` y `main` protegida. No tiene código: la CI no puede correr y ninguna regla de `CLAUDE.md` se verifica todavía.

`docs/09` §Compuertas mecánicas: "cada fila de esta tabla existe como check antes de que empiece M1". Constitución §IV: una regla que vive solo en prosa se olvida. `CLAUDE.md` §Estructura y §Comandos son el contrato que las etapas del pipeline usan tal cual; ahí esta historia se llama F00.

Versiones estables al 2026-09-17, a verificar de nuevo al construir: Next.js 16.3, React 19.3, TypeScript 7.0, Tailwind 4.3, Vitest 5, Stryker 10, Playwright 1.63, oxlint 1.83, pnpm 12, Node 26.

**Decisión de Hernán (2026-09-17): todo corre sobre TypeScript 7**, que ya no expone la API clásica del compilador. Probado en la máquina: el chequeo de tipos, el build de Next, Vitest y Stryker andan; typescript-eslint aborta y remite a TypeScript 6, así que el linter es oxlint, que trae su propio analizador y no depende del compilador, y Stryker corre sin su verificador de tipos. La decisión y su evidencia quedan en `docs/07-stack.md`.

## Alcance
- Incluye: la base completa sobre la que corre el pipeline.
  - **Proyecto:** Next.js (App Router, TypeScript `strict`) con pnpm en la raíz, generado con `create-next-app@latest` en un directorio temporal y movido; la estructura de `CLAUDE.md` §Estructura; `APP_NAME` y `APP_URL` en `src/lib/config.ts` como único lugar del nombre.
  - **Comandos:** todos los de `CLAUDE.md` §Comandos con esos nombres (`dev`, `lint`, `typecheck`, `test`, `mutation`, `mutation:all`, `build`, `start`, `e2e`, `lighthouse`, `verify`, `db:types`). `pnpm verify` corre lint, typecheck, test, mutation, build, e2e y lighthouse, en ese orden, y corta en la primera falla. La CI existente corre lo mismo.
  - **Compuertas:** cada fila de `docs/09` §Compuertas mecánicas como check (oxlint con sus plugins de TypeScript, React, Next.js, accesibilidad, imports y Vitest; las reglas propias del proyecto que oxlint no trae, con el mecanismo que elija el plan; `tsc`; Vitest; Stryker al 100 %; Playwright y Lighthouse CI contra `next start`); Prettier, con el formato verificado dentro de `pnpm lint`; un gancho antes de cada commit que formatea y corre lint, tipos y pruebas (la herramienta la elige el plan con el criterio de `docs/08`: la más liviana y actual); Renovate configurado.
  - **Base local:** Supabase CLI inicializado, sin tablas propias; `supabase db reset` y `pnpm db:types` funcionando; el arnés de pruebas de privacidad, con el que una prueba actúa como visitante anónimo, como una persona con sesión o con permisos de servicio.
  - **i18n y diseño:** next-intl con `messages/es.json` como único idioma y español sin prefijo en la URL; los tokens de `docs/10` §Tokens en la hoja de estilos global; Bricolage Grotesque servida desde el propio sitio; las 11 primitivas `ui/` de la tabla de `docs/10` (Button, Input, Textarea, Select, Chip, Card, Sheet, Dialog, Toast, Skeleton, EmptyState) con sus variantes y estados.
  - **Pantallas mínimas y capturas:** una portada provisoria, una muestra de las primitivas solo en desarrollo, y `scripts/walk.mjs` según el contrato de `.claude/skills/run-app/SKILL.md`, para visitante anónimo.
  - **Registro:** una línea fechada por dependencia en `docs/07`; las versiones instaladas con fecha en el README; la sección «Verified» de run-app con comandos, puertos y trampas vistas en Windows 11 / PowerShell 7; `CLAUDE.md` §Estado al día.
- No incluye (explícito): nada de producto ni lo que llega con una historia posterior.
  - Cuentas, ingreso, perfiles, animales, solicitudes o tablas propias en la base (desde M1).
  - La sesión de la app con la base, los usuarios sembrados y el driver con `--user`: llegan con la historia de registro e ingreso, que completa esa parte del contrato del driver.
  - Componentes de dominio (`PetCard`, `VerificationBadge`…), que entran con su historia.
  - Flujos críticos de Playwright, que llegan con publicar, solicitar y aceptar.
  - Páginas de error y de "no encontrada" diseñadas, landing y SEO (M5).
  - Dependencias que esta historia no usa (email, OTP, analítica, errores, Motion, formularios): cada una entra con su historia.
  - Vercel, el proyecto de Supabase en la nube y las variables remotas (M5).
  - Segundo idioma, selector de idioma y modo oscuro.
  - Automerge de las actualizaciones, e instalar la app de Renovate en GitHub (paso manual de Hernán, listado en el PR).
  - Cambios al flujo de trabajo (`.claude/`, `.specify/`, hook de git, protección de `main`), salvo la sección «Verified» de run-app y los ajustes a la CI que pidan las reglas de esta historia.

## Reglas de negocio
- **Una sola compuerta.** `pnpm verify` es exactamente lo que corre CI, en el mismo orden. Ninguna etapa corre de un solo lado.
- **Nada se saltea en silencio.** Sin base local, las pruebas de privacidad se omiten con un aviso visible en la máquina y fallan en CI. Una etapa sin nada que verificar todavía (sin archivos con test para mutar, sin flujos críticos) pasa y dice por qué.
- **Una regla que nunca se vio fallar no es una compuerta.** Cada regla propia se demuestra con un ejemplo que la viola y su versión corregida, y esa demostración corre dentro de `pnpm verify`: si un cambio de configuración apaga una regla, la compuerta se pone roja.
- **Últimas versiones, sin bajar ninguna en silencio.** Todo entra en su última estable verificada ese día. Si una herramienta no soporta la última de otra, se busca alternativa a la herramienta antes que bajar la otra; el caso de TypeScript 7 ya está resuelto así. Un conflicto nuevo que toque una pieza de `docs/07` lo decide Hernán antes de seguir, y queda registrado con fecha.
- **Mismo resultado en todos lados.** La máquina y CI usan la misma versión mayor de Node y las mismas de pnpm y Supabase CLI, y los comandos se comportan igual en Windows 11 / PowerShell 7 y en el runner Linux.
- **Desde el primer commit:** el nombre vive solo en `APP_NAME`; ningún texto visible fuera de `messages/es.json` ni color fuera de los tokens, tampoco en la portada provisoria ni en la muestra.
- **Presupuesto medido** sobre el build de producción local: LCP < 2 s, JS inicial < 150 KB, Lighthouse mobile ≥ 90 en performance y en accesibilidad.
- **Mutation al 100 %** sobre lo que tiene test, sin margen; un mutante equivalente se anota en su línea con el motivo.

## Criterios de aceptación
### Camino feliz
- **Dado** un clon limpio con la base local levantada **cuando** se corren `pnpm install` y `pnpm verify` **entonces** las 7 etapas terminan en verde y la salida nombra cada una.
- **Dado** el PR de esta historia **cuando** corre CI **entonces** el check `ci` termina en verde con las mismas 7 etapas.
- **Dado** `pnpm dev` **cuando** se abre la portada a 390 px **entonces** se ven el nombre de `APP_NAME` y una frase de `messages/es.json`, en Bricolage Grotesque y con los colores de los tokens, sin errores en la consola.
- **Dado** que se cambia `APP_NAME` **cuando** se recarga la portada **entonces** el nombre nuevo aparece en la pestaña y en la página sin tocar otro archivo.
- **Dada** la muestra de primitivas en desarrollo **cuando** se recorre con mouse y teclado **entonces** están las 11 primitivas con cada variante y estado de la tabla de `docs/10`, y cada elemento interactivo responde a hover, foco (anillo de 2 px con 2 px de separación) y presión en 100 a 250 ms.
- **Dada** la app levantada **cuando** corre `node scripts/walk.mjs --story scaffold-y-compuertas` sobre la portada y la muestra **entonces** quedan en `.artifacts/scaffold-y-compuertas/` una captura de página completa a 390 × 844 y otra con hover y foco por ruta (más 1280 × 800 con `--desktop`), se imprime una línea por ruta con su primer título y el driver termina con código 0. Sin rutas, recorre solo la portada.
- **Dada** la base local **cuando** corre la prueba de ejemplo del arnés de privacidad **entonces** confirma la identidad de cada rol (sin sesión, la persona creada para la prueba, servicio) y borra lo que creó.
- **Dado** `supabase start` **cuando** corren `supabase db reset` y `pnpm db:types` **entonces** terminan sin error y los tipos generados son idénticos a los versionados.
- **Dado** el repo **cuando** se valida la configuración de Renovate con su validador oficial **entonces** pasa.

### Casos borde
- **Dado** un ejemplo que viola una regla propia (texto visible literal fuera de `ui/`, hexadecimal en un componente, `.from()` fuera de `lib/supabase/queries/`, una primitiva `ui/` que importa de un dominio, un componente de dominio que importa el cliente de la base, `"use client"` en `page.tsx` o `layout.tsx`, `any` explícito, un test sin aserción, deshabilitado o con `expect` condicional) **cuando** corre `pnpm verify` **entonces** falla con un mensaje que nombra la regla, y el ejemplo corregido pasa.
- **Dado** un componente de más de 150 líneas **cuando** corre lint **entonces** aparece una advertencia y la compuerta no falla.
- **Dado** un archivo con test donde sobrevive un mutante **cuando** corre `pnpm mutation` **entonces** falla por debajo del 100 % nombrando el mutante; anotado como equivalente con su motivo, pasa.
- **Dado** que todavía no hay archivos con test para mutar ni flujos críticos **cuando** corren `pnpm mutation` y `pnpm e2e` **entonces** terminan en verde y dicen que no había nada que verificar.
- **Dada** la máquina sin base local **cuando** corre `pnpm test` **entonces** las pruebas de privacidad se omiten con un aviso visible y el resto corre; **dado** CI sin base, **entonces** fallan diciendo que falta la base.
- **Dado** un cambio con una falla de lint, tipos o pruebas **cuando** se intenta commitear **entonces** el commit no se crea y se ve qué falló.
- **Dado** `prefers-reduced-motion: reduce` **cuando** se usa la muestra **entonces** las transiciones duran 0 ms y el shimmer del Skeleton queda quieto.
- **Dado** el build de producción **cuando** se pide la muestra de primitivas **entonces** responde "no encontrada".
- **Dado** el scaffold generado en un directorio temporal **cuando** se mueve a la raíz **entonces** no se pisa ningún archivo existente (`CLAUDE.md`, `README.md`, `.gitignore`, `docs/`, `.claude/`, `.github/`); lo que el generador agrega por defecto (como `AGENTS.md`) se integra o se descarta, y el PR dice qué se hizo.
- **Dada** Windows 11 con PowerShell 7 **cuando** Hernán corre `pnpm verify` y el driver **entonces** cada etapa termina en verde, igual que en el runner Linux de CI.

### Errores y rechazos
- **Dado** que la app no está levantada **cuando** corre el driver **entonces** termina con código 2 antes de abrir un navegador y dice qué levantar.
- **Dada** una ruta con un error de consola, un error de página o un pedido fallido fuera de la lista permitida **cuando** el driver la recorre **entonces** termina con código distinto de 0 y nombra la ruta y el error.
- **Dado** el driver con `--user` **cuando** corre antes de que exista el ingreso **entonces** termina con error diciendo que esa opción llega con la historia de registro e ingreso; nunca recorre como anónimo en silencio.
- **Dado** un build que supera el presupuesto (JS inicial > 150 KB, LCP > 2 s, performance o accesibilidad < 90) **cuando** corre `pnpm lighthouse` **entonces** falla nombrando la métrica.
- **Dada** una variable de entorno que falta **cuando** arranca la prueba o la app que la necesita **entonces** falla con un mensaje que nombra la variable y cómo obtenerla (`supabase status -o env`).
- **Dada** una herramienta que no soporta la última versión de otra **cuando** aparece el conflicto **entonces** la corrida no baja la versión en silencio: busca alternativa y, si la salida cambia una pieza de `docs/07`, le pregunta a Hernán y registra la decisión con fecha.

## Pantallas
- **Portada provisoria:** el nombre de `APP_NAME` y una frase de "en construcción" desde los mensajes. No carga datos, así que no tiene estados de carga, vacío ni error propios. La reemplaza la historia que defina la portada real.
- **Muestra de primitivas (solo desarrollo):** cada primitiva de `docs/10` con sus variantes y estados, incluidos un EmptyState y un Skeleton de ejemplo. No carga datos. En producción no existe.
- Las páginas de error y de "no encontrada" siguen siendo las de Next.js hasta M5.

## Datos personales
- No aplica. Esta historia no guarda datos de personas: la base local queda sin tablas propias, las personas que crea el arnés de privacidad son sintéticas y se borran al terminar cada prueba, y las capturas y los reportes quedan en carpetas ignoradas por git.

## Medición
- No aplica. La instrumentación del funnel llega en M4.

## Dependencias
- Ninguna historia previa: es la primera.
- `CLAUDE.md` §Estructura y §Comandos · `docs/07-stack.md` §El stack, §Versiones y §Presupuesto · `docs/08-convenciones-codigo.md` · `docs/09-flujo-de-trabajo.md` §Compuertas mecánicas, §Qué vale la pena testear y §Cada test prueba lo que dice probar · `docs/10-design-system.md` §Tokens, §Componentes y §Piso de accesibilidad · `docs/06-i18n.md` §Estructura y §URLs · `.claude/skills/run-app/SKILL.md` (contrato del driver).
- Ya en el repo, se usan y no se rehacen: `.github/workflows/ci.yml`, `.lighthouserc.json`, `stryker.config.mjs`, `scripts/mutation.mjs`, `.claude/hooks/guard-git.mjs`.

