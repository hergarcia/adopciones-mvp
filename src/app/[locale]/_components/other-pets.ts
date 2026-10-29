import { hasOtherPets } from '@/lib/pets/other-pets'
import type { Publisher } from '@/lib/pets/types'
import { listProfilePetCodes } from '@/lib/supabase/queries/listed-pets'

// Si no se puede saber, la nota queda como hoy y la ficha se ve entera, sin aviso (historia #242,
// criterio 5): la invitación es un extra y nunca puede tirar la ficha.
export async function publisherHasOtherPets(
  publisher: Publisher,
  currentCode: string,
): Promise<boolean> {
  if (publisher.publicId === null) return false
  try {
    return hasOtherPets(await listProfilePetCodes(publisher.publicId), currentCode)
  } catch {
    return false
  }
}
