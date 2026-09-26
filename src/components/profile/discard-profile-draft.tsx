'use client'

import { useEffect } from 'react'
import { clearProfileDraft } from '@/hooks/use-profile-draft'

// A «Mi perfil» llega quien ya terminó el alta, también quien recargó el alta después de un
// guardado que llegó sin respuesta: lo que quedó en el borrador ya no es de nadie (FR-016).
export function DiscardProfileDraft() {
  useEffect(clearProfileDraft, [])
  return null
}
