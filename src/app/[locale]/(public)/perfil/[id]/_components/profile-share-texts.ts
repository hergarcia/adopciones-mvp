import { getTranslations } from 'next-intl/server'
import { isPublisherLevel, publisherLevelLabel } from '@/lib/pets/publisher-level'
import type { VerificationLevel } from '@/lib/verification/level'

export async function profileShareLevelText(
  level: VerificationLevel | null,
): Promise<string | null> {
  const key = publisherLevelLabel(isPublisherLevel(level) ? level : null)
  if (key === null) return null
  const t = await getTranslations('pets.page')
  return t(key)
}
