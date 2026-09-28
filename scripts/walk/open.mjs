// Los estados que solo aparecen al tocar algo —una hoja, un diálogo, un desplegable—, cada uno
// desde la pantalla recién cargada: lo que abrió el anterior no se arrastra. Solo botones y
// desplegables del contenido, por su texto exacto; un enlace llevaría a otra pantalla.
export async function captureOpened(page, texts, { reload, shoot }) {
  const opened = []
  for (const text of texts) {
    await reload()
    const target = page
      .locator('main')
      .locator('button:not([disabled]), summary')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`), visible: true })
      .first()
    if ((await target.count()) === 0) continue
    await target.click()
    // Lo que se abre entra con --dur-base; 400 ms la cubren con margen, también la del aviso.
    await page.waitForTimeout(400)
    await shoot(text)
    opened.push(text)
  }
  return opened
}

// Lo que no estaba en la pantalla se dice en su línea, sin fallar: no toda ruta tiene cada estado.
export function notOpenedNote(texts, opened) {
  const missing = texts.filter((text) => !opened.includes(text))
  return missing.length === 0 ? '' : `  · sin ${missing.map((text) => `«${text}»`).join(', ')}`
}

function escapeRegExp(text) {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
