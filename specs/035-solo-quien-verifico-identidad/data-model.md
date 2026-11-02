# Data Model: Ver solo los animales de quien verificó su identidad

Una migración forward-only, `supabase/migrations/20261107120000_identity_only_filter.sql`. No hay
tablas nuevas.

## `public.pet_alerts` (cambia)

| Columna | Tipo | Regla |
|---|---|---|
| `identity_only` | `boolean not null default false` | `true` si el aviso guarda «Solo de quien verificó su identidad». Los avisos de antes quedan en `false`. |

- `pet_alerts_same_filters_uq` se borra y se crea de nuevo sobre
  `(user_id, species, sexes, sizes, age_bands, departments, neutered_only, identity_only)`: dos avisos
  que solo difieren en el filtro son distintos (FR-014).
- Políticas, permisos y cascada: sin cambios. `pet_alerts_select_own` y `pet_alerts_delete_own` cubren
  la columna nueva; nadie más la lee (FR-023).
- El comentario de la tabla suma que guarda también el filtro de #285.

## Funciones

| Función | Cambio |
|---|---|
| `public.listed_pets(...)` | Suma `p_identity_only boolean default false` al final. Con `true`, agrega `private.publisher_level(s.owner_id) >= 2` al `where`. Mismo cuerpo, mismas columnas devueltas. Se borra la firma de 10 argumentos y se crea la de 11; `revoke` de `public, anon, authenticated` y `grant execute` a `anon, authenticated`. |
| `public.create_pet_alert(...)` | Suma `p_identity_only boolean default false`. Compara también `identity_only` para `duplicate` e inserta la columna. Se borra la firma de 6 argumentos y se crea la de 7; `revoke` y `grant execute` a `authenticated`. |
| `private.pet_alert_matches(uuid[], timestamptz)` | Pasa `p_identity_only => a.identity_only` a `listed_pets` y devuelve `identity_only` después de `neutered_only`. Se borra y se crea (cambia lo que devuelve); `revoke` de `public, anon, authenticated`. |
| `public.claim_pet_alert_mail()` | Devuelve `identity_only` después de `neutered_only`. Se borra y se crea con el mismo cuerpo (cambia lo que devuelve); `revoke` y `grant execute` a `service_role`. |
| `public.suggested_pets(uuid, integer)` | Sin cambios: llama a `listed_pets` por nombre con parámetros nombrados (research R3). |

Orden en la migración: borrar `claim_pet_alert_mail`, `pet_alert_matches`, `create_pet_alert` y la
firma vieja de `listed_pets`; columna e índice; crear `listed_pets`, `pet_alert_matches`,
`claim_pet_alert_mail` y `create_pet_alert`; permisos. Después, `pnpm db:types`.

## Tipos y reglas en TypeScript

- `ListingFilters` suma `publisher: 'identity'[]`; `ListingFilter` suma `'publisher'`.
- Vocabulario de la dirección: `publisher: { key: 'quien-publica', options: ['identity'], values: ['identidad'] }`,
  al final de `LISTING_FILTERS` y de `NO_FILTERS`.
- `chosen`: junta «todas» en «ninguna» solo si el filtro tiene más de una opción (research R2).
- `AlertFilters = ListingFilters`, así que el aviso toma la clave nueva; `normalizeAlertFilters` y
  `RawAlertFilters` suman `publisher`; `alertFiltersOf` lee `identity_only ? ['identity'] : []`;
  `createPetAlertRecord` manda `p_identity_only: filters.publisher.length > 0`.
- `petAlertSchema`: `publisher: z.array(z.literal('identity'))`.
- `AlertNameWords.identityOnly`; `alertName` suma `, ` + la frase cuando `filters.publisher` tiene la
  opción, y mira «ningún filtro» sin contarla (research R6).
- `FilterTexts` suma `identityOnly` (la etiqueta de la casilla); `legends` y `options` toman
  `publisher` por el tipo.

## Textos (`messages/es.json`)

| Clave | Texto |
|---|---|
| `pets.listing.legends.publisher` | Quien publica |
| `pets.listing.options.publisher.identity` | De quien verificó su identidad |
| `pets.listing.identity_only` | Solo de quien verificó su identidad |
| `alerts.name.identity_only` | de quien verificó su identidad |

## Estados

No hay estados nuevos. El aviso no cambia de estado por el filtro; el listado no guarda nada.

## Borrado

La columna vive en la fila del aviso: se va con «Borrar» en «Mis avisos», con «Dejar de recibir» y
con la cuenta (cascada de `auth.users`), como dice #265.
