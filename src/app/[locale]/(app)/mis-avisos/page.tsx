import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { DeleteAlertButton } from '@/components/alerts/delete-alert-button'
import { MyAlertRow } from '@/components/alerts/my-alert-row'
import { MyAlertsList } from '@/components/alerts/my-alerts-list'
import { AnnounceNotices } from '@/components/forms/announce-notices'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { alertName } from '@/lib/alerts/alert-name'
import { alertNameWords } from '@/lib/alerts/alert-name-texts'
import { MY_ALERTS_PATH } from '@/lib/alerts/paths'
import { ALERTS_MAX } from '@/lib/alerts/rules'
import { requireProfile } from '@/lib/auth/require-profile'
import { listingHref } from '@/lib/pets/listing-query'
import { LISTING_PATH } from '@/lib/pets/paths'
import { listMyPetAlerts } from '@/lib/supabase/queries/pet-alerts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.my_alerts')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Los avisos de la persona, del más viejo al más nuevo, en palabras, con su listado y «Borrar»
// (historia #265, FR-010). Al borrar, la fila sale y la lista lo anuncia.
export default async function MyAlertsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireProfile(MY_ALERTS_PATH)

  const [alerts, words, t, errors, toast] = await Promise.all([
    listMyPetAlerts(),
    alertNameWords(locale),
    getTranslations('alerts.mine'),
    getTranslations('alerts.errors'),
    getTranslations('common.toast'),
  ])
  const deleteTexts = {
    label: t('delete'),
    done: t('deleted'),
    failed: t('delete_failed'),
    session: errors('session'),
  }

  return (
    <PageShell>
      <AnnounceNotices
        texts={{ label: toast('label'), region: toast('region'), close: toast('close') }}
      >
        {alerts.length === 0 ? (
          <HeadedEmptyState
            title={t('empty_title')}
            body={t('empty')}
            action={
              <LinkButton href={LISTING_PATH} variant="secondary">
                {t('empty_action')}
              </LinkButton>
            }
          />
        ) : (
          <>
            <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
            <p className="mt-2 mb-6 text-base text-ink-muted">{t('intro', { max: ALERTS_MAX })}</p>
            <MyAlertsList label={t('list_label')}>
              {alerts.map((alert) => (
                <MyAlertRow
                  key={alert.id}
                  name={alertName(alert.filters, words)}
                  href={listingHref(alert.filters)}
                  seeListing={t('see_listing')}
                  action={<DeleteAlertButton alertId={alert.id} texts={deleteTexts} />}
                />
              ))}
            </MyAlertsList>
          </>
        )}
      </AnnounceNotices>
    </PageShell>
  )
}
