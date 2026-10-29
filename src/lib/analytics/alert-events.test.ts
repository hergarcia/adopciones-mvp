// Covers: FR-037, FR-040, FR-041 (cuántos filtros y desde dónde; nunca la persona, el aviso ni los
// filtros elegidos)
import { describe, expect, it } from 'vitest'
import { NO_FILTERS } from '@/lib/pets/listing-query'
import { alertCreatedEvent, alertDeletedEvent } from './alert-events'

describe('el momento de crear un aviso', () => {
  it('lleva cuántos filtros y si el listado estaba vacío', () => {
    expect(
      alertCreatedEvent({ ...NO_FILTERS, species: ['dog'], department: ['UY-MO'] }, true),
    ).toEqual({ name: 'pet_alert_created', props: { filters: 2, from_empty: true } })
  })

  it('sin filtros y con resultados', () => {
    expect(alertCreatedEvent(NO_FILTERS, false)).toEqual({
      name: 'pet_alert_created',
      props: { filters: 0, from_empty: false },
    })
  })
})

describe('el momento de borrar un aviso', () => {
  it('desde «Mis avisos» lleva solo el origen', () => {
    expect(alertDeletedEvent('profile')).toEqual({
      name: 'pet_alert_deleted',
      props: { origin: 'profile' },
    })
  })
})
