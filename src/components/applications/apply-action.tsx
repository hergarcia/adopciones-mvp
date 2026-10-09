import { LinkButton } from '@/components/ui/link-button'
import { NotAcceptedNote } from './not-accepted-note'
import type { ApplyActionKind } from '@/lib/applications/apply-action'

type Props = {
  kind: ApplyActionKind
  href: string
  /** Ya traducidos. */
  /** `rejected` lleva al listado y no a la solicitud. */
  texts: { apply: string; viewMine: string; rejected: string; toListing: string }
}

// La tirita de la ficha (plan §Diseño): «Quiero adoptar» es lo único que llama la atención, también
// sin sesión —la ruta manda a ingresar—; «Ver mi solicitud» pesa menos, porque ya está hecho. Un
// enlace en el HTML, sin JS (research R8). Sin prefetch: abrir la ruta registra el toque. A quien
// rechazaron, que no fue aceptada (FR-023).
export function ApplyAction({ kind, href, texts }: Props) {
  if (kind === 'none') return null
  if (kind === 'rejected') {
    return (
      <NotAcceptedNote href={href} texts={{ body: texts.rejected, toListing: texts.toListing }} />
    )
  }
  return kind === 'apply' ? (
    <LinkButton href={href} variant="tirita" size="lg" prefetch={false} className="md:w-auto">
      {texts.apply}
    </LinkButton>
  ) : (
    <LinkButton href={href} variant="secondary" prefetch={false}>
      {texts.viewMine}
    </LinkButton>
  )
}
