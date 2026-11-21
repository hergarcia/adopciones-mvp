/** Cada renglón ya traducido, con el nombre del animal o de la camada adentro. */
export type ReplyLines = {
  hello: string
  inProcess: string
  steps: string
  identity: string
  contact: string
  invite: string
}

export type ReplySubject = {
  requiredLevel: 1 | 2
  inProcess: boolean
  url: string
}

// La respuesta que quien publicó pega en el chat (historia #250): no repite los datos del animal,
// explica el paso. La cédula se avisa antes, cuando el animal la pide, para que no aparezca a mitad
// de camino (docs/01 §Verificación = fricción).
export function replyText(lines: ReplyLines, subject: ReplySubject): string {
  const blocks = [
    [lines.hello, subject.inProcess ? lines.inProcess : null],
    [lines.steps, subject.requiredLevel === 2 ? lines.identity : null, lines.contact],
    [lines.invite, subject.url],
  ]
  return blocks.map((block) => block.filter((line) => line !== null).join('\n')).join('\n\n')
}
