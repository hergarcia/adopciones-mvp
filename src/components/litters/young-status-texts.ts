import { getTranslations } from 'next-intl/server'
import { endAdoptionTexts } from '@/components/adoptions/handover-line-texts'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import type { YoungStatusAction } from '@/lib/litters/types'
import type { YoungStatusTexts } from './young-status-actions'

// Los textos de las acciones de una cría, con su nombre, armados en el servidor: al navegador no le
// baja `messages/es.json`. «Marcar disponible» de una adoptada a una persona pide confirmar que la
// adopción termina (FR-007), con el cuerpo de volver a publicar un animal adoptado.
export async function youngStatusTexts(
  young: { name: string },
  adoption: PetAdoptionSummary | undefined,
): Promise<YoungStatusTexts> {
  const [t, pets, toast, end] = await Promise.all([
    getTranslations('litters.status'),
    getTranslations('pets.status'),
    getTranslations('common.toast'),
    endAdoptionTexts(young, adoption),
  ])
  const actions: Record<YoungStatusAction, string> = {
    mark_in_process: t('actions.mark_in_process'),
    mark_available: t('actions.mark_available'),
    mark_adopted: t('actions.mark_adopted'),
  }
  const naming = (key: 'errors.offline' | 'errors.failed') => ({
    mark_in_process: t(key, { action: actions.mark_in_process }),
    mark_available: t(key, { action: actions.mark_available }),
    mark_adopted: t(key, { action: actions.mark_adopted }),
  })
  return {
    name: young.name,
    more: t('more'),
    close: pets('close'),
    toastClose: toast('close'),
    actions,
    failures: { offline: naming('errors.offline'), no_response: naming('errors.failed') },
    refusals: {
      changed: t('errors.changed', { name: young.name }),
      taken_down: t('errors.taken_down'),
      not_found: t('errors.not_found'),
    },
    gate: {
      title: pets('gate.title'),
      body: pets('gate.body', { name: young.name, sex: 'female' }),
      action: pets('gate.action'),
      stay: pets('gate.stay'),
      close: pets('gate.close'),
    },
    endAdoption:
      end === null
        ? null
        : {
            ...end,
            title: t('end.title', { name: young.name }),
            confirm: t('end.confirm'),
          },
  }
}
