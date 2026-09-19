import { useTranslations } from 'next-intl'

export function Bad() {
  const t = useTranslations('common')
  return <p>{t('esta_clave_no_existe')}</p>
}
