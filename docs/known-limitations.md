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

## KL-005 — Los 30 días de sesión los sostiene la cookie, no el servidor

- **Área:** auth · privacidad.
- **Qué:** FR-012 de la historia #9 pide que la sesión dure 30 días desde el último uso.
  `inactivity_timeout` de `[auth.sessions]` hace exactamente eso del lado del servidor, pero **es
  de plan Pro**; en el gratuito la sesión no vence nunca. Se cumple emitiendo la cookie de sesión
  con 30 días de vida y renovándola en cada visita.
- **Por qué se acepta:** cubre el caso que a la historia le importa —el teléfono prestado que
  queda abierto para siempre— sin costo. Es más débil ante alguien que extraiga el token de
  refresco del disco, pero ese atacante ya tiene el dispositivo.
- **Detección:** un navegador sin visitas en 30 días pierde la sesión; un token de refresco
  copiado a mano seguiría sirviendo.
- **Se reabre cuando:** el proyecto esté en un plan Pro. Ahí se enciende
  `inactivity_timeout = "720h"` y se saca la plomería de la cookie.
- **Origen:** F01, historia #9.

## KL-006 — El correo del enlace no sale de verdad hasta que exista el dominio

- **Área:** correo · infraestructura.
- **Qué:** el correo del enlace lo manda el producto por Resend, pero Resend necesita un dominio
  verificado para mandarle a cualquier dirección, y el dominio no existe hasta que se decida el
  nombre (`04-nombre.md`). Mientras tanto el envío real se enciende por variable de entorno; sin
  ella, el mismo mensaje se escribe en `.artifacts/mail/` y de ahí lo lee la prueba de punta a
  punta.
- **Con la clave puesta (2026-09-19):** el remitente es `onboarding@resend.dev`, el dominio
  compartido de pruebas de Resend, que **solo entrega a la dirección de la cuenta**. Cualquier otro
  destinatario lo rechaza Resend y la persona ve «No pudimos mandar el correo», que es lo que
  corresponde pero por un motivo que no es de ella. O sea: alcanza para verse llegar el enlace al
  buzón propio, no para probar con dos personas distintas. Para eso hace falta el dominio.
- **La prueba de punta a punta nunca manda:** `playwright.config.ts` le pasa `RESEND_API_KEY` vacía
  al servidor de la prueba. Sin eso, una clave en `.env.local` la heredaría, Resend rechazaría las
  direcciones sintéticas, no se escribiría ningún archivo y la prueba fallaría por algo que no
  tiene que ver con lo que prueba.
- **Por qué se acepta:** las dos salidas comparten plantilla y texto, así que lo que se prueba es
  lo que se va a mandar, y `pnpm verify` corre sin red. El CLI local sí levanta un buzón (Mailpit,
  en `http://127.0.0.1:54324`), pero es el buzón del servicio de autenticación, que en esta
  historia no manda nada: para dejar el correo ahí habría que sumar un cliente SMTP como
  dependencia, solo para simular lo que ya se puede leer de un archivo.
- **Detección:** sin `RESEND_API_KEY`, nadie recibe un correo; el enlace está en
  `.artifacts/mail/`.
- **Se reabre cuando:** exista el dominio definitivo y se verifique en Resend. Ahí la variable
  queda cargada en todos los entornos menos las pruebas.
- **Origen:** F01, historia #9.

## KL-007 — HEIC no se acepta como foto de perfil

- **Área:** imágenes.
- **Qué:** las fotos se procesan en el cliente con canvas, y canvas no decodifica HEIC fuera de
  Safari. Aceptarlo dejaría toda foto de iPhone abierta en Android o en escritorio cayendo en el
  error de procesado, así que HEIC quedó fuera de los tipos aceptados (FR-025).
- **Por qué se acepta:** en la práctica no se pierde ninguna foto. iOS convierte la imagen a JPEG
  cuando se sube desde el navegador; el HEIC crudo solo llega por caminos raros, como pasar el
  archivo por otra aplicación primero.
- **Detección:** elegir un `.heic` de verdad muestra el error de tipo no aceptado.
- **Se reabre cuando:** haya que aceptar HEIC de verdad —lo diría un reporte de una persona real,
  no una suposición—. Ahí entra un decodificador como dependencia, con su línea en `07-stack.md`,
  o el procesado se hace del lado del servidor.
- **Origen:** F01, historia #9.

## KL-008 — El runner de Vitest de Stryker no sirve con Vitest 5

- **Área:** compuertas · mutation testing.
- **Qué:** `@stryker-mutator/vitest-runner` 10.0.0 —la última— **nunca activa un mutante** contra
  Vitest 5.0.1: instrumenta el archivo, corre los tests y todos los mutantes sobreviven, así que
  `pnpm mutation` daba 0 % y no podía pasar nunca. Se confirmó mirando el archivo durante la
  corrida (sí se instrumenta), con `coverageAnalysis` en `perTest` y en `all` (mismo resultado), y
  con el log en `debug`, que además revienta al serializar la config de Vitest 5
  (`Converting circular structure to JSON`). F00 no podía haberlo visto: no dejaba nada que mutar.
- **Cómo se resolvió:** se pasó al **runner de comando**, que es agnóstico del framework de
  pruebas: Stryker muta en el lugar, corre `pnpm exec vitest run <los tests hermanos>` y restaura.
  `scripts/mutation.mjs` arma ese comando con los tests de los archivos que se están mutando, así
  que no multiplica la suite de base ni la de compuertas por la cantidad de mutantes. La compuerta
  quedó en 100 % de verdad, y tarda unos 40 segundos para 146 mutantes.
- **Por qué se acepta:** el costo es que el runner de comando no puede decir qué test cubre qué
  mutante, así que se pierde `coverageAnalysis: 'perTest'` y `ignoreStatic`, y cada mutante corre
  el comando entero. Con el alcance chico y elegido a mano que pide `docs/09`, eso no se nota.
- **Detección:** si vuelve el runner de Vitest y el score baja a 0 % con todos los mutantes
  sobrevivientes, es esto otra vez.
- **Se reabre cuando:** `@stryker-mutator/vitest-runner` publique soporte de Vitest 5. Ahí se
  vuelve al runner nativo, que recupera la cobertura por test y es más rápido.
- **Origen:** F01, historia #9, en la primera corrida de la compuerta con algo que mutar.

## KL-009 — En /entrar, la cabecera ofrece «Entrar»

- **Área:** ingreso · cabecera.
- **Qué:** `AccountMenu` muestra «Entrar» sin sesión en todas las pantallas (FR-015a), también en
  /entrar, donde es un enlace a la pantalla en la que la persona ya está y, si había un `?next=`,
  lo pierde.
- **Por qué se acepta:** no corta ningún paso: el ingreso está en la pantalla misma y tocar el
  enlace solo la recarga sin destino. No pasa el umbral de docs/09.
- **Detección:** la cabecera de cualquier captura de /entrar.
- **Se reabre cuando:** se toque `AccountMenu` o la cabecera de `(auth)`: ahí se esconde en
  /entrar o se marca con `aria-current="page"` sin estilo de enlace.
- **Origen:** revisión de diseño del ingreso con Google primero (2026-09-22).
