// Covers: FR-011 (plan §Vista previa: la imagen con los tokens de docs/10)
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { OG_PALETTE } from './palette'

const css = readFileSync('src/styles/globals.css', 'utf8')
const token = (name: string) =>
  css.match(new RegExp(String.raw`^\s+--color-${name}:\s*([^;]+);`, 'm'))?.[1]

describe('OG_PALETTE', () => {
  it('son los mismos colores que globals.css', () => {
    expect(OG_PALETTE).toEqual({
      canvas: token('canvas'),
      ink: token('ink'),
      inkMuted: token('ink-muted'),
      primary: token('primary'),
      tape: token('tape'),
    })
  })
})
