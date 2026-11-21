# Research: Al marcar un animal dado por fuera, decir por dónde llegó quien lo adoptó

## R1. Dónde vive el canal: solo en la medición

- **Decision**: el canal es una propiedad más de `pet_handed_over`, el momento que ya se mide al
  marcar adoptado (#67, #206). No se guarda en la base, no hay migración ni tabla, y ninguna pantalla
  lo lee.
- **Rationale**: la historia dice que la respuesta «va solo a la medición de esa adopción» y que «no
  queda con el animal» (decisión 2026-10-29), y que no se muestra en Encuestas (decisión 2026-11-21)
  porque la adopción por fuera ya se cuenta y el canal va con ella. Sin dato guardado no hay regla de
  visibilidad nueva ni nada que borrar con la cuenta.
- **Alternatives considered**: una tabla sin persona como la de #263 (`deletion_reasons`): la
  historia la descarta para este caso, porque #263 guarda aparte solo porque el borrado no deja nada
  que medir. Una columna en la adopción: quedaría con el animal, contra la historia.

## R2. Una vez por adopción: el `done` de la base

- **Decision**: `markPetAdopted` mide solo cuando `markPetAdoptedRecord` devuelve `outcome = 'done'`,
  como hoy. El canal se suma a ese mismo `handoverEvent`.
- **Rationale**: el intento (`attemptId`) ya hace que el doble toque y el reintento que había
  llegado vuelvan `already` sin medir (FR-055 de #67), y `changed`, la sesión cerrada o un error no
  llegan a medir. Eso cumple FR-009 y FR-011 sin nada nuevo. En el reintento que sí había llegado,
  vale el canal del intento que llegó, aunque se cambie antes de reintentar (spec, Assumptions).
- **Alternatives considered**: medir en el cliente al confirmar: contaría intentos que no se
  hicieron.

## R3. La forma del canal: clave fija, `unanswered` y `null`

- **Decision**: `FOUND_VIA_OPTIONS = ['facebook', 'instagram', 'whatsapp', 'seen_here',
  'someone_known', 'other']`, en el orden de la historia. La acción recibe `foundVia: FoundVia | null`
  (null es «no eligió»). `handoverEvent` emite `found_via`: por el sitio `null`; por fuera la opción
  o `'unanswered'`.
- **Rationale**: «sin contestar» es un valor del canal de una adopción por fuera (spec,
  Assumptions); `null` en una adopción por el sitio separa las dos lecturas sin mirar `to`. La regla
  vive en una función pura con prueba. `seen_here` no lleva el nombre del animal: el texto de la
  cuarta opción se arma en pantalla con `{name}`, la clave viaja sola (FR-017).
- **Alternatives considered**: omitir la propiedad cuando no se contesta: un momento sin la propiedad
  no se distingue de uno anterior a la historia, que la lectura tiene que dejar afuera.

## R4. Lo elegido en la pantalla

- **Decision**: `useHandover` guarda `foundVia` como texto (`''` es ninguna, como pide `RadioGroup`
  controlado con `clearable`). `choose(camino)` lo vacía siempre; al confirmar,
  `handoverRequest({ petId, attemptId, choice, foundVia })` arma la entrada: con una persona,
  `applicationId` y `foundVia: null`; por fuera, `applicationId: null` y `foundViaOf(foundVia)`.
  Mientras marca, el campo queda deshabilitado; lo que no llegó deja lo elegido (FR-012).
- **Rationale**: vaciar al cambiar de camino cumple FR-013 y US1-AS4/AS5 (al volver al camino por
  fuera, nada elegido). `RadioGroup` solo llama `onChange` cuando cambia la elegida, así que tocar
  otra vez «por fuera» no lo vacía. `handoverRequest` es pura y deja probar con Stryker que una
  adopción por el sitio nunca manda canal.
- **Alternatives considered**: conservar lo elegido entre idas y vueltas: contaría una opción que la
  persona ya no ve elegida después de pensarlo de nuevo.

## R5. Textos

- **Decision**: `adoptions.handover.found_via.{title, hint, options.<clave>}` en `messages/es.json`;
  `options.seen_here` lleva `{name}`, que es el nombre con el que la pantalla nombra al animal o a la
  cría (`named.name`, con `young_label`). El título y las opciones son los de la historia, palabra por
  palabra. El `hint` lo escribe la build con `sin-slop`; borrador: «Si te acordás. Se marca igual sin
  elegir ninguna.»
- **Rationale**: el título y las opciones no concuerdan con el sexo; la concordancia de la pantalla
  ya está en los textos de hoy. La línea de opcional va como `hint`, igual que en #263, para que no
  suene a formulario sin tocar el título.

## R6. Qué se prueba

- **Unitarias (Stryker al 100 %)**: `foundViaOf` (cada opción, vacío, algo que no es opción);
  `handoverRequest` (persona con canal tocado → `foundVia: null`; por fuera con y sin canal);
  `handoverSchema` (cada opción y `null` válidos; otra clave, falta del campo o campo de más
  rechazados); `handoverEvent` (por fuera con canal, por fuera sin canal → `unanswered`, por el sitio
  con canal → `null`, una cría por fuera con su canal).
- **e2e (`handover.spec.ts`)**: con una aceptada, elegir «por fuera» muestra la pregunta sin nada
  elegido; tocar una opción, tocarla otra vez y queda sin elegir; pasar a la persona la saca; volver a
  «por fuera» la muestra vacía; marcar por fuera sin contestar funciona. Sin aceptadas, la pregunta
  está al abrir y marcar con una opción funciona. En una cría, la cuarta opción lleva su nombre.
- **No se prueba**: que el momento llegue a PostHog (en pruebas no sale nada, `track.ts`), la página
  ni `FoundViaField` por separado, que solo pintan.

## R7. Lectura 15 en docs/03 §Métricas de éxito

- **Decision**: «¿Contra qué canal se pierde una adopción?» (#254): `pet_handed_over` con `to` =
  `outside` por `found_via`; Facebook, Instagram y WhatsApp juntos contra `seen_here`, con
  `someone_known`, `other` y `unanswered` aparte, al lado de `to` = `site`. Se cuenta desde el día en
  que llegó la historia (los anteriores no traen `found_via`), una por adopción y por cría, y con 3 a
  5 rescatistas se lee como señal al lado de las encuestas y de la lectura 8 (#263).
