// Dos nombres son el mismo si solo difieren en mayúsculas, tildes o espacios del principio y el
// final (FR-017). Los de adentro cuentan, y la ñ no es una n: Peña y Pena son dos perros.
export function normalizePetName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replaceAll(/(ñ)|\p{Mn}/gu, (_mark, enie: string | undefined) => enie ?? '')
    .normalize('NFC')
}
