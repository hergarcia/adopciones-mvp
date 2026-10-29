import { TextLink } from '@/components/ui/text-link'

type Props = {
  /** El aviso en palabras (`alertName`), ya armado. */
  name: string
  /** El listado con los filtros del aviso. */
  href: string
  /** Ya traducido: «Ver en el listado». */
  seeListing: string
  /** `DeleteAlertButton`, que pone la página. */
  action: React.ReactNode
}

export function MyAlertRow({ name, href, seeListing, action }: Props) {
  return (
    <li className="flex flex-col gap-1 border-b-2 border-line py-4">
      <p className="text-base font-medium text-ink">{name}</p>
      <div className="flex flex-wrap items-start justify-between gap-x-4">
        <TextLink href={href}>{seeListing}</TextLink>
        {action}
      </div>
    </li>
  )
}
