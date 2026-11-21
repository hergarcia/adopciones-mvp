# Research: Que el filtro «Solo de quien verificó su identidad» y sus avisos cumplan lo que dicen

Revisado sobre `main` en 29d7f89.

## R1. Qué queda marcado cuando falla un filtro

**Decision**: `ListingState` suma `shownFilters: ListingFilters`, los filtros con los que se pidieron
las cards a la vista. La falla suma `wanted: ListingFilters | null`, lo que la persona había marcado.
En `listingReducer`:

- `filter`: `filters` pasa a lo marcado (la carga de hoy); `shownFilters` no cambia.
- `loaded` de un filtro o de una renovación: `shownFilters = state.filters`.
- `failed` con `pending === 'filter'`: `filters = shownFilters`, `failure.wanted = state.filters`.
- `restored`: `shownFilters = filters`.
- `more` y `refresh` no tocan los filtros.
- El estado inicial arranca con `shownFilters = filters` (los del servidor).

Las casillas de `ListingFilters` son controladas (`checked={marked(...)}`), así que vuelven solas.

**Rationale**: la regla de la historia es una sola: lo marcado es lo que cumplen las cards cuando el
pedido termina. Guardar los filtros de lo que se ve en el mismo estado que las cards hace que cambien
juntos, que es como el reducer ya trata cards, total y cursor (research R4 de #57). El comentario de
`ListingState.filters` («con una falla de un filtro, puede no ser lo que muestran las cards») deja de
ser cierto y se reescribe.

**Alternatives considered**: deshacer en `useListing` guardando los filtros anteriores en un `ref`
(la regla quedaría fuera del reducer y sin prueba pura); desmarcar solo la casilla que falló (con
varios cambios seguidos no alcanza y la historia pide «los filtros que tenía el listado que se ve»).

## R2. La dirección después de una falla

**Decision**: el efecto que escribe la dirección deja de esperar `failure === null` y corre cuando
`hydrated && pending === 'none'`, con `listingHref(state.filters, shownFor(cards.length))`. Así,
después de la falla, la dirección dice los filtros que volvieron. Con la falla al abrir no cambia
nada: los filtros siguen siendo los del enlace.

**Rationale**: `applyFilters` reescribe la dirección al marcar (la carga de hoy). Si la falla no la
vuelve atrás, un enlace copiado lleva el filtro que la pantalla ya no dice (FR-002).

**Alternatives considered**: un `replaceState` dentro del manejo de la falla en `run` (otro lugar más
que escribe la dirección; el efecto ya existe para eso).

## R3. «Reintentar» después de una falla de filtro

**Decision**: una función pura `retryFilters(state)` devuelve `state.failure?.wanted ?? state.filters`.
`useListing.retry` reescribe la dirección con esos filtros y corre `run('filter', …)` sin `added`.
Mientras llega, la pantalla es la carga de hoy. Si vuelve a fallar, R1 vuelve a lo que se ve.

**Rationale**: si «Reintentar» pidiera lo que quedó marcado traería lo mismo que ya se ve. La spec lo
fija en sus Assumptions. Hoy «Reintentar» tampoco manda `added`.

**Alternatives considered**: sacar «Reintentar» de la falla de filtro (volver a marcar alcanza, pero
cambia la falla de hoy y docs/10).

## R4. Falla al abrir y falla desde un vacío

**Decision**: la falla es `open` solo si ya lo era (`state.failure?.on === 'open'`) y no por tener
cero cards. Desde un vacío con filtros, la falla es `filter`: vuelven los filtros del vacío, el vacío
de hoy y la tira de la falla encima. En `ListingController`, el vacío se sigue dibujando cuando la
falla es `filter` y no hay cards.

**Rationale**: hoy un vacío que falla se ve como la falla al abrir (sin total, sin vacío). La spec
pide los filtros y el vacío de lo que se ve, con el mensaje (§Edge Cases). La falla al abrir sigue
igual: los filtros del enlace, el error de hoy y «Reintentar».

**Alternatives considered**: dejar el vacío como falla al abrir (dice un error de carga cuando lo que
se ve sí cargó).

## R5. «Ver más» después de una falla

**Decision**: `canLoadMore` deja de excluir `failure.on === 'filter'`; sigue excluyendo
`pending === 'filter'`. El cursor es de lo que se ve, y ahora lo marcado también.

**Rationale**: la exclusión existía porque las cards y lo marcado no coincidían. Con R1 coinciden, y
«Ver más» con `state.filters` pide la misma búsqueda.

## R6. La medición

**Decision**: sin cambios en el código de medición. `applyFilters` sigue calculando `added` contra
`state.filters` y mandándolo con el pedido, como hoy. Con R1, después de una falla `state.filters`
vuelve atrás, así que volver a marcar el filtro se cuenta otra vez, que es lo que dice docs/03 lectura
12 («se cuenta cada vez que alguien lo marca»). «Reintentar» no manda `added` (R3).

**Rationale**: la historia pide «como hoy». Que se cuente cuando la conexión se cortó antes de que el
pedido llegara depende de la red, igual que hoy; no se agrega un envío aparte (FR-022: ningún momento
nuevo).

## R7. El reparto del correo

**Decision**: `alertMailParts` primero decide el dueño de cada animal o camada (`kind:code`):
recorre los avisos en el orden de la corrida (del más viejo al más nuevo) y se queda con el primero
que lo trae **y tiene** `filters.publisher` con `identity`; si ninguno lo tiene, con el primero que lo
trae. Después arma cada parte con los que le tocan, en el orden de los avisos, con el mismo orden
interno, el mismo corte a `ALERT_PART_MAX` y el mismo `total`. Una parte sin animales no sale.

**Rationale**: es la decisión del enjambre de la historia. Una sola pasada de dueño y otra de armado
deja la regla legible y probada sin tocar `mailNewCount` (cada animal sigue en una sola parte) ni la
base: `claimPetAlertMail` ya devuelve los avisos ordenados por creación y con `publisher`.

**Alternatives considered**: ordenar los avisos con el filtro primero y dejar la regla de hoy (cambia
el orden de las partes, que la spec no cambia); repartir en la base (la regla ya vive en TypeScript
desde #265).

## R8. Por qué la confirmación no aparece con filtros de la página

**Decision**: `createPetAlert` deja de llamar a `revalidatePath(MY_ALERTS_PATH)`. «Mis avisos» lee la
sesión, es dinámica y Next 16 no guarda en el cliente las páginas dinámicas entre navegaciones
(`staleTimes.dynamic` es 0 y `next.config` no lo cambia), así que al ir ahí se pide de nuevo.
`deletePetAlert` conserva su `revalidatePath`, porque ahí la pantalla que tiene que cambiar es la
misma «Mis avisos».

**Causa**: una Server Action que revalida hace que la respuesta traiga la página actual de nuevo. El
listado cambia la dirección con `history.replaceState`, que el router de Next toma como suya; el
servidor vuelve a dibujar el listado con los filtros nuevos y `ListingShell` tiene
`key={listingHref(filters, shown)}`. Con los filtros del enlace, la `key` es la misma y nada se
remonta; con filtros marcados en la página (o después de «Ver más»), la `key` cambia, `ListingShell`
se remonta y `AlertOffer` vuelve a quieto, con el botón.

**Cómo se confirma**: el paso e2e de US3 se escribe primero y tiene que fallar en `main`; con el
arreglo, pasa y además abre «Mis avisos» y ve el aviso nuevo.

**Alternatives considered**: sacar la `key` de `ListingShell` (la usan las navegaciones a otro
listado para arrancar del estado del servidor; tocarla cambia más flujos que esta historia);
recordar la respuesta en memoria del módulo por combinación de filtros (sirve si la causa resulta
otra; queda como plan B).

## R9. Qué se prueba y por qué

- `listing-state.test.ts`: la falla de un filtro vuelve a `shownFilters` y guarda `wanted`; varios
  pedidos seguidos (vuelve a lo que se ve, no a un intermedio); sacar un filtro que falla lo vuelve a
  marcar; la falla desde un vacío es `filter`; la falla al abrir sigue `open` aunque se marque otro
  filtro; `loaded` y `restored` actualizan `shownFilters`; `retryFilters`; `canLoadMore` después de la
  falla. Se reescriben las dos pruebas de hoy que fijaban lo contrario («deja las cards de antes,
  marcadas como de los filtros anteriores» y «sin cards, una falla es la de abrir el listado»). Si
  esto se rompe, Bruno ve un filtro marcado con animales que no lo cumplen.
- `mail-parts.test.ts`: con el filtro más nuevo, el animal va ahí; los dos con el filtro, al más
  viejo; ninguno con el filtro, al más viejo; un animal solo del aviso sin el filtro queda ahí; la
  parte que se vacía no sale; una camada sigue la misma regla; `mailNewCount` cuenta cada animal una
  vez; el orden de las partes no cambia. Si esto se rompe, la parte con el filtro no llega o un animal
  llega dos veces.
- e2e `animales.spec.ts`: el pedido del listado con `quien-publica=identidad` se corta con
  `page.route`; la casilla vuelve desmarcada, la dirección no lo lleva, no hay «Sacar los filtros» y
  la tarjeta del animal de quien tiene solo el teléfono sigue ahí.
- e2e `avisos.spec.ts`: con sesión, listado sin filtros, marcar «Perro» y el filtro, «Avisame cuando
  haya uno así», ver «Te vamos a avisar por correo.» y el aviso en «Mis avisos».
- Nada para `useListing`, `ListingController` ni la acción: el e2e los cubre y son conexión.
