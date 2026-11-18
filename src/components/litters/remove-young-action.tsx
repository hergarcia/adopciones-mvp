'use client'

import { laterDialog } from '@/components/forms/later-dialog'
import type { RemoveYoungTexts } from './remove-young-texts'

// Quitar una cría: los botones y lo que quita llegan después de abrir, como borrar (historia #316).
// Pesaban en cada «Mis animales» con una camada.
export const RemoveYoungAction = laterDialog<{
  petId: string
  returnPath: string
  texts: RemoveYoungTexts
}>(() => import('./remove-young-body').then((module) => module.RemoveYoungBody))
