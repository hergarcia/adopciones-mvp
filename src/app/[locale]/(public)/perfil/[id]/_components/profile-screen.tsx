import { getTranslations } from 'next-intl/server'
import { FollowUpHistory } from '@/components/follow-ups/follow-up-history'
import { followUpHistoryTexts } from '@/components/follow-ups/follow-up-history-texts'
import { ProfileSafetyActions } from '@/components/moderation/profile-safety-actions'
import { PublicProfileHeader } from '@/components/profile/public-profile-header'
import { PublicProfileLayout } from '@/components/profile/public-profile-layout'
import { ProfileLevel } from '@/components/verification/profile-level'
import { ProfileVouchers } from '@/components/vouches/profile-vouchers'
import { VouchSlot } from '@/components/vouches/vouch-slot'
import { signInWithNext } from '@/lib/auth/next-destination'
import type { FollowUpHistory as FollowUpCounts } from '@/lib/follow-ups/types'
import type { SafetyActions } from '@/lib/moderation/safety-actions'
import { monthYear } from '@/lib/profile/month-year'
import { publicPhotoPath, publicProfilePath } from '@/lib/profile/public-paths'
import { publicLevel } from '@/lib/verification/level'
import type { PublicProfile } from '@/lib/vouches/types'
import { splitVouchers } from '@/lib/vouches/voucher-list'
import { vouchSlot, type VouchSlotInput } from '@/lib/vouches/vouch-slot'
import { profileLevelProps } from '@/app/[locale]/_components/level-texts'
import { profileSafetyTexts } from '@/app/[locale]/_components/moderation-texts'
import { vouchSlotTexts } from '@/app/[locale]/_components/vouch-texts'

type Props = {
  profile: PublicProfile
  publicId: string
  /** Quién mira, en los hechos que pide `vouchSlot`. */
  viewer: Pick<VouchSlotInput, 'viewer' | 'standing'>
  history: FollowUpCounts
  safety: SafetyActions
  showPhotos: boolean
  /** Después de un aval que no se dio por un motivo de FR-013. */
  announceVouch: boolean
  /** Vuelve de ingresar para reportar o bloquear (FR-001, US3-AS8). */
  openOnLoad: 'report' | 'block' | null
}

// El perfil público de la historia #12 con las herramientas de la #13 al pie.
export async function ProfileScreen({
  profile,
  publicId,
  viewer,
  history,
  safety,
  showPhotos,
  announceVouch,
  openOnLoad,
}: Props) {
  const t = await getTranslations('profile.public')
  const path = publicProfilePath(publicId)
  const level = publicLevel(profile)
  const slot = vouchSlot({ ...viewer, targetLevelTwo: level >= 2 })
  const photoUrl = profile.hasPhoto && showPhotos ? publicPhotoPath(publicId) : null
  const { shown, rest } = splitVouchers(profile.vouchers)

  return (
    <PublicProfileLayout
      header={
        <PublicProfileHeader
          profile={profile}
          photoUrl={photoUrl}
          texts={{
            photoAlt: t('photo_alt', { name: profile.displayName }),
            rescuer: t('rescuer'),
          }}
          history={<FollowUpHistory lines={await followUpHistoryTexts(history, 'both')} />}
        />
      }
      since={
        <p className="text-sm text-ink-muted tabular-nums">
          {t('member_since', { date: monthYear(profile.memberSince) })}
        </p>
      }
      level={
        <ProfileLevel
          {...await profileLevelProps(level, profile.identitySince, profile.vouchers.length, path)}
        />
      }
      vouchers={
        shown.length === 0 ? null : (
          <ProfileVouchers
            shown={shown}
            rest={rest}
            showPhotos={showPhotos}
            texts={{
              title: t('vouchers_title'),
              more: t('vouchers_more', { count: rest.length }),
            }}
          />
        )
      }
      slot={
        <VouchSlot
          slot={slot}
          texts={await vouchSlotTexts(profile.displayName)}
          publicId={publicId}
          returnPath={path}
          signInHref={signInWithNext(path)}
          announce={announceVouch}
        />
      }
      safety={
        safety.actions.length === 0 ? null : (
          <ProfileSafetyActions
            // Volver con otra marca (desde «Bloquear a Ana» del reporte) la monta de nuevo, abierta.
            key={openOnLoad ?? 'none'}
            publicId={publicId}
            profilePath={path}
            actions={safety}
            openOnLoad={safety.signIn ? null : openOnLoad}
            texts={await profileSafetyTexts(profile.displayName, {
              signedIn: !safety.signIn,
              canSuspend: safety.actions.includes('suspend'),
              canBlock: safety.actions.includes('block'),
            })}
          />
        )
      }
    />
  )
}
