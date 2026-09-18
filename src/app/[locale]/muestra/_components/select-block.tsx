import { getTranslations } from 'next-intl/server'
import { Select } from '@/components/ui/select'
import { Block } from './block'

export async function SelectBlock() {
  const t = await getTranslations('common.showcase')
  const options = [
    { value: 'dog', label: t('select_option_dog') },
    { value: 'cat', label: t('select_option_cat') },
  ]

  return (
    <Block title={t('select')}>
      <Select options={options} placeholder={t('select_placeholder')} label={t('field_label')} />
      <Select
        options={options}
        placeholder={t('select_placeholder')}
        label={t('field_label')}
        error={t('field_error')}
      />
      <Select
        options={options}
        placeholder={t('select_placeholder')}
        label={t('field_label')}
        disabled
      />
    </Block>
  )
}
