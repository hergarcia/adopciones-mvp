import { getTranslations } from 'next-intl/server'
import { PublicProfileLinks } from '@/components/profile/public-profile-links'
import { PhoneStatusCard } from '@/components/verification/phone-status-card'
import { publicProfilePath, publicProfileUrl } from '@/lib/profile/public-paths'
import { NO_GATE, codePath, verifyPath } from '@/lib/verification/gate'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import type { VerificationLevel } from '@/lib/verification/level'
import type { PhoneStatus } from '@/lib/verification/phone-status'
import { statusCardTexts } from '@/app/[locale]/_components/phone-status-texts'
import { IdentitySection } from './identity-section'

type Props = {
  phone: PhoneStatus
  lostOn: string | null
  identity: IdentityStatus
  level: VerificationLevel
  publicId: string
}

// Lo que «Mi perfil» dice de la verificación: el teléfono, la identidad y el perfil público que
// muestra el resultado. El nivel se dice una sola vez: desde nivel 2, «Tu identidad»; la sección del
// teléfono se calla.
export async function VerificationSections({ phone, lostOn, identity, level, publicId }: Props) {
  const t = await getTranslations('profile.public')
  return (
    <>
      <div className="mt-6">
        <PhoneStatusCard
          status={phone}
          texts={await statusCardTexts(phone, lostOn, level >= 2)}
          hrefs={{ verify: verifyPath(NO_GATE), code: codePath(NO_GATE), self: '/mi-perfil' }}
        />
      </div>

      <div className="mt-6">
        <IdentitySection status={identity} level={level} />
      </div>

      <div className="mt-8">
        <PublicProfileLinks
          texts={{
            title: t('section_title'),
            view: t('view'),
            copy: { copy: t('copy'), copied: t('copied'), manual: t('copy_manual') },
          }}
          profileHref={publicProfilePath(publicId)}
          profileUrl={publicProfileUrl(publicId)}
        />
      </div>
    </>
  )
}
