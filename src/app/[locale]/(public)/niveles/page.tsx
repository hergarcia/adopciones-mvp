import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LevelsExplanation } from '@/components/verification/levels-explanation'
import { track } from '@/lib/analytics/track'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { validPath } from '@/lib/verification/gate'
import { levelSteps } from '@/app/[locale]/_components/level-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ nivel?: string; desde?: string }>
}

const LEVELS: readonly BadgeLevel[] = [1, 2, 3]

// Pública pero sin indexar hasta que exista el dominio definitivo (docs/08 §Encontrable). La
// canónica sin `?nivel` ni `?desde`: cada chapita enlaza con los suyos y es la misma página.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.levels')
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/niveles' },
    robots: { index: false, follow: false },
  }
}

export default async function LevelsPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()
  const query = await searchParams

  await track('levels_explained')
  const t = await getTranslations('verification.levels')
  const highlighted = LEVELS.find((level) => String(level) === query.nivel) ?? null

  return (
    <PageShell width="full">
      <LevelsExplanation
        texts={{ title: t('title'), lead: t('lead'), back: t('back') }}
        levels={await levelSteps()}
        highlighted={highlighted}
        backHref={validPath(query.desde) ?? '/'}
      />
    </PageShell>
  )
}
