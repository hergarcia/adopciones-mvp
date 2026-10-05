import { getTranslations } from 'next-intl/server'
import { PetUnavailable } from '@/components/pets/pet-unavailable'
import { LazyUnblockButton } from '@/components/moderation/lazy-unblock-button'
import { petPath } from '@/lib/pets/paths'
import { unblockTexts } from '@/app/[locale]/_components/moderation-texts'

type Props = { code: string; publisherPublicId: string }

// El animal de alguien que bloqueaste (FR-015): sin foto, nombre ni zona, con «Desbloquear»; al
// desbloquear, la ficha se vuelve a dibujar entera.
export async function BlockedPetScreen({ code, publisherPublicId }: Props) {
  const [t, page] = await Promise.all([
    getTranslations('moderation.block'),
    getTranslations('pets.page'),
  ])
  return (
    <PetUnavailable
      texts={{ title: t('pet_title'), body: t('pet_body'), toListing: page('to_listing') }}
      action={
        <LazyUnblockButton
          publicId={publisherPublicId}
          returnPath={petPath(code)}
          texts={await unblockTexts()}
        />
      }
    />
  )
}
