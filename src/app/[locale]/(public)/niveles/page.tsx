import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LevelsExplanation } from '@/components/verification/levels-explanation'
import { track } from '@/lib/analytics/track'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { validPath } from '@/lib/verification/gate'
import { badgeLabel } from '@/app/[locale]/_components/level-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ nivel?: string; desde?: string }>
}

const LEVELS: readonly BadgeLevel[] = [1, 2, 3]

// Pública pero sin indexar hasta que exista el dominio definitivo (docs/08 §Encontrable).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.levels')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function LevelsPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const query = await searchParams

  await track('levels_explained')
  const t = await getTranslations('verification.levels')
  const highlighted = LEVELS.find((level) => String(level) === query.nivel) ?? null

  return (
    <PageShell width="full">
      <LevelsExplanation
        texts={{ title: t('title'), lead: t('lead'), back: t('back') }}
        levels={await Promise.all(
          LEVELS.map(async (level) => ({
            level,
            texts: {
              title: t('level', { level }),
              asks: t(`asks_${level}`),
              says: t(`says_${level}`),
              badge: await badgeLabel(level, false),
            },
          })),
        )}
        highlighted={highlighted}
        backHref={validPath(query.desde) ?? '/'}
      />
    </PageShell>
  )
}
