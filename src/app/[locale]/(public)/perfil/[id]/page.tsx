import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { isLinkPreview } from '@/lib/analytics/link-preview'
import { track } from '@/lib/analytics/track'
import { shouldTrackView, viewOrigin } from '@/lib/analytics/view-origin'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { APP_NAME, APP_URL } from '@/lib/config'
import { REPORT_FLAG, type ModerationQuery } from '@/lib/moderation/paths'
import { safetyActions } from '@/lib/moderation/safety-actions'
import { isPublicId } from '@/lib/profile/public-paths'
import { isAdmin } from '@/lib/supabase/queries/review'
import { getPublicProfile } from '@/lib/supabase/queries/vouches'
import { VOUCH_FLAG, type VouchQuery } from '@/lib/vouches/paths'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { VouchNotice } from '@/app/[locale]/_components/vouch-notice'
import { ProfileScreen } from './_components/profile-screen'
import { vouchViewer } from './_components/vouch-viewer'

type Props = {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<VouchQuery & ModerationQuery>
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
  await redirectIfSuspended()

  const profile = await findProfile(id)
  if (profile === null) notFound()

  const [viewer, request, query] = await Promise.all([vouchViewer(id), headers(), searchParams])
  const userAgent = request.get('user-agent')
  const isOwner = viewer.viewer?.isOwner ?? false
  if (shouldTrackView({ isOwner, userAgent, hasActionFlag: query[VOUCH_FLAG] !== undefined })) {
    await track('public_profile_viewed', { origin: viewOrigin(request.get('referer'), APP_URL) })
  }
  const safety = safetyActions({
    viewer: viewer.viewer === null ? null : { isOwner, isAdmin: await isAdmin() },
    view: 'profile',
  })

  return (
    <PageShell width="full">
      <VouchNotice query={query} signedIn={viewer.viewer !== null} />
      <ProfileScreen
        profile={profile}
        publicId={id}
        viewer={viewer}
        safety={safety}
        // Sin fotos para una vista previa: sin `og:image`, algunas toman la primera imagen de la
        // página, y eso vale también para las de quienes avalan.
        showPhotos={!isLinkPreview(userAgent)}
        announceVouch={query[VOUCH_FLAG] === 'cambio'}
        openReport={query[REPORT_FLAG] !== undefined}
      />
    </PageShell>
  )
}
