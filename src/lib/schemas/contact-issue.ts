import type { z } from 'zod'
import { contactMatch } from '@/lib/contact/contact-match'

// La regla de contacto como refinamiento de zod, con el fragmento en `params` para que el error lo
// cite. La comparten la ficha y el perfil; cada uno pone su prefijo, porque el texto es suyo.
export function addContactIssue(prefix: string, value: string, ctx: z.RefinementCtx): boolean {
  const contact = contactMatch(value)
  if (contact === null) return false
  ctx.addIssue({
    // Stryker disable next-line StringLiteral: equivalente — el tipo lo exige, pero `toFieldError` lee solo `message` y `params`, y zod guarda los dos con cualquier código
    code: 'custom',
    message: `${prefix}${contact.kind}`,
    params: { fragment: contact.fragment },
  })
  return true
}
