import { getTranslations } from 'next-intl/server'
import { MyVouchRow } from '@/components/vouches/my-vouch-row'
import { RemoveVouchDialog } from '@/components/vouches/remove-vouch-dialog'
import { VouchAction } from '@/components/vouches/vouch-action'
import { pauseMark } from '@/lib/vouches/my-vouches'
import { MY_VOUCHES_PATH } from '@/lib/vouches/paths'
import type { MyVouch } from '@/lib/vouches/types'
import { day } from '@/app/[locale]/_components/identity-texts'
import { vouchSheetTexts } from '@/app/[locale]/_components/vouch-texts'

// Un aval dado se retira, con el mismo `Sheet` que desde el perfil (FR-017); uno recibido se quita,
// con el `Dialog` de lo que no se deshace (FR-018).
async function rowAction(vouch: MyVouch) {
  if (vouch.direction === 'given') {
    const t = await getTranslations('vouches.slot')
    return (
      <VouchAction
        verb="withdraw"
        publicId={vouch.otherPublicId}
        returnPath={MY_VOUCHES_PATH}
        trigger={{ label: t('withdraw'), variant: 'ghost' }}
        texts={await vouchSheetTexts('withdraw', vouch.otherDisplayName)}
      />
    )
  }
  const t = await getTranslations('vouches')
  const confirm = t('remove.confirm')
  return (
    <RemoveVouchDialog
      publicId={vouch.otherPublicId}
      returnPath={MY_VOUCHES_PATH}
      texts={{
        trigger: t('remove.trigger'),
        title: t('remove.title', { name: vouch.otherDisplayName }),
        body: t('remove.body'),
        confirm,
        cancel: t('remove.cancel'),
        close: t('sheet.close'),
        offline: t('errors.offline', { action: confirm }),
        noResponse: t('errors.no_response', { action: confirm }),
      }}
    />
  )
}

export async function myVouchRow(vouch: MyVouch) {
  const t = await getTranslations('vouches')
  const profile = await getTranslations('profile.public')
  const mark = pauseMark(vouch)
  return (
    <MyVouchRow
      key={vouch.otherPublicId}
      vouch={vouch}
      texts={{
        photoAlt: profile('photo_alt', { name: vouch.otherDisplayName }),
        since: t('mine.since', { date: await day(vouch.givenOn) }),
        paused: mark === null ? null : t(`paused.${mark}`),
      }}
      action={await rowAction(vouch)}
    />
  )
}
