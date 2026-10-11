// Las comprobaciones contra la nube imprimen Markdown para pegarlo tal cual en la historia.
const cell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')

export function markdownTable(header, rows) {
  const line = (cells) => `| ${cells.map(cell).join(' | ')} |`
  return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n')
}

export const uruguayNow = () =>
  new Date().toLocaleString('es-UY', { timeZone: 'America/Montevideo' })
