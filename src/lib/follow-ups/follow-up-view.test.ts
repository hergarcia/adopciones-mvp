// Covers: US1-AS1, US1-AS2, US1-AS3, US1-AS4, FR-006 (lo que ve cada lado del seguimiento)
import { describe, expect, it } from 'vitest'
import { followUpLine, followUpView } from './follow-up-view'
import type { FollowUpRow } from './types'

const REQUESTED_AT = '2026-11-08T13:10:00Z'
const PHOTO = { id: 'f1', width: 800, height: 1000, thumbhash: 'abc' }

function row(overrides: Partial<FollowUpRow> = {}): FollowUpRow {
  return {
    followUpId: 'fu',
    side: 'adopter',
    status: 'requested',
    requestedAt: REQUESTED_AT,
    answeredAt: null,
    answerText: null,
    photos: [],
    canAnswer: true,
    hidden: false,
    ...overrides,
  }
}

describe('followUpLine', () => {
  it('sin seguimiento, nada', () => {
    expect(followUpLine(null)).toBeNull()
    expect(followUpLine(undefined)).toBeNull()
  })

  it('pedido: con el día del pedido', () => {
    expect(followUpLine({ status: 'requested', requestedAt: REQUESTED_AT })).toEqual({
      kind: 'requested',
      since: REQUESTED_AT,
    })
  })

  it('respondido: el sello', () => {
    expect(followUpLine({ status: 'answered', requestedAt: REQUESTED_AT })).toEqual({
      kind: 'answered',
    })
  })

  it('cerrado sin respuesta', () => {
    expect(followUpLine({ status: 'closed', requestedAt: REQUESTED_AT })).toEqual({
      kind: 'unanswered',
    })
  })
})

describe('followUpView', () => {
  it('sin seguimiento, nada', () => {
    expect(followUpView(null, 'adopter')).toEqual({ kind: 'none' })
  })

  it('una fila del otro lado, nada', () => {
    expect(followUpView(row({ side: 'publisher' }), 'adopter')).toEqual({ kind: 'none' })
  })

  it('quien adoptó, con el pedido abierto: el formulario', () => {
    expect(followUpView(row(), 'adopter')).toEqual({ kind: 'form' })
  })

  it('quien adoptó, sin poder responder: nada', () => {
    expect(followUpView(row({ canAnswer: false }), 'adopter')).toEqual({ kind: 'none' })
  })

  it('quien adoptó, con el pedido cerrado: nada, aunque la fila diga que puede', () => {
    expect(followUpView(row({ status: 'closed' }), 'adopter')).toEqual({ kind: 'none' })
  })

  it('respondido: la respuesta, del lado que sea', () => {
    const answered = row({
      side: 'publisher',
      status: 'answered',
      answeredAt: '2026-11-09T12:00:00Z',
      answerText: 'Duerme en el sillón',
      photos: [PHOTO],
      canAnswer: false,
    })
    expect(followUpView(answered, 'publisher')).toEqual({
      kind: 'answer',
      answeredAt: '2026-11-09T12:00:00Z',
      text: 'Duerme en el sillón',
      photos: [PHOTO],
      hidden: false,
    })
  })

  it('respondido, después de un bloqueo: oculto', () => {
    const hidden = row({ side: 'publisher', status: 'answered', canAnswer: false, hidden: true })
    expect(followUpView(hidden, 'publisher')).toMatchObject({ kind: 'answer', hidden: true })
  })

  it('quien lo dio, con el pedido abierto: el renglón con la fecha', () => {
    expect(followUpView(row({ side: 'publisher', canAnswer: false }), 'publisher')).toEqual({
      kind: 'line',
      line: { kind: 'requested', since: REQUESTED_AT },
    })
  })

  it('quien lo dio, cerrado sin respuesta: lo dice', () => {
    expect(followUpView(row({ side: 'publisher', status: 'closed' }), 'publisher')).toEqual({
      kind: 'line',
      line: { kind: 'unanswered' },
    })
  })
})
