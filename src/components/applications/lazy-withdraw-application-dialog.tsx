'use client'

import { drawnOnly } from '@/components/ui/deferred'

// Para la pantalla del tope, que vive en la misma ruta que el cuestionario.
export const LazyWithdrawApplicationDialog = drawnOnly(() =>
  import('./withdraw-application-dialog').then((module) => module.WithdrawApplicationDialog),
)
