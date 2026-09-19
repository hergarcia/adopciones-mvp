import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose } from '@/components/ui/dialog'
import { Block } from './block'

export async function DialogBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('dialog')}>
      <div className="flex flex-wrap gap-2">
        <Dialog
          title={t('dialog_title')}
          description={t('dialog_body')}
          closeLabel={t('sheet_close')}
          trigger={<Button variant="secondary">{t('dialog_open')}</Button>}
        >
          <DialogClose>
            <Button variant="secondary">{t('dialog_cancel')}</Button>
          </DialogClose>
          <DialogClose>
            <Button variant="danger">{t('dialog_confirm')}</Button>
          </DialogClose>
        </Dialog>
      </div>
    </Block>
  )
}
