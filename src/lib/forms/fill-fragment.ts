// Un error de contacto cita lo que encontró: el texto trae `{fragment}` y el valor llega aparte,
// porque en el navegador no hay quien formatee ICU (FR-014 de la #53, FR-020 de la #12).
export function fillFragment(template: string, fragment?: string): string {
  return fragment === undefined ? template : template.replace('{fragment}', fragment)
}
