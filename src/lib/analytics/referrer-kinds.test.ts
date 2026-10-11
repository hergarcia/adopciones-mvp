// Covers: US3-AS4, FR-023, spec §Edge Cases «Qué se reconoce» (research R11)
import { describe, expect, it } from 'vitest'
import { referrerKind } from './referrer-kinds'

describe('referrerKind', () => {
  it.each([
    ['facebook.com'],
    ['fb.com'],
    ['instagram.com'],
    ['t.co'],
    ['x.com'],
    ['twitter.com'],
    ['tiktok.com'],
    ['linkedin.com'],
    ['lnkd.in'],
    ['threads.net'],
    ['whatsapp.com'],
  ])('%s es una red social', (host) => {
    expect(referrerKind(host)).toBe('social')
  })

  it.each([['bing.com'], ['duckduckgo.com'], ['yahoo.com'], ['ecosia.org'], ['search.brave.com']])(
    '%s es un buscador',
    (host) => {
      expect(referrerKind(host)).toBe('search')
    },
  )

  it.each([
    ['chatgpt.com'],
    ['chat.openai.com'],
    ['claude.ai'],
    ['perplexity.ai'],
    ['gemini.google.com'],
    ['copilot.microsoft.com'],
  ])('%s es un asistente', (host) => {
    expect(referrerKind(host)).toBe('assistant')
  })

  it.each([
    ['m.facebook.com', 'social'],
    ['l.facebook.com', 'social'],
    ['web.whatsapp.com', 'social'],
    ['www.bing.com', 'search'],
    ['uy.search.yahoo.com', 'search'],
    ['www.perplexity.ai', 'assistant'],
  ])('un subdominio de %s cuenta como su dominio', (host, kind) => {
    expect(referrerKind(host)).toBe(kind)
  })

  // El sufijo de dominio es estricto: el que termina igual sin el punto, o el que lleva el dominio
  // adelante de otro, es otro sitio.
  it.each([
    ['facebook.com.evil.com'],
    ['evilfacebook.com'],
    ['notx.com'],
    ['brave.com'],
    ['openai.com'],
    ['google.com.evil.org'],
    ['evilgoogle.com'],
    ['www.google.info'],
    ['google.a'],
    ['mail.google.com'],
    ['otro.test'],
    [''],
  ])('%s no es ninguno', (host) => {
    expect(referrerKind(host)).toBeNull()
  })

  it.each([
    ['google.com'],
    ['www.google.com'],
    ['www.google.com.uy'],
    ['google.com.ar'],
    ['google.co.uk'],
    ['www.google.de'],
  ])('%s es Google Búsqueda, en cualquier país', (host) => {
    expect(referrerKind(host)).toBe('search')
  })

  it('el host en mayúsculas es el mismo', () => {
    expect(referrerKind('WWW.Google.COM.UY')).toBe('search')
    expect(referrerKind('M.FaceBook.com')).toBe('social')
    expect(referrerKind('ChatGPT.com')).toBe('assistant')
  })
})
