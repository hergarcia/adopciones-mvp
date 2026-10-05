type Props = {
  /** Ya traducido, con cuántos: «Hay 1 reporte sobre vos: lo resuelve otra persona…». */
  text: string | null
}

// De los reportes sobre quien mira, solo que existen y que los resuelve otra persona (FR-010).
export function OwnReportsLine({ text }: Props) {
  if (text === null) return null
  return <p className="mb-6 max-w-[var(--measure)] text-base text-ink">{text}</p>
}
