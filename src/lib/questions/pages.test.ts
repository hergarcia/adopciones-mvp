// Covers: FR-001, FR-002, FR-003, FR-009, FR-011, FR-012, FR-013, FR-015, SC-001, SC-002, SC-003,
// SC-004 (las reglas de contenido de la spec, sobre el registro y messages/es.json)
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseDay } from './dates'
import { QUESTION_FACTS } from './facts'
import {
  ACTION_PATH,
  GROUP_ORDER,
  PUBLISHED,
  QUESTION_PAGES,
  questionBySlug,
  type OfficialSource,
} from './pages'
import { sentenceCount } from './sentences'
import { isOfficialSource } from './sources'

type Tree = { [key: string]: string | Tree }
const messages: Tree = JSON.parse(readFileSync('messages/es.json', 'utf8'))

function at(path: string): string | Tree | undefined {
  return path
    .split('.')
    .reduce<string | Tree | undefined>(
      (node, part) => (typeof node === 'object' ? node[part] : undefined),
      messages,
    )
}

function text(path: string): string {
  const value = at(path)
  if (typeof value !== 'string') throw new Error(`Falta ${path} en messages/es.json`)
  return value.replaceAll(/\{(\w+)\}/gu, (_, name: keyof typeof QUESTION_FACTS) =>
    String(QUESTION_FACTS[name]),
  )
}

function leaves(node: string | Tree | undefined, prefix: string): string[] {
  if (typeof node !== 'object') return [prefix]
  return Object.entries(node).flatMap(([key, child]) => leaves(child, `${prefix}.${key}`))
}

const SLUGS = [
  'como-se-verifica',
  'antes-de-entregar',
  'que-exige-uruguay',
  'reconocer-una-estafa',
  'compromiso-y-seguimiento',
] as const

// Escrita a mano a propósito: si el registro cambia, este test lo dice (data-model de la #8).
const EXPECTED = {
  'como-se-verifica': {
    group: 'everyone',
    action: 'verify_identity',
    related: ['antes-de-entregar', 'reconocer-una-estafa'],
    shared: ['levels', 'identity_images'],
  },
  'antes-de-entregar': {
    group: 'giver',
    action: 'publish_pet',
    related: ['que-exige-uruguay', 'como-se-verifica'],
    shared: [],
  },
  'que-exige-uruguay': {
    group: 'giver',
    action: 'publish_pet',
    related: ['antes-de-entregar', 'como-se-verifica'],
    shared: [],
  },
  'reconocer-una-estafa': {
    group: 'adopter',
    action: 'browse_pets',
    related: ['compromiso-y-seguimiento', 'como-se-verifica'],
    shared: [],
  },
  'compromiso-y-seguimiento': {
    group: 'adopter',
    action: 'browse_pets',
    related: ['reconocer-una-estafa', 'como-se-verifica'],
    shared: ['commitment'],
  },
}

describe('questionBySlug', () => {
  it.each(SLUGS.map((slug) => [slug]))('encuentra %s', (slug) => {
    expect(questionBySlug(slug)?.slug).toBe(slug)
  })

  it.each([
    ['Antes-De-Entregar'],
    ['antes-de-entregar '],
    [''],
    ['antes-de-entrega'],
    ['como-se-verifica/x'],
  ])('una dirección casi igual no es una página: «%s»', (slug) => {
    expect(questionBySlug(slug)).toBeNull()
  })
})

describe('el registro', () => {
  it('tiene las cinco, publicadas, con su grupo, su acción, sus relacionadas y lo compartido', () => {
    expect(PUBLISHED).toEqual(SLUGS)
    expect(
      Object.fromEntries(
        QUESTION_PAGES.map((page) => [
          page.slug,
          {
            group: page.group,
            action: page.action,
            related: page.related,
            shared: 'shared' in page ? page.shared : [],
          },
        ]),
      ),
    ).toEqual(EXPECTED)
  })

  it('los grupos y las acciones del índice y del cierre', () => {
    expect(GROUP_ORDER).toEqual(['giver', 'adopter', 'everyone'])
    expect(ACTION_PATH).toEqual({
      verify_identity: '/verificar-identidad',
      publish_pet: '/mis-animales/publicar',
      browse_pets: '/animales',
    })
  })
})

describe.each(QUESTION_PAGES.map((page) => [page.slug, page] as const))('%s', (slug, page) => {
  it('la respuesta tiene de 1 a 3 oraciones y entra arriba del pliegue', () => {
    const answer = text(`questions.${slug}.answer`)
    expect(sentenceCount(answer)).toBeGreaterThanOrEqual(1)
    expect(sentenceCount(answer)).toBeLessThanOrEqual(3)
    expect(answer.length).toBeLessThanOrEqual(400)
  })

  it('el título es una pregunta corta y la tarjeta entra en 160', () => {
    const title = text(`questions.${slug}.title`)
    expect(title.length).toBeLessThanOrEqual(80)
    expect(title.startsWith('¿')).toBe(true)
    expect(title.endsWith('?')).toBe(true)
    expect(text(`questions.${slug}.card`).length).toBeLessThanOrEqual(160)
  })

  it('la fecha es un día válido y no del futuro', () => {
    expect(parseDay(page.updatedOn).getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('cada fuente es oficial y tiene su etiqueta', () => {
    const sources = page.sections.flatMap((section): readonly OfficialSource[] =>
      'sources' in section ? section.sources : [],
    )
    expect(sources.filter((source) => !isOfficialSource(source.url))).toEqual([])
    expect(sources.filter((source) => text(`questions.sources.${source.id}`) === '')).toEqual([])
  })

  it('cada clave de la página es una sección del registro, y ninguna sobra', () => {
    const used = [
      `questions.${slug}.title`,
      `questions.${slug}.answer`,
      `questions.${slug}.card`,
      ...page.sections.flatMap((section) => [
        `questions.${slug}.sections.${section.id}.title`,
        ...Array.from(
          { length: section.paragraphs },
          (_, n) => `questions.${slug}.sections.${section.id}.p${n + 1}`,
        ),
        ...Array.from(
          { length: 'list' in section ? section.list.items : 0 },
          (_, n) => `questions.${slug}.sections.${section.id}.i${n + 1}`,
        ),
      ]),
    ]
    expect(leaves(at(`questions.${slug}`), `questions.${slug}`).sort()).toEqual(used.sort())
  })
})

describe('lo compartido no se copia', () => {
  const SHARED = [
    ...[1, 2, 3].flatMap((n) => [`verification.levels.asks_${n}`, `verification.levels.says_${n}`]),
    ...['what_body', 'use_nobody', 'use_deleted', 'use_never', 'use_who', 'use_withdraw'].map(
      (key) => `identity.request.${key}`,
    ),
    'identity.request.use_kept',
    ...leaves(at('adoptions.commitment.clauses'), 'adoptions.commitment.clauses'),
  ]

  it('ninguna clave de las preguntas repite un texto de niveles, cédula o compromiso', () => {
    const own = new Set(leaves(at('questions'), 'questions').map((path) => text(path)))
    expect(SHARED.filter((path) => own.has(text(path)))).toEqual([])
  })

  it('la página con el compromiso de ejemplo dice que es inventado', () => {
    const withExample = QUESTION_PAGES.filter(
      (page) => 'shared' in page && (page.shared as readonly string[]).includes('commitment'),
    )
    expect(withExample.map((page) => page.slug)).toEqual(['compromiso-y-seguimiento'])
    expect(text('questions.page.example_note')).toBe('El ejemplo es inventado.')
  })
})
