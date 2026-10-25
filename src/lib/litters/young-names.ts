// Dos crías se llaman igual si solo difieren en mayúsculas o en espacios de los bordes (FR-008), la
// misma regla que `pets.name_key` en la base.
export function normalizeYoungName(name: string): string {
  return name.trim().toLocaleLowerCase('es')
}

/** El primer «Cría N» que ninguna otra cría usa (FR-007): después de quitar la 2, vuelve la 2. */
export function nextYoungName(names: readonly string[], named: (number: number) => string): string {
  const taken = new Set(names.map(normalizeYoungName))
  let number = 1
  while (taken.has(normalizeYoungName(named(number)))) number += 1
  return named(number)
}

/** Las posiciones de las crías que repiten el nombre de una anterior; la primera no se marca. */
export function repeatedYoungNames(names: readonly string[]): number[] {
  const seen = new Set<string>()
  return names.flatMap((name, index) => {
    const normalized = normalizeYoungName(name)
    if (normalized === '') return []
    if (seen.has(normalized)) return [index]
    seen.add(normalized)
    return []
  })
}
