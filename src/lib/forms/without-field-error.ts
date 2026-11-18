// La edad son dos valores en el formulario y un solo aviso.
const AGE_VALUES: ReadonlySet<string> = new Set(['ageValue', 'ageUnit'])

/**
 * Los avisos sin el del campo que se acaba de cambiar (#296): se va al tocarlo y se vuelve a revisar
 * al publicar o guardar. Sin aviso en ese campo devuelve el mismo objeto, y no se vuelve a dibujar.
 */
export function withoutFieldError<V>(
  errors: Partial<Record<string, V>>,
  value: string,
): Partial<Record<string, V>> {
  const field = AGE_VALUES.has(value) ? 'age' : value
  if (errors[field] === undefined) return errors
  return Object.fromEntries(Object.entries(errors).filter(([name]) => name !== field))
}
