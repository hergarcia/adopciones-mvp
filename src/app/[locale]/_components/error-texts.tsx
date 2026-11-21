'use client'

import { createContext, useContext } from 'react'
import type { MessageKeys, Messages, NamespaceKeys, NestedKeyOf, NestedValueOf } from 'next-intl'

type Namespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>
type KeyOf<N extends Namespace> = MessageKeys<
  NestedValueOf<Messages, N>,
  NestedKeyOf<NestedValueOf<Messages, N>>
>

/** Ya traducidos, por la clave entera: `pets.my_pets.retry`. */
export type ErrorTexts = Readonly<Record<string, string>>

const Texts = createContext<ErrorTexts>({})

export function ErrorTextsContext({
  texts,
  children,
}: {
  texts: ErrorTexts
  children: React.ReactNode
}) {
  return <Texts value={texts}>{children}</Texts>
}

/**
 * Los textos de un límite de error con sesión, con las claves tipadas como las de next-intl. Sin el
 * runtime de next-intl en el navegador: pesaba 13 KB en cada pantalla con sesión (historia #304).
 * Una clave que no viajó se ve como su ruta, igual que la mostraba next-intl.
 */
export function useErrorTexts<N extends Namespace>(namespace: N): (key: KeyOf<N>) => string {
  const texts = useContext(Texts)
  return (key) => {
    const path = `${namespace}.${key}`
    return texts[path] ?? path
  }
}
