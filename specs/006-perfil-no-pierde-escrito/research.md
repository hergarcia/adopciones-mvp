# Research — El perfil no pierde lo escrito

## R1. Qué pasa con una Server Action cuando no hay red o no contesta

- **Decisión**: envolver la llamada en `try/catch` y en una carrera contra un plazo de 30 s, con un
  número de intento para descartar respuestas viejas.
- **Motivo**: sin red, la llamada a la acción rechaza la promesa (`TypeError: Failed to fetch`).
  Dentro de `startTransition`, un rechazo sin atrapar sube al límite de error más cercano: es
  exactamente «Algo se rompió» en el alta y el `error.tsx` de `/mi-perfil` («No pudimos traer tu
  perfil») al editar, que es lo que vio la aceptación de la historia #9. Una Server Action no se
  puede cancelar desde el cliente, así que el plazo no aborta el pedido: deja de esperarlo.
- **Restricción**: Next despacha las Server Actions de un mismo cliente **de a una** (la
  documentación de Server Functions lo dice así: el cliente las manda y las espera una por vez). Un
  reintento después de un plazo vencido queda en fila detrás del intento colgado. Sin red, el
  intento falla enseguida y la fila no se nota; con el sitio lento, el reintento puede tardar otro
  plazo. Se acepta: la persona no pierde nada y el aviso vuelve a decir lo que pasa.
- **Alternativas**: un Route Handler con `fetch` y `AbortController` (se podría cancelar, pero
  rompe la convención de Server Actions con `ActionResult<T>` de docs/08 y duplica validación y
  sesión); reintentar solo (descartado por la decisión 2026-09-26 del product-owner).

## R2. Cómo saber «sin conexión» frente a «el sitio no respondió»

- **Decisión**: `navigator.onLine === false` al tocar guardar → «sin conexión», sin mandar nada. Si
  la llamada lanza, se mira `navigator.onLine` en ese momento: `false` → «sin conexión»; `true` →
  «el sitio no respondió». Plazo vencido → «el sitio no respondió». Una respuesta
  `profile.errors.save_failed` (la base no guardó) → «el sitio no respondió» (FR-003).
- **Motivo**: `navigator.onLine === false` es confiable (el dispositivo sabe que no tiene red); el
  `true` es optimista, y ese caso cae en «no respondió», que desde la persona es cierto y ofrece lo
  mismo. Playwright lo simula con `context.setOffline(true)`, que pone `onLine` en `false` y corta
  los pedidos.
- **Alternativas**: un ping a una ruta propia antes de guardar (un pedido más en cada guardado, y
  con mala señal el ping también miente).

## R3. Por qué el borrador pierde departamento y localidad (KL-024)

- **Decisión**: reproducir primero con un e2e (recargar el alta con departamento y localidad
  elegidos) y arreglar la causa que el test muestre. Hipótesis, en orden:
  1. `ProfileFields` borra la localidad **cada vez** que el `Select` avisa un valor, aunque sea el
     mismo. Al restaurar el borrador después de hidratar, el `select` oculto de Radix avisa el valor
     restaurado; el formulario borra la localidad y el efecto de escritura guarda el borrador ya sin
     ella. Arreglo: borrar la localidad solo si el departamento nuevo es distinto del actual.
  2. Radix avisa `''` antes de tener las opciones: `Select` ya lo filtra (`next !== ''`), pero si el
     borrador se escribe entre ese aviso y la restauración, queda vacío. Arreglo: no escribir hasta
     haber restaurado (ya es la regla) y confirmar con el test.
- **Motivo**: la aceptación de #9 vio que solo sobrevive el nombre; el nombre es el único campo sin
  `Select` ni dependencia de otro campo.

## R4. El plazo: 30 segundos

- **Decisión**: 30 s desde que se toca guardar.
- **Motivo**: la foto viaja procesada en el cliente (WebP achicada), así que un guardado normal
  tarda pocos segundos aun con 3G; 30 s da margen a la subida de la foto con señal mala sin dejar a
  la persona mirando un botón ocupado sin fin. Es una constante con nombre en `lib/profile/`.
- **Alternativas**: 15 s (corta subidas de foto legítimas en 2G/EDGE); 60 s (demasiado para
  alguien parado en la calle con el teléfono).

## R5. Cómo llegan a la medición los fallos sin conexión

- **Decisión**: una cola en memoria en `useProfileSave`, vaciada con una acción propia
  (`reportProfileSaveFailures`) al evento `online` y antes de cada intento; el guardado que sale
  lleva `recovered=true`.
- **Motivo**: sin conexión no hay cómo mandar nada en el momento del fallo (FR-020). Separar el
  reporte del guardado mantiene `saveProfile` con una sola responsabilidad y deja reportar aunque
  la persona no vuelva a guardar. Lo que se pierde si cierra sin volver a tener conexión se acepta
  (spec §Assumptions).
- **Alternativas**: mandar los fallos dentro del `FormData` del guardado (acopla medición y
  guardado, y no cubre «vuelve la conexión con la pantalla abierta»); guardarlos en `localStorage`
  entre visitas (más superficie, y la spec lo descartó).

## R6. El dueño del borrador

- **Decisión**: el id interno de la cuenta (`auth.users.id`), en claro, junto a los valores.
- **Motivo**: ese navegador ya lo tiene en la sesión (la cookie de Supabase lo lleva); no es el
  correo ni el nombre, que es lo que FR-016 prohíbe. Un hash no agregaría privacidad: el id no es
  secreto para ese navegador.
- **Alternativas**: el correo (dato personal, prohibido); una clave por cuenta
  (`profile-draft:<id>`), que deja borradores de otras cuentas en el navegador en vez de
  descartarlos.

## R7. Contar el alta una vez sin guardar nada nuevo

- **Decisión**: el formulario manda `mode`; la acción decide con `profileSaveOutcome`.
- **Motivo**: el reintento de un alta que llegó encuentra el perfil ya creado, y hoy lo cuenta como
  edición y confirma «Cambios guardados». Con `mode=create` la acción sabe que la persona estaba
  dando el alta y responde como tal, sin evento. Para la edición no hay forma de distinguir un
  reintento de una segunda edición sin guardar algo por cada guardado; se acepta ese ruido (spec
  §Assumptions) y «recuperado» permite descontarlo.
- **Alternativas**: una clave de idempotencia por guardado guardada en el perfil (una columna y una
  migración para sacar ruido de un evento).
