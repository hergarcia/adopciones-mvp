import { litterPath } from '@/lib/litters/paths'
import { zoneName } from '@/lib/zones/zone-name'
import { petPath } from './paths'
import { signedPhotoSource } from './photo-source'
import { publisherLevelLabel, type PublisherLevelKey } from './publisher-level'
import type { Sex, Species } from './options'
import type { ListedCardView, ListedPet, PetPhotoData, PetState, Zone } from './types'

type Card = {
  key: string
  href: string
  name: string
  zone: Zone
  isUrgent: boolean
  cover: PetPhotoData
}

type CardTexts = {
  /** «Foto de Tobi, perro en Pocitos, Montevideo». */
  alt: string
  /** «Urgente». */
  urgent: string
  /** «Perra, 8 años, grande»; «Mis animales» no la muestra. */
  summary?: string
  /** El sello del estado, ya traducido; disponible no lleva. */
  stamp?: { state: PetState; label: string }
  /** El nivel de quien lo publicó, con las palabras de la ficha. */
  level?: string
}

type CardPet = { name: string; species: Species; sex: Sex; zone: Zone }

/** El traductor de `pets.my_pets`, donde viven los textos de la card. */
type CardTranslator = (key: 'urgent' | 'photo_alt', values?: Record<string, string>) => string

/** El texto alternativo y «Urgente», iguales en el listado y en «Mis animales». */
export function cardTexts(pet: CardPet, t: CardTranslator): Pick<CardTexts, 'alt' | 'urgent'> {
  return {
    urgent: t('urgent'),
    alt: t('photo_alt', {
      name: pet.name,
      species: pet.species,
      sex: pet.sex,
      zone: zoneName(pet.zone),
    }),
  }
}

/** Una card con sus textos ya traducidos, lista para dibujarse en el servidor o en el cliente. */
export function cardView(card: Card, texts: CardTexts): ListedCardView {
  return {
    key: card.key,
    href: card.href,
    name: card.name,
    summaryText: texts.summary,
    zoneText: zoneName(card.zone),
    urgentText: card.isUrgent ? texts.urgent : null,
    alt: texts.alt,
    photo: signedPhotoSource(card.cover),
    stamp: texts.stamp,
    levelText: texts.level,
  }
}

/** Las del listado abren la ficha pública: la del animal o la de la camada. */
export function listedCard(pet: ListedPet): Card {
  return {
    ...pet,
    key: pet.code,
    href: pet.kind === 'litter' ? litterPath(pet.code) : petPath(pet.code),
  }
}

/** El traductor de `pets.status`, donde vive el texto del sello. */
type StampTranslator = (key: 'stamp', values: { state: PetState; sex: Sex }) => string

/** El sello sobre la foto, concordado con el animal; disponible no lleva (spec #59). */
export function stampOf(
  pet: { state: PetState; sex: Sex },
  t: StampTranslator,
): CardTexts['stamp'] {
  return pet.state === 'available'
    ? undefined
    : { state: pet.state, label: t('stamp', { state: pet.state, sex: pet.sex }) }
}

/** El traductor de `litters.card`. */
type LitterCardTranslator = (
  key: 'photo_alt' | 'summary',
  values: Record<string, string | number>,
) => string

/** El texto alternativo de una camada y «Urgente», iguales en el listado y en «Mis animales». */
export function litterCardTexts(
  litter: { name: string; species: Species; zone: Zone },
  t: LitterCardTranslator,
  card: CardTranslator,
): Pick<CardTexts, 'alt' | 'urgent'> {
  return {
    urgent: card('urgent'),
    alt: t('photo_alt', {
      name: litter.name,
      species: litter.species,
      zone: zoneName(litter.zone),
    }),
  }
}

type ListedTranslators = {
  /** «Perra, 8 años, grande»: la arma quien tiene los textos de la ficha. */
  petSummary: (pet: Extract<ListedPet, { kind: 'pet' }>) => string
  card: CardTranslator
  status: StampTranslator
  litter: LitterCardTranslator
  /**
   * Las palabras del nivel en la ficha (`pets.page`). Sin él, la tarjeta no dice el nivel: en el
   * perfil todas son de la misma persona, cuya chapita ya está arriba (historia #273).
   */
  level?: (key: PublisherLevelKey) => string
}

/** El nivel de quien publicó, si la tarjeta lo dice y se pudo saber. */
function levelText(pet: ListedPet, t: ListedTranslators): string | undefined {
  const key = publisherLevelLabel(pet.publisherLevel)
  return key === null || t.level === undefined ? undefined : t.level(key)
}

/**
 * Los textos de una tarjeta del listado. La de un animal dice qué animal es y lleva su sello; la de
 * una camada dice qué animales, cuántas crías tiene y cuántas están disponibles, y lleva «En
 * proceso» cuando no queda ninguna disponible y alguna está en proceso. Camada es femenino. Las dos
 * dicen el nivel de quien publicó cuando se le pasan sus palabras.
 */
export function listedCardTexts(pet: ListedPet, t: ListedTranslators): CardTexts {
  if (pet.kind === 'litter')
    return {
      ...litterCardTexts(pet, t.litter, t.card),
      summary: t.litter('summary', {
        species: pet.species,
        young: pet.youngCount,
        available: pet.availableCount,
      }),
      stamp: stampOf({ state: pet.status, sex: 'female' }, t.status),
      level: levelText(pet, t),
    }
  return {
    ...cardTexts(pet, t.card),
    summary: t.petSummary(pet),
    stamp: stampOf({ state: pet.status, sex: pet.sex }, t.status),
    level: levelText(pet, t),
  }
}
