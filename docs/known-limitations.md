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

## KL-024 — El borrador del perfil a medias solo conserva el nombre

- **Área:** alta · perfil.
- **Qué:** al recargar o volver en el mismo navegador, el departamento y la localidad se borran del
  almacenamiento y hay que cargarlos de nuevo; solo el nombre sobrevive.
- **Por qué se acepta:** no corta el paso: la compuerta manda a completarlo y se termina eligiendo
  la zona otra vez. Es fricción extra en el alta y no expone datos. Comparte raíz con US4-AS4: el
  formulario del perfil no protege lo que la persona escribió.
- **Detección:** en /completar-perfil, elegir departamento y localidad, recargar y ver los campos
  vacíos (US2-AS5).
- **Se reabre cuando:** se toque el formulario del perfil o se arregle US4-AS4, o alguien cuente
  que perdió lo que cargó.
- **Origen:** aceptación de la historia #9 (US2-AS5, severidad media).

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

## KL-028 — «Ese número está en otra cuenta» no ofrece entrar con la otra cuenta

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
