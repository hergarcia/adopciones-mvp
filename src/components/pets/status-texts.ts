import { getTranslations } from 'next-intl/server'
import type { Sex } from '@/lib/pets/options'
import type { PetStatusAction } from '@/lib/pets/types'
import type { PetStatusTexts } from './pet-status-actions'

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
  const failures = { offline: t('errors.offline'), no_response: t('errors.failed') }
  return {
    name: pet.name,
    more: t('more'),
    close: t('close'),
    toastClose: toast('close'),
    retry: t('retry'),
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
      confirm: t('delete.confirm'),
      cancel: t('delete.cancel'),
      close: t('delete.close'),
      offline: failures.offline,
      noResponse: failures.no_response,
    },
  }
}
