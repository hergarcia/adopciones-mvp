import { expect, test } from '@playwright/test'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { service, signIn } from './support/pet-owner'

// «¿Qué te frena?» al dejar el pedido de identidad (historia #234), el flujo que nombra la spec:
// desde la ficha de un animal que pide nivel 2, «Ahora no» hace la pregunta, una opción la manda y
// vuelve a la ficha; la segunda vez sale directo. Con una rescatista y una adoptante de la corrida.

// Covers: US1-AS1, US1-AS3
test('dejar el pedido de identidad desde Luna: la pregunta una vez y de vuelta a Luna', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const { owner, pets } = await publishForRun([{ name: 'Luna', species: 'dog' }])
  const code = pets[0]?.code ?? ''
  const pet = await service().from('pets').update({ required_level: 2 }).eq('code', code)
  expect(pet.error).toBeNull()
  const bruno = await newPerson('Bruno Prueba', { level: 1 })
  try {
    await signIn(page, bruno.email, `/animales/${code}`)
    await page.getByRole('link', { name: 'Quiero adoptar' }).click()
    await page.getByRole('link', { name: 'Verificar mi identidad' }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Verificá tu identidad' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Ahora no' }).click()
    const question = page.getByRole('heading', {
      level: 1,
      name: '¿Qué te frena para verificar tu identidad?',
    })
    await expect(question).toBeVisible()
    await expect(question).toBeFocused()
    await Promise.all(
      [
        'No quiero mandar fotos de mi cédula',
        'Ahora no puedo, lo hago más tarde',
        'Me parece demasiado',
        'Prefiero seguir por el grupo de Facebook o WhatsApp',
      ].map((option) => expect(page.getByRole('button', { name: option })).toBeVisible()),
    )
    await expect(page.getByText('Otra cosa')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Seguir sin contestar' })).toBeVisible()

    await page.getByRole('button', { name: 'No quiero mandar fotos de mi cédula' }).click()
    await expect(page).toHaveURL(new RegExp(`/animales/${code}$`))

    // Sobre el mismo origen de la página: el enlace de ingreso deja la sesión en `localhost`.
    await page.goto(new URL(`/verificar-identidad?pedir=1&animal=${code}`, page.url()).href)
    await page.getByRole('link', { name: 'Ahora no' }).click()
    await expect(page).toHaveURL(new RegExp(`/animales/${code}$`))
    await expect(question).toHaveCount(0)
  } finally {
    await removePerson(bruno)
    await removeRunOwner(owner.id)
  }
})
