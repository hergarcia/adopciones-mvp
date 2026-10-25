// Covers: US1-AS7, US1-AS8, US1-AS10, US1-AS11, FR-004, FR-005, FR-006, FR-008, FR-009, FR-010,
// FR-013 y los Edge Cases «La fecha de entrega es hoy» y «Editar una camada cuya fecha ya pasó»
import { describe, expect, it } from 'vitest'
import {
  deliveryProblem,
  litterContactRejections,
  validateLitter,
  type LitterErrors,
} from './litter'

const TODAY = '2026-10-25'

function young(key: string, overrides: Record<string, unknown> = {}) {
  return { key, name: `Cría ${key}`, sex: 'female', description: '', ...overrides }
}

function litter(overrides: Record<string, unknown> = {}) {
  return {
    name: 'La camada de Luna',
    species: 'cat',
    ageValue: '2',
    ageUnit: 'months',
    size: 'small',
    isNeutered: 'no',
    vaccines: 'incomplete',
    hasChip: 'no',
    goodWithKids: 'unknown',
    goodWithDogs: 'unknown',
    goodWithCats: 'yes',
    description: '',
    department: 'UY-MO',
    locality: 'Pocitos',
    isUrgent: false,
    requiredLevel: '1',
    deliversFrom: '',
    young: [young('1'), young('2')],
    ...overrides,
  }
}

const PUBLISH = { publishing: true, today: TODAY, storedDeliversFrom: null, ageUnchanged: false }
const SAVE = { ...PUBLISH, publishing: false }

function errorsOf(input: unknown, options = PUBLISH): LitterErrors {
  const result = validateLitter(input, options)
  if (result.ok) throw new Error('se esperaba un rechazo')
  return result.errors
}

describe('validateLitter acepta', () => {
  it('lo común y dos crías, y devuelve los datos listos para guardar', () => {
    expect(validateLitter(litter(), PUBLISH)).toEqual({
      ok: true,
      data: {
        name: 'La camada de Luna',
        species: 'cat',
        age: { value: 2, unit: 'months' },
        size: 'small',
        isNeutered: false,
        vaccines: 'incomplete',
        hasChip: false,
        goodWithKids: 'unknown',
        goodWithDogs: 'unknown',
        goodWithCats: 'yes',
        description: null,
        department: 'UY-MO',
        locality: 'Pocitos',
        isUrgent: false,
        requiredLevel: 1,
        deliversFrom: null,
        young: [
          { key: '1', name: 'Cría 1', sex: 'female', description: null },
          { key: '2', name: 'Cría 2', sex: 'female', description: null },
        ],
      },
    })
  })

  it('la edad en años, la descripción y los textos de cada cría sin los espacios de los bordes', () => {
    const result = validateLitter(
      litter({
        ageValue: ' 3 ',
        ageUnit: 'years',
        description: '  Juguetones  ',
        young: [
          young('1', { name: '  Tito ', sex: 'male', description: ' El más chico ' }),
          young('2'),
        ],
      }),
      PUBLISH,
    )
    expect(result.ok && result.data.age).toEqual({ value: 3, unit: 'years' })
    expect(result.ok && result.data.description).toBe('Juguetones')
    expect(result.ok && result.data.young[0]).toEqual({
      key: '1',
      name: 'Tito',
      sex: 'male',
      description: 'El más chico',
    })
  })

  it('diez crías al publicar', () => {
    const ten = Array.from({ length: 10 }, (_, index) => young(String(index + 1)))
    expect(validateLitter(litter({ young: ten }), PUBLISH).ok).toBe(true)
  })

  it('una sola cría al guardar una edición', () => {
    expect(validateLitter(litter({ young: [young('1')] }), SAVE).ok).toBe(true)
  })

  it('la fecha de entrega de hoy, y la devuelve', () => {
    const result = validateLitter(litter({ deliversFrom: ` ${TODAY} ` }), PUBLISH)
    expect(result.ok && result.data.deliversFrom).toBe(TODAY)
  })

  it('una edad de más de 25 años si no se tocó al editar', () => {
    const options = { ...SAVE, ageUnchanged: true }
    expect(validateLitter(litter({ ageValue: '26', ageUnit: 'years' }), options).ok).toBe(true)
  })
})

describe('validateLitter rechaza lo común', () => {
  it('marca cada obligatorio a la vez', () => {
    const errors = errorsOf(
      litter({
        name: '  ',
        species: '',
        ageValue: '',
        size: '',
        isNeutered: '',
        vaccines: '',
        hasChip: '',
        department: '',
        locality: '',
      }),
    )
    expect(errors.fields).toEqual({
      name: { key: 'pets.errors.name_required' },
      species: { key: 'pets.errors.species_required' },
      age: { key: 'pets.errors.age_required' },
      size: { key: 'pets.errors.size_required' },
      isNeutered: { key: 'pets.errors.neutered_required' },
      vaccines: { key: 'pets.errors.vaccines_required' },
      hasChip: { key: 'pets.errors.chip_required' },
      department: { key: 'pets.errors.department_required' },
      locality: { key: 'pets.errors.locality_required' },
    })
    expect(errors.young).toEqual({})
    expect(errors.count).toBeNull()
  })

  it('el nombre de 31 caracteres y la descripción de 2001', () => {
    const errors = errorsOf(litter({ name: 'a'.repeat(31), description: 'b'.repeat(2001) }))
    expect(errors.fields).toEqual({
      name: { key: 'pets.errors.name_too_long' },
      description: { key: 'pets.errors.description_too_long' },
    })
  })

  it('solo la edad, con todo lo demás bien', () => {
    expect(errorsOf(litter({ ageValue: '' })).fields).toEqual({
      age: { key: 'pets.errors.age_required' },
    })
  })

  it('una camada sin especie válida, aunque las crías estén bien', () => {
    expect(errorsOf(litter({ species: 'bird' })).fields).toEqual({
      species: { key: 'pets.errors.species_required' },
    })
  })

  it('no recibe sexo: es de cada cría', () => {
    expect(validateLitter(litter({ sex: 'cualquiera' }), PUBLISH).ok).toBe(true)
  })
})

describe('validateLitter rechaza una cría', () => {
  it('sin nombre y sin sexo, marcada por su clave', () => {
    const errors = errorsOf(litter({ young: [young('1', { name: ' ', sex: '' }), young('2')] }))
    expect(errors.young).toEqual({
      '1': {
        name: { key: 'litters.errors.young_name_required' },
        sex: { key: 'pets.errors.sex_required' },
      },
    })
    expect(errors.fields).toEqual({})
  })

  it('con el nombre de 31 caracteres y la descripción de 301', () => {
    const errors = errorsOf(
      litter({
        young: [young('1', { name: 'a'.repeat(31), description: 'b'.repeat(301) }), young('2')],
      }),
    )
    expect(errors.young['1']).toEqual({
      name: { key: 'litters.errors.young_name_too_long' },
      description: { key: 'litters.errors.young_description_too_long' },
    })
  })

  it('acepta 30 en el nombre y 300 en la descripción', () => {
    const edge = young('1', { name: 'a'.repeat(30), description: 'b'.repeat(300) })
    expect(validateLitter(litter({ young: [edge, young('2')] }), PUBLISH).ok).toBe(true)
  })

  it('con el nombre de otra, con otra mayúscula y espacios: se marca la que repite', () => {
    const errors = errorsOf(
      litter({ young: [young('1', { name: 'Cría 1' }), young('2', { name: ' cría 1 ' })] }),
    )
    expect(errors.young).toEqual({ '2': { name: { key: 'litters.errors.young_name_repeated' } } })
  })

  it('el repetido no tapa otro error del nombre', () => {
    const errors = errorsOf(
      litter({
        young: [young('1', { name: 'Tito 099123456' }), young('2', { name: 'Tito 099123456' })],
      }),
    )
    expect(errors.young['2']?.name?.key).toBe('pets.errors.contact_phone')
  })
})

describe('validateLitter cuenta las crías', () => {
  it('una sola al publicar', () => {
    expect(errorsOf(litter({ young: [young('1')] })).count).toEqual({
      key: 'litters.errors.young_too_few',
    })
  })

  it('ninguna al guardar', () => {
    expect(errorsOf(litter({ young: [] }), SAVE).count).toEqual({
      key: 'litters.errors.young_too_few',
    })
  })

  it('once', () => {
    const eleven = Array.from({ length: 11 }, (_, index) => young(String(index + 1)))
    expect(errorsOf(litter({ young: eleven })).count).toEqual({
      key: 'litters.errors.young_too_many',
    })
    expect(errorsOf(litter({ young: eleven }), SAVE).count?.key).toBe(
      'litters.errors.young_too_many',
    )
  })

  it('sin la lista o con otra cosa, ninguna', () => {
    for (const input of [{ ...litter(), young: 'dos' }, null, 'una camada']) {
      const errors = errorsOf(input)
      expect(errors.count?.key).toBe('litters.errors.young_too_few')
      expect(errors.young).toEqual({})
      // Al guardar alcanza una: cero sigue siendo poco.
      expect(errorsOf(input, SAVE).count?.key).toBe('litters.errors.young_too_few')
    }
  })
})

describe('validateLitter y la fecha de entrega', () => {
  it('rechaza la de ayer', () => {
    expect(errorsOf(litter({ deliversFrom: '2026-10-24' })).fields).toEqual({
      deliversFrom: { key: 'litters.errors.delivery_date_past' },
    })
  })

  it('rechaza la que no es un día', () => {
    expect(errorsOf(litter({ deliversFrom: '2026-02-30' })).fields.deliversFrom?.key).toBe(
      'litters.errors.delivery_date_invalid',
    )
  })
})

describe('deliveryProblem', () => {
  const options = { today: TODAY, storedDeliversFrom: null }

  it('sin fecha, nada', () => {
    expect(deliveryProblem('', options)).toBeNull()
  })

  it('hoy y mañana sirven', () => {
    expect(deliveryProblem(TODAY, options)).toBeNull()
    expect(deliveryProblem('2026-10-26', options)).toBeNull()
  })

  it('ayer no', () => {
    expect(deliveryProblem('2026-10-24', options)).toBe('litters.errors.delivery_date_past')
  })

  it('la guardada que ya pasó no traba; otra pasada sí', () => {
    const stored = { today: TODAY, storedDeliversFrom: '2026-10-01' }
    expect(deliveryProblem('2026-10-01', stored)).toBeNull()
    expect(deliveryProblem('2026-10-02', stored)).toBe('litters.errors.delivery_date_past')
  })

  it('lo que no es un día del calendario', () => {
    for (const value of [
      '25/10/2026',
      '2026-1-5',
      '2026-13-01',
      'x2026-10-25',
      '2026-10-25x',
      '+002026-10-25',
    ]) {
      expect(deliveryProblem(value, options)).toBe('litters.errors.delivery_date_invalid')
    }
  })
})

describe('las vías de contacto, en los cuatro textos', () => {
  const errors = errorsOf(
    litter({
      name: 'Luna 099123456',
      description: 'Escribime a ana@example.test',
      locality: 'Pocitos',
      young: [
        young('1', { name: 'Tito @tito_gatito' }),
        young('2', { description: 'Mirá www.example.test' }),
      ],
    }),
  )

  it('cada texto se rechaza con su motivo y el fragmento', () => {
    expect(errors.fields.name).toEqual({
      key: 'pets.errors.contact_phone',
      values: { fragment: '099123456' },
    })
    expect(errors.fields.description?.key).toBe('pets.errors.contact_email')
    expect(errors.young['1']?.name?.key).toBe('pets.errors.contact_social')
    expect(errors.young['2']?.description?.key).toBe('pets.errors.contact_web')
  })

  it('la medición recibe solo el campo y el tipo', () => {
    expect(litterContactRejections(errors)).toEqual([
      { field: 'name', kind: 'phone' },
      { field: 'description', kind: 'email' },
      { field: 'name', kind: 'social' },
      { field: 'description', kind: 'web' },
    ])
  })

  it('un error que no es de contacto no se mide', () => {
    expect(
      litterContactRejections({
        fields: {
          name: { key: 'pets.errors.name_required' },
          // Lo que sigue al largo del prefijo es «phone», pero no empieza con el prefijo.
          description: { key: 'litters.errors.youngphone' },
          locality: { key: 'pets.errors.contact_otro' },
        },
        young: {},
        count: null,
      }),
    ).toEqual([])
  })

  it('la localidad con un teléfono también', () => {
    const local = errorsOf(litter({ locality: 'Pocitos 099123456' }))
    expect(litterContactRejections(local)).toEqual([{ field: 'locality', kind: 'phone' }])
  })
})
