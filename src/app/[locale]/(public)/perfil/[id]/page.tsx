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
import {
  BLOCK_FLAG,
  BLOCKED_FLAG,
  REPORT_FLAG,
  parseBlockedNotice,
  type ModerationQuery,
} from '@/lib/moderation/paths'
import { profileView } from '@/lib/moderation/profile-view'
import { safetyActions } from '@/lib/moderation/safety-actions'
import { isPublicId } from '@/lib/profile/public-paths'
import { followUpHistory } from '@/lib/supabase/queries/follow-ups'
import { getBlockedProfile } from '@/lib/supabase/queries/moderation'
import { isAdmin } from '@/lib/supabase/queries/review'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { getPublicProfile } from '@/lib/supabase/queries/vouches'
import { VOUCH_FLAG, type VouchQuery } from '@/lib/vouches/paths'
import { blockedNoticeText } from '@/app/[locale]/_components/moderation-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'
import { VouchNotice } from '@/app/[locale]/_components/vouch-notice'
import { BlockedScreen } from './_components/blocked-screen'
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

  const [profile, viewer, request, query, history] = await Promise.all([
    findProfile(id),
    vouchViewer(id),
    headers(),
    searchParams,
    isPublicId(id) ? followUpHistory(id) : { given: 0, adopted: 0 },
  ])
  const isOwner = viewer.viewer?.isOwner ?? false
  // El perfil bloqueado se pregunta aparte: el de una suspendida no sale en `public_profile`, y
  // para quien la bloqueó el bloqueo gana (FR-017a).
  const user = viewer.standing.viewerBlockedTarget ? await getSessionUser() : null
  const blocked = user === null ? null : await getBlockedProfile(user.id, id)
  const view = profileView({
    exists: profile !== null || blocked !== null,
    isOwner,
    isSuspended: blocked?.isSuspended ?? false,
    viewerBlocked: blocked !== null,
    blockedByTarget: viewer.standing.targetBlockedViewer,
  })
  if (view === 'not_found') notFound()

  const signedIn = viewer.viewer !== null
  const safety = safetyActions({
    viewer: signedIn ? { isOwner, isAdmin: await isAdmin() } : null,
    view: view === 'blocked' ? 'blocked' : 'profile',
  })
  const notice = signedIn ? parseBlockedNotice(query[BLOCKED_FLAG]) : null
  const name = blocked?.name ?? profile?.displayName ?? ''
  const toast =
    notice === null ? null : <ScreenToast message={await blockedNoticeText(notice, name)} />

  if (view === 'blocked' || profile === null) {
    return (
      <PageShell width="full">
        {toast}
        <BlockedScreen
          name={name}
          publicId={id}
          safety={safety}
          openReport={query[REPORT_FLAG] !== undefined}
        />
      </PageShell>
    )
  }

  const userAgent = request.get('user-agent')
  if (shouldTrackView({ isOwner, userAgent, hasActionFlag: query[VOUCH_FLAG] !== undefined })) {
    await track('public_profile_viewed', { origin: viewOrigin(request.get('referer'), APP_URL) })
  }

  return (
    <PageShell width="full">
      {toast}
      <VouchNotice query={query} signedIn={signedIn} />
      <ProfileScreen
        profile={profile}
        publicId={id}
        viewer={viewer}
        history={history}
        safety={safety}
        // Sin fotos para una vista previa: sin `og:image`, algunas toman la primera imagen de la
        // página, y eso vale también para las de quienes avalan.
        showPhotos={!isLinkPreview(userAgent)}
        announceVouch={query[VOUCH_FLAG] === 'cambio'}
        openOnLoad={openOnLoad(query)}
      />
    </PageShell>
  )
}

function openOnLoad(query: ModerationQuery): 'report' | 'block' | null {
  if (query[BLOCK_FLAG] !== undefined) return 'block'
  return query[REPORT_FLAG] !== undefined ? 'report' : null
}
