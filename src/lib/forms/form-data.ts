// Un campo de FormData puede ser un archivo: convertirlo con String() daría "[object File]" y el
// schema lo tomaría por un texto.
export function formText(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}
