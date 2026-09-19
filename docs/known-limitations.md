# Limitaciones conocidas

Hallazgos **aceptados** en vez de encolados (constitución §VI, umbral de seguimiento). Cada uno
es real y se entendió cuando se encontró; ninguno pasa el umbral hoy. Viven acá para que no sean
un recorte silencioso, y fuera del backlog para que no compitan con el MVP.

## El umbral

Un hallazgo fuera del alcance de una historia abre una issue solo si corta un paso del funnel
(ver ficha → solicitar → aceptar → adoptar) o de la verificación, **o** muestra datos de contacto
o identidad a quien no debe verlos, **o** rompe el presupuesto de performance de una pantalla del
funnel. Todo lo demás se registra acá. Una historia abre como máximo un seguimiento; si hay más
sobre el umbral, el PR los lista y Hernán decide.

## Cómo se agrega una entrada

Una sección por limitación, la más nueva al final, en el mismo PR de la historia que la encontró.
Todos los campos son obligatorios: una entrada sin detección ni condición de reapertura es un
recorte disfrazado.

```
## KL-NNN — <nombre corto>

- **Área:** <pantalla / flujo>
- **Qué:** <la falla, en una o dos frases, con el camino que la alcanza>
- **Por qué se acepta:** <por qué no pasa el umbral>
- **Detección:** <qué se vería si pasa: un evento, un log, una pantalla>
- **Se reabre cuando:** <el hecho concreto que la convierte en historia>
- **Origen:** <historia / PR / etapa que la encontró>
```

Reabrir es crear una historia con `/story-map new` que cite la entrada, y borrar la entrada en el
PR de esa historia.

---

## KL-001 — `pnpm lighthouse` no termina en Windows

- **Área:** compuertas · presupuesto de performance.
- **Qué:** la etapa audita bien y genera resultados, pero `chrome-launcher` no logra borrar su
  directorio temporal (`%TEMP%\lighthouse.NNNN`) y tira `EPERM, Permission denied` al cerrar, así
  que `lhci autorun` sale distinto de 0 y no escribe el reporte. Pasa con
  `@lhci/cli` 0.15.1 (Lighthouse 12.6.1, chrome-launcher 1.2.1) en Windows 11 / PowerShell 7.
  No es la configuración: se probó con perfil de Chrome propio, con los flags en `settings` y en
  `collect`, y el error es el mismo en las tres.
- **Por qué se acepta:** el runner de CI es Linux y ahí la etapa corre, que es donde la compuerta
  tiene que estar verde para mergear (constitución §III). En la máquina de Hernán las otras seis
  etapas de `pnpm verify` sí corren; la séptima queda para CI.
- **Detección:** `pnpm lighthouse` en Windows sale con 1 y el stack termina en
  `Launcher.destroyTmp`. En CI la etapa pasa o falla por el presupuesto, que es lo esperado.
- **Se reabre cuando:** `chrome-launcher` arregle el borrado en Windows (o `@lhci/cli` lo suba), o
  cuando Hernán quiera medir el presupuesto en local antes de abrir el PR. Renovate va a traer la
  actualización; al llegar, correr `pnpm lighthouse` en Windows y borrar esta entrada si termina
  en 0.
- **Origen:** F00, historia #1, al correr la etapa por primera vez.

## KL-002 — el preset de Lighthouse estaba mal desde el bootstrap

- **Área:** compuertas · presupuesto de performance.
- **Qué:** `.lighthouserc.json` traía `settings.preset: "mobile"`, que Lighthouse rechaza: los
  únicos valores válidos son `perf`, `experimental` y `desktop`, y mobile **es el default**. La
  etapa no podía correr en ninguna plataforma, ni en CI.
- **Por qué se acepta:** ya está arreglado en este PR (`formFactor: mobile` más
  `screenEmulation` a 390 × 844), así que no queda limitación abierta. Queda anotado porque
  muestra algo del flujo, no del código: una compuerta que nunca corrió no es una compuerta, y
  esta estuvo en `main` desde el bootstrap sin que nadie lo notara.
- **Detección:** `pnpm lighthouse` fallaba con `Invalid values: Argument: preset`.
- **Se reabre cuando:** no aplica; queda como registro.
- **Origen:** F00, historia #1.

## KL-003 — un mutante que no compila cuenta como sobreviviente

- **Área:** compuertas · mutation testing.
- **Qué:** Stryker corre sin su verificador de tipos, porque ese verificador no anda sobre
  TypeScript 7. Un mutante que sería un error de tipos se ejecuta igual; si los tests no lo
  matan, cuenta como sobreviviente y el umbral de 100 % se pone rojo por un mutante que nunca
  podría existir en el código real.
- **Por qué se acepta:** la alternativa era bajar TypeScript o meter una segunda versión solo para
  Stryker, y las dos rompen la decisión de `07-stack.md`. El costo es acotado: una anotación
  `// Stryker disable next-line <Mutator>: no compila — <por qué>` que `code-reviewer` verifica.
- **Detección:** `pnpm mutation` falla nombrando un mutante cuyo código mutado no pasaría `tsc`.
- **Se reabre cuando:** el verificador de Stryker funcione sobre TypeScript 7 sin necesitar la 6
  instalada bajo el nombre `typescript` (su PR #6099 lo lista como limitación). Ahí se activa el
  verificador y se revisan las anotaciones "no compila": deberían poder borrarse todas.
- **Origen:** F00, historia #1. Todavía no se manifestó: F00 no deja nada que mutar.

## KL-004 — Supabase prefiere claves nuevas y el proyecto usa las heredadas

- **Área:** base · configuración.
- **Qué:** Supabase recomienda hoy las claves *publishable* y *secret* sobre las heredadas `anon`
  y `service_role`. El CLI local ya entrega las dos familias; el proyecto y la CI usan las
  heredadas (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Por qué se acepta:** no corta ningún paso del funnel ni expone nada, y cambiarlo ahora sería
  renombrar variables en una historia que no es de eso.
- **Detección:** `pnpm exec supabase status -o env` lista `PUBLISHABLE_KEY` y `SECRET_KEY` que
  nadie lee.
- **Se reabre cuando:** llegue M5 y se cree el proyecto cloud, o antes si Supabase anuncia fecha de
  retiro de las heredadas. La compuerta de la clave de servicio tiene que aprender el nombre nuevo.
- **Origen:** F00, historia #1.
