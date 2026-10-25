// Covers: US1-AS6, FR-012
import { describe, expect, it } from 'vitest'
import { singleYoungSeed } from './single-young-seed'
import type { LitterFormValues, YoungFormValues } from './types'

const LITTER: LitterFormValues = {
  name: 'La camada de Luna',
  species: 'cat',
  ageValue: '2',
  ageUnit: 'months',
  size: 'small',
  isNeutered: 'no',
  vaccines: 'incomplete',
  hasChip: 'no',
  goodWithKids: 'yes',
  goodWithDogs: 'unknown',
  goodWithCats: 'yes',
  description: 'Son muy mimosos.',
  department: 'UY-MO',
  locality: 'Pocitos',
  isUrgent: true,
  requiredLevel: '2',
  deliversFrom: '2026-11-03',
  young: [],
}

const YOUNG: YoungFormValues = { key: 'k1', name: 'Tito', sex: 'male', description: '' }

describe('singleYoungSeed', () => {
  it('lo común, con el nombre y el sexo de la cría y sin la fecha de entrega', () => {
    const seed = singleYoungSeed(LITTER, YOUNG, { litter: [], young: [] })
    expect(seed.values).toEqual({
      name: 'Tito',
      species: 'cat',
      sex: 'male',
      ageValue: '2',
      ageUnit: 'months',
      size: 'small',
      isNeutered: 'no',
      vaccines: 'incomplete',
      hasChip: 'no',
      goodWithKids: 'yes',
      goodWithDogs: 'unknown',
      goodWithCats: 'yes',
      description: 'Son muy mimosos.',
      department: 'UY-MO',
      locality: 'Pocitos',
      isUrgent: true,
      requiredLevel: '2',
    })
  })

  it('la descripción propia gana a la de la camada', () => {
    const own = { ...YOUNG, description: 'El más chico.' }
    expect(singleYoungSeed(LITTER, own, { litter: [], young: [] }).values.description).toBe(
      'El más chico.',
    )
  })

  it('una descripción propia en blanco usa la de la camada', () => {
    const blank = { ...YOUNG, description: '   ' }
    expect(singleYoungSeed(LITTER, blank, { litter: [], young: [] }).values.description).toBe(
      'Son muy mimosos.',
    )
  })

  it('las fotos propias ganan a las de la camada', () => {
    expect(singleYoungSeed(LITTER, YOUNG, { litter: ['a', 'b'], young: ['c'] }).photos).toEqual([
      'c',
    ])
  })

  it('sin fotos propias, las de la camada', () => {
    expect(singleYoungSeed(LITTER, YOUNG, { litter: ['a', 'b'], young: [] }).photos).toEqual([
      'a',
      'b',
    ])
  })
})
