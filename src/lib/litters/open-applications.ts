/** Las solicitudes abiertas de las crías de una camada: las que cierra borrarla entera (FR-035). */
export function openApplicationsOf(
  young: { id: string }[],
  byYoung: ReadonlyMap<string, number>,
): number {
  return young.reduce((sum, one) => sum + (byYoung.get(one.id) ?? 0), 0)
}
