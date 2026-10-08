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

El número es `KL-<historia>-<k>`: el número de la historia (o del seguimiento) que la encontró y
un contador desde 1 dentro de ella, como `KL-53-1`. Así dos ramas abiertas a la vez nunca eligen el
mismo número, y el número no cambia después de citarse en un PR o un issue. Las entradas de antes
(`KL-001` a `KL-031`) conservan el suyo.

**Decisión (2026-09-27):** numeración por historia. Motivo: tres ramas abiertas desde el mismo
`main` numeraron sus limitaciones igual (KL-034 en adelante, con contenido distinto); renumerar al
mergear rompía las citas que ya estaban en los PRs.

```
## KL-<historia>-<k> — <nombre corto>

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

## KL-010 — El código no sale por Twilio de verdad hasta que exista la cuenta

- **Área:** verificación de teléfono · infraestructura.
- **Qué:** el mensaje del código lo manda el producto por la API de mensajes de Twilio, pero no hay
  cuenta ni un remitente habilitado para Uruguay. Contra la base local el mismo mensaje se escribe
  en `.artifacts/sms/` y de ahí lo lee la prueba de punta a punta; contra cualquier otra base sin
  credenciales, el pedido falla (FR-009c). El `fetch` a Twilio y la clasificación de su respuesta
  (`twilio-outcome.ts`, con test) nunca se ejercitaron contra el servicio real.
- **Lo que Verify traía y Messaging no:** los permisos por país y la protección contra el bombeo de
  mensajes se configuran en la cuenta. Al crearla: solo Uruguay en *Messaging Geographic
  Permissions*, y la protección contra fraude de mensajes encendida.
- **Por qué se acepta:** el texto y las reglas son los mismos en los dos caminos; lo único que
  cambia es quién lleva el mensaje. `pnpm verify` corre sin red.
- **Detección:** sin las tres variables `TWILIO_*`, nadie recibe un mensaje; el código está en
  `.artifacts/sms/`.
- **Se reabre cuando:** exista la cuenta de Twilio. El primer mensaje real, antes de la beta,
  cierra esta entrada.
- **Origen:** historia #10, plan §Decisiones 1 y 5.

## KL-011 — Los rechazos que Twilio descubre tarde se cuentan como enviados

- **Área:** verificación de teléfono.
- **Qué:** Twilio rechaza en el momento un número inválido (21211) o que no es un celular (21614),
  y eso se le dice a la persona (FR-002a). Otros rechazos —no se pudo entregar, el operador lo
  filtró (30003, 30005, 30006, 30007)— llegan después, por un callback de estado que esta historia
  no construye. Ese mensaje se cuenta como enviado y la persona espera un código que no llega.
- **Por qué se acepta:** la pantalla del código ya dice qué revisar y cuándo pedir otro (US1-AS10),
  y sin cuenta de Twilio no hay callback que recibir.
- **Detección:** "código pedido" sin "código confirmado" para un mismo número, varias veces.
- **Se reabre cuando:** el proyecto esté en la nube y se pueda recibir el callback de estado.
- **Origen:** revisión del plan, historia #10.

## KL-012 — Un mensaje que salió y no se pudo anotar deja un código muerto

- **Área:** verificación de teléfono.
- **Qué:** si Twilio acepta el mensaje y después falla la base al anotar la entrega
  (`settle_phone_code`), la persona recibe un código que nunca va a verificar: el pedido quedó en
  `sending`, que no es un código vivo. La pantalla dice que no se pudo confirmar si salió
  (FR-009e), y ese pedido cuenta para los topes hasta que la purga lo borra.
- **Por qué se acepta:** pide una falla de la base justo entre dos llamadas; el daño es pedir otro
  código, y cuenta de más, nunca de menos.
- **Detección:** filas de `phone_codes` en `sending` de más de un minuto.
- **Se reabre cuando:** aparezca una sola vez en la beta.
- **Origen:** revisión del plan, historia #10.

## KL-013 — El tope por número y el techo del sitio se pueden sostener con cuentas nuevas

- **Área:** verificación de teléfono · abuso.
- **Qué:** crear cuentas es gratis. Con dos cuentas nuevas por día, alguien mantiene lleno el tope
  mudo de un número ajeno: su dueña no recibe el código y recibe hasta 10 mensajes por día que no
  pidió (FR-011a). Con unas 40 por día, agota el techo del sitio y nadie puede verificarse
  (FR-011b).
- **Por qué se acepta:** cerrarlo pide saber quién es la dueña de un número antes de que lo
  demuestre, que es lo que la verificación viene a averiguar. Se prefirió un gasto acotado a uno
  sin techo.
- **Remedio manual:** `node scripts/phone-group.mjs <número>` imprime el grupo del número con la
  clave derivada; `delete from public.phone_number_sends where number_digest = <grupo>` lo libera,
  y `delete from public.phone_number_sends` libera el techo. Con las claves `sb_secret` de M5
  (KL-004) cambia la clave de la que se derivan los grupos: el comando tiene que correr con la
  misma clave que el servidor.
- **Detección:** el evento "Techo del sitio alcanzado", y una persona que avisa que el código no
  le llega. Hasta M5 los eventos no llegan a ninguna herramienta: se ven en el registro del
  servidor.
- **Se reabre cuando:** pase una sola vez.
- **Origen:** endurecimiento de la spec, historia #10 (tercera ronda, abierto al tope).

## KL-014 — El abandono entre pedir el código y confirmarlo es una aproximación

- **Área:** medición.
- **Qué:** el abandono se calcula por visita (FR-024a): quien pide el código un día y lo confirma
  otro cuenta como abandono en la primera visita, porque los eventos no llevan nada que una dos
  visitas de la misma persona (historia #9, FR-030c).
- **Por qué se acepta:** es el precio de no identificar a nadie en la medición.
- **Detección:** no aplica: es cómo se lee el número.
- **Se reabre cuando:** la medición llegue a una herramienta (M5) y la aproximación no alcance
  para decidir algo.
- **Origen:** endurecimiento de la spec, historia #10.

## KL-015 — Dos diferencias que quedan entre un código que salió y uno frenado en silencio

- **Área:** verificación de teléfono · privacidad.
- **Qué:** un pedido frenado en silencio por el tope por número responde igual que uno que salió
  (FR-006a), salvo en dos cosas: tarda menos, porque no espera a Twilio; y con Twilio caído, el
  que intentó salir dice "no salió" y el frenado dice que salió.
- **Por qué se acepta:** medir la latencia pide muchos pedidos, y cada uno gasta el tope de la
  cuenta; igualarla con una espera artificial no la cierra, porque la de Twilio varía más. La
  caída del servicio se prefiere a la vista antes que decir "no salió" de algo que no intentó
  salir.
- **Detección:** no aplica.
- **Se reabre cuando:** aparezca alguien usando el tope por número como oráculo.
- **Origen:** revisión del plan, historia #10.

## KL-016 — Sin pedidos, la purga de la verificación no corre

- **Área:** verificación de teléfono · datos personales.
- **Qué:** los pedidos y el conteo por número se borran a las 24 horas, y los números a medias a
  los 7 días (FR-015, FR-021, FR-022), pero la purga corre al pedir un código. Sin pedidos, esos
  datos viven más de lo que la spec promete. Las pantallas no se equivocan —un número a medias
  vencido ya no cuenta—, pero la fila sigue.
- **Por qué se acepta:** con el sitio en local no hay tráfico real; el cron diario llega con la
  nube.
- **Detección:** filas de `phone_codes` de más de 24 horas.
- **Se reabre cuando:** exista el cron diario (M5): `purge_phone_records` pasa a correr ahí.
- **Origen:** revisión del plan, historia #10.

## KL-017 — El check de que el teléfono no es una llave no ve el proyecto en la nube

- **Área:** verificación de teléfono · seguridad.
- **Qué:** `tests/gates/phone-sign-in.test.ts` falla si alguien prende el ingreso por teléfono en
  `supabase/config.toml` (FR-009d). El proyecto en la nube se configura aparte, en su panel, y el
  check no lo ve.
- **Por qué se acepta:** hoy no hay proyecto en la nube.
- **Detección:** en el panel de Supabase, *Authentication → Providers → Phone* encendido.
- **Se reabre cuando:** se cree el proyecto en la nube (M5): el checklist de lanzamiento verifica
  que el proveedor de teléfono esté apagado.
- **Origen:** revisión del plan, historia #10.

## KL-018 — Las pantallas de verificar se miden en el e2e, no con Lighthouse

- **Área:** verificación de teléfono · performance.
- **Qué:** SC-008 pide LCP y corrimiento en dos pantallas con sesión, y Lighthouse CI mide solo la
  portada. `tests/e2e/telefono.spec.ts` las mide sobre el build de producción con la red y la CPU
  limitadas por el protocolo de Chrome, y LCP y CLS leídos en la página. No es la puntuación de
  Lighthouse ni su simulación de red.
- **Por qué se acepta:** mide lo que SC-008 pide sin sumar una dependencia para que Lighthouse
  ingrese.
- **Detección:** el e2e falla con el número medido.
- **Se reabre cuando:** Lighthouse CI sepa ingresar, o haya una segunda pantalla con sesión en el
  funnel que medir.
- **Origen:** revisión del plan, historia #10.

## KL-019 — La caché incremental de Stryker puede quedar vieja en local

- **Área:** compuertas · mutation testing.
- **Qué:** con el runner de comandos, Stryker reusa los resultados de `reports/stryker-incremental.json`
  para los mutantes cuyo código y tests no cambiaron según su propio diff. Durante la historia #10
  dio 99,36 % con mutantes que ya estaban muertos; borrando el archivo, la misma corrida dio 100 %.
- **Por qué se acepta:** CI no guarda ese archivo entre corridas, así que la compuerta que decide
  el merge siempre corre entera. En local el error es hacia el lado seguro: marca de más, nunca de
  menos.
- **Detección:** `pnpm mutation` informa un sobreviviente que un test visiblemente mata, o que ya
  había muerto en la corrida anterior.
- **Remedio:** borrar `reports/stryker-incremental.json` y volver a correr.
- **Se reabre cuando:** vuelva a pasar con una versión nueva de Stryker, o si CI empieza a guardar
  la caché.
- **Origen:** construcción de la historia #10.

## KL-020 — En pantallas anchas, un formulario solo en la hoja de trabajo deja la hoja medio vacía

- **Área:** diseño · pantallas anchas.
- **Qué:** a 1280 px, «Verificar teléfono», «Escribir el código» y «Editar mi perfil» son un
  formulario de ~600 px sobre la hoja de trabajo de 1024 px del grupo `(app)`: alrededor del 40 %
  de la hoja queda en blanco a la derecha. `completar-perfil`, en `(auth)`, usa el volante, que
  mide lo que mide el formulario.
- **Por qué se acepta:** es una decisión de la zona y no de esta historia: afecta a pantallas de
  otras historias y docs/10 §Pantallas anchas no la resuelve para un formulario solo.
- **Detección:** las capturas `.desktop.png` de las pantallas de un solo formulario en `(app)`.
- **Se reabre cuando:** llegue la próxima pantalla de un solo formulario en `(app)`; ahí se decide
  en docs/10 si esas pantallas usan el volante.
- **Origen:** revisión de diseño, historia #10 (ronda 1).

## KL-021 — Desde 1024 px, el aviso flotante se ancla a la ventana y no a la hoja

- **Área:** diseño · pantallas anchas.
- **Qué:** el `Toast` se posiciona a un gutter del borde izquierdo de la ventana, una regla
  anterior a la hoja. En pantallas anchas queda montado sobre el borde de tinta de la hoja, mitad
  adentro y mitad sobre la pared.
- **Por qué se acepta:** es de la primitiva `ui/` y la usan todas las pantallas; no la introduce
  esta historia, que solo suma avisos nuevos.
- **Detección:** cualquier captura `.desktop.png` con un aviso abierto, por ejemplo
  `mi-perfil-guardado-telefono.desktop.png`.
- **Se reabre cuando:** se toque la primitiva o la hoja: desde 1024 px el aviso va a un gutter del
  borde de la hoja, y se corrige la fila `Toast` de docs/10.
- **Origen:** revisión de diseño, historia #10 (ronda 2).

## KL-022 — La fila etiquetada de un formulario se escribe a mano en cada campo

- **Área:** código · componentes.
- **Qué:** el par etiqueta y renglón (`<label>` con la etiqueta en `--color-ink-muted` y el `Input`
  adentro) está copiado en cinco lugares: los campos del perfil, la localidad, el correo del
  ingreso, y ahora el número y el código del teléfono. Tres llevan además una ayuda atada con
  `aria-describedby` afuera del `<label>`: el número, el código y, desde 2026-09-23, el nombre que
  trajo Google.
- **Por qué se acepta:** sacarlo a una primitiva cambia `ui/` y los formularios de dos historias ya
  mergeadas; no es de esta. Las copias son idénticas, así que hoy no divergen.
- **Detección:** buscar `<label className="flex flex-col gap-2">` en `src/components`.
- **Se reabre cuando:** un sexto formulario la necesite, o cambie la forma de la etiqueta en
  docs/10: ahí se agrega `label` a `Input` y se reemplazan todas.
- **Origen:** revisión de diseño, historia #10 (ronda 3).

## KL-023 — Una cuenta de Google sin foto ofrece la que dibuja Google

- **Área:** alta · foto.
- **Qué:** cuando la cuenta de Google no tiene foto, Google igual entrega una que genera él (una
  letra sobre un color, o una silueta en cuentas viejas). `PhotoSuggestion` la ofrece como «tu foto
  de Google», y si la persona la elige queda en lugar de nuestras iniciales.
- **Por qué se acepta:** la dirección de la foto no dice si es real o generada, así que no hay forma
  confiable de distinguirlas; y la persona la ve antes de elegirla, con «Usar esta foto» como único
  camino: nunca queda puesta sola (FR-030b).
- **Detección:** entrar con una cuenta de Google sin foto y llegar a /completar-perfil.
- **Se reabre cuando:** Google marque en los datos de la cuenta que la foto es la generada, o
  alguien la elija sin querer y lo cuente.
- **Origen:** revisión de diseño del alta con datos de Google (2026-09-23).

## KL-025 — Un enlace ya usado, con la sesión abierta, dice «El enlace no sirve»

- **Área:** ingreso · enlace por correo.
- **Qué:** con la sesión abierta, abrir de nuevo un enlace ya usado muestra «El enlace no sirve» y
  ofrece otro enlace, en vez de llevar de vuelta adentro.
- **Por qué se acepta:** la persona ya está adentro y vuelve por «Mi perfil» en el encabezado. Es
  una pantalla confusa, no un corte del embudo, y no expone datos.
- **Detección:** entrar con un enlace y abrirlo otra vez con la sesión abierta (US1-AS6).
- **Se reabre cuando:** se toque la pantalla del enlace, o alguien cuente que se confundió ahí.
- **Origen:** aceptación de la historia #9 (US1-AS6, severidad baja).

## KL-026 — Al guardar el perfil con campos vacíos, el foco no va al primero que falta

- **Área:** alta · accesibilidad.
- **Qué:** se muestran los errores pero el foco se queda en el botón.
- **Por qué se acepta:** en el teléfono los errores se ven justo arriba del botón. Afecta sobre todo
  a lectores de pantalla; no corta ningún paso ni expone nada.
- **Detección:** guardar el perfil vacío y ver dónde queda el foco (US2-AS4).
- **Se reabre cuando:** se toque el manejo de errores de los formularios, o una revisión de
  accesibilidad lo marque.
- **Origen:** aceptación de la historia #9 (US2-AS4, severidad baja).

## KL-027 — El tope de pedidos de enlace cuenta la espera en segundos

- **Área:** ingreso · enlace por correo.
- **Qué:** el tope de 5 pedidos por hora dice «Vas a poder pedir otro en 3274 segundos» en lugar de
  minutos.
- **Por qué se acepta:** solo lo ve quien ya pidió 5 veces en una hora. Se entiende mal, pero no
  bloquea: queda el enlace ya enviado, o Google.
- **Detección:** pedir el enlace seis veces en una hora con el mismo correo.
- **Se reabre cuando:** se toque ese mensaje o el tope, o alguien lo cuente.
- **Origen:** aceptación de la historia #9 (fricción 1, severidad baja).

## KL-028 — «Ese número está en otra cuenta» no ofrece entrar con la otra cuenta (resuelta)

- **Área:** verificación · teléfono.
- **Qué:** la pantalla explica que se puede entrar con la otra cuenta, pero solo ofrece «Verificar
  otro número»: para entrar con la otra cuenta hay que salir por cuenta propia.
- **Por qué se acepta:** no corta un paso del embudo ni de la verificación: siempre se puede
  verificar otro número, y el camino alternativo está escrito. No expone datos. Pega en un caso
  raro (número reasignado o dos cuentas de la misma persona).
- **Detección:** verificar en una cuenta un número ya verificado en otra.
- **Se reabre cuando:** se toque esa pantalla o la salida de la sesión, o alguien cuente que se
  trabó ahí.
- **Origen:** aceptación de la historia #10 (fricción, severidad baja).
- **Resuelta:** historia #25 (2026-09-25). La pantalla ofrece «Entrar con esa cuenta», que cierra
  esta sesión y lleva a «Entrar» con el destino, y «Es mío y no puedo entrar a esa cuenta»; el texto
  que explicaba el camino a mano se borró.

## KL-029 — El correo de «perdiste tu teléfono» se intenta una sola vez

- **Área:** verificación · cuenta que pierde el número.
- **Qué:** cuando otra cuenta se queda con el número, el correo a la cuenta anterior sale una vez,
  después de responder y con 60 s de tope. Si el servicio de correo falla, no se vuelve a intentar.
- **Por qué se acepta:** el aviso de «Mi perfil» queda guardado y se ve al entrar, así que la
  persona se entera igual, más tarde. No corta un paso ni expone datos. Reintentar pide un proceso
  diario, que llega recién con la nube en M5.
- **Detección:** el error del envío en el log del servidor; una persona que cuenta que vio el aviso
  en su perfil sin haber recibido el correo.
- **Se reabre cuando:** exista el proceso diario de M5, o el servicio de correo falle en uso real.
- **Origen:** etapa Spec de la historia #25 (asunción «Un solo intento de correo»).

## KL-030 — Dos reglas de «quedarme con el número» no tienen prueba automática

- **Área:** verificación · confirmación de quedarse con el número.
- **Qué:** que cada momento nuevo de medición se dispare (FR-014a) y que, si la sesión vence en la
  confirmación, al volver con la misma cuenta se regrese a ella (FR-009c) no tienen un test que los
  demuestre. Se comprueban recorriendo la app.
- **Por qué se acepta:** la medición todavía solo escribe al log del servidor (M5), y reproducir el
  vencimiento de la sesión en Playwright pide manipular cookies de Supabase para un caso raro. Si
  fallan, la persona vuelve a pedir un código; no se corta la verificación ni se expone nada.
- **Detección:** la recorrida de `acceptance-qa` sobre `main`: un momento que no aparece en el log
  `[medición]`, o una sesión vencida que no vuelve a la confirmación.
- **Se reabre cuando:** la medición llegue a la herramienta de M5, o `acceptance-qa` encuentre una
  de las dos rotas.
- **Origen:** etapa Spec de la historia #25.

## KL-031 — El correo de «perdiste tu teléfono» usa la plantilla genérica

- **Área:** correo · cuenta que pierde el número.
- **Qué:** el correo reutiliza la plantilla del enlace de la historia #9: tipografía del sistema,
  botón negro plano y una línea fina, sin ningún recurso del cartel. Es el mensaje más alarmante que
  manda el producto y se ve como el de cualquier servicio.
- **Por qué se acepta:** el correo dice lo que tiene que decir y el botón lleva a «Mi perfil». Es
  identidad, no un corte del embudo ni una exposición de datos, y cambiarlo toca también el correo
  del enlace, que no es de esta historia.
- **Detección:** abrir el correo en `.artifacts/mail/` o en la bandeja de la cuenta del servicio.
- **Se reabre cuando:** se defina el nombre y el dominio (el correo lleva la marca), o se toque
  cualquiera de las dos plantillas.
- **Origen:** revisión de la historia #25 (hernan-proxy, H4, severidad baja).

## KL-11-1 — Una imagen de identidad borrada puede seguir en un respaldo de la base

- **Área:** verificación de identidad · retención de las imágenes.
- **Qué:** las fotos de la cédula y la selfie se borran de la base en la misma transacción que
  cierra el pedido, pero en un plan pago de Supabase los respaldos diarios guardan la base 7 días:
  una imagen borrada seguiría existiendo en un respaldo hasta que ese respaldo vence.
- **Por qué se acepta:** hoy el sitio corre en local y el plan gratuito de la nube no tiene
  respaldos, así que no hay ningún respaldo que la guarde. Nadie del producto puede leer un respaldo.
- **Detección:** revisar la política de respaldos del proyecto en la nube antes de subir la base.
- **Se reabre cuando:** la base suba a la nube (M5) o se pase a un plan con respaldos. Opciones: un
  plan sin respaldos de esas tablas, o decir en el consentimiento el plazo del respaldo.
- **Origen:** plan de la historia #11 (§Riesgos).

## KL-11-2 — Con la aplicación apagada, el correo de vencimiento espera o se pierde

- **Área:** verificación de identidad · vencimiento.
- **Qué:** la base vence los pedidos y borra sus imágenes sola, cada 5 minutos, esté o no la
  aplicación levantada. El correo de vencimiento, en cambio, lo manda la aplicación cuando la base
  la llama: si está apagada, el aviso espera a la vuelta siguiente, y pasado un día se descarta sin
  mandarse. Con él se pierde el momento «pedido vencido» de la medición.
- **Por qué se acepta:** lo que protege la privacidad (el borrado) no depende de la aplicación. La
  persona ve «Vencido» igual al entrar, con qué hacer. Hasta M5 todo corre en local, donde apagar
  la aplicación es lo normal.
- **Detección:** filas de `identity_expirations` con `notice_pending` en falso sin su correo en
  `.artifacts/mail/`, o una persona que cuenta que vio «Vencido» sin haber recibido el correo.
- **Se reabre cuando:** la aplicación corra en la nube (M5), donde siempre está levantada.
- **Origen:** plan de la historia #11 (§Riesgos).

## KL-11-3 — Un nivel 2 ya dado no se puede sacar desde el sitio

- **Área:** verificación de identidad · administración.
- **Qué:** si después de aprobar una identidad se descubre un fraude, quien administra no tiene
  cómo sacarle el nivel 2 a esa cuenta desde el sitio. La aprobación queda firme.
- **Por qué se acepta:** sacar un nivel o suspender una cuenta es del panel de administración
  (`docs/03` §6: reportes, suspender usuarios), que no es esta historia. Mientras tanto no hay
  publicaciones ni solicitudes que el nivel 2 habilite, y el equipo puede corregirlo a mano en la
  base.
- **Detección:** un reporte o una revisión que encuentra una identidad aprobada que no correspondía.
- **Se reabre cuando:** se construya la historia de reportes y suspensión del panel de
  administración, que debe incluir quitar el nivel 2.
- **Origen:** etapa Spec de la historia #11 (asunción «Revocar un nivel 2 ya dado»).

## KL-11-4 — Si la única persona que administra pide su propia verificación, el pedido vence

- **Área:** verificación de identidad · administración.
- **Qué:** nadie resuelve su propio pedido. Si hay una sola persona que administra y tiene un
  pedido propio, nadie puede resolverlo y vence a los 7 días como cualquier otro.
- **Por qué se acepta:** hoy el sitio corre en local y no hay personas reales esperando. El equipo
  designa a más de una persona que administra antes de la beta.
- **Detección:** un pedido de alguien que figura en `public.admins` que vence sin resolverse, o una
  sola fila en `public.admins`.
- **Se reabre cuando:** se prepare la beta, si para entonces sigue habiendo una sola persona que
  administra.
- **Origen:** etapa Spec de la historia #11 (asunción «Una sola persona que administra»).

## KL-35-1 — Reintentar después de un guardado colgado espera a que el primero termine

- **Área:** perfil · guardar en el alta y al editar.
- **Qué:** si el sitio no contesta, a los 30 s el botón se libera y aparece el aviso (FR-003), pero
  el pedido colgado sigue abierto: Next manda las acciones de servidor de a una, así que el
  reintento sale recién cuando el navegador da por perdido el primero. Mientras tanto el reintento
  vuelve a mostrar el aviso a los 30 s. Lo escrito sigue en pantalla todo el tiempo.
- **Por qué se acepta:** no se pierde nada ni se expone nada, y el reintento termina saliendo solo.
  Una acción de servidor no se puede cancelar desde el cliente; saltarse la cola pide armar el
  pedido a mano, fuera de la API de Next.
- **Detección:** dos o más `profile_save_failed` seguidos con motivo `no_response` en la misma
  visita, seguidos de un guardado recuperado.
- **Se reabre cuando:** Next permita cancelar una acción de servidor, o la medición muestre
  visitas con varios `no_response` seguidos que no terminan en guardado.
- **Origen:** revisión de la historia #35 (code-reviewer, C1).

## KL-35-2 — Si la sesión se cerró en otra pestaña, guardar lleva a entrar sin aviso

- **Área:** perfil · guardar en el alta y al editar.
- **Qué:** cuando las cookies de la sesión ya no están pero la de la visita sí (por ejemplo, la
  persona salió en otra pestaña), la respuesta del guardado trae una cookie nueva, Next vuelve a
  dibujar la pantalla y la pantalla redirige a entrar en vez de mostrar el aviso de sesión cerrada
  (FR-008). En el alta el borrador sobrevive y lo escrito vuelve al entrar; al editar, los cambios
  sin guardar se pierden sin la advertencia de salir.
- **Por qué se acepta:** no corta ningún paso del funnel ni de la verificación, no expone nada, y
  el caso pide salir a propósito en otra pestaña con cambios a medias en esta. Arreglarlo toca el
  proxy o la autenticación, que es un cambio de otro alcance.
- **Detección:** una persona que lo cuenta; en la medición, llegadas a `/entrar` desde
  `/mi-perfil/editar` sin un `profile_save_failed` antes.
- **Se reabre cuando:** una historia toque el proxy o el manejo de la sesión, o editar el perfil
  pase a tener más que cuatro campos.
- **Origen:** construcción de la historia #35 (verificación de FR-008 con capturas).

## KL-35-3 — Las capturas de foco muestran el hover y no el anillo de foco

- **Área:** herramientas · capturas para la revisión de diseño.
- **Qué:** una captura `.focus` hecha a mano en la revisión del aviso de guardado salió idéntica
  byte a byte a la `.hover`: el mouse pasa por encima y después el foco se pone por código, y ese
  foco no activa `:focus-visible`, así que el anillo de 2 px no aparece. `scripts/walk.mjs` hace
  lo mismo en su captura combinada de hover y foco. La regla global de `:focus-visible` existe en
  `globals.css`.
- **Por qué se acepta:** no corta ningún paso del funnel ni de la verificación, no expone nada y no
  toca la performance: la pantalla tiene su anillo de foco; lo que falta es la prueba en la captura.
- **Detección:** una captura `.focus` con el mismo hash que su `.hover`; en la revisión de diseño,
  un anillo de foco que no se ve en ninguna captura.
- **Se reabre cuando:** una revisión de diseño necesite ver el foco con teclado, o se toque
  `scripts/walk.mjs`; ahí el foco se lleva con `Tab` (`page.keyboard.press('Tab')`) en una captura
  aparte de la de hover.
- **Origen:** revisión de la historia #35 (design-reviewer, D5).

## KL-35-4 — Con la sesión cerrada al guardar, la cabecera sigue diciendo «Mi perfil»

- **Área:** perfil · aviso de sesión cerrada, en el alta y al editar.
- **Qué:** cuando un guardado encuentra la sesión cerrada, el aviso dice «Se cerró tu sesión», la
  tirita pasa a «Entrar de nuevo» y el pie deja de ofrecer las salidas de la cuenta, pero la
  cabecera sigue mostrando «Mi perfil», la marca de quien tiene sesión. `AccountMenu` se dibuja en
  el servidor al abrir la pantalla y no se entera de que la sesión se cerró después. La pantalla
  dice dos cosas opuestas sobre la sesión.
- **Por qué se acepta:** no corta ningún paso del funnel ni de la verificación, no expone nada y no
  toca la performance. Tocar «Mi perfil» lleva a entrar, que es el mismo paso que la tirita. Que la
  cabecera escuche lo que pasa en el formulario pide un estado de sesión compartido del lado del
  cliente, que hoy no existe.
- **Detección:** las capturas `*.aviso-sesion*` de `.artifacts/perfil-no-pierde-escrito/`, o una
  persona que cuenta que el sitio le decía a la vez que tenía y que no tenía sesión.
- **Se reabre cuando:** la cabecera pase a saber de la sesión del lado del cliente, o una historia
  muestre en la cabecera algo más que el enlace (el nombre, la foto, el nivel).
- **Origen:** revisión de la historia #35 (design-reviewer, D3 y D5; hernan-proxy, H4).

## KL-35-5 — Al editar con la sesión cerrada, los cambios se vuelven a hacer después de entrar

- **Área:** perfil · editar con la sesión cerrada.
- **Qué:** si la sesión se cierra mientras la persona edita su perfil, el aviso le dice «Entrá de
  nuevo y volvé a hacerlos»: lo que cambió sigue en pantalla pero no sobrevive a entrar de nuevo.
  El alta sí lo conserva, porque tiene borrador; la edición no lo tiene (FR-008, FR-018).
- **Por qué se acepta:** no corta ningún paso del funnel ni de la verificación, no expone nada y no
  toca la performance. Son cuatro campos, el caso pide que la sesión venza en medio de una edición,
  y el aviso lo dice antes, sin prometer lo que no pasa. Es lo que pide la spec.
- **Detección:** en la medición, un `profile_save_failed` de edición seguido de una llegada a
  `/entrar` desde `/mi-perfil/editar`; o una persona que cuenta que tuvo que reescribir sus cambios.
- **Se reabre cuando:** editar el perfil pase a tener más que cuatro campos, o la edición gane un
  borrador por otra razón.
- **Origen:** revisión de la historia #35 (hernan-proxy, H2 y H4).

## KL-35-6 — A 1280 px en el alta, el diálogo de salir mide lo mismo que la hoja

- **Área:** diseño · `Dialog` sobre la hoja angosta del alta.
- **Qué:** en `/completar-perfil` a 1280 px, la hoja y el diálogo de salir con una foto elegida
  miden lo mismo de ancho (de x=320 a x=960), así que los bordes del diálogo caen sobre los de la
  hoja y se lee como una franja de la hoja y no como una nota pegada encima (docs/10 §Dialog). En la
  hoja de 1024 px de «Editar mi perfil» sí se lee como nota.
- **Por qué se acepta:** no corta ningún paso del funnel ni de la verificación, no expone nada y no
  toca la performance. El ancho viene de la primitiva `ui/dialog` (`max-w-[var(--measure)]`), que
  esta historia no cambia; cambiarla toca todos los diálogos del sitio.
- **Detección:** la captura `completar-perfil.salir-con-foto.desktop.png`, o cualquier diálogo
  abierto sobre una hoja tan ancha como `--measure`.
- **Se reabre cuando:** una historia toque la primitiva `Dialog` o el ancho de la hoja del alta.
- **Origen:** revisión de la historia #35 (hernan-proxy, H5).

## KL-35-7 — Las capturas de página completa con un diálogo abierto cortan el velo

- **Área:** herramientas · capturas para la revisión de diseño.
- **Qué:** en una captura de página completa con un diálogo abierto, el velo oscuro cubre solo la
  parte de la página que estaba a la vista: es fijo y la captura cose varias vistas. En
  `mi-perfil-editar.aviso-sesion.salir.desktop.png` el velo arranca en y≈221, y en la del teléfono
  queda una franja blanca abajo. En el producto el velo cubre toda la ventana.
- **Por qué se acepta:** no corta ningún paso del funnel ni de la verificación, no expone nada y no
  toca la performance: es la captura, no la pantalla. Pero se lee como un velo roto y puede engañar
  a un revisor.
- **Detección:** una captura con un diálogo abierto en la que el velo no llega a los bordes.
- **Se reabre cuando:** se toque `scripts/walk.mjs` o se agreguen capturas de diálogos al driver;
  ahí un diálogo abierto se captura solo en la vista, sin página completa.
- **Origen:** revisión de la historia #35 (design-reviewer, D10).

## KL-53-1 — Las fotos de un intento sin terminar se purgan solo cuando alguien vuelve a usar el sitio

- **Área:** animales · fotos · purga.
- **Qué:** una foto que subió para una publicación que no terminó (o que se sacó al editar y no se
  pudo borrar en el momento) se borra en la purga, que corre dentro de subir una foto, publicar y
  guardar, de cualquier persona. Si nadie hace ninguna de esas tres cosas, una foto en espera
  puede quedar más de 24 horas (FR-020 de la historia #53: «en la primera limpieza después de
  cumplir 24 horas»).
- **Por qué se acepta:** no hay Cron hasta la beta (`07-stack.md`, decisión 2026-09-17). Mientras
  tanto la foto no la ve nadie más —el bucket es privado y solo la dueña firma su carpeta— y se va
  con la cuenta, que barre la carpeta entera.
- **Detección:** `select count(*) from pet_photos where pet_id is null and (released_at is not
  null or staged_at < now() - interval '24 hours')` da más que cero en una base con uso.
- **Se reabre cuando:** llegue el Cron diario de la beta, que llama a la misma purga
  (`purgePetPhotos`).
- **Origen:** plan de la historia #53 (research R13).

## KL-53-2 — Un `Dialog` que se vuelve a abrir mientras se cierra queda debajo de su velo

- **Área:** diseño · primitivas · `Dialog`.
- **Qué:** si un `Dialog` se cierra y se vuelve a abrir antes de que termine su fundido de salida
  (`--dur-base`, 200 ms), el velo queda encima del contenido y los botones no se pueden tocar.
  Apareció al probar el guardia del volver de la historia #53 con toques automáticos: «Seguir
  editando» y enseguida volver atrás.
- **Por qué se acepta:** a mano no se reproduce: nadie toca un botón y vuelve atrás en menos de
  200 ms, y cerrar el aviso con la cruz o tocar afuera lo arregla. La primitiva es de F00 y la usan
  todas las pantallas; cambiarla no es de esta historia.
- **Detección:** una prueba que cierra un `Dialog` y lo reabre sin esperar falla porque «el velo
  intercepta el toque».
- **Se reabre cuando:** alguien lo vea a mano, o cuando una historia toque la primitiva `Dialog`.
- **Origen:** construcción de la historia #53.

## KL-53-3 — La ficha no detecta el contacto disfrazado ni una dirección (resuelta)

- **Área:** animales · regla de contacto.
- **Qué:** el nombre y la descripción rechazan teléfonos, correos, enlaces y usuarios de redes,
  pero no el número escrito en palabras, el correo con «arroba» ni una dirección («vive en Rivera y
  Soca»). La ficha avisa junto a la descripción que no lleve contacto ni dirección.
- **Por qué se acepta:** no hay forma confiable de separar «vive en Rivera y Soca» de «la
  rescatamos en Rivera y Soca», y la regla frena lo común, no a quien quiere esquivarla. Desde la
  historia #57 las fichas son visibles sin ingresar, pero hasta la beta el sitio corre en local y
  no lo ve nadie de afuera; la revisión a mano de publicaciones nuevas (docs/03 §6) es el mecanismo
  que lo baja (decisión 2026-09-28, docs/03 §3).
- **Detección:** publicar un animal con «noventa y nueve, uno dos tres…» o «juan arroba gmail punto
  com» en la descripción: se guarda sin aviso y la ficha lo muestra.
- **Se reabre cuando:** llegue la revisión de publicaciones nuevas de la historia #59, que la
  resuelve antes de la beta.
- **Origen:** spec de la historia #53 (§Assumptions «Contacto disfrazado y direcciones»,
  spec-adversary).
- **Resuelta:** historia #59 (2026-09-30). Cada publicación nueva o editada entra a la cola de
  «Publicaciones por revisar», y quien administra la da de baja con el motivo «datos de contacto o
  una dirección en las fotos o en la descripción». La regla del formulario sigue igual: frena lo
  común, y la revisión a mano baja lo que la esquiva.

## KL-53-4 — Las pantallas de «Mis animales» no pasan por Lighthouse y la zona con sesión pesa 160 KB

- **Área:** animales · performance.
- **Qué:** `.lighthouserc.json` audita solo la portada, porque Lighthouse CI no sabe ingresar (la
  misma causa que KL-018). `/mis-animales`, `/mis-animales/publicar` y `/mis-animales/[id]/editar`
  se miden en el e2e (`tests/e2e/publicar-rendimiento.spec.ts` y `tests/e2e/support/web-vitals.ts`):
  LCP de `/mis-animales` con red y CPU de teléfono, 220 ms, CLS 0. El JS de primera carga, medido en
  el navegador contra `next start`, es 160 KB comprimido, por encima de los 150 KB del presupuesto.
  `/mi-perfil` carga los mismos chunks y el mismo peso: es de toda la zona con sesión, no de estas
  rutas.
- **Por qué se acepta:** ninguna de estas pantallas es del funnel (ver ficha → solicitar → aceptar →
  adoptar), el LCP medido está muy por debajo de 2,5 s y sumar rutas a Lighthouse cambia una
  compuerta, que necesita `reglas-aprobadas`, y además no sirve mientras Lighthouse no pueda ingresar.
- **Detección:** en DevTools, pestaña Red con «JS» y caché deshabilitada, la suma de lo transferido al
  abrir `/mis-animales` contra `pnpm start`.
- **Se reabre cuando:** una pantalla del funnel viva en la zona con sesión (solicitar una adopción),
  o cuando Lighthouse CI sepa ingresar.
- **Origen:** plan y construcción de la historia #53 (speckit-analyze C1, T057).

## KL-53-6 — Los plurales y las variables se arman a mano en vez de con ICU

- **Área:** i18n · formularios.
- **Qué:** los mensajes con número vienen en dos claves (`chars_left_one` / `chars_left_many`,
  `photos_max_*`, `locality_suggestions_*`…) y las variables se llenan con `.replace('{x}')` en el
  cliente (`countText`, `pet-form.tsx`, `pet-photo-tile.tsx`, `pet-photos-field.tsx`,
  `publish-progress.tsx`, `pet-form-dialogs.tsx`), contra la regla de ICU de `docs/06-i18n.md`. La
  regla del plural (`count === 1`) está escrita en el código.
- **Por qué se acepta:** es el patrón que ya usaba `main` antes de la historia
  (`lib/i18n/plural.ts`, el perfil, la verificación); pasarlo a ICU toca todos los namespaces y va
  en un solo cambio transversal, con un formateador compartido para los textos que solo conoce el
  cliente. En español rioplatense las dos formas alcanzan, así que hoy no se lee nada mal.
- **Detección:** `grep -rn "\.replace('{" src` y las claves `_one` / `_many` de `messages/es.json`.
- **Se reabre cuando:** llegue un segundo idioma, o una historia necesite un plural que no sea
  uno / muchos.
- **Origen:** code-reviewer de la historia #53 (D3).

## KL-53-7 — La etiqueta de cada campo se escribe a mano en cada formulario

- **Área:** formularios · componentes.
- **Qué:** `<span className="text-sm text-ink-muted">` como etiqueta de campo está copiado en
  `zone-fields`, `locality-field`, `profile-fields`, `email-link-form`, `phone-number-form`,
  `code-field`, `age-field` y `pet-name-field`. La historia #53 sumó tres.
- **Por qué se acepta:** la deuda es anterior a la historia y la extracción toca formularios del
  ingreso, el teléfono y el perfil, que la historia no cambia. Hoy las copias son idénticas, así que
  no se ve distinto en ningún lado.
- **Detección:** `grep -rn 'text-sm text-ink-muted' src/components`.
- **Se reabre cuando:** una etiqueta cambie de aspecto, o la próxima historia que agregue un campo.
- **Origen:** design-reviewer de la historia #53 (D17).

## KL-53-9 — Las capturas de la pared se juzgaron con degradés en vez de fotos de animales

- **Área:** capturas · revisión de diseño.
- **Qué:** en las capturas de «Mis animales» y de editar, cada foto es un degradé marrón a verde,
  así que la cinta y la inclinación de `PetCard` se juzgaron sobre color liso.
- **Por qué se acepta:** el seed no trae fotos de animales y no hay imágenes con licencia en el
  repo; la forma, la cinta y el recorte 4:5 se ven igual con cualquier imagen.
- **Detección:** abrir `.artifacts/publicar-animal/mis-animales.png` (o la carpeta de la última revisión).
- **Se reabre cuando:** el seed tenga fotos reales de animales (`scripts/seed-pets.mjs` con fotos de
  dominio público, la tarea opcional de la historia #57 que no entró). La ficha pública ya existe
  (#57) y sus capturas también se juzgaron con fotos de color liso o degradé.
- **Origen:** design-reviewer de la historia #53 (H4).

## KL-53-10 — El título de pantalla se copia en cada página

- **Área:** páginas · componentes.
- **Qué:** `<h1 className="afiche text-2xl text-ink">` está copiado en diez lugares (mi-perfil,
  revisión, completar-perfil, entrar, las vistas de identidad y verificación, «Mis animales» y el
  formulario de un animal).
- **Por qué se acepta:** la mayoría de las copias son anteriores a la historia; la historia bajó las
  suyas a dos al unir publicar y editar en `PetFormScreen`. Extraerlo es una primitiva nueva de
  `docs/10`, que es una decisión del sistema de diseño, no de esta historia.
- **Detección:** `grep -rn 'afiche text-2xl text-ink' src`.
- **Se reabre cuando:** el título de pantalla cambie de aspecto, o `docs/10` sume la primitiva.
- **Origen:** design-reviewer de la historia #53 (D10).

## KL-35-1 — Un reintento repetido cuenta dos veces la recuperación del perfil

- **Área:** perfil · guardado que se recupera después de un corte.
- **Qué:** cuando un reintento llega pero su respuesta se pierde y la persona reintenta de nuevo,
  «Guardado del perfil recuperado» se registra dos veces en la misma visita, en vez de una.
- **Por qué se acepta:** solo afecta la medición: infla la proporción de visitas recuperadas de
  SC-006. No corta ningún paso del embudo ni de la verificación, porque el alta se completa y se
  cuenta una vez. No muestra datos de contacto ni de identidad y no toca el presupuesto de
  performance.
- **Detección:** cortar la red justo después de que llegue un reintento de guardado del perfil,
  reintentar otra vez y contar los eventos «Guardado del perfil recuperado» de esa visita.
- **Se reabre cuando:** SC-006 se use para decidir algo, o la medición del perfil pase a
  deduplicar eventos por visita.
- **Origen:** aceptación de la historia #35 (criterio US4-AS4, severidad baja).

## KL-53-11 — Recargar el formulario de publicar con fotos manda a «Mis animales» sin aviso

- **Área:** publicar un animal · recarga a mitad del formulario.
- **Qué:** al recargar el formulario de publicar con fotos elegidas (o el de editar con cambios),
  la página vuelve atrás en el historial y deja a la persona en «Mis animales» sin aviso, en vez de
  mostrar el formulario con lo escrito recuperado.
- **Por qué se acepta:** lo escrito no se pierde: tocar «Publicar un animal» de nuevo lo trae, y no
  se publica nada por error. No corta ningún paso del embudo de adopción ni de la verificación, no
  muestra datos de contacto ni de identidad y no toca el presupuesto de performance. Pone en riesgo
  la métrica de rescatistas que publican sin ayuda (`docs/03` §Métricas de éxito): en el teléfono,
  una recarga con fotos parece haberlo perdido todo.
- **Detección:** entrar al formulario de publicar como una persona sembrada, elegir fotos, recargar
  y mirar a qué pantalla lleva y si avisa algo.
- **Se reabre cuando:** se toque el guardia del volver o la recuperación del borrador de publicar,
  o la métrica de rescatistas que publican sin ayuda muestre abandono en ese paso.
- **Origen:** aceptación de la historia #53 (criterio US3-AS3, severidad media).

## KL-53-12 — En el teléfono, una recarga a mitad de la carga con fotos saca a la rescatista del formulario

- **Área:** publicar un animal · recarga en el teléfono.
- **Qué:** una recarga a mitad de la carga con fotos saca a la rescatista del formulario sin
  decirle dónde quedó lo que escribió.
- **Por qué se acepta:** es la misma causa que KL-53-11 y va con ella. Pone en riesgo
  «rescatistas que publican más de un animal por su cuenta» (`docs/03` §Métricas de éxito). No
  corta ningún paso del embudo ni de la verificación y no muestra datos.
- **Detección:** el mismo caso de KL-53-11, a 390 px.
- **Se reabre cuando:** se reabra KL-53-11.
- **Origen:** aceptación de la historia #53 (criterio «friction», severidad media).

## KL-80-1 — A 1280 px, las pantallas de estado de la verificación dejan media hoja en blanco

- **Área:** verificación de identidad y «Mi perfil» · pantallas anchas.
- **Qué:** a 1280 px, el estado del pedido (`/verificar-identidad`) y «Mi perfil» son una columna
  de ~640 px sobre la hoja de trabajo de 1024 px del grupo `(app)`: alrededor del 40 % de la
  derecha queda en blanco. `docs/11` §Identidad y pantallas lo cuenta como rechazo. KL-020 lo
  acepta solo para las pantallas de un formulario, no para estas.
- **Por qué se acepta:** ya pasaba antes de esta historia, que no toca ningún JSX. No corta el
  funnel ni la verificación, no expone datos y no toca el presupuesto de performance. Es una
  decisión de la zona `(app)`, como KL-020, y no de una historia de un solo motivo.
- **Detección:** las capturas `.desktop.png` de `verificar-identidad` y `mi-perfil` en cualquier
  revisión de diseño.
- **Se reabre cuando:** una historia rehaga el estado del pedido o «Mi perfil» (la chapita de #12
  en KL-11-5 es la primera), o se decida en `docs/10` §Pantallas anchas cómo ocupa la hoja una
  pantalla de estado. Esa historia resuelve esta entrada junto con KL-020.
- **Origen:** revisión de diseño de la historia #80 (hallazgo H2, fuera de alcance).

## KL-80-2 — En «Sin intentos», el consejo queda tres párrafos después del motivo

- **Área:** verificación de identidad · estado del pedido con el tope de rechazos.
- **Qué:** en «Sin intentos», «Motivo: …» va arriba y su consejo («usá tu cédula vigente») al
  final, después del aviso de que las imágenes se borraron y de la cuenta de intentos. En
  «Rechazado» el consejo va pegado al motivo. La persona tiene que juntar las dos mitades para
  saber qué corregir.
- **Por qué se acepta:** el orden viene de #11 y esta historia no cambia ninguna pantalla. La
  persona ve el motivo y el consejo correctos (el objetivo de #80); no corta la verificación, que
  en ese estado espera la fecha de reintento, no expone datos ni toca la performance.
- **Detección:** la captura `verificar-identidad-sin-intentos` a 390 y 1280 px, o personas que
  vuelven del tope y repiten el mismo motivo de rechazo.
- **Se reabre cuando:** una historia toque la vista del estado del pedido; ahí el consejo pasa a ir
  junto al motivo, como en «Rechazado».
- **Origen:** revisión de diseño de la historia #80 (hallazgo H1, fuera de alcance).

## KL-80-3 — En la revisión, dos rechazos del mismo día repiten la fecha y solo el orden dice cuál es el último

- **Área:** cola de revisión · pedido abierto · rechazos anteriores.
- **Qué:** con dos rechazos el mismo día, la lista muestra «28 de septiembre de 2026: No coincide»
  sobre «28 de septiembre de 2026: No se lee». El orden es el correcto (el último arriba), pero
  nada más que el orden le dice a quien revisa qué se le dijo a la persona la última vez.
- **Por qué se acepta:** el orden correcto es lo que pide la decisión de `docs/03` §1
  (2026-09-28) y ya está. Marcar el último es una lectura de gusto sin criterio registrado. No
  corta la verificación, no expone datos ni toca la performance.
- **Detección:** la captura del pedido abierto con dos rechazos del mismo día, o quien revisa
  preguntando cuál fue el último.
- **Se reabre cuando:** quien revisa confunda el último rechazo, o una historia rehaga la vista del
  pedido en la cola.
- **Origen:** revisión de diseño de la historia #80 (hallazgo H2 de la segunda revisión, fuera de
  alcance).

## KL-12-1 — El perfil público no pasa por Lighthouse

- **Área:** perfil público · presupuesto de performance.
- **Qué:** `pnpm lighthouse` no mide `/perfil/<id>`: sumar la ruta a `.lighthouserc.json` necesita
  la etiqueta `reglas-aprobadas`. El presupuesto del perfil (LCP < 2,5 s y JS de la página
  < 150 KB con 50 avales, SC-006) se mide con Playwright en `tests/e2e/perfil-rendimiento.spec.ts`.
- **Por qué se acepta:** el presupuesto se mide y hoy se cumple (152 KB contra 153.600 bytes), así
  que no se rompe; solo falta el puntaje de Lighthouse (accesibilidad, SEO, buenas prácticas) sobre
  esta pantalla. No corta el funnel ni la verificación y no muestra datos.
- **Detección:** buscar `/perfil/` en `.lighthouserc.json`.
- **Se reabre cuando:** Hernán ponga `reglas-aprobadas` para sumar la ruta, o el JS del perfil se
  acerque al tope en el e2e.
- **Origen:** etapa Spec de la historia #12 (plan, Constitution Check VII).

## KL-12-2 — El peor caso del perfil público con foto no se mide

- **Área:** perfil público · LCP.
- **Qué:** Eva, la persona sembrada con 50 avales que se usa para medir el perfil, no tiene foto,
  porque el seed no puede guardar archivos. El LCP del perfil con foto y muchos avales no se mide.
- **Por qué se acepta:** la foto se sirve chica y con caché privada de 5 minutos, y el LCP sin foto
  queda lejos del tope. No corta el funnel ni la verificación y no muestra datos.
- **Detección:** subir una foto a una cuenta con 50 avales y medir el LCP de su perfil a 390 px.
- **Se reabre cuando:** el seed pueda guardar fotos, o una medición real del perfil pase de 2,5 s.
- **Origen:** `/speckit-analyze` de la historia #12 (hallazgo LOW aceptado).

## KL-12-3 — La cabecera pública no dice qué sitio es

- **Área:** zona pública · cabecera de la hoja.
- **Qué:** quien abre un perfil desde un enlace de WhatsApp ve la cabecera solo con «Entrar»: nada
  dice qué sitio es ni quién verificó la chapita, y «En el sitio desde…» nombra un sitio que no
  aparece. `docs/10` §Layout dibuja «[logo] [entrar]».
- **Por qué se acepta:** esta historia hace del perfil la primera página que se abre desde
  WhatsApp, así que es donde más se nota. Aun así no pasa el umbral: no corta el funnel ni la
  verificación, no muestra datos y no toca el presupuesto. La cabecera es la misma en las tres
  zonas (`PaperFrame`), y su logo depende del nombre, que sigue provisorio y espera su `decision`
  (`docs/04-nombre.md`): dibujar ahora una marca con el nombre de trabajo sería rehacerla en la
  beta.
- **Detección:** las capturas públicas de `.artifacts/aval-y-perfil-publico/` a 390 y 1280 px.
- **Se reabre cuando:** se defina el nombre, o una historia toque la cabecera de la zona pública.
- **Origen:** revisión de diseño de la historia #12 (H7, H4, H1, fuera de alcance; la segunda
  ronda lo volvió a encontrar como H2 y H3, y la tercera como H2, con severidad media).

## KL-12-4 — Compartir el perfil es copiar y pegar (resuelta)

- **Área:** «Mi perfil» y «Mis avales» · compartir el enlace.
- **Qué:** la única forma de mandar el perfil es «Copiar el enlace», cambiar a WhatsApp y pegar. En
  el teléfono eso es más largo que preguntar en el grupo, que es la costumbre que el perfil quiere
  reemplazar.
- **Por qué se acepta:** la historia pide copiar el enlace; compartir directo es crecimiento. No
  corta el funnel ni la verificación, no muestra datos y no toca el presupuesto.
- **Detección:** en el teléfono, desde «Mi perfil», contar los pasos hasta que el enlace llega a un
  chat.
- **Se reabre cuando:** la métrica de perfiles compartidos muestre que se copian y no se mandan, o
  una historia de difusión toque cómo se comparte.
- **Origen:** revisión de diseño de la historia #12 (H3, fuera de alcance).
- **Resuelta:** historia #12 (2026-09-30), tercera revisión. En un teléfono con la hoja de
  compartir del sistema, el mismo botón dice «Mandar el enlace» y la abre; en otro lado sigue
  copiando (docs/10, `CopyProfileLink`).

## KL-12-5 — En «Mi perfil» con nivel 2, la chapita compite con dos sellos verdes

- **Área:** «Mi perfil» · marcas de confianza.
- **Qué:** con nivel 2, la chapita va al lado del nombre y debajo quedan los sellos «Verificado»
  (teléfono) y «Verificada» (identidad), girados y en verde yerba. Son tres marcas del mismo tipo de
  hecho en una pantalla, y `docs/10` §Principios 2 dice que la chapita resalta porque es el único
  objeto de metal.
- **Por qué se acepta:** los sellos son de las tarjetas de teléfono e identidad de historias
  anteriores y dicen qué paso está hecho; la chapita dice el nivel. Sacarlos es una decisión de
  diseño de «Mi perfil» entero, no de esta historia. No corta el funnel ni la verificación, no
  muestra datos y no toca el presupuesto.
- **Detección:** `.artifacts/aval-y-perfil-publico/con-sesion-beto/mi-perfil.png` y
  `con-sesion-dani/mi-perfil.png`.
- **Se reabre cuando:** una historia toque las tarjetas de verificación de «Mi perfil», o se decida
  en `docs/10` dónde vive el sello cuando la chapita está en la misma pantalla.
- **Origen:** revisión de diseño de la historia #12 (D9, fuera de alcance).

## KL-57-1 — El id de la cuenta de quien publica viaja en la dirección de las fotos

- **Área:** ficha y listado · fotos.
- **Qué:** las fotos se firman con la ruta `pet-photos/{cuenta}/{foto}/…` (decisión de #53), así
  que `listed_pets`, `pet_share_card` y `pet_by_code` devuelven el id de la cuenta de quien publica
  (`cover_owner`, `owner_folder`) y ese id queda en cada URL firmada. La policy de lectura de
  Storage también deja **listar** el bucket, y listándolo se ven las carpetas de quien tiene algún
  animal a la vista.
- **Por qué se acepta:** el id es un identificador al azar que no abre nada (RLS lo compara con la
  sesión) y solo dice lo que la ficha ya dice: que esos animales los publicó la misma persona. No
  muestra contacto ni identidad. Esconderlo pide un proxy propio de fotos que duplica el tráfico de
  cada foto por el servidor (research R2).
- **Detección:** en DevTools, la dirección de cualquier foto de una ficha; o
  `storage.from('pet-photos').list()` con la clave anónima.
- **Se reabre cuando:** el id de la cuenta sirva para algo más que firmar (un perfil público que lo
  use en su dirección, por ejemplo), o se mude el almacenamiento de fotos.
- **Origen:** plan de la historia #57 (research R2).

## KL-57-2 — De la card a la ficha no hay View Transition

- **Área:** listado · ficha.
- **Qué:** docs/10 prevé `--dur-page` y la `view-transition-name` de la portada para pasar de la
  card a la ficha; la historia #57 no la suma: la ficha aparece de golpe.
- **Por qué se acepta:** en Next 16.3 la opción sigue detrás de `experimental.viewTransition`, y la
  card vive en una lista que el cliente reemplaza al filtrar y repone al volver atrás, así que habría
  que nombrar cada portada con su código y probar el cruce con esa vuelta. No cambia ningún paso del
  funnel (research R15).
- **Detección:** tocar una card del listado: la ficha entra sin transición.
- **Se reabre cuando:** `viewTransition` salga de experimental en Next, o una historia de pulido la
  tome.
- **Origen:** plan de la historia #57 (research R15).

## KL-57-3 — Lighthouse no mide el listado ni la ficha

- **Área:** listado · ficha · performance.
- **Qué:** docs/07 §Presupuesto nombra el listado y la ficha, pero `.lighthouserc.json` audita solo
  la portada. El LCP y el CLS de las dos pantallas (y de «Mis animales») los mide
  `tests/e2e/animales-rendimiento.spec.ts`, con la red y la CPU de un teléfono, contra `next start`:
  la ficha 0,9 s y el listado 1,0 s de LCP en la última medición de la construcción.
- **Por qué se acepta:** sumar rutas a `.lighthouserc.json` cambia una compuerta protegida, que
  necesita `reglas-aprobadas`; el pedido va en el `aviso` de la historia.
- **Detección:** `.lighthouserc.json` sin `/animales` en `collect.url`.
- **Se reabre cuando:** Hernán apruebe sumar `/animales` y una ficha sembrada a la compuerta.
- **Origen:** plan de la historia #57.

## KL-57-4 — El JS inicial del listado y de la ficha pasa los 150 KB (resuelta)

- **Área:** listado · ficha · performance.
- **Qué:** medido en el navegador contra `next start` (lo transferido en scripts al abrir la
  pantalla), la ficha baja 185 KB y el listado 167 KB, contra los 150 KB de docs/07. La portada, con
  la misma cabecera, baja 145 KB: el runtime de Next y la cabecera ya ocupan casi todo el
  presupuesto. Lo que suma la ficha es el proveedor de textos de los límites de error (next-intl,
  12 KB), el `Toast` de «Enlace copiado» (Radix, 13 KB), el cliente de la acción de medición de
  «Compartir» (9 KB) y la galería; el listado suma el mismo proveedor y el controlador (7 KB). El
  `Sheet` de copiar a mano ya se baja solo si hace falta.
- **Por qué se acepta:** el LCP de las dos pantallas, lo que pide SC-001, está muy por debajo de
  2,5 s con red y CPU de teléfono (KL-57-3), y el CLS en 0. Bajar más pide cambiar cómo llegan los
  textos a los límites de error de todo el producto o sacar el `Toast` del sistema, que son
  decisiones de toda la app y no de esta historia.
- **Detección:** la anotación «rendimiento» de `tests/e2e/animales-rendimiento.spec.ts`, o DevTools
  con «JS» y la caché deshabilitada contra `pnpm start`.
- **Se reabre cuando:** Lighthouse mida estas pantallas (KL-57-3) y su puntaje de performance baje de
  0,9, o una historia vuelva a sumar JS a la ficha.
- **Origen:** construcción de la historia #57 (T065). Pasa el umbral de docs/09 (presupuesto de una
  pantalla del funnel): al cerrar #57 la ficha bajaba 188 KB, y el seguimiento es #95.
- **Resuelta:** historia #95 (2026-10-05). Medido con `scriptWeight` contra `next start`, red y CPU
  de teléfono: la ficha abre en 149,6 KB (antes 188,2), «no está publicado» en 149,6 KB, el listado
  en 147,3 KB con y sin filtro (antes 169,4) y la portada en 145,1 KB (antes 146,7). Los textos de
  error viajan en el HTML sin next-intl, y «Compartir», la galería y la vista viva del listado
  llegan después de abrir. La prueba de rendimiento ahora falla por encima de 150 KB. Nota: a la
  ficha le quedan 0,4 KB de aire (la pantalla de error sigue en el peso de apertura: después de
  abrir dejaba una hoja en blanco sin señal); la próxima palanca, si una historia le suma JS, es
  `tailwind-merge` (descartada en #95, research R5).

## KL-57-5 — Un animal que no existe responde 200 y no 404

- **Área:** ficha · encontrable.
- **Qué:** «Este animal no está publicado» lo dibuja la página con estado 200 y `noindex`, y no con
  `notFound()`. En Next 16.3 un 404 fuera de un límite de `Suspense` llega con el cuerpo vacío y lo
  dibuja el cliente: sin JavaScript no se veía nada (FR-019), y la vista previa traía la descripción
  del sitio en lugar de «Animales en adopción» (FR-012). docs/08 §Encontrable pide no poner
  `noindex` sobre un 200 en una publicación que ya no está.
- **Por qué se acepta:** nada se indexa hasta el dominio definitivo (FR-024), así que el estado no
  lo lee ningún buscador todavía; la persona ve la pantalla correcta, con y sin JavaScript.
- **Detección:** `curl -I` de `/animales/zzzzzzzzzz` responde 200.
- **Se reabre cuando:** se prenda la indexación en M5 (`INDEXING_ENABLED`), o Next dibuje el
  `not-found` en el HTML del servidor; lo mismo vale para la publicación que expira (410) del ciclo
  de vida, #59.
- **Origen:** construcción de la historia #57.

## KL-57-6 — La portada repite el nombre del sitio y sigue diciendo «Estamos construyendo esto»

- **Área:** portada.
- **Qué:** con el `Wordmark` de la cabecera, la portada muestra «Adopciones» dos veces seguidas (la
  cabecera y el título en afiche) y debajo sigue la nota «Estamos construyendo esto. Volvé pronto.»,
  aunque el listado de animales ya existe. La única acción de la pantalla es el enlace de la cabecera.
- **Por qué se acepta:** la portada es provisoria y la reemplaza la historia que defina la real; no
  es un paso del funnel (quien llega desde un enlace compartido entra a la ficha, y el listado tiene
  su propia dirección), no muestra datos de nadie y no toca el presupuesto de performance.
- **Detección:** abrir `/` con `pnpm start`: el nombre dos veces y la nota de construcción.
- **Se reabre cuando:** llegue la historia de la portada real, o la analítica muestre visitas que
  entran por `/` y no siguen al listado.
- **Origen:** revisión de diseño de la historia #57 (D10).
- **Se cerró con la historia #61:** la portada real reemplaza a la provisoria: el nombre va una
  sola vez (en la cabecera), sin la nota de construcción, con la frase, «Publicar un animal» y los
  animales más recientes.

## KL-57-7 — La vista previa de un enlace separa el nombre de la zona y no dice que la persona está verificada

- **Área:** compartir · vista previa del enlace.
- **Qué:** en la imagen que arma `/animales/{código}/imagen`, el nombre queda solo a la izquierda y
  la zona, en gris, a la derecha, con «Adopciones» chico abajo. La imagen no dice «en adopción» ni
  muestra el nivel de verificación de quien publica, que es lo que distingue el enlace de una
  publicación suelta en un grupo.
- **Por qué se acepta:** la vista previa se ve y lleva a la ficha, así que no corta ningún paso del
  funnel; no muestra contacto ni identidad. Sumar la verificación a la imagen va más allá de FR-011 y
  es una pregunta de producto, no de esta historia.
- **Detección:** `imagen-corto-*.jpg` e `imagen-largo-*.jpg` en `.artifacts/ver-animales/`, o pegar
  el enlace de una ficha en WhatsApp.
- **Se reabre cuando:** la analítica de «Compartir» muestre enlaces compartidos que no traen visitas,
  o Producto decida que la vista previa lleve el nivel de verificación.
- **Origen:** revisión de diseño de la historia #57 (H6).

## KL-57-8 — La ficha no lleva al perfil público de quien publica ni muestra su chapita

- **Área:** ficha · listado · verificación.
- **Qué:** la nota de quien publica en la ficha dice el nombre, la foto, «Rescatista o refugio» y el
  nivel en palabras, pero no lleva al perfil público que trajo #12 ni muestra la chapita del nivel
  (`VerificationBadge`) que dibuja docs/10 §Layout. La card del listado tampoco dice nada de quien
  publica: solo foto, nombre, edad, zona y la marca de urgente. Sale de la revisión de diseño (D1 y
  H1) y de la spec, que lo anotó al retomar después de que #12 entró a `main`.
- **Por qué se acepta:** la historia #57 lo deja afuera de forma explícita («No incluye»: el perfil
  público de quien publica, su distintivo y el enlace a su perfil) y fija qué lleva la card. El nivel
  ya se dice en palabras en la ficha, así que no se corta ningún paso del funnel ni de la
  verificación, no se muestra contacto ni identidad y no cambia el peso de la pantalla: no pasa el
  umbral de docs/09.
- **Detección:** abrir `/animales/{código}` de un animal publicado: la nota de quien publica no lleva
  a ningún lado y no tiene chapita; `animales-<código>.png` en `.artifacts/ver-animales/`.
- **Se reabre cuando:** Producto escriba la historia que suma el enlace al perfil público y la chapita
  a la ficha (para eso la ficha tiene que traer el identificador público del perfil), o la
  analítica muestre que quien mira fichas no llega a solicitar por desconfianza en quien publica.
- **Origen:** spec y revisión de diseño de la historia #57 (D1, H1).

## KL-57-9 — En el teléfono, las filas de departamento y de edad se cortan sin señal de que se deslizan

- **Área:** listado · filtros.
- **Qué:** a 390 px, las filas de departamento y de edad se cortan justo en el borde sin ninguna
  señal de que se deslizan: Montevideo, otros 14 departamentos y «Mayor» no se ven, y la fila de
  departamentos no tiene título visible. Sale de la aceptación de la historia #57 (fricción, media).
- **Por qué se acepta:** no corta un paso del funnel: el listado sin filtros y las fichas siguen al
  alcance, y quien llega por un enlace compartido no pasa por los filtros. Tampoco expone datos ni
  rompe el presupuesto. Pone en riesgo que el adoptante llegue solo a «vio ficha» desde el listado
  (primer paso del funnel de docs/03 §7) cuando filtra por zona o por animales mayores.
- **Detección:** abrir `/animales` a 390 px y mirar las filas de filtros; las capturas a 390 px en
  `.artifacts/ver-animales/`.
- **Se reabre cuando:** la analítica muestre que pocas visitas al listado filtran por departamento o
  por edad «Mayor», o que el paso a «vio ficha» desde el listado cae en el teléfono.
- **Origen:** aceptación de la historia #57.

## KL-59-1 — Un escáner de enlaces de un correo corporativo puede renovar una publicación

- **Área:** animales · recordatorio «¿sigue disponible?».
- **Qué:** «Sigue disponible» renueva con un solo toque y sin ingresar: es un `GET` que renueva y
  redirige. Los lectores de vista previa conocidos (`isLinkPreview`) no renuevan, pero algunos
  correos corporativos abren cada enlace con un escáner de seguridad antes de mostrarlo, con un
  navegador común: ese escáner renovaría la publicación 30 días sin que nadie la confirme.
- **Por qué se acepta:** la historia pide un toque, sin pantalla de confirmación ni ingreso, porque
  ese paso de más es el que hace que la publicación venza con el animal todavía buscando hogar. Las
  rescatistas usan correos personales, no corporativos. Renovar de más se deshace pausando o
  marcando adoptado, y no expone ningún dato: el enlace solo renueva ese animal.
- **Detección:** en la analítica, `pet_renewed` con `via: 'email'` segundos después de
  `pet_reminder_sent`, siempre desde el mismo dominio de correo; o una rescatista que dice que un
  animal adoptado siguió publicado sin que ella tocara nada.
- **Se reabre cuando:** aparezca una renovación que nadie tocó, o la analítica muestre renovaciones
  por correo en menos de un minuto desde el envío. El arreglo es una pantalla intermedia con
  «Sigue disponible» como botón de un formulario (`POST`), que ningún escáner aprieta.
- **Origen:** plan de la historia #59 (research R5).

## KL-95-1 — «Mis animales» y las pantallas con sesión no tienen tope de peso

- **Área:** mis animales · performance.
- **Qué:** la prueba de rendimiento pone el tope de 150 KB al abrir solo en la portada, la ficha y
  el listado (con y sin sesión). «Mis animales» y las demás pantallas detrás del ingreso se miden
  pero no fallan si crecen. Como `ShareButton` es compartido, en «Mis animales» «Compartir» también
  aparece después de abrir; funciona igual que antes (FR-013 de #95).
- **Por qué se acepta:** el presupuesto de docs/07 que la historia cierra es el de las pantallas
  del funnel que abre un visitante desde un enlace en el teléfono. «Mis animales» la abre quien
  publica, ya con sesión, y no corta ningún paso del funnel.
- **Detección:** la anotación «rendimiento» de `tests/e2e/animales-rendimiento.spec.ts` para «Mis
  animales», o DevTools con «JS» y la caché deshabilitada contra `pnpm start`.
- **Se reabre cuando:** una historia sume JS a «Mis animales» o a otra pantalla con sesión y su
  apertura pase los 150 KB, o Lighthouse empiece a medir pantallas con sesión.
- **Origen:** spec de la historia #95.

## KL-95-2 — El evento «tocó Compartir» no tiene test

- **Área:** ficha · analítica.
- **Qué:** la llamada a `trackShare` al tocar «Compartir» no tiene test unitario ni e2e que la
  verifique. En #95 se movió sin cambios a `share-button-live.tsx`, y la revisión de código la
  comprobó a mano.
- **Por qué se acepta:** si se rompe, falta un dato de analítica; no engaña a una persona, no
  expone datos ni corta el funnel (docs/09 §Qué vale la pena testear).
- **Detección:** en la analítica, la cuenta de eventos de compartir cae a cero mientras las visitas
  a la ficha siguen.
- **Se reabre cuando:** una decisión de producto dependa de ese evento, o la analítica muestre que
  dejó de llegar.
- **Origen:** spec de la historia #95.

## KL-61-1 — En la portada, una pestaña abierta más de una hora muestra el borroso en lugar de las fotos que faltaban cargar

- **Área:** portada · fotos.
- **Qué:** las direcciones de las fotos vencen a la hora. La ficha y el listado piden la página de
  nuevo cuando la firma está por vencer (`StaleImagesRefresh`, `useListing`); la portada no. Si
  alguien deja la portada abierta más de una hora (o vuelve a ella desde la caché del navegador) y
  recién entonces baja hasta los animales, las fotos que no habían cargado muestran su borroso, sin
  el ícono roto (FR-020), hasta que recarga.
- **Por qué se acepta:** la portada no tiene margen en su presupuesto de JavaScript (150 KB): la
  hoja que renueva las firmas sumaba 3,5 KB y la dejaba en 158 KB. Las fotos de la portada son una
  muestra; tocar una tarjeta o «Ver todos» abre páginas con firmas nuevas.
- **Detección:** abrir `/` con animales, esperar más de una hora sin bajar y bajar hasta «Recién
  publicados»: las fotos quedan en su borroso.
- **Se reabre cuando:** el JavaScript compartido de la portada baje lo suficiente para que la hoja
  entre en el presupuesto, o la duración de las firmas cambie.
- **Origen:** etapa Ship de la historia #61 (Lighthouse en `pnpm verify`).

## KL-13-1 — La persona reportada que borra su cuenta antes de que la suspendan se lleva sus reportes y su número queda libre

- **Área:** moderación · reportes y número retenido.
- **Qué:** borrar la cuenta borra los reportes sobre ella (cascada) y, si no estaba suspendida, su
  número verificado no se retiene: puede volver a verificarse en una cuenta nueva y empezar de cero.
  Solo se retiene el número de una cuenta con una suspensión vigente al borrarse.
- **Por qué se acepta:** borrar la cuenta es un derecho (Ley 18.331) y guardar datos de una persona
  que nadie sancionó, solo porque alguien la reportó, es más dato del necesario. Un reporte no es
  una prueba.
- **Detección:** quien administra ve un reporte que desaparece de la lista sin cerrarlo, o recibe
  reportes repetidos sobre una cuenta nueva con el mismo comportamiento.
- **Se reabre cuando:** aparezca un caso concreto de alguien que borró su cuenta con reportes
  abiertos y volvió, o la beta muestre que se usa para escapar de una suspensión.
- **Origen:** plan de la historia #13.

## KL-13-2 — Quien desbloquea a una suspendida ve que su perfil no existe y puede deducirlo

- **Área:** moderación · bloqueo y suspensión.
- **Qué:** quien bloqueó ve el perfil bloqueado aunque la otra persona esté suspendida; al
  desbloquearla, el perfil pasa a «no existe», y puede deducir que la suspendieron o que se borró.
- **Por qué se acepta:** el perfil bloqueado es lo que permite deshacer el bloqueo y reportar; no
  mostrarlo dejaría a quien bloqueó sin poder desbloquear. Lo que se deduce no distingue suspensión
  de borrado y no revela el motivo.
- **Detección:** a mano: bloquear, que la suspendan, desbloquear.
- **Se reabre cuando:** alguien reclame que se enteró de una suspensión por esta vía, o la
  suspensión empiece a llevar información sensible que la deducción expondría.
- **Origen:** plan de la historia #13.

## KL-13-3 — Sin tope de reportes por persona; quien administra ve quién reporta

- **Área:** moderación · reportes.
- **Qué:** una persona con sesión puede reportar a muchas personas distintas sin límite (solo se
  impide repetir el mismo motivo sobre la misma persona mientras no se cierre). Quien administra ve
  quién hizo cada reporte; la persona reportada nunca.
- **Por qué se acepta:** en la beta los reportes son pocos y los lee una persona; un tope inventado
  antes de ver el uso podría frenar a quien avisa de una red de venta. Ver quién reporta deja a
  quien administra detectar a quien reporta para molestar.
- **Detección:** en la lista de reportes, muchos del mismo autor en poco tiempo.
- **Se reabre cuando:** quien administra vea más de un caso de reportes en masa, o los reportes
  pasen de lo que una persona puede leer por día.
- **Origen:** plan de la historia #13.

## KL-13-4 — Los reportes, bloqueos y suspensiones se guardan hasta que se borra la cuenta

- **Área:** moderación · retención de datos (Ley 18.331).
- **Qué:** un reporte cerrado, un bloqueo y el registro de una suspensión (vigente o levantada) no
  tienen un plazo propio: se borran cuando se borra la cuenta de quien está involucrado, salvo las
  dos excepciones de docs/01 §Legal / datos (el reporte sin nombre de quien lo hizo y el número
  retenido 12 meses).
- **Por qué se acepta:** la historia lo pide en «Datos personales», y el historial es lo que quien
  administra necesita para ver patrones (alguien reportado varias veces por cosas distintas). En la
  beta cerrada son pocos datos, sin texto de la cédula ni del teléfono, y solo los ve quien
  administra.
- **Detección:** a mano: cerrar un reporte o levantar una suspensión y ver que el historial sigue
  en «Reportes» meses después.
- **Se reabre cuando:** la lista de reportes cerrados pase de lo que sirve para ver patrones, o un
  pedido de acceso o de supresión (Ley 18.331) pregunte por qué se guarda un reporte cerrado.
- **Origen:** spec de la historia #13 (adversario, ronda 1).

## KL-13-5 — La regla de la puerta de la cuenta suspendida no vive en `tests/gates/`

- **Área:** compuertas · puerta de la cuenta suspendida.
- **Qué:** el test que demuestra que solo una lista cerrada lee la sesión sin pasar por la puerta
  está en `src/lib/auth/session-gate.test.ts`, no en `tests/gates/` con las otras reglas del repo.
- **Por qué se acepta:** `tests/gates/` solo cambia con `reglas-aprobadas`, que pone Hernán; el
  enjambre no se la pone. El test corre igual en `pnpm test` y en Stryker, así que la regla se
  cumple; lo que falta es que esté protegida como compuerta.
- **Detección:** `tests/gates/` no tiene un test que nombre `lookupSession`.
- **Se reabre cuando:** Hernán ponga `reglas-aprobadas` en un PR que lo mude a `tests/gates/`
  (propuesto en el aviso de la historia).
- **Origen:** análisis de la spec de la historia #13 (speckit-analyze, D1).

## KL-63-1 — «Le llegó a quien publicó», pero quien publicó todavía no tiene dónde leerla (resuelta)

- **Área:** solicitudes · bandeja del publicador.
- **Qué:** al enviar, la pantalla dice que la solicitud le llegó a quien publicó, y la solicitud
  queda guardada a su nombre; pero hasta la historia de la bandeja nadie más que quien solicitó la
  puede leer (RLS), y mandarla no le avisa a nadie por correo (FR-034). Quien publicó no se entera
  de que la recibió.
- **Por qué se acepta:** la historia #63 corta el funnel en dos a propósito (solicitar acá,
  revisar y aceptar en la siguiente) para que cada PR sea una capacidad entera; abrir las
  respuestas al publicador sin la bandeja que las muestra sería exponerlas sin pantalla que las
  proteja. Hasta el MVP todo corre en local, con personas sintéticas: ninguna persona real espera
  una respuesta.
- **Detección:** entrar como quien publicó a Tobi después de que alguien lo solicitó: no hay
  ninguna pantalla que lo muestre.
- **Se reabre cuando:** se construya la historia de la bandeja del publicador (revisar, pedir más
  información, aceptar o rechazar), que la cierra; o antes, si alguna persona real llega a mandar
  una solicitud.
- **Origen:** plan de la historia #63.
- **Resuelta:** historia #65 (2026-10-07). Quien publicó recibe un correo con cada solicitud nueva
  (sin repetir mientras tenga dos sin abrir de ese animal), la lee en «Solicitudes» y la acepta,
  la rechaza con un motivo o le pregunta algo.

## KL-13-6 — Suspender con el motivo vacío dice «Elegí un motivo.» cuando hay que escribirlo

- **Área:** moderación · suspender una cuenta.
- **Qué:** al intentar suspender con el motivo vacío, el error dice «Elegí un motivo.», un texto
  pensado para elegir de una lista, cuando ahí el motivo se escribe.
- **Por qué se acepta:** solo lo ve quien administra; no toca publicar, solicitar ni verificarse,
  no expone datos de contacto ni de identidad y no cambia el rendimiento. La suspensión igual se
  frena y el campo queda marcado. Es un arreglo de redacción (una clave tipo «Escribí el motivo»
  en lugar de reusar `moderation.errors.reason_required`), no un seguimiento.
- **Detección:** a mano: en «Reportes», suspender sin escribir el motivo y leer el error.
- **Se reabre cuando:** se toque el formulario de suspender o los textos de `moderation.errors`.
- **Origen:** aceptación de la historia #13 (US2-AS3, severidad baja).

## KL-63-2 — Al volver de retirar una solicitud, el cuestionario salta a «9 de 11» sin decir por qué

- **Área:** solicitudes · cuestionario.
- **Qué:** al retirar una solicitud desde la pantalla de límite y seguir, el cuestionario de Luna
  abre directo en «9 de 11» (la pregunta de castración que faltaba) sin la nota «Propusimos tus
  respuestas de la vez anterior»: la persona no ve por qué saltó las primeras 8 preguntas hasta
  llegar a la revisión del último paso.
- **Por qué se acepta:** puede confundir un momento, pero no corta un paso del funnel: «Anterior»
  funciona y la revisión con la nota aparece en el último paso. No expone datos ni afecta
  rendimiento. Pone en riesgo, levemente, la métrica de quienes completan el cuestionario sin
  ayuda (docs/03 §Métricas de éxito).
- **Detección:** a mano: con el límite de solicitudes alcanzado, retirar una desde la pantalla de
  límite, seguir al cuestionario de Luna y ver que abre en «9 de 11» sin la nota.
- **Se reabre cuando:** se toque el cuestionario o la pantalla de límite, o la métrica de quienes
  completan el cuestionario sin ayuda muestre abandono en ese paso.
- **Origen:** aceptación de la historia #63 (fricción, severidad baja).

## KL-65-1 — Al elegir un motivo en «Rechazar», React avisa en consola de un campo que pasa a controlado

- **Área:** solicitudes · responder una solicitud.
- **Qué:** al elegir un motivo en «Rechazar», React avisa en consola que un campo pasa de no
  controlado a controlado; en desarrollo el aviso tapó el botón «Rechazar» del panel.
- **Por qué se acepta:** no corta un paso del funnel ni de la verificación y no expone datos. En
  producción es solo un aviso en consola y rechazar funciona (se vio al segundo intento). Rompe,
  eso sí, la regla de consola limpia que hace cumplir el driver de capturas, y puede trabar
  corridas automáticas en desarrollo.
- **Detección:** a mano: con `pnpm dev`, abrir una solicitud recibida, tocar «Rechazar», elegir un
  motivo y mirar la consola del navegador.
- **Se reabre cuando:** se toque el panel de responder una solicitud, o el aviso trabe una corrida
  del driver de capturas o de los e2e.
- **Origen:** aceptación de la historia #65 (US2-AS7, severidad baja).
