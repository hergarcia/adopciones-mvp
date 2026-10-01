import { getTranslations } from 'next-intl/server'
import type { ShareTexts } from './share-button'

// Los textos de «Compartir» de un animal: los usan la ficha y cada animal de «Mis animales». El
// título es la misma clave que el `<title>` y la vista previa: una sola forma de nombrarlo (FR-011).
export async function shareTexts(name: string): Promise<ShareTexts> {
  const t = await getTranslations('pets.share')
  return {
    action: t('action'),
    title: t('title', { name }),
    copied: t('copied'),
    manualTitle: t('manual_title'),
    manualBody: t('manual_body'),
    linkLabel: t('link_label'),
    close: t('close'),
  }
}
