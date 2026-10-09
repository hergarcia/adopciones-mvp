import type { getTranslations } from 'next-intl/server'
import type { WaitParts } from './queues'

export type HomeTranslator = Awaited<ReturnType<typeof getTranslations<'admin.home'>>>

/** Desde cuándo espera algo: «hace 3 días», «hace menos de 1 hora». */
export function waitText(t: HomeTranslator, parts: WaitParts): string {
  if (parts.unit === 'under_hour') return t('wait.under_hour')
  return t(`wait.${parts.unit}`, { count: parts.value })
}

/** Cuánto se pasó de plazo: «1 día», «5 horas». */
export function spanText(t: HomeTranslator, parts: WaitParts): string {
  if (parts.unit === 'under_hour') return t('span.under_hour')
  return t(`span.${parts.unit}`, { count: parts.value })
}
