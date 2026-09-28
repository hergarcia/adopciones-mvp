import { getTranslations } from 'next-intl/server'
import { OwnerCard } from '@/components/verification/owner-card'
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
  /** Lo que va arriba de la galería: el aviso al publicador sin nivel 1. */
  notice?: React.ReactNode
  /** «Compartir» y, para el publicador, «Editar». */
  actions: React.ReactNode
}

// La ficha entera: el cartel a sangre, la foto arriba y la lectura debajo, con la nota de quien lo
// pegó (plan §Ficha). Desde 1024, dos columnas dentro de la hoja: una galería 4:5 a lo ancho de 1200
// mediría 1500 px y empujaría todo el texto debajo del pliegue (docs/10 §Pantallas anchas).
export async function PetSheet({ pet, today, notice, actions }: Props) {
  const t = await getTranslations('pets')
  const age = t('age', { unit: pet.age.unit, value: pet.age.value })
  const ago = publishedAgo(pet.publishedOn, today)
  const level = publisherLevelLabel(pet.publisher.level)
  const facts = [
    { label: t('page.facts.size'), value: t(`options.size.${pet.size}`) },
    {
      label: t('page.facts.neutered'),
      value: t(`options.yes_no.${pet.isNeutered ? 'yes' : 'no'}`),
    },
    { label: t('page.facts.vaccines'), value: t(`options.vaccines.${pet.vaccines}`) },
    { label: t('page.facts.chip'), value: t(`options.yes_no.${pet.hasChip ? 'yes' : 'no'}`) },
    { label: t('page.facts.kids'), value: t(`options.good_with.${pet.goodWithKids}`) },
    { label: t('page.facts.dogs'), value: t(`options.good_with.${pet.goodWithDogs}`) },
    { label: t('page.facts.cats'), value: t(`options.good_with.${pet.goodWithCats}`) },
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
            }}
          />
        </div>
        <div className="flex max-w-[var(--measure)] flex-col gap-6">
          <PetHeadline
            name={pet.name}
            zone={pet.zone}
            isUrgent={pet.isUrgent}
            texts={{
              summary: t('page.summary', { species: pet.species, sex: pet.sex, age }),
              urgent: t('my_pets.urgent'),
              published: t('page.published', ago),
            }}
          />
          <PetFacts facts={facts} label={t('page.facts.label', { name: pet.name })} />
          {pet.description ? (
            <p className="text-base break-words whitespace-pre-line text-ink">{pet.description}</p>
          ) : null}
          <OwnerCard
            publisher={pet.publisher}
            texts={{
              photoAlt: t('page.publisher_photo_alt', { name: pet.publisher.name }),
              rescuer: t('page.rescuer'),
              level: level === null ? null : t(`page.${level}`),
            }}
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{actions}</div>
        </div>
      </div>
    </article>
  )
}
