import { LinkButton } from '@/components/ui/link-button'

type Props = {
  /** Ya resuelto por `notNowDestination`: a donde estaba, o al inicio. */
  href: string
  label: string
}

// Verificarse es el precio de participar, no de mirar (FR-013e).
export function NotNowLink({ href, label }: Props) {
  return (
    <LinkButton href={href} variant="ghost" className="mt-8 self-start">
      {label}
    </LinkButton>
  )
}
