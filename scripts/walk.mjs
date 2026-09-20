#!/usr/bin/env node
// Contrato y uso en .claude/skills/run-app/SKILL.md. Corre contra `pnpm dev` y no contra el build
// de producción, porque la muestra de primitivas solo existe en desarrollo.
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
const MAIL_DIR = join('.artifacts', 'mail')
const DEFAULT_SEEDED_EMAIL = 'ana@example.test'

const parsed = parseArgs(process.argv.slice(2))
if (parsed.error) {
  console.error(`walk: ${parsed.error}`)
  process.exit(EXIT.badInvocation)
}
const { story, routes, phoneOnly, headed, user, userEmail } = parsed

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
const storageState = user ? await signInAsSeededUser() : undefined

async function signInAsSeededUser() {
  const { readdirSync, readFileSync } = await import('node:fs')
  const email = userEmail ?? DEFAULT_SEEDED_EMAIL
  const before = new Set(safeList())

  const context = await browser.newContext({ viewport: PHONE })
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/entrar`, { waitUntil: 'networkidle' })
  await page.getByRole('textbox').first().fill(email)
  await page.getByRole('button').first().click()
  await page.waitForURL(/revisa-tu-correo/, { timeout: 15000 }).catch(() => undefined)

  const link = newestLinkFor(email, before)
  if (link === undefined) {
    console.error('walk: no llegó el enlace de ingreso de la persona sembrada.')
    console.error('      Probá `pnpm exec supabase db reset` y que .env.local tenga sus claves.')
    process.exit(EXIT.appDown)
  }

  await page.goto(link, { waitUntil: 'networkidle' })
  const state = await context.storageState()
  await context.close()
  return state

  function safeList() {
    try {
      return readdirSync(MAIL_DIR)
    } catch {
      return []
    }
  }

  function newestLinkFor(recipient, ignore) {
    const fresh = safeList()
      .filter((name) => name.endsWith('.json') && !ignore.has(name))
      .sort()
      .map((name) => JSON.parse(readFileSync(join(MAIL_DIR, name), 'utf8')))
      .filter((message) => message.to === recipient)
      .at(-1)

    return fresh === undefined
      ? undefined
      : /https?:\/\/\S+\/auth\/confirm\S*/.exec(fresh.text)?.[0]
  }
}

const written = []
const problems = []

async function capture(route, viewport) {
  const context = await browser.newContext({ viewport: viewport.size, storageState })
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
