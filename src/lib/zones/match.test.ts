import { describe, expect, it } from 'vitest'
import { matchLocalities } from './match'

const LOCALITIES = [
  'Cordón',
  'Ciudad Vieja',
  'Pocitos',
  'Punta Carretas',
  'Punta Gorda',
  'Parque Rodó',
  'Peñarol',
  'Malvín',
  'Malvín Norte',
  'Jardines del Hipódromo',
]

// Covers: US2-AS2, FR-019, FR-019a. Quien escribe en un teléfono no pone tildes.
describe('las sugerencias de localidad', () => {
  it('encuentran sin tildes lo que sí las tiene', () => {
    expect(matchLocalities(LOCALITIES, 'cordon')).toEqual(['Cordón'])
  })

  it('encuentran sin importar mayúsculas', () => {
    expect(matchLocalities(LOCALITIES, 'POCI')).toEqual(['Pocitos'])
  })

  it('siguen sugiriendo aunque el texto ya coincida, si está escrito distinto', () => {
    expect(matchLocalities(LOCALITIES, 'POCITOS')).toEqual(['Pocitos'])
  })

  it('ignoran los espacios de los costados', () => {
    expect(matchLocalities(LOCALITIES, '  pocit  ')).toEqual(['Pocitos'])
  })

  it('ponen primero lo que empieza igual', () => {
    expect(matchLocalities(LOCALITIES, 'punta')).toEqual(['Punta Carretas', 'Punta Gorda'])
  })

  it('después lo que solo contiene el texto', () => {
    expect(matchLocalities(LOCALITIES, 'norte')).toEqual(['Malvín Norte'])
  })

  it('lo que empieza igual le gana a lo que solo contiene', () => {
    expect(matchLocalities(LOCALITIES, 'p')[0]).toBe('Pocitos')
  })

  it('con el nombre escrito exactamente igual no sugieren nada: no hay qué elegir', () => {
    expect(matchLocalities(LOCALITIES, 'Cordón')).toEqual([])
  })

  it('pero sin la tilde sí lo sugieren, que es cuando más hace falta', () => {
    expect(matchLocalities(LOCALITIES, 'cordon')).toEqual(['Cordón'])
  })

  it('un espacio al final no cuenta como texto distinto: tampoco sugieren nada', () => {
    expect(matchLocalities(LOCALITIES, 'Cordón ')).toEqual([])
  })

  it('sin texto no sugieren nada', () => {
    expect(matchLocalities(LOCALITIES, '')).toEqual([])
    expect(matchLocalities(LOCALITIES, '   ')).toEqual([])
  })

  it('cuando ninguna coincide, la lista queda vacía y lo escrito vale igual', () => {
    expect(matchLocalities(LOCALITIES, 'Chuy')).toEqual([])
  })

  it('la comparación baja a minúsculas: no alcanza con quitar las tildes', () => {
    expect(matchLocalities(['POCITOS PLAZA'], 'pocitos')).toEqual(['POCITOS PLAZA'])
  })

  it('lo que empieza igual va antes aunque en la lista esté después', () => {
    const list = ['Malvín Norte', 'Norte Chico']
    expect(matchLocalities(list, 'norte')).toEqual(['Norte Chico', 'Malvín Norte'])
  })

  it('no alcanza con que termine igual: tiene que contenerlo', () => {
    expect(matchLocalities(['Pocitos'], 'tos')).toEqual(['Pocitos'])
    expect(matchLocalities(['Pocitos'], 'xyz')).toEqual([])
  })

  it('cortan en el límite que se les pida', () => {
    expect(matchLocalities(LOCALITIES, 'a', 3)).toHaveLength(3)
  })

  it('el límite por defecto es de ocho', () => {
    const many = Array.from({ length: 30 }, (_, i) => `Barrio ${i}`)
    expect(matchLocalities(many, 'barrio')).toHaveLength(8)
  })
})
