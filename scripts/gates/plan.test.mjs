import { describe, expect, it } from 'vitest'
import { pendingAfter, planGates, planRetry } from './plan.mjs'

const SPECS = [
  'tests/e2e/animales-rendimiento.spec.ts',
  'tests/e2e/animales.spec.ts',
  'tests/e2e/publicar.spec.ts',
]
const BUDGET = ['tests/e2e/animales-rendimiento.spec.ts']

describe('qué corre gates:affected', () => {
  it('una función pura cambiada no pide la suite entera ni el build', () => {
    expect(planGates(['src/lib/pets/draft.ts'], SPECS)).toEqual({ wholeSuite: false, e2e: [] })
  })

  it.each([
    'supabase/migrations/20261005000000_reports.sql',
    'supabase/seed.sql',
    'package.json',
    'pnpm-lock.yaml',
    'tsconfig.json',
    'vitest.config.ts',
    'tests/setup/database.ts',
  ])('%s pide la suite entera, que --changed no elegiría', (file) => {
    expect(planGates([file], SPECS).wholeSuite).toBe(true)
  })

  it.each([
    'src/components/pets/pet-card.tsx',
    'src/app/[locale]/(public)/animales/page.tsx',
    'src/app/[locale]/(public)/animales/loading.ts',
    'src/styles/globals.css',
    'messages/es.json',
    'public/og.png',
    'next.config.ts',
  ])('un cambio de pantalla (%s) mide el presupuesto de peso', (file) => {
    expect(planGates([file], SPECS).e2e).toEqual(BUDGET)
  })

  it('un test de un componente no es un cambio de pantalla', () => {
    expect(planGates(['src/components/pets/pet-card.test.tsx'], SPECS).e2e).toEqual([])
  })

  it('corre el spec que cambió, junto con los de peso si además cambió una pantalla', () => {
    expect(planGates(['tests/e2e/publicar.spec.ts'], SPECS).e2e).toEqual([
      'tests/e2e/publicar.spec.ts',
    ])
    expect(
      planGates(['tests/e2e/publicar.spec.ts', 'src/components/pets/pet-card.tsx'], SPECS).e2e,
    ).toEqual(['tests/e2e/animales-rendimiento.spec.ts', 'tests/e2e/publicar.spec.ts'])
  })

  it('un spec borrado no se pide', () => {
    expect(planGates(['tests/e2e/viejo.spec.ts'], SPECS).e2e).toEqual([])
  })

  it.each(['tests/e2e/support/sign-in.ts', 'playwright.config.ts'])(
    '%s pide todos los e2e',
    (file) => {
      expect(planGates([file], SPECS).e2e).toBe('all')
    },
  )

  it('lo que no es suite entera no la pide aunque pida todos los e2e', () => {
    expect(planGates(['tests/e2e/support/sign-in.ts'], SPECS).wholeSuite).toBe(false)
  })
})

const NOTHING = { tests: { whole: false, files: [] }, mutation: false, e2e: [] }

describe('qué corre el reintento de gates:affected', () => {
  it('un arreglo a la migración corre la prueba que falló, no la suite entera', () => {
    const pending = { ...NOTHING, tests: { whole: false, files: ['tests/db/pets.test.ts'] } }
    const plan = planRetry(pending, ['supabase/migrations/20261026000000_pets.sql'], SPECS)
    expect(plan).toEqual({
      wholeSuite: false,
      failedTests: ['tests/db/pets.test.ts'],
      mutation: 'fix',
      e2e: [],
    })
  })

  it.each(['package.json', 'vitest.config.ts', 'tests/setup/database.ts'])(
    'un arreglo que toca %s vuelve a pedir la suite entera',
    (file) => {
      const pending = { ...NOTHING, tests: { whole: false, files: ['tests/db/pets.test.ts'] } }
      expect(planRetry(pending, [file], SPECS)).toMatchObject({ wholeSuite: true, failedTests: [] })
    },
  )

  it('una corrida cuyas pruebas fallaron sin nombrar un archivo se repite entera', () => {
    const pending = { ...NOTHING, tests: { whole: true, files: [] } }
    expect(planRetry(pending, ['src/lib/pets/draft.ts'], SPECS).wholeSuite).toBe(true)
  })

  it('la mutación que quedó roja o sin correr se repite con su alcance; si no, la del arreglo', () => {
    expect(planRetry({ ...NOTHING, mutation: true }, [], SPECS).mutation).toBe('pending')
    expect(planRetry(NOTHING, ['src/lib/pets/draft.ts'], SPECS).mutation).toBe('fix')
  })

  it('los e2e que quedaron pendientes se suman a los que pide el arreglo, sin repetirse', () => {
    const pending = { ...NOTHING, e2e: ['tests/e2e/publicar.spec.ts', ...BUDGET] }
    expect(planRetry(pending, ['src/components/pets/pet-card.tsx'], SPECS).e2e).toEqual([
      ...BUDGET,
      'tests/e2e/publicar.spec.ts',
    ])
  })

  it('todos los e2e pendientes, o un arreglo al soporte de e2e, piden todos', () => {
    expect(planRetry({ ...NOTHING, e2e: 'all' }, [], SPECS).e2e).toBe('all')
    expect(planRetry(NOTHING, ['tests/e2e/support/login.ts'], SPECS).e2e).toBe('all')
  })

  it('un arreglo que no tocó nada no agrega pruebas', () => {
    expect(planRetry(NOTHING, [], SPECS)).toEqual({
      wholeSuite: false,
      failedTests: [],
      mutation: 'fix',
      e2e: [],
    })
  })
})

describe('qué deja pendiente una corrida', () => {
  const run = {
    failedTestFiles: [],
    testsCrashed: false,
    mutationPassed: true,
    e2ePassed: true,
    e2e: [],
  }

  it('una corrida verde no deja nada', () => {
    expect(pendingAfter(run)).toEqual(NOTHING)
  })

  it('los archivos que fallaron, sin repetir y en orden', () => {
    const files = ['tests/db/b.test.ts', 'tests/db/a.test.ts', 'tests/db/b.test.ts']
    expect(pendingAfter({ ...run, failedTestFiles: files }).tests).toEqual({
      whole: false,
      files: ['tests/db/a.test.ts', 'tests/db/b.test.ts'],
    })
  })

  it('pruebas que fallaron sin nombrar un archivo piden la suite entera', () => {
    expect(
      pendingAfter({ ...run, failedTestFiles: ['x.test.ts'], testsCrashed: true }).tests,
    ).toEqual({
      whole: true,
      files: [],
    })
  })

  it('la mutación y los e2e que no pasaron quedan pendientes, con los specs que tenían', () => {
    const e2e = ['tests/e2e/publicar.spec.ts']
    expect(pendingAfter({ ...run, mutationPassed: false, e2ePassed: false, e2e })).toMatchObject({
      mutation: true,
      e2e,
    })
    expect(pendingAfter({ ...run, e2ePassed: true, e2e }).e2e).toEqual([])
  })
})
