// Covers: US1-AS6, US1-AS7, US1-AS9, US2-AS6, FR-009, FR-010, FR-011, FR-014, FR-016 y los Edge
// Cases «Edad en el borde», «Nombre con espacios de más» y «Nombre de más de 30 caracteres».
import { describe, expect, it } from 'vitest'
import { contactRejections, validatePet, type PetFieldErrors } from './pet'

function pet(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Luna',
    species: 'dog',
    sex: 'female',
    ageValue: '2',
    ageUnit: 'months',
    size: 'medium',
    isNeutered: 'yes',
    vaccines: 'up_to_date',
    hasChip: 'no',
    goodWithKids: 'unknown',
    goodWithDogs: 'yes',
    goodWithCats: 'no',
    description: '',
    department: 'UY-MO',
    locality: 'Pocitos',
    isUrgent: false,
    ...overrides,
  }
}

const NEW = { ageUnchanged: false }

function errorsOf(overrides: Record<string, unknown>, options = NEW): PetFieldErrors {
  const result = validatePet(pet(overrides), options)
  if (result.ok) throw new Error('se esperaba un rechazo')
  return result.errors
}

describe('validatePet acepta', () => {
  it('lo obligatorio, y devuelve los datos listos para guardar', () => {
    expect(validatePet(pet(), NEW)).toEqual({
      ok: true,
      data: {
        name: 'Luna',
        species: 'dog',
        sex: 'female',
        age: { value: 2, unit: 'months' },
        size: 'medium',
        isNeutered: true,
        vaccines: 'up_to_date',
        hasChip: false,
        goodWithKids: 'unknown',
        goodWithDogs: 'yes',
        goodWithCats: 'no',
        description: null,
        department: 'UY-MO',
        locality: 'Pocitos',
        isUrgent: false,
      },
    })
  })

  it('limpia los espacios del principio y el final del nombre, no los de adentro', () => {
    const result = validatePet(pet({ name: '  Luna  gris ' }), NEW)
    expect(result.ok && result.data.name).toBe('Luna  gris')
  })

  it('junta los espacios de la localidad y guarda la descripción recortada', () => {
    const result = validatePet(
      pet({ locality: ' Villa   25 de Agosto ', description: '  Es tranquila. ', isUrgent: true }),
      NEW,
    )
    expect(result.ok && result.data.locality).toBe('Villa 25 de Agosto')
    expect(result.ok && result.data.description).toBe('Es tranquila.')
    expect(result.ok && result.data.isUrgent).toBe(true)
  })

  it('años, sí y no', () => {
    const result = validatePet(
      pet({ ageValue: ' 25 ', ageUnit: 'years', isNeutered: 'no', hasChip: 'yes' }),
      NEW,
    )
    expect(result.ok && result.data.age).toEqual({ value: 25, unit: 'years' })
    expect(result.ok && result.data.isNeutered).toBe(false)
    expect(result.ok && result.data.hasChip).toBe(true)
  })

  it('12 años es una edad común', () => {
    expect(validatePet(pet({ ageValue: '12', ageUnit: 'years' }), NEW).ok).toBe(true)
  })

  it('los bordes de cada unidad', () => {
    expect(validatePet(pet({ ageValue: '1', ageUnit: 'months' }), NEW).ok).toBe(true)
    expect(validatePet(pet({ ageValue: '11', ageUnit: 'months' }), NEW).ok).toBe(true)
    expect(validatePet(pet({ ageValue: '1', ageUnit: 'years' }), NEW).ok).toBe(true)
  })

  it('30 caracteres de nombre y 2000 de descripción justos, con emojis contando uno', () => {
    const name = `${'a'.repeat(28)}🇺🇾🐶`
    expect(validatePet(pet({ name, description: 'b'.repeat(2000) }), NEW).ok).toBe(true)
  })

  it('una localidad de 60 caracteres justos', () => {
    expect(validatePet(pet({ locality: 'a'.repeat(60) }), NEW).ok).toBe(true)
  })
})

describe('validatePet marca cada campo con su problema', () => {
  it('todos los que faltan a la vez, un error por campo', () => {
    const errors = errorsOf({
      name: '   ',
      species: '',
      sex: '',
      ageValue: '',
      size: '',
      isNeutered: '',
      vaccines: '',
      hasChip: '',
      goodWithKids: 'tal vez',
      department: '',
      locality: '',
    })
    expect(errors).toEqual({
      name: { key: 'pets.errors.name_required' },
      species: { key: 'pets.errors.species_required' },
      sex: { key: 'pets.errors.sex_required' },
      age: { key: 'pets.errors.age_required' },
      size: { key: 'pets.errors.size_required' },
      isNeutered: { key: 'pets.errors.neutered_required' },
      vaccines: { key: 'pets.errors.vaccines_required' },
      hasChip: { key: 'pets.errors.chip_required' },
      goodWithKids: { key: 'pets.errors.good_with_required' },
      department: { key: 'pets.errors.department_required' },
      locality: { key: 'pets.errors.locality_required' },
    })
  })

  it('una opción fuera de la lista', () => {
    expect(errorsOf({ species: 'bird', goodWithDogs: '', goodWithCats: 'x' })).toEqual({
      species: { key: 'pets.errors.species_required' },
      goodWithDogs: { key: 'pets.errors.good_with_required' },
      goodWithCats: { key: 'pets.errors.good_with_required' },
    })
    expect(errorsOf({ department: 'UY-XX' })).toEqual({
      department: { key: 'pets.errors.department_required' },
    })
    expect(errorsOf({ department: 7 })).toEqual({
      department: { key: 'pets.errors.department_required' },
    })
  })

  it('el largo, sin cortar: 31 y 2001', () => {
    expect(errorsOf({ name: 'a'.repeat(31), description: 'b'.repeat(2001) })).toEqual({
      name: { key: 'pets.errors.name_too_long' },
      description: { key: 'pets.errors.description_too_long' },
    })
    expect(errorsOf({ locality: 'a'.repeat(61) })).toEqual({
      locality: { key: 'pets.errors.locality_too_long' },
    })
  })

  it('el contacto en los tres campos, con el fragmento que lo disparó', () => {
    expect(
      errorsOf({
        name: 'Luna 099123456',
        description: 'Escribime a ana@gmail.com',
        locality: '@pocitos',
      }),
    ).toEqual({
      name: { key: 'pets.errors.contact_phone', values: { fragment: '099123456' } },
      description: { key: 'pets.errors.contact_email', values: { fragment: 'ana@gmail.com' } },
      locality: { key: 'pets.errors.contact_social', values: { fragment: '@pocitos' } },
    })
    expect(errorsOf({ description: 'wa.me/1' }).description).toEqual({
      key: 'pets.errors.contact_web',
      values: { fragment: 'wa.me/1' },
    })
  })

  it('el número de puerta en la localidad, pero no en la descripción', () => {
    expect(errorsOf({ locality: 'Av. Italia 3456' })).toEqual({
      locality: { key: 'pets.errors.locality_street_number' },
    })
    expect(validatePet(pet({ description: 'Vive en Av. Italia 3456' }), NEW).ok).toBe(true)
  })

  it('la edad sin unidad, fuera de rango, con decimales o con letras', () => {
    const age = (ageValue: string, ageUnit: string) => errorsOf({ ageValue, ageUnit }).age
    expect(age('3', '')).toEqual({ key: 'pets.errors.age_unit_required' })
    expect(age('3', 'weeks')).toEqual({ key: 'pets.errors.age_unit_required' })
    expect(age('0', 'months')).toEqual({ key: 'pets.errors.age_range' })
    expect(age('13', 'months')).toEqual({ key: 'pets.errors.age_range' })
    expect(age('0', 'years')).toEqual({ key: 'pets.errors.age_range' })
    expect(age('26', 'years')).toEqual({ key: 'pets.errors.age_range' })
    expect(age('30', 'years')).toEqual({ key: 'pets.errors.age_range' })
    expect(age('2.5', 'years')).toEqual({ key: 'pets.errors.age_range' })
    expect(age('dos', 'years')).toEqual({ key: 'pets.errors.age_range' })
    expect(age('-1', 'years')).toEqual({ key: 'pets.errors.age_range' })
  })

  it('12 meses sugiere cargarlo como 1 año', () => {
    expect(errorsOf({ ageValue: '12', ageUnit: 'months' }).age).toEqual({
      key: 'pets.errors.age_twelve_months',
    })
  })

  it('la edad se marca junto con los demás campos que fallan', () => {
    expect(errorsOf({ name: '', ageValue: '40', ageUnit: 'years' })).toEqual({
      name: { key: 'pets.errors.name_required' },
      age: { key: 'pets.errors.age_range' },
    })
  })

  it('una entrada que no es un objeto no pasa', () => {
    const result = validatePet(null, NEW)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.age).toEqual({ key: 'pets.errors.age_required' })
    expect(!result.ok && result.errors.name).toBeUndefined()
  })

  it('un texto suelto tampoco', () => {
    const result = validatePet('Luna', NEW)
    expect(!result.ok && result.errors.age).toEqual({ key: 'pets.errors.age_required' })
  })

  it('una edad que no es texto cuenta como vacía', () => {
    expect(errorsOf({ ageValue: 3 }).age).toEqual({ key: 'pets.errors.age_required' })
  })
})

describe('validatePet con la edad sin tocar', () => {
  const UNCHANGED = { ageUnchanged: true }

  it('26 años pasan si no se tocó la edad, y se rechazan si se cambió', () => {
    expect(validatePet(pet({ ageValue: '26', ageUnit: 'years' }), UNCHANGED).ok).toBe(true)
    expect(validatePet(pet({ ageValue: '12', ageUnit: 'months' }), UNCHANGED).ok).toBe(true)
    expect(validatePet(pet({ ageValue: '1', ageUnit: 'years' }), UNCHANGED).ok).toBe(true)
    expect(errorsOf({ ageValue: '26', ageUnit: 'years' }, NEW).age).toEqual({
      key: 'pets.errors.age_range',
    })
  })

  it('igual tiene que ser un entero positivo con su unidad', () => {
    expect(errorsOf({ ageValue: '0', ageUnit: 'years' }, UNCHANGED).age).toEqual({
      key: 'pets.errors.age_range',
    })
    expect(errorsOf({ ageValue: '2', ageUnit: '' }, UNCHANGED).age).toEqual({
      key: 'pets.errors.age_unit_required',
    })
  })
})

describe('contactRejections', () => {
  it('lista los campos rechazados por contacto con su tipo, y nada más', () => {
    expect(
      contactRejections({
        name: { key: 'pets.errors.contact_phone', values: { fragment: '099123456' } },
        species: { key: 'pets.errors.species_required' },
        locality: { key: 'pets.errors.contact_social', values: { fragment: '@x' } },
        sex: { key: 'pets.errors.contact_email' },
        size: { key: 'pets.errors.contact_web' },
        description: { key: 'pets.errors.contact_fax' },
      }),
    ).toEqual([
      { field: 'name', kind: 'phone' },
      { field: 'sex', kind: 'email' },
      { field: 'size', kind: 'web' },
      { field: 'locality', kind: 'social' },
    ])
    expect(contactRejections({})).toEqual([])
  })
})
