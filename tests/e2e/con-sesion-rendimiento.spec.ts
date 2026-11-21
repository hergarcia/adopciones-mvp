import { expect, test, type Page } from '@playwright/test'
import { sendApplication } from './support/applications'
import { publishForRun, publishLitterForRun, removeRunOwner } from './support/listed-pets'
import { withoutCache } from './support/opening-weight'
import { newPerson, removePerson } from './support/people'
import { service, signIn } from './support/pet-owner'
import {
  expectOpenWithin,
  expectTotalWithin,
  expectVitals,
  measure,
  type Measured,
} from './support/screen-budget'
import { throttleLikeAPhone } from './support/web-vitals'

// El freno de las pantallas con sesión del camino a adoptar y de las que más usa quien publica
// (historia #304): el mismo presupuesto que la ficha (docs/07 §Presupuesto de performance).
// Los totales de `main` antes de #304, iguales en tres corridas: impiden esconder peso de apertura
// corriéndolo a después de abrir.
const APPLY_TOTAL_KB = 206
const MY_PETS_TOTAL_KB = 234.7
const PUBLISH_TOTAL_KB = 259.9
const PET_INBOX_TOTAL_KB = 155.6
const APPLICATION_TOTAL_KB = 207.9
const STEP_MS = 200

function expectWithin(screen: string, measured: Measured, totalKb: number) {
  expectVitals(screen, measured)
  expectOpenWithin(screen, measured)
  expectTotalWithin(screen, measured, totalKb)
}

const group = (page: Page, legend: string) => page.getByRole('group', { name: legend })

async function answer(page: Page, legend: string, option: string) {
  await group(page, legend).getByRole('radio', { name: option, exact: true }).check()
  await page.getByRole('button', { name: 'Siguiente' }).click()
}

// Desde el toque hasta el primer cuadro con el paso nuevo, medido en la página: el viaje de ida y
// vuelta de Playwright no es parte de lo que ve la persona.
async function stepDelay(page: Page, button: string, progress: string): Promise<number> {
  return page.evaluate(
    ({ name, text }) =>
      new Promise<number>((resolve) => {
        const target = Array.from(document.querySelectorAll('button')).find(
          (candidate) => candidate.textContent.trim() === name,
        )
        const start = performance.now()
        const observer = new MutationObserver(() => {
          if (!document.body.innerText.includes(text)) return
          observer.disconnect()
          requestAnimationFrame(() => resolve(performance.now() - start))
        })
        observer.observe(document.body, { subtree: true, childList: true, characterData: true })
        target?.click()
      }),
    { name: button, text: progress },
  )
}

async function petId(code: string): Promise<string> {
  const { data } = await service().from('pets').select('id').eq('code', code).single()
  return String(data?.id ?? '')
}

async function youngCode(litterId: string): Promise<string> {
  const { data } = await service()
    .from('pets')
    .select('code')
    .eq('litter_id', litterId)
    .order('name')
    .limit(1)
    .single()
  return String(data?.code ?? '')
}

test('el cuestionario, «Mis animales», publicar y las solicitudes abren dentro de los 150 KB', async ({
  page,
}) => {
  test.setTimeout(300_000)
  const { owner, pets } = await publishForRun(
    [{ name: 'Luna', species: 'dog', isNeutered: true }],
    { photo: { grain: true } },
  )
  const code = pets[0]?.code ?? ''
  const litter = await publishLitterForRun(owner.id, 4, { photo: { grain: true } })
  const adopter = await newPerson('Dani Prueba', { level: 1 })
  const other = await newPerson('Sole Prueba', { level: 1 })
  try {
    const applicationId = await sendApplication(other.id, code)
    const young = await youngCode(litter.id)

    await signIn(page, adopter.email, `/solicitar/${code}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Solicitar a Luna' })).toBeVisible()
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    await withoutCache(page)

    const applyPath = `${origin}/solicitar/${code}`
    expectWithin('El cuestionario', await measure(page, applyPath), APPLY_TOTAL_KB)
    expectWithin(
      'El cuestionario de una cría',
      await measure(page, `${origin}/solicitar/${young}?camada=${litter.code}`),
      APPLY_TOTAL_KB,
    )

    await page.goto(applyPath, { waitUntil: 'networkidle' })
    await answer(page, '¿Dónde vivís?', 'Apartamento')
    await answer(page, '¿Es propia o alquilada?', 'Propia')
    await expect(page.getByText('3 de 10', { exact: true })).toBeVisible()
    await group(page, '¿Tenés patio o balcón?')
      .getByRole('radio', { name: 'Balcón con red', exact: true })
      .check()
    const forward = await stepDelay(page, 'Siguiente', '4 de 10')
    const backward = await stepDelay(page, 'Anterior', '3 de 10')
    test.info().annotations.push({
      type: 'rendimiento',
      description: `cuestionario: «Siguiente» ${Math.round(forward)} ms, «Anterior» ${Math.round(backward)} ms`,
    })
    expect(forward, 'de la pregunta 3 a la 4 con «Siguiente», en ms').toBeLessThan(STEP_MS)
    expect(backward, 'de la pregunta 4 a la 3 con «Anterior», en ms').toBeLessThan(STEP_MS)

    await page.context().clearCookies()
    await signIn(page, owner.email, '/mis-animales')
    await expect(page).toHaveURL(/mis-animales/)
    const publisherOrigin = new URL(page.url()).origin

    expectWithin(
      '«Mis animales»',
      await measure(page, `${publisherOrigin}/mis-animales`),
      MY_PETS_TOTAL_KB,
    )
    expectWithin(
      '«Publicar un animal»',
      await measure(page, `${publisherOrigin}/mis-animales/publicar?tipo=animal`),
      PUBLISH_TOTAL_KB,
    )
    expectWithin(
      'Las solicitudes de Luna',
      await measure(page, `${publisherOrigin}/solicitudes/animal/${await petId(code)}`),
      PET_INBOX_TOTAL_KB,
    )
    expectWithin(
      'Una solicitud recibida',
      await measure(page, `${publisherOrigin}/solicitudes/${applicationId}`),
      APPLICATION_TOTAL_KB,
    )
  } finally {
    await removePerson(adopter)
    await removePerson(other)
    await removeRunOwner(owner.id)
  }
})
