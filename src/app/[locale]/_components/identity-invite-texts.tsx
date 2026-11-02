import { getTranslations } from 'next-intl/server'
import { VerifiedWords, type IdentityInviteTexts } from '@/components/verification/identity-invite'
import { IDENTITY_EXPECTED_REVIEW_DAYS } from '@/lib/verification/rules'

// Con nombre, el animal o la camada que se ve en el listado y «su ficha»; sin nombre, «lo que
// publicás» y «la ficha» (FR-007).
export async function identityInviteTexts(subject: string | null): Promise<IdentityInviteTexts> {
  const t = await getTranslations('identity.invite')
  const verified = (chunks: React.ReactNode) => <VerifiedWords>{chunks}</VerifiedWords>
  return {
    title: t('title'),
    change:
      subject === null
        ? t.rich('change', { verified })
        : t.rich('change_named', { name: subject, verified }),
    places: [
      subject === null ? t('places.page') : t('places.page_named'),
      t('places.listing'),
      t('places.preview'),
      t('places.poster'),
    ],
    photos: t('photos', { days: IDENTITY_EXPECTED_REVIEW_DAYS }),
    verify: t('verify'),
    notNow: t('not_now'),
  }
}
