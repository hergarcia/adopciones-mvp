import { getTranslations } from 'next-intl/server'
import { Textarea } from '@/components/ui/textarea'
import { Block } from './block'

export async function TextareaBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('textarea')}>
      <Textarea
        id="muestra-textarea"
        aria-label={t('field_label')}
        placeholder={t('field_placeholder')}
      />
      <Textarea
        id="muestra-textarea-error"
        aria-label={t('field_label')}
        placeholder={t('field_placeholder')}
        error={t('field_error')}
      />
      <Textarea
        id="muestra-textarea-disabled"
        aria-label={t('field_label')}
        placeholder={t('field_placeholder')}
        disabled
      />
    </Block>
  )
}
