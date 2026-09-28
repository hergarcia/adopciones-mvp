import { zoneName } from '@/lib/zones/zone-name'
import { petPath } from './paths'
import { signedPhotoSource } from './photo-source'
import type { ListedCardView, ListedPet, PetPhotoData, Zone } from './types'

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
  /** La edad de hoy; «Mis animales» no la muestra. */
  age?: string
}

/** Una card con sus textos ya traducidos, lista para dibujarse en el servidor o en el cliente. */
export function cardView(card: Card, texts: CardTexts): ListedCardView {
  return {
    key: card.key,
    href: card.href,
    name: card.name,
    ageText: texts.age,
    zoneText: zoneName(card.zone),
    urgentText: card.isUrgent ? texts.urgent : null,
    alt: texts.alt,
    photo: signedPhotoSource(card.cover),
  }
}

/** Las del listado abren la ficha pública. */
export function listedCard(pet: ListedPet): Card {
  return { ...pet, key: pet.code, href: petPath(pet.code) }
}
