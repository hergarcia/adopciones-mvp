import { getTranslations } from 'next-intl/server'
import { Chip, ChipGroup } from '@/components/ui/chip'
import { Block } from './block'

export async function ChipBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('chip')}>
      <ChipGroup label={t('chip_group_label')}>
        <Chip label={t('chip_dogs')} />
        <Chip label={t('chip_cats')} active />
        <Chip label={t('chip_zone')} />
        <Chip label={t('chip_puppies')} />
      </ChipGroup>
    </Block>
  )
}
