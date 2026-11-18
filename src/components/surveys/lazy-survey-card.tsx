'use client'

import { drawnOnly } from '@/components/ui/deferred'

export const LazySurveyCard = drawnOnly(() =>
  import('./survey-card').then((module) => module.SurveyCard),
)
