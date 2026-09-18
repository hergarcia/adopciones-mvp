import { getTranslations } from 'next-intl/server'
import { Chip } from '@/components/ui/chip'
import { Block } from './block'

export async function ChipBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('chip')}>
      <div className="flex flex-wrap gap-2">
        <Chip label={t('chip_dog')} />
        <Chip label={t('chip_cat')} active />
      </div>
    </Block>
  )
}
