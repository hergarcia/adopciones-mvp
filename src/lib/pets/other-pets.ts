// La invitación a ver los otros animales de quien publicó (historia #242): aparece con al menos otra
// publicación a la vista en su perfil. La que se está mirando no cuenta, y en la ficha de una camada
// o de una cría la que se mira es la camada, que en el perfil es una sola tarjeta.
export function hasOtherPets(shownCodes: readonly string[], currentCode: string): boolean {
  return shownCodes.some((code) => code !== currentCode)
}
