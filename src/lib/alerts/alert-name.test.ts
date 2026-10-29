// Covers: FR-011, US1-AS1, US1-AS5, US1-AS9 (el aviso en palabras, el mismo en «Mis avisos» y en el
// correo; research R10)
import { describe, expect, it } from 'vitest'
import { NO_FILTERS } from '@/lib/pets/listing-query'
import { alertName, type AlertNameWords } from './alert-name'
import type { AlertFilters } from './types'

const g = (masculine: string, feminine = masculine) => ({ masculine, feminine })

const WORDS: AlertNameWords = {
  all: 'Todos los animales en adopción',
  animals: 'Animales',
  species: { dog: g('Perros', 'Perras'), cat: g('Gatos', 'Gatas') },
  sexNoun: { male: 'Machos', female: 'Hembras' },
  males: 'machos',
  size: { small: g('chicos', 'chicas'), medium: g('medianos', 'medianas'), large: g('grandes') },
  age: {
    puppy: g('cachorros', 'cachorras'),
    young: g('jóvenes'),
    adult: g('adultos', 'adultas'),
    senior: g('mayores'),
  },
  neutered: g('castrados', 'castradas'),
  or: 'o',
  inDepartment: (department) => `en ${department === 'UY-MO' ? 'Montevideo' : 'Canelones'}`,
}

const name = (filters: Partial<AlertFilters>) => alertName({ ...NO_FILTERS, ...filters }, WORDS)

describe('alertName', () => {
  it('sin filtros son todos los animales en adopción', () => {
    expect(name({})).toBe('Todos los animales en adopción')
  })

  it('una especie va en plural', () => {
    expect(name({ species: ['dog'] })).toBe('Perros')
    expect(name({ species: ['cat'] })).toBe('Gatos')
  })

  it('sin especie y con un sexo, el sexo es el sustantivo', () => {
    expect(name({ sex: ['male'] })).toBe('Machos')
    expect(name({ sex: ['female'], size: ['small'] })).toBe('Hembras chicas')
  })

  it('sin especie ni sexo son animales', () => {
    expect(name({ size: ['large'] })).toBe('Animales grandes')
  })

  it('las dos especies o los dos sexos no eligen sustantivo', () => {
    expect(name({ species: ['dog', 'cat'], sex: ['male', 'female'], neutered: ['yes'] })).toBe(
      'Animales castrados',
    )
  })

  it('solo hembras concuerda todo en femenino', () => {
    expect(
      name({
        species: ['dog'],
        sex: ['female'],
        size: ['small', 'medium'],
        age: ['puppy', 'adult'],
        neutered: ['yes'],
        department: ['UY-MO'],
      }),
    ).toBe('Perras chicas o medianas cachorras o adultas castradas en Montevideo')
  })

  it('solo machos con especie lo dice después del sustantivo', () => {
    expect(name({ species: ['cat'], sex: ['male'], age: ['young'] })).toBe('Gatos machos jóvenes')
  })

  it('une tamaños y tramos de edad con «o»', () => {
    expect(name({ size: ['small', 'medium', 'large'] })).toBe(
      'Animales chicos o medianos o grandes',
    )
    expect(name({ age: ['young', 'senior'] })).toBe('Animales jóvenes o mayores')
  })

  it('castrados y el departamento', () => {
    expect(name({ neutered: ['yes'] })).toBe('Animales castrados')
    expect(name({ department: ['UY-CA'] })).toBe('Animales en Canelones')
  })

  it('todo junto', () => {
    expect(name({ species: ['dog'], size: ['small', 'medium'], department: ['UY-MO'] })).toBe(
      'Perros chicos o medianos en Montevideo',
    )
  })
})
