import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationPetPhoto } from './application-pet-photo'

export type LimitRow = {
  id: string
  cover: PetPhotoData | null
  /** Ya traducidos. */
  texts: { name: string; photoAlt: string; sentOn: string }
  /** «Retirar», con su confirmación. */
  withdraw: React.ReactNode
}

type Props = {
  /** Ya traducidos. */
  texts: { title: string; body: string; listLabel: string }
  rows: LimitRow[]
}

// Un aviso en la puerta, antes de cualquier pregunta (FR-051): llegó al máximo, cuáles son sus tres,
// y en cada una «Retirar». Lo que llama la atención son las tres; cada «Retirar» va en `ghost`.
export function LimitReached({ texts, rows }: Props) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
        <p className="text-base text-ink">{texts.body}</p>
      </header>
      <ul aria-label={texts.listLabel} className="border-t-2 border-line">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-4 border-b-2 border-line py-3">
            <ApplicationPetPhoto cover={row.cover} alt={row.texts.photoAlt} size="sm" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-base font-medium break-words text-ink">{row.texts.name}</span>
              <span className="text-xs text-ink-muted tabular-nums">{row.texts.sentOn}</span>
            </div>
            {row.withdraw}
          </li>
        ))}
      </ul>
    </section>
  )
}
