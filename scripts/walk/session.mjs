// La sesión de una persona sembrada, para recorrer con `--user`.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { EXIT } from './args.mjs'

const MAIL_DIR = join('.artifacts', 'mail')
const DEFAULT_SEEDED_EMAIL = 'ana@example.test'

export async function signInAsSeededUser(
  browser,
  { baseUrl, viewport, email = DEFAULT_SEEDED_EMAIL },
) {
  const before = new Set(safeList())

  const context = await browser.newContext({ viewport })
  const page = await context.newPage()

  await page.goto(`${baseUrl}/entrar`, { waitUntil: 'networkidle' })
  // Con Google configurado, el correo está cerrado detrás de «Prefiero entrar con mi correo».
  const fallback = page.getByText(/prefiero entrar con mi correo/i)
  if (await fallback.isVisible()) await fallback.click()
  await page.getByRole('textbox').first().fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()
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
