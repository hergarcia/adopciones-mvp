import type { PetState } from '@/lib/pets/types'

export type ApplyActionKind = 'apply' | 'view_mine' | 'rejected' | 'none'

// Qué ofrece la ficha (FR-001): «Quiero adoptar», también sin sesión y también a la bloqueada, que
// no tiene que enterarse; «Ver mi solicitud» a quien ya tiene una activa; nada a quien lo publicó
// (sigue «Editar») ni en una adoptada, que tiene su propio camino al listado. A quien ya rechazaron
// por ese animal, donde estaría «Quiero adoptar», que no fue aceptada: no lo vuelve a pedir (FR-023).
export function applyActionKind(pet: {
  isOwner: boolean
  state: PetState
  myActiveId: string | null
  myRejected: boolean
}): ApplyActionKind {
  if (pet.isOwner || pet.state === 'adopted') return 'none'
  if (pet.myActiveId !== null) return 'view_mine'
  if (pet.state !== 'available' && pet.state !== 'in_process') return 'none'
  return pet.myRejected ? 'rejected' : 'apply'
}
