'use client'

import { drawnOnly } from '@/components/ui/deferred'

// Solo una solicitud activa con una pregunta sin contestar lo dibuja: importado directo, bajaba en
// cada «Mi solicitud», también en la del seguimiento del día 30, que nunca lo muestra (historia #342).
export const LazyAnswerQuestionForm = drawnOnly(() =>
  import('./answer-question-form').then((module) => module.AnswerQuestionForm),
)
