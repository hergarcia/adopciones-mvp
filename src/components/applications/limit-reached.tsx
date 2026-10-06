import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationList } from './application-list'
import { MyApplicationCard } from './my-application-card'

export type LimitRow = {
  id: string
  href: string
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
// pegadas como en la pared, y debajo de cada una «Retirar». Lo que llama la atención son las tres;
// cada «Retirar» va en `ghost`.
export function LimitReached({ texts, rows }: Props) {
  return (
    <section className="flex flex-col gap-8">
      <header className="flex max-w-[var(--measure)] flex-col gap-2">
        <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
        <p className="text-base text-ink">{texts.body}</p>
      </header>
      <ApplicationList label={texts.listLabel}>
        {rows.map((row, index) => (
          <MyApplicationCard
            key={row.id}
            href={row.href}
            cover={row.cover}
            index={index}
            tone={null}
            texts={{ ...row.texts, stamp: '', reason: null }}
            below={row.withdraw}
          />
        ))}
      </ApplicationList>
    </section>
  )
}
