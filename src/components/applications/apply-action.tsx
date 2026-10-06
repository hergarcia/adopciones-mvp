import { LinkButton } from '@/components/ui/link-button'
import type { ApplyActionKind } from '@/lib/applications/apply-action'

type Props = {
  kind: ApplyActionKind
  href: string
  /** Ya traducidos. */
  texts: { apply: string; viewMine: string }
}

// La tirita de la ficha (plan §Diseño): «Quiero adoptar» es lo único que llama la atención, también
// sin sesión —la ruta manda a ingresar—; «Ver mi solicitud» pesa menos, porque ya está hecho. Un
// enlace en el HTML, sin JS (research R8). Sin prefetch: abrir la ruta registra el toque.
export function ApplyAction({ kind, href, texts }: Props) {
  if (kind === 'none') return null
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
