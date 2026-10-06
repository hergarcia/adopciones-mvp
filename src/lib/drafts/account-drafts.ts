export const PROFILE_DRAFT_KEY = 'profile-draft'
export const PET_DRAFT_KEY = 'pet-draft'
/** Uno por animal: `application-draft:<código>` (historia #63, research R7). */
export const APPLICATION_DRAFT_PREFIX = 'application-draft:'

// Al cerrar sesión por cualquier camino o borrar la cuenta: en un navegador compartido, lo que
// alguien escribió y no guardó le aparecería a la próxima cuenta (FR-024, y FR-041 de la #63).
export function clearAccountDrafts() {
  try {
    const storage = window.localStorage
    const applicationKeys = Array.from(
      { length: storage.length },
      // Stryker disable next-line StringLiteral: equivalente — `key(i)` con i menor que `length` nunca es null, así que el texto de reemplazo no se usa nunca
      (_, index) => storage.key(index) ?? '',
    ).filter((key) => key.startsWith(APPLICATION_DRAFT_PREFIX))
    for (const key of [PROFILE_DRAFT_KEY, PET_DRAFT_KEY, ...applicationKeys]) {
      storage.removeItem(key)
    }
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}
