import { useTranslations } from 'next-intl'

export function Good() {
  const t = useTranslations('common')
  return <p>{t('under_construction')}</p>
}
