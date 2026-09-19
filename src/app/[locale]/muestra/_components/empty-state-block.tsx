import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Block } from './block'

export async function EmptyStateBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('empty_state')}>
      <EmptyState
        title={t('empty_title')}
        action={<Button variant="primary">{t('empty_action')}</Button>}
      />
    </Block>
  )
}
