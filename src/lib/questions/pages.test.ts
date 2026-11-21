// Covers: FR-001, FR-002, FR-003, FR-009, FR-011, FR-012, FR-013, FR-015, SC-001, SC-002, SC-003,
// SC-004 (las reglas de contenido de la spec, sobre el registro y messages/es.json), y las reglas de
// las páginas de la historia #204
import { readFileSync } from 'node:fs'
import { createTranslator, type Messages } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { PET_STATES, PET_STATUS_ACTIONS } from '@/lib/pets/types'
import { parseDay } from './dates'
import { QUESTION_FACTS } from './facts'
import {
  ACTION_PATH,
  GROUP_ORDER,
  PUBLISHED,
  QUESTION_PAGES,
  questionBySlug,
  type OfficialSource,
  type QuestionSection,
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
  'como-publico-un-animal',
  'como-publico-una-camada',
  'como-pido-un-animal',
  'como-se-verifica',
  'que-significa-cada-estado',
  'antes-de-entregar',
  'que-exige-uruguay',
  'reconocer-una-estafa',
  'compromiso-y-seguimiento',
] as const

// Escrita a mano a propósito: si el registro cambia, este test lo dice (data-model de la #8).
const EXPECTED = {
  'como-publico-un-animal': {
    group: 'giver',
    action: 'publish_pet',
    related: ['que-significa-cada-estado', 'antes-de-entregar'],
    shared: [],
  },
  'como-publico-una-camada': {
    group: 'giver',
    action: 'publish_pet',
    related: ['como-publico-un-animal', 'que-significa-cada-estado'],
    shared: [],
  },
  'como-pido-un-animal': {
    group: 'adopter',
    action: 'browse_pets',
    related: ['como-se-verifica', 'reconocer-una-estafa'],
    shared: [],
  },
  'como-se-verifica': {
    group: 'everyone',
    action: 'verify_identity',
    related: ['antes-de-entregar', 'reconocer-una-estafa'],
    shared: ['levels', 'identity_images'],
  },
  'que-significa-cada-estado': {
    group: 'everyone',
    action: 'publish_pet',
    related: ['como-publico-un-animal', 'como-pido-un-animal'],
    shared: [],
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
  it('tiene las nueve, publicadas, con su grupo, su acción, sus relacionadas y lo compartido', () => {
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
        // El título de un estado son las palabras de su sello, no una clave propia.
        ...('state' in section ? [] : [`questions.${slug}.sections.${section.id}.title`]),
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

// Covers: #255, los enlaces de una sección a otra página de la guía
describe('los enlaces entre páginas', () => {
  const links = QUESTION_PAGES.flatMap((page) =>
    page.sections.flatMap((section: QuestionSection) =>
      section.see === undefined ? [] : [{ from: page.slug, ...section.see }],
    ),
  )

  it('«¿Cómo publico un animal?» lleva a la camada, y la camada a sus estados', () => {
    expect(links).toEqual([
      { from: 'como-publico-un-animal', slug: 'como-publico-una-camada' },
      { from: 'como-publico-una-camada', slug: 'que-significa-cada-estado', anchor: 'camadas' },
    ])
  })

  it('cada uno lleva a una página que existe y a una sección con esa ancla', () => {
    const broken = links.filter(({ slug, anchor }) => {
      const target = questionBySlug(slug)
      if (target === null) return true
      const sections: readonly QuestionSection[] = target.sections
      return anchor !== undefined && !sections.some((section) => section.anchor === anchor)
    })
    expect(broken).toEqual([])
  })

  it('el paso que lleva a la camada dice cuándo se elige', () => {
    expect(text('questions.como-publico-un-animal.sections.steps.i3')).toContain('«Una camada»')
  })
})

// Covers: #255, lo que la página de la camada y «¿Cómo pido un animal?» dicen con las cifras del sitio
describe('la página de la camada', () => {
  it('dice cuántas crías lleva, con las cifras que el sitio cumple', () => {
    const answer = text('questions.como-publico-una-camada.answer')
    expect(answer).toContain(`De ${QUESTION_FACTS.youngMin} a ${QUESTION_FACTS.youngMax} crías`)
    expect(answer).toContain('«Una camada»')
  })

  it('cada cría se pide por separado y cuenta para el tope de solicitudes', () => {
    expect(text('questions.como-pido-un-animal.sections.waiting.p3')).toContain(
      `${QUESTION_FACTS.maxActiveApplications} activas`,
    )
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

describe('la página de los estados', () => {
  const page = questionBySlug('que-significa-cada-estado')!
  const sections: readonly QuestionSection[] = page.sections
  const translated: Messages = JSON.parse(readFileSync('messages/es.json', 'utf8'))
  const t = createTranslator({ locale: 'es', messages: translated, namespace: 'pets' })
  const body = sections
    .flatMap((section) =>
      Array.from({ length: section.paragraphs }, (_, n) =>
        text(`questions.${page.slug}.sections.${section.id}.p${n + 1}`),
      ),
    )
    .join(' ')

  it('tiene una sección por estado, con su ancla, en el orden de las pantallas', () => {
    expect(sections.filter((section) => section.state).map((section) => section.state)).toEqual(
      PET_STATES,
    )
    expect(sections.map((section) => section.anchor)).toEqual([
      'disponible',
      'en-proceso',
      'pausado',
      'adoptado',
      'vencido',
      'dado-de-baja',
      'renovar',
      'camadas',
    ])
  })

  it('nombra cada acción con la palabra de su botón', () => {
    const labels = PET_STATUS_ACTIONS.map((action) =>
      t(`status.actions.${action}`, { sex: 'male' }),
    )
    expect(labels.filter((label) => !body.includes(`«${label}»`))).toEqual([])
  })

  // Covers: #255, la parte de las camadas con las palabras de sus botones
  it('las camadas nombran cada acción de una cría y de la camada con la palabra de su botón', () => {
    const litters = Array.from({ length: 4 }, (_, n) =>
      text(`questions.${page.slug}.sections.litters.p${n + 1}`),
    ).join(' ')
    const labels = [
      ...leaves(at('litters.status.actions'), 'litters.status.actions'),
      'litters.status.delete.trigger',
    ].map((path) => text(path))
    expect(labels).toHaveLength(8)
    expect(labels.filter((label) => !litters.includes(`«${label}»`))).toEqual([])
  })

  it('dice los días de vida y del aviso que el sitio cumple', () => {
    expect(body).toContain(`${QUESTION_FACTS.petLifetimeDays} días`)
    expect(body).toContain(`${QUESTION_FACTS.petReminderDays} días antes`)
  })
})
