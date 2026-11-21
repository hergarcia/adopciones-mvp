import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { unsubscribePetAlerts } from '@/actions/pet-alerts'
import { UnsubscribeRunner } from '@/components/alerts/unsubscribe-runner'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { MY_ALERTS_PATH } from '@/lib/alerts/paths'
import { hashLinkToken, isLinkToken } from '@/lib/links/link-token'
import { unsubscribeLinkExists } from '@/lib/supabase/queries/pet-alerts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string; token: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.unsubscribe')
  // El token está en la dirección: no se indexa ni viaja como referencia a otro sitio.
  return { title: t('title'), robots: { index: false, follow: false }, referrer: 'no-referrer' }
}

// «Dejar de recibir» de un correo de avisos (historia #265, US3), con o sin sesión. El servidor solo
// mira que el enlace sirva, sin cortar nada (research R7): corta la hoja al montar. Nada de la
// persona: ni su correo, ni su nombre, ni sus avisos.
export default async function UnsubscribePage({ params }: Props) {
  const { locale, token } = await params
  setRequestLocale(locale)
  const [exists, t] = await Promise.all([
    isLinkToken(token) ? unsubscribeLinkExists(hashLinkToken(token)) : false,
    getTranslations('alerts.unsubscribe'),
  ])

  const invalid = (
    <HeadedEmptyState
      title={t('invalid_title')}
      body={t('invalid_body')}
      action={
        <LinkButton href={MY_ALERTS_PATH} variant="secondary">
          {t('invalid_action')}
        </LinkButton>
      }
    />
  )

  return (
    <PageShell width="full">
      {exists ? (
        <UnsubscribeRunner
          unsubscribe={unsubscribePetAlerts.bind(null, token)}
          invalid={invalid}
          texts={{
            heading: t('heading'),
            cutting: t('cutting'),
            ask: t('ask'),
            askBody: t('ask_body'),
            confirm: t('confirm'),
            doneTitle: t('done_title'),
            doneBody: t('done_body'),
            listing: t('listing'),
            failedTitle: t('failed_title'),
            failedBody: t('failed_body'),
            retry: t('retry'),
          }}
        />
      ) : (
        invalid
      )}
    </PageShell>
  )
}
