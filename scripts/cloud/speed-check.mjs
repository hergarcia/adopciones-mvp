#!/usr/bin/env node
// La velocidad del sitio de verdad (historia #169, US6, research R15): la portada, el listado y una
// ficha, en un teléfono por red móvil, contra el presupuesto de docs/07. Imprime la tabla para pegar
// en la historia; sale con 1 si una pantalla no lo cumple o no se pudo medir.
//   node scripts/cloud/speed-check.mjs https://<proyecto>.vercel.app <código de una ficha>
import { chromium, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { scriptWeight, withoutCache } from '../../tests/e2e/support/opening-weight.ts'
import { throttleLikeAPhone } from '../../tests/e2e/support/web-vitals.ts'
import { lighthouseRuns, RUNS } from './lighthouse-runs.mjs'
import { markdownTable, uruguayNow } from './table.mjs'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const LCP_MS = 2_500
const SCORE = 90
const OPEN_KB = 150
const USAGE =
  'Uso: node scripts/cloud/speed-check.mjs https://<proyecto>.vercel.app <código de una ficha>'

function screensOf([address, code]) {
  let base
  try {
    base = new URL(address ?? '')
  } catch {
    throw new Error(`Falta la dirección del sitio, o no es una dirección. ${USAGE}`)
  }
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new Error(`«${address}» no es una página. ${USAGE}`)
  }
  if (!/^[A-Za-z0-9]+$/.test(code ?? '')) {
    throw new Error(`Falta el código de una ficha publicada. ${USAGE}`)
  }
  return [
    { name: 'Portada', url: new URL('/', base).href },
    { name: 'Listado', url: new URL('/animales', base).href },
    { name: 'Ficha', url: new URL(`/animales/${code}`, base).href },
  ]
}

// Una pantalla que no abre o no responde 200 no se mide: la ficha de un código que no existe pesa
// otra cosa.
async function weightOf(page, url) {
  try {
    const response = await page.goto(url, { waitUntil: 'load' })
    if (response?.status() === 200) return (await scriptWeight(page)).open
    console.warn(`${url} respondió ${response?.status() ?? 'nada'}: no se mide.`)
  } catch (error) {
    console.warn(`${url} no abrió: ${error.message}`)
  }
  return undefined
}

// La misma medida que tests/e2e/animales-rendimiento.spec.ts: el teléfono del proyecto `mobile` de
// Playwright, con la red y la CPU de gama media y cada pantalla como la primera que se abre.
async function openingWeights(screens) {
  const browser = await chromium.launch()
  try {
    const page = await (await browser.newContext({ ...devices['Pixel 7'] })).newPage()
    await throttleLikeAPhone(page)
    await withoutCache(page)
    const weights = new Map()
    for (const { url } of screens) {
      // oxlint-disable-next-line no-await-in-loop -- de a una pantalla, como el e2e
      weights.set(url, await weightOf(page, url))
    }
    return weights
  } finally {
    await browser.close()
  }
}

const number = (value, digits = 0) =>
  value.toLocaleString('es-UY', { minimumFractionDigits: digits, maximumFractionDigits: digits })

function row({ name, url }, lighthouse, weight) {
  const path = new URL(url).pathname
  if (!lighthouse || weight === undefined) return [name, path, '—', '—', '—', 'no corrió']
  const short = []
  if (lighthouse.lcp >= LCP_MS) short.push('LCP')
  if (lighthouse.score < SCORE) short.push('nota')
  if (weight > OPEN_KB * 1024) short.push('JS de apertura')
  const runs = lighthouse.runs < RUNS ? ` (${lighthouse.runs} de ${RUNS} corridas)` : ''
  return [
    name,
    path,
    `${number(lighthouse.lcp)} ms${runs}`,
    `${lighthouse.score}${runs}`,
    `${number(weight / 1024, 1)} KB`,
    short.length === 0 ? 'pasa' : `no pasa: ${short.join(', ')}`,
  ]
}

async function main() {
  const screens = screensOf(process.argv.slice(2))
  const urls = screens.map(({ url }) => url)
  const lighthouse = lighthouseRuns(ROOT, urls)
  const weights = await openingWeights(screens)
  const rows = screens.map((screen) =>
    row(screen, lighthouse.get(screen.url), weights.get(screen.url)),
  )
  console.log(`\n## Velocidad del sitio de verdad\n`)
  console.log(`${new URL(urls[0]).origin} · ${uruguayNow()} (hora de Uruguay)\n`)
  const header = [
    'Pantalla',
    'Dirección',
    'LCP (mediana)',
    'Nota (mediana)',
    'JS de apertura',
    'Resultado',
  ]
  console.log(markdownTable(header, rows))
  console.log(
    `\nPresupuesto (docs/07): LCP < ${number(LCP_MS / 1000, 1)} s, nota de velocidad ≥ ${SCORE}, ` +
      `JS de apertura ≤ ${OPEN_KB} KB. LCP y nota: Lighthouse, ${RUNS} corridas por pantalla con los ` +
      '`settings` de `.lighthouserc.json`. JS de apertura: la medida de los e2e de rendimiento.',
  )
  return rows.every((cells) => cells[5] === 'pasa') ? 0 : 1
}

try {
  process.exitCode = await main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
