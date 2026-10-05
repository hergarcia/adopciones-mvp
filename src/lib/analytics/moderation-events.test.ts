// Covers: FR-050, FR-012, SC-006 (los eventos de la historia #13, sin datos de la persona)
import { describe, expect, it } from 'vitest'
import { accountSuspendedEvents, personReportedEvent, reportClosedEvent } from './moderation-events'

const NOW = new Date('2026-10-05T12:00:00.000Z')
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000)

// Lo que podría venir pegado a la entrada y no tiene que salir nunca.
const IDENTITY = {
  id: '7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a',
  publicId: 'AbCdEfGhIjKlMnOpQrStUv',
  userId: '1b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a',
  name: 'Ana',
  email: 'ana@example.test',
  details: 'Me ofreció un cachorro a 3000 pesos',
}

describe('personReportedEvent', () => {
  it('lleva el motivo y nada más, aunque la entrada traiga quién y qué', () => {
    expect(personReportedEvent({ ...IDENTITY, reason: 'sells_animals' })).toEqual({
      name: 'person_reported',
      props: { reason: 'sells_animals' },
    })
  })
})

describe('reportClosedEvent', () => {
  it('lleva cómo se cerró y las horas redondeadas, sin quién', () => {
    expect(
      reportClosedEvent({ ...IDENTITY, createdAt: hoursAgo(26.4), resolution: 'dismissed' }, NOW),
    ).toEqual({ name: 'report_closed', props: { resolution: 'dismissed', hours: 26 } })
  })
})

describe('accountSuspendedEvents', () => {
  it('desde el perfil y sin reportes: solo la suspensión, con su origen', () => {
    expect(
      accountSuspendedEvents({ ...IDENTITY, from: 'profile', closedReports: [] }, NOW),
    ).toEqual([{ name: 'account_suspended', props: { from: 'profile' } }])
  })

  it('un report_closed «suspended» por cada reporte que cierra, con sus horas', () => {
    expect(
      accountSuspendedEvents(
        {
          from: 'report',
          closedReports: [
            { ...IDENTITY, createdAt: hoursAgo(3) },
            { ...IDENTITY, createdAt: hoursAgo(50) },
          ],
        },
        NOW,
      ),
    ).toEqual([
      { name: 'account_suspended', props: { from: 'report' } },
      { name: 'report_closed', props: { resolution: 'suspended', hours: 3 } },
      { name: 'report_closed', props: { resolution: 'suspended', hours: 50 } },
    ])
  })
})
