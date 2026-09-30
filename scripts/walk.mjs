#!/usr/bin/env node
// Contrato y uso en .claude/skills/run-app/SKILL.md. Corre contra `pnpm dev` y no contra el build
// de producción, porque la muestra de primitivas solo existe en desarrollo.
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { EXIT, parseArgs } from './walk/args.mjs'
import { classify } from './walk/noise.mjs'
import { captureOpened, notOpenedNote } from './walk/open.mjs'
import { fileNameFor } from './walk/paths.mjs'
import { screenshotWhole } from './walk/screenshot.mjs'
import { signInAsSeededUser } from './walk/session.mjs'

// `localhost` y no `127.0.0.1`: Next 16 le niega los recursos de desarrollo a un origen que no
// conoce, la página queda sin hidratar y las capturas muestran botones que no hacen nada.
const BASE_URL = process.env.WALK_BASE_URL ?? 'http://localhost:3000'
const PHONE = { width: 390, height: 844 }
const DESKTOP = { width: 1280, height: 800 }
// Sin los deshabilitados: no reciben el puntero, y el hover esperaría hasta el timeout (el primer
// botón de una foto de portada, «Mover antes», lo está). Una casilla escondida (`sr-only`, la de
// una tirita de filtro) tampoco: el puntero lo recibe su `label`, que es lo que se ve.
const INTERACTIVE =
  'a, button:not([disabled]), input:not([disabled]):not(.sr-only), label:has(> input.sr-only), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const parsed = parseArgs(process.argv.slice(2))
if (parsed.error) {
  console.error(`walk: ${parsed.error}`)
  process.exit(EXIT.badInvocation)
}
const { story, routes, phoneOnly, headed, user, userEmail, open } = parsed

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

// Los dos anchos, salvo que se pida `--phone-only`: la pantalla se diseña en 390 y se expande, y
// las dos puntas de esa expansión se revisan.
const viewports = [
  { size: PHONE, desktop: false },
  ...(phoneOnly ? [] : [{ size: DESKTOP, desktop: true }]),
]

const browser = await chromium.launch({ headless: !headed })

// La sesión de una persona sembrada, abierta una sola vez y reusada en cada contexto. Se entra
// **por el producto**, pidiendo el enlace y abriéndolo, igual que una persona: fabricar la cookie
// a mano probaría que sabemos fabricar cookies, no que el ingreso funciona.
const storageState = user
  ? await signInAsSeededUser(browser, { baseUrl: BASE_URL, viewport: PHONE, email: userEmail })
  : undefined

const written = []
const problems = []

async function capture(route, viewport) {
  // A 390 px, un teléfono: el dedo como puntero y sin hover, como lo ve quien lo usa. Sin esto, lo
  // que depende de `pointer: coarse` (sacar la foto con la cámara) no saldría en la captura.
  // Con permiso de portapapeles, como un teléfono o una computadora de verdad: sin él, Chromium sin
  // ventana rechaza copiar y «Copiar el enlace» solo mostraría su plan B.
  const context = await browser.newContext({
    viewport: viewport.size,
    hasTouch: !viewport.desktop,
    storageState,
    permissions: ['clipboard-read', 'clipboard-write'],
  })
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

  // El indicador de desarrollo de Next no es parte de la pantalla: taparía una esquina de la
  // captura y su botón pasaría por el primer elemento interactivo de una ruta que no tiene ninguno.
  const load = async () => {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' })
    await page.addStyleTag({ content: 'nextjs-portal { display: none }' })
  }
  await load()
  const shoot = async (options) => {
    const file = fileNameFor(route, { desktop: viewport.desktop, ...options })
    await screenshotWhole(page, viewport, join(outDir, file))
    written.push(file)
  }

  const heading =
    (await page
      .locator('h1')
      .first()
      .textContent()
      .catch(() => null)) ?? '(sin h1)'

  await shoot({})

  // Una captura con hover y foco del primer elemento interactivo **del contenido**, para que las
  // microinteracciones se vean. Dentro de `main` y no de la página entera: el menú de la esquina
  // es el primero del DOM en todas las rutas, así que las ocho capturas mostraban lo mismo y
  // ninguna microinteracción de la pantalla quedaba demostrada.
  const interactive = page.locator('main').locator(INTERACTIVE).filter({ visible: true }).first()
  const hasInteractive = (await interactive.count()) > 0

  if (hasInteractive) {
    await interactive.hover()
    await interactive.focus()
    // Esperar a que termine la transición: a los dos frames, un botón que se está invirtiendo sale
    // gris y parece deshabilitado. 300 ms cubre --dur-base con margen.
    await page.waitForTimeout(300)
    await shoot({ hover: true })
  }

  const opened = await captureOpened(page, open, {
    reload: load,
    shoot: (text) => shoot({ open: text }),
  })

  await context.close()
  return { heading: heading.trim(), hasInteractive, opened }
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
  const openNote = notOpenedNote(open, summary.opened)
  console.log(`${route.padEnd(24)} ${summary.heading.slice(0, 40)}${note}${openNote}`)
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
