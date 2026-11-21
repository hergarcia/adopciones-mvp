import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { scanMessages } from './watched-phrases.mjs'

const messages = JSON.parse(
  readFileSync(new URL('../../messages/es.json', import.meta.url), 'utf8'),
)

describe('los textos del sitio', () => {
  it('no traen ninguna frase vigilada de la guía sin vicios', () => {
    expect(scanMessages(messages)).toEqual([])
  })
})
