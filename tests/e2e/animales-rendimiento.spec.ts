import { expect, test, type Page } from '@playwright/test'
import { publishForRun, removeRunOwner, type RunPet } from './support/listed-pets'
import { signIn } from './support/pet-owner'
import { scriptWeight, throttleLikeAPhone, vitalsOf, withoutCache } from './support/web-vitals'

// SC-001 de la historia #57 en las dos pantallas que nombra docs/07 §Presupuesto, y en «Mis
// animales», con la red y la CPU de un teléfono de gama media emuladas: la portada y el nombre en
// menos de 2,5 s y sin saltos. `.lighthouserc.json` mide solo la portada (KL-57-3), así que esto es
// lo que mide el listado y la ficha. Los umbrales son los de la spec, sin margen. El peso de
// apertura y el total se anotan (historia #95, research R1); el freno sobre ellos llega con US3.
const LCP_MS = 2_500
const CLS = 0.05
const MISSING_CODE = 'NoExiste0000'

function litter(count: number): RunPet[] {
  const tag = Math.random().toString(36).slice(2, 7)
  return Array.from({ length: count }, (_, index) => ({
    name: `${tag} ${index + 1}`,
    species: 'dog' as const,
    department: 'UY-RO',
    locality: 'La Paloma',
  }))
}

const kb = (bytes: number) => (bytes / 1024).toFixed(1)

async function measure(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'load' })
  const vitals = await vitalsOf(page)
  const weight = await scriptWeight(page)
  test.info().annotations.push({
    type: 'rendimiento',
    description: `${path}: LCP ${Math.round(vitals.lcp)} ms, CLS ${vitals.cls.toFixed(3)}, JS de apertura ${kb(weight.open)} KB, JS total ${kb(weight.total)} KB`,
  })
  return { ...vitals, ...weight }
}

test('el listado, la ficha y «Mis animales» cargan como pide el presupuesto', async ({ page }) => {
  test.setTimeout(240_000)
  const { owner, pets } = await publishForRun(litter(8), { photo: { grain: true } })
  await throttleLikeAPhone(page)
  await withoutCache(page)

  const sheet = await measure(page, `/animales/${pets[7].code}`)
  expect(sheet.lcp, 'LCP de la ficha, en ms').toBeLessThan(LCP_MS)
  expect(sheet.cls, 'CLS de la ficha').toBeLessThan(CLS)

  await measure(page, `/animales/${MISSING_CODE}`)

  const listing = await measure(page, '/animales?departamento=rocha')
  expect(listing.lcp, 'LCP del listado, en ms').toBeLessThan(LCP_MS)
  expect(listing.cls, 'CLS del listado').toBeLessThan(CLS)

  await measure(page, '/animales')
  await measure(page, '/')

  await signIn(page, owner.email, '/mis-animales')
  await expect(page).toHaveURL(/mis-animales/)
  await page.waitForLoadState('networkidle')
  // En el origen de la página: el enlace de ingreso deja la sesión en el dominio de `APP_URL`.
  const mine = await measure(page, `${new URL(page.url()).origin}/mis-animales`)
  expect(mine.lcp, 'LCP de «Mis animales», en ms').toBeLessThan(LCP_MS)
  expect(mine.cls, 'CLS de «Mis animales»').toBeLessThan(CLS)
  await removeRunOwner(owner.id)
})
