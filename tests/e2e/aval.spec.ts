import { expect, test } from '@playwright/test'
import { newPerson, removePerson } from './support/people'

// El perfil público (historia #12): se lee sin scripts, la vista previa no lleva nada de la persona
// además del nombre, y los tres «no existe» son la misma respuesta. Beto y Carla son del seed y
// solo se leen.
const BETO = '/perfil/SemillaBeto00000000006'
const WHATSAPP = 'WhatsApp/2.23.20.0'

// Lo que cambia en cada visita a cualquier página no es parte de la comparación: el orden en que
// llegan los trozos del payload de React depende de cuánto tarda la base. Se comparan el HTML sin
// esos trozos y las filas del payload ordenadas.
function comparable(html: string, id: string) {
  const replaced = html.replaceAll(id, 'ID')
  const chunks = [...replaced.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)]
  const rows = chunks
    .map(([, literal]) => String(JSON.parse(literal ?? '""')))
    .join('')
    .split('\n')
    .filter((row) => row !== '')
    .sort()
  const markup = replaced.replaceAll(/<script>self\.__next_f\.push\(.*?\)<\/script>/gs, '')
  return { markup, rows }
}

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  // Covers: FR-005, FR-010, US1-AS4
  test('el perfil de Beto se lee entero', async ({ page }) => {
    await page.goto(BETO)
    await expect(page.getByRole('heading', { level: 1, name: 'Beto Silva' })).toBeVisible()
    await expect(page.getByText('Juan Lacaze, Colonia')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Verificado, nivel 2. Qué significa' }),
    ).toBeVisible()
    await expect(page.getByText('Identidad verificada en agosto de 2026')).toBeVisible()
    await expect(page.getByText(/^En el sitio desde \p{L}+ de \d{4}$/u)).toBeVisible()
  })
})

// Covers: FR-009. La vista previa lleva el nombre y el sitio, y nada más de la persona.
test('la vista previa de un enlace no lleva la foto, la zona ni el nivel', async ({ request }) => {
  const ana = await newPerson('Ana Preview', { avatarPath: (id) => `${id}/avatar.webp` })
  try {
    const path = `/perfil/${ana.publicId}`
    const browser = await (await request.get(path)).text()
    expect(browser, 'con un navegador, la página sí trae la foto').toContain(`${path}/foto`)

    const preview = await request.get(path, { headers: { 'user-agent': WHATSAPP } })
    expect(preview.status()).toBe(200)
    const html = await preview.text()
    expect(html).not.toContain('/foto')
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head).toContain('<title>Ana Preview · Adopciones</title>')
    expect(head).toContain('<meta name="robots" content="noindex, nofollow"/>')
    expect(head).not.toContain('og:image')
    for (const leak of ['La Paloma', 'Rocha', 'nivel', 'Nivel']) {
      expect(head, `el <head> no dice «${leak}»`).not.toContain(leak)
    }
  } finally {
    await removePerson(ana)
  }
})

// Covers: FR-007, SC-002. Nadie distingue un id inventado, una cuenta borrada y un id mal formado.
// Next dibuja el «no existe» de una página sin límite de Suspense en el navegador, desde el payload;
// por eso se compara el payload además del HTML, y la pantalla se mira con JavaScript.
test('los tres «no existe» son la misma respuesta', async ({ page, request }) => {
  const gone = await newPerson('Cuenta Borrada')
  await removePerson(gone)
  const ids = ['AAAAAAAAAAAAAAAAAAAAAA', gone.publicId, 'corto']

  const answers = await Promise.all(
    ids.map(async (id) => {
      const response = await request.get(`/perfil/${id}`)
      return { status: response.status(), ...comparable(await response.text(), id) }
    }),
  )
  expect(answers.map((answer) => answer.status)).toEqual([404, 404, 404])
  expect(answers[0]?.rows.join(' ')).toContain('Este perfil no existe')
  expect(answers[1]).toEqual(answers[0])
  expect(answers[2]).toEqual(answers[0])

  await page.goto(`/perfil/${gone.publicId}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Este perfil no existe' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ir al inicio' })).toBeVisible()
})
