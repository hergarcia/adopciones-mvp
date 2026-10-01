import { getFormatter, getTranslations } from 'next-intl/server'
import { OwnerCard } from '@/components/verification/owner-card'
import { livesWith } from '@/lib/pets/lives-with'
import { publishedAgo } from '@/lib/pets/published-ago'
import { publisherLevelLabel } from '@/lib/pets/publisher-level'
import type { PublicPet } from '@/lib/pets/types'
import { PetFacts } from './pet-facts'
import { PetGallery } from './pet-gallery'
import { PetHeadline } from './pet-headline'

type Props = {
  pet: PublicPet
  /** El día de Uruguay de hoy, para «Publicado hace…». */
  today: string
  /** Lo que va arriba de la galería: el aviso al publicador cuando nadie más la ve. */
  notice?: React.ReactNode
  /** El sello del estado al lado del nombre. */
  stamp?: React.ReactNode
  /** «Compartir» y, para el publicador, «Editar». */
  actions: React.ReactNode
}

// La ficha entera: el cartel a sangre, la foto arriba y la lectura debajo, con la nota de quien lo
// pegó (plan §Ficha) antes de la descripción, que es lo único de largo libre: así el sello queda en
// la primera vuelta del teléfono, escriba lo que escriba el publicador (docs/10 §Layout). Desde
// 1024, dos columnas dentro de la hoja: una galería 4:5 a lo ancho de 1200 mediría 1500 px y
// empujaría todo el texto debajo del pliegue (docs/10 §Pantallas anchas).
export async function PetSheet({ pet, today, notice, stamp, actions }: Props) {
  const [t, profile, format] = await Promise.all([
    getTranslations('pets'),
    getTranslations('profile.public'),
    getFormatter(),
  ])
  const age = t('age', { unit: pet.age.unit, value: pet.age.value })
  const ago = publishedAgo(pet.publishedOn, today)
  const level = publisherLevelLabel(pet.publisher.level)
  const yesNo = (value: boolean) => (value ? 'yes' : 'no')
  const facts = [
    t('page.facts.health', {
      size: pet.size,
      neutered: yesNo(pet.isNeutered),
      sex: pet.sex,
      vaccines: pet.vaccines,
      chip: yesNo(pet.hasChip),
    }),
    livesWith(pet)
      .map(({ answer, who }) =>
        t(`page.facts.lives_with.${answer}`, {
          who: format.list(who.map((companion) => t(`page.facts.companions.${companion}`))),
        }),
      )
      .join(' '),
  ]

  return (
    <article className="flex flex-col gap-6">
      {notice}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
        <div className="-mx-gutter md:-mx-gutter-wide lg:sticky lg:top-0 lg:mr-0">
          <PetGallery
            code={pet.code}
            photos={pet.photos}
            texts={{
              label: t('page.gallery_label', { name: pet.name }),
              alts: pet.photos.map((_, index) =>
                t('page.photo_alt', { n: index + 1, total: pet.photos.length, name: pet.name }),
              ),
              positions: pet.photos.map((_, index) =>
                t('page.gallery_position', { n: index + 1, total: pet.photos.length }),
              ),
            }}
          />
        </div>
        <div className="flex max-w-[var(--measure)] flex-col gap-6">
          <PetHeadline
            name={pet.name}
            zone={pet.zone}
            isUrgent={pet.isUrgent}
            stamp={stamp}
            texts={{
              summary: t('page.summary', { species: pet.species, sex: pet.sex, age }),
              urgent: t('my_pets.urgent'),
              published: t('page.published', ago),
            }}
          />
          <PetFacts lines={facts} label={t('page.facts.label', { name: pet.name })} />
          <OwnerCard
            publisher={pet.publisher}
            texts={{
              photoAlt: t('page.publisher_photo_alt', { name: pet.publisher.name }),
              rescuer: profile('rescuer'),
              level: level === null ? null : t(`page.${level}`),
            }}
          />
          {pet.description ? (
            <p className="text-base break-words whitespace-pre-line text-ink">{pet.description}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{actions}</div>
        </div>
      </div>
    </article>
  )
}
