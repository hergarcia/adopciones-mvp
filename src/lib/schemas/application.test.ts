// Covers: FR-020, FR-021, FR-022, FR-023, FR-024, US1-AS4, US1-AS5, US1-AS6, US1-AS7
import { describe, expect, it } from 'vitest'
import { formErrorKey, validateApplication } from './application'

const COMPLETE = {
  housing_type: 'apartment',
  housing_tenure: 'owned',
  outdoor_space: 'netted_balcony',
  household: 'Mi pareja y yo.',
  other_pets: 'Ninguno.',
  hours_alone: '4_to_8',
  moving_plan: 'Se viene conmigo.',
  experience: 'Tuve una perra 12 años.',
  vet_budget: 'tight',
  why_this_pet: 'Porque es tranquilo.',
}

const NEUTERED = { isNeutered: true }
const NOT_NEUTERED = { isNeutered: false }

describe('validateApplication', () => {
  it('completo, con un animal castrado y vivienda propia, pasa con las respuestas recortadas', () => {
    expect(
      validateApplication({ ...COMPLETE, household: '  Mi pareja y yo.  ' }, NEUTERED),
    ).toEqual({ ok: true, data: COMPLETE })
  })

  it('cada pregunta es obligatoria y se marcan todas a la vez', () => {
    expect(validateApplication({}, NOT_NEUTERED)).toEqual({
      ok: false,
      errors: {
        housing_type: { key: 'applications.errors.choice_required' },
        housing_tenure: { key: 'applications.errors.choice_required' },
        outdoor_space: { key: 'applications.errors.choice_required' },
        household: { key: 'applications.errors.text_required' },
        other_pets: { key: 'applications.errors.text_required' },
        hours_alone: { key: 'applications.errors.choice_required' },
        moving_plan: { key: 'applications.errors.text_required' },
        experience: { key: 'applications.errors.text_required' },
        neuter_commitment: { key: 'applications.errors.choice_required' },
        vet_budget: { key: 'applications.errors.choice_required' },
        why_this_pet: { key: 'applications.errors.text_required' },
      },
    })
  })

  it('lo que no es un objeto cuenta como sin contestar', () => {
    for (const input of [null, 'housing_type', 3]) {
      const result = validateApplication(input, NEUTERED)
      expect(result.ok ? null : Object.keys(result.errors)).toHaveLength(10)
    }
  })

  it('una respuesta que no es texto cuenta como sin contestar', () => {
    expect(validateApplication({ ...COMPLETE, household: 42 }, NEUTERED)).toEqual({
      ok: false,
      errors: { household: { key: 'applications.errors.text_required' } },
    })
  })

  it('una respuesta de solo espacios cuenta como sin contestar', () => {
    expect(validateApplication({ ...COMPLETE, why_this_pet: ' \n\t ' }, NEUTERED)).toEqual({
      ok: false,
      errors: { why_this_pet: { key: 'applications.errors.text_required' } },
    })
  })

  it('500 caracteres pasan; 501 no', () => {
    expect(validateApplication({ ...COMPLETE, experience: 'a'.repeat(500) }, NEUTERED).ok).toBe(
      true,
    )
    expect(validateApplication({ ...COMPLETE, experience: 'a'.repeat(501) }, NEUTERED)).toEqual({
      ok: false,
      errors: { experience: { key: 'applications.errors.too_long' } },
    })
  })

  it('el largo se cuenta en puntos de código, como la base', () => {
    expect(validateApplication({ ...COMPLETE, experience: '😀'.repeat(500) }, NEUTERED).ok).toBe(
      true,
    )
  })

  it('una opción que no existe no vale', () => {
    expect(validateApplication({ ...COMPLETE, hours_alone: 'never' }, NEUTERED)).toEqual({
      ok: false,
      errors: { hours_alone: { key: 'applications.errors.choice_required' } },
    })
  })

  it('alquilada sin el permiso del dueño falla en esa pregunta', () => {
    expect(validateApplication({ ...COMPLETE, housing_tenure: 'rented' }, NEUTERED)).toEqual({
      ok: false,
      errors: { rental_allows_pets: { key: 'applications.errors.choice_required' } },
    })
  })

  it('alquilada con el permiso lo manda', () => {
    expect(
      validateApplication(
        { ...COMPLETE, housing_tenure: 'rented', rental_allows_pets: 'unsure' },
        NEUTERED,
      ),
    ).toEqual({
      ok: true,
      data: { ...COMPLETE, housing_tenure: 'rented', rental_allows_pets: 'unsure' },
    })
  })

  it('propia con un permiso escrito antes lo descarta', () => {
    expect(validateApplication({ ...COMPLETE, rental_allows_pets: 'yes' }, NEUTERED)).toEqual({
      ok: true,
      data: COMPLETE,
    })
  })

  it('castrado sin compromiso pasa, y con compromiso lo descarta', () => {
    expect(validateApplication(COMPLETE, NEUTERED).ok).toBe(true)
    expect(validateApplication({ ...COMPLETE, neuter_commitment: 'yes' }, NEUTERED)).toEqual({
      ok: true,
      data: COMPLETE,
    })
  })

  it('sin castrar sin compromiso falla; con compromiso lo manda', () => {
    expect(validateApplication(COMPLETE, NOT_NEUTERED)).toEqual({
      ok: false,
      errors: { neuter_commitment: { key: 'applications.errors.choice_required' } },
    })
    expect(validateApplication({ ...COMPLETE, neuter_commitment: 'no' }, NOT_NEUTERED)).toEqual({
      ok: true,
      data: { ...COMPLETE, neuter_commitment: 'no' },
    })
  })

  it('un contacto en cualquier respuesta de texto marca esa respuesta con el tipo y el fragmento', () => {
    expect(
      validateApplication(
        {
          ...COMPLETE,
          household: 'Escribime a ana@example.test',
          other_pets: 'Mirá @tobi_uy',
          moving_plan: 'Llamame al 099 123 456',
          experience: 'Ver www.ejemplo.com',
          why_this_pet: 'Mi cel 091234567',
        },
        NEUTERED,
      ),
    ).toEqual({
      ok: false,
      errors: {
        household: {
          key: 'applications.errors.contact_email',
          values: { fragment: 'ana@example.test' },
        },
        other_pets: { key: 'applications.errors.contact_social', values: { fragment: '@tobi_uy' } },
        moving_plan: {
          key: 'applications.errors.contact_phone',
          values: { fragment: '099 123 456' },
        },
        experience: {
          key: 'applications.errors.contact_web',
          values: { fragment: 'www.ejemplo.com' },
        },
        why_this_pet: {
          key: 'applications.errors.contact_phone',
          values: { fragment: '091234567' },
        },
      },
    })
  })

  it('lo que no es una pregunta no se manda', () => {
    expect(validateApplication({ ...COMPLETE, phone: '099123456' }, NEUTERED)).toEqual({
      ok: true,
      data: COMPLETE,
    })
  })
})

describe('formErrorKey', () => {
  it('con un contacto entre los errores, el aviso es el del contacto', () => {
    expect(
      formErrorKey({
        household: { key: 'applications.errors.text_required' },
        why_this_pet: {
          key: 'applications.errors.contact_phone',
          values: { fragment: '091234567' },
        },
      }),
    ).toBe('applications.errors.contact')
  })

  it('sin contactos, el de las que faltan', () => {
    expect(formErrorKey({ household: { key: 'applications.errors.text_required' } })).toBe(
      'applications.errors.missing',
    )
  })
})
