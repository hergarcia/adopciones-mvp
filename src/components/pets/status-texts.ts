import { getTranslations } from 'next-intl/server'
import type { Sex } from '@/lib/pets/options'
import type { PetStatusAction } from '@/lib/pets/types'
import type { PetStatusTexts } from './pet-status-actions'

function byAction(make: (action: PetStatusAction) => string): Record<PetStatusAction, string> {
  return {
    mark_in_process: make('mark_in_process'),
    mark_available: make('mark_available'),
    pause: make('pause'),
    resume: make('resume'),
    mark_adopted: make('mark_adopted'),
    renew: make('renew'),
    republish: make('republish'),
  }
}

// Los textos de las acciones de un animal, con su nombre y concordados con su sexo: los usan cada
// card de «Mis animales» y la pantalla de un animal. Al navegador no le baja `messages/es.json`.
export async function petStatusTexts(pet: { name: string; sex: Sex }): Promise<PetStatusTexts> {
  const [t, toast] = await Promise.all([
    getTranslations('pets.status'),
    getTranslations('common.toast'),
  ])
  const values = { name: pet.name, sex: pet.sex }
  const actions: Record<PetStatusAction, string> = {
    mark_in_process: t('actions.mark_in_process'),
    mark_available: t('actions.mark_available'),
    pause: t('actions.pause'),
    resume: t('actions.resume'),
    mark_adopted: t('actions.mark_adopted', values),
    renew: t('actions.renew'),
    republish: t('actions.republish'),
  }
  // El aviso de lo que no llegó nombra el botón que se tocó, que es el que se vuelve a tocar.
  const naming = (key: 'errors.offline' | 'errors.failed') =>
    byAction((action) => t(key, { action: actions[action] }))
  const failures = { offline: naming('errors.offline'), no_response: naming('errors.failed') }
  const confirmDelete = t('delete.confirm')
  return {
    name: pet.name,
    more: t('more'),
    close: t('close'),
    toastClose: toast('close'),
    actions,
    failures,
    refusals: {
      changed: t('errors.changed', values),
      taken_down: t('errors.taken_down', values),
      not_found: t('errors.not_found'),
    },
    gate: {
      title: t('gate.title'),
      body: t('gate.body', values),
      action: t('gate.action'),
      stay: t('gate.stay'),
      close: t('gate.close'),
    },
    delete: {
      trigger: t('delete.trigger'),
      title: t('delete.title', values),
      body: t('delete.body'),
      confirm: confirmDelete,
      cancel: t('delete.cancel'),
      close: t('delete.close'),
      offline: t('errors.offline', { action: confirmDelete }),
      noResponse: t('errors.failed', { action: confirmDelete }),
    },
  }
}
