import { describe, expect, it } from 'vitest'
import { isLinkPreview } from './link-preview'

// Covers: FR-028, FR-009. Una vista previa contada como vista infla la señal de SC-007, y con la
// foto en la página, algunas la toman como imagen del enlace.
describe('una vista previa de un enlace', () => {
  it.each([
    'WhatsApp/2.23.20.0',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Facebot',
    'TelegramBot (like TwitterBot)',
    'Twitterbot/1.0',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    'LinkedInBot/1.0 (compatible; Mozilla/5.0)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  ])('%s', (agent) => {
    expect(isLinkPreview(agent)).toBe(true)
  })

  it('un navegador no es una vista previa', () => {
    expect(
      isLinkPreview(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
      ),
    ).toBe(false)
  })

  it('sin agente, tampoco', () => {
    expect(isLinkPreview(null)).toBe(false)
    expect(isLinkPreview('')).toBe(false)
  })
})
