// Lo escrito y no guardado del alta, en este navegador y atado a la cuenta que lo escribió. El dueño
// es el id interno de la cuenta, que ese navegador ya tiene en su sesión: no es el correo ni el
// nombre (FR-016). La foto no entra nunca (FR-015).
export type DraftValues = {
  displayName: string
  department: string
  locality: string
  isRescuer: boolean
}

const TEXT_FIELDS = ['displayName', 'department', 'locality'] as const

export function serializeDraft(owner: string, values: DraftValues): string {
  const { displayName, department, locality, isRescuer } = values
  return JSON.stringify({ owner, values: { displayName, department, locality, isRescuer } })
}

function parse(raw: string): unknown {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Roto: queda sin nada adentro, ni dueño ni valores.
  }
  return parsed
}

function field(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined
}

// Un borrador roto, de la forma vieja (sin dueño) o de otra cuenta se trata igual: no es de quien
// está mirando, y lo que haya adentro no se muestra.
export function isForeignDraft(raw: string | null, owner: string): boolean {
  if (raw === null) return false
  return field(parse(raw), 'owner') !== owner
}

export function readDraft<T extends DraftValues>(
  raw: string | null,
  owner: string,
  initial: T,
): { values: T; discard: boolean } {
  // Stryker disable next-line ConditionalExpression: equivalente — sin este atajo, null sigue el
  // camino general (no es ajeno, JSON.parse(null) no tiene valores) y termina en lo mismo.
  if (raw === null) return { values: initial, discard: false }
  if (isForeignDraft(raw, owner)) return { values: initial, discard: true }

  const saved = field(parse(raw), 'values')
  const values = { ...initial }
  // Un campo vacío del borrador no pisa lo que trae la pantalla: quien empezó por correo y vuelve
  // por Google encontraría vacío el nombre que Google le sugiere.
  for (const name of TEXT_FIELDS) {
    const value = field(saved, name)
    if (typeof value === 'string' && value !== '') values[name] = value
  }
  const isRescuer = field(saved, 'isRescuer')
  if (typeof isRescuer === 'boolean') values.isRescuer = isRescuer
  return { values, discard: false }
}
