import { getTranslations } from 'next-intl/server'
import type { LevelStepTexts } from '@/components/verification/level-step'
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

const LEVELS: readonly BadgeLevel[] = [1, 2, 3]

// Los tres escalones: «Qué dice cada nivel» y «Cómo se verifica» leen las mismas claves, así no se
// pueden contradecir (FR-009 de la #8).
export async function levelSteps(): Promise<{ level: BadgeLevel; texts: LevelStepTexts }[]> {
  const t = await getTranslations('verification.levels')
  return Promise.all(
    LEVELS.map(async (level) => ({
      level,
      texts: {
        title: t('level', { level }),
        asks: t(`asks_${level}`),
        says: t(`says_${level}`),
        badge: await badgeLabel(level, false),
      },
    })),
  )
}

// El nivel de una persona en su perfil público: la chapita con su texto, o la nota sin nivel.
// `from` es la ruta a la que vuelve la explicación.
export async function profileLevelProps(
  level: VerificationLevel,
  identitySince: string | null,
  vouchers: number,
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
      certifies: certifies(level, identitySince, vouchers, t),
    },
  }
}

// Lo que asegura cada nivel, como lo diría la explicación de los niveles: el teléfono, la identidad
// con su mes y, en el 3, cuántas personas responden por ella. Desde nivel 2 siempre hay mes: el
// nivel sale de ahí.
function certifies(
  level: BadgeLevel,
  identitySince: string | null,
  vouchers: number,
  t: Awaited<ReturnType<typeof getTranslations<'profile.public'>>>,
): string {
  if (identitySince === null) return t('phone_verified')
  const date = monthYear(identitySince)
  return level === 3
    ? t('identity_vouched', { date, count: vouchers })
    : t('identity_since', { date })
}
