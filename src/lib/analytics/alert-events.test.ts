// Covers: FR-037, FR-038, FR-040, FR-041 (cuántos filtros y desde dónde; nunca la persona, el aviso ni los
// filtros elegidos)
import { describe, expect, it } from 'vitest'
import { NO_FILTERS } from '@/lib/pets/listing-query'
import type { AlertMailPart, AlertMatch } from '@/lib/alerts/types'
import { alertCreatedEvent, alertDeletedEvent, alertMailSentEvent } from './alert-events'

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

describe('el momento de mandar un correo de avisos', () => {
  const item: AlertMatch = {
    kind: 'litter',
    code: 'k3x9p2qa7m',
    name: 'La camada de Rita',
    species: 'dog',
    youngCount: 5,
    age: { value: 2, unit: 'months' },
    zone: { department: 'UY-MO', locality: 'Cerro' },
    coverId: 'foto',
    firstListedAt: '2026-10-28T12:00:00.000Z',
  }
  const part = (items: AlertMatch[]): AlertMailPart => ({
    alertId: 'a1',
    filters: { ...NO_FILTERS, species: ['dog'] },
    items,
  })

  it('lleva cuántos animales y camadas trae y en cuántas partes, nada de quién ni qué', () => {
    expect(alertMailSentEvent([part([item, { ...item, code: 'otro' }]), part([item])])).toEqual({
      name: 'pet_alert_mail_sent',
      props: { items: 3, parts: 2 },
    })
  })
})
