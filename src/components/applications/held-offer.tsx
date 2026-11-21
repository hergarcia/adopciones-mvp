import { useId } from 'react'
import { LinkButton } from '@/components/ui/link-button'

type Props =
  | {
      state: 'offer'
      href: string
      /** Ya traducidos: el botón y la línea que dice que sale sola y quién no la ve. */
      texts: { offer: string; line: string }
    }
  | {
      state: 'waiting'
      href: string
      /** Ya traducidos: que la que dejó espera su identidad, y el camino a «Mis solicitudes». */
      texts: { waiting: string; toMine: string }
    }

// Dejar escrita la solicitud con el pedido de identidad en revisión (historia #289): debajo del
// estado del pedido, la tirita de la pantalla y la línea que dice qué pasa con lo escrito. Si ya
// dejó una para este animal, en su lugar que espera y el camino a verla.
export function HeldOffer(props: Props) {
  const lineId = useId()
  return (
    <div className="flex flex-col items-start gap-3 border-t-2 border-line pt-6">
      {props.state === 'offer' ? (
        <>
          <LinkButton
            href={props.href}
            variant="tirita"
            size="lg"
            className="md:w-auto"
            aria-describedby={lineId}
          >
            {props.texts.offer}
          </LinkButton>
          <p id={lineId} className="text-sm text-ink-muted">
            {props.texts.line}
          </p>
        </>
      ) : (
        <>
          <p className="text-base text-ink">{props.texts.waiting}</p>
          <LinkButton href={props.href} variant="secondary">
            {props.texts.toMine}
          </LinkButton>
        </>
      )}
    </div>
  )
}
