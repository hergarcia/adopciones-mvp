'use client'

import { deferredPart } from '@/components/ui/deferred-part'
import { firstAfterOpen } from '@/hooks/after-open'

// Más que esto y la persona ya la da por perdida: deja «Reintentar», como las hojas (historia #318).
const WAIT_MS = 10_000

// La encuesta baja apenas abre la pantalla, primero entre lo de después de abrir, y hasta que llega su
// lugar lo guarda la espera que dibujó el servidor, del mismo alto: lo de abajo no se corre. Si no
// llega en 10 s, ahí queda el aviso con «Reintentar» y nunca la pantalla de error (historia #352).
export const LazySurveyCard = deferredPart(() =>
  Promise.race([
    firstAfterOpen(() => import('./survey-card')),
    new Promise<never>((_, reject) => {
      setTimeout(reject, WAIT_MS)
    }),
  ]).then((module) => module.SurveyCard),
)
