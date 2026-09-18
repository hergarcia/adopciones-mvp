import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Block } from './block'

export async function CardBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('card')}>
      <Card>
        <p className="text-base text-ink-muted">{t('card_body')}</p>
      </Card>
    </Block>
  )
}
