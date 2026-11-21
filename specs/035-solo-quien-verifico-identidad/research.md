# Research: Ver solo los animales de quien verificó su identidad

Cada decisión dice qué se eligió, por qué y qué se descartó. No quedan `NEEDS CLARIFICATION`.

## R1. El filtro es un séptimo filtro del listado, no un caso aparte

**Decision**: `ListingFilters` suma `publisher: 'identity'[]`, con una sola opción, igual que
`neutered: 'yes'[]`. Va al final de `LISTING_FILTERS` y del vocabulario de la dirección, con la clave
`quien-publica` y el valor `identidad`.

**Rationale**: todo lo que ya recorre `LISTING_FILTERS` lo toma solo: la dirección canónica
(`listingSearch`, `isCanonicalListingQuery`), la lectura tolerante (`parseListingQuery`, que ignora
un valor que no entiende: FR-008), «Sacar los filtros» (`NO_FILTERS`), `hasFilters` (el vacío
filtrado y el ofrecimiento del aviso: FR-010), `listing_filter_used` con su opción propia
(`addedOptions`, `parseAddedOptions`: FR-025), `countFilters` para `pet_alert_created` (FR-026),
`normalizeAlertFilters` y `listingHref` (el enlace de «Mis avisos» y del correo: FR-015, FR-020).
Ir al final hace que todo enlace viejo siga siendo canónico y no redirija.

**Alternatives considered**: un parámetro aparte del listado, fuera de `ListingFilters`: habría que
repetir a mano la dirección, la medición, el aviso y «Sacar los filtros», que es justo lo que el
vocabulario único evita. Un valor `identidad-verificada`: más largo en un enlace que se pega en un
grupo, y la clave ya dice de quién.

## R2. Juntar «todas» en «ninguna» solo en filtros de más de una opción

**Decision**: `chosen` deja de preguntar `filter !== 'neutered'` y pregunta si el filtro tiene más de
una opción (`entry.options.length > 1`).

**Rationale**: marcar todas las opciones de especie es lo mismo que no filtrar; marcar la única de un
filtro de una opción no. Sin el cambio, marcar «Solo de quien verificó su identidad» se borraría solo
de la dirección y del listado. La regla por cantidad de opciones vale para castrado y para este, y para
cualquier filtro de una casilla que venga.

**Alternatives considered**: sumar `&& filter !== 'publisher'`: una lista de excepciones que crece con
cada casilla.

## R3. El listado filtra con el mismo nivel que pinta la tarjeta

**Decision**: `public.listed_pets` suma `p_identity_only boolean default false`, y con `true` agrega
`private.publisher_level(s.owner_id) >= 2` a la condición. La firma vieja se borra y la nueva se crea
con el mismo cuerpo (no hay sobrecarga). `listListedPets` pasa `filters.publisher.length > 0`.

**Rationale**: la tarjeta dice el nivel con `private.publisher_level` desde #273, la misma cuenta que la
ficha. Filtrar con la misma función hace que FR-004 y el borde de la spec («nunca deja afuera a
alguien cuya tarjeta dice Identidad verificada») se cumplan por construcción: el nivel 3 exige el 2,
así que `>= 2` es «identidad verificada, con aval o sin él» (FR-003), y un aval que se quita baja de 3 a
2 sin sacar a nadie. Un pedido en revisión, rechazado, vencido o retirado da nivel 1, igual que no
haberlo pedido (FR-022). La camada usa el `owner_id` de la camada, el mismo de la tarjeta (FR-005).
El total (`count(*) over ()`) y la paginación por cursor ya corren después del `where`, así que cuentan
y siguen solo lo filtrado (FR-003, FR-006).

**Alternatives considered**: `private.has_level_two(owner, pending_ttl())` directo: da lo mismo hoy,
pero si la escalera cambia, la tarjeta y el filtro podrían separarse. Una columna guardada con el
nivel: se desactualiza con una aprobación o un aval quitado, y la regla es «el nivel en el momento de
mirar».

**Dependencias de `listed_pets`**: `suggested_pets` y `private.pet_alert_matches` son funciones
`language sql` con cuerpo entre `$$`, que Postgres no ata a lo que llaman: resuelven `listed_pets`
por nombre y con parámetros nombrados al correr, y el parámetro nuevo tiene valor por omisión. Igual,
la migración borra la firma vieja antes de crear la nueva y vuelve a dar los permisos a `anon` y
`authenticated`, y una prueba de base corre `suggested_pets` después de migrar.

## R4. El aviso guarda el filtro en una columna propia

**Decision**: `pet_alerts.identity_only boolean not null default false`. El índice único
`pet_alerts_same_filters_uq` se vuelve a crear con la columna. `create_pet_alert` suma
`p_identity_only boolean default false`: la firma de seis argumentos se borra, se crea la de siete, se
compara también `identity_only` para `duplicate`, y los permisos se vuelven a dar a `authenticated`.

**Rationale**: es el mismo molde que `neutered_only`. El índice único con la columna hace que un
aviso con el filtro y otro sin él sean distintos (FR-014) y que el tope de 3 cuente los dos, porque el
conteo ya es por persona. Los avisos de antes quedan en `false` por el valor por omisión (FR-017).
La política de lectura y borrado de la dueña no cambia: la columna nueva queda tan privada como las
otras (FR-023), y la cascada con la cuenta y con el borrado del aviso ya está.

**Alternatives considered**: guardar el filtro dentro de un arreglo genérico de «opciones»: rompe el
`check` por columna y el índice único que hoy compara columna por columna.

## R5. El correo lee el nivel a la hora de la corrida

**Decision**: `private.pet_alert_matches` pasa `p_identity_only => a.identity_only` a `listed_pets` y
devuelve `identity_only`; `public.claim_pet_alert_mail` devuelve también `identity_only`. Las dos
cambian lo que devuelven, así que se borran y se vuelven a crear con el mismo cuerpo, en el orden que
piden (primero la que llama). `alertFiltersOf` lee la columna.

**Rationale**: `listed_pets` calcula el nivel cuando corre la tarea de las 8: es «la identidad
verificada a la hora del correo» (FR-018). Lo que queda afuera por el nivel queda igual por debajo de
`covered_until`, que la corrida mueve hasta `run_at` en todos los avisos de la persona (con o sin algo
nuevo), así que no vuelve en otro correo aunque quien publicó se verifique después (FR-019): es la
regla de «nuevo» de #265, sin código propio. Si el correo de una persona no sale, su período queda
abierto como hoy y la corrida siguiente vuelve a mirar ese tramo con el nivel de ese día: es lo que
#265 ya hace con un correo que falla, y no se agrega una excepción. El nombre y el enlace de cada parte salen de
`alertName` y `listingHref` con los filtros del aviso, así que suman el filtro solos (FR-020).

**Alternatives considered**: filtrar por nivel en TypeScript después de reclamar: la corrida ya cortó
y contó, y el total «6 de N» quedaría mal; además la regla quedaría en dos lugares.

## R6. El nombre del aviso suma «de quien verificó su identidad» después de una coma

**Decision**: `AlertNameWords` suma `identityOnly` («de quien verificó su identidad», en
`alerts.name.identity_only`). `alertName` arma el nombre de hoy con los demás filtros y, si el aviso
tiene el filtro, le agrega `, ` y esa frase. «Ningún filtro» se mira sin contar este, así el aviso con
solo el filtro se llama «Todos los animales en adopción, de quien verificó su identidad».

**Rationale**: la historia da el ejemplo «Perros en Montevideo, de quien verificó su identidad». La
coma separa al animal de quien lo publica y no concuerda en género: «Perras chicas, de quien verificó
su identidad» se lee bien sin otra forma. «Mis avisos» y el correo usan la misma función.

**Alternatives considered**: «Animales de quien verificó su identidad» para el caso sin otros filtros:
cambia la palabra de inicio según haya o no este filtro, y la historia no lo pide.

## R7. La casilla va después del departamento, con «Quien publica» como nombre del grupo

**Decision**: en `ListingFilters`, después de «Solo castrados» y del departamento, un `fieldset` con
la `legend` «Quien publica» (receta `groupLabel` de `ui/chip`, a la vista desde 1024 px y solo para el
lector de pantalla en el teléfono, como «Departamento») y una `Checkbox` «Solo de quien verificó su
identidad», con `name` `quien-publica` y `value` `identidad`.

**Rationale**: la historia pide el grupo «después de “Castrado”». Ponerlo después del departamento lo
deja después de castrado sin partir el renglón de hoy del teléfono, donde la casilla de castrado y el
departamento comparten línea: la casilla nueva, larga, va en el renglón siguiente sola. Desde 1024 px
todo fluye en renglones y el grupo queda con su nombre a la vista, como los otros. Es una casilla
igual a «Solo castrados» porque tiene una sola opción (docs/10, `Checkbox`).

**Alternatives considered**: entre castrado y el departamento: en 390 px parte el renglón de hoy en
tres y empuja la pared 44 px más abajo sin ganar nada. Un `ChipGroup` con una tirita: una tira de una
sola tirita no es una tira, y docs/10 resolvió castrado como casilla por lo mismo.

## R8. La medición no suma momentos

**Decision**: nada nuevo en `events.ts`. `listing_filter_used` llega con `filter` = `publisher` y
`option` = `identity`; `pet_alert_created.filters` cuenta uno más. Los avisos con el filtro se cuentan
en la base con `select count(*) from public.pet_alerts where identity_only`, que corre quien mira la
lectura con la clave de servicio y no trae ninguna persona.

**Rationale**: es la decisión de la historia (docs/03 §Métricas de éxito, 2026-11-02). Los valores
salen del mismo vocabulario que valida lo que llega del cliente, nunca texto libre.

**Alternatives considered**: una propiedad `identity_only` en `pet_alert_created`: la historia la
descarta, porque junto al día podría decir quién es en una beta chica.

## R9. Qué se prueba

- **Unitarias (Stryker al 100 %)**: `listing-query` (la clave y el valor nuevos, que la única opción no
  se junte en «ninguna», un valor alterado o con mayúsculas, el orden canónico con el filtro al final,
  `parseAddedOptions` con `quien-publica.identidad`); `alertName` con el filtro solo, con otros, con
  solo hembras; `normalizeAlertFilters` y `countFilters` con el filtro; el schema `petAlertSchema` que
  rechaza un valor que no es `identity`.
- **Base (`tests/db`)**: `listed_pets` con `p_identity_only` deja a los de nivel 2 y 3 y a sus camadas,
  saca a los de nivel 1 (también con un pedido en revisión o rechazado), cuenta el total filtrado,
  cambia en la siguiente lectura cuando se aprueba una identidad y no cambia nada con `false`;
  `create_pet_alert` con y sin el filtro crea dos avisos, repetir con el filtro da `duplicate`, el
  cuarto da `limit`; la corrida trae para el aviso con el filtro solo lo de nivel 2 o más y, después
  de aprobar la identidad de quien quedó afuera, la corrida siguiente no lo trae; la privacidad de la
  columna (otra persona y el visitante no leen el aviso) sigue cubierta por la prueba de #265, que suma
  la columna al `select`; `suggested_pets` sigue respondiendo después de migrar.
- **e2e**: uno en `animales.spec.ts`: marcar el filtro, ver solo lo de la persona sembrada con
  identidad, recargar con el enlace y ver la casilla marcada; y en `avisos.spec.ts`, crear el aviso con
  el filtro y leer su nombre en «Mis avisos».
- **No se prueba**: la casilla (ui), los textos, la página.
