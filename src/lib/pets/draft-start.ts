// «Publicación empezada» sale con el primer dato o la primera foto en un formulario vacío, y no
// cuando arranca con lo escrito recuperado, que es la misma carga que ya empezó (FR-028).
export function shouldTrackStart(state: { startedAt: number | null; restored: boolean }): boolean {
  return state.startedAt === null && !state.restored
}
