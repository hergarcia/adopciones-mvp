async function send(petId: string): Promise<string> {
  return Promise.resolve(petId)
}

export async function notify(petId: string) {
  await send(petId)
}
