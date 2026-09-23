# Data model: Verificación de teléfono

Tres tablas y seis funciones en una migración nueva. Ninguna tabla existente cambia: el teléfono
no va a `profiles`, porque `profiles` tiene policies de escritura para su dueña y el teléfono
verificado es justamente lo que la dueña **no** puede escribir sola.

## `public.phones` — el teléfono de cada cuenta

Una fila por cuenta, como mucho. Nace al pedir el primer código y se borra con la cuenta.

| Columna | Tipo | Nulo | Qué es |
|---|---|---|---|
| `user_id` | `uuid` PK, FK `auth.users(id) on delete cascade` | no | la cuenta |
| `verified_number` | `text` **unique** | sí | el número verificado, en E.164 (`+59899123456`) |
| `verified_at` | `timestamptz` | sí | desde cuándo (FR-018) |
| `pending_number` | `text` | sí | el número a medias (FR-015) |
| `pending_since` | `timestamptz` | sí | cuándo quedó a medias; a los 7 días se descarta |
| `updated_at` | `timestamptz` | no | `touch_updated_at()`, el trigger que ya existe |

Checks:

- `verified_number` y `verified_at` son nulos juntos; `pending_number` y `pending_since` también.
- Los dos números cumplen `^\+5989[1-9][0-9]{6}$`: un celular uruguayo en E.164. La base rechaza
  lo que el schema de la app dejó pasar por error.
- `pending_number <> verified_number` (con nulos, el check pasa): FR-017c no deja iniciar un cambio
  al mismo número.

El `unique` de `verified_number` es **la** regla de FR-008 y FR-008a: dos cuentas que confirman el
mismo número a la vez chocan acá y una sola gana. Un `unique` de Postgres no cuenta los nulos, así
que las cuentas sin teléfono no chocan entre sí.

**Nivel 1** no se guarda: se calcula (`lib/verification/phone-status.ts`) como `verified_number`
no nulo y ningún `pending_number` de menos de 7 días. Guardarlo sería tener dos fuentes para lo
mismo.

**RLS**: habilitada. Una sola policy, `phones_select_own` (`to authenticated using ((select
auth.uid()) = user_id)`). **Permisos**: `revoke all` a `anon` y `authenticated`, y `grant select`
solo a `authenticated`. **Sin policies de insert, update ni delete**: toda escritura pasa por las
funciones de abajo, con permisos de servicio, desde una acción que ya comprobó la sesión. Si la
dueña pudiera actualizar su fila, se pondría `verified_number` sin ningún código.

## `public.phone_codes` — cada código pedido

| Columna | Tipo | Nulo | Qué es |
|---|---|---|---|
| `id` | `uuid` PK | no | |
| `user_id` | `uuid` FK `auth.users(id) on delete cascade` | no | quién lo pidió |
| `number` | `text` | sí | a qué número (mismo check E.164). Se pone en nulo **apenas el código deja de estar vivo**: al cerrar un pedido `failed` o `rejected`, al reemplazarlo (`settle`, `cancel`), al consumirlo (`check`). Ninguna regla lo necesita después —`same_number` lee `phones`, "reemplazado" nombra el número del vivo, los topes cuentan filas— y puede ser el de otra persona por un error de tipeo (FR-023, constitución §V) |
| `code_digest` | `text` | sí | HMAC del código (ver abajo). Nulo si el mensaje falló o fue rechazado |
| `requested_at` | `timestamptz` | no | |
| `expires_at` | `timestamptz` | no | `requested_at + 10 min` |
| `superseded_at` | `timestamptz` | sí | cuando se pidió otro o se canceló |
| `consumed_at` | `timestamptz` | sí | cuando se usó (verificó, o dio número en uso) |
| `failed_attempts` | `smallint` | no | `>= 0`. El máximo (5) no se repite en la base: llega como parámetro desde `rules.ts` |
| `delivery` | `text` | no | `sending` · `sent` · `failed` · `rejected` · `skipped_rate_limit`, con el check nombrado `phone_codes_delivery_valid`, como `login_links_delivery_valid` |
| `number_send_id` | `bigint` FK `phone_number_sends(id) on delete set null` | sí | el conteo por número que este pedido sumó |

Índices: `(user_id, requested_at desc)`, porque todas las lecturas son "los de esta cuenta, los más
nuevos primero"; y `(number_send_id)`, para el `on delete set null` al purgar el conteo.

**El código vivo** de una cuenta es el último con `delivery` en `sent` o `skipped_rate_limit`, sin
`consumed_at` ni `superseded_at`. Un pedido frenado en silencio **es un código vivo como cualquier
otro** (FR-006a): tiene su `code_digest` —de un código que se generó y no se mandó—, reemplaza al
anterior, vence a los 10 minutos y tiene sus 5 intentos. Nadie lo recibió, así que lo que se
escriba es "equivocado", que es exactamente lo que vería quien escribe mal uno que sí llegó. Acá
esta historia se aparta de la #9, que dejaba vivo el enlace anterior: con un código de seis
dígitos, dejarlo vivo cambiaba lo que la persona ve al escribir, y esa diferencia era el oráculo.

`delivery` y los topes:

| Valor | Cuenta para el tope de la cuenta | Suma al conteo por número |
|---|---|---|
| `sending` | sí (el mensaje está saliendo) | sí |
| `sent` | sí | sí |
| `skipped_rate_limit` | sí: es un pedido de la persona, y si no contara delataría el tope mudo (FR-010) | **no** (su fila lleva `skipped = true`), pero **sí** cuenta para el techo del sitio |
| `rejected` | sí: el servicio rechazó **el número**, que es lo que la persona escribió (FR-002a) | **no**: la fila del conteo se borra |
| `failed` | **no**: falló el servicio (FR-009a) | **no**: la fila del conteo se borra |

**RLS**: habilitada y **cero policies**, como `login_links`: guarda el número en claro y el
resumen del código, así que no la lee nadie desde el cliente, ni siquiera su dueña. **Permisos**:
`revoke all` a `anon` y `authenticated`, como defensa en profundidad además de la RLS.

## `public.phone_number_sends` — cuántos códigos recibió cada número

| Columna | Tipo | Qué es |
|---|---|---|
| `id` | `bigint` identity PK | |
| `number_digest` | `integer` | el grupo del número: HMAC truncado a 15 bits (ver abajo) |
| `sent_at` | `timestamptz` | |
| `skipped` | `boolean` | el tope por número frenó el pedido en silencio: no salió ningún mensaje |

Índices: `(number_digest, sent_at desc)` para el tope por número, y `(sent_at)` para el techo del
sitio, que filtra solo por fecha.

**Sin columna de cuenta, a propósito** (FR-021): es lo único que sobrevive al borrado de una
cuenta, y sobrevive porque no la nombra. Sin el número y sin la cuenta, no hay forma de volver de
una fila a una persona. Se borra a las 24 horas.

La tabla sirve también para el **techo del sitio** (FR-011b), que cuenta **todas** las filas de las
últimas 24 horas: los mensajes que salieron o están saliendo, y los pedidos frenados en silencio
(`skipped`). Si esos no contaran, un sitio a un mensaje del techo serviría para averiguar si el
pedido anterior a un número salió. El tope por número cuenta solo las filas con `skipped = false`.

**RLS**: habilitada y cero policies. **Permisos**: `revoke all` a `anon` y `authenticated`.

## Los dos resúmenes con clave

Los dos son `HMAC-SHA256`, con claves derivadas por HKDF de `SUPABASE_SERVICE_ROLE_KEY` con dos
etiquetas distintas (`phone-code`, `phone-number`). La clave nunca entra a la base.

- **`code_digest = HMAC(k_code, user_id + ":" + código)`**. Un código de seis dígitos tiene un
  millón de valores: un hash sin clave se revierte en milisegundos. Con la clave afuera, quien lea
  la tabla no puede recuperar un código vigente (FR-009b). El `user_id` adentro hace que el mismo
  código en dos cuentas no dé el mismo resumen.
- **`number_digest` = los primeros 15 bits de `HMAC(k_number, número E.164)`**, como entero
  (`0..32767`). Los celulares uruguayos son nueve millones (`09[1-9]` y seis dígitos): un resumen
  completo, aun con clave, lo puede revertir quien tenga la clave recorriendo los nueve millones.
  Truncado a 15 bits hay 32 768 grupos de **unos 275 números en promedio**; con esa media y un
  HMAC que reparte parejo, el grupo más chico de los 32 768 queda alrededor de 200, lejos del piso
  de cien que pide FR-021: ni con la clave se puede saber de cuál se trata. Con 16 bits la media
  sería 137 y los grupos más chicos quedarían por debajo de cien, que es por qué no se eligió. El
  costo es que los números de un grupo suman juntos para el tope de 10: con cien números pidiendo
  códigos en un día, que uno comparta grupo con alguno es menos de uno en trescientos, y el peor
  caso es la espera de FR-011a. `tests/db/phones.test.ts` no prueba la distribución (es una
  propiedad del HMAC); `lib/verification/code.test.ts` prueba que el resultado tiene 15 bits. La clave sigue haciendo falta: sin ella, cualquiera que lea la tabla sabría a qué
  grupo pertenece un número dado y podría ver si recibió códigos.

Rotar la clave de servicio invalida los códigos vivos (vencen igual en 10 minutos) y resetea los
conteos (duran 24 horas). Es un costo aceptable y queda dicho en `plan.md`.

## Funciones

Todas `security invoker`, `set search_path = ''`, con `execute` revocado a `public`, `anon` y
`authenticated`, y concedido solo a `service_role`. Los números de las reglas (10 minutos, 5
intentos, 60 segundos, 5 por día, 24 horas) llegan **como parámetros** desde
`lib/verification/rules.ts`, que es su única fuente.

`reserve_phone_code`, `settle_phone_code`, `check_phone_code` y `cancel_pending_phone` toman el mismo candado por cuenta
(`pg_advisory_xact_lock` sobre `hashtextextended('phone-user:' || user_id, 0)`): pedir, confirmar y
cancelar de una misma cuenta se hacen de a uno. Sin eso, veinte pedidos en paralelo pasan todos el
chequeo del tope antes de que el primero se anote, y veinte intentos en paralelo se saltean el
límite de cinco. `reserve_phone_code` toma además, **después**, un candado global de envíos
(`'phone-sends'`), que es el que cuida el tope por número y el techo del sitio entre cuentas
distintas. El orden es siempre cuenta → global, y las otras funciones no toman el global, así que
no hay ciclo posible. Serializar todos los pedidos del sitio no cuesta nada a este volumen: el
candado dura lo que tardan tres `count` y un `insert`; el mensaje sale después, fuera de la
transacción.

### `next_phone_code_at(user_id, …reglas) → timestamptz`

Cuándo puede pedir esta cuenta su próximo código: el **más tardío** entre el fin de la espera, la
liberación del tope diario y la del techo del sitio; nulo si puede ya. Las pantallas la usan para
deshabilitar el botón y decir cuándo (FR-010a), y `reserve_phone_code` la usa adentro, así que lo
que se muestra y lo que se cumple salen de la misma cuenta. No toma candados: es una lectura, y si
entre la lectura y el pedido cambió algo, `reserve_phone_code` responde con la misma información.
No dice nada del tope por número, que es mudo.

### `reserve_phone_code(user_id, number, number_digest, code_digest, …reglas) → (decision, code_id, retry_at, reached_cap, reached_site_cap)`

En orden:

1. `number` es el `verified_number` de la cuenta → `same_number` (FR-017c). No anota nada.
2. `next_phone_code_at` dice que todavía no se puede → `wait`, `daily_cap` o `site_cap`, **según
   cuál de los tres frenos se libera más tarde**, con `retry_at` = lo que devolvió
   `next_phone_code_at`. Así la respuesta y la pantalla dicen la misma hora (FR-010a). El techo no
   anota nada: no es un acto de la persona que tenga que contarle.
3. El grupo del número recibió 10 códigos en 24 horas → anota un pedido `skipped_rate_limit` **con
   su `code_digest`**, reemplaza el código vivo, deja el número a medias, suma una fila `skipped` a
   `phone_number_sends` → `skip`. En todo lo observable es igual a `send` (FR-006a, FR-011): la
   acción responde lo mismo, la pantalla del código muestra lo mismo, y confirmar da "equivocado".
4. Si no → anota el pedido en `sending` con su `code_digest`, suma una fila a
   `phone_number_sends` → `send`, con el `code_id`.

`reached_cap` dice si este pedido dejó a la cuenta en su quinto de 24 horas, y `reached_site_cap`
si este envío dejó al sitio en 200: son los disparadores de «Tope alcanzado» y «Techo del sitio
alcanzado» (FR-024), que se registran al llegar al tope y no al chocar con él, porque FR-010a no
deja chocar.

El orden importa en dos lugares. Los topes de la cuenta van antes que todo lo demás porque son los
únicos que se le cuentan a la persona como propios. Y el techo del sitio va antes que el tope por
número: si fuera después, un número con el cupo lleno recibiría `skip` y uno sin cupo `site_cap`, y
esa diferencia sería el oráculo que FR-011 prohíbe.

### `settle_phone_code(code_id, outcome) → void`

`outcome` es `sent`, `rejected` o `failed`. Toma el candado de cuenta: entre `reserve` y `settle`
pasa una llamada de red, y en ese rato la persona pudo cancelar o confirmar en otra pestaña.

- `sent`: `delivery = 'sent'`. Si el pedido **sigue sin reemplazar** y el número no quedó
  verificado en el medio: reemplaza los otros códigos vivos de la cuenta (FR-006, recién ahora que
  hay uno nuevo en camino) y deja el número a medias con `pending_since = now()`, que vuelve a
  contar los 7 días con cada pedido (FR-015). Si en el medio se canceló —`cancel_pending_phone`
  reemplaza también los pedidos en `sending`— o ese número ya quedó verificado, solo marca la
  entrega: no revive un número a medias que la persona acaba de cancelar, ni lo deja igual al
  verificado, que el check de la tabla rechazaría.
- `rejected` o `failed`: ese `delivery`, `code_digest = null`, `number = null`, y borra su fila de
  `phone_number_sends`, porque no salió ningún mensaje. No toca el número a medias ni el código
  vivo anterior (FR-006, FR-009a). La diferencia entre los dos es solo si cuenta para los topes de
  la cuenta (tabla de arriba).

### `check_phone_code(user_id, code_digest, max_attempts, window) → (hechos)`

`window` son las 24 horas: los códigos reemplazados se comparan solo dentro de esa ventana, así que
"reemplazado" contra "equivocado" (FR-007a) no depende de que la purga haya corrido.

Devuelve **hechos**, no un mensaje: `verified`, `was_change`, `in_use`, `no_live_code`,
`matches_superseded`, `expired`, `exhausted`, `attempts_left` y `live_number` (el número del código
vivo, que el mensaje de "reemplazado" nombra, FR-007a). Cuál de los motivos se le muestra a
la persona lo decide `lib/verification/code-check.ts`, en TypeScript y con test. Lo que decide la
base es lo que tiene consecuencias:

- Coincide con el vivo, no venció y le quedan intentos → lo consume y pasa el número a medias a
  verificado, con `verified_at = now()`. Si el `unique` salta, el código queda consumido, el número
  a medias se descarta y el verificado anterior —si había— queda como estaba → `in_use` (FR-008).
- No coincide y el vivo todavía sirve → `failed_attempts + 1`. **También si coincide con uno
  reemplazado**: para el vivo, es un intento más de adivinarlo (FR-007). Un texto que no tiene seis
  dígitos no llega acá: lo frena el schema (FR-007b).
- El vivo ya no sirve → no cambia nada.

### `cancel_pending_phone(user_id) → void`

Borra el número a medias y reemplaza el código vivo **y cualquier pedido en `sending`**, para que
un `settle` que llega tarde no lo reviva. Si la cuenta tenía un número verificado,
queda como estaba, con su fecha original (FR-017b). Si la fila queda sin nada, se borra.

### `purge_phone_records(window, pending_ttl) → void`

Borra los `phone_codes` y `phone_number_sends` de más de 24 horas (FR-021, FR-022), descarta los
números a medias de más de 7 días (FR-015) y borra las filas de `phones` que quedaron vacías. Corre
al pedir un código, que es lo único que hace crecer las tablas, como `purgeExpired` en la historia
#9. Cuando exista el cron diario (M5), corre ahí también.

## Borrar la cuenta

No hace falta tocar `deleteAccount`: `phones` y `phone_codes` caen por `on delete cascade` cuando
se borra la persona del servicio de autenticación, que ya es el último paso del borrado. Lo que
queda es `phone_number_sends`, que no tiene cuenta (FR-021). `tests/db/phones.test.ts` lo prueba
borrando una persona.

## Siembra

`supabase/seed.sql` suma una cuarta persona y el teléfono de dos, para que el driver de capturas
tenga los tres estados de «Mi perfil» sin fabricarlos a mano:

| Persona | Estado |
|---|---|
| Ana | verificada, `+59899123456`, desde el 2026-09-20 |
| Lucía | con un número a medias, `+59898765432`, sin código: un código necesita la clave de servicio para su HMAC, que no está en la base ni se escribe en `seed.sql` (lo frenaría `check-service-key`), y vencería a los 10 minutos del `db reset`. «Escribir el código» se dibuja con el número a medias, y el código se prueba pidiéndolo |
| Marta (nueva) | perfil completo, sin teléfono |
| Nueva | sin perfil, como hoy |
