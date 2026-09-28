import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PublicProfileHeader } from '@/components/profile/public-profile-header'
import { PublicProfileLayout } from '@/components/profile/public-profile-layout'
import { ProfileLevel } from '@/components/verification/profile-level'
import { isLinkPreview } from '@/lib/analytics/link-preview'
import { track } from '@/lib/analytics/track'
import { shouldTrackView, viewOrigin } from '@/lib/analytics/view-origin'
import { APP_NAME, APP_URL } from '@/lib/config'
import { monthYear } from '@/lib/profile/month-year'
import { isPublicId, publicPhotoPath, publicProfilePath } from '@/lib/profile/public-paths'
import { getMyPublicId } from '@/lib/supabase/queries/profiles'
import { getPublicProfile } from '@/lib/supabase/queries/vouches'
import { publicLevel } from '@/lib/verification/level'
import { profileLevelProps } from '@/app/[locale]/_components/level-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ aval?: string }>
}

// Una sola promesa por pedido para la página y los metadatos, también con un id mal formado: así el
// «no existe» de los tres casos sale en el mismo orden y es la misma respuesta (SC-002).
const findProfile = cache(async (id: string) => (isPublicId(id) ? getPublicProfile(id) : null))

// La vista previa de un enlace lleva el nombre y el sitio, y nada más de la persona (FR-009): sin
// imagen, zona ni nivel. `robots` va fijo acá y no depende de ningún interruptor de indexación del
// sitio: prenderla en M5 no vuelve indexables los perfiles solos.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const profile = await findProfile(id)
  const t = await getTranslations('metadata.public_profile')
  const title = profile === null ? t('not_found_title') : t('title', { name: profile.displayName })
  return {
    title,
    robots: { index: false, follow: false },
    openGraph: { type: 'profile', siteName: APP_NAME, title: `${title} · ${APP_NAME}` },
  }
}

// Sin `loading.tsx` a propósito: con un límite de Suspense el perfil no se lee sin scripts
// (FR-010) y el 404 de «no existe» ya habría salido como 200 (research R9).
export default async function PublicProfilePage({ params, searchParams }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const profile = await findProfile(id)
  if (profile === null) notFound()

  const [ownId, request, query] = await Promise.all([getMyPublicId(), headers(), searchParams])
  const userAgent = request.get('user-agent')
  const isOwner = ownId === id
  if (shouldTrackView({ isOwner, userAgent, hasActionFlag: query.aval !== undefined })) {
    await track('public_profile_viewed', { origin: viewOrigin(request.get('referer'), APP_URL) })
  }

  const t = await getTranslations('profile.public')
  const path = publicProfilePath(id)
  const level = publicLevel(profile)
  // Sin la foto para una vista previa: sin `og:image`, algunas toman la primera imagen de la página.
  const photoUrl = profile.hasPhoto && !isLinkPreview(userAgent) ? publicPhotoPath(id) : null

  return (
    <PageShell width="full">
      <PublicProfileLayout
        header={
          <PublicProfileHeader
            displayName={profile.displayName}
            zone={profile}
            isRescuer={profile.isRescuer}
            photoUrl={photoUrl}
            texts={{
              photoAlt: t('photo_alt', { name: profile.displayName }),
              rescuer: t('rescuer'),
            }}
          />
        }
        since={
          <p className="text-sm text-ink-muted tabular-nums">
            {t('member_since', { date: monthYear(profile.memberSince) })}
          </p>
        }
        level={<ProfileLevel {...await profileLevelProps(level, profile.identitySince, path)} />}
      />
    </PageShell>
  )
}
