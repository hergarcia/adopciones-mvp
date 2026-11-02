# Data Model: Que el filtro «Solo de quien verificó su identidad» y sus avisos cumplan lo que dicen

Sin cambios en la base: ninguna migración, ninguna columna, ninguna política. Lo que cambia es estado
del cliente y una regla pura.

## Estado del listado (`ListingState`, cliente)

| Campo | Hoy | Con esta historia |
|---|---|---|
| `filters` | Lo marcado; después de una falla de filtro queda lo que falló | Lo marcado; mientras carga, lo pedido; quieto, siempre igual a `shownFilters` |
| `shownFilters` | — | Nuevo: los filtros con los que se pidieron las cards a la vista |
| `failure` | `{ on, reason }` | `{ on, reason, wanted }`: `wanted` es lo que se había marcado cuando falló un filtro; `null` en las otras fallas |

Transiciones (research R1-R4):

- `filter` → `filters = lo marcado`, `pending = 'filter'`.
- `loaded` (filtro o renovación) → `shownFilters = filters`, `failure = null`.
- `failed` con `pending = 'filter'` → `filters = shownFilters`, `failure = { on, reason, wanted: lo
  marcado }`, con `on = 'open'` solo si la falla anterior era la de abrir; si no, `'filter'`.
- `failed` con `pending = 'more'` → como hoy (`on = 'more'`, sin `wanted`).
- `restored` → `filters = shownFilters = los de la dirección`.
- Invariante: con `pending = 'none'`, `filters` y `shownFilters` buscan lo mismo.

## Reparto del correo (`alertMailParts`, servidor)

Entrada sin cambios: `ClaimedAlert[]` del más viejo al más nuevo, cada uno con `filters` (incluido
`publisher`) y todo lo que le coincide.

Regla (research R7): el dueño de cada `kind:code` es el aviso más viejo que lo trae con
`publisher = ['identity']`; si ninguno, el más viejo que lo trae. Cada parte lleva lo suyo, lo más
nuevo primero, hasta `ALERT_PART_MAX`, con `total` = todo lo suyo. Sin nada suyo, no hay parte.
