// Covers: US2-AS2, FR-051, FR-054 (la plantilla de los correos: el compromiso en párrafos, el HTML
// escapado)
import { describe, expect, it } from 'vitest'
import { renderNoticeEmail, renderNoticeText } from './notice-email-template'

const TEXTS = {
  heading: 'El compromiso por <Tobi>',
  body: 'Ana & Rocío lo aceptaron.',
  button: 'Ver "el" compromiso',
  fallback: 'Si el botón no anda:',
  footer: 'Te escribimos.',
}
const URL = 'https://example.test/mis-solicitudes/1?a=1&b=2'
const EXTRAS = {
  image: { src: 'https://example.test/foto?x=1&y="2"', alt: 'Tobi <perro>' },
  secondary: { label: 'Otra <cosa>', url: 'https://example.test/otra?a&b' },
  lines: ['Ana se compromete a <cuidarlo>.', 'Rocío & Ana, de palabra.'],
}

describe('renderNoticeEmail', () => {
  it('sin extras: título, cuerpo, botón, la dirección escrita y el pie, escapados', () => {
    expect(renderNoticeEmail(TEXTS, URL, 'es')).toMatchInlineSnapshot(`
      "<!doctype html>
      <html lang="es">
        <body style="margin:0;padding:24px;background:#FFFFFF;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1F2D26">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto">
            <tr>
              <td>
                <h1 style="margin:0 0 16px;font-size:25px;line-height:1.2;font-weight:800">El compromiso por &lt;Tobi&gt;</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.5">Ana &amp; Rocío lo aceptaron.</p>
                <a href="https://example.test/mis-solicitudes/1?a=1&amp;b=2" style="display:inline-block;padding:14px 24px;background:#1F2D26;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none">Ver &quot;el&quot; compromiso</a>
                <p style="margin:24px 0 8px;font-size:14px;line-height:1.45;color:#5B6862">Si el botón no anda:</p>
                <p style="margin:0;font-size:14px;line-height:1.45;word-break:break-all;color:#5B6862">https://example.test/mis-solicitudes/1?a=1&amp;b=2</p>
                <hr style="margin:32px 0 16px;border:0;border-top:1px solid #DDD8CF" />
                <p style="margin:0;font-size:13px;line-height:1.4;color:#5B6862">Te escribimos.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>"
    `)
  })

  it('con la foto, el segundo enlace y los párrafos debajo del cuerpo, escapados', () => {
    expect(renderNoticeEmail(TEXTS, URL, 'es"x', EXTRAS)).toMatchInlineSnapshot(`
      "<!doctype html>
      <html lang="es&quot;x">
        <body style="margin:0;padding:24px;background:#FFFFFF;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1F2D26">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto">
            <tr>
              <td>
                <img src="https://example.test/foto?x=1&amp;y=&quot;2&quot;" alt="Tobi &lt;perro&gt;" width="480" style="display:block;width:100%;max-width:480px;height:auto;margin:0 0 24px;border:0;font-size:20px;font-weight:800;color:#1F2D26" />
                <h1 style="margin:0 0 16px;font-size:25px;line-height:1.2;font-weight:800">El compromiso por &lt;Tobi&gt;</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.5">Ana &amp; Rocío lo aceptaron.</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.5">Ana se compromete a &lt;cuidarlo&gt;.</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.5">Rocío &amp; Ana, de palabra.</p>
                <a href="https://example.test/mis-solicitudes/1?a=1&amp;b=2" style="display:inline-block;padding:14px 24px;background:#1F2D26;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none">Ver &quot;el&quot; compromiso</a>
                <p style="margin:16px 0 0;font-size:16px;line-height:1.5"><a href="https://example.test/otra?a&amp;b" style="color:#1F2D26;text-decoration:underline">Otra &lt;cosa&gt;</a></p>
                <p style="margin:24px 0 8px;font-size:14px;line-height:1.45;color:#5B6862">Si el botón no anda:</p>
                <p style="margin:0;font-size:14px;line-height:1.45;word-break:break-all;color:#5B6862">https://example.test/mis-solicitudes/1?a=1&amp;b=2</p>
                <hr style="margin:32px 0 16px;border:0;border-top:1px solid #DDD8CF" />
                <p style="margin:0;font-size:13px;line-height:1.4;color:#5B6862">Te escribimos.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>"
    `)
  })
})

describe('renderNoticeText', () => {
  it('sin extras', () => {
    expect(renderNoticeText(TEXTS, URL)).toMatchInlineSnapshot(`
      "El compromiso por <Tobi>

      Ana & Rocío lo aceptaron.

      https://example.test/mis-solicitudes/1?a=1&b=2

      Te escribimos."
    `)
  })

  it('con los párrafos antes de la dirección y el segundo enlace después', () => {
    expect(renderNoticeText(TEXTS, URL, EXTRAS)).toMatchInlineSnapshot(`
      "El compromiso por <Tobi>

      Ana & Rocío lo aceptaron.

      Ana se compromete a <cuidarlo>.

      Rocío & Ana, de palabra.

      https://example.test/mis-solicitudes/1?a=1&b=2

      Otra <cosa>: https://example.test/otra?a&b

      Te escribimos."
    `)
  })
})
