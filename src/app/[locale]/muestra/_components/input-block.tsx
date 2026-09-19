import { getTranslations } from 'next-intl/server'
import { Input } from '@/components/ui/input'
import { Block } from './block'

export async function InputBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('input')}>
      <Input
        id="muestra-input"
        aria-label={t('field_label')}
        placeholder={t('field_placeholder')}
      />
      <Input
        id="muestra-input-error"
        aria-label={t('field_label')}
        placeholder={t('field_placeholder')}
        error={t('field_error')}
      />
      <Input
        id="muestra-input-disabled"
        aria-label={t('field_label')}
        placeholder={t('field_placeholder')}
        disabled
      />
    </Block>
  )
}
