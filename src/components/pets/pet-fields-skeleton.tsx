import { Skeleton } from '@/components/ui/skeleton'
import { PET_FORM_COLUMNS } from './pet-form-layout'

const ROWS = ['a', 'b', 'c', 'd']
const COLUMNS = ['left', 'right']

export function PetFieldsSkeleton() {
  return (
    <div className={PET_FORM_COLUMNS}>
      {COLUMNS.map((column) => (
        <div key={column} className={column === 'right' ? 'hidden lg:block' : undefined}>
          <Skeleton className="h-6 w-32" />
          {ROWS.map((row) => (
            <Skeleton key={row} className="mt-6 h-11 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}
