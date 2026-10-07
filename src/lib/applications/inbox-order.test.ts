// Covers: FR-002, FR-003 (el orden de la bandeja y de la carpeta de un animal)
import { describe, expect, it } from 'vitest'
import { inboxOrder, petApplicationsOrder } from './inbox-order'
import type { ApplicationStatus, InboxPet } from './types'

function pet(name: string, fresh: number, waiting: number, lastSentAt: string): InboxPet {
  return { petId: name, code: name, name, cover: null, fresh, waiting, lastSentAt }
}

describe('inboxOrder', () => {
  it('nuevas primero, después las que esperan y al final las demás, cada grupo de la más reciente', () => {
    const pets = [
      pet('sin-espera-vieja', 0, 0, '2026-10-01T10:00:00Z'),
      pet('espera-vieja', 0, 2, '2026-10-02T10:00:00Z'),
      pet('nueva-vieja', 1, 1, '2026-10-03T10:00:00Z'),
      pet('sin-espera-reciente', 0, 0, '2026-10-06T10:00:00Z'),
      pet('espera-reciente', 0, 1, '2026-10-05T10:00:00Z'),
      pet('nueva-reciente', 2, 2, '2026-10-04T10:00:00Z'),
    ]
    expect(inboxOrder(pets).map((item) => item.name)).toEqual([
      'nueva-reciente',
      'nueva-vieja',
      'espera-reciente',
      'espera-vieja',
      'sin-espera-reciente',
      'sin-espera-vieja',
    ])
  })

  it('no cambia la lista que recibe', () => {
    const pets = [pet('b', 0, 0, '2026-10-01T10:00:00Z'), pet('a', 1, 1, '2026-10-02T10:00:00Z')]
    inboxOrder(pets)
    expect(pets.map((item) => item.name)).toEqual(['b', 'a'])
  })
})

describe('petApplicationsOrder', () => {
  function row(id: string, status: ApplicationStatus, sentAt: string) {
    return { id, status, sentAt }
  }

  it('esperando, aceptadas y cerradas; cada grupo de la más vieja a la más nueva', () => {
    const groups = petApplicationsOrder([
      row('cerrada-nueva', 'closed', '2026-10-06T10:00:00Z'),
      row('espera-nueva', 'sent', '2026-10-05T10:00:00Z'),
      row('aceptada', 'accepted', '2026-10-02T10:00:00Z'),
      row('rechazada', 'rejected', '2026-10-01T10:00:00Z'),
      row('espera-vieja', 'sent', '2026-10-03T10:00:00Z'),
      row('retirada', 'withdrawn', '2026-10-04T10:00:00Z'),
    ])
    expect({
      waiting: groups.waiting.map((item) => item.id),
      accepted: groups.accepted.map((item) => item.id),
      closed: groups.closed.map((item) => item.id),
    }).toEqual({
      waiting: ['espera-vieja', 'espera-nueva'],
      accepted: ['aceptada'],
      closed: ['rechazada', 'retirada', 'cerrada-nueva'],
    })
  })
})
