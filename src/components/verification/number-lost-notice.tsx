type Props = {
  /** El texto ya trae el día. */
  texts: { stamp: string; text: string }
  /** El acceso a verificar, cuando el aviso es todo lo que hay en la sección. */
  children?: React.ReactNode
}

// «Sin verificar» es un estado, así que es un sello; en mate cocido, como «Sin confirmar», porque
// también le toca actuar a la persona. Nunca nada de la cuenta que se quedó con el número (FR-012).
export function NumberLostNotice({ texts, children }: Props) {
  return (
    <div className="flex flex-col items-start">
      <span className="sello text-sm text-warning">{texts.stamp}</span>
      <p className="mt-3 text-sm text-ink">{texts.text}</p>
      {children}
    </div>
  )
}
