import { getTranslations } from 'next-intl/server'
import { BlockedProfile } from '@/components/moderation/blocked-profile'
import { ProfileSafetyActions } from '@/components/moderation/profile-safety-actions'
import { UnblockButton } from '@/components/moderation/unblock-button'
import type { SafetyActions } from '@/lib/moderation/safety-actions'
import { publicProfilePath } from '@/lib/profile/public-paths'
import { profileSafetyTexts, unblockTexts } from '@/app/[locale]/_components/moderation-texts'

type Props = {
  name: string
  publicId: string
  /** Ya decidido por `safetyActions` con la vista `blocked`. */
  safety: SafetyActions
  /** Vuelve de ingresar para reportar (FR-002: también desde el perfil bloqueado). */
  openReport: boolean
}

// Lo que ve quien bloqueó al abrir el perfil de la bloqueada (FR-015, FR-017a): el nombre,
// «Desbloquear», «Reportar» y, para quien administra, «Suspender». Nada más del perfil.
export async function BlockedScreen({ name, publicId, safety, openReport }: Props) {
  const t = await getTranslations('moderation.block')
  const path = publicProfilePath(publicId)
  return (
    <BlockedProfile
      title={t('profile_title', { name })}
      body={t('profile_body')}
      unblock={<UnblockButton publicId={publicId} returnPath={path} texts={await unblockTexts()} />}
      actions={
        <ProfileSafetyActions
          key={openReport ? 'report' : 'none'}
          publicId={publicId}
          profilePath={path}
          actions={safety}
          openOnLoad={openReport ? 'report' : null}
          texts={await profileSafetyTexts(name, {
            signedIn: true,
            canSuspend: safety.actions.includes('suspend'),
            canBlock: false,
          })}
        />
      }
    />
  )
}
