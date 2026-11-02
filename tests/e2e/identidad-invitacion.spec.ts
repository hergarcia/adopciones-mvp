import { expect, test } from '@playwright/test'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { signIn } from './support/pet-owner'

// La invitación a verificar la identidad en «Mis animales» (historia #281), el flujo que nombra la
// spec: una rescatista de nivel 1 con un animal la ve con su nombre, toca «Ahora no» y no vuelve;
// otra entra a la verificación desde ella y, al dejarla sin mandar, vuelve a «Mis animales» con la
// invitación. Mandar las fotos ya lo cubre identidad.spec.ts. Rescatistas propias de la corrida.

const INVITE = 'Que sepan quién publica'

// Covers: US1-AS1, US2-AS1, US2-AS2, US2-AS4, SC-001, SC-002, FR-016
test('«Ahora no» cierra la invitación en el momento y no vuelve', async ({ page }) => {
  test.setTimeout(120_000)
  const { owner } = await publishForRun([{ name: 'Pirata', species: 'dog' }])
  try {
    await signIn(page, owner.email, '/mis-animales')
    const invite = page.getByRole('region', { name: INVITE })
    await expect(invite).toBeVisible()
    await expect(invite.getByText(/Si verificás tu identidad, Pirata va a decir/)).toBeVisible()

    // Sin conexión, la nota se va igual y la pantalla sigue, sin error (FR-016); como no se guardó,
    // vuelve la próxima vez (FR-015).
    await page.context().setOffline(true)
    await invite.getByRole('button', { name: 'Ahora no' }).click()
    await expect(invite).toHaveCount(0)
    await expect(page.getByText('Pirata', { exact: true }).first()).toBeVisible()
    await page.context().setOffline(false)
    await page.reload()
    await expect(invite).toBeVisible()

    await invite.getByRole('button', { name: 'Ahora no' }).click()
    await expect(invite).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
    await expect(page.getByText('Pirata', { exact: true }).first()).toBeVisible()

    // La marca se guarda en una transición: recargar antes de que llegue la traería de vuelta.
    await expect
      .poll(async () => {
        await page.reload()
        return page.getByRole('region', { name: INVITE }).count()
      })
      .toBe(0)

    await page.goto(new URL('/mi-perfil', page.url()).href)
    await expect(page.getByText('Pasá a nivel 2', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Verificar mi identidad' })).toBeVisible()
  } finally {
    await removeRunOwner(owner.id)
  }
})

// Covers: US1-AS2, US1-AS3, SC-003, FR-013, FR-014
test('dejar la verificación empezada desde la invitación vuelve a «Mis animales»', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const { owner } = await publishForRun([{ name: 'Canela', species: 'cat' }])
  try {
    await signIn(page, owner.email, '/mis-animales')
    const invite = page.getByRole('region', { name: INVITE })
    await invite.getByRole('link', { name: 'Verificar mi identidad' }).click()
    await expect(page).toHaveURL(/\/verificar-identidad\?.*invitacion=1/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Verificá tu identidad' }),
    ).toBeVisible()

    // La primera vez, «Ahora no» pregunta qué frena; seguir sin contestar sale igual.
    await page.getByRole('button', { name: 'Ahora no' }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: '¿Qué te frena para verificar tu identidad?' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Seguir sin contestar' }).click()

    await expect(page).toHaveURL(/\/mis-animales$/)
    await expect(page.getByRole('region', { name: INVITE })).toBeVisible()
  } finally {
    await removeRunOwner(owner.id)
  }
})
