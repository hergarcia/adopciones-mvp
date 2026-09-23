#!/usr/bin/env node
// El grupo de un número en el conteo por número (FR-021), para el remedio manual de KL-013: con él,
// quien opera libera el tope de un número que alguien dejó lleno a propósito.
//   node --env-file=.env.local scripts/phone-group.mjs 099123456
// Tiene que usar la misma clave que el servidor. La cuenta es la de `numberGroup` en
// src/lib/verification/code.ts: si cambia allá, cambia acá.
import { createHmac, hkdfSync } from 'node:crypto'

const input = process.argv[2] ?? ''
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY

const digits = input
  .replaceAll(/[\s.()-]/g, '')
  .replace(/^\+?598|^00598/, '')
  .replace(/^0/, '')
if (!/^9[1-9]\d{6}$/.test(digits)) {
  console.error('phone-group: pasá un celular uruguayo, por ejemplo 099123456.')
  process.exit(1)
}
if (!secret) {
  console.error('phone-group: falta SUPABASE_SERVICE_ROLE_KEY (node --env-file=.env.local …).')
  process.exit(1)
}

const key = Buffer.from(hkdfSync('sha256', secret, Buffer.alloc(0), 'phone-number', 32))
const group = createHmac('sha256', key).update(`+598${digits}`).digest().readUInt16BE(0) >> 1
console.log(`+598${digits} → grupo ${group}`)
console.log(`delete from public.phone_number_sends where number_digest = ${group};`)
