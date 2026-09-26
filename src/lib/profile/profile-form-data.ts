type ProfileFields = {
  displayName: string
  department: string
  locality: string
  isRescuer: boolean
}

type Extras = {
  avatar: File | null
  removeAvatar: boolean
  next?: string
}

// Lo que viaja a `saveProfile`, armado cada vez desde lo que está en pantalla (FR-004).
export function profileFormData(values: ProfileFields, extras: Extras): FormData {
  const form = new FormData()
  form.set('displayName', values.displayName)
  form.set('department', values.department)
  form.set('locality', values.locality)
  form.set('isRescuer', String(values.isRescuer))
  form.set('removeAvatar', String(extras.removeAvatar))
  if (extras.next) form.set('next', extras.next)
  if (extras.avatar) form.set('avatar', extras.avatar)
  return form
}
