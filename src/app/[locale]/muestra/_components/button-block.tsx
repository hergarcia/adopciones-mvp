import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Block } from './block'

export async function ButtonBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('button')}>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary">{t('action_primary')}</Button>
        <Button variant="secondary">{t('action_secondary')}</Button>
        <Button variant="ghost">{t('action_ghost')}</Button>
        <Button variant="danger">{t('action_danger')}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">{t('action_primary')}</Button>
        <Button size="md">{t('action_primary')}</Button>
        <Button size="lg">{t('action_primary')}</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button loading>{t('action_loading')}</Button>
        <Button disabled>{t('action_disabled')}</Button>
      </div>
      <Button variant="tirita" size="lg">
        {t('action_tirita')}
      </Button>
    </Block>
  )
}
