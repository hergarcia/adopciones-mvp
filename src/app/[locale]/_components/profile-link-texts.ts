import { getTranslations } from 'next-intl/server'
import type { CopyProfileLinkTexts } from '@/components/profile/copy-profile-link'

export async function copyProfileLinkTexts(): Promise<CopyProfileLinkTexts> {
  const t = await getTranslations('profile.public')
  return { copy: t('copy'), share: t('share'), copied: t('copied'), manual: t('copy_manual') }
}
