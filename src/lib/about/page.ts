import { FOLLOW_UP_DAYS } from '@/lib/follow-ups/rules'

export const ABOUT_PATH = '/nosotros'

/** El día en que cambió el texto de «Nosotros», `YYYY-MM-DD`: se cambia a mano con el texto (FR-015). */
export const ABOUT_UPDATED_ON = '2026-10-21'

/** Las partes de la página en su orden, con cuántos párrafos y renglones tiene cada una en `about.sections`. */
export const ABOUT_SECTIONS = [
  { id: 'why', paragraphs: 3, items: 0 },
  { id: 'different', paragraphs: 1, items: 5 },
  { id: 'promise', paragraphs: 2, items: 0 },
] as const

export type AboutSection = (typeof ABOUT_SECTIONS)[number]

// Las cifras que dice la página, desde la regla que el sitio cumple: si cambia, la página también.
export const ABOUT_FACTS = { followUpDays: FOLLOW_UP_DAYS } as const
