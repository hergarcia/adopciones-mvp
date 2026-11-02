# Interfaces: Que el filtro «Solo de quien verificó su identidad» y sus avisos cumplan lo que dicen

Sin endpoints, acciones ni correos nuevos. Cambian estas firmas internas:

## `src/lib/pets/listing-state.ts`

```ts
export type ListingState = ListingView & {
  filters: ListingFilters
  /** Los filtros de las cards a la vista. Quieto, `filters` busca lo mismo. */
  shownFilters: ListingFilters
  pending: 'none' | 'filter' | 'more' | 'refresh'
  request: number
  failure: {
    on: 'open' | 'filter' | 'more'
    reason: ListingFailure
    /** Lo que se había marcado cuando falló un filtro: lo que pide «Reintentar». */
    wanted: ListingFilters | null
  } | null
}

/** Lo que pide «Reintentar»: lo que falló, o lo marcado si no hay falla de filtro. */
export function retryFilters(state: ListingState): ListingFilters
```

`ListingAction` no cambia. `canLoadMore(state)` deja de mirar `failure.on === 'filter'`.

## `src/lib/alerts/mail-parts.ts`

`alertMailParts(alerts: readonly ClaimedAlert[]): AlertMailPart[]` mantiene la firma; cambia a qué
parte va cada animal (data-model §Reparto). `mailItemCount` y `mailNewCount` no cambian.

## `src/actions/pet-alerts.ts`

`createPetAlert(input): Promise<ActionResult<CreateAlertOutcome>>` mantiene la firma y las
respuestas (`created`, `duplicate`, `limit`, errores `alerts.errors.session` y
`alerts.errors.failed`). Deja de revalidar «Mis avisos» (research R8).
