// Covers: US1-AS6, US1-AS7, US1-AS8, FR-010, FR-011, FR-032, spec §Assumptions «Un reporte sobre una
// cuenta que ya está suspendida»
import { describe, expect, it } from 'vitest'
import { reportActions } from './report-actions'

describe('reportActions', () => {
  it('el caso común: cerrar sin medidas o suspender', () => {
    expect(reportActions({ kind: 'open', reportedSuspended: false })).toEqual({
      actions: ['close', 'suspend'],
      line: null,
    })
  })

  it('sobre una cuenta ya suspendida, solo cerrar', () => {
    expect(reportActions({ kind: 'open', reportedSuspended: true })).toEqual({
      actions: ['close'],
      line: null,
    })
  })

  it('sobre quien mira: solo la línea, sin acciones', () => {
    expect(reportActions({ kind: 'own' })).toEqual({ actions: [], line: { kind: 'own' } })
  })

  it('cerrado por otra persona: cómo y quién, sin acciones', () => {
    expect(reportActions({ kind: 'closed', resolution: 'suspended', by: 'Lucía' })).toEqual({
      actions: [],
      line: { kind: 'closed', resolution: 'suspended', by: 'Lucía' },
    })
    expect(reportActions({ kind: 'closed', resolution: 'dismissed', by: null })).toEqual({
      actions: [],
      line: { kind: 'closed', resolution: 'dismissed', by: null },
    })
  })

  it('una cuenta que ya no existe, sin acciones', () => {
    expect(reportActions({ kind: 'gone' })).toEqual({ actions: [], line: { kind: 'gone' } })
  })
})
