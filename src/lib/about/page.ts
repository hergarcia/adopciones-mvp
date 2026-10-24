import { FOLLOW_UP_DAYS } from '@/lib/follow-ups/rules'

export const ABOUT_PATH = '/nosotros'

/** El día en que cambió el texto de «Nosotros», `YYYY-MM-DD`: se cambia a mano con el texto (FR-015). */
export const ABOUT_UPDATED_ON = '2026-10-24'

/** Las partes de la página en su orden, con cuántos párrafos y renglones tiene cada una en `about.sections`. */
export const ABOUT_SECTIONS = [
  { id: 'why', paragraphs: 3, items: 0 },
  { id: 'different', paragraphs: 1, items: 5 },
  { id: 'promise', paragraphs: 2, items: 0 },
] as const

/**
 * La parte de la marca: la dibuja `BrandMeaning` y va después de la que cuenta cómo se verifica, porque
 * el dibujo explica eso mismo. Las acepciones de «huella» son las que el dibujo no cuenta solo; los
 * párrafos, los del cierre.
 */
export const ABOUT_BRAND = { id: 'brand', after: 'different', senses: 2, closing: 2 } as const

/** Las partes de texto con la de la marca en su lugar, en el orden de `ABOUT_SECTIONS`. */
export function withBrand<T>(sections: readonly T[], brand: T): T[] {
  const at = ABOUT_SECTIONS.findIndex((section) => section.id === ABOUT_BRAND.after) + 1
  return [...sections.slice(0, at), brand, ...sections.slice(at)]
}

// Las cifras que dice la página, desde la regla que el sitio cumple: si cambia, la página también.
export const ABOUT_FACTS = { followUpDays: FOLLOW_UP_DAYS } as const
