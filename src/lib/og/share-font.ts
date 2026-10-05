import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

let font: Promise<Buffer> | undefined

// La voz de afiche de las imágenes de vista previa; se lee una vez por proceso.
export function shareFont(): Promise<Buffer> {
  font ??= readFile(join(process.cwd(), 'src/lib/og/BricolageGrotesque_Condensed-ExtraBold.ttf'))
  return font
}
