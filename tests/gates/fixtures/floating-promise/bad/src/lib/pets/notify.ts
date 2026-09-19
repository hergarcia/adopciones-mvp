async function send(petId: string): Promise<string> {
  return Promise.resolve(petId)
}

export function notify(petId: string) {
  send(petId)
}
