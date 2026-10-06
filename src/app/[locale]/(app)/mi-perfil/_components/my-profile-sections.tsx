import { getTranslations } from 'next-intl/server'
import { MyProfileLayout } from '@/components/profile/my-profile-layout'
import { PublicProfileLinks } from '@/components/profile/public-profile-links'
import { PhoneStatusCard } from '@/components/verification/phone-status-card'
import { MY_APPLICATIONS_PATH } from '@/lib/applications/paths'
import { MY_BLOCKS_PATH } from '@/lib/moderation/paths'
import { publicProfilePath, publicProfileUrl } from '@/lib/profile/public-paths'
import { NO_GATE, codePath, verifyPath } from '@/lib/verification/gate'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import type { VerificationLevel } from '@/lib/verification/level'
import type { PhoneStatus } from '@/lib/verification/phone-status'
import { countingReceived } from '@/lib/vouches/my-vouches'
import { MY_VOUCHES_PATH } from '@/lib/vouches/paths'
import type { MyVouch } from '@/lib/vouches/types'
import { statusCardTexts } from '@/app/[locale]/_components/phone-status-texts'
import { copyProfileLinkTexts } from '@/app/[locale]/_components/profile-link-texts'
import { IdentitySection } from './identity-section'

type Props = {
  /** Quién es: `ProfileSummary`. */
  summary: React.ReactNode
  /** «Tu correo»: `EmailCard`. */
  email: React.ReactNode
  /** «Editar mi perfil» y las salidas. */
  footer: React.ReactNode
  phone: PhoneStatus
  lostOn: string | null
  identity: IdentityStatus
  level: VerificationLevel
  publicId: string
  vouches: readonly MyVouch[]
}

// Cuántas personas la avalan hoy —las que cuentan, las que se ven en su perfil público—, así un
// aval nuevo se nota sin entrar (FR-022). Con avales que no cuentan no dice que nadie la avala.
async function vouchesLabel(vouches: readonly MyVouch[]): Promise<string> {
  const t = await getTranslations('profile.public')
  const counting = countingReceived(vouches)
  if (counting === 1) return t('my_vouches_one')
  if (counting > 1) return t('my_vouches_many', { count: counting })
  const received = vouches.some((vouch) => vouch.direction === 'received')
  return received ? t('my_vouches_paused') : t('my_vouches_none')
}

// «Mi perfil» con lo que dice de la verificación: el teléfono, la identidad y el perfil público que
// muestra el resultado. El nivel se dice una sola vez: desde nivel 2, «Tu identidad»; la sección del
// teléfono se calla.
export async function MyProfileSections({
  summary,
  email,
  footer,
  phone,
  lostOn,
  identity,
  level,
  publicId,
  vouches,
}: Props) {
  const [t, blocks, applications] = await Promise.all([
    getTranslations('profile.public'),
    getTranslations('moderation.my_blocks'),
    getTranslations('applications.mine'),
  ])
  return (
    <MyProfileLayout
      summary={summary}
      email={email}
      phone={
        <PhoneStatusCard
          status={phone}
          texts={await statusCardTexts(phone, lostOn, level >= 2)}
          hrefs={{ verify: verifyPath(NO_GATE), code: codePath(NO_GATE), self: '/mi-perfil' }}
        />
      }
      identity={<IdentitySection status={identity} level={level} />}
      publicProfile={
        <PublicProfileLinks
          texts={{
            title: t('section_title'),
            view: t('view'),
            copy: await copyProfileLinkTexts(),
          }}
          profileHref={publicProfilePath(publicId)}
          profileUrl={publicProfileUrl(publicId)}
          vouches={{ href: MY_VOUCHES_PATH, label: await vouchesLabel(vouches) }}
          blocks={{ href: MY_BLOCKS_PATH, label: blocks('link') }}
          applications={{ href: MY_APPLICATIONS_PATH, label: applications('link') }}
        />
      }
      footer={footer}
    />
  )
}
