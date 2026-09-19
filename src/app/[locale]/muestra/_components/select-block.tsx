import { getTranslations } from 'next-intl/server'
import { Select } from '@/components/ui/select'
import { Block } from './block'

export async function SelectBlock() {
  const t = await getTranslations('common.showcase')
  const options = [
    { value: 'malvin', label: t('select_option_malvin') },
    { value: 'cordon', label: t('select_option_cordon') },
  ]

  return (
    <Block title={t('select')}>
      <Select options={options} placeholder={t('select_placeholder')} label={t('select_label')} />
      <Select
        options={options}
        placeholder={t('select_placeholder')}
        label={t('select_label')}
        error={t('field_error')}
      />
      <Select
        options={options}
        placeholder={t('select_placeholder')}
        label={t('select_label')}
        disabled
      />
    </Block>
  )
}
