import { getTranslations } from 'next-intl/server'
import { handoverLineTexts } from '@/components/adoptions/handover-line-texts'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import type { LitterStatusAction, MyLitter } from '@/lib/litters/types'
import type { LitterStatusTexts } from './litter-status-actions'
import type { RepublishLitterTexts } from './republish-litter-dialog'

function byAction(make: (action: LitterStatusAction) => string) {
  return {
    pause: make('pause'),
    resume: make('resume'),
    renew: make('renew'),
    republish: make('republish'),
  }
}

// Qué crías de una camada adoptada pueden volver a ofrecerse, con a quién se dio cada una y, si fue a
// una persona, que esa adopción termina (FR-006, #67).
async function republishTexts(
  litter: Pick<MyLitter, 'state' | 'young'>,
  adoptions: ReadonlyMap<string, PetAdoptionSummary>,
): Promise<RepublishLitterTexts | null> {
  if (litter.state !== 'adopted') return null
  const t = await getTranslations('litters.republish')
  const young = await Promise.all(
    litter.young.map(async (one) => {
      const adoption = adoptions.get(one.id)
      const line = await handoverLineTexts(adoption, one.sex)
      const person = adoption?.endsPerson === true ? adoption.adopterName : null
      return {
        id: one.id,
        name: one.name,
        detail: line?.main ?? null,
        ends: person === null ? null : t('ends', { name: one.name, person }),
      }
    }),
  )
  return {
    title: t('title'),
    help: t('help'),
    confirm: t('confirm'),
    cancel: t('cancel'),
    close: t('close'),
    young,
  }
}

// Los textos de las acciones de la camada entera, con su nombre, armados en el servidor: al navegador
// no le baja `messages/es.json`. «Camada» es femenino. Borrarla dice cuántas solicitudes abiertas se
// cierran (FR-035).
export async function litterStatusTexts(
  litter: Pick<MyLitter, 'name' | 'state' | 'young'>,
  options: {
    openApplications: number
    adoptions: ReadonlyMap<string, PetAdoptionSummary>
  },
): Promise<LitterStatusTexts> {
  const [t, pets, toast, republish] = await Promise.all([
    getTranslations('litters.status'),
    getTranslations('pets.status'),
    getTranslations('common.toast'),
    republishTexts(litter, options.adoptions),
  ])
  const actions = byAction((action) => t(`actions.${action}`))
  const naming = (key: 'errors.offline' | 'errors.failed') =>
    byAction((action) => t(key, { action: actions[action] }))
  const confirmDelete = t('delete.confirm')
  return {
    name: litter.name,
    more: t('more'),
    close: pets('close'),
    toastClose: toast('close'),
    actions,
    failures: { offline: naming('errors.offline'), no_response: naming('errors.failed') },
    refusals: {
      changed: t('litter_errors.changed'),
      taken_down: t('errors.taken_down'),
      not_found: t('litter_errors.not_found'),
    },
    gate: {
      title: pets('gate.title'),
      body: t('gate_body', { name: litter.name }),
      action: pets('gate.action'),
      stay: pets('gate.stay'),
      close: pets('gate.close'),
    },
    delete: {
      trigger: t('delete.trigger'),
      title: t('delete.title', { name: litter.name }),
      body: t('delete.body', { count: options.openApplications }),
      confirm: confirmDelete,
      cancel: t('delete.cancel'),
      close: t('delete.close'),
      offline: t('errors.offline', { action: confirmDelete }),
      noResponse: t('errors.failed', { action: confirmDelete }),
    },
    republish,
  }
}
