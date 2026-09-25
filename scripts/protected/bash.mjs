// Qué archivos protegidos escribiría un comando de Bash, a ojo. Atrapa el atajo común (sed -i,
// una redirección, prettier --write); lo que se le escape lo frena el hook al hacer commit, y en
// último lugar el check de CI.
import { ruleFor } from './rules.mjs'

const WRITES =
  /\b(sed\s+(-\w+\s+)*-i|perl\s+-\w*i|tee|mv|cp|rm|touch|truncate|git\s+(mv|rm|checkout|restore))\b|--write\b|--fix\b|\b(Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item|New-Item)\b|writeFile/i
const REDIRECT = />{1,2}\s*("[^"]+"|'[^']+'|[^\s;&|]+)/g

// Git Bash escribe C:\x como /c/x.
const slashed = (path) => path.replaceAll('\\', '/').replace(/^\/([a-z])\//i, '$1:/')

function relative(token, root) {
  const t = slashed(token.replace(/^["']|["']$/g, ''))
  const r = slashed(root).replace(/\/?$/, '/')
  return t.toLowerCase().startsWith(r.toLowerCase()) ? t.slice(r.length) : t
}

const isProtected = (token, root) => ruleFor(relative(token, root)) !== undefined

export function protectedWrites(command, root) {
  const hits = new Set()
  for (const segment of command.split(/&&|\|\||;|\n/)) {
    for (const [, target] of segment.matchAll(REDIRECT)) {
      if (isProtected(target, root)) hits.add(relative(target, root))
    }
    if (!WRITES.test(segment)) continue
    for (const token of segment.split(/\s+/)) {
      if (token && isProtected(token, root)) hits.add(relative(token, root))
    }
  }
  return [...hits]
}

export const isCommit = (command) =>
  command.split(/&&|\|\||;|\n/).some((segment) => /^\s*git\s+commit\b/.test(segment))
