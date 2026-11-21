'use client'

import { deferredPart } from '@/components/ui/deferred-part'

// Para la pantalla del tope, que vive en la misma ruta que el cuestionario: baja solo cuando se
// dibuja. Mientras llega, «Retirar» ocupa su lugar con la espera; si no llega, ahí queda el aviso con
// «Reintentar» y el resto de la lista sigue a la vista (historia #316).
export const LazyWithdrawApplicationDialog = deferredPart(() =>
  import('./withdraw-application-dialog').then((module) => module.WithdrawApplicationDialog),
)
