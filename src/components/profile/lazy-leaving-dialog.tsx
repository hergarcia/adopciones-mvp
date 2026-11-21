'use client'

import { deferredUntil } from '@/components/ui/deferred'

// El guardia y su aviso hacen falta recién cuando hay algo que perder: bajan después de abrir y se
// montan con el primer cambio (historia #326).
export const LazyProfileLeavingDialog = deferredUntil(() =>
  import('./leaving-dialog').then((module) => module.ProfileLeavingDialog),
)
