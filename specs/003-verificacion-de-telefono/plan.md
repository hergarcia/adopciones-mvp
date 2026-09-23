# Implementation Plan: Verificación de teléfono para poder publicar y solicitar

**Branch**: `feature/10-verificacion-de-telefono` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/003-verificacion-de-telefono/spec.md` (3 user stories, endurecida en tres rondas
con `spec-grader` y `spec-adversary`; lo que quedó abierto está en sus Assumptions)

## Summary

La segunda historia con producto trae el teléfono verificado, el nivel 1 y la puerta que las
historias de publicar y de solicitar van a usar. La persona escribe su celular, recibe un código
por mensaje de texto, lo escribe, y su cuenta queda en nivel 1; puede cambiar el número, y un
número a medias sobrevive siete días para terminarlo.

Tres cosas hacen este plan distinto del "OTP por teléfono" del tutorial:

1. **El código lo genera y lo comprueba el producto; el servicio de mensajes solo lo entrega.**
   Es la misma decisión que la historia #9 tomó con el correo, por los mismos motivos y por uno
   más: el OTP de teléfono del servicio de autenticación no tiene ninguna de las reglas que la spec
   pide (intentos por código, "número en uso" recién al confirmar, cancelar que devuelve el número
   anterior, el texto en `messages/es.json`), y su "teléfono ya registrado" al pedir el código es
   exactamente el oráculo que FR-008 prohíbe.
2. **Las reglas con consecuencias viven en la base, dentro de una transacción con candado.** Topes,
   intentos y la verificación se deciden en funciones de Postgres. Hechas en la aplicación, veinte
   pedidos en paralelo pasan todos el chequeo del tope antes de que el primero se anote, y veinte
   intentos en paralelo se saltean el límite de cinco.
3. **Nada guarda un código ni un número de forma que se pueda leer.** El código se guarda como
   HMAC con una clave que no está en la base. El conteo por número va con el mismo HMAC, truncado
   a 15 bits: cada grupo son unos 275 números, así que ni con la clave se sabe de cuál se trata
   (FR-021).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (`strict`), React 19.3, Next.js 16.3.5 (App Router)

**Primary Dependencies**: las de `main`. **Ninguna nueva.** El mensaje sale por la API REST de
Twilio (`POST /2010-04-01/Accounts/{sid}/Messages.json`, form-encoded, autenticación básica) con
`fetch`, que ya trae Node. El SDK `twilio` de npm pesa varios megas y arrastra dependencias, y acá
se usa un solo endpoint. Los resúmenes con clave (`createHmac`, `hkdfSync`) y el código
(`randomInt`) salen de `node:crypto`. La API se verificó en la documentación de Twilio el
2026-09-22: la validación de `To` es sincrónica y devuelve 21211 (número inválido) o 21614 (no es un
celular) en la misma respuesta. Los rechazos que Twilio descubre **después** de aceptar el mensaje
(30003, 30005, 30006, 30007) llegan por un callback que esta historia no construye: ver §Riesgos.

**Storage**: Postgres de Supabase (local, CLI en Docker). Tres tablas nuevas y seis funciones, en
una migración. Detalle en [data-model.md](./data-model.md).

**Testing**: Vitest (unidad + base local), Playwright (un flujo), Stryker al 100 % sobre lo que
tenga test.

**Target Platform**: web, mobile-first a 390 px.

**Project Type**: aplicación web Next.js, estructura fijada por F00.

**Performance Goals**: los del presupuesto: LCP < 2,5 s, JS inicial < 150 KB, Lighthouse mobile ≥ 90.
Las pantallas son dos formularios chicos; el JS de cliente nuevo son tres hojas.

**Constraints**: sin cuenta de Twilio ni dominio todavía. Contra la base local, que es desarrollo y
CI, el mensaje se escribe en `.artifacts/sms/` (ignorado por git) y de ahí lo lee la prueba de
punta a punta. Contra cualquier otra base sin credenciales de Twilio, el pedido falla (FR-009c).

**Scale/Scope**: 2 rutas nuevas, 13 componentes, 1 hook, 3 tablas, 6 funciones de base, 0
dependencias.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra una tabla ni un servicio; el cómo está acá. |
| **II. Una feature, un PR** | Tres user stories que se construyen y verifican una por una, en un PR. |
| **III. Compuertas verdes y revisión fresca** | `pnpm verify` completo; qué se testea y por qué, en §Qué se testea. |
| **IV. Reglas como código** | Topes e intentos son funciones de la base con candado y su test de concurrencia; la visibilidad y la escritura son RLS y permisos con su test; que send y skip respondan igual es una función pura con test; que el mensaje entre en uno solo lo prueba un test contra el texto real; que el teléfono no sea una llave lo prueba un check sobre `config.toml`. |
| **V. Datos personales mínimos y privados** | RLS en las tres tablas, dos sin ninguna policy y sin permisos para `anon` ni `authenticated`; el teléfono no lo escribe nadie desde el cliente; códigos y números solo como HMAC; el número en claro de un pedido que no salió se borra al cerrarlo; el conteo por número no se puede revertir ni con la clave; todo se borra a las 24 horas o con la cuenta. |
| **VI. Sin deriva** | Nada de la tabla "Fuera del MVP". No se construye la chapita (historia #12), ni publicar ni solicitar (M2, M3). |
| **VII. Liviana y linda, medido** | Server Components por defecto; tres hojas cliente nuevas. Todo contra `docs/10`, sin tokens nuevos. |

**Sin violaciones**: la tabla de Complexity Tracking queda vacía.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. Cargado
`frontend-design:frontend-design` antes de escribir esta sección.

**La idea que ordena las pantallas.** En el cartel de "se busca hogar", el teléfono va en las
tiritas de abajo: es lo que alguien arranca para poder llamar. Por eso el verbo de esta historia es
la tirita de siempre, y por eso el aviso de privacidad dice las dos mitades: el número no está en
las tiritas de nadie hasta que se acepta una solicitud. No se inventa ningún recurso nuevo: el
estado del teléfono es un **sello**, que en `docs/10` es exactamente lo que marca un estado.

**La chapita no entra.** `VerificationBadge` es de la historia #12, la del perfil público y los
niveles; sus grises de metal todavía no son tokens (`docs/10` §Cómo se aplica). Acá el nivel se
dice en texto ("Nivel 1 desde el 20 de septiembre de 2026") y el estado del teléfono con un sello.
Se registra en `docs/10` §Decisiones con fecha.

### Tokens, sin ninguno nuevo

Color: `--color-canvas` de fondo; `--color-ink` para texto, bordes y acción; `--color-ink-muted`
en ayudas; `--color-primary` en el sello «Verificado» y **solo en la mitad privada** del aviso de
privacidad ("no se lo mostramos a nadie"), como `PersonalDataNotice` en la #9: la otra mitad va en
`--color-ink-muted`, para que "lo va a ver la otra persona" no se lea como una garantía;
`--color-warning` en el sello «Sin confirmar» (es "le toca actuar a alguien"); `--color-accent`
solo en errores. Tipografía: `.afiche` en el `h1`, `--text-base` en el cuerpo, `--text-sm` en
ayudas, `--text-2xl` y `tabular-nums` en el renglón del código. Movimiento: `--dur-fast` en
botones, `--dur-base` en la entrada de un error. `.sello` con `--tilt-stamp`, `.perforado` en la
tirita. **No se agrega ningún token**; `docs/10` §Tokens no se toca.

### Verificar teléfono · `/verificar-telefono`

La pantalla entera la arma `VerifyPhoneScreen`, un componente de dominio que recibe el
`PhoneStatus` ya calculado y la puerta (`para`, `next`, `desde`); la página solo lee y compone. Un
`h1`, un bloque según el estado, el formulario del número y, con `para`, «Ahora no» al pie.

Sin teléfono, sin `para`:

```
┌──────────────────────────────┐
│ Verificá tu teléfono         │  .afiche --text-2xl
│ Así, quien publica o adopta  │  --text-base --color-ink-muted
│ sabe que del otro lado hay   │  medida 65ch
│ alguien que se puede         │
│ contactar.                   │
│                              │
│ Tu celular                   │  label --text-sm
│ ───────────────────────────  │  Input line, inputMode tel, autocomplete tel-national
│ Por ejemplo, 099 123 456.    │  ayuda --text-sm ink-muted
│                              │
│ Tu número no se lo mostramos │  PhonePrivacyNotice: esta mitad --color-primary
│ a nadie. Lo va a ver la otra │  esta, --color-ink-muted (FR-004)
│ persona recién cuando se     │
│ acepte una solicitud.        │
│                              │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │  .perforado
│ █ Mandarme el código       █ │  Button tirita, lg  ◀ EL ELEMENTO
│ Podés pedir otro en 42 s.    │  solo si FR-010a lo frena; botón deshabilitado
└──────────────────────────────┘
```

Con `para` (el aviso, «Aviso de verificación pendiente»), la misma pantalla con otro encabezado y
una salida:

```
┌──────────────────────────────┐
│ Para publicar, verificá tu   │  GateNotice: .afiche, nombra la acción (FR-013a)
│ teléfono                     │
│ Es la forma de que quien     │  la frase del motivo de esa acción
│ adopta sepa que sos alguien  │
│ que se puede contactar.      │
│ … (el mismo bloque según el  │
│    estado, y el formulario)  │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ █ Mandarme el código       █ │  ◀ EL ELEMENTO
│                              │
│ Ahora no                     │  NotNowLink, ghost → `desde` o `/` (FR-013e)
└──────────────────────────────┘
```

`GateNotice` es solo el encabezado (el `h1` y la frase); «Ahora no» lo pone `VerifyPhoneScreen`,
que es quien sabe dónde termina la pantalla.

Con un número a medias (primera verificación o cambio; con `para` cambia solo el `h1`):

```
┌──────────────────────────────┐
│ Terminá de verificar tu      │  .afiche --text-2xl
│ teléfono                     │  (con para: «Para publicar, verificá tu teléfono»)
│ ┌──────────────────────────┐ │  PendingPhoneNotice: Card
│ │ 098 765 432 [Sin confir- │ │  --font-weight-medium · .sello warning
│ │              mar]        │ │
│ │ Tu cuenta está sin       │ │  --text-sm (FR-018)
│ │ verificar hasta que      │ │
│ │ escribas el código. Si   │ │  solo en un cambio: «Si cancelás, vuelve el
│ │ cancelás, vuelve el      │ │   099 123 456.»
│ │ 099 123 456.             │ │
│ └──────────────────────────┘ │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ █ Escribir el código       █ │  LinkButton tirita  ◀ EL ELEMENTO (terminar)
│ Cancelar                     │  CancelPendingButton, ghost
│                              │
│ Corregir el número           │  --text-lg --font-weight-bold (h2)
│ Tu celular                   │
│ 098 765 432                  │  PhoneNumberForm con el número a medias escrito (FR-018)
│ ───────────────────────────  │
│ Tu número no se lo… (aviso)  │  PhonePrivacyNotice, también acá (FR-004)
│ ┌──────────────────────────┐ │
│ │    Mandarme el código    │ │  secondary: corregir es el desvío, no el camino
│ └──────────────────────────┘ │
│ Ahora no                     │  solo con para
└──────────────────────────────┘
```

Las tres acciones de FR-015 están acá: **terminar** es la tirita, **corregir** es el formulario
con el número ya escrito, **cancelar** es el ghost.

Verificada, sin `para` (con `para` y nivel 1, la página redirige a `next` sin dibujar nada):

```
┌──────────────────────────────┐
│ Tu teléfono                  │  .afiche --text-2xl
│ ┌──────────────────────────┐ │  VerifiedPhone: Card
│ │ 099 123 456  [Verificado]│ │  .sello primary
│ │ Nivel 1 desde el 20 de   │ │  --text-sm ink-muted
│ │ septiembre de 2026.      │ │
│ └──────────────────────────┘ │
│ Cambiar el número            │  h2 --text-lg
│ Hasta que confirmes el nuevo,│  --text-sm ink-muted (FR-016)
│ tu cuenta queda sin          │
│ verificar.                   │
│ Tu celular nuevo             │
│ ───────────────────────────  │
│ Tu número no se lo… (aviso)  │  PhonePrivacyNotice (FR-004)
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ █ Mandarme el código       █ │  tirita  ◀ EL ELEMENTO
└──────────────────────────────┘
```

**Una sola tirita por pantalla, siempre la del próximo paso real**: pedir el código cuando no hay
nada a medias, terminar cuando lo hay. **Un solo verbo para pedir**: «Mandarme el código» y
«Mandarme otro código», en todas las pantallas; y un solo texto para el sello del número a medias,
«Sin confirmar», con la frase "tu cuenta está sin verificar" al lado (`docs/10` §Textos: el mismo
nombre para la misma cosa).

Tres estados del bloque con datos (el estado del teléfono): **cargando** es
`verificar-telefono/loading.tsx`, con la forma de la tarjeta y del renglón; **vacío** es la
variante sin teléfono; **error** es `verificar-telefono/error.tsx`, con `ErrorScreen` y su
reintento, igual que `mi-perfil/error.tsx`, con dos claves nuevas que `ErrorTextsProvider` suma a
las que ya baja. Los errores del formulario son `ErrorText` bajo el renglón, atados con
`aria-describedby`, con el foco en el campo.

### Escribir el código · `/verificar-telefono/codigo`

```
┌──────────────────────────────┐
│ Escribí el código            │  .afiche --text-2xl
│ Te lo mandamos al            │  --text-base
│ 099 123 456.                 │  --font-weight-medium
│ Corregir el número           │  LinkButton ghost → /verificar-telefono (con para, next, desde)
│ Es para publicar un animal.  │  --text-sm ink-muted, solo con para
│                              │
│ Código                       │  label --text-sm
│ 4 8 2 0 1 7                  │  Input line, --text-2xl, tabular-nums,
│ ───────────────────────────  │  inputMode numeric, autocomplete one-time-code
│ Te quedan 3 intentos.        │  ErrorText si falló (--color-accent)
│                              │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ █ Verificar                █ │  tirita  ◀ EL ELEMENTO
│                              │
│ ┌──────────────────────────┐ │  Card (nota de papel)
│ │ ¿No llegó? Puede tardar  │ │
│ │ un minuto. Revisá que el │ │
│ │ número esté bien, que el │ │
│ │ teléfono tenga señal y   │ │
│ │ los mensajes bloqueados  │ │
│ │ o no deseados.           │ │
│ └──────────────────────────┘ │
│ Mandarme otro código         │  ghost, deshabilitado hasta que se pueda (FR-010a)
│ Podés pedir otro en 42 s.    │  --text-sm ink-muted, fuera del botón
│ Ahora no                     │  NotNowLink, solo con para (FR-013e)
└──────────────────────────────┘
```

**El elemento**: la tirita «Verificar». Su aviso de éxito dice «Teléfono verificado»: el mismo
verbo (`docs/10` §Textos). El renglón del código es grande porque es lo único que se escribe, pero
es tinta sobre papel y no compite: no tiene caja, ni color, ni seis cuadraditos. Los seis cuadrados
separados son el default de cualquier kit de verificación y además rompen el pegado y el
autocompletado del teléfono; acá es **un solo `input`**, con `autocomplete="one-time-code"`, que es
lo que hace que iOS y Android sugieran el código del mensaje.

La cuenta regresiva va fuera del botón y sin `aria-live`, exactamente como `ResendLinkButton` (y
por el mismo motivo: un botón deshabilitado queda en 3:1). Con el tope diario o el techo, en vez de
segundos dice el día y la hora ("Podés pedir otro mañana a las 9:15"); el corte lo decide
`retry-at.ts` (§Decisiones 5b). Esa línea aparece en `PhoneNumberForm`, en `PhoneCodeForm` y en
`ResendLinkButton`: es `NextCodeHint`, un componente cliente chico que recibe la espera ya decidida
y sus textos, y los tres lo usan.

Los dígitos del renglón van **sin espaciado extra**: solo `tabular-nums`. El único tracking con
token es `tight` o `afiche`, y el reset del tema no deja otro; el wireframe los separa para que se
lean, no porque lleven espacio.

La pantalla la arma `CodeEntryScreen` (servidor), como `VerifyPhoneScreen` arma la otra: el `h1`,
"te lo mandamos al…", corregir, la frase del motivo, `PhoneCodeForm` y «Ahora no». La página lee y
compone.

`PhoneCodeForm` es **una sola hoja cliente** que contiene el renglón, la tirita y el reenvío: al
pedir otro (FR-007d) tiene que vaciar el renglón, confirmar a qué número salió
(`verification.code.resent`) y volver a contar la espera y los intentos, y eso es estado de un
mismo formulario. Separar el reenvío en otra hoja obligaría a coordinarlas por fuera.

Estados: **cargando** `codigo/loading.tsx` con la forma de esta pantalla (no la de la tarjeta de
`/verificar-telefono`) y el botón ocupado mientras se verifica (`BusyLabel`); **vacío** no aplica,
sin número a medias la página redirige; **error** `ErrorText` bajo el renglón, anunciado, con cada
motivo de FR-007a y su salida. Qué pasa con lo escrito después de cada motivo lo decide
`code-check.ts` (§Decisiones 9). **"Número en uso" se queda a la vista** (FR-008c): la acción no
revalida la página, así que la redirección por falta de número a medias no se lleva el mensaje; la
persona sale por los caminos del propio mensaje.

### Mi perfil · sección de teléfono

Va entre `ProfileSummary` y la tirita «Editar mi perfil». `PhoneStatusCard`, con cuatro formas:

```
Verificado                          Sin teléfono                     A medias (y cambio a medias)
┌─────────────────────────────┐    ┌────────────────────────────┐   ┌────────────────────────────┐
│ VerifiedPhone               │    │ Verificá tu teléfono       │   │ PendingPhoneNotice          │
│ 099 123 456    [Verificado] │    │ Así quien publica o adopta │   │ + Escribir el código (sec.) │
│ Nivel 1 desde el 20 de      │    │ sabe que sos alguien que se│   │ + Corregir el número (ghost)│
│ septiembre de 2026.         │    │ puede contactar.           │   │ + Cancelar (ghost)          │
│ Cambiar el número (ghost)   │    │ [Verificar mi teléfono]    │   └────────────────────────────┘
└─────────────────────────────┘    └────────────────────────────┘
                                      LinkButton secondary
```

La variante sin teléfono explica el valor (`docs/10` §Textos, "se explica por su valor") y **no
afirma nada sobre privacidad**: decir solo "no se lo mostramos a nadie" sería la mitad de la verdad
que FR-004 prohíbe, y las dos mitades ya están junto al campo, donde se escribe el número.

La tirita de «Mi perfil» sigue siendo «Editar mi perfil»: es la pantalla del perfil, y una tirita
que cambia según el estado del teléfono haría que la acción principal salte de lugar entre
visitas. La verificación pendiente se ve igual: es la única sección con un botón `secondary`. La
variante sin teléfono es el estado vacío de FR-018; no es un `EmptyState`, que centra y lleva
ilustración, porque acá es una sección más del perfil.

`mi-perfil/loading.tsx` suma el recuadro de la sección, con la misma altura, para que la tarjeta no
empuje la tirita al llegar (SC-008).

**Los avisos después de cancelar o verificar se ven en las dos pantallas** (FR-015a, FR-018a).
`PhoneNotice` (en `app/[locale]/(app)/_components/`, porque lee la URL) monta `SavedToast` con lo
que decide `screenNotice(marca, estado)` de `lib/verification/notice.ts`: la clave, la variante y,
en un cambio cancelado, el número que sigue verificado. Lo montan `/mi-perfil` y
`/verificar-telefono`, con y sin `para`. Marcas que lee: `guardado=telefono` (Teléfono
verificado), `guardado=cancelado` («Cancelaste el cambio: tu número sigue siendo…» si queda un
número verificado; «Cancelaste la verificación de tu número» si no) y `error=cancelar` (no se pudo
cancelar, variante `error`). `/mi-perfil` suma sus dos marcas de la #9 (`guardado=perfil`,
`guardado=cambios`) a la misma función: `screenNotice` elige el aviso de cualquiera de las dos
pantallas a partir de la marca, y la página de «Mi perfil» deja de tener el ternario de hoy.

### Componentes

**Se reutilizan de `ui/`, sin tocarlos**: `Button` (`tirita`, `secondary`, `ghost`), `LinkButton`,
`Input`, `Card`, `Skeleton`, `ErrorText`, `FieldShell`, `Toast`. De `app/[locale]/_components/`:
`PageShell`, `ErrorScreen`.

**Se toca uno de la #9**: `SavedToast` gana una variante `error` (hoy fija `success`) y deja de
mirar solo la marca `guardado`: limpia también `error`. Cancelar puede fallar y el aviso tiene que
decirlo con la banda de ceibo, no de yerba. No se crea un segundo toast.

**No se crea ninguna primitiva.**

**Componentes de dominio nuevos** (`components/verification/`, reciben el objeto por props, sin
fetch). Entran en la tabla de `docs/10` en este PR, con sus variantes y estados:

| Componente | Variantes / estados | Qué decide |
|---|---|---|
| `VerifyPhoneScreen` | sin teléfono · a medias · cambio a medias · verificado; con y sin `para` | la pantalla «Verificar teléfono» entera a partir del `PhoneStatus` y la puerta; «Ahora no» al pie con `para` |
| `GateNotice` | `publish` · `apply` | el `h1` y la frase del motivo de la acción (FR-013a) |
| `PhoneStatusCard` | verificado · sin teléfono · a medias · cambio a medias | la sección de «Mi perfil»; recibe el `PhoneStatus` |
| `VerifiedPhone` | — | número, sello «Verificado» y "Nivel 1 desde…". Lo usan `PhoneStatusCard` y `VerifyPhoneScreen`: la segunda repetición |
| `PendingPhoneNotice` | primera verificación · cambio | el número a medias con su sello, "tu cuenta está sin verificar", y en un cambio "si cancelás, vuelve el…". Lo usan `PhoneStatusCard` y `VerifyPhoneScreen` |
| `PhonePrivacyNotice` | — | las dos mitades de FR-004, con la yerba solo en la privada. Va junto a cada campo de número |
| `PhoneNumberForm` | quieto · enviando · esperando (FR-010a) · error · no se sabe si salió (FR-009e); `isPrimary` | el renglón del número, sus errores y el pedido; el valor inicial es el número a medias cuando hay uno; `"use client"` |
| `PhoneCodeForm` | quieto · verificando · error por motivo · reenviando · reenviado · esperando | el renglón del código, sus errores, los intentos que quedan y el reenvío con su cuenta regresiva; `"use client"` |
| `CancelPendingButton` | quieto · cancelando | el botón de un `<form action>`, con su estado ocupado por `useFormStatus`; `"use client"` |
| `CodeEntryScreen` | con y sin `para` | la pantalla «Escribir el código» entera; recibe el número a medias, la puerta y la espera |
| `NotNowLink` | — | «Ahora no», con el destino ya resuelto por `gate.ts`; lo usan las dos pantallas con `para` |
| `NextCodeHint` | segundos · día y hora | "Podés pedir otro en 42 s" o "…mañana a las 9:15", fuera del botón y sin `aria-live`; lo usan `PhoneNumberForm`, `PhoneCodeForm` y `ResendLinkButton`; `"use client"` porque cuenta |
| `PhoneNotice` (app) | los avisos de las dos pantallas | lee `guardado` o `error`, le pide a `screenNotice` qué decir y monta `SavedToast` |

Cuatro `"use client"` nuevos, todos en la hoja: `PhoneNumberForm`, `PhoneCodeForm`,
`CancelPendingButton` y `NextCodeHint`. Las dos páginas son Server Components.

**Un hook nuevo, por la regla de dos**: `hooks/use-countdown.ts`. La cuenta regresiva de
`ResendLinkButton` (historia #9) y la de `NextCodeHint` son el mismo `useEffect`; se extrae y
`ResendLinkButton` pasa a usarlo, junto con `NextCodeHint`, en este PR. `docs/08` ya lo anticipaba con
el nombre `useOtpCountdown`; se llama `useCountdown` porque la de la #9 no es un OTP.

## Project Structure

### Documentation (this feature)

```text
specs/003-verificacion-de-telefono/
├── story.md                  # el cuerpo de la historia, verbatim
├── spec.md                   # el qué, endurecido
├── plan.md                   # este archivo
├── data-model.md             # tablas, funciones, resúmenes y siembra
├── contracts/actions.md      # las cuatro acciones, la compuerta y las rutas
├── quickstart.md             # cómo verlo en local y qué mirar
├── checklists/requirements.md
└── tasks.md                  # lo escribe /speckit-tasks
```

### Source Code

```text
src/
  app/[locale]/(app)/verificar-telefono/page.tsx          lee el estado y compone VerifyPhoneScreen
  app/[locale]/(app)/verificar-telefono/{loading,error}.tsx
  app/[locale]/(app)/verificar-telefono/codigo/page.tsx   Escribir el código
  app/[locale]/(app)/verificar-telefono/codigo/loading.tsx
  app/[locale]/(app)/mi-perfil/page.tsx                   suma PhoneStatusCard y PhoneNotice
  app/[locale]/(app)/mi-perfil/loading.tsx                suma el recuadro de la sección
  app/[locale]/(app)/_components/phone-notice.tsx         el aviso de las dos pantallas
  app/[locale]/_components/verification-texts.ts          los objetos de textos de las hojas cliente
  app/[locale]/_components/error-texts-provider.tsx       suma las dos claves de verification

  components/verification/…      los doce de arriba
  components/profile/saved-toast.tsx   variante error
  components/auth/resend-link-button.tsx  pasa a usar useCountdown
  hooks/use-countdown.ts

  actions/phone.ts               requestPhoneCode · resendPhoneCode · confirmPhoneCode ·
                                 cancelPendingPhone
  actions/result.ts              ActionResult<T, D> suma un segundo parámetro para el detalle

  lib/verification/rules.ts            los números de la spec, única fuente (se pasan a la base)
  lib/verification/phone-number.ts     de cualquier forma de FR-001 a E.164, y de E.164 a pantalla
  lib/verification/phone-status.ts     PhoneStatus y nivel 1 a partir de la fila (FR-012, FR-018)
  lib/verification/code.ts             generar el código; los dos HMAC con sus claves derivadas
  lib/verification/request-outcome.ts  de reserve + settle al resultado de la acción y sus eventos
  lib/verification/code-check.ts       de los hechos de check al resultado, sus eventos y lo escrito
  lib/verification/retry-at.ts         segundos, "hoy a las…" o "mañana a las…", en hora de Uruguay
  lib/verification/gate.ts             gatePath, codePath, el destino al verificar, «Ahora no»,
                                       la vuelta después de cancelar, y el ruteo de las dos
                                       pantallas y de la compuerta (gateCheck, gateScreen, codeScreen)
  lib/verification/notice.ts           qué aviso mostrar según la marca y el estado
  lib/auth/require-verified-phone.ts   requireVerifiedPhone (páginas) y checkVerifiedPhone (acciones)
  lib/schemas/phone.ts                 el número (FR-001, FR-002) y el código (FR-007b)
  lib/sms/segments.ts                  si un texto entra en un solo mensaje (GSM-7, 160)
  lib/sms/transport.ts                 twilio | outbox | none (FR-009c)
  lib/sms/twilio-outcome.ts            el error de Twilio → rejected | failed (FR-002a, FR-009a)
  lib/sms/send-sms.ts                  el envío, con su interruptor
  lib/supabase/queries/phones.ts       getMyPhone (con RLS, del lado de la dueña)
  lib/supabase/queries/phone-codes.ts  nextPhoneCodeAt · reserve · settle · check · cancel · purge
                                       (con permisos de servicio: las funciones de la base)
  lib/supabase/types.ts                regenerado con `pnpm db:types`
  lib/analytics/events.ts              siete eventos nuevos
  lib/env.ts                           TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
                                       TWILIO_MESSAGING_SERVICE_SID
  lib/i18n/request.ts                  timeZone 'America/Montevideo' (§Decisiones 8)

supabase/migrations/…_phones.sql     tablas, RLS, permisos, funciones y sus grants
supabase/seed.sql                    Marta, el teléfono verificado de Ana y el número a medias de Lucía
scripts/service-key/matchers.mjs     TWILIO_AUTH_TOKEN como clave privada
scripts/service-key/matchers.test.mjs  su caso
scripts/phone-group.mjs              el grupo de un número, para el remedio manual de FR-011a
tests/db/phones.test.ts              lo que NO se ve, lo que NO se puede y las reglas de la base
tests/gates/phone-sign-in.test.ts    + fixtures/phone-sign-in/{good,bad}/config.toml
tests/e2e/telefono.spec.ts           la puerta de punta a punta, empezando sin sesión
tests/e2e/support/mailbox.ts         leer correos y mensajes del disco (sale de alta.spec.ts)
tests/e2e/support/web-vitals.ts      LCP y CLS de una pantalla, con red y CPU limitadas (SC-008)
playwright.config.ts                 las variables de Twilio vacías en el servidor de prueba
messages/es.json                     namespace `verification` (con `verification.sms`), metadata.*
.env.example                         las tres variables de Twilio, con dónde sacarlas
docs/07, docs/10, docs/06, docs/known-limitations.md   ver §Documentación
```

**Structure Decision**: la de F00 y la #9, sin inventar nada. Se estrena
`components/verification/`, que `docs/07` §Estructura ya tenía previsto, y `lib/verification/`,
que `docs/08` ya usa de ejemplo. Las dos rutas van en `(app)` porque exigen perfil completo, igual
que `/mi-perfil`, y heredan su hoja `working`; el contenido sigue en la medida de lectura de
`PageShell`.

## Decisiones técnicas

### 1. El código es del producto; Twilio solo lo entrega

| Camino | Por qué no |
|---|---|
| OTP de teléfono del servicio de autenticación (`updateUser({ phone })` + `verifyOtp('phone_change')`), que es lo que decía `docs/07` | Dice "teléfono ya registrado" **al pedir** el código (el oráculo de FR-008); no cuenta intentos por código (FR-007); no tiene número a medias que se cancele y devuelva el anterior (FR-017b); el texto del mensaje vive en `config.toml` y no en `messages/es.json` (FR-009); y convierte al teléfono en una forma de entrar, que FR-009d prohíbe |
| Twilio **Verify** directo | Twilio genera el código y el texto (su plantilla, fuera de `messages/es.json`); un reenvío dentro de los 10 minutos manda **el mismo** código, así que "vale solamente el último" exige cancelar y recrear; y en local habría que simular Verify entero, con lo que las reglas de la spec quedarían probadas contra la simulación y no contra lo que corre en producción |
| **El producto genera y comprueba; Twilio Messaging entrega** | Una sola implementación de las reglas, la misma en local, en CI y en producción; lo único que cambia entre entornos es quién lleva el mensaje. Es el patrón de la historia #9 con el correo |

Twilio sigue siendo el proveedor, como decidió `docs/07`; cambia el producto de Twilio (Messaging
en vez de Verify) y deja de pasar por el servicio de autenticación. No es un cambio transversal de
stack: el ingreso no cambia, y el teléfono no es una forma de entrar. Lo que Verify traía y
Messaging no —la protección contra el bombeo de mensajes y los permisos por país— se configura en
la cuenta de Twilio cuando exista (solo Uruguay); queda anotado para M5. Se registra en `docs/07`
como **Decisión (2026-09-22)** en los tres lugares que nombran el OTP (la fila de Supabase, la de
OTP y el total) y se lista en los supuestos del PR para Hernán.

### 2. Las reglas con consecuencias, en la base

`next_phone_code_at`, `reserve_phone_code`, `settle_phone_code`, `check_phone_code`,
`cancel_pending_phone` y `purge_phone_records` (firma y orden de cada chequeo en `data-model.md`).
Cada una es una transacción. Las cuatro que cambian el estado de una cuenta (`reserve`, `settle`,
`check`, `cancel`) toman el mismo candado de cuenta; la de pedir toma además el candado global de
envíos. Los números llegan como parámetros desde `lib/verification/rules.ts`, así que la regla
está escrita una vez y el número una vez; los tests de la base pasan números chicos.

Lo que **no** decide la base es qué ve la persona: `check_phone_code` y `reserve_phone_code`
devuelven hechos, y `code-check.ts` y `request-outcome.ts` los traducen al resultado de la acción y
a sus eventos, en TypeScript y con test de mutación. La base decide lo que tiene consecuencias
—consumir, verificar, sumar un intento, anotar un pedido— y la aplicación decide cómo contarlo.

Las seis son `security invoker`: las llama el cliente con permisos de servicio, que ya saltea RLS,
así que `definer` no agrega nada y sí agrega riesgo. `execute` se revoca a `public`, `anon` y
`authenticated` explícitamente, porque Supabase lo concede por defecto a las funciones nuevas de
`public`, y se concede solo a `service_role`. `tests/db/phones.test.ts` lo prueba llamándolas con
sesión.

**Nivel 1 vive en TypeScript** (`phone-status.ts`), que es donde hoy se usa. Cuando M2 o M3 lo
necesiten en una policy, esa historia lo pasa a una función de la base y `phone-status.ts` la lee
de ahí: escribirlo hoy en SQL también sería la regla dos veces. Queda como supuesto en el PR.

### 2b. El teléfono no es una llave

FR-009d: el teléfono no sirve para ingresar y nada fuera de esta verificación manda un código. En
`supabase/config.toml` el ingreso por teléfono ya está apagado (`[auth.sms] enable_signup = false`,
`[auth.sms.twilio] enabled = false`, `[auth.mfa.phone]` sin enrolar ni verificar); como este plan
saca el OTP de teléfono del servicio de autenticación, **tiene que seguir apagado**. Una regla que
vive en un archivo de configuración se prende sin querer, así que pasa a ser un check:
`tests/gates/phone-sign-in.test.ts` lee `config.toml` y falla si el registro por teléfono, algún
proveedor de `[auth.sms.*]` o el MFA por teléfono se enciende. Como todo en `tests/gates/`, se
demuestra con un fixture que lo viola. El proyecto en la nube se configura aparte y este check no
lo ve: queda anotado para M5.

### 3. El mensaje sale fuera de la transacción

`reserve_phone_code` anota el pedido en `sending` y termina; el mensaje sale; `settle_phone_code`
lo pasa a `sent`, `rejected` o `failed`. Mantener el candado mientras se espera a Twilio
serializaría todo el sitio detrás de una llamada de red. `settle` toma el candado de cuenta, y si
en el medio se canceló (el pedido quedó reemplazado) o se verificó ese número, marca la entrega sin
volver a dejar el número a medias. Un proceso que muere entre las dos deja una fila en `sending`,
que cuenta para los topes hasta que se purga: es el lado seguro de la falla.

`lib/sms/twilio-outcome.ts` decide `rejected` o `failed`: 21211 (número inválido), 21614 (no es un
celular), 21610 (el destinatario se dio de baja) y 21612 (no se le puede mandar a ese número) son
**del número**, cuentan para la persona y se dicen como FR-002a. **21408 no**: es "la región no
está habilitada en la cuenta", una falla de configuración nuestra; si contara como del número, con
Uruguay sin habilitar a cada persona se le diría que su número no recibe mensajes y se le gastaría
el tope. Va con cualquier otro error, un 5xx o una red caída: **del servicio**, por FR-009a.

Si Twilio aceptó el mensaje y **después** falla `settle` (la base no respondió), el mensaje ya
salió y la fila quedó en `sending`, que no es un código vivo: el código que llegó no va a
verificar. La acción no puede decir "no salió" (sería falso) ni "salió" (no sirve): responde
`request_unknown` y la hoja hace `router.refresh()`, como en FR-009e. Es un caso de
`request-outcome.ts` con test, y una entrada de `known-limitations.md`: ese código llega muerto y
la fila cuenta para los topes hasta la purga.

### 4. Las dos claves, derivadas de la que ya existe

`HKDF-SHA256(SUPABASE_SERVICE_ROLE_KEY, info = 'phone-code' | 'phone-number')`. Es un secreto que
el servidor ya tiene, que nunca llega al cliente (lo vigila `check-service-key`) y que no está en
ninguna tabla, así que quien tenga una copia de la base no puede recalcular un código (FR-009b).
La etiqueta separa los dos usos. Una variable nueva habría pedido otro secreto en `.env.local`, en
CI y en Vercel para lograr lo mismo. Rotar la clave de servicio invalida los códigos vivos (vencen
solos en 10 minutos) y resetea los conteos (duran 24 horas): aceptable, y se dice en
`.env.example`.

El conteo por número usa **los primeros 15 bits** del HMAC. Con el resumen completo, quien tiene
la clave podría recorrer los nueve millones de celulares y recuperar el número; truncado, cada
valor son ~275 números posibles en promedio y ninguno baja de cien (FR-021; la cuenta está en
`data-model.md`).

`code.ts` recibe el azar inyectado (`generateCode(random = randomInt)`) y su test fija vectores
conocidos: un código, una clave y una cuenta dan un HMAC exacto, y un número da un grupo exacto.
Sin eso, "seis dígitos con ceros adelante" y "un entero de 15 bits" no matan los mutantes de qué
bits se toman ni del rango del azar.

### 4b. El pedido frenado en silencio es un código de verdad

FR-006a: un `skip` genera un código, guarda su HMAC, reemplaza al anterior y tiene sus 10 minutos
y sus 5 intentos; lo único que no hace es salir. Lo que ve quien escribe un código —"equivocado,
te quedan 4"— es lo mismo que si el mensaje hubiera llegado y lo hubiera escrito mal. Y la acción
responde exactamente igual a `send`: mismo `ok`, mismo número, misma hora para pedir otro, ningún
evento distinto que vuelva. Esa igualdad no vive en la acción, que no tiene test, sino en
`request-outcome.ts`, cuyo test afirma que `send` y `skip` dan el mismo resultado.

Queda una diferencia que no se iguala: `send` espera la respuesta de Twilio y `skip` no. Igualarla
con una espera artificial no la cierra —la latencia de Twilio varía más que eso— y agrega medio
segundo a cada pedido frenado. Se acepta en `known-limitations.md`: medir la diferencia pide muchos
pedidos, y cada uno gasta el tope de la cuenta. En la misma entrada va la otra diferencia que
queda: con Twilio caído, un `send` responde `send_failed` y un `skip` responde `ok`. Igualarla
obligaría a decir "no salió" de un pedido que no intentó salir; se prefiere que la caída del
servicio se vea.

### 5. Solo contra la base local el mensaje queda en disco

`lib/sms/transport.ts`, función pura con test: con las tres variables de Twilio → `twilio`; con
una o dos, nunca `twilio` (sería un `fetch` a medio configurar); sin las tres y con la base en
`127.0.0.1` o `localhost` → `outbox` (`.artifacts/sms/<fecha>.json`, con
`to` y `body`); sin ellas y con cualquier otra base → `none`, que termina como una falla de
FR-009a. Así un despliegue sin credenciales nunca escribe un código legible (FR-009c), sin agregar
una variable que alguien se olvide de sacar.

`playwright.config.ts` pone las tres variables de Twilio vacías en el servidor de la prueba, como
ya hace con `RESEND_API_KEY`.

### 5b. Cuándo se puede pedir, dicho antes de tocar

FR-010a: las pantallas que piden código llaman a `nextPhoneCodeAt(userId)` al renderizar. Al
cliente **no llega una hora absoluta**: con el reloj del teléfono corrido, el botón se habilitaría
antes de tiempo, que es la promesa rota que FR-010a prohíbe. Llega lo que ya decidió
`retry-at.ts` en el servidor, un `RetryDisplay`:

```ts
type RetryDisplay =
  | { kind: 'now' }
  | { kind: 'seconds'; seconds: number }                                   // menos de dos minutos
  | { kind: 'at'; day: 'today' | 'tomorrow' | 'weekday'; weekday?: string; time: string; seconds: number }
```

`retry-at.ts` recibe la zona **explícita** (`'America/Montevideo'`) y es el único lugar que formatea
esa hora, así que el navegador nunca la convierte a la suya. `seconds` va siempre, para que
`useCountdown` habilite el botón al llegar a cero contando desde que llegó la página y no desde el
reloj del teléfono, como ya hace `ResendLinkButton` con `initialWaitSeconds`. Si igual llega un
pedido que no se puede atender (dos pestañas), la acción responde con el `RetryDisplay` de
`next_phone_code_at` y la hoja muestra lo mismo.

**Los textos de las hojas cliente** siguen el patrón de la #9 (§Decisiones 14 de su plan): la
página traduce del lado del servidor y baja un objeto `texts` tipado. Los arma
`app/[locale]/_components/verification-texts.ts`, como `profile-form-texts.ts` arma los del
perfil: `phoneNumberFormTexts()`, `phoneCodeFormTexts()`, `nextCodeHintTexts()`. Lo que llega en
tiempo de ejecución —los intentos que quedan, los segundos, el número del último código, el día y
la hora— se arma en el cliente con plantillas del objeto y las formas de plural de
`lib/i18n/plural.ts` (`inSeconds`, y una `inAttempts` nueva con el mismo patrón y su test).

### 6. La puerta: una función para las historias que vienen

Dos formas de la misma compuerta, las dos sobre `gateCheck(status, { path, reason, from })` de
`gate.ts`, que devuelve `pass` o `{ redirect: gatePath }` y tiene test:

- `requireVerifiedPhone({ path, reason, from })`, para las **páginas**: llama a `requireProfile` y,
  sin nivel 1, redirige a `/verificar-telefono?para=publicar&next=…&desde=…`.
- `checkVerifiedPhone({ path, reason, from })`, para las **acciones**: devuelve `{ ok: true }` o
  `{ ok: false, gatePath }`, y la acción lo devuelve como `verification.errors.gate` con
  `detail.gatePath`. Un `redirect` dentro de una Server Action sacaría a la persona del formulario
  y perdería lo escrito, que FR-013 prohíbe; así la hoja cliente decide cómo llevarla al aviso sin
  perderlo.

`from` es opcional: la pantalla desde la que se tocó la acción, para «Ahora no». Las historias de
publicar y de solicitar usan la primera en su `page.tsx` y la segunda en su acción, porque la
puerta vale también al enviar (FR-013). Y es **el piso** (FR-013g): el nivel mínimo que exija un
publicador se suma encima, en esa historia, sin tocar estas funciones. No se agregan hoy botones
de publicar ni de solicitar.

`/verificar-telefono` se protege con `requireProfile` pasándole **su propia URL con la consulta
entera**, así `para`, `next` y `desde` sobreviven a ingresar y a completar el perfil (FR-013c,
FR-013e). Qué hace después lo decide `gateScreen(status, gate)`, que devuelve `render` o
`{ redirect }` y tiene test: con nivel 1 y `para`, a `next` sin pintar nada (FR-013d); también
después de cancelar un cambio desde el aviso (FR-015a). La página solo ejecuta lo que devuelve. `next` y `desde` pasan
por la misma validación de la historia #9 (`safeDestination`); `gate.ts` decide qué pasa cuando
no valen:

| Caso | Adónde |
|---|---|
| verificó con un `next` válido | `next` |
| verificó sin `next` o con uno ajeno | `/mi-perfil?guardado=telefono` (FR-013b, FR-018a). No `safeDestination` a secas, que devuelve `/mi-perfil` sin la marca y se perdería la confirmación |
| nivel 1, con `para` y sin un `next` válido | `desde` si vale, o `/mi-perfil` **sin marca**: no pasó nada que anunciar |
| «Ahora no» con `desde` válido | `desde` |
| «Ahora no» sin `desde` o con uno ajeno | `/` (FR-013e) |
| `para` desconocido | se ignora; el `next` se respeta igual (FR-013f) |

`/verificar-telefono/codigo` lleva `para`, `next` y `desde` en su URL, armada por
`codePath(gate)` en `gate.ts`. Qué hace la página lo decide `codeScreen(status, gate)`, con test:
sin número a medias, a `/verificar-telefono` con los mismos parámetros, o a `next` si ya está
verificada; con número a medias, `render`.

**Cancelar** (FR-015a) es un `<form action={cancelPendingPhone}>` con un campo oculto `from`: la
ruta entera de la pantalla desde la que se cancela. La acción lo valida con `safeDestination`, le
agrega `guardado=cancelado` (o `error=cancelar` si falló) y redirige ahí. La pantalla compone el
aviso con lo que quedó: en un cambio, el número que sigue verificado; en una primera verificación,
sin número, porque ya no hay ninguno y ponerlo en la URL lo dejaría en el historial. Si se canceló
desde el aviso y la cuenta volvió a nivel 1, `gateScreen` redirige a `next` (FR-013d). Funciona
sin JavaScript; `CancelPendingButton` solo agrega el estado ocupado. Qué dice el aviso lo decide
`screenNotice`, con test (§Diseño, Mi perfil).

### 7. El mensaje entra en uno solo, y hay un test que lo prueba

`código` y `pedí` con tilde llevan letras que **no** están en el alfabeto GSM-7 (la `ó`, la
`í`): una sola así pasa el mensaje entero a UCS-2, donde el límite baja de 160 a 70 caracteres, y
un mensaje de 100 caracteres pasa a costar dos. El texto de `verification.sms.body` se escribe sin
esas letras ("tu codigo es", "Si no lo pediste, ignoralo") —la `é` y la `ñ` sí están en GSM-7—, y
`lib/sms/segments.test.ts` renderiza el texto **real** de `messages/es.json` con un nombre de sitio
de 20 caracteres y un código, y afirma que entra en un segmento (FR-009). Si alguien le agrega una
tilde, falla el test, no la factura.

### 8. La hora de Uruguay, una sola vez

`lib/i18n/request.ts` no declara `timeZone`, y next-intl formatea entonces con la zona del
servidor: en Vercel es UTC, así que "hoy a las 18:40" saldría tres horas corrido. Se agrega
`timeZone: 'America/Montevideo'` a la configuración de next-intl, y todo `format.dateTime` del
producto queda en hora de Uruguay. `retry-at.ts` decide "hoy" o "mañana" con la misma zona, y su
test cubre la medianoche.

### 9. Las acciones orquestan; las decisiones viven en `lib/`

`actions/phone.ts` valida con el schema, llama a la base, manda el mensaje, mide y devuelve lo que
`request-outcome.ts` o `code-check.ts` le dijeron. Toda decisión con un borde vive en esas dos
funciones puras, con test:

- **`request-outcome.ts`**: de la decisión de `reserve` y el resultado de `settle` al
  `ActionResult` y a la lista de eventos. El test afirma que `send` y `skip` dan el mismo resultado
  y los mismos eventos visibles (ninguno vuelve al cliente), que `rejected` cuenta y `failed` no,
  y cada evento y cada no-evento de FR-024.
- **`code-check.ts`**: de los hechos de `check` al resultado, con la precedencia de FR-007a, los
  intentos que quedan, el número del último código para "reemplazado", si hay que ofrecer "seguir a
  la acción" después de "número en uso" (FR-008c), **si el renglón se vacía** (después de un código
  que no sirvió sí; después de una falla al comprobar, no: FR-007c), y los eventos.

`ActionResult` suma un segundo parámetro de tipo para el detalle del error
(`ActionResult<T, D = never>` con `detail?: D`), en lugar de seguir agregando campos opcionales al
tipo que comparten todas las acciones. `confirmPhoneCode` devuelve
`ActionResult<{ destination }, { attemptsLeft?, number?, continueTo?, clearInput }>`;
`requestPhoneCode`, `ActionResult<{ number, next: RetryDisplay }, { retry?: RetryDisplay }>`. Las
acciones de la #9 no cambian.

Las cuatro acciones empiezan comprobando la sesión con `getSessionUser()` y usan **ese** `user.id`
con las funciones de la base: el id nunca viene del cliente. Pedir y reenviar son dos acciones
(`requestPhoneCode(number)` y `resendPhoneCode()`): con una sola, un formulario enviado vacío
reenviaría al número a medias en vez de decir que falta el número, y el schema del formulario ya no
sería el de la acción.

Las hojas cliente atrapan el rechazo de la promesa de una acción (se cortó la red): al pedir,
muestran `verification.errors.request_unknown` y hacen `router.refresh()` para que la pantalla
muestre el estado real (FR-009e); al verificar, `verification.errors.check_failed`, conservando lo
escrito (FR-007c).

### 10. Los siete eventos

| Evento | Dónde se dispara |
|---|---|
| `phone_code_requested` | `requestPhoneCode` y `resendPhoneCode`, cuando `settle` fue `sent` |
| `phone_code_cap_reached` | ídem, cuando `reserve` devolvió `reached_cap` **y** el pedido terminó contando: `sent`, `rejected` o `skip`. Un quinto que termina `failed` no cuenta y no dispara |
| `phone_site_cap_reached` | ídem, cuando `reserve` devolvió `reached_site_cap` **y** el pedido terminó contando para el techo: `sent` o `skip`. Un `failed` o un `rejected` no manda nada y no dispara |
| `phone_verified` | `confirmPhoneCode`, con `verified` |
| `phone_changed` | `confirmPhoneCode`, con `verified` y `was_change` |
| `phone_code_failed` | `confirmPhoneCode`, con equivocado, vencido, reemplazado o agotado. **No** con `check_failed` ni con número en uso |
| `phone_number_in_use` | `confirmPhoneCode`, con `in_use` |

Del lado del servidor, con la marca de visita de la #9. Ninguno lleva el número ni la cuenta, y
ninguno vuelve en la respuesta: la diferencia entre `send` y `skip` no sale del servidor por la
medición (FR-011, FR-024). La lista la produce `request-outcome.ts` —con la decisión de `reserve`
**y** el resultado de `settle` juntos— o `code-check.ts`, así que cada disparador y cada
no-disparador está probado.

### 11. Encontrable

Las dos rutas exportan `generateMetadata` con sus textos en `messages/es.json` y `robots: { index:
false, follow: false }`: están detrás de sesión y son pasos de un trámite. Sin canónica.

### 12. Borrar la cuenta

`deleteAccount` no cambia: `phones` y `phone_codes` caen por `on delete cascade` con la persona.
Solo cambia el texto del diálogo (`profile.delete.body`), que suma el teléfono a lo que se borra
(FR-020a).

## Qué se testea, y por qué

Contra `docs/09` §Qué vale la pena testear. Lo que no está acá, no se testea.

| Archivo | Por qué vale la pena | Categoría |
|---|---|---|
| `lib/schemas/phone.ts` | cada forma de FR-001 que tiene que pasar (con cero, sin cero, `598`, `+598`, `00598`, `+598 0…`, con espacios, puntos, guiones, paréntesis) y cada rechazo de FR-002 con su motivo (fijo, extranjero, formato, vacío); el código con espacios y guiones, con letras, de 5 y de 7, un texto pegado | 2 |
| `lib/verification/phone-number.ts` | cada forma de FR-001 termina en el mismo E.164 y se muestra igual (FR-003) | 3 |
| `lib/verification/phone-status.ts` | decide el nivel 1 y lo que muestra «Mi perfil»: verificado, sin teléfono, a medias, cambio a medias (sin nivel 1 aunque haya número verificado), a medias de más de 7 días (vuelve el anterior) | 1 |
| `lib/verification/request-outcome.ts` | **send y skip dan lo mismo** (FR-006a, FR-011); rejected cuenta y failed no; `settle` que falla después del envío da `request_unknown`; `same_number`, `wait`, `daily_cap`, `site_cap` con su `RetryDisplay`; cada evento y cada no-evento, incluido que un quinto `failed` no dispara el tope | 1 |
| `lib/verification/code-check.ts` | la precedencia reemplazado → agotado → vencido → equivocado; los intentos que quedan; el número del último en "reemplazado"; "número en uso" con y sin "seguir a la acción"; si el renglón se vacía; los eventos | 1 |
| `lib/verification/code.ts` | con vectores fijos: el código a partir de un azar dado; el HMAC exacto de un código, una clave y una cuenta; el grupo exacto de un número; que la etiqueta cambia la clave | 1 |
| `lib/verification/gate.ts` | `next` y `desde` ajenos se descartan (es un redirect abierto si se hace mal); el destino al verificar con y sin `next`; `para` desconocido; la URL del aviso y la del código conservan los tres; la vuelta después de cancelar con `guardado` o `error` sobre una ruta que ya tiene consulta. **Y el ruteo**: `gateCheck` pasa o manda al aviso; `gateScreen` con nivel 1 y `para` va a `next` (también después de cancelar un cambio), con nivel 1, `para` y sin `next` va a `desde` o a `/mi-perfil` sin marca; `codeScreen` sin número a medias vuelve a verificar o va a `next` | 1 |
| `lib/verification/notice.ts` | después de cancelar, "tu número sigue siendo…" si queda uno verificado y "cancelaste la verificación" si no; el error de cancelar con variante `error`; teléfono verificado; las dos marcas de la #9. Si se equivoca, le dice a la persona algo que no pasó | 4 |
| `lib/i18n/plural.ts` | `inAttempts`, con el mismo patrón que `inSeconds`: uno y varios | 3 |
| `lib/verification/retry-at.ts` | segundos por debajo de dos minutos; hoy, mañana o un día nombrado según la hora de Uruguay —con la zona pasada, no la del equipo que corre el test—, en los bordes de la medianoche; `seconds` siempre presente | 3 |
| `lib/sms/segments.ts` | GSM-7 con sus caracteres extendidos que valen dos, 160 contra 70; **y el texto real de `verification.sms.body` entra en uno** con un nombre de 20 caracteres | 3 |
| `lib/sms/transport.ts` | sin credenciales y sin base local, nunca `outbox` (FR-009c): si se equivoca, un código queda legible en un servidor; con credenciales incompletas, nunca `twilio` | 1 |
| `lib/sms/twilio-outcome.ts` | decide si un error cuenta para la persona o no (FR-002a contra FR-009a); 21408 es del servicio | 1 |
| `tests/db/phones.test.ts` | ver abajo | 1 (RLS y reglas en la base) |
| `tests/gates/phone-sign-in.test.ts` | el ingreso por teléfono y los proveedores de mensajes del servicio de autenticación siguen apagados (FR-009d), con un fixture que lo viola | 1 |
| `scripts/service-key/matchers.test.mjs` | `TWILIO_AUTH_TOKEN` con valor en `.env.example` y con `NEXT_PUBLIC_` falla | 1 |
| `tests/e2e/telefono.spec.ts` | SC-007 entero: **sin sesión** abre `/verificar-telefono?para=publicar&next=/mi-perfil/editar`, ingresa por el enlace de `.artifacts/mail/`, completa el perfil, escribe un número único de la corrida, **lee el código de `.artifacts/sms/`**, lo escribe y llega a `/mi-perfil/editar`; después «Mi perfil» dice «Verificado». **Y SC-008**: en el camino, con red limitada a 4G y CPU ×4 por el protocolo de Chrome, mide LCP y CLS de `/verificar-telefono` y de `/verificar-telefono/codigo` con un `PerformanceObserver` y afirma LCP < 2,5 s y CLS < 0,05 | 5 |

**`tests/db/phones.test.ts`**, en serie (`describe.sequential`) y con las reglas pasadas chicas:

- **Lo que no se ve**: el teléfono ajeno sin sesión y con otra sesión; `phone_codes` y
  `phone_number_sends` ni siquiera para la dueña.
- **Lo que no se puede** (FR-019d): ni la dueña ni nadie con sesión inserta, cambia ni borra una
  fila de las tres tablas —su teléfono, su fecha, su registro de pedidos, los intentos de su
  código, el conteo—; las seis funciones no se pueden llamar ni con sesión ni sin ella.
- **Las reglas**: la espera; el tope de la cuenta; el tope por número entre dos cuentas, mudo;
  el techo, que cuenta los frenados en silencio; el mismo número; un `skip` da "equivocado" al
  confirmar; veinte pedidos en paralelo dan un solo envío; cinco intentos en paralelo no dan un
  sexto; dos cuentas confirmando el mismo número dan una sola verificada; `settle` después de un
  cancelar no revive el número a medias; cancelar devuelve el número anterior con su fecha; en uso
  descarta el número a medias; borrar la persona borra lo suyo y deja el conteo por número.
- **Aislamiento**: `phone_number_sends` no tiene cuenta y sobrevive al borrado de las personas de
  prueba (FR-021), así que el `cleanup` de `asNewUser` no lo limpia. El archivo lo vacía con
  permisos de servicio antes y después de cada prueba de topes, y usa números al azar por prueba.
  Sin eso, las filas del test del techo dejarían al e2e de la misma `pnpm verify` chocando con
  `site_cap`. La base local solo tiene datos sintéticos, así que vaciarla no toca a nadie.

`hooks/use-countdown.ts` no se testea: `docs/09` excluye los hooks de UI. Tampoco: las páginas, los
componentes (su conducta la deciden `phone-status.ts`, `code-check.ts`, `retry-at.ts` y `gate.ts`,
que sí tienen test), `send-sms.ts` (el transporte; su decisión está en `transport.ts`), las queries
finas y las acciones, que solo orquestan.

Stryker corre sobre los archivos de la tabla que tienen test al lado. Score 100 %, con las
excepciones anotadas en su línea si aparecen.

## Documentación en este PR

- `docs/07-stack.md`: las tres menciones del OTP (fila de Supabase, fila de OTP, total) pasan a
  "Twilio Messaging, el código lo genera el producto", con **Decisión (2026-09-22)** y la tabla de
  §Decisiones 1; sin dependencias nuevas. En §Riesgos de los tiers gratuitos, lo que hay que
  configurar en Twilio para M5 (solo Uruguay, protección contra el bombeo de mensajes) y el check
  de FR-009d que la nube necesita.
- `docs/10-design-system.md`: los doce componentes de `verification` y `PhoneNotice` en la tabla,
  `SavedToast` con su variante nueva, `ErrorTextsProvider` con sus seis claves (eran cuatro), y
  **Decisión (2026-09-22)**: el estado del teléfono es un sello y la chapita espera a la historia
  #12.
- `docs/07-stack.md` §Estructura: la verificación queda en `(app)` y no en `(auth)`, como preveía
  el árbol: exige perfil completo, igual que «Mi perfil».
- `docs/06-i18n.md`: `verification.sms` como convención, y el glosario: "número a medias", "nivel
  1", "distintivo" (la chapita; `docs/03` dice "badges").
- `docs/known-limitations.md`: el envío real por Twilio no se probó; los rechazos que Twilio
  descubre tarde (sin callback); un `settle` que falla después del envío deja un código muerto; el
  bloqueo sostenido de un número y del techo con cuentas nuevas (FR-011a, FR-011b), con el remedio
  manual escrito como comando —`node scripts/phone-group.mjs <número>` calcula el grupo con la
  clave derivada, y la entrada dice el `delete` que lo libera— y el cruce con KL-004 (las claves
  `sb_secret` de M5 cambian la clave de la que se derivan los resúmenes); el abandono por visita es
  una aproximación (FR-024a); las diferencias entre send y skip que quedan (latencia, Twilio
  caído); sin tráfico la purga no corre y los datos viven más que lo que dicen FR-015, FR-021 y
  FR-022 hasta el cron de M5; el check de FR-009d no ve la nube.
- `.env.example`: las tres variables de Twilio.

## Riesgos

| Riesgo | Qué hacemos |
|---|---|
| El envío por Twilio no se puede probar sin cuenta ni remitente aprobado para Uruguay | Contra la base local el mensaje va a disco y el e2e lo lee; la llamada a Twilio es un `fetch` con su resultado clasificado por una función con test. KL, cierra con el primer mensaje real, antes de la beta |
| Twilio rechaza algunos números después de aceptarlos (30003–30007), y eso llega por callback | Sin callback, esos mensajes cuentan como enviados. KL, cierra al agregar el callback de estado con el proyecto en la nube |
| SC-008 pide medir dos pantallas con sesión, y `.lighthouserc.json` mide solo `/` | Lo mide el e2e, que ya tiene la sesión, con red y CPU limitadas y LCP y CLS leídos en la página. No es Lighthouse, pero mide lo mismo que SC-008 pide sin tocar la etapa de Lighthouse ni sumar una dependencia para ingresar |
| Serializar todos los pedidos del sitio en un candado | Dura tres `count` y un `insert`; el mensaje sale fuera. Si algún día pesa, el candado global se parte por grupo de número |
| Una fila `sending` huérfana si el proceso muere a mitad | Cuenta de más, nunca de menos; se purga a las 24 horas |
| `pnpm lighthouse` no termina en Windows (KL-001) | Esa etapa se verifica en CI, como ya está aceptado |
| Una tilde en el texto del mensaje duplica el costo | `lib/sms/segments.test.ts` lo prueba contra el texto real |
