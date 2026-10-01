import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'
import { RenewalResult } from '@/components/pets/renewal-result'
import { MY_PETS_PATH, petGatePath, renewalPath } from '@/lib/pets/paths'
import { renewalResult, type RenewalAction } from '@/lib/pets/renewal-result'
import { hashRenewalToken, isRenewalToken } from '@/lib/pets/renewal-token'
import { getRenewalLinkPet } from '@/lib/supabase/queries/pet-renewal'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string; token: string }>
  searchParams: Promise<{ r?: string | string[] }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pets.renewal.metadata')
  // El token está en la dirección: no se indexa ni viaja como referencia a otro sitio.
  return { title: t('title'), robots: { index: false, follow: false }, referrer: 'no-referrer' }
}

function actionHref(action: RenewalAction, token: string): string {
  if (action === 'my_pets') return MY_PETS_PATH
  if (action === 'verify') return petGatePath(MY_PETS_PATH)
  return renewalPath(token)
}

// Lo que pasó al tocar «Sigue disponible» (FR-018, FR-020): sin sesión, y solo lee. Si la base no
// responde, lanza y la pantalla de error ofrece reintentar, sin decir que el enlace no sirve.
export default async function RenewalResultPage({ params, searchParams }: Props) {
  const { locale, token } = await params
  setRequestLocale(locale)
  const { r } = await searchParams
  const [pet, t, format] = await Promise.all([
    isRenewalToken(token) ? getRenewalLinkPet(hashRenewalToken(token)) : null,
    getTranslations('pets.renewal'),
    getFormatter(),
  ])
  const view = renewalResult(typeof r === 'string' ? r : undefined, pet)
  const { date, ...values } = view.values
  const texts = {
    ...values,
    date: date === undefined ? '' : format.dateTime(date, { day: 'numeric', month: 'long' }),
  }

  return (
    <PageShell>
      <RenewalResult
        href={actionHref(view.action, token)}
        renews={view.action === 'renew' || view.action === 'retry'}
        texts={{
          title: t(view.title, texts),
          body: t(view.body, texts),
          action: t(`actions.${view.action}`),
        }}
      />
    </PageShell>
  )
}
