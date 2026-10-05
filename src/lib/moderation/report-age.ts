const HOUR_MS = 3_600_000

// Las horas desde que se hizo un reporte hasta que se cerró, redondeadas: lo que mide
// `report_closed` para la mediana semanal de SC-006, sin el instante exacto (FR-050).
export function reportHours(createdAt: Date, closedAt: Date): number {
  return Math.max(0, Math.round((closedAt.getTime() - createdAt.getTime()) / HOUR_MS))
}
