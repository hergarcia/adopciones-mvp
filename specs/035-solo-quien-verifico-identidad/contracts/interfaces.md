# Contracts — la dirección del listado, la acción del aviso, las funciones de la base y el correo

Nada nuevo: cada contrato existente suma el filtro.

## La dirección del listado — `/animales`

- Clave nueva `quien-publica`, con un solo valor válido, `identidad`. Va **última** en la dirección
  canónica, después de `castrado`:
  `/animales?especie=perro&departamento=montevideo&quien-publica=identidad`.
- Mayúsculas, repetidos o la clave dos veces se leen igual (`parseListingQuery`) y la página redirige a
  la canónica. Cualquier otro valor (`quien-publica=todos`, `quien-publica=`) se ignora sin error: el
  listado sale sin el filtro y con los demás, y la página redirige a la canónica sin la clave (FR-008).
- Una dirección de antes de esta historia es canónica tal como estaba: no redirige (R1).
- `avisar=1` sigue igual: la vuelta desde entrar crea el aviso con los filtros de la dirección, este
  incluido (FR-013).
- `/api/animales` (la tanda que pide el cliente) lee los filtros con la misma función, así que «Ver
  más» y filtrar sin recargar llevan el filtro (FR-006).

## `createPetAlert(input: unknown): Promise<ActionResult<CreateAlertOutcome>>` — `src/actions/pet-alerts.ts`

- Input (`petAlertSchema`): `filters` suma `publisher: ('identity')[]`. Un valor que no es `identity`
  es `alerts.errors.failed`, como cualquier valor desconocido.
- `createPetAlertRecord` manda `p_identity_only: filters.publisher.length > 0`.
- `created`: `track('pet_alert_created', { filters: countFilters(filters), from_empty })`; con el
  filtro, `filters` cuenta uno más (FR-026). `duplicate`, `limit` y la falla, como hoy (FR-016).

## Funciones de la base

- `public.listed_pets(p_species, p_sexes, p_sizes, p_age_bands, p_departments, p_neutered_only,
  p_after_published, p_after_code, p_limit, p_owner_public_id, p_identity_only boolean default false)`
  → las mismas columnas. `anon` y `authenticated`.
- `public.create_pet_alert(p_species, p_sexes, p_sizes, p_age_bands, p_departments, p_neutered_only,
  p_identity_only boolean default false)` → `'created' | 'duplicate' | 'limit'`. `authenticated`.
- `public.claim_pet_alert_mail()` → las mismas columnas más `identity_only boolean`, después de
  `neutered_only`. `service_role`.

## Medición

- `listing_filter_used` `{ filter: 'publisher', option: 'identity' }` al marcar la casilla y aplicar,
  como cualquier opción (`sumadas=quien-publica.identidad`). No al desmarcarla ni al abrir un enlace que
  ya la trae.
- Ningún momento nuevo.

## Correo de avisos

- El nombre de la parte (`alertName`) suma `, de quien verificó su identidad` en un aviso con el
  filtro; «Ver todos en el listado» lleva a `listingHref(filters)`, con `quien-publica=identidad`.
- El asunto, el título, el orden, el tope de 6 por parte, la foto y «Dejar de recibir» no cambian.

## «Mis avisos» — `/mis-avisos`

- Cada fila nombra el aviso con `alertName` y «Ver en el listado» va a `listingHref(filters)`: los dos
  toman el filtro sin cambiar la fila.
