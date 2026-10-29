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

// Covers: US2-AS1 (historia #69, research R8: la primera foto adentro del correo, por su cid)
describe('renderNoticeEmail con inlineImage', () => {
  const inlineImage = {
    contentId: 'seguimiento-"1"',
    alt: 'Tobi <perro>',
    filename: 'tobi.jpg',
    content: Buffer.from([1, 2, 3]),
  }

  it('la imagen apunta al cid, escapado, con su alt, y gana sobre la de URL', () => {
    const html = renderNoticeEmail(TEXTS, URL, 'es', { image: EXTRAS.image, inlineImage })
    expect(html).toContain(
      '<img src="cid:seguimiento-&quot;1&quot;" alt="Tobi &lt;perro&gt;" width="480"',
    )
    expect(html).not.toContain('example.test/foto')
    expect(html.match(/<img /gu)).toHaveLength(1)
  })

  it('el texto plano no la nombra', () => {
    expect(renderNoticeText(TEXTS, URL, { inlineImage })).toBe(renderNoticeText(TEXTS, URL))
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

// Covers: US2-AS1, US2-AS9, FR-018, FR-020 (historia #265: una parte por aviso, cada animal con su
// foto, su nombre y su zona, que abre su ficha, y el enlace al listado; todo escapado)
describe('los grupos del correo de avisos', () => {
  const GROUPS = [
    {
      title: 'Perros <chicos> en Montevideo',
      items: [
        {
          href: 'https://example.test/animales/abc?desde=aviso&x="1"',
          image: { src: 'https://example.test/animales/abc/imagen?v=1&w=2', alt: 'Foto de <Tobi>' },
          name: 'Tobi & Cía',
          detail: 'Perro macho, 2 años',
          zone: 'Pocitos, <Montevideo>',
        },
        {
          href: 'https://example.test/camadas/def?desde=aviso',
          image: { src: 'https://example.test/camadas/def/imagen?v=3', alt: 'Foto de la camada' },
          name: 'La camada de Rita',
          detail: 'Camada de perros, 5 crías',
          zone: 'Cerro, Montevideo',
        },
      ],
      more: { label: 'Ver todos <en> el listado', url: 'https://example.test/animales?a=1&b=2' },
    },
    {
      title: 'Gatos',
      items: [
        {
          href: 'https://example.test/animales/ghi?desde=aviso',
          image: { src: 'https://example.test/g.png', alt: 'Foto de Mishi' },
          name: 'Mishi',
          detail: 'Gata, 3 meses',
          zone: 'Salto',
        },
      ],
      more: { label: 'Ver todos en el listado', url: 'https://example.test/animales?especie=gato' },
    },
  ]

  it('van debajo del cuerpo y antes del botón, con cada renglón abriendo su ficha', () => {
    const html = renderNoticeEmail(TEXTS, URL, 'es', { groups: GROUPS })
    const between = html.slice(html.indexOf('lo aceptaron.</p>'), html.indexOf('padding:14px 24px'))
    expect(between).toMatchInlineSnapshot(`
      "lo aceptaron.</p>
                <h2 style="margin:8px 0 16px;font-size:18px;line-height:1.3;font-weight:800">Perros &lt;chicos&gt; en Montevideo</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">
                  <tr>
                    <td width="96" style="width:96px;padding:0 16px 0 0;vertical-align:top"><a href="https://example.test/animales/abc?desde=aviso&amp;x=&quot;1&quot;"><img src="https://example.test/animales/abc/imagen?v=1&amp;w=2" alt="Foto de &lt;Tobi&gt;" width="96" style="display:block;width:96px;height:auto;border:0;font-size:13px;color:#5B6862" /></a></td>
                    <td style="vertical-align:top;font-size:16px;line-height:1.4"><a href="https://example.test/animales/abc?desde=aviso&amp;x=&quot;1&quot;" style="color:#1F2D26;font-weight:700;text-decoration:underline">Tobi &amp; Cía</a><br /><span style="font-size:14px;color:#1F2D26">Perro macho, 2 años</span><br /><span style="font-size:14px;color:#5B6862">Pocitos, &lt;Montevideo&gt;</span></td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">
                  <tr>
                    <td width="96" style="width:96px;padding:0 16px 0 0;vertical-align:top"><a href="https://example.test/camadas/def?desde=aviso"><img src="https://example.test/camadas/def/imagen?v=3" alt="Foto de la camada" width="96" style="display:block;width:96px;height:auto;border:0;font-size:13px;color:#5B6862" /></a></td>
                    <td style="vertical-align:top;font-size:16px;line-height:1.4"><a href="https://example.test/camadas/def?desde=aviso" style="color:#1F2D26;font-weight:700;text-decoration:underline">La camada de Rita</a><br /><span style="font-size:14px;color:#1F2D26">Camada de perros, 5 crías</span><br /><span style="font-size:14px;color:#5B6862">Cerro, Montevideo</span></td>
                  </tr>
                </table>
                <p style="margin:0 0 32px;font-size:16px;line-height:1.5"><a href="https://example.test/animales?a=1&amp;b=2" style="color:#1F2D26;text-decoration:underline">Ver todos &lt;en&gt; el listado</a></p>
                <h2 style="margin:8px 0 16px;font-size:18px;line-height:1.3;font-weight:800">Gatos</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">
                  <tr>
                    <td width="96" style="width:96px;padding:0 16px 0 0;vertical-align:top"><a href="https://example.test/animales/ghi?desde=aviso"><img src="https://example.test/g.png" alt="Foto de Mishi" width="96" style="display:block;width:96px;height:auto;border:0;font-size:13px;color:#5B6862" /></a></td>
                    <td style="vertical-align:top;font-size:16px;line-height:1.4"><a href="https://example.test/animales/ghi?desde=aviso" style="color:#1F2D26;font-weight:700;text-decoration:underline">Mishi</a><br /><span style="font-size:14px;color:#1F2D26">Gata, 3 meses</span><br /><span style="font-size:14px;color:#5B6862">Salto</span></td>
                  </tr>
                </table>
                <p style="margin:0 0 32px;font-size:16px;line-height:1.5"><a href="https://example.test/animales?especie=gato" style="color:#1F2D26;text-decoration:underline">Ver todos en el listado</a></p>
                <a href="https://example.test/mis-solicitudes/1?a=1&amp;b=2" style="display:inline-block;"
    `)
  })

  it('la versión de texto lleva lo mismo en renglones, antes de la dirección del botón', () => {
    expect(renderNoticeText(TEXTS, URL, { groups: GROUPS, secondary: EXTRAS.secondary }))
      .toMatchInlineSnapshot(`
      "El compromiso por <Tobi>

      Ana & Rocío lo aceptaron.

      Perros <chicos> en Montevideo

      Tobi & Cía
      Perro macho, 2 años
      Pocitos, <Montevideo>
      https://example.test/animales/abc?desde=aviso&x="1"

      La camada de Rita
      Camada de perros, 5 crías
      Cerro, Montevideo
      https://example.test/camadas/def?desde=aviso

      Ver todos <en> el listado: https://example.test/animales?a=1&b=2

      Gatos

      Mishi
      Gata, 3 meses
      Salto
      https://example.test/animales/ghi?desde=aviso

      Ver todos en el listado: https://example.test/animales?especie=gato

      https://example.test/mis-solicitudes/1?a=1&b=2

      Otra <cosa>: https://example.test/otra?a&b

      Te escribimos."
    `)
  })

  it('sin grupos, el correo queda como siempre', () => {
    expect(renderNoticeEmail(TEXTS, URL, 'es', { groups: [] })).toBe(
      renderNoticeEmail(TEXTS, URL, 'es'),
    )
    expect(renderNoticeText(TEXTS, URL, { groups: [] })).toBe(renderNoticeText(TEXTS, URL))
  })
})
