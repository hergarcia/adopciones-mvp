import { LISTING_FILTERS, searchedOptions, type ListingFilter } from '@/lib/pets/listing-query'
import type { AlertFilters } from './types'

export type RawAlertFilters = { [F in ListingFilter]: readonly string[] }

// Dos avisos que el listado busca igual son el mismo aviso (spec §Edge Cases): la misma regla que
// el listado, en el orden de su vocabulario.
export function normalizeAlertFilters(filters: RawAlertFilters): AlertFilters {
  return {
    species: searchedOptions('species', filters.species),
    sex: searchedOptions('sex', filters.sex),
    size: searchedOptions('size', filters.size),
    age: searchedOptions('age', filters.age),
    department: searchedOptions('department', filters.department),
    neutered: searchedOptions('neutered', filters.neutered),
  }
}

/** Cuántos filtros tienen alguna opción: lo único de los filtros que se mide. */
export function countFilters(filters: AlertFilters): number {
  return LISTING_FILTERS.filter((filter) => filters[filter].length > 0).length
}
