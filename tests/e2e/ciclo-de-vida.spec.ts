import { expect, test, type Browser, type Page } from '@playwright/test'
import { requireEnv } from '../../src/lib/env'
import { URUGUAY_TIME_ZONE } from '../../src/lib/verification/rules'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { hasMail, mailTo } from './support/mailbox'
import { service, signIn } from './support/pet-owner'

// El flujo crítico de la historia #59, contra el build de producción: Ana marca adoptado a su animal
// y sale del listado; lo vuelve a publicar y vuelve; a 6 días de vencer, la tarea le manda el correo
// «¿sigue disponible?», y el botón del correo, abierto sin sesión, lo renueva y dice hasta cuándo.
const MY_PETS = '/mis-animales'
const DAY_MS = 86_400_000

function suffix(): string {
  return Array.from({ length: 5 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join('')
}

async function anonymous(browser: Browser): Promise<Page> {
  return (await browser.newContext()).newPage()
}

async function chooseInSheet(page: Page, action: string) {
  await page.getByRole('button', { name: 'Más acciones' }).click()
  await page.getByRole('dialog').getByRole('button', { name: action, exact: true }).click()
}

// Volver a publicar le pone la fecha de hoy, y las pruebas que corren a la vez publican en el año
// 2999 (`publishForRun`): solo un departamento que ninguna otra usa deja al animal en la primera
// página del listado.
const DEPARTMENT = { department: 'UY-FD', locality: 'Sarandí Grande' }

async function isListed(page: Page, name: string) {
  await page.goto('/animales?departamento=florida')
  return page.getByRole('link').filter({ hasText: name })
}

// Covers: US1-AS3, US1-AS6, US2-AS3, US3-AS1, US3-AS2, FR-017, FR-018, FR-020
test('adoptado sale del listado, vuelve al publicarlo y el correo lo renueva sin sesión', async ({
  page,
  browser,
}) => {
  const name = `Tobi ${suffix()}`
  const { owner, pets } = await publishForRun([
    { name, species: 'dog', sex: 'male', ...DEPARTMENT },
  ])
  const [tobi] = pets
  const visitor = await anonymous(browser)

  try {
    await signIn(page, owner.email, MY_PETS)
    await expect(page).toHaveURL(new RegExp(`${MY_PETS}$`))

    await chooseInSheet(page, 'Marcar adoptado')
    await expect(page.getByText(`${name} quedó adoptado`, { exact: true })).toBeVisible()

    await expect(await isListed(visitor, name)).toHaveCount(0)
    await visitor.goto(`/animales/${tobi.code}`)
    await expect(visitor.getByRole('heading', { level: 1, name })).toBeVisible()
    await expect(visitor.getByText('Adoptado', { exact: true })).toBeVisible()
    await expect(visitor.getByRole('link', { name: 'Ver los animales en adopción' })).toBeVisible()

    await chooseInSheet(page, 'Volver a publicar')
    await expect(
      page.getByText(`${name} volvió a Animales en adopción`, { exact: true }),
    ).toBeVisible()
    await expect(await isListed(visitor, name)).toHaveCount(1)

    const db = service()
    const sixDays = new Date(Date.now() + 6 * DAY_MS).toISOString()
    const moved = await db
      .from('pets')
      .update({ expires_at: sixDays })
      .eq('owner_id', owner.id)
      .select('reminder_sent_at')
    expect(moved.error).toBeNull()
    expect(moved.data?.[0]?.reminder_sent_at).toBeNull()

    const tick = await visitor.request.post('/api/cron/publicaciones', {
      headers: { 'x-cron-secret': requireEnv('CRON_SECRET') },
    })
    expect(tick.status()).toBe(204)

    const subject = `¿${name} sigue disponible?`
    await expect.poll(() => hasMail(owner.email, subject), { timeout: 15_000 }).toBe(true)
    const link = /https?:\/\/\S+\/sigue-disponible\/[\w-]{43}/.exec(
      mailTo(owner.email, subject).text,
    )?.[0]
    expect(link, 'el correo tiene que traer «Sigue disponible»').toBeDefined()

    await visitor.goto(new URL(link ?? '').pathname)
    await expect(visitor).toHaveURL(/\/listo\?r=renewed$/)
    const renewed = await db.from('pets').select('expires_at').eq('owner_id', owner.id).single()
    const expiresAt = new Date(renewed.data?.expires_at ?? 0)
    expect(expiresAt.getTime() - Date.now()).toBeGreaterThan(29 * DAY_MS)
    const day = new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'long',
      timeZone: URUGUAY_TIME_ZONE,
    }).format(expiresAt)
    await expect(
      visitor.getByRole('heading', { name: `${name} sigue publicado hasta el ${day}` }),
    ).toBeVisible()
  } finally {
    await visitor.context().close()
    await removeRunOwner(owner.id)
  }
})
