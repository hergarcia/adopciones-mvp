// Covers: FR-001, FR-002, FR-005, FR-006, FR-008, FR-010, SC-001, SC-002, SC-004 (#280: la vista
// previa del perfil dice el nivel, y sin nivel queda como antes)
import { describe, expect, it } from 'vitest'
import { siteShareVersion } from '@/lib/og/site-share-version'
import { parseShareLevel, profileLevelImagePath, profileShareMetadata } from './share-metadata'

const TITLE = 'Carla Ruiz · Adopciones'

describe('parseShareLevel', () => {
  it('1, 2 y 3 son los niveles con imagen', () => {
    expect(parseShareLevel('1')).toBe(1)
    expect(parseShareLevel('2')).toBe(2)
    expect(parseShareLevel('3')).toBe(3)
  })

  it('cualquier otra cosa no es un nivel', () => {
    for (const segment of ['0', '4', 'x', '2.5', ' 2', '', 'toString', '02']) {
      expect(parseShareLevel(segment), `«${segment}»`).toBeNull()
    }
  })
})

describe('profileLevelImagePath', () => {
  it('la imagen del nivel, bajo el perfil público, con su versión', () => {
    expect(profileLevelImagePath(2, 'abc')).toBe('/perfil/nivel/2/imagen?v=abc')
  })
})

describe('profileShareMetadata', () => {
  it.each([
    [1, 'Teléfono verificado'],
    [2, 'Identidad verificada'],
    [3, 'Identidad verificada y avalada'],
  ] as const)('con nivel %i, el texto y la imagen dicen «%s»', (level, levelText) => {
    const url = `/perfil/nivel/${level}/imagen?v=${siteShareVersion({ siteName: 'Adopciones', phrase: levelText })}`
    expect(profileShareMetadata({ level, title: TITLE, levelText })).toEqual({
      description: levelText,
      openGraph: {
        description: levelText,
        images: [{ url, width: 1200, height: 630, type: 'image/jpeg', alt: levelText }],
      },
      twitter: {
        card: 'summary_large_image',
        title: TITLE,
        description: levelText,
        images: [url],
      },
    })
  })

  it('la versión cambia con las palabras, así una app no sigue con la imagen de antes', () => {
    const one = profileShareMetadata({ level: 2, title: TITLE, levelText: 'Identidad verificada' })
    const other = profileShareMetadata({ level: 2, title: TITLE, levelText: 'Otra frase' })
    expect(one.openGraph?.images[0]?.url).not.toBe(other.openGraph?.images[0]?.url)
  })

  it('sin nada verificado o sin poder saber el nivel, no suma nada', () => {
    expect(
      profileShareMetadata({ level: 0, title: TITLE, levelText: 'Teléfono verificado' }),
    ).toEqual({})
    expect(profileShareMetadata({ level: null, title: TITLE, levelText: null })).toEqual({})
    expect(profileShareMetadata({ level: 2, title: TITLE, levelText: null })).toEqual({})
  })

  it('no lleva zona, localidad ni foto de la persona', () => {
    const shared = JSON.stringify(
      profileShareMetadata({ level: 3, title: TITLE, levelText: 'Identidad verificada y avalada' }),
    )
    for (const leak of ['La Paloma', 'Rocha', '/foto']) expect(shared).not.toContain(leak)
  })
})
