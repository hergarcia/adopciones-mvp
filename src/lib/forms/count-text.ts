/** Una cuenta con sus dos formas, con `{count}` en la de plural: la elige el navegador. */
export type CountForms = { one: string; many: string }

// Aparte del contador: las fotos dicen cuántas no entraron y el formulario las dibuja al abrir, sin
// el contador, que llega con los campos (historia #338).
export function countText(count: number, forms: CountForms): string {
  return count === 1 ? forms.one : forms.many.replace('{count}', String(count))
}
