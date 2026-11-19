import { expect, test, type Page } from '@playwright/test'
import { acceptApplication, sendApplication, verifiedNumber, written } from './support/applications'
import { cutLayer, OVERLAY_LAYER, partFailedNotice } from './support/cut-layer'
import { publishForRun, publishLitterForRun, removeRunOwner } from './support/listed-pets'
import { withoutCache } from './support/opening-weight'
import { newPerson, removePerson } from './support/people'
import { service, signIn } from './support/pet-owner'
import {
  expectOpenWithin,
  expectTotalWithin,
  expectVitals,
  LCP_MS,
  measure,
  type Measured,
} from './support/screen-budget'
import { settled, slowActions } from './support/slow-server'
import { expectAnswered, timeTap } from './support/tap-latency'
import { throttleLikeAPhone } from './support/web-vitals'

// Historia #324: las cuatro pantallas a las que se vuelve mientras se espera una respuesta entran al
// presupuesto del camino a adoptar (docs/07 §Presupuesto de performance), con red y procesador de
// teléfono de gama media. Los totales de `main` antes de #324, redondeados hacia arriba al décimo de
// KB, impiden esconder peso de apertura corriéndolo a después de abrir.
const INBOX_TOTAL_KB = 141.2
const MY_PET_TOTAL_KB = 184.5
const MY_APPLICATIONS_TOTAL_KB = 144.6
const MY_APPLICATION_TOTAL_KB = 168.8
const CONTACT = 'El contacto'

function expectWithin(screen: string, measured: Measured, totalKb: number) {
  expectVitals(screen, measured)
  expectOpenWithin(screen, measured)
  expectTotalWithin(screen, measured, totalKb)
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

async function statusOf(id: string): Promise<string> {
  const { data } = await service().from('applications').select('status').eq('id', id).single()
  return String(data?.status ?? '')
}

async function withdraw(applicantId: string, id: string): Promise<void> {
  const { error } = await service().rpc('withdraw_application', {
    p_applicant: applicantId,
    p_id: id,
  })
  expect(error).toBeNull()
}

// En qué cuadro se vio por primera vez cada texto, en ms desde que empezó a abrir la pantalla: el
// contacto tiene que estar a la vista dentro del tope de lo principal, y no llegar después.
async function firstSeen(page: Page, path: string, texts: string[]): Promise<number[]> {
  await page.addInitScript((wanted) => {
    const seen: number[] = wanted.map(() => Number.POSITIVE_INFINITY)
    Reflect.set(window, '__firstSeen', seen)
    const visible = (text: string) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const parent = node.parentElement
        if (node.textContent?.includes(text) === true && parent?.checkVisibility() === true) {
          return true
        }
      }
      return false
    }
    const frame = (now: number) => {
      if (document.body !== null) {
        wanted.forEach((text, index) => {
          if (seen[index] === Number.POSITIVE_INFINITY && visible(text)) seen[index] = now
        })
      }
      if (seen.includes(Number.POSITIVE_INFINITY) && now < 10_000) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, texts)
  await page.goto(path, { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  return page.evaluate(() => {
    const seen: unknown = Reflect.get(window, '__firstSeen')
    return Array.isArray(seen) ? seen.map(Number) : []
  })
}

// Covers: criterios 1, 2 y 5 de #324
test('«Solicitudes recibidas», un animal, «Mis solicitudes» y «Mi solicitud» abren dentro de los 150 KB', async ({
  page,
}) => {
  test.setTimeout(300_000)
  const { owner, pets } = await publishForRun(
    [
      { name: 'Luna', species: 'dog', isNeutered: true },
      { name: 'Tobi', species: 'dog', sex: 'male', isNeutered: true },
      { name: 'Nina', species: 'cat', isNeutered: true },
    ],
    { photo: { grain: true } },
  )
  const [luna, tobi, nina] = pets.map((pet) => pet.code)
  const litter = await publishLitterForRun(owner.id, 3, { photo: { grain: true } })
  const dani = await newPerson('Dani Prueba', { level: 1 })
  try {
    // Una cerrada primero, así quedan tres activas: la aceptada, una esperando y la de la cría.
    await withdraw(dani.id, await sendApplication(dani.id, nina))
    const accepted = await sendApplication(dani.id, luna)
    const waiting = await sendApplication(dani.id, tobi)
    await sendApplication(dani.id, await youngCode(litter.id), { neuter_commitment: 'yes' })
    await acceptApplication(owner.id, accepted)
    const number = written(await verifiedNumber(owner.id))

    await signIn(page, owner.email, '/solicitudes')
    await expect(page.getByRole('heading', { level: 1, name: 'Solicitudes' })).toBeVisible()
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    await withoutCache(page)
    const inbox = await measure(page, `${origin}/solicitudes`)
    const myPet = await measure(page, `${origin}/mis-animales/${await petId(luna)}`)

    await page.context().clearCookies()
    await signIn(page, dani.email, '/mis-solicitudes')
    await expect(page).toHaveURL(/mis-solicitudes/)
    const adopterOrigin = new URL(page.url()).origin
    const myApplications = await measure(page, `${adopterOrigin}/mis-solicitudes`)
    const myApplication = await measure(page, `${adopterOrigin}/mis-solicitudes/${accepted}`)
    const contact = [CONTACT, 'Ana Prueba', number, 'Abrir WhatsApp']
    const seen = await firstSeen(page, `${adopterOrigin}/mis-solicitudes/${accepted}`, contact)
    test.info().annotations.push({
      type: 'rendimiento',
      description: `contacto en «Mi solicitud»: ${seen.map(Math.round).join(', ')} ms`,
    })

    expectWithin('«Solicitudes recibidas»', inbox, INBOX_TOTAL_KB)
    expectWithin('La página de Luna en «Mis animales»', myPet, MY_PET_TOTAL_KB)
    expectWithin('«Mis solicitudes»', myApplications, MY_APPLICATIONS_TOTAL_KB)
    expectWithin('«Mi solicitud» aceptada', myApplication, MY_APPLICATION_TOTAL_KB)
    contact.forEach((text, index) => {
      expect(seen[index], `«${text}» en «Mi solicitud» aceptada, en ms`).toBeLessThan(LCP_MS)
    })

    // Sin aceptar, ni el número ni el lugar donde iría.
    await page.goto(`${adopterOrigin}/mis-solicitudes/${waiting}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1, name: 'Tobi' })).toBeVisible()
    await expect(page.getByText(number)).toHaveCount(0)
    await expect(page.getByText('Abrir WhatsApp')).toHaveCount(0)
    await expect(page.getByRole('region', { name: CONTACT })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: CONTACT })).toHaveCount(0)
  } finally {
    await removePerson(dani)
    await removeRunOwner(owner.id)
  }
})

// Covers: criterio 4 de #324
test('«Retirar solicitud» contesta en menos de 200 ms, abre una sola pregunta y avisa si no llega', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const { owner, pets } = await publishForRun([{ name: 'Tobi', species: 'dog', sex: 'male' }])
  const dani = await newPerson('Dani Prueba', { level: 1 })
  try {
    const id = await sendApplication(dani.id, pets[0]?.code ?? '')
    const path = `/mis-solicitudes/${id}`
    await signIn(page, dani.email, path)
    await expect(page.getByRole('heading', { level: 1, name: 'Tobi' })).toBeVisible()
    const origin = new URL(page.url()).origin
    const layer = await cutLayer(page, OVERLAY_LAYER)
    await throttleLikeAPhone(page)
    const actions = await slowActions(page)
    await settled(page, `${origin}${path}`)

    const trigger = page.getByRole('button', { name: 'Retirar solicitud', exact: true })
    const name = '«Retirar solicitud» en «Mi solicitud»'
    const ms = await timeTap(page, name, () => trigger.dblclick(), [
      { selector: '[role="dialog"]', text: '¿Retirar tu solicitud por Tobi?' },
    ])
    expectAnswered(name, ms)
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(actions.count(), 'acciones que salieron sin confirmar').toBe(0)
    expect(await statusOf(id), 'sin confirmar, la solicitud sigue').toBe('sent')

    // Sin señal, el aviso de siempre debajo del botón, y nada se retira.
    await page.reload()
    layer.set('down')
    await expect(trigger).toBeVisible()
    await page.waitForLoadState('networkidle')
    await trigger.click()
    await expect(partFailedNotice(page)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await statusOf(id), 'sin la pregunta, la solicitud sigue').toBe('sent')
  } finally {
    await removePerson(dani)
    await removeRunOwner(owner.id)
  }
})
