import { getTranslations } from 'next-intl/server'
import type { ProfileLevel } from '@/components/verification/profile-level'
import { monthYear } from '@/lib/profile/month-year'
import { levelsPath } from '@/lib/profile/public-paths'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import type { VerificationLevel } from '@/lib/verification/level'

// Lo que dice la chapita en voz alta (FR-024): «Verificado, nivel 2», y si enlaza a la explicación,
// «… Qué significa».
export async function badgeLabel(level: BadgeLevel, linked: boolean): Promise<string> {
  const t = await getTranslations('verification.levels')
  const badge = t(`badge_level_${level}`)
  return linked ? t('badge_link', { badge }) : badge
}

// El nivel de una persona en su perfil público: la chapita con su texto, o la nota sin nivel.
// `from` es la ruta a la que vuelve la explicación.
export async function profileLevelProps(
  level: VerificationLevel,
  identitySince: string | null,
  from: string,
): Promise<React.ComponentProps<typeof ProfileLevel>> {
  const t = await getTranslations('profile.public')
  const levelsHref = levelsPath(level, from)
  if (level === 0) {
    return {
      level,
      levelsHref,
      texts: { unverified: t('unverified'), levelsLink: t('levels_link') },
    }
  }
  return {
    level,
    levelsHref,
    texts: {
      badge: await badgeLabel(level, true),
      level: t('level', { level }),
      identitySince:
        identitySince === null ? null : t('identity_since', { date: monthYear(identitySince) }),
    },
  }
}
