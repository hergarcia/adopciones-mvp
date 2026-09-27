import { LinkButton } from '@/components/ui/link-button'
import { ReviewImage } from './review-image'
import { ReviewRequestLayout } from './review-request-layout'

type ImageTexts = { title: string; alt: string; failed: string; retry: string }

export type ReviewRequestViewTexts = {
  name: string
  zone: string
  memberSince: string
  waitingSince: string
  expires: string
  /** «Sin rechazos en 30 días», o el título de la lista. */
  rejectionsTitle: string
  /** Cada rechazo de la ventana, con su día y su motivo. */
  rejections: string[]
  rule: string
  front: ImageTexts
  selfie: ImageTexts
  back: string
}

type Props = {
  texts: ReviewRequestViewTexts
  /** Las direcciones de las dos imágenes; nulas en el pedido propio, que no se muestra (FR-020). */
  images: { front: string; selfie: string } | null
  /** La cola: la salida de quien abrió el pedido y no lo resuelve ahora. */
  backHref: string
  /** Las acciones, o por qué no las hay. */
  children: React.ReactNode
}

// Un pedido de la cola: lo que se muestra de la persona —nombre, zona, desde cuándo tiene cuenta,
// sus rechazos— y nada más (FR-014), las dos imágenes y la regla (FR-015).
export function ReviewRequestView({ texts, images, backHref, children }: Props) {
  return (
    <ReviewRequestLayout
      details={
        <>
          <h1 className="afiche text-2xl text-ink">{texts.name}</h1>
          <div className="mt-3 flex flex-col gap-1 text-base text-ink-muted tabular-nums">
            <p>{texts.zone}</p>
            <p>{texts.memberSince}</p>
            <p>{texts.waitingSince}</p>
            <p>{texts.expires}</p>
          </div>
          <h2 className="mt-5 text-base font-medium text-ink">{texts.rejectionsTitle}</h2>
          {texts.rejections.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-ink tabular-nums">
              {texts.rejections.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </>
      }
      images={
        images ? (
          <>
            <ReviewImage kind="front" src={images.front} texts={texts.front} />
            <ReviewImage kind="selfie" src={images.selfie} texts={texts.selfie} />
          </>
        ) : null
      }
      decision={
        <>
          {images ? <p className="text-base text-ink">{texts.rule}</p> : null}
          {children}
          <LinkButton href={backHref} variant="ghost" className="self-start">
            {texts.back}
          </LinkButton>
        </>
      }
    />
  )
}
