// Covers: US3-AS1, US3-AS6 (#205): la tarjeta de una camada dice «4 crías, 4 disponibles» y abre su
// ficha; la de un animal sigue diciendo qué animal es, con su sello. #273: las dos dicen el nivel de
// quien publicó con las palabras de la ficha, solo donde se les pasan y si se pudo saber.
import { describe, expect, it } from 'vitest'
import { cardView, listedCard, listedCardTexts, litterCardTexts, stampOf } from './listed-card-view'
import { signedPhotoSource } from './photo-source'
import type { ListedPet } from './types'

// Cada traductor devuelve la clave y los valores que recibió: así se ve qué texto se pidió y con qué.
const echo = (key: string, values?: object) => `${key} ${JSON.stringify(values ?? {})}`

const cover = {
  id: '11111111-1111-4111-8111-111111111111',
  width: 1280,
  height: 1600,
  placeholder: 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw',
  urls: { thumb: 'https://x.test/thumb', card: 'https://x.test/card', full: 'https://x.test/full' },
}

const common = {
  code: 'k3x9p2qa7m',
  name: 'Los de Luna',
  species: 'cat',
  size: 'small',
  age: { value: 2, unit: 'months' },
  zone: { department: 'UY-MO', locality: 'Pocitos' },
  isUrgent: false,
  status: 'available',
  publishedAt: '2026-10-25T12:00:00Z',
  cover,
  publisherLevel: 2,
} as const

const litter: ListedPet = { ...common, kind: 'litter', youngCount: 4, availableCount: 3 }
const pet: ListedPet = { ...common, kind: 'pet', name: 'Tobi', species: 'dog', sex: 'female' }

const translators = {
  petSummary: (one: { name: string }) => `resumen de ${one.name}`,
  card: echo,
  status: echo,
  litter: echo,
}

describe('listedCard', () => {
  it('la de un animal abre su ficha', () => {
    expect(listedCard(pet)).toMatchObject({ key: 'k3x9p2qa7m', href: '/animales/k3x9p2qa7m' })
  })

  it('la de una camada abre la ficha de la camada', () => {
    expect(listedCard(litter)).toMatchObject({ key: 'k3x9p2qa7m', href: '/camadas/k3x9p2qa7m' })
  })
})

describe('listedCardTexts', () => {
  it('una camada con crías disponibles dice qué animales, cuántas crías y cuántas disponibles, sin sello', () => {
    expect(listedCardTexts(litter, translators)).toStrictEqual({
      urgent: 'urgent {}',
      alt: 'photo_alt {"name":"Los de Luna","species":"cat","zone":"Pocitos, Montevideo"}',
      summary: 'summary {"species":"cat","young":4,"available":3}',
      stamp: undefined,
      level: undefined,
    })
  })

  it('una camada sin crías disponibles y alguna en proceso lleva «En proceso», en femenino', () => {
    expect(
      listedCardTexts({ ...litter, status: 'in_process', availableCount: 0 }, translators).stamp,
    ).toEqual({
      state: 'in_process',
      label: 'stamp {"state":"in_process","sex":"female"}',
    })
  })

  it('un animal disponible dice qué animal es, sin sello', () => {
    expect(listedCardTexts(pet, translators)).toStrictEqual({
      urgent: 'urgent {}',
      alt: 'photo_alt {"name":"Tobi","species":"dog","sex":"female","zone":"Pocitos, Montevideo"}',
      summary: 'resumen de Tobi',
      stamp: undefined,
      level: undefined,
    })
  })

  it('un animal en proceso lleva el sello, concordado con su sexo', () => {
    expect(listedCardTexts({ ...pet, status: 'in_process' }, translators).stamp).toEqual({
      state: 'in_process',
      label: 'stamp {"state":"in_process","sex":"female"}',
    })
  })
})

describe('listedCardTexts con el nivel de quien publicó', () => {
  const withLevel = { ...translators, level: (key: string) => `page.${key}` }

  it('un animal dice el nivel con la clave de la ficha', () => {
    expect(listedCardTexts(pet, withLevel).level).toBe('page.level_two')
    expect(listedCardTexts({ ...pet, publisherLevel: 1 }, withLevel).level).toBe('page.level_one')
  })

  it('una camada también, con la misma clave que su ficha', () => {
    expect(listedCardTexts({ ...litter, publisherLevel: 3 }, withLevel).level).toBe(
      'page.level_three',
    )
  })

  it('sin un nivel que se pueda saber, la tarjeta no lo dice', () => {
    expect(listedCardTexts({ ...pet, publisherLevel: null }, withLevel).level).toBeUndefined()
    expect(listedCardTexts({ ...litter, publisherLevel: null }, withLevel).level).toBeUndefined()
  })

  it('sin las palabras del nivel (el perfil), tampoco', () => {
    expect(listedCardTexts({ ...litter, publisherLevel: 3 }, translators).level).toBeUndefined()
  })
})

describe('litterCardTexts', () => {
  it('el texto alternativo nombra la camada, su especie y su zona', () => {
    expect(litterCardTexts(litter, echo, echo)).toStrictEqual({
      urgent: 'urgent {}',
      alt: 'photo_alt {"name":"Los de Luna","species":"cat","zone":"Pocitos, Montevideo"}',
    })
  })
})

describe('stampOf', () => {
  it('disponible no lleva sello; los demás estados, sí', () => {
    expect(stampOf({ state: 'available', sex: 'male' }, echo)).toBeUndefined()
    expect(stampOf({ state: 'adopted', sex: 'male' }, echo)).toEqual({
      state: 'adopted',
      label: 'stamp {"state":"adopted","sex":"male"}',
    })
  })
})

describe('cardView', () => {
  const card = listedCard(litter)
  const texts = {
    alt: 'Foto',
    urgent: 'Urgente',
    summary: '4 crías, 3 disponibles',
    stamp: { state: 'paused' as const, label: 'Pausada' },
    level: 'Identidad verificada',
  }

  it('arma la tarjeta con sus textos', () => {
    expect(cardView(card, texts)).toStrictEqual({
      key: 'k3x9p2qa7m',
      href: '/camadas/k3x9p2qa7m',
      name: 'Los de Luna',
      summaryText: '4 crías, 3 disponibles',
      zoneText: 'Pocitos, Montevideo',
      urgentText: null,
      alt: 'Foto',
      photo: signedPhotoSource(cover),
      stamp: { state: 'paused', label: 'Pausada' },
      levelText: 'Identidad verificada',
    })
  })

  it('«Urgente» solo si lo es', () => {
    expect(cardView({ ...card, isUrgent: true }, texts).urgentText).toBe('Urgente')
  })
})
