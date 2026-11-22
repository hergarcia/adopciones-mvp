'use client'

import { deferredPart } from '@/components/ui/deferred-part'
import { firstAfterOpen } from '@/hooks/after-open'

// Las fotos, el texto y «Contar cómo va» bajan apenas abre «Mi solicitud», antes que lo demás que
// espera a abrir: el título y la ayuda ya vinieron del servidor y la espera guarda su lugar, así el
// compromiso de abajo no se corre cuando llegan; si no llegan, ahí queda el aviso con «Reintentar»
// (historia #342).
export const LazyFollowUpForm = deferredPart(() =>
  firstAfterOpen(() => import('./follow-up-form')).then((module) => module.FollowUpForm),
)
