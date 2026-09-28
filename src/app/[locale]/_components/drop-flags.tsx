'use client'

import { useDropFlags } from '@/hooks/use-drop-flags'

// Para una marca sin aviso (`aval=cambio`): el lugar de avalar ya dice el motivo, pero la marca no
// puede quedar en el enlace que la persona copie.
export function DropFlags() {
  useDropFlags()
  return null
}
