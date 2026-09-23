'use client'

import { useId } from 'react'

// El foco vuelve al campo después de un error, así el lector de pantalla lo anuncia y se puede
// corregir sin buscarlo. Por id y no por ref: `Input` no reenvía la ref.
export function useFieldFocus(): [id: string, focus: () => void] {
  const id = useId()
  return [id, () => document.getElementById(id)?.focus()]
}
