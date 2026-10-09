// La forma de todo correo del producto: título, cuerpo, un botón a una dirección, la dirección
// escrita y una nota al pie.
export type NoticeEmailTexts = {
  heading: string
  body: string
  button: string
  fallback: string
  footer: string
}

// Lo opcional (research R7 de la #59): una foto arriba, que si no carga deja el `alt` en su lugar y
// el correo se lee igual, y un segundo enlace como texto debajo del botón. Y párrafos debajo del
// cuerpo, con su mismo estilo: el texto del compromiso (historia #67).
// La foto adentro del correo (research R8 de la #69): viaja como adjunto en línea y el HTML la nombra
// por su `contentId`. Una foto privada no puede ir por URL: firmada vence, pública la vería cualquiera.
export type InlineImage = { contentId: string; alt: string; filename: string; content: Buffer }

export type NoticeEmailExtras = {
  image?: { src: string; alt: string }
  /** En lugar de `image`, cuando la foto es privada. */
  inlineImage?: InlineImage
  secondary?: { label: string; url: string }
  lines?: string[]
}

// HTML con estilos en línea y tabla de una celda: es lo que entienden los clientes de correo, que
// no tienen hojas de estilo ni flexbox. Los colores son los tokens de docs/10 escritos a mano
// porque un correo no puede leer `globals.css`; son los únicos hexadecimales del producto fuera de
// esa hoja, y viven acá solos para que se vea que es una excepción con motivo.
const INK = '#1F2D26'
const INK_MUTED = '#5B6862'
const CANVAS = '#FFFFFF'
const LINE = '#DDD8CF'

export function renderNoticeEmail(
  texts: NoticeEmailTexts,
  url: string,
  lang: string,
  extras: NoticeEmailExtras = {},
): string {
  const shown = extras.inlineImage
    ? { src: `cid:${extras.inlineImage.contentId}`, alt: extras.inlineImage.alt }
    : extras.image
  const image = shown
    ? `<img src="${escapeHtml(shown.src)}" alt="${escapeHtml(shown.alt)}" width="480" style="display:block;width:100%;max-width:480px;height:auto;margin:0 0 24px;border:0;font-size:20px;font-weight:800;color:${INK}" />
          `
    : ''
  const secondary = extras.secondary
    ? `
          <p style="margin:16px 0 0;font-size:16px;line-height:1.5"><a href="${escapeHtml(extras.secondary.url)}" style="color:${INK};text-decoration:underline">${escapeHtml(extras.secondary.label)}</a></p>`
    : ''
  const lines = (extras.lines ?? [])
    .map(
      (line) => `
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5">${escapeHtml(line)}</p>`,
    )
    .join('')
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
  <body style="margin:0;padding:24px;background:${CANVAS};font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:${INK}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto">
      <tr>
        <td>
          ${image}<h1 style="margin:0 0 16px;font-size:25px;line-height:1.2;font-weight:800">${escapeHtml(texts.heading)}</h1>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5">${escapeHtml(texts.body)}</p>${lines}
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;background:${INK};color:${CANVAS};font-size:16px;font-weight:700;text-decoration:none">${escapeHtml(texts.button)}</a>${secondary}
          <p style="margin:24px 0 8px;font-size:14px;line-height:1.45;color:${INK_MUTED}">${escapeHtml(texts.fallback)}</p>
          <p style="margin:0;font-size:14px;line-height:1.45;word-break:break-all;color:${INK_MUTED}">${escapeHtml(url)}</p>
          <hr style="margin:32px 0 16px;border:0;border-top:1px solid ${LINE}" />
          <p style="margin:0;font-size:13px;line-height:1.4;color:${INK_MUTED}">${escapeHtml(texts.footer)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function renderNoticeText(
  texts: NoticeEmailTexts,
  url: string,
  extras: NoticeEmailExtras = {},
): string {
  const secondary = extras.secondary
    ? ['', `${extras.secondary.label}: ${extras.secondary.url}`]
    : []
  const lines = (extras.lines ?? []).flatMap((line) => [line, ''])
  return [texts.heading, '', texts.body, '', ...lines, url, ...secondary, '', texts.footer].join(
    '\n',
  )
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
