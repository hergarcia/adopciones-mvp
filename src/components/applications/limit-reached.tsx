import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationList } from './application-list'
import { ApplicationPetLayout } from './application-pet-layout'
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
  /** El animal desde el que llegó. */
  cover: PetPhotoData | null
  /** Ya traducidos. */
  texts: { title: string; body: string; listLabel: string; photoAlt: string }
  rows: LimitRow[]
}

// Un aviso en la puerta, antes de cualquier pregunta (FR-051): el animal por el que vino pegado al
// lado, como en toda pantalla de una solicitud, para que sepa por quién retira; y sus tres, pegadas
// como en la pared, con «Retirar» debajo de cada una en `ghost`. Son tres siempre: tres columnas
// llenan el lugar al lado del animal.
export function LimitReached({ cover, texts, rows }: Props) {
  return (
    <ApplicationPetLayout
      cover={cover}
      photoAlt={texts.photoAlt}
      wide
      head={
        <header className="flex max-w-[var(--measure)] flex-col gap-2">
          <h1 className="afiche text-2xl break-words text-ink">{texts.title}</h1>
          <p className="text-base text-ink">{texts.body}</p>
        </header>
      }
    >
      <ApplicationList label={texts.listLabel} columns="three">
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
    </ApplicationPetLayout>
  )
}
