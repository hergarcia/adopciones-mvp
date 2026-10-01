// Covers: FR-017, FR-017a, US3-AS5, US3-AS8 y los Edge Cases «Filtros repetidos o mezclados»,
// «Castrado», «Marcar todas las opciones», «Enlace del listado copiado después de "Ver más"» y
// «Enlace con agregados de otras apps».
import { describe, expect, it } from 'vitest'
import {
  NO_FILTERS,
  filterKey,
  filterOptions,
  formatAddedOptions,
  hasFilters,
  isCanonicalListingQuery,
  listingHref,
  parseAddedOptions,
  parseListingQuery,
  parseMarked,
  queryOf,
  type ListingFilters,
} from './listing-query'

const filters = (partial: Partial<ListingFilters>): ListingFilters => ({
  ...NO_FILTERS,
  ...partial,
})

describe('parseListingQuery', () => {
  it('sin nada es el listado sin filtros, de a 24', () => {
    expect(parseListingQuery({})).toEqual({ filters: NO_FILTERS, shown: 24 })
  })

  it('lee cada clave con sus valores en español y los devuelve en claves de dominio', () => {
    const query = {
      especie: 'gato',
      sexo: 'hembra',
      tamano: 'chico,grande',
      edad: 'cachorro,mayor',
      departamento: 'canelones,cerro-largo,paysandu,treinta-y-tres',
      castrado: 'si',
    }
    expect(parseListingQuery(query).filters).toEqual({
      species: ['cat'],
      sex: ['female'],
      size: ['small', 'large'],
      age: ['puppy', 'senior'],
      department: ['UY-CA', 'UY-CL', 'UY-PA', 'UY-TT'],
      neutered: ['yes'],
    })
  })

  it('ignora claves y valores que no existen, sin tirar los válidos del mismo filtro', () => {
    const query = { especie: 'perro,dragon', color: 'negro', fbclid: 'abc', edad: 'viejo' }
    expect(parseListingQuery(query).filters).toEqual(filters({ species: ['dog'] }))
  })

  it('repetidos, mayúsculas, vacíos y el orden no cambian nada', () => {
    const query = { tamano: 'GRANDE,,chico,grande', departamento: ['salto', 'artigas', 'Salto'] }
    expect(parseListingQuery(query).filters).toEqual(
      filters({ size: ['small', 'large'], department: ['UY-AR', 'UY-SA'] }),
    )
  })

  it('lee la forma repetida del formulario sin ejecutar', () => {
    expect(parseListingQuery({ especie: ['perro'], sexo: ['macho', 'hembra'] }).filters).toEqual(
      filters({ species: ['dog'] }),
    )
  })

  it('todas las opciones de un filtro son ninguna, salvo castrado', () => {
    const query = {
      especie: 'perro,gato',
      edad: 'cachorro,joven,adulto,mayor',
      castrado: 'si',
    }
    expect(parseListingQuery(query).filters).toEqual(filters({ neutered: ['yes'] }))
  })

  it.each([
    ['48', 48],
    ['72', 72],
    ['240', 240],
    ['24', 24],
    ['264', 24],
    ['50', 24],
    ['0', 24],
    ['-48', 24],
    ['cuarenta', 24],
    ['', 24],
  ])('mostrar=%s muestra %i', (value, shown) => {
    expect(parseListingQuery({ mostrar: value }).shown).toBe(shown)
  })

  it('mostrar repetido toma el primero', () => {
    expect(parseListingQuery({ mostrar: ['72', '48'] }).shown).toBe(72)
  })
})

describe('parseMarked', () => {
  it('deja todas las opciones marcadas, como las dejó la persona', () => {
    expect(parseMarked({ especie: 'gato,perro', castrado: 'si', edad: 'nada' })).toEqual(
      filters({ species: ['dog', 'cat'], neutered: ['yes'] }),
    )
  })
})

describe('listingHref', () => {
  it('sin filtros es /animales', () => {
    expect(listingHref(NO_FILTERS)).toBe('/animales')
    expect(listingHref(NO_FILTERS, 24)).toBe('/animales')
  })

  it('escribe las claves y los valores en el orden de la tabla, con mostrar al final', () => {
    const chosen = filters({
      neutered: ['yes'],
      department: ['UY-SA', 'UY-CA'],
      age: ['senior', 'puppy'],
      size: ['large'],
      sex: ['male'],
      species: ['cat'],
    })
    expect(listingHref(chosen, 48)).toBe(
      '/animales?especie=gato&sexo=macho&tamano=grande&edad=cachorro,mayor&departamento=canelones,salto&castrado=si&mostrar=48',
    )
  })

  it('todas las opciones de un filtro no se escriben', () => {
    expect(listingHref(filters({ species: ['dog', 'cat'] }))).toBe('/animales')
  })

  it('ida y vuelta con parseListingQuery', () => {
    const chosen = filters({ species: ['dog'], department: ['UY-RN', 'UY-SJ'] })
    const search = new URLSearchParams(listingHref(chosen, 72).split('?')[1])
    expect(parseListingQuery(queryOf(search))).toEqual({ filters: chosen, shown: 72 })
  })
})

describe('isCanonicalListingQuery', () => {
  it('la dirección que el sitio arma es canónica', () => {
    expect(isCanonicalListingQuery({})).toBe(true)
    expect(isCanonicalListingQuery({ especie: undefined })).toBe(true)
    expect(isCanonicalListingQuery({ especie: 'gato', edad: 'cachorro', mostrar: '48' })).toBe(true)
  })

  it.each([
    [{ fbclid: 'abc' }],
    [{ especie: ['perro', 'gato'] }],
    [{ especie: ['perro'], sexo: ['macho'], castrado: ['si', 'si'] }],
    [{ edad: 'mayor,cachorro' }],
    [{ edad: 'cachorro', especie: 'gato' }],
    [{ mostrar: '24' }],
    [{ especie: 'PERRO' }],
  ])('%j redirige', (query) => {
    expect(isCanonicalListingQuery(query)).toBe(false)
  })
})

describe('hasFilters', () => {
  it('dice si hay alguno marcado', () => {
    expect(hasFilters(NO_FILTERS)).toBe(false)
    expect(hasFilters(filters({ neutered: ['yes'] }))).toBe(true)
    expect(hasFilters(filters({ age: ['young'] }))).toBe(true)
  })
})

describe('filterKey', () => {
  it('es la clave de la dirección', () => {
    expect(filterKey('species')).toBe('especie')
    expect(filterKey('neutered')).toBe('castrado')
  })
})

describe('filterOptions', () => {
  it('da las opciones en el orden de la tabla', () => {
    expect(filterOptions('age')).toEqual(['puppy', 'young', 'adult', 'senior'])
    expect(filterOptions('department')).toHaveLength(19)
  })
})

describe('queryOf', () => {
  it('junta las claves repetidas', () => {
    expect(queryOf(new URLSearchParams('a=1&b=2&a=3'))).toEqual({ a: ['1', '3'], b: ['2'] })
  })
})

describe('las opciones sumadas', () => {
  it('ida y vuelta en claves de dominio', () => {
    const added = [
      { filter: 'species' as const, option: 'cat' as const },
      { filter: 'department' as const, option: 'UY-CA' as const },
      { filter: 'neutered' as const, option: 'yes' as const },
    ]
    expect(formatAddedOptions(added)).toBe('especie.gato,departamento.canelones,castrado.si')
    expect(parseAddedOptions(formatAddedOptions(added))).toEqual(added)
  })

  it('descarta lo que no existe y lo repetido', () => {
    expect(
      parseAddedOptions('especie.dragon,color.negro,edad,edad.cachorro,edad.cachorro,.gato'),
    ).toEqual([{ filter: 'age', option: 'puppy' }])
    expect(parseAddedOptions(null)).toEqual([])
    expect(parseAddedOptions('')).toEqual([])
  })
})
