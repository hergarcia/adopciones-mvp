// Covers: FR-023, FR-024 (research R7, R16)
import { describe, expect, it } from 'vitest'
import { PREVIEW_BOTS, isPreviewBot } from './preview-bots'

describe('isPreviewBot', () => {
  it.each([
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Facebot',
    'WhatsApp/2.23.20.0 A',
    'Twitterbot/1.0',
    'TelegramBot (like TwitterBot)',
    'Mozilla/5.0 (compatible; FACEBOOKEXTERNALHIT)',
  ])('%s es un lector de vista previa', (agent) => {
    expect(isPreviewBot(agent)).toBe(true)
  })

  it.each([
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) [FBAN/FBIOS;FBAV/450.0]',
    '',
  ])('%s no lo es', (agent) => {
    expect(isPreviewBot(agent)).toBe(false)
  })

  it('sin user-agent no lo es', () => {
    expect(isPreviewBot(null)).toBe(false)
  })

  it('son los cinco de la decisión', () => {
    expect(PREVIEW_BOTS).toEqual([
      'facebookexternalhit',
      'Facebot',
      'WhatsApp',
      'Twitterbot',
      'TelegramBot',
    ])
  })
})
