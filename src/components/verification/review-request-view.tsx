import { ReviewImage } from './review-image'

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
}

type Props = {
  texts: ReviewRequestViewTexts
  /** Las direcciones de las dos imágenes; nulas en el pedido propio, que no se muestra (FR-020). */
  images: { front: string; selfie: string } | null
  /** Las acciones, o por qué no las hay. */
  children: React.ReactNode
}

// Un pedido de la cola: lo que se muestra de la persona —nombre, zona, desde cuándo tiene cuenta,
// sus rechazos— y nada más (FR-014), las dos imágenes y la regla (FR-015). Desde 1024, las imágenes
// a la izquierda y lo que se decide a la derecha, para no hacer scroll entre la foto y el botón. La
// segunda fila se lleva lo que las imágenes miden de más, así la decisión sigue pegada a los datos.
export function ReviewRequestView({ texts, images, children }: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-10">
      <section className="lg:col-start-2">
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
      </section>

      {images ? (
        <div className="flex flex-col gap-6 border-t-2 border-line pt-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:border-t-0 lg:pt-0">
          <ReviewImage kind="front" src={images.front} texts={texts.front} />
          <ReviewImage kind="selfie" src={images.selfie} texts={texts.selfie} />
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:col-start-2 lg:self-start">
        {images ? <p className="text-base text-ink">{texts.rule}</p> : null}
        {children}
      </div>
    </div>
  )
}
