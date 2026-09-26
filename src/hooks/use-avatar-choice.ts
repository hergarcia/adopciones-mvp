'use client'

import { useState } from 'react'

// La foto que la persona eligió en el formulario del perfil: una nueva, quitar la que había, o nada.
// El error es de la foto y no del guardado: cada uno va debajo de su campo.
export function useAvatarChoice() {
  const [avatar, setAvatar] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  function pick(file: File) {
    setPhotoError(null)
    setAvatar(file)
    setRemoveAvatar(false)
  }

  function remove() {
    setPhotoError(null)
    setAvatar(null)
    setRemoveAvatar(true)
  }

  return { avatar, removeAvatar, photoError, pick, remove, fail: setPhotoError }
}
