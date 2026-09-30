'use client'

import { useSyncExternalStore } from 'react'
import { readShareDevice } from '@/lib/share/device'
import { shareMode } from '@/lib/share/share-mode'

const noChanges = () => () => {}

const opensShareSheet = () => shareMode(readShareDevice()) === 'share'

// En el servidor no se sabe con qué equipo se va a abrir: el HTML dice copiar.
export function useCanShare(): boolean {
  return useSyncExternalStore(noChanges, opensShareSheet, () => false)
}
