'use client'

import { drawnOnly } from '@/components/ui/deferred'

// Para la card de un animal dado de baja, la única que muestra «Borrar» sin abrir «Más acciones».
export const LazyDeletePetDialog = drawnOnly(() =>
  import('./delete-pet-dialog').then((module) => module.DeletePetDialog),
)
