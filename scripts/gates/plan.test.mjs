import { describe, expect, it } from 'vitest'
import { planGates } from './plan.mjs'

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
