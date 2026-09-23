// El alfabeto GSM-7: con él un mensaje de texto lleva 160 caracteres. Una sola letra de afuera —la
// á, la í, la ó, la ú— pasa el mensaje entero a UCS-2, donde entran 70, y un texto de cien
// caracteres pasa a costar dos mensajes (FR-009).
const GSM_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
// Estos entran, pero ocupan dos lugares: van precedidos de un carácter de escape.
const GSM_EXTENDED = '^{}\\[~]|€\f'

const GSM_SINGLE = 160
const GSM_PART = 153
const UCS2_SINGLE = 70
const UCS2_PART = 67

export function smsSegments(text: string): number {
  let gsmLength = 0
  for (const char of text) {
    if (GSM_BASIC.includes(char)) gsmLength += 1
    else if (GSM_EXTENDED.includes(char)) gsmLength += 2
    else return partsFor(text.length, UCS2_SINGLE, UCS2_PART)
  }
  return partsFor(gsmLength, GSM_SINGLE, GSM_PART)
}

function partsFor(length: number, single: number, part: number): number {
  return length <= single ? 1 : Math.ceil(length / part)
}
