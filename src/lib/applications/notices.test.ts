// Covers: FR-060, FR-061, FR-063 (a quién va cada correo y adónde lleva)
import { describe, expect, it } from 'vitest'
import { commitmentEmail, noticeEmail } from './notices'

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

  // Covers: US3-AS3, FR-052 («Yo no adopté», a quien lo dio, a Mis animales)
  it('dijo que no lo adoptó: al publicador, a Mis animales', () => {
    expect(noticeEmail('adoption_declined', ID)).toEqual({
      audience: 'publisher',
      path: '/mis-animales',
    })
  })

  // Covers: US2-AS3 (historia #69: quien adoptó contó cómo va, a Mis animales)
  it('contó cómo va: al publicador, a Mis animales', () => {
    expect(noticeEmail('follow_up_answered', ID)).toEqual({
      audience: 'publisher',
      path: '/mis-animales',
    })
  })

  it.each([
    'accepted',
    'rejected',
    'question_asked',
    'closed_adopted',
    'closed_unpublished',
    // Covers: US1-AS3, FR-050 (de la #67: «Adoptaste a …: aceptá el compromiso»)
    'adoption_marked',
    // Covers: US1-AS1, US1-AS2, FR-005 (historia #69: «¿Cómo va Tobi?», a Mi solicitud)
    'follow_up_requested',
  ] as const)('%s: a quien solicitó, a Mi solicitud', (kind) => {
    expect(noticeEmail(kind, ID)).toEqual({ audience: 'applicant', path: `/mis-solicitudes/${ID}` })
  })
})

// Covers: US2-AS2, FR-051 (el compromiso, a cada una a su pantalla)
describe('commitmentEmail', () => {
  it('a quien lo dio: a Una solicitud', () => {
    expect(commitmentEmail('publisher', ID)).toEqual({
      audience: 'publisher',
      path: `/solicitudes/${ID}`,
    })
  })

  it('a quien adoptó: a Mi solicitud', () => {
    expect(commitmentEmail('adopter', ID)).toEqual({
      audience: 'applicant',
      path: `/mis-solicitudes/${ID}`,
    })
  })
})
