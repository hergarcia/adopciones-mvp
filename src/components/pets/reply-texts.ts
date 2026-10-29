import { getTranslations } from 'next-intl/server'
import { litterPath } from '@/lib/litters/paths'
import type { PublicLitter } from '@/lib/litters/types'
import { petPath } from '@/lib/pets/paths'
import { shareUrl } from '@/lib/pets/share-url'
import type { PublicPet } from '@/lib/pets/types'
import { offersLitterGroupPost, offersPetGroupPost } from '@/lib/share/group-post'
import { replyText } from '@/lib/share/reply'
import type { GroupPostTexts } from './group-post-button'

// La respuesta para quien le escribe por privado a quien publicó (historia #250). Se ofrece con las
// mismas condiciones que el texto para el grupo, nunca lleva un contacto de quien publicó, y su
// enlace lleva la marca propia de la respuesta, que tampoco dice quién la mandó.

async function common() {
  const [t, pets] = await Promise.all([getTranslations('pets.reply'), getTranslations('pets')])
  return {
    t,
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

/**
 * La de un animal propio, o null si hoy no se ofrece. `requiredLevel` es el de «Quién puede
 * solicitar»; sin él no se sabe si avisar de la cédula, y la respuesta no se ofrece.
 */
export async function petReply(
  pet: PublicPet,
  requiredLevel: 1 | 2 | null,
): Promise<GroupPostTexts | null> {
  if (requiredLevel === null || !offersPetGroupPost(pet)) return null
  const { t, chrome } = await common()
  return {
    ...chrome,
    text: replyText(
      {
        hello: t('hello', { name: pet.name }),
        inProcess: t('in_process'),
        steps: t('steps'),
        identity: t('identity', { sex: pet.sex }),
        contact: t('contact'),
        invite: t('invite', { sex: pet.sex }),
      },
      {
        requiredLevel,
        inProcess: pet.state === 'in_process',
        url: shareUrl(petPath(pet.code), 'reply'),
      },
    ),
  }
}

/** La de una camada propia con crías que reciben solicitudes, o null. */
export async function litterReply(litter: PublicLitter): Promise<GroupPostTexts | null> {
  if (!offersLitterGroupPost(litter)) return null
  const { t, chrome } = await common()
  return {
    ...chrome,
    text: replyText(
      {
        hello: t('hello', { name: litter.name }),
        inProcess: t('in_process'),
        steps: t('steps'),
        identity: t('identity_litter'),
        contact: t('contact'),
        invite: t('invite_litter'),
      },
      {
        requiredLevel: litter.requiredLevel,
        inProcess: false,
        url: shareUrl(litterPath(litter.code), 'reply'),
      },
    ),
  }
}
