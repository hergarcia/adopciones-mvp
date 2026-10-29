import { getTranslations } from 'next-intl/server'
import { litterPath } from '@/lib/litters/paths'
import type { PublicLitter } from '@/lib/litters/types'
import { petPath } from '@/lib/pets/paths'
import { publisherLevelLabel } from '@/lib/pets/publisher-level'
import { shareUrl } from '@/lib/pets/share-url'
import type { Publisher, PublicPet } from '@/lib/pets/types'
import {
  groupPostText,
  offersLitterGroupPost,
  offersPetGroupPost,
  receivesApplications,
} from '@/lib/share/group-post'
import { zoneName } from '@/lib/zones/zone-name'
import type { GroupPostTexts } from './group-post-button'
import { petFactLines } from './pet-sheet-texts'

// El texto para pegar en el grupo (historia #248), armado con lo que la ficha ya muestra a
// cualquiera: nunca un teléfono, un correo ni otro contacto de quien publicó. El enlace lleva la
// marca de «Compartir», así la visita cuenta como «enlace compartido».

async function common(publisher: Publisher) {
  const [t, pets] = await Promise.all([getTranslations('pets.group_post'), getTranslations('pets')])
  const level = publisherLevelLabel(publisher.level)
  return {
    t,
    pets,
    publisher: level === null ? null : pets(`share.publisher.${level}`),
    chrome: {
      action: t('action'),
      copied: t('copied'),
      manualTitle: t('manual_title'),
      manualBody: t('manual_body'),
      textLabel: t('text_label'),
      close: pets('share.close'),
    },
  }
}

/** El de un animal propio, o null si hoy no se ofrece (pausado, adoptado, sin teléfono…). */
export async function petGroupPost(pet: PublicPet): Promise<GroupPostTexts | null> {
  if (!offersPetGroupPost(pet)) return null
  const [{ t, pets, publisher, chrome }, [health, livesWith]] = await Promise.all([
    common(pet.publisher),
    petFactLines(pet, 'known'),
  ])
  const age = pets('age', { unit: pet.age.unit, value: pet.age.value })
  return {
    ...chrome,
    text: groupPostText({
      urgent: pet.isUrgent ? pets('my_pets.urgent') : null,
      title: pets('share.title', { name: pet.name }),
      inProcess: pet.state === 'in_process' ? t('in_process') : null,
      facts: t('facts', {
        summary: pets('page.summary', { species: pet.species, sex: pet.sex, age }),
        health,
      }),
      livesWith,
      zone: zoneName(pet.zone),
      description: pet.description,
      young: [],
      publisher,
      invite: t('invite', { sex: pet.sex }),
      url: shareUrl(petPath(pet.code)),
    }),
  }
}

/** El de una camada propia: lo común y las crías que quedan, o null si ninguna recibe solicitudes. */
export async function litterGroupPost(litter: PublicLitter): Promise<GroupPostTexts | null> {
  if (!offersLitterGroupPost(litter)) return null
  const [{ t, pets, publisher, chrome }, litters, [health, livesWith]] = await Promise.all([
    common(litter.publisher),
    getTranslations('litters'),
    petFactLines({ ...litter, sex: 'litter' }, 'known'),
  ])
  const age = pets('age', { unit: litter.age.unit, value: litter.age.value })
  const remaining = litter.young.filter((one) => receivesApplications(one.state))
  return {
    ...chrome,
    text: groupPostText({
      urgent: litter.isUrgent ? pets('my_pets.urgent') : null,
      title: litters('meta.title', { name: litter.name }),
      inProcess: null,
      facts: t('facts', {
        summary: litters('page.summary', { species: litter.species, age }),
        health,
      }),
      livesWith,
      zone: zoneName(litter.zone),
      description: litter.description,
      young: [
        t('young_count', { count: remaining.length }),
        ...remaining.map((one) =>
          t('young_line', { name: one.name, sex: one.sex, state: one.state }),
        ),
      ],
      publisher,
      invite: t('invite_litter'),
      url: shareUrl(litterPath(litter.code)),
    }),
  }
}
