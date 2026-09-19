#!/usr/bin/env node
// Driver de capturas. Recorre rutas como visitante anónimo y deja PNGs a 390 px para que
// design-reviewer y Hernán tengan qué mirar. Contrato en .claude/skills/run-app/SKILL.md.
//
// Corre contra `pnpm dev` y no contra el build de producción, porque la muestra de primitivas solo
// existe en desarrollo.
//
//   node scripts/walk.mjs --story <slug> [rutas...] [--desktop] [--headed]
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { EXIT, parseArgs } from './walk/args.mjs'
import { classify } from './walk/noise.mjs'
import { fileNameFor } from './walk/paths.mjs'

// `localhost` y no `127.0.0.1`: Next 16 le niega los recursos de desarrollo a un origen que no
// conoce, la página queda sin hidratar y las capturas muestran botones que no hacen nada.
const BASE_URL = process.env.WALK_BASE_URL ?? 'http://localhost:3000'
const PHONE = { width: 390, height: 844 }
const DESKTOP = { width: 1280, height: 800 }
const INTERACTIVE = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'

const parsed = parseArgs(process.argv.slice(2))
if (parsed.error) {
  console.error(`walk: ${parsed.error}`)
  process.exit(EXIT.badInvocation)
}
const { story, routes, desktop, headed } = parsed

// Preflight antes de abrir un navegador: si la app no está, decilo y salí con 2.
try {
  const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
} catch (error) {
  console.error(
    `walk: la app no responde en ${BASE_URL} (${error.message}).\n` +
      '      Levantala con `pnpm dev` y volvé a correr esto.',
  )
  process.exit(EXIT.appDown)
}

const outDir = join('.artifacts', story)
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

// 390 px siempre; `--desktop` **agrega** 1280 px al lado, no lo reemplaza.
const viewports = [
  { size: PHONE, desktop: false },
  ...(desktop ? [{ size: DESKTOP, desktop: true }] : []),
]

const browser = await chromium.launch({ headless: !headed })
const written = []
const problems = []

async function capture(route, viewport) {
  const context = await browser.newContext({ viewport: viewport.size })
  const page = await context.newPage()

  const note = (kind, text) => {
    const problem = classify({ kind, text })
    if (problem) problems.push({ route, ...problem })
  }
  page.on('console', (message) => {
    if (message.type() === 'error') note('console', message.text())
  })
  page.on('pageerror', (error) => note('page', error.message))
  page.on('requestfailed', (request) => note('request', request.url()))

  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' })
  // El indicador de desarrollo de Next no es parte de la pantalla: taparía una esquina de la
  // captura y su botón pasaría por el primer elemento interactivo de una ruta que no tiene ninguno.
  await page.addStyleTag({ content: 'nextjs-portal { display: none }' })

  const heading =
    (await page
      .locator('h1')
      .first()
      .textContent()
      .catch(() => null)) ?? '(sin h1)'

  const shot = fileNameFor(route, { desktop: viewport.desktop })
  await page.screenshot({ path: join(outDir, shot), fullPage: true })
  written.push(shot)

  // Una captura con hover y foco del primer elemento interactivo, para que las
  // microinteracciones se vean. Una ruta sin nada interactivo lo dice y no produce la segunda.
  const interactive = page.locator(INTERACTIVE).filter({ visible: true }).first()
  const hasInteractive = (await interactive.count()) > 0

  if (hasInteractive) {
    await interactive.hover()
    await interactive.focus()
    // Esperar a que termine la transición: a los dos frames, un botón que se está invirtiendo sale
    // gris y parece deshabilitado. 300 ms cubre --dur-base con margen.
    await page.waitForTimeout(300)
    const hoverShot = fileNameFor(route, { desktop: viewport.desktop, hover: true })
    await page.screenshot({ path: join(outDir, hoverShot), fullPage: true })
    written.push(hoverShot)
  }

  await context.close()
  return { heading: heading.trim(), hasInteractive }
}

for (const route of routes) {
  let summary
  for (const viewport of viewports) {
    const result = await capture(route, viewport)
    summary ??= result
  }
  const note = summary.hasInteractive
    ? ''
    : '  · sin elementos interactivos, no hay captura de hover'
  console.log(`${route.padEnd(24)} ${summary.heading.slice(0, 40)}${note}`)
}

await browser.close()

console.log(`\n${written.length} captura(s) en ${outDir}/`)
for (const file of written) console.log(`  ${join(outDir, file)}`)

if (problems.length > 0) {
  console.error(`\nwalk: ${problems.length} problema(s):`)
  for (const { route, kind, text } of problems) {
    console.error(`  ${route} — [${kind}] ${text}`)
  }
  process.exit(EXIT.routeFailed)
}

process.exit(EXIT.ok)
