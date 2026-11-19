import { expect, test, type Locator } from '@playwright/test'
import { newPerson, removePerson } from './support/people'
import { service, signIn } from './support/pet-owner'
import { uniqueEmail } from './support/sign-in'

// Historia #326 (cierra KL-026): al guardar el perfil con algo vacío, el foco va al primer campo que
// falta en el orden de la pantalla, a la vista, y el lector de pantalla lo lee con su error.

async function expectFocusedWith(field: Locator, error: string) {
  await expect(field).toBeFocused()
  await expect(field).toBeInViewport()
  await expect(field).toHaveAccessibleDescription(new RegExp(error.replace('.', '\\.')))
}

// Covers: criterio 4 de #326
test('«Contá quién sos» lleva el foco a lo primero que falta', async ({ page }) => {
  const email = uniqueEmail()
  const created = await service().auth.admin.createUser({ email, email_confirm: true })
  expect(created.error).toBeNull()
  try {
    await signIn(page, email, '/completar-perfil')
    await expect(page).toHaveURL(/completar-perfil/, { timeout: 30_000 })
    await page.waitForLoadState('networkidle')

    await page.getByRole('textbox', { name: 'Cómo te llamás' }).fill('Ana García')
    const save = page.getByRole('button', { name: 'Guardar', exact: true })
    await save.click()
    await expect(page.getByText('Elegí tu departamento.')).toBeVisible()
    await expect(page.getByText('Escribí tu localidad.')).toBeVisible()
    const department = page.getByRole('combobox', { name: 'Departamento' })
    await expectFocusedWith(department, 'Elegí tu departamento.')

    await department.click()
    await page.getByRole('option', { name: 'Rocha' }).click()
    await save.click()
    await expect(page.getByText('Elegí tu departamento.')).toHaveCount(0)
    await expectFocusedWith(
      page.getByRole('combobox', { name: 'Localidad' }),
      'Escribí tu localidad.',
    )
  } finally {
    await service().auth.admin.deleteUser(created.data.user?.id ?? '')
  }
})

// Covers: criterio 4 de #326
test('«Editá tu perfil» lleva el foco a lo primero que falta', async ({ page }) => {
  const person = await newPerson('Ana García', { level: 0 })
  try {
    await signIn(page, person.email, '/mi-perfil/editar')
    await expect(page).toHaveURL(/mi-perfil\/editar/, { timeout: 30_000 })
    await page.waitForLoadState('networkidle')

    const name = page.getByRole('textbox', { name: 'Cómo te llamás' })
    const locality = page.getByRole('combobox', { name: 'Localidad' })
    await name.fill('')
    await locality.fill('')
    const save = page.getByRole('button', { name: 'Guardar cambios', exact: true })
    await save.click()
    await expectFocusedWith(name, 'Escribí cómo te llamás.')
    await expect(page.getByText('Escribí tu localidad.')).toBeVisible()

    await name.fill('Ana García')
    await save.click()
    await expect(page.getByText('Escribí cómo te llamás.')).toHaveCount(0)
    await expectFocusedWith(locality, 'Escribí tu localidad.')
  } finally {
    await removePerson(person)
  }
})
