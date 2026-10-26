import { YoungStatusDetails, type YoungStatusDetailsProps } from './young-status-details'

type Props = Omit<YoungStatusDetailsProps, 'line'> & {
  name: string
  /** Ya traducido: «Hembra». */
  sex: string
  /** Sus acciones a la vista (`YoungStatusActions` en `row`). */
  actions: React.ReactNode
}

export function YoungPanelRow({ name, sex, actions, ...details }: Props) {
  return (
    <li className="flex flex-col items-start gap-3 border-2 border-line p-4">
      <div className="flex flex-col items-start gap-1">
        <h3 className="afiche text-lg break-words text-ink">{name}</h3>
        <YoungStatusDetails
          {...details}
          line={<span className="text-sm text-ink-muted">{sex}</span>}
        />
      </div>
      {actions}
    </li>
  )
}
