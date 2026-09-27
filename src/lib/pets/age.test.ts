// Covers: US2-AS2, FR-010 y los Edge Cases «Edad que avanza a otra unidad», «más allá de 25 años»
// y «Editar sin tocar la edad».
import { describe, expect, it, vi } from 'vitest'

// Lejos de Montevideo, así un formateador sin zona horaria daría otro día.
vi.hoisted(() => {
  process.env.TZ = 'Asia/Tokyo'
})

import { ageOn, monthsBetween, resolveAgeOnSave, uruguayDay, type StoredAge } from './age'

describe('uruguayDay', () => {
  it('da el día de Montevideo, que a la noche es el anterior al de UTC', () => {
    expect(uruguayDay(new Date('2026-03-02T02:30:00Z'))).toBe('2026-03-01')
    expect(uruguayDay(new Date('2026-03-02T03:30:00Z'))).toBe('2026-03-02')
  })
})

describe('monthsBetween', () => {
  it('el mismo día es cero', () => {
    expect(monthsBetween('2026-01-15', '2026-01-15')).toBe(0)
  })

  it('cuenta el mes al llegar al mismo día, no antes', () => {
    expect(monthsBetween('2026-01-15', '2026-02-14')).toBe(0)
    expect(monthsBetween('2026-01-15', '2026-02-15')).toBe(1)
    expect(monthsBetween('2026-01-15', '2026-02-16')).toBe(1)
  })

  it('un mes sin ese día lo cumple en su último día', () => {
    expect(monthsBetween('2026-01-31', '2026-02-27')).toBe(0)
    expect(monthsBetween('2026-01-31', '2026-02-28')).toBe(1)
    expect(monthsBetween('2028-01-31', '2028-02-28')).toBe(0)
    expect(monthsBetween('2028-01-31', '2028-02-29')).toBe(1)
    expect(monthsBetween('2026-01-31', '2026-03-30')).toBe(1)
    expect(monthsBetween('2026-01-31', '2026-03-31')).toBe(2)
  })

  it('cruza el cambio de año', () => {
    expect(monthsBetween('2025-12-15', '2026-01-14')).toBe(0)
    expect(monthsBetween('2025-12-15', '2026-01-15')).toBe(1)
    expect(monthsBetween('2025-11-10', '2027-02-10')).toBe(15)
  })

  it('una fecha anterior no da meses negativos', () => {
    expect(monthsBetween('2026-05-10', '2026-03-01')).toBe(0)
  })
})

describe('ageOn', () => {
  const stored = (value: number, unit: 'months' | 'years', asOf = '2026-01-10'): StoredAge => ({
    value,
    unit,
    asOf,
  })

  it('el mismo día muestra lo que se cargó', () => {
    expect(ageOn(stored(2, 'months'), '2026-01-10')).toEqual({ value: 2, unit: 'months' })
    expect(ageOn(stored(3, 'years'), '2026-01-10')).toEqual({ value: 3, unit: 'years' })
  })

  it('2 meses, un mes después, son 3', () => {
    expect(ageOn(stored(2, 'months'), '2026-02-10')).toEqual({ value: 3, unit: 'months' })
  })

  it('11 meses, un mes después, es 1 año', () => {
    expect(ageOn(stored(11, 'months'), '2026-02-09')).toEqual({ value: 11, unit: 'months' })
    expect(ageOn(stored(11, 'months'), '2026-02-10')).toEqual({ value: 1, unit: 'years' })
  })

  it('23 meses siguen siendo 1 año: redondea hacia abajo', () => {
    expect(ageOn(stored(11, 'months'), '2027-01-10')).toEqual({ value: 1, unit: 'years' })
    expect(ageOn(stored(11, 'months'), '2027-02-10')).toEqual({ value: 2, unit: 'years' })
  })

  it('los años avanzan y pasan de 25', () => {
    expect(ageOn(stored(2, 'years'), '2027-01-09')).toEqual({ value: 2, unit: 'years' })
    expect(ageOn(stored(2, 'years'), '2027-01-10')).toEqual({ value: 3, unit: 'years' })
    expect(ageOn(stored(25, 'years'), '2028-01-10')).toEqual({ value: 27, unit: 'years' })
  })
})

describe('resolveAgeOnSave', () => {
  const stored: StoredAge = { value: 2, unit: 'years', asOf: '2026-01-10' }
  const base: StoredAge = { value: 11, unit: 'months', asOf: '2026-02-01' }
  const shown = { value: 2, unit: 'years' as const }
  const common = { base, shown, stored, publishedOn: '2025-12-01', today: '2026-03-01' }

  it('igual a lo mostrado devuelve la base tal cual, aunque haya pasado un aniversario', () => {
    const decision = resolveAgeOnSave({ ...common, submitted: { value: '2', unit: 'years' } })
    expect(decision).toEqual({ unchanged: true, age: base })
  })

  it('ignora los espacios de lo mandado', () => {
    const decision = resolveAgeOnSave({ ...common, submitted: { value: ' 2 ', unit: 'years' } })
    expect(decision.unchanged).toBe(true)
  })

  it('sin tocar, una edad de hoy de más de 25 años sigue siendo la base', () => {
    const old: StoredAge = { value: 25, unit: 'years', asOf: '2025-12-01' }
    const decision = resolveAgeOnSave({
      ...common,
      base: old,
      stored: old,
      shown: { value: 27, unit: 'years' },
      submitted: { value: '27', unit: 'years' },
    })
    expect(decision).toEqual({ unchanged: true, age: old })
  })

  it('otro valor o la misma cifra en otra unidad es una edad nueva', () => {
    expect(resolveAgeOnSave({ ...common, submitted: { value: '3', unit: 'years' } })).toEqual({
      unchanged: false,
    })
    expect(resolveAgeOnSave({ ...common, submitted: { value: '2', unit: 'months' } })).toEqual({
      unchanged: false,
    })
  })

  it('una base con el día de publicación o de hoy vale', () => {
    const onPublish = { ...base, asOf: '2025-12-01' }
    const onToday = { ...base, asOf: '2026-03-01' }
    const submitted = { value: '2', unit: 'years' }
    expect(resolveAgeOnSave({ ...common, base: onPublish, submitted })).toEqual({
      unchanged: true,
      age: onPublish,
    })
    expect(resolveAgeOnSave({ ...common, base: onToday, submitted })).toEqual({
      unchanged: true,
      age: onToday,
    })
  })

  it('una base posterior a hoy o anterior a la publicación se descarta por la guardada', () => {
    const submitted = { value: '2', unit: 'years' }
    const future = { ...base, asOf: '2026-03-02' }
    const beforePublish = { ...base, asOf: '2025-11-30' }
    expect(resolveAgeOnSave({ ...common, base: future, submitted })).toEqual({
      unchanged: true,
      age: stored,
    })
    expect(resolveAgeOnSave({ ...common, base: beforePublish, submitted })).toEqual({
      unchanged: true,
      age: stored,
    })
  })
})
