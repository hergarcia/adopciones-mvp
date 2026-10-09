import { AdminQueueRow, type AdminQueueRowProps } from './admin-queue-row'

type Props = {
  /** Ya traducido. */
  label: string
  /** Ya ordenadas: las atrasadas primero (FR-012). */
  rows: (AdminQueueRowProps & { key: string })[]
}

// Las tres colas, una por renglón con divisores, como la mesa de quien administra: sin tarjetas ni
// números grandes.
export function AdminQueueBoard({ label, rows }: Props) {
  return (
    <ul aria-label={label} className="divide-y-2 divide-line border-y-2 border-line">
      {rows.map(({ key, ...row }) => (
        <li key={key}>
          <AdminQueueRow {...row} />
        </li>
      ))}
    </ul>
  )
}
