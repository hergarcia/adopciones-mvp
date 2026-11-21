#!/usr/bin/env node
// Busca las frases vigiladas en los textos del sitio y nombra la clave y la frase de cada una.
//   node scripts/copy/check-copy.mjs [messages/es.json]
import { readFileSync } from 'node:fs'
import { scanMessages } from './watched-phrases.mjs'

const file = process.argv[2] ?? 'messages/es.json'
const found = scanMessages(JSON.parse(readFileSync(file, 'utf8')))

for (const { key, pattern, phrase } of found)
  console.log(`${file} ${key}: «${phrase}» (${pattern})`)
if (found.length) {
  console.log(`\n${found.length} frase(s) vigilada(s). Reescribilas con el skill sin-slop.`)
  process.exit(1)
}
console.log(`${file}: sin frases vigiladas.`)
