import { getTranslations } from 'next-intl/server'
import { NativeSelect } from '@/components/ui/native-select'
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
      <NativeSelect
        aria-label={t('native_select_label')}
        options={[
          { value: '', label: t('native_select_any') },
          { value: 'montevideo', label: t('native_select_montevideo') },
        ]}
        className="w-48"
      />
    </Block>
  )
}
