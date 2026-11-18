'use client'

import { laterDialog } from '@/components/forms/later-dialog'
import type { DeletionTarget } from '@/components/pets/delete-pet-dialog'

// Borrar la camada entera es para siempre, con sus crías y sus fotos (FR-034, FR-035): se confirma
// diciendo cuántas solicitudes se cierran y, si queda una cría sin adoptar, pregunta por qué una sola
// vez por la camada (historia #263).
export const DeleteLitterDialog = laterDialog<DeletionTarget>(() =>
  import('./delete-litter-body').then((module) => module.DeleteLitterBody),
)
