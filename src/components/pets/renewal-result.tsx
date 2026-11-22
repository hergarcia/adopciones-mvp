import { button } from '@/components/ui/button-styles'
import { FullPageLinkButton } from '@/components/ui/full-page-link-button'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { OpeningLink } from '@/components/ui/opening-link'
import { cn } from '@/lib/cn'

type Props = {
  /** Ya traducidos. */
  texts: { title: string; body: string; action: string }
  href: string
  /** La acción vuelve a tocar «Sigue disponible»: una navegación completa, nunca traída antes. */
  renews: boolean
}

const TIRITA = { variant: 'tirita', size: 'lg' } as const
const WIDTH = 'md:w-auto'

// Después de tocar «Sigue disponible» (plan #59 §Diseño): una confirmación centrada, con solo el
// nombre del animal, su estado y la fecha (FR-020), y un único camino. Reintentar o renovar es un
// enlace común y no un `Link`: el router lo traería por adelantado, y traerlo renueva. Las dos formas
// quedan apagadas desde el toque hasta la pantalla siguiente y no salen dos veces: un segundo toque a
// renovar renovaría y se contaría otra vez (historia #354).
export function RenewalResult({ texts, href, renews }: Props) {
  return (
    <HeadedEmptyState
      title={texts.title}
      body={texts.body}
      action={
        renews ? (
          <FullPageLinkButton href={href} {...TIRITA} className={WIDTH}>
            {texts.action}
          </FullPageLinkButton>
        ) : (
          <OpeningLink href={href} className={cn(button(TIRITA), WIDTH)}>
            {texts.action}
          </OpeningLink>
        )
      }
    />
  )
}
