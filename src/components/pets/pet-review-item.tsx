import { getTranslations } from 'next-intl/server'
import { LitterCountLine } from '@/components/litters/litter-count-line'
import { YoungInReviewList } from '@/components/litters/young-in-review-list'
import { youngInReviewTexts } from '@/components/litters/young-in-review-texts'
import { TextLink } from '@/components/ui/text-link'
import { ZoneLabel } from '@/components/zones/zone-label'
import { litterPath } from '@/lib/litters/paths'
import { petPath } from '@/lib/pets/paths'
import type { ReviewItem } from '@/lib/pets/review-types'
import { waitingFor } from '@/lib/pets/waiting-for'
import { PetFacts } from './pet-facts'
import { PetGallery } from './pet-gallery'
import { petFactLines, petGalleryTexts } from './pet-sheet-texts'
import { PetStatusStamp } from './pet-status-stamp'
import { PetWorkLayout } from './pet-work-layout'
import { UrgencyTag } from './urgency-tag'

type Props = {
  /** Un animal, o una camada entera con sus crías (#205, FR-043). */
  pet: ReviewItem
  now: Date
  /** La primera de la lista carga su portada con prioridad; las demás esperan. */
  lead: boolean
  /** La nota de quien publica (`OwnerCard`): la pone la página, como en la ficha. */
  owner: React.ReactNode
  /** «Marcar revisada» y «Dar de baja»; la propia no tiene. */
  decision: React.ReactNode
}

// Una publicación que espera, entera y en la misma lista (spec §Pantallas): el nombre con su estado
// si no está disponible, si es nueva o editada y desde cuándo espera, todas las fotos, todos los
// datos con la descripción completa, quién la publica y su enlace. Es una pantalla de trabajo: lo
// único que llama la atención son las fotos (plan §Diseño). Desde 1024, las fotos al lado de los
// datos y la decisión, que así quedan a la vista mientras se miran. Una camada dice cuántas crías
// tiene y, debajo de lo común, cada una con lo suyo.
export async function PetReviewItem({ pet, now, lead, owner, decision }: Props) {
  const [t, pets, litters, facts, gallery, young] = await Promise.all([
    getTranslations('pet_review'),
    getTranslations('pets'),
    getTranslations('litters'),
    petFactLines(pet.kind === 'pet' ? pet : { ...pet, sex: 'litter' }),
    petGalleryTexts(pet),
    pet.kind === 'litter' ? youngInReviewTexts(pet.young) : null,
  ])
  const age = pets('age', { unit: pet.age.unit, value: pet.age.value })
  const waiting = waitingFor(new Date(pet.pendingSince), now)
  const path = pet.kind === 'pet' ? petPath(pet.code) : litterPath(pet.code)

  return (
    <article>
      <PetWorkLayout
        photo="large"
        head={
          <header className="flex flex-col items-start gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="afiche text-lg break-words text-ink">{pet.name}</h2>
              {pet.kind === 'pet' ? (
                <PetStatusStamp
                  state={pet.state}
                  label={pets('status.stamp', { state: pet.state, sex: pet.sex })}
                />
              ) : null}
            </div>
            <p className="text-sm text-ink-muted">
              {t('waiting', { kind: pet.pendingKind, time: t('time', waiting) })}
            </p>
          </header>
        }
        picture={
          <div className="-mx-gutter md:mx-0">
            <PetGallery code={pet.code} photos={pet.photos} texts={gallery} lead={lead} />
          </div>
        }
      >
        <div className="flex max-w-[var(--measure)] flex-col gap-6">
          <div className="flex flex-col items-start gap-1">
            <p className="text-base text-ink">
              {pet.kind === 'pet'
                ? pets('page.summary', { species: pet.species, sex: pet.sex, age })
                : litters('page.summary', { species: pet.species, age })}
            </p>
            {pet.kind === 'litter' ? (
              <LitterCountLine text={litters('my.young_count', { count: pet.young.length })} />
            ) : null}
            <ZoneLabel zone={pet.zone} />
            {pet.isUrgent ? <UrgencyTag label={pets('my_pets.urgent')} /> : null}
          </div>
          <PetFacts lines={facts} label={pets('page.facts.label', { name: pet.name })} />
          {pet.description ? (
            <p className="text-base break-words whitespace-pre-line text-ink">{pet.description}</p>
          ) : null}
          {pet.kind === 'litter' && young !== null ? (
            <YoungInReviewList young={pet.young} texts={young} />
          ) : null}
          <div className="flex flex-col gap-2">
            {owner}
            {pet.publisher.level === null ? (
              <p className="text-sm text-ink-muted">{t('no_level')}</p>
            ) : null}
          </div>
          <TextLink href={path} prefetch={false} className="self-start">
            {path.slice(1)}
          </TextLink>
          {pet.isOwn ? <p className="text-base text-ink-muted">{t('own')}</p> : decision}
        </div>
      </PetWorkLayout>
    </article>
  )
}
