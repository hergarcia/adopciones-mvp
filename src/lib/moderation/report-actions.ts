import type { ReportResolution } from './types'

/** Lo que se sabe de un reporte en la lista, de la base o de la respuesta a cerrarlo. */
export type ReportStanding =
  | { kind: 'open'; reportedSuspended: boolean }
  | { kind: 'own' }
  | { kind: 'closed'; resolution: ReportResolution; by: string | null }
  | { kind: 'gone' }

export type ReportLine =
  | { kind: 'own' }
  | { kind: 'closed'; resolution: ReportResolution; by: string | null }
  | { kind: 'gone' }

export type ReportActions = { actions: ('close' | 'suspend')[]; line: ReportLine | null }

// Qué acciones y qué línea lleva cada reporte (plan §Reportes): uno sobre quien mira, solo la
// línea (FR-010); uno sobre una cuenta ya suspendida, solo cerrar sin medidas, porque la medida ya
// está tomada; uno que cerró otra persona, cómo y quién, sin acciones (FR-011); uno sobre una cuenta
// que se borró, que ya no existe (FR-032). El resto, cerrar o suspender.
export function reportActions(standing: ReportStanding): ReportActions {
  switch (standing.kind) {
    case 'own':
      return { actions: [], line: { kind: 'own' } }
    case 'closed':
      return {
        actions: [],
        line: { kind: 'closed', resolution: standing.resolution, by: standing.by },
      }
    case 'gone':
      return { actions: [], line: { kind: 'gone' } }
    default:
      return {
        actions: standing.reportedSuspended ? ['close'] : ['close', 'suspend'],
        line: null,
      }
  }
}
