// Qué cambios no necesitan la base, la mutación ni el e2e del CI: texto que ninguna prueba de
// esos trabajos lee. Lint, formato, la aprobación de reglas y las pruebas `unit` y `gates` corren
// igual, porque las compuertas sí leen docs/ (la paridad de tokens con docs/10, entre otras).

const TEXT = [
  /^docs\//,
  /^specs\//,
  /^\.specify\//,
  // Las instrucciones del pipeline; los hooks de .claude/hooks/ son código y tienen pruebas.
  /^\.claude\/(agents|skills|workflows)\//,
  /\.md$/,
]

/** @param {string[]} changed archivos cambiados respecto de la base, con `/` */
export const touchesCode = (changed) =>
  changed.length === 0 || changed.some((file) => !TEXT.some((re) => re.test(file)))
