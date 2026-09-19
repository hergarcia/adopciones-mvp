import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Block } from './block'

export async function CardBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('card')}>
      <Card taped className="mt-3">
        <p className="text-base text-ink-muted">{t('card_body')}</p>
      </Card>
      <Link id="card-interactive" href="#card-interactive" className="block">
        <Card interactive>
          <span className="afiche text-xl text-ink">{t('card_interactive')}</span>
        </Card>
      </Link>
    </Block>
  )
}
