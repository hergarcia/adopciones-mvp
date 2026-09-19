import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose } from '@/components/ui/sheet'
import { Block } from './block'

export async function SheetBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('sheet')}>
      <div className="flex flex-wrap gap-2">
        <Sheet
          title={t('sheet_title')}
          closeLabel={t('sheet_close')}
          trigger={<Button variant="secondary">{t('sheet_open')}</Button>}
        >
          <SheetClose>
            <Button variant="ghost">{t('dialog_cancel')}</Button>
          </SheetClose>
        </Sheet>
      </div>
    </Block>
  )
}
