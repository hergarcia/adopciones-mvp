export const PROFILE_DRAFT_KEY = 'profile-draft'
export const PET_DRAFT_KEY = 'pet-draft'

// Al cerrar sesión por cualquier camino o borrar la cuenta: en un navegador compartido, lo que
// alguien escribió y no guardó le aparecería a la próxima cuenta (FR-024).
export function clearAccountDrafts() {
  try {
    window.localStorage.removeItem(PROFILE_DRAFT_KEY)
    window.localStorage.removeItem(PET_DRAFT_KEY)
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}
