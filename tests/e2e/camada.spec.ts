import { expect, test, type Page } from '@playwright/test'
import { hasMail, linkFor } from './support/mailbox'
import { photoWithGps } from './support/exif-fixture'
import { removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { levelOneOwner, service, signIn } from './support/pet-owner'
import { openEmailSignIn } from './support/sign-in'

// El flujo crítico de la historia #205, contra el build de producción (plan.md §Qué se testea): una
// rescatista publica una camada de 4 crías, la ve agrupada en «Mis animales» y como una sola tarjeta
// en el listado; sin sesión, la ficha muestra una cría sin fotos con las de la camada, y «Quiero
// adoptar» de esa cría lleva al cuestionario de ella. Aparte, una sola cría pasa a un animal.
const PUBLISH = '/mis-animales/publicar'

function suffix(): string {
  return Array.from({ length: 5 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join('')
}

const young = (page: Page, name: string) => page.getByRole('group', { name, exact: true })

function choose(page: Page, group: string, option: string) {
  return page
    .getByRole('group', { name: group, exact: true })
    .getByRole('radio', { name: option, exact: true })
    .check()
}

async function fillCommon(page: Page, name: string) {
  await page.getByRole('textbox', { name: 'Nombre de la camada' }).fill(name)
  await choose(page, 'Especie', 'Perro')
  await page.getByRole('textbox', { name: 'Edad aproximada, en números' }).fill('2')
  await choose(page, 'Unidad de la edad', 'Meses')
  await choose(page, 'Tamaño de adulto', 'Mediano')
  await choose(page, 'Castrado', 'No')
  await choose(page, 'Vacunas', 'Al día')
  await choose(page, 'Chip', 'No')
}

async function photos(page: Page, count: number) {
  return Promise.all(
    Array.from({ length: count }, async (_, index) => ({
      name: `camada_${index}.jpg`,
      mimeType: 'image/jpeg',
      buffer: await photoWithGps(page, 400, 500),
    })),
  )
}

// Un departamento que no usa ninguna otra prueba: la camada recién publicada es la más nueva del
// listado filtrado, aunque otras corridas peguen animales con fecha del año 2999.
async function ownerInArtigas() {
  const owner = await levelOneOwner()
  const moved = await service()
    .from('profiles')
    .update({ department: 'UY-AR', locality: 'Bella Unión' })
    .eq('id', owner.id)
  expect(moved.error).toBeNull()
  return owner
}

// Covers: US1-AS1, US1-AS3, US2-AS1, US2-AS2, US2-AS3, US3-AS1, SC-002
test('publicar una camada de 4, verla agrupada y como una tarjeta, y pedir una cría sin fotos', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000)
  const owner = await ownerInArtigas()
  const adopter = await newPerson('Dani Prueba', { level: 1 })
  const name = `La camada de Kira ${suffix()}`
  try {
    await signIn(page, owner.email, PUBLISH)
    await page.getByRole('link', { name: 'Una camada', exact: true }).click()
    await expect(page).toHaveURL(/tipo=camada/)
    await expect(page.getByRole('combobox', { name: 'Localidad' })).toHaveValue('Bella Unión')

    await fillCommon(page, name)
    await page
      .locator('input[type=file]')
      .first()
      .setInputFiles(await photos(page, 1))
    await page.getByRole('button', { name: 'Agregar cría' }).click()
    await page.getByRole('button', { name: 'Agregar cría' }).click()
    await expect(page.getByText('4 de 10', { exact: true })).toBeVisible()
    const sexes = ['Hembra', 'Macho', 'Hembra', 'Macho']
    for (const [index, sex] of sexes.entries()) {
      // oxlint-disable-next-line no-await-in-loop -- una cría por vez, en orden
      await young(page, `Cría ${index + 1}`)
        .getByRole('radio', { name: sex, exact: true })
        .check()
    }
    // Solo Cría 1 tiene foto propia; Cría 2 se va a ver con la de la camada.
    await young(page, 'Cría 1')
      .locator('input[type=file]')
      .setInputFiles(await photos(page, 1))
    await expect(page.getByRole('img', { name: /^Foto \d$/ })).toHaveCount(2)

    await page.getByRole('button', { name: 'Publicar la camada' }).click()
    await expect(page).toHaveURL(/\/mis-animales(\?|$)/, { timeout: 30_000 })

    // «Mis animales»: la camada es un grupo, con sus crías listadas debajo (US1-AS3).
    await expect(page.getByRole('link').filter({ hasText: name }).first()).toBeVisible()
    // El recuento de la camada es el de la ficha desde la #206: cuántas crías y cuántas disponibles.
    await expect(page.getByText('4 crías, 4 disponibles', { exact: true })).toBeVisible()
    await expect(page.getByText('Cría 2, macho', { exact: true })).toBeVisible()

    const db = service()
    const litter = await db.from('litters').select('id, code').eq('owner_id', owner.id).single()
    expect(litter.error).toBeNull()
    const code = litter.data?.code ?? ''
    const crias = await db
      .from('pets')
      .select('code, name')
      .eq('litter_id', litter.data?.id ?? '')
    expect(crias.data).toHaveLength(4)
    const second = crias.data?.find((one) => one.name === 'Cría 2')?.code ?? ''
    const cover = await db
      .from('pet_photos')
      .select('id')
      .eq('litter_id', litter.data?.id ?? '')
      .single()

    // El listado: una sola tarjeta con el recuento, que lleva a la ficha de la camada (US3-AS1).
    const visitor = await browser.newContext()
    const anonymous = await visitor.newPage()
    await anonymous.goto('/animales?departamento=artigas')
    const card = anonymous.getByRole('link').filter({ hasText: name })
    await expect(card).toHaveCount(1)
    await expect(card).toContainText('4 crías de perro, 4 disponibles')
    await expect(anonymous.getByRole('link').filter({ hasText: 'Cría 2' })).toHaveCount(0)
    await card.click()
    await expect(anonymous).toHaveURL(new RegExp(`/camadas/${code}`))

    // La ficha sin sesión: las cuatro crías, y Cría 2 con la foto de la camada (US2-AS1, FR-034).
    await expect(anonymous.getByRole('heading', { level: 1, name })).toBeVisible()
    await expect(anonymous.getByText('4 crías, 4 disponibles')).toBeVisible()
    await expect(anonymous.getByRole('link', { name: 'Quiero adoptar' })).toHaveCount(4)
    const secondPhoto = anonymous.getByRole('img', {
      name: `Foto de Cría 2, macho de ${name}`,
    })
    await expect(secondPhoto).toHaveAttribute('srcset', new RegExp(cover.data?.id ?? 'sin-foto'))

    // «Quiero adoptar» de Cría 2 lleva al cuestionario de esa cría (US2-AS2).
    await anonymous
      .getByRole('listitem')
      .filter({ has: anonymous.getByRole('heading', { name: 'Cría 2', exact: true }) })
      .getByRole('link', { name: 'Quiero adoptar' })
      .click()
    await expect(anonymous).toHaveURL(new RegExp(`/entrar\\?next=%2Fsolicitar%2F${second}`))
    await openEmailSignIn(anonymous)
    await anonymous.getByRole('textbox').fill(adopter.email)
    await anonymous.getByRole('button', { name: /enlace/i }).click()
    await expect.poll(() => hasMail(adopter.email, 'Tu enlace para entrar')).toBe(true)
    await anonymous.goto(linkFor(adopter.email))
    await expect(
      anonymous.getByRole('heading', { level: 1, name: 'Solicitar a Cría 2' }),
    ).toBeVisible()
    await visitor.close()
  } finally {
    await removePerson(adopter)
    await removeRunOwner(owner.id)
  }
})

// Covers: US1-AS4, FR-012
test('una camada de una sola cría pasa al formulario de un animal con lo cargado', async ({
  page,
}) => {
  const owner = await levelOneOwner()
  const name = `Tita ${suffix()}`
  try {
    await signIn(page, owner.email, `${PUBLISH}?tipo=camada`)
    await fillCommon(page, `La camada de ${name}`)
    await young(page, 'Cría 2').getByRole('button', { name: 'Quitar cría' }).click()
    await young(page, 'Cría 1').getByRole('textbox', { name: 'Nombre' }).fill(name)
    await young(page, name).getByRole('radio', { name: 'Hembra', exact: true }).check()

    await page.getByRole('button', { name: 'Publicar la camada' }).click()
    const dialog = page.getByRole('dialog', { name: 'Una camada lleva al menos 2 crías' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Publicarla como un animal' }).click()

    await expect(page).toHaveURL(/tipo=animal/)
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue(name)
    await expect(
      page.getByRole('group', { name: 'Sexo' }).getByRole('radio', { name: 'Hembra' }),
    ).toBeChecked()
    await expect(
      page.getByRole('group', { name: 'Especie' }).getByRole('radio', { name: 'Perro' }),
    ).toBeChecked()
    await expect(page.getByRole('textbox', { name: 'Edad aproximada, en números' })).toHaveValue(
      '2',
    )
    const litters = await service().from('litters').select('id').eq('owner_id', owner.id)
    expect(litters.data).toHaveLength(0)
  } finally {
    await removeRunOwner(owner.id)
  }
})
