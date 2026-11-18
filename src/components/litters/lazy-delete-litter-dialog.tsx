'use client'

import { drawnOnly } from '@/components/ui/deferred'

// Para la camada dada de baja, la única que muestra «Borrar» sin abrir «Más acciones».
export const LazyDeleteLitterDialog = drawnOnly(() =>
  import('./delete-litter-dialog').then((module) => module.DeleteLitterDialog),
)
