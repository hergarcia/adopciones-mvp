// Covers: FR-060, FR-061, FR-063 (a quién va cada correo y adónde lleva)
import { describe, expect, it } from 'vitest'
import { noticeEmail } from './notices'

const ID = '7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a'

describe('noticeEmail', () => {
  it('solicitud nueva: al publicador, a Solicitudes', () => {
    expect(noticeEmail('new_application', ID)).toEqual({
      audience: 'publisher',
      path: '/solicitudes',
    })
  })

  it('le contestaron: al publicador, a esa solicitud', () => {
    expect(noticeEmail('question_answered', ID)).toEqual({
      audience: 'publisher',
      path: `/solicitudes/${ID}`,
    })
  })

  it.each([
    'accepted',
    'rejected',
    'question_asked',
    'closed_adopted',
    'closed_unpublished',
  ] as const)('%s: a quien solicitó, a Mi solicitud', (kind) => {
    expect(noticeEmail(kind, ID)).toEqual({ audience: 'applicant', path: `/mis-solicitudes/${ID}` })
  })
})
