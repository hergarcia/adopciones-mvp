// Covers: FR-012, casos borde «La fecha de última actualización» (research R2 de la #8): si cambia
// lo que una página toma de otras pantallas, su fecha cambia en la misma entrega.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { QUESTION_FACTS } from './facts'
import { QUESTION_PAGES } from './pages'

type Tree = { [key: string]: string | Tree }
const messages: Tree = JSON.parse(readFileSync('messages/es.json', 'utf8'))
const at = (path: string) =>
  path
    .split('.')
    .reduce<string | Tree | undefined>(
      (node, part) => (typeof node === 'object' ? node[part] : undefined),
      messages,
    )

// Lo que cada página repite de afuera: las claves y las cifras.
type Borrowed = { keys: string[]; facts: (keyof typeof QUESTION_FACTS)[] }

const BORROWED: Record<string, Borrowed> = {
  'como-se-verifica': {
    keys: [
      'verification.levels.level',
      ...[1, 2, 3].flatMap((n) => [
        `verification.levels.asks_${n}`,
        `verification.levels.says_${n}`,
      ]),
      'identity.request.what_title',
      'identity.request.what_body',
      'identity.request.use_title',
      'identity.request.use_nobody',
      'identity.request.use_deleted',
      'identity.request.use_never',
      'identity.request.use_who',
      'identity.request.use_withdraw',
      'identity.request.use_kept',
    ],
    facts: ['expectedReviewDays', 'reviewTtlDays', 'rejectionCap', 'rejectionWindowDays'],
  },
  'compromiso-y-seguimiento': {
    keys: ['adoptions.commitment.clauses'],
    facts: ['followUpDays', 'followUpMaxPhotos'],
  },
}

// Si este test falla, cambió lo que la página toma de otras pantallas: se anota el día nuevo en su
// `updatedOn` (src/lib/questions/pages.ts) y acá, junto con el hash que muestra el error.
const ANNOTATED: Record<string, { updatedOn: string; hash: string }> = {
  'como-se-verifica': { updatedOn: '2026-10-09', hash: '1b1729c3c518' },
  'compromiso-y-seguimiento': { updatedOn: '2026-10-09', hash: 'df2680c680bc' },
}

function hashOf(borrowed: Borrowed): string {
  const values = [
    ...borrowed.keys.map((key) => [key, at(key)]),
    ...borrowed.facts.map((fact) => [fact, QUESTION_FACTS[fact]]),
  ]
  return createHash('sha256').update(JSON.stringify(values)).digest('hex').slice(0, 12)
}

describe('lo que una página toma de afuera está fechado', () => {
  it.each(Object.entries(BORROWED))('%s', (slug, borrowed) => {
    const page = QUESTION_PAGES.find((one) => one.slug === slug)
    expect({ updatedOn: page?.updatedOn, hash: hashOf(borrowed) }).toEqual(ANNOTATED[slug])
  })
})
