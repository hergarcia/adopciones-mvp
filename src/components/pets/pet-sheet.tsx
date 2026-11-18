import { getTranslations } from 'next-intl/server'
import { OwnerCard } from '@/components/verification/owner-card'
import { publishedAgo } from '@/lib/pets/published-ago'
import type { PublicPet } from '@/lib/pets/types'
import { PetFacts } from './pet-facts'
import { PetGallery } from './pet-gallery'
import { PetHeadline } from './pet-headline'
import { otherPetsLink, petFactLines, petGalleryTexts, publisherTexts } from './pet-sheet-texts'
import { publisherHref } from './publisher-href'
import { SHEET_COLUMNS, SHEET_GALLERY, SHEET_READING, SHEET_STICKY_ACTION } from './sheet-layout'
import { coverTransitionName } from '@/lib/pets/cover-transition'

type Props = {
  pet: PublicPet
  /** El día de Uruguay de hoy, para «Publicado hace…». */
  today: string
  /** Lo que va arriba de la galería: el aviso al publicador cuando nadie más la ve. */
  notice?: React.ReactNode
  /** El sello del estado al lado del nombre: en proceso. */
  stamp?: React.ReactNode
  /** El sello puesto sobre la foto: adoptado, el desenlace que la ficha anuncia. */
  photoStamp?: React.ReactNode
  /**
   * La tirita de la pantalla —«Quiero adoptar», o el camino a los que sí buscan hogar—: fija abajo
   * en el teléfono (docs/10 §Layout), en su lugar desde 768.
   */
  stickyAction?: React.ReactNode
  /** «Compartir» y, para el publicador, «Editar». */
  actions: React.ReactNode
  /** En la nota de quien publica: las adopciones con seguimiento que dio. */
  ownerHistory?: React.ReactNode
  /** Si quien publica tiene otros animales a la vista en su perfil: la nota invita a verlos. */
  hasOtherPets?: boolean
}

// La ficha entera: el cartel a sangre, la foto arriba y la lectura debajo, con la nota de quien lo
// pegó (plan §Ficha) antes de la descripción, que es lo único de largo libre: así el sello queda en
// la primera vuelta del teléfono, escriba lo que escriba el publicador (docs/10 §Layout). Desde
// 1024, dos columnas dentro de la hoja: una galería 4:5 a lo ancho de 1200 mediría 1500 px y
// empujaría todo el texto debajo del pliegue (docs/10 §Pantallas anchas).
export async function PetSheet({
  pet,
  today,
  notice,
  stamp,
  photoStamp,
  stickyAction,
  actions,
  ownerHistory,
  hasOtherPets = false,
}: Props) {
  const [t, facts, gallery, owner, otherPets] = await Promise.all([
    getTranslations('pets'),
    petFactLines(pet),
    petGalleryTexts(pet),
    publisherTexts(pet.publisher),
    otherPetsLink(pet.publisher, hasOtherPets),
  ])
  const age = t('age', { unit: pet.age.unit, value: pet.age.value })
  const ago = publishedAgo(pet.publishedOn, today)

  return (
    <article className="flex flex-col gap-6">
      {notice}
      <div className={SHEET_COLUMNS}>
        <div className={SHEET_GALLERY}>
          <PetGallery
            code={pet.code}
            photos={pet.photos}
            texts={gallery}
            coverTransition={coverTransitionName(pet.code)}
          />
          {photoStamp ? (
            <span className="pointer-events-none absolute top-6 left-gutter md:left-gutter-wide">
              {photoStamp}
            </span>
          ) : null}
        </div>
        <div className={SHEET_READING}>
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
            texts={owner}
            history={ownerHistory}
            href={publisherHref(pet.publisher)}
            otherPets={otherPets}
          />
          {pet.description ? (
            <p className="text-base break-words whitespace-pre-line text-ink">{pet.description}</p>
          ) : null}
          {stickyAction ? <div className={SHEET_STICKY_ACTION}>{stickyAction}</div> : null}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{actions}</div>
        </div>
      </div>
    </article>
  )
}
