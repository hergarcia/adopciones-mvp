import { getTranslations } from 'next-intl/server'
import { Checkbox } from '@/components/ui/checkbox'
import { Block } from './block'

export async function CheckboxBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('checkbox')}>
      <Checkbox label={t('checkbox_unchecked')} />
      <Checkbox label={t('checkbox_checked')} defaultChecked />
      <Checkbox label={t('checkbox_disabled')} disabled />
      <Checkbox label={t('checkbox_disabled_checked')} defaultChecked disabled />
    </Block>
  )
}
