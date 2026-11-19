export type TypedNumber = { typed: string; e164: string }

// Un celular por corrida, al azar: las pruebas comparten la base y cada número tiene su tope. Del 1
// al 7 en el segundo dígito: el seed usa +59898… y +59899…, y un número sembrado chocaría con la
// unicidad.
export function uniqueTypedNumber(): TypedNumber {
  const rest = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  const second = 1 + Math.floor(Math.random() * 7)
  return {
    typed: `09${second} ${rest.slice(0, 3)} ${rest.slice(3)}`,
    e164: `+5989${second}${rest}`,
  }
}
