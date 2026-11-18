import { expect, test, type Page, type Route } from '@playwright/test'
import { sendApplication } from './support/applications'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { signIn } from './support/pet-owner'

// Historia #318: lo que se abre con un toque contesta aunque su capa no haya llegado. Cada prueba
// corta solo el archivo que trae la capa (lo reconoce por su contenido), así el resto de la pantalla
// llega como siempre.

const FAILED = 'No pudimos traer esta parte. Revisá la señal y probá de nuevo.'
// Clases que solo están en la capa de `Sheet` y `Dialog`, y en la lista de `Select`.
const OVERLAY_LAYER = 'md:max-w-sheet'
const SELECT_LAYER = 'radix-select-content-available-height'

type Signal = 'up' | 'down' | 'hold'

// El archivo con `marker`: llega (`up`), no llega (`down`) o queda colgado hasta `release` (`hold`).
async function cutLayer(page: Page, marker: string) {
  let signal: Signal = 'up'
  const held: (() => Promise<void>)[] = []
  await page.route('**/_next/static/chunks/*.js', async (route: Route) => {
    const response = await route.fetch()
    const body = await response.text()
    if (!body.includes(marker) || signal === 'up') return route.fulfill({ response, body })
    if (signal === 'down') return route.abort()
    // Lo que quedó colgado de una pantalla que ya se fue no tiene a quién llegar.
    held.push(() => route.fulfill({ response, body }).catch(() => {}))
    return undefined
  })
  return {
    set: (next: Signal) => {
      signal = next
    },
    release: async () => {
      signal = 'up'
      await Promise.all(held.splice(0).map((fulfill) => fulfill()))
    },
  }
}

async function receivedApplication() {
  const { owner, pets } = await publishForRun([{ name: 'Luna', species: 'dog', isNeutered: true }])
  const ana = await newPerson('Ana Prueba', { level: 1 })
  const id = await sendApplication(ana.id, pets[0]?.code ?? '')
  return {
    owner,
    path: `/solicitudes/${id}`,
    cleanup: async () => {
      await removePerson(ana)
      await removeRunOwner(owner.id)
    },
  }
}

const notice = (page: Page) => page.getByRole('alert').filter({ hasText: FAILED })

// Covers: criterios 1, 2, 3 y 5 de #318
test('en una solicitud, «Aceptar» y «Rechazar» trabajan mientras llega la hoja y avisan si no llega', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const run = await receivedApplication()
  try {
    const layer = await cutLayer(page, OVERLAY_LAYER)
    layer.set('hold')
    await signIn(page, run.owner.email, run.path)
    await expect(page.getByRole('heading', { level: 1, name: 'Ana Prueba' })).toBeVisible()

    const accept = page.getByRole('button', { name: 'Aceptar solicitud', exact: true })
    await accept.click()
    await expect(accept).toHaveAttribute('aria-busy', 'true')
    // El segundo toque no cierra ni abre nada.
    await accept.dispatchEvent('click')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await layer.release()
    const confirm = page.getByRole('dialog', { name: '¿Aceptar a Ana Prueba?' })
    await expect(confirm).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await expect
      .poll(() => confirm.evaluate((dialog) => dialog.contains(document.activeElement)))
      .toBe(true)
    await page.keyboard.press('Escape')
    await expect(confirm).toBeHidden()

    // Sin señal: el aviso debajo, tres veces, y nada se rechaza.
    await page.reload()
    layer.set('down')
    const reject = page.getByRole('button', { name: 'Rechazar', exact: true })
    await expect(reject).toBeVisible()
    await page.waitForLoadState('networkidle')
    await reject.click()
    await expect(notice(page)).toBeVisible()
    await expect(reject).not.toHaveAttribute('aria-busy', 'true')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    for (let attempt = 0; attempt < 3; attempt += 1) {
      // oxlint-disable-next-line no-await-in-loop -- un toque por vez, como los da una persona
      await page.getByRole('button', { name: 'Reintentar' }).click()
      // oxlint-disable-next-line no-await-in-loop
      await expect(notice(page)).toHaveCount(1)
    }
    await expect(page.getByRole('heading', { level: 1, name: 'Ana Prueba' })).toBeVisible()

    layer.set('up')
    await page.getByRole('button', { name: 'Reintentar' }).click()
    await expect(
      page.getByRole('dialog', { name: '¿Por qué no seguís con Ana Prueba?' }),
    ).toBeVisible()
    await expect(notice(page)).toHaveCount(0)
    await page.keyboard.press('Escape')

    // Con buena señal la hoja abre sin pasar por trabajando.
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Rechazar', exact: true }).click()
    await expect(
      page.getByRole('dialog', { name: '¿Por qué no seguís con Ana Prueba?' }),
    ).toBeVisible()
  } finally {
    await run.cleanup()
  }
})

// Covers: criterio 3 de #318 (los 10 segundos)
test('si la hoja tarda más de 10 segundos, avisa y no se abre sola cuando llega', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const run = await receivedApplication()
  try {
    const layer = await cutLayer(page, OVERLAY_LAYER)
    layer.set('hold')
    await signIn(page, run.owner.email, run.path)
    const reject = page.getByRole('button', { name: 'Rechazar', exact: true })
    await reject.click()
    await expect(reject).toHaveAttribute('aria-busy', 'true')
    await expect(notice(page)).toBeVisible({ timeout: 15_000 })
    await expect(reject).not.toHaveAttribute('aria-busy', 'true')
    await layer.release()
    await page.waitForTimeout(1_000)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await reject.click()
    await expect(
      page.getByRole('dialog', { name: '¿Por qué no seguís con Ana Prueba?' }),
    ).toBeVisible()
  } finally {
    await run.cleanup()
  }
})

// Covers: criterio 4 de #318
test('en el listado, «Departamento» sin su lista avisa debajo y los animales siguen a la vista', async ({
  page,
}) => {
  const { owner, pets } = await publishForRun([
    { name: 'Nina', species: 'cat', department: 'UY-CA', locality: 'Pando' },
  ])
  try {
    const list = await cutLayer(page, SELECT_LAYER)
    list.set('down')
    await page.goto('/animales')
    const department = page.getByRole('combobox', { name: 'Departamento', exact: true })
    await expect.poll(() => department.evaluate((element) => element.tagName)).toBe('BUTTON')
    await department.click()
    await expect(notice(page)).toBeVisible()
    await expect(page.getByText(pets[0]?.name ?? '').first()).toBeVisible()

    list.set('up')
    await page.getByRole('button', { name: 'Reintentar' }).click()
    await page.getByRole('option', { name: 'Canelones', exact: true }).click()
    await expect(page).toHaveURL(/departamento=canelones/)
    await expect(notice(page)).toHaveCount(0)
  } finally {
    await removeRunOwner(owner.id)
  }
})
