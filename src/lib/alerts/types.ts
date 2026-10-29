import type { Age } from '@/lib/pets/age'
import type { ListingFilters } from '@/lib/pets/listing-query'
import type { Sex, Species } from '@/lib/pets/options'
import type { Zone } from '@/lib/pets/types'

/** Los seis filtros del listado, normalizados con su regla (`normalizeAlertFilters`). */
export type AlertFilters = ListingFilters

/** Un aviso de «Mis avisos». */
export type PetAlert = { id: string; filters: AlertFilters; createdAt: string }

export const CREATE_ALERT_OUTCOMES = ['created', 'duplicate', 'limit'] as const
export type CreateAlertOutcome = (typeof CREATE_ALERT_OUTCOMES)[number]

/** Un animal suelto o una camada nueva para un aviso, como la devuelve la corrida de las 8. */
export type AlertMatch = {
  code: string
  name: string
  species: Species
  age: Age
  zone: Zone
  coverId: string
  firstListedAt: string
} & ({ kind: 'pet'; sex: Sex } | { kind: 'litter'; youngCount: number })

/** Una parte del correo: un aviso con lo nuevo que le toca, a lo sumo `ALERT_PART_MAX`. */
export type AlertMailPart = { alertId: string; filters: AlertFilters; items: AlertMatch[] }

/** Un aviso con todo lo nuevo que le coincide, como lo devuelve la corrida: sin cortar ni repartir. */
export type ClaimedAlert = { alertId: string; filters: AlertFilters; matches: AlertMatch[] }

/** Lo que la corrida de las 8 reclamó para una persona: sus avisos con algo, del más viejo al nuevo. */
export type AlertMailClaim = { userId: string; runAt: string; alerts: ClaimedAlert[] }
