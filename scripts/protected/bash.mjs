// Qué archivos protegidos escribiría un comando de Bash, a ojo. Atrapa el atajo común (sed -i,
// una redirección, prettier --write); lo que se le escape lo frena el hook al hacer commit, y en
// último lugar el check de CI.
import { ruleFor } from './rules.mjs'

// Sin `git checkout` ni `git restore`: devolver un archivo a HEAD es deshacer un cambio, y lo que
// traigan de otro lado lo ve el freno del commit.
const WRITES =
  /\b(sed\s+(-\w+\s+)*-i|perl\s+-\w*i|tee|mv|cp|rm|touch|truncate|git\s+(mv|rm))\b|--write\b|--fix\b|\b(Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item|New-Item)\b|writeFile/i
const REDIRECT = />{1,2}\s*("[^"]+"|'[^']+'|[^\s;&|]+)/g
const QUOTED = /"[^"]*"|'[^']*'/g
const SEGMENTS = /&&|\|\||;|\n/
const COMMIT = /^\s*git\s+((-C|-c)\s+("[^"]+"|'[^']+'|\S+)\s+|--[\w-]+(=\S+)?\s+)*commit\b/

// Git Bash escribe C:\x como /c/x.
const slashed = (path) => path.replaceAll('\\', '/').replace(/^\/([a-z])\//i, '$1:/')
const unquoted = (token) => token.replace(/^["']|["']$/g, '')

function relative(token, root) {
  const t = slashed(unquoted(token))
  const r = slashed(root).replace(/\/?$/, '/')
  return t.toLowerCase().startsWith(r.toLowerCase()) ? t.slice(r.length) : t
}

const isProtected = (token, root) => ruleFor(relative(token, root)) !== undefined

export function protectedWrites(command, root) {
  const hits = new Set()
  for (const segment of command.split(SEGMENTS)) {
    for (const [, target] of segment.matchAll(REDIRECT)) {
      if (isProtected(target, root)) hits.add(relative(target, root))
    }
    // Un patrón de búsqueda entre comillas (`grep "rm -rf"`) no es un comando que escribe.
    if (!WRITES.test(segment.replace(QUOTED, ''))) continue
    for (const token of segment.split(/\s+/)) {
      if (token && isProtected(token, root)) hits.add(relative(token, root))
    }
  }
  return [...hits]
}

// El directorio donde corre el commit ('' si es el actual), o null si el comando no hace commit.
export function commitDir(command) {
  for (const segment of command.split(SEGMENTS)) {
    const match = COMMIT.exec(segment)
    if (!match) continue
    const dir = /(?:^|\s)-C\s+("[^"]+"|'[^']+'|\S+)/.exec(match[0])
    return dir ? unquoted(dir[1]) : ''
  }
  return null
}
