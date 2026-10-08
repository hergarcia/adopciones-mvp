import { getTranslations } from 'next-intl/server'
import { ContactReveal } from '@/components/applications/contact-reveal'
import { whatsappRoutePath } from '@/lib/applications/paths'
import type { Contact } from '@/lib/applications/types'
import { formatPhoneNumber } from '@/lib/verification/phone-number'

// El contacto de la otra persona en una solicitud, en las dos puntas (FR-012, FR-051): la base ya
// decidió si corresponde verlo; sin contacto no se dibuja nada (docs/10, `ContactReveal`). En una
// adopción con el contacto cortado, «El contacto ya no está disponible» (historia #67, FR-033).
export async function ApplicationContact({
  id,
  contact,
}: {
  id: string
  contact: Contact | null | 'unavailable'
}) {
  if (contact === null) return null
  const t = await getTranslations('applications.contact')
  const title = t('title')
  if (contact === 'unavailable') {
    return <ContactReveal kind="unavailable" texts={{ title, unavailable: t('unavailable') }} />
  }
  if (contact.phone === null) {
    return (
      <ContactReveal
        kind="no_phone"
        texts={{ title, name: contact.name, noPhone: t('no_phone', { name: contact.name }) }}
      />
    )
  }
  return (
    <ContactReveal
      kind="revealed"
      phone={formatPhoneNumber(contact.phone)}
      whatsappHref={whatsappRoutePath(id)}
      texts={{
        title,
        name: contact.name,
        phoneLabel: t('phone_label', { name: contact.name }),
        whatsapp: t('whatsapp'),
        hint: t('copy_hint'),
      }}
    />
  )
}
