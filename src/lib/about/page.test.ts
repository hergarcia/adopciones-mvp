// Covers: FR-002, FR-005, FR-007, FR-015, FR-016, FR-017, US1-AS2, US1-AS4, US1-AS6
// (las reglas de contenido de «Nosotros», sobre la estructura y messages/es.json)
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { APP_NAME } from '@/lib/config'
import { FOLLOW_UP_DAYS } from '@/lib/follow-ups/rules'
import { parseDay } from '@/lib/questions/dates'
import { sentenceCount } from '@/lib/questions/sentences'
import { ABOUT_BRAND, ABOUT_FACTS, ABOUT_PATH, ABOUT_SECTIONS, ABOUT_UPDATED_ON } from './page'

type Tree = { [key: string]: string | Tree }
const messages: Tree = JSON.parse(readFileSync('messages/es.json', 'utf8'))
const about = messages['about']

function leaves(node: string | Tree | undefined, prefix: string): string[] {
  if (typeof node !== 'object') return [prefix]
  return Object.entries(node).flatMap(([key, child]) => leaves(child, `${prefix}.${key}`))
}

function text(path: string): string {
  const value = path
    .split('.')
    .reduce<string | Tree | undefined>(
      (node, part) => (typeof node === 'object' ? node[part] : undefined),
      messages,
    )
  if (typeof value !== 'string') throw new Error(`Falta ${path} en messages/es.json`)
  return value
}

const range = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, n) => `${prefix}${n + 1}`)

describe('la página «Nosotros»', () => {
  it('vive en /nosotros', () => {
    expect(ABOUT_PATH).toBe('/nosotros')
  })

  // Escrito a mano a propósito: si cambian las partes o su orden, este test lo dice.
  it('las partes van en su orden fijo', () => {
    expect([...ABOUT_SECTIONS, ABOUT_BRAND].map((section) => section.id)).toEqual([
      'why',
      'different',
      'promise',
      'brand',
    ])
  })

  it('la fecha es un día válido y no del futuro', () => {
    expect(parseDay(ABOUT_UPDATED_ON).getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('cada clave de `about` es de la estructura, y ninguna falta ni sobra', () => {
    const used = [
      'about.title',
      'about.card',
      'about.lead',
      'about.updated',
      'about.action',
      'about.error.body',
      'about.error.to_home',
      ...ABOUT_SECTIONS.flatMap((section) => [
        `about.sections.${section.id}.title`,
        ...range(section.paragraphs, `about.sections.${section.id}.p`),
        ...range(section.items, `about.sections.${section.id}.i`),
      ]),
      `about.sections.${ABOUT_BRAND.id}.title`,
      ...range(ABOUT_BRAND.paragraphs, `about.sections.${ABOUT_BRAND.id}.p`),
      `about.sections.${ABOUT_BRAND.id}.image`,
      `about.sections.${ABOUT_BRAND.id}.levels`,
    ]
    expect(leaves(about, 'about').sort()).toEqual(used.sort())
  })

  it('la parte de las diferencias tiene sus cinco renglones', () => {
    const different = ABOUT_SECTIONS.find((section) => section.id === 'different')
    expect(different?.items).toBe(5)
  })

  it('la bajada responde en 1 a 3 oraciones y la tarjeta entra en 160', () => {
    expect(sentenceCount(text('about.lead'))).toBeGreaterThanOrEqual(1)
    expect(sentenceCount(text('about.lead'))).toBeLessThanOrEqual(3)
    expect(text('about.card').length).toBeLessThanOrEqual(160)
  })

  it('ningún texto trae una cifra ni el nombre del sitio escritos a mano', () => {
    const texts = leaves(about, 'about').map((path) => text(path))
    expect(texts.filter((value) => /\d/u.test(value))).toEqual([])
    expect(texts.filter((value) => value.includes(APP_NAME))).toEqual([])
  })

  it('los días del seguimiento llegan de la regla que el sitio cumple', () => {
    expect(text('about.sections.different.i4')).toContain('{followUpDays}')
    expect(ABOUT_FACTS).toEqual({ followUpDays: FOLLOW_UP_DAYS })
  })

  it('la fecha dice cuándo cambió el texto, con el formato de las preguntas', () => {
    expect(text('about.updated')).toBe(text('questions.page.updated'))
    expect(text('about.action')).toBe('Ver los animales en adopción')
  })
})
