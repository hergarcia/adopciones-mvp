import { getTranslations } from 'next-intl/server'
import { RadioGroup } from '@/components/ui/radio-group'
import { Block } from './block'

export async function RadioGroupBlock() {
  const t = await getTranslations('common.showcase')
  const species = [
    { value: 'dog', label: t('radio_dog') },
    { value: 'cat', label: t('radio_cat') },
  ]
  const vaccines = [
    { value: 'up_to_date', label: t('radio_up_to_date') },
    { value: 'incomplete', label: t('radio_incomplete') },
    { value: 'none', label: t('radio_none') },
  ]

  return (
    <Block title={t('radio_group')}>
      <RadioGroup legend={t('radio_legend')} name="muestra-quieto" options={species} />
      <RadioGroup
        legend={t('radio_legend_vaccines')}
        name="muestra-elegido"
        options={vaccines}
        defaultValue="incomplete"
      />
      <RadioGroup
        legend={t('radio_legend')}
        name="muestra-error"
        options={species}
        error={t('radio_error')}
      />
      <RadioGroup
        legend={t('radio_legend')}
        name="muestra-deshabilitado"
        options={species}
        defaultValue="dog"
        disabled
      />
    </Block>
  )
}
