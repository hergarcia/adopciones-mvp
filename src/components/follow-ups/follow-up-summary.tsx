import type { PetPhotoData } from '@/lib/pets/types'
import { FollowUpAnswer, type FollowUpAnswerTexts } from './follow-up-answer'
import { FollowUpLine, type FollowUpLineTexts } from './follow-up-line'

export type FollowUpSummaryTexts = {
  title: string
  body: { kind: 'answer'; texts: FollowUpAnswerTexts } | { kind: 'line'; texts: FollowUpLineTexts }
}

type Props = {
  texts: FollowUpSummaryTexts
  photos: PetPhotoData[]
  /** Debajo de la respuesta, la invitación a avalar a quien adoptó (historia #261). */
  vouch?: React.ReactNode
}

// El seguimiento para quien lo dio (plan §Mis animales): en la pantalla del animal y en Una solicitud,
// debajo de lo que ya estaba. La respuesta si llegó; si no, el renglón del pedido.
export function FollowUpSummary({ texts, photos, vouch }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-ink">{texts.title}</h2>
      {texts.body.kind === 'answer' ? (
        <>
          <FollowUpAnswer texts={texts.body.texts} photos={photos} />
          {vouch}
        </>
      ) : (
        <FollowUpLine texts={texts.body.texts} />
      )}
    </section>
  )
}
