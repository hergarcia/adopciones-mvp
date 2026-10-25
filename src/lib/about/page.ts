import { FOLLOW_UP_DAYS } from '@/lib/follow-ups/rules'

export const ABOUT_PATH = '/nosotros'

/** El día en que cambió el texto de «Nosotros», `YYYY-MM-DD`: se cambia a mano con el texto (FR-015). */
export const ABOUT_UPDATED_ON = '2026-10-25'

/**
 * Las partes de la página en su orden, con cuántos párrafos y renglones tiene cada una en
 * `about.sections`, y cuál cierra con el enlace a los niveles: la que nombra la chapita.
 */
export const ABOUT_SECTIONS = [
  { id: 'why', paragraphs: 3, items: 0, levels: false },
  { id: 'different', paragraphs: 0, items: 5, levels: true },
  { id: 'promise', paragraphs: 2, items: 0, levels: false },
] as const

/**
 * La parte de la marca: la dibuja `BrandMeaning` y va después de la que cuenta cómo se verifica, porque
 * el dibujo explica eso mismo.
 */
export const ABOUT_BRAND = { id: 'brand', after: 'different' } as const

/** Las partes de texto con la de la marca en su lugar, en el orden de `ABOUT_SECTIONS`. */
export function withBrand<T>(sections: readonly T[], brand: T): T[] {
  const at = ABOUT_SECTIONS.findIndex((section) => section.id === ABOUT_BRAND.after) + 1
  return [...sections.slice(0, at), brand, ...sections.slice(at)]
}

// Las cifras que dice la página, desde la regla que el sitio cumple: si cambia, la página también.
export const ABOUT_FACTS = { followUpDays: FOLLOW_UP_DAYS } as const
