import { getTranslations } from 'next-intl/server'
import { APP_NAME } from '@/lib/config'
import { litterPath, litterPosterPath } from '@/lib/litters/paths'
import type { PublicLitter } from '@/lib/litters/types'
import { petPath, petPosterPath } from '@/lib/pets/paths'
import { publisherLevelLabel } from '@/lib/pets/publisher-level'
import { shareUrl, typedAddress } from '@/lib/pets/share-url'
import type { Publisher, PublicPet } from '@/lib/pets/types'
import {
  offersLitterGroupPost,
  offersPetGroupPost,
  receivesApplications,
} from '@/lib/share/group-post'
import { zoneName } from '@/lib/zones/zone-name'
import type { PosterCard } from './pet-poster'
import type { PosterButtonProps } from './poster-button'

// «Guardar cartel» (historia #275): con las mismas condiciones que el texto para el grupo, y solo con
// lo que la ficha muestra a cualquiera, sin la descripción ni ningún contacto de quien publicó. La
// ruta de la imagen y la ficha piden los textos con el idioma: fuera de una página no hay uno pedido.

type PosterButtonData = Pick<PosterButtonProps, 'texts' | 'target'>

async function button(
  locale: string,
  input: { code: string; title: string; image: string; page: string },
): Promise<PosterButtonData> {
  const [t, share] = await Promise.all([
    getTranslations({ locale, namespace: 'pets.poster' }),
    getTranslations({ locale, namespace: 'pets.share' }),
  ])
  return {
    texts: { action: t('action'), failed: t('failed'), close: share('close'), title: input.title },
    target: {
      image: input.image,
      link: shareUrl(input.page, 'poster'),
      fileName: t('file_name', { code: input.code }),
    },
  }
}

/** El botón de un animal propio, o null si hoy no se ofrece (pausado, adoptado, sin teléfono…). */
export async function petPosterButton(
  pet: PublicPet,
  locale: string,
): Promise<PosterButtonData | null> {
  if (!offersPetGroupPost(pet)) return null
  const pets = await getTranslations({ locale, namespace: 'pets' })
  return button(locale, {
    code: pet.code,
    title: pets('share.title', { name: pet.name }),
    image: petPosterPath(pet.code),
    page: petPath(pet.code),
  })
}

/** El de una camada propia con alguna cría que recibe solicitudes, o null. */
export async function litterPosterButton(
  litter: PublicLitter,
  locale: string,
): Promise<PosterButtonData | null> {
  if (!offersLitterGroupPost(litter)) return null
  const litters = await getTranslations({ locale, namespace: 'litters' })
  return button(locale, {
    code: litter.code,
    title: litters('meta.title', { name: litter.name }),
    image: litterPosterPath(litter.code),
    page: litterPath(litter.code),
  })
}

async function common(locale: string, publisher: Publisher) {
  const [t, pets] = await Promise.all([
    getTranslations({ locale, namespace: 'pets.poster' }),
    getTranslations({ locale, namespace: 'pets' }),
  ])
  const key = publisherLevelLabel(publisher.level)
  return {
    t,
    pets,
    tagline: t('tagline'),
    level:
      key === null || publisher.level === null
        ? null
        : { value: publisher.level, text: pets(`share.publisher.${key}`) },
    siteName: APP_NAME,
  }
}

/** Lo que dice el cartel de un animal, sin la portada. */
export async function petPosterCard(
  pet: PublicPet,
  locale: string,
): Promise<Omit<PosterCard, 'photo'>> {
  const { t, pets, ...shared } = await common(locale, pet.publisher)
  const age = pets('age', { unit: pet.age.unit, value: pet.age.value })
  return {
    ...shared,
    urgent: pet.isUrgent ? pets('my_pets.urgent') : null,
    stamp:
      pet.state === 'in_process' ? pets('status.stamp', { state: pet.state, sex: pet.sex }) : null,
    name: pet.name,
    lines: [
      pets('page.summary', { species: pet.species, sex: pet.sex, age }),
      t('size', { size: pet.size, sex: pet.sex }),
      zoneName(pet.zone),
    ],
    invite: t('invite', { sex: pet.sex }),
    address: typedAddress(petPath(pet.code)),
  }
}

/** Lo que dice el cartel de una camada: lo común y cuántas crías quedan, sin la portada. */
export async function litterPosterCard(
  litter: PublicLitter,
  locale: string,
): Promise<Omit<PosterCard, 'photo'>> {
  const [{ t, pets, ...shared }, litters] = await Promise.all([
    common(locale, litter.publisher),
    getTranslations({ locale, namespace: 'litters' }),
  ])
  const age = pets('age', { unit: litter.age.unit, value: litter.age.value })
  const remaining = litter.young.filter((one) => receivesApplications(one.state)).length
  return {
    ...shared,
    urgent: litter.isUrgent ? pets('my_pets.urgent') : null,
    stamp: null,
    name: litter.name,
    lines: [
      litters('page.summary', { species: litter.species, age }),
      t('size', { size: litter.size, sex: 'litter' }),
      zoneName(litter.zone),
      t('young_count', { count: remaining }),
    ],
    invite: t('invite_litter'),
    address: typedAddress(litterPath(litter.code)),
  }
}
