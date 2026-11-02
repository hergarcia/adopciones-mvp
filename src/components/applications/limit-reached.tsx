import type { ApplicationTone } from '@/lib/applications/application-view'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationList } from './application-list'
import { ApplicationPetLayout } from './application-pet-layout'
import { MyApplicationCard } from './my-application-card'

export type LimitRow = {
  id: string
  /** Null para una que espera la identidad, que no tiene pantalla propia (historia #289). */
  href: string | null
  cover: PetPhotoData | null
  /** Solo la que espera la identidad lleva sello, para distinguirla de las enviadas. */
  stamp: { tone: ApplicationTone; label: string } | null
  /** Ya traducidos. */
  texts: { name: string; litter: string | null; photoAlt: string; sentOn: string }
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
// llenan el lugar al lado del animal. Las enviadas van sin sello; la que espera la identidad lleva el
// suyo.
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
            tone={row.stamp?.tone ?? null}
            texts={{ ...row.texts, stamp: row.stamp?.label ?? '', reason: null }}
            below={row.withdraw}
          />
        ))}
      </ApplicationList>
    </ApplicationPetLayout>
  )
}
