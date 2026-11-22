import type { LaterPart } from '@/components/ui/deferred-part'
import type { FollowUpFormTexts } from './follow-up-form'
import { LazyFollowUpForm } from './lazy-follow-up-form'

export type FollowUpRequestTexts = {
  /** «¿Cómo va Tobi?» */
  title: string
  /** «Rocío quiere saber cómo está. Mandale de 1 a 3 fotos.» */
  help: string
  form: FollowUpFormTexts
}

type Props = {
  applicationId: string
  texts: FollowUpRequestTexts
  /** La forma de las fotos, el texto y el botón mientras llegan (`FollowUpFormSkeleton`). */
  part: LaterPart
}

// El pedido de contar cómo va en Mi solicitud (plan §Mi solicitud): el título y la ayuda viajan en el
// HTML y el formulario llega después de abrir, en el lugar que le guarda su espera (historia #342).
// Todo a la medida de lectura, el mismo borde que el compromiso de abajo.
export function FollowUpRequest({ applicationId, texts, part }: Props) {
  return (
    <section aria-labelledby="seguimiento" className="flex max-w-[var(--measure)] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="seguimiento" className="text-lg font-medium text-ink">
          {texts.title}
        </h2>
        <p className="text-sm text-ink-muted">{texts.help}</p>
      </div>
      <LazyFollowUpForm props={{ applicationId, texts: texts.form }} part={part} />
    </section>
  )
}
