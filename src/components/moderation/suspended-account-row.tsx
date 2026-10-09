import { TextLink } from '@/components/ui/text-link'

type Props = {
  name: string
  /** La ficha de la persona (historia #73). */
  href: string
  /** Ya entre comillas. */
  reason: string
  /** «La suspendió Lucía el 3 de octubre», o una cuenta borrada. */
  by: string
  /** `ReactivateSheet`, que pone la página. */
  action: React.ReactNode
}

// Una cuenta en la lista de suspendidas (plan §Cuentas suspendidas): el nombre en voz de afiche, el
// motivo, quién y cuándo, y «Reactivar». El nombre lleva a su ficha, no al perfil: mientras está
// suspendida, el perfil no existe.
export function SuspendedAccountRow({ name, href, reason, by, action }: Props) {
  return (
    <article className="flex max-w-[var(--measure)] flex-col gap-2">
      <h2 className="afiche text-xl text-ink">
        <TextLink href={href} placement="inline">
          {name}
        </TextLink>
      </h2>
      <p className="text-base text-ink">{reason}</p>
      <p className="text-sm text-ink-muted">{by}</p>
      <div className="mt-2">{action}</div>
    </article>
  )
}
