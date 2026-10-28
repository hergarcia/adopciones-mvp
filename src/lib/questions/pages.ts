import { LISTING_PATH, PUBLISH_PATH } from '@/lib/pets/paths'
import type { PetState } from '@/lib/pets/types'
import { IDENTITY_PATH } from '@/lib/verification/paths'

export type QuestionGroup = 'giver' | 'adopter' | 'everyone'
export type QuestionAction = 'verify_identity' | 'publish_pet' | 'browse_pets'
export type SharedBlock = 'levels' | 'identity_images' | 'commitment'
/**
 * Lo que se repasa no va en párrafos sueltos: `numbered` es una secuencia, en voz de afiche;
 * `checks`, lo que se mira o se hace, con el tilde; `taped`, una nota pegada con lo que hay que
 * reconocer, sin orden.
 */
export type QuestionListForm = 'numbered' | 'checks' | 'taped'

/** La etiqueta es `questions.sources.<id>`; la dirección pasa `isOfficialSource`. */
export type OfficialSource = { id: string; url: string }

export type QuestionSection = {
  /** `questions.<slug>.sections.<id>.title` y sus párrafos `p1…pN`. */
  id: string
  /** El fragmento de la dirección que lleva directo a la sección (`#pausado`). */
  anchor?: string
  /**
   * La sección de un estado de un animal: su título son las palabras del sello en las dos formas
   * («Pausado», «Pausada»), las de las pantallas, y no lleva `title` propio.
   */
  state?: PetState
  paragraphs: number
  /** Después de los párrafos: sus renglones son `…sections.<id>.i1…iN`. */
  list?: { form: QuestionListForm; items: number }
  sources?: readonly OfficialSource[]
}

const SOURCES = {
  decree: { id: 'decreto_57_2023', url: 'https://www.impo.com.uy/bases/decretos/57-2023/3' },
  law: { id: 'ley_19889_386', url: 'https://www.impo.com.uy/bases/leyes/19889-2020/386' },
} as const satisfies Record<string, OfficialSource>

// El texto vive en messages/es.json; acá la estructura que las reglas de la spec necesitan para
// comprobarse sin leer JSX (research R1 de la #8). `updatedOn` es el día de Uruguay en que cambió el
// texto de la página por última vez: lo cambia a mano quien lo cambia.
export const QUESTION_PAGES = [
  {
    slug: 'como-publico-un-animal',
    group: 'giver',
    action: 'publish_pet',
    related: ['que-significa-cada-estado', 'antes-de-entregar'],
    updatedOn: '2026-10-25',
    sections: [
      { id: 'steps', paragraphs: 0, list: { form: 'numbered', items: 7 } },
      { id: 'description', paragraphs: 2 },
      { id: 'after', paragraphs: 3 },
    ],
  },
  {
    slug: 'como-pido-un-animal',
    group: 'adopter',
    action: 'browse_pets',
    related: ['como-se-verifica', 'reconocer-una-estafa'],
    updatedOn: '2026-10-25',
    sections: [
      { id: 'steps', paragraphs: 0, list: { form: 'numbered', items: 5 } },
      { id: 'waiting', paragraphs: 2 },
      { id: 'accepted', paragraphs: 2 },
    ],
  },
  {
    slug: 'como-se-verifica',
    group: 'everyone',
    action: 'verify_identity',
    related: ['antes-de-entregar', 'reconocer-una-estafa'],
    updatedOn: '2026-10-28',
    sections: [
      { id: 'shown', paragraphs: 3 },
      { id: 'review', paragraphs: 2 },
    ],
    shared: ['levels', 'identity_images'],
  },
  {
    slug: 'que-significa-cada-estado',
    group: 'everyone',
    action: 'publish_pet',
    related: ['como-publico-un-animal', 'como-pido-un-animal'],
    updatedOn: '2026-10-25',
    sections: [
      { id: 'available', anchor: 'disponible', state: 'available', paragraphs: 2 },
      { id: 'in_process', anchor: 'en-proceso', state: 'in_process', paragraphs: 3 },
      { id: 'paused', anchor: 'pausado', state: 'paused', paragraphs: 3 },
      { id: 'adopted', anchor: 'adoptado', state: 'adopted', paragraphs: 3 },
      { id: 'expired', anchor: 'vencido', state: 'expired', paragraphs: 2 },
      { id: 'taken_down', anchor: 'dado-de-baja', state: 'taken_down', paragraphs: 3 },
      { id: 'renew', anchor: 'renovar', paragraphs: 4 },
    ],
  },
  {
    slug: 'antes-de-entregar',
    group: 'giver',
    action: 'publish_pet',
    related: ['que-exige-uruguay', 'como-se-verifica'],
    updatedOn: '2026-10-09',
    sections: [
      { id: 'asked', paragraphs: 1, list: { form: 'numbered', items: 3 } },
      { id: 'level', paragraphs: 3 },
      { id: 'questionnaire', paragraphs: 2 },
      { id: 'profile', paragraphs: 1, list: { form: 'checks', items: 4 } },
      { id: 'after', paragraphs: 4 },
    ],
  },
  {
    slug: 'que-exige-uruguay',
    group: 'giver',
    action: 'publish_pet',
    related: ['antes-de-entregar', 'como-se-verifica'],
    updatedOn: '2026-10-28',
    sections: [
      { id: 'neuter', paragraphs: 3, sources: [SOURCES.decree, SOURCES.law] },
      { id: 'renac', paragraphs: 3, sources: [SOURCES.decree] },
      { id: 'disclaimer', paragraphs: 2 },
    ],
  },
  {
    slug: 'reconocer-una-estafa',
    group: 'adopter',
    action: 'browse_pets',
    related: ['compromiso-y-seguimiento', 'como-se-verifica'],
    updatedOn: '2026-10-09',
    sections: [
      { id: 'signals', paragraphs: 0, list: { form: 'taped', items: 3 } },
      { id: 'protect', paragraphs: 0, list: { form: 'checks', items: 4 } },
      { id: 'report', paragraphs: 2 },
    ],
  },
  {
    slug: 'compromiso-y-seguimiento',
    group: 'adopter',
    action: 'browse_pets',
    related: ['reconocer-una-estafa', 'como-se-verifica'],
    updatedOn: '2026-10-28',
    sections: [
      { id: 'word', paragraphs: 4 },
      { id: 'follow_up', paragraphs: 3 },
    ],
    shared: ['commitment'],
  },
] as const satisfies readonly {
  slug: string
  group: QuestionGroup
  action: QuestionAction
  related: readonly string[]
  updatedOn: string
  sections: readonly QuestionSection[]
  shared?: readonly SharedBlock[]
}[]

export type QuestionSlug = (typeof QUESTION_PAGES)[number]['slug']
export type QuestionPage = (typeof QUESTION_PAGES)[number]

/** Las que se muestran. Retirar una es sacarla del registro: pasa a verse como una que no existe. */
export const PUBLISHED: readonly QuestionSlug[] = QUESTION_PAGES.map((page) => page.slug)

export const GROUP_ORDER: readonly QuestionGroup[] = ['giver', 'adopter', 'everyone']

export const ACTION_PATH: Record<QuestionAction, string> = {
  verify_identity: IDENTITY_PATH,
  publish_pet: PUBLISH_PATH,
  browse_pets: LISTING_PATH,
}

/** La página publicada de ese slug exacto, o null: otras mayúsculas o una palabra cambiada no son. */
export function questionBySlug(slug: string): QuestionPage | null {
  return QUESTION_PAGES.find((page) => page.slug === slug) ?? null
}
