import { BRAND_MARK_BOX, BrandMark, SIGNATURE } from '@/components/ui/brand-mark'
import { OG_PALETTE } from '@/lib/og/palette'
import { SHARE_FONT } from '@/lib/og/share-image'
import { SHARE_LAYOUT } from '@/lib/og/share-layout'

type Props = {
  siteName: string
  phrase: string
  /** «Se busca hogar», ya traducido. */
  tagline: string
}

// La vista previa de la portada (research R5): el cartel sin foto, porque la dirección del sitio no
// es de ningún animal ni de ninguna persona (FR-025). La firma y la frase en tinta a la izquierda; a
// la derecha la tira pegada con cinta. Estilos en línea porque `ImageResponse` no lee clases; las
// medidas son de la imagen, no de la escala de la pantalla.
export function SiteShareImage({ siteName, phrase, tagline }: Props) {
  const { margin, inset } = SHARE_LAYOUT

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: `${inset}px ${margin}px`,
        background: OG_PALETTE.canvas,
        color: OG_PALETTE.ink,
        fontFamily: SHARE_FONT,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: 600, gap: 32 }}>
        <Signature siteName={siteName} />
        <span style={{ fontSize: 44, lineHeight: 1.1 }}>{phrase}</span>
      </div>
      <TapedStrip label={tagline} />
    </div>
  )
}

// La firma a la escala de la imagen, con las medidas de `.firma` (docs/10 §Marca). Centrarla en la
// caja del nombre es centrarla en las mayúsculas: con interlínea 0,95, la mitad del renglón de esta
// fuente cae a media altura de ellas. Va la compacta porque la miniatura de un chat achica la imagen
// a un cuarto: la pata llega a unos 28 px.
const NAME_SIZE = 96
const MARK_HEIGHT = NAME_SIZE * SIGNATURE.markEm
const MARK_WIDTH = (MARK_HEIGHT * BRAND_MARK_BOX.width) / BRAND_MARK_BOX.height

function Signature({ siteName }: { siteName: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: NAME_SIZE * SIGNATURE.gapEm }}>
      <BrandMark version="compacta" fill={OG_PALETTE.ink} width={MARK_WIDTH} height={MARK_HEIGHT} />
      <span style={{ fontSize: NAME_SIZE, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
        {siteName}
      </span>
    </div>
  )
}

// `.cinta` a la escala de la imagen: un solo gesto, el trozo arriba al centro girado `--tilt-torn`.
// El bloque va derecho y sin perforado: «Se busca hogar» se lee, y no es una acción (docs/10
// §Recursos del cartel).
function TapedStrip({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', position: 'relative', width: 420 }}>
      <span
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          padding: '48px 32px',
          background: OG_PALETTE.ink,
          color: OG_PALETTE.canvas,
          fontSize: 72,
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
      <div
        style={{
          position: 'absolute',
          top: -16,
          left: 170,
          width: 80,
          height: 32,
          background: OG_PALETTE.tape,
          transform: 'rotate(2deg)',
        }}
      />
    </div>
  )
}
