import { YoungStatusDetails, type YoungStatusDetailsProps } from './young-status-details'

type Props = Omit<YoungStatusDetailsProps, 'line'> & {
  /** Ya traducida: «Cría 1, hembra». */
  line: string
  /** Sus acciones (`YoungStatusActions` en `sheet`), detrás de «Acciones de Cría 1». */
  actions: React.ReactNode
}

export function YoungRow({ line, actions, ...details }: Props) {
  return (
    <li className="flex min-w-0 flex-col items-start gap-1 border-t-2 border-line pt-3">
      <YoungStatusDetails
        {...details}
        line={<span className="text-sm break-words text-ink">{line}</span>}
      />
      {actions}
    </li>
  )
}
