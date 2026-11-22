'use client'

import { useState } from 'react'

// La foto que la persona eligió en el formulario del perfil: una nueva, quitar la que había, o nada.
// El error es de la foto y no del guardado: cada uno va debajo de su campo.
export function useAvatarChoice() {
  const [avatar, setAvatar] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  // Elegida y todavía preparándose: ya es un cambio, aunque lo que la prepara no haya llegado
  // (historia #340).
  const [isPreparing, setIsPreparing] = useState(false)

  function prepare() {
    setPhotoError(null)
    setIsPreparing(true)
  }

  function pick(file: File) {
    setPhotoError(null)
    setIsPreparing(false)
    setAvatar(file)
    setRemoveAvatar(false)
  }

  function remove() {
    setPhotoError(null)
    setAvatar(null)
    setRemoveAvatar(true)
  }

  function fail(message: string) {
    setIsPreparing(false)
    setPhotoError(message)
  }

  return { avatar, removeAvatar, isPreparing, photoError, prepare, pick, remove, fail }
}
