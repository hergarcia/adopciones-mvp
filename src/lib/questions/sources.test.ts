// Covers: FR-011, SC-004 (cada dato legal enlaza a una fuente oficial, y solo a una)
import { describe, expect, it } from 'vitest'
import { OFFICIAL_SOURCE_HOSTS, isOfficialSource } from './sources'

describe('isOfficialSource', () => {
  it.each(OFFICIAL_SOURCE_HOSTS.map((host) => [`https://${host}/una/norma`]))(
    'acepta HTTPS en un host oficial: %s',
    (url) => {
      expect(isOfficialSource(url)).toBe(true)
    },
  )

  it.each([
    ['http://www.impo.com.uy/bases/leyes/19889-2020'],
    ['https://impo.com.uy.evil.com/bases/leyes/19889-2020'],
    ['https://www.elobservador.com.uy/nota/chip'],
    ['https://montevideo.gub.uy/tramite'],
    ['ftp://www.impo.com.uy/x'],
    ['www.impo.com.uy/bases'],
    ['no es una dirección'],
    [''],
  ])('rechaza lo que no es oficial: %s', (url) => {
    expect(isOfficialSource(url)).toBe(false)
  })

  it('la lista es la de research R11, sin comodines', () => {
    expect(OFFICIAL_SOURCE_HOSTS).toEqual([
      'www.impo.com.uy',
      'impo.com.uy',
      'parlamento.gub.uy',
      'www.parlamento.gub.uy',
      'www.gub.uy',
    ])
  })
})
