import { button } from '@/components/ui/button'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { cn } from '@/lib/cn'

type Props = {
  /** Ya traducidos. */
  texts: { title: string; body: string; action: string }
  href: string
  /** La acción vuelve a tocar «Sigue disponible»: una navegación completa, nunca traída antes. */
  renews: boolean
}

// Después de tocar «Sigue disponible» (plan #59 §Diseño): una confirmación centrada, con solo el
// nombre del animal, su estado y la fecha (FR-020), y un único camino. Reintentar o renovar es un
// enlace común y no un `Link`: el router lo traería por adelantado, y traerlo renueva.
export function RenewalResult({ texts, href, renews }: Props) {
  const className = 'md:w-auto'
  return (
    <HeadedEmptyState
      title={texts.title}
      body={texts.body}
      action={
        renews ? (
          <a href={href} className={cn(button({ variant: 'tirita', size: 'lg' }), className)}>
            {texts.action}
          </a>
        ) : (
          <LinkButton href={href} variant="tirita" size="lg" className={className}>
            {texts.action}
          </LinkButton>
        )
      }
    />
  )
}
