// La forma de todo correo del producto: título, cuerpo, un botón a una dirección, la dirección
// escrita y una nota al pie.
export type NoticeEmailTexts = {
  heading: string
  body: string
  button: string
  fallback: string
  footer: string
}

// HTML con estilos en línea y tabla de una celda: es lo que entienden los clientes de correo, que
// no tienen hojas de estilo ni flexbox. Los colores son los tokens de docs/10 escritos a mano
// porque un correo no puede leer `globals.css`; son los únicos hexadecimales del producto fuera de
// esa hoja, y viven acá solos para que se vea que es una excepción con motivo.
const INK = '#1F2D26'
const INK_MUTED = '#5B6862'
const CANVAS = '#FFFFFF'
const LINE = '#DDD8CF'

export function renderNoticeEmail(texts: NoticeEmailTexts, url: string, lang: string): string {
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
  <body style="margin:0;padding:24px;background:${CANVAS};font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:${INK}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto">
      <tr>
        <td>
          <h1 style="margin:0 0 16px;font-size:25px;line-height:1.2;font-weight:800">${escapeHtml(texts.heading)}</h1>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5">${escapeHtml(texts.body)}</p>
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;background:${INK};color:${CANVAS};font-size:16px;font-weight:700;text-decoration:none">${escapeHtml(texts.button)}</a>
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

export function renderNoticeText(texts: NoticeEmailTexts, url: string): string {
  return [texts.heading, '', texts.body, '', url, '', texts.footer].join('\n')
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
