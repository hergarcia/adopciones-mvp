import { expect, test, type Page } from '@playwright/test'
import { hasMail, linkFor } from './support/mailbox'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { openEmailSignIn } from './support/sign-in'

// Solicitar un animal (historia #63): el flujo crítico de punta a punta, con una rescatista y una
// adoptante propias de la corrida, así el seed y las capturas no cambian.

const group = (page: Page, legend: string) => page.getByRole('group', { name: legend })

async function choose(page: Page, legend: string, option: string) {
  await group(page, legend).getByRole('radio', { name: option, exact: true }).check()
}

// Covers: US1-AS1, US1-AS2, US1-AS5, US1-AS7, US1-AS10, US1-AS12, FR-002, FR-040
test('sin sesión, solicitar a Tobi y verla en Mis solicitudes', async ({ page }) => {
  test.setTimeout(120_000)
  const { owner, pets } = await publishForRun([{ name: 'Tobi', species: 'dog', isNeutered: true }])
  const code = pets[0]?.code ?? ''
  const adopter = await newPerson('Dani Prueba', { level: 1 })
  try {
    await page.goto(`/animales/${code}`)
    await page.getByRole('link', { name: 'Quiero adoptar' }).click()

    await expect(page).toHaveURL(/\/entrar\?next=%2Fsolicitar%2F/)
    await openEmailSignIn(page)
    await page.getByRole('textbox').fill(adopter.email)
    await page.getByRole('button', { name: /enlace/i }).click()
    await expect.poll(() => hasMail(adopter.email, 'Tu enlace para entrar')).toBe(true)
    await page.goto(linkFor(adopter.email))

    await expect(page.getByRole('heading', { level: 1, name: 'Solicitar a Tobi' })).toBeVisible()
    await expect(group(page, '¿Te comprometés a castrarlo?')).toHaveCount(0)

    await choose(page, '¿Dónde vivís?', 'Apartamento')
    await expect(group(page, '¿El contrato o el dueño permite animales?')).toHaveCount(0)
    await choose(page, '¿Es propia o alquilada?', 'Alquilada')
    await choose(page, '¿El contrato o el dueño permite animales?', 'Sí')
    await choose(page, '¿Tenés patio o balcón?', 'Balcón con red')
    await page.getByRole('textbox', { name: '¿Quiénes viven en la casa?' }).fill('Mi pareja y yo.')
    await page.getByRole('textbox', { name: '¿Hay otros animales en la casa?' }).fill('Ninguno.')
    await choose(page, '¿Cuántas horas por día quedaría solo?', 'De 4 a 8')
    await page
      .getByRole('textbox', { name: '¿Qué pasa con el animal si te mudás o te vas de viaje?' })
      .fill('Se viene conmigo.')
    await page
      .getByRole('textbox', { name: '¿Tuviste perros o gatos antes?' })
      .fill('Una perra, doce años.')
    await choose(
      page,
      '¿Contás con plata para vacunas, castración y una urgencia del veterinario?',
      'Justo',
    )
    const why = page.getByRole('textbox', { name: '¿Por qué Tobi?' })
    await why.fill('Llamame al 099 123 456')

    await page.getByRole('button', { name: 'Enviar solicitud' }).click()
    await expect(page.getByText(/Encontramos «099 123 456», que parece un teléfono/)).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/solicitar/${code}$`))

    await why.fill('Porque es tranquilo y nos encanta.')
    await page.reload()
    await expect(why).toHaveValue('Porque es tranquilo y nos encanta.')
    await expect(
      group(page, '¿Es propia o alquilada?').getByRole('radio', { name: 'Alquilada' }),
    ).toBeChecked()
    await expect(why).toBeEnabled()

    await page.getByRole('button', { name: 'Enviar solicitud' }).click()
    await expect(page).toHaveURL(/\/enviada\?solicitud=/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tu solicitud por Tobi le llegó a Ana Prueba.' }),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Ver mis solicitudes' }).click()
    await expect(page.getByText('1 de 3 solicitudes activas')).toBeVisible()
    await expect(page.getByRole('link', { name: /Tobi/ })).toBeVisible()

    // Relativa a donde quedó la sesión: el enlace del correo abre el sitio con su dirección propia.
    await page.goto(new URL(`/animales/${code}`, page.url()).href)
    await expect(page.getByRole('link', { name: 'Ver mi solicitud' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Quiero adoptar' })).toHaveCount(0)
  } finally {
    await removePerson(adopter)
    await removeRunOwner(owner.id)
  }
})
