import { getFormatter, getTranslations } from 'next-intl/server'
import { PetFacts } from '@/components/pets/pet-facts'
import { PetGallery } from '@/components/pets/pet-gallery'
import { PetHeadline } from '@/components/pets/pet-headline'
import { PetStatusStamp } from '@/components/pets/pet-status-stamp'
import { publisherHref } from '@/components/pets/publisher-href'
import { petWall } from '@/components/pets/pet-wall'
import {
  otherPetsLink,
  petFactLines,
  petGalleryTexts,
  publisherTexts,
} from '@/components/pets/pet-sheet-texts'
import { OwnerCard } from '@/components/verification/owner-card'
import { visibleDeliveryDate } from '@/lib/litters/delivery-date'
import type { PublicLitter } from '@/lib/litters/types'
import { uruguayDay } from '@/lib/pets/age'
import { publishedAgo } from '@/lib/pets/published-ago'
import { DeliveryDateLine } from './delivery-date-line'
import { LitterCountLine } from './litter-count-line'
import { YoungCard } from './young-card'

type Props = {
  litter: PublicLitter
  now: Date
  /** Lo que va arriba de la galería: el aviso a quien la publicó cuando nadie más la ve. */
  notice?: React.ReactNode
  /** Que la camada pide identidad verificada, arriba de los botones de las crías (FR-029). */
  requiredLevel?: React.ReactNode
  /** «Compartir» y, para quien la publicó, «Editar». */
  actions: React.ReactNode
  /** El botón de cada cría, en el orden de `litter.young`. */
  youngActions: React.ReactNode[]
  /** Si quien la publicó tiene otros animales a la vista, además de esta camada. */
  hasOtherPets?: boolean
}

// Sin tirita: el botón de una cría no puede repetirse diez veces fijo abajo (docs/10, `ApplyAction`).
export async function LitterSheet({
  litter,
  now,
  notice,
  requiredLevel,
  actions,
  youngActions,
  hasOtherPets = false,
}: Props) {
  const [t, page, pets, status, format, facts, gallery, owner, otherPets] = await Promise.all([
    getTranslations('pets'),
    getTranslations('litters.page'),
    getTranslations('pets.page'),
    getTranslations('pets.status'),
    getFormatter(),
    petFactLines({ ...litter, sex: 'litter' }),
    petGalleryTexts(litter),
    publisherTexts(litter.publisher),
    otherPetsLink(litter.publisher, hasOtherPets),
  ])
  const age = t('age', { unit: litter.age.unit, value: litter.age.value })
  const ago = publishedAgo(litter.publishedOn, uruguayDay(now))
  const delivery = visibleDeliveryDate(litter.deliversFrom, now)

  return (
    <article className="flex flex-col gap-10">
      {notice}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
        <div className="relative -mx-gutter md:-mx-gutter-wide lg:sticky lg:top-0 lg:mr-0">
          <PetGallery code={litter.code} photos={litter.photos} texts={gallery} />
        </div>
        <div className="flex max-w-[var(--measure)] flex-col gap-6">
          <div className="flex flex-col gap-2">
            {/* Adoptada entera, el sello junto al nombre, como un animal adoptado (FR-020). */}
            {litter.state === 'adopted' ? (
              <PetStatusStamp
                state="adopted"
                label={status('stamp', { state: 'adopted', sex: 'female' })}
              />
            ) : null}
            <PetHeadline
              name={litter.name}
              zone={litter.zone}
              isUrgent={litter.isUrgent}
              texts={{
                summary: page('summary', { species: litter.species, age }),
                urgent: t('my_pets.urgent'),
                published: page('published', ago),
              }}
            />
            <LitterCountLine
              text={page('count', {
                young: litter.young.length,
                available: litter.availableCount,
              })}
            />
            {delivery === null ? null : (
              <DeliveryDateLine
                text={page('delivers_from', {
                  date: format.dateTime(new Date(`${delivery}T12:00:00-03:00`), {
                    day: 'numeric',
                    month: 'long',
                    timeZone: 'America/Montevideo',
                  }),
                })}
              />
            )}
          </div>
          {requiredLevel}
          <PetFacts lines={facts} label={pets('facts.label', { name: litter.name })} />
          <OwnerCard
            publisher={litter.publisher}
            texts={owner}
            href={publisherHref(litter.publisher)}
            otherPets={otherPets}
          />
          {litter.description ? (
            <p className="text-base break-words whitespace-pre-line text-ink">
              {litter.description}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{actions}</div>
        </div>
      </div>
      <section aria-labelledby="crias" className="flex flex-col gap-6">
        <h2 id="crias" className="afiche text-xl text-ink">
          {page('young_title')}
        </h2>
        <ul className={petWall({ columns: 'wall' })}>
          {litter.young.map((young, index) => (
            <li key={young.code}>
              <YoungCard
                young={young}
                texts={{
                  sex: page('young_sex', { sex: young.sex }),
                  photoAlt: page('young_photo_alt', {
                    name: young.name,
                    sex: young.sex,
                    litter: litter.name,
                  }),
                }}
                action={youngActions[index]}
                stamp={
                  young.state === 'available' ? null : (
                    <PetStatusStamp
                      state={young.state}
                      label={status('stamp', { state: young.state, sex: 'female' })}
                    />
                  )
                }
              />
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
