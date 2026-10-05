// Covers: FR-026, US3-AS1 (research R5: la imagen nueva cuando cambia el nombre o la frase)
import { describe, expect, it } from 'vitest'
import { siteShareVersion } from './site-share-version'

const SITE = { siteName: 'Adopciones', phrase: 'Perros y gatos en adopción.' }

describe('siteShareVersion', () => {
  it('es la misma con los mismos datos', () => {
    expect(siteShareVersion(SITE)).toBe(siteShareVersion({ ...SITE }))
  })

  it('es corta, para ir en la dirección', () => {
    expect(siteShareVersion(SITE)).toMatch(/^[0-9a-f]{8}$/)
  })

  it('cambia si cambia el nombre', () => {
    expect(siteShareVersion({ ...SITE, siteName: 'Huellas' })).not.toBe(siteShareVersion(SITE))
  })

  it('cambia si cambia la frase', () => {
    expect(siteShareVersion({ ...SITE, phrase: 'Gatos en adopción.' })).not.toBe(
      siteShareVersion(SITE),
    )
  })

  it('no confunde dónde termina el nombre y empieza la frase', () => {
    expect(siteShareVersion({ siteName: 'ab', phrase: 'c' })).not.toBe(
      siteShareVersion({ siteName: 'a', phrase: 'bc' }),
    )
  })
})
