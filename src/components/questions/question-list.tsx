import { Card } from '@/components/ui/card'
import { CheckList } from '@/components/ui/check-list'
import { NumberedList } from '@/components/ui/numbered-list'
import type { QuestionListForm } from '@/lib/questions/pages'

export type QuestionListTexts = { form: QuestionListForm; items: string[] }

// Lo que se repasa, con la forma del cartel y no como párrafos sueltos: es lo que se manda por
// WhatsApp. Las señales de una estafa no tienen orden, así que no se numeran: van en una nota
// pegada, una por renglón, separadas por la línea.
export function QuestionList({ list }: { list: QuestionListTexts }) {
  if (list.form === 'numbered') return <NumberedList items={list.items} className="mt-2" />
  if (list.form === 'checks') return <CheckList items={list.items} />
  return (
    <Card taped className="mt-4">
      <ul className="flex flex-col divide-y-2 divide-line">
        {list.items.map((item) => (
          <li key={item} className="py-3 text-base font-bold text-ink first:pt-0 last:pb-0">
            {item}
          </li>
        ))}
      </ul>
    </Card>
  )
}
