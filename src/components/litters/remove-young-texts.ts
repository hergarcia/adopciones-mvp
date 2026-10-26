import { getTranslations } from 'next-intl/server'
import type { DeletePetTexts } from '@/components/pets/delete-pet-dialog'

export type RemoveYoungTexts = DeletePetTexts & { takenDown: string }

// La confirmación de quitar una cría, armada en el servidor: cuántas de sus solicitudes abiertas se
// cierran (FR-033) y, si es la última, que la camada se borra entera (FR-035).
export async function removeYoungTexts(
  young: { name: string },
  removal: { openApplications: number; isLast: boolean },
): Promise<RemoveYoungTexts> {
  const [t, status] = await Promise.all([
    getTranslations('litters.remove_young'),
    getTranslations('litters.status'),
  ])
  const count = removal.openApplications
  const confirm = removal.isLast ? t('last_confirm') : t('confirm')
  return {
    trigger: t('trigger'),
    title: t('title', { name: young.name }),
    body: removal.isLast ? t('last_body', { count }) : t('body', { count, name: young.name }),
    confirm,
    cancel: t('cancel'),
    close: t('close'),
    offline: status('errors.offline', { action: confirm }),
    noResponse: status('errors.failed', { action: confirm }),
    takenDown: status('errors.taken_down'),
  }
}
