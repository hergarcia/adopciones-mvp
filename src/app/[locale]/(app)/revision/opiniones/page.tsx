import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { deleteFeedback } from '@/actions/feedback'
import { FeedbackList } from '@/components/feedback/feedback-list'
import { AnnounceNotices } from '@/components/forms/announce-notices'
import { FEEDBACK_LIST_PATH } from '@/lib/feedback/paths'
import { LIST_STEP, shownCount } from '@/lib/lists/newest-first'
import { listFeedback } from '@/lib/supabase/queries/feedback'
import { isAdmin } from '@/lib/supabase/queries/review'
import { AdminBackLink } from '@/app/[locale]/(app)/_components/admin-back-link'
import { feedbackListTexts } from '@/app/[locale]/_components/feedback-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { feedbackEntries } from './_components/feedback-entries'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ ver?: string | string[] }>
}

// Para quien no administra, ni el título de la pestaña dice que la pantalla existe (FR-040).
export async function generateMetadata(): Promise<Metadata> {
  const title = (await isAdmin())
    ? (await getTranslations('metadata.review.feedback'))('title')
    : (await getTranslations('common.not_found'))('title')
  return { title, robots: { index: false, follow: false } }
}

// Opiniones (US3): lo que llegó desde Opinar, de la más nueva a la más vieja, con «Borrar». Sin
// sesión o sin administrar, lo mismo que una ruta que no existe, sin mandar a ingresar (FR-040); la
// base lo vuelve a preguntar al leer y al borrar.
export default async function FeedbackListPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()
  if (!(await isAdmin())) notFound()

  const count = shownCount((await searchParams).ver)
  const [list, texts, t, toast] = await Promise.all([
    listFeedback(count),
    feedbackListTexts(),
    getTranslations('feedback.list'),
    getTranslations('common.toast'),
  ])
  const last = list.items.at(-1)

  return (
    <PageShell width="full">
      <AdminBackLink />
      <h1 className="afiche mb-6 text-2xl text-ink">{t('title')}</h1>
      <AnnounceNotices
        texts={{ label: toast('label'), region: toast('region'), close: toast('close') }}
      >
        <FeedbackList
          entries={await feedbackEntries(list.items, locale)}
          texts={texts}
          moreHref={
            list.hasMore && last !== undefined
              ? `${FEEDBACK_LIST_PATH}?ver=${count + LIST_STEP}#${last.id}`
              : null
          }
          remove={deleteFeedback}
        />
      </AnnounceNotices>
    </PageShell>
  )
}
