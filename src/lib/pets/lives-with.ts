import { GOOD_WITH, type GoodWith } from './options'
import type { Pet } from './types'

export type Companion = 'kids' | 'dogs' | 'cats'

// Con quién convive, juntado por respuesta y en el orden sí, no, no se sabe (FR-006): «Convive con
// niños y gatos. Con perros, no se sabe.» y no tres frases que repiten lo mismo. Cada grupo lleva a
// los de esa respuesta en el orden de siempre: niños, perros, gatos.
export function livesWith(
  pet: Pick<Pet, 'goodWithKids' | 'goodWithDogs' | 'goodWithCats'>,
): { answer: GoodWith; who: Companion[] }[] {
  const answers: Record<Companion, GoodWith> = {
    kids: pet.goodWithKids,
    dogs: pet.goodWithDogs,
    cats: pet.goodWithCats,
  }
  const companions: Companion[] = ['kids', 'dogs', 'cats']
  return GOOD_WITH.map((answer) => ({
    answer,
    who: companions.filter((companion) => answers[companion] === answer),
  })).filter((group) => group.who.length > 0)
}
